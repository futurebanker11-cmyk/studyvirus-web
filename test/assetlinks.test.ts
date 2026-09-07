import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseAssetlinksCsv, assetlinks } from "../src/lib/seo/assetlinks";

const fp = Array.from({ length: 32 }, () => "ab").join(":");

test("parses rows, skips comments/blank, normalises case, rejects bad fingerprints", () => {
  const rows = parseAssetlinksCsv(`package,sha256\n# comment\n\ncom.railwaygk.ntpc,${fp}\ncom.bad,zz:zz\n`);
  assert.deepEqual(rows, [{ package: "com.railwaygk.ntpc", sha256: fp.toUpperCase() }]);
});

test("statements have the App Links shape", () => {
  const s = assetlinks([{ package: "com.x", sha256: fp.toUpperCase() }]) as { relation: string[]; target: { package_name: string; sha256_cert_fingerprints: string[] } }[];
  assert.deepEqual(s[0].relation, ["delegate_permission/common.handle_all_urls"]);
  assert.equal(s[0].target.package_name, "com.x");
  assert.deepEqual(assetlinks([]), []);
});

test("the shipped CSV (header and comments only today) renders a clean empty statement list", () => {
  const csv = readFileSync(join(__dirname, "..", "src", "lib", "content", "assetlinks.csv"), "utf8");
  const rows = parseAssetlinksCsv(csv);
  assert.deepEqual(rows, []);
  assert.equal(JSON.stringify(assetlinks(rows)), "[]");
  // Windows line endings and a header-only file must behave the same way.
  assert.deepEqual(parseAssetlinksCsv("package,sha256\r\n"), []);
  assert.deepEqual(parseAssetlinksCsv(""), []);
});
