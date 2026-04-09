"use client";
import AdSlot from "./AdSlot";

export default function HeaderAd() {
  return (
    <div className="hidden md:block max-w-7xl mx-auto px-4">
      <AdSlot slot="header" format="horizontal" className="my-2" />
    </div>
  );
}
