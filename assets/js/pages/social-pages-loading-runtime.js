/* Social Pages center assembly configuration. */
(function installSocialPagesLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialPagesLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const pagesRegions = [
        '[data-social-pages-assembly-root="1"]',
        '.social-neo-pages-shell',
        '.social-neo-pages-hero',
        '.social-neo-pages-hero-header',
        '.social-neo-pages-hero-head',
        '.social-neo-pages-hero-actions',
        '.social-neo-pages-create-trigger',
        '.social-neo-pages-hero-grid',
        '.social-neo-pages-hero-tab',
        '.social-neo-pages-hero-tab-icon',
        '.social-neo-pages-hero-tab-copy',
        '.social-neo-pages-hero-toolbar',
        '.social-neo-pages-grid',
        '.social-neo-pages-empty-state',
        '.social-neo-page-card',
        '.social-neo-page-card-rich',
        '.social-neo-page-card-cover',
        '.social-neo-page-card-body',
        '.social-neo-page-card-brand',
        '.social-neo-page-card-meta',
        '.social-neo-page-card-actions',
        '.social-neo-page-card-support',
        '.social-neo-page-card-about',
        '.social-neo-page-card-desc-rail',
        '.social-neo-page-card-about-rail',
        '.social-neo-page-profile',
        '.social-neo-page-cover',
        '.social-neo-page-profile-header',
        '.social-neo-page-profile-brand',
        '.social-neo-page-profile-meta',
        '.social-neo-page-profile-actions',
        '.social-neo-page-profile-back',
        '.social-neo-page-profile-tabs',
        '.social-neo-page-profile-tab',
        '.social-neo-page-profile-tab-strip',
        '.social-neo-page-profile-layout',
        '.social-neo-page-about-card',
        '.social-neo-page-people-card',
        '.social-neo-page-people-stats',
        '.social-neo-page-people-open',
        '.social-neo-page-compose-block',
        '.social-neo-page-compose-cta',
        '.social-neo-page-compose-open-btn',
        '.social-neo-page-feed',
        '.social-neo-empty-hero',
        '.social-neo-section-head',
        '.social-neo-pill',
        '.social-neo-badge-row',
        '.social-neo-entity-card',
        '.lux-scroll-rail',
        '.lux-soft-chrome',
        '.home-hover-chip',
        '[data-lux-observed-surface="1"]',
        'h1, h2, h3, h4, h5, h6',
        'p',
        'strong',
        'span',
        'small',
        'label',
        'li',
        'i'
    ];

    const controls = [
        'a',
        'button',
        'input',
        'select',
        'textarea',
        '[role="button"]',
        '[role="tab"]',
        '.lux-primary-btn',
        '.lux-secondary-btn',
        '.lux-ghost-btn',
        '.lux-picker-btn'
    ];

    function getCenter() {
        return document.querySelector('#social-neo-center-region');
    }

    function getPagesSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isPagesSurfaceReady() {
        return Boolean(getPagesSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isPagesSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-pages-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i)',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: ['[data-social-pages-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-pages-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-pages-assembly-root="1"]',
            '.social-neo-pages-shell',
            '.social-neo-pages-hero',
            '.social-neo-pages-hero-header',
            '.social-neo-pages-hero-grid',
            '.social-neo-pages-hero-toolbar',
            '.social-neo-pages-grid',
            '.social-neo-page-card',
            '.social-neo-page-profile',
            '.social-neo-page-profile-header',
            '.social-neo-page-profile-tabs',
            '.social-neo-page-profile-layout',
            '.social-neo-page-compose-block',
            '.social-neo-page-feed'
        ],
        flattenInnerTargets: true,
        granularSelector: pagesRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-pages-assembly-active',
            ready: 'social-pages-assembly-ready',
            target: 'kiu-social-pages-assembly-target',
            outer: 'kiu-social-pages-assembly-outer',
            inner: 'kiu-social-pages-assembly-inner',
            structure: 'kiu-social-pages-assembly-structure',
            staging: 'is-social-pages-assembly-staging'
        },
        flightTiming: {
            outerDurationMs: 320,
            innerDurationMs: 220,
            innerMinDurationMs: 160,
            innerDepthStepMs: 12,
            outerStaggerMs: 16,
            innerStaggerMs: 8,
            outerMaxDelayMs: 48,
            innerMaxDelayMs: 64
        },
        timing: {
            maxShellWaitMs: 900,
            contentWaitMaxMs: 1200,
            lateAssemblyGraceMs: 100,
            maxAssemblyWindowMs: 1500,
            maxTotalAssemblyMs: 2000
        },
        rootStateDataset: 'socialPagesAssemblyState'
    });

    function startCurrentPagesMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getPagesSection(center);
        if (activePanel !== 'pages' || !section) return false;
        const isNewSection = section.dataset.socialPagesAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // look like new sections but must not re-enter assembly-active / PE-none.
        // Explicit queueSocialPagesMotion passes { force: true } for panel/tab switches.
        // Do not mark the root until we actually start — an early return must leave
        // Exposé gate: force must replay after leaving other sections even when
        // phase stayed `ready` and/or the shell root attr lingered.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialPagesAssemblyState;
        section.dataset.socialPagesAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedPages() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedPages, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'pages') return;
            const run = () => {
                observerFrame = 0;
                startCurrentPagesMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialPagesLoadingObserver = observer;
    }

    window.__kiuSocialPagesLoadingMotion = motion;
    window.__kiuStartSocialPagesLoadingMotion = startCurrentPagesMotion;
    motion.install();
    observeRenderedPages();
    window.setTimeout(() => startCurrentPagesMotion(), 0);
})();
