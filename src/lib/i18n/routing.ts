import { GK_APPS, PORTAL_SLUGS } from "@/lib/gkApps";
import { EXAMS } from "@/lib/exams";

// Routes rendered under src/app/[lang]/ (Plan B). The middleware rewrites the
// prefix-less English URL to /en/... internally; /hi/... passes through.
export const CONTENT_ROUTES = new Set([
  "topics", "exam", "pyq", "aptitude", "english", "current-affairs", "articles", "apps",
  "about", "contact", "terms", "privacy-policy",
]);

// Never rewritten: the (legacy) route group pages and route handlers.
const PASSTHROUGH = new Set(["hi", "b", "privacy", "mock-tests"]);

// Third-party pages that live under /apps but outside [lang].
const STATIC_APPS = new Set(["stylescan"]);

// Retired CBT portals (spec §3): send each to its exam hub.
const PORTAL_TO_EXAM: Record<string, string> = {};
for (const slug of PORTAL_SLUGS) {
  const app = GK_APPS.find((a) => a.slug === slug);
  const exam = app && EXAMS.find((e) => e.id === app.id);
  PORTAL_TO_EXAM[slug] = exam ? `/exam/${exam.slug}` : "/exam";
}
const RETIRED_TO_EXAM = new Set(["cbt", "mock-content"]);

export type Decision = { action: "next" } | { action: "rewrite"; to: string } | { action: "redirect"; to: string };

export function decide(pathname: string): Decision {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { action: "rewrite", to: "/en" };
  const first = segments[0];
  if (first.startsWith("_next") || first === "api" || first.includes(".")) return { action: "next" };
  if (first === "en") return { action: "redirect", to: segments.length === 1 ? "/" : `/${segments.slice(1).join("/")}` };
  if (PASSTHROUGH.has(first)) return { action: "next" };
  if (first === "apps" && segments[1] && STATIC_APPS.has(segments[1])) return { action: "next" };
  if (CONTENT_ROUTES.has(first)) return { action: "rewrite", to: `/en${pathname}` };
  if (first === "bank") return { action: "redirect", to: "/exam#bank" };
  if (RETIRED_TO_EXAM.has(first)) return { action: "redirect", to: "/exam" };
  if (Object.prototype.hasOwnProperty.call(PORTAL_TO_EXAM, first)) return { action: "redirect", to: PORTAL_TO_EXAM[first] };
  return { action: "redirect", to: "/topics" };
}
