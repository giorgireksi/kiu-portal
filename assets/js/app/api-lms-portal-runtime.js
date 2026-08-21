/* LMS live-quiz / whiteboard / personal-dashboard / exam-portal / social-bootstrap API helpers. Peeled from api.js.
 * Load before api.js.
 */
(function initApiLmsPortalRuntime() {
    if (window.__KIU_API_LMS_PORTAL_LOADED) return;
    window.__KIU_API_LMS_PORTAL_LOADED = true;

    window.__kiuCreateApiLmsPortalApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

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

async function submitLmsLiveQuizAnswer(resourceKey, answer = {}, reason = 'live-quiz-answer') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const payload = await kiuPortalFetch(`/api/lms/live-quizzes/${safeResourceKey}/answers`, {
        method: 'POST',
        body: JSON.stringify({
            sessionId: String(answer?.sessionId || '').trim(),
            questionId: String(answer?.questionId || '').trim(),
            selectedOption: Number.parseInt(answer?.selectedOption, 10),
            reason
        })
    });
    return payload?.workspace || null;
}

async function fetchLmsWhiteboardWorkspace(resourceKey) {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    try {
        const payload = await kiuPortalFetch(`/api/lms/whiteboards/${safeResourceKey}`, {
            suppressDiagnostic: true
        });
        return payload?.workspace || null;
    } catch (error) {
        if (Number(error?.status) === 404) {
            error.code = 'LMS_WHITEBOARD_ROUTE_MISSING';
        }
        throw error;
    }
}

async function syncLmsWhiteboardWorkspace(resourceKey, workspace = {}, reason = 'whiteboard') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    try {
        const payload = await kiuPortalFetch(`/api/lms/whiteboards/${safeResourceKey}`, {
            method: 'POST',
            suppressDiagnostic: true,
            body: JSON.stringify({
                workspace: workspace && typeof workspace === 'object' ? workspace : {},
                reason
            })
        });
        return payload?.workspace || null;
    } catch (error) {
        if (Number(error?.status) === 404) {
            error.code = 'LMS_WHITEBOARD_ROUTE_MISSING';
        }
        throw error;
    }
}

async function fetchLmsPersonalDashboardHistory(courseId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return null;
    const params = new URLSearchParams({ courseId: normalizedCourseId });
    const groupId = String(options.groupId || '').trim();
    const sectionType = String(options.sectionType || '').trim();
    if (groupId) params.set('groupId', groupId);
    if (sectionType) params.set('sectionType', sectionType);
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/history?${params.toString()}`, {
        method: 'GET',
        suppressDiagnostic: true
    });
    return response || null;
}

async function saveLmsPersonalDashboardSnapshot(resourceKey, payload = {}) {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/${safeResourceKey}/snapshots`, {
        method: 'POST',
        suppressDiagnostic: true,
        body: JSON.stringify(payload && typeof payload === 'object' ? payload : {})
    });
    return response || null;
}

async function deleteLmsPersonalDashboardSnapshot(resourceKey, snapshotId = '') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    const safeSnapshotId = encodeURIComponent(String(snapshotId || '').trim());
    if (!safeResourceKey || !safeSnapshotId) return null;
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/${safeResourceKey}/snapshots/${safeSnapshotId}`, {
        method: 'DELETE',
        suppressDiagnostic: true
    });
    return response || null;
}

async function restoreLmsPersonalDashboardSnapshot(resourceKey, snapshotId = '', options = {}) {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    const safeSnapshotId = encodeURIComponent(String(snapshotId || '').trim());
    if (!safeResourceKey || !safeSnapshotId) return null;
    const sourceResourceKey = String(options.sourceResourceKey || resourceKey || '').trim();
    const targetResourceKey = String(options.targetResourceKey || resourceKey || '').trim();
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/${safeResourceKey}/snapshots/${safeSnapshotId}/restore`, {
        method: 'POST',
        suppressDiagnostic: true,
        body: JSON.stringify({
            sourceResourceKey,
            targetResourceKey
        })
    });
    return response || null;
}

