/* Timetable assembly configuration. The lifecycle is shared across routes. */
(function installTimetableLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') return;

    const hardwareConcurrency = Number(window.navigator?.hardwareConcurrency || 8);
    const deviceMemory = Number(window.navigator?.deviceMemory || 8);
    const lowEndTimetableDevice = hardwareConcurrency <= 4 || deviceMemory <= 4;
    if (lowEndTimetableDevice) document.body?.classList.add('timetable-low-end');
    const granularSelector = lowEndTimetableDevice
        ? ['#timetable-master-container']
        : [
            '.lux-timetable-command-head',
            '.lux-timetable-command-title',
            '.lux-timetable-command-note',
            '.lux-timetable-command-toggle',
            '.lux-timetable-command-collapse',
            '.lux-timetable-command-grid',
            '.lux-timetable-controls',
            '.lux-timetable-view-row',
            '.lux-timetable-view-switcher',
            '.schedule-toolbar',
            '.lux-timetable-week-nav',
            '.lux-timetable-week-label',
            '.lux-timetable-overview-row',
            '.lux-timetable-chip',
            '.lux-timetable-command-focus',
            '.lux-timetable-focus-head',
            '.lux-timetable-focus-kicker',
            '.lux-timetable-focus-time',
            '.lux-timetable-focus-body',
            '.lux-timetable-focus-title',
            '.lux-timetable-focus-copy',
            '.lux-timetable-focus-facts',
            '.lux-timetable-focus-meta',
            '.lux-timetable-stage-head',
            '.lux-timetable-stage-title',
            '.lux-timetable-stage-status',
            '#timetable-master-container',
            '[class*="sch-"]',
            'h1, h2, h3, h4, h5, h6',
            'p',
            'strong',
            'span',
            'small',
            'label',
            'li'
        ];

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-timetable')
            || document.documentElement?.dataset?.luxPage === 'timetable'
            || /(?:^|\/)timetable\.html$/i.test(window.location.pathname || ''),
        getPageRoot: () => document.querySelector('#page-timetable .lux-timetable-page'),
        observerSelector: '#page-timetable',
        rootStateDataset: 'kiuTimetableAssemblyState',
        hiddenSelector: '[hidden], [aria-hidden="true"], template, #mobile-action-sheet',
        outerSelectors: [
            '.lux-timetable-command',
            '.lux-timetable-stage'
        ],
        granularSelector,
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
            '.lux-timetable-command-collapse',
            '.lux-timetable-command-grid'
        ],
        classes: {
            active: 'timetable-assembly-active',
            ready: 'timetable-assembly-ready',
            target: 'kiu-timetable-assembly-target',
            outer: 'kiu-timetable-assembly-outer',
            inner: 'kiu-timetable-assembly-inner',
            structure: 'kiu-timetable-assembly-structure'
        },
        disableBlur: lowEndTimetableDevice,
        timing: {
            maxShellWaitMs: lowEndTimetableDevice ? 700 : 1800,
            lateAssemblyGraceMs: lowEndTimetableDevice ? 100 : 145,
            maxAssemblyWindowMs: lowEndTimetableDevice ? 1000 : 1650,
            maxTotalAssemblyMs: lowEndTimetableDevice ? 1400 : 2450
        }
    });

    window.__kiuTimetableLoadingMotion = motion;
    motion.install();
})();
