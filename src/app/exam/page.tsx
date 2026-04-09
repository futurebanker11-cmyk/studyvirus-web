import Link from "next/link";
import { EXAMS, EXAM_CATEGORIES } from "@/lib/exams";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Competitive Exams - GK Preparation for 60+ Exams",
  description: "Choose your exam and start GK preparation. SSC, Railway, UPSC, Police, Defence, State PSC, Teaching & more — all with free questions and answers.",
  alternates: { canonical: "https://studyvirus.com/exam" },
};

const CATEGORY_ORDER = ['ssc', 'railway', 'police', 'defence', 'upsc', 'central', 'teaching', 'state_psc', 'state_sub', 'forest', 'jail', 'revenue', 'agriculture'];

export default function ExamsIndexPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Exams" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">Pick Your Exam</h1>
      <p className="text-slate-500 mb-8">Choose your exam to see relevant topics, PYQ papers & mock tests</p>

      {CATEGORY_ORDER.map((cat, idx) => {
        const exams = EXAMS.filter(e => e.category === cat);
        if (!exams.length) return null;
        return (
          <section key={cat} className="mb-8">
            {idx === 4 && <AdSlot slot="inArticle1" />}
            {idx === 8 && <AdSlot slot="inArticle2" />}
            <h2 className="text-lg font-bold text-primary mb-3">{EXAM_CATEGORIES[cat] || cat}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {exams.map((e) => (
                <Link
                  key={e.id}
                  href={`/exam/${e.slug}`}
                  className="bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition card-hover"
                >
                  <span className="text-xl mr-2">{e.icon}</span>
                  <h3 className="font-bold text-sm text-primary inline">{e.en}</h3>
                  <p className="text-xs text-slate-400 mt-1">{e.hi}</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