async function patchLmsPersonalDashboardWorkspaceShare(resourceKey, staffShareOrPayload = 'none') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const body = staffShareOrPayload && typeof staffShareOrPayload === 'object' && !Array.isArray(staffShareOrPayload)
        ? {
            ...(staffShareOrPayload.staffShare !== undefined
                ? { staffShare: String(staffShareOrPayload.staffShare || 'none').trim() || 'none' }
                : {}),
            ...(staffShareOrPayload.groupShare !== undefined
                ? { groupShare: String(staffShareOrPayload.groupShare || 'none').trim() || 'none' }
                : {})
        }
        : { staffShare: String(staffShareOrPayload || 'none').trim() || 'none' };
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/${safeResourceKey}/share`, {
        method: 'PATCH',
        suppressDiagnostic: true,
        body: JSON.stringify(body)
    });
    return response || null;
}

async function patchLmsPersonalDashboardPeerShares(resourceKey, peerSharesOrPayload = {}) {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const body = peerSharesOrPayload && typeof peerSharesOrPayload === 'object' && !Array.isArray(peerSharesOrPayload)
        && (peerSharesOrPayload.peerShares !== undefined || peerSharesOrPayload.userId || peerSharesOrPayload.studentId)
        ? peerSharesOrPayload
        : { peerShares: peerSharesOrPayload && typeof peerSharesOrPayload === 'object' ? peerSharesOrPayload : {} };
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/${safeResourceKey}/peer-shares`, {
        method: 'PATCH',
        suppressDiagnostic: true,
        body: JSON.stringify(body)
    });
    return response || null;
}

async function fetchLmsPersonalDashboardSharedWithMe(courseId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return null;
    const params = new URLSearchParams({ courseId: normalizedCourseId });
    const groupId = String(options.groupId || '').trim();
    const sectionType = String(options.sectionType || '').trim();
    if (groupId) params.set('groupId', groupId);
    if (sectionType) params.set('sectionType', sectionType);
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/shared-with-me?${params.toString()}`, {
        suppressDiagnostic: true
    });
    return response || null;
}

async function patchLmsPersonalDashboardSnapshotShare(resourceKey, snapshotId = '', staffShare = 'none') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    const safeSnapshotId = encodeURIComponent(String(snapshotId || '').trim());
    if (!safeResourceKey || !safeSnapshotId) return null;
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/${safeResourceKey}/snapshots/${safeSnapshotId}/share`, {
        method: 'PATCH',
        suppressDiagnostic: true,
        body: JSON.stringify({ staffShare: String(staffShare || 'none').trim() || 'none' })
    });
    return response || null;
}

