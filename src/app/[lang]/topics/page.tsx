import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { loadTopics, visibleTopics, chaptersOf, type ManifestTopic } from "@/lib/content/topics";
import { topicSlug } from "@/lib/content/slugs";
import { GROUP_ORDER, groupOf, type TopicGroup } from "@/lib/content/topicGroups";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * The subject index — every browsable GK subject on the site, in four groups.
 *
 * ── Where the list comes from ──
 *
 * visibleTopics(loadTopics()), and nothing else. That function drops the
 * current-affairs pseudo-topic, the three English trees (they have their own
 * section) and anything with no chapter in the content index, so a subject
 * whose files are missing never appears here as a dead card. 62 of the
 * manifest's 66 survive today.
 *
 * ── Where the counts come from ──
 *
 * chaptersOf(), which reads the generated content index — so the "16 chapters
 * · 1,203 questions" under a card is the number of chapters this site will
 * actually serve, not the number the manifest lists. A chapter present in the
 * manifest but absent from the bucket is excluded from both the count and the
 * subject page, by the same function, so the two can never disagree.
 *
 * ── Static ──
 *
 * Both languages prerender: the [lang] segment's own generateStaticParams
 * enumerates en and hi and there is no second dynamic segment here. No
 * headers(), no cookies(), no <html> — the [lang] layout owns the shell.
 */

interface Card {
  topic: ManifestTopic;
  slug: string;
  chapters: number;
  questions: number;
}

const GROUP_HEADING = {
  general: "topics.groupGeneral",
  science: "topics.groupScience",
  state: "topics.groupState",
  specialist: "topics.groupSpecialist",
} as const;

const GROUP_SUB = {
  general: "topics.groupGeneralSub",
  science: "topics.groupScienceSub",
  state: "topics.groupStateSub",
  specialist: "topics.groupSpecialistSub",
} as const;

/**
 * Every visible subject with its real counts, bucketed and ordered.
 *
 * Sorted by question count within a group rather than by manifest order: the
 * manifest orders for the app's home screen, where the first row is chosen for
 * marketing reasons. On a page whose job is "find your subject", the subject
 * with 1,200 questions is more useful above the one with 40.
 */
async function subjectGroups(): Promise<{ group: TopicGroup; cards: Card[] }[]> {
  const topics = visibleTopics(await loadTopics());

  const cards: Card[] = topics.map((topic) => {
    const chs = chaptersOf(topic);
    return {
      topic,
      slug: topicSlug(topic.key),
      chapters: chs.length,
      questions: chs.reduce((n, c) => n + c.enCount, 0),
    };
  });

  return GROUP_ORDER.map((group) => ({
    group,
    cards: cards
      .filter((c) => groupOf(c.topic.key) === group)
      .sort((a, b) => b.questions - a.questions),
  })).filter((g) => g.cards.length > 0);
}

/** The two totals the H1 and lede quote, from the same cards the page renders. */
function totalsOf(groups: { cards: Card[] }[]) {
  const cards = groups.flatMap((g) => g.cards);
  return {
    subjects: cards.length,
    questions: cards.reduce((n, c) => n + c.questions, 0),
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const groups = await subjectGroups();
  const { subjects, questions } = totalsOf(groups);

  // The tab title is the H1's own string, filled from the same numbers the
  // body renders — so a snippet can never advertise a count the page disproves.
  const title = `${format(lang, "topics.h1", {
    subjects: formatCount(subjects, lang),
    questions: formatCount(questions, lang),
  })} | StudyVirus`;

  return {
    title,
    description: t(lang, "topics.lede"),
    alternates: buildAlternates({ lang, path: "/topics", hasHi: true }),
  };
}

export default async function TopicsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const groups = await subjectGroups();
  const { subjects, questions } = totalsOf(groups);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.topics"), url: abs(href(lang, "/topics")) },
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
          <span aria-current="page">{t(lang, "nav.topics")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "topics.h1", {
            subjects: formatCount(subjects, lang),
            questions: formatCount(questions, lang),
          })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "topics.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/topics" hasHi />
        </div>
      </Container>

      {/* One section per group. The anchor id sits on the inner <section>
          rather than on Container — Container takes no id, it is shared chrome
          and not this task's to widen (SetPageShell made the same call).
          A group with no subjects is dropped in subjectGroups() rather than
          rendered as an empty heading. */}
      {groups.map(({ group, cards }) => (
        <Container key={group} className="pt-10">
          <section id={group} className="scroll-mt-20" aria-labelledby={`g-${group}`}>
            <h2 id={`g-${group}`} className="font-display text-2xl font-semibold">
              {t(lang, GROUP_HEADING[group])}
            </h2>
            <p className="mt-1 max-w-measure text-sm text-ink-soft">{t(lang, GROUP_SUB[group])}</p>

            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <li key={c.topic.key}>
                  <Link
                    href={href(lang, `/topics/${c.slug}`)}
                    className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
                  >
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true" className="text-lg">
                        {c.topic.emoji}
                      </span>
                      <span className="font-display text-base font-semibold text-ink group-hover:underline">
                        {lang === "hi" ? c.topic.hi.name : c.topic.en.name}
                      </span>
                    </span>
                    {/* The manifest's own one-line description, in the page's
                        language. Not every topic has a useful one, so it is
                        rendered only when non-empty rather than as a blank line. */}
                    {(lang === "hi" ? c.topic.hi.desc : c.topic.en.desc) && (
                      <span className="mt-1 block text-sm text-ink-soft">
                        {lang === "hi" ? c.topic.hi.desc : c.topic.en.desc}
                      </span>
                    )}
                    <span className="ui mt-2 block text-xs text-ink-faint">
                      {formatCount(c.chapters, lang)} {t(lang, "common.chapters")} ·{" "}
                      {formatCount(c.questions, lang)} {t(lang, "common.questions")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Container>
      ))}

      <div className="pb-12" />
    </>
  );
}
