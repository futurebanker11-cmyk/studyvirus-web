// How /topics arranges its 62 browsable subjects.
//
// The manifest (gk/topics.json, 66 topics as of 2026-09-08) has no grouping
// field of its own — it is a flat list in app-screen order. A flat list of 62
// cards is not a page anyone can scan, so the site groups them here.
//
// This is EDITORIAL, not derived, and deliberately so: no field in the
// manifest distinguishes "Bihar GK" from "Police GK" (both end `_gk`) or
// "Biotechnology" from "Labour Laws". Deriving a grouping from the key's
// suffix would put Police GK and Defence GK — which are subject areas, not
// places — into the state column beside Bihar and UP. So the mapping is
// written down, one line per topic, where a reader of this file can see and
// argue with every call.
//
// `general` is the DEFAULT: an unmapped key falls there rather than
// disappearing, so a topic added to the manifest tomorrow still lists on
// /topics without a code change. That is the whole reason the default exists —
// groupOf() is never allowed to return undefined.
//
// ── Which topics ever reach this file ──
//
// Only the ones visibleTopics() returns. That function (src/lib/content/
// topics.ts) already drops:
//   • `current_affairs` — screen: "CurrentAffairs", it has its own section
//   • `english`, `english_full`, `english_basic` — ENGLISH_KEYS, they have
//     their own /english tree
//   • anything with `hiddenFromList`, or with no chapter in the content index
// which is 66 − 4 = 62 today. Those four are therefore NOT mapped below; a
// mapping for them would be dead code that reads as if English were meant to
// appear here.
//
// `general_hindi` (Hindi grammar: संज्ञा, सर्वनाम, …) IS visible — it is not
// in ENGLISH_KEYS — so it is mapped, under `general`. It is a language paper
// like any other GK subject on these exams, not a pedagogy subject.

export type TopicGroup = "general" | "science" | "state" | "specialist";

export const TOPIC_GROUPS: Record<string, TopicGroup> = {
  // ── state ──
  // Geographic GK papers, one per state or UT. Every one of these exists
  // because a state's own recruitment board sets a paper on that state.
  // NOTE: `police_gk` and `defence_gk` end in `_gk` too and are NOT here —
  // they are subject areas set by many boards across the country, not places.
  bihar_gk: "state",
  up_gk: "state",
  rajasthan_gk: "state",
  mp_gk: "state",
  maharashtra_gk: "state",
  gujarat_gk: "state",
  haryana_gk: "state",
  jharkhand_gk: "state",
  delhi_gk: "state",
  west_bengal_gk: "state",
  uttarakhand_gk: "state",
  odisha_gk: "state",

  // ── science ──
  // The three school-science papers plus the two applied sciences that are
  // taught and examined as science rather than as policy.
  physics: "science",
  chemistry: "science",
  biology: "science",
  // Biotechnology is a biology paper by another name (genetic engineering,
  // tissue culture, vaccines) and sits with biology, not with technology —
  // `technology` on this site is general science-and-tech current affairs.
  biotechnology: "science",
  // Agriculture Science is the crop-science paper (soil, agronomy, plant
  // breeding) set by agriculture-officer exams. Distinct from `agriculture`,
  // which is the "Indian Agriculture" GK paper — cropping patterns, schemes,
  // green revolution — and stays in `general` with the other GK subjects.
  agri_science: "science",
  // EVS as a PRIMARY-SCHOOL subject. This is the CTET/state-TET Paper I
  // content paper (plants, animals, water, our surroundings). Its *pedagogy*
  // half is a separate topic, `pedagogy_evs`, which is specialist. Splitting
  // them this way means a CTET candidate finds the content paper beside the
  // other science subjects and the teaching-method paper beside the other
  // teaching-method papers — which is how the exam itself splits them.
  evs_primary: "science",

  // ── specialist ──
  // Papers that belong to one professional stream rather than to general
  // knowledge: teacher recruitment, banking/insurance officers, and the
  // administration-and-law papers of the PSC mains.
  cdp: "specialist",
  pedagogy_maths: "specialist",
  pedagogy_evs: "specialist",
  pedagogy_language: "specialist",
  nep_education: "specialist",
  insurance: "specialist",
  accounts_audit: "specialist",
  labour_laws: "specialist",
  public_admin: "specialist",
  internal_security: "specialist",
  // Revenue & Panchayati Raj is the patwari/lekhpal/VDO paper — land records,
  // revenue administration, panchayat structure. Set by one narrow family of
  // recruitment exams, in the same way the pedagogy papers are.
  revenue_panchayat: "specialist",
  // Defence GK — ranks, commands, equipment, operations — is set by NDA, CDS,
  // Agniveer and CAPF. Categorical, not geographic, so not `state`; and
  // narrow enough to one stream that it is not general knowledge either.
  defence_gk: "specialist",
  // Police GK is the same shape: police organisation, acts and procedure, set
  // by constable and SI recruitment. Note this is NOT the same as a state's
  // police exam ASKING general GK — that is what the state topics cover.
  police_gk: "specialist",
  // Disaster Management is the NDMA/administration paper, set almost entirely
  // in PSC mains and CAPF, not in general GK sections.
  disaster_mgmt: "specialist",
  // Economy Advanced is the mains-level economics paper (monetary policy,
  // fiscal federalism), as opposed to `economics`, the prelims GK subject.
  economy_advanced: "specialist",

  // ── general ──
  // The default bucket, and the largest: the GK subjects that appear in the
  // general-awareness section of essentially every exam on the site. Listed
  // explicitly rather than left to the default, so that /topics' four columns
  // are readable from this file alone and an accidental omission elsewhere is
  // visible as an absence here.
  history: "general",
  polity: "general",
  geography: "general",
  economics: "general",
  banking: "general",
  sports: "general",
  abbreviations: "general",
  arts: "general",
  technology: "general",
  railways: "general",
  computer: "general",
  environment: "general",
  inventions: "general",
  famous_people: "general",
  awards: "general",
  world_org: "general",
  books_authors: "general",
  famous_places: "general",
  days_years: "general",
  general_hindi: "general",
  govt_schemes: "general",
  constitution_special: "general",
  agriculture: "general",
  national_movement: "general",
  international_relations: "general",
  forest_wildlife: "general",
  cricket: "general",
  bollywood: "general",
  social_issues: "general",
};

/** The order the four groups appear in on /topics, widest audience first. */
export const GROUP_ORDER: readonly TopicGroup[] = ["general", "science", "state", "specialist"] as const;

/** Never undefined: an unmapped key is general. */
export function groupOf(topicKey: string): TopicGroup {
  return TOPIC_GROUPS[topicKey] ?? "general";
}
