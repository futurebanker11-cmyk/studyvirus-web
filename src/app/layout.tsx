import type { Metadata, Viewport } from "next";
import "./globals.css";
import { siteStats, formatCount } from "@/lib/content/stats";

/**
 * Metadata defaults and the global stylesheet only.
 *
 * <html>/<body> are deliberately NOT here. Each route group renders its own
 * document shell (src/components/site/HtmlShell.tsx) so that <html lang> can
 * come from something statically knowable — the [lang] segment's own params,
 * or a constant for (legacy). Putting the shell here would mean the language
 * had to be read from a request header, and one headers() call in a root
 * layout de-opts every route on the site out of static generation. See the
 * comment in HtmlShell.tsx for what that cost.
 *
 * The counts below are computed, not written. These defaults are INHERITED by
 * every page that does not set its own openGraph/twitter block — which is most
 * of the site — so the hard-coded "200,000+" that used to live here was served
 * in the og:image:alt and twitter:description of every page including the new
 * home page, whose own <title> says 1,93,431. A page cannot advertise two
 * different totals about itself to a crawler and to a reader. siteStats() is a
 * synchronous read of the generated content index, so evaluating it here costs
 * nothing and cannot drift from what the pages display.
 */

const QUESTIONS = formatCount(siteStats().questions, "en");
const BLURB = `${QUESTIONS} free practice questions with answers for SSC, Railway, UPSC, Police and State exams — previous-year papers, chapter-wise sets and daily current affairs, in Hindi and English.`;

/**
 * Declared here rather than as a literal <meta> in HtmlShell so that Next.js
 * emits exactly ONE viewport tag. HtmlShell used to hand-write the tag while
 * Next injected its own default, so every page shipped two conflicting
 * viewport metas (invalid HTML; the last one won).
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: {
    default: "StudyVirus - Free GK Questions for Competitive Exams",
    template: "%s",
  },
  description: BLURB,
  metadataBase: new URL("https://studyvirus.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "StudyVirus",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: `StudyVirus - ${QUESTIONS} free practice questions for competitive exams`,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyVirus - Free GK Questions for Competitive Exams",
    description: BLURB,
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://studyvirus.com",
  },
  verification: {},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
