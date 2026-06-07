import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('students-admin route regressions', () => {
    it('keeps students-admin glass tokens aligned with utilities and index dedupe', () => {
        const css = readSource('assets/css/students-admin-lms.css');
        const luxuryCss = readSource('assets/css/index-luxury.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const html = readSource('students-admin.html');

        expect(html).toContain('assets/css/students-admin-lms.css?v=20260531-routeglass1');
        expect(html).toContain('assets/css/index-luxury.css?v=20260531-routeglass1');
        expect(html).toContain('assets/js/pages/students-admin-lms.js?v=20260604-studentsboot1');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260531-routeglass3');
        expect(html).toContain('assets/js/theme-primer.js?v=20260604-styleguard2');
        expect(html).toContain('lux-route-students-admin');
        expect(html).toContain('id="students-content"');

        expect(css).toContain('--sadmin-fade-surface-fill');
        expect(css).toContain('--sadmin-fade-surface-subtle');
        expect(css).toContain('--sadmin-fade-border');
        expect(css).toContain('--sadmin-fade-row');
        expect(css).toContain('--sadmin-fade-glass-blur');
        expect(css).not.toContain('--students-lms-');
        expect(css).toContain('.students-lms-hero');
        expect(css).toContain('.students-lms-stat-card');
        expect(css).toContain('Home-style command center restyle');
        expect(css).toContain('html.lux-high-transparency body.lux-route-students-admin');

        expect(luxuryCss).toContain(':not(.lux-route-students-admin)');

        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-students-admin')");
        expect(utilitiesSource).toContain("Boolean(el.closest?.('#students-content'))");
        expect(utilitiesSource).toContain("!el.closest?.('#students-admin-lms-modal')");
        expect(utilitiesSource).toContain('renderStudentsPage');
    });

    it('includes student mobility editor section and profile tab', () => {
        const source = readSource('assets/js/pages/students-admin-lms.js');
        expect(source).toContain('Mobility & transfer');
        expect(source).toContain('id="form-mobility-category"');
        expect(source).toContain("['mobility', 'Mobility']");
        expect(source).toContain('renderMobilityTab');
        expect(source).toContain("document.addEventListener('DOMContentLoaded', renderStudentsAdminLmsPage, { once: true });");
        expect(source).toContain('renderStudentsAdminLmsPage();');
    });
});
