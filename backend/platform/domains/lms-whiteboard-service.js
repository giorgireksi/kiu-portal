const { nowIso } = require('../utils');

const LMS_PERSONAL_BOARD_MARKER = '__personal__';

function stripLmsPersonalBoardScopeKey(resourceKey = '') {
    const raw = String(resourceKey || '').trim();
    const markerIndex = raw.indexOf(LMS_PERSONAL_BOARD_MARKER);
    if (markerIndex < 0) {
        return { scopeKey: raw, ownerId: '', isPersonal: false };
    }
    return {
        scopeKey: raw.slice(0, markerIndex),
        ownerId: raw.slice(markerIndex + LMS_PERSONAL_BOARD_MARKER.length).trim(),
        isPersonal: true
    };
}

function isLmsPersonalBoardKey(resourceKey = '') {
    return String(resourceKey || '').includes(LMS_PERSONAL_BOARD_MARKER);
}

function getLmsPersonalBoardOwnerId(resourceKey = '') {
    return stripLmsPersonalBoardScopeKey(resourceKey).ownerId;
}

const LMS_STAFF_ROLES = new Set(['admin', 'professor', 'ta']);

function isLmsStaffRole(role = '') {
    return LMS_STAFF_ROLES.has(String(role || '').trim().toLowerCase());
}

function isLmsPersonalBoardOwner(resourceKey = '', account = {}) {
    const { isPersonal, ownerId } = stripLmsPersonalBoardScopeKey(resourceKey);
    if (!isPersonal) return false;
    const actorId = String(account?.id || account?.userId || '').trim();
    return Boolean(actorId && ownerId && actorId === ownerId);
}

function assertLmsPersonalBoardAccess(resourceKey = '', account = {}) {
    const { isPersonal } = stripLmsPersonalBoardScopeKey(resourceKey);
    if (!isPersonal) return { ok: true, isOwner: false };
    if (isLmsPersonalBoardOwner(resourceKey, account)) return { ok: true, isOwner: true };
    return { ok: false, status: 403, error: 'You can only access your own personal workspace.', isOwner: false };
}

function createEmptyLmsWhiteboardWorkspace(resourceKey = '') {
    return {
        resourceKey: String(resourceKey || '').trim(),
        version: 0,
        editingEnabled: false,
        editControlUserIds: [],
        deleteStaffElementsUserIds: [],
        staffAuthorIds: [],
        sessionActive: false,
        sessionStartedAt: '',
        sessionStartedBy: '',
        elements: [],
        activity: {},
        updatedAt: '',
        updatedBy: ''
    };
}

function normalizeWhiteboardActivity(activity = {}) {
    return activity && typeof activity === 'object' ? {} : {};
}

const LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES = ['triangle', 'diamond', 'frame'];

const LMS_WHITEBOARD_LEGACY_TEMPLATE_FIELDS = [
    'templateInstanceId',
    'templateId',
    'templateRole',
    'templateSlot',
    'templateOptions',
    'templateManuallyScaled',
    'frameZone'
];

