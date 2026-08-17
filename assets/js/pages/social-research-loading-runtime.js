/* Social Research center assembly configuration. */
(function installSocialResearchLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialResearchLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const researchRegions = [
        '[data-social-research-assembly-root="1"]',
        '.social-neo-research-shell',
        '.social-neo-research-hero',
        '.social-neo-research-hero-head',
        '.social-neo-research-hero-copy',
        '.social-neo-research-hero-actions',
        '.social-neo-research-hero-stats',
        '.social-neo-research-stat',
        '.social-neo-research-tabs',
        '.social-neo-research-tab',
        '.social-neo-research-tab-icon',
        '.social-neo-research-tab-copy',
        '.social-neo-research-catalog',
        '.social-neo-research-toolbar',
        '.social-neo-research-filter',
        '.social-neo-research-grid',
        '.social-neo-research-card',
        '.social-neo-research-card-top',
        '.social-neo-research-card-open',
        '.social-neo-research-card-title',
        '.social-neo-research-card-meta',
        '.social-neo-research-card-abstract',
        '.social-neo-research-card-file',
        '.social-neo-research-card-foot',
        '.social-neo-research-card-pin',
        '.social-neo-research-empty',
        '.social-neo-research-reader',
        '.social-neo-research-reader-head',
        '.social-neo-research-reader-titleblock',
        '.social-neo-research-reader-title',
        '.social-neo-research-reader-actions',
        '.social-neo-research-abstract',
        '.social-neo-research-file-list',
        '.social-neo-research-files',
        '.social-neo-research-file-row',
        '.social-neo-research-file-select',
        '.social-neo-research-pdf-toolbar',
        '.social-neo-research-meta-strip',
        '.social-neo-research-article-body',
        '.lux-empty-state',
        '.lux-empty-state__title',
        '.lux-empty-state__copy',
        '.lux-empty-state__action',
        '.lux-status-pill',
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

    function getResearchSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isResearchSurfaceReady() {
        return Boolean(getResearchSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isResearchSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-research-assembly-root="1"]'],
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
            '.social-neo-research-pdf-shell',
            '.social-neo-research-pdf-thumbs',
            '.social-neo-research-pdf-viewport',
            '.social-neo-research-pdf-pages',
            '[data-research-pdf-shell]',
            '[data-research-pdf-viewport]',
            '[data-research-pdf-pages]',
            '[data-research-viewer-host]'
        ],
        outerSelectors: ['[data-social-research-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-research-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-research-assembly-root="1"]',
            '.social-neo-research-shell',
            '.social-neo-research-hero',
            '.social-neo-research-hero-head',
            '.social-neo-research-hero-stats',
            '.social-neo-research-tabs',
            '.social-neo-research-catalog',
            '.social-neo-research-toolbar',
            '.social-neo-research-grid',
            '.social-neo-research-card',
            '.social-neo-research-reader',
            '.social-neo-research-reader-head',
            '.social-neo-research-reader-titleblock',
            '.social-neo-research-file-list'
        ],
        flattenInnerTargets: true,
        granularSelector: researchRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-research-assembly-active',
            ready: 'social-research-assembly-ready',
            target: 'kiu-social-research-assembly-target',
            outer: 'kiu-social-research-assembly-outer',
            inner: 'kiu-social-research-assembly-inner',
            structure: 'kiu-social-research-assembly-structure',
            staging: 'is-social-research-assembly-staging'
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
        rootStateDataset: 'socialResearchAssemblyState'
    });

    function startCurrentResearchMotion(center = getCenter(), options = {}) {
        if (typeof motion.install === 'function') motion.install();
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getResearchSection(center);
        if (activePanel !== 'research' || !section) return false;
        const isNewSection = section.dataset.socialResearchAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // look like new sections but must not re-enter assembly-active / PE-none.
        // Explicit queueSocialResearchMotion passes { force: true } for panel/tab switches.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialResearchAssemblyState;
        section.dataset.socialResearchAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedResearch() {
        const page = getCenter();
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedResearch, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'research') return;
            const run = () => {
                observerFrame = 0;
                startCurrentResearchMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialResearchLoadingObserver = observer;
    }

    window.__kiuSocialResearchLoadingMotion = motion;
    window.__kiuStartSocialResearchLoadingMotion = startCurrentResearchMotion;
    if (typeof window.__kiuShouldBindSocialLoadingFallback !== 'function'
        || window.__kiuShouldBindSocialLoadingFallback('research')) {
        motion.install();
        observeRenderedResearch();
        window.setTimeout(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            startCurrentResearchMotion();
        }, 0);
    }
})();
