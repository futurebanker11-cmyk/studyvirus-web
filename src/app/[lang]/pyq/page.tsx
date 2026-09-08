import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { isLang, href, type Lang } from "@/lib/i18n/lang";
import { buildAlternates, abs } from "@/lib/i18n/alternates";
import { t, format, type T } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";
import { loadPyqExams, papersOf, pyqSlug, type PyqExam } from "@/lib/content/pyq";
import { pyqSlugOverrides } from "@/lib/content/examFacts";
import { breadcrumbList } from "@/lib/seo/jsonld";

import Container from "@/components/site/Container";

/**
 * The PYQ index: every exam with real previous-year papers, grouped by
 * PyqExam.category.
 *
 * ── A different taxonomy from the exam hub's ──
 *
 * PyqExam.category (src/lib/content/pyq.ts) is a flat, 8-value grouping —
 * railway, ssc, police, forest, defence, banking, teaching, state — used only
 * to group PYQ papers. It is NOT EXAMS[].category from src/lib/exams.ts, which
 * is more granular (state_psc, state_sub, forest, jail, revenue, central,
 * agriculture, …) and groups the exam-hub pages instead. The two are
 * deliberately not reconciled here: this page groups by the PYQ config's own
 * category field, full stop.
 *
 * ── Counts ──
 *
 * loadPyqExams() already filters to exams with at least one real, indexed
 * paper (papersOf(e).length > 0), so every exam and every paper count on this
 * page is something a reader can click through and verify. Nothing here is
 * a written-in number — the page this replaces said "70 exams" while the real
 * config produced a different count, the exact defect class the rebuild
 * exists to remove (Task 4/5's h1 rule, applied here).
 *
 * ── Static ──
 *
 * loadPyqExams() reads a JSON config through the content loader, so this page
 * awaits it — no headers(), no cookies(), no <html>: the [lang] layout owns
 * the shell, which is what keeps this route statically generated.
 */

const CATEGORY_ORDER = [
  "railway",
  "ssc",
  "police",
  "forest",
  "defence",
  "banking",
  "teaching",
  "state",
] as const;

const CATEGORY_KEYS: Record<string, T> = {
  railway: "pyqCat.railway",
  ssc: "pyqCat.ssc",
  police: "pyqCat.police",
  forest: "pyqCat.forest",
  defence: "pyqCat.defence",
  banking: "pyqCat.banking",
  teaching: "pyqCat.teaching",
  state: "pyqCat.state",
};

interface Group {
  category: string;
  label: string;
  exams: PyqExam[];
}

/** Categories in a fixed editorial order, then any the config adds later. */
function groupPyqExams(lang: Lang, exams: PyqExam[]): Group[] {
  const by = new Map<string, PyqExam[]>();
  for (const e of exams) {
    const list = by.get(e.category);
    if (list) list.push(e);
    else by.set(e.category, [e]);
  }
  const ordered = [
    ...CATEGORY_ORDER.filter((c) => by.has(c)),
    ...Array.from(by.keys()).filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
  ];
  return ordered.map((category) => {
    const key = CATEGORY_KEYS[category];
    return {
      category,
      label: key ? t(lang, key) : category,
      exams: by.get(category) ?? [],
    };
  });
}

async function pyqIndexData() {
  const exams = await loadPyqExams();
  const totalPapers = exams.reduce((n, e) => n + papersOf(e).length, 0);
  return { exams, totalPapers };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: raw } = await params;
  if (!isLang(raw)) return {};
  const lang: Lang = raw;

  const { exams, totalPapers } = await pyqIndexData();
  const title = `${format(lang, "pyqIndex.h1", { exams: formatCount(exams.length, lang) })} | StudyVirus`;

  return {
    title,
    description: format(lang, "pyqIndex.lede", {
      papers: formatCount(totalPapers, lang),
    }),
    alternates: buildAlternates({ lang, path: "/pyq", hasHi: true }),
  };
}

export default async function PyqIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang: Lang = raw;

  const { exams, totalPapers } = await pyqIndexData();
  const overrides = pyqSlugOverrides();
  const groups = groupPyqExams(lang, exams);

  const crumbs = breadcrumbList([
    { name: t(lang, "common.home"), url: abs(href(lang, "/")) },
    { name: t(lang, "nav.pyq"), url: abs(href(lang, "/pyq")) },
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
          <span aria-current="page">{t(lang, "nav.pyq")}</span>
        </nav>

        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          {format(lang, "pyqIndex.h1", { exams: formatCount(exams.length, lang) })}
        </h1>
        <p className="mt-3 max-w-measure text-lg text-ink-soft">
          {format(lang, "pyqIndex.lede", {
            papers: formatCount(totalPapers, lang),
          })}
        </p>
      </Container>

      <Container as="section" className="pt-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {groups.map((g) => (
            <section
              key={g.category}
              className="rounded-lg border border-line bg-surface p-5"
              aria-labelledby={`h-${g.category}`}
            >
              <h2
                id={`h-${g.category}`}
                className="flex items-center gap-2 font-display text-lg font-semibold"
              >
                <span aria-hidden="true">{g.exams[0]?.emoji}</span>
                {g.label}
              </h2>

              <ul className="mt-4 space-y-3">
                {g.exams.map((e) => {
                  const slug = pyqSlug(e, overrides);
                  const papers = papersOf(e).length;
                  return (
                    <li key={e.id}>
                      <Link
                        href={href(lang, `/pyq/${slug}`)}
                        className="group block no-underline"
                      >
                        <span className="block font-semibold text-ink group-hover:underline">
                          {lang === "hi" ? e.hi : e.en}
                        </span>
                        <span className="ui mt-0.5 block text-xs text-ink-faint">
                          {format(lang, "pyqIndex.examMeta", { papers: formatCount(papers, lang) })}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </Container>

      {/* No ads: a pure navigational index, same rule as /exam. */}
      <div className="pb-12" />
    </>
  );
}
