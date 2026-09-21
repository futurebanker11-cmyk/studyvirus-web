import type { Metadata } from "next";
import { notFound, permanentRedirect, RedirectType } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  FAMILIES,
  loadFamily,
  findSubject,
  findAptChapter,
  findType,
  setsOf,
  questionsOf,
  type AptFamilyInfo,
  type AptSetInfo,
  type AptitudeFamily,
} from "@/lib/content/aptitude";
import { getJson } from "@/lib/content/loader";
import { hasHindiCounts } from "@/lib/content/hindi";
import { parseSetParam } from "@/lib/content/slugs";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { EXAMS } from "@/lib/exams";

import SetPageShell from "@/components/site/SetPageShell";
import type { ReportContext } from "@/components/site/ReportError";

/**
 * One set of aptitude questions, with the worked solution, the shortcut and
 * the trap under each.
 *
 * ── This page renders almost nothing itself, deliberately ──
 *
 * SetPageShell (Task 6) owns the layout, and the Question component inside it
 * already renders, in this exact order, for any question normaliseQuestion()
 * resolves: stem → options → answer → explanation → shortcut (only when
 * present) → trap warning (only when present, as a warning callout). KaTeX
 * runs server-side in <Math>; explanationBlocks() does the bullet/sub-bullet
 * parsing; stripVisualHints() removes the app-only 📊 [VISUAL:…] and DATA:
 * lines. All of that is shared infrastructure from Tasks 2 and 6. This file's
 * whole job is to resolve family/subject/chapter/type/set to the real question
 * array and hand it over — re-implementing any of the above would be a second,
 * divergent renderer for the same content.
 *
 * ── Content shape ──
 *
 * An aptitude set file is `{ …metadata, questions: [ … ] }`: ONE array, each
 * object carrying both languages on itself (`question`/`question_hi`,
 * `options`/`options_hi`, `solution_conventional(_hi)`, …). This is NOT the
 * GK/PYQ `{en:[…], hi:[…]}` file-level split, so the whole array is handed to
 * the shell in both languages and normaliseQuestion picks the right fields per
 * question from `lang`.
 *
 * ── Hindi ──
 *
 * Because language is a property of each QUESTION here rather than of the
 * file, hasHindiSet() — which looks for file-level `en`/`hi` arrays — is the
 * wrong test and would report "no Hindi" for every aptitude set. The right one
 * is hasHindiCounts(enCount, hiCount) against the content index's pre-scanned
 * per-file pair, which is exactly "does every question in this file have real
 * Hindi". It matters: 3,272 of the 4,766 live tier-1 sets fail it today, so
 * the /hi/ 404 is the common case, not an edge case. The same test gates the
 * Hindi sitemap (src/lib/seo/sitemaps.ts), so the two agree by construction.
 *
 * ── Why this route is NOT statically generated ──
 *
 * 4,766 real tier-1 sets × 2 languages is far too many to prerender, the same
 * call Tasks 7 and 8 made. `dynamicParams = true` with no generateStaticParams
 * renders on demand; `revalidate = 3600` caches each page for an hour after
 * its first request. Its parents all prerender, so every set is reachable from
 * a static page and a crawler finds them without this route being built ahead.
 *
 * ── The tail case, and why n ± 1 is safe here ──
 *
 * setsOf() assigns a SYNTHETIC n — `out.length + 1` as it walks the type's
 * indexed tier-1 files — so the numbering is guaranteed contiguous 1..length
 * with no gaps, unlike PYQ's papersOf(), whose n is the real declared paper
 * number and can skip. That makes both the `n > sets.length` tail redirect and
 * the n ± 1 pager below correct by construction here. (Confirmed by reading
 * setsOf, not assumed: a wrong assumption in exactly this spot was the bug
 * Task 8's review found in the PYQ page.)
 *
 * No headers(), no cookies(), no <html>.
 */

export const dynamicParams = true;
export const revalidate = 3600;

const isFamily = (x: string): x is AptitudeFamily =>
  (FAMILIES as readonly string[]).includes(x);

