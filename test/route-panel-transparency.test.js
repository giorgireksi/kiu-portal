import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { readCss } from './helpers/bare-shell-css.js';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('route panel transparency parity', () => {
    const utilitiesSource = readSource('assets/js/shared/utilities.js');
    const staffCss = readCss('assets/css/staff-command-center.css');

    it('includes social, staff, and students-admin selectors in the paint list', () => {
        expect(utilitiesSource).toContain('...SOCIAL_NEO_TRANSPARENCY_SURFACE_SELECTORS');
        expect(utilitiesSource).toContain('...STAFF_ROUTE_TRANSPARENCY_SURFACE_SELECTORS');
        expect(utilitiesSource).toContain('...STUDENTS_ADMIN_ROUTE_TRANSPARENCY_SURFACE_SELECTORS');
        expect(utilitiesSource).toContain("'.students-lms-panel'");
        expect(utilitiesSource).toContain("'.staff-hub-command-panel'");
    });

    it('does not treat staff or social panels as structural surfaces', () => {
        const structuralBlock = utilitiesSource.match(
            /const isStructuralSurface = \(el\) => \([\s\S]*?\n    \);/
        )?.[0] || '';
        expect(structuralBlock).not.toContain('lux-route-staff');
        expect(structuralBlock).not.toContain('lux-route-social');
    });

    it('enables dynamic paint on route panels via shouldApplyDynamicBackground', () => {
        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-social')");
        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-staff')");
        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-students-admin')");
        expect(utilitiesSource).not.toContain(
            "!document.body.classList.contains('lux-route-social') && (\n" +
            '            SOCIAL_NEO_TRANSPARENCY_SURFACE_CLASSES.some'
        );
    });

    it('paints students-admin content instead of skipping the paint loop', () => {
        expect(utilitiesSource).not.toMatch(
            /lux-route-students-admin[\s\S]*el\.id === 'students-content'[\s\S]*return;\s*\n\s*\}/
        );
        expect(utilitiesSource).toContain('isStudentsAdminLargeSurface');
        expect(utilitiesSource).toContain('buildLuxuryRoutePanelGradient');
    });

    it('uses index home-dashboard recipe for social surfaces', () => {
        expect(utilitiesSource).toContain('function buildHomeStyleSurfaceBackground(lightMode, amount)');
        expect(utilitiesSource).toMatch(
            /if \(isHomeDashboardSurface\) \{\s*return buildHomeStyleSurfaceBackground\(lightMode, amount\);/
        );
        expect(utilitiesSource).toMatch(
            /if \(isSocialLargeSurface\) \{\s*return buildHomeStyleSurfaceBackground\(lightMode, amount\);/
        );
        const socialCss = readSource('assets/css/social-rebuild.css');
        expect(socialCss).toMatch(
            /#page-social \.social-neo-card::before[\s\S]*opacity:\s*0;/
        );
    });

    it('refreshes transparency after students-admin render', () => {
        const studentsAdminJs = readSource('assets/js/pages/students-admin-lms.js');
        expect(studentsAdminJs).toContain('queueLuxuryTransparencyRefresh(undefined, { roots: [root] })');
    });

    it('forces a deferred transparency refresh during initial and restored page loads', () => {
        const luxurySource = readSource('assets/js/features/index-luxury.js');
        const transparencySource = readSource('assets/js/shared/lux-transparency.js');

        expect(transparencySource).toContain('function scheduleLuxuryTransparencyBootRefresh(value)');
        expect(utilitiesSource).toContain("window.addEventListener('pageshow', function()");
        expect(transparencySource).toContain('const force = options?.force === true');
        expect(transparencySource).toContain('updateTransparency(percentage, { force, persist: false, roots: scopedRoots })');
        expect(luxurySource).toContain('window.scheduleLuxuryTransparencyBootRefresh(');
    });

    it('does not pin staff --lux-panel-alpha on body', () => {
        expect(staffCss).not.toMatch(/body\.lux-route-staff\s*\{[^}]*--lux-panel-alpha:\s*0\.72/);
    });

    it('applies single blur layer on social via blur hosts only', () => {
        expect(utilitiesSource).toContain('const SOCIAL_BLUR_HOST_CLASSES = new Set([');
        const blurHostBlock = utilitiesSource.match(
            /const SOCIAL_BLUR_HOST_CLASSES = new Set\(\[([\s\S]*?)\]\);/
        )?.[1] || '';
        expect(blurHostBlock).not.toContain("'social-neo-section-command'");
        expect(blurHostBlock).not.toContain("'social-portfolio-hero'");
        expect(blurHostBlock).not.toContain("'social-portfolio-toolbar'");
        expect(blurHostBlock).not.toContain("'social-neo-pages-hero'");
        expect(blurHostBlock).not.toContain("'social-projects-hero-rich'");
        expect(utilitiesSource).toContain('function isSocialBlurHost(el)');
        expect(utilitiesSource).toContain('function shouldKeepSocialFadeCssBackground(el)');
        expect(utilitiesSource).toContain('const keepSocialFadeCss = shouldKeepSocialFadeCssBackground(el)');
        expect(utilitiesSource).toContain('const suppressBlur = isSocialRouteSurface &&');
        expect(utilitiesSource).toContain('!isSocialBlurHost(el)');
        expect(utilitiesSource).toMatch(
            /const backdropValue = \(suppressBlur \|\| keepSocialFadeCss\)\s*\?\s*'none'\s*:\s*`blur\(\$\{blurAmount\}px\) saturate\(\$\{saturateAmount\}%\)`/
        );
        expect(utilitiesSource).toContain("el.style.setProperty('backdrop-filter', backdropValue, 'important')");
    });

    it('applies merged-shell frost on loading grid and desk host', () => {
        const transparencySource = readSource('assets/js/shared/lux-transparency.js');
        const homeCss = readSource('assets/css/index-home-role.css');
        expect(transparencySource).toContain('isHomeWidgetInnerPanel');
        expect(homeCss).toContain('Legacy grid hosts: full home-glass-fill + fade blur');
        const frostHostBlock = homeCss.match(
            /body\.lux-unified-shell:not\(\.lux-route-students-admin\) #page-home #lux-home-shell :is\([\s\S]*?\) \{/
        )?.[0] || '';
        expect(frostHostBlock).toContain('.lux-home-grid > .lux-card');
        expect(homeCss).toContain('.lux-home-merged.lux-soft-chrome');
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

    it('fills social workspace nav rows with slider-scaled transparency background', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        const sideLinkBase = socialCss.match(
            /#public-social-root \.social-neo-side-link \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(sideLinkBase).toContain('var(--lux-transparency-alpha');
        expect(sideLinkBase).not.toContain('0.03 +');
        expect(sideLinkBase).not.toContain('background: transparent');
        expect(sideLinkBase).not.toContain('background: var(--sn-card-base)');
        expect(socialCss).toMatch(
            /body\.lux-light-mode\.lux-route-social #public-social-root \.social-neo-side-link:not\(:hover\):not\(\.is-active\)[\s\S]*var\(--lux-transparency-alpha/
        );
        expect(socialCss).not.toMatch(
            /body\.lux-light-mode\.lux-route-social #public-social-root \.social-neo-side-link:not\(:hover\):not\(\.is-active\)[\s\S]*0\.04 \+/
        );
    });

    it('uses rail fade tokens on center panels (portfolio/pages/events parity)', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        const pageSocialLargeCards = socialCss.match(
            /#page-social \.social-portfolio-hero,\s*\nbody\.lux-route-social #page-social \.social-portfolio-toolbar,\s*\nbody\.lux-route-social #page-social \.social-portfolio-card \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(pageSocialLargeCards).toContain('background: var(--social-fade-surface)');
        expect(pageSocialLargeCards).toContain('backdrop-filter: var(--social-fade-blur)');
        expect(pageSocialLargeCards).not.toContain('--sn-card-base');
        expect(pageSocialLargeCards).not.toContain('blur(var(--lux-transparency-blur, 18px)');
        expect(socialCss).toMatch(
            /\.social-neo-section-command \{[\s\S]*background:\s*var\(--social-fade-surface\)/
        );
        expect(socialCss).toMatch(
            /\.social-neo-section-metric,[\s\S]*\.social-neo-section-task \{[\s\S]*background:\s*var\(--social-fade-surface-soft\)/
        );
        expect(socialCss).toContain('--social-fade-blur: blur(var(--lux-transparency-blur, 0px))');
        expect(socialCss).toContain('--sn-blur: var(--lux-transparency-blur, 0px);');
    });

    it('scales section overlays by --lux-transparency-alpha at 0% visibility', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        expect(socialCss).toMatch(
            /social-neo-pages-shell::before[\s\S]*opacity:\s*calc\(\.75 \* var\(--lux-transparency-alpha/
        );
        expect(socialCss).toMatch(
            /\.social-portfolio-hero::before[\s\S]*opacity:\s*var\(--lux-transparency-alpha/
        );
        expect(socialCss).toMatch(
            /\.social-neo-section-command::before[\s\S]*opacity:\s*var\(--lux-transparency-alpha/
        );
    });

    it('removes redundant wrapper blur on #social-neo-root (index-luxury #public-social-root > *)', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        expect(socialCss).toMatch(
            /body\.lux-route-social #public-social-root > #social-neo-root[\s\S]*backdrop-filter:\s*none\s*!important/
        );
        expect(socialCss).toMatch(
            /body\.lux-route-social #public-social-root > #social-neo-root[\s\S]*-webkit-backdrop-filter:\s*none\s*!important/
        );
    });

    it('scales color fade with fill ratio (no 0.42 floor at slider 0%)', () => {
        expect(utilitiesSource).toMatch(
            /colorFadeRatio = Math\.max\(0\.01, Math\.min\(1, fillRatio \* 0\.92\)\)/
        );
        const indexLuxury = readSource('assets/js/features/index-luxury.js');
        expect(indexLuxury).toMatch(
            /colorFadeRatio = Math\.max\(0\.01, Math\.min\(1, fillRatio \* 0\.92\)\)/
        );
        expect(indexLuxury).not.toContain('Math.max(0.42,');
    });

    it('clears legacy light-mode and stat-tile background overrides', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        const lightPageSocial = socialCss.match(
            /body\.lux-light-mode\.lux-route-social #page-social \.social-neo-card,[\s\S]*?body\.lux-light-mode\.lux-route-social #page-social \.social-portfolio-card \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(lightPageSocial).toContain('var(--social-fade-surface)');
        expect(lightPageSocial).not.toMatch(/background:[\s\S]*sn-card-base/);
        expect(socialCss).toMatch(
            /\.social-neo-pages-hero-stats article \{[\s\S]*background:\s*var\(--social-fade-surface-soft\)/
        );
        expect(socialCss).toMatch(
            /\.social-portfolio-stat-tile \{[\s\S]*background:\s*var\(--social-fade-surface-soft\)/
        );
        const featuredCard = socialCss.match(
            /body\.lux-route-social \.social-portfolio-card\.is-featured \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(featuredCard).not.toContain('background');
        expect(featuredCard).not.toContain('radial-gradient');
    });

    it('does not paint layout shells as glass surfaces (single layer on heroes)', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        const panelShellBlock = socialCss.match(
            /\/\* Panel shells[\s\S]*?body\.lux-route-social :is\([\s\S]*?\) \{[\s\S]*?color: var\(--lux-text\) !important;\s*\n\}/
        )?.[0] || '';
        expect(panelShellBlock).toContain('.social-portfolio-hero');
        expect(panelShellBlock).toContain('.social-neo-pages-hero');
        expect(panelShellBlock).not.toContain('.social-portfolio-shell');
        expect(panelShellBlock).not.toContain('.social-neo-pages-shell');
        expect(panelShellBlock).not.toContain('.social-neo-events-shell');
        expect(panelShellBlock).not.toContain('.social-projects-shell');
    });

    it('uses accent tokens on page card covers (no legacy blue)', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        const coverFallback = socialCss.match(
            /body\.lux-route-social \.social-neo-page-card-cover-fallback \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(coverFallback).toContain('var(--lux-accent-rgb)');
        expect(coverFallback).not.toContain('96,165,250');
        expect(coverFallback).not.toContain('14,165,233');
        expect(socialCss).not.toMatch(
            /body\.lux-route-social \.social-portfolio-hero \{[\s\S]*?radial-gradient\(circle at top right, rgba\(var\(--sn-accent-rgb\), \.14\)/
        );
    });

    it('uses light in-hero portfolio stat chips (no nested glass)', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        expect(socialCss).toMatch(
            /body\.lux-route-social \.social-portfolio-hero \.social-portfolio-stat-tile[\s\S]*backdrop-filter:\s*none\s*!important/
        );
        expect(socialCss).toContain('.social-portfolio-stat-tile.lux-strip-card');
        const completionPass = socialCss.match(
            /body\.lux-route-social \.social-neo-events-hero-stat,[\s\S]*?body\.lux-route-social \.social-project-ring-card \{[\s\S]*?\n\}/
        )?.[0] || '';
        expect(completionPass).not.toContain('.social-portfolio-stat-tile');
    });

    it('neutralizes lux-hero-side wrapper inside portfolio hero', () => {
        const socialCss = readSource('assets/css/social-rebuild.css');
        expect(socialCss).toMatch(
            /body\.lux-route-social \.social-portfolio-hero-side\.lux-hero-side \{[\s\S]*background:\s*transparent\s*!important/
        );
        expect(socialCss).toMatch(
            /body\.lux-route-social \.social-portfolio-hero-side\.lux-hero-side \{[\s\S]*backdrop-filter:\s*none\s*!important/
        );
        expect(socialCss).toMatch(
            /body\.lux-route-social \.social-portfolio-hero-side\.lux-hero-side \{[\s\S]*padding:\s*0\s*!important/
        );
    });

    it('bumps utilities cache tag on affected luxury routes', () => {
        const socialHtml = readSource('social.html');
        expect(socialHtml).toContain('utilities.js?v=20260531-routeglass12');
        expect(socialHtml).toContain('index-luxury.js?v=20260531-routeglass12');
        expect(readSource('staff.html')).toContain('utilities.js?v=20260531-routeglass3');
        expect(readSource('student-service.html')).toContain('utilities.js?v=20260531-routeglass3');
        expect(readSource('students-admin.html')).toContain('utilities.js?v=20260531-routeglass3');
        expect(socialHtml).toContain('social-rebuild.css?v=20260531-routeglass14');
    });
});
