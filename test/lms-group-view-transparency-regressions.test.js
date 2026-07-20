import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS CSS-token surface regressions', () => {
    it('aliases --lms-fade-surface to canonical --lux-panel-* (transparency lives in lux-tokens)', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        // Density knobs stay on the shared panel recipe
        expect(tokens).toContain('calc(var(--lux-transparency-alpha');
        expect(tokens).toContain('calc(var(--lux-color-fade-alpha');
        expect(tokens).toContain('--lux-panel-surface');
    });

    it('paints LMS shells from CSS tokens, not transparent', () => {
    });

    it('CSS-owns catalog shells via shouldKeepLmsFadeCssBackground strip path', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const gateStart = utilitiesSource.indexOf('function shouldKeepLmsFadeCssBackground');
        expect(gateStart).toBeGreaterThan(-1);
        const gate = utilitiesSource.slice(gateStart, gateStart + 2200);

        expect(utilitiesSource).toContain('function shouldKeepLmsFadeCssBackground(el)');
        expect(utilitiesSource).toContain('shouldKeepLmsFadeCssBackground(el)');
        expect(utilitiesSource).toContain('function shouldKeepRouteFadeCssBackground(el)');
        expect(gate).toContain("closest?.('#page-lms')");
        expect(gate).toContain("el.classList.contains('page-hero')");
        expect(gate).toContain("el.classList.contains('lux-lms-hero')");
        expect(gate).toContain("el.classList.contains('lms-route-panel')");
        expect(gate).toContain("el.classList.contains('lux-lms-group-card')");
        expect(gate).toContain("el.classList.contains('lux-card')");
        // Full CSS ownership via aggregator → stripInlineGlassPaint
        expect(utilitiesSource).toMatch(
            /shouldKeepRouteFadeCssBackground\(el\)\)[\s\S]{0,120}stripInlineGlassPaint/
        );
        expect(utilitiesSource).not.toContain('Math.max(amount, 0.10)');
        expect(utilitiesSource).not.toContain('isLmsShellSurface');
    });

    it('does not use LMS transparency root hacks', () => {
        const lmsHtml = readSource('lms.html');
        const bootSource = readSource('assets/js/pages/lms-route-boot.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(lmsHtml).not.toContain('getLmsTransparencyRoots');
        expect(lmsHtml).not.toMatch(/const roots = lmsInner \? \[lmsInner\]/);
        expect(bootSource).toContain('updateTransparency(savedTransparency, { persist: false })');
        expect(classroomSource).not.toContain('refreshLmsGroupViewTransparency');
    });

    it('includes LMS glass hosts in paint selectors / shared observer surface set', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');

        // Engine paint list (buildDynamicSurfaceBackground LMS branch)
        expect(utilitiesSource).toContain("'.lux-lms-group-card'");
        expect(utilitiesSource).toContain("'.lms-clean-subject-card'");
        expect(utilitiesSource).toContain("'.lms-clean-signal-pill'");
        expect(utilitiesSource).toContain("'lux-lms-group-card'");
        // Shared observer still watches generic shells used on LMS
        expect(utilitiesSource).toContain("'.lux-card'");
        expect(utilitiesSource).toContain("'.page-hero'");
        expect(utilitiesSource).toContain("'.lux-status-pill'");
    });

    it('engine CSS-owns LMS shells; residual paint uses panel tokens only', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const bootSource = readSource('assets/js/pages/lms-route-boot.js');
        const lmsHtml = readSource('lms.html');

        expect(utilitiesSource).toContain("el.classList.contains('lms-hero-focus')");
        expect(utilitiesSource).toContain("el.classList.contains('lms-clean-subjects')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-lms-hero')");
        expect(utilitiesSource).toContain("el.classList.contains('page-hero')");
        expect(utilitiesSource).toContain('shouldKeepLmsFadeCssBackground');
        expect(utilitiesSource).toContain('shouldKeepRouteFadeCssBackground');
        expect(utilitiesSource).toContain("'var(--lux-panel-surface)'");
        expect(utilitiesSource).toContain("'var(--lux-panel-surface-soft)'");
        expect(bootSource).toContain('queueLuxuryTransparencyRefresh');
        expect(lmsHtml).toContain('page-lms');
        expect(bootSource).toMatch(
            /queueLuxuryTransparencyRefresh|refreshLuxuryTransparencySurfaces/
        );
    });

    it('residual non-home paint is panel tokens only (no multi-radial recipes)', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const paintStart = utilitiesSource.indexOf('const buildDynamicSurfaceBackground = (el, lightMode, amount) =>');
        expect(paintStart).toBeGreaterThan(-1);
        const paintEnd = utilitiesSource.indexOf('const shouldApplyDynamicBackground', paintStart);
        const paint = utilitiesSource.slice(paintStart, paintEnd);
        expect(paint).toContain('shouldKeepRouteFadeCssBackground');
        expect(paint).toContain('buildLuxuryRoutePanelGradient');
        expect(paint).toContain('buildHomeStyleSurfaceBackground');
        // Must not hardcode multi-radial glass for non-home
        expect(paint).not.toContain('radial-gradient(circle at 6%');
        expect(paint).not.toContain('radial-gradient(circle at 12%');
        expect(paint).not.toMatch(/if\s*\(\s*!_isHighTransBg\s*&&\s*isLmsRoute\s*&&/);
    });

    it('never gates LMS large shells on high-opacity skip (avoids blue wash at slider >=80)', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        expect(utilitiesSource).not.toMatch(/if\s*\(\s*!_isHighTransBg\s*&&\s*isLmsRoute\s*&&/);
        expect(utilitiesSource).toContain('shouldKeepLmsFadeCssBackground');
        expect(utilitiesSource).toContain('shouldKeepRouteFadeCssBackground');
    });
});

