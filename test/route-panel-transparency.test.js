import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { expectRetiredCss, readCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('route panel transparency parity', () => {
    const transparencySource = readSource('assets/js/shared/lux-transparency.js');
    const utilitiesSource = readSource('assets/js/shared/utilities.js');
    const shellCss = readCss('assets/css/lux-shell.css');

    it('includes social, staff, and students-admin selectors in the paint list', () => {
        expect(transparencySource).toContain('...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS');
        expect(transparencySource).toContain('...STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS');
        expect(transparencySource).toContain('...STUDENTS_ADMIN_ROUTE_TRANSPARENCY_SURFACE_SELECTORS');
        expect(transparencySource).toContain("'.staff-hub-command-panel'");
        expect(transparencySource).toContain("'.staff-hub-metric-card'");
    });

    it('does not treat staff or social panels as structural surfaces', () => {
        const structuralBlock = transparencySource.match(
            /const isStructuralSurface = \(el\) => \([\s\S]*?\n    \);/
        )?.[0] || '';
        expect(structuralBlock).not.toContain('lux-route-staff');
        expect(structuralBlock).not.toContain('lux-route-social');
    });

    it('enables dynamic paint on route panels via shouldApplyDynamicBackground', () => {
        expect(transparencySource).toContain('const shouldApplyDynamicBackground = (el) =>');
        expect(transparencySource).toContain("document.body.classList.contains('lux-route-social')");
        expect(transparencySource).toContain("document.body.classList.contains('lux-route-staff')");
        expect(transparencySource).toContain("document.body.classList.contains('lux-route-students-admin')");
    });

    it('paints students-admin content instead of skipping the paint loop', () => {
        expect(transparencySource).not.toMatch(
            /lux-route-students-admin[\s\S]*el\.id === 'students-content'[\s\S]*return;\s*\n\s*\}/
        );
        expect(transparencySource).toContain('buildLuxuryRoutePanelGradient');
    });

    it('uses index home-dashboard recipe for social surfaces', () => {
        expect(transparencySource).toContain('buildHomeStyleSurfaceBackground');
        expect(transparencySource).toMatch(
            /return buildHomeStyleSurfaceBackground\(lightMode, amount\)/
        );
    });

    it('refreshes transparency after students-admin render', () => {
        const studentsAdminJs = readSource('assets/js/pages/students-command-center.js');
        expect(studentsAdminJs).toContain('queueLuxuryTransparencyRefresh(undefined, { roots: transparencyRoots })');
    });

    it('forces a deferred transparency refresh during initial and restored page loads', () => {
        const luxurySource = readSource('assets/js/features/index-luxury.js');

        expect(transparencySource).toContain('function scheduleLuxuryTransparencyBootRefresh(value)');
        expect(utilitiesSource).toContain("window.addEventListener('pageshow', function()");
        expect(transparencySource).toContain('const force = options?.force === true');
        expect(transparencySource).toContain('updateTransparency(percentage, {');
        expect(transparencySource).toContain('roots: scopedRoots');
        expect(luxurySource).toContain('window.scheduleLuxuryTransparencyBootRefresh(');
    });

    it('does not pin staff --lux-panel-alpha on body via shared shell', () => {
        expect(shellCss).not.toMatch(/body\.lux-route-staff\s*\{[^}]*--lux-panel-alpha:\s*0\.72/);
        expectRetiredCss('staff-command-center.css');
    });

    it('applies single blur layer on social via blur hosts only', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency-route-runtime.js');
        expect(routeRuntime).toContain('function isSocialBlurHost(el)');
        expect(transparencySource).toContain('const SOCIAL_BLUR_HOST_CLASSES = new Set([');
        expect(transparencySource).toContain('const isSocialBlurHost = window.isSocialBlurHost');
        const blurHostBlock = transparencySource.match(
            /const SOCIAL_BLUR_HOST_CLASSES = new Set\(\[([\s\S]*?)\]\);/
        )?.[1] || '';
        expect(blurHostBlock).not.toContain("'social-neo-section-command'");
        expect(blurHostBlock).not.toContain("'social-portfolio-hero'");
    });

    it('applies merged-shell frost on loading grid and desk host', () => {
        const homeCss = readSource('assets/css/index-home-role.css');
        expect(transparencySource).toContain('isHomeWidgetInnerPanel');
        expect(homeCss).toContain('.lux-home-merged.lux-soft-chrome');
        expect(homeCss).toContain('#page-home #lux-home-shell .lux-home-merged');
    });

    it('fills transparency-pending panels with matte surface instead of transparent holes', () => {
        const foucCss = readSource('assets/css/lux-fouc-ht.css');
        expect(foucCss).toMatch(
            /html\.lux-transparency-pending body:not\(\.lux-light-mode\)[\s\S]*?var\(--lux-panel-surface/
        );
        expect(foucCss).toMatch(
            /html\.lux-transparency-pending body\.lux-light-mode[\s\S]*?var\(--lux-panel-surface/
        );
        expect(foucCss).not.toMatch(
            /html\.lux-transparency-pending[\s\S]{0,200}background:\s*transparent/
        );
    });

    it('keeps social/staff on bare shared stack without retired route paint skins', () => {
        const socialHtml = readSource('social.html');
        const staffHtml = readSource('staff.html');
        expect(socialHtml).toContain('lux-page-bare');
        expect(socialHtml).toContain('lux-full-paint');
        expect(socialHtml).toContain('lux-shell.css');
        expect(socialHtml).not.toContain('social-rebuild.css');
        expect(staffHtml).not.toContain('staff-command-center.css');
        expectRetiredCss('social-rebuild.css');
        expect(socialHtml).toContain('utilities.js');
        expect(socialHtml).toContain('index-luxury.js');
    });
});
