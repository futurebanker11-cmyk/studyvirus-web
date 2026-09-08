import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { listMonths, daysOfMonth, monthLabel, type CaDay } from "@/lib/content/currentAffairs";
import { getJson } from "@/lib/content/loader";
import { hasHindiSet } from "@/lib/content/hindi";
import { placement } from "@/lib/seo/monetisation";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import LangLink from "@/components/site/LangLink";
import PracticeToggle from "@/components/site/PracticeToggle";
import ReportError, { type ReportContext } from "@/components/site/ReportError";
import { Question } from "@/components/site/QuestionList";
import { normaliseQuestion } from "@/components/site/normaliseQuestion";
import { adBreaks } from "@/components/site/adBreaks";

/**
 * A whole month of current affairs on one page — spec §5.8.
 *
 * ── Why this page does NOT use SetPageShell ──
 *
 * A month is up to 31 days × 10 questions. The obvious build — one
 * SetPageShell per day — is explicitly wrong, and SetPageShell's own doc
 * comment says why (Task 6 review, 2026-09-08): rendering two or more shells
 * on one route duplicates the sticky-bottom AdSlot and the BreadcrumbList
 * JSON-LD, because each instance emits both unconditionally. That is a real,
 * still-unfixed failure mode, and the comment names "a future page combining
 * two sets on one URL" — this page — as the case that would hit it.
 *
 * So this page is hand-built as ONE set of chrome (one breadcrumb, one H1, one
 * intro, one practice toggle, one BreadcrumbList, one sticky ad, one app-card
 * slot) wrapping a LOOP over the days, each day a <h2> plus its questions. It
 * reuses SetPageShell's own lower-level parts rather than reimplementing them:
 * Question + ReportError per question exactly as SetPageShell pairs them,
 * adBreaks() for the ad positions, placement("content") for the ad density, so
 * this page is monetised identically to every other content page.
 *
 * ── The ads, specifically ──
 *
 * adBreaks() is called ONCE over the whole page's question count, not once per
 * day. Called per day it would emit up to two ads per day — 60 in-article
 * units on one page against the two the AdSense account actually has, each
 * served 30 times. One call, one flat index across every day, gives the same
 * "after every 5th question, at most 2" the reader meets on a set page.
 *
 * ── Numbering ──
 *
 * Continuous down the whole page: day two starts at question 11, not 1. Same
 * `startNumber` idea SetPageShell uses for a chapter paged across sets, walked
 * across days here.
 *
 * ── Static ──
 *
 * 6 real months today (listMonths().length), growing by one a month. 6 × 2
 * languages = 12 prerendered routes. Small enough that the plan's usual
 * "index-shaped pages generate statically" rule applies, unlike the daily
 * pages. Each build reads up to 31 day files per month, which is the cost of
 * having the questions genuinely inline rather than linked.
 *
 * ── Indexable, deliberately ──
 *
 * No isStale() noindex here, unlike the daily pages. A monthly compilation is
 * an evergreen aggregation — "current affairs April 2026" is a real, lasting
 * query and this is the best page on the site to answer it. The daily pages
 * are the ones that go stale and compete with fresher siblings; this one
 * absorbs their value instead.
 *
 * ── Hindi ──
 *
 * A month is offered in Hindi only when EVERY day in it is fully bilingual —
 * the file-level hasHindiSet rule applied across the month. A part-Hindi month
 * would otherwise mix English days into a Hindi page. All 6 months qualify
 * today (146 of 146 days are bilingual).
 *
 * No headers(), no cookies(), no <html>.
 */

interface DayFile {
  en?: Record<string, unknown>[];
  hi?: Record<string, unknown>[];
}

/** One day's rendered content, in the page's language. */
interface LoadedDay {
  day: CaDay;
  questions: Record<string, unknown>[];
  /** 1-based number of this day's first question within the whole page. */
  startNumber: number;
}

interface Loaded {
  days: LoadedDay[];
  total: number;
  /** True when every day in the month is fully bilingual. */
  hasHi: boolean;
}

