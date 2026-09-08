import Link from "next/link";
import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";

/**
 * Previous / next between the sets of one chapter, plus a link back to the
 * chapter that lists them all.
 *
 * Plain <Link>s in a server component: this is a navigation control, not an
 * interaction, and it must work with JavaScript off — a reader who reached
 * set 3 from a search result has to be able to get to set 4.
 *
 * `prev`/`next` are already language-prefixed hrefs (the page builds them with
 * `href(lang, …)`) or null at the ends of the chapter. A missing neighbour
 * renders a disabled-looking span rather than nothing, so the two buttons keep
 * their positions and the "next" button does not jump to the left edge on the
 * last set of every chapter.
 */
export default function SetPager({
  prev,
  next,
  indexHref,
  lang,
}: {
  prev?: string | null;
  next?: string | null;
  /** The chapter page listing every set. */
  indexHref?: string | null;
  lang: Lang;
}) {
  const base =
    "ui inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-medium no-underline sm:flex-none";
  const live = `${base} border-line bg-surface text-ink transition-colors hover:border-line-strong hover:bg-surface-sunk`;
  // An end-of-chapter stop is shown, not hidden: the reader learns there is no
  // set 9 rather than wondering where the button went.
  const dead = `${base} border-line bg-surface-sunk text-ink-faint`;

  const arrowL = (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
  const arrowR = (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );

  return (
    <nav
      aria-label={t(lang, "set.pagerLabel")}
      className="no-print mt-8 flex flex-wrap items-center gap-3 border-t border-line pt-6"
    >
      {prev ? (
        <Link href={prev} rel="prev" className={live}>
          {arrowL}
          {t(lang, "common.previous")}
        </Link>
      ) : (
        // aria-disabled, not `disabled`: it is a span, not a control, and this
        // tells a screen reader why it does nothing.
        <span aria-disabled="true" className={dead}>
          {arrowL}
          {t(lang, "common.previous")}
        </span>
      )}

      {indexHref && (
        <Link
          href={indexHref}
          className="ui order-last w-full text-center text-sm text-ink-soft underline-offset-4 hover:text-ink sm:order-none sm:w-auto sm:flex-1"
        >
          {t(lang, "set.allSets")}
        </Link>
      )}

      {next ? (
        <Link href={next} rel="next" className={live}>
          {t(lang, "common.next")}
          {arrowR}
        </Link>
      ) : (
        <span aria-disabled="true" className={dead}>
          {t(lang, "common.next")}
          {arrowR}
        </span>
      )}
    </nav>
  );
}
