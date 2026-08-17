const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Orders loading animation', () => {
    it('loads the recipient orders motion assets and shared engine in order', () => {
        const html = readSource('orders.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        const runtimeIndex = html.indexOf('orders-loading-runtime.js?v=20260810-ordersassembly2');

        expect(html).toContain('assets/css/orders-loading.css?v=20260810-ordersassembly2');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        expect(html).toContain('assets/js/pages/orders-loading-runtime.js?v=20260810-ordersassembly2');
        expect(html).toContain('assets/js/shared/orders-inbox.js?v=20260810-rolelink3');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(runtimeIndex).toBeGreaterThan(sharedIndex);
        expect(html.match(/orders-loading\.css/g)).toHaveLength(1);
        expect(html.match(/orders-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets only the recipient orders route and waits for dynamic inbox content', () => {
        const runtime = readSource('assets/js/pages/orders-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-orders'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-orders')");
        expect(runtime).toContain('lux-route-orders');
        expect(runtime).toContain('orders\\.html');
        expect(runtime).toContain('lux-route-admin-orders');
        expect(runtime).toContain('lux-entry-admin-orders');
        expect(runtime).toContain('[data-orders-inbox-shell="1"]');
        expect(runtime).toContain('#orders-inbox-hero-main');
        expect(runtime).toContain('#orders-inbox-hero-stats');
        expect(runtime).toContain('#orders-inbox-list-panel');
        expect(runtime).toContain('#orders-inbox-detail-panel');
        expect(runtime).toContain('orders-detail-empty:not([hidden])');
        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('kiuOrdersAssemblyState');
        expect(runtime).toContain('kiu-orders-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('does not replay assembly when inbox filters or status tabs rerender', () => {
        const runtime = readSource('assets/js/pages/orders-loading-runtime.js');
        const inbox = readSource('assets/js/shared/orders-inbox.js');

        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(inbox).toContain('function settleRecipientOrdersAssemblyBeforeUpdate(container, options = {})');
        expect(inbox).toContain('options.suppressAssembly');
        expect(inbox).toContain('motion.forceReady();');
        expect(inbox).toContain('function renderOrdersInboxPage(options = {})');
        expect(inbox).toContain('renderOrdersInboxPage({ suppressAssembly: true });');
        expect(inbox).toContain('settleRecipientOrdersAssemblyBeforeUpdate(container, options);');
        expect(inbox).not.toContain('settleRecipientOrdersAssemblyBeforeUpdate(container);');
    });

    it('stages inbox components and excludes transient surfaces', () => {
        const runtime = readSource('assets/js/pages/orders-loading-runtime.js');

        [
            '[data-orders-inbox-shell="1"]',
            '.orders-inbox-workspace',
            '.orders-inbox-hero',
            '.orders-inbox-hero-side',
            '.orders-inbox-workspace-grid',
            '#orders-inbox-list-panel',
            '#orders-inbox-detail-panel',
            '.orders-inbox-layout-filters',
            '.orders-list-wrap',
            '.orders-item',
            '.orders-list-empty',
            '.orders-detail-empty',
            '.orders-metric-card',
            '.orders-attachment-card',
            '.orders-recipient-card',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));

        expect(runtime).toContain("outerFlightSelector: [\n            '.orders-inbox-workspace'");
        expect(runtime).toContain("hierarchySelector: [\n            '[data-orders-inbox-shell=\"1\"]'");
        expect(runtime).toContain('#mobile-action-sheet');
        expect(runtime).toContain('[role="dialog"]');
        expect(runtime).toContain('.lux-picker-panel');
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('keeps loading CSS motion-only and supports reduced motion', () => {
        const css = readSource('assets/css/orders-loading.css');
        const readyRule = css.match(
            /body\.orders-assembly-ready #page-orders \.kiu-orders-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('[data-orders-inbox-shell="1"]');
        expect(css).toContain('.orders-inbox-workspace');
        expect(css).toContain('.orders-item');
        expect(css).toContain('.orders-list-empty');
        expect(css).toContain('.orders-detail-empty');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
