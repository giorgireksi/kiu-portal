import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Surveys loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Surveys motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260810-assembly25');
        const surveysIndex = html.indexOf('social-surveys-loading-runtime.js?v=20260810-socialbootveil2');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-surveys-loading.css?v=20260809-socialsurveys1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(surveysIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(surveysIndex);
    });

    it('targets the Surveys center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-surveys-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-surveys-loading.css');

        expect(runtime).toContain("activePanel !== 'surveys'");
        expect(runtime).toContain('.social-neo-surveys-shell');
        expect(runtime).toContain('.social-neo-surveys-hero');
        expect(runtime).toContain('.social-neo-survey-listings');
        expect(runtime).toContain('.social-neo-survey-card');
        expect(runtime).toContain('.social-neo-surveys-take-shell');
        expect(runtime).toContain('.social-neo-survey-take-card');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: false');
        expect(runtime).toContain('socialSurveysAssemblyState');
        expect(runtime).toContain('observeRenderedSurveys');
        expect(runtime).toContain('delete center.dataset.socialSurveysAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('function queueSocialSurveysMotion(center, activePanel, reason)');
        expect(interactions).toContain("reason === 'surveys-module'");
        expect(interactions).toContain("reason === 'surveys-tab'");
        expect(interactions).toContain("reason === 'panel-surveys'");
        expect(interactions).toContain("reason === 'surveys-lane'");
        expect(interactions).toContain("reason === 'survey-take-open'");
        expect(interactions).toContain("reason === 'survey-take-close'");
        expect(interactions).toContain('window.__kiuStartSocialSurveysLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialSurveysAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-surveys-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
    });

    it('starts the shared engine for an already-rendered Surveys center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="surveys"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-surveys-shell">
                        <section class="social-neo-card social-neo-surveys-hero is-merged home-hover-chip">
                            <div class="social-neo-surveys-hero-actions">
                                <button class="lux-primary-btn social-neo-surveys-hero-create-btn" type="button">Create survey</button>
                            </div>
                            <div class="social-neo-surveys-hero-grid">
                                <button class="lux-secondary-btn social-neo-surveys-hero-tab" type="button">Available</button>
                            </div>
                            <div class="social-neo-survey-listings">
                                <article class="social-neo-card social-neo-survey-card home-hover-chip">
                                    <strong>Campus poll</strong>
                                    <button class="lux-primary-btn" type="button">Take survey</button>
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
        new Function('window', readSource('assets/js/pages/social-surveys-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls.length).toBeGreaterThan(0);
            const buttonFlight = calls.find(({ element }) => element.matches('button'));
            expect(buttonFlight.keyframes.some((frame) => String(frame.transform || '').includes('translate3d(-'))).toBe(true);
        } finally {
            window.__kiuSocialSurveysLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialSurveysLoadingMotion;
            delete window.__kiuStartSocialSurveysLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Surveys module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="surveys"></div>
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
        new Function('window', readSource('assets/js/pages/social-surveys-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-surveys-shell">
                    <section class="social-neo-card social-neo-surveys-hero">
                        <button class="lux-primary-btn" type="button">Create survey</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls.length).toBeGreaterThan(0);
            expect(window.__kiuSocialSurveysLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialSurveysLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialSurveysLoadingMotion;
            delete window.__kiuStartSocialSurveysLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="surveys"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-surveys-shell">
                        <section class="social-neo-card social-neo-surveys-hero">
                            <button class="lux-primary-btn" type="button" data-action="survey-create-open">Create survey</button>
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
        new Function('window', readSource('assets/js/pages/social-surveys-loading-runtime.js'))(window);

        try {
            for (let i = 0; i < 40; i += 1) {
                if (window.__kiuSocialSurveysLoadingMotion?.getState?.().phase === 'ready') break;
                await wait(40);
            }
            expect(window.__kiuSocialSurveysLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-surveys-shell">
                    <section class="social-neo-card social-neo-surveys-hero">
                        <button class="lux-primary-btn" type="button" data-action="survey-create-open">Create survey</button>
                    </section>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialSurveysLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialSurveysLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-surveys-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialSurveysLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            for (let i = 0; i < 40; i += 1) {
                if (window.__kiuSocialSurveysLoadingMotion?.getState?.().phase === 'ready') break;
                await wait(40);
            }
            expect(window.__kiuSocialSurveysLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialSurveysLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialSurveysLoadingMotion;
            delete window.__kiuStartSocialSurveysLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Surveys assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260810-homeassembly5'");
        expect(sw).toContain('social-surveys-loading.css?v=20260809-socialsurveys1');
        expect(sw).toContain('social-surveys-loading-runtime.js?v=20260810-socialbootveil2');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
