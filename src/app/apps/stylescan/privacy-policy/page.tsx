import Breadcrumbs from "@/components/Breadcrumbs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | StyleScan: Furniture Identifier",
  description:
    "StyleScan privacy policy explaining how we collect, use, and protect your furniture identification data, photos, and personal information.",
  alternates: { canonical: "https://studyvirus.com/apps/stylescan/privacy-policy" },
};

export default function StyleScanPrivacyPolicyPage() {
  const lastUpdated = "July 18, 2026";

  return (
    <div className="max-w-3xl mx-auto">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "StyleScan", href: "/apps/stylescan" },
          { label: "Privacy Policy" },
        ]}
      />
      <h1 className="text-3xl font-black text-primary mb-2">StyleScan: Furniture Identifier - Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {lastUpdated}</p>

      <article className="prose prose-slate max-w-none text-slate-700">
        <p>
          <strong>Developer:</strong> Manmeet Kumar<br />
          <strong>Support Email:</strong> support@gkquestionsguru.com
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">1. Introduction</h2>
        <p>
          StyleScan: Furniture Identifier (&quot;App&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how our App collects, uses, discloses, and safeguards your information when you use our mobile application available on Google Play.
        </p>
        <p>
          Please read this Privacy Policy carefully. If you do not agree with our policies and practices, please do not use our App.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">2. Information We Collect</h2>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">2.1 Information You Provide Directly</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Photos and Images:</strong> We collect photographs and images of furniture pieces that you capture through the App&apos;s camera feature. These images are processed by our AI analysis engine to identify furniture style, era, materials, and estimated market value. Images are only retained for the duration of processing unless you choose to save them to your collection.
          </li>
          <li>
            <strong>User Account Information (Optional):</strong> If you create an account or sign up for Premium, we collect email address and account credentials. Account information is used for authentication and Premium subscription management.
          </li>
          <li>
            <strong>User-Generated Content:</strong> Custom notes, collections, and boards you create within the App, style quiz responses, and saved furniture identification history.
          </li>
        </ul>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">2.2 Information Collected Automatically</h3>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Device Information:</strong> Device type, operating system, version, unique device identifiers (IDFA/Advertising ID), device model, manufacturer, storage and memory information.
          </li>
          <li>
            <strong>Usage Data:</strong> Features accessed, furniture items identified or searched, time spent on the App, interactions with design styles, quizzes and library content, app crashes, errors, and technical performance data.
          </li>
          <li>
            <strong>Location Information:</strong> We do not collect precise GPS location data. Approximate location may be inferred from device settings for app performance analytics only.
          </li>
          <li>
            <strong>Camera Permissions:</strong> Permission status for camera access. We only access your camera when you actively use the furniture scanning feature.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">3. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Core App Functionality:</strong> Processing furniture images for AI analysis and identification, storing your identification history and saved collections, personalizing your experience based on style preferences.
          </li>
          <li>
            <strong>Service Improvement:</strong> Analyzing usage patterns to improve App features, identifying and fixing technical issues and bugs, developing new features and design styles.
          </li>
          <li>
            <strong>Communication:</strong> Sending notifications about new features, style recommendations, or App updates, responding to support inquiries and feedback, notifying you of changes to this Privacy Policy.
          </li>
          <li>
            <strong>Analytics and Insights:</strong> Generating aggregate, anonymized statistics about App usage, understanding furniture style trends and user preferences, improving AI model accuracy.
          </li>
          <li>
            <strong>Premium Services:</strong> Processing payments and managing Premium subscriptions, providing unlimited scans and full appraisal reports, delivering ad-free experience to Premium subscribers.
          </li>
          <li>
            <strong>Legal Compliance:</strong> Complying with applicable laws and regulations, protecting our rights and the rights of other users, preventing fraud, abuse, and illegal activity.
          </li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">4. How We Share Your Information</h2>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">4.1 We Do NOT Share Personal Information</h3>
        <p>
          We do not sell, rent, lease, or trade your personal information to third parties for marketing purposes.
        </p>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">4.2 Service Providers</h3>
        <p>
          We may share information with trusted third-party service providers who process payments, provide cloud storage and hosting services, perform analytics, and provide customer support. These service providers are contractually obligated to use your information only to provide services to us and to maintain the confidentiality and security of your information.
        </p>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">4.3 Legal Requirements</h3>
        <p>
          We may disclose information when required by law, court order, or government request, or when we believe in good faith that disclosure is necessary to comply with applicable laws, enforce our Terms of Service, protect the safety and rights of StyleScan and our users, or prevent or detect fraud and security issues.
        </p>

        <h3 className="text-lg font-semibold text-primary mt-6 mb-3">4.4 Business Transfers</h3>
        <p>
          If StyleScan is involved in a merger, acquisition, bankruptcy, or asset sale, your information may be transferred as part of that transaction. We will provide notice before your information becomes subject to a different Privacy Policy.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">5. Data Security</h2>
        <p>We implement comprehensive security measures to protect your information:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Encryption:</strong> Data transmitted between your device and our servers uses industry-standard SSL/TLS encryption.</li>
          <li><strong>Secure Storage:</strong> Personal information is stored on secure, access-controlled servers.</li>
          <li><strong>Access Controls:</strong> Only authorized personnel can access personal information.</li>
          <li><strong>Regular Updates:</strong> We maintain regular security updates and patches.</li>
          <li><strong>Monitoring:</strong> We continuously monitor for security vulnerabilities and threats.</li>
        </ul>
        <p>
          <em>Note:</em> No method of transmission over the internet or electronic storage is 100% secure. While we use industry-standard security practices, we cannot guarantee absolute security of your information.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">6. Data Retention</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Furniture Scan History:</strong> Retained as long as your account is active or for 90 days after account deletion.</li>
          <li><strong>Images Processed:</strong> Temporary processing copies are deleted within 24 hours unless saved to your collection.</li>
          <li><strong>Saved Collections:</strong> Retained until you delete them.</li>
          <li><strong>Account Information:</strong> Retained for as long as needed to provide services and comply with legal obligations.</li>
          <li><strong>Usage Analytics:</strong> Anonymized data retained indefinitely; identifiable data retained for 12 months.</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">7. Your Privacy Rights</h2>
        <p>Depending on your location, you may have certain rights:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Data Access and Portability:</strong> You may request a copy of your personal information in a portable format.</li>
          <li><strong>Data Correction and Deletion:</strong> You may request correction of inaccurate information or deletion of your account and associated data.</li>
          <li><strong>Withdrawal of Consent:</strong> You may withdraw consent for specific data processing activities (except where processing is required by law).</li>
          <li><strong>Right to Opt-Out:</strong> You may opt out of marketing communications, push notifications, analytics and tracking, or certain optional data collection.</li>
        </ul>
        <p>
          To exercise these rights, contact us at support@gkquestionsguru.com with clear identification of your request and specific details of the right you&apos;re requesting. We will respond within 30 days (or as required by applicable law).
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">8. Children&apos;s Privacy</h2>
        <p>
          StyleScan is not intended for children under 13 years old. We do not knowingly collect personal information from children under 13. If we become aware that we have collected information from a child under 13, we will promptly delete such information and terminate the child&apos;s account.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">9. Third-Party Services and Links</h2>
        <p>
          Our App may contain links to third-party websites and services (such as Chairish, 1stDibs, Etsy Vintage, West Elm, and Wayfair). We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
        </p>
        <p>
          Our App may use third-party SDKs and services for analytics, crash reporting, advertising networks, and payment processing. These third parties have their own privacy policies governing their data practices.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">10. California Privacy Rights (CCPA/CPRA)</h2>
        <p>
          If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Right to Know:</strong> Request what personal information we collect, use, or share.</li>
          <li><strong>Right to Delete:</strong> Request deletion of personal information we collected.</li>
          <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information.</li>
          <li><strong>Right to Opt-Out:</strong> Opt out of sale or sharing of personal information.</li>
          <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your rights.</li>
        </ol>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">11. European Privacy Rights (GDPR)</h2>
        <p>
          If you are located in the European Union or other jurisdictions with similar privacy laws, you have additional rights including:
        </p>
        <ol className="list-decimal pl-6 space-y-2">
          <li><strong>Lawful Basis:</strong> Processing is based on your consent, contractual necessity, or our legitimate interests.</li>
          <li><strong>Data Subject Rights:</strong> Access, rectification, erasure, restriction, portability, and objection.</li>
          <li><strong>Automated Decision-Making:</strong> You have the right not to be subject to automated decisions that produce legal or similarly significant effects.</li>
          <li><strong>Data Protection Officer:</strong> Contact our support email for data protection inquiries.</li>
        </ol>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">12. Push Notifications and Communications</h2>
        <p>
          We may send push notifications for new features, style recommendations, Premium upgrade offers, and App updates. You can disable push notifications in your device settings or unsubscribe from marketing communications via email unsubscribe links or the App settings menu.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">13. Analytics and Tracking Technologies</h2>
        <p>
          We use analytics services like Google Analytics for Firebase to understand how users interact with our App. You can:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Disable Advertising ID tracking in device settings</li>
          <li>Opt out through our App settings menu</li>
          <li>Enable Do Not Track browser signals (which we respect)</li>
        </ul>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">14. International Data Transfers</h2>
        <p>
          If you access our App from outside the United States, your information may be transferred to, stored in, and processed in the United States or other countries where we or our service providers operate. These countries may have different data protection laws than your country of residence. By using the App, you consent to the transfer of your information to countries outside your country of residence.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">15. Changes to This Privacy Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology advancements, new legal requirements, or user feedback. We will notify you of material changes by posting the updated Privacy Policy in the App and updating the &quot;Last Updated&quot; date. Continued use of the App following notice of changes constitutes your acceptance of the updated Privacy Policy.
        </p>

        <h2 className="text-xl font-bold text-primary mt-8 mb-3">16. Contact Us</h2>
        <p>
          If you have questions, concerns, or requests regarding this Privacy Policy or our privacy practices, please contact us:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Email:</strong> support@gkquestionsguru.com</li>
          <li><strong>Developer:</strong> Manmeet Kumar</li>
          <li><strong>Response Time:</strong> We aim to respond to privacy inquiries within 30 days.</li>
        </ul>

        <hr className="my-8" />

        <p className="text-sm text-slate-500">
          <strong>StyleScan: Furniture Identifier</strong><br />
          This Privacy Policy is effective as of {lastUpdated} and applies to all users of the App regardless of location.
        </p>
      </article>
    </div>
  );
}
