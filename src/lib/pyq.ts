import { PYQExam } from './types';

export const PYQ_EXAMS: PYQExam[] = [
  { id: 'ntpc', slug: 'rrb-ntpc', en: 'RRB NTPC', hi: 'RRB NTPC', prefix: 'pyq_rrb_ntpc_set', sets: 30, category: 'railway' },
  { id: 'group-d', slug: 'rrb-group-d', en: 'RRB Group D', hi: 'RRB ग्रुप D', prefix: 'pyq_rrb_groupd_set', sets: 30, category: 'railway' },
  { id: 'alp', slug: 'rrb-alp', en: 'RRB ALP', hi: 'RRB ALP', prefix: 'pyq_rrb_alp_set', sets: 30, category: 'railway' },
  { id: 'rpf', slug: 'rpf', en: 'RPF Constable', hi: 'RPF कांस्टेबल', prefix: 'pyq_rpf_set', sets: 29, category: 'railway' },
  { id: 'cgl', slug: 'ssc-cgl', en: 'SSC CGL', hi: 'SSC CGL', prefix: 'pyq_ssc_cgl_set', sets: 30, category: 'ssc' },
  { id: 'chsl', slug: 'ssc-chsl', en: 'SSC CHSL', hi: 'SSC CHSL', prefix: 'pyq_ssc_chsl_set', sets: 30, category: 'ssc' },
  { id: 'mts', slug: 'ssc-mts', en: 'SSC MTS', hi: 'SSC MTS', prefix: 'pyq_ssc_mts_set', sets: 30, category: 'ssc' },
  { id: 'gd', slug: 'ssc-gd', en: 'SSC GD', hi: 'SSC GD', prefix: 'pyq_ssc_gd_set', sets: 30, category: 'ssc' },
  { id: 'cpo', slug: 'ssc-cpo', en: 'SSC CPO', hi: 'SSC CPO', prefix: 'pyq_ssc_cpo_set', sets: 30, category: 'ssc' },
  { id: 'delhi_police', slug: 'delhi-police', en: 'Delhi Police', hi: 'दिल्ली पुलिस', prefix: 'pyq_delhi_police_set', sets: 30, category: 'police' },
  { id: 'up_police', slug: 'up-police', en: 'UP Police', hi: 'UP पुलिस', prefix: 'pyq_up_police_set', sets: 30, category: 'police' },
  { id: 'bihar_police', slug: 'bihar-police', en: 'Bihar Police', hi: 'बिहार पुलिस', prefix: 'pyq_bihar_police_set', sets: 30, category: 'police' },
  { id: 'nda', slug: 'nda', en: 'NDA', hi: 'NDA', prefix: 'pyq_nda_set', sets: 30, category: 'defence' },
];

export function getPYQBySlug(slug: string): PYQExam | undefined {
  return PYQ_EXAMS.find(e => e.slug === slug);
}
