import { notFound } from "next/navigation";
import Script from "next/script";
import { isLang } from "@/lib/i18n/lang";
import HtmlShell from "@/components/site/HtmlShell";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";

/**
 * Every content page on the rebuilt site lives under this segment.
 *
 * The prefix is real for Hindi (/hi/topics) and virtual for English: the
 * middleware rewrites the prefix-less /topics to /en/topics, and 301s anyone
 * who asks for /en/... explicitly back to the bare path. So English URLs never
 * carry a language prefix, and there is still exactly one place that knows
 * which language a page is in.
 *
 * This layout renders <html> (via HtmlShell) rather than the root layout,
 * because `lang` here comes from params — which generateStaticParams
 * enumerates, so it is known at build time and every page still prerenders.
 * Reading it from a request header in the root layout instead would make the
 * whole site dynamic; see the comment in HtmlShell.tsx.
 */
export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "hi" }];
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  // The segment is a catch-all as far as the router is concerned, so anything
  // that is not a language we actually publish must 404 rather than render an
  // English page under a nonsense prefix.
  if (!isLang(lang)) notFound();

  return (
    <HtmlShell lang={lang}>
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3496395300151813"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Header lang={lang} />
      <main id="main" className="min-h-screen">
        {children}
      </main>
      <Footer lang={lang} />
    </HtmlShell>
  );
}
