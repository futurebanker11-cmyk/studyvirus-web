import type { Lang } from "@/lib/i18n/lang";

/**
 * Every UI string on the site, in both languages.
 *
 * Half the audience reads in Hindi, so the Hindi is not a transliteration of
 * the English — it is the wording an exam aspirant already meets in coaching
 * material and question papers. Where a term is universally known by its
 * English acronym or brand (SSC CGL, PDF, Google Play), the Latin form is the
 * recognised one and is kept.
 *
 * Later tasks append keys here; the both-languages test keeps every addition
 * honest.
 */
export const STRINGS = {
  // ── Navigation ──
  "nav.exams": { en: "Exams", hi: "परीक्षाएँ" },
  "nav.topics": { en: "Topics", hi: "विषय" },
  "nav.pyq": { en: "PYQ Papers", hi: "पिछले प्रश्नपत्र" },
  "nav.aptitude": { en: "Aptitude", hi: "एप्टीट्यूड" },
  "nav.english": { en: "English", hi: "अंग्रेज़ी" },
  "nav.currentAffairs": { en: "Current Affairs", hi: "करेंट अफेयर्स" },
  "nav.articles": { en: "Articles", hi: "लेख" },
  "nav.apps": { en: "Apps", hi: "ऐप्स" },

  // ── Common chrome ──
  "common.home": { en: "Home", hi: "होम" },
  "common.set": { en: "Set", hi: "सेट" },
  "common.questions": { en: "questions", hi: "प्रश्न" },
  "common.chapters": { en: "chapters", hi: "अध्याय" },
  "common.papers": { en: "papers", hi: "प्रश्नपत्र" },
  "common.answer": { en: "Answer", hi: "उत्तर" },
  "common.explanation": { en: "Explanation", hi: "व्याख्या" },
  "common.shortcut": { en: "Shortcut", hi: "शॉर्टकट" },
  "common.trap": { en: "Common mistake", hi: "सामान्य गलती" },
  "common.readInHindi": { en: "हिंदी में पढ़ें", hi: "Read in English" },
  "common.next": { en: "Next", hi: "अगला" },
  "common.previous": { en: "Previous", hi: "पिछला" },
  "common.showAnswers": { en: "Show answers", hi: "उत्तर दिखाएँ" },
  "common.practiceMode": { en: "Practice mode", hi: "अभ्यास मोड" },
  "common.reportError": { en: "Report an error in this set", hi: "इस सेट में त्रुटि बताएँ" },
  "common.free": { en: "Free", hi: "निःशुल्क" },

  // ── App promotion ──
  "app.getTheApp": { en: "Get the app", hi: "ऐप डाउनलोड करें" },
  "app.onPlayStore": { en: "Free on Google Play", hi: "Google Play पर निःशुल्क" },

  // ── Theme toggle ──
  "theme.toggle": { en: "Switch theme", hi: "थीम बदलें" },
  "theme.light": { en: "Light", hi: "लाइट" },
  "theme.dark": { en: "Dark", hi: "डार्क" },

  // ── Header / footer chrome ──
  "chrome.menu": { en: "Menu", hi: "मेन्यू" },
  /* Two <nav> landmarks are on the page at once on narrow screens, so they
     need distinct accessible names or a screen reader announces "navigation"
     twice with no way to tell them apart. */
  "chrome.primaryNav": { en: "Primary", hi: "मुख्य" },
  "chrome.menuNav": { en: "Menu navigation", hi: "मेन्यू नेविगेशन" },
  "chrome.closeMenu": { en: "Close menu", hi: "मेन्यू बंद करें" },
  "chrome.skipToContent": { en: "Skip to content", hi: "मुख्य सामग्री पर जाएँ" },
  "chrome.tagline": {
    en: "Free practice questions, previous-year papers and current affairs for Indian government exams.",
    hi: "सरकारी नौकरी की परीक्षाओं के लिए निःशुल्क अभ्यास प्रश्न, पिछले वर्षों के प्रश्नपत्र और करेंट अफेयर्स।",
  },

  // ── Footer column headings ──
  "footer.examsByCategory": { en: "Exams by category", hi: "श्रेणी के अनुसार परीक्षाएँ" },
  "footer.content": { en: "Study material", hi: "अध्ययन सामग्री" },
  "footer.about": { en: "About", hi: "हमारे बारे में" },
  "footer.aboutUs": { en: "About us", hi: "परिचय" },
  "footer.contact": { en: "Contact", hi: "संपर्क" },
  "footer.privacy": { en: "Privacy policy", hi: "गोपनीयता नीति" },
  "footer.terms": { en: "Terms of use", hi: "उपयोग की शर्तें" },
  "footer.allExams": { en: "All exams", hi: "सभी परीक्षाएँ" },
  "footer.rights": { en: "All rights reserved.", hi: "सर्वाधिकार सुरक्षित।" },
  /* Filled from siteStats() at render time: questions, chapters, papers. */
  "footer.statLine": {
    en: "{questions} questions · {chapters} chapters · {papers} previous-year papers",
    hi: "{questions} प्रश्न · {chapters} अध्याय · {papers} पिछले वर्षों के प्रश्नपत्र",
  },

  // ── Exam categories (footer column) ──
  "cat.railway": { en: "Railway", hi: "रेलवे" },
  "cat.ssc": { en: "SSC", hi: "SSC" },
  "cat.police": { en: "Police", hi: "पुलिस" },
  "cat.defence": { en: "Defence", hi: "रक्षा" },
  "cat.teaching": { en: "Teaching", hi: "शिक्षक भर्ती" },
  "cat.state": { en: "State exams", hi: "राज्य परीक्षाएँ" },

  // ── App card ──
  "app.install": { en: "Install", hi: "इंस्टॉल करें" },
  "app.rating": { en: "rating", hi: "रेटिंग" },
  "app.ratingsCount": { en: "ratings", hi: "रेटिंग" },
  "app.practiceOffline": { en: "Practise offline on your phone", hi: "फ़ोन पर ऑफ़लाइन अभ्यास करें" },

  // ── Ads ──
  "ad.label": { en: "Advertisement", hi: "विज्ञापन" },

  // … later tasks append their keys here
} as const;

export type T = keyof typeof STRINGS;

export function t(lang: Lang, key: T): string {
  return STRINGS[key][lang];
}

/**
 * A string with {placeholders} filled in.
 *
 * Deliberately tiny and deliberately here rather than open-coded at each call
 * site: the footer's stat line was the first parameterised string, and a
 * hand-rolled `.replace().replace().replace()` chain is exactly the kind of
 * thing that spreads by copy-paste and then diverges.
 *
 * An unknown placeholder is left untouched rather than blanked, so a typo
 * shows up as a visible `{questoins}` in review instead of a silent gap.
 */
export function format(lang: Lang, key: T, params: Record<string, string | number>): string {
  return t(lang, key).replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : whole,
  );
}
