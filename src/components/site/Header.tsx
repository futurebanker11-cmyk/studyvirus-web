import Link from "next/link";
import { href, type Lang } from "@/lib/i18n/lang";
import { t, type T } from "@/lib/ui/strings";
import ThemeToggle from "./ThemeToggle";
import MobileNav from "./MobileNav";

/**
 * The site header. Rendered on the server so every nav link is in the served
 * HTML — a crawler and a reader on a dead 4G connection get the same
 * navigation. The only JavaScript is the theme toggle and the mobile drawer,
 * both small client islands.
 *
 * There is deliberately no install button here. The apps strip and the app
 * card carry that CTA; a header button competing with them on every page is
 * the pattern the audit called out.
 */

export const NAV: { key: T; path: string }[] = [
  { key: "nav.exams", path: "/exam" },
  { key: "nav.topics", path: "/topics" },
  { key: "nav.pyq", path: "/pyq" },
  { key: "nav.aptitude", path: "/aptitude" },
  { key: "nav.english", path: "/english" },
  { key: "nav.currentAffairs", path: "/current-affairs" },
  { key: "nav.articles", path: "/articles" },
];

export default function Header({ lang }: { lang: Lang }) {
  const items = NAV.map((n) => ({ href: href(lang, n.path), label: t(lang, n.key) }));

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg-blur backdrop-blur-sm">
      {/* First tabbable element on every page: keyboard users should not have
          to walk seven nav links to reach the article. */}
      <a
        href="#main"
        className="ui sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-sm focus:text-accent-ink"
      >
        {t(lang, "chrome.skipToContent")}
      </a>

      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link
          href={href(lang, "/")}
          className="ui flex shrink-0 items-center gap-2 text-ink no-underline"
        >
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-ink"
          >
            SV
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">StudyVirus</span>
        </Link>

        <nav aria-label={t(lang, "chrome.primaryNav")} className="ui ml-auto hidden items-center gap-1 lg:flex">
          {items.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="rounded-md px-2.5 py-1.5 text-sm text-ink-soft no-underline transition-colors hover:bg-surface-sunk hover:text-ink"
            >
              {i.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <ThemeToggle lang={lang} />
          <MobileNav lang={lang} items={items} />
        </div>
      </div>
    </header>
  );
}
