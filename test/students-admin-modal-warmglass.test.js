import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('students admin modal warmglass regressions', () => {
    it('defines shared warmglass tokens in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-warmglass-surface');
        expect(tokens).toContain('--lux-warmglass-section: rgba(255, 255, 255, 0.42)');
        expect(tokens).toContain('--lux-warmglass-input: rgba(255, 255, 255, 0.52)');
        expect(tokens).toContain('--lux-warmglass-border: rgba(77, 52, 31, 0.12)');
        expect(tokens).toContain('linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(247, 241, 232, 0.44))');
        expect(tokens).toContain('--lux-warmglass-blur: blur(26px) saturate(155%)');
    });

    it('uses global lux-modals warmglass for students hub form modals', () => {
        const css = readWarmglassCss();

        expect(css).toContain('--lux-modal-glass-surface: var(--lux-popup-shell-surface)');
        expect(css).toContain('--lux-popup-shell-surface: var(--lux-frosted-glass-surface)');
        expect(css).toContain('.lux-glass-dialog-card--hub-form');
        expect(css).toContain('.lms-glass-dialog-overlay');
        expect(css).toContain('--lux-warmglass-overlay-light');
        expect(css).toContain('.students-hub-schema-empty');
        expect(css).toContain('.lux-picker-panel');
        expect(css).toContain('.lux-glass-dialog-card--hub-form, .lux-glass-dialog-card--hub-dialog');
        expect(css).toContain('.lux-picker-btn--compact');
        expect(css).toContain('var(--lux-modal-glass-input)');
        expect(css).toContain('.students-hub-form-section');
        expect(css).toContain('/* Popup modals: section chrome + layout; .lux-control / picker CTA from lux-controls §3. */');
        expect(css).toContain(`.lux-control,
  .lux-picker-field
) {
  width: 100%;
  min-width: 0;
}`);
        expect(css).toMatch(/\.lux-primary-btn[\s\S]*::before[\s\S]*display:\s*none/);
    });

    it('defines modal panel token aliases in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-panel-modal-section: var(--lux-warmglass-section)');
        expect(tokens).toContain('--lux-panel-cta-accent:');
    });

    it('links lux-modals and lux-glass-dialog on students-admin bare shell', () => {
        const html = readSource('students-admin.html');

        expectRetiredCss('students-admin-lms.css');
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-glass-dialog.js');
        expect(html).not.toContain('index-luxury.css');
        expect(html).not.toContain('-borderfix1');
    });

    it('renders students hub modals via glass-dialog overlay helpers', () => {
        const js = readSource('assets/js/pages/students-command-center.js');
        const dialog = readSource('assets/js/shared/lux-glass-dialog.js');

        expect(js).toContain('renderLuxHubFormModalOverlay');
        expect(js).toContain('openLuxHubFormModalRoot');
        expect(js).toContain('closeLuxHubFormModalRoot');
        expect(js).not.toContain('students-hub-modal-backdrop');
        expect(dialog).toContain('lms-glass-dialog-overlay');
    });
});
