const { nowIso } = require('../utils');
const {
    assertLmsPersonalBoardAccess,
    createEmptyLmsWhiteboardWorkspace,
    isLmsPersonalBoardKey,
    isLmsPersonalBoardOwner,
    isLmsStaffRole,
    LMS_PERSONAL_BOARD_MARKER,
    mergeStaffWhiteboardWorkspace,
    mergeStudentWhiteboardWorkspace,
    stripLmsPersonalBoardScopeKey
} = require('./lms-whiteboard-service');

const LMS_PERSONAL_STAFF_SHARE_MODES = new Set(['none', 'view', 'edit']);

const LMS_PERSONAL_AUTOSAVE_ID = 'autosave';
const LMS_PERSONAL_HISTORY_LIST_CAP = 60;

function parsePersonalScopeMeta(resourceKey = '') {
    const { scopeKey, ownerId, isPersonal } = stripLmsPersonalBoardScopeKey(resourceKey);
    if (!isPersonal) {
        return { scopeKey, ownerId, courseId: '', groupId: '', sectionType: '' };
    }
    const doubleColon = scopeKey.indexOf('::');
    const courseId = doubleColon >= 0 ? scopeKey.slice(0, doubleColon).trim() : scopeKey.trim();
    const remainder = doubleColon >= 0 ? scopeKey.slice(doubleColon + 2) : '';
    const sectionMarker = remainder.indexOf('__lmssec_');
    const groupId = sectionMarker >= 0 ? remainder.slice(0, sectionMarker).trim() : remainder.trim();
    const sectionType = sectionMarker >= 0 ? remainder.slice(sectionMarker + '__lmssec_'.length).trim() : '';
    return { scopeKey, ownerId, courseId, groupId, sectionType };
}

function formatPersonalSectionLabel(sectionType = '') {
    const normalized = String(sectionType || '').trim().toLowerCase();
    if (normalized === 'workshop') return 'Workshop';
    if (normalized === 'lecture') return 'Lecture';
    return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Section';
}

function normalizePersonalStaffShare(value = '') {
    const normalized = String(value || '').trim().toLowerCase();
    return LMS_PERSONAL_STAFF_SHARE_MODES.has(normalized) ? normalized : 'none';
}

function normalizePeerShares(value = {}) {
    const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    const next = {};
    Object.entries(source).forEach(([rawId, rawLevel]) => {
        const userId = String(rawId || '').trim();
        if (!userId) return;
        const level = normalizePersonalStaffShare(rawLevel);
        if (level === 'none') return;
        next[userId] = level;
    });
    return next;
}

function getPeerShareLevel(workspace = {}, userId = '') {
    const actorId = String(userId || '').trim();
    if (!actorId) return 'none';
    const peers = normalizePeerShares(workspace?.peerShares);
    return normalizePersonalStaffShare(peers[actorId]);
}

function getPersonalShareLevelForActor(workspace = {}, account = {}, role = '', scope = {}) {
    if (isLmsPersonalBoardOwner(String(workspace?.resourceKey || '').trim(), account)) {
        return 'edit';
    }
    const actorId = String(account?.id || account?.userId || '').trim();
    if (isLmsStaffRole(role)) {
        return getPersonalStaffShareLevel(workspace, scope);
    }
    // Classmates: max of whole-group share and explicit per-person grant.
    return maxPersonalStaffShareLevel(
        workspace?.groupShare,
        getPeerShareLevel(workspace, actorId)
    );
}

function resolvePersonalStaffShareLevel(snapshots = [], scope = {}) {
    const filterGroupId = String(scope.groupId || '').trim();
    const filterSectionType = normalizePersonalHistoryScopeValue(scope.sectionType);
    const rank = { none: 0, view: 1, edit: 2 };
    let level = 'none';
    (Array.isArray(snapshots) ? snapshots : []).forEach(snapshot => {
        if (!snapshot || snapshot.isAutosave) return;
        const share = normalizePersonalStaffShare(snapshot.staffShare);
        if (share === 'none') return;
        if (filterGroupId && String(snapshot.groupId || '').trim() !== filterGroupId) return;
        if (filterSectionType && normalizePersonalHistoryScopeValue(snapshot.sectionType) !== filterSectionType) return;
        if (rank[share] > rank[level]) level = share;
    });
    return level;
}

