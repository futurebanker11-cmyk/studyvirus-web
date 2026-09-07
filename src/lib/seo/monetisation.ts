// Spec §6: one primary CTA per page type. Content pages are ad-first with a
// single app card at the end; exam hubs and app pages are install-first with
// ads only in the footer.
export type PageKind = "home" | "exam-hub" | "apps" | "content" | "static";
export type AdSpot = "top" | "in-article" | "sticky-bottom" | "footer";
export type InstallCta = "hero" | "end" | "strip" | "none";

export function placement(kind: PageKind): { ads: AdSpot[]; installCta: InstallCta } {
  switch (kind) {
    case "content": return { ads: ["in-article", "sticky-bottom"], installCta: "end" };
    case "exam-hub": return { ads: ["footer"], installCta: "hero" };
    case "apps": return { ads: ["footer"], installCta: "hero" };
    case "home": return { ads: ["in-article", "footer"], installCta: "strip" };
    case "static": return { ads: [], installCta: "none" };
  }
}
