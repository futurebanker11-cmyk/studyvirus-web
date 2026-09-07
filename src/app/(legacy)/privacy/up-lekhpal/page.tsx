import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | UP Lekhpal 2026 GK Mock Test",
  description:
    "Privacy policy for UP Lekhpal 2026 GK Mock Test explaining how we collect, use, and protect your information.",
  alternates: { canonical: "https://studyvirus.com/privacy/up-lekhpal" },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "August 21, 2026";

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">UP Lekhpal 2026 GK Mock Test - Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {lastUpdated}</p>

      <article className="prose prose-slate max-w-none text-slate-700">
        <p>
          <strong>Developer:</strong> Manmeet Kumar<br />
          <strong>Package:</strong> com.gkpk.uplekhpal<br />
          <strong>Support Email:</strong> support@gkquestionsguru.com
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">1. Information We Collect</h2>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">1.1 Information collected automatically</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Device identifiers:</strong> a device ID / installation ID used to track your quiz progress, coins, and unlocked content across app sessions.
          </li>
          <li>
            <strong>Advertising ID:</strong> Google&apos;s Advertising ID (if AdMob ads are shown in the App), used for ad personalization and frequency capping. You can reset or opt out of ad personalization in your device&apos;s Google Settings.
          </li>
          <li>
            <strong>Usage analytics:</strong> features used, quizzes attempted, screens viewed, session length, crashes and performance data — collected via Firebase Analytics and Firebase Crashlytics to help us fix bugs and improve the App.
          </li>
          <li>
            <strong>Device information:</strong> device model, OS version, and general performance data, used to keep the App working well on low-end Android devices.
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">1.2 Information you provide directly (optional)</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Google Sign-In email:</strong> if you choose to sign in with Google, we receive your email address and basic profile info, used to sync your progress, coins, and Pro entitlement across devices.
          </li>
          <li>
            <strong>Quiz and progress data:</strong> your answers, scores, coins earned, and completed mock tests, stored to show your history and leaderboard rank.
          </li>
          <li>
            <strong>Support communications:</strong> if you email us for support, we receive your email address and message content.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect precise GPS location, and we do not require sign-in to use the App&apos;s core practice features.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            To operate core App functionality — quizzes, mock tests, progress tracking, and leaderboards.
          </li>
          <li>
            To sync your progress and Pro/ad-free entitlement across devices when you sign in with Google.
          </li>
          <li>
            To show relevant, non-intrusive ads (if applicable) through Google AdMob, and to measure ad performance.
          </li>
          <li>
            To analyze usage patterns and fix crashes, using Firebase Analytics and Crashlytics.
          </li>
          <li>
            To respond to support requests and feedback.
          </li>
          <li>
            To detect and prevent abuse, such as leaderboard manipulation or fraudulent activity.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">3. Third-Party Services</h2>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>Google Firebase</strong> (Analytics, Crashlytics, Authentication, Realtime Database/Firestore) — used for app analytics, crash reporting, optional Google Sign-In, and syncing progress data. See{" "}
            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
              Firebase&apos;s Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>Google AdMob</strong> (if ads are enabled in this App) — used to serve ads and may use the Advertising ID for ad personalization. See{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener" className="text-primary hover:underline">
              Google&apos;s Ads Policy
            </a>
            .
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>Google Sign-In</strong> — used only if you choose to sign in, to authenticate you and sync your data. See{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </div>
        <p>
          These providers may collect information independently under their own privacy policies. We do not sell your personal information to third parties.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">4. Data Retention</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Account/progress data:</strong> retained as long as your account is active; deleted within 90 days of account deletion request.
          </li>
          <li>
            <strong>Analytics data:</strong> aggregated/anonymized analytics may be retained indefinitely; identifiable analytics data is retained for up to 14 months (Firebase default) or as configured.
          </li>
          <li>
            <strong>Support emails:</strong> retained as long as needed to resolve your query and for our records.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">5. Data Security</h2>
        <p>
          We use industry-standard measures — including encrypted transmission (HTTPS/TLS) and access-controlled cloud storage via Firebase/Google Cloud — to protect your information. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">6. Your Rights</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Access & portability:</strong> request a copy of the personal data we hold about you.
          </li>
          <li>
            <strong>Correction & deletion:</strong> request correction of inaccurate data, or deletion of your account and associated data.
          </li>
          <li>
            <strong>Opt-out:</strong> disable ad personalization via your device&apos;s Google Settings, or uninstall the App to stop all data collection.
          </li>
          <li>
            <strong>Withdraw consent:</strong> for optional features like Google Sign-In, you may sign out or discontinue use at any time.
          </li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:support@gkquestionsguru.com" className="text-primary hover:underline">
            support@gkquestionsguru.com
          </a>
          . We aim to respond within 30 days.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">7. Children&apos;s Privacy</h2>
        <p>
          This App is intended for exam aspirants generally aged 16 and above and is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, contact us and we will delete it promptly.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">8. International Users</h2>
        <p>
          The App is designed primarily for users in India. If you access the App from outside India, your information may be processed in India or other countries where our service providers (such as Google/Firebase) operate, which may have different data protection laws than your home country.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by updating the &quot;Last Updated&quot; date above. Continued use of the App after changes constitutes acceptance of the revised policy.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">10. Contact Us</h2>
        <p>For questions, concerns, or data requests regarding this Privacy Policy:</p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@gkquestionsguru.com" className="text-primary hover:underline">
            support@gkquestionsguru.com
          </a>
        </p>

        <hr className="my-8" />

        <p className="text-sm text-slate-500">
          <strong>UP Lekhpal 2026 GK Mock Test</strong><br />
          This Privacy Policy is effective as of {lastUpdated} and applies to all users of the App regardless of location.
        </p>
      </article>
    </div>
  );
}