function maxPersonalStaffShareLevel(...levels) {
    const rank = { none: 0, view: 1, edit: 2 };
    let level = 'none';
    (Array.isArray(levels) ? levels : []).forEach((value) => {
        const normalized = normalizePersonalStaffShare(value);
        if (rank[normalized] > rank[level]) level = normalized;
    });
    return level;
}

function getPersonalStaffShareLevel(workspace = {}, scope = {}) {
    const snapshots = normalizePersonalSnapshots(
        workspace?.snapshots,
        String(workspace?.resourceKey || '').trim(),
        workspace
    );
    return maxPersonalStaffShareLevel(
        workspace?.staffShare,
        resolvePersonalStaffShareLevel(snapshots, scope)
    );
}

function filterSharedPersonalSnapshots(snapshots = []) {
    return (Array.isArray(snapshots) ? snapshots : [])
        .filter(snapshot => snapshot && !snapshot.isAutosave && normalizePersonalStaffShare(snapshot.staffShare) !== 'none');
}

function redactPersonalWorkspaceForViewer(workspace = {}, scope = {}, shareLevel = 'view') {
    const resourceKey = String(workspace?.resourceKey || '').trim();
    const normalized = ensurePersonalDashboardWorkspace(workspace, resourceKey);
    const level = normalizePersonalStaffShare(shareLevel) === 'edit' ? 'edit' : 'view';
    const sharedSnapshots = filterSharedPersonalSnapshots(
        normalizePersonalSnapshots(normalized.snapshots, resourceKey, normalized)
    ).filter(snapshot => matchesPersonalDashboardHistoryScope(snapshot, scope));
    return {
        ...normalized,
        // Non-owners must not reconfigure sharing grants.
        peerShares: {},
        staffShare: level === 'edit' || level === 'view' ? normalizePersonalStaffShare(normalized.staffShare) : 'none',
        groupShare: 'none',
        snapshots: sharedSnapshots,
        staffShareLevel: level,
        shareLevel: level
    };
}

function redactPersonalWorkspaceForStaffViewer(workspace = {}, scope = {}) {
    const level = getPersonalStaffShareLevel(workspace, scope);
    return redactPersonalWorkspaceForViewer(workspace, scope, level);
}

function assertLmsPersonalBoardReadAccess(resourceKey = '', account = {}, role = '', workspace = null) {
    const { isPersonal } = stripLmsPersonalBoardScopeKey(resourceKey);
    if (!isPersonal) return { ok: true, isOwner: false };
    if (isLmsPersonalBoardOwner(resourceKey, account)) return { ok: true, isOwner: true, staffShareLevel: 'edit', shareLevel: 'edit' };
    const meta = parsePersonalScopeMeta(resourceKey);
    const scope = { groupId: meta.groupId, sectionType: meta.sectionType };
    const shareLevel = getPersonalShareLevelForActor(workspace || { resourceKey }, account, role, scope);
    if (shareLevel === 'none') {
        const message = isLmsStaffRole(role)
            ? 'This student has not shared their workspace yet.'
            : 'This student has not shared their workspace with you.';
        return { ok: false, status: 403, error: message, isOwner: false };
    }
    return { ok: true, isOwner: false, staffShareLevel: shareLevel, shareLevel };
}

function assertLmsPersonalBoardWriteAccess(resourceKey = '', account = {}, role = '', workspace = null) {
    const readAccess = assertLmsPersonalBoardReadAccess(resourceKey, account, role, workspace);
    if (!readAccess.ok) return readAccess;
    if (readAccess.isOwner) return readAccess;
    if (readAccess.staffShareLevel !== 'edit' && readAccess.shareLevel !== 'edit') {
        return { ok: false, status: 403, error: 'This student has only granted view access to their workspace.', isOwner: false };
    }
    return readAccess;
}

