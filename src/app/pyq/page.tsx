import Link from "next/link";
import { PYQ_EXAMS } from "@/lib/pyq";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Previous Year Question Papers (PYQ) - SSC, Railway, Police, Defence",
  description:
    "Practice previous year GK questions from RRB NTPC, SSC CGL, SSC GD, Delhi Police, NDA & more. 30 sets per exam with detailed answers.",
  alternates: { canonical: "https://studyvirus.com/pyq" },
};

const categoryLabels: Record<string, string> = {
  railway: "Railway Exams",
  ssc: "SSC Exams",
  police: "Police Exams",
  defence: "Defence Exams",
};

export default function PYQPage() {
  const grouped = PYQ_EXAMS.reduce((acc, e) => {
    (acc[e.category] = acc[e.category] || []).push(e);
    return acc;
  }, {} as Record<string, typeof PYQ_EXAMS>);

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "PYQ Papers" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">Previous Year Papers</h1>
      <p className="text-slate-500 mb-8">Practice GK questions from actual exam papers</p>

      {Object.entries(grouped).map(([cat, exams], idx) => (
        <section key={cat} className="mb-10">
          {idx === 2 && <AdSlot slot="inArticle1" />}
          {idx === 3 && <AdSlot slot="inArticle2" />}
          <h2 className="text-xl font-bold text-primary mb-4">{categoryLabels[cat] || cat}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {exams.map((e) => (
              <Link
                key={e.id}
                href={`/pyq/${e.slug}`}
                className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md hover:border-blue-200 transition"
              >
                <h3 className="font-bold text-lg text-primary">{e.en}</h3>
                <p className="text-sm text-slate-400 mt-1">{e.sets} practice sets &middot; 40 questions each</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
