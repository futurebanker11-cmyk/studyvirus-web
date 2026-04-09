import { notFound } from "next/navigation";
import { fetchMocks } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

const examMap: Record<string, { name: string; examId: string }> = {
  "rrb-ntpc": { name: "RRB NTPC", examId: "rrb_ntpc" },
  "ssc-cgl": { name: "SSC CGL", examId: "ssc_cgl" },
  "ssc-gd": { name: "SSC GD", examId: "ssc_gd" },
  "delhi-police": { name: "Delhi Police", examId: "delhi_police" },
  "up-police": { name: "UP Police", examId: "up_police" },
  "bihar-police": { name: "Bihar Police", examId: "bihar_police" },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(examMap).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const exam = examMap[slug];
  if (!exam) return {};
  return {
    title: `${exam.name} Mock Tests - Free Full-Length GK Practice`,
    description: `Take free ${exam.name} GK mock tests. Full-length practice papers with instant answers and explanations.`,
    alternates: { canonical: `https://studyvirus.com/mock-tests/${slug}` },
  };
}

export default async function MockExamPage({ params }: Props) {
  const { slug } = await params;
  const exam = examMap[slug];
  if (!exam) notFound();

  const mocks = await fetchMocks(exam.examId);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Mock Tests", href: "/mock-tests" },
          { label: exam.name },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">{exam.name} Mock Tests</h1>
      <p className="text-slate-500 mb-6">{mocks.length} mock tests available</p>

      {mocks.length === 0 ? (
        <p className="text-slate-400 py-8 text-center">Mock tests coming soon. Check back later!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {mocks.map((m, i) => (
            <div
              key={m.id}
              className="bg-white rounded-xl p-5 border border-slate-100"
            >
              <h2 className="font-bold text-primary">Mock {i + 1}</h2>
              <p className="text-sm text-slate-400 mt-1">{m.en}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
