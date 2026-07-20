/* Admin exam/quiz draft + exam-session helpers. Peeled from state.js (E4).
 * Load before state.js.
 */
(function initStateAdminExamRuntime() {
    if (window.__KIU_STATE_ADMIN_EXAM_LOADED) return;
    window.__KIU_STATE_ADMIN_EXAM_LOADED = true;

    window.__kiuCreateStateAdminExamApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

let adminExamDraftByFaculty = {};
let adminExamUiByFaculty = {};

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

        const api = {
            makeAdminExamEntityId,
            createAdminQuizQuestion,
            ensureAdminExamState,
            createAdminQuizDraft,
            normalizeExamSessionStatus,
            normalizeExamSessionAttendanceMap,
            normalizeExamSessionRecord,
            ensureExamSessionStore,
            getExamSessionById,
            getExamSessionsForFaculty,
            getAdminQuizDraft,
            getAvailableGroupsForSubject,
            getAdminQuizGroupsForSubject,
            setAdminQuizDraftAssignedGroup,
            ensureAdminExamUiState,
            captureAdminExamScrollSnapshot,
            restoreAdminExamScrollSnapshot,
            rerenderAdminExamSectionPreservingScroll,
            getActiveAdminQuizQuestion,
            setActiveAdminQuizQuestion,
            clampAdminQuizQuestionIndex,
            insertAdminQuizQuestionAt,
            insertAdminQuizQuestionRelative,
            moveAdminQuizQuestion,
            startAdminQuizQuestionDrag,
            allowAdminQuizQuestionDrop,
            endAdminQuizQuestionDrag,
            dropAdminQuizQuestionOnTarget,
            syncAdminQuizDraftSubject,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateStateAdminExamApi({});
})();
