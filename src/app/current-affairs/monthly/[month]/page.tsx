import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuizClient from "@/components/QuizClient";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";
import { Question } from "@/lib/types";

interface Props {
  params: Promise<{ month: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

const MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const BASE_URL = "https://gkquestionsguru.com/gk-data";

interface CapsuleData {
  items?: { text: string; category?: string }[];
  en?: Question[];
  hi?: Question[];
}

async function fetchCapsule(month: string): Promise<CapsuleData> {
  try {
    const res = await fetch(
      `${BASE_URL}/0-Current%20Affairs/capsule/${encodeURIComponent(month)}.json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { month } = await params;
  const parts = month.split("_");
  if (parts.length !== 2) return {};
  const label = `${MONTHS[parseInt(parts[1])]} ${parts[0]}`;
  return {
    title: `Monthly Current Affairs ${label} - GK Capsule`,
    description: `${label} monthly current affairs capsule. Complete GK questions and key facts from the month with answers for competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/current-affairs/monthly/${month}` },
  };
}

const CATEGORY_COLORS: Record<string, string> = {
  Government: "bg-blue-100 text-blue-700",
  Defence: "bg-red-100 text-red-700",
  Economy: "bg-green-100 text-green-700",
  Technology: "bg-purple-100 text-purple-700",
  International: "bg-orange-100 text-orange-700",
  Environment: "bg-teal-100 text-teal-700",
  Science: "bg-indigo-100 text-indigo-700",
  Sports: "bg-yellow-100 text-yellow-700",
  Awards: "bg-pink-100 text-pink-700",
  Politics: "bg-slate-100 text-slate-700",
};

export default async function MonthlyCAPage({ params }: Props) {
  const { month } = await params;
  const parts = month.split("_");
  if (parts.length !== 2) notFound();

  const label = `${MONTHS[parseInt(parts[1])]} ${parts[0]}`;
  const capsule = await fetchCapsule(month);

  const items = capsule.items || [];
  const questions: Question[] = capsule.en || [];
  const questionsHi: Question[] = capsule.hi || [];

  // QAPage schema for MCQ questions
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
          { label: `${label} Capsule` },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">{label} Current Affairs</h1>
      <p className="text-slate-500 mb-6">Monthly GK Capsule · {items.length} facts · {questions.length} MCQs</p>

      <AdSlot slot="inArticle1" />

      {/* One-liners section */}
      {items.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center text-white text-sm">📌</span>
            Key Facts & One-Liners
          </h2>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-100 p-4 flex gap-3 shadow-sm">
                <span className="w-6 h-6 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-relaxed">{item.text}</p>
                  {item.category && (
                    <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || "bg-slate-100 text-slate-600"}`}>
                      {item.category}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdSlot slot="inArticle2" className="mb-6" />

      {/* MCQ Practice section */}
      {questions.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
            <span className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-sm">✏️</span>
            Practice MCQs
          </h2>
          <QuizClient questions={questions} questionsHi={questionsHi} />
        </section>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📖</p>
          <p className="font-semibold">Monthly capsule coming soon</p>
        </div>
      ) : null}
    </>
  );
}
