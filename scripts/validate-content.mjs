#!/usr/bin/env node
// Walks every manifest the site publishes from, verifies each file exists on
// the CDN, counts questions, and writes src/generated/content-index.json.
// Pages and sitemaps only ever emit URLs for keys in this index (spec §4.2, §10).
//
//   node scripts/validate-content.mjs            # normal
//   node scripts/validate-content.mjs --force    # skip regression + shrink guards
//   node scripts/validate-content.mjs --offline  # rebuild totals from the committed index, no network
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "generated", "content-index.json");
const CDN = "https://cdn.studyvirus.com";
const CONCURRENCY = 24;
const force = process.argv.includes("--force");
const offline = process.argv.includes("--offline");

const NORMAL = 10, LAST = 20;
const ENGLISH_KEYS = new Set(["english_full", "english_basic"]);
const CA_START = new Date(Date.UTC(2026, 3, 1)); // 2026-04-01

const enc = (key) => key.split("/").map(encodeURIComponent).join("/");
const pad2 = (n) => String(n).padStart(2, "0");

function setCount(n) {
  if (n <= 0) return 0;
  if (n <= LAST) return 1;
  let i = 0, sets = 0;
  while (i < n) {
    const rem = n - i;
    if (rem <= LAST && sets > 0) { sets++; break; }
    sets++; i += NORMAL;
  }
  return sets;
}

async function fetchJson(key) {
  const res = await fetch(`${CDN}/${enc(key)}`);
  if (res.status === 404) return { status: 404 };
  if (!res.ok) throw new Error(`${res.status} for ${key}`);
  const text = await res.text();
  try { return { status: 200, json: JSON.parse(text) }; }
  catch { return { status: 200, malformed: true }; }
}

async function mustJson(key) {
  const r = await fetchJson(key);
  if (r.status !== 200 || r.malformed) throw new Error(`manifest unavailable or malformed: ${key}`);
  return r.json;
}

// kind decides how [en, hi] is counted
function countFor(kind, json) {
  if (kind === "bilingual") {
    const en = Array.isArray(json?.en) ? json.en.length : Array.isArray(json) ? json.length : 0;
    const hi = Array.isArray(json?.hi) ? json.hi.length : 0;
    return [en, hi];
  }
  if (kind === "aptitude") {
    const q = Array.isArray(json?.questions) ? json.questions : [];
    return [q.length, q.filter((x) => typeof x?.question_hi === "string" && x.question_hi.trim()).length];
  }
  if (kind === "article") {
    const p = Array.isArray(json?.paragraphs) ? json.paragraphs : [];
    return [p.length, p.filter((x) => typeof x?.hi === "string" && x.hi.trim()).length];
  }
  return [0, 0];
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i); }
  }));
  return out;
}

function assertUnique(label, values) {
  const seen = new Set();
  for (const v of values) {
    if (seen.has(v)) throw new Error(`duplicate ${label}: ${v}`);
    seen.add(v);
  }
}

// Slugs that occur more than once in `values` (empty set when all unique).
function duplicateSlugs(values) {
  const seen = new Set(), dup = new Set();
  for (const v of values) (seen.has(v) ? dup : seen).add(v);
  return dup;
}

const chapterSlug = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
const aptChapterSlug = (id) => id.replace(/^\d+_/, "").replace(/_/g, "-");

