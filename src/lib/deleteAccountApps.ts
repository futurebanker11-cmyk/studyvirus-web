// Apps whose Play Data safety form points to /delete-account/<slug>.
// `title` must be the EXACT title shown on the Google Play listing -- Play's
// policy check looks for the app name / developer name on the deletion page.
export interface DeleteAccountApp {
  slug: string;
  title: string;
  pkg: string;
}

export const DEVELOPER_NAME = "Prepfield";
// Play shows one of these as the developer; list all so the page always matches.
export const LEGAL_NAME = "Manmeet Ishan / Manmeet Kumar, StudyVirus";
export const SUPPORT_EMAIL = "support@gkquestionsguru.com";

export const DELETE_ACCOUNT_APPS: DeleteAccountApp[] = [
  { slug: "bpsc", title: "BPSC Mock Test 2026: GK PYQ", pkg: "com.statepsc.bpsc" },
  { slug: "bpsc-tre", title: "BPSC TRE Bihar Teacher 2026", pkg: "com.gkpk.bpsctre" },
  { slug: "bihar-police", title: "Bihar Police Constable 2026 GK", pkg: "com.policegk.biharconstable" },
  { slug: "ctet", title: "CTET Mock Test 2026: GK Quiz", pkg: "com.teachgk.ctet" },
  { slug: "delhi-police", title: "Delhi Police Constable 2026 GK", pkg: "com.policegk.delhiexam" },
  { slug: "ibps-po", title: "IBPS PO Mock Test 2026", pkg: "com.bankprep.ibpspo" },
  { slug: "ibps-rrb-clerk", title: "IBPS RRB Clerk Mock Test 2026", pkg: "com.bankprep.ibpsrrbclerk" },
  { slug: "ibps-rrb-po", title: "IBPS RRB PO Mock Test 2026", pkg: "com.bankprep.ibpsrrbpo" },
  { slug: "jpsc", title: "JPSC Mock Test 2026: GK PYQ", pkg: "com.gkpk.jpsc" },
  { slug: "mptet", title: "MPTET Varg 3 Samvida Shikshak", pkg: "com.gkpk.mptet" },
  { slug: "rrb-ntpc-group-d", title: "RRB NTPC Group D GK 2026", pkg: "gk.gkquestionanswerinhindi.currentaffairs" },
  { slug: "ssc-cgl-chsl", title: "SSC CGL CHSL GK 2026", pkg: "gk.gkquestionanswerinenglish.currentaffairs" },
  { slug: "ssc-chsl", title: "SSC CHSL 2026 GK & Daily CA", pkg: "com.sscexam.chslgk" },
  { slug: "ssc-gd", title: "SSC GD Constable 2026: GK & CA", pkg: "com.sscexam.gdconstable" },
  { slug: "ssc-mts", title: "SSC MTS 2026: GK & Daily CA", pkg: "com.sscexam.mtsgk" },
  { slug: "up-jail-warder", title: "UP Jail Warder Bandi Rakshak", pkg: "com.gkpk.upjail" },
  { slug: "wbcs", title: "WBCS Mock Test 2026: GK PYQ", pkg: "com.gkpk.wbcs" },
  // Flagged separately by Play (later deadlines)
  { slug: "upsc-cds", title: "UPSC CDS 2026: GK PYQ Quiz", pkg: "com.examprep.cds" },
  { slug: "upsc-cse", title: "UPSC CSE 2026: GK PYQ Quiz", pkg: "com.examprep.upscias" },
  { slug: "upsc-nda", title: "UPSC NDA 2026: GK PYQ Quiz", pkg: "com.examprep.nda" },
];
