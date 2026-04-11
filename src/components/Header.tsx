"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LangToggle from "./LangToggle";

const NAV_LINKS = [
  { href: "/exam", label: "Exams" },
  { href: "/topics", label: "Topics" },
  { href: "/pyq", label: "PYQ Papers" },
  { href: "/mock-tests", label: "Mock Tests" },
  { href: "/english", label: "English" },
  { href: "/current-affairs", label: "Current Affairs" },
  { href: "/articles", label: "Articles" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="bg-gradient-to-r from-slate-900 via-primary to-slate-900 text-white sticky top-0 z-50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center font-black text-sm">
              SV
            </div>
            <span className="text-xl font-black tracking-tight">StudyVirus</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  pathname.startsWith(link.href)
                    ? "bg-white/15 text-white"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LangToggle />
            <button
              className="md:hidden text-white p-1"
              onClick={() => setOpen(!open)}
              aria-label="Menu"
            >
              {open ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <nav
            className="absolute right-0 top-0 h-full w-72 bg-primary shadow-2xl p-6 pt-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    pathname.startsWith(link.href)
                      ? "bg-accent/20 text-accent"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
