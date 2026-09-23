// NutriPing service worker: app-shell caching + offline access to the
// last-loaded pages, network-first so a fix/deploy is never masked by a
// stale cached page.
const CACHE_VERSION = "nutriping-php-v1";
const APP_SHELL_CACHE = `${CACHE_VERSION}-shell`;

const APP_SHELL_URLS = [
    "/dashboard",
    "/recipes",
    "/meal-plan",
    "/manifest.webmanifest",
    "/icon-192.png",
    "/icon-512.png",
];

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
                    .filter((key) => key.startsWith("nutriping-php-") && key !== APP_SHELL_CACHE)
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

    // Navigations and static app-shell assets: network-first, so a page always shows the latest
    // deployed code when online — the cache only kicks in when there's no connection at all.
    if (request.mode === "navigate" || APP_SHELL_URLS.includes(url.pathname)) {
        event.respondWith(networkFirst(request));
    }
});

async function networkFirst(request) {
    const cache = await caches.open(APP_SHELL_CACHE);
    try {
        const response = await fetch(request);
        cache.put(request, response.clone());
        return response;
    } catch {
        const cached = await cache.match(request);
        if (cached) return cached;
        return new Response("You're offline and this page hasn't been cached yet.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
        });
    }
}
