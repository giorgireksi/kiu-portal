import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

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
        expect(render).toContain('lms-hero-v2-grid');
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

    it('styles focus panel with LMS soft-chrome material (no nested mega-glass)', () => {
        const homeCss = readSource('assets/css/index-home-dashboard.css');
        const focusCss = readSource('assets/css/lux-focus-panel.css');
        expect(homeCss).toContain('exact LMS focus contract');
        expect(homeCss).toMatch(
            /\.lms-hero-focus\.lux-hero-side[\s\S]{0,400}backdrop-filter:\s*none/
        );
        expect(homeCss).toContain('.lms-hero-v2-grid');
        expect(homeCss).toContain('--lux-soft-chrome-surface');
        expect(homeCss).toContain('--lux-focus-fill');
        expect(homeCss).not.toContain('.lux-timetable-hero-focus');
        // Structure/rail/chips live in shared primitive (not triplicated on home)
        expect(focusCss).toContain('.lms-hero-focus.lux-hero-side::before');
        expect(focusCss).toContain('.lms-hero-focus-chip');
        expect(focusCss).toContain('.lux-soft-chrome');
        expect(focusCss).toMatch(/backdrop-filter:\s*none\s*!important/);
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
        const utilities = readSource('assets/js/shared/utilities.js');
        // Shared non-home glass helper (timetable blueprint)
        expect(utilities).toContain('function buildLuxuryRoutePanelGradient');
        expect(utilities).toContain("'var(--lux-panel-surface-soft)'");
        expect(utilities).toContain("'var(--lux-panel-surface)'");
        expect(utilities).toContain('shouldKeepRouteFadeCssBackground');
        expect(utilities).toContain('shouldKeepLmsFadeCssBackground');
        expect(utilities).toContain("el.classList.contains('lux-timetable-hero-focus')");
    });

    it('shields home hero shells from luxury glass bleed via soft-chrome', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        expect(css).toContain('.lux-grid-widget > .lux-grid-widget-body > .lux-builder-hero');
        expect(css).toContain('.lux-grid-widget > .lux-grid-widget-body > .page-hero');
        expect(css).toContain('.lux-grid-widget > .lux-grid-widget-body > .lms-hero-v2');
        expect(css).toMatch(
            /#page-home #lux-home-shell \.page-hero\.lms-hero-v2[\s\S]{0,300}backdrop-filter:\s*none !important/
        );
        // Outer widget frame transparent; soft-chrome children own the surface
        expect(css).toContain('Outer widget frame stays transparent');
        expect(css).toMatch(
            /\.lux-dashboard-canvas \.lux-grid-widget[\s\S]{0,200}background:\s*transparent !important/
        );
    });


    it('matte soft-chrome on home stats, quick tiles, and list rows', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(css).toContain('Inner dashboard chips');
        expect(css).toMatch(/\.lux-stat[\s\S]{0,80}\.lux-soft-chrome|\.lux-soft-chrome[\s\S]{0,40}\.lux-stat|:is\(\.lux-stat/);
        expect(css).toContain('.lux-quick-btn');
        expect(css).toContain('.lux-list-row');
        expect(css).toContain('.lux-pill');
        expect(utilities).toContain('Soft-chrome / focus-panel / liquid glass CTAs');
        expect(utilities).toContain("el.classList.contains('lux-soft-chrome')");
    });


    it('dashboard action buttons share primary framed capsule look', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        expect(css).toContain('polished framed capsule');
        expect(css).toContain('var(--lux-btn-well)');
        expect(css).toContain('var(--lux-btn-frame-metal)');
        expect(css).toMatch(/#page-home #lux-home-shell :is\(\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn/);
        expect(css).toContain('.lux-admin-op-btn');
    });


    it('dashboard alert panels use soft-chrome material (not green wash)', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        const render = readSource('assets/js/features/home-dashboard/widget-render.js');
        expect(render).toContain('lux-panel lux-soft-chrome lux-alert');
        expect(css).toContain('Dashboard alert — soft-chrome parity');
        expect(css).toContain('#page-home #lux-home-shell .lux-alert.lux-soft-chrome');
        expect(css).toContain('var(--lux-soft-chrome-surface');
        // tone on icon, not full green gradient wash
        expect(css).toMatch(/\.lux-alert\.is-green \.lux-alert-icon/);
        expect(css).toContain('#page-home #lux-home-shell .lux-alert.is-green');
        expect(css).toMatch(/\.lux-alert\.is-green[\s\S]{0,400}background-image:\s*none\s*!important/);
    });


    it('dashboard list cards polish layout', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        expect(css).toContain('Dashboard list cards — soft-chrome layout polish');
        expect(css).toContain('#page-home #lux-home-shell .lux-list');
        expect(css).toContain('#page-home #lux-home-shell .lux-builder-card-foot');
    });

    it('dashboard widget body uses high-visibility orbital gem scrollbar', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(css).toContain('Dashboard orbital gem scrollbar');
        expect(css).toContain('high-visibility framed rail');
        expect(css).toContain('::-webkit-scrollbar-thumb');
        expect(css).toContain('::-webkit-scrollbar-track');
        expect(css).toContain('14px');
        expect(tokens).toContain('--lux-home-scroll-size');
        expect(tokens).toContain('--lux-home-scroll-track-edge');
        expect(tokens).toContain('--lux-home-scroll-thumb-solid');
        expect(tokens).toContain('var(--lux-accent)');
    });

    it('cache-busts home dashboard assets', () => {
        const html = readSource('index.html');
        expect(html).toMatch(/index-home-dashboard\.css\?v=/);
        expect(html).toContain('index-luxury.css?v=');
        expect(html).toContain('luxury-index-runtime.js?v=');
        expect(html).toContain('index-luxury.js?v=');
        expect(html).toContain('lux-tokens.css?v=20260717-scrollvis1');
        expect(html).toContain('utilities.js?v=');
        expect(html).toContain('luxury-home-model.js?v=20260714-homefocus5');
        expect(html).toContain('index-home-dashboard.js?v=20260717-btnpill1');
        expect(html).toContain('lux-focus-panel.css');
    });

    it('keeps editor ghost/move affordances without glass layer promotion', () => {
        const css = readSource('assets/css/index-home-dashboard.css');
        expect(css).toMatch(
            /\.lux-grid-widget\.is-ghost-source[\s\S]{0,80}opacity:\s*0\.42/
        );
        expect(css).toContain('.lux-dashboard-canvas.is-editing .lux-grid-widget.is-live-moving');
        // Soft-chrome era: matte panels, no backdrop-filter glass host promotion
        expect(css).toContain('no nested mega-glass');
        expect(css).toContain('var(--lux-soft-chrome-surface');
    });
});
