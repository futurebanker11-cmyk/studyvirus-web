import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t } from "@/lib/ui/strings";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * /contact — ported verbatim in substance from the old src/app/contact,
 * which was English-only. The Hindi here is a genuine translation (coaching
 * register, not a transliteration), matching every other page in this plan.
 *
 * placement("static") = {ads: [], installCta: "none"}: no AdSlot, no AppCard.
 * The "Download the app" section keeps a plain Play Store link (as the old
 * page had it) rather than the AppCard component — that component is what
 * "install-app card" refers to; a plain anchor referencing the app's
 * existence is real ported content, not a monetisation unit.
 *
 * #error anchor on the "Report an error" item lets /about link straight to
 * this section, per the brief (About references, rather than rebuilds, the
 * error-reporting mechanism).
 *
 * No generateStaticParams (no dynamic segment), no headers()/cookies().
 */

const CONTACT_EMAIL = "contact@studyvirus.com";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.gkpkhindi.studyvirus";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  return {
    title: `${t(lang, "contact.h1")} | StudyVirus`,
    description: t(lang, "contact.lede"),
    alternates: buildAlternates({ lang, path: "/contact", hasHi: true }),
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "contact.h1"), url: abs(href(lang, "/contact")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" width="read" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "contact.h1")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "contact.h1")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t(lang, "contact.h1")}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "contact.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/contact" hasHi />
        </div>
      </Container>

      <Container as="div" width="read" className="pb-12">
        <div className="mt-6 space-y-8">
          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "contact.emailHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">{t(lang, "contact.emailBody")}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="ui mt-3 inline-flex items-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
            >
              {CONTACT_EMAIL}
            </a>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "contact.topicsHeading")}
            </h2>
            <ul className="mt-4 space-y-4">
              <li id="error" className="scroll-mt-20">
                <p className="font-semibold">{t(lang, "contact.errorTitle")}</p>
                <p className="mt-1 max-w-measure text-sm text-ink-soft">
                  {t(lang, "contact.errorBody")}
                </p>
              </li>
              <li>
                <p className="font-semibold">{t(lang, "contact.suggestTitle")}</p>
                <p className="mt-1 max-w-measure text-sm text-ink-soft">
                  {t(lang, "contact.suggestBody")}
                </p>
              </li>
              <li>
                <p className="font-semibold">{t(lang, "contact.contentTitle")}</p>
                <p className="mt-1 max-w-measure text-sm text-ink-soft">
                  {t(lang, "contact.contentBody")}
                </p>
              </li>
              <li>
                <p className="font-semibold">{t(lang, "contact.dmcaTitle")}</p>
                <p className="mt-1 max-w-measure text-sm text-ink-soft">
                  {t(lang, "contact.dmcaBody")}
                </p>
              </li>
              <li>
                <p className="font-semibold">{t(lang, "contact.partnerTitle")}</p>
                <p className="mt-1 max-w-measure text-sm text-ink-soft">
                  {t(lang, "contact.partnerBody")}
                </p>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold">
              {t(lang, "contact.appHeading")}
            </h2>
            <p className="mt-2 max-w-measure text-ink-soft">{t(lang, "contact.appBody")}</p>
            <a
              href={PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ui mt-3 inline-flex items-center gap-2 rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-ink no-underline transition-colors hover:bg-surface-sunk"
            >
              <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              {t(lang, "app.getTheApp")}
            </a>
          </section>
        </div>
      </Container>
    </>
  );
}
