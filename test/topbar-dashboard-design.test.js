import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('topbar matches dashboard design language', () => {
    it('scopes soft-chrome shell and framed CTAs under full-paint topbar', () => {
        const controls = readSource('assets/css/lux-controls.css');
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(shell).toMatch(
            /body\.lux-full-paint\.lux-unified-shell #lux-topbar \.lux-topbar-shell\s*\{[\s\S]*?backdrop-filter:\s*none/
        );
        expect(shell).toMatch(
            /body\.lux-full-paint\.lux-unified-shell #lux-topbar \.lux-topbar-shell\s*\{[\s\S]*?--lux-soft-chrome-surface/
        );
        expect(controls).toContain('var(--lux-btn-well)');
        expect(controls).toContain('var(--lux-btn-border-solid');
        expect(shell).toContain('var(--lux-btn-border-solid');
        expect(shell).toMatch(/\.lux-sidebar-toggle-btn, \.lux-topbar-editor-btn\s*\{[\s\S]*border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(shell).toMatch(/\.lux-picker-btn\s*\{[\s\S]*border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(shell).toMatch(/\.lux-picker-btn\s*\{[\s\S]*background:\s*var\(--lux-btn-ghost-well/);
        expect(shell).toMatch(/\.lux-picker-btn::after[\s\S]*var\(--lux-btn-sheen\)/);
        expect(shell).toMatch(/\.lux-picker-btn:hover::after[\s\S]*translateX\(130%\)/);
        expect(shell).toMatch(/\.lux-icon-btn\s*\{[\s\S]*background:\s*var\(--lux-btn-ghost-well/);
        expect(shell).toMatch(/\.lux-icon-btn::after[\s\S]*var\(--lux-btn-sheen\)/);
        expect(shell).toMatch(/\.lux-sidebar-toggle-btn, \.lux-topbar-editor-btn\s*\{[\s\S]*contain:\s*paint/);
        expect(shell).toMatch(/\.lux-picker-btn, \.lux-icon-btn\s*\{[\s\S]*contain:\s*paint/);
        expect(shell).toMatch(/\.lux-sidebar-toggle-btn::before[\s\S]*linear-gradient\(180deg, rgba\(255,\s*255,\s*255/);
        expect(shell).not.toMatch(/\.lux-sidebar-toggle-btn::before[\s\S]{0,220}var\(--lux-btn-fade\)/);
        expect(shell).toMatch(/\.lux-sidebar-toggle-btn::after[\s\S]*var\(--lux-btn-sheen\)/);
        expect(shell).not.toMatch(
            /lux-sidebar-toggle-btn::before[\s\S]{0,120}display:\s*none/
        );
        expect(shell).not.toMatch(
            /#lux-topbar \.lux-picker-btn,[\s\S]*?#lux-topbar \.lux-icon-btn,[\s\S]*?--lux-soft-chrome-surface/
        );
        expect(shell).toMatch(/\.lux-icon-btn\s*\{[\s\S]*border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(shell).toMatch(/#lux-topbar \.lux-icon-btn[\s\S]*border-color:\s*var\(--lux-btn-border-solid/);
        // Nested control blur strip only — topbar shell paint stays in lux-shell.css
        expect(controls).toMatch(/#lux-topbar \.lux-topbar-shell :is\(\.lux-picker-btn/);
        expect(controls).not.toMatch(/#lux-topbar \.lux-topbar-shell\s*\{/);
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(
            /body\.lux-full-paint\.lux-unified-shell #lux-topbar :is\(\.lux-picker-btn, \.lux-icon-btn[\s\S]*?--lux-btn-ghost-well/
        );
        expect(fouc).not.toMatch(
            /body\.lux-light-mode \.lux-icon-btn,/
        );
    });

    it('dark CTA wells include accent color-fade radials', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-btn-fade:');
        expect(tokens).toContain('--lux-btn-fade-hover:');
        const fade = tokens.match(/:root\s*\{[\s\S]*?--lux-btn-fade:\s*([^;]+);/);
        expect(fade?.[1] || '').toMatch(/lux-accent-rgb/);
        expect(fade?.[1] || '').toMatch(/lux-color-fade-alpha|lux-panel-glow/);
        expect(fade?.[1] || '').toMatch(/radial-gradient/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-well-soft:\s*var\(--lux-btn-fade\)/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-well:\s*var\(--lux-btn-fade\)/);
    });

    it('shared lux-shell loads before home-dashboard on index', () => {
        const shell = readSource('assets/css/lux-shell.css');
        const html = readSource('index.html');
        expect(shell).toContain('TOPBAR SOFT-CHROME SSOT');
        expect(shell).toContain('var(--lux-soft-chrome-surface');
        expect(html).toMatch(/lux-shell\.css/);
        expect(html).not.toMatch(/lux-shell-paint\.css/);
        expect(html).not.toMatch(/lux-shell-full-paint\.css/);
        expect(html).not.toMatch(/lux-shell-nav\.css/);
        const shellIdx = html.indexOf('lux-shell.css');
        const homeIdx = html.indexOf('index-home-layout.css');
        expect(shellIdx).toBeGreaterThan(-1);
        expect(homeIdx).toBeGreaterThan(shellIdx);
    });

    it('dual-writes lux-soft-chrome on topbar shell only (controls stay framed CTAs)', () => {
        const js = readSource('assets/js/features/index-luxury.js');
        expect(js).toContain('lux-topbar-shell lux-soft-chrome');
        expect(js).not.toContain('lux-topbar-shell lux-soft-chrome lux-panel');
        expect(js).toContain('ensureTopbarSoftChrome');
        expect(js).toContain("el.classList.remove('lux-soft-chrome')");
        expect(js).not.toMatch(/lux-picker-btn lux-soft-chrome/);
        expect(js).not.toMatch(/lux-icon-btn lux-soft-chrome/);
    });

    it('transparency engine CSS-owns topbar shell like soft-chrome', () => {
        const util = readSource('assets/js/shared/lux-transparency.js');
        expect(util).toContain('isTopbarSoftChromeSurface');
        expect(util).toContain("el.classList.contains('lux-topbar-shell')");
    });

    it('shell owns home topbar; home keeps framed CTA wells', () => {
        const home = readHomeDashboardCss();
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toContain('body.lux-full-paint.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(shell).toContain('var(--lux-focus-fill');
        expect(home).not.toContain('body.lux-route-home.lux-unified-shell #lux-topbar .lux-topbar-shell');
        expect(home).toContain('var(--lux-btn-well)');
    });

    it('index loads lux-controls after tokens for topbar paint', () => {
        const html = readSource('index.html');
        expect(html).toContain('lux-controls.css');
        expect(html).toContain('lux-full-paint');
        expect(html.indexOf('lux-controls.css')).toBeGreaterThan(html.indexOf('lux-tokens.css'));
        expect(html.indexOf('lux-shell.css')).toBeGreaterThan(html.indexOf('lux-controls.css'));
    });
});
