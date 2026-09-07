import { IBM_Plex_Sans, Noto_Serif_Devanagari, Source_Serif_4 } from "next/font/google";
import type { Lang } from "@/lib/i18n/lang";
import { themeScript } from "@/components/site/ThemeToggle";
import { organization } from "@/lib/seo/jsonld";

/**
 * The <html>/<body> document shell.
 *
 * This lives here, not in the root layout, for one concrete reason: <html lang>
 * has to be right on Hindi pages, and the root layout cannot see the [lang]
 * segment beneath it. The obvious fix — read a header the middleware sets — is
 * a trap. A root layout wraps EVERY route, so a single headers() call there
 * opts the entire site out of static generation: the first attempt at this
 * dropped the build from 201 prerendered routes and 197 static HTML files to
 * zero, including all 26 Play-linked privacy pages, which then server-render
 * per request (a paid Workers invocation and a cold start on every hit) for
 * content that never changes. Worse, the build log still printed "● (SSG)"
 * against those routes, so nothing looked wrong.
 *
 * Rendering the shell inside each route group instead means each group states
 * its own language from something statically knowable: [lang] from its own
 * params (enumerated by generateStaticParams), (legacy) from a constant. No
 * request is read, so every page prerenders again.
 *
 * Three faces, chosen so a Hindi reader and an English reader get the same
 * texture rather than one of them getting a bolted-on fallback. Source Serif 4
 * (Latin body) and Noto Serif Devanagari (Hindi body) are both variable fonts,
 * so each ships one file covering every weight we use. IBM Plex Sans carries UI
 * chrome only and is pinned to three static weights to keep the payload honest
 * on 4G.
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

export default function HtmlShell({
  lang,
  children,
}: {
  lang: Lang;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang}>
      {/* A literal <head> is correct in the App Router; the rule below is a
          Pages Router rule and next/head must NOT be used here. It did not
          fire while this markup lived in the root layout. */}
      {/* eslint-disable-next-line @next/next/no-head-element */}
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
