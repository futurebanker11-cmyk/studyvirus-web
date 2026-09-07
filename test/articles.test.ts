import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadArticles, findArticle, loadArticleBody, articleHasHindi } from "../src/lib/content/articles";

const index = JSON.stringify({ articles: [
  { id: "a", title_en: "A", title_hi: "अ", category: "strategy", file: "a.json" },
  { id: "b", title_en: "B", category: "strategy", file: "b.json" },
  { id: "over", title_en: "O", category: "strategy", file: "over.json" },
  { id: "gone", title_en: "G", category: "x", file: "gone.json" },
]});
const bodyA = JSON.stringify({ id: "a", paragraphs: [{ type: "heading", en: "A", hi: "अ" }, { en: "p", hi: "प" }] });

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) {
    if (key === "gk/articles/index.json") return { text: async () => index };
    if (key === "gk/articles/a.json") return { text: async () => bodyA };
    return null;
  } }));
  __setIndexForTests({ generatedAt: "x", files: { "gk/articles": { "a.json": [2, 2], "b.json": [3, 1], "over.json": [2, 3] } }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } });
});

test("loadArticles drops entries whose file is not in the index", async () => {
  assert.deepEqual((await loadArticles()).map((a) => a.id), ["a", "b", "over"]);
});

test("hindi availability and body loading", async () => {
  const list = await loadArticles();
  assert.equal(articleHasHindi(findArticle(list, "a")!), true);
  assert.equal(articleHasHindi(findArticle(list, "b")!), false);
  // A hi array longer than en is a broken row, not a complete translation.
  // Articles must apply the same rule as every other section (hindi.ts).
  assert.equal(articleHasHindi(findArticle(list, "over")!), false);
  const body = await loadArticleBody(findArticle(list, "a")!);
  assert.equal(body?.paragraphs.length, 2);
});
