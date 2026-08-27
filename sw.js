const CACHE_NAME = "wordram-v59";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=59",
  "./styles.css?v=59",
  "./data-ce.js?v=59",
  "./data-en.js?v=59",
  "./data.js?v=59",
  "./storage.js?v=59",
  "./generator.js?v=59",
  "./game.js?v=59",
  "./main.js?v=59",
  "./chechen.json",
  "./manifest.webmanifest?v=59",
  "./favicon.svg?v=59",
  "./icon-192.png?v=59",
  "./icon-512.png?v=59",
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
