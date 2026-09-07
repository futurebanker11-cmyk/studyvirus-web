import { test } from "node:test";
import assert from "node:assert/strict";
import { topicSlug, chapterSlug, dashed, aptitudeChapterSlug, aptitudeSubjectSlug, parseSetParam } from "../src/lib/content/slugs";

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

test("parseSetParam", () => {
  assert.equal(parseSetParam("set-7"), 7);
  assert.equal(parseSetParam("set-07"), 7);
  assert.equal(parseSetParam("set-x"), null);
  assert.equal(parseSetParam("7"), null);
  assert.equal(parseSetParam("set-0"), null);
});
