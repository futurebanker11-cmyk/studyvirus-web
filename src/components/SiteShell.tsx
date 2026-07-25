"use client";
// SiteShell — decides which chrome a route gets.
//
// /bank/** is a distraction-free product surface: NO site header/nav, NO app
// banner, NO footer and — critically — NO AdSense (the script tag itself only
// loads on non-bank routes, so no auto-ads/anchor ads can ever appear over a
// running mock). Everything else keeps the full StudyVirus chrome + ads.
import { usePathname } from "next/navigation";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AppBanner from "@/components/AppBanner";
import HeaderAd from "@/components/HeaderAd";
import StickyBottomAd from "@/components/StickyBottomAd";
import SidebarAd from "@/components/SidebarAd";

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isBank = pathname === "/bank" || pathname.startsWith("/bank/");

  if (isBank) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-6">{children}</main>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3496395300151813"
        crossOrigin="anonymous"
        strategy="lazyOnload"
      />
      <Header />
      <AppBanner />
      {/* Global header banner ad — every non-bank page */}
      <HeaderAd />
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 flex gap-6">
        <main className="min-h-screen flex-1 min-w-0 pb-16">{children}</main>
        {/* Sidebar ad — desktop only, sticky */}
        <aside className="hidden lg:block w-[300px] shrink-0">
          <SidebarAd />
        </aside>
      </div>
      <Footer />
      {/* Global sticky bottom ad — every non-bank page */}
      <StickyBottomAd />
    </>
  );
}
