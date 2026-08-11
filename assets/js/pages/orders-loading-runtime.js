/* Recipient orders inbox assembly configuration. */
(function installOrdersLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => (document.body?.classList.contains('lux-route-orders')
            || document.documentElement?.dataset?.luxPage === 'orders'
            || /(?:^|\/)orders\.html$/i.test(window.location.pathname || ''))
            && !document.body?.classList.contains('lux-route-admin-orders')
            && !document.body?.classList.contains('lux-entry-admin-orders'),
        getPageRoot: () => document.querySelector('#page-orders'),
        observerSelector: '#page-orders',
        isContentReady: () => {
            const root = document.querySelector('#page-orders');
            if (root?.querySelector('.orders-detail-empty:not([hidden])')
                && !root.querySelector('[data-orders-inbox-shell="1"]')) {
                return true;
            }
            const shell = root?.querySelector('[data-orders-inbox-shell="1"]');
            if (!shell) return false;
            const heroMain = shell.querySelector('#orders-inbox-hero-main');
            const heroStats = shell.querySelector('#orders-inbox-hero-stats');
            const listPanel = shell.querySelector('#orders-inbox-list-panel');
            const detailPanel = shell.querySelector('#orders-inbox-detail-panel');
            return Boolean(
                heroMain?.children.length
                && heroStats?.children.length
                && listPanel?.children.length
                && detailPanel?.children.length
            );
        },
        // Once the inbox is revealed, status/filter updates should paint in place
        // without replaying the entrance animation for the refreshed order list.
        animateLateAfterReady: false,
        autoReplayLateMutations: false,
        lateReadyWindowMs: 0,
        lateReplaySelector: [
            '[data-orders-inbox-shell="1"]',
            '.orders-inbox-workspace',
            '.orders-inbox-hero',
            '.orders-inbox-hero-side',
            '.orders-inbox-workspace-body',
            '.orders-inbox-workspace-grid',
            '#orders-inbox-list-panel',
            '#orders-inbox-detail-panel',
            '.orders-inbox-layout-filters',
            '.orders-list-wrap',
            '.orders-item',
            '.orders-list-empty',
            '.orders-detail-empty',
            '.orders-metric-card',
            '.orders-attachment-card',
            '.orders-recipient-card'
        ],
        rootStateDataset: 'kiuOrdersAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #mobile-action-sheet, [role="dialog"], .lux-picker-panel, .lux-utility-panel, .lux-user-menu, #lux-studio-backdrop',
        outerSelectors: [
            '[data-orders-inbox-shell="1"]'
        ],
        outerFlightSelector: [
            '.orders-inbox-workspace',
            '.orders-inbox-hero',
            '.orders-inbox-workspace-list',
            '.orders-inbox-workspace-detail'
        ],
        hierarchySelector: [
            '[data-orders-inbox-shell="1"]',
            '.orders-inbox-workspace',
            '.orders-inbox-hero',
            '.orders-inbox-hero-stage',
            '.orders-inbox-workspace-body',
            '.orders-inbox-workspace-grid',
            '#orders-inbox-list-panel',
            '#orders-inbox-detail-panel',
            '.orders-list-wrap',
            '[data-order-detail-shell]'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '[data-orders-inbox-shell="1"]',
            '.orders-inbox-workspace',
            '.orders-inbox-hero',
            '.orders-inbox-hero-stage',
            '.orders-inbox-hero-side',
            '.orders-inbox-workspace-body',
            '.orders-inbox-workspace-grid',
            '#orders-inbox-list-panel',
            '#orders-inbox-detail-panel',
            '.lux-card-head',
            '[data-recipient-order-search]',
            '.orders-status-row',
            '.orders-inbox-layout-filters',
            '.orders-list-wrap',
            '.orders-item',
            '.orders-list-empty',
            '.orders-detail-empty',
            '[data-order-detail-shell]',
            '.orders-detail-header',
            '.orders-detail-panel',
            '.orders-metric-grid',
            '.orders-metric-card',
            '.orders-detail-attachments',
            '.orders-attachment-card',
            '.orders-recipient-grid',
            '.orders-recipient-card'
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
            active: 'orders-assembly-active',
            ready: 'orders-assembly-ready',
            target: 'kiu-orders-assembly-target',
            outer: 'kiu-orders-assembly-outer',
            inner: 'kiu-orders-assembly-inner',
            structure: 'kiu-orders-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuOrdersLoadingMotion = motion;
    motion.install();
})();
