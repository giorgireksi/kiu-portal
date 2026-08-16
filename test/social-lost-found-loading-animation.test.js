import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Lost & Found loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Lost & Found motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
        const lostFoundIndex = html.indexOf('social-lost-found-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-lost-found-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(lostFoundIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(lostFoundIndex);
    });

    it('targets the Lost & Found center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-lost-found-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-lost-found-loading.css');
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');

        expect(runtime).toContain("activePanel !== 'lost-and-found'");
        expect(runtime).toContain('.social-neo-lost-found-shell');
        expect(runtime).toContain('.social-neo-lost-found-hero');
        expect(runtime).toContain('.social-neo-lost-found-tabs');
        expect(runtime).toContain('.social-neo-lf-listings');
        expect(runtime).toContain('.social-neo-lf-card');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialLostFoundAssemblyState');
        expect(runtime).toContain('observeRenderedLostFound');
        expect(runtime).toContain('delete center.dataset.socialLostFoundAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('function queueSocialLostFoundMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain('window.__kiuStartSocialLostFoundLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialLostFoundAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-lost-found-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
        expect(shellNav).toContain("void Promise.resolve(pruneExpiredLostFoundItems())");
        expect(shellNav).not.toMatch(/panel-lost-found[\s\S]*?await pruneExpiredLostFoundItems/);
        expect(shellNav).toContain("renderSocialPageNow('panel-lost-and-found')");
    });

    it('starts the shared engine for an already-rendered Lost & Found center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="lost-and-found"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-lost-found-shell">
                        <section class="social-neo-card social-neo-lost-found-hero is-merged home-hover-chip">
                            <div class="social-neo-lost-found-hero-actions">
                                <button class="lux-primary-btn social-neo-lost-found-hero-create-btn" type="button">Report lost item</button>
                            </div>
                            <div class="social-neo-lost-found-tabs" role="tablist">
                                <button class="lux-secondary-btn" type="button" role="tab">All</button>
                            </div>
                            <div class="social-neo-lf-listings">
                                <article class="social-neo-card social-neo-lf-card home-hover-chip">
                                    <strong>Keys</strong>
                                    <button class="lux-secondary-btn" type="button">Mark found</button>
                                </article>
                            </div>
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
        new Function('window', readSource('assets/js/pages/social-lost-found-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialLostFoundLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialLostFoundLoadingMotion;
            delete window.__kiuStartSocialLostFoundLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Lost & Found module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="lost-and-found"></div>
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
        new Function('window', readSource('assets/js/pages/social-lost-found-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-lost-found-shell">
                    <section class="social-neo-card social-neo-lost-found-hero">
                        <button class="lux-primary-btn" type="button">Report lost item</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialLostFoundLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialLostFoundLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialLostFoundLoadingMotion;
            delete window.__kiuStartSocialLostFoundLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="lost-and-found"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-lost-found-shell">
                        <section class="social-neo-card social-neo-lost-found-hero">
                            <button class="lux-primary-btn" type="button" data-action="lost-found-create-open">Report lost item</button>
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
        new Function('window', readSource('assets/js/pages/social-lost-found-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialLostFoundLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-lost-found-shell">
                    <section class="social-neo-card social-neo-lost-found-hero">
                        <button class="lux-primary-btn" type="button" data-action="lost-found-create-open">Report lost item</button>
                    </section>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialLostFoundLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialLostFoundLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-lost-found-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialLostFoundLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            await wait(300);
            expect(window.__kiuSocialLostFoundLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialLostFoundLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialLostFoundLoadingMotion;
            delete window.__kiuStartSocialLostFoundLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Lost & Found assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260816-social-cpuperf1'");
        expect(sw).toContain('social-lost-found-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-lost-found-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
