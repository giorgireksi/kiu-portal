const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('news loading animation', () => {
    it('loads news motion assets and the shared engine', () => {
        const html = readSource('news.html');

        expect(html).toContain('assets/css/news-loading.css?v=20260808-newsassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
        expect(html).toContain('assets/js/pages/news-loading-runtime.js?v=20260808-newsassembly1');
        expect(html.match(/news-loading\.css/g)).toHaveLength(1);
        expect(html.match(/news-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('gates the reveal on the dynamic shell and news-ready state', () => {
        const runtime = readSource('assets/js/pages/news-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-news'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-news')");
        expect(runtime).toContain("root?.querySelector('.newsx-shell')");
        expect(runtime).toContain("root.dataset.newsReady === 'true'");
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuNewsAssemblyState');
        expect(runtime).toContain('kiu-news-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('targets news hierarchy, feed content, cards, and controls', () => {
        const runtime = readSource('assets/js/pages/news-loading-runtime.js');

        [
            '.newsx-shell',
            '.newsx-sidebar',
            '.newsx-main',
            '.newsx-header-bar',
            '.newsx-filter-grid',
            '.newsx-feed',
            '.newsx-feed-list',
            '[data-news-post-host="1"]',
            '.newsx-feed-card',
            '.newsx-post-tile',
            '.newsx-card-body',
            '.newsx-attachment-gallery',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("hierarchySelector: [\n            '.newsx-sidebar'");
        expect(runtime).toContain("outerFlightSelector: [\n            '.newsx-sidebar'");
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('excludes hidden and modal surfaces while preserving shared timing', () => {
        const runtime = readSource('assets/js/pages/news-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const html = readSource('news.html');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #modal-overlay, #mobile-action-sheet, [role=\"dialog\"]'"
        );
        expect(html).toContain('newsx-publisher-modal');
        expect(html).toContain('newsx-confirm-modal');
        expect(html).toContain('newsx-sections-modal');
        expect(html).toContain('newsx-attachment-viewer-modal');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only and preserves post-load interaction', () => {
        const css = readSource('assets/css/news-loading.css');
        const readyRule = css.match(
            /body\.news-assembly-ready #page-news \.kiu-news-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('[data-news-post-host="1"]');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
