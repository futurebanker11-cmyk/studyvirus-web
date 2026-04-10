import { notFound } from "next/navigation";
import { fetchQuestionsBilingual } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuizClient from "@/components/QuizClient";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ date: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  const parts = date.split("_");
  if (parts.length !== 3) return {};
  const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const label = `${parseInt(parts[2])} ${months[parseInt(parts[1])]} ${parts[0]}`;
  return {
    title: `Daily Current Affairs ${label} - GK Questions`,
    description: `Practice current affairs GK questions for ${label}. MCQs from latest news with answers for competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/current-affairs/daily/${date}` },
  };
}

export default async function DailyCAPage({ params }: Props) {
  const { date } = await params;
  const parts = date.split("_");
  if (parts.length !== 3) notFound();

  const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const label = `${parseInt(parts[2])} ${months[parseInt(parts[1])]} ${parts[0]}`;

  const { en: questions, hi: questionsHi } = await fetchQuestionsBilingual(
    "0-Current Affairs/daily",
    `${date}.json`
  );

  // QAPage schema for daily CA questions
  const qaJsonLd = questions.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "QAPage",
    mainEntity: questions.slice(0, 10).map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${q.options[q.answer.charCodeAt(0) - 65] || q.answer}. ${q.explain || ""}`,
      },
    })),
  } : null;

  return (
    <>
      {qaJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(qaJsonLd) }} />
      )}
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Current Affairs", href: "/current-affairs" },
          { label: label },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">Daily Current Affairs</h1>
      <p className="text-slate-500 mb-6">{label} · {questions.length} questions</p>

      <AdSlot slot="inArticle1" />

      {questions.length > 0 ? (
        <QuizClient questions={questions} questionsHi={questionsHi} />
      ) : (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📰</p>
          <p className="font-semibold">No questions available for this date yet</p>
        </div>
      )}

      <AdSlot slot="inArticle2" className="mt-6" />
    </>
  );
}
