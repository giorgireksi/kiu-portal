const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('programs loading animation', () => {
    it('loads programs-local motion assets and the shared engine', () => {
        const html = readSource('programs.html');

        expect(html).toContain('assets/css/programs-loading.css?v=20260808-progassembly4');
        expect(html).toContain('assets/css/lux-fouc-ht.css?v=20260808-popupguard1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-timetableobserver1');
        expect(html).toContain('assets/js/pages/programs-loading-runtime.js?v=20260808-progassembly13');
        expect(html.match(/programs-loading\.css/g)).toHaveLength(1);
        expect(html.match(/programs-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets the program deck, filters, and dynamic program root', () => {
        const runtime = readSource('assets/js/pages/programs-loading-runtime.js');

        [
            '.lux-program-command-deck',
            '.lux-prog-toolbar',
            '.lux-prog-intro',
            '.lux-section-kicker',
            '#programs-hero-title',
            '.lux-prog-control-band',
            '.lux-program-field',
            '#student-program-semester-filter',
            '#student-program-search',
            '.lux-prog-workspace',
            '#student-educational-program-root',
            '[class*="lux-program-"]',
            '[class*="program-"]',
            'button',
            'input',
            'select'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("observerSelector: '#page-programs'");
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#page-programs')");
        expect(runtime).toContain('isContentReady: () => Boolean(');
        expect(runtime).toContain('kiuProgramsAssemblyState');
        expect(runtime).toContain('kiu-programs-assembly-target');
        expect(runtime).toContain('kiu-programs-assembly-outer');
        expect(runtime).toContain('outerFlightSelector:');
        expect(runtime).toContain('hierarchySelector:');
        expect(runtime).toContain('animateLateAfterReady: true');
        expect(runtime).toContain('lateReadyWindowMs: 4000');
        expect(runtime).toContain('lateReplaySelector:');
        expect(runtime).toContain('structureSelector: []');
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('contentWaitMaxMs: 1800');
        expect(runtime).toContain('lateAssemblyGraceMs: 145');
        expect(runtime).toContain('maxAssemblyWindowMs: 1650');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
        expect(runtime).not.toContain('flightTiming:');
    });

    it('excludes hidden mobile content and preserves shared cleanup', () => {
        const runtime = readSource('assets/js/pages/programs-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const registration = readSource('assets/js/pages/registration-loading-runtime.js');
        const css = readSource('assets/css/programs-loading.css');
        const fouc = readSource('assets/css/lux-fouc-ht.css');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #mobile-action-sheet'"
        );
        expect(shared).toContain('element.closest(hiddenSelector)');
        expect(shared).toContain('try { animation.cancel(); } catch (_error) {}');
        expect(shared).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
        expect(shared).toContain("if (state.phase === 'active' && state.root)");
        expect(shared).toContain('startLateNodes(state.root, state.generation);');
        expect(registration).toContain('maxShellWaitMs: 1800');
        expect(registration).toContain('maxAssemblyWindowMs: 1650');
        expect(registration).toContain('maxTotalAssemblyMs: 2450');
        expect(shared).toContain('outerDurationMs: 400');
        expect(shared).toContain('innerDurationMs: 260');
        expect(css).not.toContain('body.registration-assembly');
        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('#page-programs .lux-program-grid');
        expect(css).toContain('#page-programs [data-programs-panel-shell]');
        expect(css).toContain('body.programs-assembly-ready #page-programs .kiu-programs-assembly-target.is-flight');
        expect(fouc).toContain(
            ':is(#lux-studio-backdrop, #lux-bg-mode-params-backdrop, #lux-bg-gallery-backdrop):not(.is-open)'
        );
    });

    it('does not override programs hover or touch transforms after reveal', () => {
        const css = readSource('assets/css/programs-loading.css');
        const readyRule = css.match(
            /body\.programs-assembly-ready #page-programs \.kiu-programs-assembly-target \{([^}]*)\}/
        )?.[1] || '';

        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
