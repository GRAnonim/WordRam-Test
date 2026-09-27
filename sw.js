const CACHE_NAME = "wordram-v109";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=109",
  "./styles.css?v=109",
  "./data-ce.js?v=109",
  "./data-en.js?v=109",
  "./data.js?v=109",
  "./storage.js?v=109",
  "./generator.js?v=109",
  "./game.js?v=109",
  "./main.js?v=109",
  "./chechen.json",
  "./manifest.webmanifest?v=109",
  "./favicon.svg?v=109",
  "./icon-192.png?v=109",
  "./icon-512.png?v=109",
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
