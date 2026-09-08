import type { Metadata } from "next";
import { notFound, permanentRedirect, RedirectType } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { loadPyqExams, papersOf, findPaper, findPyqBySlug, type PyqExam, type PyqPaper } from "@/lib/content/pyq";
import { pyqSlugOverrides } from "@/lib/content/examFacts";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { getJson } from "@/lib/content/loader";
import { hasHindiSet } from "@/lib/content/hindi";
import { parseSetParam } from "@/lib/content/slugs";

import SetPageShell from "@/components/site/SetPageShell";
import type { ReportContext } from "@/components/site/ReportError";

/**
 * One full previous-year paper — a whole set (25, 30 or 40 questions,
 * whatever that paper actually has — never assumed) on one page, via
 * SetPageShell (Task 6).
 *
 * ── Why this route is NOT statically generated ──
 *
 * Same reasoning as Task 7's topic set pages: too many real papers to render
 * at build time to be worth the build cost. `dynamicParams = true` with no
 * generateStaticParams renders on demand; `revalidate = 3600` caches each page
 * for an hour after its first request. Its parents (/pyq and /pyq/[exam]) DO
 * prerender, so every paper is still reachable from a static page and a
 * crawler finds them all without this route being built ahead of time.
 *
 * ── Content shape ──
 *
 * PYQ paper files are GK-shaped: { en: [...], hi: [...] }, parallel arrays at
 * the file level (see normaliseQuestion.ts's own note on this). The page
 * picks whichever array matches its language and hands it whole to
 * SetPageShell — a PYQ paper is one page, not chunked into further sets the
 * way a topic chapter is.
 *
 * ── Hindi ──
 *
 * hasHindiSet() is the spec §4.5 rule: Hindi exists only when the file has
 * Hindi for every question in it, so PyqPaper.hiCount === PyqPaper.enCount is
 * the same test applied to the counts already indexed for this paper — a
 * partially-translated paper 404s under /hi/ rather than silently mixing
 * English into a Hindi page.
 *
 * ── The tail case ──
 *
 * /pyq/[exam]/set-99 on an exam with fewer real papers redirects (308, via
 * permanentRedirect) to the last real one, mirroring Task 7's chapter-set
 * tail redirect — a hand-typed or stale set number lands on the last real
 * paper instead of a dead end. "Last" is the highest paper number actually
 * present, not papersOf(exam).length: papersOf() skips any n missing from
 * the content index, so a gapped exam's last real paper can have n greater
 * than its paper count.
 *
 * No headers(), no cookies(), no <html>.
 */

export const dynamicParams = true;
export const revalidate = 3600;

interface PaperFile {
  en?: Record<string, unknown>[];
  hi?: Record<string, unknown>[];
}

interface Resolved {
  exam: PyqExam;
  paper: PyqPaper;
  file: PaperFile;
  questions: Record<string, unknown>[];
}

async function resolve(
  lang: Lang,
  examSlug: string,
  setParam: string,
): Promise<
  | { kind: "ok"; data: Resolved; exam: PyqExam }
  | { kind: "missing" }
  | { kind: "tail"; exam: PyqExam; last: number }
> {
  const n = parseSetParam(setParam);
  const exams = await loadPyqExams();
  const exam = findPyqBySlug(exams, examSlug, pyqSlugOverrides());
  if (!exam) return { kind: "missing" };
  if (n === null) return { kind: "missing" };

  // papersOf() skips any n whose file is absent from the content index, so
  // the array can have gaps — its length is a COUNT, not the highest real
  // paper number, and its last element is not guaranteed to be paper n ===
  // papers.length. The tail redirect and the prev/next pager below must
  // therefore key off the real papers actually present, never off n ± 1 or
  // off papers.length as if paper numbering were contiguous.
  const papers = papersOf(exam);
  if (papers.length === 0) return { kind: "missing" };
  const lastPaper = papers[papers.length - 1];
  if (n > lastPaper.n) return { kind: "tail", exam, last: lastPaper.n };

  const paper = findPaper(exam, n);
  if (!paper) return { kind: "missing" };

  const file = await getJson<PaperFile>(paper.key);
  if (!file) return { kind: "missing" };

  const en = Array.isArray(file.en) ? file.en : [];
  if (en.length === 0) return { kind: "missing" };

  // Hindi only when the file carries Hindi for EVERY question — the same
  // guard Task 7 applies to topic sets, tested here against the file itself
  // rather than the pre-computed enCount/hiCount (which come from the same
  // source but a fresh read is what the page is actually about to render).
  if (lang === "hi" && !hasHindiSet(file)) return { kind: "missing" };

  const questions = lang === "hi" ? (file.hi as Record<string, unknown>[]) : en;
  if (!questions || questions.length === 0) return { kind: "missing" };

  return { kind: "ok", data: { exam, paper, file, questions }, exam };
}

