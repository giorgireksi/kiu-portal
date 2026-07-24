import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('glow density slider INP (gpuperf4p)', () => {
    it('uses a live preview path while dragging and commits on change', () => {
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(atmosphere).toContain('function setGlowStrength(level, persist = true, options = {})');
        expect(atmosphere).toContain('window.__luxLiveGlowStrength = nextPercent');
        expect(atmosphere).toContain('applyAtmosphereSettings()');
        expect(shellChrome).toContain("window.setGlowStrength(parseInt(value, 10), false, { live: true })");
        expect(shellChrome).toContain('requestAnimationFrame(flushGlowLive)');
        expect(shellChrome).toContain('window.setGlowStrength(value, true)');
    });
});
