"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";

/**
 * The narrow-screen drawer. A client island rather than a client Header: the
 * links themselves are resolved on the server and handed in as props, so the
 * navigation is in the served HTML whether or not this script ever runs.
 *
 * No focus-trap library and no portal — one boolean, an Escape handler and a
 * scroll lock. Everything this needs to be usable, nothing that needs a
 * download on a 4G connection.
 */
export default function MobileNav({
  lang,
  items,
}: {
  lang: Lang;
  items: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    // Stop the page scrolling behind the drawer.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t(lang, "chrome.menu")}
        aria-expanded={open}
        className="ui inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-soft transition-colors hover:border-line-strong hover:text-ink lg:hidden"
      >
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label={t(lang, "chrome.closeMenu")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 h-full w-full cursor-default bg-scrim"
          />
          <nav
            aria-label={t(lang, "chrome.menuNav")}
            className="ui absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col overflow-y-auto border-l border-line bg-surface p-4"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t(lang, "chrome.closeMenu")}
              className="mb-2 self-end rounded-md p-2 text-ink-soft hover:text-ink"
            >
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                // 44px min target: this is read on cheap phones held one-handed.
                className="flex min-h-[44px] items-center rounded-md px-3 text-[0.95rem] text-ink no-underline hover:bg-surface-sunk"
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
