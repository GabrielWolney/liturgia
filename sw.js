
const CACHE_NAME = "agape-v1000";

const ASSETS = [
  "./",          
  "./index.html",
  "./css/main.css",
  "./js/main.js",  
  "./js/modules/avisos.js",
  "./js/modules/calendar.js",
  "./js/modules/mural.js",
  "./js/modules/liturgia.js",
  "./js/modules/bible.js",
  "./js/modules/novenas.js",
  "./js/modules/prayers.js",
  "./js/modules/admin.js",
  "./js/modules/install.js",
  "./site.webmanifest"
];


self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS.map(url => new Request(url, {cache: 'reload'}))); 
    })
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Removendo cache antigo:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim(); 
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    fetch(e.request)
      .then((response) => {

        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
    
        return caches.match(e.request);
      })
  );
});