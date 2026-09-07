import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { __setIndexForTests, type ContentIndex } from "../src/lib/content/index";
import { entriesFor, chunk, sitemapIds, pyqDriftReport, MAX_PER_SITEMAP, SECTIONS } from "../src/lib/seo/sitemaps";
import type { SitemapData } from "../src/lib/seo/sitemaps";
import type { ManifestTopic } from "../src/lib/content/topics";
import type { AptFamilyInfo } from "../src/lib/content/aptitude";
import type { PyqExam } from "../src/lib/content/pyq";
import { EXAMS } from "../src/lib/exams";

const topics = (JSON.parse(readFileSync(new URL("./fixtures/topics.json", import.meta.url), "utf8")) as { topics: ManifestTopic[] }).topics;

const totals: ContentIndex["totals"] = { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 };

const files: ContentIndex["files"] = {
  "gk/1-Indian History": { "1-Indus Valley.json": [70, 70], "13-Viceroys & Acts.json": [40, 0] },
  // Devanagari-named chapters: chapterSlug("संज्ञा") is "", so the slug must
  // come from the file's leading number (Task 8 fallback), never be "" or "-".
  "gk/25-General Hindi": { "1-संज्ञा.json": [30, 30], "11-शब्द-शुद्धि.json": [20, 20] },
  "gk/45-English Grammar Full": { "1-Idioms and Phrases SSC.json": [30, 30] },
  "gk/46-English Grammar Basic": { "1-Synonyms_Basic.json": [20, 20] },
  "gk/24-Previous Year Papers": { "pyq_rrb_ntpc_set01.json": [40, 40], "pyq_rrb_ntpc_set02.json": [40, 10] },
  "gk/0-Current Affairs/daily": { "2026_09_01.json": [10, 10], "2026_08_01.json": [10, 0] },
  "gk/articles": { "a.json": [2, 2] },
  // Two aptitude sets in the index; the family literal below lists a third
  // (Set 03) whose file is absent and must never be emitted.
  "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation": { "Set 01.json": [10, 10], "Set 02.json": [10, 0] },
};

// Hand-built rather than loaded: loadFamily would need the bucket seam and a
// manifest fixture, and the generator only ever sees the pruned AptFamilyInfo.
const families: AptFamilyInfo[] = [{
  family: "bank", slug: "bank",
  name: { en: "Bank", hi: "बैंक" }, examQualifier: { en: "SBI PO", hi: "SBI PO" },
  subjects: [{
    id: "quant", folder: "1-Quantitative Aptitude", name: { en: "Quant", hi: "क्वांट" },
    chapters: [{
      id: "01_number_series", folder: "01_number_series", name: { en: "Number Series", hi: "संख्या श्रृंखला" },
      types: [{
        id: "type_01", folder: "1-Missing Term", name: { en: "Missing Term", hi: "लुप्त पद" },
        sets: [
          { id: "set_01", file: "Foundation/Set 01.json", tier: 1, count: 10, name: { en: "Set 1", hi: "सेट 1" } },
          { id: "set_02", file: "Foundation/Set 02.json", tier: 1, count: 10, name: { en: "Set 2", hi: "सेट 2" } },
          { id: "set_03", file: "Foundation/Set 03.json", tier: 1, count: 10, name: { en: "Set 3", hi: "सेट 3" } },
        ],
      }],
    }],
  }],
}];

const data: SitemapData = {
  topics,
  pyqExams: [{ id: "rrb_ntpc", en: "RRB NTPC", hi: "RRB NTPC", category: "railway", prefix: "pyq_rrb_ntpc_set", sets: 2 }],
  families,
  articles: [{ id: "a", title_en: "A", category: "x", file: "a.json" }],
  exams: EXAMS.slice(0, 2),
  apps: [],
  now: new Date("2026-09-07T00:00:00Z"),
};

const urls = (section: (typeof SECTIONS)[number], lang: "en" | "hi", d: SitemapData = data) => entriesFor(section, lang, d).map((e) => e.url);

beforeEach(() => __setIndexForTests({ generatedAt: "x", files, totals }));

test("sets: every app-rule set for English, only fully-Hindi chapters for Hindi", () => {
  const en = urls("sets", "en");
  assert.equal(en.filter((u) => u.includes("/indus-valley/set-")).length, 6);
  assert.equal(en.filter((u) => u.includes("/viceroys-acts/set-")).length, 3);
  assert.ok(en.includes("https://studyvirus.com/topics/history/indus-valley/set-6"));
  const hi = urls("sets", "hi");
  assert.equal(hi.filter((u) => u.includes("/viceroys-acts/")).length, 0);
  assert.ok(hi.includes("https://studyvirus.com/hi/topics/history/indus-valley/set-1"));
});

test("topics section lists hubs and chapters, not sets; hi mirrors en", () => {
  const en = urls("topics", "en");
  assert.ok(en.includes("https://studyvirus.com/topics"));
  assert.ok(en.includes("https://studyvirus.com/topics/history"));
  assert.ok(en.includes("https://studyvirus.com/topics/history/indus-valley"));
  assert.ok(!en.some((u) => u.includes("/set-")));
  assert.equal(urls("topics", "hi").length, en.length);
});

