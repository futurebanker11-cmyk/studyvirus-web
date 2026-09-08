import { test } from "node:test";
import assert from "node:assert/strict";
import { format } from "../src/lib/ui/strings";

/**
 * The chapter page's two H1s.
 *
 * No web-method file exists in production (every one of the 119 chapter keys
 * 404s as of 2026-09-08), so the method-first branch is unexercised by live
 * content and would otherwise ship having never produced a string. These
 * assertions pin both shapes against the spec's exact wording so the branch is
 * reviewable before the first note is authored.
 *
 * The page itself picks between them on `loadWebMethod(...) !== null`, which
 * test/webMethod.test.ts covers on both sides.
 */

const EXAMS_EN = "SBI PO, SBI Clerk, IBPS PO, IBPS Clerk & RRB";

test("the method-first H1 matches the spec wording exactly", () => {
  assert.equal(
    format("en", "aptChapter.h1Method", { chapter: "Number Series", exams: EXAMS_EN }),
    `Number Series: formula, shortcuts & practice questions for ${EXAMS_EN}`,
  );
});

test("the plain H1 — the one every live chapter renders today — matches the spec wording", () => {
  assert.equal(
    format("en", "aptChapter.h1Plain", { chapter: "Number Series", exams: EXAMS_EN }),
    `Number Series practice questions for ${EXAMS_EN}`,
  );
});

test("both H1s fill every placeholder in Hindi too", () => {
  for (const key of ["aptChapter.h1Method", "aptChapter.h1Plain"] as const) {
    const s = format("hi", key, { chapter: "संख्या श्रृंखला", exams: "SBI PO" });
    // format() leaves an unknown placeholder visible rather than blanking it,
    // so a leftover brace here means a typo in the Hindi string.
    assert.ok(!/\{/.test(s), `${key} left a placeholder unfilled: ${s}`);
    assert.ok(s.includes("संख्या श्रृंखला"), `${key} dropped the chapter name`);
    assert.ok(s.includes("SBI PO"), `${key} dropped the exam qualifier`);
  }
});
