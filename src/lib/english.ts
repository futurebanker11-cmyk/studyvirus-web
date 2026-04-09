import { Chapter } from './types';

export interface EnglishSection {
  key: string;
  folder: string;
  emoji: string;
  en: { name: string; desc: string };
  hi: { name: string; desc: string };
  accent: string;
  chapters: Chapter[];
}

export const ENGLISH_SECTIONS: EnglishSection[] = [
  {
    key: 'english_basic',
    folder: '46-English Grammar Basic',
    emoji: '🔤',
    en: { name: 'English Basic', desc: 'Synonyms, antonyms, fill in blanks' },
    hi: { name: 'अंग्रेजी बुनियादी', desc: 'पर्यायवाची, विलोम, रिक्त स्थान' },
    accent: '#455a64',
    chapters: [
      { file: '1-Synonyms_Basic.json', en: 'Synonyms (Basic)', hi: 'पर्यायवाची (बुनियादी)' },
      { file: '2-Antonyms Basic.json', en: 'Antonyms (Basic)', hi: 'विलोम (बुनियादी)' },
      { file: '3-Fill in Blanks Basic.json', en: 'Fill in Blanks (Basic)', hi: 'रिक्त स्थान (बुनियादी)' },
      { file: '4-Spelling Correction Basic.json', en: 'Spelling Correction (Basic)', hi: 'वर्तनी सुधार (बुनियादी)' },
      { file: '5-One Word Substitution Basic.json', en: 'One Word Substitution (Basic)', hi: 'एक शब्द प्रतिस्थापन (बुनियादी)' },
      { file: '6-Basic Grammar Tenses Articles.json', en: 'Tenses & Articles', hi: 'काल और आर्टिकल' },
    ],
  },
  {
    key: 'english_full',
    folder: '45-English Grammar Full',
    emoji: '📚',
    en: { name: 'English Advanced', desc: 'Idioms, error spotting, comprehension' },
    hi: { name: 'अंग्रेजी उन्नत', desc: 'मुहावरे, त्रुटि खोज, पठन बोध' },
    accent: '#283593',
    chapters: [
      { file: '1-Idioms and Phrases SSC.json', en: 'Idioms & Phrases', hi: 'मुहावरे और वाक्यांश' },
      { file: '2-Synonyms Advanced.json', en: 'Synonyms (Advanced)', hi: 'पर्यायवाची (उन्नत)' },
      { file: '3-Antonyms Advanced.json', en: 'Antonyms (Advanced)', hi: 'विलोम (उन्नत)' },
      { file: '4-Error Spotting Subject Verb.json', en: 'Error Spotting - Subject Verb', hi: 'त्रुटि खोजें - कर्ता क्रिया' },
      { file: '5-Error Spotting Tense Preposition.json', en: 'Error Spotting - Tense & Preposition', hi: 'त्रुटि खोजें - काल और पूर्वसर्ग' },
      { file: '6-Fill in Blanks Grammar.json', en: 'Fill in Blanks (Grammar)', hi: 'रिक्त स्थान (व्याकरण)' },
      { file: '7-Fill in Blanks Vocabulary.json', en: 'Fill in Blanks (Vocabulary)', hi: 'रिक्त स्थान (शब्दावली)' },
      { file: '8-One Word Substitution.json', en: 'One Word Substitution', hi: 'एक शब्द प्रतिस्थापन' },
      { file: '9-Active and Passive Voice.json', en: 'Active & Passive Voice', hi: 'कर्तृवाच्य और कर्मवाच्य' },
      { file: '10-Direct and Indirect Speech.json', en: 'Direct & Indirect Speech', hi: 'प्रत्यक्ष और अप्रत्यक्ष कथन' },
      { file: '11-Sentence Rearrangement.json', en: 'Sentence Rearrangement', hi: 'वाक्य पुनर्व्यवस्था' },
      { file: '12-Cloze Test.json', en: 'Cloze Test', hi: 'क्लोज़ टेस्ट' },
      { file: '13-Reading Comprehension.json', en: 'Reading Comprehension', hi: 'पठन बोध' },
      { file: '14-Spelling Correction.json', en: 'Spelling Correction', hi: 'वर्तनी सुधार' },
      { file: '15-Sentence Improvement.json', en: 'Sentence Improvement', hi: 'वाक्य सुधार' },
    ],
  },
];

export function chapterSlugEn(en: string): string {
  return en.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}
