import { totals } from "./index";

export function siteStats() {
  const t = totals();
  return {
    questions: t.topicQuestions + t.pyqQuestions + t.aptitudeQuestions + t.englishQuestions + t.caQuestions,
    chapters: t.topicChapters + t.englishChapters,
    papers: t.pyqPapers,
    pyqExams: t.pyqExams,
    caDays: t.caDays,
    articles: t.articles,
    aptitudeSets: t.aptitudeSets,
  };
}

/** Indian digit grouping: 1,98,633. Same in both languages (Devanagari digits are not used). */
export function formatCount(n: number, _lang: "en" | "hi"): string {
  const s = String(Math.trunc(n));
  if (s.length <= 3) return s;
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${rest},${last3}`;
}
