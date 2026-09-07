import { href, type Lang } from "./lang";

export const SITE = "https://studyvirus.com";
export const abs = (path: string) => `${SITE}${path === "/" ? "" : path}`;

export function buildAlternates(o: { lang: Lang; path: string; hasHi: boolean }): { canonical: string; languages?: Record<string, string> } {
  const canonical = abs(href(o.lang, o.path));
  if (!o.hasHi) return { canonical };
  const en = abs(o.path), hi = abs(href("hi", o.path));
  return { canonical, languages: { "en-IN": en, "hi-IN": hi, "x-default": en } };
}
