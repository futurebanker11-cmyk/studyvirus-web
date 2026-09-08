import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { __setBucketResolver } from "../src/lib/content/bucket";
import { __clearMemo } from "../src/lib/content/loader";
import { loadWebMethod } from "../src/lib/content/webMethod";
import { keys } from "../src/lib/content/keys";

/**
 * No web-method file exists in production yet — every key 404s as of
 * 2026-09-08 — so these tests are the only thing that exercises the chapter
 * page's method-first branch at all. They serve the fixture the bucket would
 * serve, which is what lets the branch be reviewed before the first real note
 * is authored rather than the day it lands.
 */

const seed = (files: Record<string, string>) => {
  __setBucketResolver(async () => ({
    async get(key: string) {
      const text = files[key];
      return text === undefined ? null : { text: async () => text };
    },
  }));
};

beforeEach(() => {
  __clearMemo();
  __setBucketResolver(async () => null);
  // The loader falls through to the CDN on a bucket miss under Node, so the
  // "absent file" tests must not reach the network.
  globalThis.fetch = (async () => new Response("", { status: 404 })) as typeof fetch;
});

const KEY = keys.webMethod("bank", "01_number_series");

test("the key is the documented shape", () => {
  assert.equal(KEY, "gk/aptitude/web-method/bank/01_number_series.json");
  assert.equal(
    keys.webMethod("ssc-railway", "01_number_system_hcf_lcm"),
    "gk/aptitude/web-method/ssc-railway/01_number_system_hcf_lcm.json",
  );
});

test("a fully authored note resolves every field", async () => {
  seed({
    [KEY]: JSON.stringify({
      formula_en: "Next term = previous term $+ d$",
      formula_hi: "अगला पद = पिछला पद $+ d$",
      example_en: "5, 12, 19, 26, ? → each gap is 7, so ? = 33.",
      example_hi: "5, 12, 19, 26, ? → हर अंतराल 7 है, इसलिए ? = 33।",
      mistakes_en: ["Assuming the gap grows when every gap is equal."],
      mistakes_hi: ["यह मान लेना कि अंतर बढ़ रहा है जबकि हर अंतराल समान है।"],
    }),
  });

  const m = await loadWebMethod("bank", "01_number_series");
  assert.ok(m, "an authored note must not resolve to null");
  assert.equal(m.formula_en, "Next term = previous term $+ d$");
  assert.equal(m.formula_hi, "अगला पद = पिछला पद $+ d$");
  assert.equal(m.mistakes_en.length, 1);
  assert.equal(m.mistakes_hi.length, 1);
});

// The normal answer for all 119 live chapters today.
test("an absent file is null, not an error", async () => {
  seed({});
  assert.equal(await loadWebMethod("bank", "01_number_series"), null);
  assert.equal(await loadWebMethod("ssc-railway", "nothing_here"), null);
});

test("malformed JSON is null rather than a thrown page", async () => {
  seed({ [KEY]: "{ not json" });
  assert.equal(await loadWebMethod("bank", "01_number_series"), null);
});

// The whole method-first H1 branch keys off this returning non-null, so a
// file with no formula must read as "not authored" rather than put an H1
// promising a formula over an empty box.
test("a file with no English formula is treated as unauthored", async () => {
  seed({ [KEY]: JSON.stringify({ example_en: "an example with no formula" }) });
  assert.equal(await loadWebMethod("bank", "01_number_series"), null);

  __clearMemo();
  seed({ [KEY]: JSON.stringify({ formula_en: "   ", example_en: "x" }) });
  assert.equal(await loadWebMethod("bank", "01_number_series"), null);
});

test("Hindi falls back to English per field, so a half-translated note still renders", async () => {
  seed({
    [KEY]: JSON.stringify({
      formula_en: "a + d",
      example_en: "worked example",
      mistakes_en: ["one", "two"],
    }),
  });

  const m = await loadWebMethod("bank", "01_number_series");
  assert.ok(m);
  assert.equal(m.formula_hi, "a + d");
  assert.equal(m.example_hi, "worked example");
  assert.deepEqual(m.mistakes_hi, ["one", "two"]);
});

// Hand-authored files are exactly the source that eventually ships the wrong
// type for a field; a blind cast would put `undefined.map` on a live page.
test("wrongly typed fields are coerced, never trusted", async () => {
  seed({
    [KEY]: JSON.stringify({
      formula_en: "a + d",
      example_en: 42,
      mistakes_en: "not an array",
      mistakes_hi: ["real", 7, "", "  spaced  "],
    }),
  });

  const m = await loadWebMethod("bank", "01_number_series");
  assert.ok(m);
  assert.equal(m.example_en, "");
  assert.deepEqual(m.mistakes_en, []);
  assert.deepEqual(m.mistakes_hi, ["real", "spaced"]);
});
