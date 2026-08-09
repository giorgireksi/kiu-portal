import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Home loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('wires only the Home center motion after the shared engine', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260809-assembly17');
        const homeIndex = html.indexOf('social-home-loading-runtime.js?v=20260809-socialpopup1');

        expect(html).toContain('social-home-loading.css?v=20260809-socialpopup1');
        expect(html).toContain('social-page-interactions-runtime.js?v=20260809-socialassemblyreplay1');
        expect(html).toContain('social-groups-loading.css?v=20260809-socialpopup1');
        expect(html).toContain('social-groups-loading-runtime.js?v=20260809-socialpopup1');
        expect(html).toContain('social-community-loading.css?v=20260809-socialpopup1');
        expect(html).toContain('social-community-loading-runtime.js?v=20260809-socialpopup1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(homeIndex).toBeGreaterThan(sharedIndex);
        expect(html).not.toContain('social-loading-runtime');
        expect(html).not.toContain('social-loading.css');
    });

    it('keeps the runtime scoped to Feed and the center region', () => {
        const runtime = readSource('assets/js/pages/social-home-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');

        expect(runtime).toContain("return document.querySelector('#social-neo-center-region')");
        expect(runtime).toContain('autoStart: false');
        expect(runtime).toContain('social-home-assembly-active');
        expect(runtime).toContain('social-home-assembly-ready');
        expect(runtime).toContain('[data-social-home-assembly-root="1"]');
        expect(runtime).toContain('.social-neo-feed-shell');
        expect(runtime).toContain('.social-neo-feed-hero');
        expect(runtime).toContain('.social-neo-feed-header-divider');
        expect(runtime).toContain("'i'");
        expect(runtime).toContain('flattenInnerTargets: false');
        expect(runtime).toContain('maxTotalAssemblyMs: 2000');
        expect(runtime).toContain('.lux-picker-btn');
        expect(runtime).toContain('#social-neo-overlay-portal');
        expect(readSource('assets/css/social-home-loading.css')).toContain('prefers-reduced-motion');
        expect(readSource('assets/css/social-home-loading.css')).toContain('.social-neo-card.sn-mat-soft');
        expect(runtime).toContain('observeRenderedFeed');
        expect(runtime).toContain('new MutationObserver');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).not.toContain('motion.replay');
        expect(interactions).toContain('function queueSocialHomeMotion(center, activePanel, reason)');
        expect(interactions).toContain("reason === 'feed-module'");
        expect(interactions).toContain("reason === 'panel-feed'");
        expect(interactions).not.toContain("section.dataset.socialHomeAssemblyRoot = '1'");
        expect(interactions).toContain("[data-social-home-assembly-root]");
        expect(interactions).toContain("panel === 'feed'");
        expect(interactions).toContain('window.cancelAnimationFrame');
        expect(interactions).toContain('window.__kiuStartSocialHomeLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('social-section-assembly');
        expect(readSource('assets/css/social-home-loading.css')).toContain('Keep openers clickable');
    });

    it('creates a center-only configuration with a real Feed readiness gate', () => {
        const runtime = readSource('assets/js/pages/social-home-loading-runtime.js');
        const originalFactory = window.__kiuCreateAssemblyLoadingMotion;
        let options = null;
        window.__kiuCreateAssemblyLoadingMotion = (nextOptions) => {
            options = nextOptions;
            return { install() {} };
        };
        document.body.innerHTML = `
            <div id="social-neo-center-region">
                <section data-social-home-assembly-root="1">
                    <button type="button">Home</button>
                </section>
            </div>
        `;
        document.body.className = 'lux-route-social';

        try {
            new Function('window', runtime)(window);
            const center = document.querySelector('#social-neo-center-region');
            expect(options.getPageRoot()).toBe(center);
            expect(options.isContentReady()).toBe(true);
            expect(options.getPageRoot().querySelector('button')).not.toBeNull();
        } finally {
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialHomeLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('starts the real shared engine for an already-rendered Feed center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <div id="social-neo-root" data-panel="feed"></div>
            <div id="social-neo-center-region">
                <div class="social-neo-feed-shell">
                    <section class="social-neo-card lux-soft-chrome home-hover-chip">
                        <button class="lux-secondary-btn" type="button">Home</button>
                    </section>
                </div>
            </div>
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
        new Function('window', readSource('assets/js/pages/social-home-loading-runtime.js'))(window);

        try {
            await wait(80);
            expect(calls.length).toBeGreaterThan(0);
            expect(calls.some(({ element }) => element.matches('.social-neo-feed-shell'))).toBe(true);
            const buttonFlight = calls.find(({ element }) => element.matches('button'));
            expect(buttonFlight.keyframes.some((frame) => String(frame.transform || '').includes('translate3d(-'))).toBe(true);
            expect(calls.some(({ keyframes }) => keyframes.some((frame) => String(frame.transform || '').includes('translate3d(-')))).toBe(true);
        } finally {
            window.__kiuSocialHomeLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialHomeLoadingMotion;
            delete window.__kiuStartSocialHomeLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts the Home motion assets without removing shared engine assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260809-socialassemblyreplay1'");
        expect(sw).toContain('social-home-loading.css?v=20260809-socialpopup1');
        expect(sw).toContain('social-community-loading.css?v=20260809-socialpopup1');
        expect(sw).toContain('social-home-loading-runtime.js?v=20260809-socialpopup1');
        expect(sw).toContain('social-community-loading-runtime.js?v=20260809-socialpopup1');
        expect(sw).toContain('social-groups-loading.css?v=20260809-socialpopup1');
        expect(sw).toContain('social-groups-loading-runtime.js?v=20260809-socialpopup1');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260809-socialassemblyreplay1');
        expect(sw).toContain('lux-assembly-loading-runtime.js?v=20260809-assembly17');
        expect(sw).not.toContain('social-loading-runtime');
    });
});
