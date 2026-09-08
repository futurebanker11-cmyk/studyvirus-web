import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { listDays, findDay, isStale, monthLabel, type CaDay } from "@/lib/content/currentAffairs";
import { getJson } from "@/lib/content/loader";
import { hasHindiSet } from "@/lib/content/hindi";

import SetPageShell from "@/components/site/SetPageShell";
import type { ReportContext } from "@/components/site/ReportError";

/**
 * One day of current affairs — the whole day as one page.
 *
 * ── Why there is no [chapter]/[set] nesting here ──
 *
 * A CaDay IS one set. The bucket stores one file per date holding ten
 * questions (verified live: gk/0-Current Affairs/daily/2026_09_05.json,
 * en 10 / hi 10), so the day is rendered whole, the way a PYQ paper is, rather
 * than chunked into further sets. /current-affairs/daily/2026_09_05 is the URL
 * src/lib/seo/sitemaps.ts already declares.
 *
 * ── Why this route is NOT statically generated ──
 *
 * 146 days today and one more every day. Prerendering them would freeze the
 * set at build time, so a day published after the last deploy would 404 until
 * the next one. `dynamicParams = true` with no generateStaticParams renders on
 * demand and `revalidate = 3600` caches each for an hour — the same shape as
 * every other leaf set page in this plan, and here it is also what makes a
 * daily-publishing section work at all.
 *
 * ── noindex on stale days (the brief's Step 2) ──
 *
 * isStale() is >90 days old. A day from April is still worth crawling — it
 * carries links and it is the answer for someone searching that specific
 * event — but it should not compete in search against this week's questions,
 * so it gets `robots: { index: false, follow: true }`. Follow, deliberately,
 * not nofollow: the link equity keeps flowing to the monthly compilation and
 * the section index. sitemaps.ts already drops stale days from the sitemap by
 * the same isStale() call, so the two agree by construction.
 *
 * The date used for staleness is `new Date()` at render time, not build time,
 * and this route re-renders hourly — so a day crossing the 90-day line picks
 * up its noindex within the hour rather than at the next deploy.
 *
 * ── Content shape and Hindi ──
 *
 * GK-shaped { en: [...], hi: [...] } at the file level, so hasHindiSet against
 * a fresh read is the right guard — the same one topics and PYQ use. Every
 * indexed day is fully bilingual today (146 of 146), so /hi/ works throughout;
 * the branch is the guard for content that changes.
 *
 * No headers(), no cookies(), no <html>.
 */

export const dynamicParams = true;
export const revalidate = 3600;

interface DayFile {
  en?: Record<string, unknown>[];
  hi?: Record<string, unknown>[];
}

interface Resolved {
  day: CaDay;
  file: DayFile;
  questions: Record<string, unknown>[];
}

async function resolve(lang: Lang, date: string): Promise<Resolved | null> {
  const day = findDay(date);
  if (!day) return null;

  const file = await getJson<DayFile>(day.key);
  if (!file) return null;

  const en = Array.isArray(file.en) ? file.en : [];
  if (en.length === 0) return null;

  // Hindi only when the file carries Hindi for EVERY question.
  if (lang === "hi" && !hasHindiSet(file)) return null;

  const questions = lang === "hi" ? (file.hi as Record<string, unknown>[]) : en;
  if (!questions || questions.length === 0) return null;

  return { day, file, questions };
}

/** "5 September 2026" / "5 सितंबर 2026". */
function dayLabel(day: CaDay, lang: Lang): string {
  const d = parseInt(day.date.slice(-2), 10);
  return `${formatCount(d, lang)} ${monthLabel(day.month, lang)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; date: string }>;
}): Promise<Metadata> {
  const { lang: raw, date } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const r = await resolve(lang, date);
  if (!r) return {};
  const { day, file } = r;

  const label = dayLabel(day, lang);

  return {
    title: `${format(lang, "ca.dayH1", {
      date: label,
      questions: formatCount(day.enCount, lang),
    })} | StudyVirus`,
    description: format(lang, "ca.dayLede", { questions: formatCount(day.enCount, lang) }),
    alternates: buildAlternates({
      lang,
      path: `/current-affairs/daily/${day.date}`,
      hasHi: hasHindiSet(file),
    }),
    // Over 90 days old: keep it crawlable and keep its links live, but take it
    // out of the ranking race against fresher current affairs.
    ...(isStale(day) ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CurrentAffairsDayPage({
  params,
}: {
  params: Promise<{ lang: string; date: string }>;
}) {
  const { lang: raw, date } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const r = await resolve(lang, date);
  if (!r) notFound();
  const { day, file, questions } = r;

  const label = dayLabel(day, lang);
  const month = monthLabel(day.month, lang);

  // Previous/next by position in the real published days, never by date
  // arithmetic: listDays() skips any date the bucket does not have (there are
  // real gaps — 26 to 31 days per month), so day ± 1 would link a 404 off a
  // working page. listDays() is newest-first, so the NEXT day is the entry
  // BEFORE this one in the array.
  const days = listDays();
  const i = days.findIndex((d) => d.date === day.date);
  const newer = i > 0 ? days[i - 1] : null;
  const older = i >= 0 && i < days.length - 1 ? days[i + 1] : null;

  const base = "/current-affairs";

  // Real values, not {}. A current-affairs day has no topic/chapter in the
  // manifest sense, so the fields carry what a triager actually needs: the
  // section, and the date the question was published on.
  const reportContext: ReportContext = {
    source: "web-current-affairs",
    topicFolder: "current-affairs",
    topicName: t(lang, "nav.currentAffairs"),
    chapterName: label,
    fileName: day.key,
  };

  return (
    <SetPageShell
      lang={lang}
      title={format(lang, "ca.dayH1", {
        date: label,
        questions: formatCount(day.enCount, lang),
      })}
      intro={format(lang, "ca.dayLede", { questions: formatCount(day.enCount, lang) })}
      crumbs={[
        { name: t(lang, "common.home"), href: href(lang, "/") },
        { name: t(lang, "nav.currentAffairs"), href: href(lang, base) },
        { name: month, href: href(lang, `${base}/monthly/${day.month}`) },
        { name: label, href: href(lang, `${base}/daily/${day.date}`) },
      ]}
      questions={questions}
      reportContext={reportContext}
      // Older on the left, newer on the right — reading a section day by day
      // goes forward in time, so "next" is the newer day.
      prev={older ? href(lang, `${base}/daily/${older.date}`) : null}
      next={newer ? href(lang, `${base}/daily/${newer.date}`) : null}
      // "Up" from a day is its own month's compilation, which is the more
      // useful page than the section index for someone revising.
      indexHref={href(lang, `${base}/monthly/${day.month}`)}
      langPath={`${base}/daily/${day.date}`}
      hasHi={hasHindiSet(file)}
      // No app card: the apps registry keys off exam ids and a current-affairs
      // day belongs to no exam. Inventing one would mean inventing the app.
      app={null}
    />
  );
}
