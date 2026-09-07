import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { __setIndexForTests, type ContentIndex } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import {
  loadTopics, visibleTopics, englishTopics, findTopicBySlug, chaptersOf, findChapter, topicsForExam, adjacentChapters, ENGLISH_KEYS,
} from "../src/lib/content/topics";

const manifest = readFileSync(new URL("./fixtures/topics.json", import.meta.url), "utf8");

const zeroTotals: ContentIndex["totals"] = {
  topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0,
  aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0,
};

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) { return key === "gk/topics.json" ? { text: async () => manifest } : null; } }));
  __setIndexForTests({
    generatedAt: "x",
    files: {
      "gk/1-Indian History": { "1-Indus Valley.json": [70, 70], "13-Viceroys & Acts.json": [40, 0] },
      "gk/25-General Hindi": { "1-संज्ञा.json": [50, 50], "2-सर्वनाम.json": [45, 45], "11-शब्द-शुद्धि.json": [30, 30] },
      "gk/45-English Grammar": { "1-Nope.json": [500, 0] },
      "gk/45-English Grammar Full": { "1-Idioms and Phrases SSC.json": [30, 30] },
      "gk/46-English Grammar Basic": { "1-Synonyms_Basic.json": [20, 20] },
    },
    totals: zeroTotals,
  });
});

test("ENGLISH_KEYS names all three English trees, largest first", () => {
  assert.deepEqual([...ENGLISH_KEYS], ["english", "english_full", "english_basic"]);
});

test("visibleTopics drops CA, all three English keys, hidden and topics with no existing files", async () => {
  const all = await loadTopics();
  assert.deepEqual(visibleTopics(all).map((t) => t.key), ["history", "general_hindi"]);
});

test("englishTopics returns the three English keys in fixed order", async () => {
  const all = await loadTopics();
  assert.deepEqual(englishTopics(all).map((t) => t.key), ["english", "english_full", "english_basic"]);
});

test("englishTopics drops an English key whose chapters are all absent from the index", async () => {
  __setIndexForTests({
    generatedAt: "x",
    files: {
      "gk/45-English Grammar Full": { "1-Idioms and Phrases SSC.json": [30, 30] },
      "gk/46-English Grammar Basic": { "1-Synonyms_Basic.json": [20, 20] },
    },
    totals: zeroTotals,
  });
  const all = await loadTopics();
  assert.deepEqual(englishTopics(all).map((t) => t.key), ["english_full", "english_basic"]);
  assert.deepEqual(visibleTopics(all).map((t) => t.key), []);
});

test("chaptersOf only lists existing files, with counts and app-rule set counts", async () => {
  const all = await loadTopics();
  const hist = findTopicBySlug(visibleTopics(all), "history")!;
  const chs = chaptersOf(hist);
  assert.deepEqual(chs.map((c) => c.slug), ["indus-valley", "viceroys-acts"]);
  assert.equal(chs[0].key, "gk/1-Indian History/1-Indus Valley.json");
  assert.equal(chs[0].enCount, 70);
  assert.equal(chs[0].hiCount, 70);
  assert.equal(chs[0].sets, 6);
  assert.equal(chs[1].hiCount, 0);
  assert.equal(findChapter(hist, "missing-chapter"), undefined);
});

test("Devanagari chapters get distinct chapter-N slugs from their file numbers", async () => {
  const all = await loadTopics();
  const hindi = findTopicBySlug(visibleTopics(all), "general-hindi")!;
  const chs = chaptersOf(hindi);
  assert.deepEqual(chs.map((c) => c.slug), ["chapter-1", "chapter-2", "chapter-11"]);
  assert.equal(new Set(chs.map((c) => c.slug)).size, chs.length);
  assert.equal(findChapter(hindi, "chapter-11")?.key, "gk/25-General Hindi/11-शब्द-शुद्धि.json");
  assert.equal(findChapter(hindi, ""), undefined);
  assert.equal(findChapter(hindi, "-"), undefined);
});

test("topicsForExam and adjacentChapters", async () => {
  const all = await loadTopics();
  assert.deepEqual(topicsForExam(all, "rrb_ntpc").map((t) => t.key), ["history"]);
  const hist = findTopicBySlug(all, "history")!;
  const adj = adjacentChapters(hist, "indus-valley");
  assert.equal(adj.prev, undefined);
  assert.equal(adj.next?.slug, "viceroys-acts");
  assert.deepEqual(adjacentChapters(hist, "nope"), {});
});
