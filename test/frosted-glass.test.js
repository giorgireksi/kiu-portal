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
        expect(tokens).toMatch(/html\.lux-light-mode[\s\S]*--lux-frosted-glass-surface: rgba\(255, 255, 255, 0\.50\)/);
    });

    it('exposes frosted glass utility panel class', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lux-frosted-glass-panel');
        expect(fouc).toContain('var(--lux-frosted-glass-surface)');
    });

    it('paints studio dialogs with frosted tokens not warmglass surface', () => {
        const studio = readSource('assets/css/lux-studio.css');
        expect(studio).toContain('--lux-studio-dialog-bg: var(--lux-frosted-glass-surface)');
        expect(studio).toMatch(/#lux-studio-backdrop \.lux-studio-panel[\s\S]*?\.lux-bg-gallery-dialog[\s\S]*?var\(--lux-frosted-glass-blur\)/);
        expect(studio).not.toMatch(/#lux-studio-backdrop \.lux-studio-panel[\s\S]*?var\(--lux-warmglass-surface/);
        expect(studio).not.toMatch(/\.lux-bg-mode-params-dialog[\s\S]*?var\(--lux-warmglass-surface/);
        expect(studio).not.toMatch(/\.lux-bg-gallery-dialog[\s\S]*?var\(--lux-warmglass-surface/);
        expect(studio).not.toContain('--lux-studio-dialog-bg: rgba(255, 255, 255, 0.88)');
    });
});
