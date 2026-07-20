/* Wave bag: Wave 26 whiteboard workspace */
window.KiuLmsWhiteboardWorkspace = window.KiuLmsWhiteboardWorkspace || {};
const __kiuWbWsApi = window.KiuLmsWhiteboardWorkspace;
window.__kiuWbWsApi = __kiuWbWsApi;
function __kiuWbWsExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuWbWsApi[key] = map[key];
        window[key] = map[key];
    });
}

/* LMS whiteboard workspace/state helpers. */

const __lmsSyncTiming = window.__KIU_LMS_WORKSPACE_SYNC_TIMING__ || {};
const LMS_WHITEBOARD_SYNC_DEBOUNCE_MS = __lmsSyncTiming.SYNC_DEBOUNCE_MS || 350;
const LMS_WHITEBOARD_REALTIME_DEBOUNCE_MS = __lmsSyncTiming.REALTIME_DEBOUNCE_MS || 150;
const LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS = __lmsSyncTiming.LOCAL_SYNC_ECHO_MS || 1500;
const LMS_WHITEBOARD_BACKEND_RELOAD_TTL_MS = __lmsSyncTiming.BACKEND_RELOAD_TTL_MS || 120000;
const LMS_WHITEBOARD_SESSION_WAIT_POLL_MS = 2500;
const LMS_WHITEBOARD_ROUTE_UNAVAILABLE_MESSAGE = 'Whiteboard API is not available on this backend. Restart the local server (`npm run stop:local && npm run start:local`).';

function isLmsWhiteboardActiveTab() {
    const contentArea = typeof document !== 'undefined' ? document.getElementById('lms-content-area') : null;
    return String(contentArea?.dataset?.activeLmsTab || '') === 'whiteboard';
}

function stopLmsWhiteboardSessionWaitPoll(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsWhiteboardSessionWaitPolls = window.__lmsWhiteboardSessionWaitPolls || {};
    const timer = window.__lmsWhiteboardSessionWaitPolls[canonicalKey];
    if (timer) {
        clearInterval(timer);
        delete window.__lmsWhiteboardSessionWaitPolls[canonicalKey];
    }
}

// Students on the wait screen otherwise only refresh via websocket or the 120s reload TTL.
// Poll while idle so "Start session" becomes visible promptly even if realtime drops.
function scheduleLmsWhiteboardSessionWaitPoll(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof window === 'undefined') return;
    if (typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(canonicalKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (workspace?.sessionActive) return;
    window.__lmsWhiteboardSessionWaitPolls = window.__lmsWhiteboardSessionWaitPolls || {};
    if (window.__lmsWhiteboardSessionWaitPolls[canonicalKey]) return;
    window.__lmsWhiteboardSessionWaitPolls[canonicalKey] = setInterval(() => {
        if (!isLmsWhiteboardActiveTab()) {
            stopLmsWhiteboardSessionWaitPoll(canonicalKey);
            return;
        }
        const latest = ensureLmsWhiteboardWorkspace(canonicalKey);
        if (latest?.sessionActive || (typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(canonicalKey))) {
            stopLmsWhiteboardSessionWaitPoll(canonicalKey);
            return;
        }
        if (typeof loadLmsWhiteboardWorkspace === 'function') {
            loadLmsWhiteboardWorkspace(canonicalKey, { force: true, forceRemote: true });
        }
    }, LMS_WHITEBOARD_SESSION_WAIT_POLL_MS);
}

function stripLmsWhiteboardPersistedUi(workspace = {}) {
    const snapshot = typeof cloneState === 'function'
        ? cloneState(workspace && typeof workspace === 'object' ? workspace : {})
        : JSON.parse(JSON.stringify(workspace && typeof workspace === 'object' ? workspace : {}));
    if (snapshot && typeof snapshot === 'object') delete snapshot.ui;
    return snapshot;
}

function ensureLmsWhiteboardWorkspace(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return null;
    KIU_STATE.lmsWhiteboards = KIU_STATE.lmsWhiteboards && typeof KIU_STATE.lmsWhiteboards === 'object'
        ? KIU_STATE.lmsWhiteboards
        : {};
    if (!KIU_STATE.lmsWhiteboards[canonicalKey]) {
        KIU_STATE.lmsWhiteboards[canonicalKey] = {
            resourceKey: canonicalKey,
            version: 0,
            editingEnabled: false,
            editControlUserIds: [],
            deleteStaffElementsUserIds: [],
            sessionActive: false,
            sessionStartedAt: '',
            sessionStartedBy: '',
            staffShare: 'none',
            staffShareLevel: 'none',
            groupShare: 'none',
            peerShares: {},
            elements: [],
            activity: {},
            updatedAt: '',
            updatedBy: '',
            ui: {
                dirty: false,
                syncing: false,
                syncTimer: null,
                loadedFromBackend: false,
                loadingFromBackend: false,
                accessDenied: false,
                routeUnavailable: false,
                syncError: '',
                lastServerSyncAt: 0,
                loadGeneration: 0,
                syncGeneration: 0,
                pendingOps: [],
                opsTimer: null,
                opsGeneration: 0
            }
        };
    }
    const workspace = KIU_STATE.lmsWhiteboards[canonicalKey];
    workspace.ui = workspace.ui && typeof workspace.ui === 'object' ? workspace.ui : {};
    workspace.elements = Array.isArray(workspace.elements) ? workspace.elements : [];
    if (workspace.staffShare === undefined) workspace.staffShare = 'none';
    if (workspace.staffShareLevel === undefined) workspace.staffShareLevel = workspace.staffShare || 'none';
    if (workspace.groupShare === undefined) workspace.groupShare = 'none';
    if (!workspace.peerShares || typeof workspace.peerShares !== 'object' || Array.isArray(workspace.peerShares)) {
        workspace.peerShares = {};
    }
    flattenLmsWhiteboardLegacyTemplateElements(workspace);
    return workspace;
}

const LMS_WHITEBOARD_EMPTY_WORKSPACE = Object.freeze({
    elements: [],
    sessionActive: false,
    editingEnabled: false,
    editControlUserIds: [],
    deleteStaffElementsUserIds: [],
    ui: {}
});

function getLmsWhiteboardWorkspaceSafe(resourceKey = '') {
    return ensureLmsWhiteboardWorkspace(resourceKey) || LMS_WHITEBOARD_EMPTY_WORKSPACE;
}

function canManageLmsWhiteboard(resourceKey = '') {
    return typeof canManageLmsGroupContent === 'function' && canManageLmsGroupContent();
}

function getLmsPersonalBoardCollaboratorShareLevel(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return 'none';
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    const level = String(
        workspace?.shareLevel
        || workspace?.staffShareLevel
        || workspace?.staffShare
        || 'none'
    ).trim().toLowerCase() || 'none';
    return ['view', 'edit'].includes(level) ? level : 'none';
}

function canEditLmsWhiteboard(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey)) {
        if (typeof isLmsPersonalBoardOwner === 'function' && isLmsPersonalBoardOwner(canonicalKey)) {
            return true;
        }
        const isGuest = typeof isLmsPersonalDashboardStaffMonitor === 'function' && isLmsPersonalDashboardStaffMonitor();
        if (isGuest) {
            const activeKey = typeof getLmsPersonalDashboardActiveResourceKey === 'function'
                ? getLmsPersonalDashboardActiveResourceKey()
                : '';
            if (activeKey && canonicalKey !== activeKey) return false;
            return getLmsPersonalBoardCollaboratorShareLevel(canonicalKey) === 'edit';
        }
        return false;
    }
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    if (!workspace) return false;
    if (canManageLmsWhiteboard(resourceKey)) return true;
    if (!workspace.sessionActive) return false;
    if (workspace.editingEnabled) return true;
    const userId = String(typeof getCurrentUserId === 'function' ? getCurrentUserId() || '' : '').trim();
    return Boolean(userId) && Array.isArray(workspace.editControlUserIds) && workspace.editControlUserIds.includes(userId);
}

