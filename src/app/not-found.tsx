import Link from "next/link";
import HtmlShell from "@/components/site/HtmlShell";
import { t } from "@/lib/ui/strings";

/**
 * Where every mistyped and every retired URL lands — and, given how much of
 * the old WordPress site is being redirected, a page real readers will see.
 *
 * It renders its own document shell: the root layout deliberately renders no
 * <html>, and a root not-found sits outside both route groups, so it has to
 * supply one itself. English, because a 404 has no language segment to read.
 *
 * Restyled onto the Task 2 tokens. It previously used text-primary,
 * bg-blue-700 and the slate ramp — all from the design system that was
 * deleted, so the heading and the button rendered unstyled.
 */

const LINKS: { path: string; label: string }[] = [
  { path: "/topics", label: t("en", "nav.topics") },
  { path: "/exam", label: t("en", "nav.exams") },
  { path: "/pyq", label: t("en", "nav.pyq") },
  { path: "/aptitude", label: t("en", "nav.aptitude") },
  { path: "/english", label: t("en", "nav.english") },
  { path: "/current-affairs", label: t("en", "nav.currentAffairs") },
];

export default function NotFound() {
  return (
    <HtmlShell lang="en">
      <main id="main" className="mx-auto w-full max-w-measure px-4 py-20 sm:px-6">
        <p className="ui text-sm font-semibold uppercase tracking-wider text-ink-faint">404</p>
        <h1 className="mt-2 text-3xl font-semibold">Page not found</h1>
        <p className="mt-3 text-ink-soft">
          This page does not exist, or it moved when the site was rebuilt. The
          sections below cover everything the site holds.
        </p>

        <Link
          href="/"
          className="ui mt-6 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
        >
          {t("en", "common.home")}
        </Link>

        <ul className="ui mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LINKS.map((l) => (
            <li key={l.path}>
              <Link
                href={l.path}
                className="flex min-h-[44px] items-center rounded-md border border-line bg-surface px-3 text-sm text-ink no-underline transition-colors hover:border-line-strong"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </HtmlShell>
  );
}
