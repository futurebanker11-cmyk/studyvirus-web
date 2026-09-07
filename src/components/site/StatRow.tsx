import type { Lang } from "@/lib/i18n/lang";
import { t, type T } from "@/lib/ui/strings";
import { formatCount } from "@/lib/content/stats";

/**
 * The four numbers under the H1.
 *
 * Every value arrives already counted from the content index — this component
 * only formats and labels. That split is deliberate: the old hero hard-coded
 * "200,000+ Questions / 35+ Topics / 10 Lakh+ Students / 4.5 Rating" in JSX,
 * so the claims drifted from the content the moment either changed, and two of
 * them were not countable at all. Nothing here can be written by hand.
 *
 * Numbers go through formatCount for Indian digit grouping (1,93,431). A raw
 * toLocaleString() would depend on the server's ICU locale, and toString()
 * would print an ungrouped 193431 that reads as noise on a phone.
 *
 * Layout is a fixed 2×2 / 1×4 grid with no measured widths, so the row
 * occupies the same box before and after the fonts land. It sits directly
 * under the H1 with no data dependency beyond siteStats(), which is a
 * synchronous read of the generated index — nothing above the fold waits on a
 * network fetch.
 */

export interface Stat {
  key: T;
  value: number;
}

export default function StatRow({ lang, stats }: { lang: Lang; stats: Stat[] }) {
  return (
    <dl className="ui mt-7 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {stats.map((s) => (
        <div key={s.key}>
          <dt className="text-xs uppercase tracking-wider text-ink-faint">{t(lang, s.key)}</dt>
          <dd className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-ink sm:text-3xl">
            {formatCount(s.value, lang)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
