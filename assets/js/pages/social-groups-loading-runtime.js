/* Social Groups center assembly configuration. */
(function installSocialGroupsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialGroupsLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const groupRegions = [
        '[data-social-groups-assembly-root="1"]',
        '.social-neo-groups-shell',
        '.social-neo-groups-shell--merged',
        '.social-neo-groups-hero',
        '.social-neo-groups-hero-head',
        '.social-neo-groups-hero-actions',
        '.social-neo-groups-hero-create-btn',
        '.social-neo-groups-hero-grid',
        '.social-neo-groups-hero-tab',
        '.social-neo-groups-hero-tab-icon',
        '.social-neo-groups-hero-tab-copy',
        '.social-neo-groups-hero-divider',
        '.social-neo-groups-hub-body',
        '.social-neo-groups-grid',
        '.social-neo-group-card',
        '.social-neo-group-card-header',
        '.social-neo-group-card-icon',
        '.social-neo-group-card-avatar',
        '.social-neo-group-card-title',
        '.social-neo-group-card-meta',
        '.social-neo-group-card-desc',
        '.social-neo-group-card-badges',
        '.social-neo-group-card-actions',
        '.social-neo-empty-hero',
        '.social-neo-empty-hero-actions',
        '.social-neo-pill',
        '[class*="social-neo-groups-"]',
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

    function getGroupsSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isGroupsSurfaceReady() {
        return Boolean(getGroupsSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isGroupsSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-groups-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i):not(.social-neo-groups-hero-divider)',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: ['[data-social-groups-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-groups-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-groups-assembly-root="1"]',
            '.social-neo-groups-shell',
            '.social-neo-groups-hero',
            '.social-neo-groups-hero-head',
            '.social-neo-groups-hero-actions',
            '.social-neo-groups-hero-grid',
            '.social-neo-groups-hub-body',
            '.social-neo-groups-grid',
            '.social-neo-group-card',
            '.social-neo-group-card-header',
            '.social-neo-group-card-title',
            '.social-neo-group-card-badges',
            '.social-neo-group-card-actions',
            '.social-neo-empty-hero'
        ],
        flattenInnerTargets: true,
        granularSelector: groupRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-groups-assembly-active',
            ready: 'social-groups-assembly-ready',
            target: 'kiu-social-groups-assembly-target',
            outer: 'kiu-social-groups-assembly-outer',
            inner: 'kiu-social-groups-assembly-inner',
            structure: 'kiu-social-groups-assembly-structure',
            staging: 'is-social-groups-assembly-staging'
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
        rootStateDataset: 'socialGroupsAssemblyState'
    });

    function startCurrentGroupsMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getGroupsSection(center);
        if (activePanel !== 'groups' || !section) return false;
        const isNewSection = section.dataset.socialGroupsAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // must not re-enter assembly-active. queueSocialGroupsMotion passes { force: true }.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialGroupsAssemblyState;
        section.dataset.socialGroupsAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedGroups() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedGroups, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'groups') return;
            const run = () => {
                observerFrame = 0;
                startCurrentGroupsMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialGroupsLoadingObserver = observer;
    }

    window.__kiuSocialGroupsLoadingMotion = motion;
    window.__kiuStartSocialGroupsLoadingMotion = startCurrentGroupsMotion;
    motion.install();
    observeRenderedGroups();
    window.setTimeout(() => startCurrentGroupsMotion(), 0);
})();
