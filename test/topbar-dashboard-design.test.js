import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('topbar matches dashboard design language', () => {
    it('scopes soft-chrome shell and framed CTAs under full-paint topbar', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const shellFp = readSource('assets/css/lux-shell-full-paint.css');
        expect(controls).toContain('Topbar → dashboard design');
        expect(shellFp).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(controls).toContain('var(--lux-soft-chrome-surface');
        expect(controls).toContain('var(--lux-soft-chrome-border');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-sidebar-toggle-btn');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-editor-btn');
        expect(controls).toContain('var(--lux-btn-well)');
        expect(controls).toContain('var(--lux-btn-frame-metal)');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-picker-btn');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-icon-btn');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-user-chip');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-search input');
    });

    it('full-paint shell CSS owns topbar soft-chrome SSOT (extracted from luxury EOF)', () => {
        const shellFp = readSource('assets/css/lux-shell-full-paint.css');
        const html = readSource('index.html');
        expect(shellFp).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(shellFp).toContain('var(--lux-soft-chrome-surface');
        expect(shellFp).toContain('var(--lux-btn-frame-metal)');
        expect(html).toMatch(/lux-shell-full-paint\.css/);
        // shell file loads before home dashboard last-paint on index
        const shellIdx = html.indexOf('lux-shell-full-paint.css');
        const homeIdx = html.indexOf('index-home-dashboard.css');
        expect(shellIdx).toBeGreaterThan(-1);
        expect(homeIdx).toBeGreaterThan(shellIdx);
    });

    it('dual-writes lux-soft-chrome on topbar shell and controls', () => {
        const js = readSource('assets/js/features/index-luxury.js');
        expect(js).toContain('lux-topbar-shell lux-soft-chrome lux-panel');
        expect(js).toContain('lux-picker-btn lux-soft-chrome');
        expect(js).toContain('lux-icon-btn lux-soft-chrome');
        expect(js).toContain('lux-user-chip lux-soft-chrome');
        expect(js).toContain('lux-search lux-soft-chrome');
        expect(js).toContain('ensureTopbarSoftChrome');
    });

    it('transparency engine CSS-owns topbar shell like soft-chrome', () => {
        const util = readSource('assets/js/shared/utilities.js');
        expect(util).toContain('isTopbarSoftChromeSurface');
        expect(util).toContain("el.classList.contains('lux-topbar-shell')");
    });

    it('home last paint uses exact builder-card focus-fill material on topbar', () => {
        const home = readSource('assets/css/index-home-dashboard.css');
        expect(home).toContain('Topbar EXACT same material as Official updates builder-card');
        expect(home).toContain('body.lux-route-home.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(home).toContain('var(--lux-focus-fill, var(--lux-soft-chrome-surface, var(--lux-panel-surface)))');
        expect(home).toContain('var(--lux-focus-border, var(--lux-soft-chrome-border, var(--lux-panel-border)))');
        expect(home).toContain('var(--lux-focus-shadow, var(--lux-soft-chrome-shadow, var(--lux-panel-shadow)))');
        expect(home).toContain('var(--lux-btn-well)');
        expect(home).toContain('var(--lux-btn-frame-metal)');
    });

    it('index loads lux-controls after tokens for topbar paint', () => {
        const html = readSource('index.html');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-full-paint');
        const t = html.indexOf('lux-tokens.css');
        const c = html.indexOf('lux-controls.css');
        expect(c).toBeGreaterThan(t);
    });
});
