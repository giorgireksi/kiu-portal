/* Persistent state and role/page access helpers extracted from core.js. Source of truth remains root core.js compatibility bundle. */

function createFreshKiuState() {
    return JSON.parse(JSON.stringify(KIU_EMPTY_STATE));
}

let KIU_STATE = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null') || createFreshKiuState();
try {
    const requiredCleanupVersion = String(typeof MANUAL_TESTING_STATE_VERSION === 'number' ? MANUAL_TESTING_STATE_VERSION : 6);
    const persistedCleanupVersion = localStorage.getItem(REAL_TESTING_CLEANUP_FLAG);
    const stateCleanupVersion = String(KIU_STATE?.meta?.manualTestingSanitizedVersion || '');
    const shouldResetPersistedState = persistedCleanupVersion !== requiredCleanupVersion || stateCleanupVersion !== requiredCleanupVersion;
    if (shouldResetPersistedState) {
        KIU_STATE = createFreshKiuState();
        try {
            sessionStorage.removeItem(ACTIVE_SESSION_KEY);
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        } catch (sessionError) {}
        try {
            localStorage.removeItem('currentUserRole');
            localStorage.removeItem('KIU_DELETED_STAFF_REGISTRY');
        } catch (storageError) {}
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(KIU_STATE));
        localStorage.setItem(REAL_TESTING_CLEANUP_FLAG, requiredCleanupVersion);
    }
} catch (e) {
    console.warn('Could not reset persisted initial state.', e);
}

let kiuUiRefreshQueued = false;
let kiuUiRefreshSnapshot = null;
const KIU_DELETED_STAFF_REGISTRY_KEY = 'KIU_DELETED_STAFF_REGISTRY';
const KIU_DISPLAY_TEXT_REPAIR_VERSION = 2;
let kiuDeletedStaffRegistryCache = null;
let kiuCanonicalStateInProgress = false;

function shouldRepairDisplayText(raw) {
    const input = String(raw || '');
    return ((typeof looksLikeMojibake === 'function' && looksLikeMojibake(input))
        || /(?:Ã¡Æ|Ã.|Â.|Æ.|â€|â€™|â€œ|â€)/.test(input)
        || /[\u10A0-\u10FF]/.test(input));
}

function repairDisplayTextValue(value, fallback = '') {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return String(fallback || '').trim();
    const shouldRepair = shouldRepairDisplayText(raw);
    if (!shouldRepair) return raw;
    let cleaned = raw;
    try {
        if (typeof cleanupEncodingArtifacts === 'function') cleaned = cleanupEncodingArtifacts(cleaned);
    } catch (error) {}
    try {
        if (typeof toEnglishText === 'function') cleaned = toEnglishText(cleaned);
    } catch (error) {}
    cleaned = String(cleaned == null ? '' : cleaned).trim();
    return cleaned || raw || String(fallback || '').trim();
}

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

function captureNamedScrollSnapshot(root = document) {
    if (!root || !root.querySelectorAll) return {};
    const snapshot = {};
    root.querySelectorAll('[data-preserve-scroll-key]').forEach(el => {
        const key = el.dataset.preserveScrollKey;
        if (!key) return;
        snapshot[key] = {
            top: el.scrollTop || 0,
            left: el.scrollLeft || 0
        };
    });
    return snapshot;
}

function restoreNamedScrollSnapshot(snapshot, root = document) {
    if (!snapshot || !root || !root.querySelectorAll) return;
    Object.entries(snapshot).forEach(([key, pos]) => {
        const el = root.querySelector(`[data-preserve-scroll-key="${key}"]`);
        if (!el) return;
        el.scrollTop = Number(pos?.top || 0);
        el.scrollLeft = Number(pos?.left || 0);
    });
}

function isScrollableSnapshotTarget(el) {
    if (!el || typeof window.getComputedStyle !== 'function') return false;
    const style = window.getComputedStyle(el);
    const overflowY = style.overflowY || style.overflow;
    const overflowX = style.overflowX || style.overflow;
    const canScrollY = overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay';
    const canScrollX = overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'overlay';
    if (!canScrollY && !canScrollX) return false;
    return el.scrollTop > 0 || el.scrollLeft > 0 || el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
}

function captureScrollableNodes(root) {
    // Full-tree scroll scans were a major click-latency source because every saveState()
    // called querySelectorAll('*') and getComputedStyle() across the whole page.
    // Use explicit data-preserve-scroll-key snapshots instead.
    return [];
}

function restoreScrollableNodes(root, snapshot) {
    return;
}

function captureUiScrollSnapshot() {
    const adminContainer = document.getElementById('admin-reg-content-container');
    return {
        _capturedAt: performance.now(),
        pageX: window.scrollX || window.pageXOffset || 0,
        pageY: window.scrollY || window.pageYOffset || 0,
        adminScrollTop: adminContainer ? adminContainer.scrollTop : 0,
        adminScrollLeft: adminContainer ? adminContainer.scrollLeft : 0,
        namedScrolls: captureNamedScrollSnapshot(document),
        scrollNodes: captureScrollableNodes(document.body)
    };
}

function restoreUiScrollSnapshot(snapshot) {
    if (!snapshot) return;
    /* PERF: Only restore scroll if the snapshot is very recent (< 50ms old).
       This prevents the scroll from fighting the user when saveState()
       triggers a background re-render while the user is actively scrolling. */
    if (snapshot._capturedAt && (performance.now() - snapshot._capturedAt) > 50) return;
    const pageX = snapshot.pageX || 0;
    const pageY = snapshot.pageY || 0;
    const adminContainer = document.getElementById('admin-reg-content-container');
    if (adminContainer) {
        adminContainer.scrollTop = snapshot.adminScrollTop || 0;
        adminContainer.scrollLeft = snapshot.adminScrollLeft || 0;
    }
    restoreNamedScrollSnapshot(snapshot.namedScrolls, document);
    restoreScrollableNodes(document.body, snapshot.scrollNodes);
    if (Math.abs((window.scrollY || window.pageYOffset || 0) - pageY) > 2 || Math.abs((window.scrollX || window.pageXOffset || 0) - pageX) > 2) {
        window.scrollTo(pageX, pageY);
    }
}

function rerenderAdminRegistrationModulesPreservingScroll(tabType) {
    const snapshot = captureUiScrollSnapshot();
    renderAdminRegistrationModules(tabType);
    requestAnimationFrame(() => restoreUiScrollSnapshot(snapshot));
}

function normalizeScheduleGroupForState(subjectId, group) {
    if (typeof normalizeScheduleGroup === 'function') {
        return normalizeScheduleGroup(subjectId, group);
    }
    if (!group) return null;
    const rawTime = String(group.time || group.startTime || '09:00');
    const timeMatch = rawTime.match(/(\d{1,2}):(\d{2})/);
    const startHour = timeMatch ? Number(timeMatch[1]) : 9;
    const startMinute = timeMatch ? Number(timeMatch[2]) : 0;
    const durationMinutes = Number(String(group.duration || '110').match(/\d+/)?.[0] || 110);
    const totalMinutes = (startHour * 60) + startMinute + durationMinutes;
    const endHour = String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0');
    const endMinute = String(totalMinutes % 60).padStart(2, '0');
    return {
        ...group,
        id: group.id || group.name || `${subjectId || 'GROUP'}-AUTO`,
        name: group.name || group.id || 'Group',
        faculty: String(group.faculty || '').trim().toUpperCase() || 'ECON',
        duration: group.duration || '110min',
        time: rawTime,
        endTime: group.endTime || `${endHour}:${endMinute}`,
        room: group.room || '',
        sessionType: group.sessionType || group.classType || group.type || 'lecture',
        registered: Number(group.registered || 0),
        capacity: Number(group.capacity || 0),
        weekOverrides: group.weekOverrides && typeof group.weekOverrides === 'object' ? group.weekOverrides : {}
    };
}

function queueKiuUiRefresh(snapshot) {
    if (snapshot) kiuUiRefreshSnapshot = snapshot;
    if (kiuUiRefreshQueued) return;
    kiuUiRefreshQueued = true;
    requestAnimationFrame(() => {
        kiuUiRefreshQueued = false;
        try {
            const snap = kiuUiRefreshSnapshot || captureUiScrollSnapshot();
            kiuUiRefreshSnapshot = null;
            const pageX = snap.pageX || 0;
            const pageY = snap.pageY || 0;
            const adminContainer = document.getElementById('admin-reg-content-container');
            const adminScrollTop = snap.adminScrollTop || 0;
            const adminScrollLeft = snap.adminScrollLeft || 0;

            if (adminContainer && typeof renderAdminRegistrationModules === 'function') {
                const fac = normalizeFacultyCode(
                    ((typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '') || localStorage.getItem('currentFaculty') || 'ECON'),
                    'ECON'
                );
                adminContainer.dataset.cmsFaculty = fac;
                if (typeof bindFacultyRegistrationCmsData === 'function') {
                    bindFacultyRegistrationCmsData(fac);
                }
                // Registration workspace rerenders are explicit. Save-driven rerenders here
                // were rebuilding the active panel under the cursor and causing flicker.
            }
            /* FIX: Only restore admin container scroll, NOT window scroll.
               window.scrollTo during background saves causes scroll-fighting/shaking. */
            if (adminContainer) {
                adminContainer.scrollTop = adminScrollTop;
                adminContainer.scrollLeft = adminScrollLeft;
            }
            restoreNamedScrollSnapshot(snap.namedScrolls, document);
        } catch (err) {
            console.warn('UI refresh skipped:', err);
        }
    });
}
function saveState() {
    const uiScrollSnapshot = captureUiScrollSnapshot();
    ensureCanonicalState();
    const persistedRegistrationCms = (() => {
        const legacy = (KIU_STATE.registrationCMS && typeof KIU_STATE.registrationCMS === 'object')
            ? KIU_STATE.registrationCMS
            : {};
        const concData = typeof concCourseData !== 'undefined'
            ? concCourseData
            : (legacy.concCourseData || {});
        const minorData = typeof minorProgramData !== 'undefined'
            ? minorProgramData
            : (legacy.minorProgramData || {});
        return {
            concCourseData: concData || {},
            minorProgramData: minorData || {}
        };
    })();
    const persisted = {
        ...KIU_STATE,
        adminProgramStructures: KIU_STATE.adminProgramStructures || {},
        registrationCMSByFaculty: KIU_STATE.registrationCMSByFaculty || {},
        registrationCMS: persistedRegistrationCms
    };
    delete persisted.domain;
    localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persisted));
    if (typeof queuePortalStateSync === 'function') queuePortalStateSync('saveState');
    queueKiuUiRefresh(uiScrollSnapshot);
    setTimeout(() => {
        if (typeof renderPortalNotificationChrome === 'function') renderPortalNotificationChrome();
    }, 0);
}

