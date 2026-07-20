/* Admin registration seat limits + student registration data adapters.
 * Peeled from admin-registration.js. Load before admin-registration.js.
 */
(function initAdminRegistrationSeatsRuntime() {
    if (window.__KIU_ADMIN_REGISTRATION_SEATS_LOADED) return;
    window.__KIU_ADMIN_REGISTRATION_SEATS_LOADED = true;

    window.__kiuCreateAdminRegistrationSeatsApi = function createKiuAdminRegistrationSeatsApi(deps = {}) {
        const d = deps;
        void d;

function normalizeAssignedSeatLimit(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getAssignedSubjectSeatDefaults(item = {}) {
    return {
        lectureCapacity: normalizeAssignedSeatLimit(item?.lectureCapacity, 40),
        seminarCapacity: normalizeAssignedSeatLimit(item?.seminarCapacity, 20)
    };
}

function getCourseSeatLimitFieldConfig(item = {}) {
    const defaults = getAssignedSubjectSeatDefaults(item);
    return [
        {
            name: 'lectureCapacity',
            label: 'Lecture Seats Limit',
            type: 'number',
            min: 1,
            step: 1,
            value: defaults.lectureCapacity,
            help: 'Used as the default maximum seat count when staff create lecture groups for this subject.'
        },
        {
            name: 'seminarCapacity',
            label: 'Seminar Seats Limit',
            type: 'number',
            min: 1,
            step: 1,
            value: defaults.seminarCapacity,
            help: 'Used as the default maximum seat count when staff create seminar groups for this subject.'
        }
    ];
}

function applyAssignedCourseSeatDefaults(target, values) {
    if (!target) return;
    target.lectureCapacity = normalizeAssignedSeatLimit(values?.lectureCapacity, 40);
    target.seminarCapacity = normalizeAssignedSeatLimit(values?.seminarCapacity, 20);
}

function buildStudentCourseRefFromAssignment(assignment) {
    if (typeof assignment === 'string') {
        return {
            courseId: getAssignedCourseId(assignment),
            id: assignment,
            n: '',
            title: '',
            ects: '',
            precondition: '',
            semesterRuleMode: 'all',
            allowedSemesters: '',
            lectureCapacity: 40,
            seminarCapacity: 20
        };
    }

    const seatDefaults = getAssignedSubjectSeatDefaults(assignment);
    const sourceCourses = Array.isArray(assignment?.courses) ? assignment.courses : [];
    return {
        courseId: getAssignedCourseId(sourceCourses[0] || assignment?.courseId || assignment?.id || assignment?.n || ''),
        id: assignment?.id || assignment?.n || '',
        n: assignment?.number || assignment?.n || '',
        title: assignment?.name || assignment?.title || '',
        ects: assignment?.ects || '',
        precondition: assignment?.prerequisites || assignment?.precondition || '',
        semesterRuleMode: assignment?.semesterRuleMode || 'all',
        allowedSemesters: assignment?.allowedSemesters || '',
        lectureCapacity: seatDefaults.lectureCapacity,
        seminarCapacity: seatDefaults.seminarCapacity
    };
}

function buildStudentRegistrationDataFromAdmin(faculty) {
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'CS', 'CS');
    ensureAdminRegistrationCmsDefaults(fac);
    bindFacultyRegistrationCmsData(fac);
    if (typeof migrateAdminRegistrationCmsToTrackModel === 'function') {
        migrateAdminRegistrationCmsToTrackModel(fac);
    }
    if (typeof buildStudentRegistrationDataFromCms === 'function') {
        return buildStudentRegistrationDataFromCms(fac);
    }
    return { prog: [], free: [], conc: [], minor: [] };
}

function getStudentRegistrationDataForTab(faculty, tabId) {
    if (typeof getStudentRegistrationDataForTabFromCms === 'function') {
        return getStudentRegistrationDataForTabFromCms(faculty, tabId);
    }
    const derived = buildStudentRegistrationDataFromAdmin(faculty);
    const derivedData = derived?.[tabId];
    if (Array.isArray(derivedData)) {
        return derivedData;
    }
    const legacyData = KIU_STATE.registrationStructures?.[faculty]?.[tabId];
    return Array.isArray(legacyData) ? legacyData : [];
}

        const api = {
            normalizeAssignedSeatLimit,
            getAssignedSubjectSeatDefaults,
            getCourseSeatLimitFieldConfig,
            applyAssignedCourseSeatDefaults,
            buildStudentCourseRefFromAssignment,
            buildStudentRegistrationDataFromAdmin,
            getStudentRegistrationDataForTab,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateAdminRegistrationSeatsApi({});
})();