function canEditLmsWhiteboardElement(element = {}, resourceKey = '') {
    if (!element) return false;
    if (canManageLmsWhiteboard(resourceKey)) return true;
    return canEditLmsWhiteboard(resourceKey);
}

function canMoveLmsWhiteboardElement(element = {}, resourceKey = '') {
    if (!element) return false;
    if (canManageLmsWhiteboard(resourceKey)) return true;
    return canEditLmsWhiteboard(resourceKey);
}

const LMS_WHITEBOARD_LEGACY_TEMPLATE_FIELDS = [
    'templateInstanceId',
    'templateId',
    'templateRole',
    'templateSlot',
    'templateOptions',
    'templateManuallyScaled',
    'frameZone'
];

function flattenLmsWhiteboardLegacyTemplateElement(element = {}) {
    if (!element || typeof element !== 'object') return element;
    const next = { ...element };
    LMS_WHITEBOARD_LEGACY_TEMPLATE_FIELDS.forEach(field => {
        delete next[field];
    });
    return next;
}

const LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES = ['triangle', 'diamond', 'frame'];

function isLmsWhiteboardRemovedElementType(type = '') {
    return LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES.includes(String(type || '').trim());
}

function flattenLmsWhiteboardLegacyTemplateElements(workspace = {}) {
    if (!workspace || typeof workspace !== 'object') return workspace;
    if (Array.isArray(workspace.elements)) {
        workspace.elements = workspace.elements
            .map(flattenLmsWhiteboardLegacyTemplateElement)
            .filter(element => element && !LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES.includes(element.type));
    }
    if (workspace.activity && typeof workspace.activity === 'object') {
        const activity = { ...workspace.activity };
        delete activity.breakouts;
        delete activity.frameSnapshots;
        workspace.activity = activity;
    }
    return workspace;
}

function markLmsWhiteboardRouteUnavailable(canonicalKey = '', message = '') {
    if (!canonicalKey) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    workspace.ui.routeUnavailable = true;
    workspace.ui.dirty = false;
    workspace.ui.syncing = false;
    workspace.ui.loadedFromBackend = true;
    if (workspace.ui.syncTimer) {
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
    }
    workspace.ui.syncError = String(message || '').trim() || LMS_WHITEBOARD_ROUTE_UNAVAILABLE_MESSAGE;
}

function resetLmsWhiteboardAccessState(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    workspace.ui.accessDenied = false;
    workspace.ui.syncError = '';
}

function markLmsWhiteboardAccessDenied(canonicalKey = '', message = 'You are not assigned to this course scope.') {
    if (!canonicalKey) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    workspace.ui.accessDenied = true;
    workspace.ui.dirty = false;
    workspace.ui.syncing = false;
    workspace.ui.loadedFromBackend = true;
    if (workspace.ui.syncTimer) {
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
    }
    workspace.ui.syncError = String(message || '').trim() || 'You are not assigned to this course scope.';
}

function markLmsWhiteboardLocalSync(canonicalKey = '') {
    if (typeof markLmsWorkspaceLocalSyncAt === 'function') {
        markLmsWorkspaceLocalSyncAt('__lmsWhiteboardLocalSyncAt', canonicalKey);
        return;
    }
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsWhiteboardLocalSyncAt = window.__lmsWhiteboardLocalSyncAt || {};
    window.__lmsWhiteboardLocalSyncAt[canonicalKey] = Date.now();
}

function shouldSyncLmsWhiteboardWorkspace(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return false;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (workspace.ui?.routeUnavailable) return false;
    if (workspace.ui?.accessDenied) return false;
    return true;
}

