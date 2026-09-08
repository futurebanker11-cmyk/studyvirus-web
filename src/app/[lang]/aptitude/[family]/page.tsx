import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import {
  FAMILIES,
  loadFamily,
  setsOf,
  subjectSlug,
  type AptFamilyInfo,
  type AptSubject,
  type AptitudeFamily,
} from "@/lib/content/aptitude";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * One aptitude family — SSC & Railway, or Bank — and its subjects, each with
 * the chapter, set and question counts a reader can verify by clicking in.
 *
 * ── Static ──
 *
 * generateStaticParams is FAMILIES × LANGS: four routes, all prerendered. The
 * family slug is the family id itself (AptFamilyInfo.slug === family), so no
 * slug map is needed and a param generated here always resolves.
 *
 * ── Counts ──
 *
 * Every number is summed over setsOf(), never off a manifest count: a type's
 * manifest `sets` array lists tier-1 files that were never uploaded, and
 * counting those would advertise sets that 404. loadFamily() has already
 * pruned tier-2 (paid) content and every branch left empty by it.
 *
 * No headers(), no cookies(), no <html>.
 */

const isFamily = (x: string): x is AptitudeFamily =>
  (FAMILIES as readonly string[]).includes(x);

interface SubjectCard {
  subject: AptSubject;
  chapters: number;
  sets: number;
  questions: number;
}

function subjectCards(info: AptFamilyInfo): SubjectCard[] {
  return info.subjects.map((subject) => {
    let sets = 0;
    let questions = 0;
    for (const c of subject.chapters) {
      for (const ty of c.types) {
        for (const st of setsOf(info.family, subject, c, ty)) {
          sets += 1;
          questions += st.enCount;
        }
      }
    }
    return { subject, chapters: subject.chapters.length, sets, questions };
  });
}

const totalsOf = (cards: SubjectCard[]) => ({
  chapters: cards.reduce((n, c) => n + c.chapters, 0),
  sets: cards.reduce((n, c) => n + c.sets, 0),
});

export async function generateStaticParams() {
  return LANGS.flatMap((lang) => FAMILIES.map((family) => ({ lang, family })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; family: string }>;
}): Promise<Metadata> {
  const { lang: raw, family } = await params;
  if (!isLang(raw) || !isFamily(family)) return {};
  const lang: Lang = raw;

  const info = await loadFamily(family);
  const cards = subjectCards(info);
  const { chapters, sets } = totalsOf(cards);
  const name = lang === "hi" ? info.name.hi : info.name.en;

  return {
    title: `${format(lang, "aptFamily.h1", { family: name })} | StudyVirus`,
    description: format(lang, "aptFamily.lede", {
      exams: lang === "hi" ? info.examQualifier.hi : info.examQualifier.en,
      chapters: formatCount(chapters, lang),
      subjects: formatCount(cards.length, lang),
      sets: formatCount(sets, lang),
    }),
    alternates: buildAlternates({ lang, path: `/aptitude/${family}`, hasHi: true }),
  };
}

export default async function AptitudeFamilyPage({
  params,
}: {
  params: Promise<{ lang: string; family: string }>;
}) {
  const { lang: raw, family } = await params;
  if (!isLang(raw)) notFound();
  if (!isFamily(family)) notFound();
  const lang: Lang = raw;

  const info = await loadFamily(family);
  const cards = subjectCards(info);
  if (cards.length === 0) notFound();

  const { chapters, sets } = totalsOf(cards);
  const name = lang === "hi" ? info.name.hi : info.name.en;
  const exams = lang === "hi" ? info.examQualifier.hi : info.examQualifier.en;

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.aptitude"), url: abs(href(lang, "/aptitude")) },
    { name, url: abs(href(lang, `/aptitude/${family}`)) },
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
          <Link href={href(lang, "/aptitude")} className="no-underline hover:underline">
            {t(lang, "nav.aptitude")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{name}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "aptFamily.h1", { family: name })}
        </h1>

        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "aptFamily.lede", {
            exams,
            chapters: formatCount(chapters, lang),
            subjects: formatCount(cards.length, lang),
            sets: formatCount(sets, lang),
          })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path={`/aptitude/${family}`} hasHi />
        </div>
      </Container>

      <Container as="section" aria-labelledby="subjects" className="pt-10">
        <h2 id="subjects" className="font-display text-2xl font-semibold">
          {t(lang, "aptFamily.subjectsHeading")}
        </h2>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.subject.id}>
              <Link
                href={href(lang, `/aptitude/${family}/${subjectSlug(c.subject)}`)}
                className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
              >
                <span className="flex items-center gap-2">
                  {c.subject.icon && (
                    <span aria-hidden="true" className="text-lg">
                      {c.subject.icon}
                    </span>
                  )}
                  <span className="font-display text-base font-semibold text-ink group-hover:underline">
                    {lang === "hi" ? c.subject.name.hi : c.subject.name.en}
                  </span>
                </span>
                <span className="ui mt-2 block text-xs text-ink-faint">
                  {format(lang, "aptFamily.subjectMeta", {
                    chapters: formatCount(c.chapters, lang),
                    sets: formatCount(c.sets, lang),
                    questions: formatCount(c.questions, lang),
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <Container className="pt-10">
        <Link
          href={href(lang, "/aptitude")}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {t(lang, "nav.aptitude")}
        </Link>
      </Container>

      {/* No ads: a navigational index, same rule as /aptitude and /topics. */}
      <div className="pb-12" />
    </>
  );
}
