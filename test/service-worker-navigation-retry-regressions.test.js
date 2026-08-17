import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('service worker navigation retry regressions', () => {
    it('retries transient navigation failures and falls back to a cached route shell', () => {
        const worker = readSource('service-worker.js');
        const app = readSource('assets/js/app/app.js');

        expect(worker).toContain("if (!networkResponse?.ok)");
        expect(worker).toContain("buildNavigationRequest('reload')");
        expect(worker).toContain("caches.match(request, { ignoreSearch: true })");
        expect(worker).toContain("caches.match('/index.html', { ignoreSearch: true })");
        expect(worker).toContain("const shellUrl = new URL('/social.html', request.url)");
        expect(app).toContain("const PORTAL_SERVICE_WORKER_VERSION = '20260818-workspacefast1'");
        expect(app).toContain('service-worker.js?v=${PORTAL_SERVICE_WORKER_VERSION}');
    });
});
