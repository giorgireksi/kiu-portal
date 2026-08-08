/* Registration assembly configuration. The lifecycle is shared across routes. */
(function installRegistrationLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-registration')
            || document.documentElement?.dataset?.luxPage === 'registration'
            || /(?:^|\/)registration\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-registration .registration-studio-shell'),
        observerSelector: '#page-registration',
        rootStateDataset: 'kiuRegistrationAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #modal-overlay, #mobile-action-sheet',
        outerSelectors: [
            '.registration-studio-deck',
            '.registration-workspace'
        ],
        granularSelector: [
            '.registration-summary-panel',
            '.registration-summary-header',
            '.registration-summary-heading',
            '.registration-insight-label',
            '.registration-summary-status-line',
            '.registration-summary-status',
            '.registration-summary-status-meta',
            '.registration-summary-term-field',
            '.registration-summary-term-select',
            '.registration-summary-grid',
            '.registration-summary-section',
            '.registration-summary-value',
            '.registration-summary-copy',
            '.registration-summary-progress',
            '.registration-summary-footer',
            '.registration-summary-facts',
            '.reg-tabs',
            '.reg-tab',
            '.registration-workspace-head',
            '.registration-workspace-kicker',
            '.registration-workspace-title',
            '.registration-workspace-body',
            '#student-reg-content-container',
            '[class*="admin-reg-"]',
            '[class*="registration-"]',
            '[class*="student-reg-"]',
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
            '.registration-metrics-band',
            '.registration-summary-grid'
        ],
        classes: {
            active: 'registration-assembly-active',
            ready: 'registration-assembly-ready',
            target: 'kiu-registration-assembly-target',
            outer: 'kiu-registration-assembly-outer',
            inner: 'kiu-registration-assembly-inner',
            structure: 'kiu-registration-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuRegistrationLoadingMotion = motion;
    motion.install();
})();
