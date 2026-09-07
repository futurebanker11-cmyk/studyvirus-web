import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decide } from "@/lib/i18n/routing";

// Firebase Auth custom-domain proxy. authDomain = "studyvirus.com" means the
// sign-in page shows our domain, but the handler assets it serves at /__/auth/*
// and /__/firebase/* live on Firebase Hosting, so we proxy those two prefixes.
// MUST run before decide(), which would otherwise redirect them to /topics.
const FIREBASE_AUTH_ORIGIN = "https://study-virus-wordpress-app.firebaseapp.com";

// NOTE: an earlier revision set an `x-sv-lang` request header here for the root
// layout to read into <html lang>. That worked, and was also a serious mistake:
// a root layout wraps every route, so its headers() call opted the WHOLE site
// out of static generation — 201 prerendered routes and 197 static HTML files
// went to zero, the 26 Play-linked privacy pages included, while the build log
// still printed "● (SSG)" beside them. <html> now lives in each route group's
// layout, where the language is statically knowable, and the middleware is back
// to routing only. Do not reintroduce a header read in the root layout.

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/__/auth") || pathname.startsWith("/__/firebase")) {
    return proxyFirebaseAuth(request);
  }

  const d = decide(pathname);
  if (d.action === "next") return NextResponse.next();

  const url = request.nextUrl.clone();
  if (d.action === "rewrite") {
    url.pathname = d.to;
    return NextResponse.rewrite(url);
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
