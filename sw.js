const CACHE_NAME = "wordram-v57";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=57",
  "./styles.css?v=57",
  "./data-ce.js?v=57",
  "./data-en.js?v=57",
  "./data.js?v=57",
  "./storage.js?v=57",
  "./generator.js?v=57",
  "./game.js?v=57",
  "./main.js?v=57",
  "./chechen.json",
  "./manifest.webmanifest?v=57",
  "./favicon.svg?v=57",
  "./icon-192.png?v=57",
  "./icon-512.png?v=57",
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
