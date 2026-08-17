import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('service worker offline API regressions', () => {
    it('keeps versioned static assets on a cache-first path and omits bare-lite from install precache', () => {
        const source = readSource('service-worker.js');
        expect(source).toContain('function isVersionedAssetUrl(url)');
        expect(source).toContain('const cachedVersioned = await cache.match(request)');
        expect(source).toContain('if (cachedVersioned)');
        expect(source).not.toContain('refresh in');
        expect(source).not.toContain('fetch(request)\n          .then((networkResponse)');
        expect(source).not.toMatch(/SHELL_ASSETS[\s\S]*lux-page-bare-lite\.css/);
        expect(source).not.toContain("'/assets/css/lux-page-bare-lite.css");
        expect(source).not.toContain('"/assets/css/lux-page-bare-lite.css');
        expect(source).toMatch(/const CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage3'/);
        expect(source).toContain('isSocialStandaloneNavigation');
        expect(source).toContain("new Request(request, { cache: cacheMode })");
    });

    it('returns an explicit offline API response instead of cached shell HTML for /api/ failures', () => {
        const source = readSource('service-worker.js');

        expect(source).toContain('function buildOfflineApiResponse(request) {');
        expect(source).toContain('return new Response(JSON.stringify(payload), {');
        expect(source).toContain("code: 'offline'");
        expect(source).toContain("fetch(request).catch(() => buildOfflineApiResponse(request))");
        expect(source).not.toContain("fetch(request).catch(() => caches.match('/index.html'))");
    });

    it('always returns a concrete Response for failed navigation and asset requests', () => {
        const source = readSource('service-worker.js');

        expect(source).toContain('function buildOfflineNavigationResponse() {');
        expect(source).toContain('function buildOfflineAssetResponse(request) {');
        expect(source).toContain('return buildOfflineNavigationResponse();');
        expect(source).toContain('return buildOfflineAssetResponse(request);');
        expect(source).not.toContain('return caches.match(request);');
    });
});
