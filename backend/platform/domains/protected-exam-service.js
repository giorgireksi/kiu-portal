const {
    asArray,
    clone,
    makeId,
    normalizeEmail,
    nowIso,
    safeNumber,
    uniqueStrings
} = require('../utils');

function collectConfiguredHostnames(...values) {
    return uniqueStrings(values.flatMap((value) => {
        try {
            const hostname = new URL(String(value || '').trim()).hostname;
            return hostname ? [hostname] : [];
        } catch (error) {
            return [];
        }
    }));
}

const DEFAULT_ANTI_CHEAT_BLOCKED_PROCESSES = [
    'TeamViewer.exe',
    'AnyDesk.exe',
    'Discord.exe',
    'obs64.exe',
    'obs32.exe',
    'Zoom.exe',
    'Skype.exe',
    'Cheat Engine.exe',
    'x64dbg.exe',
    'Wireshark.exe',
    'SnippingTool.exe',
    'ScreenClippingHost.exe',
    'discord',
    'obs',
    'wireshark',
    'anydesk',
    'teamviewer',
    'zoom',
    'x64dbg',
    'gdb'
];

const STRICT_ANTI_CHEAT_POLICY = {
    processScanning: true,
    clipboardClearing: true,
    focusProtection: true,
    inputBlocking: true,
    kioskMode: true,
    vmDetection: true,
    devToolsProtection: true,
    allowDebugTools: false,
    navigationProtection: true,
    securityDialogs: true,
    violationScreen: true,
    blockedProcesses: DEFAULT_ANTI_CHEAT_BLOCKED_PROCESSES,
    allowedDomains: [],
    heartbeatMs: 2000,
    processScanMs: 1500
};

function clampPolicyInterval(value, fallback, min, max) {
    const numeric = safeNumber(value, fallback);
    return Math.min(max, Math.max(min, numeric));
}

function normalizeAntiCheatPolicy(policy = {}, existing = {}) {
    const source = policy && typeof policy === 'object' ? policy : {};
    const prior = existing && typeof existing === 'object' ? existing : {};
    const withDefaults = {
        ...STRICT_ANTI_CHEAT_POLICY,
        ...prior,
        ...source
    };
    return {
        processScanning: withDefaults.processScanning !== false,
        clipboardClearing: withDefaults.clipboardClearing !== false,
        focusProtection: withDefaults.focusProtection !== false,
        inputBlocking: withDefaults.inputBlocking !== false,
        kioskMode: withDefaults.kioskMode !== false,
        vmDetection: withDefaults.vmDetection !== false,
        devToolsProtection: withDefaults.devToolsProtection !== false,
        allowDebugTools: withDefaults.allowDebugTools === true,
        navigationProtection: withDefaults.navigationProtection !== false,
        securityDialogs: withDefaults.securityDialogs !== false,
        violationScreen: withDefaults.violationScreen !== false,
        blockedProcesses: uniqueStrings(asArray(withDefaults.blockedProcesses).map(value => String(value || '').trim())).length
            ? uniqueStrings(asArray(withDefaults.blockedProcesses).map(value => String(value || '').trim()))
            : [...DEFAULT_ANTI_CHEAT_BLOCKED_PROCESSES],
        allowedDomains: uniqueStrings(asArray(withDefaults.allowedDomains).map(value => String(value || '').trim()).filter(Boolean)),
        heartbeatMs: clampPolicyInterval(withDefaults.heartbeatMs, STRICT_ANTI_CHEAT_POLICY.heartbeatMs, 1000, 60000),
        processScanMs: clampPolicyInterval(withDefaults.processScanMs, STRICT_ANTI_CHEAT_POLICY.processScanMs, 1000, 60000)
    };
}

function getAntiCheatPolicyDefaults() {
    const configured = this.state.meta?.antiCheatPolicyDefaults;
    return normalizeAntiCheatPolicy(configured || {});
}

function listAntiCheatPolicies() {
    const defaults = getAntiCheatPolicyDefaults.call(this);
    return Object.values(this.state.lmsCourses || {}).flatMap((course) =>
        asArray(course?.quizzes).map((quiz) => ({
            courseId: String(course.id || course.courseId || '').trim(),
            courseTitle: String(course.title || course.name || course.id || '').trim(),
            quizId: String(quiz?.id || '').trim(),
            title: String(quiz?.title || quiz?.name || 'Protected Quiz').trim(),
            status: String(quiz?.status || 'draft').trim(),
            antiCheatPolicy: normalizeAntiCheatPolicy(
                quiz?.antiCheatPolicyOverride === true ? quiz.antiCheatPolicy : defaults,
                defaults
            ),
            hasOverride: quiz?.antiCheatPolicyOverride === true
        })).filter((item) => item.courseId && item.quizId)
    );
}

function saveAntiCheatPolicySettings(payload = {}) {
    const scope = String(payload.scope || '').trim().toLowerCase();
    const defaults = getAntiCheatPolicyDefaults.call(this);
    const nextPolicy = normalizeAntiCheatPolicy(payload.antiCheatPolicy, defaults);
    if (scope === 'global') {
        this.state.meta = this.state.meta && typeof this.state.meta === 'object' ? this.state.meta : {};
        this.state.meta.antiCheatPolicyDefaults = nextPolicy;
        Object.values(this.state.lmsCourses || {}).forEach((course) => {
            asArray(course?.quizzes).forEach((quiz) => {
                if (quiz?.antiCheatPolicyOverride === true) return;
                quiz.antiCheatPolicy = clone(nextPolicy);
                quiz.updatedAt = nowIso();
            });
        });
        this.save();
        return { scope: 'global', antiCheatPolicy: clone(nextPolicy) };
    }
    if (scope !== 'quiz') return { error: 'A valid anti-cheat policy scope is required.', status: 400 };
    const courseId = String(payload.courseId || '').trim();
    const quizId = String(payload.quizId || '').trim();
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return { error: 'Protected quiz was not found.', status: 404 };
    const useGlobalDefaults = payload.useGlobalDefaults === true;
    record.quiz.antiCheatPolicyOverride = !useGlobalDefaults;
    record.quiz.antiCheatPolicy = clone(useGlobalDefaults ? defaults : nextPolicy);
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        scope: 'quiz',
        courseId,
        quizId,
        antiCheatPolicy: clone(record.quiz.antiCheatPolicy),
        hasOverride: record.quiz.antiCheatPolicyOverride === true
    };
}

function ensureProtectedQuizLaunch(ticket) {
    const key = String(ticket || '').trim();
    if (!key) return null;
    this.state.protectedQuizLaunches[key] = this.state.protectedQuizLaunches[key] || {
        ticket: key,
        createdAt: nowIso(),
        expiresAt: nowIso(),
        redeemedAt: '',
        clientSessionToken: '',
        courseId: '',
        quizId: '',
        studentId: '',
        studentName: '',
        clientType: 'desktop-app',
        securityLevel: 'desktop-locked',
        antiCheatPolicy: normalizeAntiCheatPolicy()
    };
    return this.state.protectedQuizLaunches[key];
}

function ensureProtectedClientSession(token) {
    const key = String(token || '').trim();
    if (!key) return null;
    this.state.protectedClientSessions[key] = this.state.protectedClientSessions[key] || {
        token: key,
        createdAt: nowIso(),
        expiresAt: nowIso(),
        lastSeenAt: nowIso(),
        active: true,
        courseId: '',
        quizId: '',
        studentId: '',
        studentName: '',
        clientType: 'desktop-app',
        securityLevel: 'desktop-locked',
        launchTicket: '',
        antiCheatPolicy: normalizeAntiCheatPolicy()
    };
    return this.state.protectedClientSessions[key];
}

