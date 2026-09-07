import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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

// The committed index is the single source of truth for every URL the site
// emits, so its totals must reconcile with its own keys and no indexed file may
// count as empty -- an empty count silently drops that file's set URLs.
test("the committed index reconciles its totals with its keys and has no empty or dotted entries", () => {
  const real = JSON.parse(readFileSync(new URL("../src/generated/content-index.json", import.meta.url), "utf8")) as ContentIndex;
  const keysUnder = (prefix: string) =>
    Object.entries(real.files)
      .filter(([dir]) => dir === prefix || dir.startsWith(prefix + "/"))
      .reduce((n, [, m]) => n + Object.keys(m).length, 0);

  assert.equal(real.totals.aptitudeSets, keysUnder("bank") + keysUnder("gk/aptitude"));
  assert.equal(real.totals.caDays, keysUnder("gk/0-Current Affairs/daily"));
  assert.equal(real.totals.articles, keysUnder("gk/articles"));
  assert.equal(real.totals.pyqPapers, keysUnder("gk/24-Previous Year Papers"));

  const empty: string[] = [];
  const dotted: string[] = [];
  for (const [dir, m] of Object.entries(real.files)) {
    for (const [file, c] of Object.entries(m)) {
      const key = `${dir}/${file}`;
      if (c[0] === 0 && c[1] === 0) empty.push(key);
      if (key.split("/").includes(".")) dotted.push(key);
    }
  }
  assert.deepEqual(empty.slice(0, 5), [], `${empty.length} indexed files count [0, 0]`);
  assert.deepEqual(dotted.slice(0, 5), [], `${dotted.length} keys contain a "." path segment`);
});
