const CACHE_NAME = "wordram-v137";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=137",
  "./styles.css?v=137",
  "./data-ce.js?v=137",
  "./data-en.js?v=137",
  "./data.js?v=137",
  "./storage.js?v=137",
  "./generator.js?v=137",
  "./game.js?v=137",
  "./main.js?v=137",
  "./chechen.json",
  "./manifest.webmanifest?v=137",
  "./favicon.svg?v=137",
  "./icon-192.png?v=137",
  "./icon-512.png?v=137",
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
