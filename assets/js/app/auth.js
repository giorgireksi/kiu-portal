/* Authentication and session helpers extracted from the legacy core.js bundle. Active routes now load split files directly. */

// AUTHENTICATION LOGIC
const KIU_REALTIME_BRIDGE_TIMEOUT_MS = 4000;
const KIU_REALTIME_BRIDGE_COOLDOWN_MS = 5000;
let kiuAuthRestoreInFlight = null;

function getStoredAuthState() {
    const rawState = localStorage.getItem('KIU_AUTH_STATE');
    if (!rawState) return null;

    let parsedState = null;
    try {
        parsedState = JSON.parse(rawState);
    } catch (e) {
        console.error('Failed to parse stored auth state', e);
        localStorage.removeItem('KIU_AUTH_STATE');
        return null;
    }

    let persistedAuthState = null;
    try {
        persistedAuthState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
    } catch (e) {
        persistedAuthState = null;
    }

    const fallbackUserId = parsedState?.id
        || sessionStorage.getItem(ACTIVE_SESSION_KEY)
        || persistedAuthState?.auth?.activeUserId
        || '';
    const fallbackUser = fallbackUserId
        ? (_findUserById(fallbackUserId)?.user || null)
        : (parsedState?.email ? _findUserByEmail(parsedState.email) : null);

    const normalizedState = {
        id: String(parsedState?.id || fallbackUser?.id || '').trim(),
        name: String(parsedState?.name || fallbackUser?.name || fallbackUser?.nameEn || '').trim(),
        nameEn: String(parsedState?.nameEn || fallbackUser?.nameEn || fallbackUser?.name || '').trim(),
        avatar: String(parsedState?.avatar || fallbackUser?.avatar || fallbackUser?.photo || '').trim(),
        email: String(parsedState?.email || fallbackUser?.email || '').trim(),
        role: String(parsedState?.role || fallbackUser?.role || '').trim().toLowerCase(),
        faculty: String(
            parsedState?.faculty
            || parsedState?.facultyCode
            || fallbackUser?.faculty
            || fallbackUser?.facultyCode
            || ''
        ).trim()
    };

    if (!normalizedState.id || !normalizedState.role) {
        localStorage.removeItem('KIU_AUTH_STATE');
        return null;
    }

    localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(normalizedState));
    return normalizedState;
}

function loadAuthState() {
    const state = getStoredAuthState();
    if (state) {
        try {
            // Always trust localStorage auth state on load.
            // If no backend session token exists, skip backend bootstrap
            // but still load the user. Backend 401s are handled by kiuPortalFetch.
            const hasSessionToken = typeof getPortalSessionToken === 'function' && !!getPortalSessionToken();
            currentUser = state;
            const pendingRoleTarget = (() => {
                try {
                    const nextRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
                    return currentUser?.role === USER_ROLES.ADMIN && Object.values(USER_ROLES).includes(nextRole)
                        ? nextRole
                        : '';
                } catch (error) {
                    return '';
                }
            })();
            const storedImpersonatedRole = (() => {
                try {
                    return pendingRoleTarget || localStorage.getItem('currentUserRole');
                } catch (e) {
                    return null;
                }
            })();
            const isAdminAccount = currentUser.role === USER_ROLES.ADMIN;
            if (!isAdminAccount) {
                try {
                    const pendingRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
                    if (pendingRole && pendingRole !== currentUser.role) {
                        localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
                    }
                    sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
                    currentUserRole = currentUser.role;
                    localStorage.setItem('currentUserRole', currentUser.role);
                } catch (storageError) {
                    console.warn('Could not clear stale impersonation keys for faculty account.', storageError);
                }
            }
            const normalizedStoredRole = String(storedImpersonatedRole || '').trim().toLowerCase();
            const hasStoredImpersonatedRole = isAdminAccount
                && Object.values(USER_ROLES).includes(normalizedStoredRole);
            const impersonationEnabled = hasStoredImpersonatedRole && normalizedStoredRole !== currentUser.role;
            if (impersonationEnabled) {
                sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
                currentUserRole = normalizedStoredRole;
                try {
                    localStorage.setItem('currentUserRole', normalizedStoredRole);
                } catch (storageError) {
                    console.warn('Could not persist impersonated role for authenticated account.', storageError);
                }
            } else {
                const pendingWorkspaceRole = (() => {
                    try {
                        const pendingRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
                        return isAdminAccount
                            && Object.values(USER_ROLES).includes(pendingRole)
                            && pendingRole !== USER_ROLES.ADMIN
                            ? pendingRole
                            : '';
                    } catch (error) {
                        return '';
                    }
                })();
                if (pendingWorkspaceRole) {
                    sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
                    currentUserRole = pendingWorkspaceRole;
                    try {
                        localStorage.setItem('currentUserRole', pendingWorkspaceRole);
                    } catch (storageError) {
                        console.warn('Could not persist pending workspace role for authenticated account.', storageError);
                    }
                } else {
                    sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
                    currentUserRole = currentUser.role;
                    try {
                        localStorage.setItem('currentUserRole', currentUser.role);
                    } catch (storageError) {
                        console.warn('Could not normalize stored role for authenticated account.', storageError);
                    }
                }
            }
            if (currentUser?.id && currentUser.role !== USER_ROLES.ADMIN && !impersonationEnabled) {
                sessionStorage.setItem(ACTIVE_SESSION_KEY, currentUser.id);
            }
            if (impersonationEnabled && typeof setActiveSessionUserByRole === 'function') {
                setActiveSessionUserByRole(currentUserRole);
            }
            syncAuthenticatedSessionState();
            if (impersonationEnabled) {
                if (typeof invalidatePageAccessCache === 'function') invalidatePageAccessCache();
                if (typeof renderNav === 'function') renderNav();
                if (typeof syncShellNavVisibility === 'function') {
                    const activePageId = typeof getActivePageId === 'function' ? getActivePageId() : 'home';
                    syncShellNavVisibility(activePageId);
                }
            }
            if (hasSessionToken) {
                if (typeof schedulePortalBackendBootstrap === 'function') schedulePortalBackendBootstrap();
                else scheduleKiuRealtimeBootstrap();
            }
        } catch (e) {
            console.error("Failed to restore auth state", e);
            currentUser = state;
            try {
                const hasSessionToken = typeof getPortalSessionToken === 'function' && !!getPortalSessionToken();
                const pendingRoleTarget = (() => {
                    try {
                        const nextRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
                        return currentUser?.role === USER_ROLES.ADMIN && Object.values(USER_ROLES).includes(nextRole)
                            ? nextRole
                            : '';
                    } catch (error) {
                        return '';
                    }
                })();
                const storedImpersonatedRole = pendingRoleTarget || localStorage.getItem('currentUserRole');
                const isAdminAccount = currentUser?.role === USER_ROLES.ADMIN;
                const hasStoredImpersonatedRole = isAdminAccount && Object.values(USER_ROLES).includes(storedImpersonatedRole);
                const impersonationEnabled = hasStoredImpersonatedRole && storedImpersonatedRole !== currentUser?.role;
                if (impersonationEnabled) {
                    sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
                    currentUserRole = storedImpersonatedRole;
                } else if (currentUser?.role) {
                    sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
                    currentUserRole = currentUser.role;
                    try {
                        localStorage.setItem('currentUserRole', currentUser.role);
                    } catch (storageError) {
                        console.warn('Could not normalize stored role after restore error.', storageError);
                    }
                }
                if (currentUser?.id && currentUser.role !== USER_ROLES.ADMIN && !impersonationEnabled) {
                    sessionStorage.setItem(ACTIVE_SESSION_KEY, currentUser.id);
                }
                if (impersonationEnabled && typeof setActiveSessionUserByRole === 'function') {
                    setActiveSessionUserByRole(currentUserRole);
                }
                if (impersonationEnabled) {
                    if (typeof invalidatePageAccessCache === 'function') invalidatePageAccessCache();
                    if (typeof renderNav === 'function') renderNav();
                    if (typeof syncShellNavVisibility === 'function') {
                        const activePageId = typeof getActivePageId === 'function' ? getActivePageId() : 'home';
                        syncShellNavVisibility(activePageId);
                    }
                }
                if (hasSessionToken) {
                    if (typeof schedulePortalBackendBootstrap === 'function') schedulePortalBackendBootstrap();
                    else scheduleKiuRealtimeBootstrap();
                }
            } catch (restoreError) {
                console.warn('Could not preserve auth session after restore error.', restoreError);
            }
        }
    }
}