function ensureExamPortalSession(token) {
    const key = String(token || '').trim();
    if (!key) return null;
    this.state.examPortalSessions[key] = this.state.examPortalSessions[key] || {
        token: key,
        createdAt: nowIso(),
        expiresAt: nowIso(),
        lastSeenAt: nowIso(),
        active: true,
        studentId: '',
        email: ''
    };
    return this.state.examPortalSessions[key];
}

function buildExamSessionCourseKey(sessionId) {
    return `exam-session::${String(sessionId || '').trim()}`;
}

function normalizeExamSessionStatus(status = 'scheduled') {
    const normalized = String(status || 'scheduled').trim().toLowerCase();
    return ['scheduled', 'live', 'closed'].includes(normalized) ? normalized : 'scheduled';
}

function normalizeExamSessionRecord(payload = {}, existing = {}) {
    const id = String(payload.id || existing.id || makeId('exam_session')).trim();
    const startAt = String(payload.startAt || existing.startAt || '').trim();
    const endAt = String(payload.endAt || existing.endAt || '').trim();
    const assignedStudents = asArray(payload.assignedStudents || existing.assignedStudents || payload.allowedStudents || existing.allowedStudents).map(student => ({
        id: String(student?.id || student?.studentId || '').trim(),
        name: String(student?.name || student?.studentName || '').trim(),
        email: String(student?.email || '').trim(),
        groupId: String(student?.groupId || '').trim(),
        groupName: String(student?.groupName || '').trim(),
        groupIds: uniqueStrings(asArray(student?.groupIds).concat(student?.groupId ? [student.groupId] : []).map(value => String(value || '').trim())),
        groupNames: uniqueStrings(asArray(student?.groupNames).concat(student?.groupName ? [student.groupName] : []).map(value => String(value || '').trim())),
        courseLabel: String(student?.courseLabel || '').trim(),
        courseLabels: uniqueStrings(asArray(student?.courseLabels).concat(student?.courseLabel ? [student.courseLabel] : []).map(value => String(value || '').trim()))
    })).filter(student => student.id);
    const assignedStudentIds = uniqueStrings(
        (assignedStudents.length ? assignedStudents.map(student => student.id) : asArray(payload.assignedStudentIds || existing.assignedStudentIds || payload.allowedStudentIds || existing.allowedStudentIds)).map(value => String(value || '').trim())
    );
    const allowedStudents = (assignedStudents.length ? assignedStudents : asArray(payload.allowedStudents || existing.allowedStudents)).map(student => ({
        id: String(student?.id || student?.studentId || '').trim(),
        name: String(student?.name || student?.studentName || '').trim(),
        email: String(student?.email || '').trim()
    })).filter(student => student.id);
    const allowedStudentIds = uniqueStrings(
        (assignedStudentIds.length ? assignedStudentIds : asArray(payload.allowedStudentIds || existing.allowedStudentIds)).map(value => String(value || '').trim())
    );
    const questions = asArray(payload.questions || payload.questionsSnapshot || existing.questions || existing.questionsSnapshot).map(question => ({
        id: String(question?.id || makeId('question')).trim(),
        type: ['written', 'short'].includes(String(question?.type || 'mcq').trim()) ? String(question?.type || 'mcq').trim() : 'mcq',
        text: String(question?.text || '').trim(),
        score: Math.max(1, safeNumber(question?.score, 1)),
        optionCount: Math.max(2, safeNumber(question?.optionCount, asArray(question?.options).length || 4)),
        options: asArray(question?.options).map(option => String(option || '').trim()),
        correctOption: question?.correctOption === null || question?.correctOption === undefined ? null : Math.max(0, safeNumber(question.correctOption, 0)),
        expectedAnswer: String(question?.expectedAnswer || '').trim()
    }));
    const groupIds = uniqueStrings(
        asArray(payload.groupIds || existing.groupIds)
            .concat(assignedStudents.flatMap(student => asArray(student.groupIds)))
            .concat(payload.groupId || existing.groupId || [])
            .map(value => String(value || '').trim())
    );
    const groupNames = uniqueStrings(
        asArray(payload.groupNames || existing.groupNames)
            .concat(assignedStudents.flatMap(student => asArray(student.groupNames)))
            .concat(payload.groupName || existing.groupName || [])
            .map(value => String(value || '').trim())
    );
    const observerSource = payload.observerNames !== undefined || payload.observerNamesText !== undefined
        ? (Array.isArray(payload.observerNames) ? payload.observerNames : String(payload.observerNamesText || payload.observerNames || '').split(','))
        : (Array.isArray(existing.observerNames) && existing.observerNames.length
            ? existing.observerNames
            : String(existing.observerNamesText || '').split(','));
    const observerNames = uniqueStrings(observerSource.map(value => String(value || '').trim()));
    const placeLabel = String(payload.placeLabel || existing.placeLabel || '').trim();
    const roomLabel = String(payload.roomLabel || existing.roomLabel || '').trim();
    const locationLabel = String(payload.locationLabel || existing.locationLabel || [placeLabel, roomLabel].filter(Boolean).join(' - ')).trim();
    return {
        id,
        faculty: String(payload.faculty || existing.faculty || '').trim().toUpperCase(),
        templateId: String(payload.templateId || existing.templateId || '').trim(),
        templateSnapshotId: String(payload.templateSnapshotId || existing.templateSnapshotId || makeId('exam_snapshot')).trim(),
        title: String(payload.title || existing.title || 'Scheduled Exam').trim(),
        subjectId: String(payload.subjectId || existing.subjectId || '').trim(),
        subjectName: String(payload.subjectName || existing.subjectName || '').trim(),
        variantLabel: String(payload.variantLabel || existing.variantLabel || '').trim(),
        groupId: String(payload.groupId || existing.groupId || groupIds[0] || '').trim(),
        groupName: String(payload.groupName || existing.groupName || groupNames[0] || '').trim(),
        groupIds,
        groupNames,
        startAt,
        endAt,
        durationMinutes: Math.max(1, safeNumber(payload.durationMinutes, existing.durationMinutes || 60)),
        status: normalizeExamSessionStatus(payload.status || existing.status || 'scheduled'),
        deliveryMode: String(payload.deliveryMode || existing.deliveryMode || 'anti-cheat-lab').trim(),
        instructions: String(payload.instructions || existing.instructions || '').trim(),
        placeLabel,
        roomLabel,
        locationLabel,
        observerNames,
        observerNamesText: String(payload.observerNamesText || existing.observerNamesText || observerNames.join(', ')).trim(),
        suspendsClasses: payload.suspendsClasses === undefined ? existing.suspendsClasses !== false : payload.suspendsClasses !== false,
        assignedStudentIds,
        assignedStudents: assignedStudents.length ? assignedStudents : asArray(existing.assignedStudents),
        allowedStudentIds,
        allowedStudents: allowedStudents.length ? allowedStudents : asArray(existing.allowedStudents),
        questionsSnapshot: questions,
        questions,
        createdAt: String(existing.createdAt || payload.createdAt || nowIso()).trim(),
        updatedAt: nowIso(),
        publishedAt: String(payload.publishedAt || existing.publishedAt || '').trim(),
        publishedBy: String(payload.publishedBy || existing.publishedBy || '').trim(),
        protectedCourseId: String(payload.protectedCourseId || existing.protectedCourseId || buildExamSessionCourseKey(id)).trim(),
        protectedQuizId: String(payload.protectedQuizId || existing.protectedQuizId || id).trim(),
        antiCheatPolicy: normalizeAntiCheatPolicy(payload.antiCheatPolicy, existing.antiCheatPolicy)
    };
}

