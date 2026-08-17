import { describe, expect, it, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Home loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    afterEach(() => {
        window.__kiuSocialHomeLoadingCleanup?.();
        window.__kiuSocialHomeLoadingMotion?.abort?.();
        delete window.__kiuSocialHomeLoadingCleanup;
        delete window.__kiuSocialHomeLoadingObserver;
        delete window.__kiuSocialHomeLoadingMotion;
        delete window.__kiuStartSocialHomeLoadingMotion;
        delete window.__kiuSocialAssemblyMotionOwner;
        window.__KIU_INSTANT_ASSEMBLY_LOADING = true;
        document.body.innerHTML = '';
        document.body.className = '';
        document.documentElement.className = '';
    });

    it('wires only the Home center motion after the shared engine', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        const homeIndex = html.indexOf('social-home-loading-runtime.js?v=20260817-instantassembly1');

        expect(html).toContain('social-home-loading.css?v=20260815-socialassemblyclean1');
        expect(html).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
        expect(html).toContain('social-groups-loading.css?v=20260815-socialassemblyclean1');
        expect(html).toContain('social-groups-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(html).toContain('social-community-loading.css?v=20260815-socialassemblyclean1');
        expect(html).toContain('social-community-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
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
        expect(runtime).toContain('.social-neo-post-body');
        expect(runtime).toContain('.social-neo-post-card');
        expect(runtime).toContain('.social-neo-post-head');
        expect(runtime).toContain('.social-neo-post-actions');
        expect(runtime).toContain('.social-neo-feed-header-card');
        expect(runtime).toContain('.social-neo-feed-composer-zone');
        expect(runtime).toContain('.social-neo-media');
        expect(runtime).toContain('.social-neo-post-entity-links');
        expect(runtime).toContain('.social-pagination-controls');
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('maxTotalAssemblyMs: 2000');
        expect(runtime).toContain('maxShellWaitMs: 900');
        expect(runtime).toContain('contentWaitMaxMs: 1200');
        expect(runtime).toContain("outerFlightSelector: [\n            '[data-social-home-assembly-root=\"1\"]'");
        expect(runtime).toContain('.social-neo-feed-mobile-stack');
        expect(runtime).toContain('.social-neo-feed-hero-head');
        expect(runtime).not.toMatch(/feedRegions = \[[\s\S]*?'span'/);
        expect(runtime).not.toMatch(/feedRegions = \[[\s\S]*?'strong'/);
        expect(runtime).not.toMatch(/feedRegions = \[[\s\S]*?'img'/);
        expect(runtime).toContain('startCurrentFeedMotion();');
        expect(runtime).toContain('.lux-picker-btn');
        expect(runtime).toContain('#social-neo-overlay-portal');
        expect(readSource('assets/css/social-home-loading.css')).toContain('prefers-reduced-motion');
        expect(readSource('assets/css/social-home-loading.css')).toContain('.social-neo-card.sn-mat-soft');
        expect(runtime).toContain('observeRenderedFeed');
        expect(runtime).toContain('new MutationObserver');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).toContain('motion.softRestart');
        expect(runtime).not.toContain('motion.abort()');
        expect(runtime).not.toContain('social-center-assembly-prehide');
        expect(runtime).toContain('return Boolean(getFeedSection())');
        expect(interactions).toContain('shouldPrehideCenterForAssembly');
        expect(interactions).toContain('social-center-assembly-prehide');
        expect(readSource('assets/js/shared/lux-assembly-loading-runtime.js'))
            .toContain("document.body?.classList.remove('social-center-assembly-prehide')");
        expect(readSource('assets/js/shared/lux-assembly-loading-runtime.js'))
            .toContain('waitForAppContentPaint');
        expect(readSource('assets/css/social-assembly-prehide.css')).toContain('social-center-assembly-prehide');
        expect(readSource('social.html')).toContain('social-assembly-prehide.css?v=20260815-socialassemblyclean1');
        expect(runtime).not.toContain("section.dataset.socialHomeAssemblyRoot === '1'");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).not.toContain('motion.replay');
        expect(interactions).toContain('function queueSocialHomeMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).not.toContain("section.dataset.socialHomeAssemblyRoot = '1'");
        expect(interactions).toContain("[data-social-home-assembly-root]");
        expect(interactions).toContain("panel !== 'feed'");
        expect(interactions).toContain('window.cancelAnimationFrame');
        expect(interactions).toContain('window.__kiuStartSocialHomeLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).toContain('Start sync in this turn');
        // Sync start when the start fn exists (not rAF-wrapped for the happy path).
        const homeQueue = interactions.match(
            /function queueSocialHomeMotion[\s\S]*?function queueSocialCommunityMotion/
        )?.[0] || '';
        expect(homeQueue).toContain("const startMotion = window.__kiuStartSocialHomeLoadingMotion");
        expect(homeQueue).toMatch(
            /if \(typeof startMotion !== 'function'\) \{[\s\S]*?return;\n            \}\n            try \{\n                startMotion\(center, \{ force: true \}\);/
        );
        expect(interactions).not.toContain('social-section-assembly');
        // Non-boot: start under veil then revealShell. Boot defers reveal until assembly run().
        expect(interactions).toContain("__kiuSocialBootAwaitingAssemblyReveal = true");
        expect(interactions).toContain('window.__kiuSocialRevealShellNow = revealShell');
        expect(interactions).toContain('releaseSocialBootShellReveal');
        expect(interactions).toContain('if (!deferBootReveal)');
        expect(interactions).toContain("reason === 'boot' || reason === 'social-bootstrap'");
        const centerRender = interactions.match(
            /if \(renderPlan\.center\) \{[\s\S]*?queueSocialPhotographyMotion\(shell\.center, activePanel, reason\);[\s\S]*?if \(!deferBootReveal\)/
        )?.[0] || '';
        expect(centerRender).toContain('queueSocialHomeMotion(shell.center, activePanel, reason)');
        expect(centerRender).not.toMatch(/revealShell\(\);\s*queueSocialHomeMotion/);
        expect(interactions).toContain("document.body?.classList.add('social-center-assembly-prehide')");
        expect(readSource('assets/js/theme-primer.js')).toContain("classList.contains('lux-route-social')");
        expect(readSource('assets/js/theme-primer.js')).toContain("var isSocial = b.classList.contains('lux-route-social');");
        expect(readSource('assets/js/features/navigation.js')).toContain("entryId === 'social'");
        expect(readSource('assets/js/features/navigation.js')).toContain('__kiuSocialShellRevealAllowed');
        expect(readSource('assets/js/pages/social-page-shell-runtime.js')).toContain('__kiuSocialShellRevealAllowed = true');
        expect(readSource('assets/js/pages/social-page-shell-runtime.js')).toContain('__kiuSocialBootForceUnveil');
        expect(readSource('assets/css/social-home-loading.css')).toContain(
            '.is-social-home-assembly-staging:not(.is-flight)'
        );
        expect(readSource('assets/css/social-home-loading.css')).not.toContain(
            'is-social-home-assembly-staging {\n  opacity: 0 !important;'
        );
        expect(readSource('assets/css/social-home-loading.css')).not.toMatch(
            /\.is-social-home-assembly-staging[^{]*\{\s*opacity:\s*0\s*!important/
        );
        expect(readSource('assets/css/social-home-loading.css')).not.toContain(
            ':not(:is(.kiu-social-home-assembly-target *))'
        );
        expect(readSource('assets/css/social-home-loading.css')).not.toContain(
            '[data-social-home-assembly-root="1"] *:not(.kiu-social-home-assembly-target)'
        );
        expect(readSource('assets/css/social-home-loading.css')).not.toContain(
            'body.social-home-assembly-ready #social-neo-center-region [data-social-home-assembly-root="1"] *:not(.kiu-social-home-assembly-target)'
        );
        expect(readSource('assets/css/social-home-loading.css')).toContain('Keep openers clickable');
        const boot = readSource('assets/js/pages/social-page-boot-runtime.js');
        expect(boot).toContain('function ensureActivePanelModule(panel)');
        expect(boot).toContain('Promise.resolve(ensureActivePanelModule(activePanel))');
        expect(boot).toContain("renderSocialPageNow('hydrate-ready')");
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
        window.__kiuStartSocialHomeLoadingMotion?.(
            document.querySelector('#social-neo-center-region'),
            { force: true }
        );

        try {
            await wait(80);
            expect(window.__kiuSocialHomeLoadingMotion?.getState?.().phase).toBe('ready');
            expect(calls).toHaveLength(0);
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

    it('skips boot intro on module-loading placeholders and starts after real shell', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <div id="page-social">
                <div id="social-neo-root" data-panel="feed"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-stack social-neo-module-loading" aria-busy="true"></div>
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
            const center = document.querySelector('#social-neo-center-region');
            // Placeholder: force start must no-op (no section).
            expect(window.__kiuStartSocialHomeLoadingMotion(center, { force: true })).toBe(false);
            expect(calls).toHaveLength(0);

            center.innerHTML = `
                <div class="social-neo-feed-shell">
                    <section class="social-neo-card lux-soft-chrome home-hover-chip">
                        <button class="lux-secondary-btn" type="button">Home</button>
                    </section>
                </div>
            `;
            document.documentElement.classList.add('kiu-shell-ready');
            document.body.classList.add('kiu-shell-ready');
            document.documentElement.classList.remove('kiu-shell-loading');
            document.body.classList.remove('kiu-shell-loading');

            expect(window.__kiuStartSocialHomeLoadingMotion(center, { force: true })).toBe(true);
            await wait(80);
            expect(window.__kiuSocialHomeLoadingMotion?.getState?.().phase).toBe('ready');
            expect(calls).toHaveLength(0);
        } finally {
            window.__kiuSocialHomeLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialHomeLoadingMotion;
            delete window.__kiuStartSocialHomeLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
            document.documentElement.className = '';
        }
    });

    it('force-aborts a stale ready phase before restarting Feed intro', async () => {
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
        Element.prototype.animate = function () {
            return { finished: Promise.resolve(), cancel() {} };
        };
        delete window.__kiuCreateAssemblyLoadingMotion;
        new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
        new Function('window', readSource('assets/js/pages/social-home-loading-runtime.js'))(window);

        try {
            const center = document.querySelector('#social-neo-center-region');
            document.documentElement.classList.add('kiu-shell-ready');
            document.body.classList.add('kiu-shell-ready');
            expect(window.__kiuStartSocialHomeLoadingMotion(center, { force: true })).toBe(true);
            await wait(220);
            expect(window.__kiuSocialHomeLoadingMotion.getState().phase).toBe('ready');

            center.innerHTML = `
                <div class="social-neo-feed-shell">
                    <article class="social-neo-card lux-soft-chrome home-hover-chip">
                        <button class="lux-primary-btn" type="button">Refresh</button>
                    </article>
                </div>
            `;
            expect(window.__kiuStartSocialHomeLoadingMotion(center, { force: true })).toBe(true);
            await wait(220);
            expect(window.__kiuSocialHomeLoadingMotion.getState().phase).toBe('ready');
            expect(document.body.classList.contains('social-home-assembly-active')).toBe(false);
        } finally {
            window.__kiuSocialHomeLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialHomeLoadingMotion;
            delete window.__kiuStartSocialHomeLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
            document.documentElement.className = '';
        }
    });

    it('cache-busts the Home motion assets without removing shared engine assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2'");
        expect(sw).toContain('social-home-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-community-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-home-loading-runtime.js?v=20260817-instantassembly1');
        expect(sw).toContain('social-community-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-groups-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-groups-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner3');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
        expect(sw).toContain('lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        expect(sw).toContain('social-assembly-prehide.css?v=20260815-socialassemblyclean1');
        expect(sw).not.toContain('social-loading-runtime');
    });
});
