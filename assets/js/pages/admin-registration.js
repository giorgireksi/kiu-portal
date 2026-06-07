/* Admin registration CMS logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- ADMIN REGISTRATION CMS LOGIC ---

const ADMIN_REGISTRATION_SAVE_DEBOUNCE_MS = 350;
let adminRegistrationSaveTimer = 0;
let boundRegistrationCmsFaculty = '';

function resolveRegistrationCmsFaculty(faculty) {
    return normalizeFacultyCode(
        faculty
        || (document.getElementById('admin-reg-content-container') && typeof getAdminRegistrationFaculty === 'function'
            ? getAdminRegistrationFaculty()
            : '')
        || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '')
        || 'ECON',
        'ECON'
    );
}

function persistRegistrationCmsGlobalsToFaculty(faculty) {
    const fac = resolveRegistrationCmsFaculty(faculty);
    if (!KIU_STATE.registrationCMSByFaculty || typeof KIU_STATE.registrationCMSByFaculty !== 'object') {
        KIU_STATE.registrationCMSByFaculty = {};
    }
    if (!KIU_STATE.registrationCMSByFaculty[fac]) {
        KIU_STATE.registrationCMSByFaculty[fac] = {
            concCourseData: {},
            minorProgramData: {},
            trackData: {},
            customTabs: [],
            builtinTabOverrides: {},
            hiddenBuiltinTabs: []
        };
    }
    const bucket = KIU_STATE.registrationCMSByFaculty[fac];
    if (typeof ensureAdminRegTrackBucket === 'function') {
        ensureAdminRegTrackBucket(fac);
    }
    if (typeof concCourseData !== 'undefined') {
        bucket.concCourseData = concCourseData;
    }
    if (typeof minorProgramData !== 'undefined') {
        bucket.minorProgramData = minorProgramData;
    }
    if (typeof bucket.trackData === 'object' && bucket.trackData) {
        if (typeof migrateAdminRegistrationCmsToTrackModel === 'function') {
            migrateAdminRegistrationCmsToTrackModel(fac);
        }
        if (typeof syncAdminRegTrackLegacyMirrors === 'function') {
            syncAdminRegTrackLegacyMirrors(bucket);
        }
    }
    KIU_STATE.registrationCMS = {
        concCourseData: bucket.concCourseData || {},
        minorProgramData: bucket.minorProgramData || {},
        faculty: fac
    };
    return bucket;
}

function flushAdminRegistrationStateSave(options = {}) {
    if (adminRegistrationSaveTimer) {
        clearTimeout(adminRegistrationSaveTimer);
        adminRegistrationSaveTimer = 0;
    }
    if (options.syncFaculty !== false && typeof persistRegistrationCmsGlobalsToFaculty === 'function') {
        persistRegistrationCmsGlobalsToFaculty(
            options.faculty || boundRegistrationCmsFaculty || resolveRegistrationCmsFaculty()
        );
    }
    if (typeof saveState !== 'function') return;
    saveState();
}

function queueAdminRegistrationStateSave() {
    if (typeof saveState !== 'function') return;
    if (adminRegistrationSaveTimer) {
        clearTimeout(adminRegistrationSaveTimer);
    }
    adminRegistrationSaveTimer = window.setTimeout(() => {
        adminRegistrationSaveTimer = 0;
        flushAdminRegistrationStateSave();
    }, ADMIN_REGISTRATION_SAVE_DEBOUNCE_MS);
}

window.persistRegistrationCmsGlobalsToFaculty = persistRegistrationCmsGlobalsToFaculty;
window.flushAdminRegistrationStateSave = flushAdminRegistrationStateSave;
window.queueAdminRegistrationStateSave = queueAdminRegistrationStateSave;

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

function getAdminRegistrationCmsRevision() {
    return String((typeof KIU_STATE !== 'undefined' && KIU_STATE?.meta?.registrationCmsRevision) || 0);
}

function bootAdminRegistrationCms(tabType = 'prog', options = {}) {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;

    const safeTab = tabType || adminRegActiveTab || 'prog';
    const cmsRevision = getAdminRegistrationCmsRevision();
    const forceRender = options.force === true
        || container.dataset.cmsRevision !== cmsRevision
        || container.dataset.cmsFaculty !== normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');

    if (hasVisibleAdminRegistrationCmsContent(container) && !forceRender) {
        return;
    }

    if (typeof renderAdminRegTabBar === 'function') {
        renderAdminRegTabBar(safeTab);
    }
    renderAdminRegistrationModules(safeTab);
    container.dataset.cmsRevision = cmsRevision;
}

function handleAdminRegistrationCmsChanged() {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;
    const cmsRevision = getAdminRegistrationCmsRevision();
    const faculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    if (
        hasVisibleAdminRegistrationCmsContent(container)
        && container.dataset.cmsRevision === cmsRevision
        && container.dataset.cmsFaculty === faculty
    ) {
        if (typeof bindFacultyRegistrationCmsData === 'function') {
            bindFacultyRegistrationCmsData(faculty);
        }
        return;
    }
    bootAdminRegistrationCms(adminRegActiveTab || 'prog');
}

if (!window.__kiuAdminRegistrationCmsChangedBound) {
    window.__kiuAdminRegistrationCmsChangedBound = true;
    window.addEventListener('kiu:registration-cms-changed', handleAdminRegistrationCmsChanged);
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

    const toneClasses = ['is-warning', 'is-over'];
    toneClasses.forEach((className) => {
        progressBar.classList.remove(className);
        ectsText.classList.remove(className);
    });
    const toneClass = totalEcts > 36 ? 'is-over' : 'is-warning';
    progressBar.classList.add(toneClass);
    ectsText.classList.add(toneClass);
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
        faculty || (document.getElementById('admin-reg-content-container') ? getAdminRegistrationFaculty() : getCurrentFaculty()) || 'ECON',
        'ECON'
    );
    if (!KIU_STATE.adminProgramStructures) KIU_STATE.adminProgramStructures = {};

    const defaults = getDefaultAdminRegistrationCmsStructures();
    const current = KIU_STATE.adminProgramStructures[fac];

    if (!current) {
        KIU_STATE.adminProgramStructures[fac] = JSON.parse(JSON.stringify(defaults));
        queueAdminRegistrationStateSave();
        return;
    }

    let changed = false;
    ['prog', 'free', 'conc', 'minor'].forEach(tab => {
        if (!Array.isArray(current[tab])) {
            current[tab] = JSON.parse(JSON.stringify(defaults[tab]));
            changed = true;
        }
    });

    if (changed) queueAdminRegistrationStateSave();
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

// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â
// ADMIN REGISTRATION STRUCTURE CMS - FUNCTIONAL IMPLEMENTATION
// ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â

// Initialize program structures in state if not present - FACULTY SCOPED with NESTED STRUCTURE
if (!KIU_STATE.adminProgramStructures) {
    KIU_STATE.adminProgramStructures = createEmptyAdminProgramStructures(KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {});
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
    selectedMinorProgram: null,
    selectedTrack: {}
};
let curriculumLibraryUiState = {
    selectedModulesByFaculty: {}
};
let studentEducationalProgramUiState = {
    selectedModulesByFaculty: {}
};

let adminRegistrationCmsDelegateRoot = null;
let adminRegistrationCmsDelegateClickHandler = null;
let adminRegistrationCmsDelegateChangeHandler = null;

function resetAdminRegistrationCmsDelegates() {
    if (adminRegistrationCmsDelegateRoot) {
        if (adminRegistrationCmsDelegateClickHandler) {
            adminRegistrationCmsDelegateRoot.removeEventListener('click', adminRegistrationCmsDelegateClickHandler);
        }
        if (adminRegistrationCmsDelegateChangeHandler) {
            adminRegistrationCmsDelegateRoot.removeEventListener('change', adminRegistrationCmsDelegateChangeHandler);
        }
    }
    adminRegistrationCmsDelegateRoot = null;
    adminRegistrationCmsDelegateClickHandler = null;
    adminRegistrationCmsDelegateChangeHandler = null;
}

function bindAdminRegistrationCmsDelegates() {
    const root = document.getElementById('admin-reg-content-container');
    if (!root) return;
    if (adminRegistrationCmsDelegateRoot === root && adminRegistrationCmsDelegateClickHandler) return;

    resetAdminRegistrationCmsDelegates();

    adminRegistrationCmsDelegateClickHandler = (event) => {
        if (typeof handleAdminRegTrackDelegateClick === 'function' && handleAdminRegTrackDelegateClick(event)) {
            return;
        }

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
    };

    adminRegistrationCmsDelegateChangeHandler = (event) => {
        if (typeof handleAdminRegTrackDelegateChange === 'function' && handleAdminRegTrackDelegateChange(event)) {
            return;
        }

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
    };

    root.addEventListener('click', adminRegistrationCmsDelegateClickHandler);
    root.addEventListener('change', adminRegistrationCmsDelegateChangeHandler);
    adminRegistrationCmsDelegateRoot = root;
}

window.resetAdminRegistrationCmsDelegates = resetAdminRegistrationCmsDelegates;

// MAIN: Switch between registration tabs
function switchAdminRegTab(tabTarget) {
    const validTabs = typeof getValidAdminRegTabIds === 'function'
        ? getValidAdminRegTabIds(getAdminRegistrationFaculty())
        : ['prog', 'free', 'conc', 'minor'];
    if (!validTabs.includes(tabTarget)) return;

    flushAdminRegistrationStateSave();
    
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
        tab.setAttribute('aria-pressed', 'false');
        tab.setAttribute('tabindex', '-1');
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
            tab.setAttribute('aria-pressed', 'true');
            tab.setAttribute('tabindex', '0');
        }
    });
    
    // Render content for this tab
    renderAdminRegistrationModules(tabTarget);
    if (typeof renderAdminRegPanelHeadActions === 'function') {
        renderAdminRegPanelHeadActions(tabTarget);
    }
}

function getCourseEctsValue(course) {
    const direct = Number(course?.ects);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const parsed = parseInt(String(course?.ects || '').match(/\d+/)?.[0] || '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

function getAssignedCourseEctsTotal(courses) {
    return (courses || []).reduce((sum, course) => sum + getCourseEctsValue(course), 0);
}

// RENDER: Display modules and courses for active tab - FACULTY SCOPED with TAB-SPECIFIC LAYOUTS
function renderAdminRegistrationModules(tabType) {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;

    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const validTabs = typeof getValidAdminRegTabIds === 'function'
        ? getValidAdminRegTabIds(currentFaculty)
        : ['prog', 'free', 'conc', 'minor'];
    const safeTab = validTabs.includes(tabType) ? tabType : 'prog';

    const selectedProgramInput = document.querySelector(`input[name="admin-reg-program-${safeTab}"]:checked`);
    if (selectedProgramInput && typeof setAdminRegSelectedProgram === 'function') {
        const nextProgram = selectedProgramInput.value;
        const currentProgram = typeof getAdminRegSelectedProgram === 'function'
            ? getAdminRegSelectedProgram(safeTab)
            : null;
        setAdminRegSelectedProgram(safeTab, nextProgram, { preserveGroupKey: nextProgram === currentProgram });
    }

    container.dataset.cmsFaculty = currentFaculty;
    container.dataset.cmsRevision = getAdminRegistrationCmsRevision();

    ensureAdminRegistrationCmsDefaults(currentFaculty);
    bindFacultyRegistrationCmsData(currentFaculty);

    const renderLegacyFallback = () => {
        container.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-triangle-exclamation',
            title: 'Registration Structure CMS could not load',
            copy: 'Please refresh once.',
            classes: 'admin-reg-render-fallback'
        });
    };

    try {
        const tabConfig = typeof resolveAdminRegTab === 'function'
            ? resolveAdminRegTab(safeTab)
            : null;
        if (tabConfig && typeof renderAdminRegTrackTab === 'function') {
            renderAdminRegTrackTab(container, tabConfig);
        }

        if (!hasVisibleAdminRegistrationCmsContent(container)) {
            console.log('[RegCMS] Track render produced no content, using legacy fallback.');
            renderLegacyFallback();
        }
        container.setAttribute('data-lux-transparency-exempt', '1');
        if (typeof refreshAdminRegistrationCmsPresentation === 'function') {
            refreshAdminRegistrationCmsPresentation();
        }
    } catch (err) {
        console.error('Registration CMS render failed, falling back to legacy layout:', err);
        renderLegacyFallback();
    }
}

function buildAdminRegEmptyStateMarkup({ icon = 'fas fa-circle-info', title = '', copy = '', classes = '' } = {}) {
    const className = ['lux-empty-state', classes].filter(Boolean).join(' ');
    return `
        <div class="${className}">
            <i class="${escapeHtml(icon)}"></i>
            <strong>${escapeHtml(title || 'Nothing to show yet')}</strong>
            ${copy ? `<span>${escapeHtml(copy)}</span>` : ''}
        </div>
    `;
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
        <div class="admin-reg-program-head">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title">Program Modules</div>
                <div class="admin-reg-program-head-copy">Organize your program into modules and assign courses.</div>
            </div>
            <button type="button" data-admin-reg-add-module="prog" class="lux-primary-btn admin-reg-program-add-btn"><i class="fas fa-plus"></i> Add Module</button>
        </div>
        <div class="admin-reg-program-layout">
            <div class="lux-surface admin-reg-program-list-shell">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title">Modules</div>
                    <span class="admin-reg-program-list-count">${modules.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-prog-modules" class="admin-reg-program-list">
                    ${modules.length === 0 ? `
                        <div class="lux-empty-state admin-reg-program-list-empty">
                            <i class="fas fa-folder-plus"></i>
                            <strong>No modules yet</strong>
                            <span>Create your first program module to get started.</span>
                        </div>
                    ` : modules.map(module => {
                        const active = module.id === adminRegUiState.selectedProgModule;
                        const completed = getAssignedCourseEctsTotal(module.subModules || []);
                        const progress = formatEctsProgress(module.maxEcts || 0, completed);
                        return `
                            <label class="admin-reg-program-option${active ? ' is-active' : ''}">
                                <span class="admin-reg-program-option-row">
                                    <input type="radio" name="prog-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} class="admin-reg-program-option-input" data-admin-reg-select-module="${escapeHtml(module.id)}" data-admin-reg-module-tab="prog">
                                    <span class="admin-reg-program-option-title">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled'}`.trim())}</span>
                                </span>
                                <span class="admin-reg-program-option-progress">ECTS: ${escapeHtml(progress)}</span>
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
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-arrow-left',
            title: 'Select a module',
            copy: 'Choose a module from the list to manage its subjects.',
            classes: 'admin-reg-program-pane-empty admin-reg-program-pane-empty--tall'
        });
        return;
    }

    adminRegUiState.selectedProgModule = module.id;
    const moduleId = jsQuote(module.id);
    const subModules = module.subModules || [];
    const progressLabel = formatEctsProgress(module.maxEcts || 0, getAssignedCourseEctsTotal(subModules));

    pane.innerHTML = `
        <div class="admin-reg-program-pane-head">
            <div class="admin-reg-program-pane-main">
                <div class="admin-reg-program-pane-title">${escapeHtml(module.name || 'Program')}</div>
                <div class="admin-reg-program-pane-copy">Module subjects</div>
            </div>
            <div class="admin-reg-program-pane-actions">
                <button type="button" data-admin-reg-edit-module="${escapeHtml(module.id)}" class="lux-ghost-btn admin-reg-program-pane-btn"><i class="fas fa-edit"></i> Edit</button>
                <button type="button" data-admin-reg-delete-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn admin-reg-program-pane-btn admin-reg-program-pane-btn--danger"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-subject="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-primary-btn admin-reg-program-pane-btn"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div class="admin-reg-program-subject-list">
            ${(subModules.length === 0 ? `
                ${buildAdminRegEmptyStateMarkup({
                    icon: 'fas fa-book-open',
                    title: 'No subjects assigned',
                    copy: 'Add subjects to this module using the button above.',
                    classes: 'admin-reg-program-subject-empty'
                })}
            ` : subModules.map((subMod, idx) => {
                const details = getAssignedCourseCurriculumDetails(subMod, currentFaculty);
                return `
                <div class="admin-reg-program-subject-row">
                    <div class="admin-reg-program-subject-number">${escapeHtml(subMod.number || idx + 1)}</div>
                    <div class="admin-reg-program-subject-main">
                        <div class="admin-reg-program-subject-title">${escapeHtml(subMod.name || 'Untitled Subject')}</div>
                        <div class="admin-reg-program-subject-courses">${escapeHtml((subMod.courses || []).join(', ') || '')}</div>
                    </div>
                    <div class="admin-reg-program-subject-ects">${escapeHtml(subMod.ects || '0')}</div>
                    <div class="admin-reg-program-subject-details">
                        <div>${escapeHtml(`Prerequisite: ${details.prerequisite}`)}</div>
                        ${details.antiRequisite ? `<div class="admin-reg-program-subject-detail">${escapeHtml(`Anti-requisite: ${details.antiRequisite}`)}</div>` : ''}
                        ${details.curriculumSemester ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--semester">${escapeHtml(details.curriculumSemester)}</div>` : ''}
                        ${details.studentAccess ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--access">${escapeHtml(`Student access: ${details.studentAccess}`)}</div>` : ''}
                    </div>
                    <div class="admin-reg-program-subject-actions">
                        <button type="button" data-admin-reg-edit-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn admin-reg-program-subject-btn"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
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
            queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
            close();
            alert(`Concentration group "${groupName}" added successfully.`);
            renderAdminRegistrationModules('conc');
        }
    });
}

function deleteConcGroup(concKey, groupName) {
    if (!confirm(`Delete concentration group "${groupName}"?`)) return;
    
    delete concCourseData[concKey][groupName];
    queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
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
    queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
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
            minorProgramData: cloneJson(canMigrateLegacy ? (legacy.minorProgramData || DEFAULT_MINOR_PROGRAM_DATA) : DEFAULT_MINOR_PROGRAM_DATA),
            trackData: {},
            customTabs: [],
            builtinTabOverrides: {},
            hiddenBuiltinTabs: []
        };
        changed = true;
    }

    const bucket = KIU_STATE.registrationCMSByFaculty[fac];
    if (!bucket.trackData || typeof bucket.trackData !== 'object') {
        bucket.trackData = {};
        changed = true;
    }
    if (!Array.isArray(bucket.customTabs)) {
        bucket.customTabs = [];
        changed = true;
    }
    if (!bucket.builtinTabOverrides || typeof bucket.builtinTabOverrides !== 'object') {
        bucket.builtinTabOverrides = {};
        changed = true;
    }
    if (!Array.isArray(bucket.hiddenBuiltinTabs)) {
        bucket.hiddenBuiltinTabs = [];
        changed = true;
    }
    if (typeof migrateAdminRegistrationCmsToTrackModel === 'function') {
        migrateAdminRegistrationCmsToTrackModel(fac);
    }
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
    if (changed) queueAdminRegistrationStateSave();
    return bucket;
}

function bindFacultyRegistrationCmsData(faculty) {
    const fac = resolveRegistrationCmsFaculty(faculty);
    const facultyChanged = Boolean(boundRegistrationCmsFaculty && boundRegistrationCmsFaculty !== fac);
    if (facultyChanged) {
        persistRegistrationCmsGlobalsToFaculty(boundRegistrationCmsFaculty);
        flushAdminRegistrationStateSave({ syncFaculty: false });
        ensureRegistrationCmsFacultyIsolation();
    }
    const bucket = ensureFacultyRegistrationCmsData(fac);
    if (typeof syncAdminRegTrackLegacyMirrors === 'function') {
        syncAdminRegTrackLegacyMirrors(bucket);
    } else {
        concCourseData = bucket.concCourseData;
        minorProgramData = bucket.minorProgramData;
    }
    // Backward-compatible mirror key used by older code paths.
    KIU_STATE.registrationCMS = {
        concCourseData: bucket.concCourseData,
        minorProgramData: bucket.minorProgramData,
        trackData: bucket.trackData || {},
        customTabs: bucket.customTabs || [],
        builtinTabOverrides: bucket.builtinTabOverrides || {},
        hiddenBuiltinTabs: bucket.hiddenBuiltinTabs || [],
        faculty: fac
    };
    boundRegistrationCmsFaculty = fac;
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

window.addEventListener('beforeunload', () => {
    flushAdminRegistrationStateSave();
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        flushAdminRegistrationStateSave();
    }
});

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
        <div class="admin-reg-program-head admin-reg-program-head--large">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title admin-reg-program-head-title--large">Minor</div>
                <div class="admin-reg-program-head-copy admin-reg-program-head-copy--large">Build minor programs with the same nested cards, editable ECTS targets, and grouped course lists.</div>
            </div>
            <button type="button" data-admin-reg-add-minor-program="1" class="lux-primary-btn admin-reg-program-add-btn admin-reg-program-add-btn--large"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div class="admin-reg-program-layout admin-reg-program-layout--wide">
            <div class="admin-reg-program-list-shell">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title admin-reg-program-list-title--strong">Minor Programs</div>
                    <span class="admin-reg-program-list-count">${minorPrograms.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-minor-programs" class="admin-reg-program-list">
                    ${minorPrograms.length === 0 ? `<div class="admin-reg-program-list-placeholder">No minor programs yet</div>` : minorPrograms.map(program => {
                        const checkedAttr = program === adminRegUiState.selectedMinorProgram ? 'checked' : '';
                        return `
                            <label class="admin-reg-program-option admin-reg-program-option--wide${program === adminRegUiState.selectedMinorProgram ? ' is-active' : ''}">
                                <span class="admin-reg-program-option-row">
                                    <input type="radio" name="minor-program" value="${program}" ${checkedAttr} data-admin-reg-select-minor-program="${escapeHtml(program)}" class="admin-reg-program-option-input">
                                    <span class="admin-reg-program-option-title">${program}</span>
                                </span>
                                <button type="button" data-admin-reg-delete-minor-program="${escapeHtml(program)}" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
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
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-diagram-project',
            title: 'Select a minor program',
            copy: 'Choose a minor program to manage its subject groups.',
            classes: 'admin-reg-program-pane-empty'
        });
        return;
    }

    const program = minorProgramData[selected];
    const courseGroups = program.courseGroups || {};
    const groupNames = Object.keys(courseGroups);
    let html = `
        <div class="admin-reg-track-head">
            <div>
                <div class="admin-reg-track-head-title">${selected}</div>
                <div class="admin-reg-track-head-copy">Minor Program Subjects</div>
            </div>
            <button id="minor-add-course-btn" type="button" data-admin-reg-add-minor-group="${escapeHtml(selected)}" class="lux-primary-btn admin-reg-track-add-btn"><i class="fas fa-plus"></i> Add Group</button>
        </div>
        <div class="admin-reg-track-groups">
    `;

    if (groupNames.length === 0) {
        html += buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-layer-group',
            title: 'No subject groups added yet',
            copy: 'Create the first group to start assigning subjects in this minor program.',
            classes: 'admin-reg-track-empty'
        });
    } else {
        groupNames.forEach((groupName, groupIdx) => {
            const group = courseGroups[groupName] || {};
            const groupKey = `minor:${selected}|${groupName}`;
            const isExpanded = expandedModules.has(groupKey);
            const progress = getTrackGroupProgress(group);
            const courses = group.courses || [];
            html += `
                <div class="admin-reg-track-group-card">
                    <div class="admin-reg-track-group-toggle" data-admin-reg-toggle-minor-group="${escapeHtml(groupKey)}">
                        <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} admin-reg-track-group-chevron"></i>
                        <div class="admin-reg-track-group-main">
                            <div class="admin-reg-track-group-title">${groupName}</div>
                            <div class="admin-reg-track-group-copy">${selected}</div>
                        </div>
                        <div class="admin-reg-track-group-progress">ECTS: ${progress.label}</div>
                        <div class="admin-reg-track-group-actions">
                            <button type="button" data-admin-reg-edit-minor-group="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="lux-ghost-btn admin-reg-track-group-btn"><i class="fas fa-edit"></i></button>
                            <button type="button" data-admin-reg-delete-minor-group="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="lux-ghost-btn admin-reg-track-group-btn admin-reg-track-group-btn--danger"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div class="admin-reg-track-group-body">
                            <div class="admin-reg-track-subject-head">
                                <div class="admin-reg-track-subject-head-number">#</div>
                                <div class="admin-reg-track-subject-head-title">Subject Title / Module Title</div>
                                <div class="admin-reg-track-subject-head-ects">ECTS</div>
                                <div class="admin-reg-track-subject-head-meta">Precondition / Anti-condition</div>
                                <div class="admin-reg-track-subject-head-actions"></div>
                            </div>
                            <div class="admin-reg-track-subject-list">
                                ${(courses.length === 0 ? `
                                    <div class="admin-reg-track-subject-empty">No subjects assigned</div>
                                ` : courses.map((course, idx) => `
                                    <div class="admin-reg-track-subject-row">
                                        <div class="admin-reg-track-subject-number">${course.n || idx + 1}</div>
                                        <div class="admin-reg-track-subject-main">
                                            <div class="admin-reg-track-subject-title">${course.title}</div>
                                            <div class="admin-reg-track-subject-code">${course.n || ''}</div>
                                        </div>
                                        <div class="admin-reg-track-subject-ects">${course.ects || '0'}</div>
                                        <div class="admin-reg-track-subject-details">
                                            <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div class="admin-reg-track-subject-detail">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--semester">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--access">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                                        </div>
                                        <div class="admin-reg-track-subject-actions">
                                            <button type="button" data-admin-reg-edit-minor-course="${idx}" data-admin-reg-minor-program="${escapeHtml(selected)}" data-admin-reg-minor-group="${escapeHtml(groupName)}" class="lux-ghost-btn admin-reg-track-subject-btn"><i class="fas fa-edit"></i></button>
                                        </div>
                                    </div>
                                `).join(''))}
                            </div>
                            <div class="admin-reg-track-group-footer">
                                <button type="button" data-admin-reg-add-minor-subject="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="lux-primary-btn admin-reg-track-group-add-subject"><i class="fas fa-plus"></i> Add Subject</button>
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
            queueAdminRegistrationStateSave();
            close();
            alert(`"${newName}" added successfully.`);
            renderAdminRegistrationModules('minor');
        }
    });
}

function deleteMinorProgram(programName) {
    if (!confirm(`Delete "${programName}"?`)) return;
    
    delete minorProgramData[programName];
    queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
            close();
            alert(`Subject group "${groupName}" added successfully.`);
            renderAdminRegistrationModules('minor');
        }
    });
}

function deleteMinorCourseGroup(programName, groupName) {
    if (!confirm(`Delete course group "${groupName}"?`)) return;
    
    delete minorProgramData[programName].courseGroups[groupName];
    queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
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
    const tabConfig = typeof resolveAdminRegTab === 'function'
        ? resolveAdminRegTab(adminRegActiveTab)
        : null;
    if (tabConfig && typeof renderAdminRegTrackProgramPane === 'function') {
        renderAdminRegTrackProgramPane(adminRegActiveTab, tabConfig);
        return;
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

            queueAdminRegistrationStateSave();
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
        flushAdminRegistrationStateSave();
        renderAdminRegistrationModules(tabType);
        alert('Module removed.');
    }
}

// ADD NEW: Create a new module/block
function addNewAdminRegModule(tabType) {
    const safeTab = String(tabType || 'prog').trim();
    if (typeof addTrackProgram === 'function' && (safeTab === 'prog' || safeTab === 'free')) {
        addTrackProgram(safeTab);
        return;
    }
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
            flushAdminRegistrationStateSave();
            const syncPromise = typeof flushPortalStateSync === 'function'
                ? flushPortalStateSync()
                : Promise.resolve();
            close();
            renderAdminRegistrationModules(tabType);
            syncPromise.catch(() => null);
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
            if (typeof saveState === 'function') queueAdminRegistrationStateSave();
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
        const tabId = programType === 'concentration' ? 'conc' : (programType === 'minor' ? 'minor' : String(programType));
        const track = typeof getAdminRegTrackData === 'function'
            ? getAdminRegTrackData(tabId)
            : {};
        const existing = track?.[programContext?.programName]?.[programContext?.groupName]?.courses || [];
        assignedCourses = new Set(existing.map(c => c.sourceCourseId || c.n).filter(Boolean));
        assignedSubjectKeys = new Set(existing.map(c => normalizeSubjectTitleKey(c.title || c.name || c.n)).filter(Boolean));
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
        <div id="course-selection-modal-bg" class="admin-reg-course-modal-overlay">
            <div class="admin-reg-course-modal-card">
                <div class="admin-reg-course-modal-header">
                    <div>
                        <div class="admin-reg-course-modal-title">Select Subject</div>
                        <div class="admin-reg-course-modal-subtitle">Target: <strong>${escapeHtml(modalTargetName)}</strong></div>
                    </div>
                    <div class="admin-reg-course-modal-actions">
                        <button id="modal-create-subject-btn" class="admin-reg-course-modal-create-btn"><i class="fas fa-plus"></i> Create Subject</button>
                        <button id="modal-close-btn" class="admin-reg-course-modal-close-btn"><i class="fas fa-times"></i> Close</button>
                    </div>
                </div>
                
                <!-- Search and Filter Section -->
                <div class="admin-reg-course-modal-filters">
                    <div class="admin-reg-course-modal-filter-grid">
                        <div>
                            <label class="admin-reg-course-modal-field-label">Search</label>
                            <input id="course-search-input" class="admin-reg-course-modal-search" type="text" placeholder="Type a few words from the subject name or code..." autocomplete="off">
                        </div>
                        <div>
                            <label class="admin-reg-course-modal-field-label">Faculty</label>
                            <select id="course-faculty-filter" class="admin-reg-course-modal-select">
                                <option value="all">All Faculties</option>
                                ${allFacultyList.map(fac => `<option value="${fac}">${facultyLabels[fac] || fac}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div id="subject-quick-matches" class="admin-reg-subject-quick-matches"></div>
                    <div class="admin-reg-course-modal-count">
                        <strong id="course-count">${availableCourses.length}</strong> subjects available from Curriculum Library
                    </div>
                </div>
                
                <!-- Courses List -->
                <div class="admin-reg-course-modal-list-shell">
                    <div id="courses-list-container" class="admin-reg-course-modal-list">
    `;
    
    availableCourses.forEach(course => {
        const facultyCode = course.faculty || 'OTHER';

        // Get detailed info from Curriculum Library
        const prerequisites = course.cond || 'None';
        const antiRequisites = course.antireq || 'None';
        const semesterLabel = String(course.semester || 'TBD');
        const accessibleCourseName = escapeHtml(course.name || 'Untitled Subject');
        const accessibleCourseId = escapeHtml(course.id || 'Unknown');
        
        html += `
            <div class="course-item admin-reg-course-item" data-faculty="${facultyCode}" data-name="${escapeHtml(course.name || '')}" data-search="${escapeHtml(normalizeSubjectTitleKey(`${course.name || ''} ${course.id || ''} ${facultyLabels[facultyCode] || facultyCode}`))}"
                 data-module-id="${moduleId}" data-course-id="${course.id}" data-tab-type="${tabType}" role="button" tabindex="0" aria-label="Add ${accessibleCourseName} (${accessibleCourseId})">
                <div class="admin-reg-course-item-row">
                    <div class="admin-reg-course-item-main">
                        <!-- Subject Name & Code -->
                        <div class="admin-reg-course-item-title">${course.name}</div>
                        
                        <!-- Basic Info Row -->
                        <div class="admin-reg-course-item-meta">
                            <span class="admin-reg-course-item-code">${course.id}</span>
                            <span class="admin-reg-course-item-ects">${course.ects} ECTS</span>
                            <span class="admin-reg-course-item-semester">Semester ${escapeHtml(semesterLabel)}</span>
                        </div>
                        
                        <!-- Prerequisites -->
                        ${prerequisites !== 'None' ? `
                        <div class="admin-reg-course-item-prereq">
                            <strong>Prerequisite:</strong> ${prerequisites}
                        </div>
                        ` : ''}
                        
                        <!-- Anti-requisites -->
                        ${antiRequisites !== 'None' ? `
                        <div class="admin-reg-course-item-antireq">
                            <strong>Anti-requisite:</strong> ${antiRequisites}
                        </div>
                        ` : ''}
                    </div>
                    <div class="admin-reg-course-item-cta">
                        + Add Subject
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
                    </div>
                    <div id="no-results" class="admin-reg-no-results" hidden>
                        <i class="fas fa-inbox admin-reg-no-results-icon"></i>
                        <div class="admin-reg-no-results-copy">No matching subjects were found.</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('course-selection-modal-bg');
    if (modal && document.body.classList.contains('lux-route-admin-tools')) {
        modal.dataset.luxCourseModal = '1';
        modal.querySelector('.admin-reg-course-modal-card')?.setAttribute('data-lux-glass-root', '1');
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [modal] });
        }
    }

    // Now set up event listeners
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
            return `<button type="button" class="subject-quick-match admin-reg-subject-quick-match" data-search-fill="${escapeHtml(name)}">${escapeHtml(name)}${code ? ` - ${escapeHtml(code)}` : ''}${faculty ? ` - ${escapeHtml(faculty)}` : ''}</button>`;
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
                item.hidden = false;
                visibleCount++;
                visibleItems.push(item);
            } else {
                item.hidden = true;
            }
        });
        
        noResults.hidden = visibleCount !== 0;
        courseCount.textContent = visibleCount;
        updateQuickMatches(visibleItems, searchKey);
    };
    
    searchInput.addEventListener('input', applyFilter);
    facultyFilter.addEventListener('change', applyFilter);
    
    // Trigger initial universal filter
    applyFilter();
    
    // Add subject click handler
    const activateCourseItem = (item) => {
        if (!item) return;
        const cId = item.getAttribute('data-course-id');
        if (programType) {
            addCourseToProgramGroup(programType, programContext, cId);
        } else {
            const mId = item.getAttribute('data-module-id');
            const tType = item.getAttribute('data-tab-type');
            addCourseToModule(mId, cId, tType);
        }
        modal.remove();
    };

    courseItems.forEach(item => {
        item.addEventListener('click', () => {
            activateCourseItem(item);
        });
        item.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            activateCourseItem(item);
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
    const tabId = programType === 'concentration' ? 'conc' : (programType === 'minor' ? 'minor' : String(programType || adminRegActiveTab || 'conc'));
    const group = typeof ensureTrackProgramGroup === 'function'
        ? ensureTrackProgramGroup(tabId, context.programName, context.groupName)
        : null;

    if (!group) return;

    group.courses.push({
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

    const fac = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const bucket = KIU_STATE.registrationCMSByFaculty?.[fac];
    if (bucket && typeof syncAdminRegTrackLegacyMirrors === 'function') {
        syncAdminRegTrackLegacyMirrors(bucket);
    }
    queueAdminRegistrationStateSave();
    renderAdminRegistrationModules(tabId);
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
    queueAdminRegistrationStateSave();
    renderAdminRegistrationModules(tabType);
    alert('Subject added successfully.');
}

// REMOVE: sub-module/course from module
async function removeAdminRegSubModule(moduleId, subModuleId, tabType) {
    if (!confirm('Are you sure you want to remove this subject?')) return;

    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const module = modules.find(m => m.id === moduleId);

    if (module) {
        module.subModules = (module.subModules || []).filter(sm => sm.id !== subModuleId);
        if (typeof flushAdminRegistrationStateSave === 'function') {
            flushAdminRegistrationStateSave();
        } else {
            queueAdminRegistrationStateSave();
        }
        if (typeof flushPortalStateSync === 'function') {
            try {
                await flushPortalStateSync();
            } catch (error) {}
        }
        renderAdminRegistrationModules(tabType);
        const container = document.getElementById('admin-reg-content-container');
        if (container) {
            container.dataset.cmsRevision = getAdminRegistrationCmsRevision();
        }
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
            queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
            renderAdminRegistrationModules(tabType);
            alert('Subject rejected.');
        }
    }
}

// SAVE: All changes are auto-saved to localStorage via saveState() calls above
function saveAdminRegStructures() {
    queueAdminRegistrationStateSave();
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
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-inbox',
            title: 'No free credit modules yet',
            copy: 'Add a free-credit module to start collecting optional subjects.',
            classes: 'admin-reg-program-pane-empty'
        });
        return;
    }

    adminRegUiState.selectedFreeModule = module.id;
    const completed = getAssignedCourseEctsTotal(module.subModules || []);
    const progressLabel = formatEctsProgress(module.maxEcts || 0, completed);
    const subModules = module.subModules || [];

    pane.innerHTML = `
        <div class="admin-reg-program-pane-head">
            <div class="admin-reg-program-pane-main">
                <div class="admin-reg-program-pane-title">${escapeHtml(module.name || 'Free Credits')}</div>
                <div class="admin-reg-program-pane-copy">Free Credit Subjects</div>
            </div>
            <div class="admin-reg-program-pane-actions">
                <div class="admin-reg-program-pane-progress">ECTS: ${escapeHtml(progressLabel)}</div>
                <button type="button" data-admin-reg-edit-module="${escapeHtml(module.id)}" class="lux-ghost-btn admin-reg-program-pane-btn"><i class="fas fa-edit"></i></button>
                <button type="button" data-admin-reg-delete-module="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="lux-ghost-btn admin-reg-program-pane-btn admin-reg-program-pane-btn--danger"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-subject="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="lux-primary-btn admin-reg-program-pane-btn admin-reg-program-pane-btn--primary"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div class="admin-reg-program-subject-head">
            <div class="admin-reg-program-subject-head-number">#</div>
            <div class="admin-reg-program-subject-head-title">Subject Title / Module Title</div>
            <div class="admin-reg-program-subject-head-ects">ECTS</div>
            <div class="admin-reg-program-subject-head-meta">Prerequisite</div>
            <div class="admin-reg-program-subject-head-actions"></div>
        </div>
        <div class="admin-reg-program-subject-list">
            ${(subModules.length === 0 ? `
                ${buildAdminRegEmptyStateMarkup({
                    icon: 'fas fa-book-open',
                    title: 'No subjects assigned',
                    copy: 'Add subjects to this free-credit module using the button above.',
                    classes: 'admin-reg-program-subject-empty'
                })}
            ` : subModules.map((subMod, idx) => {
                const details = getAssignedCourseCurriculumDetails(subMod, currentFaculty);
                return `
                <div class="admin-reg-program-subject-row">
                    <div class="admin-reg-program-subject-number">${escapeHtml(subMod.number || idx + 1)}</div>
                    <div class="admin-reg-program-subject-main">
                        <div class="admin-reg-program-subject-title">${escapeHtml(subMod.name || 'Untitled Subject')}</div>
                        <div class="admin-reg-program-subject-courses">${escapeHtml((subMod.courses || []).join(', ') || '')}</div>
                    </div>
                    <div class="admin-reg-program-subject-ects">${escapeHtml(subMod.ects || '0')}</div>
                    <div class="admin-reg-program-subject-details">
                        <div>${escapeHtml(`Prerequisite: ${details.prerequisite}`)}</div>
                        ${details.antiRequisite ? `<div class="admin-reg-program-subject-detail">${escapeHtml(`Anti-requisite: ${details.antiRequisite}`)}</div>` : ''}
                        ${details.curriculumSemester ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--semester">${escapeHtml(details.curriculumSemester)}</div>` : ''}
                        ${details.studentAccess ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--access">${escapeHtml(`Student access: ${details.studentAccess}`)}</div>` : ''}
                    </div>
                    <div class="admin-reg-program-subject-actions">
                        <button type="button" data-admin-reg-edit-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="lux-ghost-btn admin-reg-program-subject-btn"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="free" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
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
        <div class="admin-reg-program-head admin-reg-program-head--large">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title admin-reg-program-head-title--large">Free Credits</div>
                <div class="admin-reg-program-head-copy admin-reg-program-head-copy--large">Manage free credit modules with the same split-panel layout used in Minor.</div>
            </div>
            <button type="button" data-admin-reg-add-module="free" class="lux-primary-btn admin-reg-program-add-btn admin-reg-program-add-btn--large"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div class="admin-reg-program-layout admin-reg-program-layout--wide">
            <div class="admin-reg-program-list-shell">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title admin-reg-program-list-title--strong">Free Credit Modules</div>
                    <span class="admin-reg-program-list-count">${modules.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-free-modules" class="admin-reg-program-list">
                    ${modules.length === 0 ? `<div class="admin-reg-program-list-placeholder">No free credit modules yet</div>` : modules.map(module => {
                        const active = module.id === adminRegUiState.selectedFreeModule;
                        const completed = getAssignedCourseEctsTotal(module.subModules || []);
                        const progress = formatEctsProgress(module.maxEcts || 0, completed);
                        return `
                            <label class="admin-reg-program-option admin-reg-program-option--wide${active ? ' is-active' : ''}">
                                <span class="admin-reg-program-option-row">
                                    <input type="radio" name="free-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} class="admin-reg-program-option-input" data-admin-reg-select-module="${escapeHtml(module.id)}" data-admin-reg-module-tab="free">
                                    <span class="admin-reg-program-option-title">${escapeHtml(module.name)}</span>
                                </span>
                                <span class="admin-reg-program-option-progress admin-reg-program-option-progress--pill">ECTS: ${escapeHtml(progress)}</span>
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
            queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
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
    queueAdminRegistrationStateSave();
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
            queueAdminRegistrationStateSave();
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
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-sitemap',
            title: 'Select a concentration program',
            copy: 'Choose a concentration program to manage its subject groups.',
            classes: 'admin-reg-program-pane-empty'
        });
        return;
    }

    const courseGroups = concCourseData[selected] || {};
    const groupNames = Object.keys(courseGroups);
    let html = `
        <div class="admin-reg-track-head">
            <div>
                <div class="admin-reg-track-head-title">${escapeHtml(selected)}</div>
                <div class="admin-reg-track-head-copy">Concentration Program Subjects</div>
            </div>
            <button id="conc-add-group-btn" type="button" data-admin-reg-add-conc-group="${escapeHtml(selected)}" class="lux-primary-btn admin-reg-track-add-btn"><i class="fas fa-plus"></i> Add Group</button>
        </div>
        <div class="admin-reg-track-groups">
    `;

    if (groupNames.length === 0) {
        html += buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-layer-group',
            title: 'No subject groups added yet',
            copy: 'Create the first concentration group to start assigning subjects.',
            classes: 'admin-reg-track-empty'
        });
    } else {
        groupNames.forEach((groupName) => {
            const group = courseGroups[groupName] || {};
            const groupKey = `conc:${selected}|${groupName}`;
            const isExpanded = expandedModules.has(groupKey);
            const progress = getTrackGroupProgress(group, getAssignedCourseEctsTotal(group.courses || []));
            const courses = group.courses || [];
            html += `
                <div class="admin-reg-track-group-card">
                    <div class="admin-reg-track-group-toggle" data-admin-reg-toggle-conc-group="${escapeHtml(groupKey)}">
                        <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} admin-reg-track-group-chevron"></i>
                        <div class="admin-reg-track-group-main">
                            <div class="admin-reg-track-group-title">${escapeHtml(groupName)}</div>
                            <div class="admin-reg-track-group-copy">${escapeHtml(selected)}</div>
                        </div>
                        <div class="admin-reg-track-group-progress">ECTS: ${escapeHtml(progress.label)}</div>
                        <div class="admin-reg-track-group-actions">
                            <button type="button" data-admin-reg-edit-conc-group="${escapeHtml(groupName)}" data-admin-reg-conc-program="${escapeHtml(selected)}" class="lux-ghost-btn admin-reg-track-group-btn"><i class="fas fa-edit"></i></button>
                            <button type="button" data-admin-reg-delete-conc-group="${escapeHtml(groupName)}" data-admin-reg-conc-program="${escapeHtml(selected)}" class="lux-ghost-btn admin-reg-track-group-btn admin-reg-track-group-btn--danger"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div class="admin-reg-track-group-body">
                            <div class="admin-reg-track-subject-head">
                                <div class="admin-reg-track-subject-head-number">#</div>
                                <div class="admin-reg-track-subject-head-title">Subject Title / Module Title</div>
                                <div class="admin-reg-track-subject-head-ects">ECTS</div>
                                <div class="admin-reg-track-subject-head-meta">Precondition / Anti-condition</div>
                                <div class="admin-reg-track-subject-head-actions"></div>
                            </div>
                            <div class="admin-reg-track-subject-list">
                                ${(courses.length === 0 ? `
                                    <div class="admin-reg-track-subject-empty">No subjects assigned</div>
                                ` : courses.map((course, idx) => `
                                    <div class="admin-reg-track-subject-row">
                                        <div class="admin-reg-track-subject-number">${escapeHtml(course.n || idx + 1)}</div>
                                        <div class="admin-reg-track-subject-main">
                                            <div class="admin-reg-track-subject-title">${escapeHtml(course.title || 'Untitled Subject')}</div>
                                            <div class="admin-reg-track-subject-code">${escapeHtml(course.n || '')}</div>
                                        </div>
                                        <div class="admin-reg-track-subject-ects">${escapeHtml(course.ects || '0')}</div>
                                        <div class="admin-reg-track-subject-details">
                                            <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div class="admin-reg-track-subject-detail">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--semester">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--access">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                                        </div>
                                        <div class="admin-reg-track-subject-actions">
                                            <button type="button" data-admin-reg-edit-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected)}" data-admin-reg-conc-group="${escapeHtml(groupName)}" class="lux-ghost-btn admin-reg-track-subject-btn"><i class="fas fa-edit"></i></button>
                                            <button type="button" data-admin-reg-delete-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected)}" data-admin-reg-conc-group="${escapeHtml(groupName)}" class="lux-ghost-btn admin-reg-track-subject-btn admin-reg-track-subject-btn--danger"><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                `).join(''))}
                            </div>
                            <div class="admin-reg-track-group-footer">
                                <button type="button" data-admin-reg-add-conc-subject="${escapeHtml(groupName)}" data-admin-reg-conc-program="${escapeHtml(selected)}" class="lux-primary-btn admin-reg-track-group-add-subject"><i class="fas fa-plus"></i> Add Subject</button>
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
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-arrow-left',
            title: 'Select a concentration group',
            copy: 'Choose a concentration group to manage its subjects.',
            classes: 'admin-reg-program-pane-empty'
        });
        return;
    }

    adminRegUiState.selectedConcGroup = `${selected.concKey}|${selected.groupName}`;
    const completed = getAssignedCourseEctsTotal(selected.group?.courses || []);
    const progressLabel = formatEctsProgress(selected.group?.maxEcts || 0, completed);
    const courses = selected.group?.courses || [];

    pane.innerHTML = `
        <div class="admin-reg-program-pane-head">
            <div class="admin-reg-program-pane-main">
                <div class="admin-reg-program-pane-title">${escapeHtml(selected.groupName)}</div>
                <div class="admin-reg-program-pane-copy">${escapeHtml(selected.concKey)}</div>
            </div>
            <div class="admin-reg-program-pane-actions">
                <div class="admin-reg-program-pane-progress">ECTS: ${escapeHtml(progressLabel)}</div>
                <button type="button" data-admin-reg-edit-conc-group="${escapeHtml(selected.groupName)}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" class="lux-ghost-btn admin-reg-program-pane-btn"><i class="fas fa-edit"></i></button>
                <button type="button" data-admin-reg-delete-conc-group="${escapeHtml(selected.groupName)}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" class="lux-ghost-btn admin-reg-program-pane-btn admin-reg-program-pane-btn--danger"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-conc-subject="${escapeHtml(selected.groupName)}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" class="lux-primary-btn admin-reg-program-pane-btn admin-reg-program-pane-btn--primary"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div class="admin-reg-program-subject-head">
            <div class="admin-reg-program-subject-head-number">#</div>
            <div class="admin-reg-program-subject-head-title">Subject Title / Module Title</div>
            <div class="admin-reg-program-subject-head-ects">ECTS</div>
            <div class="admin-reg-program-subject-head-meta">Precondition / Anti-condition</div>
            <div class="admin-reg-program-subject-head-actions"></div>
        </div>
        <div class="admin-reg-program-subject-list">
            ${(courses.length === 0 ? `
                ${buildAdminRegEmptyStateMarkup({
                    icon: 'fas fa-book-open',
                    title: 'No subjects assigned',
                    copy: 'Add subjects to this concentration group using the button above.',
                    classes: 'admin-reg-program-subject-empty'
                })}
            ` : courses.map((course, idx) => `
                <div class="admin-reg-program-subject-row">
                    <div class="admin-reg-program-subject-number">${escapeHtml(course.n || idx + 1)}</div>
                    <div class="admin-reg-program-subject-main">
                        <div class="admin-reg-program-subject-title">${escapeHtml(course.title || 'Untitled Subject')}</div>
                        <div class="admin-reg-program-subject-courses">${escapeHtml(course.n || '')}</div>
                    </div>
                    <div class="admin-reg-program-subject-ects">${escapeHtml(course.ects || '0')}</div>
                    <div class="admin-reg-program-subject-details">
                        <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div class="admin-reg-program-subject-detail">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--semester">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                        ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--access">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                    </div>
                    <div class="admin-reg-program-subject-actions">
                        <button type="button" data-admin-reg-edit-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" data-admin-reg-conc-group="${escapeHtml(selected.groupName)}" class="lux-ghost-btn admin-reg-program-subject-btn"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-conc-course="${idx}" data-admin-reg-conc-program="${escapeHtml(selected.concKey)}" data-admin-reg-conc-group="${escapeHtml(selected.groupName)}" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
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
        <div class="admin-reg-program-head admin-reg-program-head--large">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title admin-reg-program-head-title--large">Concentration</div>
                <div class="admin-reg-program-head-copy admin-reg-program-head-copy--large">Build concentration programs with the same nested cards, editable ECTS targets, and grouped course lists.</div>
            </div>
            <button type="button" data-admin-reg-add-conc-program="1" class="lux-primary-btn admin-reg-program-add-btn admin-reg-program-add-btn--large"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div class="admin-reg-program-layout admin-reg-program-layout--wide">
            <div class="admin-reg-program-list-shell">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title admin-reg-program-list-title--strong">Concentration Programs</div>
                    <span class="admin-reg-program-list-count">${concPrograms.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-conc-programs" class="admin-reg-program-list">
                    ${concPrograms.length === 0 ? `<div class="admin-reg-program-list-placeholder">No concentration programs yet</div>` : concPrograms.map(program => {
                        const checkedAttr = program === adminRegUiState.selectedConcProgram ? 'checked' : '';
                        return `
                            <label class="admin-reg-program-option admin-reg-program-option--wide${program === adminRegUiState.selectedConcProgram ? ' is-active' : ''}">
                                <span class="admin-reg-program-option-row">
                                    <input type="radio" name="conc-program" value="${escapeHtml(program)}" ${checkedAttr} data-admin-reg-select-conc-program="${escapeHtml(program)}" class="admin-reg-program-option-input">
                                    <span class="admin-reg-program-option-title">${escapeHtml(program)}</span>
                                </span>
                                <button type="button" data-admin-reg-delete-conc-program="${escapeHtml(program)}" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
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
        input.hidden = true;
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








