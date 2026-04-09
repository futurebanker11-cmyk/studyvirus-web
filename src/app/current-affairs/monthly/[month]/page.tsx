import { notFound } from "next/navigation";
import { fetchQuestionsBilingual } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuizClient from "@/components/QuizClient";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ month: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  const parts = month.split("_");
  if (parts.length !== 2) return {};
  const label = `${MONTHS[parseInt(parts[1])]} ${parts[0]}`;
  return {
    title: `Monthly Current Affairs ${label} - GK Capsule`,
    description: `${label} monthly current affairs capsule. Complete GK questions from the month with answers for competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/current-affairs/monthly/${month}` },
  };
}

export default async function MonthlyCAPage({ params }: Props) {
  const { month } = await params;
  const parts = month.split("_");
  if (parts.length !== 2) notFound();

  const label = `${MONTHS[parseInt(parts[1])]} ${parts[0]}`;

  const { en: questions, hi: questionsHi } = await fetchQuestionsBilingual(
    "0-Current Affairs/capsule",
    `${month}.json`
  );

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Current Affairs", href: "/current-affairs" },
          { label: `${label} Capsule` },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">Monthly Capsule</h1>
      <p className="text-slate-500 mb-6">{label} · {questions.length} questions</p>

      <AdSlot slot="inArticle1" />

      {questions.length > 0 ? (
        <QuizClient questions={questions} questionsHi={questionsHi} />
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📖</p>
          <p className="font-semibold">Monthly capsule coming soon</p>
        </div>
      )}

      <AdSlot slot="inArticle2" className="mt-6" />
    </>
  );
}
