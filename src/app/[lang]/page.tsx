import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { siteStats, formatCount } from "@/lib/content/stats";
import { EXAMS } from "@/lib/exams";
import { loadTopics, visibleTopics, chaptersOf } from "@/lib/content/topics";
import { loadPyqExams, papersOf, pyqSlug } from "@/lib/content/pyq";
import { loadAppsRegistry } from "@/lib/content/apps";
import { listDays } from "@/lib/content/currentAffairs";
import { placement } from "@/lib/seo/monetisation";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";
import StatRow, { type Stat } from "@/components/site/StatRow";
import ExamCategoryGrid from "@/components/site/ExamCategoryGrid";
import SubjectGrid, { type SubjectCard } from "@/components/site/SubjectGrid";

/**
 * The home page.
 *
 * Two things about it are non-negotiable, and both are reactions to what it
 * replaces.
 *
 * First, every number is computed. The page this supersedes carried
 * "200,000+ Free GK Questions" in its <title>, "23K+" in its own hero, and
 * "10 Lakh+ Students" in the footer — three claims on one screen, two of them
 * mutually contradictory and one unfalsifiable. Here the totals come from
 * siteStats(), which sums the generated content index, so the title and the
 * hero cannot disagree with each other or with the content: they read the
 * same function.
 *
 * Second, exams come first. The audience arrives on "ssc gd question paper",
 * not on "general knowledge", so the first section below the fold is the full
 * category → exam list — every one of the 74 hubs, as plain links a crawler
 * can follow, rather than ten hand-picked pills and a carousel.
 *
 * There is no <html>/<body> here: src/app/[lang]/layout.tsx renders the shell
 * from its own route params, which is what keeps the whole site statically
 * generated. Nothing on this page reads headers() or cookies() for the same
 * reason.
 */

/**
 * Everything the page reads, fetched once.
 *
 * loadTopics, loadPyqExams and loadAppsRegistry each go through the content
 * loader (R2 at runtime, the CDN during a build), so awaiting them in sequence
 * would serialise three round-trips before the first byte of the busiest page
 * on the site. Promise.all makes it one wait. The synchronous readers —
 * siteStats(), listDays(), chaptersOf() — hit the generated index in memory
 * and cost nothing, so they stay outside.
 *
 * Every loader returns null or an empty array rather than throwing when its
 * object is missing, and each section below renders nothing at all in that
 * case. That is deliberate: a CDN blip should cost the reader one strip, not
 * the whole page.
 */
async function homeData() {
  const [topics, pyqExams, appsRegistry] = await Promise.all([
    loadTopics(),
    loadPyqExams(),
    loadAppsRegistry(),
  ]);
  return { topics, pyqExams, appsRegistry };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;
  const s = siteStats();
  const questions = formatCount(s.questions, lang);

  const title = `${questions} free practice questions for ${EXAMS.length} government exams | StudyVirus`;

  return {
    title,
    description:
      lang === "hi"
        ? `${EXAMS.length} सरकारी परीक्षाओं के लिए ${questions} निःशुल्क अभ्यास प्रश्न, हिंदी और अंग्रेज़ी दोनों में — पिछले वर्षों के प्रश्नपत्र, विषयवार सेट और करेंट अफेयर्स। कोई रजिस्ट्रेशन नहीं।`
        : `${questions} free practice questions in Hindi and English for ${EXAMS.length} Indian government exams — previous-year papers, chapter-wise sets and daily current affairs. No sign-up.`,
    alternates: buildAlternates({ lang, path: "/", hasHi: true }),
  };
}

