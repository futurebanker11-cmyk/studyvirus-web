import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { EXAMS } from "@/lib/exams";
import { factsFor } from "@/lib/content/examFacts";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { groupExams } from "@/components/site/ExamCategoryGrid";

import Container from "@/components/site/Container";

/**
 * The exam index: every exam the site covers, grouped the way its audience
 * groups them.
 *
 * A static route — the list comes from EXAMS, which is a module, so there is
 * nothing to await and no generateStaticParams to write beyond the [lang]
 * segment's own. Both languages prerender.
 *
 * Every count here is EXAMS.length rather than a number anybody typed. The
 * page this replaces carried "60+ Exams" in its <title> while rendering 74 of
 * them — a claim its own body disproved on the same screen, which is the exact
 * defect class the rebuild exists to remove. There is no literal exam count
 * anywhere in this file.
 *
 * Category grouping and ordering are shared with the home page via
 * groupExams(), so the two pages cannot drift into listing different exams or
 * ordering the categories differently.
 *
 * No <html>/<body>, no headers(), no cookies(): src/app/[lang]/layout.tsx owns
 * the document shell and takes the language from params, which is what keeps
 * the site statically generated.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  // Reuses the H1's own string so the tab title and the heading cannot say
  // different things — the same rule Task 4 applied to the home page.
  const title = `${format(lang, "examIndex.h1", { exams: EXAMS.length })} | StudyVirus`;

  return {
    title,
    description:
      lang === "hi"
        ? `${EXAMS.length} सरकारी परीक्षाओं की सूची — रेलवे, SSC, पुलिस, बैंक, रक्षा, UPSC, शिक्षक भर्ती और राज्य परीक्षाएँ। हर परीक्षा के लिए निःशुल्क प्रश्न, पिछले प्रश्नपत्र और ऐप।`
        : `Every one of the ${EXAMS.length} government exams covered on StudyVirus — Railway, SSC, Police, Bank, Defence, UPSC, Teaching and State exams, each with free questions, previous-year papers and an app.`,
    alternates: buildAlternates({ lang, path: "/exam", hasHi: true }),
  };
}

export default async function ExamIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const groups = groupExams();

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.exams"), url: abs(href(lang, "/exam")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        {/* A visible breadcrumb as well as the JSON-LD one: the markup is for
            crawlers, the trail is for the reader who landed here from search. */}
        <nav aria-label={t(lang, "nav.exams")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "nav.exams")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "examIndex.h1", { exams: EXAMS.length })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "examIndex.lede")}</p>
      </Container>

      {/* One section per category, each an anchor target: /bank 301s to
          /exam#bank (see lib/i18n/routing.ts), so these ids are load-bearing
          and not decoration. */}
      <Container as="section" className="pt-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {groups.map((g) => (
            <section
              key={g.category}
              id={g.category}
              className="scroll-mt-20 rounded-lg border border-line bg-surface p-5"
              aria-labelledby={`h-${g.category}`}
            >
              <h2
                id={`h-${g.category}`}
                className="flex items-center gap-2 font-display text-lg font-semibold"
              >
                <span aria-hidden="true">{g.exams[0]?.icon}</span>
                {/* EXAM_CATEGORIES is English-only and outside this task's
                    scope to change; the exam names it groups are the words the
                    audience searches, and those are the same in both scripts. */}
                {g.label}
              </h2>

              <ul className="mt-4 space-y-3">
                {g.exams.map((e) => {
                  // factsFor() always returns something — an unknown id gets the
                  // generic record — so no guard is needed here, but the body is
                  // still the only line of fact shown, per the plan.
                  const facts = factsFor(e.id);
                  return (
                    <li key={e.slug}>
                      <Link
                        href={href(lang, `/exam/${e.slug}`)}
                        className="group block no-underline"
                      >
                        <span className="block font-semibold text-ink group-hover:underline">
                          {lang === "hi" ? e.hi : e.en}
                        </span>
                        <span className="mt-0.5 block text-sm text-ink-soft">{e.fullName}</span>
                        <span className="ui mt-0.5 block text-xs text-ink-faint">
                          {t(lang, "exam.conductingBody")}:{" "}
                          {lang === "hi" ? facts.bodyHi : facts.body}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Container>

      {/* No ads. placement("static") gives this page none: it is a pure
          navigational index and every unit would sit between a reader and the
          exam they came to find. */}
      <div className="pb-12" />
    </>
  );
}
