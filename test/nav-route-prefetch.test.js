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
});
