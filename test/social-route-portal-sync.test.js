import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social route portal sync guardrails', () => {
    it('skips portal state sync on standalone social.html', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain('function isStandaloneSocialRoute(pathname = window.location.pathname)');
        expect(api).toMatch(/function queuePortalStateSync[\s\S]*?if \(isStandaloneSocialRoute\(\)\) return;/);
        expect(api).toMatch(/async function persistPortalStateToBackend[\s\S]*?if \(isStandaloneSocialRoute\(\)\) return null;/);
        expect(api).toMatch(/function sendPortalStateKeepalive\(\) \{[\s\S]*?if \(isStandaloneSocialRoute\(\)\) return;/);
        expect(api).toMatch(/function flushPortalStateSync\(\) \{[\s\S]*?if \(isStandaloneSocialRoute\(\)\) return null;/);
    });

    it('keeps socialHub out of portal backend persist payload', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain('delete snapshot.socialHub;');
    });

    it('uses a longer timeout for portal state persistence', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain("kiuPortalFetch('/api/portal/state', {");
        expect(api).toContain('timeoutMs: 15000');
    });

    it('uses a longer timeout for portal bootstrap hydration', () => {
        const api = readSource('assets/js/app/api.js');

        expect(api).toContain("kiuPortalFetch('/api/bootstrap', { timeoutMs: 15000 })");
    });

    it('keeps portal state save lightweight on the backend', () => {
        const store = readSource('backend/platform/store.js');
        const routes = readSource('backend/platform/routes/portal-support-routes.js');

        expect(store).toContain('createPortalStateSaveSnapshot()');
        expect(store).not.toMatch(/savePortalState[\s\S]*?return this\.createPortalBootstrap\(\);/);
        expect(store).toMatch(/savePortalState[\s\S]*?this\.savePortal\(\);/);
        expect(store).not.toMatch(/savePortalState[\s\S]*?this\.save\(\);[\s\S]*?return this\.createPortalStateSaveSnapshot/);
        expect(routes).toContain('skipPersist: true');
        expect(routes).toContain('bootstrapStateKeys');
        expect(routes).toContain('await store.flushPendingWrites();');
    });
});