import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('admin tools structured form warmglass regressions', () => {
    it('defines warmglass tokens on modal roots via lux-modals SSOT', () => {
        const css = readWarmglassCss();

        expect(css).toContain('--lux-modal-glass-surface: var(--lux-warmglass-surface)');
        expect(css).toContain('--lux-modal-glass-section: var(--lux-warmglass-section)');
        expect(css).toContain('--lux-modal-glass-input: var(--lux-warmglass-input)');
        expect(css).toContain('--lux-modal-glass-border: var(--lux-warmglass-border)');
        expect(css).toContain('--lux-modal-glass-blur: var(--lux-warmglass-blur)');
        expect(css).toContain('[data-lux-modal-overlay]');
    });

    it('uses bare shell on admin-tools.html (no route paint sheet)', () => {
        const html = readSource('admin-tools.html');

        expectRetiredCss('admin-tools-luxury.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('admin-tools-luxury.css');
    });

    it('styles structured form field labels and help via lux-modals SSOT', () => {
        const css = readWarmglassCss();
        const track = readSource('assets/js/pages/admin-registration-track.js');

        expect(css).toContain('[data-lux-transparency-exempt="1"] .lux-glass-dialog-field > .social-neo-label');
        expect(css).toContain('.registration-structured-help');
        expect(css).toContain('#kiu-structured-form-modal > .lux-glass-dialog-card');
        expect(css).not.toContain('--atools-fade-');
        expect(track).toContain('const containerLabel = String(tabConfig.programsLabel || tabConfig.label || \'Program\').replace(/s$/i, \'\');');
        expect(track).not.toContain('`New ${tabConfig.label} Program`');
    });
});
