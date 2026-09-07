"use client";

import { useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";

/**
 * Light/dark toggle — one of the four places client JavaScript is allowed.
 *
 * Three states resolve in the token layer (see globals.css): no attribute
 * means "follow the OS", `data-theme="light"` and `data-theme="dark"` pin a
 * choice. This component only writes that attribute and remembers it.
 *
 * The stored choice is applied by `themeScript` below, injected in <head> so
 * it runs before first paint — otherwise a reader who picked dark would get a
 * white flash on every navigation.
 */

const KEY = "sv_theme";

/**
 * Inline, render-blocking by design and ~200 bytes. Must stay dependency-free
 * and synchronous: it is the one script permitted to run before paint.
 */
export const themeScript = `(function(){try{var t=localStorage.getItem("${KEY}");if(t==="dark"||t==="light"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

type Choice = "light" | "dark" | null;

function current(): Choice {
  if (typeof document === "undefined") return null;
  const v = document.documentElement.getAttribute("data-theme");
  return v === "dark" || v === "light" ? v : null;
}

export default function ThemeToggle({ lang }: { lang: Lang }) {
  // Start null on both server and first client render so the markup matches;
  // the real value is read after mount.
  const [choice, setChoice] = useState<Choice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setChoice(current());
    setMounted(true);
  }, []);

  // Which theme is actually showing right now — a pinned choice, else the OS.
  const isDark =
    choice === "dark" ||
    (choice === null &&
      mounted &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  function toggle() {
    const next: Choice = isDark ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode — the choice just won't survive the session */
    }
    setChoice(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t(lang, "theme.toggle")}
      // Until mounted we cannot know the OS preference, so expose nothing
      // rather than announcing a state that may be wrong.
      aria-pressed={mounted ? isDark : undefined}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
    >
      {/* Both glyphs ship; CSS shows the right one. Sized to the box so the
          header never reflows when the icon swaps. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width="17"
        height="17"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {mounted && isDark ? (
          // Sun — click to go light
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          // Moon — click to go dark
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
