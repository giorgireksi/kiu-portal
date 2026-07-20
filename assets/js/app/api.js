/* READABILITY: Portal API client — fetch helpers, auth headers, domain endpoints.
 * Sections: Boot | Fetch | Auth | Portal | Social
 * See docs/human-maintainability.md (H2). */
var KIU_PORTAL_BACKEND_URL_KEY = 'KIU_PORTAL_BACKEND_URL';
var KIU_PORTAL_LOCAL_BACKEND_HOST = '127.0.0.1';
var KIU_PORTAL_BACKEND_PORT = '48933';
// --- READABILITY: Boot ---
function getKiuPortalBackendDefaultUrl() {
    try {
        if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
            const host = window.location.hostname || KIU_PORTAL_LOCAL_BACKEND_HOST;
            const isLocalHost = /^(127\.0\.0\.1|localhost)$/i.test(host);
            if (isLocalHost) {
                return window.location.origin;
            }
            return window.location.origin;
        }
    } catch (error) {}
    return `http://${KIU_PORTAL_LOCAL_BACKEND_HOST}:${KIU_PORTAL_BACKEND_PORT}`;
}
var KIU_PORTAL_BACKEND_DEFAULT_URL = getKiuPortalBackendDefaultUrl();
var KIU_PORTAL_SESSION_TOKEN_KEY = 'KIU_PORTAL_SESSION_TOKEN';
var KIU_PORTAL_BACKEND_TIMEOUT_MS = 4000;
var KIU_PORTAL_BACKEND_COOLDOWN_MS = 5000;
var KIU_PORTAL_PUBLIC_ENDPOINT_PATTERNS = [
// --- READABILITY: Auth ---
    /^\/api\/portal\/session\/login\b/i,
    /^\/api\/password\//i,
// --- READABILITY: Portal ---
    /^\/api\/portal\/microsoft\/config\b/i,
    /^\/api\/portal\/microsoft\/start\b/i,
    /^\/api\/platform\/config\b/i,
    /^\/api\/push\/public-config\b/i
];
window.__KIU_API_RUNTIME_LOADED = true;
window.__KIU_API_RUNTIME_REQUESTED = false;

function hasExplicitPortalBackendUrl() {
    try {
        return Boolean(localStorage.getItem(KIU_PORTAL_BACKEND_URL_KEY));
    } catch (error) {
        return false;
    }
}

function shouldBypassPortalBackendFetch() {
    try {
        if (window.location?.protocol !== 'file:') return false;
        const configuredUrl = String(localStorage.getItem(KIU_PORTAL_BACKEND_URL_KEY) || KIU_PORTAL_BACKEND_DEFAULT_URL || '').trim();
        const usesLocalBackend = /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?/i.test(configuredUrl);
        return !hasExplicitPortalBackendUrl() && !usesLocalBackend;
    } catch (error) {
        return false;
    }
}

function getKiuPortalBackendUrl() {
    try {
        const explicitPortalUrl = String(localStorage.getItem(KIU_PORTAL_BACKEND_URL_KEY) || '').trim();
        if (explicitPortalUrl) return explicitPortalUrl.replace(/\/$/, '');
        if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
            return String(window.location.origin).replace(/\/$/, '');
        }
        return String(KIU_PORTAL_BACKEND_DEFAULT_URL).replace(/\/$/, '');
    } catch (error) {
        return KIU_PORTAL_BACKEND_DEFAULT_URL;
    }
}

async function kiuPortalFetch(path, options = {}) {
    if (shouldBypassPortalBackendFetch()) {
        const failure = new Error('Portal backend is unavailable in direct file mode.');
        failure.code = 'KIU_PORTAL_FILE_MODE_NO_BACKEND';
        failure.silent = true;
        setPortalRuntimeDiagnostic({
            kind: 'backend-unavailable',
            code: failure.code,
            path,
            message: failure.message,
            status: 0
        });
        throw failure;
    }
    const runtime = ensurePortalBackendRuntime();
    const now = Date.now();
    if (runtime.backendUnavailableUntil && runtime.backendUnavailableUntil > now) {
        const failure = new Error(runtime.lastBackendError || 'Portal backend is temporarily unavailable.');
        failure.code = 'KIU_PORTAL_BACKEND_COOLDOWN';
        failure.silent = true;
        setPortalRuntimeDiagnostic({
            kind: 'backend-unavailable',
            code: failure.code,
            path,
            message: failure.message,
            status: 0
        });
        throw failure;
    }
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : KIU_PORTAL_BACKEND_TIMEOUT_MS;
    const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    let response;
    const portalSessionToken = getPortalSessionToken();
    const protectedRequest = doesPortalEndpointRequireSession(path);
    if (!portalSessionToken && hasPortalAuthSnapshot() && protectedRequest) {
        runtime.online = false;
        runtime.lastBackendError = 'Portal backend session token is missing. Sign in through the portal backend to open this workspace.';
        const failure = new Error(runtime.lastBackendError);
        failure.code = 'KIU_PORTAL_SESSION_REQUIRED';
        failure.status = 401;
        failure.silent = true;
        if (!shouldSuppressPortalFetchDiagnostic(options, path)) {
            setPortalRuntimeDiagnostic({
                kind: 'missing-session',
                code: failure.code,
                path,
                message: failure.message,
                status: 401
            });
        }
        throw failure;
    }
    try {
// --- READABILITY: Fetch ---
        response = await fetch(`${getKiuPortalBackendUrl()}${path}`, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(portalSessionToken ? { 'X-Portal-Session': portalSessionToken } : {}),
                ...(options.headers || {})
            },
            body: options.body,
            cache: 'no-store',
            signal: controller ? controller.signal : undefined
        });
    } catch (error) {
        runtime.online = false;
        if (error?.name === 'AbortError') {
            runtime.lastBackendError = `Portal backend timed out after ${Math.round(timeoutMs / 1000)}s.`;
        } else if (String(error?.message || '').trim().toLowerCase() === 'failed to fetch') {
            runtime.lastBackendError = `Portal backend unreachable at ${getKiuPortalBackendUrl()}. Start the backend on port ${KIU_PORTAL_BACKEND_PORT} and use http://127.0.0.1:8876.`;
        } else {
            runtime.lastBackendError = error?.message || 'Portal backend is unavailable.';
        }
        runtime.backendUnavailableUntil = Date.now() + KIU_PORTAL_BACKEND_COOLDOWN_MS;
        const failure = new Error(runtime.lastBackendError);
        failure.code = error?.name === 'AbortError' ? 'KIU_PORTAL_BACKEND_TIMEOUT' : 'KIU_PORTAL_BACKEND_OFFLINE';
        failure.silent = true;
        setPortalRuntimeDiagnostic({
            kind: error?.name === 'AbortError' ? 'backend-timeout' : 'backend-unavailable',
            code: failure.code,
            path,
            message: failure.message,
            status: 0
        });
        throw failure;
    } finally {
        if (timeout) clearTimeout(timeout);
    }
    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        payload = null;
    }
    if (!response.ok) {
        runtime.online = response.status < 500;
        const message = payload?.error || payload?.message || `Portal backend request failed (${response.status}).`;
        if (
            response.status === 401 &&
            !/\/api\/portal\/session\/login\b/i.test(String(path || '')) &&
            !/\/api\/password\//i.test(String(path || ''))
        ) {
            handleKiuUnauthorizedSession({
                redirect: true,
                message,
                path,
                status: response.status,
                kind: portalSessionToken ? 'unauthorized-session' : 'missing-session'
            });
        }
        const failure = new Error(message);
        failure.status = response.status;
        failure.payload = payload;
        throw failure;
    }
    runtime.online = true;
    runtime.backendUnavailableUntil = 0;
    runtime.lastBackendError = '';
    if (protectedRequest) clearPortalRuntimeDiagnostic();
    return payload;
}

function ensurePortalBackendRuntime() {
    window.__kiuPortalBackendRuntime = window.__kiuPortalBackendRuntime || {
        online: false,
        bootstrapPromise: null,
        syncTimer: null,
        syncPromise: null,
        lastSyncReason: '',
        syncing: false,
        platformConfig: null,
        platformConfigPromise: null,
        pushConfig: null,
        pushConfigPromise: null,
        mailSummary: null,
        backendUnavailableUntil: 0,
        lastBackendError: '',
        diagnostic: null
    };
    return window.__kiuPortalBackendRuntime;
}

