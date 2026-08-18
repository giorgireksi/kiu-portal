const LOGIN_PORTAL_BACKEND_URL_KEY = 'KIU_PORTAL_BACKEND_URL';
const LOGIN_PORTAL_LOCAL_BACKEND_HOST = '127.0.0.1';
const LOGIN_PORTAL_BACKEND_PORT = '48933';
const LOGIN_PORTAL_SESSION_TOKEN_KEY = 'KIU_PORTAL_SESSION_TOKEN';
const LOGIN_PENDING_ROLE_SWITCH_KEY = 'KIU_PENDING_ROLE_SWITCH_ROLE';
const LOGIN_ACTIVE_SESSION_KEY = 'KIU_ACTIVE_SESSION_USER_ID';
const LOGIN_ACTIVE_ROLE_IMPERSONATION_KEY = 'KIU_ACTIVE_ROLE_IMPERSONATION';
const LOGIN_PORTAL_BACKEND_TIMEOUT_MS = 4000;
let loginRequestInFlight = false;
function scheduleLoginServiceWorkerUpdate() {
    const register = () => {
        try {
            if (!('serviceWorker' in navigator) || !/^https?:$/i.test(window.location?.protocol || '')) {
                return Promise.resolve(null);
            }
            return navigator.serviceWorker.register('/service-worker.js?v=20260820-globalpaint1', { scope: '/' }).catch(() => null);
        } catch (error) {
            return Promise.resolve(null);
        }
    };

    if (typeof window.requestIdleCallback === 'function') {
        return new Promise((resolve) => {
            window.requestIdleCallback(() => resolve(register()), { timeout: 3000 });
        });
    }
    return new Promise((resolve) => {
        window.setTimeout(() => resolve(register()), 1500);
    });
}

const LOGIN_SERVICE_WORKER_UPDATE = scheduleLoginServiceWorkerUpdate();

function getKiuPortalBackendDefaultUrl() {
    try {
        if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
            const host = window.location.hostname || LOGIN_PORTAL_LOCAL_BACKEND_HOST;
            const isLocalHost = /^(127\.0\.0\.1|localhost)$/i.test(host);
            if (isLocalHost) {
                return window.location.origin;
            }
            return window.location.origin;
        }
    } catch (error) {}
    return `http://${LOGIN_PORTAL_LOCAL_BACKEND_HOST}:${LOGIN_PORTAL_BACKEND_PORT}`;
}

function getKiuPortalBackendUrl() {
    try {
        return String(localStorage.getItem(LOGIN_PORTAL_BACKEND_URL_KEY) || getKiuPortalBackendDefaultUrl()).replace(/\/$/, '');
    } catch (error) {
        return getKiuPortalBackendDefaultUrl();
    }
}

function getPortalSessionToken() {
    try {
        return String(sessionStorage.getItem('KIU_TAB_PORTAL_SESSION_TOKEN') || '').trim();
    } catch (error) {
        return '';
    }
}

function setPortalSessionToken(token) {
    try {
        if (token) sessionStorage.setItem('KIU_TAB_PORTAL_SESSION_TOKEN', String(token));
        else sessionStorage.removeItem('KIU_TAB_PORTAL_SESSION_TOKEN');
    } catch (error) {}
}

function getStoredAuthState() {
    let parsedState = null;
    try {
        parsedState = JSON.parse(sessionStorage.getItem('KIU_TAB_AUTH_STATE') || localStorage.getItem('KIU_AUTH_STATE') || 'null');
    } catch (error) {
        parsedState = null;
    }
    const normalizedState = {
        id: String(parsedState?.id || '').trim(),
        name: String(parsedState?.name || '').trim(),
        nameEn: String(parsedState?.nameEn || parsedState?.name || '').trim(),
        avatar: String(parsedState?.avatar || '').trim(),
        email: String(parsedState?.email || '').trim(),
        role: String(parsedState?.role || '').trim().toLowerCase(),
        faculty: String(parsedState?.faculty || parsedState?.facultyCode || '').trim()
    };
    if (!normalizedState.id || !normalizedState.role) return null;
    return normalizedState;
}

