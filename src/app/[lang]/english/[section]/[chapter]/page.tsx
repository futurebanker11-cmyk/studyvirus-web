import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  loadTopics,
  englishTopics,
  chaptersOf,
  findChapter,
  adjacentChapters,
  type ChapterInfo,
  type ManifestTopic,
} from "@/lib/content/topics";
import { hasHindiCounts } from "@/lib/content/hindi";
import { setRange } from "@/lib/content/sets";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * One English chapter: every set in it, and its neighbours in the section.
 *
 * Structurally the same page as Task 7's /topics/[slug]/[chapter] — the same
 * chaptersOf/findChapter/adjacentChapters/setRange, the same set grid, the
 * same hasHindiCounts gate. The only differences are the topic list it
 * resolves against (englishTopics, not visibleTopics) and the URL segment
 * (the manifest key verbatim, not topicSlug(key), so no indexed URL moves).
 *
 * ── Static, and how many ──
 *
 * 38 indexed chapters across the three trees × 2 languages = 76 prerendered
 * routes. Both languages render even for the two English-only trees, because
 * the chapter page is a list of links and a Hindi reader browsing to it should
 * get the page plus the English-only note rather than a 404 — the SET pages
 * are where /hi/ actually 404s. src/lib/seo/sitemaps.ts makes the same split:
 * it emits the chapter URL for both langs and gates only the set URLs.
 *
 * ── Sets ──
 *
 * Derived from the indexed English count via the app's own chunking rule, so
 * no chapter file is read to build this page and the "Questions 11–20" labels
 * cannot disagree with the set the reader lands on.
 *
 * No headers(), no cookies(), no <html>.
 */

interface Ctx {
  topic: ManifestTopic;
  info: ChapterInfo;
}

/** The section segment is the manifest key itself — see the file comment. */
function findSection(list: ManifestTopic[], key: string): ManifestTopic | undefined {
  return list.find((tp) => tp.key === key);
}

async function resolve(sectionKey: string, chapterSlug: string): Promise<Ctx | null> {
  const topic = findSection(englishTopics(await loadTopics()), sectionKey);
  if (!topic) return null;
  const info = findChapter(topic, chapterSlug);
  return info ? { topic, info } : null;
}

export async function generateStaticParams() {
  const topics = englishTopics(await loadTopics());
  return LANGS.flatMap((lang) =>
    topics.flatMap((tp) =>
      chaptersOf(tp).map((c) => ({ lang, section: tp.key, chapter: c.slug })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; section: string; chapter: string }>;
}): Promise<Metadata> {
  const { lang: raw, section, chapter } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const ctx = await resolve(section, chapter);
  if (!ctx) return {};
  const { topic, info } = ctx;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const sectionName = lang === "hi" ? topic.hi.name : topic.en.name;
  const hasHi = hasHindiCounts(info.enCount, info.hiCount);

  return {
    title: `${format(lang, "chapter.h1", { chapter: chapterName })} | StudyVirus`,
    description: format(lang, "chapter.lede", {
      questions: formatCount(info.enCount, lang),
      chapter: chapterName,
      subject: sectionName,
      sets: formatCount(info.sets, lang),
    }),
    alternates: buildAlternates({ lang, path: `/english/${section}/${chapter}`, hasHi }),
  };
}

export default async function EnglishChapterPage({
  params,
}: {
  params: Promise<{ lang: string; section: string; chapter: string }>;
}) {
  const { lang: raw, section, chapter } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const ctx = await resolve(section, chapter);
  if (!ctx) notFound();
  const { topic, info } = ctx;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const sectionName = lang === "hi" ? topic.hi.name : topic.en.name;
  const hasHi = hasHindiCounts(info.enCount, info.hiCount);

  // Measured only — setRange reads lengths, never elements — so `{}` per
  // question is enough and the chapter file is not read to build this page.
  const synthetic = Array.from({ length: info.enCount }, () => ({}));
  const sets = Array.from({ length: info.sets }, (_, i) => {
    const n = i + 1;
    return { n, range: setRange(synthetic, n) };
  });

  const { prev, next } = adjacentChapters(topic, info.slug);

  const base = `/english/${section}/${chapter}`;

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.english"), url: abs(href(lang, "/english")) },
    { name: sectionName, url: abs(href(lang, "/english")) + `#s-${topic.key}` },
    { name: chapterName, url: abs(href(lang, base)) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.english")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/english")} className="no-underline hover:underline">
            {t(lang, "nav.english")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          {/* The section has no page of its own — /english lists all three,
              each with an anchor — so the crumb points at that anchor rather
              than at a /english/[section] URL that does not exist. */}
          <Link
            href={href(lang, `/english#s-${topic.key}`)}
            className="no-underline hover:underline"
          >
            {sectionName}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{chapterName}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "chapter.h1", { chapter: chapterName })}
        </h1>

        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "chapter.lede", {
            questions: formatCount(info.enCount, lang),
            chapter: chapterName,
            subject: sectionName,
            sets: formatCount(info.sets, lang),
          })}
        </p>

        {/* LangLink renders nothing when hasHi is false, so the note beside it
            is what tells a reader why there is no Hindi link. Both `english`
            and `english_full` are English-only at the source today, so this
            branch is the normal case here, not an edge one. */}
        <div className="ui mt-4">
          <LangLink lang={lang} path={base} hasHi={hasHi} />
          {!hasHi && (
            <span className="text-sm text-ink-faint">{t(lang, "chapter.hindiOnlyEnglish")}</span>
          )}
        </div>
      </Container>

      {/* ── Every set ──
          All of them, not a first page: each set is a real, linkable,
          crawlable page and a "load more" would hide them from search. */}
      <Container as="section" aria-labelledby="sets" className="pt-10">
        <h2 id="sets" className="font-display text-2xl font-semibold">
          {t(lang, "chapter.setsHeading")}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((s) => (
            <li key={s.n}>
              <Link
                href={href(lang, `${base}/set-${s.n}`)}
                className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
              >
                <span className="font-display text-base font-semibold text-ink group-hover:underline">
                  {t(lang, "common.set")} {formatCount(s.n, lang)}
                </span>
                {s.range && (
                  <span className="ui mt-1 block text-xs text-ink-faint">
                    {format(lang, "chapter.setRange", {
                      from: formatCount(s.range.from, lang),
                      to: formatCount(s.range.to, lang),
                    })}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ── Nearby chapters ── within the same section, in manifest order. */}
      {(prev || next) && (
        <Container as="section" aria-labelledby="nearby" className="pt-12">
          <h2 id="nearby" className="font-display text-2xl font-semibold">
            {t(lang, "chapter.nearbyHeading")}
          </h2>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {[prev, next].filter((c): c is ChapterInfo => Boolean(c)).map((c) => (
              <li key={c.slug}>
                <Link
                  href={href(lang, `/english/${section}/${c.slug}`)}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  {lang === "hi" ? c.chapter.hi : c.chapter.en}
                  <span className="text-xs text-ink-faint">
                    {formatCount(c.sets, lang)} {t(lang, "common.sets")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="pt-10">
        <Link
          href={href(lang, "/english")}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {t(lang, "english.backToAll")}
        </Link>
      </Container>

      <div className="pb-12" />
    </>
  );
}
