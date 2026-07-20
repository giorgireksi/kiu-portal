import { describe, expect, it } from 'vitest';
import { expectRetiredCss, readSource } from './helpers/bare-shell-css.js';

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

describe('admin library hover flicker prevention', () => {
    it('keeps admin-library fade CSS authoritative via shouldKeepAdminLibraryFadeCssBackground', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency-route-runtime.js');
        const keepFn = extractFunctionBody(routeRuntime, 'shouldKeepAdminLibraryFadeCssBackground');

        expect(keepFn).toContain('lux-route-admin-library');
        expect(keepFn).toContain('lux-entry-admin-library');
        expect(keepFn).toContain('#page-library');
        expect(keepFn).toContain('admin-library-modal');
        expect(keepFn).toContain('alib-panel');
        expect(routeRuntime).toContain('function shouldKeepAdminLibraryFadeCssBackground');
        expect(routeRuntime).toContain('shouldKeepAdminLibraryFadeCssBackground(el)');
    });

    it('routes admin-library through shouldKeepRouteFadeCssBackground', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency-route-runtime.js');
        const routeFn = extractFunctionBody(routeRuntime, 'shouldKeepRouteFadeCssBackground');

        expect(routeFn).toContain('shouldKeepAdminLibraryFadeCssBackground');
    });

    it('avoids redundant page-local updateTransparency boot on admin-library.html', () => {
        const html = readSource('admin-library.html');

        expect(html).not.toMatch(/setTimeout\([\s\S]*?updateTransparency/);
        expectRetiredCss('admin-library-route.css');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('admin-library-route.css');
    });

    it('uses global stack for panel elevation (no per-route hover CSS)', () => {
        const shell = readSource('assets/css/lux-shell.css');
        expect(shell).toMatch(/\.lux-panel[\s\S]*:has\(\.is-open\)[\s\S]*z-index:\s*900/);
        expectRetiredCss('admin-library-route.css');
    });
});
