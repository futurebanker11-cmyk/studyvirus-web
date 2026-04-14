"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { AD_SLOTS } from "./AdSlot";

const AD_CLIENT = "ca-pub-3496395300151813";

const QUICK_TOPICS = [
  { name: "Indian History", href: "/topics/history", color: "bg-orange-500" },
  { name: "Polity", href: "/topics/polity", color: "bg-blue-500" },
  { name: "Geography", href: "/topics/geography", color: "bg-emerald-500" },
  { name: "Economics", href: "/topics/economics", color: "bg-violet-500" },
  { name: "Physics", href: "/topics/physics", color: "bg-cyan-500" },
  { name: "Biology", href: "/topics/biology", color: "bg-green-500" },
];

const QUICK_EXAMS = [
  { name: "SSC CGL", href: "/exam/ssc-cgl" },
  { name: "RRB NTPC", href: "/exam/rrb-ntpc" },
  { name: "SSC GD", href: "/exam/ssc-gd" },
  { name: "Delhi Police", href: "/exam/delhi-police" },
];

export default function SidebarAd() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
          pushed.current = true;
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden lg:block sticky top-20 space-y-4">
      {/* Ad slot */}
      <div className="bg-white rounded-xl border border-slate-100 p-2">
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: "250px" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOTS.sidebar}
          data-ad-format="rectangle"
          data-full-width-responsive="false"
        />
      </div>

      {/* Download App card */}
      <a
        href="https://play.google.com/store/apps/details?id=com.gkpkhindi.studyvirus"
        target="_blank"
        rel="noopener noreferrer"
        className="block bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 hover:shadow-lg transition-all group cursor-pointer"
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-xs text-white">SV</div>
          <div>
            <p className="text-white font-bold text-sm">StudyVirus App</p>
            <p className="text-slate-400 text-[10px]">Free on Play Store</p>
          </div>
        </div>
        <p className="text-slate-400 text-xs mb-3">Offline mode, flash cards, 1v1 battles & more</p>
        <span className="inline-flex items-center gap-1.5 bg-accent text-white text-xs font-bold px-3 py-1.5 rounded-lg group-hover:bg-blue-400 transition-colors">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/></svg>
          Download Free
        </span>
      </a>

      {/* Popular Topics */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h3 className="font-bold text-sm text-primary mb-3">Popular Topics</h3>
        <div className="space-y-1.5">
          {QUICK_TOPICS.map((t) => (
            <Link
              key={t.name}
              href={t.href}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors group cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${t.color} shrink-0`} />
              <span className="text-sm text-slate-600 group-hover:text-primary transition-colors">{t.name}</span>
              <svg className="w-3 h-3 text-slate-300 ml-auto group-hover:text-accent transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          ))}
        </div>
        <Link href="/topics" className="block text-center text-xs text-accent font-semibold mt-3 hover:underline">
          All Topics →
        </Link>
      </div>

      {/* Quick Exams */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h3 className="font-bold text-sm text-primary mb-3">Top Exams</h3>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_EXAMS.map((e) => (
            <Link
              key={e.name}
              href={e.href}
              className="text-xs font-medium bg-slate-50 hover:bg-accent hover:text-white text-slate-600 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {e.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