test("Devanagari-named chapters get the file-number slug, never an empty segment", () => {
  const en = urls("topics", "en");
  assert.ok(en.includes("https://studyvirus.com/topics/general-hindi/chapter-1"));
  assert.ok(en.includes("https://studyvirus.com/topics/general-hindi/chapter-11"));
  assert.ok(urls("sets", "en").includes("https://studyvirus.com/topics/general-hindi/chapter-11/set-1"));
  for (const section of SECTIONS) for (const lang of ["en", "hi"] as const) for (const u of urls(section, lang)) {
    assert.ok(!/\/\/|\/-|\/$/.test(u.slice("https://".length)), `malformed segment in ${u}`);
  }
});

test("pyq: exam hub + existing papers; Hindi only where hi is complete", () => {
  const en = urls("pyq", "en");
  assert.deepEqual(en, ["https://studyvirus.com/pyq", "https://studyvirus.com/pyq/rrb-ntpc", "https://studyvirus.com/pyq/rrb-ntpc/set-1", "https://studyvirus.com/pyq/rrb-ntpc/set-2"]);
  const hi = urls("pyq", "hi");
  assert.ok(hi.includes("https://studyvirus.com/hi/pyq/rrb-ntpc/set-1"));
  assert.ok(!hi.includes("https://studyvirus.com/hi/pyq/rrb-ntpc/set-2"));
});

test("aptitude: family, subject, chapter hubs and only indexed sets; Hindi only where hi is complete", () => {
  const en = urls("aptitude", "en");
  assert.ok(en.includes("https://studyvirus.com/aptitude"));
  assert.ok(en.includes("https://studyvirus.com/aptitude/bank"));
  assert.ok(en.includes("https://studyvirus.com/aptitude/bank/quant"));
  assert.ok(en.includes("https://studyvirus.com/aptitude/bank/quant/number-series"));
  assert.deepEqual(en.filter((u) => u.includes("/set-")), [
    "https://studyvirus.com/aptitude/bank/quant/number-series/1-missing-term/set-1",
    "https://studyvirus.com/aptitude/bank/quant/number-series/1-missing-term/set-2",
  ]);
  const hi = urls("aptitude", "hi");
  assert.ok(hi.includes("https://studyvirus.com/hi/aptitude/bank/quant/number-series"));
  assert.deepEqual(hi.filter((u) => u.includes("/set-")), ["https://studyvirus.com/hi/aptitude/bank/quant/number-series/1-missing-term/set-1"]);
});

test("current affairs: monthly + daily, stale dailies excluded", () => {
  const en = urls("current-affairs", "en");
  assert.ok(en.includes("https://studyvirus.com/current-affairs/monthly/2026_09"));
  assert.ok(en.includes("https://studyvirus.com/current-affairs/daily/2026_09_01"));
  assert.ok(en.includes("https://studyvirus.com/current-affairs/monthly/2026_08"));
  const old = urls("current-affairs", "en", { ...data, now: new Date("2026-12-15T00:00:00Z") });
  assert.ok(!old.includes("https://studyvirus.com/current-affairs/daily/2026_08_01"));
  const hi = urls("current-affairs", "hi");
  assert.ok(hi.includes("https://studyvirus.com/hi/current-affairs/daily/2026_09_01"));
  assert.ok(!hi.includes("https://studyvirus.com/hi/current-affairs/daily/2026_08_01"));
});

test("english, articles, exams, static, apps", () => {
  assert.ok(urls("english", "en").includes("https://studyvirus.com/english/english_full/idioms-phrases/set-1"));
  assert.ok(urls("english", "en").includes("https://studyvirus.com/english/english_basic/synonyms-basic"));
  assert.ok(urls("articles", "hi").includes("https://studyvirus.com/hi/articles/a"));
  assert.ok(urls("exams", "en").includes(`https://studyvirus.com/exam/${EXAMS[0].slug}`));
  assert.ok(urls("static", "hi").includes("https://studyvirus.com/hi"));
  assert.deepEqual(urls("apps", "en"), ["https://studyvirus.com/apps"]);
});

// Each section declares its own hub, so `static` must not repeat it: a URL
// declared twice makes the declared count a lie.
test("no URL is declared by more than one section", () => {
  for (const lang of ["en", "hi"] as const) {
    const all = SECTIONS.flatMap((s) => urls(s, lang));
    const dup = all.filter((u, i) => all.indexOf(u) !== i);
    assert.deepEqual(dup, [], `duplicated in ${lang}`);
  }
  assert.ok(urls("static", "en").includes("https://studyvirus.com/exam"), "the exams section has no hub of its own");
});

