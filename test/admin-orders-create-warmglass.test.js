import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('admin orders create warmglass regressions', () => {
    it('defines warmglass tokens on modal roots via lux-modals SSOT', () => {
        const css = readWarmglassCss();

        expect(css).toContain('--lux-modal-glass-surface: var(--lux-popup-shell-surface)');
        expect(css).toContain('--lux-modal-glass-section: var(--lux-warmglass-section)');
        expect(css).toContain('--lux-modal-glass-input: var(--lux-warmglass-input)');
        expect(css).toContain('--lux-modal-glass-border: var(--lux-popup-shell-border)');
        expect(css).toContain('--lux-modal-glass-blur: var(--lux-popup-shell-blur)');
        expect(css).toContain('[data-lux-modal-overlay]');
    });

    it('uses bare shell on admin-orders.html (no route paint sheet)', () => {
        const html = readSource('admin-orders.html');

        expectRetiredCss('admin-orders-route.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).toContain('lux-modals.css');
        expect(html).not.toContain('admin-orders-route.css');
        expect(html).not.toContain('features/ui.js');
        expect(html).not.toContain('luxury-home-model.js');
    });
});
