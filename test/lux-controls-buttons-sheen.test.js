import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readHomeDashboardCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux-controls polished framed capsules', () => {
    it('has clean well, metal frame, and hover sheen animation', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        const controls = readSource('assets/css/lux-controls.css');
        expect(tokens).toContain('--lux-btn-frame-metal');
        expect(tokens).toContain('--lux-btn-well');
        expect(tokens).toContain('--lux-btn-sheen');
        expect(tokens).toContain('--lux-btn-label');
        expect(controls).toContain('polished clean well');
        expect(controls).toContain('one-shot diagonal sheen');
        expect(controls).toContain('var(--lux-btn-sheen)');
        expect(controls).toMatch(/translateX\(-130%\)/);
        expect(controls).toMatch(/:hover::after[\s\S]{0,80}translateX\(130%\)/);
        expect(controls).toContain('prefers-reduced-motion');
    });

    it('dashboard unifies action buttons to polished primary frame', () => {
        const home = readHomeDashboardCss();
        expect(home).toContain('polished framed capsule');
        expect(home).toContain('var(--lux-btn-well)');
        expect(home).toContain('var(--lux-btn-frame-metal)');
        expect(home).toContain('var(--lux-btn-sheen)');
    });
});