/**
 * Two file shapes live under bank/, and this route must accept BOTH.
 *
 * `{ questions: [...] }` — each object carries both languages on itself
 * (question/question_hi, options/options_hi, …). All of quant, di and puzzles,
 * plus part of reasoning and previous_year_papers: 2,689 sets.
 *
 * `{ en: [...], hi: [...] }` — the file-level split the PYQ and topic routes
 * already read. All 678 english sets, 222 reasoning and 827
 * previous_year_papers: 1,727 sets.
 *
 * Reading only `questions` is what took those 1,727 sets off the web: the
 * index counted them (so hubs advertised "678 practice sets" and the sitemap
 * declared every URL), but this resolver saw no `questions` array and called
 * notFound() on each one. normaliseQuestion() has always handled both shapes —
 * see its header — so accepting the second shape here is all that was missing.
 */
interface SetFile {
  questions?: Record<string, unknown>[];
  en?: Record<string, unknown>[];
  hi?: Record<string, unknown>[];
  title?: { en?: string; hi?: string };
}

interface Resolved {
  info: AptFamilyInfo;
  set: AptSetInfo;
  /** Every set of this type, for the pager and the tail check. */
  siblings: AptSetInfo[];
  questions: Record<string, unknown>[];
}

type Outcome =
  | { kind: "ok"; data: Resolved }
  | { kind: "missing" }
  | { kind: "tail"; last: number };

async function resolve(
  lang: Lang,
  family: string,
  subject: string,
  chapter: string,
  type: string,
  setParam: string,
): Promise<Outcome> {
  if (!isFamily(family)) return { kind: "missing" };
  const n = parseSetParam(setParam);
  if (n === null) return { kind: "missing" };

  const info = await loadFamily(family);
  const subj = findSubject(info, subject);
  if (!subj) return { kind: "missing" };
  const chap = findAptChapter(subj, chapter);
  if (!chap) return { kind: "missing" };
  const ty = findType(chap, type);
  if (!ty) return { kind: "missing" };

  const siblings = setsOf(family, subj, chap, ty);
  if (siblings.length === 0) return { kind: "missing" };
  // Safe because setsOf's n is synthetic and contiguous — see the note above.
  if (n > siblings.length) return { kind: "tail", last: siblings.length };

  const set = siblings.find((s) => s.n === n);
  if (!set) return { kind: "missing" };

  // The spec §4.5 Hindi rule, on the counts the index scanned for this exact
  // file. Checked BEFORE the file is fetched: a Hindi request for a set with
  // partial Hindi 404s rather than rendering English under a Hindi URL.
  if (lang === "hi" && !hasHindiCounts(set.enCount, set.hiCount)) return { kind: "missing" };

  const file = await getJson<SetFile>(set.key);
  if (!file) return { kind: "missing" };

  // Both file shapes, resolved in one place (see questionsOf).
  const questions = questionsOf(file, lang);
  if (questions.length === 0) return { kind: "missing" };

  return { kind: "ok", data: { info, set, siblings, questions } };
}

/**
 * The one install card: a registry entry for an exam this family is for.
 *
 * loadAppsRegistry() returns null in production today (Task 5 verified this),
 * so the normal outcome is no card at all — SetPageShell omits the section
 * rather than inventing a name and an icon. The exam list is the same
 * category → family mapping the exam hub and the chapter page use.
 */
async function appFor(family: AptitudeFamily): Promise<AppEntry | null> {
  const reg = await loadAppsRegistry();
  if (!reg) return null;
  const cats = family === "bank" ? ["bank"] : ["ssc", "railway"];
  for (const e of EXAMS) {
    if (!cats.includes(e.category)) continue;
    const app = appForExam(reg, e.id);
    if (app) return app;
  }
  return null;
}

