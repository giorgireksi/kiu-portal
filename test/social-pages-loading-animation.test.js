import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Pages loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Pages motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260817-timetableobserver1');
        const pagesIndex = html.indexOf('social-pages-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-pages-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(pagesIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(pagesIndex);
    });

    it('targets the Pages center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-pages-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-pages-loading.css');

        expect(runtime).toContain("activePanel !== 'pages'");
        expect(runtime).toContain('.social-neo-pages-shell');
        expect(runtime).toContain('.social-neo-pages-hero');
        expect(runtime).toContain('.social-neo-pages-grid');
        expect(runtime).toContain('.social-neo-page-card');
        expect(runtime).toContain('.social-neo-page-profile');
        expect(runtime).toContain('.social-neo-page-feed');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialPagesAssemblyState');
        expect(runtime).toContain('observeRenderedPages');
        expect(runtime).toContain('delete center.dataset.socialPagesAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(runtime).toContain('startCurrentPagesMotion(getCenter())');
        expect(interactions).toContain('function queueSocialPagesMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain("reason === 'page-open-profile'");
        expect(interactions).toContain("reason === 'page-profile-back'");
        expect(interactions).toContain("reason === 'page-profile-tab'");
        expect(interactions).toContain('window.__kiuStartSocialPagesLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialPagesAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-pages-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="pages"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-pages-shell">
                        <section class="social-neo-card social-neo-pages-hero">
                            <button class="lux-primary-btn" type="button" data-action="page-create-open">Create Page</button>
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
        new Function('window', readSource('assets/js/pages/social-pages-loading-runtime.js'))(window);

        try {
            for (let i = 0; i < 40; i += 1) {
                if (window.__kiuSocialPagesLoadingMotion?.getState?.().phase === 'ready') break;
                await wait(40);
            }
            expect(window.__kiuSocialPagesLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-pages-shell">
                    <section class="social-neo-card social-neo-pages-hero">
                        <button class="lux-primary-btn" type="button" data-action="page-create-open">Create Page</button>
                    </section>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialPagesLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialPagesLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-pages-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialPagesLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            for (let i = 0; i < 40; i += 1) {
                if (window.__kiuSocialPagesLoadingMotion?.getState?.().phase === 'ready') break;
                await wait(40);
            }
            expect(window.__kiuSocialPagesLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialPagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPagesLoadingMotion;
            delete window.__kiuStartSocialPagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('starts the shared engine for an already-rendered Pages center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="pages"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-pages-shell">
                        <section class="social-neo-card social-neo-pages-hero home-hover-chip">
                            <div class="social-neo-pages-hero-actions">
                                <button class="lux-primary-btn social-neo-pages-create-trigger" type="button">Create</button>
                            </div>
                            <div class="social-neo-pages-hero-grid">
                                <button class="lux-secondary-btn social-neo-pages-hero-tab" type="button">All</button>
                            </div>
                        </section>
                        <section class="social-neo-pages-grid">
                            <article class="social-neo-card social-neo-page-card home-hover-chip">
                                <strong>Campus News</strong>
                                <button class="lux-secondary-btn" type="button">Open</button>
                            </article>
                        </section>
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
        new Function('window', readSource('assets/js/pages/social-pages-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialPagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPagesLoadingMotion;
            delete window.__kiuStartSocialPagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Pages module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="pages"></div>
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
        new Function('window', readSource('assets/js/pages/social-pages-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-pages-shell">
                    <section class="social-neo-card social-neo-pages-hero">
                        <button class="lux-primary-btn" type="button">Create</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialPagesLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialPagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPagesLoadingMotion;
            delete window.__kiuStartSocialPagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Pages assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage1'");
        expect(sw).toContain('social-pages-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-pages-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
