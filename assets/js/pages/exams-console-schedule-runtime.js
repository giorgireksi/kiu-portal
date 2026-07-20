/* Exams schedule collision/PIN/export + local test helpers. Peeled from exams-console.js.
 * Load before exams-console.js.
 */
(function initExamsConsoleScheduleRuntime() {
    if (window.__KIU_EXAMS_CONSOLE_SCHEDULE_LOADED) return;
    window.__KIU_EXAMS_CONSOLE_SCHEDULE_LOADED = true;

    window.__kiuCreateExamsConsoleScheduleApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals / mutable deps at call time. */

function previewStudentExamPortal() {
    window.open('exam-portal.html', '_blank', 'noopener');
};

async function createLocalExamTestSession() {
    const now = new Date();
    const start = new Date(now.getTime() - 5 * 60 * 1000);
    const end = new Date(now.getTime() + 85 * 60 * 1000);
    const faculty = getCurrentFacultyCode();
    const authorName = getCurrentStaffName();
    const author = getCurrentUserSafe();
    const questions = [
        {
            id: makeLocalId('exam_q'),
            type: 'mcq',
            text: 'Which tool is most useful for organizing business data before analysis?',
            options: ['Advanced Excel', 'Photo editor', 'Video player', 'Music library'],
            correctOption: 0,
            score: 1
        },
        {
            id: makeLocalId('exam_q'),
            type: 'mcq',
            text: 'What should a Business Analyst document before recommending a solution?',
            options: ['Only the final grade', 'Current process and requirements', 'Personal preferences only', 'Unrelated policies'],
            correctOption: 1,
            score: 1
        },
        {
            id: makeLocalId('exam_q'),
            type: 'short',
            text: 'In one or two sentences, explain why evidence is important in a career or business recommendation.',
            options: [],
            correctOption: null,
            score: 3
        }
    ];
    const templateId = makeLocalId('exam_template');
    const template = {
        id: templateId,
        title: 'Local Test Computer Exam',
        faculty,
        subjectId: 'ECON-TEST',
        subjectName: 'Local Test Subject',
        variantLabel: 'Variant A',
        instructions: 'Answer each question carefully. This local session is created for anti-cheat portal testing.',
        status: 'approved',
        examType: 'digital',
        durationMinutes: 90,
        passingScore: 50,
        gradingWeight: 30,
        defaultQuestionScore: 1,
        defaultOptionCount: 4,
        questions: clone(questions),
        questionBank: clone(questions),
        variants: [{ id: makeLocalId('exam_variant'), label: 'Variant A', questions: clone(questions) }],
        createdBy: String(author?.id || author?.email || 'local-admin'),
        createdByName: authorName,
        approvedBy: authorName,
        approvedAt: now.toISOString(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
    };
    const activeUser = getCurrentUserSafe();
    const isDemoStudent = typeof isDemoOrTestingUserRecord === 'function'
        ? (user) => isDemoOrTestingUserRecord(user)
        : () => false;
    const studentUser = String(activeUser?.role || '').trim().toLowerCase() === 'student' && activeUser?.id && !isDemoStudent(activeUser)
        ? activeUser
        : (Array.isArray(KIU_STATE?.users)
            ? KIU_STATE.users.find((user) => String(user?.role || '').trim().toLowerCase() === 'student' && user?.id && !isDemoStudent(user))
            : null);
    if (!studentUser?.id) {
        notify('Add a real student account before creating a local exam test session.');
        return;
    }
    const student = {
        id: String(studentUser.id),
        email: String(studentUser.email || ''),
        name: String(studentUser.displayName || studentUser.nameEn || studentUser.name || studentUser.id),
        displayName: String(studentUser.displayName || studentUser.nameEn || studentUser.name || studentUser.id),
        groupId: String(studentUser.groupId || studentUser.group || 'local-test-group'),
        groupName: String(studentUser.groupName || studentUser.group || 'Assigned Group')
    };
    const session = {
        id: makeLocalId('exam_session'),
        templateId,
        templateSnapshotId: makeLocalId('exam_snapshot'),
        title: template.title,
        subjectId: template.subjectId,
        subjectName: template.subjectName,
        variantLabel: template.variantLabel,
        faculty,
        groupId: student.groupId,
        groupName: student.groupName,
        groupIds: [student.groupId],
        groupNames: [student.groupName],
        cohortKeys: [student.groupId],
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        durationMinutes: 90,
        status: 'scheduled',
        deliveryMode: 'Anti-cheat lab',
        instructions: template.instructions,
        placeLabel: 'KIU Computer Lab',
        roomLabel: 'Lab 301',
        locationLabel: 'KIU Computer Lab - Lab 301',
        observerNames: ['Local Test Observer'],
        observerNamesText: 'Local Test Observer',
        roomCapacity: 30,
        assignedStudentIds: [student.id],
        allowedStudentIds: [student.id],
        assignedStudents: [student],
        templateSnapshot: clone(template),
        createdBy: authorName,
        updatedAt: now.toISOString(),
        publishedAt: now.toISOString(),
        published: true
    };

    try {
        upsertTemplate(template);
        await upsertSession(session);
        runtime.scheduleDraft = createScheduleDraft();
        runtime.activeTab = 'schedule';
        notify('Local test session created for QA Student Alpha.');
        clearExamRegionCache();
        renderConsole('full');
    } catch (error) {
        notify('Could not create local test session: ' + (error?.message || 'Unknown error'));
    }
};

function toggleExamCohort(cohortKey, checked) {
    const draft = getScheduleDraft();
    const keys = new Set(draft.selectedCohortKeys || []);
    if (checked) keys.add(cohortKey); else keys.delete(cohortKey);
    draft.selectedCohortKeys = Array.from(keys);
    clearExamRegionCache('region:body');
    renderConsole('body');
};

function selectAllExamCohorts() {
    const draft = getScheduleDraft();
    const template = getTemplateById(draft.templateId);
    if (!template) return;
    const cohorts = buildSubjectAutoCohorts(template.subjectId);
    draft.selectedCohortKeys = cohorts.map(c => c.key);
    clearExamRegionCache('region:body');
    renderConsole('body');
};

function clearExamCohorts() {
    const draft = getScheduleDraft();
    draft.selectedCohortKeys = [];
    clearExamRegionCache('region:body');
    renderConsole('body');
};

function editExamSession(sessionId) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    runtime.scheduleDraft = createScheduleDraft(session);
    runtime.activeTab = 'schedule';
    clearExamRegionCache();
    renderConsole('full');
};

/* â”€â”€ Collision Detection Engine â”€â”€ */
function detectScheduleCollisions(draft, existingSessions) {
    const hard = [];
    const soft = [];
    if (!draft.startAt || !draft.endAt || !draft.templateId) return { hard, soft };
    const dStart = new Date(draft.startAt).getTime();
    const dEnd = new Date(draft.endAt).getTime();
    if (isNaN(dStart) || isNaN(dEnd)) return { hard, soft };
    const dRoom = String(draft.roomLabel || '').trim().toLowerCase();
    const selectedStudentIds = new Set(getSelectedStudentsForSchedule(draft, getTemplateById(draft.templateId)).map(s => s.id));
    (existingSessions || []).forEach(session => {
        if (session.id === draft.editingSessionId) return;
        const sStart = new Date(session.startAt).getTime();
        const sEnd = new Date(session.endAt).getTime();
        if (isNaN(sStart) || isNaN(sEnd)) return;
        const overlaps = dStart < sEnd && dEnd > sStart;
        if (!overlaps) return;
        /* Hard: Room collision */
        const sRoom = String(getSessionRoomLabel(session) || '').trim().toLowerCase();
        if (dRoom && sRoom && dRoom === sRoom) {
            hard.push(`Room "${draft.roomLabel}" is already booked by "${session.title || session.subjectName}" at this time.`);
        }
        /* Hard: Student collision */
        const sStudents = getAssignedStudentIds(session);
        const conflicts = sStudents.filter(id => selectedStudentIds.has(id));
        if (conflicts.length) {
            hard.push(`${conflicts.length} student(s) already have "${session.title || session.subjectName}" at the same time.`);
        }
        /* Soft: Observer/proctor collision */
        const dObservers = uniqueStrings(String(draft.observerNamesText || '').split(',').map(s => s.trim().toLowerCase()));
        const sObservers = getSessionObserverNames(session).map(n => n.toLowerCase());
        const proctorConflicts = dObservers.filter(n => n && sObservers.includes(n));
        if (proctorConflicts.length) {
            soft.push(`Proctor "${proctorConflicts[0]}" is assigned to "${session.title || session.subjectName}" at the same time.`);
        }
    });
    return { hard, soft };
}

/* â”€â”€ Exam PIN Generator â”€â”€ */
function generateExamPIN(draft) {
    const seed = String(draft.templateId || '') + String(draft.startAt || '') + String(draft.roomLabel || '');
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    return String(Math.abs(hash) % 10000).padStart(4, '0');
}

/* â”€â”€ Room Split Handler â”€â”€ */
function splitCohort(cohortKey) {
    const draft = getScheduleDraft();
    const template = getTemplateById(draft.templateId);
    if (!template) return;
    const cohorts = buildSubjectAutoCohorts(template.subjectId);
    const cohort = cohorts.find(c => c.key === cohortKey);
    if (!cohort) return;
    const keepCount = Math.max(1, runtime.splitStudentCount || parseInt(draft.roomCapacity, 10) || Math.ceil(cohort.students.length / 2));
    const overflowRoom = runtime.splitRoomLabel || `${draft.roomLabel || 'Room'} (Overflow)`;
    const overflowTime = runtime.splitTimeSlot || draft.startAt;
    notify(`Split: ${keepCount} students stay in ${draft.roomLabel || 'current room'}, ${cohort.students.length - keepCount} moved to ${overflowRoom}.`);
    runtime.splitStudentCount = 0;
    runtime.splitRoomLabel = '';
    runtime.splitTimeSlot = '';
    clearExamRegionCache('region:body');
    renderConsole('body');
};

/* â”€â”€ Publish / Unpublish Session â”€â”€ */
function publishExamSession(sessionId) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    session.published = true;
    session.publishedAt = new Date().toISOString();
    session.publishedBy = getCurrentStaffName();
    notify('Exam session published to students. Timetable updated.');
    clearExamRegionCache('region:body');
    renderConsole('body');
};

function unpublishExamSession(sessionId) {
    const sessions = getSessions();
    const session = sessions.find(s => s.id === sessionId);
    if (!session) return;
    session.published = false;
    notify('Exam session unpublished. Students can no longer see this session.');
    clearExamRegionCache('region:body');
    renderConsole('body');
};

/* Collision and split visuals now live in assets/css/exam-studio.css. */

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   QUIZ EXPORT â€” PDF & DOCX
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
const EXAMS_EXPORT_MODULE_URL = 'assets/js/pages/exams-console-export.js?v=20260715-examsexport1';
let examsExportModulePromise = null;

function hasExamsExportModule() {
    return Boolean(window.__KIU_EXAMS_EXPORT_MODULE_LOADED && typeof window.__kiuExportQuizAsImpl === 'function');
}

function ensureExamsExportModule() {
    if (hasExamsExportModule()) return Promise.resolve(true);
    if (examsExportModulePromise) return examsExportModulePromise;
    examsExportModulePromise = new Promise((resolve, reject) => {
        const existing = document.querySelector(`script[src="${EXAMS_EXPORT_MODULE_URL}"]`);
        const onLoad = () => hasExamsExportModule()
            ? resolve(true)
            : reject(new Error('Exams export module did not register export helpers.'));
        if (existing) {
            if (hasExamsExportModule()) { resolve(true); return; }
            existing.addEventListener('load', onLoad, { once: true });
            existing.addEventListener('error', () => reject(new Error('Exams export module failed to load.')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = EXAMS_EXPORT_MODULE_URL;
        script.defer = true;
        script.addEventListener('load', onLoad, { once: true });
        script.addEventListener('error', () => reject(new Error('Exams export module failed to load.')), { once: true });
        document.head.appendChild(script);
    }).catch((error) => {
        console.error('Failed to load deferred exams export module.', error);
        throw error;
    }).finally(() => {
        examsExportModulePromise = null;
    });
    return examsExportModulePromise;
}

        const api = {
            previewStudentExamPortal,
            createLocalExamTestSession,
            toggleExamCohort,
            selectAllExamCohorts,
            clearExamCohorts,
            editExamSession,
            detectScheduleCollisions,
            generateExamPIN,
            splitCohort,
            publishExamSession,
            unpublishExamSession,
            hasExamsExportModule,
            ensureExamsExportModule,
        };
        Object.assign(window, api);
        return api;
    };

    // Host installs with mutable deps bag; self-install for free-global mode.
    window.__kiuCreateExamsConsoleScheduleApi({});
})();

