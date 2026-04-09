"use client";
import { useEffect, useRef, useState } from "react";
import { AD_SLOTS } from "./AdSlot";

const AD_CLIENT = "ca-pub-3496395300151813";

export default function StickyBottomAd() {
  const pushed = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      pushed.current = true;
    } catch {}
  }, []);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.1)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="relative max-w-4xl mx-auto">
        <button
          onClick={() => setDismissed(true)}
          className="absolute -top-6 right-2 bg-slate-700 text-white text-xs rounded-t px-2 py-0.5 hover:bg-slate-900"
          aria-label="Close ad"
        >
          Close
        </button>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={AD_CLIENT}
          data-ad-slot={AD_SLOTS.stickyBottom}
          data-ad-format="horizontal"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