function clearStaleLoginSnapshot() {
    try { sessionStorage.removeItem('KIU_TAB_AUTH_STATE'); } catch (error) {}
    try { sessionStorage.removeItem('KIU_TAB_PORTAL_SESSION_TOKEN'); } catch (error) {}
    try { sessionStorage.removeItem('KIU_TAB_CURRENT_ROLE'); } catch (error) {}
    try { sessionStorage.removeItem('KIU_TAB_CURRENT_FACULTY'); } catch (error) {}
    try { sessionStorage.removeItem(LOGIN_ACTIVE_SESSION_KEY); } catch (error) {}
    try { sessionStorage.removeItem(LOGIN_ACTIVE_ROLE_IMPERSONATION_KEY); } catch (error) {}
    try { localStorage.removeItem('KIU_AUTH_STATE'); } catch (error) {}
    try { localStorage.removeItem(LOGIN_PORTAL_SESSION_TOKEN_KEY); } catch (error) {}
    try { sessionStorage.removeItem(LOGIN_ACTIVE_ROLE_IMPERSONATION_KEY); } catch (error) {}
}

function getPortalRoleLanding(role = 'student') {
    return String(role || '').trim().toLowerCase() === 'admin' ? 'students-admin.html' : 'index.html';
}

function getPendingProtectedQuizPopupReturnTo() {
    try {
        return String(sessionStorage.getItem('KIU_PENDING_PROTECTED_QUIZ_POPUP_RETURN_TO') || '').trim();
    } catch (error) {
        return '';
    }
}

function hasPendingProtectedQuizLaunch() {
    try {
        return Boolean(sessionStorage.getItem('KIU_PENDING_PROTECTED_QUIZ_LAUNCH'));
    } catch (error) {
        return false;
    }
}

function getProtectedQuizLoginNote() {
    try {
        return String(
            sessionStorage.getItem('KIU_PENDING_PROTECTED_QUIZ_POPUP_REASON')
            || sessionStorage.getItem('LMS_PENDING_PROTECTED_QUIZ_LAUNCH_REASON')
            || ''
        ).trim();
    } catch (error) {
        return '';
    }
}

function getLoginRedirectTarget(defaultTarget = 'index.html') {
    const popupReturnTo = getPendingProtectedQuizPopupReturnTo();
    if (popupReturnTo) return popupReturnTo;
    return hasPendingProtectedQuizLaunch() ? 'lms.html' : defaultTarget;
}

function getLoginRoleDefaultTarget(role = 'student') {
    return getPortalRoleLanding(role);
}

async function kiuPortalFetch(path, options = {}) {
    // Service-worker registration is a background cache/update task, not a
    // prerequisite for same-origin login/API requests. Do not put it on the
    // first interaction critical path; the registration started above can
    // finish independently while this request proceeds.
    void LOGIN_SERVICE_WORKER_UPDATE;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeoutHandle = controller
        ? setTimeout(() => controller.abort(), LOGIN_PORTAL_BACKEND_TIMEOUT_MS)
        : null;
    try {
        let response = null;
        let lastFetchError = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                response = await fetch(`${getKiuPortalBackendUrl()}${path}`, {
                    method: options.method || 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options.headers || {})
                    },
                    body: options.body,
                    cache: 'no-store',
                    signal: controller ? controller.signal : undefined
                });
                if (response.ok || attempt === 1 || response.status < 500) break;
            } catch (error) {
                lastFetchError = error;
                if (attempt === 1 || error?.name === 'AbortError') throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 200));
        }
        if (!response && lastFetchError) throw lastFetchError;
        let payload = null;
        try {
            payload = await response.json();
        } catch (error) {
            payload = null;
        }
        if (!response.ok) {
            const failure = new Error(payload?.error || payload?.message || `Portal backend request failed (${response.status}).`);
            failure.status = response.status;
            throw failure;
        }
        return payload;
    } catch (error) {
        if (error?.name === 'AbortError') {
            throw new Error('Portal backend timed out. Start the backend service and try again.');
        }
        if (String(error?.message || '').trim().toLowerCase() === 'failed to fetch') {
            throw new Error(`Portal backend is unavailable at ${getKiuPortalBackendUrl()}. Start the backend service and try again.`);
        }
        throw error;
    } finally {
        if (timeoutHandle) clearTimeout(timeoutHandle);
    }
}

