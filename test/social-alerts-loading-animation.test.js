import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Alerts loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Alerts motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-assemblyfilter1');
        const alertsIndex = html.indexOf('social-alerts-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-alerts-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(alertsIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(alertsIndex);
    });

    it('targets the Alerts center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-alerts-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-alerts-loading.css');
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');

        expect(runtime).toContain("activePanel !== 'alerts'");
        expect(runtime).toContain('.sn-alerts-panel');
        expect(runtime).toContain('.sn-alerts-header');
        expect(runtime).toContain('.sn-alerts-category-filters');
        expect(runtime).toContain('.sn-alerts-list');
        expect(runtime).toContain('.sn-alert-card');
        expect(runtime).toContain('.sn-alerts-empty');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain("'#social-neo-call-overlay'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialAlertsAssemblyState');
        expect(runtime).toContain('observeRenderedAlerts');
        expect(runtime).toContain('delete center.dataset.socialAlertsAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('function queueSocialAlertsMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        const alertsMotionGate = interactions.match(
            /function queueSocialAlertsMotion[\s\S]*?function queueSocialSurveysMotion/
        )?.[0] || '';
        expect(alertsMotionGate).not.toContain("reason === 'alerts-filter'");
        expect(shellNav).toContain("'alerts-filter'");
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain("reason === 'notifications-refresh'");
        expect(interactions).toContain("reason === 'notification-read'");
        expect(interactions).toContain("reason === 'notification-removed'");
        expect(interactions).toContain('assemblyInFlight');
        expect(interactions).toContain('Only invalidate in-flight starts when leaving Alerts');
        expect(interactions).toContain('Start sync in this turn');
        expect(interactions).toContain('[data-social-alerts-assembly-root]');
        expect(interactions).toContain('window.__kiuStartSocialAlertsLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialAlertsAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-alerts-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
        expect(css).not.toContain(':not([data-social-alerts-assembly-root="1"])');
        expect(shellNav).toContain("setPanel('alerts', { skipRender: true })");
        expect(shellNav).toContain("void Promise.resolve(window.refreshPortalNotifications(true))");
        expect(shellNav).not.toMatch(/panel-alerts[\s\S]*?await window\.refreshPortalNotifications/);
        const panelAlertsPaint = shellNav.indexOf("const openResult = renderSocialPageNow(paintReason)");
        expect(panelAlertsPaint).toBeGreaterThan(-1);
        expect(shellNav.indexOf('refreshPortalNotifications(true)', panelAlertsPaint))
            .toBeGreaterThan(panelAlertsPaint);
        expect(interactions).toContain('abortSocialSectionMotion');
        expect(interactions).toContain("__kiuSocialAlertsLoadingMotion");
        expect(interactions).toContain('motion.abort');
        expect(runtime).toContain('motion.softRestart');
        expect(runtime).not.toContain('motion.abort()');
        expect(runtime).not.toContain('social-center-assembly-prehide');
        expect(interactions).toContain('shouldPrehideCenterForAssembly');
    });

    it('starts the shared engine for an already-rendered Alerts center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="alerts"></div>
                <div id="social-neo-center-region">
                    <div class="sn-alerts-panel">
                        <header class="sn-alerts-header">
                            <div class="sn-alerts-header__toolbar">
                                <strong class="sn-alerts-header__title">Filter alerts</strong>
                                <button class="lux-secondary-btn sn-alerts-mark-read" type="button">Mark all read</button>
                            </div>
                            <div class="sn-alerts-category-filters" role="tablist">
                                <button class="lux-tab-btn" type="button" role="tab">All</button>
                            </div>
                        </header>
                        <div class="sn-alerts-list">
                            <article class="sn-alert-card is-unread">
                                <div class="sn-alert-card__main">
                                    <strong>Campus update</strong>
                                    <button class="lux-ghost-btn" type="button">Open</button>
                                </div>
                            </article>
                        </div>
                    </div>
                </div>
            </main>
        `;
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        const originalAnimate = Element.prototype.animate;
        const calls = [];
        Element.prototype.animate = function (keyframes) {
            calls.push({ element: this, keyframes });
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-alerts-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialAlertsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialAlertsLoadingMotion;
            delete window.__kiuStartSocialAlertsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Alerts module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="alerts"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>
                </div>
            </main>
        `;
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        const originalAnimate = Element.prototype.animate;
        const calls = [];
        Element.prototype.animate = function (keyframes) {
            calls.push({ element: this, keyframes });
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-alerts-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="sn-alerts-panel">
                    <header class="sn-alerts-header">
                        <button class="lux-secondary-btn" type="button">Mark all read</button>
                    </header>
                    <div class="sn-alerts-list">
                        <article class="sn-alert-card"><strong>Hello</strong></article>
                    </div>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialAlertsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialAlertsLoadingMotion;
            delete window.__kiuStartSocialAlertsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="alerts"></div>
                <div id="social-neo-center-region">
                    <div class="sn-alerts-panel">
                        <header class="sn-alerts-header">
                            <button class="lux-secondary-btn" type="button">Mark all read</button>
                        </header>
                    </div>
                </div>
            </main>
        `;
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        const originalAnimate = Element.prototype.animate;
        Element.prototype.animate = function () {
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-alerts-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="sn-alerts-panel">
                    <header class="sn-alerts-header">
                        <button class="lux-secondary-btn" type="button">Mark all read</button>
                    </header>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialAlertsLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-alerts-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialAlertsLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            await wait(300);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialAlertsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialAlertsLoadingMotion;
            delete window.__kiuStartSocialAlertsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('force-replays even when center assembly dataset lingered', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="alerts"></div>
                <div id="social-neo-center-region" data-social-alerts-assembly-state="ready">
                    <div class="sn-alerts-panel">
                        <header class="sn-alerts-header">
                            <button class="lux-secondary-btn" type="button">Mark all read</button>
                        </header>
                    </div>
                </div>
            </main>
        `;
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        const originalAnimate = Element.prototype.animate;
        const calls = [];
        Element.prototype.animate = function (keyframes) {
            calls.push({ element: this, keyframes });
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-alerts-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
            const center = document.querySelector('#social-neo-center-region');
            center.innerHTML = `
                <div class="sn-alerts-panel">
                    <header class="sn-alerts-header">
                        <button class="lux-secondary-btn" type="button">Mark all read</button>
                    </header>
                </div>
            `;
            center.dataset.socialAlertsAssemblyState = 'ready';
            calls.length = 0;
            const started = window.__kiuStartSocialAlertsLoadingMotion(center, { force: true });
            expect(started).toBe(true);
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialAlertsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialAlertsLoadingMotion;
            delete window.__kiuStartSocialAlertsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('force-replays after leaving Alerts even when phase stayed ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="alerts"></div>
                <div id="social-neo-center-region">
                    <div class="sn-alerts-panel">
                        <header class="sn-alerts-header">
                            <button class="lux-secondary-btn" type="button">Mark all read</button>
                        </header>
                    </div>
                </div>
            </main>
        `;
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        const originalAnimate = Element.prototype.animate;
        const calls = [];
        Element.prototype.animate = function (keyframes) {
            calls.push({ element: this, keyframes });
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-alerts-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
            document.body.classList.remove('social-alerts-assembly-ready', 'social-alerts-assembly-active');
            document.querySelector('#social-neo-root').dataset.panel = 'alerts';
            const center = document.querySelector('#social-neo-center-region');
            center.dataset.socialAlertsAssemblyState = 'ready';
            center.firstElementChild.dataset.socialAlertsAssemblyRoot = '1';
            calls.length = 0;
            const restarted = window.__kiuStartSocialAlertsLoadingMotion(center, { force: true });
            expect(restarted).toBe(true);
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialAlertsLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialAlertsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialAlertsLoadingMotion;
            delete window.__kiuStartSocialAlertsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Alerts assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2'");
        expect(sw).toContain('social-alerts-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-alerts-loading-runtime.js?v=20260818-centerobserver1&perf=20260816-singleowner3');
        expect(sw).toContain('lux-assembly-loading-runtime.js?v=20260818-assemblyfilter1');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
