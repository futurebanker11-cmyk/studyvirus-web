import { test } from "node:test";
import assert from "node:assert/strict";
import { hasHindiCounts, hasHindiSet } from "../src/lib/content/hindi";

test("hindi requires a complete, non-empty hi array", () => {
  assert.equal(hasHindiCounts(70, 70), true);
  assert.equal(hasHindiCounts(70, 69), false);
  assert.equal(hasHindiCounts(0, 0), false);
  // hi > en is not "complete", it is a broken row: the rule is equality, not >=.
  assert.equal(hasHindiCounts(70, 71), false);
  assert.equal(hasHindiSet({ en: [1, 2], hi: [1, 2] }), true);
  assert.equal(hasHindiSet({ en: [1, 2], hi: [1] }), false);
  assert.equal(hasHindiSet({ en: [1] }), false);
  assert.equal(hasHindiSet({ en: [1], hi: [1, 2] }), false);
});
