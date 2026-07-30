const { asArray, clone, normalizeCode } = require('../utils');

const CHANCELLERY_FILTER_ROLES = Object.freeze(['student', 'professor', 'ta', 'student_service', 'admin']);

const DEFAULT_CHANCELLERY_REQUEST_KINDS = Object.freeze([
    { value: 'grade-appeal', label: 'Grade Appeal' },
    { value: 'retake-request', label: 'Retake Request' }
]);

function normalizeChancelleryFacultyCode(facultyCode = '') {
    return normalizeCode(facultyCode || 'ECON') || 'ECON';
}

function normalizeChancelleryFilterRole(role = '') {
    const normalized = String(role || '').trim().toLowerCase();
    return CHANCELLERY_FILTER_ROLES.includes(normalized) ? normalized : 'student';
}

function buildMinimalChancelleryFilterLayout() {
    return { version: 2, filters: [] };
}

function slugifyChancelleryFilterOptionValue(label = '') {
    return String(label || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeChancelleryFilterOption(option = {}) {
    const label = String(option?.label ?? option?.value ?? '').trim();
    const rawValue = String(option?.value ?? '').trim();
    const value = rawValue && rawValue !== 'all'
        ? rawValue
        : slugifyChancelleryFilterOptionValue(label);
    if (!value || !label || value === 'all') return null;
    return { value, label };
}

function normalizeChancelleryRequestKinds(kinds = null) {
    const seen = new Set();
    const out = [];
    asArray(kinds).forEach((option) => {
        const normalized = normalizeChancelleryFilterOption(option);
        if (!normalized || seen.has(normalized.value)) return;
        seen.add(normalized.value);
        out.push(normalized);
    });
    if (!out.length) {
        return DEFAULT_CHANCELLERY_REQUEST_KINDS.map((kind) => ({ ...kind }));
    }
    return out;
}

function buildDefaultChancelleryRequestKinds() {
    return DEFAULT_CHANCELLERY_REQUEST_KINDS.map((kind) => ({ ...kind }));
}

function extractRequestKindsFromRoleBucket(roleBucket = {}) {
    const collected = [];
    Object.values(roleBucket || {}).forEach((layout) => {
        asArray(layout?.filters).forEach((filter) => {
            if (String(filter?.field || '').trim().toLowerCase() !== 'type') return;
            asArray(filter?.options).forEach((option) => collected.push(option));
        });
    });
    return normalizeChancelleryRequestKinds(collected.length ? collected : null);
}

/** Custom inbox/compose droplist — not status/type/subject/date field maps. */
function normalizeChancelleryCustomFilterEntry(entry = {}, index = 0) {
    const rawId = String(entry?.id || '').trim();
    const id = rawId || `custom_filter_${index + 1}`;
    if (!id.startsWith('custom_')) return null;
    const type = String(entry?.type || 'select').trim().toLowerCase();
    if (type !== 'select') return null;
    const label = String(entry?.label || 'Dropdown').trim() || 'Dropdown';
    const enabled = entry?.enabled !== false;
    const options = asArray(entry?.options)
        .map((option) => normalizeChancelleryFilterOption(option))
        .filter(Boolean);
    if (!options.length) return null;
    return {
        id,
        type: 'select',
        label,
        enabled,
        options
    };
}

function normalizeChancelleryFilterLayout(layout = null) {
    if (layout == null) return buildMinimalChancelleryFilterLayout();
    if (typeof layout !== 'object') return null;
    const filters = asArray(layout.filters)
        .map((entry, index) => normalizeChancelleryCustomFilterEntry(entry, index))
        .filter(Boolean);
    const seenIds = new Set();
    const deduped = [];
    filters.forEach((filter) => {
        if (seenIds.has(filter.id)) return;
        seenIds.add(filter.id);
        deduped.push(filter);
    });
    return {
        version: 2,
        filters: deduped
    };
}

// Back-compat aliases used by older call sites / tests.
const CHANCELLERY_FILTER_FIELDS = new Set(['custom']);
const CHANCELLERY_FILTER_SELECT_FIELDS = new Set(['custom']);
const CHANCELLERY_FILTER_FIELD_LABELS = Object.freeze({ custom: 'Dropdown' });

function normalizeChancelleryFilterEntry(entry = {}, index = 0) {
    return normalizeChancelleryCustomFilterEntry(entry, index);
}

function applySharedRequestKindsToLayout(layout = null) {
    return normalizeChancelleryFilterLayout(layout) || buildMinimalChancelleryFilterLayout();
}

function normalizeChancelleryFilterConnectedRoles(roles = [], primaryRole = 'student') {
    const primary = normalizeChancelleryFilterRole(primaryRole);
    const seen = new Set([primary]);
    asArray(roles).forEach((role) => {
        const normalized = String(role || '').trim().toLowerCase();
        if (CHANCELLERY_FILTER_ROLES.includes(normalized)) seen.add(normalized);
    });
    return CHANCELLERY_FILTER_ROLES.filter((role) => seen.has(role));
}

function getChancelleryFilterConnectedRoles(connectionsByFaculty = {}, facultyCode = '', role = 'student') {
    const faculty = normalizeChancelleryFacultyCode(facultyCode);
    const primary = normalizeChancelleryFilterRole(role);
    const facultyMap = connectionsByFaculty?.[faculty] && typeof connectionsByFaculty[faculty] === 'object'
        ? connectionsByFaculty[faculty]
        : {};
    return normalizeChancelleryFilterConnectedRoles([primary, ...asArray(facultyMap[primary])], primary);
}

function mergeChancelleryFilterConnections(connectionsByFaculty = {}, facultyCode = '', primaryRole = 'student', connectedRoles = []) {
    const faculty = normalizeChancelleryFacultyCode(facultyCode);
    const primary = normalizeChancelleryFilterRole(primaryRole);
    const group = normalizeChancelleryFilterConnectedRoles(connectedRoles, primary);
    const facultyMap = {
        ...(connectionsByFaculty?.[faculty] && typeof connectionsByFaculty[faculty] === 'object'
            ? connectionsByFaculty[faculty]
            : {})
    };
    const oldGroup = new Set([primary, ...asArray(facultyMap[primary]).map(normalizeChancelleryFilterRole)]);
    CHANCELLERY_FILTER_ROLES.forEach((role) => {
        if (asArray(facultyMap[role]).map(normalizeChancelleryFilterRole).includes(primary)) {
            oldGroup.add(role);
        }
    });
    oldGroup.forEach((role) => {
        const nextPeers = asArray(facultyMap[role])
            .map(normalizeChancelleryFilterRole)
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
    CHANCELLERY_FILTER_FIELDS,
    CHANCELLERY_FILTER_SELECT_FIELDS,
    CHANCELLERY_FILTER_FIELD_LABELS,
    CHANCELLERY_FILTER_ROLES,
    DEFAULT_CHANCELLERY_REQUEST_KINDS,
    buildDefaultChancelleryRequestKinds,
    buildMinimalChancelleryFilterLayout,
    extractRequestKindsFromRoleBucket,
    normalizeChancelleryFacultyCode,
    normalizeChancelleryFilterRole,
    normalizeChancelleryFilterEntry,
    normalizeChancelleryCustomFilterEntry,
    normalizeChancelleryFilterLayout,
    normalizeChancelleryFilterOption,
    normalizeChancelleryRequestKinds,
    applySharedRequestKindsToLayout,
    slugifyChancelleryFilterOptionValue,
    normalizeChancelleryFilterConnectedRoles,
    getChancelleryFilterConnectedRoles,
    mergeChancelleryFilterConnections
};
