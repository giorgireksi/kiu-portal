import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social route regressions', () => {
    it('keeps social glass tokens aligned with utilities and index-luxury dedupe', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const indexLuxury = readSource('assets/css/index-luxury.css');
        const html = readSource('social.html');

        expect(html).toContain('assets/css/social-rebuild.css?v=20260531-routeglass14');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260602-socialglass1');
        expect(html).toContain('assets/css/index-luxury.css?v=20260531-routeglass1');
        expect(html).toContain('lux-route-social');

        expect(css).toContain('--social-fade-surface');
        expect(css).toContain('--social-fade-surface-soft');
        expect(css).toContain('--social-fade-control');
        expect(css).toContain('--social-fade-chip');
        expect(css).toContain('--social-fade-row');
        expect(css).toContain('--social-fade-modal');
        expect(css).toContain('Panel shells');
        expect(css).toContain('background: var(--social-fade-surface) !important');
        expect(css).toContain('background: var(--social-fade-surface-soft) !important');
        expect(css).toContain('--sn-bg: var(--social-fade-surface)');
        expect(css).toContain('html.lux-high-transparency body.lux-route-social');

        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-social')");
        expect(utilitiesSource).toContain("el.classList.contains('social-neo-card')");
        expect(utilitiesSource).toContain('SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES');
        expect(utilitiesSource).not.toContain('if (isSocialSurface)');

        expect(indexLuxury).toContain(
            'body:not(.lux-light-mode):not(.lux-route-social) .social-neo-card'
        );
        expect(indexLuxury).toContain('Social glass SSoT: --social-fade-*');
        expect(indexLuxury).not.toMatch(
            /body\.lux-route-social #page-social \.social-neo-card[\s\S]{0,200}rgba\(10, 15, 24/
        );
    });
});
