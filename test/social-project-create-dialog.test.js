import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project create dialog regressions', () => {
    it('opens workspace creation in the overlay dialog instead of the legacy drawer', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');
        const html = readSource('social.html');

        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("if (action === 'project-create-open')");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("openDialog('project-create')");
        expect(readSource('assets/js/pages/social-workspace.js')).toContain("if (kind === 'project-create')");
        expect(source).toContain("createSocialWorkspaceStub('renderProjectCreateDialog'");
        expect(workspaceModule).toContain('function renderProjectCreateDialog(');
        expect(workspaceModule).toContain('data-form="create-project"');
        expect(workspaceModule).toContain('data-action="project-create-open"');
        expect(source).not.toContain("getElementById('project-create-drawer')");
        expect(source).not.toContain('project-create-close');

        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();
        expect(classicBlock).not.toContain('social-project-create-drawer');

        expect(source).toContain('closeDialog();');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/if \(formType === 'create-project'\)[\s\S]*?closeDialog\(\)/);

        expect(css).toContain('.social-neo-dialog-card--project-create');
        expect(css).toContain('.social-neo-dialog-project-create-section');
        expect(html).toContain('social-neo-overlay-portal');
        expect(html).toContain('social-neo-dialog-region');
    });

    it('keeps invite picker updates inside the open project-create dialog', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('projectCreateDialogReasons');
        expect(source + readSource('assets/js/pages/social-workspace.js')).toContain("'project-creator-member-add'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("'project-creator-member-remove'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('project-create-open|portfolio-create-open|project-creator-member-add|project-creator-member-remove');
        expect(source).toContain('queueProjectInviteSearchRefresh');
        expect(source).toContain('ui.projectInviteSelectedIds');
    });

    it('wires project create glass shell into transparency token pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const css = readSource('assets/css/social-rebuild.css');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = source.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(css).toMatch(/--project-create-surface/);
        expect(css).toContain('linear-gradient(180deg, rgba(14, 20, 33, 0.97), rgba(8, 12, 21, 0.95))');
        // Shared shell with post-compose via :is(...)
        expect(css).toMatch(
            /#social-neo-overlay-portal :is\(\.social-neo-dialog-card--project-create, \.social-neo-dialog-card--post-compose\)[\s\S]*?backdrop-filter:\s*var\(--project-create-blur\)/
        );
        expect(css).toMatch(
            /#social-neo-overlay-portal :is\(\.social-neo-dialog-card--project-create, \.social-neo-dialog-card--post-compose\)[\s\S]*?social-neo-dialog-invite/
        );
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--project-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--project-create'");
        expect(scheduleRefresh).toContain("'project-create'");
    });

    it('defines light-mode polish for project create glass shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const socialHtml = readSource('social.html');

        const lightTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal :is\(\.social-neo-dialog-card--project-create, \.social-neo-dialog-card--post-compose\) \{[\s\S]*?--project-create-blur: blur\(26px\) saturate\(155%\);/
        )?.[0] || '';
        expect(lightTokens).toContain('--project-create-section: rgba(255, 255, 255, 0.42)');
        expect(lightTokens).toContain('--project-create-blur: blur(26px) saturate(155%)');

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-backdrop:has\(> :is\(\.social-neo-dialog-card--project-create, \.social-neo-dialog-card--post-compose\)\)[\s\S]*?rgba\(73, 48, 25, 0\.20\)/
        );
                const glassTokenBlock = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--lms-create:is\([\s\S]*?\) \{[\s\S]*?--lms-create-glass-surface/
        )?.[0] || '';
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--project-create');
    });

    it('adds depth polish for light project create shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const scope = 'html body\\.lux-light-mode\\.lux-route-social #social-neo-overlay-portal :is\\(\\.social-neo-dialog-card--project-create, \\.social-neo-dialog-card--post-compose\\)';

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-dialog-project-create-section[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-dialog-invite[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-head[\\s\\S]*?border-bottom: 1px solid rgba\\(48, 34, 22, 0\\.08\\)')
        );
    });
});