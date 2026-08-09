/* Social Lost & Found center assembly configuration. */
(function installSocialLostFoundLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialLostFoundLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const lostFoundRegions = [
        '[data-social-lost-found-assembly-root="1"]',
        '.social-neo-lost-found-shell',
        '.social-neo-lost-found-hero',
        '.social-neo-lost-found-hero-head',
        '.social-neo-lost-found-hero-copy',
        '.social-neo-lost-found-hero-actions',
        '.social-neo-lost-found-hero-create-btn',
        '.social-neo-lost-found-hero-stats',
        '.social-neo-lost-found-hero-stat',
        '.social-neo-lost-found-hero-toolbar',
        '.social-neo-lost-found-tabs',
        '.social-neo-lost-found-hero-divider',
        '.social-neo-lf-listings',
        '.social-neo-lf-card',
        '.social-neo-lf-card-head',
        '.social-neo-lf-card-person',
        '.social-neo-lf-card-title-row',
        '.social-neo-lf-card-meta',
        '.social-neo-lf-card-summary',
        '.social-neo-lf-card-media-grid',
        '.social-neo-lf-card-media-frame',
        '.social-neo-lf-card-content',
        '.social-neo-lf-card-actions',
        '.social-neo-lf-card-desc',
        '.social-neo-lf-empty',
        '.social-neo-section-head',
        '.social-neo-pill',
        '.social-neo-badge-row',
        '.social-neo-entity-card',
        '.social-neo-empty',
        '.social-neo-empty-hero',
        '.lux-strip-card',
        '.lux-soft-chrome',
        '.surface-card',
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

    function getLostFoundSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isLostFoundSurfaceReady() {
        const section = getLostFoundSection();
        return Boolean(section && section.dataset.socialLostFoundAssemblyRoot === '1');
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isLostFoundSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-lost-found-assembly-root="1"]'],
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
        outerSelectors: ['[data-social-lost-found-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-lost-found-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-lost-found-assembly-root="1"]',
            '.social-neo-lost-found-shell',
            '.social-neo-lost-found-hero',
            '.social-neo-lost-found-hero-stats',
            '.social-neo-lost-found-hero-toolbar',
            '.social-neo-lf-listings',
            '.social-neo-lf-card'
        ],
        flattenInnerTargets: false,
        granularSelector: lostFoundRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-lost-found-assembly-active',
            ready: 'social-lost-found-assembly-ready',
            target: 'kiu-social-lost-found-assembly-target',
            outer: 'kiu-social-lost-found-assembly-outer',
            inner: 'kiu-social-lost-found-assembly-inner',
            structure: 'kiu-social-lost-found-assembly-structure',
            staging: 'is-social-lost-found-assembly-staging'
        },
        flightTiming: {
            outerDurationMs: 360,
            innerDurationMs: 240,
            innerMinDurationMs: 170,
            innerDepthStepMs: 12,
            outerStaggerMs: 18,
            innerStaggerMs: 10,
            outerMaxDelayMs: 56,
            innerMaxDelayMs: 72
        },
        timing: {
            maxShellWaitMs: 900,
            contentWaitMaxMs: 1200,
            lateAssemblyGraceMs: 100,
            maxAssemblyWindowMs: 1500,
            maxTotalAssemblyMs: 2000
        },
        rootStateDataset: 'socialLostFoundAssemblyState'
    });

    function startCurrentLostFoundMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getLostFoundSection(center);
        if (activePanel !== 'lost-and-found' || !section) return false;
        const isNewSection = section.dataset.socialLostFoundAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // look like new sections but must not re-enter assembly-active / PE-none.
        // Explicit queueSocialLostFoundMotion passes { force: true } for panel/tab switches.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialLostFoundAssemblyState;
        section.dataset.socialLostFoundAssemblyRoot = '1';
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedLostFound() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedLostFound, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (observerFrame) return;
            const run = () => {
                observerFrame = 0;
                startCurrentLostFoundMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialLostFoundLoadingObserver = observer;
    }

    window.__kiuSocialLostFoundLoadingMotion = motion;
    window.__kiuStartSocialLostFoundLoadingMotion = startCurrentLostFoundMotion;
    motion.install();
    observeRenderedLostFound();
    window.setTimeout(() => startCurrentLostFoundMotion(), 0);
})();
