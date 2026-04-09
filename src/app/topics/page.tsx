import Link from "next/link";
import { getVisibleTopics, topicSlug } from "@/lib/topics";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All GK Topics - 35+ Subjects for Competitive Exams",
  description:
    "Browse 35+ GK topics: History, Polity, Geography, Economics, Science, Computer, Current Affairs & more. Free questions with answers for all exams.",
  alternates: { canonical: "https://studyvirus.com/topics" },
};

export default function TopicsPage() {
  const topics = getVisibleTopics();

  const categories = [
    { label: "Core Subjects", keys: ["history", "polity", "geography", "economics", "banking"] },
    { label: "Science", keys: ["physics", "chemistry", "biology"] },
    { label: "General Knowledge", keys: ["sports", "abbreviations", "arts", "inventions", "famous_people", "days_years", "books_authors", "awards", "world_org", "famous_places"] },
    { label: "Specialized", keys: ["technology", "railways", "environment", "computer", "police_gk", "defence_gk", "govt_schemes", "constitution_special", "agriculture", "national_movement", "international_relations", "disaster_mgmt"] },
    { label: "State GK", keys: ["bihar_gk", "up_gk", "rajasthan_gk", "mp_gk", "maharashtra_gk", "gujarat_gk", "haryana_gk", "jharkhand_gk"] },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Topics" }]} />
      <h1 className="text-3xl font-black text-primary mb-2">All GK Topics</h1>
      <p className="text-slate-500 mb-8">
        {topics.length} topics covering every subject asked in competitive exams
      </p>

      {categories.map((cat, catIdx) => {
        const catTopics = cat.keys
          .map((k) => topics.find((t) => t.key === k))
          .filter(Boolean);
        if (!catTopics.length) return null;

        return (
          <section key={cat.label} className={catIdx % 2 === 1 ? "mb-10 bg-white rounded-2xl p-5" : "mb-10"}>
            {catIdx === 2 && <AdSlot slot="inArticle1" />}
            {catIdx === 4 && <AdSlot slot="inArticle2" />}
            <h2 className="text-lg font-bold text-primary mb-4 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-accent"></span>
              {cat.label}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {catTopics.map((t) => t && (
                <Link
                  key={t.key}
                  href={`/topics/${topicSlug(t.key)}`}
                  className="bg-white rounded-2xl p-4 border border-slate-100 hover:shadow-md hover:border-blue-200 transition group"
                >
                  <span className="text-3xl block mb-2">{t.emoji}</span>
                  <h3 className="font-bold text-sm text-primary group-hover:text-accent transition">
                    {t.en.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{t.chapters.length} chapters</p>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
