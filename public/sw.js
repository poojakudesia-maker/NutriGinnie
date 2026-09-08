// NutriPing service worker: app-shell caching + offline access to the
// last-loaded diet plan / grocery list pages and their API responses.
const CACHE_VERSION = "nutriping-v2";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;
const API_CACHE = `${CACHE_VERSION}-api`;

const APP_SHELL_URLS = ["/dashboard", "/plan", "/grocery", "/settings", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("nutriping-") && key !== APP_SHELL_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Diet-plan / grocery GET API calls: network-first, fall back to cache when offline.
  if (url.pathname.startsWith("/api/diet-plan") || url.pathname.startsWith("/api/grocery")) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // Navigations and static app-shell assets: network-first, so a page always shows the latest
  // deployed code when online — the cache only kicks in when there's no connection at all. (A
  // stale-while-revalidate strategy here would keep serving an old cached page indefinitely,
  // masking every future fix/update behind a screen that looks identical to the bug being fixed.)
  if (request.mode === "navigate" || APP_SHELL_URLS.includes(url.pathname)) {
    event.respondWith(networkFirst(request, APP_SHELL_CACHE));
  }
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true, error: "You're offline and this hasn't been cached yet." }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}
