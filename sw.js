const CACHE_NAME = "wordram-v55";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=55",
  "./styles.css?v=55",
  "./data-ce.js?v=55",
  "./data-en.js?v=55",
  "./data.js?v=55",
  "./storage.js?v=55",
  "./generator.js?v=55",
  "./game.js?v=55",
  "./main.js?v=55",
  "./chechen.json",
  "./manifest.webmanifest?v=55",
  "./favicon.svg?v=55",
  "./icon-192.png?v=55",
  "./icon-512.png?v=55",
  "./logo.svg",
  "./og-image.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
