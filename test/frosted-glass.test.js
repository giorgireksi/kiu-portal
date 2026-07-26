import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('frosted glass SSOT', () => {
    it('defines global frosted glass tokens in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-frosted-glass-surface: rgba(8, 12, 21, 0.50)');
        expect(tokens).toContain('--lux-frosted-glass-blur: blur(22px) saturate(140%)');
        expect(tokens).toContain('--lux-popup-shell-surface: var(--lux-frosted-glass-surface)');
        expect(tokens).toMatch(/html\.lux-light-mode[\s\S]*--lux-frosted-glass-surface: rgba\(255, 255, 255, 0\.50\)/);
    });

    it('exposes frosted glass utility panel class', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lux-frosted-glass-panel');
        expect(fouc).toContain('var(--lux-frosted-glass-surface)');
    });

    it('routes all popup shells through global frosted popup tokens', () => {
        const studio = readSource('assets/css/lux-studio.css');
        const modals = readSource('assets/css/lux-modals.css');
        const portal = readSource('assets/css/layout-portal.css');
        expect(studio).toContain('--lux-studio-dialog-bg: var(--lux-popup-shell-surface)');
        expect(studio).toContain('var(--lux-popup-shell-blur)');
        expect(modals).toContain('--lux-modal-glass-surface: var(--lux-popup-shell-surface)');
        expect(modals).toContain('.lux-bg-mode-params-dialog');
        expect(portal).toContain('.portal-msg-modal-window');
        expect(portal).toContain('var(--lux-popup-shell-surface)');
        expect(studio).not.toContain('--lux-studio-dialog-bg: rgba(255, 255, 255, 0.88)');
    });
});
