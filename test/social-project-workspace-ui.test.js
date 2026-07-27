import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-workspace-ui.test', () => {
    it('project workspace tabs use lux-secondary-btn hero-grid pattern', () => {
        const panel = readSource('assets/js/pages/social-workspace-panel.js');

        expect(panel).toContain('lux-secondary-btn social-project-hero-tab');
        expect(panel).toContain('social-project-hero-tab-icon');
        expect(panel).toContain('social-project-hero-tab-copy');
        expect(panel).toContain('social-project-hero-grid social-project-tab-row social-project-tab-row-rich');
        expect(panel).not.toContain('social-project-tab-pill');
        expect(panel).not.toContain('social-project-tab-shell');
    });

    it('tab runtime targets hero-tab selectors', () => {
        const runtime = readSource('assets/js/pages/social-workspace-tab-runtime.js');

        expect(runtime).toContain('.social-project-hero-tab[data-project-tab]');
        expect(runtime).toContain("pill.classList.toggle('is-focused', isActive)");
        expect(runtime).not.toContain('.social-project-tab-pill');
    });

    it('bare-lite includes project workspace paint hooks', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(bare).toContain('.social-project-metric-card::before');
        expect(bare).toContain('.social-project-detail-hero-rich::after');
        expect(bare).toContain('.social-project-hero-grid');
        expect(bare).not.toMatch(/button\.social-project-tab-pill/);
    });
});
