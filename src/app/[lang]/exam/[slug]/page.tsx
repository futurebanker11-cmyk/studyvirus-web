import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, LANGS, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { EXAMS, EXAM_CATEGORIES, getExamBySlug, getExamsByCategory, type Exam } from "@/lib/exams";
import { factsFor, examIntro, appPackageFor, pyqSlugOverrides } from "@/lib/content/examFacts";
import { loadTopics, topicsForExam, chaptersOf } from "@/lib/content/topics";
import { loadPyqExams, papersOf, pyqSlug } from "@/lib/content/pyq";
import { loadFamily, subjectSlug, type AptFamilyInfo, type AptitudeFamily } from "@/lib/content/aptitude";
import { loadAppsRegistry, appForExam, type AppEntry } from "@/lib/content/apps";
import { topicSlug } from "@/lib/content/slugs";
import { playUrl } from "@/lib/seo/referrer";
import { placement } from "@/lib/seo/monetisation";
import { breadcrumbList, softwareApplication } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";

/**
 * The exam hub — "this exam's home page", and the page most of the site's
 * search traffic lands on.
 *
 * It is INSTALL-FIRST (spec §5.2, audit §2): the app card sits above the fold
 * and is the page's one primary CTA, and placement("exam-hub") gives the page
 * a single footer ad and nothing else. Everything below the card — subjects,
 * papers, aptitude, related exams — exists to make the install worth making,
 * not to compete with it for the same click.
 *
 * ── On the apps registry being absent ──
 * loadAppsRegistry() returns null in production today: the registry object is
 * not in the bucket, verified 2026-09-08. That is the NORMAL case, not an edge
 * case, so the fallback is the path this page actually ships on. Two shapes:
 *
 *   registry present, exam matched  → <AppCard variant="hero">, real name,
 *                                     icon and (at >= 5 ratings) a rating.
 *   registry absent or unmatched    → a plain Play link built from
 *                                     appPackageFor(examId). No name beyond
 *                                     the exam's own, no icon, NO RATING —
 *                                     because none is known, and inventing one
 *                                     is precisely the class of claim this
 *                                     rebuild exists to remove.
 *
 * When neither a registry entry nor a package exists (sainik-school, rsmssb,
 * agriculture-supervisor), the section renders nothing at all rather than an
 * install button that goes nowhere.
 *
 * ── On JSON-LD ──
 * BreadcrumbList always; SoftwareApplication only when a package is actually
 * resolved. No FAQPage (Google removed the rich result on 7 May 2026) and no
 * QAPage (it requires community-submitted answers, which these are not) —
 * jsonld.ts names both in FORBIDDEN_TYPES and the page the rebuild replaces
 * emitted a hand-written FAQPage with three invented questions.
 *
 * ── On static generation ──
 * generateStaticParams enumerates every exam slug × both languages, so all
 * hubs prerender. No headers(), no cookies(), no <html>: the [lang] layout
 * owns the shell. See the note in src/middleware.ts for what one headers()
 * call in a shared layout cost the last time.
 */

/** The aptitude family an exam's category maps to, or null when it has none. */
function familyFor(category: string): AptitudeFamily | null {
  if (category === "bank") return "bank";
  if (category === "ssc" || category === "railway") return "ssc-railway";
  return null;
}

/**
 * Everything the page reads, in one wait.
 *
 * loadTopics, loadPyqExams, loadAppsRegistry and loadFamily each go through
 * the content loader (the R2 binding in the Worker, the CDN during a build),
 * so awaiting them one after another would serialise four round-trips on the
 * site's busiest page kind. The family read is conditional — an exam outside
 * SSC/Railway/Bank has no family and must not pay for one — so it enters the
 * batch as an already-resolved null rather than as a second await afterwards.
 *
 * Every loader returns null or [] instead of throwing when its object is
 * missing, and every section below is guarded, so a missing object costs the
 * reader one strip rather than the page.
 */
async function hubData(exam: Exam) {
  const fam = familyFor(exam.category);
  const [topics, pyqExams, appsRegistry, family] = await Promise.all([
    loadTopics(),
    loadPyqExams(),
    loadAppsRegistry(),
    fam ? loadFamily(fam) : Promise.resolve(null),
  ]);
  return { topics, pyqExams, appsRegistry, family };
}

