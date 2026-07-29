import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('home dashboard shell hover lift', () => {
    it('defines home hover shadow token in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--home-fade-shadow-hover:');
        expect(tokens).toContain('--home-chip-hover-lift: -3px');
        expect(tokens).toContain('--home-chip-hover-lift-nested: -1px');
        expect(tokens).toMatch(/body\.lux-full-paint[\s\S]*--home-fade-shadow-hover:/);
        expect(tokens).toMatch(/body\.lux-light-mode\.lux-full-paint[\s\S]*--home-fade-shadow-hover:/);
    });

    it('does not lift removed grid-widget frost hosts on hover', () => {
        const widgets = readSource('assets/css/index-home-widgets.css');
        expect(widgets).not.toContain('.lux-dashboard-canvas.is-editing');
        expect(widgets).not.toMatch(
            /\.lux-grid-widget[\s\S]*:hover > \.lux-grid-widget-body[\s\S]*transform:\s*translate3d\(0,\s*-3px,\s*0\)/
        );
    });

    it('lifts matte interactive shells and supports coarse-pointer active lift', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lux-module-option.lux-soft-chrome');
        expect(fouc).toContain('.student-service-qa-card');
        expect(fouc).toContain('.newsx-header-bar');
        expect(fouc).toContain('.admin-library-catalog-card.lux-soft-chrome');
        expect(fouc).toContain('.student-service-pill');
        expect(fouc).toContain('.lux-empty-state');
        expect(fouc).toMatch(/@media \(hover: none\), \(pointer: coarse\)[\s\S]*\.student-service-qa-card[\s\S]*:active/);
    });

    it('lifts only bordered soft-chrome chips inside widgets', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(render).not.toContain('home-hover-shell');
        expect(render).toMatch(/lux-list-row lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-stat lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-pill lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-quick-btn lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-hero-side lux-focus-panel lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-pill lux-soft-chrome home-hover-chip lms-hero-focus-chip/);
        expect(render).toMatch(/lms-hero-focus-meta[\s\S]*lux-pill lux-soft-chrome home-hover-chip/);
        expect(render).not.toMatch(/lux-hero-intro home-hover-chip/);
        expect(render).not.toMatch(/lux-alert-icon home-hover-chip/);
        expect(render).not.toMatch(/lux-alert-copy home-hover-chip/);
        expect(render).not.toMatch(/lux-card-head home-hover-chip/);
        expect(render).not.toMatch(/lux-shortcut-head home-hover-chip/);
        expect(render).not.toMatch(/lux-shortcut-body home-hover-chip/);
        expect(render).not.toMatch(/lux-widget-minimized-icon home-hover-chip/);
        expect(render).not.toMatch(/lux-widget-minimized-copy home-hover-chip/);
        expect(render).not.toMatch(/lux-admin-op-head home-hover-chip/);
        expect(fouc).not.toMatch(/\.home-hover-shell:hover[\s\S]*translate3d\(0,\s*-3px,\s*0\)/);
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*var\(--home-chip-hover-lift/);
        expect(fouc).not.toMatch(/home-hover-chip:hover:not\(:has\(/);
        expect(fouc).not.toMatch(/\.home-hover-chip:has\(\.home-hover-chip:hover\)[\s\S]*transform:\s*none/);
        expect(fouc).toMatch(/\.home-hover-chip:has\(\.home-hover-chip\)[\s\S]*contain:\s*none/);
        expect(fouc).toMatch(/\[data-lux-glass-root="1"\]\):not\(\.home-hover-chip\)[\s\S]*transition:\s*none/);
        expect(fouc).toMatch(/\.lux-status-pill\.home-hover-chip[\s\S]*--home-chip-hover-lift-nested/);
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*contain:\s*paint/);
        expect(fouc).toMatch(/\.home-hover-chip[\s\S]*::after/);
        expect(fouc).not.toMatch(/home-hover-chip[\s\S]*filter:\s*brightness/);
        expect(fouc).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.home-hover-chip[\s\S]*display:\s*none/);
    });

    it('disables hover lift under reduced motion and at 0% transparency', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.home-hover-chip[\s\S]*transform:\s*none/);
        expect(fouc).toMatch(/html\[data-lux-transparency="0"\][\s\S]*\.home-hover-chip[\s\S]*transform:\s*none/);
    });

    it('merges home sections into one frost shell without customize chrome', () => {
        const role = readSource('assets/css/index-home-role.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const layout = readSource('assets/css/index-home-layout.css');
        const shell = readSource('assets/js/features/home-dashboard/shell.js');
        expect(fouc).toContain('[data-lux-glass-root="1"]');
        expect(fouc).toMatch(/\[data-lux-glass-root="1"\][\s\S]{0,400}var\(--lux-panel-surface\)/);
        expect(fouc).toMatch(/body\.lux-route-home #page-home #lux-home-shell[\s\S]*\.lux-home-merged :is\([\s\S]*\.lms-hero-focus[\s\S]*var\(--lux-soft-chrome-surface/);
        expect(fouc).toMatch(/body\.lux-route-home #page-home #lux-home-shell[\s\S]*\.lms-hero-focus[\s\S]*--home-chip-surface-fill/);
        expect(fouc).toMatch(/body\.lux-route-home #page-home #lux-home-shell[\s\S]*\.lux-stat\.lux-soft-chrome[\s\S]*backdrop-filter:\s*none/);
        expect(fouc).toMatch(/body\.lux-route-home #page-home #lux-home-shell[\s\S]*\.lux-alert\.lux-soft-chrome/);
        expect(role).toMatch(/\.lux-home-merged[\s\S]*backdrop-filter:\s*none !important/);
        expect(role).not.toMatch(/\.lux-home-merged\.lux-soft-chrome[\s\S]{0,200}var\(--lux-panel-fill/);
        expect(layout).toContain('.lux-home-merged');
        expect(layout).toContain('.lux-home-band--split');
        expect(layout).toMatch(/\.lux-home-merged[\s\S]*gap:\s*0/);
        expect(shell).toContain('lux-home-merged');
        expect(shell).toMatch(/lux-home-merged lux-soft-chrome[\s\S]*data-lux-glass-root="1"/);
        expect(shell).toContain('lux-home-band');
        expect(shell).not.toContain('Customize dashboard');
        expect(shell).not.toContain('lux-grid-widget');
    });

    it('excludes merged desk from high-transparency primer soft-chrome wash', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        const primer = readSource('assets/js/theme-primer.js');
        expect(tokens).toContain('--home-chip-glass-fill');
        expect(tokens).toContain('--lux-soft-chrome-rim-glow');
        expect(tokens).toContain('--lux-soft-chrome-chip-shadow');
        expect(tokens).toMatch(/body\.lux-full-paint[\s\S]*--lux-soft-chrome-surface:[\s\S]*--home-fade-soft:\s*var\(--lux-soft-chrome-surface\)/);
        expect(tokens).toContain('--lux-panel-host-border');
        expect(tokens).toContain('--lux-panel-host-shadow');
        expect(tokens).toContain('--lux-panel-surface');
        expect(tokens).toContain('--lux-panel-blur-filter');
        expect(tokens).not.toContain('--home-desk-glass-surface');
        expect(tokens).not.toContain('--home-desk-glass-blur');
        expect(tokens).toMatch(/html\.lux-fully-opaque body\.lux-full-paint[\s\S]*--lux-panel-fill:\s*rgba\(8,\s*12,\s*21,\s*1\)/);
        expect(tokens).toMatch(/html\.lux-fully-opaque body\.lux-full-paint[\s\S]*--lux-panel-surface:[\s\S]*ellipse 42% 28% at 82% 14%/);
        expect(tokens).toMatch(/html\.lux-fully-opaque body\.lux-full-paint[\s\S]*--lux-panel-surface:[\s\S]*\* 0\.45\)/);
        expect(tokens).toContain('--lux-panel-blur-filter: blur(calc(8px * var(--lux-glass-blur-quality-mult, 1)));');
        expect(tokens).toMatch(/html\.lux-fully-opaque body\.lux-full-paint[\s\S]*--home-chip-glass-fill:\s*var\(--home-glass-fill\)/);
        expect(primer).toContain("'.lux-soft-chrome:not(.lux-home-merged)'");
        expect(primer).not.toMatch(/getHighTransparencySurfaceSelectors[\s\S]*'\.lux-soft-chrome',/);
    });
});
