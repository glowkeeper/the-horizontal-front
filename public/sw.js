const CACHE_PREFIX = "horizontal-front-";
const CACHE_NAME = `${CACHE_PREFIX}${"__BUILD_VERSION__"}`;
const APP_SHELL = "__PRECACHE_ASSETS__";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);

  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request).catch(async () => {
      /*
       * `ignoreVary` matters more than it looks.
       *
       * Cache matching honours a cached response's `Vary` header by default,
       * and static hosts routinely attach one — `Vary: Origin` locally, and
       * commonly `Vary: Accept-Encoding` in production. A script request from
       * the page does not carry the same headers as the request that filled
       * the cache, so the match silently fails and the app shell returns
       * `Response.error()` for its own JavaScript.
       *
       * The effect is worse than an obvious failure: pages still load from
       * cache, so the site looks offline-capable while the game never starts.
       * Nothing here genuinely varies by request header — it is one origin
       * serving fixed files — so the header is ignored deliberately.
       */
      const cached = await caches.match(request, {
        ignoreSearch: true,
        ignoreVary: true,
      });

      if (cached) {
        return cached;
      }

      if (request.mode === "navigate") {
        return caches.match("/", { ignoreVary: true });
      }

      return Response.error();
    }),
  );
});
