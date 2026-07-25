import { describe, expect, it } from 'vitest';

import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS CSS-token surface regressions', () => {
    it('aliases --lms-fade-surface to canonical --lux-panel-* (transparency lives in lux-tokens)', () => {
        const tokens = readSource('assets/css/lux-tokens.css');
        expect(tokens).toContain('calc(var(--lux-transparency-alpha');
        expect(tokens).toContain('calc(var(--lux-color-fade-alpha');
        expect(tokens).toContain('--lux-panel-surface');
    });

    it('CSS-owns LMS shells via generic isCssOwnedSurface strip path', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const lmsHtml = readSource('lms.html');

        expect(routeRuntime).toContain('function isCssOwnedSurface(el)');
        expect(routeRuntime).toContain('function shouldKeepRouteFadeCssBackground(el)');
        expect(routeRuntime).toMatch(/lux-route-lms[\s\S]*lms-route-panel/);
        expect(routeRuntime).toContain('.lux-lms-group-card');
        expect(transparency).toContain('isCssOwnedSurface');
        expect(transparency).toMatch(
            /shouldKeepRouteFadeCssBackground\(el\)\)[\s\S]{0,120}stripInlineGlassPaint/
        );
        expect(transparency).not.toContain('Math.max(amount, 0.10)');
        expect(transparency).not.toContain('isLmsShellSurface');
        expect(lmsHtml.match(/data-lux-glass-root="1"/g).length).toBeGreaterThanOrEqual(3);
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
        const transparency = readSource('assets/js/shared/lux-transparency.js');

        expect(transparency).toContain("'.lux-lms-group-card'");
        expect(transparency).not.toContain("'.lms-clean-subject-card'");
        expect(transparency).not.toContain("'.lms-clean-signal-pill'");
        expect(transparency).toContain("'.page-hero'");
        expect(transparency).toContain("'.lux-status-pill'");
    });

    it('engine CSS-owns LMS shells; residual paint uses panel tokens only', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const bootSource = readSource('assets/js/pages/lms-route-boot.js');
        const lmsHtml = readSource('lms.html');

        expect(routeRuntime).toMatch(/lux-route-lms[\s\S]*lms-route-panel/);
        expect(routeRuntime).toContain('.lms-hero-focus');
        expect(routeRuntime).toContain('.lms-clean-subjects');
        expect(routeRuntime).toContain('.lux-lms-hero');
        expect(routeRuntime).toContain('.page-hero');
        expect(transparency).toContain('isCssOwnedSurface');
        expect(transparency).toContain('shouldKeepRouteFadeCssBackground');
        expect(transparency).toContain("'var(--lux-panel-surface)'");
        expect(transparency).toContain("'var(--lux-panel-surface-soft)'");
        expect(bootSource).toContain('queueLuxuryTransparencyRefresh');
        expect(lmsHtml).toContain('page-lms');
        expect(bootSource).toMatch(
            /queueLuxuryTransparencyRefresh|refreshLuxuryTransparencySurfaces/
        );
    });

    it('residual non-home paint is panel tokens only (no multi-radial recipes)', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        const paintStart = transparency.indexOf('const buildDynamicSurfaceBackground = (el, lightMode, amount) =>');
        expect(paintStart).toBeGreaterThan(-1);
        const paintEnd = transparency.indexOf('function shouldApplyDynamicBackground', paintStart);
        const paint = transparency.slice(paintStart, paintEnd);
        expect(paint).toContain('shouldKeepRouteFadeCssBackground');
        expect(paint).toContain('buildLuxuryRoutePanelGradient');
        expect(paint).toContain('buildHomeStyleSurfaceBackground');
        expect(paint).not.toContain('radial-gradient(circle at 6%');
        expect(paint).not.toContain('radial-gradient(circle at 12%');
        expect(paint).not.toMatch(/if\s*\(\s*!_isHighTransBg\s*&&\s*isLmsRoute\s*&&/);
    });

    it('never gates LMS large shells on high-opacity skip (avoids blue wash at slider >=80)', () => {
        const transparency = readSource('assets/js/shared/lux-transparency.js');
        expect(transparency).not.toMatch(/if\s*\(\s*!_isHighTransBg\s*&&\s*isLmsRoute\s*&&/);
        expect(transparency).toContain('isCssOwnedSurface');
        expect(transparency).toContain('shouldKeepRouteFadeCssBackground');
    });
});
