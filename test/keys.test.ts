import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeKey, assertPublishable, keys, normalizeKey } from "../src/lib/content/keys";
import { hasKey, __setIndexForTests, type ContentIndex } from "../src/lib/content/index";

test("encodeKey encodes spaces and ampersands but keeps slashes", () => {
  assert.equal(
    encodeKey("gk/1-Indian History/13-Viceroys & Acts.json"),
    "gk/1-Indian%20History/13-Viceroys%20%26%20Acts.json",
  );
});

test("assertPublishable refuses paid and Pro prefixes", () => {
  for (const k of [
    "mock-content/sbi-clerk/sbi-clerk-mock-05.json",
    "gk/mocks-v2/mock-content/rrb-ntpc-cbt1/mock-02.json",
    "gk/mocks-v2/sectional-content/x.json",
    "gk/mocks-v2/topic-content/x.json",
    "gk/notes/1-Indian History/x.json",
    "gk/master-notes/x.json",
    "gk/oneliners/x.json",
    "gk/aptitude/content/notes/quant/quant_algebra.json",
    "gk/0-Current Affairs/capsule/2026_03.json",
    "gk/0-Current Affairs/magazine/2026_03.pdf",
  ]) {
    assert.throws(() => assertPublishable(k), /refusing/, k);
  }
});

test("assertPublishable allows manifests inside paid prefixes and all free keys", () => {
  assertPublishable("mock-content/manifest.json");
  assertPublishable("gk/topics.json");
  assertPublishable("gk/1-Indian History/1-Indus Valley.json");
  assertPublishable("gk/24-Previous Year Papers/pyq_rrb_ntpc_set01.json");
  assertPublishable("bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation/Set 01.json");
  assertPublishable("gk/0-Current Affairs/daily/2026_09_01.json");
});

test("key builders produce the verified CDN layout", () => {
  assert.equal(keys.topicsManifest(), "gk/topics.json");
  assert.equal(keys.chapterFile("1-Indian History", "1-Indus Valley.json"), "gk/1-Indian History/1-Indus Valley.json");
  assert.equal(keys.pyqPaper("pyq_rrb_ntpc_set", 1), "gk/24-Previous Year Papers/pyq_rrb_ntpc_set01.json");
  assert.equal(keys.pyqPaper("pyq_rrb_ntpc_set", 31), "gk/24-Previous Year Papers/pyq_rrb_ntpc_set31.json");
  assert.equal(
    keys.aptitudeSet("bank", "1-Quantitative Aptitude", "01_number_series", "1-Missing Term", "Foundation/Set 01.json"),
    "bank/1-Quantitative Aptitude/01_number_series/1-Missing Term/Foundation/Set 01.json",
  );
  assert.equal(
    keys.aptitudeSet("ssc-railway", "quant", "01_number_system_hcf_lcm", "1-Divisibility Rules", "Set 01.json"),
    "gk/aptitude/content/quant/01_number_system_hcf_lcm/1-Divisibility Rules/Set 01.json",
  );
  assert.equal(keys.caDaily("2026_09_01"), "gk/0-Current Affairs/daily/2026_09_01.json");
  assert.equal(keys.article("crack-first-attempt.json"), "gk/articles/crack-first-attempt.json");
  assert.equal(keys.appsRegistry(), "apps/registry.json");
  assert.equal(keys.webMethod("bank", "01_number_series"), "gk/aptitude/web-method/bank/01_number_series.json");
});

// 2,136 live bank manifest entries have a folder of ".". The validator stores
// keys normalised (scripts/validate-content.mjs normKey) and hasKey/counts are
// pure string lookups, so the builder must normalise too or every such set
// silently vanishes from the site.
test("aptitudeSet normalises \".\" manifest folders to match the normalised index", () => {
  assert.equal(normalizeKey("bank/2-Data Interpretation/table/./prelims/set_084.json"), "bank/2-Data Interpretation/table/prelims/set_084.json");
  assert.equal(normalizeKey("gk/topics.json"), "gk/topics.json");

  const key = keys.aptitudeSet("bank", "2-Data Interpretation", "table", ".", "prelims/set_084.json");
  assert.equal(key, "bank/2-Data Interpretation/table/prelims/set_084.json");
  assert.ok(!key.split("/").includes("."), "key must carry no \".\" segment");
  assert.equal(
    keys.aptitudeSet("ssc-railway", "quant", ".", "1-Divisibility Rules", "Set 01.json"),
    "gk/aptitude/content/quant/1-Divisibility Rules/Set 01.json",
  );

  // The key it produces is the one the validator actually wrote for that live set.
  const real = JSON.parse(readFileSync(new URL("../src/generated/content-index.json", import.meta.url), "utf8")) as ContentIndex;
  __setIndexForTests(real);
  assert.equal(hasKey(key), true, `${key} must be present in the committed index`);
});
