import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social alerts scroll regressions', () => {
    it('keeps alerts list scroll inside the panel on desktop', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const page = readSource('assets/js/pages/social-page.js');
        const alerts = readSource('assets/js/pages/social-alerts.js');
        const html = readSource('social.html');

        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="alerts"\][\s\S]*#social-neo-center-region[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="alerts"\][\s\S]*#social-neo-center-region > \.sn-alerts-panel[\s\S]*flex:\s*1 1 0%/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="alerts"\][\s\S]*\.sn-alerts-list[\s\S]*overflow-y:\s*auto/);

        expect(page).toContain('function isSocialAlertsPanel(');
        expect(page).toContain('function isSocialInboxPanel(');
        expect(page).toContain("if (isSocialInboxPanel(host)) return false;");
        expect(page).toContain("if (isSocialInboxPanel(root())) return;");
        expect(page).toContain("'.sn-alerts-list'");
        expect(page).toMatch(/center\.querySelector\('\.sn-alerts-panel'\)\) return center\.clientHeight/);

        expect(alerts).toContain('class="sn-alerts-list"');

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
    });
});