// Plain, self-contained shell for pages linked from the Play Console Data
// safety form (account deletion). Deliberately NO Header/Footer/SiteShell:
// SiteShell loads the AdSense script, and a policy page must not carry ads.
// lang is a constant so these pages stay statically prerendered.
const css = `
  html,body{margin:0;padding:0;background:#fff;color:#1a1a1a}
  body{font:17px/1.65 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
  .legal{max-width:720px;margin:0 auto;padding:32px 20px 64px}
  .legal h1,.legal h2{color:#111;font-weight:700}
  .legal h1{font-size:28px;line-height:1.25;margin:0 0 6px}
  .legal h2{font-size:20px;margin:32px 0 8px}
  .legal ol{list-style:decimal}
  .legal ul{list-style:disc}
  .legal .meta{color:#6b6b6b;font-size:14px;margin:0 0 24px}
  .legal .box{background:#f5f6f8;border:1px solid #e1e4e8;border-radius:10px;padding:14px 18px;margin:0 0 8px}
  .legal ol,.legal ul{padding-left:22px}
  .legal li{margin:6px 0}
  .legal a{color:#1558d6}
  .legal hr{border:0;border-top:1px solid #e1e4e8;margin:32px 0}
  .legal .foot{color:#6b6b6b;font-size:14px}
`;

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>
        <main className="legal">{children}</main>
      </body>
    </html>
  );
}
