/* Social Surveys center assembly configuration. */
(function installSocialSurveysLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialSurveysLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const surveysRegions = [
        '[data-social-surveys-assembly-root="1"]',
        '.social-neo-surveys-shell',
        '.social-neo-surveys-hero',
        '.social-neo-surveys-hero-head',
        '.social-neo-surveys-hero-copy',
        '.social-neo-surveys-hero-actions',
        '.social-neo-surveys-hero-create-btn',
        '.social-neo-surveys-hero-stats',
        '.social-neo-surveys-hero-stat',
        '.social-neo-surveys-hero-grid',
        '.social-neo-surveys-hero-grid--lanes',
        '.social-neo-surveys-hero-tab',
        '.social-neo-surveys-hero-tab-icon',
        '.social-neo-surveys-hero-tab-copy',
        '.social-neo-surveys-hero-toolbar',
        '.social-neo-surveys-hero-divider',
        '.social-neo-survey-listings',
        '.social-neo-survey-card',
        '.social-neo-survey-card-head',
        '.social-neo-survey-card-title-row',
        '.social-neo-survey-card-meta',
        '.social-neo-survey-card-summary',
        '.social-neo-survey-card-actions',
        '.social-neo-survey-card-desc',
        '.social-neo-survey-card-desc-rail',
        '.social-neo-surveys-take-shell',
        '.social-neo-survey-take-hero',
        '.social-neo-survey-take-card',
        '.social-neo-survey-take-card-head',
        '.social-neo-survey-take-card-index',
        '.social-neo-survey-take-choice',
        '.social-neo-survey-take-choice-list',
        '.social-neo-survey-submit-actions',
        '.social-neo-survey-submit-btn',
        '.social-neo-empty',
        '.social-neo-pill',
        '.social-neo-badge-row',
        '.social-neo-entity-card',
        '.lux-strip-card',
        '.lux-soft-chrome',
        '.lux-scroll-rail',
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

    function getSurveysSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isSurveysSurfaceReady() {
        const section = getSurveysSection();
        return Boolean(section && section.dataset.socialSurveysAssemblyRoot === '1');
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isSurveysSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-surveys-assembly-root="1"]'],
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
        outerSelectors: ['[data-social-surveys-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-surveys-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-surveys-assembly-root="1"]',
            '.social-neo-surveys-shell',
            '.social-neo-surveys-hero',
            '.social-neo-surveys-hero-stats',
            '.social-neo-surveys-hero-grid',
            '.social-neo-surveys-hero-toolbar',
            '.social-neo-survey-listings',
            '.social-neo-survey-card',
            '.social-neo-surveys-take-shell',
            '.social-neo-survey-take-hero',
            '.social-neo-survey-take-card'
        ],
        flattenInnerTargets: false,
        granularSelector: surveysRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-surveys-assembly-active',
            ready: 'social-surveys-assembly-ready',
            target: 'kiu-social-surveys-assembly-target',
            outer: 'kiu-social-surveys-assembly-outer',
            inner: 'kiu-social-surveys-assembly-inner',
            structure: 'kiu-social-surveys-assembly-structure',
            staging: 'is-social-surveys-assembly-staging'
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
        rootStateDataset: 'socialSurveysAssemblyState'
    });

    function startCurrentSurveysMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getSurveysSection(center);
        if (activePanel !== 'surveys' || !section) return false;
        const isNewSection = section.dataset.socialSurveysAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // look like new sections but must not re-enter assembly-active / PE-none.
        // Explicit queueSocialSurveysMotion passes { force: true } for panel/tab/take switches.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialSurveysAssemblyState;
        section.dataset.socialSurveysAssemblyRoot = '1';
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedSurveys() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedSurveys, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (observerFrame) return;
            const run = () => {
                observerFrame = 0;
                startCurrentSurveysMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialSurveysLoadingObserver = observer;
    }

    window.__kiuSocialSurveysLoadingMotion = motion;
    window.__kiuStartSocialSurveysLoadingMotion = startCurrentSurveysMotion;
    motion.install();
    observeRenderedSurveys();
    window.setTimeout(() => startCurrentSurveysMotion(), 0);
})();
