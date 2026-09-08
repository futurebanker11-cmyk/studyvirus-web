import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t } from "@/lib/ui/strings";
import { siteStats, formatCount } from "@/lib/content/stats";
import { EXAMS } from "@/lib/exams";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * /about — brand only.
 *
 * ── No person named, anywhere ──
 * An explicit, prior user decision: this page describes StudyVirus, never a
 * developer. src/lib/seo/jsonld.ts's organization() carries a developer-id
 * Play Store URL used elsewhere on the site; that file is out of scope for
 * this task and this page does not call organization() or reference it.
 *
 * ── Real counts only ──
 * siteStats()/formatCount() — the same pair the home page and footer use — so
 * this page cannot drift from what a reader can verify by browsing the tree.
 * EXAMS.length for the exam count, matching home.h1's own convention. Nothing
 * here is a written-in number.
 *
 * ── placement("static") ──
 * {ads: [], installCta: "none"}. No AdSlot, no AppCard. The apps mention below
 * is a plain link to /apps (Task 11), not an install card.
 *
 * ── Static generation ──
 * No generateStaticParams (no dynamic segment of its own — inherits both
 * languages from the [lang] layout), no headers(), no cookies(), no <html>.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  return {
    title: `${t(lang, "about.h1")} | StudyVirus`,
    description: t(lang, "about.lede"),
    alternates: buildAlternates({ lang, path: "/about", hasHi: true }),
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const s = siteStats();
  const questions = formatCount(s.questions, lang);
  const chapters = formatCount(s.chapters, lang);
  const exams = formatCount(EXAMS.length, lang);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "about.h1"), url: abs(href(lang, "/about")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" width="read" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "about.h1")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "about.h1")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t(lang, "about.h1")}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "about.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/about" hasHi />
        </div>
      </Container>

      <Container as="div" width="read" className="pb-12">
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "about.missionHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">{t(lang, "about.missionBody")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "about.explanationsHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">
              {t(lang, "about.explanationsBody")}
            </p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "about.bilingualHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">{t(lang, "about.bilingualBody")}</p>
          </section>

          {/* Real, computed counts — never hardcoded. */}
          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "about.statsHeading")}
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <p className="font-display text-2xl font-semibold text-accent">{questions}</p>
                <p className="mt-1 text-xs text-ink-faint">{t(lang, "home.statQuestions")}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <p className="font-display text-2xl font-semibold text-accent">{chapters}</p>
                <p className="mt-1 text-xs text-ink-faint">{t(lang, "home.statChapters")}</p>
              </div>
              <div className="rounded-lg border border-line bg-surface p-4 text-center">
                <p className="font-display text-2xl font-semibold text-accent">{exams}</p>
                <p className="mt-1 text-xs text-ink-faint">{t(lang, "about.statExams")}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-ink-faint">{t(lang, "about.statsNote")}</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "about.errorHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">{t(lang, "about.errorBody")}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <Link
                href={href(lang, "/topics")}
                className="text-accent underline decoration-line-strong underline-offset-4 hover:decoration-accent"
              >
                {t(lang, "about.errorExampleLink")}
              </Link>
              <Link
                href={href(lang, "/contact#error")}
                className="text-accent underline decoration-line-strong underline-offset-4 hover:decoration-accent"
              >
                {t(lang, "footer.contact")}
              </Link>
            </div>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "about.appsHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">{t(lang, "about.appsBody")}</p>
            <div className="mt-3">
              <Link
                href={href(lang, "/apps")}
                className="text-accent underline decoration-line-strong underline-offset-4 hover:decoration-accent"
              >
                {t(lang, "home.viewAllApps")}
              </Link>
            </div>
          </section>
        </div>
      </Container>
    </>
  );
}
