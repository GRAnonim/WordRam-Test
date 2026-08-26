const CACHE_NAME = "wordram-v53";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=53",
  "./styles.css?v=53",
  "./data-ce.js?v=53",
  "./data-en.js?v=53",
  "./data.js?v=53",
  "./storage.js?v=53",
  "./generator.js?v=53",
  "./game.js?v=53",
  "./main.js?v=53",
  "./chechen.json",
  "./manifest.webmanifest?v=53",
  "./favicon.svg?v=53",
  "./icon-192.png?v=53",
  "./icon-512.png?v=53",
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
