/* Admin-scheduler assembly configuration. The lifecycle is shared across routes. */
(function installAdminSchedulerLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-admin-scheduler')
            || document.documentElement?.dataset?.luxPage === 'admin-scheduler'
            || /(?:^|\/)admin-scheduler\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-admin-scheduler .scheduler-wrap'),
        observerSelector: '#page-admin-scheduler',
        rootStateDataset: 'kiuAdminSchedulerAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #mobile-action-sheet',
        outerSelectors: [
            '.sch-sidebar',
            '.sch-grid-shell'
        ],
        granularSelector: [
            '.sch-rail-hero',
            '.sch-rail-section',
            '.sch-stat-card',
            '.sch-rail-section-title',
            '.sch-control-group',
            '.sch-search-shell',
            '.sch-palette-meta',
            '.sch-palette-count-label',
            '.sch-palette-list',
            '.sch-grid-topline',
            '.sch-grid-topline-start',
            '.sch-grid-topline-end',
            '.sch-grid-tag',
            '.sch-grid-week-label',
            '.sch-week-nav',
            '#scheduler-grid',
            '.sch-grid-empty',
            '.sch-empty-state',
            'h1, h2, h3, h4, h5, h6',
            'p',
            'strong',
            'span',
            'small',
            'label'
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
            '.sch-rail-signal-grid',
            '.sch-control-grid'
        ],
        classes: {
            active: 'admin-scheduler-assembly-active',
            ready: 'admin-scheduler-assembly-ready',
            target: 'kiu-admin-scheduler-assembly-target',
            outer: 'kiu-admin-scheduler-assembly-outer',
            inner: 'kiu-admin-scheduler-assembly-inner',
            structure: 'kiu-admin-scheduler-assembly-structure'
        },
        timing: {
            maxShellWaitMs: 1800,
            lateAssemblyGraceMs: 145,
            maxAssemblyWindowMs: 1650,
            maxTotalAssemblyMs: 2450
        }
    });

    window.__kiuAdminSchedulerLoadingMotion = motion;
    motion.install();
})();
