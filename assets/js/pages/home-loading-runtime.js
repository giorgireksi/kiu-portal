/* Home dashboard assembly configuration. Motion is shared; Home owns the regions. */
(function installHomeLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuHomeLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        console.warn('[Home] Loading animation engine unavailable.');
        return;
    }

    const isHomeRoute = () => document.body?.classList.contains('lux-route-home')
        || document.documentElement?.dataset?.luxPage === 'home'
        || document.querySelector('#page-home.active-page') !== null
        || /(?:^|\/)(?:index|home)\.html$/i.test(window.location.pathname || '');

    const dashboardRegions = [
        '.lux-home-toolbar',
        '.lux-home-merged',
        '.lux-home-band',
        '[data-home-widget-id]',
        '[data-news-home-strip="1"]'
    ];
    const mobileRegions = [
        '#mobile-bottom-nav',
        '#mobile-action-sheet'
    ];

    const selectorsForReason = (reason, requestedRegions) => {
        if (Array.isArray(requestedRegions) && requestedRegions.length) return requestedRegions;
        const value = String(reason || 'render');
        if (/news/.test(value)) return ['[data-news-home-strip="1"]'];
        if (/mobile/.test(value)) return [...mobileRegions];
        return [...dashboardRegions];
    };

    function releaseHomeBootShellReveal() {
        if (!window.__kiuHomeBootAwaitingAssemblyReveal) return;
        window.__kiuHomeBootAwaitingAssemblyReveal = false;
        document.body?.classList.remove('home-shell-assembly-prehide');
        window.__kiuHomeShellRevealAllowed = true;
        if (typeof window.markPortalShellReady === 'function') {
            try { window.markPortalShellReady(); } catch (_error) {}
        }
    }

    window.__kiuHomeRevealShellNow = function revealHomeShellNow() {
        window.__kiuHomeBootAwaitingAssemblyReveal = false;
        document.body?.classList.remove('home-shell-assembly-prehide');
        window.__kiuHomeShellRevealAllowed = true;
        if (typeof window.markPortalShellReady === 'function') {
            try { window.markPortalShellReady(); } catch (_error) {}
        }
    };

    const motion = createAssemblyLoadingMotion({
        isRoute: isHomeRoute,
        getPageRoot: () => document.querySelector('#lux-home-shell'),
        // Scope to the home page — body-wide observe abort/restarts reset waitForShell forever.
        getObserverRoot: () => document.querySelector('#page-home')
            || document.querySelector('#lux-home-shell')
            || document.body,
        // Mobile chrome lives outside #lux-home-shell; needed only for late mobile replay.
        getExternalRoots: () => mobileRegions
            .map((selector) => document.querySelector(selector))
            .filter(Boolean),
        isContentReady: () => {
            const root = document.querySelector('#lux-home-shell');
            return Boolean(
                root?.dataset.homeRenderReady === '1'
                && root?.querySelector('.lux-home-page[data-home-root="1"]')
                // Widget id may live on .lux-home-band or .lux-home-cell.
                && root.querySelector('[data-home-widget-id]')
                && !root.querySelector('[data-home-loading-shell="1"], [data-home-recovery-shell="1"]')
            );
        },
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        lateReadyWindowMs: 1200,
        lateReplaySelector: [
            ...dashboardRegions,
            ...mobileRegions
        ],
        rootStateDataset: 'kiuHomeAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, [data-home-loading-shell="1"], [data-home-recovery-shell="1"], #modal-overlay, [role="dialog"]:not(#mobile-action-sheet), #lux-studio-backdrop, #lux-bg-gallery-backdrop',
        outerSelectors: [
            '.lux-home-page',
            '.lux-home-toolbar',
            '.lux-home-merged',
            '.lux-home-band',
            '[data-news-home-strip="1"]'
        ],
        outerFlightSelector: [
            '.lux-home-page',
            '.lux-home-toolbar',
            '.lux-home-merged',
            '.lux-home-band',
            '[data-news-home-strip="1"]'
        ],
        hierarchySelector: [
            '.lux-home-page',
            '.lux-home-toolbar',
            '.lux-home-merged',
            '.lux-home-band',
            '.lux-home-cell',
            '[data-home-widget-id]',
            '[data-news-home-strip="1"]',
            '.lux-card-head',
            '.lux-card-title',
            '.lux-card-meta',
            '.lux-builder-copy',
            '.page-hero-title',
            '.page-hero-copy',
            '.lux-hero',
            '.lux-hero-main',
            '.lux-hero-side',
            '.lux-hero-stage',
            '.lms-hero-focus-head',
            '.lms-hero-focus-body',
            '.lux-list',
            '.lux-list-row',
            '.lux-student-command',
            '.lux-student-command-column',
            '.lux-student-summary-panel',
            '.lux-student-summary-strip',
            '.lux-student-compact-schedule',
            '.lux-student-compact-schedule-row',
            '.lux-student-event-list',
            '.lux-student-event-row',
            '.lux-student-feed-panel',
            '.lux-student-feed-list',
            '.lux-student-feed-row',
            '.lux-student-news-panel',
            '.lux-student-news-list',
            '.lux-student-news-row',
            '.lux-student-score-list',
            '.lux-student-score-row',
            '.lux-student-work-list',
            '.lux-student-work-row',
            '.lux-student-updates-list',
            '.lux-student-update-row',
            '.lux-student-week-strip',
            '.lux-student-week-next'
        ],
        flattenInnerTargets: false,
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
            '.lux-card-title',
            '.lux-card-meta',
            '.lux-card-body',
            '.lux-builder-copy',
            '.lux-builder-card',
            '.lux-builder-hero',
            '.lux-builder-section',
            '.lux-builder-card-foot',
            '.lux-kicker',
            '.lux-pill',
            '.lux-pill-row',
            '.home-hover-chip',
            '.page-hero',
            '.page-hero-title',
            '.page-hero-copy',
            '.lux-hero',
            '.lux-hero-main',
            '.lux-hero-side',
            '.lux-hero-stage',
            '.lux-hero-actions',
            '.lms-hero-focus-head',
            '.lms-hero-focus-title',
            '.lms-hero-focus-kicker',
            '.lms-hero-focus-meta',
            '.lms-hero-focus-copy',
            '.lms-hero-focus-chip',
            '.lms-hero-focus-body',
            '.lux-list',
            '.lux-list-row',
            '.lux-stat',
            '.lux-stat-row',
            '.lux-dashboard-section',
            '.lux-focus-panel',
            '.lux-summary-surface--hero',
            '.lux-quick-grid',
            '.lux-quick-btn',
            '.lux-quick-top',
            '.lux-quick-bottom',
            '.lux-quick-meter',
            '.lux-quick-meta-badge',
            '.lux-admin-ops-panel',
            '.lux-admin-ops-copy',
            '.lux-admin-ops-grid',
            '.lux-admin-op-card',
            '.lux-admin-op-head',
            '.lux-admin-op-actions',
            '.lux-alert-icon',
            '.lux-alert-copy',
            '.lux-student-attention-panel',
            '.lux-student-cell',
            '.lux-student-command',
            '.lux-student-command-column',
            '.lux-student-compact-header',
            '.lux-student-compact-heading',
            '.lux-student-compact-overline',
            '.lux-student-compact-meta',
            '.lux-student-compact-schedule',
            '.lux-student-compact-schedule-row',
            '.lux-student-extra-panel',
            '.lux-student-extra-strip',
            '.lux-student-event-list',
            '.lux-student-event-row',
            '.lux-student-feed-list',
            '.lux-student-feed-panel',
            '.lux-student-feed-row',
            '.lux-student-life-row',
            '.lux-student-life-snapshot',
            '.lux-student-news-list',
            '.lux-student-news-panel',
            '.lux-student-news-row',
            '.lux-student-pulse-command',
            '.lux-student-pulse-extra',
            '.lux-student-pulse-header',
            '.lux-student-pulse-summary',
            '.lux-student-score-list',
            '.lux-student-score-row',
            '.lux-student-scores-panel',
            '.lux-student-shortcut-chip',
            '.lux-student-shortcut-row',
            '.lux-student-study-column',
            '.lux-student-study-panel',
            '.lux-student-summary-panel',
            '.lux-student-summary-strip',
            '.lux-student-update-row',
            '.lux-student-updates-list',
            '.lux-student-week-strip',
            '.lux-student-week-next',
            '.lux-student-week-day-label',
            '.lux-student-work-column',
            '.lux-student-work-list',
            '.lux-student-work-row',
            '.lux-student-work-tone',
            '.lux-home-widget',
            '.lux-home-row',
            '.lux-home-tile',
            '.lux-home-stat'
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
            'input',
            'select',
            'textarea'
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
        flightDistance: {
            innerMin: 110,
            innerFactor: 0.22,
            innerMax: 180
        },
        flightTiming: {
            outerDurationMs: 420,
            innerDurationMs: 290,
            innerMinDurationMs: 200,
            innerDepthStepMs: 16,
            outerStaggerMs: 46,
            innerStaggerMs: 30,
            outerMaxDelayMs: 90,
            innerMaxDelayMs: 120
        },
        timing: {
            maxShellWaitMs: 900,
            contentWaitMaxMs: 1200,
            lateAssemblyGraceMs: 100,
            maxAssemblyWindowMs: 3000,
            maxTotalAssemblyMs: 3800
        }
    });

    window.__kiuHomeLoadingMotion = motion;
    window.__kiuReplayHomeLoadingMotion = (reason = 'render', requestedRegions, options = {}) => {
        // Data refresh after first paint: never replay the intro — force the
        // new DOM to a clean visible/ready state instantly (kills the
        // loads → hides → re-loads flash).
        if (options && options.intro === false) {
            if (typeof motion.forceReady === 'function') {
                try { motion.forceReady(); } catch (_error) {}
            }
            releaseHomeBootShellReveal();
            return true;
        }
        const selectors = selectorsForReason(reason, requestedRegions);
        return selectors.length ? motion.replay(selectors) : false;
    };

    if (isHomeRoute()) {
        window.__kiuHomeBootAwaitingAssemblyReveal = true;
        window.__kiuHomeShellRevealAllowed = false;
        // Fail-safe — uncover if motion never claims reveal (empty/recovery shells).
        window.setTimeout(() => {
            if (!window.__kiuHomeBootAwaitingAssemblyReveal) return;
            if (/\bhome-assembly-active\b/.test(document.body?.className || '')) return;
            releaseHomeBootShellReveal();
        }, 2500);
    }

    motion.install();
})();
