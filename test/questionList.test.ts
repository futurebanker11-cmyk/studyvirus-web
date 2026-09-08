import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseQuestion } from "../src/components/site/normaliseQuestion";
import { adBreaks, AD_EVERY, MAX_IN_ARTICLE_ADS } from "../src/components/site/adBreaks";

// ── The plan's three cases (Step 1), verbatim in intent ──

test("GK shape, English and Hindi", () => {
  const gk = { q: "Q?", options: ["a", "b", "c", "d"], answer: "C", explain: "• because" };
  const n = normaliseQuestion(gk, "en");
  assert.equal(n.stem, "Q?");
  assert.equal(n.correctIndex, 2);
  assert.equal(n.explanation, "• because");
});

test("aptitude shape prefers the requested language and exposes shortcut/trap", () => {
  const apt = {
    question: "EN?",
    question_hi: "HI?",
    options: ["1", "2", "3", "4"],
    options_hi: ["१", "२", "३", "४"],
    correct_index: 0,
    solution_conventional: "long",
    solution_conventional_hi: "लंबा",
    solution_shortcut: "fast",
    solution_shortcut_hi: "तेज़",
    trap_warning: "careful",
    trap_warning_hi: "सावधान",
  };
  const en = normaliseQuestion(apt, "en");
  assert.equal(en.stem, "EN?");
  assert.equal(en.options[0], "1");
  assert.equal(en.correctIndex, 0);
  assert.equal(en.explanation, "long");
  assert.equal(en.shortcut, "fast");
  assert.equal(en.trap, "careful");
  const hi = normaliseQuestion(apt, "hi");
  assert.equal(hi.stem, "HI?");
  assert.equal(hi.options[0], "१");
  assert.equal(hi.explanation, "लंबा");
});

test("an out-of-range or missing answer yields correctIndex -1, never a wrong mark", () => {
  assert.equal(
    normaliseQuestion({ q: "x", options: ["a"], answer: "Z", explain: "" }, "en").correctIndex,
    -1,
  );
  assert.equal(
    normaliseQuestion({ question: "x", options: ["a"], correct_index: 9 }, "en").correctIndex,
    -1,
  );
});

// ── The shapes the real content actually carries ──
//
// These are not defensive padding. Every case below was written against a
// real field seen in the question bank (or a real absence of one), because
// four later tasks render every question on the site through this function
// and a silently-wrong correctIndex marks a wrong option as correct — the one
// failure mode a reader cannot detect and the site cannot afford.

test("a GK answer given as a lowercase letter, or padded, still resolves", () => {
  const base = { q: "x", options: ["a", "b", "c", "d"], explain: "" };
  assert.equal(normaliseQuestion({ ...base, answer: "b" }, "en").correctIndex, 1);
  assert.equal(normaliseQuestion({ ...base, answer: " D " }, "en").correctIndex, 3);
});

test("a numeric GK answer is refused rather than guessed at", () => {
  // Every one of the 3,818 real GK questions surveyed stores an uppercase
  // letter, so a digit here is a shape this bank does not produce. "3" is
  // ambiguous — 1-based third option, or 0-based fourth? — and guessing wrong
  // marks the wrong option correct, which is the one failure a reader trusts
  // and cannot detect. Marking nothing is the honest answer.
  const base = { q: "x", options: ["a", "b", "c", "d"], explain: "" };
  assert.equal(normaliseQuestion({ ...base, answer: "3" }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, answer: "1" }, "en").correctIndex, -1);
});

test("a missing, empty or non-string answer yields -1 rather than option A", () => {
  const base = { q: "x", options: ["a", "b", "c", "d"], explain: "" };
  assert.equal(normaliseQuestion(base, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, answer: "" }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, answer: null }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, answer: 2 }, "en").correctIndex, -1);
});

test("an aptitude correct_index that is not an integer yields -1", () => {
  const base = { question: "x", options: ["a", "b"] };
  assert.equal(normaliseQuestion(base, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, correct_index: -1 }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, correct_index: 1.5 }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, correct_index: "1" }, "en").correctIndex, -1);
  assert.equal(normaliseQuestion({ ...base, correct_index: 1 }, "en").correctIndex, 1);
});

test("Hindi falls back to English when the Hindi field is absent or blank", () => {
  // A partially-translated aptitude question must show the English rather
  // than an empty stem — a blank question is worse than a bilingual page.
  const apt = {
    question: "EN?",
    question_hi: "   ",
    options: ["1", "2"],
    correct_index: 0,
    solution_conventional: "long",
  };
  const hi = normaliseQuestion(apt, "hi");
  assert.equal(hi.stem, "EN?");
  assert.equal(hi.options[0], "1");
  assert.equal(hi.explanation, "long");
});

test("an empty options_hi array does not blank out the options", () => {
  const apt = { question: "EN?", options: ["1", "2"], options_hi: [], correct_index: 1 };
  const hi = normaliseQuestion(apt, "hi");
  assert.deepEqual(hi.options, ["1", "2"]);
  assert.equal(hi.correctIndex, 1);
});

