import Link from "next/link";
import { ENGLISH_SECTIONS, chapterSlugEn } from "@/lib/english";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "English Grammar Practice - Basic & Advanced for SSC, Railway, Police",
  description: "Practice English grammar for competitive exams. Synonyms, antonyms, idioms, error spotting, comprehension & more with answers.",
  alternates: { canonical: "https://studyvirus.com/english" },
};

export default function EnglishPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "English" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">English Grammar</h1>
      <p className="text-slate-500 mb-8">Practice English for SSC, Railway, Police & all competitive exams</p>

      {ENGLISH_SECTIONS.map((section, sIdx) => (
        <section key={section.key} className="mb-10">
          {sIdx === 1 && <AdSlot slot="inArticle1" />}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{section.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-primary">{section.en.name}</h2>
              <p className="text-sm text-slate-400">{section.en.desc}</p>
            </div>
          </div>
          <div className="space-y-2">
            {section.chapters.map((ch, i) => (
              <Link
                key={ch.file}
                href={`/english/${section.key}/${chapterSlugEn(ch.en)}`}
                className="flex items-center gap-3 bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition group card-hover"
              >
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: section.accent }}
                >
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-primary group-hover:text-accent transition text-sm truncate">{ch.en}</h3>
                  <p className="text-xs text-slate-400">{ch.hi}</p>
                </div>
                <svg className="w-5 h-5 text-slate-300 group-hover:text-accent transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <AdSlot slot="inArticle2" />
    </>
  );
}
