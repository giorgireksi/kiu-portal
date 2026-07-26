import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource, readWarmglassCss } from './helpers/bare-shell-css.js';

describe('staff hub modal warmglass regressions', () => {
    it('defines shared warmglass tokens in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-warmglass-surface');
        expect(tokens).toContain('--lux-warmglass-section: rgba(255, 255, 255, 0.42)');
        expect(tokens).toContain('--lux-warmglass-input: rgba(255, 255, 255, 0.52)');
        expect(tokens).toContain('--lux-warmglass-border: rgba(77, 52, 31, 0.12)');
        expect(tokens).toContain('linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(247, 241, 232, 0.44))');
        expect(tokens).toContain('--lux-warmglass-blur: blur(26px) saturate(155%)');
    });

    it('uses global lux-modals warmglass for staff hub form modals', () => {
        const css = readWarmglassCss();
        const html = readSource('staff.html');

        expect(css).toContain('.lux-glass-dialog-card--hub-form');
        expect(css).toContain('.lms-glass-dialog-overlay');
        expect(css).toMatch(/lux-glass-dialog-card--hub-form[\s\S]*\.lux-ghost-btn/);
        expect(css).toMatch(/\.lux-primary-btn[\s\S]*::before[\s\S]*display:\s*none/);
        expect(css).toContain('.staff-hub-schema-empty');
        expect(css).toContain('.lux-picker-panel');
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-glass-dialog.js');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('staff-command-center.css');
        expect(html).not.toContain('index-luxury.css');
        expectRetiredCss('staff-command-center.css');
        expectRetiredCss('index-luxury.css');
    });

    it('renders staff hub modals via glass-dialog overlay helpers', () => {
        const js = readSource('assets/js/pages/staff-command-center.js');

        expect(js).toContain('renderLuxHubFormModalOverlay');
        expect(js).toContain('openLuxHubFormModalRoot');
        expect(js).not.toContain('staff-hub-modal-backdrop');
    });
});
