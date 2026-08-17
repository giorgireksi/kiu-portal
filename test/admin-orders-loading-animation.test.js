const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('admin orders loading animation', () => {
    it('loads admin orders motion assets and the shared engine', () => {
        const html = readSource('admin-orders.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        const runtimeIndex = html.indexOf('admin-orders-loading-runtime.js?v=20260811-aordersfilter1');

        expect(html).toContain('assets/css/admin-orders-loading.css?v=20260810-aordersassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        expect(html).toContain('assets/js/pages/admin-orders-loading-runtime.js?v=20260811-aordersfilter1');
        expect(html).toContain('admin-orders.js');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(runtimeIndex).toBeGreaterThan(sharedIndex);
        expect(html.match(/admin-orders-loading\.css/g)).toHaveLength(1);
        expect(html.match(/admin-orders-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('gates the reveal on shell and three workspace panels', () => {
        const runtime = readSource('assets/js/pages/admin-orders-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#admin-orders-root'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#admin-orders-root')");
        expect(runtime).toContain('lux-route-admin-orders');
        expect(runtime).toContain('lux-entry-admin-orders');
        expect(runtime).toContain("dataset?.luxEntry === 'admin-orders'");
        expect(runtime).toContain('admin-orders\\.html');
        expect(runtime).toContain('[data-admin-orders-shell="1"]');
        expect(runtime).toContain('#admin-orders-command-panel');
        expect(runtime).toContain('#admin-orders-table-panel');
        expect(runtime).toContain('#admin-orders-detail-panel');
        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuAdminOrdersAssemblyState');
        expect(runtime).toContain('kiu-admin-orders-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('divides the workspace into component flights like admin library', () => {
        const runtime = readSource('assets/js/pages/admin-orders-loading-runtime.js');

        [
            '[data-admin-orders-shell="1"]',
            '.orders-admin-panel',
            '#admin-orders-command-panel',
            '.orders-admin-command-actions',
            '.orders-admin-command-copy',
            '#admin-orders-table-panel',
            '.orders-admin-audience-tabs',
            '.orders-admin-audience-tab',
            '.orders-admin-filter-strip',
            '.orders-inbox-layout-filters',
            '#admin-orders-detail-panel',
            '.orders-admin-sent-list',
            '.orders-admin-sent-item',
            '.orders-admin-sent-empty',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("outerFlightSelector: [\n            '.orders-admin-panel'");
        expect(runtime).toContain("hierarchySelector: [\n            '[data-admin-orders-shell=\"1\"]'");
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('transformSafeSelector');
        expect(runtime).not.toContain('flightTiming:');
        expect(runtime).not.toContain('controlSelector: []');
        expect(runtime).not.toContain('.orders-admin-sent-item__title');
        expect(runtime).not.toContain('.orders-admin-sent-item__meta');
        expect(runtime).not.toContain('.orders-recipient-row');
        expect(runtime).not.toContain("'span'");
        expect(runtime).not.toContain("'strong'");
    });

    it('excludes modal surfaces and uses the shared timing profile', () => {
        const runtime = readSource('assets/js/pages/admin-orders-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const html = readSource('admin-orders.html');

        expect(runtime).toContain('#admin-orders-create-overlay');
        expect(runtime).toContain('#admin-orders-thread-overlay');
        expect(runtime).toContain('#admin-orders-recipient-filter-overlay');
        expect(runtime).toContain('#admin-orders-titles-overlay');
        expect(runtime).toContain('#modal-studio');
        expect(html).toContain('id="modal-studio"');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only with component surface staging', () => {
        const css = readSource('assets/css/admin-orders-loading.css');
        const readyRule = css.match(
            /body\.admin-orders-assembly-ready #admin-orders-root \.kiu-admin-orders-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('[data-admin-orders-shell="1"]');
        expect(css).toContain('.orders-admin-panel');
        expect(css).toContain('.orders-admin-command-actions');
        expect(css).toContain('.orders-admin-audience-tabs');
        expect(css).toContain('.orders-admin-sent-item');
        expect(css).toContain('.orders-admin-sent-empty');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).not.toContain('.home-hover-chip');
        expect(css).not.toContain('.lux-data-card');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
