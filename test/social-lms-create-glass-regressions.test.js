import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social lms create glass regressions', () => {
    it('defines shared lms create glass tokens on photography upload shell only', () => {
        const rebuildCss = readSource('assets/css/social-rebuild.css');
        const glassTokenBlock = rebuildCss.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-neo-dialog-card--lms-create:is\([\s\S]*?\) \{[\s\S]*?--lms-create-glass-surface/
        )?.[0] || '';

        expect(rebuildCss).toContain('--lms-create-glass-surface');
        expect(rebuildCss).toContain('--lms-create-glass-section');
        expect(rebuildCss).toContain('--lms-create-glass-input');
        expect(rebuildCss).toContain('--lms-create-glass-border');
        expect(rebuildCss).toContain('--lms-create-glass-blur');
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--event-create');
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--survey-create');
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--project-create');
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--group-create');
        expect(glassTokenBlock).not.toContain('.social-neo-dialog-card--lost-found-create');
        expect(glassTokenBlock).toContain('.social-photo-upload-card');
        expect(rebuildCss).toMatch(
            /backdrop-filter:\s*var\(--lms-create-glass-blur\)/
        );
        expect(rebuildCss).toMatch(
            /#social-neo-overlay-portal:has\(\.social-photo-upload-card\) \.social-neo-dialog-backdrop[\s\S]*backdrop-filter:\s*blur\(12px\)/
        );
    });

    it('wires lms create dialogs into transparency token pipeline', () => {
        const socialPageJs = readSource('assets/js/pages/social-page.js');
        const utilitiesJs = readSource('assets/js/shared/utilities.js');
        const managedBlock = utilitiesJs.match(/const SOCIAL_FADE_CSS_MANAGED_CLASSES = new Set\(\[[\s\S]*?\]\);/)?.[0] || '';
        const scheduleRefresh = socialPageJs.match(
            /function scheduleSocialOverlayTransparencyRefresh\(\) \{[\s\S]*?\n    \}/
        )?.[0] || '';

        expect(utilitiesJs).toContain('SOCIAL_GLASS_EXEMPT_CREATE_DIALOG_SELECTORS');
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--event-create'");
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--project-create'");
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--group-create'");
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--project-health'");
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--project-risk'");
        expect(utilitiesJs).toContain("'.social-neo-dialog-card--lost-found-create'");
        expect(utilitiesJs).toContain("'.social-photo-upload-card'");

        expect(managedBlock).not.toContain("'social-neo-dialog-card--event-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--project-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--group-create'");
        expect(managedBlock).not.toContain("'social-neo-dialog-card--lost-found-create'");
        expect(managedBlock).not.toContain("'social-photo-upload-card'");

        expect(scheduleRefresh).toContain("'event-create'");
        expect(scheduleRefresh).toContain("'project-create'");
        expect(scheduleRefresh).toContain("'group-create'");
        expect(scheduleRefresh).toContain("'project-health'");
        expect(scheduleRefresh).toContain("'project-risk'");
        expect(scheduleRefresh).toContain("'lost-found-create'");
        expect(scheduleRefresh).toContain("'photography-upload'");
    });

    it('keeps photography upload card off social-fade surface tokens', () => {
        const css = readSource('assets/css/social-photography-lms.css');
        const uploadCardRule = css.match(
            /body\.lux-route-social #social-neo-overlay-portal \.social-photo-upload-card\.photo-panel \{[\s\S]*?\n\}/
        )?.[0] || '';

        expect(uploadCardRule).toContain('--lms-create-glass-surface');
        expect(uploadCardRule).toContain('backdrop-filter: var(--lms-create-glass-blur)');
        expect(uploadCardRule).not.toContain('--social-fade-surface');
        expect(readSource('social.html')).toContain('social-photography-lms.css');
    });
});