async function fetchLmsPersonalDashboardShareStatus(courseId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return null;
    const params = new URLSearchParams({ courseId: normalizedCourseId });
    const groupId = String(options.groupId || '').trim();
    const sectionType = String(options.sectionType || '').trim();
    if (groupId) params.set('groupId', groupId);
    if (sectionType) params.set('sectionType', sectionType);
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/share-status?${params.toString()}`, {
        method: 'GET',
        suppressDiagnostic: true
    });
    return response || null;
}

async function fetchLmsPersonalDashboardSharedHistory(courseId = '', studentId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedCourseId || !normalizedStudentId) return null;
    const params = new URLSearchParams({ courseId: normalizedCourseId, studentId: normalizedStudentId });
    const groupId = String(options.groupId || '').trim();
    const sectionType = String(options.sectionType || '').trim();
    if (groupId) params.set('groupId', groupId);
    if (sectionType) params.set('sectionType', sectionType);
    const response = await kiuPortalFetch(`/api/lms/personal-dashboards/history?${params.toString()}`, {
        method: 'GET',
        suppressDiagnostic: true
    });
    return response || null;
}

async function submitLmsWhiteboardOps(resourceKey, ops = [], reason = 'whiteboard-ops') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    try {
        const payload = await kiuPortalFetch(`/api/lms/whiteboards/${safeResourceKey}/ops`, {
            method: 'POST',
            suppressDiagnostic: true,
            body: JSON.stringify({
                ops: Array.isArray(ops) ? ops : [],
                reason
            })
        });
        return payload?.workspace || null;
    } catch (error) {
        if (Number(error?.status) === 404) {
            error.code = 'LMS_WHITEBOARD_ROUTE_MISSING';
        }
        throw error;
    }
}

async function submitLmsWhiteboardSignal(resourceKey, signal = {}, reason = 'whiteboard-signal') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    try {
        await kiuPortalFetch(`/api/lms/whiteboards/${safeResourceKey}/signal`, {
            method: 'POST',
            suppressDiagnostic: true,
            body: JSON.stringify({
                signal: signal && typeof signal === 'object' ? signal : {},
                reason
            })
        });
        return true;
    } catch (error) {
        if (Number(error?.status) === 404) {
            error.code = 'LMS_WHITEBOARD_ROUTE_MISSING';
        }
        throw error;
    }
}

async function submitLmsLiveQuizJoin(resourceKey, join = {}, reason = 'live-quiz-join') {
    const safeResourceKey = encodeURIComponent(String(resourceKey || '').trim());
    if (!safeResourceKey) return null;
    const payload = await kiuPortalFetch(`/api/lms/live-quizzes/${safeResourceKey}/join`, {
        method: 'POST',
        body: JSON.stringify({
            sessionId: String(join?.sessionId || '').trim(),
            nickname: String(join?.nickname || '').trim(),
            joinedAt: String(join?.joinedAt || '').trim(),
            lastSeenAt: String(join?.lastSeenAt || '').trim(),
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

const protectedQuizMonitorAccessDenied = Object.create(null);

async function fetchProtectedQuizMonitor(groupKey, quizId = '') {
    const normalizedGroupKey = String(groupKey || '').trim();
    if (!normalizedGroupKey) return null;
    if (protectedQuizMonitorAccessDenied[normalizedGroupKey]) return null;
    const safeGroupKey = encodeURIComponent(normalizedGroupKey);
    const suffix = quizId ? `?quizId=${encodeURIComponent(String(quizId || '').trim())}` : '';
    try {
        const payload = await kiuPortalFetch(`/api/protected-quizzes/group/${safeGroupKey}/monitor${suffix}`, {
            suppressDiagnostic: true
        });
        return payload?.monitor || null;
    } catch (error) {
        const status = Number(error?.status || 0);
        if (status === 403 || status === 404) {
            protectedQuizMonitorAccessDenied[normalizedGroupKey] = true;
            return null;
        }
        throw error;
    }
}

function canFetchProtectedQuizMonitorFromPortal(groupKey = '') {
    const normalizedGroupKey = String(groupKey || '').trim();
    return Boolean(normalizedGroupKey) && !protectedQuizMonitorAccessDenied[normalizedGroupKey];
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

async function uploadBackgroundGalleryAsset(file, options = {}) {
    if (!file) {
        throw new Error('No file selected for upload.');
    }
    if (typeof kiuPortalFetch !== 'function') {
        throw new Error('Gallery API not loaded. Hard refresh the page.');
    }
    const target = String(options.target || 'mine').trim().toLowerCase() === 'catalog' ? 'catalog' : 'mine';
    const sourceBlob = file.blob instanceof Blob ? file.blob : (file instanceof Blob ? file : null);
    let dataUrl = String(file.dataUrl || '').trim();
    if (!dataUrl && sourceBlob) {
        try {
            dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error || new Error('read failed'));
                reader.readAsDataURL(sourceBlob);
            });
        } catch (e) {
            throw new Error('Could not read file for upload.');
        }
    }
    if (!dataUrl) {
        throw new Error('Could not read file for upload.');
    }
    const mediaType = String(file.type || sourceBlob?.type || '').startsWith('video/') ? 'video' : 'image';
    const name = file.name || 'download.bin';
    const type = file.type || sourceBlob?.type || 'application/octet-stream';
    const label = String(options.label || name || 'Background').replace(/\.[^.]+$/, '') || 'Background';
    const metadata = {
        target,
        name,
        type,
        mediaType,
        label,
        recommendedPaletteKey: options.recommendedPaletteKey || 'ocean-teal'
    };
    // Stream gallery binaries as multipart instead of embedding them in a
    // base64 JSON body. This keeps large uploads out of the Node JSON parser
    // and avoids duplicating the full asset in memory on the backend.
    const uploadBlob = sourceBlob || (file instanceof Blob ? file : null);
    if (uploadBlob && typeof FormData !== 'undefined') {
        const form = new FormData();
        Object.entries(metadata).forEach(([key, value]) => form.append(key, String(value)));
        form.append('file', uploadBlob, name);
        return kiuPortalFetch('/api/background-gallery/upload', {
            method: 'POST',
            timeoutMs: 120000,
            body: form
        });
    }
    // Keep the data-URL path for non-browser callers and older integrations.
    return kiuPortalFetch('/api/background-gallery/upload', {
        method: 'POST',
        timeoutMs: 120000,
        body: JSON.stringify({ ...metadata, dataUrl })
    });
}

function inferPortalUploadMimeType(file, sourceBlob) {
    const declared = String(file?.type || sourceBlob?.type || '').trim().toLowerCase();
    const extension = String(file?.name || '').trim().toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
    const byExtension = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        gif: 'image/gif'
    };
    if (byExtension[extension] && (!declared || declared === 'application/octet-stream' || declared === 'binary/octet-stream')) {
        return byExtension[extension];
    }
    if (declared === 'image/jpg') return 'image/jpeg';
    return declared || 'application/octet-stream';
}

async function uploadPortalStoredFile(file, scope = 'file') {
    if (!file) return null;
    const sourceBlob = file.blob instanceof Blob ? file.blob : (file instanceof Blob ? file : null);
    let dataUrl = String(file.dataUrl || '').trim();
    const activeUser = typeof getCurrentUser === 'function' ? getCurrentUser() : currentUser;
    if (!dataUrl && sourceBlob) {
        try {
            dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result || ''));
                reader.onerror = () => reject(reader.error || new Error('read failed'));
                reader.readAsDataURL(sourceBlob);
            });
        } catch (e) { dataUrl = ''; }
    }
    if (!dataUrl) return null;
    const payload = await kiuPortalFetch('/api/files/upload', {
        method: 'POST',
        timeoutMs: 30000,
        body: JSON.stringify({
            name: file.name || 'download.bin',
            type: inferPortalUploadMimeType(file, sourceBlob),
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

function getPortalStoredFileUrl(storageKey, options = {}) {
    const normalizedKey = String(storageKey || '').trim();
    if (!normalizedKey) return '';
    let base = `${getKiuPortalBackendUrl()}/api/files/${encodeURIComponent(normalizedKey)}`;
    const params = [];
    try {
        const token = (typeof getPortalSessionToken === 'function' ? getPortalSessionToken() : '') || '';
        if (token) params.push(`token=${encodeURIComponent(token)}`);
    } catch (e) {}
    const inline = options && (options.inline === true || options.inline === 1 || options.inline === '1' || options.forDisplay);
    if (inline) params.push('inline=1');
    if (params.length) base += `?${params.join('&')}`;
    return base;
}


async function fetchBackgroundGalleryCatalog() {
    const payload = await kiuPortalFetch('/api/background-gallery/catalog');
    return payload?.catalog || { images: [], videos: [] };
}

async function fetchBackgroundGalleryMine() {
    const payload = await kiuPortalFetch('/api/background-gallery/mine');
    return payload?.items || { images: [], videos: [] };
}

async function addBackgroundGalleryCatalogItem(body = {}) {
    return kiuPortalFetch('/api/background-gallery/catalog', { method: 'POST', body: JSON.stringify(body) });
}

async function addBackgroundGalleryMineItem(body = {}) {
    return kiuPortalFetch('/api/background-gallery/mine', { method: 'POST', body: JSON.stringify(body) });
}

async function deleteBackgroundGalleryCatalogItem(itemId = '') {
    return kiuPortalFetch(`/api/background-gallery/catalog/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
}

