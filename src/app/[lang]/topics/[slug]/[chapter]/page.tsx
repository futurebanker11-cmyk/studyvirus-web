import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  loadTopics,
  visibleTopics,
  findTopicBySlug,
  chaptersOf,
  findChapter,
  adjacentChapters,
  type ChapterInfo,
  type ManifestTopic,
} from "@/lib/content/topics";
import { topicSlug } from "@/lib/content/slugs";
import { hasHindiCounts } from "@/lib/content/hindi";
import { setRange } from "@/lib/content/sets";
import { loadPyqExams, papersOf, pyqSlug } from "@/lib/content/pyq";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { pyqSlugOverrides } from "@/lib/content/examFacts";
import { EXAMS } from "@/lib/exams";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";

/**
 * A chapter: every set in it, its neighbours, and where the same material is
 * asked in real papers.
 *
 * ── Static, and how many ──
 *
 * generateStaticParams enumerates EVERY indexed chapter of every visible
 * subject × both languages — 809 × 2 today. That is the largest prerendered
 * surface in the plan and it is the right call here: a chapter page is a fixed
 * list of set links derived entirely from the content index, with no per-set
 * file read, so it costs the build almost nothing and gives a crawler a fully
 * static page. Its CHILDREN (the sets) are the opposite case and are rendered
 * on demand — see the sibling [set]/page.tsx for why.
 *
 * ── The set list ──
 *
 * chaptersOf() already computed `sets` from the indexed English count using
 * the app's own chunking rule (10 + 10 … + a final 20). setRange() is called
 * per set against a synthetic array of that same length, which yields the
 * "Questions 11–20" label without reading the chapter file. Numbers and file
 * therefore agree by construction: both derive from the one count.
 *
 * ── hasHi ──
 *
 * hasHindiCounts(enCount, hiCount) — the spec's rule that a Hindi page exists
 * only when the source has Hindi for EVERY question, not merely some. Every
 * indexed GK chapter satisfies it today (checked 2026-09-08: 0 of 809 have a
 * partial or absent Hindi array), but the branch is real, not decorative: the
 * Hindi page renders a note and drops the language switch when it is false,
 * and the set pages 404 outright.
 *
 * No headers(), no cookies(), no <html>.
 */

interface Ctx {
  topic: ManifestTopic;
  info: ChapterInfo;
}

async function resolve(slug: string, chapterSlugParam: string): Promise<Ctx | null> {
  const topic = findTopicBySlug(visibleTopics(await loadTopics()), slug);
  if (!topic) return null;
  const info = findChapter(topic, chapterSlugParam);
  return info ? { topic, info } : null;
}

/**
 * The PYQ hubs for the exams that set this subject, at most three.
 *
 * "Top three" is by paper count: the exam with 180 real papers on the site is
 * a more useful link than one with 4. Only exams that BOTH list this subject
 * in the manifest and have indexed papers survive, so every link lands on a
 * page with papers on it.
 */
async function pyqLinks(topic: ManifestTopic, lang: Lang) {
  const ids = new Set(topic.exams ?? []);
  const [pyqExams] = await Promise.all([loadPyqExams()]);
  const overrides = pyqSlugOverrides();

  return pyqExams
    .filter((p) => ids.has(p.id))
    .map((p) => ({ exam: p, papers: papersOf(p).length, slug: pyqSlug(p, overrides) }))
    .filter((p) => p.papers > 0)
    .sort((a, b) => b.papers - a.papers)
    .slice(0, 3)
    .map((p) => ({
      href: href(lang, `/pyq/${p.slug}`),
      name: lang === "hi" ? p.exam.hi : p.exam.en,
      papers: p.papers,
    }));
}

/**
 * The one install card, when the registry has a real entry for an exam that
 * sets this subject.
 *
 * loadAppsRegistry() returns null in production today (Task 5 verified this),
 * so the normal outcome is no card at all. That is deliberate: AppCard needs a
 * real AppEntry, and fabricating one would mean inventing a name and an icon.
 * The exam-hub page's PlainInstall fallback is not reused here — a chapter
 * page is not install-first, and one dead-looking button at the bottom of it
 * is worse than nothing.
 */
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

