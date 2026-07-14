import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social page create dialog regressions', () => {
    it('opens page creation in the overlay dialog instead of the inline wizard', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const css = readSource('assets/css/social-rebuild.css');

        const pagesModule = readSource('assets/js/pages/social-pages.js');
        expect((source + pagesModule)).toContain("if (action === 'page-create-open')");
        expect((source + pagesModule)).toContain("openDialog('page-create')");
        expect(readSource('assets/js/pages/social-pages.js')).toContain("if (kind === 'page-create')");
        expect(source).toContain('function renderPageCreateDialog(');
        expect(pagesModule).toContain('function renderPageCreateDialog(');
        expect(pagesModule).toContain('data-action="page-create-open"');
        expect(pagesModule).toContain('data-form="create-page"');
        expect(source).not.toContain('data-action="page-wizard-open"');

        const panelBlock = pagesModule.match(/function renderPagesPanel\(\)[\s\S]*?(?=\n    window\.render|\n\}\)\(\);)/)?.[0]
            || pagesModule.match(/function renderPagesPanel\(\)[\s\S]*/)?.[0]
            || '';
        expect(panelBlock).toContain('function renderPagesPanel()');
        expect(panelBlock).not.toContain('renderPageWizard()');
        expect(panelBlock).not.toContain('pageWizardOpen');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('pageCreateDialogReasons');
        expect((source + readSource('assets/js/pages/social-pages.js'))).toMatch(/if \(formType === 'create-page'\)[\s\S]*?closeDialog\(\)/);
        expect(css).toContain('.social-neo-dialog-card--page-create');
    });

    it('wires page create glass shell into transparency token pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const css = readSource('assets/css/social-rebuild.css');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = source.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(css).toMatch(/--page-create-surface/);
        const pageCreateShell = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--page-create[\s\S]*?\n\}/
        )?.[0] || '';
        expect(pageCreateShell).toMatch(/--page-create-/);
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--page-create[\s\S]*?backdrop-filter:\s*var\(--page-create-blur\)/
        );

        const pageCreateWizardBlock = css.match(
            /#social-neo-overlay-portal \.social-neo-dialog-card--page-create[\s\S]*?social-neo-pages-wizard-step[\s\S]*?\}/
        )?.[0] || '';
        expect(pageCreateWizardBlock).toMatch(/--page-create-section/);

        expect(utilitiesJs).toContain('SOCIAL_GLASS_EXEMPT_CREATE_DIALOG_SELECTORS');
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--page-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--page-create'");

        expect(scheduleRefresh).toContain("'page-create'");
        expect(scheduleRefresh).toContain("'survey-create'");
    });

    it('defines light-mode polish for page create glass shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const socialHtml = readSource('social.html');

        const lightTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--page-create \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(lightTokens).toContain('--page-create-section: rgba(255, 255, 255, 0.42)');
        expect(lightTokens).toContain('--page-create-input: rgba(255, 255, 255, 0.52)');
        expect(lightTokens).toContain('--page-create-border: rgba(77, 52, 31, 0.12)');
        expect(lightTokens).toContain('radial-gradient(circle at 8% 0%');
        expect(lightTokens).toContain('linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(247, 241, 232, 0.44))');
        expect(lightTokens).toContain('--page-create-blur: blur(26px) saturate(155%)');

        const lightShellBlocks = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--page-create \{[\s\S]*?\n\}/g
        ) || [];
        const lightShell = lightShellBlocks.find((block) => block.includes('backdrop-filter: var(--page-create-blur)')) || '';
        expect(lightShell).toContain('backdrop-filter: var(--page-create-blur)');
        expect(lightShell).toContain('-webkit-backdrop-filter: var(--page-create-blur)');
        expect(lightShell).toMatch(
            /0 24px 56px rgba\(73, 48, 25, 0\.12\)[\s\S]*?inset 0 1px 0 rgba\(255, 255, 255, 0\.62\)/
        );
        expect(lightShell).toContain('color: var(--lux-text)');

        const pageCreateLightBlock = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--page-create[\s\S]*?\/\* Portal-scoped lost-found create inner overrides/
        )?.[0] || '';
        expect(pageCreateLightBlock).not.toContain('rgba(15, 23, 42');

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-backdrop:has\(> \.social-neo-dialog-card--page-create\)[\s\S]*?rgba\(73, 48, 25, 0\.20\)/
        );

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--page-create \.social-neo-dialog-cancel-btn[\s\S]*?var\(--page-create-input\)/
        );

        expect(css).toContain(
            '.social-neo-dialog-card:not(.social-neo-dialog-card--page-create):not(.social-neo-dialog-card--event-create):not(.social-neo-dialog-card--survey-create):not(.social-neo-dialog-card--lost-found-create):not(.social-neo-dialog-card--project-create):not(.social-neo-dialog-card--post-compose):not(.social-neo-dialog-card--project-task-create):not(.social-neo-dialog-card--group-create):not(.social-neo-dialog-card--project-health):not(.social-neo-dialog-card--project-risk):not(.social-neo-dialog-card--social-glass):not(.social-neo-dialog-card--portfolio-editor):not(.social-neo-dialog-card--portfolio-custom):not(.social-neo-dialog-card--panel):not(.social-neo-dialog-card--comments)'
        );
        expect(css).toContain(
            '.social-neo-dialog-card--lms-create:not(.social-neo-dialog-card--page-create):not(.social-neo-dialog-card--event-create):not(.social-neo-dialog-card--survey-create):not(.social-neo-dialog-card--lost-found-create):not(.social-neo-dialog-card--project-create):not(.social-neo-dialog-card--post-compose):not(.social-neo-dialog-card--project-task-create):not(.social-neo-dialog-card--group-create):not(.social-neo-dialog-card--project-health):not(.social-neo-dialog-card--project-risk):not(.social-neo-dialog-card--social-glass):not(.social-neo-dialog-card--panel)'
        );
                const cancelTransparentBlock = css.match(
            /body\.lux-route-social \.social-neo-dialog-card--portfolio-create \.social-neo-dialog-cancel-btn,[\s\S]*?box-shadow: none !important;\n\}/
        )?.[0] || '';
        expect(cancelTransparentBlock).not.toContain('page-create');
    });

    it('adds depth polish for light page create shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const scope = 'html body\\.lux-light-mode\\.lux-route-social #social-neo-overlay-portal \\.social-neo-dialog-card--page-create';

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-pages-wizard-step[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-pages-wizard-step\\.is-active[\\s\\S]*?0 0 0 3px rgba\\(var\\(--sn-accent-rgb\\), 0\\.12\\)[\\s\\S]*?rgba\\(var\\(--sn-accent-rgb\\), 0\\.45\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-input[\\s\\S]*?\\)[\\s\\S]*?background: var\\(--page-create-input\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-title i[\\s\\S]*?0 6px 18px rgba\\(var\\(--sn-accent-rgb\\), 0\\.45\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-btn-primary[\\s\\S]*?0 6px 20px rgba\\(var\\(--sn-accent-rgb\\), 0\\.4\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-head[\\s\\S]*?border-bottom: 1px solid rgba\\(48, 34, 22, 0\\.08\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-actions[\\s\\S]*?border-top: 1px solid rgba\\(48, 34, 22, 0\\.08\\)')
        );
    });
});