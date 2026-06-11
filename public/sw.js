const CACHE_NAME = "cero-a-cero-v2";
const ASSETS = [
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
  "/logo_0-0nobg.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // NO interceptar páginas, rutas de API ni flujos de autenticación de NextAuth.
  // Solo interceptamos recursos estáticos (imágenes, CSS, JS, etc.)
  const isStaticAsset =
    event.request.method === "GET" &&
    (url.pathname.startsWith("/_next/static/") ||
     url.pathname.endsWith(".png") ||
     url.pathname.endsWith(".jpg") ||
     url.pathname.endsWith(".jpeg") ||
     url.pathname.endsWith(".svg") ||
     url.pathname.endsWith(".json") ||
     url.pathname.endsWith(".js") ||
     url.pathname.endsWith(".css"));

  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          })
          .catch(() => {
            // Si la red falla y no está en caché, devolvemos una respuesta de error válida
            return new Response("Error de red", {
              status: 408,
              headers: { "Content-Type": "text/plain" },
            });
          });
      })
    );
  }
});
