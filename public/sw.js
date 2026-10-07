/* Service worker BTS2 CV-A Gestion.
 * - Assets statiques (JS/CSS/polices/images/icônes) : cache d'abord (versionné par Next, donc sûr).
 * - Pages et données : TOUJOURS réseau (jamais mises en cache : données privées, appareils partagés).
 * - Hors ligne : page /offline.
 */
const VERSION = "v1";
const STATIC_CACHE = `bts2-static-${VERSION}`;
const OFFLINE_URL = "/offline";
const PRECACHE = [OFFLINE_URL, "/icon-192.png", "/icon-512.png", "/logo-bts2.jpeg", "/logo-esma.jpeg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("bts2-") && k !== STATIC_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isStatic = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.startsWith("/_next/static/") || /\.(?:png|jpe?g|svg|ico|webp|woff2?)$/.test(url.pathname));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
