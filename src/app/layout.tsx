import type { Metadata } from "next";
import { IBM_Plex_Sans, Noto_Serif_Devanagari, Source_Serif_4 } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { themeScript } from "@/components/site/ThemeToggle";
import { isLang } from "@/lib/i18n/lang";
import { organization } from "@/lib/seo/jsonld";

/**
 * Three faces, chosen so a Hindi reader and an English reader get the same
 * texture rather than one of them getting a bolted-on fallback.
 *
 * Source Serif 4 (Latin body) and Noto Serif Devanagari (Hindi body) are both
 * variable fonts, so each ships one file covering every weight we use. IBM
 * Plex Sans carries UI chrome only and is pinned to three static weights to
 * keep the payload honest on 4G.
 */
const serif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

const devaSerif = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  variable: "--font-deva-serif",
  display: "swap",
  fallback: ["Georgia", "serif"],
});

const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex",
  display: "swap",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});


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

/**
 * COUPLING: src/middleware.ts sets the `x-sv-lang` header this reads.
 *
 * <html> is rendered here, but a Next 14 root layout cannot see the [lang]
 * segment underneath it, and setting document.documentElement.lang from the
 * client is not acceptable — crawlers and assistive tech read the served HTML.
 * The middleware sees the URL, so it states the language in a request header
 * and this reads it back. If that header stops being set, every Hindi page
 * silently falls back to lang="en".
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = headers().get("x-sv-lang");
  const lang = isLang(h) ? h : "en";

  return (
    <html lang={lang}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#fbfaf7" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#14161a" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Applies a stored light/dark choice before first paint. Without
            this, a reader who picked dark gets a white flash on every load. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${serif.variable} ${devaSerif.variable} ${plex.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organization()) }}
        />
        {children}
      </body>
    </html>
  );
}
