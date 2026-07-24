import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('lux scrollbar regressions', () => {
    it('ships global scrollbar tokens and shell nav scrollbar (primitives retired)', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        const shell = readSource('assets/css/lux-shell.css');
        const controls = readSource('assets/css/lux-controls.css');

        // Orphan lux-layout-primitives.css removed from live tree
        expect(existsSync(join(process.cwd(), 'assets/css/lux-layout-primitives.css'))).toBe(false);

        expect(tokens).toContain('--lux-scrollbar-thumb');
        expect(tokens).toContain('--lux-scrollbar-thumb-hover');
        expect(tokens).toContain('--lux-scrollbar-track');
        expect(tokens).toContain('--lux-scrollbar-size');
        expect(tokens).toContain('--lux-scrollbar-thumb: rgba(48, 34, 22, 0.18)');
        expect(tokens).toMatch(/--lux-scrollbar-thumb-hover:\s*rgba\(var\(--lux-accent-rgb\)/);

        expect(shell).toContain('.lux-nav::-webkit-scrollbar');
        // Picker panels keep tokenized thumbs in controls
        expect(controls).toContain('::-webkit-scrollbar-thumb');
        expect(controls).toContain('var(--lux-scrollbar-thumb');
        expect(controls).toContain('var(--lux-scrollbar-thumb-hover');
    });

    it('wires admin-tools scroll hotspots to lux-scrollbar classes in JS', () => {
        const bundle = readSource('assets/js/features/index-admin-tools.bundle-source.js');
        expect(bundle).toContain('lux-scrollbar lux-admin-tools-builder-body');
        expect(bundle).toContain('lux-scrollbar lux-semester-scroll-list');
    });

    it('keeps light-mode scrollbar thumb token for shared chrome', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('--lux-scrollbar-thumb: rgba(48, 34, 22, 0.18)');
        expect(tokens).toContain('--lux-scrollbar-thumb-hover');
        expect(tokens).toMatch(/body\.lux-light-mode[\s\S]*?--lux-scrollbar-thumb-hover:\s*color-mix/);
    });
});
