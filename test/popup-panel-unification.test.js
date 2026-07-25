import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('popup panel unification', () => {
    it('routes shell popovers through panel SSOT', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        const droplist = readSource('assets/css/lux-droplist.css');

        expect(fouc).toMatch(/\.lux-utility-panel\s*\{[\s\S]*?var\(--lux-panel-surface\)/);
        expect(fouc).toMatch(/\.lux-user-menu\s*\{[\s\S]*?var\(--lux-panel-surface\)/);
        expect(droplist).toMatch(/\.lux-picker-panel\.lux-universal-picker-panel\.lux-droplist-panel[\s\S]*?backdrop-filter/);
    });

    it('retires legacy modal-content fill for warmglass SSOT', () => {
        const modals = readSource('assets/css/lux-modals.css');
        expect(modals).toMatch(/\.modal-content\s*\{[\s\S]*?var\(--lux-modal-glass-surface/);
        expect(modals).not.toMatch(/\.modal-content\s*\{[\s\S]*?rgba\(255,\s*255,\s*255,\s*0\.92\)/);
    });

    it('uses lux CTA paint directly in glass shells (no legacy aliases)', () => {
        const controls = readSource('assets/css/lux-controls.css');
        expect(controls).not.toMatch(/\.kiu-btn-blue\b/);
        expect(controls).not.toMatch(/\.social-neo-btn-/);
        expect(controls).toContain('.lux-primary-btn.lux-btn-danger');
    });

    it('shields glass-dialog overlays from transparency engine', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).toContain('.lms-glass-dialog-overlay, .lms-quiz-board-overlay, .gb-modal-overlay');
    });
});
