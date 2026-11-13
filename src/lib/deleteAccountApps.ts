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
  // Pages that already existed (Play Data safety forms point here) -- titles refreshed from Play 2026-11-13
  { slug: "bpsc", title: "BPSC Mock Test 2027: GK PYQ", pkg: "com.statepsc.bpsc" },
  { slug: "bpsc-tre", title: "BPSC TRE Bihar Teacher 2027", pkg: "com.gkpk.bpsctre" },
  { slug: "bihar-police", title: "Bihar Police Constable 2027 GK", pkg: "com.policegk.biharconstable" },
  { slug: "ctet", title: "CTET Mock Test 2027: GK Quiz", pkg: "com.teachgk.ctet" },
  { slug: "delhi-police", title: "Delhi Police Constable 2027 GK", pkg: "com.policegk.delhiexam" },
  { slug: "ibps-po", title: "IBPS PO Mock Test 2026", pkg: "com.bankprep.ibpspo" },
  { slug: "ibps-rrb-clerk", title: "IBPS RRB Clerk Mock Test 2026", pkg: "com.bankprep.ibpsrrbclerk" },
  { slug: "ibps-rrb-po", title: "IBPS RRB PO Mock Test 2026", pkg: "com.bankprep.ibpsrrbpo" },
  { slug: "jpsc", title: "JPSC Mock Test 2027: GK PYQ", pkg: "com.gkpk.jpsc" },
  { slug: "mptet", title: "MPTET Varg 3 Samvida Shikshak", pkg: "com.gkpk.mptet" },
  { slug: "rrb-ntpc-group-d", title: "RRB NTPC Group D GK 2027", pkg: "gk.gkquestionanswerinhindi.currentaffairs" },
  { slug: "ssc-cgl-chsl", title: "SSC CGL CHSL GK 2027", pkg: "gk.gkquestionanswerinenglish.currentaffairs" },
  { slug: "ssc-chsl", title: "SSC CHSL 2027 GK & Daily CA", pkg: "com.sscexam.chslgk" },
  { slug: "ssc-gd", title: "SSC GD Constable 2027: GK & CA", pkg: "com.sscexam.gdconstable" },
  { slug: "ssc-mts", title: "SSC MTS 2027: GK & Daily CA", pkg: "com.sscexam.mtsgk" },
  { slug: "up-jail-warder", title: "UP Jail Warder Bandi Rakshak", pkg: "com.gkpk.upjail" },
  { slug: "wbcs", title: "WBCS Mock Test 2027: GK PYQ", pkg: "com.gkpk.wbcs" },
  { slug: "upsc-cds", title: "UPSC CDS 2027: GK PYQ Quiz", pkg: "com.examprep.cds" },
  { slug: "upsc-cse", title: "UPSC CSE 2027: GK PYQ Quiz", pkg: "com.examprep.upscias" },
  { slug: "upsc-nda", title: "UPSC NDA 2027: GK PYQ Quiz", pkg: "com.examprep.nda" },
  // Added 2026-11-13: every other live GK app (Play rejected the old gkquestionsguru.com/delete-account/ link)
  { slug: "agniveer-army", title: "Agniveer Army GK 2027: Quiz", pkg: "com.gkpk.agniveer" },
  { slug: "agniveer-navy-af", title: "Agniveer Navy GK 2027: Quiz", pkg: "com.gkpk.navyagniveer" },
  { slug: "bihar-forest-guard", title: "Bihar Forest Guard 2026: GK", pkg: "com.gkpk.biharforest" },
  { slug: "bihar-jail-warder", title: "Bihar Jail Warder Exam 2026 GK", pkg: "com.gkpk.biharjail" },
  { slug: "bssc", title: "BSSC Mock Test 2027: GK Hindi", pkg: "com.gkpk.bssc" },
  { slug: "epfo-ssa-eo", title: "UPSC EPFO EO GK 2027: Quiz", pkg: "com.gkpk.epfo" },
  { slug: "fci-manager", title: "FCI GK 2027: Mock Test", pkg: "com.gkpk.fci" },
  { slug: "gk-english", title: "200000 GK Questions in English", pkg: "gk.gkquestionsinenglish.currentaffairs" },
  { slug: "gk-hindi-english", title: "Current Affairs & GK 2027", pkg: "gk.gkinhindi.currentaffairs" },
  { slug: "gk-hindi-english-2", title: "GK in Hindi & English 2027", pkg: "gkquestions.gkinhindi.currentaffairs" },
  { slug: "gram-panchayat-vdo", title: "Rajasthan VDO Gram Sevak 2026", pkg: "com.gkpk.vdo" },
  { slug: "gujarat-police", title: "Gujarat Police GK 2027", pkg: "com.gkpk.gujaratpolice" },
  { slug: "haryana-forest-guard", title: "Haryana Forest Guard 2027: GK", pkg: "com.gkpk.haryanaforest" },
  { slug: "haryana-police", title: "Haryana Police Mock Test 2027", pkg: "com.policegk.haryana" },
  { slug: "hpsc-hcs", title: "HPSC HCS Mock Test 2027: GK", pkg: "com.gkpk.hpschcs" },
  { slug: "ib-acio", title: "IB ACIO GK 2027: Mock Test", pkg: "com.gkpk.ibacio" },
  { slug: "jharkhand-forest-guard", title: "Jharkhand Forest Guard 2027 GK", pkg: "com.gkpk.jhforest" },
  { slug: "kvs-nvs", title: "KVS NVS Mock Test 2027", pkg: "com.gkpk.kvsnvs" },
  { slug: "lucent-gk", title: "General Science & GK 2027", pkg: "gkquestions.lucentgk.currentaffairs" },
  { slug: "maharashtra-police", title: "Maharashtra Police GK 2027", pkg: "com.gkpk.maharashtrapolice" },
  { slug: "mp-police", title: "MP Police Mock Test 2027: GK", pkg: "com.policegk.mp" },
  { slug: "mpesb-vyapam", title: "MP GK in Hindi 2027 MPESB", pkg: "com.gkpk.mpvyapam" },
  { slug: "mppsc", title: "MPPSC Mock Test 2027: GK PYQ", pkg: "com.gkpk.mppsc" },
  { slug: "raj-forest-guard", title: "Rajasthan Vanpal Vanrakshak GK", pkg: "com.gkpk.rajforest" },
  { slug: "rajasthan-police", title: "Rajasthan Police Test 2027: GK", pkg: "com.policegk.rajasthan" },
  { slug: "reet", title: "REET Mock Test 2027: GK Hindi", pkg: "com.teachgk.reet" },
  { slug: "rpf-constable", title: "RPF Constable 2027: GK Quiz", pkg: "com.gkpk.rpf" },
  { slug: "rpsc-ras", title: "RPSC RAS Mock Test 2027: GK", pkg: "com.gkpk.rpscras" },
  { slug: "rrb-alp", title: "RRB ALP GK 2027: Mock Test", pkg: "com.railwaygk.alp" },
  { slug: "rrb-group-d", title: "RRB Group D 2027 GK & Science", pkg: "com.railwaygk.groupd" },
  { slug: "rrb-ntpc", title: "RRB NTPC GK 2027 (Hindi/Eng)", pkg: "com.railwaygk.ntpc" },
  { slug: "sahi-jawab", title: "Sahi Jawab: GK Current Affairs", pkg: "com.gkpkhindi.studyvirus" },
  { slug: "ssc-cgl", title: "SSC CGL 2027 GK & Daily CA", pkg: "com.sscexam.cglgk" },
  { slug: "ssc-cpo", title: "SSC CPO 2027: GK & CA Tests", pkg: "com.sscexam.cpogk" },
  { slug: "stet-bihar", title: "Bihar STET Mock Test 2026: GK", pkg: "com.gkpk.biharstet" },
  { slug: "super-tet", title: "Super TET Mock Test 2027: GK", pkg: "com.gkpk.supertet" },
  { slug: "ugc-net", title: "UGC NET Mock Test 2027: GK", pkg: "com.gkpk.ugcnet" },
  { slug: "ukpsc", title: "UKPSC Mock Test 2027: GK PYQ", pkg: "com.gkpk.ukpsc" },
  { slug: "up-bihar-police", title: "UP Bihar Police GK 2027", pkg: "gk.gkquestionsinhindi.currentaffairs" },
  { slug: "up-forest-guard", title: "UPSSSC Forest Guard 2027 GK", pkg: "com.gkpk.upforest" },
  { slug: "up-lekhpal", title: "UP Lekhpal 2027 GK Mock Test", pkg: "com.gkpk.uplekhpal" },
  { slug: "up-police", title: "UP Police Constable 2027 GK+CA", pkg: "com.policegk.upconstable" },
  { slug: "uppsc", title: "UPPSC Mock Test 2027: GK PYQ", pkg: "com.statepsc.uppsc" },
  { slug: "upsc-capf", title: "UPSC CAPF 2027: GK PYQ Quiz", pkg: "com.examprep.capf" },
  { slug: "upsssc-pet", title: "UPSSSC PET Mock Test 2027: GK", pkg: "com.gkpk.upssscpet" },
  { slug: "uptet", title: "UPTET Mock Test 2027: GK Quiz", pkg: "com.teachgk.uptet" },
];
