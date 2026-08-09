/* Staff assembly configuration. The lifecycle is shared across routes. */
(function installStaffLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-staff')
            || document.documentElement?.dataset?.luxPage === 'staff'
            || /(?:^|\/)staff\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#staff-content'),
        observerSelector: '#staff-content',
        isContentReady: () => {
            const root = document.querySelector('#staff-content');
            if (!root) return false;
            if (root.querySelector('.staff-shell-loading-state')) return false;
            return Boolean(root.querySelector(
                '.staff-hub-shell, .staff-hub-profile, .staff-hub-form-settings'
            ));
        },
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '.staff-hub-shell',
            '.staff-hub-controls',
            '.staff-hub-directory-panel',
            '.staff-hub-directory-head',
            '.staff-hub-table-wrap',
            '.staff-hub-table tbody tr',
            '.staff-hub-empty',
            '.staff-hub-profile',
            '.staff-hub-toolbar',
            '.staff-hub-tabs',
            '.staff-hub-info-card',
            '.staff-hub-form-settings',
            '.staff-hub-builder-rail',
            '.staff-hub-builder-canvas',
            '.staff-hub-studio-field-row'
        ],
        rootStateDataset: 'kiuStaffAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #staff-command-modal-root, #modal-overlay, #mobile-action-sheet, [role="dialog"], #staff-command-toast',
        outerSelectors: [
            '.staff-hub-shell',
            '.staff-hub-profile',
            '.staff-hub-form-settings'
        ],
        outerFlightSelector: [
            '.staff-hub-controls',
            '.staff-hub-directory-panel',
            '.staff-hub-toolbar',
            '.staff-hub-builder-layout'
        ],
        hierarchySelector: [
            '.staff-hub-shell',
            '.staff-hub-controls',
            '.staff-hub-directory-panel',
            '.staff-hub-directory-head',
            '.staff-hub-table-wrap',
            '.staff-hub-profile',
            '.staff-hub-toolbar',
            '.staff-hub-tabs',
            '.staff-hub-profile-body',
            '.staff-hub-info-grid',
            '.staff-hub-form-settings',
            '.staff-hub-builder-layout',
            '.staff-hub-builder-rail',
            '.staff-hub-builder-canvas'
        ],
        flattenInnerTargets: true,
        // Component units like news/chancellery — not whole-panel slab, not cell innards.
        granularSelector: [
            '.staff-hub-shell',
            '.staff-hub-controls',
            '.staff-hub-directory-panel',
            '.staff-hub-directory-head',
            '.staff-hub-table-wrap',
            '.staff-hub-table tbody tr',
            '.staff-hub-empty',
            '.staff-hub-profile',
            '.staff-hub-toolbar',
            '.staff-hub-tabs',
            '.staff-hub-profile-head',
            '.staff-hub-profile-body',
            '.staff-hub-info-grid',
            '.staff-hub-info-card',
            '.staff-hub-form-settings',
            '.staff-hub-form-settings-head',
            '.staff-hub-builder-layout',
            '.staff-hub-builder-rail',
            '.staff-hub-builder-canvas',
            '.staff-hub-studio-field-row',
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
            active: 'staff-assembly-active',
            ready: 'staff-assembly-ready',
            target: 'kiu-staff-assembly-target',
            outer: 'kiu-staff-assembly-outer',
            inner: 'kiu-staff-assembly-inner',
            structure: 'kiu-staff-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuStaffLoadingMotion = motion;
    motion.install();
})();