/** The H1, which is also the tab title. */
function heading(lang: Lang, set: AptSetInfo) {
  return format(lang, "aptSet.h1", {
    chapter: lang === "hi" ? set.chapter.name.hi : set.chapter.name.en,
    type: lang === "hi" ? set.type.name.hi : set.type.name.en,
    n: formatCount(set.n, lang),
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    lang: string;
    family: string;
    subject: string;
    chapter: string;
    type: string;
    set: string;
  }>;
}): Promise<Metadata> {
  const { lang: raw, family, subject, chapter, type, set } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const r = await resolve(lang, family, subject, chapter, type, set);
  if (r.kind !== "ok") return {};
  const { set: info } = r.data;

  return {
    title: `${heading(lang, info)} | StudyVirus`,
    description: format(lang, "aptSet.lede", {
      total: formatCount(r.data.questions.length, lang),
    }),
    alternates: buildAlternates({
      lang,
      path: `/aptitude/${family}/${subject}/${chapter}/${type}/set-${info.n}`,
      hasHi: hasHindiCounts(info.enCount, info.hiCount),
    }),
  };
}

export default async function AptitudeSetPage({
  params,
}: {
  params: Promise<{
    lang: string;
    family: string;
    subject: string;
    chapter: string;
    type: string;
    set: string;
  }>;
}) {
  const { lang: raw, family, subject, chapter, type, set } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const base = `/aptitude/${family}/${subject}/${chapter}`;
  const typeBase = `${base}/${type}`;

  const r = await resolve(lang, family, subject, chapter, type, set);

  // Past the end of this type's real sets: 308 to the last one rather than
  // 404, the same rule Tasks 7 and 8 apply to a hand-typed or stale number.
  if (r.kind === "tail") {
    permanentRedirect(href(lang, `${typeBase}/set-${r.last}`), RedirectType.replace);
  }
  if (r.kind !== "ok") notFound();

  const { info, set: setInfo, siblings, questions } = r.data;
  const app = await appFor(info.family);

  const chapterName = lang === "hi" ? setInfo.chapter.name.hi : setInfo.chapter.name.en;
  const subjectName = lang === "hi" ? setInfo.subject.name.hi : setInfo.subject.name.en;
  const typeName = lang === "hi" ? setInfo.type.name.hi : setInfo.type.name.en;
  const familyName = lang === "hi" ? info.name.hi : info.name.en;

  // n ± 1 is correct here and only here: setsOf's n is contiguous 1..length.
  const prev = setInfo.n > 1 ? `${typeBase}/set-${setInfo.n - 1}` : null;
  const next = setInfo.n < siblings.length ? `${typeBase}/set-${setInfo.n + 1}` : null;

  // Real values, not {}: reportContext is required by SetPageShell precisely
  // so a report filed here lands in the CMS queue with enough to triage
  // without going and finding the file first. The bank's own folder key is
  // the topicFolder; the chapter line carries the type, which is what tells a
  // triager which of a chapter's several same-named types this was.
  const reportContext: ReportContext = {
    source: "web-aptitude",
    topicFolder: `${info.family}/${setInfo.subject.folder}`,
    topicName: `${familyName} — ${subjectName}`,
    chapterName: `${chapterName} — ${typeName} — ${t(lang, "common.set")} ${setInfo.n}`,
    setIndex: setInfo.n - 1,
    fileName: setInfo.key,
  };

  return (
    <SetPageShell
      lang={lang}
      title={heading(lang, setInfo)}
      intro={format(lang, "aptSet.lede", { total: formatCount(questions.length, lang) })}
      crumbs={[
        { name: t(lang, "common.home"), href: href(lang, "/") },
        { name: t(lang, "nav.aptitude"), href: href(lang, "/aptitude") },
        { name: familyName, href: href(lang, `/aptitude/${family}`) },
        { name: subjectName, href: href(lang, `/aptitude/${family}/${subject}`) },
        { name: chapterName, href: href(lang, base) },
        {
          name: `${typeName} — ${t(lang, "common.set")} ${formatCount(setInfo.n, lang)}`,
          href: href(lang, `${typeBase}/set-${setInfo.n}`),
        },
      ]}
      questions={questions}
      reportContext={reportContext}
      prev={prev ? href(lang, prev) : null}
      next={next ? href(lang, next) : null}
      indexHref={href(lang, base)}
      langPath={`${typeBase}/set-${setInfo.n}`}
      hasHi={hasHindiCounts(setInfo.enCount, setInfo.hiCount)}
      app={app}
    />
  );
}
