import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | StudyVirus",
  description:
    "StudyVirus privacy policy explaining what data we collect, how we use it, cookies, Google AdSense, and your rights.",
  alternates: { canonical: "https://studyvirus.com/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "April 11, 2026";

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {lastUpdated}</p>

      <article className="prose prose-slate max-w-none text-slate-700">
        <p>
          StudyVirus (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates the website
          studyvirus.com and the StudyVirus mobile application (together, the &quot;Service&quot;).
          This page explains what information we collect, how we use it, and the choices
          you have.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Information We Collect</h2>
        <p>
          StudyVirus does not require an account to access quizzes, notes, or study material.
          We collect only the information needed to run and improve the Service:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Usage data:</strong> pages visited, time spent, clicks, and general device
            information (browser, operating system, screen size).</li>
          <li><strong>Log data:</strong> IP address, referrer, and request timestamps, collected
            automatically by our hosting provider.</li>
          <li><strong>Cookies:</strong> small files stored in your browser to remember
            preferences and to serve advertising (see below).</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">How We Use Information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To deliver study content, quizzes, and practice tests.</li>
          <li>To measure traffic, diagnose issues, and improve the Service.</li>
          <li>To display relevant advertisements through Google AdSense.</li>
          <li>To comply with legal obligations when required.</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Advertising &amp; Cookies</h2>
        <p>
          StudyVirus uses Google AdSense to display advertisements. Google and its partners
          use cookies to serve ads based on your prior visits to our website or other
          websites. You can opt out of personalised advertising by visiting{" "}
          <a href="https://www.google.com/settings/ads" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            Google Ads Settings
          </a>. You can also visit{" "}
          <a href="https://www.aboutads.info" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">
            www.aboutads.info
          </a>{" "}
          to learn about interest-based advertising and your choices.
        </p>
        <p>
          Third-party vendors, including Google, use cookies to serve ads based on a
          user&apos;s prior visits to our website or other websites. Google&apos;s use of
          advertising cookies enables it and its partners to serve ads to our users based
          on their visits to our sites and other sites on the Internet.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Analytics</h2>
        <p>
          We may use Google Analytics or similar tools to understand aggregate usage
          patterns. These tools use cookies and may collect anonymised data such as page
          views, session duration, and approximate location. We do not use this data to
          identify individual users.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Data Sharing</h2>
        <p>
          We do not sell personal information. We only share data with service providers
          that help us operate the Service (hosting, analytics, advertising) and only to
          the extent necessary to provide those services. Each of these providers is bound
          by their own privacy policies.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Children&apos;s Privacy</h2>
        <p>
          StudyVirus is intended for students preparing for competitive exams, typically
          aged 16 and above. We do not knowingly collect personal information from children
          under 13. If you believe a child under 13 has provided us with personal data,
          please contact us and we will delete it.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Your Choices</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>You can disable cookies in your browser settings at any time.</li>
          <li>You can opt out of personalised advertising using the links above.</li>
          <li>You can request deletion of any data associated with you by contacting us.</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Changes to This Policy</h2>
        <p>
          We may update this policy from time to time. When we do, we will revise the
          &quot;Last updated&quot; date at the top of this page. Continued use of the
          Service after any change constitutes acceptance of the updated policy.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">Contact Us</h2>
        <p>
          Questions about this privacy policy can be sent via our{" "}
          <a href="/contact" className="text-accent hover:underline">Contact page</a>.
        </p>
      </article>
    </div>
  );
}
