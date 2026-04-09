"use client";
import { useEffect, useRef } from "react";

// StudyVirus Ad Unit Slot IDs
export const AD_SLOTS = {
  header: "4497869583",        // sv-header (728x90 leaderboard)
  inArticle1: "1871706240",    // sv-in-article-1 (after Q5 / mid-content)
  inArticle2: "4306297892",    // sv-in-article-2 (after Q15 / before footer)
  sidebar: "2969796383",       // sv-sidebar (300x250 rectangle)
  stickyBottom: "6716838813",  // sv-sticky-bottom (320x50 mobile / 728x90 desktop)
} as const;

const AD_CLIENT = "ca-pub-3496395300151813";

interface AdSlotProps {
  slot: keyof typeof AD_SLOTS;
  format?: string;
  className?: string;
  responsive?: boolean;
}

export default function AdSlot({ slot, format = "auto", className = "", responsive = true }: AdSlotProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, []);

  return (
    <div className={`ad-container my-4 min-h-[50px] ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOTS[slot]}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
