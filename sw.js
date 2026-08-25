/**
 * WordRam - Service Worker (v40)
 * Multilingual Support: English CEFR & Chechen (~1500 words),
 * Complete PWA Offline Cache.
 */

const CACHE_NAME = "wordram-v42";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css?v=42",
  "./data.js?v=42",
  "./chechen.json",
  "./storage.js?v=42",
  "./generator.js?v=42",
  "./game.js?v=42",
  "./main.js?v=42",
  "./manifest.webmanifest?v=42",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./logo.svg",
  "./og-image.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Очистка старого кэша:", key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        return caches.match("./index.html");
      });
    })
  );
});
