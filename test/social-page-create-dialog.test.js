import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-page-create-dialog.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('page create dialog uses shared social-glass shell and wizard chrome', () => {
        const pages = readSource('assets/js/pages/social-pages.js');
        const modals = readSource('assets/css/lux-modals.css');
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        const createFormLine = pages.split('\n').find((line) => line.includes('data-form="create-page"') && line.includes('<form'));
        expect(createFormLine).toContain('lux-glass-dialog-card--social-glass');
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--social-glass \.social-neo-pages-wizard-step[\s\S]*background:\s*var\(--lux-modal-glass-section\)/
        );
        expect(modals).toMatch(
            /\.lux-glass-dialog-card--social-glass \.social-neo-pages-preview[\s\S]*background:\s*var\(--lux-modal-glass-section\)/
        );
        expect(transparency).not.toContain("'.social-neo-pages-wizard-step'");
    });
});
