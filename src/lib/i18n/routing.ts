import { PORTAL_APPS, PORTAL_SLUGS } from "@/lib/gkApps";
import { EXAMS } from "@/lib/exams";

// Routes rendered under src/app/[lang]/ (Plan B). The middleware rewrites the
// prefix-less English URL to /en/... internally; /hi/... passes through.
export const CONTENT_ROUTES = new Set([
  "topics", "exam", "pyq", "aptitude", "english", "current-affairs", "articles", "apps",
  "about", "contact", "terms", "privacy-policy",
]);

// Never rewritten: the (legacy) route group pages and route handlers.
// `mock-tests` passes through so the existing src/app/mock-tests route keeps
// serving it; its 301 lands in a later plan (there is no mock-tests rule in
// next.config.mjs today), and it must not be treated as an old WordPress URL.
// `sitemap` is Next's generateSitemaps directory: child sitemaps are served at
// /sitemap/<id>.xml, whose FIRST segment has no dot, so the "." check below
// does not catch them and every declared child sitemap would 301 away.
const PASSTHROUGH = new Set(["hi", "b", "privacy", "mock-tests", "sitemap"]);

// Third-party pages that live under /apps but outside [lang].
const STATIC_APPS = new Set(["stylescan"]);

// Retired CBT portals (spec §3): send each to its exam hub.
// Join on PORTAL_APPS (hasMocks && !sharedPortal), NOT GK_APPS: the generated
// registry carries duplicate slugs (rrbntpc, ssccgl) on sharedPortal apps whose
// ids are not exams, so a GK_APPS.find() would be order-dependent and could
// silently degrade those two hubs to /exam after a regeneration. PORTAL_APPS
// has unique slugs.
const PORTAL_TO_EXAM: Record<string, string> = {};
for (const slug of PORTAL_SLUGS) {
  const app = PORTAL_APPS.find((a) => a.slug === slug);
  const exam = app && EXAMS.find((e) => e.id === app.id);
  PORTAL_TO_EXAM[slug] = exam ? `/exam/${exam.slug}` : "/exam";
}
const RETIRED_TO_EXAM = new Set(["cbt", "mock-content"]);
// NOTE for whoever wires decide() into middleware: the "." check below only
// inspects the FIRST segment, so every static asset under public/cbt/** and
// public/bank/** (128 real files today, e.g. /cbt/player.html, /bank/_expo/...)
// is redirected too. That is faithful to spec §3 (the portals and the bank web
// app are retired), but the live src/middleware.ts records that 301-ing those
// paths breaks the running apps. Land the takedown deliberately, at the same
// time as the exam-hub bank section, not as a side effect of the rewrite.

export type Decision = { action: "next" } | { action: "rewrite"; to: string } | { action: "redirect"; to: string };

export function decide(pathname: string): Decision {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { action: "rewrite", to: "/en" };
  const first = segments[0];
  if (first.startsWith("_next") || first === "api" || first.includes(".")) return { action: "next" };
  // /__/auth/handler and /__/firebase/init.json: the Firebase auth proxy that
  // src/middleware.ts forwards for Google sign-in on every app privacy page.
  if (first.startsWith("__")) return { action: "next" };
  if (first === "en") return { action: "redirect", to: segments.length === 1 ? "/" : `/${segments.slice(1).join("/")}` };
  if (PASSTHROUGH.has(first)) return { action: "next" };
  if (first === "apps" && segments[1] && STATIC_APPS.has(segments[1])) return { action: "next" };
  if (CONTENT_ROUTES.has(first)) return { action: "rewrite", to: `/en${pathname}` };
  if (first === "bank") return { action: "redirect", to: "/exam#bank" };
  if (RETIRED_TO_EXAM.has(first)) return { action: "redirect", to: "/exam" };
  if (Object.prototype.hasOwnProperty.call(PORTAL_TO_EXAM, first)) return { action: "redirect", to: PORTAL_TO_EXAM[first] };
  return { action: "redirect", to: "/topics" };
}
