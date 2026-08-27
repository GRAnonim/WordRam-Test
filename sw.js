const CACHE_NAME = "wordram-v58";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=58",
  "./styles.css?v=58",
  "./data-ce.js?v=58",
  "./data-en.js?v=58",
  "./data.js?v=58",
  "./storage.js?v=58",
  "./generator.js?v=58",
  "./game.js?v=58",
  "./main.js?v=58",
  "./chechen.json",
  "./manifest.webmanifest?v=58",
  "./favicon.svg?v=58",
  "./icon-192.png?v=58",
  "./icon-512.png?v=58",
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
