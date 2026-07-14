import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social workspace nav sidebar', () => {
    it('keeps a persistent desktop workspace sidebar mounted on boot', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(source).toContain('function renderShellWorkspaceNav(activePanel)');
        expect(source).toMatch(/function renderShellWorkspaceNav\(activePanel\)[\s\S]*<aside class="social-neo-workspace-nav"/);
        expect(source).not.toMatch(/function renderShellWorkspaceNav\(activePanel\)[\s\S]*social-neo-workspace-nav-toggle/);
        expect(source).toContain('if (!forceCenterOnly) {');
        expect(source).toContain('setSocialRegionMarkup(shell.workspaceNav, renderShellWorkspaceNav(activePanel));');
        expect(source).not.toMatch(/if \(!workspaceNavOpen && reason !== 'workspace-nav-open'\) plan\.workspaceNav = false/);
        expect(source).toContain('workspaceNav: true');

        expect(css).toContain('#social-neo-workspace-nav-region');
        expect(css).toMatch(/@media \(min-width: 1181px\)[\s\S]*\.social-neo-shell[\s\S]*grid-template-columns:\s*minmax\(220px,\s*260px\)\s+minmax\(0,\s*1fr\)/);
        expect(css).toMatch(/@media \(min-width: 1181px\)[\s\S]*#social-neo-workspace-nav-region[\s\S]*position:\s*static/);
        // Region stays static; only the reveal chip is fixed when collapsed.
        expect(css).toMatch(/#social-neo-workspace-nav-region\s*\{[^}]*position:\s*static/);
        expect(css).toMatch(/@media \(max-width: 1180px\)[\s\S]*\.social-neo-workspace-nav[\s\S]*display:\s*none/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\.social-neo-shell[\s\S]*grid-template-columns:\s*minmax\(220px,\s*260px\)\s+minmax\(0,\s*1fr\)/);
    });

    it('supports desktop hide/show for workspace nav across sections', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect(source).toContain("KIU_SOCIAL_WORKSPACE_NAV_COLLAPSED");
        expect(source).toContain('function setWorkspaceNavCollapsed(');
        expect(source).toContain('function syncWorkspaceNavCollapsedClass(');
        expect(source).toContain('data-action="workspace-nav-collapse"');
        expect(source).toContain('data-action="workspace-nav-expand"');
        expect(source).toContain("action === 'workspace-nav-collapse'");
        expect(source).toContain("action === 'workspace-nav-expand'");
        expect(source).toContain('Boolean(ui.workspaceNavCollapsed)');
        expect(source).toContain('social-neo-workspace-nav-collapsed');
        expect(source).toContain('social-neo-workspace-rail-reveal');

        expect(css).toContain('social-neo-workspace-nav-collapsed');
        expect(css).toContain('.social-neo-workspace-rail-reveal');
        expect(css).toContain('.social-neo-workspace-nav-collapse-btn');
    });
});
