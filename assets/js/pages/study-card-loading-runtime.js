/* Study-card assembly configuration. The lifecycle is shared across routes. */
(function installStudyCardLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-study-card')
            || document.documentElement?.dataset?.luxPage === 'study-card'
            || /(?:^|\/)study-card\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-study-card'),
        observerSelector: '#page-study-card',
        isContentReady: () => Boolean(
            document.querySelector('#study-card-container > .study-card-shell, #study-card-container > .study-card-empty')
        ),
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '.study-card-workspace',
            '.study-card-shell',
            '#study-card-terms-region',
            '.study-card-term-block'
        ],
        rootStateDataset: 'kiuStudyCardAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, #study-card-assessment-window',
        outerSelectors: [
            '.study-card-command-deck'
        ],
        outerFlightSelector: [
            '.study-card-workspace'
        ],
        hierarchySelector: [
            '.study-card-workspace'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.study-card-page-head',
            '.study-card-title-row',
            '.lux-section-kicker',
            '.study-card-title',
            '.study-card-shell',
            '#study-card-terms-region',
            '.study-card-term-block',
            '.study-card-term-header',
            '.study-card-semester-table',
            '.study-card-heading',
            '.study-card-term-row',
            '.study-card-cell',
            '.study-card-assessment-btn',
            '.study-card-empty',
            '[class*="study-card-"]',
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
            '.lux-primary-btn',
            '.lux-secondary-btn',
            '.lux-ghost-btn'
        ],
        structureSelector: [],
        classes: {
            active: 'study-card-assembly-active',
            ready: 'study-card-assembly-ready',
            target: 'kiu-study-card-assembly-target',
            outer: 'kiu-study-card-assembly-outer',
            inner: 'kiu-study-card-assembly-inner',
            structure: 'kiu-study-card-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 900,
            contentWaitMaxMs: 900,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuStudyCardLoadingMotion = motion;
    motion.install();
})();
