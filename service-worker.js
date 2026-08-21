const CACHE_NAME = 'kiu-portal-shell-v20260823-groupactivity4';
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
  '/assets/js/shared/input-autocomplete-guard.js?v=20260627-autocomplete-guard1',
  '/assets/js/pages/login-runtime.js?v=20260823-groupactivity4',
  '/assets/css/lux-tokens.css?v=20260725-frosted1',
  '/assets/css/lux-fouc-ht.css?v=20260820-globalpaint2',
  '/assets/css/lux-controls.css?v=20260726-luxtab2',
  '/assets/css/mobile-shell-core.css?v=20260819-sidebarperf2',
  '/assets/css/shared-lux-core.css?v=20260823-groupactivity2&customscroll32',
  '/assets/css/lux-modals.css?v=20260821-toolbarfooter2',
  '/assets/css/mobile-shell.css?v=20260724-chromeshare1',
  '/assets/css/lux-shell.css?v=20260818-isolatedglass1',
  '/assets/css/lux-layout-primitives.css?v=20260725-ssot1',
  '/assets/css/index-home-layout.css?v=20260806-studentboard11',
  '/assets/css/index-home-widgets.css?v=20260819-fastboot1',
  '/assets/css/index-home-role.css?v=20260725-homefoucdedup1',
  '/assets/js/theme-primer.js?v=20260823-globaltheme1',
  '/assets/js/app/portal-runtime-globals.js?v=20260818-runtimeglobals1',
  '/assets/js/app/api-lms-portal-runtime.js?v=20260823-multipartgallery1',
  '/assets/js/app/api.js?v=20260823-globaltheme1',
  '/assets/js/app/social-standalone-bootstrap.js?v=20260823-groupactivity4',
  '/assets/js/shared/lux-custom-scrollbar.js?v=20260822-customscroll32',
  '/assets/js/features/navigation.js?v=20260819-fastboot1',
  '/assets/js/shared/news-home.js?v=20260809-homeassembly2',
  '/assets/js/features/luxury-index-runtime.js?v=20260819-routeobservation1',
  '/assets/js/features/luxury-visual-runtime.js?v=20260819-routeobservation1',
  '/assets/js/features/luxury-index-home-shell-runtime.js?v=20260720-w18',
  '/assets/js/features/luxury-shell-motion-runtime.js?v=20260820-shellinput1',
  '/assets/js/features/luxury-shell-chrome.js?v=20260819-sidebarperf3',
  '/assets/css/lux-hover-guard.css?v=20260819-hover1',
  '/assets/js/features/index-luxury.js?v=20260823-themeopacity1',
  '/assets/js/features/luxury-home-model.js?v=20260809-homeassembly3',
  '/assets/js/features/home-dashboard-widget-layout-runtime.js?v=20260809-homeassembly3',
  '/assets/js/features/home-dashboard-widget-data-runtime.js?v=20260806-studentboard11',
  '/assets/js/features/index-home-dashboard.js?v=20260823-globaltheme1',
  '/assets/js/features/index-home-dashboard.plain.js?v=20260823-globaltheme1',
  '/assets/js/pages/index-mobile-shell.js?v=20260809-homeassembly1',
  '/assets/js/pages/social-page-shell-runtime.js?v=20260822-customscroll32',
  '/assets/js/pages/social-page-interactions-runtime.js?v=20260823-groupchats1&perf=20260816-singleowner9',
  '/assets/js/pages/social-page-boot-runtime.js?v=20260822-customscroll32',
  '/assets/js/pages/social-page-events.js?v=20260823-groupactivity2',
  '/assets/js/pages/social-fingerprint-model.js?v=20260823-groupchats1',
  '/assets/js/pages/social-page.js?v=20260823-groupactivity4',
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

async function handleApiRequest(request) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(request.clone());
      if (response?.ok || attempt === 1 || (response?.status || 0) < 500) return response;
    } catch (error) {
      if (attempt === 1) return buildOfflineApiResponse(request);
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return buildOfflineApiResponse(request);
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
    const buildNavigationRequest = (cacheMode) => new Request(request, {
      cache: cacheMode
    });
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
  // Query-bearing Social URLs must always be able to reuse the precached
  // document shell when the tunnel briefly returns a 5xx.
  if (isSocialStandaloneNavigation) {
    const cachedSocialShell = await caches.match('/social.html', { ignoreSearch: true });
    if (cachedSocialShell) return cachedSocialShell;
  }
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

  // A brief Caddy/container restart must not surface as an offline CSS/JS
  // response. Retry one transient 5xx/network failure before using the cache
  // or the explicit offline response.
  let networkResponse = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      networkResponse = await fetch(request.clone());
      if (networkResponse?.ok || attempt === 1 || (networkResponse?.status || 0) < 500) break;
    } catch (error) {
      if (attempt === 1) break;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  if (await isUsableStaticAssetResponse(networkResponse, request)) {
    event.waitUntil(cacheResponse(request, networkResponse.clone()).catch(() => {}));
    return networkResponse;
  }
  const cached = await cache.match(request);
  if (cached && await isUsableStaticAssetResponse(cached, request)) return cached;
  // If a versioned request is unavailable during deployment, reuse a valid
  // cached copy of the same asset from an earlier query version before
  // returning a synthetic 503. The next successful fetch still replaces it.
  const cachedPreviousVersion = await cache.match(request, { ignoreSearch: true });
  if (cachedPreviousVersion && await isUsableStaticAssetResponse(cachedPreviousVersion, request)) {
    return cachedPreviousVersion;
  }
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
    // Never let an API fetch rejection escape respondWith: Firefox reports that
    // as an unexpected ServiceWorker error and the page receives no response.
    event.respondWith(
      handleApiRequest(request).catch(() => buildOfflineApiResponse(request))
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
