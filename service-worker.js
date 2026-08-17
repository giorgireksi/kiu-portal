const CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2';
const CACHE_PREFIX = 'kiu-portal-shell-';
const ROUTE_PREFETCH_CACHE_NAME = 'kiu-portal-route-prefetch-v1';
const ROUTE_PREFETCH_HEADER = 'X-KIU-Route-Prefetch';

function normalizeNotificationTarget(value) {
  try {
    const target = new URL(String(value || '/index.html'), self.location.origin);
    if (target.origin !== self.location.origin) return '/index.html';
    return `${target.pathname}${target.search}${target.hash}` || '/index.html';
  } catch (error) {
    return '/index.html';
  }
}
// HTML shell only + home CSS/JS used on first paint. Route-only giants (bare
// lite CSS) are NOT precached — they load on demand and stay cache-first once
// versioned.
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/social.html',
  '/news.html',
  '/exams.html',
  '/login.html',
  '/assets/css/lux-tokens.css?v=20260725-frosted1',
  '/assets/css/lux-fouc-ht.css?v=20260818-showhidefix1',
  '/assets/css/lux-controls.css?v=20260726-luxtab2',
  '/assets/css/mobile-shell-core.css?v=20260818-drawer-noblur1',
  '/assets/css/lux-modals.css?v=20260816-socialmodals1',
  '/assets/css/social-assembly-prehide.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-home-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-community-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-groups-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-projects-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-portfolio-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-research-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-pages-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-events-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-surveys-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-photography-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-lost-found-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-messages-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/social-alerts-loading.css?v=20260815-socialassemblyclean1',
  '/assets/css/mobile-shell.css?v=20260724-chromeshare1',
  '/assets/css/lux-shell.css?v=20260818-nonavglow1',
  '/assets/css/lux-layout-primitives.css?v=20260725-ssot1',
  '/assets/css/index-home-layout.css?v=20260806-studentboard11',
  '/assets/css/index-home-widgets.css?v=20260806-studentboard11',
  '/assets/css/index-home-role.css?v=20260725-homefoucdedup1',
  '/assets/css/index-home-loading.css?v=20260810-homeassembly5',
  '/assets/css/home-assembly-prehide.css?v=20260810-homeassembly5',
  '/assets/js/theme-primer.js?v=20260818-nonavglow1',
  '/assets/js/app/social-standalone-bootstrap.js?v=20260818-shellfailopen1',
  '/assets/js/features/navigation.js?v=20260818-startupwait1',
  '/assets/js/shared/news-home.js?v=20260809-homeassembly2',
  '/assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-assemblyfilter1',
  '/assets/js/features/luxury-index-runtime.js?v=20260818-visualqueue1',
  '/assets/js/features/luxury-visual-runtime.js?v=20260818-schedulerpaint1',
  '/assets/js/features/luxury-index-home-shell-runtime.js?v=20260720-w18',
  '/assets/js/features/luxury-shell-motion-runtime.js?v=20260818-showhidefix1',
  '/assets/js/features/index-luxury.js?v=20260818-nonavglow1',
  '/assets/js/features/luxury-home-model.js?v=20260809-homeassembly3',
  '/assets/js/features/home-dashboard-widget-layout-runtime.js?v=20260809-homeassembly3',
  '/assets/js/features/home-dashboard-widget-data-runtime.js?v=20260806-studentboard11',
  '/assets/js/features/index-home-dashboard.js?v=20260809-homeassembly2',
  '/assets/js/features/index-home-dashboard.plain.js?v=20260809-homeassembly2',
  '/assets/js/pages/home-loading-runtime.js?v=20260810-homeassembly9',
  '/assets/js/pages/index-mobile-shell.js?v=20260809-homeassembly1',
  '/assets/js/pages/social-page-shell-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-dedupe5',
  '/assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-assemblyfilter1',
  '/assets/js/pages/social-page-interactions-runtime.js?v=20260810-socialbootveil2&perf=20260816-singleowner9',
  '/assets/js/pages/social-page-boot-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-recovery2',
  '/assets/js/pages/social-page-events.js?v=20260815-socialassemblyclean1&perf=20260816-recovery1',
  '/assets/js/pages/social-fingerprint-model.js?v=20260816-socialrecovery1',
  '/assets/js/pages/social-page.js?v=20260818-shellfailopen1',
  '/assets/js/pages/social-home-loading-runtime.js?v=20260818-centerobserver1',
  '/assets/js/pages/social-community-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-groups-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-projects-loading-runtime.js?v=20260818-centerobserver1',
  '/assets/js/pages/social-portfolio-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner4',
  '/assets/js/pages/social-research-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-pages-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-events-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-surveys-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-photography-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-lost-found-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
  '/assets/js/pages/social-messages-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner4',
  '/assets/js/pages/social-alerts-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3',
];

function isVersionedAssetUrl(url) {
  return Boolean(url)
    && String(url.pathname || '').startsWith('/assets/')
    && /(?:^|[?&])v=[^&]+/.test(String(url.search || ''));
}

async function deleteLegacyPortalCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && ![CACHE_NAME, ROUTE_PREFETCH_CACHE_NAME].includes(key))
      .map((key) => caches.delete(key))
  );
}

