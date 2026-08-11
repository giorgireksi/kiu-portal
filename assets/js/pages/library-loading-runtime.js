/* Read-only library catalog assembly configuration. */
(function installLibraryLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => (document.body?.classList.contains('lux-route-library')
            || document.documentElement?.dataset?.luxPage === 'library'
            || /(?:^|\/)library\.html$/i.test(window.location.pathname || ''))
            && !document.body?.classList.contains('lux-route-admin-library')
            && !document.body?.classList.contains('lux-entry-admin-library'),
        getPageRoot: () => document.querySelector('#page-library'),
        observerSelector: '#page-library',
        isContentReady: () => {
            const root = document.querySelector('#page-library');
            if (!root?.querySelector('[data-library-catalog-shell="1"]')) return false;
            const tabs = root.querySelector('#admin-library-catalog-tabs');
            const header = root.querySelector('.admin-library-catalog-table thead tr');
            const tbody = root.querySelector('#book-catalog-body');
            return Boolean(
                tabs?.children.length
                && header?.children.length
                && tbody?.querySelector('tr')
            );
        },
        // Catalog section changes should update in place after the initial reveal.
        animateLateAfterReady: false,
        autoReplayLateMutations: false,
        lateReadyWindowMs: 0,
        lateReplaySelector: [
            '[data-library-catalog-shell="1"]',
            '.library-catalog-filters-panel',
            '.admin-library-metric-card',
            '.admin-library-catalog-card',
            '.admin-library-catalog-head',
            '.admin-library-tab-btn',
            '.admin-library-scroll-wrap',
            '.admin-library-catalog-table thead tr',
            '.admin-library-catalog-row',
            '.admin-library-empty-row',
            '.admin-library-catalog-foot',
            '.alib-filter-stack'
        ],
        rootStateDataset: 'kiuLibraryAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #mobile-action-sheet, [role="dialog"], .lux-picker-panel, .lux-utility-panel, .lux-user-menu, #lux-studio-backdrop',
        outerSelectors: [
            '[data-library-catalog-shell="1"]'
        ],
        outerFlightSelector: [
            '.library-catalog-filters-panel',
            '.admin-library-catalog-card'
        ],
        hierarchySelector: [
            '[data-library-catalog-shell="1"]',
            '.library-catalog-filters-panel',
            '.admin-library-catalog-card',
            '.admin-library-catalog-head',
            '.admin-library-scroll-wrap',
            '.admin-library-catalog-foot',
            '.alib-filter-stack'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '[data-library-catalog-shell="1"]',
            '.library-catalog-filters-panel',
            '.lux-card-head',
            '.admin-library-metric-card',
            '.alib-filter-stack',
            '[data-library-catalog-filter-fields] .lux-picker-field',
            '.admin-library-catalog-card',
            '.admin-library-catalog-head',
            '.admin-library-tab-btn',
            '.admin-library-scroll-wrap',
            '.admin-library-catalog-table thead tr',
            '.admin-library-catalog-row',
            '.admin-library-empty-row',
            '.admin-library-catalog-foot'
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
            active: 'library-assembly-active',
            ready: 'library-assembly-ready',
            target: 'kiu-library-assembly-target',
            outer: 'kiu-library-assembly-outer',
            inner: 'kiu-library-assembly-inner',
            structure: 'kiu-library-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuLibraryLoadingMotion = motion;
    motion.install();
})();
