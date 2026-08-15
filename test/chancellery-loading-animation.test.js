const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Chancellery loading animation', () => {
    it('loads Chancellery motion assets and the shared engine', () => {
        const html = readSource('chancellery.html');

        expect(html).toContain('assets/css/chancellery-loading.css?v=20260808-chanassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260811-assembly27');
        expect(html).toContain('assets/js/pages/chancellery-loading-runtime.js?v=20260811-chanfilter1');
        expect(html.match(/chancellery-loading\.css/g)).toHaveLength(1);
        expect(html.match(/chancellery-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('gates the reveal on the dynamic shell and rendered regions', () => {
        const runtime = readSource('assets/js/pages/chancellery-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-chancellery'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-chancellery')");
        expect(runtime).toContain('[data-chancellery-shell="1"]');
        expect(runtime).toContain('#chancellery-hero-region > *');
        expect(runtime).toContain('#chancellery-content-region > *');
        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        expect(shared).toContain('if (state.phase === \'ready\' && state.root) {');
        expect(shared).toContain('if (animateLateAfterReady && autoReplayLateMutations) {');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuChancelleryAssemblyState');
        expect(runtime).toContain('kiu-chancellery-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('targets Chancellery hierarchy, panels, cards, text, and controls', () => {
        const runtime = readSource('assets/js/pages/chancellery-loading-runtime.js');

        [
            '.lux-chancellery-hero-card',
            '.lux-chancellery-hero-side',
            '.lux-hero-signal',
            '.lux-chancellery-command-bar',
            '.lux-chancellery-routing-filter',
            '.lux-chancellery-workspace',
            '.lux-chancellery-workspace-split',
            '.lux-chancellery-list-panel',
            '.lux-chancellery-queue-item',
            '.lux-chancellery-detail-panel',
            '.lux-chancellery-finance-card',
            '[class*="chancellery-"]',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("hierarchySelector: [\n            '#chancellery-hero-region'");
        expect(runtime).toContain("outerFlightSelector: [\n            '.lux-chancellery-hero-card'");
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('excludes modal surfaces and uses the shared timing profile', () => {
        const runtime = readSource('assets/js/pages/chancellery-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const chancellery = readSource('assets/js/pages/chancellery.js');

        expect(chancellery).toContain("if (action === 'set-routing-filter')");
        expect(chancellery).toContain('syncChancelleryFilterRegions(\'routing\')');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #modal-overlay, #mobile-action-sheet, #chancellery-case-overlay, #chancellery-forward-overlay, #chancellery-document-editor-overlay, [role=\"dialog\"]'"
        );
        expect(chancellery).toContain("overlay.id = 'chancellery-case-overlay'");
        expect(chancellery).toContain("overlay.id = 'chancellery-forward-overlay'");
        expect(chancellery).toContain('role="dialog"');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only and preserves post-load interaction', () => {
        const css = readSource('assets/css/chancellery-loading.css');
        const readyRule = css.match(
            /body\.chancellery-assembly-ready #page-chancellery \.kiu-chancellery-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('.lux-chancellery-workspace');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
