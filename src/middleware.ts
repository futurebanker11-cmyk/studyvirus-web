import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decide } from "@/lib/i18n/routing";

// Firebase Auth custom-domain proxy. authDomain = "studyvirus.com" means the
// sign-in page shows our domain, but the handler assets it serves at /__/auth/*
// and /__/firebase/* live on Firebase Hosting, so we proxy those two prefixes.
// MUST run before decide(), which would otherwise redirect them to /topics.
const FIREBASE_AUTH_ORIGIN = "https://study-virus-wordpress-app.firebaseapp.com";

// ─────────────────────────────────────────────────────────────────────────────
// COUPLING: src/app/layout.tsx reads this header.
//
// The root layout renders <html>, but in the Next 14 App Router a layout cannot
// read the route segment below it, so it cannot know whether the page it is
// wrapping is English or Hindi. Setting the attribute client-side is not an
// option — crawlers and screen readers need `lang` in the served HTML, and
// getting it wrong on half the site is precisely the accessibility/SEO defect
// the rebuild exists to fix.
//
// So the middleware, which *does* see the URL, states the language here and the
// root layout reads it back with headers(). Rename or drop this header and
// every Hindi page silently reverts to lang="en".
// ─────────────────────────────────────────────────────────────────────────────
const LANG_HEADER = "x-sv-lang";

async function proxyFirebaseAuth(request: NextRequest): Promise<Response> {
  const target = new URL(request.nextUrl.pathname + request.nextUrl.search, FIREBASE_AUTH_ORIGIN);
  const res = await fetch(target.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

/** Hindi is the only prefixed language; everything else renders as English. */
function langOf(pathname: string): "en" | "hi" {
  return pathname === "/hi" || pathname.startsWith("/hi/") ? "hi" : "en";
}

/**
 * The header has to reach the *render*, not just the response, so it is set on
 * the request headers that NextResponse.next()/rewrite() forward to the server
 * components. Setting it only on the response would leave headers() empty.
 */
function withLang(request: NextRequest, lang: "en" | "hi") {
  const headers = new Headers(request.headers);
  headers.set(LANG_HEADER, lang);
  return headers;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/__/auth") || pathname.startsWith("/__/firebase")) {
    return proxyFirebaseAuth(request);
  }

  const d = decide(pathname);

  if (d.action === "next") {
    // Passthrough: /hi/... is Hindi, the (legacy) group and everything else
    // is English.
    const lang = langOf(pathname);
    const res = NextResponse.next({ request: { headers: withLang(request, lang) } });
    res.headers.set(LANG_HEADER, lang);
    return res;
  }

  const url = request.nextUrl.clone();
  if (d.action === "rewrite") {
    // Rewrites only ever target /en/... (decide() rewrites the prefix-less
    // English URL), so the rendered page is English.
    url.pathname = d.to;
    const lang = langOf(d.to);
    const res = NextResponse.rewrite(url, { request: { headers: withLang(request, lang) } });
    res.headers.set(LANG_HEADER, lang);
    return res;
  }
  const [path, hash] = d.to.split("#");
  url.pathname = path;
  url.search = "";
  url.hash = hash ?? "";
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
