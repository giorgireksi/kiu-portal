import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LUX_CONTROLS_CSS_CACHE_BUST } from './fixtures/lux-droplist-contract.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux field CTA chrome', () => {
    it('defines shared field tokens in lux-tokens.css', () => {
        const tokens = readSource('assets/css/lux-tokens.css');

        expect(tokens).toContain('--lux-field-border-width: var(--lux-btn-frame-width, 3.5px)');
        expect(tokens).toContain('--lux-field-fill: var(--lux-btn-well-soft)');
        expect(tokens).toContain('--lux-field-shadow: var(--lux-btn-frame-shadow)');
        expect(tokens).toContain('--lux-field-focus-ring:');
    });

    it('styles .lux-control with CTA frame tokens', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toMatch(/\.lux-control\s*\{[\s\S]*?border-color:\s*var\(--lux-btn-border-solid/);
        expect(controls).toMatch(/\.lux-control\s*\{[\s\S]*?box-shadow:\s*var\(--lux-btn-frame-shadow\)/);
        expect(controls).toMatch(/\.lux-control\s*\{[\s\S]*?background:\s*var\(--lux-btn-well\)/);
        expect(controls).toMatch(/\.lux-control\s*\{[\s\S]*?border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(controls).toContain('input[type="search"].lux-control::-webkit-search-decoration');
        expect(controls).toMatch(/\.lux-control:focus-visible[\s\S]*?var\(--lux-btn-frame-shadow-hover\)/);
        expect(controls).toMatch(/\.lux-control:read-only[\s\S]*?var\(--lux-btn-well-soft\)/);
    });

    it('styles compact pickers with primary CTA chrome', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-color:\s*var\(--lux-btn-border-solid/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?background:\s*var\(--lux-btn-well\)/);
        expect(controls).toMatch(/\.lux-picker-btn--compact:focus-visible[\s\S]*?var\(--lux-btn-frame-shadow-hover\)/);
    });

    it('styles compact universal picker triggers like primary CTA buttons', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('.lux-picker-btn--compact');
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-radius:\s*var\(--lux-btn-pill-radius/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?border-color:\s*var\(--lux-btn-border-solid/);
        expect(controls).toMatch(/\.lux-picker-btn--compact\s*\{[\s\S]*?padding:\s*0 18px/);
        expect(controls).toContain('.lux-picker-field > .lux-picker-btn.lux-picker-btn--compact');
        expect(controls).toMatch(/\.lux-picker-btn--compact:hover[\s\S]*?translateY\(-2px\)/);
        expect(controls).toContain('.lux-picker-btn--compact::before');
        expect(controls).toContain('.lux-picker-btn--compact::after');
        expect(controls).not.toContain('.lux-picker-btn--field');
    });

    it('does not flatten .lux-control inside modal exempt subtrees', () => {
        const modals = readSource('assets/css/lux-modals.css');
        const luxControlExempt = modals.match(
            /\[data-lux-transparency-exempt="1"\] :is\(\s*\.lux-control[\s\S]*?\) \{[\s\S]*?\}/
        )?.[0] || '';

        expect(luxControlExempt).toContain('backdrop-filter: none');
        expect(luxControlExempt).not.toContain('var(--lux-modal-glass-input)');
        expect(luxControlExempt).not.toContain('var(--lux-modal-glass-border)');
        const controls = readSource('assets/css/lux-controls.css');
        expect(controls).toMatch(/\.lux-control:focus-visible[\s\S]*?var\(--lux-btn-frame-shadow-hover\)/);
    });

    it('wires lux-controls cache bust on representative routes', () => {
        const adminTools = readSource('admin-tools.html');
        const index = readSource('index.html');
        const registration = readSource('registration.html');
        const scheduler = readSource('admin-scheduler.html');
        const login = readSource('login.html');
        const serviceWorker = readSource('service-worker.js');

        expect(adminTools).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(index).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(registration).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(scheduler).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(login).toContain(`assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
        expect(serviceWorker).toContain(`/assets/css/lux-controls.css?v=${LUX_CONTROLS_CSS_CACHE_BUST}`);
    });

    it('centers the curriculum search icon on CTA field height', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/#admin-curriculum-search[\s\S]*?padding-left:\s*36px/);
        expect(bare).toMatch(
            /\.lux-admin-curriculum-search-wrap > i\s*\{[\s\S]*?bottom:\s*calc\(var\(--lux-field-min-height/
        );
    });
});