function normalizeWhiteboardElement(element = {}, account = {}) {
    if (!element || typeof element !== 'object') return null;
    const id = String(element.id || '').trim();
    const type = String(element.type || '').trim().toLowerCase();
    if (!id || !type || LMS_WHITEBOARD_REMOVED_ELEMENT_TYPES.includes(type)) return null;
    const authorId = String(element.authorId || account?.id || account?.userId || '').trim();
    const next = { ...element, id, type, authorId };
    LMS_WHITEBOARD_LEGACY_TEMPLATE_FIELDS.forEach(field => {
        delete next[field];
    });
    if (type === 'stroke') {
        next.points = Array.isArray(element.points)
            ? element.points.map(point => [Number(point?.[0] || 0), Number(point?.[1] || 0)])
            : [];
        next.color = String(element.color || '#f4d06f');
        next.width = Math.max(1, Number(element.width) || 3);
        next.parentDocumentId = String(element.parentDocumentId || '').trim();
        next.pageIndex = Math.max(0, Number(element.pageIndex) || 0);
        next.opacity = Math.max(0.05, Math.min(1, Number(element.opacity) || 1));
        if (element.locked === true) next.locked = true;
    } else if (type === 'sticky') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.w = Math.max(80, Number(element.w) || 160);
        next.h = Math.max(80, Number(element.h) || 120);
        next.text = String(element.text || '').slice(0, 2000);
        next.color = String(element.color || '#fff3b0');
        next.fontSize = Math.max(10, Math.min(48, Number(element.fontSize) || 14));
        next.parentDocumentId = String(element.parentDocumentId || '').trim();
        next.pageIndex = Math.max(0, Number(element.pageIndex) || 0);
    } else if (type === 'text') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.w = Math.max(80, Number(element.w) || 240);
        next.h = Math.max(24, Number(element.h) || 72);
        next.text = String(element.text || '').slice(0, 2000);
        next.fontSize = Math.max(10, Math.min(96, Number(element.fontSize) || 18));
        next.color = String(element.color || '#f8fafc');
        next.parentDocumentId = String(element.parentDocumentId || '').trim();
        next.pageIndex = Math.max(0, Number(element.pageIndex) || 0);
    } else if (type === 'image') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.w = Math.max(40, Number(element.w) || 200);
        next.h = Math.max(40, Number(element.h) || 200);
        next.src = String(element.src || '').slice(0, 600000);
    } else if (type === 'document') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.w = Math.max(120, Number(element.w) || 400);
        next.h = Math.max(120, Number(element.h) || 300);
        next.storageKey = String(element.storageKey || '').trim();
        next.storageBackend = String(element.storageBackend || 'bridge').trim().toLowerCase() || 'bridge';
        next.mimeType = String(element.mimeType || 'application/octet-stream').trim();
        next.fileName = String(element.fileName || 'Document').slice(0, 240);
        next.pageIndex = Math.max(0, Number(element.pageIndex) || 0);
        next.pageCount = Math.max(1, Number(element.pageCount) || 1);
        if (element.locked === true) next.locked = true;
        if (element.hidden === true) next.hidden = true;
        if (!next.storageKey) return null;
    } else if (type === 'rect' || type === 'ellipse') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.w = Math.max(8, Number(element.w) || 120);
        next.h = Math.max(8, Number(element.h) || 80);
        next.color = String(element.color || '#f4d06f');
        next.width = Math.max(1, Number(element.width) || 3);
        next.fill = String(element.fill || '#f4d06f').trim();
        const fillOpacity = Number(element.fillOpacity);
        next.fillOpacity = Number.isFinite(fillOpacity)
            ? Math.max(0, Math.min(1, fillOpacity))
            : 0.35;
        if (type === 'rect') {
            next.cornerRadius = Math.max(0, Math.min(48, Number(element.cornerRadius) || 0));
        }
    } else if (type === 'line' || type === 'arrow') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.x2 = Number(element.x2) || 0;
        next.y2 = Number(element.y2) || 0;
        next.color = String(element.color || '#f4d06f');
        next.width = Math.max(1, Number(element.width) || 3);
    } else if (type === 'grid') {
        next.x = Number(element.x) || 0;
        next.y = Number(element.y) || 0;
        next.w = Math.max(8, Number(element.w) || 160);
        next.h = Math.max(8, Number(element.h) || 120);
        const rows = Math.max(1, Math.min(20, Number(element.rows) || 4));
        const cols = Math.max(1, Math.min(20, Number(element.cols) || 4));
        if (rows * cols > 100) return null;
        next.rows = rows;
        next.cols = cols;
        next.color = String(element.color || '#f4d06f');
        next.width = Math.max(1, Number(element.width) || 2);
        next.fill = String(element.fill || '#f4d06f').trim();
        const gridFillOpacity = Number(element.fillOpacity);
        next.fillOpacity = Number.isFinite(gridFillOpacity)
            ? Math.max(0, Math.min(1, gridFillOpacity))
            : 0.35;
    } else {
        return null;
    }
    return next;
}

function isStudentWhiteboardElementChangeAllowed(existingElements = [], incomingElement = {}) {
    return Boolean(incomingElement && typeof incomingElement === 'object');
}

function isStudentWhiteboardElementRemovalAllowed(existingElements = [], elementId = '', workspace = {}, studentId = '') {
    const id = String(elementId || '').trim();
    if (!id) return false;
    const existing = (Array.isArray(existingElements) ? existingElements : []).find(item => String(item?.id || '') === id);
    if (!existing) return true;
    const staffAuthorIds = Array.isArray(workspace?.staffAuthorIds) ? workspace.staffAuthorIds : [];
    const isStaffElement = staffAuthorIds.includes(String(existing.authorId || '').trim());
    if (!isStaffElement) return isStudentWhiteboardElementChangeAllowed(existingElements, existing);
    const deleteAllowed = Array.isArray(workspace?.deleteStaffElementsUserIds)
        && workspace.deleteStaffElementsUserIds.includes(String(studentId || '').trim());
    return deleteAllowed;
}

