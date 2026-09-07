import { NextResponse } from "next/server";

// GK Battle app invite links: https://studyvirus.com/b/CODE?app=<package>
// Served as a first-class route (a next.config rewrite to the public/ asset
// does not resolve through the OpenNext/Cloudflare assets layer). The page is
// fully client-side: it reads the room code from the path and the app package
// from ?app=, then uses an Android intent:// URL — open the app if installed,
// else fall back to that app's Play Store listing.
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>Join GK Battle</title>
<meta property="og:title" content="⚔️ You're invited to a GK Battle!" />
<meta property="og:description" content="Live quiz battle with friends — tap to join the room." />
<meta property="og:type" content="website" />
<style>
  html,body{margin:0;height:100%;font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#0d1117;color:#fff;display:flex;align-items:center;justify-content:center}
  .card{text-align:center;padding:28px;max-width:340px}
  .code{font-size:34px;font-weight:900;letter-spacing:8px;color:#a5b4fc;margin:10px 0}
  .btn{display:block;margin-top:14px;background:#6366f1;color:#fff;text-decoration:none;font-weight:800;padding:15px 26px;border-radius:14px;font-size:15px}
  .btn.play{background:#161b2c;border:1.5px solid #1e293b;color:#e2e8f0;font-size:13px}
  .sub{color:#64748b;font-size:12px;margin-top:14px;line-height:1.5}
</style>
</head>
<body>
  <div class="card">
    <div style="font-size:34px">⚔️</div>
    <div style="font-weight:900;font-size:18px">You're invited to a GK Battle!</div>
    <div class="code" id="code">······</div>
    <a class="btn" id="open" href="#">▶&nbsp; Open in app</a>
    <a class="btn play" id="store" href="#">📲&nbsp; Don't have it? Get the app</a>
    <div class="sub" id="sub"></div>
  </div>

<script>
  function getCode() {
    var m = location.pathname.match(/\\/b\\/([A-Za-z0-9]{6})/);
    if (m) return m[1].toUpperCase();
    var p = new URLSearchParams(location.search).get('code');
    return p ? p.toUpperCase() : '';
  }
  var DEFAULT_PACKAGE = 'com.railwaygk.ntpc';
  var appParam = new URLSearchParams(location.search).get('app') || '';
  var PLAY_PACKAGE = /^[a-zA-Z0-9_.]+$/.test(appParam) ? appParam : DEFAULT_PACKAGE;

  var code = getCode();
  var isAndroid = /android/i.test(navigator.userAgent);
  var storeUrl = 'https://play.google.com/store/apps/details?id=' + PLAY_PACKAGE;
  var intentUrl = 'intent://b/' + code
    + '#Intent;scheme=gkbattle;package=' + PLAY_PACKAGE
    + ';S.browser_fallback_url=' + encodeURIComponent(storeUrl) + ';end';
  var schemeUrl = 'gkbattle://b/' + code;

  document.getElementById('code').textContent = code || 'INVALID';
  document.getElementById('store').href = storeUrl;
  var openBtn = document.getElementById('open');
  var sub = document.getElementById('sub');

  if (!code) {
    sub.textContent = 'Invalid invite link — ask your friend to share it again.';
    openBtn.style.display = 'none';
  } else if (isAndroid) {
    openBtn.href = intentUrl;
    sub.textContent = 'If the app doesn\\u2019t open, install it and join with the code above.';
    setTimeout(function () { try { location.href = intentUrl; } catch (e) {} }, 60);
  } else {
    openBtn.href = schemeUrl;
    sub.textContent = 'The app is available on Android. On your phone, install it and join with the code above.';
  }
</script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
