/**
 * KIU Theme Primer — runs synchronously in <head> BEFORE paint.
 * Prevents FOUC by applying saved theme, palette, and shell state instantly.
 * Also guarantees page becomes visible even if other JS fails to load.
 * Must be loaded WITHOUT defer/async: <script src="assets/js/theme-primer.js"></script>
 */
(function kiuThemePrimer() {
    'use strict';

    // Assembly loading is readiness-gated but intentionally motion-free by default.
    // Set this to false before the primer/shared runtime loads to restore legacy motion.
    window.__KIU_INSTANT_ASSEMBLY_LOADING = window.__KIU_INSTANT_ASSEMBLY_LOADING !== false;

    var root = document.documentElement;
    var instantLoadingEnabled = window.__KIU_INSTANT_ASSEMBLY_LOADING !== false;
    if (instantLoadingEnabled) {
        root.classList.add('kiu-instant-loading');
        var instantLoadingStyle = document.createElement('style');
        instantLoadingStyle.id = 'kiu-instant-loading-style';
        instantLoadingStyle.textContent = `
            html.kiu-instant-loading .fa-spin,
            html.kiu-instant-loading [class*="loading"],
            html.kiu-instant-loading [class*="loading"] *,
            html.kiu-instant-loading [class*="skeleton"],
            html.kiu-instant-loading [class*="skeleton"] * {
                animation: none !important;
                animation-delay: 0s !important;
            }
        `;
        (document.head || root).appendChild(instantLoadingStyle);
    }
    // Localization is an enhancement, not a prerequisite for rendering. The
    // route pages are authored in English, so provide cheap fallbacks while
    // the large repair/translation table waits for idle time.
    window.cleanupEncodingArtifacts = window.cleanupEncodingArtifacts || (value => String(value ?? ''));
    window.toEnglishText = window.toEnglishText || (value => String(value ?? ''));
    window.localizeHtmlMarkup = window.localizeHtmlMarkup || (value => String(value ?? ''));
    function scheduleIdleEnglishLocalization() {
        if (window.__kiuEnglishLocalizationDeferredScheduled) return;
        window.__kiuEnglishLocalizationDeferredScheduled = true;
        const load = () => {
            document.querySelectorAll('script[data-kiu-idle-src]').forEach((placeholder) => {
                const src = placeholder.getAttribute('data-kiu-idle-src');
                if (!src || document.querySelector(`script[data-kiu-localization-loaded="${src}"]`)) return;
                const script = document.createElement('script');
                script.src = src;
                script.dataset.kiuLocalizationLoaded = src;
                document.head.appendChild(script);
                placeholder.remove();
            });
        };
        const schedule = window.requestIdleCallback;
        if (typeof schedule === 'function') {
            schedule(load, { timeout: 4500 });
        } else {
            window.setTimeout(load, 1800);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', scheduleIdleEnglishLocalization, { once: true });
    } else {
        scheduleIdleEnglishLocalization();
    }

    var validShellRoles = ['student', 'professor', 'ta', 'admin', 'student_service'];
    var PORTAL_CACHE_RESET_KEY = 'KIU_PORTAL_CACHE_RESET_VERSION';
    var PORTAL_CACHE_RESET_VERSION = '20260609-bootguard1';
    var LUXURY_VISUAL_DEFAULTS_VERSION_KEY = 'KIU_LUXURY_VISUAL_DEFAULTS_VERSION';
    // Keep in sync with FORCED_LUXURY_VISUAL_DEFAULTS_VERSION in index-luxury.js.
    var LUXURY_VISUAL_DEFAULTS_VERSION = '20260816-opacity70-v3';
    var DEFAULT_LUXURY_THEME_MODE = 'dark';
    var DEFAULT_LUXURY_SURFACE_TRANSPARENCY = '70';
    var DEFAULT_LUXURY_PALETTE = 'ocean-teal';

    function parseJson(raw) {
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (e) {
            return null;
        }
    }

    function normalizeRole(value) {
        var role = String(value || '').trim().toLowerCase();
        return validShellRoles.indexOf(role) !== -1 ? role : '';
    }

    function getRequestedShellRole() {
        try {
            var params = new URLSearchParams(window.location.search || '');
            var requestedRole = normalizeRole(params.get('view'));
            if (requestedRole) return requestedRole;
        } catch (e) {}
        try {
            var pendingRole = normalizeRole(localStorage.getItem('KIU_PENDING_ROLE_SWITCH_ROLE'));
            if (pendingRole) return pendingRole;
        } catch (e) {}
        try {
            var storedRole = normalizeRole(localStorage.getItem('currentUserRole'));
            if (storedRole) return storedRole;
        } catch (e) {}
        try {
            var path = String(window.location.pathname || '');
            if (path.endsWith('student-service.html')) return 'student_service';
        } catch (e) {}
        return 'student';
    }

    function getShellHomeTitle(role) {
        switch (role) {
            case 'professor': return 'KIU - Professor View';
            case 'ta': return 'KIU - Teaching Assistant View';
            case 'admin': return 'KIU - Admin Dashboard';
            case 'student_service': return 'KIU - Student Service';
            default: return 'KIU - Student Portal';
        }
    }

    function appendLateStyle(styleId, cssText) {
        if (!document.head) return;
        var styleEl = document.getElementById(styleId);
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
        }
        styleEl.media = 'all';
        styleEl.textContent = cssText || ':root{}';
        document.head.appendChild(styleEl);
    }

    root.classList.add('kiu-shell-loading');
    root.classList.remove('kiu-shell-ready');

    var shellLoadState = window.__kiuShellLoadState = window.__kiuShellLoadState || {
        phase: 'loading',
        stage: 'background',
        degraded: false,
        startedAt: Date.now()
    };
    shellLoadState.phase = 'loading';
    shellLoadState.stage = 'background';
    shellLoadState.degraded = false;
    shellLoadState.startedAt = shellLoadState.startedAt || Date.now();
    function setShellLoadState(next) {
        var patch = next || {};
        Object.keys(patch).forEach(function (key) {
            shellLoadState[key] = patch[key];
        });
        if (shellLoadState.phase) root.dataset.kiuLoadPhase = shellLoadState.phase;
        if (shellLoadState.stage) root.dataset.kiuLoadStage = shellLoadState.stage;
        root.dataset.kiuLoadDegraded = shellLoadState.degraded ? '1' : '0';
        if (document.body) {
            if (shellLoadState.phase) document.body.dataset.kiuLoadPhase = shellLoadState.phase;
            if (shellLoadState.stage) document.body.dataset.kiuLoadStage = shellLoadState.stage;
            document.body.dataset.kiuLoadDegraded = shellLoadState.degraded ? '1' : '0';
        }
        return shellLoadState;
    }
    window.__kiuSetShellLoadState = setShellLoadState;
    setShellLoadState(shellLoadState);

    appendLateStyle('kiu-shell-boot-guard', '' +
        'html.kiu-shell-loading{' +
            'background:var(--lux-shell-background,var(--kiu-loading-background,#08120f))!important;' +
            'color-scheme:dark;' +
        '}' +
        'html.kiu-shell-loading.lux-light-mode{' +
            'background:var(--lux-shell-background,var(--kiu-loading-background-light,#f3efe7))!important;' +
            'color-scheme:light;' +
        '}' +
        'html.kiu-shell-loading body.kiu-shell-loading{' +
            'background:var(--lux-shell-background,var(--lux-bg,#070910))!important;' +
            'overflow-x:hidden;' +
        '}' +
        'html.kiu-shell-loading.lux-light-mode body.kiu-shell-loading,' +
        'html.kiu-shell-loading body.lux-light-mode.kiu-shell-loading{' +
            'background:var(--lux-shell-background,#f5f0e8)!important;' +
        '}' +
        'body.kiu-shell-loading::before{' +
            'content:"";' +
            'position:fixed;' +
            'inset:0;' +
            'z-index:2147483000;' +
            'pointer-events:none;' +
            'backface-visibility:hidden;' +
            'transform:translateZ(0);' +
            'background:var(--kiu-loading-background,' +
                'radial-gradient(circle at 22% 18%,rgba(15,118,110,.16),transparent 36%),' +
                'radial-gradient(circle at 78% 20%,rgba(184,134,63,.12),transparent 34%),' +
                'linear-gradient(135deg,#07110f 0%,#0b111c 58%,#07120f 100%))!important;' +
            'opacity:1!important;' +
            'transition:none!important;' +
        '}' +
        'html.lux-light-mode body.kiu-shell-loading::before,' +
        'body.lux-light-mode.kiu-shell-loading::before{' +
            'background:var(--kiu-loading-background-light,' +
                'radial-gradient(circle at 20% 18%,rgba(28,137,129,.14),transparent 35%),' +
                'radial-gradient(circle at 82% 16%,rgba(184,134,63,.14),transparent 32%),' +
                'linear-gradient(135deg,#f8f5ee 0%,#f1ede5 58%,#eef6f5 100%))!important;' +
        '}' +
        'body.kiu-shell-loading #app-content,' +
        'body.kiu-shell-loading #lux-shell,' +
        'body.kiu-shell-loading #lux-topbar,' +
        'body.kiu-shell-loading #mobile-bottom-nav,' +
        'body.kiu-shell-loading #mobile-action-sheet{' +
            'opacity:0!important;' +
            'pointer-events:none!important;' +
        '}' +
        'html.kiu-shell-loading body.kiu-shell-loading > :not(script):not(style){' +
            'visibility:hidden!important;' +
            'opacity:0!important;' +
            'pointer-events:none!important;' +
        '}' +
        // Legacy role nav stubs are still kept for compatibility lookups, but
        // the unified shell owns navigation and must be the only painted nav.
        'body.lux-unified-shell > #top-nav,' +
        'body.lux-unified-shell > #prof-nav,' +
        'body.lux-unified-shell > #admin-nav,' +
        'body.lux-unified-shell > #service-nav{' +
            'display:none!important;' +
        '}' +
        // The root receives the collapsed state before <body> exists. Mirror
        // the body-scoped drawer rule so nav labels cannot flash at top-left
        // while the shell is being created.
        'html.lux-sidebar-collapsed #lux-shell{' +
            'transform:translate3d(calc(-100% - var(--lux-sidebar-gutter,12px) - 12px),0,0) scale(var(--lux-shell-scale-closed, .98));' +
            'opacity:0!important;' +
            'pointer-events:none!important;' +
        '}' +
        'html.kiu-shell-ready body:not(.kiu-shell-loading) #app-content,' +
        'html.kiu-shell-ready body:not(.kiu-shell-loading) #lux-shell,' +
        'html.kiu-shell-ready body:not(.kiu-shell-loading) #lux-topbar{' +
            'opacity:1;' +
            'transition:opacity .12s ease-out;' +
        '}' +
        // Instant mode removes loading motion, not readiness gating. Keep the
        // route DOM behind one palette-matched static veil until it is ready.
        'html.kiu-instant-loading body.kiu-shell-loading::before{' +
            'display:block!important;' +
            'background:var(--lux-shell-background,var(--kiu-loading-background,#08120f))!important;' +
        '}' +
        'html.kiu-instant-loading body.kiu-shell-loading::after{' +
            'content:"Loading workspace";' +
            'position:fixed;' +
            'left:50%;' +
            'bottom:20px;' +
            'z-index:2147483001;' +
            'transform:translateX(-50%);' +
            'padding:7px 12px;' +
            'border:1px solid color-mix(in srgb,var(--lux-accent,#26a69a) 35%,transparent);' +
            'border-radius:999px;' +
            'background:color-mix(in srgb,var(--lux-panel-surface,#0b1520) 88%,transparent);' +
            'color:var(--lux-text-muted,rgba(248,250,252,.72));' +
            'font-size:10px;' +
            'letter-spacing:.12em;' +
            'text-transform:uppercase;' +
            'pointer-events:none;' +
            'animation:none!important;' +
        '}' +
        'html.kiu-instant-loading[data-kiu-load-phase="degraded"]::after{' +
            'content:none!important;' +
            'display:none!important;' +
            'animation:none!important;' +
        '}'
    );

    function hasCurrentLuxuryVisualDefaultsVersion() {
        try {
            return String(localStorage.getItem(LUXURY_VISUAL_DEFAULTS_VERSION_KEY) || '').trim() === LUXURY_VISUAL_DEFAULTS_VERSION;
        } catch (e) {
            return false;
        }
    }

    function resolveScopedVisuals() {
        var persistentState = null;
        var authState = null;
        var storedFaculty = '';
        var storedRole = '';
        try {
            authState = parseJson(sessionStorage.getItem('KIU_TAB_AUTH_STATE') || localStorage.getItem('KIU_AUTH_STATE'));
            var primerUserId = String(authState && authState.id || sessionStorage.getItem('KIU_ACTIVE_SESSION_USER_ID') || '').trim();
            persistentState = parseJson(localStorage.getItem(primerUserId ? `KIU_PERSISTENT_STATE::${primerUserId}` : 'KIU_PERSISTENT_STATE') || localStorage.getItem('KIU_PERSISTENT_STATE'));
            storedFaculty = String(sessionStorage.getItem('KIU_TAB_CURRENT_FACULTY') || localStorage.getItem('currentFaculty') || '').trim().toUpperCase();
            storedRole = normalizeRole(sessionStorage.getItem('KIU_TAB_CURRENT_ROLE') || localStorage.getItem('currentUserRole'));
        } catch (e) {}

        var authRole = normalizeRole(authState && authState.role);
        var role = storedRole || authRole || 'student';
        var faculty = storedFaculty
            || String(
                (authState && (authState.facultyCode || authState.faculty))
                || ''
            ).trim().toUpperCase()
            || 'ECON';
        var userId = String(
            (authState && (authState.id || authState.email))
            || sessionStorage.getItem('KIU_ACTIVE_SESSION_USER_ID')
            || (persistentState && persistentState.auth && persistentState.auth.activeUserId)
            || ''
        ).trim();
        var visualsByUser = userId && persistentState && persistentState.homeDashboardPreferencesByUser
            ? persistentState.homeDashboardPreferencesByUser[userId]
            : null;
        var scopeKey = role + '::' + faculty;
        return (visualsByUser && visualsByUser.visualsByScope && visualsByUser.visualsByScope[scopeKey])
            || (visualsByUser && visualsByUser.visuals)
            || {};
    }

    function resolveScopedThemeMode() {
        var hasCurrentDefaults = hasCurrentLuxuryVisualDefaultsVersion();
        var savedMode = '';
        if (hasCurrentDefaults) {
            try { savedMode = String(localStorage.getItem('kiuLuxuryThemeMode') || '').trim().toLowerCase(); } catch (e) {}
        }
        if (savedMode === 'light' || savedMode === 'dark') return savedMode;
        if (!hasCurrentDefaults) return DEFAULT_LUXURY_THEME_MODE;
        var scopedTheme = String(
            resolveScopedVisuals().themeMode
            || ''
        ).trim().toLowerCase();
        return scopedTheme === 'light' ? 'light' : DEFAULT_LUXURY_THEME_MODE;
    }

    function applyLightModeRootTokens(mode) {
        var nextMode = mode === 'light' ? 'light' : 'dark';
        if (nextMode === 'light') {
            root.style.setProperty('--lux-bg', '#efebe4');
            root.style.setProperty('--lux-bg-soft', '#f7f3ec');
            root.style.setProperty('--lux-surface', '#ffffff');
            root.style.setProperty('--lux-surface-2', '#f5f1ea');
            root.style.setProperty('--lux-surface-3', '#ece6db');
            root.style.setProperty('--lux-border', 'rgba(48,34,22,0.10)');
            root.style.setProperty('--lux-border-strong', 'rgba(48,34,22,0.18)');
            root.style.setProperty('--lux-text', '#201912');
            root.style.setProperty('--lux-text-muted', 'rgba(32,25,18,0.66)');
            root.style.setProperty('--lux-text-soft', 'rgba(32,25,18,0.36)');
            root.style.setProperty('--lux-shadow', '0 24px 54px rgba(62,42,20,0.12)');
            return;
        }
        [
            '--lux-bg',
            '--lux-bg-soft',
            '--lux-surface',
            '--lux-surface-2',
            '--lux-surface-3',
            '--lux-border',
            '--lux-border-strong',
            '--lux-text',
            '--lux-text-muted',
            '--lux-text-soft',
            '--lux-shadow'
        ].forEach(function (name) {
            root.style.removeProperty(name);
        });
    }

    function isLoopbackPortalOrigin() {
        try {
            var protocol = String(window.location && window.location.protocol || '').trim().toLowerCase();
            var host = String(window.location && window.location.hostname || '').trim().toLowerCase();
            return (protocol === 'http:' || protocol === 'https:')
                && (host === '127.0.0.1' || host === 'localhost');
        } catch (e) {
            return false;
        }
    }

    function maybeResetStaleLocalPortalWorker() {
        if (!isLoopbackPortalOrigin()) return;
        if (!navigator.serviceWorker || !navigator.serviceWorker.controller) return;

        var seenVersion = '';
        var resetMarker = 'KIU_PORTAL_LOCAL_SW_RESET_' + PORTAL_CACHE_RESET_VERSION;
        var alreadyReset = '';

        try { seenVersion = String(localStorage.getItem(PORTAL_CACHE_RESET_KEY) || '').trim(); } catch (e) {}
        try { alreadyReset = String(sessionStorage.getItem(resetMarker) || '').trim(); } catch (e) {}

        if (seenVersion === PORTAL_CACHE_RESET_VERSION || alreadyReset === '1') return;

        try { sessionStorage.setItem(resetMarker, '1'); } catch (e) {}

        var unregisterPromise = Promise.resolve();
        if (typeof navigator.serviceWorker.getRegistrations === 'function') {
            unregisterPromise = navigator.serviceWorker.getRegistrations()
                .then(function (registrations) {
                    return Promise.all((registrations || []).map(function (registration) {
                        try {
                            return registration.unregister();
                        } catch (error) {
                            return false;
                        }
                    }));
                })
                .catch(function () { return null; });
        }

        var cachePromise = Promise.resolve();
        if (typeof caches !== 'undefined' && caches && typeof caches.keys === 'function') {
            cachePromise = caches.keys()
                .then(function (keys) {
                    return Promise.all((keys || [])
                        .filter(function (key) { return String(key || '').indexOf('kiu-portal-shell-') === 0; })
                        .map(function (key) { return caches.delete(key); }));
                })
                .catch(function () { return null; });
        }

        Promise.all([unregisterPromise, cachePromise])
            .catch(function () { return null; })
            .then(function () {
                try { localStorage.setItem(PORTAL_CACHE_RESET_KEY, PORTAL_CACHE_RESET_VERSION); } catch (e) {}
                try { window.location.reload(); } catch (e) {}
            });
    }

    window.__kiuThemePrimerAppendLateStyle = appendLateStyle;
    window.__kiuApplyThemePrimerLightModeTokens = applyLightModeRootTokens;
    window.__kiuResolveScopedThemeMode = resolveScopedThemeMode;

    maybeResetStaleLocalPortalWorker();

    function joinScopedSelectors(shell, selectors) {
        return selectors.map(function (selector) {
            return shell + ' ' + selector;
        }).join(',');
    }

    function joinHighTransparencySelectors(bodySelector, selectors) {
        return selectors.map(function (selector) {
            return 'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + bodySelector + ' ' + selector;
        }).join(',');
    }

    function getHighTransparencyTextResetSelectors() {
        return [
            '.lux-card-head',
            '.lux-card-title',
            '.lux-card-meta',
            '.lux-builder-copy',
            '.lux-card-body',
            '.lux-panel-body',
            '.lux-grid-widget-body',
            '.lux-widget-container',
            '.lux-inline-meta',
            '.lux-card-actions',
            '.lux-page-kicker',
            '.lux-person-head',
            '.lux-admin-ops-head',
            '.lux-timetable-command-head',
            '.lux-timetable-insight-grid',
            '.lux-timetable-insight-label',
            '.lux-timetable-insight-value',
            '.lux-timetable-insight-list',
            '.lux-timetable-stage-head',
            '.lux-timetable-hero-main',
            '[class*="-head"]',
            '[class*="-meta"]',
            '[class*="-title"]',
            '[class*="-copy"]',
            '[class*="-label"]',
            '[class*="-kicker"]'
        ];
    }

    function getHighTransparencyTextResetCss(bodySelector) {
        return joinHighTransparencySelectors(bodySelector, getHighTransparencyTextResetSelectors()) + '{' +
            'background:transparent!important;' +
            'background-image:none!important;' +
            'box-shadow:none!important;' +
            'backdrop-filter:none!important;' +
            '-webkit-backdrop-filter:none!important;' +
        '}';
    }

    function getHighTransparencySurfaceSelectors() {
        return [
            '.lux-card',
            '.lux-panel',
            '.lux-subcard',
            '.lux-hero',
            '.lux-stat',
            '.lux-stat-card',
                        '.lux-grid-widget',
            '.lux-admin-op-card',
            '.lux-builder-card',
            '.lux-builder-section',
            '.lux-dashboard-section',
            '.lux-page-shell',
            '.surface-card',
            '.content-box',
            '.kiu-card',
            '.page-card',
            '.section-card',
            '.panel-card',
            '.dashboard-card',
            '.tabs-container',
            '.modal-content',
            '.page-hero',
            '.lux-modern-surface',
            '.lux-modern-table',
            '.lux-utility-panel',
            '.lux-person-card',
            '.lux-stack',
            /* registration soft shells owned by shared panel tokens / lux-controls — not flat wash */
            '.sch-sidebar',
            '.sch-grid-shell',
            '.sch-modal',
            '.palette-card',
            '.sch-stat-card',
            '.sch-grid-tag',
            '.sch-empty-state',
            '.sch-grid-empty',
            '.lux-lms-group-card',
            '.lms-route-panel',
            '.lms-route-hero',
            '.lms-clean-hero',
            '.lux-faculty-command-deck',
            '.lux-fg-ops-panel',
            '.lux-fg-ops-tile',
            '.lux-timetable-command',
            '.lux-timetable-insight',
            '.lux-timetable-stage',
            '.lux-timetable-canvas',
            '.lux-timetable-controls',
            '.lux-timetable-filters',
            '.filter-shell',
            '.lux-timetable-hero-focus',
            '.lux-focus-panel',
            '.lux-soft-chrome:not(.lux-home-merged)',
            '.lms-hero-focus',
            '.social-comment-card',
            '.social-notif-item',
            '.social-story-card',
            '.social-detail-card',
            '.social-file-preview',
            '.social-poll-option',
            '.social-empty',
            '.social-shared-card',
            '.social-neo-card',
            '.social-neo-alert',
            '.social-neo-chat-item',
            '.social-neo-directory-item',
            '.social-neo-message',
            '.social-neo-empty',
            '.social-neo-flash',
            '.social-neo-stat-grid > div',
            '.portal-msg-page-top',
            '.portal-msg-panel',
            '.portal-msg-group-modal',
            '.admin-hero',
            '.adlib-hero'
        ];
    }

    function getHighTransparencySurfaceCss(bodySelector, backgroundValue) {
        return joinHighTransparencySelectors(bodySelector, getHighTransparencySurfaceSelectors()) + '{' +
            'background:' + backgroundValue + '!important;' +
        '}';
    }

    function getFlatSurfaceOverrideCss() {
        var shell = 'html body.lux-unified-shell.lux-unified-shell:not(.lux-route-students-admin)';
        var clearSurfaces = [
            '.page-hero',
            '.portal-msg-page-top',
            /* do NOT clear focus/soft shells — washes registration + shared focus panels */
            '.lms-route-hero',
            '.lms-clean-hero',
            '.adlib-hero'
        ];
        var softSurfaces = [
            '.content-box',
            '.surface-card',
            '.portal-msg-panel',
            '.portal-msg-group-modal',
            /* filter-shell / soft-chrome / focus: route CSS owns density (reg + timetable) */
            '.lux-faculty-command-deck',
            '.lux-fg-ops-panel',
            '.lux-fg-ops-tile',
            '.lms-route-panel',
            '.course-card',
            '.accordion-item',
            '.file-item',
            '.tabs-container'
        ];
        var pseudoSurfaces = clearSurfaces.concat(softSurfaces);
        return '' +
            joinScopedSelectors(shell, clearSurfaces) + '{' +
                'background:transparent!important;' +
                'border-color:transparent!important;' +
                'box-shadow:none!important;' +
                'backdrop-filter:none!important;' +
                '-webkit-backdrop-filter:none!important;' +
            '}' +
            joinScopedSelectors(shell, softSurfaces) + '{' +
                'background:rgba(var(--lux-glass-tint-rgb, 16, 23, 38), 0.02)!important;' +
                'box-shadow:none!important;' +
                'backdrop-filter:none!important;' +
                '-webkit-backdrop-filter:none!important;' +
                'border:1px solid var(--lux-border)!important;' +
            '}' +
            joinScopedSelectors(shell, pseudoSurfaces.map(function (selector) { return selector + '::before'; }).concat(
                pseudoSurfaces.map(function (selector) { return selector + '::after'; })
            )) + '{' +
                'content:none!important;' +
                'display:none!important;' +
                'background:none!important;' +
            '}' +
            'html.lux-light-mode ' + joinScopedSelectors('body.lux-unified-shell.lux-unified-shell:not(.lux-route-students-admin)', softSurfaces) + ',' +
            'body.lux-light-mode.lux-unified-shell.lux-unified-shell:not(.lux-route-students-admin) ' + softSurfaces.join(',body.lux-light-mode.lux-unified-shell.lux-unified-shell:not(.lux-route-students-admin) ') + '{' +
                'background:rgba(255,255,255,0.06)!important;' +
            '}';
    }

    function shouldSkipFlatSurfaceOverrides() {
        if (!document.body) return false;
        // Full-paint portals (incl. bare) use shared glass — skip flat wash.
        if (document.body.classList.contains('lux-full-paint')) return true;
        return document.body.classList.contains('lux-route-timetable')
            || document.body.classList.contains('lux-route-registration')
            || document.body.classList.contains('lux-route-lms')
            || document.body.classList.contains('lux-route-admin-library')
            || document.body.classList.contains('lux-entry-admin-library')
            || document.body.classList.contains('lux-route-admin-orders')
            || document.body.classList.contains('lux-entry-admin-orders')
            || document.body.classList.contains('lux-route-staff');
    }

    function applyFlatSurfaceOverrides() {
        if (shouldSkipFlatSurfaceOverrides()) {
            /* Drop leftover flat wash from a previous route / early inject */
            var stale = document.getElementById('lux-flat-surface-overrides');
            if (stale) {
                try { stale.textContent = ':root{}'; } catch (e) {}
            }
            return;
        }
        appendLateStyle('lux-flat-surface-overrides', getFlatSurfaceOverrideCss());
    }

    // 1. Theme mode (dark/light) — read from localStorage
    var savedMode = resolveScopedThemeMode();
    if (savedMode === 'light') {
        root.classList.add('lux-light-mode');
        root.dataset.luxThemeMode = 'light';
        applyLightModeRootTokens('light');
    } else {
        root.dataset.luxThemeMode = 'dark';
        applyLightModeRootTokens('dark');
    }

    // 1b. Surface transparency — set early so CSS can render correct backgrounds
    var hasCurrentVisualDefaults = hasCurrentLuxuryVisualDefaultsVersion();
    var scopedVisuals = hasCurrentVisualDefaults ? resolveScopedVisuals() : {};
    var savedTransparency = '';
    if (hasCurrentVisualDefaults) {
        try { savedTransparency = localStorage.getItem('kiuLuxurySurfaceTransparency') || ''; } catch (e) {}
    }
    if (!savedTransparency && scopedVisuals && scopedVisuals.surfaceTransparency != null) {
        savedTransparency = String(scopedVisuals.surfaceTransparency || '').trim();
    }
    if (!savedTransparency) savedTransparency = DEFAULT_LUXURY_SURFACE_TRANSPARENCY;
    var backgroundAnimationsEnabled = true;
    if (hasCurrentVisualDefaults) {
        try {
            var savedBackgroundAnimations = String(localStorage.getItem('kiuLuxuryBackgroundAnimationsEnabled') || '').trim().toLowerCase();
            if (savedBackgroundAnimations) {
                backgroundAnimationsEnabled = !(savedBackgroundAnimations === '0' || savedBackgroundAnimations === 'false' || savedBackgroundAnimations === 'off');
            } else if (typeof scopedVisuals.backgroundAnimationsEnabled === 'boolean') {
                backgroundAnimationsEnabled = scopedVisuals.backgroundAnimationsEnabled;
            }
        } catch (e) {}
    } else if (typeof scopedVisuals.backgroundAnimationsEnabled === 'boolean') {
        backgroundAnimationsEnabled = scopedVisuals.backgroundAnimationsEnabled;
    }
    var staticBackgroundFill = 'colored';
    try {
        var savedStaticBackgroundFill = String(localStorage.getItem('kiuLuxuryStaticBackgroundFill') || '').trim().toLowerCase();
        if (savedStaticBackgroundFill) {
            staticBackgroundFill = savedStaticBackgroundFill;
        } else if (scopedVisuals && scopedVisuals.staticBackgroundFill) {
            staticBackgroundFill = String(scopedVisuals.staticBackgroundFill).trim().toLowerCase();
        }
    } catch (e) {
        if (scopedVisuals && scopedVisuals.staticBackgroundFill) {
            staticBackgroundFill = String(scopedVisuals.staticBackgroundFill).trim().toLowerCase();
        }
    }
    if (staticBackgroundFill !== 'dark' && staticBackgroundFill !== 'white' && staticBackgroundFill !== 'gallery') {
        staticBackgroundFill = 'colored';
    }
    if (savedTransparency) {
        root.dataset.luxTransparency = savedTransparency;
        var transInt = parseInt(savedTransparency, 10);
        var fillRatio = (transInt + 1) / 101;
        root.style.setProperty('--lux-transparency-percentage', savedTransparency + '%');
        root.style.setProperty('--lux-transparency-alpha', fillRatio.toFixed(3));
        var isLight = savedMode === 'light';
        var panelAlpha = isLight
            ? Math.max(0.12, 0.12 + (fillRatio * 0.83))
            : Math.max(0.08, 0.08 + (fillRatio * 0.84));
        root.style.setProperty('--lux-panel-alpha', panelAlpha.toFixed(3));
        var panelFillAlpha = isLight
            ? 0.04 + (fillRatio * 0.20)
            : 0.03 + (fillRatio * 0.16);
        root.style.setProperty('--lux-panel-fill-alpha', panelFillAlpha.toFixed(3));
        var colorFadeAlpha = isLight
            ? Math.max(0.40, Math.min(1, fillRatio * 0.92))
            : Math.max(0.01, Math.min(1, fillRatio * 0.92));
        root.style.setProperty('--lux-color-fade-alpha', colorFadeAlpha.toFixed(3));
        var glassBlurQuality = 'auto';
        try {
            var savedGlassBlur = String(localStorage.getItem('kiuLuxuryGlassBlurQuality') || '').trim().toLowerCase();
            if (savedGlassBlur === 'auto' || savedGlassBlur === 'high' || savedGlassBlur === 'balanced' || savedGlassBlur === 'performance') {
                glassBlurQuality = savedGlassBlur;
            } else if (scopedVisuals && scopedVisuals.glassBlurQuality) {
                var scopedBlur = String(scopedVisuals.glassBlurQuality || '').trim().toLowerCase();
                if (scopedBlur === 'auto' || scopedBlur === 'high' || scopedBlur === 'balanced' || scopedBlur === 'performance') {
                    glassBlurQuality = scopedBlur;
                }
            }
        } catch (e) {}
        var adaptiveTier = 'standard';
        if (glassBlurQuality === 'auto') {
            var adaptiveMemory = Number(navigator.deviceMemory || 0);
            var adaptiveCores = Number(navigator.hardwareConcurrency || 0);
            var adaptiveCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
            var adaptiveViewport = window.innerWidth || root.clientWidth || 0;
            if ((adaptiveMemory && adaptiveMemory <= 2) || (adaptiveCores && adaptiveCores <= 2) || (adaptiveCoarsePointer && adaptiveViewport < 720)) adaptiveTier = 'efficient';
            else if (adaptiveMemory >= 8 && adaptiveCores >= 8 && !adaptiveCoarsePointer && adaptiveViewport >= 1280) adaptiveTier = 'high';
        }
        var blurMult = glassBlurQuality === 'auto'
            ? (adaptiveTier === 'efficient' ? 0.25 : adaptiveTier === 'high' ? 1 : 0.5)
            : glassBlurQuality === 'balanced' ? 0.5 : glassBlurQuality === 'performance' ? 0.25 : 1;
        var blurAmount = transInt === 0 ? 0 : (2 + fillRatio * 22) * blurMult;
        var saturateAmount = transInt === 0 ? 100 : 100 + (fillRatio * 45);
        var blurPx = blurAmount.toFixed(3) + 'px';
        var satPct = saturateAmount.toFixed(1) + '%';
        root.style.setProperty('--lux-transparency-blur', blurPx);
        root.style.setProperty('--lux-glass-blur', blurPx);
        root.style.setProperty('--lux-glass-blur-quality-mult', String(blurMult));
        root.style.setProperty('--lux-transparency-saturate', satPct);
        if (document.body) {
            document.body.dataset.luxGlassBlurQuality = glassBlurQuality;
            document.body.style.setProperty('--lux-transparency-blur', blurPx);
            document.body.style.setProperty('--lux-glass-blur', blurPx);
            document.body.style.setProperty('--lux-glass-blur-quality-mult', String(blurMult));
            document.body.style.setProperty('--lux-transparency-saturate', satPct);
        }

        // FOUC PREVENTION: When user has a non-default transparency,
        // hide card backgrounds until updateTransparency() applies correct inline styles.
        // This prevents the flash of accent-colored gradients.
        if (transInt < 60) {
            root.classList.add('lux-transparency-pending');
        }

        // CSS-ONLY NUCLEAR FIX: At high transparency, inject critical CSS
        // directly into <head> BEFORE body renders. This guarantees correct
        // backgrounds from the very first frame — no flash possible.
        if (transInt <= 20) {
            root.classList.add('lux-high-transparency');
            var _pa = panelAlpha.toFixed(3);
            var _isLight = savedMode === 'light';
            var _bg = 'var(--lux-panel-surface)';
            var _bodyBg = _isLight
                ? 'linear-gradient(180deg,rgba(245,240,232,' + _pa + '),rgba(240,235,226,' + _pa + '))'
                : 'linear-gradient(180deg,rgba(12,17,26,' + _pa + '),rgba(7,10,16,' + _pa + '))';
            if (!backgroundAnimationsEnabled && staticBackgroundFill === 'dark') {
                _bodyBg = '#05080f';
            } else if (!backgroundAnimationsEnabled && staticBackgroundFill === 'white') {
                _bodyBg = '#ffffff';
            } else if (!backgroundAnimationsEnabled && staticBackgroundFill === 'colored' && !_isLight) {
                _bodyBg = 'var(--lux-shell-background)';
            }
            var _bodySelector = _isLight
                ? 'body.lux-light-mode:not(.lux-route-social)'
                : 'body:not(.lux-light-mode):not(.lux-route-social)';

            var css = '' +
                'html.lux-high-transparency.lux-high-transparency.lux-high-transparency{' +
                    '--lux-hero-glow:0!important;' +
                '}' +
                getHighTransparencySurfaceCss(_bodySelector, _bg) +
                getHighTransparencyTextResetCss(_bodySelector);
            if (!backgroundAnimationsEnabled && (staticBackgroundFill === 'dark' || staticBackgroundFill === 'white')) {
                css += 'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + '::before' +
                    '{background:' + _bodyBg + '!important}';
            }

            appendLateStyle('lux-high-trans-primer', css);
        }
    }

    if (!backgroundAnimationsEnabled) {
        root.style.setProperty('--lux-canvas-opacity', '0');
        root.style.setProperty('--lux-overlay-opacity', '0');
        root.style.setProperty('--lux-page-haze-top', '0');
        root.style.setProperty('--lux-page-haze-bottom', '0');
        root.dataset.luxBackgroundAnimation = 'off';
    }

    // 2. Sidebar collapsed state — desktop overlay shell defaults hidden at first paint
    var collapsed = false;
    try { collapsed = localStorage.getItem('kiuLuxurySidebarCollapsed') === '1'; } catch (e) {}
    if (typeof window !== 'undefined' && window.innerWidth >= 1181) {
        collapsed = true;
    }
    if (collapsed) {
        root.classList.add('lux-sidebar-collapsed');
    }

    // 3. Palette — always prefer localStorage (survives version bumps); fall back to scoped prefs.
    var savedPalette = '';
    try {
        savedPalette = localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette') || '';
    } catch (e) {}
    if (!savedPalette) {
        savedPalette = String(scopedVisuals.paletteKey || '').trim();
    }
    if (!savedPalette) savedPalette = DEFAULT_LUXURY_PALETTE;
    if (savedPalette === 'carbon-black' || savedPalette === 'arctic-white') savedPalette = 'platinum-silver';
    var loadingPaletteKeys = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal', 'platinum-silver'];
    if (loadingPaletteKeys.indexOf(savedPalette) !== -1) {
        // Palette variables are already available from lux-tokens.css. Set the
        // loading surface on <html> before <body> exists, preventing a default
        // dark/green frame before applyBodyState adds body.palette-*.
        root.style.setProperty('--kiu-loading-background', `var(--palette-${savedPalette}-dark)`);
        root.style.setProperty('--kiu-loading-background-light', `var(--palette-${savedPalette}-light)`);
        root.style.setProperty(
            '--lux-shell-background',
            `var(--palette-${savedPalette}-${savedMode === 'light' ? 'light' : 'dark'})`
        );
    }

    // Apply to body as soon as it exists
    function applyBodyState() {
        var b = document.body;
        if (!b) return;
        var requestedRole = getRequestedShellRole();

        // Mark as luxury shell immediately — hides old header/nav/footer via CSS
        root.classList.add('kiu-shell-loading');
        root.classList.remove('kiu-shell-ready');
        b.classList.add('lux-unified-shell');
        b.classList.add('kiu-shell-loading');
        b.classList.remove('kiu-shell-ready');
        b.setAttribute('aria-busy', 'true');
        setShellLoadState({ phase: 'loading', stage: 'background' });
        b.classList.remove('role-student', 'role-professor', 'role-ta', 'role-admin', 'role-student_service');
        b.classList.add('role-' + requestedRole);
        b.dataset.shellRole = requestedRole;
        root.dataset.shellRole = requestedRole;
        if (document.title !== getShellHomeTitle(requestedRole)) {
            document.title = getShellHomeTitle(requestedRole);
        }

        // Theme mode
        if (savedMode === 'light') {
            b.classList.add('lux-light-mode');
            b.dataset.luxThemeMode = 'light';
        }
        b.dataset.luxBackgroundAnimation = backgroundAnimationsEnabled ? 'on' : 'off';
        b.dataset.luxStaticBackground = staticBackgroundFill;

        // Sidebar — unified shell on desktop starts collapsed for overlay layout
        if (typeof window !== 'undefined' && window.innerWidth >= 1181) {
            collapsed = true;
            root.classList.add('lux-sidebar-collapsed');
        }
        if (collapsed) {
            b.classList.add('lux-sidebar-collapsed');
            b.dataset.luxSidebar = 'collapsed';
        } else {
            b.classList.remove('lux-sidebar-collapsed');
            b.dataset.luxSidebar = 'expanded';
        }

        // Palette (only if it's a valid preset, not 'custom')
        var validPalettes = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal', 'platinum-silver'];
        if (savedPalette && savedPalette !== 'custom' && validPalettes.indexOf(savedPalette) !== -1) {
            b.classList.add('palette-' + savedPalette);
        }

        // Safety net: reveal after a short deadline if deferred scripts fail.
        // Normal routes call markPortalShellReady() after route content renders.
        var revealPollMs = 50;
        // Never leave every route behind the full-screen veil for seconds.
        // Route-specific readiness still wins; this is only the fail-open cap.
        var revealDeadlineMs = 1400;
        var revealElapsedMs = 0;
        function forceRevealPage() {
            window.__kiuSocialShellRevealAllowed = true;
            window.__kiuHomeShellRevealAllowed = true;
            if (typeof window.__kiuStartShellReveal === 'function') {
                try { window.__kiuStartShellReveal({ degraded: true }); } catch (_e) {}
            }
            setShellLoadState({ phase: 'degraded', stage: 'ready', degraded: true });
            root.classList.add('kiu-shell-ready');
            root.classList.remove('kiu-shell-loading');
            if (document.body) {
                document.body.classList.add('kiu-shell-ready');
                document.body.classList.remove('kiu-shell-loading', 'social-center-assembly-prehide', 'home-shell-assembly-prehide');
                document.body.removeAttribute('aria-busy');
            }
            var appContent = document.getElementById('app-content');
            if (appContent) appContent.style.opacity = '1';
            if (typeof window.markPortalShellReady === 'function') {
                try { window.markPortalShellReady(); } catch (_e) {}
            }
        }
        function tryRevealPageEarly() {
            if (shellLoadState.phase !== 'loading') return;
            revealElapsedMs += revealPollMs;
            var isSocial = b.classList.contains('lux-route-social');
            var limit = isSocial ? 1600 : revealDeadlineMs;
            if (revealElapsedMs >= limit) {
                forceRevealPage();
                return;
            }
            setTimeout(tryRevealPageEarly, revealPollMs);
        }
        setTimeout(tryRevealPageEarly, revealPollMs);

        if (!b.classList.contains('lux-route-home') && !shouldSkipFlatSurfaceOverrides()) {
            setTimeout(applyFlatSurfaceOverrides, 0);
        }
    }

    // Try immediately, fallback to earliest possible moment
    if (document.body) {
        applyBodyState();
    } else {
        document.addEventListener('DOMContentLoaded', applyBodyState, { once: true });
        var observer = new MutationObserver(function () {
            if (document.body) {
                observer.disconnect();
                applyBodyState();
            }
        });
        observer.observe(root, { childList: true });
    }

    window.addEventListener('load', function () {
        if (document.body && document.body.classList.contains('lux-route-home')) return;
        if (shouldSkipFlatSurfaceOverrides()) return;
        applyFlatSurfaceOverrides();
    }, { once: true });
})();
