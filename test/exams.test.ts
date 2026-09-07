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

test("no exam intro is ungrammatical, in either language", () => {
  const n = { chapters: 120, papers: 31 };

  // The acronym parenthetical an exam name may carry, e.g. "(UPPSC)".
  const stripAcronym = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, "").trim();
  const norm = (s: string) => stripAcronym(s).toLowerCase();

  for (const e of EXAMS) {
    const f = factsFor(e.id);

    for (const lang of ["en", "hi"] as const) {
      const out = examIntro(e, lang, n);

      // Hindi: the template supplies "द्वारा", so no body may bring its own.
      assert.ok(!out.includes("द्वारा द्वारा"), `doubled द्वारा in ${lang} intro for ${e.id}: ${out}`);
      assert.ok(!out.includes("के लिए द्वारा"), `postposition collision in ${lang} intro for ${e.id}: ${out}`);
      assert.ok(!/\(\s*[^)]*द्वारा\s*\)\s*द्वारा/.test(out), `parenthetical द्वारा before द्वारा in ${lang} intro for ${e.id}: ${out}`);

      // English: "is conducted by X, for Y" dangles.
      assert.ok(!/is conducted by [^.]*, for /.test(out), `dangling ", for" after "conducted by" in ${lang} intro for ${e.id}: ${out}`);

      // Neither language may restate the same name twice in the opening clause.
      assert.ok(
        !new RegExp(`\\(${escapeRe(e.fullName)}\\)[^.।]*${escapeRe(e.fullName)}`).test(out),
        `fullName repeated verbatim in ${lang} intro for ${e.id}: ${out}`,
      );
    }

    // The name-vs-body tautology. Equivalence, not containment: "Staff Selection
    // Commission" is a prefix of "…Combined Graduate Level" but names a different
    // thing (the conductor vs the exam), so both belong in that sentence.
    const full = norm(e.fullName);
    const enOut = examIntro(e, "en", n);
    const hiOut = examIntro(e, "hi", n);

    if (full === norm(f.body)) {
      assert.ok(
        !enOut.includes(`(${e.fullName})`),
        `tautology: en intro for ${e.id} names "${e.fullName}" twice: ${enOut}`,
      );
      assert.ok(
        !hiOut.includes(`(${e.fullName})`),
        `tautology: hi intro for ${e.id} names "${e.fullName}" twice: ${hiOut}`,
      );
    }
    // "Labour Inspector (Labour Inspector)" — name equal to its own fullName.
    if (full === norm(e.en)) {
      assert.ok(!enOut.includes(`(${e.fullName})`), `en intro for ${e.id} repeats its own name: ${enOut}`);
    }
    // A body identical to the exam's own name says nothing: "Rajasthan Police is
    // conducted by Rajasthan Police". Checked per language against that language's
    // name, so the Hindi sentence is held to the same standard as the English one.
    // Compared raw rather than via norm(): norm() drops a trailing parenthetical to
    // ignore acronyms, but a substantive one such as "Maharashtra Police (unit-wise
    // recruitment)" is exactly what makes such a body informative, not circular.
    const flat = (s: string) => s.trim().toLowerCase();
    assert.notEqual(
      flat(f.body),
      flat(e.en),
      `circular en intro for ${e.id}: body is just the exam name "${f.body}": ${enOut}`,
    );
    assert.notEqual(
      flat(f.bodyHi),
      flat(e.hi),
      `circular hi intro for ${e.id}: bodyHi is just the exam name "${f.bodyHi}": ${hiOut}`,
    );

    // The Hindi body must never end in a postposition the template will double.
    assert.ok(
      !/(द्वारा|के लिए|से|को)\)?$/.test(f.bodyHi.trim()),
      `bodyHi for ${e.id} ends in a postposition: "${f.bodyHi}"`,
    );
  }
});

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
