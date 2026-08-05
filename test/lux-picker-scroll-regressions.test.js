import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CACHE_BUST, LUX_CONTROLS_CSS_CACHE_BUST, LUX_PICKER_RUNTIME_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

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
        expect(controls).toContain('--lux-droplist-visible-options: 5');
        expect(controls).toMatch(/--lux-picker-visible-options[\s\S]*?max-height:\s*calc\(/);
        expect(controls).toMatch(/--lux-droplist-panel-max-height:\s*calc\([\s\S]*?shell-pad\)\s*\*\s*2/);
        // Glass shell clips; options scroll in scrollport (blur ≠ scroll node).
        expect(controls).toContain('.lux-picker-panel-scrollport');
        expect(controls).toMatch(/\.lux-picker-panel\s*\{[\s\S]*?overflow:\s*hidden/);
        expect(controls).toMatch(/\.lux-picker-panel-scrollport[\s\S]*?overflow-y:\s*auto/);
        expect(controls).toContain('overscroll-behavior: contain');
        expect(controls).toContain('contain: layout paint');
        expect(controls).toContain('.lux-picker-panel-scrollport::-webkit-scrollbar-thumb');
        expect(controls).toContain('var(--lux-scrollbar-thumb-hover');
        expect(controls).toContain('scrollbar-color: var(--lux-scrollbar-thumb');
    });

    it('caps droplist panel at 5 options then scrolls the scrollport', () => {
        const droplist = readSource('assets/css/lux-droplist.css');
        expect(droplist).toContain('--lux-droplist-visible-options: 5');
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel\s*\{[\s\S]*?max-height:\s*var\(--lux-droplist-panel-max-height\)/
        );
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel :is\([\s\S]*?\.lux-picker-panel-scrollport[\s\S]*?max-height:\s*calc\([\s\S]*?--lux-droplist-visible-options/
        );
    });

    it('themes droplist scrollport thumb with accent tokens (not panel hardcoded bars)', () => {
        const droplist = readSource('assets/css/lux-droplist.css');
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel :is\([\s\S]*?\.lux-picker-panel-scrollport[\s\S]*?::-webkit-scrollbar-thumb/
        );
        expect(droplist).toContain('var(--lux-scrollbar-thumb)');
        expect(droplist).toContain('var(--lux-scrollbar-thumb-hover)');
        expect(droplist).toContain('scrollbar-width: thin');
        expect(droplist).not.toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel::-webkit-scrollbar-thumb\s*\{[\s\S]*?rgba\(255,\s*255,\s*255,\s*0\.14\)/
        );
    });

    it('tags enhanced and shell picker panels with scroll class', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-picker-runtime.js');

        expect(shellChrome).toContain('lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll lux-droplist-panel');
        expect(shellChrome).toContain('lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll');
        expect(shellChrome).toContain('function isPickerScrollExempt(panel, scrollTarget)');
        expect(shellChrome).toContain('function isLuxPickerInteractionTarget(target, panel)');
        expect(shellChrome).toContain('function collectPickerScrollTargets(button)');
        expect(shellChrome).toContain('function bindLuxPickerDismissHandlers()');
        expect(shellChrome).toContain('function dismissOpenLuxPickerPanels()');
        expect(shellChrome).toContain("window.addEventListener('resize', onViewportChange");
        expect(shellChrome).toContain("window.addEventListener('orientationchange', onViewportChange");
        expect(shellChrome).toContain('dismissOpenLuxPickerPanels()');
        expect(shellChrome).toContain('[data-lux-picker-scroll-exempt]');
        expect(shellChrome).not.toContain('PICKER_SCROLL_EXEMPT_SELECTORS');
        expect(shellChrome).toContain('if (isPickerScrollExempt(panel, event.target)) return;');
        expect(shellChrome).toContain('panel._luxPickerScrollTargets = scrollTargets');
        expect(shellChrome).toContain('panel._luxPickerWheelDismissHandler = wheelDismissHandler');
        expect(shellChrome).toContain('closePickerPanels({ immediate: true })');
        expect(shellChrome).toContain("document.addEventListener('pointerdown'");
        expect(shellChrome).toContain('panel._luxPickerWheelHandler = wheelHandler');
        expect(shellChrome).toContain('event.stopPropagation()');
        expect(shellChrome).toContain('function capLuxFloatingPanelMaxHeight');
        expect(shellChrome).toContain('function resolveLuxPickerPanelHeightCap');
    });

    it('wires lux-controls and shell chrome cache bust on representative routes', () => {
        const index = readSource('index.html');
        const registration = readSource('registration.html');
        const scheduler = readSource('admin-scheduler.html');

        expect(index).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(index).toContain(`assets/js/features/luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(registration).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(registration).toContain(`assets/js/features/luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        expect(scheduler).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(scheduler).toContain(`assets/js/features/luxury-shell-chrome.js?v=${LUX_DROPLIST_CACHE_BUST}`);
        // picker-runtime carries its own bust (closePickerPanels suppress-leak fix) and
        // moves independently of the shared chrome/droplist bundle.
        expect(scheduler).toContain(`assets/js/features/luxury-shell-picker-runtime.js?v=${LUX_PICKER_RUNTIME_CACHE_BUST}`);
    });

    it('routes library catalog filters through the universal picker contract', () => {
        const libraryCatalogView = readSource('assets/js/shared/library-catalog-view.js');
        const adminLibrary = readSource('admin-library.html');
        const libraryHtml = readSource('library.html');

        expect(libraryCatalogView).toContain('function syncCatalogFilterPickers(root)');
        expect(libraryCatalogView).toContain('enhanceUniversalPicker');
        expect(libraryCatalogView).not.toContain('function renderPickerPanel');
        expect(adminLibrary).toContain('lux-picker-label">Subject (Topic)');
        expect(libraryHtml).toContain('lux-picker-label">Search');
    });
});