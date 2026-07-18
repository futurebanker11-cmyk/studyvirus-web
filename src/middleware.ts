import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Known Next.js app routes — first segment of valid paths
const KNOWN_ROUTES = new Set([
  "b", // GK Battle app invite links: /b/CODE → public/b-landing.html rewrite
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
  "apps", // Third-party app pages (e.g., /apps/stylescan/privacy-policy)
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return NextResponse.next();

  const firstSegment = segments[0];

  // Skip known routes, static files, and Next.js internals
  if (
    KNOWN_ROUTES.has(firstSegment) ||
    firstSegment.startsWith("_next") ||
    firstSegment.startsWith("api") ||
    firstSegment.includes(".")  // static files like favicon.ico, robots.txt, sitemap.xml
  ) {
    return NextResponse.next();
  }

  // Any path whose first segment isn't a known route is an old WordPress URL
  // e.g. /biology/29/, /fr/expansion-of.../14/, /climate-of-india/2/
  const url = request.nextUrl.clone();
  url.pathname = "/topics";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
