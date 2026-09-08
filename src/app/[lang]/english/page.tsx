import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { loadTopics, englishTopics, chaptersOf, type ManifestTopic } from "@/lib/content/topics";
import { hasHindiCounts } from "@/lib/content/hindi";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * The English index — every English tree the site serves, as a card each.
 *
 * ── Three sections, not two ──
 *
 * englishTopics() returns ENGLISH_KEYS in order: `english` (17 chapters, 8,474
 * questions — the current, primary tree), `english_full` (15 indexed chapters
 * of 16 in the manifest) and `english_basic` (6). The last two carry
 * `hiddenFromList: true`, which only keeps them out of /topics' general
 * listing — visibleTopics() excludes ALL THREE English keys anyway, by design,
 * because English lives here and not under /topics. So `hiddenFromList` has no
 * bearing on this page: all three are real, distinct, non-overlapping content
 * and all three are listed.
 *
 * ── The URL segment is the KEY, not topicSlug(key) ──
 *
 * /english/english_full/…, with the underscore. topicSlug() would dash it to
 * `english-full` and move every URL Google has already indexed, which spec
 * §4.2 forbids. src/lib/seo/sitemaps.ts declares exactly this shape and its
 * comment says the same; the two must not drift.
 *
 * ── Hindi ──
 *
 * Checked live 2026-09-08: `english` and `english_full` have hiCount 0 across
 * every chapter — they are English-only at the source. Only `english_basic` is
 * fully bilingual (661/661). So the English-only note on a card is not a
 * defensive branch here the way it is under /topics; it fires on two of the
 * three sections today, and the Hindi page must say so rather than link a
 * reader to English text under a Hindi URL.
 *
 * The page itself exists in both languages regardless — the chapter pages do
 * too (sitemaps.ts emits them for both langs and gates only the sets), so a
 * Hindi reader can still browse and read the English material knowingly.
 *
 * No headers(), no cookies(), no <html>. Statically generated in both
 * languages by the [lang] segment's own generateStaticParams.
 */

interface Section {
  topic: ManifestTopic;
  /** The manifest key, used verbatim as the URL segment. */
  key: string;
  chapters: number;
  questions: number;
  sets: number;
  hasHi: boolean;
}

/** Every English tree with its real, indexed counts. */
async function sections(): Promise<Section[]> {
  const topics = englishTopics(await loadTopics());
  return topics.map((topic) => {
    const chs = chaptersOf(topic);
    const questions = chs.reduce((n, c) => n + c.enCount, 0);
    const hindi = chs.reduce((n, c) => n + c.hiCount, 0);
    return {
      topic,
      key: topic.key,
      chapters: chs.length,
      questions,
      sets: chs.reduce((n, c) => n + c.sets, 0),
      // A section is offered in Hindi only when EVERY question in it has a
      // Hindi twin — the spec §4.5 rule applied to the whole tree, so a
      // section card cannot advertise Hindi its chapters do not have.
      hasHi: hasHindiCounts(questions, hindi),
    };
  });
}

function totalsOf(list: Section[]) {
  return {
    chapters: list.reduce((n, s) => n + s.chapters, 0),
    questions: list.reduce((n, s) => n + s.questions, 0),
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

  const { chapters, questions } = totalsOf(await sections());

  return {
    title: `${format(lang, "english.h1", {
      chapters: formatCount(chapters, lang),
      questions: formatCount(questions, lang),
    })} | StudyVirus`,
    description: t(lang, "english.lede"),
    alternates: buildAlternates({ lang, path: "/english", hasHi: true }),
  };
}

export default async function EnglishIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const list = await sections();
  const { chapters, questions } = totalsOf(list);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.english"), url: abs(href(lang, "/english")) },
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
          <span aria-current="page">{t(lang, "nav.english")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "english.h1", {
            chapters: formatCount(chapters, lang),
            questions: formatCount(questions, lang),
          })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "english.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/english" hasHi />
        </div>
      </Container>

      {/* ── The sections ──
          One block per tree, each listing its chapters. Not a card grid of
          three links: a reader who wants "Idioms & Phrases" should reach it in
          one click from here, and the chapter names are the words they search
          for. Manifest order within a section — the order the app teaches it. */}
      {list.map((s) => {
        const chs = chaptersOf(s.topic);
        const name = lang === "hi" ? s.topic.hi.name : s.topic.en.name;
        const desc = lang === "hi" ? s.topic.hi.desc : s.topic.en.desc;

        return (
          <Container key={s.key} as="section" aria-labelledby={`s-${s.key}`} className="pt-10">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 id={`s-${s.key}`} className="font-display text-2xl font-semibold">
                <span aria-hidden="true" className="mr-2">
                  {s.topic.emoji}
                </span>
                {name}
              </h2>
              <span className="ui text-sm text-ink-faint">
                {format(lang, "english.sectionMeta", {
                  chapters: formatCount(s.chapters, lang),
                  questions: formatCount(s.questions, lang),
                })}
              </span>
              {/* Two of the three trees are English-only at the source. Saying
                  so beside the heading is what stops a Hindi reader clicking
                  through expecting Hindi. */}
              {!s.hasHi && (
                <span className="ui text-sm text-ink-faint">· {t(lang, "english.englishOnly")}</span>
              )}
            </div>

            {desc && <p className="mt-1 max-w-measure text-sm text-ink-soft">{desc}</p>}

            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {chs.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={href(lang, `/english/${s.key}/${c.slug}`)}
                    className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
                  >
                    <span className="font-display text-base font-semibold text-ink group-hover:underline">
                      {lang === "hi" ? c.chapter.hi : c.chapter.en}
                    </span>
                    <span className="ui mt-1 block text-xs text-ink-faint">
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
        );
      })}

      <div className="pb-12" />
    </>
  );
}
