import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, t } from "../src/lib/ui/strings";

test("every string has both languages and no empty value", () => {
  for (const [key, val] of Object.entries(STRINGS)) {
    assert.equal(typeof val.en, "string", `${key}.en`);
    assert.equal(typeof val.hi, "string", `${key}.hi`);
    assert.ok(val.en.trim().length > 0, `${key}.en empty`);
    assert.ok(val.hi.trim().length > 0, `${key}.hi empty`);
  }
});

test("t returns the right language", () => {
  assert.equal(t("en", "nav.topics"), "Topics");
  assert.equal(t("hi", "nav.topics"), "विषय");
});

// ── Additional coverage: the qualities that make the Hindi first-class ──

const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * Keys whose Hindi value is legitimately Latin: the audience knows these terms
 * only by their English form (exam codes, file formats), or the value is the
 * *other* language's label by design.
 */
const LATIN_BY_DESIGN = new Set<string>([
  "common.readInHindi", // the toggle always names the language you'd switch TO
  "app.onPlayStore", // "Google Play" is the brand name, kept verbatim
  // The commission is called "SSC" in Hindi coaching material and on its own
  // Hindi paperwork; src/lib/exams.ts likewise carries hi: "SSC CGL". A
  // Devanagari rendering would be a transliteration nobody searches for.
  "cat.ssc",
  // A literal URL, identical in both languages — there is no Hindi rendering
  // of a domain name.
  "privacy.adsChoicesLink",
]);

test("every Hindi value is actually in Devanagari unless Latin is the recognised form", () => {
  for (const [key, val] of Object.entries(STRINGS)) {
    if (LATIN_BY_DESIGN.has(key)) continue;
    assert.ok(
      DEVANAGARI.test(val.hi),
      `${key}.hi is not Devanagari: ${JSON.stringify(val.hi)}`,
    );
  }
});

test("the Hindi is a translation, never a copy of the English", () => {
  for (const [key, val] of Object.entries(STRINGS)) {
    if (LATIN_BY_DESIGN.has(key)) continue;
    assert.notEqual(val.en, val.hi, `${key} was left untranslated`);
  }
});

test("no key is duplicated by value collision in English", () => {
  // Two keys sharing an English string is usually a copy-paste slip.
  const seen = new Map<string, string>();
  for (const [key, val] of Object.entries(STRINGS)) {
    const prior = seen.get(val.en);
    assert.equal(prior, undefined, `"${val.en}" is used by both ${prior} and ${key}`);
    seen.set(val.en, key);
  }
});

test("no value carries stray whitespace at either end", () => {
  for (const [key, val] of Object.entries(STRINGS)) {
    assert.equal(val.en, val.en.trim(), `${key}.en has stray whitespace`);
    assert.equal(val.hi, val.hi.trim(), `${key}.hi has stray whitespace`);
  }
});

test("t is typed against the key union and resolves every key in both languages", () => {
  for (const key of Object.keys(STRINGS) as (keyof typeof STRINGS)[]) {
    assert.equal(t("en", key), STRINGS[key].en);
    assert.equal(t("hi", key), STRINGS[key].hi);
  }
});
