"use client";
import { useEffect, useRef } from "react";
import { AD_SLOTS } from "./AdSlot";

const AD_CLIENT = "ca-pub-3496395300151813";

export default function SidebarAd() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    const timer = setTimeout(() => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const adsbygoogle = (window as any).adsbygoogle;
        if (adsbygoogle) {
          adsbygoogle.push({});
          pushed.current = true;
        }
      } catch {}
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="hidden lg:block sticky top-20">
      <div className="bg-white rounded-xl border border-slate-100 p-2">
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: "250px" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOTS.sidebar}
          data-ad-format="rectangle"
          data-full-width-responsive="false"
        />
      </div>
    </div>
  );
}
