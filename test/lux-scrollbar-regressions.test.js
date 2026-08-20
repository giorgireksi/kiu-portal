import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('lux scrollbar regressions', () => {
    it('ships shared layout primitives, scrollbar tokens, and shell nav scrollbar', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        const shell = readSource('assets/css/lux-shell.css');
        const controls = readSource('assets/css/lux-controls.css');
        const runtime = readSource('assets/js/shared/lux-custom-scrollbar.js');

        expect(runtime).toContain('data-lux-scrollport');
        expect(runtime).toContain('One inner rail belongs to one scrollport');
        expect(runtime).toContain('function isSocialCenterScroller(el)');
        expect(runtime).toContain('function releaseSocialCenterScroller(el)');

        const primitives = readSource('assets/css/lux-layout-primitives.css');
        expect(existsSync(join(process.cwd(), 'assets/css/lux-layout-primitives.css'))).toBe(true);
        expect(primitives).toContain('.lux-stat-row');
        expect(primitives).toContain('.lux-list-row');
        expect(primitives).toContain('.lux-alert');

        expect(tokens).toContain('--lux-scrollbar-thumb');
        expect(tokens).toContain('--lux-scrollbar-thumb-hover');
        expect(tokens).toContain('--lux-scrollbar-track');
        expect(tokens).toContain('--lux-scrollbar-size');
        expect(tokens).toContain('--lux-scrollbar-thumb: rgba(var(--lux-accent-rgb), 0.78)');
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
        expect(tokens).toContain('--lux-scrollbar-thumb: rgba(var(--lux-accent-rgb), 0.78)');
        expect(tokens).toContain('--lux-scrollbar-thumb-hover');
        expect(tokens).toMatch(/body\.lux-light-mode[\s\S]*?--lux-scrollbar-thumb-hover:\s*rgba\(var\(--lux-accent-rgb\), 0\.96\)/);
    });
});
