"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangToggle from "./LangToggle";

const NAV_LINKS = [
  { href: "/exam",            label: "Exams" },
  { href: "/topics",          label: "Topics" },
  { href: "/pyq",             label: "PYQ Papers" },
  { href: "/mock-tests",      label: "Mock Tests" },
  { href: "/english",         label: "English" },
  { href: "/current-affairs", label: "Current Affairs" },
  { href: "/articles",        label: "Articles" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="bg-gradient-to-r from-[#060d1e] via-[#0f1f3d] to-[#060d1e] text-white sticky top-0 z-50 shadow-xl shadow-black/20 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-display font-black text-sm text-white shadow-lg shadow-blue-500/30 ring-1 ring-blue-400/30">
              SV
            </div>
            <span className="text-xl font-display font-black tracking-tight">StudyVirus</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "text-slate-300 hover:text-white hover:bg-white/8"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <LangToggle />
            <button
              className="md:hidden text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <nav
            className="absolute right-0 top-0 h-full w-72 bg-[#060d1e] border-l border-white/8 shadow-2xl p-6 pt-20 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo in drawer */}
            <div className="flex items-center gap-2.5 mb-6 pb-5 border-b border-white/8">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-display font-black text-sm text-white shadow-lg shadow-blue-500/30">
                SV
              </div>
              <span className="text-lg font-display font-black text-white tracking-tight">StudyVirus</span>
            </div>

            <div className="space-y-1">
              {NAV_LINKS.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-xl text-base font-medium transition-all ${
                      isActive
                        ? "bg-accent/20 text-accent border border-accent/20"
                        : "text-slate-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* App download in drawer */}
            <div className="mt-8 pt-5 border-t border-white/8">
              <a
                href="https://play.google.com/store/apps/details?id=com.gkpkhindi.studyvirus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-white/8 hover:bg-white/15 border border-white/10 text-white px-4 py-3 rounded-xl text-sm font-semibold transition"
                onClick={() => setOpen(false)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                </svg>
                Download App
              </a>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
