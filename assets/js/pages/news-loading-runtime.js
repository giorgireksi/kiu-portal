/* News assembly configuration. The lifecycle is shared across routes. */
(function installNewsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-news')
            || document.documentElement?.dataset?.luxPage === 'news'
            || /(?:^|\/)news\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-news'),
        observerSelector: '#page-news',
        isContentReady: () => {
            const root = document.querySelector('#portal-news-root');
            return Boolean(
                root?.querySelector('.newsx-shell')
                && root.dataset.newsReady === 'true'
            );
        },
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '.newsx-shell',
            '.newsx-sidebar',
            '.newsx-main',
            '.newsx-header-bar',
            '.newsx-feed',
            '.newsx-feed-list',
            '[data-news-post-host="1"]'
        ],
        rootStateDataset: 'kiuNewsAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '.newsx-shell'
        ],
        outerFlightSelector: [
            '.newsx-sidebar',
            '.newsx-main'
        ],
        hierarchySelector: [
            '.newsx-sidebar',
            '.newsx-main',
            '.newsx-header-bar',
            '.newsx-feed',
            '.newsx-feed-list',
            '[data-news-post-host="1"]',
            '.newsx-feed-card',
            '.newsx-post-tile'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.newsx-sidebar',
            '.newsx-sidebar-deco',
            '.newsx-sidebar-deco-icon',
            '.newsx-sidebar-deco-copy',
            '.newsx-sections-collapse',
            '.newsx-section-list',
            '.newsx-section-btn',
            '.newsx-main',
            '.newsx-header-bar',
            '.newsx-header-top',
            '.newsx-header-copy',
            '.newsx-hero-command',
            '.newsx-filter-toggle',
            '.newsx-filter-collapse',
            '.newsx-filter-grid',
            '.newsx-filter-meta',
            '.newsx-feed',
            '.newsx-feed-state',
            '.newsx-feed-list',
            '.newsx-feed-card',
            '.newsx-loading-card',
            '[data-news-post-host="1"]',
            '.newsx-post-tile',
            '.newsx-post-tile-hit',
            '.newsx-post-tile-cover',
            '.newsx-post-tile-copy',
            '.newsx-post-tile-title',
            '.newsx-post-tile-date',
            '.newsx-post-card',
            '.newsx-card-header',
            '.newsx-card-title',
            '.newsx-card-body',
            '.newsx-card-excerpt',
            '.newsx-author-row',
            '.newsx-attachment-gallery',
            '.newsx-attachment-chip',
            '.newsx-admin-actions',
            '.newsx-empty',
            '.lux-empty-state',
            'h1, h2, h3, h4, h5, h6',
            'p',
            'strong',
            'span',
            'small',
            'label',
            'li'
        ],
        controlSelector: [
            'button',
            'input',
            'select',
            'textarea',
            '[role="button"]',
            '.lux-primary-btn',
            '.lux-secondary-btn',
            '.lux-ghost-btn'
        ],
        structureSelector: [],
        classes: {
            active: 'news-assembly-active',
            ready: 'news-assembly-ready',
            target: 'kiu-news-assembly-target',
            outer: 'kiu-news-assembly-outer',
            inner: 'kiu-news-assembly-inner',
            structure: 'kiu-news-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuNewsLoadingMotion = motion;
    motion.install();
})();
