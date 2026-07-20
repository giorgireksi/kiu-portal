import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('home hero focus LMS parity', () => {
    it('renders exact LMS focus DOM in widget-render', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        expect(render).toMatch(
            /class="lms-hero-focus lux-hero-side lux-focus-panel lux-soft-chrome"/
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

    it('dual-writes soft-chrome on dashboard panels and editor cards', () => {
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        const editor = readSource('assets/js/features/home-dashboard/editor-ui.js');
        expect(render).toContain('lux-soft-chrome lux-summary-surface--hero');
        expect(render).toMatch(/lux-panel lux-soft-chrome lux-alert/);
        expect(render).toContain('lux-dashboard-section lux-builder-section lux-soft-chrome');
        expect(render).toContain('lux-card lux-builder-card lux-soft-chrome');
        expect(render).toContain('lux-stat lux-soft-chrome');
        expect(render).toContain('lux-quick-btn lux-soft-chrome');
        expect(render).toContain('lux-list-row lux-soft-chrome');
        expect(render).toContain('lux-pill lux-soft-chrome');
        
        expect(editor).toContain('lux-editor-card lux-soft-chrome');
        expect(editor).toContain('lux-editor-card lux-editor-card--size lux-soft-chrome');
    });

    it('uses unified soft-chrome material selector (asd31 parity)', () => {
        const homeCss = readHomeDashboardCss();
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-focus-fill: var(--home-fade-soft)');
        expect(tokens).not.toContain('--lux-home-panel-fill');
        expect(homeCss).toMatch(
            /body\.lux-unified-shell:not\(\.lux-route-students-admin\) #page-home #lux-home-shell[\s\S]*?\.lux-soft-chrome/
        );
        expect(homeCss).toContain('var(--lux-focus-fill, var(--lux-soft-chrome-surface');
        expect(homeCss).not.toContain('var(--lux-home-panel-fill');
    });

    it('styles focus panel with LMS soft-chrome material (no nested mega-glass)', () => {
        const homeCss = readHomeDashboardCss();
        const focusCss = readSource('assets/css/lux-focus-panel.css');
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(homeCss).toContain('exact LMS focus contract');
        expect(tokens).toContain('--home-fade-blur');
        // Primary soft-chrome hosts frost via --home-fade-blur; 0% stays clear.
        expect(homeCss).toMatch(/backdrop-filter:\s*var\(--home-fade-blur\)\s*!important/);
        expect(homeCss).toMatch(
            /html\[data-lux-transparency="0"\] body\.lux-unified-shell[\s\S]{0,1200}backdrop-filter:\s*none !important/
        );
        expect(homeCss).toContain('.lux-hero-stage');
        expect(homeCss).not.toContain('lms-hero-v2');
        expect(homeCss).toContain('--lux-soft-chrome-surface');
        expect(homeCss).toContain('--lux-focus-fill');
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

    it('shields home hero shells from luxury glass bleed via soft-chrome', () => {
        const css = readHomeDashboardCss();
        expect(css).toContain('.lux-grid-widget > .lux-grid-widget-body > .lux-builder-hero');
        expect(css).toContain('.lux-grid-widget > .lux-grid-widget-body > .page-hero');
        expect(css).not.toContain('.lms-hero-v2');
        expect(css).toMatch(/backdrop-filter:\s*var\(--home-fade-blur\)\s*!important/);
        expect(css).toContain('--home-glass-fill');
        // Outer widget frame transparent; soft-chrome children own the surface
        expect(css).toContain('Outer widget frame stays transparent');
        expect(css).toMatch(
            /\.lux-dashboard-canvas \.lux-grid-widget[\s\S]{0,200}background:\s*transparent(?:\s*!important)?/
        );
    });


    it('matte soft-chrome on home stats, quick tiles, and list rows', () => {
        const css = readHomeDashboardCss();
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(css).toContain('Inner dashboard chips');
        expect(css).toMatch(/\.lux-stat[\s\S]{0,80}\.lux-soft-chrome|\.lux-soft-chrome[\s\S]{0,40}\.lux-stat|:is\(\.lux-stat/);
        expect(css).toContain('.lux-quick-btn');
        expect(css).toContain('.lux-list-row');
        expect(css).toContain('.lux-pill');
        // Nested chips keep soft-chrome fill; blur only disabled (no stacked frost)
        expect(css).toMatch(
            /\.lux-stat\.lux-soft-chrome[\s\S]{0,280}backdrop-filter:\s*none !important/
        );
        expect(transparency).toContain('Soft-chrome / focus-panel / liquid glass CTAs');
        expect(transparency).toContain("el.classList.contains('lux-soft-chrome')");
    });


    it('dashboard action buttons share primary framed capsule look', () => {
        const css = readHomeDashboardCss();
        expect(css).toContain('polished framed capsule');
        expect(css).toContain('var(--lux-btn-well)');
        expect(css).toContain('var(--lux-btn-frame-metal)');
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?:is\(\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn/);
        expect(css).toContain('.lux-admin-op-btn');
    });


    it('dashboard alert panels use soft-chrome material (not green wash)', () => {
        const css = readHomeDashboardCss();
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        expect(render).toContain('lux-panel lux-soft-chrome lux-alert');
        expect(css).toContain('Dashboard alert — soft-chrome parity');
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-alert(?:\.lux-soft-chrome|\s*\{)/);
        expect(css).toContain('var(--lux-soft-chrome-surface');
        // tone on icon, not full green gradient wash
        expect(css).toMatch(/\.lux-alert(?:\.is-green|:is\([^)]*is-green[^)]*\))[\s\S]{0,120}\.lux-alert-icon/);
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-alert\.is-green\s*\{/);
        expect(css).toMatch(/\.lux-alert(?:\.is-green|:is\([^)]*is-green[^)]*\))[\s\S]{0,400}background-image:\s*none(?:\s*!important)?/);
    });


    it('dashboard list cards polish layout', () => {
        const css = readHomeDashboardCss();
        expect(css).toContain('Dashboard list cards — soft-chrome layout polish');
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-list\s*\{/);
        expect(css).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-builder-card-foot\s*\{/);
    });

    it('dashboard widget bodies do not scroll', () => {
        const widgets = readSource('assets/css/index-home-widgets.css');
        const layout = readSource('assets/css/index-home-layout.css');
        expect(widgets).toMatch(
            /\.lux-dashboard-canvas\.is-desktop\s+\.lux-grid-widget-body\s*\{[^}]*overflow:\s*visible/
        );
        expect(widgets).not.toMatch(
            /#page-home\s+\.lux-grid-widget-body\s*\{[^}]*overflow-y:\s*auto/
        );
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

    it('keeps editor ghost/move affordances without glass layer promotion', () => {
        // View paint + lazy editor sheet (editor CSS loads when customize starts)
        const css =
            readHomeDashboardCss() +
            readSource('assets/css/index-home-editor.css');
        expect(css).toMatch(
            /\.lux-grid-widget\.is-ghost-source[\s\S]{0,80}opacity:\s*0\.42/
        );
        expect(css).toContain('.lux-dashboard-canvas.is-editing .lux-grid-widget.is-live-moving');
        // Soft-chrome hosts use token blur; no nested mega-glass promotion
        expect(css).toContain('no nested mega-glass');
        expect(css).toContain('var(--lux-soft-chrome-surface');
        expect(css).toMatch(/backdrop-filter:\s*var\(--home-fade-blur\)\s*!important/);
    });
});
