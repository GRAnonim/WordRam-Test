/**
 * WordRam - Service Worker (v34)
 * Адаптивное игровое поле без скролла, брендовый Open Graph баннер 1200x630,
 * перенос прогресса между устройствами, 1 500 слов CEFR, Яндекс Метрика, PWA и оффлайн.
 */

const CACHE_NAME = "wordram-v34";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css?v=34",
  "./data.js?v=34",
  "./storage.js?v=34",
  "./generator.js?v=34",
  "./game.js?v=34",
  "./main.js?v=34",
  "./manifest.webmanifest?v=34",
  "./logo.svg",
  "./favicon.svg?v=34",
  "./icon-192.png",
  "./icon-512.png",
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

  if (event.request.url.includes("mc.yandex.ru") || event.request.url.includes("yandex.ru")) {
    return;
  }

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
