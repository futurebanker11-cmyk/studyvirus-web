import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests, type ContentIndex } from "../src/lib/content/index";
import { siteStats, formatCount } from "../src/lib/content/stats";
import realIndex from "../src/generated/content-index.json";

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

test("siteStats counts aptitude chapters when the index carries them", () => {
  __setIndexForTests({ generatedAt: "x", files: {}, totals: {
    topicQuestions: 0, topicChapters: 809, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0,
    aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 22, caQuestions: 0,
    caDays: 0, articles: 0, aptitudeChapters: 119,
  } });
  assert.equal(siteStats().chapters, 809 + 22 + 119);
});

// The headline number on the homepage. It replaces a self-contradicting
// "200,000+" / "23K+" pair, so it is pinned to the REAL committed index, not a
// fixture: if the index is regenerated and the sum moves, this test says so.
test("siteStats().questions matches the real committed index", () => {
  __setIndexForTests(realIndex as unknown as ContentIndex);
  const s = siteStats();
  assert.equal(s.questions, 193571);
  assert.equal(formatCount(s.questions, "en"), "1,93,571");
  // 809 topic + 38 english + 119 aptitude: the validator must carry
  // aptitudeChapters or the homepage shows 847 instead of the real 966.
  assert.equal(s.chapters, 966);
});

test("formatCount uses Indian grouping", () => {
  assert.equal(formatCount(62122, "en"), "62,122");
  assert.equal(formatCount(198633, "en"), "1,98,633");
  assert.equal(formatCount(198633, "hi"), "1,98,633");
  assert.equal(formatCount(999, "en"), "999");
});

test("formatCount rejects non-finite input instead of grouping its letters", () => {
  assert.equal(formatCount(Infinity, "en"), "0");
  assert.equal(formatCount(-Infinity, "en"), "0");
  assert.equal(formatCount(NaN, "en"), "0");
});
