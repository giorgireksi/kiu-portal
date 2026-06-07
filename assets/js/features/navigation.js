/* Navigation and route switching logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- PERFORMANCE: Cache DOM queries to avoid repeated full-DOM scans ---
let _domCache = {
    pageSections: null,
    allNavItems: null,
    serviceNavItems: null,
    lastPageId: null, // Track last page to skip redundant renders
    lastRenderedPages: new Set() // Track which pages have been rendered
};

function invalidateDomCache() {
    _domCache.pageSections = null;
    _domCache.allNavItems = null;
    _domCache.serviceNavItems = null;
    _domCache.lastPageId = null;
    _domCache.lastRenderedPages = new Set();
}

// Expose globally for utilities.js to call on role/faculty switch
window.invalidateDomCache = invalidateDomCache;

function getPageSections() {
    if (!_domCache.pageSections) {
        _domCache.pageSections = document.querySelectorAll('.page-section');
    }
    return _domCache.pageSections;
}

function isRoutePlaceholderSection(section) {
    return section?.dataset?.routePlaceholder === 'true';
}

function getNavigablePageSection(pageId) {
    const targetId = `page-${pageId}`;
    const sections = getPageSections();
    for (const section of sections) {
        if (section.id === targetId && !isRoutePlaceholderSection(section)) {
            return section;
        }
    }
    return null;
}

function isPageSectionShown(section) {
    return Boolean(section) && !section.hidden && section.style.display !== 'none';
}

function setPageSectionShown(section, shown, displayMode = 'block') {
    if (!section) return;
    section.hidden = !shown;
    section.style.display = shown ? displayMode : 'none';
}

function syncShellNavVisibility(pageId, effectiveRole = getEffectiveUserRole()) {
    const topNav = document.getElementById('top-nav');
    const adminNav = document.getElementById('admin-nav');
    const profNav = document.getElementById('prof-nav');
    const serviceNav = document.getElementById('service-nav');
    if (topNav) {
        topNav.style.display = (effectiveRole === USER_ROLES.STUDENT && pageId !== 'home') ? 'flex' : 'none';
    }
    if (adminNav) {
        adminNav.style.display = effectiveRole === USER_ROLES.ADMIN ? 'flex' : 'none';
    }
    if (profNav) {
        profNav.style.display = (effectiveRole === USER_ROLES.PROFESSOR || effectiveRole === USER_ROLES.TA) ? 'flex' : 'none';
    }
    if (serviceNav) {
        serviceNav.style.display = effectiveRole === USER_ROLES.STUDENT_SERVICE ? 'flex' : 'none';
    }
}

window.syncShellNavVisibility = syncShellNavVisibility;

function syncShellNavActiveItem(pageId, effectiveRole = getEffectiveUserRole()) {
    getAllNavItems().forEach((nav) => nav.classList.remove('active'));
    let navItem = document.getElementById('nav-' + pageId);
    if (pageId === 'social') {
        if (effectiveRole === USER_ROLES.ADMIN) {
            navItem = document.querySelector('#admin-nav [data-nav-social]');
        } else if ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(effectiveRole)) {
            navItem = document.querySelector('#prof-nav [data-nav-social]');
        } else {
            navItem = document.getElementById('nav-social');
        }
    }
    if (navItem) navItem.classList.add('active');
    if (effectiveRole === USER_ROLES.STUDENT_SERVICE && document.getElementById('service-nav')) {
        const serviceNavItem = _serviceNavTargetMap.get(pageId);
        if (serviceNavItem) serviceNavItem.classList.add('active');
    }
}

function primeShellSectionTransition(pageId, effectiveRole = getEffectiveUserRole()) {
    const targetSection = getNavigablePageSection(pageId);
    if (!targetSection) return false;
    if (isSamePageNavigation(pageId)) return true;
    syncShellSectionLocation(pageId, effectiveRole);
    let found = false;
    getPageSections().forEach((section) => {
        if (section.id === 'page-' + pageId) {
            setPageSectionShown(section, true, (pageId === 'admin-scheduler') ? 'flex' : 'block');
            section.classList.add('active-page');
            found = true;
        } else {
            setPageSectionShown(section, false);
            section.classList.remove('active-page');
        }
    });
    syncShellNavVisibility(pageId, effectiveRole);
    syncShellNavActiveItem(pageId, effectiveRole);
    if (found) {
        _domCache.lastPageId = pageId;
    }
    return found;
}

function resolveShellRouteUrl(pageId, role = getEffectiveUserRole()) {
    const normalizedRole = String(role || getEffectiveUserRole() || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
    const normalizedPageId = String(pageId || 'home').trim().toLowerCase() || 'home';
    return `index.html?view=${encodeURIComponent(normalizedRole)}#${encodeURIComponent(normalizedPageId)}`;
}

function syncShellSectionLocation(pageId, role = getEffectiveUserRole()) {
    if (!isIndexPortalShell()) return;
    try {
        const nextUrl = new URL(resolveShellRouteUrl(pageId, role), window.location.href);
        const currentUrl = new URL(window.location.href);
        if (
            currentUrl.pathname === nextUrl.pathname
            && currentUrl.search === nextUrl.search
            && currentUrl.hash === nextUrl.hash
        ) {
            return;
        }
        window.history.replaceState({}, document.title, nextUrl.toString());
    } catch (error) {}
}

function normalizePortalPageId(pageId) {
    return String(pageId === 'profile' ? 'profile-view' : (pageId || 'home')).trim().toLowerCase() || 'home';
}

function resolveAliasPageId(pageId, role = getEffectiveUserRole()) {
    const normalizedPageId = normalizePortalPageId(pageId);
    if (normalizedPageId === 'calendar') return 'timetable';
    if (normalizedPageId === 'gradebook') {
        const normalizedRole = String(role || getEffectiveUserRole() || USER_ROLES.STUDENT).trim().toLowerCase();
        if (normalizedRole === USER_ROLES.PROFESSOR || normalizedRole === USER_ROLES.TA) {
            return 'faculty-gradebook';
        }
        return 'gradebook';
    }
    return normalizedPageId;
}

window.resolveAliasPageId = resolveAliasPageId;

function resolvePortalRouteUrl(pageId, role = getEffectiveUserRole()) {
    const normalizedPageId = resolveAliasPageId(pageId, role);
    if (normalizedPageId === 'home') {
        return typeof getRoleHomePage === 'function'
            ? getRoleHomePage(role)
            : `index.html?view=${encodeURIComponent(String(role || 'student'))}#home`;
    }
    if (normalizedPageId === 'library' && role === USER_ROLES.ADMIN) return 'admin-library.html';
    if (normalizedPageId === 'orders' && role === USER_ROLES.ADMIN) return 'admin-orders.html';

    const routeMap = {
        'admin-tools': 'admin-tools.html',
        'admin-scheduler': 'admin-scheduler.html',
        'staff': 'staff.html',
        'students-admin': 'students-admin.html',
        'profile-view': 'profile-view.html',
        'social': 'social.html',
        'news': 'news.html',
        'exams': 'exams.html',
        'library': 'library.html',
        'orders': 'orders.html',
        'lms': 'lms.html',
        'programs': 'programs.html',
        'registration': 'registration.html',
        'study-card': 'study-card.html',
        'timetable': 'timetable.html',
        'gradebook': 'gradebook.html',
        'faculty-gradebook': 'faculty-gradebook.html',
        'faculty-schedule': 'faculty-schedule.html',
        'personal-data': 'personal-data.html',
        'student-service': 'student-service.html',
        'chancellery': 'chancellery.html'
    };

    return routeMap[normalizedPageId] || `${normalizedPageId}.html`;
}

function assignStandalonePortalRoute(pageId, role = getEffectiveUserRole()) {
    const targetUrl = resolvePortalRouteUrl(pageId, role);
    persistNavigationAuthSnapshot();
    window.location.assign(targetUrl);
}

window.resolvePortalRouteUrl = resolvePortalRouteUrl;

const PORTAL_ROUTE_KIND = {
    'calendar': 'alias-redirect',
    'faculty-schedule': 'alias-redirect',
    'gradebook': 'alias-redirect',
    'exam-portal': 'special-page',
    'login': 'special-page',
    'protected-launch': 'special-page'
};

const PORTAL_STANDALONE_ROUTE_IDS = new Set([
    'admin-scheduler',
    'admin-tools',
    'chancellery',
    'exams',
    'faculty-gradebook',
    'faculty-schedule',
    'gradebook',
    'library',
    'lms',
    'news',
    'orders',
    'personal-data',
    'profile-view',
    'programs',
    'registration',
    'staff',
    'student-service',
    'students-admin',
    'study-card',
    'timetable'
]);

function getPortalRouteMode(pageId, options = {}) {
    const normalizedPageId = resolveAliasPageId(pageId, getEffectiveUserRole());
    if (PORTAL_ROUTE_KIND[normalizedPageId]) return PORTAL_ROUTE_KIND[normalizedPageId];
    if (PORTAL_STANDALONE_ROUTE_IDS.has(normalizedPageId)) return 'standalone';
    const hasNavigableSection = typeof options.hasNavigableSection === 'boolean'
        ? options.hasNavigableSection
        : Boolean(getNavigablePageSection(normalizedPageId));
    if (isIndexPortalShell() && (normalizedPageId === 'home' || hasNavigableSection)) {
        return 'spa-section';
    }
    return 'standalone';
}

window.getPortalRouteMode = getPortalRouteMode;

function getAllNavItems() {
    if (!_domCache.allNavItems) {
        _domCache.allNavItems = document.querySelectorAll('.nav-item');
    }
    return _domCache.allNavItems;
}

function getServiceNavItems() {
    if (!_domCache.serviceNavItems) {
        _domCache.serviceNavItems = document.querySelectorAll('#service-nav .nav-item');
    }
    return _domCache.serviceNavItems;
}

let kiuShellInitialized = false;
let kiuShellStartupCompleted = false;
let kiuShellStartupAttempts = 0;
let portalStartupPollDelayMs = 16;
const PORTAL_STARTUP_MAX_ATTEMPTS = 48;
const STUDENT_SHELL_ADMIN_ENTRY_IDS = new Set(['admin-tools', 'admin-scheduler', 'staff', 'students-admin', 'admin-library', 'admin-orders', 'profile-view', 'lms']);

function getStandaloneEntryPageId(pathname = window.location.pathname) {
    const normalizedPath = String(pathname || '').replace(/\\/g, '/').toLowerCase();
    const fileName = normalizedPath.split('/').filter(Boolean).pop() || '';
    if (!fileName || !fileName.endsWith('.html')) return '';
    return fileName.replace(/\.html$/i, '');
}

function isIndexPortalShell(pathname = window.location.pathname) {
    const entry = getStandaloneEntryPageId(pathname);
    return !entry || entry === 'index';
}

function shouldUseStudentShellVisualRole(pathname = window.location.pathname) {
    return STUDENT_SHELL_ADMIN_ENTRY_IDS.has(getStandaloneEntryPageId(pathname));
}

function isStandaloneAdminWorkspaceEntry(pathname = window.location.pathname) {
    return STUDENT_SHELL_ADMIN_ENTRY_IDS.has(getStandaloneEntryPageId(pathname));
}

function getNavigationAuthRole() {
    const authRole = String(currentUser?.role || '').trim().toLowerCase();
    if (authRole) return authRole;
    return typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (typeof currentUserRole !== 'undefined' ? currentUserRole : USER_ROLES.STUDENT);
}

function bootstrapStandaloneAdminWorkspaceShell() {
    const initialRole = getEffectiveUserRole();
    const visualRole = shouldUseStudentShellVisualRole() ? USER_ROLES.STUDENT : initialRole;
    Array.from(document.body.classList)
        .filter(className => className.startsWith('role-'))
        .forEach(className => document.body.classList.remove(className));
    document.body.classList.add(`role-${visualRole}`);

    const roleSelect = document.getElementById('role-switcher-select');
    if (roleSelect) {
        roleSelect.value = initialRole;
        if (!roleSelect.dataset.roleSwitchBound) {
            roleSelect.dataset.roleSwitchBound = '1';
            roleSelect.addEventListener('change', () => {
                if (typeof switchRole === 'function') switchRole(roleSelect.value);
            });
        }
    }

    const facSelect = document.getElementById('faculty-select');
    const storedFac = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
    if (facSelect) facSelect.value = storedFac;
    if (typeof switchFacultyTheme === 'function') {
        switchFacultyTheme(storedFac, { refreshDependentViews: false });
    }
    if (typeof refreshShellIdentity === 'function') refreshShellIdentity();
    if (typeof ensureOrdersNavLinks === 'function') ensureOrdersNavLinks();
    cacheServiceNavItemTargets();
    const entryId = getStandaloneEntryPageId();
    if (entryId === 'admin-tools' && typeof renderLuxuryAdminToolsPage === 'function') {
        renderLuxuryAdminToolsPage();
    }
    kiuShellStartupCompleted = true;
    markPortalShellReady();
}

function runDeferredPortalStartupForStandaloneAdmin() {
    const entryId = getStandaloneEntryPageId();
    const authRole = getNavigationAuthRole();
    if (entryId === 'admin-tools' && authRole === USER_ROLES.ADMIN) {
        if (typeof renderLuxuryAdminToolsPage === 'function') renderLuxuryAdminToolsPage();
        if (typeof onAdminDashboardLoad === 'function') onAdminDashboardLoad();
    }
    kiuShellStartupCompleted = true;
    markPortalShellReady();
}

window.shouldUseStudentShellVisualRole = shouldUseStudentShellVisualRole;
window.isStandaloneAdminWorkspaceEntry = isStandaloneAdminWorkspaceEntry;
window.getNavigationAuthRole = getNavigationAuthRole;

const REGISTRATION_RUNTIME_PAGES = new Set([
    'gradebook',
    'lms',
    'programs',
    'registration',
    'study-card',
    'timetable'
]);

const SOCIAL_RUNTIME_PAGES = new Set([
    'faculty-gradebook',
    'faculty-schedule',
    'social'
]);

const STANDALONE_REGISTRATION_RUNTIME_GUARDS = {
    'programs': () => typeof window.renderStudentEducationalProgramPage === 'function',
    'study-card': () => typeof window.renderStudyCard === 'function'
};

function ensureRuntimeForPage(pageId) {
    const loaders = [];
    const registrationGuard = STANDALONE_REGISTRATION_RUNTIME_GUARDS[pageId];
    const registrationRuntimeAlreadyOwned = typeof registrationGuard === 'function' ? registrationGuard() : false;
    if (
        REGISTRATION_RUNTIME_PAGES.has(pageId)
        && typeof ensurePortalRegistrationRuntimeLoaded === 'function'
        && !registrationRuntimeAlreadyOwned
    ) {
        loaders.push(ensurePortalRegistrationRuntimeLoaded());
    }
    if (SOCIAL_RUNTIME_PAGES.has(pageId) && typeof ensurePortalSocialRuntimeLoaded === 'function') {
        loaders.push(ensurePortalSocialRuntimeLoaded());
    }
    if (pageId === 'news' && typeof ensurePortalNewsRuntimeLoaded === 'function' && typeof window.renderNewsWorkspace !== 'function') {
        loaders.push(ensurePortalNewsRuntimeLoaded());
    }
    if (pageId === 'student-service' && typeof ensurePortalStudentServiceRuntimeLoaded === 'function' && typeof window.renderStudentServicePage !== 'function') {
        loaders.push(ensurePortalStudentServiceRuntimeLoaded());
    }
    if (pageId === 'orders' && typeof ensurePortalOrdersRuntimeLoaded === 'function' && typeof renderOrdersInboxPage !== 'function') {
        loaders.push(ensurePortalOrdersRuntimeLoaded());
    }
    if (pageId === 'library' && typeof ensurePortalLibraryRuntimeLoaded === 'function' && typeof window.renderLibraryPageShellContext !== 'function') {
        loaders.push(ensurePortalLibraryRuntimeLoaded());
    }
    if (!loaders.length) return null;
    return Promise.all(loaders).catch((error) => {
        console.warn(`Could not lazy-load runtime for ${pageId}.`, error);
        return false;
    });
}

function isPortalStartupDependencyReady() {
    const dependencyChecks = [
        ['study-card-container', 'renderStudyCard'],
        ['timetable-master-container', 'renderTimetable'],
        ['lms-subject-grid', 'renderLMSSubjects'],
        ['staff-content', 'renderStaffPage'],
        ['students-content', 'renderStudentsPage'],
        ['admin-orders-root', 'renderAdminOrders'],
        ['page-orders', 'renderOrdersInboxPage'],
        ['orders-inbox-root', 'renderOrdersInboxPage'],
        ['page-library', 'renderLibraryPageShellContext'],
        ['page-chancellery', 'renderChancelleryPage'],
        ['page-student-service', 'renderStudentServicePage']
    ];
    return dependencyChecks.every(([elementId, functionName]) => {
        if (!document.getElementById(elementId)) return true;
        return typeof window[functionName] === 'function';
    });
}

function markPortalShellReady() {
    document.documentElement.classList.remove('kiu-shell-loading');
    document.body?.classList.remove('kiu-shell-loading');
}

window.markPortalShellReady = markPortalShellReady;

function normalizeIndexPortalHomeHash() {
    if (!isIndexPortalShell()) return;
    const hash = String(window.location.hash || '').replace('#', '').trim().toLowerCase();
    if (hash) return;
    try {
        const url = new URL(window.location.href);
        url.hash = 'home';
        history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    } catch (error) {
        window.location.hash = 'home';
    }
}

function invokeIndexPortalRehydrate(options = {}) {
    if (!isIndexPortalShell()) {
        markPortalShellReady();
        return;
    }
    const useChromeOnly = options.chromeOnly === true
        || (window.__kiuIndexChromeBootstrapped === true
            && options.fullRecovery !== true
            && options.resetHomeBundle !== true);
    if (typeof window.rehydrateIndexPortalEntry === 'function') {
        window.rehydrateIndexPortalEntry({
            ...options,
            chromeOnly: useChromeOnly
        });
        return;
    }
    if (typeof window.recoverIndexPortalShell === 'function') {
        window.recoverIndexPortalShell(options);
        return;
    }
    markPortalShellReady();
}

function tryMarkPortalShellInteractive() {
    if (
        document.getElementById('lux-shell')
        || document.getElementById('lux-nav')
        || getStandaloneEntryPageId()
    ) {
        markPortalShellReady();
    }
}

function scheduleRouteContentRender(renderFn) {
    tryMarkPortalShellInteractive();
    if (typeof renderFn !== 'function') return;
    let hasRun = false;
    const run = () => {
        if (hasRun) return;
        hasRun = true;
        try {
            renderFn();
        } catch (error) {
            console.warn('Route content render failed.', error);
        }
    };
    const fallbackTimer = window.setTimeout(run, 48);
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(() => {
            window.clearTimeout(fallbackTimer);
            run();
        }, { timeout: 120 });
        return;
    }
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
            window.clearTimeout(fallbackTimer);
            run();
        });
        return;
    }
    run();
}

window.scheduleRouteContentRender = scheduleRouteContentRender;

function inferStandaloneRouteFamily(pageId, fallbackFamily = '') {
    const normalizedPageId = normalizeStandaloneActivePageId(pageId);
    const familyMap = {
        'admin-scheduler': 'admin',
        'admin-tools': 'admin',
        'chancellery': 'support',
        'exams': 'faculty',
        'faculty-gradebook': 'faculty',
        'faculty-schedule': 'faculty',
        'gradebook': 'utility',
        'library': 'support',
        'lms': 'academic',
        'news': 'support',
        'orders': 'support',
        'personal-data': 'academic',
        'profile-view': 'utility',
        'programs': 'academic',
        'registration': 'academic',
        'staff': 'admin',
        'student-service': 'support',
        'students-admin': 'admin',
        'study-card': 'academic',
        'timetable': 'faculty'
    };
    return familyMap[normalizedPageId] || fallbackFamily || 'portal';
}

function applyStandaloneDesktopRouteVisualState(config = {}) {
    const body = document.body;
    if (!body) return;
    const pageId = normalizeStandaloneActivePageId(config.pageId || getActivePageId() || getStandaloneEntryPageId() || 'home');
    const entryId = normalizeStandaloneActivePageId(config.entryId || getStandaloneEntryPageId() || pageId || 'home');
    const family = inferStandaloneRouteFamily(pageId, config.family || body.dataset?.luxFamily || '');
    body.classList.remove('kiu-shell-loading', 'lux-home-page');
    body.classList.add('lux-unified-shell', 'lux-nonhome-page', `lux-route-${pageId}`);
    if (config.decorateModernized !== false) {
        body.classList.add('lux-site-modernized');
    }
    body.dataset.luxPage = pageId;
    body.dataset.luxEntry = entryId;
    body.dataset.luxFamily = family;
    if (!body.dataset.luxBackgroundMode) {
        body.dataset.luxBackgroundMode = localStorage.getItem('kiuLuxuryBackgroundMode') || 'peak';
    }
    document.documentElement.dataset.luxPage = pageId;
}

function syncStandaloneDesktopRouteVisualShell(config = {}) {
    applyStandaloneDesktopRouteVisualState(config);
    if (typeof config.onVisualSync === 'function') {
        config.onVisualSync(config);
        return;
    }
    if (typeof window.updateTransparency === 'function') {
        const savedTransparency = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
        if (!Number.isNaN(savedTransparency)) {
            window.updateTransparency(savedTransparency, config.transparencyOptions || undefined);
        }
    } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
        window.refreshLuxuryTransparencySurfaces();
    }
    const activeBackgroundMode = document.body?.dataset?.luxBackgroundMode
        || localStorage.getItem('kiuLuxuryBackgroundMode')
        || 'peak';
    if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
        window.__kiuRefreshLuxuryBackground(activeBackgroundMode);
    }
}

function refreshStandaloneDesktopShellChrome(options = {}) {
    const pageId = normalizeStandaloneActivePageId(options.pageId || getActivePageId() || getStandaloneEntryPageId() || 'home');
    const entryId = normalizeStandaloneActivePageId(options.entryId || getStandaloneEntryPageId() || pageId || 'home');
    applyStandaloneDesktopRouteVisualState({
        pageId,
        entryId,
        family: options.family || document.body?.dataset?.luxFamily || ''
    });
    if (typeof window.renderNav === 'function') window.renderNav();
    if (typeof window.syncTopbar === 'function') window.syncTopbar();
    if (typeof window.populateFacultySwitcher === 'function') window.populateFacultySwitcher();
    if (typeof window.populateRoleSwitcher === 'function') window.populateRoleSwitcher();
    syncStandaloneDesktopRouteVisualShell({
        pageId,
        entryId,
        family: options.family || document.body?.dataset?.luxFamily || '',
        onVisualSync: options.onVisualSync,
        transparencyOptions: options.transparencyOptions
    });
}

function refreshStandaloneDesktopRouteContent(pageId, options = {}) {
    const activePageId = normalizeStandaloneActivePageId(pageId || getActivePageId() || getStandaloneEntryPageId() || '');
    if (!activePageId) return false;

    if (typeof window.refreshStandalonePageContext === 'function') {
        window.refreshStandalonePageContext();
    }

    if (activePageId === 'registration' && typeof window.renderStudentRegStructures === 'function') {
        window.renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
        return true;
    }
    if (activePageId === 'study-card' && typeof window.renderStudyCard === 'function') {
        window.renderStudyCard();
        return true;
    }
    if (activePageId === 'timetable' && typeof window.renderTimetable === 'function') {
        window.renderTimetable();
        return true;
    }
    if (activePageId === 'faculty-gradebook') {
        if (typeof window.bindStandaloneGradebookShell === 'function') window.bindStandaloneGradebookShell();
        if (typeof window.initFacultyGradebookPage === 'function') {
            window.initFacultyGradebookPage();
            return true;
        }
    }
    if (activePageId === 'personal-data' && typeof window.renderPersonalDataPageContext === 'function') {
        const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const facultyProfile = typeof getFacultyProfile === 'function'
            ? getFacultyProfile(getCurrentFaculty())
            : null;
        if (activeUser) {
            window.renderPersonalDataPageContext(activeUser, facultyProfile);
            return true;
        }
    }
    if (activePageId === 'admin-scheduler' && typeof window.initializeAdminSchedulerPage === 'function') {
        window.initializeAdminSchedulerPage();
        return true;
    }
    if (activePageId === 'profile-view' && typeof window.renderProfile === 'function') {
        const params = new URLSearchParams(window.location.search || '');
        const profileType = String(params.get('type') || 'student').trim() || 'student';
        const profileId = String(params.get('id') || '').trim();
        const profileFaculty = String(params.get('fac') || localStorage.getItem('currentFaculty') || 'ECON').trim() || 'ECON';
        if (profileId) {
            window.renderProfile(profileType, profileId, profileFaculty);
            return true;
        }
    }
    if (activePageId === 'exams') {
        if (typeof window.renderExamsPageShellContext === 'function') window.renderExamsPageShellContext();
        if (typeof window.renderAdminExamSection === 'function') {
            window.renderAdminExamSection();
            return true;
        }
    }
    if (activePageId === 'social') {
        if (typeof window.schedulePublicSocialRenderBoost === 'function') {
            window.schedulePublicSocialRenderBoost();
            return true;
        }
        if (typeof window.__kiuSocialLiteRenderPage === 'function') {
            window.__kiuSocialLiteRenderPage(options.reason || 'standalone-route-refresh');
            return true;
        }
    }
    if (activePageId === 'admin-tools' && typeof window.renderLuxuryAdminToolsPage === 'function') {
        window.renderLuxuryAdminToolsPage();
        return true;
    }
    return false;
}

function bootStandaloneDesktopRoute(config = {}) {
    const pageId = normalizeStandaloneActivePageId(config.pageId || getActivePageId() || getStandaloneEntryPageId() || 'home');
    const entryId = normalizeStandaloneActivePageId(config.entryId || getStandaloneEntryPageId() || pageId || 'home');
    const family = inferStandaloneRouteFamily(pageId, config.family || '');
    const bootKey = `${entryId}::${pageId}`;
    const shellAlreadyBooted = window.__kiuStandaloneDesktopRouteBootKey === bootKey;
    const hasPageContentHook = typeof config.beforeBoot === 'function'
        || typeof config.renderContent === 'function'
        || typeof config.afterRender === 'function';
    let visualSyncFrame = 0;
    const routeRefresh = (options = {}) => {
        refreshStandaloneDesktopShellChrome({
            pageId,
            entryId,
            family,
            onVisualSync: config.onVisualSync,
            transparencyOptions: config.transparencyOptions
        });
        if (options.rerender === true && typeof config.routeRefresh === 'function') {
            config.routeRefresh(options);
            return;
        }
        if (options.rerender === true) {
            refreshStandaloneDesktopRouteContent(pageId, options);
        }
    };
    const scheduleRouteVisualSync = () => {
        if (visualSyncFrame) return;
        visualSyncFrame = window.requestAnimationFrame(() => {
            visualSyncFrame = 0;
            routeRefresh({ rerender: false, trigger: 'visual-sync' });
        });
    };
    const bootContent = async () => {
        if (typeof config.beforeBoot === 'function') {
            await config.beforeBoot();
        }
        if (typeof config.renderContent === 'function') {
            await config.renderContent();
        } else {
            refreshStandaloneDesktopRouteContent(pageId, { reason: 'standalone-default-content' });
        }
        if (typeof config.afterRender === 'function') {
            await config.afterRender();
        }
        window.__kiuStandaloneRouteContentBootKey = bootKey;
        scheduleRouteVisualSync();
    };
    const boot = () => {
        routeRefresh({ rerender: false, trigger: 'boot' });
        if (typeof markPortalShellReady === 'function') {
            markPortalShellReady();
        }
        if (typeof scheduleRouteContentRender === 'function') {
            scheduleRouteContentRender(bootContent);
        } else {
            void bootContent();
        }
    };

    if (shellAlreadyBooted) {
        if (hasPageContentHook && typeof scheduleRouteContentRender === 'function') {
            scheduleRouteContentRender(bootContent);
        }
        return;
    }

    window.__kiuStandaloneDesktopRouteBootKey = bootKey;

    window.refreshStandaloneDesktopRouteShellContext = function refreshStandaloneDesktopRouteShellContext(options = {}) {
        routeRefresh({ ...options, rerender: options.rerender === true });
    };
    window.refreshStandaloneDesktopShellChrome = refreshStandaloneDesktopShellChrome;
    window.ensureStandaloneDesktopRouteVisualState = function ensureStandaloneDesktopRouteVisualStateBridge(options = {}) {
        applyStandaloneDesktopRouteVisualState({
            pageId,
            entryId,
            family,
            ...options
        });
    };
    window.scheduleStandaloneDesktopRouteVisualShellSync = scheduleRouteVisualSync;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }

    window.addEventListener('pageshow', scheduleRouteVisualSync);
    window.addEventListener('focus', scheduleRouteVisualSync);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) scheduleRouteVisualSync();
    });
}

window.ensureStandaloneDesktopRouteVisualState = applyStandaloneDesktopRouteVisualState;
window.refreshStandaloneDesktopShellChrome = refreshStandaloneDesktopShellChrome;
window.bootStandaloneDesktopRoute = bootStandaloneDesktopRoute;

function autoBootStandaloneDesktopRoute() {
    const entryId = normalizeStandaloneActivePageId(getStandaloneEntryPageId());
    if (!entryId || entryId === 'index' || entryId === 'lms') return;
    if (window.__kiuStandaloneDesktopRouteBootKey) return;
    bootStandaloneDesktopRoute({
        entryId,
        pageId: entryId,
        routeRefresh: function autoRefreshStandaloneDesktopRoute(options = {}) {
            refreshStandaloneDesktopRouteContent(entryId, {
                ...options,
                reason: 'auto-standalone-refresh'
            });
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoBootStandaloneDesktopRoute, { once: true });
} else {
    autoBootStandaloneDesktopRoute();
}

function normalizeStandaloneActivePageId(pageId) {
    const normalizedPageId = String(pageId || '').trim().toLowerCase();
    if (!normalizedPageId) return '';
    if (normalizedPageId === 'admin-library') return 'library';
    if (normalizedPageId === 'admin-orders') return 'orders';
    return normalizedPageId;
}

function getActivePageId() {
    const standaloneEntryId = getStandaloneEntryPageId();
    if (standaloneEntryId === 'social') {
        return 'social';
    }
    const activePage = document.querySelector('.page-section.active-page');
    if (activePage?.id?.startsWith('page-')) {
        return normalizeStandaloneActivePageId(activePage.id.slice(5));
    }
    const visiblePage = Array.from(document.querySelectorAll('.page-section')).find((section) => isPageSectionShown(section));
    if (visiblePage?.id?.startsWith('page-')) {
        return normalizeStandaloneActivePageId(visiblePage.id.slice(5));
    }
    const bodyPage = String(document.body?.dataset?.luxPage || document.body?.dataset?.luxEntry || '').trim();
    if (bodyPage) {
        return normalizeStandaloneActivePageId(bodyPage);
    }
    return normalizeStandaloneActivePageId(
        typeof getRuntimeRouteIntentFromPathname === 'function'
            ? getRuntimeRouteIntentFromPathname()
            : ((window.location.pathname || '').split('/').pop() || '').replace(/\.html$/i, '')
    );
}

function isSamePageNavigation(pageId) {
    const normalizedTarget = normalizeStandaloneActivePageId(pageId);
    const standaloneEntry = normalizeStandaloneActivePageId(getStandaloneEntryPageId());
    if (standaloneEntry && standaloneEntry === normalizedTarget) return true;
    if (isIndexPortalShell() && normalizeStandaloneActivePageId(getActivePageId()) === normalizedTarget) return true;
    return false;
}

function runDeferredPortalStartup() {
    const activeRole = getEffectiveUserRole();
    const activePageId = getActivePageId();
    const standaloneEntryId = getStandaloneEntryPageId();
    if (standaloneEntryId && getPortalRouteMode(standaloneEntryId, { hasNavigableSection: false }) === 'standalone') {
        try {
            localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
        } catch (error) {}
    }
    if (!window.__kiuDeferredRuntimeBootstrapAttempted) {
        const runtimePromise = ensureRuntimeForPage(activePageId);
        if (runtimePromise) {
            window.__kiuDeferredRuntimeBootstrapAttempted = true;
            runtimePromise.then(() => runDeferredPortalStartup());
            return;
        }
    }
    const forceHomeAfterRoleSwitch = localStorage.getItem('KIU_FORCE_HOME_ON_ROLE_SWITCH') === '1';
    if (forceHomeAfterRoleSwitch && document.getElementById('page-home') && !isStandaloneAdminWorkspaceEntry()) {
        const requestedRole = (() => {
            try {
                const viewRole = new URLSearchParams(window.location.search).get('view');
                return String(viewRole || localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || localStorage.getItem('currentUserRole') || activeRole || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
            } catch (error) {
                return String(activeRole || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
            }
        })();
        localStorage.removeItem('KIU_FORCE_HOME_ON_ROLE_SWITCH');
        if (requestedRole === USER_ROLES.ADMIN) {
            localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
            try { sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY); } catch (error) {}
        } else {
            localStorage.setItem(PENDING_ROLE_SWITCH_KEY, requestedRole);
            localStorage.setItem('currentUserRole', requestedRole);
            try { sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1'); } catch (error) {}
            if (typeof currentUserRole !== 'undefined') currentUserRole = requestedRole;
        }
        localStorage.removeItem('KIU_PENDING_SOCIAL_RETURN');
        localStorage.removeItem('KIU_PENDING_ADMIN_PAGE');
        const homeSection = getNavigablePageSection('home') || document.getElementById('page-home');
        if (homeSection) {
            getPageSections().forEach((section) => {
                if (section.id === 'page-home') {
                    setPageSectionShown(section, true, 'block');
                    section.classList.add('active-page');
                } else {
                    setPageSectionShown(section, false);
                    section.classList.remove('active-page');
                }
            });
            if (requestedRole === USER_ROLES.ADMIN) {
                if (typeof onAdminDashboardLoad === 'function') onAdminDashboardLoad();
            } else if (requestedRole === USER_ROLES.STUDENT_SERVICE && typeof renderStudentServiceHomeWorkspace === 'function') {
                renderStudentServiceHomeWorkspace();
            } else if (typeof renderHomeShell === 'function') {
                renderHomeShell();
            }
        } else {
            flushPortalStateForHardNavigation();
            window.location.replace(resolvePortalRouteUrl('home', requestedRole));
            return;
        }
        kiuShellStartupCompleted = true;
        invokeIndexPortalRehydrate({
            pageId: 'home',
            reason: 'force-home-startup',
            resetHomeBundle: true
        });
        return;
    }
    const pendingAdminPage = localStorage.getItem('KIU_PENDING_ADMIN_PAGE');
    const hasPageSection = pendingAdminPage ? Boolean(getNavigablePageSection(pendingAdminPage)) : false;
    if (pendingAdminPage && !hasPageSection) {
        localStorage.removeItem('KIU_PENDING_ADMIN_PAGE');
    } else if (pendingAdminPage && document.getElementById('page-home')) {
        localStorage.removeItem('KIU_PENDING_ADMIN_PAGE');
        navigate(pendingAdminPage);
        markPortalShellReady();
        return;
    }

    // Handle hash-based routing for legacy bookmarks.
    const hash = window.location.hash.replace('#', '');
    if (PORTAL_STANDALONE_ROUTE_IDS.has(hash)) {
        flushPortalStateForHardNavigation();
        window.location.replace(resolvePortalRouteUrl(hash, activeRole));
        return;
    }
    if (hash === 'calendar' && getNavigablePageSection('timetable')) {
        navigate('timetable');
        markPortalShellReady();
        return;
    }
    if (hash === 'programs' && typeof ensureIndexProgramsPage === 'function') {
        const programsPage = ensureIndexProgramsPage();
        if (programsPage) invalidateDomCache();
    }
    if (hash && hash !== 'home' && getNavigablePageSection(hash)) {
        navigate(hash);
        markPortalShellReady();
        return;
    }

    consumePendingSocialReturn();
    if (activePageId === 'home' || (!activePageId && document.getElementById('page-home'))) {
        if (activeRole === USER_ROLES.ADMIN) {
            if (typeof onAdminDashboardLoad === 'function') onAdminDashboardLoad();
        } else if (activeRole === USER_ROLES.STUDENT_SERVICE && typeof renderStudentServiceHomeWorkspace === 'function') {
            renderStudentServiceHomeWorkspace();
        } else if (typeof renderHomeShell === 'function') {
            renderHomeShell();
        }
    } else if (activePageId === 'admin-tools' && getNavigationAuthRole() === USER_ROLES.ADMIN) {
        if (typeof renderLuxuryAdminToolsPage === 'function') renderLuxuryAdminToolsPage();
        if (typeof onAdminDashboardLoad === 'function') onAdminDashboardLoad();
    } else if (activePageId === 'social') {
        if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
    } else if (activePageId === 'news') {
        if (typeof renderNewsWorkspace === 'function') renderNewsWorkspace();
    } else if (activePageId === 'exams') {
        if (typeof renderExamsPageShellContext === 'function') renderExamsPageShellContext();
        if (activeRole !== USER_ROLES.STUDENT && typeof renderAdminExamSection === 'function') {
            renderAdminExamSection();
        }
    } else if (activePageId === 'chancellery') {
        if (typeof renderChancelleryPage === 'function') renderChancelleryPage();
    } else if (activePageId === 'library') {
        if (typeof renderLibraryPage === 'function') renderLibraryPage();
    } else if (activePageId === 'study-card' && typeof renderStudyCard === 'function') {
        scheduleRouteContentRender(renderStudyCard);
    }
    kiuShellStartupCompleted = true;
    invokeIndexPortalRehydrate({
        pageId: activePageId || 'home',
        reason: 'deferred-startup',
        resetHomeBundle: activePageId === 'home' || !activePageId
    });
}

function primeDeferredShellRouteFromLocation(role = getEffectiveUserRole()) {
    const hash = window.location.hash.replace('#', '');
    let targetPageId = '';
    if (hash === 'calendar' && getNavigablePageSection('timetable')) {
        targetPageId = 'timetable';
    } else {
        if (hash === 'programs' && typeof ensureIndexProgramsPage === 'function') {
            const programsPage = ensureIndexProgramsPage();
            if (programsPage) invalidateDomCache();
        }
        if (hash && hash !== 'home' && getNavigablePageSection(hash)) {
            targetPageId = hash;
        }
    }
    if (!targetPageId) return false;
    return primeShellSectionTransition(targetPageId, role);
}

function queueDeferredPortalStartup() {
    if (getStandaloneEntryPageId() === 'social') {
        kiuShellStartupCompleted = true;
        markPortalShellReady();
        return;
    }
    if (isStandaloneAdminWorkspaceEntry()) {
        if (kiuShellStartupCompleted) {
            markPortalShellReady();
            return;
        }
        if (!isPortalStartupDependencyReady() && kiuShellStartupAttempts < PORTAL_STARTUP_MAX_ATTEMPTS) {
            kiuShellStartupAttempts += 1;
            const delay = portalStartupPollDelayMs;
            portalStartupPollDelayMs = Math.min(portalStartupPollDelayMs + 8, 64);
            window.setTimeout(queueDeferredPortalStartup, delay);
            return;
        }
        runDeferredPortalStartupForStandaloneAdmin();
        return;
    }
    if (kiuShellStartupCompleted) {
        markPortalShellReady();
        return;
    }
    const startupHash = window.location.hash.replace('#', '');
    if (PORTAL_STANDALONE_ROUTE_IDS.has(startupHash)) {
        flushPortalStateForHardNavigation();
        window.location.replace(resolvePortalRouteUrl(startupHash, getEffectiveUserRole()));
        return;
    }
    tryMarkPortalShellInteractive();
    primeDeferredShellRouteFromLocation();
    if (!isPortalStartupDependencyReady() && kiuShellStartupAttempts < PORTAL_STARTUP_MAX_ATTEMPTS) {
        kiuShellStartupAttempts += 1;
        const delay = portalStartupPollDelayMs;
        portalStartupPollDelayMs = Math.min(portalStartupPollDelayMs + 8, 64);
        window.setTimeout(queueDeferredPortalStartup, delay);
        return;
    }
    runDeferredPortalStartup();
}

function initializePortalShell() {
    if (kiuShellInitialized) return;
    kiuShellInitialized = true;
    // Ensure auth state is loaded before any navigation or rendering
    if (typeof loadAuthState === 'function' && !currentUser) {
        loadAuthState();
    }
    if (typeof requireAuth === 'function') {
        requireAuth();
    }
    const startupHash = window.location.hash.replace('#', '');
    if (PORTAL_STANDALONE_ROUTE_IDS.has(startupHash)) {
        flushPortalStateForHardNavigation();
        window.location.replace(resolvePortalRouteUrl(startupHash, getEffectiveUserRole()));
        return;
    }
    if (getStandaloneEntryPageId() === 'social') {
        const initialRole = getEffectiveUserRole();
        Array.from(document.body.classList)
            .filter(className => className.startsWith('role-'))
            .forEach(className => document.body.classList.remove(className));
        document.body.classList.add(`role-${initialRole}`);
        const storedFac = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        switchFacultyTheme(storedFac, { refreshDependentViews: false });
        kiuShellStartupCompleted = true;
        markPortalShellReady();
        return;
    }
    if (isStandaloneAdminWorkspaceEntry()) {
        bootstrapStandaloneAdminWorkspaceShell();
        return;
    }
    normalizeIndexPortalHomeHash();
    document.querySelectorAll("form button:not([type])").forEach((btn) => {
        btn.type = "button";
    });
    // Move scheduler out of page-home if nested
    const scheduler = document.getElementById('page-admin-scheduler');
    const appContent = document.getElementById('app-content');
    if (scheduler && appContent) {
        appContent.appendChild(scheduler);
    }

    // Set role
    const initialRole = getEffectiveUserRole();
    const visualRole = shouldUseStudentShellVisualRole() ? USER_ROLES.STUDENT : initialRole;
    Array.from(document.body.classList)
        .filter(className => className.startsWith('role-'))
        .forEach(className => document.body.classList.remove(className));
    document.body.classList.add(`role-${visualRole}`);
    const roleSelect = document.getElementById('role-switcher-select');
    if (roleSelect) {
        roleSelect.value = initialRole;
        if (!roleSelect.dataset.roleSwitchBound) {
            roleSelect.dataset.roleSwitchBound = '1';
            roleSelect.addEventListener('change', () => {
                if (typeof switchRole === 'function') switchRole(roleSelect.value);
            });
        }
    }

    // Set faculty - use stored value, default to ECON
    const facSelect = document.getElementById('faculty-select');
    const storedFac = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
    if (facSelect) {
        facSelect.value = storedFac;
    }
    // Always apply theme (even if select not on page)
    switchFacultyTheme(storedFac, { refreshDependentViews: false });
    refreshShellIdentity();
    if (typeof ensureOrdersNavLinks === 'function') ensureOrdersNavLinks();
    
    // PERFORMANCE: Pre-cache nav item data attributes to avoid attribute selectors
    cacheServiceNavItemTargets();
    
    const topNav = document.getElementById('top-nav');
    const adminNav = document.getElementById('admin-nav');
    const profNav = document.getElementById('prof-nav');
    const serviceNav = document.getElementById('service-nav');
    if (topNav) topNav.style.display = (initialRole === USER_ROLES.STUDENT && !document.getElementById('page-home')) ? 'flex' : topNav.style.display;
    if (adminNav) adminNav.style.display = initialRole === USER_ROLES.ADMIN ? 'flex' : 'none';
    if (profNav) profNav.style.display = (initialRole === USER_ROLES.PROFESSOR || initialRole === USER_ROLES.TA) ? 'flex' : 'none';
    if (serviceNav) serviceNav.style.display = initialRole === USER_ROLES.STUDENT_SERVICE ? 'flex' : 'none';
    const scheduleStartup = window.requestAnimationFrame || ((cb) => window.setTimeout(cb, 0));
    scheduleStartup(queueDeferredPortalStartup);
}
// --- PERFORMANCE: Cache service-nav item targets to avoid attribute selectors ---
let _serviceNavTargetMap = new Map();

function cacheServiceNavItemTargets() {
    const serviceNav = document.getElementById('service-nav');
    if (!serviceNav) return;
    
    _serviceNavTargetMap.clear();
    const items = serviceNav.querySelectorAll('.nav-item');
    items.forEach(item => {
        const onclick = item.getAttribute('onclick');
        if (onclick) {
            const match = onclick.match(/navigate\(['"]([^'"]+)['"]\)/);
            if (match) {
                _serviceNavTargetMap.set(match[1], item);
            }
        }
    });
}

// Invalidate cache on DOM mutations (role switch, faculty change, etc.)
const _originalNavigate = window.navigate;

// --- AUTO HIGHLIGHT TOP NAV ---
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", initializePortalShell);
} else {
    initializePortalShell();
}

function handleHeaderHomeNavigation(event) {
    const target = event?.target;
    if (target?.closest?.('select, option, input, textarea, button, a, .user-dropdown-trigger, .profile-menu, .role-switcher, .faculty-switcher, .lang-switcher')) {
        return;
    }
    if (isStandaloneAdminWorkspaceEntry() && getNavigationAuthRole() === USER_ROLES.ADMIN) {
        const homeTarget = typeof getRoleHomePage === 'function'
            ? getRoleHomePage(USER_ROLES.ADMIN)
            : 'index.html?view=admin#home';
        persistNavigationAuthSnapshot();
        window.location.assign(homeTarget);
        return;
    }
    navigate('home');
}

window.handleHeaderHomeNavigation = handleHeaderHomeNavigation;

function flushPortalStateForHardNavigation() {
    if (typeof flushPortalStateBeforeNavigation === 'function') {
        try {
            flushPortalStateBeforeNavigation();
        } catch (error) {
            console.warn('Could not flush portal state before hard navigation.', error);
        }
    }
}

function persistNavigationAuthSnapshot() {
    flushPortalStateForHardNavigation();
    try {
        const authenticatedUser = currentUser
            || (typeof getStoredAuthState === 'function' ? getStoredAuthState() : null)
            || null;
        const activeUser = authenticatedUser || (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || null;
        if (!authenticatedUser?.id || !authenticatedUser?.role) return;
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify({
            id: authenticatedUser.id,
            name: authenticatedUser.name || authenticatedUser.displayName || '',
            nameEn: authenticatedUser.nameEn || authenticatedUser.name || '',
            avatar: authenticatedUser.avatar || authenticatedUser.photo || '',
            email: authenticatedUser.email || authenticatedUser.microsoftEmail || '',
            role: authenticatedUser.role,
            faculty: authenticatedUser.facultyCode || authenticatedUser.faculty || ''
        }));
        const effectiveRole = typeof getEffectiveUserRole === 'function'
            ? getEffectiveUserRole()
            : (currentUserRole || activeUser?.role || authenticatedUser.role);
        if (effectiveRole) localStorage.setItem('currentUserRole', effectiveRole);
    } catch (error) {
        console.warn('Could not persist auth snapshot before navigation.', error);
    }
}

// --- NAVIGATION CONTROLLER ---
function navigate(pageId, skipRuntimeBootstrap = false) {
    const profileMenu = document.getElementById('profileMenu');
    if(profileMenu) profileMenu.classList.remove('show');
    if (typeof clearTemporarySocialNavGlow === 'function') clearTemporarySocialNavGlow();
    const effectiveRole = getEffectiveUserRole();
    const navigationAuthRole = getNavigationAuthRole();

    if (pageId === 'home' && isStandaloneAdminWorkspaceEntry() && navigationAuthRole === USER_ROLES.ADMIN) {
        const homeTarget = typeof getRoleHomePage === 'function'
            ? getRoleHomePage(USER_ROLES.ADMIN)
            : 'index.html?view=admin#home';
        persistNavigationAuthSnapshot();
        window.location.assign(homeTarget);
        return;
    }

    // Standalone routes should bypass hidden legacy shell sections entirely.
    if (pageId === 'social' && getStandaloneEntryPageId() !== 'social') {
        if (!_allowedPagesCache) {
            _allowedPagesCache = getAllowedPagesForRole(effectiveRole);
        }
        if (!_allowedPagesCache.has(pageId)) {
            const message = currentUser?.role === USER_ROLES.ADMIN
                ? 'That page belongs to a different workspace. Use the role selector at the top to switch views.'
                : 'That page belongs to another workspace for a different account role.';
            alert(message);
            return;
        }
        if (pageId === 'social' && typeof rememberSocialPortalContext === 'function') {
            try { rememberSocialPortalContext(); } catch (error) {}
        }
        persistNavigationAuthSnapshot();
        window.location.assign('social.html');
        return;
    }

    const sections = getPageSections();
    const targetSection = sections.length > 0 ? getNavigablePageSection(pageId) : null;
    const routeMode = getPortalRouteMode(pageId, { hasNavigableSection: Boolean(targetSection) });

    if (
        routeMode === 'spa-section'
        && !skipRuntimeBootstrap
        && (pageId === 'news' || pageId === 'student-service' || pageId === 'orders')
    ) {
        const runtimePromise = ensureRuntimeForPage(pageId);
        if (runtimePromise) {
            primeShellSectionTransition(pageId, effectiveRole);
            runtimePromise.then(() => navigate(pageId, true));
            return;
        }
    }

    // PERFORMANCE: Use cached allowed pages instead of rebuilding Set every time
    if (!_allowedPagesCache) {
        _allowedPagesCache = getAllowedPagesForRole(effectiveRole);
    }
    const resolvedPageId = resolveAliasPageId(pageId, effectiveRole);
    if (!_allowedPagesCache.has(pageId) && !_allowedPagesCache.has(resolvedPageId)) {
        const message = currentUser?.role === USER_ROLES.ADMIN
            ? 'That page belongs to a different workspace. Use the role selector at the top to switch views.'
            : 'That page belongs to another workspace for a different account role.';
        alert(message);
        return;
    }

    if (isSamePageNavigation(pageId) || isSamePageNavigation(resolvedPageId)) {
        window.scrollTo(0, 0);
        return { navigationSkipped: true };
    }

    // Standalone HTML routes: always hard-navigate via the shared route resolver.
    if (!isIndexPortalShell()) {
        assignStandalonePortalRoute(pageId, effectiveRole);
        return;
    }

    // Role check for LMS
    if (pageId === 'lms' && effectiveRole === USER_ROLES.STUDENT) {
        const debt = getEffectiveTuitionBalance(getCurrentUserId());
        if (debt > 0) {
            alert("ACCESS DENIED: Academic Hold active due to unpaid tuition. Please reconcile your Bursar balance to unlock the Omni-Classroom.");
            return;
        }
    }

    if (pageId === 'social' && typeof rememberSocialPortalContext === 'function') {
        try { rememberSocialPortalContext(); } catch (error) {}
    }

    // Always-external pages skip SPA section search.
    const alwaysExternal = ['admin-tools', 'admin-scheduler', 'staff', 'students-admin', 'profile-view', 'exams', 'career-market'];
    if (alwaysExternal.includes(pageId)) {
        const externalPages = {
            'admin-tools': 'admin-tools.html',
            'admin-scheduler': 'admin-scheduler.html',
            'staff': 'staff.html',
            'students-admin': 'students-admin.html',
            'profile-view': 'profile-view.html',
            'exams': 'exams.html',
            'career-market': 'career-market.html'
        };
        persistNavigationAuthSnapshot();
        window.location.assign(externalPages[pageId]);
        return;
    }

    // Pages always re-render on navigation to pick up theme/transparency changes

    if (pageId === 'programs' && typeof ensureIndexProgramsPage === 'function' && !document.getElementById('page-programs')) {
        const programsPage = ensureIndexProgramsPage();
        if (programsPage) invalidateDomCache();
    }

    // SPA-style switching for index.html elements
    if (routeMode === 'spa-section') {
        if (targetSection) {
            const found = primeShellSectionTransition(pageId, effectiveRole);

            if (!isSamePageNavigation(pageId)) {
                // Trigger renders
                if (pageId === 'admin-scheduler') {
                    renderAdminMasterGrid();
                    renderAdminCurriculumPalette();
                }
                if (pageId === 'home') {
                    if (effectiveRole === USER_ROLES.ADMIN) {
                        if (typeof onAdminDashboardLoad === 'function') onAdminDashboardLoad();
                    } else if (effectiveRole === USER_ROLES.STUDENT_SERVICE && typeof renderStudentServiceHomeWorkspace === 'function') {
                        renderStudentServiceHomeWorkspace();
                    } else if (typeof renderHomeShell === 'function') {
                        renderHomeShell();
                    }
                }
                if (pageId === 'admin-tools' && effectiveRole === USER_ROLES.ADMIN) {
                    if (typeof renderLuxuryAdminToolsPage === 'function') {
                        renderLuxuryAdminToolsPage();
                    }
                    if (typeof onAdminDashboardLoad === 'function') onAdminDashboardLoad();
                }
                if (pageId === 'exams' && effectiveRole !== USER_ROLES.STUDENT) {
                    if (typeof renderExamsPageShellContext === 'function') renderExamsPageShellContext();
                    if (typeof renderAdminExamSection === 'function') renderAdminExamSection();
                }
                if (pageId === 'social') {
                    if (typeof schedulePublicSocialRenderBoost === 'function') schedulePublicSocialRenderBoost();
                }
                if (pageId === 'news' && typeof renderNewsWorkspace === 'function') {
                    renderNewsWorkspace();
                }
                if (pageId === 'chancellery' && typeof renderChancelleryPage === 'function') {
                    renderChancelleryPage();
                }
                if (pageId === 'student-service' && typeof renderStudentServicePage === 'function') {
                    renderStudentServicePage();
                }
                if (pageId === 'library' && typeof renderLibraryPage === 'function') {
                    renderLibraryPage();
                }
                // Mark page as rendered
                _domCache.lastRenderedPages.add(pageId);
                _domCache.lastPageId = pageId;

                ensureFacultyExamsNavLink();
                syncProfessorNavActiveState();

                /* FIX: Re-apply saved transparency to all elements on the new page */
                if (typeof updateTransparency === 'function') {
                    var _savedTrans = localStorage.getItem('kiuLuxurySurfaceTransparency');
                    if (_savedTrans) updateTransparency(parseInt(_savedTrans));
                }
            }

            if (found) {
                window.scrollTo(0,0);
                return; // Stay on page
            }
        }
    }

    assignStandalonePortalRoute(pageId, effectiveRole);
}

window.__kiuCoreNavigate = navigate;
window.navigate = navigate;
window.__mobileNavHooked = false;
try {
    window.dispatchEvent(new Event('kiu:navigate-runtime-ready'));
} catch (error) {}
