import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('news publisher warmglass regressions (bare-shell era)', () => {
    it('styles publisher modal via global lux-modals exempt layer', () => {
        const css = readWarmglassCss();

        expect(css).toContain('.newsx-publisher-modal');
        expect(css).toContain('--lux-modal-glass-surface: var(--lux-popup-shell-surface)');
        expect(css).toContain('[data-lux-modal-overlay].active:not([aria-hidden=\'true\'])');
        expect(css).toContain('--lux-warmglass-overlay-light');
    });

    it('consolidates publisher interior chip paint under exempt matte SSOT', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const publisher = readSource('assets/js/pages/news/news-publisher.js');

        expect(modals).toContain('[data-lux-transparency-exempt="1"] .newsx-publisher-modal :is(');
        expect(modals).toContain('.newsx-editor-ribbon.home-hover-chip');
        expect(modals).toContain('.newsx-attachment-chip.home-hover-chip');
        expect(modals).toMatch(/\.newsx-publisher-section-tab\s*\{[^}]*cursor:\s*pointer/);
        expect(modals).not.toMatch(/\.newsx-publisher-section-tab\s*\{[^}]*background:\s*var\(--lux-panel-modal-section/);
        expect(publisher).toContain('newsx-publisher-section-tab home-hover-chip');
        expect(publisher).toContain('newsx-editor-ribbon home-hover-chip');
        expect(publisher).toContain('newsx-publisher-radio-card home-hover-chip');
    });

    it('uses bare shell on news.html with modal overlay markup', () => {
        const html = readSource('news.html');

        expectRetiredCss('news-route.css');
        expect(html).not.toContain('news-route.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('data-lux-modal-overlay');
        expect(html).toContain('<!DOCTYPE html>');
    });
});
