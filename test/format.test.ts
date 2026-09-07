import { test } from "node:test";
import assert from "node:assert/strict";
import { explanationBlocks, stripVisualHints, renderInlineMath } from "../src/lib/ui/format";

test("strips app-only visual hints and their DATA line", () => {
  const s = "Look at the gaps.\n\n📊 [VISUAL:series-steps]\nDATA: {\"terms\":[\"5\"]}\n\n∴ **33**.";
  assert.equal(stripVisualHints(s), "Look at the gaps.\n\n∴ **33**.");
});

test("explanationBlocks splits bullets, sub-bullets and paragraphs", () => {
  const s = "• First point\n• Second point\n– sub point\nPlain paragraph";
  assert.deepEqual(explanationBlocks(s), [
    { kind: "bullet", text: "First point" },
    { kind: "bullet", text: "Second point" },
    { kind: "sub", text: "sub point" },
    { kind: "para", text: "Plain paragraph" },
  ]);
});

test("renderInlineMath converts $..$ and $$..$$ to KaTeX html and leaves plain text", () => {
  const html = renderInlineMath("difference is $12-5=7$ each step");
  assert.match(html, /katex/);
  assert.match(html, /difference is/);
  assert.equal(renderInlineMath("no math here"), "no math here");
  assert.doesNotMatch(renderInlineMath("cost is $5 and $6"), /katex/); // currency, not math
});

// ── Additional coverage: the guards this module exists to hold ──

test("stripVisualHints removes a hint with no DATA line under it", () => {
  const s = "Before.\n📊 [VISUAL:pie]\nAfter.";
  assert.equal(stripVisualHints(s), "Before.\nAfter.");
});

test("stripVisualHints keeps a DATA: line that is not under a visual hint", () => {
  const s = "DATA: this is real explanation prose.";
  assert.equal(stripVisualHints(s), "DATA: this is real explanation prose.");
});

test("stripVisualHints handles the hint with no emoji prefix", () => {
  const s = "Alpha.\n[VISUAL:bar-chart]\nDATA: {\"a\":1}\nBeta.";
  assert.equal(stripVisualHints(s), "Alpha.\nBeta.");
});

test("stripVisualHints collapses runs of blank lines to one and trims", () => {
  const s = "\n\nOne.\n\n\n\nTwo.\n\n";
  assert.equal(stripVisualHints(s), "One.\n\nTwo.");
});

test("explanationBlocks runs the visual-hint strip before splitting", () => {
  const s = "• Point\n📊 [VISUAL:x]\nDATA: {}\n• Other";
  assert.deepEqual(explanationBlocks(s), [
    { kind: "bullet", text: "Point" },
    { kind: "bullet", text: "Other" },
  ]);
});

test("explanationBlocks treats a hyphen bullet as a sub-bullet", () => {
  assert.deepEqual(explanationBlocks("- dash sub"), [{ kind: "sub", text: "dash sub" }]);
});

test("explanationBlocks returns nothing for empty or whitespace-only input", () => {
  assert.deepEqual(explanationBlocks(""), []);
  assert.deepEqual(explanationBlocks("   \n\n  "), []);
});

test("renderInlineMath renders $$..$$ in display mode", () => {
  const html = renderInlineMath("$$\\frac{a}{b}$$");
  assert.match(html, /katex/);
  assert.match(html, /katex-display/);
});

test("renderInlineMath leaves rupee amounts alone", () => {
  // Question text routinely carries prices; none of this is math.
  assert.equal(renderInlineMath("He paid $200 for it"), "He paid $200 for it");
  assert.doesNotMatch(renderInlineMath("SP is $120 and CP is $100"), /katex/);
});

test("renderInlineMath leaves a price range intact", () => {
  // "$250-$300" spans as "250-", which is numeric + separator only. It looked
  // mathy to a naive operator check and was silently corrupted into
  // "250−300". A body with no digit-bearing operand beyond separators is
  // never an expression.
  const s = "The book costs $250-$300 in the market.";
  assert.equal(renderInlineMath(s), s);
});

test("renderInlineMath renders real LaTeX that contains English words", () => {
  // Aptitude solutions read as prose-with-math. Rejecting a span because it
  // contains "to", "is" or "and" destroys genuine formulae, and the failure is
  // silent — the aspirant just sees raw $…$ markup.
  assert.match(renderInlineMath("solve $2x + 3 = 11 to find x$"), /katex/);
  assert.match(renderInlineMath("area is $\\frac{a and b}{2}$ cm"), /katex/);
  assert.match(renderInlineMath("$x = 5$ is the answer"), /katex/);
});

test("renderInlineMath renders a LaTeX command with no operator characters", () => {
  assert.match(renderInlineMath("area is $\\pi r^2$ here"), /katex/);
});

test("renderInlineMath does not treat a delimiter with inner padding as math", () => {
  // The INLINE regex requires a non-space immediately inside both delimiters,
  // so a padded span never matches at all — the mathy-ness check is never
  // reached. This is also why "SP is $120 - CP is $100" is safe: the space
  // before the closing $ blocks the span outright.
  assert.doesNotMatch(renderInlineMath("total $ 5 + 6 $ rupees"), /katex/);
  assert.doesNotMatch(renderInlineMath("SP is $120 - CP is $100"), /katex/);
});

test("renderInlineMath does not throw on malformed LaTeX", () => {
  assert.doesNotThrow(() => renderInlineMath("$\\frac{1}$"));
});

test("renderInlineMath leaves a single lone dollar sign untouched", () => {
  assert.equal(renderInlineMath("costs $5"), "costs $5");
});
