import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppBanner from "@/components/AppBanner";
import HeaderAd from "@/components/HeaderAd";
import StickyBottomAd from "@/components/StickyBottomAd";
import SidebarAd from "@/components/SidebarAd";
import Script from "next/script";
import { LangProvider } from "@/lib/LangContext";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "StudyVirus - Free GK Questions for Competitive Exams",
    template: "%s | StudyVirus",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <Script
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3496395300151813"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${inter.className} pb-16`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "StudyVirus",
              url: "https://studyvirus.com",
              logo: "https://studyvirus.com/og-image.png",
              sameAs: [
                "https://play.google.com/store/apps/details?id=gk.gkinhindi.currentaffairs"
              ],
              description: "India's largest free GK question bank for competitive exam preparation.",
            }),
          }}
        />
        <LangProvider>
          <Header />
          <AppBanner />
          {/* Global header banner ad — every page */}
          <HeaderAd />
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex gap-6">
            {/* Main content */}
            <main className="min-h-screen flex-1 min-w-0">
              {children}
            </main>
            {/* Sidebar ad — desktop only, sticky */}
            <aside className="hidden lg:block w-[300px] shrink-0">
              <SidebarAd />
            </aside>
          </div>
          <Footer />
          {/* Global sticky bottom ad — every page */}
          <StickyBottomAd />
        </LangProvider>
      </body>
    </html>
  );
}
