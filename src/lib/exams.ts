export interface Exam {
  id: string;           // exam ID matching topics.exams[] arrays
  slug: string;         // URL slug for /exam/[slug]
  en: string;           // English name (short, for display)
  hi: string;           // Hindi name
  fullName: string;     // Full official name
  category: string;     // railway, ssc, police, defence, upsc, teaching, state_psc, state_sub, forest, jail, revenue, central, agriculture
  color: string;        // Brand color
  pyqSlug?: string;     // Matching PYQ_EXAMS slug if PYQ exists
  icon: string;         // Emoji
}

export const EXAMS: Exam[] = [
  // ── Railway ──
  { id: 'rrb_ntpc', slug: 'rrb-ntpc', en: 'RRB NTPC', hi: 'RRB NTPC', fullName: 'Railway Recruitment Board Non-Technical Popular Categories', category: 'railway', color: '#1a237e', pyqSlug: 'rrb-ntpc', icon: '🚆' },
  { id: 'rrb_group_d', slug: 'rrb-group-d', en: 'RRB Group D', hi: 'RRB ग्रुप D', fullName: 'Railway Recruitment Board Group D', category: 'railway', color: '#1b5e20', pyqSlug: 'rrb-group-d', icon: '🚆' },
  { id: 'rrb_alp', slug: 'rrb-alp', en: 'RRB ALP', hi: 'RRB ALP', fullName: 'Railway Recruitment Board Assistant Loco Pilot', category: 'railway', color: '#0d47a1', pyqSlug: 'rrb-alp', icon: '🚆' },
  { id: 'rpf_constable', slug: 'rpf', en: 'RPF', hi: 'RPF कांस्टेबल', fullName: 'Railway Protection Force Constable', category: 'railway', color: '#1b5e20', pyqSlug: 'rpf', icon: '🛡️' },

  // ── SSC ──
  { id: 'ssc_cgl', slug: 'ssc-cgl', en: 'SSC CGL', hi: 'SSC CGL', fullName: 'Staff Selection Commission Combined Graduate Level', category: 'ssc', color: '#b71c1c', pyqSlug: 'ssc-cgl', icon: '📋' },
  { id: 'ssc_chsl', slug: 'ssc-chsl', en: 'SSC CHSL', hi: 'SSC CHSL', fullName: 'Staff Selection Commission Combined Higher Secondary Level', category: 'ssc', color: '#e65100', pyqSlug: 'ssc-chsl', icon: '📋' },
  { id: 'ssc_mts', slug: 'ssc-mts', en: 'SSC MTS', hi: 'SSC MTS', fullName: 'Staff Selection Commission Multi Tasking Staff', category: 'ssc', color: '#006064', pyqSlug: 'ssc-mts', icon: '📋' },
  { id: 'ssc_gd', slug: 'ssc-gd', en: 'SSC GD', hi: 'SSC GD कांस्टेबल', fullName: 'SSC GD Constable', category: 'ssc', color: '#33691e', pyqSlug: 'ssc-gd', icon: '📋' },
  { id: 'ssc_cpo', slug: 'ssc-cpo', en: 'SSC CPO', hi: 'SSC CPO', fullName: 'SSC Central Police Organisation', category: 'ssc', color: '#4a148c', pyqSlug: 'ssc-cpo', icon: '📋' },

  // ── Police ──
  { id: 'delhi_police', slug: 'delhi-police', en: 'Delhi Police', hi: 'दिल्ली पुलिस', fullName: 'Delhi Police Constable', category: 'police', color: '#263238', pyqSlug: 'delhi-police', icon: '👮' },
  { id: 'up_police', slug: 'up-police', en: 'UP Police', hi: 'UP पुलिस', fullName: 'Uttar Pradesh Police Constable', category: 'police', color: '#1a237e', pyqSlug: 'up-police', icon: '👮' },
  { id: 'bihar_police', slug: 'bihar-police', en: 'Bihar Police', hi: 'बिहार पुलिस', fullName: 'Bihar Police Constable', category: 'police', color: '#880e4f', pyqSlug: 'bihar-police', icon: '👮' },
  { id: 'haryana_police', slug: 'haryana-police', en: 'Haryana Police', hi: 'हरियाणा पुलिस', fullName: 'Haryana Police Constable', category: 'police', color: '#0d47a1', icon: '👮' },
  { id: 'rajasthan_police', slug: 'rajasthan-police', en: 'Rajasthan Police', hi: 'राजस्थान पुलिस', fullName: 'Rajasthan Police Constable', category: 'police', color: '#bf360c', icon: '👮' },
  { id: 'mp_police', slug: 'mp-police', en: 'MP Police', hi: 'MP पुलिस', fullName: 'Madhya Pradesh Police Constable', category: 'police', color: '#1b5e20', icon: '👮' },

  // ── Defence ──
  { id: 'nda', slug: 'nda', en: 'NDA', hi: 'NDA', fullName: 'National Defence Academy', category: 'defence', color: '#1b5e20', pyqSlug: 'nda', icon: '🎖️' },
  { id: 'upsc_cds', slug: 'cds', en: 'CDS', hi: 'CDS', fullName: 'Combined Defence Services', category: 'defence', color: '#1a237e', icon: '🎖️' },
  { id: 'upsc_capf', slug: 'capf', en: 'CAPF', hi: 'CAPF', fullName: 'Central Armed Police Forces', category: 'defence', color: '#0d47a1', icon: '🎖️' },
  { id: 'agniveer_army', slug: 'agniveer-army', en: 'Agniveer Army', hi: 'अग्निवीर आर्मी', fullName: 'Agniveer Indian Army', category: 'defence', color: '#33691e', icon: '🎖️' },
  { id: 'agniveer_navy_af', slug: 'agniveer-navy', en: 'Agniveer Navy/AF', hi: 'अग्निवीर नौसेना', fullName: 'Agniveer Navy & Air Force', category: 'defence', color: '#01579b', icon: '🎖️' },
  { id: 'aissee_sainik', slug: 'sainik-school', en: 'Sainik School', hi: 'सैनिक स्कूल', fullName: 'AISSEE Sainik School Entrance', category: 'defence', color: '#0d47a1', icon: '🎖️' },

  // ── UPSC ──
  { id: 'upsc_cse', slug: 'upsc', en: 'UPSC CSE', hi: 'UPSC CSE', fullName: 'Union Public Service Commission Civil Services', category: 'upsc', color: '#311b92', icon: '🏛️' },
  { id: 'ib_acio', slug: 'ib-acio', en: 'IB ACIO', hi: 'IB ACIO', fullName: 'Intelligence Bureau ACIO', category: 'central', color: '#263238', icon: '🕵️' },

  // ── Teaching ──
  { id: 'ctet', slug: 'ctet', en: 'CTET', hi: 'CTET', fullName: 'Central Teacher Eligibility Test', category: 'teaching', color: '#1565c0', icon: '🎓' },
  { id: 'kvs_nvs', slug: 'kvs-nvs', en: 'KVS NVS', hi: 'KVS NVS', fullName: 'Kendriya Vidyalaya & Navodaya Sangathan', category: 'teaching', color: '#00695c', icon: '🎓' },
  { id: 'ugc_net', slug: 'ugc-net', en: 'UGC NET', hi: 'UGC NET', fullName: 'University Grants Commission National Eligibility Test', category: 'teaching', color: '#4527a0', icon: '🎓' },
  { id: 'uptet', slug: 'uptet', en: 'UPTET', hi: 'UPTET', fullName: 'Uttar Pradesh Teacher Eligibility Test', category: 'teaching', color: '#bf360c', icon: '🎓' },
  { id: 'stet_bihar', slug: 'bihar-stet', en: 'Bihar STET', hi: 'बिहार STET', fullName: 'Bihar State Teacher Eligibility Test', category: 'teaching', color: '#880e4f', icon: '🎓' },
  { id: 'super_tet', slug: 'super-tet', en: 'Super TET', hi: 'सुपर TET', fullName: 'Super TET', category: 'teaching', color: '#e65100', icon: '🎓' },
  { id: 'reet', slug: 'reet', en: 'REET', hi: 'REET', fullName: 'Rajasthan Eligibility Examination for Teachers', category: 'teaching', color: '#ad1457', icon: '🎓' },

  // ── State PSC ──
  { id: 'uppsc', slug: 'uppsc', en: 'UPPSC', hi: 'UPPSC', fullName: 'Uttar Pradesh Public Service Commission', category: 'state_psc', color: '#1a237e', icon: '🏛️' },
  { id: 'bpsc', slug: 'bpsc', en: 'BPSC', hi: 'BPSC', fullName: 'Bihar Public Service Commission', category: 'state_psc', color: '#880e4f', icon: '🏛️' },
  { id: 'rpsc_ras', slug: 'rpsc-ras', en: 'RPSC RAS', hi: 'RPSC RAS', fullName: 'Rajasthan Public Service Commission RAS', category: 'state_psc', color: '#bf360c', icon: '🏛️' },
  { id: 'mppsc', slug: 'mppsc', en: 'MPPSC', hi: 'MPPSC', fullName: 'Madhya Pradesh Public Service Commission', category: 'state_psc', color: '#1b5e20', icon: '🏛️' },
  { id: 'hpsc_hcs', slug: 'hpsc', en: 'HPSC HCS', hi: 'HPSC HCS', fullName: 'Haryana Public Service Commission', category: 'state_psc', color: '#0d47a1', icon: '🏛️' },
  { id: 'ukpsc', slug: 'ukpsc', en: 'UKPSC', hi: 'UKPSC', fullName: 'Uttarakhand Public Service Commission', category: 'state_psc', color: '#00695c', icon: '🏛️' },

  // ── State Sub ──
  { id: 'upsssc_pet', slug: 'upsssc-pet', en: 'UPSSSC PET', hi: 'UPSSSC PET', fullName: 'UP Subordinate Services Selection Commission PET', category: 'state_sub', color: '#1a237e', icon: '📝' },
  { id: 'bssc', slug: 'bssc', en: 'BSSC', hi: 'BSSC', fullName: 'Bihar Staff Selection Commission', category: 'state_sub', color: '#880e4f', icon: '📝' },
  { id: 'rsmssb', slug: 'rsmssb', en: 'RSMSSB', hi: 'RSMSSB', fullName: 'Rajasthan Subordinate & Ministerial Services Selection Board', category: 'state_sub', color: '#bf360c', icon: '📝' },
  { id: 'mpesb_vyapam', slug: 'mp-vyapam', en: 'MP Vyapam', hi: 'MP व्यापम', fullName: 'Madhya Pradesh Professional Examination Board', category: 'state_sub', color: '#1b5e20', icon: '📝' },

  // ── Forest ──
  { id: 'up_forest_guard', slug: 'up-forest-guard', en: 'UP Forest Guard', hi: 'UP वनरक्षक', fullName: 'UP Forest Guard', category: 'forest', color: '#1b5e20', icon: '🌲' },
  { id: 'raj_forest_guard', slug: 'raj-forest-guard', en: 'Raj Forest Guard', hi: 'राजस्थान वनरक्षक', fullName: 'Rajasthan Forest Guard', category: 'forest', color: '#33691e', icon: '🌲' },
  { id: 'mp_forest_guard', slug: 'mp-forest-guard', en: 'MP Forest Guard', hi: 'MP वनरक्षक', fullName: 'MP Forest Guard', category: 'forest', color: '#2e7d32', icon: '🌲' },
  { id: 'jharkhand_forest_guard', slug: 'jharkhand-forest-guard', en: 'Jharkhand Forest Guard', hi: 'झारखंड वनरक्षक', fullName: 'Jharkhand Forest Guard', category: 'forest', color: '#004d40', icon: '🌲' },
  { id: 'bihar_forest_guard', slug: 'bihar-forest-guard', en: 'Bihar Forest Guard', hi: 'बिहार वनरक्षक', fullName: 'Bihar Forest Guard', category: 'forest', color: '#1b5e20', icon: '🌲' },
  { id: 'haryana_forest_guard', slug: 'haryana-forest-guard', en: 'Haryana Forest Guard', hi: 'हरियाणा वनरक्षक', fullName: 'Haryana Forest Guard', category: 'forest', color: '#33691e', icon: '🌲' },

  // ── Jail ──
  { id: 'raj_jail_prahari', slug: 'raj-jail-prahari', en: 'Raj Jail Prahari', hi: 'राजस्थान जेल प्रहरी', fullName: 'Rajasthan Jail Prahari', category: 'jail', color: '#4e342e', icon: '🔒' },
  { id: 'bihar_jail_warder', slug: 'bihar-jail-warder', en: 'Bihar Jail Warder', hi: 'बिहार जेल वार्डर', fullName: 'Bihar Jail Warder', category: 'jail', color: '#3e2723', icon: '🔒' },
  { id: 'up_jail_prahari', slug: 'up-jail-prahari', en: 'UP Jail Prahari', hi: 'UP जेल प्रहरी', fullName: 'UP Jail Prahari', category: 'jail', color: '#37474f', icon: '🔒' },
  { id: 'mp_jail_prahari', slug: 'mp-jail-prahari', en: 'MP Jail Prahari', hi: 'MP जेल प्रहरी', fullName: 'MP Jail Prahari', category: 'jail', color: '#455a64', icon: '🔒' },

  // ── Revenue / Panchayat ──
  { id: 'up_lekhpal', slug: 'up-lekhpal', en: 'UP Lekhpal', hi: 'UP लेखपाल', fullName: 'UP Lekhpal', category: 'revenue', color: '#e65100', icon: '📑' },
  { id: 'raj_patwari', slug: 'raj-patwari', en: 'Raj Patwari', hi: 'राजस्थान पटवारी', fullName: 'Rajasthan Patwari', category: 'revenue', color: '#bf360c', icon: '📑' },
  { id: 'mp_patwari', slug: 'mp-patwari', en: 'MP Patwari', hi: 'MP पटवारी', fullName: 'MP Patwari', category: 'revenue', color: '#1b5e20', icon: '📑' },
  { id: 'haryana_patwari', slug: 'haryana-patwari', en: 'Haryana Patwari', hi: 'हरियाणा पटवारी', fullName: 'Haryana Patwari', category: 'revenue', color: '#0d47a1', icon: '📑' },
  { id: 'gram_panchayat_vdo', slug: 'vdo', en: 'VDO', hi: 'VDO / ग्राम पंचायत', fullName: 'Village Development Officer / Gram Panchayat', category: 'revenue', color: '#4e342e', icon: '📑' },

  // ── Central / Other ──
  { id: 'epfo_ssa_eo', slug: 'epfo', en: 'EPFO', hi: 'EPFO', fullName: 'Employees Provident Fund Organisation', category: 'central', color: '#4a148c', icon: '🏢' },
  { id: 'fci_manager', slug: 'fci', en: 'FCI', hi: 'FCI मैनेजर', fullName: 'Food Corporation of India Manager', category: 'central', color: '#e65100', icon: '🏢' },
  { id: 'agriculture_supervisor', slug: 'agriculture-supervisor', en: 'Agri Supervisor', hi: 'कृषि पर्यवेक्षक', fullName: 'Agriculture Supervisor', category: 'agriculture', color: '#33691e', icon: '🌾' },
  { id: 'ibps_afo', slug: 'ibps-afo', en: 'IBPS AFO', hi: 'IBPS AFO', fullName: 'IBPS Agriculture Field Officer', category: 'agriculture', color: '#1b5e20', icon: '🌾' },
  { id: 'labour_inspector', slug: 'labour-inspector', en: 'Labour Inspector', hi: 'श्रम निरीक्षक', fullName: 'Labour Inspector', category: 'central', color: '#4a148c', icon: '🏢' },
];

