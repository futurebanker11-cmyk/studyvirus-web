import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  FAMILIES,
  loadFamily,
  setsOf,
  subjectSlug,
  type AptFamilyInfo,
} from "@/lib/content/aptitude";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * The aptitude index: the two exam families as cards, each with its exam
 * qualifier and its subjects.
 *
 * ── Where every number on this page comes from ──
 *
 * loadFamily() has already dropped tier-2 (paid) sets, then every type whose
 * tier-1 files are absent from the content index, then every chapter and
 * subject left empty by that. So the subject list rendered here is exactly the
 * set of subjects that have a page worth landing on, and the chapter and set
 * counts are sums over what the reader can actually click. Nothing is read off
 * a manifest count and trusted, and nothing is written in — the same rule
 * Tasks 4-8 follow.
 *
 * setsOf() is the only way to count sets: a type's manifest `sets` array
 * includes tier-1 files that were never uploaded, and counting those would put
 * a number on this page that the tree below it disproves.
 *
 * ── Static ──
 *
 * No generateStaticParams: /aptitude has no dynamic segment of its own beyond
 * [lang], and the [lang] layout already enumerates the two languages. Both
 * loads go through the content loader, so this awaits them — no headers(), no
 * cookies(), no <html>.
 *
 * ── No ads ──
 *
 * A pure navigational index, the same call /topics, /pyq and /exam make.
 */

interface FamilyCard {
  info: AptFamilyInfo;
  chapters: number;
  sets: number;
  questions: number;
}

/** Both families, each summed over the content the reader can reach. */
async function familyCards(): Promise<FamilyCard[]> {
  const infos = await Promise.all(FAMILIES.map((f) => loadFamily(f)));
  return infos.map((info) => {
    let chapters = 0;
    let sets = 0;
    let questions = 0;
    for (const s of info.subjects) {
      for (const c of s.chapters) {
        chapters += 1;
        for (const ty of c.types) {
          for (const st of setsOf(info.family, s, c, ty)) {
            sets += 1;
            questions += st.enCount;
          }
        }
      }
    }
    return { info, chapters, sets, questions };
  });
}

const sum = (cards: FamilyCard[]) => ({
  sets: cards.reduce((n, c) => n + c.sets, 0),
  questions: cards.reduce((n, c) => n + c.questions, 0),
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const cards = await familyCards();
  const { sets, questions } = sum(cards);

  return {
    title: `${t(lang, "aptIndex.h1")} | StudyVirus`,
    // The description is the lede the page renders, with the same numbers, so
    // a search snippet can never advertise a count the page disproves.
    description: format(lang, "aptIndex.lede", {
      sets: formatCount(sets, lang),
      questions: formatCount(questions, lang),
    }),
    alternates: buildAlternates({ lang, path: "/aptitude", hasHi: true }),
  };
}

export default async function AptitudeIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const cards = await familyCards();
  const { sets, questions } = sum(cards);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.aptitude"), url: abs(href(lang, "/aptitude")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.aptitude")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "nav.aptitude")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t(lang, "aptIndex.h1")}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "aptIndex.lede", {
            sets: formatCount(sets, lang),
            questions: formatCount(questions, lang),
          })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/aptitude" hasHi />
        </div>
      </Container>

      {/* ── The two families ──
          Each card names the exams it is for (the family's own examQualifier,
          not an invented list) and links every one of its subjects, so a
          reader reaches a subject in one click rather than two. */}
      <Container as="section" aria-labelledby="families" className="pt-10">
        <h2 id="families" className="sr-only">
          {t(lang, "aptFamily.subjectsHeading")}
        </h2>

        <div className="grid gap-6 sm:grid-cols-2">
          {cards.map(({ info, chapters, sets: famSets }) => {
            const name = lang === "hi" ? info.name.hi : info.name.en;
            const exams = lang === "hi" ? info.examQualifier.hi : info.examQualifier.en;
            return (
              <section
                key={info.slug}
                className="rounded-lg border border-line bg-surface p-5"
                aria-labelledby={`f-${info.slug}`}
              >
                <h3 id={`f-${info.slug}`} className="font-display text-xl font-semibold">
                  <Link href={href(lang, `/aptitude/${info.slug}`)} className="no-underline hover:underline">
                    {name}
                  </Link>
                </h3>
                <p className="mt-1 text-sm text-ink-soft">{exams}</p>
                <p className="ui mt-2 text-xs text-ink-faint">
                  {format(lang, "aptIndex.familyMeta", {
                    subjects: formatCount(info.subjects.length, lang),
                    chapters: formatCount(chapters, lang),
                    sets: formatCount(famSets, lang),
                  })}
                </p>

                <ul className="ui mt-4 flex flex-wrap gap-2">
                  {info.subjects.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={href(lang, `/aptitude/${info.slug}/${subjectSlug(s)}`)}
                        className="inline-flex items-baseline gap-1.5 rounded-md border border-line bg-surface-sunk px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                      >
                        {s.icon && <span aria-hidden="true">{s.icon}</span>}
                        {lang === "hi" ? s.name.hi : s.name.en}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </Container>

      {/* No ads: a pure navigational index, same rule as /topics and /pyq. */}
      <div className="pb-12" />
    </>
  );
}
