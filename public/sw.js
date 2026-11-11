const CACHE = 'homegame';
const SCOPE = '/homegame/';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      cache.addAll([
        SCOPE,
        SCOPE + 'manifest.json',
        SCOPE + 'icon-192.png',
        SCOPE + 'icon-512.png',
        SCOPE + 'adel.mp3',
        SCOPE + 'bl.mp3',
        SCOPE + 'carl.mp3',
        SCOPE + 'coll.mp3',
        SCOPE + 'ess.mp3',
        SCOPE + 'fre.mp3',
        SCOPE + 'gcfc.mp3',
        SCOPE + 'geel.mp3',
        SCOPE + 'gws.mp3',
        SCOPE + 'haw.mp3',
        SCOPE + 'melb.mp3',
        SCOPE + 'nmfc.mp3',
        SCOPE + 'port.mp3',
        SCOPE + 'rich.mp3',
        SCOPE + 'stk.mp3',
        SCOPE + 'syd.mp3',
        SCOPE + 'wb.mp3',
        SCOPE + 'wce.mp3',
        SCOPE + 'siren.mp3',
        SCOPE + 'draw.mp3',
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (!event.request.url.includes(SCOPE)) return;
  if (event.request.url.startsWith(self.location.origin + SCOPE + 'api')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      });
      return cached || network;
    })
  );
});
