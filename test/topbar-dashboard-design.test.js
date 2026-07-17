import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('topbar matches dashboard design language', () => {
    it('scopes soft-chrome shell and framed CTAs under full-paint topbar', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const shell = readSource('assets/css/lux-shell.css');
        expect(controls).toContain('Topbar → dashboard design');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(controls).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(controls).toContain('var(--lux-btn-well)');
        expect(controls).toContain('var(--lux-btn-frame-metal)');
    });

    it('shared lux-shell owns topbar SSOT and loads before home-dashboard on index', () => {
        const shell = readSource('assets/css/lux-shell.css');
        const html = readSource('index.html');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('var(--lux-soft-chrome-surface');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).not.toMatch(/lux-shell-full-paint\.css/);
        expect(html).not.toMatch(/lux-shell-nav\.css/);
        const shellIdx = html.indexOf('lux-shell.css');
        const homeIdx = html.indexOf('index-home-dashboard.css');
        expect(shellIdx).toBeGreaterThan(-1);
        expect(homeIdx).toBeGreaterThan(shellIdx);
    });

    it('dual-writes lux-soft-chrome on topbar shell and controls', () => {
        const js = readSource('assets/js/features/index-luxury.js');
        expect(js).toContain('lux-topbar-shell lux-soft-chrome lux-panel');
        expect(js).toContain('ensureTopbarSoftChrome');
    });

    it('transparency engine CSS-owns topbar shell like soft-chrome', () => {
        const util = readSource('assets/js/shared/utilities.js');
        expect(util).toContain('isTopbarSoftChromeSurface');
        expect(util).toContain("el.classList.contains('lux-topbar-shell')");
    });

    it('home last paint uses exact builder-card focus-fill material on topbar', () => {
        const home = readSource('assets/css/index-home-dashboard.css');
        expect(home).toContain('body.lux-route-home.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(home).toContain('var(--lux-btn-well)');
    });

    it('index loads lux-controls after tokens for topbar paint', () => {
        const html = readSource('index.html');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-full-paint');
        expect(html.indexOf('lux-controls.css')).toBeGreaterThan(html.indexOf('lux-tokens.css'));
    });
});
