import type { Metadata } from "next";
import { notFound, permanentRedirect, RedirectType } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  loadTopics,
  visibleTopics,
  findTopicBySlug,
  findChapter,
  type ChapterInfo,
  type ManifestTopic,
} from "@/lib/content/topics";
import { getJson } from "@/lib/content/loader";
import { getSet, setRange, setCount } from "@/lib/content/sets";
import { hasHindiSet } from "@/lib/content/hindi";
import { parseSetParam } from "@/lib/content/slugs";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { EXAMS } from "@/lib/exams";

import SetPageShell from "@/components/site/SetPageShell";
import type { ReportContext } from "@/components/site/ReportError";

/**
 * One set of ten (or twenty) questions — the page a search result actually
 * lands on, and the most numerous page on the site.
 *
 * ── Why this route is NOT statically generated ──
 *
 * There are 5,413 topic sets. Two languages makes 10,826 pages, each requiring
 * its own chapter-file read at build time. `dynamicParams = true` with no
 * generateStaticParams renders them on demand instead, and `revalidate = 3600`
 * caches each one for an hour after its first request, so the second visitor
 * to any set gets a cached page. This is the one route in the section where
 * on-demand is right: its PARENTS (index, subject, chapter — 1,744 routes)
 * all prerender, so every set is reachable from a static page and a crawler
 * finds them all without the build having to render them first.
 *
 * ── Set numbering ──
 *
 * getSet/setRange/setCount are the app's own chunking rule, ported verbatim in
 * src/lib/content/sets.ts. The site MUST number sets the way the app does
 * (spec §5.3) or a reader who does "set 4" in the app and "set 4" here gets
 * two different sets of questions.
 *
 * ── The tail redirect (spec §5.3) ──
 *
 * /set-7 on a six-set chapter 301s to /set-6 rather than 404ing. Old URLs from
 * before a chapter shrank, and hand-typed numbers, both land on the last real
 * set instead of a dead end — and a 301 (permanentRedirect, not redirect) is
 * what tells a crawler to stop asking. It applies only when setCount > 0; a
 * chapter with no sets at all has nothing to redirect TO and 404s.
 *
 * ── Hindi ──
 *
 * hasHindiSet() is the spec §4.5 rule: a Hindi page exists only when the file
 * has Hindi for every question, not merely some. When it does not, /hi/… is a
 * 404 rather than a page that silently falls back to English text under a
 * Hindi URL. Every indexed GK chapter is fully bilingual today, so this branch
 * does not fire on current content — it is the guard for content that changes.
 *
 * ── Content shape ──
 *
 * GK chapter files are { en: [...], hi: [...] } — parallel arrays at the FILE
 * level, with no per-question Hindi field. So the language is chosen by which
 * array is passed to SetPageShell, not by anything normaliseQuestion does with
 * a single object. Passing both would render English text on the Hindi page.
 *
 * No headers(), no cookies(), no <html>.
 */

export const dynamicParams = true;
export const revalidate = 3600;

/**
 * Deliberately empty, and load-bearing.
 *
 * `revalidate` alone does NOT enable ISR on a dynamic segment: Next.js only
 * registers a route for incremental static regeneration when it ALSO exports
 * generateStaticParams. Without one, all four [set] routes compiled as pure
 * SSR — absent from both `routes` and `dynamicRoutes` in the prerender
 * manifest — so every request re-rendered at the origin and the response went
 * out as `private, no-cache, no-store`. Measured on the live site: ~0.5-1.8s
 * TTFB per set page, with no x-nextjs-cache header and no improvement on
 * repeat requests, across the ~20,000 URLs that carry the site's content.
 *
 * Returning [] keeps the build cost exactly where the note above wants it —
 * nothing is prerendered ahead of time, the build does not grow — while
 * registering the route for ISR, so the first request renders and the next
 * hour is served from the edge. That is what `revalidate = 3600` was always
 * meant to do.
 */
export function generateStaticParams() {
  return [];
}

interface ChapterFile {
  en?: Record<string, unknown>[];
  hi?: Record<string, unknown>[];
}

interface Resolved {
  topic: ManifestTopic;
  info: ChapterInfo;
  file: ChapterFile;
  /** The array for THIS page's language. */
  questions: Record<string, unknown>[];
  n: number;
  total: number;
}

/**
 * Everything the page needs, or a reason it cannot render.
 *
 * Returns a discriminated result rather than calling notFound()/redirect()
 * itself, because generateMetadata and the page component both call it and
 * only the component should be throwing navigation signals — a
 * permanentRedirect thrown from generateMetadata would fire before the
 * component ever ran and is far harder to reason about.
 */
async function resolve(
  lang: Lang,
  slug: string,
  chapterParam: string,
  setParam: string,
): Promise<
  | { kind: "ok"; data: Resolved }
  | { kind: "missing" }
  | { kind: "tail"; last: number }
