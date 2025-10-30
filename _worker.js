// _worker.js  (Cloudflare Pages single worker)
// Requires: Pages > Settings > Environment Variables -> USER_PASS

const PROTECTED = [
  /^\/Gifted(\/.*)?$/i,     // protect /Gifted and everything under it
  // Add more routes here if needed, e.g. /^\/nurtur(\/.*)?$/i,
];

const COOKIE_NAME = "pw_ok";
const COOKIE_VAL  = "1";

// tiny helpers
function isProtectedPath(pathname) {
  return PROTECTED.some(rx => rx.test(pathname));
}
function getCookie(req, name) {
  const raw = req.headers.get("Cookie") || "";
  return raw.split(/;\s*/).map(s => s.split("=")).find(([k]) => k === name)?.[1] || "";
}
function setCookie(name, value, { maxAgeSec = 60 * 60 * 24 * 30 } = {}) {
  const attrs = [
    `${name}=${value}`,
    "Path=/",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`,
  ];
  return attrs.join("; ");
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // if not protected, serve normally
    if (!isProtectedPath(pathname)) {
      return env.ASSETS.fetch(request);
    }

    // already unlocked?
    if (getCookie(request, COOKIE_NAME) === COOKIE_VAL) {
      return env.ASSETS.fetch(request);
    }

    // handle form POST (password attempt)
    if (request.method === "POST") {
      const contentType = request.headers.get("content-type") || "";
      let pass = "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = await request.formData();
        pass = (form.get("pw") || "").toString();
      } else if (contentType.includes("application/json")) {
        const body = await request.json().catch(() => ({}));
        pass = (body.pw || "").toString();
      }

      if (pass && env.USER_PASS && pass === env.USER_PASS) {
        // success → set cookie and redirect back to the same URL
        const res = new Response(null, {
          status: 303,
          headers: {
            "Location": url.href,
            "Set-Cookie": setCookie(COOKIE_NAME, COOKIE_VAL),
            "Cache-Control": "no-store",
          },
        });
        return res;
      }
      // wrong password → re-render lock with an error note
      return lockScreen(url, { bad: true });
    }

    // GET (no cookie) → show lock screen
    return lockScreen(url);
  }
};

// === HTML lock screen (inline CSS; your pink gradient; password-only) ===
function lockScreen(url, { bad = false } = {}) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Locked</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/duotone/style.css" />

<style>
  :root{
    --brand-1:#D6739F;
    --brand-2:#E78A91;
    --ink-900:#2b2b2b;
    --muted:#7d7d7d;
    --card:#ffffff;
    --border:rgba(0,0,0,.10);
    --shadow:0 12px 40px rgba(0,0,0,.12);
    --radius:20px;
  }
  *{ box-sizing:border-box; }
  html,body{ height:100%; margin:0; }
  body{
    font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial;
    color:var(--ink-900);
  }
  .lock-wrap{
    min-height:100dvh;
    display:grid;
    place-items:center;
    padding:clamp(16px,4vw,32px);
    background:
      radial-gradient(70% 60% at 80% 20%, rgba(255,255,255,.35), transparent 70%),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--brand-1) 30%, transparent),
        color-mix(in srgb, var(--brand-2) 30%, transparent)
      );
  }
  .lock-card{
    width:min(640px, 92vw);
    background:var(--card);
    border:1px solid var(--border);
    border-radius:var(--radius);
    box-shadow:var(--shadow);
    padding:clamp(20px,4vw,28px);
    display:grid;
    gap:16px;
  }
  .lock-head{ display:grid; grid-template-columns:auto 1fr; align-items:center; gap:12px; }
  .lock-title{
    margin:0;
    font:600 clamp(20px,3.2vw,28px)/1.15 Poppins, Inter, system-ui, -apple-system;
    background:linear-gradient(90deg, var(--brand-1), var(--brand-2));
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  .lock-sub{ margin:4px 0 8px; color:#454656; font-size:clamp(14px,1.8vw,16px); }
  .lock-form{ display:grid; gap:12px; margin-top:4px; }
  .lock-label{ font-size:14px; color:var(--muted); }
  .lock-input{
    width:100%; height:44px; padding:0 12px; border-radius:10px;
    border:1px solid var(--border); outline:none; font-size:16px;
  }
  .lock-input:focus{ border-color:rgba(214,115,159,.6); box-shadow:0 0 0 3px rgba(255,90,95,.08); }
  .lock-btn{
    height:44px; border:none; border-radius:999px; color:#fff; font-weight:600; font-size:15px; cursor:pointer;
    background-image:linear-gradient(90deg, var(--brand-1), var(--brand-2));
    box-shadow:0 8px 22px rgba(255,90,95,.28);
    transition:transform .12s ease, box-shadow .12s ease, opacity .12s ease; margin-top:12px;
  }
  .lock-btn:hover{ transform:translateY(-1px); }
  .lock-btn:active{ transform:translateY(0); box-shadow:0 6px 18px rgba(255,90,95,.24); }
  .lock-err{ margin:0; color:#b42318; font-size:13px; }
  @media (max-width:520px){ .lock-card{ padding:18px; gap:12px; } }
</style>
</head>
<body>
  <main class="lock-wrap">
    <section class="lock-card" role="dialog" aria-labelledby="lockTitle" aria-describedby="lockDesc">
      <div class="lock-head">
        <div class="lock-icon" aria-hidden="true"><i class="ph-duotone ph-lock-key" style="color:#D6739F; font-size:40px;"></i></div>
        <div><h1 id="lockTitle" class="lock-title">This page is password-protected</h1></div>
      </div>
      <p id="lockDesc" class="lock-sub">Enter the password to continue</p>
      ${bad ? `<p class="lock-err">Incorrect password. Please try again.</p>` : ``}
      <form class="lock-form" method="POST" action="${escapeHtml(url.pathname)}">
        <label class="lock-label" for="pw">Password</label>
        <input id="pw" class="lock-input" name="pw" type="password" placeholder="Enter password" autocomplete="off" required />
        <button class="lock-btn" type="submit">Unlock</button>
      </form>
    </section>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: bad ? 401 : 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c =>
    ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;" }[c])
  );
}
