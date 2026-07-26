import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('admin library modal warmglass regressions', () => {
    it('aliases shared warmglass tokens via lux-modals exempt layer', () => {
        const css = readWarmglassCss();
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(css).toContain('.admin-library-modal');
        expect(css).toContain('--lux-modal-glass-section: var(--lux-warmglass-section)');
        expect(css).toContain('--lux-modal-glass-input: var(--lux-warmglass-input)');
        expect(css).toContain('--lux-modal-glass-border: var(--lux-popup-shell-border)');
        expect(css).toContain('--lux-modal-glass-blur: var(--lux-popup-shell-blur)');
        expect(css).toContain('--lux-modal-glass-surface: var(--lux-popup-shell-surface)');
        expect(tokens).toContain('--lux-warmglass-section: rgba(255, 255, 255, 0.42)');
        expect(tokens).toContain('--lux-warmglass-input: rgba(255, 255, 255, 0.52)');
        expect(tokens).toContain('--lux-warmglass-border: rgba(77, 52, 31, 0.12)');
        expect(tokens).toContain('--lux-warmglass-blur: blur(26px) saturate(155%)');
    });

    it('uses bare shell on admin-library.html (no route paint sheet)', () => {
        const html = readSource('admin-library.html');

        expectRetiredCss('admin-library-route.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('admin-library-route.css');
    });
});