/**
 * Every day of the month, read and ordered oldest-first.
 *
 * daysOfMonth() already returns ascending date order (it reverses listDays'
 * newest-first). A month reads chronologically: someone revising April starts
 * on the 1st.
 */
async function load(month: string, lang: Lang): Promise<Loaded | null> {
  const days = daysOfMonth(month);
  if (days.length === 0) return null;

  const files = await Promise.all(days.map((d) => getJson<DayFile>(d.key)));

  // Bilingual for the month only if EVERY day is. Computed over the files
  // actually read, so it describes what this page is about to render.
  const hasHi = files.every((f) => Boolean(f) && hasHindiSet(f as DayFile));
  if (lang === "hi" && !hasHi) return null;

  const out: LoadedDay[] = [];
  let n = 1;

  for (let i = 0; i < days.length; i++) {
    const file = files[i];
    if (!file) continue;
    const en = Array.isArray(file.en) ? file.en : [];
    if (en.length === 0) continue;
    const questions = lang === "hi" ? ((file.hi as Record<string, unknown>[]) ?? []) : en;
    if (questions.length === 0) continue;

    out.push({ day: days[i], questions, startNumber: n });
    n += questions.length;
  }

  if (out.length === 0) return null;

  return { days: out, total: n - 1, hasHi };
}

/** "5 September 2026" / "5 सितंबर 2026". */
function dayLabel(day: CaDay, lang: Lang): string {
  const d = parseInt(day.date.slice(-2), 10);
  return `${formatCount(d, lang)} ${monthLabel(day.month, lang)}`;
}

export async function generateStaticParams() {
  // 6 months today. Enumerated from the content index, so a month with no
  // published day never becomes a prerendered empty page.
  return LANGS.flatMap((lang) => listMonths().map((m) => ({ lang, month: m.month })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; month: string }>;
}): Promise<Metadata> {
  const { lang: raw, month } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const data = await load(month, lang);
  if (!data) return {};

  const label = monthLabel(month, lang);

  return {
    title: `${format(lang, "ca.monthH1", {
      month: label,
      questions: formatCount(data.total, lang),
      days: formatCount(data.days.length, lang),
    })} | StudyVirus`,
    description: format(lang, "ca.monthLede", { month: label }),
    alternates: buildAlternates({
      lang,
      path: `/current-affairs/monthly/${month}`,
      hasHi: data.hasHi,
    }),
  };
}

