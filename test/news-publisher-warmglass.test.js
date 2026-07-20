import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('news publisher warmglass regressions (bare-shell era)', () => {
    it('styles publisher modal via global lux-modals exempt layer', () => {
        const css = readWarmglassCss();

        expect(css).toContain('.newsx-publisher-modal');
        expect(css).toContain('--lux-modal-glass-surface: var(--lux-warmglass-surface)');
        expect(css).toContain('[data-lux-modal-overlay].active:not([aria-hidden=\'true\'])');
        expect(css).toContain('--lux-warmglass-overlay-light');
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
