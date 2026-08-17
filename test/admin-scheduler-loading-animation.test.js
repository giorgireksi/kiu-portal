const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('admin-scheduler loading animation', () => {
    it('loads scheduler-local motion assets and the shared engine', () => {
        const html = readSource('admin-scheduler.html');

        expect(html).toContain('assets/css/admin-scheduler-loading.css?v=20260808-schassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-assemblyfilter1');
        expect(html).toContain('assets/js/pages/admin-scheduler-loading-runtime.js?v=20260808-schassembly1');
        expect(html.match(/admin-scheduler-loading\.css/g)).toHaveLength(1);
        expect(html.match(/admin-scheduler-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets the visible scheduler workspace at granular levels', () => {
        const runtime = readSource('assets/js/pages/admin-scheduler-loading-runtime.js');

        [
            '.sch-sidebar',
            '.sch-grid-shell',
            '.sch-rail-hero',
            '.sch-rail-section',
            '.sch-stat-card',
            '.sch-control-group',
            '.sch-palette-list',
            '.sch-grid-topline',
            '.sch-week-nav',
            '#scheduler-grid',
            '.sch-grid-empty',
            'button',
            'input',
            'select'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain('.sch-rail-signal-grid');
        expect(runtime).toContain('.sch-control-grid');
        expect(runtime).toContain('kiu-admin-scheduler-assembly-target');
        expect(runtime).toContain('kiu-admin-scheduler-assembly-outer');
        expect(runtime).toContain('kiuAdminSchedulerAssemblyState');
    });

    it('excludes hidden templates and preserves shared interaction cleanup', () => {
        const runtime = readSource('assets/js/pages/admin-scheduler-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const css = readSource('assets/css/admin-scheduler-loading.css');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #mobile-action-sheet'"
        );
        expect(runtime).not.toContain('sch-modal-template');
        expect(runtime).not.toContain('sch-preset-manager-template');
        expect(shared).toContain('element.closest(hiddenSelector)');
        expect(shared).toContain('try { animation.cancel(); } catch (_error) {}');
        expect(shared).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
        expect(css).not.toContain('body.admin-tools-assembly');
        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
    });

    it('keeps ready-state CSS clear of transform and filter overrides', () => {
        const css = readSource('assets/css/admin-scheduler-loading.css');
        const readyRule = css.match(
            /body\.admin-scheduler-assembly-ready[^{}]*\{([^}]*)\}/
        )?.[1] || '';

        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