function mergeWhiteboardElements(existing = [], incoming = [], account = {}) {
    const map = new Map();
    (Array.isArray(existing) ? existing : []).forEach(element => {
        const normalized = normalizeWhiteboardElement(element, account);
        if (normalized) map.set(normalized.id, normalized);
    });
    (Array.isArray(incoming) ? incoming : []).forEach(element => {
        const normalized = normalizeWhiteboardElement(element, account);
        if (normalized) map.set(normalized.id, normalized);
    });
    return Array.from(map.values());
}

function mergeStaffWhiteboardWorkspace(existing = {}, incoming = {}, account = {}) {
    const base = existing && typeof existing === 'object'
        ? existing
        : createEmptyLmsWhiteboardWorkspace(incoming.resourceKey);
    const next = {
        ...createEmptyLmsWhiteboardWorkspace(base.resourceKey || incoming.resourceKey),
        ...base,
        resourceKey: String(base.resourceKey || incoming.resourceKey || '').trim()
    };
    if (typeof incoming.editingEnabled === 'boolean') next.editingEnabled = incoming.editingEnabled;
    if (Array.isArray(incoming.editControlUserIds)) {
        next.editControlUserIds = [...new Set(incoming.editControlUserIds.map(id => String(id || '').trim()).filter(Boolean))];
    }
    if (Array.isArray(incoming.deleteStaffElementsUserIds)) {
        next.deleteStaffElementsUserIds = [...new Set(incoming.deleteStaffElementsUserIds.map(id => String(id || '').trim()).filter(Boolean))];
    }
    const staffId = String(account?.id || account?.userId || '').trim();
    next.staffAuthorIds = [...new Set([...(Array.isArray(base.staffAuthorIds) ? base.staffAuthorIds : []), staffId].filter(Boolean))];
    if (typeof incoming.sessionActive === 'boolean') next.sessionActive = incoming.sessionActive;
    if (incoming.sessionStartedAt !== undefined) next.sessionStartedAt = String(incoming.sessionStartedAt || '').trim();
    if (incoming.sessionStartedBy !== undefined) next.sessionStartedBy = String(incoming.sessionStartedBy || '').trim();
    if (incoming.clearBoard === true) {
        next.elements = [];
        next.activity = {};
    } else if (incoming.replaceElements === true && Array.isArray(incoming.elements)) {
        next.elements = mergeWhiteboardElements([], incoming.elements, account);
    } else if (Array.isArray(incoming.elements)) {
        next.elements = mergeWhiteboardElements(base.elements, incoming.elements, account);
    }
    if (incoming.clearBoard !== true) {
        next.activity = normalizeWhiteboardActivity(incoming.activity !== undefined ? incoming.activity : base.activity);
    }
    next.version = Math.max(Number(base.version) || 0, Number(incoming.version) || 0) + 1;
    next.updatedAt = nowIso();
    next.updatedBy = String(account?.id || account?.userId || '').trim();
    delete next.clearBoard;
    delete next.replaceElements;
    return next;
}

