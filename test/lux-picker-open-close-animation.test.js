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
        const shellChrome = readSource('assets/js/features/luxury-shell-picker-runtime.js');

        expect(shellChrome).toContain('function finalizePickerPanelClose(panel)');
        expect(shellChrome).toContain('function animatePickerPanelClose(panel)');
        expect(shellChrome).toContain('panel.classList.remove(\'is-open\')');
        expect(shellChrome).toContain('panel.classList.add(\'is-closing\')');
        expect(shellChrome).toContain('function forcePickerReflow(panel)');
        expect(shellChrome).toContain("event.propertyName !== 'opacity'");
        expect(shellChrome).toContain('polishAndFinishChrome');
        expect(shellChrome).toContain('fastPlace: true');
        expect(shellChrome).toContain('const LUX_PICKER_CLOSE_FALLBACK_MS = 320;');
        expect(shellChrome).toContain('openPanels.filter((openPanel) => openPanel.id !== panelId)');
        expect(shellChrome).toContain('Promise.all(otherPanels.map((openPanel) => animatePickerPanelClose(openPanel)))');
        expect(shellChrome).toContain('panel.classList.contains(\'is-closing\') && !panel.classList.contains(\'is-open\')');
        expect(shellChrome).toContain('if (shouldOpen && !hasOpenPanels)');
        expect(shellChrome).toContain("--lux-picker-anchor-transform");
        expect(shellChrome).not.toContain("panel.style.transform = 'translateY(-100%)'");
        expect(shellChrome).not.toMatch(/requestAnimationFrame\(\(\) => \{\s*requestAnimationFrame/);
        expect(shellChrome).not.toContain('requestAnimationFrame(revealPanel);');
        expect(shellChrome).toContain(
            "panel.className = 'lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll lux-droplist-panel'"
        );
        expect(shellChrome).toContain("existing.classList.add('lux-universal-picker-panel', 'lux-droplist-panel')");
        expect(shellChrome).toContain("panel.classList.add('lux-universal-picker-panel', 'lux-droplist-panel')");
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
        expect(controls).toMatch(
            /\.lux-picker-btn i[\s\S]{0,220}transition:\s*transform var\(--lux-droplist-anim-duration/
        );
        expect(controls).toMatch(
            /\.lux-picker-btn\.is-active i[\s\S]{0,80}\.lux-picker-btn\[aria-expanded="true"\] i[\s\S]{0,80}transform:\s*rotate\(180deg\)/
        );
        expect(controls).toMatch(
            /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,120}\.lux-picker-btn i[\s\S]{0,40}transition:\s*none/
        );
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

    it('animates utility panels and user menu with is-closing bloom teardown', () => {
        const shellChrome = readSource('assets/js/features/luxury-shell-picker-runtime.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(shellChrome).toContain('function animateTopbarPopoverClose(panel, options = {})');
        expect(shellChrome).toContain('function finalizeTopbarPopoverClose(panel)');
        expect(shellChrome).toContain('function revealTopbarPopover(panel, afterReveal)');
        expect(shellChrome).toContain('function openUserMenuAnimated(menu, chip)');
        expect(shellChrome).toContain("panel.classList.add('is-closing')");
        expect(shellChrome).toContain("!panel.classList.contains('is-open') && !panel.classList.contains('is-closing')");
        const closeUtilityFn = shellChrome.slice(
            shellChrome.indexOf('function closeUtilityPanels'),
            shellChrome.indexOf('function ensureTopbarUtilityPanel')
        );
        const closeUserMenuFn = shellChrome.slice(
            shellChrome.indexOf('function closeUserMenu'),
            shellChrome.indexOf('function openUserMenuAnimated')
        );
        expect(closeUtilityFn).not.toContain('options.immediate');
        expect(closeUserMenuFn).not.toContain('options.immediate');
        expect(shellChrome).not.toContain('options.restoreTeleport');
        expect(shellChrome).not.toContain('restoreTeleport:');
        expect(fouc).toMatch(/\.lux-utility-panel\.is-closing:not\(\.is-open\)/);
        expect(fouc).toMatch(/\.lux-user-menu\.is-closing:not\(\.is-open\)/);
        expect(fouc).toMatch(/\.lux-utility-panel:is\(\.is-open, \.is-closing\)[\s\S]*?display:\s*block/);
        expect(fouc).toMatch(/\.lux-utility-panel\.is-open[\s\S]*?opacity:\s*1/);
        expect(fouc).toMatch(/\.lux-user-menu\.is-open[\s\S]*?opacity:\s*1/);
        expect(fouc).toContain('transform-origin: top right');
        expect(fouc).not.toMatch(/\.lux-utility-panel\.is-open \{ display: block; \}/);
    });
});
