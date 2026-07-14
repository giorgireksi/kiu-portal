import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social workspace hub merge regressions', () => {
    it('renders the workspace hub as one merged card with internal sections', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();

        expect(classicBlock).toContain('social-neo-workspace-shell--merged');
        expect(classicBlock).toContain('social-neo-workspace-hub-section');
        expect(classicBlock).toContain('sectionsHtml:');
        expect(classicBlock).toContain('social-project-hub-layout');
        expect(classicBlock).toContain('social-project-hub-filter-group');
        expect(classicBlock).toContain('social-project-hub-rail');
        expect(classicBlock).toContain('My Work');
        expect(classicBlock).not.toMatch(/sectionsHtml:[\s\S]*?<section class="social-neo-card">/);

        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        expect(source).toContain('function renderWorkspaceHero(');
        expect(workspaceModule).toContain('function renderWorkspaceHero(');
        expect(source).toContain('function renderSocialLuxHero(');
        // Workspace uses a dedicated hero (not generic heroFamily option).
        expect(workspaceModule).toContain('social-neo-workspace-hero');
        expect(workspaceModule).toContain('social-neo-workspace-hero-stats');
        expect(workspaceModule).toContain('metrics.sectionsHtml');
        expect(workspaceModule).toContain('data-action="project-create-open"');

        expect(css).toContain('.social-neo-workspace-shell--merged');
        expect(css).toContain('.social-neo-workspace-hub-section');
    });
});