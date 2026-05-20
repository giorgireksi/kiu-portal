/* Admin registration CMS logic extracted from core.js. Source of truth remains root core.js compatibility bundle. */

// --- ADMIN REGISTRATION CMS LOGIC ---


// Ensure authentication is enforced on page load
document.addEventListener('DOMContentLoaded', () => {
    refreshSemesterDropdowns();
    ensureSubjectSemesterParityHint();

    if (typeof requireAuth === 'function') {
        requireAuth();
    }

    bindAdminRegistrationCmsDelegates();
    
    // Initialize Admin Registration CMS if on the right page
    if (document.getElementById('admin-reg-content-container')) {
        ensureAdminRegistrationCmsDefaults(getAdminRegistrationFaculty());
        bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());
        bootAdminRegistrationCms('prog');
    }

    // Initialize Student Registration if on the right page
    if (document.getElementById('student-reg-content-container')) {
        renderStudentRegStructures('prog');
        updateEctsProgress();
    }
});

window.addEventListener('load', () => {
    bindAdminRegistrationCmsDelegates();
    const adminCms = document.getElementById('admin-reg-content-container');
    if (adminCms && !hasVisibleAdminRegistrationCmsContent(adminCms)) {
        try {
            ensureAdminRegistrationCmsDefaults(getAdminRegistrationFaculty());
            bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());
            bootAdminRegistrationCms(adminRegActiveTab || 'prog');
        } catch (err) {
            console.error('Admin CMS load fallback failed:', err);
        }
    }
});

function bootAdminRegistrationCms(tabType = 'prog') {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;

    // PERFORMANCE: Only render if container is truly empty or forced.
    // This prevents the "infinite render loop" when combined with the luxury shell.
    if (hasVisibleAdminRegistrationCmsContent(container)) {
        // If it's already rendered, we might still want to ensure the right tab is showing
        // but avoid a full container wipe if possible.
        return;
    }

    renderAdminRegistrationModules(tabType);
}

function hasVisibleAdminRegistrationCmsContent(container) {
    if (!container) return false;
    if (container.children.length > 0) return true;
    return Boolean((container.textContent || '').trim());
}

function updateEctsProgress() {
    const progressBar = document.getElementById('ects-progress-bar');
    const ectsText = document.getElementById('ects-text');
    if (!progressBar || !ectsText || typeof getStudentCompletedEctsThisSemester !== 'function') return;

    const user = getCurrentUser() || { id: '31961' };
    const fac = getCurrentFaculty() || 'ECON';
    const totalEcts = getStudentCompletedEctsThisSemester(user.id, fac);
    const percentage = Math.min((totalEcts / 36) * 100, 100);
    progressBar.style.width = percentage + '%';
    ectsText.innerText = `${totalEcts} / 36`;

    if (totalEcts > 36) {
        ectsText.style.color = 'var(--kiu-red)';
        progressBar.style.background = 'var(--kiu-red)';
    } else {
        ectsText.style.color = 'var(--kiu-orange)';
        progressBar.style.background = 'var(--kiu-orange)';
    }
}

function getDefaultAdminRegistrationCmsStructures() {
    return {
        prog: [],
        free: [],
        conc: [],
        minor: []
    };
}

function ensureAdminRegistrationCmsDefaults(faculty) {
    const fac = normalizeFacultyCode(
        faculty || (document.getElementById('admin-reg-content-container') ? getAdminRegistrationFaculty() : getCurrentFaculty()) || 'CS',
        'CS'
    );
    if (!KIU_STATE.adminProgramStructures) KIU_STATE.adminProgramStructures = {};

    const defaults = getDefaultAdminRegistrationCmsStructures();
    const current = KIU_STATE.adminProgramStructures[fac];

    if (!current) {
        KIU_STATE.adminProgramStructures[fac] = JSON.parse(JSON.stringify(defaults));
        saveState();
        return;
    }

    let changed = false;
    ['prog', 'free', 'conc', 'minor'].forEach(tab => {
        if (!Array.isArray(current[tab])) {
            current[tab] = JSON.parse(JSON.stringify(defaults[tab]));
            changed = true;
        }
    });

    if (changed) saveState();
}

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
    const cmsBucket = bindFacultyRegistrationCmsData(fac) || {};

    const facultyStructures = KIU_STATE.adminProgramStructures?.[fac];
    if (!facultyStructures) return null;

    const normalizeArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
    const facultyConcCourseData = (cmsBucket.concCourseData && typeof cmsBucket.concCourseData === 'object')
        ? cmsBucket.concCourseData
        : {};
    const facultyMinorProgramData = (cmsBucket.minorProgramData && typeof cmsBucket.minorProgramData === 'object')
        ? cmsBucket.minorProgramData
        : {};

    const convertModule = (module) => ({
        id: module?.id || '',
        letter: module?.letter || '',
        name: module?.name || 'Untitled Module',
        maxEcts: module?.maxEcts || 0,
        minEcts: module?.minEcts || 0,
        courses: normalizeArray(module?.subModules).map(buildStudentCourseRefFromAssignment)
    });

    const convertTrackGroup = (groupName, group, index) => ({
        id: `${groupName}-${index}`,
        letter: String.fromCharCode(65 + (index % 26)),
        name: groupName,
        maxEcts: group?.maxEcts || parseEctsProgress(group?.ects || '0/0').max || 0,
        minEcts: 0,
        courses: normalizeArray(group?.courses).map(course => ({
            courseId: getAssignedCourseId(course),
            id: course?.n || '',
            n: course?.n || '',
            title: course?.title || '',
            ects: course?.ects || '',
            precondition: course?.precondition || '',
            semesterRuleMode: course?.semesterRuleMode || 'all',
            allowedSemesters: course?.allowedSemesters || '',
            lectureCapacity: normalizeAssignedSeatLimit(course?.lectureCapacity, 40),
            seminarCapacity: normalizeAssignedSeatLimit(course?.seminarCapacity, 20)
        }))
    });

    return {
        prog: normalizeArray(facultyStructures.prog).map(convertModule),
        free: normalizeArray(facultyStructures.free).map(convertModule),
        conc: Object.entries(facultyConcCourseData).map(([programName, groups]) => ({
            id: programName,
            name: programName,
            modules: Object.entries(groups || {}).map(([groupName, group], index) => convertTrackGroup(groupName, group, index))
        })),
        minor: Object.entries(facultyMinorProgramData).map(([programName, program]) => ({
            id: programName,
            name: programName,
            modules: Object.entries(program?.courseGroups || {}).map(([groupName, group], index) => convertTrackGroup(groupName, group, index))
        }))
    };
}

function getStudentRegistrationDataForTab(faculty, tabId) {
    const derived = buildStudentRegistrationDataFromAdmin(faculty);
    const derivedData = derived?.[tabId];
    if (Array.isArray(derivedData)) {
        return derivedData;
    }
    const legacyData = KIU_STATE.registrationStructures?.[faculty]?.[tabId];
    return Array.isArray(legacyData) ? legacyData : [];
}

// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
// ADMIN REGISTRATION STRUCTURE CMS - FUNCTIONAL IMPLEMENTATION
// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â

