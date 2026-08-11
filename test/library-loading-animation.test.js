const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Library loading animation', () => {
    it('loads the library motion assets and shared engine in order', () => {
        const html = readSource('library.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260810-assembly25');
        const runtimeIndex = html.indexOf('library-loading-runtime.js?v=20260810-libassembly2');

        expect(html).toContain('assets/css/library-loading.css?v=20260810-libassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260810-assembly25');
        expect(html).toContain('assets/js/pages/library-loading-runtime.js?v=20260810-libassembly2');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(runtimeIndex).toBeGreaterThan(sharedIndex);
        expect(html.match(/library-loading\.css/g)).toHaveLength(1);
        expect(html.match(/library-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets only the readonly library route and waits for catalog content', () => {
        const runtime = readSource('assets/js/pages/library-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-library'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-library')");
        expect(runtime).toContain('lux-route-library');
        expect(runtime).toContain('library\\.html');
        expect(runtime).toContain('lux-route-admin-library');
        expect(runtime).toContain('lux-entry-admin-library');
        expect(runtime).toContain('[data-library-catalog-shell="1"]');
        expect(runtime).toContain('#admin-library-catalog-tabs');
        expect(runtime).toContain('.admin-library-catalog-table thead tr');
        expect(runtime).toContain('#book-catalog-body');
        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('kiuLibraryAssemblyState');
        expect(runtime).toContain('kiu-library-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('does not replay animation when switching catalog sections', () => {
        const runtime = readSource('assets/js/pages/library-loading-runtime.js');
        const view = readSource('assets/js/shared/library-catalog-view.js');

        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(view).toContain('const motion = global.__kiuLibraryLoadingMotion;');
        expect(view).toContain('motion.forceReady();');
    });

    it('stages catalog components and excludes transient surfaces', () => {
        const runtime = readSource('assets/js/pages/library-loading-runtime.js');

        [
            '[data-library-catalog-shell="1"]',
            '.library-catalog-filters-panel',
            '.admin-library-metric-card',
            '.admin-library-catalog-card',
            '.admin-library-catalog-head',
            '.admin-library-tab-btn',
            '.admin-library-scroll-wrap',
            '.admin-library-catalog-table thead tr',
            '.admin-library-catalog-row',
            '.admin-library-empty-row',
            '.admin-library-catalog-foot',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));

        expect(runtime).toContain("outerFlightSelector: [\n            '.library-catalog-filters-panel'");
        expect(runtime).toContain("hierarchySelector: [\n            '[data-library-catalog-shell=\"1\"]'");
        expect(runtime).toContain('#mobile-action-sheet');
        expect(runtime).toContain('[role="dialog"]');
        expect(runtime).toContain('.lux-picker-panel');
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('keeps loading CSS motion-only and supports reduced motion', () => {
        const css = readSource('assets/css/library-loading.css');
        const readyRule = css.match(
            /body\.library-assembly-ready #page-library \.kiu-library-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('[data-library-catalog-shell="1"]');
        expect(css).toContain('.library-catalog-filters-panel');
        expect(css).toContain('.admin-library-catalog-row');
        expect(css).toContain('.admin-library-empty-row');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
