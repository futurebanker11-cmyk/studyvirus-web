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

const ORG_DESCRIPTION = {
  en: "Free practice questions, previous-year papers and current affairs for Indian government exams, in Hindi and English.",
  hi: "भारतीय सरकारी परीक्षाओं के लिए मुफ़्त अभ्यास प्रश्न, पिछले वर्षों के प्रश्नपत्र और करेंट अफेयर्स — हिंदी और अंग्रेज़ी दोनों में।",
} as const;

/**
 * The site-wide Organization block, rendered on every page by HtmlShell.
 *
 * `lang` matters for two reasons. The description used to be the English
 * string on /hi/ pages too — the one real EN/HI parity gap in the site's
 * structured data — and no block anywhere declared `inLanguage`, even though
 * <html lang> and hreflang were both correct. Both are stated here so a
 * crawler reading only the JSON-LD sees the same language the markup does.
 */
export function organization(lang: "en" | "hi" = "en") {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "StudyVirus",
    url: lang === "hi" ? "https://studyvirus.com/hi" : "https://studyvirus.com",
    // TODO(logo): og-image.png is a 1200x630 social card, not a logo. Google
    // wants a logo image (square-ish reads best in a Knowledge Panel). Swap
    // this for a real logo asset once one exists in /public — pointing it at a
    // file that 404s would be worse than a wrongly-shaped one that loads.
    logo: "https://studyvirus.com/og-image.png",
    sameAs: ["https://play.google.com/store/apps/developer?id=Manmeet+Kumar"],
    description: ORG_DESCRIPTION[lang],
    inLanguage: lang === "hi" ? "hi-IN" : "en-IN",
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