function storePortalBackendAuth(account, session) {
    if (!account || !session) return null;
    const actualRole = String(account.role || 'student').trim().toLowerCase();
    const effectiveRole = actualRole === 'admin'
        ? String(session.impersonatedRole || actualRole).trim().toLowerCase()
        : actualRole;
    const normalizedAuth = {
        id: String(account.id || '').trim(),
        name: String(account.name || '').trim(),
        nameEn: String(account.nameEn || account.name || '').trim(),
        avatar: String(account.avatar || account.photo || '').trim(),
        email: String(account.email || account.microsoftEmail || '').trim(),
        role: actualRole,
        faculty: String(account.facultyCode || account.faculty || '').trim()
    };
    try { sessionStorage.setItem('KIU_TAB_AUTH_STATE', JSON.stringify(normalizedAuth)); } catch (error) {}
    try { sessionStorage.setItem('KIU_TAB_CURRENT_ROLE', effectiveRole || actualRole); } catch (error) {}
    try {
        if (actualRole === 'admin' && effectiveRole && effectiveRole !== actualRole) {
            sessionStorage.setItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE', effectiveRole);
            sessionStorage.setItem(LOGIN_ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        } else {
            sessionStorage.removeItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE');
            sessionStorage.removeItem(LOGIN_ACTIVE_ROLE_IMPERSONATION_KEY);
        }
    } catch (error) {}
    setPortalSessionToken(session.token || getPortalSessionToken());
    if (normalizedAuth.faculty) {
        try { sessionStorage.setItem('KIU_TAB_CURRENT_FACULTY', normalizedAuth.faculty); } catch (error) {}
    }
    try {
        sessionStorage.setItem(LOGIN_ACTIVE_SESSION_KEY, normalizedAuth.id);
    } catch (error) {}
    try {
        const stateKey = `KIU_PERSISTENT_STATE::${normalizedAuth.id}`;
        let persistedState = JSON.parse(localStorage.getItem(stateKey) || localStorage.getItem('KIU_PERSISTENT_STATE') || 'null') || {};
        const priorOwnerAccountId = String(
            persistedState?.meta?.portalStateOwnerAccountId || persistedState?.auth?.activeUserId || ''
        ).trim();
        const nextOwnerAccountId = String(normalizedAuth.id || '').trim();
        if (priorOwnerAccountId && nextOwnerAccountId && priorOwnerAccountId !== nextOwnerAccountId) {
            persistedState = {};
        }
        persistedState.meta = persistedState.meta && typeof persistedState.meta === 'object' ? persistedState.meta : {};
        persistedState.meta.portalStateOwnerAccountId = nextOwnerAccountId;
        delete persistedState.auth;
        localStorage.setItem(stateKey, JSON.stringify(persistedState));
    } catch (error) {}
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
        if (error?.status === 401 || error?.status === 404) {
            setPortalSessionToken('');
            return null;
        }
        throw error;
    }
}

async function fetchPortalMicrosoftConfig() {
    try {
        return await kiuPortalFetch('/api/portal/microsoft/config');
    } catch (error) {
        return {
            enabled: false,
            error: error.message || 'Microsoft sign-in is unavailable.'
        };
    }
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
        ['microsoft_status', 'microsoft_handoff', 'portal_token', 'microsoft_email', 'microsoft_error'].forEach((key) => currentUrl.searchParams.delete(key));
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
    return {
        success: true,
        status: 'success',
        session: payload.session,
        account: payload.account
    };
}

async function authLogin(email, password) {
    try {
        const payload = await createPortalBackendSession(email, password);
        if (!payload?.session || !payload?.account) {
            return {
                success: false,
                error: 'Account not found. Please check your email.'
            };
        }
        const user = {
            ...payload.account,
            avatar: payload.account.avatar || payload.account.photo || ''
        };
        if (user.activationRequired || user.accountStatus === 'pending-activation') {
            return {
                success: false,
                error: 'This account is created but not activated yet. Use Activate Account with the registration ID first.'
            };
        }
        storePortalBackendAuth(user, payload.session);
        return { success: true, redirect: getPortalRoleLanding(user.role) };
    } catch (error) {
        return {
            success: false,
            error: error.message || 'The KIU platform backend is required for login now. Start the backend service and try again.'
        };
    }
}

async function authActivate(id, activationToken, newPassword) {
    try {
        const payload = await kiuPortalFetch('/api/auth/activate', {
            method: 'POST',
            body: JSON.stringify({
                id,
                activationToken,
                password: newPassword
            })
        });
        const user = payload?.account || payload?.user || null;
        if (!user) {
            return { success: false, error: 'Could not activate account. Contact support.' };
        }
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message || 'Could not activate account. Contact support.' };
    }
}

window.fetchPortalMicrosoftConfig = window.fetchPortalMicrosoftConfig || fetchPortalMicrosoftConfig;
window.beginMicrosoftPortalLogin = window.beginMicrosoftPortalLogin || beginMicrosoftPortalLogin;
window.completeMicrosoftPortalLoginFromUrl = window.completeMicrosoftPortalLoginFromUrl || completeMicrosoftPortalLoginFromUrl;
window.fetchPortalBackendSession = window.fetchPortalBackendSession || fetchPortalBackendSession;
window.getStoredAuthState = window.getStoredAuthState || getStoredAuthState;
window.authLogin = window.authLogin || authLogin;
window.authActivate = window.authActivate || authActivate;
window.getPortalRoleLanding = window.getPortalRoleLanding || getPortalRoleLanding;

