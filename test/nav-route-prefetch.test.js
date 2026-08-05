import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('nav route prefetch', () => {
    it('prefetches portal routes on lux-nav hover', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).toContain('function prefetchPortalRoute(pageId) {');
        expect(shellChrome).toContain('window.resolvePortalRouteUrl(pageTarget(normalizedPageId), role)');
        expect(shellChrome).toContain("link.rel = 'prefetch';");
        expect(shellChrome).toContain("navRoot.addEventListener('mouseover', (event) => {");
        expect(shellChrome).toContain('prefetchPortalRoute(button.dataset.navTarget);');
    });

    it('warms same-origin standalone routes and preserves the service-worker handoff', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        const serviceWorker = readSource('service-worker.js');

        expect(navigation).toContain('function prefetchStandalonePortalRoute(pageId');
        expect(navigation).toContain("'X-KIU-Route-Prefetch': '1'");
        expect(navigation).toContain("document.addEventListener('pointerover', handleIntent");
        expect(navigation).toContain("document.addEventListener('focusin', handleIntent");
        expect(serviceWorker).toContain("const ROUTE_PREFETCH_CACHE_NAME = 'kiu-portal-route-prefetch-v1';");
        expect(serviceWorker).toContain('function isRoutePrefetchRequest(request) {');
        expect(serviceWorker).toContain('handleRoutePrefetchRequest(request)');
    });

    it('bounds speculative asset fan-out and prevents rescue navigation duplication', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        const app = readSource('assets/js/app/app.js');

        expect(navigation).toContain('const PORTAL_ROUTE_PREFETCH_ASSET_LIMIT = 12;');
        expect(navigation).toContain('.slice(0, PORTAL_ROUTE_PREFETCH_ASSET_LIMIT)');
        expect(navigation).toContain('window.__kiuNavigationIntentSequence = Number(window.__kiuNavigationIntentSequence || 0) + 1;');
        expect(app).toContain('const beforeNavigationIntent = Number(window.__kiuNavigationIntentSequence || 0);');
        expect(app).toContain('if (Number(window.__kiuNavigationIntentSequence || 0) !== beforeNavigationIntent) return;');
    });
});
