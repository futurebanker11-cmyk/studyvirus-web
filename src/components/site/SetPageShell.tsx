import Link from "next/link";
import { useId, type ReactNode } from "react";

import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";
import { placement } from "@/lib/seo/monetisation";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { abs } from "@/lib/i18n/alternates";
import type { AppEntry } from "@/lib/content/apps";

import Container from "./Container";
import AdSlot from "./AdSlot";
import AppCard from "./AppCard";
import LangLink from "./LangLink";
import { Question } from "./QuestionList";
import PracticeToggle from "./PracticeToggle";
import SetPager from "./SetPager";
import ReportError from "./ReportError";
import { normaliseQuestion } from "./normaliseQuestion";
import { adBreaks } from "./adBreaks";
import type { ReportContext } from "./ReportError";

/**
 * The page every set is rendered on — topics, PYQ, aptitude, English, current
 * affairs. Tasks 7 to 10 all load their own content and hand it to this.
 *
 * ── The layout, in the order the reader meets it ──
 *
 * breadcrumb → H1 → intro → practice toggle → questions (with two in-article
 * ads interleaved) → pager → report link → the one app card.
 *
 * It is a CONTENT page in the monetisation sense: `placement("content")` gives
 * it in-article ads and a sticky bottom bar, and exactly one install CTA, at
 * the end. The app card is deliberately last — a reader who came from a search
 * result for a question should get the question, not a wall.
 *
 * ── A server component ──
 *
 * Everything here is server-rendered. The two client islands are
 * PracticeToggle (writes one attribute) and ReportError (a form). Both are
 * leaves; neither is given the question bank as a prop.
 *
 * It never calls headers() or cookies(). `lang` arrives as a prop from a page
 * under [lang], which gets it from route params, and every such page
 * prerenders. One headers() call in a shared component regressed static
 * generation for the whole site once already (Task 3); this component is the
 * base of every content page from Task 7 onward, so it would do it again on a
 * far larger scale.
 *
 * ── Ads ──
 *
 * adBreaks() decides where they go and which unit each is. AdSlot's in-article
 * placement requires an explicit ordinal (0 or 1) because two units exist and
 * reusing one reads as a duplicate to AdSense; the ordinal comes from the
 * break, never from a default.
 */

export interface Crumb {
  name: string;
  /** Already language-prefixed, e.g. href(lang, "/topics"). */
  href: string;
}

