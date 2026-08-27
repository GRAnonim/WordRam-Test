const CACHE_NAME = "wordram-v54";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=54",
  "./styles.css?v=54",
  "./data-ce.js?v=54",
  "./data-en.js?v=54",
  "./data.js?v=54",
  "./storage.js?v=54",
  "./generator.js?v=54",
  "./game.js?v=54",
  "./main.js?v=54",
  "./chechen.json",
  "./manifest.webmanifest?v=54",
  "./favicon.svg?v=54",
  "./icon-192.png?v=54",
  "./icon-512.png?v=54",
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