test("an options_hi of a different length is not used, so correctIndex stays aligned", () => {
  // A truncated Hindi array would silently shift which option is marked
  // correct. Mismatched lengths fall back to the English array whole.
  const apt = {
    question: "EN?",
    options: ["1", "2", "3", "4"],
    options_hi: ["१", "२"],
    correct_index: 3,
  };
  const hi = normaliseQuestion(apt, "hi");
  assert.deepEqual(hi.options, ["1", "2", "3", "4"]);
  assert.equal(hi.correctIndex, 3);
});

test("shortcut and trap are undefined rather than empty strings when absent", () => {
  const n = normaliseQuestion({ question: "x", options: ["a"], correct_index: 0 }, "en");
  assert.equal(n.shortcut, undefined);
  assert.equal(n.trap, undefined);
  // A GK question never has them at all.
  const gk = normaliseQuestion({ q: "x", options: ["a"], answer: "A", explain: "e" }, "en");
  assert.equal(gk.shortcut, undefined);
  assert.equal(gk.trap, undefined);
});

test("a shape with neither q nor question yields an empty stem, not a crash", () => {
  const n = normaliseQuestion({}, "en");
  assert.equal(n.stem, "");
  assert.deepEqual(n.options, []);
  assert.equal(n.correctIndex, -1);
  assert.equal(n.explanation, "");
});

test("non-string options are coerced, so a numeric option still renders", () => {
  const n = normaliseQuestion({ q: "x", options: [1, 2, 3, 4], answer: "B" }, "en");
  assert.deepEqual(n.options, ["1", "2", "3", "4"]);
  assert.equal(n.correctIndex, 1);
});

test("the question id is carried through when present, as a string only", () => {
  assert.equal(normaliseQuestion({ q: "x", id: "q-17" }, "en").id, "q-17");
  assert.equal(normaliseQuestion({ q: "x", id: 17 }, "en").id, undefined);
  assert.equal(normaliseQuestion({ q: "x" }, "en").id, undefined);
});

test("a GK question is language-neutral: the caller picked the array, not us", () => {
  // Verified against real content (cdn.studyvirus.com/gk/…, 3,818 questions
  // across 30 chapter files, 2026-09-08): a GK chapter file is
  // { "en": [...], "hi": [...] } — two parallel arrays of the SAME shape
  // { id, q, options[4], answer: "A"-"D", explain }. There is no q_hi and no
  // options_hi anywhere in the GK bank; the page picks the array for its
  // language and every question inside it is already in that language.
  //
  // So `lang` must not change a GK question at all. If it ever did, a Hindi
  // page reading the "hi" array would go looking for a "_hi" field that does
  // not exist and blank the question out.
  const gk = { id: "IVC001", q: "प्रश्न?", options: ["अ", "ब", "स", "द"], answer: "C", explain: "व्याख्या" };
  const en = normaliseQuestion(gk, "en");
  const hi = normaliseQuestion(gk, "hi");
  assert.deepEqual(en, hi);
  assert.equal(hi.stem, "प्रश्न?");
  assert.equal(hi.correctIndex, 2);
  assert.equal(hi.explanation, "व्याख्या");
});

// ── Ad interleaving ──
//
// The plan: `placement("content")` ads after every 5th question, max 2 per
// page. AdSlot's "in-article" placement REQUIRES an ordinal of 0 or 1 (a
// default previously meant a second slot silently reused unit 1), so the
// break list has to carry the ordinal, and there can never be a third break.

test("ad breaks land after every 5th question, numbered 0 then 1", () => {
  assert.deepEqual(adBreaks(20), [
    { afterIndex: 4, ordinal: 0 },
    { afterIndex: 9, ordinal: 1 },
  ]);
  assert.equal(AD_EVERY, 5);
  assert.equal(MAX_IN_ARTICLE_ADS, 2);
});

test("a short set gets fewer breaks, and never one after its last question", () => {
  assert.deepEqual(adBreaks(0), []);
  assert.deepEqual(adBreaks(4), []);
  // Exactly five questions: a break after the fifth would sit below the last
  // question, where the end-of-page card already is.
  assert.deepEqual(adBreaks(5), []);
  assert.deepEqual(adBreaks(6), [{ afterIndex: 4, ordinal: 0 }]);
  assert.deepEqual(adBreaks(10), [{ afterIndex: 4, ordinal: 0 }]);
  assert.deepEqual(adBreaks(11), [
    { afterIndex: 4, ordinal: 0 },
    { afterIndex: 9, ordinal: 1 },
  ]);
});

test("a very long set is still capped at two in-article units", () => {
  const breaks = adBreaks(200);
  assert.equal(breaks.length, 2);
  assert.deepEqual(
    breaks.map((b) => b.ordinal),
    [0, 1],
  );
  // Every ordinal AdSlot accepts is 0 or 1 — no third unit exists.
  for (const b of breaks) assert.ok(b.ordinal === 0 || b.ordinal === 1);
});
