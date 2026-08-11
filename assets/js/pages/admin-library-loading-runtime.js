/* Admin library assembly configuration. The lifecycle is shared across routes. */
(function installAdminLibraryLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-admin-library')
            || document.body?.classList.contains('lux-entry-admin-library')
            || document.documentElement?.dataset?.luxEntry === 'admin-library'
            || /(?:^|\/)admin-library\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-library'),
        observerSelector: '#page-library',
        isContentReady: () => {
            const root = document.querySelector('#page-library');
            if (!root?.querySelector('[data-admin-library-shell="1"]')) return false;
            const tabs = root.querySelector('#admin-library-catalog-tabs');
            const tbody = root.querySelector('#book-catalog-body');
            return Boolean(tabs?.children.length && tbody?.querySelector('tr'));
        },
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '[data-admin-library-shell="1"]',
            '.alib-panel--entry',
            '.alib-panel--filters',
            '.admin-library-metric-card',
            '.admin-library-catalog-card',
            '.admin-library-catalog-head',
            '.admin-library-tab-btn',
            '.admin-library-scroll-wrap',
            '.admin-library-catalog-table thead tr',
            '.admin-library-catalog-row',
            '.admin-library-empty-row',
            '.admin-library-catalog-foot',
            '.alib-form-grid',
            '.alib-filter-stack'
        ],
        rootStateDataset: 'kiuAdminLibraryAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #library-schema-overlay, #library-filters-overlay, #library-schema-droplist-overlay, #library-sections-overlay, .admin-library-modal, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '[data-admin-library-shell="1"]'
        ],
        outerFlightSelector: [
            '.alib-panel--entry',
            '.alib-panel--filters',
            '.admin-library-catalog-card'
        ],
        hierarchySelector: [
            '[data-admin-library-shell="1"]',
            '.alib-panel--entry',
            '.alib-panel--filters',
            '.admin-library-catalog-card',
            '.admin-library-catalog-head',
            '.admin-library-scroll-wrap',
            '.admin-library-catalog-foot',
            '.alib-form-grid',
            '.alib-filter-stack'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '[data-admin-library-shell="1"]',
            '.alib-panel--entry',
            '.alib-panel--filters',
            '.lux-card-head',
            '.alib-form-grid',
            '.alib-panel-actions',
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
            '.admin-library-catalog-foot',
            '.admin-library-empty-state',
            '.lux-empty-state'
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
            active: 'admin-library-assembly-active',
            ready: 'admin-library-assembly-ready',
            target: 'kiu-admin-library-assembly-target',
            outer: 'kiu-admin-library-assembly-outer',
            inner: 'kiu-admin-library-assembly-inner',
            structure: 'kiu-admin-library-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuAdminLibraryLoadingMotion = motion;
    motion.install();
})();
