import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Sahi Jawab: GK Current Affairs",
  description:
    "Privacy policy for Sahi Jawab (सही जवाब) explaining how we collect, use, and protect your information.",
  alternates: { canonical: "https://studyvirus.com/privacy/sahi-jawab" },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 8, 2026";

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">Sahi Jawab (सही जवाब) - Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {lastUpdated}</p>

      <article className="prose prose-slate max-w-none text-slate-700">
        <p>
          <strong>App:</strong> Sahi Jawab: GK Current Affairs<br />
          <strong>Developer:</strong> Prepfield<br />
          <strong>Package:</strong> com.gkpkhindi.studyvirus<br />
          <strong>Support Email:</strong> support@gkquestionsguru.com
        </p>
        <p>
          Sahi Jawab is a GK quiz and current affairs app for government exam preparation. It is not an official government app and is not connected to any government body.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">1. Information We Collect</h2>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">1.1 Information collected automatically</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Device identifiers:</strong> a device ID / installation ID used to track your quiz progress, coins, and unlocked content across app sessions.
          </li>
          <li>
            <strong>Advertising ID:</strong> Google&apos;s Advertising ID, used by AdMob for ad personalization and frequency capping. You can reset or opt out of ad personalization in your device&apos;s Google Settings.
          </li>
          <li>
            <strong>Usage analytics:</strong> features used, quizzes attempted, screens viewed, session length, crashes and performance data — collected via Firebase to help us fix bugs and improve the App.
          </li>
          <li>
            <strong>Device information:</strong> device model, OS version, app version and language, used to keep the App working well on low-end Android devices.
          </li>
          <li>
            <strong>Push notification token:</strong> a token that lets us send you quiz reminders and daily current affairs alerts. You can turn notifications off at any time in your phone&apos;s settings.
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">1.2 Information you provide directly (optional)</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Google Sign-In email:</strong> if you choose to sign in with Google, we receive your email address and basic profile info, used to sync your progress, coins, and purchases across devices.
          </li>
          <li>
            <strong>Display name and profile photo:</strong> if you set a name or photo, they are stored on our servers and shown on leaderboards and next to your comments. Photos are only taken from your camera or gallery when you choose to add one.
          </li>
          <li>
            <strong>Comments:</strong> comments you post on questions are visible to other users of the App, together with your display name.
          </li>
          <li>
            <strong>Quiz and progress data:</strong> your answers, scores, coins earned, bookmarks, and completed mock tests, stored to show your history and leaderboard rank.
          </li>
          <li>
            <strong>Purchases:</strong> if you buy a pass or ebook, we receive the order details from Google Play (order ID, product, date) to unlock your content. Payment details are handled by Google Play and are never seen or stored by us.
          </li>
          <li>
            <strong>Support and feedback:</strong> if you contact us by email or through the feedback form in the App, we receive your message, the app name and version, and any contact details you include.
          </li>
        </ul>
        <p>
          We do <strong>not</strong> collect precise GPS location, contacts, or SMS, and we do not require sign-in to use the App&apos;s core practice features.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            To operate core App functionality — quizzes, mock tests, current affairs, progress tracking, comments, and leaderboards.
          </li>
          <li>
            To sync your progress and purchases across devices when you sign in with Google.
          </li>
          <li>
            To send push notifications such as quiz reminders and daily current affairs.
          </li>
          <li>
            To show ads through Google AdMob, and to measure ad performance.
          </li>
          <li>
            To analyze usage patterns and fix crashes.
          </li>
          <li>
            To respond to support requests and feedback.
          </li>
          <li>
            To detect and prevent abuse, such as leaderboard manipulation, spam comments, or fraudulent purchases.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">3. Third-Party Services</h2>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>Google Firebase</strong> (Analytics, Authentication, Firestore/Realtime Database) — used for app analytics, optional Google Sign-In, and syncing progress data. See{" "}
            <a href="https://firebase.google.com/support/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
              Firebase&apos;s Privacy Policy
            </a>
            .
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>Google AdMob</strong> — used to serve ads and may use the Advertising ID for ad personalization. See{" "}
            <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener" className="text-primary hover:underline">
              Google&apos;s Ads Policy
            </a>
            .
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>Google Play Billing</strong> — processes in-app purchases. See{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener" className="text-primary hover:underline">
              Google&apos;s Privacy Policy
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
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
          <p>
            <strong>OneSignal</strong> — used to deliver push notifications; receives your push token and basic device information. See{" "}
            <a href="https://onesignal.com/privacy_policy" target="_blank" rel="noopener" className="text-primary hover:underline">
              OneSignal&apos;s Privacy Policy
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
            <strong>Account/progress data:</strong> retained as long as your account is active; deleted within 90 days of an account deletion request.
          </li>
          <li>
            <strong>Purchase records:</strong> kept as long as needed to restore your purchases and to meet tax and accounting rules.
          </li>
          <li>
            <strong>Analytics data:</strong> aggregated/anonymized analytics may be retained indefinitely; identifiable analytics data is retained for up to 14 months (Firebase default) or as configured.
          </li>
          <li>
            <strong>Support emails and feedback:</strong> retained as long as needed to resolve your query and for our records.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">5. Data Security</h2>
        <p>
          We use industry-standard measures — including encrypted transmission (HTTPS/TLS) and access-controlled cloud storage — to protect your information. No method of transmission or storage is 100% secure, and we cannot guarantee absolute security.
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
            <strong>Opt-out:</strong> disable ad personalization via your device&apos;s Google Settings, turn off notifications in your phone&apos;s settings, or uninstall the App to stop all data collection.
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

        <h2 id="delete-account" className="text-xl font-bold text-primary mt-8 mb-3">7. Delete Your Account and Data</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>
            Email{" "}
            <a href="mailto:support@gkquestionsguru.com?subject=Sahi%20Jawab%20-%20Delete%20my%20account" className="text-primary hover:underline">
              support@gkquestionsguru.com
            </a>{" "}
            with the subject &quot;Sahi Jawab - Delete my account&quot;.
          </li>
          <li>
            Send it from the Google email you signed in with. If you never signed in, tell us your display name as shown in the App.
          </li>
          <li>
            We delete your profile, display name, photo, comments, progress, and coins within 90 days and email you when it is done.
          </li>
        </ol>
        <p>
          Purchase records may be kept where the law requires it. Anonymized analytics that cannot identify you are not deleted.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">8. Children&apos;s Privacy</h2>
        <p>
          This App is intended for exam aspirants generally aged 16 and above and is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us personal information, contact us and we will delete it promptly.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">9. International Users</h2>
        <p>
          The App is designed primarily for users in India. If you access the App from outside India, your information may be processed in India or other countries where our service providers (such as Google/Firebase) operate, which may have different data protection laws than your home country.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Material changes will be reflected by updating the &quot;Last Updated&quot; date above. Continued use of the App after changes constitutes acceptance of the revised policy.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">11. Contact Us</h2>
        <p>For questions, concerns, or data requests regarding this Privacy Policy:</p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:support@gkquestionsguru.com" className="text-primary hover:underline">
            support@gkquestionsguru.com
          </a>
        </p>

        <hr className="my-8" />

        <p className="text-sm text-slate-500">
          <strong>Sahi Jawab (सही जवाब)</strong><br />
          This Privacy Policy is effective as of {lastUpdated} and applies to all users of the App regardless of location.
        </p>
      </article>
    </div>
  );
}
