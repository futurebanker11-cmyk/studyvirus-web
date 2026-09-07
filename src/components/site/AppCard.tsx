import type { AppEntry } from "@/lib/content/apps";
import type { Lang } from "@/lib/i18n/lang";
import { playUrl, type ReferrerKind } from "@/lib/seo/referrer";
import { formatCount } from "@/lib/content/stats";
import { t } from "@/lib/ui/strings";

/**
 * The Play Store card. Three shapes, one component, because the promise made
 * to the reader has to be identical wherever it appears:
 *
 *   hero   — top of an exam hub or the apps page; install is the primary CTA
 *   end    — after the content on a reading page; a quiet offer, not a wall
 *   strip  — a row in a list of apps
 *
 * Ratings are shown only at ratingCount >= 5. Below that a single 5★ review
 * reads as "5.0" and is a claim the site cannot stand behind; the whole point
 * of the rebuild is that every number on the page survives being checked.
 */

const REFERRER: Record<Variant, ReferrerKind> = {
  hero: "exam-hub",
  end: "content",
  strip: "apps-hub",
};

type Variant = "hero" | "end" | "strip";

function Stars({ rating }: { rating: number }) {
  // A single glyph plus the number: no five-node star rig to lay out, and it
  // reads correctly to a screen reader without extra markup.
  return (
    <span className="inline-flex items-center gap-1 text-ink-soft">
      <svg aria-hidden="true" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  );
}

export default function AppCard({
  app,
  lang,
  variant = "end",
}: {
  app: AppEntry;
  lang: Lang;
  variant?: Variant;
}) {
  const url = playUrl(app.package, REFERRER[variant], app.slug);
  const showRating = typeof app.rating === "number" && (app.ratingCount ?? 0) >= 5;

  const install = (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="ui inline-flex shrink-0 items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-ink no-underline transition-colors hover:bg-accent-hover"
    >
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 0 1 0 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
      </svg>
      {t(lang, variant === "strip" ? "app.install" : "app.getTheApp")}
    </a>
  );

  const icon = app.icon ? (
    // Plain <img>: these are small remote PNGs on a CDN outside the
    // next/image allowlist, and a fixed box means no layout shift anyway.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={app.icon}
      alt=""
      width={variant === "hero" ? 64 : 48}
      height={variant === "hero" ? 64 : 48}
      loading="lazy"
      className="shrink-0 rounded-xl border border-line"
    />
  ) : null;

  const meta = (
    <p className="ui mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-faint">
      {showRating && <Stars rating={app.rating as number} />}
      {showRating && (
        <span>
          {formatCount(app.ratingCount as number, lang)} {t(lang, "app.ratingsCount")}
        </span>
      )}
      {app.installs && <span>{app.installs}</span>}
      <span>{t(lang, "common.free")}</span>
    </p>
  );

  if (variant === "strip") {
    return (
      <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
        {icon}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-semibold">{app.name}</h3>
          {meta}
        </div>
        {install}
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-line bg-surface ${variant === "hero" ? "p-5" : "p-4"}`}
    >
      <div className="flex items-start gap-4">
        {icon}
        <div className="min-w-0 flex-1">
          <h3 className={variant === "hero" ? "text-xl font-semibold" : "text-lg font-semibold"}>
            {app.name}
          </h3>
          {meta}
          <p className="mt-2 text-sm text-ink-soft">
            {variant === "hero" ? app.description : t(lang, "app.practiceOffline")}
          </p>
          <div className="mt-3">{install}</div>
        </div>
      </div>
    </div>
  );
}
