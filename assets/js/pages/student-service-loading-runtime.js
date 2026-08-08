/* Student Service assembly configuration. The lifecycle is shared across routes. */
(function installStudentServiceLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-student-service')
            || document.documentElement?.dataset?.luxPage === 'student-service'
            || /(?:^|\/)student-service\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-student-service'),
        observerSelector: '#page-student-service',
        isContentReady: () => {
            const root = document.querySelector('#page-student-service');
            return Boolean(
                root?.querySelector('[data-student-service-page-shell="1"]')
                && root.querySelector('#student-service-page-body > *')
            );
        },
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '[data-student-service-page-shell="1"]',
            '[data-student-service-page-hero="1"]',
            '[data-student-service-page-switcher="1"]',
            '[data-student-service-page-workflow="1"]',
            '[data-student-service-page-overview="1"]',
            '#student-service-page-body',
            '.student-service-zone',
            '.student-service-workbench-merged',
            '.student-service-ticket-inbox-list',
            '.student-service-qa-feed',
            '.student-service-guidance-workspace'
        ],
        rootStateDataset: 'kiuStudentServiceAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, #student-service-modal-root, [role="dialog"]',
        outerSelectors: [
            '[data-student-service-page-shell="1"]'
        ],
        outerFlightSelector: [
            '#student-service-page-body',
            '.student-service-zone'
        ],
        hierarchySelector: [
            '[data-student-service-page-hero="1"]',
            '[data-student-service-page-switcher="1"]',
            '[data-student-service-page-workflow="1"]',
            '[data-student-service-page-overview="1"]',
            '#student-service-page-body',
            '.student-service-lane-chooser',
            '.student-service-zone',
            '.student-service-workbench-merged',
            '.student-service-workbench-column',
            '.student-service-guidance-workspace'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '[data-student-service-page-hero="1"]',
            '[data-student-service-page-switcher="1"]',
            '[data-student-service-page-workflow="1"]',
            '[data-student-service-page-overview="1"]',
            '#student-service-page-body',
            '.student-service-page-hero',
            '.student-service-command-bar-shell',
            '[data-student-service-command-bar="true"]',
            '.student-service-lane-switcher-shell',
            '.student-service-lane-switcher',
            '.student-service-lane-choice-grid',
            '.student-service-lane-choice-card',
            '.student-service-zone',
            '.student-service-canvas',
            '.student-service-workbench-merged',
            '.student-service-workbench-column',
            '.student-service-ticket-grid',
            '.student-service-ticket-inbox-list',
            '.student-service-ticket-inbox-row',
            '.student-service-ticket-detail',
            '.student-service-ticket-conversation',
            '.student-service-ticket-chat-log',
            '.student-service-ticket-composer',
            '.student-service-ticket-card',
            '.student-service-qa-card',
            '.student-service-qa-card-detail',
            '.student-service-qa-card-stats',
            '.student-service-qa-thread-comments',
            '.student-service-qa-thread-compose',
            '.student-service-guidance-browser',
            '.student-service-guidance-workspace',
            '.student-service-guidance-pane',
            '.student-service-find-toolbar',
            '.student-service-empty-state',
            '.student-service-loading-state',
            '.student-service-bootstrap-error-banner',
            '[class*="student-service-"]',
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
            '.lux-picker-btn',
            '.lux-primary-btn',
            '.lux-secondary-btn',
            '.lux-ghost-btn'
        ],
        structureSelector: [],
        classes: {
            active: 'student-service-assembly-active',
            ready: 'student-service-assembly-ready',
            target: 'kiu-student-service-assembly-target',
            outer: 'kiu-student-service-assembly-outer',
            inner: 'kiu-student-service-assembly-inner',
            structure: 'kiu-student-service-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuStudentServiceLoadingMotion = motion;
    motion.install();
})();
