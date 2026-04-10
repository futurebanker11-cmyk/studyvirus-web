import Link from "next/link";
import { notFound } from "next/navigation";
import { getTopicBySlug, topicSlug, chapterSlug, getVisibleTopics, getAdjacentTopics } from "@/lib/topics";
import Breadcrumbs from "@/components/Breadcrumbs";
import NavButtons from "@/components/NavButtons";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getVisibleTopics().map((t) => ({ slug: topicSlug(t.key) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: `${topic.en.name} - ${topic.chapters.length} Chapters with Questions & Answers`,
    description: `Practice ${topic.en.name} GK questions: ${topic.chapters.slice(0, 5).map((c) => c.en).join(", ")} & more. Free MCQs with explanations for competitive exams.`,
    alternates: { canonical: `https://studyvirus.com/topics/${slug}` },
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  // Adjacent topic navigation
  const { prev: prevTopic, next: nextTopic } = getAdjacentTopics(topic.key);
  const prevNav = prevTopic
    ? { href: `/topics/${topicSlug(prevTopic.key)}`, label: `${prevTopic.emoji} ${prevTopic.en.name}` }
    : null;
  const nextNav = nextTopic
    ? { href: `/topics/${topicSlug(nextTopic.key)}`, label: `${nextTopic.emoji} ${nextTopic.en.name}` }
    : null;

  // FAQ schema for topic hub pages
  const faqItems = [
    {
      q: `How many chapters are there in ${topic.en.name}?`,
      a: `${topic.en.name} has ${topic.chapters.length} chapters covering ${topic.chapters.slice(0, 4).map(c => c.en).join(", ")} and more.`,
    },
    {
      q: `Is ${topic.en.name} important for competitive exams?`,
      a: `Yes, ${topic.en.name} is an important subject for SSC, Railway, UPSC, Police and State exams. Questions from this topic regularly appear in GK sections.`,
    },
    {
      q: `How can I practice ${topic.en.name} questions on StudyVirus?`,
      a: `You can practice ${topic.en.name} questions chapter-wise. Each chapter has multiple sets of 10 MCQ questions with detailed explanations in Hindi and English.`,
    },
  ];

  return (
    <>
      {/* FAQ structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqItems.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Topics", href: "/topics" },
          { label: topic.en.name },
        ]}
      />
      <div className="flex items-center gap-3 mb-2">
        <span className="text-4xl">{topic.emoji}</span>
        <div>
          <h1 className="text-3xl font-black text-primary">{topic.en.name}</h1>
          <p className="text-slate-500">{topic.hi.name} · {topic.en.desc}</p>
        </div>
      </div>
      <p className="text-sm text-slate-400 mb-6">{topic.chapters.length} chapters</p>

      <div className="space-y-3">
        {topic.chapters.map((ch, i) => (
          <div key={ch.file}>
            <Link
              href={`/topics/${slug}/${chapterSlug(ch.en)}`}
              className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition-all group card-hover"
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: topic.accent }}
              >
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-primary group-hover:text-accent transition truncate">
                  {ch.en}
                </h2>
                <p className="text-xs text-slate-400">{ch.hi}</p>
              </div>
              <svg className="w-5 h-5 text-slate-300 group-hover:text-accent transition shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {i === 4 && <AdSlot slot="inArticle1" />}
            {i === 12 && <AdSlot slot="inArticle2" />}
          </div>
        ))}
      </div>

      <NavButtons prev={prevNav} next={nextNav} />
    </>
  );
}
