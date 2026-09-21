import type { Metadata } from "next";
import { notFound, permanentRedirect, RedirectType } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  loadTopics,
  englishTopics,
  findChapter,
  type ChapterInfo,
  type ManifestTopic,
} from "@/lib/content/topics";
import { getJson } from "@/lib/content/loader";
import { getSet, setRange, setCount } from "@/lib/content/sets";
import { hasHindiSet } from "@/lib/content/hindi";
import { parseSetParam } from "@/lib/content/slugs";

import SetPageShell from "@/components/site/SetPageShell";
import type { ReportContext } from "@/components/site/ReportError";

/**
 * One English set — the same page Task 7's topic sets render, against the
 * English trees.
 *
 * ── Why this route is NOT statically generated ──
 *
 * 11,320 English questions chunk to well over a thousand sets, each needing
 * its own chapter-file read at build time. `dynamicParams = true` with no
 * generateStaticParams renders them on demand; `revalidate = 3600` caches each
 * for an hour after its first request. Its PARENTS (/english and every chapter
 * page) prerender, so a crawler still reaches every set from a static page.
 * The identical trade-off as topics, PYQ papers and aptitude sets.
 *
 * ── Content shape ──
 *
 * English chapter files are GK-shaped: { en: [...], hi: [...] }, parallel
 * arrays at the FILE level with no per-question Hindi field (verified live
 * against gk/45-English Grammar/1-Synonyms.json and gk/46-English Grammar
 * Basic/1-Synonyms_Basic.json, 2026-09-08). So hasHindiSet() — the file-level
 * test — is the right guard, not hasHindiCounts against an index row, and the
 * language is chosen by WHICH ARRAY is handed to SetPageShell.
 *
 * ── Hindi, which really bites here ──
 *
 * Unlike topics (0 of 809 chapters lack Hindi), two of the three English trees
 * have NO Hindi at all: `english` (8,474 questions, hi 0) and `english_full`
 * (2,185, hi 0). Only `english_basic` (661/661) is bilingual. So /hi/english/
 * english/synonyms/set-1 is a genuine 404 and this branch fires on the great
 * majority of English sets — it is load-bearing, not defensive.
 *
 * ── The tail redirect (spec §5.3) ──
 *
 * /set-99 on a chapter with fewer sets 301s to the last real set rather than
 * 404ing, so a stale or hand-typed number lands on content. Same rule, same
 * permanentRedirect + RedirectType.replace, as every other set-shaped page.
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
 * A discriminated result rather than calling notFound()/redirect() here,
 * because generateMetadata and the component both call it and only the
 * component should throw navigation signals.
 */
async function resolve(
  lang: Lang,
  sectionKey: string,
  chapterParam: string,
  setParam: string,
): Promise<{ kind: "ok"; data: Resolved } | { kind: "missing" } | { kind: "tail"; last: number }> {
  const n = parseSetParam(setParam);
  if (n === null) return { kind: "missing" };

  // The section segment is the manifest key verbatim (english, english_full,
  // english_basic) — the URLs already indexed. See the /english page comment.
  const topic = englishTopics(await loadTopics()).find((tp) => tp.key === sectionKey);
  if (!topic) return { kind: "missing" };

  const info = findChapter(topic, chapterParam);
  if (!info) return { kind: "missing" };

  const file = await getJson<ChapterFile>(info.key);
  if (!file) return { kind: "missing" };

  const en = Array.isArray(file.en) ? file.en : [];
  if (en.length === 0) return { kind: "missing" };

  // Hindi only when the file carries Hindi for EVERY question. Two of the
  // three English trees fail this outright, so /hi/ 404s for them.
  if (lang === "hi" && !hasHindiSet(file)) return { kind: "missing" };

  // Counted on the English array in both languages: it is the authoritative
  // length (hasHindiSet has already guaranteed hi matches it on a Hindi page),
  // so /set-4 is the same four questions in either language.
  const total = setCount(en);
  if (total === 0) return { kind: "missing" };
  if (n > total) return { kind: "tail", last: total };

  const source = lang === "hi" ? (file.hi as Record<string, unknown>[]) : en;
  const questions = getSet(source, n);
  if (!questions || questions.length === 0) return { kind: "missing" };

  return { kind: "ok", data: { topic, info, file, questions, n, total } };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; section: string; chapter: string; set: string }>;
}): Promise<Metadata> {
  const { lang: raw, section, chapter, set } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const r = await resolve(lang, section, chapter, set);
  if (r.kind !== "ok") return {};
  const { info, n, file } = r.data;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const range = setRange(Array.isArray(file.en) ? file.en : [], n);

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
      path: `/english/${section}/${chapter}/set-${n}`,
      // The Hindi twin exists exactly when the file is fully bilingual; the
      // English page must not advertise an hreflang that 404s.
      hasHi: hasHindiSet(file),
    }),
  };
}

export default async function EnglishSetPage({
  params,
}: {
  params: Promise<{ lang: string; section: string; chapter: string; set: string }>;
}) {
  const { lang: raw, section, chapter, set } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const r = await resolve(lang, section, chapter, set);

  // Spec §5.3: past the end of the chapter, 301 to the last real set.
  if (r.kind === "tail") {
    permanentRedirect(
      href(lang, `/english/${section}/${chapter}/set-${r.last}`),
      RedirectType.replace,
    );
  }
  if (r.kind !== "ok") notFound();

  const { topic, info, file, questions, n, total } = r.data;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const sectionName = lang === "hi" ? topic.hi.name : topic.en.name;
  const en = Array.isArray(file.en) ? file.en : [];
  const range = setRange(en, n);

  const base = `/english/${section}/${chapter}`;

  // Real values, not {}: a report filed from here must reach the CMS queue
  // with enough context to triage without finding the file first. setIndex is
  // 0-based per ReportContext's contract while `n` is the 1-based URL number.
  const reportContext: ReportContext = {
    source: "web-english",
    topicFolder: topic.folder,
    topicName: sectionName,
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
        { name: t(lang, "nav.english"), href: href(lang, "/english") },
        { name: sectionName, href: href(lang, `/english#s-${topic.key}`) },
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
      // No app card: the apps registry keys off exam ids and the English trees
      // carry an empty `exams` array in the manifest (verified live), so there
      // is nothing to match. Fabricating a card would mean inventing the app.
      app={null}
    />
  );
}
