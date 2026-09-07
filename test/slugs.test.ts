import { test } from "node:test";
import assert from "node:assert/strict";
import { topicSlug, chapterSlug, resolveChapterSlug, dashed, aptitudeChapterSlug, aptitudeSubjectSlug, parseSetParam } from "../src/lib/content/slugs";

test("topicSlug matches the live site", () => {
  assert.equal(topicSlug("famous_people"), "famous-people");
  assert.equal(topicSlug("history"), "history");
});

test("chapterSlug matches the live site for every punctuation case in the manifest", () => {
  assert.equal(chapterSlug("Indus Valley"), "indus-valley");
  assert.equal(chapterSlug("Buddhism & Jainism"), "buddhism-jainism");
  assert.equal(chapterSlug("Viceroys & Acts"), "viceroys-acts");
  assert.equal(chapterSlug("Revolt of 1857"), "revolt-of-1857");
  assert.equal(chapterSlug("Chola & South Kingdoms"), "chola-south-kingdoms");
  assert.equal(chapterSlug("  Spaced   Name "), "spaced-name");
  assert.equal(chapterSlug("Synonyms (Basic)"), "synonyms-basic");
});

test("aptitude slugs", () => {
  assert.equal(dashed("previous_year_papers"), "previous-year-papers");
  assert.equal(aptitudeChapterSlug("01_number_system_hcf_lcm"), "number-system-hcf-lcm");
  assert.equal(aptitudeChapterSlug("30_number_series"), "number-series");
  assert.equal(aptitudeChapterSlug("algebra"), "algebra");
  assert.equal(aptitudeSubjectSlug("quant"), "quant");
  assert.equal(aptitudeSubjectSlug("di"), "data-interpretation");
  assert.equal(aptitudeSubjectSlug("puzzles"), "puzzles");
  assert.equal(aptitudeSubjectSlug("previous_year_papers"), "previous-year-questions");
  assert.equal(aptitudeSubjectSlug("unknown_thing"), "unknown-thing");
});

// Ruling B (task 8): chapters named only in Devanagari strip to "" or "-" under
// chapterSlug, so every such chapter would share one URL. resolveChapterSlug
// keeps chapterSlug's answer for Latin names and falls back to the file's
// leading number, then to the 1-based position, for the rest.
test("resolveChapterSlug keeps chapterSlug for Latin names", () => {
  assert.equal(resolveChapterSlug("Indus Valley", "1-Indus Valley.json", 1), "indus-valley");
  assert.equal(resolveChapterSlug("Viceroys & Acts", "13-Viceroys & Acts.json", 2), "viceroys-acts");
});

test("resolveChapterSlug derives chapter-N from the file's leading number for Devanagari names", () => {
  assert.equal(chapterSlug("विशेषण"), "");
  assert.equal(resolveChapterSlug("विशेषण", "3-विशेषण.json", 1), "chapter-3");
  // dash-only residue counts as empty too
  assert.equal(chapterSlug("शब्द-शुद्धि"), "-");
  assert.equal(resolveChapterSlug("शब्द-शुद्धि", "11-शब्द-शुद्धि.json", 1), "chapter-11");
});

test("resolveChapterSlug falls back to the 1-based position when the file has no leading number", () => {
  assert.equal(resolveChapterSlug("संज्ञा", "संज्ञा.json", 7), "chapter-7");
});

test("resolveChapterSlug gives two different Devanagari chapters different slugs", () => {
  const a = resolveChapterSlug("संज्ञा", "1-संज्ञा.json", 1);
  const b = resolveChapterSlug("सर्वनाम", "2-सर्वनाम.json", 2);
  assert.notEqual(a, b);
  assert.equal(a, "chapter-1");
  assert.equal(b, "chapter-2");
});

test("parseSetParam", () => {
  assert.equal(parseSetParam("set-7"), 7);
  assert.equal(parseSetParam("set-07"), 7);
  assert.equal(parseSetParam("set-x"), null);
  assert.equal(parseSetParam("7"), null);
  assert.equal(parseSetParam("set-0"), null);
});
