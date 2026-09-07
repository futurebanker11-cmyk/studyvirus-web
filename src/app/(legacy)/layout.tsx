// The 26 per-app privacy pages, the stylescan pages, /mock-tests and the
// /b/[code] battle invite. The first three groups are linked from live Play
// Store listings, so their URLs and content must not change; only the chrome
// around them is shared.
//
// This group keeps the OLD chrome (SiteShell → Header/Footer) on purpose. The
// rebuilt site under src/app/[lang]/ has its own header and footer built on the
// Task 2 token layer; these pages are not part of that rebuild and are not
// re-themed by it.
//
// lang is hardcoded: every page in this group is English-only. That constant is
// what keeps these pages statically prerendered — deriving it from a request
// would make all 26 privacy pages server-render per request, which on Workers
// is a paid invocation and a cold start for content that never changes.
import HtmlShell from "@/components/site/HtmlShell";
import SiteShell from "@/components/SiteShell";

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return (
    <HtmlShell lang="en">
      <SiteShell>{children}</SiteShell>
    </HtmlShell>
  );
}
