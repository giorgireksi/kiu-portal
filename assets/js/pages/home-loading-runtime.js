/* Home dashboard assembly configuration. Motion is shared; Home owns the regions. */
(function installHomeLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuHomeLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        console.warn('[Home] Loading animation engine unavailable.');
        return;
    }

    const dashboardRegions = [
        '.lux-home-toolbar',
        '.lux-home-merged',
        '.lux-home-band',
        '[data-home-widget-id]',
        '[data-news-home-strip="1"]'
    ];
    const shellRegions = [
        '#lux-shell',
        '#lux-nav',
        '#lux-topbar',
        '#mobile-bottom-nav',
        '#mobile-action-sheet'
    ];

    const selectorsForReason = (reason, requestedRegions) => {
        if (Array.isArray(requestedRegions) && requestedRegions.length) return requestedRegions;
        const value = String(reason || 'render');
        if (/news/.test(value)) return ['[data-news-home-strip="1"]'];
        if (/mobile/.test(value)) return ['#mobile-bottom-nav', '#mobile-action-sheet'];
        if (/shell|navigation|role|faculty|theme/.test(value)) return [...shellRegions, ...dashboardRegions];
        return [...dashboardRegions, ...shellRegions];
    };

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-home')
            || document.documentElement?.dataset?.luxPage === 'home'
            || document.querySelector('#page-home.active-page') !== null
            || /(?:^|\/)(?:index|home)\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#lux-home-shell'),
        getObserverRoot: () => document.body,
        getExternalRoots: () => shellRegions
            .map((selector) => document.querySelector(selector))
            .filter(Boolean),
        isContentReady: () => {
            const root = document.querySelector('#lux-home-shell');
            return Boolean(
                root?.dataset.homeRenderReady === '1'
                &&
                root?.querySelector('.lux-home-page[data-home-root="1"]')
                && root.querySelector('.lux-home-band[data-home-widget-id]')
                && !root.querySelector('[data-home-loading-shell="1"], [data-home-recovery-shell="1"]')
            );
        },
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        lateReadyWindowMs: 1200,
        lateReplaySelector: [
            ...dashboardRegions,
            ...shellRegions
        ],
        rootStateDataset: 'kiuHomeAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, [data-home-loading-shell="1"], [data-home-recovery-shell="1"], #modal-overlay, [role="dialog"]:not(#mobile-action-sheet), #lux-studio-backdrop, #lux-bg-gallery-backdrop',
        outerSelectors: [
            '.lux-home-page',
            '.lux-home-merged',
            '.lux-home-band',
            '#lux-shell',
            '#lux-nav',
            '#lux-topbar',
            '#mobile-bottom-nav',
            '#mobile-action-sheet',
            '[data-news-home-strip="1"]'
        ],
        outerFlightSelector: [
            '.lux-home-page',
            '.lux-home-merged',
            '.lux-home-band',
            '#lux-shell',
            '#lux-nav',
            '#lux-topbar',
            '#mobile-bottom-nav',
            '#mobile-action-sheet'
        ],
        hierarchySelector: [
            '.lux-home-page',
            '.lux-home-merged',
            '.lux-home-band',
            '.lux-home-cell',
            '[data-home-widget-id]',
            '[data-news-home-strip="1"]',
            '#lux-shell',
            '#lux-nav',
            '#lux-topbar',
            '#mobile-bottom-nav',
            '#mobile-action-sheet',
            '.lux-card',
            '.lux-card-head',
            '.lux-card-body'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.lux-home-page',
            '.lux-home-toolbar',
            '.lux-home-merged',
            '.lux-home-band',
            '.lux-home-cell',
            '[data-home-widget-id]',
            '[data-news-home-strip="1"]',
            '.lux-card',
            '.lux-card-head',
            '.lux-card-body',
            '.lux-card-title',
            '.lux-card-copy',
            '.lux-home-widget',
            '.lux-home-row',
            '.lux-home-tile',
            '.lux-home-stat',
            '.lux-status-pill',
            '.home-hover-chip',
            '#lux-shell',
            '#lux-nav',
            '#lux-topbar',
            '#mobile-bottom-nav',
            '#mobile-action-sheet',
            'h1, h2, h3, h4, h5, h6',
            'p',
            'strong',
            'span',
            'small',
            'label',
            'li'
        ],
        controlSelector: [
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
        ],
        transformSafeSelector: [
            'a',
            'button',
            'input',
            'select',
            'textarea',
            '[role="button"]',
            '.home-hover-chip',
            '.lux-primary-btn',
            '.lux-secondary-btn',
            '.lux-ghost-btn',
            '.lux-picker-btn'
        ],
        structureSelector: [],
        classes: {
            active: 'home-assembly-active',
            ready: 'home-assembly-ready',
            target: 'kiu-home-assembly-target',
            outer: 'kiu-home-assembly-outer',
            inner: 'kiu-home-assembly-inner',
            structure: 'kiu-home-assembly-structure',
            staging: 'is-home-assembly-staging'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuHomeLoadingMotion = motion;
    window.__kiuReplayHomeLoadingMotion = (reason = 'render', requestedRegions) => {
        const selectors = selectorsForReason(reason, requestedRegions);
        return selectors.length ? motion.replay(selectors) : false;
    };
    motion.install();
})();
