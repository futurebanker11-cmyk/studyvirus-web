import { test } from "node:test";
import assert from "node:assert/strict";
import { href, splitLang, isLang, otherLang } from "../src/lib/i18n/lang";
import { decide, langOf } from "../src/lib/i18n/routing";
import { buildAlternates, abs } from "../src/lib/i18n/alternates";
import { PORTAL_SLUGS } from "../src/lib/gkApps";
import { EXAMS } from "../src/lib/exams";

test("href and splitLang", () => {
  assert.equal(href("en", "/topics/history"), "/topics/history");
  assert.equal(href("hi", "/topics/history"), "/hi/topics/history");
  assert.equal(href("hi", "/"), "/hi");
  assert.deepEqual(splitLang("/hi/topics/history"), { lang: "hi", path: "/topics/history" });
  assert.deepEqual(splitLang("/hi"), { lang: "hi", path: "/" });
  assert.deepEqual(splitLang("/topics"), { lang: "en", path: "/topics" });
  assert.equal(isLang("hi"), true); assert.equal(isLang("fr"), false);
  assert.equal(otherLang("en"), "hi");
});

test("decide: content routes rewrite to /en, hi passes, portals pass, unknown redirects", () => {
  assert.deepEqual(decide("/"), { action: "rewrite", to: "/en" });
  assert.deepEqual(decide("/topics/history/indus-valley/set-1"), { action: "rewrite", to: "/en/topics/history/indus-valley/set-1" });
  assert.deepEqual(decide("/exam/rrb-ntpc"), { action: "rewrite", to: "/en/exam/rrb-ntpc" });
  assert.deepEqual(decide("/apps"), { action: "rewrite", to: "/en/apps" });
  assert.deepEqual(decide("/apps/rrb-ntpc"), { action: "rewrite", to: "/en/apps/rrb-ntpc" });
  assert.deepEqual(decide("/apps/stylescan/privacy-policy"), { action: "next" });
  assert.deepEqual(decide("/hi/topics/history"), { action: "next" });
  assert.deepEqual(decide("/hi"), { action: "next" });
  assert.deepEqual(decide("/en/topics/history"), { action: "redirect", to: "/topics/history" });
  assert.deepEqual(decide("/en"), { action: "redirect", to: "/" });
  assert.deepEqual(decide("/bank/mock/x"), { action: "redirect", to: "/exam#bank" });
  assert.deepEqual(decide("/ssccgl"), { action: "redirect", to: "/exam/ssc-cgl" });
  assert.deepEqual(decide("/rrbntpc/mock/abc"), { action: "redirect", to: "/exam/rrb-ntpc" });
  assert.deepEqual(decide("/cbt/player.html"), { action: "redirect", to: "/exam" });
  assert.deepEqual(decide("/mock-content/manifest.json"), { action: "redirect", to: "/exam" });
  assert.deepEqual(decide("/privacy/bpsc-tre"), { action: "next" });
  assert.deepEqual(decide("/b/ABC123"), { action: "next" });
  assert.deepEqual(decide("/sitemap.xml"), { action: "next" });
  assert.deepEqual(decide("/.well-known/assetlinks.json"), { action: "next" });
  assert.deepEqual(decide("/_next/static/x.js"), { action: "next" });
  assert.deepEqual(decide("/api/x"), { action: "next" });
  assert.deepEqual(decide("/biology/29/"), { action: "redirect", to: "/topics" });
  // Inherited Object keys must not be mistaken for portal slugs.
  assert.deepEqual(decide("/constructor"), { action: "redirect", to: "/topics" });
  assert.deepEqual(decide("/toString/x"), { action: "redirect", to: "/topics" });
});

// Two families of paths carry no dot in their FIRST segment and must still
// pass through: the Firebase auth proxy (/__/auth/handler, /__/firebase/init.json)
// that src/middleware.ts forwards for Google sign-in on every app privacy
// page, and Next's generateSitemaps children at /sitemap/<id>.xml. A 301 on
// either breaks sign-in or sends every declared child sitemap away.
test("decide: Firebase proxy and child sitemap paths pass through", () => {
  assert.deepEqual(decide("/__/auth/handler"), { action: "next" });
  assert.deepEqual(decide("/__/firebase/init.json"), { action: "next" });
  assert.deepEqual(decide("/sitemap/en-sets-0.xml"), { action: "next" });
  assert.deepEqual(decide("/sitemap/hi-topics-0.xml"), { action: "next" });
  assert.deepEqual(decide("/sitemap.xml"), { action: "next" });
});

