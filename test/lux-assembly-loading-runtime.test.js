const { readFileSync } = require('fs');
const { join } = require('path');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function installFactory() {
    delete window.__kiuCreateAssemblyLoadingMotion;
    new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
    return window.__kiuCreateAssemblyLoadingMotion;
}

function wait(ms = 40) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function createMotion({ reducedMotion = false, partialAnimation = false, duration = 0 } = {}) {
    document.body.innerHTML = `
        <main id="page-assembly">
            <div id="assembly-root" class="assembly-shell">
                <section id="assembly-center-region">
                    <article class="assembly-card"><button type="button"><span>Open</span></button></article>
                </section>
            </div>
        </main>
        <div id="assembly-portal" class="assembly-portal">
            <button type="button">Shortcut</button>
        </div>
    `;
    document.body.className = 'lux-route-assembly';
    const root = document.querySelector('#page-assembly');
    const portal = document.querySelector('#assembly-portal');
    root.dataset.renderReady = '1';

    const calls = [];
    const originalAnimate = Element.prototype.animate;
    const originalMatchMedia = window.matchMedia;
    Element.prototype.animate = function (keyframes, _timing) {
        calls.push({ element: this, keyframes });
        if (partialAnimation) return { cancel() {} };
        let resolve;
        const finished = new Promise((done) => { resolve = done; });
        const animation = {
            finished,
            cancel() {
                resolve();
            }
        };
        window.setTimeout(resolve, duration);
        return animation;
    };
    window.matchMedia = () => ({ matches: reducedMotion });

    const createAssemblyLoadingMotion = installFactory();
    const motion = createAssemblyLoadingMotion({
        isRoute: () => true,
        getPageRoot: () => root,
        getObserverRoot: () => document.body,
        getExternalRoots: () => [portal],
        isContentReady: () => root.dataset.renderReady === '1',
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        outerSelectors: ['#assembly-root', '#assembly-portal'],
        granularSelector: ['#assembly-root', '#assembly-center-region', '.assembly-card', 'section', 'article', 'span'],
        controlSelector: ['button'],
        transformSafeSelector: ['button'],
        lateReplaySelector: ['#assembly-center-region', '#assembly-portal'],
        classes: {
            active: 'assembly-active',
            ready: 'assembly-ready',
            target: 'assembly-target',
            outer: 'assembly-outer',
            inner: 'assembly-inner',
            staging: 'assembly-staging'
        },
        timing: {
            maxShellWaitMs: 40,
            contentWaitMaxMs: 40,
            lateAssemblyGraceMs: 5,
            maxAssemblyWindowMs: 80,
            maxTotalAssemblyMs: 160
        }
    });
    motion.install();
    motion.start(root);

    return {
        motion,
        calls,
        restore() {
            this.motion.getState().observer?.disconnect();
            this.motion.abort();
            Element.prototype.animate = originalAnimate;
            window.matchMedia = originalMatchMedia;
            document.body.innerHTML = '';
            document.body.className = '';
        }
    };
}

