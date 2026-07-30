const { asArray, clone, normalizeCode } = require('../utils');

const ORDERS_RECIPIENT_FILTER_FIELDS = new Set(['type', 'status', 'kind']);
const ORDERS_RECIPIENT_FILTER_SELECT_FIELDS = new Set(['type', 'status', 'kind']);
const ORDERS_RECIPIENT_FILTER_ROLES = Object.freeze(['student', 'professor', 'ta', 'student_service']);

const ORDERS_RECIPIENT_FILTER_FIELD_LABELS = Object.freeze({
    type: 'Type',
    status: 'Status',
    kind: 'Kind'
});

function normalizeOrdersFacultyCode(facultyCode = '') {
    return normalizeCode(facultyCode || 'ECON') || 'ECON';
}

function normalizeOrdersRecipientFilterRole(role = '') {
    const normalized = String(role || '').trim().toLowerCase();
    return ORDERS_RECIPIENT_FILTER_ROLES.includes(normalized) ? normalized : 'student';
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
    // Date From/To is universal client-side — drop legacy dateRange rows on save/load.
    if (field === 'date' || String(entry?.type || '').trim().toLowerCase() === 'daterange') return null;
    if (!ORDERS_RECIPIENT_FILTER_FIELDS.has(field)) return null;
    if (!ORDERS_RECIPIENT_FILTER_SELECT_FIELDS.has(field)) return null;
    const rawId = String(entry?.id || '').trim();
    const id = rawId || `custom_${field}_${index + 1}`;
    if (!id) return null;
    const label = String(entry?.label || ORDERS_RECIPIENT_FILTER_FIELD_LABELS[field] || field).trim()
        || ORDERS_RECIPIENT_FILTER_FIELD_LABELS[field]
        || field;
    const enabled = entry?.enabled !== false;
    const type = String(entry?.type || 'select').trim().toLowerCase();
    if (type !== 'select') return null;
    const options = asArray(entry?.options)
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
    const filters = asArray(layout.filters)
        .map((entry, index) => normalizeOrdersRecipientFilterEntry(entry, index))
        .filter(Boolean);
    const seenFields = new Set();
    const deduped = [];
    filters.forEach((filter) => {
        if (seenFields.has(filter.field)) return;
        seenFields.add(filter.field);
        deduped.push(filter);
    });
    return {
        version: 1,
        filters: deduped
    };
}

function normalizeOrdersFilterConnectedRoles(roles = [], primaryRole = 'student') {
    const primary = normalizeOrdersRecipientFilterRole(primaryRole);
    const seen = new Set([primary]);
    asArray(roles).forEach((role) => {
        const normalized = String(role || '').trim().toLowerCase();
        if (ORDERS_RECIPIENT_FILTER_ROLES.includes(normalized)) seen.add(normalized);
    });
    return ORDERS_RECIPIENT_FILTER_ROLES.filter((role) => seen.has(role));
}

function getOrdersFilterConnectedRoles(connectionsByFaculty = {}, facultyCode = '', role = 'student') {
    const faculty = normalizeOrdersFacultyCode(facultyCode);
    const primary = normalizeOrdersRecipientFilterRole(role);
    const facultyMap = connectionsByFaculty?.[faculty] && typeof connectionsByFaculty[faculty] === 'object'
        ? connectionsByFaculty[faculty]
        : {};
    return normalizeOrdersFilterConnectedRoles([primary, ...asArray(facultyMap[primary])], primary);
}

/** Replace the connection clique for primary with connectedRoles (bidirectional). */
function mergeOrdersFilterConnections(connectionsByFaculty = {}, facultyCode = '', primaryRole = 'student', connectedRoles = []) {
    const faculty = normalizeOrdersFacultyCode(facultyCode);
    const primary = normalizeOrdersRecipientFilterRole(primaryRole);
    const group = normalizeOrdersFilterConnectedRoles(connectedRoles, primary);
    const facultyMap = {
        ...(connectionsByFaculty?.[faculty] && typeof connectionsByFaculty[faculty] === 'object'
            ? connectionsByFaculty[faculty]
            : {})
    };
    const oldGroup = new Set([primary, ...asArray(facultyMap[primary]).map(normalizeOrdersRecipientFilterRole)]);
    ORDERS_RECIPIENT_FILTER_ROLES.forEach((role) => {
        if (asArray(facultyMap[role]).map(normalizeOrdersRecipientFilterRole).includes(primary)) {
            oldGroup.add(role);
        }
    });
    oldGroup.forEach((role) => {
        const nextPeers = asArray(facultyMap[role])
            .map(normalizeOrdersRecipientFilterRole)
            .filter((peer) => !oldGroup.has(peer));
        if (nextPeers.length) facultyMap[role] = nextPeers;
        else delete facultyMap[role];
    });
    group.forEach((role) => {
        const peers = group.filter((peer) => peer !== role);
        if (peers.length) facultyMap[role] = peers;
        else delete facultyMap[role];
    });
    return { ...connectionsByFaculty, [faculty]: facultyMap };
}

module.exports = {
    ORDERS_RECIPIENT_FILTER_FIELDS,
    ORDERS_RECIPIENT_FILTER_SELECT_FIELDS,
    ORDERS_RECIPIENT_FILTER_FIELD_LABELS,
    ORDERS_RECIPIENT_FILTER_ROLES,
    buildMinimalOrdersRecipientFilterLayout,
    normalizeOrdersFacultyCode,
    normalizeOrdersRecipientFilterRole,
    normalizeOrdersRecipientFilterEntry,
    normalizeOrdersRecipientFilterLayout,
    normalizeOrdersRecipientFilterOption,
    normalizeOrdersFilterConnectedRoles,
    getOrdersFilterConnectedRoles,
    mergeOrdersFilterConnections
};
