/* Social Events center assembly configuration. */
(function installSocialEventsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialEventsLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const eventsRegions = [
        '[data-social-events-assembly-root="1"]',
        '.social-neo-events-shell',
        '.social-neo-events-hero',
        '.social-neo-events-hero-head',
        '.social-neo-events-hero-actions',
        '.social-neo-events-create-trigger',
        '.social-neo-events-hero-stats',
        '.social-neo-events-hero-stat',
        '.social-neo-events-hero-grid',
        '.social-neo-events-hero-tab',
        '.social-neo-events-hero-tab-icon',
        '.social-neo-events-hero-tab-copy',
        '.social-neo-events-hero-divider',
        '.social-neo-events-hub-section',
        '.social-neo-events-hub-body',
        '.social-neo-events-content',
        '.social-neo-events-lane',
        '.social-neo-events-support-card',
        '.social-neo-events-list-card',
        '.social-neo-events-manage-card',
        '.social-neo-events-manage-item',
        '.social-neo-events-empty',
        '.social-neo-events-badges',
        '.social-neo-events-owner-pill',
        '.social-neo-events-student-filter',
        '.social-neo-events-student-filter-tab',
        '.social-neo-event-feature',
        '.social-neo-event-feature-head-top',
        '.social-neo-event-feature-actions',
        '.social-neo-event-date-group',
        '.social-neo-section-head',
        '.social-neo-section-head--events-student',
        '.social-neo-pill',
        '.social-neo-badge-row',
        '.social-neo-entity-card',
        '.social-neo-empty',
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

    function getEventsSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isEventsSurfaceReady() {
        return Boolean(getEventsSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isEventsSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-events-assembly-root="1"]'],
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
        outerSelectors: ['[data-social-events-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-events-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-events-assembly-root="1"]',
            '.social-neo-events-shell',
            '.social-neo-events-hero',
            '.social-neo-events-hero-stats',
            '.social-neo-events-hero-grid',
            '.social-neo-events-hub-body',
            '.social-neo-events-lane',
            '.social-neo-events-list-card',
            '.social-neo-events-manage-card',
            '.social-neo-event-feature',
            '.social-neo-events-manage-item'
        ],
        flattenInnerTargets: true,
        granularSelector: eventsRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-events-assembly-active',
            ready: 'social-events-assembly-ready',
            target: 'kiu-social-events-assembly-target',
            outer: 'kiu-social-events-assembly-outer',
            inner: 'kiu-social-events-assembly-inner',
            structure: 'kiu-social-events-assembly-structure',
            staging: 'is-social-events-assembly-staging'
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
        rootStateDataset: 'socialEventsAssemblyState'
    });

    function startCurrentEventsMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getEventsSection(center);
        if (activePanel !== 'events' || !section) return false;
        const isNewSection = section.dataset.socialEventsAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // look like new sections but must not re-enter assembly-active / PE-none.
        // Explicit queueSocialEventsMotion passes { force: true } for panel/tab switches.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialEventsAssemblyState;
        section.dataset.socialEventsAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedEvents() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedEvents, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'events') return;
            const run = () => {
                observerFrame = 0;
                startCurrentEventsMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialEventsLoadingObserver = observer;
    }

    window.__kiuSocialEventsLoadingMotion = motion;
    window.__kiuStartSocialEventsLoadingMotion = startCurrentEventsMotion;
    motion.install();
    observeRenderedEvents();
    window.setTimeout(() => startCurrentEventsMotion(), 0);
})();