// The guard that would have caught 414 live aptitude URLs with raw spaces and
// "&": every path segment must be usable verbatim, without percent-encoding.
test("every generated URL is a bare path of unreserved characters", () => {
  const families: AptFamilyInfo[] = [{
    ...data.families[0],
    subjects: [{
      ...data.families[0].subjects[0],
      chapters: [{ ...data.families[0].subjects[0].chapters[0], id: "4-Puzzles & Seating Arrangement", folder: "01_number_series" }],
    }],
  }];
  const d: SitemapData = { ...data, families };
  for (const section of SECTIONS) for (const lang of ["en", "hi"] as const) for (const u of urls(section, lang, d)) {
    assert.ok(u.startsWith("https://studyvirus.com"), u);
    const path = u.slice("https://studyvirus.com".length);
    assert.match(path, /^(\/[A-Za-z0-9._~-]+)*$/, `unsafe character in ${u}`);
    assert.equal(encodeURI(path), path, `needs percent-encoding: ${u}`);
  }
  assert.ok(urls("aptitude", "en", d).includes("https://studyvirus.com/aptitude/bank/quant/puzzles-seating-arrangement/1-missing-term/set-1"));
});

// The audit's core promise: a URL is declared iff its content is in the index.
// The fixture manifest names content the index does not carry — a missing
// history chapter, a whole "ghost" topic, the `english` topic's only chapter,
// a third aptitude set — and the PYQ config here claims three papers of which
// the index holds two.
test("no URL is emitted for content absent from the index", () => {
  const d: SitemapData = { ...data, pyqExams: [{ ...data.pyqExams[0], sets: 3 }] };
  const all: string[] = [];
  for (const section of SECTIONS) for (const lang of ["en", "hi"] as const) all.push(...urls(section, lang, d));
  assert.ok(!all.some((u) => u.includes("missing-chapter")), "history/99-Missing.json is not indexed");
  assert.ok(!all.some((u) => u.includes("/ghost")), "topic ghost has no indexed chapter");
  assert.ok(!all.some((u) => u.includes("/english/english/")), "gk/45-English Grammar/1-Nope.json is not indexed");
  assert.ok(!all.some((u) => u.includes("/pyq/rrb-ntpc/set-3")), "pyq_rrb_ntpc_set03.json is not indexed");
  assert.ok(!all.some((u) => u.includes("/1-missing-term/set-3")), "aptitude Set 03.json is not indexed");
  // and the same generator with an empty index emits hubs only, never a unit
  __setIndexForTests({ generatedAt: "x", files: {}, totals });
  for (const section of SECTIONS) for (const lang of ["en", "hi"] as const) {
    assert.ok(!urls(section, lang, d).some((u) => /\/set-\d+$|\/daily\/|\/articles\/./.test(u)), `${lang}-${section} emitted a unit with an empty index`);
  }
});

test("pyqDriftReport is empty without drift and names every paper above sets", () => {
  const exams: PyqExam[] = [
    { id: "rrb_ntpc", en: "RRB NTPC", hi: "RRB NTPC", category: "railway", prefix: "pyq_rrb_ntpc_set", sets: 2 },
    { id: "ssc_cgl", en: "SSC CGL", hi: "SSC CGL", category: "ssc", prefix: "pyq_ssc_cgl_set", sets: 99 },
  ];
  assert.deepEqual(pyqDriftReport(exams), []);
  __setIndexForTests({ generatedAt: "x", files: { "gk/24-Previous Year Papers": {
    "pyq_rrb_ntpc_set01.json": [40, 40], "pyq_rrb_ntpc_set02.json": [40, 40], "pyq_rrb_ntpc_set03.json": [40, 40], "pyq_rrb_ntpc_set10.json": [40, 40],
    // three-digit numbering (pad2 does not truncate) must still be parsed
    "pyq_ssc_cgl_set099.json": [40, 40], "pyq_ssc_cgl_set100.json": [40, 40],
    // a different exam's prefix that merely starts with another must not be attributed to it
    "pyq_rrb_ntpc_set_extra01.json": [40, 40],
  } }, totals });
  const report = pyqDriftReport(exams);
  assert.equal(report.length, 3, report.join("\n"));
  assert.ok(report.some((l) => l.includes("rrb_ntpc") && l.includes("pyq_rrb_ntpc_set03.json") && l.includes("2")));
  assert.ok(report.some((l) => l.includes("rrb_ntpc") && l.includes("pyq_rrb_ntpc_set10.json")));
  assert.ok(report.some((l) => l.includes("ssc_cgl") && l.includes("pyq_ssc_cgl_set100.json") && l.includes("99")));
  assert.ok(!report.some((l) => l.includes("set_extra")));
});

test("chunking and ids", () => {
  const many = Array.from({ length: MAX_PER_SITEMAP + 1 }, (_, i) => ({ url: `u${i}` }));
  assert.equal(chunk(many).length, 2);
  assert.equal(chunk(many)[1].length, 1);
  assert.deepEqual(chunk([]), [[]]);
  const ids = sitemapIds(data);
  assert.ok(ids.some((i) => i.id === "en-sets-0"));
  assert.ok(ids.some((i) => i.id === "hi-topics-0"));
  assert.equal(new Set(ids.map((i) => i.id)).size, ids.length);
  assert.equal(ids.length, SECTIONS.length * 2);
  assert.ok(SECTIONS.includes("aptitude"));
});