function syncExamSession(payload = {}) {
    const session = normalizeExamSessionRecord(payload, this.state.examSessions[String(payload.id || '').trim()] || {});
    if (!session.id || !session.subjectId || !session.assignedStudentIds.length) return null;
    this.state.examSessions[session.id] = session;
    syncProtectedQuiz.call(this, {
        id: session.protectedQuizId,
        quizId: session.protectedQuizId,
        courseId: session.protectedCourseId,
        resourceKey: session.protectedCourseId,
        groupKey: session.groupIds[0] || session.groupId || session.subjectId || session.id,
        title: session.title,
        assessmentType: 'exam',
        status: 'published',
        publishedAt: session.publishedAt || session.updatedAt,
        publishedBy: session.publishedBy || '',
        availableFrom: session.startAt,
        availableUntil: session.endAt,
        durationMinutes: session.durationMinutes,
        instructions: session.instructions,
        questions: session.questionsSnapshot,
        allowedStudentIds: session.allowedStudentIds,
        allowedStudents: session.allowedStudents,
        deliveryMode: 'exam-session',
        examSessionId: session.id,
        templateSnapshotId: session.templateSnapshotId,
        antiCheatPolicy: session.antiCheatPolicy
    });
    this.save();
    return clone(session);
}

function getExamSession(sessionId) {
    const key = String(sessionId || '').trim();
    if (!key) return null;
    return clone(this.state.examSessions[key] || null);
}

function deriveExamSessionRuntimeStatus(session = {}) {
    const now = Date.now();
    const startAt = session.startAt ? new Date(session.startAt).getTime() : 0;
    const endAt = session.endAt ? new Date(session.endAt).getTime() : 0;
    if (endAt && endAt <= now) return 'closed';
    if (startAt && startAt <= now) return 'live';
    return normalizeExamSessionStatus(session.status || 'scheduled');
}

function listExamSessionsForStudent(studentId) {
    const targetStudentId = String(studentId || '').trim();
    if (!targetStudentId) return [];
    return Object.values(this.state.examSessions || {})
        .filter(session => {
            const assignedIds = asArray(session?.assignedStudentIds).length ? asArray(session.assignedStudentIds) : asArray(session?.allowedStudentIds);
            return assignedIds.includes(targetStudentId);
        })
        .map(session => {
            const record = clone(session) || {};
            record.runtimeStatus = deriveExamSessionRuntimeStatus(record);
            record.studentAssignment = asArray(record.assignedStudents).find(student => String(student?.id || '') === targetStudentId) || null;
            return record;
        })
        .sort((left, right) => String(left.startAt || '').localeCompare(String(right.startAt || '')));
}

function getExamPortalSession(token, options = {}) {
    const key = String(token || '').trim();
    if (!key) return null;
    const session = this.state.examPortalSessions[key];
    if (!session || session.active === false) return null;
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
        session.active = false;
        session.updatedAt = nowIso();
        this.save();
        return null;
    }
    if (options.touch !== false) {
        session.lastSeenAt = nowIso();
        session.updatedAt = session.lastSeenAt;
        this.save();
    }
    return session;
}

function createExamPortalSession(payload = {}) {
    const email = normalizeEmail(payload.email || '');
    const studentId = String(payload.studentId || '').trim();
    if (!email || !studentId) return { error: 'Email and student id are required.', status: 400 };
    if (String(payload.authenticatedUserId || '').trim() !== studentId) {
        return { error: 'An authenticated student portal session is required.', status: 401 };
    }
    const account = this.getAccountByEmail(email);
    if (!account || String(account.id || '').trim() !== studentId) {
        return { error: 'The email and student id do not match an exam account.', status: 404 };
    }
    if (String(account.role || '').trim().toLowerCase() !== 'student') {
        return { error: 'Only student accounts may use the exam portal.', status: 403 };
    }
    const token = makeId('exam_portal');
    const session = ensureExamPortalSession.call(this, token);
    session.studentId = studentId;
    session.email = email;
    session.createdAt = nowIso();
    session.lastSeenAt = session.createdAt;
    session.updatedAt = session.createdAt;
    session.expiresAt = new Date(Date.now() + (12 * 60 * 60 * 1000)).toISOString();
    session.active = true;
    this.save();
    return {
        token,
        student: clone(account),
        sessions: listExamSessionsForStudent.call(this, studentId)
    };
}

function listExamPortalVisibleSessions(token) {
    const portalSession = getExamPortalSession.call(this, token);
    if (!portalSession) return null;
    return {
        studentId: portalSession.studentId,
        sessions: listExamSessionsForStudent.call(this, portalSession.studentId)
    };
}

function getExamPortalSessionSummary(sessionId, token = '') {
    const examSession = getExamSession.call(this, sessionId);
    if (!examSession) return null;
    const portalSession = token ? getExamPortalSession.call(this, token) : null;
    const targetStudentId = String(portalSession?.studentId || '').trim();
    const allowedIds = asArray(examSession.assignedStudentIds).length ? asArray(examSession.assignedStudentIds) : asArray(examSession.allowedStudentIds);
    if (portalSession && !allowedIds.includes(targetStudentId)) {
        return null;
    }
    const attempt = findProtectedQuizRecord.call(this, examSession.protectedCourseId, examSession.protectedQuizId)?.quiz?.attempts?.[portalSession?.studentId || ''] || null;
    const studentAssignment = targetStudentId
        ? asArray(examSession.assignedStudents).find(student => String(student?.id || '') === targetStudentId) || null
        : null;
    return {
        id: examSession.id,
        title: examSession.title,
        subjectId: examSession.subjectId,
        subjectName: examSession.subjectName,
        variantLabel: examSession.variantLabel,
        groupId: examSession.groupId,
        groupName: examSession.groupName,
        groupIds: clone(examSession.groupIds || []),
        groupNames: clone(examSession.groupNames || []),
        startAt: examSession.startAt,
        endAt: examSession.endAt,
        durationMinutes: examSession.durationMinutes,
        status: deriveExamSessionRuntimeStatus(examSession),
        templateSnapshotId: examSession.templateSnapshotId,
        deliveryMode: examSession.deliveryMode,
        instructions: examSession.instructions,
        placeLabel: examSession.placeLabel,
        roomLabel: examSession.roomLabel,
        locationLabel: examSession.locationLabel,
        observerNames: clone(examSession.observerNames || []),
        studentAssignment: studentAssignment ? clone(studentAssignment) : null,
        attempt: attempt ? clone(attempt) : null
    };
}