let adminExamDraftByFaculty = {};
let adminExamUiByFaculty = {};
let adminOrdersUiByFaculty = {};
let recipientOrdersUiByUser = {};
let currentLmsQuizCourseKey = '';
let lmsQuizUiByResourceKey = {};

function makeAdminExamEntityId(prefix = 'exam') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAdminQuizQuestion() {
    return {
        id: makeAdminExamEntityId('question'),
        type: 'mcq',
        text: '',
        score: 1,
        optionCount: 4,
        options: ['', '', '', ''],
        correctOption: 0,
        expectedAnswer: ''
    };
}

function ensureAdminExamState(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    KIU_STATE.adminExamsByFaculty = KIU_STATE.adminExamsByFaculty || {};
    KIU_STATE.adminExamsByFaculty[normalizedFaculty] = KIU_STATE.adminExamsByFaculty[normalizedFaculty] || { quizzes: [] };
    KIU_STATE.adminExamsByFaculty[normalizedFaculty].quizzes = Array.isArray(KIU_STATE.adminExamsByFaculty[normalizedFaculty].quizzes)
        ? KIU_STATE.adminExamsByFaculty[normalizedFaculty].quizzes
        : [];
    return KIU_STATE.adminExamsByFaculty[normalizedFaculty];
}

function createAdminQuizDraft(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const lmsContext = typeof resolveActiveLmsQuizContext === 'function'
        ? resolveActiveLmsQuizContext(currentLmsQuizCourseKey, normalizedFaculty)
        : null;
    const lmsSubject = lmsContext?.subject || null;
    const lmsGroup = lmsContext?.group || null;
    const firstSubject = (getActiveCurriculum(normalizedFaculty) || [])
        .slice()
        .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')))[0];
    const selectedSubject = lmsSubject || firstSubject || null;
    const firstGroup = lmsGroup || getAdminQuizGroupsForSubject(selectedSubject?.id || '', normalizedFaculty)[0] || null;
    return {
        editingQuizId: null,
        title: '',
        subjectId: selectedSubject?.id || (lmsContext?.courseId || ''),
        subjectName: selectedSubject?.name || (lmsContext?.subject?.name || lmsContext?.courseId || ''),
        assignedGroupId: firstGroup?.id || (lmsContext?.groupId || lmsContext?.courseId || ''),
        assessmentType: 'quiz',
        weekLabel: lmsContext?.resourceKey ? (lmsContext.weeks?.[0] || 'Week 1') : '',
        availableFrom: '',
        availableUntil: '',
        durationMinutes: 20,
        status: lmsContext?.resourceKey ? 'draft' : 'published',
        isPublished: lmsContext?.resourceKey ? false : true,
        publishedAt: null,
        publishedBy: '',
        allowedStudentIds: [],
        attendanceMode: 'manual-access-list',
        lockedAfterPublish: true,
        attendanceRequired: true,
        instructions: '',
        questions: [createAdminQuizQuestion()]
    };
}

function normalizeExamSessionStatus(status = 'draft') {
    const normalized = String(status || 'draft').trim().toLowerCase();
    return ['draft', 'waiting', 'live', 'closed'].includes(normalized) ? normalized : 'draft';
}

function normalizeExamSessionAttendanceMap(map = {}) {
    const source = map && typeof map === 'object' ? map : {};
    return Object.fromEntries(
        Object.entries(source).map(([studentId, entry]) => {
            const value = entry && typeof entry === 'object'
                ? entry
                : { status: String(entry || '') };
            return [
                String(studentId),
                {
                    status: String(value.status || ''),
                    verifiedAt: value.verifiedAt || null,
                    verifiedBy: String(value.verifiedBy || '')
                }
            ];
        })
    );
}

function normalizeExamSessionRecord(session = {}) {
    return {
        id: String(session.id || makeAdminExamEntityId('exam-session')),
        title: String(session.title || session.quizTitle || 'Lab Exam Session'),
        quizId: String(session.quizId || ''),
        templateQuizId: String(session.templateQuizId || ''),
        quizTitle: String(session.quizTitle || ''),
        resourceKey: String(session.resourceKey || ''),
        courseId: String(session.courseId || ''),
        groupId: String(session.groupId || ''),
        faculty: normalizeFacultyCode(session.faculty || getCurrentFaculty(), 'ECON'),
        status: normalizeExamSessionStatus(session.status || 'draft'),
        allowedStudentIds: Array.isArray(session.allowedStudentIds) ? session.allowedStudentIds.map(id => String(id)) : [],
        blockedStudentIds: Array.isArray(session.blockedStudentIds) ? session.blockedStudentIds.map(id => String(id)) : [],
        attendanceByStudentId: normalizeExamSessionAttendanceMap(session.attendanceByStudentId),
        startedAt: session.startedAt || null,
        endsAt: session.endsAt || null,
        durationMinutes: Math.max(1, parseInt(session.durationMinutes, 10) || 20),
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: session.updatedAt || new Date().toISOString(),
        monitoringSummary: session.monitoringSummary && typeof session.monitoringSummary === 'object'
            ? {
                allowedCount: Math.max(0, parseInt(session.monitoringSummary.allowedCount, 10) || 0),
                presentCount: Math.max(0, parseInt(session.monitoringSummary.presentCount, 10) || 0),
                blockedCount: Math.max(0, parseInt(session.monitoringSummary.blockedCount, 10) || 0),
                inProgressCount: Math.max(0, parseInt(session.monitoringSummary.inProgressCount, 10) || 0),
                submittedCount: Math.max(0, parseInt(session.monitoringSummary.submittedCount, 10) || 0),
                alertCount: Math.max(0, parseInt(session.monitoringSummary.alertCount, 10) || 0)
            }
            : {
                allowedCount: 0,
                presentCount: 0,
                blockedCount: 0,
                inProgressCount: 0,
                submittedCount: 0,
                alertCount: 0
            }
    };
}

function ensureExamSessionStore() {
    KIU_STATE.examSessions = KIU_STATE.examSessions && typeof KIU_STATE.examSessions === 'object'
        ? KIU_STATE.examSessions
        : {};
    Object.keys(KIU_STATE.examSessions).forEach(sessionId => {
        KIU_STATE.examSessions[sessionId] = normalizeExamSessionRecord(KIU_STATE.examSessions[sessionId]);
    });
    return KIU_STATE.examSessions;
}

function getExamSessionById(sessionId) {
    const targetId = String(sessionId || '');
    if (!targetId) return null;
    return ensureExamSessionStore()[targetId] || null;
}

