const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('study-card loading animation', () => {
    it('loads study-card motion assets and the shared engine', () => {
        const html = readSource('study-card.html');

        expect(html).toContain('assets/css/study-card-loading.css?v=20260808-scardassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-timetableobserver1');
        expect(html).toContain('assets/js/pages/study-card-loading-runtime.js?v=20260808-scardassembly2');
        expect(html.match(/study-card-loading\.css/g)).toHaveLength(1);
        expect(html.match(/study-card-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets dynamic terms, tables, rows, cells, and controls', () => {
        const runtime = readSource('assets/js/pages/study-card-loading-runtime.js');

        [
            '.study-card-command-deck',
            '.study-card-workspace',
            '.study-card-shell',
            '#study-card-terms-region',
            '.study-card-term-block',
            '.study-card-term-header',
            '.study-card-semester-table',
            '.study-card-term-row',
            '.study-card-cell',
            '.study-card-assessment-btn',
            '.study-card-empty',
            'button'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("observerSelector: '#page-study-card'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-study-card')");
        expect(runtime).toContain('isContentReady: () => Boolean(');
        expect(runtime).toContain('kiuStudyCardAssemblyState');
        expect(runtime).toContain('kiu-study-card-assembly-target');
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain("hierarchySelector: [\n            '.study-card-workspace'\n        ]");
        expect(runtime).not.toContain('flightTiming:');
    });

    it('uses registration-equivalent timing and excludes overlays', () => {
        const runtime = readSource('assets/js/pages/study-card-loading-runtime.js');
        const registration = readSource('assets/js/pages/registration-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #modal-overlay, #mobile-action-sheet, #study-card-assessment-window'"
        );
        expect(runtime).toContain('maxShellWaitMs: 900');
        expect(runtime).toContain('contentWaitMaxMs: 900');
        expect(runtime).toContain('lateAssemblyGraceMs: 145');
        expect(runtime).toContain('maxAssemblyWindowMs: 1650');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
        expect(registration).toContain('maxTotalAssemblyMs: 2450');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
    });

    it('keeps loading CSS motion-only and preserves post-load interaction', () => {
        const css = readSource('assets/css/study-card-loading.css');
        const readyRule = css.match(
            /body\.study-card-assembly-ready #page-study-card \.kiu-study-card-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('#study-card-container > .study-card-shell');
        expect(css).toContain('.study-card-term-block');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