function createExamPortalLaunchTicket(sessionId, payload = {}) {
    const examSession = this.state.examSessions[String(sessionId || '').trim()];
    if (!examSession) return { error: 'Exam session was not found.', status: 404 };
    const portalSession = getExamPortalSession.call(this, payload.token || '');
    if (!portalSession) return { error: 'Exam portal session is invalid or expired.', status: 401 };
    const allowedIds = asArray(examSession.assignedStudentIds).length ? asArray(examSession.assignedStudentIds) : asArray(examSession.allowedStudentIds);
    if (!allowedIds.includes(String(portalSession.studentId || '').trim())) {
        return { error: 'This student is not assigned to the requested exam.', status: 403 };
    }
    const runtimeStatus = deriveExamSessionRuntimeStatus(examSession);
    if (runtimeStatus !== 'live') {
        return { error: 'This exam is not open for launch yet.', status: 409 };
    }
    const account = this.getAccountById(portalSession.studentId) || this.getAccountByEmail(portalSession.email);
    const result = createProtectedQuizLaunchTicket.call(this, {
        courseId: examSession.protectedCourseId,
        resourceKey: examSession.protectedCourseId,
        quizId: examSession.protectedQuizId,
        actorUserId: portalSession.studentId,
        studentName: account?.displayName || account?.nameEn || account?.name || `Student ${portalSession.studentId}`,
        clientType: String(payload.clientType || 'desktop-app').trim() || 'desktop-app',
        securityLevel: String(payload.securityLevel || 'desktop-locked').trim() || 'desktop-locked'
    });
    if (!result || result?.error) return result || { error: 'Exam launch could not be created.', status: 400 };
    return {
        ...result,
        session: getExamPortalSessionSummary.call(this, examSession.id, portalSession.token)
    };
}

function findProtectedQuizRecord(courseId, quizId) {
    const key = String(courseId || '').trim();
    const normalizedQuizId = String(quizId || '').trim();
    if (!key || !normalizedQuizId) return null;
    const lmsCourse = this.ensureLmsCourse(key);
    if (!lmsCourse) return null;
    const index = lmsCourse.quizzes.findIndex(item => String(item?.id || '').trim() === normalizedQuizId);
    if (index === -1) return null;
    return { lmsCourse, index, quiz: lmsCourse.quizzes[index] };
}

function ensureProtectedQuizAttemptRecord(quiz, student = {}) {
    if (!quiz || typeof quiz !== 'object') return null;
    const studentId = String(student.studentId || student.id || '').trim();
    if (!studentId) return null;
    quiz.attempts = quiz.attempts && typeof quiz.attempts === 'object' ? quiz.attempts : {};
    const existing = quiz.attempts[studentId] && typeof quiz.attempts[studentId] === 'object' ? quiz.attempts[studentId] : {};
    quiz.attempts[studentId] = {
        studentId,
        studentName: String(student.studentName || student.name || existing.studentName || `Student ${studentId}`).trim(),
        clientType: String(student.clientType || existing.clientType || '').trim() || 'desktop-app',
        securityLevel: String(student.securityLevel || existing.securityLevel || '').trim() || 'desktop-locked',
        status: String(student.status || existing.status || 'not-started').trim(),
        antiCheatConnected: student.antiCheatConnected === true || existing.antiCheatConnected === true,
        blocked: student.blocked === true || existing.blocked === true,
        warningCount: Math.max(0, safeNumber(student.warningCount, existing.warningCount || 0)),
        violationCount: Math.max(0, safeNumber(student.violationCount, existing.violationCount || 0)),
        lastHeartbeatAt: String(student.lastHeartbeatAt || existing.lastHeartbeatAt || '').trim(),
        disconnectAccumulatedMs: Math.max(0, safeNumber(student.disconnectAccumulatedMs, existing.disconnectAccumulatedMs || 0)),
        lastEvent: clone(student.lastEvent || existing.lastEvent || null),
        autoScoreRaw: safeNumber(student.autoScoreRaw, existing.autoScoreRaw || 0),
        manualScoreRaw: safeNumber(student.manualScoreRaw, existing.manualScoreRaw || 0),
        finalScoreRaw: student.finalScoreRaw === null || student.finalScoreRaw === undefined
            ? (existing.finalScoreRaw === null || existing.finalScoreRaw === undefined ? null : safeNumber(existing.finalScoreRaw, 0))
            : safeNumber(student.finalScoreRaw, 0),
        gradebookScore: student.gradebookScore === null || student.gradebookScore === undefined
            ? (existing.gradebookScore === null || existing.gradebookScore === undefined ? null : safeNumber(existing.gradebookScore, 0))
            : safeNumber(student.gradebookScore, 0),
        requiresManualReview: student.requiresManualReview === true || existing.requiresManualReview === true,
        submitReason: String(student.submitReason || existing.submitReason || '').trim(),
        startedAt: String(student.startedAt || existing.startedAt || '').trim(),
        submittedAt: String(student.submittedAt || existing.submittedAt || '').trim(),
        gradedAt: String(student.gradedAt || existing.gradedAt || '').trim(),
        reviewedBy: String(student.reviewedBy || existing.reviewedBy || '').trim(),
        clientSessionToken: String(student.clientSessionToken || existing.clientSessionToken || '').trim(),
        reconnectApprovedAt: String(student.reconnectApprovedAt || existing.reconnectApprovedAt || '').trim(),
        overrideStatus: String(student.overrideStatus || existing.overrideStatus || '').trim(),
        appliedAntiCheatPolicy: student.appliedAntiCheatPolicy
            ? normalizeAntiCheatPolicy(student.appliedAntiCheatPolicy, existing.appliedAntiCheatPolicy)
            : (existing.appliedAntiCheatPolicy ? normalizeAntiCheatPolicy(existing.appliedAntiCheatPolicy) : null),
        answers: clone(student.answers || existing.answers || {}),
        questionResults: Array.isArray(student.questionResults)
            ? clone(student.questionResults)
            : (Array.isArray(existing.questionResults) ? existing.questionResults : []),
        responseSummary: clone(student.responseSummary || existing.responseSummary || null),
        auditTrail: Array.isArray(student.auditTrail)
            ? clone(student.auditTrail)
            : (Array.isArray(existing.auditTrail) ? existing.auditTrail : [])
    };
    return quiz.attempts[studentId];
}

function redactProtectedQuizForStudent(quiz, studentId = '') {
    const normalizedStudentId = String(studentId || '').trim();
    const safeQuiz = clone(quiz || {}) || {};
    safeQuiz.questions = Array.isArray(safeQuiz.questions)
        ? safeQuiz.questions.map(question => {
            const safeQuestion = { ...(question || {}) };
            delete safeQuestion.correctOption;
            delete safeQuestion.expectedAnswer;
            delete safeQuestion.correctAnswer;
            return safeQuestion;
        })
        : [];
    safeQuiz.attempts = normalizedStudentId && safeQuiz.attempts?.[normalizedStudentId]
        ? { [normalizedStudentId]: clone(safeQuiz.attempts[normalizedStudentId]) }
        : {};
    if (safeQuiz.attempts[normalizedStudentId]) {
        delete safeQuiz.attempts[normalizedStudentId].clientSessionToken;
    }
    return safeQuiz;
}

function redactProtectedAttemptForStudent(attempt = null) {
    const safeAttempt = clone(attempt || null);
    if (safeAttempt && typeof safeAttempt === 'object') {
        delete safeAttempt.clientSessionToken;
    }
    return safeAttempt;
}

