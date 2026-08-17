const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Student Service loading animation', () => {
    it('loads Student Service motion assets and the shared engine', () => {
        const html = readSource('student-service.html');

        expect(html).toContain('assets/css/student-service-loading.css?v=20260808-ssassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        expect(html).toContain('assets/js/pages/student-service-loading-runtime.js?v=20260808-ssassembly1');
        expect(html.match(/student-service-loading\.css/g)).toHaveLength(1);
        expect(html.match(/student-service-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('gates the reveal on the dynamic shell and rendered page body', () => {
        const runtime = readSource('assets/js/pages/student-service-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#page-student-service'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-student-service')");
        expect(runtime).toContain('[data-student-service-page-shell="1"]');
        expect(runtime).toContain('#student-service-page-body > *');
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuStudentServiceAssemblyState');
        expect(runtime).toContain('kiu-student-service-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('targets lane chrome, service zones, lazy content, text, and controls', () => {
        const runtime = readSource('assets/js/pages/student-service-loading-runtime.js');

        [
            '[data-student-service-page-hero="1"]',
            '[data-student-service-page-switcher="1"]',
            '#student-service-page-body',
            '.student-service-lane-switcher',
            '.student-service-lane-choice-card',
            '.student-service-zone',
            '.student-service-workbench-merged',
            '.student-service-ticket-inbox-row',
            '.student-service-ticket-conversation',
            '.student-service-ticket-composer',
            '.student-service-qa-card',
            '.student-service-qa-thread-comments',
            '.student-service-guidance-workspace',
            '.student-service-loading-state',
            '[class*="student-service-"]',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("hierarchySelector: [\n            '[data-student-service-page-hero=\"1\"]'");
        expect(runtime).toContain("outerFlightSelector: [\n            '#student-service-page-body'");
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('excludes modal surfaces and uses the shared timing profile', () => {
        const runtime = readSource('assets/js/pages/student-service-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const html = readSource('student-service.html');
        const qa = readSource('assets/js/pages/student-service-qa.js');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #modal-overlay, #mobile-action-sheet, #student-service-modal-root, [role=\"dialog\"]'"
        );
        expect(html).toContain('id="student-service-modal-root"');
        expect(qa).toContain('role="dialog"');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only and preserves post-load interaction', () => {
        const css = readSource('assets/css/student-service-loading.css');
        const readyRule = css.match(
            /body\.student-service-assembly-ready #page-student-service \.kiu-student-service-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('#student-service-page-body > *');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