export default function SetPageShell({
  lang,
  title,
  intro,
  crumbs,
  questions,
  reportContext,
  startNumber = 1,
  prev,
  next,
  indexHref,
  langPath,
  hasHi = true,
  app,
  children,
}: {
  lang: Lang;
  /** The H1. */
  title: string;
  /** One sentence under the H1, optional. */
  intro?: ReactNode;
  /** Home → … → this set. The last entry is the current page. */
  crumbs: Crumb[];
  /** Raw question objects, in either bank shape. */
  questions: Record<string, unknown>[];
  /**
   * REQUIRED, not optional, even though every field inside ReportContext is
   * itself optional. A caller with genuinely nothing to add can pass `{}` —
   * that is a deliberate choice, made once, visible in the diff. Making this
   * prop optional at the SetPageShell level was found (Task 6 review,
   * 2026-09-08) to be an easy field to forget entirely: it sat 13th of 14
   * props, defaulted silently, and a report filed without it still succeeds
   * — it just lands in the CMS reports queue with no topic, chapter or set
   * to triage against, and nothing anywhere signals the gap. Every one of
   * Tasks 7-10 renders exactly one of these per page and knows its own
   * topic/chapter/set at the call site, so there is no real case where this
   * is unavailable — only cases where it was skipped by omission.
   */
  reportContext: ReportContext;
  /** The number of the first question, for a chapter paged across sets. */
  startNumber?: number;
  prev?: string | null;
  next?: string | null;
  indexHref?: string | null;
  /** Language-less path for the en/hi switch, e.g. "/topics/history/x/set-1". */
  langPath?: string;
  /** False when this set exists in only one language. */
  hasHi?: boolean;
  /** The end-of-page install card. Omitted when no app matches. */
  app?: AppEntry | null;
  /** Anything extra between the questions and the pager. */
  children?: ReactNode;
}) {
  const ads = new Set(placement("content").ads);
  const breaks = adBreaks(questions.length);
  const breakAt = new Map(breaks.map((b) => [b.afterIndex, b.ordinal]));

  // The wrapper PracticeToggle writes `data-practice` onto. useId(), not a
  // constant string: a hardcoded id was tried first and found, by an
  // independent build-and-inspect check (Task 6 review, 2026-09-08), to
  // produce invalid HTML (id="set-questions" twice) and a toggle that drove
  // only the FIRST shell's document.getElementById(target) match, the moment
  // a route ever rendered two SetPageShells. Neither failure produces a type
  // error or a failing test, so it would surface only as a live,
  // hard-to-trace production symptom. useId() removes it outright.
  //
  // Two shells on one route also duplicate anything ELSE this component
  // renders once per instance regardless of `practiceId` — the same review
  // found the sticky-bottom AdSlot (line ~221, gated only on `ads.has(...)`)
  // and the BreadcrumbList JSON-LD (keyed on `crumbs`, at the top of the
  // render) both appear twice in that case, each requesting/declaring the
  // same unit or data independently of this id. That is a DIFFERENT,
  // unfixed failure mode — rendering the shell twice at all is the problem,
  // not something useId() addresses — so a future page combining two sets on
  // one URL still needs its own dedicated header/footer treatment; it cannot
  // simply mount two SetPageShells side by side. No Task 7-10 page does this
  // today (confirmed against the plan).
  const practiceId = useId();

  const crumbJson = breadcrumbList(
    crumbs.map((c) => ({ name: c.name, url: abs(c.href) })),
  );

  // Normalised once here rather than inside the map, so the report form and
  // the rendered question are guaranteed to be describing the same thing —
  // a report must carry the exact text the reader was looking at.
  const normalised = questions.map((q) => normaliseQuestion(q, lang));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbJson) }}
      />

      <Container as="section" width="read" className="pb-2 pt-8 sm:pt-12">
        <nav aria-label={crumbs[0]?.name ?? t(lang, "common.home")} className="ui mb-4 text-sm text-ink-faint">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1;
            return (
              <span key={c.href + i}>
                {i > 0 && (
                  <span aria-hidden="true" className="px-2">
                    /
                  </span>
                )}
                {last ? (
                  <span aria-current="page">{c.name}</span>
                ) : (
                  <Link href={c.href} className="no-underline hover:underline">
                    {c.name}
                  </Link>
                )}
              </span>
            );
          })}
        </nav>

        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>

        {intro && <p className="mt-3 text-ink-soft">{intro}</p>}

        <div className="ui mt-3">
          <LangLink lang={lang} path={langPath} hasHi={hasHi} />
        </div>

        <div className="mt-5">
          <PracticeToggle target={practiceId} lang={lang} />
        </div>
      </Container>

      {/* The practice-mode wrapper. Its `data-practice` attribute is the only
          thing PracticeToggle touches; every answer below is in the HTML in
          both modes and is hidden with CSS. */}
      {/* `id` lives on this plain div rather than on Container, which takes no
          id — Container is shared chrome and is not this task's to widen. */}
      <div id={practiceId}>
        <Container as="div" width="read" className="pb-4">
          {normalised.map((q, i) => {
            const ordinal = breakAt.get(i);
            return (
              <div key={q.id ?? i}>
                <Question question={q} number={startNumber + i} lang={lang} />

                <ReportError question={q} lang={lang} context={reportContext} />

                {ads.has("in-article") && ordinal !== undefined && (
                  <AdSlot placement="in-article" ordinal={ordinal} lang={lang} />
                )}
              </div>
            );
          })}
        </Container>
      </div>

      <Container as="div" width="read" className="pb-10">
        {children}

        <SetPager prev={prev} next={next} indexHref={indexHref} lang={lang} />

        {/* The page's one install CTA — placement("content").installCta is
            "end", and this is the end. */}
        {app && (
          <div className="mt-8">
            <AppCard app={app} lang={lang} variant="end" />
          </div>
        )}
      </Container>

      {ads.has("sticky-bottom") && <AdSlot placement="sticky-bottom" lang={lang} />}
    </>
  );
}
