// _worker.js — Cloudflare Pages (Module Worker) with password-only lock screen
// - Protect specific paths (edit PROTECTED)
// - Env var: USER_PASS (required). Optional BRAND_1 / BRAND_2 for colors.
// - Sets HttpOnly cookie so users don’t re-enter for ~30 days.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1) Choose what to protect
    const PROTECTED = [
      /^\/nurtur(\/.*)?$/i,
      /^\/Gifted(\/.*)?$/i,
      // add more: /^\/secret(\/.*)?$/i,
    ];

    const isProtected = PROTECTED.some(rx => rx.test(pathname));
    const serveSite = (req) => env.ASSETS.fetch(req);

    // Special internal route for auth POST
    const isAuthRoute = url.searchParams.has("__auth");
    if (!isProtected || isAuthRoute) {
      if (isAuthRoute && request.method === "POST") {
        return handleAuth(request, env);
      }
      return serveSite(request);
    }

    // Protected path → check cookie
    if (isAuthed(request)) return serveSite(request);

    // Not authed → show gradient lock screen (no blur/preview)
    return lockScreenResponse(request, env);
  },
};

/* -------------- helpers -------------- */

function isAuthed(request) {
  const cookie = request.headers.get("Cookie") || "";
  return /\bsite_auth=1\b/.test(cookie);
}

async function handleAuth(request, env) {
  try {
    const data = await request.json();
    const pass = (data?.pass || "").trim();
    const ok = env.USER_PASS && pass === env.USER_PASS;

    if (!ok) {
      return new Response(JSON.stringify({ ok: false, error: "Incorrect password." }), {
        status: 401,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    const maxAge = 60 * 60 * 24 * 30; // 30 days
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "Set-Cookie": `site_auth=1; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Bad request." }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
}

function lockScreenResponse(request, env) {
  // Brand colors (pink like your home page); override via env if you want
  const BRAND_1 = env.BRAND_1 || "#FF5A5F"; // main pink
  const BRAND_2 = env.BRAND_2 || "#FFA3B1"; // soft pink

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Protected</title>
<style>
  :root{
    --brand-1: ${BRAND_1};
    --brand-2: ${BRAND_2};
    --card-bg: rgba(255,255,255,.92);
    --ring: color-mix(in srgb, var(--brand-1) 24%, transparent);
  }
  html, body { height: 100%; margin: 0; }
  body{
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
    color: #222;
    /* Gradient-only background (no blur/no preview) */
    background:
      radial-gradient(120% 120% at 10% 0%, color-mix(in srgb, var(--brand-2) 35%, white) 0%, transparent 58%),
      radial-gradient(100% 100% at 90% 10%, color-mix(in srgb, var(--brand-1) 28%, white) 0%, transparent 60%),
      linear-gradient(180deg, #fff, #fff);
  }
  .wrap{
    position: fixed; inset: 0;
    display: grid; place-items: center;
    padding: clamp(16px, 4vw, 32px);
  }
  .lock-card{
    width: min(560px, 92vw);
    border-radius: 20px;
    border: 1px solid rgba(0,0,0,.08);
    background: var(--card-bg);
    box-shadow:
      0 16px 40px rgba(0,0,0,.14),
      inset 0 0 0 1px rgba(255,255,255,.5);
    padding: clamp(20px, 4vw, 28px);
  }
  .title{
    margin: 0 0 6px;
    font-size: clamp(18px, 2.6vw, 22px);
    font-weight: 600;
  }
  .subtitle{
    margin: 0 0 18px;
    color: #666; font-size: 14px;
  }
  form{ display: grid; gap: 12px; }
  .pw-input{
    width: 100%; height: 44px;
    padding: 10px 12px;
    border-radius: 12px;
    border: 1px solid rgba(0,0,0,.12);
    background: #fff; color: #1a1a1a;
    outline: none;
    transition: border-color .15s ease, box-shadow .15s ease;
  }
  .pw-input:focus{
    border-color: var(--ring);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand-1) 18%, transparent);
  }
  .pw-submit{
    --shadow: 0 12px 26px color-mix(in srgb, var(--brand-1) 32%, transparent);
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    width: 100%; height: 44px; padding: 0 16px;
    border: 1px solid color-mix(in srgb, var(--brand-1) 30%, white);
    border-radius: 12px;
    color: #fff; font-weight: 600; letter-spacing: .2px;
    background:
      radial-gradient(120% 140% at 80% 0%,
        color-mix(in srgb, var(--brand-2) 22%, white) 0%, transparent 65%),
      linear-gradient(135deg, var(--brand-1), var(--brand-2));
    box-shadow: var(--shadow);
    transition: transform .12s ease, box-shadow .12s ease, background-position .2s ease, filter .12s ease;
    background-size: 200% 200%; background-position: 0% 50%;
    cursor: pointer;
  }
  .pw-submit:hover{
    transform: translateY(-1px);
    box-shadow: 0 16px 34px color-mix(in srgb, var(--brand-1) 36%, transparent);
    background-position: 100% 50%;
    filter: saturate(1.04);
  }
  .pw-submit:active{
    transform: translateY(0);
    box-shadow: 0 10px 22px color-mix(in srgb, var(--brand-1) 28%, transparent);
    filter: brightness(.98);
  }
  .pw-submit[disabled]{ opacity: .65; cursor: not-allowed; filter: grayscale(.1); }
  .error{ color:#c62828; font-size:14px; min-height:1.2em; }
  .note{ margin-top:10px; color:#777; font-size:12px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="lock-card" role="dialog" aria-modal="true" aria-labelledby="t1">
      <h1 id="t1" class="title">This page is password-protected</h1>
      <p class="subtitle">Please enter the password to continue.</p>
      <form id="lockForm">
        <input id="pw" name="pw" type="password" class="pw-input" placeholder="Password" autocomplete="current-password" required />
        <button type="submit" class="pw-submit">Enter</button>
        <div id="err" class="error"></div>
      </form>
      <p class="note">If you need access, contact Lina for the shared password.</p>
    </div>
  </div>

<script>
  (function(){
    const form = document.getElementById('lockForm');
    const pw   = document.getElementById('pw');
    const err  = document.getElementById('err');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.textContent = "";
      const pass = pw.value.trim();
      if (!pass) { err.textContent = "Password required."; return; }

      try {
        const u = new URL(location.href);
        u.searchParams.set('__auth', '1');
        const res = await fetch(u.toString(), {
          method: 'POST',
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pass })
        });

        if (res.ok) {
          // Clean any helper params and reload
          const back = new URL(location.href);
          back.searchParams.delete('__auth');
          location.href = back.toString();
          return;
        }
        const data = await res.json().catch(()=>({}));
        err.textContent = data.error || "Incorrect password.";
      } catch {
        err.textContent = "Network error. Please try again.";
      }
    });
  })();
</script>
</body>
</html>`;

  return new Response(html, {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
