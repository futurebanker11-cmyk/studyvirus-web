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
  "mock-content", // Mock CBT papers served as static assets from public/mock-content/
                  // — without this the middleware 301s /mock-content/* to /topics
                  // and the app/website fetch gets HTML instead of JSON.
  "bank", // Bank mock app (RN app exported for web, served at /bank via the
          // src/app/bank/[[...slug]] SPA-fallback route + public/bank/** assets).
          // Without this the middleware 301s /bank and every /bank/_expo asset
          // to /topics, so the app never loads.
]);

// Firebase Auth custom-domain proxy. When authDomain = "studyvirus.com", the
// Google sign-in page shows "studyvirus.com" instead of the ugly
// "study-virus-wordpress-app.firebaseapp.com". For that to work, the special
// Firebase auth-handler assets it serves at /__/auth/* and /__/firebase/* must
// be reachable ON our domain — but studyvirus.com is on Cloudflare/OpenNext, not
// Firebase Hosting, so we PROXY those paths to the Firebase-hosted origin. Only
// these two prefixes are proxied; nothing else on the site is affected.
const FIREBASE_AUTH_ORIGIN = "https://study-virus-wordpress-app.firebaseapp.com";

async function proxyFirebaseAuth(request: NextRequest): Promise<Response> {
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, FIREBASE_AUTH_ORIGIN);
  // Forward the request as-is (GET for handler HTML/JS; the handler itself talks
  // to Google). Strip hop-by-hop concerns; let fetch set host for the target.
  const res = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
  // Pass the upstream response straight through (status, headers, body).
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Firebase auth handler + widget assets → proxy to the Firebase origin so the
  // custom authDomain (studyvirus.com) works. MUST come before the WordPress
  // redirect below, which would otherwise 301 /__/... to /topics.
  if (pathname.startsWith("/__/auth") || pathname.startsWith("/__/firebase")) {
    return proxyFirebaseAuth(request);
  }

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
