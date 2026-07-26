import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('global lux-modals warmglass', () => {
    it('defines shared warmglass tokens in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-warmglass-surface');
        expect(tokens).toContain('--lux-warmglass-section: rgba(255, 255, 255, 0.42)');
        expect(tokens).toContain('rgba(247, 241, 232, 0.44)');
        expect(tokens).toContain('--lux-warmglass-overlay-light: rgba(73, 48, 25, 0.20)');
    });

    it('styles exempt modal subtrees globally', () => {
        const css = readSource('assets/css/lux-modals.css');

        expect(css).toContain('[data-lux-transparency-exempt="1"]');
        expect(css).toContain('--lux-modal-glass-surface: var(--lux-popup-shell-surface)');
        expect(css).toContain('.lux-glass-dialog-card--hub-form');
        expect(css).toContain('.lux-glass-dialog-card');
        expect(css).toContain('.lux-bg-mode-params-dialog');
        expect(css).toContain('.lms-glass-dialog-overlay');
        expect(css).toContain('.lms-quiz-board-modal');
        expect(css).toContain('.lux-picker-panel');
        expect(css).toContain('[data-lux-modal-overlay].active:not([aria-hidden=\'true\'])');
    });

    it('aliases light-mode popup text tokens to full black contrast', () => {
        const css = readSource('assets/css/lux-modals.css');

        expect(css).toContain('§3 light-mode popup text');
        expect(css).toContain('--lux-text: #000');
        expect(css).toContain('--lux-text-muted: var(--lux-text)');
        expect(css).toContain('--lux-text-soft: var(--lux-text)');
        expect(css).toContain('#lux-studio-backdrop');
        expect(css).toContain('.lux-glass-dialog-card');
    });
});