function getExamSessionsForFaculty(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    return Object.values(ensureExamSessionStore())
        .filter(session => normalizeFacultyCode(session.faculty || normalizedFaculty, normalizedFaculty) === normalizedFaculty)
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function getAdminQuizDraft(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    if (!adminExamDraftByFaculty[normalizedFaculty]) {
        adminExamDraftByFaculty[normalizedFaculty] = createAdminQuizDraft(normalizedFaculty);
    }
    const draft = adminExamDraftByFaculty[normalizedFaculty];
    if (!Array.isArray(draft.questions) || draft.questions.length === 0) {
        draft.questions = [createAdminQuizQuestion()];
    }
    const subjects = getActiveCurriculum(normalizedFaculty) || [];
    const lmsContext = typeof resolveActiveLmsQuizContext === 'function'
        ? resolveActiveLmsQuizContext(currentLmsQuizCourseKey, normalizedFaculty)
        : null;
    const isLmsEmbedded = Boolean(lmsContext?.resourceKey);
    if (subjects.length > 0) {
        const matchedSubject = subjects.find(subject => canonicalCourseKey(subject?.id) === canonicalCourseKey(draft.subjectId))
            || subjects.find(subject => normalizeSubjectTitleKey(subject?.name) === normalizeSubjectTitleKey(draft.subjectName))
            || (isLmsEmbedded ? null : subjects[0]);
        if (matchedSubject) {
            draft.subjectId = matchedSubject.id || draft.subjectId;
            draft.subjectName = matchedSubject.name || draft.subjectName;
        } else if (isLmsEmbedded) {
            draft.subjectId = draft.subjectId || lmsContext.subject?.id || lmsContext.courseId || currentLmsQuizCourseKey;
            draft.subjectName = draft.subjectName || lmsContext.subject?.name || lmsContext.courseId || currentLmsQuizCourseKey;
        }
    } else if (isLmsEmbedded) {
        draft.subjectId = draft.subjectId || lmsContext.subject?.id || lmsContext.courseId || currentLmsQuizCourseKey;
        draft.subjectName = draft.subjectName || lmsContext.subject?.name || lmsContext.courseId || currentLmsQuizCourseKey;
    }
    const groups = getAdminQuizGroupsForSubject(draft.subjectId, normalizedFaculty);
    if (isLmsEmbedded) {
        draft.assignedGroupId = lmsContext.group?.id || lmsContext.groupId || draft.assignedGroupId;
        if (!draft.weekLabel) {
            draft.weekLabel = lmsContext.weeks?.[0] || 'Week 1';
        }
    } else if (groups.length > 0) {
        if (!groups.some(group => canonicalCourseKey(group.id) === canonicalCourseKey(draft.assignedGroupId))) {
            draft.assignedGroupId = groups[0].id;
        }
    }
    return draft;
}

function getAvailableGroupsForSubject(subjectId) {
    const directKey = String(subjectId || '').trim();
    if (!directKey) return [];
    const directGroups = KIU_STATE.availableGroups?.[directKey];
    if (Array.isArray(directGroups)) return directGroups;
    const canonicalKey = canonicalCourseKey(directKey);
    const matchedKey = Object.keys(KIU_STATE.availableGroups || {}).find(key => canonicalCourseKey(key) === canonicalKey);
    const matchedGroups = matchedKey ? KIU_STATE.availableGroups?.[matchedKey] : [];
    return Array.isArray(matchedGroups) ? matchedGroups : [];
}

function getAdminQuizGroupsForSubject(subjectId, faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const groups = getAvailableGroupsForSubject(subjectId);
    return groups
        .filter(group => normalizeFacultyCode(group?.faculty || deriveFacultyFromSubjectId(subjectId), normalizedFaculty) === normalizedFaculty)
        .slice()
        .sort((a, b) => String(a?.name || a?.id || '').localeCompare(String(b?.name || b?.id || ''), undefined, { numeric: true, sensitivity: 'base' }));
}

function setAdminQuizDraftAssignedGroup(groupId) {
    const draft = getAdminQuizDraft();
    draft.assignedGroupId = String(groupId || '');
    rerenderAdminExamSectionPreservingScroll();
}

function ensureAdminExamUiState(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    adminExamUiByFaculty[normalizedFaculty] = adminExamUiByFaculty[normalizedFaculty] || {
        activeQuestionId: null,
        navigatorScrollTop: 0,
        dragQuestionId: null,
        activeSessionId: null,
        sessionTemplateQuizId: '',
        sessionTargetGroupId: ''
    };
    return adminExamUiByFaculty[normalizedFaculty];
}

function captureAdminExamScrollSnapshot(faculty = getCurrentFaculty()) {
    const uiState = ensureAdminExamUiState(faculty);
    const navigator = document.getElementById('admin-exam-question-nav');
    if (navigator) {
        uiState.navigatorScrollTop = navigator.scrollTop || 0;
    }
    return {
        x: window.scrollX || window.pageXOffset || 0,
        y: window.scrollY || window.pageYOffset || 0,
        navigatorScrollTop: uiState.navigatorScrollTop || 0
    };
}

function restoreAdminExamScrollSnapshot(snapshot, faculty = getCurrentFaculty()) {
    if (!snapshot) return;
    const uiState = ensureAdminExamUiState(faculty);
    uiState.navigatorScrollTop = snapshot.navigatorScrollTop || 0;
    const navigator = document.getElementById('admin-exam-question-nav');
    if (navigator) {
        navigator.scrollTop = uiState.navigatorScrollTop;
    }
    window.scrollTo(snapshot.x || 0, snapshot.y || 0);
}

function rerenderAdminExamSectionPreservingScroll(faculty = getCurrentFaculty()) {
    const snapshot = captureAdminExamScrollSnapshot(faculty);
    renderAdminExamSection();
    requestAnimationFrame(() => restoreAdminExamScrollSnapshot(snapshot, faculty));
}

function getActiveAdminQuizQuestion(faculty = getCurrentFaculty()) {
    const draft = getAdminQuizDraft(faculty);
    const uiState = ensureAdminExamUiState(faculty);
    const existing = draft.questions.find(question => question.id === uiState.activeQuestionId);
    if (existing) return existing;
    uiState.activeQuestionId = draft.questions[0]?.id || null;
    return draft.questions[0] || null;
}

function setActiveAdminQuizQuestion(questionId, faculty = getCurrentFaculty()) {
    const draft = getAdminQuizDraft(faculty);
    if (!draft.questions.some(question => question.id === questionId)) return;
    ensureAdminExamUiState(faculty).activeQuestionId = questionId;
}

function clampAdminQuizQuestionIndex(index, faculty = getCurrentFaculty()) {
    const draft = getAdminQuizDraft(faculty);
    return Math.max(0, Math.min(Number(index) || 0, draft.questions.length));
}

function insertAdminQuizQuestionAt(index, faculty = getCurrentFaculty()) {
    const draft = getAdminQuizDraft(faculty);
    const question = createAdminQuizQuestion();
    const safeIndex = clampAdminQuizQuestionIndex(index, faculty);
    draft.questions.splice(safeIndex, 0, question);
    setActiveAdminQuizQuestion(question.id, faculty);
    rerenderAdminExamSectionPreservingScroll(faculty);
}

function insertAdminQuizQuestionRelative(questionId, position = 'after', faculty = getCurrentFaculty()) {
    const draft = getAdminQuizDraft(faculty);
    const currentIndex = draft.questions.findIndex(question => question.id === questionId);
    if (currentIndex < 0) return;
    const insertIndex = position === 'before' ? currentIndex : currentIndex + 1;
    insertAdminQuizQuestionAt(insertIndex, faculty);
}

function moveAdminQuizQuestion(sourceQuestionId, targetQuestionId, faculty = getCurrentFaculty()) {
    const draft = getAdminQuizDraft(faculty);
    const sourceIndex = draft.questions.findIndex(question => question.id === sourceQuestionId);
    const targetIndex = draft.questions.findIndex(question => question.id === targetQuestionId);
    if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return;
    const [movedQuestion] = draft.questions.splice(sourceIndex, 1);
    draft.questions.splice(targetIndex, 0, movedQuestion);
    setActiveAdminQuizQuestion(movedQuestion.id, faculty);
    rerenderAdminExamSectionPreservingScroll(faculty);
}

function startAdminQuizQuestionDrag(event, questionId, faculty = getCurrentFaculty()) {
    ensureAdminExamUiState(faculty).dragQuestionId = questionId;
    if (event?.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', questionId);
    }
}

function allowAdminQuizQuestionDrop(event) {
    if (event?.preventDefault) event.preventDefault();
}

function endAdminQuizQuestionDrag(faculty = getCurrentFaculty()) {
    ensureAdminExamUiState(faculty).dragQuestionId = null;
}

function dropAdminQuizQuestionOnTarget(event, targetQuestionId, faculty = getCurrentFaculty()) {
    if (event?.preventDefault) event.preventDefault();
    const uiState = ensureAdminExamUiState(faculty);
    const draggedQuestionId = uiState.dragQuestionId
        || event?.dataTransfer?.getData('text/plain')
        || null;
    if (!draggedQuestionId) return;
    endAdminQuizQuestionDrag(faculty);
    moveAdminQuizQuestion(draggedQuestionId, targetQuestionId, faculty);
}

function syncAdminQuizDraftSubject(draft, faculty = getCurrentFaculty()) {
    if (!draft) return;
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const lmsContext = typeof resolveActiveLmsQuizContext === 'function'
        ? resolveActiveLmsQuizContext(currentLmsQuizCourseKey, normalizedFaculty)
        : null;
    if (lmsContext?.resourceKey) {
        draft.subjectId = lmsContext.subject?.id || lmsContext.courseId || draft.subjectId;
        draft.subjectName = lmsContext.subject?.name || lmsContext.courseId || draft.subjectName;
        draft.assignedGroupId = lmsContext.group?.id || lmsContext.groupId || draft.assignedGroupId;
        if (!draft.weekLabel) {
            draft.weekLabel = lmsContext.weeks?.[0] || 'Week 1';
        }
        return;
    }
    const subjects = getActiveCurriculum(normalizedFaculty) || [];
    const matchedSubject = subjects.find(subject => canonicalCourseKey(subject?.id) === canonicalCourseKey(draft.subjectId))
        || subjects.find(subject => normalizeSubjectTitleKey(subject?.name) === normalizeSubjectTitleKey(draft.subjectName));
    if (matchedSubject) {
        draft.subjectId = matchedSubject.id;
        draft.subjectName = matchedSubject.name;
    }
    const groups = getAdminQuizGroupsForSubject(draft.subjectId, normalizedFaculty);
    if (groups.length > 0) {
        if (!groups.some(group => canonicalCourseKey(group.id) === canonicalCourseKey(draft.assignedGroupId))) {
            draft.assignedGroupId = groups[0].id;
        }
    } else if (!currentLmsQuizCourseKey) {
        draft.assignedGroupId = '';
    }
}

function mergeUniqueById(items) {
    const byId = new Map();
    (items || []).forEach(item => {
        if (!item || !item.id) return;
        byId.set(item.id, { ...(byId.get(item.id) || {}), ...item });
    });
    return [...byId.values()];
}

function collectFacultyMembers(facultyProfiles) {
    const members = [];
    Object.entries(facultyProfiles || {}).forEach(([facultyCode, profile]) => {
        ['students', 'professors', 'tas'].forEach(groupKey => {
            (profile[groupKey] || []).forEach(member => {
                const role = groupKey === 'students'
                    ? USER_ROLES.STUDENT
                    : groupKey === 'professors'
                        ? USER_ROLES.PROFESSOR
                        : USER_ROLES.TA;
                members.push({
                    ...member,
                    role,
                    faculty: facultyCode,
                    facultyCode
                });
            });
        });
    });
    return members;
}

function resolveUserFromName(usersById, rawName) {
    if (!rawName) return null;
    const normalized = String(rawName).trim().toLowerCase();
    return Object.values(usersById || {}).find(user => {
        const candidates = [user.name, user.nameEn, user.email].filter(Boolean).map(value => String(value).trim().toLowerCase());
        return candidates.includes(normalized);
    }) || null;
}

function buildCanonicalDomain(state) {
    const users = mergeUniqueById(state.users || []);
    const usersById = Object.fromEntries(users.map(user => [user.id, {
        ...user,
        facultyId: user.facultyCode || user.faculty || null,
        activeStatus: user.status || 'Active'
    }]));
    const usersByFaculty = users.reduce((acc, user) => {
        const facultyCode = normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '');
        if (!facultyCode) return acc;
        if (!acc[facultyCode]) acc[facultyCode] = [];
        acc[facultyCode].push(user);
        return acc;
    }, {});
    const usersByFacultyRole = users.reduce((acc, user) => {
        const facultyCode = normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '');
        const role = user?.role || 'unknown';
        if (!facultyCode) return acc;
        if (!acc[facultyCode]) acc[facultyCode] = {};
        if (!acc[facultyCode][role]) acc[facultyCode][role] = [];
        acc[facultyCode][role].push(user);
        return acc;
    }, {});

    const rawSubjects = [];
    Object.entries(state.facultyProfiles || {}).forEach(([facultyCode, profile]) => {
        (profile.curriculum || []).forEach(subject => rawSubjects.push({ ...subject, faculty: subject.faculty || facultyCode }));
    });
    (state.curriculum || []).forEach(subject => rawSubjects.push(subject));
    const subjectList = mergeUniqueById(rawSubjects).sort((a, b) => {
        const semDiff = (parseInt(a.semester, 10) || 99) - (parseInt(b.semester, 10) || 99);
        if (semDiff !== 0) return semDiff;
        return String(a.name || '').localeCompare(String(b.name || ''));
    });
    const subjectsById = Object.fromEntries(subjectList.map(subject => [subject.id, {
        ...subject,
        facultyId: subject.faculty || null,
        semesterNumber: subject.semester || null,
        prerequisites: subject.cond || 'None',
        antirequisites: subject.antireq || 'None'
    }]));

    const sectionsById = {};
    const sectionsBySubject = {};
    Object.entries(state.availableGroups || {}).forEach(([subjectId, groups]) => {
        groups.forEach(group => {
            const subject = subjectsById[subjectId] || null;
            const professor = resolveUserFromName(usersById, group.prof);
            const ta = resolveUserFromName(usersById, group.ta);
            const sectionKey = `${subjectId}::${group.id}`;
            const section = {
                ...group,
                sectionKey,
                subjectId,
                termId: `${group.faculty || subject?.facultyId || 'GEN'}-S${group.semester || state.activeSemester || 1}`,
                facultyId: group.faculty || subject?.facultyId || null,
                professorId: professor?.id || null,
                taIds: ta ? [ta.id] : [],
                scheduleSlots: [{
                    day: group.day,
                    time: group.time,
                    duration: group.duration || '110min',
                    endTime: group.endTime || null
                }],
                capacity: group.capacity || 40
            };
            sectionsById[sectionKey] = section;
            if (!sectionsBySubject[subjectId]) sectionsBySubject[subjectId] = [];
            sectionsBySubject[subjectId].push(section);
        });
    });

    const enrollmentsByStudent = {};
    Object.entries(state.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
        enrollmentsByStudent[studentId] = (schedule || []).map(item => ({
            studentId,
            sectionKey: `${item.courseId}::${item.groupId}`,
            subjectId: item.courseId,
            sectionId: item.groupId,
            status: 'registered',
            registeredAt: item.registeredAt || null
        }));
    });

    const holdsByStudent = {};
    Object.entries(state.tuitionBalances || {}).forEach(([studentId, amount]) => {
        holdsByStudent[studentId] = {
            studentId,
            type: 'financial',
            amount: parseFloat(amount) || 0,
            active: (parseFloat(amount) || 0) > 0,
            reason: 'Outstanding tuition balance'
        };
    });

    const gradeRecords = {};
    Object.entries(state.studentGrades || {}).forEach(([rosterId, roster]) => {
        gradeRecords[rosterId] = (roster || []).map(record => ({
            enrollmentId: `${rosterId}::${record.id}`,
            studentId: record.id,
            assessment: {
                q1: record.q1 || 0,
                qa: record.qa || 0,
                mid: record.mid || 0,
                final: record.final || 0
            },
            finalScore: record.final || 0,
            letterGrade: record.letter || null,
            lockedBy: record.lockedBy || null
        }));
    });

    return {
        usersById,
        usersByFaculty,
        usersByFacultyRole,
        usersByRole: Object.values(USER_ROLES).reduce((acc, role) => {
            acc[role] = users.filter(user => user.role === role);
            return acc;
        }, {}),
        subjectsById,
        subjectList,
        sectionsById,
        sectionsBySubject,
        enrollmentsByStudent,
        holdsByStudent,
        gradeRecords,
        documentRequests: (state.chancelleryRequests || []).map(request => ({
            ...request,
            workflowStep: request.currentStep || 0
        })),
        orders: (state.chancelleryRequests || []).map(request => ({
            id: request.id,
            type: request.type,
            status: request.status,
            workflowStep: request.currentStep || 0,
            approvals: request.steps || [],
            generatedFiles: []
        })),
        libraryResources: Object.entries(state.syllabus || {}).flatMap(([subjectId, files]) => (files || []).map(file => ({
            subjectId,
            semesterNumber: subjectsById[subjectId]?.semesterNumber || state.activeSemester || 1,
            type: 'syllabus',
            visibilityRole: [USER_ROLES.STUDENT, USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN],
            file
        }))),
        permissions: PERMISSION_MATRIX
    };
}

