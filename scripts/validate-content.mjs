#!/usr/bin/env node
// Walks every manifest the site publishes from, verifies each file exists on
// the CDN, counts questions, and writes src/generated/content-index.json.
// Pages and sitemaps only ever emit URLs for keys in this index (spec §4.2, §10).
//
//   node scripts/validate-content.mjs            # normal
//   node scripts/validate-content.mjs --force    # skip regression + shrink guards
//   node scripts/validate-content.mjs --offline  # keep the committed index as-is: no network, NOT verified
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "generated", "content-index.json");
const CDN = "https://cdn.studyvirus.com";
const CONCURRENCY = 24;
const force = process.argv.includes("--force");
const offline = process.argv.includes("--offline");

const NORMAL = 10, LAST = 20;
// Mirrors ENGLISH_KEYS in src/lib/content/topics.ts: these count under the
// "english" section, every other listed topic under "topic".
const ENGLISH_KEYS = new Set(["english", "english_full", "english_basic"]);
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
    // Two set-file shapes live under bank/ (and gk/aptitude/): the app's
    // { questions: [{ question, question_hi, … }] } and the bilingual
    // { en: [], hi: [] } shape topics use. Without the fall-through, roughly a
    // third of bank sets counted [0, 0] and lost their set URLs.
    if (Array.isArray(json?.questions)) {
      const q = json.questions;
      return [q.length, q.filter((x) => typeof x?.question_hi === "string" && x.question_hi.trim()).length];
    }
    return countFor("bilingual", json);
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

// Manifest `folder` fields are sometimes "." (e.g. bank DI chapters), which would
// leak a literal "." segment into the key. The CDN resolves both forms, but the
// index reader is a pure string lookup, so keys are stored normalised.
const normKey = (key) => key.split("/").filter((s) => s !== ".").join("/");

// Both slug helpers mirror src/lib/content/slugs.ts and are exported so
// test/validateContentSlugs.test.ts can fail the build if the pair drifts.
export const chapterSlug = (s) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
// Mirrors resolveChapterSlug in src/lib/content/slugs.ts: a name that strips to
// nothing (Devanagari chapters in general_hindi) slugs as chapter-N from the
// file's leading number, else from the chapter's 1-based position.
export const resolveChapterSlug = (en, file, position) => {
  const slug = chapterSlug(en);
  if (slug.replace(/-/g, "") !== "") return slug;
  const m = /^(\d+)/.exec(file);
  return `chapter-${m ? parseInt(m[1], 10) : position}`;
};
const aptChapterSlug = (id) => id.replace(/^\d+_/, "").replace(/_/g, "-");
// Mirrors typeSlug in src/lib/content/aptitude.ts: folder first (unique per
// chapter, unlike names: bank/reasoning has chapters with two or three types all
// named "Previous Year Questions"), then the name when the folder slugs to
// nothing (the "." bank DI types), then the id.
export const typeSlug = (t) => chapterSlug(t.folder ?? "") || chapterSlug(t.name?.en ?? "") || chapterSlug(t.id);

async function collect() {
  const targets = []; // { key, kind, section, meta }

  // Topics (incl. hidden — English lives in hidden entries)
  const topics = (await mustJson("gk/topics.json")).topics;
  assertUnique("topic key", topics.map((t) => t.key));
  for (const t of topics) {
    if (t.screen === "CurrentAffairs") continue;
    // The site routes chapters by resolveChapterSlug, so a collision here would
    // be two chapters on one URL: a hard failure like every other assertion.
    assertUnique(`topic ${t.key} chapter slug`, (t.chapters || []).map((c, i) => resolveChapterSlug(c.en, c.file, i + 1)));
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
        // The site routes types by typeSlug, so a collision here would be two
        // types on one URL: a hard failure like every other assertion.
        const types = c.types || [];
        assertUnique(`${fam.family}/${s.id}/${c.id} type slug`, types.map(typeSlug));
        for (const t of types) {
          for (const st of t.sets || []) {
            if (st.tier !== 1) continue;
            targets.push({ key: fam.base(s.folder, c.folder, t.folder, st.file), kind: "aptitude", section: "aptitude", meta: {} });
          }
        }
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

  for (const tg of targets) tg.key = normKey(tg.key);
  assertUnique("target key (after normalising \".\" segments)", targets.map((t) => t.key));

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
    // Totals are a pure function of the files map and the manifests; without the
    // manifests nothing can be re-derived or verified, so the committed index is
    // used exactly as the last online run wrote it. Say so plainly.
    if (!previous) throw new Error("--offline needs an existing index");
    const n = Object.values(previous.files).reduce((a, d) => a + Object.keys(d).length, 0);
    console.log(`offline: keeping the committed index as-is, UNVERIFIED (${n} keys, generated ${previous.generatedAt})`);
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
    // `r` is always defined here: the loop either breaks after a successful
    // fetchJson or rethrows on the third failure.
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
    const targetKeys = new Set(targets.map((t) => t.key));
    for (const [dir, m] of Object.entries(previous.files)) for (const file of Object.keys(m)) {
      if (!files[dir]?.[file] && targetKeys.has(`${dir}/${file}`)) regressions.push(`${dir}/${file}`);
    }
  }
  const regressionSet = new Set(regressions);
  const neverPresent = missing.filter((tg) => !regressionSet.has(tg.key));
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

// Run only when invoked as the CLI. test/validateContentSlugs.test.ts imports
// this module for its slug helpers and must not trigger a CDN walk.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => { console.error(e); process.exit(1); });
}
