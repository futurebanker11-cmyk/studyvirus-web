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

export function dashed(id: string): string {
  return id.replace(/_/g, "-");
}

export function aptitudeChapterSlug(chapterId: string): string {
  return dashed(chapterId.replace(/^\d+_/, ""));
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
