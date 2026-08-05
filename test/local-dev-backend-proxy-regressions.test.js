import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const localServerPolicy = require('../tools/local_dev_server.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('local dev backend proxy regressions', () => {
    it('routes loopback frontend traffic through the same-origin local server proxy', () => {
        const api = readSource('assets/js/app/api.js');
        const login = readSource('assets/js/pages/login-runtime.js');
        const examPortal = readSource('assets/js/pages/exam-portal.js');
        const server = readSource('tools/local_dev_server.js');

        expect(api).toContain('return window.location.origin;');
        expect(login).toContain('return window.location.origin;');
        expect(examPortal).toContain("if (/^(127\\.0\\.0\\.1|localhost)$/i.test(host)) {");
        expect(examPortal).toContain("window.location?.port ? `:${window.location.port}` : ''");
        expect(server).toContain("return requestPath.startsWith('/api/')");
        expect(server).toContain("|| requestPath === '/health'");
        expect(server).toContain("|| requestPath === '/ready'");
        expect(server).toContain("|| requestPath === '/download'");
        expect(server).toContain("error: 'The portal backend is offline right now.'");
    });

    it('blocks sensitive repository paths from public static delivery', () => {
        const blockedPaths = [
            '/backend/platform/.local-platform-state.json',
            '/.env',
            '/.env.production',
            '/.git/config',
            '/tools/local_dev_server.js',
            '/test/local-dev-backend-proxy-regressions.test.js',
            '/kiu-realtime-bridge/uploads/private.pdf',
            '/anti-cheat/src/config.json'
        ];

        blockedPaths.forEach((pathname) => {
            expect(localServerPolicy.isBlockedStaticPath(pathname)).toBe(true);
        });
        expect(localServerPolicy.isBlockedStaticPath('/social.html')).toBe(false);
        expect(localServerPolicy.resolveFilePath('/../.env')).toBe(null);
    });

    it('compresses text assets and caches versioned files', () => {
        const brotliRequest = { headers: { 'accept-encoding': 'br,gzip' } };
        const gzipRequest = { headers: { 'accept-encoding': 'gzip' } };

        expect(localServerPolicy.getStaticCompression(brotliRequest, 'text/css; charset=utf-8', 2048)).toBe('br');
        expect(localServerPolicy.getStaticCompression(gzipRequest, 'application/javascript; charset=utf-8', 2048)).toBe('gzip');
        expect(localServerPolicy.getStaticCompression(brotliRequest, 'image/png', 2048)).toBe('');
        expect(localServerPolicy.isVersionedAsset('/assets/app.js?v=20260805', '/assets/app.js')).toBe(true);
        expect(localServerPolicy.isVersionedAsset('/assets/app.js', '/assets/app.js')).toBe(false);
    });

    it('keeps the public preview localhost-only and preserves its HTTPS origin', () => {
        const launcher = readSource('start-local-preview.sh');
        const stack = readSource('start-local-lms-anticheat.sh');

        expect(launcher).toContain('export KIU_LOCAL_LAN_MODE=0');
        expect(launcher).toContain('export KIU_LOCAL_BIND_HOST=127.0.0.1');
        expect(launcher).toContain('export KIU_PUBLIC_APP_URL="https://${PREVIEW_HOSTNAME}"');
        expect(launcher).toContain('export KIU_SKIP_ANTICHEAT="${KIU_SKIP_ANTICHEAT:-0}"');
        expect(launcher).toContain('exec bash "$ROOT/start-local-lms-anticheat.sh"');
        expect(stack).toContain('PUBLIC_APP_URL="${KIU_PUBLIC_APP_URL:-http://${PUBLIC_HOST}:${FRONTEND_PORT}}"');
        expect(stack).toContain('export KIU_PUBLIC_APP_URL="$PUBLIC_APP_URL"');
    });
});
