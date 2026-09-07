import { test } from "node:test";
import assert from "node:assert/strict";
import { hasHindiCounts, hasHindiSet } from "../src/lib/content/hindi";

test("hindi requires a complete, non-empty hi array", () => {
  assert.equal(hasHindiCounts(70, 70), true);
  assert.equal(hasHindiCounts(70, 69), false);
  assert.equal(hasHindiCounts(0, 0), false);
  assert.equal(hasHindiSet({ en: [1, 2], hi: [1, 2] }), true);
  assert.equal(hasHindiSet({ en: [1, 2], hi: [1] }), false);
  assert.equal(hasHindiSet({ en: [1] }), false);
});
