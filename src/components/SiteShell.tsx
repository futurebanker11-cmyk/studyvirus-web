"use client";
// Chrome for the (legacy) route group only — the 26 per-app privacy pages and
// the stylescan pages. The rebuilt site under [lang] has its own layout.
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3496395300151813"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Header />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        <main className="min-h-screen pb-16">{children}</main>
      </div>
      <Footer />
    </>
  );
}