export function generateStaticParams() {
  return LANGS.flatMap((lang) => EXAMS.map((e) => ({ lang, slug: e.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;
  const exam = getExamBySlug(slug);
  if (!exam) return {};

  const name = lang === "hi" ? exam.hi : exam.en;
  const year = new Date().getFullYear();
  const title = `${format(lang, "exam.h1", { exam: name, year })} | StudyVirus`;

  // The description is the intro the page itself renders, so the snippet a
  // searcher reads and the first paragraph they land on are the same sentence.
  // Counts are read here rather than invented: metadata and body agree because
  // they call the same function on the same data.
  const { topics, pyqExams } = await hubData(exam);
  const chapters = topicsForExam(topics, exam.id).reduce((n, tp) => n + chaptersOf(tp).length, 0);
  const pyq = pyqExams.find((p) => p.id === exam.id);
  const papers = pyq ? papersOf(pyq).length : 0;

  return {
    title,
    description: examIntro(exam, lang, { chapters, papers }),
    alternates: buildAlternates({ lang, path: `/exam/${exam.slug}`, hasHi: true }),
  };
}

/** A section heading and its one-line subheading, with an optional "see all". */
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
        <h2 id={id} className="font-display text-2xl font-semibold">
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

/**
 * The install CTA when the registry has no entry for this exam.
 *
 * Deliberately NOT an AppCard: AppCard takes an AppEntry, and building a fake
 * one would mean inventing a name, a description and an icon the site does not
 * have. This shows only what is actually known — the exam's own name and a
 * Play link carrying the same referrer AppCard would use — and claims nothing
 * else. No stars, no install count, no rating.
 */
function PlainInstall({ exam, pkg, lang }: { exam: Exam; pkg: string; lang: Lang }) {
  const name = lang === "hi" ? exam.hi : exam.en;
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <h3 className="text-xl font-semibold">
        {format(lang, "exam.appFallbackName", { exam: name })}
      </h3>
      <p className="ui mt-1 text-xs text-ink-faint">{t(lang, "common.free")}</p>
      <p className="mt-2 max-w-measure text-sm text-ink-soft">{t(lang, "exam.appSub")}</p>
      <a
        href={playUrl(pkg, "exam-hub", exam.slug)}
        target="_blank"
        rel="noopener noreferrer"
        className="ui mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
      >
        <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
        </svg>
        {t(lang, "app.getTheApp")}
      </a>
    </div>
  );
}

export default async function ExamHubPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: raw, slug } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const exam = getExamBySlug(slug);
  if (!exam) notFound();

  const { topics, pyqExams, appsRegistry, family } = await hubData(exam);

  const name = lang === "hi" ? exam.hi : exam.en;
  const facts = factsFor(exam.id);
  const year = new Date().getFullYear();
  const ads = new Set(placement("exam-hub").ads);

  // ── Subjects ──
  // topicsForExam already filters to visible, indexed topics, so a subject with
  // no browsable chapter never appears. chaptersOf reads the in-memory index.
  const subjects = topicsForExam(topics, exam.id)
    .map((topic) => {
      const chs = chaptersOf(topic);
      return {
        topic,
        chapters: chs.length,
        questions: chs.reduce((n, c) => n + c.enCount, 0),
      };
    })
    .filter((s) => s.chapters > 0)
    .sort((a, b) => b.questions - a.questions);
  const totalChapters = subjects.reduce((n, s) => n + s.chapters, 0);

  // ── PYQ ──
  // loadPyqExams already drops exams with no indexed paper, so a match here
  // always has at least one real paper behind it.
  const pyq = pyqExams.find((p) => p.id === exam.id) ?? null;
  const papers = pyq ? papersOf(pyq) : [];
  const pyqHref = pyq ? href(lang, `/pyq/${pyqSlug(pyq, pyqSlugOverrides())}`) : null;

  // ── The app ──
  // Registry entry first (it carries the real name, icon and rating); the
  // exam registry's package as the fallback; nothing at all if neither exists.
  const registryApp: AppEntry | undefined = appsRegistry
    ? appForExam(appsRegistry, exam.id)
    : undefined;
  const pkg = registryApp?.package ?? appPackageFor(exam.id);

  // ── Aptitude ──
  // family is null outside SSC/Railway/Bank, and a family whose subjects all
  // pruned away renders nothing either.
  const aptFamily: AptFamilyInfo | null = family;
  const aptSubjects = aptFamily?.subjects ?? [];

  // ── Related exams ──
  const related = getExamsByCategory(exam.category).filter((e) => e.slug !== exam.slug);
  const categoryLabel = EXAM_CATEGORIES[exam.category] ?? exam.category;

  // ── JSON-LD ──
  // BreadcrumbList: Home → Exams → {category} → {exam}. The category step
  // points at its anchor on /exam, which is a real, reachable fragment.
  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.exams"), url: abs(href(lang, "/exam")) },
    { name: categoryLabel, url: abs(`${href(lang, "/exam")}#${exam.category}`) },
    { name, url: abs(href(lang, `/exam/${exam.slug}`)) },
  ]);

  // SoftwareApplication only when a package actually resolved. Rating and
  // ratingCount are passed only from a real registry entry — softwareApplication
  // itself drops aggregateRating below 5 ratings, so an app with two reviews
  // never ships a "5.0" to a crawler.
  const appJsonLd = pkg
    ? softwareApplication({
        name: registryApp?.name ?? format(lang, "exam.appFallbackName", { exam: name }),
        description: registryApp?.description ?? t(lang, "exam.appSub"),
        packageName: pkg,
        url: playUrl(pkg, "exam-hub", exam.slug),
        rating: registryApp?.rating,
        ratingCount: registryApp?.ratingCount,
      })
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      {appJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
      )}

      {/* ── Header: breadcrumb, H1, intro ── */}
      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.exams")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link href={href(lang, "/exam")} className="no-underline hover:underline">
            {t(lang, "nav.exams")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <Link
            href={`${href(lang, "/exam")}#${exam.category}`}
            className="no-underline hover:underline"
          >
            {categoryLabel}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{name}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          <span aria-hidden="true" className="mr-2">
            {exam.icon}
          </span>
          {format(lang, "exam.h1", { exam: name, year })}
        </h1>

        {/* The intro sentence is examIntro()'s, with the counts this page has
            actually derived — so it can never advertise papers the PYQ section
            below does not list. */}
        <p className="mt-4 max-w-measure text-lg text-ink-soft">
          {examIntro(exam, lang, { chapters: totalChapters, papers: papers.length })}
        </p>

        <div className="ui mt-4">
          <LangLink lang={lang} path={`/exam/${exam.slug}`} hasHi />
        </div>

        {/* Facts: conducting body and stages, from examFacts.ts. factsFor()
            always returns a record, so this list never empties. */}
        <dl className="ui mt-6 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-faint">
              {t(lang, "exam.conductingBody")}
            </dt>
            <dd className="mt-0.5 text-ink">{lang === "hi" ? facts.bodyHi : facts.body}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wider text-ink-faint">
              {t(lang, "exam.stages")}
            </dt>
            <dd className="mt-0.5 text-ink">
              {(lang === "hi" ? facts.stagesHi : facts.stages).join(" · ")}
            </dd>
          </div>
        </dl>
      </Container>

      {/* ── App card, above the fold ──
          The page's one primary CTA. Rendered before any content section, and
          skipped entirely when no package is known rather than shown as a dead
          button. */}
      {pkg && (
        <Container as="section" aria-labelledby="app" className="pt-8">
          <h2 id="app" className="sr-only">
            {t(lang, "exam.appHeading")}
          </h2>
          {registryApp ? (
            <AppCard app={registryApp} lang={lang} variant="hero" />
          ) : (
            <PlainInstall exam={exam} pkg={pkg} lang={lang} />
          )}
        </Container>
      )}

      {/* ── Subjects ── */}
      {subjects.length > 0 && (
        <Container as="section" aria-labelledby="subjects" className="pt-12">
          <SectionHead
            id="subjects"
            heading={format(lang, "exam.subjectsHeading", { exam: name })}
            sub={t(lang, "exam.subjectsSub")}
            more={{ to: href(lang, "/topics"), label: t(lang, "home.viewAllSubjects") }}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(({ topic, chapters, questions }) => (
              <li key={topic.key}>
                <Link
                  href={href(lang, `/topics/${topicSlug(topic.key)}`)}
                  className="group block rounded-lg border border-line bg-surface p-4 no-underline"
                >
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true" className="text-lg">
                      {topic.emoji}
                    </span>
                    <span className="font-display text-base font-semibold text-ink group-hover:underline">
                      {lang === "hi" ? topic.hi.name : topic.en.name}
                    </span>
                  </span>
                  {/* formatCount, not toString: 1,234 in Indian grouping, the
                      same rendering every other count on the site uses. */}
                  <span className="ui mt-1 block text-xs text-ink-faint">
                    {formatCount(chapters, lang)} {t(lang, "common.chapters")} ·{" "}
                    {formatCount(questions, lang)} {t(lang, "common.questions")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── Previous-year papers ──
          Unlike every other section this one renders a line when it is empty:
          "PYQ" is a thing a visitor arrives specifically looking for, and
          silence reads as a broken page rather than as an absence. */}
      <Container as="section" aria-labelledby="pyq" className="pt-12">
        {pyq && pyqHref && papers.length > 0 ? (
          <>
            <SectionHead
              id="pyq"
              heading={format(lang, "exam.pyqHeading", { exam: name })}
              sub={t(lang, "exam.pyqSub")}
              more={{
                to: pyqHref,
                label: format(lang, "exam.pyqAll", { papers: formatCount(papers.length, lang) }),
              }}
            />
            <ul className="ui flex flex-wrap gap-2">
              {papers.slice(0, 12).map((p) => (
                <li key={p.n}>
                  <Link
                    href={`${pyqHref}/set-${p.n}`}
                    className="inline-flex items-baseline gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                  >
                    {t(lang, "common.set")} {formatCount(p.n, lang)}
                    <span className="text-xs text-ink-faint">
                      {formatCount(p.enCount, lang)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <h2 id="pyq" className="font-display text-2xl font-semibold">
              {format(lang, "exam.pyqHeading", { exam: name })}
            </h2>
            <p className="mt-2 max-w-measure text-sm text-ink-soft">{t(lang, "exam.pyqNone")}</p>
          </>
        )}
      </Container>

      {/* ── Aptitude ──
          Bank exams go to the bank family, SSC and Railway to ssc-railway,
          every other category omits the section entirely (familyFor returns
          null and nothing is even fetched). */}
      {aptFamily && aptSubjects.length > 0 && (
        <Container as="section" aria-labelledby="aptitude" className="pt-12">
          <SectionHead
            id="aptitude"
            heading={format(lang, "exam.aptitudeHeading", { exam: name })}
            sub={t(lang, "exam.aptitudeSub")}
            more={{
              to: href(lang, `/aptitude/${aptFamily.slug}`),
              label: t(lang, "exam.viewAllAptitude"),
            }}
          />
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {aptSubjects.map((s) => (
              <li key={s.id}>
                <Link
                  href={href(lang, `/aptitude/${aptFamily.slug}/${subjectSlug(s)}`)}
                  className="group block rounded-lg border border-line bg-surface p-4 no-underline"
                >
                  <span className="flex items-center gap-2">
                    {s.icon && (
                      <span aria-hidden="true" className="text-lg">
                        {s.icon}
                      </span>
                    )}
                    <span className="font-display text-base font-semibold text-ink group-hover:underline">
                      {lang === "hi" ? s.name.hi : s.name.en}
                    </span>
                  </span>
                  <span className="ui mt-1 block text-xs text-ink-faint">
                    {formatCount(s.chapters.length, lang)} {t(lang, "common.chapters")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* ── Related exams ── */}
      {related.length > 0 && (
        <Container as="section" aria-labelledby="related" className="pt-12">
          <h2 id="related" className="font-display text-2xl font-semibold">
            {format(lang, "exam.relatedHeading", { category: categoryLabel })}
          </h2>
          <ul className="ui mt-4 flex flex-wrap gap-2">
            {related.map((e) => (
              <li key={e.slug}>
                <Link
                  href={href(lang, `/exam/${e.slug}`)}
                  className="inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink-soft no-underline hover:border-line-strong hover:text-ink"
                >
                  <span aria-hidden="true">{e.icon}</span>
                  {lang === "hi" ? e.hi : e.en}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      )}

      {/* placement("exam-hub") is { ads: ["footer"], installCta: "hero" }: one
          unit, at the bottom, well below the install CTA. "footer" forbids an
          ordinal — only "in-article" has a second unit to disambiguate. */}
      {ads.has("footer") && (
        <Container className="pt-8">
          <AdSlot placement="footer" lang={lang} />
        </Container>
      )}

      <div className="pb-12" />
    </>
  );
}
