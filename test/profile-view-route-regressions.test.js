import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile-view route regressions', () => {
    it('keeps profile-view glass tokens aligned with utilities and index-luxury dedupe', () => {
        const css = readSource('assets/css/profile-view-route.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const indexLuxury = readSource('assets/css/index-luxury.css');
        const html = readSource('profile-view.html');

        expect(html).toContain('assets/css/profile-view-route.css?v=20260530-pvglass1');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260530-pvglass1');
        expect(html).toContain('lux-route-profile-view');

        expect(css).toContain('--pv-fade-surface');
        expect(css).toContain('--pv-fade-surface-soft');
        expect(css).toContain('--pv-fade-control');
        expect(css).toContain('--pv-fade-chip');
        expect(css).toContain('--pv-fade-row');
        expect(css).toContain('--pv-fade-modal');
        expect(css).toContain('Panel shells');
        expect(css).toContain('Soft chrome');
        expect(css).toContain('background: var(--pv-fade-surface) !important');
        expect(css).toContain('background: var(--pv-fade-surface-soft) !important');
        expect(css).toContain('html.lux-high-transparency body.lux-route-profile-view');
        expect(css).not.toMatch(/\.pv-modal-header\s*\{[^}]*background:\s*#0f172a/);

        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-profile-view')");
        expect(utilitiesSource).toContain("el.classList.contains('pv-meta')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-strip-card')");
        expect(utilitiesSource).toContain("className.startsWith('pv-')");

        expect(indexLuxury).toContain(
            ':not(.lux-route-students-admin):not(.lux-route-admin-orders):not(.lux-route-profile-view) .content-box'
        );
        expect(indexLuxury).toContain(
            ':not(.lux-route-students-admin):not(.lux-route-admin-orders):not(.lux-route-profile-view) .lux-card'
        );
        expect(indexLuxury).not.toMatch(
            /body\.lux-unified-shell:not\(\.lux-route-students-admin\) \.pv-meta/
        );
        expect(indexLuxury).not.toMatch(
            /rgba\(13, 19, 31, 0\.84\)[\s\S]{0,120}body\.lux-route-profile-view \.pv-meta/
        );
        expect(indexLuxury).toContain(
            ':not(.lux-route-students-admin):not(.lux-route-profile-view) .surface-card'
        );
    });
});