describe('shared assembly instant readiness lifecycle', () => {
    it('reveals initial shells and external portal targets without WAAPI', async () => {
        const fixture = createMotion({ duration: 1 });

        await wait(120);

        expect(fixture.calls).toHaveLength(0);
        expect(fixture.motion.getState().phase).toBe('ready');
        expect(document.body.classList.contains('assembly-ready')).toBe(true);
        expect(document.querySelector('#assembly-portal').classList.contains('assembly-target')).toBe(true);
        expect(document.querySelectorAll('.assembly-staging, .is-flight')).toHaveLength(0);

        fixture.restore();
    });

    it('replays only the requested region and coalesces rapid replacements', async () => {
        const fixture = createMotion({ duration: 20 });

        await wait(50);
        const initialCalls = fixture.calls.length;
        fixture.motion.replay(['#assembly-center-region']);
        fixture.motion.replay(['#assembly-center-region']);
        fixture.motion.replay(['#assembly-center-region']);
        await wait(90);

        expect(fixture.calls.length).toBe(initialCalls);
        expect(fixture.motion.getState().phase).toBe('ready');
        expect(document.body.classList.contains('assembly-active')).toBe(false);
        expect(document.querySelectorAll('.assembly-staging, .is-flight')).toHaveLength(0);
        expect(document.querySelector('#assembly-portal').classList.contains('is-flight')).toBe(false);

        fixture.restore();
    });

    it('settles visibly when reduced motion or partial WAAPI is present', async () => {
        const reduced = createMotion({ reducedMotion: true });
        await wait(80);
        expect(reduced.calls).toHaveLength(0);
        expect(reduced.motion.getState().phase).toBe('ready');
        reduced.restore();

        const partial = createMotion({ partialAnimation: true });
        await wait(80);
        expect(partial.calls).toHaveLength(0);
        expect(partial.motion.getState().phase).toBe('ready');
        expect(document.body.classList.contains('assembly-active')).toBe(false);
        partial.restore();
    });

    it('keeps explicit replay and diagnostics wired in the shared engine', () => {
        const shared = readSource('assets/js/shared/lux-assembly-loading-runtime.js');

        expect(shared).toContain('function replay(requestedSelectors = \'\')');
        expect(shared).toContain('function abort()');
        expect(shared).toContain('function softRestart(root = getPageRoot())');
        expect(shared).toContain('function forceReady()');
        expect(shared).toContain("document.body?.classList.remove('social-center-assembly-prehide')");
        expect(shared).toContain('__kiuSocialBootAwaitingAssemblyReveal');
        expect(shared).toContain('__kiuSocialRevealShellNow');
        expect(shared).toContain('bootAwaitingReveal');
        expect(shared).toContain('waitForAppContentPaint');
        expect(shared).toContain('isAppContentPaintable');
        expect(shared).toContain('didBootReveal');
        expect(shared).toContain('flightDeferTimer');
        expect(shared).toContain('watchdog-force-ready');
        expect(shared).toContain('getExternalRoots');
        expect(shared).toContain('lastError');
        expect(shared).toContain('animation-finished-unsupported');
        expect(shared).toContain('global.__KIU_INSTANT_ASSEMBLY_LOADING = global.__KIU_INSTANT_ASSEMBLY_LOADING !== false');
        expect(shared).toContain('const instantLoading = options.instantLoading !== undefined');
        expect(shared).toContain('if (instantLoading || reduceMotion || !state.animationSupported)');
        expect(shared).toContain('const autoStart = options.autoStart !== false');
        expect(shared).toContain('if (!autoStart) return;');
    });

    it('clears social-center-assembly-prehide when run starts flight', async () => {
        document.body.innerHTML = `
            <main id="page-assembly">
                <div id="assembly-root" class="assembly-shell">
                    <section id="assembly-center-region">
                        <article class="assembly-card"><button type="button"><span>Open</span></button></article>
                    </section>
                </div>
            </main>
        `;
        document.body.className = 'lux-route-assembly social-center-assembly-prehide kiu-shell-loading';
        document.documentElement.classList.add('kiu-shell-loading');
        const root = document.querySelector('#page-assembly');
        root.dataset.renderReady = '1';
        let revealCalls = 0;
        window.__kiuSocialBootAwaitingAssemblyReveal = true;
        window.__kiuSocialRevealShellNow = () => {
            revealCalls += 1;
            document.documentElement.dataset.kiuLoadStage = 'panel';
        };

        const createAssemblyLoadingMotion = installFactory();
        const motion = createAssemblyLoadingMotion({
            isRoute: () => true,
            getPageRoot: () => root,
            getObserverRoot: () => document.body,
            isContentReady: () => true,
            outerSelectors: ['#assembly-root'],
            granularSelector: ['.assembly-card'],
            classes: {
                active: 'assembly-active',
                ready: 'assembly-ready',
                target: 'assembly-target',
                staging: 'assembly-staging'
            },
            timing: {
                maxShellWaitMs: 400,
                contentWaitMaxMs: 400
            }
        });

        expect(document.body.classList.contains('social-center-assembly-prehide')).toBe(true);
        motion.start(root);
        // Boot awaiting allows run under the veil without waiting for shell ready.
        await wait(80);
        expect(document.body.classList.contains('social-center-assembly-prehide')).toBe(false);
        expect(revealCalls).toBe(1);
        expect(window.__kiuSocialBootAwaitingAssemblyReveal).toBe(false);
        expect(motion.getState().phase).toBe('ready');

        delete window.__kiuSocialBootAwaitingAssemblyReveal;
        delete window.__kiuSocialRevealShellNow;
        document.body.innerHTML = '';
        document.body.className = '';
        document.documentElement.className = '';
        delete document.documentElement.dataset.kiuLoadStage;
    });

    it('softRestart keeps assembly-active across restart', async () => {
        const fixture = createMotion({ duration: 1 });
        try {
            await wait(120);
            expect(fixture.motion.getState().phase).toBe('ready');

            const root = document.querySelector('#page-assembly');
            expect(typeof fixture.motion.softRestart).toBe('function');
            expect(fixture.motion.softRestart(root)).toBe(true);
            // Instant mode settles in the same readiness turn.
            expect(fixture.motion.getState().phase).toBe('ready');
            expect(document.body.classList.contains('assembly-active')).toBe(false);
            expect(document.body.classList.contains('assembly-ready')).toBe(true);

            await wait(120);
            expect(fixture.motion.getState().phase).toBe('ready');
            expect(document.body.classList.contains('assembly-active')).toBe(false);
            expect(document.body.classList.contains('assembly-ready')).toBe(true);
        } finally {
            fixture.restore();
        }
    });

    it('keeps the authored route skeleton visible while pending shell wait', async () => {
        document.body.innerHTML = `
            <main id="page-assembly">
                <div id="assembly-root" class="assembly-shell">
                    <section id="assembly-center-region">
                        <article class="assembly-card"><button type="button"><span>Open</span></button></article>
                    </section>
                </div>
            </main>
        `;
        document.body.className = 'lux-route-assembly';
        document.documentElement.classList.add('kiu-shell-loading');
        const root = document.querySelector('#page-assembly');
        let contentReady = false;
        root.dataset.renderReady = '1';

        const createAssemblyLoadingMotion = installFactory();
        const motion = createAssemblyLoadingMotion({
            isRoute: () => true,
            getPageRoot: () => root,
            getObserverRoot: () => document.body,
            isContentReady: () => contentReady,
            outerSelectors: ['#assembly-root'],
            granularSelector: ['.assembly-card'],
            classes: {
                active: 'assembly-active',
                ready: 'assembly-ready',
                target: 'assembly-target',
                staging: 'assembly-staging'
            },
            timing: {
                maxShellWaitMs: 200,
                contentWaitMaxMs: 200
            }
        });

        motion.start(root);
        expect(motion.getState().phase).toBe('pending');
        expect(document.documentElement.classList.contains('kiu-route-assembly-loading')).toBe(true);
        expect(document.body.classList.contains('kiu-route-assembly-loading')).toBe(true);
        expect(document.body.classList.contains('assembly-active')).toBe(false);
        expect(document.querySelector('.assembly-staging')).toBeNull();

        contentReady = true;
        document.documentElement.classList.remove('kiu-shell-loading');
        document.documentElement.classList.add('kiu-shell-ready');
        await wait(120);
        expect(motion.getState().phase).toBe('ready');
        expect(document.documentElement.classList.contains('kiu-route-assembly-loading')).toBe(false);
        expect(document.body.classList.contains('kiu-route-assembly-loading')).toBe(false);
        expect(document.body.classList.contains('assembly-active')).toBe(false);
        expect(document.body.classList.contains('assembly-ready')).toBe(true);

        document.body.innerHTML = '';
        document.body.className = '';
        document.documentElement.className = '';
    });

    it('aborts and restarts without leaving assembly-active', async () => {
        const fixture = createMotion({ duration: 1 });
        await wait(120);
        expect(fixture.motion.getState().phase).toBe('ready');

        fixture.motion.abort();
        expect(fixture.motion.getState().phase).toBe('idle');
        expect(document.body.classList.contains('assembly-active')).toBe(false);
        expect(document.body.classList.contains('assembly-ready')).toBe(false);

        fixture.motion.start(document.querySelector('#page-assembly'));
        await wait(120);
        expect(fixture.motion.getState().phase).toBe('ready');
        expect(document.body.classList.contains('assembly-ready')).toBe(true);

        fixture.restore();
    });

    it('forceReady clears pending without leaving assembly-active', async () => {
        document.body.innerHTML = `
            <main id="page-assembly">
                <div id="assembly-root" class="assembly-shell">
                    <section id="assembly-center-region">
                        <article class="assembly-card"><span>Open</span></article>
                    </section>
                </div>
            </main>
        `;
        document.body.className = 'lux-route-assembly';
        const root = document.querySelector('#page-assembly');
        root.dataset.renderReady = '1';

        const createAssemblyLoadingMotion = installFactory();
        const motion = createAssemblyLoadingMotion({
            isRoute: () => true,
            getPageRoot: () => root,
            getObserverRoot: () => document.body,
            isContentReady: () => false,
            outerSelectors: ['#assembly-root'],
            granularSelector: ['.assembly-card'],
            classes: {
                active: 'assembly-active',
                ready: 'assembly-ready',
                target: 'assembly-target',
                staging: 'assembly-staging'
            },
            timing: {
                maxShellWaitMs: 500,
                contentWaitMaxMs: 500
            }
        });

        motion.start(root);
        expect(motion.getState().phase).toBe('pending');
        motion.forceReady();
        expect(motion.getState().phase).toBe('idle');
        expect(document.body.classList.contains('assembly-active')).toBe(false);

        document.body.innerHTML = '';
        document.body.className = '';
    });

    it('watchdog settles hung late replay', async () => {
        const originalAnimate = Element.prototype.animate;
        let hangReplay = false;
        Element.prototype.animate = function (...args) {
            if (hangReplay) {
                return { finished: new Promise(() => {}), cancel() {} };
            }
            return originalAnimate.apply(this, args);
        };

        document.body.innerHTML = `
            <main id="page-assembly">
                <div id="assembly-root" class="assembly-shell">
                    <section id="assembly-center-region">
                        <article class="assembly-card"><button type="button"><span>Open</span></button></article>
                    </section>
                </div>
            </main>
            <div id="assembly-portal" class="assembly-portal">
                <button type="button">Shortcut</button>
            </div>
        `;
        document.body.className = 'lux-route-assembly';
        const root = document.querySelector('#page-assembly');
        const portal = document.querySelector('#assembly-portal');
        root.dataset.renderReady = '1';

        const createAssemblyLoadingMotion = installFactory();
        const motion = createAssemblyLoadingMotion({
            isRoute: () => true,
            getPageRoot: () => root,
            getObserverRoot: () => document.body,
            getExternalRoots: () => [portal],
            isContentReady: () => root.dataset.renderReady === '1',
            animateLateAfterReady: true,
            autoReplayLateMutations: false,
            outerSelectors: ['#assembly-root', '#assembly-portal'],
            granularSelector: ['#assembly-root', '#assembly-center-region', '.assembly-card', 'section', 'article', 'span'],
            controlSelector: ['button'],
            lateReplaySelector: ['#assembly-center-region', '#assembly-portal'],
            classes: {
                active: 'assembly-active',
                ready: 'assembly-ready',
                target: 'assembly-target',
                outer: 'assembly-outer',
                inner: 'assembly-inner',
                staging: 'assembly-staging'
            },
            timing: {
                maxShellWaitMs: 40,
                contentWaitMaxMs: 40,
                lateAssemblyGraceMs: 5,
                maxAssemblyWindowMs: 80,
                maxTotalAssemblyMs: 120
            }
        });
        motion.install();
        motion.start(root);
        await wait(120);
        expect(motion.getState().phase).toBe('ready');
        hangReplay = true;
        motion.replay(['#assembly-center-region']);
        expect(document.body.classList.contains('assembly-active')).toBe(false);
        await wait(40);
        expect(motion.getState().phase).toBe('ready');
        expect(document.body.classList.contains('assembly-active')).toBe(false);

        Element.prototype.animate = originalAnimate;
        document.body.innerHTML = '';
        document.body.className = '';
    });
});
