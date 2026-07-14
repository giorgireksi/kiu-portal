import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social event create dialog regressions', () => {
    it('opens event creation in the overlay dialog instead of the inline composer', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const eventsModule = readSource('assets/js/pages/social-events.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect((source + eventsModule)).toContain("if (action === 'event-create-open')");
        expect((source + eventsModule)).toContain("openDialog('event-create'");
        expect(readSource('assets/js/pages/social-events.js')).toContain("if (kind === 'event-create')");
        expect(source).toContain('function renderEventCreateDialog(');
        expect(eventsModule).toContain('function renderEventCreateDialog(');
        expect(eventsModule).toContain('data-action="event-create-open"');
        expect(eventsModule).toContain('data-form="create-event"');
        expect(source).not.toContain('social-neo-events-compose-shell');
        expect(eventsModule).not.toContain('social-neo-events-compose-shell');

        const panelBlock = eventsModule.match(/function renderEventsPanel\(\)[\s\S]*?(?=\n    function |\n    window\.)/)?.[0] || '';
        expect(panelBlock).toContain('function renderEventsPanel()');
        expect(panelBlock).not.toContain('social-neo-events-compose-shell');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('eventCreateDialogReasons');
        expect((source + eventsModule)).toMatch(/if \(formType === 'create-event'\)[\s\S]*?closeDialog\(\)/);
        expect(css).toContain('.social-neo-dialog-card--event-create');
    });

    it('wires event create glass shell into transparency token pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const css = readSource('assets/css/social-rebuild.css');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = source.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(css).toMatch(/--event-create-surface/);
        const eventCreateShell = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--event-create[\s\S]*?\n\}/
        )?.[0] || '';
        expect(eventCreateShell).toMatch(/--event-create-/);
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--event-create[\s\S]*?backdrop-filter:\s*var\(--event-create-blur\)/
        );

        const eventCreateInnerBlock = css.match(
            /#social-neo-overlay-portal \.social-neo-dialog-card--event-create[\s\S]*?social-neo-events-toggle-row[\s\S]*?\}/
        )?.[0] || '';
        expect(eventCreateInnerBlock).toMatch(/--event-create-section/);

        expect(utilitiesJs).toContain('SOCIAL_GLASS_EXEMPT_CREATE_DIALOG_SELECTORS');
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--event-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--event-create'");

        expect(scheduleRefresh).toContain("'event-create'");
    });

    it('defines light-mode polish for event create glass shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const socialHtml = readSource('social.html');

        const lightTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--event-create \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(lightTokens).toContain('--event-create-section: rgba(255, 255, 255, 0.42)');
        expect(lightTokens).toContain('--event-create-input: rgba(255, 255, 255, 0.52)');
        expect(lightTokens).toContain('--event-create-border: rgba(77, 52, 31, 0.12)');
        expect(lightTokens).toContain('radial-gradient(circle at 8% 0%');
        expect(lightTokens).toContain('linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(247, 241, 232, 0.44))');
        expect(lightTokens).toContain('--event-create-blur: blur(26px) saturate(155%)');

        const lightShellBlocks = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--event-create \{[\s\S]*?\n\}/g
        ) || [];
        const lightShell = lightShellBlocks.find((block) => block.includes('backdrop-filter: var(--event-create-blur)')) || '';
        expect(lightShell).toContain('backdrop-filter: var(--event-create-blur)');
        expect(lightShell).toContain('-webkit-backdrop-filter: var(--event-create-blur)');
        expect(lightShell).toMatch(
            /0 24px 56px rgba\(73, 48, 25, 0\.12\)[\s\S]*?inset 0 1px 0 rgba\(255, 255, 255, 0\.62\)/
        );
        expect(lightShell).toContain('color: var(--lux-text)');

        const eventCreateLightBlock = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--event-create[\s\S]*?\/\* Portal-scoped lost-found create inner overrides/
        )?.[0] || '';
        expect(eventCreateLightBlock).not.toContain('rgba(15, 23, 42');

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-backdrop:has\(> \.social-neo-dialog-card--event-create\)[\s\S]*?rgba\(73, 48, 25, 0\.20\)/
        );

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--event-create \.social-neo-dialog-cancel-btn[\s\S]*?var\(--event-create-input\)/
        );

        expect(css).toContain(
            '.social-neo-dialog-card:not(.social-neo-dialog-card--page-create):not(.social-neo-dialog-card--event-create):not(.social-neo-dialog-card--survey-create):not(.social-neo-dialog-card--lost-found-create):not(.social-neo-dialog-card--project-create):not(.social-neo-dialog-card--post-compose):not(.social-neo-dialog-card--project-task-create):not(.social-neo-dialog-card--group-create):not(.social-neo-dialog-card--project-health):not(.social-neo-dialog-card--project-risk):not(.social-neo-dialog-card--social-glass):not(.social-neo-dialog-card--portfolio-editor):not(.social-neo-dialog-card--portfolio-custom):not(.social-neo-dialog-card--panel):not(.social-neo-dialog-card--comments)'
        );
        expect(css).toContain(
            '.social-neo-dialog-card--lms-create:not(.social-neo-dialog-card--page-create):not(.social-neo-dialog-card--event-create):not(.social-neo-dialog-card--survey-create):not(.social-neo-dialog-card--lost-found-create):not(.social-neo-dialog-card--project-create):not(.social-neo-dialog-card--post-compose):not(.social-neo-dialog-card--project-task-create):not(.social-neo-dialog-card--group-create):not(.social-neo-dialog-card--project-health):not(.social-neo-dialog-card--project-risk):not(.social-neo-dialog-card--social-glass):not(.social-neo-dialog-card--panel)'
        );
                const glassTokenBlock = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--lms-create:is\([\s\S]*?\) \{[\s\S]*?--lms-create-glass-surface/
        )?.[0] || '';
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--event-create');
    });

    it('adds depth polish for light event create shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const scope = 'html body\\.lux-light-mode\\.lux-route-social #social-neo-overlay-portal \\.social-neo-dialog-card--event-create';

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-events-toggle-row[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-input[\\s\\S]*?\\)[\\s\\S]*?background: var\\(--event-create-input\\)')
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