function shouldReloadLmsWhiteboardFromBackend(workspace = {}, canonicalKey = '', options = {}) {
    void canonicalKey;
    if (typeof shouldReloadLmsWorkspaceFromBackendGeneric === 'function') {
        return shouldReloadLmsWorkspaceFromBackendGeneric(
            workspace,
            options,
            LMS_WHITEBOARD_BACKEND_RELOAD_TTL_MS,
            null,
            (ws, opts) => Boolean((ws.ui?.routeUnavailable || ws.ui?.accessDenied) && opts.force !== true)
        );
    }
    if (options.force === true) return true;
    if (workspace.ui?.routeUnavailable && options.force !== true) return false;
    if (workspace.ui?.accessDenied && options.force !== true) return false;
    const lastServerSyncAt = Number(workspace.ui?.lastServerSyncAt || 0);
    if (!Number.isFinite(lastServerSyncAt) || lastServerSyncAt <= 0) return true;
    return (Date.now() - lastServerSyncAt) > LMS_WHITEBOARD_BACKEND_RELOAD_TTL_MS;
}

function markLmsWhiteboardClearAt(canonicalKey = '') {
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsWhiteboardClearAt = window.__lmsWhiteboardClearAt || {};
    window.__lmsWhiteboardClearAt[canonicalKey] = Date.now();
}

function shouldIgnoreLmsWhiteboardRealtimeUpdate(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof window === 'undefined') return false;
    if (window.__lmsWhiteboardSyncPromises?.[canonicalKey]) return true;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (workspace?.ui?.inGesture) return true;
    if (Array.isArray(workspace?.ui?.pendingOps) && workspace.ui.pendingOps.length) return true;
    const lastLocalSyncAt = Number(window.__lmsWhiteboardLocalSyncAt?.[canonicalKey] || 0);
    if (lastLocalSyncAt > 0 && (Date.now() - lastLocalSyncAt) < LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS) return true;
    const clearAt = Number(window.__lmsWhiteboardClearAt?.[canonicalKey] || 0);
    if (clearAt > 0 && (Date.now() - clearAt) < LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS) return true;
    return false;
}

function bumpLmsWhiteboardLoadGeneration(canonicalKey = '') {
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    workspace.ui.loadGeneration = Number(workspace.ui.loadGeneration || 0) + 1;
    return workspace.ui.loadGeneration;
}

function isCurrentLmsWhiteboardLoadGeneration(canonicalKey = '', generation = 0) {
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    return Number(workspace.ui.loadGeneration || 0) === Number(generation || 0);
}

function invokeRefreshLmsWhiteboardUi(resourceKey = '', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey)) {
        if (typeof isLmsPersonalDashboardOpen === 'function' && isLmsPersonalDashboardOpen()
            && typeof refreshLmsPersonalWhiteboardScratchUi === 'function') {
            refreshLmsPersonalWhiteboardScratchUi(canonicalKey, options);
        }
        return;
    }
    if (!isLmsWhiteboardActiveTab()) return;
    if (typeof refreshLmsWhiteboardUi === 'function') {
        refreshLmsWhiteboardUi(canonicalKey, options);
        return;
    }
    if (typeof renderLmsWhiteboardSection === 'function') {
        renderLmsWhiteboardSection(canonicalKey, { skipLoad: true, ...options });
    }
}

function repaintLmsWhiteboardAfterBackendLoad(canonicalKey = '') {
    if (!canonicalKey) return;
    if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey)) {
        if (typeof isLmsPersonalDashboardOpen === 'function' && isLmsPersonalDashboardOpen()
            && typeof refreshLmsPersonalWhiteboardScratchUi === 'function') {
            refreshLmsPersonalWhiteboardScratchUi(canonicalKey, { skipLoad: true });
        }
        return;
    }
    if (!isLmsWhiteboardActiveTab()) return;
    invokeRefreshLmsWhiteboardUi(canonicalKey, { skipLoad: true });
}

function shouldKeepLocalLmsWhiteboardElements(local = {}, remoteElements = [], remoteVersion = 0, forceRemote = false) {
    if (!forceRemote || !local) return false;
    const localElements = Array.isArray(local.elements) ? local.elements : [];
    const localVersion = Number(local.version) || 0;
    const remoteVersionNum = Number(remoteVersion) || 0;
    if (local.ui?.dirty) return true;
    if (local.ui?.inGesture) return true;
    if (local.ui?.syncing) return true;
    if (Array.isArray(local.ui?.pendingOps) && local.ui.pendingOps.length) return true;
    const canonicalKey = String(local.resourceKey || '').trim();
    if (canonicalKey && typeof window !== 'undefined') {
        const lastLocalSyncAt = Number(window.__lmsWhiteboardLocalSyncAt?.[canonicalKey] || 0);
        if (lastLocalSyncAt > 0 && (Date.now() - lastLocalSyncAt) < LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS) return true;
        const clearAt = Number(window.__lmsWhiteboardClearAt?.[canonicalKey] || 0);
        if (clearAt > 0 && (Date.now() - clearAt) < LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS) return true;
    }
    if (localVersion > remoteVersionNum) return true;
    if (localElements.length > remoteElements.length && localVersion >= remoteVersionNum) return true;
    const localIds = new Set(localElements.map(element => String(element?.id || '').trim()).filter(Boolean));
    const remoteIds = new Set(remoteElements.map(element => String(element?.id || '').trim()).filter(Boolean));
    if (localIds.size > remoteIds.size && localVersion >= remoteVersionNum) {
        let remoteIsSubset = true;
        remoteIds.forEach(id => {
            if (!localIds.has(id)) remoteIsSubset = false;
        });
        if (remoteIsSubset) return true;
    }
    return false;
}

// Session/permission fields must not be clobbered by a stale forceRemote fetch while a local
// session-start/end (or unlock) is still dirty / in the local-sync echo window.
function shouldKeepLocalLmsWhiteboardSessionMeta(local = {}, remoteVersion = 0, forceRemote = false) {
    if (!local) return false;
    const localVersion = Number(local.version) || 0;
    const remoteVersionNum = Number(remoteVersion) || 0;
    if (local.ui?.dirty) return true;
    if (local.ui?.inGesture) return true;
    if (local.ui?.syncing) return true;
    if (Array.isArray(local.ui?.pendingOps) && local.ui.pendingOps.length) return true;
    if (localVersion > remoteVersionNum) return true;
    if (!forceRemote) return false;
    const canonicalKey = String(local.resourceKey || '').trim();
    if (canonicalKey && typeof window !== 'undefined') {
        const lastLocalSyncAt = Number(window.__lmsWhiteboardLocalSyncAt?.[canonicalKey] || 0);
        if (lastLocalSyncAt > 0 && (Date.now() - lastLocalSyncAt) < LMS_WHITEBOARD_LOCAL_SYNC_ECHO_MS) return true;
    }
    return false;
}