function enrichPersonalSnapshot(snapshot = {}, resourceKey = '', workspace = {}) {
    if (!snapshot || typeof snapshot !== 'object') return null;
    const id = String(snapshot.id || '').trim();
    if (!id) return null;
    const meta = parsePersonalScopeMeta(resourceKey);
    const sectionType = String(snapshot.sectionType || meta.sectionType || '').trim();
    const isAutosave = Boolean(snapshot.isAutosave) || id === LMS_PERSONAL_AUTOSAVE_ID;
    return {
        id,
        label: String(snapshot.label || 'Saved progress').slice(0, 120),
        elements: Array.isArray(snapshot.elements) ? snapshot.elements : [],
        savedAt: String(snapshot.savedAt || '').trim() || nowIso(),
        sectionType,
        resourceKey: String(snapshot.resourceKey || resourceKey || '').trim(),
        courseId: String(snapshot.courseId || meta.courseId || '').trim(),
        groupId: String(snapshot.groupId || meta.groupId || '').trim(),
        isAutosave,
        staffShare: isAutosave ? 'none' : normalizePersonalStaffShare(snapshot.staffShare),
        elementsVersion: Number(snapshot.elementsVersion || workspace.version) || 0
    };
}

function normalizePersonalSnapshots(snapshots = [], resourceKey = '', workspace = {}) {
    if (!Array.isArray(snapshots)) return [];
    return snapshots
        .map(snapshot => enrichPersonalSnapshot(snapshot, resourceKey, workspace))
        .filter(Boolean);
}

function ensurePersonalDashboardWorkspace(existing = {}, resourceKey = '') {
    const base = existing && typeof existing === 'object'
        ? existing
        : createEmptyLmsWhiteboardWorkspace(resourceKey);
    return {
        ...createEmptyLmsWhiteboardWorkspace(resourceKey),
        ...base,
        resourceKey: String(resourceKey || base.resourceKey || '').trim(),
        snapshots: normalizePersonalSnapshots(base.snapshots, resourceKey, base),
        staffShare: normalizePersonalStaffShare(base.staffShare),
        groupShare: normalizePersonalStaffShare(base.groupShare),
        peerShares: normalizePeerShares(base.peerShares),
        editingEnabled: true,
        sessionActive: true
    };
}

function buildPersonalSnapshotLabel(payload = {}, meta = {}, isAutosave = false) {
    if (!isAutosave) {
        return String(payload.label || 'Saved progress').trim().slice(0, 120) || 'Saved progress';
    }
    const groupId = String(meta.groupId || 'group').trim() || 'group';
    const sectionLabel = formatPersonalSectionLabel(meta.sectionType);
    return `Autosave · ${groupId} · ${sectionLabel}`.slice(0, 120);
}

function savePersonalDashboardSnapshot(existing = {}, payload = {}, account = {}) {
    const resourceKey = String(existing.resourceKey || payload.resourceKey || '').trim();
    if (!isLmsPersonalBoardKey(resourceKey)) {
        return { status: 400, error: 'Snapshot saves require a personal workspace key.' };
    }
    const access = assertLmsPersonalBoardAccess(resourceKey, account);
    if (!access.ok) return { status: access.status, error: access.error };
    const workspace = ensurePersonalDashboardWorkspace(existing, resourceKey);
    const elements = Array.isArray(workspace.elements) ? workspace.elements : [];
    if (!elements.length) {
        return { status: 400, error: 'Nothing to save yet.' };
    }
    const isAutosave = payload.autosave === true;
    const meta = parsePersonalScopeMeta(resourceKey);
    const snapshotId = isAutosave
        ? LMS_PERSONAL_AUTOSAVE_ID
        : String(payload.id || `snap-${Date.now()}`).trim();
    const snapshot = enrichPersonalSnapshot({
        id: snapshotId,
        label: buildPersonalSnapshotLabel(payload, meta, isAutosave),
        elements: JSON.parse(JSON.stringify(elements)),
        savedAt: nowIso(),
        sectionType: String(payload.sectionType || meta.sectionType || '').trim(),
        resourceKey,
        courseId: meta.courseId,
        groupId: meta.groupId,
        isAutosave,
        elementsVersion: Number(workspace.version) || 0
    }, resourceKey, workspace);
    let snapshots = normalizePersonalSnapshots(workspace.snapshots, resourceKey, workspace);
    if (isAutosave) {
        snapshots = snapshots.filter(item => !(item.isAutosave && item.id === LMS_PERSONAL_AUTOSAVE_ID && item.resourceKey === resourceKey));
    } else {
        snapshots = snapshots.filter(item => item.id !== snapshot.id);
    }
    snapshots.unshift(snapshot);
    const next = {
        ...workspace,
        snapshots: snapshots.slice(0, 40)
    };
    return { workspace: next, snapshot };
}