// Initialize program structures in state if not present - FACULTY SCOPED with NESTED STRUCTURE
if (!KIU_STATE.adminProgramStructures) {
    KIU_STATE.adminProgramStructures = createEmptyAdminProgramStructures(KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {});
}
if (!KIU_STATE.adminProgramStructures) {
    KIU_STATE.adminProgramStructures = {
        'CS': {
            'prog': [
                { 
                    id: 'M-CORE',
                    name: 'Management Compulsory Courses',
                    minEcts: 120,
                    maxEcts: 72,
                    letter: 'A',
                    subModules: [],
                    required: true
                },
                { 
                    id: 'M-ELEC',
                    name: 'Elective Courses',
                    minEcts: 30,
                    maxEcts: 0,
                    letter: 'B',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-INTERN',
                    name: 'Internship',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'C',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-THESIS',
                    name: 'Bachelor Thesis',
                    minEcts: 12,
                    maxEcts: 0,
                    letter: 'D',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-LANG',
                    name: 'English Language 1,2 & Business English',
                    minEcts: 18,
                    maxEcts: 12,
                    letter: 'E',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-COMM',
                    name: 'Academic Writing & Communications Skills.',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'F',
                    subModules: [],
                    required: false
                }
            ],
            'free': [
                { 
                    id: 'M-FREE',
                    name: 'Free Credits',
                    minEcts: 0,
                    maxEcts: 12,
                    letter: 'C',
                    subModules: [
                        {
                            id: 'SM-CS-FREE1',
                            number: '241',
                            name: 'Introduction to Programming',
                            ects: '6/72',
                            courses: ['CS-S1-101'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false
                }
            ],
            'conc': [
                { 
                    id: 'CONC-WEB',
                    name: 'Web Development Concentration',
                    minEcts: 10,
                    maxEcts: 15,
                    letter: 'D',
                    subModules: [
                        {
                            id: 'SM-CS-CONC1',
                            number: '251',
                            name: 'Mathematics for CS I',
                            ects: '6/72',
                            courses: ['CS-S1-102'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false
                }
            ],
            'minor': [
                { 
                    id: 'MINOR-MATH',
                    name: 'Mathematics Minor',
                    minEcts: 15,
                    maxEcts: 20,
                    letter: 'E',
                    subModules: [
                        {
                            id: 'SM-CS-MINOR1',
                            number: '261',
                            name: 'Data Structures & Algorithms',
                            ects: '6/72',
                            courses: ['CS-S2-201'],
                            prerequisites: '[REQ] CS-S1-101',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false
                }
            ]
        },
        'ECON': {
            'prog': [
                { 
                    id: 'M-CORE',
                    name: 'Management Compulsory Courses',
                    minEcts: 120,
                    maxEcts: 72,
                    letter: 'A',
                    subModules: [],
                    required: true
                },
                { 
                    id: 'M-ELEC',
                    name: 'Elective Courses',
                    minEcts: 30,
                    maxEcts: 0,
                    letter: 'B',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-INTERN',
                    name: 'Internship',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'C',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-THESIS',
                    name: 'Bachelor Thesis',
                    minEcts: 12,
                    maxEcts: 0,
                    letter: 'D',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-LANG',
                    name: 'English Language 1,2 & Business English',
                    minEcts: 18,
                    maxEcts: 12,
                    letter: 'E',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-COMM',
                    name: 'Academic Writing & Communications Skills.',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'F',
                    subModules: [],
                    required: false
                }
            ],
            'free': [
                { 
                    id: 'M-FREE', 
                    name: 'Free Credits', 
                    minEcts: 0, 
                    maxEcts: 12, 
                    letter: 'C', 
                    subModules: [
                        {
                            id: 'SM-ECON-FREE1',
                            number: '241',
                            name: 'Introduction to Economics',
                            ects: '6/72',
                            courses: ['ECON-S1-101'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false 
                }
            ],
            'conc': [
                { 
                    id: 'CONC-MARK', 
                    name: 'Management Compulsory Courses', 
                    minEcts: 120, 
                    maxEcts: 72, 
                    letter: 'A', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'CONC-ELEC', 
                    name: 'Elective Courses', 
                    minEcts: 30, 
                    maxEcts: 0, 
                    letter: 'B', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'CONC-INT', 
                    name: 'Internship', 
                    minEcts: 6, 
                    maxEcts: 0, 
                    letter: 'C', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'CONC-THESIS', 
                    name: 'Bachelor Thesis', 
                    minEcts: 12, 
                    maxEcts: 0, 
                    letter: 'D', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'CONC-LANG', 
                    name: 'English Language 1,2 & Business English', 
                    minEcts: 18, 
                    maxEcts: 12, 
                    letter: 'E', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'CONC-COMM', 
                    name: 'Academic Writing & Communications Skills.', 
                    minEcts: 6, 
                    maxEcts: 0, 
                    letter: 'F', 
                    subModules: [],
                    required: false 
                }
            ],
            'minor': [
                { 
                    id: 'MINOR-ECON', 
                    name: 'Management Compulsory Courses', 
                    minEcts: 120, 
                    maxEcts: 72, 
                    letter: 'A', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'MINOR-ELEC', 
                    name: 'Elective Courses', 
                    minEcts: 30, 
                    maxEcts: 0, 
                    letter: 'B', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'MINOR-INT', 
                    name: 'Internship', 
                    minEcts: 6, 
                    maxEcts: 0, 
                    letter: 'C', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'MINOR-THESIS', 
                    name: 'Bachelor Thesis', 
                    minEcts: 12, 
                    maxEcts: 0, 
                    letter: 'D', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'MINOR-LANG', 
                    name: 'English Language 1,2 & Business English', 
                    minEcts: 18, 
                    maxEcts: 12, 
                    letter: 'E', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'MINOR-COMM', 
                    name: 'Academic Writing & Communications Skills.', 
                    minEcts: 6, 
                    maxEcts: 0, 
                    letter: 'F', 
                    subModules: [],
                    required: false 
                }
            ]
        },
        'LAW': {
            'prog': [
                { 
                    id: 'M-CORE', 
                    name: 'Management Compulsory Courses', 
                    minEcts: 120, 
                    maxEcts: 72, 
                    letter: 'A', 
                    subModules: [],
                    required: true 
                },
                { 
                    id: 'M-ELEC', 
                    name: 'Elective Courses', 
                    minEcts: 30, 
                    maxEcts: 0, 
                    letter: 'B', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'M-INTERN', 
                    name: 'Internship', 
                    minEcts: 6, 
                    maxEcts: 0, 
                    letter: 'C', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'M-THESIS', 
                    name: 'Bachelor Thesis', 
                    minEcts: 12, 
                    maxEcts: 0, 
                    letter: 'D', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'M-LANG', 
                    name: 'English Language 1,2 & Business English', 
                    minEcts: 18, 
                    maxEcts: 12, 
                    letter: 'E', 
                    subModules: [],
                    required: false 
                },
                { 
                    id: 'M-COMM', 
                    name: 'Academic Writing & Communications Skills.', 
                    minEcts: 6, 
                    maxEcts: 0, 
                    letter: 'F', 
                    subModules: [],
                    required: false 
                }
            ],
            'free': [
                { 
                    id: 'M-FREE', 
                    name: 'Free Credits', 
                    minEcts: 0, 
                    maxEcts: 12, 
                    letter: 'C', 
                    subModules: [
                        {
                            id: 'SM-LAW-FREE1',
                            number: '241',
                            name: 'Philosophy of Law',
                            ects: '5/60',
                            courses: ['LAW-S2-201'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false 
                }
            ],
            'conc': [
                { 
                    id: 'CONC-BIZ', 
                    name: 'Business Law Concentration', 
                    minEcts: 10, 
                    maxEcts: 15, 
                    letter: 'D', 
                    subModules: [
                        {
                            id: 'SM-LAW-CONC1',
                            number: '251',
                            name: 'Sociology of Law',
                            ects: '5/60',
                            courses: ['LAW-S2-202'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false 
                }
            ],
            'minor': [
                { 
                    id: 'MINOR-INT', 
                    name: 'International Law Minor', 
                    minEcts: 15, 
                    maxEcts: 20, 
                    letter: 'E', 
                    subModules: [
                        {
                            id: 'SM-LAW-MINOR1',
                            number: '261',
                            name: 'Business Law',
                            ects: '5/60',
                            courses: ['LAW-S3-301'],
                            prerequisites: '[REQ] LAW-S2-201',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false 
                }
            ]
        },
        'MED': {
            'prog': [
                { 
                    id: 'M-CORE',
                    name: 'Management Compulsory Courses',
                    minEcts: 120,
                    maxEcts: 72,
                    letter: 'A',
                    subModules: [],
                    required: true
                },
                { 
                    id: 'M-ELEC',
                    name: 'Elective Courses',
                    minEcts: 30,
                    maxEcts: 0,
                    letter: 'B',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-INTERN',
                    name: 'Internship',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'C',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-THESIS',
                    name: 'Bachelor Thesis',
                    minEcts: 12,
                    maxEcts: 0,
                    letter: 'D',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-LANG',
                    name: 'English Language 1,2 & Business English',
                    minEcts: 18,
                    maxEcts: 12,
                    letter: 'E',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-COMM',
                    name: 'Academic Writing & Communications Skills.',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'F',
                    subModules: [],
                    required: false
                }
            ],
            'free': [
                { 
                    id: 'M-FREE', 
                    name: 'Free Credits', 
                    minEcts: 0, 
                    maxEcts: 12, 
                    letter: 'C', 
                    subModules: [
                        {
                            id: 'SM-MED-FREE1',
                            number: '241',
                            name: 'Clinical Pathology',
                            ects: '5/60',
                            courses: ['MED-S2-202'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false 
                }
            ],
            'conc': [],
            'minor': []
        },
        'ARTS': {
            'prog': [
                { 
                    id: 'M-CORE',
                    name: 'Management Compulsory Courses',
                    minEcts: 120,
                    maxEcts: 72,
                    letter: 'A',
                    subModules: [],
                    required: true
                },
                { 
                    id: 'M-ELEC',
                    name: 'Elective Courses',
                    minEcts: 30,
                    maxEcts: 0,
                    letter: 'B',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-INTERN',
                    name: 'Internship',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'C',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-THESIS',
                    name: 'Bachelor Thesis',
                    minEcts: 12,
                    maxEcts: 0,
                    letter: 'D',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-LANG',
                    name: 'English Language 1,2 & Business English',
                    minEcts: 18,
                    maxEcts: 12,
                    letter: 'E',
                    subModules: [],
                    required: false
                },
                { 
                    id: 'M-COMM',
                    name: 'Academic Writing & Communications Skills.',
                    minEcts: 6,
                    maxEcts: 0,
                    letter: 'F',
                    subModules: [],
                    required: false
                }
            ],
            'free': [
                { 
                    id: 'M-FREE', 
                    name: 'Free Credits', 
                    minEcts: 0, 
                    maxEcts: 12, 
                    letter: 'C', 
                    subModules: [
                        {
                            id: 'SM-ARTS-FREE1',
                            number: '241',
                            name: 'Art History & Aesthetics',
                            ects: '5/60',
                            courses: ['ARTS-S2-202'],
                            prerequisites: 'None',
                            approved: false,
                            status: 'pending'
                        }
                    ],
                    required: false 
                }
            ],
            'conc': [],
            'minor': []
        }
    };
}

function ensureProgTabStructure(faculty) {
    faculty = normalizeFacultyCode(faculty, 'ECON');
    if (!KIU_STATE.adminProgramStructures[faculty]) {
        KIU_STATE.adminProgramStructures[faculty] = getDefaultAdminRegistrationCmsStructures();
    }

    if (!Array.isArray(KIU_STATE.adminProgramStructures[faculty].prog)) {
        KIU_STATE.adminProgramStructures[faculty].prog = [];
    }
}

function getAdminRegistrationFaculty() {
    const facultySelect = document.getElementById('faculty-select');
    const selected = facultySelect?.value || localStorage.getItem('currentFaculty') || 'ECON';
    return normalizeFacultyCode(selected, 'ECON');
}

let adminRegScopedFaculty = 'ECON';

function getAdminRegistrationFacultyScoped() {
    return normalizeFacultyCode(
        adminRegScopedFaculty || getAdminRegistrationFaculty(),
        'ECON'
    );
}

function getAdminCmsWriteFaculty() {
    const container = document.getElementById('admin-reg-content-container');
    const containerFaculty = container?.dataset?.cmsFaculty;
    return normalizeFacultyCode(
        containerFaculty || getAdminRegistrationFacultyScoped(),
        'ECON'
    );
}

// Track which tab is active and which modules are expanded
let adminRegActiveTab = 'prog';
let expandedModules = new Set();
let adminRegUiState = {
    selectedProgModule: null,
    selectedFreeModule: null,
    selectedConcProgram: null,
    selectedConcGroup: null,
    selectedMinorProgram: null
};
let curriculumLibraryUiState = {
    selectedModulesByFaculty: {}
};
let studentEducationalProgramUiState = {
    selectedModulesByFaculty: {}
};

let adminRegistrationCmsDelegatesBound = false;

function bindAdminRegistrationCmsDelegates() {
    if (adminRegistrationCmsDelegatesBound) return;
    const root = document.getElementById('admin-reg-content-container');
    if (!root) return;
    adminRegistrationCmsDelegatesBound = true;

    root.addEventListener('click', (event) => {
        const addModuleTrigger = event.target.closest('[data-admin-reg-add-module]');
        if (addModuleTrigger) {
            event.preventDefault();
            addNewAdminRegModule(addModuleTrigger.dataset.adminRegAddModule || adminRegActiveTab);
            return;
        }

        const editModuleTrigger = event.target.closest('[data-admin-reg-edit-module]');
        if (editModuleTrigger) {
            event.preventDefault();
            editAdminRegModule(editModuleTrigger.dataset.adminRegEditModule || '');
            return;
        }

        const deleteModuleTrigger = event.target.closest('[data-admin-reg-delete-module]');
        if (deleteModuleTrigger) {
            event.preventDefault();
            deleteAdminRegModule(
                deleteModuleTrigger.dataset.adminRegDeleteModule || '',
                deleteModuleTrigger.dataset.adminRegTab || adminRegActiveTab
            );
            return;
        }

        const addSubjectTrigger = event.target.closest('[data-admin-reg-add-subject]');
        if (addSubjectTrigger) {
            event.preventDefault();
            openCourseSelectionModal(
                addSubjectTrigger.dataset.adminRegAddSubject || '',
                addSubjectTrigger.dataset.adminRegTab || adminRegActiveTab
            );
            return;
        }

        const editSubmoduleTrigger = event.target.closest('[data-admin-reg-edit-submodule]');
        if (editSubmoduleTrigger) {
            event.preventDefault();
            const moduleId = editSubmoduleTrigger.dataset.adminRegParentModule || '';
            const submoduleId = editSubmoduleTrigger.dataset.adminRegEditSubmodule || '';
            const tab = editSubmoduleTrigger.dataset.adminRegTab || adminRegActiveTab;
            if (tab === 'free') {
                editFreeSubModule(moduleId, submoduleId);
            } else {
                editProgSubModule(moduleId, submoduleId);
            }
            return;
        }

        const deleteSubmoduleTrigger = event.target.closest('[data-admin-reg-delete-submodule]');
        if (deleteSubmoduleTrigger) {
            event.preventDefault();
            removeAdminRegSubModule(
                deleteSubmoduleTrigger.dataset.adminRegParentModule || '',
                deleteSubmoduleTrigger.dataset.adminRegDeleteSubmodule || '',
                deleteSubmoduleTrigger.dataset.adminRegTab || adminRegActiveTab
            );
            return;
        }

        const addConcProgramTrigger = event.target.closest('[data-admin-reg-add-conc-program]');
        if (addConcProgramTrigger) {
            event.preventDefault();
            addConcProgram();
            return;
        }

        const deleteConcProgramTrigger = event.target.closest('[data-admin-reg-delete-conc-program]');
        if (deleteConcProgramTrigger) {
            event.preventDefault();
            deleteConcProgram(deleteConcProgramTrigger.dataset.adminRegDeleteConcProgram || '');
            return;
        }

        const addConcGroupTrigger = event.target.closest('[data-admin-reg-add-conc-group]');
        if (addConcGroupTrigger) {
            event.preventDefault();
            addCourseGroupToConcentration(addConcGroupTrigger.dataset.adminRegAddConcGroup || '');
            return;
        }

        const toggleConcGroupTrigger = event.target.closest('[data-admin-reg-toggle-conc-group]');
        if (toggleConcGroupTrigger) {
            event.preventDefault();
            toggleAdminRegModule(toggleConcGroupTrigger.dataset.adminRegToggleConcGroup || '');
            return;
        }

        const editConcGroupTrigger = event.target.closest('[data-admin-reg-edit-conc-group]');
        if (editConcGroupTrigger) {
            event.preventDefault();
            editConcGroup(
                editConcGroupTrigger.dataset.adminRegConcProgram || '',
                editConcGroupTrigger.dataset.adminRegEditConcGroup || ''
            );
            return;
        }

        const deleteConcGroupTrigger = event.target.closest('[data-admin-reg-delete-conc-group]');
        if (deleteConcGroupTrigger) {
            event.preventDefault();
            deleteConcGroup(
                deleteConcGroupTrigger.dataset.adminRegConcProgram || '',
                deleteConcGroupTrigger.dataset.adminRegDeleteConcGroup || ''
            );
            return;
        }

        const addConcSubjectTrigger = event.target.closest('[data-admin-reg-add-conc-subject]');
        if (addConcSubjectTrigger) {
            event.preventDefault();
            addSubjectToConcGroup(
                addConcSubjectTrigger.dataset.adminRegConcProgram || '',
                addConcSubjectTrigger.dataset.adminRegAddConcSubject || ''
            );
            return;
        }

        const editConcCourseTrigger = event.target.closest('[data-admin-reg-edit-conc-course]');
        if (editConcCourseTrigger) {
            event.preventDefault();
            editConcCourseName(
                editConcCourseTrigger.dataset.adminRegConcProgram || '',
                editConcCourseTrigger.dataset.adminRegConcGroup || '',
                Number.parseInt(editConcCourseTrigger.dataset.adminRegEditConcCourse || '0', 10) || 0
            );
            return;
        }

        const deleteConcCourseTrigger = event.target.closest('[data-admin-reg-delete-conc-course]');
        if (deleteConcCourseTrigger) {
            event.preventDefault();
            removeConcCourse(
                deleteConcCourseTrigger.dataset.adminRegConcProgram || '',
                deleteConcCourseTrigger.dataset.adminRegConcGroup || '',
                Number.parseInt(deleteConcCourseTrigger.dataset.adminRegDeleteConcCourse || '0', 10) || 0
            );
            return;
        }

        const addMinorProgramTrigger = event.target.closest('[data-admin-reg-add-minor-program]');
        if (addMinorProgramTrigger) {
            event.preventDefault();
            addMinorProgram();
            return;
        }

        const deleteMinorProgramTrigger = event.target.closest('[data-admin-reg-delete-minor-program]');
        if (deleteMinorProgramTrigger) {
            event.preventDefault();
            deleteMinorProgram(deleteMinorProgramTrigger.dataset.adminRegDeleteMinorProgram || '');
            return;
        }

        const addMinorGroupTrigger = event.target.closest('[data-admin-reg-add-minor-group]');
        if (addMinorGroupTrigger) {
            event.preventDefault();
            addCourseGroupToMinor(addMinorGroupTrigger.dataset.adminRegAddMinorGroup || '');
            return;
        }

        const toggleMinorGroupTrigger = event.target.closest('[data-admin-reg-toggle-minor-group]');
        if (toggleMinorGroupTrigger) {
            event.preventDefault();
            toggleAdminRegModule(toggleMinorGroupTrigger.dataset.adminRegToggleMinorGroup || '');
            return;
        }

        const editMinorGroupTrigger = event.target.closest('[data-admin-reg-edit-minor-group]');
        if (editMinorGroupTrigger) {
            event.preventDefault();
            editMinorCourseGroup(
                editMinorGroupTrigger.dataset.adminRegMinorProgram || '',
                editMinorGroupTrigger.dataset.adminRegEditMinorGroup || ''
            );
            return;
        }

        const deleteMinorGroupTrigger = event.target.closest('[data-admin-reg-delete-minor-group]');
        if (deleteMinorGroupTrigger) {
            event.preventDefault();
            deleteMinorCourseGroup(
                deleteMinorGroupTrigger.dataset.adminRegMinorProgram || '',
                deleteMinorGroupTrigger.dataset.adminRegDeleteMinorGroup || ''
            );
            return;
        }

        const addMinorSubjectTrigger = event.target.closest('[data-admin-reg-add-minor-subject]');
        if (addMinorSubjectTrigger) {
            event.preventDefault();
            addSubjectToGroup(
                addMinorSubjectTrigger.dataset.adminRegMinorProgram || '',
                addMinorSubjectTrigger.dataset.adminRegAddMinorSubject || ''
            );
            return;
        }

        const editMinorCourseTrigger = event.target.closest('[data-admin-reg-edit-minor-course]');
        if (editMinorCourseTrigger) {
            event.preventDefault();
            editMinorCourse(
                editMinorCourseTrigger.dataset.adminRegMinorProgram || '',
                editMinorCourseTrigger.dataset.adminRegMinorGroup || '',
                Number.parseInt(editMinorCourseTrigger.dataset.adminRegEditMinorCourse || '0', 10) || 0
            );
            return;
        }
    });

    root.addEventListener('change', (event) => {
        const moduleSelectTrigger = event.target.closest('[data-admin-reg-select-module]');
        if (moduleSelectTrigger) {
            const moduleId = moduleSelectTrigger.dataset.adminRegSelectModule || '';
            const tab = moduleSelectTrigger.dataset.adminRegModuleTab || adminRegActiveTab;
            if (tab === 'free') {
                selectFreeModule(moduleId);
                return;
            }
            if (tab === 'prog') {
                selectProgModule(moduleId);
                return;
            }
        }

        const concProgramTrigger = event.target.closest('[data-admin-reg-select-conc-program]');
        if (concProgramTrigger) {
            adminRegUiState.selectedConcProgram = concProgramTrigger.dataset.adminRegSelectConcProgram || '';
            adminRegUiState.selectedConcGroup = null;
            renderConcProgramPane();
            return;
        }

        const minorProgramTrigger = event.target.closest('[data-admin-reg-select-minor-program]');
        if (minorProgramTrigger) {
            adminRegUiState.selectedMinorProgram = minorProgramTrigger.dataset.adminRegSelectMinorProgram || '';
            renderMinorProgramPane();
        }
    });
}

// MAIN: Switch between registration tabs
function switchAdminRegTab(tabTarget) {
    const validTabs = ['prog', 'free', 'conc', 'minor'];
    if (!validTabs.includes(tabTarget)) return;
    
    adminRegActiveTab = tabTarget;
    expandedModules.clear();
    
    // Ensure prog tab has correct structure
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    if (tabTarget === 'prog') {
        ensureProgTabStructure(currentFaculty);
    }
    
    // Update tab styling
    document.querySelectorAll('.admin-reg-tab').forEach(tab => {
        tab.classList.remove('active', 'is-active');
        const tabRouteTarget = String(
            tab.dataset?.target
            || tab.dataset?.adminToolsRegTab
            || tab.getAttribute('data-target')
            || tab.getAttribute('data-admin-tools-reg-tab')
            || ''
        ).trim().toLowerCase();
        if (
            tabRouteTarget === tabTarget
            || (tab.getAttribute('onclick') && tab.getAttribute('onclick').includes(`'${tabTarget}'`))
        ) {
            tab.classList.add('active', 'is-active');
        }
    });
    
    // Render content for this tab
    renderAdminRegistrationModules(tabTarget);
}

// RENDER: Display modules and courses for active tab - FACULTY SCOPED with TAB-SPECIFIC LAYOUTS
function renderAdminRegistrationModules(tabType) {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;

    ensureRegistrationCmsFacultyIsolation();

    const safeTab = ['prog', 'free', 'conc', 'minor'].includes(tabType) ? tabType : 'prog';

    // Preserve currently selected concentration/minor choice before re-render.
    if (safeTab === 'prog') {
        const selectedProg = document.querySelector('input[name="prog-module"]:checked');
        if (selectedProg) adminRegUiState.selectedProgModule = selectedProg.value;
    } else if (safeTab === 'free') {
        const selectedFree = document.querySelector('input[name="free-module"]:checked');
        if (selectedFree) adminRegUiState.selectedFreeModule = selectedFree.value;
    } else if (safeTab === 'conc') {
        const selectedConcProgram = document.querySelector('input[name="conc-program"]:checked');
        if (selectedConcProgram) adminRegUiState.selectedConcProgram = selectedConcProgram.value;
        const selectedConc = document.querySelector('input[name="conc-group"]:checked');
        if (selectedConc) adminRegUiState.selectedConcGroup = selectedConc.value;
    } else if (safeTab === 'minor') {
        const selectedMinor = document.querySelector('input[name="minor-program"]:checked');
        if (selectedMinor) adminRegUiState.selectedMinorProgram = selectedMinor.value;
    }
    
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    container.dataset.cmsFaculty = currentFaculty;

    ensureAdminRegistrationCmsDefaults(currentFaculty);
    bindFacultyRegistrationCmsData(currentFaculty);
    
    // ENSURE data is initialized for this faculty
    if (!KIU_STATE.adminProgramStructures) {
        KIU_STATE.adminProgramStructures = {};
    }
    if (!KIU_STATE.adminProgramStructures[currentFaculty]) {
        KIU_STATE.adminProgramStructures[currentFaculty] = getDefaultAdminRegistrationCmsStructures();
    }
    if (!KIU_STATE.adminProgramStructures[currentFaculty]) {
        // Initialize with basic structure if missing
        KIU_STATE.adminProgramStructures[currentFaculty] = {
            'prog': [{ id: 'M-CORE', letter: 'A', name: 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â«ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“', minEcts: 24, maxEcts: 30, subModules: [], required: true }],
            'free': [{ id: 'M-FREE', letter: 'B', name: 'ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“', minEcts: 0, maxEcts: 12, subModules: [], required: false }],
            'conc': [],
            'minor': []
        };
    }
    
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[safeTab] || [];

    const renderLegacyFallback = () => {
        container.innerHTML = `
            <div style="padding:24px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:12px;">
                Registration Structure CMS could not load. Please refresh once.
            </div>
        `;
    };
    
    // Different rendering for each tab
    try {
        if (safeTab === 'prog') {
            renderProgTab(container, modules, safeTab);
        } else if (safeTab === 'free') {
            renderFreeTab(container, modules, safeTab);
        } else if (safeTab === 'conc') {
            renderConcTab(container, modules, safeTab);
        } else if (safeTab === 'minor') {
            renderMinorTab(container, modules, safeTab);
        }

        // FINAL SAFETY: If after trying to render modern tabs we still have nothing, 
        // use the legacy table structure as a fallback.
        if (!hasVisibleAdminRegistrationCmsContent(container)) {
            console.log('[RegCMS] Modern render produced no content, using legacy fallback.');
            renderLegacyFallback();
        }
    } catch (err) {
        console.error('Registration CMS render failed, falling back to legacy layout:', err);
        renderLegacyFallback();
    }
}

// TAB 1: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â (My Program) - Nested with prerequisites
function renderProgTab(container, modules, tabType) {
    if (modules.length > 0) {
        if (!modules.some(mod => mod.id === adminRegUiState.selectedProgModule)) {
            adminRegUiState.selectedProgModule = modules[0].id;
        }
    } else {
        adminRegUiState.selectedProgModule = null;
    }

    const html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; margin-bottom:18px;">
            <div>
                <div style="font-size:16px; font-weight:700; color:var(--lux-text);">Program Modules</div>
                <div style="font-size:11px; color:var(--lux-text-muted); margin-top:3px;">Organize your program into modules and assign courses.</div>
            </div>
            <button type="button" data-admin-reg-add-module="prog" class="lux-primary-btn" style="padding:8px 16px; font-size:11px;"><i class="fas fa-plus"></i> Add Module</button>
        </div>
        <div style="display:grid; grid-template-columns:280px 1fr; gap:20px; align-items:start;">
            <div class="lux-surface">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                    <div style="font-size:12px; font-weight:700; color:var(--lux-text-muted);">Modules</div>
                    <span style="font-size:11px; color:var(--lux-text-muted);">${modules.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-prog-modules" style="display:flex; flex-direction:column; gap:10px; max-height:260px; overflow:auto; padding-right:4px;">
                    ${modules.length === 0 ? `
                        <div class="lux-empty-state" style="padding:24px 12px;">
                            <i class="fas fa-folder-plus"></i>
                            <strong>No modules yet</strong>
                            <span>Create your first program module to get started.</span>
                        </div>
                    ` : modules.map(module => {
                        const active = module.id === adminRegUiState.selectedProgModule;
                        const completed = getAssignedCourseEctsTotal(module.subModules || []);
                        const progress = formatEctsProgress(module.maxEcts || 0, completed);
                        return `
                            <label style="display:flex; flex-direction:column; gap:4px; padding:14px; background:${active ? 'rgba(var(--lux-accent-rgb),0.08)' : 'rgba(255,255,255,0.03)'}; border:1px solid ${active ? 'rgba(var(--lux-accent-rgb),0.25)' : 'rgba(255,255,255,0.06)'}; border-radius:12px; cursor:pointer;">
                                <span style="display:flex; align-items:center; gap:10px;">
                                    <input type="radio" name="prog-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} style="margin:0; accent-color:var(--lux-accent);" data-admin-reg-select-module="${escapeHtml(module.id)}" data-admin-reg-module-tab="prog">
                                    <span style="font-weight:700; color:var(--lux-text); font-size:12px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled'}`.trim())}</span>
                                </span>
                                <span style="font-size:10px; color:var(--lux-text-muted); padding-left:26px;">ECTS: ${escapeHtml(progress)}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="prog-module-pane"></div>
        </div>
    `;

    container.innerHTML = localizeHtmlMarkup(html);
    renderProgModulePane();
}

function renderProgModulePane() {
    const pane = document.getElementById('prog-module-pane');
    if (!pane) return;

    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const modules = KIU_STATE.adminProgramStructures?.[currentFaculty]?.prog || [];
    const module = modules.find(item => item.id === adminRegUiState.selectedProgModule) || modules[0] || null;

    if (!module) {
        pane.innerHTML = `
            <div class="lux-empty-state" style="min-height:300px;">
                <i class="fas fa-arrow-left"></i>
                <strong>Select a module</strong>
                <span>Choose a module from the list to manage its subjects.</span>
            </div>
        `;
        return;
    }

    adminRegUiState.selectedProgModule = module.id;
    const moduleId = jsQuote(module.id);
    const subModules = module.subModules || [];
    const progressLabel = formatEctsProgress(module.maxEcts || 0, getAssignedCourseEctsTotal(subModules));

    pane.innerHTML = `
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:16px;">
            <div style="min-width:0;">
                <div style="font-size:15px; font-weight:700; color:var(--lux-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(module.name || 'Program')}</div>
                <div style="font-size:11px; color:var(--lux-text-muted); margin-top:3px;">Module subjects</div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; align-items:center;">
                <button type="button" data-admin-reg-edit-module="${escapeHtml(module.id)}" class="lux-ghost-btn" style="padding:7px 12px; font-size:11px;"><i class="fas fa-edit"></i> Edit</button>
                <button type="button" data-admin-reg-delete-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn" style="padding:7px 12px; font-size:11px; color:#ef4444;"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-subject="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-primary-btn" style="padding:7px 14px; font-size:11px;"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
            ${(subModules.length === 0 ? `
                <div class="lux-empty-state">
                    <i class="fas fa-book-open"></i>
                    <strong>No subjects assigned</strong>
                    <span>Add subjects to this module using the button above.</span>
                </div>
            ` : subModules.map((subMod, idx) => {
                const details = getAssignedCourseCurriculumDetails(subMod, currentFaculty);
                return `
                <div style="display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:16px; box-shadow:0 10px 24px rgba(0,0,0,0.12);">
                    <div style="width:84px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(subMod.number || idx + 1)}</div>
                    <div style="flex:3; min-width:0;">
                        <div style="font-weight:700; color:var(--lux-text);">${escapeHtml(subMod.name || 'Untitled Subject')}</div>
                        <div style="font-size:10px; color:var(--lux-text-soft); margin-top:2px;">${escapeHtml((subMod.courses || []).join(', ') || '')}</div>
                    </div>
                    <div style="width:110px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(subMod.ects || '0')}</div>
                    <div style="flex:2; font-size:11px; color:var(--lux-text-muted);">
                        <div>${escapeHtml(`Prerequisite: ${details.prerequisite}`)}</div>
                        ${details.antiRequisite ? `<div style="margin-top:4px;">${escapeHtml(`Anti-requisite: ${details.antiRequisite}`)}</div>` : ''}
                        ${details.curriculumSemester ? `<div style="margin-top:4px; color:var(--lux-green); font-weight:700;">${escapeHtml(details.curriculumSemester)}</div>` : ''}
                        ${details.studentAccess ? `<div style="margin-top:4px; color:var(--lux-accent-2); font-weight:700;">${escapeHtml(`Student access: ${details.studentAccess}`)}</div>` : ''}
                    </div>
                    <div style="width:120px; display:flex; justify-content:flex-end; gap:8px;">
                        <button type="button" data-admin-reg-edit-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px;"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `; }).join(''))}
        </div>
    `;
}

function selectProgModule(moduleId) {
    adminRegUiState.selectedProgModule = moduleId;
    rerenderAdminRegistrationModulesPreservingScroll('prog');
}

function editProgSubModule(moduleId, subModuleId) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const module = KIU_STATE.adminProgramStructures?.[currentFaculty]?.prog?.find(item => item.id === moduleId);
    const subModule = module?.subModules?.find(item => item.id === subModuleId);
    if (!module || !subModule) return;
    const curriculumSummary = getAssignedCourseCurriculumSummary(subModule, currentFaculty);

    openStructuredFormModal({
        title: 'Edit Program Subject',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'number', label: 'Subject Number', value: subModule.number || '', placeholder: 'e.g. 221' },
            { name: 'name', label: 'Subject Name', value: subModule.name || '', placeholder: 'Enter subject name' },
            { name: 'ects', label: 'ECTS', type: 'number', min: 0, step: 1, value: getCourseEctsValue(subModule) || 0 },
            ...getCourseSeatLimitFieldConfig(subModule),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: curriculumSummary, readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(subModule)
        ],
        onSave: (values, close) => {
            const number = String(values.number || '').trim();
            const name = String(values.name || '').trim();
            const ects = String(toPositiveInt(values.ects, getCourseEctsValue(subModule) || 0));
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);

            if (!number || !name) {
                alert('Please enter a course number and name.');
                return;
            }

            subModule.number = number;
            subModule.name = name;
            subModule.ects = ects;
            subModule.semesterRuleMode = restriction.semesterRuleMode;
            subModule.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(subModule, values);
            saveState();
            close();
            renderAdminRegistrationModules('prog');
        }
    });
}

// TAB 2: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ (Free Credits) - Same layout as Prog Tab

function addConcGroup() {
    openStructuredFormModal({
        title: 'New Concentration Group',
        subtitle: 'Create a new concentration code and its first group.',
        submitLabel: 'Create Group',
        fields: [
            { name: 'concKey', label: 'Concentration Code', placeholder: 'e.g. conc1', value: '' },
            { name: 'groupName', label: 'Group Name', placeholder: 'e.g. Brand Management', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 30 }
        ],
        onSave: (values, close) => {
            const concKey = String(values.concKey || '').trim();
            const groupName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 30);

            if (!concKey || !groupName) {
                alert('Please fill in the concentration code and group name.');
                return;
            }

            const normalizedKey = concKey.toLowerCase();
            if (!concCourseData[normalizedKey]) concCourseData[normalizedKey] = {};
            if (concCourseData[normalizedKey][groupName]) {
                alert('That concentration group already exists in this code.');
                return;
            }
            concCourseData[normalizedKey][groupName] = { maxEcts, completedEcts: 0, courses: [] };
            saveState();
            close();
            alert(`Concentration group "${groupName}" added successfully.`);
            renderAdminRegistrationModules('conc');
        }
    });
}

function deleteConcGroup(concKey, groupName) {
    if (!confirm(`Delete concentration group "${groupName}"?`)) return;
    
    delete concCourseData[concKey][groupName];
    saveState();
    alert('Concentration group deleted successfully.');
    renderAdminRegistrationModules('conc');
}

function editConcGroup(concKey, groupName) {
    const group = concCourseData?.[concKey]?.[groupName];
    if (!group) return;

    openStructuredFormModal({
        title: 'Edit Concentration Group',
        subtitle: 'Update the group name and its credit target.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'groupName', label: 'Group Name', value: groupName, placeholder: 'Enter group name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: group.maxEcts || parseEctsProgress(group.ects || '30/0').max || 30 }
        ],
        onSave: (values, close) => {
            const newName = String(values.groupName || '').trim();
            const newMax = toPositiveInt(values.maxEcts, group.maxEcts || parseEctsProgress(group.ects || '30/0').max || 30);
            if (!newName) {
                alert('Please enter a group name.');
                return;
            }

            if (!concCourseData[concKey]) concCourseData[concKey] = {};
            if (newName !== groupName && concCourseData[concKey][newName]) {
                alert('Another concentration group already uses that name.');
                return;
            }
            const previous = concCourseData[concKey][groupName];
            delete concCourseData[concKey][groupName];
            concCourseData[concKey][newName] = {
                ...previous,
                maxEcts: newMax,
                completedEcts: Number(previous?.completedEcts || 0),
                courses: previous?.courses || []
            };
            saveState();
            close();
            renderAdminRegistrationModules('conc');
        }
    });
}


function openProgramSubjectSelectionModal(programType, context) {
    // Wrapper to ensure concentration/minor uses the exact same modal engine
    // as "My Program" and "Free Credits".
    openCourseSelectionModal(null, null, { programType, context });
}

function addSubjectToConcGroup(concKey, groupName) {
    window.currentSubjectContext = { programName: concKey, groupName, programType: 'concentration' };
    openCourseSelectionModal(null, null, { programType: 'concentration', context: { programName: concKey, groupName } });
}

function removeConcCourse(concKey, groupName, courseIdx) {
    const courseName = concCourseData[concKey][groupName].courses[courseIdx].title;
    if (!confirm(`Delete course "${courseName}"?`)) return;
    
    concCourseData[concKey][groupName].courses.splice(courseIdx, 1);
    saveState();
    alert('Subject deleted successfully.');
    renderAdminRegistrationModules('conc');
}

function editConcCourseName(concKey, groupName, courseIdx) {
    const course = concCourseData[concKey][groupName].courses[courseIdx];
    const currentTitle = course.title;
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    openStructuredFormModal({
        title: 'Edit Concentration Course',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'title', label: 'Course Title', value: currentTitle, placeholder: 'Enter course title' },
            ...getCourseSeatLimitFieldConfig(course),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: getAssignedCourseCurriculumSummary(course, currentFaculty), readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(course)
        ],
        onSave: (values, close) => {
            const newTitle = String(values.title || '').trim();
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);
            if (!newTitle) {
                alert('Please enter a course title.');
                return;
            }

            course.title = newTitle;
            course.semesterRuleMode = restriction.semesterRuleMode;
            course.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(course, values);
            saveState();
            close();
            alert('Subject updated successfully.');
            renderAdminRegistrationModules('conc');
        }
    });
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function ensureRegistrationCmsFacultyIsolation() {
    if (KIU_STATE.adminProgramStructures && typeof KIU_STATE.adminProgramStructures === 'object') {
        Object.keys(KIU_STATE.adminProgramStructures).forEach((facKey) => {
            KIU_STATE.adminProgramStructures[facKey] = cloneJson(KIU_STATE.adminProgramStructures[facKey] || {});
        });
    }

    if (KIU_STATE.registrationCMSByFaculty && typeof KIU_STATE.registrationCMSByFaculty === 'object') {
        Object.keys(KIU_STATE.registrationCMSByFaculty).forEach((facKey) => {
            KIU_STATE.registrationCMSByFaculty[facKey] = cloneJson(KIU_STATE.registrationCMSByFaculty[facKey] || {});
        });
    }
}

// Concentration Course Data - With hierarchical structure (Concentration -> Course Groups -> Courses)
const DEFAULT_CONC_COURSE_DATA = {};

// Minor Programs Data - With hierarchical structure (Course Groups -> Individual Courses)
const DEFAULT_MINOR_PROGRAM_DATA = {};

function isLegacySampleConcData(data) {
    const keys = Object.keys(data || {});
    return keys.length > 0 && keys.every(key => /^conc\d+$/i.test(String(key)));
}

function isLegacySampleMinorData(data) {
    const keys = Object.keys(data || {});
    return keys.length > 0 && keys.every(key => /^Minor\d+_/i.test(String(key)));
}

function ensureFacultyRegistrationCmsData(faculty) {
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'ECON', 'ECON');
    if (!KIU_STATE.registrationCMSByFaculty) KIU_STATE.registrationCMSByFaculty = {};
    let changed = false;

    if (!KIU_STATE.registrationCMSByFaculty[fac]) {
        const legacy = KIU_STATE.registrationCMS || {};
        const canMigrateLegacy =
            Object.keys(KIU_STATE.registrationCMSByFaculty).length === 0
            && legacy
            && (legacy.concCourseData || legacy.minorProgramData);
        KIU_STATE.registrationCMSByFaculty[fac] = {
            concCourseData: cloneJson(canMigrateLegacy ? (legacy.concCourseData || DEFAULT_CONC_COURSE_DATA) : DEFAULT_CONC_COURSE_DATA),
            minorProgramData: cloneJson(canMigrateLegacy ? (legacy.minorProgramData || DEFAULT_MINOR_PROGRAM_DATA) : DEFAULT_MINOR_PROGRAM_DATA)
        };
        changed = true;
    }

    const bucket = KIU_STATE.registrationCMSByFaculty[fac];
    if (!bucket.concCourseData || typeof bucket.concCourseData !== 'object') {
        bucket.concCourseData = cloneJson(DEFAULT_CONC_COURSE_DATA);
        changed = true;
    }
    if (!bucket.minorProgramData || typeof bucket.minorProgramData !== 'object') {
        bucket.minorProgramData = cloneJson(DEFAULT_MINOR_PROGRAM_DATA);
        changed = true;
    }
    if (isLegacySampleConcData(bucket.concCourseData)) {
        bucket.concCourseData = {};
        changed = true;
    }
    if (isLegacySampleMinorData(bucket.minorProgramData)) {
        bucket.minorProgramData = {};
        changed = true;
    }
    if (changed) saveState();
    return bucket;
}

function bindFacultyRegistrationCmsData(faculty) {
    ensureRegistrationCmsFacultyIsolation();
    const fac = normalizeFacultyCode(
        faculty || (document.getElementById('admin-reg-content-container') ? getAdminRegistrationFaculty() : getCurrentFaculty()) || 'ECON',
        'ECON'
    );
    const bucket = ensureFacultyRegistrationCmsData(fac);
    concCourseData = bucket.concCourseData;
    minorProgramData = bucket.minorProgramData;
    // Backward-compatible mirror key used by older code paths.
    KIU_STATE.registrationCMS = { concCourseData, minorProgramData, faculty: fac };
    return bucket;
}

let concCourseData = {};
let minorProgramData = {};
if (KIU_STATE.adminProgramStructures) {
    KIU_STATE.adminProgramStructures = cloneJson(KIU_STATE.adminProgramStructures);
}
if (KIU_STATE.registrationCMSByFaculty) {
    KIU_STATE.registrationCMSByFaculty = cloneJson(KIU_STATE.registrationCMSByFaculty);
}
bindFacultyRegistrationCmsData(getAdminRegistrationFaculty());

// TAB 4: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ (Minor) - With dropdown and manage buttons
function renderMinorTab(container, modules, tabType) {
    const minorPrograms = Object.keys(minorProgramData);
    if (minorPrograms.length > 0) {
        if (!minorPrograms.includes(adminRegUiState.selectedMinorProgram)) {
            adminRegUiState.selectedMinorProgram = minorPrograms[0];
        }
    } else {
        adminRegUiState.selectedMinorProgram = null;
    }

    let html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; margin-bottom:18px;">
            <div>
                <div style="font-size:18px; font-weight:800; color:var(--lux-text);">Minor</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">Build minor programs with the same nested cards, editable ECTS targets, and grouped course lists.</div>
            </div>
            <button type="button" data-admin-reg-add-minor-program="1" class="kiu-btn-blue" style="padding:10px 16px; font-size:12px;"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div style="display:grid; grid-template-columns:320px 1fr; gap:18px; align-items:start;">
            <div style="background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:18px; padding:16px; box-shadow:var(--lux-shadow);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:13px; font-weight:800; color:var(--lux-text-muted);">Minor Programs</div>
                    <span style="font-size:11px; color:var(--lux-text-muted);">${minorPrograms.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-minor-programs" style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow:auto; padding-right:4px;">
                    ${minorPrograms.length === 0 ? `<div style="padding:20px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border-radius:14px;">No minor programs yet</div>` : minorPrograms.map(program => {
                        const checkedAttr = program === adminRegUiState.selectedMinorProgram ? 'checked' : '';
                        return `
                            <label style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; background:${program === adminRegUiState.selectedMinorProgram ? 'linear-gradient(135deg, rgba(11,132,255,0.08), rgba(11,132,255,0.02))' : '#f8fafc'}; border:1px solid ${program === adminRegUiState.selectedMinorProgram ? 'rgba(11,132,255,0.2)' : '#e2e8f0'}; border-radius:14px; cursor:pointer;">
                                <span style="display:flex; align-items:center; gap:10px; min-width:0;">
                                    <input type="radio" name="minor-program" value="${program}" ${checkedAttr} data-admin-reg-select-minor-program="${escapeHtml(program)}" style="margin:0;">
                                    <span style="font-weight:700; color:var(--lux-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${program}</span>
                                </span>
                                <button type="button" data-admin-reg-delete-minor-program="${escapeHtml(program)}" class="kiu-btn-outline" style="padding:6px 10px; font-size:11px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="minor-program-pane">
                <!-- Program cards render here -->
            </div>
        </div>
    `;
    container.innerHTML = localizeHtmlMarkup(html);
    renderMinorProgramPane();
}

function renderMinorProgramPane() {
    const pane = document.getElementById('minor-program-pane');
    const selected = adminRegUiState.selectedMinorProgram;
    if (!pane) return;
    if (!selected || !minorProgramData[selected]) {
        pane.innerHTML = `<div style="padding:30px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px dashed var(--lux-border); border-radius:18px;">Select a minor program to manage its subject groups.</div>`;
        return;
    }

    const program = minorProgramData[selected];
    const courseGroups = program.courseGroups || {};
    const groupNames = Object.keys(courseGroups);
    let html = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
            <div>
                <div style="font-size:14px; font-weight:800; color:var(--lux-text);">${selected}</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:3px;">Minor Program Subjects</div>
            </div>
            <button id="minor-add-course-btn" type="button" data-admin-reg-add-minor-group="${escapeHtml(selected)}" class="kiu-btn-blue" style="padding:8px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Group</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:14px;">
    `;

    if (groupNames.length === 0) {
        html += `<div style="padding:24px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px dashed var(--lux-border); border-radius:18px;">No subject groups added yet.</div>`;
    } else {
        groupNames.forEach((groupName, groupIdx) => {
            const group = courseGroups[groupName] || {};
            const groupKey = `minor:${selected}|${groupName}`;
            const isExpanded = expandedModules.has(groupKey);
            const progress = getTrackGroupProgress(group);
            const courses = group.courses || [];
            html += `
                <div style="border:1px solid var(--lux-border); border-radius:18px; overflow:hidden; background:var(--lux-surface); box-shadow:var(--lux-shadow);">
                    <div style="display:flex; align-items:center; gap:10px; padding:16px 18px; background:linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%); cursor:pointer;" data-admin-reg-toggle-minor-group="${escapeHtml(groupKey)}">
                        <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}" style="color:var(--lux-accent-2); width:18px;"></i>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:800; color:var(--lux-text); font-size:14px;">${groupName}</div>
                            <div style="font-size:11px; color:var(--lux-text-muted); margin-top:3px;">${selected}</div>
                        </div>
                        <div style="background:linear-gradient(135deg, #edf4ff, #dfeafe); color:#c2410c; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:800;">ECTS: ${progress.label}</div>
                        <div style="display:flex; gap:8px;">
                            <button type="button" data-admin-reg-edit-minor-group="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="kiu-btn-outline" style="padding:6px 10px; font-size:11px;"><i class="fas fa-edit"></i></button>
                            <button type="button" data-admin-reg-delete-minor-group="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="kiu-btn-outline" style="padding:6px 10px; font-size:11px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div style="padding:0 18px 18px;">
                            <div style="display:flex; gap:8px; margin-top:12px; color:var(--lux-text-muted); font-size:11px; font-weight:800; text-transform:uppercase;">
                                <div style="width:52px; text-align:center;">#</div>
                                <div style="flex:3;">Subject Title / Module Title</div>
                                <div style="width:110px; text-align:center;">ECTS</div>
                                <div style="flex:2;">Precondition / Anti-condition</div>
                                <div style="width:80px;"></div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                                ${(courses.length === 0 ? `
                                    <div style="padding:16px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border-radius:14px;">No subjects assigned</div>
                                ` : courses.map((course, idx) => `
                                    <div style="display:flex; align-items:center; gap:8px; padding:12px 12px; background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:14px;">
                                        <div style="width:52px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${course.n || idx + 1}</div>
                                        <div style="flex:3; min-width:0;">
                                            <div style="font-weight:700; color:var(--lux-text);">${course.title}</div>
                                            <div style="font-size:10px; color:var(--lux-text-soft); margin-top:2px;">${course.n || ''}</div>
                                        </div>
                                        <div style="width:110px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${course.ects || '0'}</div>
                                        <div style="flex:2; font-size:11px; color:var(--lux-text-muted);">
                                            <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div style="margin-top:4px;">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div style="margin-top:4px; color:var(--lux-green); font-weight:700;">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div style="margin-top:4px; color:var(--lux-accent-2); font-weight:700;">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                                        </div>
                                        <div style="width:80px; text-align:right;">
                                            <button type="button" data-admin-reg-edit-minor-course="${idx}" data-admin-reg-minor-program="${escapeHtml(selected)}" data-admin-reg-minor-group="${escapeHtml(groupName)}" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px;"><i class="fas fa-edit"></i></button>
                                        </div>
                                    </div>
                                `).join(''))}
                            </div>
                            <div style="margin-top:12px;">
                                <button type="button" data-admin-reg-add-minor-subject="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="kiu-btn-blue" style="width:100%; padding:10px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Subject</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += `</div>`;
    pane.innerHTML = localizeHtmlMarkup(html);

}

function addMinorProgram() {
    openStructuredFormModal({
        title: 'New Minor Program',
        subtitle: 'Create a new minor program container.',
        submitLabel: 'Create Program',
        fields: [
            { name: 'programName', label: 'Program Name', placeholder: 'e.g. Minor1_Data Science', value: '' }
        ],
        onSave: (values, close) => {
            const newName = String(values.programName || '').trim();
            if (!newName) {
                alert('Please enter a program name.');
                return;
            }
            if (minorProgramData[newName]) {
                alert('This minor program already exists!');
                return;
            }

            minorProgramData[newName] = { courseGroups: {} };
            saveState();
            close();
            alert(`"${newName}" added successfully.`);
            renderAdminRegistrationModules('minor');
        }
    });
}

function deleteMinorProgram(programName) {
    if (!confirm(`Delete "${programName}"?`)) return;
    
    delete minorProgramData[programName];
    saveState();
    alert(`"${programName}" deleted successfully.`);
    renderAdminRegistrationModules('minor');
}

function updateMinorTable() {
    const selected = document.querySelector('input[name="minor-program"]:checked');
    if (selected && minorProgramData[selected.value]) {
        adminRegUiState.selectedMinorProgram = selected.value;
        renderMinorProgramPane();
    }
}

function addCourseGroupToMinor(programName) {
    openStructuredFormModal({
        title: 'New Minor Course Group',
        subtitle: 'Add a course group inside the selected minor program.',
        submitLabel: 'Create Group',
        fields: [
            { name: 'groupName', label: 'Group Name', placeholder: 'e.g. A (101) Foundation', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 12 }
        ],
        onSave: (values, close) => {
            const groupName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 12);
            if (!groupName) {
                alert('Please enter a course group name.');
                return;
            }

            if (!minorProgramData[programName].courseGroups) {
                minorProgramData[programName].courseGroups = {};
            }
            if (minorProgramData[programName].courseGroups[groupName]) {
                alert('That course group already exists in this minor program.');
                return;
            }

            minorProgramData[programName].courseGroups[groupName] = {
                maxEcts,
                completedEcts: 0,
                ects: `${maxEcts}/0`,
                courses: []
            };
            saveState();
            close();
            alert(`Subject group "${groupName}" added successfully.`);
            renderAdminRegistrationModules('minor');
        }
    });
}

function deleteMinorCourseGroup(programName, groupName) {
    if (!confirm(`Delete course group "${groupName}"?`)) return;
    
    delete minorProgramData[programName].courseGroups[groupName];
    saveState();
    alert('Subject group deleted successfully.');
    renderAdminRegistrationModules('minor');
}

function editMinorCourseGroup(programName, groupName) {
    const group = minorProgramData?.[programName]?.courseGroups?.[groupName];
    if (!group) return;

    openStructuredFormModal({
        title: 'Edit Minor Group',
        subtitle: 'Update the group title and ECTS target.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'groupName', label: 'Group Name', value: groupName, placeholder: 'Enter group name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: group.maxEcts || parseEctsProgress(group.ects || '12/0').max || 12 }
        ],
        onSave: (values, close) => {
            const newName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, group.maxEcts || parseEctsProgress(group.ects || '12/0').max || 12);
            if (!newName) {
                alert('Please enter a course group name.');
                return;
            }

            if (newName !== groupName && minorProgramData[programName].courseGroups[newName]) {
                alert('Another minor group already uses that name.');
                return;
            }
            const previous = minorProgramData[programName].courseGroups[groupName];
            delete minorProgramData[programName].courseGroups[groupName];
            minorProgramData[programName].courseGroups[newName] = {
                ...previous,
                maxEcts,
                completedEcts: Number(previous?.completedEcts || 0),
                ects: `${maxEcts}/${Number(previous?.completedEcts || 0)}`
            };
            saveState();
            close();
            renderAdminRegistrationModules('minor');
        }
    });
}

function addSubjectToGroup(programName, groupName) {
    const programType = adminRegActiveTab === 'conc' ? 'concentration' : 'minor';
    window.currentSubjectContext = { programName, groupName, programType };
    openCourseSelectionModal(null, null, { programType, context: { programName, groupName } });
}

function getSelectableCurriculumCoursesForPrograms() {
    const facultyProfiles = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {};
    return Object.keys(facultyProfiles).flatMap(facultyCode => {
        const curriculum = Array.isArray(getActiveCurriculum(facultyCode)) ? getActiveCurriculum(facultyCode) : [];
        return curriculum.map(course => ({
            code: course?.id || course?.code || '',
            title: course?.name || course?.title || '',
            ects: Number(course?.ects || 0),
            faculty: course?.faculty || facultyCode,
            precondition: course?.cond || course?.precondition || ''
        })).filter(course => course.code && course.title);
    });
}

function loadAvailableSubjects() {
    // Legacy concentration/minor picker removed.
    // The live admin-tools route uses openCourseSelectionModal(...).
}

function editMinorCourse(programName, groupName, courseIdx) {
    const course = minorProgramData[programName].courseGroups[groupName].courses[courseIdx];
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    openStructuredFormModal({
        title: 'Edit Minor Course',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'title', label: 'Course Title', value: course.title, placeholder: 'Enter course title' },
            ...getCourseSeatLimitFieldConfig(course),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: getAssignedCourseCurriculumSummary(course, currentFaculty), readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(course)
        ],
        onSave: (values, close) => {
            const newTitle = String(values.title || '').trim();
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);
            if (!newTitle) {
                alert('Please enter a course title.');
                return;
            }

            course.title = newTitle;
            course.semesterRuleMode = restriction.semesterRuleMode;
            course.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(course, values);
            saveState();
            close();
            alert('Subject updated successfully.');
            renderAdminRegistrationModules('minor');
        }
    });
}

// TOGGLE: Expand/collapse module to show courses
function toggleAdminRegModule(moduleId) {
    if (expandedModules.has(moduleId)) {
        expandedModules.delete(moduleId);
    } else {
        expandedModules.add(moduleId);
    }
    renderAdminRegistrationModules(adminRegActiveTab);
}

// EDIT: Open modal to edit module properties
function editAdminRegModule(moduleId) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[adminRegActiveTab] || [];
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    openStructuredFormModal({
        title: 'Edit Module',
        subtitle: 'Change the module name and maximum credit limit.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'moduleName', label: 'Module Name', value: module.name, placeholder: 'Enter module name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: module.maxEcts }
        ],
        onSave: (values, close) => {
            const newName = String(values.moduleName || '').trim();
            const newMaxEcts = toPositiveInt(values.maxEcts, module.maxEcts || 0);
            if (!newName) {
                alert('Please enter a module name.');
                return;
            }

            module.name = newName;
            module.maxEcts = newMaxEcts;
            module.minEcts = Number.isFinite(Number(module.minEcts)) ? module.minEcts : 0;

            saveState();
            close();
            renderAdminRegistrationModules(adminRegActiveTab);
            alert('Module updated.');
        }
    });
}

// DELETE: Remove a module from the structure
function deleteAdminRegModule(moduleId, tabType) {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const idx = modules.findIndex(m => m.id === moduleId);
    if (idx !== -1) {
        modules.splice(idx, 1);
        saveState();
        renderAdminRegistrationModules(tabType);
        alert('Module removed.');
    }
}

// ADD NEW: Create a new module/block
function addNewAdminRegModule(tabType) {
    openStructuredFormModal({
        title: 'Create New Module',
        subtitle: 'Use this form to add a polished module card without the old browser popup.',
        submitLabel: 'Create Module',
        fields: [
            { name: 'moduleName', label: 'Module Name', placeholder: 'e.g. Additional Topics', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 15 }
        ],
        onSave: (values, close) => {
            const moduleName = String(values.moduleName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 15);
            if (!moduleName) {
                alert('Please enter a module name.');
                return;
            }

            const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
            if (!KIU_STATE.adminProgramStructures[currentFaculty]) {
                KIU_STATE.adminProgramStructures[currentFaculty] = {};
            }
            if (!KIU_STATE.adminProgramStructures[currentFaculty][tabType]) {
                KIU_STATE.adminProgramStructures[currentFaculty][tabType] = [];
            }

            const newModule = {
                id: `M-${Date.now()}`,
                name: moduleName,
                minEcts: 0,
                maxEcts: maxEcts,
                letter: String.fromCharCode(65 + (KIU_STATE.adminProgramStructures[currentFaculty][tabType].length % 26)),
                subModules: [],
                required: false
            };

            KIU_STATE.adminProgramStructures[currentFaculty][tabType].push(newModule);
            saveState();
            close();
            renderAdminRegistrationModules(tabType);
            alert('New module created.');
        }
    });
}

function getAdminRegistrationAssignmentTargetLabel(module, programType, programContext) {
    if (programType) {
        return programContext?.groupName || programContext?.programName || 'selected group';
    }
    return module?.name || 'selected module';
}

function getAdminRegistrationFacultyOptions() {
    const profiles = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {};
    return Object.keys(profiles).map(code => ({
        value: code,
        label: getFacultyLabel(code)
    }));
}

function doesAdminRegistrationSubjectExist(subjectId) {
    const toKey = (value) => {
        if (typeof canonicalCourseKey === 'function') return canonicalCourseKey(value);
        return String(value || '').trim().toUpperCase();
    };
    const targetKey = toKey(subjectId);
    const subjects = typeof getAllCurriculumSubjects === 'function'
        ? getAllCurriculumSubjects()
        : (KIU_STATE.curriculum || []);
    return subjects.some(subject => toKey(subject?.id) === targetKey);
}

function buildAdminRegistrationSubjectId(faculty, semester, rawCode = '') {
    const normalizedCode = String(rawCode || '').trim().toUpperCase().replace(/\s+/g, '-');
    if (normalizedCode) return normalizedCode;

    let sequence = Math.floor(Math.random() * 900) + 100;
    let candidate = `${faculty}-S${semester}-${sequence}`;
    while (doesAdminRegistrationSubjectExist(candidate)) {
        sequence = Math.floor(Math.random() * 900) + 100;
        candidate = `${faculty}-S${semester}-${sequence}`;
    }
    return candidate;
}

function ensureAdminRegistrationFacultyCurriculum(faculty) {
    if (!KIU_STATE.facultyProfiles || typeof KIU_STATE.facultyProfiles !== 'object') {
        KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE.facultyProfiles || {}));
    }

    const fallbackProfile = (KIU_EMPTY_STATE.facultyProfiles && KIU_EMPTY_STATE.facultyProfiles[faculty]) || {};
    if (!KIU_STATE.facultyProfiles[faculty] || typeof KIU_STATE.facultyProfiles[faculty] !== 'object') {
        KIU_STATE.facultyProfiles[faculty] = {
            name: fallbackProfile.name || faculty,
            fullName: fallbackProfile.fullName || fallbackProfile.name || faculty,
            color: fallbackProfile.color || '',
            navColor: fallbackProfile.navColor || fallbackProfile.color || '',
            curriculum: [],
            professors: [],
            tas: [],
            students: []
        };
    }

    if (!Array.isArray(KIU_STATE.facultyProfiles[faculty].curriculum)) {
        KIU_STATE.facultyProfiles[faculty].curriculum = [];
    }
}

function openCreateAndAssignSubjectModal(options = {}) {
    const module = options.module || null;
    const tabType = options.tabType || 'prog';
    const programType = options.programType || null;
    const programContext = options.programContext || null;
    const reason = options.reason || 'manual-create';
    const defaultFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const targetLabel = getAdminRegistrationAssignmentTargetLabel(module, programType, programContext);

    openStructuredFormModal({
        title: 'Create and Assign Subject',
        subtitle: reason === 'empty-curriculum'
            ? `Curriculum Library is empty. Create a subject and assign it to ${targetLabel} in one step.`
            : `Create a new subject and assign it to ${targetLabel}.`,
        submitLabel: 'Create Subject',
        fields: [
            { name: 'faculty', label: 'Faculty', type: 'select', value: defaultFaculty, options: getAdminRegistrationFacultyOptions() },
            { name: 'subjectName', label: 'Subject Name', placeholder: 'e.g. Principles of Accounting', value: '' },
            { name: 'subjectCode', label: 'Subject Code', placeholder: 'Optional custom code, e.g. ECON-S1-101', value: '' },
            { name: 'ects', label: 'ECTS', type: 'number', min: 0, step: 1, value: 6 },
            { name: 'semester', label: 'Semester', type: 'number', min: 1, max: 12, step: 1, value: 1 },
            { name: 'precondition', label: 'Prerequisite', placeholder: 'Optional prerequisite text', value: '' },
            { name: 'antireq', label: 'Anti-requisite', placeholder: 'Optional anti-requisite text', value: '' }
        ],
        onSave: (values, close) => {
            const faculty = normalizeFacultyCode(values.faculty || defaultFaculty, defaultFaculty);
            const subjectName = String(values.subjectName || '').trim();
            const rawSubjectCode = String(values.subjectCode || '').trim();
            const ects = toPositiveInt(values.ects, 6);
            const semester = Math.max(1, toPositiveInt(values.semester, 1));
            const prerequisite = String(values.precondition || '').trim();
            const antiRequisite = String(values.antireq || '').trim();

            if (!subjectName) {
                alert('Please enter a subject name.');
                return;
            }

            ensureAdminRegistrationFacultyCurriculum(faculty);
            const subjectId = buildAdminRegistrationSubjectId(faculty, semester, rawSubjectCode);
            if (rawSubjectCode && doesAdminRegistrationSubjectExist(subjectId)) {
                alert(`Subject code "${subjectId}" already exists. Please use a different code.`);
                return;
            }

            const newSubject = {
                id: subjectId,
                name: subjectName,
                ects: String(ects),
                faculty,
                semester,
                icon: 'fas fa-book',
                code: subjectId.toLowerCase(),
                cond: prerequisite || 'None',
                antireq: antiRequisite || 'None',
                parityMode: 'auto'
            };

            KIU_STATE.facultyProfiles[faculty].curriculum.push(newSubject);
            if (typeof syncCanonicalCurriculumState === 'function') {
                syncCanonicalCurriculumState();
            }

            if (typeof attachSubjectToCurriculumLibraryModule === 'function') {
                attachSubjectToCurriculumLibraryModule(subjectId, faculty);
            }
            if (typeof saveState === 'function') saveState();
            if (typeof renderCurriculumTable === 'function') renderCurriculumTable();
            if (typeof populateAntiReqDropdown === 'function') populateAntiReqDropdown();

            close();

            if (programType) {
                addCourseToProgramGroup(programType, programContext, subjectId);
            } else {
                addCourseToModule(module?.id || options.moduleId, subjectId, tabType);
            }
        }
    });
}

// SUBJECT SELECTION MODAL: Show available Curriculum Library subjects to assign
function openCourseSelectionModal(moduleId, tabType, options = {}) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const programType = options.programType || null;
    const programContext = options.context || null;

    let module = null;
    let assignedCourses = new Set();
    let assignedSubjectKeys = new Set();

    if (programType) {
        if (programType === 'concentration') {
            const existing = concCourseData?.[programContext?.programName]?.[programContext?.groupName]?.courses || [];
            assignedCourses = new Set(existing.map(c => c.sourceCourseId || c.n).filter(Boolean));
            assignedSubjectKeys = new Set(existing.map(c => normalizeSubjectTitleKey(c.title || c.name || c.n)).filter(Boolean));
        } else {
            const existing = minorProgramData?.[programContext?.programName]?.courseGroups?.[programContext?.groupName]?.courses || [];
            assignedCourses = new Set(existing.map(c => c.sourceCourseId || c.n).filter(Boolean));
            assignedSubjectKeys = new Set(existing.map(c => normalizeSubjectTitleKey(c.title || c.name || c.n)).filter(Boolean));
        }
    } else {
        const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
        const modules = facultyStructures[tabType] || [];
        module = modules.find(m => m.id === moduleId);
        if (!module) return;
        assignedCourses = new Set((module.subModules || []).flatMap(sm => [sm.sourceCourseId, ...(sm.courses || [])]).filter(Boolean));
        assignedSubjectKeys = new Set((module.subModules || []).map(sm => normalizeSubjectTitleKey(sm.name || sm.title || (sm.courses || [])[0])).filter(Boolean));
    }
    
    // Get curriculum from ALL faculties (not just current)
    const fp = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const allFaculties = Object.keys(fp).filter(f => {
        const cfg = fp[f];
        return cfg && cfg.curriculum && cfg.curriculum.length > 0;
    });
    
    let allCourses = [];
    allFaculties.forEach(fac => {
        const curriculum = getActiveCurriculum(fac);
        allCourses = allCourses.concat(curriculum);
    });
    
    // Filter curriculum to show only unassigned courses
    const availableCourses = allCourses.filter(c => {
        const subjectKey = normalizeSubjectTitleKey(c.name || c.id);
        return !assignedCourses.has(c.id) && !assignedSubjectKeys.has(subjectKey);
    });
    
    if (availableCourses.length === 0) {
        openCreateAndAssignSubjectModal({
            moduleId,
            module,
            tabType,
            programType,
            programContext,
            reason: allCourses.length === 0 ? 'empty-curriculum' : 'manual-create'
        });
        return;
    }
    
    // Get faculties that have available courses
    const allFacultyList = ['CS', 'ECON', 'LAW', 'MED', 'ARTS'];
    const facultyLabels = {
        'CS': 'Computer Science',
        'ECON': 'Business Management',
        'LAW': 'Law',
        'MED': 'Medicine',
        'ARTS': 'Arts & Humanities',
        'OTHER': 'Other'
    };
    
    const modalTargetName = programType
        ? (programContext?.groupName || programContext?.programName || 'Course Group')
        : module.name;

    let html = `
        <div id="course-selection-modal-bg" style="position:fixed; inset:0; z-index:7000; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; backdrop-filter:blur(4px);">
            <div style="background:var(--lux-surface); border-radius:16px; width:90%; max-width:800px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 24px 60px rgba(0,0,0,0.25);">
                <div style="padding:20px 24px; border-bottom:1px solid var(--kiu-border); display:flex; justify-content:space-between; align-items:center; gap:12px;">
                    <div>
                        <div style="font-size:16px; font-weight:800; color:var(--lux-text);">Select Subject</div>
                        <div style="font-size:11px; color:var(--lux-text-muted); margin-top:2px;">Target: <strong>${escapeHtml(modalTargetName)}</strong></div>
                    </div>
                    <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                        <button id="modal-create-subject-btn" style="background:rgba(var(--lux-accent-rgb),0.12); border:1px solid rgba(var(--lux-accent-rgb),0.28); border-radius:8px; padding:8px 14px; font-size:12px; font-weight:700; color:var(--lux-accent-2); cursor:pointer;"><i class="fas fa-plus"></i> Create Subject</button>
                        <button id="modal-close-btn" style="background:none; border:1px solid var(--kiu-border); border-radius:8px; padding:8px 16px; font-size:12px; font-weight:700; color:var(--lux-text-muted); cursor:pointer;"><i class="fas fa-times"></i> Close</button>
                    </div>
                </div>
                
                <!-- Search and Filter Section -->
                <div style="padding:16px 24px; border-bottom:1px solid var(--kiu-border); background:var(--lux-surface-2);">
                    <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px; margin-bottom:12px;">
                        <div>
                            <label style="font-size:10px; font-weight:700; color:var(--lux-text-muted); text-transform:uppercase;">Search</label>
                            <input id="course-search-input" type="text" placeholder="Type a few words from the subject name or code..." autocomplete="off" style="width:100%; padding:10px 12px; border:1px solid var(--lux-border); border-radius:8px; font-size:13px; margin-top:6px; outline:none; box-sizing:border-box;">
                        </div>
                        <div>
                            <label style="font-size:10px; font-weight:700; color:var(--lux-text-muted); text-transform:uppercase;">Faculty</label>
                            <select id="course-faculty-filter" style="width:100%; padding:10px 12px; border:2px solid var(--kiu-blue); border-radius:8px; font-size:13px; margin-top:6px; background:var(--lux-surface); outline:none; box-sizing:border-box; font-weight:700; color:var(--lux-text);">
                                <option value="all">All Faculties</option>
                                ${allFacultyList.map(fac => `<option value="${fac}">${facultyLabels[fac] || fac}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="subject-quick-matches" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;"></div>
                    <div style="font-size:11px; color:var(--lux-text-muted);">
                        <strong id="course-count">${availableCourses.length}</strong> subjects available from Curriculum Library
                    </div>
                </div>
                
                <!-- Courses List -->
                <div style="padding:0; overflow-y:auto; flex:1;">
                    <div id="courses-list-container" style="display:flex; flex-direction:column; gap:0;">
    `;
    
    availableCourses.forEach(course => {
        const facultyCode = course.faculty || 'OTHER';
        const facultyColor = {
            'CS': '#5b21b6',
            'ECON': '#a4262c',
            'LAW': '#107c41',
            'MED': '#065f46',
            'ARTS': '#b45309'
        }[facultyCode] || '#666';
        
        // Get detailed info from Curriculum Library
        const prerequisites = course.cond || 'None';
        const antiRequisites = course.antireq || 'None';
        
        html += `
            <div class="course-item" data-faculty="${facultyCode}" data-name="${escapeHtml(course.name || '')}" data-search="${escapeHtml(normalizeSubjectTitleKey(`${course.name || ''} ${course.id || ''} ${facultyLabels[facultyCode] || facultyCode}`))}" 
                 style="padding:16px 24px; border-bottom:1px solid var(--lux-border); cursor:pointer; transition:all 0.2s; background:var(--lux-surface);" 
                 data-module-id="${moduleId}" data-course-id="${course.id}" data-tab-type="${tabType}">
                <div style="display:flex; align-items:flex-start; gap:12px;">
                    <div style="flex:1;">
                        <!-- Subject Name & Code -->
                        <div style="font-weight:700; color:var(--lux-text); font-size:13px; margin-bottom:6px;">${course.name}</div>
                        
                        <!-- Basic Info Row -->
                        <div style="font-size:11px; color:var(--lux-text-muted); margin-bottom:8px; display:flex; gap:12px; flex-wrap:wrap;">
                            <span style="background:${facultyColor}15; color:${facultyColor}; padding:2px 8px; border-radius:3px; font-weight:bold;">${course.id}</span>
                            <span style="color:var(--lux-accent-2); font-weight:bold;">${course.ects} ECTS</span>
                            <span style="color:#666;">Semester ${course.semester || 'ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â'}</span>
                        </div>
                        
                        <!-- Prerequisites -->
                        ${prerequisites !== 'None' ? `
                        <div style="font-size:10px; color:#059669; margin-bottom:4px; padding:4px 8px; background:#d1fae5; border-radius:3px; border-left:3px solid #10b981;">
                            <strong>Prerequisite:</strong> ${prerequisites}
                        </div>
                        ` : ''}
                        
                        <!-- Anti-requisites -->
                        ${antiRequisites !== 'None' ? `
                        <div style="font-size:10px; color:var(--lux-red); margin-bottom:4px; padding:4px 8px; background:#fee2e2; border-radius:3px; border-left:3px solid #ef4444;">
                            <strong>Anti-requisite:</strong> ${antiRequisites}
                        </div>
                        ` : ''}
                    </div>
                    <div style="background:var(--kiu-blue); color:white; padding:8px 12px; border-radius:6px; font-size:11px; font-weight:700; white-space:nowrap; cursor:pointer;">
                        + Add Subject
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                    </div>
                    <div id="no-results" style="display:none; padding:40px 24px; text-align:center; color:var(--lux-text-muted);">
                        <i class="fas fa-inbox" style="font-size:32px; opacity:0.3; margin-bottom:12px; display:block;"></i>
                        <div style="font-size:13px;">No matching subjects were found.</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);
    
    // Now set up event listeners
    const modal = document.getElementById('course-selection-modal-bg');
    const createSubjectBtn = document.getElementById('modal-create-subject-btn');
    const closeBtn = document.getElementById('modal-close-btn');
    const searchInput = document.getElementById('course-search-input');
    const facultyFilter = document.getElementById('course-faculty-filter');
    const courseItems = document.querySelectorAll('.course-item');
    const courseListContainer = document.getElementById('courses-list-container');
    const noResults = document.getElementById('no-results');
    const courseCount = document.getElementById('course-count');
    const quickMatches = document.getElementById('subject-quick-matches');
    
    const openSubjectCreator = (reason = 'manual-create') => {
        modal.remove();
        openCreateAndAssignSubjectModal({
            moduleId,
            module,
            tabType,
            programType,
            programContext,
            reason
        });
    };

    // Close modal
    createSubjectBtn?.addEventListener('click', () => openSubjectCreator('manual-create'));
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const updateQuickMatches = (visibleItems, searchKey) => {
        if (!quickMatches) return;
        if (!searchKey) {
            quickMatches.innerHTML = '';
            return;
        }

        const topMatches = visibleItems.slice(0, 6);
        quickMatches.innerHTML = topMatches.map(item => {
            const name = item.getAttribute('data-name') || item.getAttribute('data-course-id') || 'Subject';
            const code = item.getAttribute('data-course-id') || '';
            const faculty = facultyLabels[item.getAttribute('data-faculty')] || item.getAttribute('data-faculty') || '';
            return `<button type="button" class="subject-quick-match" data-search-fill="${escapeHtml(name)}" style="border:1px solid #d6e2f0; background:var(--lux-surface); color:var(--lux-text); border-radius:999px; padding:6px 10px; font-size:11px; font-weight:700; cursor:pointer;">${escapeHtml(name)}${code ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${escapeHtml(code)}` : ''}${faculty ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${escapeHtml(faculty)}` : ''}</button>`;
        }).join('');

        quickMatches.querySelectorAll('.subject-quick-match').forEach(btn => {
            btn.addEventListener('click', () => {
                searchInput.value = btn.getAttribute('data-search-fill') || '';
                applyFilter();
                searchInput.focus();
            });
        });
    };
    
    // Filter function
    const applyFilter = () => {
        const searchTerm = searchInput.value;
        const searchKey = normalizeSubjectTitleKey(searchTerm);
        const selectedFaculty = facultyFilter.value;
        let visibleCount = 0;
        const visibleItems = [];
        
        courseItems.forEach(item => {
            const itemFaculty = item.getAttribute('data-faculty');
            const itemSearch = item.getAttribute('data-search') || '';
            
            const matchesSearch = searchKey === '' || itemSearch.includes(searchKey);
            const matchesFaculty = selectedFaculty === 'all' || itemFaculty === selectedFaculty;
            
            if (matchesSearch && matchesFaculty) {
                item.style.display = 'block';
                visibleCount++;
                visibleItems.push(item);
            } else {
                item.style.display = 'none';
            }
        });
        
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        courseCount.textContent = visibleCount;
        updateQuickMatches(visibleItems, searchKey);
    };
    
    searchInput.addEventListener('input', applyFilter);
    facultyFilter.addEventListener('change', applyFilter);
    
    // Trigger initial universal filter
    applyFilter();
    
    // Add subject click handler
    courseItems.forEach(item => {
        item.addEventListener('click', () => {
            const cId = item.getAttribute('data-course-id');
            if (programType) {
                addCourseToProgramGroup(programType, programContext, cId);
            } else {
                const mId = item.getAttribute('data-module-id');
                const tType = item.getAttribute('data-tab-type');
                addCourseToModule(mId, cId, tType);
            }
            modal.remove();
        });
        
        // Hover effect
        item.addEventListener('mouseenter', () => {
            item.style.background = '#eff6ff';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.background = 'white';
        });
    });
    
    // Focus on search input
    setTimeout(() => searchInput.focus(), 100);
}

function findCourseAcrossFaculties(courseId) {
    return findCurriculumSubjectByIdOrTitle(courseId);
}

function addCourseToProgramGroup(programType, context, courseId) {
    const course = findCourseAcrossFaculties(courseId) || { id: courseId, name: courseId, ects: 6, cond: '', antireq: 'None', faculty: '' };

    if (programType === 'concentration') {
        if (!concCourseData?.[context.programName]?.[context.groupName]) return;
        concCourseData[context.programName][context.groupName].courses.push({
            n: course.id,
            title: course.name,
            ects: String(course.ects),
            ectsColor: '#ff9800',
            precondition: course.cond || '',
            antireq: course.antireq || 'None',
            sourceCourseId: course.id,
            sourceFaculty: course.faculty || '',
            semesterRuleMode: 'all',
            allowedSemesters: '',
            lectureCapacity: 40,
            seminarCapacity: 20
        });
        saveState();
        renderAdminRegistrationModules('conc');
    } else {
        if (!minorProgramData?.[context.programName]?.courseGroups?.[context.groupName]) return;
        minorProgramData[context.programName].courseGroups[context.groupName].courses.push({
            n: course.id,
            title: course.name,
            ects: String(course.ects),
            precondition: course.cond || '',
            antireq: course.antireq || 'None',
            sourceCourseId: course.id,
            sourceFaculty: course.faculty || '',
            semesterRuleMode: 'all',
            allowedSemesters: '',
            lectureCapacity: 40,
            seminarCapacity: 20
        });
        saveState();
        renderAdminRegistrationModules('minor');
    }

    alert('Subject added successfully.');
}

// ADD SUBJECT: to module as a sub-module
function addCourseToModule(moduleId, courseId, tabType) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const module = modules.find(m => m.id === moduleId);
    
    if (!module) return;
    if (!module.subModules) module.subModules = [];
    
    const course = findCourseAcrossFaculties(courseId);
    const nextNumber = String((module.subModules.length + 221)).trim();
    
    const newSubModule = {
        id: `SM-${Date.now()}`,
        number: nextNumber,
        name: course ? course.name : courseId,
        ects: course ? course.ects : '6',
        courses: [courseId],
        prerequisites: course?.cond || 'None',
        antireq: course?.antireq || 'None',
        sourceCourseId: course?.id || courseId,
        sourceFaculty: course?.faculty || '',
        semesterRuleMode: 'all',
        allowedSemesters: '',
        lectureCapacity: 40,
        seminarCapacity: 20,
        approved: false,
        status: 'pending'
    };
    
    module.subModules.push(newSubModule);
    saveState();
    renderAdminRegistrationModules(tabType);
    alert('Subject added successfully.');
}

// REMOVE: sub-module/course from module
function removeAdminRegSubModule(moduleId, subModuleId, tabType) {
    if (!confirm('Are you sure you want to remove this subject?')) return;
    
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const module = modules.find(m => m.id === moduleId);
    
    if (module) {
        module.subModules = (module.subModules || []).filter(sm => sm.id !== subModuleId);
        saveState();
        renderAdminRegistrationModules(tabType);
    }
}

// APPROVE: sub-module for free credits/conc/minor
function approveAdminRegCourse(moduleId, subModuleId, tabType) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const module = modules.find(m => m.id === moduleId);
    
    if (module) {
        const subMod = (module.subModules || []).find(sm => sm.id === subModuleId);
        if (subMod) {
            subMod.status = 'approved';
            subMod.approved = true;
            saveState();
            renderAdminRegistrationModules(tabType);
            alert('Subject approved.');
        }
    }
}

// REJECT: sub-module for free credits/conc/minor
function rejectAdminRegCourse(moduleId, subModuleId, tabType) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const module = modules.find(m => m.id === moduleId);
    
    if (module) {
        const subMod = (module.subModules || []).find(sm => sm.id === subModuleId);
        if (subMod) {
            subMod.status = 'rejected';
            subMod.approved = false;
            saveState();
            renderAdminRegistrationModules(tabType);
            alert('Subject rejected.');
        }
    }
}

// SAVE: All changes are auto-saved to localStorage via saveState() calls above
function saveAdminRegStructures() {
    saveState();
    alert('All registration structure changes have been saved.');
}


function selectFreeModule(moduleId) {
    adminRegUiState.selectedFreeModule = moduleId;
    rerenderAdminRegistrationModulesPreservingScroll('free');
}

function renderFreeModulePane() {
    const pane = document.getElementById('free-module-pane');
    if (!pane) return;

    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const modules = (KIU_STATE.adminProgramStructures?.[currentFaculty]?.free || []);
    const selectedId = adminRegUiState.selectedFreeModule;
    const module = modules.find(item => item.id === selectedId) || modules[0] || null;

    if (!module) {
        pane.innerHTML = `<div style="padding:30px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px dashed var(--lux-border); border-radius:18px;">No free credit modules yet.</div>`;
        return;
    }

    adminRegUiState.selectedFreeModule = module.id;
    const completed = getAssignedCourseEctsTotal(module.subModules || []);
    const progressLabel = formatEctsProgress(module.maxEcts || 0, completed);
    const subModules = module.subModules || [];

    pane.innerHTML = `
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:14px;">
            <div style="min-width:0;">
                <div style="font-size:14px; font-weight:800; color:var(--lux-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(module.name || 'Free Credits')}</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:3px;">Free Credit Subjects</div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; align-items:center;">
                <div style="background:linear-gradient(135deg, #edf4ff, #dfeafe); color:#c2410c; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:800;">ECTS: ${escapeHtml(progressLabel)}</div>
                <button type="button" data-admin-reg-edit-module="${escapeHtml(module.id)}" class="kiu-btn-outline" style="padding:8px 11px; font-size:11px;"><i class="fas fa-edit"></i></button>
                <button type="button" data-admin-reg-delete-module="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="kiu-btn-outline" style="padding:8px 11px; font-size:11px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-subject="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="kiu-btn-blue" style="padding:8px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:12px; color:var(--lux-text-muted); font-size:11px; font-weight:800; text-transform:uppercase;">
            <div style="width:84px; text-align:center;">#</div>
            <div style="flex:3;">Subject Title / Module Title</div>
            <div style="width:110px; text-align:center;">ECTS</div>
            <div style="flex:2;">Prerequisite</div>
            <div style="width:120px;"></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            ${(subModules.length === 0 ? `
                <div style="padding:18px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border:1px dashed var(--lux-border); border-radius:16px;">No subjects assigned</div>
            ` : subModules.map((subMod, idx) => {
                const details = getAssignedCourseCurriculumDetails(subMod, currentFaculty);
                return `
                <div style="display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:16px; box-shadow:0 10px 24px rgba(0,0,0,0.12);">
                    <div style="width:84px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(subMod.number || idx + 1)}</div>
                    <div style="flex:3; min-width:0;">
                        <div style="font-weight:700; color:var(--lux-text);">${escapeHtml(subMod.name || 'Untitled Subject')}</div>
                        <div style="font-size:10px; color:var(--lux-text-soft); margin-top:2px;">${escapeHtml((subMod.courses || []).join(', ') || '')}</div>
                    </div>
                    <div style="width:110px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(subMod.ects || '0')}</div>
                    <div style="flex:2; font-size:11px; color:var(--lux-text-muted);">
                        <div>${escapeHtml(`Prerequisite: ${details.prerequisite}`)}</div>
                        ${details.antiRequisite ? `<div style="margin-top:4px;">${escapeHtml(`Anti-requisite: ${details.antiRequisite}`)}</div>` : ''}
                        ${details.curriculumSemester ? `<div style="margin-top:4px; color:var(--lux-green); font-weight:700;">${escapeHtml(details.curriculumSemester)}</div>` : ''}
                        ${details.studentAccess ? `<div style="margin-top:4px; color:var(--lux-accent-2); font-weight:700;">${escapeHtml(`Student access: ${details.studentAccess}`)}</div>` : ''}
                    </div>
                    <div style="width:120px; display:flex; justify-content:flex-end; gap:8px;">
                        <button type="button" data-admin-reg-edit-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px;"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `; }).join(''))}
        </div>
    `;
}

function renderFreeTab(container, modules, tabType) {
    if (modules.length > 0) {
        if (!modules.some(mod => mod.id === adminRegUiState.selectedFreeModule)) {
            adminRegUiState.selectedFreeModule = modules[0].id;
        }
    } else {
        adminRegUiState.selectedFreeModule = null;
    }

    const html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; margin-bottom:18px;">
            <div>
                <div style="font-size:18px; font-weight:800; color:var(--lux-text);">Free Credits</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">Manage free credit modules with the same split-panel layout used in Minor.</div>
            </div>
            <button type="button" data-admin-reg-add-module="free" class="kiu-btn-blue" style="padding:10px 16px; font-size:12px;"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div style="display:grid; grid-template-columns:320px 1fr; gap:18px; align-items:start;">
            <div style="background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:18px; padding:16px; box-shadow:var(--lux-shadow);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:13px; font-weight:800; color:var(--lux-text-muted);">Free Credit Modules</div>
                    <span style="font-size:11px; color:var(--lux-text-muted);">${modules.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-free-modules" style="display:flex; flex-direction:column; gap:10px; max-height:260px; overflow:auto; padding-right:4px;">
                    ${modules.length === 0 ? `<div style="padding:20px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border-radius:14px;">No free credit modules yet</div>` : modules.map(module => {
                        const active = module.id === adminRegUiState.selectedFreeModule;
                        const completed = getAssignedCourseEctsTotal(module.subModules || []);
                        const progress = formatEctsProgress(module.maxEcts || 0, completed);
                        return `
                            <label style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; background:${active ? 'linear-gradient(135deg, rgba(11,132,255,0.08), rgba(11,132,255,0.02))' : '#f8fafc'}; border:1px solid ${active ? 'rgba(11,132,255,0.2)' : '#e2e8f0'}; border-radius:14px; cursor:pointer;">
                                <span style="display:flex; align-items:center; gap:10px; min-width:0;">
                                    <input type="radio" name="free-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} style="margin:0;" data-admin-reg-select-module="${escapeHtml(module.id)}" data-admin-reg-module-tab="free">
                                    <span style="font-weight:700; color:var(--lux-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(module.name)}</span>
                                </span>
                                <span style="font-size:11px; font-weight:800; color:#c2410a; background:#eef4fb; border:1px solid #dbe7f5; padding:5px 8px; border-radius:999px;">ECTS: ${escapeHtml(progress)}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="free-module-pane"></div>
        </div>
    `;

    container.innerHTML = localizeHtmlMarkup(html);
    renderFreeModulePane();
}

function editFreeSubModule(moduleId, subModuleId) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const module = KIU_STATE.adminProgramStructures?.[currentFaculty]?.free?.find(item => item.id === moduleId);
    const subModule = module?.subModules?.find(item => item.id === subModuleId);
    if (!module || !subModule) return;
    const curriculumSummary = getAssignedCourseCurriculumSummary(subModule, currentFaculty);

    openStructuredFormModal({
        title: 'Edit Free Credit Course',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'number', label: 'Subject Number', value: subModule.number || '', placeholder: 'e.g. 241' },
            { name: 'name', label: 'Subject Name', value: subModule.name || '', placeholder: 'Enter subject name' },
            { name: 'ects', label: 'ECTS', type: 'number', min: 0, step: 1, value: getCourseEctsValue(subModule) || 0 },
            ...getCourseSeatLimitFieldConfig(subModule),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: curriculumSummary, readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(subModule)
        ],
        onSave: (values, close) => {
            const number = String(values.number || '').trim();
            const name = String(values.name || '').trim();
            const ects = String(toPositiveInt(values.ects, getCourseEctsValue(subModule) || 0));
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);

            if (!number || !name) {
                alert('Please enter a course number and name.');
                return;
            }

            subModule.number = number;
            subModule.name = name;
            subModule.ects = ects;
            subModule.semesterRuleMode = restriction.semesterRuleMode;
            subModule.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(subModule, values);
            saveState();
            close();
            renderAdminRegistrationModules('free');
        }
    });
}

function selectConcGroup(value) {
    adminRegUiState.selectedConcGroup = value;
    renderAdminRegistrationModules('conc');
}

function addConcProgram() {
    openStructuredFormModal({
        title: 'New Concentration Program',
        subtitle: 'Create a new concentration program container.',
        submitLabel: 'Create Program',
        fields: [
            { name: 'programName', label: 'Program Name', placeholder: 'e.g. Concentration1_Brand Management', value: '' }
        ],
        onSave: (values, close) => {
            const newName = String(values.programName || '').trim();
            if (!newName) {
                alert('Please enter a program name.');
                return;
            }
            if (concCourseData[newName]) {
                alert('This concentration program already exists!');
                return;
            }

            concCourseData[newName] = {};
            adminRegUiState.selectedConcProgram = newName;
            adminRegUiState.selectedConcGroup = null;
            saveState();
            close();
            renderAdminRegistrationModules('conc');
        }
    });
}

function deleteConcProgram(programName) {
    if (!confirm(`Delete "${programName}"?`)) return;

    delete concCourseData[programName];
    if (adminRegUiState.selectedConcProgram === programName) {
        adminRegUiState.selectedConcProgram = Object.keys(concCourseData)[0] || null;
        adminRegUiState.selectedConcGroup = null;
    }
    saveState();
    renderAdminRegistrationModules('conc');
}

function updateConcProgramSelection() {
    const selected = document.querySelector('input[name="conc-program"]:checked');
    if (!selected) return;
    adminRegUiState.selectedConcProgram = selected.value;
    adminRegUiState.selectedConcGroup = null;
    renderConcProgramPane();
}

function addCourseGroupToConcentration(programName) {
    openStructuredFormModal({
        title: 'New Concentration Group',
        subtitle: 'Add a course group inside the selected concentration program.',
        submitLabel: 'Create Group',
        fields: [
            { name: 'groupName', label: 'Group Name', placeholder: 'e.g. A (101) Brand Track', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 30 }
        ],
        onSave: (values, close) => {
            const groupName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 30);
            if (!groupName) {
                alert('Please enter a course group name.');
                return;
            }

            if (!concCourseData[programName]) {
                concCourseData[programName] = {};
            }
            if (concCourseData[programName][groupName]) {
                alert('That concentration group already exists in this concentration program.');
                return;
            }

            concCourseData[programName][groupName] = {
                maxEcts,
                completedEcts: 0,
                ects: `${maxEcts}/0`,
                courses: []
            };
            adminRegUiState.selectedConcProgram = programName;
            adminRegUiState.selectedConcGroup = `${programName}|${groupName}`;
            saveState();
            close();
            renderAdminRegistrationModules('conc');
        }
    });
}

function renderConcProgramPane() {
    const pane = document.getElementById('conc-program-pane');
    const selected = adminRegUiState.selectedConcProgram;
    if (!pane) return;
    if (!selected || !concCourseData[selected]) {
        pane.innerHTML = `<div style="padding:30px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px dashed var(--lux-border); border-radius:18px;">Select a concentration program to manage its subject groups.</div>`;
        return;
    }

    const courseGroups = concCourseData[selected] || {};
    const groupNames = Object.keys(courseGroups);
    let html = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
            <div>
                <div style="font-size:14px; font-weight:800; color:var(--lux-text);">${escapeHtml(selected)}</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:3px;">Concentration Program Subjects</div>
            </div>
            <button id="conc-add-group-btn" type="button" data-admin-reg-add-conc-group="${escapeHtml(selected)}" class="kiu-btn-blue" style="padding:8px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Group</button>
        </div>
        <div style="display:flex; flex-direction:column; gap:14px;">
    `;

    if (groupNames.length === 0) {
        html += `<div style="padding:24px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px dashed var(--lux-border); border-radius:18px;">No subject groups added yet.</div>`;
    } else {
        groupNames.forEach((groupName) => {
            const group = courseGroups[groupName] || {};
            const groupKey = `conc:${selected}|${groupName}`;
            const isExpanded = expandedModules.has(groupKey);
            const progress = getTrackGroupProgress(group, getAssignedCourseEctsTotal(group.courses || []));
            const courses = group.courses || [];
            html += `
                <div style="border:1px solid var(--lux-border); border-radius:18px; overflow:hidden; background:var(--lux-surface); box-shadow:var(--lux-shadow);">
                    <div style="display:flex; align-items:center; gap:10px; padding:16px 18px; background:linear-gradient(180deg, #f8fbff 0%, #eef5fb 100%); cursor:pointer;" data-admin-reg-toggle-conc-group="${escapeHtml(groupKey)}">
                        <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}" style="color:var(--lux-accent-2); width:18px;"></i>
                        <div style="flex:1; min-width:0;">
                            <div style="font-weight:800; color:var(--lux-text); font-size:14px;">${escapeHtml(groupName)}</div>
                            <div style="font-size:11px; color:var(--lux-text-muted); margin-top:3px;">${escapeHtml(selected)}</div>
                        </div>
                        <div style="background:linear-gradient(135deg, #edf4ff, #dfeafe); color:#c2410c; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:800;">ECTS: ${escapeHtml(progress.label)}</div>
                        <div style="display:flex; gap:8px;">
                            <button type="button" data-admin-reg-edit-conc-group="${escapeHtml(groupName)}" data-admin-reg-conc-program="${escapeHtml(selected)}" class="kiu-btn-outline" style="padding:6px 10px; font-size:11px;"><i class="fas fa-edit"></i></button>
                            <button type="button" data-admin-reg-delete-conc-group="${escapeHtml(groupName)}" data-admin-reg-conc-program="${escapeHtml(selected)}" class="kiu-btn-outline" style="padding:6px 10px; font-size:11px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div style="padding:0 18px 18px;">
                            <div style="display:flex; gap:8px; margin-top:12px; color:var(--lux-text-muted); font-size:11px; font-weight:800; text-transform:uppercase;">
                                <div style="width:52px; text-align:center;">#</div>
                                <div style="flex:3;">Subject Title / Module Title</div>
                                <div style="width:110px; text-align:center;">ECTS</div>
                                <div style="flex:2;">Precondition / Anti-condition</div>
                                <div style="width:120px;"></div>
                            </div>
                            <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
                                ${(courses.length === 0 ? `
                                    <div style="padding:16px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border-radius:14px;">No subjects assigned</div>
                                ` : courses.map((course, idx) => `
                                    <div style="display:flex; align-items:center; gap:8px; padding:12px 12px; background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:14px;">
                                        <div style="width:52px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(course.n || idx + 1)}</div>
                                        <div style="flex:3; min-width:0;">
                                            <div style="font-weight:700; color:var(--lux-text);">${escapeHtml(course.title || 'Untitled Subject')}</div>
                                            <div style="font-size:10px; color:var(--lux-text-soft); margin-top:2px;">${escapeHtml(course.n || '')}</div>
                                        </div>
                                        <div style="width:110px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(course.ects || '0')}</div>
                    <div style="flex:2; font-size:11px; color:var(--lux-text-muted);">
                        <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div style="margin-top:4px;">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div style="margin-top:4px; color:var(--lux-green); font-weight:700;">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div style="margin-top:4px; color:var(--lux-accent-2); font-weight:700;">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                    </div>
                                        <div style="width:120px; display:flex; justify-content:flex-end; gap:8px;">
                                            <button type="button" data-admin-reg-edit-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected)}" data-admin-reg-conc-group="${escapeHtml(groupName)}" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px;"><i class="fas fa-edit"></i></button>
                                            <button type="button" data-admin-reg-delete-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected)}" data-admin-reg-conc-group="${escapeHtml(groupName)}" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                `).join(''))}
                            </div>
                            <div style="margin-top:12px;">
                                <button type="button" data-admin-reg-add-conc-subject="${escapeHtml(groupName)}" data-admin-reg-conc-program="${escapeHtml(selected)}" class="kiu-btn-blue" style="width:100%; padding:10px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Subject</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += `</div>`;
    pane.innerHTML = localizeHtmlMarkup(html);

}

function renderConcGroupPane() {
    const pane = document.getElementById('conc-group-pane');
    if (!pane) return;

    const entries = [];
    Object.keys(concCourseData || {}).forEach(concKey => {
        const concGroups = concCourseData[concKey] || {};
        Object.keys(concGroups).forEach(groupName => {
            entries.push({ concKey, groupName, group: concGroups[groupName] });
        });
    });

    const selected = entries.find(entry => `${entry.concKey}|${entry.groupName}` === adminRegUiState.selectedConcGroup) || entries[0] || null;
    if (!selected) {
        pane.innerHTML = `<div style="padding:30px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface); border:1px dashed var(--lux-border); border-radius:18px;">Select a concentration group to manage its subjects.</div>`;
        return;
    }

    adminRegUiState.selectedConcGroup = `${selected.concKey}|${selected.groupName}`;
    const completed = getAssignedCourseEctsTotal(selected.group?.courses || []);
    const progressLabel = formatEctsProgress(selected.group?.maxEcts || 0, completed);
    const courses = selected.group?.courses || [];

    pane.innerHTML = `
        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:14px; margin-bottom:14px;">
            <div style="min-width:0;">
                <div style="font-size:14px; font-weight:800; color:var(--lux-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(selected.groupName)}</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:3px;">${escapeHtml(selected.concKey)}</div>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; align-items:center;">
                <div style="background:linear-gradient(135deg, #edf4ff, #dfeafe); color:#c2410a; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:800;">ECTS: ${escapeHtml(progressLabel)}</div>
                <button type="button" data-admin-reg-edit-conc-group="${escapeHtml(selected.groupName)}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" class="kiu-btn-outline" style="padding:8px 11px; font-size:11px;"><i class="fas fa-edit"></i></button>
                <button type="button" data-admin-reg-delete-conc-group="${escapeHtml(selected.groupName)}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" class="kiu-btn-outline" style="padding:8px 11px; font-size:11px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-conc-subject="${escapeHtml(selected.groupName)}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" class="kiu-btn-blue" style="padding:8px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div style="display:flex; gap:8px; margin-top:12px; color:var(--lux-text-muted); font-size:11px; font-weight:800; text-transform:uppercase;">
            <div style="width:84px; text-align:center;">#</div>
            <div style="flex:3;">Subject Title / Module Title</div>
            <div style="width:110px; text-align:center;">ECTS</div>
            <div style="flex:2;">Precondition / Anti-condition</div>
            <div style="width:120px;"></div>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:10px;">
            ${(courses.length === 0 ? `
                <div style="padding:18px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border:1px dashed var(--lux-border); border-radius:16px;">No subjects assigned</div>
            ` : courses.map((course, idx) => `
                <div style="display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:16px; box-shadow:0 10px 24px rgba(0,0,0,0.12);">
                    <div style="width:84px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(course.n || idx + 1)}</div>
                    <div style="flex:3; min-width:0;">
                        <div style="font-weight:700; color:var(--lux-text);">${escapeHtml(course.title || 'Untitled Subject')}</div>
                        <div style="font-size:10px; color:var(--lux-text-soft); margin-top:2px;">${escapeHtml(course.n || '')}</div>
                    </div>
                    <div style="width:110px; text-align:center; font-weight:800; color:var(--lux-accent-2);">${escapeHtml(course.ects || '0')}</div>
                    <div style="flex:2; font-size:11px; color:var(--lux-text-muted);">
                        <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div style="margin-top:4px;">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div style="margin-top:4px; color:var(--lux-green); font-weight:700;">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div style="margin-top:4px; color:var(--lux-accent-2); font-weight:700;">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                    </div>
                    <div style="width:120px; display:flex; justify-content:flex-end; gap:8px;">
                        <button type="button" data-admin-reg-edit-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" data-admin-reg-conc-group="${escapeHtml(selected.groupName)}" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px;"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" data-admin-reg-conc-group="${escapeHtml(selected.groupName)}" class="kiu-btn-outline" style="padding:6px 9px; font-size:10px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `).join(''))}
        </div>
    `;
}

function renderConcTab(container, modules, tabType) {
    const concPrograms = Object.keys(concCourseData || {});
    if (concPrograms.length > 0) {
        if (!concPrograms.includes(adminRegUiState.selectedConcProgram)) {
            adminRegUiState.selectedConcProgram = concPrograms[0];
        }
    } else {
        adminRegUiState.selectedConcProgram = null;
        adminRegUiState.selectedConcGroup = null;
    }

    const html = `
        <div style="display:flex; justify-content:space-between; align-items:flex-end; gap:14px; margin-bottom:18px;">
            <div>
                <div style="font-size:18px; font-weight:800; color:var(--lux-text);">Concentration</div>
                <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">Build concentration programs with the same nested cards, editable ECTS targets, and grouped course lists.</div>
            </div>
            <button type="button" data-admin-reg-add-conc-program="1" class="kiu-btn-blue" style="padding:10px 16px; font-size:12px;"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div style="display:grid; grid-template-columns:320px 1fr; gap:18px; align-items:start;">
            <div style="background:var(--lux-surface); border:1px solid var(--lux-border); border-radius:18px; padding:16px; box-shadow:var(--lux-shadow);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div style="font-size:13px; font-weight:800; color:var(--lux-text-muted);">Concentration Programs</div>
                    <span style="font-size:11px; color:var(--lux-text-muted);">${concPrograms.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-conc-programs" style="display:flex; flex-direction:column; gap:10px; max-height:220px; overflow:auto; padding-right:4px;">
                    ${concPrograms.length === 0 ? `<div style="padding:20px; text-align:center; color:var(--lux-text-muted); background:var(--lux-surface-2); border-radius:14px;">No concentration programs yet</div>` : concPrograms.map(program => {
                        const checkedAttr = program === adminRegUiState.selectedConcProgram ? 'checked' : '';
                        return `
                            <label style="display:flex; align-items:center; justify-content:space-between; gap:10px; padding:12px 14px; background:${program === adminRegUiState.selectedConcProgram ? 'linear-gradient(135deg, rgba(11,132,255,0.08), rgba(11,132,255,0.02))' : '#f8fafc'}; border:1px solid ${program === adminRegUiState.selectedConcProgram ? 'rgba(11,132,255,0.2)' : '#e2e8f0'}; border-radius:14px; cursor:pointer;">
                                <span style="display:flex; align-items:center; gap:10px; min-width:0;">
                                    <input type="radio" name="conc-program" value="${escapeHtml(program)}" ${checkedAttr} data-admin-reg-select-conc-program="${escapeHtml(program)}" style="margin:0;">
                                    <span style="font-weight:700; color:var(--lux-text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(program)}</span>
                                </span>
                                <button type="button" data-admin-reg-delete-conc-program="${escapeHtml(program)}" class="kiu-btn-outline" style="padding:6px 10px; font-size:11px; color:var(--lux-red);"><i class="fas fa-trash"></i></button>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="conc-program-pane"></div>
        </div>
    `;

    container.innerHTML = localizeHtmlMarkup(html);
    renderConcProgramPane();
}

























function getPublicSocialDisplayName(user) {
    if (!user) return 'Portal User';
    return cleanupEncodingArtifacts(toEnglishText(user.nameEn || user.name || user.email || user.id || 'Portal User'));
}

function getPublicSocialScopeKey(scopeType, scopeId) {
    return `${String(scopeType || 'profile')}:${String(scopeId || '')}`;
}

function getPublicSocialProfileScopeId(userId) {
    return `profile:${String(userId || '')}`;
}

function normalizePublicSocialPage(page) {
    const facultyCodeRaw = String(page?.facultyCode || page?.faculty || 'all').trim().toUpperCase();
    const facultyCode = facultyCodeRaw === 'ALL' ? 'all' : normalizeFacultyCode(facultyCodeRaw, facultyCodeRaw);
    return {
        id: String(page?.id || `public_page_${Date.now()}`),
        name: String(page?.name || 'Untitled Page'),
        ownerId: String(page?.ownerId || ''),
        ownerName: getPublicSocialDisplayName({ nameEn: page?.ownerName || 'Portal User' }),
        facultyCode,
        facultyName: facultyCode === 'all' ? 'All Faculties' : getFacultyLabel(facultyCode),
        description: String(page?.description || ''),
        createdAt: String(page?.createdAt || new Date().toISOString()),
        followers: Array.isArray(page?.followers) ? [...new Set(page.followers.map(item => String(item)))] : []
    };
}

function normalizePublicSocialComment(comment) {
    return {
        id: String(comment?.id || `public_comment_${Date.now()}`),
        authorId: String(comment?.authorId || comment?.postedById || ''),
        authorName: getPublicSocialDisplayName({ nameEn: comment?.authorName || comment?.postedByName || 'Portal User' }),
        text: String(comment?.text || ''),
        createdAt: String(comment?.createdAt || new Date().toISOString())
    };
}

function normalizePublicSocialPost(post) {
    const scopeType = String(post?.scopeType || 'profile').toLowerCase() === 'page' ? 'page' : 'profile';
    const scopeId = String(post?.scopeId || (scopeType === 'page' ? post?.pageId || '' : post?.authorId || post?.postedById || '')).trim();
    const postedById = String(post?.postedById || post?.authorId || '').trim();
    const postedByName = getPublicSocialDisplayName({ nameEn: post?.postedByName || post?.authorName || 'Portal User' });
    const scopeName = getPublicSocialDisplayName({ nameEn: post?.scopeName || post?.authorName || postedByName });
    const authorFacultyCodeRaw = String(post?.authorFacultyCode || post?.scopeFacultyCode || post?.postedByFacultyCode || 'all').trim().toUpperCase();
    const authorFacultyCode = authorFacultyCodeRaw === 'ALL' ? 'all' : normalizeFacultyCode(authorFacultyCodeRaw, authorFacultyCodeRaw);
    const audienceFacultyCodeRaw = String(post?.audienceFacultyCode || 'all').trim().toUpperCase();
    const audienceFacultyCode = audienceFacultyCodeRaw === 'ALL' ? 'all' : normalizeFacultyCode(audienceFacultyCodeRaw, authorFacultyCode || getCurrentFaculty());
    return {
        id: String(post?.id || `public_social_post_${Date.now()}`),
        scopeType,
        scopeId,
        scopeName,
        authorId: String(post?.authorId || postedById || ''),
        authorName: scopeName,
        authorRole: String(post?.authorRole || (scopeType === 'page' ? 'page' : 'member')),
        authorFacultyCode,
        authorFacultyName: authorFacultyCode === 'all' ? 'All Faculties' : getFacultyLabel(authorFacultyCode),
        postedById,
        postedByName,
        postedByRole: String(post?.postedByRole || 'member'),
        postedByFacultyCode: String(post?.postedByFacultyCode || post?.authorFacultyCode || 'all').toUpperCase() === 'ALL'
            ? 'all'
            : normalizeFacultyCode(post?.postedByFacultyCode || post?.authorFacultyCode || getCurrentFaculty(), getCurrentFaculty()),
        audienceFacultyCode,
        audienceFacultyName: audienceFacultyCode === 'all' ? 'All Faculties' : getFacultyLabel(audienceFacultyCode),
        text: String(post?.text || ''),
        image: cloneStoredFile(post?.image),
        likes: Array.isArray(post?.likes) ? [...new Set(post.likes.map(item => String(item)))] : [],
        comments: Array.isArray(post?.comments) ? post.comments.map(normalizePublicSocialComment) : [],
        createdAt: String(post?.createdAt || new Date().toISOString())
    };
}

function ensurePublicSocialState() {
    if (!Array.isArray(KIU_STATE.publicSocialPosts)) KIU_STATE.publicSocialPosts = [];
    if (!Array.isArray(KIU_STATE.publicSocialPages)) KIU_STATE.publicSocialPages = [];
    if (!KIU_STATE.publicSocialFollowers || typeof KIU_STATE.publicSocialFollowers !== 'object') KIU_STATE.publicSocialFollowers = {};
    if (!KIU_STATE.publicSocialUi || typeof KIU_STATE.publicSocialUi !== 'object') KIU_STATE.publicSocialUi = {};
    if (typeof KIU_STATE.publicSocialUi.facultyFilter !== 'string') KIU_STATE.publicSocialUi.facultyFilter = 'all';
    if (typeof KIU_STATE.publicSocialUi.view !== 'string') KIU_STATE.publicSocialUi.view = 'feed';
    if (typeof KIU_STATE.publicSocialUi.activeEntityType !== 'string') KIU_STATE.publicSocialUi.activeEntityType = 'feed';
    if (typeof KIU_STATE.publicSocialUi.activeEntityId !== 'string') KIU_STATE.publicSocialUi.activeEntityId = '';
    if (typeof KIU_STATE.publicSocialUi.composeAs !== 'string') KIU_STATE.publicSocialUi.composeAs = 'profile';
    if (typeof KIU_STATE.publicSocialUi.pageSearch !== 'string') KIU_STATE.publicSocialUi.pageSearch = '';
    if (!KIU_STATE.publicSocialDraftFiles || typeof KIU_STATE.publicSocialDraftFiles !== 'object') KIU_STATE.publicSocialDraftFiles = {};

    KIU_STATE.publicSocialPages = KIU_STATE.publicSocialPages.map(normalizePublicSocialPage);
    KIU_STATE.publicSocialPosts = KIU_STATE.publicSocialPosts.map(normalizePublicSocialPost);

    if (!KIU_STATE.publicSocialSeeded) {
        KIU_STATE.publicSocialSeeded = true;
    }

    if (KIU_STATE.publicSocialUi.activeEntityType !== 'feed' && !getPublicSocialEntityByTypeAndId(KIU_STATE.publicSocialUi.activeEntityType, KIU_STATE.publicSocialUi.activeEntityId)) {
        KIU_STATE.publicSocialUi.activeEntityType = 'feed';
        KIU_STATE.publicSocialUi.activeEntityId = '';
        KIU_STATE.publicSocialUi.view = 'feed';
    }
    if (KIU_STATE.publicSocialUi.composeAs !== 'profile' && !getPublicSocialPageById(KIU_STATE.publicSocialUi.composeAs)) {
        KIU_STATE.publicSocialUi.composeAs = 'profile';
    }
}

function ensurePublicSocialUiState() {
    ensurePublicSocialState();
    return KIU_STATE.publicSocialUi;
}

function getPublicSocialDraftFile() {
    ensurePublicSocialState();
    return KIU_STATE.publicSocialDraftFiles.composer || null;
}

function clearPublicSocialDraftFile() {
    ensurePublicSocialState();
    delete KIU_STATE.publicSocialDraftFiles.composer;
}

function ensurePublicSocialFileInput() {
    let input = document.getElementById('public-social-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'public-social-file-input';
        input.accept = 'image/*';
        input.style.display = 'none';
        document.body.appendChild(input);
    }
    return input;
}

function pickPublicSocialFile() {
    const input = ensurePublicSocialFileInput();
    input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            ensurePublicSocialState();
            KIU_STATE.publicSocialDraftFiles.composer = {
                id: `public_social_${Date.now()}`,
                name: file.name,
                type: file.type,
                size: file.size,
                dataUrl: String(reader.result || ''),
                uploadedAt: new Date().toISOString()
            };
            const label = document.getElementById('public-social-file-label');
            if (label) label.innerHTML = `<i class="fas fa-image"></i> ${escapeHtml(file.name)}`;
        };
        reader.readAsDataURL(file);
    };
    input.click();
}








