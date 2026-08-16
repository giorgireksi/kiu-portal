const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('admin-tools loading animation', () => {
    it('loads route-local motion assets only on admin-tools', () => {
        const html = readSource('admin-tools.html');

        expect(html).toContain('assets/css/admin-tools-loading.css?v=20260808-atoolsmotion3');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
        expect(html).toContain('assets/js/pages/admin-tools-loading-runtime.js?v=20260808-atoolsmotion7');
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/admin-tools-loading\.css/g)).toHaveLength(1);
        expect(html.match(/admin-tools-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('keeps the stylesheet motion-only and preserves shared visual ownership', () => {
        const css = readSource('assets/css/admin-tools-loading.css');

        expect(css).toContain('transform');
        expect(css).toContain('filter');
        expect(css).toContain('will-change');
        [
            'background',
            'border',
            'color',
            'box-shadow',
            'backdrop-filter',
            '::before',
            '::after',
            'blueprint',
            'caption',
            'meter'
        ].forEach((visualToken) => expect(css).not.toContain(visualToken));
    });

    it('does not suppress post-load hover or touch transforms', () => {
        const css = readSource('assets/css/admin-tools-loading.css');
        const readyRule = css.match(
            /body\.admin-tools-assembly-ready[^{}]*\{([^}]*)\}/
        )?.[1] || '';

        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });

    it('keeps completed flight effects tracked until final cleanup releases them', () => {
        const runtime = readSource('assets/js/pages/admin-tools-loading-runtime.js')
            + readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const runNode = runtime.match(
            /return animation\.finished[\s\S]*?\.then\(\(\) => \{([\s\S]*?)\n            \}\);/
        )?.[1] || '';

        expect(runNode).not.toContain('state.animations.delete(animation)');
        expect(runtime).toContain('state.animations.forEach((animation) =>');
        expect(runtime).toContain('try { animation.cancel(); } catch (_error) {}');
    });

    it('builds a nested assembly tree from existing panels and controls', () => {
        const runtime = readSource('assets/js/pages/admin-tools-loading-runtime.js')
            + readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const markup = readSource('assets/js/features/index-admin-tools.plain.js');

        expect(runtime).toContain('#lux-admin-curriculum-deck');
        expect(runtime).toContain('.lux-admin-tools-registration-panel');
        expect(runtime).toContain('.lux-admin-curriculum-control-band');
        expect(runtime).toContain('.lux-admin-curriculum-ops-panel');
        expect(runtime).toContain('.lux-admin-tools-registration-content');
        expect(runtime).toContain('.lux-stat');
        expect(runtime).toContain('.lux-program-subject-card');
        expect(runtime).toContain('.admin-reg-program-pane-head');
        expect(runtime).toContain('granularSelector');
        expect(runtime).not.toContain('INNER_SHELL_SELECTOR');
        expect(runtime).toContain('[class*="admin-reg-"]');
        expect(runtime).toContain("'strong'");
        expect(runtime).toContain("'span'");
        expect(runtime).toContain('button');
        expect(runtime).toContain('input');
        expect(runtime).toContain('select');
        expect(markup).toContain('id="lux-admin-curriculum-deck"');
        expect(markup).toContain('lux-admin-tools-registration-panel');
        expect(markup).toContain('lux-admin-curriculum-control-band lux-soft-chrome home-hover-chip');
        expect(runtime).toContain('target.animate');
        expect(runtime).toContain('Promise.all');
        expect(runtime).toContain('maxShellWaitMs: 1800');
        expect(runtime).toContain('lateAssemblyGraceMs: 145');
        expect(runtime).toContain('maxAssemblyWindowMs: 1650');
        expect(runtime).toContain('maxTotalAssemblyMs: 2450');
        expect(runtime).toContain('node.parent');
        expect(runtime).toContain('runSiblings');
        expect(runtime).toContain('state.nodeStatus');
        expect(runtime).toContain('kiu-admin-tools-assembly-outer');
        expect(runtime).toContain('kiu-admin-tools-assembly-inner');
        expect(runtime).toContain('kiu-admin-tools-assembly-structure');
        expect(runtime).toContain('registerStructures');
        expect(runtime).toContain('kiuAssemblyPhase');
        expect(runtime).toContain('node.depth === 0');
        expect(runtime).toContain("prefers-reduced-motion: reduce");
        expect(runtime).toContain('kiuAdminToolsAssemblyState');
        expect(runtime).toContain('__kiuAdminToolsLoadingMotion');
    });

    it('isolates outer flight from inner visibility and uses local child motion', () => {
        const css = readSource('assets/css/admin-tools-loading.css');
        const runtime = readSource('assets/js/pages/admin-tools-loading-runtime.js')
            + readSource('assets/js/shared/lux-assembly-loading-runtime.js');

        expect(css).toContain('.kiu-admin-tools-assembly-structure');
        expect(css).toContain('[data-kiu-assembly-phase="children"] .kiu-admin-tools-assembly-structure');
        expect(runtime).toContain("node.element.dataset[phaseDataset] = 'children'");
        expect(runtime).toContain("target.dataset[phaseDataset] = 'ready'");
        expect(runtime).toContain("isOuterShell ? '4px' : '2px'");
        expect(runtime).toContain("outerDurationMs: 400");
        expect(runtime).toContain("innerDurationMs: 260");
        expect(runtime).toContain("innerMinDurationMs: 180");
        expect(runtime).toContain("flightTiming.outerDurationMs");
        expect(runtime).toContain("flightTiming.innerDurationMs");
        expect(runtime).toContain("node.siblingIndex * (isOuterShell ? flightTiming.outerStaggerMs : flightTiming.innerStaggerMs)");
        expect(runtime).toContain("isOuterShell ? '-16px' : '0'");
    });

    it('excludes hidden modal descendants and does not replay after ready', () => {
        const runtime = readSource('assets/js/pages/admin-tools-loading-runtime.js')
            + readSource('assets/js/shared/lux-assembly-loading-runtime.js');

        [
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], #kiu-subject-builder-modal'",
            "root.dataset[rootStateDataset] = 'ready'",
            "state.phase === 'ready'",
            "function abort()",
            "startLateNodes(state.root, state.generation)"
        ].forEach((contract) => expect(runtime).toContain(contract));
    });

    it('does not import or recreate reference-only loading visuals', () => {
        const runtime = readSource('assets/js/pages/admin-tools-loading-runtime.js');
        const css = readSource('assets/css/admin-tools-loading.css');

        [
            'animaion.html',
            'lux-shell.css',
            'sweepfx',
            'bgGrid',
            'landglow',
            'spark',
            'slot'
        ].forEach((referenceToken) => {
            expect(runtime).not.toContain(referenceToken);
            expect(css).not.toContain(referenceToken);
        });
    });
});