function deletePersonalDashboardSnapshot(existing = {}, snapshotId = '', account = {}) {
    const resourceKey = String(existing.resourceKey || '').trim();
    if (!isLmsPersonalBoardKey(resourceKey)) {
        return { status: 400, error: 'Snapshot deletes require a personal workspace key.' };
    }
    const access = assertLmsPersonalBoardAccess(resourceKey, account);
    if (!access.ok) return { status: access.status, error: access.error };
    const workspace = ensurePersonalDashboardWorkspace(existing, resourceKey);
    const id = String(snapshotId || '').trim();
    if (!id) return { status: 400, error: 'Snapshot id is required.' };
    const snapshots = normalizePersonalSnapshots(workspace.snapshots, resourceKey, workspace)
        .filter(item => item.id !== id);
    return { workspace: { ...workspace, snapshots } };
}

function restorePersonalDashboardSnapshot(existing = {}, snapshotId = '', account = {}, options = {}) {
    const targetResourceKey = String(options.targetResourceKey || existing.resourceKey || '').trim();
    const sourceResourceKey = String(options.sourceResourceKey || targetResourceKey || '').trim();
    if (!isLmsPersonalBoardKey(targetResourceKey) || !isLmsPersonalBoardKey(sourceResourceKey)) {
        return { status: 400, error: 'Snapshot restores require personal workspace keys.' };
    }
    const role = String(options.role || '').trim().toLowerCase();
    const sourceWorkspace = ensurePersonalDashboardWorkspace(
        options.sourceWorkspace || existing,
        sourceResourceKey
    );
    const targetWorkspaceSeed = ensurePersonalDashboardWorkspace(
        options.targetWorkspace || (targetResourceKey === sourceResourceKey ? existing : { resourceKey: targetResourceKey }),
        targetResourceKey
    );
    const id = String(snapshotId || '').trim();
    const snapshot = normalizePersonalSnapshots(sourceWorkspace.snapshots, sourceResourceKey, sourceWorkspace)
        .find(item => item.id === id);
    if (!snapshot) return { status: 404, error: 'Snapshot not found.' };

    const isOwner = isLmsPersonalBoardOwner(targetResourceKey, account);
    const isStaff = isLmsStaffRole(role);
    if (isOwner) {
        if (!isLmsPersonalBoardOwner(sourceResourceKey, account)) {
            const sourceRead = assertLmsPersonalBoardReadAccess(sourceResourceKey, account, role, sourceWorkspace);
            if (!sourceRead.ok) return { status: sourceRead.status, error: sourceRead.error };
        }
    } else if (isStaff) {
        const share = normalizePersonalStaffShare(snapshot.staffShare);
        if (share !== 'edit') {
            return { status: 403, error: 'This saved progress is view-only for instructors.' };
        }
        const targetWrite = assertLmsPersonalBoardWriteAccess(targetResourceKey, account, role, targetWorkspaceSeed);
        if (!targetWrite.ok) return { status: targetWrite.status, error: targetWrite.error };
        const sourceRead = assertLmsPersonalBoardReadAccess(sourceResourceKey, account, role, sourceWorkspace);
        if (!sourceRead.ok) return { status: sourceRead.status, error: sourceRead.error };
    } else {
        return { status: 403, error: 'You can only access your own personal workspace.' };
    }

    const targetWorkspace = targetWorkspaceSeed;
    const next = {
        ...targetWorkspace,
        elements: JSON.parse(JSON.stringify(snapshot.elements || [])),
        // Force full board replace on save — otherwise student merge unions old strokes.
        replaceElements: true,
        activeSnapshotId: snapshot.id
    };
    return { workspace: next, snapshot, sourceResourceKey, targetResourceKey };
}

function normalizePersonalSubjectId(value = '') {
    return String(value || '').trim().toLowerCase();
}

function normalizePersonalHistoryScopeValue(value = '') {
    return String(value || '').trim().toLowerCase();
}

function matchesPersonalDashboardHistoryScope(snapshot = {}, options = {}) {
    const filterGroupId = String(options.groupId || '').trim();
    const filterSectionType = normalizePersonalHistoryScopeValue(options.sectionType);
    if (!filterGroupId || !filterSectionType) return true;
    if (String(snapshot.groupId || '').trim() !== filterGroupId) return false;
    return normalizePersonalHistoryScopeValue(snapshot.sectionType) === filterSectionType;
}

