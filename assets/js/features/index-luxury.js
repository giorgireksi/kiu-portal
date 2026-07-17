(function () {
    if (window.__kiuLuxuryIndexInitialized) return;
    window.__kiuLuxuryIndexInitialized = true;
    const ROLE_LABELS = { student: 'Student Portal', professor: 'Professor View', ta: 'TA View', admin: 'Admin View', student_service: 'Student Service View' };
    const PAGE_LABELS = {
        home: 'Dashboard', lms: 'LMS', news: 'News', social: 'Social', profile: 'Profile', 'personal-data': 'Personal Data', chancellery: 'E-Chancellery',
        'student-service': 'Student Service', programs: 'Programs', 'study-card': 'Study Card', registration: 'Registration',
        library: 'Library', orders: 'Orders', 'admin-library': 'Library', 'admin-orders': 'Orders', 'admin-tools': 'Admin Tools', 'faculty-schedule': 'Schedule',
        'faculty-gradebook': 'Gradebook & Assessment', timetable: 'My Schedule', exams: 'Exams', 'admin-scheduler': 'Scheduler', staff: 'Staff', 'students-admin': 'Students',
        'profile-view': 'Profile', gradebook: 'Gradebook'
    };
    const PAGE_FAMILIES = {
        home: 'home', lms: 'academic', 'personal-data': 'academic', programs: 'academic', 'study-card': 'academic', registration: 'academic', library: 'academic', orders: 'academic',
        news: 'support', chancellery: 'support', 'student-service': 'support', social: 'social', 'faculty-schedule': 'faculty',
        'faculty-gradebook': 'faculty', timetable: 'faculty', exams: 'faculty', 'admin-scheduler': 'admin', 'admin-library': 'admin', 'admin-orders': 'admin',
        'admin-tools': 'admin', staff: 'admin', 'students-admin': 'admin', profile: 'utility', 'profile-view': 'utility', gradebook: 'utility'
    };
    const NAV_BY_ROLE = {
        student: [{ group: 'Core', items: [['home', 'Dashboard', 'fas fa-th-large'], ['lms', 'LMS', 'fas fa-book-reader'], ['timetable', 'Timetable', 'fas fa-chalkboard'], ['registration', 'Registration', 'fas fa-check-square']] }, { group: 'Records', items: [['programs', 'Programs', 'fas fa-file-signature'], ['study-card', 'Study Card', 'far fa-address-card'], ['personal-data', 'Personal Data', 'far fa-user']] }, { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['chancellery', 'E-Chancellery', 'fas fa-desktop'], ['student-service', 'Student Service', 'fas fa-headset'], ['library', 'Library', 'fas fa-book'], ['social', 'Social', 'fas fa-comments']] }],
        professor: [{ group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }, { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'Appeals', 'fas fa-inbox']] }],
        ta: [{ group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }, { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'Appeals', 'fas fa-inbox']] }],
        admin: [{ group: 'Control', items: [['home', 'Dashboard', 'fas fa-hammer'], ['admin-tools', 'Admin Tools', 'fas fa-layer-group'], ['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus'], ['staff', 'Staff', 'fas fa-users-cog'], ['students-admin', 'Students', 'fas fa-user-graduate']] }, { group: 'Systems', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group'], ['personal-data', 'Personal Data', 'far fa-user']] }],
        student_service: [{ group: 'Service', items: [['home', 'Dashboard', 'fas fa-th-large'], ['student-service', 'Inbox', 'fas fa-inbox'], ['orders', 'Orders', 'fas fa-book-open'], ['library', 'Library', 'fas fa-book']] }, { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['social', 'Social', 'fas fa-comments']] }]
    };
    const LUXURY_PALETTES = [
        { key: 'obsidian-amber', accent: '#c8822a', accent2: '#d8aa56' },
        { key: 'slate-sapphire', accent: '#426cda', accent2: '#89b0ff' },
        { key: 'pine-jade', accent: '#168b66', accent2: '#6ad1a0' },
        { key: 'burgundy-rose', accent: '#b94447', accent2: '#d8846b' },
        {
            key: 'sand-pearl',
            accent: '#c2b280',
            accent2: '#d4c4a0',
            lightLineRgb: '92,68,28',
            lightParticleRgb: '76,56,30'
        },
        { key: 'ink-orchid', accent: '#7b4bab', accent2: '#a66bc4' },
        { key: 'ocean-teal', accent: '#008080', accent2: '#26a69a' }
    ];
    const FACULTY_PALETTE_MAP = {
        ECON: 'obsidian-amber',
        CS: 'slate-sapphire',
        LAW: 'pine-jade',
        MED: 'ocean-teal',
        ARTS: 'ink-orchid'
    };
    const STUDIO_PALETTES = [
        { key: 'obsidian-amber', name: 'Obsidian & Amber', hA: 30, sA: 72, lA: 48, hB: 45, sB: 80, lB: 56, mode: 'dark' },
        { key: 'slate-sapphire', name: 'Slate & Sapphire', hA: 215, sA: 68, lA: 50, hB: 230, sB: 75, lB: 60, mode: 'dark' },
        { key: 'pine-jade', name: 'Pine & Jade', hA: 156, sA: 72, lA: 34, hB: 142, sB: 56, lB: 58, mode: 'dark' },
        { key: 'burgundy-rose', name: 'Burgundy & Rose', hA: 350, sA: 52, lA: 45, hB: 16, sB: 72, lB: 64, mode: 'dark' },
        { key: 'sand-pearl', name: 'Sand & Pearl', hA: 32, sA: 58, lA: 63, hB: 48, sB: 82, lB: 76, mode: 'light' },
        { key: 'ink-orchid', name: 'Ink & Orchid', hA: 279, sA: 54, lA: 54, hB: 313, sB: 68, lB: 66, mode: 'dark' },
        { key: 'ocean-teal', name: 'Ocean & Teal', hA: 180, sA: 60, lA: 32, hB: 174, sB: 55, lB: 44, mode: 'dark' }
    ];
    function isBuiltInLuxuryPaletteKey(key) {
        return LUXURY_PALETTES.some((palette) => palette.key === key);
    }
    function buildStudioPaletteCustomColors(palette) {
        const start = `hsl(${Math.round(palette.hA)},${Math.round(palette.sA)}%,${Math.round(palette.lA)}%)`;
        const end = `hsl(${Math.round(palette.hB)},${Math.round(palette.sB)}%,${Math.round(palette.lB)}%)`;
        return { accent: start, accent2: end };
    }
    function studioPaletteMatchesMixer(palette, mixerState) {
        const values = ['hA', 'sA', 'lA', 'hB', 'sB', 'lB'];
        return values.every((key) => Math.abs(Number(mixerState?.[key] ?? 0) - Number(palette?.[key] ?? 0)) <= 1)
            && Math.abs(Number(mixerState?.ratio ?? 0) - 50) <= 1;
    }
    const BACKGROUND_MODES = [
        { key: 'peak', label: 'Peak Terrain', icon: 'fas fa-mountain', copy: 'Ridged particle terrain waves.' },
        { key: 'layered', label: 'Layered Waves', icon: 'fas fa-water', copy: 'Stacked wave bands with ribbon haze.' },
        { key: 'orbit', label: 'Orbit Field', icon: 'fas fa-circle-notch', copy: 'Swirling orbital particle field.' },
        { key: 'corners', label: 'Corner Focus', icon: 'fas fa-border-all', copy: 'Edge-focused particle streams.' },
        { key: 'fog', label: 'Volumetric Fog', icon: 'fas fa-smog', copy: 'Shader fog with dedicated color and motion controls.' }
    ];
    const FOG_COLOR_PRESETS = {
        dark: {
            highlightColor: '#b794f6',
            midtoneColor: '#6366f1',
            lowlightColor: '#0f172a',
            baseColor: '#020617'
        },
        light: {
            highlightColor: '#fda4af',
            midtoneColor: '#fcd34d',
            lowlightColor: '#7dd3fc',
            baseColor: '#fefce8'
        }
    };
    const DEFAULT_FOG_SETTINGS = {
        ...FOG_COLOR_PRESETS.dark,
        blurFactor: 0.6,
        speed: 1.0,
        zoom: 1.0
    };
    const PARTICLE_QUALITY_OPTIONS = [
        { key: 'auto', label: 'Auto', copy: 'Match device performance tier.' },
        { key: 'low', label: 'Low', copy: 'Lightweight particle count.' },
        { key: 'balanced', label: 'Balanced', copy: 'Default quality profile.' },
        { key: 'high', label: 'High', copy: 'Maximum particle density.' }
    ];
    const FORCED_LUXURY_VISUAL_DEFAULTS_VERSION = '20260605-oceanteal-defaults1';
    const GLOBAL_LUXURY_PALETTE_SCOPE = '*';
    const DEFAULT_HOME_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'orbit',
        backgroundAnimationsEnabled: true,
        particleMotion: 100,
        particleDensity: 100,
        particleAmount: 100,
        particleSharpness: 50,
        particleQuality: 'high',
        paletteKey: 'ocean-teal',
        paletteFaculty: GLOBAL_LUXURY_PALETTE_SCOPE,
        customPalette: null,
        surfaceTransparency: '13',
        fogSettings: { ...DEFAULT_FOG_SETTINGS }
    };
    const HOME_EDITOR_STATE = {
        editing: false,
        role: '',
        draftLayout: null,
        draftCustomShortcuts: [],
        stagedVisuals: null,
        selectedWidgetId: '',
        dragState: null,
        inspectorState: null,
        inspectorDragState: null,
        scopeKey: ''
    };
    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }
    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    function getCurrentUserSafe() {
        try {
            if (typeof getCurrentUser === 'function') return getCurrentUser() || {};
        } catch (e) {}
        return window.currentUser || {};
    }
    function getEffectiveRole() {
        try {
            if (typeof getEffectiveUserRole === 'function') return getEffectiveUserRole();
        } catch (e) {}
        return window.currentUserRole || getCurrentUserSafe().role || 'student';
    }
    function getShellRole(pageId = getActivePageId()) {
        return getEffectiveRole();
    }
    function getCurrentFacultyCode() {
        const user = getCurrentUserSafe();
        const selectValue = document.getElementById('faculty-select')?.value;
        const raw = selectValue || localStorage.getItem('currentFaculty') || user.facultyCode || user.faculty || 'ECON';
        try {
            if (typeof normalizeFacultyCode === 'function') return normalizeFacultyCode(raw, 'ECON');
        } catch (e) {}
        return String(raw || 'ECON').toUpperCase();
    }
    function getFacultyName(code) {
        try {
            if (typeof getFacultyLabel === 'function') return getFacultyLabel(code);
        } catch (e) {}
        return code || 'Faculty';
    }
    function getUserName() {
        const user = getCurrentUserSafe();
        return user.nameEn || user.name || 'Portal User';
    }
    function getUserInitials() {
        return getUserName()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => (part[0] || '').toUpperCase())
            .join('') || 'KI';
    }
    function sanitizeBodyToken(value, fallback = 'portal') {
        return String(value || fallback)
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '') || fallback;
    }
    function resolveLuxRouteBodyToken(pageId, entryId) {
        const entry = sanitizeBodyToken(entryId, '');
        const page = sanitizeBodyToken(pageId, 'home');
        if (entry === 'admin-library' || entry === 'admin-orders') return entry;
        if (entry && page && (page === entry || page.startsWith(`${entry}-`))) return entry;
        return page;
    }
    function getLuxRouteBodyClassTokens(pageId, entryId) {
        const entry = sanitizeBodyToken(entryId, '');
        const tokens = new Set([sanitizeBodyToken(resolveLuxRouteBodyToken(pageId, entryId), 'portal')]);
        if (entry === 'admin-library') {
            tokens.add('admin-library');
        } else if (entry === 'admin-orders') {
            tokens.add('admin-orders');
            tokens.add('orders');
        }
        return Array.from(tokens);
    }
    function applyLuxRouteBodyClasses(pageId, entryId) {
        getLuxRouteBodyClassTokens(pageId, entryId).forEach((token) => {
            document.body.classList.add(`lux-route-${token}`);
        });
    }
    function isLuxRouteWorkspace(pageId = getActivePageId(), entryId = getActiveEntryPageId()) {
        if (resolveLuxRouteBodyToken(pageId, entryId) === 'lms') return true;
        return Boolean(document.body?.classList?.contains('lux-route-lms'));
    }
    function resolveEntryPageId(pathname = window.location.pathname) {
        const normalizedPath = String(pathname || '').replace(/\\/g, '/').toLowerCase();
        const fileName = normalizedPath.split('/').filter(Boolean).pop() || '';
        if (!fileName || !fileName.endsWith('.html')) return '';
        return fileName.replace(/\.html$/i, '');
    }
    function resolveRuntimePageId(pathname = window.location.pathname) {
        try {
            if (typeof getRuntimeRouteIntentFromPathname === 'function') {
                const routed = getRuntimeRouteIntentFromPathname(pathname);
                if (routed) return routed;
            }
        } catch (e) {}
        const entryId = resolveEntryPageId(pathname);
        if (!entryId || entryId === 'index' || entryId === 'login') return '';
        if (entryId === 'admin-library') return 'library';
        if (entryId === 'admin-orders') return 'orders';
        return entryId;
    }
    function getActivePageId() {
        const standaloneEntry = resolveEntryPageId();
        if (standaloneEntry === 'social') return 'social';
        const active = document.querySelector('.page-section.active-page') ||
            Array.from(document.querySelectorAll('.page-section')).find((section) => !section.hidden && section.style.display !== 'none');
        return active?.id?.replace(/^page-/, '') || resolveRuntimePageId() || 'home';
    }
    function getActiveEntryPageId() {
        return resolveEntryPageId() || getActivePageId();
    }
    function getPageFamily(pageId = getActivePageId(), entryId = getActiveEntryPageId()) {
        if (PAGE_FAMILIES[entryId]) return PAGE_FAMILIES[entryId];
        return PAGE_FAMILIES[pageId] || 'portal';
    }
    function isAdminLibraryRouteContext(pageId = getActivePageId(), entryId = getActiveEntryPageId()) {
        const entry = sanitizeBodyToken(entryId, '');
        if (entry === 'admin-library') return true;
        return sanitizeBodyToken(pageId, '') === 'library'
            && Boolean(document.getElementById('page-library')?.querySelector?.('.alib-workspace'));
    }
    function reconcileAdminLibraryRouteClasses(pageId = getActivePageId(), entryId = getActiveEntryPageId()) {
        if (!isAdminLibraryRouteContext(pageId, entryId)) return;
        document.body.classList.add('lux-route-admin-library');
        document.body.classList.remove('lux-route-library');
        if (!document.body.dataset.luxPage) document.body.dataset.luxPage = 'library';
        if (!document.body.dataset.luxEntry) document.body.dataset.luxEntry = 'admin-library';
    }
    function applyPortalPageState() {
        const pageId = getActivePageId();
        const entryId = getActiveEntryPageId();
        const family = getPageFamily(pageId, entryId);
        const isHomeEditing = HOME_EDITOR_STATE.editing && pageId === 'home';
        const nextSignature = [pageId, entryId || pageId, family, isHomeEditing ? '1' : '0'].join('|');
        if (document.body.dataset.luxPageStateSignature === nextSignature) {
            return;
        }
        document.body.classList.add('lux-unified-shell');
        document.body.dataset.luxPage = pageId;
        document.body.dataset.luxEntry = entryId || pageId;
        document.body.dataset.luxFamily = family;
        document.body.dataset.luxEditingHome = isHomeEditing ? 'true' : 'false';
        document.body.dataset.luxPageStateSignature = nextSignature;
        document.body.classList.toggle('lux-home-page', pageId === 'home');
        document.body.classList.toggle('lux-nonhome-page', pageId !== 'home');
        document.body.classList.toggle('lux-home-editing', Boolean(isHomeEditing));
        Array.from(document.body.classList).forEach((className) => {
            if (/^lux-(route|entry|family)-/.test(className)) {
                document.body.classList.remove(className);
            }
        });
        applyLuxRouteBodyClasses(pageId, entryId);
        document.body.classList.add(
            `lux-entry-${sanitizeBodyToken(entryId || pageId)}`,
            `lux-family-${sanitizeBodyToken(family)}`
        );
        reconcileAdminLibraryRouteClasses(pageId, entryId);
    }
    function isSidebarCollapsed() {
        if (document.body) {
            return document.body.classList.contains('lux-sidebar-collapsed');
        }
        try {
            return localStorage.getItem('kiuLuxurySidebarCollapsed') === '1';
        } catch (e) {
            return false;
        }
    }
    function isDesktopSidebarOverlayViewport() {
        return typeof window !== 'undefined' && window.innerWidth >= 1181;
    }
    function isSidebarOverlayRoute() {
        return Boolean(document.body?.classList.contains('lux-unified-shell'));
    }
    function applySidebarState(collapsed = isSidebarCollapsed(), options = {}) {
        const persist = options.persist !== false;
        if (persist) {
            localStorage.setItem('kiuLuxurySidebarCollapsed', collapsed ? '1' : '0');
        }
        document.documentElement.classList.toggle('lux-sidebar-collapsed', Boolean(collapsed));
        document.body.classList.toggle('lux-sidebar-collapsed', Boolean(collapsed));
        document.body.dataset.luxSidebar = collapsed ? 'collapsed' : 'expanded';
        const toggle = document.getElementById('lux-sidebar-toggle');
        if (toggle) {
            toggle.classList.toggle('is-active', Boolean(collapsed));
            toggle.setAttribute('aria-pressed', collapsed ? 'true' : 'false');
            toggle.title = 'Show navigation';
            const icon = toggle.querySelector('i');
            const label = toggle.querySelector('.lux-sidebar-toggle-label');
            if (icon) {
                icon.className = 'fas fa-sidebar fa-flip-horizontal';
            }
            if (label) {
                label.textContent = 'Show nav';
            }
        }
        const closeBtn = document.getElementById('lux-sidebar-close');
        if (closeBtn) {
            closeBtn.classList.toggle('is-active', !collapsed);
            closeBtn.setAttribute('aria-pressed', collapsed ? 'false' : 'true');
            closeBtn.setAttribute('aria-label', 'Hide navigation');
            closeBtn.removeAttribute('title');
            const closeLabel = closeBtn.querySelector('.lux-sidebar-close-label');
            if (closeLabel) {
                closeLabel.textContent = 'Hide nav';
            }
        }
    }
    function toggleSidebar() {
        const next = !document.body.classList.contains('lux-sidebar-collapsed');
        applySidebarState(next, { persist: true });
        // FIX: Do NOT call syncAll() or dispatch fake 'resize' events here.
        // Sidebar toggle is a pure CSS transition handled by index-luxury.css transitions.
        // Dispatching a resize event tricks the app into rebuilding the DOM.
    }
    function pageLabel(pageId) {
        return PAGE_LABELS[pageId] || 'Dashboard';
    }
    function pageTarget(pageId) {
        return pageId === 'profile' ? 'personal-data' : pageId;
    }
    window.__KIU_LUXURY_SHARED = {
        ROLE_LABELS,
        PAGE_LABELS,
        NAV_BY_ROLE,
        pageLabel,
        pageTarget,
        isSidebarCollapsed,
        applySidebarState,
        toggleSidebar
    };
    window.isSidebarCollapsed = typeof isSidebarCollapsed === 'function' ? isSidebarCollapsed : window.isSidebarCollapsed;
    window.applySidebarState = typeof applySidebarState === 'function' ? applySidebarState : window.applySidebarState;
    window.toggleSidebar = typeof toggleSidebar === 'function' ? toggleSidebar : window.toggleSidebar;
    function cloneDeep(value, fallback = null) {
        if (value == null) return fallback;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (e) {
            return fallback;
        }
    }
    function ensureDashboardPreferenceStore() {
        if (!KIU_STATE.homeDashboardPreferencesByUser || typeof KIU_STATE.homeDashboardPreferencesByUser !== 'object') {
            KIU_STATE.homeDashboardPreferencesByUser = {};
        }
        return KIU_STATE.homeDashboardPreferencesByUser;
    }
    function getDashboardPreferenceUserId() {
        const user = getCurrentUserSafe();
        return String(user?.id || user?.email || user?.nameEn || user?.name || 'guest');
    }
    const ADVANCED_HOME_LAYOUT_VERSION = 5;
    const HOME_SCOPE_SEPARATOR = '::';
    const HOME_DESKTOP_EDITOR_BREAKPOINT = 1120;
    const HOME_GRID_COLUMNS = 12;
    const HOME_GRID_ROW_HEIGHT = 28;
    const ADVANCED_DEFAULT_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'orbit',
        backgroundAnimationsEnabled: true,
        particleMotion: 100,
        particleDensity: 100,
        particleQuality: 'high',
        backgroundIntensity: 'standard',
        glowStrength: 'balanced',
        paletteKey: 'ocean-teal',
        paletteFaculty: GLOBAL_LUXURY_PALETTE_SCOPE,
        customPalette: null,
        accentColor: '',
        accentColor2: '',
        glassTint: '',
        particleColor: '',
        lineColor: '',
        glowColor: '',
        hazeColor: '',
        surfaceTransparency: '13',
        fogSettings: { ...DEFAULT_FOG_SETTINGS }
    };
    function buildAdvancedDefaultVisuals() {
        return {
            ...ADVANCED_DEFAULT_VISUALS,
            customPalette: null
        };
    }
    function buildForcedLuxuryVisualDefaults() {
        return {
            ...buildAdvancedDefaultVisuals(),
            customPalette: null,
            accentColor: '',
            accentColor2: '',
            glassTint: '',
            particleColor: '',
            lineColor: '',
            glowColor: '',
            hazeColor: '',
            surfaceTransparency: String(ADVANCED_DEFAULT_VISUALS.surfaceTransparency)
        };
    }
    function isDesktopHomeEditorViewport() {
        return (window.innerWidth || 0) >= HOME_DESKTOP_EDITOR_BREAKPOINT;
    }
    function isHomeEditorAvailable() {
        return true;
    }
    function getHomeScopeKey(role = getEffectiveRole(), facultyCode = getCurrentFacultyCode()) {
        return `${String(role || 'student')}${HOME_SCOPE_SEPARATOR}${String(facultyCode || 'ECON')}`;
    }
    function clearHomeEditorState() {
        HOME_EDITOR_STATE.editing = false;
        HOME_EDITOR_STATE.role = '';
        HOME_EDITOR_STATE.draftLayout = null;
        HOME_EDITOR_STATE.draftCustomShortcuts = [];
        HOME_EDITOR_STATE.dragState = null;
        HOME_EDITOR_STATE.inspectorState = null;
        HOME_EDITOR_STATE.inspectorDragState = null;
        HOME_EDITOR_STATE.selectedWidgetId = '';
    }
    function createDashboardPreferenceEntry() {
        return {
            version: ADVANCED_HOME_LAYOUT_VERSION,
            visuals: buildAdvancedDefaultVisuals(),
            visualsByScope: {},
            layoutsByRole: {},
            customShortcutsByRole: {},
            layoutsByScope: {},
            editorUiByScope: {},
            fogProfiles: []
        };
    }
    function normalizeScopeLayoutEntry(scopeEntry) {
        if (!scopeEntry || typeof scopeEntry !== 'object') return null;
        const workspaceWidgets = Array.isArray(scopeEntry.workspaceWidgets)
            ? scopeEntry.workspaceWidgets
            : (Array.isArray(scopeEntry.widgets) ? scopeEntry.widgets : []);
        const presentationWidgets = Array.isArray(scopeEntry.presentationWidgets) ? scopeEntry.presentationWidgets : [];
        return {
            version: Number(scopeEntry.version || 0) || 0,
            workspaceWidgets,
            presentationWidgets
        };
    }
    function getDashboardPreferenceEntry() {
        const store = ensureDashboardPreferenceStore();
        const userId = getDashboardPreferenceUserId();
        if (!store[userId] || typeof store[userId] !== 'object') {
            store[userId] = createDashboardPreferenceEntry();
        }
        const entry = store[userId];
        const previousVersion = Number(entry.version || 0);
        if (!entry.visuals || typeof entry.visuals !== 'object') entry.visuals = buildAdvancedDefaultVisuals();
        if (!entry.visualsByScope || typeof entry.visualsByScope !== 'object') entry.visualsByScope = {};
        if (!entry.layoutsByRole || typeof entry.layoutsByRole !== 'object') entry.layoutsByRole = {};
        if (!entry.customShortcutsByRole || typeof entry.customShortcutsByRole !== 'object') entry.customShortcutsByRole = {};
        if (!entry.layoutsByScope || typeof entry.layoutsByScope !== 'object') entry.layoutsByScope = {};
        if (!entry.editorUiByScope || typeof entry.editorUiByScope !== 'object') entry.editorUiByScope = {};
        if (!Array.isArray(entry.fogProfiles)) entry.fogProfiles = [];
        if (previousVersion > 0 && previousVersion < ADVANCED_HOME_LAYOUT_VERSION) {
            Object.keys(entry.layoutsByScope).forEach((scopeKey) => {
                const normalizedScope = normalizeScopeLayoutEntry(entry.layoutsByScope[scopeKey]);
                if (!normalizedScope) return;
                normalizedScope.workspaceWidgets.forEach((widget) => {
                    if (!widget || typeof widget !== 'object') return;
                    delete widget.desktopRect;
                    delete widget.restoreDesktopRect;
                    delete widget.zIndex;
                });
                normalizedScope.presentationWidgets.forEach((widget) => {
                    if (!widget || typeof widget !== 'object') return;
                    delete widget.desktopRect;
                    delete widget.restoreDesktopRect;
                    delete widget.zIndex;
                });
                entry.layoutsByScope[scopeKey] = {
                    version: previousVersion,
                    workspaceWidgets: normalizedScope.workspaceWidgets,
                    presentationWidgets: normalizedScope.presentationWidgets
                };
            });
        }
        entry.version = ADVANCED_HOME_LAYOUT_VERSION;
        return entry;
    }
    function updateDashboardPreferenceEntry(mutator, { persist = false } = {}) {
        const store = ensureDashboardPreferenceStore();
        const userId = getDashboardPreferenceUserId();
        const nextEntry = cloneDeep(getDashboardPreferenceEntry(), createDashboardPreferenceEntry());
        mutator(nextEntry);
        nextEntry.version = ADVANCED_HOME_LAYOUT_VERSION;
        if (!nextEntry.visuals || typeof nextEntry.visuals !== 'object') nextEntry.visuals = buildAdvancedDefaultVisuals();
        if (!nextEntry.visualsByScope || typeof nextEntry.visualsByScope !== 'object') nextEntry.visualsByScope = {};
        if (!nextEntry.layoutsByRole || typeof nextEntry.layoutsByRole !== 'object') nextEntry.layoutsByRole = {};
        if (!nextEntry.customShortcutsByRole || typeof nextEntry.customShortcutsByRole !== 'object') nextEntry.customShortcutsByRole = {};
        if (!nextEntry.layoutsByScope || typeof nextEntry.layoutsByScope !== 'object') nextEntry.layoutsByScope = {};
        if (!nextEntry.editorUiByScope || typeof nextEntry.editorUiByScope !== 'object') nextEntry.editorUiByScope = {};
        store[userId] = nextEntry;
        if (persist && typeof saveState === 'function') saveState();
        return nextEntry;
    }
    function applyForcedLuxuryVisualDefaults(values = {}) {
        return {
            ...(values && typeof values === 'object' ? values : {}),
            ...buildForcedLuxuryVisualDefaults()
        };
    }
    function migrateForcedLuxuryVisualDefaults() {
        let currentVersion = '';
        try {
            currentVersion = String(localStorage.getItem('KIU_LUXURY_VISUAL_DEFAULTS_VERSION') || '').trim();
        } catch (e) {}
        if (currentVersion === FORCED_LUXURY_VISUAL_DEFAULTS_VERSION) return;
        const forcedDefaults = buildForcedLuxuryVisualDefaults();
        const store = ensureDashboardPreferenceStore();
        const currentUserId = getDashboardPreferenceUserId();
        if (!store[currentUserId] || typeof store[currentUserId] !== 'object') {
            store[currentUserId] = createDashboardPreferenceEntry();
        }
        Object.keys(store).forEach((userId) => {
            const entry = store[userId] && typeof store[userId] === 'object'
                ? store[userId]
                : createDashboardPreferenceEntry();
            entry.visuals = applyForcedLuxuryVisualDefaults(entry.visuals);
            entry.visualsByScope = entry.visualsByScope && typeof entry.visualsByScope === 'object'
                ? entry.visualsByScope
                : {};
            Object.keys(entry.visualsByScope).forEach((scopeKey) => {
                entry.visualsByScope[scopeKey] = applyForcedLuxuryVisualDefaults(entry.visualsByScope[scopeKey]);
            });
            store[userId] = entry;
        });
        try {
            localStorage.setItem('kiuLuxuryThemeMode', forcedDefaults.themeMode);
            localStorage.setItem('kiuLuxuryBackgroundMode', forcedDefaults.backgroundMode);
            localStorage.setItem('kiuLuxuryBackgroundAnimationsEnabled', forcedDefaults.backgroundAnimationsEnabled ? '1' : '0');
            localStorage.setItem('kiuLuxuryParticleMotion', String(forcedDefaults.particleMotion));
            localStorage.setItem('kiuLuxuryParticleDensity', String(forcedDefaults.particleDensity));
            localStorage.setItem('kiuLuxuryParticleQuality', forcedDefaults.particleQuality);
            localStorage.setItem('kiuLuxurySurfaceTransparency', String(forcedDefaults.surfaceTransparency));
            localStorage.setItem('kiuLuxurySurfaceTransparencyValue', (Number(forcedDefaults.surfaceTransparency) / 100).toFixed(2));
            localStorage.setItem('kiuLuxuryPalette', forcedDefaults.paletteKey);
            localStorage.setItem('kiuLuxuryPaletteFaculty', forcedDefaults.paletteFaculty);
            localStorage.setItem('kiu-palette', forcedDefaults.paletteKey);
            localStorage.removeItem('kiuLuxuryCustomPalette');
            localStorage.removeItem('kiuLuxuryCustomPaletteFaculty');
            localStorage.removeItem('kiuLuxuryMixerState');
            localStorage.setItem('KIU_LUXURY_VISUAL_DEFAULTS_VERSION', FORCED_LUXURY_VISUAL_DEFAULTS_VERSION);
        } catch (e) {}
        if (typeof saveState === 'function') saveState();
    }
    migrateForcedLuxuryVisualDefaults();
    function getDefaultInspectorState() {
        const width = Math.min(390, Math.max(320, (window.innerWidth || 1440) - 48));
        return {
            collapsed: false,
            x: Math.max(24, (window.innerWidth || 1440) - width - 28),
            y: 132,
            width
        };
    }
    function sanitizeInspectorState(value) {
        const base = getDefaultInspectorState();
        const width = Math.max(300, Math.min(Number(value?.width) || base.width, Math.max(300, (window.innerWidth || 1440) - 32)));
        const maxX = Math.max(12, (window.innerWidth || 1440) - width - 12);
        const maxY = Math.max(12, (window.innerHeight || 900) - 120);
        return {
            collapsed: value?.collapsed === true,
            width,
            x: Math.max(12, Math.min(Number(value?.x) || base.x, maxX)),
            y: Math.max(96, Math.min(Number(value?.y) || base.y, maxY))
        };
    }
    function getSavedInspectorState(scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        return sanitizeInspectorState(entry.editorUiByScope?.[scopeKey] || {});
    }
    function setSavedInspectorState(values, scopeKey = getHomeScopeKey(), persist = true) {
        const nextState = sanitizeInspectorState({
            ...(getSavedInspectorState(scopeKey) || {}),
            ...(values || {})
        });
        updateDashboardPreferenceEntry((entry) => {
            entry.editorUiByScope = entry.editorUiByScope || {};
            entry.editorUiByScope[scopeKey] = nextState;
        }, { persist });
        return nextState;
    }
    function getDashboardVisuals(scopeKey = getHomeScopeKey()) {
        const entry = getDashboardPreferenceEntry();
        const scopedVisuals = entry.visualsByScope?.[scopeKey];
        return {
            ...buildAdvancedDefaultVisuals(),
            ...(scopedVisuals || entry.visuals || {})
        };
    }
    function setDashboardVisuals(values, persist = true, scopeKey = getHomeScopeKey()) {
        updateDashboardPreferenceEntry((entry) => {
            entry.visualsByScope = entry.visualsByScope || {};
            entry.visualsByScope[scopeKey] = {
                ...buildAdvancedDefaultVisuals(),
                ...(entry.visuals || {}),
                ...(entry.visualsByScope?.[scopeKey] || {}),
                ...(values || {})
            };
        }, { persist });
    }
    function getDefaultVisualSettings() {
        return buildAdvancedDefaultVisuals();
    }
    function resetVisualSettings() {
        [
            'kiuLuxuryThemeMode',
            'kiuLuxuryBackgroundMode',
            'kiuLuxuryParticleMotion',
            'kiuLuxuryParticleDensity',
            'kiuLuxuryParticleQuality',
            'kiuLuxuryBackgroundIntensity',
            'kiuLuxuryGlowStrength',
            'kiuLuxurySurfaceTransparency',
            'kiuLuxurySurfaceTransparencyValue',
            'kiuLuxuryPalette',
            'kiuLuxuryPaletteFaculty',
            'kiuLuxuryCustomPalette',
            'kiuLuxuryCustomPaletteFaculty',
            'kiuLuxuryMixerState',
            'kiuLuxuryFogSettings',
            'kiu-palette'
        ].forEach((key) => localStorage.removeItem(key));
        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
        paletteClasses.forEach((palette) => document.body.classList.remove(`palette-${palette}`));
        const scopeKey = getHomeScopeKey();
        updateDashboardPreferenceEntry((entry) => {
            delete entry.visualsByScope[scopeKey];
        }, { persist: true });
        showToast('Visual settings reset for this dashboard profile.');
        syncAll();
    }
    function resetHomeToDefaults() {
        [
            'kiuLuxuryThemeMode',
            'kiuLuxuryBackgroundMode',
            'kiuLuxuryParticleMotion',
            'kiuLuxuryParticleDensity',
            'kiuLuxuryParticleQuality',
            'kiuLuxuryFogSettings',
            'kiuLuxuryBackgroundIntensity',
            'kiuLuxuryGlowStrength',
            'kiuLuxurySurfaceTransparency',
            'kiuLuxurySurfaceTransparencyValue',
            'kiuLuxuryPalette',
            'kiuLuxuryPaletteFaculty',
            'kiuLuxuryCustomPalette',
            'kiuLuxuryCustomPaletteFaculty',
            'kiuLuxuryMixerState'
        ].forEach((key) => localStorage.removeItem(key));
        updateDashboardPreferenceEntry((entry) => {
            entry.visuals = buildAdvancedDefaultVisuals();
            entry.visualsByScope = {};
            entry.layoutsByRole = {};
            entry.customShortcutsByRole = {};
            entry.layoutsByScope = {};
            entry.editorUiByScope = {};
        }, { persist: true });
        clearHomeEditorState();
        showToast('Home restored to KIU defaults.');
        syncAll();
    }
    function resetSavedRoleLayout(role) {
        const scopeKey = getHomeScopeKey(role, getCurrentFacultyCode());
        updateDashboardPreferenceEntry((entry) => {
            delete entry.layoutsByScope[scopeKey];
            delete entry.editorUiByScope?.[scopeKey];
            delete entry.layoutsByRole[role];
            delete entry.customShortcutsByRole[role];
        }, { persist: true });
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role) clearHomeEditorState();
        showToast(`${ROLE_LABELS[role] || 'Dashboard'} reset for ${getFacultyName(getCurrentFacultyCode())}.`);
        syncAll();
    }
    function resetAllSavedHomeLayouts() {
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByRole = {};
            entry.customShortcutsByRole = {};
            entry.layoutsByScope = {};
            entry.editorUiByScope = {};
        }, { persist: true });
        clearHomeEditorState();
        showToast('All dashboard layouts reset.');
        syncAll();
    }
    function hexToRgbTriplet(hex) {
        const cleaned = String(hex || '').trim().replace('#', '');
        if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) return '200,130,42';
        const r = parseInt(cleaned.slice(0, 2), 16);
        const g = parseInt(cleaned.slice(2, 4), 16);
        const b = parseInt(cleaned.slice(4, 6), 16);
        return `${r},${g},${b}`;
    }
    function getPaletteByKey(key) {
        return LUXURY_PALETTES.find((palette) => palette.key === key)
            || LUXURY_PALETTES.find((palette) => palette.key === DEFAULT_HOME_VISUALS.paletteKey)
            || LUXURY_PALETTES[0];
    }
    function hslToRgb(h, s, l) {
        const hue = Number(h || 0);
        const sat = Number(s || 0) / 100;
        const lig = Number(l || 0) / 100;
        const k = (n) => (n + hue / 30) % 12;
        const a = sat * Math.min(lig, 1 - lig);
        const f = (n) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
        return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
    }
    function mixHsl(h1, s1, l1, h2, s2, l2, ratio) {
        const start = Number(h1 || 0);
        const end = Number(h2 || 0);
        let delta = end - start;
        if (Math.abs(delta) > 180) delta -= Math.sign(delta) * 360;
        const mix = Number(ratio || 0);
        return [
            (start + delta * mix + 360) % 360,
            Number(s1 || 0) + (Number(s2 || 0) - Number(s1 || 0)) * mix,
            Number(l1 || 0) + (Number(l2 || 0) - Number(l1 || 0)) * mix
        ];
    }
    function rgbTripletToString(rgb) {
        return `${rgb[0]},${rgb[1]},${rgb[2]}`;
    }
    function blendRgbTriplets(a, b, ratio = 0.5) {
        const mix = Math.max(0, Math.min(1, Number(ratio) || 0));
        const parse = (triplet, fallback) => String(triplet || fallback)
            .split(',')
            .slice(0, 3)
            .map((part, index) => {
                const fallbackParts = String(fallback || '0,0,0').split(',');
                const numeric = Number(part?.trim?.() ?? part);
                return Math.max(0, Math.min(255, Number.isFinite(numeric) ? numeric : Number(fallbackParts[index] || 0)));
            });
        const first = parse(a, '0,0,0');
        const second = parse(b, '0,0,0');
        return [
            Math.round(first[0] + (second[0] - first[0]) * mix),
            Math.round(first[1] + (second[1] - first[1]) * mix),
            Math.round(first[2] + (second[2] - first[2]) * mix)
        ].join(',');
    }
    function buildLightModeBackdropTokens(accentRgb, accent2Rgb, options = {}) {
        const ink = String(options.inkRgb || '32,26,20').trim();
        const line = options.lineRgb || blendRgbTriplets(ink, accentRgb, 0.62);
        const particle = options.particleRgb || blendRgbTriplets(ink, accent2Rgb, 0.54);
        const haze = options.hazeRgb || blendRgbTriplets('239,228,213', accentRgb, 0.18);
        const glow = options.glowRgb || blendRgbTriplets(accentRgb, accent2Rgb, 0.35);
        return { line, particle, haze, glow };
    }
    function rgbTripletToHex(triplet, fallback = '#c8822a') {
        const parts = String(triplet || '')
            .split(',')
            .slice(0, 3)
            .map((part) => Math.max(0, Math.min(255, Math.round(Number(part.trim()) || 0))));
        if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return fallback;
        return `#${parts.map((value) => value.toString(16).padStart(2, '0')).join('')}`;
    }
    let __luxColorProbeContext = null;
    function colorToRgbTriplet(value, fallback = '200,130,42') {
        const input = String(value || '').trim();
        if (!input) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(input)) return hexToRgbTriplet(input);
        if (!__luxColorProbeContext) {
            const probe = document.createElement('canvas');
            probe.width = 1;
            probe.height = 1;
            __luxColorProbeContext = probe.getContext('2d');
        }
        const context = __luxColorProbeContext;
        if (!context) return fallback;
        try {
            context.fillStyle = '#000000';
            context.fillStyle = input;
            const normalized = context.fillStyle || '';
            if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return hexToRgbTriplet(normalized);
            const match = normalized.match(/rgba?\(([^)]+)\)/i);
            if (!match) return fallback;
            return match[1].split(',').slice(0, 3).map((part) => String(Math.round(Number(part.trim()) || 0))).join(',');
        } catch (e) {
            return fallback;
        }
    }
    function sanitizeColorInput(value, fallback = '') {
        const input = String(value || '').trim();
        if (!input) return fallback;
        if (/^#[0-9a-fA-F]{6}$/.test(input)) return input;
        const rgb = colorToRgbTriplet(input, '');
        if (rgb) return rgbTripletToHex(rgb, fallback || '#c8822a');
        return fallback || '#c8822a';
    }
    function getFacultyLuxuryPaletteState(facultyCode = getCurrentFacultyCode()) {
        const normalizedFaculty = String(facultyCode || 'ECON').toUpperCase();
        const fallbackPalette = getPaletteByKey(DEFAULT_HOME_VISUALS.paletteKey);
        let facultyProfile = null;
        try {
            if (typeof getFacultyProfile === 'function') facultyProfile = getFacultyProfile(normalizedFaculty) || null;
        } catch (e) {}
        const accent = sanitizeColorInput(facultyProfile?.color, fallbackPalette.accent || '#c8822a');
        const nav = sanitizeColorInput(facultyProfile?.navColor, '#091220');
        const accentRgb = colorToRgbTriplet(accent, colorToRgbTriplet(fallbackPalette.accent || '#c8822a'));
        const navRgb = colorToRgbTriplet(nav, '9,18,32');
        const accent2Rgb = blendRgbTriplets(accentRgb, '255,232,188', 0.42);
        return {
            facultyCode: normalizedFaculty,
            paletteKey: fallbackPalette.key,
            accent,
            accent2: rgbTripletToHex(accent2Rgb, fallbackPalette.accent2 || accent),
            accentRgb,
            accent2Rgb,
            nav,
            navRgb,
            shellStartRgb: blendRgbTriplets(navRgb, accentRgb, 0.26),
            shellEndRgb: blendRgbTriplets(navRgb, '4,7,13', 0.34),
            shellGlowRgb: accent2Rgb,
            topbarTintRgb: blendRgbTriplets(navRgb, accentRgb, 0.2),
            glassTintRgb: blendRgbTriplets(navRgb, accentRgb, 0.18),
            hazeRgb: blendRgbTriplets(accentRgb, accent2Rgb, 0.28)
        };
    }
    function isVisualPaletteScopedToFaculty(visuals, facultyCode = getCurrentFacultyCode()) {
        const scopedFaculty = String(visuals?.paletteFaculty || '').trim().toUpperCase();
        if (!scopedFaculty && (visuals?.paletteKey || visuals?.customPalette?.accent)) return true;
        if (scopedFaculty === GLOBAL_LUXURY_PALETTE_SCOPE || scopedFaculty === 'GLOBAL') return true;
        return scopedFaculty === String(facultyCode || '').trim().toUpperCase();
    }
    function resolveCustomPalette() {
        const facultyCode = getCurrentFacultyCode();
        const visuals = getDashboardVisuals();
        if (isVisualPaletteScopedToFaculty(visuals, facultyCode) && visuals.customPalette?.accent && visuals.customPalette?.accent2) {
            return visuals.customPalette;
        }
        try {
            if (String(localStorage.getItem('kiuLuxuryCustomPaletteFaculty') || '').toUpperCase() !== facultyCode) return null;
            const raw = localStorage.getItem('kiuLuxuryCustomPalette');
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            return null;
        }
    }
    function resolvePaletteKey() {
        const visuals = getDashboardVisuals();
        const stored = visuals?.paletteKey || localStorage.getItem('kiuLuxuryPalette') || localStorage.getItem('kiu-palette');
        if (stored === 'custom' || isBuiltInLuxuryPaletteKey(stored)) return stored;
        return visuals?.paletteKey || DEFAULT_HOME_VISUALS.paletteKey;
    }
    function applyPaletteValues(accent, accent2, persist, key) {
        const paletteClasses = ['obsidian-amber', 'slate-sapphire', 'pine-jade', 'burgundy-rose', 'sand-pearl', 'ink-orchid', 'ocean-teal'];
        paletteClasses.forEach((palette) => document.body.classList.remove(`palette-${palette}`));
        if (key && key !== 'custom' && paletteClasses.includes(key)) {
            document.body.classList.add(`palette-${key}`);
        }
        if (persist) {
            localStorage.setItem('kiuLuxuryPalette', key || 'custom');
            localStorage.setItem('kiuLuxuryPaletteFaculty', getCurrentFacultyCode());
            localStorage.setItem('kiu-palette', key);
        }
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            var _palTransVal = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
            window.queueLuxuryTransparencyRefresh(_palTransVal);
        }
        if (typeof window.__kiuApplyResolvedPalette === 'function') {
            window.__kiuApplyResolvedPalette();
            return;
        }
        const root = document.documentElement;
        root.style.setProperty('--lux-accent', accent);
        root.style.setProperty('--lux-accent-2', accent2);
        root.style.setProperty('--lux-accent-rgb', colorToRgbTriplet(accent));
        if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
            window.__kiuApplyLmsParticleTheme();
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
    }
    function applyPaletteKey(key, persist) {
        const palette = getPaletteByKey(key);
        if (persist) {
            localStorage.removeItem('kiuLuxuryCustomPalette');
            localStorage.removeItem('kiuLuxuryCustomPaletteFaculty');
            setDashboardVisuals({
                paletteKey: palette.key,
                paletteFaculty: getCurrentFacultyCode(),
                customPalette: null,
                accentColor: palette.accent,
                accentColor2: palette.accent2,
                glassTint: '',
                particleColor: '',
                lineColor: '',
                glowColor: '',
                hazeColor: ''
            });
        }
        applyPaletteValues(palette.accent, palette.accent2, persist, palette.key);
    }
    function applyCustomPalette(accent, accent2, persist) {
        if (persist) {
            localStorage.setItem('kiuLuxuryCustomPalette', JSON.stringify({ accent, accent2 }));
            localStorage.setItem('kiuLuxuryCustomPaletteFaculty', getCurrentFacultyCode());
            localStorage.setItem('kiu-palette', 'custom');
            setDashboardVisuals({
                paletteKey: 'custom',
                paletteFaculty: getCurrentFacultyCode(),
                customPalette: { accent, accent2 },
                accentColor: accent,
                accentColor2: accent2,
                glassTint: '',
                particleColor: '',
                lineColor: '',
                glowColor: '',
                hazeColor: ''
            });
        }
        applyPaletteValues(accent, accent2, persist, 'custom');
    }
    function applyResolvedPalette() {
        const root = document.documentElement;
        const facultyPalette = getFacultyLuxuryPaletteState(getCurrentFacultyCode());
        const visuals = getDashboardVisuals();
        const visualsAreScoped = isVisualPaletteScopedToFaculty(visuals, facultyPalette.facultyCode);
        const palette = getPaletteByKey(visualsAreScoped ? (visuals.paletteKey || facultyPalette.paletteKey) : facultyPalette.paletteKey);
        const custom = visualsAreScoped && visuals.customPalette?.accent ? visuals.customPalette : resolveCustomPalette();
        const lightMode = getThemeMode() === 'light';
        const accent = visualsAreScoped
            ? (visuals.accentColor || custom?.accent || palette.accent || facultyPalette.accent)
            : facultyPalette.accent;
        const accent2 = visualsAreScoped
            ? (visuals.accentColor2 || custom?.accent2 || palette.accent2 || facultyPalette.accent2)
            : facultyPalette.accent2;
        const accentRgb = colorToRgbTriplet(accent, facultyPalette.accentRgb);
        const accent2Rgb = colorToRgbTriplet(accent2, facultyPalette.accent2Rgb || accentRgb);
        const shellStartRgb = visualsAreScoped
            ? (lightMode
                ? blendRgbTriplets('248,240,229', accentRgb, 0.12)
                : blendRgbTriplets(facultyPalette.navRgb, accentRgb, 0.34))
            : facultyPalette.shellStartRgb;
        const shellEndRgb = visualsAreScoped
            ? (lightMode
                ? blendRgbTriplets('255,249,241', accent2Rgb, 0.06)
                : blendRgbTriplets('4,7,13', accentRgb, 0.18))
            : facultyPalette.shellEndRgb;
        const shellGlowRgb = visualsAreScoped
            ? blendRgbTriplets(accentRgb, accent2Rgb, 0.46)
            : facultyPalette.shellGlowRgb;
        const glassTint = visualsAreScoped && visuals.glassTint
            ? visuals.glassTint
            : (lightMode
                ? rgbTripletToHex(blendRgbTriplets('255,255,255', accent2Rgb, visualsAreScoped ? 0.12 : 0.16), '#eadfce')
                : (visualsAreScoped
                    ? rgbTripletToHex(blendRgbTriplets('10,16,28', accentRgb, 0.24), facultyPalette.nav || accent)
                    : facultyPalette.nav));
        const topbarTint = visualsAreScoped
            ? (lightMode
                ? rgbTripletToHex(blendRgbTriplets('246,237,226', accentRgb, 0.16), '#e6d8c6')
                : rgbTripletToHex(blendRgbTriplets('11,18,32', accentRgb, 0.24), facultyPalette.nav || accent))
            : (lightMode
                ? rgbTripletToHex(blendRgbTriplets('246,237,226', facultyPalette.accentRgb, 0.2), '#e6d8c6')
                : facultyPalette.nav);
        const particleColor = visualsAreScoped ? (visuals.particleColor || accent2) : facultyPalette.accent2;
        const lineColor = visualsAreScoped ? (visuals.lineColor || accent) : facultyPalette.accent;
        const glowColor = visualsAreScoped ? (visuals.glowColor || accent2) : facultyPalette.accent2;
        const hazeColor = visualsAreScoped ? (visuals.hazeColor || accent) : facultyPalette.accent;
        const lightBackdrop = lightMode
            ? buildLightModeBackdropTokens(accentRgb, accent2Rgb, {
                lineRgb: palette.lightLineRgb,
                particleRgb: palette.lightParticleRgb
            })
            : null;
        root.style.setProperty('--lux-accent', accent);
        root.style.setProperty('--lux-accent-2', accent2);
        root.style.setProperty('--lux-accent-rgb', accentRgb);
        root.style.setProperty('--lux-glass-tint-rgb', colorToRgbTriplet(glassTint, lightMode ? '246,239,229' : '16,23,38'));
        root.style.setProperty('--lux-topbar-tint-rgb', colorToRgbTriplet(topbarTint, lightMode ? '239,228,213' : '11,18,32'));
        root.style.setProperty('--lux-shell-start-rgb', shellStartRgb);
        root.style.setProperty('--lux-shell-end-rgb', shellEndRgb);
        root.style.setProperty('--lux-shell-glow-rgb', shellGlowRgb);
        root.style.setProperty('--lux-home-secondary-rgb', accent2Rgb);
        root.style.setProperty(
            '--lux-bg-particle-rgb',
            lightBackdrop ? lightBackdrop.particle : colorToRgbTriplet(particleColor, accent2Rgb)
        );
        root.style.setProperty(
            '--lux-bg-line-rgb',
            lightBackdrop ? lightBackdrop.line : colorToRgbTriplet(lineColor, accentRgb)
        );
        root.style.setProperty(
            '--lux-bg-glow-rgb',
            lightBackdrop ? lightBackdrop.glow : colorToRgbTriplet(glowColor, accent2Rgb)
        );
        root.style.setProperty(
            '--lux-bg-haze-rgb',
            lightBackdrop ? lightBackdrop.haze : colorToRgbTriplet(hazeColor, accentRgb)
        );
        root.style.setProperty('--kiu-blue', accent);
        root.style.setProperty('--kiu-dark-blue', rgbTripletToHex(shellEndRgb, accent));
        root.style.setProperty('--kiu-navy', rgbTripletToHex(shellEndRgb, accent));
        root.style.setProperty('--kiu-gradient-blue', `linear-gradient(135deg, ${accent} 0%, ${accent2} 100%)`);
        root.style.setProperty('--kiu-shell-gradient', lightMode
            ? `radial-gradient(circle at 16% 10%, rgba(${accentRgb}, 0.12), transparent 30%), radial-gradient(circle at 84% 82%, rgba(${accent2Rgb}, 0.10), transparent 28%), linear-gradient(180deg, #fffaf3 0%, #f4ede2 100%)`
            : `radial-gradient(circle at 12% 8%, rgba(${accentRgb}, 0.18), transparent 32%), radial-gradient(circle at 84% 80%, rgba(${accent2Rgb}, 0.12), transparent 30%), radial-gradient(circle at 50% -12%, rgba(${shellGlowRgb}, 0.10), transparent 42%), linear-gradient(180deg, rgba(${shellStartRgb}, 0.42), rgba(${shellEndRgb}, 0.78) 48%, rgba(4,7,13,0.98) 100%)`);
        document.body.dataset.luxFaculty = facultyPalette.facultyCode;
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency'));
        }
        if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
            window.__kiuApplyLmsParticleTheme();
        }
    }
    window.__kiuApplyResolvedPalette = typeof applyResolvedPalette === 'function'
        ? applyResolvedPalette
        : window.__kiuApplyResolvedPalette;
    function buildLuxuryTransparencyModel(value, lightMode = false) {
        const percentage = Math.max(0, Math.min(100, parseInt(value, 10) || 0));
        const fillRatio = typeof window.mapLuxuryTransparencyFillRatio === 'function'
            ? window.mapLuxuryTransparencyFillRatio(percentage)
            : (percentage + 1) / 101;
        const transparencyRatio = fillRatio;
        const colorFadeRatio = lightMode
            ? Math.max(0.40, Math.min(1, fillRatio * 0.92))
            : Math.max(0.01, Math.min(1, fillRatio * 0.92));
        return {
            percentage,
            transparencyRatio,
            fillRatio,
            colorFadeRatio,
            panelAlpha: lightMode
                ? Math.max(0.12, 0.12 + (fillRatio * 0.83))
                : Math.max(0.08, 0.08 + (fillRatio * 0.84)),
            raisedAlpha: lightMode
                ? 0.03 + (fillRatio * 0.16)
                : 0.02 + (fillRatio * 0.14),
            glassAlpha: lightMode
                ? 0.02 + (fillRatio * 0.10)
                : 0.015 + (fillRatio * 0.08),
            panelFillAlpha: lightMode
                ? 0.04 + (fillRatio * 0.20)
                : 0.03 + (fillRatio * 0.16),
            raisedFillAlpha: lightMode
                ? 0.02 + (fillRatio * 0.14)
                : 0.015 + (fillRatio * 0.12),
            utilityFillAlpha: lightMode
                ? 0.05 + (fillRatio * 0.22)
                : 0.04 + (fillRatio * 0.18),
            utilityAlpha: lightMode
                ? 0.18 + (fillRatio * 0.66)
                : 0.16 + (fillRatio * 0.70),
            topbarFillAlpha: lightMode
                ? 0.16 + (fillRatio * 0.62)
                : 0.14 + (fillRatio * 0.72),
            topbarRaisedAlpha: 0.04 + (fillRatio * 0.16),
            glassHighlightAlpha: lightMode
                ? 0.01 + (fillRatio * 0.04)
                : 0.006 + (fillRatio * 0.02),
            highTransparency: percentage <= 20
        };
    }
    window.__kiuBuildLuxuryTransparencyModel = typeof buildLuxuryTransparencyModel === 'function'
        ? buildLuxuryTransparencyModel
        : window.__kiuBuildLuxuryTransparencyModel;
    window.buildLuxuryTransparencyModel = typeof buildLuxuryTransparencyModel === 'function'
        ? buildLuxuryTransparencyModel
        : window.buildLuxuryTransparencyModel;
    function applyLuxuryTransparencyTokenState(tokenState = {}, options = {}) {
        const root = document.documentElement;
        const propertyMap = {
            '--lux-panel-alpha': tokenState.panelAlpha,
            '--lux-transparency-alpha': tokenState.fillRatio,
            '--lux-color-fade-alpha': tokenState.colorFadeRatio,
            '--lux-raised-alpha': tokenState.raisedAlpha,
            '--lux-glass-alpha': tokenState.glassAlpha,
            '--lux-panel-fill-alpha': tokenState.panelFillAlpha,
            '--lux-raised-fill-alpha': tokenState.raisedFillAlpha,
            '--lux-utility-fill-alpha': tokenState.utilityFillAlpha,
            '--lux-utility-alpha': tokenState.utilityAlpha,
            '--lux-topbar-fill-alpha': tokenState.topbarFillAlpha,
            '--lux-topbar-raised-alpha': tokenState.topbarRaisedAlpha,
            '--lux-glass-highlight-alpha': tokenState.glassHighlightAlpha
        };
        if (Object.prototype.hasOwnProperty.call(options, 'panelGlow')) propertyMap['--lux-panel-glow'] = options.panelGlow;
        if (Object.prototype.hasOwnProperty.call(options, 'glowScale')) propertyMap['--lux-glow-scale'] = options.glowScale;
        if (Object.prototype.hasOwnProperty.call(options, 'cardGlowAlpha')) propertyMap['--lux-card-glow-alpha'] = options.cardGlowAlpha;
        Object.entries(propertyMap).forEach(([name, value]) => {
            if (value == null) return;
            root.style.setProperty(name, String(value));
        });
    }
    window.__kiuApplyTransparencyTokenState = typeof applyLuxuryTransparencyTokenState === 'function'
        ? applyLuxuryTransparencyTokenState
        : window.__kiuApplyTransparencyTokenState;
    function ensureLuxuryHighTransparencyStyleElement() {
        let styleEl = document.getElementById('lux-high-trans-primer');
        if (!styleEl) {
            if (typeof window.__kiuThemePrimerAppendLateStyle === 'function') {
                window.__kiuThemePrimerAppendLateStyle('lux-high-trans-primer', ':root{}');
                styleEl = document.getElementById('lux-high-trans-primer');
            }
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = 'lux-high-trans-primer';
                styleEl.textContent = ':root{}';
                document.head.appendChild(styleEl);
            }
        }
        styleEl.media = 'all';
        if (!String(styleEl.textContent || '').trim()) styleEl.textContent = ':root{}';
        return styleEl;
    }
    function applyLuxuryHighTransparencyState(enabled, cssText = '') {
        const root = document.documentElement;
        if (enabled) {
            root.classList.add('lux-high-transparency');
            const styleEl = ensureLuxuryHighTransparencyStyleElement();
            if (cssText) styleEl.textContent = cssText;
            return;
        }
        root.classList.remove('lux-high-transparency');
        const styleEl = ensureLuxuryHighTransparencyStyleElement();
        styleEl.textContent = ':root{}';
        styleEl.media = 'all';
    }
    function applySharedLightModeRootTokens(mode) {
        if (typeof window.__kiuApplyThemePrimerLightModeTokens === 'function') {
            window.__kiuApplyThemePrimerLightModeTokens(mode);
            return;
        }
        const root = document.documentElement;
        if (mode === 'light') {
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
        ['--lux-bg', '--lux-bg-soft', '--lux-surface', '--lux-surface-2', '--lux-surface-3', '--lux-border', '--lux-border-strong', '--lux-text', '--lux-text-muted', '--lux-text-soft', '--lux-shadow']
            .forEach((name) => root.style.removeProperty(name));
    }
    window.__kiuApplyHighTransparencyState = typeof applyLuxuryHighTransparencyState === 'function'
        ? applyLuxuryHighTransparencyState
        : window.__kiuApplyHighTransparencyState;
    function queueLuxuryRefreshOperation(run) {
        window.clearTimeout(window.__luxTransparencyPaletteRefreshTimer);
        window.__luxTransparencyPaletteRefreshTimer = window.setTimeout(() => {
            window.__luxTransparencyPaletteRefreshTimer = null;
            if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(run);
            } else {
                run();
            }
        }, 0);
    }
    window.__kiuQueueLuxuryRefreshOperation = typeof queueLuxuryRefreshOperation === 'function'
        ? queueLuxuryRefreshOperation
        : window.__kiuQueueLuxuryRefreshOperation;
    function applyLuxuryTransparencyPreferenceState(percentage, transparencyRatio) {
        const normalizedPercentage = Math.max(0, Math.min(100, parseInt(percentage, 10) || 0));
        const normalizedRatio = Number.isFinite(Number(transparencyRatio))
            ? Number(transparencyRatio)
            : normalizedPercentage / 100;
        localStorage.setItem('kiuLuxurySurfaceTransparency', String(normalizedPercentage));
        localStorage.setItem('kiuLuxurySurfaceTransparencyValue', normalizedRatio.toFixed(2));
        document.documentElement.dataset.luxTransparency = String(normalizedPercentage);
    }
    window.__kiuApplyTransparencyPreferenceState = typeof applyLuxuryTransparencyPreferenceState === 'function'
        ? applyLuxuryTransparencyPreferenceState
        : window.__kiuApplyTransparencyPreferenceState;
    function applyAtmosphereSettings() {
        const root = document.documentElement;
        const particleQuality = getParticleQuality();
        const resolvedQuality = particleQuality === 'auto'
            ? (getLuxuryPerformanceTier(false) === 'high' ? 'high' : getLuxuryPerformanceTier(false) === 'efficient' ? 'low' : 'balanced')
            : particleQuality;
        const lightMode = getThemeMode() === 'light';
        const glowConfig = { glowScale: '1', buttonGlow: '0.44', panelGlow: '0.2' };
        const panelFillMin = lightMode ? 0.016 : 0.012;
        const raisedFillMin = lightMode ? 0.008 : 0.006;
        const utilityFillMin = lightMode ? 0.024 : 0.022;
        const topbarFillMin = lightMode ? 0.34 : 0.78;
        const topbarRaisedMin = lightMode ? 0.05 : 0.16;
        const backgroundAnimationsEnabled = areBackgroundAnimationsEnabled();
        // Initialize canvas sharpness for timetable glass quality
        if (typeof getParticleSharpness === 'function') {
            const sharpness = getParticleSharpness();
            const blurPx = ((100 - sharpness) / 100 * 1.0).toFixed(2);
            root.style.setProperty('--lux-canvas-sharpness-blur', blurPx + 'px');
        }
        root.style.setProperty('--lux-canvas-opacity', backgroundAnimationsEnabled ? '1' : '0');
        root.style.setProperty('--lux-overlay-opacity', '0');
        root.style.setProperty('--lux-page-haze-top', backgroundAnimationsEnabled ? '0' : '0');
        root.style.setProperty('--lux-page-haze-bottom', backgroundAnimationsEnabled ? '0' : '0');
        // Panel fill / glass blur are owned by updateTransparency — do not stomp them here.
        root.style.setProperty('--lux-topbar-fill-alpha', String(topbarFillMin));
        root.style.setProperty('--lux-topbar-raised-alpha', String(topbarRaisedMin));
        root.style.setProperty('--lux-button-glow', glowConfig.buttonGlow);
        var _savedTransVal = parseInt(
            getDashboardVisuals().surfaceTransparency
            || localStorage.getItem('kiuLuxurySurfaceTransparency')
            || DEFAULT_HOME_VISUALS.surfaceTransparency,
            10
        );
        var _transparencyModel = typeof window.buildLuxuryTransparencyModel === 'function'
            ? window.buildLuxuryTransparencyModel(_savedTransVal, lightMode)
            : null;
        var _panelA = _transparencyModel ? _transparencyModel.panelAlpha : (_savedTransVal >= 95 ? (lightMode ? 0.95 : 0.92) : Math.max(0.03, _savedTransVal / 100 * 0.92));
        var _isHighTrans2 = _transparencyModel ? _transparencyModel.highTransparency : _savedTransVal >= 80;
        const transparencyTokenState = _transparencyModel
            ? {
                ..._transparencyModel,
                panelAlpha: _panelA
            }
            : {
                panelAlpha: _panelA,
                fillRatio: Math.max(0, 1 - (_savedTransVal / 100)),
                colorFadeRatio: Math.max(0.01, Math.min(1, (Math.max(0, 1 - (_savedTransVal / 100))) * 0.92)),
                raisedAlpha: 0.012,
                glassAlpha: 0.006,
                panelFillAlpha: panelFillMin,
                raisedFillAlpha: raisedFillMin,
                utilityFillAlpha: utilityFillMin,
                utilityAlpha: lightMode ? 0.02 : 0.08,
                topbarFillAlpha: topbarFillMin,
                topbarRaisedAlpha: topbarRaisedMin,
                glassHighlightAlpha: lightMode ? 0.02 : 0.012
            };
        applyLuxuryTransparencyTokenState(transparencyTokenState, {
            panelGlow: _isHighTrans2 ? '0' : glowConfig.panelGlow,
            glowScale: _isHighTrans2 ? '0' : glowConfig.glowScale,
            cardGlowAlpha: _isHighTrans2 ? '0' : String(0.016)
        });
        root.style.setProperty('--lux-grid-row-height', `${HOME_GRID_ROW_HEIGHT}px`);
        document.body.dataset.luxBackgroundIntensity = resolvedQuality;
        document.body.dataset.luxParticleQuality = particleQuality;
        document.body.dataset.luxBackgroundAnimation = backgroundAnimationsEnabled ? 'on' : 'off';
    }
    function getThemeMode() {
        if (window.__KIU_FORCE_DARK_ROUTE__) return 'dark';
        const stored = String(getDashboardVisuals().themeMode || DEFAULT_HOME_VISUALS.themeMode).trim().toLowerCase();
        return stored === 'light' ? 'light' : 'dark';
    }
    function applyThemeMode(mode, persist) {
        const nextMode = mode === 'light' ? 'light' : 'dark';
        const root = document.documentElement;
        document.body.classList.toggle('lux-light-mode', nextMode === 'light');
        document.body.dataset.luxThemeMode = nextMode;
        root.classList.toggle('lux-light-mode', nextMode === 'light');
        root.dataset.luxThemeMode = nextMode;
        applySharedLightModeRootTokens(nextMode);
        if (persist) {
            localStorage.setItem('kiuLuxuryThemeMode', nextMode);
            setDashboardVisuals({ themeMode: nextMode });
        }
        applyResolvedPalette();
        // Re-apply transparency so inline backgrounds recalculate for the new mode
        if (typeof updateTransparency === 'function') {
            const saved = getDashboardVisuals().surfaceTransparency
                || localStorage.getItem('kiuLuxurySurfaceTransparency')
                || DEFAULT_HOME_VISUALS.surfaceTransparency;
            updateTransparency(parseInt(saved));
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
    }
    function sanitizeBackgroundMode(mode) {
        const normalized = String(mode || '').trim().toLowerCase();
        if (normalized === 'tunnel') return 'orbit';
        if (normalized === 'grid') return 'corners';
        if (normalized === 'constellation') return 'peak';
        if (normalized === 'aurora') return 'orbit';
        if (normalized === 'mesh') return 'corners';
        return BACKGROUND_MODES.some((item) => item.key === normalized) ? normalized : 'peak';
    }
    function areBackgroundAnimationsEnabled() {
        const scopeKey = getHomeScopeKey();
        const entry = getDashboardPreferenceEntry();
        const stored = String(localStorage.getItem('kiuLuxuryBackgroundAnimationsEnabled') || '').trim().toLowerCase();
        if (stored) {
            return !(stored === '0' || stored === 'false' || stored === 'off');
        }
        const scopedVisuals = entry.visualsByScope?.[scopeKey];
        if (scopedVisuals && typeof scopedVisuals.backgroundAnimationsEnabled === 'boolean') {
            return scopedVisuals.backgroundAnimationsEnabled;
        }
        if (
            entry.visuals
            && typeof entry.visuals === 'object'
            && Object.prototype.hasOwnProperty.call(entry.visuals, 'backgroundAnimationsEnabled')
            && typeof entry.visuals.backgroundAnimationsEnabled === 'boolean'
        ) {
            return entry.visuals.backgroundAnimationsEnabled;
        }
        return true;
    }
    function getBackgroundMode() {
        return sanitizeBackgroundMode(getDashboardVisuals().backgroundMode || DEFAULT_HOME_VISUALS.backgroundMode);
    }
    function setBackgroundAnimationsEnabled(enabled, persist = true) {
        const nextValue = enabled !== false;
        document.body.dataset.luxBackgroundAnimation = nextValue ? 'on' : 'off';
        if (persist) {
            localStorage.setItem('kiuLuxuryBackgroundAnimationsEnabled', nextValue ? '1' : '0');
            setDashboardVisuals({ backgroundAnimationsEnabled: nextValue });
        }
        applyAtmosphereSettings();
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
        showToast(nextValue ? 'Background animations on' : 'Background animations off');
    }
    function setBackgroundMode(mode, persist) {
        const validMode = sanitizeBackgroundMode(mode);
        document.body.dataset.luxBackgroundMode = validMode;
        if (persist) {
            localStorage.setItem('kiuLuxuryBackgroundMode', validMode);
            setDashboardVisuals({ backgroundMode: validMode });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground(validMode);
        }
        syncStudioUi();
        showToast(`Background: ${BACKGROUND_MODES.find((item) => item.key === validMode)?.label || validMode}`);
    }
    function getParticleMotion() {
        const raw = getDashboardVisuals().particleMotion ?? localStorage.getItem('kiuLuxuryParticleMotion') ?? DEFAULT_HOME_VISUALS.particleMotion;
        const value = Number(raw);
        if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleMotion;
        return Math.min(120, Math.max(0, Math.round(value)));
    }
    function setParticleMotion(value, persist = true) {
        const nextValue = Math.min(120, Math.max(0, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleMotion)));
        if (persist) {
            localStorage.setItem('kiuLuxuryParticleMotion', String(nextValue));
            setDashboardVisuals({ particleMotion: nextValue });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
    }
    function getParticleDensity() {
        const raw = getDashboardVisuals().particleDensity ?? localStorage.getItem('kiuLuxuryParticleDensity') ?? DEFAULT_HOME_VISUALS.particleDensity;
        const value = Number(raw);
        if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleDensity;
        return Math.min(100, Math.max(35, Math.round(value)));
    }
    function setParticleDensity(value, persist = true) {
        const nextValue = Math.min(100, Math.max(35, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleDensity)));
        if (persist) {
            localStorage.setItem('kiuLuxuryParticleDensity', String(nextValue));
            setDashboardVisuals({ particleDensity: nextValue });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
    }
    function getParticleAmount() {
        const raw = getDashboardVisuals().particleAmount ?? localStorage.getItem('kiuLuxuryParticleAmount') ?? DEFAULT_HOME_VISUALS.particleAmount;
        const value = Number(raw);
        if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleAmount;
        return Math.min(150, Math.max(50, Math.round(value)));
    }
    function setParticleAmount(value, persist = true) {
        const nextValue = Math.min(150, Math.max(50, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleAmount)));
        if (persist) {
            localStorage.setItem('kiuLuxuryParticleAmount', String(nextValue));
            setDashboardVisuals({ particleAmount: nextValue });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
    }
    function getParticleSharpness() {
        const raw = getDashboardVisuals().particleSharpness ?? localStorage.getItem('kiuLuxuryParticleSharpness') ?? DEFAULT_HOME_VISUALS.particleSharpness;
        const value = Number(raw);
        if (Number.isNaN(value)) return DEFAULT_HOME_VISUALS.particleSharpness;
        return Math.min(100, Math.max(0, Math.round(value)));
    }
    function setParticleSharpness(value, persist = true) {
        const nextValue = Math.min(100, Math.max(0, Math.round(Number(value) || DEFAULT_HOME_VISUALS.particleSharpness)));
        if (persist) {
            localStorage.setItem('kiuLuxuryParticleSharpness', String(nextValue));
            setDashboardVisuals({ particleSharpness: nextValue });
        }
        // Map 0-100 to blur 1.0px-0px (higher sharpness = less blur)
        const blurPx = ((100 - nextValue) / 100 * 1.0).toFixed(2);
        document.documentElement.style.setProperty('--lux-canvas-sharpness-blur', blurPx + 'px');
        syncStudioUi();
    }
    function getParticleQuality() {
        const stored = String(
            getDashboardVisuals().particleQuality ?? localStorage.getItem('kiuLuxuryParticleQuality') ?? DEFAULT_HOME_VISUALS.particleQuality
        ).trim().toLowerCase();
        return PARTICLE_QUALITY_OPTIONS.some((item) => item.key === stored) ? stored : DEFAULT_HOME_VISUALS.particleQuality;
    }
    function setParticleQuality(level, persist = true) {
        const nextLevel = PARTICLE_QUALITY_OPTIONS.some((item) => item.key === level) ? level : DEFAULT_HOME_VISUALS.particleQuality;
        document.body.dataset.luxParticleQuality = nextLevel;
        if (persist) {
            localStorage.setItem('kiuLuxuryParticleQuality', nextLevel);
            setDashboardVisuals({ particleQuality: nextLevel });
        }
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        syncStudioUi();
        showToast(`Particle quality: ${PARTICLE_QUALITY_OPTIONS.find((item) => item.key === nextLevel)?.label || nextLevel}`);
    }
    const DEFAULT_STUDIO_MIXER = {
        hA: 30,
        sA: 72,
        lA: 48,
        hB: 45,
        sB: 80,
        lB: 58,
        ratio: 50
    };
    function clampNumber(value, min, max, fallback) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(max, Math.max(min, numeric));
    }
    function sanitizeFogHexColor(value, fallback) {
        const normalized = String(value || '').trim();
        if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized.toLowerCase();
        return fallback;
    }
    function readStoredFogSettings() {
        try {
            const raw = localStorage.getItem('kiuLuxuryFogSettings');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch (error) {
            return null;
        }
    }
    function sanitizeFogSettings(value) {
        const source = value && typeof value === 'object' ? value : {};
        return {
            highlightColor: sanitizeFogHexColor(source.highlightColor, DEFAULT_FOG_SETTINGS.highlightColor),
            midtoneColor: sanitizeFogHexColor(source.midtoneColor, DEFAULT_FOG_SETTINGS.midtoneColor),
            lowlightColor: sanitizeFogHexColor(source.lowlightColor, DEFAULT_FOG_SETTINGS.lowlightColor),
            baseColor: sanitizeFogHexColor(source.baseColor, DEFAULT_FOG_SETTINGS.baseColor),
            blurFactor: clampNumber(source.blurFactor, 0, 1, DEFAULT_FOG_SETTINGS.blurFactor),
            speed: clampNumber(source.speed, 0, 3, DEFAULT_FOG_SETTINGS.speed),
            zoom: clampNumber(source.zoom, 0.2, 4, DEFAULT_FOG_SETTINGS.zoom)
        };
    }
    function getFogSettings() {
        const stored = readStoredFogSettings();
        const visuals = getDashboardVisuals();
        return sanitizeFogSettings(stored || visuals.fogSettings || DEFAULT_FOG_SETTINGS);
    }
    function refreshActiveFogBackground() {
        if (getBackgroundMode() !== 'fog') return;
        if (typeof window.__kiuRefreshLuxuryVantaFogBackground === 'function') {
            window.__kiuRefreshLuxuryVantaFogBackground();
            return;
        }
        if (typeof window.__kiuApplyLmsFogTheme === 'function') {
            window.__kiuApplyLmsFogTheme();
        }
    }
    function setFogSettings(patch, persist = true) {
        const nextSettings = sanitizeFogSettings({
            ...getFogSettings(),
            ...(patch && typeof patch === 'object' ? patch : {})
        });
        if (persist) {
            localStorage.setItem('kiuLuxuryFogSettings', JSON.stringify(nextSettings));
            setDashboardVisuals({ fogSettings: nextSettings });
        }
        refreshActiveFogBackground();
        syncStudioUi();
    }
    function applyFogPreset(preset, persist = true) {
        const colors = FOG_COLOR_PRESETS[preset === 'light' ? 'light' : 'dark'];
        if (!colors) return;
        setFogSettings(colors, persist);
        showToast(`Fog preset: ${preset === 'light' ? 'Light' : 'Dark'}`);
    }
    function normalizeFogProfileBank(value) {
        return String(value || '').trim().toLowerCase() === 'light' ? 'light' : 'dark';
    }
    function defaultFogProfileMotion() {
        return {
            blurFactor: DEFAULT_FOG_SETTINGS.blurFactor,
            speed: DEFAULT_FOG_SETTINGS.speed,
            zoom: DEFAULT_FOG_SETTINGS.zoom
        };
    }
    function buildDefaultLightFogProfiles() {
        const motion = defaultFogProfileMotion();
        const light = FOG_COLOR_PRESETS.light;
        return [
            {
                id: 'fog-light-soft-dawn',
                name: 'Soft Dawn',
                themeMode: 'light',
                settings: sanitizeFogSettings({
                    highlightColor: '#fff1f2',
                    midtoneColor: light.midtoneColor,
                    lowlightColor: '#bae6fd',
                    baseColor: light.baseColor,
                    ...motion
                })
            },
            {
                id: 'fog-light-pale-mist',
                name: 'Pale Mist',
                themeMode: 'light',
                settings: sanitizeFogSettings({
                    highlightColor: '#e0f2fe',
                    midtoneColor: '#7dd3fc',
                    lowlightColor: '#fef08a',
                    baseColor: '#f8fafc',
                    ...motion
                })
            },
            {
                id: 'fog-light-sun-haze',
                name: 'Sun Haze',
                themeMode: 'light',
                settings: sanitizeFogSettings({
                    highlightColor: light.highlightColor,
                    midtoneColor: '#fde68a',
                    lowlightColor: light.lowlightColor,
                    baseColor: light.baseColor,
                    ...motion
                })
            }
        ];
    }
    function sanitizeFogProfile(entry) {
        if (!entry || typeof entry !== 'object') return null;
        const id = String(entry.id || '').trim();
        const name = String(entry.name || '').trim();
        if (!id || !name) return null;
        return {
            id,
            name,
            themeMode: normalizeFogProfileBank(entry.themeMode),
            settings: sanitizeFogSettings(entry.settings)
        };
    }
    function readStoredFogProfiles() {
        try {
            const raw = localStorage.getItem('kiuLuxuryFogProfiles');
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            return null;
        }
    }
    function writeStoredFogProfiles(profiles) {
        try {
            localStorage.setItem('kiuLuxuryFogProfiles', JSON.stringify(Array.isArray(profiles) ? profiles : []));
        } catch (error) {
            return false;
        }
        return true;
    }
    function syncFogProfilesStorage(profiles) {
        return writeStoredFogProfiles(
            (Array.isArray(profiles) ? profiles : [])
                .map(sanitizeFogProfile)
                .filter(Boolean)
        );
    }
    function fogProfileSettingsEqual(left, right) {
        const a = sanitizeFogSettings(left);
        const b = sanitizeFogSettings(right);
        return a.highlightColor === b.highlightColor
            && a.midtoneColor === b.midtoneColor
            && a.lowlightColor === b.lowlightColor
            && a.baseColor === b.baseColor
            && a.blurFactor === b.blurFactor
            && a.speed === b.speed
            && a.zoom === b.zoom;
    }
    function mergeFogProfileStores(entryProfiles, storedProfiles) {
        const storedById = new Map();
        storedProfiles.forEach((profile) => {
            const normalized = sanitizeFogProfile(profile);
            if (normalized) storedById.set(normalized.id, normalized);
        });
        const entryById = new Map();
        entryProfiles.forEach((profile) => {
            const normalized = sanitizeFogProfile(profile);
            if (normalized) entryById.set(normalized.id, normalized);
        });
        const merged = entryProfiles.map((profile) => {
            const normalized = sanitizeFogProfile(profile);
            if (!normalized) return null;
            const stored = storedById.get(normalized.id);
            if (!stored) return normalized;
            if (!fogProfileSettingsEqual(normalized.settings, stored.settings)
                || normalized.name !== stored.name
                || normalized.themeMode !== stored.themeMode) {
                return stored;
            }
            return normalized;
        }).filter(Boolean);
        storedProfiles.forEach((profile) => {
            const normalized = sanitizeFogProfile(profile);
            if (!normalized || entryById.has(normalized.id)) return;
            merged.push(normalized);
        });
        return merged;
    }
    function ensureFogProfileStore() {
        const entry = getDashboardPreferenceEntry();
        const entryProfiles = (Array.isArray(entry.fogProfiles) ? entry.fogProfiles : [])
            .map(sanitizeFogProfile)
            .filter(Boolean);
        const storedRaw = readStoredFogProfiles();
        const storedProfiles = storedRaw
            ? storedRaw.map(sanitizeFogProfile).filter(Boolean)
            : [];
        let merged = mergeFogProfileStores(entryProfiles, storedProfiles);
        const hasLightBank = merged.some((profile) => profile.themeMode === 'light');
        if (!hasLightBank) {
            merged = [...merged, ...buildDefaultLightFogProfiles()];
        }
        const entryJson = JSON.stringify(entryProfiles);
        const mergedJson = JSON.stringify(merged);
        if (entryJson !== mergedJson) {
            updateDashboardPreferenceEntry((nextEntry) => {
                nextEntry.fogProfiles = merged;
            }, { persist: true });
        }
        syncFogProfilesStorage(merged);
        return getDashboardPreferenceEntry().fogProfiles || merged;
    }
    function getAllFogProfiles() {
        return ensureFogProfileStore()
            .map(sanitizeFogProfile)
            .filter(Boolean);
    }
    function getFogProfiles(bank) {
        const activeBank = normalizeFogProfileBank(bank ?? getThemeMode());
        return getAllFogProfiles().filter((profile) => profile.themeMode === activeBank);
    }
    function slugFogProfileName(name) {
        return String(name || 'profile').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'profile';
    }
    function saveFogProfile(name, bank) {
        const trimmed = String(name || '').trim();
        if (!trimmed) return null;
        const profile = {
            id: `fog-${slugFogProfileName(trimmed)}-${Date.now().toString(36)}`,
            name: trimmed,
            themeMode: normalizeFogProfileBank(bank ?? getThemeMode()),
            settings: sanitizeFogSettings(getFogSettings())
        };
        updateDashboardPreferenceEntry((entry) => {
            const store = Array.isArray(entry.fogProfiles) ? entry.fogProfiles : [];
            entry.fogProfiles = [...store, profile];
            syncFogProfilesStorage(entry.fogProfiles);
        }, { persist: true });
        showToast(`Fog profile saved: ${trimmed}`);
        return profile;
    }
    function applyFogProfile(id) {
        const profileId = String(id || '').trim();
        if (!profileId) return false;
        const profile = getAllFogProfiles().find((item) => item.id === profileId);
        if (!profile) return false;
        setFogSettings(profile.settings, true);
        showToast(`Fog profile applied: ${profile.name}`);
        return true;
    }
    function deleteFogProfile(id) {
        const profileId = String(id || '').trim();
        if (!profileId) return false;
        const profile = getAllFogProfiles().find((item) => item.id === profileId);
        if (!profile) return false;
        updateDashboardPreferenceEntry((entry) => {
            entry.fogProfiles = (entry.fogProfiles || []).filter((item) => item.id !== profileId);
            syncFogProfilesStorage(entry.fogProfiles);
        }, { persist: true });
        showToast(`Fog profile removed: ${profile.name}`);
        return true;
    }
    function updateFogProfile(id, patch = {}) {
        const profileId = String(id || '').trim();
        if (!profileId) return null;
        const existing = getAllFogProfiles().find((item) => item.id === profileId);
        if (!existing) return null;
        const name = String(patch.name ?? existing.name).trim();
        if (!name) return null;
        const nextProfile = {
            id: profileId,
            name,
            themeMode: existing.themeMode,
            settings: sanitizeFogSettings(patch.settings ?? existing.settings)
        };
        updateDashboardPreferenceEntry((entry) => {
            if (!Array.isArray(entry.fogProfiles)) entry.fogProfiles = [];
            const index = entry.fogProfiles.findIndex((item) => item.id === profileId);
            if (index >= 0) entry.fogProfiles[index] = nextProfile;
            else entry.fogProfiles.push(nextProfile);
            syncFogProfilesStorage(entry.fogProfiles);
        }, { persist: true });
        showToast(`Fog profile updated: ${name}`);
        return nextProfile;
    }
    function reorderFogProfiles(orderedIds, bank) {
        const ids = Array.isArray(orderedIds)
            ? orderedIds.map((id) => String(id || '').trim()).filter(Boolean)
            : [];
        if (!ids.length) return false;
        const activeBank = normalizeFogProfileBank(bank ?? getThemeMode());
        const allProfiles = getAllFogProfiles();
        const bankProfiles = allProfiles.filter((profile) => profile.themeMode === activeBank);
        if (ids.length !== bankProfiles.length) return false;
        const byId = new Map(bankProfiles.map((profile) => [profile.id, profile]));
        if (ids.some((id) => !byId.has(id))) return false;
        const reorderedQueue = ids.map((id) => byId.get(id));
        const queue = [...reorderedQueue];
        const nextProfiles = allProfiles.map((profile) => (
            profile.themeMode === activeBank ? queue.shift() : profile
        ));
        updateDashboardPreferenceEntry((entry) => {
            entry.fogProfiles = nextProfiles;
            syncFogProfilesStorage(entry.fogProfiles);
        }, { persist: true });
        return true;
    }
    function findMatchingFogProfileId(settings, bank) {
        const normalized = sanitizeFogSettings(settings);
        const match = getFogProfiles(bank).find((profile) => {
            const stored = profile.settings;
            return stored.highlightColor === normalized.highlightColor
                && stored.midtoneColor === normalized.midtoneColor
                && stored.lowlightColor === normalized.lowlightColor
                && stored.baseColor === normalized.baseColor
                && stored.blurFactor === normalized.blurFactor
                && stored.speed === normalized.speed
                && stored.zoom === normalized.zoom;
        });
        return match?.id || '';
    }
    function sanitizeStudioMixerState(value) {
        const source = value || {};
        return {
            hA: clampNumber(source.hA, 0, 360, DEFAULT_STUDIO_MIXER.hA),
            sA: clampNumber(source.sA, 0, 100, DEFAULT_STUDIO_MIXER.sA),
            lA: clampNumber(source.lA, 20, 80, DEFAULT_STUDIO_MIXER.lA),
            hB: clampNumber(source.hB, 0, 360, DEFAULT_STUDIO_MIXER.hB),
            sB: clampNumber(source.sB, 0, 100, DEFAULT_STUDIO_MIXER.sB),
            lB: clampNumber(source.lB, 20, 80, DEFAULT_STUDIO_MIXER.lB),
            ratio: clampNumber(source.ratio, 0, 100, DEFAULT_STUDIO_MIXER.ratio)
        };
    }
    function getStudioMixerState() {
        const stateMixer = getDashboardVisuals().mixerState;
        if (stateMixer) {
            return sanitizeStudioMixerState(stateMixer);
        }
        try {
            const raw = localStorage.getItem('kiuLuxuryMixerState');
            return sanitizeStudioMixerState(raw ? JSON.parse(raw) : DEFAULT_STUDIO_MIXER);
        } catch (e) {
            return { ...DEFAULT_STUDIO_MIXER };
        }
    }
    function setStudioMixerState(state, persist) {
        const nextState = sanitizeStudioMixerState(state);
        if (persist) {
            localStorage.setItem('kiuLuxuryMixerState', JSON.stringify(nextState));
            setDashboardVisuals({ mixerState: nextState });
        }
        return nextState;
    }
    function readStudioMixerInputs() {
        return sanitizeStudioMixerState({
            hA: document.getElementById('lux-hA')?.value,
            sA: document.getElementById('lux-sA')?.value,
            lA: document.getElementById('lux-lA')?.value,
            hB: document.getElementById('lux-hB')?.value,
            sB: document.getElementById('lux-sB')?.value,
            lB: document.getElementById('lux-lB')?.value,
            ratio: document.getElementById('lux-mix-ratio')?.value
        });
    }
    function writeStudioMixerInputs(state) {
        const nextState = sanitizeStudioMixerState(state);
        const bindings = {
            'lux-hA': nextState.hA,
            'lux-sA': nextState.sA,
            'lux-lA': nextState.lA,
            'lux-hB': nextState.hB,
            'lux-sB': nextState.sB,
            'lux-lB': nextState.lB,
            'lux-mix-ratio': nextState.ratio
        };
        Object.entries(bindings).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.value = String(value);
        });
        return nextState;
    }
    const getRoleStats = (...args) => window.getRoleStats(...args);
    const getDomainSafe = (...args) => window.getDomainSafe(...args);
    const cleanupUiText = (...args) => window.cleanupUiText(...args);
    const parseTimeMinutes = (...args) => window.parseTimeMinutes(...args);
    const formatRelativeTime = (...args) => window.formatRelativeTime(...args);
    const getTermLabel = (...args) => window.getTermLabel(...args);
    const getSubjectLabel = (...args) => window.getSubjectLabel(...args);
    const sortScheduleItems = (...args) => window.sortScheduleItems(...args);
    const getOrdersSnapshot = (...args) => window.getOrdersSnapshot(...args);
    const getStudentPerformanceMetric = (...args) => window.getStudentPerformanceMetric(...args);
    const getNotificationSnapshot = (...args) => window.getNotificationSnapshot(...args);
    const getRecentHomeUpdates = (...args) => window.getRecentHomeUpdates(...args);
    const getMessengerSnapshot = (...args) => window.getMessengerSnapshot(...args);
    const getStudentScheduleRows = (...args) => window.getStudentScheduleRows(...args);
    const getFacultyScheduleRows = (...args) => window.getFacultyScheduleRows(...args);
    const formatCountLabel = (...args) => window.formatCountLabel(...args);
    const getRoleActions = (...args) => window.getRoleActions(...args);
    const getRoleShortcuts = (...args) => window.getRoleShortcuts(...args);
    const buildHomeModel = (...args) => window.buildHomeModel(...args);
    const buildHomeContext = (...args) => window.buildHomeContext(...args);
    function normalizeWidgetSpan(value, fallback = 6) {
        const allowed = [3, 4, 6, 8, 12];
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return allowed.reduce((closest, option) => (
            Math.abs(option - numeric) < Math.abs(closest - numeric) ? option : closest
        ), fallback);
    }
    function getRoleDefaultWidgetOrder(role) {
        const map = {
            student: ['alert', 'hero', 'summary', 'focus', 'quick', 'updates', 'column-0', 'column-1', 'column-2'],
            professor: ['alert', 'hero', 'quick', 'summary', 'focus', 'updates', 'column-0', 'column-1', 'column-2'],
            ta: ['alert', 'hero', 'summary', 'quick', 'focus', 'updates', 'column-0', 'column-1', 'column-2'],
            admin: ['alert', 'hero', 'admin-ops', 'summary', 'focus', 'updates', 'quick', 'column-0', 'column-1', 'column-2'],
            student_service: ['alert', 'hero', 'summary', 'focus', 'quick', 'updates', 'column-0', 'column-1', 'column-2']
        };
        return map[role] || map.student;
    }
    function sortWidgetsForRole(widgets, role) {
        const order = getRoleDefaultWidgetOrder(role);
        return (widgets || []).slice().sort((a, b) => {
            const aIndex = order.indexOf(a.id);
            const bIndex = order.indexOf(b.id);
            if (aIndex === -1 && bIndex === -1) return String(a.label || a.id).localeCompare(String(b.label || b.id));
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;
            return aIndex - bIndex;
        });
    }
    function getShortcutDestinationOptions(role = getEffectiveRole()) {
        const allowed = typeof getAllowedPagesForRole === 'function'
            ? Array.from(getAllowedPagesForRole(role) || [])
            : Object.keys(PAGE_LABELS);
        return allowed
            .filter((pageId) => PAGE_LABELS[pageId] && pageId !== 'home')
            .map((pageId) => ({ pageId, label: PAGE_LABELS[pageId] }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }
    function sanitizeShortcutDefinition(definition, role = getEffectiveRole()) {
        if (!definition || typeof definition !== 'object') return null;
        const destinations = getShortcutDestinationOptions(role).map((item) => item.pageId);
        const fallbackPage = destinations[0] || 'home';
        const pageId = destinations.includes(definition.pageId) ? definition.pageId : fallbackPage;
        return {
            id: String(definition.id || `shortcut-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
            type: 'shortcut',
            pageId,
            label: cleanupUiText(definition.label, 'Custom Shortcut').slice(0, 48),
            copy: cleanupUiText(definition.copy, 'Open this workspace quickly from your dashboard.').slice(0, 120),
            icon: cleanupUiText(definition.icon, 'fas fa-link'),
            tone: ['warm', 'royal', 'support', 'ink', 'calm', 'default'].includes(definition.tone) ? definition.tone : 'default',
            meta: cleanupUiText(definition.meta, 'Shortcut').slice(0, 32),
            status: cleanupUiText(definition.status, 'Open workspace').slice(0, 48),
            progress: clampPercent(definition.progress ?? 58, 58),
            span: normalizeWidgetSpan(definition.span, 4),
            visible: definition.visible !== false,
            removable: true,
            custom: true,
            critical: false
        };
    }
    function getSavedCustomShortcuts(role = getEffectiveRole()) {
        const items = getDashboardPreferenceEntry().customShortcutsByRole?.[role];
        if (!Array.isArray(items)) return [];
        return items.map((item) => sanitizeShortcutDefinition(item, role)).filter(Boolean);
    }
    function resolveHomeLayout(role, model, overrideLayout = null, overrideShortcuts = null) {
        const resolved = [];
        const shortcuts = Array.isArray(overrideShortcuts)
            ? overrideShortcuts.map((item) => sanitizeShortcutDefinition(item, role)).filter(Boolean)
            : getSavedCustomShortcuts(role);
        const baseWidgets = buildHomeWidgetDefinitions(role, model, shortcuts);
        const widgetMap = new Map(baseWidgets.map((widget) => [widget.id, widget]));
        const savedLayout = Array.isArray(overrideLayout)
            ? overrideLayout
            : getDashboardPreferenceEntry().layoutsByRole?.[role];
        (Array.isArray(savedLayout) ? savedLayout : []).forEach((item) => {
            const base = widgetMap.get(item?.id);
            if (!base) return;
            resolved.push({
                ...base,
                span: normalizeWidgetSpan(item.span, base.span),
                visible: item.visible !== false
            });
            widgetMap.delete(item.id);
        });
        sortWidgetsForRole(Array.from(widgetMap.values()), role).forEach((widget) => {
            resolved.push({
                ...widget,
                span: normalizeWidgetSpan(widget.span, widget.span),
                visible: widget.visible !== false
            });
        });
        const allowedShortcutIds = new Set(shortcuts.map((item) => item.id));
        return resolved.filter((widget) => widget.type !== 'shortcut' || allowedShortcutIds.has(widget.id));
    }
    function serializeHomeLayout(layout) {
        return (layout || []).map((widget) => ({
            id: widget.id,
            span: normalizeWidgetSpan(widget.span, 6),
            visible: widget.visible !== false
        }));
    }
    function serializeCustomShortcuts(shortcuts, role = getEffectiveRole()) {
        return (shortcuts || [])
            .map((item) => sanitizeShortcutDefinition(item, role))
            .filter(Boolean)
            .map((item) => ({
                id: item.id,
                pageId: item.pageId,
                label: item.label,
                copy: item.copy,
                icon: item.icon,
                tone: item.tone,
                meta: item.meta,
                status: item.status,
                progress: item.progress,
                span: item.span,
                visible: item.visible !== false
            }));
    }
    function getWorkingHomeLayout(role, model) {
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role && Array.isArray(HOME_EDITOR_STATE.draftLayout)) {
            return HOME_EDITOR_STATE.draftLayout;
        }
        return resolveHomeLayout(role, model);
    }
    function ensureHomeEditorDraft(role, model) {
        HOME_EDITOR_STATE.editing = true;
        HOME_EDITOR_STATE.role = role;
        HOME_EDITOR_STATE.draftCustomShortcuts = getSavedCustomShortcuts(role);
        HOME_EDITOR_STATE.draftLayout = resolveHomeLayout(role, model, null, HOME_EDITOR_STATE.draftCustomShortcuts).map((item) => ({ ...item }));
    }
    function openHomeEditor(role = getEffectiveRole(), model = buildHomeModel(role)) {
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role) {
            stopHomeEditor({ refresh: true });
            return;
        }
        if (typeof window.buildHomeWidgetDefinitions !== 'function') {
            ensureLuxuryHomeDashboardBundle().then((loaded) => {
                if (!loaded || typeof window.buildHomeWidgetDefinitions !== 'function') return;
                openHomeEditor(role, model);
            }).catch(() => null);
            return;
        }
        ensureHomeEditorDraft(role, model);
        applyPortalPageState();
        renderHomeShell();
        if (typeof syncTopbar === 'function') syncTopbar();
    }
    function stopHomeEditor({ message = '', refresh = true } = {}) {
        clearHomeEditorState();
        if (message) showToast(message);
        if (refresh) {
            applyPortalPageState();
            renderHomeShell();
            if (typeof syncTopbar === 'function') syncTopbar();
        }
    }
    function saveHomeEditor(role) {
        updateDashboardPreferenceEntry((entry) => {
            entry.layoutsByRole[role] = serializeHomeLayout(HOME_EDITOR_STATE.draftLayout);
            entry.customShortcutsByRole[role] = serializeCustomShortcuts(HOME_EDITOR_STATE.draftCustomShortcuts, role);
        }, { persist: true });
        stopHomeEditor({ message: `${ROLE_LABELS[role] || 'Dashboard'} saved.` });
        syncAll();
    }
    function resetCurrentRoleLayoutDraft(role, model) {
        HOME_EDITOR_STATE.draftCustomShortcuts = [];
        HOME_EDITOR_STATE.draftLayout = resolveHomeLayout(role, model, [], []).map((item) => ({ ...item }));
        renderHomeShell();
        showToast(`${ROLE_LABELS[role] || 'Dashboard'} reset to default layout.`);
    }
    function updateDraftWidget(id, mutator) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout)) return;
        HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((widget) => {
            if (widget.id !== id) return widget;
            const next = { ...widget };
            mutator(next);
            next.span = normalizeWidgetSpan(next.span, widget.span);
            return next;
        });
        renderHomeShell();
    }
    function moveDraftWidget(sourceId, targetId) {
        if (!HOME_EDITOR_STATE.editing || !Array.isArray(HOME_EDITOR_STATE.draftLayout) || sourceId === targetId) return;
        const next = HOME_EDITOR_STATE.draftLayout.slice();
        const fromIndex = next.findIndex((widget) => widget.id === sourceId);
        const toIndex = next.findIndex((widget) => widget.id === targetId);
        if (fromIndex === -1 || toIndex === -1) return;
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        HOME_EDITOR_STATE.draftLayout = next;
        renderHomeShell();
    }
    function hideDraftWidget(widget) {
        if (!widget) return;
        if (widget.critical && !window.confirm(`Hide "${widget.label}" from this role dashboard? You can restore it later from Add Widgets.`)) return;
        if (widget.type === 'shortcut') {
            HOME_EDITOR_STATE.draftCustomShortcuts = HOME_EDITOR_STATE.draftCustomShortcuts.filter((item) => item.id !== widget.id);
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.filter((item) => item.id !== widget.id);
        } else {
            HOME_EDITOR_STATE.draftLayout = HOME_EDITOR_STATE.draftLayout.map((item) => (
                item.id === widget.id ? { ...item, visible: false } : item
            ));
        }
        renderHomeShell();
    }
    function restoreDraftWidget(widgetId, role, model) {
        const defaults = buildHomeWidgetDefinitions(role, model);
        const found = defaults.find((item) => item.id === widgetId);
        if (!found) return;
        const existing = HOME_EDITOR_STATE.draftLayout.find((item) => item.id === widgetId);
        if (existing) {
            updateDraftWidget(widgetId, (widget) => {
                widget.visible = true;
                widget.span = found.span;
            });
            return;
        }
        HOME_EDITOR_STATE.draftLayout.push({ ...found, visible: true });
        renderHomeShell();
    }
    function createDraftShortcut(role, values) {
        const shortcut = sanitizeShortcutDefinition(values, role);
        if (!shortcut) return;
        HOME_EDITOR_STATE.draftCustomShortcuts = [...HOME_EDITOR_STATE.draftCustomShortcuts, shortcut];
        HOME_EDITOR_STATE.draftLayout.push({ ...shortcut });
        renderHomeShell();
        showToast(`Added shortcut: ${shortcut.label}`);
    }
    function scheduleExamsRouteBackgroundRefresh() {
        let attempts = 0;
        const run = () => {
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
                return;
            }
            if (attempts < 24) {
                attempts += 1;
                window.setTimeout(run, 50);
            }
        };
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(run, { timeout: 240 });
            return;
        }
        window.setTimeout(run, 120);
    }
    function scheduleOrdersRouteBackgroundRefresh() {
        scheduleExamsRouteBackgroundRefresh();
    }
    function scheduleLibraryRouteBackgroundRefresh() {
        scheduleExamsRouteBackgroundRefresh();
    }
    function ensureShell() {
        let createdCanvas = false;
        const onExamsRoute = document.body?.classList?.contains('lux-route-exams');
        const onOrdersRoute = document.body?.classList?.contains('lux-route-orders');
        const onLibraryRoute = document.body?.classList?.contains('lux-route-library');
        if (!document.getElementById('lux-bg-fog')) {
            const fogMount = document.createElement('div');
            fogMount.id = 'lux-bg-fog';
            fogMount.setAttribute('aria-hidden', 'true');
            document.body.prepend(fogMount);
        }
        if (!document.getElementById('lux-bg-canvas')) {
            const canvas = document.createElement('canvas');
            canvas.id = 'lux-bg-canvas';
            document.body.prepend(canvas);
            createdCanvas = true;
        }
        if (!document.getElementById('lux-bg-overlay')) {
            const overlay = document.createElement('div');
            overlay.id = 'lux-bg-overlay';
            document.body.prepend(overlay);
        }
        if (onExamsRoute) scheduleExamsRouteBackgroundRefresh();
        else if (onOrdersRoute) scheduleOrdersRouteBackgroundRefresh();
        else if (onLibraryRoute) scheduleLibraryRouteBackgroundRefresh();
        else if (createdCanvas && typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        if (!document.getElementById('lux-shell')) {
            const shell = document.createElement('aside');
            shell.id = 'lux-shell';
            shell.innerHTML = `
                <header class="lux-shell-head">
                    <button class="lux-secondary-btn lux-sidebar-close-btn" id="lux-sidebar-close" type="button" aria-pressed="false" aria-label="Hide navigation">
                        <i class="fas fa-sidebar" aria-hidden="true"></i>
                        <span class="lux-sidebar-close-label">Hide nav</span>
                    </button>
                </header>
                <div class="lux-nav" id="lux-nav"></div>
                <div class="lux-shell-footer">
                    <div class="lux-avatar" id="lux-avatar">KI</div>
                    <div class="lux-shell-footer-copy">
                        <div class="lux-user-name" id="lux-user-name">Portal User</div>
                        <div class="lux-user-role" id="lux-user-role">University Portal</div>
                    </div>
                </div>
            `;
            document.body.appendChild(shell);
        }

    function ensureTopbarSoftChrome(topbar = document.getElementById('lux-topbar')) {
        if (!topbar) return;
        if (document.body?.classList?.contains('lux-page-bare')) return;
        const shell = topbar.querySelector('.lux-topbar-shell');
        if (shell) {
            shell.classList.add('lux-soft-chrome', 'lux-panel');
            shell.style.removeProperty('background');
            shell.style.removeProperty('background-color');
            shell.style.removeProperty('backdrop-filter');
            shell.style.removeProperty('-webkit-backdrop-filter');
        }
        topbar.querySelectorAll('.lux-search, .lux-picker-btn, .lux-icon-btn, .lux-user-chip').forEach((el) => {
            el.classList.add('lux-soft-chrome');
            el.style.removeProperty('background');
            el.style.removeProperty('background-color');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
        });
        topbar.querySelectorAll('.lux-search input').forEach((el) => {
            el.style.removeProperty('background');
            el.style.removeProperty('background-color');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
        });
    }

        if (!document.getElementById('lux-topbar')) {
            const topbar = document.createElement('div');
            topbar.id = 'lux-topbar';
            topbar.innerHTML = `
                <div class="lux-topbar-shell lux-soft-chrome lux-panel">
                    <div class="lux-topbar-main">
                        <button class="lux-secondary-btn lux-sidebar-toggle-btn" id="lux-sidebar-toggle" type="button" aria-pressed="false" title="Show navigation">
                            <i class="fas fa-sidebar"></i>
                            <span class="lux-sidebar-toggle-label">Hide nav</span>
                        </button>
                        <div class="lux-breadcrumb">KIU <i class="fas fa-chevron-right"></i> <strong id="lux-breadcrumb-page">Dashboard</strong></div>
                        <div class="lux-search lux-soft-chrome">
                            <i class="fas fa-search"></i>
                            <input id="lux-search-input" type="text" placeholder="Search modules, staff, documents, requests...">
                        </div>
                    </div>
                    <div class="lux-topbar-spacer"></div>
                    <div class="lux-topbar-actions">
                        <div class="lux-picker-wrap" data-picker-wrap="faculty">
                            <button class="lux-picker-btn lux-soft-chrome" id="lux-faculty-picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="lux-picker-caption">Faculty</span>
                                <strong id="lux-faculty-picker-value">Faculty</strong>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <div class="lux-picker-wrap" data-picker-wrap="role">
                            <button class="lux-picker-btn lux-soft-chrome" id="lux-role-picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="lux-picker-caption">View</span>
                                <strong id="lux-role-picker-value">Workspace</strong>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        <button class="lux-secondary-btn lux-topbar-editor-btn" id="lux-dashboard-edit-btn" type="button" hidden title="Customize the home dashboard">
                            <i class="fas fa-sliders-h"></i>
                            <span id="lux-dashboard-edit-label">Customize</span>
                        </button>
                        <button class="lux-icon-btn lux-soft-chrome" id="lux-palette-btn" type="button" title="Open colour and motion studio">
                            <i class="fas fa-palette"></i>
                        </button>
                        <div class="lux-utility-wrap">
                            <button class="lux-icon-btn lux-soft-chrome" id="lux-notification-btn" type="button" title="Notifications">
                                <i class="far fa-bell"></i>
                                <span class="lux-icon-badge" id="lux-notification-badge">0</span>
                            </button>
                        </div>
                        <div class="lux-utility-wrap">
                            <button class="lux-icon-btn lux-soft-chrome" id="lux-chat-btn" type="button" title="Messenger">
                                <i class="fas fa-comments"></i>
                                <span class="lux-icon-badge" id="lux-chat-badge">0</span>
                            </button>
                        </div>
                        <button class="lux-user-chip lux-soft-chrome" id="lux-user-chip" type="button">
                            <span class="lux-avatar" id="lux-chip-avatar">KI</span>
                            <span class="lux-user-chip-copy">
                                <span id="lux-chip-name">Portal</span>
                                <small id="lux-chip-role">Dashboard</small>
                            </span>
                            <i class="fas fa-chevron-down lux-user-chip-chevron" aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(topbar);
        }
        ensureTopbarSoftChrome();
        if (isSidebarOverlayRoute() && isDesktopSidebarOverlayViewport()) {
            applySidebarState(true, { persist: false });
        } else {
            applySidebarState();
        }
    }
    function renderHomeChromeSkeleton(homeShell = document.getElementById('lux-home-shell')) {
        if (!homeShell || homeShellHasDashboardContent(homeShell)) return;
        if (homeShell.querySelector('[data-home-chrome-skeleton="1"]')) return;
        homeShell.innerHTML = `
            <div class="lux-home-grid is-loading" data-home-chrome-skeleton="1" data-home-loading-shell="1">
                <section class="lux-card">
                    <div class="lux-card-body lux-stack-grid">
                        <div class="lux-kicker">Dashboard</div>
                        <div class="page-hero-title lux-home-loading-title">Loading dashboard…</div>
                        <div class="lux-card-copy">Navigation is ready. Personal widgets will appear in a moment.</div>
                    </div>
                </section>
            </div>
        `;
    }
    function bootstrapIndexPortalChromeSync() {
        if (typeof isIndexPortalShell !== 'function' || !isIndexPortalShell()) return false;
        applyPortalPageState();
        closePickerPanels();
        const navRoot = document.getElementById('lux-nav');
        if (navRoot && !navRoot.children.length) {
            navRoot.dataset.renderSignature = '';
        }
        if (typeof renderNav === 'function') renderNav();
        if (typeof populateFacultySwitcher === 'function') populateFacultySwitcher();
        if (typeof populateRoleSwitcher === 'function') populateRoleSwitcher();
        syncTopbar();
        const activePageId = getActivePageId();
        if ((activePageId === 'home' || !activePageId) && window.__kiuLuxuryHomeDashboardLoaded !== true) {
            const homeShell = ensureHomeShell();
            if (homeShell) renderHomeChromeSkeleton(homeShell);
        }
        if (typeof markPortalShellReady === 'function') {
            markPortalShellReady();
        }
        window.__kiuIndexChromeBootstrapped = true;
        return true;
    }
    function ensureHomeShell() {
        const pageHome = document.getElementById('page-home');
        if (!pageHome) return null;
        let homeShell = document.getElementById('lux-home-shell');
        if (!homeShell) {
            homeShell = document.createElement('div');
            homeShell.id = 'lux-home-shell';
        }
        Array.from(pageHome.children).forEach((child) => {
            if (child !== homeShell) child.remove();
        });
        if (homeShell.parentElement !== pageHome || pageHome.firstElementChild !== homeShell) {
            pageHome.prepend(homeShell);
        }
        return homeShell;
    }
    /* Route-owned admin tools luxury bundle loader */
    const __luxAdminToolsRuntime = typeof window.__kiuCreateLuxuryAdminToolsRuntime === 'function'
        ? window.__kiuCreateLuxuryAdminToolsRuntime({ getActivePageId })
        : null;
    let renderLuxuryAdminToolsPage = function ensureLuxuryAdminToolsPageRender(...args) {
        if (!__luxAdminToolsRuntime) return Promise.resolve(false);
        return __luxAdminToolsRuntime.renderLuxuryAdminToolsPage(...args);
    };
    function scheduleLuxuryAdminToolsChunkRetry() {
        return __luxAdminToolsRuntime?.scheduleLuxuryAdminToolsChunkRetry?.();
    }
    window.__kiuRegisterLuxuryAdminToolsChunk = function registerLuxuryAdminToolsChunk(base64Source) {
        return __luxAdminToolsRuntime?.registerLuxuryAdminToolsChunk?.(base64Source);
    };
    function ensureLuxuryAdminToolsBundle() {
        return __luxAdminToolsRuntime?.ensureLuxuryAdminToolsBundle?.() || Promise.resolve(false);
    }
    window.ensureLuxuryAdminToolsBundle = ensureLuxuryAdminToolsBundle;
    function getBackgroundIntensity() {
        try { return getDashboardVisuals().backgroundIntensity || 'standard'; } catch(e) { return 'standard'; }
    }
    function getGlowStrength() {
        try { return getDashboardVisuals().glowStrength || 'balanced'; } catch(e) { return 'balanced'; }
    }
    Object.assign(window, {
        ROLE_LABELS,
        PAGE_LABELS,
        NAV_BY_ROLE,
        STUDIO_PALETTES,
        BACKGROUND_MODES,
        PARTICLE_QUALITY_OPTIONS,
        DEFAULT_STUDIO_MIXER,
        HOME_EDITOR_STATE,
        cloneDeep,
        ensureDashboardPreferenceStore,
        getDashboardPreferenceUserId,
        isBuiltInLuxuryPaletteKey,
        buildStudioPaletteCustomColors,
        studioPaletteMatchesMixer,
        getCurrentUserSafe,
        getEffectiveRole,
        getShellRole,
        getCurrentFacultyCode,
        getFacultyName,
        getUserName,
        getUserInitials,
        pageLabel,
        mixHsl,
        hslToRgb,
        hexToRgbTriplet,
        getPaletteByKey,
        clampNumber,
        getThemeMode,
        isHomeEditorAvailable,
        openHomeEditor,
        getDashboardVisuals,
        setDashboardVisuals,
        resolveCustomPalette,
        resolvePaletteKey,
        applyPaletteKey,
        applyCustomPalette,
        applyThemeMode,
        getBackgroundMode,
        areBackgroundAnimationsEnabled,
        setBackgroundAnimationsEnabled,
        setBackgroundMode,
        getParticleMotion,
        setParticleMotion,
        getParticleDensity,
        setParticleDensity,
        getParticleQuality,
        setParticleQuality,
        getParticleAmount,
        setParticleAmount,
        getParticleSharpness,
        setParticleSharpness,
        getFogSettings,
        setFogSettings,
        applyFogPreset,
        ensureFogProfileStore,
        getFogProfiles,
        saveFogProfile,
        applyFogProfile,
        deleteFogProfile,
        updateFogProfile,
        reorderFogProfiles,
        findMatchingFogProfileId,
        FOG_COLOR_PRESETS,
        DEFAULT_FOG_SETTINGS,
        getLuxuryBackgroundRenderProfile,
        sanitizeStudioMixerState,
        getStudioMixerState,
        setStudioMixerState,
        readStudioMixerInputs,
        writeStudioMixerInputs,
        syncVisualStateOnly,
        syncAll,
        getBackgroundIntensity,
        getGlowStrength,
        getShortcutDestinationOptions,
        sanitizeShortcutDefinition,
        getSavedCustomShortcuts,
        serializeCustomShortcuts,
        showToast
    });
    const shellChrome = () => window;
    const closeUtilityPanels = (...args) => shellChrome().closeUtilityPanels?.(...args);
    const closePickerPanels = (...args) => shellChrome().closePickerPanels?.(...args);
    const closeUserMenu = (...args) => shellChrome().closeUserMenu?.(...args);
    const renderNav = (...args) => shellChrome().renderNav?.(...args);
    const populateFacultySwitcher = (...args) => shellChrome().populateFacultySwitcher?.(...args);
    const populateRoleSwitcher = (...args) => shellChrome().populateRoleSwitcher?.(...args);
    let syncTopbar = (...args) => shellChrome().syncTopbar?.(...args);
    const syncStudioUi = (...args) => shellChrome().syncStudioUi?.(...args);
    const bindUserMenu = (...args) => shellChrome().bindUserMenu?.(...args);
    const bindTopbarControls = (...args) => shellChrome().bindTopbarControls?.(...args);
    const enhanceUniversalPickers = (...args) => shellChrome().enhanceUniversalPickers?.(...args);
    const __luxVisualRuntime = typeof window.__kiuCreateLuxuryVisualRuntime === 'function'
        ? window.__kiuCreateLuxuryVisualRuntime()
        : null;
    function refreshHeavySurfaceObservation() {
        return __luxVisualRuntime?.refreshHeavySurfaceObservation?.();
    }
    function queueHeavySurfaceObservationRefresh() {
        return __luxVisualRuntime?.queueHeavySurfaceObservationRefresh?.();
    }
    function getLuxuryPerformanceTier(reducedMotion = false) {
        return __luxVisualRuntime?.getLuxuryPerformanceTier?.(reducedMotion) || 'standard';
    }
    function getLuxuryBackgroundRenderProfile(reducedMotion = false) {
        return __luxVisualRuntime?.getLuxuryBackgroundRenderProfile?.(reducedMotion) || { tier: 'standard', pixelRatioCap: 1, frameInterval: 90, glassBlur: 18, transparencyBlur: 16, transparencySaturate: '138%', glassAlpha: '0.06', utilityAlpha: '0.82', cardGlowAlpha: '0.06' };
    }
    function applyLuxuryPerformanceProfile() {
        return __luxVisualRuntime?.applyLuxuryPerformanceProfile?.();
    }
    function queueLegacyVisualRefresh(root = document.body) {
        return __luxVisualRuntime?.queueLegacyVisualRefresh?.(root);
    }
    function observeLegacyVisualTree() {
        return __luxVisualRuntime?.observeLegacyVisualTree?.();
    }
    const observeUniversalPickers = (...args) => shellChrome().observeUniversalPickers?.(...args);
    function showToast(message) {
        let toast = document.getElementById('lux-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'lux-toast';
            toast.className = 'lux-toast';
            document.body.appendChild(toast);
        } else if (!toast.classList.contains('lux-toast')) {
            toast.classList.add('lux-toast');
        }
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(window.__luxToastTimer);
        window.__luxToastTimer = setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 1600);
    }
    function wrapFunction(name, callback) {
        const original = window[name];
        if (typeof original !== 'function' || original.__luxWrapped) return;
        const wrapped = function (...args) {
            const result = original.apply(this, args);
            window.requestAnimationFrame(() => callback(args, result));
            return result;
        };
        wrapped.__luxWrapped = true;
        window[name] = wrapped;
    }

    let queuedShellSyncFrame = null;
    let queuedNavigateSyncFrame = null;
    let __luxPendingNavigateSyncPageId = null;
    function isStandaloneLmsRouteActive() {
        return !isIndexPortalShell() && getActiveEntryPageId() === 'lms';
    }
    function isStandaloneAdminOrdersRouteActive() {
        return !isIndexPortalShell() && getActiveEntryPageId() === 'admin-orders';
    }
    function isStandaloneLibraryRouteActive() {
        return !isIndexPortalShell() && getActiveEntryPageId() === 'library';
    }
    function isStandaloneOrdersRouteActive() {
        return !isIndexPortalShell() && getActiveEntryPageId() === 'orders';
    }
    function syncLayoutForPage(pageId) {
        const activePageId = String(pageId || getActivePageId() || 'home').trim().toLowerCase() || 'home';
        if (activePageId === 'home' || !activePageId) {
            renderHomeShell();
        }
        if (activePageId === 'admin-tools') {
            renderLuxuryAdminToolsPage();
        }
        if (activePageId === 'social') {
            if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
        }
        if (activePageId === 'exams') {
            if (getEffectiveRole() !== USER_ROLES.STUDENT && typeof renderAdminExamSection === 'function') {
                renderAdminExamSection();
            }
        }
    }
    function isLuxNavEmpty() {
        const navRoot = document.getElementById('lux-nav');
        return Boolean(navRoot) && navRoot.children.length === 0;
    }
    function resetLuxuryHomeDashboardBundleState() {
        window.__kiuLuxuryHomeDashboardLoaded = false;
        __luxHomeDashboardBundlePromise = null;
    }
    function rehydrateIndexPortalEntry(options = {}) {
        if (typeof isIndexPortalShell !== 'function' || !isIndexPortalShell()) return;
        const pageId = String(options.pageId || getActivePageId() || 'home').trim().toLowerCase() || 'home';
        const onHome = pageId === 'home';
        const chromeOnly = options.chromeOnly === true;
        if (
            options.resetHomeBundle
            || (onHome && window.__kiuLuxuryHomeDashboardLoaded !== true && homeShellHasLoadingPlaceholder())
        ) {
            resetLuxuryHomeDashboardBundleState();
        }
        applyPortalPageState();
        closePickerPanels();
        const navRoot = document.getElementById('lux-nav');
        if (navRoot && !navRoot.children.length) {
            navRoot.dataset.renderSignature = '';
        }
        if (typeof markPortalShellReady === 'function') {
            markPortalShellReady();
        }
        if (!chromeOnly && options.fullSync !== false && typeof syncAll === 'function') {
            syncAll();
            return;
        }
        if (typeof renderNav === 'function') renderNav();
        if (typeof populateFacultySwitcher === 'function') populateFacultySwitcher();
        if (typeof populateRoleSwitcher === 'function') populateRoleSwitcher();
        syncTopbar();
        if (!chromeOnly) {
            syncLayoutForPage(pageId);
            return;
        }
        if (onHome && window.__kiuLuxuryHomeDashboardLoaded !== true) {
            const homeShell = ensureHomeShell();
            if (homeShell && !homeShellHasDashboardContent(homeShell)) {
                renderHomeChromeSkeleton(homeShell);
            }
        }
    }
    function recoverIndexPortalShell(options = {}) {
        rehydrateIndexPortalEntry({
            ...options,
            fullSync: options.fullSync !== false
        });
    }
    function syncAfterNavigate(pageId) {
        const targetPageId = String(pageId || getActivePageId() || 'home').trim().toLowerCase() || 'home';
        applyPortalPageState();
        closePickerPanels();
        renderNav();
        syncTopbar();
        const visualSignature = buildVisualStateSyncSignature();
        if (window.__luxLastVisualStateSyncSignature !== visualSignature) {
            syncVisualStateOnly();
        }
        if (window.__luxLastNavigateLayoutPageId !== targetPageId) {
            window.__luxLastNavigateLayoutPageId = targetPageId;
            syncLayoutForPage(targetPageId);
        }
        const navRoot = document.getElementById('lux-nav');
        if (navRoot && !navRoot.children.length) {
            navRoot.dataset.renderSignature = '';
            if (typeof renderNav === 'function') renderNav();
        }
        if (typeof window.applyAutocompleteOff === 'function') {
            const activePage = document.querySelector('.page-section.active-page');
            window.applyAutocompleteOff(activePage || document);
        }
    }
    function queueNavigateSync(args, result) {
        if (result?.navigationSkipped) return;
        if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
        const pageId = String(args?.[0] || getActivePageId() || 'home').trim().toLowerCase() || 'home';
        __luxPendingNavigateSyncPageId = pageId;
        if (queuedNavigateSyncFrame) return;
        queuedNavigateSyncFrame = window.requestAnimationFrame(() => {
            queuedNavigateSyncFrame = null;
            if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
            const targetPageId = __luxPendingNavigateSyncPageId;
            __luxPendingNavigateSyncPageId = null;
            syncAfterNavigate(targetPageId);
        });
    }
    function queueShellSync(args, result) {
        if (result?.navigationSkipped) return;
        if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
        if (queuedShellSyncFrame) return;
        queuedShellSyncFrame = window.requestAnimationFrame(() => {
            queuedShellSyncFrame = null;
            if (window.__kiuRoleSwitchRedirectPending || window.__kiuFacultySwitchRedirectPending) return;
            if (!isIndexPortalShell() && typeof window.refreshStandaloneDesktopRouteShellContext === 'function') {
                window.refreshStandaloneDesktopRouteShellContext({ rerender: true, refreshActiveRoute: true });
                return;
            }
            if (isStandaloneLmsRouteActive() && typeof window.refreshStandaloneLmsShellContext === 'function') {
                window.refreshStandaloneLmsShellContext({ refreshSubjectDeck: false });
                return;
            }
            if (!isIndexPortalShell() && typeof window.refreshStandaloneDesktopShellChrome === 'function') {
                window.refreshStandaloneDesktopShellChrome();
                return;
            }
            syncAll();
            if (isIndexPortalShell() && isLuxNavEmpty()) {
                rehydrateIndexPortalEntry({ pageId: getActivePageId(), reason: 'shell-sync' });
            }
        });
    }
    function syncLayout() {
        const activePageId = getActivePageId();
        const onExamsRoute = document.body?.classList?.contains('lux-route-exams');
        const onLibraryRoute = document.body?.classList?.contains('lux-route-library');
        if (onExamsRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxExamsSyncLayoutAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxExamsSyncLayoutAt = now;
        }
        if (onLibraryRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxLibrarySyncLayoutAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxLibrarySyncLayoutAt = now;
        }
        if (activePageId === 'home' || !activePageId) {
            renderHomeShell();
        }
        syncTopbar();
        if (activePageId === 'admin-tools') {
            renderLuxuryAdminToolsPage();
        }
        if (activePageId === 'social') {
            if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
        }
        if (activePageId === 'exams') {
            if (getEffectiveRole() !== USER_ROLES.STUDENT && typeof renderAdminExamSection === 'function') {
                renderAdminExamSection();
            }
        }
        if (!document.body?.classList?.contains('lux-route-lms')) {
            queueHeavySurfaceObservationRefresh();
        }
    }
    function buildTransparencySyncSignature(activePageId, transparencyValue) {
        const visuals = getDashboardVisuals() || {};
        return [
            activePageId || 'home',
            getEffectiveRole(),
            getCurrentFacultyCode(),
            String(transparencyValue || ''),
            visuals.themeMode || getThemeMode(),
            visuals.paletteKey || resolvePaletteKey() || '',
            JSON.stringify(visuals.customPalette || {}),
            HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole() ? 'editing' : 'view'
        ].join('|');
    }
    function buildVisualStateSyncSignature() {
        const visuals = getDashboardVisuals() || {};
        return [
            getActivePageId() || 'home',
            getEffectiveRole(),
            getCurrentFacultyCode(),
            visuals.themeMode || getThemeMode(),
            visuals.paletteKey || resolvePaletteKey() || '',
            JSON.stringify(visuals.customPalette || {}),
            visuals.backgroundMode || getBackgroundMode() || '',
            String(visuals.particleMotion ?? getParticleMotion()),
            String(visuals.particleDensity ?? getParticleDensity()),
            String(visuals.particleAmount ?? getParticleAmount()),
            String(visuals.particleSharpness ?? getParticleSharpness()),
            visuals.particleQuality || getParticleQuality() || '',
            typeof visuals.backgroundAnimationsEnabled === 'boolean' ? String(visuals.backgroundAnimationsEnabled) : String(areBackgroundAnimationsEnabled()),
            String(visuals.surfaceTransparency ?? localStorage.getItem('kiuLuxurySurfaceTransparency') ?? 13)
        ].join('|');
    }
    function syncAll() {
        const activePageId = getActivePageId();
        const onAdminToolsRoute = document.body?.classList?.contains('lux-route-admin-tools');
        const onLmsRoute = isLuxRouteWorkspace(activePageId, getActiveEntryPageId());
        const onExamsRoute = document.body?.classList?.contains('lux-route-exams');
        const onOrdersRoute = document.body?.classList?.contains('lux-route-orders');
        const onLibraryRoute = document.body?.classList?.contains('lux-route-library');
        if (onAdminToolsRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxAdminToolsSyncAllAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxAdminToolsSyncAllAt = now;
        }
        if (onLmsRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxLmsSyncAllAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxLmsSyncAllAt = now;
        }
        if (onExamsRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxExamsSyncAllAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxExamsSyncAllAt = now;
        }
        if (onOrdersRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxOrdersSyncAllAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxOrdersSyncAllAt = now;
        }
        if (onLibraryRoute) {
            const now = Date.now();
            const lastSyncAt = window.__luxLibrarySyncAllAt || 0;
            if (now - lastSyncAt < 400) return;
            window.__luxLibrarySyncAllAt = now;
        }
        applyThemeMode(getThemeMode(), false);
        applyResolvedPalette();
        applyAtmosphereSettings();
        applyLuxuryPerformanceProfile();
        document.body.dataset.luxBackgroundMode = getBackgroundMode();
        applyPortalPageState();
        closePickerPanels();
        renderNav();
        populateFacultySwitcher();
        populateRoleSwitcher();
        syncLayout();
        syncStudioUi();
        if (!onAdminToolsRoute && !onLmsRoute && !onExamsRoute && !onOrdersRoute && !onLibraryRoute) {
            queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
        }
        if (onLmsRoute && typeof window.ensureLmsRouteVisualState === 'function') {
            window.ensureLmsRouteVisualState();
        }
        if (isAdminLibraryRouteContext(activePageId, getActiveEntryPageId()) && typeof window.ensureAdminLibraryRouteVisualState === 'function') {
            window.ensureAdminLibraryRouteVisualState();
        }
        /* Always re-apply transparency after atmosphere/perf so glass tokens win.
           Signature skip previously let later syncAll stomps stick until a click. */
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            var _syncTransVal = getDashboardVisuals().surfaceTransparency
                || localStorage.getItem('kiuLuxurySurfaceTransparency')
                || DEFAULT_HOME_VISUALS.surfaceTransparency;
            if (_syncTransVal != null && _syncTransVal !== '') {
                window.__luxLastTransparencySyncSignature = buildTransparencySyncSignature(activePageId, _syncTransVal);
                window.queueLuxuryTransparencyRefresh(parseInt(_syncTransVal, 10), { persist: false });
            }
        }
    }
    function syncVisualStateOnly() {
        const onOrdersRoute = document.body?.classList?.contains('lux-route-orders');
        const visualSignature = buildVisualStateSyncSignature();
        if (window.__luxLastVisualStateSyncSignature === visualSignature) {
            return;
        }
        window.__luxLastVisualStateSyncSignature = visualSignature;
        applyThemeMode(getThemeMode(), false);
        applyResolvedPalette();
        applyAtmosphereSettings();
        applyLuxuryPerformanceProfile();
        document.body.dataset.luxBackgroundMode = getBackgroundMode();
        syncStudioUi();
        if (!isLuxRouteWorkspace() && !onOrdersRoute) {
            queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
        }
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            const transparencyValue = getDashboardVisuals().surfaceTransparency
                || localStorage.getItem('kiuLuxurySurfaceTransparency')
                || DEFAULT_HOME_VISUALS.surfaceTransparency;
            if (transparencyValue != null && transparencyValue !== '') {
                window.queueLuxuryTransparencyRefresh(parseInt(transparencyValue, 10), { persist: false });
            }
        }
        if (typeof window.__kiuApplyLmsParticleTheme === 'function') {
            window.__kiuApplyLmsParticleTheme();
        }
        if (onOrdersRoute) {
            scheduleOrdersRouteBackgroundRefresh();
        } else if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground();
        }
        if (isLuxRouteWorkspace() && typeof window.ensureLmsRouteVisualState === 'function') {
            window.ensureLmsRouteVisualState();
        }
    }
    window.getDashboardVisuals = typeof getDashboardVisuals === 'function'
        ? getDashboardVisuals
        : window.getDashboardVisuals;
    window.setDashboardVisuals = typeof setDashboardVisuals === 'function'
        ? setDashboardVisuals
        : window.setDashboardVisuals;
    window.applyPaletteKey = typeof applyPaletteKey === 'function'
        ? applyPaletteKey
        : window.applyPaletteKey;
    window.applyThemeMode = typeof applyThemeMode === 'function'
        ? applyThemeMode
        : window.applyThemeMode;
    window.applyAtmosphereSettings = typeof applyAtmosphereSettings === 'function'
        ? applyAtmosphereSettings
        : window.applyAtmosphereSettings;
    window.areBackgroundAnimationsEnabled = typeof areBackgroundAnimationsEnabled === 'function'
        ? areBackgroundAnimationsEnabled
        : window.areBackgroundAnimationsEnabled;
    window.setBackgroundMode = typeof setBackgroundMode === 'function'
        ? setBackgroundMode
        : window.setBackgroundMode;
    window.syncAll = typeof syncAll === 'function'
        ? syncAll
        : window.syncAll;
    window.syncVisualStateOnly = typeof syncVisualStateOnly === 'function'
        ? syncVisualStateOnly
        : window.syncVisualStateOnly;
    window.syncAfterNavigate = typeof syncAfterNavigate === 'function'
        ? syncAfterNavigate
        : window.syncAfterNavigate;
    /* Dashboard Builder Overrides */
    /* Route-owned home dashboard and editor bundle loader */
    const HOME_DASHBOARD_LOAD_TIMEOUT_MS = 10000;
    let __luxHomeShellResizeTimer = null;
    const __luxHomeRuntime = typeof window.__kiuCreateLuxuryHomeDashboardRuntime === 'function'
        ? window.__kiuCreateLuxuryHomeDashboardRuntime({ ensureHomeShell, escapeHtml, getActivePageId, isIndexPortalShell: () => typeof isIndexPortalShell === 'function' && isIndexPortalShell() })
        : null;
    function homeShellHasLoadingPlaceholder(homeShell = document.getElementById('lux-home-shell')) {
        return Boolean(__luxHomeRuntime?.homeShellHasLoadingPlaceholder?.(homeShell));
    }
    function homeShellHasDashboardContent(homeShell = document.getElementById('lux-home-shell')) {
        return Boolean(__luxHomeRuntime?.homeShellHasDashboardContent?.(homeShell));
    }
    function renderHomeShellRecoveryPanel(homeShell, options = {}) {
        const retryMarkup = 'data-home-dashboard-retry="1"';
        void retryMarkup;
        return __luxHomeRuntime?.renderHomeShellRecoveryPanel?.(homeShell, options);
    }
    function __luxHomeRecoveryPanelContract(homeShell) {
        if (false) renderHomeShellRecoveryPanel(homeShell);
    }
    function renderHomeShell() {
        const homeShell = ensureHomeShell();
        if (!homeShell) return;
        if (!__luxHomeRuntime) return;
        return __luxHomeRuntime.renderHomeShell();
    }
    function isLuxuryHomeRoute() {
        return getActivePageId() === 'home';
    }
    function scheduleLuxuryHomeDashboardPreload() {
        if (typeof isIndexPortalShell === 'function' && isIndexPortalShell()) {
            return ensureLuxuryHomeDashboardBundle({ preload: true });
        }
        return Promise.resolve(false);
    }
    window.__kiuRegisterLuxuryHomeChunk = function registerLuxuryHomeChunk(base64Source) {
        const result = __luxHomeRuntime?.registerLuxuryHomeChunk?.(base64Source);
        if (isLuxuryHomeRoute()) renderHomeShell();
        return result;
    };
    function decodeLuxuryHomeChunkSource(base64Source) {
        return window.__kiuDecodeLuxuryRouteChunkSource?.(base64Source) || '';
    }
    function scheduleLuxuryHomeDashboardChunkRetry() {
        return __luxHomeRuntime?.scheduleLuxuryHomeDashboardChunkRetry?.();
    }
    function ensureLuxuryHomeDashboardBundle(options = {}) {
        const preload = options.preload === true;
        const allowWhileNotHome = options.allowWhileNotHome === true;
        return __luxHomeRuntime?.ensureLuxuryHomeDashboardBundle?.({ ...options, preload, allowWhileNotHome }) || Promise.resolve(false);
    }
    window.renderHomeShell = renderHomeShell;
    window.ensureLuxuryHomeDashboardBundle = ensureLuxuryHomeDashboardBundle;
    window.recoverIndexPortalShell = recoverIndexPortalShell;
    window.rehydrateIndexPortalEntry = rehydrateIndexPortalEntry;
    window.bootstrapIndexPortalChromeSync = bootstrapIndexPortalChromeSync;
    ready(() => {
        window.renderLuxuryAdminToolsPage = (...args) => renderLuxuryAdminToolsPage(...args);
        ensureShell();
        ensureHomeShell();
        bindUserMenu();
        bindTopbarControls();
        if (typeof isIndexPortalShell === 'function' && isIndexPortalShell()) {
            bootstrapIndexPortalChromeSync();
        }
        applyThemeMode(getThemeMode(), false);
        applyResolvedPalette();
        applyAtmosphereSettings();
        applyLuxuryPerformanceProfile();
        wrapFunction('navigate', queueNavigateSync);
        wrapFunction('switchRole', queueShellSync);
        wrapFunction('switchFacultyTheme', queueShellSync);
        wrapFunction('refreshShellIdentity', queueShellSync);
        window.addEventListener('resize', () => {
            if (__luxHomeShellResizeTimer) window.clearTimeout(__luxHomeShellResizeTimer);
            __luxHomeShellResizeTimer = window.setTimeout(() => {
                __luxHomeShellResizeTimer = null;
                // FIX: Do NOT call syncLayout() or syncAll() here.
                // Rebuilding the DOM (renderHomeShell, renderAdminTools, etc.) on resize causes massive flickering.
                // CSS Grid/Flexbox handles responsive layout natively. 
                syncTopbar(); 
            }, 90);
        });
        if (typeof isIndexPortalShell === 'function' && isIndexPortalShell()) {
            scheduleLuxuryHomeDashboardPreload();
            window.addEventListener('pageshow', (event) => {
                if (typeof isIndexPortalShell !== 'function' || !isIndexPortalShell()) return;
                if (typeof markPortalShellReady === 'function') {
                    markPortalShellReady();
                }
                const activePageId = getActivePageId();
                const onHome = activePageId === 'home';
                const needsRehydrate = event.persisted
                    || document.documentElement?.classList.contains('kiu-shell-loading')
                    || document.body?.classList.contains('kiu-shell-loading')
                    || isLuxNavEmpty()
                    || (onHome && (homeShellHasLoadingPlaceholder() || !homeShellHasDashboardContent()));
                if (!needsRehydrate) return;
                rehydrateIndexPortalEntry({
                    pageId: activePageId,
                    reason: event.persisted ? 'pageshow-bfcache' : 'pageshow-recover',
                    resetHomeBundle: onHome && !homeShellHasDashboardContent()
                });
            });
        }
        const scheduleInitialShellSync = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));
        scheduleInitialShellSync(() => {
            const runDeferredVisualEnhancements = () => {
                const onStandaloneLms = isStandaloneLmsRouteActive();
                const onStandaloneAdminOrders = isStandaloneAdminOrdersRouteActive();
                const onStandaloneLibrary = isStandaloneLibraryRouteActive();
                const onStandaloneOrders = isStandaloneOrdersRouteActive();
                enhanceUniversalPickers(document.querySelector('.page-section.active-page') || document);
                observeUniversalPickers();
                if (!onStandaloneLms && !onStandaloneAdminOrders && !onStandaloneLibrary && !onStandaloneOrders) {
                    observeLegacyVisualTree();
                    queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
                    queueHeavySurfaceObservationRefresh();
                }
                if (typeof window.scheduleLuxuryTransparencyBootRefresh === 'function') {
                    window.scheduleLuxuryTransparencyBootRefresh(
                        getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency') || 13
                    );
                }
                const scheduleParticleInit = () => {
                    if (typeof window.__kiuInitLuxuryParticleBackground === 'function') {
                        window.__kiuInitLuxuryParticleBackground();
                    }
                };
                if (!onStandaloneAdminOrders) {
                    if (onStandaloneLibrary || onStandaloneOrders) {
                        const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 120));
                        schedule(scheduleParticleInit);
                    } else {
                        scheduleParticleInit();
                    }
                }
            };
            const scheduleDeferredVisualEnhancements = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 0));
            if (isLuxuryHomeRoute()) {
                ensureLuxuryHomeDashboardBundle({ preload: false, allowWhileNotHome: true }).then((loaded) => {
                    if (loaded && isLuxuryHomeRoute()) {
                        renderHomeShell();
                    }
                });
                scheduleDeferredVisualEnhancements(runDeferredVisualEnhancements);
                return;
            }
            if (isStandaloneLmsRouteActive() && typeof window.refreshStandaloneLmsShellContext === 'function') {
                window.refreshStandaloneLmsShellContext({ refreshSubjectDeck: false });
            } else if (
                (isStandaloneAdminOrdersRouteActive() || isStandaloneOrdersRouteActive() || isStandaloneLibraryRouteActive())
                && typeof window.refreshStandaloneDesktopRouteShellContext === 'function'
            ) {
                window.refreshStandaloneDesktopRouteShellContext({ rerender: false });
            } else {
                syncAll();
            }
            scheduleDeferredVisualEnhancements(runDeferredVisualEnhancements);
        });
    });

})();
/* ==========================================================================
   SCROLL THROTTLING (GPU PROTECTION)
   ========================================================================== */
(function() {
    let scrollTimeout = null;
    const markScrolling = () => {
        window.__luxIsScrolling = true;
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            window.__luxIsScrolling = false;
        }, 150);
    };
    document.addEventListener('scroll', markScrolling, { capture: true, passive: true });
})();