function getCurrentUserFromState(state) {
    const activeUserId = String(state?.auth?.activeUserId || '').trim();
    const users = Array.isArray(state?.users) ? state.users : [];
    const userById = state?.domain?.usersById || {};
    const resolvedActiveUser = activeUserId
        ? (userById[activeUserId] || users.find(user => String(user?.id || '') === activeUserId) || null)
        : null;
    if (resolvedActiveUser && String(resolvedActiveUser?.role || '').trim().toLowerCase() !== USER_ROLES.ADMIN) {
        return resolvedActiveUser;
    }

    const storedAuthenticatedRole = (() => {
        try {
            const parsed = JSON.parse(localStorage.getItem('KIU_AUTH_STATE') || 'null');
            return String(parsed?.role || '').trim().toLowerCase();
        } catch (error) {
            return '';
        }
    })();
    const storedImpersonatedRole = (() => {
        try {
            return String(localStorage.getItem(PENDING_ROLE_SWITCH_KEY) || localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
        } catch (error) {
            return '';
        }
    })();
    const shouldResolveAdminPersona = (
        String(currentUser?.role || storedAuthenticatedRole || '').trim().toLowerCase() === USER_ROLES.ADMIN
        && storedImpersonatedRole
        && storedImpersonatedRole !== USER_ROLES.ADMIN
    );
    if (!shouldResolveAdminPersona) {
        return resolvedActiveUser;
    }

    try {
        const preferredFaculty = normalizeFacultyCode(
            localStorage.getItem('currentFaculty')
            || currentUser?.facultyCode
            || currentUser?.faculty
            || 'ECON',
            'ECON'
        );
        if (typeof ensureAdminTestingPersonas === 'function') {
            ensureAdminTestingPersonas(preferredFaculty);
        }
        if (typeof getPreferredImpersonationUserForRole === 'function') {
            const persona = getPreferredImpersonationUserForRole(storedImpersonatedRole, preferredFaculty);
            if (persona?.id) {
                return persona;
            }
        }
    } catch (error) {
        console.warn('Could not resolve active admin testing persona from state.', error);
    }
    return resolvedActiveUser;
}

function buildAdminTestingPersonaSpecs(faculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON') {
    const facultyCode = normalizeFacultyCode(faculty, 'ECON');
    const facultyLabel = getFacultyLabel(facultyCode);
    const personaPrefix = `admin-testing-${facultyCode.toLowerCase()}`;
    const activeSemester = parseInt(KIU_STATE?.activeSemester || 3, 10) || 3;

    /* Resolve first 3 curriculum subjects for the faculty to auto-assign */
    const facultyCurriculum = (() => {
        try {
            if (typeof getFacultyCurriculumFromProfiles === 'function') {
                return getFacultyCurriculumFromProfiles(facultyCode) || [];
            }
            const fp = KIU_STATE?.facultyProfiles?.[facultyCode];
            return Array.isArray(fp?.curriculum) ? fp.curriculum : [];
        } catch (_e) { return []; }
    })();
    const semesterSubjects = facultyCurriculum
        .filter(s => String(s?.semester || '') === String(activeSemester) || !s?.semester)
        .slice(0, 3)
        .map(s => s.id);
    const allSubjectIds = facultyCurriculum.slice(0, 5).map(s => s.id);

    /* QA testing placeholder names per faculty */
    const PERSONA_NAMES = {
        ECON: { prof: 'QA Prof Alpha', ta: 'QA TA Alpha', student: 'QA Student Alpha', service: 'QA Service Alpha' },
        CS:   { prof: 'QA Prof Beta', ta: 'QA TA Beta', student: 'QA Student Beta', service: 'QA Service Beta' },
        LAW:  { prof: 'QA Prof Gamma', ta: 'QA TA Gamma', student: 'QA Student Gamma', service: 'QA Service Gamma' },
        MED:  { prof: 'QA Prof Delta', ta: 'QA TA Delta', student: 'QA Student Delta', service: 'QA Service Delta' },
        ARTS: { prof: 'QA Prof Epsilon', ta: 'QA TA Epsilon', student: 'QA Student Epsilon', service: 'QA Service Epsilon' }
    };
    const names = PERSONA_NAMES[facultyCode] || PERSONA_NAMES.ECON;

    const PROGRAM_MAP = {
        ECON: 'BSc Business Administration',
        CS:   'BSc Computer Science',
        LAW:  'BA Law',
        MED:  'MD Medicine',
        ARTS: 'BA Arts & Humanities'
    };

    const shared = {
        faculty: facultyCode,
        facultyCode,
        isAdminTestingPersona: true,
        testingOwnerRole: USER_ROLES.ADMIN,
        testingFaculty: facultyCode,
        status: 'Active',
        joinYear: 2024
    };
    return [
        {
            ...shared,
            id: `${personaPrefix}-professor`,
            role: USER_ROLES.PROFESSOR,
            title: 'Professor',
            name: names.prof,
            nameEn: names.prof,
            displayName: names.prof,
            email: `${names.prof.toLowerCase().replace(/\s+/g, '.')}@kiu.edu.ge`,
            office: `B-${300 + Math.floor(Math.random() * 20)}`,
            phone: '+995 555 100 ' + String(10 + (facultyCode.charCodeAt(0) % 90)).padStart(3, '0'),
            maxHours: 18,
            subjects: allSubjectIds.length ? allSubjectIds : semesterSubjects,
            testingScenario: 'Built-in faculty tester for LMS authoring, schedule, exams, grading, and messaging.',
            testingCapabilities: ['Create and manage groups', 'Open faculty schedule and gradebook', 'Upload LMS files', 'Create quizzes and exams', 'Grade students', 'Message TA and students']
        },
        {
            ...shared,
            id: `${personaPrefix}-ta`,
            role: USER_ROLES.TA,
            title: 'Teaching Assistant',
            name: names.ta,
            nameEn: names.ta,
            displayName: names.ta,
            email: `${names.ta.toLowerCase().replace(/\s+/g, '.')}@kiu.edu.ge`,
            office: `C-${100 + Math.floor(Math.random() * 20)}`,
            phone: '+995 555 200 ' + String(10 + (facultyCode.charCodeAt(0) % 90)).padStart(3, '0'),
            maxHours: 12,
            subjects: semesterSubjects,
            assignedProf: names.prof,
            testingScenario: 'Built-in TA tester for support, messaging, grading visibility, and group operations.',
            testingCapabilities: ['Join faculty workflow instantly', 'Moderate group activity', 'Support grading and quizzes', 'Assist professor with LMS', 'Message professor and students']
        },
        {
            ...shared,
            id: `${personaPrefix}-student`,
            role: USER_ROLES.STUDENT,
            title: 'Student',
            name: names.student,
            nameEn: names.student,
            displayName: names.student,
            email: `${names.student.toLowerCase().replace(/\s+/g, '.')}@student.kiu.edu.ge`,
            program: PROGRAM_MAP[facultyCode] || `${facultyLabel} Program`,
            semester: activeSemester,
            course: activeSemester,
            gpa: 3.45,
            ects: (activeSemester - 1) * 30,
            enrollmentYear: 2024,
            subjects: semesterSubjects,
            testingScenario: 'Built-in student tester for registration, portal, LMS, quizzes, grades, and group joining.',
            testingCapabilities: ['Join available groups', 'Write quizzes and exams', 'Receive grades', 'Use messaging and files', 'Browse LMS materials']
        },
        {
            ...shared,
            id: `${personaPrefix}-student-service`,
            role: USER_ROLES.STUDENT_SERVICE,
            title: 'Student Service Advisor',
            name: names.service,
            nameEn: names.service,
            displayName: names.service,
            email: `${names.service.toLowerCase().replace(/\s+/g, '.')}@kiu.edu.ge`,
            office: `A-101`,
            phone: '+995 555 300 ' + String(10 + (facultyCode.charCodeAt(0) % 90)).padStart(3, '0'),
            testingScenario: 'Built-in student service tester for tickets, communication, and student support workflows.',
            testingCapabilities: ['Open service inbox', 'Coordinate with students and faculty', 'Review requests', 'Operate service workflows']
        }
    ];
}

function upsertFacultyProfilePersonaMember(profile, collectionKey, persona) {
    if (!profile || !collectionKey || !persona?.id) return;
    profile[collectionKey] = Array.isArray(profile[collectionKey]) ? profile[collectionKey] : [];
    const existingIndex = profile[collectionKey].findIndex(member => String(member?.id || '') === String(persona.id));
    const memberRecord = {
        id: persona.id,
        name: persona.displayName || persona.nameEn || persona.name || persona.id,
        nameEn: persona.nameEn || persona.displayName || persona.name || persona.id,
        displayName: persona.displayName || persona.nameEn || persona.name || persona.id,
        email: persona.email || '',
        faculty: persona.facultyCode || persona.faculty || '',
        facultyCode: persona.facultyCode || persona.faculty || '',
        role: persona.role,
        isAdminTestingPersona: true
    };
    if (existingIndex >= 0) {
        profile[collectionKey][existingIndex] = {
            ...profile[collectionKey][existingIndex],
            ...memberRecord
        };
        return;
    }
    profile[collectionKey].push(memberRecord);
}

function ensureAdminTestingPersonas(faculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON') {
    const facultyCode = normalizeFacultyCode(faculty, 'ECON');
    if (!KIU_STATE.facultyProfiles || typeof KIU_STATE.facultyProfiles !== 'object') {
        KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE.facultyProfiles || {}));
    }
    if (!KIU_STATE.facultyProfiles[facultyCode]) {
        KIU_STATE.facultyProfiles[facultyCode] = { curriculum: [], professors: [], tas: [], students: [] };
    }
    if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
    if (!KIU_STATE.studentSchedulesByStudent || typeof KIU_STATE.studentSchedulesByStudent !== 'object') KIU_STATE.studentSchedulesByStudent = {};
    if (!KIU_STATE.studentRegistrations || typeof KIU_STATE.studentRegistrations !== 'object') KIU_STATE.studentRegistrations = {};
    if (!KIU_STATE.studentGrades || typeof KIU_STATE.studentGrades !== 'object') KIU_STATE.studentGrades = {};
    if (!KIU_STATE.studentPassedCourses || typeof KIU_STATE.studentPassedCourses !== 'object') KIU_STATE.studentPassedCourses = {};
    const profile = KIU_STATE.facultyProfiles[facultyCode];
    const personas = buildAdminTestingPersonaSpecs(facultyCode);
    personas.forEach(persona => {
        const userIndex = KIU_STATE.users.findIndex(user => String(user?.id || '') === String(persona.id));
        const mergedPersona = userIndex >= 0
            ? { ...KIU_STATE.users[userIndex], ...persona }
            : { ...persona };
        if (userIndex >= 0) KIU_STATE.users[userIndex] = mergedPersona;
        else KIU_STATE.users.push(mergedPersona);
        if (persona.role === USER_ROLES.PROFESSOR) upsertFacultyProfilePersonaMember(profile, 'professors', mergedPersona);
        if (persona.role === USER_ROLES.TA) upsertFacultyProfilePersonaMember(profile, 'tas', mergedPersona);
        if (persona.role === USER_ROLES.STUDENT) {
            upsertFacultyProfilePersonaMember(profile, 'students', mergedPersona);
            if (!Array.isArray(KIU_STATE.studentSchedulesByStudent[persona.id])) {
                KIU_STATE.studentSchedulesByStudent[persona.id] = [];
            }
            if (!Array.isArray(KIU_STATE.studentRegistrations[persona.id])) {
                KIU_STATE.studentRegistrations[persona.id] = [];
            }
            if (!Array.isArray(KIU_STATE.studentGrades[persona.id])) {
                KIU_STATE.studentGrades[persona.id] = [];
            }
            if (!Array.isArray(KIU_STATE.studentPassedCourses[persona.id])) {
                KIU_STATE.studentPassedCourses[persona.id] = [];
            }
        }
    });
    return personas.map(persona => KIU_STATE.users.find(user => String(user?.id || '') === String(persona.id)) || persona);
}

