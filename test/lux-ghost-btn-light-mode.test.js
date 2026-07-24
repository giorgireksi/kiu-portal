import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux ghost button light mode', () => {
    it('defines ghost-specific tokens with light-mode overrides', () => {
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-btn-ghost-well: var(--lux-btn-well)');
        expect(tokens).toContain('--lux-btn-ghost-label: var(--lux-btn-label)');
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-ghost-label: var\(--lux-text, #1d2633\)/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-ghost-shadow: var\(--lux-btn-frame-shadow\)/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-label: var\(--lux-text, #1d2633\)/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-ghost-well:\s*var\(--lux-btn-fade\),[\s\S]*linear-gradient\(180deg, #f5efe6 0%, #e8dfd0 100%\)/);
        expect(tokens).not.toMatch(/--lux-btn-ghost-well:[^;]*lux-soft-chrome-surface/);
        expect(tokens).not.toMatch(/--lux-btn-well:[^;]*#1a222c/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-fade:[\s\S]*rgba\(var\(--lux-accent-rgb\)/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-well:\s*var\(--lux-btn-fade\)/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*--lux-btn-frame-width:\s*3\.5px/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*--lux-btn-pill-radius:\s*0 22px 0 22px/);
        expect(tokens).toMatch(/:root\s*\{[\s\S]*--lux-btn-border-solid:/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-border-solid:/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-sheen:[\s\S]*0\.92/);
        expect(tokens).toMatch(/html\.lux-light-mode, body\.lux-light-mode[\s\S]*--lux-btn-frame-shadow:[\s\S]*40%/);
    });

    it('wires global ghost button styles to ghost tokens', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toMatch(/\.lux-ghost-btn\s*\{[\s\S]*var\(--lux-btn-ghost-well/);
        expect(controls).toMatch(/\.lux-ghost-btn\s*\{[\s\S]*var\(--lux-btn-ghost-label/);
        expect(controls).toMatch(/body\.lux-full-paint\.lux-unified-shell \.lux-ghost-btn[\s\S]*var\(--lux-btn-ghost-well/);
        expect(controls).toMatch(/\.lux-ghost-btn\s*\{[\s\S]*border-color:\s*var\(--lux-btn-border-solid/);
        expect(controls).toMatch(/\.lux-primary-btn\s*\{[\s\S]*background:\s*var\(--lux-btn-well\)/);
        expect(controls).not.toMatch(/\.lux-primary-btn\s*\{[\s\S]*background:\s*var\(--lux-btn-well\),\s*var\(--lux-btn-frame-metal\)/);
        expect(controls).toContain(':is(html.lux-light-mode, body.lux-light-mode) :is(.lux-primary-btn, .lux-secondary-btn, .lux-ghost-btn)');
        expect(controls).toMatch(/:is\(html\.lux-light-mode, body\.lux-light-mode\) :is\(\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn\)[\s\S]*text-shadow:\s*none/);
        expect(controls).toMatch(/:is\(html\.lux-light-mode, body\.lux-light-mode\) :is\(\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn\)::before[\s\S]*rgba\(255,\s*255,\s*255,\s*0\.55\)/);
    });
});
