import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-project-hub-structure (bare-shell era)', () => {
    it('social domain paint CSS removed; behavior tests deferred to JS modules', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
        expect(existsSync(join(process.cwd(), 'assets/css/social-projects-lms.css'))).toBe(false);
    });

    it('workspace hub uses shared lux controls and layout hooks', () => {
        const panel = readSource('assets/js/pages/social-workspace-panel.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(panel).toContain('name="projectDiscoverSearch"');
        expect(panel).toMatch(/class="lux-control"[^>]*name="projectDiscoverSearch"/);
        expect(panel).not.toMatch(/social-neo-input[^>]*name="projectDiscoverSearch"/);
        expect(panel).toContain('lux-universal-native-select');
        expect(panel).toContain('social-project-hub-rail-card lux-soft-chrome home-hover-chip');
        expect(panel).toContain('social-project-card-new home-hover-chip');
        expect(panel).toContain('social-project-metric-card lux-soft-chrome home-hover-chip');
        expect(panel).toContain('lms-route-meta-12');

        expect(bare).toContain('.social-project-hub-layout {');
        expect(bare).toContain('.social-neo-workspace-hub-section');
        expect(bare).toContain('.social-project-hub-main-head strong {');
        expect(bare).toContain('.social-project-card-new-title {');
        expect(bare).toContain('.social-project-card-new-progress-bar {');
        expect(bare).toContain('.social-project-row-title {');

        const hubBlockStart = bare.indexOf('/* Social: project hub cards & list */');
        expect(hubBlockStart).toBeGreaterThan(-1);
        const hubBlock = bare.slice(hubBlockStart, hubBlockStart + 4000);
        expect(hubBlock).not.toContain('--sn-bdr');
        expect(hubBlock).not.toContain('--sn-bg');

        expect(bare).toContain('.social-project-hub-grid .social-project-card-new-summary');
        expect(bare).toMatch(/\.social-project-hub-grid[\s\S]*?minmax\(168px/);
        expect(bare).toContain('.social-project-hub-grid .social-project-card-new-cta');
        expect(bare).toContain('.social-project-hub-grid .social-project-hub-cta-tile');
        expect(bare).toContain('minmax(140px, 1fr)');
    });
});
