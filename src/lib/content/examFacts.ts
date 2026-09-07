import type { Exam } from "@/lib/exams";
import { EXAMS } from "@/lib/exams";
import { GK_APPS } from "@/lib/gkApps";

export interface ExamFacts { body: string; bodyHi: string; stages: string[]; stagesHi: string[] }

const F = (body: string, bodyHi: string, stages: string[], stagesHi: string[]): ExamFacts => ({ body, bodyHi, stages, stagesHi });
const RRB = ["Railway Recruitment Boards (RRB)", "रेलवे भर्ती बोर्ड (RRB)"] as const;
const SSC = ["Staff Selection Commission (SSC)", "कर्मचारी चयन आयोग (SSC)"] as const;
const UPSC = ["Union Public Service Commission (UPSC)", "संघ लोक सेवा आयोग (UPSC)"] as const;
const IBPS = ["Institute of Banking Personnel Selection (IBPS)", "बैंकिंग कार्मिक चयन संस्थान (IBPS)"] as const;
const PMI = ["Prelims", "Mains", "Interview"], PMI_HI = ["प्रारंभिक", "मुख्य", "साक्षात्कार"];
const PM = ["Prelims", "Mains"], PM_HI = ["प्रारंभिक", "मुख्य"];
const WP = ["Written exam", "Physical test (PET/PST)"], WP_HI = ["लिखित परीक्षा", "शारीरिक परीक्षा (PET/PST)"];
const W = ["Written exam"], W_HI = ["लिखित परीक्षा"];

