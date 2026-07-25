import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CSS_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('popup scroll perf (gpuperf4k)', () => {
    it('keeps picker/droplist frost on the shell and scrolls only the scrollport', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const droplist = readSource('assets/css/lux-droplist.css');
        const picker = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const topbar = readSource('assets/js/features/luxury-shell-topbar-runtime.js');

        expect(controls).toMatch(/\.lux-picker-panel\s*\{[\s\S]*?overflow:\s*hidden/);
        expect(controls).toContain('.lux-picker-panel-scrollport');
        expect(controls).toContain('contain: layout paint');
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel\s*\{[\s\S]*?overflow:\s*hidden/
        );
        expect(droplist).toContain('--lux-droplist-glass-blur: blur(18px) saturate(155%)');
        expect(picker).toContain('lux-picker-panel-scrollport');
        expect(picker).toContain('lux-picker-options lux-picker-panel-scrollport');
        expect(topbar).toContain('lux-picker-panel-scrollport');
    });

    it('opens pickers with a single forced reflow and holds transparency suppress through bloom', () => {
        const picker = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        const openBody = picker.slice(
            picker.indexOf('function openPickerPanel'),
            picker.indexOf('function dismissOpenLuxPickerPanels')
        );
        expect(openBody.match(/forcePickerReflow\(panel\)/g) || []).toHaveLength(0);
        expect(openBody).toContain('fastPlace: true');
        expect(openBody).toContain("panel.classList.add('is-open')");
        expect(openBody.indexOf("panel.classList.add('is-open')"))
            .toBeLessThan(openBody.indexOf('requestAnimationFrame'));
        expect(picker).toContain('function releasePickerTransparencySuppress(panel)');
        expect(openBody).toContain('releasePickerTransparencySuppress(panel)');
        expect(openBody).not.toMatch(/window\.__kiuSuppressLuxTransparencyRefresh = false;\s*\}\s*;\s*if \(typeof window\.requestAnimationFrame/);
        expect(transparency).toContain('if (window.__kiuSuppressLuxTransparencyRefresh) return;');
        expect(transparency).toContain('flushLuxuryTransparencyAfterScroll');
        expect(transparency).toContain('window.__luxIsScrolling && options?.force !== true');
        expect(picker).toContain('pickerScrollTargetCache');
        expect(picker).toContain('clearPickerScrollTargetCache');
    });

    it('unstasks overlay+panel blur and drops permanent modal will-change', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const studio = readSource('assets/css/lux-studio.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(modals).not.toContain('will-change: transform, opacity');
        expect(modals).toMatch(/\.modal-content\s*\{[\s\S]*?overflow:\s*hidden/);
        expect(modals).toContain('.modal-content > .modal-body');
        expect(modals).toMatch(
            /\[data-lux-modal-overlay\]\.active:not\(\[aria-hidden='true'\]\)[\s\S]*?backdrop-filter:\s*none/
        );
        expect(studio).toContain('/* Panel carries frost; backdrop is dim-only (no stacked live blur). */');
        expect(studio).toMatch(
            /#lux-studio-backdrop[\s\S]*?backdrop-filter:\s*none;/
        );
        expect(fouc).toMatch(/\.lux-utility-panel\s*\{[\s\S]*?backdrop-filter:\s*var\(--lux-panel-blur-filter\)/);
        expect(fouc).toMatch(/\.lux-utility-panel\.is-closing:not\(\.is-open\)[\s\S]*?backdrop-filter:\s*none/);
    });

    it('pins droplist CSS cache bust in shell chrome loader', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(shellChrome).toContain(`lux-droplist.css?v=${LUX_DROPLIST_CSS_CACHE_BUST}`);
    });
});
