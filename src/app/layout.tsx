import type { Metadata } from "next";
import "./globals.css";

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
 */

export const metadata: Metadata = {
  title: {
    default: "StudyVirus - Free GK Questions for Competitive Exams",
    template: "%s",
  },
  description:
    "200,000+ GK questions with answers for SSC, Railway, UPSC, Police & State exams. Free quizzes, mock tests, previous year papers & current affairs.",
  metadataBase: new URL("https://studyvirus.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "StudyVirus",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "StudyVirus - 200,000+ Free GK Questions for Competitive Exams",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyVirus - Free GK Questions for Competitive Exams",
    description: "200,000+ GK questions with answers for SSC, Railway, UPSC, Police & State exams.",
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
