import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social light mode token single source of truth', () => {
    const socialCss = readSource('assets/css/social-rebuild.css');
    const utilitiesJs = readSource('assets/js/shared/utilities.js');
    const themePrimerJs = readSource('assets/js/theme-primer.js');

    it('does not reintroduce sn-alpha floor overrides on route body', () => {
        expect(socialCss).not.toMatch(/--sn-alpha:\s*max\(0\.74/);
        // Light-mode token flip on body.lux-light-mode.lux-route-social is intentional SSOT.
        expect(socialCss).toMatch(/body\.lux-light-mode\.lux-route-social/);
        expect(socialCss).toContain('--social-fade-surface:');
    });

    it('keeps primer high-transparency painters off lux-route-social', () => {
        expect(themePrimerJs).toContain('body.lux-light-mode:not(.lux-route-social)');
        expect(themePrimerJs).toContain('body:not(.lux-light-mode):not(.lux-route-social)');
    });

    it('scopes LMS create tokens to overlay portal only', () => {
        expect(socialCss).toContain('#social-neo-overlay-portal .social-neo-dialog-card--lms-create');
        expect(socialCss).toContain('--lms-create-surface');
        expect(socialCss).toContain('body.lux-route-social .social-neo-dialog-card--lms-create');
        expect(socialCss).toContain('--lms-create-glass-surface');
    });

    it('restores light colorFadeRatio floor in transparency model', () => {
        const indexLuxury = readSource('assets/js/features/index-luxury.js');
        expect(indexLuxury).toMatch(
            /colorFadeRatio = lightMode\s*\?\s*Math\.max\(0\.40, Math\.min\(1, fillRatio \* 0\.92\)\)/
        );
        // asd10 design port: lightMode comes from body class / index-luxury model
        expect(indexLuxury).toMatch(/lightMode/);
    });

    it('bumps social route assets to unified lightmode restore cache', () => {
        const socialHtml = readSource('social.html');
        expect(socialHtml).toContain('social-rebuild.css?v=20260713-accentborder2');
        expect(socialHtml).toContain('utilities.js?v=20260713-accentborder3');
        expect(socialHtml).toContain('social-page.js?v=20260713-groups-detail9');
    });
});