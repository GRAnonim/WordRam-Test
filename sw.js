const CACHE_NAME = "wordram-v139";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=139",
  "./styles.css?v=139",
  "./data-ce.js?v=139",
  "./data-en.js?v=139",
  "./data.js?v=139",
  "./storage.js?v=139",
  "./generator.js?v=139",
  "./game.js?v=139",
  "./main.js?v=139",
  "./chechen.json",
  "./manifest.webmanifest?v=139",
  "./favicon.svg?v=139",
  "./icon-192.png?v=139",
  "./icon-512.png?v=139",
  "./logo.svg",
  "./og-image.jpg"
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
