import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  DELETE_ACCOUNT_APPS,
  DEVELOPER_NAME,
  LEGAL_NAME,
  SUPPORT_EMAIL,
} from "@/lib/deleteAccountApps";

export const dynamicParams = false;

export function generateStaticParams() {
  return DELETE_ACCOUNT_APPS.map((a) => ({ slug: a.slug }));
}

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const app = DELETE_ACCOUNT_APPS.find((a) => a.slug === params.slug);
  if (!app) return {};
  return {
    title: `Delete Your Account and Data | ${app.title}`,
    description: `How to delete your ${app.title} account and data. App by ${DEVELOPER_NAME}.`,
    alternates: { canonical: `https://studyvirus.com/delete-account/${app.slug}` },
  };
}

export default function DeleteAccountPage({ params }: Props) {
  const app = DELETE_ACCOUNT_APPS.find((a) => a.slug === params.slug);
  if (!app) notFound();

  const subject = `${app.title} - Delete my account`;
  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;

  return (
    <>
      <h1>{app.title} - Delete Your Account and Data</h1>
      <p className="meta">Last updated: October 13, 2026</p>

      <div className="box">
        <strong>App:</strong> {app.title}
        <br />
        <strong>Developer:</strong> {DEVELOPER_NAME} ({LEGAL_NAME})
        <br />
        <strong>Package:</strong> {app.pkg}
        <br />
        <strong>Support email:</strong> {SUPPORT_EMAIL}
      </div>

      <h2>Option 1: Delete inside the app</h2>
      <ol>
        <li>Open <strong>{app.title}</strong> on your phone.</li>
        <li>Go to <strong>Settings</strong>.</li>
        <li>Tap <strong>Delete Account</strong>.</li>
        <li>Confirm. Your account and data are removed.</li>
      </ol>

      <h2>Option 2: Delete by email</h2>
      <p>If you cannot open the app, or you uninstalled it:</p>
      <ol>
        <li>
          Send an email to <a href={mailto}>{SUPPORT_EMAIL}</a> with the subject{" "}
          <strong>{subject}</strong>.
        </li>
        <li>
          Send it from the Google account you signed in with. If you never signed in, write the
          display name shown in the app.
        </li>
        <li>We delete your data and email you to confirm.</li>
      </ol>

      <h2>What is deleted</h2>
      <ul>
        <li>Your profile, display name, photo and Google Sign-In email.</li>
        <li>Your quiz progress, scores, coins and leaderboard entries.</li>
        <li>Your Pro / ad-free entitlement linked to the account.</li>
      </ul>
      <p>
        Deletion is completed within 90 days of your request. Purchase and billing records may be
        kept longer where the law requires it. Aggregated, anonymous analytics are not linked to you
        and are not deleted.
      </p>

      <hr />
      <p className="foot">
        <strong>{app.title}</strong> is published by {DEVELOPER_NAME} on Google Play. The app&apos;s
        privacy policy is linked on its Google Play listing.
      </p>
    </>
  );
}
