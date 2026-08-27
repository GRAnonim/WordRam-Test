const CACHE_NAME = "wordram-v56";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html?v=56",
  "./styles.css?v=56",
  "./data-ce.js?v=56",
  "./data-en.js?v=56",
  "./data.js?v=56",
  "./storage.js?v=56",
  "./generator.js?v=56",
  "./game.js?v=56",
  "./main.js?v=56",
  "./chechen.json",
  "./manifest.webmanifest?v=56",
  "./favicon.svg?v=56",
  "./icon-192.png?v=56",
  "./icon-512.png?v=56",
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