function buildOfflineApiResponse(request) {
    const isApiRequest = String(request.url || '').includes('/api/');
    const payload = {
        ok: false,
        error: isApiRequest ? 'The portal API is offline right now.' : 'Offline',
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
      status: 503,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }
  if (destination === 'style') {
    return new Response('/* offline asset fallback */', {
      status: 503,
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

async function isUsableStaticAssetResponse(response, request) {
  if (!response || !response.ok) return false;
  const pathname = String(new URL(request.url).pathname || '').toLowerCase();
  const isScriptAsset = request.destination === 'script' || /\.(?:m?js)$/.test(pathname);
  const isStyleAsset = request.destination === 'style' || /\.css$/.test(pathname);
  const isCodeAsset = isScriptAsset || isStyleAsset;
  if (!isCodeAsset) return true;
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  if (isScriptAsset && contentType && !/(?:java|ecma)script/.test(contentType)) return false;
  if (isStyleAsset && contentType && !/css/.test(contentType)) return false;
  const body = await response.clone().text();
  if (!body.trim() || body.includes('offline asset fallback')) return false;
  if (isCodeAsset && /^\s*(?:<!doctype\s+html|<html[\s>])/i.test(body)) return false;
  return true;
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

function isRoutePrefetchRequest(request) {
  return String(request.headers.get(ROUTE_PREFETCH_HEADER) || '').trim() === '1';
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
    if (await isUsableStaticAssetResponse(networkResponse, request)) {
      event.waitUntil(cache.put(request, networkResponse.clone()));
      return networkResponse;
    }
  } catch (error) {}
  const cached = await cache.match(request);
  if (cached && await isUsableStaticAssetResponse(cached, request)) return cached;
  return buildOfflineAssetResponse(request);
}

async function handleNavigationRequest(request) {
  const pathname = new URL(request.url).pathname.toLowerCase();
  const isSocialStandaloneNavigation = pathname.endsWith('/social.html');
  const prefetchCache = await caches.open(ROUTE_PREFETCH_CACHE_NAME);
  if (!isSocialStandaloneNavigation) {
    const prefetched = await prefetchCache.match(request);
    if (prefetched) {
      await prefetchCache.delete(request);
      return prefetched;
    }
  }
  try {
    const buildNavigationRequest = (cacheMode) => isSocialStandaloneNavigation
      ? new Request(request, { cache: cacheMode })
      : request;
    let networkResponse = await fetch(buildNavigationRequest('no-store'));
    // A transient proxy/tunnel 5xx must not replace a working cached shell.
    // Retry once before falling back to the route shell.
    if (!networkResponse?.ok) {
      await new Promise(resolve => setTimeout(resolve, 150));
      networkResponse = await fetch(buildNavigationRequest('reload'));
    }
    if (networkResponse?.ok) return await cacheResponse(request, networkResponse);
  } catch (error) {
    // Fall through to the cached route shell.
  }
  const cached = await caches.match(request)
    || await caches.match(request, { ignoreSearch: true });
  if (cached) return cached;
  // A tunnel/proxy can fail only for the query-bearing navigation URL. Retry
  // the standalone Social shell without view parameters before returning the
  // offline 503 page, so panel/deep-view query strings cannot strand the UI.
  if (isSocialStandaloneNavigation) {
    try {
      const shellUrl = new URL('/social.html', request.url);
      const shellRequest = new Request(shellUrl, { cache: 'reload' });
      const shellResponse = await fetch(shellRequest);
      if (shellResponse?.ok) return await cacheResponse(shellRequest, shellResponse);
    } catch (error) {}
  }
  const shell = await caches.match('/index.html', { ignoreSearch: true });
  if (shell) return shell;
  return buildOfflineNavigationResponse();
}

async function handleRoutePrefetchRequest(request) {
  try {
    const networkResponse = await fetch(new Request(request, {
      headers: new Headers(request.headers)
    }));
    if (networkResponse?.ok) {
      const cache = await caches.open(ROUTE_PREFETCH_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return new Response('', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' }
    });
  }
}

async function handleStaticAssetRequest(request, event) {
  const url = new URL(request.url);
  const cache = await caches.open(CACHE_NAME);

  // Versioned assets are immutable (?v=). Serve them strictly cache-first;
  // changing the query string is the invalidation mechanism.
  if (isVersionedAssetUrl(url)) {
    const cachedVersioned = await cache.match(request);
    if (cachedVersioned) {
      if (await isUsableStaticAssetResponse(cachedVersioned, request)) {
        return cachedVersioned;
      }
    }
  }

  try {
    const networkResponse = await fetch(request);
    if (await isUsableStaticAssetResponse(networkResponse, request)) {
      event.waitUntil(cacheResponse(request, networkResponse.clone()).catch(() => {}));
      return networkResponse;
    }
  } catch (error) {}
  const cached = await cache.match(request);
  if (cached && await isUsableStaticAssetResponse(cached, request)) return cached;
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
  if (isRoutePrefetchRequest(request)) {
    event.respondWith(handleRoutePrefetchRequest(request));
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
    const targetUrl = normalizeNotificationTarget(event.notification?.data?.url);
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
      url: normalizeNotificationTarget(payload.url)
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