function getAdminTestingPersonas(faculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON') {
    const facultyCode = normalizeFacultyCode(faculty, 'ECON');
    return ensureAdminTestingPersonas(facultyCode).filter(persona => normalizeFacultyCode(persona?.facultyCode || persona?.faculty || '', '') === facultyCode);
}

function getFacultyCurriculumFromProfiles(facultyFilter) {
    const normalizedFaculty = normalizeFacultyCode(facultyFilter || getCurrentFaculty(), '');
    if (!normalizedFaculty) {
        return Object.keys(KIU_STATE.facultyProfiles || {}).flatMap(code => getFacultyCurriculumFromProfiles(code));
    }
    const profile = getFacultyProfile(normalizedFaculty);
    const curriculum = Array.isArray(profile?.curriculum) ? profile.curriculum : [];
    return curriculum
        .filter(Boolean)
        .map(subject => ({
            ...subject,
            faculty: subject?.faculty || normalizedFaculty
        }));
}

function getAllCurriculumSubjects() {
    const profiles = KIU_STATE.facultyProfiles && typeof KIU_STATE.facultyProfiles === 'object'
        ? KIU_STATE.facultyProfiles
        : {};
    const subjects = [];
    Object.keys(profiles).forEach(facultyCode => {
        getFacultyCurriculumFromProfiles(facultyCode).forEach(subject => {
            if (!subjects.some(existing => canonicalCourseKey(existing?.id) === canonicalCourseKey(subject?.id))) {
                subjects.push(subject);
            }
        });
    });
    return subjects;
}

function syncCanonicalCurriculumState() {
    KIU_STATE.curriculum = getAllCurriculumSubjects();
    return KIU_STATE.curriculum;
}

window.buildAdminTestingPersonaSpecs = buildAdminTestingPersonaSpecs;
window.ensureAdminTestingPersonas = ensureAdminTestingPersonas;
window.getAdminTestingPersonas = getAdminTestingPersonas;
window.getFacultyCurriculumFromProfiles = getFacultyCurriculumFromProfiles;
window.getAllCurriculumSubjects = getAllCurriculumSubjects;
window.syncCanonicalCurriculumState = syncCanonicalCurriculumState;

function getPreferredImpersonationUserForRole(role, preferredFaculty = localStorage.getItem('currentFaculty') || '') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedRole || !Array.isArray(KIU_STATE?.users)) return null;
    if (currentUser?.role === USER_ROLES.ADMIN) {
        ensureAdminTestingPersonas(preferredFaculty || getCurrentFaculty());
    }
    const candidates = KIU_STATE.users.filter((user) => String(user?.role || '').trim().toLowerCase() === normalizedRole);
    if (!candidates.length) return null;
    const normalizedFaculty = normalizeFacultyCode(preferredFaculty || '', '');
    const personaCandidates = candidates.filter(user => user?.isAdminTestingPersona);
    if (!normalizedFaculty) return personaCandidates[0] || candidates[0];
    const sameFacultyPersona = personaCandidates.find((user) => (
        normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '') === normalizedFaculty
    ));
    const sameFacultyCandidate = candidates.find((user) => (
        normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '') === normalizedFaculty
    ));
    return sameFacultyPersona || sameFacultyCandidate || null;
}

function syncLegacyStudentStateForCurrentUser() {
    const activeUser = getCurrentUserFromState(KIU_STATE);
    if (activeUser?.role === USER_ROLES.STUDENT) {
        const activeFaculty = activeUser.facultyCode || activeUser.faculty || getCurrentFaculty();
        const currentSchedule = normalizeStudentScheduleValue(KIU_STATE.studentSchedulesByStudent?.[activeUser.id])
            .filter(entry => isStudentScheduleEntryInFaculty(entry, activeFaculty));
        KIU_STATE.studentSchedule = JSON.parse(JSON.stringify(currentSchedule));
    }
}

