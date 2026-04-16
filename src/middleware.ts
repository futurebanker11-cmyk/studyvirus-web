import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Known Next.js app routes at root level
const KNOWN_ROUTES = new Set([
  "topics",
  "exam",
  "pyq",
  "mock-tests",
  "articles",
  "english",
  "current-affairs",
  "about",
  "contact",
  "privacy-policy",
  "terms",
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only handle root-level paths like /some-old-wordpress-slug
  // Skip paths with multiple segments (they're handled by Next.js routes or redirects)
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length !== 1) return NextResponse.next();

  const slug = segments[0];

  // Skip known routes, static files, and Next.js internals
  if (
    KNOWN_ROUTES.has(slug) ||
    slug.startsWith("_next") ||
    slug.startsWith("api") ||
    slug.includes(".")  // static files like favicon.ico, robots.txt, sitemap.xml
  ) {
    return NextResponse.next();
  }

  // This is an old WordPress post slug — redirect to /topics
  const url = request.nextUrl.clone();
  url.pathname = "/topics";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    // Only match root-level paths, skip static files and Next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
