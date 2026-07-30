import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('realtime bootstrap route gating', () => {
    it('keeps eager realtime bootstrap off general local shell routes and reloads it on utility open', () => {
        const auth = readSource('assets/js/app/auth.js');
        const api = readSource('assets/js/app/api.js');
        const shellPicker = readSource('assets/js/features/luxury-shell-picker-runtime.js');

        expect(auth).toContain('function shouldEagerBootstrapKiuRealtime() {');
        expect(auth).toContain("if (routeName === 'social.html') return true;");
        expect(auth).toContain("if (routeName === 'student-service.html') return true;");
        expect(auth).toContain("return activeHash === 'social';");
        expect(api).toContain("typeof shouldEagerBootstrapKiuRealtime !== 'function' || shouldEagerBootstrapKiuRealtime()");
        expect(shellPicker).toContain("if (typeof bootstrapKiuRealtimeBridge === 'function') {");
        expect(shellPicker).toContain('bootstrapKiuRealtimeBridge(true).then(() => {');
    });

    it('does not open SSE from messenger state reads on non-eager routes', () => {
        const faculty = readSource('assets/js/shared/faculty.js');
        const ensureBlock = faculty.split('function ensurePortalMessengerState(')[1]?.split('\nfunction ')[0] || '';
        expect(ensureBlock).toContain('shouldEagerBootstrapKiuRealtime');
        expect(ensureBlock).toContain('hasActiveStream');
        expect(ensureBlock).toContain('if (shouldEager || hasActiveStream)');
        expect(ensureBlock).toContain('scheduleKiuRealtimeBootstrap()');
    });

    it('shares 429 SSE backoff across tabs via sessionStorage', () => {
        const auth = readSource('assets/js/app/auth.js');
        expect(auth).toContain("KIU_SSE_BLOCKED_UNTIL_KEY = 'KIU_SSE_BLOCKED_UNTIL'");
        expect(auth).toContain('function readSharedKiuSseBlockedUntil(');
        expect(auth).toContain('function writeSharedKiuSseBlockedUntil(');
        expect(auth).toContain('writeSharedKiuSseBlockedUntil(runtime.sseBlockedUntil)');
        const blockedBlock = auth.split('function isKiuRealtimeSseBlocked(')[1]?.split('\nfunction ')[0] || '';
        expect(blockedBlock).toContain('readSharedKiuSseBlockedUntil()');
    });
});
