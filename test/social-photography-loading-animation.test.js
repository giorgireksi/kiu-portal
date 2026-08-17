import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Exposé (photography) loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads photography motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260817-timetableobserver1');
        const photoIndex = html.indexOf('social-photography-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2&perf=20260816-singleowner9');

        expect(html).toContain('social-photography-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(photoIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(photoIndex);
    });

    it('targets the Exposé center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-photography-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-photography-loading.css');

        expect(runtime).toContain("activePanel !== 'photography'");
        expect(runtime).toContain('.social-photo-shell');
        expect(runtime).toContain(".social-photo-shell, .social-photo-profile-shell, .social-photo-shell--my-profile");
        expect(runtime).toContain('.social-photo-hero');
        expect(runtime).toContain('.social-photo-content-stage');
        expect(runtime).toContain('.social-photo-grid-tile');
        expect(runtime).toContain('.social-photo-profile-shell');
        expect(runtime).toContain('.social-photo-shell--my-profile');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('maxTotalAssemblyMs: 2000');
        expect(runtime).toContain('socialPhotographyAssemblyState');
        expect(runtime).toContain('observeRenderedPhotography');
        expect(runtime).toContain('delete center.dataset.socialPhotographyAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).toContain('options?.force');
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(interactions).toContain('function queueSocialPhotographyMotion(center, activePanel, reason)');
        expect(interactions).toContain("shouldAnimateSocialPanelMotion('photography', activePanel, reason,");
        expect(interactions).toContain("/^panel-/.test(r)");
        expect(interactions).toContain("r === `${target}-module`");
        expect(interactions).toContain("reason === 'photography-my-profile'");
        expect(interactions).toContain("reason === 'photography-view-profile'");
        expect(interactions).toContain("reason === 'photography-profile-back'");
        expect(interactions).toContain('const liveSection = center?.firstElementChild');
        expect(interactions).toContain('requestAnimationFrame');
        expect(interactions).toContain('Only invalidate in-flight starts when leaving Exposé or replaying');
        expect(interactions).toContain("liveSection.matches('.social-photo-shell, .social-photo-profile-shell, .social-photo-shell--my-profile')");
        expect(interactions).toContain('social-photography-assembly-ready');
        expect(interactions).toContain('window.__kiuStartSocialPhotographyLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialPhotographyAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-photography-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
        expect(css).not.toContain('social-photo-assembly-fallback-show');
        expect(css).not.toContain('#social-neo-root[data-panel="photography"]');
        const renderPlan = readSource('assets/js/pages/social-render-plan.js');
        expect(renderPlan).toContain("reason === 'feed' || reason === 'feed-error'");
        expect(renderPlan).toContain("text(activePanel || '') !== 'feed'");
        const runtimeLite = readSource('assets/js/shared/social-runtime-lite.js');
        expect(runtimeLite).toContain("if (activePanel !== 'feed') return;");
        expect(runtimeLite).toContain('function invalidateSocialFeedRenderCache()');
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');
        expect(shellNav).toContain("action === 'panel-photography'");
        expect(shellNav).toContain("void Promise.resolve(refreshPortalSocialFeed(true))");
        expect(shellNav).not.toMatch(/panel-photography[\s\S]*?await refreshPortalSocialFeed/);
        expect(shellNav).toContain("renderSocialPageNow(tab && wasOnPhotography ? 'photography-tab' : 'panel-photography')");
    });

    it('starts the shared engine for an already-rendered Exposé center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="photography"></div>
                <div id="social-neo-center-region">
                    <div class="social-photo-shell social-neo-community-panel">
                        <section class="social-neo-card social-photo-hero">
                            <div class="social-photo-chrome-actions">
                                <button class="lux-primary-btn social-photo-upload-btn" type="button">Share a photo</button>
                            </div>
                            <nav class="social-photo-tab-segment">
                                <button class="lux-primary-btn social-photo-tab is-active" type="button">Explore</button>
                            </nav>
                        </section>
                        <div class="social-photo-content-stage">
                            <div class="social-photo-grid-tile home-hover-chip">
                                <button class="social-photo-grid-tile-open" type="button">Open</button>
                            </div>
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
        new Function('window', readSource('assets/js/pages/social-photography-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialPhotographyLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPhotographyLoadingMotion;
            delete window.__kiuStartSocialPhotographyLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the photography module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="photography"></div>
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
        new Function('window', readSource('assets/js/pages/social-photography-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-photo-shell">
                    <section class="social-neo-card social-photo-hero">
                        <button class="lux-primary-btn" type="button">Share a photo</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialPhotographyLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialPhotographyLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPhotographyLoadingMotion;
            delete window.__kiuStartSocialPhotographyLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="photography"></div>
                <div id="social-neo-center-region">
                    <div class="social-photo-shell">
                        <section class="social-neo-card social-photo-hero">
                            <button class="lux-primary-btn" type="button" data-action="photography-upload-open">Share a photo</button>
                        </section>
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
        new Function('window', readSource('assets/js/pages/social-photography-loading-runtime.js'))(window);

        try {
            for (let i = 0; i < 40; i += 1) {
                if (window.__kiuSocialPhotographyLoadingMotion?.getState?.().phase === 'ready') break;
                await wait(40);
            }
            expect(window.__kiuSocialPhotographyLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-photo-shell">
                    <section class="social-neo-card social-photo-hero">
                        <button class="lux-primary-btn" type="button" data-action="photography-upload-open">Share a photo</button>
                    </section>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialPhotographyLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialPhotographyLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-photography-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialPhotographyLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            for (let i = 0; i < 40; i += 1) {
                if (window.__kiuSocialPhotographyLoadingMotion?.getState?.().phase === 'ready') break;
                await wait(40);
            }
            expect(window.__kiuSocialPhotographyLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialPhotographyLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPhotographyLoadingMotion;
            delete window.__kiuStartSocialPhotographyLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts photography assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260816-social-cpuperf1'");
        expect(sw).toContain('social-photography-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-photography-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2&perf=20260816-singleowner9');
    });
});
