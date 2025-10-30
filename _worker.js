// _worker.js — Basic Auth for Cloudflare Pages (protects a path or whole site)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Change this to the section you want to protect.
    // Examples:
    //   "/"      → protect entire site
    //   "/agnes" → protect only /agnes (and everything under it)
    //   "/nurtur"→ protect only /nurtur
    const PROTECTED_PREFIX = "/Gifted";

    // Let everything else through
    if (!url.pathname.startsWith(PROTECTED_PREFIX)) {
      return env.ASSETS.fetch(request);
    }

    // Build expected Basic auth header from env vars
    const auth = request.headers.get("Authorization") || "";
    const expected = "Basic " + btoa(`${env.BASIC_USER}:${env.BASIC_PASS}`);

    if (auth !== expected) {
      return new Response("Authentication required", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="Restricted"',
          "Cache-Control": "no-store",
        },
      });
    }

    // Auth OK → serve static asset
    return env.ASSETS.fetch(request);
  },
};