function hasPortalAuthSnapshot() {
    try {
        return Boolean(localStorage.getItem('KIU_AUTH_STATE'));
    } catch (error) {
        return false;
    }
}

function shouldSuppressPortalFetchDiagnostic(options = {}, path = '') {
    if (options.suppressDiagnostic === true) return true;
    if (typeof document === 'undefined') return false;
    const contentArea = document.getElementById('lms-content-area');
    if (contentArea?.dataset?.activeLmsTab === 'whiteboard'
        && /\/api\/lms\/whiteboards\//i.test(String(path || ''))) {
        return true;
    }
    return false;
}

function isPortalLocalDevEnvironment() {
    try {
        const protocol = String(window.location?.protocol || '').trim().toLowerCase();
        const hostname = String(window.location?.hostname || '').trim().toLowerCase();
        return protocol === 'file:' || hostname === '127.0.0.1' || hostname === 'localhost';
    } catch (error) {
        return false;
    }
}

function doesPortalEndpointRequireSession(path = '') {
    const normalized = String(path || '').split('?')[0];
    if (!/^\/api\//i.test(normalized)) return false;
    return !KIU_PORTAL_PUBLIC_ENDPOINT_PATTERNS.some((pattern) => pattern.test(normalized));
}

function getPortalRuntimeDiagnosticCopy(detail = {}) {
    const kind = String(detail.kind || '').trim();
    if (kind === 'missing-session') {
        return {
            title: 'Backend session missing',
            message: detail.message || 'Local auth state is loaded, but this workspace needs a real portal backend session token before it can fetch protected data.'
        };
    }
    if (kind === 'unauthorized-session') {
        return {
            title: 'Backend session expired',
            message: detail.message || 'The saved portal backend session is no longer authorized. Sign in again to restore protected workspace data.'
        };
    }
    if (kind === 'backend-timeout') {
        return {
            title: 'Backend timed out',
            message: detail.message || 'The portal backend did not respond in time.'
        };
    }
    return {
        title: 'Backend unavailable',
        message: detail.message || 'The portal backend could not be reached.'
    };
}

function removeStorageKeysByPrefix(storage, prefix) {
    if (!storage || !prefix) return;
    try {
        const keys = [];
        for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (key && String(key).startsWith(prefix)) keys.push(String(key));
        }
        keys.forEach((key) => storage.removeItem(key));
    } catch (error) {}
}

function clearPortalClientAuthState(options = {}) {
    const activeSessionKey = typeof ACTIVE_SESSION_KEY !== 'undefined' ? ACTIVE_SESSION_KEY : 'KIU_ACTIVE_SESSION_USER_ID';
    const activeRoleImpersonationKey = typeof ACTIVE_ROLE_IMPERSONATION_KEY !== 'undefined' ? ACTIVE_ROLE_IMPERSONATION_KEY : 'KIU_ACTIVE_ROLE_IMPERSONATION';
    const preserveFaculty = options.preserveFaculty !== false;
    const preservedFaculty = preserveFaculty
        ? (() => {
            try {
                return String(localStorage.getItem('currentFaculty') || localStorage.getItem('KIU_FACULTY_CONTEXT') || '').trim();
            } catch (error) {
                return '';
            }
        })()
        : '';
    try { localStorage.removeItem('KIU_AUTH_STATE'); } catch (error) {}
    try { localStorage.removeItem('currentUserRole'); } catch (error) {}
    try { localStorage.removeItem(PENDING_ROLE_SWITCH_KEY); } catch (error) {}
    try { localStorage.removeItem(KIU_PORTAL_SESSION_TOKEN_KEY); } catch (error) {}
    try { localStorage.removeItem('KIU_EXAM_PORTAL_TOKEN'); } catch (error) {}
    try { localStorage.removeItem('KIU_EXAM_PORTAL_STUDENT'); } catch (error) {}
    if (!preserveFaculty) {
        try { localStorage.removeItem('KIU_FACULTY_CONTEXT'); } catch (error) {}
        try { localStorage.removeItem('currentFaculty'); } catch (error) {}
    } else if (preservedFaculty) {
        try { localStorage.setItem('currentFaculty', preservedFaculty); } catch (error) {}
        try { localStorage.setItem('KIU_FACULTY_CONTEXT', preservedFaculty); } catch (error) {}
    }
    try { sessionStorage.removeItem(activeSessionKey); } catch (error) {}
    try { sessionStorage.removeItem(activeRoleImpersonationKey); } catch (error) {}
    try { sessionStorage.setItem('KIU_SESSION_EXPIRED', '1'); } catch (error) {}
    try { sessionStorage.removeItem('KIU_EXAM_PORTAL_TOKEN'); } catch (error) {}
    try { sessionStorage.removeItem('KIU_EXAM_PORTAL_STUDENT'); } catch (error) {}
    removeStorageKeysByPrefix(localStorage, 'KIU_EXAM_DRAFT_');
    removeStorageKeysByPrefix(sessionStorage, 'KIU_EXAM_DRAFT_');

    try {
        if (options.clearPersistentState !== false) {
            localStorage.removeItem('KIU_PERSISTENT_STATE');
        } else {
            const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
            if (persistedState?.auth) {
                delete persistedState.auth.activeUserId;
                localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
            }
        }
    } catch (error) {}

    if (typeof currentUser !== 'undefined') currentUser = null;
    if (typeof currentUserRole !== 'undefined') {
        currentUserRole = (typeof USER_ROLES !== 'undefined' && USER_ROLES?.STUDENT) ? USER_ROLES.STUDENT : 'student';
    }
    if (typeof KIU_STATE !== 'undefined' && KIU_STATE?.auth) {
        delete KIU_STATE.auth.activeUserId;
    }
    if (window.__kiuPortalBackendRuntime) {
        window.__kiuPortalBackendRuntime.syncing = false;
        window.__kiuPortalBackendRuntime.bootstrapPromise = null;
    }
    clearPortalRuntimeDiagnostic();
    if (window.__kiuRealtimeRuntime?.eventSource) {
        try { window.__kiuRealtimeRuntime.eventSource.close(); } catch (error) {}
        window.__kiuRealtimeRuntime.eventSource = null;
        window.__kiuRealtimeRuntime.bootstrappedFor = '';
    }
}

function handleKiuUnauthorizedSession(options = {}) {
    const authStateExists = (() => {
        try {
            return Boolean(localStorage.getItem('KIU_AUTH_STATE') || localStorage.getItem(KIU_PORTAL_SESSION_TOKEN_KEY));
        } catch (error) {
            return false;
        }
    })();
    if (!authStateExists) return;
    const runtime = ensurePortalBackendRuntime();
    const handledAt = Number(window.__kiuUnauthorizedHandledAt || 0);
    if (handledAt && Date.now() - handledAt < 1500) return;
    window.__kiuUnauthorizedHandledAt = Date.now();
    runtime.online = false;
    runtime.lastBackendError = String(options.message || 'Your session expired. Sign in again to continue.');
    const preferInlineDiagnostic = options.inline === true
        || (options.inline !== false && isPortalLocalDevEnvironment());
    if (preferInlineDiagnostic) {
        setPortalSessionToken('');
        setPortalRuntimeDiagnostic({
            kind: options.kind || 'unauthorized-session',
            code: options.code || 'KIU_PORTAL_SESSION_UNAUTHORIZED',
            path: options.path || '',
            message: runtime.lastBackendError,
            status: Number(options.status || 401) || 401
        });
        return;
    }
    clearPortalClientAuthState({ preserveFaculty: options.preserveFaculty !== false });
    if (options.redirect !== false && !isPortalLoginPage()) {
        window.location.assign('login.html');
    }
}

function setPortalSessionToken(token) {
    try {
        if (token) localStorage.setItem(KIU_PORTAL_SESSION_TOKEN_KEY, String(token));
        else localStorage.removeItem(KIU_PORTAL_SESSION_TOKEN_KEY);
    } catch (error) {
        console.warn('Could not persist portal session token.', error);
    }
}

