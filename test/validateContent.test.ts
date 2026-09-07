import { test } from "node:test";
import assert from "node:assert/strict";
import { totalsFrom, indexable, pyqTargets } from "../scripts/validate-content.mjs";

// The aptitudeChapters carry: the homepage sums topic + english + aptitude
// chapters, and the index must carry the aptitude count for that to be true.
// Distinct family/subject/chapter among PRESENT aptitude targets, so a chapter
// whose every set is missing from the CDN is not a chapter anyone can browse.
test("totalsFrom counts distinct present aptitude chapters", () => {
  const targets = [
    { key: "bank/1-Q/01_a/1-T/Foundation/Set 01.json", kind: "aptitude", section: "aptitude", meta: { chapter: "bank/quant/01_a" } },
    { key: "bank/1-Q/01_a/1-T/Foundation/Set 02.json", kind: "aptitude", section: "aptitude", meta: { chapter: "bank/quant/01_a" } },
    { key: "bank/1-Q/01_a/2-T/Foundation/Set 01.json", kind: "aptitude", section: "aptitude", meta: { chapter: "bank/quant/01_a" } },
    { key: "bank/1-Q/02_b/1-T/Foundation/Set 01.json", kind: "aptitude", section: "aptitude", meta: { chapter: "bank/quant/02_b" } },
    { key: "gk/aptitude/content/quant/01_a/1-T/Set 01.json", kind: "aptitude", section: "aptitude", meta: { chapter: "ssc-railway/quant/01_a" } },
    // absent from the CDN: its chapter must not count
    { key: "bank/1-Q/03_c/1-T/Foundation/Set 01.json", kind: "aptitude", section: "aptitude", meta: { chapter: "bank/quant/03_c" } },
  ];
  const files = {
    "bank/1-Q/01_a/1-T/Foundation": { "Set 01.json": [10, 10], "Set 02.json": [10, 0] },
    "bank/1-Q/01_a/2-T/Foundation": { "Set 01.json": [5, 5] },
    "bank/1-Q/02_b/1-T/Foundation": { "Set 01.json": [7, 0] },
    "gk/aptitude/content/quant/01_a/1-T": { "Set 01.json": [3, 3] },
  };
  const t = totalsFrom(files, targets);
  assert.equal(t.aptitudeChapters, 3);
  assert.equal(t.aptitudeSets, 5);
  assert.equal(t.aptitudeQuestions, 35);
});

// [0,0] on a non-article kind: the file parsed but carries no questions in any
// shape countFor knows. Every consumer treats counts()[0] > 0 as "present", so
// the index must not hold an entry hasKey would answer true for.
test("indexable drops [0,0] on non-article kinds and never admits a probe", () => {
  assert.equal(indexable({ kind: "bilingual", meta: {} }, [0, 0]), false);
  assert.equal(indexable({ kind: "aptitude", meta: {} }, [0, 0]), false);
  assert.equal(indexable({ kind: "bilingual", meta: {} }, [1, 0]), true);
  assert.equal(indexable({ kind: "aptitude", meta: {} }, [0, 1]), true);
  assert.equal(indexable({ kind: "article", meta: {} }, [0, 0]), true);
  assert.equal(indexable({ kind: "bilingual", meta: { probe: true } }, [40, 40]), false);
});

// PYQ drift: papersOf iterates 1..sets, so a paper the CDN holds ABOVE sets
// exists but can never be published until pyq-config is raised. The validator
// probes exactly one extra paper per exam, flagged so it is never indexed, and
// warns if it exists.
test("pyqTargets probes sets+1 per exam, flagged so it is never written", () => {
  const exams = [
    { id: "rrb_ntpc", prefix: "pyq_rrb_ntpc_set", sets: 2 },
    { id: "ssc_cgl", prefix: "pyq_ssc_cgl_set", sets: 99 },
  ];
  const targets = pyqTargets(exams);
  const real = targets.filter((t) => !t.meta.probe);
  const probes = targets.filter((t) => t.meta.probe);
  assert.deepEqual(real.map((t) => t.key), [
    "gk/24-Previous Year Papers/pyq_rrb_ntpc_set01.json",
    "gk/24-Previous Year Papers/pyq_rrb_ntpc_set02.json",
    ...Array.from({ length: 99 }, (_, i) => `gk/24-Previous Year Papers/pyq_ssc_cgl_set${String(i + 1).padStart(2, "0")}.json`),
  ]);
  assert.deepEqual(probes.map((t) => t.key), [
    "gk/24-Previous Year Papers/pyq_rrb_ntpc_set03.json",
    "gk/24-Previous Year Papers/pyq_ssc_cgl_set100.json",
  ]);
  for (const t of real) assert.equal(t.kind, "bilingual"), assert.equal(t.section, "pyq");
  for (const t of probes) assert.equal(t.meta.exam, t.key.includes("rrb") ? "rrb_ntpc" : "ssc_cgl");
  // A probe that happens to be present must not enter the totals either.
  const files = { "gk/24-Previous Year Papers": { "pyq_rrb_ntpc_set01.json": [40, 40], "pyq_rrb_ntpc_set02.json": [40, 40], "pyq_rrb_ntpc_set03.json": [40, 40] } };
  const t = totalsFrom(files, targets);
  assert.equal(t.pyqPapers, 2);
  assert.equal(t.pyqQuestions, 80);
  assert.equal(t.pyqExams, 1);
});
