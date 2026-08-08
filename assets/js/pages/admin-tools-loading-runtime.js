/* Admin-tools assembly configuration. The lifecycle is shared across routes. */
(function installAdminToolsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-admin-tools')
            || document.documentElement?.dataset?.luxPage === 'admin-tools'
            || /(?:^|\/)admin-tools\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#lux-admin-tools-shell .lux-admin-tools-page'),
        observerSelector: '#lux-admin-tools-shell',
        rootStateDataset: 'kiuAdminToolsAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], #kiu-subject-builder-modal',
        outerSelectors: [
            '#lux-admin-curriculum-deck',
            '.lux-admin-tools-registration-panel'
        ],
        granularSelector: [
            '.lux-card-head',
            '.lux-card-title',
            '.lux-admin-curriculum-control-band',
            '.lux-admin-tools-reg-tabs',
            '.lux-stat',
            '.lux-program-field',
            '.lux-section-card',
            '.lux-program-subject-panel',
            '.lux-program-subject-card',
            '.curriculum-library-panel',
            '.lux-panel',
            '.lux-card',
            '.lux-subcard',
            '.admin-reg-tab',
            '.admin-reg-program-head',
            '.admin-reg-program-list-shell',
            '.admin-reg-track-group-card',
            '.admin-reg-program-option',
            '.admin-reg-program-pane',
            '.admin-reg-program-pane-head',
            '.admin-reg-program-subject-head',
            '.admin-reg-track-card',
            '.admin-reg-track-head',
            '.admin-reg-track-group-header',
            '.admin-reg-track-group-body',
            '.admin-reg-track-subject-head',
            '.admin-reg-program-subject-row',
            '.admin-reg-track-subject-row',
            '.admin-reg-track-group-footer',
            '[data-builder-section]',
            '[class*="admin-reg-"]',
            '[class*="curriculum-library-"]',
            '[class*="lux-program-"]',
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
        structureSelector: [
            '.lux-admin-curriculum-ops-panel',
            '.lux-admin-curriculum-ops-grid',
            '.lux-admin-curriculum-workspace',
            '.lux-admin-tools-registration-content',
            '.curriculum-library-row-list',
            '.admin-reg-program-layout'
        ],
        classes: {
            active: 'admin-tools-assembly-active',
            ready: 'admin-tools-assembly-ready',
            target: 'kiu-admin-tools-assembly-target',
            outer: 'kiu-admin-tools-assembly-outer',
            inner: 'kiu-admin-tools-assembly-inner',
            structure: 'kiu-admin-tools-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuAdminToolsLoadingMotion = motion;
    motion.install();
})();
