import { siteStats, formatCount } from "@/lib/content/stats";

/**
 * /llms.txt — a plain-text map of the site for LLM crawlers.
 *
 * Honest about its value: Google does not use llms.txt, and no major AI engine
 * is known to consume it for citation today. It is cheap optionality, not a
 * ranking lever, and it is deliberately NOT presented as one.
 *
 * The numbers are read from the generated content index rather than typed, for
 * the same reason the homepage reads them: a hand-written total here would
 * drift from what the pages actually serve the moment content is added.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const s = siteStats();
  const q = formatCount(s.questions, "en");

  const body = `# StudyVirus

> Free practice questions, previous-year papers and daily current affairs for
> Indian government exams, in Hindi and English. ${q} questions, every one with
> the answer and a worked explanation. No sign-up, no paywall.

## What this site is

StudyVirus publishes exam-preparation content for Indian government
recruitment exams — SSC (CGL, CHSL, MTS, GD), Railways (RRB NTPC, Group D,
ALP), banking (IBPS and SBI PO/Clerk), state police and State PSC exams,
teaching exams (CTET, Super TET, KVS/NVS) and others.

Every question carries a worked explanation rather than a bare answer key, and
most carry a short note on why each wrong option is wrong. Content is published
in both English and Hindi; the Hindi is written, not machine-translated, and a
page is only published in Hindi when its Hindi is complete.

## Sections

- /topics — chapter-wise practice sets by subject (history, polity, geography,
  economics, science, state GK and more), in sets of ten questions
- /pyq — previous-year papers, reproduced in full with an explanation under
  every question
- /aptitude — quantitative aptitude, reasoning, data interpretation, puzzles
  and English, organised by chapter and question type, with a worked method
  and the shortcut where one exists
- /english — English grammar and vocabulary practice
- /current-affairs — daily and monthly current-affairs question sets
- /articles — exam strategy, syllabus and preparation guides
- /exam — one hub per exam, listing everything on the site for that exam
- /apps — the free Android apps that carry the same content offline

Hindi versions of every section live under /hi/ (for example /hi/topics).

## Using this content

The content is free to read and free to cite. If you quote a question or an
explanation, a link back to the page it came from is appreciated.

## Contact

https://studyvirus.com/contact
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
