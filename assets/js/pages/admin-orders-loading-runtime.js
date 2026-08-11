/* Admin orders assembly configuration. The lifecycle is shared across routes. */
(function installAdminOrdersLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-admin-orders')
            || document.body?.classList.contains('lux-entry-admin-orders')
            || document.documentElement?.dataset?.luxEntry === 'admin-orders'
            || /(?:^|\/)admin-orders\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#admin-orders-root'),
        observerSelector: '#admin-orders-root',
        isContentReady: () => {
            const root = document.querySelector('#admin-orders-root');
            if (!root?.querySelector('[data-admin-orders-shell="1"]')) return false;
            const commandPanel = root.querySelector('#admin-orders-command-panel');
            const filterPanel = root.querySelector('#admin-orders-table-panel');
            const detailPanel = root.querySelector('#admin-orders-detail-panel');
            return Boolean(
                commandPanel?.children.length
                && filterPanel?.children.length
                && detailPanel?.children.length
            );
        },
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '[data-admin-orders-shell="1"]',
            '.orders-admin-panel',
            '#admin-orders-command-panel',
            '.orders-admin-command-actions',
            '.orders-admin-command-copy',
            '#admin-orders-table-panel',
            '.orders-admin-audience-tabs',
            '.orders-admin-audience-tab',
            '.orders-admin-filter-strip',
            '.orders-inbox-layout-filters',
            '.orders-admin-filter-foot',
            '#admin-orders-detail-panel',
            '.orders-admin-sent-list',
            '.orders-admin-sent-item',
            '.orders-admin-sent-empty'
        ],
        rootStateDataset: 'kiuAdminOrdersAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #admin-orders-create-overlay, #admin-orders-thread-overlay, #admin-orders-recipient-filter-overlay, #admin-orders-titles-overlay, #modal-studio, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '[data-admin-orders-shell="1"]'
        ],
        outerFlightSelector: [
            '.orders-admin-panel',
            '.orders-admin-workspace-section--command',
            '.orders-admin-workspace-section--filter',
            '.orders-admin-workspace-section--inbox'
        ],
        hierarchySelector: [
            '[data-admin-orders-shell="1"]',
            '.orders-admin-panel',
            '#admin-orders-command-panel',
            '#admin-orders-table-panel',
            '#admin-orders-detail-panel',
            '.orders-admin-command-actions',
            '.orders-admin-command-copy',
            '.orders-admin-audience-tabs',
            '.orders-admin-filter-strip',
            '.orders-admin-sent-list'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '[data-admin-orders-shell="1"]',
            '.orders-admin-panel',
            '#admin-orders-command-panel',
            '.orders-admin-command-actions',
            '.orders-admin-command-copy',
            '#admin-orders-table-panel',
            '.lux-card-head',
            '.orders-admin-audience-tabs',
            '.orders-admin-audience-tab',
            '.orders-admin-filter-strip',
            '.orders-inbox-layout-filters',
            '.orders-admin-filter-foot',
            '#admin-orders-detail-panel',
            '.orders-admin-sent-list',
            '.orders-admin-sent-item',
            '.orders-admin-sent-empty',
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
            active: 'admin-orders-assembly-active',
            ready: 'admin-orders-assembly-ready',
            target: 'kiu-admin-orders-assembly-target',
            outer: 'kiu-admin-orders-assembly-outer',
            inner: 'kiu-admin-orders-assembly-inner',
            structure: 'kiu-admin-orders-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuAdminOrdersLoadingMotion = motion;
    motion.install();
})();
