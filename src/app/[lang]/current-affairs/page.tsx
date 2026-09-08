import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { listDays, listMonths, daysOfMonth, monthLabel, type CaDay } from "@/lib/content/currentAffairs";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import LangLink from "@/components/site/LangLink";

/**
 * The current-affairs index: this month day by day, the last 30 days, and
 * every monthly compilation.
 *
 * ── Links, not questions ──
 *
 * No questions are rendered here. This page's job is to get a reader to the
 * day or the month they want in one click; the day pages and the monthly
 * compilations are where the content lives. Inlining 146 days of questions
 * would make this the largest page on the site and the least useful.
 *
 * ── Where the days come from ──
 *
 * listDays() enumerates the content index's gk/0-Current Affairs/daily
 * directory, newest first, skipping any file with no English questions. 146
 * real days across 6 months today (2026-04-01 … 2026-09-07). Nothing is
 * generated from a date range: a day the bucket does not have is a day this
 * page does not link.
 *
 * ── "This month" ──
 *
 * The month of the NEWEST published day, not `new Date()`. Publishing lags —
 * the newest day today is the 7th of the current month — and a page that
 * headed a section with a month it then listed no days for would be exactly
 * the kind of self-contradicting number this rebuild exists to remove. It also
 * keeps the page's output a pure function of the content index, so the
 * prerendered HTML does not silently go stale at midnight.
 *
 * No headers(), no cookies(), no <html>. Statically generated in both
 * languages.
 */

const RECENT_DAYS = 30;

interface Data {
  /** The month of the newest published day, e.g. "2026_09". */
  currentMonth: string;
  currentMonthDays: CaDay[];
  recent: CaDay[];
  months: { month: string; days: number; questions: number }[];
  totalQuestions: number;
}

function gather(): Data | null {
  const days = listDays();
  if (days.length === 0) return null;

  const currentMonth = days[0].month;

  return {
    currentMonth,
    currentMonthDays: daysOfMonth(currentMonth),
    // listDays() is already newest-first, so the first 30 are the last 30.
    recent: days.slice(0, RECENT_DAYS),
    // listMonths() preserves listDays' newest-first order, so the newest
    // month heads the compilation list without a second sort.
    months: listMonths().map((m) => ({
      month: m.month,
      days: m.days.length,
      questions: m.days.reduce((n, d) => n + d.enCount, 0),
    })),
    totalQuestions: days.reduce((n, d) => n + d.enCount, 0),
  };
}

/** "5 September 2026" / "5 सितंबर 2026" — the day plus monthLabel's own month. */
function dayLabel(day: CaDay, lang: Lang): string {
  const d = parseInt(day.date.slice(-2), 10);
  return `${formatCount(d, lang)} ${monthLabel(day.month, lang)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const data = gather();
  if (!data) return {};

  return {
    title: `${format(lang, "ca.h1", {
      month: monthLabel(data.currentMonth, lang),
      questions: formatCount(data.totalQuestions, lang),
    })} | StudyVirus`,
    description: t(lang, "ca.lede"),
    alternates: buildAlternates({ lang, path: "/current-affairs", hasHi: true }),
  };
}

export default async function CurrentAffairsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const data = gather();
  if (!data) notFound();

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.currentAffairs"), url: abs(href(lang, "/current-affairs")) },
  ]);

  // The last-30 list drops any day already shown under "this month", so a
  // reader is not given the same link twice in two adjacent sections.
  const inCurrentMonth = new Set(data.currentMonthDays.map((d) => d.date));
  const recent = data.recent.filter((d) => !inCurrentMonth.has(d.date));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.currentAffairs")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "nav.currentAffairs")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "ca.h1", {
            month: monthLabel(data.currentMonth, lang),
            questions: formatCount(data.totalQuestions, lang),
          })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "ca.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/current-affairs" hasHi />
        </div>
      </Container>

      {/* ── This month, day by day ── */}
      <Container as="section" aria-labelledby="this-month" className="pt-10">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="this-month" className="font-display text-2xl font-semibold">
            {t(lang, "ca.thisMonthHeading")}
          </h2>
          <Link
            href={href(lang, `/current-affairs/monthly/${data.currentMonth}`)}
            className="ui text-sm text-ink-soft underline-offset-4 hover:text-ink"
          >
            {t(lang, "ca.monthLink")} →
          </Link>
        </div>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.currentMonthDays.map((d) => (
            <li key={d.date}>
              <Link
                href={href(lang, `/current-affairs/daily/${d.date}`)}
                className="group flex h-full items-baseline justify-between gap-4 rounded-lg border border-line bg-surface p-4 no-underline"
              >
                <span className="font-display text-base font-semibold text-ink group-hover:underline">
                  {dayLabel(d, lang)}
                </span>
                <span className="ui shrink-0 text-xs text-ink-faint">
                  {format(lang, "pyqExam.paperMeta", { questions: formatCount(d.enCount, lang) })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ── The last 30 days ──
          Only the ones not already listed above, so the section is dropped
          entirely in the first days of a month rather than rendered empty. */}
      {recent.length > 0 && (
        <Container as="section" aria-labelledby="recent" className="pt-12">
          <h2 id="recent" className="font-display text-2xl font-semibold">
            {t(lang, "ca.recentHeading")}
          </h2>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {recent.map((d) => (
              <li key={d.date}>
                <Link
                  href={href(lang, `/current-affairs/daily/${d.date}`)}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  {dayLabel(d, lang)}
                  <span className="text-xs text-ink-faint">{formatCount(d.enCount, lang)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── Monthly compilations ──
          The evergreen half of this section: a whole month on one page is what
          a reader revising three weeks late actually wants. */}
      <Container as="section" aria-labelledby="monthly" className="pt-12">
        <h2 id="monthly" className="font-display text-2xl font-semibold">
          {t(lang, "ca.monthlyHeading")}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.months.map((m) => (
            <li key={m.month}>
              <Link
                href={href(lang, `/current-affairs/monthly/${m.month}`)}
                className="group block h-full rounded-lg border border-line bg-surface p-4 no-underline"
              >
                <span className="font-display text-base font-semibold text-ink group-hover:underline">
                  {monthLabel(m.month, lang)}
                </span>
                <span className="ui mt-1 block text-xs text-ink-faint">
                  {format(lang, "ca.monthMeta", {
                    days: formatCount(m.days, lang),
                    questions: formatCount(m.questions, lang),
                  })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      <div className="pb-12" />
    </>
  );
}