export async function generateStaticParams() {
  const topics = visibleTopics(await loadTopics());
  return LANGS.flatMap((lang) =>
    topics.flatMap((tp) =>
      chaptersOf(tp).map((c) => ({ lang, slug: topicSlug(tp.key), chapter: c.slug })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string; chapter: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug, chapter } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const ctx = await resolve(slug, chapter);
  if (!ctx) return {};
  const { topic, info } = ctx;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const subjectName = lang === "hi" ? topic.hi.name : topic.en.name;
  const hasHi = hasHindiCounts(info.enCount, info.hiCount);

  return {
    title: `${format(lang, "chapter.h1", { chapter: chapterName })} | StudyVirus`,
    description: format(lang, "chapter.lede", {
      questions: formatCount(info.enCount, lang),
      chapter: chapterName,
      subject: subjectName,
      sets: formatCount(info.sets, lang),
    }),
    alternates: buildAlternates({ lang, path: `/topics/${slug}/${chapter}`, hasHi }),
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string; chapter: string }>;
}) {
  const { lang: raw, slug, chapter } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const ctx = await resolve(slug, chapter);
  if (!ctx) notFound();
  const { topic, info } = ctx;

  const chapterName = lang === "hi" ? info.chapter.hi : info.chapter.en;
  const subjectName = lang === "hi" ? topic.hi.name : topic.en.name;
  const hasHi = hasHindiCounts(info.enCount, info.hiCount);

  const [pyq, app] = await Promise.all([pyqLinks(topic, lang), appFor(topic)]);

  // The set list. The synthetic array is only ever measured — setRange reads
  // lengths, never elements — so `{}` per question is enough and no chapter
  // file is read to build this page.
  const synthetic = Array.from({ length: info.enCount }, () => ({}));
  const sets = Array.from({ length: info.sets }, (_, i) => {
    const n = i + 1;
    return { n, range: setRange(synthetic, n) };
  });

  const { prev, next } = adjacentChapters(topic, info.slug);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.topics"), url: abs(href(lang, "/topics")) },
    { name: subjectName, url: abs(href(lang, `/topics/${slug}`)) },
    { name: chapterName, url: abs(href(lang, `/topics/${slug}/${chapter}`)) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.topics")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/topics")} className="no-underline hover:underline">
            {t(lang, "nav.topics")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, `/topics/${slug}`)} className="no-underline hover:underline">
            {subjectName}
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
            subject: subjectName,
            sets: formatCount(info.sets, lang),
          })}
        </p>

        {/* LangLink renders nothing when hasHi is false, so the note beside it
            is what tells an English reader why there is no Hindi link — an
            absent control with no explanation reads as a bug. */}
        <div className="ui mt-4">
          <LangLink lang={lang} path={`/topics/${slug}/${chapter}`} hasHi={hasHi} />
          {!hasHi && (
            <span className="text-sm text-ink-faint">{t(lang, "chapter.hindiOnlyEnglish")}</span>
          )}
        </div>
      </Container>

      {/* ── Every set ──
          All of them, not a first page: the whole point of the rebuild is that
          each set is a real, linkable, crawlable page, and a chapter that hides
          sets 11 onward behind a "load more" hides them from search too. */}
      <Container as="section" aria-labelledby="sets" className="pt-10">
        <h2 id="sets" className="font-display text-2xl font-semibold">
          {t(lang, "chapter.setsHeading")}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sets.map((s) => (
            <li key={s.n}>
              <Link
                href={href(lang, `/topics/${slug}/${chapter}/set-${s.n}`)}
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

      {/* ── Nearby chapters ──
          Previous and next within the subject, in manifest (teaching) order. */}
      {(prev || next) && (
        <Container as="section" aria-labelledby="nearby" className="pt-12">
          <h2 id="nearby" className="font-display text-2xl font-semibold">
            {t(lang, "chapter.nearbyHeading")}
          </h2>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {[prev, next].filter((c): c is ChapterInfo => Boolean(c)).map((c) => (
              <li key={c.slug}>
                <Link
                  href={href(lang, `/topics/${slug}/${c.slug}`)}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  {lang === "hi" ? c.chapter.hi : c.chapter.en}
                  <span className="text-xs text-ink-faint">
                    {formatCount(c.sets, lang)} {t(lang, "common.set")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── PYQ for this subject's biggest exams ──
          Omitted entirely when no exam that sets this subject has papers. */}
      {pyq.length > 0 && (
        <Container as="section" aria-labelledby="pyq" className="pt-12">
          <h2 id="pyq" className="font-display text-2xl font-semibold">
            {t(lang, "chapter.pyqHeading")}
          </h2>
          <p className="mt-1 max-w-measure text-sm text-ink-soft">{t(lang, "chapter.pyqSub")}</p>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {pyq.map((p) => (
              <li key={p.href}>
                <Link
                  href={p.href}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  {p.name}
                  <span className="text-xs text-ink-faint">
                    {formatCount(p.papers, lang)} {t(lang, "common.papers")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* The one install CTA, and only when the registry actually has the app. */}
      {app && (
        <Container className="pt-12">
          <AppCard app={app} lang={lang} variant="end" />
        </Container>
      )}

      <Container className="pt-10">
        <Link
          href={href(lang, `/topics/${slug}`)}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {subjectName}
        </Link>
      </Container>

      <div className="pb-12" />
    </>
  );
}
