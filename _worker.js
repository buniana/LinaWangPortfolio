// _worker.js — password-only gate for /Gifted (and children)

const PROTECTED = [/^\/Gifted(\/.*)?$/i];
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

      // wrong or unset password -> bounce
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

    // Not authenticated -> show form
    if (request.method === "GET" || request.method === "HEAD") {
      return passwordForm(new URL(request.url));
    }

    return new Response("Unauthorized", { status: 401 });
  },
};

function hasValidCookie(h) {
  return !!h && h.split(/;\s*/).some(c => c.startsWith("pwok="));
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
  const html = `<!doctype html>
<html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Protected</title>
<style>
  :root{ --bg:rgba(255,255,255,.7); --ring:#0F4424; --text:#1b1b1b; --muted:#6b7280;}
  *{box-sizing:border-box} html,body{height:100%}
  body{margin:0; font:16px/1.45 Inter,system-ui,-apple-system,Segoe UI,Roboto,"Helvetica Neue",Arial}
  .wrap{min-height:100%; display:grid; place-items:center; background:#f5f7f6}
  .panel{width:min(92vw,420px); background:var(--bg); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px);
    border:1px solid rgba(0,0,0,.08); border-radius:16px; padding:24px; box-shadow:0 10px 30px rgba(0,0,0,.08)}
  h1{margin:0 0 8px; font-size:20px; font-weight:600}
  p.muted{margin:0 0 16px; color:var(--muted)}
  .field{display:grid; gap:8px; margin:12px 0 16px}
  input[type=password]{padding:12px 14px; border-radius:10px; border:1px solid rgba(0,0,0,.12); outline:none}
  input[type=password]:focus{border-color:var(--ring); box-shadow:0 0 0 3px rgba(15,68,36,.15)}
  .btn{display:inline-block; background:#0F4424; color:#fff; border:0; padding:10px 16px; border-radius:999px; cursor:pointer}
  .error{margin:8px 0 0; color:#b00020; font-size:14px}
</style>
<div class="wrap">
  <form class="panel" method="post" action="/__pwcheck">
    <h1>Enter password</h1>
    <p class="muted">This page is private.</p>
    <div class="field">
      <label for="pass">Password</label>
      <input id="pass" name="pass" type="password" autocomplete="current-password" required autofocus>
    </div>
    <input type="hidden" name="return_to" value="${escapeHtml(returnTo)}">
    <button class="btn" type="submit">Continue</button>
    ${bad ? `<div class="error">Incorrect password. Try again.</div>` : ``}
  </form>
</div>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
function escapeHtml(s){return s.replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
