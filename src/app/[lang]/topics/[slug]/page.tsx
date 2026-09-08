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
  type ManifestTopic,
} from "@/lib/content/topics";
import { topicSlug } from "@/lib/content/slugs";
import { EXAMS } from "@/lib/exams";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * A subject: its chapters, and the exams that set it.
 *
 * ── Static ──
 *
 * generateStaticParams enumerates every visible subject × both languages, the
 * same shape Task 5's exam hub uses (LANGS.flatMap over the list). It is a
 * plain sync function returning the params; the topic list it needs comes from
 * loadTopics, so it is async here where the exam hub's was not — Next allows
 * either. 62 subjects × 2 = 124 prerendered routes.
 *
 * A slug that is not a visible subject 404s. That includes the three English
 * trees and current affairs, which visibleTopics excludes: /topics/english is
 * not this section's page, /english is.
 *
 * ── Counts ──
 *
 * chaptersOf() again, so the "16 chapters, 1,203 questions" in the lede is the
 * sum of exactly the chapter rows rendered below it, and a chapter missing
 * from the bucket is absent from both.
 *
 * No headers(), no cookies(), no <html>.
 */

/** Chapters plus the three totals the lede quotes, from one pass. */
function summarise(topic: ManifestTopic) {
  const chapters = chaptersOf(topic);
  return {
    chapters,
    questions: chapters.reduce((n, c) => n + c.enCount, 0),
    sets: chapters.reduce((n, c) => n + c.sets, 0),
  };
}

/**
 * The exams whose syllabus lists this subject, as real Exam records.
 *
 * The manifest's `exams` array carries ids the exam registry does not always
 * have (`gk_hindi`, `up_bihar_police` are app ids, not exams), so it is
 * intersected with EXAMS rather than trusted — an unmatched id would otherwise
 * become a link to a 404. Ordered by EXAMS, which is the order the rest of the
 * site lists exams in.
 */
function examsFor(topic: ManifestTopic) {
  const ids = new Set(topic.exams ?? []);
  return EXAMS.filter((e) => ids.has(e.id));
}

export async function generateStaticParams() {
  const topics = visibleTopics(await loadTopics());
  return LANGS.flatMap((lang) => topics.map((tp) => ({ lang, slug: topicSlug(tp.key) })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const topic = findTopicBySlug(visibleTopics(await loadTopics()), slug);
  if (!topic) return {};

  const name = lang === "hi" ? topic.hi.name : topic.en.name;
  const { chapters, questions, sets } = summarise(topic);

  return {
    title: `${format(lang, "topic.h1", { subject: name })} | StudyVirus`,
    // The description is the lede the page itself renders, with the same
    // counts — the snippet and the first line under the H1 are one sentence.
    description: format(lang, "topic.lede", {
      chapters: formatCount(chapters.length, lang),
      questions: formatCount(questions, lang),
      sets: formatCount(sets, lang),
    }),
    alternates: buildAlternates({ lang, path: `/topics/${slug}`, hasHi: true }),
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const topic = findTopicBySlug(visibleTopics(await loadTopics()), slug);
  if (!topic) notFound();

  const name = lang === "hi" ? topic.hi.name : topic.en.name;
  const { chapters, questions, sets } = summarise(topic);
  const exams = examsFor(topic);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.topics"), url: abs(href(lang, "/topics")) },
    { name, url: abs(href(lang, `/topics/${slug}`)) },
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
          <span aria-current="page">{name}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          <span aria-hidden="true" className="mr-2">
            {topic.emoji}
          </span>
          {format(lang, "topic.h1", { subject: name })}
        </h1>

        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "topic.lede", {
            chapters: formatCount(chapters.length, lang),
            questions: formatCount(questions, lang),
            sets: formatCount(sets, lang),
          })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path={`/topics/${slug}`} hasHi />
        </div>
      </Container>

      {/* ── Chapters ──
          In manifest order, which is the order the subject is taught and the
          order the app screens list it in — not sorted by size. A reader
          working through Indian History wants Indus Valley first, whether or
          not it is the biggest chapter. */}
      <Container as="section" aria-labelledby="chapters" className="pt-10">
        <h2 id="chapters" className="font-display text-2xl font-semibold">
          {t(lang, "topic.chaptersHeading")}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {chapters.map((c) => (
            <li key={c.slug}>
              <Link
                href={href(lang, `/topics/${slug}/${c.slug}`)}
                className="group flex h-full items-baseline justify-between gap-4 rounded-lg border border-line bg-surface p-4 no-underline"
              >
                <span className="font-display text-base font-semibold text-ink group-hover:underline">
                  {lang === "hi" ? c.chapter.hi : c.chapter.en}
                </span>
                <span className="ui shrink-0 text-xs text-ink-faint">
                  {format(lang, "topic.chapterMeta", {
                    sets: formatCount(c.sets, lang),
                    questions: formatCount(c.enCount, lang),
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ── Exams that set this subject ──
          Rendered only when at least one manifest id matched a real exam. */}
      {exams.length > 0 && (
        <Container as="section" aria-labelledby="exams" className="pt-12">
          <h2 id="exams" className="font-display text-2xl font-semibold">
            {t(lang, "topic.examsHeading")}
          </h2>
          <p className="mt-1 max-w-measure text-sm text-ink-soft">{t(lang, "topic.examsSub")}</p>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {exams.map((e) => (
              <li key={e.slug}>
                <Link
                  href={href(lang, `/exam/${e.slug}`)}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  <span aria-hidden="true">{e.icon}</span>
                  {lang === "hi" ? e.hi : e.en}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      <Container className="pt-10">
        <Link
          href={href(lang, "/topics")}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {t(lang, "topics.backToAll")}
        </Link>
      </Container>

      <div className="pb-12" />
    </>
  );
}
