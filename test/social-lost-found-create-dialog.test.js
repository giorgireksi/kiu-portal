import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social lost-found create dialog regressions', () => {
    it('opens lost-and-found posting in the overlay dialog instead of the inline composer', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const moduleSource = readSource('assets/js/pages/social-lost-found.js');
        const css = readSource('assets/css/social-rebuild.css');

        expect((source + moduleSource)).toContain("if (action === 'lost-found-create-open')");
        expect((source + moduleSource)).toContain("openDialog('lost-found-create'");
        expect((source + moduleSource)).toContain("if (kind === 'lost-found-create')");
        expect(source).toContain('window.renderLostFoundCreateDialog');
        expect(source).not.toContain('lost-found-compose-toggle');

        // Create CTA + dialog markup live in extracted module.
        expect(moduleSource).toContain('data-action="lost-found-create-open"');
        expect(moduleSource).toContain('function renderLostFoundHero');
        expect(moduleSource).toContain('function renderLostFoundCreateDialog');
        expect(moduleSource).toContain('function renderLostFoundActionConfirmDialog');
        expect(moduleSource).toContain('window.renderLostFoundCreateDialog = renderLostFoundCreateDialog');
        expect(moduleSource).not.toContain('social-neo-lf-composer-card');
        expect(moduleSource).not.toContain('lost-found-compose-toggle');

        expect(readSource('assets/js/pages/social-render-plan.js')).toContain('lostFoundCreateDialogReasons');
        expect(source).not.toContain('name="lostFoundKind"');
        expect(source).not.toContain('name="lostFoundStatus"');
        expect(source).not.toContain('name="lostFoundScope"');
        expect(moduleSource).toContain('name="lostFoundExpiresAt"');
        expect(moduleSource).toContain('type="datetime-local"');
        expect(source).toContain('function pruneExpiredLostFoundItems');
        expect((source + moduleSource)).toMatch(/if \(formType === 'lost-found-item'\)[\s\S]*?closeDialog\(\)/);
        expect(css).toContain('.social-neo-dialog-card--lost-found-create');
    });

    it('wires lost-found create glass shell into transparency token pipeline', () => {
        const source = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const css = readSource('assets/css/social-rebuild.css');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = source.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(css).toMatch(/--lost-found-create-surface/);
        expect(css).toMatch(
            /#social-neo-overlay-portal \.social-neo-dialog-card--lost-found-create[\s\S]*?backdrop-filter:\s*var\(--lost-found-create-blur\)/
        );
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--lost-found-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--lost-found-create'");
        expect(scheduleRefresh).toContain("'lost-found-create'");
    });

    it('defines light-mode polish for lost-found create glass shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const socialHtml = readSource('social.html');

        const lightTokens = css.match(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--lost-found-create \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(lightTokens).toContain('--lost-found-create-section: rgba(255, 255, 255, 0.42)');
        expect(lightTokens).toContain('--lost-found-create-blur: blur(26px) saturate(155%)');

        expect(css).toMatch(
            /html body\.lux-light-mode\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-backdrop:has\(> \.social-neo-dialog-card--lost-found-create\)[\s\S]*?rgba\(73, 48, 25, 0\.20\)/
        );
                const glassTokenBlock = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--lms-create:is\([\s\S]*?\) \{[\s\S]*?--lms-create-glass-surface/
        )?.[0] || '';
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--lost-found-create');
    });

    it('adds depth polish for light lost-found create shell', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const scope = 'html body\\.lux-light-mode\\.lux-route-social #social-neo-overlay-portal \\.social-neo-dialog-card--lost-found-create';

        expect(css).toMatch(
            new RegExp(scope + ' :is\\([\\s\\S]*?social-neo-dialog-lost-found-create-section[\\s\\S]*?\\)[\\s\\S]*?0 4px 12px rgba\\(73, 48, 25, 0\\.06\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-head[\\s\\S]*?border-bottom: 1px solid rgba\\(48, 34, 22, 0\\.08\\)')
        );
        expect(css).toMatch(
            new RegExp(scope + ' \\.social-neo-dialog-actions[\\s\\S]*?border-top: 1px solid rgba\\(48, 34, 22, 0\\.08\\)')
        );
    });
});