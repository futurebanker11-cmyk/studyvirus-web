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
 * /privacy-policy (singular) — the site's own general privacy policy, ported
 * faithfully from the old src/app/privacy-policy (English-only there).
 *
 * NOT the same route as /privacy/[slug] (plural) — that is the per-app
 * privacy policy for each of the 74 exam apps, built in an earlier task and
 * living under the (legacy) route group. The two are intentionally separate
 * and this task does not touch the plural tree.
 *
 * placement("static") = {ads: [], installCta: "none"}. No AdSlot, no AppCard.
 * No generateStaticParams (no dynamic segment), no headers()/cookies().
 */

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
    title: `${t(lang, "privacy.h1")} | StudyVirus`,
    description: t(lang, "privacy.intro"),
    alternates: buildAlternates({ lang, path: "/privacy-policy", hasHi: true }),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "privacy.h1"), url: abs(href(lang, "/privacy-policy")) },
  ]);

  const [contactBefore, contactAfter] = t(lang, "privacy.contactBody").split("{link}");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" width="read" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "privacy.h1")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "privacy.h1")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t(lang, "privacy.h1")}
        </h1>
        <p className="ui mt-2 text-sm text-ink-faint">
          {/* terms.updated is the generic "Last updated: {date}" string —
              reused here rather than duplicated under a privacy.* key. */}
          {format(lang, "terms.updated", { date: LAST_UPDATED })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/privacy-policy" hasHi />
        </div>
      </Container>

      <Container as="article" width="read" className="pb-12">
        <Prose lang={lang}>
          <p>{t(lang, "privacy.intro")}</p>

          <h2>{t(lang, "privacy.collectHeading")}</h2>
          <p>{t(lang, "privacy.collectBody")}</p>
          <ul>
            <li>{t(lang, "privacy.collectUsage")}</li>
            <li>{t(lang, "privacy.collectLog")}</li>
            <li>{t(lang, "privacy.collectCookies")}</li>
          </ul>

          <h2>{t(lang, "privacy.useHeading")}</h2>
          <ul>
            <li>{t(lang, "privacy.useList1")}</li>
            <li>{t(lang, "privacy.useList2")}</li>
            <li>{t(lang, "privacy.useList3")}</li>
            <li>{t(lang, "privacy.useList4")}</li>
          </ul>

          <h2>{t(lang, "privacy.adsHeading")}</h2>
          <p>
            {/* privacy.adsBody1 carries two placeholders, {adsLink} and
                {choicesLink}, for the two real outbound links this sentence
                names — split on both rather than format() so each lands as a
                real <a>, not inert prose (Task 12 review, 2026-09-08). */}
            {(() => {
              const [before, mid, after] = t(lang, "privacy.adsBody1").split(
                /\{adsLink\}|\{choicesLink\}/,
              );
              return (
                <>
                  {before}
                  <a
                    href="https://www.google.com/settings/ads"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t(lang, "privacy.adsSettingsLink")}
                  </a>
                  {mid}
                  <a
                    href="https://www.aboutads.info"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t(lang, "privacy.adsChoicesLink")}
                  </a>
                  {after}
                </>
              );
            })()}
          </p>
          <p>{t(lang, "privacy.adsBody2")}</p>

          <h2>{t(lang, "privacy.analyticsHeading")}</h2>
          <p>{t(lang, "privacy.analyticsBody")}</p>

          <h2>{t(lang, "privacy.sharingHeading")}</h2>
          <p>{t(lang, "privacy.sharingBody")}</p>

          <h2>{t(lang, "privacy.childrenHeading")}</h2>
          <p>{t(lang, "privacy.childrenBody")}</p>

          <h2>{t(lang, "privacy.choicesHeading")}</h2>
          <ul>
            <li>{t(lang, "privacy.choicesList1")}</li>
            <li>{t(lang, "privacy.choicesList2")}</li>
            <li>{t(lang, "privacy.choicesList3")}</li>
          </ul>

          <h2>{t(lang, "privacy.changesHeading")}</h2>
          <p>{t(lang, "privacy.changesBody")}</p>

          <h2>{t(lang, "contact.h1")}</h2>
          <p>
            {/* privacy.contactBody carries a {link} placeholder, split and
                rendered inline with a real <Link> — same pattern as
                terms/page.tsx's contact section. */}
            {contactBefore}
            <Link href={href(lang, "/contact")}>{t(lang, "footer.contact")}</Link>
            {contactAfter}
          </p>
        </Prose>
      </Container>
    </>
  );
}