function applyLmsWhiteboardWorkspace(resourceKey = '', remoteWorkspace = {}, options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const local = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (!local || !remoteWorkspace || typeof remoteWorkspace !== 'object') return local;
    const remoteVersion = Number(remoteWorkspace.version) || 0;
    const localVersion = Number(local.version) || 0;
    const forceRemote = options.forceRemote === true;
    if (!forceRemote && remoteVersion < localVersion) return local;
    if (!forceRemote && local.ui?.dirty && remoteVersion <= localVersion) return local;
    const remoteElements = Array.isArray(remoteWorkspace.elements) ? remoteWorkspace.elements : [];
    const keepLocalElements = shouldKeepLocalLmsWhiteboardElements(local, remoteElements, remoteVersion, forceRemote);
    const keepLocalSessionMeta = shouldKeepLocalLmsWhiteboardSessionMeta(local, remoteVersion, forceRemote);
    if (!keepLocalElements) {
        local.version = remoteVersion;
        local.elements = remoteElements.slice();
    } else if (remoteVersion > localVersion) {
        local.version = remoteVersion;
    }
    flattenLmsWhiteboardLegacyTemplateElements(local);
    if (!keepLocalSessionMeta) {
        local.editingEnabled = Boolean(remoteWorkspace.editingEnabled);
        local.editControlUserIds = Array.isArray(remoteWorkspace.editControlUserIds)
            ? remoteWorkspace.editControlUserIds.map(id => String(id || '').trim()).filter(Boolean)
            : [];
        local.deleteStaffElementsUserIds = Array.isArray(remoteWorkspace.deleteStaffElementsUserIds)
            ? remoteWorkspace.deleteStaffElementsUserIds.map(id => String(id || '').trim()).filter(Boolean)
            : [];
        local.sessionActive = Boolean(remoteWorkspace.sessionActive);
        local.sessionStartedAt = String(remoteWorkspace.sessionStartedAt || '');
        local.sessionStartedBy = String(remoteWorkspace.sessionStartedBy || '');
    }
    // Personal dashboard share fields must survive load/apply (not gated on session meta).
    if (remoteWorkspace.staffShare !== undefined || remoteWorkspace.staffShareLevel !== undefined
        || remoteWorkspace.shareLevel !== undefined) {
        const share = String(
            remoteWorkspace.staffShare
            || remoteWorkspace.staffShareLevel
            || remoteWorkspace.shareLevel
            || 'none'
        ).trim() || 'none';
        local.staffShare = share;
        local.staffShareLevel = String(
            remoteWorkspace.staffShareLevel || remoteWorkspace.shareLevel || share
        ).trim() || share;
        local.shareLevel = String(
            remoteWorkspace.shareLevel || remoteWorkspace.staffShareLevel || share
        ).trim() || share;
    }
    if (remoteWorkspace.groupShare !== undefined) {
        local.groupShare = String(remoteWorkspace.groupShare || 'none').trim() || 'none';
    }
    if (remoteWorkspace.peerShares !== undefined) {
        const source = remoteWorkspace.peerShares && typeof remoteWorkspace.peerShares === 'object'
            && !Array.isArray(remoteWorkspace.peerShares)
            ? remoteWorkspace.peerShares
            : {};
        local.peerShares = { ...source };
    }
    if (Array.isArray(remoteWorkspace.snapshots)) {
        local.snapshots = JSON.parse(JSON.stringify(remoteWorkspace.snapshots));
    }
    if (remoteWorkspace.activity && typeof remoteWorkspace.activity === 'object') {
        local.activity = JSON.parse(JSON.stringify(remoteWorkspace.activity));
    }
    local.updatedAt = String(remoteWorkspace.updatedAt || '');
    local.updatedBy = String(remoteWorkspace.updatedBy || '');
    if (!keepLocalElements && !keepLocalSessionMeta) {
        local.ui.dirty = false;
        local.ui.syncError = '';
    }
    return local;
}

function buildLmsWhiteboardSyncPayload(resourceKey = '', options = {}) {
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    if (!workspace) return null;
    const snapshot = stripLmsWhiteboardPersistedUi(workspace);
    if (options.clearBoard === true) {
        snapshot.clearBoard = true;
        snapshot.elements = [];
        snapshot.activity = {};
    }
    if (typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(resourceKey)) {
        snapshot.replaceElements = true;
    }
    return snapshot;
}