function hasCorruptedAdminImpersonationSnapshot() {
    try {
        const pendingRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
        const hasPendingImpersonatedRole = Boolean(pendingRole) && pendingRole !== USER_ROLES.ADMIN && Object.values(USER_ROLES).includes(pendingRole);
        const hasImpersonationFlag = sessionStorage.getItem(ACTIVE_ROLE_IMPERSONATION_KEY) === '1';
        return currentUser?.role !== USER_ROLES.ADMIN && (hasPendingImpersonatedRole || hasImpersonationFlag);
    } catch (error) {
        return false;
    }
}

function requireAuth() {
    const currentPath = (window.location.pathname || '').replace(/\\/g, '/').toLowerCase();
    const isLoginPage = currentPath.endsWith('login.html') || currentPath.endsWith('login');
    if (!currentUser) {
        loadAuthState();
    }
    const hasSessionToken = typeof getPortalSessionToken === 'function' && Boolean(getPortalSessionToken());
    if (currentUser && !isLoginPage && hasSessionToken && hasCorruptedAdminImpersonationSnapshot()
        && typeof fetchPortalBackendSession === 'function' && typeof storePortalBackendAuth === 'function') {
        if (!kiuAuthRestoreInFlight) {
            kiuAuthRestoreInFlight = fetchPortalBackendSession()
                .then((payload) => {
                    if (payload?.account && payload?.session) {
                        storePortalBackendAuth(payload.account, payload.session);
                        loadAuthState();
                        if (typeof schedulePortalBackendBootstrap === 'function') {
                            schedulePortalBackendBootstrap(true);
                        }
                        return true;
                    }
                    return false;
                })
                .catch(() => false)
                .finally(() => {
                    kiuAuthRestoreInFlight = null;
                });
        }
        return;
    }
    if (!currentUser && !isLoginPage) {
        if (hasSessionToken && typeof fetchPortalBackendSession === 'function' && typeof storePortalBackendAuth === 'function') {
            if (!kiuAuthRestoreInFlight) {
                kiuAuthRestoreInFlight = fetchPortalBackendSession()
                    .then((payload) => {
                        if (payload?.account && payload?.session) {
                            storePortalBackendAuth(payload.account, payload.session);
                            loadAuthState();
                            if (typeof schedulePortalBackendBootstrap === 'function') {
                                schedulePortalBackendBootstrap(true);
                            }
                            return true;
                        }
                        return false;
                    })
                    .catch(() => false)
                    .then((restored) => {
                        if (!restored && !currentUser && !isLoginPage) {
                            localStorage.removeItem('KIU_AUTH_STATE');
                            window.location.href = 'login.html';
                        }
                    })
                    .finally(() => {
                        kiuAuthRestoreInFlight = null;
                    });
            }
            return;
        }
    }
    if (!currentUser && !isLoginPage) {
        localStorage.removeItem('KIU_AUTH_STATE');
        window.location.href = 'login.html';
        return;
    }
    
    // Auto-update header UI on protected pages if user is logged in
    const activeShellUser = (typeof getCurrentUser === 'function' ? getCurrentUser() : null) || currentUser;
    if (activeShellUser && document.querySelector('.header-right .user-name')) {
        document.querySelector('.header-right .user-name').textContent = toEnglishText(activeShellUser.nameEn || activeShellUser.name || 'User');
        const roleText = activeShellUser.role === 'student' ? 'Student' : 
                         activeShellUser.role === 'professor' ? 'Professor' :
                         activeShellUser.role === 'ta' ? 'Teaching Assistant' :
                         activeShellUser.role === 'student_service' ? 'Student Service' : 'Admin';
        document.querySelector('.header-right .user-role').textContent = roleText;
        
        const switcher = document.querySelector('.role-switcher');
        if (switcher) {
            switcher.style.display = activeShellUser.role === USER_ROLES.ADMIN ? 'flex' : 'none';
        }
    }
    if (typeof renderPortalNotificationChrome === 'function') {
        setTimeout(() => renderPortalNotificationChrome(), 0);
    }
}

async function authLogout() {
    const userBeforeLogout = currentUser ? { ...currentUser } : null;
    const realtimeRuntime = ensureKiuRealtimeRuntime();
    if (realtimeRuntime.eventSource) {
        try { realtimeRuntime.eventSource.close(); } catch (e) {}
        realtimeRuntime.eventSource = null;
        realtimeRuntime.bootstrappedFor = '';
    }
    const activeSessionToken = typeof getPortalSessionToken === 'function' ? getPortalSessionToken() : '';
    if (typeof clearPortalClientAuthState === 'function') {
        clearPortalClientAuthState({ preserveFaculty: false, clearPersistentState: true });
    } else {
        localStorage.removeItem('KIU_AUTH_STATE');
        localStorage.removeItem('KIU_FACULTY_CONTEXT');
        localStorage.removeItem('currentUserRole');
        sessionStorage.removeItem(ACTIVE_SESSION_KEY);
        sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        if (KIU_STATE && KIU_STATE.auth) {
            delete KIU_STATE.auth.activeUserId;
        }
    }
    await destroyPortalBackendSession(activeSessionToken);
    if (typeof window.clearPortalSiteCaches === 'function') {
        await window.clearPortalSiteCaches(true).catch(() => false);
    }
    if (userBeforeLogout && typeof createPortalAuditEvent === 'function') {
        createPortalAuditEvent({
            actorUserId: userBeforeLogout.id,
            actorRole: userBeforeLogout.role,
            eventDomain: 'auth',
            eventType: 'logout',
            entityType: 'session',
            entityId: userBeforeLogout.id,
            sourceSystem: 'portal'
        }).catch(() => {});
    }
    window.location.replace('login.html');
}

function handleLogout() {
    authLogout().catch(() => {
        window.location.replace('login.html');
    });
}

function _findUserByEmail(email) {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE')); } catch(e){}
    if (!state) state = KIU_EMPTY_STATE;

    const allUsers = getAllAuthUsersFromState(state);
    return allUsers.find(m => m.email && m.email.toLowerCase() === email.toLowerCase()) || null;
}

