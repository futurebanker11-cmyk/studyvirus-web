import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mock Tests - Free Full-Length Practice Tests for All Exams",
  description:
    "Take free mock tests for SSC, Railway, UPSC, Police & State exams. Full-length practice papers with instant results.",
  alternates: { canonical: "https://studyvirus.com/mock-tests" },
};

const examMocks = [
  { slug: "rrb-ntpc", name: "RRB NTPC", examId: "rrb_ntpc" },
  { slug: "ssc-cgl", name: "SSC CGL", examId: "ssc_cgl" },
  { slug: "ssc-gd", name: "SSC GD", examId: "ssc_gd" },
  { slug: "delhi-police", name: "Delhi Police", examId: "delhi_police" },
  { slug: "up-police", name: "UP Police", examId: "up_police" },
  { slug: "bihar-police", name: "Bihar Police", examId: "bihar_police" },
];

export default function MockTestsPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Mock Tests" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">Mock Tests</h1>
      <p className="text-slate-500 mb-8">Full-length practice tests for popular exams</p>

      <AdSlot slot="inArticle1" />

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {examMocks.map((m) => (
          <Link
            key={m.slug}
            href={`/mock-tests/${m.slug}`}
            className="bg-white rounded-2xl p-6 border border-slate-100 hover:shadow-md hover:border-blue-200 transition"
          >
            <h2 className="font-bold text-lg text-primary">{m.name} Mocks</h2>
            <p className="text-sm text-slate-400 mt-2">Full-length GK mock tests</p>
          </Link>
        ))}
      </div>
    </>
  );
}
