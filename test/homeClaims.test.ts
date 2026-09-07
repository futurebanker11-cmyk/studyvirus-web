import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { generateMetadata } from "../src/app/[lang]/page";

/**
 * The rebuild exists because the old site made claims about itself that its own
 * content disproved: "200,000+" in the home <title> against "23K+" in the same
 * hero, "10 Lakh+ Students" and a "4.5 Rating" that nothing could produce, and
 * an unearned "#1". Every number the rebuilt pages show is computed from the
 * content index instead.
 *
 * A rebuilt page cannot be trusted to stay honest by review alone: the leak
 * that prompted this test was not in a page at all but in the ROOT LAYOUT's
 * openGraph/twitter defaults, which every page inherits silently — the new home
 * page served "1,93,431" in its <title> and "200,000+" in its og:image:alt at
 * the same time, and nothing failed.
 *
 * So this asserts the property over the source of the rebuilt surface (the
 * [lang] tree, the shared chrome, the metadata defaults) rather than over one
 * file. It deliberately does NOT police the legacy pages still awaiting their
 * own rebuild tasks; those are listed as known debt so the exemption is
 * visible and shrinks as the plan lands.
 */

const ROOT = join(__dirname, "..");

/** Marketing claims no count in the content index can produce. */
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
  { pattern: /200,?000\+/, why: "a question total the index contradicts" },
  { pattern: /10\s*Lakh\+/i, why: "an unfalsifiable student count" },
  { pattern: /\bNo\.\s?1\b/i, why: "an unearned ranking claim" },
  // "#1" only where it is a ranking, never the hex colours the token layer
  // writes (#14161a) or a fragment link (#1-foo).
  { pattern: /#1(?![0-9a-fA-F])/, why: "an unearned ranking claim" },
  { pattern: /India'?s largest/i, why: "a superlative nothing verifies" },
];

/** Files the rebuild owns today. Legacy pages get theirs as their tasks land. */
const REBUILT = [
  "src/app/layout.tsx",
  "src/app/[lang]",
  "src/components/site",
  "src/lib/ui/strings.ts",
];

function filesUnder(rel: string): string[] {
  const abs = join(ROOT, rel);
  if (!statSync(abs).isDirectory()) return [abs];
  return readdirSync(abs, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? filesUnder(join(rel, e.name)) : [join(abs, e.name)],
  );
}

test("no rebuilt page or shared default makes a claim the content cannot support", () => {
  const files = REBUILT.flatMap(filesUnder).filter((f) => /\.tsx?$/.test(f));
  assert.ok(files.length > 0, "found no rebuilt source files to check");

  for (const file of files) {
    const src = readFileSync(file, "utf8");
    // Comments explain what was removed and necessarily quote it, so they are
    // stripped before the check rather than exempted file by file.
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:])\/\/.*$/gm, "$1");

    for (const { pattern, why } of FORBIDDEN) {
      assert.ok(
        !pattern.test(code),
        `${file.slice(ROOT.length + 1)} contains ${pattern} — ${why}`,
      );
    }
  }
});

// Regression test for a defect found in Plan B Task 4 review (2026-09-08):
// the Hindi page's <title> was hard-coded in English while its H1 and
// description on the same response correctly rendered in Hindi — a searcher
// saw an English SERP title over a Hindi snippet, and the hreflang alternates
// advertised a hi-IN page whose title was in the wrong language. The bug
// existed only in generateMetadata; no source-text regex over the file would
// have caught it, since "200,000+"-class checks look for a wrong claim, not
// for a missing translation branch. This calls the real function instead.
test("the home page's <title> localises to Hindi on /hi, exactly like its H1 and description", async () => {
  const en = await generateMetadata({ params: Promise.resolve({ lang: "en" }) });
  const hi = await generateMetadata({ params: Promise.resolve({ lang: "hi" }) });

  assert.ok(typeof en.title === "string" && en.title.length > 0, "en title must be a non-empty string");
  assert.ok(typeof hi.title === "string" && hi.title.length > 0, "hi title must be a non-empty string");
  assert.notEqual(hi.title, en.title, "the hi <title> must not be byte-identical to the en one");

  // Devanagari block: U+0900–U+097F. A title with none of it is not Hindi.
  const DEVANAGARI = /[ऀ-ॿ]/;
  assert.match(
    hi.title as string,
    DEVANAGARI,
    "the hi <title> contains no Devanagari — it is still the English string",
  );
  assert.doesNotMatch(
    en.title as string,
    DEVANAGARI,
    "the en <title> should not contain Devanagari",
  );
});

test("the home page renders no hand-written question total", () => {
  const page = readFileSync(join(ROOT, "src/app/[lang]/page.tsx"), "utf8");
  // Any 4+ digit literal in JSX text would be a typed-in count. The real
  // totals reach the page only through formatCount(siteStats()...).
  assert.match(page, /formatCount\(/, "the home page must format its counts");
  assert.match(page, /siteStats\(\)/, "the home page must derive its counts");
  // Strip both comment styles, same as the sibling test above — a `//`
  // comment legitimately containing a date or a code reference (e.g. "Caught
  // in ... review, 2026-09-08") is not a hand-written count, and without this
  // the regex below has no closing `<` to stop at until the next real JSX
  // tag, so it can span hundreds of lines of code past the comment and flag
  // something else entirely.
  const code = page
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
  assert.doesNotMatch(
    code,
    />[^<]*\b\d{4,}\b[^<]*</,
    "a four-digit literal in the home page's markup is a hand-written count",
  );
});
