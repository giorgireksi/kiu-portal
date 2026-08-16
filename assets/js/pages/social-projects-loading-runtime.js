/* Social Projects workspace center assembly configuration. */
(function installSocialProjectsLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialProjectsLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const projectRegions = [
        '[data-social-projects-assembly-root="1"]',
        '.social-neo-workspace-shell',
        '.social-neo-workspace-shell--merged',
        '.social-neo-workspace-hero',
        '.social-neo-workspace-hero-head',
        '.social-neo-workspace-hero-actions',
        '.social-neo-workspace-hero-create-btn',
        '.social-neo-workspace-hero-stats',
        '.social-neo-workspace-hero-stat',
        '.social-project-detail-hero',
        '.social-project-detail-top',
        '.social-project-detail-copy',
        '.social-project-detail-actions',
        '.social-project-dashboard-strip',
        '.social-project-hero-grid',
        '.social-project-hero-tab',
        '.social-project-hero-tab-icon',
        '.social-project-hero-tab-copy',
        '.social-project-tab-panel',
        '.social-neo-workspace-hub-section',
        '.social-project-hub-discover',
        '.social-project-hub-search-row',
        '.social-project-hub-search',
        '.social-project-hub-attention',
        '.social-project-hub-scope',
        '.social-project-hub-filterbar',
        '.social-project-hub-filter-group',
        '.social-project-hub-filter-pills',
        '.social-project-hub-layout',
        '.social-project-hub-main',
        '.social-project-hub-main-head',
        '.social-project-hub-view-toggle',
        '.social-project-hub-grid',
        '.social-project-hub-list',
        '.social-project-hub-rail',
        '.social-project-hub-rail-card',
        '.social-project-hub-my-work',
        '.social-project-hub-my-work-row',
        '.social-project-hub-contribution',
        '.social-project-hub-contribution-stat',
        '.social-project-card-new',
        '.social-project-row',
        '.social-project-metric-card',
        '.social-project-ring-card',
        '.social-project-rich-panel',
        '.social-project-chart-card',
        '.social-project-health-card',
        '.social-project-roster-card',
        '.social-project-team-row',
        '.social-project-activity-item',
        '.social-project-workspace-chat',
        '.social-project-task-shell',
        '.social-project-task-shell-body',
        '.social-project-scroll-list',
        '.social-neo-section-head',
        '.social-neo-pill',
        '[class*="social-project-"]',
        '[class*="social-neo-workspace-"]',
        '.lux-soft-chrome',
        '.home-hover-chip',
        '[data-lux-observed-surface="1"]',
        'h1, h2, h3, h4, h5, h6',
        'p',
        'strong',
        'span',
        'small',
        'label',
        'li',
        'i'
    ];

    const controls = [
        'a',
        'button',
        'input',
        'select',
        'textarea',
        '[role="button"]',
        '[role="tab"]',
        '.lux-primary-btn',
        '.lux-secondary-btn',
        '.lux-ghost-btn',
        '.lux-picker-btn'
    ];

    function getCenter() {
        return document.querySelector('#social-neo-center-region');
    }

    function getProjectsSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')
            || (section.matches('.social-neo-card') && section.querySelector('.social-neo-empty-hero'))) {
            return null;
        }
        return section;
    }

    function isProjectsSurfaceReady() {
        return Boolean(getProjectsSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isProjectsSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-projects-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '.social-project-hub-search > i.fa-search',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: ['[data-social-projects-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-projects-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-projects-assembly-root="1"]',
            '.social-neo-workspace-shell',
            '.social-neo-workspace-hero',
            '.social-neo-workspace-hero-head',
            '.social-neo-workspace-hero-stats',
            '.social-project-detail-hero',
            '.social-project-detail-top',
            '.social-project-dashboard-strip',
            '.social-project-tab-panel',
            '.social-neo-workspace-hub-section',
            '.social-project-hub-discover',
            '.social-project-hub-layout',
            '.social-project-hub-main',
            '.social-project-hub-rail',
            '.social-project-hub-rail-card',
            '.social-project-hub-grid',
            '.social-project-hub-list',
            '.social-project-card-new',
            '.social-project-row',
            '.social-project-rich-panel',
            '.social-project-chart-card',
            '.social-project-task-shell',
            '.social-project-workspace-chat'
        ],
        flattenInnerTargets: true,
        granularSelector: projectRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-projects-assembly-active',
            ready: 'social-projects-assembly-ready',
            target: 'kiu-social-projects-assembly-target',
            outer: 'kiu-social-projects-assembly-outer',
            inner: 'kiu-social-projects-assembly-inner',
            structure: 'kiu-social-projects-assembly-structure',
            staging: 'is-social-projects-assembly-staging'
        },
        flightTiming: {
            outerDurationMs: 320,
            innerDurationMs: 220,
            innerMinDurationMs: 160,
            innerDepthStepMs: 12,
            outerStaggerMs: 16,
            innerStaggerMs: 8,
            outerMaxDelayMs: 48,
            innerMaxDelayMs: 64
        },
        timing: {
            maxShellWaitMs: 900,
            contentWaitMaxMs: 1200,
            lateAssemblyGraceMs: 100,
            maxAssemblyWindowMs: 1500,
            maxTotalAssemblyMs: 2000
        },
        rootStateDataset: 'socialProjectsAssemblyState'
    });

    const searchIconPendingClass = 'is-social-project-search-pending';
    let searchIconAnimation = null;
    let searchIconReadyTimer = 0;
    let pendingSearchIcon = null;

    function getProjectSearchIcon(center) {
        return center?.querySelector('.social-project-hub-search > i.fa-search, .social-project-hub-search i.fa-search');
    }

    function markProjectSearchIconPending(center) {
        const icon = getProjectSearchIcon(center);
        if (pendingSearchIcon && pendingSearchIcon !== icon) {
            pendingSearchIcon.classList.remove(searchIconPendingClass);
        }
        pendingSearchIcon = icon;
        icon?.classList.add(searchIconPendingClass);
        return icon;
    }

    function animateProjectSearchIcon(center) {
        if (searchIconReadyTimer) {
            window.clearTimeout(searchIconReadyTimer);
            searchIconReadyTimer = 0;
        }
        try { searchIconAnimation?.cancel?.(); } catch (error) {}
        const icon = getProjectSearchIcon(center);
        if (!icon) return;
        icon.classList.remove(searchIconPendingClass);
        pendingSearchIcon = null;
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
            || typeof icon.animate !== 'function') return;
        searchIconAnimation = icon.animate([
            {
                opacity: 0,
                transform: 'translate3d(-18px, -50%, 0) scale(.62) rotate(-14deg)'
            },
            {
                opacity: 1,
                transform: 'translate3d(3px, -50%, 0) scale(1.12) rotate(3deg)',
                offset: 0.68
            },
            {
                opacity: 1,
                transform: 'translate3d(0, -50%, 0) scale(1) rotate(0deg)'
            }
        ], {
            duration: 420,
            easing: 'cubic-bezier(.17,.84,.26,1)',
            fill: 'both'
        });
        searchIconAnimation.finished?.finally(() => {
            searchIconAnimation = null;
        });
    }

    function scheduleProjectSearchIcon(center) {
        markProjectSearchIconPending(center);
        const startedAt = Date.now();
        const waitForReady = () => {
            if (motion.getState?.().phase === 'ready' || Date.now() - startedAt >= 2600) {
                searchIconReadyTimer = 0;
                animateProjectSearchIcon(center);
                return;
            }
            searchIconReadyTimer = window.setTimeout(waitForReady, 16);
        };
        waitForReady();
    }

    function startCurrentProjectsMotion(center = getCenter(), options = {}) {
        if (typeof motion.install === 'function') motion.install();
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getProjectsSection(center);
        if (activePanel !== 'workspace' || !section) return false;
        const isNewSection = section.dataset.socialProjectsAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Observer (no force) only kickstarts idle → content. Dialog center remounts
        // must not re-enter assembly-active. queueSocialProjectsMotion passes { force: true }.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialProjectsAssemblyState;
        section.dataset.socialProjectsAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            const ok = motion.softRestart(center);
            if (ok) scheduleProjectSearchIcon(center);
            return ok;
        }
        const started = typeof motion.start === 'function' && motion.start(center);
        if (started) scheduleProjectSearchIcon(center);
        return started;
    }

    let observerFrame = 0;
    function observeRenderedProjects() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedProjects, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'projects') return;
            const run = () => {
                observerFrame = 0;
                startCurrentProjectsMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialProjectsLoadingObserver = observer;
    }

    window.__kiuSocialProjectsLoadingMotion = motion;
    window.__kiuStartSocialProjectsLoadingMotion = startCurrentProjectsMotion;
    if (typeof window.__kiuShouldBindSocialLoadingFallback !== 'function'
        || window.__kiuShouldBindSocialLoadingFallback('workspace')) {
        motion.install();
        observeRenderedProjects();
        window.setTimeout(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            startCurrentProjectsMotion();
        }, 0);
    }
})();