function resolveAdminEffectiveRole(account, session = {}) {
    const actualRole = account?.role || USER_ROLES.STUDENT;
    if (actualRole !== USER_ROLES.ADMIN) return actualRole;
    const sessionRole = String(session?.impersonatedRole || '').trim().toLowerCase();
    if (Object.values(USER_ROLES).includes(sessionRole) && sessionRole !== USER_ROLES.ADMIN) {
        return sessionRole;
    }
    try {
        const pending = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
        if (Object.values(USER_ROLES).includes(pending) && pending !== USER_ROLES.ADMIN) {
            return pending;
        }
        const stored = String(localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
        if (Object.values(USER_ROLES).includes(stored) && stored !== USER_ROLES.ADMIN) {
            return stored;
        }
    } catch (error) {}
    return actualRole;
}

function storePortalBackendAuth(account, session) {
    if (!account || !session) return null;
    const actualRole = account.role || USER_ROLES.STUDENT;
    const effectiveRole = resolveAdminEffectiveRole(account, session);
    const normalizedAuth = {
        id: account.id,
        name: account.name,
        nameEn: account.nameEn || account.name || '',
        avatar: account.avatar || account.photo || '',
        email: account.email || account.microsoftEmail || '',
        role: actualRole,
        faculty: account.facultyCode || account.faculty || ''
    };
    localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(normalizedAuth));
    localStorage.setItem('currentUserRole', effectiveRole);
    if (actualRole === USER_ROLES.ADMIN && effectiveRole !== USER_ROLES.ADMIN) localStorage.setItem(PENDING_ROLE_SWITCH_KEY, effectiveRole);
    else localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
    setPortalSessionToken(session.token || getPortalSessionToken());

    const activeSessionUserId = (() => {
        const impersonatedUserId = String(session.impersonatedUserId || '').trim();
        if (impersonatedUserId) return impersonatedUserId;
        if (actualRole !== USER_ROLES.ADMIN || effectiveRole === actualRole) {
            return normalizedAuth.id;
        }
        try {
            const preferredFaculty = normalizedAuth.faculty || localStorage.getItem('currentFaculty') || 'ECON';
            if (typeof getPreferredImpersonationUserForRole === 'function') {
                const persona = getPreferredImpersonationUserForRole(effectiveRole, preferredFaculty);
                if (persona?.id) return String(persona.id);
            }
        } catch (error) {}
        return normalizedAuth.id;
    })();

    try {
        if (effectiveRole !== normalizedAuth.role) sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        else sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        sessionStorage.setItem(ACTIVE_SESSION_KEY, activeSessionUserId);
    } catch (error) {
        console.warn('Could not update session storage during portal auth bootstrap.', error);
    }

    if (normalizedAuth.faculty) {
        localStorage.setItem('KIU_FACULTY_CONTEXT', normalizedAuth.faculty);
        localStorage.setItem('currentFaculty', normalizedAuth.faculty);
    }

    let persistedState = null;
    try {
        persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
    } catch (error) {
        persistedState = null;
    }
    const priorOwnerAccountId = String(persistedState?.meta?.portalStateOwnerAccountId || persistedState?.auth?.activeUserId || '').trim();
    const nextOwnerAccountId = String(normalizedAuth.id || '').trim();
    if (priorOwnerAccountId && nextOwnerAccountId && priorOwnerAccountId !== nextOwnerAccountId) {
        resetPortalLocalStateForAccountChange();
        persistedState = null;
    }
    if (!persistedState && typeof KIU_EMPTY_STATE !== 'undefined') {
        persistedState = JSON.parse(JSON.stringify(KIU_EMPTY_STATE));
    }
    if (persistedState) {
        persistedState.meta = persistedState.meta && typeof persistedState.meta === 'object' ? persistedState.meta : {};
        persistedState.meta.portalStateOwnerAccountId = nextOwnerAccountId;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
    }

    currentUserRole = effectiveRole;

    return { normalizedAuth, effectiveRole };
}

async function createPortalBackendSession(email, password) {
    const payload = await kiuPortalFetch('/api/portal/session/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    if (payload?.session?.token) setPortalSessionToken(payload.session.token);
    return payload;
}

async function fetchPortalBackendSession(token = getPortalSessionToken()) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return null;
    try {
        return await kiuPortalFetch('/api/portal/session', {
            headers: {
                'X-Portal-Session': normalizedToken
            }
        });
    } catch (error) {
        if (error?.status === 404 || error?.status === 401) {
            setPortalSessionToken('');
            return null;
        }
        throw error;
    }
}

