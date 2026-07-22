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
        expect(tokens).toMatch(/body\.lux-route-home[\s\S]*--home-fade-shadow-hover:/);
        expect(tokens).toMatch(/body\.lux-light-mode\.lux-route-home[\s\S]*--home-fade-shadow-hover:/);
    });

    it('does not lift widget frost host on hover in view mode', () => {
        const widgets = readSource('assets/css/index-home-widgets.css');
        expect(widgets).toContain('.lux-dashboard-canvas.is-editing');
        expect(widgets).not.toMatch(
            /\.lux-grid-widget[\s\S]*:hover > \.lux-grid-widget-body[\s\S]*transform:\s*translate3d\(0,\s*-3px,\s*0\)/
        );
    });

    it('lifts only bordered soft-chrome chips inside widgets', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const role = readSource('assets/css/index-home-role.css');
        expect(render).not.toContain('home-hover-shell');
        expect(render).toMatch(/lux-list-row lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-stat lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-pill lux-soft-chrome home-hover-chip/);
        expect(render).toMatch(/lux-hero-side lux-focus-panel lux-soft-chrome home-hover-chip/);
        expect(render).not.toMatch(/lux-hero-intro home-hover-chip/);
        expect(render).not.toMatch(/lux-alert-icon home-hover-chip/);
        expect(render).not.toMatch(/lux-alert-copy home-hover-chip/);
        expect(render).not.toMatch(/lux-card-head home-hover-chip/);
        expect(render).not.toMatch(/lux-shortcut-head home-hover-chip/);
        expect(render).not.toMatch(/lux-shortcut-body home-hover-chip/);
        expect(render).not.toMatch(/lux-widget-minimized-icon home-hover-chip/);
        expect(render).not.toMatch(/lux-widget-minimized-copy home-hover-chip/);
        expect(render).not.toMatch(/lux-admin-op-head home-hover-chip/);
        expect(role).not.toMatch(/\.home-hover-shell:hover[\s\S]*translate3d\(0,\s*-3px,\s*0\)/);
        expect(role).toMatch(/\.lux-soft-chrome\.home-hover-chip:hover:not\(:has\([\s\S]*\.lux-quick-btn[\s\S]*var\(--home-chip-hover-lift/);
    });

    it('disables hover lift under reduced motion and at 0% transparency', () => {
        const widgets = readSource('assets/css/index-home-widgets.css');
        const role = readSource('assets/css/index-home-role.css');
        expect(widgets).toMatch(/prefers-reduced-motion: reduce\)[\s\S]*\.lux-grid-widget:hover > \.lux-grid-widget-body[\s\S]*transform:\s*none/);
        expect(role).toMatch(/html\[data-lux-transparency="0"\][\s\S]*\.lux-grid-widget:hover > \.lux-grid-widget-body[\s\S]*transform:\s*none/);
    });

    it('lifts direct grid shells and keeps single-frost architecture', () => {
        const role = readSource('assets/css/index-home-role.css');
        expect(role).toContain('dashboard-hover-lift');
        expect(role).toMatch(/\.lux-home-grid > :is\([\s\S]*\.lux-panel[\s\S]*\):hover[\s\S]*translate3d\(0,\s*-3px,\s*0\)/);
        expect(role).toContain('Widget inner panels: border/shadow only — body owns fill+frost');
        expect(role).toMatch(/\.lux-grid-widget > \.lux-grid-widget-body[\s\S]*backdrop-filter:\s*var\(--home-fade-blur\)/);
        expect(role).toMatch(/\.lux-grid-widget > \.lux-grid-widget-body > \.lux-panel[\s\S]*backdrop-filter:\s*none !important/);
    });
});
