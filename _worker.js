// functions/[[path]].js   (or _worker.js if you're using a single worker)

const PROTECTED = [
  /^\/Gifted(\/.*)?$/i,  // protect /Gifted and everything under it
  // add more paths here if you want
];

export async function onRequest(context) {
  const { request, env, next } = context;
  const { pathname } = new URL(request.url);

  // only protect selected paths
  const isProtected = PROTECTED.some(rx => rx.test(pathname));
  if (!isProtected) return next();

  // Browser Basic Auth: "Basic base64(username:password)"
  const auth = request.headers.get("Authorization") || "";

  if (auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6));
      // Accept ANY username; only check password (everything after the first colon)
      const pass = decoded.split(":").slice(1).join(":");
      if (pass === env.BASIC_PASS) {
        return next(); // ✅ allowed
      }
    } catch (_) {
      // fall through to 401
    }
  }

  // Prompt browser login; tell users any username works
  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate":
        'Basic realm="Enter any username; only password is checked"',
      "Cache-Control": "no-store",
    },
  });
}
