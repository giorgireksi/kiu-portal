import { describe, expect, it } from 'vitest';

import { expectRetiredCss, readBareStackCss, readSource } from './helpers/bare-shell-css.js';

function extractFunctionBody(source, functionName) {
    const start = source.indexOf(`function ${functionName}`);
    if (start < 0) return '';
    const braceStart = source.indexOf('{', start);
    if (braceStart < 0) return '';
    let depth = 0;
    for (let index = braceStart; index < source.length; index += 1) {
        const char = source[index];
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return source.slice(start, index + 1);
        }
    }
    return '';
}

function dashboardStackCss() {
    return readBareStackCss({ includeIndex: true })
        + readSource('assets/css/lux-shell.css')
        + readSource('assets/css/lux-controls.css');
}

describe('global hover flicker prevention', () => {
    it('does not elevate lux-panel on hover with z-index 500', () => {
        const css = dashboardStackCss();
        expect(css).not.toMatch(/\.lux-panel:hover[\s\S]*?z-index:\s*500/);
    });

    it('elevates lux-panel with open dropdown via :has(.is-open) at z-index 900', () => {
        const css = dashboardStackCss();
        expect(css).toMatch(/\.lux-panel:has\(\.is-open\)[\s\S]*z-index:\s*900/);
    });

    it('strips nested control blur in dashboard paint blur-strip', () => {
        const css = readSource('assets/css/lux-shell.css');
        const blurStripBlock = css.match(
            /body\.lux-full-paint \.lux-nav-item[\s\S]*?backdrop-filter:\s*none/
        )?.[0] || '';

        expect(blurStripBlock).toContain('.lux-quick-btn');
        expect(blurStripBlock).toContain('.lux-stat');
        expect(blurStripBlock).toContain('.lux-pill');
        expect(css).toMatch(/\.lux-nav-item[\s\S]*backdrop-filter:\s*none/);
    });

    it('does not elevate lux-panel on focus-within with z-index 500', () => {
        const css = dashboardStackCss();
        expect(css).not.toMatch(/\.lux-panel:focus-within[\s\S]*?z-index:\s*500/);
    });

    it('routes fade CSS through shouldKeepRouteFadeCssBackground aggregator', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        const keepFn = extractFunctionBody(utilities, 'shouldKeepRouteFadeCssBackground');

        expect(keepFn).toContain('shouldKeepSocialFadeCssBackground');
        expect(keepFn).toContain('shouldKeepAdminLibraryFadeCssBackground');
        expect(utilities).toMatch(
            /keepAdminLibraryFadeCss = shouldKeepAdminLibraryFadeCssBackground\(el\)/
        );
    });

    it('softens hover transforms inside glass parents (reduced-motion)', () => {
        const paintCss = readSource('assets/css/lux-controls.css');
        expect(paintCss).toMatch(
            /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.lux-primary-btn:hover[\s\S]*transform:\s*none/
        );
    });

    it('calms social route hovers via bare-shell era (no social-rebuild CSS)', () => {
        expectRetiredCss('social-rebuild.css');
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).toContain('function shouldKeepSocialFadeCssBackground(el)');
    });

    it('calms lms route hovers inside glass parents', () => {
        expect(css).toMatch(
            /body\.lux-route-lms :is\([\s\S]*?\.lux-primary-btn[\s\S]*?\.lux-secondary-btn[\s\S]*?\.lms-clean-subject-card[\s\S]*?\.lux-lms-subject-card\):hover[\s\S]*transform:\s*none !important/
        );
        expect(css).toMatch(
            /body\.lux-route-lms :is\([\s\S]*\):hover[\s\S]*filter:\s*none !important/
        );
    });

    it('strips nested topbar control blur on dashboard paint', () => {
        const css = readSource('assets/css/lux-shell.css');
        expect(css).toMatch(/body\.lux-full-paint \.lux-nav-item[\s\S]*backdrop-filter:\s*none/);
        expect(css).toMatch(/body\.lux-full-paint #lux-topbar[\s\S]*z-index:\s*1000 !important/);
    });
});
