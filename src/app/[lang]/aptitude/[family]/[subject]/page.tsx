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
  findSubject,
  setsOf,
  subjectSlug,
  chapterSlug,
  type AptChapter,
  type AptFamilyInfo,
  type AptSubject,
  type AptitudeFamily,
} from "@/lib/content/aptitude";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * One subject of one family — every chapter in it, with its set and question
 * counts.
 *
 * ── Static ──
 *
 * generateStaticParams loads both families and flattens their real subjects,
 * so the params are exactly the subjects that survived loadFamily()'s pruning:
 * 2 for ssc-railway and 6 for bank today, × 2 languages. The count is not
 * written down anywhere — it is whatever the manifests and the content index
 * currently agree on.
 *
 * ── Counts ──
 *
 * setsOf() per type, summed, for the same reason as the family page: a type's
 * manifest `sets` array lists tier-1 files that were never uploaded.
 *
 * No headers(), no cookies(), no <html>.
 */

const isFamily = (x: string): x is AptitudeFamily =>
  (FAMILIES as readonly string[]).includes(x);

interface ChapterCard {
  chapter: AptChapter;
  slug: string;
  types: number;
  sets: number;
  questions: number;
}

function chapterCards(family: AptitudeFamily, subject: AptSubject): ChapterCard[] {
  return subject.chapters.map((chapter) => {
    let sets = 0;
    let questions = 0;
    for (const ty of chapter.types) {
      for (const st of setsOf(family, subject, chapter, ty)) {
        sets += 1;
        questions += st.enCount;
      }
    }
    return { chapter, slug: chapterSlug(chapter), types: chapter.types.length, sets, questions };
  });
}

async function resolve(
  family: string,
  subject: string,
): Promise<{ info: AptFamilyInfo; subject: AptSubject } | null> {
  if (!isFamily(family)) return null;
  const info = await loadFamily(family);
  const found = findSubject(info, subject);
  return found ? { info, subject: found } : null;
}

export async function generateStaticParams() {
  const infos = await Promise.all(FAMILIES.map((f) => loadFamily(f)));
  return LANGS.flatMap((lang) =>
    infos.flatMap((info) =>
      info.subjects.map((s) => ({ lang, family: info.slug, subject: subjectSlug(s) })),
    ),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; family: string; subject: string }>;
}): Promise<Metadata> {
  const { lang: raw, family, subject } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const ctx = await resolve(family, subject);
  if (!ctx) return {};

  const cards = chapterCards(ctx.info.family, ctx.subject);
  const name = lang === "hi" ? ctx.subject.name.hi : ctx.subject.name.en;
  const exams = lang === "hi" ? ctx.info.examQualifier.hi : ctx.info.examQualifier.en;

  return {
    title: `${format(lang, "aptSubject.h1", { subject: name, exams })} | StudyVirus`,
    description: format(lang, "aptSubject.lede", {
      chapters: formatCount(cards.length, lang),
      sets: formatCount(cards.reduce((n, c) => n + c.sets, 0), lang),
      questions: formatCount(cards.reduce((n, c) => n + c.questions, 0), lang),
    }),
    alternates: buildAlternates({ lang, path: `/aptitude/${family}/${subject}`, hasHi: true }),
  };
}

export default async function AptitudeSubjectPage({
  params,
}: {
  params: Promise<{ lang: string; family: string; subject: string }>;
}) {
  const { lang: raw, family, subject } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const ctx = await resolve(family, subject);
  if (!ctx) notFound();

  const cards = chapterCards(ctx.info.family, ctx.subject);
  const name = lang === "hi" ? ctx.subject.name.hi : ctx.subject.name.en;
  const familyName = lang === "hi" ? ctx.info.name.hi : ctx.info.name.en;
  const exams = lang === "hi" ? ctx.info.examQualifier.hi : ctx.info.examQualifier.en;

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.aptitude"), url: abs(href(lang, "/aptitude")) },
    { name: familyName, url: abs(href(lang, `/aptitude/${family}`)) },
    { name, url: abs(href(lang, `/aptitude/${family}/${subject}`)) },
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
          <Link href={href(lang, `/aptitude/${family}`)} className="no-underline hover:underline">
            {familyName}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{name}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "aptSubject.h1", { subject: name, exams })}
        </h1>

        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "aptSubject.lede", {
            chapters: formatCount(cards.length, lang),
            sets: formatCount(cards.reduce((n, c) => n + c.sets, 0), lang),
            questions: formatCount(cards.reduce((n, c) => n + c.questions, 0), lang),
          })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path={`/aptitude/${family}/${subject}`} hasHi />
        </div>
      </Container>

      {/* ── Every chapter ──
          All of them, not a first page: each chapter is a real, crawlable
          page, and hiding chapter 21 onward behind a control hides it from
          search too (the same call Task 7's chapter list makes for sets). */}
      <Container as="section" aria-labelledby="chapters" className="pt-10">
        <h2 id="chapters" className="font-display text-2xl font-semibold">
          {t(lang, "aptSubject.chaptersHeading")}
        </h2>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <li key={c.chapter.id}>
              <Link
                href={href(lang, `/aptitude/${family}/${subject}/${c.slug}`)}
                className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
              >
                <span className="flex items-center gap-2">
                  {c.chapter.emoji && (
                    <span aria-hidden="true" className="text-lg">
                      {c.chapter.emoji}
                    </span>
                  )}
                  <span className="font-display text-base font-semibold text-ink group-hover:underline">
                    {lang === "hi" ? c.chapter.name.hi : c.chapter.name.en}
                  </span>
                </span>
                <span className="ui mt-2 block text-xs text-ink-faint">
                  {format(lang, "topic.chapterMeta", {
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
          href={href(lang, `/aptitude/${family}`)}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {familyName}
        </Link>
      </Container>

      <div className="pb-12" />
    </>
  );
}