function mergeStudentWhiteboardWorkspace(existing = {}, incoming = {}, account = {}, options = {}) {
    const base = existing && typeof existing === 'object'
        ? existing
        : createEmptyLmsWhiteboardWorkspace(incoming.resourceKey);
    const resourceKey = String(base.resourceKey || incoming.resourceKey || '').trim();
    const isPersonal = isLmsPersonalBoardKey(resourceKey);
    if (isPersonal) {
        const isOwner = isLmsPersonalBoardOwner(resourceKey, account);
        if (!isOwner && !options.staffEdit) {
            return { status: 403, error: 'You can only access your own personal workspace.' };
        }
    } else {
        const personalAccess = assertLmsPersonalBoardAccess(resourceKey, account);
        if (!personalAccess.ok) return { status: personalAccess.status, error: personalAccess.error };
    }
    if (!isPersonal) {
        if (!base.sessionActive) {
            return { status: 403, error: 'Whiteboard session is not active yet.' };
        }
        const studentId = String(account?.id || account?.userId || '').trim();
        const hasEditControl = base.editingEnabled
            || (Array.isArray(base.editControlUserIds) && base.editControlUserIds.includes(studentId));
        if (!hasEditControl) {
            return { status: 403, error: 'Editing is locked by instructor.' };
        }
        if (incoming.editingEnabled !== undefined && incoming.editingEnabled !== base.editingEnabled) {
            return { status: 403, error: 'Students cannot change editing permissions.' };
        }
        if (incoming.editControlUserIds !== undefined) {
            return { status: 403, error: 'Students cannot change editing permissions.' };
        }
        if (incoming.deleteStaffElementsUserIds !== undefined) {
            return { status: 403, error: 'Students cannot change editing permissions.' };
        }
        if (incoming.sessionActive !== undefined && incoming.sessionActive !== base.sessionActive) {
            return { status: 403, error: 'Students cannot control whiteboard sessions.' };
        }
        if (incoming.clearBoard === true) {
            return { status: 403, error: 'Students cannot clear the board.' };
        }
    }
    const next = {
        ...createEmptyLmsWhiteboardWorkspace(base.resourceKey || incoming.resourceKey),
        ...base
    };
    const replaceElements = options.replaceElements === true || incoming.replaceElements === true;
    if (Array.isArray(incoming.elements)) {
        const sourceElements = replaceElements ? [] : base.elements;
        const incomingElements = replaceElements
            ? incoming.elements
            : (incoming.elements || []).filter(element =>
                isStudentWhiteboardElementChangeAllowed(base.elements, element)
            );
        next.elements = mergeWhiteboardElements(sourceElements, incomingElements, account);
    }
    if (isPersonal && incoming.clearBoard === true) {
        next.elements = [];
        next.activity = {};
    }
    if (isPersonal && Array.isArray(incoming.snapshots)) {
        next.snapshots = incoming.snapshots;
    } else if (isPersonal && Array.isArray(base.snapshots)) {
        next.snapshots = base.snapshots;
    }
    next.version = (Number(base.version) || 0) + 1;
    next.updatedAt = nowIso();
    next.updatedBy = String(account?.id || account?.userId || '').trim();
    delete next.clearBoard;
    delete next.replaceElements;
    return { workspace: next };
}

function mergeStudentWhiteboardOps(existing = {}, ops = [], account = {}) {
    const incomingOps = Array.isArray(ops) ? ops : [];
    const removedIds = new Set();
    const changed = [];
    incomingOps.forEach(op => {
        const type = String(op?.type || '').trim().toLowerCase();
        const elementId = String(op?.elementId || op?.id || '').trim();
        if (type === 'remove' && elementId) {
            const studentId = String(account?.id || account?.userId || '').trim();
            if (!isStudentWhiteboardElementRemovalAllowed(existing.elements, elementId, existing, studentId)) return;
            removedIds.add(elementId);
            return;
        }
        if (op?.element) {
            const normalized = normalizeWhiteboardElement(op.element, account);
            if (normalized && isStudentWhiteboardElementChangeAllowed(existing.elements, normalized)) {
                changed.push(normalized);
            }
        }
    });
    const baseElements = Array.isArray(existing.elements) ? existing.elements : [];
    const filtered = baseElements.filter(element => !removedIds.has(String(element?.id || '').trim()));
    const merged = mergeWhiteboardElements(filtered, changed, account);
    return mergeStudentWhiteboardWorkspace(
        existing,
        { elements: merged, resourceKey: existing.resourceKey },
        account,
        { replaceElements: true }
    );
}

module.exports = {
    LMS_PERSONAL_BOARD_MARKER,
    LMS_STAFF_ROLES,
    createEmptyLmsWhiteboardWorkspace,
    mergeStaffWhiteboardWorkspace,
    mergeStudentWhiteboardWorkspace,
    mergeStudentWhiteboardOps,
    mergeWhiteboardElements,
    normalizeWhiteboardElement,
    normalizeWhiteboardActivity,
    isStudentWhiteboardElementChangeAllowed,
    isStudentWhiteboardElementRemovalAllowed,
    stripLmsPersonalBoardScopeKey,
    isLmsPersonalBoardKey,
    getLmsPersonalBoardOwnerId,
    isLmsPersonalBoardOwner,
    isLmsStaffRole,
    assertLmsPersonalBoardAccess
};