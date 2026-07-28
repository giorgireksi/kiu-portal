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
        expect(panel).toContain('social-project-hub-rail-card lux-soft-chrome');
        expect(panel).toContain('lms-route-meta-12');

        expect(bare).toContain('.social-project-hub-layout {');
        expect(bare).toContain('.social-neo-workspace-hub-section');
        expect(bare).toContain('.social-project-hub-main-head strong {');
    });
});
