import Link from "next/link";
import { href, type Lang } from "@/lib/i18n/lang";
import type { ManifestTopic } from "@/lib/content/topics";
import { topicSlug } from "@/lib/content/slugs";
import { formatCount } from "@/lib/content/stats";
import { t } from "@/lib/ui/strings";

/**
 * The subject grid.
 *
 * Each card carries the topic's real chapter and question counts, computed by
 * the caller from chaptersOf() rather than here: the page already walks every
 * visible topic once to total them, and doing it a second time inside the
 * component would double the index reads on the site's busiest page for no
 * new information.
 *
 * The counts are the whole reason a card is worth clicking — "History · 41
 * chapters · 3,102 questions" tells a reader whether the section is worth
 * their data allowance, which "History →" does not. They are also the numbers
 * a reader can immediately check by opening the topic, so they have to be
 * derived, never estimated. The page this replaces multiplied chapter count by
 * a flat 40 and printed the product as fact.
 */

export interface SubjectCard {
  topic: ManifestTopic;
  chapters: number;
  questions: number;
}

export default function SubjectGrid({ lang, subjects }: { lang: Lang; subjects: SubjectCard[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {subjects.map((s) => (
        <Link
          key={s.topic.key}
          href={href(lang, `/topics/${topicSlug(s.topic.key)}`)}
          className="group flex items-start gap-3 rounded-lg border border-line bg-surface p-4 no-underline transition-colors hover:border-line-strong"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            {s.topic.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-display text-base font-semibold text-ink group-hover:underline">
              {lang === "hi" ? s.topic.hi.name : s.topic.en.name}
            </span>
            <span className="ui mt-1 block text-xs text-ink-faint">
              {formatCount(s.chapters, lang)} {t(lang, "common.chapters")} ·{" "}
              {formatCount(s.questions, lang)} {t(lang, "common.questions")}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}