async function destroyPortalBackendSession(token = getPortalSessionToken()) {
    if (!token) return null;
    try {
        const payload = await kiuPortalFetch('/api/portal/session/logout', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        setPortalSessionToken('');
        return payload;
    } catch (error) {
        setPortalSessionToken('');
        return null;
    }
}

async function syncPortalBackendImpersonation(role, userId = '') {
    const token = getPortalSessionToken();
    if (!token) return null;
    try {
        const normalizedRole = String(role || '').trim().toLowerCase();
        if (!normalizedRole || normalizedRole === USER_ROLES.ADMIN) {
            return await kiuPortalFetch('/api/session/impersonate-role', {
                method: 'DELETE',
                body: JSON.stringify({ token })
            });
        }
        const persona = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        const resolvedUserId = String(userId || persona?.id || '').trim();
        if (!resolvedUserId) return null;
        return await kiuPortalFetch('/api/session/impersonate-role', {
            method: 'POST',
            body: JSON.stringify({ token, role: normalizedRole, userId: resolvedUserId })
        });
    } catch (error) {
        return null;
    }
}

async function fetchPortalMicrosoftConfig() {
    try {
        return await kiuPortalFetch('/api/portal/microsoft/config');
    } catch (error) {
        return {
            ok: false,
            enabled: false,
            error: error.message || 'Microsoft sign-in is unavailable.'
        };
    }
}

async function fetchPortalPlatformConfig(force = false) {
    const runtime = ensurePortalBackendRuntime();
    if (runtime.platformConfig && !force) return runtime.platformConfig;
    if (runtime.platformConfigPromise && !force) return runtime.platformConfigPromise;
    runtime.platformConfigPromise = kiuPortalFetch('/api/platform/config')
        .then(payload => {
            runtime.platformConfig = payload?.config || null;
            return runtime.platformConfig;
        })
        .catch(() => {
            runtime.platformConfig = null;
            return null;
        })
        .finally(() => {
            runtime.platformConfigPromise = null;
        });
    return runtime.platformConfigPromise;
}

function getCachedPortalPlatformConfig() {
    return ensurePortalBackendRuntime().platformConfig || null;
}

async function fetchPortalPushConfig(force = false) {
    const runtime = ensurePortalBackendRuntime();
    if (runtime.pushConfig && !force) return runtime.pushConfig;
    if (runtime.pushConfigPromise && !force) return runtime.pushConfigPromise;
    runtime.pushConfigPromise = kiuPortalFetch('/api/push/public-config')
        .then((payload) => {
            runtime.pushConfig = payload || null;
            return runtime.pushConfig;
        })
        .catch(() => null)
        .finally(() => {
            runtime.pushConfigPromise = null;
        });
    return runtime.pushConfigPromise;
}

async function subscribePortalPush(subscription, encoding = 'aes128gcm') {
    return kiuPortalFetch('/api/push/subscribe', {
        method: 'POST',
        body: JSON.stringify({
            encoding,
            subscription
        })
    });
}

async function unsubscribePortalPush(endpoint) {
    return kiuPortalFetch('/api/push/unsubscribe', {
        method: 'POST',
        body: JSON.stringify({
            endpoint: String(endpoint || '').trim()
        })
    });
}

async function fetchPortalPlatformStatus() {
    try {
        const payload = await kiuPortalFetch('/api/platform/status');
        return payload?.status || null;
    } catch (error) {
        return null;
    }
}

async function fetchPortalIntegrationSystems() {
    try {
        const payload = await kiuPortalFetch('/api/integrations/systems');
        return Array.isArray(payload?.systems) ? payload.systems : [];
    } catch (error) {
        return [];
    }
}

async function savePortalIntegrationSystem(system) {
    return kiuPortalFetch('/api/integrations/systems', {
        method: 'POST',
        body: JSON.stringify({ system })
    });
}

const syncProtectedQuizRecord = window.syncProtectedQuizRecord;
const fetchLmsLiveQuizWorkspace = window.fetchLmsLiveQuizWorkspace;
const syncLmsLiveQuizWorkspace = window.syncLmsLiveQuizWorkspace;
const submitLmsLiveQuizAnswer = window.submitLmsLiveQuizAnswer;
const fetchLmsWhiteboardWorkspace = window.fetchLmsWhiteboardWorkspace;
const syncLmsWhiteboardWorkspace = window.syncLmsWhiteboardWorkspace;
const fetchLmsPersonalDashboardHistory = window.fetchLmsPersonalDashboardHistory;
const saveLmsPersonalDashboardSnapshot = window.saveLmsPersonalDashboardSnapshot;
const deleteLmsPersonalDashboardSnapshot = window.deleteLmsPersonalDashboardSnapshot;
const restoreLmsPersonalDashboardSnapshot = window.restoreLmsPersonalDashboardSnapshot;
const patchLmsPersonalDashboardWorkspaceShare = window.patchLmsPersonalDashboardWorkspaceShare;
const patchLmsPersonalDashboardPeerShares = window.patchLmsPersonalDashboardPeerShares;
const fetchLmsPersonalDashboardSharedWithMe = window.fetchLmsPersonalDashboardSharedWithMe;
const patchLmsPersonalDashboardSnapshotShare = window.patchLmsPersonalDashboardSnapshotShare;
const fetchLmsPersonalDashboardShareStatus = window.fetchLmsPersonalDashboardShareStatus;
const fetchLmsPersonalDashboardSharedHistory = window.fetchLmsPersonalDashboardSharedHistory;
const submitLmsWhiteboardOps = window.submitLmsWhiteboardOps;
const submitLmsWhiteboardSignal = window.submitLmsWhiteboardSignal;
const submitLmsLiveQuizJoin = window.submitLmsLiveQuizJoin;
const createProtectedQuizLaunchTicket = window.createProtectedQuizLaunchTicket;
const fetchProtectedQuizMonitor = window.fetchProtectedQuizMonitor;
const fetchProtectedQuizAttempts = window.fetchProtectedQuizAttempts;
const fetchProtectedQuizClientAttempt = window.fetchProtectedQuizClientAttempt;
const postProtectedQuizHeartbeat = window.postProtectedQuizHeartbeat;
const postProtectedQuizEvent = window.postProtectedQuizEvent;
const submitProtectedQuizAttempt = window.submitProtectedQuizAttempt;
const saveProtectedQuizManualGrade = window.saveProtectedQuizManualGrade;
const performProtectedQuizStudentAction = window.performProtectedQuizStudentAction;
const syncExamSessionRecord = window.syncExamSessionRecord;
const createExamPortalAuthSession = window.createExamPortalAuthSession;
const fetchExamPortalSessions = window.fetchExamPortalSessions;
const fetchExamPortalSessionSummary = window.fetchExamPortalSessionSummary;
const createExamPortalLaunchTicket = window.createExamPortalLaunchTicket;
const fetchPortalSyncRuns = window.fetchPortalSyncRuns;
const createPortalSyncRun = window.createPortalSyncRun;
const fetchPortalSyncConflicts = window.fetchPortalSyncConflicts;
const createPortalSyncConflict = window.createPortalSyncConflict;
const fetchPortalAuditEvents = window.fetchPortalAuditEvents;
const createPortalAuditEvent = window.createPortalAuditEvent;
const getPortalRtcConfiguration = window.getPortalRtcConfiguration;
const getPortalFileStorageMode = window.getPortalFileStorageMode;
const uploadPortalStoredFile = window.uploadPortalStoredFile;
const getPortalStoredFileUrl = window.getPortalStoredFileUrl;
const extractPersistableSocialHubState = window.extractPersistableSocialHubState;
const applyPortalSocialState = window.applyPortalSocialState;
const persistPortalSocialState = window.persistPortalSocialState;
const queuePortalSocialSync = window.queuePortalSocialSync;
const bootstrapPortalSocialState = window.bootstrapPortalSocialState;
const schedulePortalSocialBootstrap = window.schedulePortalSocialBootstrap;
const isStandaloneSocialRoute = window.isStandaloneSocialRoute;
const ensurePortalSocialGroupChatRecord = window.ensurePortalSocialGroupChatRecord;
const beginMicrosoftPortalLogin = window.beginMicrosoftPortalLogin;
const completeMicrosoftPortalLoginFromUrl = window.completeMicrosoftPortalLoginFromUrl;

async function beginPortalMailConnect(returnTo = window.location.href) {
    const payload = await kiuPortalFetch(`/api/mail/connect/start?returnTo=${encodeURIComponent(returnTo)}`);
    if (!payload?.authorizeUrl) {
        throw new Error(payload?.error || 'Outlook mailbox connection could not be started.');
    }
    window.location.href = payload.authorizeUrl;
    return payload;
}

async function completePortalMailConnectFromUrl() {
    const currentUrl = new URL(window.location.href);
    const status = String(currentUrl.searchParams.get('mail_status') || '').trim();
    const errorMessage = String(currentUrl.searchParams.get('mail_error') || '').trim();
    const mailbox = String(currentUrl.searchParams.get('mailbox') || '').trim();
    if (!status && !errorMessage && !mailbox) return null;

    ['mail_status', 'mail_error', 'mailbox'].forEach(key => currentUrl.searchParams.delete(key));
    window.history.replaceState({}, document.title, currentUrl.toString());

    if (status !== 'connected') {
        return {
            success: false,
            status: status || 'error',
            error: errorMessage || 'Outlook mailbox connection could not be completed.'
        };
    }

    const payload = await fetchPortalMailBootstrap().catch(() => null);
    return {
        success: true,
        status: 'connected',
        mailbox,
        payload
    };
}

async function fetchPortalMailBootstrap() {
    const payload = await kiuPortalFetch('/api/mail/bootstrap');
    if (payload?.summary) setPortalMailSummary(payload.summary);
    return payload || null;
}

async function disconnectPortalMailConnection() {
    const payload = await kiuPortalFetch('/api/mail/connection', {
        method: 'DELETE'
    });
    setPortalMailSummary(payload?.summary || null);
    return payload || null;
}

async function fetchPortalMailMessages(options = {}) {
    const params = new URLSearchParams();
    if (options.folder) params.set('folder', options.folder);
    if (options.search) params.set('search', options.search);
    if (options.unreadOnly) params.set('unreadOnly', 'true');
    if (options.limit) params.set('limit', String(options.limit));
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const payload = await kiuPortalFetch(`/api/mail/messages${suffix}`);
    if (payload?.summary) setPortalMailSummary(payload.summary);
    return payload || null;
}

async function fetchPortalMailMessage(messageId) {
    const safeMessageId = encodeURIComponent(String(messageId || '').trim());
    if (!safeMessageId) throw new Error('Message id is required.');
    const payload = await kiuPortalFetch(`/api/mail/messages/${safeMessageId}`);
    if (payload?.summary) setPortalMailSummary(payload.summary);
    return payload?.message || null;
}

async function sendPortalMailMessage(payload = {}) {
    const result = await kiuPortalFetch('/api/mail/messages/send', {
        method: 'POST',
        body: JSON.stringify(payload || {})
    });
    if (result?.summary) setPortalMailSummary(result.summary);
    return result || null;
}

async function replyPortalMailMessage(messageId, payload = {}) {
    const safeMessageId = encodeURIComponent(String(messageId || '').trim());
    if (!safeMessageId) throw new Error('Message id is required.');
    const result = await kiuPortalFetch(`/api/mail/messages/${safeMessageId}/reply`, {
        method: 'POST',
        body: JSON.stringify(payload || {})
    });
    if (result?.summary) setPortalMailSummary(result.summary);
    return result || null;
}

async function updatePortalMailReadState(messageId, isRead, folder = '') {
    const safeMessageId = encodeURIComponent(String(messageId || '').trim());
    if (!safeMessageId) throw new Error('Message id is required.');
    const result = await kiuPortalFetch(`/api/mail/messages/${safeMessageId}/read-state`, {
        method: 'POST',
        body: JSON.stringify({
            isRead: isRead === true,
            folder
        })
    });
    if (result?.summary) setPortalMailSummary(result.summary);
    return result || null;
}

async function syncPortalMail(payload = {}) {
    const result = await kiuPortalFetch('/api/mail/sync', {
        method: 'POST',
        body: JSON.stringify(payload || {})
    });
    if (result?.bootstrap?.summary) setPortalMailSummary(result.bootstrap.summary);
    return result || null;
}

function countAdminRegistrationStructureModules(structures, faculty) {
    const bucket = structures?.[faculty];
    if (!bucket || typeof bucket !== 'object') return 0;
    return ['prog', 'free', 'conc', 'minor'].reduce((sum, tabId) => {
        const modules = bucket[tabId];
        return sum + (Array.isArray(modules) ? modules.length : 0);
    }, 0);
}

function countRegistrationTrackBucketEntries(bucket) {
    if (!bucket || typeof bucket !== 'object') return 0;
    const trackData = bucket.trackData && typeof bucket.trackData === 'object' ? bucket.trackData : {};
    return Object.values(trackData).reduce((sum, tabTrack) => {
        if (!tabTrack || typeof tabTrack !== 'object') return sum;
        return sum + Object.keys(tabTrack).length;
    }, 0);
}

function countRegistrationCmsBucketEntries(cmsByFaculty, faculty) {
    const bucket = cmsByFaculty?.[faculty];
    if (!bucket || typeof bucket !== 'object') return 0;
    const trackCount = countRegistrationTrackBucketEntries(bucket);
    const concKeys = Object.keys(bucket.concCourseData && typeof bucket.concCourseData === 'object' ? bucket.concCourseData : {}).length;
    const minorKeys = Object.keys(bucket.minorProgramData && typeof bucket.minorProgramData === 'object' ? bucket.minorProgramData : {}).length;
    return Math.max(trackCount, concKeys + minorKeys);
}

function isEmptyAdminProgramFacultyBucket(bucket) {
    if (!bucket || typeof bucket !== 'object') return true;
    return ['prog', 'free', 'conc', 'minor'].every((tabId) => {
        const modules = bucket[tabId];
        return !Array.isArray(modules) || modules.length === 0;
    });
}

function isEmptyRegistrationCmsFacultyBucket(bucket) {
    if (!bucket || typeof bucket !== 'object') return true;
    if (countRegistrationTrackBucketEntries(bucket) > 0) return false;
    const concData = bucket.concCourseData && typeof bucket.concCourseData === 'object' ? bucket.concCourseData : {};
    const minorData = bucket.minorProgramData && typeof bucket.minorProgramData === 'object' ? bucket.minorProgramData : {};
    return Object.keys(concData).length === 0 && Object.keys(minorData).length === 0;
}

function getRegistrationCmsRevisionMs(stateOrMeta = {}) {
    const meta = stateOrMeta?.meta && typeof stateOrMeta.meta === 'object' ? stateOrMeta.meta : {};
    const revision = Number(meta.registrationCmsRevision || 0);
    return Number.isFinite(revision) && revision > 0 ? revision : 0;
}

function getRegistrationCmsSavedAtMs(stateOrMeta = {}) {
    const source = stateOrMeta && typeof stateOrMeta === 'object' ? stateOrMeta : {};
    const meta = source.meta && typeof source.meta === 'object' ? source.meta : {};
    const cmsSavedAt = meta.registrationCmsSavedAt;
    if (cmsSavedAt != null && cmsSavedAt !== '') {
        if (typeof cmsSavedAt === 'number' && Number.isFinite(cmsSavedAt)) return cmsSavedAt;
        const parsed = Date.parse(String(cmsSavedAt));
        if (Number.isFinite(parsed)) return parsed;
    }
    return getRegistrationCmsRevisionMs(source);
}

function countAdminRegistrationStructureModulesWithTrack(state, faculty) {
    const structureCount = countAdminRegistrationStructureModules(state?.adminProgramStructures, faculty);
    const trackCount = countRegistrationTrackBucketEntries(state?.registrationCMSByFaculty?.[faculty]);
    return Math.max(structureCount, trackCount);
}

function shouldCopyLocalAdminProgramFacultyBucket(localState, remoteState, faculty) {
    const localBucket = localState?.adminProgramStructures?.[faculty];
    const remoteBucket = remoteState?.adminProgramStructures?.[faculty];
    const localCount = countAdminRegistrationStructureModulesWithTrack(localState, faculty);
    const remoteCount = countAdminRegistrationStructureModulesWithTrack(remoteState, faculty);
    if (remoteCount > localCount) return false;
    if (localCount > remoteCount) return Boolean(localBucket);
    const localEmpty = isEmptyAdminProgramFacultyBucket(localBucket);
    const remoteEmpty = isEmptyAdminProgramFacultyBucket(remoteBucket);
    if (!localEmpty && remoteEmpty) return Boolean(localBucket);
    if (localEmpty && !remoteEmpty) return false;
    if (!localBucket) return false;
    if (!remoteBucket) return true;
    const localRev = getRegistrationCmsRevisionMs(localState);
    const remoteRev = getRegistrationCmsRevisionMs(remoteState);
    if (localRev !== remoteRev) return localRev > remoteRev;
    return getRegistrationCmsSavedAtMs(localState) >= getRegistrationCmsSavedAtMs(remoteState);
}

function shouldCopyLocalRegistrationCmsConcMinorBucket(localState, remoteState, faculty) {
    const localBucket = localState?.registrationCMSByFaculty?.[faculty];
    const remoteBucket = remoteState?.registrationCMSByFaculty?.[faculty];
    const localCount = countRegistrationCmsBucketEntries(localState?.registrationCMSByFaculty, faculty);
    const remoteCount = countRegistrationCmsBucketEntries(remoteState?.registrationCMSByFaculty, faculty);
    if (remoteCount > localCount) return false;
    if (localCount > remoteCount) return Boolean(localBucket);
    const localEmpty = isEmptyRegistrationCmsFacultyBucket(localBucket);
    const remoteEmpty = isEmptyRegistrationCmsFacultyBucket(remoteBucket);
    if (!localEmpty && remoteEmpty) return Boolean(localBucket);
    if (localEmpty && !remoteEmpty) return false;
    if (!localBucket) return false;
    if (!remoteBucket) return true;
    const localRev = getRegistrationCmsRevisionMs(localState);
    const remoteRev = getRegistrationCmsRevisionMs(remoteState);
    if (localRev !== remoteRev) return localRev > remoteRev;
    return getRegistrationCmsSavedAtMs(localState) >= getRegistrationCmsSavedAtMs(remoteState);
}

function restoreRemoteRegistrationCmsAfterBootstrapLoss(state, remoteBackup) {
    if (!state || typeof state !== 'object' || !remoteBackup || typeof remoteBackup !== 'object') return;
    if (isRegistrationCmsEmptyAcrossFaculties(remoteBackup)) return;
    if (!isRegistrationCmsEmptyAcrossFaculties(state)) return;
    state.adminProgramStructures = clonePortalState(
        remoteBackup.adminProgramStructures && typeof remoteBackup.adminProgramStructures === 'object'
            ? remoteBackup.adminProgramStructures
            : {}
    );
    state.registrationCMSByFaculty = clonePortalState(
        remoteBackup.registrationCMSByFaculty && typeof remoteBackup.registrationCMSByFaculty === 'object'
            ? remoteBackup.registrationCMSByFaculty
            : {}
    );
}

function isRegistrationCmsEmptyAcrossFaculties(state = {}) {
    const structures = state.adminProgramStructures && typeof state.adminProgramStructures === 'object'
        ? state.adminProgramStructures
        : {};
    const cmsByFaculty = state.registrationCMSByFaculty && typeof state.registrationCMSByFaculty === 'object'
        ? state.registrationCMSByFaculty
        : {};
    const faculties = new Set([
        ...Object.keys(structures),
        ...Object.keys(cmsByFaculty)
    ]);
    if (!faculties.size) return true;
    return Array.from(faculties).every((faculty) => (
        isEmptyAdminProgramFacultyBucket(structures[faculty])
        && isEmptyRegistrationCmsFacultyBucket(cmsByFaculty[faculty])
    ));
}

const PORTAL_NEVER_MERGE_FROM_LOCAL_KEYS = new Set(['auth', 'domain', 'lmsLiveQuizzes', 'studentServiceArticles']);
const PORTAL_STUDENT_KEYED_STATE_KEYS = new Set([
    'studentSchedulesByStudent',
    'tuitionBalances',
    'homeDashboardPreferencesByUser',
    'portalMessengerFavorites'
]);

function getPortalStateSavedAtMs(stateOrMeta = {}) {
    const source = stateOrMeta && typeof stateOrMeta === 'object' ? stateOrMeta : {};
    const raw = source.meta && typeof source.meta === 'object'
        ? source.meta.portalStateSavedAt
        : source.portalStateSavedAt;
    if (raw == null || raw === '') return 0;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const parsed = Date.parse(String(raw));
    return Number.isFinite(parsed) ? parsed : Number(raw) || 0;
}

function getJsonFootprint(value) {
    try {
        return JSON.stringify(value || {}).length;
    } catch (error) {
        return 0;
    }
}

function getBestLocalPortalSnapshot(inMemoryState = null) {
    let persisted = null;
    try {
        persisted = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
    } catch (error) {
        persisted = null;
    }
    const memory = inMemoryState && typeof inMemoryState === 'object' ? inMemoryState : {};
    const memoryAt = getPortalStateSavedAtMs(memory);
    const persistedAt = getPortalStateSavedAtMs(persisted);
    if (persisted && typeof persisted === 'object' && persistedAt >= memoryAt) return persisted;
    return memory;
}

function mergeStudentKeyedPortalMaps(localMap, remoteMap, activeUserId = '') {
    const result = clonePortalState(remoteMap && typeof remoteMap === 'object' ? remoteMap : {});
    const local = localMap && typeof localMap === 'object' ? localMap : {};
    const scopedUserId = String(activeUserId || '').trim();
    if (scopedUserId) {
        if (local[scopedUserId] !== undefined) {
            result[scopedUserId] = clonePortalState(local[scopedUserId]);
        }
        return result;
    }
    Object.entries(local).forEach(([key, value]) => {
        if (value !== undefined) result[key] = clonePortalState(value);
    });
    return result;
}

function canMergeLocalPortalSnapshot(localSnapshot, ownerAccountId = '') {
    const local = localSnapshot && typeof localSnapshot === 'object' ? localSnapshot : {};
    const owner = String(ownerAccountId || '').trim();
    if (!owner) return true;
    const localOwner = String(local?.meta?.portalStateOwnerAccountId || '').trim();
    if (localOwner && localOwner !== owner) return false;
    const localAuthUserId = String(local?.auth?.activeUserId || '').trim();
    if (!localOwner && localAuthUserId && localAuthUserId !== owner) return false;
    return true;
}

function resetPortalLocalStateForAccountChange() {
    try {
        localStorage.removeItem('KIU_PERSISTENT_STATE');
    } catch (error) {}
    if (typeof KIU_STATE !== 'undefined' && typeof createFreshKiuState === 'function') {
        KIU_STATE = createFreshKiuState();
    }
}

function mergeRicherPortalValue(localValue, remoteValue) {
    const localFootprint = getJsonFootprint(localValue);
    const remoteFootprint = getJsonFootprint(remoteValue);
    if (localFootprint > remoteFootprint) return clonePortalState(localValue);
    if (remoteFootprint > localFootprint && remoteValue !== undefined) return remoteValue;
    return remoteValue !== undefined ? remoteValue : clonePortalState(localValue);
}

const mergeAdminLibraryState = window.mergeAdminLibraryState;
const mergeRegistrationCmsStateFromLocal = window.mergeRegistrationCmsStateFromLocal;

function mergePortalStateFromLocal(localState, remoteState, options = {}) {
    if (!remoteState || typeof remoteState !== 'object') return;
    const local = localState && typeof localState === 'object' ? localState : {};
    if (!Object.keys(local).length) return;
    if (options.allowLocalMerge === false) return;

    if (options.allowCmsMerge !== false) {
        mergeRegistrationCmsStateFromLocal(local, remoteState);
    }

    const localSavedAt = getPortalStateSavedAtMs(local);
    const remoteSavedAt = getPortalStateSavedAtMs(remoteState);
    const serverSavedAt = getPortalStateSavedAtMs(options.serverMeta || {});
    const preferLocal = options.allowLocalMerge !== false && (
        options.forcePreferLocal === true
        || localSavedAt > remoteSavedAt
        || localSavedAt > serverSavedAt
    );

    Object.keys(local).forEach((key) => {
        if (PORTAL_NEVER_MERGE_FROM_LOCAL_KEYS.has(key)) return;
        if (key === 'meta') return;
        if (key === 'adminProgramStructures' || key === 'registrationCMSByFaculty') return;
        if (local[key] === undefined) return;

        if (PORTAL_STUDENT_KEYED_STATE_KEYS.has(key)) {
            remoteState[key] = mergeStudentKeyedPortalMaps(local[key], remoteState[key], options.activeUserId);
            return;
        }

        if (key === 'adminLibrary') {
            remoteState[key] = mergeAdminLibraryState(local[key], remoteState[key], { preferLocal });
            return;
        }

        if (preferLocal) {
            remoteState[key] = clonePortalState(local[key]);
            return;
        }

        if (local[key] !== null && typeof local[key] === 'object') {
            remoteState[key] = mergeRicherPortalValue(local[key], remoteState[key]);
        } else if (local[key] != null && remoteState[key] == null) {
            remoteState[key] = clonePortalState(local[key]);
        }
    });

    remoteState.meta = remoteState.meta && typeof remoteState.meta === 'object' ? remoteState.meta : {};
    const localMeta = local.meta && typeof local.meta === 'object' ? local.meta : {};
    const mergedSavedAt = Math.max(localSavedAt, remoteSavedAt, serverSavedAt);
    if (mergedSavedAt > 0) {
        remoteState.meta.portalStateSavedAt = mergedSavedAt;
    }
    remoteState.meta.registrationCmsRevision = Math.max(
        Number(remoteState.meta.registrationCmsRevision || 0),
        Number(localMeta.registrationCmsRevision || 0)
    );
}


function applyPortalBootstrapState(remoteState, options = {}) {
    if (!remoteState || typeof remoteState !== 'object') return false;
    const render = options.render !== false;
    const nextState = clonePortalState(remoteState);
    const remoteCmsBackup = {
        adminProgramStructures: clonePortalState(remoteState.adminProgramStructures || {}),
        registrationCMSByFaculty: clonePortalState(remoteState.registrationCMSByFaculty || {})
    };
    const ownerAccountId = String(options?.account?.id || currentUser?.id || '').trim();
    const localSnapshot = getBestLocalPortalSnapshot(
        (typeof KIU_STATE !== 'undefined' && KIU_STATE) ? KIU_STATE : null
    );
    const serverMeta = options.serverMeta && typeof options.serverMeta === 'object' ? options.serverMeta : {};
    const localSnapshotSavedAt = getPortalStateSavedAtMs(localSnapshot);
    const allowLocalMerge = canMergeLocalPortalSnapshot(localSnapshot, ownerAccountId);
    const forcePreferLocal = allowLocalMerge && localSnapshotSavedAt > getPortalStateSavedAtMs(serverMeta);
    const freshLocalClient = localSnapshotSavedAt === 0;
    const localHadRegistrationCms = !isRegistrationCmsEmptyAcrossFaculties(localSnapshot);
    const remoteHadRegistrationCms = !isRegistrationCmsEmptyAcrossFaculties(remoteState);

    const storedRole = (() => {
        try {
            return String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
        } catch (error) {
            return '';
        }
    })();
    const effectiveRole = (currentUser?.role === USER_ROLES.ADMIN && (storedRole || currentUserRole))
        ? (storedRole || currentUserRole)
        : (currentUser?.role || USER_ROLES.STUDENT);
    const activeUserId = (() => {
        const bootstrapImpersonatedUserId = String(options?.session?.impersonatedUserId || '').trim();
        if (bootstrapImpersonatedUserId) return bootstrapImpersonatedUserId;
        try {
            const sessionUserId = sessionStorage.getItem(ACTIVE_SESSION_KEY);
            if (sessionUserId) return String(sessionUserId);
        } catch (error) {}
        if (allowLocalMerge) {
            try {
                const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
                const persistedUserId = persistedState?.auth?.activeUserId;
                if (persistedUserId) return String(persistedUserId);
            } catch (error) {}
        }
        if (currentUser?.role === USER_ROLES.ADMIN && effectiveRole && effectiveRole !== USER_ROLES.ADMIN) {
            try {
                const preferredFaculty = normalizeFacultyCode(
                    localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON',
                    'ECON'
                );
                if (typeof getPreferredImpersonationUserForRole === 'function') {
                    const persona = getPreferredImpersonationUserForRole(effectiveRole, preferredFaculty);
                    if (persona?.id) return String(persona.id);
                }
            } catch (error) {}
        }
        return String(currentUser?.id || '');
    })();

    mergePortalStateFromLocal(localSnapshot, nextState, {
        serverMeta,
        forcePreferLocal,
        allowLocalMerge,
        allowCmsMerge: allowLocalMerge,
        activeUserId
    });

    const requiredCleanupVersion = typeof MANUAL_TESTING_STATE_VERSION === 'number' ? MANUAL_TESTING_STATE_VERSION : 7;
    let sanitizedBootstrapState = false;

    if (typeof sanitizeStateForManualTesting === 'function') {
        sanitizeStateForManualTesting(nextState, {
            retainAdminTestingPersonas: currentUser?.role === USER_ROLES.ADMIN
        });
        if (Number(nextState?.meta?.manualTestingSanitizedVersion || 0) !== requiredCleanupVersion) {
            sanitizedBootstrapState = true;
        }
        try {
            localStorage.setItem(REAL_TESTING_CLEANUP_FLAG, String(requiredCleanupVersion));
        } catch (error) {
            console.warn('Could not persist cleanup version after portal bootstrap sanitization.', error);
        }
    }

    if (remoteHadRegistrationCms) {
        restoreRemoteRegistrationCmsAfterBootstrapLoss(nextState, remoteCmsBackup);
    }

    delete nextState.studentServiceArticles;
    KIU_STATE = nextState;
    if (KIU_STATE && typeof KIU_STATE === 'object') {
        KIU_STATE.lmsLiveQuizzes = KIU_STATE.lmsLiveQuizzes && typeof KIU_STATE.lmsLiveQuizzes === 'object'
            ? KIU_STATE.lmsLiveQuizzes
            : {};
        KIU_STATE.studentServiceArticles = [];
    }
    KIU_STATE.auth = KIU_STATE.auth || {};
    if (activeUserId) KIU_STATE.auth.activeUserId = activeUserId;
    try {
        if (activeUserId) sessionStorage.setItem(ACTIVE_SESSION_KEY, activeUserId);
        if (effectiveRole && currentUser?.role === USER_ROLES.ADMIN && effectiveRole !== currentUser.role) {
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        } else {
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        }
    } catch (error) {}

    try {
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(buildPortalPersistableState(KIU_STATE)));
    } catch (error) {
        console.warn('Could not cache portal bootstrap state.', error);
    }

    if (typeof ensureCanonicalState === 'function') {
        ensureCanonicalState();
        if (currentUser?.role === USER_ROLES.ADMIN && effectiveRole && effectiveRole !== USER_ROLES.ADMIN && typeof setActiveSessionUserByRole === 'function') {
            setActiveSessionUserByRole(effectiveRole);
        }
        try {
            localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(buildPortalPersistableState(KIU_STATE)));
        } catch (error) {
            console.warn('Could not refresh cached portal bootstrap state.', error);
        }
    }
    if (document.getElementById('admin-library-catalog-tabs')) {
        if (typeof window.renderAdminLibraryAfterBootstrap === 'function') {
            window.renderAdminLibraryAfterBootstrap();
        } else if (typeof window.renderAdminLibrary === 'function') {
            window.renderAdminLibrary();
        }
    } else if (
        document.getElementById('page-library')?.classList?.contains('active-page')
        && typeof window.refreshLibraryCatalogAfterBootstrap === 'function'
    ) {
        window.refreshLibraryCatalogAfterBootstrap();
    }
    if (typeof window !== 'undefined') {
        window.__KIU_PORTAL_BOOTSTRAP_PENDING = false;
    }
    if (effectiveRole) currentUserRole = effectiveRole;

    if (render) {
        if (typeof queueKiuUiRefresh === 'function') {
            const snapshot = typeof captureUiScrollSnapshot === 'function' ? captureUiScrollSnapshot() : null;
            queueKiuUiRefresh(snapshot);
        }
        if (typeof renderPortalNotificationChrome === 'function') {
            setTimeout(() => renderPortalNotificationChrome(), 0);
        }
    }
    if (sanitizedBootstrapState && typeof queuePortalStateSync === 'function') {
        setTimeout(() => queuePortalStateSync('manual-testing-cleanup'), 0);
    }
    if (
        freshLocalClient
        && isRegistrationCmsEmptyAcrossFaculties(KIU_STATE)
        && !localHadRegistrationCms
        && !remoteHadRegistrationCms
        && typeof queuePortalStateSync === 'function'
    ) {
        setTimeout(() => queuePortalStateSync('registration-cms-reset'), 0);
    }
    if (typeof reloadActiveLmsLiveQuizFromServer === 'function') {
        reloadActiveLmsLiveQuizFromServer('portal-bootstrap');
    }
    if (typeof reconcileAdminRegistrationCmsAfterIdentityChange === 'function') {
        let bootstrapFaculty = '';
        if (typeof getAdminRegistrationFaculty === 'function') {
            bootstrapFaculty = getAdminRegistrationFaculty();
        }
        if (!bootstrapFaculty) {
            try {
                bootstrapFaculty = localStorage.getItem('currentFaculty') || '';
            } catch (error) {}
        }
        if (!bootstrapFaculty && typeof getCurrentFaculty === 'function') {
            bootstrapFaculty = getCurrentFaculty();
        }
        reconcileAdminRegistrationCmsAfterIdentityChange(bootstrapFaculty || 'ECON');
    }
    return true;
}

