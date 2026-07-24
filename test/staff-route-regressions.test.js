import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('staff route regressions', () => {
    it('uses shared bare portal stack without retired staff/index paint skins', () => {
        const staffHtml = readSource('staff.html');
        const staffJs = readSource('assets/js/pages/staff-command-center.js');
        const modalsCss = readSource('assets/css/lux-modals.css');

        expect(staffHtml).toContain('lux-shell.css');
        expect(staffHtml).toContain('lux-page-bare-lite.css');
        expect(staffHtml).toContain('lux-modals.css');
        expect(staffHtml).toContain('lux-page-bare');
        expect(staffHtml).toContain('lux-full-paint');
        expect(staffHtml).toContain('lux-route-staff');
        expect(staffHtml).toContain('id="staff-content"');
        expect(staffHtml).toContain('assets/js/pages/staff-command-center.js');
        expect(staffHtml).toContain('assets/js/theme-primer.js');
        expect(staffHtml).not.toContain('staff-command-center.css');
        expect(staffHtml).not.toContain('index-luxury.css');
        expectRetiredCss('staff-command-center.css');
        expectRetiredCss('index-luxury.css');
        expect(existsSync(join(process.cwd(), 'assets/css/staff-command-center.css'))).toBe(false);

        expect(modalsCss).toContain('.staff-hub-modal');
        expect(staffJs).toContain('renderStaffPage');
        expect(staffJs).toContain('staff-hub-shell');
        expect(staffJs).toContain('document.addEventListener(\'DOMContentLoaded\'');
    });

    it('keeps staff hub surfaces on shared transparency + lux dual-write hosts', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const staffJs = readSource('assets/js/pages/staff-command-center.js');

        expect(transparency).toContain('STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS');
        expect(transparency).toContain('.staff-hub-directory-panel');
        expect(transparency).toContain('.staff-hub-metric-card');
        expect(transparency).toContain("document.body.classList.contains('lux-route-staff')");

        expect(staffJs).toContain('staff-hub-shell');
        expect(staffJs).toContain('staff-hub-directory-panel');
        expect(staffJs).toContain('lux-data-card');
        expect(staffJs).toContain('queueLuxuryTransparencyRefresh');
    });
});
