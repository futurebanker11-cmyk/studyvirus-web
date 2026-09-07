import { test } from "node:test";
import assert from "node:assert/strict";
import { EXAMS, EXAM_CATEGORIES, getExamBySlug } from "../src/lib/exams";
import { factsFor, appPackageFor, cbtPortalFor, pyqSlugOverrides, examIntro, EXAM_FACTS } from "../src/lib/content/examFacts";

test("every exam has facts, a unique slug and a known category", () => {
  const slugs = new Set<string>();
  for (const e of EXAMS) {
    assert.ok(EXAM_FACTS[e.id], `facts missing for ${e.id}`);
    assert.ok(!slugs.has(e.slug), `duplicate slug ${e.slug}`);
    slugs.add(e.slug);
    assert.ok(EXAM_CATEGORIES[e.category], `unknown category ${e.category} on ${e.id}`);
  }
});

test("bank exams exist in the registry", () => {
  for (const id of ["sbi_clerk", "sbi_po", "ibps_clerk", "ibps_po", "ibps_rrb_clerk", "ibps_rrb_po"]) {
    const e = EXAMS.find((x) => x.id === id);
    assert.ok(e, id);
    assert.equal(e!.category, "bank");
  }
  assert.equal(getExamBySlug("sbi-po")?.id, "sbi_po");
});

test("app package and portal lookups", () => {
  assert.equal(appPackageFor("rrb_ntpc"), "com.railwaygk.ntpc");
  assert.equal(appPackageFor("sbi_po"), "com.bankprep.sbipo");
  assert.equal(appPackageFor("no_such_exam"), null);
  assert.equal(typeof cbtPortalFor("rrb_ntpc"), "string");
  assert.equal(cbtPortalFor("no_such_exam"), null);
});

test("pyq slug overrides come from the registry", () => {
  const ov = pyqSlugOverrides();
  assert.equal(ov["rpf_constable"], "rpf");
  assert.equal(ov["rrb_ntpc"], "rrb-ntpc");
});

test("examIntro reads naturally in both languages", () => {
  const e = getExamBySlug("rrb-ntpc")!;
  const en = examIntro(e, "en", { chapters: 120, papers: 31 });
  assert.match(en, /Railway Recruitment Boards/);
  assert.match(en, /CBT 1/);
  assert.match(en, /120 chapters/);
  assert.match(en, /31 previous-year papers/);
  const hi = examIntro(e, "hi", { chapters: 120, papers: 31 });
  assert.match(hi, /रेलवे भर्ती बोर्ड/);
  assert.match(hi, /120 अध्याय/);
  assert.equal(factsFor("unknown_id").stages.length > 0, true);
});