/** A section heading plus its one-line subheading, and an optional "see all". */
function SectionHead({
  id,
  heading,
  sub,
  more,
}: {
  id: string;
  heading: string;
  sub: string;
  more?: { to: string; label: string };
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <h2 id={id} className="font-display text-2xl font-semibold sm:text-3xl">
          {heading}
        </h2>
        <p className="mt-1 max-w-measure text-sm text-ink-soft">{sub}</p>
      </div>
      {more && (
        <Link href={more.to} className="ui shrink-0 text-sm no-underline hover:underline">
          {more.label}
        </Link>
      )}
    </div>
  );
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const s = siteStats();
  const questions = formatCount(s.questions, lang);
  const { topics, pyqExams, appsRegistry } = await homeData();

  // placement() decides which ads this page kind carries; the home page gets
  // one in-feed unit and one above the footer. Asking it rather than hard-coding
  // the two slots keeps every page's ad load in a single readable table.
  const ads = new Set(placement("home").ads);

  // chaptersOf() reads the in-memory index, so walking every visible topic once
  // here is cheap — and it is the only place these counts are derived, so the
  // cards and any total taken from them cannot drift apart.
  const subjects: SubjectCard[] = visibleTopics(topics)
    .map((topic) => {
      const chs = chaptersOf(topic);
      return {
        topic,
        chapters: chs.length,
        questions: chs.reduce((n, c) => n + c.enCount, 0),
      };
    })
    .sort((a, b) => b.questions - a.questions);

  // The PYQ strip shows the exams with the most papers behind them; the full
  // list lives on /pyq. Slug overrides are a /pyq/[exam] concern and there are
  // none configured, so the default id-dashing applies.
  const pyqTop = pyqExams
    .map((exam) => ({ exam, papers: papersOf(exam).length }))
    .sort((a, b) => b.papers - a.papers)
    .slice(0, 8);

  const days = listDays();
  const latestDays = days.slice(0, 6);

  // One app per exam family would be 40 cards; the strip shows the three most
  // recently updated, and /apps carries the rest.
  const apps = (appsRegistry?.apps ?? [])
    .filter((a) => a.examId)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 3);

  const stats: Stat[] = [
    { key: "home.statQuestions", value: s.questions },
    { key: "home.statChapters", value: s.chapters },
    { key: "home.statPapers", value: s.papers },
    { key: "home.statCaDays", value: s.caDays },
  ];

  return (
    <>
      {/* ── Hero ──
          First in the render and dependent on nothing that is awaited: the H1
          and the stat row are built from siteStats() and EXAMS, both in
          memory, so the largest text block paints without waiting on the
          content loader. */}
      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
          {format(lang, "home.h1", { questions, exams: EXAMS.length })}
        </h1>
        <p className="mt-4 max-w-measure text-lg text-ink-soft">{t(lang, "home.lede")}</p>

        <div className="ui mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={href(lang, "/exam")}
            className="inline-flex items-center rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
          >
            {t(lang, "home.ctaExams")}
          </Link>
          <Link
            href={href(lang, "/topics")}
            className="inline-flex items-center rounded-md border border-line-strong px-5 py-2.5 text-sm font-semibold text-ink no-underline transition-colors hover:bg-surface-sunk"
          >
            {t(lang, "home.ctaPractice")}
          </Link>
          <LangLink lang={lang} path="/" hasHi />
        </div>

        <StatRow lang={lang} stats={stats} />
      </Container>

      {/* ── Exam categories ── */}
      <Container as="section" aria-labelledby="exams" className="pt-12">
        <SectionHead
          id="exams"
          heading={t(lang, "home.examsHeading")}
          sub={t(lang, "home.examsSub")}
          more={{ to: href(lang, "/exam"), label: t(lang, "home.viewAllExams") }}
        />
        <ExamCategoryGrid lang={lang} />
      </Container>

      {/* ── Subjects ── */}
      {subjects.length > 0 && (
        <Container as="section" aria-labelledby="subjects" className="pt-12">
          <SectionHead
            id="subjects"
            heading={t(lang, "home.subjectsHeading")}
            sub={t(lang, "home.subjectsSub")}
            more={{ to: href(lang, "/topics"), label: t(lang, "home.viewAllSubjects") }}
          />
          <SubjectGrid lang={lang} subjects={subjects} />
        </Container>
      )}

      {/* The in-feed unit, after the subjects grid. ordinal={0} because the
          home page renders the in-article spot exactly once — the second unit
          (ordinal 1) belongs to long content pages that carry two. */}
      {ads.has("in-article") && (
        <Container>
          <AdSlot placement="in-article" ordinal={0} lang={lang} />
        </Container>
      )}

      {/* ── Previous-year papers ── */}
      {pyqTop.length > 0 && (
        <Container as="section" aria-labelledby="pyq" className="pt-6">
          <SectionHead
            id="pyq"
            heading={t(lang, "home.pyqHeading")}
            sub={t(lang, "home.pyqSub")}
            more={{ to: href(lang, "/pyq"), label: t(lang, "home.viewAllPyq") }}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {pyqTop.map(({ exam, papers }) => (
              <li key={exam.id}>
                <Link
                  href={href(lang, `/pyq/${pyqSlug(exam, {})}`)}
                  className="group block rounded-lg border border-line bg-surface p-4 no-underline"
                >
                  <span className="block font-display text-base font-semibold text-ink group-hover:underline">
                    {lang === "hi" ? exam.hi : exam.en}
                  </span>
                  <span className="ui mt-1 block text-xs text-ink-faint">
                    {formatCount(papers, lang)} {t(lang, "common.papers")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── Current affairs ── */}
      {latestDays.length > 0 && (
        <Container as="section" aria-labelledby="ca" className="pt-12">
          <SectionHead
            id="ca"
            heading={t(lang, "home.caHeading")}
            sub={t(lang, "home.caSub")}
            more={{ to: href(lang, "/current-affairs"), label: t(lang, "home.viewAllCa") }}
          />
          <ul className="ui flex flex-wrap gap-2">
            {latestDays.map((d, i) => (
              <li key={d.date}>
                <Link
                  href={href(lang, `/current-affairs/daily/${d.date}`)}
                  className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  {/* An ISO date in a <time> rather than a formatted string:
                      it is unambiguous in both languages and needs no locale
                      data on the server. */}
                  <time dateTime={d.iso}>{d.iso}</time>
                  {i === 0 && (
                    <span className="text-xs text-ink-faint">{t(lang, "home.latestDay")}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── Apps ── */}
      {apps.length > 0 && (
        <Container as="section" aria-labelledby="apps" className="pt-12">
          <SectionHead
            id="apps"
            heading={t(lang, "home.appsHeading")}
            sub={t(lang, "home.appsSub")}
            more={{ to: href(lang, "/apps"), label: t(lang, "home.viewAllApps") }}
          />
          <div className="rounded-lg border border-line bg-surface px-4">
            {apps.map((a) => (
              <AppCard key={a.package} app={a} lang={lang} variant="strip" />
            ))}
          </div>
        </Container>
      )}

      {/* ── About the numbers ──
          Last, and quiet. It exists so the counts above are checkable rather
          than asserted: the claim this page makes about itself is that its
          claims can be verified. */}
      <Container as="section" aria-labelledby="about" className="pt-12">
        <h2 id="about" className="font-display text-xl font-semibold">
          {t(lang, "home.aboutHeading")}
        </h2>
        <p className="mt-2 max-w-measure text-sm text-ink-soft">{t(lang, "home.aboutBody")}</p>
      </Container>

      {ads.has("footer") && (
        <Container>
          <AdSlot placement="footer" lang={lang} />
        </Container>
      )}
    </>
  );
}
