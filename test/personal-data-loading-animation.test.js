const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('personal-data loading animation', () => {
    it('loads personal-data motion assets and the shared engine', () => {
        const html = readSource('personal-data.html');

        expect(html).toContain('assets/css/personal-data-loading.css?v=20260808-pdassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-assemblyfilter1');
        expect(html).toContain('assets/js/pages/personal-data-loading-runtime.js?v=20260808-pdassembly1');
        expect(html.match(/personal-data-loading\.css/g)).toHaveLength(1);
        expect(html.match(/personal-data-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets the personal-data shell, workspace, cards, controls, and blueprint fields', () => {
        const runtime = readSource('assets/js/pages/personal-data-loading-runtime.js');

        [
            '.personal-data-shell',
            '.personal-data-hero',
            '.personal-data-command',
            '.personal-data-workspace-body',
            '.personal-data-identity-card',
            '.pd-password-form',
            '.personal-data-merged',
            '.personal-data-kpi-card',
            '.pd-progress',
            '.personal-data-blueprint-details',
            '#personal-data-blueprint-details-root',
            '.personal-data-blueprint-field',
            'button',
            'input',
            'select'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("observerSelector: '#page-personal-data'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-personal-data')");
        expect(runtime).toContain('isContentReady: () => Boolean(');
        expect(runtime).toContain('kiuPersonalDataAssemblyState');
        expect(runtime).toContain('kiu-personal-data-assembly-target');
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('uses the shared speed profile, excludes modal surfaces, and preserves interaction', () => {
        const runtime = readSource('assets/js/pages/personal-data-loading-runtime.js');
        const registration = readSource('assets/js/pages/registration-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const css = readSource('assets/css/personal-data-loading.css');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #modal-overlay, #mobile-action-sheet, [role=\"dialog\"]'"
        );
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
        expect(registration).toContain('maxTotalAssemblyMs: 2450');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
    });

    it('does not override personal-data hover or touch transforms after reveal', () => {
        const css = readSource('assets/css/personal-data-loading.css');
        const readyRule = css.match(
            /body\.personal-data-assembly-ready #page-personal-data \.kiu-personal-data-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
