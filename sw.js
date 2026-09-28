const CACHE_NAME = "wordram-v135";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=135",
  "./styles.css?v=135",
  "./data-ce.js?v=135",
  "./data-en.js?v=135",
  "./data.js?v=135",
  "./storage.js?v=135",
  "./generator.js?v=135",
  "./game.js?v=135",
  "./main.js?v=135",
  "./chechen.json",
  "./manifest.webmanifest?v=135",
  "./favicon.svg?v=135",
  "./icon-192.png?v=135",
  "./icon-512.png?v=135",
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
