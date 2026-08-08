const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Home loading animation', () => {
    it('wires Home motion assets after the dashboard bundle', () => {
        const html = readSource('index.html');

        expect(html).toContain('assets/css/index-home-loading.css?v=20260809-homeassembly2');
        expect(html).toContain('assets/js/features/index-home-dashboard.js?v=20260809-homeassembly2');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260809-assembly15');
        expect(html).toContain('assets/js/pages/home-loading-runtime.js?v=20260809-homeassembly2');
        expect(html.match(/index-home-loading\.css/g)).toHaveLength(1);
        expect(html.match(/home-loading-runtime\.js/g)).toHaveLength(1);
    });

    it('defines explicit dashboard, shell, and mobile replay boundaries', () => {
        const runtime = readSource('assets/js/pages/home-loading-runtime.js');

        [
            '#lux-shell',
            '#lux-nav',
            '#lux-topbar',
            '#mobile-bottom-nav',
            '#mobile-action-sheet',
            '.lux-home-toolbar',
            '.lux-home-merged',
            '.lux-home-band',
            '[data-home-widget-id]',
            '[data-news-home-strip="1"]',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#lux-home-shell')");
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('transformSafeSelector:');
        expect(runtime).toContain('window.__kiuReplayHomeLoadingMotion');
    });

    it('marks every rendered widget boundary in the dashboard bundle', () => {
        const shell = readSource('assets/js/features/home-dashboard/shell.js');
        const layout = readSource('assets/js/features/home-dashboard-widget-layout-runtime.js');

        expect(shell).toContain('data-home-widget-id');
        expect(shell).toContain('data-home-render-type');
        [
            'student-header',
            'student-command',
            'student-summary',
            'student-extra',
            'professor-schedule',
            'ta-schedule',
            'service-queue',
            'admin-curriculum',
            'admin-ops'
        ].forEach((widgetId) => expect(layout).toContain(`'${widgetId}'`));
    });

    it('replays Home after dashboard, news, and mobile mounts', () => {
        expect(readSource('assets/js/features/luxury-index-runtime.js')).toContain(
            'window.__kiuReplayHomeLoadingMotion(\'render\')'
        );
        expect(readSource('assets/js/shared/news-home.js')).toContain(
            'window.__kiuReplayHomeLoadingMotion(\'news\''
        );
        expect(readSource('assets/js/pages/index-mobile-shell.js')).toContain(
            'window.__kiuReplayHomeLoadingMotion(\'mobile\')'
        );
    });

    it('keeps Home stylesheet motion-only and interaction-safe', () => {
        const css = readSource('assets/css/index-home-loading.css');

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('is-home-assembly-staging');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).toContain('pointer-events: none');
        expect(css).toContain('pointer-events: auto');
        expect(css).not.toContain('.home-hover-chip:hover');
    });

    it('separates final Home content from loading and recovery shells', () => {
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        const motion = readSource('assets/js/pages/home-loading-runtime.js');

        expect(runtime).toContain('homeShell.dataset.homeRenderReady = \'1\'');
        expect(runtime).toContain('homeShell.dataset.homeRenderState = \'loading\'');
        expect(runtime).toContain('homeShell.dataset.homeRenderState = \'recovery\'');
        expect(runtime).toContain('homeShell.dataset.homeRenderState = \'ready\'');
        expect(runtime).toContain('[data-home-loading-shell="1"], [data-home-recovery-shell="1"]');
        expect(motion).toContain('root?.dataset.homeRenderReady === \'1\'');
    });

    it('keeps Home utility actions on the existing cache-clear handler', () => {
        const shell = readSource('assets/js/features/home-dashboard/shell.js');
        const renderer = readSource('assets/js/features/home-dashboard/widget-render.js');
        const bundle = readSource('assets/js/features/index-home-dashboard.plain.js');

        expect(renderer).toContain('actionType === \'utility\'');
        expect(renderer).toContain('data-action="${escapeHtml(pageId)}"');
        expect(shell).toContain('bindCacheClearLaunchButtons(homeShell)');
        expect(bundle).toContain('bindCacheClearLaunchButtons(homeShell)');
    });

    it('rejects empty or offline Home bundles and keeps retry wiring', () => {
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        const worker = readSource('service-worker.js');

        expect(runtime).toContain('validateLuxuryHomeDashboardChunk');
        expect(runtime).toContain('did not expose the required renderer');
        expect(runtime).toContain('scheduleLuxuryHomeDashboardChunkRetry()');
        expect(worker).toContain('isUsableStaticAssetResponse');
        expect(worker).toContain('offline asset fallback');
        expect(worker).toContain('/assets/js/features/index-home-dashboard.plain.js?v=20260809-homeassembly2');
    });

    it('covers role-specific and mobile replay surfaces without broad mutation replay', () => {
        const model = readSource('assets/js/features/luxury-home-model.js');
        const layoutRuntime = readSource('assets/js/features/home-dashboard-widget-layout-runtime.js');
        const runtime = readSource('assets/js/pages/home-loading-runtime.js');

        ['student', 'professor', 'ta', 'student_service'].forEach((role) => {
            expect(model).toContain(`role === '${role}'`);
        });
        expect(model).toContain("return [['admin-tools', 'Open admin tools']");
        expect(layoutRuntime).toContain('ensureStudentServiceStores() || { tickets: [], articles: [] }');
        expect(runtime).toContain('#mobile-bottom-nav');
        expect(runtime).toContain('#mobile-action-sheet');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('lateReadyWindowMs: 1200');
    });
});
