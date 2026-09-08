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
  "common.sets": { en: "sets", hi: "सेट" },
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

  // ── PYQ category labels (/pyq index) ──
  /* PyqExam.category (src/lib/content/pyq.ts) is a flatter, 8-value taxonomy
     used only for grouping previous-year papers — NOT the same field as
     EXAMS[].category in src/lib/exams.ts, which is more granular (state_psc,
     state_sub, forest, jail, revenue, central, agriculture, …) and serves the
     exam-hub pages. These eight keys exist only to label the PYQ groups; four
     of them (railway/ssc/police/defence) intentionally read differently from
     the similarly-named "cat.*" footer keys above, which is fine — the two
     labels sit in different sections and neither page shows both at once. */
  "pyqCat.railway": { en: "Railway Exams", hi: "रेलवे परीक्षाएं" },
  "pyqCat.ssc": { en: "SSC Exams", hi: "SSC परीक्षाएं" },
  "pyqCat.police": { en: "Police Exams", hi: "पुलिस परीक्षाएं" },
  "pyqCat.forest": { en: "Forest Exams", hi: "वन विभाग परीक्षाएं" },
  "pyqCat.defence": { en: "Defence Exams", hi: "रक्षा परीक्षाएं" },
  "pyqCat.banking": { en: "Banking Exams", hi: "बैंकिंग परीक्षाएं" },
  "pyqCat.teaching": { en: "Teaching Exams", hi: "शिक्षक परीक्षाएं" },
  "pyqCat.state": { en: "State Exams", hi: "राज्य परीक्षाएं" },

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

  // ── Exam index (/exam) ──
  /* {exams} is EXAMS.length, computed — never a written-in number. The page it
     replaces said "60+ Exams" in its <title> while listing 74, which is the
     same self-contradiction the home page's totals were rebuilt to end. */
  "examIndex.h1": {
    en: "All {exams} government exams we cover",
    hi: "हमारी कवर की गई सभी {exams} सरकारी परीक्षाएँ",
  },
  "examIndex.lede": {
    en: "Pick your exam. Each hub lists its syllabus subjects, previous-year papers, aptitude practice and free Android app.",
    hi: "अपनी परीक्षा चुनें। हर हब में उसके पाठ्यक्रम के विषय, पिछले वर्षों के प्रश्नपत्र, एप्टीट्यूड अभ्यास और निःशुल्क Android ऐप मिलेंगे।",
  },
  // ── Exam hub (/exam/[slug]) ──
  /* The H1. {exam} is the exam's name in the page's own language and {year} the
     build year, so the heading dates itself without anyone editing it. */
  "exam.h1": {
    en: "{exam} {year}: free GK questions, PYQ & practice",
    hi: "{exam} {year}: निःशुल्क GK प्रश्न, PYQ और अभ्यास",
  },
  "exam.factsHeading": { en: "Exam at a glance", hi: "परीक्षा एक नज़र में" },
  "exam.conductingBody": { en: "Conducted by", hi: "आयोजक संस्था" },
  "exam.stages": { en: "Selection stages", hi: "चयन के चरण" },
  "exam.category": { en: "Category", hi: "श्रेणी" },

  "exam.appHeading": { en: "Practise on your phone", hi: "अपने फ़ोन पर अभ्यास करें" },
  "exam.appSub": {
    en: "The same question bank in a free Android app — it works offline, so a weak signal does not stop you.",
    hi: "यही प्रश्न बैंक एक निःशुल्क Android ऐप में — यह ऑफ़लाइन चलता है, इसलिए कमज़ोर नेटवर्क आपकी तैयारी नहीं रोकेगा।",
  },
  /* Shown on the plain Play link, the shape used when the apps registry is
     unreachable: the package is known from the exam registry but the name,
     icon and rating are not, so the card claims none of them. */
  "exam.appFallbackName": { en: "{exam} preparation app", hi: "{exam} तैयारी ऐप" },

  "exam.subjectsHeading": { en: "{exam} subjects", hi: "{exam} के विषय" },
  "exam.subjectsSub": {
    en: "The syllabus subjects for this exam, with chapter-wise question sets.",
    hi: "इस परीक्षा के पाठ्यक्रम विषय, अध्यायवार प्रश्न सेट के साथ।",
  },

  "exam.pyqHeading": { en: "{exam} previous-year papers", hi: "{exam} के पिछले वर्षों के प्रश्नपत्र" },
  "exam.pyqSub": {
    en: "Questions taken from papers that were actually set, with answers and explanations.",
    hi: "वास्तव में पूछे गए प्रश्नपत्रों के प्रश्न, उत्तर और व्याख्या सहित।",
  },
  "exam.pyqNone": {
    en: "Previous-year papers for this exam are not on the site yet. The subjects above cover the same syllabus.",
    hi: "इस परीक्षा के पिछले वर्षों के प्रश्नपत्र अभी साइट पर नहीं हैं। ऊपर दिए विषय उसी पाठ्यक्रम को कवर करते हैं।",
  },
  "exam.pyqAll": { en: "All {papers} papers", hi: "सभी {papers} प्रश्नपत्र" },

  "exam.aptitudeHeading": { en: "Aptitude for {exam}", hi: "{exam} के लिए एप्टीट्यूड" },
  "exam.aptitudeSub": {
    en: "Quantitative aptitude and reasoning practice, worked step by step.",
    hi: "संख्यात्मक अभिक्षमता और रीज़निंग का अभ्यास, चरण-दर-चरण हल के साथ।",
  },

  "exam.relatedHeading": { en: "Other {category} exams", hi: "अन्य {category} परीक्षाएँ" },
  /* The aptitude section's "see all" points at the family hub, not at /topics,
     so it needs its own wording — "See all subjects" (home.viewAllSubjects) is
     reused verbatim for the GK subjects section above it. */
  "exam.viewAllAptitude": { en: "See all aptitude practice", hi: "सारा एप्टीट्यूड अभ्यास देखें" },

  // ── Set page: the question renderer, practice toggle and pager ──
  /* Practice mode hides the answers with CSS — they stay in the HTML for a
     crawler and a screen reader either way — so the control describes what it
     does to the page, not what it does to the data. */
  "set.practiceHint": {
    en: "Hide the answers while you attempt the set.",
    hi: "सेट हल करते समय उत्तर छिपाए रखें।",
  },
  "set.hideAnswers": { en: "Hide answers", hi: "उत्तर छिपाएँ" },
  /* The numbered label on each question. {n} is its number within the set. */
  "set.questionN": { en: "Question {n}", hi: "प्रश्न {n}" },
  /* Read out for a correct option; the tick glyph beside it is aria-hidden, so
     colour and shape are never the only signal that an option is the answer. */
  "set.correctOption": { en: "Correct answer", hi: "सही उत्तर" },
  /* Shown in place of the answer line when the source file does not identify
     one unambiguously. Saying so is the honest alternative to guessing — a
     wrongly-marked option is the one error a reader cannot catch. */
  "set.answerUnknown": {
    en: "The answer key for this question is being checked.",
    hi: "इस प्रश्न की उत्तर कुंजी की जाँच की जा रही है।",
  },
  "set.pagerLabel": { en: "Sets in this chapter", hi: "इस अध्याय के सेट" },
  "set.allSets": { en: "All sets", hi: "सभी सेट" },

  // ── Set page: reporting a mistake in a question ──
  /* The API stores a free-text `reason` and REQUIRES it (studyvirus-api
     src/reports.js: "question and reason required", 400 without it), so the
     form asks for one instead of sending a bare flag that the server rejects. */
  "report.open": { en: "Report a mistake", hi: "गलती की शिकायत करें" },
  "report.heading": { en: "What is wrong with this question?", hi: "इस प्रश्न में क्या गलत है?" },
  "report.placeholder": {
    en: "For example: the marked answer is wrong, or option B is a duplicate.",
    hi: "उदाहरण के लिए: चिह्नित उत्तर गलत है, या विकल्प B दोहराया गया है।",
  },
  "report.submit": { en: "Send report", hi: "शिकायत भेजें" },
  "report.sending": { en: "Sending…", hi: "भेजा जा रहा है…" },
  "report.thanks": {
    en: "Thank you — we will check this question.",
    hi: "धन्यवाद — हम इस प्रश्न की जाँच करेंगे।",
  },
  "report.needReason": {
    en: "Please describe the mistake first.",
    hi: "कृपया पहले गलती बताएँ।",
  },
  "report.failed": {
    en: "That did not send. Please try again in a moment.",
    hi: "शिकायत नहीं भेजी जा सकी। कृपया थोड़ी देर बाद फिर कोशिश करें।",
  },
  "report.rateLimited": {
    en: "Too many reports have been sent from this device today. Please try tomorrow.",
    hi: "आज इस डिवाइस से बहुत सारी शिकायतें भेजी जा चुकी हैं। कृपया कल कोशिश करें।",
  },

  // ── Topics index (/topics) ──
  /* {subjects} and {questions} are counted from the manifest and the content
     index at render time, never written in. The page the rebuild replaces
     said "50+ Topics" above a grid of 62. */
  "topics.h1": {
    en: "{subjects} GK subjects, {questions} practice questions",
    hi: "{subjects} GK विषय, {questions} अभ्यास प्रश्न",
  },
  "topics.lede": {
    en: "Every subject is split into chapters, and every chapter into sets of ten questions with answers and explanations. All of it is free, in Hindi and English.",
    hi: "हर विषय अध्यायों में और हर अध्याय दस-दस प्रश्नों के सेट में बँटा है — उत्तर और व्याख्या सहित। सब कुछ हिंदी और अंग्रेज़ी में निःशुल्क।",
  },
  /* The four column headings on /topics. They are editorial groupings made in
     src/lib/content/topicGroups.ts, not fields in the manifest. */
  "topics.groupGeneral": { en: "General knowledge", hi: "सामान्य ज्ञान" },
  "topics.groupScience": { en: "Science", hi: "विज्ञान" },
  "topics.groupState": { en: "State GK", hi: "राज्य सामान्य ज्ञान" },
  "topics.groupSpecialist": { en: "Specialist subjects", hi: "विशेष विषय" },
  "topics.groupGeneralSub": {
    en: "The general-awareness section of nearly every exam on this site.",
    hi: "इस साइट की लगभग हर परीक्षा के सामान्य ज्ञान खंड के विषय।",
  },
  "topics.groupScienceSub": {
    en: "Physics, chemistry and the life sciences, at the level these exams set them.",
    hi: "भौतिकी, रसायन और जीव विज्ञान — उसी स्तर पर जिस पर ये परीक्षाएँ पूछती हैं।",
  },
  "topics.groupStateSub": {
    en: "State-specific papers, for the boards that recruit within one state.",
    hi: "राज्य-विशेष प्रश्नपत्र — एक ही राज्य में भर्ती करने वाले बोर्डों के लिए।",
  },
  "topics.groupSpecialistSub": {
    en: "Teaching, banking and administration papers set by one stream of exams.",
    hi: "शिक्षक भर्ती, बैंकिंग और प्रशासन के प्रश्नपत्र, जो एक ही श्रेणी की परीक्षाओं में आते हैं।",
  },

  // ── Topic page (/topics/[slug]) ──
  /* {subject} is the subject's name in the page's own language. */
  "topic.h1": { en: "{subject} questions with answers", hi: "{subject} के प्रश्न, उत्तर सहित" },
  "topic.lede": {
    en: "{chapters} chapters, {questions} questions in {sets} sets — every one with a written explanation, in Hindi and English.",
    hi: "{chapters} अध्याय, {sets} सेट में {questions} प्रश्न — हर प्रश्न की लिखित व्याख्या के साथ, हिंदी और अंग्रेज़ी में।",
  },
  "topic.chaptersHeading": { en: "Chapters in this subject", hi: "इस विषय के अध्याय" },
  "topic.examsHeading": { en: "Exams that set this subject", hi: "इस विषय को पूछने वाली परीक्षाएँ" },
  "topic.examsSub": {
    en: "Each hub lists that exam's other subjects, previous-year papers and app.",
    hi: "हर हब में उस परीक्षा के बाकी विषय, पिछले वर्षों के प्रश्नपत्र और ऐप मिलेंगे।",
  },
  /* Per-chapter line on the subject page: "8 sets · 78 questions". */
  "topic.chapterMeta": { en: "{sets} sets · {questions} questions", hi: "{sets} सेट · {questions} प्रश्न" },
  "topics.backToAll": { en: "All subjects", hi: "सभी विषय" },

  // ── Chapter page (/topics/[slug]/[chapter]) ──
  "chapter.h1": { en: "{chapter} questions and answers", hi: "{chapter}: प्रश्न और उत्तर" },
  "chapter.lede": {
    en: "{questions} {chapter} questions from {subject}, in {sets} sets of ten. Each answer is explained, and nothing here needs a sign-up.",
    hi: "{subject} के अंतर्गत {chapter} के {questions} प्रश्न, दस-दस के {sets} सेट में। हर उत्तर की व्याख्या दी गई है, और किसी रजिस्ट्रेशन की ज़रूरत नहीं।",
  },
  "chapter.setsHeading": { en: "All sets in this chapter", hi: "इस अध्याय के सभी सेट" },
  /* The label inside a set card: "Questions 11–20". */
  "chapter.setRange": { en: "Questions {from}–{to}", hi: "प्रश्न {from}–{to}" },
  "chapter.nearbyHeading": { en: "Nearby chapters", hi: "आस-पास के अध्याय" },
  "chapter.pyqHeading": { en: "Previous-year papers that cover this", hi: "इसे कवर करने वाले पिछले प्रश्नपत्र" },
  "chapter.pyqSub": {
    en: "The same subject as it was actually asked, in the exams that ask it most.",
    hi: "यही विषय जैसा वास्तव में पूछा गया — उन परीक्षाओं में जो इसे सबसे अधिक पूछती हैं।",
  },
  "chapter.hindiOnlyEnglish": {
    en: "This chapter is published in English only.",
    hi: "यह अध्याय केवल अंग्रेज़ी में उपलब्ध है।",
  },

  // ── Set page (/topics/[slug]/[chapter]/set-N) ──
  "set.h1": { en: "{chapter} — Set {n}", hi: "{chapter} — सेट {n}" },
  "set.lede": {
    en: "Questions {from} to {to} of {total} in {chapter}, with the answer and an explanation under each one.",
    hi: "{chapter} के कुल {total} में से प्रश्न {from} से {to} तक — हर प्रश्न के नीचे उत्तर और व्याख्या।",
  },

  // ── PYQ index (/pyq) ──
  /* {exams} and {papers} are loadPyqExams().length and the summed papersOf()
     count, both computed at build/request time — never a written-in number,
     the same discipline as examIndex.h1 and topics.h1 above. */
  "pyqIndex.h1": {
    en: "Previous-year papers for {exams} exams",
    hi: "{exams} परीक्षाओं के पिछले वर्षों के प्रश्नपत्र",
  },
  "pyqIndex.lede": {
    en: "{papers} real papers, grouped by exam, with every question answered and explained — free, in Hindi and English.",
    hi: "{papers} वास्तविक प्रश्नपत्र, परीक्षा के अनुसार — हर प्रश्न के उत्तर और व्याख्या सहित, हिंदी और अंग्रेज़ी में निःशुल्क।",
  },
  /* Per-exam line on the index: "31 papers". */
  "pyqIndex.examMeta": { en: "{papers} papers", hi: "{papers} प्रश्नपत्र" },

  // ── PYQ exam page (/pyq/[exam]) ──
  "pyqExam.h1": { en: "{exam}: previous-year papers", hi: "{exam}: पिछले वर्षों के प्रश्नपत्र" },
  "pyqExam.lede": {
    en: "{papers} papers, {questions} questions in total, each with the answer and an explanation.",
    hi: "{papers} प्रश्नपत्र, कुल {questions} प्रश्न — हर एक के उत्तर और व्याख्या सहित।",
  },
  /* The count line under a paper card, e.g. "38 questions". */
  "pyqExam.paperMeta": { en: "{questions} questions", hi: "{questions} प्रश्न" },

  // ── PYQ set page (/pyq/[exam]/set-N) ──
  "pyqSet.h1": { en: "{exam} — Set {n}", hi: "{exam} — सेट {n}" },
  "pyqSet.lede": {
    en: "All {total} questions from this paper, with the answer and an explanation under each one.",
    hi: "इस प्रश्नपत्र के सभी {total} प्रश्न — हर प्रश्न के नीचे उत्तर और व्याख्या।",
  },

  // ── Aptitude (Task 9) ──
  //
  // Two families, "SSC & Railway" and "Bank", each with its own subjects,
  // chapters, question types and sets. The section's own names ("family",
  // "type") never reach a reader: the pages say what the thing is — an exam
  // group, a kind of question — because "family" is our word for it, not the
  // aspirant's.
  "aptIndex.h1": {
    en: "Aptitude practice with worked solutions",
    hi: "एप्टीट्यूड अभ्यास, हल सहित",
  },
  "aptIndex.lede": {
    en: "{sets} free practice sets and {questions} questions in quantitative aptitude, reasoning, data interpretation and English — every one solved step by step, with shortcuts.",
    hi: "मात्रात्मक अभिक्षमता, रीज़निंग, डेटा इंटरप्रिटेशन और अंग्रेज़ी के {sets} निःशुल्क अभ्यास सेट और {questions} प्रश्न — हर प्रश्न चरण-दर-चरण हल, शॉर्टकट सहित।",
  },
  "aptIndex.familyMeta": {
    en: "{subjects} subjects · {chapters} chapters · {sets} sets",
    hi: "{subjects} विषय · {chapters} अध्याय · {sets} सेट",
  },
  "aptFamily.h1": { en: "{family} aptitude practice", hi: "{family} एप्टीट्यूड अभ्यास" },
  "aptFamily.lede": {
    en: "For {exams}. {chapters} chapters across {subjects} subjects, {sets} practice sets in all.",
    hi: "{exams} के लिए। {subjects} विषयों में {chapters} अध्याय, कुल {sets} अभ्यास सेट।",
  },
  // Not plain "Subjects": home.subjectsHeading already owns that English
  // string, and two keys sharing one value is what the strings test rejects.
  "aptFamily.subjectsHeading": { en: "Aptitude subjects", hi: "एप्टीट्यूड विषय" },
  "aptFamily.subjectMeta": {
    en: "{chapters} chapters · {sets} sets · {questions} questions",
    hi: "{chapters} अध्याय · {sets} सेट · {questions} प्रश्न",
  },
  "aptSubject.h1": {
    en: "{subject} for {exams}",
    hi: "{exams} के लिए {subject}",
  },
  "aptSubject.lede": {
    en: "{chapters} chapters, {sets} practice sets and {questions} solved questions.",
    hi: "{chapters} अध्याय, {sets} अभ्यास सेट और {questions} हल किए गए प्रश्न।",
  },
  // topic.chaptersHeading already says "Chapters in this subject"; the strings
  // test rejects two keys sharing an English value.
  "aptSubject.chaptersHeading": { en: "Every chapter, with its sets", hi: "हर अध्याय, उसके सेट सहित" },
  // The two chapter H1s. The first is used only when a method note is actually
  // authored for the chapter; the second is what every chapter renders today.
  "aptChapter.h1Method": {
    en: "{chapter}: formula, shortcuts & practice questions for {exams}",
    hi: "{chapter}: {exams} के लिए सूत्र, शॉर्टकट और अभ्यास प्रश्न",
  },
  "aptChapter.h1Plain": {
    en: "{chapter} practice questions for {exams}",
    hi: "{exams} के लिए {chapter} अभ्यास प्रश्न",
  },
  "aptChapter.lede": {
    en: "{sets} practice sets and {questions} questions on {chapter}, each with a full solution and the shortcut where one exists.",
    hi: "{chapter} पर {sets} अभ्यास सेट और {questions} प्रश्न — हर एक का पूरा हल और जहाँ है वहाँ शॉर्टकट।",
  },
  "aptChapter.formulaHeading": { en: "The formula", hi: "सूत्र" },
  "aptChapter.exampleHeading": { en: "Worked example", hi: "हल किया गया उदाहरण" },
  "aptChapter.mistakesHeading": { en: "Mistakes that cost marks", hi: "अंक गँवाने वाली गलतियाँ" },
  "aptChapter.typesHeading": { en: "Question types and sets", hi: "प्रश्न प्रकार और सेट" },
  "aptChapter.typeMeta": { en: "{sets} sets in this type", hi: "इस प्रकार में {sets} सेट" },
  "aptChapter.relatedHeading": { en: "More chapters in this subject", hi: "इस विषय के और अध्याय" },
  "aptChapter.examsHeading": { en: "Exams that ask this", hi: "इसे पूछने वाली परीक्षाएँ" },
  "aptChapter.hindiPartial": {
    en: "Some sets in this chapter are English-only for now.",
    hi: "इस अध्याय के कुछ सेट अभी केवल अंग्रेज़ी में हैं।",
  },
  "aptSet.h1": { en: "{chapter} — {type}, Set {n}", hi: "{chapter} — {type}, सेट {n}" },
  "aptSet.lede": {
    en: "{total} solved questions with the full method, the shortcut where one exists, and the trap to avoid.",
    hi: "{total} हल किए गए प्रश्न — पूरी विधि, जहाँ है वहाँ शॉर्टकट, और बचने योग्य गलती।",
  },

  // ── Task 10: English ──
  /* The section segment in the URL is the manifest KEY (english, english_full,
     english_basic), not topicSlug(key) — those underscored paths are the ones
     already indexed by Google, and spec §4.2 is that no existing URL moves. */
  "english.h1": {
    en: "English grammar practice: {chapters} chapters, {questions} questions with answers",
    hi: "अंग्रेज़ी व्याकरण अभ्यास: {chapters} अध्याय, {questions} प्रश्न उत्तर सहित",
  },
  "english.lede": {
    en: "Synonyms, antonyms, idioms, error spotting, comprehension and more — every set solved, free, for SSC, Railway, Police and Bank exams.",
    hi: "पर्यायवाची, विलोम, मुहावरे, त्रुटि खोज, पठन बोध और बहुत कुछ — SSC, रेलवे, पुलिस और बैंक परीक्षाओं के लिए हर सेट हल सहित, निःशुल्क।",
  },
  "english.sectionMeta": {
    en: "{chapters} chapters · {questions} questions",
    hi: "{chapters} अध्याय · {questions} प्रश्न",
  },
  /* Only english_basic carries Hindi today; the other two trees are
     English-only at the source, so this note is what a Hindi reader sees on
     their section card instead of a link that leads to English text. */
  "english.englishOnly": { en: "English-only for now", hi: "अभी केवल अंग्रेज़ी में" },
  "english.backToAll": { en: "All English sections", hi: "सभी अंग्रेज़ी अनुभाग" },

  // ── Task 10: current affairs ──
  "ca.h1": {
    en: "Current affairs {month}: {questions} daily questions with answers",
    hi: "करेंट अफेयर्स {month}: {questions} दैनिक प्रश्न उत्तर सहित",
  },
  "ca.lede": {
    en: "One solved set every day, plus a month-by-month compilation you can revise in one sitting.",
    hi: "हर दिन एक हल किया सेट, साथ ही महीनेवार संकलन जिसे एक ही बैठक में दोहराया जा सके।",
  },
  "ca.thisMonthHeading": { en: "This month, day by day", hi: "इस महीने, दिन-प्रतिदिन" },
  "ca.recentHeading": { en: "The last 30 days", hi: "पिछले 30 दिन" },
  "ca.monthlyHeading": { en: "Month-by-month compilations", hi: "महीनेवार संकलन" },
  /* The per-day count line reuses pyqExam.paperMeta ("{questions} questions"),
     which already says exactly this; the strings test rejects a duplicate. */
  "ca.monthMeta": { en: "{days} days · {questions} questions", hi: "{days} दिन · {questions} प्रश्न" },
  "ca.dayH1": { en: "Current affairs {date}: {questions} questions with answers", hi: "करेंट अफेयर्स {date}: {questions} प्रश्न उत्तर सहित" },
  "ca.dayLede": {
    en: "The day's {questions} current-affairs questions, each with the answer and why it is the answer.",
    hi: "दिन के {questions} करेंट अफेयर्स प्रश्न, हर एक का उत्तर और उसका कारण सहित।",
  },
  "ca.monthH1": {
    en: "Current affairs {month}: all {questions} questions from {days} days",
    hi: "करेंट अफेयर्स {month}: {days} दिनों के सभी {questions} प्रश्न",
  },
  "ca.monthLede": {
    en: "Every question published in {month}, on one page, in date order — revise the whole month without opening 30 pages.",
    hi: "{month} में प्रकाशित हर प्रश्न, एक ही पृष्ठ पर, तिथि क्रम में — 30 पृष्ठ खोले बिना पूरा महीना दोहराएँ।",
  },
  "ca.jumpHeading": { en: "Jump to a day", hi: "किसी दिन पर जाएँ" },
  "ca.backToIndex": { en: "All current affairs", hi: "सभी करेंट अफेयर्स" },
  "ca.monthLink": { en: "Full month on one page", hi: "पूरा महीना एक पृष्ठ पर" },

  // ── Task 10: articles ──
  "articles.h1": { en: "{articles} study articles for competitive exams", hi: "प्रतियोगी परीक्षाओं के लिए {articles} अध्ययन लेख" },
  "articles.lede": {
    en: "Strategy, syllabus breakdowns, day-to-day tips and the stories of people who cleared — written for aspirants, free to read.",
    hi: "रणनीति, पाठ्यक्रम विश्लेषण, रोज़मर्रा के सुझाव और चयनित अभ्यर्थियों की कहानियाँ — अभ्यर्थियों के लिए लिखे, पढ़ने में निःशुल्क।",
  },
  "articles.backToAll": { en: "All articles", hi: "सभी लेख" },
  "articles.readTime": { en: "{minutes} min read", hi: "{minutes} मिनट का पठन" },
  "articles.categoryMeta": { en: "{articles} articles", hi: "{articles} लेख" },
  /* The five real categories in gk/articles/index.json. Derived grouping, but
     a category needs a human label in both languages, the way pyqCat.* does. */
  "artCat.strategy": { en: "Strategy", hi: "रणनीति" },
  "artCat.motivation": { en: "Motivation", hi: "प्रेरणा" },
  "artCat.syllabus": { en: "Syllabus guides", hi: "पाठ्यक्रम मार्गदर्शिका" },
  "artCat.tips": { en: "Study tips", hi: "अध्ययन सुझाव" },
  "artCat.success": { en: "Success stories", hi: "सफलता की कहानियाँ" },
  /* Fallback label for a category the index grows later — better than an
     untranslated raw key shown to a reader. */
  "artCat.other": { en: "More articles", hi: "और लेख" },

  // ── Apps directory (/apps and /apps/{slug}) ──
  /* The H1 takes {apps}, which is the length of the list the page has actually
     just built — never a typed-in number. When the registry is absent that is
     the count of exams with a real package, so the heading and the body agree
     by construction on both paths. */
  "apps.h1": {
    en: "{apps} free Android apps for government exams",
    hi: "सरकारी परीक्षाओं के लिए {apps} निःशुल्क Android ऐप",
  },
  "apps.lede": {
    en: "Every app is free, works offline and carries the same question bank as this site. Nothing here needs a sign-up or a subscription.",
    hi: "हर ऐप निःशुल्क है, ऑफ़लाइन चलता है और इसमें वही प्रश्न बैंक है जो इस साइट पर है। किसी भी ऐप के लिए रजिस्ट्रेशन या सब्सक्रिप्शन ज़रूरी नहीं।",
  },
  /* The one-line description synthesised per exam when the registry is absent.
     Built only from the exam's own name — no rating, no install count, no
     claim the site cannot check. Deliberately says "practice questions", not
     "previous-year papers": PYQ coverage is not universal (loadPyqExams()
     drops any exam with zero indexed papers, and the exam hub has a dedicated
     exam.pyqNone string for exactly this case) — a blanket PYQ claim here
     would have this page assert what that exam's own hub says is false
     (Task 11 review, 2026-09-08). */
  "apps.fallbackDescription": {
    en: "Free practice questions for {exam}, offline and without a sign-up.",
    hi: "{exam} के लिए निःशुल्क अभ्यास प्रश्न, ऑफ़लाइन और बिना रजिस्ट्रेशन के।",
  },
  "apps.practiceOnSite": { en: "Practice on the site", hi: "साइट पर अभ्यास करें" },
  "apps.practiceAllTopics": { en: "Browse all subjects", hi: "सभी विषय देखें" },
  "apps.none": {
    en: "The app list is being rebuilt. Every exam hub still links to its own app.",
    hi: "ऐप सूची फिर से तैयार की जा रही है। हर परीक्षा पेज अपने ऐप से अब भी जुड़ा है।",
  },

  "appPage.titleSuffix": {
    en: "{app} – Free Practice & Mock Tests",
    hi: "{app} – निःशुल्क अभ्यास और मॉक टेस्ट",
  },
  "appPage.whatsInside": { en: "What's inside", hi: "ऐप में क्या है" },
  "appPage.screenshots": { en: "Screenshots", hi: "स्क्रीनशॉट" },
  "appPage.screenshotAlt": { en: "{app} screen {n}", hi: "{app} स्क्रीन {n}" },
  "appPage.whyHeading": { en: "Why the app", hi: "ऐप क्यों" },
  "appPage.whyOffline": {
    en: "Works offline once the questions are downloaded, so a weak signal does not stop a practice session.",
    hi: "प्रश्न डाउनलोड होने के बाद ऑफ़लाइन चलता है, इसलिए कमज़ोर नेटवर्क अभ्यास नहीं रोकता।",
  },
  "appPage.whyProgress": {
    en: "Keeps your attempt history on the phone, so you can see which chapters you keep getting wrong.",
    hi: "आपकी हर कोशिश का रिकॉर्ड फ़ोन में रखता है, जिससे पता चलता है कि किन अध्यायों में बार-बार गलती हो रही है।",
  },
  "appPage.whySite": {
    en: "The website needs no install and every question on it is readable without an account.",
    hi: "वेबसाइट के लिए कुछ इंस्टॉल करने की ज़रूरत नहीं और उसका हर प्रश्न बिना खाता बनाए पढ़ा जा सकता है।",
  },
  "appPage.compareHeading": { en: "App or website", hi: "ऐप या वेबसाइट" },
  "appPage.compareSub": {
    en: "The same content either way. These are the numbers this exam actually has on the site today.",
    hi: "सामग्री दोनों जगह एक ही है। नीचे वे आँकड़े हैं जो इस परीक्षा के लिए आज साइट पर मौजूद हैं।",
  },
  "appPage.compareWhat": { en: "What", hi: "क्या" },
  "appPage.compareSite": { en: "On the website", hi: "वेबसाइट पर" },
  "appPage.compareApp": { en: "In the app", hi: "ऐप में" },
  "appPage.compareIncluded": { en: "Included", hi: "शामिल है" },
  "appPage.compareOffline": { en: "Offline practice", hi: "ऑफ़लाइन अभ्यास" },
  "appPage.compareNoInstall": { en: "No install needed", hi: "इंस्टॉल की ज़रूरत नहीं" },
  "appPage.compareYes": { en: "Yes", hi: "हाँ" },
  "appPage.compareNo": { en: "No", hi: "नहीं" },
  "appPage.exploreHeading": { en: "Practise the same questions here", hi: "यही प्रश्न यहाँ हल करें" },
  "appPage.examHubLink": { en: "{exam} exam page", hi: "{exam} परीक्षा पेज" },
  /* No appPage.pyqLink key: "{exam} previous-year papers" is already
     exam.pyqHeading, and two keys with the same English value is the collision
     the strings test refuses. The PYQ link below reuses that key. */
  "appPage.downloadHeading": { en: "Download", hi: "डाउनलोड" },
  "appPage.backToApps": { en: "All apps", hi: "सभी ऐप" },

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