function ensureCanonicalState() {
    if (kiuCanonicalStateInProgress) return;
    kiuCanonicalStateInProgress = true;
    try {
    ensureExamSessionStore();
    if (typeof stripSeededMockStudents === 'function') stripSeededMockStudents(KIU_STATE);
    pruneDeletedStaffMembersFromState(KIU_STATE);

    if (!KIU_STATE.facultyProfiles || typeof KIU_STATE.facultyProfiles !== 'object') {
        KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE.facultyProfiles || {}));
    }
    const needsDisplayTextRepair = Number(KIU_STATE.__displayTextRepairVersion || 0) < KIU_DISPLAY_TEXT_REPAIR_VERSION;
    if (needsDisplayTextRepair) {
        Object.entries(KIU_STATE.facultyProfiles || {}).forEach(([, profile]) => {
            if (!profile || typeof profile !== 'object') return;
            if (Array.isArray(profile.curriculum)) {
                profile.curriculum = profile.curriculum.map(repairCurriculumSubjectRecord).filter(Boolean);
            }
        });
        if (Array.isArray(KIU_STATE.curriculum)) {
            KIU_STATE.curriculum = KIU_STATE.curriculum.map(repairCurriculumSubjectRecord).filter(Boolean);
        }
    }

    if (!KIU_STATE.users) KIU_STATE.users = [];
    if (currentUser?.id && !KIU_STATE.users.some(user => String(user?.id || '') === String(currentUser.id))) {
        KIU_STATE.users.push({
            ...currentUser,
            faculty: currentUser.facultyCode || currentUser.faculty || '',
            facultyCode: currentUser.facultyCode || currentUser.faculty || ''
        });
    }
    const shouldEnsureAdminTestingPersonas = (() => {
        if (currentUser?.role === USER_ROLES.ADMIN) return true;
        try {
            const parsed = JSON.parse(localStorage.getItem('KIU_AUTH_STATE') || 'null');
            return String(parsed?.role || '').trim().toLowerCase() === USER_ROLES.ADMIN;
        } catch (error) {
            return false;
        }
    })();
    if (shouldEnsureAdminTestingPersonas) {
        ensureAdminTestingPersonas(localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || 'ECON');
    }
    KIU_STATE.users = mergeUniqueById([
        ...KIU_STATE.users,
        ...collectFacultyMembers(KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles)
    ]);
    pruneDeletedStaffMembersFromState(KIU_STATE);
    syncCanonicalCurriculumState();
    if (needsDisplayTextRepair && Array.isArray(KIU_STATE.curriculum)) {
        KIU_STATE.curriculum = KIU_STATE.curriculum.map(repairCurriculumSubjectRecord).filter(Boolean);
    }

    if (!KIU_STATE.studentSchedulesByStudent) KIU_STATE.studentSchedulesByStudent = {};
    const defaultStudent = KIU_STATE.users.find(user => user.role === USER_ROLES.STUDENT);
    if (defaultStudent && Array.isArray(KIU_STATE.studentSchedule) && KIU_STATE.studentSchedule.length > 0 && !KIU_STATE.studentSchedulesByStudent[defaultStudent.id]) {
        KIU_STATE.studentSchedulesByStudent[defaultStudent.id] = JSON.parse(JSON.stringify(KIU_STATE.studentSchedule));
    }
    if (needsDisplayTextRepair && Array.isArray(KIU_STATE.studentSchedule)) {
        KIU_STATE.studentSchedule = normalizeStudentScheduleValue(KIU_STATE.studentSchedule)
            .map(repairStudentScheduleRecord)
            .filter(Boolean);
    }
    if (needsDisplayTextRepair) {
        Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
            KIU_STATE.studentSchedulesByStudent[studentId] = normalizeStudentScheduleValue(schedule)
                .map(repairStudentScheduleRecord)
                .filter(Boolean);
        });
    }

    if (!KIU_STATE.availableGroups) KIU_STATE.availableGroups = {};
    if (needsDisplayTextRepair) {
        Object.entries(KIU_STATE.availableGroups).forEach(([subjectId, groups]) => {
            KIU_STATE.availableGroups[subjectId] = (groups || [])
                .map(group => repairAvailableGroupRecord(subjectId, group))
                .filter(Boolean);
        });
        KIU_STATE.__displayTextRepairVersion = KIU_DISPLAY_TEXT_REPAIR_VERSION;
    }

    if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
    if (defaultStudent && KIU_STATE.tuitionBalances.student != null && KIU_STATE.tuitionBalances[defaultStudent.id] == null) {
        KIU_STATE.tuitionBalances[defaultStudent.id] = KIU_STATE.tuitionBalances.student;
        delete KIU_STATE.tuitionBalances.student;
    }

    if (!KIU_STATE.probationStatus) KIU_STATE.probationStatus = {};
    if (defaultStudent && KIU_STATE.probationStatus.student != null && KIU_STATE.probationStatus[defaultStudent.id] == null) {
        KIU_STATE.probationStatus[defaultStudent.id] = KIU_STATE.probationStatus.student;
        delete KIU_STATE.probationStatus.student;
    }

    if (!KIU_STATE.socialHub || typeof KIU_STATE.socialHub !== 'object') KIU_STATE.socialHub = {};
    if (!KIU_STATE.socialHub.profiles || typeof KIU_STATE.socialHub.profiles !== 'object') KIU_STATE.socialHub.profiles = {};
    if (!Array.isArray(KIU_STATE.socialHub.relationships)) KIU_STATE.socialHub.relationships = [];
    if (!Array.isArray(KIU_STATE.socialHub.pages)) KIU_STATE.socialHub.pages = [];
    if (!Array.isArray(KIU_STATE.socialHub.groups)) KIU_STATE.socialHub.groups = [];
    if (!Array.isArray(KIU_STATE.socialHub.projects)) KIU_STATE.socialHub.projects = [];
    if (!Array.isArray(KIU_STATE.socialHub.projectTasks)) KIU_STATE.socialHub.projectTasks = [];
    if (!Array.isArray(KIU_STATE.socialHub.projectMilestones)) KIU_STATE.socialHub.projectMilestones = [];
    if (!Array.isArray(KIU_STATE.socialHub.projectDeliverables)) KIU_STATE.socialHub.projectDeliverables = [];
    if (!Array.isArray(KIU_STATE.socialHub.posts)) KIU_STATE.socialHub.posts = [];
    if (!Array.isArray(KIU_STATE.socialHub.stories)) KIU_STATE.socialHub.stories = [];
    if (!Array.isArray(KIU_STATE.socialHub.storyViews)) KIU_STATE.socialHub.storyViews = [];
    if (!Array.isArray(KIU_STATE.socialHub.reels)) KIU_STATE.socialHub.reels = [];
    if (!Array.isArray(KIU_STATE.socialHub.savedPosts)) KIU_STATE.socialHub.savedPosts = [];
    if (!Array.isArray(KIU_STATE.socialHub.reports)) KIU_STATE.socialHub.reports = [];
    if (!Array.isArray(KIU_STATE.socialHub.lostFoundItems)) KIU_STATE.socialHub.lostFoundItems = [];
    if (!Array.isArray(KIU_STATE.socialHub.blocks)) KIU_STATE.socialHub.blocks = [];
    if (!Array.isArray(KIU_STATE.socialHub.muted)) KIU_STATE.socialHub.muted = [];
    if (!Array.isArray(KIU_STATE.socialHub.notifications)) KIU_STATE.socialHub.notifications = [];
    if (!KIU_STATE.socialHub.draftFiles || typeof KIU_STATE.socialHub.draftFiles !== 'object') KIU_STATE.socialHub.draftFiles = {};
    if (!KIU_STATE.socialHub.ui || typeof KIU_STATE.socialHub.ui !== 'object') KIU_STATE.socialHub.ui = {};
    if (typeof KIU_STATE.socialHub.ui.facultyFilter !== 'string') KIU_STATE.socialHub.ui.facultyFilter = 'all';
    if (typeof KIU_STATE.socialHub.ui.view !== 'string') KIU_STATE.socialHub.ui.view = 'feed';
    if (typeof KIU_STATE.socialHub.ui.activeEntityType !== 'string') KIU_STATE.socialHub.ui.activeEntityType = 'feed';
    if (typeof KIU_STATE.socialHub.ui.activeEntityId !== 'string') KIU_STATE.socialHub.ui.activeEntityId = '';
    if (typeof KIU_STATE.socialHub.ui.composeAs !== 'string') KIU_STATE.socialHub.ui.composeAs = 'profile';
    if (typeof KIU_STATE.socialHub.ui.directoryTab !== 'string') KIU_STATE.socialHub.ui.directoryTab = 'home';
    if (typeof KIU_STATE.socialHub.ui.searchQuery !== 'string') KIU_STATE.socialHub.ui.searchQuery = '';
    if (typeof KIU_STATE.socialHub.ui.entityTab !== 'string') KIU_STATE.socialHub.ui.entityTab = 'posts';
    if (typeof KIU_STATE.socialHub.ui.composeMode !== 'string') KIU_STATE.socialHub.ui.composeMode = 'post';
    if (typeof KIU_STATE.socialHub.ui.activeStoryId !== 'string') KIU_STATE.socialHub.ui.activeStoryId = '';
    if (!Array.isArray(KIU_STATE.socialHub.ui.hiddenPostIds)) KIU_STATE.socialHub.ui.hiddenPostIds = [];
    if (!Array.isArray(KIU_STATE.socialHub.ui.hiddenReelIds)) KIU_STATE.socialHub.ui.hiddenReelIds = [];
    if (typeof KIU_STATE.socialHub.ui.pageSearch !== 'string') KIU_STATE.socialHub.ui.pageSearch = '';
    if (typeof KIU_STATE.socialHub.ui.directoryQuery !== 'string') KIU_STATE.socialHub.ui.directoryQuery = '';
    if (typeof KIU_STATE.socialHub.ui.groupSearch !== 'string') KIU_STATE.socialHub.ui.groupSearch = '';
    if (typeof KIU_STATE.socialHub.ui.projectDiscoverSearch !== 'string') KIU_STATE.socialHub.ui.projectDiscoverSearch = '';
    if (typeof KIU_STATE.socialHub.ui.projectDiscoverFaculty !== 'string') KIU_STATE.socialHub.ui.projectDiscoverFaculty = 'all';
    if (typeof KIU_STATE.socialHub.ui.projectDiscoverRole !== 'string') KIU_STATE.socialHub.ui.projectDiscoverRole = 'all';
    if (typeof KIU_STATE.socialHub.ui.projectDiscoverTag !== 'string') KIU_STATE.socialHub.ui.projectDiscoverTag = '';
    if (typeof KIU_STATE.socialHub.ui.projectEditId !== 'string') KIU_STATE.socialHub.ui.projectEditId = '';
    if (typeof KIU_STATE.socialHub.ui.projectComposerOpen !== 'boolean') KIU_STATE.socialHub.ui.projectComposerOpen = false;
    if (typeof KIU_STATE.socialHub.ui.projectHashtags !== 'string') KIU_STATE.socialHub.ui.projectHashtags = '';
    if (typeof KIU_STATE.socialHub.ui.projectExternalLinks !== 'string') KIU_STATE.socialHub.ui.projectExternalLinks = '';
    if (!Array.isArray(KIU_STATE.socialHub.ui.projectVisibleRoles)) KIU_STATE.socialHub.ui.projectVisibleRoles = [];
    if (!Array.isArray(KIU_STATE.socialHub.ui.projectVisibleFacultyCodes)) KIU_STATE.socialHub.ui.projectVisibleFacultyCodes = [];
    if (typeof KIU_STATE.socialHub.ui.projectVisibleUserIds !== 'string') KIU_STATE.socialHub.ui.projectVisibleUserIds = '';
    if (typeof KIU_STATE.socialHub.ui.projectHiddenUserIds !== 'string') KIU_STATE.socialHub.ui.projectHiddenUserIds = '';
    if (!Array.isArray(KIU_STATE.socialHub.ui.projectMediaItems)) KIU_STATE.socialHub.ui.projectMediaItems = [];
    if (!('projectMediaFile' in KIU_STATE.socialHub.ui)) KIU_STATE.socialHub.ui.projectMediaFile = null;
    if (typeof KIU_STATE.socialHub.ui.lostFoundFilter !== 'string') KIU_STATE.socialHub.ui.lostFoundFilter = 'open';
    if (typeof KIU_STATE.socialHub.ui.lostFoundSearch !== 'string') KIU_STATE.socialHub.ui.lostFoundSearch = '';
    if (typeof KIU_STATE.socialHub.ui.lostFoundBrowseFaculty !== 'string') KIU_STATE.socialHub.ui.lostFoundBrowseFaculty = typeof KIU_STATE.socialHub.ui.lostFoundFaculty === 'string' ? KIU_STATE.socialHub.ui.lostFoundFaculty : 'current';
    if (typeof KIU_STATE.socialHub.ui.lostFoundScope !== 'string') KIU_STATE.socialHub.ui.lostFoundScope = typeof KIU_STATE.socialHub.ui.lostFoundFaculty === 'string' ? KIU_STATE.socialHub.ui.lostFoundFaculty : 'current';
    if (typeof KIU_STATE.socialHub.ui.lostFoundComposerOpen !== 'boolean') KIU_STATE.socialHub.ui.lostFoundComposerOpen = false;
    if (typeof KIU_STATE.socialHub.ui.lostFoundKind !== 'string') KIU_STATE.socialHub.ui.lostFoundKind = 'lost';
    if (typeof KIU_STATE.socialHub.ui.lostFoundStatus !== 'string') KIU_STATE.socialHub.ui.lostFoundStatus = 'open';
    if (typeof KIU_STATE.socialHub.ui.lostFoundTitle !== 'string') KIU_STATE.socialHub.ui.lostFoundTitle = '';
    if (typeof KIU_STATE.socialHub.ui.lostFoundDescription !== 'string') KIU_STATE.socialHub.ui.lostFoundDescription = '';
    if (typeof KIU_STATE.socialHub.ui.lostFoundCategory !== 'string') KIU_STATE.socialHub.ui.lostFoundCategory = '';
    if (typeof KIU_STATE.socialHub.ui.lostFoundLocation !== 'string') KIU_STATE.socialHub.ui.lostFoundLocation = '';
    if (typeof KIU_STATE.socialHub.ui.lostFoundDate !== 'string') KIU_STATE.socialHub.ui.lostFoundDate = '';
    if (typeof KIU_STATE.socialHub.ui.lostFoundEditId !== 'string') KIU_STATE.socialHub.ui.lostFoundEditId = '';
    if (!('lostFoundFile' in KIU_STATE.socialHub.ui)) KIU_STATE.socialHub.ui.lostFoundFile = null;
    if (KIU_STATE.socialHub.migratedLegacy == null) KIU_STATE.socialHub.migratedLegacy = false;
    if (KIU_STATE.socialHub.migrationVersion == null) KIU_STATE.socialHub.migrationVersion = 4;

    if (!KIU_STATE.auth) KIU_STATE.auth = {};
    const impersonationEnabled = isRoleImpersonationEnabled();
    let activeUserId = sessionStorage.getItem(ACTIVE_SESSION_KEY) || KIU_STATE.auth.activeUserId;
    if (currentUser?.id && !impersonationEnabled) {
        activeUserId = currentUser.id;
    }
    if (!activeUserId || !KIU_STATE.users.some(user => user.id === activeUserId)) {
        const preferredFaculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || '';
        const normalizedPreferredFaculty = normalizeFacultyCode(preferredFaculty || '', '');
        const fallbackRole = (impersonationEnabled ? currentUserRole : currentUser?.role) || currentUserRole;
        const scopedRoleFallback = KIU_STATE.users.find(user => (
            user.role === fallbackRole
            && (!impersonationEnabled || !normalizedPreferredFaculty || normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '') === normalizedPreferredFaculty)
        ));
        const fallbackUser = (impersonationEnabled
            ? getPreferredImpersonationUserForRole(currentUserRole, preferredFaculty)
            : KIU_STATE.users.find(user => String(user.id || '') === String(currentUser?.id || '')))
            || scopedRoleFallback
            || (!impersonationEnabled ? defaultStudent : null)
            || (!impersonationEnabled ? KIU_STATE.users[0] : null);
        activeUserId = fallbackUser?.id || null;
    }
    if (activeUserId) {
        KIU_STATE.auth.activeUserId = activeUserId;
        sessionStorage.setItem(ACTIVE_SESSION_KEY, activeUserId);
    }

    KIU_STATE.domain = buildCanonicalDomain(KIU_STATE);
    const activeUser = getCurrentUserFromState(KIU_STATE);
    if (!impersonationEnabled && activeUser && currentUser?.id && String(activeUser.id) !== String(currentUser.id)) {
        KIU_STATE.auth.activeUserId = currentUser.id;
        sessionStorage.setItem(ACTIVE_SESSION_KEY, currentUser.id);
    }
    const effectiveUser = getCurrentUserFromState(KIU_STATE);
    if (!impersonationEnabled) {
        currentUserRole = currentUser?.role || effectiveUser?.role || currentUserRole || USER_ROLES.STUDENT;
    } else {
        currentUserRole = currentUserRole || effectiveUser?.role || currentUser?.role || USER_ROLES.STUDENT;
    }
    syncLegacyStudentStateForCurrentUser();
    } finally {
        kiuCanonicalStateInProgress = false;
    }
}