function _findUserById(id) {
    let state = null;
    try { state = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE')); } catch(e){}
    if (!state) state = KIU_EMPTY_STATE;

    const found = getAllAuthUsersFromState(state).find(m => String(m.id) === String(id));
    return found ? { user: found, stateObj: state } : null;
}

function getInitialsAvatar(name) {
    const parts = String(name || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
    if (!parts.length) return 'KIU';
    return parts.map(part => part.charAt(0).toUpperCase()).join('');
}

function generateInitialPassword(id) {
    const suffix = String(Math.floor(1000 + Math.random() * 9000));
    const idTail = String(id || '').slice(-3) || 'KIU';
    return `KIU${idTail}!${suffix}`;
}

function applyUserRecordUpdate(state, userId, updater) {
    if (!state || !userId || typeof updater !== 'function') return false;
    let changed = false;

    if (Array.isArray(state.users)) {
        state.users.forEach(user => {
            if (String(user?.id) === String(userId)) {
                updater(user);
                changed = true;
            }
        });
    }

    Object.values(state.facultyProfiles || {}).forEach(profile => {
        ['students', 'professors', 'tas'].forEach(groupKey => {
            (profile?.[groupKey] || []).forEach(member => {
                if (String(member?.id) === String(userId)) {
                    updater(member);
                    changed = true;
                }
            });
        });
    });

    return changed;
}

function buildProvisioningMeta(id) {
    const initialPassword = generateInitialPassword(id);
    return {
        activationRequired: false,
        activationCode: '',
        accountStatus: 'active-temp-password',
        password: initialPassword,
        temporaryPassword: initialPassword,
        mustChangePassword: true,
        createdAt: new Date().toISOString()
    };
}

const KIU_REALTIME_BRIDGE_KEY = 'KIU_REALTIME_BRIDGE_URL';
const KIU_REALTIME_DEFAULT_URL = (typeof getKiuPortalBackendDefaultUrl === 'function'
    ? getKiuPortalBackendDefaultUrl()
    : `http://127.0.0.1:${typeof KIU_PORTAL_BACKEND_PORT === 'string' ? KIU_PORTAL_BACKEND_PORT : '48933'}`);

function getKiuRealtimeBridgeUrl() {
    return (localStorage.getItem(KIU_REALTIME_BRIDGE_KEY) || KIU_REALTIME_DEFAULT_URL).replace(/\/$/, '');
}

function shouldSkipKiuRealtimeBridge() {
    if (typeof getPortalSessionToken === 'function' && !getPortalSessionToken()) return true;
    if (document.body?.classList?.contains('lux-route-admin-tools')) return true;
    if (/\/admin-tools\.html(?:$|[?#])/i.test(String(window.location.pathname || ''))) return true;
    return window.location.protocol === 'file:' && !localStorage.getItem(KIU_REALTIME_BRIDGE_KEY);
}

function teardownKiuRealtimeEventStream() {
    const runtime = ensureKiuRealtimeRuntime();
    if (runtime.eventSource) {
        try { runtime.eventSource.close(); } catch (error) {}
        runtime.eventSource = null;
    }
    runtime.bootstrappedFor = '';
    runtime.online = false;
    runtime.sseConnectInFlight = false;
}

function ensureKiuRealtimeRuntime() {
    window.__kiuRealtimeRuntime = window.__kiuRealtimeRuntime || {
        online: false,
        connecting: false,
        bootstrappedFor: '',
        lastBootstrapUserId: '',
        lastBootstrapSucceededAt: 0,
        bootstrapScheduledFor: '',
        bootstrapScheduledHandle: null,
        eventSource: null,
        accountsById: {},
        lastSnapshotAt: '',
        bootstrapPromise: null,
        pushSubscriptionPromise: null,
        bridgeUnavailableUntil: 0,
        sseBlockedUntil: 0,
        sseConnectInFlight: false,
        lastBridgeError: '',
        lastBrowserNoticeAtByKey: {}
    };
    return window.__kiuRealtimeRuntime;
}

function isKiuRealtimeSseBlocked() {
    const runtime = ensureKiuRealtimeRuntime();
    return Boolean(runtime.sseBlockedUntil && Date.now() < runtime.sseBlockedUntil);
}

function supportsBrowserNotifications() {
    return typeof window !== 'undefined' && typeof Notification === 'function';
}

function canShowBrowserNotifications() {
    return supportsBrowserNotifications() && Notification.permission === 'granted';
}

function maybePromptBrowserNotificationPermission() {
    if (!supportsBrowserNotifications()) return;
    if (Notification.permission !== 'default') return;
    const alreadyPrompted = sessionStorage.getItem('KIU_BROWSER_NOTIFICATION_PROMPTED') === '1';
    if (alreadyPrompted) return;
    sessionStorage.setItem('KIU_BROWSER_NOTIFICATION_PROMPTED', '1');
    Notification.requestPermission()
        .then((permission) => {
            const runtime = ensureKiuRealtimeRuntime();
            if (
                permission === 'granted'
                && runtime.online
                && runtime.bootstrappedFor
                && String(runtime.bootstrappedFor) === String(getCurrentUserId() || '')
            ) {
                ensureBrowserPushSubscription().catch(() => null);
            }
        })
        .catch(() => null);
}

function shouldEagerBootstrapKiuRealtime() {
    if (typeof isPortalLocalDevEnvironment === 'function' && !isPortalLocalDevEnvironment()) return true;
    try {
        const routePath = String(window.location?.pathname || '')
            .replace(/\\/g, '/')
            .toLowerCase();
        const routeName = routePath.split('/').filter(Boolean).pop() || 'index.html';
        if (routeName === 'social.html') return true;
        if (routeName === 'student-service.html') return true;
        if (routeName === 'index.html') {
            const activeHash = String(window.location?.hash || '').replace(/^#/, '').trim().toLowerCase();
            return activeHash === 'social';
        }
    } catch (error) {}
    return false;
}

async function ensureBrowserPushSubscription(force = false) {
    const runtime = ensureKiuRealtimeRuntime();
    if (runtime.pushSubscriptionPromise && !force) return runtime.pushSubscriptionPromise;
    runtime.pushSubscriptionPromise = (async () => {
        if (!supportsBrowserNotifications() || Notification.permission !== 'granted') return false;
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
        if (typeof fetchPortalPushConfig !== 'function' || typeof subscribePortalPush !== 'function') return false;
        const pushConfig = await fetchPortalPushConfig(force).catch(() => null);
        if (!pushConfig?.supported || !pushConfig?.publicKey) return false;
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        if (existingSubscription) {
            await subscribePortalPush(existingSubscription.toJSON(), 'aes128gcm').catch(() => null);
            return true;
        }
        const applicationServerKey = typeof decodeBase64UrlToUint8Array === 'function'
            ? decodeBase64UrlToUint8Array(pushConfig.publicKey)
            : null;
        if (!applicationServerKey?.length) return false;
        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
        });
        await subscribePortalPush(subscription.toJSON(), 'aes128gcm').catch(() => null);
        return true;
    })().catch(() => false).finally(() => {
        runtime.pushSubscriptionPromise = null;
    });
    return runtime.pushSubscriptionPromise;
}

function showBrowserNotification(title, options = {}) {
    if (!canShowBrowserNotifications()) return false;
    if (document.visibilityState === 'visible' && document.hasFocus && document.hasFocus()) return false;
    const runtime = ensureKiuRealtimeRuntime();
    const notificationKey = String(options.key || title || '').trim();
    const now = Date.now();
    if (notificationKey) {
        const lastShownAt = Number(runtime.lastBrowserNoticeAtByKey[notificationKey] || 0);
        if (lastShownAt && now - lastShownAt < 6000) return false;
        runtime.lastBrowserNoticeAtByKey[notificationKey] = now;
    }
    try {
        const notificationTitle = String(title || 'KIU update').trim() || 'KIU update';
        const notificationOptions = {
            body: String(options.body || '').trim(),
            tag: String(options.tag || notificationKey || 'kiu-notice').trim() || 'kiu-notice',
            icon: String(options.icon || 'favicon.ico').trim() || 'favicon.ico',
            data: {
                url: String(options.url || '').trim()
            }
        };
        if (navigator.serviceWorker?.ready) {
            navigator.serviceWorker.ready
                .then((registration) => registration.showNotification(notificationTitle, notificationOptions))
                .catch(() => null);
        }
        const notification = new Notification(notificationTitle, notificationOptions);
        if (String(options.url || '').trim()) {
            notification.onclick = () => {
                try { window.focus(); } catch (error) {}
                window.location.href = String(options.url || '').trim();
            };
        }
        return true;
    } catch (error) {
        return false;
    }
}

async function kiuRealtimeFetch(path, options = {}) {
    const runtime = ensureKiuRealtimeRuntime();
    if (shouldSkipKiuRealtimeBridge()) {
        runtime.online = false;
        return {};
    }
    const now = Date.now();
    if (runtime.bridgeUnavailableUntil && runtime.bridgeUnavailableUntil > now) {
        const failure = new Error(runtime.lastBridgeError || 'Realtime bridge is temporarily unavailable.');
        failure.code = 'KIU_REALTIME_BRIDGE_COOLDOWN';
        failure.silent = true;
        throw failure;
    }
    const url = `${getKiuRealtimeBridgeUrl()}${path}`;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), KIU_REALTIME_BRIDGE_TIMEOUT_MS) : null;
    const requestOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...((typeof getPortalSessionToken === 'function' && getPortalSessionToken())
                ? { 'X-Portal-Session': getPortalSessionToken() }
                : {}),
            ...(options.headers || {})
        },
        signal: controller ? controller.signal : undefined
    };
    if (options.body !== undefined) {
        requestOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    try {
        const response = await fetch(url, requestOptions);
        const payload = await response.json().catch(() => ({}));
        runtime.online = response.ok;
        runtime.bridgeUnavailableUntil = 0;
        runtime.lastBridgeError = '';
        if (!response.ok) {
            if (
                response.status === 401 &&
                typeof handleKiuUnauthorizedSession === 'function' &&
                (typeof getPortalSessionToken !== 'function' || getPortalSessionToken() || localStorage.getItem('KIU_AUTH_STATE'))
            ) {
                handleKiuUnauthorizedSession({
                    redirect: true,
                    message: payload?.error || `Realtime request failed (${response.status})`
                });
            }
            throw new Error(payload?.error || `Realtime request failed (${response.status})`);
        }
        return payload;
    } catch (error) {
        runtime.online = false;
        runtime.lastBridgeError = error?.name === 'AbortError'
            ? `Realtime bridge timed out after ${Math.round(KIU_REALTIME_BRIDGE_TIMEOUT_MS / 1000)}s.`
            : (error?.message || 'Realtime bridge is unavailable.');
        runtime.bridgeUnavailableUntil = Date.now() + KIU_REALTIME_BRIDGE_COOLDOWN_MS;
        throw error;
    } finally {
        if (timeout) clearTimeout(timeout);
    }
}

function buildRealtimeAccountPayload(user) {
    if (!user) return null;
    const displayName = cleanupEncodingArtifacts(toEnglishText(user.displayName || user.nameEn || user.name || user.email || user.id));
    const rosterName = String(user.name || user.nameEn || displayName || '').trim();
    const rosterNameEn = String(user.nameEn || user.name || displayName || '').trim();
    return {
        id: String(user.id || '').trim(),
        email: String(user.email || '').trim().toLowerCase(),
        name: rosterName,
        nameEn: rosterNameEn,
        displayName,
        role: String(user.role || USER_ROLES.STUDENT).trim().toLowerCase(),
        faculty: String(user.faculty || user.facultyCode || '').trim(),
        facultyCode: String(user.facultyCode || user.faculty || '').trim(),
        photo: String(user.photo || user.avatar || '').trim(),
        password: String(user.password || user.temporaryPassword || '').trim(),
        temporaryPassword: String(user.temporaryPassword || '').trim(),
        mustChangePassword: Boolean(user.mustChangePassword),
        accountStatus: String(user.accountStatus || 'active').trim(),
        createdAt: String(user.createdAt || new Date().toISOString()),
        isAdminTestingPersona: typeof isAdminTestingPersonaId === 'function'
            ? isAdminTestingPersonaId(user.id)
            : String(user.id || '').trim().toLowerCase().startsWith('admin-testing-')
    };
}

function ensureFacultyProfileShell(facultyCode) {
    const normalizedFaculty = normalizeFacultyCode(facultyCode || '', '');
    if (!normalizedFaculty) return null;
    if (typeof KIU_STATE === 'undefined' || !KIU_STATE) return null;
    if (!KIU_STATE.facultyProfiles || typeof KIU_STATE.facultyProfiles !== 'object') {
        KIU_STATE.facultyProfiles = {};
    }
    if (!KIU_STATE.facultyProfiles[normalizedFaculty]) {
        KIU_STATE.facultyProfiles[normalizedFaculty] = {
            professors: [],
            tas: [],
            students: [],
            curriculum: []
        };
    }
    const profile = KIU_STATE.facultyProfiles[normalizedFaculty];
    ['professors', 'tas', 'students', 'curriculum'].forEach((key) => {
        if (!Array.isArray(profile[key])) profile[key] = [];
    });
    return profile;
}

function upsertFacultyRosterMember(normalized) {
    if (!normalized?.id) return;
    const facultyCode = normalizeFacultyCode(normalized.facultyCode || normalized.faculty || '', '');
    if (!facultyCode) return;
    const profile = ensureFacultyProfileShell(facultyCode);
    if (!profile) return;
    const bucketKey = normalized.role === USER_ROLES.PROFESSOR
        ? 'professors'
        : normalized.role === USER_ROLES.TA
            ? 'tas'
            : normalized.role === USER_ROLES.STUDENT
                ? 'students'
                : null;
    if (!bucketKey) return;
    const rosterMember = {
        ...normalized,
        faculty: facultyCode,
        facultyCode,
        status: normalized.accountStatus === 'disabled' ? 'Suspended' : 'Active'
    };
    const memberIndex = profile[bucketKey].findIndex(member => String(member?.id) === normalized.id);
    if (memberIndex >= 0) {
        profile[bucketKey][memberIndex] = { ...profile[bucketKey][memberIndex], ...rosterMember };
    } else {
        profile[bucketKey].push(rosterMember);
    }
}

function syncAdminTestingPersonaRosters(accounts = []) {
    if (currentUser?.role !== USER_ROLES.ADMIN) return 0;
    const list = ensureArray(accounts).filter((account) => {
        const id = String(account?.id || '').trim();
        return id && (typeof isAdminTestingPersonaId === 'function' ? isAdminTestingPersonaId(id) : id.toLowerCase().startsWith('admin-testing-'));
    });
    if (!list.length) return 0;
    list.forEach((account) => {
        const normalized = buildRealtimeAccountPayload(account);
        if (!normalized?.id || !normalized.email) return;
        normalized.isAdminTestingPersona = true;
        if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
        const existingIndex = KIU_STATE.users.findIndex(user => String(user?.id) === normalized.id);
        if (existingIndex >= 0) {
            KIU_STATE.users[existingIndex] = { ...KIU_STATE.users[existingIndex], ...normalized };
        } else {
            KIU_STATE.users.push({ ...normalized });
        }
        upsertFacultyRosterMember(normalized);
        if (normalized.role === USER_ROLES.STUDENT && typeof ensureAdminTestingStudentAcademicShell === 'function') {
            ensureAdminTestingStudentAcademicShell(normalized.id);
        }
    });
    return list.length;
}

function mergeMessagesById(existingMessages = [], incomingMessages = []) {
    const merged = [...existingMessages];
    incomingMessages.forEach(message => {
        if (!message) return;
        if (!merged.some(existing => String(existing?.id) === String(message.id))) {
            merged.push({ ...message });
        }
    });
    merged.sort((a, b) => String(a?.sentAt || '').localeCompare(String(b?.sentAt || '')));
    return merged;
}

function upsertPortalUserFromRealtime(account, persist = true) {
    const normalized = buildRealtimeAccountPayload(account);
    if (!normalized || !normalized.id || !normalized.email) return null;

    const runtime = ensureKiuRealtimeRuntime();
    runtime.accountsById[normalized.id] = {
        ...runtime.accountsById[normalized.id],
        ...normalized
    };

    if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
    const existingIndex = KIU_STATE.users.findIndex(user => String(user?.id) === normalized.id);
    if (existingIndex >= 0) {
        KIU_STATE.users[existingIndex] = {
            ...KIU_STATE.users[existingIndex],
            ...normalized
        };
    } else {
        KIU_STATE.users.push({ ...normalized });
    }

    if (normalized.isAdminTestingPersona || (typeof isAdminTestingPersonaId === 'function' && isAdminTestingPersonaId(normalized.id))) {
        upsertFacultyRosterMember(normalized);
        if (normalized.role === USER_ROLES.STUDENT && typeof ensureAdminTestingStudentAcademicShell === 'function') {
            ensureAdminTestingStudentAcademicShell(normalized.id);
        }
    } else {
        const facultyCode = normalizeFacultyCode(normalized.facultyCode || normalized.faculty || '', '');
        if (facultyCode && KIU_STATE.facultyProfiles?.[facultyCode]) {
            upsertFacultyRosterMember(normalized);
        }
    }

    if (persist) saveState();
    return normalized;
}

function hydratePortalUsersFromAccounts(accounts = [], options = {}) {
    const persist = Boolean(options?.persist);
    const list = ensureArray(accounts).filter((account) => Boolean(account?.id));
    if (!list.length) return 0;
    list.forEach((account) => upsertPortalUserFromRealtime(account, false));
    if (currentUser?.role === USER_ROLES.ADMIN) {
        syncAdminTestingPersonaRosters(list);
    }
    if (typeof ensureCanonicalState === 'function') ensureCanonicalState();
    if (persist && typeof saveState === 'function') saveState();
    return list.length;
}

async function refreshImpersonationDirectoryFromBackend(requestedRole = '', preferredFaculty = '') {
    if (currentUser?.role !== USER_ROLES.ADMIN) return 0;
    if (typeof getPortalSessionToken !== 'function' || !getPortalSessionToken()) return 0;
    if (typeof kiuPortalFetch !== 'function') return 0;
    try {
        const normalizedRole = String(requestedRole || '').trim().toLowerCase();
        const facultyCode = normalizeFacultyCode(
            preferredFaculty || localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || '',
            ''
        );
        let accounts = [];
        if (normalizedRole && facultyCode) {
            const filteredPayload = await kiuPortalFetch(
                `/api/accounts?limit=500&role=${encodeURIComponent(normalizedRole)}&facultyCode=${encodeURIComponent(facultyCode)}`
            );
            accounts = Array.isArray(filteredPayload?.accounts) ? filteredPayload.accounts : [];
        }
        if (!accounts.length) {
            const payload = await kiuPortalFetch('/api/accounts?limit=500');
            accounts = Array.isArray(payload?.accounts) ? payload.accounts : [];
        }
        return hydratePortalUsersFromAccounts(accounts, { persist: false });
    } catch (error) {
        console.warn('Could not refresh impersonation directory from backend.', error);
        return 0;
    }
}

function upsertPortalMessengerChatFromRealtime(chat, persist = false) {
    if (!chat || !chat.id) return null;
    ensurePortalMessengerState();
    const normalizedChat = typeof normalizePortalMessengerChatRecord === 'function'
        ? normalizePortalMessengerChatRecord(chat)
        : {
            ...chat,
            id: String(chat.id),
            members: Array.isArray(chat.members) ? chat.members.map(member => String(member)) : [],
            messages: Array.isArray(chat.messages) ? chat.messages.map(message => ({ ...message })) : []
        };
    const existing = KIU_STATE.portalMessengerChats?.[normalizedChat.id];
    KIU_STATE.portalMessengerChats[normalizedChat.id] = existing
        ? {
            ...existing,
            ...normalizedChat,
            members: [...new Set([...(existing.members || []), ...(normalizedChat.members || [])])],
            messages: mergeMessagesById(existing.messages || [], normalizedChat.messages || [])
        }
        : normalizedChat;
    if (
        getPortalMessengerDirectChatMembers
        && typeof reconcilePortalMessengerDirectChatDuplicates === 'function'
        && getPortalMessengerDirectChatMembers(KIU_STATE.portalMessengerChats[normalizedChat.id])
    ) {
        return reconcilePortalMessengerDirectChatDuplicates(KIU_STATE.portalMessengerChats[normalizedChat.id], persist);
    }
    if (persist) saveState();
    return KIU_STATE.portalMessengerChats[normalizedChat.id];
}

function applyKiuRealtimeSnapshot(snapshot, persist = false) {
    if (!snapshot || typeof snapshot !== 'object') return;
    ensurePortalMessengerState();
    ensureKiuRealtimeRuntime().lastSnapshotAt = new Date().toISOString();
    ensureArray(snapshot.accounts).forEach(account => upsertPortalUserFromRealtime(account, false));
    ensureArray(snapshot.chats).forEach(chat => upsertPortalMessengerChatFromRealtime(chat, false));
    ensureArray(snapshot.calls).forEach(call => {
        if (!call?.chatId) return;
        KIU_STATE.portalMessengerCalls[String(call.chatId)] = {
            ...(KIU_STATE.portalMessengerCalls[String(call.chatId)] || {}),
            ...call
        };
    });
    if (persist) saveState();
}

async function fetchRealtimeAccountByEmail(email) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) return null;
    try {
        const payload = await kiuRealtimeFetch(`/api/accounts?email=${encodeURIComponent(normalizedEmail)}`);
        if (payload?.account) {
            upsertPortalUserFromRealtime(payload.account);
            return payload.account;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function syncUserToRealtimeBridge(user) {
    const account = buildRealtimeAccountPayload(user);
    if (!account?.id || !account.email) return null;
    if (
        account.isAdminTestingPersona
        || (typeof isDemoOrTestingUserRecord === 'function' && isDemoOrTestingUserRecord(account))
    ) {
        return null;
    }
    try {
        const payload = await kiuRealtimeFetch('/api/accounts/upsert', {
            method: 'POST',
            body: { account }
        });
        if (payload?.account) {
            return upsertPortalUserFromRealtime(payload.account);
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function syncAllKnownUsersToRealtimeBridge() {
    const users = ensureArray(KIU_STATE.users);
    for (const user of users) {
        await syncUserToRealtimeBridge(user);
    }
}

async function syncKnownUsersToRealtimeBridge(users = []) {
    for (const user of ensureArray(users)) {
        await syncUserToRealtimeBridge(user);
    }
}

function queueRealtimeUserSync(user) {
    if (!user?.id) return;
    setTimeout(() => {
        syncUserToRealtimeBridge(user);
    }, 0);
}

function handleKiuRealtimeEventPayload(payload) {
    if (!payload || typeof payload !== 'object') return;
    const uiState = typeof ensurePortalMessengerUiState === 'function' ? ensurePortalMessengerUiState() : null;
    const currentUserId = getCurrentUserId();
    const refreshPrivilegeAwareShell = () => {
        if (typeof invalidatePageAccessCache === 'function') invalidatePageAccessCache();
        if (typeof renderNav === 'function') renderNav();
        if (typeof renderHomeShell === 'function' && typeof getActivePageId === 'function' && getActivePageId() === 'home') {
            renderHomeShell();
        }
    };
    const emitWorkspaceEvent = (eventName, detail = {}) => {
        try {
            window.dispatchEvent(new CustomEvent(eventName, { detail }));
        } catch (error) {}
    };
    switch (payload.type) {
        case 'account:upsert':
            if (payload.account) {
                const nextAccount = upsertPortalUserFromRealtime(payload.account, true);
                if (String(nextAccount?.id || '') === String(currentUserId || '')) {
                    refreshPrivilegeAwareShell();
                    emitWorkspaceEvent('kiu:privileges-updated', { account: nextAccount });
                }
            }
            break;
        case 'chat:upsert':
            if (payload.chat) {
                const latestMessage = Array.isArray(payload.chat.messages) ? payload.chat.messages[payload.chat.messages.length - 1] : null;
                if (latestMessage && String(latestMessage.senderId || '') !== String(currentUserId || '')) {
                    const senderLabel = latestMessage.senderName || 'New message';
                    showBrowserNotification(`Message from ${senderLabel}`, {
                        body: String(latestMessage.text || (latestMessage.file ? `Shared ${latestMessage.file.name || 'an attachment'}` : 'Open the conversation to continue.')).trim(),
                        key: `chat:${payload.chat.id}:${latestMessage.id || latestMessage.sentAt || ''}`,
                        tag: `chat-${payload.chat.id || 'thread'}`,
                        url: 'social.html'
                    });
                }
                upsertPortalMessengerChatFromRealtime(payload.chat, true);
                if (getCurrentUserId()) {
                    unhidePortalMessengerChatForUser(payload.chat.id, getCurrentUserId());
                }
                const onLmsRoute = document.body?.classList?.contains('lux-route-lms');
                if (!onLmsRoute && typeof renderPortalMessengerWorkspace === 'function') {
                    renderPortalMessengerWorkspace();
                }
                if (typeof refreshLmsInteractionMessagesIfActive === 'function') {
                    refreshLmsInteractionMessagesIfActive();
                }
            }
            break;
        case 'call:ringing':
            showBrowserNotification('Incoming call', {
                body: 'A live call is waiting in the social workspace.',
                key: `call:ringing:${payload.chatId || ''}:${payload.fromUserId || ''}`,
                tag: `call-${payload.chatId || 'incoming'}`,
                url: 'social.html'
            });
            if (uiState) {
                uiState.fullOpen = true;
                uiState.callOpen = true;
                uiState.activeCallChatId = String(payload.chatId || '');
                uiState.callMode = 'incoming';
                uiState.activeCallRemoteUserId = String(payload.fromUserId || '');
                if (typeof renderPortalMessengerWorkspace === 'function') renderPortalMessengerWorkspace();
            }
            break;
        case 'call:accepted':
            if (typeof beginPortalOutgoingWebRtcCall === 'function') {
                beginPortalOutgoingWebRtcCall(String(payload.chatId || ''), String(payload.fromUserId || ''));
            }
            break;
        case 'call:declined':
            if (typeof markPortalCallUiState === 'function') {
                markPortalCallUiState('declined', 'Call declined');
            }
            break;
        case 'call:ended':
            if (typeof finalizePortalMessengerCall === 'function') {
                finalizePortalMessengerCall(false);
            }
            break;
        case 'call:signal':
            if (typeof handlePortalCallSignalMessage === 'function') {
                handlePortalCallSignalMessage(payload.signal);
            }
            break;
        case 'portal:state-upsert':
            schedulePortalBackendBootstrap(true);
            break;
        case 'lms-live-quiz:updated':
            if (typeof handleLmsLiveQuizRealtimeUpdate === 'function') {
                handleLmsLiveQuizRealtimeUpdate(payload);
            }
            emitWorkspaceEvent('kiu:lms-live-quiz-updated', payload);
            break;
        case 'lms-whiteboard:updated':
            if (typeof handleLmsWhiteboardRealtimeUpdate === 'function') {
                handleLmsWhiteboardRealtimeUpdate(payload);
            }
            emitWorkspaceEvent('kiu:lms-whiteboard-updated', payload);
            break;
        case 'lms-whiteboard:signal':
            if (typeof handleLmsWhiteboardRealtimeSignal === 'function') {
                handleLmsWhiteboardRealtimeSignal(payload);
            }
            emitWorkspaceEvent('kiu:lms-whiteboard-signal', payload);
            break;
        case 'social:state-upsert':
            if (typeof schedulePortalSocialBootstrap === 'function') schedulePortalSocialBootstrap(true);
            break;
        case 'news:updated':
            if (!payload.silent) {
                showBrowserNotification('University news updated', {
                    body: 'A new announcement or response is available in the News workspace.',
                    key: `news:${payload.emittedAt || ''}`,
                    tag: 'news-update',
                    url: 'news.html'
                });
            }
            emitWorkspaceEvent('kiu:news-updated', payload);
            break;
        case 'student-service:updated': {
            const refreshStudentServiceState = () => {
                if (typeof fetchStudentServiceBootstrap === 'function') {
                    return fetchStudentServiceBootstrap(true);
                }
                if (typeof kiuPortalFetch !== 'function' || !window.KIU_STATE) {
                    return Promise.resolve(null);
                }
                return kiuPortalFetch('/api/student-service/bootstrap').then((bootstrapPayload) => {
                    if (typeof window.applyStudentServiceBootstrap === 'function') {
                        window.applyStudentServiceBootstrap(bootstrapPayload);
                    } else if (window.KIU_STATE) {
                        const articles = bootstrapPayload?.studentService?.articles;
                        window.KIU_STATE.studentServiceArticles = Array.isArray(articles) ? articles.slice() : [];
                    }
                    return bootstrapPayload?.studentService || null;
                });
            };
            refreshStudentServiceState()
                .then(() => {
                    if (typeof window.invalidateStudentServiceRenderSignature === 'function') {
                        window.invalidateStudentServiceRenderSignature();
                    } else {
                        const container = document.getElementById('page-student-service');
                        if (container) {
                            delete container.dataset.studentServiceRenderSignature;
                            delete container.dataset.studentServiceChromeSignature;
                        }
                    }
                    if (document.getElementById('page-student-service') && typeof renderStudentServicePage === 'function') {
                        renderStudentServicePage();
                    }
                })
                .catch((error) => {
                    console.warn('Student Service realtime refresh failed.', error);
                });
            emitWorkspaceEvent('kiu:student-service-updated', payload);
            break;
        }
        case 'accounts:privileges-updated':
            refreshPrivilegeAwareShell();
            emitWorkspaceEvent('kiu:privileges-updated', payload);
            break;
        default:
            break;
    }
}

function consumeKiuRealtimeStreamBuffer(buffer, handleEvent) {
    let remaining = String(buffer || '');
    let boundaryMatch = remaining.match(/\r?\n\r?\n/);
    while (boundaryMatch) {
        const boundaryIndex = Number(boundaryMatch.index || 0);
        const boundaryText = boundaryMatch[0] || '\n\n';
        const frame = remaining.slice(0, boundaryIndex);
        remaining = remaining.slice(boundaryIndex + boundaryText.length);
        const dataLines = frame
            .split(/\r?\n/)
            .filter(line => line.startsWith('data:'))
            .map(line => line.slice(5).trimStart());
        if (dataLines.length) {
            handleEvent({
                data: dataLines.join('\n')
            });
        }
        boundaryMatch = remaining.match(/\r?\n\r?\n/);
    }
    return remaining;
}

function openKiuRealtimeEventStream(url, sessionToken, handleEvent, handleError) {
    let closed = false;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const streamReady = fetch(url, {
        method: 'GET',
        headers: {
            Accept: 'text/event-stream',
            ...(sessionToken ? { 'X-Portal-Session': sessionToken } : {})
        },
        cache: 'no-store',
        signal: controller ? controller.signal : undefined
    }).then(async response => {
        if (!response.ok) {
            const error = new Error(`Realtime stream failed (${response.status}).`);
            error.status = response.status;
            throw error;
        }
        if (!response.body || typeof response.body.getReader !== 'function') {
            throw new Error('Realtime stream is unavailable in this browser.');
        }
        const reader = response.body.getReader();
        const decoder = typeof TextDecoder === 'function' ? new TextDecoder() : null;
        let buffer = '';
        while (!closed) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder
                ? decoder.decode(value, { stream: true })
                : String.fromCharCode.apply(null, Array.from(value || []));
            buffer = consumeKiuRealtimeStreamBuffer(`${buffer}${chunk}`, handleEvent);
        }
        if (!closed) {
            const error = new Error('Realtime stream closed.');
            error.code = 'KIU_REALTIME_STREAM_CLOSED';
            throw error;
        }
    }).catch(error => {
        if (closed || error?.name === 'AbortError') return;
        handleError(error);
    });
    return {
        close() {
            if (closed) return;
            closed = true;
            if (controller) {
                try { controller.abort(); } catch (error) {}
            }
        },
        ready: streamReady
    };
}

function connectKiuRealtimeEventStream() {
    const runtime = ensureKiuRealtimeRuntime();
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;
    if (shouldSkipKiuRealtimeBridge()) {
        teardownKiuRealtimeEventStream();
        return;
    }
    if (isKiuRealtimeSseBlocked()) return;
    if (runtime.sseConnectInFlight) return;
    const normalizedUserId = String(currentUserId);
    if (runtime.eventSource && runtime.bootstrappedFor === normalizedUserId) {
        return;
    }
    if (runtime.eventSource) {
        teardownKiuRealtimeEventStream();
    }
    const portalSessionToken = typeof getPortalSessionToken === 'function' ? getPortalSessionToken() : '';
    if (!portalSessionToken) return;
    runtime.sseConnectInFlight = true;
    const streamUrl = `${getKiuRealtimeBridgeUrl()}/api/events?userId=${encodeURIComponent(String(currentUserId))}`;
    const eventSource = openKiuRealtimeEventStream(streamUrl, portalSessionToken, (event) => {
        let payload = null;
        try {
            payload = JSON.parse(event.data);
        } catch (error) {
            payload = null;
        }
        handleKiuRealtimeEventPayload(payload);
    }, (error) => {
        runtime.online = false;
        runtime.sseConnectInFlight = false;
        if (Number(error?.status) === 429) {
            runtime.sseBlockedUntil = Date.now() + (5 * 60 * 1000);
            if (runtime.bootstrapScheduledHandle) {
                clearTimeout(runtime.bootstrapScheduledHandle);
                runtime.bootstrapScheduledHandle = null;
                runtime.bootstrapScheduledFor = '';
            }
            console.warn('Realtime event stream paused after too many connections. It will retry in a few minutes.');
        }
        if (runtime.eventSource === eventSource) {
            runtime.eventSource = null;
            runtime.bootstrappedFor = '';
        }
    });
    eventSource.ready.finally(() => {
        runtime.sseConnectInFlight = false;
    });
    runtime.eventSource = eventSource;
    runtime.bootstrappedFor = normalizedUserId;
}

function bindKiuRealtimePageExitTeardown() {
    if (typeof window === 'undefined' || window.__kiuRealtimePageExitTeardownBound) return;
    const teardownOnExit = () => {
        if (typeof teardownKiuRealtimeEventStream === 'function') {
            teardownKiuRealtimeEventStream();
        }
    };
    window.addEventListener('pagehide', teardownOnExit);
    window.addEventListener('beforeunload', teardownOnExit);
    window.__kiuRealtimePageExitTeardownBound = true;
}

bindKiuRealtimePageExitTeardown();

async function bootstrapKiuRealtimeBridge(force = false) {
    const currentUser = getCurrentUser();
    if (!currentUser?.id) return false;
    if (shouldSkipKiuRealtimeBridge()) {
        teardownKiuRealtimeEventStream();
        return false;
    }
    maybePromptBrowserNotificationPermission();
    const runtime = ensureKiuRealtimeRuntime();
    const currentUserId = String(currentUser.id || '');
    // Always coalesce — force must not open parallel /api/events streams.
    if (runtime.bootstrapPromise) return runtime.bootstrapPromise;
    if (
        !force
        && runtime.online
        && runtime.eventSource
        && runtime.bootstrappedFor === currentUserId
        && runtime.lastBootstrapSucceededAt
    ) {
        return true;
    }
    runtime.bootstrapPromise = (async () => {
        runtime.connecting = true;
        runtime.bootstrapScheduledFor = '';
        runtime.lastBootstrapUserId = currentUserId;
        await syncUserToRealtimeBridge(currentUser);
        const snapshot = await kiuRealtimeFetch(`/api/messenger/snapshot?userId=${encodeURIComponent(currentUserId)}`);
        applyKiuRealtimeSnapshot(snapshot, true);
        const hasActiveStream = Boolean(
            runtime.eventSource
            && runtime.bootstrappedFor === currentUserId
            && !isKiuRealtimeSseBlocked()
        );
        if (!hasActiveStream && !isKiuRealtimeSseBlocked()) {
            connectKiuRealtimeEventStream();
        }
        if (Notification.permission === 'granted') {
            ensureBrowserPushSubscription(force).catch(() => null);
        }
        runtime.online = true;
        runtime.bootstrappedFor = currentUserId;
        runtime.lastBootstrapSucceededAt = Date.now();
        return true;
    })().catch(error => {
        runtime.online = false;
        return false;
    }).finally(() => {
        runtime.connecting = false;
        runtime.bootstrapPromise = null;
    });
    return runtime.bootstrapPromise;
}

function scheduleKiuRealtimeBootstrap(force = false) {
    const runtime = ensureKiuRealtimeRuntime();
    const currentUserId = String(getCurrentUserId() || '');
    if (!currentUserId) return;
    if (shouldSkipKiuRealtimeBridge()) {
        teardownKiuRealtimeEventStream();
        return;
    }
    // Respect 429 backoff even for forced schedules — reconnecting hammers /api/events.
    if (isKiuRealtimeSseBlocked()) return;
    if (runtime.bootstrapPromise) return;
    const alreadyScheduledForCurrentUser = runtime.bootstrapScheduledHandle && runtime.bootstrapScheduledFor === currentUserId;
    if (!force && alreadyScheduledForCurrentUser) return;
    if (
        !force
        && runtime.online
        && runtime.eventSource
        && runtime.bootstrappedFor === currentUserId
        && runtime.lastBootstrapSucceededAt
    ) {
        return;
    }
    if (runtime.bootstrapScheduledHandle) {
        clearTimeout(runtime.bootstrapScheduledHandle);
    }
    runtime.bootstrapScheduledFor = currentUserId;
    const bootstrapDelayMs = force ? 0 : 250;
    runtime.bootstrapScheduledHandle = setTimeout(() => {
        runtime.bootstrapScheduledHandle = null;
        bootstrapKiuRealtimeBridge(force).catch(() => null);
    }, bootstrapDelayMs);
}

async function authLogin(email, password) {
    let serverSession = null;
    let user = null;
    try {
        serverSession = await createPortalBackendSession(email, password);
        if (serverSession?.account) {
            user = {
                ...serverSession.account,
                avatar: serverSession.account.avatar || serverSession.account.photo || ''
            };
        }
    } catch (error) {
        serverSession = null;
    }
    if (!serverSession) {
        return {
            success: false,
            error: 'The KIU platform backend is required for login now. Start the backend service and try again.'
        };
    }
    const remoteUser = await fetchRealtimeAccountByEmail(email);
    user = {
        ...(remoteUser || {}),
        ...(user || {})
    };
    if (!user) return { success: false, error: 'Account not found. Please check your email.' };

    if (user.activationRequired || user.accountStatus === 'pending-activation') {
        return {
            success: false,
            error: 'This account is created but not activated yet. Use Activate Account with the registration ID first.'
        };
    }

    // Success
    const effectiveRole = user.role === USER_ROLES.ADMIN
        ? (serverSession?.session?.impersonatedRole || user.role)
        : user.role;
    if (typeof storePortalBackendAuth === 'function') {
        storePortalBackendAuth({
            ...user,
            faculty: user.facultyCode || user.faculty || ''
        }, {
            token: serverSession?.session?.token || getPortalSessionToken(),
            impersonatedRole: effectiveRole === USER_ROLES.ADMIN ? '' : effectiveRole,
            actualRole: user.role
        });
    } else {
        localStorage.setItem('KIU_AUTH_STATE', JSON.stringify({
            id: user.id,
            name: user.name,
            nameEn: user.nameEn,
            avatar: user.avatar,
            email: user.email,
            role: user.role,
            faculty: user.facultyCode || user.faculty
        }));
        localStorage.setItem('currentUserRole', user.role);
        if (user.role === USER_ROLES.ADMIN && effectiveRole !== user.role) sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        else sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);

        let persistedState = null;
        try { persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE')); } catch (e) {}
        if (!persistedState) persistedState = JSON.parse(JSON.stringify(KIU_EMPTY_STATE));
        persistedState.auth = persistedState.auth || {};
        persistedState.auth.activeUserId = user.id;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
        sessionStorage.setItem(ACTIVE_SESSION_KEY, user.id);
    }
    
    // Set faculty context automatically on login
    if (user.faculty) {
        localStorage.setItem('KIU_FACULTY_CONTEXT', user.faculty);
        localStorage.setItem('currentFaculty', user.faculty);
    }
    
    loadAuthState();
    queueRealtimeUserSync(user);
    scheduleKiuRealtimeBootstrap(true);
    schedulePortalBackendBootstrap(true);
    if (typeof createPortalAuditEvent === 'function') {
        createPortalAuditEvent({
            actorUserId: user.id,
            actorRole: user.role,
            eventDomain: 'auth',
            eventType: 'login',
            entityType: 'session',
            entityId: user.id,
            sourceSystem: serverSession?.account?.identityProvider === 'microsoft' ? 'microsoft' : 'portal'
        }).catch(() => {});
    }

    return { success: true, redirect: getPortalRoleLanding(user.role) };
}

function getPortalRoleLanding(role = USER_ROLES.STUDENT) {
    const normalizedRole = String(role || USER_ROLES.STUDENT).trim().toLowerCase();
    return normalizedRole === USER_ROLES.ADMIN ? 'students-admin.html' : 'index.html';
}

window.getPortalRoleLanding = getPortalRoleLanding;
window.ensureFacultyProfileShell = ensureFacultyProfileShell;
window.syncAdminTestingPersonaRosters = syncAdminTestingPersonaRosters;
window.hydratePortalUsersFromAccounts = hydratePortalUsersFromAccounts;
window.refreshImpersonationDirectoryFromBackend = refreshImpersonationDirectoryFromBackend;

function syncAuthenticatedSessionState() {
    if (!currentUser?.id) return;
    if (typeof KIU_STATE === 'undefined' || !KIU_STATE) return;
    if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
    const normalizedCurrentUser = {
        id: String(currentUser.id || '').trim(),
        name: String(currentUser.name || '').trim(),
        nameEn: String(currentUser.nameEn || currentUser.name || '').trim(),
        email: String(currentUser.email || '').trim().toLowerCase(),
        role: String(currentUser.role || USER_ROLES.STUDENT).trim().toLowerCase(),
        faculty: String(currentUser.facultyCode || currentUser.faculty || '').trim(),
        facultyCode: String(currentUser.facultyCode || currentUser.faculty || '').trim(),
        avatar: String(currentUser.avatar || '').trim(),
        photo: String(currentUser.avatar || '').trim(),
        status: 'Active'
    };
    const existingUserIndex = KIU_STATE.users.findIndex(user => String(user?.id || '') === normalizedCurrentUser.id);
    if (existingUserIndex >= 0) {
        KIU_STATE.users[existingUserIndex] = {
            ...KIU_STATE.users[existingUserIndex],
            ...normalizedCurrentUser
        };
    } else {
        KIU_STATE.users.push(normalizedCurrentUser);
    }
    const impersonationEnabled = typeof isRoleImpersonationEnabled === 'function' && isRoleImpersonationEnabled();
    const activeSessionUserId = (() => {
        if (!impersonationEnabled || currentUser.role !== USER_ROLES.ADMIN) {
            return String(currentUser.id);
        }
        try {
            const sessionUserId = sessionStorage.getItem(ACTIVE_SESSION_KEY);
            if (sessionUserId) return String(sessionUserId);
        } catch (error) {}
        try {
            const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null');
            const persistedUserId = persistedState?.auth?.activeUserId;
            if (persistedUserId) return String(persistedUserId);
        } catch (error) {}
        try {
            const preferredFaculty = normalizeFacultyCode(
                localStorage.getItem('currentFaculty') || currentUser.facultyCode || currentUser.faculty || 'ECON',
                'ECON'
            );
            if (typeof getPreferredImpersonationUserForRole === 'function') {
                const persona = getPreferredImpersonationUserForRole(currentUserRole || USER_ROLES.STUDENT, preferredFaculty);
                if (persona?.id) return String(persona.id);
            }
        } catch (error) {}
        return String(currentUser.id);
    })();
    KIU_STATE.auth = KIU_STATE.auth || {};
    KIU_STATE.auth.activeUserId = activeSessionUserId;
    sessionStorage.setItem(ACTIVE_SESSION_KEY, activeSessionUserId);
    try {
        const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null') || {};
        persistedState.auth = persistedState.auth || {};
        persistedState.auth.activeUserId = activeSessionUserId;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
    } catch (error) {
        console.warn('Could not persist active session user during auth sync.', error);
    }
    if (!impersonationEnabled) {
        const pendingWorkspaceRole = (() => {
            try {
                const pendingRole = String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || '').trim().toLowerCase();
                return currentUser?.role === USER_ROLES.ADMIN
                    && Object.values(USER_ROLES).includes(pendingRole)
                    && pendingRole !== USER_ROLES.ADMIN
                    ? pendingRole
                    : '';
            } catch (error) {
                return '';
            }
        })();
        if (!pendingWorkspaceRole) {
            currentUserRole = currentUser.role;
        }
    }

    const normalizedFaculty = normalizeFacultyCode(
        impersonationEnabled && currentUser.role === USER_ROLES.ADMIN
            ? (localStorage.getItem('currentFaculty') || getCurrentUser()?.facultyCode || getCurrentUser()?.faculty || currentUser.facultyCode || currentUser.faculty || 'ECON')
            : (currentUser.facultyCode || currentUser.faculty || localStorage.getItem('currentFaculty') || 'ECON'),
        'ECON'
    );
    localStorage.setItem('currentFaculty', normalizedFaculty);
    localStorage.setItem('KIU_FACULTY_CONTEXT', normalizedFaculty);
}

async function authActivate(id, newPassword) {
    try {
        const payload = await kiuPortalFetch('/api/auth/activate', {
            method: 'POST',
            body: JSON.stringify({
                id,
                password: newPassword
            })
        });
        const user = payload?.account || payload?.user || null;
        if (!user) {
            return { success: false, error: 'Could not activate account. Contact support.' };
        }
        queueRealtimeUserSync(user);
        return { success: true, user };
    } catch (error) {
        return { success: false, error: error.message || 'Could not activate account. Contact support.' };
    }
}

function getAllAuthUsersFromState(state) {
    return mergeUniqueById([
        ...((state && Array.isArray(state.users)) ? state.users : []),
        ...collectFacultyMembers(state?.facultyProfiles || {})
    ]);
}
