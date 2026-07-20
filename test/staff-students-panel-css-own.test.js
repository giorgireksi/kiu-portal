import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff / students-admin CSS-owned panel glass', () => {
    it('defines keep-CSS helpers in lux-transparency route runtime', () => {
        const utilities = readSource('assets/js/shared/lux-transparency-route-runtime.js');
        expect(utilities).toContain('function shouldKeepStaffFadeCssBackground(el)');
        expect(utilities).toContain('function shouldKeepStudentsAdminFadeCssBackground(el)');
        expect(utilities).toContain("closest?.('#staff-content')");
        expect(utilities).toContain("closest?.('#students-content')");
        expect(utilities).toContain("el.classList.contains('staff-hub-hero')");
        expect(utilities).toContain("el.classList.contains('students-hub-hero')");
        const host = readSource('assets/js/shared/lux-transparency.js');
        expect(host).toContain('shouldKeepStudentsAdminFadeCssBackground');
        expect(host).toMatch(/stripInlineGlassPaint/);
    });

    it('staff-command-center and students-admin route skins stay retired', () => {
        expectRetiredCss('staff-command-center.css');
        expectRetiredCss('students-admin-lms.css');
    });
});
