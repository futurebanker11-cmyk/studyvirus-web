export type ReferrerKind = "exam-hub" | "app-page" | "apps-hub" | "content" | "home";

export function playUrl(pkg: string, kind: ReferrerKind, slug: string): string {
  const referrer = `utm_source=studyvirus.com&utm_medium=web&utm_campaign=${kind}&utm_content=${slug}`;
  return `https://play.google.com/store/apps/details?id=${pkg}&referrer=${encodeURIComponent(referrer)}`;
}