function calculateProtectedQuizResult(quiz = {}, submittedAnswers = {}) {
    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
    const answers = submittedAnswers && typeof submittedAnswers === 'object' ? submittedAnswers : {};
    const normalizedAnswers = {};
    const questionResults = [];
    let correctCount = 0;
    Object.entries(answers).forEach(([questionId, submitted]) => {
        const question = questions.find(item => String(item?.id || '').trim() === String(questionId || '').trim());
        if (!question) return;
        const selectedOption = submitted && typeof submitted === 'object'
            ? submitted.selectedOption
            : submitted;
        const correct = Number(selectedOption) === Number(question.correctOption);
        normalizedAnswers[question.id] = {
            selectedOption: Number.isFinite(Number(selectedOption)) ? Number(selectedOption) : null
        };
        questionResults.push({
            questionId: question.id,
            selectedOption: normalizedAnswers[question.id].selectedOption,
            correct
        });
        if (correct) correctCount += 1;
    });
    const score = questions.length
        ? Math.round((correctCount / questions.length) * 10000) / 100
        : 0;
    return {
        answers: normalizedAnswers,
        questionResults,
        score,
        responseSummary: {
            answeredCount: questionResults.length,
            correctCount,
            totalQuestions: questions.length,
            score
        }
    };
}

function buildProtectedQuizClientUrl(courseId, quizId) {
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (record?.quiz?.deliveryMode === 'exam-session' || record?.quiz?.examSessionId) {
        const base = `${this.appUrl.replace(/\/$/, '')}/exam-portal.html`;
        const params = new URLSearchParams({
            protectedCourseKey: String(courseId || '').trim(),
            protectedQuizId: String(quizId || '').trim(),
            mode: 'protected'
        });
        if (record.quiz.examSessionId) params.set('sessionId', String(record.quiz.examSessionId).trim());
        if (record.quiz.templateSnapshotId) params.set('templateSnapshotId', String(record.quiz.templateSnapshotId).trim());
        return `${base}?${params.toString()}`;
    }
    const base = `${this.appUrl.replace(/\/$/, '')}/lms.html`;
    return `${base}?protectedCourseKey=${encodeURIComponent(String(courseId || '').trim())}&protectedQuizId=${encodeURIComponent(String(quizId || '').trim())}`;
}

function syncProtectedQuiz(payload = {}) {
    const courseId = String(payload.courseId || payload.resourceKey || '').trim();
    const quizId = String(payload.quizId || payload.id || '').trim();
    if (!courseId || !quizId) return null;
    const lmsCourse = this.ensureLmsCourse(courseId);
    if (!lmsCourse) return null;
    const existing = findProtectedQuizRecord.call(this, courseId, quizId)?.quiz || null;
    const allowedStudents = asArray(payload.allowedStudents).map(student => ({
        id: String(student?.id || student?.studentId || '').trim(),
        name: String(student?.name || student?.studentName || '').trim(),
        email: String(student?.email || '').trim()
    })).filter(student => student.id);
    const allowedStudentIds = uniqueStrings(
        (allowedStudents.length ? allowedStudents.map(student => student.id) : asArray(payload.allowedStudentIds)).map(value => String(value || '').trim())
    );
    const nextQuiz = {
        ...(existing || {}),
        id: quizId,
        courseId,
        groupKey: String(payload.groupKey || payload.resourceKey || courseId).trim(),
        title: String(payload.title || existing?.title || 'Protected Quiz').trim(),
        assessmentType: String(payload.assessmentType || existing?.assessmentType || 'quiz').trim() || 'quiz',
        assessmentNumber: Math.max(1, safeNumber(payload.assessmentNumber, existing?.assessmentNumber || 1)),
        status: String(payload.status || existing?.status || 'published').trim() || 'published',
        publishedAt: String(payload.publishedAt || existing?.publishedAt || nowIso()).trim(),
        publishedBy: String(payload.publishedBy || existing?.publishedBy || '').trim(),
        availableFrom: String(payload.availableFrom || existing?.availableFrom || '').trim(),
        availableUntil: String(payload.availableUntil || existing?.availableUntil || '').trim(),
        durationMinutes: Math.max(1, safeNumber(payload.durationMinutes, existing?.durationMinutes || 20)),
        instructions: String(payload.instructions || existing?.instructions || '').trim(),
        questions: Array.isArray(payload.questions)
            ? clone(payload.questions)
            : (Array.isArray(existing?.questions) ? clone(existing.questions) : []),
        deliveryMode: String(payload.deliveryMode || existing?.deliveryMode || 'lms-quiz').trim() || 'lms-quiz',
        examSessionId: String(payload.examSessionId || existing?.examSessionId || '').trim(),
        templateSnapshotId: String(payload.templateSnapshotId || existing?.templateSnapshotId || '').trim(),
        protectedDelivery: payload.protectedDelivery !== false,
        monitoringEnabled: payload.monitoringEnabled !== false,
        requiresDesktopClient: payload.requiresDesktopClient !== false,
        installUrl: String(payload.installUrl || existing?.installUrl || `${this.backendUrl.replace(/\/$/, '')}/download`).trim(),
        allowedPlatforms: uniqueStrings(asArray(payload.allowedPlatforms || existing?.allowedPlatforms || ['windows', 'macos', 'linux'])),
        antiCheatPolicy: normalizeAntiCheatPolicy(
            payload.antiCheatPolicy,
            existing?.antiCheatPolicy || getAntiCheatPolicyDefaults.call(this)
        ),
        antiCheatPolicyOverride: payload.antiCheatPolicyOverride === true || existing?.antiCheatPolicyOverride === true,
        allowedStudentIds,
        allowedStudents: allowedStudents.length ? allowedStudents : asArray(existing?.allowedStudents || []),
        createdAt: String(existing?.createdAt || payload.createdAt || nowIso()).trim(),
        updatedAt: nowIso(),
        attempts: existing?.attempts && typeof existing.attempts === 'object' ? existing.attempts : {}
    };
    allowedStudentIds.forEach(studentId => {
        const snapshot = nextQuiz.allowedStudents.find(student => student.id === studentId) || {};
        ensureProtectedQuizAttemptRecord(nextQuiz, {
            studentId,
            studentName: snapshot.name || `Student ${studentId}`,
            clientType: 'desktop-app',
            securityLevel: 'desktop-locked'
        });
    });
    const existingRecord = findProtectedQuizRecord.call(this, courseId, quizId);
    if (existingRecord) {
        lmsCourse.quizzes[existingRecord.index] = nextQuiz;
    } else {
        lmsCourse.quizzes.unshift(nextQuiz);
    }
    lmsCourse.updatedAt = nowIso();
    this.save();
    return clone(nextQuiz);
}

function getProtectedQuiz(courseId, quizId) {
    return clone(findProtectedQuizRecord.call(this, courseId, quizId)?.quiz || null);
}

function getProtectedClientSession(clientSessionToken, options = {}) {
    const token = String(clientSessionToken || '').trim();
    if (!token) return null;
    const session = this.state.protectedClientSessions[token];
    if (!session || session.active === false) return null;
    if (session.expiresAt && new Date(session.expiresAt).getTime() <= Date.now()) {
        session.active = false;
        session.updatedAt = nowIso();
        this.save();
        return null;
    }
    if (options.touch !== false) {
        session.lastSeenAt = nowIso();
        session.updatedAt = session.lastSeenAt;
        this.save();
    }
    return session;
}