function getDomain() {
    ensureCanonicalState();
    return KIU_STATE.domain;
}

function getCurrentUser() {
    ensureCanonicalState();
    return getCurrentUserFromState(KIU_STATE);
}

function getCurrentUserId() {
    return getCurrentUser()?.id || null;
}

function getEffectiveUserRole() {
    if (!isRoleImpersonationEnabled()) {
        return currentUser?.role || getCurrentUser()?.role || currentUserRole || USER_ROLES.STUDENT;
    }
    return currentUserRole || currentUser?.role || getCurrentUser()?.role || USER_ROLES.STUDENT;
}

function getCurrentUserPrivileges() {
    const user = getCurrentUser() || currentUser || null;
    const effectivePrivileges = Array.isArray(user?.effectivePrivileges) ? user.effectivePrivileges : [];
    const grantedPrivileges = Array.isArray(user?.grantedPrivileges) ? user.grantedPrivileges : [];
    return [...new Set([...effectivePrivileges, ...grantedPrivileges].map(value => String(value || '').trim()).filter(Boolean))];
}

function userHasPortalPrivilege(privilegeId = '') {
    const normalizedPrivilegeId = String(privilegeId || '').trim();
    if (!normalizedPrivilegeId) return false;
    const role = String(getEffectiveUserRole() || '').trim().toLowerCase();
    if (role === USER_ROLES.ADMIN) return true;
    return getCurrentUserPrivileges().includes(normalizedPrivilegeId);
}

// PERFORMANCE: Cache allowed pages to avoid rebuilding Set on every navigation call
let _allowedPagesCache = null;
let _allowedPagesCacheRole = null;

function getAllowedPagesForRole(role = getEffectiveUserRole()) {
    // Return cached version if role hasn't changed
    if (_allowedPagesCache && _allowedPagesCacheRole === role) {
        return _allowedPagesCache;
    }
    
    const common = ['home', 'profile', 'profile-view', 'library', 'orders', 'lms', 'social', 'news'];
    if (role === USER_ROLES.ADMIN) {
        _allowedPagesCache = new Set([
            ...common,
            'admin-tools',
            'admin-scheduler',
            'staff',
            'students-admin',
            'exams',
            'profile-view',
            'chancellery',
            'student-service',
            'programs'
        ]);
    } else if (role === USER_ROLES.PROFESSOR || role === USER_ROLES.TA) {
        _allowedPagesCache = new Set([
            ...common,
            'faculty-schedule',
            'faculty-gradebook',
            'timetable',
            'exams',
            'chancellery',
            'programs',
            'student-service'
        ]);
    } else if (role === USER_ROLES.STUDENT_SERVICE) {
        _allowedPagesCache = new Set([
            'home',
            'profile',
            'library',
            'news',
            'orders',
            'social',
            'student-service',
            'chancellery'
        ]);
    } else {
        _allowedPagesCache = new Set([
            ...common,
            'personal-data',
            'chancellery',
            'career-market',
            'programs',
            'study-card',
            'registration',
            'timetable',
            'student-service'
        ]);
    }
    if (userHasPortalPrivilege('access_admin_tools')) _allowedPagesCache.add('admin-tools');
    if (userHasPortalPrivilege('access_admin_scheduler')) _allowedPagesCache.add('admin-scheduler');
    if (userHasPortalPrivilege('access_staff_directory')) _allowedPagesCache.add('staff');
    if (userHasPortalPrivilege('access_student_directory')) _allowedPagesCache.add('students-admin');
    if (userHasPortalPrivilege('manage_exam_templates') || userHasPortalPrivilege('manage_exam_schedule') || userHasPortalPrivilege('cross_faculty_exam_access')) {
        _allowedPagesCache.add('exams');
    }
    _allowedPagesCacheRole = role;
    return _allowedPagesCache;
}

