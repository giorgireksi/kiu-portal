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
        expect(css).toMatch(/:has\(\.is-open\)[\s\S]*z-index:\s*900/);
    });

    it('strips nested control blur in dashboard paint blur-strip', () => {
        const css = readSource('assets/css/lux-shell.css');
        const blurStripBlock = css.match(
            /\.lux-nav-item, \.lux-quick-btn[\s\S]*?backdrop-filter:\s*none/
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

    it('routes fade CSS through lux-transparency route runtime', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        expect(routeRuntime).toContain('shouldKeepRouteFadeCssBackground');
    });

    it('softens hover transforms inside glass parents (reduced-motion)', () => {
        const paintCss = readSource('assets/css/lux-controls.css');
        expect(paintCss).toMatch(
            /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.lux-primary-btn:hover[\s\S]*transform:\s*none/
        );
    });

    it('calms social route hovers via bare-shell era (no social-rebuild CSS)', () => {
        expectRetiredCss('social-rebuild.css');
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        expect(routeRuntime).toContain('shouldKeepSocialFadeCssBackground');
    });

    it('calms lms route hovers inside glass parents', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        expect(routeRuntime).toContain("document.body.classList.contains('lux-route-lms')");
        expect(routeRuntime).toContain('lms-clean-subjects');
    });

    it('strips nested topbar control blur on dashboard paint', () => {
        const shellCss = readSource('assets/css/lux-shell.css');
        const controlsCss = readSource('assets/css/lux-controls.css');
        const foucCss = readSource('assets/css/lux-fouc-ht.css');
        expect(shellCss).toMatch(/\.lux-nav-item[\s\S]*backdrop-filter:\s*none/);
        expect(shellCss).toMatch(/\.lux-nav-item::before/);
        expect(shellCss).toMatch(/\.lux-user-chip[\s\S]*backdrop-filter:\s*none/);
        expect(shellCss).not.toMatch(/\.lux-nav-item:hover:not\(\.is-active\)\s*\{[^}]*box-shadow/);
        expect(shellCss).toMatch(/\.lux-picker-btn, \.lux-icon-btn[\s\S]*transition:\s*transform 0\.18s ease;/);
        expect(shellCss).not.toMatch(/\.lux-picker-btn, \.lux-icon-btn[\s\S]*border-color 0\.18s/);
        expect(controlsCss).toMatch(/\.lux-icon-btn\s*\{[^}]*transition:\s*transform \.18s ease;/);
        expect(controlsCss).not.toMatch(/\.lux-icon-btn\s*\{[^}]*box-shadow \.18s/);
        expect(controlsCss).toMatch(
            /\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn\s*\{[\s\S]*?transition:\s*transform 0\.38s/
        );
        expect(controlsCss).not.toMatch(
            /\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn\s*\{[\s\S]*?transition:[^;]*box-shadow/
        );
        expect(controlsCss).not.toMatch(/\.lux-control\s*\{[^}]*transition:\s*all/);
        expect(controlsCss).toMatch(/\.lux-icon-btn:hover::after/);
        expect(controlsCss).toMatch(
            /\.lux-primary-btn, \.lux-secondary-btn, \.lux-ghost-btn\s*\{[\s\S]*?backdrop-filter:\s*none/
        );
        expect(foucCss).toMatch(/html\.lux-shell-chrome-motion #lux-shell :is\([\s\S]*\.lux-nav-item[\s\S]*backdrop-filter:\s*none !important/);
        expect(foucCss).not.toMatch(/html\.lux-shell-chrome-motion #lux-shell\s*\{[\s\S]*backdrop-filter:\s*none !important/);
        expect(shellCss).toMatch(/#lux-shell[\s\S]*backdrop-filter:\s*var\(--lux-shell-sidebar-blur\)/);
        expect(shellCss).toMatch(
            /body\.lux-full-paint\.lux-unified-shell #lux-topbar \.lux-topbar-shell\s*\{[\s\S]*?backdrop-filter:\s*none/
        );
        expect(shellCss).toMatch(
            /body\.lux-full-paint\.lux-unified-shell #lux-topbar \.lux-topbar-shell\s*\{[\s\S]*?--lux-soft-chrome-surface/
        );
        expect(foucCss).toMatch(/\.lux-user-menu button::before/);
        expect(shellCss).toMatch(/#lux-topbar[\s\S]*z-index:\s*1000 !important/);
        expect(shellCss).not.toMatch(/#lux-shell, \.lux-card\s*\{[^}]*will-change/);
        expect(shellCss).toMatch(/html\.lux-shell-chrome-motion #lux-shell\s*\{[\s\S]*?will-change:\s*transform/);
        expect(shellCss.replace(/html\.lux-shell-chrome-motion #lux-shell\s*\{[\s\S]*?\}/g, '')).not.toMatch(
            /#lux-shell\s*\{[^}]*will-change:\s*transform/
        );
        expect(controlsCss).toMatch(
            /#lux-topbar \.lux-topbar-shell :is\(\.lux-picker-btn, \.lux-icon-btn\)[\s\S]*backdrop-filter:\s*none/
        );
        expect(controlsCss).toMatch(
            /#page-home #lux-home-shell \.lux-home-merged :is\([\s\S]*backdrop-filter:\s*none/
        );
    });
});