function switchTab(tab) {
    document.querySelectorAll('.login-tab').forEach((node) => {
        node.classList.remove('active');
        node.setAttribute('aria-pressed', 'false');
    });
    document.querySelectorAll('.tab-content').forEach((node) => {
        node.classList.remove('active');
        node.hidden = true;
    });
    document.getElementById('error-msg').textContent = '';
    document.getElementById('success-msg').textContent = '';

    if (tab === 'login') {
        document.querySelectorAll('.login-tab')[0].classList.add('active');
        document.querySelectorAll('.login-tab')[0].setAttribute('aria-pressed', 'true');
        document.getElementById('form-login').classList.add('active');
        document.getElementById('form-login').hidden = false;
        document.querySelector('.login-title').textContent = 'Welcome back';
        document.querySelector('.login-subtitle').textContent = 'Sign in to access your KIU Portal';
        return;
    }

    document.querySelectorAll('.login-tab')[1].classList.add('active');
    document.querySelectorAll('.login-tab')[1].setAttribute('aria-pressed', 'true');
    document.getElementById('form-activate').classList.add('active');
    document.getElementById('form-activate').hidden = false;
    document.querySelector('.login-title').textContent = 'Account Setup';
    document.querySelector('.login-subtitle').textContent = 'Activate your pre-registered KIU account';
}

function showError(message) {
    document.getElementById('success-msg').textContent = '';
    document.getElementById('error-msg').textContent = message;
}

