/* Personal-data assembly configuration. The lifecycle is shared across routes. */
(function installPersonalDataLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-personal-data')
            || document.documentElement?.dataset?.luxPage === 'personal-data'
            || /(?:^|\/)personal-data\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-personal-data'),
        observerSelector: '#page-personal-data',
        isContentReady: () => Boolean(
            document.querySelector('#page-personal-data .personal-data-shell')
            && document.querySelector('#personal-data-blueprint-details-root > *')
        ),
        animateLateAfterReady: true,
        lateReadyWindowMs: 4000,
        lateReplaySelector: [
            '.personal-data-shell',
            '.personal-data-layout',
            '.personal-data-blueprint-details',
            '#personal-data-blueprint-details-root'
        ],
        rootStateDataset: 'kiuPersonalDataAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet, [role="dialog"]',
        outerSelectors: [
            '.personal-data-shell'
        ],
        outerFlightSelector: [
            '.personal-data-layout'
        ],
        hierarchySelector: [
            '.personal-data-hero',
            '.personal-data-command',
            '.personal-data-layout',
            '.personal-data-identity-card',
            '.personal-data-merged',
            '.personal-data-blueprint-details',
            '#personal-data-blueprint-details-root'
        ],
        flattenInnerTargets: true,
        granularSelector: [
            '.personal-data-hero',
            '.personal-data-hero-copy',
            '#personal-data-hero-title',
            '.personal-data-command',
            '.personal-data-toolbar-copy',
            '.personal-data-toolbar-actions',
            '.personal-data-workspace-body',
            '.personal-data-rail',
            '.personal-data-identity-card',
            '.personal-data-profile-row',
            '.personal-data-avatar-shell',
            '.personal-data-name',
            '#personal-data-status',
            '#personal-data-program',
            '.pd-block',
            '.pd-password-form',
            '.pd-field',
            '.pd-password-msg',
            '.pd-password-submit',
            '.personal-data-main',
            '.personal-data-merged',
            '.personal-data-section-head',
            '.personal-data-kpi-row',
            '.personal-data-kpi-card',
            '.personal-data-metric-icon',
            '.pd-progress',
            '#personal-data-progress-block',
            '.personal-data-blueprint-details',
            '#personal-data-blueprint-details-root',
            '.personal-data-blueprint-details-grid',
            '.personal-data-blueprint-field',
            '[class*="personal-data-"]',
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
            active: 'personal-data-assembly-active',
            ready: 'personal-data-assembly-ready',
            target: 'kiu-personal-data-assembly-target',
            outer: 'kiu-personal-data-assembly-outer',
            inner: 'kiu-personal-data-assembly-inner',
            structure: 'kiu-personal-data-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            contentWaitMaxMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuPersonalDataLoadingMotion = motion;
    motion.install();
})();
