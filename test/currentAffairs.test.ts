import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { listDays, listMonths, daysOfMonth, findDay, isStale, monthLabel } from "../src/lib/content/currentAffairs";

beforeEach(() => __setIndexForTests({ generatedAt: "x", files: { "gk/0-Current Affairs/daily": {
  "2026_08_30.json": [10, 10], "2026_09_02.json": [10, 10], "2026_09_01.json": [12, 0], "notes.txt": [0, 0],
} }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } }));

test("listDays newest first, only date-named json with questions", () => {
  assert.deepEqual(listDays().map((d) => d.date), ["2026_09_02", "2026_09_01", "2026_08_30"]);
  assert.equal(listDays()[0].iso, "2026-09-02");
  assert.equal(listDays()[0].key, "gk/0-Current Affairs/daily/2026_09_02.json");
});

test("months and days of month", () => {
  assert.deepEqual(listMonths().map((m) => [m.month, m.days.length]), [["2026_09", 2], ["2026_08", 1]]);
  assert.deepEqual(daysOfMonth("2026_09").map((d) => d.date), ["2026_09_01", "2026_09_02"]);
  assert.equal(findDay("2026_09_01")?.hiCount, 0);
  assert.equal(findDay("2026_09_09"), undefined);
});

test("staleness is 90 days", () => {
  const d = findDay("2026_08_30")!;
  assert.equal(isStale(d, new Date("2026-11-27T00:00:00Z")), false);
  assert.equal(isStale(d, new Date("2026-11-29T00:00:00Z")), true);
});

test("monthLabel", () => {
  assert.equal(monthLabel("2026_09", "en"), "September 2026");
  assert.equal(monthLabel("2026_09", "hi"), "सितंबर 2026");
});