function revokeProtectedClientSessions(courseId, quizId, studentId, exceptToken = '', reason = 'Protected quiz session was revoked.') {
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedQuizId = String(quizId || '').trim();
    const normalizedStudentId = String(studentId || '').trim();
    const keepToken = String(exceptToken || '').trim();
    if (!normalizedCourseId || !normalizedQuizId || !normalizedStudentId) return 0;
    const record = findProtectedQuizRecord.call(this, normalizedCourseId, normalizedQuizId);
    let revokedCount = 0;
    Object.values(this.state.protectedClientSessions || {}).forEach(session => {
        if (!session || typeof session !== 'object') return;
        if (session.active === false) return;
        if (String(session.token || '').trim() === keepToken) return;
        if (String(session.courseId || '').trim() !== normalizedCourseId) return;
        if (String(session.quizId || '').trim() !== normalizedQuizId) return;
        if (String(session.studentId || '').trim() !== normalizedStudentId) return;
        session.active = false;
        session.updatedAt = nowIso();
        session.lastSeenAt = session.updatedAt;
        revokedCount += 1;
    });
    if (revokedCount && record?.quiz) {
        const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
            studentId: normalizedStudentId,
            antiCheatConnected: false
        });
        attempt.lastEvent = {
            type: 'session-revoked',
            note: reason,
            createdAt: nowIso()
        };
        attempt.auditTrail = Array.isArray(attempt.auditTrail) ? attempt.auditTrail : [];
        attempt.auditTrail.unshift({
            id: makeId('pq_evt'),
            type: 'session-revoked',
            note: reason,
            createdAt: attempt.lastEvent.createdAt
        });
        record.quiz.updatedAt = nowIso();
        record.lmsCourse.updatedAt = nowIso();
    }
    if (revokedCount) this.save();
    return revokedCount;
}

function getProtectedClientAttempt(courseId, quizId, clientSessionToken) {
    const session = getProtectedClientSession.call(this, clientSessionToken, { touch: false });
    if (!session) return null;
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return null;
    if (String(session.courseId) !== String(courseId) || String(session.quizId) !== String(quizId)) return null;
    session.lastSeenAt = nowIso();
    session.updatedAt = session.lastSeenAt;
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId: session.studentId,
        studentName: session.studentName,
        clientType: session.clientType,
        securityLevel: session.securityLevel,
        clientSessionToken
    });
    record.quiz.updatedAt = nowIso();
    this.save();
    return {
        quiz: redactProtectedQuizForStudent(record.quiz, session.studentId),
        attempt: redactProtectedAttemptForStudent(attempt),
        session: clone(session)
    };
}

function createProtectedQuizLaunchTicket(payload = {}) {
    const courseId = String(payload.courseId || payload.resourceKey || '').trim();
    const quizId = String(payload.quizId || '').trim();
    const studentId = String(payload.actorUserId || '').trim();
    if (!courseId || !quizId || !studentId) return null;
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return null;
    if (!asArray(record.quiz.allowedStudentIds).includes(studentId)) {
        return { error: 'This student is not allowed to launch this protected quiz.', status: 403 };
    }
    const studentSnapshot = asArray(record.quiz.allowedStudents).find(student => String(student?.id || '').trim() === studentId) || {};
    const launchTicket = makeId('pq_launch');
    const launch = ensureProtectedQuizLaunch.call(this, launchTicket);
    launch.courseId = courseId;
    launch.quizId = quizId;
    launch.studentId = studentId;
    launch.studentName = String(payload.studentName || studentSnapshot.name || `Student ${studentId}`).trim();
    launch.clientType = String(payload.clientType || 'desktop-app').trim() || 'desktop-app';
    launch.securityLevel = String(payload.securityLevel || 'desktop-locked').trim() || 'desktop-locked';
    launch.antiCheatPolicy = normalizeAntiCheatPolicy(record.quiz.antiCheatPolicy);
    launch.createdAt = nowIso();
    launch.expiresAt = new Date(Date.now() + (5 * 60 * 1000)).toISOString();
    launch.redeemedAt = '';
    launch.clientSessionToken = '';
    ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId,
        studentName: launch.studentName,
        clientType: launch.clientType,
        securityLevel: launch.securityLevel,
        status: 'not-started'
    });
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId,
        studentName: launch.studentName,
        clientType: launch.clientType,
        securityLevel: launch.securityLevel,
        status: 'not-started'
    });
    attempt.lastEvent = {
        type: 'launch-requested',
        note: 'Protected quiz launch was requested from the LMS.',
        createdAt: launch.createdAt
    };
    attempt.auditTrail = Array.isArray(attempt.auditTrail) ? attempt.auditTrail : [];
    attempt.auditTrail.unshift({
        id: makeId('pq_evt'),
        type: 'launch-requested',
        note: 'Protected quiz launch was requested from the LMS.',
        createdAt: launch.createdAt
    });
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        ticket: launch.ticket,
        launchUrl: `anticheat://launch?ticket=${encodeURIComponent(launch.ticket)}&backendUrl=${encodeURIComponent(this.backendUrl)}`,
        expiresAt: launch.expiresAt,
        quiz: redactProtectedQuizForStudent(record.quiz, studentId)
    };
}

function redeemProtectedQuizLaunch(payload = {}) {
    const ticket = String(payload.ticket || '').trim();
    if (!ticket) return { error: 'Launch ticket is required.', status: 400 };
    const launch = this.state.protectedQuizLaunches[ticket];
    if (!launch) return { error: 'Launch ticket was not found.', status: 404 };
    if (launch.redeemedAt) return { error: 'Launch ticket was already redeemed.', status: 409 };
    if (launch.expiresAt && new Date(launch.expiresAt).getTime() <= Date.now()) return { error: 'Launch ticket expired.', status: 410 };
    const record = findProtectedQuizRecord.call(this, launch.courseId, launch.quizId);
    if (!record?.quiz) return { error: 'Protected quiz no longer exists.', status: 404 };
    revokeProtectedClientSessions.call(
        this,
        launch.courseId,
        launch.quizId,
        launch.studentId,
        '',
        'Previous protected quiz session was closed because a newer launch was redeemed.'
    );
    const clientSessionToken = makeId('pq_client');
    const session = ensureProtectedClientSession.call(this, clientSessionToken);
    session.courseId = launch.courseId;
    session.quizId = launch.quizId;
    session.studentId = launch.studentId;
    session.studentName = launch.studentName;
    session.clientType = launch.clientType || 'desktop-app';
    session.securityLevel = launch.securityLevel || 'desktop-locked';
    session.launchTicket = ticket;
    session.antiCheatPolicy = normalizeAntiCheatPolicy(launch.antiCheatPolicy, record.quiz.antiCheatPolicy);
    session.createdAt = nowIso();
    session.lastSeenAt = session.createdAt;
    session.expiresAt = new Date(Date.now() + (12 * 60 * 60 * 1000)).toISOString();
    session.active = true;
    launch.redeemedAt = session.createdAt;
    launch.clientSessionToken = clientSessionToken;
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId: launch.studentId,
        studentName: launch.studentName,
        clientType: session.clientType,
        securityLevel: session.securityLevel,
        clientSessionToken,
        appliedAntiCheatPolicy: session.antiCheatPolicy,
        antiCheatConnected: true,
        lastHeartbeatAt: session.createdAt,
        startedAt: session.createdAt,
        status: ['submitted', 'auto-submitted', 'graded'].includes(String(record.quiz.attempts?.[launch.studentId]?.status || '').trim())
            ? String(record.quiz.attempts?.[launch.studentId]?.status || 'not-started').trim()
            : 'in-progress'
    });
    attempt.lastEvent = {
        type: 'launch-redeemed',
        note: 'Protected quiz session was opened in the anti-cheat app.',
        createdAt: session.createdAt
    };
    attempt.auditTrail = Array.isArray(attempt.auditTrail) ? attempt.auditTrail : [];
    attempt.auditTrail.unshift({
        id: makeId('pq_evt'),
        type: 'launch-redeemed',
        note: 'Protected quiz session was opened in the anti-cheat app.',
        createdAt: session.createdAt
    });
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    const antiCheatPolicy = normalizeAntiCheatPolicy(session.antiCheatPolicy, record.quiz.antiCheatPolicy);
    const allowedDomains = uniqueStrings([
        ...collectConfiguredHostnames(this.appUrl, this.backendUrl),
        ...asArray(antiCheatPolicy.allowedDomains).map(item => String(item || '').trim()),
        ...uniqueStrings(String(process.env.KIU_PROTECTED_QUIZ_ALLOWED_DOMAINS || '').split(',').map(item => String(item || '').trim())),
        '127.0.0.1',
        'localhost'
    ]);
    antiCheatPolicy.allowedDomains = allowedDomains;
    return {
        quizSessionUrl: buildProtectedQuizClientUrl.call(this, launch.courseId, launch.quizId),
        clientSessionToken,
        allowedDomains,
        antiCheatPolicy,
        reportingUrl: `${this.backendUrl}/api/protected-quizzes/${encodeURIComponent(launch.quizId)}/events?courseId=${encodeURIComponent(launch.courseId)}`,
        heartbeatUrl: `${this.backendUrl}/api/protected-quizzes/${encodeURIComponent(launch.quizId)}/heartbeat?courseId=${encodeURIComponent(launch.courseId)}`,
        studentIdentity: {
            id: launch.studentId,
            name: launch.studentName
        },
        quiz: redactProtectedQuizForStudent(record.quiz, launch.studentId),
        attempt: redactProtectedAttemptForStudent(attempt)
    };
}

