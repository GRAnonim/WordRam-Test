const CACHE_NAME = "wordram-v52";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=52",
  "./styles.css?v=52",
  "./data-ce.js?v=52",
  "./data-en.js?v=52",
  "./data.js?v=52",
  "./storage.js?v=52",
  "./generator.js?v=52",
  "./game.js?v=52",
  "./main.js?v=52",
  "./chechen.json",
  "./manifest.webmanifest?v=52",
  "./favicon.svg?v=52",
  "./icon-192.png?v=52",
  "./icon-512.png?v=52",
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
