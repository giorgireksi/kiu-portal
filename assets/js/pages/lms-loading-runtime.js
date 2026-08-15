/* LMS console assembly configuration. The lifecycle is shared across routes. */
(function installLmsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-lms')
            || document.documentElement?.dataset?.luxPage === 'lms'
            || /(?:^|\/)lms\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-lms.active-page')
            || document.querySelector('#page-lms-groups.active-page')
            || document.querySelector('#page-lms-inner.active-page')
            || document.querySelector('#page-lms')
            || document.querySelector('#app-content'),
        observerSelector: '#app-content',
        isContentReady: () => {
            const root = document.querySelector('#app-content');
            return Boolean(
                root?.querySelector('.lux-lms-hero')
                || root?.querySelector('.lms-clean-subjects')
                || root?.querySelector('#lms-subject-grid')
                || root?.querySelector('#dynamic-groups-grid')
                || root?.querySelector('#lms-content-area')
            );
        },
        autoStart: true,
        animateLateAfterReady: false,
        autoReplayLateMutations: false,
        rootStateDataset: 'kiuLmsAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '.lux-lms-hero',
            '.lms-clean-subjects',
            '.lms-route-panel',
            '.lms-route-workspace-chrome'
        ],
        outerFlightSelector: [
            '.lux-lms-hero',
            '.lms-clean-subjects',
            '.lms-route-panel',
            '.lms-route-workspace-chrome',
            '#lms-subject-grid',
            '#dynamic-groups-grid',
            '#lms-content-area'
        ],
        hierarchySelector: [
            '.lux-lms-hero',
            '.lms-clean-subjects',
            '.lux-card-head',
            '#lms-subject-grid',
            '.lms-route-panel',
            '#dynamic-groups-grid',
            '.lms-route-workspace-chrome',
            '.lms-route-tab-strip',
            '#lms-content-area'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.lux-lms-hero',
            '.lms-clean-subjects',
            '.lux-card-head',
            '.lms-clean-kicker',
            '#lms-subjects-section-title',
            '#lms-subjects-section-copy',
            '#lms-lane-chip',
            '.lux-status-pill',
            '#lms-subject-grid',
            '.lms-subject-card',
            '.lms-subject-row',
            '.lms-route-panel',
            '#dynamic-subject-title',
            '#dynamic-groups-grid',
            '.lms-clean-group-card',
            '.lms-route-workspace-chrome',
            '#lms-course-title',
            '.lms-section-switch',
            '.lms-route-tab-strip',
            '.lms-route-tab',
            '#lms-content-area'
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
            '.lms-section-option',
            '.lms-route-tab'
        ],
        structureSelector: [],
        classes: {
            active: 'lms-assembly-active',
            ready: 'lms-assembly-ready',
            target: 'kiu-lms-assembly-target',
            outer: 'kiu-lms-assembly-outer',
            inner: 'kiu-lms-assembly-inner',
            structure: 'kiu-lms-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuLmsLoadingMotion = motion;
    motion.install();
})();
