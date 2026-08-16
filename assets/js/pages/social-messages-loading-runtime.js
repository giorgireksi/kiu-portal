/* Social Messages center assembly configuration. */
(function installSocialMessagesLoadingMotion() {
    'use strict';

    const createAssemblyLoadingMotion = window.__kiuCreateAssemblyLoadingMotion;
    if (typeof createAssemblyLoadingMotion !== 'function') {
        window.__kiuSocialMessagesLoadingMotionError = 'Shared assembly loading engine is unavailable.';
        return;
    }

    const messagesRegions = [
        '[data-social-messages-assembly-root="1"]',
        '.social-neo-messages',
        '.social-neo-messages__inbox',
        '.social-neo-messages__inbox-header',
        '.social-neo-messages__inbox-toolbar',
        '.social-neo-messages__inbox-title-block',
        '.social-neo-messages__section-title',
        '.social-neo-messages__inbox-subtitle',
        '.social-neo-messages__inbox-toolbar-actions',
        '.social-neo-messages__inbox-alerts-btn',
        '.social-neo-messages__inbox-tabs-row',
        '.social-neo-messages__inbox-filters',
        '.social-neo-messages__inbox-empty',
        '.social-neo-messages__inbox-empty-title',
        '.social-neo-messages__inbox-empty-copy',
        '.social-neo-messages__unread-badge',
        '.social-neo-chat-list',
        '.social-neo-chat-items',
        '.social-neo-chat-item',
        '.social-neo-messages__thread-shell',
        '.social-neo-messages__thread-chrome',
        '.social-neo-messages__thread-head',
        '.social-neo-thread-head',
        '.social-neo-thread-head__main',
        '.social-neo-thread-head__meta',
        '.social-neo-messages__thread-actions',
        '.social-neo-messages__thread-back',
        '.social-neo-messages__thread-scroll',
        '.social-neo-messages__thread-stream',
        '.social-neo-thread-messages',
        '.social-neo-messages__composer',
        '.social-neo-thread-compose',
        '.social-neo-msg-compose-form',
        '.social-neo-msg-compose-row',
        '.social-neo-message',
        '.social-neo-message__sender',
        '.social-neo-group-thread-toolbar',
        '.social-neo-search-bar',
        '.social-neo-call-card',
        '.social-neo-section-head',
        '.social-neo-pill',
        '.social-neo-badge-row',
        '.social-neo-empty',
        '.social-neo-person',
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

    function getMessagesSection(center = getCenter()) {
        const section = center?.firstElementChild;
        if (!section
            || !section.matches('.social-neo-messages')
            || section.matches('.social-neo-module-loading, [aria-busy="true"]')
            || section.querySelector('[aria-busy="true"]')) {
            return null;
        }
        return section;
    }

    function isMessagesSurfaceReady() {
        return Boolean(getMessagesSection());
    }

    const motion = createAssemblyLoadingMotion({
        isRoute: () => document.body?.classList.contains('lux-route-social')
            || document.documentElement?.dataset?.luxPage === 'social'
            || /(?:^|\/)social\.html$/i.test(window.location.pathname || ''),
        getPageRoot: getCenter,
        getObserverRoot: getCenter,
        isContentReady: isMessagesSurfaceReady,
        autoStart: false,
        animateLateAfterReady: true,
        autoReplayLateMutations: false,
        unlimitedLateReplay: true,
        lateReplaySelector: ['[data-social-messages-assembly-root="1"]'],
        hiddenSelector: [
            '[hidden]',
            '[aria-hidden="true"]:not(i)',
            'template',
            '.lux-picker-panel',
            '.lux-droplist-panel',
            '[role="dialog"]',
            '#social-neo-overlay-portal',
            '#lux-glass-dialog-region',
            '#social-neo-call-overlay',
            '#mobile-action-sheet'
        ],
        outerSelectors: ['[data-social-messages-assembly-root="1"]'],
        outerFlightSelector: ['[data-social-messages-assembly-root="1"]'],
        hierarchySelector: [
            '[data-social-messages-assembly-root="1"]',
            '.social-neo-messages',
            '.social-neo-messages__inbox',
            '.social-neo-messages__inbox-header',
            '.social-neo-chat-list',
            '.social-neo-messages__thread-shell',
            '.social-neo-messages__thread-chrome',
            '.social-neo-message'
        ],
        flattenInnerTargets: true,
        granularSelector: messagesRegions,
        controlSelector: controls,
        transformSafeSelector: [],
        structureSelector: [],
        classes: {
            active: 'social-messages-assembly-active',
            ready: 'social-messages-assembly-ready',
            target: 'kiu-social-messages-assembly-target',
            outer: 'kiu-social-messages-assembly-outer',
            inner: 'kiu-social-messages-assembly-inner',
            structure: 'kiu-social-messages-assembly-structure',
            staging: 'is-social-messages-assembly-staging'
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
        rootStateDataset: 'socialMessagesAssemblyState'
    });

    function startCurrentMessagesMotion(center = getCenter(), options = {}) {
        const force = Boolean(options?.force);
        const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
        const section = getMessagesSection(center);
        if (activePanel !== 'messages' || !section) return false;
        const isNewSection = section.dataset.socialMessagesAssemblyRoot !== '1';
        const phase = motion.getState?.().phase;
        // Exposé gate: force must replay after leaving other sections even when
        // phase stayed `ready` and/or the shell root attr lingered.
        if (!(phase === 'idle' || force)) return false;
        if (center?.dataset) delete center.dataset.socialMessagesAssemblyState;
        section.dataset.socialMessagesAssemblyRoot = '1';
        if (force && phase && phase !== 'idle' && typeof motion.softRestart === 'function') {
            return motion.softRestart(center);
        }
        return typeof motion.start === 'function' && motion.start(center);
    }

    let observerFrame = 0;
    function observeRenderedMessages() {
        const page = document.querySelector('#page-social');
        if (!page || typeof MutationObserver !== 'function') {
            window.setTimeout(observeRenderedMessages, 64);
            return;
        }
        const observer = new MutationObserver(() => {
            if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
            if (observerFrame) return;
            const activePanel = document.querySelector('#social-neo-root')?.dataset?.panel;
            if (activePanel && activePanel !== 'messages') return;
            const run = () => {
                observerFrame = 0;
                startCurrentMessagesMotion(getCenter());
            };
            observerFrame = typeof window.requestAnimationFrame === 'function'
                ? window.requestAnimationFrame(run)
                : window.setTimeout(run, 0);
        });
        observer.observe(page, { childList: true, subtree: true });
        window.__kiuSocialMessagesLoadingObserver = observer;
    }

    window.__kiuSocialMessagesLoadingMotion = motion;
    window.__kiuStartSocialMessagesLoadingMotion = startCurrentMessagesMotion;
    motion.install();
    observeRenderedMessages();
    window.setTimeout(() => {
        if (window.__kiuSocialAssemblyMotionOwner === 'render-pipeline') return;
        startCurrentMessagesMotion();
    }, 0);
})();
