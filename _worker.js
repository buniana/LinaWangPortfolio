// _worker.js  (for Cloudflare Pages)
// Password-only Basic Auth for selected paths.
// Requires Pages secret: BASIC_PASS

const PROTECTED = [
  /^\/Gifted(\/.*)?$/i,  // protect /Gifted and its subpaths
  // add more patterns as needed
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // not protected → serve static asset
    const isProtected = PROTECTED.some(rx => rx.test(url.pathname));
    if (!isProtected) {
      return env.ASSETS.fetch(request);
    }

    // ensure secret exists (avoid crashes)
    if (!env?.BASIC_PASS) {
      return new Response("Server misconfiguration: BASIC_PASS not set", { status: 500 });
    }

    // Browser Basic Auth header: "Basic base64(username:password)"
    const auth = request.headers.get("Authorization") || "";
    if (auth.startsWith("Basic ")) {
      try {
        const decoded = atob(auth.slice(6)); // "user:pass"
        // ignore username; check only password (everything after first colon)
        const pass = decoded.split(":").slice(1).join(":");
        if (pass === env.BASIC_PASS) {
          return env.ASSETS.fetch(request); // ✅ allow
        }
      } catch {
        // fall through to 401
      }
    }

    // Prompt login (any username works)
    return new Response("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate":
          'Basic realm="Enter any username; only password is checked"',
        "Cache-Control": "no-store",
      },
    });
  }
};
