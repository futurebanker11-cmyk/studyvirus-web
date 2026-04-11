import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | StudyVirus",
  description:
    "StudyVirus terms of service. Read our terms, disclaimers, intellectual property policy, and user conduct rules before using the site.",
  alternates: { canonical: "https://studyvirus.com/terms" },
};

export default function TermsPage() {
  const lastUpdated = "April 11, 2026";

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Terms of Service" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {lastUpdated}</p>

      <article className="prose prose-slate max-w-none text-slate-700">
        <p>
          Welcome to StudyVirus. By accessing or using studyvirus.com and the StudyVirus
          mobile application (the &quot;Service&quot;), you agree to these Terms of
          Service. Please read them carefully.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Use of the Service</h2>
        <p>
          StudyVirus provides free study material, practice questions, mock tests, and
          previous year papers for Indian competitive exams. You may use the Service for
          personal, non-commercial study purposes. You agree not to:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Copy, redistribute, or resell our content without permission.</li>
          <li>Use automated tools to scrape or download the content.</li>
          <li>Interfere with the normal operation of the Service.</li>
          <li>Use the Service for any unlawful purpose.</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Accuracy of Content</h2>
        <p>
          We make every effort to ensure questions, answers, and explanations are accurate
          and up to date. However, competitive exam syllabi and answer keys can change,
          and errors may occur. StudyVirus is an independent study platform and is not
          affiliated with SSC, Railway Recruitment Boards, UPSC, or any other official
          examination body. Always verify important information with the official exam
          notification.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Intellectual Property</h2>
        <p>
          All content on StudyVirus, including question text, explanations, notes, and
          study material, is either original work or compiled from publicly available
          sources for educational use. The StudyVirus name, logo, and design are owned by
          us. You may share individual questions or links for personal study, but mass
          reproduction requires written permission.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Third-Party Links &amp; Ads</h2>
        <p>
          The Service displays advertisements through Google AdSense and may contain links
          to third-party websites. We are not responsible for the content, accuracy, or
          practices of any third-party site. Clicking on any third-party link is at your
          own risk.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Disclaimer</h2>
        <p>
          The Service is provided &quot;as is&quot; without warranties of any kind. We do
          not guarantee that using StudyVirus will result in exam success. Exam preparation
          is your responsibility, and StudyVirus is one of many resources you should use.
          We disclaim liability for any loss arising from the use of the Service.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, StudyVirus shall not be liable for any
          indirect, incidental, special, or consequential damages arising from your use of
          the Service. Your sole remedy for dissatisfaction with the Service is to stop
          using it.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Changes to the Terms</h2>
        <p>
          We may update these Terms from time to time. When we do, we will revise the
          &quot;Last updated&quot; date above. Continued use of the Service after any
          change constitutes acceptance of the updated Terms.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Governing Law</h2>
        <p>
          These Terms are governed by the laws of India. Any disputes arising from the use
          of the Service shall be subject to the exclusive jurisdiction of Indian courts.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Contact</h2>
        <p>
          For questions about these Terms, please use our{" "}
          <a href="/contact" className="text-accent hover:underline">Contact page</a>.
        </p>
      </article>
    </div>
  );
}
