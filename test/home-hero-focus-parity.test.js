import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('home hero focus LMS parity', () => {
    it('renders exact LMS focus DOM in widget-render', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        expect(render).toMatch(
            /class="lms-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome home-hover-chip"/
        );
        expect(render).toContain('lms-hero-focus-kicker');
        expect(render).toContain('lms-hero-focus-chip');
        expect(render).toContain('lms-hero-focus-title');
        expect(render).toContain('lms-hero-focus-meta');
        expect(render).toContain('lux-hero-stage');
        expect(render).not.toContain('lms-hero-v2-grid');
        expect(render).toContain('lux-focus-panel');
        expect(render).toContain('lux-soft-chrome');
        expect(render).not.toContain('lux-timetable-hero-focus');
        expect(render).not.toContain('lux-timetable-focus-facts');
        expect(render).not.toContain('lux-hero-signal-list');
    });

    it('dual-writes soft-chrome on dashboard panels', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        expect(render).toContain('lux-soft-chrome lux-summary-surface--hero');
        expect(render).toMatch(/lux-panel lux-soft-chrome lux-alert/);
        expect(render).toContain('lux-dashboard-section lux-builder-section lux-soft-chrome');
        expect(render).toContain('lux-card lux-builder-card lux-soft-chrome');
        expect(render).toContain('lux-stat lux-soft-chrome');
        expect(render).toContain('lux-quick-btn lux-soft-chrome');
        expect(render).toContain('lux-list-row lux-soft-chrome');
        expect(render).toContain('lux-pill lux-soft-chrome');
    });

    it('uses unified soft-chrome material selector (asd31 parity)', () => {
        const homeCss = readHomeDashboardCss();
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-focus-fill: var(--home-fade-soft)');
        expect(tokens).not.toContain('--lux-home-panel-fill');
        expect(homeCss).toMatch(
            /body\.lux-unified-shell:not\(\.lux-route-students-admin\) #page-home #lux-home-shell[\s\S]*?\.lux-soft-chrome/
        );
        expect(homeCss).toContain('--lux-panel-surface');
        expect(homeCss).not.toContain('var(--lux-home-panel-fill');
        expect(homeCss).not.toContain('--home-desk-glass-surface');
    });

    it('styles focus panel with LMS soft-chrome material (no nested mega-glass)', () => {
        const homeCss = readHomeDashboardCss();
        const focusCss = readSource('assets/css/lux-focus-panel.css');
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(homeCss).toContain('.lux-home-merged :is(');
        expect(homeCss).toContain('.lms-hero-focus');
        expect(tokens).toContain('--home-fade-blur');
        // Legacy grid / merged desk: single host blur via panel SSOT.
        expect(homeCss).toMatch(/backdrop-filter:\s*var\(--lux-panel-blur-filter/);
        expect(homeCss).toMatch(
            /html\[data-lux-transparency="0"\] body\.lux-unified-shell[\s\S]{0,1200}backdrop-filter:\s*none !important/
        );
        expect(homeCss).toContain('.lux-hero-stage');
        expect(homeCss).not.toContain('lms-hero-v2');
        expect(homeCss).toMatch(/\.lux-home-merged :is\([\s\S]*\.lms-hero-focus[\s\S]*var\(--lux-soft-chrome-surface/);
        expect(homeCss).toMatch(/\.lux-home-merged :is\([\s\S]*\.lux-stat\.lux-soft-chrome[\s\S]*backdrop-filter:\s*none !important/);
        expect(homeCss).not.toContain('.lux-timetable-hero-focus');
        // Structure/rail/chips live in shared primitive (not triplicated on home)
        expect(focusCss).toContain('.lms-hero-focus.lux-hero-side::before');
        expect(focusCss).toContain('.lms-hero-focus-chip');
        expect(focusCss).toContain('.lux-soft-chrome');
        expect(focusCss).toMatch(/backdrop-filter:\s*none(?:\s*!important)?/);
    });

    it('uses LMS chip contract in luxury-home-model for empty student week', () => {
        const model = readSource('assets/js/features/luxury-home-model.js');
        expect(model).toContain("kicker: 'Your next class'");
        expect(model).toContain("chip: 'Quiet week'");
        expect(model).toContain("headline: 'No sessions this week'");
        expect(model).toContain('meta: { icon:');
        expect(model).not.toContain('copyHidden');
        expect(model).not.toContain('lux-timetable-focus-facts');
    });

    it('engine paints residual non-home glass from panel CSS tokens', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency-route-runtime.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(routeRuntime).toContain('function buildLuxuryRoutePanelGradient');
        expect(routeRuntime).toContain("'var(--lux-panel-surface-soft)'");
        expect(routeRuntime).toContain("'var(--lux-panel-surface)'");
        expect(transparency).toContain('shouldKeepRouteFadeCssBackground');
        expect(transparency).toContain('shouldKeepLmsFadeCssBackground');
        expect(transparency).toContain("el.classList.contains('lux-timetable-hero-focus')");
    });

    it('shields home hero shells via merged desk and surface chips without second frost', () => {
        const css = readHomeDashboardCss();
        expect(css).toContain('.lux-home-merged.lux-soft-chrome');
        expect(css).toContain('--lux-panel-surface');
        expect(css).not.toContain('.lms-hero-v2');
        expect(css).toMatch(/backdrop-filter:\s*var\(--lux-panel-blur-filter/);
        expect(css).toContain('.lux-home-merged :is(');
        expect(css).toContain('.lms-hero-focus');
        expect(css).toMatch(/\.lux-home-merged :is\([\s\S]*\.lms-hero-focus[\s\S]*var\(--lux-soft-chrome-surface/);
        expect(css).toMatch(/\.lux-home-merged :is\([\s\S]*\.lms-hero-focus[\s\S]*backdrop-filter:\s*none !important/);
    });

    it('applies single frost host on lux-home-grid with fill-only children', () => {
        const css = readHomeDashboardCss();
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(css).toContain('#page-home #lux-home-shell .lux-home-grid');
        expect(css).toMatch(/\.lux-home-grid > \.lux-card[\s\S]*backdrop-filter:\s*none !important/);
        expect(css).not.toContain('.lux-grid-widget > .lux-grid-widget-body');
        expect(transparency).toContain('isHomeLegacyGridInnerPanel');
        expect(transparency).toContain('isHomeWidgetInnerPanel');
    });


    it('matte soft-chrome on home stats, quick tiles, and list rows', () => {
        const css = readHomeDashboardCss();
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(css).toContain('.lux-home-merged :is(');
        expect(css).toMatch(/\.lux-stat\.lux-soft-chrome|\.lux-home-merged :is\([\s\S]*\.lux-stat\.lux-soft-chrome/);
        expect(css).toContain('.lux-quick-btn');
        expect(css).toContain('.lux-list-row');
        expect(css).toContain('.lux-pill');
        expect(css).toMatch(/\.lux-home-merged :is\([\s\S]*\.lux-list-row\.lux-soft-chrome[\s\S]*var\(--lux-soft-chrome-surface/);
        expect(css).toMatch(/\.lux-home-merged :is\([\s\S]*\.lux-list-row\.lux-soft-chrome[\s\S]*--home-chip-surface-fill/);
        expect(transparency).toContain("el.classList.contains('lux-soft-chrome')");
        expect(transparency).toContain('shouldKeepHomeFadeCssBackground');
    });


    it('dashboard action buttons share primary framed capsule look', () => {
        const css = readHomeDashboardCss();
        const controls = readSource('assets/css/lux-controls.css');
        expect(controls).toContain('var(--lux-btn-well)');
        expect(controls).toContain('var(--lux-btn-border-solid');
        expect(css).toContain('.lux-admin-op-btn');
        expect(css).not.toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-ghost-btn[\s\S]*?var\(--lux-btn-frame-metal/);
    });


    it('dashboard alert panels use soft-chrome material (not green wash)', () => {
        const css = readHomeDashboardCss();
        const primitives = readSource('assets/css/lux-layout-primitives.css');
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        expect(render).toContain('lux-panel lux-soft-chrome lux-alert');
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-alert(?:\.lux-soft-chrome|\s*\{)/);
        expect(css).toContain('var(--lux-soft-chrome-surface');
        // tone on icon, not full green gradient wash (shared primitives)
        expect(primitives).toMatch(/\.lux-alert(?:\.is-green|:is\([^)]*is-green[^)]*\))[\s\S]{0,120}\.lux-alert-icon|\.lux-alert:is\([\s\S]*is-green[\s\S]*\) \.lux-alert-icon/);
        expect(primitives).toContain('.lux-alert.is-green');
        expect(primitives).toMatch(/\.lux-alert:is\([\s\S]*is-green[\s\S]*\)[\s\S]{0,200}background-image:\s*none/);
    });


    it('dashboard list cards polish layout', () => {
        const css = readHomeDashboardCss();
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-list\s*\{/);
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-builder-card-foot\s*\{/);
    });

    it('dashboard builder cards use overflow-visible layout', () => {
        const widgets = readSource('assets/css/index-home-widgets.css');
        const layout = readSource('assets/css/index-home-layout.css');
        expect(widgets).toContain('.lux-builder-card');
        expect(widgets).not.toMatch(/\.lux-grid-widget\s*>\s*\.lux-grid-widget-body/);
        expect(widgets).toMatch(/\.lux-builder-card \.lux-list\s*\{[\s\S]*?flex:\s*0 1 auto;[\s\S]*?min-height:\s*0;[\s\S]*?overflow:\s*visible/);
        expect(layout).not.toContain('Dashboard orbital gem scrollbar');
    });

    it('cache-busts home dashboard assets', () => {
        const html = readSource('index.html');
        expect(html).toMatch(/index-home-layout\.css\?v=/);
        expect(html).toMatch(/index-home-widgets\.css\?v=/);
        expect(html).toMatch(/index-home-role\.css\?v=/);
        expect(html).toMatch(/lux-fouc-ht\.css\?v=/);
        expect(html).toContain('luxury-index-runtime.js?v=');
        expect(html).toContain('index-luxury.js?v=');
        expect(html).toMatch(/lux-tokens\.css\?v=/);
        expect(html).not.toMatch(/lux-tokens-paint\.css/);
        expect(html).toContain('utilities.js?v=');
        expect(html).toMatch(/luxury-home-model\.js\?v=/);
        expect(html).toMatch(/index-home-dashboard\.js\?v=/);
        expect(html).toMatch(/index-home-dashboard\.plain\.js\?v=/);
        expect(html).toContain('lux-focus-panel.css');
    });

    it('does not ship lazy editor CSS with the static home entry', () => {
        const css = readHomeDashboardCss();
        expect(css).toContain('var(--lux-soft-chrome-surface');
        expect(css).toMatch(/backdrop-filter:\s*var\(--lux-panel-blur-filter/);
        expect(existsSync(join(process.cwd(), 'assets/css/index-home-editor.css'))).toBe(false);
    });
});
