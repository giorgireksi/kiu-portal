/* Portal diagnostic/mail/persist helpers. Peeled from api.js.
 * Load before api.js.
 */
(function initWave18Peel() {
    if (window.__KIU_API_PORTAL_PERSIST_LOADED) return;
    window.__KIU_API_PORTAL_PERSIST_LOADED = true;

    window.__kiuCreateApiPortalPersistApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

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
    banner.className = 'kiu-portal-runtime-diagnostic';
    banner.setAttribute('data-diagnostic-kind', String(detail.kind || 'backend-unavailable'));
    const routePath = String(detail.path || '').trim();
    banner.innerHTML = `
        <div class="kiu-portal-runtime-diagnostic__row">
            <div class="kiu-portal-runtime-diagnostic__copy">
                <div class="kiu-portal-runtime-diagnostic__title">${copy.title}</div>
                <div class="kiu-portal-runtime-diagnostic__message">${copy.message}</div>
                ${routePath ? `<div class="kiu-portal-runtime-diagnostic__route">Route: ${escapeHtml(routePath)}</div>` : ''}
            </div>
            <button type="button" class="kiu-portal-runtime-diagnostic__close" data-close-portal-diagnostic="1">×</button>
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
    delete snapshot.lmsLiveQuizzes;
    delete snapshot.studentServiceArticles;
    if (snapshot.adminLibrary && typeof snapshot.adminLibrary === 'object') {
        delete snapshot.adminLibrary.catalogPageSize;
        delete snapshot.adminLibrary.catalogPageIndex;
        delete snapshot.adminLibrary.droplistFilters;
    }
    return snapshot;
}

function buildPortalBackendPersistableState(source = (typeof KIU_STATE !== 'undefined' ? KIU_STATE : {})) {
    // The platform bootstrap depends on the canonical portal state, including
    // curriculum, groups, LMS data, and role-scoped records. Persist the same
    // sanitized snapshot we cache locally so backend bootstrap stays complete.
    const snapshot = buildPortalPersistableState(source);
    delete snapshot.socialHub;
    return snapshot;
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

        const api = {
            renderPortalRuntimeDiagnostic,
            setPortalRuntimeDiagnostic,
            clearPortalRuntimeDiagnostic,
            decodeBase64UrlToUint8Array,
            dispatchPortalMailSummaryUpdate,
            setPortalMailSummary,
            getPortalMailSummary,
            clonePortalState,
            buildPortalPersistableState,
            buildPortalBackendPersistableState,
            getPortalSessionToken,
            isPortalLoginPage,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateApiPortalPersistApi({});
})();

