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
    it('keeps admin-library fade CSS authoritative via isRouteOwnedSurface', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        const ownedFn = extractFunctionBody(routeRuntime, 'isRouteOwnedSurface');

        expect(ownedFn).toContain('lux-route-admin-library');
        expect(ownedFn).toContain('lux-entry-admin-library');
        expect(ownedFn).toContain('#page-library');
        expect(ownedFn).toContain('admin-library-modal');
        expect(ownedFn).toContain('alib-panel');
        expect(routeRuntime).toContain('function isCssOwnedSurface(el)');
        expect(routeRuntime).toContain('return isRouteOwnedSurface(el)');
    });

    it('routes admin-library through shouldKeepRouteFadeCssBackground', () => {
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        const routeFn = extractFunctionBody(routeRuntime, 'shouldKeepRouteFadeCssBackground');

        expect(routeFn).toContain('isCssOwnedSurface(el)');
    });

    it('avoids redundant page-local updateTransparency boot on admin-library.html', () => {
        const html = readSource('admin-library.html');

        expect(html).not.toMatch(/setTimeout\([\s\S]*?updateTransparency/);
        expectRetiredCss('admin-library-route.css');
    });
});
