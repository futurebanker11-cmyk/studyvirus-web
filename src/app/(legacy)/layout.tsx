// The 26 per-app privacy pages, the stylescan pages and the /b/[code] battle
// invite, kept exactly as they were. They are linked from live Play Store
// listings, so their URLs and content must not change; only the chrome around
// them is shared.
//
// This group keeps the OLD chrome (SiteShell → Header/Footer) on purpose. The
// rebuilt site under src/app/[lang]/ has its own header and footer built on the
// Task 2 token layer; these pages are not part of that rebuild and are not
// re-themed by it.
import SiteShell from "@/components/SiteShell";

export default function LegacyLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
