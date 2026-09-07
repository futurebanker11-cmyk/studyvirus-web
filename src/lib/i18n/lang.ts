export type Lang = "en" | "hi";
export const LANGS: readonly Lang[] = ["en", "hi"];

export function isLang(x: unknown): x is Lang {
  return x === "en" || x === "hi";
}

export function href(lang: Lang, path: string): string {
  if (lang === "en") return path;
  return path === "/" ? "/hi" : `/hi${path}`;
}

export function splitLang(pathname: string): { lang: Lang; path: string } {
  if (pathname === "/hi") return { lang: "hi", path: "/" };
  if (pathname.startsWith("/hi/")) return { lang: "hi", path: pathname.slice(3) };
  return { lang: "en", path: pathname };
}

export const otherLang = (lang: Lang): Lang => (lang === "en" ? "hi" : "en");
