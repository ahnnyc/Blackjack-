// Keeps the game on the phone so it opens with no internet connection.
// The game page itself is fetched fresh whenever the phone is online, so an update shows
// on the very next open; the saved copy is used only when offline or the network is slow.
// Change VERSION whenever index.html changes.
const VERSION = 'bj-2026-11-27.34';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const PAGE_WAIT_MS = 3000;   // how long to wait for the network before using the saved copy

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;

  // The game page: newest from the network first, saved copy if offline or slow.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      const net = fetch(req, { cache: 'no-cache' }).then(res => {
        if (res && res.ok) cache.put('index.html', res.clone());
        return res;
      }).catch(() => null);
      const timeout = new Promise(r => setTimeout(() => r(null), PAGE_WAIT_MS));
      const first = await Promise.race([net, timeout]);
      if (first && first.ok) return first;
      const saved = await cache.match('index.html');
      if (saved) { e.waitUntil(net); return saved; }
      const late = await net;
      return late || new Response('Offline', { status: 503, statusText: 'Offline' });
    })());
    return;
  }

  // Everything else (icons, fonts): saved copy first, refreshed in the background.
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    const res = await fresh;
    return res || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