function matchesPersonalDashboardSubject(resourceKey = '', courseId = '') {
    const normalizedTarget = normalizePersonalSubjectId(courseId);
    if (!normalizedTarget) return false;
    const meta = parsePersonalScopeMeta(resourceKey);
    return normalizePersonalSubjectId(meta.courseId) === normalizedTarget;
}

function updatePersonalDashboardSnapshotShare(existing = {}, snapshotId = '', payload = {}, account = {}) {
    const resourceKey = String(existing.resourceKey || '').trim();
    if (!isLmsPersonalBoardKey(resourceKey)) {
        return { status: 400, error: 'Snapshot sharing requires a personal workspace key.' };
    }
    const access = assertLmsPersonalBoardAccess(resourceKey, account);
    if (!access.ok) return { status: access.status, error: access.error };
    const id = String(snapshotId || '').trim();
    if (!id || id === LMS_PERSONAL_AUTOSAVE_ID) {
        return { status: 400, error: 'Autosave entries cannot be shared with instructors.' };
    }
    const staffShare = normalizePersonalStaffShare(payload.staffShare);
    const workspace = ensurePersonalDashboardWorkspace(existing, resourceKey);
    let found = false;
    const snapshots = normalizePersonalSnapshots(workspace.snapshots, resourceKey, workspace).map(snapshot => {
        if (snapshot.id !== id) return snapshot;
        found = true;
        return { ...snapshot, staffShare };
    });
    if (!found) return { status: 404, error: 'Snapshot not found.' };
    return { workspace: { ...workspace, snapshots }, snapshot: snapshots.find(item => item.id === id) };
}

function updatePersonalDashboardWorkspaceShare(existing = {}, payload = {}, account = {}) {
    const resourceKey = String(existing.resourceKey || '').trim();
    if (!isLmsPersonalBoardKey(resourceKey)) {
        return { status: 400, error: 'Workspace sharing requires a personal workspace key.' };
    }
    const access = assertLmsPersonalBoardAccess(resourceKey, account);
    if (!access.ok) return { status: access.status, error: access.error };
    const workspace = ensurePersonalDashboardWorkspace(existing, resourceKey);
    const next = { ...workspace };
    if (payload.staffShare !== undefined) {
        next.staffShare = normalizePersonalStaffShare(payload.staffShare);
    }
    if (payload.groupShare !== undefined) {
        next.groupShare = normalizePersonalStaffShare(payload.groupShare);
    }
    return { workspace: next };
}

function updatePersonalDashboardPeerShares(existing = {}, payload = {}, account = {}) {
    const resourceKey = String(existing.resourceKey || '').trim();
    if (!isLmsPersonalBoardKey(resourceKey)) {
        return { status: 400, error: 'Peer sharing requires a personal workspace key.' };
    }
    const access = assertLmsPersonalBoardAccess(resourceKey, account);
    if (!access.ok) return { status: access.status, error: access.error };
    if (!isLmsPersonalBoardOwner(resourceKey, account)) {
        return { status: 403, error: 'Only the workspace owner can change peer shares.' };
    }
    const workspace = ensurePersonalDashboardWorkspace(existing, resourceKey);
    const ownerId = String(account?.id || account?.userId || '').trim();
    let peerShares = { ...normalizePeerShares(workspace.peerShares) };
    if (payload && typeof payload.peerShares === 'object' && !Array.isArray(payload.peerShares)) {
        peerShares = normalizePeerShares(payload.peerShares);
    } else if (payload && (payload.userId || payload.studentId)) {
        const userId = String(payload.userId || payload.studentId || '').trim();
        const level = normalizePersonalStaffShare(payload.level || payload.staffShare || payload.share || 'none');
        if (!userId) return { status: 400, error: 'Peer user id is required.' };
        if (userId === ownerId) return { status: 400, error: 'You cannot share a workspace with yourself.' };
        if (level === 'none') delete peerShares[userId];
        else peerShares[userId] = level;
    } else {
        return { status: 400, error: 'peerShares map or userId+level is required.' };
    }
    delete peerShares[ownerId];
    return { workspace: { ...workspace, peerShares: normalizePeerShares(peerShares) } };
}

