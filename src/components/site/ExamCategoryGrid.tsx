import Link from "next/link";
import { href, type Lang } from "@/lib/i18n/lang";
import { EXAMS, EXAM_CATEGORIES, type Exam } from "@/lib/exams";

/**
 * The home page's spine: exam categories first, exams inside them.
 *
 * The old home page led with a topic grid and buried the exams behind ten
 * hand-written pills, which meant a visitor arriving on "ssc gd syllabus" had
 * to guess which subject to open. Nobody preparing for a government exam
 * thinks in subjects first; they think "I am writing SSC GD". So the first
 * thing on the page is the list of exams, grouped the way the audience groups
 * them, with every exam a direct link to its hub.
 *
 * The category order is fixed here rather than taken from Object.keys(
 * EXAM_CATEGORIES): it is an editorial ranking by how many people sit each
 * family, and a JS object's key order is not something to hang a page layout
 * on. Any category present in EXAM_CATEGORIES but missing from this list would
 * be silently dropped, so ORDER is asserted complete by a test-free but
 * explicit fallback: categories not named here are appended in declaration
 * order rather than lost.
 *
 * No accent colours per exam. EXAMS carries a `color` hex each — 74 raw hex
 * values that predate the token layer and would be the only hard-coded colours
 * on the rebuilt site, unreadable in dark mode. The emoji `icon` is kept: it is
 * a character, not a colour, and it survives both themes.
 *
 * Every card is plain markup in a CSS grid. No carousel: a horizontal scroller
 * hides most of the list from a crawler and from anyone using a keyboard, and
 * this is the page that has to expose all 74 exam hubs for indexing.
 */

const ORDER = [
  "railway",
  "ssc",
  "police",
  "bank",
  "defence",
  "upsc",
  "central",
  "teaching",
  "state_psc",
  "state_sub",
  "forest",
  "jail",
  "revenue",
  "agriculture",
] as const;

/** Categories in editorial order, then any that ORDER forgot, then their exams. */
export function groupExams(): { category: string; label: string; exams: Exam[] }[] {
  const by = new Map<string, Exam[]>();
  for (const e of EXAMS) {
    const list = by.get(e.category);
    if (list) list.push(e);
    else by.set(e.category, [e]);
  }
  const ordered = [
    ...ORDER.filter((c) => by.has(c)),
    ...Array.from(by.keys()).filter((c) => !(ORDER as readonly string[]).includes(c)),
  ];
  return ordered.map((category) => ({
    category,
    label: EXAM_CATEGORIES[category] ?? category,
    exams: by.get(category) ?? [],
  }));
}

export default function ExamCategoryGrid({ lang }: { lang: Lang }) {
  const groups = groupExams();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => (
        <section
          key={g.category}
          className="rounded-lg border border-line bg-surface p-4"
          aria-labelledby={`cat-${g.category}`}
        >
          <h3
            id={`cat-${g.category}`}
            className="ui flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-ink-faint"
          >
            <span aria-hidden="true" className="text-base">
              {g.exams[0]?.icon}
            </span>
            {/* EXAM_CATEGORIES is English-only and is not ours to change; the
                exam names inside it are the words people actually search, and
                those are identical in both languages for most of the list. */}
            {g.label}
          </h3>
          <ul className="ui mt-3 space-y-1.5 text-sm">
            {g.exams.map((e) => (
              <li key={e.slug}>
                <Link
                  href={href(lang, `/exam/${e.slug}`)}
                  className="text-ink-soft no-underline hover:text-ink hover:underline"
                >
                  {lang === "hi" ? e.hi : e.en}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