async function persistPortalStateToBackend(reason = 'saveState') {
    if (isStandaloneSocialRoute()) return null;
    const runtime = ensurePortalBackendRuntime();
    if (typeof KIU_STATE === 'undefined') return null;
    if (runtime.syncPromise) return runtime.syncPromise;
    const token = getPortalSessionToken();
    if (!token) return null;
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    const actorRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (activeUser?.role || currentUserRole || '');
    runtime.syncing = true;
    runtime.syncPromise = (async () => {
        try {
            const payload = await kiuPortalFetch('/api/portal/state', {
                method: 'POST',
                timeoutMs: 15000,
                body: JSON.stringify({
                    reason,
                    token,
                    actorId: activeUser?.id || '',
                    actorRole,
                    state: buildPortalBackendPersistableState(KIU_STATE)
                })
            });
            runtime.online = true;
            return payload;
        } catch (error) {
            runtime.online = false;
            return null;
        } finally {
            runtime.syncing = false;
        }
    })();
    try {
        return await runtime.syncPromise;
    } finally {
        runtime.syncPromise = null;
    }
}

function flushPortalStateSync() {
    if (isStandaloneSocialRoute()) return null;
    const runtime = ensurePortalBackendRuntime();
    runtime.lastSyncReason = runtime.lastSyncReason || 'saveState';
    if (runtime.syncTimer) {
        clearTimeout(runtime.syncTimer);
        runtime.syncTimer = null;
    }
    if (!runtime.syncPromise) {
        runtime.syncPromise = persistPortalStateToBackend(runtime.lastSyncReason || 'saveState');
    }
    return runtime.syncPromise;
}

