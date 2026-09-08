import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format } from "@/lib/ui/strings";
import { appPackageFor } from "@/lib/content/examFacts";
import { loadAppsRegistry, type AppEntry } from "@/lib/content/apps";
import { breadcrumbList } from "@/lib/seo/jsonld";
import { placement } from "@/lib/seo/monetisation";
import { groupExams } from "@/components/site/ExamCategoryGrid";

import Container from "@/components/site/Container";
import AdSlot from "@/components/site/AdSlot";
import AppCard from "@/components/site/AppCard";
import LangLink from "@/components/site/LangLink";

/**
 * The apps directory — every free Android app the site has, grouped the way
 * the home page groups exams.
 *
 * ── On the registry being absent ──
 * loadAppsRegistry() returns null in production today: apps/registry.json is
 * not in the bucket (a 404 from the CDN, verified 2026-09-08), and the ops job
 * that will write it (spec §7.1, a separate repo) has not been built. So the
 * fallback is not an edge case being defended against — it is the ONLY path
 * this page ships on, and the one worth reading first.
 *
 *   registry absent (today) → EXAMS, filtered to the exams that actually have
 *                             a package, each synthesised into a minimal
 *                             AppEntry: real package, real name, a description
 *                             built from the exam's own name, and NOTHING
 *                             else. No rating, no install count, no icon,
 *                             no screenshots — because none are known.
 *   registry present (later) → reg.apps as they come, ratings and icons and
 *                             all, grouped by category.
 *
 * Both paths render through the same <AppCard variant="strip">, deliberately.
 * A reader must not be able to tell which source produced the page, and
 * AppCard's own rating gate (rating shown only at ratingCount >= 5) does
 * exactly the right thing when handed the undefined a synthesised entry
 * carries: it shows no rating at all. A second, parallel rendering path for
 * the fallback would be two places for that promise to drift.
 *
 * ── On the three exams with no app ──
 * appPackageFor() returns null for aissee_sainik, rsmssb and
 * agriculture_supervisor. Those three exams have no companion app, full stop.
 * They are filtered out before anything is rendered: a card whose install
 * button goes nowhere is worse than no card, and the whole point of the
 * rebuild is that every offer on the page is real.
 *
 * ── On JSON-LD ──
 * BreadcrumbList only. SoftwareApplication belongs on the per-app page, where
 * there is one app to describe; emitting seventy of them on a directory would
 * be a list of claims about apps this page shows one line of each.
 *
 * ── On static generation ──
 * No generateStaticParams: /apps has no dynamic segment of its own and
 * inherits both languages from the [lang] layout. No headers(), no cookies(),
 * no <html> — the layout owns the shell, and one headers() call in a shared
 * layout is what un-statics an entire site (see src/middleware.ts).
 */

/**
 * The AppEntry a registry-less build has to work with.
 *
 * Everything here comes from data the site already holds: the package from the
 * exam registry, the name from EXAMS, the description from a template with the
 * exam's own name in it. Every optional field that would be a *claim* — rating,
 * ratingCount, installs, icon — is left undefined on purpose rather than
 * filled with a placeholder, so AppCard shows nothing where it knows nothing.
 */
export function synthesise(
  exam: { id: string; slug: string; en: string; hi: string },
  pkg: string,
  lang: Lang,
): AppEntry {
  const name = lang === "hi" ? exam.hi : exam.en;
  return {
    package: pkg,
    slug: exam.slug,
    examId: exam.id,
    name: format(lang, "exam.appFallbackName", { exam: name }),
    description: format(lang, "apps.fallbackDescription", { exam: name }),
    rating: undefined,
    ratingCount: undefined,
    installs: undefined,
    icon: undefined,
    screenshots: [],
  };
}

/** One category heading and the apps under it. */
export interface AppGroup {
  category: string;
  label: string;
  apps: AppEntry[];
}

/**
 * The page's list, from whichever source exists.
 *
 * Category order is groupExams()' order in both branches — the same editorial
 * ranking the home page and /exam use, so a reader who has learned where
 * "Teaching" sits on one page finds it in the same place here.
 *
 * In the registry branch an app is placed by its own `category` when that
 * names one of the categories groupExams() returned, else by the category of
 * the exam its examId points at, else into a trailing "other" group. The
 * registry does not
 * exist yet, so its `category` values cannot be checked against reality; this
 * ordering degrades to something sensible whichever of the three it turns out
 * to carry, which is the most that can honestly be built today.
 */
