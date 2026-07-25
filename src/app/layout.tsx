import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import SiteShell from "@/components/SiteShell";
import { LangProvider } from "@/lib/LangContext";


export const metadata: Metadata = {
  title: {
    default: "StudyVirus - Free GK Questions for Competitive Exams",
    template: "%s",
  },
  description:
    "200,000+ GK questions with answers for SSC, Railway, UPSC, Police & State exams. Free quizzes, mock tests, previous year papers & current affairs.",
  metadataBase: new URL("https://studyvirus.com"),
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "StudyVirus",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "StudyVirus - 200,000+ Free GK Questions for Competitive Exams",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "StudyVirus - Free GK Questions for Competitive Exams",
    description: "200,000+ GK questions with answers for SSC, Railway, UPSC, Police & State exams.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://studyvirus.com",
  },
  verification: {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#060d1e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${inter.className}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "StudyVirus",
              url: "https://studyvirus.com",
              logo: "https://studyvirus.com/og-image.png",
              sameAs: [
                "https://play.google.com/store/apps/details?id=com.gkpkhindi.studyvirus"
              ],
              description: "India's largest free GK question bank for competitive exam preparation.",
            }),
          }}
        />
        <LangProvider>
          <SiteShell>{children}</SiteShell>
        </LangProvider>
      </body>
    </html>
  );
}
