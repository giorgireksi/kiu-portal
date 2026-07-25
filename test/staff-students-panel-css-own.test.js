import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

describe('staff / students-admin CSS-owned panel glass', () => {
    it('defines generic CSS-owned surface helpers in lux-transparency route runtime', () => {
        const runtime = readSource('assets/js/shared/lux-transparency.js');
        expect(runtime).toContain('function isCssOwnedSurface(el)');
        expect(runtime).toMatch(/students-hub-|staff-hub-/);
        expect(runtime).toContain("closest?.('#staff-content')");
        expect(runtime).toContain("closest?.('#students-content')");
        const host = readSource('assets/js/shared/lux-transparency.js');
        expect(host).toContain('isCssOwnedSurface');
        expect(host).toMatch(/stripInlineGlassPaint/);
    });

    it('staff-command-center and students-admin route skins stay retired', () => {
        expectRetiredCss('staff-command-center.css');
        expectRetiredCss('students-admin-lms.css');
    });
});
