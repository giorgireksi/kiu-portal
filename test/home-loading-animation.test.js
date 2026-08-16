const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    const fullPath = join(process.cwd(), relativePath);
    return existsSync(fullPath) ? readFileSync(fullPath, 'utf8') : '';
}

describe('Home loading animation', () => {
    it('wires Home motion assets after the dashboard bundle', () => {
        const html = readSource('index.html');

        expect(html).toContain('assets/css/home-assembly-prehide.css?v=20260810-homeassembly5');
        expect(html).toContain('assets/css/index-home-loading.css?v=20260810-homeassembly5');
        expect(html).toContain('home-shell-assembly-prehide');
        expect(html).toContain('assets/js/theme-primer.js?v=20260817-instantassembly1');
        expect(html).toContain('assets/js/features/navigation.js?v=20260817-instantassembly1');
        expect(html).toContain('assets/js/features/index-home-dashboard.js?v=20260809-homeassembly2');
        expect(html).toContain('assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
        expect(html).toContain('assets/js/pages/home-loading-runtime.js?v=20260810-homeassembly9');
        expect(html.match(/index-home-loading\.css/g)).toHaveLength(1);
        expect(html.match(/home-loading-runtime\.js/g)).toHaveLength(1);
        expect(html.match(/home-assembly-prehide\.css/g)).toHaveLength(1);
    });

    it('defines dashboard-only assembly with mobile late replay and boot ownership', () => {
        const runtime = readSource('assets/js/pages/home-loading-runtime.js');

        [
            '.lux-home-toolbar',
            '.lux-home-merged',
            '.lux-home-band',
            '[data-home-widget-id]',
            '[data-news-home-strip="1"]',
            '#mobile-bottom-nav',
            '#mobile-action-sheet',
            'button',
            'input',
            'select',
            'textarea'
        ].forEach((selector) => expect(runtime).toContain(selector));
        expect(runtime).toContain("getPageRoot: () => document.querySelector('#lux-home-shell')");
        expect(runtime).toContain("document.querySelector('#page-home')");
        expect(runtime).not.toContain('getObserverRoot: () => document.body');
        expect(runtime).toContain("root.querySelector('[data-home-widget-id]')");
        expect(runtime).not.toContain(".lux-home-band[data-home-widget-id]");
        expect(runtime).toContain('autoStart: false');
        expect(runtime).toContain('autoReplayLateMutations: false');
        expect(runtime).toContain('flattenInnerTargets: false');
        expect(runtime).toContain('transformSafeSelector:');
        expect(runtime).toContain('window.__kiuReplayHomeLoadingMotion');
        expect(runtime).toContain('__kiuHomeBootAwaitingAssemblyReveal');
        expect(runtime).toContain('__kiuHomeShellRevealAllowed');
        expect(runtime).toContain('__kiuHomeRevealShellNow');
        expect(runtime).not.toContain("'#lux-shell'");
        expect(runtime).not.toContain("'#lux-nav'");
        expect(runtime).not.toContain("'#lux-topbar'");
    });

    it('gates Home shell reveal until assembly run like Social', () => {
        const nav = readSource('assets/js/features/navigation.js');
        const primer = readSource('assets/js/theme-primer.js');
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');

        expect(nav).toContain('lux-route-home');
        expect(nav).toContain('__kiuHomeShellRevealAllowed');
        expect(primer).toContain("body.classList.contains('lux-route-home')");
        expect(shared).toContain('__kiuHomeBootAwaitingAssemblyReveal');
        expect(shared).toContain('home-shell-assembly-prehide');
        expect(shared).toContain('__kiuHomeRevealShellNow');
        expect(shared).toContain('waitForAppContentPaint');
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
            "__kiuReplayHomeLoadingMotion('render', undefined, { intro:"
        );
        expect(readSource('assets/js/shared/news-home.js')).toContain(
            'window.__kiuReplayHomeLoadingMotion(\'news\''
        );
        expect(readSource('assets/js/pages/index-mobile-shell.js')).toContain(
            'window.__kiuReplayHomeLoadingMotion(\'mobile\')'
        );
    });

    it('skips the intro on data refresh renders to avoid load-disappear-load flash', () => {
        const runtime = readSource('assets/js/features/luxury-index-runtime.js');
        const motion = readSource('assets/js/pages/home-loading-runtime.js');

        expect(runtime).toContain('const wasAlreadyRendered = Boolean(homeShell.dataset.homeRenderSignature)');
        expect(runtime).toContain('{ intro: !wasAlreadyRendered }');
        expect(motion).toContain('options.intro === false');
        expect(motion).toContain('motion.forceReady');
        expect(motion).toContain('releaseHomeBootShellReveal()');
    });

    it('keeps Home stylesheet motion-only and interaction-safe', () => {
        const css = readSource('assets/css/index-home-loading.css');
        const prehide = readSource('assets/css/home-assembly-prehide.css');

        expect(css).not.toContain('background');
        expect(css).not.toContain('border');
        expect(css).not.toContain('box-shadow');
        expect(css).toContain('is-home-assembly-staging');
        expect(css).toContain('is-home-assembly-staging:not(.is-flight)');
        expect(css).toContain('prefers-reduced-motion: reduce');
        expect(css).toContain('pointer-events: none');
        expect(css).toContain('pointer-events: auto');
        expect(css).not.toContain('.home-hover-chip:hover');
        expect(css).not.toContain('#lux-shell');
        expect(css).not.toContain('#lux-nav');
        expect(css).not.toContain('#lux-topbar');
        expect(css).toContain('.lux-home-page');
        expect(css).toContain('[data-home-widget-id]');
        expect(prehide).toContain('home-shell-assembly-prehide');
        expect(prehide).toContain('#lux-home-shell > *');
        expect(prehide).toContain('opacity: 0 !important');
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
        expect(motion).toContain("root.querySelector('[data-home-widget-id]')");
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
        expect(worker).toContain("CACHE_NAME = 'kiu-portal-shell-v20260816-social-cpuperf1'");
        expect(worker).toContain('/assets/css/home-assembly-prehide.css?v=20260810-homeassembly5');
        expect(worker).toContain('/assets/js/pages/home-loading-runtime.js?v=20260810-homeassembly9');
        expect(worker).toContain('/assets/js/shared/lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
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
