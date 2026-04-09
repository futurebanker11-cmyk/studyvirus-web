"use client";
import { useLang } from "@/lib/LangContext";

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "hi" : "en")}
      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur rounded-full px-3 py-1.5 text-sm font-semibold transition-all"
      aria-label="Toggle language"
    >
      <span className={lang === "en" ? "text-white" : "text-white/50"}>EN</span>
      <span className="text-white/30">|</span>
      <span className={lang === "hi" ? "text-white" : "text-white/50"}>हि</span>
    </button>
  );
}
