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
        expect(tokens).toContain('--lux-btn-ghost-well');
        expect(tokens).toContain('--lux-btn-ghost-label');
        expect(tokens).toContain('--lux-btn-sheen');
        expect(tokens).toContain('--lux-btn-label');
        expect(tokens).toContain('--lux-btn-fade');
        expect(tokens).toContain('--lux-btn-fade-hover');
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-fade:[^;]*lux-accent-rgb/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-fade:[^;]*lux-color-fade-alpha/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-well-soft:\s*var\(--lux-btn-fade\)/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-well-hover:\s*var\(--lux-btn-fade-hover\)/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*?--lux-btn-well-soft-hover:\s*var\(--lux-btn-fade-hover\)/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-well:[\s\S]*#fbf7f1/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-fade:[\s\S]*rgba\(var\(--lux-accent-rgb\)/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-label: var\(--lux-text, #1d2633\)/);
        expect(tokens).not.toMatch(/--lux-btn-well:[^;]*#1a222c/);
        expect(controls).toContain('polished clean well');
        expect(controls).toContain('one-shot diagonal sheen');
        expect(controls).toContain('var(--lux-btn-sheen)');
        expect(controls).toContain('contain: paint');
        expect(controls).toContain('var(--lux-btn-well-hover');
        expect(controls).toContain('var(--lux-btn-ghost-well');
        expect(controls).toContain('var(--lux-btn-ghost-label');
        expect(controls).toMatch(/Fade lives in the well token once/);
        expect(controls).toMatch(/\.lux-primary-btn::before[\s\S]*linear-gradient\( 180deg, rgba\(255, 255, 255/);
        expect(controls).not.toMatch(/\.lux-primary-btn::before[\s\S]{0,280}var\(--lux-btn-fade\)/);
        expect(controls).toMatch(/translateX\(-130%\)/);
        expect(controls).toMatch(/:is\(:hover, :focus-visible\)::after[\s\S]{0,80}translateX\(130%\)/);
        expect(controls).toMatch(/will-change:\s*transform/);
        expect(controls).toContain('prefers-reduced-motion');
    });

    it('dashboard unifies action buttons to polished primary frame', () => {
        const home = readHomeDashboardCss();
        expect(home).toContain('var(--lux-btn-well)');
        expect(home).toContain('var(--lux-btn-border-solid');
        expect(home).toContain('var(--lux-btn-sheen)');
        expect(home).toContain('var(--lux-btn-ghost-well');
        expect(home).toMatch(/#page-home #lux-home-shell[\s\S]*?\.lux-ghost-btn/);
        expect(home).toMatch(/border-radius:\s*var\(--lux-btn-pill-radius/);
    });
});
