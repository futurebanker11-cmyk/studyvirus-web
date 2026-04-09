import { notFound } from "next/navigation";
import { ENGLISH_SECTIONS, chapterSlugEn } from "@/lib/english";
import { fetchQuestionsBilingual } from "@/lib/api";
import { getSetCount, getSetQuestions, SET_SIZE } from "@/lib/topics";
import Breadcrumbs from "@/components/Breadcrumbs";
import QuizClient from "@/components/QuizClient";
import SetPills from "@/components/SetPills";
import NavButtons from "@/components/NavButtons";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ section: string; chapter: string; set: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

function parseSetNum(s: string): number {
  return parseInt(s.replace("set-", ""));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { section: sKey, chapter: chSlug, set: setParam } = await params;
  const setNum = parseSetNum(setParam);
  const sec = ENGLISH_SECTIONS.find(s => s.key === sKey);
  if (!sec) return {};
  const ch = sec.chapters.find(c => chapterSlugEn(c.en) === chSlug);
  if (!ch || isNaN(setNum)) return {};
  return {
    title: `${ch.en} Set ${setNum} - English Grammar Questions`,
    description: `Practice ${ch.en} Set ${setNum} for competitive exams. MCQs with detailed explanations.`,
    alternates: { canonical: `https://studyvirus.com/english/${sKey}/${chSlug}/set-${setNum}` },
  };
}

export default async function EnglishSetPage({ params }: Props) {
  const { section: sKey, chapter: chSlug, set: setParam } = await params;
  const setNum = parseSetNum(setParam);
  const sec = ENGLISH_SECTIONS.find(s => s.key === sKey);
  if (!sec || isNaN(setNum) || setNum < 1) notFound();

  const ch = sec.chapters.find(c => chapterSlugEn(c.en) === chSlug);
  if (!ch) notFound();

  const { en: allEn, hi: allHi } = await fetchQuestionsBilingual(sec.folder, ch.file);
  const totalSets = getSetCount(allEn.length);
  if (setNum > totalSets) notFound();

  const questions = getSetQuestions(allEn, setNum);
  const questionsHi = getSetQuestions(allHi, setNum);
  const baseUrl = `/english/${sKey}/${chSlug}`;

  // Nav
  const chIdx = sec.chapters.findIndex(c => chapterSlugEn(c.en) === chSlug);
  const nextCh = chIdx < sec.chapters.length - 1 ? sec.chapters[chIdx + 1] : null;

  const prevNav = setNum > 1 ? { href: `${baseUrl}/set-${setNum - 1}`, label: `Set ${setNum - 1}` } : null;
  let nextNav = null;
  if (setNum < totalSets) {
    nextNav = { href: `${baseUrl}/set-${setNum + 1}`, label: `Set ${setNum + 1}` };
  } else if (nextCh) {
    nextNav = { href: `/english/${sKey}/${chapterSlugEn(nextCh.en)}`, label: nextCh.en };
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "English", href: "/english" },
          { label: sec.en.name },
          { label: ch.en, href: baseUrl },
          { label: `Set ${setNum}` },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">{ch.en} — Set {setNum}</h1>
      <p className="text-slate-500 mb-4">Questions {(setNum - 1) * SET_SIZE + 1}–{Math.min(setNum * SET_SIZE, allEn.length)} of {allEn.length}</p>

      <SetPills baseUrl={baseUrl} totalSets={totalSets} currentSet={setNum} />
      <QuizClient questions={questions} questionsHi={questionsHi} />
      <NavButtons prev={prevNav} next={nextNav} />
    </>
  );
}