test("decide: a portal whose app has no exam registry entry falls back to /exam", () => {
  // up_bihar_police has a CBT portal slug in gkApps.ts but no entry in EXAMS.
  assert.deepEqual(decide("/upbiharpolice"), { action: "redirect", to: "/exam" });
  assert.deepEqual(decide("/upbiharpolice/mock/abc"), { action: "redirect", to: "/exam" });
});

test("decide: every portal slug lands on its own exam hub; only upbiharpolice falls back", () => {
  const hubs = new Set(EXAMS.map((e) => `/exam/${e.slug}`));
  const fallbacks: string[] = [];
  for (const slug of PORTAL_SLUGS) {
    const d = decide(`/${slug}`);
    assert.equal(d.action, "redirect", `/${slug} should redirect`);
    const to = (d as { to: string }).to;
    if (to === "/exam") fallbacks.push(slug);
    else assert.ok(hubs.has(to), `/${slug} -> ${to} is not an exam hub`);
  }
  // Exactly one portal has no exam registry entry. If this count grows, a
  // portal has silently degraded from its hub to the generic /exam page —
  // GK_APPS carries duplicate slugs (rrbntpc, ssccgl) on sharedPortal apps
  // whose ids are not exams, so an order-dependent join would do just that.
  assert.deepEqual(fallbacks, ["upbiharpolice"]);
  assert.deepEqual(decide("/ssccgl"), { action: "redirect", to: "/exam/ssc-cgl" });
  assert.deepEqual(decide("/rrbntpc"), { action: "redirect", to: "/exam/rrb-ntpc" });
});

test("alternates", () => {
  assert.equal(abs("/topics"), "https://studyvirus.com/topics");
  assert.deepEqual(buildAlternates({ lang: "en", path: "/topics/history", hasHi: true }), {
    canonical: "https://studyvirus.com/topics/history",
    languages: { "en-IN": "https://studyvirus.com/topics/history", "hi-IN": "https://studyvirus.com/hi/topics/history", "x-default": "https://studyvirus.com/topics/history" },
  });
  assert.deepEqual(buildAlternates({ lang: "hi", path: "/topics/history", hasHi: true }).canonical, "https://studyvirus.com/hi/topics/history");
  assert.deepEqual(buildAlternates({ lang: "en", path: "/topics/history", hasHi: false }), { canonical: "https://studyvirus.com/topics/history" });
});

/**
 * langOf decides what goes in <html lang>. Nothing else fails if it is wrong —
 * the page renders, it just tells crawlers and screen readers the wrong
 * language on half the site, which is the exact defect the rebuild exists to
 * fix. So it gets its own test.
 */
test("langOf: only a real /hi segment is Hindi", () => {
  assert.equal(langOf("/hi"), "hi");
  assert.equal(langOf("/hi/"), "hi");
  assert.equal(langOf("/hi/topics"), "hi");
  assert.equal(langOf("/hi/topics/history/1"), "hi");

  assert.equal(langOf("/"), "en");
  assert.equal(langOf("/topics"), "en");
  assert.equal(langOf("/privacy/wbcs"), "en");
  assert.equal(langOf("/en/topics"), "en");

  // The guard that a bare startsWith("/hi") would fail: these are English
  // paths that merely begin with the same two letters.
  assert.equal(langOf("/hindi-something"), "en");
  assert.equal(langOf("/hindi"), "en");
  assert.equal(langOf("/history"), "en");
});

test("langOf agrees with splitLang on every path both understand", () => {
  // Two independent implementations of the same rule live in the codebase
  // (splitLang also returns the stripped path). They must not drift.
  for (const p of ["/", "/hi", "/hi/topics", "/topics", "/hindi-something", "/privacy/wbcs"]) {
    assert.equal(langOf(p), splitLang(p).lang, p);
  }
});