function sendPortalStateKeepalive() {
    if (isStandaloneSocialRoute()) return;
    const token = getPortalSessionToken();
    if (!token || typeof KIU_STATE === 'undefined' || shouldBypassPortalBackendFetch()) return;
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    const actorRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (activeUser?.role || currentUserRole || '');
    try {
        fetch(`${getKiuPortalBackendUrl()}/api/portal/state`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Portal-Session': token
            },
            body: JSON.stringify({
                reason: 'beforeunload',
                token,
                actorId: activeUser?.id || '',
                actorRole,
                state: buildPortalBackendPersistableState(KIU_STATE)
            }),
            keepalive: true
        }).catch(() => null);
    } catch (error) {}
}

function flushPortalStateBeforeNavigation(options = {}) {
    if (typeof flushAdminRegistrationStateSave === 'function') {
        try {
            flushAdminRegistrationStateSave(options);
        } catch (error) {}
    }
    if (typeof saveState === 'function') {
        try {
            saveState();
        } catch (error) {}
    }
    const liveQuizFlush = typeof window.flushLmsLiveQuizSync === 'function'
        ? window.flushLmsLiveQuizSync()
        : Promise.resolve();
    if (options.keepalive) {
        return liveQuizFlush.then(() => {
            sendPortalStateKeepalive();
        });
    }
    return liveQuizFlush.then(() => {
        if (typeof flushPortalStateSync === 'function') {
            return flushPortalStateSync();
        }
        return null;
    });
}

