import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Research loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Research motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260817-instantassembly1');
        const researchIndex = html.indexOf('social-research-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-research-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(researchIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(researchIndex);
    });

    it('targets the Research center without animating dialogs or PDF canvas', () => {
        const runtime = readSource('assets/js/pages/social-research-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-research-loading.css');

        expect(runtime).toContain("activePanel !== 'research'");
        expect(runtime).toContain('.social-neo-research-shell');
        expect(runtime).toContain('.social-neo-research-hero');
        expect(runtime).toContain('.social-neo-research-catalog');
        expect(runtime).toContain('.social-neo-research-card');
        expect(runtime).toContain('.social-neo-research-reader');
        expect(runtime).toContain('.social-neo-research-pdf-shell');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialResearchAssemblyState');
        expect(runtime).toContain('observeRenderedResearch');
        expect(runtime).toContain('delete center.dataset.socialResearchAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(interactions).toContain('function queueSocialResearchMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain("reason === 'research-reader-open'");
        expect(interactions).toContain('window.__kiuStartSocialResearchLoadingMotion');
        expect(interactions).not.toContain('section.dataset.socialResearchAssemblyRoot');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-research-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
    });

    it('starts the shared engine for an already-rendered Research center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="research"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-research-shell">
                        <section class="social-neo-card social-neo-research-hero home-hover-chip">
                            <div class="social-neo-research-hero-actions">
                                <button class="lux-primary-btn" type="button">Deposit</button>
                            </div>
                            <div class="social-neo-research-tabs">
                                <button class="lux-secondary-btn social-neo-research-tab" type="button">Faculty</button>
                            </div>
                        </section>
                        <section class="social-neo-card social-neo-research-catalog home-hover-chip">
                            <div class="social-neo-research-grid">
                                <article class="social-neo-card social-neo-research-card home-hover-chip">
                                    <strong>Paper</strong>
                                    <button class="lux-secondary-btn" type="button">Open</button>
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
        new Function('window', readSource('assets/js/pages/social-research-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialResearchLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialResearchLoadingMotion;
            delete window.__kiuStartSocialResearchLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Research module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="research"></div>
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
        new Function('window', readSource('assets/js/pages/social-research-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-stack social-neo-research-shell">
                    <section class="social-neo-card social-neo-research-hero">
                        <button class="lux-primary-btn" type="button">Deposit</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialResearchLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialResearchLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialResearchLoadingMotion;
            delete window.__kiuStartSocialResearchLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Research assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260816-social-cpuperf1'");
        expect(sw).toContain('social-research-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-research-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
