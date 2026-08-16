/* Social Alerts center assembly configuration. */
(function installSocialAlertsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialAlertsLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const alertsRegions = [
        '[data-social-alerts-assembly-root="1"]',
        '.sn-alerts-panel',
        '.sn-alerts-header',
        '.sn-alerts-header__toolbar',
        '.sn-alerts-header__title-block',
        '.sn-alerts-header__title',
        '.sn-alerts-header__subtitle',
        '.sn-alerts-header__actions',
        '.sn-alerts-clear-visible',
        '.sn-alerts-mark-read',
        '.sn-alerts-header__filters',
        '.sn-alerts-category-filters',
        '.lux-tab-strip',
        '.lux-tab-btn',
        '.sn-alerts-list',
        '.sn-alert-card',
        '.sn-alert-card__main',
        '.sn-alert-card-icon',
        '.sn-alert-card__content',
        '.sn-alert-card-body',
        '.sn-alert-card-head',
        '.sn-alert-card-badge',
        '.sn-alert-card-preview',
        '.sn-alert-card-actions',
        '.sn-alert-card__aside',
        '.sn-alert-card-dismiss',
        '.sn-alert-card-dot',
        '.sn-alerts-empty',
        '.sn-alerts-empty-icon',
        '.sn-alerts-moderation',
        '.sn-alerts-mod-toggle',
        '.sn-alerts-mod-count',
        '.sn-alerts-mod-body',
        '.sn-alert-card--report',
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

    function getAlertsSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || !section.matches('.sn-alerts-panel')
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isAlertsSurfaceReady() {
        return Boolean(getAlertsSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isAlertsSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-alerts-assembly-root="1"]'],
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
        outerSelectors: ['[data-social-alerts-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-alerts-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-alerts-assembly-root="1"]',
            '.sn-alerts-panel',
            '.sn-alerts-header',
            '.sn-alerts-list',
            '.sn-alert-card',
            '.sn-alerts-moderation'
        ],
        flattenInnerTargets: true,
        granularSelector: alertsRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-alerts-assembly-active',
            ready: 'social-alerts-assembly-ready',
            target: 'kiu-social-alerts-assembly-target',
            outer: 'kiu-social-alerts-assembly-outer',
            inner: 'kiu-social-alerts-assembly-inner',
            structure: 'kiu-social-alerts-assembly-structure',
            staging: 'is-social-alerts-assembly-staging'
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
        rootStateDataset: 'socialAlertsAssemblyState'
    });

    function startCurrentAlertsMotion(center = getCenter(), options = {}) {
        if (typeof motion.install === 'function') motion.install();
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getAlertsSection(center);
        if (activePanel !== 'alerts' || !section) return false;
        const isNewSection = section.dataset.socialAlertsAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Exposé gate: force must replay after leaving other sections even when
        // phase stayed `ready` and/or the shell root attr lingered.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialAlertsAssemblyState;
        section.dataset.socialAlertsAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedAlerts() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedAlerts, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'alerts') return;
            const run = () => {
                observerFrame = 0;
                startCurrentAlertsMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialAlertsLoadingObserver = observer;
    }

    window.__kiuSocialAlertsLoadingMotion = motion;
    window.__kiuStartSocialAlertsLoadingMotion = startCurrentAlertsMotion;
    if (typeof window.__kiuShouldBindSocialLoadingFallback !== 'function'
        || window.__kiuShouldBindSocialLoadingFallback('alerts')) {
        motion.install();
        observeRenderedAlerts();
        window.setTimeout(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            startCurrentAlertsMotion();
        }, 0);
    }
})();