async function runImmediateLmsWhiteboardSync(resourceKey = '', reason = 'whiteboard', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof syncLmsWhiteboardWorkspace !== 'function') return null;
    if (!shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return null;
    markLmsWhiteboardLocalSync(canonicalKey);
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (workspace.ui?.syncTimer) {
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
    }
    workspace.ui.syncGeneration = Number(workspace.ui.syncGeneration || 0) + 1;
    const syncGeneration = workspace.ui.syncGeneration;
    let syncPromise = null;
    const executeSync = async () => {
        const latest = ensureLmsWhiteboardWorkspace(canonicalKey);
        if (Number(latest.ui.syncGeneration || 0) !== syncGeneration) return null;
        if (!shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return null;
        if (!latest?.ui?.dirty && !latest?.ui?.syncing) return null;
        latest.ui.syncing = true;
        const payload = buildLmsWhiteboardSyncPayload(canonicalKey, options);
        try {
            const saved = await syncLmsWhiteboardWorkspace(canonicalKey, payload, reason);
            const current = ensureLmsWhiteboardWorkspace(canonicalKey);
            if (Number(current.ui.syncGeneration || 0) !== syncGeneration) return null;
            if (saved) {
                applyLmsWhiteboardWorkspace(canonicalKey, saved, { forceRemote: true });
                current.ui.lastServerSyncAt = Date.now();
                current.ui.accessDenied = false;
                current.ui.routeUnavailable = false;
                current.ui.syncError = '';
                if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey)
                    && typeof scheduleLmsPersonalDashboardAutosave === 'function') {
                    scheduleLmsPersonalDashboardAutosave(canonicalKey);
                }
            }
            current.ui.dirty = false;
            if (typeof window.invalidateLmsWhiteboardTabCache === 'function') {
                window.invalidateLmsWhiteboardTabCache(canonicalKey);
            }
            return saved;
        } catch (error) {
            const current = ensureLmsWhiteboardWorkspace(canonicalKey);
            if (Number(current.ui.syncGeneration || 0) !== syncGeneration) return null;
            const status = Number(error?.status || error?.httpStatus || 0);
            if (status === 404) {
                markLmsWhiteboardRouteUnavailable(canonicalKey, error?.message || LMS_WHITEBOARD_ROUTE_UNAVAILABLE_MESSAGE);
            } else if (status === 403) {
                markLmsWhiteboardAccessDenied(canonicalKey, error?.message || 'You are not allowed to edit this whiteboard.');
            } else {
                current.ui.syncError = error?.message || 'Whiteboard could not be saved.';
            }
            return null;
        } finally {
            const current = ensureLmsWhiteboardWorkspace(canonicalKey);
            if (Number(current.ui.syncGeneration || 0) === syncGeneration) {
                current.ui.syncing = false;
            }
            if (typeof window !== 'undefined') {
                window.__lmsWhiteboardSyncPromises = window.__lmsWhiteboardSyncPromises || {};
                if (window.__lmsWhiteboardSyncPromises[canonicalKey] === syncPromise) {
                    delete window.__lmsWhiteboardSyncPromises[canonicalKey];
                }
            }
            if (!options.deferUiRefresh && isLmsWhiteboardActiveTab()) {
                invokeRefreshLmsWhiteboardUi(canonicalKey, { skipLoad: true });
            }
        }
    };
    const previousPromise = typeof window !== 'undefined'
        ? window.__lmsWhiteboardSyncPromises?.[canonicalKey]
        : null;
    syncPromise = previousPromise
        ? previousPromise.catch(() => null).then(executeSync)
        : executeSync();
    if (typeof window !== 'undefined') {
        window.__lmsWhiteboardSyncPromises = window.__lmsWhiteboardSyncPromises || {};
        window.__lmsWhiteboardSyncPromises[canonicalKey] = syncPromise;
    }
    return syncPromise;
}

function queueLmsWhiteboardBackendSync(resourceKey = '', reason = 'whiteboard', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    workspace.ui.syncing = true;
    clearTimeout(workspace.ui.syncTimer);
    workspace.ui.syncTimer = setTimeout(() => {
        workspace.ui.syncTimer = null;
        runImmediateLmsWhiteboardSync(canonicalKey, reason, options);
    }, LMS_WHITEBOARD_SYNC_DEBOUNCE_MS);
}

function shouldUseLmsWhiteboardOpsSync(resourceKey = '') {
    return typeof canManageLmsWhiteboard === 'function'
        && !canManageLmsWhiteboard(resourceKey)
        && typeof canEditLmsWhiteboard === 'function'
        && canEditLmsWhiteboard(resourceKey);
}

function queueLmsWhiteboardOpsSync(resourceKey = '', ops = [], reason = 'whiteboard-ops') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    const nextOps = Array.isArray(ops) ? ops : [];
    if (!nextOps.length) return;
    workspace.ui.pendingOps = Array.isArray(workspace.ui.pendingOps) ? workspace.ui.pendingOps : [];
    workspace.ui.pendingOps.push(...nextOps);
    workspace.ui.dirty = true;
    workspace.ui.syncing = true;
    workspace.version = (Number(workspace.version) || 0) + 1;
    if (typeof window.invalidateLmsWhiteboardTabCache === 'function') {
        window.invalidateLmsWhiteboardTabCache(canonicalKey);
    }
    clearTimeout(workspace.ui.opsTimer);
    workspace.ui.opsTimer = setTimeout(() => {
        workspace.ui.opsTimer = null;
        runImmediateLmsWhiteboardOpsSync(canonicalKey, reason);
    }, LMS_WHITEBOARD_SYNC_DEBOUNCE_MS);
}

async function runImmediateLmsWhiteboardOpsSync(resourceKey = '', reason = 'whiteboard-ops', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof submitLmsWhiteboardOps !== 'function') return null;
    if (!shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return null;
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    const pendingOps = Array.isArray(workspace.ui.pendingOps) ? workspace.ui.pendingOps.slice() : [];
    if (!pendingOps.length) return null;
    markLmsWhiteboardLocalSync(canonicalKey);
    if (workspace.ui.opsTimer) {
        clearTimeout(workspace.ui.opsTimer);
        workspace.ui.opsTimer = null;
    }
    workspace.ui.opsGeneration = Number(workspace.ui.opsGeneration || 0) + 1;
    const opsGeneration = workspace.ui.opsGeneration;
    workspace.ui.syncing = true;
    try {
        const saved = await submitLmsWhiteboardOps(canonicalKey, pendingOps, reason);
        const current = ensureLmsWhiteboardWorkspace(canonicalKey);
        if (Number(current.ui.opsGeneration || 0) !== opsGeneration) return null;
        current.ui.pendingOps = [];
        if (saved) {
            applyLmsWhiteboardWorkspace(canonicalKey, saved, { forceRemote: true });
            current.ui.lastServerSyncAt = Date.now();
            current.ui.accessDenied = false;
            current.ui.routeUnavailable = false;
            current.ui.syncError = '';
            if (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey)
                && typeof scheduleLmsPersonalDashboardAutosave === 'function') {
                scheduleLmsPersonalDashboardAutosave(canonicalKey);
            }
        }
        current.ui.dirty = false;
        if (typeof window.invalidateLmsWhiteboardTabCache === 'function') {
            window.invalidateLmsWhiteboardTabCache(canonicalKey);
        }
        return saved;
    } catch (error) {
        const current = ensureLmsWhiteboardWorkspace(canonicalKey);
        if (Number(current.ui.opsGeneration || 0) !== opsGeneration) return null;
        const status = Number(error?.status || error?.httpStatus || 0);
        if (status === 404) {
            markLmsWhiteboardRouteUnavailable(canonicalKey, error?.message || LMS_WHITEBOARD_ROUTE_UNAVAILABLE_MESSAGE);
        } else if (status === 403) {
            markLmsWhiteboardAccessDenied(canonicalKey, error?.message || 'You are not allowed to edit this whiteboard.');
        } else {
            current.ui.syncError = error?.message || 'Whiteboard could not be saved.';
        }
        return null;
    } finally {
        const current = ensureLmsWhiteboardWorkspace(canonicalKey);
        if (Number(current.ui.opsGeneration || 0) === opsGeneration) {
            current.ui.syncing = false;
        }
        if (!options.deferUiRefresh && isLmsWhiteboardActiveTab()) {
            invokeRefreshLmsWhiteboardUi(canonicalKey, { skipLoad: true });
        }
    }
}

