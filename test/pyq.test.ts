import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setIndexForTests } from "../src/lib/content/index";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadPyqExams, pyqSlug, findPyqBySlug, papersOf, findPaper } from "../src/lib/content/pyq";

const config = JSON.stringify({ exams: [
  { id: "rrb_ntpc", en: "RRB NTPC", hi: "RRB NTPC", category: "railway", prefix: "pyq_rrb_ntpc_set", sets: 3 },
  { id: "rpf_constable", en: "RPF", hi: "RPF", category: "railway", prefix: "pyq_rpf_set", sets: 2 },
  { id: "inactive", en: "X", hi: "X", category: "x", prefix: "pyq_x_set", sets: 0 },
  { id: "empty", en: "E", hi: "E", category: "x", prefix: "pyq_e_set", sets: 2 },
]});

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => ({ async get(key: string) { return key === "gk/pyq-config.json" ? { text: async () => config } : null; } }));
  __setIndexForTests({ generatedAt: "x", files: { "gk/24-Previous Year Papers": {
    "pyq_rrb_ntpc_set01.json": [40, 40], "pyq_rrb_ntpc_set03.json": [40, 40], "pyq_rpf_set01.json": [40, 0], "pyq_rpf_set02.json": [40, 40],
  } }, totals: { topicQuestions: 0, topicChapters: 0, topicSets: 0, pyqQuestions: 0, pyqPapers: 0, pyqExams: 0, aptitudeQuestions: 0, aptitudeSets: 0, englishQuestions: 0, englishChapters: 0, caQuestions: 0, caDays: 0, articles: 0 } });
});

test("loadPyqExams keeps active exams with at least one existing paper", async () => {
  const exams = await loadPyqExams();
  assert.deepEqual(exams.map((e) => e.id), ["rrb_ntpc", "rpf_constable"]);
});

test("slugs honour overrides, else dash the id", async () => {
  const exams = await loadPyqExams();
  const ov = { rpf_constable: "rpf" };
  assert.equal(pyqSlug(exams[0], ov), "rrb-ntpc");
  assert.equal(pyqSlug(exams[1], ov), "rpf");
  assert.equal(findPyqBySlug(exams, "rpf", ov)?.id, "rpf_constable");
  assert.equal(findPyqBySlug(exams, "rpf-constable", ov), undefined);
});

test("papersOf skips missing files and findPaper is exact", async () => {
  const [ntpc] = await loadPyqExams();
  assert.deepEqual(papersOf(ntpc).map((p) => p.n), [1, 3]);
  assert.equal(papersOf(ntpc)[1].key, "gk/24-Previous Year Papers/pyq_rrb_ntpc_set03.json");
  assert.equal(findPaper(ntpc, 2), undefined);
  assert.equal(findPaper(ntpc, 3)?.enCount, 40);
});
