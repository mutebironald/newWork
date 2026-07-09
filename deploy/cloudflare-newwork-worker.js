/**
 * Cloudflare Worker: proxies newwork.dimaggi.ai (or dimaggi.ai/newwork/*) to the Firebase App Hosting
 * backend.
 *
 * Setup:
 *   1. Replace BACKEND_ORIGIN with your App Hosting URL (shown after
 *      `firebase apphosting:backends:create`, e.g. https://newwork--PROJECT.us-central1.hosted.app).
 *   2. Cloudflare dashboard → Workers & Pages → Create Worker → paste this file.
 *   3. Worker → Settings → Domains & Routes → Add route:
 *        route:  newwork.dimaggi.ai/* (or dimaggi.ai/newwork*)
 *        zone:   dimaggi.ai
 */

const BACKEND_ORIGIN = "https://REPLACE-WITH-BACKEND.hosted.app";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const target = new URL(url.pathname + url.search, BACKEND_ORIGIN);

    const proxied = new Request(target, request);
    proxied.headers.set("X-Forwarded-Host", url.hostname);

    const response = await fetch(proxied, { redirect: "manual" });

    // Rewrite absolute redirects from the backend to stay on dimaggi.ai
    const location = response.headers.get("Location");
    if (location && location.startsWith(BACKEND_ORIGIN)) {
      const rewritten = new Response(response.body, response);
      rewritten.headers.set(
        "Location",
        location.replace(BACKEND_ORIGIN, `https://${url.hostname}`)
      );
      return rewritten;
    }

    return response;
  },
};
