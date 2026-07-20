import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('lux picker scroll regressions', () => {
    it('ships global picker panel scroll tokens and styles in lux-controls', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('--lux-picker-visible-options');
        expect(controls).toContain('--lux-picker-option-height');
        expect(controls).toContain('--lux-picker-panel-max-height');
        expect(controls).toContain('max-height: var(--lux-picker-panel-max-height)');
        expect(controls).toContain('overflow-y: auto');
        expect(controls).toContain('overscroll-behavior: contain');
        expect(controls).toContain('.lux-picker-panel::-webkit-scrollbar-thumb');
    });

    it('tags enhanced and shell picker panels with scroll class', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).toContain('lux-picker-panel lux-picker-panel-scroll');
        expect(shellChrome).toContain('lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll');
        expect(shellChrome).toContain('function isPickerScrollExempt(panel, scrollTarget)');
        expect(shellChrome).toContain('function isLuxPickerInteractionTarget(target, panel)');
        expect(shellChrome).toContain('function collectPickerScrollTargets(button)');
        expect(shellChrome).toContain('function bindLuxPickerDismissHandlers()');
        expect(shellChrome).toContain('function dismissOpenLuxPickerPanels()');
        expect(shellChrome).toContain("window.addEventListener('resize', dismissOpenLuxPickerPanels");
        expect(shellChrome).toContain("window.addEventListener('orientationchange', dismissOpenLuxPickerPanels");
        expect(shellChrome).toContain('[data-lux-picker-scroll-exempt]');
        expect(shellChrome).not.toContain('PICKER_SCROLL_EXEMPT_SELECTORS');
        expect(shellChrome).toContain('if (isPickerScrollExempt(panel, event.target)) return;');
        expect(shellChrome).toContain('panel._luxPickerScrollTargets = scrollTargets');
        expect(shellChrome).toContain('panel._luxPickerWheelDismissHandler = wheelDismissHandler');
        expect(shellChrome).toContain('closePickerPanels({ immediate: true })');
        expect(shellChrome).toContain("document.addEventListener('pointerdown'");
        expect(shellChrome).toContain('panel._luxPickerWheelHandler = wheelHandler');
        expect(shellChrome).toContain('event.stopPropagation()');
    });

    it('wires lux-controls and shell chrome cache bust on representative routes', () => {
        const index = readSource('index.html');
        const registration = readSource('registration.html');
        const scheduler = readSource('admin-scheduler.html');

        expect(index).toContain(`assets/css/lux-controls.css?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(index).toContain(`assets/js/features/luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(registration).toContain(`assets/css/lux-controls.css?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(registration).toContain(`assets/js/features/luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(scheduler).toContain(`assets/css/lux-controls.css?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(scheduler).toContain(`assets/js/features/luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(scheduler).toContain(`assets/css/admin-scheduler-route.css?v=${LUX_DROPLIST_CACHE_BUST}`);
    });

    it('routes library catalog filters through the universal picker contract', () => {
        const libraryCatalogView = readSource('assets/js/shared/library-catalog-view.js');
        const adminLibrary = readSource('admin-library.html');
        const libraryHtml = readSource('library.html');

        expect(libraryCatalogView).toContain('function syncCatalogFilterPickers(root)');
        expect(libraryCatalogView).toContain('enhanceUniversalPicker');
        expect(libraryCatalogView).not.toContain('function renderPickerPanel');
        expect(adminLibrary).toContain('data-lux-picker-label="Topic"');
        expect(libraryHtml).toContain('data-lux-picker-label="Topic"');
    });
});