// _worker.js — password-only gate for /Gifted (and children)

const PROTECTED = [/^\/nurtur(\/.*)?$/i];
const COOKIE_NAME = "pwok";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // ---- resolve the configured password (supports both names) ----
    const CONFIG_PASS = (env.USER_PASS ?? env.BASIC_PASS ?? "").toString().trim();

    // Handle the password POST first
    if (path === "/__pwcheck" && request.method === "POST") {
      const form = await request.formData().catch(() => null);
      const pass = (form?.get("pass") ?? "").toString().trim();
      const returnTo = form?.get("return_to") || "/";

      if (CONFIG_PASS && pass === CONFIG_PASS) {
        return new Response(null, {
          status: 303,
          headers: {
            Location: returnTo,
            "Set-Cookie": serializeCookie(COOKIE_NAME, "1", {
              path: "/", httpOnly: true, secure: true, sameSite: "Lax",
              maxAge: COOKIE_MAX_AGE,
            }),
          },
        });
      }

      // wrong or unset password -> bounce with flag
      const u = new URL(returnTo, url.origin);
      u.searchParams.set("auth", "bad");
      return new Response(null, { status: 303, headers: { Location: u.toString() } });
    }

    // Non-protected paths pass through
    if (!PROTECTED.some(rx => rx.test(path))) {
      return env.ASSETS.fetch(request);
    }

    // Already authenticated?
    if (hasValidCookie(request.headers.get("Cookie"))) {
      return env.ASSETS.fetch(request);
    }

    // Not authenticated -> show lock form (GET/HEAD)
    if (request.method === "GET" || request.method === "HEAD") {
      return passwordForm(new URL(request.url));
    }

    return new Response("Unauthorized", { status: 401 });
  },
};

function hasValidCookie(h) {
  return !!h && h.split(/;\s*/).some(c => c.startsWith(`${COOKIE_NAME}=`));
}

function serializeCookie(name, val, opts = {}) {
  const segs = [`${name}=${val}`];
  if (opts.maxAge) segs.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) segs.push(`Path=${opts.path}`);
  if (opts.httpOnly) segs.push(`HttpOnly`);
  if (opts.secure) segs.push(`Secure`);
  if (opts.sameSite) segs.push(`SameSite=${opts.sameSite}`);
  return segs.join("; ");
}

function passwordForm(currentUrl) {
  const returnTo = currentUrl.pathname + currentUrl.search;
  const bad = currentUrl.searchParams.get("auth") === "bad";

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Protected</title>

<!-- Fonts to match your site -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/duotone/style.css" />

<style>
  :root{
    /* Match your home-page pinks */
    --brand-1: #D6739F;   /* left stop */
    --brand-2: #E78A91;   /* right stop */
    --ink-900: #2b2b2b;
    --muted:  #7d7d7d;
    --card:   #ffffff;
    --border: rgba(0,0,0,.10);
    --shadow: 0 12px 40px rgba(0,0,0,.12);
    --radius: 20px;
  }

  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }
  body {
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
    color: var(--ink-900);
  }

  /* Full-screen gradient background (no blur) */
  .lock-wrap {
    min-height: 100dvh;
    display: grid;
    place-items: center;
    padding: clamp(16px, 4vw, 32px);
    background:
      radial-gradient(70% 60% at 80% 20%, rgba(255,255,255,.35), transparent 70%),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--brand-1) 30%, transparent),
        color-mix(in srgb, var(--brand-2) 30%, transparent)
      );
  }

  /* Card */
  .lock-card {
    width: min(640px, 92vw);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: clamp(20px, 4vw, 28px);
    display: grid;
    gap: 16px;
  }

  .lock-head { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; }
  .lock-title {
    margin: 0;
    font: 600 clamp(20px, 3.2vw, 28px)/1.15 Poppins, Inter, system-ui, -apple-system;
    background: linear-gradient(90deg, var(--brand-1), var(--brand-2));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  .lock-sub {
    margin: 4px 0 8px;
    color: #454656;
    font-size: clamp(14px, 1.8vw, 16px);
  }
  .lock-err { margin: 0; color: #b42318; font-size: 13px; }

  /* Form */
  .lock-form { display: grid; gap: 12px; margin-top: 4px; }
  .lock-label { font-size: 14px; color: var(--muted); }

  .lock-input {
    width: 100%;
    height: 44px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    outline: none;
    font-size: 16px;
  }
  .lock-input:focus {
    border-color: rgba(214, 115, 159, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 90, 95, 0.08);
  }

  .lock-btn {
    height: 44px;
    border: none;
    border-radius: 999px;
    color: #fff;
    font-weight: 600;
    font-size: 15px;
    cursor: pointer;
    background-image: linear-gradient(90deg, var(--brand-1), var(--brand-2));
    box-shadow: 0 8px 22px rgba(255, 90, 95, .28);
    transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
    margin-top: 12px;
  }
  .lock-btn:hover { transform: translateY(-1px); }
  .lock-btn:active { transform: translateY(0); box-shadow: 0 6px 18px rgba(255, 90, 95, .24); }

  @media (max-width: 520px){
    .lock-card { padding: 18px; gap: 12px; }
  }
</style>
</head>
<body>
  <main class="lock-wrap">
    <section class="lock-card" role="dialog" aria-labelledby="lockTitle" aria-describedby="lockDesc">
      <div class="lock-head">
        <div class="lock-icon" aria-hidden="true">
          <i class="ph-duotone ph-lock-key" style="color:#D6739F; font-size:40px;"></i>
        </div>
        <div>
          <h1 id="lockTitle" class="lock-title">This page is password-protected</h1>
        </div>
      </div>

      <p id="lockDesc" class="lock-sub">Enter the password to continue</p>
      ${bad ? `<p class="lock-err">Incorrect password. Please try again.</p>` : ``}

      <form class="lock-form" method="post" action="/__pwcheck">
        <label class="lock-label" for="pass">Password</label>
        <input id="pass" class="lock-input" name="pass" type="password" placeholder="Enter password" autocomplete="current-password" required autofocus />
        <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}" />
        <button class="lock-btn" type="submit">Unlock</button>
      </form>
    </section>
  </main>
</body></html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
    status: bad ? 401 : 200,
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}
