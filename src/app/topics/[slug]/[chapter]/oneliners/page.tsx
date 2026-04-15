import { notFound, redirect } from "next/navigation";
import { getTopicBySlug, chapterSlug } from "@/lib/topics";
import { fetchOneLiners } from "@/lib/api";
import Breadcrumbs from "@/components/Breadcrumbs";
import StudyTabs from "@/components/StudyTabs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; chapter: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, chapter: chSlug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  const ch = topic.chapters.find(c => chapterSlug(c.en) === chSlug);
  if (!ch) return {};
  return {
    title: `${ch.en} One-Liners - ${topic.en.name} Quick Facts`,
    description: `${ch.en} one-liners and quick facts from ${topic.en.name}. Rapid revision for SSC, Railway, UPSC & competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/topics/${slug}/${chSlug}/oneliners` },
  };
}

export default async function OneLinersPage({ params }: Props) {
  const { slug, chapter: chSlug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const ch = topic.chapters.find(c => chapterSlug(c.en) === chSlug);
  if (!ch) notFound();

  const oneliners = await fetchOneLiners(topic.folder, ch.file);

  if (!oneliners || oneliners.length === 0) {
    redirect(`/topics/${slug}/${chSlug}`);
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Topics", href: "/topics" },
          { label: topic.en.name, href: `/topics/${slug}` },
          { label: ch.en, href: `/topics/${slug}/${chSlug}` },
          { label: "One-Liners" },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">{ch.en}</h1>
      <p className="text-slate-500 text-sm mb-2">{topic.en.name} · {ch.hi} · {oneliners.length} facts</p>

      <StudyTabs baseUrl={`/topics/${slug}/${chSlug}`} active="oneliners" />

      <AdSlot slot="inArticle1" />

      {oneliners.length > 0 ? (
        <div className="space-y-2">
          {oneliners.map((fact, i) => (
            <div key={i}>
              <div className={`flex gap-3 rounded-xl p-4 border-l-4 ${
                i % 2 === 0
                  ? 'bg-white border-l-accent'
                  : 'bg-slate-50 border-l-emerald-500'
              }`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                  i % 2 === 0 ? 'bg-accent' : 'bg-emerald-500'
                }`}>{i + 1}</span>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {typeof fact === 'string' ? fact : (fact as { en?: string; hi?: string }).en || JSON.stringify(fact)}
                </p>
              </div>
              {i === 9 && <AdSlot slot="inArticle2" />}
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
