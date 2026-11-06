const manifest = /* OFFLINE_MANIFEST */ null;
const scope = new URL(self.registration.scope);
const prefix = 'dive-atlas-training@' + scope.href + '#';
const cacheName = prefix + manifest.version;
const assets = new Map(manifest.entries.map(([path, integrity]) => [new URL(path, scope).href, integrity]));
const index = new URL('index.html', scope);

self.addEventListener('install', event => {
  const requests = [...assets].map(([url, integrity]) => new Request(url, { cache: 'reload', integrity }));
  event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(requests)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(prefix) && key !== cacheName).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== scope.origin) return;
  const key = request.mode === 'navigate' && (url.pathname === scope.pathname || url.pathname === index.pathname)
    ? index.href : url.href;
  if (!assets.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const stored = await cache.match(key);
    if (stored) return stored;
    const response = await fetch(key, { cache: 'reload', integrity: assets.get(key) });
    if (response.ok) await cache.put(key, response.clone());
    return response;
  })());
});
