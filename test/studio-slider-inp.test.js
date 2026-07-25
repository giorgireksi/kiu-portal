import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CACHE_BUST, LUX_ATMOSPHERE_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('studio glow + opacity slider INP (gpuperf4p)', () => {
    it('applies glow live preview while dragging and commits on change', () => {
        const atmosphere = readSource('assets/js/features/luxury-atmosphere-runtime.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(atmosphere).toContain('function setGlowStrength(level, persist = true, options = {})');
        expect(atmosphere).toContain('if (options?.live)');
        expect(atmosphere).toContain('window.__luxLiveGlowStrength = nextPercent');
        expect(atmosphere).toContain("setDashboardVisuals({ glowStrength: nextPercent }, false)");
        expect(atmosphere).toContain('document.body.dataset.luxGlowStrength');
        expect(atmosphere).toContain('applyAtmosphereSettings()');
        expect(atmosphere).toContain('if (window.__luxLiveGlowStrength != null)');

        const setGlowBody = atmosphere.slice(
            atmosphere.indexOf('function setGlowStrength'),
            atmosphere.indexOf('const DEFAULT_STUDIO_MIXER')
        );
        expect(setGlowBody).not.toContain('syncStudioUi()');

        expect(shellChrome).toContain('pendingGlowLive');
        expect(shellChrome).toContain('requestAnimationFrame(flushGlowLive)');
        expect(shellChrome).toContain("window.setGlowStrength(parseInt(value, 10), false, { live: true })");
        expect(shellChrome).toContain("glowStrengthSlider.addEventListener('change'");
        expect(shellChrome).toContain('window.setGlowStrength(value, true)');
    });

    it('uses a live token-only transparency path while dragging', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(transparency).toContain('function applyLiveTransparencyTokens');
        expect(transparency).toContain('const live = options?.live === true');
        expect(shellChrome).toContain('pendingTransparencyLive');
        expect(shellChrome).toContain("updateTransparency(parseInt(value, 10), { persist: false, live: true })");
        expect(shellChrome).toContain("updateTransparency(parseInt(value, 10), { persist: true })");
    });

    it('pins cache bust for chrome/atmosphere', () => {
        const index = readSource('index.html');
        expect(index).toContain(`luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(index).toContain(`luxury-atmosphere-runtime.js?v=${LUX_ATMOSPHERE_CACHE_BUST}`);
        expect(LUX_DROPLIST_CACHE_BUST).toBe('20260723-utility-bloom1');
        expect(LUX_ATMOSPHERE_CACHE_BUST).toBe('20260723-gpuperf4p');
    });
});