function heartbeatProtectedQuiz(payload = {}) {
    const courseId = String(payload.courseId || payload.resourceKey || '').trim();
    const quizId = String(payload.quizId || '').trim();
    const clientSessionToken = String(payload.clientSessionToken || '').trim();
    if (!courseId || !quizId || !clientSessionToken) return null;
    const current = getProtectedClientAttempt.call(this, courseId, quizId, clientSessionToken);
    if (!current?.attempt || !current?.session) return null;
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return null;
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId: current.session.studentId,
        studentName: current.session.studentName,
        clientType: current.session.clientType,
        securityLevel: current.session.securityLevel,
        clientSessionToken,
        appliedAntiCheatPolicy: current.session.antiCheatPolicy,
        antiCheatConnected: true,
        lastHeartbeatAt: nowIso()
    });
    attempt.lastEvent = {
        type: 'heartbeat',
        note: String(payload.status || 'active').trim() || 'active',
        createdAt: attempt.lastHeartbeatAt
    };
    const session = ensureProtectedClientSession.call(this, clientSessionToken);
    session.lastSeenAt = attempt.lastHeartbeatAt;
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        quiz: redactProtectedQuizForStudent(record.quiz, current.session.studentId),
        attempt: redactProtectedAttemptForStudent(attempt)
    };
}

function recordProtectedQuizEvent(payload = {}) {
    const courseId = String(payload.courseId || payload.resourceKey || '').trim();
    const quizId = String(payload.quizId || '').trim();
    const clientSessionToken = String(payload.clientSessionToken || '').trim();
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return null;
    const session = getProtectedClientSession.call(this, clientSessionToken, { touch: false });
    if (
        !session
        || String(session.courseId || '').trim() !== courseId
        || String(session.quizId || '').trim() !== quizId
    ) return null;
    const resolvedStudentId = String(session.studentId || '').trim();
    if (!resolvedStudentId) return null;
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId: resolvedStudentId,
        studentName: String(payload.studentName || session?.studentName || '').trim(),
        clientType: String(payload.clientType || session?.clientType || 'desktop-app').trim(),
        securityLevel: String(payload.securityLevel || session?.securityLevel || 'desktop-locked').trim(),
        clientSessionToken,
        appliedAntiCheatPolicy: session?.antiCheatPolicy,
        antiCheatConnected: payload.event === 'heartbeat'
    });
    const eventType = String(payload.event || payload.type || 'notice').trim() || 'notice';
    const details = clone(payload.details || {}) || {};
    const event = {
        id: String(payload.id || makeId('pq_evt')).trim(),
        type: eventType,
        note: String(details.reason || details.note || payload.note || '').trim() || eventType,
        createdAt: nowIso(),
        details
    };
    attempt.auditTrail = Array.isArray(attempt.auditTrail) ? attempt.auditTrail : [];
    attempt.auditTrail.unshift(event);
    attempt.auditTrail = attempt.auditTrail.slice(0, 250);
    attempt.lastEvent = clone(event);
    if (eventType === 'heartbeat') {
        attempt.antiCheatConnected = true;
        attempt.lastHeartbeatAt = event.createdAt;
    }
    if (['focus_loss', 'security_violation', 'tamper_attempt', 'app_closed'].includes(eventType)) {
        attempt.violationCount = Math.max(0, safeNumber(attempt.violationCount, 0)) + 1;
    }
    if (['focus_loss', 'security_violation'].includes(eventType)) {
        attempt.warningCount = Math.max(0, safeNumber(attempt.warningCount, 0)) + 1;
    }
    if (['app_closed', 'disconnect', 'focus_loss'].includes(eventType)) {
        attempt.antiCheatConnected = false;
    }
    if (eventType === 'submitted') {
        const result = calculateProtectedQuizResult(record.quiz, payload.answers);
        attempt.answers = result.answers;
        attempt.questionResults = result.questionResults;
        attempt.responseSummary = result.responseSummary;
        attempt.autoScoreRaw = result.score;
        if (!attempt.reviewedBy) {
            attempt.finalScoreRaw = result.score;
            attempt.gradebookScore = result.score;
        }
        attempt.status = 'submitted';
        attempt.submittedAt = event.createdAt;
    }
    if (details.submitReason) attempt.submitReason = String(details.submitReason).trim();
    if (session) {
        session.lastSeenAt = event.createdAt;
        session.active = eventType !== 'app_closed';
    }
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        event: clone(event),
        attempt: redactProtectedAttemptForStudent(attempt)
    };
}

