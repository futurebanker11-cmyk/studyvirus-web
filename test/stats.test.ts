import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { siteStats, formatCount } from "../src/lib/content/stats";

beforeEach(() => __setIndexForTests({ generatedAt: "x", files: {}, totals: {
  topicQuestions: 62122, topicChapters: 809, topicSets: 5413, pyqQuestions: 83567, pyqPapers: 2232, pyqExams: 70,
  aptitudeQuestions: 43000, aptitudeSets: 4300, englishQuestions: 8474, englishChapters: 22, caQuestions: 1470, caDays: 147, articles: 137,
} }));

test("siteStats sums every free section", () => {
  const s = siteStats();
  assert.equal(s.questions, 62122 + 83567 + 43000 + 8474 + 1470);
  assert.equal(s.chapters, 809 + 22);
  assert.equal(s.papers, 2232);
  assert.equal(s.pyqExams, 70);
});

test("formatCount uses Indian grouping", () => {
  assert.equal(formatCount(62122, "en"), "62,122");
  assert.equal(formatCount(198633, "en"), "1,98,633");
  assert.equal(formatCount(198633, "hi"), "1,98,633");
  assert.equal(formatCount(999, "en"), "999");
});
