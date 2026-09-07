import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

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

test("the home page renders no hand-written question total", () => {
  const page = readFileSync(join(ROOT, "src/app/[lang]/page.tsx"), "utf8");
  // Any 4+ digit literal in JSX text would be a typed-in count. The real
  // totals reach the page only through formatCount(siteStats()...).
  assert.match(page, /formatCount\(/, "the home page must format its counts");
  assert.match(page, /siteStats\(\)/, "the home page must derive its counts");
  assert.doesNotMatch(
    page.replace(/\/\*[\s\S]*?\*\//g, ""),
    />[^<]*\b\d{4,}\b[^<]*</,
    "a four-digit literal in the home page's markup is a hand-written count",
  );
});
