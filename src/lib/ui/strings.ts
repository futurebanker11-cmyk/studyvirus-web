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

  // ── Home page ──
  /* The H1. {questions} is formatCount(siteStats().questions) and {exams} the
     length of EXAMS — both computed at build time from things that can be
     counted, which is the entire point: the page this replaces claimed
     "200,000+" in its title and "23K+" in its own hero, on the same screen. */
  "home.h1": {
    en: "{questions} free practice questions for {exams} government exams",
    hi: "{exams} सरकारी परीक्षाओं के लिए {questions} निःशुल्क अभ्यास प्रश्न",
  },
  "home.lede": {
    en: "Every question, previous-year paper and current-affairs set on this site is free, in Hindi and English, with no sign-up.",
    hi: "इस साइट के सभी प्रश्न, पिछले वर्षों के प्रश्नपत्र और करेंट अफेयर्स सेट हिंदी और अंग्रेज़ी में निःशुल्क हैं — बिना किसी रजिस्ट्रेशन के।",
  },
  "home.ctaExams": { en: "Choose your exam", hi: "अपनी परीक्षा चुनें" },
  "home.ctaPractice": { en: "Start practising", hi: "अभ्यास शुरू करें" },

  /* Stat row labels. Each is a count the content index produces, so a reader
     who browses the tree can verify it. */
  "home.statQuestions": { en: "Questions", hi: "प्रश्न" },
  "home.statChapters": { en: "Chapters", hi: "अध्याय" },
  "home.statPapers": { en: "Papers", hi: "प्रश्नपत्र" },
  "home.statCaDays": { en: "Current-affairs days", hi: "करेंट अफेयर्स दिवस" },

  // Section headings
  "home.examsHeading": { en: "Exams we cover", hi: "हमारी कवर की गई परीक्षाएँ" },
  "home.examsSub": {
    en: "Pick the exam you are preparing for — each hub lists its syllabus subjects, papers and app.",
    hi: "जिस परीक्षा की तैयारी कर रहे हैं उसे चुनें — हर हब में उसके विषय, प्रश्नपत्र और ऐप मिलेंगे।",
  },
  "home.subjectsHeading": { en: "Subjects", hi: "विषयवार अभ्यास" },
  "home.subjectsSub": {
    en: "Chapter-wise question sets with answers and explanations.",
    hi: "उत्तर और व्याख्या के साथ अध्यायवार प्रश्न सेट।",
  },
  "home.pyqHeading": { en: "Previous-year papers", hi: "पिछले वर्षों के प्रश्नपत्र" },
  "home.pyqSub": {
    en: "Questions taken from papers that were actually set, grouped by exam.",
    hi: "वास्तव में पूछे गए प्रश्नपत्रों के प्रश्न, परीक्षा के अनुसार।",
  },
  "home.caHeading": { en: "Current affairs", hi: "करेंट अफेयर्स" },
  "home.caSub": {
    en: "A dated question set for each day, kept month by month.",
    hi: "हर दिन का तारीख़वार प्रश्न सेट, महीने के अनुसार संग्रहीत।",
  },
  "home.appsHeading": { en: "Practise offline", hi: "ऑफ़लाइन अभ्यास करें" },
  "home.appsSub": {
    en: "The same question bank in a free Android app, so a weak signal does not stop you.",
    hi: "यही प्रश्न बैंक एक निःशुल्क Android ऐप में — कमज़ोर नेटवर्क आपकी तैयारी न रोके।",
  },
  "home.aboutHeading": { en: "About these numbers", hi: "इन आँकड़ों के बारे में" },
  "home.aboutBody": {
    en: "Every count on this page is produced at build time from the question files the site serves, not typed in by hand. If a chapter is missing, its questions are not counted; if a paper is added, the total goes up on the next build. You can check any of them by opening the section it came from.",
    hi: "इस पृष्ठ का हर आँकड़ा साइट पर मौजूद प्रश्न फ़ाइलों से बिल्ड के समय निकाला जाता है, हाथ से नहीं लिखा जाता। कोई अध्याय न हो तो उसके प्रश्न गिने नहीं जाते; नया प्रश्नपत्र जुड़े तो अगले बिल्ड में संख्या बढ़ जाती है। आप कोई भी आँकड़ा उसके अनुभाग में जाकर जाँच सकते हैं।",
  },

  // Links out of a section
  "home.viewAllExams": { en: "See all exams", hi: "सभी परीक्षाएँ देखें" },
  "home.viewAllSubjects": { en: "See all subjects", hi: "सभी विषय देखें" },
  "home.viewAllPyq": { en: "See all previous-year papers", hi: "सभी पिछले प्रश्नपत्र देखें" },
  "home.viewAllCa": { en: "See all current affairs", hi: "सभी करेंट अफेयर्स देखें" },
  "home.viewAllApps": { en: "See all apps", hi: "सभी ऐप्स देखें" },
  "home.latestDay": { en: "Latest day", hi: "नवीनतम दिवस" },

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
