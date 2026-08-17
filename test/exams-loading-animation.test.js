const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Exams loading animation', () => {
    it('loads Exams motion assets and the shared engine', () => {
        const html = readSource('exams.html');

        expect(html).toContain('assets/css/exams-loading.css?v=20260810-examsassembly3');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        expect(html).toContain('assets/js/pages/exams-loading-runtime.js?v=20260810-examsassembly3');
        expect(html.match(/exams-loading\.css/g)).toHaveLength(1);
        expect(html.match(/exams-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        const examsIndex = html.indexOf('exams-loading-runtime.js?v=20260810-examsassembly3');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(examsIndex).toBeGreaterThan(sharedIndex);
    });

    it('gates the reveal on the dynamic shell and rendered regions', () => {
        const runtime = readSource('assets/js/pages/exams-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-exams'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-exams')");
        expect(runtime).toContain('[data-exam-shell="1"]');
        expect(runtime).toContain('#ex2-chrome-region > *');
        expect(runtime).toContain('#ex2-body-region > *');
        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).not.toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuExamsAssemblyState');
        expect(runtime).toContain('kiu-exams-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('targets Exams hierarchy with expanded outer flight like other desktop pages', () => {
        const runtime = readSource('assets/js/pages/exams-loading-runtime.js');

        [
            '.ex2-workspace-panel',
            '.ex2-workspace-head',
            '.ex2-workspace-stats',
            '.ex2-stat-chip',
            '.ex2-tab-row',
            '.ex2-workspace-tab-row',
            '.ex2-workspace-section',
            '.ex2-card-grid',
            '.ex2-quiz-card',
            '.ex2-session-card',
            '.ex2-panel',
            '.ex2-tab',
            'button',
            'input',
            'select',
            'textarea',
            '.ex2-btn'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).not.toContain('[class*="ex2-"]');
        expect(runtime).not.toMatch(/granularSelector: \[[\s\S]*?'span'/);
        expect(runtime).not.toMatch(/granularSelector: \[[\s\S]*?'strong'/);
        expect(runtime).toContain("hierarchySelector: [\n            '#ex2-chrome-region'");
        expect(runtime).toContain("outerFlightSelector: [\n            '.ex2-workspace-panel'");
        expect(runtime).toContain(".ex2-quiz-card'");
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('flightTiming:');
        expect(runtime).not.toContain('outerDurationMs: 300');
    });

    it('excludes modal surfaces and uses Chancellery-scale timing', () => {
        const runtime = readSource('assets/js/pages/exams-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #ex2-modal-region, .ex2-modal-overlay, .ex2-modal, #mobile-action-sheet, [role=\"dialog\"]'"
        );
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only and preserves post-load interaction', () => {
        const css = readSource('assets/css/exams-loading.css');
        const readyRule = css.match(
            /body\.exams-assembly-ready #page-exams \.kiu-exams-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('.ex2-workspace-panel');
        expect(css).toContain('[data-exam-shell="1"]');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
