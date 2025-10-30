// Protect only these paths (edit as you like)
const PROTECTED = [
  /^\/Gifted(\/.*)?$/i,
  // add more, e.g. /^\/nurtur(\/.*)?$/i
];

// name + settings for the session cookie
const COOKIE_NAME = "pw_gate";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const { pathname } = url;

  const isProtected = PROTECTED.some(rx => rx.test(pathname));
  if (!isProtected) return next();

  // already unlocked?
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  if (cookies[COOKIE_NAME] === "ok") {
    return next();
  }

  // Handle unlock attempts (password only)
  if (request.method === "POST") {
    try {
      const ct = request.headers.get("content-type") || "";
      let pass = "";
      if (ct.includes("application/x-www-form-urlencoded")) {
        const form = await request.formData();
        pass = (form.get("pw") || "").toString();
      } else if (ct.includes("application/json")) {
        const data = await request.json();
        pass = (data?.pw || "").toString();
      }

      if (pass && env.USER_PASS && pass === env.USER_PASS) {
        // success → set session cookie then bounce back to GET
        const headers = new Headers({
          "Set-Cookie": cookieHeader({
            name: COOKIE_NAME,
            value: "ok",
            maxAge: COOKIE_MAX_AGE,
            path: "/", // or narrow to a specific base path if you prefer
            sameSite: "Lax",
            httpOnly: true,
            secure: true,
          }),
          "Cache-Control": "no-store",
          "Location": url.pathname + url.search,
        });
        return new Response(null, { status: 303, headers });
      }

      // wrong password → show page with error
      return new Response(LOCK_HTML({ error: true }), {
        status: 401,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return new Response(LOCK_HTML({ error: true }), {
        status: 400,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    }
  }

  // Default: show lock screen (GET)
  return new Response(LOCK_HTML({ error: false }), {
    status: 401,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/* ---------------- helpers ---------------- */

function parseCookies(header) {
  const out = {};
  header.split(/;\s*/).forEach(kv => {
    const idx = kv.indexOf("=");
    if (idx > -1) {
      const k = kv.slice(0, idx).trim();
      const v = kv.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  });
  return out;
}

function cookieHeader({
  name,
  value,
  maxAge,
  path = "/",
  sameSite = "Lax",
  httpOnly = true,
  secure = true,
}) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${path}`,
    `Max-Age=${maxAge}`,
    `SameSite=${sameSite}`,
  ];
  if (httpOnly) parts.push("HttpOnly");
  if (secure) parts.push("Secure");
  return parts.join("; ");
}

/* -------------- your finalized HTML/CSS -------------- */
/* (password-only; matches your gradient + card styling) */

function LOCK_HTML({ error }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Lock Screen</title>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Poppins:wght@400;600&display=swap" rel="stylesheet">

<link rel="stylesheet" type="text/css"
 href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/duotone/style.css"/>

<style>
  :root{
    --brand-1: #D6739F;
    --brand-2: #E78A91;
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
  .lock-card {
    width: clamp(300px, 70vw, 480px);
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    padding: clamp(20px, 4vw, 32px);
    display: grid;
    gap: 16px;
  }
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
  .lock-form { display: grid; gap: 12px; margin-top: 4px; }
  .lock-label { font-size: 14px; color: var(--muted); }
  .lock-input {
    width: 100%; height: 44px; padding: 0 12px;
    border-radius: 10px; border: 1px solid var(--border);
    outline: none; font-size: 16px;
  }
  .lock-input:focus {
    border-color: rgba(214, 115, 159, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 90, 95, 0.08);
  }
  .lock-btn {
    height: 44px; border: none; border-radius: 999px;
    color: #fff; font-weight: 600; font-size: 15px; cursor: pointer;
    background-image: linear-gradient(90deg, var(--brand-1), var(--brand-2));
    box-shadow: 0 8px 22px rgba(255, 90, 95, .28);
    transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
    margin-top: 12px;
  }
  .lock-btn:hover { transform: translateY(-1px); }
  .lock-btn:active { transform: translateY(0); box-shadow: 0 6px 18px rgba(255, 90, 95, .24); }
  .lock-btn[disabled]{ opacity:.6; cursor: not-allowed; }
  .lock-head {
    display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px;
  }
  .lock-error {
    margin: 4px 0 0;
    font-size: 13px; color: #b00020;
  }
  @media (max-width: 520px){ .lock-card { padding: 18px; gap: 12px; } }
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
      ${error ? `<p class="lock-error">Incorrect password. Please try again.</p>` : ``}
      <form class="lock-form" method="POST" action="">
        <label class="lock-label" for="pw">Password</label>
        <input id="pw" name="pw" class="lock-input" type="password" placeholder="Enter password" autocomplete="off" required />
        <button class="lock-btn" type="submit">Unlock</button>
      </form>
    </section>
  </main>
</body>
</html>`;
}
