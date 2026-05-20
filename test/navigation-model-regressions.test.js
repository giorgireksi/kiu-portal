import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('navigation model regressions', () => {
    it('keeps an explicit route-mode classifier for SPA sections, alias redirects, and standalone routes', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('const PORTAL_ROUTE_KIND = {');
        expect(navigation).toContain('const PORTAL_STANDALONE_ROUTE_IDS = new Set([');
        expect(navigation).toContain("'programs'");
        expect(navigation).toContain("'student-service'");
        expect(navigation).toContain("'news'");
        expect(navigation).toContain("'calendar': 'alias-redirect'");
        expect(navigation).toContain("'faculty-schedule': 'alias-redirect'");
        expect(navigation).toContain("'gradebook': 'alias-redirect'");
        expect(navigation).toContain("'exam-portal': 'special-page'");
        expect(navigation).toContain("'protected-launch': 'special-page'");
        expect(navigation).toContain('function getPortalRouteMode(pageId, options = {}) {');
        expect(navigation).toContain("if (PORTAL_STANDALONE_ROUTE_IDS.has(normalizedPageId)) return 'standalone';");
        expect(navigation).toContain("return 'spa-section';");
        expect(navigation).toContain("return 'standalone';");
        expect(navigation).toContain('window.getPortalRouteMode = getPortalRouteMode;');
    });

    it('primes lazy SPA sections before deferred runtimes finish loading', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('function primeShellSectionTransition(pageId, effectiveRole = getEffectiveUserRole()) {');
        expect(navigation).toContain('function primeDeferredShellRouteFromLocation(role = getEffectiveUserRole()) {');
        expect(navigation).toContain('syncShellNavVisibility(pageId, effectiveRole);');
        expect(navigation).toContain('syncShellNavActiveItem(pageId, effectiveRole);');
        expect(navigation).toContain('primeShellSectionTransition(pageId, effectiveRole);');
        expect(navigation).toContain('primeDeferredShellRouteFromLocation();');
        expect(navigation).toContain('runtimePromise.then(() => navigate(pageId, true));');
    });
});
