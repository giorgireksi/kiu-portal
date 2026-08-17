const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('admin library loading animation', () => {
    it('loads admin library motion assets and the shared engine', () => {
        const html = readSource('admin-library.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        const runtimeIndex = html.indexOf('admin-library-loading-runtime.js?v=20260810-alibassembly1');

        expect(html).toContain('assets/css/admin-library-loading.css?v=20260810-alibassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        expect(html).toContain('assets/js/pages/admin-library-loading-runtime.js?v=20260810-alibassembly1');
        expect(html).toContain('admin-library.js');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(runtimeIndex).toBeGreaterThan(sharedIndex);
        expect(html.match(/admin-library-loading\.css/g)).toHaveLength(1);
        expect(html.match(/admin-library-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('gates the reveal on shell, tabs, and catalog rows', () => {
        const runtime = readSource('assets/js/pages/admin-library-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-library'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-library')");
        expect(runtime).toContain('lux-route-admin-library');
        expect(runtime).toContain('lux-entry-admin-library');
        expect(runtime).toContain("dataset?.luxEntry === 'admin-library'");
        expect(runtime).toContain('admin-library\\.html');
        expect(runtime).toContain('[data-admin-library-shell="1"]');
        expect(runtime).toContain('#admin-library-catalog-tabs');
        expect(runtime).toContain('#book-catalog-body');
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuAdminLibraryAssemblyState');
        expect(runtime).toContain('kiu-admin-library-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('divides the page into component flights like staff/chancellery', () => {
        const runtime = readSource('assets/js/pages/admin-library-loading-runtime.js');

        [
            '[data-admin-library-shell="1"]',
            '.alib-panel--entry',
            '.alib-panel--filters',
            '.alib-form-grid',
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
        expect(runtime).toContain("outerFlightSelector: [\n            '.alib-panel--entry'");
        expect(runtime).toContain("hierarchySelector: [\n            '[data-admin-library-shell=\"1\"]'");
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('transformSafeSelector');
        expect(runtime).not.toContain('flightTiming:');
        expect(runtime).not.toContain('controlSelector: []');
        expect(runtime).not.toContain('.admin-library-catalog-cell');
        expect(runtime).not.toContain("'span'");
        expect(runtime).not.toContain("'strong'");
    });

    it('excludes modal surfaces and uses the shared timing profile', () => {
        const runtime = readSource('assets/js/pages/admin-library-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const html = readSource('admin-library.html');

        expect(runtime).toContain('#library-schema-overlay');
        expect(runtime).toContain('#library-filters-overlay');
        expect(runtime).toContain('#library-sections-overlay');
        expect(runtime).toContain('.admin-library-modal');
        expect(html).toContain('id="library-schema-overlay"');
        expect(html).toContain('id="library-filters-overlay"');
        expect(html).toContain('id="library-sections-overlay"');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only with component surface staging', () => {
        const css = readSource('assets/css/admin-library-loading.css');
        const readyRule = css.match(
            /body\.admin-library-assembly-ready #page-library \.kiu-admin-library-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('[data-admin-library-shell="1"]');
        expect(css).toContain('.alib-panel--entry');
        expect(css).toContain('.admin-library-metric-card');
        expect(css).toContain('.admin-library-catalog-head');
        expect(css).toContain('.admin-library-catalog-row');
        expect(css).toContain('.admin-library-empty-row');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).not.toContain('.home-hover-chip');
        expect(css).not.toContain('.lux-data-card');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