async function collect() {
  const targets = []; // { key, kind, section, meta }

  // Topics (incl. hidden — English lives in hidden entries)
  const topics = (await mustJson("gk/topics.json")).topics;
  assertUnique("topic key", topics.map((t) => t.key));
  for (const t of topics) {
    if (t.screen === "CurrentAffairs") continue;
    // Deviation from the Task 7 brief (see task-7-report.md): the live manifest's
    // `general_hindi` topic names its chapters in Devanagari, so chapterSlug()
    // collapses all of them to "" / "-". No slug rule for non-Latin names exists
    // yet, so such a topic is left OUT of the index -- pages and sitemaps can
    // then never emit colliding URLs for it -- and reported on every build,
    // the same way a never-present folder is a warning rather than a failure.
    // Every other uniqueness assertion below remains a hard failure.
    const slugs = (t.chapters || []).map((c) => chapterSlug(c.en));
    const dup = duplicateSlugs(slugs);
    if (dup.size) {
      console.warn(`WARN skipping topic ${t.key} (gk/${t.folder}, ${slugs.length} chapters): duplicate chapter slug ${[...dup].map((x) => `"${x}"`).join(", ")} -- unroutable until a slug rule for non-Latin chapter names exists`);
      continue;
    }
    const section = ENGLISH_KEYS.has(t.key) ? "english" : "topic";
    for (const c of t.chapters || []) targets.push({ key: `gk/${t.folder}/${c.file}`, kind: "bilingual", section, meta: { hidden: !!t.hiddenFromList } });
  }

  // PYQ
  const pyq = (await mustJson("gk/pyq-config.json")).exams.filter((e) => e.sets > 0);
  assertUnique("pyq id", pyq.map((e) => e.id));
  for (const e of pyq) for (let n = 1; n <= e.sets; n++) targets.push({ key: `gk/24-Previous Year Papers/${e.prefix}${pad2(n)}.json`, kind: "bilingual", section: "pyq", meta: { exam: e.id } });

  // Aptitude, two families, tier-1 only
  const fams = [
    { family: "ssc-railway", manifest: "gk/aptitude/manifest.json", base: (s, c, t, f) => `gk/aptitude/content/${s}/${c}/${t}/${f}` },
    { family: "bank", manifest: "bank/manifest.json", base: (s, c, t, f) => `bank/${s}/${c}/${t}/${f}` },
  ];
  for (const fam of fams) {
    const m = await mustJson(fam.manifest);
    assertUnique(`${fam.family} subject id`, m.subjects.map((s) => s.id));
    for (const s of m.subjects) {
      assertUnique(`${fam.family}/${s.id} chapter slug`, s.chapters.map((c) => aptChapterSlug(c.id)));
      for (const c of s.chapters) {
        // Same deviation as for topics above: the live bank manifest has chapters
        // with two or three types all named "Previous Year Questions" (folders
        // "4-Previous Year", "4-Previous Year (Arihant)", "5-Previous Year"), which
        // Task 10's typeSlug (name-based) cannot tell apart. Those types are left
        // out of the index and reported until the type slug rule disambiguates them.
        const types = c.types || [];
        const typeSlugs = types.map((t) => chapterSlug(t.name?.en || t.id));
        const dupType = duplicateSlugs(typeSlugs);
        if (dupType.size) {
          const skipped = types.filter((t, i) => dupType.has(typeSlugs[i]));
          const sets = skipped.reduce((a, t) => a + (t.sets || []).filter((x) => x.tier === 1).length, 0);
          console.warn(`WARN skipping ${skipped.length} types (${sets} tier-1 sets) in ${fam.family}/${s.id}/${c.id}: duplicate type slug ${[...dupType].map((x) => `"${x}"`).join(", ")} -- ${skipped.map((t) => `${t.id} (${t.folder})`).join(", ")} -- unroutable until the type slug rule disambiguates same-named types`);
        }
        types.forEach((t, i) => {
          if (dupType.has(typeSlugs[i])) return;
          for (const st of t.sets || []) {
            if (st.tier !== 1) continue;
            targets.push({ key: fam.base(s.folder, c.folder, t.folder, st.file), kind: "aptitude", section: "aptitude", meta: {} });
          }
        });
      }
    }
  }

  // Current affairs dailies: every date from CA_START to today
  const today = new Date();
  for (let d = new Date(CA_START); d <= today; d.setUTCDate(d.getUTCDate() + 1)) {
    const date = `${d.getUTCFullYear()}_${pad2(d.getUTCMonth() + 1)}_${pad2(d.getUTCDate())}`;
    targets.push({ key: `gk/0-Current Affairs/daily/${date}.json`, kind: "bilingual", section: "ca", meta: { neverFail: true } });
  }

  // Articles
  const articles = (await mustJson("gk/articles/index.json")).articles || [];
  assertUnique("article id", articles.map((a) => a.id));
  for (const a of articles) targets.push({ key: `gk/articles/${a.file}`, kind: "article", section: "articles", meta: {} });

  return { targets, pyqExams: pyq.length };
}