function listPersonalDashboardSharedWithMe(store = {}, courseId = '', userId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedCourseId || !normalizedUserId) {
        return { status: 400, error: 'Course id and user id are required.' };
    }
    const groupId = String(options.groupId || '').trim();
    const sectionType = String(options.sectionType || '').trim();
    const workspaces = store?.state?.portal?.whiteboardWorkspaces || {};
    const items = [];
    Object.entries(workspaces).forEach(([resourceKey, workspace]) => {
        if (!isLmsPersonalBoardKey(resourceKey) || !matchesPersonalDashboardSubject(resourceKey, normalizedCourseId)) return;
        const meta = parsePersonalScopeMeta(resourceKey);
        if (groupId && meta.groupId !== groupId) return;
        if (sectionType && meta.sectionType !== sectionType) return;
        const ownerId = String(meta.ownerId || '').trim();
        if (!ownerId || ownerId === normalizedUserId) return;
        // Caller is already scoped to course/group; treat groupShare as section-wide grant.
        const shareLevel = maxPersonalStaffShareLevel(
            workspace?.groupShare,
            getPeerShareLevel(workspace, normalizedUserId)
        );
        if (shareLevel === 'none') return;
        items.push({
            resourceKey,
            studentId: ownerId,
            ownerId,
            shareLevel,
            staffShareLevel: shareLevel,
            groupId: meta.groupId,
            sectionType: meta.sectionType,
            updatedAt: String(workspace?.updatedAt || '').trim()
        });
    });
    items.sort((left, right) => String(right.updatedAt || '').localeCompare(String(left.updatedAt || '')));
    return {
        ok: true,
        courseId: normalizedCourseId,
        scope: groupId && sectionType ? { groupId, sectionType } : null,
        items
    };
}

function listPersonalDashboardSharedHistory(store = {}, courseId = '', studentId = '', options = {}) {
    const listed = listPersonalDashboardHistory(store, courseId, studentId, options);
    if (!listed?.ok) return listed;
    return {
        ...listed,
        studentId: String(studentId || '').trim(),
        items: (Array.isArray(listed.items) ? listed.items : [])
            .filter(snapshot => normalizePersonalStaffShare(snapshot.staffShare) !== 'none')
    };
}

function listPersonalDashboardHistory(store = {}, courseId = '', userId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedCourseId || !normalizedUserId) {
        return { status: 400, error: 'Course id and user id are required.' };
    }
    const workspaces = store?.state?.portal?.whiteboardWorkspaces || {};
    const suffix = `${LMS_PERSONAL_BOARD_MARKER}${normalizedUserId}`;
    const items = [];
    Object.entries(workspaces).forEach(([resourceKey, workspace]) => {
        if (!resourceKey.endsWith(suffix) || !isLmsPersonalBoardKey(resourceKey)) return;
        if (!matchesPersonalDashboardSubject(resourceKey, normalizedCourseId)) return;
        const access = assertLmsPersonalBoardAccess(resourceKey, { id: normalizedUserId, userId: normalizedUserId });
        if (!access.ok) return;
        normalizePersonalSnapshots(workspace?.snapshots, resourceKey, workspace).forEach(snapshot => {
            if (!matchesPersonalDashboardHistoryScope(snapshot, options)) return;
            items.push(snapshot);
        });
    });
    items.sort((left, right) => String(right.savedAt || '').localeCompare(String(left.savedAt || '')));
    return {
        ok: true,
        courseId: normalizedCourseId,
        scope: options.groupId && options.sectionType
            ? { groupId: String(options.groupId).trim(), sectionType: String(options.sectionType).trim() }
            : null,
        items: items.slice(0, LMS_PERSONAL_HISTORY_LIST_CAP)
    };
}

