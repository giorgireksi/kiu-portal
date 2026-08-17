const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('timetable loading animation', () => {
    it('loads timetable-local motion assets and the shared engine', () => {
        const html = readSource('timetable.html');

        expect(html).toContain('assets/css/timetable-loading.css?v=20260816-ttlowend1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260818-showhidefix1');
        expect(html).toContain('assets/js/pages/timetable-loading-runtime.js?v=20260817-observeroff1');
        expect(html.match(/timetable-loading\.css/g)).toHaveLength(1);
        expect(html.match(/timetable-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets timetable command, focus, stage, and dynamic grid elements', () => {
        const runtime = readSource('assets/js/pages/timetable-loading-runtime.js');

        [
            '.lux-timetable-command',
            '.lux-timetable-stage',
            '.lux-timetable-command-head',
            '.lux-timetable-view-switcher',
            '.lux-timetable-week-nav',
            '.lux-timetable-overview-row',
            '.lux-timetable-command-focus',
            '.lux-timetable-focus-title',
            '.lux-timetable-stage-head',
            '.lux-timetable-stage-status',
            '#timetable-master-container',
            '[class*="sch-"]',
            'button',
            'input',
            'select'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("observerSelector: '#page-timetable'");
        expect(runtime).toContain('observeMutations: false');
        expect(runtime).toContain('kiuTimetableAssemblyState');
        expect(runtime).toContain('kiu-timetable-assembly-target');
        expect(runtime).toContain('kiu-timetable-assembly-outer');
    });

    it('excludes hidden mobile content and keeps shared interaction cleanup', () => {
        const runtime = readSource('assets/js/pages/timetable-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const css = readSource('assets/css/timetable-loading.css');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #mobile-action-sheet'"
        );
        expect(runtime).not.toContain('sch-modal-template');
        expect(shared).toContain('element.closest(hiddenSelector)');
        expect(shared).toContain('try { animation.cancel(); } catch (_error) {}');
        expect(shared).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
        expect(css).not.toContain('body.admin-scheduler-assembly');
        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
    });

    it('does not override timetable hover or touch transforms after reveal', () => {
        const css = readSource('assets/css/timetable-loading.css');
        const readyRule = css.match(
            /body\.timetable-assembly-ready[^{}]*\{([^}]*)\}/
        )?.[1] || '';

        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
