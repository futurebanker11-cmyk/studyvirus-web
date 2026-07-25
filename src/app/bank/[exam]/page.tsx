// studyvirus.com/bank/<exam> — one exam's mock catalog.
//
// Server-rendered shell (SEO: "SBI Clerk mock test" lands here) around the
// client MockCards tabs: Prelims Mocks · Topic Tests · Sectional Tests · Mains.
// ATTEMPT hands off to the React-Native CBT player at /bank/mock/<paperId>.
//
// ⚠ This dynamic segment also catches stray urls the RN app writes client-side
// (/bank/mocks, /bank/signin, …) when someone refreshes there — anything that
// isn't a real exam dir redirects to the /bank landing instead of 404ing.
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  loadBankManifest,
  examByDir,
  tierForDir,
  BANK_EXAMS,
} from "@/lib/bankCatalog";
import { BankAuthProvider, BankBar } from "@/components/bank/BankAuth";
import MockCards from "@/components/bank/MockCards";

export const revalidate = 300;

export function generateStaticParams() {
  return BANK_EXAMS.map((e) => ({ exam: e.dir }));
}

export async function generateMetadata({ params }: { params: { exam: string } }): Promise<Metadata> {
  const meta = examByDir(params.exam);
  if (!meta) return {};
  return {
    title: `${meta.label} Mock Test 2026 — Free Full Mock Tests, Sectional & Topic Tests`,
    description: `Attempt free ${meta.label} full mock tests online in real exam-pattern CBT. Sectional tests, topic tests and mains mocks — bilingual English/Hindi with solutions & analysis.`,
    alternates: { canonical: `https://studyvirus.com/bank/${meta.dir}` },
  };
}

export default async function BankExamPage({ params }: { params: { exam: string } }) {
  const meta = examByDir(params.exam);
  if (!meta) redirect("/bank"); // stray RN urls (/bank/mocks, /bank/signin, …) & typos

  const m = await loadBankManifest();
  const prelimsExam = m?.exams.find((e) => e.dir === meta.dir && (e.type || "prelims") === "prelims");
  const mainsExam = m?.exams.find((e) => e.type === "mains" && (e.dir === `${meta.dir}-mains` || e.dir === meta.dir));
  const sectionals = m?.sectionals.find((s) => s.dir === meta.dir)?.tracks || [];
  const tier = tierForDir(meta.dir);
  const topics = m?.topics.find((t) => t.tier === tier)?.tracks || [];

  const data = {
    meta,
    examTitle: prelimsExam?.exam || meta.label,
    prelims: prelimsExam?.papers || [],
    mains: mainsExam?.papers || [],
    mainsTarget: mainsExam?.target || 15,
    sectionals,
    topics,
  };

  return (
    <BankAuthProvider>
      <BankBar />
      <div className="mb-5">
        <a href="/bank" className="text-xs text-slate-400 hover:text-blue-600">← All bank exams</a>
        <h1 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
          {data.examTitle}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {data.prelims.length} full mocks · {data.prelims.filter((p) => p.free).length} free ·
          real exam pattern · bilingual
        </p>
      </div>
      <MockCards data={data} />
    </BankAuthProvider>
  );
}
