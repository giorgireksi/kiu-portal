/* Gradebook & Faculty Assessment console assembly configuration. The lifecycle is shared across routes. */
(function installGradebookLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-faculty-gradebook')
            || document.body?.classList.contains('lux-route-gradebook')
            || document.documentElement?.dataset?.luxPage === 'faculty-gradebook'
            || document.documentElement?.dataset?.luxPage === 'gradebook'
            || /(?:^|\/)(?:faculty-gradebook|gradebook)\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-faculty-gradebook') || document.querySelector('#app-content'),
        observerSelector: '#page-faculty-gradebook',
        isContentReady: () => {
            const root = document.querySelector('#page-faculty-gradebook') || document.querySelector('#app-content');
            return Boolean(
                root?.querySelector('.lux-faculty-command-deck')
                && root.querySelector('#gradebook-faculty-staff-workspace')
            );
        },
        autoStart: true,
        animateLateAfterReady: false,
        autoReplayLateMutations: false,
        rootStateDataset: 'kiuGradebookAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '.lux-faculty-command-deck',
            '.lux-fg-workspace'
        ],
        outerFlightSelector: [
            '.lux-faculty-command-deck',
            '.lux-fg-toolbar',
            '.lux-fg-control-band',
            '.lux-fg-action-band',
            '.lux-fg-ops-panel',
            '.lux-fg-workspace'
        ],
        hierarchySelector: [
            '.lux-fg-toolbar',
            '.lux-fg-control-band',
            '.lux-fg-action-band',
            '.lux-fg-ops-panel',
            '.lux-fg-ops-grid',
            '.lux-fg-workspace',
            '#gradebook-faculty-staff-workspace',
            '.gb-lms-staff-workspace'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.lux-faculty-command-deck',
            '.lux-fg-toolbar',
            '.lux-fg-intro',
            '#faculty-page-kicker',
            '#faculty-page-title',
            '.lux-fg-scope',
            '.lux-status-pill',
            '#faculty-overview-rosters',
            '#faculty-overview-students',
            '#faculty-fg-assessment-pill',
            '.lux-fg-control-band',
            '.lux-fg-filters',
            '.lux-field-stack',
            '#faculty-assessment-controls-mount',
            '.lux-fg-action-band',
            '.gb-staff-actions',
            '.lux-fg-ops-panel',
            '.lux-fg-ops-head',
            '.lux-fg-ops-grid',
            '.lux-fg-ops-tile',
            '.lux-fg-workspace',
            '#gradebook-faculty-staff-workspace',
            '.gb-lms-staff-workspace',
            '.gb-staff-sheet',
            '.gb-staff-table',
            '.gb-staff-row',
            '.gb-staff-card'
        ],
        controlSelector: [
            'button',
            'input',
            'select',
            'textarea',
            '[role="button"]',
            '.lux-primary-btn',
            '.lux-secondary-btn',
            '.lux-ghost-btn',
            '.lux-status-pill'
        ],
        structureSelector: [],
        classes: {
            active: 'faculty-gradebook-assembly-active',
            ready: 'faculty-gradebook-assembly-ready',
            target: 'kiu-faculty-gradebook-assembly-target',
            outer: 'kiu-faculty-gradebook-assembly-outer',
            inner: 'kiu-faculty-gradebook-assembly-inner',
            structure: 'kiu-faculty-gradebook-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuGradebookLoadingMotion = motion;
    motion.install();
})();
