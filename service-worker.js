const CACHE_NAME = 'kiu-portal-shell-v20260721-nodebug1';
const CACHE_PREFIX = 'kiu-portal-shell-';
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/social.html',
  '/news.html',
  '/exams.html',
  '/login.html',
  '/assets/css/lux-tokens.css?v=20260722-hoverlift6',
'/assets/css/lux-fouc-ht.css?v=20260722-fogfix1',
  '/assets/css/mobile-shell-core.css?v=20260720-densify6500',
  '/assets/css/mobile-shell.css?v=20260720-densify6500',
  '/assets/css/lux-shell.css?v=20260721-topbarhost1',
'/assets/css/index-home-layout.css?v=20260720-gridfix1',
'/assets/css/index-home-widgets.css?v=20260722-hoverlift5',
'/assets/css/index-home-role.css?v=20260722-hoverlift6',
  '/assets/js/theme-primer.js?v=20260609-bootguard1',
  '/assets/js/features/navigation.js?v=20260609-bootguard1',
  '/assets/js/features/luxury-index-runtime.js?v=20260714-homeglass2',
  '/assets/js/features/index-luxury.js?v=20260714-homeglass2',
  '/assets/js/features/luxury-background.js?v=20260716-glassmax1'
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

function buildOfflineNavigationResponse() {
  return new Response(
    '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>KIU Offline</title></head><body><main><h1>Portal offline</h1><p>The portal shell could not be loaded right now.</p></main></body></html>',
    {
      status: 503,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }
  );
}

function buildOfflineAssetResponse(request) {
  const destination = String(request.destination || '').trim().toLowerCase();
  if (destination === 'script') {
    return new Response('/* offline asset fallback */', {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }
  if (destination === 'style') {
    return new Response('/* offline asset fallback */', {
      status: 200,
      headers: {
        'Content-Type': 'text/css; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }
  return new Response('', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
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

function isRegistrationRuntimeScriptRequest(url, request) {
  if (request.destination !== 'script') return false;
  const pathname = String(url.pathname || '').toLowerCase();
  return /\/assets\/js\/pages\/(student-registration|registration-enrollment|registration-shared|registration-student-route|registration)\.js$/.test(pathname);
}

async function handleRegistrationRuntimeScriptRequest(request, event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      event.waitUntil(cache.put(request, networkResponse.clone()));
      return networkResponse;
    }
  } catch (error) {}
  const cached = await cache.match(request);
  if (cached) return cached;
  return buildOfflineAssetResponse(request);
}

function isSocialRuntimeScriptRequest(url, request) {
  if (request.destination !== 'script') return false;
  const pathname = String(url.pathname || '').toLowerCase();
  return /\/assets\/js\/(?:pages\/social-page|shared\/social-runtime-lite)\.js$/.test(pathname);
}

async function handleSocialRuntimeScriptRequest(request, event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      event.waitUntil(cache.put(request, networkResponse.clone()));
      return networkResponse;
    }
  } catch (error) {}
  const cached = await cache.match(request);
  if (cached) return cached;
  return buildOfflineAssetResponse(request);
}

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return await cacheResponse(request, networkResponse);
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    const shell = await caches.match('/index.html');
    if (shell) return shell;
    return buildOfflineNavigationResponse();
  }
}

async function handleStaticAssetRequest(request, event) {
  // NETWORK-FIRST (was stale-while-revalidate, which served the OLD cached
  // asset first and only updated in the background — so code/CSS changes never
  // showed until a later reload, and behind a versioned URL could stay stale
  // indefinitely). Always fetch fresh when online; fall back to cache only when
  // the network is unavailable (offline). The dev server is no-store, so this
  // makes edits appear immediately without any manual cache clearing.
  const cache = await caches.open(CACHE_NAME);
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      event.waitUntil(cacheResponse(request, networkResponse.clone()).catch(() => {}));
      return networkResponse;
    }
  } catch (error) {}
  const cached = await cache.match(request);
  if (cached) return cached;
  return buildOfflineAssetResponse(request);
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
  if (isRegistrationRuntimeScriptRequest(url, request)) {
    event.respondWith(handleRegistrationRuntimeScriptRequest(request, event));
    return;
  }
  if (isSocialRuntimeScriptRequest(url, request)) {
    event.respondWith(handleSocialRuntimeScriptRequest(request, event));
    return;
  }
  if (isStaticAssetRequest(url, request)) {
    event.respondWith(handleStaticAssetRequest(request, event));
    return;
  }
  event.respondWith(
    fetch(request)
      .then((networkResponse) => cacheResponse(request, networkResponse))
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        return buildOfflineAssetResponse(request);
      })
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