function saveLmsWhiteboardChange(resourceKey = '', reason = 'whiteboard', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (!workspace) return;
    workspace.ui.dirty = true;
    workspace.version = (Number(workspace.version) || 0) + 1;
    if (reason === 'clear-board') {
        bumpLmsWhiteboardLoadGeneration(canonicalKey);
    }
    if (options.skipBackendSync === true) return;
    if (!shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return;
    if (typeof window.invalidateLmsWhiteboardTabCache === 'function') {
        window.invalidateLmsWhiteboardTabCache(canonicalKey);
    }
    const ops = Array.isArray(options.ops)
        ? options.ops
        : (options.op ? [options.op] : []);
    if (shouldUseLmsWhiteboardOpsSync(canonicalKey) && ops.length && options.forceFullSync !== true) {
        queueLmsWhiteboardOpsSync(canonicalKey, ops, reason);
        return;
    }
    const immediateSessionReason = reason === 'session-start'
        || reason === 'session-end'
        || reason === 'unlock-editing'
        || reason === 'lock-editing';
    if (options.immediate === true || reason === 'clear-board' || immediateSessionReason) {
        if (workspace.ui.syncTimer) {
            clearTimeout(workspace.ui.syncTimer);
            workspace.ui.syncTimer = null;
        }
        runImmediateLmsWhiteboardSync(canonicalKey, reason, {
            ...options,
            clearBoard: options.clearBoard === true || reason === 'clear-board'
        });
        return;
    }
    queueLmsWhiteboardBackendSync(canonicalKey, reason, options);
}

function flushLmsWhiteboardSync(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (canonicalKey) {
        if (!shouldSyncLmsWhiteboardWorkspace(canonicalKey)) return Promise.resolve(null);
        const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
        const hasPendingOps = Array.isArray(workspace.ui.pendingOps) && workspace.ui.pendingOps.length > 0;
        if (!workspace?.ui?.dirty && !workspace?.ui?.syncing && !workspace?.ui?.syncTimer && !hasPendingOps) {
            return Promise.resolve(null);
        }
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
        if (hasPendingOps) {
            return runImmediateLmsWhiteboardOpsSync(canonicalKey, 'navigation-flush');
        }
        return runImmediateLmsWhiteboardSync(canonicalKey, 'navigation-flush');
    }
    const keys = Object.keys(KIU_STATE.lmsWhiteboards || {});
    return Promise.all(keys.map(key => flushLmsWhiteboardSync(key)));
}

function loadLmsWhiteboardWorkspace(resourceKey = '', options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || typeof fetchLmsWhiteboardWorkspace !== 'function') return Promise.resolve(null);
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (!options.force && workspace.ui.routeUnavailable) return Promise.resolve(null);
    if (!options.force && workspace.ui.accessDenied) return Promise.resolve(null);
    if (!options.force && workspace.ui.loadingFromBackend) {
        const pending = typeof window !== 'undefined' ? window.__lmsWhiteboardLoadPromises?.[canonicalKey] : null;
        if (pending) return pending;
        return Promise.resolve(null);
    }
    if (!options.force && !shouldReloadLmsWhiteboardFromBackend(workspace, canonicalKey, options)) {
        return Promise.resolve(null);
    }
    const loadGeneration = bumpLmsWhiteboardLoadGeneration(canonicalKey);
    workspace.ui.loadingFromBackend = true;
    const fetchPromise = fetchLmsWhiteboardWorkspace(canonicalKey)
        .then(remoteWorkspace => {
            if (!isCurrentLmsWhiteboardLoadGeneration(canonicalKey, loadGeneration)) return null;
            if (remoteWorkspace) {
                applyLmsWhiteboardWorkspace(canonicalKey, remoteWorkspace, {
                    forceRemote: options.forceRemote === true
                });
            }
            const latest = ensureLmsWhiteboardWorkspace(canonicalKey);
            latest.ui.loadedFromBackend = true;
            latest.ui.lastServerSyncAt = Date.now();
            latest.ui.accessDenied = false;
            latest.ui.routeUnavailable = false;
            latest.ui.syncError = '';
            repaintLmsWhiteboardAfterBackendLoad(canonicalKey);
            return remoteWorkspace;
        })
        .catch(error => {
            if (!isCurrentLmsWhiteboardLoadGeneration(canonicalKey, loadGeneration)) return null;
            const latest = ensureLmsWhiteboardWorkspace(canonicalKey);
            const status = Number(error?.status || error?.httpStatus || 0);
            if (status === 404) {
                markLmsWhiteboardRouteUnavailable(canonicalKey, error?.message || LMS_WHITEBOARD_ROUTE_UNAVAILABLE_MESSAGE);
            } else if (status === 403) {
                markLmsWhiteboardAccessDenied(canonicalKey, error?.message || 'You are not assigned to this course scope.');
            } else if (error?.code === 'KIU_PORTAL_SESSION_REQUIRED' || status === 401) {
                latest.ui.syncError = 'Sign in through the portal to sync this board. Local editing is available until you reconnect.';
            } else {
                latest.ui.syncError = error?.message || 'Whiteboard could not be loaded.';
            }
            repaintLmsWhiteboardAfterBackendLoad(canonicalKey);
            return null;
        })
        .finally(() => {
            if (!isCurrentLmsWhiteboardLoadGeneration(canonicalKey, loadGeneration)) return;
            ensureLmsWhiteboardWorkspace(canonicalKey).ui.loadingFromBackend = false;
        });
    if (typeof window !== 'undefined') {
        window.__lmsWhiteboardLoadPromises = window.__lmsWhiteboardLoadPromises || {};
        window.__lmsWhiteboardLoadPromises[canonicalKey] = fetchPromise;
        fetchPromise.finally(() => {
            if (window.__lmsWhiteboardLoadPromises?.[canonicalKey] === fetchPromise) {
                delete window.__lmsWhiteboardLoadPromises[canonicalKey];
            }
        });
    }
    return fetchPromise;
}