// PERFORMANCE: Invalidate cache when role changes
function invalidatePageAccessCache() {
    _allowedPagesCache = null;
    _allowedPagesCacheRole = null;
}

// Expose globally for navigation.js to call on role switch
window.invalidatePageAccessCache = invalidatePageAccessCache;

function canRoleAccessPage(pageId, role = getEffectiveUserRole()) {
    return getAllowedPagesForRole(role).has(pageId);
}

function getRoleHomePage(role = getEffectiveUserRole()) {
    const normalizedRole = String(role || getEffectiveUserRole() || USER_ROLES.STUDENT).trim().toLowerCase() || USER_ROLES.STUDENT;
    return `index.html?view=${encodeURIComponent(normalizedRole)}#home`;
}

function isAdminImpersonationMode() {
    const authenticatedUser = currentUser || null;
    const activeSessionUser = getCurrentUserFromState(KIU_STATE);
    return authenticatedUser?.role === USER_ROLES.ADMIN && activeSessionUser?.role !== USER_ROLES.ADMIN;
}

function getEffectiveTuitionBalance(userId = getCurrentUserId()) {
    if (isAdminImpersonationMode()) return 0;
    return (KIU_STATE.tuitionBalances && KIU_STATE.tuitionBalances[userId]) || 0;
}

function normalizeStudentScheduleValue(schedule) {
    if (Array.isArray(schedule)) return schedule;
    if (schedule && typeof schedule === 'object') {
        if (Array.isArray(schedule.entries)) return schedule.entries;
        return Object.entries(schedule)
            .filter(([, groupId]) => groupId != null && groupId !== '')
            .map(([courseId, groupId]) => ({ courseId, groupId }));
    }
    return [];
}

function resolveStudentScheduleEntryFaculty(entry, fallbackFaculty = '') {
    const explicitFaculty = entry?.faculty || entry?.facultyCode;
    if (explicitFaculty) return normalizeFacultyCode(explicitFaculty, fallbackFaculty || '');
    const courseId = entry?.courseId || entry?.sourceCourseId || '';
    const groupId = entry?.groupId || entry?.groupName || '';
    if (courseId && groupId) {
        const candidateGroups = getAvailableGroupsForSubject(courseId).filter(group => (
            canonicalCourseKey(group?.id || group?.groupId || group?.name || '') === canonicalCourseKey(groupId)
        ));
        const matchedGroup = candidateGroups.find(group => (
            !fallbackFaculty || normalizeFacultyCode(group?.faculty || '', '') === normalizeFacultyCode(fallbackFaculty, '')
        )) || candidateGroups[0];
        if (matchedGroup?.faculty) return normalizeFacultyCode(matchedGroup.faculty, fallbackFaculty || '');
    }
    const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function'
        ? deriveFacultyFromSubjectId(courseId)
        : '';
    return normalizeFacultyCode(derivedFaculty || fallbackFaculty || '', fallbackFaculty || '');
}

function isStudentScheduleEntryInFaculty(entry, faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || '', '');
    if (!normalizedFaculty) return true;
    return resolveStudentScheduleEntryFaculty(entry, normalizedFaculty) === normalizedFaculty;
}

function getCurrentStudentSchedule() {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== USER_ROLES.STUDENT) return [];
    const studentFaculty = currentUser.facultyCode || currentUser.faculty || getCurrentFaculty();
    return normalizeStudentScheduleValue(KIU_STATE.studentSchedulesByStudent?.[currentUser.id])
        .filter(entry => isStudentScheduleEntryInFaculty(entry, studentFaculty));
}

function describeStudentScheduleChange(previousSchedule = [], nextSchedule = []) {
    const keyFor = item => [
        String(item?.courseId || ''),
        String(item?.groupId || ''),
        String(item?.day || item?.timeDay || ''),
        String(item?.time || '')
    ].join('::');
    const previousMap = new Map((previousSchedule || []).map(item => [keyFor(item), item]));
    const nextMap = new Map((nextSchedule || []).map(item => [keyFor(item), item]));
    const added = [...nextMap.keys()].filter(key => !previousMap.has(key));
    const removed = [...previousMap.keys()].filter(key => !nextMap.has(key));
    const changedItem = nextMap.get(added[0]) || previousMap.get(removed[0]) || (nextSchedule || [])[0] || null;
    if (!changedItem) return 'Your timetable changed. Review the latest schedule before your next class.';
    const courseLabel = changedItem.courseName || changedItem.subjectName || changedItem.courseId || 'A class';
    const dayLabel = changedItem.day || changedItem.timeDay || 'your timetable';
    const timeLabel = changedItem.time || 'the latest schedule';
    if (added.length && !removed.length) {
        return `${courseLabel} was added to your timetable for ${dayLabel} at ${timeLabel}.`;
    }
    if (removed.length && !added.length) {
        return `${courseLabel} was removed from your timetable. Check the latest class schedule for updates.`;
    }
    return `${courseLabel} changed in your timetable. Review ${dayLabel} at ${timeLabel} for the latest details.`;
}

function setCurrentStudentSchedule(schedule) {
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.role !== USER_ROLES.STUDENT) return;
    if (!KIU_STATE.studentSchedulesByStudent) KIU_STATE.studentSchedulesByStudent = {};
    const previousSchedule = getCurrentStudentSchedule();
    const studentFaculty = currentUser.facultyCode || currentUser.faculty || getCurrentFaculty();
    const normalizedSchedule = (Array.isArray(schedule) ? schedule : [])
        .filter(entry => isStudentScheduleEntryInFaculty(entry, studentFaculty))
        .map(entry => ({
            ...entry,
            faculty: entry?.faculty || normalizeFacultyCode(studentFaculty, 'ECON')
        }));
    KIU_STATE.studentSchedulesByStudent[currentUser.id] = JSON.parse(JSON.stringify(normalizedSchedule));
    const previousSignature = buildPortalScheduleSignature(previousSchedule);
    const nextSignature = buildPortalScheduleSignature(normalizedSchedule);
    if (previousSignature && previousSignature !== nextSignature) {
        createPortalSystemNotification({
            userId: currentUser.id,
            source: 'school',
            type: 'schedule-change',
            title: 'Schedule updated',
            text: describeStudentScheduleChange(previousSchedule, normalizedSchedule),
            routePage: 'timetable',
            duplicateWindowMs: 1000
        });
    }
    syncLegacyStudentStateForCurrentUser();
    KIU_STATE.domain = buildCanonicalDomain(KIU_STATE);
}

function setActiveSessionUser(userId) {
    if (!userId) return null;
    if (currentUser?.role !== USER_ROLES.ADMIN && String(userId) !== String(currentUser?.id || '')) {
        userId = currentUser?.id || userId;
    }
    KIU_STATE.auth = KIU_STATE.auth || {};
    KIU_STATE.auth.activeUserId = userId;
    sessionStorage.setItem(ACTIVE_SESSION_KEY, userId);
    KIU_STATE.domain = buildCanonicalDomain(KIU_STATE);
    const activeUser = getCurrentUserFromState(KIU_STATE);
    currentUserRole = activeUser?.role || currentUserRole;
    try {
        localStorage.setItem('currentUserRole', currentUserRole);
        if (currentUser?.role !== USER_ROLES.ADMIN) {
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        }
        const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null') || {};
        persistedState.auth = persistedState.auth || {};
        persistedState.auth.activeUserId = userId;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
    } catch (e) {
        console.warn('Could not persist active impersonation session.', e);
    }
    syncLegacyStudentStateForCurrentUser();
    return activeUser;
}

function setActiveSessionUserByRole(role) {
    if (currentUser?.role !== USER_ROLES.ADMIN) {
        if (currentUser?.id) {
            setActiveSessionUser(currentUser.id);
        }
        return currentUser || getCurrentUserFromState(KIU_STATE);
    }
    const normalizedRole = String(role || currentUserRole || currentUser?.role || USER_ROLES.STUDENT).trim().toLowerCase();
    const preferredFaculty = localStorage.getItem('currentFaculty') || currentUser?.facultyCode || currentUser?.faculty || '';
    ensureAdminTestingPersonas(preferredFaculty || 'ECON');
    const targetUser = (currentUser && String(currentUser.role || '').trim().toLowerCase() === normalizedRole)
        ? currentUser
        : getPreferredImpersonationUserForRole(normalizedRole, preferredFaculty);
    if (!targetUser?.id) return null;
    KIU_STATE.auth = KIU_STATE.auth || {};
    KIU_STATE.auth.activeUserId = targetUser.id;
    sessionStorage.setItem(ACTIVE_SESSION_KEY, targetUser.id);
    currentUserRole = normalizedRole;
    try {
        localStorage.setItem('currentUserRole', normalizedRole);
        if (normalizedRole === USER_ROLES.ADMIN) {
            localStorage.removeItem(PENDING_ROLE_SWITCH_KEY);
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        } else {
            localStorage.setItem(PENDING_ROLE_SWITCH_KEY, normalizedRole);
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        }
        const persistedState = JSON.parse(localStorage.getItem('KIU_PERSISTENT_STATE') || 'null') || {};
        persistedState.auth = persistedState.auth || {};
        persistedState.auth.activeUserId = targetUser.id;
        localStorage.setItem('KIU_PERSISTENT_STATE', JSON.stringify(persistedState));
    } catch (e) {
        console.warn('Could not persist impersonation session user.', e);
    }
    KIU_STATE.domain = buildCanonicalDomain(KIU_STATE);
    syncLegacyStudentStateForCurrentUser();
    return getCurrentUserFromState(KIU_STATE);
}

function hasPermission(permission) {
    const activeUser = getCurrentUser();
    if (!activeUser) return false;
    const grants = PERMISSION_MATRIX[activeUser.role] || [];
    return grants.includes('*') || grants.includes(permission);
}

loadAuthState();
if (typeof schedulePortalBackendBootstrap === 'function') schedulePortalBackendBootstrap();
ensureCanonicalState();

window.getCurrentUserFromState = getCurrentUserFromState;
window.getCurrentUser = getCurrentUser;
window.getCurrentUserId = getCurrentUserId;
window.getEffectiveUserRole = getEffectiveUserRole;

