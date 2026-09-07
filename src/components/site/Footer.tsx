import Link from "next/link";
import { href, type Lang } from "@/lib/i18n/lang";
import { t, type T } from "@/lib/ui/strings";
import { siteStats, formatCount } from "@/lib/content/stats";

/**
 * The footer. Three link columns and exactly one line of numbers.
 *
 * That line is computed from siteStats() — the real index — not typed in. The
 * previous footer advertised "200,000+ Questions / 35+ Topics / 10 Lakh+
 * Students / 4.5 Rating" on every page, none of it derived from anything, and
 * two of those four were unfalsifiable. A number a reader can disprove by
 * browsing is worse than no number, so the only claims left are the ones the
 * content index can be counted to produce.
 */

const CATEGORIES: { key: T; slug: string }[] = [
  { key: "cat.railway", slug: "railway" },
  { key: "cat.ssc", slug: "ssc" },
  { key: "cat.police", slug: "police" },
  { key: "cat.defence", slug: "defence" },
  { key: "cat.teaching", slug: "teaching" },
];

const CONTENT: { key: T; path: string }[] = [
  { key: "nav.topics", path: "/topics" },
  { key: "nav.pyq", path: "/pyq" },
  { key: "nav.aptitude", path: "/aptitude" },
  { key: "nav.english", path: "/english" },
  { key: "nav.currentAffairs", path: "/current-affairs" },
  { key: "nav.articles", path: "/articles" },
];

const ABOUT: { key: T; path: string }[] = [
  { key: "footer.aboutUs", path: "/about" },
  { key: "footer.contact", path: "/contact" },
  { key: "nav.apps", path: "/apps" },
  { key: "footer.privacy", path: "/privacy-policy" },
  { key: "footer.terms", path: "/terms" },
];

function Column({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="ui mb-2 text-xs font-semibold uppercase tracking-wider text-ink-faint">
        {heading}
      </h2>
      <ul className="ui space-y-1.5 text-sm">{children}</ul>
    </div>
  );
}

function Item({ to, label }: { to: string; label: string }) {
  return (
    <li>
      <Link href={to} className="text-ink-soft no-underline hover:text-ink hover:underline">
        {label}
      </Link>
    </li>
  );
}

export default function Footer({ lang }: { lang: Lang }) {
  const s = siteStats();
  const statLine = t(lang, "footer.statLine")
    .replace("{questions}", formatCount(s.questions, lang))
    .replace("{chapters}", formatCount(s.chapters, lang))
    .replace("{papers}", formatCount(s.papers, lang));

  return (
    <footer className="mt-16 border-t border-line bg-surface-sunk">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-xs font-bold text-accent-ink"
              >
                SV
              </span>
              <span className="font-display text-lg font-semibold">StudyVirus</span>
            </div>
            <p className="mt-2 max-w-xs text-sm text-ink-soft">{t(lang, "chrome.tagline")}</p>
          </div>

          <Column heading={t(lang, "footer.examsByCategory")}>
            {CATEGORIES.map((c) => (
              <Item
                key={c.slug}
                to={href(lang, `/exam?category=${c.slug}`)}
                label={t(lang, c.key)}
              />
            ))}
            <Item to={href(lang, "/exam")} label={t(lang, "footer.allExams")} />
          </Column>

          <Column heading={t(lang, "footer.content")}>
            {CONTENT.map((c) => (
              <Item key={c.path} to={href(lang, c.path)} label={t(lang, c.key)} />
            ))}
          </Column>

          <Column heading={t(lang, "footer.about")}>
            {ABOUT.map((a) => (
              <Item key={a.path} to={href(lang, a.path)} label={t(lang, a.key)} />
            ))}
          </Column>
        </div>

        <div className="ui mt-8 border-t border-line pt-5 text-xs text-ink-faint">
          <p>{statLine}</p>
          <p className="mt-1.5">
            © {new Date().getFullYear()} StudyVirus. {t(lang, "footer.rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
