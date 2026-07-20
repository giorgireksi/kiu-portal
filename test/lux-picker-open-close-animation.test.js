import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { LUX_DROPLIST_CONTRACT } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('lux picker open close animation', () => {
    it('defers panel teardown with is-closing and transitionend', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');

        expect(shellChrome).toContain('function finalizePickerPanelClose(panel)');
        expect(shellChrome).toContain('function animatePickerPanelClose(panel)');
        expect(shellChrome).toContain('panel.classList.remove(\'is-open\')');
        expect(shellChrome).toContain('panel.classList.add(\'is-closing\')');
        expect(shellChrome).toContain('function forcePickerReflow(panel)');
        expect(shellChrome).toContain("event.propertyName !== 'opacity'");
        expect(shellChrome).toContain('requestAnimationFrame(revealPanel);');
        expect(shellChrome).toContain('const LUX_PICKER_CLOSE_FALLBACK_MS = 220;');
        expect(shellChrome).toContain('openPanels.filter((openPanel) => openPanel.id !== panelId)');
        expect(shellChrome).toContain('Promise.all(otherPanels.map((openPanel) => animatePickerPanelClose(openPanel)))');
        expect(shellChrome).toContain('panel.classList.contains(\'is-closing\') && !panel.classList.contains(\'is-open\')');
        expect(shellChrome).toContain('if (shouldOpen && !hasOpenPanels)');
        expect(shellChrome).toContain("--lux-picker-anchor-transform");
        expect(shellChrome).not.toContain("panel.style.transform = 'translateY(-100%)'");
        expect(shellChrome).not.toMatch(/requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame/);
    });

    it('ships global fade+slide panel tokens and is-closing state', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const droplist = readSource('assets/css/lux-droplist.css');
        const paint = readSource('assets/css/lux-controls.css');

        expect(controls).toContain(`--lux-picker-anim-duration: ${LUX_DROPLIST_CONTRACT.animDuration}`);
        expect(controls).toContain('.lux-picker-panel.is-closing:not(.is-open)');
        expect(controls).toContain(`--lux-picker-slide-offset: ${LUX_DROPLIST_CONTRACT.slideOffset}`);
        expect(controls).toContain(`--lux-picker-scale-closed: ${LUX_DROPLIST_CONTRACT.scaleClosed}`);
        expect(controls).toContain(`--lux-droplist-anim-duration: ${LUX_DROPLIST_CONTRACT.animDuration}`);
        expect(controls).toContain(`--lux-droplist-slide-offset: ${LUX_DROPLIST_CONTRACT.slideOffset}`);
        expect(controls).toContain(`--lux-droplist-scale-closed: ${LUX_DROPLIST_CONTRACT.scaleClosed}`);
        expect(droplist + paint).toContain('--lux-picker-anchor-transform');
        expect(existsSync(join(process.cwd(), 'assets/css/index-luxury.css'))).toBe(false);
    });

    it('keeps scheduler display guards compatible with is-closing exit', () => {
        const droplist = readSource('assets/css/lux-droplist.css');

        expect(existsSync(join(process.cwd(), 'assets/css/admin-scheduler-route.css'))).toBe(false);
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel\.is-open[\s\S]*?opacity:\s*1/
        );
        expect(droplist).toMatch(
            /\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel:is\(\.is-open, \.is-closing\)[\s\S]*?will-change:\s*opacity,\s*transform/
        );
    });
});