function queuePortalStateSync(reason = 'saveState') {
    if (isStandaloneSocialRoute()) return;
    const runtime = ensurePortalBackendRuntime();
    runtime.lastSyncReason = reason;
    if (runtime.syncTimer) clearTimeout(runtime.syncTimer);
    runtime.syncTimer = setTimeout(() => {
        runtime.syncTimer = null;
        persistPortalStateToBackend(runtime.lastSyncReason || 'saveState');
    }, 180);
}

async function bootstrapPortalBackendState(force = false) {
    if (isStandaloneSocialRoute()) return null;
    const runtime = ensurePortalBackendRuntime();
    if (runtime.bootstrapPromise && !force) return runtime.bootstrapPromise;
    runtime.bootstrapPromise = (async () => {
        if (runtime.syncPromise) {
            await runtime.syncPromise.catch(() => null);
        }
        const token = getPortalSessionToken();
        if (!token) {
            runtime.online = false;
            if (typeof window !== 'undefined') {
                window.__KIU_PORTAL_BOOTSTRAP_PENDING = false;
            }
            return null;
        }
        await fetchPortalPlatformConfig(force).catch(() => null);
        const payload = await kiuPortalFetch('/api/bootstrap', { timeoutMs: 15000 });
        if (token && (!payload?.session || !payload?.account)) {
            handleKiuUnauthorizedSession({
                redirect: true,
                message: 'Your saved session is no longer valid. Sign in again to continue.'
            });
            return null;
        }
        runtime.online = true;

        if (payload?.session?.token) setPortalSessionToken(payload.session.token);
        let bootstrapEffectiveRole = '';
        if (payload?.account && payload?.session) {
            const authResult = storePortalBackendAuth(payload.account, payload.session);
            bootstrapEffectiveRole = authResult?.effectiveRole || currentUserRole || payload.account.role;
            if (typeof loadAuthState === 'function' && !currentUser) {
                loadAuthState();
            }
        }
        setPortalMailSummary(payload?.mailSummary || null);

        const bootstrapAccounts = Array.isArray(payload?.accounts) ? payload.accounts : [];

        if (payload?.state) {
            applyPortalBootstrapState(payload.state, {
                render: true,
                session: payload.session || null,
                serverMeta: payload.meta || {}
            });
        } else if (typeof KIU_STATE !== 'undefined' && KIU_STATE) {
            queuePortalStateSync('initial-bootstrap');
        }

        if (bootstrapAccounts.length && typeof hydratePortalUsersFromAccounts === 'function') {
            hydratePortalUsersFromAccounts(bootstrapAccounts, { persist: false });
        }
        const bootstrapImpersonatedUserId = String(payload?.session?.impersonatedUserId || '').trim();
        if (bootstrapImpersonatedUserId) {
            KIU_STATE.auth = KIU_STATE.auth || {};
            KIU_STATE.auth.activeUserId = bootstrapImpersonatedUserId;
            try {
                sessionStorage.setItem(ACTIVE_SESSION_KEY, bootstrapImpersonatedUserId);
            } catch (error) {}
        }
        if (
            bootstrapEffectiveRole
            && currentUser?.role === USER_ROLES.ADMIN
            && bootstrapEffectiveRole !== USER_ROLES.ADMIN
            && typeof setActiveSessionUserByRole === 'function'
        ) {
            setActiveSessionUserByRole(bootstrapEffectiveRole);
        }
// --- READABILITY: Social ---
        if (payload?.social) {
            applyPortalSocialState(payload.social, { render: false });
        } else if (typeof schedulePortalSocialBootstrap === 'function') {
            schedulePortalSocialBootstrap(force);
        }
        if (
            typeof scheduleKiuRealtimeBootstrap === 'function'
            && (typeof shouldEagerBootstrapKiuRealtime !== 'function' || shouldEagerBootstrapKiuRealtime())
        ) {
            scheduleKiuRealtimeBootstrap(force);
        }
        return payload;
    })().catch(error => {
        runtime.online = false;
        return null;
    }).finally(() => {
        if (typeof window !== 'undefined') {
            window.__KIU_PORTAL_BOOTSTRAP_PENDING = false;
        }
        runtime.bootstrapPromise = null;
    });
    return runtime.bootstrapPromise;
}