async function deleteBackgroundGalleryMineItem(itemId = '') {
    return kiuPortalFetch(`/api/background-gallery/mine/${encodeURIComponent(itemId)}`, { method: 'DELETE' });
}

async function promoteBackgroundGalleryCatalogItem(body = {}) {
    return kiuPortalFetch('/api/background-gallery/catalog/promote', { method: 'POST', body: JSON.stringify(body) });
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

function isStandaloneSocialRoute(pathname = window.location.pathname) {
    const normalizedPath = String(pathname || '').replace(/\\/g, '/').toLowerCase();
    return normalizedPath.endsWith('/social.html') || normalizedPath.endsWith('social.html');
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

        const api = {
            syncProtectedQuizRecord,
            fetchLmsLiveQuizWorkspace,
            syncLmsLiveQuizWorkspace,
            submitLmsLiveQuizAnswer,
            fetchLmsWhiteboardWorkspace,
            syncLmsWhiteboardWorkspace,
            fetchLmsPersonalDashboardHistory,
            saveLmsPersonalDashboardSnapshot,
            deleteLmsPersonalDashboardSnapshot,
            restoreLmsPersonalDashboardSnapshot,
            patchLmsPersonalDashboardWorkspaceShare,
            patchLmsPersonalDashboardPeerShares,
            fetchLmsPersonalDashboardSharedWithMe,
            patchLmsPersonalDashboardSnapshotShare,
            fetchLmsPersonalDashboardShareStatus,
            fetchLmsPersonalDashboardSharedHistory,
            submitLmsWhiteboardOps,
            submitLmsWhiteboardSignal,
            submitLmsLiveQuizJoin,
            createProtectedQuizLaunchTicket,
            fetchProtectedQuizMonitor,
            canFetchProtectedQuizMonitorFromPortal,
            fetchProtectedQuizAttempts,
            fetchProtectedQuizClientAttempt,
            postProtectedQuizHeartbeat,
            postProtectedQuizEvent,
            submitProtectedQuizAttempt,
            saveProtectedQuizManualGrade,
            performProtectedQuizStudentAction,
            syncExamSessionRecord,
            createExamPortalAuthSession,
            fetchExamPortalSessions,
            fetchExamPortalSessionSummary,
            createExamPortalLaunchTicket,
            fetchPortalSyncRuns,
            createPortalSyncRun,
            fetchPortalSyncConflicts,
            createPortalSyncConflict,
            fetchPortalAuditEvents,
            createPortalAuditEvent,
            getPortalRtcConfiguration,
            getPortalFileStorageMode,
            uploadBackgroundGalleryAsset,
            uploadPortalStoredFile,
            getPortalStoredFileUrl,
            fetchBackgroundGalleryCatalog,
            fetchBackgroundGalleryMine,
            addBackgroundGalleryCatalogItem,
            addBackgroundGalleryMineItem,
            deleteBackgroundGalleryCatalogItem,
            deleteBackgroundGalleryMineItem,
            promoteBackgroundGalleryCatalogItem,
            extractPersistableSocialHubState,
            applyPortalSocialState,
            persistPortalSocialState,
            queuePortalSocialSync,
            bootstrapPortalSocialState,
            schedulePortalSocialBootstrap,
            isStandaloneSocialRoute,
            ensurePortalSocialGroupChatRecord,
            beginMicrosoftPortalLogin,
            completeMicrosoftPortalLoginFromUrl,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateApiLmsPortalApi({});
})();