function showSuccess(message) {
    document.getElementById('error-msg').textContent = '';
    document.getElementById('success-msg').textContent = message;
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

function togglePwd(id, button) {
    const input = document.getElementById(id);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    const icon = button?.querySelector('i');
    if (icon) {
        icon.className = show ? 'far fa-eye-slash' : 'far fa-eye';
    }
}

async function refreshMicrosoftLoginState() {
    const button = document.getElementById('microsoft-login-btn');
    const note = document.getElementById('microsoft-login-note');
    const fetchConfig = typeof window.fetchPortalMicrosoftConfig === 'function'
        ? window.fetchPortalMicrosoftConfig
        : fetchPortalMicrosoftConfig;
    if (!button || !note || typeof fetchConfig !== 'function') return;
    let config = null;
    try {
        config = await fetchConfig();
    } catch (error) {
        button.disabled = true;
        button.classList.add('is-disabled');
        note.textContent = error?.message || 'Portal backend is unavailable. Start the backend service and refresh the page.';
        showError(note.textContent);
        return;
    }
    if (!config?.enabled) {
        button.disabled = true;
        button.classList.add('is-disabled');
        note.textContent = config?.error || 'Microsoft sign-in is not configured on the portal backend yet.';
        return;
    }
    button.disabled = false;
    button.classList.remove('is-disabled');
    note.textContent = 'Use your university Microsoft account to load your linked KIU portal profile and permissions.';
}

async function handleMicrosoftLogin() {
    const beginLogin = typeof window.beginMicrosoftPortalLogin === 'function'
        ? window.beginMicrosoftPortalLogin
        : beginMicrosoftPortalLogin;
    try {
        if (typeof beginLogin !== 'function') {
            showError('Microsoft sign-in helper is not loaded.');
            return;
        }
        showSuccess('Redirecting to Microsoft sign-in...');
        await beginLogin(new URL('login.html', window.location.href).toString());
    } catch (error) {
        showError(error.message || 'Microsoft sign-in could not be started.');
    }
}

async function handleLogin() {
    if (loginRequestInFlight) return;
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const runAuthLogin = typeof window.authLogin === 'function' ? window.authLogin : authLogin;
    if (!email || !password) {
        showError('Please fill in all fields.');
        return;
    }

    const button = document.querySelector('#form-login .login-btn:last-of-type');
    if (button) {
        button.classList.add('is-loading');
        button.innerHTML = 'Signing in...';
    }

    loginRequestInFlight = true;
    let result;
    try {
        result = await runAuthLogin(email, password);
    } finally {
        loginRequestInFlight = false;
    }
    if (result?.success) {
        if (button) button.innerHTML = '<i class="fas fa-check"></i> Success!';
        window.location.href = getLoginRedirectTarget(result.redirect || 'index.html');
        return;
    }

    if (button) {
        button.classList.remove('is-loading');
        button.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
    showError(result?.error || 'Sign in failed.');
}

async function handleActivate() {
    const id = document.getElementById('act-id').value.trim();
    const activationToken = document.getElementById('act-token').value.trim();
    const password = document.getElementById('act-password').value;
    const runActivate = typeof window.authActivate === 'function' ? window.authActivate : authActivate;
    const runAuthLogin = typeof window.authLogin === 'function' ? window.authLogin : authLogin;
    if (!id || !activationToken || !password) {
        showError('Please fill in all fields.');
        return;
    }
    if (password.length < 8) {
        showError('Password must be at least 8 characters.');
        return;
    }

    const result = await runActivate(id, activationToken, password);
    if (result?.success) {
        const user = result.user || {};
        const loginResult = await runAuthLogin(user.email, password);
        if (loginResult?.success) {
            window.location.href = getLoginRedirectTarget(loginResult.redirect || 'index.html');
            return;
        }
        showError(loginResult?.error || 'The account was activated, but automatic sign-in failed.');
        return;
    }
    showError(result?.error || 'Could not activate account. Contact support.');
}

function bindLoginInteractions() {
    document.addEventListener('click', (event) => {
        const tabNode = event.target.closest('[data-login-tab]');
        if (tabNode) {
            event.preventDefault();
            switchTab(tabNode.dataset.loginTab || 'login');
            return;
        }

        const actionNode = event.target.closest('[data-login-action]');
        if (!actionNode) return;
        event.preventDefault();

        const action = actionNode.dataset.loginAction || '';
        if (action === 'toggle-password') {
            togglePwd(actionNode.dataset.loginTarget || '', actionNode);
            return;
        }
        if (action === 'microsoft-login') {
            handleMicrosoftLogin();
            return;
        }
        if (action === 'login-submit') {
            handleLogin();
            return;
        }
        if (action === 'activate-submit') {
            handleActivate();
        }
    });

    document.addEventListener('keypress', (event) => {
        if (event.key !== 'Enter') return;
        if (document.getElementById('form-login').classList.contains('active')) {
            handleLogin();
            return;
        }
        handleActivate();
    });
}

async function restoreExistingPortalSession() {
    const existingAuth = getStoredAuthState();
    const token = getPortalSessionToken();
    if (!token) {
        if (existingAuth) clearStaleLoginSnapshot();
        return null;
    }

    try {
        const loadSession = typeof window.fetchPortalBackendSession === 'function'
            ? window.fetchPortalBackendSession
            : fetchPortalBackendSession;
        const payload = await loadSession(token);
        if (payload?.session && payload?.account) {
            storePortalBackendAuth(payload.account, payload.session);
            return {
                success: true,
                account: payload.account,
                session: payload.session
            };
        }
    } catch (error) {}

    clearStaleLoginSnapshot();
    return existingAuth
        ? { success: false, expired: true }
        : { success: false, expired: false };
}

async function bootstrapLoginPage() {
    bindLoginInteractions();

    const completeMicrosoftLogin = typeof window.completeMicrosoftPortalLoginFromUrl === 'function'
        ? window.completeMicrosoftPortalLoginFromUrl
        : completeMicrosoftPortalLoginFromUrl;
    if (typeof completeMicrosoftLogin === 'function') {
        const microsoftResult = await completeMicrosoftLogin();
        if (microsoftResult?.success) {
            const defaultTarget = getLoginRoleDefaultTarget(microsoftResult.account?.role || 'student');
            window.location.href = getLoginRedirectTarget(defaultTarget);
            return;
        }
        if (microsoftResult?.error) {
            showError(microsoftResult.error);
        }
    }

    const existingSession = await restoreExistingPortalSession();
    if (existingSession?.success) {
        const defaultTarget = getLoginRoleDefaultTarget(existingSession.account?.role || 'student');
        window.location.href = getLoginRedirectTarget(defaultTarget);
        return;
    }
    if (existingSession?.expired) {
        showError('Your previous session expired. Sign in again to continue.');
    }

    await refreshMicrosoftLoginState();

    const protectedQuizNote = document.getElementById('protected-quiz-note');
    const protectedQuizReason = getProtectedQuizLoginNote();
    if (protectedQuizNote && (hasPendingProtectedQuizLaunch() || getPendingProtectedQuizPopupReturnTo())) {
        protectedQuizNote.style.display = 'block';
        protectedQuizNote.innerHTML = `
            <strong>Protected Quiz Resume Pending</strong>
            ${protectedQuizReason ? escapeHtml(protectedQuizReason) : 'Sign in again, then the LMS will reopen and continue the protected quiz launch automatically.'}
        `;
    }
}

bootstrapLoginPage();
