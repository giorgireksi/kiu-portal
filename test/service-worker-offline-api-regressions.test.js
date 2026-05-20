import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('service worker offline API regressions', () => {
    it('returns an explicit offline API response instead of cached shell HTML for /api/ failures', () => {
        const source = readSource('service-worker.js');

        expect(source).toContain('function buildOfflineApiResponse(request) {');
        expect(source).toContain('return new Response(JSON.stringify(payload), {');
        expect(source).toContain("code: 'offline'");
        expect(source).toContain("fetch(request).catch(() => buildOfflineApiResponse(request))");
        expect(source).not.toContain("fetch(request).catch(() => caches.match('/index.html'))");
    });
});
