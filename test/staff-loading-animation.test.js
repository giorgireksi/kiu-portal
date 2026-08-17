const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('staff loading animation', () => {
    it('loads staff motion assets and the shared engine', () => {
        const html = readSource('staff.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        const runtimeIndex = html.indexOf('staff-loading-runtime.js?v=20260813-command-motion1');

        expect(html).toContain('assets/css/staff-loading.css?v=20260810-staffassembly4');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-contentpaint1');
        expect(html).toContain('assets/js/pages/staff-loading-runtime.js?v=20260813-command-motion1');
        expect(html).toContain('staff-command-center.js');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(runtimeIndex).toBeGreaterThan(sharedIndex);
        expect(html.match(/staff-loading\.css/g)).toHaveLength(1);
        expect(html.match(/staff-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('gates the reveal on hub shells and spinner absence', () => {
        const runtime = readSource('assets/js/pages/staff-loading-runtime.js');

        expect(runtime).toContain("observerSelector: '#staff-content'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#staff-content')");
        expect(runtime).toContain('lux-route-staff');
        expect(runtime).toContain("dataset?.luxPage === 'staff'");
        expect(runtime).toContain('staff\\.html');
        expect(runtime).toContain('.staff-shell-loading-state');
        expect(runtime).toContain('.staff-hub-shell, .staff-hub-profile, .staff-hub-form-settings');
        expect(runtime).toContain('animateLateAfterReady: false');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('kiuStaffAssemblyState');
        expect(runtime).toContain('kiu-staff-assembly-target');
        expect(runtime).toContain('flattenInnerTargets: true');
    });

    it('divides directory into component flights like news/chancellery', () => {
        const runtime = readSource('assets/js/pages/staff-loading-runtime.js');

        [
            '.staff-hub-shell',
            '.staff-hub-controls',
            '.staff-hub-directory-panel',
            '.staff-hub-directory-head',
            '.staff-hub-table-wrap',
            '.staff-hub-table tbody tr',
            '.staff-hub-empty',
            '.staff-hub-profile',
            '.staff-hub-toolbar',
            '.staff-hub-form-settings',
            '.staff-hub-builder-rail',
            '.staff-hub-builder-canvas',
            '.staff-hub-studio-field-row',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("outerFlightSelector: [\n            '.staff-hub-controls'");
        expect(runtime).toContain("hierarchySelector: [\n            '.staff-hub-shell'");
        expect(runtime).toContain('.staff-hub-directory-head');
        expect(runtime).toContain('.staff-hub-table-wrap');
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).not.toContain('transformSafeSelector');
        expect(runtime).not.toContain('flightTiming:');
        expect(runtime).not.toContain('controlSelector: []');
        expect(runtime).not.toContain('.staff-hub-person');
        expect(runtime).not.toContain('.staff-hub-avatar');
        expect(runtime).not.toContain("'span'");
        expect(runtime).not.toContain("'strong'");
    });

    it('excludes modal surfaces and uses the shared timing profile', () => {
        const runtime = readSource('assets/js/pages/staff-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const html = readSource('staff.html');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #staff-command-modal-root, #modal-overlay, #mobile-action-sheet, [role=\"dialog\"], #staff-command-toast'"
        );
        expect(html).toContain('id="staff-command-modal-root"');
        expect(html).toContain('id="staff-command-toast"');
        expect(html).toContain('id="modal-overlay"');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
    });

    it('keeps loading CSS motion-only with component surface staging', () => {
        const css = readSource('assets/css/staff-loading.css');
        const readyRule = css.match(
            /body\.staff-assembly-ready #staff-content \.kiu-staff-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('.staff-shell-loading-state');
        expect(css).toContain('.staff-hub-controls');
        expect(css).toContain('.staff-hub-directory-panel');
        expect(css).toContain('.staff-hub-directory-head');
        expect(css).toContain('.staff-hub-table-wrap');
        expect(css).toContain('.staff-hub-table tbody tr');
        expect(css).toContain('animation: none !important');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).not.toContain('.home-hover-chip');
        expect(css).not.toContain('.lux-data-card');
        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
