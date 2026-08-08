/* Programs assembly configuration. The lifecycle is shared across routes. */
(function installProgramsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-programs')
            || document.documentElement?.dataset?.luxPage === 'programs'
            || /(?:^|\/)programs\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-programs'),
        observerSelector: '#page-programs',
        isContentReady: () => Boolean(
            document.querySelector('#student-educational-program-root [data-programs-panel-shell]')
        ),
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '.lux-program-grid',
            '[data-programs-panel-shell]'
        ],
        rootStateDataset: 'kiuProgramsAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #mobile-action-sheet',
        outerSelectors: [
            '.lux-program-command-deck'
        ],
        outerFlightSelector: [
            '.lux-program-grid',
            '[data-programs-panel-shell]'
        ],
        hierarchySelector: [
            '.lux-program-grid',
            '[data-programs-panel-shell]'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.lux-prog-toolbar',
            '.lux-prog-intro',
            '.lux-section-kicker',
            '#programs-hero-title',
            '.lux-prog-control-band',
            '.lux-program-field',
            '.lux-program-select-wrap',
            '.lux-program-search-wrap',
            '#student-program-semester-filter',
            '#student-program-search',
            '#student-program-search-clear',
            '.lux-prog-workspace',
            '#student-educational-program-root',
            '[class*="lux-program-"]',
            '[class*="program-"]',
            '[class*="curriculum-"]',
            'h1, h2, h3, h4, h5, h6',
            'p',
            'strong',
            'span',
            'em',
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
            active: 'programs-assembly-active',
            ready: 'programs-assembly-ready',
            target: 'kiu-programs-assembly-target',
            outer: 'kiu-programs-assembly-outer',
            inner: 'kiu-programs-assembly-inner',
            structure: 'kiu-programs-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuProgramsLoadingMotion = motion;
    motion.install();
})();
