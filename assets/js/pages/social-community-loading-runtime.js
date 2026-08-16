/* Social People/Community center assembly configuration. */
(function installSocialCommunityLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialCommunityLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const communityRegions = [
        '[data-social-community-assembly-root="1"]',
        '.social-neo-community-shell',
        '.social-neo-community-hero',
        '.social-neo-community-hero-head',
        '.social-neo-community-hero-copy',
        '.social-neo-community-hero-actions',
        '.social-neo-community-hero-stats',
        '.social-neo-community-hero-stat',
        '.social-neo-community-hero-grid',
        '.social-neo-community-hero-tab',
        '.social-neo-community-hero-tab-icon',
        '.social-neo-community-hero-tab-copy',
        '.social-neo-community-hero-toolbar',
        '.social-neo-community-hero-divider',
        '.social-neo-directory-filters',
        '.social-neo-directory',
        '.social-neo-directory-item',
        '.social-neo-community-card',
        '.social-neo-community-person',
        '.social-neo-community-copy',
        '.social-neo-community-head',
        '.social-neo-community-heading',
        '.social-neo-community-badges',
        '.social-neo-community-interests',
        '.social-neo-community-staff-meta',
        '.social-neo-community-actions',
        '.social-neo-community-action-row',
        '.social-neo-community-layout',
        '.social-neo-grid-2',
        '.social-neo-list',
        '.social-neo-section-head',
        '.social-neo-pill',
        '[class*="social-neo-community-"]',
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
        '.lux-primary-btn',
        '.lux-secondary-btn',
        '.lux-ghost-btn',
        '.lux-picker-btn'
    ];

    function getCenter() {
        return document.querySelector('#social-neo-center-region');
    }

    function getCommunitySection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isCommunitySurfaceReady() {
        return Boolean(getCommunitySection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isCommunitySurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-community-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i):not(.social-neo-community-hero-divider)',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: ['[data-social-community-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-community-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-community-assembly-root="1"]',
            '.social-neo-community-shell',
            '.social-neo-community-hero',
            '.social-neo-community-hero-head',
            '.social-neo-community-hero-stats',
            '.social-neo-community-hero-grid',
            '.social-neo-community-hero-toolbar',
            '.social-neo-directory',
            '.social-neo-directory-item',
            '.social-neo-community-card',
            '.social-neo-community-person',
            '.social-neo-community-actions',
            '.social-neo-community-layout',
            '.social-neo-grid-2',
            '.social-neo-list'
        ],
        flattenInnerTargets: true,
        granularSelector: communityRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-community-assembly-active',
            ready: 'social-community-assembly-ready',
            target: 'kiu-social-community-assembly-target',
            outer: 'kiu-social-community-assembly-outer',
            inner: 'kiu-social-community-assembly-inner',
            structure: 'kiu-social-community-assembly-structure',
            staging: 'is-social-community-assembly-staging'
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
        rootStateDataset: 'socialCommunityAssemblyState'
    });

    function startCurrentCommunityMotion(center = getCenter(), options = {}) {
        if (typeof motion.install === 'function') motion.install();
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getCommunitySection(center);
        if (activePanel !== 'community' || !section) return false;
        const isNewSection = section.dataset.socialCommunityAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // must not re-enter assembly-active. queueSocialCommunityMotion passes { force: true }.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialCommunityAssemblyState;
        section.dataset.socialCommunityAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedCommunity() {
        if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedCommunity, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'community') return;
            const run = () => {
                observerFrame = 0;
                startCurrentCommunityMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialCommunityLoadingObserver = observer;
    }

    window.__kiuSocialCommunityLoadingMotion = motion;
    window.__kiuStartSocialCommunityLoadingMotion = startCurrentCommunityMotion;
    if (typeof window.__kiuShouldBindSocialLoadingFallback !== 'function'
        || window.__kiuShouldBindSocialLoadingFallback('community')) {
        motion.install();
        observeRenderedCommunity();
        window.setTimeout(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            startCurrentCommunityMotion();
        }, 0);
    }
})();
