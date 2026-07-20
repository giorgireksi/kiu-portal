/* State text-repair + deleted-staff registry helpers. Peeled from state.js.
 * Load before state.js.
 */
(function initWave18Peel() {
    if (window.__KIU_STATE_DELETED_STAFF_LOADED) return;
    window.__KIU_STATE_DELETED_STAFF_LOADED = true;

    window.__kiuCreateStateDeletedStaffApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function repairTextFields(record, fields = []) {
    if (!record || typeof record !== 'object') return record;
    let next = record;
    let mutated = false;
    fields.forEach((field) => {
        if (typeof next[field] === 'string' && next[field].trim()) {
            const repaired = repairDisplayTextValue(next[field]);
            if (repaired !== next[field]) {
                if (!mutated) {
                    next = { ...record };
                    mutated = true;
                }
                next[field] = repaired;
            }
        }
    });
    return next;
}

function repairCurriculumSubjectRecord(subject) {
    const next = repairTextFields(subject, [
        'name',
        'title',
        'subjectName',
        'label',
        'courseName',
        'description',
        'summary',
        'facultyName',
        'semesterLabel',
        'termLabel'
    ]);
    return next && typeof next === 'object' ? next : subject;
}

function repairAvailableGroupRecord(subjectId, group) {
    const normalized = typeof normalizeScheduleGroup === 'function'
        ? normalizeScheduleGroup(subjectId, group)
        : group;
    const next = repairTextFields(normalized, [
        'name',
        'title',
        'subjectName',
        'label',
        'courseName',
        'day',
        'time',
        'timeDay',
        'endTime',
        'room',
        'prof',
        'ta'
    ]);
    return next && typeof next === 'object' ? next : normalized;
}

function repairStudentScheduleRecord(entry) {
    const next = repairTextFields(entry, [
        'title',
        'subjectName',
        'courseName',
        'groupName',
        'groupLabel',
        'day',
        'time',
        'timeDay',
        'endTime',
        'room',
        'prof',
        'ta'
    ]);
    return next && typeof next === 'object' ? next : entry;
}

function normalizeDeletedStaffType(type, role = '') {
    const normalizedType = String(type || '').trim().toLowerCase();
    if (normalizedType === 'professors' || normalizedType === 'professor') return 'professors';
    if (normalizedType === 'tas' || normalizedType === 'ta') return 'tas';
    if (normalizedType === 'service' || normalizedType === 'student_service' || normalizedType === 'student-service') return 'service';

    const normalizedRole = String(role || '').trim().toLowerCase();
    if (normalizedRole === String(USER_ROLES.PROFESSOR || '').toLowerCase()) return 'professors';
    if (normalizedRole === String(USER_ROLES.TA || '').toLowerCase()) return 'tas';
    if (normalizedRole === String(USER_ROLES.STUDENT_SERVICE || '').toLowerCase()) return 'service';
    return '';
}

function normalizeDeletedStaffEntry(entry) {
    const normalizedType = normalizeDeletedStaffType(entry?.type, entry?.role);
    const id = String(entry?.id || '').trim();
    if (!normalizedType || !id) return null;
    return {
        id,
        type: normalizedType,
        facultyCode: normalizeFacultyCode(entry?.facultyCode || entry?.faculty || '', '')
    };
}

function getDeletedStaffRegistry() {
    if (Array.isArray(kiuDeletedStaffRegistryCache)) return kiuDeletedStaffRegistryCache;
    let parsed = [];
    try {
        parsed = JSON.parse(localStorage.getItem(KIU_DELETED_STAFF_REGISTRY_KEY) || '[]');
    } catch (error) {
        parsed = [];
    }
    kiuDeletedStaffRegistryCache = Array.isArray(parsed)
        ? parsed.map(normalizeDeletedStaffEntry).filter(Boolean)
        : [];
    return kiuDeletedStaffRegistryCache;
}

function persistDeletedStaffRegistry(registry) {
    const normalized = Array.isArray(registry) ? registry.map(normalizeDeletedStaffEntry).filter(Boolean) : [];
    kiuDeletedStaffRegistryCache = normalized;
    try {
        localStorage.setItem(KIU_DELETED_STAFF_REGISTRY_KEY, JSON.stringify(normalized));
    } catch (error) {
        console.warn('Could not persist deleted staff registry.', error);
    }
}

function isStaffMemberDeleted(member, type, facultyCode) {
    const id = String(member?.id || '').trim();
    const normalizedType = normalizeDeletedStaffType(type, member?.role);
    if (!id || !normalizedType) return false;
    const normalizedFaculty = normalizeFacultyCode(facultyCode || member?.facultyCode || member?.faculty || '', '');
    return getDeletedStaffRegistry().some(entry => (
        entry.id === id
        && entry.type === normalizedType
        && normalizeFacultyCode(entry.facultyCode || '', '') === normalizedFaculty
    ));
}

function pruneDeletedStaffMembersFromState(state = KIU_STATE) {
    if (!state || typeof state !== 'object') return;

    if (state.facultyProfiles && typeof state.facultyProfiles === 'object') {
        Object.entries(state.facultyProfiles).forEach(([facultyCode, profile]) => {
            if (!profile || typeof profile !== 'object') return;
            ['professors', 'tas'].forEach(groupKey => {
                if (!Array.isArray(profile[groupKey])) return;
                profile[groupKey] = profile[groupKey].filter(member => !isStaffMemberDeleted(member, groupKey, facultyCode));
            });
        });
    }

    if (Array.isArray(state.users)) {
        state.users = state.users.filter(user => {
            const normalizedType = normalizeDeletedStaffType('', user?.role);
            if (!normalizedType) return true;
            return !isStaffMemberDeleted(user, normalizedType, user?.facultyCode || user?.faculty || '');
        });
    }
}

function markStaffMemberDeleted(member, type, facultyCode) {
    const entry = normalizeDeletedStaffEntry({
        id: member?.id,
        type,
        facultyCode: facultyCode || member?.facultyCode || member?.faculty || ''
    });
    if (!entry) return;
    const nextRegistry = getDeletedStaffRegistry().filter(existing => !(
        existing.id === entry.id
        && existing.type === entry.type
        && normalizeFacultyCode(existing.facultyCode || '', '') === normalizeFacultyCode(entry.facultyCode || '', '')
    ));
    nextRegistry.push(entry);
    persistDeletedStaffRegistry(nextRegistry);
    pruneDeletedStaffMembersFromState(KIU_STATE);
}

        const api = {
            repairTextFields,
            repairCurriculumSubjectRecord,
            repairAvailableGroupRecord,
            repairStudentScheduleRecord,
            normalizeDeletedStaffType,
            normalizeDeletedStaffEntry,
            getDeletedStaffRegistry,
            persistDeletedStaffRegistry,
            isStaffMemberDeleted,
            pruneDeletedStaffMembersFromState,
            markStaffMemberDeleted,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateStateDeletedStaffApi({});
})();

