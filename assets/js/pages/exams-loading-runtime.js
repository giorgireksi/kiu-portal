/* Exams console assembly configuration. The lifecycle is shared across routes. */
(function installExamsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-exams')
            || document.documentElement?.dataset?.luxPage === 'exams'
            || /(?:^|\/)exams\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-exams'),
        observerSelector: '#page-exams',
        isContentReady: () => {
            const root = document.querySelector('#page-exams');
            return Boolean(
                root?.querySelector('[data-exam-shell="1"]')
                && root.querySelector('#ex2-chrome-region > *')
                && root.querySelector('#ex2-body-region > *')
            );
        },
        autoStart: true,
        animateLateAfterReady: false,
        autoReplayLateMutations: false,
        rootStateDataset: 'kiuExamsAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #ex2-modal-region, .ex2-modal-overlay, .ex2-modal, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '[data-exam-shell="1"]'
        ],
        outerFlightSelector: [
            '.ex2-workspace-panel',
            '.ex2-workspace-head',
            '.ex2-workspace-stats',
            '.ex2-stat-chip',
            '.ex2-tab-row',
            '.ex2-workspace-tab-row',
            '.ex2-workspace-section',
            '.ex2-card-grid',
            '.ex2-quiz-card',
            '.ex2-session-card',
            '.ex2-panel'
        ],
        hierarchySelector: [
            '#ex2-chrome-region',
            '#ex2-body-region',
            '.ex2-workspace-section',
            '.ex2-tab-row',
            '.ex2-workspace-tab-row',
            '.ex2-card-grid',
            '.ex2-builder-body',
            '.ex2-two-col'
        ],
        flattenInnerTargets: true,
        // Region shells only — tab remounts must not re-fly leaf text.
        granularSelector: [
            '.ex2-workspace-panel',
            '.ex2-workspace-head',
            '.ex2-workspace-title-row',
            '.ex2-workspace-stats',
            '.ex2-stat-chip',
            '.ex2-tab-row',
            '.ex2-workspace-tab-row',
            '.ex2-tab',
            '.ex2-workspace-section',
            '.ex2-panel-head',
            '.ex2-panel',
            '.ex2-card-grid',
            '.ex2-quiz-card',
            '.ex2-session-card',
            '.ex2-cohort-card',
            '.ex2-session-summary-card',
            '.ex2-session-stat-card',
            '.ex2-select-card',
            '.ex2-builder-body',
            '.ex2-builder-toolbar',
            '.ex2-progress-bar',
            '.ex2-builder-summary-strip',
            '.ex2-question-card',
            '.ex2-two-col',
            '[data-exam-region="builder-toolbar"]',
            '[data-exam-region="builder-stepper"]',
            '[data-exam-region="builder-summary"]',
            '[data-exam-region="builder-step"]'
        ],
        controlSelector: [
            'button',
            'input',
            'select',
            'textarea',
            '[role="button"]',
            '.ex2-btn',
            '.ex2-tab',
            '.lux-picker-btn',
            '.lux-primary-btn',
            '.lux-secondary-btn',
            '.lux-ghost-btn'
        ],
        structureSelector: [],
        classes: {
            active: 'exams-assembly-active',
            ready: 'exams-assembly-ready',
            target: 'kiu-exams-assembly-target',
            outer: 'kiu-exams-assembly-outer',
            inner: 'kiu-exams-assembly-inner',
            structure: 'kiu-exams-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuExamsLoadingMotion = motion;
    motion.install();
})();
