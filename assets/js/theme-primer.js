/**
 * KIU Theme Primer — runs synchronously in <head> BEFORE paint.
 * Prevents FOUC by applying saved theme, palette, and shell state instantly.
 * Also guarantees page becomes visible even if other JS fails to load.
 * Must be loaded WITHOUT defer/async: <script src="assets/js/theme-primer.js"></script>
 */
(function kiuThemePrimer() {
    'use strict';

    var root = document.documentElement;
    var validShellRoles = ['student', 'professor', 'ta', 'admin', 'student_service'];
    var PORTAL_CACHE_RESET_KEY = 'KIU_PORTAL_CACHE_RESET_VERSION';
    var PORTAL_CACHE_RESET_VERSION = '20260606-postactions6';
    var LUXURY_VISUAL_DEFAULTS_VERSION_KEY = 'KIU_LUXURY_VISUAL_DEFAULTS_VERSION';
    var LUXURY_VISUAL_DEFAULTS_VERSION = '20260605-oceanteal-defaults1';
    var DEFAULT_LUXURY_THEME_MODE = 'dark';
    var DEFAULT_LUXURY_SURFACE_TRANSPARENCY = '13';
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
            var storedRole = normalizeRole(localStorage.getItem('currentUserRole'));
            if (storedRole) return storedRole;
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
            persistentState = parseJson(localStorage.getItem('KIU_PERSISTENT_STATE'));
            authState = parseJson(localStorage.getItem('KIU_AUTH_STATE'));
            storedFaculty = String(localStorage.getItem('currentFaculty') || '').trim().toUpperCase();
            storedRole = normalizeRole(localStorage.getItem('currentUserRole'));
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
            '.lux-home-card',
            '.lux-grid-widget',
            '.lux-admin-ops-card',
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
            '.registration-hero',
            '.registration-workspace',
            '.registration-insight-card',
            '.registration-focus-card',
            '.registration-state-card',
            '.registration-module-list-card',
            '.registration-module-pane-card',
            '.registration-track-card',
            '.registration-footer-bar',
            '.registration-mini-metric',
            '.registration-course-row',
            '.registration-module-choice',
            '.registration-track-group',
            '.sch-sidebar',
            '.sch-main',
            '.sch-rail-hero',
            '.sch-rail-section',
            '.sch-grid-shell',
            '.sch-modal',
            '.palette-card',
            '.sch-stat-card',
            '.sch-grid-tag',
            '.sch-legend-pill',
            '.sch-empty-state',
            '.sch-grid-empty',
            '.lms-clean-stat',
            '.lms-clean-signal-panel',
            '.lms-clean-mini',
            '.lms-clean-metric-card',
            '.lms-clean-subject-card',
            '.lms-clean-empty',
            '.lms-banner',
            '.lux-lms-group-card',
            '.lms-route-panel',
            '.lms-clean-summary',
            '.lms-route-hero',
            '.lms-clean-hero',
            '.lms-clean-subview-hero',
            '.lux-faculty-command',
            '.lux-faculty-insight',
            '.lux-faculty-stage',
            '.lux-faculty-hero-focus',
            '.lux-timetable-command',
            '.lux-timetable-insight',
            '.lux-timetable-stage',
            '.lux-timetable-canvas',
            '.lux-timetable-controls',
            '.lux-timetable-filters',
            '.filter-shell',
            '.lux-timetable-hero-focus',
            '.social-card',
            '.social-post-card',
            '.social-mini-card',
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
            '.admin-hero',
            '.portal-msg-page-top',
            '.registration-hero',
            '.registration-hero-focus',
            '.lux-faculty-hero-focus',
            '.lux-timetable-hero-focus',
            '.lms-clean-summary',
            '.lms-route-hero',
            '.lms-clean-hero',
            '.adlib-hero'
        ];
        var softSurfaces = [
            '.content-box',
            '.surface-card',
            '.filter-shell',
            '.portal-msg-panel',
            '.portal-msg-group-modal',
            '.registration-focus-card',
            '.registration-mini-metric',
            '.registration-insight-card',
            '.registration-workspace',
            '.registration-term-shell',
            '.lux-faculty-command',
            '.lux-faculty-insight',
            '.lux-faculty-stage',
            '.lux-timetable-command',
            '.lux-timetable-insight',
            '.lux-timetable-stage',
            '.lms-clean-stat',
            '.lms-clean-signal-panel',
            '.lms-clean-metric-card',
            '.lms-clean-subject-card',
            '.lms-clean-mini',
            '.lms-clean-subview-hero',
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
        return document.body.classList.contains('lux-route-timetable')
            || document.body.classList.contains('lux-route-lms')
            || document.body.classList.contains('lux-route-admin-library')
            || document.body.classList.contains('lux-entry-admin-library');
    }

    function applyFlatSurfaceOverrides() {
        if (shouldSkipFlatSurfaceOverrides()) return;
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
    if (savedTransparency) {
        root.dataset.luxTransparency = savedTransparency;
        var transInt = parseInt(savedTransparency, 10);
        var transAlpha = transInt / 100;
        root.style.setProperty('--lux-transparency-percentage', savedTransparency + '%');
        root.style.setProperty('--lux-transparency-alpha', transAlpha.toFixed(2));
        var isLight = savedMode === 'light';
        var panelAlpha = isLight
            ? Math.max(0.12, 0.12 + (transAlpha * 0.83))
            : Math.max(0.08, 0.08 + (transAlpha * 0.84));
        root.style.setProperty('--lux-panel-alpha', panelAlpha.toFixed(3));
        root.style.setProperty('--lux-color-fade-alpha', Math.max(
            isLight ? 0.46 : 0.42,
            Math.min(1, 0.34 + (transAlpha * 0.68))
        ).toFixed(3));

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
            var _darkBg = 'linear-gradient(180deg,rgba(14,20,33,' + _pa + '),rgba(8,12,21,' + _pa + '))';
            var _lightBg = 'linear-gradient(180deg,rgba(252,249,244,' + _pa + '),rgba(248,244,237,' + _pa + '))';
            var _bg = _isLight ? _lightBg : _darkBg;
            var _bodyBg = _isLight
                ? 'linear-gradient(180deg,rgba(245,240,232,' + _pa + '),rgba(240,235,226,' + _pa + '))'
                : 'linear-gradient(180deg,rgba(12,17,26,' + _pa + '),rgba(7,10,16,' + _pa + '))';
            var _sidebarBg = _isLight
                ? 'linear-gradient(180deg,rgba(248,244,237,' + _pa + '),rgba(242,237,228,' + _pa + '))'
                : 'linear-gradient(180deg,rgba(10,14,22,' + _pa + '),rgba(6,9,15,' + _pa + '))';
            var _bodySelector = _isLight ? 'body.lux-light-mode' : 'body:not(.lux-light-mode)';

            var css = '' +
                // Zero ALL glow variables with !important — prevents JS from re-enabling them
                'html.lux-high-transparency.lux-high-transparency.lux-high-transparency{' +
                    '--lux-hero-glow:0!important;' +
                    '--lux-glow-scale:0!important;' +
                    '--lux-card-glow-alpha:0!important;' +
                    '--lux-panel-glow:0!important;' +
                '}' +
                getHighTransparencySurfaceCss(_bodySelector, _bg) +
                getHighTransparencyTextResetCss(_bodySelector) +
                // Body pseudo-element (page background glow)
                'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + '::before' +
                '{background:' + _bodyBg + '!important}' +
                // Sidebar
                'html.lux-high-transparency.lux-high-transparency.lux-high-transparency ' + _bodySelector + ' .lux-sidebar' +
                '{background:' + _sidebarBg + '!important}';

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

    // 2. Sidebar collapsed state
    var collapsed = false;
    try { collapsed = localStorage.getItem('kiuLuxurySidebarCollapsed') === '1'; } catch (e) {}
    if (collapsed) {
        root.classList.add('lux-sidebar-collapsed');
    }

    // 3. Palette — read saved palette key
    var savedPalette = '';
    if (hasCurrentVisualDefaults) {
        try { savedPalette = localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette') || ''; } catch (e) {}
    }
    if (!savedPalette) {
        savedPalette = String(scopedVisuals.paletteKey || '').trim();
    }
    if (!savedPalette) savedPalette = DEFAULT_LUXURY_PALETTE;

    // Apply to body as soon as it exists
    function applyBodyState() {
        var b = document.body;
        if (!b) return;
        var requestedRole = getRequestedShellRole();

        // Mark as luxury shell immediately — hides old header/nav/footer via CSS
        b.classList.add('lux-unified-shell');
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

        // Sidebar
        if (collapsed) {
            b.classList.add('lux-sidebar-collapsed');
            b.dataset.luxSidebar = 'collapsed';
        }

        // Palette (only if it's a valid preset, not 'custom')
        var validPalettes = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
        if (savedPalette && savedPalette !== 'custom' && validPalettes.indexOf(savedPalette) !== -1) {
            b.classList.add('palette-' + savedPalette);
        }

        // ═══════════════════════════════════════════════════════
        // SAFETY NET: Remove kiu-shell-loading after a timeout.
        // This guarantees the page becomes visible even if
        // navigation.js or other deferred scripts fail to load.
        // The normal path removes it via markPortalShellReady()
        // in navigation.js, but if that never fires, this
        // timeout ensures the user isn't stuck on a blank page.
        // ═══════════════════════════════════════════════════════
        var revealPollMs = 50;
        var revealDeadlineMs = 400;
        var revealElapsedMs = 0;
        function forceRevealPage() {
            root.classList.remove('kiu-shell-loading');
            if (document.body) {
                document.body.classList.remove('kiu-shell-loading');
            }
        }
        function tryRevealPageEarly() {
            var navRoot = document.getElementById('lux-nav');
            if (navRoot && navRoot.children && navRoot.children.length > 0) {
                forceRevealPage();
                return;
            }
            revealElapsedMs += revealPollMs;
            if (revealElapsedMs >= revealDeadlineMs) {
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
