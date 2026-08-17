import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const readSource = (path) => readFileSync(join(process.cwd(), path), 'utf8');
const wait = (ms = 20) => new Promise((resolve) => setTimeout(resolve, ms));

function installShared() {
    delete window.__kiuCreateAssemblyLoadingMotion;
    window.__KIU_INSTANT_ASSEMBLY_LOADING = true;
    new Function('window', readSource('assets/js/shared/lux-assembly-loading-runtime.js'))(window);
    return window.__kiuCreateAssemblyLoadingMotion;
}

describe('instant portal assembly loading', () => {
    let originalAnimate;
    let originalInstantLoading;
    beforeEach(() => {
        originalAnimate = Element.prototype.animate;
        originalInstantLoading = window.__KIU_INSTANT_ASSEMBLY_LOADING;
        document.body.innerHTML = '';
        document.body.className = '';
        document.documentElement.className = '';
        delete window.markPortalShellReady;
    });

    afterEach(() => {
        Element.prototype.animate = originalAnimate;
        if (originalInstantLoading === undefined) delete window.__KIU_INSTANT_ASSEMBLY_LOADING;
        else window.__KIU_INSTANT_ASSEMBLY_LOADING = originalInstantLoading;
        document.body.innerHTML = '';
        document.body.className = '';
        document.documentElement.className = '';
        delete window.markPortalShellReady;
    });

    it('waits for content readiness, then reveals without WAAPI or stale loading classes', async () => {
        let ready = false;
        let shellRevealCalls = 0;
        document.body.className = 'lux-route-timetable kiu-shell-loading';
        document.body.innerHTML = `
            <main id="page-timetable"><section class="timetable-card"><button>Open</button></section></main>
            <main id="app-content" style="opacity:0"></main>
        `;
        document.documentElement.classList.add('kiu-shell-loading');
        window.markPortalShellReady = ({ force } = {}) => {
            shellRevealCalls += 1;
            expect(force).toBe(true);
            document.documentElement.classList.add('kiu-shell-ready');
            document.documentElement.classList.remove('kiu-shell-loading');
        };
        const animate = Element.prototype.animate;
        Element.prototype.animate = () => { throw new Error('instant path must not call WAAPI'); };
        const createMotion = installShared();
        const root = document.querySelector('#page-timetable');
        const motion = createMotion({
            isRoute: () => true,
            getPageRoot: () => root,
            getObserverRoot: () => root,
            isContentReady: () => ready,
            outerSelectors: ['.timetable-card'],
            granularSelector: ['button'],
            classes: {
                active: 'timetable-assembly-active',
                ready: 'timetable-assembly-ready',
                target: 'timetable-assembly-target',
                outer: 'timetable-assembly-outer',
                inner: 'timetable-assembly-inner',
                staging: 'is-timetable-assembly-staging'
            }
        });
        motion.start(root);
        await wait(20);
        expect(motion.getState().phase).toBe('pending');
        expect(shellRevealCalls).toBe(0);

        ready = true;
        await wait(30);
        expect(motion.getState().phase).toBe('ready');
        expect(shellRevealCalls).toBe(1);
        expect(document.body.classList.contains('timetable-assembly-active')).toBe(false);
        expect(document.body.classList.contains('timetable-assembly-ready')).toBe(true);
        expect(document.querySelectorAll('.is-timetable-assembly-staging, .is-flight')).toHaveLength(0);
        expect(document.querySelector('#app-content').style.opacity).toBe('1');
        Element.prototype.animate = animate;
    });

    it('keeps shell reveal immediate and makes timetable/social runtimes inherit the global flag', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        const primer = readSource('assets/js/theme-primer.js');
        const timetable = readSource('assets/js/pages/timetable-loading-runtime.js');
        const social = readSource('assets/js/pages/social-home-loading-runtime.js');
        const socialProjects = readSource('assets/js/pages/social-projects-loading-runtime.js');
        expect(primer).toContain('__KIU_INSTANT_ASSEMBLY_LOADING = window.__KIU_INSTANT_ASSEMBLY_LOADING !== false');
        expect(primer).toContain('html.kiu-instant-loading .fa-spin');
        expect(primer).toContain('html.kiu-instant-loading [class*="skeleton"]');
        expect(primer).toContain('html.kiu-instant-loading body.kiu-shell-loading::before');
        expect(primer).toContain('html.kiu-instant-loading body.kiu-shell-loading > #app-content');
        expect(primer).toContain('html.kiu-instant-loading[data-kiu-load-phase="degraded"]::after');
        expect(primer).toContain('--kiu-loading-background');
        expect(primer).toContain('--palette-${savedPalette}-dark');
        expect(navigation).toContain('window.__KIU_INSTANT_ASSEMBLY_LOADING !== false');
        expect(navigation).toContain('finishKiuShellReveal();');
        expect(timetable).toContain('window.__kiuCreateAssemblyLoadingMotion');
        expect(social).toContain('window.__kiuCreateAssemblyLoadingMotion');
        expect(socialProjects).toContain('window.__KIU_INSTANT_ASSEMBLY_LOADING !== false');
        expect(readSource('assets/js/shared/lux-assembly-loading-runtime.js'))
            .toContain('options.instantLoading !== undefined');
    });

    it('settles Social late panel mounts without replay motion', async () => {
        document.body.className = 'lux-route-social';
        document.body.innerHTML = `
            <main id="social-center"><section class="social-panel"><button>Existing</button></section></main>
        `;
        const animate = Element.prototype.animate;
        const calls = [];
        Element.prototype.animate = (...args) => { calls.push(args); throw new Error('late mount must not animate'); };
        const createMotion = installShared();
        const root = document.querySelector('#social-center');
        const motion = createMotion({
            isRoute: () => true,
            getPageRoot: () => root,
            getObserverRoot: () => root,
            isContentReady: () => true,
            autoReplayLateMutations: true,
            outerSelectors: ['.social-panel'],
            granularSelector: ['button'],
            classes: {
                active: 'social-assembly-active',
                ready: 'social-assembly-ready',
                target: 'social-assembly-target',
                outer: 'social-assembly-outer',
                inner: 'social-assembly-inner',
                staging: 'is-social-assembly-staging'
            }
        });
        motion.start(root);
        await wait(30);
        const late = document.createElement('button');
        late.textContent = 'Late module';
        root.querySelector('.social-panel').appendChild(late);
        await wait(30);
        expect(motion.getState().phase).toBe('ready');
        expect(calls).toHaveLength(0);
        expect(late.classList.contains('is-flight')).toBe(false);
        expect(late.classList.contains('is-social-assembly-staging')).toBe(false);
        Element.prototype.animate = animate;
    });
});
