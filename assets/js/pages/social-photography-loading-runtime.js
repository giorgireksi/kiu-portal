/* Social Exposé (photography) center assembly configuration. */
(function installSocialPhotographyLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialPhotographyLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const photographyRegions = [
        '[data-social-photography-assembly-root="1"]',
        '.social-photo-shell',
        '.social-photo-shell--my-profile',
        '.social-photo-profile-shell',
        '.social-photo-hero',
        '.social-photo-chrome-row',
        '.social-photo-chrome-copy',
        '.social-photo-chrome-title',
        '.social-photo-chrome-subtitle',
        '.social-photo-chrome-actions',
        '.social-photo-upload-btn',
        '.social-photo-search',
        '.social-photo-my-profile-btn',
        '.social-photo-tab-segment',
        '.social-photo-tab',
        '.social-photo-discover-strip',
        '.social-photo-discover-label',
        '.social-photo-discover-track',
        '.social-photo-discover-card',
        '.social-photo-discover-profile',
        '.social-photo-discover-name',
        '.social-photo-content-stage',
        '.social-photo-explore-grid',
        '.social-photo-grid-tile',
        '.social-photo-grid-tile-open',
        '.social-photo-grid-tile-overlay',
        '.social-photo-grid-tile-author',
        '.social-photo-grid-tile-actions',
        '.social-photo-feed-list',
        '.social-photo-feed-card',
        '.social-photo-feed-head',
        '.social-photo-feed-media',
        '.social-photo-feed-editorial',
        '.social-photo-feed-caption',
        '.social-photo-feed-metrics',
        '.social-photo-feed-actions',
        '.social-photo-empty',
        '.social-photo-back',
        '.social-photo-my-header',
        '.social-photo-my-hero',
        '.social-photo-my-head',
        '.social-photo-my-info',
        '.social-photo-my-stats',
        '.social-photo-my-stat',
        '.social-photo-my-tabs',
        '.social-photo-my-tab',
        '.social-photo-profile-hero',
        '.social-photo-profile-head',
        '.social-neo-empty-hero',
        '.social-neo-post-card',
        '.social-neo-post-head',
        '.social-neo-post-actions',
        '.social-neo-pill',
        '.social-neo-badge-row',
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

    function getPhotographySection(center = getCenter()) {
        const section = center?.firstElementChild;
        // Require a real Exposé shell — panel flips before center remounts; starting on
        // leftover feed DOM leaves body.assembly-active and a visible flash.
        if (!section
            || !section.matches('.social-photo-shell, .social-photo-profile-shell, .social-photo-shell--my-profile')
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isPhotographySurfaceReady() {
        return Boolean(getPhotographySection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isPhotographySurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-photography-assembly-root="1"]'],
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
            '#mobile-action-sheet',
            '.social-photo-grid-skeleton'
        ],
        outerSelectors: ['[data-social-photography-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-photography-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-photography-assembly-root="1"]',
            '.social-photo-shell',
            '.social-photo-profile-shell',
            '.social-photo-hero',
            '.social-photo-chrome-row',
            '.social-photo-tab-segment',
            '.social-photo-discover-strip',
            '.social-photo-content-stage',
            '.social-photo-explore-grid',
            '.social-photo-grid-tile',
            '.social-photo-feed-card',
            '.social-photo-my-header',
            '.social-photo-profile-hero'
        ],
        flattenInnerTargets: true,
        granularSelector: photographyRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-photography-assembly-active',
            ready: 'social-photography-assembly-ready',
            target: 'kiu-social-photography-assembly-target',
            outer: 'kiu-social-photography-assembly-outer',
            inner: 'kiu-social-photography-assembly-inner',
            structure: 'kiu-social-photography-assembly-structure',
            staging: 'is-social-photography-assembly-staging'
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
        rootStateDataset: 'socialPhotographyAssemblyState'
    });

    function startCurrentPhotographyMotion(center = getCenter(), options = {}) {
        if (typeof motion.install === 'function') motion.install();
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getPhotographySection(center);
        if (activePanel !== 'photography' || !section) return false;
        const isNewSection = section.dataset.socialPhotographyAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. queueSocialPhotographyMotion
        // passes { force: true } for panel/tab/profile switches and must always be
        // able to replay even if a prior shell root attr / center state lingered.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialPhotographyAssemblyState;
        section.dataset.socialPhotographyAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedPhotography() {
        const page = getCenter();
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedPhotography, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'photography') return;
            const run = () => {
                observerFrame = 0;
                startCurrentPhotographyMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialPhotographyLoadingObserver = observer;
    }

    window.__kiuSocialPhotographyLoadingMotion = motion;
    window.__kiuStartSocialPhotographyLoadingMotion = startCurrentPhotographyMotion;
    if (typeof window.__kiuShouldBindSocialLoadingFallback !== 'function'
        || window.__kiuShouldBindSocialLoadingFallback('photography')) {
        motion.install();
        observeRenderedPhotography();
        window.setTimeout(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            startCurrentPhotographyMotion();
        }, 0);
    }
})();
