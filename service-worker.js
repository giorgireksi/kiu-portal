const CACHE_NAME = 'kiu-portal-shell-v20260514-studentsadmin-clean2';
const CACHE_PREFIX = 'kiu-portal-shell-';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/social.html',
  '/news.html',
  '/exams.html',
  '/login.html',
  '/assets/css/base.css?v=20260514-studentsadmin-clean2',
  '/assets/css/layout.css?v=1776604822083',
  '/assets/css/components.css?v=1776604822083',
  '/assets/css/index-luxury.css?v=20260514-studentsadmin-clean2',
  '/assets/css/students-admin-lms.css?v=20260514-studentsadmin-clean2',
  '/assets/css/mobile-responsive.css?v=20260419-libsync1'
];

async function deleteLegacyPortalCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key))
  );
}

function buildOfflineApiResponse(request) {
  const acceptsJson = String(request.headers.get('accept') || '').toLowerCase().includes('application/json');
  const payload = {
    ok: false,
    error: acceptsJson ? 'The portal API is offline right now.' : 'Offline',
    code: 'offline'
  };
  return new Response(JSON.stringify(payload), {
    status: 503,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    }
  });
}

function shouldCacheResponse(response) {
  return Boolean(response && response.ok && (response.type === 'basic' || response.type === 'default'));
}

async function cacheResponse(request, response) {
  if (!shouldCacheResponse(response)) return response;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' || request.destination === 'document';
}

function isStaticAssetRequest(url, request) {
  if (url.pathname.startsWith('/assets/')) return true;
  return ['script', 'style', 'font', 'image'].includes(request.destination);
}

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return await cacheResponse(request, networkResponse);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/index.html');
  }
}

async function handleStaticAssetRequest(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => cacheResponse(request, response))
    .catch(() => null);

  if (cached) {
    event.waitUntil(networkPromise);
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;
  return caches.match(request);
}

self.addEventListener('install', event => {
  event.waitUntil(
    deleteLegacyPortalCaches()
      .then(() => caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_ASSETS)))
      .catch(() => Promise.resolve())
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    deleteLegacyPortalCaches().catch(() => null)
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => buildOfflineApiResponse(request))
    );
    return;
  }
  if (isNavigationRequest(request)) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  if (isStaticAssetRequest(url, request)) {
    event.respondWith(handleStaticAssetRequest(request, event));
    return;
  }
  event.respondWith(
    fetch(request)
      .then((networkResponse) => cacheResponse(request, networkResponse))
      .catch(() => caches.match(request))
  );
});

self.addEventListener('message', (event) => {
  if (!event?.data || event.data.type !== 'PURGE_PORTAL_CACHES') return;
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).catch(() => null)
  );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const targetUrl = event.notification?.data?.url || '/index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(client => 'focus' in client);
      if (existing) {
        existing.focus();
        if ('navigate' in existing) {
          return existing.navigate(targetUrl);
        }
        return existing;
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return null;
    })
  );
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (error) {
    payload = {
      title: 'KIU update',
      body: event.data ? event.data.text() : ''
    };
  }
  const title = String(payload.title || 'KIU update');
  const options = {
    body: String(payload.body || ''),
    tag: String(payload.tag || 'kiu-update'),
    icon: String(payload.icon || 'favicon.ico'),
    data: {
      url: String(payload.url || '/index.html')
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