/** The install card: a registry match for this exam's id, or null. */
async function appFor(examId: string): Promise<AppEntry | null> {
  const reg = await loadAppsRegistry();
  if (!reg) return null;
  return appForExam(reg, examId) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; exam: string; set: string }>;
}): Promise<Metadata> {
  const { lang: raw, exam: examSlug, set } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const r = await resolve(lang, examSlug, set);
  if (r.kind !== "ok") return {};
  const { exam, paper, file } = r.data;

  const name = lang === "hi" ? exam.hi : exam.en;

  return {
    title: `${format(lang, "pyqSet.h1", { exam: name, n: formatCount(paper.n, lang) })} | StudyVirus`,
    description: format(lang, "pyqSet.lede", { total: formatCount(paper.enCount, lang) }),
    alternates: buildAlternates({
      lang,
      path: `/pyq/${examSlug}/set-${paper.n}`,
      hasHi: hasHindiSet(file),
    }),
  };
}

export default async function PyqSetPage({
  params,
}: {
  params: Promise<{ lang: string; exam: string; set: string }>;
}) {
  const { lang: raw, exam: examSlug, set } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const r = await resolve(lang, examSlug, set);

  // Past the end of the exam's real papers: 301 to the last one rather than
  // 404, the same rule Task 7 applies to a chapter's tail set.
  if (r.kind === "tail") {
    permanentRedirect(href(lang, `/pyq/${examSlug}/set-${r.last}`), RedirectType.replace);
  }
  if (r.kind !== "ok") notFound();

  const { exam, paper, file, questions } = r.data;
  const name = lang === "hi" ? exam.hi : exam.en;
  const papers = papersOf(exam);
  // Indexed by position in the real papers array, not by paper.n ± 1: a
  // gapped exam (papers 1,2,4,5) would otherwise link "next" from paper 2 to
  // a nonexistent paper 3 and 404 a reader straight off a working page.
  const posInPapers = papers.findIndex((p) => p.n === paper.n);
  const prevPaper = posInPapers > 0 ? papers[posInPapers - 1] : null;
  const nextPaper = posInPapers >= 0 && posInPapers < papers.length - 1 ? papers[posInPapers + 1] : null;
  const app = await appFor(exam.id);

  const base = `/pyq/${examSlug}`;

  // Real values, not {}: reportContext is required by SetPageShell precisely
  // so a report filed from this page reaches the CMS queue with enough to
  // triage without going and finding the paper file first.
  const reportContext: ReportContext = {
    source: "web-pyq",
    topicFolder: exam.id,
    topicName: name,
    chapterName: `${name} — ${t(lang, "common.set")} ${paper.n}`,
    setIndex: paper.n - 1,
    fileName: paper.key,
  };

  return (
    <SetPageShell
      lang={lang}
      title={format(lang, "pyqSet.h1", { exam: name, n: formatCount(paper.n, lang) })}
      intro={format(lang, "pyqSet.lede", { total: formatCount(paper.enCount, lang) })}
      crumbs={[
        { name: t(lang, "common.home"), href: href(lang, "/") },
        { name: t(lang, "nav.pyq"), href: href(lang, "/pyq") },
        { name, href: href(lang, base) },
        {
          name: `${t(lang, "common.set")} ${formatCount(paper.n, lang)}`,
          href: href(lang, `${base}/set-${paper.n}`),
        },
      ]}
      questions={questions}
      reportContext={reportContext}
      prev={prevPaper ? href(lang, `${base}/set-${prevPaper.n}`) : null}
      next={nextPaper ? href(lang, `${base}/set-${nextPaper.n}`) : null}
      indexHref={href(lang, base)}
      langPath={`${base}/set-${paper.n}`}
      hasHi={hasHindiSet(file)}
      app={app}
    />
  );
}

