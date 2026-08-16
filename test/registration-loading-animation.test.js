const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('registration loading animation', () => {
    it('loads registration-local motion assets and the shared engine', () => {
        const html = readSource('registration.html');

        expect(html).toContain('assets/css/registration-loading.css?v=20260808-regassembly1');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
        expect(html).toContain('assets/js/pages/registration-loading-runtime.js?v=20260808-regassembly1');
        expect(html.match(/registration-loading\.css/g)).toHaveLength(1);
        expect(html.match(/registration-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/lux-assembly-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('targets registration summary, tabs, workspace, and dynamic content', () => {
        const runtime = readSource('assets/js/pages/registration-loading-runtime.js');

        [
            '.registration-studio-deck',
            '.registration-workspace',
            '.registration-summary-panel',
            '.registration-summary-header',
            '.registration-summary-progress',
            '.reg-tabs',
            '.reg-tab',
            '.registration-workspace-head',
            '.registration-workspace-body',
            '#student-reg-content-container',
            '[class*="admin-reg-"]',
            '[class*="student-reg-"]',
            'button',
            'input',
            'select'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("observerSelector: '#page-registration'");
        expect(runtime).toContain('kiuRegistrationAssemblyState');
        expect(runtime).toContain('kiu-registration-assembly-target');
        expect(runtime).toContain('kiu-registration-assembly-outer');
    });

    it('excludes hidden modal/mobile content and preserves shared cleanup', () => {
        const runtime = readSource('assets/js/pages/registration-loading-runtime.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');
        const css = readSource('assets/css/registration-loading.css');

        expect(runtime).toContain(
            "hiddenSelector: '[hidden], [aria-hidden=\"true\"], template, #modal-overlay, #mobile-action-sheet'"
        );
        expect(shared).toContain('element.closest(hiddenSelector)');
        expect(shared).toContain('try { animation.cancel(); } catch (_error) {}');
        expect(shared).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
        expect(css).not.toContain('body.timetable-assembly');
        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
    });

    it('does not override registration hover or touch transforms after reveal', () => {
        const css = readSource('assets/css/registration-loading.css');
        const readyRule = css.match(
            /body\.registration-assembly-ready[^{}]*\{([^}]*)\}/
        )?.[1] || '';

        expect(readyRule).not.toContain('transform');
        expect(readyRule).not.toContain('filter');
        expect(readyRule).toContain('opacity: 1');
    });
});
