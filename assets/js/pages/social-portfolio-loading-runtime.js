/* Social Portfolio center assembly configuration. */
(function installSocialPortfolioLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialPortfolioLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const portfolioRegions = [
        '[data-social-portfolio-assembly-root="1"]',
        '.social-neo-portfolio-shell',
        '.social-neo-portfolio-shell--merged',
        '.social-neo-portfolio-hero',
        '.social-neo-portfolio-hero-head',
        '.social-neo-portfolio-hero-actions',
        '.social-neo-portfolio-hero-create-btn',
        '.social-neo-portfolio-hero-profile-btn',
        '.social-neo-portfolio-hero-stats',
        '.social-neo-portfolio-hero-stat',
        '.social-neo-portfolio-hero-tabs-row',
        '.social-neo-portfolio-hero-tabs',
        '.portfolio-panel-tabs',
        '.portfolio-panel-tab',
        '.portfolio-panel-tab-copy',
        '.social-neo-portfolio-hero-discover',
        '.social-portfolio-toolbar-head',
        '.social-portfolio-search-row',
        '.social-portfolio-search',
        '.social-portfolio-tag-row',
        '.social-neo-portfolio-hero-divider',
        '.social-neo-portfolio-hero-body',
        '.social-portfolio-feed',
        '.social-portfolio-card',
        '.social-portfolio-card-head',
        '.social-portfolio-cover',
        '.social-portfolio-body',
        '.social-portfolio-expanded',
        '.social-portfolio-actions',
        '.social-portfolio-links',
        '.social-portfolio-media-strip',
        '.social-portfolio-extras',
        '.social-portfolio-mini-grid',
        '.social-portfolio-mini-card',
        '.portfolio-editor-stack',
        '.portfolio-editor-toolbar',
        '.portfolio-editor-actions',
        '.portfolio-basics-card',
        '.sns-portfolio-editor-panel',
        '.portfolio-entry-grid',
        '.portfolio-extras-list',
        '.portfolio-extra-card',
        '.portfolio-publish-panel',
        '.portfolio-audience-cards',
        '.portfolio-consent-row',
        '.lux-scroll-rail',
        '.social-neo-section-head',
        '.social-neo-pill',
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

    function getPortfolioSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')
            || (section.matches('.social-neo-card') && section.querySelector('.social-neo-empty-hero'))) {
            return null;
        }
        return section;
    }

    function isPortfolioSurfaceReady() {
        return Boolean(getPortfolioSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isPortfolioSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-portfolio-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i):not(.social-neo-portfolio-hero-divider)',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: ['[data-social-portfolio-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-portfolio-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-portfolio-assembly-root="1"]',
            '.social-neo-portfolio-shell',
            '.social-neo-portfolio-hero',
            '.social-neo-portfolio-hero-head',
            '.social-neo-portfolio-hero-stats',
            '.social-neo-portfolio-hero-tabs-row',
            '.social-neo-portfolio-hero-discover',
            '.social-portfolio-search-row',
            '.social-portfolio-tag-row',
            '.social-neo-portfolio-hero-body',
            '.social-portfolio-feed',
            '.social-portfolio-card',
            '.social-portfolio-card-head',
            '.social-portfolio-body',
            '.social-portfolio-actions',
            '.portfolio-editor-stack',
            '.portfolio-basics-card',
            '.portfolio-publish-panel'
        ],
        flattenInnerTargets: true,
        granularSelector: portfolioRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-portfolio-assembly-active',
            ready: 'social-portfolio-assembly-ready',
            target: 'kiu-social-portfolio-assembly-target',
            outer: 'kiu-social-portfolio-assembly-outer',
            inner: 'kiu-social-portfolio-assembly-inner',
            structure: 'kiu-social-portfolio-assembly-structure',
            staging: 'is-social-portfolio-assembly-staging'
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
        rootStateDataset: 'socialPortfolioAssemblyState'
    });

    function startCurrentPortfolioMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getPortfolioSection(center);
        if (activePanel !== 'projects' || !section) return false;
        const isNewSection = section.dataset.socialPortfolioAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // look like new sections but must not re-enter assembly-active / PE-none.
        // Explicit queueSocialPortfolioMotion passes { force: true } for panel/tab switches.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialPortfolioAssemblyState;
        section.dataset.socialPortfolioAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedPortfolio() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedPortfolio, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'workspace' && activePanel !== 'projects') return;
            const run = () => {
                observerFrame = 0;
                startCurrentPortfolioMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialPortfolioLoadingObserver = observer;
    }

    window.__kiuSocialPortfolioLoadingMotion = motion;
    window.__kiuStartSocialPortfolioLoadingMotion = startCurrentPortfolioMotion;
    motion.install();
    observeRenderedPortfolio();
    window.setTimeout(() => startCurrentPortfolioMotion(), 0);
})();
