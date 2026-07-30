/* Shared orders runtime primitives — load before orders-inbox.js or orders-workspace.js. */

const ORDERS_RECIPIENT_FILTER_FIELDS = Object.freeze(['type', 'status', 'kind']);
const ORDERS_RECIPIENT_FILTER_SELECT_FIELDS = Object.freeze(['type', 'status', 'kind']);
const ORDERS_RECIPIENT_FILTER_ROLES = Object.freeze([
    USER_ROLES.STUDENT,
    USER_ROLES.PROFESSOR,
    USER_ROLES.TA,
    USER_ROLES.STUDENT_SERVICE
]);
const ORDERS_RECIPIENT_FILTER_FIELD_LABELS = Object.freeze({
    type: 'Type',
    status: 'Status',
    kind: 'Kind'
});

function ensureOrdersState() {
    if (!KIU_STATE.ordersCenterByFaculty || typeof KIU_STATE.ordersCenterByFaculty !== 'object') {
        KIU_STATE.ordersCenterByFaculty = {};
    }
    if (!KIU_STATE.orderReadsByUser || typeof KIU_STATE.orderReadsByUser !== 'object') {
        KIU_STATE.orderReadsByUser = {};
    }
    if (!KIU_STATE.ordersRecipientFilterLayoutByFacultyRole || typeof KIU_STATE.ordersRecipientFilterLayoutByFacultyRole !== 'object') {
        KIU_STATE.ordersRecipientFilterLayoutByFacultyRole = {};
    }
    if (KIU_STATE.ordersRecipientFilterLayoutByFaculty && typeof KIU_STATE.ordersRecipientFilterLayoutByFaculty === 'object') {
        Object.entries(KIU_STATE.ordersRecipientFilterLayoutByFaculty).forEach(([facultyCode, layout]) => {
            const normalizedFaculty = normalizeFacultyCode(facultyCode || 'ECON', 'ECON');
            if (!KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[normalizedFaculty]
                || typeof KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[normalizedFaculty] !== 'object') {
                KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[normalizedFaculty] = {};
            }
            const roleBucket = KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[normalizedFaculty];
            ORDERS_RECIPIENT_FILTER_ROLES.forEach((role) => {
                if (!roleBucket[role]) roleBucket[role] = normalizeOrdersRecipientFilterLayout(layout) || buildMinimalOrdersRecipientFilterLayout();
            });
        });
        delete KIU_STATE.ordersRecipientFilterLayoutByFaculty;
    }
}

function normalizeOrdersRecipientFilterRole(role = '') {
    const normalized = String(role || '').trim().toLowerCase();
    return ORDERS_RECIPIENT_FILTER_ROLES.includes(normalized) ? normalized : USER_ROLES.STUDENT;
}

function getOrdersRecipientFilterCacheBucket(faculty = getCurrentFaculty()) {
    ensureOrdersState();
    const facultyCode = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[facultyCode]
        || typeof KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[facultyCode] !== 'object') {
        KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[facultyCode] = {};
    }
    return KIU_STATE.ordersRecipientFilterLayoutByFacultyRole[facultyCode];
}

function getOrdersBucketForFaculty(faculty = getCurrentFaculty()) {
    ensureOrdersState();
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.ordersCenterByFaculty[normalizedFaculty]) {
        KIU_STATE.ordersCenterByFaculty[normalizedFaculty] = { items: [] };
    }
    if (!Array.isArray(KIU_STATE.ordersCenterByFaculty[normalizedFaculty].items)) {
        KIU_STATE.ordersCenterByFaculty[normalizedFaculty].items = [];
    }
    return KIU_STATE.ordersCenterByFaculty[normalizedFaculty];
}

function buildMinimalOrdersRecipientFilterLayout() {
    return { version: 1, filters: [] };
}

function normalizeOrdersRecipientFilterOption(option = {}) {
    const value = String(option?.value ?? '').trim();
    const label = String(option?.label ?? value).trim();
    if (!value || !label || value === 'all') return null;
    return { value, label };
}

function normalizeOrdersRecipientFilterEntry(entry = {}, index = 0) {
    const field = String(entry?.field || '').trim().toLowerCase();
    // Date From/To is universal — drop legacy dateRange rows from stored layouts.
    if (field === 'date' || String(entry?.type || '').trim().toLowerCase() === 'daterange') return null;
    if (!ORDERS_RECIPIENT_FILTER_FIELDS.includes(field)) return null;
    if (!ORDERS_RECIPIENT_FILTER_SELECT_FIELDS.includes(field)) return null;
    if (String(entry?.type || 'select').trim().toLowerCase() !== 'select') return null;
    const rawId = String(entry?.id || '').trim();
    const id = rawId || `custom_${field}_${index + 1}`;
    const label = String(entry?.label || ORDERS_RECIPIENT_FILTER_FIELD_LABELS[field] || field).trim()
        || ORDERS_RECIPIENT_FILTER_FIELD_LABELS[field]
        || field;
    const enabled = entry?.enabled !== false;
    const options = (Array.isArray(entry?.options) ? entry.options : [])
        .map((option) => normalizeOrdersRecipientFilterOption(option))
        .filter(Boolean);
    if (!options.length) return null;
    return {
        id,
        type: 'select',
        field,
        label,
        enabled,
        options
    };
}