function listPersonalDashboardShareStatus(store = {}, courseId = '', options = {}) {
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) {
        return { status: 400, error: 'Course id is required.' };
    }
    const groupId = String(options.groupId || '').trim();
    const sectionType = String(options.sectionType || '').trim();
    const scope = groupId && sectionType ? { groupId, sectionType } : {};
    const workspaces = store?.state?.portal?.whiteboardWorkspaces || {};
    const byStudentId = new Map();
    Object.entries(workspaces).forEach(([resourceKey, workspace]) => {
        if (!isLmsPersonalBoardKey(resourceKey) || !matchesPersonalDashboardSubject(resourceKey, normalizedCourseId)) return;
        const meta = parsePersonalScopeMeta(resourceKey);
        if (groupId && meta.groupId !== groupId) return;
        if (sectionType && meta.sectionType !== sectionType) return;
        const studentId = String(meta.ownerId || '').trim();
        if (!studentId) return;
        const staffShareLevel = getPersonalStaffShareLevel(workspace, scope);
        const existing = byStudentId.get(studentId);
        const rank = { none: 0, view: 1, edit: 2 };
        if (!existing || rank[staffShareLevel] > rank[existing.staffShareLevel]) {
            byStudentId.set(studentId, { studentId, staffShareLevel });
        }
    });
    return {
        ok: true,
        courseId: normalizedCourseId,
        scope: scope.groupId ? scope : null,
        items: Array.from(byStudentId.values())
    };
}

function resolveSnapshotOwnerKey(snapshot = {}, fallbackResourceKey = '') {
    return String(snapshot?.resourceKey || fallbackResourceKey || '').trim();
}

function mergePersonalDashboardWorkspace(existing = {}, incoming = {}, account = {}, role = '') {
    const resourceKey = String(existing.resourceKey || incoming.resourceKey || '').trim();
    if (!isLmsPersonalBoardKey(resourceKey)) {
        return { status: 400, error: 'Personal dashboard merge requires a personal workspace key.' };
    }
    const normalizedRole = String(role || '').trim().toLowerCase();
    const isOwner = isLmsPersonalBoardOwner(resourceKey, account);
    const replaceElements = incoming?.replaceElements === true;
    if (!isOwner) {
        const writeAccess = assertLmsPersonalBoardWriteAccess(resourceKey, account, normalizedRole, existing);
        if (!writeAccess.ok) return { status: writeAccess.status, error: writeAccess.error };
        const merged = mergeStudentWhiteboardWorkspace(existing, incoming, account, {
            staffEdit: true,
            replaceElements
        });
        if (!merged?.workspace) return merged;
        return {
            workspace: ensurePersonalDashboardWorkspace({
                ...merged.workspace,
                snapshots: Array.isArray(existing.snapshots) ? existing.snapshots : merged.workspace.snapshots
            }, resourceKey)
        };
    }
    if (isLmsStaffRole(normalizedRole)) {
        const payload = replaceElements ? { ...incoming, replaceElements: true } : incoming;
        const merged = mergeStaffWhiteboardWorkspace(existing, payload, account);
        return {
            workspace: ensurePersonalDashboardWorkspace({
                ...merged,
                snapshots: Array.isArray(incoming.snapshots) ? incoming.snapshots : existing.snapshots
            }, resourceKey)
        };
    }
    return mergeStudentWhiteboardWorkspace(existing, incoming, account, { replaceElements });
}

module.exports = {
    ensurePersonalDashboardWorkspace,
    savePersonalDashboardSnapshot,
    deletePersonalDashboardSnapshot,
    restorePersonalDashboardSnapshot,
    updatePersonalDashboardSnapshotShare,
    updatePersonalDashboardWorkspaceShare,
    updatePersonalDashboardPeerShares,
    maxPersonalStaffShareLevel,
    // groupShare is normalized via normalizePersonalStaffShare / ensurePersonalDashboardWorkspace
    listPersonalDashboardHistory,
    listPersonalDashboardSharedHistory,
    listPersonalDashboardShareStatus,
    listPersonalDashboardSharedWithMe,
    resolveSnapshotOwnerKey,
    mergePersonalDashboardWorkspace,
    normalizePersonalSnapshots,
    normalizePersonalStaffShare,
    normalizePeerShares,
    resolvePersonalStaffShareLevel,
    getPersonalStaffShareLevel,
    getPeerShareLevel,
    getPersonalShareLevelForActor,
    filterSharedPersonalSnapshots,
    redactPersonalWorkspaceForStaffViewer,
    redactPersonalWorkspaceForViewer,
    assertLmsPersonalBoardReadAccess,
    assertLmsPersonalBoardWriteAccess,
    parsePersonalScopeMeta,
    LMS_PERSONAL_AUTOSAVE_ID
};