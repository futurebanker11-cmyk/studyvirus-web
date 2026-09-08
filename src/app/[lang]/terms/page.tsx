import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";
import Prose from "@/components/site/Prose";

/**
 * /terms — legal/informational copy ported faithfully from the old
 * src/app/terms (English-only there). Every clause from the old page is
 * carried over; none invented, none dropped for brevity — this content is
 * treated as accuracy-first, per the brief, unlike the rest of this plan's
 * marketing-register prose.
 *
 * placement("static") = {ads: [], installCta: "none"}. No AdSlot, no AppCard.
 * No generateStaticParams (no dynamic segment), no headers()/cookies().
 */

// The date the old page's own "Last updated" carried, kept fixed like the
// original static string rather than resolved at build/render time — a legal
// notice date should only change when the text actually changes.
const LAST_UPDATED = "April 11, 2026";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  return {
    title: `${t(lang, "terms.h1")} | StudyVirus`,
    description: t(lang, "terms.intro"),
    alternates: buildAlternates({ lang, path: "/terms", hasHi: true }),
  };
}

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "terms.h1"), url: abs(href(lang, "/terms")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" width="read" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "terms.h1")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "terms.h1")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t(lang, "terms.h1")}
        </h1>
        <p className="ui mt-2 text-sm text-ink-faint">
          {format(lang, "terms.updated", { date: LAST_UPDATED })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/terms" hasHi />
        </div>
      </Container>

      <Container as="article" width="read" className="pb-12">
        <Prose lang={lang}>
          <p>{t(lang, "terms.intro")}</p>

          <h2>{t(lang, "terms.useHeading")}</h2>
          <p>{t(lang, "terms.useBody")}</p>
          <ul>
            <li>{t(lang, "terms.useList1")}</li>
            <li>{t(lang, "terms.useList2")}</li>
            <li>{t(lang, "terms.useList3")}</li>
            <li>{t(lang, "terms.useList4")}</li>
          </ul>

          <h2>{t(lang, "terms.accuracyHeading")}</h2>
          <p>{t(lang, "terms.accuracyBody")}</p>

          <h2>{t(lang, "terms.ipHeading")}</h2>
          <p>{t(lang, "terms.ipBody")}</p>

          <h2>{t(lang, "terms.thirdPartyHeading")}</h2>
          <p>{t(lang, "terms.thirdPartyBody")}</p>

          <h2>{t(lang, "terms.disclaimerHeading")}</h2>
          <p>{t(lang, "terms.disclaimerBody")}</p>

          <h2>{t(lang, "terms.liabilityHeading")}</h2>
          <p>{t(lang, "terms.liabilityBody")}</p>

          <h2>{t(lang, "terms.changesHeading")}</h2>
          <p>{t(lang, "terms.changesBody")}</p>

          <h2>{t(lang, "terms.lawHeading")}</h2>
          <p>{t(lang, "terms.lawBody")}</p>

          <h2>{t(lang, "footer.contact")}</h2>
          <p>
            {/* terms.contactBody carries a {link} placeholder; splitting on it
                lets the Contact link land inline in a real <Link>, in either
                language's own word order. */}
            {(() => {
              const [before, after] = t(lang, "terms.contactBody").split("{link}");
              return (
                <>
                  {before}
                  <Link href={href(lang, "/contact")}>{t(lang, "footer.contact")}</Link>
                  {after}
                </>
              );
            })()}
          </p>
        </Prose>
      </Container>
    </>
  );
}
