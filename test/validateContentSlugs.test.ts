import { test } from "node:test";
import assert from "node:assert/strict";
import { chapterSlug, resolveChapterSlug } from "../src/lib/content/slugs";
import { chapterSlug as scriptChapterSlug, resolveChapterSlug as scriptResolveChapterSlug } from "../scripts/validate-content.mjs";

// scripts/validate-content.mjs must not import the TypeScript build (that
// boundary is deliberate), so it carries its own copies of chapterSlug and
// resolveChapterSlug. The index it writes is keyed on those copies while pages
// route on the src versions: if the two drift, every affected chapter page
// silently 404s. Comments cannot fail CI; this test does.
const cases: Array<[en: string, file: string, position: number]> = [
  ["Indus Valley", "1-Indus Valley.json", 1],                 // Latin name
  ["Viceroys & Acts", "13-Viceroys & Acts.json", 2],          // Latin with punctuation
  ["Synonyms (Basic)", "1-Synonyms_Basic.json", 1],           // Latin with parens
  ["विशेषण", "3-विशेषण.json", 1],                              // Devanagari, leading file number
  ["संज्ञा", "संज्ञा.json", 7],                                  // Devanagari, no leading number -> position
  ["शब्द-शुद्धि", "11-शब्द-शुद्धि.json", 4],                     // reduces to dashes only
  ["क्रिया", "05-क्रिया.json", 2],                              // zero-padded file number
  ["  Spaced   Name ", "9-Spaced.json", 9],                    // trim/collapse path
  ["", "12-blank.json", 3],                                    // empty name
];

test("the validator's chapterSlug mirror agrees with src/lib/content/slugs", () => {
  for (const [en] of cases) {
    assert.equal(scriptChapterSlug(en), chapterSlug(en), `chapterSlug(${JSON.stringify(en)})`);
  }
});

test("the validator's resolveChapterSlug mirror agrees with src/lib/content/slugs", () => {
  for (const [en, file, position] of cases) {
    assert.equal(
      scriptResolveChapterSlug(en, file, position),
      resolveChapterSlug(en, file, position),
      `resolveChapterSlug(${JSON.stringify(en)}, ${JSON.stringify(file)}, ${position})`,
    );
  }
});

test("the shared fixture exercises every branch of resolveChapterSlug", () => {
  const out = cases.map(([en, file, position]) => resolveChapterSlug(en, file, position));
  assert.deepEqual(out, [
    "indus-valley", "viceroys-acts", "synonyms-basic",
    "chapter-3", "chapter-7", "chapter-11", "chapter-5",
    "spaced-name", "chapter-12",
  ]);
});
