/* Social assembly configuration. Initial load and section switches share one motion graph. */
(function installSocialLoadingMotion() {
    'use strict';

    function boot() {
        const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
        if (typeof createAssemblyLoadingMotion !== 'function') {
            window.__kiuSocialLoadingMotionError = 'Shared assembly loading engine is unavailable.';
            return false;
        }

    const socialRegions = [
        '#social-neo-root',
        '.social-neo-shell',
        '#social-neo-flash-region',
        '#social-neo-topbar-region',
        '#social-neo-command-region',
        '#social-neo-workspace-nav-reveal-region',
        '#social-neo-workspace-nav-region',
        '#social-neo-center-region',
        '#social-neo-drawer-region',
        '#social-neo-mobile-tab-region',
        '#social-neo-toast-region',
        '#mobile-bottom-nav',
        '#social-shortcuts-top-nav-portal'
    ];

    const socialTextTargets = [
        'h1, h2, h3, h4, h5, h6',
        'p',
        'strong',
        'span',
        'small',
        'label',
        'li',
        'i'
    ];

    const socialControls = [
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

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#public-social-root'),
        getObserverRoot: () => document.body,
        getExternalRoots: () => socialRegions
            .map((selector) => document.querySelector(selector))
            .filter(Boolean),
        isContentReady: () => {
            const root = document.querySelector('#public-social-root');
            return Boolean(
                root?.dataset.socialInitialRenderReady === '1'
                && root.querySelector('.social-neo-shell')
                && root.querySelector('#social-neo-center-region > *')
            );
        },
        autoStart: false,
        animateLateAfterReady: true,
        unlimitedLateReplay: true,
        autoReplayLateMutations: false,
        lateReplaySelector: [
            '#social-neo-flash-region',
            '#social-neo-topbar-region',
            '#social-neo-command-region',
            '#social-neo-workspace-nav-region',
            '#social-neo-center-region',
            '#social-neo-drawer-region',
            '#social-neo-mobile-tab-region',
            '#social-neo-toast-region',
            '#mobile-bottom-nav',
            '#social-shortcuts-top-nav-portal'
        ],
        rootStateDataset: 'socialAssemblyState',
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i):not(.social-neo-feed-header-divider)',
            'template',
            '#modal-overlay',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-story-viewer-region',
            '#social-neo-story-composer-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: [
            '.social-neo-shell',
            '#mobile-bottom-nav',
            '#social-shortcuts-top-nav-portal'
        ],
        outerFlightSelector: [
            '.social-neo-shell',
            '#mobile-bottom-nav',
            '#social-shortcuts-top-nav-portal'
        ],
        hierarchySelector: [
            '.social-neo-shell',
            '.social-neo-card',
            '.social-neo-feed-shell',
            '.social-neo-feed-hero',
            '.social-neo-sidebar-nav',
            '.social-neo-section-head'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            ...socialRegions,
            '[data-social-layout-observed="1"]',
            '[data-lux-observed-surface="1"]',
            '[class*="social-neo-"]',
            '.social-neo-feed-mobile-stack',
            '.social-neo-feed-header-divider',
            '.social-neo-feed-composer-zone',
            '.social-neo-composer-cta',
            '.social-neo-composer-cta-copy',
            '.social-neo-composer-cta-btn',
            '.social-neo-feed-hero-head',
            '.social-neo-feed-hero-actions',
            '.social-neo-feed-hero-action-label',
            '.social-neo-feed-hero-stats',
            '.social-neo-feed-hero-stat',
            '.social-neo-feed-hero-grid',
            '.social-neo-feed-hero-tab',
            '.social-neo-feed-hero-tab-icon',
            '.social-neo-feed-hero-tab-copy',
            '.social-neo-feed-hero-scope',
            '.social-neo-feed-hero-scope-field',
            '.social-neo-feed-hero-scope-label',
            '.social-neo-stack',
            '.lux-soft-chrome',
            '.lux-strip-card',
            '.surface-card',
            '.lux-card',
            '.lux-section-card',
            '.lux-picker-field',
            '.lux-picker-copy',
            '.lux-picker-value',
            '[class*="sn-alert"]',
            '[class*="social-project-"]',
            '[class*="social-photo-"]',
            '.social-portfolio-feed',
            '.social-neo-survey-card',
            ...socialTextTargets
        ],
        controlSelector: socialControls,
        transformSafeSelector: [
            ...socialControls,
            '.home-hover-chip',
            '.social-neo-side-link',
            '.social-neo-feed-hero-tab',
            '.social-neo-feed-hero-action-btn',
            '.social-neo-composer-cta',
            '.lux-card',
            '.lux-section-card',
            '.lux-picker-btn',
            '.sn-alerts-panel',
            '.social-project-card-new',
            '.social-project-row',
            '.social-photo-grid-tile'
        ],
        structureSelector: ['#social-neo-root'],
        classes: {
            active: 'social-assembly-active',
            ready: 'social-assembly-ready',
            target: 'kiu-social-assembly-target',
            outer: 'kiu-social-assembly-outer',
            inner: 'kiu-social-assembly-inner',
            structure: 'kiu-social-assembly-structure',
            staging: 'is-social-assembly-staging'
        },
        flightTiming: {
            outerDurationMs: 260,
            innerDurationMs: 180,
            innerMinDurationMs: 120,
            innerDepthStepMs: 10,
            outerStaggerMs: 16,
            innerStaggerMs: 10,
            outerMaxDelayMs: 42,
            innerMaxDelayMs: 48
        },
        timing: {
            maxShellWaitMs: 1100,
            contentWaitMaxMs: 1100,
            lateAssemblyGraceMs: 100,
            maxAssemblyWindowMs: 1050,
            maxTotalAssemblyMs: 1350
        }
    });

    window.__kiuSocialLoadingMotion = motion;
        motion.install();
        return true;
    }

    if (!boot()) {
        let attempts = 0;
        const retry = () => {
            if (boot() || attempts++ >= 20) return;
            window.setTimeout(retry, 64);
        };
        window.setTimeout(retry, 64);
    }

    if (navigator.serviceWorker?.getRegistration) {
        window.setTimeout(() => {
            navigator.serviceWorker.getRegistration('./')
                .then((registration) => registration?.update?.())
                .catch(() => null);
        }, 0);
    }
})();
