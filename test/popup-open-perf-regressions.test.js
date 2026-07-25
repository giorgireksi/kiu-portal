import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CACHE_BUST, LUX_DROPLIST_CSS_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('popup open perf (gpuperf4l)', () => {
    it('warms droplist/studio CSS on idle before first open', () => {
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(chrome).toContain('function warmLuxuryPopupSurfaces()');
        expect(chrome).toContain('function scheduleLuxuryPopupSurfaceWarmup()');
        expect(chrome).toContain('requestIdleCallback');
        expect(chrome).toContain('scheduleLuxuryPopupSurfaceWarmup()');
        expect(chrome).toContain('ensureLuxDroplistCss()');
        expect(chrome).toContain('ensureStudioCss()');
        expect(chrome).toContain(`lux-droplist.css?v=${LUX_DROPLIST_CSS_CACHE_BUST}`);
        expect(chrome).toContain('lux-studio.css?v=20260725-frosted1');
    });

    it('reveals pickers before focus/listener work and preps will-change', () => {
        const picker = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const openBody = picker.slice(
            picker.indexOf('function openPickerPanel'),
            picker.indexOf('function dismissOpenLuxPickerPanels')
        );
        expect(openBody).toContain("panel.style.willChange = 'opacity, transform'");
        expect(openBody).toContain('resetLuxPickerPanelSearch(panel)');
        expect(openBody).toContain('panel.classList.add(\'is-open\')');
        expect(openBody).toContain('fastPlace: true');
        expect(openBody).toContain('polishAndFinishChrome');
        expect(openBody).toContain('polishLuxFloatingPanelClamp');
        expect(openBody.indexOf("panel.classList.add('is-open')"))
            .toBeLessThan(openBody.indexOf('requestAnimationFrame'));
        expect(openBody.indexOf("panel.classList.add('is-open')"))
            .toBeLessThan(openBody.indexOf('collectPickerScrollTargets'));
        expect(openBody.indexOf("panel.classList.add('is-open')"))
            .toBeLessThan(openBody.indexOf('focusFirstInteractive'));
        expect(picker).toContain('function polishLuxFloatingPanelClamp');
        expect(picker).toContain("panel.style.removeProperty('will-change')");
    });

    it('defers studio focus and gallery off the open frame', () => {
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const toggleBody = chrome.slice(
            chrome.indexOf('function toggleStudio()'),
            chrome.indexOf('function closeStudio')
        );
        expect(toggleBody).toContain('syncStudioUi()');
        expect(toggleBody).toContain('updateStudioPreview()');
        expect(toggleBody).toContain('finishOpen');
        expect(toggleBody.indexOf('syncStudioUi()'))
            .toBeLessThan(toggleBody.indexOf('focusFirstInteractive'));
        expect(toggleBody.indexOf("backdrop.classList.toggle('is-open')"))
            .toBeLessThan(toggleBody.indexOf('__kiuEnsureBackgroundGalleryScripts'));
    });
});
