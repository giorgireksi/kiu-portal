import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';
function profileViewSource() {
    return readSource('profile-view.html') + readSource('assets/js/pages/profile-view-page.js');
}

describe('profile-view shell redesign', () => {
    it('uses a single pv-shell surface with command bar, head grid, and single tab panel', () => {
        const html = profileViewSource();
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');

        expect(readSource('profile-view.html')).toContain('assets/js/pages/profile-view-page.js');
        expect(html).toContain('class="pv-shell"');
        expect(html).toContain('class="pv-command-bar"');
        expect(html).toContain('class="pv-profile-head"');
        expect(html).toContain('class="pv-profile-main"');
        expect(html).toContain('id="pv-tab-panel"');
        expect(html).toContain('class="pv-tab-panel"');
        expect(html).toContain('role="tablist"');
        expect(html).toContain('role="tabpanel"');
        expect(html).toContain('pvMountTab');
        expect(html).toContain('renderProfileViewTabContent');
        expect(html).not.toContain('pv-header-actions');
        expect(html).not.toContain('pv-tab-content');
        expect(html).not.toContain('pvtab-1-template');
        expect(html).toContain('id="pv-metrics-root"');
        expect(html).toContain('renderProfileViewMetrics');
        expect(html).toContain('class="pv-metric-card"');
        expect(html).not.toContain('class="pv-workspace"');
        expect(html).not.toContain('lux-summary-surface--hero');
        expect(html).not.toContain('students-hub-profile-metric');
        expect(html).not.toContain('class="pv-tab lux-select-card');
        expect(html).not.toContain('class="pv-left surface-card"');
        expect(html).toContain('hydrateProfileViewStudentRecord');

        expectRetiredCss('profile-view-route.css');
        expect(routeRuntime).toContain('function isCssOwnedSurface(el)');
        expect(routeRuntime).toMatch(/pv-shell[\s\S]*return false/);
        expect(html).toContain('data-lux-glass-root="1"');
        expect(runtime).toContain("node.closest?.('#profile-view-root')");
    });

    it('keeps admin isolated and schedule read-only without interactive timetable slots', () => {
        const html = profileViewSource();

        expect(html).toContain("'Admin'");
        expect(html).toContain('profileCtx?.interactive');
        expect(html).toContain('data-pv-action="toggle-probation"');
        expect(html).not.toMatch(/pv-overview-grid[\s\S]{0,1200}toggle-probation/);
        expect(html).not.toMatch(/tabIndex === 2[\s\S]{0,900}interactive:\s*true/);
        expect(html).not.toContain('Academic Standing');
        expect(html).not.toContain('pv-financial-status-card');
    });
});