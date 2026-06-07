import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('staff route regressions', () => {
    it('keeps staff command center glass tokens aligned with utilities and index dedupe', () => {
        const css = readSource('assets/css/staff-command-center.css');
        const luxuryCss = readSource('assets/css/index-luxury.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const staffHtml = readSource('staff.html');

        expect(staffHtml).toContain('assets/css/staff-command-center.css?v=20260531-routeglass26');
        expect(staffHtml).toContain('assets/css/index-luxury.css?v=20260531-routeglass26');
        expect(staffHtml).toContain('assets/js/shared/utilities.js?v=20260531-routeglass26');
        expect(staffHtml).toContain('assets/js/pages/staff-command-center.js?v=20260604-staffboot1');
        expect(staffHtml).toContain('assets/js/theme-primer.js?v=20260604-styleguard2');
        expect(staffHtml).toContain('lux-route-staff');
        expect(staffHtml).toContain('id="staff-content"');

        expect(css).toContain('--staff-fade-surface');
        expect(css).toContain('--staff-fade-card-bg');
        expect(css).toContain('--staff-fade-chip');
        expect(css).toContain('--staff-fade-row');
        expect(css).toContain('--staff-fade-blur');
        expect(css).toContain('#staff-content .staff-hub-hero');
        expect(css).toContain('background: var(--staff-fade-surface) !important');
        expect(css).toContain('html.lux-high-transparency body.lux-route-staff');

        // Whole staff route shielded from generic glass painters
        expect(luxuryCss).toContain(':not(.lux-route-staff)');
        expect(luxuryCss).toContain(
            'body.lux-unified-shell:not(.lux-route-students-admin):not(.lux-route-staff):not(.lux-route-profile-view) .surface-card'
        );
        expect(luxuryCss).toContain('body:not(.lux-light-mode):not(.lux-route-staff):not(.lux-route-admin-library) .lux-strip-card');
    });

    it('matches students-admin stat-card contract for staff metric tiles', () => {
        const css = readSource('assets/css/staff-command-center.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const luxuryJs = readSource('assets/js/features/index-luxury.js');
        const staffJs = readSource('assets/js/pages/staff-command-center.js');

        // Metric cards are not in the Tier 1 panel :is() list
        const tier1Block = css.match(/\/\* Tier 1[\s\S]*?\) \{/);
        expect(tier1Block).toBeTruthy();
        expect(tier1Block[0]).not.toContain('staff-hub-metric-card');
        expect(css).toMatch(
            /\.staff-hub-metric-card[\s\S]*?var\(--staff-fade-card-bg\)/
        );
        expect(css).toContain('.lux-strip-card:not(.staff-hub-metric-card)');

        // High-transparency: metrics use card tier, not panel surface
        expect(css).toMatch(
            /html\.lux-high-transparency[\s\S]*?\.staff-hub-metric-card[\s\S]*?var\(--staff-fade-card-bg\)/
        );
        expect(css).not.toMatch(
            /html\.lux-high-transparency[\s\S]*?\.staff-hub-metric-card[\s\S]*?var\(--staff-fade-surface\)/
        );

        // JS: small gradient branch for metrics (students-admin parity)
        expect(utilitiesSource).toMatch(
            /if \(el\.classList\.contains\('staff-hub-metric-card'\)\) \{[\s\S]*?buildLuxuryRoutePanelGradient\(lightMode, true\)/
        );
        expect(utilitiesSource).toMatch(
            /STAFF_ROUTE_SMALL_TRANSPARENCY_SURFACE_CLASSES = \[[^\]]*staff-hub-metric-card/
        );

        // Markup: strip classes and small hints
        expect(staffJs).toContain('staff-hub-metric-card lux-strip-card surface-card');
        expect(staffJs).toMatch(/<span>Total staff<\/span>[\s\S]*?<small>/);
        expect(staffJs).toContain('document.addEventListener(\'DOMContentLoaded\', () => {');
        expect(staffJs).toContain('renderStaffPage();');

        // Optional: no lux-modern-surface under staff content
        expect(luxuryJs).toMatch(
            /lux-route-staff[\s\S]*?#staff-content/
        );
    });
});
