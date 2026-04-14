import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact StudyVirus - Questions, Feedback & Corrections",
  description:
    "Contact the StudyVirus team. Report content errors, request new topics, ask questions, or send feedback. We respond to every message.",
  alternates: { canonical: "https://studyvirus.com/contact" },
};

const CONTACT_EMAIL = "contact@studyvirus.com";

export default function ContactPage() {
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact StudyVirus",
    url: "https://studyvirus.com/contact",
    mainEntity: {
      "@type": "Organization",
      name: "StudyVirus",
      url: "https://studyvirus.com",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT_EMAIL,
          availableLanguage: ["English", "Hindi"],
          areaServed: "IN",
        },
      ],
    },
  };

  return (
    <div className="max-w-2xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactSchema) }}
      />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Contact" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">Contact Us</h1>
      <p className="text-slate-500 mb-8">
        Have a question, spotted an error, or want to suggest a topic? Send us a message
        and we will get back to you.
      </p>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">Email Us</h2>
        <p className="text-slate-700 mb-3">
          The fastest way to reach us is by email. We read every message and usually
          reply within one or two days.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="inline-block bg-accent text-white px-5 py-3 rounded-full font-bold hover:bg-blue-700 transition"
        >
          {CONTACT_EMAIL}
        </a>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h2 className="text-xl font-bold text-primary mb-4">What You Can Write About</h2>
        <ul className="space-y-3 text-slate-700">
          <li>
            <strong className="text-primary">Report an error</strong>
            <p className="text-sm text-slate-500">
              If a question, answer, or explanation is wrong, tell us which topic and
              set number. We usually fix errors within a day.
            </p>
          </li>
          <li>
            <strong className="text-primary">Suggest a topic or exam</strong>
            <p className="text-sm text-slate-500">
              Preparing for an exam we do not cover yet? Let us know and we will add it
              to the roadmap.
            </p>
          </li>
          <li>
            <strong className="text-primary">Content requests</strong>
            <p className="text-sm text-slate-500">
              Want specific notes, one-liners, or mock tests? Tell us what would help
              your preparation.
            </p>
          </li>
          <li>
            <strong className="text-primary">DMCA or copyright</strong>
            <p className="text-sm text-slate-500">
              Believe some content infringes your rights? Email us with the details and
              we will respond promptly.
            </p>
          </li>
          <li>
            <strong className="text-primary">Partnerships &amp; advertising</strong>
            <p className="text-sm text-slate-500">
              For business inquiries, write to the same email with &quot;Partnership&quot; in
              the subject line.
            </p>
          </li>
        </ul>
      </section>

      <section className="bg-white rounded-2xl p-6 border border-slate-100">
        <h2 className="text-xl font-bold text-primary mb-3">Download the App</h2>
        <p className="text-slate-700 mb-4">
          You can also get the StudyVirus app on Google Play for offline practice,
          flashcards, battles, and more features than the web version.
        </p>
        <a
          href="https://play.google.com/store/apps/details?id=com.gkpkhindi.studyvirus"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-full font-bold hover:opacity-90 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
          </svg>
          Get on Google Play
        </a>
      </section>
    </div>
  );
}
