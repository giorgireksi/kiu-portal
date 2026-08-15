/* Social Home/Feed center assembly configuration. Other panels stay untouched. */
(function installSocialHomeLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialHomeLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    // Region shells only — leaf tags ride parent opacity (match Community nesting, not leaf explode).
    const feedRegions = [
        '[data-social-home-assembly-root="1"]',
        '.social-neo-feed-shell',
        '.social-neo-feed-header-card',
        '.social-neo-feed-mobile-stack',
        '.social-neo-feed-composer-zone',
        '.social-neo-feed-hero',
        '.social-neo-feed-hero-head',
        '.social-neo-feed-hero-actions',
        '.social-neo-hero-faculty',
        '.lux-picker-field',
        '.social-neo-feed-hero-stats',
        '.social-neo-feed-hero-stat',
        '.social-neo-feed-hero-grid',
        '.social-neo-feed-hero-tab',
        '.social-neo-feed-hero-scope',
        '.social-neo-feed-shell .social-neo-stack',
        '.social-neo-empty',
        '.social-neo-post-card',
        '.social-neo-post-head',
        '.social-neo-post-body',
        '.social-neo-post-actions',
        '.social-neo-media',
        '.social-neo-file',
        '.social-neo-post-entity-links',
        '.social-neo-shared',
        '.social-neo-post-metrics',
        '.social-neo-inline-metrics',
        '.social-pagination-controls'
    ];

    const controls = [
        'a',
        'button',
        'input',
        'select',
        'textarea',
        '[role="button"]',
        '.lux-primary-btn',
        '.lux-secondary-btn',
        '.lux-ghost-btn',
        '.lux-picker-btn'
    ];

    function getFeedCenter() {
        return document.querySelector('#social-neo-center-region');
    }

    function getFeedSection(center = getFeedCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || !section.matches('.social-neo-feed-shell, [data-social-home-assembly-root="1"]')
            || section.matches('.social-neo-card.sn-mat-soft, .social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isFeedSurfaceReady() {
        return Boolean(getFeedSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getFeedCenter,
        getObserverRoot: getFeedCenter,
        isContentReady: isFeedSurfaceReady,
        autoStart: true,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-home-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i):not(.social-neo-feed-header-divider)',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: [
            '[data-social-home-assembly-root="1"]',
            '.social-neo-feed-shell',
            '.social-neo-feed-header-card',
            '.social-neo-feed-mobile-stack',
            '.social-neo-feed-composer-zone',
            '.social-neo-feed-hero',
            '.social-neo-feed-shell .social-neo-stack',
            '.social-neo-post-card'
        ],
        outerFlightSelector: [
            '[data-social-home-assembly-root="1"]',
            '.social-neo-feed-shell',
            '.social-neo-feed-header-card',
            '.social-neo-feed-composer-zone',
            '.social-neo-feed-hero',
            '.social-neo-post-card'
        ],
        hierarchySelector: [
            '[data-social-home-assembly-root="1"]',
            '.social-neo-feed-shell',
            '.social-neo-feed-header-card',
            '.social-neo-feed-mobile-stack',
            '.social-neo-feed-composer-zone',
            '.social-neo-feed-hero',
            '.social-neo-feed-hero-head',
            '.social-neo-feed-hero-actions',
            '.social-neo-feed-hero-stats',
            '.social-neo-feed-hero-grid',
            '.social-neo-feed-hero-scope',
            '.social-neo-feed-shell .social-neo-stack',
            '.social-neo-post-card'
        ],
        flattenInnerTargets: true,
        granularSelector: feedRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-home-assembly-active',
            ready: 'social-home-assembly-ready',
            target: 'kiu-social-home-assembly-target',
            outer: 'kiu-social-home-assembly-outer',
            inner: 'kiu-social-home-assembly-inner',
            structure: 'kiu-social-home-assembly-structure',
            staging: 'is-social-home-assembly-staging'
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
        rootStateDataset: 'socialHomeAssemblyState'
    });

    function startCurrentFeedMotion(center = getFeedCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getFeedSection(center);
        if (activePanel !== 'feed' || !section) return false;
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // must not re-enter assembly-active. queueSocialHomeMotion passes { force: true }.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialHomeAssemblyState;
        section.dataset.socialHomeAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let feedObserverFrame = 0;
    function observeRenderedFeed() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedFeed, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (feedObserverFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'feed') return;
            const run = () => {
                feedObserverFrame = 0;
                startCurrentFeedMotion(getFeedCenter(), {
                    force: Boolean(window.__kiuSocialBootAwaitingAssemblyReveal || document.body?.classList.contains('kiu-shell-loading'))
                });
            };
            feedObserverFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialHomeLoadingObserver = observer;
    }

    window.__kiuSocialHomeLoadingMotion = motion;
    window.__kiuStartSocialHomeLoadingMotion = startCurrentFeedMotion;
    motion.install();
    observeRenderedFeed();
    window.setTimeout(() => startCurrentFeedMotion(), 0);
})();
