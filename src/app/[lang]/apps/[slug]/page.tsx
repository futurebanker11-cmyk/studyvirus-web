import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { EXAMS, EXAM_CATEGORIES, type Exam } from "@/lib/exams";
import { pyqSlugOverrides } from "@/lib/content/examFacts";
import { loadTopics, topicsForExam, chaptersOf } from "@/lib/content/topics";
import { loadPyqExams, papersOf, pyqSlug } from "@/lib/content/pyq";
import { loadAppsRegistry, appBySlug, type AppEntry } from "@/lib/content/apps";
import { playUrl } from "@/lib/seo/referrer";
import { placement } from "@/lib/seo/monetisation";
import { breadcrumbList, softwareApplication } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";

/**
 * A single app's landing page (spec §5.10).
 *
 * ── This route generates ZERO pages today, and that is correct ──
 * generateStaticParams reads the apps registry and nothing else. The registry
 * is not in the bucket (apps/registry.json 404s from the CDN, verified
 * 2026-09-08) and the ops job that will write it (spec §7.1, separate repo)
 * has not been built, so the params list is empty and Next prerenders none of
 * these pages. That is the intended behaviour, not a gap to paper over.
 *
 * There is deliberately NO fallback to EXAMS here, unlike /apps. This page is
 * built out of things only the registry knows — the Play description, the
 * screenshot URLs, the rating — and a version synthesised from exams.ts would
 * be a page of headings with nothing under them. /apps already covers every
 * exam that has an app, and every exam hub already links to its own app, so
 * nothing is unreachable while this route is empty.
 *
 * ── On counts ──
 * The comparison table's numbers are read the same way the exam hub reads
 * them (loadTopics → topicsForExam → chaptersOf, loadPyqExams → papersOf), so
 * this page and /exam/{slug} cannot advertise different totals for the same
 * exam. Nothing here is a typed-in number.
 *
 * ── On JSON-LD ──
 * BreadcrumbList and SoftwareApplication. The rating passes straight through
 * to softwareApplication(), which drops aggregateRating below 5 ratings on its
 * own — so an app with two reviews never ships a "5.0" to a crawler, and this
 * page needs no gate of its own.
 *
 * ── On static generation ──
 * No headers(), no cookies(), no <html>: the [lang] layout owns the shell.
 */

export async function generateStaticParams() {
  // Registry-only, and an empty list is the expected result today.
  const reg = await loadAppsRegistry();
  if (!reg) return [];
  return LANGS.flatMap((lang) => reg.apps.map((a) => ({ lang, slug: a.slug })));
}

/** The exam an app is tied to, or null for a general app. */
function examFor(app: AppEntry): Exam | null {
  if (!app.examId) return null;
  return EXAMS.find((e) => e.id === app.examId) ?? null;
}

/**
 * The site-side counts for the exam this app covers.
 *
 * Both loaders go through the content loader, so they are awaited together
 * rather than one after the other. A general app has no exam and pays for
 * neither read.
 */
async function siteCounts(exam: Exam | null) {
  if (!exam) return { chapters: 0, questions: 0, papers: 0, pyqHref: null as string | null };
  const [topics, pyqExams] = await Promise.all([loadTopics(), loadPyqExams()]);

  const subjects = topicsForExam(topics, exam.id).map((topic) => chaptersOf(topic));
  const chapters = subjects.reduce((n, chs) => n + chs.length, 0);
  const questions = subjects.reduce(
    (n, chs) => n + chs.reduce((m, c) => m + c.enCount, 0),
    0,
  );

  const pyq = pyqExams.find((p) => p.id === exam.id) ?? null;
  const papers = pyq ? papersOf(pyq).length : 0;

  return {
    chapters,
    questions,
    papers,
    pyqHref: pyq ? `/pyq/${pyqSlug(pyq, pyqSlugOverrides())}` : null,
  };
}