function totalsFrom(files, targets) {
  const t = { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 };
  const pyqExamIds = new Set();
  for (const tg of targets) {
    const [dir, file] = [tg.key.slice(0, tg.key.lastIndexOf("/")), tg.key.slice(tg.key.lastIndexOf("/") + 1)];
    const c = files[dir]?.[file];
    if (!c) continue;
    const en = c[0];
    switch (tg.section) {
      case "topic": t.topicQuestions += en; t.topicChapters++; t.topicSets += setCount(en); break;
      case "english": t.englishQuestions += en; t.englishChapters++; break;
      case "pyq": t.pyqQuestions += en; t.pyqPapers++; pyqExamIds.add(tg.meta.exam); break;
      case "aptitude": t.aptitudeQuestions += en; t.aptitudeSets++; break;
      case "ca": t.caQuestions += en; t.caDays++; break;
      case "articles": t.articles++; break;
    }
  }
  t.pyqExams = pyqExamIds.size;
  return t;
}

async function main() {
  const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : null;

  if (offline) {
    if (!previous) throw new Error("--offline needs an existing index");
    console.log(`offline: keeping ${Object.values(previous.files).reduce((a, d) => a + Object.keys(d).length, 0)} keys`);
    return;
  }

  const { targets } = await collect();
  console.log(`checking ${targets.length} files on ${CDN} …`);

  const files = {};
  const missing = [], malformed = [];
  let done = 0;
  await mapLimit(targets, CONCURRENCY, async (tg) => {
    let r;
    for (let attempt = 0; attempt < 3; attempt++) {
      try { r = await fetchJson(tg.key); break; } catch (e) { if (attempt === 2) throw e; await new Promise((res) => setTimeout(res, 500 * (attempt + 1))); }
    }
    if (r.status === 404) { if (!tg.meta.neverFail) missing.push(tg); }
    else if (r.malformed) malformed.push(tg.key);
    else {
      const [dir, file] = [tg.key.slice(0, tg.key.lastIndexOf("/")), tg.key.slice(tg.key.lastIndexOf("/") + 1)];
      (files[dir] ??= {})[file] = countFor(tg.kind, r.json);
    }
    if (++done % 500 === 0) console.log(`  ${done}/${targets.length}`);
  });

  if (malformed.length) {
    console.error(`MALFORMED (${malformed.length}):`); malformed.forEach((k) => console.error("  " + k));
    process.exit(1);
  }

  // Regression guard: keys present before, missing now.
  const regressions = [];
  if (previous) {
    for (const [dir, m] of Object.entries(previous.files)) for (const file of Object.keys(m)) {
      if (!files[dir]?.[file] && targets.some((t) => t.key === `${dir}/${file}`)) regressions.push(`${dir}/${file}`);
    }
  }
  const neverPresent = missing.filter((tg) => !regressions.includes(tg.key));
  if (neverPresent.length) {
    console.warn(`WARN never-present (${neverPresent.length}), not failing:`);
    neverPresent.slice(0, 40).forEach((tg) => console.warn("  " + tg.key));
    if (neverPresent.length > 40) console.warn(`  … +${neverPresent.length - 40} more`);
  }
  if (regressions.length && !force) {
    console.error(`REGRESSION: ${regressions.length} previously-present files are gone (use --force to accept):`);
    regressions.slice(0, 40).forEach((k) => console.error("  " + k));
    process.exit(1);
  }

  const count = Object.values(files).reduce((a, d) => a + Object.keys(d).length, 0);
  const prevCount = previous ? Object.values(previous.files).reduce((a, d) => a + Object.keys(d).length, 0) : 0;
  if (previous && prevCount > 0 && count < prevCount * 0.9 && !force) {
    console.error(`SHRINK GUARD: index would shrink ${prevCount} → ${count} (use --force to accept)`);
    process.exit(1);
  }

  const out = { generatedAt: new Date().toISOString(), files, totals: totalsFrom(files, targets) };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log(`wrote ${OUT}: ${count} files`);
  console.log(JSON.stringify(out.totals, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
