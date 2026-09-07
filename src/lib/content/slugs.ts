// URL slugs. topicSlug/chapterSlug are copied verbatim from the previous
// src/lib/topics.ts so no existing URL moves (spec §4.2).

export function topicSlug(key: string): string {
  return key.replace(/_/g, "-");
}

// Note the `.trim()` position: the live site trims **after** collapsing dashes,
// which leaves a leading/trailing dash for names with leading spaces; no manifest
// chapter has leading/trailing spaces, so trimming first is equivalent for every
// real name and correct for the edge case. The test pins the behaviour.
export function chapterSlug(chapterEn: string): string {
  return chapterEn
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Chapters named only in a non-Latin script (the manifest's `general_hindi`
// topic: संज्ञा, सर्वनाम, …) strip to "" or "-" under chapterSlug, so every such
// chapter would collide on one URL. When that happens the slug comes from the
// chapter file's leading number ("3-विशेषण.json" -> "chapter-3"), which is
// stable across manifest reorders, and only if the file has no leading number
// from the chapter's 1-based position in its topic. Latin names are unchanged.
// scripts/validate-content.mjs mirrors this rule; keep the two in step.
// Deliberately merges two namespaces: a Latin chapter literally named "Chapter 3"
// would collide with a Devanagari chapter whose file starts "3-"; the script's
// assertUnique hard-fails the build if that ever happens.
export function resolveChapterSlug(chapterEn: string, file: string, position: number): string {
  const slug = chapterSlug(chapterEn);
  if (slug.replace(/-/g, "") !== "") return slug;
  const m = /^(\d+)/.exec(file);
  return `chapter-${m ? parseInt(m[1], 10) : position}`;
}

export function dashed(id: string): string {
  return id.replace(/_/g, "-");
}

// Chapter ids are mostly machine-like ("01_number_system_hcf_lcm",
// "R01_blood_relation"), but the live bank previous_year_papers subject uses
// folder names as ids ("2-Data Interpretation", "4-Puzzles & Seating
// Arrangement"). Stripping the numeric prefix and dashing underscores alone let
// those reach the URL with raw spaces and "&", so after the prefix strip the
// result goes through the same character rules as chapterSlug: lowercase,
// non-[a-z0-9 -] dropped, whitespace and dash runs collapsed. Lowercasing also
// turns "R01_…" into "r01-…". scripts/validate-content.mjs mirrors this rule
// and asserts per-subject uniqueness; test/validateContentSlugs.test.ts keeps
// the two in step.
export function aptitudeChapterSlug(chapterId: string): string {
  return chapterSlug(dashed(chapterId.replace(/^\d+[_-]/, "")));
}

const SUBJECT_SLUGS: Record<string, string> = {
  quant: "quant",
  reasoning: "reasoning",
  di: "data-interpretation",
  puzzles: "puzzles",
  english: "english",
  previous_year_papers: "previous-year-questions",
};

export function aptitudeSubjectSlug(subjectId: string): string {
  return SUBJECT_SLUGS[subjectId] ?? dashed(subjectId);
}

export function parseSetParam(param: string): number | null {
  const m = /^set-(\d+)$/.exec(param);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 ? n : null;
}
