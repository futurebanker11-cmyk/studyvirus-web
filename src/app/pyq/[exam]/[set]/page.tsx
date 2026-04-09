import { notFound } from "next/navigation";
import { PYQ_EXAMS, getPYQBySlug } from "@/lib/pyq";
import { fetchPYQBilingual } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuizClient from "@/components/QuizClient";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ exam: string; set: string }>;
}

export function generateStaticParams() {
  const params: { exam: string; set: string }[] = [];
  for (const e of PYQ_EXAMS) {
    for (let i = 1; i <= e.sets; i++) {
      params.push({ exam: e.slug, set: `set-${i}` });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { exam: slug, set: setParam } = await params;
  const exam = getPYQBySlug(slug);
  const setNum = parseInt(setParam.replace("set-", ""));
  if (!exam || isNaN(setNum)) return {};
  return {
    title: `${exam.en} PYQ Set ${setNum} - 40 Questions with Answers`,
    description: `Practice ${exam.en} previous year questions Set ${setNum}. 40 MCQs with detailed explanations for exam preparation.`,
    alternates: { canonical: `https://studyvirus.com/pyq/${slug}/${setParam}` },
  };
}

export default async function PYQSetPage({ params }: Props) {
  const { exam: slug, set: setParam } = await params;
  const exam = getPYQBySlug(slug);
  const setNum = parseInt(setParam.replace("set-", ""));
  if (!exam || isNaN(setNum) || setNum < 1 || setNum > exam.sets) notFound();

  const paddedNum = String(setNum).padStart(2, "0");
  const file = `${exam.prefix}${paddedNum}.json`;
  const { en: questions, hi: questionsHi } = await fetchPYQBilingual(file);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.slice(0, 5).map((q) => ({
      "@type": "Question",
      name: q.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: `${q.options[q.answer.charCodeAt(0) - 65] || q.answer}. ${q.explain || ""}`,
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "PYQ Papers", href: "/pyq" },
          { label: exam.en, href: `/pyq/${exam.slug}` },
          { label: `Set ${setNum}` },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-1">
        {exam.en} — Set {setNum}
      </h1>
      <p className="text-slate-500 mb-6">{questions.length} questions</p>

      <QuizClient questions={questions} questionsHi={questionsHi} />
    </>
  );
}