export const EXAM_CATEGORIES: Record<string, string> = {
  railway: 'Railway Exams',
  ssc: 'SSC Exams',
  police: 'Police Exams',
  defence: 'Defence Exams',
  upsc: 'UPSC & Central',
  central: 'Central Government',
  teaching: 'Teaching Exams',
  state_psc: 'State PSC',
  state_sub: 'State Subordinate',
  forest: 'Forest Guard',
  jail: 'Jail Prahari / Warder',
  revenue: 'Revenue & Panchayat',
  agriculture: 'Agriculture',
};

export function getExamBySlug(slug: string): Exam | undefined {
  return EXAMS.find(e => e.slug === slug);
}

export function getExamsByCategory(category: string): Exam[] {
  return EXAMS.filter(e => e.category === category);
}

// Get popular exams for homepage (top 15 most searched)
export function getPopularExams(): Exam[] {
  const popular = ['ssc_cgl', 'rrb_ntpc', 'ssc_gd', 'rrb_group_d', 'delhi_police', 'up_police', 'ssc_chsl', 'nda', 'ssc_mts', 'rrb_alp', 'bihar_police', 'ctet', 'upsc_cse', 'ssc_cpo', 'uppsc'];
  return popular.map(id => EXAMS.find(e => e.id === id)).filter(Boolean) as Exam[];
}
