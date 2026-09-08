import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { loadPyqExams, papersOf, pyqSlug, findPyqBySlug, type PyqExam } from "@/lib/content/pyq";
import { pyqSlugOverrides, appPackageFor } from "@/lib/content/examFacts";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { playUrl } from "@/lib/seo/referrer";
import { placement } from "@/lib/seo/monetisation";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";

/**
 * One PYQ exam's paper list — every set, with its question count, linking to
 * the full paper.
 *
 * ── Static ──
 *
 * generateStaticParams enumerates every exam loadPyqExams() returns (already
 * filtered to exams with at least one real, indexed paper) × both languages,
 * the same LANGS.flatMap shape Task 5's exam hub and Task 7's topic page use.
 * pyqSlug() (not the raw PyqExam.id) is the URL segment, resolved back to an
 * exam with findPyqBySlug() — the two must use the same slugOverrides map or
 * a param generated here would 404 on its own page.
 *
 * ── The app card ──
 *
 * Same two-tier fallback as the exam hub (Task 5): a real registry entry
 * first, then a plain Play link from appPackageFor(exam.id), then nothing at
 * all when neither resolves. No invented name, icon or rating.
 *
 * No headers(), no cookies(), no <html>.
 */

export async function generateStaticParams() {
  const exams = await loadPyqExams();
  const overrides = pyqSlugOverrides();
  return LANGS.flatMap((lang) =>
    exams.map((e) => ({ lang, exam: pyqSlug(e, overrides) })),
  );
}

async function resolveExam(slug: string): Promise<PyqExam | undefined> {
  const exams = await loadPyqExams();
  return findPyqBySlug(exams, slug, pyqSlugOverrides());
}

async function appFor(examId: string): Promise<{ app: AppEntry | null; pkg: string | null }> {
  const reg = await loadAppsRegistry();
  const app = reg ? (appForExam(reg, examId) ?? null) : null;
  const pkg = app?.package ?? appPackageFor(examId);
  return { app, pkg };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; exam: string }>;
}): Promise<Metadata> {
  const { lang: raw, exam: slug } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const exam = await resolveExam(slug);
  if (!exam) return {};

  const name = lang === "hi" ? exam.hi : exam.en;
  const papers = papersOf(exam);
  const questions = papers.reduce((n, p) => n + p.enCount, 0);
  const title = `${format(lang, "pyqExam.h1", { exam: name })} | StudyVirus`;

  return {
    title,
    description: format(lang, "pyqExam.lede", {
      papers: formatCount(papers.length, lang),
      questions: formatCount(questions, lang),
    }),
    alternates: buildAlternates({ lang, path: `/pyq/${slug}`, hasHi: true }),
  };
}

export default async function PyqExamPage({
  params,
}: {
  params: Promise<{ lang: string; exam: string }>;
}) {
  const { lang: raw, exam: slug } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const exam = await resolveExam(slug);
  if (!exam) notFound();

  const name = lang === "hi" ? exam.hi : exam.en;
  const papers = papersOf(exam);
  const questions = papers.reduce((n, p) => n + p.enCount, 0);
  const { app, pkg } = await appFor(exam.id);
  const ads = new Set(placement("exam-hub").ads);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.pyq"), url: abs(href(lang, "/pyq")) },
    { name, url: abs(href(lang, `/pyq/${slug}`)) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.pyq")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/pyq")} className="no-underline hover:underline">
            {t(lang, "nav.pyq")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{name}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          <span aria-hidden="true" className="mr-2">
            {exam.emoji}
          </span>
          {format(lang, "pyqExam.h1", { exam: name })}
        </h1>

        <p className="mt-4 max-w-measure text-lg text-ink-soft">
          {format(lang, "pyqExam.lede", {
            papers: formatCount(papers.length, lang),
            questions: formatCount(questions, lang),
          })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path={`/pyq/${slug}`} hasHi />
        </div>
      </Container>

      {/* ── Papers ── */}
      <Container as="section" aria-labelledby="papers" className="pt-10">
        <h2 id="papers" className="sr-only">
          {format(lang, "pyqExam.h1", { exam: name })}
        </h2>
        <ul className="ui grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
          {papers.map((p) => (
            <li key={p.n}>
              <Link
                href={href(lang, `/pyq/${slug}/set-${p.n}`)}
                className="group flex flex-col items-center justify-center gap-1 rounded-lg border border-line bg-surface p-3 no-underline hover:border-line-strong"
              >
                <span className="font-display text-base font-semibold text-ink group-hover:underline">
                  {t(lang, "common.set")} {formatCount(p.n, lang)}
                </span>
                <span className="text-xs text-ink-faint">
                  {format(lang, "pyqExam.paperMeta", { questions: formatCount(p.enCount, lang) })}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* ── The app, at the end — one install CTA per page (spec §6). ── */}
      {app ? (
        <Container as="section" aria-labelledby="app" className="pt-12">
          <h2 id="app" className="sr-only">
            {t(lang, "exam.appHeading")}
          </h2>
          <AppCard app={app} lang={lang} variant="end" />
        </Container>
      ) : pkg ? (
        <Container as="section" aria-labelledby="app" className="pt-12">
          <h2 id="app" className="sr-only">
            {t(lang, "exam.appHeading")}
          </h2>
          <div className="rounded-lg border border-line bg-surface p-4">
            <h3 className="text-lg font-semibold">
              {format(lang, "exam.appFallbackName", { exam: name })}
            </h3>
            <p className="ui mt-1 text-xs text-ink-faint">{t(lang, "common.free")}</p>
            <p className="mt-2 max-w-measure text-sm text-ink-soft">{t(lang, "exam.appSub")}</p>
            <a
              href={playUrl(pkg, "content", slug)}
              target="_blank"
              rel="noopener noreferrer"
              className="ui mt-3 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
            >
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
              </svg>
              {t(lang, "app.getTheApp")}
            </a>
          </div>
        </Container>
      ) : null}

      {ads.has("footer") && (
        <Container className="pt-8">
          <AdSlot placement="footer" lang={lang} />
        </Container>
      )}

      <div className="pb-12" />
    </>
  );
}