export const EXAM_FACTS: Record<string, ExamFacts> = {
  rrb_ntpc: F(RRB[0], RRB[1], ["CBT 1", "CBT 2", "Typing / CBAT", "Document verification"], ["CBT 1", "CBT 2", "टाइपिंग / CBAT", "दस्तावेज़ सत्यापन"]),
  rrb_group_d: F(RRB[0], RRB[1], ["CBT", "PET", "Document verification"], ["CBT", "PET", "दस्तावेज़ सत्यापन"]),
  rrb_alp: F(RRB[0], RRB[1], ["CBT 1", "CBT 2", "CBAT", "Document verification"], ["CBT 1", "CBT 2", "CBAT", "दस्तावेज़ सत्यापन"]),
  rpf_constable: F("Railway Recruitment Boards (RRB)", RRB[1], ["CBT", "PET / PMT", "Document verification"], ["CBT", "PET / PMT", "दस्तावेज़ सत्यापन"]),
  ssc_cgl: F(SSC[0], SSC[1], ["Tier 1", "Tier 2"], ["टियर 1", "टियर 2"]),
  ssc_chsl: F(SSC[0], SSC[1], ["Tier 1", "Tier 2 (incl. typing / DEST)"], ["टियर 1", "टियर 2 (टाइपिंग / DEST सहित)"]),
  ssc_mts: F(SSC[0], SSC[1], ["CBT (Session 1 & 2)", "PET / PST (Havaldar)"], ["CBT (सत्र 1 और 2)", "PET / PST (हवलदार)"]),
  ssc_gd: F(SSC[0], SSC[1], ["CBT", "PET / PST", "Medical"], ["CBT", "PET / PST", "मेडिकल"]),
  ssc_cpo: F(SSC[0], SSC[1], ["Paper 1", "PET / PST", "Paper 2", "Medical"], ["पेपर 1", "PET / PST", "पेपर 2", "मेडिकल"]),
  delhi_police: F(SSC[0], SSC[1], ["CBT", "PE & MT"], ["CBT", "PE और MT"]),
  up_police: F("UP Police Recruitment & Promotion Board (UPPRPB)", "उ.प्र. पुलिस भर्ती एवं प्रोन्नति बोर्ड (UPPRPB)", ["Written exam", "PST / PET", "Document verification"], ["लिखित परीक्षा", "PST / PET", "दस्तावेज़ सत्यापन"]),
  bihar_police: F("Central Selection Board of Constable (CSBC), Bihar", "केंद्रीय चयन पर्षद (सिपाही भर्ती), बिहार", WP, WP_HI),
  haryana_police: F("Haryana Staff Selection Commission (HSSC)", "हरियाणा कर्मचारी चयन आयोग (HSSC)", ["CET", "Knowledge test", "PST / PMT"], ["CET", "ज्ञान परीक्षा", "PST / PMT"]),
  rajasthan_police: F("Rajasthan Police Recruitment Board", "राजस्थान पुलिस भर्ती बोर्ड", WP, WP_HI),
  mp_police: F("MP Employees Selection Board (MPESB)", "म.प्र. कर्मचारी चयन मंडल (MPESB)", ["Paper 1 (Paper 2 for technical posts)", "PET / PMT"], ["पेपर 1 (तकनीकी पदों के लिए पेपर 2)", "PET / PMT"]),
  gujarat_police: F("Lokrakshak Recruitment Board (LRB), Gujarat", "लोकरक्षक भर्ती बोर्ड (LRB), गुजरात", WP, WP_HI),
  maharashtra_police: F("Maharashtra Police (unit-wise recruitment)", "महाराष्ट्र पुलिस (इकाईवार भर्ती)", WP, WP_HI),
  nda: F(UPSC[0], UPSC[1], ["Written (Maths, GAT)", "SSB interview"], ["लिखित (गणित, GAT)", "SSB साक्षात्कार"]),
  upsc_cds: F(UPSC[0], UPSC[1], ["Written (English, GK, Maths)", "SSB interview"], ["लिखित (अंग्रेज़ी, GK, गणित)", "SSB साक्षात्कार"]),
  upsc_capf: F(UPSC[0], UPSC[1], ["Paper 1", "Paper 2", "PET", "Interview"], ["पेपर 1", "पेपर 2", "PET", "साक्षात्कार"]),
  agniveer_army: F("Indian Army", "भारतीय सेना", ["Online CEE", "Physical test", "Medical"], ["ऑनलाइन CEE", "शारीरिक परीक्षा", "मेडिकल"]),
  agniveer_navy_af: F("Indian Navy / Indian Air Force", "भारतीय नौसेना / वायुसेना", ["Online exam", "Physical fitness test", "Medical"], ["ऑनलाइन परीक्षा", "शारीरिक दक्षता परीक्षा", "मेडिकल"]),
  aissee_sainik: F("National Testing Agency (NTA)", "राष्ट्रीय परीक्षा एजेंसी (NTA)", ["Written (AISSEE)", "Medical"], ["लिखित (AISSEE)", "मेडिकल"]),
  upsc_cse: F(UPSC[0], UPSC[1], PMI, PMI_HI),
  ib_acio: F("Intelligence Bureau, Ministry of Home Affairs", "आसूचना ब्यूरो, गृह मंत्रालय", ["Tier 1", "Tier 2", "Interview"], ["टियर 1", "टियर 2", "साक्षात्कार"]),
  ctet: F("Central Board of Secondary Education (CBSE)", "केंद्रीय माध्यमिक शिक्षा बोर्ड (CBSE)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  kvs_nvs: F("Kendriya Vidyalaya Sangathan / Navodaya Vidyalaya Samiti", "केंद्रीय विद्यालय संगठन / नवोदय विद्यालय समिति", ["Written exam", "Interview"], ["लिखित परीक्षा", "साक्षात्कार"]),
  ugc_net: F("National Testing Agency (NTA)", "राष्ट्रीय परीक्षा एजेंसी (NTA)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  uptet: F("UP Basic Education Board (UPBEB)", "उ.प्र. बेसिक शिक्षा परिषद (UPBEB)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  stet_bihar: F("Bihar School Examination Board (BSEB)", "बिहार विद्यालय परीक्षा समिति (BSEB)", ["Paper 1", "Paper 2"], ["पेपर 1", "पेपर 2"]),
  super_tet: F("UP Basic Education Board (UPBEB)", "उ.प्र. बेसिक शिक्षा परिषद (UPBEB)", W, W_HI),
  reet: F("Board of Secondary Education, Rajasthan (BSER)", "माध्यमिक शिक्षा बोर्ड, राजस्थान (BSER)", ["Level 1", "Level 2"], ["लेवल 1", "लेवल 2"]),
  bpsc_tre: F("Bihar Public Service Commission (BPSC)", "बिहार लोक सेवा आयोग (BPSC)", W, W_HI),
  mptet: F("MP Employees Selection Board (MPESB)", "म.प्र. कर्मचारी चयन मंडल (MPESB)", W, W_HI),
  uppsc: F("Uttar Pradesh Public Service Commission (UPPSC)", "उत्तर प्रदेश लोक सेवा आयोग (UPPSC)", PMI, PMI_HI),
  bpsc: F("Bihar Public Service Commission (BPSC)", "बिहार लोक सेवा आयोग (BPSC)", PMI, PMI_HI),
  rpsc_ras: F("Rajasthan Public Service Commission (RPSC)", "राजस्थान लोक सेवा आयोग (RPSC)", PMI, PMI_HI),
  mppsc: F("Madhya Pradesh Public Service Commission (MPPSC)", "मध्य प्रदेश लोक सेवा आयोग (MPPSC)", PMI, PMI_HI),
  hpsc_hcs: F("Haryana Public Service Commission (HPSC)", "हरियाणा लोक सेवा आयोग (HPSC)", PMI, PMI_HI),
  ukpsc: F("Uttarakhand Public Service Commission (UKPSC)", "उत्तराखंड लोक सेवा आयोग (UKPSC)", PMI, PMI_HI),
  wbcs: F("West Bengal Public Service Commission (WBPSC)", "पश्चिम बंगाल लोक सेवा आयोग (WBPSC)", PMI, PMI_HI),
  jpsc: F("Jharkhand Public Service Commission (JPSC)", "झारखंड लोक सेवा आयोग (JPSC)", PMI, PMI_HI),
  upsssc_pet: F("UP Subordinate Services Selection Commission (UPSSSC)", "उ.प्र. अधीनस्थ सेवा चयन आयोग (UPSSSC)", ["Preliminary Eligibility Test (PET)"], ["प्रारंभिक अर्हता परीक्षा (PET)"]),
  upsssc_lower: F("UP Subordinate Services Selection Commission (UPSSSC)", "उ.प्र. अधीनस्थ सेवा चयन आयोग (UPSSSC)", PM, PM_HI),
  bssc: F("Bihar Staff Selection Commission (BSSC)", "बिहार कर्मचारी चयन आयोग (BSSC)", PM, PM_HI),
  rsmssb: F("Rajasthan Staff Selection Board (RSMSSB)", "राजस्थान कर्मचारी चयन बोर्ड (RSMSSB)", W, W_HI),
  mpesb_vyapam: F("MP Employees Selection Board (MPESB / Vyapam)", "म.प्र. कर्मचारी चयन मंडल (MPESB / व्यापम)", W, W_HI),
  up_forest_guard: F("UPSSSC", "UPSSSC", WP, WP_HI),
  raj_forest_guard: F("RSMSSB", "RSMSSB", WP, WP_HI),
  mp_forest_guard: F("MPESB", "MPESB", WP, WP_HI),
  jharkhand_forest_guard: F("JSSC", "JSSC", WP, WP_HI),
  bihar_forest_guard: F("CSBC, Bihar", "CSBC, बिहार", WP, WP_HI),
  haryana_forest_guard: F("HSSC", "HSSC", WP, WP_HI),
  raj_jail_prahari: F("RSMSSB", "RSMSSB", WP, WP_HI),
  bihar_jail_warder: F("CSBC, Bihar", "CSBC, बिहार", WP, WP_HI),
  up_jail_prahari: F("UPPRPB", "UPPRPB", WP, WP_HI),
  mp_jail_prahari: F("MPESB", "MPESB", WP, WP_HI),
  up_lekhpal: F("UPSSSC", "UPSSSC", ["Written exam (after PET)"], ["लिखित परीक्षा (PET के बाद)"]),
  raj_patwari: F("RSMSSB", "RSMSSB", W, W_HI),
  mp_patwari: F("MPESB", "MPESB", W, W_HI),
  haryana_patwari: F("HSSC", "HSSC", ["CET", "Written exam"], ["CET", "लिखित परीक्षा"]),
  gram_panchayat_vdo: F("UPSSSC", "UPSSSC", ["Written exam", "Interview (where applicable)"], ["लिखित परीक्षा", "साक्षात्कार (जहाँ लागू)"]),
  gram_sevak: F("state rural development boards", "राज्य ग्रामीण विकास बोर्ड", W, W_HI),
  epfo_ssa_eo: F("the UPSC on behalf of EPFO", "EPFO की ओर से UPSC", ["Written exam", "Interview"], ["लिखित परीक्षा", "साक्षात्कार"]),
  fci_manager: F("Food Corporation of India (FCI)", "भारतीय खाद्य निगम (FCI)", ["Phase 1", "Phase 2", "Interview"], ["चरण 1", "चरण 2", "साक्षात्कार"]),
  agriculture_supervisor: F("RSMSSB", "RSMSSB", W, W_HI),
  ibps_afo: F(IBPS[0], IBPS[1], PMI, PMI_HI),
  labour_inspector: F("state labour departments", "राज्य श्रम विभाग", W, W_HI),
  sbi_clerk: F("State Bank of India (SBI)", "भारतीय स्टेट बैंक (SBI)", PM, PM_HI),
  sbi_po: F("State Bank of India (SBI)", "भारतीय स्टेट बैंक (SBI)", ["Prelims", "Mains", "Psychometric test, GD & Interview"], ["प्रारंभिक", "मुख्य", "साइकोमेट्रिक टेस्ट, GD और साक्षात्कार"]),
  ibps_clerk: F(IBPS[0], IBPS[1], PM, PM_HI),
  ibps_po: F(IBPS[0], IBPS[1], PMI, PMI_HI),
  ibps_rrb_clerk: F(IBPS[0], IBPS[1], PM, PM_HI),
  ibps_rrb_po: F(IBPS[0], IBPS[1], PMI, PMI_HI),
};

const GENERIC: ExamFacts = F("the conducting body", "आयोजक संस्था", W, W_HI);

export function factsFor(examId: string): ExamFacts {
  return EXAM_FACTS[examId] ?? GENERIC;
}

export const BANK_APP_PACKAGES: Record<string, string> = {
  sbi_clerk: "com.bankprep.sbiclerk",
  sbi_po: "com.bankprep.sbipo",
  ibps_clerk: "com.bankprep.ibpsclerk",
  ibps_po: "com.bankprep.ibpspo",
  ibps_rrb_clerk: "com.bankprep.ibpsrrbclerk",
  ibps_rrb_po: "com.bankprep.ibpsrrbpo",
};

export function appPackageFor(examId: string): string | null {
  const gk = GK_APPS.find((a) => a.id === examId);
  return gk?.packageName ?? BANK_APP_PACKAGES[examId] ?? null;
}

export function cbtPortalFor(examId: string): string | null {
  const gk = GK_APPS.find((a) => a.id === examId && a.hasMocks);
  return gk?.slug ?? null;
}

export function pyqSlugOverrides(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const e of EXAMS) out[e.id] = e.slug;
  return out;
}

// The exam's full name is shown as a parenthetical after its short name, but for
// many exams (UPPSC, BPSC, BSSC …) that full name IS the conducting body, so the
// sentence would restate itself: "UPPSC (Uttar Pradesh Public Service Commission)
// is conducted by Uttar Pradesh Public Service Commission (UPPSC)". Suppress the
// parenthetical when the full name is EQUIVALENT to the body — compared ignoring
// case and any trailing acronym parenthetical — or when it adds nothing to the
// short name. Mere containment is not enough: "Staff Selection Commission" sits
// inside "Staff Selection Commission Combined Graduate Level", yet there the full
// name identifies the exam while the body identifies its conductor, and both earn
// their place in the sentence.
// `fullName` is English in both renderings, so the comparison is always made
// against the English body — otherwise the Hindi intro would keep a parenthetical
// the English one correctly drops, and the tautology would ship on half the pages.
function qualifier(exam: Exam, shortName: string): string {
  const bare = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
  const full = bare(exam.fullName);
  if (!full) return "";
  if (full === bare(shortName)) return "";
  if (full === bare(factsFor(exam.id).body)) return "";
  return ` (${exam.fullName})`;
}

export function examIntro(exam: Exam, lang: "en" | "hi", n: { chapters: number; papers: number }): string {
  const f = factsFor(exam.id);
  if (lang === "hi") {
    const stages = f.stagesHi.join(", ");
    const papers = n.papers > 0 ? ` और ${n.papers} पिछले वर्ष के प्रश्नपत्र` : "";
    const q = qualifier(exam, exam.hi);
    return `${exam.hi}${q} का आयोजन ${f.bodyHi} द्वारा किया जाता है। चयन के चरण: ${stages}। यहाँ ${n.chapters} अध्याय${papers} हिंदी और अंग्रेज़ी में, उत्तर और व्याख्या सहित, निःशुल्क उपलब्ध हैं।`;
  }
  const stages = f.stages.join(", ");
  const papers = n.papers > 0 ? ` and ${n.papers} previous-year papers` : "";
  const q = qualifier(exam, exam.en);
  return `${exam.en}${q} is conducted by ${f.body}. Selection stages: ${stages}. Practice ${n.chapters} chapters${papers} free, in Hindi and English, with answers and explanations.`;
}
