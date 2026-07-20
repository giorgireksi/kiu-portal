/* Shared LMS workspace sync timing + pure helpers (whiteboard + live-quiz).
 * Domain-specific queue/save/load stay in each runtime.
 */
(function initLmsWorkspaceSyncTiming() {
    'use strict';
    if (window.__KIU_LMS_WORKSPACE_SYNC_TIMING__) return;

    const timing = {
        SYNC_DEBOUNCE_MS: 350,
        REALTIME_DEBOUNCE_MS: 150,
        LOCAL_SYNC_ECHO_MS: 1500,
        BACKEND_RELOAD_TTL_MS: 120000
    };
    window.__KIU_LMS_WORKSPACE_SYNC_TIMING__ = timing;
    window.LMS_WORKSPACE_SYNC_DEBOUNCE_MS = timing.SYNC_DEBOUNCE_MS;
    window.LMS_WORKSPACE_REALTIME_DEBOUNCE_MS = timing.REALTIME_DEBOUNCE_MS;
    window.LMS_WORKSPACE_LOCAL_SYNC_ECHO_MS = timing.LOCAL_SYNC_ECHO_MS;
    window.LMS_WORKSPACE_BACKEND_RELOAD_TTL_MS = timing.BACKEND_RELOAD_TTL_MS;

    /**
     * Stamp local-sync time on a window bucket map.
     * @param {string} bucketProp e.g. '__lmsWhiteboardLocalSyncAt'
     * @param {string} canonicalKey
     * @returns {number} timestamp
     */
    function markLmsWorkspaceLocalSyncAt(bucketProp, canonicalKey) {
        if (!canonicalKey || typeof window === 'undefined' || !bucketProp) return 0;
        const now = Date.now();
        window[bucketProp] = window[bucketProp] || {};
        window[bucketProp][canonicalKey] = now;
        return now;
    }

    /**
     * True if still inside local-sync echo window for key.
     */
    function isLmsWorkspaceLocalSyncEcho(bucketProp, canonicalKey, echoMs) {
        if (!canonicalKey || typeof window === 'undefined') return false;
        const map = window[bucketProp] || {};
        const last = Number(map[canonicalKey] || 0);
        const ttl = Number(echoMs) || timing.LOCAL_SYNC_ECHO_MS;
        return last > 0 && (Date.now() - last) < ttl;
    }

    /**
     * Generic backend reload gate: force, missing lastServerSyncAt, or TTL expired.
     * @param {object} workspace
     * @param {object} options
     * @param {number} [ttlMs]
     * @param {() => boolean} [extraForce] optional extra force (e.g. live session)
     * @param {(ws, opts) => boolean} [extraBlock] optional block reload (e.g. route unavailable)
     */
    function shouldReloadLmsWorkspaceFromBackend(workspace = {}, options = {}, ttlMs, extraForce, extraBlock) {
        if (options.force === true) return true;
        if (typeof extraForce === 'function' && extraForce()) return true;
        if (typeof extraBlock === 'function' && extraBlock(workspace, options)) return false;
        const lastServerSyncAt = Number(workspace.ui?.lastServerSyncAt || 0);
        if (!Number.isFinite(lastServerSyncAt) || lastServerSyncAt <= 0) return true;
        const ttl = Number(ttlMs) || timing.BACKEND_RELOAD_TTL_MS;
        return (Date.now() - lastServerSyncAt) > ttl;
    }

    window.markLmsWorkspaceLocalSyncAt = markLmsWorkspaceLocalSyncAt;
    window.isLmsWorkspaceLocalSyncEcho = isLmsWorkspaceLocalSyncEcho;
    window.shouldReloadLmsWorkspaceFromBackendGeneric = shouldReloadLmsWorkspaceFromBackend;
})();
