import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('realtime bootstrap route gating', () => {
    it('keeps eager realtime bootstrap off general local shell routes and reloads it on utility open', () => {
        const auth = readSource('assets/js/app/auth.js');
        const api = readSource('assets/js/app/api.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(auth).toContain('function shouldEagerBootstrapKiuRealtime() {');
        expect(auth).toContain("if (routeName === 'social.html') return true;");
        expect(auth).toContain("return activeHash === 'social';");
        expect(api).toContain("typeof shouldEagerBootstrapKiuRealtime !== 'function' || shouldEagerBootstrapKiuRealtime()");
        expect(shellChrome).toContain("if (typeof bootstrapKiuRealtimeBridge === 'function') {");
        expect(shellChrome).toContain('bootstrapKiuRealtimeBridge(true).then(() => {');
    });
});