function normalizeOrdersRecipientFilterLayout(layout = null) {
    if (layout == null) return buildMinimalOrdersRecipientFilterLayout();
    if (typeof layout !== 'object') return null;
    const filters = (Array.isArray(layout.filters) ? layout.filters : [])
        .map((entry, index) => normalizeOrdersRecipientFilterEntry(entry, index))
        .filter(Boolean);
    const seenFields = new Set();
    const deduped = [];
    filters.forEach((filter) => {
        if (seenFields.has(filter.field)) return;
        seenFields.add(filter.field);
        deduped.push(filter);
    });
    return { version: 1, filters: deduped };
}

function getCachedOrdersRecipientFilterLayout(faculty = getCurrentFaculty(), recipientRole = getEffectiveUserRole()) {
    const role = normalizeOrdersRecipientFilterRole(recipientRole);
    const roleBucket = getOrdersRecipientFilterCacheBucket(faculty);
    return normalizeOrdersRecipientFilterLayout(roleBucket[role])
        || buildMinimalOrdersRecipientFilterLayout();
}

function cloneOrdersRecipientFilterLayout(layout) {
    const normalized = normalizeOrdersRecipientFilterLayout(layout) || buildMinimalOrdersRecipientFilterLayout();
    return {
        version: 1,
        filters: (normalized.filters || []).map((filter) => ({
            ...filter,
            options: Array.isArray(filter.options) ? filter.options.map((option) => ({ ...option })) : []
        }))
    };
}

function getOrdersFilterConnectionsCache() {
    ensureOrdersState();
    if (!KIU_STATE.ordersFilterConnectionsByFaculty || typeof KIU_STATE.ordersFilterConnectionsByFaculty !== 'object') {
        KIU_STATE.ordersFilterConnectionsByFaculty = {};
    }
    return KIU_STATE.ordersFilterConnectionsByFaculty;
}

function normalizeOrdersFilterConnectedRoles(roles = [], primaryRole = USER_ROLES.STUDENT) {
    const primary = normalizeOrdersRecipientFilterRole(primaryRole);
    const seen = new Set([primary]);
    (Array.isArray(roles) ? roles : []).forEach((role) => {
        const normalized = String(role || '').trim().toLowerCase();
        if (ORDERS_RECIPIENT_FILTER_ROLES.includes(normalized)) seen.add(normalized);
    });
    return ORDERS_RECIPIENT_FILTER_ROLES.filter((role) => seen.has(role));
}

function getCachedOrdersFilterConnectedRoles(faculty = getCurrentFaculty(), recipientRole = getEffectiveUserRole()) {
    const facultyCode = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const role = normalizeOrdersRecipientFilterRole(recipientRole);
    const facultyMap = getOrdersFilterConnectionsCache()[facultyCode] || {};
    return normalizeOrdersFilterConnectedRoles([role, ...(facultyMap[role] || [])], role);
}

function setCachedOrdersFilterConnectedRoles(faculty, primaryRole, connectedRoles) {
    const facultyCode = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const primary = normalizeOrdersRecipientFilterRole(primaryRole);
    const group = normalizeOrdersFilterConnectedRoles(connectedRoles, primary);
    const cache = getOrdersFilterConnectionsCache();
    const facultyMap = { ...(cache[facultyCode] || {}) };
    const oldGroup = new Set([primary, ...(facultyMap[primary] || []).map(normalizeOrdersRecipientFilterRole)]);
    ORDERS_RECIPIENT_FILTER_ROLES.forEach((role) => {
        if ((facultyMap[role] || []).map(normalizeOrdersRecipientFilterRole).includes(primary)) oldGroup.add(role);
    });
    oldGroup.forEach((role) => {
        const nextPeers = (facultyMap[role] || []).map(normalizeOrdersRecipientFilterRole).filter((peer) => !oldGroup.has(peer));
        if (nextPeers.length) facultyMap[role] = nextPeers;
        else delete facultyMap[role];
    });
    group.forEach((role) => {
        const peers = group.filter((peer) => peer !== role);
        if (peers.length) facultyMap[role] = peers;
        else delete facultyMap[role];
    });
    cache[facultyCode] = facultyMap;
    return group;
}

function setCachedOrdersRecipientFilterLayout(layout, faculty = getCurrentFaculty(), recipientRole = getEffectiveUserRole(), connectedRoles = null) {
    const role = normalizeOrdersRecipientFilterRole(recipientRole);
    const roleBucket = getOrdersRecipientFilterCacheBucket(faculty);
    const normalized = cloneOrdersRecipientFilterLayout(layout);
    const targets = connectedRoles == null
        ? [role]
        : normalizeOrdersFilterConnectedRoles(connectedRoles, role);
    targets.forEach((syncRole) => {
        roleBucket[syncRole] = cloneOrdersRecipientFilterLayout(normalized);
    });
    if (connectedRoles != null) {
        setCachedOrdersFilterConnectedRoles(faculty, role, targets);
    }
    return roleBucket[role];
}

