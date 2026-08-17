import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('Social Messages loading animation', () => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    it('loads Messages motion before Social interactions', () => {
        const html = readSource('social.html');
        const sharedIndex = html.indexOf('lux-assembly-loading-runtime.js?v=20260818-visualqueue1');
        const messagesIndex = html.indexOf('social-messages-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner4');
        const interactionsIndex = html.indexOf('social-page-interactions-runtime.js?v=20260810-socialbootveil2');

        expect(html).toContain('social-messages-loading.css?v=20260815-socialassemblyclean1');
        expect(sharedIndex).toBeGreaterThan(-1);
        expect(messagesIndex).toBeGreaterThan(sharedIndex);
        expect(interactionsIndex).toBeGreaterThan(messagesIndex);
    });

    it('targets the Messages center without animating dialogs', () => {
        const runtime = readSource('assets/js/pages/social-messages-loading-runtime.js');
        const interactions = readSource('assets/js/pages/social-page-interactions-runtime.js');
        const css = readSource('assets/css/social-messages-loading.css');

        expect(runtime).toContain("activePanel !== 'messages'");
        expect(runtime).toContain('.social-neo-messages');
        expect(runtime).toContain('.social-neo-messages__inbox');
        expect(runtime).toContain('.social-neo-messages__inbox-filters');
        expect(runtime).toContain('.social-neo-chat-item');
        expect(runtime).toContain('.social-neo-messages__thread-shell');
        expect(runtime).toContain('.social-neo-message');
        expect(runtime).toContain("'[role=\"dialog\"]'");
        expect(runtime).toContain("'#social-neo-call-overlay'");
        expect(runtime).toContain('flattenInnerTargets: true');
        expect(runtime).toContain('socialMessagesAssemblyState');
        expect(runtime).toContain('observeRenderedMessages');
        expect(runtime).toContain('delete center.dataset.socialMessagesAssemblyState');
        expect(runtime).toContain("phase === 'idle' || force");
        expect(runtime).not.toContain('(force && isNewSection)');
        expect(runtime).toContain('options?.force');
        expect(interactions).toContain('function queueSocialMessagesMotion(center, activePanel, reason)');
        expect(interactions).toContain('if (r === `${target}-module`)');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain('if (r === `panel-${target}` || r === `${target}-module` || r === `${target}-tab`) return true;');
        expect(interactions).toContain("reason === 'chat-read'");
        expect(interactions).toContain("reason === 'chat-upsert'");
        expect(interactions).toContain('assemblyInFlight');
        expect(interactions).toContain('Only invalidate in-flight starts when leaving Messages');
        expect(interactions).toContain('Start sync in this turn');
        expect(interactions).toContain('[data-social-messages-assembly-root]');
        expect(interactions).toContain('window.__kiuStartSocialMessagesLoadingMotion');
        expect(interactions).toContain('startMotion(center, { force: true })');
        expect(interactions).not.toContain('section.dataset.socialMessagesAssemblyRoot');
        expect(css).toContain('Keep openers clickable');
        expect(css).toContain('prefers-reduced-motion');
        expect(css).toContain('social-messages-assembly-active');
        expect(css).toContain('.social-neo-module-loading');
        expect(css).not.toContain(':not([data-social-messages-assembly-root="1"])');
        const shellNav = readSource('assets/js/pages/social-shell-nav.js');
        expect(shellNav).toContain("setPanel('messages', { skipRender: true })");
        const panelMessagesPaint = shellNav.indexOf("const openResult = renderSocialPageNow('panel-messages')");
        expect(panelMessagesPaint).toBeGreaterThan(-1);
        expect(shellNav.indexOf('markPortalChatMessagesRead(activeChatId)', panelMessagesPaint))
            .toBeGreaterThan(panelMessagesPaint);
        expect(interactions).toContain('options?.skipRender');
    });

    it('starts the shared engine for an already-rendered Messages center', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="messages"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-messages is-thread-open">
                        <section class="social-neo-chat-list social-neo-messages__inbox">
                            <header class="social-neo-messages__inbox-header">
                                <div class="social-neo-messages__inbox-filters" role="tablist">
                                    <button class="social-neo-tab is-active" type="button" role="tab">All</button>
                                </div>
                            </header>
                            <div class="social-neo-chat-items">
                                <button class="social-neo-chat-item is-active" type="button">Ada</button>
                            </div>
                        </section>
                        <section class="social-neo-messages__thread-shell lux-soft-chrome home-hover-chip">
                            <div class="social-neo-messages__thread-chrome">
                                <button class="lux-primary-btn" type="button">Call</button>
                            </div>
                            <article class="social-neo-message">
                                <strong>Ada</strong>
                                <button class="lux-secondary-btn" type="button">Remove</button>
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
        new Function('window', readSource('assets/js/pages/social-messages-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
        } finally {
            window.__kiuSocialMessagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialMessagesLoadingMotion;
            delete window.__kiuStartSocialMessagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('replays after the Messages module loading stub is replaced', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="messages"></div>
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
        new Function('window', readSource('assets/js/pages/social-messages-loading-runtime.js'))(window);

        try {
            await wait(60);
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-messages">
                    <section class="social-neo-chat-list social-neo-messages__inbox">
                        <button class="lux-primary-btn" type="button">All</button>
                    </section>
                </div>
            `;
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialMessagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialMessagesLoadingMotion;
            delete window.__kiuStartSocialMessagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('does not restart assembly on unforced remount after ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="messages"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-messages">
                        <section class="social-neo-chat-list social-neo-messages__inbox">
                            <button class="lux-primary-btn" type="button" data-action="panel-messages">All</button>
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
        new Function('window', readSource('assets/js/pages/social-messages-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
            document.querySelector('#social-neo-center-region').innerHTML = `
                <div class="social-neo-messages">
                    <section class="social-neo-chat-list social-neo-messages__inbox">
                        <button class="lux-primary-btn" type="button" data-action="panel-messages">All</button>
                    </section>
                </div>
            `;
            await wait(200);
            expect(window.__kiuStartSocialMessagesLoadingMotion(document.querySelector('#social-neo-center-region'))).toBe(false);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
            expect(document.body.classList.contains('social-messages-assembly-active')).toBe(false);

            const restarted = window.__kiuStartSocialMessagesLoadingMotion(
                document.querySelector('#social-neo-center-region'),
                { force: true }
            );
            expect(restarted).toBe(true);
            await wait(300);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialMessagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialMessagesLoadingMotion;
            delete window.__kiuStartSocialMessagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('force-replays even when center assembly dataset lingered', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="messages"></div>
                <div id="social-neo-center-region" data-social-messages-assembly-state="ready">
                    <div class="social-neo-messages">
                        <section class="social-neo-chat-list social-neo-messages__inbox">
                            <button class="lux-primary-btn" type="button">All</button>
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
        new Function('window', readSource('assets/js/pages/social-messages-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
            const center = document.querySelector('#social-neo-center-region');
            // Remount without assembly root (panel revisit) while center dataset lingered.
            center.innerHTML = `
                <div class="social-neo-messages">
                    <section class="social-neo-chat-list social-neo-messages__inbox">
                        <button class="lux-primary-btn" type="button">All</button>
                    </section>
                </div>
            `;
            center.dataset.socialMessagesAssemblyState = 'ready';
            calls.length = 0;
            const started = window.__kiuStartSocialMessagesLoadingMotion(center, { force: true });
            expect(started).toBe(true);
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialMessagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialMessagesLoadingMotion;
            delete window.__kiuStartSocialMessagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('force-replays after leaving Messages even when phase stayed ready', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="page-social">
                <div id="social-neo-root" data-panel="messages"></div>
                <div id="social-neo-center-region">
                    <div class="social-neo-messages">
                        <section class="social-neo-chat-list social-neo-messages__inbox">
                            <button class="lux-primary-btn" type="button">All</button>
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
        new Function('window', readSource('assets/js/pages/social-messages-loading-runtime.js'))(window);

        try {
            await wait(300);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
            // Simulate leave → return with shell root attr still present (Events gate failed here).
            document.body.classList.remove('social-messages-assembly-ready', 'social-messages-assembly-active');
            document.querySelector('#social-neo-root').dataset.panel = 'messages';
            const center = document.querySelector('#social-neo-center-region');
            center.dataset.socialMessagesAssemblyState = 'ready';
            center.firstElementChild.dataset.socialMessagesAssemblyRoot = '1';
            calls.length = 0;
            const restarted = window.__kiuStartSocialMessagesLoadingMotion(center, { force: true });
            expect(restarted).toBe(true);
            await wait(300);
            expect(calls).toHaveLength(0);
            expect(document.querySelectorAll('.is-flight, [class*="assembly-staging"]').length).toBe(0);
            expect(window.__kiuSocialMessagesLoadingMotion?.getState?.().phase).toBe('ready');
        } finally {
            window.__kiuSocialMessagesLoadingObserver?.disconnect();
            if (originalAnimate) Element.prototype.animate = originalAnimate;
            else delete Element.prototype.animate;
            window.__kiuCreateAssemblyLoadingMotion = originalFactory;
            delete window.__kiuSocialMessagesLoadingMotion;
            delete window.__kiuStartSocialMessagesLoadingMotion;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    });

    it('cache-busts Messages assets', () => {
        const sw = readSource('service-worker.js');
        expect(sw).toContain("CACHE_NAME = 'kiu-portal-shell-v20260818-shellstage2'");
        expect(sw).toContain('social-messages-loading.css?v=20260815-socialassemblyclean1');
        expect(sw).toContain('social-messages-loading-runtime.js?v=20260815-socialassemblyclean1&perf=20260816-singleowner4');
        expect(sw).toContain('social-page-interactions-runtime.js?v=20260810-socialbootveil2');
    });
});
