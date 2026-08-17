import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('caddy static asset routing regressions', () => {
    it('does not proxy the manifest or service worker through the backend matcher', () => {
        const caddy = readSource('infra/caddy/Caddyfile');

        expect(caddy).toContain('@api path /api/* /health /ready /download /download/*');
        expect(caddy).toContain('@static path /assets/* /images/* /favicon.ico /manifest.webmanifest /service-worker.js');
        expect(caddy).toContain('handle @static {');
        expect(caddy).toContain('@versionedAssets');
        expect(caddy).toContain('Cache-Control "public, max-age=31536000, immutable"');
        expect(caddy).not.toContain('@api path /api/* /health /ready /download /download/* /manifest.webmanifest /service-worker.js');
    });

    it('keeps the routed favicon asset present at the web root', () => {
        expect(existsSync(join(process.cwd(), 'favicon.ico'))).toBe(true);
    });
});
