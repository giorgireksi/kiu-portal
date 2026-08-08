/* Chancellery assembly configuration. The lifecycle is shared across routes. */
(function installChancelleryLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-chancellery')
            || document.documentElement?.dataset?.luxPage === 'chancellery'
            || /(?:^|\/)chancellery\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-chancellery'),
        observerSelector: '#page-chancellery',
        isContentReady: () => {
            const root = document.querySelector('#page-chancellery');
            return Boolean(
                root?.querySelector('[data-chancellery-shell="1"]')
                && root.querySelector('#chancellery-hero-region > *')
                && root.querySelector('#chancellery-content-region > *')
            );
        },
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '[data-chancellery-shell="1"]',
            '#chancellery-hero-region',
            '#chancellery-command-region',
            '#chancellery-content-region',
            '.lux-chancellery-workspace',
            '.lux-chancellery-workspace-split',
            '.lux-chancellery-list-region',
            '.lux-chancellery-detail-body',
            '.lux-chancellery-finance-grid'
        ],
        rootStateDataset: 'kiuChancelleryAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, #chancellery-case-overlay, #chancellery-forward-overlay, #chancellery-document-editor-overlay, [role="dialog"]',
        outerSelectors: [
            '[data-chancellery-shell="1"]'
        ],
        outerFlightSelector: [
            '.lux-chancellery-hero-card',
            '.lux-chancellery-workspace'
        ],
        hierarchySelector: [
            '#chancellery-hero-region',
            '#chancellery-command-region',
            '#chancellery-content-region',
            '.lux-chancellery-hero-card',
            '.lux-chancellery-command-bar',
            '.lux-chancellery-workspace',
            '.lux-chancellery-workspace-split',
            '.lux-chancellery-list-panel',
            '.lux-chancellery-detail-panel',
            '.lux-chancellery-finance-grid'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.lux-chancellery-hero-card',
            '.lux-chancellery-hero-stage',
            '.lux-chancellery-hero-main',
            '.lux-chancellery-hero-side',
            '.lux-chancellery-hero-signals',
            '.lux-hero-signal',
            '.lux-chancellery-hero-actions',
            '.lux-chancellery-command-bar',
            '.lux-chancellery-filter-field',
            '.lux-chancellery-routing-filter',
            '.lux-chancellery-workspace',
            '.lux-chancellery-workspace-split',
            '.lux-chancellery-list-panel',
            '.lux-chancellery-list-region',
            '.lux-chancellery-queue-side',
            '.lux-chancellery-queue-item',
            '.lux-chancellery-detail-panel',
            '.lux-chancellery-detail-body',
            '.lux-chancellery-subcard',
            '.lux-chancellery-thread-entry',
            '.lux-chancellery-finance-grid',
            '.lux-chancellery-finance-card',
            '[class*="chancellery-"]',
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
            active: 'chancellery-assembly-active',
            ready: 'chancellery-assembly-ready',
            target: 'kiu-chancellery-assembly-target',
            outer: 'kiu-chancellery-assembly-outer',
            inner: 'kiu-chancellery-assembly-inner',
            structure: 'kiu-chancellery-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuChancelleryLoadingMotion = motion;
    motion.install();
})();
