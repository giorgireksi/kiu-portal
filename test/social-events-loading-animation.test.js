import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Events loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Events motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-showhidefix1');
        const eventsIndex = html.indexOf('social-events-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-events-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(eventsIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(eventsIndex);
    });

    it('targets the Events center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-events-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-events-loading.css');

        expect(runtime).toContain("activePanel !== 'events'");
        expect(runtime).toContain('.social-neo-events-shell');
        expect(runtime).toContain('.social-neo-events-hero');
        expect(runtime).toContain('.social-neo-events-hero-tab');
        expect(runtime).toContain('.social-neo-event-feature');
        expect(runtime).toContain('.social-neo-events-lane');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialEventsAssemblyState');
        expect(runtime).toContain('observeRenderedEvents');
        expect(runtime).toContain('delete center.dataset.socialEventsAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('function queueSocialEventsMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain("[data-social-events-assembly-root]");
        expect(interactions).toContain('window.__kiuStartSocialEventsLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialEventsAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-events-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');
        expect(shellNav).toContain('setPanel(panel, { skipRender: true })');
    });

    it('starts the shared engine for an already-rendered Events center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="events"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-events-shell social-neo-events-shell--merged">
                        <section class="social-neo-card social-neo-events-hero is-merged home-hover-chip">
                            <div class="social-neo-events-hero-actions">
                                <button class="lux-primary-btn social-neo-events-create-trigger" type="button">Create event</button>
                            </div>
                            <div class="social-neo-events-hero-grid">
                                <button class="lux-secondary-btn social-neo-events-hero-tab" type="button">Student</button>
                            </div>
                            <div class="social-neo-events-lane">
                                <article class="social-neo-card social-neo-event-feature home-hover-chip">
                                    <strong>Meetup</strong>
                                    <button class="lux-secondary-btn" type="button">Interested</button>
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
        new Function('window', readSource('assets/js/pages/social-events-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialEventsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialEventsLoadingMotion;
            delete window.__kiuStartSocialEventsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Events module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="events"></div>
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
        new Function('window', readSource('assets/js/pages/social-events-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-events-shell">
                    <section class="social-neo-card social-neo-events-hero">
                        <button class="lux-primary-btn" type="button">Create event</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialEventsLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialEventsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialEventsLoadingMotion;
            delete window.__kiuStartSocialEventsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="events"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-events-shell">
                        <section class="social-neo-card social-neo-events-hero">
                            <button class="lux-primary-btn" type="button" data-action="event-create-open">Create event</button>
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
        new Function('window', readSource('assets/js/pages/social-events-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialEventsLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-events-shell">
                    <section class="social-neo-card social-neo-events-hero">
                        <button class="lux-primary-btn" type="button" data-action="event-create-open">Create event</button>
                    </section>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialEventsLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialEventsLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-events-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialEventsLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            await wait(300);
            expect(window.__kiuSocialEventsLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialEventsLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialEventsLoadingMotion;
            delete window.__kiuStartSocialEventsLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Events assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2'");
        expect(sw).toContain('social-events-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-events-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
