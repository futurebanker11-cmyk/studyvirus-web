import { notFound } from "next/navigation";
import { getTopicBySlug, chapterSlug, getSetCount, getSetQuestions, SET_SIZE, getAdjacentChapters } from "@/lib/topics";
import { fetchQuestionsBilingual } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuizClient from "@/components/QuizClient";
import SetPills from "@/components/SetPills";
import NavButtons from "@/components/NavButtons";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; chapter: string; set: string }>;
}

// We can't generate all set params statically since we don't know question counts at build time
// Use dynamic rendering with ISR
export const dynamicParams = true;
export const revalidate = 3600;

function parseSetNum(setParam: string): number {
  return parseInt(setParam.replace("set-", ""));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter: chapterParam, set: setParam } = await params;
  const setNum = parseSetNum(setParam);
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  const ch = topic.chapters.find((c) => chapterSlug(c.en) === chapterParam);
  if (!ch || isNaN(setNum)) return {};
  return {
    title: `${ch.en} Set ${setNum} - ${topic.en.name} GK Questions`,
    description: `Practice ${SET_SIZE} ${ch.en} MCQ questions (Set ${setNum}) from ${topic.en.name}. With answers and explanations in Hindi & English for RRB NTPC, SSC CGL, UPSC, Police & all competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/topics/${slug}/${chapterParam}/set-${setNum}` },
  };
}

export default async function SetPage({ params }: Props) {
  const { slug, chapter: chapterParam, set: setParam } = await params;
  const setNum = parseSetNum(setParam);
  const topic = getTopicBySlug(slug);
  if (!topic || isNaN(setNum) || setNum < 1) notFound();

  const ch = topic.chapters.find((c) => chapterSlug(c.en) === chapterParam);
  if (!ch) notFound();

  const { en: allEn, hi: allHi } = await fetchQuestionsBilingual(topic.folder, ch.file);
  const totalSets = getSetCount(allEn.length);
  if (setNum > totalSets) notFound();

  const questions = getSetQuestions(allEn, setNum);
  const questionsHi = getSetQuestions(allHi, setNum);

  const baseUrl = `/topics/${slug}/${chapterParam}`;
  const { next: nextChapter } = getAdjacentChapters(topic, ch.en);

  // Build navigation
  const prevNav = setNum > 1
    ? { href: `${baseUrl}/set-${setNum - 1}`, label: `Set ${setNum - 1}` }
    : null;

  let nextNav = null;
  if (setNum < totalSets) {
    nextNav = { href: `${baseUrl}/set-${setNum + 1}`, label: `Set ${setNum + 1}` };
  } else if (nextChapter) {
    nextNav = {
      href: `/topics/${slug}/${chapterSlug(nextChapter.en)}`,
      label: `${nextChapter.en}`,
    };
  }

  // QAPage schema for all sets (SEO)
  const qaJsonLd = {
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
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(qaJsonLd) }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Topics", href: "/topics" },
          { label: topic.en.name, href: `/topics/${slug}` },
          { label: ch.en, href: baseUrl },
          { label: `Set ${setNum}` },
        ]}
      />

      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">
        {ch.en} — Set {setNum}
      </h1>
      <p className="text-slate-500 mb-4">
        {topic.en.name} · {ch.hi} · Questions {(setNum - 1) * SET_SIZE + 1}–{Math.min(setNum * SET_SIZE, allEn.length)} of {allEn.length}
      </p>

      <SetPills baseUrl={baseUrl} totalSets={totalSets} currentSet={setNum} />

      <QuizClient questions={questions} questionsHi={questionsHi} />

      <NavButtons prev={prevNav} next={nextNav} />
    </>
  );
}