function schedulePortalBackendBootstrap(force = false) {
    if (isStandaloneSocialRoute()) {
        if (typeof window !== 'undefined') {
            window.__KIU_PORTAL_BOOTSTRAP_PENDING = false;
        }
        return;
    }
    if (!force && typeof window !== 'undefined' && window.__KIU_PORTAL_BOOTSTRAP_PENDING) {
        return;
    }
    if (!getPortalSessionToken()) {
        if (typeof window !== 'undefined') {
            window.__KIU_PORTAL_BOOTSTRAP_PENDING = false;
        }
        return;
    }
    setTimeout(() => {
        bootstrapPortalBackendState(force).catch(() => null);
    }, 0);
}

function getPortalOpsActor() {
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    return {
        actorUserId: activeUser?.id || '',
        actorRole: typeof getEffectiveUserRole === 'function'
            ? getEffectiveUserRole()
            : (activeUser?.role || currentUserRole || '')
    };
}

function recordPortalAudit(domain, eventType, entityType, entityId, extras = {}) {
    if (typeof createPortalAuditEvent !== 'function' || !domain || !eventType || !entityType || !entityId) {
        return Promise.resolve(null);
    }
    return createPortalAuditEvent({
        ...getPortalOpsActor(),
        eventDomain: domain,
        eventType,
        entityType,
        entityId,
        sourceSystem: extras.sourceSystem || 'portal',
        beforeState: Object.prototype.hasOwnProperty.call(extras, 'beforeState') ? extras.beforeState : null,
        afterState: Object.prototype.hasOwnProperty.call(extras, 'afterState') ? extras.afterState : null,
        requestId: extras.requestId || ''
    }).catch(() => null);
}

function recordPortalSyncRun(systemCode, syncRun = {}) {
    if (typeof createPortalSyncRun !== 'function' || !systemCode) return Promise.resolve(null);
    const actor = getPortalOpsActor();
    return createPortalSyncRun({
        systemCode,
        actorId: syncRun.actorId || actor.actorUserId || '',
        scope: syncRun.scope || 'incremental',
        status: syncRun.status || 'completed',
        startedAt: syncRun.startedAt || new Date().toISOString(),
        finishedAt: syncRun.finishedAt || new Date().toISOString(),
        recordsSeen: Number(syncRun.recordsSeen || 0) || 0,
        recordsChanged: Number(syncRun.recordsChanged || 0) || 0,
        errorSummary: syncRun.errorSummary || '',
        notes: syncRun.notes || ''
    }).catch(() => null);
}

function recordPortalSyncConflict(systemCode, entityType, conflictField, conflict = {}) {
    if (typeof createPortalSyncConflict !== 'function' || !systemCode || !entityType || !conflictField) {
        return Promise.resolve(null);
    }
    return createPortalSyncConflict({
        systemCode,
        entityType,
        conflictField,
        syncRunId: conflict.syncRunId || '',
        localRecordId: conflict.localRecordId || '',
        externalRecordKey: conflict.externalRecordKey || '',
        localValue: Object.prototype.hasOwnProperty.call(conflict, 'localValue') ? conflict.localValue : null,
        externalValue: Object.prototype.hasOwnProperty.call(conflict, 'externalValue') ? conflict.externalValue : null,
        resolutionStatus: conflict.resolutionStatus || 'open',
        resolvedByUserId: conflict.resolvedByUserId || '',
        resolvedAt: conflict.resolvedAt || ''
    }).catch(() => null);
}

async function fetchStudentAcademicEnrollments(studentId) {
    const safeId = encodeURIComponent(String(studentId || '').trim());
    if (!safeId) return { ok: true, enrollments: [] };
    return kiuPortalFetch(`/api/students/${safeId}/enrollments`);
}

