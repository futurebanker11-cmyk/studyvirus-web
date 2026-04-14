import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About StudyVirus - Our Mission & Story",
  description:
    "StudyVirus is India's largest free GK question bank for SSC, Railway, UPSC, Police & State exams. Learn about our mission, content team, and how we help students.",
  alternates: { canonical: "https://studyvirus.com/about" },
};

export default function AboutPage() {
  const aboutSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About StudyVirus",
    url: "https://studyvirus.com/about",
    mainEntity: {
      "@type": "Organization",
      name: "StudyVirus",
      url: "https://studyvirus.com",
      logo: "https://studyvirus.com/og-image.png",
      description:
        "India's largest free GK question bank for competitive exam preparation, covering 200,000+ questions across 35+ topics in English and Hindi.",
      foundingDate: "2023",
      sameAs: [
        "https://play.google.com/store/apps/details?id=com.gkpkhindi.studyvirus",
      ],
      knowsLanguage: ["en", "hi"],
      areaServed: { "@type": "Country", name: "India" },
    },
  };

  return (
    <div className="max-w-3xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "About" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-6">About StudyVirus</h1>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-3">Our Mission</h2>
        <p className="text-slate-700 leading-relaxed">
          StudyVirus exists to make quality exam preparation free for every Indian
          student. Coaching is expensive, good study material is scattered, and many
          aspirants in small towns simply cannot afford paid platforms. We built
          StudyVirus to close that gap — one question bank, one app, zero cost, in both
          English and Hindi.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-3">What We Offer</h2>
        <ul className="space-y-2 text-slate-700">
          <li>
            <strong className="text-primary">200,000+ GK questions</strong> across 35+
            topics — history, polity, geography, economics, science, current affairs,
            and more.
          </li>
          <li>
            <strong className="text-primary">Previous year papers</strong> for 13 major
            exams including SSC CGL, SSC CHSL, SSC GD, RRB NTPC, RRB Group D, Delhi
            Police, UP Police, NDA and others.
          </li>
          <li>
            <strong className="text-primary">Mock tests</strong> designed to match the
            actual exam pattern, with instant scoring and detailed answer keys.
          </li>
          <li>
            <strong className="text-primary">Daily current affairs</strong> quizzes and
            monthly capsules drawn from the latest news.
          </li>
          <li>
            <strong className="text-primary">Study notes and one-liners</strong> in
            Hindi and English for quick revision.
          </li>
          <li>
            <strong className="text-primary">English grammar practice</strong> covering
            basic and advanced topics for competitive exams.
          </li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-3">How Content Is Built</h2>
        <p className="text-slate-700 leading-relaxed mb-3">
          Our question bank is curated by a team of educators who have personally
          cleared or prepared students for Indian competitive exams. Every question
          includes a detailed explanation — not just the right answer but the reasoning
          behind it, sourced from standard textbooks and official exam papers.
        </p>
        <p className="text-slate-700 leading-relaxed">
          We cross-check every set against recent exam patterns and update content
          regularly based on syllabus changes. If you spot an error, we fix it — usually
          within a day — through the{" "}
          <Link href="/contact" className="text-accent hover:underline">contact page</Link>.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-3">Why It&apos;s Free</h2>
        <p className="text-slate-700 leading-relaxed">
          StudyVirus is supported by Google AdSense advertising, which lets us keep
          every question, every mock test, and every PYQ paper completely free. We will
          never ask for a subscription, and we will never lock content behind a
          paywall. Advertisements help us cover hosting and content creation costs so
          the Service stays open to every student.
        </p>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-3">By the Numbers</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-black text-accent">200K+</p>
            <p className="text-xs text-slate-500">Questions</p>
          </div>
          <div>
            <p className="text-2xl font-black text-accent">35+</p>
            <p className="text-xs text-slate-500">Topics</p>
          </div>
          <div>
            <p className="text-2xl font-black text-accent">13</p>
            <p className="text-xs text-slate-500">Exams with PYQ</p>
          </div>
          <div>
            <p className="text-2xl font-black text-accent">10 Lakh+</p>
            <p className="text-xs text-slate-500">Students</p>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-primary mb-3">Get in Touch</h2>
        <p className="text-slate-700 leading-relaxed">
          Found an error, want to suggest a topic, or have feedback? We read every
          message. Use the{" "}
          <Link href="/contact" className="text-accent hover:underline">contact page</Link>{" "}
          to reach us directly.
        </p>
      </section>
    </div>
  );
}
