import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadFamily, subjectSlug, chapterSlug, typeSlug, findSubject, findAptChapter, findType, setsOf, findAptSet } from "../src/lib/content/aptitude";

const bank = readFileSync(new URL("./fixtures/aptitude-bank.json", import.meta.url), "utf8");
const gk = readFileSync(new URL("./fixtures/aptitude-gk.json", import.meta.url), "utf8");

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) {
    if (key === "bank/manifest.json") return { text: async () => bank };
    if (key === "gk/aptitude/manifest.json") return { text: async () => gk };
    return null;
  } }));
  __setIndexForTests({ generatedAt: "x", files: {
    "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation": { "Set 01.json": [10, 10], "Set 04.json": [10, 0] },
    "bank/1-Quantitative Aptitude/R01_blood_relation/4-Previous Year/mains": { "Set 01.json": [10, 10] },
    "bank/1-Quantitative Aptitude/R01_blood_relation/4-Previous Year (Arihant)/mains": { "Set 01.json": [10, 10] },
    // Stored normalised: the manifest's type folder for this set is "." (Task 7).
    "bank/1-Quantitative Aptitude/table/prelims": { "set_084.json": [10, 10] },
    "gk/aptitude/content/quant/01_number_system_hcf_lcm/1-Divisibility Rules": { "Set 01.json": [10, 10] },
  }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } });
});

test("bank family: tier-2 sets, empty types and empty subjects are removed", async () => {
  const fam = await loadFamily("bank");
  assert.equal(fam.slug, "bank");
  // The fixture's PYQ subject carries only a tier-2 set. (Fixture-only: the live
  // bank manifest has 1,057 tier-1 sets in previous_year_papers.)
  assert.deepEqual(fam.subjects.map((s) => s.id), ["quant"]);
  const quant = fam.subjects[0];
  assert.deepEqual(quant.chapters[0].types.map((t) => t.id), ["type_01"]); // Wrong Term had only tier-2
  assert.deepEqual(quant.chapters[0].types[0].sets.map((s) => s.id), ["set_01", "set_03", "set_04"]);
});

test("slugs and lookups", async () => {
  const fam = await loadFamily("bank");
  const s = findSubject(fam, "quant")!;
  assert.equal(subjectSlug(s), "quant");
  const c = findAptChapter(s, "number-series")!;
  assert.equal(chapterSlug(c), "number-series");
  // Ruling A: the type slug is the folder ("1-Missing Term"), not the name.
  const t = findType(c, "1-missing-term")!;
  assert.equal(typeSlug(t), "1-missing-term");
  assert.equal(findType(c, "missing-term"), undefined);
});

test("setsOf numbers tier-1 sets 1..n and skips files missing from the index", async () => {
  const fam = await loadFamily("bank");
  const s = fam.subjects[0], c = s.chapters[0], t = c.types[0];
  const sets = setsOf("bank", s, c, t);
  // set_03's file is not in the index → dropped; numbering follows the tier-1 order that remains
  assert.deepEqual(sets.map((x) => [x.n, x.set.id]), [[1, "set_01"], [2, "set_04"]]);
  assert.equal(sets[0].key, "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation/Set 01.json");
  assert.equal(sets[1].hiCount, 0);
  assert.equal(findAptSet("bank", s, c, t, 3), undefined);
});

test("ssc-railway family reads the gk manifest and content path", async () => {
  const fam = await loadFamily("ssc-railway");
  assert.equal(fam.examQualifier.en, "SSC CGL, CHSL, MTS & RRB NTPC, Group D");
  const s = fam.subjects[0], c = s.chapters[0], t = c.types[0];
  assert.equal(chapterSlug(c), "number-system-hcf-lcm");
  assert.equal(setsOf("ssc-railway", s, c, t)[0].key, "gk/aptitude/content/quant/01_number_system_hcf_lcm/1-Divisibility Rules/Set 01.json");
});