> {
  const n = parseSetParam(setParam);
  if (n === null) return { kind: "missing" };

  const topic = findTopicBySlug(visibleTopics(await loadTopics()), slug);
  if (!topic) return { kind: "missing" };

  const info = findChapter(topic, chapterParam);
  if (!info) return { kind: "missing" };

  const file = await getJson<ChapterFile>(info.key);
  if (!file) return { kind: "missing" };

  const en = Array.isArray(file.en) ? file.en : [];
  if (en.length === 0) return { kind: "missing" };

  // Hindi only when the file carries Hindi for EVERY question.
  if (lang === "hi" && !hasHindiSet(file)) return { kind: "missing" };

  // Set counting is done on the English array in both languages: it is the
  // authoritative length (hasHindiSet has already guaranteed hi matches it on
  // a Hindi page), so /set-4 is the same four questions in both languages.
  const total = setCount(en);
  if (total === 0) return { kind: "missing" };
  if (n > total) return { kind: "tail", last: total };

  const source = lang === "hi" ? (file.hi as Record<string, unknown>[]) : en;
  const questions = getSet(source, n);
  if (!questions || questions.length === 0) return { kind: "missing" };

  return { kind: "ok", data: { topic, info, file, questions, n, total } };
}

/** The install card, only when the registry has a real entry. See the chapter page. */
async function appFor(topic: ManifestTopic): Promise<AppEntry | null> {
  const reg = await loadAppsRegistry();
  if (!reg) return null;
  const ids = new Set(topic.exams ?? []);
  for (const e of EXAMS) {
    if (!ids.has(e.id)) continue;
    const app = appForExam(reg, e.id);
    if (app) return app;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string; chapter: string; set: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug, chapter, set } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const r = await resolve(lang, slug, chapter, set);
  if (r.kind !== "ok") return {};
  const { info, n } = r.data;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const range = setRange(Array.isArray(r.data.file.en) ? r.data.file.en : [], n);

  return {
    title: `${format(lang, "set.h1", { chapter: chapterName, n: formatCount(n, lang) })} | StudyVirus`,
    description: format(lang, "set.lede", {
      from: formatCount(range?.from ?? 1, lang),
      to: formatCount(range?.to ?? 1, lang),
      total: formatCount(info.enCount, lang),
      chapter: chapterName,
    }),
    alternates: buildAlternates({
      lang,
      path: `/topics/${slug}/${chapter}/set-${n}`,
      // The Hindi twin exists exactly when the file is fully bilingual; the
      // English page must not advertise an hreflang that 404s.
      hasHi: hasHindiSet(r.data.file),
    }),
  };
}

export default async function TopicSetPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string; chapter: string; set: string }>;
}) {
  const { lang: raw, slug, chapter, set } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const r = await resolve(lang, slug, chapter, set);

  // Spec §5.3: past the end of the chapter, 301 to the last real set.
  // RedirectType.replace so the dead URL does not sit in the reader's history.
  if (r.kind === "tail") {
    permanentRedirect(
      href(lang, `/topics/${slug}/${chapter}/set-${r.last}`),
      RedirectType.replace,
    );
  }
  if (r.kind !== "ok") notFound();

  const { topic, info, file, questions, n, total } = r.data;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const subjectName = lang === "hi" ? topic.hi.name : topic.en.name;
  const en = Array.isArray(file.en) ? file.en : [];
  const range = setRange(en, n);
  const app = await appFor(topic);

  const base = `/topics/${slug}/${chapter}`;

  // Real values, not {}: SetPageShell requires reportContext precisely so a
  // report filed from this page reaches the CMS queue with enough context to
  // triage it without going and finding the file first. setIndex is 0-based
  // per ReportContext's own contract, while `n` is the 1-based set number in
  // the URL — hence the -1.
  const reportContext: ReportContext = {
    source: "web-topics",
    topicFolder: topic.folder,
    topicName: subjectName,
    chapterName,
    setIndex: n - 1,
    fileName: info.chapter.file,
  };

  return (
    <SetPageShell
      lang={lang}
      title={format(lang, "set.h1", { chapter: chapterName, n: formatCount(n, lang) })}
      intro={format(lang, "set.lede", {
        from: formatCount(range?.from ?? 1, lang),
        to: formatCount(range?.to ?? 1, lang),
        total: formatCount(info.enCount, lang),
        chapter: chapterName,
      })}
      crumbs={[
        { name: t(lang, "common.home"), href: href(lang, "/") },
        { name: t(lang, "nav.topics"), href: href(lang, "/topics") },
        { name: subjectName, href: href(lang, `/topics/${slug}`) },
        { name: chapterName, href: href(lang, base) },
        {
          name: `${t(lang, "common.set")} ${formatCount(n, lang)}`,
          href: href(lang, `${base}/set-${n}`),
        },
      ]}
      questions={questions}
      reportContext={reportContext}
      // Continuous numbering across the chapter: set 2 starts at question 11,
      // matching the "Questions 11–20" label the chapter page showed.
      startNumber={range?.from ?? 1}
      prev={n > 1 ? href(lang, `${base}/set-${n - 1}`) : null}
      next={n < total ? href(lang, `${base}/set-${n + 1}`) : null}
      indexHref={href(lang, base)}
      langPath={`${base}/set-${n}`}
      hasHi={hasHindiSet(file)}
      app={app}
    />
  );
}
