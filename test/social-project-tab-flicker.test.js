import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social project tab flicker regressions', () => {
    it('wraps project tab body in a stable patch target', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const _wsClassic = readSource('assets/js/pages/social-workspace.js');
        const classicBlock = (() => { const a = _wsClassic.indexOf('function renderProjectsWorkspacePanelClassic'); const b = _wsClassic.indexOf('window.renderProjectsWorkspacePanelClassic =', a); return a >= 0 && b > a ? _wsClassic.slice(a, b) : ''; })();

        expect(classicBlock).toContain('id="social-project-tab-panel"');
        expect(classicBlock).toContain('data-project-tab="${escape(activeTab)}"');
        expect(classicBlock).toContain('renderProjectWorkspaceTabPanel = buildProjectTabMarkup');
    });

    it('patches project tabs with cached panes via replaceChildren', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('function patchProjectWorkspaceTab(runtime)');
        expect(source).toContain('function getOrCreateProjectTabPane(runtime, projectId, tabId)');
        expect(source).toContain('function clearProjectTabPaneCache(projectId = \'\')');
        expect(source).toContain('panel.replaceChildren(pane)');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/if \(patchProjectWorkspaceTab\(state\(\)\)\) return;/);
        expect(source).toContain('is-tab-switching');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/invalidateSocialRenderCache\(\{ center: true \}\);[\s\S]*renderSocialPageNow\('project-tab'\)/);
        // Tab state is assigned then surgically patched when possible.
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/state\(\)\.ui\.projectTab = requestedTab;[\s\S]*if \(patchProjectWorkspaceTab\(state\(\)\)\) return;/);
    });

    it('uses fastPath for project tab and mutation reasons', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/fastPath[\s\S]*project-\|projects-back/);
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("'project-settings-saved'");
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("'project-budget-settings-saved'");
    });

    it('keeps workspace center intact when opening overlay dialogs', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('WORKSPACE_DIALOG_KEEP_CENTER');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("'project-settings'");
        expect(source).toContain('function renderDialogOnlyNow()');
        expect(source).toMatch(/workspaceDialogKeepsCenter\(type\)[\s\S]*renderDialogOnlyNow\(\)/);
        expect(source).toMatch(/workspaceDialogKeepsCenter\(closingType\)[\s\S]*renderDialogOnlyNow\(\)/);
        expect(readSource('assets/js/pages/social-render-plan.js')).toMatch(/WORKSPACE_DIALOG_KEEP_CENTER\.has\(text\(activeDialog\(\)\?\.type/);
    });

    it('skips luxury refresh on project-tab full renders and suppresses during patch', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect((source + readSource('assets/js/pages/social-workspace.js'))).toMatch(/skipTransparencyRefresh = reason === 'project-tab'/);
        expect(source).toMatch(/!skipTransparencyRefresh && typeof window\.queueHeavySurfaceObservationRefresh/);
        expect(source).toMatch(/!skipTransparencyRefresh[\s\S]{0,600}queueLuxuryTransparencyRefresh/);
        expect(source).toContain('window.__kiuSuppressLuxTransparencyRefresh = true');
        expect(utilities).toMatch(/function queueLuxuryTransparencyRefresh[\s\S]*__kiuSuppressLuxTransparencyRefresh/);
        expect(utilities).toMatch(/function refreshLuxuryTransparencySurfaces[\s\S]*__kiuSuppressLuxTransparencyRefresh/);
        expect(utilities).toMatch(/MutationObserver[\s\S]*__kiuSuppressLuxTransparencyRefresh/);
    });

    it('scopes project reveal animation to tab panel only', () => {
        const css = readSource('assets/css/social-rebuild.css');

        // Reveal animation is scoped to the tab panel via is-tab-reveal (switching suppresses).
        expect(css).toContain('.social-projects-shell.is-tab-reveal > #social-project-tab-panel');
        expect(css).toContain('.social-projects-shell.is-tab-switching > #social-project-tab-panel');
        expect(css).toContain('socialProjectReveal');
    });

    it('keeps project metric cards on CSS-managed glass', () => {
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(utilities).toMatch(/SOCIAL_FADE_CSS_MANAGED_CLASSES[\s\S]*'social-project-metric-card'/);
        expect(utilities).toMatch(/SOCIAL_FADE_CSS_MANAGED_CLASSES[\s\S]*'social-project-ring-card'/);
    });

    it('syncs render signature after tab patch and clears pane cache on project navigation', () => {
        const source = readSource('assets/js/pages/social-page.js');

        expect(source).toContain('host.__kiuLastRenderSignature = buildSocialRenderSignature');
        expect(source + readSource('assets/js/pages/social-workspace.js')).toMatch(/action === 'projects-back'[\s\S]*clearProjectTabPaneCache/);
        expect(source + readSource('assets/js/pages/social-workspace.js')).toMatch(/action === 'project-open'[\s\S]*clearProjectTabPaneCache/);
        expect(source).toMatch(/project-\(settings-saved[\s\S]*clearProjectTabPaneCache/);
    });
});
