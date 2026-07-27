import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lux-checkbox-control.test', () => {
    it('defines shared checkbox primitives in lux-controls.css', () => {
        const controls = readSource('assets/css/lux-controls.css');

        expect(controls).toContain('.lux-checkbox-row');
        expect(controls).toContain(':is(.lux-checkbox, .social-neo-checkbox)');
        expect(controls).toContain('.lux-checkbox--chip');
        expect(controls).toMatch(/:is\(\.lux-checkbox, \.social-neo-checkbox\) input\[type="checkbox"\][\s\S]*?opacity:\s*0/);
        expect(controls).toMatch(/:is\(\.lux-checkbox, \.social-neo-checkbox\)::before[\s\S]*?width:\s*18px/);
        expect(controls).toMatch(/:has\(input\[type="checkbox"\]:checked\)::before[\s\S]*?var\(--lux-accent\)/);
        expect(controls).toMatch(/:has\(input\[type="checkbox"\]:focus-visible\)[\s\S]*?var\(--lux-field-focus-ring\)/);
        expect(controls).toMatch(/\.lux-checkbox--chip:has\(input\[type="checkbox"\]:checked\)[\s\S]*?rgba\(var\(--lux-accent-rgb\)/);
    });

    it('does not paint checkboxes inside lux-modals.css', () => {
        const modals = readSource('assets/css/lux-modals.css');

        expect(modals).not.toMatch(/\.social-neo-checkbox\s*\{/);
        expect(modals).not.toMatch(/\.lux-checkbox\s*\{/);
    });

    it('event-create toggle row keeps section chrome only in lux-modals.css', () => {
        const modals = readSource('assets/css/lux-modals.css');

        expect(modals).toContain('[data-lux-transparency-exempt="1"] .lux-glass-dialog-card--event-create');
        expect(modals).toContain('--event-create-section');
        expect(modals).toContain('.social-neo-events-toggle-row');
        expect(modals).toMatch(/#kiu-subject-builder-modal > \.lux-glass-dialog-card[\s\S]*max-width:\s*560px/);
        expect(modals).not.toContain('#kiu-subject-builder-modal > .lux-glass-dialog-card--event-create');
    });
});
