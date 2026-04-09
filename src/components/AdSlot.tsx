"use client";
import { useEffect, useRef } from "react";

export const AD_SLOTS = {
  header: "4497869583",
  inArticle1: "1871706240",
  inArticle2: "4306297892",
  sidebar: "2969796383",
  stickyBottom: "6716838813",
} as const;

const AD_CLIENT = "ca-pub-3496395300151813";

interface AdSlotProps {
  slot: keyof typeof AD_SLOTS;
  format?: string;
  className?: string;
  responsive?: boolean;
}

export default function AdSlot({ slot, format = "auto", className = "", responsive = true }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !adRef.current) return;

    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
          pushed.current = true;
        }
      } catch {}
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`ad-container my-4 ${className}`} style={{ minHeight: format === "rectangle" ? "250px" : "90px" }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block", minHeight: "50px" }}
        data-ad-client={AD_CLIENT}
        data-ad-slot={AD_SLOTS[slot]}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
