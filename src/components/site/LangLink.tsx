"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { href, otherLang, splitLang, type Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";

/**
 * The one link between the two languages.
 *
 * It is a client component for a single reason: it has to know the path the
 * reader is on to point at that page's counterpart, and only the client knows
 * that inside shared chrome. It renders a plain <Link> — no state, no effect.
 *
 * `hasHi` is the honest part. Most of the site is bilingual, but not all of it
 * (a Hindi-only or English-only set has no counterpart). Where there is no
 * counterpart the link renders nothing at all, rather than sending the reader
 * to a 404 or silently to the wrong page.
 *
 * The label is deliberately always written in the language you would switch
 * TO — a reader who cannot read the current language can still find it.
 */
export default function LangLink({
  lang,
  path,
  hasHi,
  className = "",
}: {
  lang: Lang;
  /** The language-less path, e.g. "/topics/history". Falls back to the URL. */
  path?: string;
  hasHi: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  if (!hasHi) return null;

  // Prefer the path the page passed (it knows its own canonical shape); fall
  // back to stripping the prefix off the live URL.
  const bare = path ?? splitLang(pathname ?? "/").path;
  const target = href(otherLang(lang), bare);

  return (
    <Link
      href={target}
      hrefLang={otherLang(lang)}
      lang={otherLang(lang)}
      className={`ui text-sm text-ink-soft underline-offset-4 hover:text-ink ${className}`}
    >
      {t(lang, "common.readInHindi")}
    </Link>
  );
}
