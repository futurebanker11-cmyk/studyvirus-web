// Only the three structured-data types that are current and fit this site
// (spec §4.6). FAQPage rich results were removed by Google on 7 May 2026;
// QAPage requires community answers; no Quiz type exists.
export const FORBIDDEN_TYPES = ["FAQPage", "QAPage", "Quiz"] as const;

export function breadcrumbList(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  };
}

export function organization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StudyVirus",
    url: "https://studyvirus.com",
    logo: "https://studyvirus.com/og-image.png",
    sameAs: ["https://play.google.com/store/apps/developer?id=Manmeet+Kumar"],
    description: "Free practice questions, previous-year papers and current affairs for Indian government exams, in Hindi and English.",
  };
}

export function softwareApplication(a: { name: string; description: string; packageName: string; url: string; rating?: number; ratingCount?: number }) {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: a.name,
    description: a.description,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Android",
    offers: { "@type": "Offer", price: 0, priceCurrency: "INR" },
    downloadUrl: a.url,
    installUrl: a.url,
    identifier: a.packageName,
  };
  if (a.rating !== undefined && a.ratingCount !== undefined && a.ratingCount >= 5) {
    base.aggregateRating = { "@type": "AggregateRating", ratingValue: a.rating, ratingCount: a.ratingCount, bestRating: 5, worstRating: 1 };
  }
  return base;
}
