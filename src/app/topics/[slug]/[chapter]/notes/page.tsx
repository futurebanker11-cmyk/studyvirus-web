import { notFound, redirect } from "next/navigation";
import { getTopicBySlug, chapterSlug } from "@/lib/topics";
import { fetchNotes } from "@/lib/api";
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
    title: `${ch.en} Notes - ${topic.en.name} Study Material`,
    description: `Read ${ch.en} notes from ${topic.en.name}. Free study material for SSC, Railway, UPSC & competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/topics/${slug}/${chSlug}/notes` },
  };
}

function t(field: unknown): string {
  if (!field) return '';
  if (typeof field === 'string') return field;
  if (typeof field === 'object' && field !== null && 'en' in field) return String((field as Record<string, string>).en);
  return '';
}

function tArr(field: unknown): string[] {
  if (!field) return [];
  if (typeof field === 'object' && field !== null && 'en' in field) {
    const en = (field as Record<string, unknown>).en;
    return Array.isArray(en) ? en.map(String) : [];
  }
  if (Array.isArray(field)) return field.map(String);
  return [];
}

export default async function NotesPage({ params }: Props) {
  const { slug, chapter: chSlug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();
  const ch = topic.chapters.find(c => chapterSlug(c.en) === chSlug);
  if (!ch) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notes: any = await fetchNotes(topic.folder, ch.file);

  if (!notes || !notes.sections) {
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
          { label: "Notes" },
        ]}
      />
      <h1 className="text-2xl md:text-3xl font-black text-primary mb-1">{ch.en}</h1>
      <p className="text-slate-500 text-sm mb-2">{topic.en.name} · {ch.hi}</p>

      <StudyTabs baseUrl={`/topics/${slug}/${chSlug}`} active="notes" />

      <AdSlot slot="inArticle1" />

      {/* Render sections */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {notes.sections.map((sec: any, sIdx: number) => (
        <section key={sec.sectionId || sIdx} className="mb-8">
          {sec.title && (
            <h2 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
              {sec.type === 'overview' && '📋'}
              {sec.type === 'core_content' && '📖'}
              {sec.type === 'exam_tips' && '🎯'}
              {sec.type === 'summary' && '📌'}
              {!['overview','core_content','exam_tips','summary'].includes(sec.type) && '📝'}
              {t(sec.title)}
            </h2>
          )}

          {/* Render blocks */}
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {sec.blocks?.map((block: any, bIdx: number) => {
            if (block.blockType === 'paragraph') {
              return (
                <p key={bIdx} className="text-slate-700 leading-relaxed mb-3">{t(block.content)}</p>
              );
            }

            if (block.blockType === 'keyFact') {
              return (
                <div key={bIdx} className="flex gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-2">
                  <span className="text-amber-500 shrink-0">⭐</span>
                  <p className="text-slate-700 text-sm">{t(block.content)}</p>
                </div>
              );
            }

            if (block.blockType === 'table') {
              const headers = tArr(block.headers);
              return (
                <div key={bIdx} className="overflow-x-auto mb-4">
                  <table className="w-full text-sm border-collapse bg-white rounded-lg overflow-hidden">
                    {headers.length > 0 && (
                      <thead>
                        <tr className="bg-primary text-white">
                          {headers.map((h, hi) => (
                            <th key={hi} className="p-2.5 text-left font-semibold text-xs">{h}</th>
                          ))}
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {block.rows?.map((row: any, ri: number) => {
                        const cells = tArr(row);
                        return (
                          <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                            {cells.map((cell, ci) => (
                              <td key={ci} className="p-2.5 text-slate-700 border-t border-slate-100 text-xs">{cell}</td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            }

            if (block.blockType === 'list' || block.blockType === 'bullets') {
              return (
                <ul key={bIdx} className="space-y-1.5 mb-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {(block.items || block.content || []).map((item: any, j: number) => (
                    <li key={j} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-accent shrink-0">•</span>
                      {t(item)}
                    </li>
                  ))}
                </ul>
              );
            }

            // Fallback: render content as text
            if (block.content) {
              return <p key={bIdx} className="text-slate-700 text-sm mb-2">{t(block.content)}</p>;
            }

            return null;
          })}

          {sIdx === 2 && <AdSlot slot="inArticle2" />}
        </section>
      ))}
    </>
  );
}