function handleLmsWhiteboardRealtimeUpdate(payload = {}) {
    const resourceKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(payload.resourceKey || '')
        : String(payload.resourceKey || '').trim();
    if (!resourceKey || (typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(resourceKey))) return;
    if (!resourceKey || shouldIgnoreLmsWhiteboardRealtimeUpdate(resourceKey)) return;
    if (typeof window !== 'undefined') {
        window.__lmsWhiteboardRealtimeTimers = window.__lmsWhiteboardRealtimeTimers || {};
        if (window.__lmsWhiteboardRealtimeTimers[resourceKey]) {
            clearTimeout(window.__lmsWhiteboardRealtimeTimers[resourceKey]);
        }
        window.__lmsWhiteboardRealtimeTimers[resourceKey] = setTimeout(() => {
            window.__lmsWhiteboardRealtimeTimers[resourceKey] = null;
            if (shouldIgnoreLmsWhiteboardRealtimeUpdate(resourceKey)) return;
            const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
            if (workspace?.ui?.dirty || workspace?.ui?.inGesture || workspace?.ui?.syncing || workspace?.ui?.routeUnavailable) return;
            loadLmsWhiteboardWorkspace(resourceKey, {
                force: true,
                forceRemote: true,
                render: true
            });
        }, LMS_WHITEBOARD_REALTIME_DEBOUNCE_MS);
    }
}

