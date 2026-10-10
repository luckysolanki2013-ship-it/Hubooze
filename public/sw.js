/**
 * HUBOOZE SERVICE WORKER (v2)
 * - Pages and scripts always come from the network, so a new deploy shows up at once.
 * - Offline: a friendly offline page instead of the browser error.
 * - Product images and icons are cached for speed (stale-while-revalidate).
 * - Push notifications (kept from v1).
 */
const VERSION = 'v2';
const STATIC_CACHE = 'hubooze-static-' + VERSION;
const IMG_CACHE = 'hubooze-img-' + VERSION;
const PRECACHE = ['/offline.html', '/icons/icon-192.png'];
const MAX_IMAGES = 150;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => Promise.all(PRECACHE.map((u) => cache.add(u).catch(() => {}))))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

// Make sure the offline page is stored even if the install-time download failed (weak network).
function ensureOffline() {
  return caches.open(STATIC_CACHE)
    .then((c) => c.match('/offline.html').then((hit) => hit || c.add('/offline.html')))
    .catch(() => {});
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.indexOf('hubooze-') === 0 && k !== STATIC_CACHE && k !== IMG_CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

async function trim(cache, max) {
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.indexOf('/api/') === 0 || url.pathname === '/sw.js') return;

  // Page loads: network first; offline page only when the network is unreachable.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((res) => {
        try { event.waitUntil(ensureOffline()); } catch (e) { ensureOffline(); }
        return res;
      }).catch(() => caches.match('/offline.html').then((r) => r || Response.error()))
    );
    return;
  }

  // Images: show the cached copy instantly, refresh it in the background.
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request).then((res) => {
          if (res && res.status === 200 && res.type === 'basic') {
            cache.put(request, res.clone()).then(() => trim(cache, MAX_IMAGES));
          }
          return res;
        }).catch(() => cached || Response.error());
        return cached || network;
      })
    );
  }
  // Everything else (JS, CSS, fonts, API) goes straight to the network.
});

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch (e) { data = { title: 'Hubooze', body: event.data.text() }; }
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'hubooze-notif',
    data: Object.assign({ url: data.url || '/' }, data.data || {}),
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Hubooze', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.indexOf(self.location.origin) === 0 && 'focus' in c);
      if (existing) { existing.focus(); existing.postMessage({ type: 'navigate', url: url }); return; }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
