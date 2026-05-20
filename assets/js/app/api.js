var KIU_PORTAL_BACKEND_URL_KEY = 'KIU_PORTAL_BACKEND_URL';
var KIU_PORTAL_LOCAL_BACKEND_HOST = '127.0.0.1';
var KIU_PORTAL_BACKEND_PORT = '48933';
function getKiuPortalBackendDefaultUrl() {
    try {
        if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
            const host = window.location.hostname || KIU_PORTAL_LOCAL_BACKEND_HOST;
            const isLocalHost = /^(127\.0\.0\.1|localhost)$/i.test(host);
            if (isLocalHost) {
                return `${window.location.protocol}//${host}:${KIU_PORTAL_BACKEND_PORT}`;
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
    /^\/api\/portal\/session\/login\b/i,
    /^\/api\/password\//i,
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
        if (typeof getKiuRealtimeBridgeUrl === 'function') {
            return String(getKiuRealtimeBridgeUrl() || KIU_PORTAL_BACKEND_DEFAULT_URL).replace(/\/$/, '');
        }
        return String(localStorage.getItem(KIU_PORTAL_BACKEND_URL_KEY) || KIU_PORTAL_BACKEND_DEFAULT_URL).replace(/\/$/, '');
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
    const timeout = controller ? setTimeout(() => controller.abort(), KIU_PORTAL_BACKEND_TIMEOUT_MS) : null;
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
        setPortalRuntimeDiagnostic({
            kind: 'missing-session',
            code: failure.code,
            path,
            message: failure.message,
            status: 401
        });
        throw failure;
    }
    try {
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
        runtime.lastBackendError = error?.name === 'AbortError'
            ? `Portal backend timed out after ${Math.round(KIU_PORTAL_BACKEND_TIMEOUT_MS / 1000)}s.`
            : (error?.message || 'Portal backend is unavailable.');
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

function renderPortalRuntimeDiagnostic(detail = null) {
    const existing = document.getElementById('kiu-portal-runtime-diagnostic');
    if (!detail) {
        if (existing) existing.remove();
        return;
    }
    if (!document.body) {
        window.setTimeout(() => renderPortalRuntimeDiagnostic(detail), 0);
        return;
    }
    const copy = getPortalRuntimeDiagnosticCopy(detail);
    const banner = existing || document.createElement('div');
    banner.id = 'kiu-portal-runtime-diagnostic';
    banner.setAttribute('data-diagnostic-kind', String(detail.kind || 'backend-unavailable'));
    banner.style.cssText = [
        'position:fixed',
        'top:16px',
        'left:50%',
        'transform:translateX(-50%)',
        'z-index:1000000',
        'width:min(960px, calc(100vw - 32px))',
        'padding:14px 16px',
        'border-radius:16px',
        'border:1px solid rgba(245,158,11,0.38)',
        'background:rgba(17,24,39,0.94)',
        'box-shadow:0 20px 50px rgba(0,0,0,0.28)',
        'color:#f8fafc',
        'font:600 13px/1.45 system-ui, sans-serif'
    ].join(';');
    const routePath = String(detail.path || '').trim();
    banner.innerHTML = `
        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
            <div style="min-width:0;">
                <div style="font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:#fbbf24;">${copy.title}</div>
                <div style="margin-top:6px;">${copy.message}</div>
                ${routePath ? `<div style="margin-top:6px; font-size:11px; color:rgba(255,255,255,0.72);">Route: ${escapeHtml(routePath)}</div>` : ''}
            </div>
            <button type="button" data-close-portal-diagnostic="1" style="border:0; background:transparent; color:#f8fafc; font-size:18px; line-height:1; cursor:pointer;">x</button>
        </div>
    `;
    banner.querySelector('[data-close-portal-diagnostic="1"]')?.addEventListener('click', () => {
        clearPortalRuntimeDiagnostic();
    }, { once: true });
    if (!existing) document.body.appendChild(banner);
}

function setPortalRuntimeDiagnostic(detail = null) {
    const runtime = ensurePortalBackendRuntime();
    runtime.diagnostic = detail ? {
        ...detail,
        updatedAt: new Date().toISOString()
    } : null;
    renderPortalRuntimeDiagnostic(runtime.diagnostic);
    try {
        window.dispatchEvent(new CustomEvent('kiu:portal-runtime-diagnostic', {
            detail: runtime.diagnostic
        }));
    } catch (error) {}
    return runtime.diagnostic;
}

function clearPortalRuntimeDiagnostic() {
    const runtime = ensurePortalBackendRuntime();
    runtime.diagnostic = null;
    renderPortalRuntimeDiagnostic(null);
    try {
        window.dispatchEvent(new CustomEvent('kiu:portal-runtime-diagnostic', {
            detail: null
        }));
    } catch (error) {}
}

function decodeBase64UrlToUint8Array(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return new Uint8Array();
    const padding = '='.repeat((4 - normalized.length % 4) % 4);
    const base64 = (normalized + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    return Uint8Array.from(raw.split('').map(character => character.charCodeAt(0)));
}

function dispatchPortalMailSummaryUpdate(summary = null) {
    try {
        window.dispatchEvent(new CustomEvent('kiu:mail-summary-updated', {
            detail: summary ? clonePortalState(summary) : null
        }));
    } catch (error) {}
}

function setPortalMailSummary(summary = null) {
    const runtime = ensurePortalBackendRuntime();
    runtime.mailSummary = summary && typeof summary === 'object'
        ? clonePortalState(summary)
        : {
            connected: false,
            mailboxAddress: '',
            unreadCount: 0,
            lastSyncAt: '',
            lastSyncStatus: 'idle',
            lastError: ''
        };
    dispatchPortalMailSummaryUpdate(runtime.mailSummary);
    return runtime.mailSummary;
}

function getPortalMailSummary() {
    return clonePortalState(ensurePortalBackendRuntime().mailSummary || {
        connected: false,
        mailboxAddress: '',
        unreadCount: 0,
        lastSyncAt: '',
        lastSyncStatus: 'idle',
        lastError: ''
    });
}

function clonePortalState(source) {
    try {
        return JSON.parse(JSON.stringify(source || {}));
    } catch (error) {
        return {};
    }
}

function buildPortalPersistableState(source = (typeof KIU_STATE !== 'undefined' ? KIU_STATE : {})) {
    const snapshot = clonePortalState(source);
    delete snapshot.domain;
    delete snapshot.auth;
    return snapshot;
}

function buildPortalBackendPersistableState(source = (typeof KIU_STATE !== 'undefined' ? KIU_STATE : {})) {
    const snapshot = buildPortalPersistableState(source);
    const allowedTopLevelKeys = [
        'calendarEvents',
        'gradebookWeights',
        'homeDashboardPreferencesByUser',
        'orderReadsByUser',
        'portalMessengerFavorites',
        'portalMessengerHiddenChats',
        'portalMessengerPinnedChats',
        'publicSocialUi'
    ];
    return allowedTopLevelKeys.reduce((result, key) => {
        if (Object.prototype.hasOwnProperty.call(snapshot, key)) {
            result[key] = clonePortalState(snapshot[key]);
        }
        return result;
    }, {});
}

function getPortalSessionToken() {
    try {
        return String(localStorage.getItem(KIU_PORTAL_SESSION_TOKEN_KEY) || '').trim();
    } catch (error) {
        return '';
    }
}

function isPortalLoginPage() {
    try {
        const currentPath = String(window.location?.pathname || '').replace(/\\/g, '/').toLowerCase();
        return currentPath.endsWith('/login.html') || currentPath.endsWith('login.html') || currentPath.endsWith('/login') || currentPath === 'login';
    } catch (error) {
        return false;
    }
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

function storePortalBackendAuth(account, session) {
    if (!account || !session) return null;
    const actualRole = account.role || USER_ROLES.STUDENT;
    const effectiveRole = actualRole === USER_ROLES.ADMIN
        ? (session.impersonatedRole || actualRole)
        : actualRole;
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
        if (actualRole !== USER_ROLES.ADMIN || effectiveRole === actualRole) {
            return normalizedAuth.id;
        }
        try {
            const preferredFaculty = normalizedAuth.faculty || localStorage.getItem('currentFaculty') || 'ECON';
            if (typeof ensureAdminTestingPersonas === 'function') {
                ensureAdminTestingPersonas(preferredFaculty);
            }
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
    if (!persistedState && typeof KIU_EMPTY_STATE !== 'undefined') {
        persistedState = JSON.parse(JSON.stringify(KIU_EMPTY_STATE));
    }
    if (persistedState) {
        persistedState.auth = persistedState.auth || {};
        persistedState.auth.activeUserId = activeSessionUserId;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
    }

    return normalizedAuth;
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

async function syncPortalBackendImpersonation(role) {
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
        return await kiuPortalFetch('/api/session/impersonate-role', {
            method: 'POST',
            body: JSON.stringify({ token, role: normalizedRole })
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

async function syncProtectedQuizRecord(quiz) {
    const payload = await kiuPortalFetch('/api/protected-quizzes/sync', {
        method: 'POST',
        body: JSON.stringify(quiz || {})
    });
    return payload?.quiz || null;
}

async function fetchLmsLiveQuizWorkspace(resourceKey) {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const payload = await kiuPortalFetch(`/api/lms/live-quizzes/${safeResourceKey}`);
    return payload?.workspace || null;
}

async function syncLmsLiveQuizWorkspace(resourceKey, workspace = {}, reason = 'live-quiz') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const payload = await kiuPortalFetch(`/api/lms/live-quizzes/${safeResourceKey}`, {
        method: 'POST',
        body: JSON.stringify({
            workspace: workspace && typeof workspace === 'object' ? workspace : {},
            reason
        })
    });
    return payload?.workspace || null;
}

async function createProtectedQuizLaunchTicket(quizId, payload = {}) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const result = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/launch-ticket`, {
        method: 'POST',
        body: JSON.stringify(payload || {})
    });
    return result || null;
}

async function fetchProtectedQuizMonitor(groupKey, quizId = '') {
    const safeGroupKey = encodeURIComponent(String(groupKey || '').trim());
    const suffix = quizId ? `?quizId=${encodeURIComponent(String(quizId || '').trim())}` : '';
    const payload = await kiuPortalFetch(`/api/protected-quizzes/group/${safeGroupKey}/monitor${suffix}`);
    return payload?.monitor || null;
}

async function fetchProtectedQuizAttempts(courseId, quizId) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const safeCourseId = encodeURIComponent(String(courseId || '').trim());
    const payload = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/attempts?courseId=${safeCourseId}`);
    return {
        quiz: payload?.quiz || null,
        attempts: Array.isArray(payload?.attempts) ? payload.attempts : []
    };
}

async function fetchProtectedQuizClientAttempt(courseId, quizId) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const safeCourseId = encodeURIComponent(String(courseId || '').trim());
    const payload = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/attempt?courseId=${safeCourseId}`);
    return payload || null;
}

async function postProtectedQuizHeartbeat(courseId, quizId, payload = {}) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const result = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/heartbeat`, {
        method: 'POST',
        body: JSON.stringify({
            ...(payload || {}),
            courseId
        })
    });
    return result || null;
}

async function postProtectedQuizEvent(courseId, quizId, payload = {}) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const result = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/events`, {
        method: 'POST',
        body: JSON.stringify({
            ...(payload || {}),
            courseId
        })
    });
    return result || null;
}

async function submitProtectedQuizAttempt(courseId, quizId, payload = {}) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const result = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/submit`, {
        method: 'POST',
        body: JSON.stringify({
            ...(payload || {}),
            courseId
        })
    });
    return result || null;
}

async function saveProtectedQuizManualGrade(courseId, quizId, payload = {}) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const result = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/manual-grade`, {
        method: 'POST',
        body: JSON.stringify({
            ...(payload || {}),
            courseId
        })
    });
    return result || null;
}

async function performProtectedQuizStudentAction(courseId, quizId, studentId, action, payload = {}) {
    const safeQuizId = encodeURIComponent(String(quizId || '').trim());
    const safeStudentId = encodeURIComponent(String(studentId || '').trim());
    const safeAction = String(action || '').trim().toLowerCase();
    const allowed = new Set(['block', 'unblock', 'force-submit', 'reset-warnings', 'approve-reconnect', 'override-status']);
    if (!allowed.has(safeAction)) throw new Error('Unsupported protected quiz action.');
    const result = await kiuPortalFetch(`/api/protected-quizzes/${safeQuizId}/students/${safeStudentId}/${safeAction}`, {
        method: 'POST',
        body: JSON.stringify({
            ...(payload || {}),
            courseId
        })
    });
    return result || null;
}

async function syncExamSessionRecord(session) {
    const payload = await kiuPortalFetch('/api/exam-sessions/sync', {
        method: 'POST',
        body: JSON.stringify(session || {})
    });
    return payload?.session || null;
}

async function createExamPortalAuthSession(email, studentId) {
    const payload = await kiuPortalFetch('/api/exam-portal/auth', {
        method: 'POST',
        body: JSON.stringify({ email, studentId })
    });
    return payload || null;
}

async function fetchExamPortalSessions(token) {
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return null;
    const payload = await kiuPortalFetch('/api/exam-portal/sessions', {
        headers: {
            'X-Exam-Portal-Token': normalizedToken
        }
    });
    return payload || null;
}

async function fetchExamPortalSessionSummary(sessionId, token) {
    const safeSessionId = encodeURIComponent(String(sessionId || '').trim());
    const normalizedToken = String(token || '').trim();
    if (!normalizedToken) return null;
    const payload = await kiuPortalFetch(`/api/exam-portal/session/${safeSessionId}`, {
        headers: {
            'X-Exam-Portal-Token': normalizedToken
        }
    });
    return payload?.session || null;
}

async function createExamPortalLaunchTicket(sessionId, token, payload = {}) {
    const safeSessionId = encodeURIComponent(String(sessionId || '').trim());
    const normalizedToken = String(token || '').trim();
    const result = await kiuPortalFetch(`/api/exam-portal/sessions/${safeSessionId}/launch-ticket`, {
        method: 'POST',
        headers: normalizedToken ? {
            'X-Exam-Portal-Token': normalizedToken
        } : {},
        body: JSON.stringify({
            ...(payload || {})
        })
    });
    return result || null;
}

async function fetchPortalSyncRuns(options = {}) {
    const params = new URLSearchParams();
    if (options.systemCode) params.set('systemCode', options.systemCode);
    if (options.limit) params.set('limit', options.limit);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    try {
        const payload = await kiuPortalFetch(`/api/integrations/sync-runs${suffix}`);
        return Array.isArray(payload?.syncRuns) ? payload.syncRuns : [];
    } catch (error) {
        return [];
    }
}

async function createPortalSyncRun(syncRun) {
    return kiuPortalFetch('/api/integrations/sync-runs', {
        method: 'POST',
        body: JSON.stringify({ syncRun })
    });
}

async function fetchPortalSyncConflicts(options = {}) {
    const params = new URLSearchParams();
    if (options.systemCode) params.set('systemCode', options.systemCode);
    if (options.status) params.set('status', options.status);
    if (options.limit) params.set('limit', options.limit);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    try {
        const payload = await kiuPortalFetch(`/api/integrations/conflicts${suffix}`);
        return Array.isArray(payload?.conflicts) ? payload.conflicts : [];
    } catch (error) {
        return [];
    }
}

async function createPortalSyncConflict(conflict) {
    return kiuPortalFetch('/api/integrations/conflicts', {
        method: 'POST',
        body: JSON.stringify({ conflict })
    });
}

async function fetchPortalAuditEvents(options = {}) {
    const params = new URLSearchParams();
    if (options.domain) params.set('domain', options.domain);
    if (options.actorUserId) params.set('actorUserId', options.actorUserId);
    if (options.limit) params.set('limit', options.limit);
    const suffix = params.toString() ? `?${params.toString()}` : '';
    try {
        const payload = await kiuPortalFetch(`/api/audit/events${suffix}`);
        return Array.isArray(payload?.events) ? payload.events : [];
    } catch (error) {
        return [];
    }
}

async function createPortalAuditEvent(event) {
    return kiuPortalFetch('/api/audit/events', {
        method: 'POST',
        body: JSON.stringify({ event })
    });
}

function getPortalRtcConfiguration() {
    return getCachedPortalPlatformConfig()?.rtc || null;
}

function getPortalFileStorageMode() {
    return String(getCachedPortalPlatformConfig()?.fileStorageMode || '').trim().toLowerCase() || 'bridge';
}

async function uploadPortalStoredFile(file, scope = 'file') {
    if (!file) return null;
    const sourceBlob = file.blob instanceof Blob ? file.blob : (file instanceof Blob ? file : null);
    let dataUrl = String(file.dataUrl || '').trim();
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    if (!dataUrl && sourceBlob && typeof readBlobAsDataUrl === 'function') {
        dataUrl = await readBlobAsDataUrl(sourceBlob);
    }
    if (!dataUrl) return null;
    const payload = await kiuPortalFetch('/api/files/upload', {
        method: 'POST',
        body: JSON.stringify({
            name: file.name || 'download.bin',
            type: file.type || sourceBlob?.type || 'application/octet-stream',
            uploadedAt: file.uploadedAt || new Date().toISOString(),
            uploadedBy: activeUser?.id || '',
            scope,
            dataUrl
        })
    });
    if (!payload?.file?.id) return null;
    return {
        name: payload.file.name,
        type: payload.file.type,
        size: payload.file.size,
        uploadedAt: payload.file.uploadedAt,
        storageKey: payload.file.id,
        storageBackend: 'bridge',
        dataUrl: ''
    };
}

function getPortalStoredFileUrl(storageKey) {
    const normalizedKey = String(storageKey || '').trim();
    if (!normalizedKey) return '';
    return `${getKiuPortalBackendUrl()}/api/files/${encodeURIComponent(normalizedKey)}`;
}

function extractPersistableSocialHubState(source = (typeof KIU_STATE !== 'undefined' ? KIU_STATE.socialHub : null)) {
    const social = source && typeof source === 'object' ? clonePortalState(source) : {};
    return {
        lostFoundItems: Array.isArray(social.lostFoundItems) ? social.lostFoundItems : []
    };
}

function applyPortalSocialState(remoteSocial, options = {}) {
    if (!remoteSocial || typeof remoteSocial !== 'object' || typeof KIU_STATE === 'undefined' || !KIU_STATE) return false;
    const currentHub = KIU_STATE.socialHub && typeof KIU_STATE.socialHub === 'object' ? KIU_STATE.socialHub : {};
    KIU_STATE.socialHub = {
        ...clonePortalState(remoteSocial),
        ui: clonePortalState(currentHub.ui || {}),
        draftFiles: clonePortalState(currentHub.draftFiles || {})
    };
    if (typeof ensureCanonicalState === 'function') ensureCanonicalState();
    if (options.render !== false) {
        if (typeof renderPublicSocialPage === 'function') renderPublicSocialPage();
        if (typeof renderStudentSocialWorkspace === 'function') renderStudentSocialWorkspace();
        if (typeof renderPortalNotificationChrome === 'function') setTimeout(() => renderPortalNotificationChrome(), 0);
    }
    return true;
}

async function persistPortalSocialState(reason = 'social-save') {
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    const actorRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (activeUser?.role || currentUserRole || '');
    const payload = await kiuPortalFetch('/api/social/state', {
        method: 'POST',
        body: JSON.stringify({
            token: getPortalSessionToken(),
            actorId: activeUser?.id || '',
            actorRole,
            reason,
            social: extractPersistableSocialHubState()
        })
    });
    if (payload?.social) applyPortalSocialState(payload.social, { render: false });
    return payload?.social || null;
}

function queuePortalSocialSync(reason = 'social-save') {
    const runtime = ensurePortalBackendRuntime();
    runtime.socialSyncTimer = runtime.socialSyncTimer || null;
    runtime.lastSocialSyncReason = reason;
    if (runtime.socialSyncTimer) clearTimeout(runtime.socialSyncTimer);
    runtime.socialSyncTimer = setTimeout(async () => {
        runtime.socialSyncTimer = null;
        try {
            await persistPortalSocialState(runtime.lastSocialSyncReason || 'social-save');
        } catch (error) {
            console.warn('Could not sync social state to backend.', error);
        }
    }, 120);
}

async function bootstrapPortalSocialState(force = false) {
    const runtime = ensurePortalBackendRuntime();
    if (runtime.socialBootstrapPromise && !force) return runtime.socialBootstrapPromise;
    runtime.socialBootstrapPromise = (async () => {
        const payload = await kiuPortalFetch('/api/social/bootstrap');
        if (payload?.social) applyPortalSocialState(payload.social, { render: false });
        return payload?.social || null;
    })().catch(error => {
        if (!error?.silent) console.warn('Could not bootstrap social state.', error);
        return null;
    }).finally(() => {
        runtime.socialBootstrapPromise = null;
    });
    return runtime.socialBootstrapPromise;
}

function schedulePortalSocialBootstrap(force = false) {
    setTimeout(() => {
        bootstrapPortalSocialState(force).catch(() => null);
    }, 0);
}

async function ensurePortalSocialGroupChatRecord(group) {
    if (!group?.id) return null;
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    const payload = await kiuPortalFetch('/api/social/group-chat', {
        method: 'POST',
        body: JSON.stringify({
            token: getPortalSessionToken(),
            actorId: activeUser?.id || '',
            groupId: String(group.id)
        })
    });
    if (payload?.social) applyPortalSocialState(payload.social, { render: false });
    if (payload?.chat && typeof upsertPortalMessengerChatFromRealtime === 'function') {
        upsertPortalMessengerChatFromRealtime(payload.chat, true);
    }
    return payload?.chat || null;
}

async function beginMicrosoftPortalLogin(returnTo = window.location.href) {
    const payload = await kiuPortalFetch(`/api/portal/microsoft/start?returnTo=${encodeURIComponent(returnTo)}`);
    if (!payload?.authorizeUrl) {
        throw new Error(payload?.error || 'Microsoft sign-in could not be started.');
    }
    window.location.href = payload.authorizeUrl;
    return payload;
}

async function completeMicrosoftPortalLoginFromUrl() {
    const currentUrl = new URL(window.location.href);
    const status = String(currentUrl.searchParams.get('microsoft_status') || '').trim();
    const handoff = String(currentUrl.searchParams.get('microsoft_handoff') || '').trim();
    const email = String(currentUrl.searchParams.get('microsoft_email') || '').trim();
    const errorMessage = String(currentUrl.searchParams.get('microsoft_error') || '').trim();
    if (!status && !handoff) return null;

    const clearParams = () => {
        ['microsoft_status', 'microsoft_handoff', 'portal_token', 'microsoft_email', 'microsoft_error'].forEach(key => currentUrl.searchParams.delete(key));
        window.history.replaceState({}, document.title, currentUrl.toString());
    };

    if (status !== 'success' || !handoff) {
        clearParams();
        return {
            success: false,
            status: status || 'error',
            error: errorMessage || (status === 'unlinked'
                ? `Your Microsoft account${email ? ` (${email})` : ''} is valid but not linked to a portal record yet.`
                : 'Microsoft sign-in could not be completed.')
        };
    }

    clearParams();
    const payload = await kiuPortalFetch('/api/portal/microsoft/complete', {
        method: 'POST',
        body: JSON.stringify({ handoff })
    });
    if (!payload?.session || !payload?.account) {
        return {
            success: false,
            status: 'error',
            error: 'The Microsoft sign-in session could not be loaded.'
        };
    }

    storePortalBackendAuth(payload.account, payload.session);
    if (typeof loadAuthState === 'function') loadAuthState();
    if (typeof schedulePortalBackendBootstrap === 'function') schedulePortalBackendBootstrap(true);
    if (typeof createPortalAuditEvent === 'function') {
        createPortalAuditEvent({
            actorUserId: payload.account.id,
            actorRole: payload.account.role,
            eventDomain: 'auth',
            eventType: 'login',
            entityType: 'session',
            entityId: payload.account.id,
            sourceSystem: 'microsoft'
        }).catch(() => {});
    }
    return {
        success: true,
        status: 'success',
        session: payload.session,
        account: payload.account
    };
}

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

function applyPortalBootstrapState(remoteState, options = {}) {
    if (!remoteState || typeof remoteState !== 'object') return false;
    const render = options.render !== false;
    const nextState = clonePortalState(remoteState);
    const storedRole = (() => {
        try {
            return String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
        } catch (error) {
            return '';
        }
    })();
    const effectiveRole = (currentUser?.role === USER_ROLES.ADMIN && (currentUserRole || storedRole))
        ? (currentUserRole || storedRole)
        : (currentUser?.role || USER_ROLES.STUDENT);
    const activeUserId = (() => {
        try {
            const sessionUserId = sessionStorage.getItem(ACTIVE_SESSION_KEY);
            if (sessionUserId) return String(sessionUserId);
        } catch (error) {}
        try {
            const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
            const persistedUserId = persistedState?.auth?.activeUserId;
            if (persistedUserId) return String(persistedUserId);
        } catch (error) {}
        if (currentUser?.role === USER_ROLES.ADMIN && effectiveRole && effectiveRole !== USER_ROLES.ADMIN) {
            try {
                const preferredFaculty = normalizeFacultyCode(
                    localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON',
                    'ECON'
                );
                if (typeof ensureAdminTestingPersonas === 'function') {
                    ensureAdminTestingPersonas(preferredFaculty);
                }
                if (typeof getPreferredImpersonationUserForRole === 'function') {
                    const persona = getPreferredImpersonationUserForRole(effectiveRole, preferredFaculty);
                    if (persona?.id) return String(persona.id);
                }
            } catch (error) {}
        }
        return String(currentUser?.id || '');
    })();
    const requiredCleanupVersion = typeof MANUAL_TESTING_STATE_VERSION === 'number' ? MANUAL_TESTING_STATE_VERSION : 4;
    let sanitizedBootstrapState = false;

    if (
        typeof sanitizeStateForManualTesting === 'function'
        && Number(nextState?.meta?.manualTestingSanitizedVersion || 0) !== requiredCleanupVersion
    ) {
        sanitizeStateForManualTesting(nextState);
        sanitizedBootstrapState = true;
        try {
            localStorage.setItem(REAL_TESTING_CLEANUP_FLAG, String(requiredCleanupVersion));
        } catch (error) {
            console.warn('Could not persist cleanup version after portal bootstrap sanitization.', error);
        }
    }

    KIU_STATE = nextState;
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
    return true;
}

async function persistPortalStateToBackend(reason = 'saveState') {
    const runtime = ensurePortalBackendRuntime();
    if (runtime.syncing || typeof KIU_STATE === 'undefined') return null;
    const token = getPortalSessionToken();
    if (!token) return null;
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    const actorRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (activeUser?.role || currentUserRole || '');
    runtime.syncing = true;
    try {
        const payload = await kiuPortalFetch('/api/portal/state', {
            method: 'POST',
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
}

function queuePortalStateSync(reason = 'saveState') {
    const runtime = ensurePortalBackendRuntime();
    runtime.lastSyncReason = reason;
    if (runtime.syncTimer) clearTimeout(runtime.syncTimer);
    runtime.syncTimer = setTimeout(() => {
        runtime.syncTimer = null;
        persistPortalStateToBackend(runtime.lastSyncReason || 'saveState');
    }, 180);
}

async function bootstrapPortalBackendState(force = false) {
    const runtime = ensurePortalBackendRuntime();
    if (runtime.bootstrapPromise && !force) return runtime.bootstrapPromise;
    runtime.bootstrapPromise = (async () => {
        const token = getPortalSessionToken();
        if (!token) {
            runtime.online = false;
            return null;
        }
        await fetchPortalPlatformConfig(force).catch(() => null);
        const payload = await kiuPortalFetch('/api/bootstrap');
        if (token && (!payload?.session || !payload?.account)) {
            handleKiuUnauthorizedSession({
                redirect: true,
                message: 'Your saved session is no longer valid. Sign in again to continue.'
            });
            return null;
        }
        runtime.online = true;

        if (payload?.session?.token) setPortalSessionToken(payload.session.token);
        if (payload?.account && payload?.session) {
            const account = payload.account;
            const effectiveRole = account.role === USER_ROLES.ADMIN
                ? (payload.session.impersonatedRole || account.role)
                : account.role;
            storePortalBackendAuth(account, payload.session);
            currentUserRole = effectiveRole;
        }
        setPortalMailSummary(payload?.mailSummary || null);

        if (payload?.state) {
            applyPortalBootstrapState(payload.state, { render: true });
        } else if (typeof KIU_STATE !== 'undefined' && KIU_STATE) {
            queuePortalStateSync('initial-bootstrap');
        }
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
        runtime.bootstrapPromise = null;
    });
    return runtime.bootstrapPromise;
}

function schedulePortalBackendBootstrap(force = false) {
    if (!getPortalSessionToken()) return;
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