export function groupApps(registry: AppEntry[] | null, lang: Lang): AppGroup[] {
  const order = groupExams();
  const groups: AppGroup[] = order.map((g) => ({
    category: g.category,
    label: g.label,
    apps: [],
  }));
  const byCategory = new Map(groups.map((g) => [g.category, g]));

  if (!registry) {
    // ── The path production is on today ──
    for (const g of order) {
      const bucket = byCategory.get(g.category);
      if (!bucket) continue;
      for (const exam of g.exams) {
        const pkg = appPackageFor(exam.id);
        if (!pkg) continue; // no app exists for this exam — render nothing
        bucket.apps.push(synthesise(exam, pkg, lang));
      }
    }
    return groups.filter((g) => g.apps.length > 0);
  }

  // ── The path that starts working the day the ops job first runs ──
  const examCategory = new Map(order.flatMap((g) => g.exams.map((e) => [e.id, g.category])));
  const other: AppEntry[] = [];
  for (const app of registry) {
    const direct = app.category && byCategory.has(app.category) ? app.category : null;
    const viaExam = app.examId ? (examCategory.get(app.examId) ?? null) : null;
    const bucket = byCategory.get(direct ?? viaExam ?? "");
    if (bucket) bucket.apps.push(app);
    else other.push(app);
  }
  const out = groups.filter((g) => g.apps.length > 0);
  if (other.length > 0) {
    out.push({ category: "other", label: t(lang, "artCat.other"), apps: other });
  }
  return out;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const registry = await loadAppsRegistry();
  const groups = groupApps(registry?.apps ?? null, lang);
  const count = groups.reduce((n, g) => n + g.apps.length, 0);

  // The tab title reuses the H1's own string, so the two cannot claim
  // different numbers of apps — the defect this rebuild exists to remove.
  return {
    title: `${format(lang, "apps.h1", { apps: count })} | StudyVirus`,
    description: t(lang, "apps.lede"),
    alternates: buildAlternates({ lang, path: "/apps", hasHi: true }),
  };
}

export default async function AppsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const registry = await loadAppsRegistry();
  const groups = groupApps(registry?.apps ?? null, lang);
  const count = groups.reduce((n, g) => n + g.apps.length, 0);
  const ads = new Set(placement("apps").ads);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.apps"), url: abs(href(lang, "/apps")) },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />

      <Container as="section" className="pb-2 pt-10 sm:pt-14">
        <nav aria-label={t(lang, "nav.apps")} className="ui mb-4 text-sm text-ink-faint">
          <Link href={href(lang, "/")} className="no-underline hover:underline">
            {t(lang, "common.home")}
          </Link>
          <span aria-hidden="true" className="px-2">
            /
          </span>
          <span aria-current="page">{t(lang, "nav.apps")}</span>
        </nav>

        {/* {apps} is the length of the list rendered below it, not a number
            anybody typed. */}
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "apps.h1", { apps: count })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">{t(lang, "apps.lede")}</p>

        <div className="ui mt-4">
          <LangLink lang={lang} path="/apps" hasHi />
        </div>
      </Container>

      {count === 0 ? (
        // Unreachable while EXAMS carries a single app package, but a directory
        // that renders an empty page rather than a sentence reads as broken.
        <Container as="section" className="pt-8">
          <p className="max-w-measure text-ink-soft">{t(lang, "apps.none")}</p>
        </Container>
      ) : (
        <Container as="section" className="pt-8">
          <div className="space-y-10">
            {groups.map((g) => (
              <section key={g.category} id={g.category} className="scroll-mt-20">
                {/* EXAM_CATEGORIES is English-only and outside this task's
                    scope to change, exactly as on /exam. */}
                <h2 className="font-display text-xl font-semibold">{g.label}</h2>

                <ul className="mt-3">
                  {g.apps.map((app) => (
                    <li key={app.package}>
                      {/* variant="strip" is a directory row, and AppCard's own
                          REFERRER map turns that into the "apps-hub" install
                          referrer — which is why the kind is not passed here. */}
                      <AppCard app={app} lang={lang} variant="strip" />
                      <p className="ui -mt-1 pb-3 text-sm">
                        {/* An app tied to an exam sends the reader to that
                            exam's hub; a general app (no examId, only possible
                            from the registry) has no single hub to point at,
                            so it goes to the subject index instead. */}
                        {app.examId ? (
                          <Link
                            href={href(lang, `/exam/${app.slug}`)}
                            className="no-underline hover:underline"
                          >
                            {t(lang, "apps.practiceOnSite")}
                          </Link>
                        ) : (
                          <Link
                            href={href(lang, "/topics")}
                            className="no-underline hover:underline"
                          >
                            {t(lang, "apps.practiceAllTopics")}
                          </Link>
                        )}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </Container>
      )}

      {/* placement("apps") is { ads: ["footer"], installCta: "hero" }: this
          page is install-first, so its single ad unit sits at the very bottom,
          below every install button. "footer" forbids an ordinal. */}
      {ads.has("footer") && (
        <Container className="pt-10">
          <AdSlot placement="footer" lang={lang} />
        </Container>
      )}

      <div className="pb-12" />
    </>
  );
}
