import Link from "next/link";
import { notFound } from "next/navigation";
import { PYQ_EXAMS, getPYQBySlug } from "@/lib/pyq";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ exam: string }>;
}

export function generateStaticParams() {
  return PYQ_EXAMS.map((e) => ({ exam: e.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam: slug } = await params;
  const exam = getPYQBySlug(slug);
  if (!exam) return {};
  return {
    title: `${exam.en} Previous Year Papers - ${exam.sets} Practice Sets`,
    description: `Practice ${exam.en} previous year GK questions. ${exam.sets} sets with 40 questions each. Detailed answers and explanations.`,
    alternates: { canonical: `https://studyvirus.com/pyq/${slug}` },
  };
}

export default async function PYQExamPage({ params }: Props) {
  const { exam: slug } = await params;
  const exam = getPYQBySlug(slug);
  if (!exam) notFound();

  const sets = Array.from({ length: exam.sets }, (_, i) => i + 1);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "PYQ Papers", href: "/pyq" },
          { label: exam.en },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">{exam.en} Previous Year Papers</h1>
      <p className="text-slate-500 mb-6">{exam.sets} practice sets &middot; 40 questions each</p>

      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
        {sets.map((n) => (
          <div key={n}>
            <Link
              href={`/pyq/${exam.slug}/set-${n}`}
              className="flex flex-col items-center justify-center bg-white rounded-xl p-3 border-2 border-slate-100 hover:border-blue-500 hover:shadow-lg transition-all group card-hover"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-sm mb-1.5 group-hover:scale-110 transition-transform">
                {n}
              </div>
              <span className="text-xs font-semibold text-primary">Set {n}</span>
              <span className="text-[10px] text-slate-400">40 Qs</span>
            </Link>
            {n === 10 && <AdSlot slot="inArticle1" />}
            {n === 20 && <AdSlot slot="inArticle2" />}
          </div>
        ))}
      </div>
    </>
  );
}
