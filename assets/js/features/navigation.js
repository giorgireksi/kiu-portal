/* READABILITY: navigation runtime: portal route transitions and shell synchronization. Sections: Purpose | Boundaries | Exports.
--- READABILITY: Purpose ---
Owns the route-facing responsibilities named above.
--- READABILITY: Boundaries ---
Delegates peeled domain behavior through explicit runtime APIs.
--- READABILITY: Exports ---
Publishes only the host/runtime contract consumed by its loader.
*/
/* Wave bag: Wave 26 navigation */
window.KiuNavigation = window.KiuNavigation || {};
const __kiuNavApi = window.KiuNavigation;
window.__kiuNavApi = __kiuNavApi;
function __kiuNavExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuNavApi[key] = map[key];
        window[key] = map[key];
    });
}

/* Navigation and route switching logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- PERFORMANCE: Cache DOM queries to avoid repeated full-DOM scans ---
let _domCache = {
    pageSections: null,
    allNavItems: null,
    serviceNavItems: null,
    lastPageId: null, // Track last page to skip redundant renders
    lastRenderedPages: new Set() // Track which pages have been rendered
};

const PORTAL_NAVIGATION_TIMING_KEY = 'KIU_PORTAL_NAVIGATION_TIMING';
const portalNavigationTimings = new Map();
let portalNavigationSequence = 0;

function getPortalNavigationTimingPageId(pageId = '') {
    return String(pageId || '').trim().toLowerCase() || 'home';
}

function markPortalNavigationPhase(pageId, phase) {
    const normalizedPageId = getPortalNavigationTimingPageId(pageId);
    const timing = portalNavigationTimings.get(normalizedPageId);
    if (!timing || typeof performance === 'undefined' || typeof performance.mark !== 'function') return;
    const markName = `${timing.prefix}:${phase}`;
    try {
        performance.mark(markName);
        if (phase === 'shell-ready' || phase === 'content-ready') {
            const measureName = `${timing.prefix}:intent-to-${phase}`;
            performance.measure(measureName, `${timing.prefix}:intent`, markName);
        }
    } catch (_error) {}
    timing.lastPhase = phase;
    if (phase === 'content-ready') {
        const previousTiming = window.__KIU_LAST_NAVIGATION_TIMING;
        window.__KIU_LAST_NAVIGATION_TIMING = {
            pageId: normalizedPageId,
            id: timing.id,
            lastPhase: phase,
            ...(previousTiming?.id === timing.id ? { durationMs: previousTiming.durationMs } : {}),
            completedAt: Date.now()
        };
        portalNavigationTimings.delete(normalizedPageId);
    }
}

function markPortalNavigationIntent(pageId) {
    const normalizedPageId = getPortalNavigationTimingPageId(pageId);
    const timing = {
        id: ++portalNavigationSequence,
        prefix: `kiu:navigation:${portalNavigationSequence}`,
        pageId: normalizedPageId,
        startedAt: Date.now()
    };
    portalNavigationTimings.set(normalizedPageId, timing);
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        try { performance.mark(`${timing.prefix}:intent`); } catch (_error) {}
    }
    return timing.id;
}

function markPortalNavigationStart(pageId) {
    const normalizedPageId = getPortalNavigationTimingPageId(pageId);
    if (!portalNavigationTimings.has(normalizedPageId)) markPortalNavigationIntent(normalizedPageId);
    const timing = portalNavigationTimings.get(normalizedPageId);
    markPortalNavigationPhase(normalizedPageId, 'start');
    try {
        sessionStorage.setItem(PORTAL_NAVIGATION_TIMING_KEY, JSON.stringify({
            pageId: normalizedPageId,
            id: timing.id,
            startedAt: timing.startedAt
        }));
    } catch (_error) {}
    return timing.id;
}

function markPortalNavigationIntentForCurrentPage() {
    const pageId = getStandaloneEntryPageId?.() || getActivePageId?.() || 'home';
    const timing = (() => {
        try {
            return JSON.parse(sessionStorage.getItem(PORTAL_NAVIGATION_TIMING_KEY) || 'null');
        } catch (_error) {
            return null;
        }
    })();
    if (!timing || getPortalNavigationTimingPageId(timing.pageId) !== getPortalNavigationTimingPageId(pageId)) return;
    const normalizedPageId = getPortalNavigationTimingPageId(pageId);
    const restoredTiming = {
        id: timing.id,
        prefix: `kiu:navigation:${timing.id}`,
        pageId: normalizedPageId,
        startedAt: timing.startedAt
    };
    portalNavigationTimings.set(normalizedPageId, restoredTiming);
    if (typeof performance !== 'undefined' && typeof performance.mark === 'function') {
        try { performance.mark(`${restoredTiming.prefix}:intent`); } catch (_error) {}
    }
    markPortalNavigationPhase(normalizedPageId, 'shell-ready');
    const durationMs = Math.max(0, Date.now() - Number(timing.startedAt || Date.now()));
    window.__KIU_LAST_NAVIGATION_TIMING = {
        pageId: normalizedPageId,
        id: timing.id,
        durationMs,
        completedAt: Date.now()
    };
    try { sessionStorage.removeItem(PORTAL_NAVIGATION_TIMING_KEY); } catch (_error) {}
}

__kiuNavExpose({
    markPortalNavigationIntent,
    markPortalNavigationStart,
    markPortalNavigationPhase,
    markPortalNavigationIntentForCurrentPage,
});

function invalidateDomCache() {
    _domCache.pageSections = null;
    _domCache.allNavItems = null;
    _domCache.serviceNavItems = null;
    _domCache.lastPageId = null;
    _domCache.lastRenderedPages = new Set();
}

// Expose globally for utilities.js to call on role/faculty switch
__kiuNavExpose({
    invalidateDomCache,
});

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

__kiuNavExpose({
    syncShellNavVisibility,
});

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

function cleanupStaleSocialRouteState(pageId) {
    const normalizedPageId = String(pageId || '').trim().toLowerCase();
    if (normalizedPageId === 'social') return;
    const body = document.body;
    const root = document.documentElement;
    if (!body) return;

    const socialClasses = [
        'lux-route-social',
        'lux-entry-social',
        'lux-family-social',
        'social-neo-scroll-lock'
    ];
    const hadSocialState = socialClasses.some((className) => body.classList.contains(className))
        || Boolean(root?.classList?.contains('social-neo-scroll-lock'));

    socialClasses.forEach((className) => body.classList.remove(className));
    if (root) {
        root.classList.remove('social-neo-scroll-lock');
        root.style.removeProperty('--social-visual-height');
    }
    body.style.removeProperty('--social-visual-height');

    const overlay = document.getElementById('social-neo-overlay-portal');
    if (overlay) {
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
    }

    if (!hadSocialState) return;
    const repaint = () => {
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { persist: false });
        } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
            window.refreshLuxuryTransparencySurfaces(undefined, { persist: false });
        }
    };
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(repaint);
    } else {
        window.setTimeout(repaint, 0);
    }
}

function primeShellSectionTransition(pageId, effectiveRole = getEffectiveUserRole()) {
    const targetSection = getNavigablePageSection(pageId);
    if (!targetSection) return false;
    if (isSamePageNavigation(pageId)) return true;
    cleanupStaleSocialRouteState(pageId);
    syncShellSectionLocation(pageId, effectiveRole);
    let found = false;
    getPageSections().forEach((section) => {
        if (section.id === 'page-' + pageId) {
            setPageSectionShown(section, true, (pageId === 'admin-scheduler') ? 'flex' : 'block');
            section.classList.add('active-page', 'lux-route-content-fade');
            window.setTimeout(() => section.classList.remove('lux-route-content-fade'), 180);
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
    return String(pageId === 'profile' ? 'personal-data' : (pageId || 'home')).trim().toLowerCase() || 'home';
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

__kiuNavExpose({
    resolveAliasPageId,
});

function shouldRedirectProfileViewToPersonalData() {
    return typeof isAdminImpersonationMode === 'function' && isAdminImpersonationMode();
}

function resolvePortalRouteUrl(pageId, role = getEffectiveUserRole()) {
    const normalizedPageId = resolveAliasPageId(pageId, role);
    if (normalizedPageId === 'profile-view' && shouldRedirectProfileViewToPersonalData()) {
        return appendPortalViewQuery('personal-data.html', role);
    }
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

const STUDENT_SERVICE_WORKSPACE_ROUTE_IDS = new Set([
    'home',
    'student-service',
    'orders',
    'library',
    'news',
    'social',
    'profile-view'
]);

function getPortalViewRoleFromLocation() {
    try {
        const viewRole = String(new URLSearchParams(window.location.search || '').get('view') || '').trim().toLowerCase();
        return Object.values(USER_ROLES).includes(viewRole) ? viewRole : '';
    } catch (error) {
        return '';
    }
}

function shouldPreservePortalViewContext(role = getEffectiveUserRole()) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (normalizedRole === USER_ROLES.STUDENT_SERVICE) return true;
    const authRole = getNavigationAuthRole();
    return authRole === USER_ROLES.ADMIN && normalizedRole && normalizedRole !== USER_ROLES.ADMIN;
}

function appendPortalViewQuery(targetUrl = '', role = getEffectiveUserRole()) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedRole || !shouldPreservePortalViewContext(normalizedRole)) {
        return String(targetUrl || '').trim();
    }
    try {
        const resolved = new URL(String(targetUrl || '').trim(), window.location.href);
        if (!resolved.pathname.endsWith('.html')) return String(targetUrl || '').trim();
        resolved.searchParams.set('view', normalizedRole);
        return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch (error) {
        return String(targetUrl || '').trim();
    }
}

function isStudentServiceWorkspaceEntry(pageId = getStandaloneEntryPageId()) {
    const normalizedPageId = String(pageId || '').trim().toLowerCase();
    return normalizedPageId === 'student-service' || STUDENT_SERVICE_WORKSPACE_ROUTE_IDS.has(normalizedPageId);
}

function resolveActiveWorkspaceViewRole(role = getEffectiveUserRole()) {
    const viewFromUrl = getPortalViewRoleFromLocation();
    if (viewFromUrl === USER_ROLES.STUDENT_SERVICE) return USER_ROLES.STUDENT_SERVICE;
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (normalizedRole === USER_ROLES.STUDENT_SERVICE) return USER_ROLES.STUDENT_SERVICE;
    try {
        const pendingRole = String(
            sessionStorage.getItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE')
            || sessionStorage.getItem(PENDING_ROLE_SWITCH_KEY)
            || sessionStorage.getItem('KIU_TAB_CURRENT_ROLE')
            || localStorage.getItem('currentUserRole')
            || ''
        ).trim().toLowerCase();
        if (pendingRole === USER_ROLES.STUDENT_SERVICE) return USER_ROLES.STUDENT_SERVICE;
    } catch (error) {}
    if (getNavigationAuthRole() === USER_ROLES.STUDENT_SERVICE) return USER_ROLES.STUDENT_SERVICE;
    if (typeof resolveStoredWorkspaceRole === 'function') {
        const storedWorkspaceRole = resolveStoredWorkspaceRole();
        if (storedWorkspaceRole === USER_ROLES.STUDENT_SERVICE) return USER_ROLES.STUDENT_SERVICE;
    }
    return '';
}

function resolveWorkspacePortalNavUrl(pageId, role = getEffectiveUserRole()) {
    const resolvedPageId = resolveAliasPageId(pageId, role);
    const workspaceViewRole = resolveActiveWorkspaceViewRole(role);
    const effectiveRole = workspaceViewRole || role;
    let targetUrl = resolvePortalRouteUrl(pageId, effectiveRole);
    if (
        workspaceViewRole === USER_ROLES.STUDENT_SERVICE
        && (STUDENT_SERVICE_WORKSPACE_ROUTE_IDS.has(resolvedPageId) || resolvedPageId === 'home')
    ) {
        targetUrl = appendPortalViewQuery(targetUrl, USER_ROLES.STUDENT_SERVICE);
    } else if (
        shouldPreservePortalViewContext(effectiveRole)
        && (STUDENT_SERVICE_WORKSPACE_ROUTE_IDS.has(resolvedPageId) || resolvedPageId === 'home')
    ) {
        targetUrl = appendPortalViewQuery(targetUrl, effectiveRole);
    }
    return targetUrl;
}

function syncPortalViewRoleState(role = '', options = {}) {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedRole || !Object.values(USER_ROLES).includes(normalizedRole)) return false;
    const authRole = getNavigationAuthRole();
    currentUserRole = normalizedRole;
    try {
        sessionStorage.setItem('KIU_TAB_CURRENT_ROLE', normalizedRole);
        if (authRole === USER_ROLES.ADMIN && normalizedRole !== USER_ROLES.ADMIN) {
            sessionStorage.setItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE', normalizedRole);
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
            if (options.applySessionUser !== false && typeof setActiveSessionUserByRole === 'function') {
                setActiveSessionUserByRole(normalizedRole);
            }
        } else if (authRole === USER_ROLES.ADMIN && normalizedRole === USER_ROLES.ADMIN) {
            sessionStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
            sessionStorage.removeItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE');
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        }
    } catch (error) {
        console.warn('Could not sync portal view role state.', error);
    }
    if (typeof invalidatePageAccessCache === 'function') invalidatePageAccessCache();
    if (typeof invalidateDomCache === 'function') invalidateDomCache();
    if (document.body) {
        Array.from(document.body.classList)
            .filter(className => className.startsWith('role-'))
            .forEach(className => document.body.classList.remove(className));
        document.body.classList.add(`role-${normalizedRole}`);
        document.body.dataset.shellRole = normalizedRole;
    }
    document.documentElement.dataset.shellRole = normalizedRole;
    if (options.refreshChrome !== false) {
        if (typeof window.renderNav === 'function') window.renderNav();
        if (typeof window.seedRolePickerLabel === 'function') window.seedRolePickerLabel();
        if (typeof refreshShellIdentity === 'function') refreshShellIdentity();
    }
    if (
        authRole === USER_ROLES.ADMIN
        && normalizedRole === USER_ROLES.STUDENT_SERVICE
        && typeof window.syncStudentServiceWorkspaceBackendSession === 'function'
    ) {
        window.syncStudentServiceWorkspaceBackendSession()
            .then(() => {
                if (document.getElementById('page-student-service') && typeof window.renderStudentServicePage === 'function') {
                    window.renderStudentServicePage();
                }
            })
            .catch(() => null);
    }
    return true;
}

function applyPortalViewRoleFromLocation(options = {}) {
    const viewRole = getPortalViewRoleFromLocation();
    if (viewRole) {
        return syncPortalViewRoleState(viewRole, options);
    }
    if (!isStudentServiceWorkspaceEntry()) return false;
    const authRole = getNavigationAuthRole();
    if (authRole === USER_ROLES.STUDENT_SERVICE) {
        return syncPortalViewRoleState(USER_ROLES.STUDENT_SERVICE, options);
    }
    const storedRole = (() => {
        try {
            return String(
                localStorage.getItem(PENDING_ROLE_SWITCH_KEY)
                || localStorage.getItem('currentUserRole')
                || ''
            ).trim().toLowerCase();
        } catch (error) {
            return '';
        }
    })();
    if (storedRole === USER_ROLES.STUDENT_SERVICE) {
        return syncPortalViewRoleState(USER_ROLES.STUDENT_SERVICE, options);
    }
    return false;
}

function pinStudentServiceWorkspaceRole(options = {}) {
    if (applyPortalViewRoleFromLocation(options)) return true;
    const authRole = getNavigationAuthRole();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : currentUserRole;
    if (
        authRole === USER_ROLES.STUDENT_SERVICE
        || String(effectiveRole || '').trim().toLowerCase() === USER_ROLES.STUDENT_SERVICE
    ) {
        return syncPortalViewRoleState(USER_ROLES.STUDENT_SERVICE, options);
    }
    return false;
}

__kiuNavExpose({
    applyPortalViewRoleFromLocation,
    pinStudentServiceWorkspaceRole,
});

function assignStandalonePortalRoute(pageId, role = getEffectiveUserRole(), options = {}) {
    const targetUrl = resolveWorkspacePortalNavUrl(pageId, role);
    cleanupStaleSocialRouteState(pageId);
    persistNavigationAuthSnapshot();
    markPortalNavigationStart(pageId);
    window.location.assign(targetUrl);
}

__kiuNavExpose({
    resolveWorkspacePortalNavUrl,
});

const portalRoutePrefetchState = {
    pending: new Map(),
    warmed: new Set(),
    assetHints: new Set(),
    installed: false
};
const PORTAL_ROUTE_PREFETCH_ASSET_LIMIT = 12;

function canPrefetchPortalRoute() {
    if (typeof navigator === 'undefined' || navigator.onLine === false) return false;
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection?.saveData) return false;
    return !['slow-2g', '2g'].includes(String(connection?.effectiveType || '').toLowerCase());
}

function getPortalNavigationTargetFromElement(element) {
    const trigger = element?.closest?.(
        '[data-nav-target],[data-route-page],[data-page],[data-registration-nav],'
        + '[data-student-service-navigate],[data-personal-data-nav-target],[data-admin-focus],'
        + '[data-nav-orders],[data-nav-social],[data-nav-exams],[onclick*="navigate("]'
    );
    if (!trigger) return '';
    const explicitTarget = String(
        trigger.getAttribute('data-nav-target')
        || trigger.getAttribute('data-route-page')
        || trigger.getAttribute('data-page')
        || trigger.getAttribute('data-registration-nav')
        || trigger.getAttribute('data-student-service-navigate')
        || trigger.getAttribute('data-personal-data-nav-target')
        || ''
    ).trim();
    if (explicitTarget) return explicitTarget;
    if (trigger.hasAttribute('data-admin-focus')) return 'admin-tools';
    if (trigger.hasAttribute('data-nav-orders')) return 'orders';
    if (trigger.hasAttribute('data-nav-social')) return 'social';
    if (trigger.hasAttribute('data-nav-exams')) return 'exams';
    const onclick = String(trigger.getAttribute('onclick') || '');
    return onclick.match(/navigate\(['"]([^'"]+)['"]\)/)?.[1] || '';
}

function addPortalRouteAssetHints(documentText, targetUrl, pageId = '') {
    if (typeof DOMParser !== 'function') return;
    const parsed = new DOMParser().parseFromString(documentText, 'text/html');
    const pageToken = String(pageId || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    const candidates = Array.from(parsed.querySelectorAll('script[src], link[rel~="stylesheet"][href]'))
        .map((node, index) => {
            const source = node.getAttribute('src') || node.getAttribute('href') || '';
            const isStylesheet = node.matches('link[rel~="stylesheet"]');
            const normalizedSource = source.toLowerCase();
            const isSharedCritical = isStylesheet
                ? /(?:lux-tokens|lux-page-bare-lite|lux-fouc|lux-controls|mobile-shell)/.test(normalizedSource)
                : /(?:app\/(?:app|state|api|auth)|features\/(?:navigation|luxury-shell-chrome))\.js/.test(normalizedSource);
            const isRouteEntry = !isStylesheet && pageToken
                && new RegExp(`(?:^|/)${pageToken}(?:-page)?\\.js(?:\\?|$)`).test(normalizedSource);
            return { node, source, index, priority: isSharedCritical ? 0 : (isRouteEntry ? 1 : 2) };
        })
        .sort((left, right) => left.priority - right.priority || left.index - right.index)
        .slice(0, PORTAL_ROUTE_PREFETCH_ASSET_LIMIT);
    candidates.forEach(({ node, source }) => {
        if (!source || !/(?:^|\/)assets\//.test(source)) return;
        let assetUrl;
        try {
            assetUrl = new URL(source, targetUrl);
        } catch (_error) {
            return;
        }
        if (assetUrl.origin !== window.location.origin || portalRoutePrefetchState.assetHints.has(assetUrl.href)) return;
        portalRoutePrefetchState.assetHints.add(assetUrl.href);
        const hint = document.createElement('link');
        hint.rel = 'prefetch';
        hint.as = node.matches('link[rel~="stylesheet"]') ? 'style' : 'script';
        hint.href = assetUrl.href;
        hint.dataset.kiuRoutePrefetch = '1';
        document.head.appendChild(hint);
    });
}

function prefetchStandalonePortalRoute(pageId, role = getEffectiveUserRole()) {
    const normalizedPageId = resolveAliasPageId(pageId, role);
    if (!normalizedPageId || !canPrefetchPortalRoute()) return Promise.resolve(false);
    if (!_allowedPagesCache || _allowedPagesCacheRole !== role) {
        _allowedPagesCache = getAllowedPagesForRole(role);
        _allowedPagesCacheRole = role;
    }
    if (!_allowedPagesCache.has(pageId) && !_allowedPagesCache.has(normalizedPageId)) {
        return Promise.resolve(false);
    }
    const targetUrl = resolveWorkspacePortalNavUrl(normalizedPageId, role);
    let resolvedTarget;
    try {
        resolvedTarget = new URL(targetUrl, window.location.href);
    } catch (_error) {
        return Promise.resolve(false);
    }
    if (resolvedTarget.origin !== window.location.origin || resolvedTarget.href === window.location.href) {
        return Promise.resolve(false);
    }
    const key = resolvedTarget.href;
    if (portalRoutePrefetchState.warmed.has(key)) return Promise.resolve(true);
    if (portalRoutePrefetchState.pending.has(key)) return portalRoutePrefetchState.pending.get(key);
    const request = fetch(key, {
        credentials: 'same-origin',
        cache: 'no-store',
        headers: { 'X-KIU-Route-Prefetch': '1' }
    })
        .then(async (response) => {
            if (!response.ok) return false;
            const text = await response.text();
            addPortalRouteAssetHints(text, resolvedTarget.href, normalizedPageId);
            portalRoutePrefetchState.warmed.add(key);
            return true;
        })
        .catch(() => false)
        .finally(() => portalRoutePrefetchState.pending.delete(key));
    portalRoutePrefetchState.pending.set(key, request);
    return request;
}

function schedulePortalRoutePrefetch(pageId) {
    const normalizedPageId = String(pageId || '').trim().toLowerCase();
    if (!normalizedPageId || portalRoutePrefetchState.pending.has(normalizedPageId)) return;
    portalRoutePrefetchState.pending.set(
        normalizedPageId,
        window.setTimeout(() => {
            portalRoutePrefetchState.pending.delete(normalizedPageId);
            void prefetchStandalonePortalRoute(normalizedPageId);
        }, 80)
    );
}

function installPortalRoutePrefetch() {
    if (portalRoutePrefetchState.installed || typeof document === 'undefined') return;
    portalRoutePrefetchState.installed = true;
    const handleIntent = (event) => {
        if (event.type === 'pointerover' && event.relatedTarget?.closest?.('[data-nav-target],[data-route-page],[data-page]')) return;
        const pageId = getPortalNavigationTargetFromElement(event.target);
        if (pageId) schedulePortalRoutePrefetch(pageId);
    };
    document.addEventListener('pointerover', handleIntent, { passive: true });
    document.addEventListener('focusin', handleIntent, { passive: true });
    document.addEventListener('touchstart', handleIntent, { passive: true });
}

__kiuNavExpose({
    canPrefetchPortalRoute,
    getPortalNavigationTargetFromElement,
    prefetchStandalonePortalRoute,
    installPortalRoutePrefetch,
});

__kiuNavExpose({
    resolvePortalRouteUrl,
});

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

__kiuNavExpose({
    getPortalRouteMode,
});

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

__kiuNavExpose({
    shouldUseStudentShellVisualRole,
    isStandaloneAdminWorkspaceEntry,
    getNavigationAuthRole,
});

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
    const isAdminOrdersRoute = document.body?.classList?.contains('lux-route-admin-orders')
        || Boolean(document.getElementById('admin-orders-root'));
    const isRecipientOrdersRoute = document.body?.classList?.contains('lux-route-orders')
        || Boolean(document.getElementById('page-orders') || document.getElementById('orders-inbox-root'));
    if (
        isAdminOrdersRoute
        && typeof ensurePortalAdminOrdersRuntimeLoaded === 'function'
        && typeof renderAdminOrders !== 'function'
    ) {
        loaders.push(ensurePortalAdminOrdersRuntimeLoaded());
    } else if (
        isRecipientOrdersRoute
        && typeof ensurePortalOrdersRuntimeLoaded === 'function'
        && typeof renderOrdersInboxPage !== 'function'
    ) {
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
        ['page-registration', 'renderStudentRegStructures'],
        ['study-card-container', 'renderStudyCard'],
        ['timetable-master-container', 'renderTimetable'],
        ['lms-subject-grid', 'renderLMSSubjects'],
        ['staff-content', 'renderStaffPage'],
        ['students-content', 'renderStudentsPage'],
        ['admin-orders-root', 'renderAdminOrders'],
        ['page-orders', 'renderOrdersInboxPage'],
        ['orders-inbox-root', 'renderOrdersInboxPage'],
        ['page-library', 'renderLibraryPageShellContext'],
        ['page-chancellery', 'renderChancelleryPage']
    ];
    return dependencyChecks.every(([elementId, functionName]) => {
        const element = document.getElementById(elementId);
        // Standalone admin pages keep hidden compatibility placeholders for
        // navigation lookups. They must not hold the global shell veil while
        // waiting for runtimes belonging to another route.
        if (!element || element.hidden || element.closest?.('[hidden]')
            || element.getAttribute?.('aria-hidden') === 'true') return true;
        return typeof window[functionName] === 'function';
    });
}

let kiuShellRevealStarted = false;
let kiuShellRevealFinished = false;
let kiuShellRouteReady = false;

function getKiuShellLoadState() {
    return window.__kiuShellLoadState || {
        phase: 'loading',
        stage: 'background',
        degraded: false
    };
}

function setKiuShellLoadState(next) {
    if (typeof window.__kiuSetShellLoadState === 'function') {
        return window.__kiuSetShellLoadState(next);
    }
    const state = window.__kiuShellLoadState = {
        ...getKiuShellLoadState(),
        ...(next || {})
    };
    const root = document.documentElement;
    root.dataset.kiuLoadPhase = state.phase;
    root.dataset.kiuLoadStage = state.stage;
    root.dataset.kiuLoadDegraded = state.degraded ? '1' : '0';
    if (document.body) {
        document.body.dataset.kiuLoadPhase = state.phase;
        document.body.dataset.kiuLoadStage = state.stage;
        document.body.dataset.kiuLoadDegraded = state.degraded ? '1' : '0';
    }
    return state;
}

function finishKiuShellReveal() {
    kiuShellRevealFinished = true;
    setKiuShellLoadState({
        phase: 'ready',
        stage: 'ready'
    });
    const root = document.documentElement;
    root.classList.add('kiu-shell-ready');
    root.classList.remove('kiu-shell-loading', 'kiu-shell-revealing');
    if (document.body) {
        document.body.classList.add('kiu-shell-ready');
        document.body.classList.remove('kiu-shell-loading', 'kiu-shell-revealing');
        document.body.removeAttribute('aria-busy');
    }
    const fadeTarget = document.querySelector('#app-content .page-section.active-page, #app-content');
    if (fadeTarget) {
        fadeTarget.classList.remove('lux-route-content-fade');
        window.requestAnimationFrame?.(() => {
            fadeTarget.classList.add('lux-route-content-fade');
            window.setTimeout(() => fadeTarget.classList.remove('lux-route-content-fade'), 180);
        });
    }
}

function startKiuShellReveal({ degraded = false } = {}) {
    if (kiuShellRevealFinished) return getKiuShellLoadState();
    if (kiuShellRevealStarted) return getKiuShellLoadState();
    kiuShellRevealStarted = true;
    // The authored shell and route skeleton are already paintable. Do not put
    // them behind a staged veil and do not schedule shell/panel/control timers:
    // those timers made the whole page appear first and animate afterwards.
    setKiuShellLoadState({
        phase: degraded ? 'degraded' : 'ready',
        stage: 'ready',
        degraded
    });
    finishKiuShellReveal();
    return getKiuShellLoadState();
}

window.__kiuStartShellReveal = startKiuShellReveal;

function markPortalShellReady(options = {}) {
    // Route readiness still records the lifecycle phase, but it no longer
    // gates visibility or interaction behind Home/Social-specific fail-safes.
    // Their authored skeletons are already on screen and the shared assembly
    // runtime now completes without flight animation.
    void options;
    markPortalNavigationIntentForCurrentPage();
    kiuShellRouteReady = true;
    if (getKiuShellLoadState().phase === 'ready') return;
    startKiuShellReveal({ degraded: false });
}

__kiuNavExpose({
    markPortalShellReady,
});

function schedulePortalShellReadyReveal() {
    const reveal = () => markPortalShellReady();
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(reveal);
        });
        return;
    }
    window.setTimeout(reveal, 32);
}

__kiuNavExpose({
    schedulePortalShellReadyReveal,
});

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
    const navRoot = document.getElementById('lux-nav');
    if (document.getElementById('lux-shell') && navRoot?.children?.length > 0) {
        markPortalShellReady();
    }
}

function scheduleRouteContentRender(renderFn) {
    if (typeof renderFn !== 'function') return;
    let hasRun = false;
    const run = () => {
        if (hasRun) return;
        hasRun = true;
        const activePageId = getStandaloneEntryPageId?.() || getActivePageId?.() || 'home';
        try {
            const result = renderFn();
            if (result && typeof result.then === 'function') {
                result.catch((error) => {
                    console.warn('Route content render failed.', error);
                }).finally(() => markPortalNavigationPhase(activePageId, 'content-ready'));
            } else {
                markPortalNavigationPhase(activePageId, 'content-ready');
            }
        } catch (error) {
            console.warn('Route content render failed.', error);
            markPortalNavigationPhase(activePageId, 'content-ready');
        }
    };
    if (getStandaloneEntryPageId() === 'library') {
        run();
        return;
    }
    // Next-frame paint (double rAF): shell/layout settles, then content — no idle/48ms delay.
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(run);
        });
        return;
    }
    window.setTimeout(run, 0);
}

__kiuNavExpose({
    scheduleRouteContentRender,
});

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
    body.classList.remove('lux-home-page');
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
        const savedTransparency = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '70', 10);
        if (!Number.isNaN(savedTransparency)) {
            window.updateTransparency(savedTransparency, config.transparencyOptions || undefined);
        }
    } else if (typeof window.refreshLuxuryTransparencySurfaces === 'function') {
        window.refreshLuxuryTransparencySurfaces();
    }
    const activeBackgroundMode = document.body?.dataset?.luxBackgroundMode
        || localStorage.getItem('kiuLuxuryBackgroundMode')
        || 'peak';
    const onOrdersRoute = document.body?.classList?.contains('lux-route-orders');
    const onLibraryRoute = document.body?.classList?.contains('lux-route-library');
    const refreshBackground = () => {
        if (typeof window.__kiuRefreshLuxuryBackground === 'function') {
            window.__kiuRefreshLuxuryBackground(activeBackgroundMode);
        }
    };
    if (onOrdersRoute || onLibraryRoute) {
        const schedule = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 120));
        schedule(refreshBackground);
        return;
    }
    refreshBackground();
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
    if (activePageId === 'student-service' && typeof window.renderStudentServicePage === 'function') {
        window.renderStudentServicePage();
        return true;
    }
    if (activePageId === 'programs' && typeof window.renderStudentEducationalProgramPage === 'function') {
        window.renderStudentEducationalProgramPage();
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
        try {
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
        } finally {
            window.__kiuStandaloneRouteContentBootKey = bootKey;
            scheduleRouteVisualSync();
            schedulePortalShellReadyReveal();
        }
    };
    const boot = () => {
        if (isStudentServiceWorkspaceEntry(entryId) || isStudentServiceWorkspaceEntry(pageId)) {
            pinStudentServiceWorkspaceRole({ refreshChrome: false });
        } else {
            applyPortalViewRoleFromLocation({ refreshChrome: false });
        }
        routeRefresh({ rerender: false, trigger: 'boot' });
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
__kiuNavExpose({
    refreshStandaloneDesktopShellChrome,
    bootStandaloneDesktopRoute,
});

function autoBootStandaloneDesktopRoute() {
    const entryId = normalizeStandaloneActivePageId(getStandaloneEntryPageId());
    // Social boots via social-page.js (assembly must own first reveal).
    if (!entryId || entryId === 'index' || entryId === 'lms' || entryId === 'social' || entryId === 'student-service' || entryId === 'exams' || entryId === 'orders' || entryId === 'library' || entryId === 'timetable') return;
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
        window.location.replace(resolveWorkspacePortalNavUrl(hash, activeRole));
        return;
    }
    if (hash === 'calendar' && getNavigablePageSection('timetable')) {
        navigate('timetable');
        markPortalShellReady();
        return;
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
        if (activeRole !== USER_ROLES.STUDENT && typeof renderAdminExamSection === 'function') {
            renderAdminExamSection();
        }
    } else if (activePageId === 'chancellery') {
        if (typeof renderChancelleryPage === 'function') renderChancelleryPage();
    } else if (activePageId === 'library') {
        if (!window.__kiuStandaloneDesktopRouteBootKey && typeof renderLibraryPage === 'function') {
            renderLibraryPage();
        }
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
    } else if (hash && hash !== 'home' && getNavigablePageSection(hash)) {
        targetPageId = hash;
    }
    if (!targetPageId) return false;
    return primeShellSectionTransition(targetPageId, role);
}

function queueDeferredPortalStartup() {
    if (getStandaloneEntryPageId() === 'social') {
        kiuShellStartupCompleted = true;
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
        window.location.replace(resolveWorkspacePortalNavUrl(startupHash, getEffectiveUserRole()));
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
    applyPortalViewRoleFromLocation({ refreshChrome: false });
    if (typeof requireAuth === 'function') {
        requireAuth();
    }
    const startupHash = window.location.hash.replace('#', '');
    if (PORTAL_STANDALONE_ROUTE_IDS.has(startupHash)) {
        flushPortalStateForHardNavigation();
        window.location.replace(resolveWorkspacePortalNavUrl(startupHash, getEffectiveUserRole()));
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
        return;
    }
    if (getStandaloneEntryPageId() === 'orders') {
        const initialRole = getEffectiveUserRole();
        const visualRole = shouldUseStudentShellVisualRole() ? USER_ROLES.STUDENT : initialRole;
        Array.from(document.body.classList)
            .filter(className => className.startsWith('role-'))
            .forEach(className => document.body.classList.remove(className));
        document.body.classList.add(`role-${visualRole}`);
        const storedFac = normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        switchFacultyTheme(storedFac, { refreshDependentViews: false });
        kiuShellStartupCompleted = true;
        markPortalShellReady();
        return;
    }
    if (getStandaloneEntryPageId() === 'library') {
        const initialRole = getEffectiveUserRole();
        const visualRole = shouldUseStudentShellVisualRole() ? USER_ROLES.STUDENT : initialRole;
        Array.from(document.body.classList)
            .filter(className => className.startsWith('role-'))
            .forEach(className => document.body.classList.remove(className));
        document.body.classList.add(`role-${visualRole}`);
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
        const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : USER_ROLES.ADMIN;
        const homeTarget = typeof getRoleHomePage === 'function'
            ? getRoleHomePage(effectiveRole)
            : `index.html?view=${encodeURIComponent(effectiveRole)}#home`;
        persistNavigationAuthSnapshot();
        window.location.assign(homeTarget);
        return;
    }
    navigate('home');
}

__kiuNavExpose({
    handleHeaderHomeNavigation,
});

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
    let snapshotRole = '';
    try {
        snapshotRole = String(
            sessionStorage.getItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE')
            || sessionStorage.getItem(PENDING_ROLE_SWITCH_KEY)
            || sessionStorage.getItem('KIU_TAB_CURRENT_ROLE')
            || localStorage.getItem('currentUserRole')
            || (typeof resolveStoredWorkspaceRole === 'function' ? resolveStoredWorkspaceRole() : '')
            || ''
        ).trim().toLowerCase();
    } catch (error) {}
    flushPortalStateForHardNavigation();
    try {
        const authenticatedUser = currentUser
            || (typeof getStoredAuthState === 'function' ? getStoredAuthState() : null)
            || null;
        const activeUser = authenticatedUser || (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || null;
        if (!authenticatedUser?.id || !authenticatedUser?.role) return;
        sessionStorage.setItem('KIU_TAB_AUTH_STATE', JSON.stringify({
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
            : (snapshotRole || currentUserRole || activeUser?.role || authenticatedUser.role);
        if (effectiveRole) {
            sessionStorage.setItem('KIU_TAB_CURRENT_ROLE', effectiveRole);
            if (
                String(authenticatedUser.role || '').trim().toLowerCase() === USER_ROLES.ADMIN
                && effectiveRole !== USER_ROLES.ADMIN
            ) {
                sessionStorage.setItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE', effectiveRole);
                sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
            }
        }
    } catch (error) {
        console.warn('Could not persist auth snapshot before navigation.', error);
    }
}

// --- NAVIGATION CONTROLLER ---
function navigate(pageId, skipRuntimeBootstrap = false) {
    window.__kiuNavigationIntentSequence = Number(window.__kiuNavigationIntentSequence || 0) + 1;
    markPortalNavigationIntent(pageId);
    const profileMenu = document.getElementById('profileMenu');
    if(profileMenu) profileMenu.classList.remove('show');
    if (typeof clearTemporarySocialNavGlow === 'function') clearTemporarySocialNavGlow();
    if (!isIndexPortalShell() && isStudentServiceWorkspaceEntry()) {
        pinStudentServiceWorkspaceRole({ refreshChrome: false });
    }
    const effectiveRole = getEffectiveUserRole();
    const navigationAuthRole = getNavigationAuthRole();

    if (pageId === 'home' && isStandaloneAdminWorkspaceEntry() && navigationAuthRole === USER_ROLES.ADMIN) {
        const homeTarget = typeof getRoleHomePage === 'function'
            ? getRoleHomePage(effectiveRole)
            : `index.html?view=${encodeURIComponent(effectiveRole)}#home`;
        persistNavigationAuthSnapshot();
        window.location.assign(homeTarget);
        return;
    }

    // Standalone routes should bypass hidden legacy shell sections entirely.
    if (pageId === 'social' && getStandaloneEntryPageId() !== 'social') {
        if (!_allowedPagesCache || _allowedPagesCacheRole !== effectiveRole) {
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
        assignStandalonePortalRoute('social', effectiveRole);
        return;
    }

    const sections = getPageSections();
    const targetSection = sections.length > 0 ? getNavigablePageSection(pageId) : null;
    const routeMode = getPortalRouteMode(pageId, { hasNavigableSection: Boolean(targetSection) });

    if (
        routeMode === 'spa-section'
        && !skipRuntimeBootstrap
        && (pageId === 'news' || pageId === 'orders')
    ) {
        const runtimePromise = ensureRuntimeForPage(pageId);
        if (runtimePromise) {
            primeShellSectionTransition(pageId, effectiveRole);
            runtimePromise.then(() => navigate(pageId, true));
            return;
        }
    }

    // PERFORMANCE: Use cached allowed pages instead of rebuilding Set every time
    if (!_allowedPagesCache || _allowedPagesCacheRole !== effectiveRole) {
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
        markPortalNavigationPhase(pageId, 'content-ready');
        return { navigationSkipped: true };
    }

    // Standalone HTML routes: always hard-navigate via the shared route resolver.
    if (!isIndexPortalShell()) {
        assignStandalonePortalRoute(
            pageId,
            typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : effectiveRole
        );
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
    const alwaysExternal = ['admin-tools', 'admin-scheduler', 'staff', 'students-admin', 'profile-view', 'exams'];
    if (alwaysExternal.includes(pageId)) {
        const externalPages = {
            'admin-tools': 'admin-tools.html',
            'admin-scheduler': 'admin-scheduler.html',
            'staff': 'staff.html',
            'students-admin': 'students-admin.html',
            'profile-view': 'profile-view.html',
            'exams': 'exams.html'
        };
        cleanupStaleSocialRouteState(pageId);
        persistNavigationAuthSnapshot();
        let externalTarget = externalPages[pageId];
        if (pageId === 'profile-view') {
            if (resolveActiveWorkspaceViewRole(effectiveRole) === USER_ROLES.STUDENT_SERVICE) {
                externalTarget = resolveWorkspacePortalNavUrl('profile-view', effectiveRole);
            } else if (shouldRedirectProfileViewToPersonalData()) {
                externalTarget = appendPortalViewQuery('personal-data.html', effectiveRole);
            }
        }
        window.location.assign(externalTarget);
        return;
    }

    // Pages always re-render on navigation to pick up theme/transparency changes

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
                if (pageId === 'library' && typeof renderLibraryPage === 'function') {
                    renderLibraryPage();
                }
                // Mark page as rendered
                _domCache.lastRenderedPages.add(pageId);
                _domCache.lastPageId = pageId;

                ensureFacultyExamsNavLink();
                syncProfessorNavActiveState();
            }

            if (found) {
                window.scrollTo(0,0);
                markPortalNavigationPhase(pageId, 'content-ready');
                return; // Stay on page
            }
        }
    }

    assignStandalonePortalRoute(pageId, effectiveRole);
}

window.__kiuCoreNavigate = navigate;
__kiuNavExpose({
    navigate,
});
window.__mobileNavHooked = false;
try {
    window.dispatchEvent(new Event('kiu:navigate-runtime-ready'));
} catch (error) {}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installPortalRoutePrefetch, { once: true });
} else {
    installPortalRoutePrefetch();
}