// A type can carry tier-1 sets in the manifest whose files are absent from the
// index (live: ssc-railway/quant/28_approximation, all five types). Pruning on
// manifest tier alone would still list that type and chapter, and pages would
// render them empty. Index presence is part of pruning, cascading upward.
test("loadFamily drops types with no indexed sets, then empty chapters, then empty subjects", async () => {
  const fam = await loadFamily("ssc-railway");
  // reasoning's only chapter had only index-absent sets -> subject gone
  assert.deepEqual(fam.subjects.map((s) => s.id), ["quant"]);
  const quant = fam.subjects[0];
  // 28_approximation had two types, both index-absent -> chapter gone
  assert.deepEqual(quant.chapters.map((c) => c.id), ["01_number_system_hcf_lcm"]);
  // within the surviving chapter, the index-absent type is gone, the present one stays
  assert.deepEqual(quant.chapters[0].types.map((t) => t.id), ["type_01"]);
  assert.equal(setsOf("ssc-railway", quant, quant.chapters[0], quant.chapters[0].types[0]).length, 1);
});

// Ruling A. Five live bank/reasoning chapters carry two or three types all named
// "Previous Year Questions" (145 tier-1 sets). A name-derived slug puts them on
// one URL, so the slug comes from the folder, which is unique per chapter.
test("type slugs come from the folder, so same-named types stay distinct and routable", async () => {
  const fam = await loadFamily("bank");
  const s = fam.subjects[0];
  const c = findAptChapter(s, "R01-blood-relation")!;
  assert.deepEqual(c.types.map(typeSlug), ["4-previous-year", "4-previous-year-arihant"]);
  const a = findType(c, "4-previous-year")!, b = findType(c, "4-previous-year-arihant")!;
  assert.equal(a.id, "type_04_7");
  assert.equal(b.id, "type_04_8");
  // each type lists its own set, numbered from 1 within that type
  assert.deepEqual(setsOf("bank", s, c, a).map((x) => [x.n, x.key]), [[1, "bank/1-Quantitative Aptitude/R01_blood_relation/4-Previous Year/mains/Set 01.json"]]);
  assert.deepEqual(setsOf("bank", s, c, b).map((x) => [x.n, x.key]), [[1, "bank/1-Quantitative Aptitude/R01_blood_relation/4-Previous Year (Arihant)/mains/Set 01.json"]]);
});

test("typeSlug prefers the folder, then the name when the folder slugs to empty, then the id", () => {
  // the folder wins even when the name says something else
  assert.equal(typeSlug({ id: "type_02", folder: "2-Wrong Term", name: { en: "Something Else", hi: "x" }, sets: [] }), "2-wrong-term");
  // "." (45 live bank DI types) slugs to nothing -> the name
  assert.equal(typeSlug({ id: "type_01", folder: ".", name: { en: "Table", hi: "x" }, sets: [] }), "table");
  // no usable folder or name -> the id
  assert.equal(typeSlug({ id: "type_09", folder: ".", name: { en: "", hi: "" }, sets: [] }), "type09");
});

// Ruling B. 2,136 live bank manifest entries have a folder of "."; the index is
// stored normalised, and the read side must build the same key or the set vanishes.
test("a manifest folder of \".\" produces a normalised key that the index resolves", async () => {
  const fam = await loadFamily("bank");
  const s = fam.subjects[0];
  const c = findAptChapter(s, "table")!;
  const t = findType(c, "table")!;
  assert.equal(t.folder, ".");
  const sets = setsOf("bank", s, c, t);
  assert.deepEqual(sets.map((x) => [x.n, x.key]), [[1, "bank/1-Quantitative Aptitude/table/prelims/set_084.json"]]);
  assert.ok(!sets[0].key.split("/").includes("."), "key must carry no \".\" segment");
  assert.equal(findAptSet("bank", s, c, t, 1)?.set.id, "set_084");
});
