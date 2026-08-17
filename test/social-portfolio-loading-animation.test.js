import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Portfolio loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Portfolio motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260817-timetableobserver1');
        const portfolioIndex = html.indexOf('social-portfolio-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner4');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2&perf=20260816-singleowner9');

        expect(html).toContain('social-portfolio-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(portfolioIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(portfolioIndex);
    });

    it('targets the Portfolio center without animating dialogs or persistent chrome', () => {
        const runtime = readSource('assets/js/pages/social-portfolio-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-portfolio-loading.css');

        expect(runtime).toContain("activePanel !== 'projects'");
        expect(runtime).toContain('.social-neo-portfolio-shell');
        expect(runtime).toContain('.social-neo-portfolio-hero');
        expect(runtime).toContain('.social-portfolio-search-row');
        expect(runtime).toContain('.social-portfolio-card');
        expect(runtime).toContain('.portfolio-editor-stack');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialPortfolioAssemblyState');
        expect(runtime).toContain('observeRenderedPortfolio');
        expect(runtime).toContain('delete center.dataset.socialPortfolioAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(css).toContain('Keep openers clickable');
        expect(runtime).not.toContain("motion.getState?.().phase !== 'idle'");
        expect(interactions).toContain('function queueSocialPortfolioMotion(center, activePanel, reason)');
        expect(interactions).toContain("reason === 'boot'");
        expect(interactions).toContain("shouldAnimateSocialPanelMotion('projects', activePanel, reason)");
        expect(interactions).toContain('window.__kiuStartSocialPortfolioLoadingMotion');
        expect(interactions).not.toContain('section.dataset.socialPortfolioAssemblyRoot');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-portfolio-assembly-active');
        expect(css).toContain('.social-neo-empty-hero');
    });

    it('starts the shared engine for an already-rendered Portfolio center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="projects"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-portfolio-shell social-neo-portfolio-shell--merged">
                        <section class="social-neo-card social-neo-portfolio-hero home-hover-chip">
                            <div class="social-neo-portfolio-hero-head">
                                <div class="social-neo-portfolio-hero-actions">
                                    <button class="lux-primary-btn" type="button">Upload</button>
                                </div>
                            </div>
                            <div class="social-neo-portfolio-hero-stats">
                                <article class="social-neo-portfolio-hero-stat lux-soft-chrome"><strong>1</strong><span>Published</span></article>
                            </div>
                            <div class="social-neo-portfolio-hero-body">
                                <div class="social-portfolio-search-row">
                                    <label class="social-portfolio-search">
                                        <i class="fas fa-search"></i>
                                        <input class="lux-control" type="search" name="projectDiscoverSearch">
                                    </label>
                                </div>
                                <div class="social-portfolio-feed">
                                    <article class="social-portfolio-card lux-soft-chrome home-hover-chip">
                                        <strong>Showcase</strong>
                                        <button class="lux-secondary-btn" type="button">Open entry</button>
                                    </article>
                                </div>
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
        new Function('window', readSource('assets/js/pages/social-portfolio-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialPortfolioLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPortfolioLoadingMotion;
            delete window.__kiuStartSocialPortfolioLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays the first real Portfolio shell after the lazy placeholder is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="projects"></div>
                <div id="social-neo-center-region">
                    <section class="social-neo-card">
                        <div class="social-neo-empty-hero">Loading Portfolio</div>
                    </section>
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
        new Function('window', readSource('assets/js/pages/social-portfolio-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-portfolio-shell">
                    <section class="social-neo-card social-neo-portfolio-hero">
                        <button class="lux-primary-btn" type="button">Open</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialPortfolioLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialPortfolioLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPortfolioLoadingMotion;
            delete window.__kiuStartSocialPortfolioLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('rebuilds a full Portfolio flight after the shared center already finished once', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="projects"></div>
                <div id="social-neo-center-region" data-social-portfolio-assembly-state="ready">
                    <div class="social-neo-stack social-neo-portfolio-shell" data-social-portfolio-assembly-root="1">
                        <button class="lux-primary-btn" type="button">Old</button>
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
        new Function('window', readSource('assets/js/pages/social-portfolio-loading-runtime.js'))(window);
        try {
            await wait(220);
            const motion = window.__kiuSocialPortfolioLoadingMotion;
            expect(motion?.getState?.().phase).toBe('ready');
            calls.length = 0;
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-portfolio-shell social-neo-portfolio-shell--merged">
                    <section class="social-neo-card social-neo-portfolio-hero">
                        <button class="lux-primary-btn" type="button">Remounted</button>
                    </section>
                </div>
            `;
            await wait(120);
            // Dialog-style remounts must not auto-replay; panel switches force-start.
            expect(window.__kiuStartSocialPortfolioLoadingMotion(
                document.querySelector('#social-neo-center-region')
            )).toBe(false);
            expect(calls.length).toBe(0);
            const restarted = window.__kiuStartSocialPortfolioLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(motion?.getState?.().phase).toBe('ready');
            expect(document.querySelector('#social-neo-center-region')?.dataset.socialPortfolioAssemblyState).toBe('ready');
            expect(document.querySelector('[data-social-portfolio-assembly-root="1"]')?.textContent).toContain('Remounted');
        } finally {
            window.__kiuSocialPortfolioLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialPortfolioLoadingMotion;
            delete window.__kiuStartSocialPortfolioLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Portfolio assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260816-social-cpuperf1'");
        expect(sw).toContain('social-portfolio-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-portfolio-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner4');
    });
});
