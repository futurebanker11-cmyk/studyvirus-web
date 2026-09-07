import { test } from "node:test";
import assert from "node:assert/strict";
import { chapterSlug, resolveChapterSlug, aptitudeChapterSlug } from "../src/lib/content/slugs";
import { typeSlug, type AptType } from "../src/lib/content/aptitude";
import { PAID_PREFIXES, PRO_PREFIXES } from "../src/lib/content/keys";
import { chapterSlug as scriptChapterSlug, resolveChapterSlug as scriptResolveChapterSlug, typeSlug as scriptTypeSlug, aptitudeChapterSlug as scriptAptitudeChapterSlug, PAID_PREFIXES as scriptPaidPrefixes, PRO_PREFIXES as scriptProPrefixes, assertFreeTarget } from "../scripts/validate-content.mjs";

// scripts/validate-content.mjs must not import the TypeScript build (that
// boundary is deliberate), so it carries its own copies of chapterSlug and
// resolveChapterSlug. The index it writes is keyed on those copies while pages
// route on the src versions: if the two drift, every affected chapter page
// silently 404s. Comments cannot fail CI; this test does.
const cases: Array<[en: string, file: string, position: number]> = [
  ["Indus Valley", "1-Indus Valley.json", 1],                 // Latin name
  ["Viceroys & Acts", "13-Viceroys & Acts.json", 2],          // Latin with punctuation
  ["Synonyms (Basic)", "1-Synonyms_Basic.json", 1],           // Latin with parens
  ["विशेषण", "3-विशेषण.json", 1],                              // Devanagari, leading file number
  ["संज्ञा", "संज्ञा.json", 7],                                  // Devanagari, no leading number -> position
  ["शब्द-शुद्धि", "11-शब्द-शुद्धि.json", 4],                     // reduces to dashes only
  ["क्रिया", "05-क्रिया.json", 2],                              // zero-padded file number
  ["  Spaced   Name ", "9-Spaced.json", 9],                    // trim/collapse path
  ["", "12-blank.json", 3],                                    // empty name
];

test("the validator's chapterSlug mirror agrees with src/lib/content/slugs", () => {
  for (const [en] of cases) {
    assert.equal(scriptChapterSlug(en), chapterSlug(en), `chapterSlug(${JSON.stringify(en)})`);
  }
});

test("the validator's resolveChapterSlug mirror agrees with src/lib/content/slugs", () => {
  for (const [en, file, position] of cases) {
    assert.equal(
      scriptResolveChapterSlug(en, file, position),
      resolveChapterSlug(en, file, position),
      `resolveChapterSlug(${JSON.stringify(en)}, ${JSON.stringify(file)}, ${position})`,
    );
  }
});

test("the shared fixture exercises every branch of resolveChapterSlug", () => {
  const out = cases.map(([en, file, position]) => resolveChapterSlug(en, file, position));
  assert.deepEqual(out, [
    "indus-valley", "viceroys-acts", "synonyms-basic",
    "chapter-3", "chapter-7", "chapter-11", "chapter-5",
    "spaced-name", "chapter-12",
  ]);
});

// Same contract for aptitude type slugs: the validator decides which type
// folders enter the index and asserts their slugs are unique per chapter, while
// pages route on the src typeSlug. Folder-derived because live bank/reasoning
// chapters have two or three types all named "Previous Year Questions".
const typeCases: AptType[] = [
  { id: "type_04_7", folder: "4-Previous Year", name: { en: "Previous Year Questions", hi: "x" }, sets: [] },           // same name ...
  { id: "type_04_8", folder: "4-Previous Year (Arihant)", name: { en: "Previous Year Questions", hi: "x" }, sets: [] }, // ... distinct folders
  { id: "type_05", folder: "5-Previous Year", name: { en: "Previous Year Questions", hi: "x" }, sets: [] },
  { id: "type_01", folder: "1-Missing Term", name: { en: "Missing Term", hi: "x" }, sets: [] },                        // ordinary type
  { id: "type_06", folder: "6-In-Law Relations", name: { en: "In Law Relations", hi: "x" }, sets: [] },                // punctuation in folder
  { id: "type_01", folder: ".", name: { en: "Table", hi: "x" }, sets: [] },                                            // "." folder -> name
  { id: "type_02", folder: "", name: { en: "Wrong Term", hi: "x" }, sets: [] },                                        // empty folder -> name
  { id: "type_09", folder: ".", name: { en: "", hi: "" }, sets: [] },                                                  // nothing usable -> id
];