export default async function CurrentAffairsMonthPage({
  params,
}: {
  params: Promise<{ lang: string; month: string }>;
}) {
  const { lang: raw, month } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const data = await load(month, lang);
  if (!data) notFound();

  const label = monthLabel(month, lang);
  const base = "/current-affairs";
  const path = `${base}/monthly/${month}`;

  const ads = new Set(placement("content").ads);
  // ONE call over the whole page's question count — see the file comment. The
  // map is keyed on the flat, page-wide question index, so a break can land
  // anywhere including in the middle of a day.
  const breakAt = new Map(adBreaks(data.total).map((b) => [b.afterIndex, b.ordinal]));

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.currentAffairs"), url: abs(href(lang, base)) },
    { name: label, url: abs(href(lang, path)) },
  ]);

  // The practice wrapper's id. A constant string is what SetPageShell
  // deliberately avoided (it would be invalid HTML the moment two wrappers
  // shared a page); there is exactly one wrapper on this route and it is not
  // a shared component, so a route-local literal is honest here — and unlike
  // useId() it works in an async server component, which this is.
  const practiceId = "ca-month-questions";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" width="read" className="pb-2 pt-8 sm:pt-12">
        <nav aria-label={t(lang, "nav.currentAffairs")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, base)} className="no-underline hover:underline">
            {t(lang, "nav.currentAffairs")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{label}</span>
        </nav>

        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {format(lang, "ca.monthH1", {
            month: label,
            questions: formatCount(data.total, lang),
            days: formatCount(data.days.length, lang),
          })}
        </h1>

        <p className="mt-3 text-ink-soft">{format(lang, "ca.monthLede", { month: label })}</p>

        <div className="ui mt-3">
          <LangLink lang={lang} path={path} hasHi={data.hasHi} />
        </div>

        <div className="mt-5">
          <PracticeToggle target={practiceId} lang={lang} />
        </div>
      </Container>

      {/* ── Jump to a day ──
          The day list §5.8 asks for. Anchors into this page rather than links
          away: the reader came here to read the month in one sitting, and each
          day's own page is one click further down from its heading. */}
      <Container as="section" width="read" aria-labelledby="jump" className="pb-2 pt-4">
        <h2 id="jump" className="font-display text-lg font-semibold">
          {t(lang, "ca.jumpHeading")}
        </h2>
        <ul className="ui mt-3 flex flex-wrap gap-2">
          {data.days.map((d) => (
            <li key={d.day.date}>
              <a
                href={`#d-${d.day.date}`}
                className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
              >
                {formatCount(parseInt(d.day.date.slice(-2), 10), lang)}
                <span className="text-xs text-ink-faint">{formatCount(d.questions.length, lang)}</span>
              </a>
            </li>
          ))}
        </ul>
      </Container>

      {/* The practice-mode wrapper — one for the whole page, matching
          SetPageShell's own contract with PracticeToggle. Every answer below
          is in the HTML in both modes and is hidden with CSS. */}
      <div id={practiceId}>
        <Container as="div" width="read" className="pb-4">
          {data.days.map((d) => {
            const dLabel = dayLabel(d.day, lang);

            // Per-question context, not per-day: every question on this page
            // needs to be distinguishable in the reports queue, and the day is
            // the only thing that varies between them here. Building it per
            // day and reusing the object across that day's questions is the
            // same information at a fraction of the allocations — the
            // question TEXT, which ReportError sends alongside, is what
            // identifies the individual question.
            const reportContext: ReportContext = {
              source: "web-current-affairs",
              topicFolder: "current-affairs",
              topicName: t(lang, "nav.currentAffairs"),
              // The month AND the date, so a triager reading the queue knows
              // which compilation page and which day a report came from.
              chapterName: `${label} — ${dLabel}`,
              fileName: d.day.key,
            };

            return (
              <section key={d.day.date} aria-labelledby={`d-${d.day.date}`} className="pt-8 first:pt-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line-strong pb-2">
                  <h2
                    id={`d-${d.day.date}`}
                    className="scroll-mt-20 font-display text-xl font-semibold"
                  >
                    {dLabel}
                  </h2>
                  <Link
                    href={href(lang, `${base}/daily/${d.day.date}`)}
                    className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
                  >
                    {formatCount(d.questions.length, lang)} {t(lang, "common.questions")} →
                  </Link>
                </div>

                {/* Question + ReportError per question, the exact pairing
                    SetPageShell uses in its own render loop. QuestionList's
                    default export renders only the questions — it does not
                    render ReportError — so the pair is assembled here. */}
                {d.questions.map((raw, i) => {
                  const number = d.startNumber + i;
                  // The page-wide 0-based index, which is what adBreaks keyed
                  // its positions on.
                  const flat = number - 1;
                  const ordinal = breakAt.get(flat);
                  const q = normaliseQuestion(raw, lang);

                  return (
                    <div key={`${d.day.date}-${q.id ?? i}`}>
                      <Question question={q} number={number} lang={lang} />

                      <ReportError question={q} lang={lang} context={reportContext} />

                      {ads.has("in-article") && ordinal !== undefined && (
                        <AdSlot placement="in-article" ordinal={ordinal} lang={lang} />
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}
        </Container>
      </div>

      <Container as="div" width="read" className="pb-10 pt-6">
        <Link
          href={href(lang, base)}
          className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
        >
          ← {t(lang, "ca.backToIndex")}
        </Link>
      </Container>

      {/* The page's ONE sticky ad — the duplication SetPageShell warns about is
          avoided precisely by this being rendered here, once, outside the
          per-day loop. No app card: the registry keys off exam ids and current
          affairs belongs to no exam, so placement("content").installCta has
          nothing real to render. */}
      {ads.has("sticky-bottom") && <AdSlot placement="sticky-bottom" lang={lang} />}
    </>
  );
}
