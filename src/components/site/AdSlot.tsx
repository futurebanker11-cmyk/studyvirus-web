"use client";

import { useEffect, useRef } from "react";
import type { AdSpot } from "@/lib/seo/monetisation";
import type { Lang } from "@/lib/i18n/lang";
import { t } from "@/lib/ui/strings";

/**
 * One AdSense unit, addressed by *where it sits on the page* rather than by a
 * slot id, so pages describe intent and `placement()` in seo/monetisation.ts
 * stays the only thing that decides which ads a page kind carries.
 *
 * The slot ids and the client id are the live ones from the previous site —
 * changing them would orphan the units in the AdSense console.
 *
 * Reserving height is the point of this rewrite. The old component put the
 * min-height on an outer div but left the <ins> at 50px, so an ad that filled
 * to 250px shoved the article down after it had already been read — the CLS
 * this site was flagged for. Here the reserved box is the same height the unit
 * will occupy, declared in CSS via --ad-h (see globals.css .ad-slot), so
 * nothing moves when the fill lands.
 */

const AD_CLIENT = "ca-pub-3496395300151813";

/**
 * Live AdSense unit ids — do not renumber.
 *
 * `in-article` maps to TWO units because five are configured and AdSpot (a
 * Task 1 interface, not ours to change) names four. The old site placed
 * inArticle1 near the top of a long page and inArticle2 further down; a page
 * that renders the in-article spot twice should still fill both units rather
 * than serving the same one twice, which AdSense treats as a duplicate.
 *
 * `ordinal` is REQUIRED (not defaulted) for "in-article" so a caller must
 * consciously pick 0 or 1 for each instance on the page — a default here
 * previously meant a second in-article slot silently reused unit 1 (visible
 * only as a duplicate-unit warning in the AdSense console, not as a type
 * error or a test failure). It is refused for every other placement, which
 * never has a second unit to disambiguate.
 */
const SLOT_ID: Record<AdSpot, string> = {
  top: "4497869583", // header
  "in-article": "1871706240", // inArticle1
  "sticky-bottom": "6716838813",
  footer: "2969796383", // sidebar unit, reused in the footer rail
};

const IN_ARTICLE_2 = "4306297892";

function slotId(placement: AdSpot, ordinal?: number): string {
  if (placement === "in-article" && ordinal === 1) return IN_ARTICLE_2;
  return SLOT_ID[placement];
}

/**
 * Reserved height per placement, in px. These match the sizes the units are
 * configured to serve; a responsive unit is capped by the box it is given.
 */
const RESERVED: Record<AdSpot, number> = {
  top: 90,
  "in-article": 280,
  "sticky-bottom": 60,
  footer: 280,
};

const FORMAT: Record<AdSpot, string> = {
  top: "horizontal",
  "in-article": "rectangle",
  "sticky-bottom": "horizontal",
  footer: "rectangle",
};

type AdSlotProps =
  | {
      placement: "in-article";
      lang: Lang;
      /**
       * 0 for the first in-article slot on the page, 1 for the second.
       * Required (not defaulted) so a page rendering two in-article slots
       * cannot forget to pick one and silently duplicate the unit.
       */
      ordinal: 0 | 1;
      className?: string;
    }
  | {
      placement: Exclude<AdSpot, "in-article">;
      lang: Lang;
      // No second unit exists for these placements, so no ordinal to pick.
      ordinal?: never;
      className?: string;
    };

export default function AdSlot({ placement, lang, ordinal, className = "" }: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !ref.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q = ((window as any).adsbygoogle = (window as any).adsbygoogle || []);
      q.push({});
      pushed.current = true;
    } catch {
      /* blocker, or the loader never arrived — the reserved box just stays empty */
    }
  }, []);

  const h = RESERVED[placement];

  return (
    <aside
      // `no-print` and `ad-slot` are both defined in globals.css: the first
      // drops ads on paper, the second holds the height open.
      className={`no-print my-6 ${placement === "sticky-bottom" ? "sticky bottom-0 z-30 bg-bg-blur backdrop-blur-sm" : ""} ${className}`}
      aria-label={t(lang, "ad.label")}
      style={{ ["--ad-h" as string]: `${h}px` }}
    >
      <div className="ad-slot mx-auto flex w-full items-center justify-center overflow-hidden">
        <ins
          ref={ref}
          className="adsbygoogle block w-full"
          style={{ display: "block", width: "100%", height: `${h}px` }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={slotId(placement, ordinal)}
          data-ad-format={FORMAT[placement]}
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