async function findApp(slug: string): Promise<AppEntry | null> {
  const reg = await loadAppsRegistry();
  if (!reg) return null;
  return appBySlug(reg, slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const app = await findApp(slug);
  if (!app) return {};

  return {
    title: `${format(lang, "appPage.titleSuffix", { app: app.name })} | StudyVirus`,
    // The registry's own Play description, trimmed to a snippet length rather
    // than rewritten — the site does not author marketing copy for its apps.
    // `?? ""`: the registry is unvalidated per-entry (see the same guard in
    // the page component below) — a missing description must not throw here.
    description: (app.description ?? "").slice(0, 300),
    alternates: buildAlternates({ lang, path: `/apps/${app.slug}`, hasHi: true }),
  };
}

export default async function AppPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const app = await findApp(slug);
  if (!app) notFound();

  // AppEntry types description/screenshots as always present, but the
  // registry comes from a bare JSON.parse cast (getJson, loader.ts) that
  // loadAppsRegistry() validates only at the {apps: [...]} level, never
  // per-entry — so a real ops-job entry missing either field would
  // otherwise throw here and fail the build for this one page (Task 11
  // review, 2026-09-08). Zero blast radius today (no registry exists, this
  // route generates no pages), armed for the day one first ships.
  const description = app.description ?? "";
  const screenshots = app.screenshots ?? [];

  const exam = examFor(app);
  const counts = await siteCounts(exam);
  const examName = exam ? (lang === "hi" ? exam.hi : exam.en) : null;
  const url = playUrl(app.package, "app-page", app.slug);
  const ads = new Set(placement("apps").ads);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.apps"), url: abs(href(lang, "/apps")) },
    { name: app.name, url: abs(href(lang, `/apps/${app.slug}`)) },
  ]);

  // rating/ratingCount pass through untouched: softwareApplication() itself
  // omits aggregateRating below 5 ratings.
  const appJsonLd = softwareApplication({
    name: app.name,
    description,
    packageName: app.package,
    url,
    rating: app.rating,
    ratingCount: app.ratingCount,
  });

  /** The comparison rows: real counts on the left, what the app adds on the right. */
  const rows: { what: string; site: string; app: string }[] = [];
  if (counts.chapters > 0) {
    rows.push({
      what: t(lang, "common.chapters"),
      site: formatCount(counts.chapters, lang),
      app: t(lang, "appPage.compareIncluded"),
    });
  }
  if (counts.questions > 0) {
    rows.push({
      what: t(lang, "common.questions"),
      site: formatCount(counts.questions, lang),
      app: t(lang, "appPage.compareIncluded"),
    });
  }
  if (counts.papers > 0) {
    rows.push({
      what: t(lang, "common.papers"),
      site: formatCount(counts.papers, lang),
      app: t(lang, "appPage.compareIncluded"),
    });
  }
  // Two rows that are true of every app and every reader, so they are added
  // whatever the exam's counts turn out to be — and one of them favours the
  // website, which is the point: this is a comparison, not a pitch.
  rows.push({
    what: t(lang, "appPage.compareOffline"),
    site: t(lang, "appPage.compareNo"),
    app: t(lang, "appPage.compareYes"),
  });
  rows.push({
    what: t(lang, "appPage.compareNoInstall"),
    site: t(lang, "appPage.compareYes"),
    app: t(lang, "appPage.compareNo"),
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
      />

      {/* ── Header ── */}
      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.apps")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/apps")} className="no-underline hover:underline">
            {t(lang, "nav.apps")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{app.name}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "appPage.titleSuffix", { app: app.name })}
        </h1>

        <div className="ui mt-4">
          <LangLink lang={lang} path={`/apps/${app.slug}`} hasHi />
        </div>
      </Container>

      {/* ── Hero: the page's one primary CTA, above everything else ──
          placement("apps").installCta is "hero", and AppCard's hero variant
          renders the icon, the rating (at >= 5 ratings, its own gate) and the
          install button. */}
      <Container as="section" aria-labelledby="install" className="pt-6">
        <h2 id="install" className="sr-only">
          {t(lang, "appPage.downloadHeading")}
        </h2>
        <AppCard app={app} lang={lang} variant="hero" />
      </Container>

      {/* ── What's inside: the registry's own Play description ── */}
      <Container as="section" aria-labelledby="inside" className="pt-12">
        <h2 id="inside" className="font-display text-2xl font-semibold">
          {t(lang, "appPage.whatsInside")}
        </h2>
        <p className="mt-3 max-w-measure whitespace-pre-line text-ink-soft">
          {description}
        </p>
      </Container>

      {/* ── Screenshots ──
          Real per-app images mirrored to R2 by the ops job. The section is
          skipped entirely when the entry carries none rather than shown empty. */}
      {screenshots.length > 0 && (
        <Container as="section" aria-labelledby="shots" className="pt-12">
          <h2 id="shots" className="font-display text-2xl font-semibold">
            {t(lang, "appPage.screenshots")}
          </h2>
          {/* A scroller, not a grid: phone screenshots are tall and narrow, and
              six of them in a row would each be unreadably small. */}
          <ul className="mt-4 flex snap-x gap-4 overflow-x-auto pb-2">
            {screenshots.map((src, i) => (
              <li key={src} className="shrink-0 snap-start">
                {/* Plain <img>: remote CDN files outside the next/image
                    allowlist, the same call AppCard makes for the icon. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={format(lang, "appPage.screenshotAlt", { app: app.name, n: i + 1 })}
                  width={200}
                  height={400}
                  loading="lazy"
                  className="h-auto w-[200px] rounded-lg border border-line"
                />
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── Why the app ── */}
      <Container as="section" aria-labelledby="why" className="pt-12">
        <h2 id="why" className="font-display text-2xl font-semibold">
          {t(lang, "appPage.whyHeading")}
        </h2>
        <ul className="mt-3 max-w-measure list-disc space-y-2 pl-5 text-ink-soft">
          <li>{t(lang, "appPage.whyOffline")}</li>
          <li>{t(lang, "appPage.whyProgress")}</li>
          <li>{t(lang, "appPage.whySite")}</li>
        </ul>
      </Container>

      {/* ── App or website ──
          Every number in this table is one this exam actually has on the site
          today, read from the same functions the exam hub reads. */}
      <Container as="section" aria-labelledby="compare" className="pt-12">
        <h2 id="compare" className="font-display text-2xl font-semibold">
          {t(lang, "appPage.compareHeading")}
        </h2>
        <p className="mt-1 max-w-measure text-sm text-ink-soft">
          {t(lang, "appPage.compareSub")}
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="ui w-full min-w-[24rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-ink-faint">
                <th scope="col" className="py-2 pr-4 font-medium">
                  {t(lang, "appPage.compareWhat")}
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  {t(lang, "appPage.compareSite")}
                </th>
                <th scope="col" className="py-2 font-medium">
                  {t(lang, "appPage.compareApp")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.what} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-ink">
                    {r.what}
                  </th>
                  <td className="py-2 pr-4 text-ink-soft">{r.site}</td>
                  <td className="py-2 text-ink-soft">{r.app}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>

      {/* ── Into the site ──
          An exam app points at its own hub and papers; a general app has no
          single hub, so it points at the subject index. */}
      <Container as="section" aria-labelledby="explore" className="pt-12">
        <h2 id="explore" className="font-display text-2xl font-semibold">
          {t(lang, "appPage.exploreHeading")}
        </h2>
        <ul className="ui mt-4 flex flex-wrap gap-2">
          {exam && examName ? (
            <>
              <li>
                <Link
                  href={href(lang, `/exam/${exam.slug}`)}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  <span aria-hidden="true">{exam.icon}</span>
                  {format(lang, "appPage.examHubLink", { exam: examName })}
                </Link>
              </li>
              {counts.pyqHref && (
                <li>
                  <Link
                    href={href(lang, counts.pyqHref)}
                    className="inline-flex items-center rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                  >
                    {format(lang, "exam.pyqHeading", { exam: examName })}
                  </Link>
                </li>
              )}
            </>
          ) : null}
          <li>
            <Link
              href={href(lang, "/topics")}
              className="inline-flex items-center rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
            >
              {t(lang, "apps.practiceAllTopics")}
            </Link>
          </li>
          <li>
            <Link
              href={href(lang, "/apps")}
              className="inline-flex items-center rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
            >
              {t(lang, "appPage.backToApps")}
            </Link>
          </li>
        </ul>
        {exam && (
          <p className="ui mt-3 text-xs text-ink-faint">
            {EXAM_CATEGORIES[exam.category] ?? exam.category}
          </p>
        )}
      </Container>

      {/* ── Download ──
          The same install link once more at the end of the page, for a reader
          who has read down rather than clicked the hero. */}
      <Container as="section" aria-labelledby="download" className="pt-12">
        <h2 id="download" className="font-display text-2xl font-semibold">
          {t(lang, "appPage.downloadHeading")}
        </h2>
        <p className="mt-2 max-w-measure text-sm text-ink-soft">{t(lang, "exam.appSub")}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="ui mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
        >
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
          </svg>
          {t(lang, "app.getTheApp")}
        </a>
      </Container>

      {/* placement("apps") gives this page one footer unit, below every
          install button. "footer" forbids an ordinal. */}
      {ads.has("footer") && (
        <Container className="pt-10">
          <AdSlot placement="footer" lang={lang} />
        </Container>
      )}

      <div className="pb-12" />
    </>
  );
}
