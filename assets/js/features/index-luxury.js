/* FINDABILITY: index luxury shell — see docs/findability-index.md#index-luxury */
/* Wave bag KiuIndexLuxury */
window.KiuIndexLuxury=window.KiuIndexLuxury||{};const __kiuLuxApi=window.KiuIndexLuxury;window.__kiuLuxApi=__kiuLuxApi;
function __kiuLuxExpose(map){Object.keys(map).forEach((k)=>{__kiuLuxApi[k]=map[k];window[k]=map[k];});}

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
        student: [{ group: 'Core', items: [['home', 'Dashboard', 'fas fa-th-large'], ['lms', 'LMS', 'fas fa-book-reader'], ['timetable', 'Timetable', 'fas fa-chalkboard'], ['registration', 'Registration', 'fas fa-check-square']] }, { group: 'Records', items: [['programs', 'Programs', 'fas fa-file-signature'], ['study-card', 'Study Card', 'far fa-address-card'], ['personal-data', 'Personal Data', 'far fa-user']] }, { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['chancellery', 'E-Chancellery', 'fas fa-desktop'], ['student-service', 'Student Service', 'fas fa-headset'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments']] }],
        professor: [{ group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }, { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['personal-data', 'Personal Data', 'far fa-user']] }],
        ta: [{ group: 'Faculty', items: [['home', 'Dashboard', 'fas fa-th-large'], ['timetable', 'Schedule', 'fas fa-calendar-week'], ['lms', 'LMS', 'fas fa-book-reader'], ['faculty-gradebook', 'Gradebook', 'fas fa-chart-bar'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group']] }, { group: 'Support', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['personal-data', 'Personal Data', 'far fa-user']] }],
        admin: [{ group: 'Control', items: [['home', 'Dashboard', 'fas fa-hammer'], ['admin-tools', 'Admin Tools', 'fas fa-layer-group'], ['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus'], ['staff', 'Staff', 'fas fa-users-cog'], ['students-admin', 'Students', 'fas fa-user-graduate']] }, { group: 'Systems', items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['chancellery', 'E-Chancellery', 'fas fa-inbox'], ['social', 'Social', 'fas fa-comments'], ['exams', 'Exams', 'fas fa-file-signature'], ['programs', 'Programs', 'fas fa-layer-group'], ['personal-data', 'Personal Data', 'far fa-user']] }],
        student_service: [{ group: 'Service', items: [['home', 'Dashboard', 'fas fa-th-large'], ['student-service', 'Inbox', 'fas fa-inbox'], ['orders', 'Orders', 'fas fa-book-open'], ['library', 'Library', 'fas fa-book']] }, { group: 'Campus', items: [['news', 'News', 'fas fa-newspaper'], ['social', 'Social', 'fas fa-comments'], ['personal-data', 'Personal Data', 'far fa-user']] }]
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
        { key: 'ocean-teal', accent: '#008080', accent2: '#26a69a' },
        {
            key: 'platinum-silver',
            accent: '#7b8a9a',
            accent2: '#a8b4c0',
            lightAccent: '#4a5563',
            lightAccent2: '#718096'
        }
    ];
    const LUXURY_PALETTE_KEYS = LUXURY_PALETTES.map((palette) => palette.key);
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
        { key: 'ocean-teal', name: 'Ocean & Teal', hA: 180, sA: 60, lA: 32, hB: 174, sB: 55, lB: 44, mode: 'dark' },
        { key: 'platinum-silver', name: 'Silver', hA: 215, sA: 12, lA: 38, hB: 210, sB: 14, lB: 52, mode: 'dark' }
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
        { key: 'auto', label: 'Adaptive', copy: 'Matches this device while preserving the visual feel.' },
        { key: 'low', label: 'Low', copy: 'Lightweight particle count.' },
        { key: 'balanced', label: 'Balanced', copy: 'Default quality profile.' },
        { key: 'high', label: 'High', copy: 'Maximum particle density.' }
    ];
    const GLASS_BLUR_QUALITY_OPTIONS = [
        { key: 'auto', label: 'Adaptive', copy: 'Matches frost quality to this device.' },
        { key: 'high', label: 'High', copy: 'Richest frost.' },
        { key: 'balanced', label: 'Balanced', copy: 'Smoother on weaker devices.' },
        { key: 'performance', label: 'Performance', copy: 'Lightest frost for speed.' }
    ];
    const STATIC_BACKGROUND_FILL_OPTIONS = [
        { key: 'colored', label: 'Colored', icon: 'fas fa-palette' },
        { key: 'dark', label: 'Full Dark', icon: 'fas fa-moon' },
        { key: 'white', label: 'White', icon: 'fas fa-sun' },
        { key: 'gallery', label: 'Gallery', icon: 'fas fa-images' }
    ];
    const FORCED_LUXURY_VISUAL_DEFAULTS_VERSION = '20260816-opacity70-v3';
    const GLOBAL_LUXURY_PALETTE_SCOPE = '*';
    const DEFAULT_HOME_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'orbit',
        backgroundAnimationsEnabled: true,
        staticBackgroundFill: 'colored',
        backgroundGallerySelection: null,
        particleMotion: 100,
        particleDensity: 100,
        particleAmount: 100,
        particleSharpness: 50,
        particleQuality: 'auto',
        glassBlurQuality: 'auto',
        glowStrength: 50,
        paletteKey: 'ocean-teal',
        paletteFaculty: GLOBAL_LUXURY_PALETTE_SCOPE,
        customPalette: null,
        surfaceTransparency: '70',
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

    function ensureBackgroundGalleryScripts() {
        if (window.__KIU_BACKGROUND_GALLERY_SCRIPTS_PROMISE) {
            return window.__KIU_BACKGROUND_GALLERY_SCRIPTS_PROMISE;
        }
        const files = [
            'assets/js/features/luxury-background-gallery-palette.js?v=20260722-bgg21',
            'assets/js/features/luxury-background-gallery-optimizer.js?v=20260722-bgg21',
            'assets/js/features/luxury-background-gallery-runtime.js?v=20260722-bgg21',
            'assets/js/features/luxury-background-gallery-studio.js?v=20260808-galleryfouc1'
        ];
        const loadOne = (src) => new Promise((resolve, reject) => {
            if (document.querySelector(`script[data-kiu-bg-gallery="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.defer = true;
            script.src = src;
            script.dataset.kiuBgGallery = src;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`failed to load ${src}`));
            document.head.appendChild(script);
        });
        window.__KIU_BACKGROUND_GALLERY_SCRIPTS_REQUESTED = true;
        window.__KIU_BACKGROUND_GALLERY_SCRIPTS_PROMISE = files
            .reduce((chain, src) => chain.then(() => loadOne(src)), Promise.resolve())
            .then(() => {
                if (typeof window.bindBackgroundGalleryStudioControls === 'function') {
                    window.bindBackgroundGalleryStudioControls();
                }
                if (typeof window.__kiuSyncBackgroundGalleryMedia === 'function') {
                    window.__kiuSyncBackgroundGalleryMedia(window.__kiuBackgroundGalleryCaches || {});
                }
            });
        return window.__KIU_BACKGROUND_GALLERY_SCRIPTS_PROMISE;
    }
    window.__kiuEnsureBackgroundGalleryScripts = ensureBackgroundGalleryScripts;

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }
    function escapeHtml(value) {
        if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
            const shared = window.escapeHtml;
            if (shared !== escapeHtml) return shared(value);
        }
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
        try {
            const saved = localStorage.getItem('kiuLuxurySidebarCollapsed');
            if (saved === '1') return true;
            if (saved === '0') return false;
        } catch (e) { /* ignore */ }
        // Prefer live body class only after a deliberate apply; default expanded.
        if (document.body?.dataset?.luxSidebar === 'collapsed') return true;
        if (document.body?.dataset?.luxSidebar === 'expanded') return false;
        return false;
    }
    function isDesktopSidebarOverlayViewport() {
        return typeof window !== 'undefined' && window.innerWidth >= 1181;
    }
    function isSidebarOverlayRoute() {
        return Boolean(document.body?.classList.contains('lux-unified-shell'));
    }
    function applySidebarState(collapsed = isSidebarCollapsed(), options = {}) {
        const wasCollapsed = document.body?.classList?.contains('lux-sidebar-collapsed');
        const nextCollapsed = Boolean(collapsed);
        if (wasCollapsed !== nextCollapsed && typeof window.beginShellChromeMotion === 'function') {
            window.beginShellChromeMotion(320, 'sidebar-toggle');
        }
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
        // Sidebar toggle is a pure CSS transition handled by lux-shell.css / index-home layout.
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
    const HOME_GRID_COLUMNS = 12;
    const HOME_GRID_ROW_HEIGHT = 28;
    const ADVANCED_DEFAULT_VISUALS = {
        themeMode: 'dark',
        backgroundMode: 'orbit',
        backgroundAnimationsEnabled: true,
        staticBackgroundFill: 'colored',
        backgroundGallerySelection: null,
        particleMotion: 100,
        particleDensity: 100,
        particleQuality: 'auto',
        glassBlurQuality: 'auto',
        backgroundIntensity: 'standard',
        glowStrength: 50,
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
        surfaceTransparency: '70',
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
    function isHomeEditorAvailable() {
        return false;
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
            localStorage.setItem('kiuLuxuryGlassBlurQuality', forcedDefaults.glassBlurQuality || 'auto');
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
        const visuals = {
            ...buildAdvancedDefaultVisuals(),
            ...(scopedVisuals || entry.visuals || {})
        };
        // Keep the current forced-default generation authoritative even after
        // PostgreSQL bootstrap merges an older per-scope visual preference.
        let defaultsVersion = '';
        try {
            defaultsVersion = String(localStorage.getItem('KIU_LUXURY_VISUAL_DEFAULTS_VERSION') || '').trim();
        } catch (error) {}
        if (defaultsVersion === FORCED_LUXURY_VISUAL_DEFAULTS_VERSION) {
            visuals.surfaceTransparency = String(ADVANCED_DEFAULT_VISUALS.surfaceTransparency);
        }
        return visuals;
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
            'kiuLuxuryGlassBlurQuality',
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
            'kiuLuxuryStaticBackgroundFill',
            'kiuLuxuryBackgroundGallerySelection',
            'kiu-palette'
        ].forEach((key) => localStorage.removeItem(key));
        const paletteClasses = LUXURY_PALETTE_KEYS;
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
            'kiuLuxuryGlassBlurQuality',
            'kiuLuxuryFogSettings',
            'kiuLuxuryBackgroundIntensity',
            'kiuLuxuryGlowStrength',
            'kiuLuxurySurfaceTransparency',
            'kiuLuxurySurfaceTransparencyValue',
            'kiuLuxuryPalette',
            'kiuLuxuryPaletteFaculty',
            'kiuLuxuryCustomPalette',
            'kiuLuxuryCustomPaletteFaculty',
            'kiuLuxuryMixerState',
            'kiuLuxuryStaticBackgroundFill'
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
    const __luxPaletteBridge = {
        getDashboardVisuals: (...a) => getDashboardVisuals(...a),
        setDashboardVisuals: (...a) => setDashboardVisuals(...a),
        getCurrentFacultyCode: (...a) => getCurrentFacultyCode(...a),
        getThemeMode: (...a) => __luxPaletteBridge._getThemeMode?.(...a) ?? window.getThemeMode?.(...a) ?? 'dark',
        isBuiltInLuxuryPaletteKey: (...a) => isBuiltInLuxuryPaletteKey(...a),
        getFacultyProfile: (...a) => (typeof getFacultyProfile === 'function' ? getFacultyProfile(...a) : window.getFacultyProfile?.(...a)),
        LUXURY_PALETTES,
        DEFAULT_HOME_VISUALS,
        GLOBAL_LUXURY_PALETTE_SCOPE
    };
    const __luxPalette = typeof window.__kiuCreateLuxuryPaletteApi === 'function'
        ? window.__kiuCreateLuxuryPaletteApi(__luxPaletteBridge)
        : {};
    const {
        hexToRgbTriplet, getPaletteByKey, hslToRgb, mixHsl, rgbTripletToString, blendRgbTriplets,
        buildLightModeBackdropTokens, rgbTripletToHex, colorToRgbTriplet, sanitizeColorInput,
        getFacultyLuxuryPaletteState, isVisualPaletteScopedToFaculty, resolveCustomPalette,
        resolvePaletteKey, applyPaletteValues, applyPaletteKey, applyCustomPalette, applyResolvedPalette
    } = __luxPalette;

    const buildLuxuryTransparencyModel = window.buildLuxuryTransparencyModel;
    const applyLuxuryTransparencyTokenState = window.applyLuxuryTransparencyTokenState;
    const ensureLuxuryHighTransparencyStyleElement = window.ensureLuxuryHighTransparencyStyleElement;
    const applyLuxuryHighTransparencyState = window.applyLuxuryHighTransparencyState;
    const applySharedLightModeRootTokens = window.applySharedLightModeRootTokens;
    const queueLuxuryRefreshOperation = window.queueLuxuryRefreshOperation;
    const applyLuxuryTransparencyPreferenceState = window.applyLuxuryTransparencyPreferenceState;
    const applyAtmosphereSettings = window.applyAtmosphereSettings;
    const normalizeWidgetSpan = window.normalizeWidgetSpan;
    const getRoleDefaultWidgetOrder = window.getRoleDefaultWidgetOrder;
    const sortWidgetsForRole = window.sortWidgetsForRole;
    const getShortcutDestinationOptions = window.getShortcutDestinationOptions;
    const sanitizeShortcutDefinition = window.sanitizeShortcutDefinition;
    const getSavedCustomShortcuts = window.getSavedCustomShortcuts;
    const serializeCustomShortcuts = window.serializeCustomShortcuts;
    const __luxAtmosphereBridge = {
        getDashboardVisuals: (...a) => getDashboardVisuals(...a),
        setDashboardVisuals: (...a) => setDashboardVisuals(...a),
        getDashboardPreferenceEntry: (...a) => getDashboardPreferenceEntry(...a),
        updateDashboardPreferenceEntry: (...a) => updateDashboardPreferenceEntry(...a),
        getHomeScopeKey: (...a) => getHomeScopeKey(...a),
        DEFAULT_HOME_VISUALS,
        BACKGROUND_MODES,
        STATIC_BACKGROUND_FILL_OPTIONS,
        PARTICLE_QUALITY_OPTIONS,
        GLASS_BLUR_QUALITY_OPTIONS,
        FOG_COLOR_PRESETS,
        DEFAULT_FOG_SETTINGS,
        applyResolvedPalette: (...a) => applyResolvedPalette(...a),
        applySharedLightModeRootTokens: (...a) => applySharedLightModeRootTokens(...a),
        applyAtmosphereSettings: (...a) => applyAtmosphereSettings(...a),
        updateTransparency: (...a) => (typeof updateTransparency === 'function' ? updateTransparency(...a) : window.updateTransparency?.(...a)),
        syncStudioUi: (...a) => __luxAtmosphereBridge._syncStudioUi?.(...a),
        showToast: (...a) => __luxAtmosphereBridge._showToast?.(...a)
    };
    const __luxAtmosphere = typeof window.__kiuCreateLuxuryAtmosphereApi === 'function'
        ? window.__kiuCreateLuxuryAtmosphereApi(__luxAtmosphereBridge)
        : {};
    const {
        getThemeMode, applyThemeMode, sanitizeBackgroundMode, areBackgroundAnimationsEnabled,
        getBackgroundMode, setBackgroundAnimationsEnabled, setBackgroundMode,
        getStaticBackgroundFill, setStaticBackgroundFill,
        getBackgroundGallerySelection, setBackgroundGallerySelection, clearBackgroundGallery,
        getParticleMotion, setParticleMotion, getParticleDensity, setParticleDensity,
        getParticleAmount, setParticleAmount, getParticleSharpness, setParticleSharpness,
        getParticleQuality, setParticleQuality,
        getGlassBlurQuality, setGlassBlurQuality,
        getGlowStrength, setGlowStrength,
        normalizeGlowStrengthPercent, resolveGlowTokenConfig, applyGlowStrengthCssVars,
        DEFAULT_STUDIO_MIXER, clampNumber,
        sanitizeFogHexColor, readStoredFogSettings, sanitizeFogSettings, getFogSettings,
        refreshActiveFogBackground, setFogSettings, applyFogPreset, normalizeFogProfileBank,
        defaultFogProfileMotion, buildDefaultLightFogProfiles, sanitizeFogProfile,
        readStoredFogProfiles, writeStoredFogProfiles, syncFogProfilesStorage,
        fogProfileSettingsEqual, mergeFogProfileStores, ensureFogProfileStore,
        getAllFogProfiles, getFogProfiles, slugFogProfileName, saveFogProfile,
        applyFogProfile, deleteFogProfile, updateFogProfile, reorderFogProfiles,
        findMatchingFogProfileId, sanitizeStudioMixerState, getStudioMixerState,
        setStudioMixerState, readStudioMixerInputs, writeStudioMixerInputs
    } = __luxAtmosphere;
    __luxPaletteBridge._getThemeMode = getThemeMode;

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
    function openHomeEditor(_role = getEffectiveRole(), _model = buildHomeModel(_role)) {
        if (typeof showToast === 'function') {
            showToast('Home layout is fixed and no longer customizable.');
        }
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
    function scheduleTimetableBackgroundRefresh() {
        let attempts = 0;
        const run = () => {
            const body = document.body;
            if (body?.classList.contains('kiu-shell-loading')
                || body?.classList.contains('timetable-assembly-active')) {
                if (attempts < 24) {
                    attempts += 1;
                    window.setTimeout(run, 100);
                }
                return;
            }
            if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
                window.__kiuRefreshLuxuryBackground();
            }
        };
        // Keep the normal-device background, but do not import/initialize the
        // renderer in the timetable's first paint window.
        window.setTimeout(run, 900);
    }
    let luxuryShellEnsured = false;
    function ensureShell() {
        if (luxuryShellEnsured
            && document.getElementById('lux-shell')
            && document.getElementById('lux-topbar')) return;
        luxuryShellEnsured = true;
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
            if (document.body?.classList.contains('lux-route-timetable')) {
                scheduleTimetableBackgroundRefresh();
            } else {
                window.__kiuRefreshLuxuryBackground();
            }
        }
        if (typeof window.__kiuEnsureBackgroundGalleryMount === 'function') {
            window.__kiuEnsureBackgroundGalleryMount();
        }
        if (typeof window.__kiuSyncBackgroundGalleryMedia === 'function') {
            window.__kiuSyncBackgroundGalleryMedia(window.__kiuBackgroundGalleryCaches || {});
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
        const shell = topbar.querySelector('.lux-topbar-shell');
        if (shell) {
            shell.classList.add('lux-soft-chrome');
            shell.style.removeProperty('background');
            shell.style.removeProperty('background-color');
            shell.style.removeProperty('backdrop-filter');
            shell.style.removeProperty('-webkit-backdrop-filter');
        }
        // Topbar controls are framed CTAs (color-fade wells), not soft-chrome slabs.
        topbar.querySelectorAll('.lux-picker-btn, .lux-icon-btn').forEach((el) => {
            el.classList.remove('lux-soft-chrome');
            el.style.removeProperty('background');
            el.style.removeProperty('background-color');
            el.style.removeProperty('background-image');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
        });
        // User chip retired from topbar — strip any leftover markup from older shells.
        topbar.querySelector('#lux-user-chip')?.remove();
        document.getElementById('lux-user-menu')?.remove();
    }

        const isAdminAccountForRolePicker = () => {
            if (typeof window.isAuthenticatedAdminForRolePicker === 'function') {
                return window.isAuthenticatedAdminForRolePicker();
            }
            if (typeof getAuthenticatedAccountRole === 'function') {
                return String(getAuthenticatedAccountRole() || '').trim().toLowerCase() === 'admin';
            }
            try {
                const raw = sessionStorage.getItem('KIU_TAB_AUTH_STATE') || localStorage.getItem('KIU_AUTH_STATE');
                return String(JSON.parse(raw || '{}')?.role || '').trim().toLowerCase() === 'admin';
            } catch (error) {
                return false;
            }
        };
        if (!document.getElementById('lux-topbar')) {
            const topbar = document.createElement('div');
            topbar.id = 'lux-topbar';
            const initialTopbarPageId = typeof getActivePageId === 'function' ? getActivePageId() : 'home';
            const initialTopbarPageLabel = escapeHtml(pageLabel(initialTopbarPageId));
            const rolePickerMarkup = isAdminAccountForRolePicker()
                ? `
                        <div class="lux-picker-wrap" data-picker-wrap="role">
                            <button class="lux-picker-btn" id="lux-role-picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="lux-picker-caption">View</span>
                                <strong id="lux-role-picker-value">Workspace</strong>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>`
                : '';
            topbar.innerHTML = `
                <div class="lux-topbar-shell lux-soft-chrome">
                    <div class="lux-topbar-main">
                        <button class="lux-secondary-btn lux-sidebar-toggle-btn" id="lux-sidebar-toggle" type="button" aria-pressed="false" title="Show navigation">
                            <i class="fas fa-sidebar"></i>
                            <span class="lux-sidebar-toggle-label">Hide nav</span>
                        </button>
                        <div class="lux-breadcrumb">KIU <i class="fas fa-chevron-right"></i> <strong id="lux-breadcrumb-page">${initialTopbarPageLabel}</strong></div>
                    </div>
                    <div class="lux-topbar-spacer"></div>
                    <div class="lux-topbar-actions">
                        <div class="lux-picker-wrap" data-picker-wrap="faculty">
                            <button class="lux-picker-btn" id="lux-faculty-picker-btn" type="button" aria-haspopup="listbox" aria-expanded="false">
                                <span class="lux-picker-caption">Faculty</span>
                                <strong id="lux-faculty-picker-value">Faculty</strong>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                        ${rolePickerMarkup}
                        <button class="lux-secondary-btn lux-topbar-editor-btn" id="lux-dashboard-edit-btn" type="button" hidden title="Customize the home dashboard">
                            <i class="fas fa-sliders-h"></i>
                            <span id="lux-dashboard-edit-label">Customize</span>
                        </button>
                        <button class="lux-icon-btn" id="lux-palette-btn" type="button" title="Open colour and motion studio">
                            <i class="fas fa-palette"></i>
                        </button>
                        <div class="lux-utility-wrap">
                            <button class="lux-icon-btn" id="lux-notification-btn" type="button" title="Notifications">
                                <i class="far fa-bell"></i>
                                <span class="lux-icon-badge" id="lux-notification-badge">0</span>
                            </button>
                        </div>
                        <div class="lux-utility-wrap">
                            <button class="lux-icon-btn" id="lux-chat-btn" type="button" title="Messenger">
                                <i class="fas fa-comments"></i>
                                <span class="lux-icon-badge" id="lux-chat-badge">0</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(topbar);
        }
        ensureTopbarSoftChrome();
        // Respect saved preference on all unified-shell routes (default expanded).
        applySidebarState(isSidebarCollapsed(), { persist: false });
        if (typeof window.bindShellChromeMotion === 'function') {
            window.bindShellChromeMotion();
        }
    }
    function renderHomeChromeSkeleton(homeShell = document.getElementById('lux-home-shell')) {
        if (!homeShell || homeShellHasDashboardContent(homeShell)) return;
        if (homeShell.querySelector('[data-home-chrome-skeleton="1"]')) return;
        homeShell.innerHTML = `
            <div class="lux-home-grid is-loading" data-home-chrome-skeleton="1" data-home-loading-shell="1" data-lux-glass-root="1">
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
    __kiuLuxExpose({
        ensureLuxuryAdminToolsBundle,
    });
    function getBackgroundIntensity() {
        try { return getDashboardVisuals().backgroundIntensity || 'standard'; } catch(e) { return 'standard'; }
    }
    function ensureLuxuryBackgroundRuntime() {
        if (typeof window.__kiuInitLuxuryParticleBackground === 'function') return Promise.resolve(true);
        return window.__kiuLuxuryBackgroundModulePromise ||= import('./luxury-background.js?v=20260817-timetablebg1')
            .then(() => true).catch(() => false);
    }
    Object.assign(window, {
        ROLE_LABELS,
        PAGE_LABELS,
        NAV_BY_ROLE,
        STUDIO_PALETTES,
        BACKGROUND_MODES,
        STATIC_BACKGROUND_FILL_OPTIONS,
        PARTICLE_QUALITY_OPTIONS,
        GLASS_BLUR_QUALITY_OPTIONS,
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
        getStaticBackgroundFill,
        setStaticBackgroundFill,
        getBackgroundGallerySelection,
        setBackgroundGallerySelection,
        clearBackgroundGallery,
        getParticleMotion,
        setParticleMotion,
        getParticleDensity,
        setParticleDensity,
        getParticleQuality,
        setParticleQuality,
        getGlassBlurQuality,
        setGlassBlurQuality,
        getGlowStrength,
        setGlowStrength,
        normalizeGlowStrengthPercent,
        resolveGlowTokenConfig,
        applyGlowStrengthCssVars,
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
        getBackgroundIntensity,
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
    __luxAtmosphereBridge._syncStudioUi = syncStudioUi;
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
    window.getLuxuryPerformanceTier = getLuxuryPerformanceTier;
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
    function pauseLuxuryVisualObservers() {
        return __luxVisualRuntime?.pauseLuxuryVisualObservers?.();
    }
    function resumeLuxuryVisualObservers() {
        return __luxVisualRuntime?.resumeLuxuryVisualObservers?.();
    }
    Object.assign(window, {
        pauseLuxuryVisualObservers,
        resumeLuxuryVisualObservers,
    });
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
    __luxAtmosphereBridge._showToast = showToast;
    window.showToast = showToast;
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
    function isStandaloneSchedulerRouteActive() {
        return !isIndexPortalShell() && (
            getActiveEntryPageId() === 'admin-scheduler'
            || document.body?.classList?.contains('lux-route-admin-scheduler')
        );
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
        // Re-arm visual observers after SPA navigation (paused while document.hidden).
        if (!document.hidden) {
            resumeLuxuryVisualObservers();
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
    /* Wave 18: luxury-index-sync-runtime.js */
    const __luxSyncDeps = window.__kiuLuxuryIndexSyncDeps = {
        get queuedShellSyncFrame() { return queuedShellSyncFrame; },
        set queuedShellSyncFrame(v) { queuedShellSyncFrame = v; },
        isIndexPortalShell: (...a) => typeof isIndexPortalShell === 'function' && isIndexPortalShell(...a),
        isStandaloneLmsRouteActive: (...a) => typeof isStandaloneLmsRouteActive === 'function' && isStandaloneLmsRouteActive(...a),
        getActivePageId: (...a) => getActivePageId(...a),
        getActiveEntryPageId: (...a) => getActiveEntryPageId(...a),
        isLuxRouteWorkspace: (...a) => isLuxRouteWorkspace(...a),
        isAdminLibraryRouteContext: (...a) => isAdminLibraryRouteContext(...a),
        rehydrateIndexPortalEntry: (...a) => rehydrateIndexPortalEntry(...a),
        isLuxNavEmpty: (...a) => typeof isLuxNavEmpty === 'function' && isLuxNavEmpty(...a),
        renderHomeShell: (...a) => renderHomeShell(...a),
        syncTopbar: (...a) => (typeof syncTopbar === 'function' ? syncTopbar(...a) : window.syncTopbar?.(...a)),
        renderNav: (...a) => (typeof window.renderNav === 'function' ? window.renderNav(...a) : undefined),
        populateFacultySwitcher: (...a) => (typeof window.populateFacultySwitcher === 'function' ? window.populateFacultySwitcher(...a) : undefined),
        populateRoleSwitcher: (...a) => (typeof window.populateRoleSwitcher === 'function' ? window.populateRoleSwitcher(...a) : undefined),
        closePickerPanels: (...a) => closePickerPanels(...a),
        syncStudioUi: (...a) => syncStudioUi(...a),
        queueLegacyVisualRefresh: (...a) => queueLegacyVisualRefresh(...a),
        scheduleOrdersRouteBackgroundRefresh: (...a) => scheduleOrdersRouteBackgroundRefresh(...a),
        DEFAULT_HOME_VISUALS,
        renderLuxuryAdminToolsPage: (...a) => renderLuxuryAdminToolsPage(...a),
        schedulePublicSocialRenderBoost: (...a) => typeof schedulePublicSocialRenderBoost === 'function' && schedulePublicSocialRenderBoost(...a),
        getEffectiveRole: (...a) => getEffectiveRole(...a),
        USER_ROLES,
        renderAdminExamSection: (...a) => typeof renderAdminExamSection === 'function' && renderAdminExamSection(...a),
        queueHeavySurfaceObservationRefresh: (...a) => typeof queueHeavySurfaceObservationRefresh === 'function' && queueHeavySurfaceObservationRefresh(...a),
        getDashboardVisuals: (...a) => getDashboardVisuals(...a),
        getCurrentFacultyCode: (...a) => getCurrentFacultyCode(...a),
        getThemeMode: (...a) => getThemeMode(...a),
        resolvePaletteKey: (...a) => resolvePaletteKey(...a),
        HOME_EDITOR_STATE,
        getBackgroundMode: (...a) => getBackgroundMode(...a),
        getParticleMotion: (...a) => getParticleMotion(...a),
        getParticleDensity: (...a) => getParticleDensity(...a),
        getParticleAmount: (...a) => getParticleAmount(...a),
        getParticleSharpness: (...a) => getParticleSharpness(...a),
        getParticleQuality: (...a) => getParticleQuality(...a),
        getGlassBlurQuality: (...a) => getGlassBlurQuality(...a),
        areBackgroundAnimationsEnabled: (...a) => areBackgroundAnimationsEnabled(...a),
        getStaticBackgroundFill: (...a) => getStaticBackgroundFill(...a),
        applyThemeMode: (...a) => applyThemeMode(...a),
        applyResolvedPalette: (...a) => applyResolvedPalette(...a),
        applyAtmosphereSettings: (...a) => applyAtmosphereSettings(...a),
        applyLuxuryPerformanceProfile: (...a) => applyLuxuryPerformanceProfile(...a),
        applyPortalPageState: (...a) => applyPortalPageState(...a),
        ensureShell: (...a) => ensureShell(...a),
        ensureHomeShell: (...a) => ensureHomeShell(...a),
        syncLayout: (...a) => window.syncLayout?.(...a),
        syncAll: (...a) => window.syncAll?.(...a),
        syncVisualStateOnly: (...a) => window.syncVisualStateOnly?.(...a),
        queueLuxuryTransparencyRefresh: (...a) => window.queueLuxuryTransparencyRefresh?.(...a),
        getGlowStrength: (...a) => typeof getGlowStrength === 'function' ? getGlowStrength(...a) : null,
        setGlowStrength: (...a) => typeof setGlowStrength === 'function' ? setGlowStrength(...a) : null,
        getBackgroundIntensity: (...a) => typeof getBackgroundIntensity === 'function' ? getBackgroundIntensity(...a) : null,
        applyLuxuryTransparencyPreferenceState: (...a) => typeof applyLuxuryTransparencyPreferenceState === 'function' ? applyLuxuryTransparencyPreferenceState(...a) : window.applyLuxuryTransparencyPreferenceState?.(...a)
    };
    const __luxSyncApi = typeof window.__kiuCreateLuxuryIndexSyncApi === 'function'
        ? window.__kiuCreateLuxuryIndexSyncApi(__luxSyncDeps) : null;
    if (!__luxSyncApi) throw new Error('luxury-index-sync-runtime.js missing');
    const { queueShellSync, syncLayout, buildTransparencySyncSignature, buildVisualStateSyncSignature, syncAll, syncVisualStateOnly } = __luxSyncApi;
    // Keep deps.sync* pointing at live bindings for internal recursion.
    Object.assign(__luxSyncDeps, { syncLayout, syncAll, syncVisualStateOnly, queueShellSync });

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
    window.getGlowStrength = typeof getGlowStrength === 'function'
        ? getGlowStrength
        : window.getGlowStrength;
    window.setGlowStrength = typeof setGlowStrength === 'function'
        ? setGlowStrength
        : window.setGlowStrength;
    window.normalizeGlowStrengthPercent = typeof normalizeGlowStrengthPercent === 'function'
        ? normalizeGlowStrengthPercent
        : window.normalizeGlowStrengthPercent;
    window.resolveGlowTokenConfig = typeof resolveGlowTokenConfig === 'function'
        ? resolveGlowTokenConfig
        : window.resolveGlowTokenConfig;
    window.applyGlowStrengthCssVars = typeof applyGlowStrengthCssVars === 'function'
        ? applyGlowStrengthCssVars
        : window.applyGlowStrengthCssVars;
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
    window.resetSavedRoleLayout = typeof resetSavedRoleLayout === 'function'
        ? resetSavedRoleLayout
        : window.resetSavedRoleLayout;
    window.resetAllSavedHomeLayouts = typeof resetAllSavedHomeLayouts === 'function'
        ? resetAllSavedHomeLayouts
        : window.resetAllSavedHomeLayouts;
    window.resetHomeToDefaults = typeof resetHomeToDefaults === 'function'
        ? resetHomeToDefaults
        : window.resetHomeToDefaults;
    /* Dashboard Builder Overrides */
    /* Route-owned home dashboard and editor bundle loader */
    const HOME_DASHBOARD_LOAD_TIMEOUT_MS = 10000;
    let __luxHomeShellResizeTimer = null;
    const __luxHomeRuntime = typeof window.__kiuCreateLuxuryHomeDashboardRuntime === 'function'
        ? window.__kiuCreateLuxuryHomeDashboardRuntime({
            ensureHomeShell,
            escapeHtml,
            getActivePageId,
            isIndexPortalShell: () => typeof isIndexPortalShell === 'function' && isIndexPortalShell(),
            queueHeavySurfaceObservationRefresh: () => __luxVisualRuntime?.queueHeavySurfaceObservationRefresh?.()
        })
        : null;

    /* Wave 18: luxury-index-home-shell-runtime.js */
    const __luxHomeShellDeps = window.__kiuLuxuryIndexHomeShellDeps = {
        get __luxHomeRuntime() { return __luxHomeRuntime; },
        ensureHomeShell: (...a) => ensureHomeShell(...a),
        getActivePageId: (...a) => getActivePageId(...a),
        isIndexPortalShell: (...a) => (typeof isIndexPortalShell === 'function' ? isIndexPortalShell(...a) : false)
    };
    const __luxHomeShellApi = typeof window.__kiuCreateLuxuryIndexHomeShellApi === 'function'
        ? window.__kiuCreateLuxuryIndexHomeShellApi(__luxHomeShellDeps)
        : {
            // Bare portals omit the home-shell peel; index.html loads it for the dashboard route.
            homeShellHasLoadingPlaceholder: () => false,
            homeShellHasDashboardContent: () => false,
            renderHomeShellRecoveryPanel: () => {},
            __luxHomeRecoveryPanelContract: () => {},
            renderHomeShell: () => {},
            isLuxuryHomeRoute: () => false,
            scheduleLuxuryHomeDashboardPreload: () => Promise.resolve(false),
            decodeLuxuryHomeChunkSource: () => '',
            scheduleLuxuryHomeDashboardChunkRetry: () => {},
            ensureLuxuryHomeDashboardBundle: () => Promise.resolve(false)
        };
    const { homeShellHasLoadingPlaceholder, homeShellHasDashboardContent, renderHomeShellRecoveryPanel, __luxHomeRecoveryPanelContract, renderHomeShell, isLuxuryHomeRoute, scheduleLuxuryHomeDashboardPreload, decodeLuxuryHomeChunkSource, scheduleLuxuryHomeDashboardChunkRetry, ensureLuxuryHomeDashboardBundle } = __luxHomeShellApi;

    // index-luxury is deferred after the route's dependency graph. Build the
    // shared chrome immediately when this file finishes instead of waiting for
    // DOMContentLoaded; the normal ready callback still binds and syncs it.
    if (document.body) ensureShell();

    __kiuLuxExpose({
        renderHomeShell,
        ensureLuxuryHomeDashboardBundle,
        recoverIndexPortalShell,
        rehydrateIndexPortalEntry,
        bootstrapIndexPortalChromeSync,
    });
    ready(() => {
        window.renderLuxuryAdminToolsPage = (...args) => renderLuxuryAdminToolsPage(...args);
        ensureBackgroundGalleryScripts()
            .then(() => {
                const token = typeof window.getPortalSessionToken === 'function'
                    ? window.getPortalSessionToken()
                    : '';
                if (token && typeof window.refreshBackgroundGalleryData === 'function') {
                    return window.refreshBackgroundGalleryData();
                }
                return null;
            })
            .catch(() => {});
        ensureShell();
        ensureHomeShell();
        bindUserMenu();
        bindTopbarControls();
        if (typeof isIndexPortalShell === 'function' && isIndexPortalShell()) {
            bootstrapIndexPortalChromeSync();
        }
        // Skip duplicate visual apply when initPalette/syncAll already stamped the same signature.
        if (typeof buildVisualStateSyncSignature === 'function') {
            const visualSignature = buildVisualStateSyncSignature();
            if (window.__luxLastVisualStateSyncSignature !== visualSignature) {
                applyThemeMode(getThemeMode(), false);
                applyResolvedPalette();
                applyAtmosphereSettings();
                applyLuxuryPerformanceProfile();
                window.__luxLastVisualStateSyncSignature = visualSignature;
            }
        } else {
            applyThemeMode(getThemeMode(), false);
            applyResolvedPalette();
            applyAtmosphereSettings();
            applyLuxuryPerformanceProfile();
        }
        wrapFunction('navigate', queueNavigateSync);
        wrapFunction('switchRole', queueShellSync);
        wrapFunction('switchFacultyTheme', queueShellSync);
        wrapFunction('refreshShellIdentity', queueShellSync);
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                pauseLuxuryVisualObservers();
            } else {
                resumeLuxuryVisualObservers();
            }
        });
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
                const onStandaloneScheduler = isStandaloneSchedulerRouteActive();
                enhanceUniversalPickers(document.querySelector('.page-section.active-page') || document);
                observeUniversalPickers();
                if (!onStandaloneLms && !onStandaloneAdminOrders && !onStandaloneLibrary && !onStandaloneOrders && !onStandaloneScheduler) {
                    observeLegacyVisualTree();
                    queueLegacyVisualRefresh(document.querySelector('.page-section.active-page') || document.body);
                    queueHeavySurfaceObservationRefresh();
                }
                if (typeof window.scheduleLuxuryTransparencyBootRefresh === 'function') {
                    window.scheduleLuxuryTransparencyBootRefresh(
                        getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency') || 70
                    );
                }
                const scheduleParticleInit = () => {
                    if (typeof window.__kiuInitLuxuryParticleBackground === 'function') return window.__kiuInitLuxuryParticleBackground();
                    ensureLuxuryBackgroundRuntime().then((loaded) => loaded && window.__kiuInitLuxuryParticleBackground?.());
                };
                if (!onStandaloneAdminOrders && !onStandaloneScheduler) {
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
                        // Coalesced via scheduleRenderHomeShell inside renderHomeShell.
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
        const wasScrolling = window.__luxIsScrolling === true;
        window.__luxIsScrolling = true;
        if (!wasScrolling && typeof window.notifyLuxGovernorStateChange === 'function') {
            window.notifyLuxGovernorStateChange();
        }
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            window.__luxIsScrolling = false;
            if (typeof window.notifyLuxGovernorStateChange === 'function') {
                window.notifyLuxGovernorStateChange();
            }
            if (typeof window.flushLuxuryTransparencyAfterScroll === 'function') {
                window.flushLuxuryTransparencyAfterScroll();
            }
        }, 150);
    };
    document.addEventListener('scroll', markScrolling, { capture: true, passive: true });
})();
