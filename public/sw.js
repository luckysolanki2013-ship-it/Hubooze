/**
 * HUBOOZE SERVICE WORKER
 * Handles: offline caching, background sync, push notifications
 */
const CACHE_NAME    = 'hubooze-v1.0.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/js/api.js',
  '/js/app.js',
  '/manifest.json',
];

const API_BASE = '/api';

// ── INSTALL: cache static assets ─────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean old caches ────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Deleting old cache:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: network-first for API, cache-first for assets ─────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // API calls: network-first, no cache
  if (url.pathname.startsWith(API_BASE)) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'You are offline. Please reconnect.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Cache successful responses
        if (response.ok && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// ── BACKGROUND SYNC: retry failed orders ─────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    console.log('[SW] Background sync: orders');
    event.waitUntil(syncPendingOrders());
  }
});

async function syncPendingOrders() {
  try {
    const pending = await getPendingFromIDB('pending-orders');
    for (const order of pending) {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${order.token}` },
        body: JSON.stringify(order.data),
      });
      await removeFromIDB('pending-orders', order.id);
    }
  } catch (err) {
    console.error('[SW] Sync failed:', err);
  }
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Hubooze', body: event.data.text() }; }

  const options = {
    body:    data.body || 'You have a new notification',
    icon:    '/icons/icon-192.png',
    badge:   '/icons/icon-72.png',
    vibrate: [200, 100, 200],
    tag:     data.tag || 'hubooze-notif',
    data:    { url: data.url || '/', ...data.data },
    actions: data.actions || [
      { action: 'view',    title: 'View',    icon: '/icons/icon-72.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icons/icon-72.png' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Hubooze', options)
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const existing = clientList.find(c => c.url.includes(self.location.origin) && 'focus' in c);
      if (existing) { existing.focus(); existing.postMessage({ type: 'navigate', url }); }
      else if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ── SIMPLE IDB HELPERS ────────────────────────────────────────────
function getPendingFromIDB(store) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hubooze-offline', 1);
    req.onupgradeneeded = e => e.target.result.createObjectStore(store, { keyPath: 'id' });
    req.onsuccess = e => {
      const tx = e.target.result.transaction(store, 'readonly');
      const all = tx.objectStore(store).getAll();
      all.onsuccess = () => resolve(all.result || []);
      all.onerror   = () => resolve([]);
    };
    req.onerror = () => resolve([]);
  });
}

function removeFromIDB(store, id) {
  return new Promise((resolve) => {
    const req = indexedDB.open('hubooze-offline', 1);
    req.onsuccess = e => {
      const tx = e.target.result.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = resolve;
    };
    req.onerror = resolve;
  });
}

console.log('[SW] Service Worker loaded — Hubooze v1.0.0');
