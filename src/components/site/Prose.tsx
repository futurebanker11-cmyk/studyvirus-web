import type { ReactNode } from "react";
import type { Lang } from "@/lib/i18n/lang";

/**
 * Long-form reading: explanations, notes, articles.
 *
 * Holds the measure at ~70ch and sets the vertical rhythm. Passing `lang`
 * marks the run for the browser (hyphenation, font selection) and lets the
 * token layer swap in the Devanagari serif at its matched optical size —
 * see the `:lang(hi)` rule in globals.css.
 *
 * Styling is done with Tailwind arbitrary variants against the token colours
 * rather than a typography plugin, so no colour is hard-coded and the whole
 * block re-themes for free.
 */
export default function Prose({
  children,
  lang,
  className = "",
}: {
  children: ReactNode;
  lang?: Lang;
  className?: string;
}) {
  return (
    <div
      lang={lang}
      className={[
        "max-w-measure text-ink",
        // rhythm
        "[&>p]:my-4 [&>p]:leading-relaxed",
        "[&>h2]:mt-9 [&>h2]:mb-3 [&>h2]:text-xl [&>h2]:sm:text-2xl",
        "[&>h3]:mt-7 [&>h3]:mb-2 [&>h3]:text-lg [&>h3]:sm:text-xl",
        // lists — the bullet is a rule-like marker, not a decorative dot
        "[&>ul]:my-4 [&>ul]:space-y-2 [&>ul]:pl-5 [&>ul]:list-disc",
        "[&>ol]:my-4 [&>ol]:space-y-2 [&>ol]:pl-5 [&>ol]:list-decimal",
        "[&_li]:pl-1 [&_li]:marker:text-ink-faint",
        // emphasis
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_em]:italic",
        // links keep the underline — this is a reference work, not an app
        "[&_a]:text-accent [&_a]:underline [&_a]:decoration-line-strong",
        "[&_a:hover]:decoration-accent",
        // quoted source material
        "[&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-line-strong",
        "[&_blockquote]:pl-4 [&_blockquote]:text-ink-soft",
        // inline code and formulae
        "[&_code]:font-sans [&_code]:text-[0.92em] [&_code]:bg-surface-sunk",
        "[&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
        // tables scroll in their own lane rather than widening the page
        "[&_table]:my-5 [&_table]:text-[0.95em]",
        "[&_th]:border-b [&_th]:border-line-strong [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left",
        "[&_td]:border-b [&_td]:border-line [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