function endLmsWhiteboardSession(resourceKey = '') {
    if (!canManageLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    workspace.sessionActive = false;
    workspace.editingEnabled = false;
    // Immediate sync so students leave the board as soon as staff ends the session.
    saveLmsWhiteboardChange(resourceKey, 'session-end', { immediate: true });
    // In-place (no forceStructuralRender): session-only layout delta → chrome update, canvas is never
    // rebuilt, so drawings stay on the board through end just like start.
    invokeRefreshLmsWhiteboardUi(resourceKey, { skipLoad: true });
}

function startLmsWhiteboardSession(resourceKey = '') {
    if (!canManageLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const userId = typeof getCurrentUserId === 'function' ? String(getCurrentUserId() || '').trim() : '';
    workspace.sessionActive = true;
    workspace.sessionStartedAt = new Date().toISOString();
    workspace.sessionStartedBy = userId;
    // Starting a session must never yank the board into fullscreen — clear any persisted fullscreen state first.
    if (typeof exitLmsWhiteboardFullscreen === 'function') exitLmsWhiteboardFullscreen();
    // Immediate sync so students leave "session has not started" as soon as staff starts.
    saveLmsWhiteboardChange(resourceKey, 'session-start', { immediate: true });
    // No forceStructuralRender: the session-only layout delta triggers an in-place chrome update
    // (banner swap + is-session-active), so the canvas is never rebuilt and nothing jumps visually.
    invokeRefreshLmsWhiteboardUi(resourceKey, { skipLoad: true });
}

function setLmsWhiteboardEditingEnabled(resourceKey = '', enabled = false) {
    if (!canManageLmsWhiteboard(resourceKey)) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    workspace.editingEnabled = Boolean(enabled);
    if (workspace.editingEnabled && !workspace.sessionActive) {
        startLmsWhiteboardSession(resourceKey);
        return;
    }
    saveLmsWhiteboardChange(resourceKey, enabled ? 'unlock-editing' : 'lock-editing');
    invokeRefreshLmsWhiteboardUi(resourceKey, { skipLoad: true });
}

function setLmsWhiteboardStudentControl(resourceKey = '', userId = '', allowed = false) {
    if (!canManageLmsWhiteboard(resourceKey)) return;
    const targetId = String(userId || '').trim();
    if (!targetId) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const current = Array.isArray(workspace.editControlUserIds) ? workspace.editControlUserIds : [];
    workspace.editControlUserIds = allowed
        ? [...new Set([...current, targetId])]
        : current.filter(id => id !== targetId);
    saveLmsWhiteboardChange(resourceKey, allowed ? 'grant-student-control' : 'revoke-student-control');
    invokeRefreshLmsWhiteboardUi(resourceKey, { skipLoad: true });
}

function setLmsWhiteboardStudentDeleteStaffElements(resourceKey = '', userId = '', allowed = false) {
    if (!canManageLmsWhiteboard(resourceKey)) return;
    const targetId = String(userId || '').trim();
    if (!targetId) return;
    const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
    const current = Array.isArray(workspace.deleteStaffElementsUserIds) ? workspace.deleteStaffElementsUserIds : [];
    workspace.deleteStaffElementsUserIds = allowed
        ? [...new Set([...current, targetId])]
        : current.filter(id => id !== targetId);
    saveLmsWhiteboardChange(resourceKey, allowed ? 'grant-student-delete-staff' : 'revoke-student-delete-staff');
    invokeRefreshLmsWhiteboardUi(resourceKey, { skipLoad: true });
}

function clearLmsWhiteboardBoard(resourceKey = '') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const isPersonal = typeof isLmsPersonalBoardKey === 'function' && isLmsPersonalBoardKey(canonicalKey);
    const isPersonalOwner = isPersonal
        && typeof isLmsPersonalBoardOwner === 'function'
        && isLmsPersonalBoardOwner(canonicalKey);
    // Personal boards: any collaborator with edit (owner or shared edit) may clear.
    if (isPersonal) {
        if (!canEditLmsWhiteboard(canonicalKey)) return;
    } else if (!isPersonalOwner && !canManageLmsWhiteboard(resourceKey)) {
        return;
    }
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    if (!workspace) return;
    bumpLmsWhiteboardLoadGeneration(canonicalKey);
    markLmsWhiteboardClearAt(canonicalKey);
    markLmsWhiteboardLocalSync(canonicalKey);
    workspace.elements = [];
    workspace.activity = {};
    if (typeof window.__lmsWhiteboardViewportFitted === 'object' && window.__lmsWhiteboardViewportFitted) {
        delete window.__lmsWhiteboardViewportFitted[canonicalKey];
    }
    if (typeof resetLmsWhiteboardHistory === 'function') resetLmsWhiteboardHistory(canonicalKey);
    else if (typeof resetLmsWhiteboardHistory === 'function') resetLmsWhiteboardHistory(canonicalKey);
    if (typeof setLmsWhiteboardSelection === 'function') setLmsWhiteboardSelection([], { skipPaint: true });
    if (typeof window.resetLmsWhiteboardViewport === 'function') {
        window.resetLmsWhiteboardViewport(canonicalKey);
    } else {
        const activeCanvas = typeof window.getActiveLmsWhiteboardShell === 'function'
            ? window.getActiveLmsWhiteboardShell(canonicalKey)?.querySelector('.lms-whiteboard-canvas')
            : null;
        if (typeof window.repaintLmsWhiteboardWorkspace === 'function') {
            window.repaintLmsWhiteboardWorkspace(canonicalKey, activeCanvas || null);
        } else {
            if (typeof paintLmsWhiteboardCanvas === 'function') paintLmsWhiteboardCanvas(canonicalKey, activeCanvas || null);
            if (typeof syncLmsWhiteboardDocumentLayer === 'function') syncLmsWhiteboardDocumentLayer(canonicalKey, activeCanvas || null);
        }
    }
    saveLmsWhiteboardChange(canonicalKey, 'clear-board', { forceFullSync: true, clearBoard: true, immediate: true });
    invokeRefreshLmsWhiteboardUi(canonicalKey, { skipLoad: true });
}

function appendLmsWhiteboardElements(resourceKey = '', elements = [], reason = 'elements-appended') {
    if (!canManageLmsWhiteboard(resourceKey)) return;
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const workspace = ensureLmsWhiteboardWorkspace(canonicalKey);
    const next = Array.isArray(elements) ? elements : [];
    if (!next.length) return;
    if (!workspace.sessionActive) {
        const userId = typeof getCurrentUserId === 'function' ? String(getCurrentUserId() || '').trim() : '';
        workspace.sessionActive = true;
        workspace.sessionStartedAt = new Date().toISOString();
        workspace.sessionStartedBy = userId;
    }
    workspace.elements = [...(workspace.elements || []), ...next];
    saveLmsWhiteboardChange(canonicalKey, reason);
    invokeRefreshLmsWhiteboardUi(canonicalKey, { skipLoad: true });
}

function openLmsWhiteboardFromCalls(options = {}) {
    const resourceKey = typeof getLmsTabCourseKey === 'function'
        ? getLmsTabCourseKey('whiteboard')
        : (typeof resolveCanonicalLmsResourceKey === 'function' ? resolveCanonicalLmsResourceKey(currentCourseId) : currentCourseId);
    if (!resourceKey) return;
    if (typeof canManageLmsWhiteboard === 'function' && canManageLmsWhiteboard(resourceKey)) {
        const workspace = ensureLmsWhiteboardWorkspace(resourceKey);
        if (!workspace.sessionActive) startLmsWhiteboardSession(resourceKey);
        if (options.unlock !== false && !workspace.editingEnabled) {
            setLmsWhiteboardEditingEnabled(resourceKey, true);
        }
    }
    if (typeof switchLMSTab === 'function') switchLMSTab('whiteboard');
}

__kiuWbWsExpose({
    LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES,
    ensureLmsWhiteboardWorkspace,
    getLmsWhiteboardWorkspaceSafe,
    canEditLmsWhiteboard,
    canEditLmsWhiteboardElement,
    canMoveLmsWhiteboardElement,
    canManageLmsWhiteboard,
    saveLmsWhiteboardChange,
    flushLmsWhiteboardSync,
    loadLmsWhiteboardWorkspace,
    resetLmsWhiteboardAccessState,
    handleLmsWhiteboardRealtimeUpdate,
    startLmsWhiteboardSession,
    endLmsWhiteboardSession,
    scheduleLmsWhiteboardSessionWaitPoll,
    stopLmsWhiteboardSessionWaitPoll,
    shouldKeepLocalLmsWhiteboardSessionMeta,
    queueLmsWhiteboardOpsSync,
    runImmediateLmsWhiteboardOpsSync,
    runImmediateLmsWhiteboardSync,
    setLmsWhiteboardEditingEnabled,
    clearLmsWhiteboardBoard,
    openLmsWhiteboardFromCalls,
    applyLmsWhiteboardWorkspace,
    shouldSyncLmsWhiteboardWorkspace,
    shouldReloadLmsWhiteboardFromBackend,
    shouldIgnoreLmsWhiteboardRealtimeUpdate,
    flattenLmsWhiteboardLegacyTemplateElements,
    isCurrentLmsWhiteboardLoadGeneration,
});
