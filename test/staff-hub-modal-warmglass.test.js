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

    it('uses global lux-modals warmglass for staff-hub modal shells', () => {
        const css = readWarmglassCss();
        const html = readSource('staff.html');

        expect(css).toContain('.staff-hub-modal');
        expect(css).toContain('.staff-hub-modal-backdrop');
        expect(css).toContain('.staff-hub-schema-empty');
        expect(css).toContain('.lux-picker-panel');
        expect(html).toContain('lux-modals.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('staff-command-center.css');
        expect(html).not.toContain('index-luxury.css');
        expectRetiredCss('staff-command-center.css');
        expectRetiredCss('index-luxury.css');
    });
});
