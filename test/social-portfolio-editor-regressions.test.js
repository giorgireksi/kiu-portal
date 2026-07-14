import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social portfolio editor regressions', () => {
    it('keeps the my portfolio editor tab and publish cards wired in social-page', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');
        const css = readSource('assets/css/portfolio-editor.css');

        expect(source).toContain("state().ui.portfolioPanelTab = 'mine'");
        expect(source).toContain('renderMyPortfolioPanel');
        expect(source).toContain('hydrateMyPortfolioDocument');
        expect(source).toContain('renderPortfolioEditorDialog');
        expect(readSource('assets/js/portfolio/portfolio-editor.js')).toContain('data-action="portfolio-custom-open"');
        expect(readSource('assets/js/portfolio/portfolio-publish.js')).toContain('data-action="portfolio-publish-visibility"');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("action === 'portfolio-custom-open'");
        expect(source).toContain('portfolioCollectDocumentFromUi');
        // Discover merge lives with portfolio data layer in workspace module
        expect(readSource('assets/js/pages/social-workspace.js')).toContain('KiuPortfolioModel.mergeDiscoverEntries');

        expect(html).toContain('assets/js/portfolio/portfolio-editor.js');
        expect(html).toContain('assets/css/portfolio-editor.css');
        expect(css).toContain('.portfolio-audience-card');
    });

    it('wires portfolio editor glass shell into transparency token pipeline', () => {
        const socialPageJs = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const css = readSource('assets/css/portfolio-editor.css');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = socialPageJs.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';
        const workspaceModule = readSource('assets/js/pages/social-workspace.js');
        const portfolioEditorDialog = (() => {
            const re = /function renderPortfolioEditorDialog\(\) \{[\s\S]*?\n    \}/g;
            let best = '';
            let m;
            const combined = `${socialPageJs}\n${workspaceModule}`;
            while ((m = re.exec(combined)) !== null) {
                if (m[0].length > best.length) best = m[0];
            }
            return best;
        })();

        expect(portfolioEditorDialog).toContain('social-neo-dialog-card--portfolio-editor');
        expect(portfolioEditorDialog).toContain('data-lux-transparency-exempt="1"');
        expect(readSource('assets/js/portfolio/portfolio-custom-builder.js')).toContain(
            'social-neo-dialog-card--portfolio-custom'
        );
        expect(readSource('assets/js/portfolio/portfolio-custom-builder.js')).toContain(
            'data-lux-transparency-exempt="1"'
        );

        expect(utilitiesJs).toContain('SOCIAL_GLASS_EXEMPT_CREATE_DIALOG_SELECTORS');
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--portfolio-editor'");
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--portfolio-custom'");
        expect(utilitiesJs).toContain("el.closest?.('[data-lux-transparency-exempt=\"1\"]')");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--portfolio-editor'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--portfolio-custom'");

        expect(scheduleRefresh).toContain("'portfolio-editor'");
        expect(scheduleRefresh).toContain("'page-create'");
        expect(scheduleRefresh).toContain("'survey-create'");

        expect(css).toContain('.social-neo-dialog-card--portfolio-editor');
        expect(readSource('social.html')).toContain('portfolio-editor.css?v=20260710-asd10-social3');
    });

    it('defines light-mode polish for portfolio editor glass shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const socialHtml = readSource('social.html');

        expect(css).toMatch(/--portfolio-editor-surface/);
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--portfolio-editor[\s\S]*?backdrop-filter:\s*var\(--portfolio-editor-blur\)/
        );

        const lightTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--portfolio-editor,[\s\S]*?--portfolio-editor-blur: blur\(26px\) saturate\(155%\);/
        )?.[0] || '';
        expect(lightTokens).toContain('--portfolio-editor-section: rgba(255, 255, 255, 0.42)');
        expect(lightTokens).toContain('--portfolio-editor-input: rgba(255, 255, 255, 0.52)');
        expect(lightTokens).toContain('--portfolio-editor-blur: blur(26px) saturate(155%)');
        expect(lightTokens).toContain('radial-gradient(circle at 8% 0%');

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-backdrop:has\(> \.social-neo-dialog-card--portfolio-editor\)[\s\S]*?rgba\(73, 48, 25, 0\.20\)/
        );

        expect(css).toContain(
            '.social-neo-dialog-card:not(.social-neo-dialog-card--page-create):not(.social-neo-dialog-card--event-create):not(.social-neo-dialog-card--survey-create):not(.social-neo-dialog-card--lost-found-create):not(.social-neo-dialog-card--project-create):not(.social-neo-dialog-card--post-compose):not(.social-neo-dialog-card--project-task-create):not(.social-neo-dialog-card--group-create):not(.social-neo-dialog-card--project-health):not(.social-neo-dialog-card--project-risk):not(.social-neo-dialog-card--social-glass):not(.social-neo-dialog-card--portfolio-editor):not(.social-neo-dialog-card--portfolio-custom):not(.social-neo-dialog-card--panel):not(.social-neo-dialog-card--comments)'
        );

                expect(socialHtml).toContain('portfolio-editor.css?v=20260710-asd10-social3');
    });

    it('adds depth polish for light portfolio editor shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const scope = 'html body\\.lux-light-mode\\.lux-route-social #social-neo-overlay-portal \\.social-neo-dialog-card--portfolio-editor';

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?portfolio-section-card[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?portfolio-audience-card[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-close-btn[\\s\\S]*?var\\(--portfolio-editor-input\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-btn-primary[\\s\\S]*?0 6px 20px rgba\\(var\\(--sn-accent-rgb\\), 0\\.4\\)')
        );
    });

    it('scopes portfolio editor button styles to overlay portal', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        const layoutCss = readSource('assets/css/portfolio-editor.css');
        const html = readSource('social.html');

        expect(socialCss).toContain(
            '#social-neo-overlay-portal .social-neo-dialog-card--portfolio-editor .social-neo-btn-ghost'
        );
        expect(socialCss).toContain('var(--portfolio-editor-input)');
        expect(socialCss).toContain('[data-action="portfolio-entry-remove"]');
        expect(socialCss).toContain(
            '#social-neo-overlay-portal .social-neo-dialog-card--portfolio-custom .social-neo-btn-ghost'
        );

        expect(layoutCss).toContain('.portfolio-section-body .social-neo-btn');
        expect(layoutCss).toContain('justify-self: start');

        expect(html).toContain('social-rebuild.css');
        expect(html).toContain('portfolio-editor.css');
    });

    it('exposes portfolio routes and bootstrap portfolios in backend', () => {
        const routes = readSource('backend/platform/routes/social-routes.js');
        const stateService = readSource('backend/platform/domains/social-state-service.js');
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');

        expect(routes).toContain('/api/social/portfolio/me');
        expect(routes).toContain('/api/social/portfolio/me/publish');
        expect(routes).toContain('/api/social/portfolio/discover');
        expect(stateService).toContain('portfolios');
        expect(runtime).toContain('portfolios: Array.isArray(social?.portfolios)');
    });

    it('avoids full-page re-render flicker in portfolio editor interactions', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const editorJs = readSource('assets/js/portfolio/portfolio-editor.js');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('portfolioEditorDialogReasons');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain("'portfolio-editor' && /^portfolio-/.test(reason)");
        expect(source).toContain('function patchPortfolioSectionToggle');
        expect(source).toContain('function patchPortfolioPublishVisibility');
        expect(source).toContain('function patchPortfolioSection');
        expect(source).toContain('function syncPortfolioEditorInput');
        expect(source).toContain('function capturePortfolioEditorSnapshot');
        expect(source).toContain('function restorePortfolioEditorSnapshot');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('if (patchPortfolioSectionToggle(sectionKey)) return');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('if (patchPortfolioSection(sectionKey)) return');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('if (patchPortfolioPublishVisibility(state().ui.publishVisibility)) return');
        expect((source + readSource('assets/js/pages/social-workspace.js'))).toContain('if (syncPortfolioEditorInput()) return');
        expect(source).toContain('portfolioEditorFormRoot');
        expect(editorJs).toContain('renderSection');
    });
});