function getEnabledOrdersRecipientLayoutFilters(layout = getCachedOrdersRecipientFilterLayout()) {
    const normalized = normalizeOrdersRecipientFilterLayout(layout) || buildMinimalOrdersRecipientFilterLayout();
    return (normalized.filters || []).filter((filter) => filter.enabled !== false);
}

function getEnabledOrdersRecipientLayoutSelects(layout = getCachedOrdersRecipientFilterLayout()) {
    return getEnabledOrdersRecipientLayoutFilters(layout).filter((filter) => filter.type === 'select');
}

function getEnabledOrdersRecipientLayoutDateRange() {
    // Universal From/To — always on for Admin Audience + every Orders inbox.
    return { id: 'universal_date', type: 'dateRange', field: 'date', label: 'Sent', enabled: true };
}

function matchesOrdersLayoutDateRange(order, dateFrom, dateTo) {
    const orderDate = String(order?.createdDate || order?.effectiveDate || '').slice(0, 10);
    if (!orderDate) return true;
    if (dateFrom && orderDate < dateFrom) return false;
    if (dateTo && orderDate > dateTo) return false;
    return true;
}

function getRecipientOrderKind(order) {
    const haystack = `${order?.type || ''} ${order?.title || ''}`;
    return /announcement|notice/i.test(haystack) ? 'announcement' : 'order';
}

function createOrdersRecipientFilterDraftEntry(field = 'type') {
    const resolvedField = ORDERS_RECIPIENT_FILTER_FIELDS.includes(field) ? field : 'type';
    return {
        id: `custom_${resolvedField}_${Date.now().toString(36)}`,
        type: 'select',
        field: resolvedField,
        label: ORDERS_RECIPIENT_FILTER_FIELD_LABELS[resolvedField] || resolvedField,
        enabled: true,
        options: []
    };
}

async function fetchOrdersRecipientFilterLayout(faculty = getCurrentFaculty(), recipientRole = getEffectiveUserRole()) {
    const facultyCode = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const role = normalizeOrdersRecipientFilterRole(recipientRole);
    if (typeof kiuPortalFetch !== 'function') {
        return getCachedOrdersRecipientFilterLayout(facultyCode, role);
    }
    try {
        const payload = await kiuPortalFetch(
            `/api/orders/recipient-filter-layout?facultyCode=${encodeURIComponent(facultyCode)}&recipientRole=${encodeURIComponent(role)}`
        );
        if (Array.isArray(payload?.connectedRoles)) {
            setCachedOrdersFilterConnectedRoles(facultyCode, payload?.recipientRole || role, payload.connectedRoles);
        }
        if (payload?.recipientFilterLayout) {
            return setCachedOrdersRecipientFilterLayout(
                payload.recipientFilterLayout,
                facultyCode,
                payload?.recipientRole || role,
                null
            );
        }
    } catch (_error) {
        /* keep cached / minimal */
    }
    return getCachedOrdersRecipientFilterLayout(facultyCode, role);
}

async function saveOrdersRecipientFilterLayout(layout, faculty = getCurrentFaculty(), recipientRole = getEffectiveUserRole(), connectedRoles = null) {
    const facultyCode = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const role = normalizeOrdersRecipientFilterRole(recipientRole);
    const normalized = normalizeOrdersRecipientFilterLayout(layout);
    if (!normalized) throw new Error('Recipient Orders filter layout is invalid.');
    const targets = normalizeOrdersFilterConnectedRoles(
        connectedRoles == null ? [role] : connectedRoles,
        role
    );
    if (typeof kiuPortalFetch !== 'function') {
        return setCachedOrdersRecipientFilterLayout(normalized, facultyCode, role, targets);
    }
    const payload = await kiuPortalFetch('/api/orders/recipient-filter-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            facultyCode,
            recipientRole: role,
            layout: normalized,
            connectedRoles: targets
        })
    });
    const savedTargets = Array.isArray(payload?.connectedRoles) ? payload.connectedRoles : targets;
    return setCachedOrdersRecipientFilterLayout(
        payload?.recipientFilterLayout || normalized,
        facultyCode,
        payload?.recipientRole || role,
        savedTargets
    );
}

function getOrderRoleLabel(role) {
    if (role === USER_ROLES.STUDENT) return 'Student';
    if (role === USER_ROLES.PROFESSOR) return 'Professor';
    if (role === USER_ROLES.TA) return 'Teaching Assistant';
    if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
    if (role === USER_ROLES.ADMIN) return 'Admin';
    return 'Portal User';
}

const ordersRegionMarkupCache = Object.create(null);

function setOrdersRegionMarkup(element, key, markup) {
    if (!element) return;
    if (ordersRegionMarkupCache[key] === markup) return;
    window.closePickerPanels?.({ immediate: true });
    element.innerHTML = markup;
    ordersRegionMarkupCache[key] = markup;
    window.enhanceUniversalPickers?.(element);
}

function createOrdersNode(tagName, { className = '', text = '', html = '', attrs = {} } = {}) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        node.setAttribute(key, String(value));
    });
    if (html) node.innerHTML = html;
    else if (text) node.textContent = text;
    return node;
}