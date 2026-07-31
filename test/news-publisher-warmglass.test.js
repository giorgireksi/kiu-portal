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
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(modals).toContain('[data-lux-transparency-exempt="1"] .newsx-publisher-modal :is(');
        expect(modals).toContain('.newsx-editor-ribbon.home-hover-chip');
        expect(modals).toContain('.newsx-attachment-chip.home-hover-chip');
        expect(modals).toContain('.newsx-publisher-pane.lux-soft-chrome.home-hover-chip');
        expect(modals).toMatch(/\.newsx-publisher-section-tab\s*\{[^}]*cursor:\s*pointer/);
        expect(modals).not.toMatch(/\.newsx-publisher-section-tab\s*\{[^}]*background:\s*var\(--lux-panel-modal-section/);
        expect(publisher).toContain('newsx-publisher-section-tab lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-editor-ribbon lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-publisher-pane lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-publisher-radio-card lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-publisher-toggle-card lux-soft-chrome home-hover-chip');
        expect(fouc).toContain('.newsx-publisher-modal :is(');
        expect(fouc).toContain('.newsx-publisher-pane.home-hover-chip');
    });

    it('dual-writes shared Lux classes on manage-sections modal markup', () => {
        const publisher = readSource('assets/js/pages/news/news-publisher.js');
        const modals = readSource('assets/css/lux-modals.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const runtime = readSource('assets/js/pages/news/news-runtime.js');

        expect(publisher).toContain('newsx-sections-row lux-soft-chrome home-hover-chip');
        expect(publisher).toContain('newsx-kicker lux-section-kicker');
        expect(publisher).toContain('newsx-headline newsx-headline-tight lux-card-title');
        expect(publisher).toContain('newsx-subtle lux-card-copy');
        expect(publisher).toContain('newsx-meta lux-card-meta');
        expect(publisher).toContain('newsx-sections-count lux-status-pill home-hover-chip is-muted');
        expect(publisher).toContain('lux-secondary-btn newsx-sections-remove-btn home-hover-chip');
        expect(publisher).toContain('lux-primary-btn home-hover-chip');
        expect(publisher).toContain('data-news-sections-icon-open');
        expect(publisher).not.toContain('newsx-sections-icon-panel');
        expect(runtime).toContain('openNewsSectionIconPickerModal');
        expect(runtime).toContain('collectNewsSectionIconUsage');
        expect(runtime).toContain('newsx-sections-icon-picker');
        expect(runtime).toContain('newsx-sections-icon-grid');
        expect(runtime).toContain('data-news-sections-icon-pick');
        expect(runtime).toContain('is-used');
        expect(runtime).toContain('data-news-sections-icon-used');
        expect(runtime).toContain('excludeIndex');
        expect(runtime).toContain('NEWS_SECTION_ICON_CHOICES');
        expect(runtime.match(/'fa-[a-z0-9-]+'/g)?.length).toBeGreaterThanOrEqual(36);
        expect(readSource('assets/js/pages/news/news-events.js')).toContain('excludeIndex: index');
        expect(modals).toContain('.newsx-sections-row.home-hover-chip');
        expect(modals).toContain('.newsx-sections-icon-picker');
        expect(modals).toContain('.newsx-sections-icon-grid');
        expect(modals).toContain('.newsx-sections-icon-option.is-used');
        expect(modals).toContain('grid-template-columns: repeat(6, minmax(0, 1fr))');
        expect(modals).toMatch(/#newsx-confirm-overlay\.modal-overlay\s*\{[^}]*z-index:\s*2100/);
        expect(modals).toContain('.newsx-sections-row:not(.home-hover-chip)');
        expect(modals).toContain('.newsx-sections-modal .newsx-sections-row.home-hover-chip');
        expect(fouc).toContain('.newsx-sections-modal .newsx-sections-row.home-hover-chip');
    });

    it('dual-writes shared Lux classes on publisher create/edit modal markup', () => {
        const publisher = readSource('assets/js/pages/news/news-publisher.js');
        const modals = readSource('assets/css/lux-modals.css');

        expect(publisher).toContain('newsx-kicker lux-section-kicker">Publisher Studio');
        expect(publisher).toContain('newsx-headline lux-card-title');
        expect(publisher).toContain('newsx-publisher-subtitle newsx-subtle lux-card-copy');
        expect(publisher).toContain('newsx-publisher-pane-title lux-card-title');
        expect(publisher).toContain('newsx-publisher-pane-copy lux-card-copy');
        expect(publisher).toContain('newsx-meta lux-card-meta');
        expect(publisher).toContain('lux-secondary-btn home-hover-chip" data-news-save-draft');
        expect(publisher).toContain('lux-primary-btn home-hover-chip" data-news-publisher-primary');
        expect(modals).toContain('.newsx-publisher-pane-title.lux-card-title');
        expect(modals).toContain('.newsx-publisher-pane-copy.lux-card-copy');
        expect(modals).toContain('.newsx-publisher-pane-title:not(.lux-card-title)');
        expect(modals).toContain('.newsx-compose-hint.lux-card-meta');
        expect(modals).toContain('.newsx-kicker.lux-section-kicker');
        expect(modals).toContain('.newsx-headline.lux-card-title');
    });

    it('uses bare shell on news.html with modal overlay markup', () => {
        const html = readSource('news.html');

        expectRetiredCss('news-route.css');
        expect(html).not.toContain('news-route.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('lux-layout-primitives.css');
        expect(html).toContain('data-lux-modal-overlay');
        expect(html).toContain('<!DOCTYPE html>');
    });
});
