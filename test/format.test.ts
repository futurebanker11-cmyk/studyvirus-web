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

test("renderInlineMath renders a LaTeX command with no operator characters", () => {
  assert.match(renderInlineMath("area is $\\pi r^2$ here"), /katex/);
});

test("renderInlineMath does not treat a delimiter with inner padding as math", () => {
  // "$ 5 + 6 $" — spaces just inside the delimiters mean this was never math.
  assert.doesNotMatch(renderInlineMath("total $ 5 + 6 $ rupees"), /katex/);
});

test("renderInlineMath does not throw on malformed LaTeX", () => {
  assert.doesNotThrow(() => renderInlineMath("$\\frac{1}$"));
});

test("renderInlineMath leaves a single lone dollar sign untouched", () => {
  assert.equal(renderInlineMath("costs $5"), "costs $5");
});
