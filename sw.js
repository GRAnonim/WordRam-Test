/**
 * WordRam - Service Worker (v38)
 * Уведомления между слотами и полем (не перекрывают тему),
 * подсказка при первом угаданном слове, минималистичный баннер (кириллица),
 * 1 500 слов CEFR, Яндекс Метрика, PWA и оффлайн.
 */

const CACHE_NAME = "wordram-v39";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./styles.css?v=39",
  "./data.js?v=39",
  "./storage.js?v=39",
  "./generator.js?v=39",
  "./game.js?v=39",
  "./main.js?v=39",
  "./manifest.webmanifest?v=39",
  "./logo.svg",
  "./favicon.svg?v=39",
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
