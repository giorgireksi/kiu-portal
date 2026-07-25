const { readFileSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('transparency surface dedup', () => {
    it('merged transparency engine uses generic isCssOwnedSurface instead of per-route allowlists', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        expect(transparency).toContain('function isCssOwnedSurface(el)');
        expect(transparency).toContain('function isRouteOwnedSurface(el)');
        expect(transparency).toMatch(/function shouldKeepRouteFadeCssBackground\(el\)[\s\S]*isCssOwnedSurface\(el\)/);
        expect(transparency).not.toContain('function shouldKeepLibraryFadeCssBackground');
        expect(transparency).not.toContain('function shouldKeepLmsFadeCssBackground');
        expect(transparency).not.toContain('function shouldKeepRegistrationFadeCssBackground');
        expect(transparency).not.toContain('function shouldKeepAdminLibraryFadeCssBackground');
        expect(transparency).not.toContain('registrationGlassSelectors');
        expect(transparency).toContain('TRANSPARENCY_CORE_SELECTORS');
        expect(transparency).toContain('function appendRouteOwnedSurfaces');
    });

    it('shouldApplyDynamicBackground delegates route surfaces to isRouteOwnedSurface', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const dynamicStart = transparency.indexOf('function shouldApplyDynamicBackground(el)');
        expect(dynamicStart).toBeGreaterThan(-1);
        const dynamicBlock = transparency.slice(dynamicStart, dynamicStart + 1200);
        expect(dynamicBlock).toContain('isRouteOwnedSurface(el)');
        expect(dynamicBlock).not.toContain('newsx-panel');
        expect(dynamicBlock).not.toContain('ex2-hero');
        expect(dynamicBlock).not.toContain('student-service-canvas');
    });

    it('isStructuralSurface delegates route shells to isCssOwnedSurface', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const structuralStart = transparency.indexOf('const isStructuralSurface = (el) =>');
        expect(structuralStart).toBeGreaterThan(-1);
        const structuralBlock = transparency.slice(structuralStart, structuralStart + 2200);
        expect(structuralBlock).toContain("document.body.classList.contains('lux-route-timetable')");
        expect(structuralBlock).toContain('isCssOwnedSurface(el)');
        expect(structuralBlock).toContain("document.body.classList.contains('lux-route-registration')");
        expect(structuralBlock).not.toContain('lux-timetable-session-card');
        expect(structuralBlock).not.toContain('orders-inbox-shell');
        expect(structuralBlock).toContain('isTableGridCell');
    });

    it('exam portal joins unified transparency stack', () => {
        const html = readSource('exam-portal.html');
        expect(html).toContain('lux-unified-shell');
        expect(html).not.toContain('lux-transparency-route-runtime.js');
        expect(html).toContain('lux-transparency.js');
    });

    it('FOUC section-card paint uses layout-only attribute guard', () => {
        const fouc = readSource('assets/css/lux-fouc-ht.css');
        expect(fouc).toContain('.lux-section-card:not([data-lux-layout-only="1"])');
        expect(fouc).not.toContain(':not(.lux-route-admin-tools) .lux-section-card');
    });
});
