import { totals } from "./index";

export function siteStats() {
  const t = totals();
  return {
    questions: t.topicQuestions + t.pyqQuestions + t.aptitudeQuestions + t.englishQuestions + t.caQuestions,
    // Every chapter a visitor can browse, aptitude included: a count that can be
    // disproved by browsing the tree is the trust failure these numbers replace.
    chapters: t.topicChapters + t.englishChapters + (t.aptitudeChapters ?? 0),
    papers: t.pyqPapers,
    pyqExams: t.pyqExams,
    caDays: t.caDays,
    articles: t.articles,
    aptitudeSets: t.aptitudeSets,
  };
}

/**
 * Indian digit grouping: 1,98,633. Same in both languages (Devanagari digits
 * are not used), but callers pass the language so the signature does not
 * change if that decision is ever revisited.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function formatCount(n: number, _lang: "en" | "hi"): string {
  if (!Number.isFinite(n)) return "0";
  const s = String(Math.trunc(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}