test("the validator's typeSlug mirror agrees with src/lib/content/aptitude", () => {
  for (const t of typeCases) {
    assert.equal(scriptTypeSlug(t), typeSlug(t), `typeSlug(${JSON.stringify({ id: t.id, folder: t.folder, name: t.name.en })})`);
  }
});

// Same contract for aptitude chapter slugs. Live bank/previous_year_papers
// chapter ids are human-readable folder names ("2-Data Interpretation",
// "4-Puzzles & Seating Arrangement"), which the old prefix-strip-and-dash rule
// passed straight through into 414 sitemap URLs with raw spaces and "&".
const aptChapterCases: string[] = [
  "01_number_system_hcf_lcm",        // already clean, numeric prefix
  "30_number_series",                // already clean, numeric prefix
  "R01_blood_relation",              // leading letter+number, no spaces -> lowercased
  "02_Simplification",               // numeric prefix, capitalised word
  "2-Data Interpretation",           // digit-dash prefix, space
  "4-Puzzles & Seating Arrangement", // digit-dash prefix, ampersand
  "puzzles_CORRUPTED",               // no prefix, uppercase
  "algebra",                         // nothing to do
];

test("the validator's aptitudeChapterSlug mirror agrees with src/lib/content/slugs", () => {
  for (const id of aptChapterCases) {
    assert.equal(scriptAptitudeChapterSlug(id), aptitudeChapterSlug(id), `aptitudeChapterSlug(${JSON.stringify(id)})`);
  }
});

test("the shared fixture exercises every branch of aptitudeChapterSlug", () => {
  assert.deepEqual(aptChapterCases.map(aptitudeChapterSlug), [
    "number-system-hcf-lcm", "number-series", "r01-blood-relation", "simplification",
    "data-interpretation", "puzzles-seating-arrangement", "puzzles-corrupted", "algebra",
  ]);
  for (const s of aptChapterCases.map(aptitudeChapterSlug)) assert.match(s, /^[a-z0-9]+(-[a-z0-9]+)*$/);
});

test("the shared fixture exercises every branch of typeSlug", () => {
  assert.deepEqual(typeCases.map(typeSlug), [
    "4-previous-year", "4-previous-year-arihant", "5-previous-year",
    "1-missing-term", "6-in-law-relations",
    "table", "wrong-term", "type09",
  ]);
});

// Same contract for the non-free prefixes. The validator builds its targets
// straight from manifest folder/file fields; if a manifest ever pointed a
// chapter at gk/notes/... the validator would index it, the sitemap would
// declare it, and the page would 500 when the loader refused — declared
// count above the real one, the worst direction. The script hard-fails on
// such a target using its own copy of the prefix lists, so the copies must
// match keys.ts exactly.
test("the validator's PAID_PREFIXES and PRO_PREFIXES mirrors agree with src/lib/content/keys", () => {
  assert.deepEqual([...scriptPaidPrefixes], [...PAID_PREFIXES]);
  assert.deepEqual([...scriptProPrefixes], [...PRO_PREFIXES]);
});

test("the validator refuses to index a target under a paid or Pro prefix", () => {
  for (const p of [...PAID_PREFIXES, ...PRO_PREFIXES]) {
    assert.throws(() => assertFreeTarget(`${p}x.json`), /non-free/, p);
  }
  assert.throws(() => assertFreeTarget("gk/notes/1-Indian History/1-Indus Valley.json"), /non-free/);
  assert.doesNotThrow(() => assertFreeTarget("gk/1-Indian History/1-Indus Valley.json"));
  assert.doesNotThrow(() => assertFreeTarget("bank/2-Data Interpretation/table/prelims/set_084.json"));
  assert.doesNotThrow(() => assertFreeTarget("gk/0-Current Affairs/daily/2026_09_01.json"));
});
