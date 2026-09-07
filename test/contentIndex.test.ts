import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { hasKey, counts, listDir, totals, splitKey, __setIndexForTests, type ContentIndex } from "../src/lib/content/index";

// Annotated (deviation from the brief's bare literal): without it the [70, 70]
// pairs infer as number[] and __setIndexForTests(fixture) fails typecheck.
const fixture: ContentIndex = {
  generatedAt: "2026-09-07T00:00:00Z",
  files: {
    "gk/1-Indian History": { "1-Indus Valley.json": [70, 70], "5-Prehistoric.json": [40, 0] },
    "gk/0-Current Affairs/daily": { "2026_09_02.json": [10, 10], "2026_09_01.json": [10, 10] },
  },
  totals: {
    topicQuestions: 110, topicChapters: 2, topicSets: 9,
    pyqQuestions: 0, pyqPapers: 0, pyqExams: 0,
    aptitudeQuestions: 0, aptitudeSets: 0,
    englishQuestions: 0, englishChapters: 0,
    caQuestions: 20, caDays: 2, articles: 0,
  },
};

beforeEach(() => __setIndexForTests(fixture));

test("splitKey", () => {
  assert.deepEqual(splitKey("gk/1-Indian History/1-Indus Valley.json"), ["gk/1-Indian History", "1-Indus Valley.json"]);
  assert.deepEqual(splitKey("gk/topics.json"), ["gk", "topics.json"]);
});

test("hasKey and counts", () => {
  assert.equal(hasKey("gk/1-Indian History/1-Indus Valley.json"), true);
  assert.equal(hasKey("gk/1-Indian History/nope.json"), false);
  assert.deepEqual(counts("gk/1-Indian History/5-Prehistoric.json"), [40, 0]);
  assert.equal(counts("gk/nope/x.json"), null);
});

test("listDir is sorted ascending", () => {
  assert.deepEqual(listDir("gk/0-Current Affairs/daily"), ["2026_09_01.json", "2026_09_02.json"]);
  assert.deepEqual(listDir("gk/none"), []);
});

test("totals", () => {
  assert.equal(totals().caDays, 2);
});