function updateProtectedQuizAttemptControl(payload = {}, action = '') {
    const courseId = String(payload.courseId || payload.resourceKey || '').trim();
    const quizId = String(payload.quizId || '').trim();
    const studentId = String(payload.studentId || '').trim();
    if (!courseId || !quizId || !studentId) return null;
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return null;
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId,
        studentName: String(payload.studentName || '').trim()
    });
    const sessionEntry = Object.values(this.state.protectedClientSessions || {}).find(session =>
        String(session?.courseId || '').trim() === courseId
        && String(session?.quizId || '').trim() === quizId
        && String(session?.studentId || '').trim() === studentId
    ) || null;
    const actor = String(payload.actorUserId || payload.actorName || '').trim();
    const createdAt = nowIso();
    if (action === 'block') {
        attempt.blocked = true;
        attempt.status = 'blocked';
        attempt.overrideStatus = 'blocked';
        if (sessionEntry) {
            sessionEntry.active = true;
            sessionEntry.blocked = true;
            sessionEntry.updatedAt = createdAt;
            sessionEntry.lastSeenAt = createdAt;
        }
    } else if (action === 'unblock') {
        attempt.blocked = false;
        attempt.overrideStatus = '';
        if (attempt.status === 'blocked') attempt.status = 'not-started';
        if (sessionEntry) {
            sessionEntry.blocked = false;
            sessionEntry.active = true;
            sessionEntry.updatedAt = createdAt;
            sessionEntry.lastSeenAt = createdAt;
        }
    } else if (action === 'force-submit') {
        attempt.blocked = false;
        attempt.status = 'auto-submitted';
        attempt.submitReason = 'Force submitted by course staff.';
        attempt.submittedAt = attempt.submittedAt || createdAt;
        if (sessionEntry) {
            sessionEntry.active = false;
            sessionEntry.blocked = false;
            sessionEntry.revokedAt = createdAt;
            sessionEntry.revokeReason = 'force-submit';
            sessionEntry.updatedAt = createdAt;
        }
    } else if (action === 'reset-warnings') {
        attempt.warningCount = 0;
    } else if (action === 'approve-reconnect') {
        attempt.antiCheatConnected = true;
        attempt.reconnectApprovedAt = createdAt;
        attempt.overrideStatus = 'reconnect-approved';
        if (sessionEntry) {
            sessionEntry.active = true;
            sessionEntry.blocked = false;
            sessionEntry.reconnectApprovedAt = createdAt;
            sessionEntry.updatedAt = createdAt;
            sessionEntry.lastSeenAt = createdAt;
        }
    } else if (action === 'override-status') {
        attempt.overrideStatus = String(payload.overrideStatus || '').trim();
    }
    attempt.lastEvent = {
        type: action,
        note: `${action} executed${actor ? ` by ${actor}` : ''}.`,
        createdAt
    };
    attempt.auditTrail = Array.isArray(attempt.auditTrail) ? attempt.auditTrail : [];
    attempt.auditTrail.unshift({
        id: makeId('pq_evt'),
        type: action,
        note: attempt.lastEvent.note,
        createdAt
    });
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        quiz: clone(record.quiz),
        attempt: clone(attempt)
    };
}

function manualGradeProtectedQuiz(payload = {}) {
    const courseId = String(payload.courseId || payload.resourceKey || '').trim();
    const quizId = String(payload.quizId || '').trim();
    const studentId = String(payload.studentId || '').trim();
    if (!courseId || !quizId || !studentId) return null;
    const record = findProtectedQuizRecord.call(this, courseId, quizId);
    if (!record?.quiz) return null;
    const attempt = ensureProtectedQuizAttemptRecord(record.quiz, {
        studentId,
        studentName: String(payload.studentName || '').trim()
    });
    attempt.manualScoreRaw = safeNumber(payload.manualScoreRaw, attempt.manualScoreRaw || 0);
    attempt.autoScoreRaw = safeNumber(payload.autoScoreRaw, attempt.autoScoreRaw || 0);
    attempt.finalScoreRaw = safeNumber(payload.finalScoreRaw, attempt.finalScoreRaw || (attempt.autoScoreRaw + attempt.manualScoreRaw));
    attempt.gradebookScore = payload.gradebookScore === null || payload.gradebookScore === undefined
        ? attempt.gradebookScore
        : safeNumber(payload.gradebookScore, 0);
    if (payload.manualScoresByQuestion && typeof payload.manualScoresByQuestion === 'object') {
        attempt.manualScoresByQuestion = clone(payload.manualScoresByQuestion);
    }
    if (Array.isArray(payload.questionResults)) {
        attempt.questionResults = clone(payload.questionResults);
    }
    if (payload.responseSummary && typeof payload.responseSummary === 'object') {
        attempt.responseSummary = clone(payload.responseSummary);
    }
    attempt.requiresManualReview = false;
    attempt.status = 'graded';
    attempt.gradedAt = String(payload.gradedAt || nowIso()).trim();
    attempt.reviewedBy = String(payload.reviewedBy || '').trim();
    attempt.lastEvent = {
        type: 'manual-grade',
        note: `Manual grade saved${attempt.reviewedBy ? ` by ${attempt.reviewedBy}` : ''}.`,
        createdAt: attempt.gradedAt
    };
    attempt.auditTrail = Array.isArray(attempt.auditTrail) ? attempt.auditTrail : [];
    attempt.auditTrail.unshift({
        id: makeId('pq_evt'),
        type: 'manual-grade',
        note: attempt.lastEvent.note,
        createdAt: attempt.gradedAt
    });
    record.quiz.updatedAt = nowIso();
    record.lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        quiz: clone(record.quiz),
        attempt: clone(attempt)
    };
}

function getProtectedQuizMonitor(courseId, quizId = '') {
    const key = String(courseId || '').trim();
    if (!key) return null;
    const lmsCourse = this.ensureLmsCourse(key);
    const quizzes = asArray(lmsCourse.quizzes)
        .filter(quiz => quiz?.protectedDelivery !== false)
        .filter(quiz => !quizId || String(quiz?.id || '').trim() === String(quizId).trim())
        .map(quiz => {
            const allowedStudents = asArray(quiz.allowedStudents);
            const attempts = allowedStudents.map(student => {
                const attempt = ensureProtectedQuizAttemptRecord(quiz, {
                    studentId: student.id,
                    studentName: student.name
                });
                return {
                    student: clone(student),
                    attempt: clone(attempt)
                };
            });
            return {
                ...clone(quiz),
                antiCheatPolicy: normalizeAntiCheatPolicy(quiz.antiCheatPolicy),
                attempts,
                monitoringSummary: {
                    totalStudents: allowedStudents.length,
                    inProgress: attempts.filter(item => String(item.attempt?.status || '') === 'in-progress').length,
                    submitted: attempts.filter(item => ['submitted', 'auto-submitted', 'graded'].includes(String(item.attempt?.status || ''))).length,
                    blocked: attempts.filter(item => item.attempt?.blocked === true || String(item.attempt?.status || '') === 'blocked').length,
                    alerts: attempts.reduce((total, item) => total + Math.max(0, safeNumber(item.attempt?.warningCount, 0)), 0)
                }
            };
        });
    lmsCourse.updatedAt = nowIso();
    this.save();
    return {
        groupKey: key,
        course: clone(this.state.courses[key] || null),
        quizzes,
        generatedAt: nowIso()
    };
}

module.exports = {
    buildExamSessionCourseKey,
    buildProtectedQuizClientUrl,
    createExamPortalLaunchTicket,
    createExamPortalSession,
    createProtectedQuizLaunchTicket,
    deriveExamSessionRuntimeStatus,
    ensureExamPortalSession,
    ensureProtectedClientSession,
    ensureProtectedQuizAttemptRecord,
    ensureProtectedQuizLaunch,
    findProtectedQuizRecord,
    getExamPortalSession,
    getExamPortalSessionSummary,
    getExamSession,
    getProtectedClientAttempt,
    getProtectedClientSession,
    getProtectedQuiz,
    getProtectedQuizMonitor,
    getAntiCheatPolicyDefaults,
    listAntiCheatPolicies,
    heartbeatProtectedQuiz,
    listExamPortalVisibleSessions,
    listExamSessionsForStudent,
    manualGradeProtectedQuiz,
    normalizeExamSessionRecord,
    normalizeExamSessionStatus,
    recordProtectedQuizEvent,
    redeemProtectedQuizLaunch,
    saveAntiCheatPolicySettings,
    revokeProtectedClientSessions,
    syncExamSession,
    syncProtectedQuiz,
    updateProtectedQuizAttemptControl
};
