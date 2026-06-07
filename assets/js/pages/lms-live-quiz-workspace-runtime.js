/* LMS live quiz workspace/state helpers extracted from lms.js. */

const LMS_LIVE_OPTION_KEYS = ['A', 'B', 'C', 'D'];
const LMS_LIVE_MAX_SCORE = 1000;
const LMS_LIVE_MIN_CORRECT_SCORE = 500;
const LMS_LIVE_SYNC_DEBOUNCE_MS = 350;
const LMS_LIVE_CLOCK_REFRESH_MS = 1000;
const LMS_LIVE_CLOCK_FALLBACK_REFRESH_MS = 5000;
const LMS_LIVE_CLOCK_BACKEND_REFRESH_TICKS = 5;
const LMS_LIVE_LOCAL_SYNC_ECHO_MS = 800;
const LMS_LIVE_REALTIME_DEBOUNCE_MS = 150;
const LMS_LIVE_BACKEND_RELOAD_TTL_MS = 120000;
const LMS_LIVE_QUESTION_STATES = ['draft', 'ready', 'showing', 'paused', 'locked', 'revealed', 'completed'];

function isLmsActiveTab(tab) {
    const contentArea = typeof document !== 'undefined' ? document.getElementById('lms-content-area') : null;
    const active = String(contentArea?.dataset?.activeLmsTab || '').trim()
        || (typeof getCurrentLmsActiveTab === 'function' ? getCurrentLmsActiveTab() : '');
    return String(active) === String(tab || '');
}

function getLmsLiveQuizActorKey() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const userId = String(user?.id || '').trim();
    const role = String(
        typeof getEffectiveUserRole === 'function'
            ? getEffectiveUserRole()
            : (user?.role || '')
    ).trim().toLowerCase();
    if (!userId && !role) return '';
    return `${userId || 'anonymous'}::${role || 'unknown'}`;
}

function stripLmsLiveQuizPersistedUi(workspace = {}) {
    const snapshot = typeof cloneState === 'function'
        ? cloneState(workspace && typeof workspace === 'object' ? workspace : {})
        : JSON.parse(JSON.stringify(workspace && typeof workspace === 'object' ? workspace : {}));
    if (snapshot && typeof snapshot === 'object') {
        delete snapshot.ui;
    }
    return snapshot;
}

function normalizeLmsLiveQuizScopeKey(value = '') {
    return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function getLmsLiveQuizEnrollmentGroupKey(entry = {}) {
    const sectionId = String(
        entry.sectionId
        || entry.section?.id
        || entry.section?.groupId
        || entry.groupId
        || ''
    ).trim();
    const sectionCode = String(entry.section?.code || entry.groupId || '').trim();
    if (!sectionId && !sectionCode) return '';
    const parsed = parseLmsCourseKey(sectionId || sectionCode);
    return parsed.groupId || sectionCode || sectionId;
}

function enrollmentMatchesLmsLiveQuizGroup(entry = {}, courseId = '', groupId = '') {
    if (normalizeLmsLiveQuizScopeKey(entry.courseId || entry.sourceCourseId || '') !== normalizeLmsLiveQuizScopeKey(courseId)) {
        return false;
    }
    if (!groupId) return true;
    const targetGroup = normalizeLmsLiveQuizScopeKey(groupId);
    const keys = new Set();
    const enrollmentGroupId = getLmsLiveQuizEnrollmentGroupKey(entry);
    if (enrollmentGroupId) keys.add(normalizeLmsLiveQuizScopeKey(enrollmentGroupId));
    const section = entry.section && typeof entry.section === 'object' ? entry.section : {};
    if (section.code) keys.add(normalizeLmsLiveQuizScopeKey(section.code));
    if (section.id) {
        const parsed = parseLmsCourseKey(section.id);
        if (parsed.groupId) keys.add(normalizeLmsLiveQuizScopeKey(parsed.groupId));
    }
    if (entry.groupId) keys.add(normalizeLmsLiveQuizScopeKey(entry.groupId));
    if (entry.groupName) keys.add(normalizeLmsLiveQuizScopeKey(entry.groupName));
    return keys.has(targetGroup);
}

function isActualAdminLmsLiveQuizSession() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const actualRole = String(user?.role || '').trim().toLowerCase();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? String(getEffectiveUserRole() || '').trim().toLowerCase()
        : actualRole;
    return actualRole === USER_ROLES.ADMIN && effectiveRole === USER_ROLES.ADMIN;
}

function isPortalCurriculumStaffForLmsLiveQuiz(courseId = '', groupId = '', userId = '', role = '') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || ![USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(normalizedRole)) return false;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const facultyCode = String(
        user?.facultyCode
        || user?.faculty
        || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '')
        || ''
    ).trim().toUpperCase();
    const profile = KIU_STATE?.facultyProfiles?.[facultyCode];
    if (!profile || typeof profile !== 'object') return false;
    const roster = normalizedRole === USER_ROLES.PROFESSOR
        ? (Array.isArray(profile.professors) ? profile.professors : [])
        : (Array.isArray(profile.tas) ? profile.tas : []);
    if (!roster.some(member => String(member?.id || '').trim() === normalizedUserId)) return false;
    const targetCourse = normalizeLmsLiveQuizScopeKey(courseId);
    const curriculum = typeof getActiveCurriculum === 'function'
        ? getActiveCurriculum(facultyCode)
        : profile.curriculum;
    const inCurriculum = (Array.isArray(curriculum) ? curriculum : []).some(subject =>
        normalizeLmsLiveQuizScopeKey(subject?.id || subject?.subjectId || subject?.courseId || '') === targetCourse
    );
    if (!inCurriculum) return false;
    if (!groupId) return true;
    const targetGroup = normalizeLmsLiveQuizScopeKey(groupId);
    const groups = KIU_STATE?.availableGroups?.[courseId] || [];
    return groups.some(group => normalizeLmsLiveQuizScopeKey(group?.id || group?.name || '') === targetGroup);
}

function isStaffForLmsLiveQuizPortalSections(resourceKey = '', userId = '', role = '') {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(resourceKey));
    const courseId = String(parsed.courseId || '').trim();
    const groupId = parsed.groupId || null;
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !courseId) return false;
    const targetCourse = normalizeLmsLiveQuizScopeKey(courseId);
    const targetGroup = groupId ? normalizeLmsLiveQuizScopeKey(groupId) : '';
    const sections = KIU_STATE?.sections && typeof KIU_STATE.sections === 'object'
        ? Object.values(KIU_STATE.sections)
        : [];
    return sections.some(section => {
        const sectionCourseKeys = new Set([
            normalizeLmsLiveQuizScopeKey(section?.courseId || ''),
            normalizeLmsLiveQuizScopeKey(parseLmsCourseKey(section?.id || section?.code || '').courseId || '')
        ].filter(Boolean));
        if (!sectionCourseKeys.has(targetCourse)) return false;
        const sectionGroup = normalizeLmsLiveQuizScopeKey(parseLmsCourseKey(section?.id || section?.code || '').groupId || section?.code || '');
        if (targetGroup && sectionGroup && sectionGroup !== targetGroup) return false;
        const professorIds = [
            section?.professorId,
            section?.instructorUserId,
            section?.instructorId
        ].map(value => String(value || '').trim()).filter(Boolean);
        const taIds = [
            ...(Array.isArray(section?.taIds) ? section.taIds : []),
            section?.assistantUserId,
            section?.assistantId,
            section?.taId
        ].map(value => String(value || '').trim()).filter(Boolean);
        if (normalizedRole === USER_ROLES.PROFESSOR) return professorIds.includes(normalizedUserId);
        if (normalizedRole === USER_ROLES.TA) return taIds.includes(normalizedUserId);
        return professorIds.includes(normalizedUserId) || taIds.includes(normalizedUserId);
    });
}

function isStaffViaLmsLiveQuizTeachingTeam(resourceKey = '', userId = '', role = '') {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(resourceKey));
    const courseId = String(parsed.courseId || '').trim();
    const groupId = String(parsed.groupId || '').trim();
    const sectionType = String(parsed.sectionType || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedUserId || !courseId) return false;
    const sectionSuffix = sectionType ? `__lmssec_${sectionType}` : '';
    const candidateKeys = [
        parsed.resourceKey,
        groupId ? `${courseId}::${groupId}${sectionSuffix}` : '',
        groupId ? `${courseId}::${groupId}` : '',
        courseId
    ].filter(Boolean);
    const lmsCourses = KIU_STATE?.lmsCourses && typeof KIU_STATE.lmsCourses === 'object'
        ? KIU_STATE.lmsCourses
        : {};
    return candidateKeys.some(key => {
        const teachingTeam = Array.isArray(lmsCourses?.[key]?.teachingTeam) ? lmsCourses[key].teachingTeam : [];
        return teachingTeam.some(member => {
            if (typeof member === 'string') return member === normalizedUserId;
            const memberId = String(member?.userId || member?.id || '').trim();
            const memberRole = String(member?.role || member?.assignmentRole || '').trim().toLowerCase();
            if (memberId !== normalizedUserId) return false;
            if (!normalizedRole || !memberRole) return true;
            return memberRole === normalizedRole
                || (normalizedRole === USER_ROLES.PROFESSOR && memberRole === 'instructor');
        });
    });
}

function isAssignedViaLmsLiveQuizGroupRoster(courseId = '', groupId = '', userId = '', role = '') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !courseId) return false;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const identityTokens = new Set([normalizedUserId, normalizeLmsLiveQuizScopeKey(normalizedUserId)]);
    [user?.displayName, user?.nameEn, user?.name, user?.email].forEach(value => {
        const token = String(value || '').trim();
        if (!token || token.toLowerCase() === 'tbd') return;
        identityTokens.add(token);
        identityTokens.add(normalizeLmsLiveQuizScopeKey(token));
    });
    const targetGroup = groupId ? normalizeLmsLiveQuizScopeKey(groupId) : '';
    const groups = KIU_STATE?.availableGroups?.[courseId] || [];
    return groups.some(group => {
        if (targetGroup && normalizeLmsLiveQuizScopeKey(group?.id || group?.name || '') !== targetGroup) return false;
        const profToken = String(group?.professorId || group?.prof || '').trim();
        const taToken = String(group?.taId || group?.assistantId || group?.ta || '').trim();
        const matchesToken = (token = '') => {
            const raw = String(token || '').trim();
            if (!raw || raw.toLowerCase() === 'tbd') return false;
            return identityTokens.has(raw) || identityTokens.has(normalizeLmsLiveQuizScopeKey(raw));
        };
        if (normalizedRole === USER_ROLES.PROFESSOR) return matchesToken(profToken);
        if (normalizedRole === USER_ROLES.TA) return matchesToken(taToken);
        return matchesToken(profToken) || matchesToken(taToken);
    });
}

function canAccessLmsLiveQuizScope(resourceKey = currentCourseId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return false;
    const parsed = parseLmsCourseKey(canonicalKey);
    const courseId = String(parsed.courseId || '').trim();
    if (!courseId) return false;
    const groupId = parsed.groupId || null;
    if (isActualAdminLmsLiveQuizSession()) return true;
    const role = typeof getEffectiveUserRole === 'function'
        ? String(getEffectiveUserRole() || '').trim().toLowerCase()
        : '';
    const userId = String((typeof getCurrentUserId === 'function' ? getCurrentUserId() : '') || '').trim();
    if ([USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        return isPortalCurriculumStaffForLmsLiveQuiz(courseId, groupId, userId, role)
            || isAssignedViaLmsLiveQuizGroupRoster(courseId, groupId, userId, role)
            || isAssignedViaLmsLiveQuizGroupRoster(courseId, null, userId, role)
            || isStaffForLmsLiveQuizPortalSections(canonicalKey, userId, role)
            || isStaffViaLmsLiveQuizTeachingTeam(canonicalKey, userId, role);
    }
    if (role === USER_ROLES.STUDENT) {
        const schedule = typeof getStudentLmsScheduleEntries === 'function'
            ? getStudentLmsScheduleEntries()
            : (typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : []);
        if ((Array.isArray(schedule) ? schedule : []).some(entry =>
            enrollmentMatchesLmsLiveQuizGroup(entry, courseId, groupId)
        )) {
            return true;
        }
        if (userId && typeof getLmsQuizEligibleStudents === 'function') {
            const roster = getLmsQuizEligibleStudents(canonicalKey, { strictRoster: true });
            if (roster.some(student => String(student?.id || '').trim() === userId)) {
                return true;
            }
        }
        const liveSession = getLmsLiveStudentSession(canonicalKey);
        if (userId && liveSession?.participants?.[userId]) {
            return true;
        }
        return false;
    }
    return false;
}

function markLmsLiveQuizAccessDenied(canonicalKey, message = 'You are not assigned to this course scope.') {
    if (!canonicalKey) return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.accessDenied = true;
    workspace.ui.dirty = false;
    workspace.ui.syncing = false;
    if (workspace.ui.syncTimer) {
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
    }
    workspace.ui.syncError = repairLmsDisplayText(message, 'You are not assigned to this course scope.');
}

function shouldSyncLmsLiveQuizWorkspace(resourceKey = currentCourseId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return false;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    if (workspace.ui?.accessDenied) {
        if (typeof canAccessLmsLiveQuizScope === 'function' && canAccessLmsLiveQuizScope(canonicalKey)) {
            workspace.ui.accessDenied = false;
            workspace.ui.syncError = '';
        } else {
            return false;
        }
    }
    if (typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey)) {
        return canAccessLmsLiveQuizScope(canonicalKey);
    }
    return canAccessLmsLiveQuizScope(canonicalKey);
}

function countLmsLiveQuizContent(workspace = {}) {
    const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    let questions = 0;
    sessions.forEach(session => {
        questions += Array.isArray(session?.questions) ? session.questions.length : 0;
    });
    return { sessions: sessions.length, questions };
}

function countLmsLiveQuizAnswers(workspace = {}) {
    let total = 0;
    (Array.isArray(workspace?.sessions) ? workspace.sessions : []).forEach(session => {
        const participants = session?.participants && typeof session.participants === 'object' ? session.participants : {};
        Object.values(participants).forEach(participant => {
            if (!participant || typeof participant !== 'object') return;
            total += Object.keys(participant.answers && typeof participant.answers === 'object' ? participant.answers : {}).length;
        });
    });
    return total;
}

function mergeRemoteLmsLiveParticipantAnswers(clientParticipant = {}, remoteParticipant = {}) {
    const merged = {
        ...(clientParticipant && typeof clientParticipant === 'object' ? clientParticipant : {}),
        answers: {
            ...((clientParticipant?.answers && typeof clientParticipant.answers === 'object') ? clientParticipant.answers : {})
        }
    };
    const remoteAnswers = remoteParticipant?.answers && typeof remoteParticipant.answers === 'object'
        ? remoteParticipant.answers
        : {};
    Object.entries(remoteAnswers).forEach(([questionId, remoteAnswer]) => {
        if (!remoteAnswer || typeof remoteAnswer !== 'object') return;
        const localAnswer = merged.answers[questionId];
        if (!localAnswer || typeof localAnswer !== 'object') {
            merged.answers[questionId] = { ...remoteAnswer };
            return;
        }
        const remoteVersion = Math.max(0, Number.parseInt(remoteAnswer.showVersion, 10) || 0);
        const localVersion = Math.max(0, Number.parseInt(localAnswer.showVersion, 10) || 0);
        const remoteTime = Date.parse(String(remoteAnswer.answeredAt || '')) || 0;
        const localTime = Date.parse(String(localAnswer.answeredAt || '')) || 0;
        if (remoteVersion > localVersion || (remoteVersion === localVersion && remoteTime >= localTime)) {
            merged.answers[questionId] = { ...remoteAnswer };
        }
    });
    if (Number(remoteParticipant?.score || 0) > Number(merged.score || 0)) {
        merged.score = remoteParticipant.score;
    }
    if (Number(remoteParticipant?.streak || 0) > Number(merged.streak || 0)) {
        merged.streak = remoteParticipant.streak;
    }
    return merged;
}

function mergeRemoteLmsLiveQuizParticipants(localWorkspace = {}, remoteWorkspace = {}) {
    if (!localWorkspace || typeof localWorkspace !== 'object' || !remoteWorkspace || typeof remoteWorkspace !== 'object') {
        return localWorkspace;
    }
    const localSessions = Array.isArray(localWorkspace.sessions) ? localWorkspace.sessions : [];
    const remoteSessions = Array.isArray(remoteWorkspace.sessions) ? remoteWorkspace.sessions : [];
    remoteSessions.forEach(remoteSession => {
        const localSession = localSessions.find(session => String(session?.id || '') === String(remoteSession?.id || ''));
        if (!localSession) return;
        localSession.participants = localSession.participants && typeof localSession.participants === 'object'
            ? localSession.participants
            : {};
        const remoteParticipants = remoteSession?.participants && typeof remoteSession.participants === 'object'
            ? remoteSession.participants
            : {};
        Object.entries(remoteParticipants).forEach(([participantId, remoteParticipant]) => {
            const localParticipant = localSession.participants[participantId];
            localSession.participants[participantId] = mergeRemoteLmsLiveParticipantAnswers(
                localParticipant || remoteParticipant,
                remoteParticipant
            );
            rehydrateLmsLiveSessionParticipants(localSession);
        });
    });
    return localWorkspace;
}

function getLmsLiveWorkspaceUpdatedAtMs(workspace = {}) {
    const raw = workspace?.updatedAt || workspace?.ui?.localUpdatedAt || 0;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    const parsed = Date.parse(String(raw || ''));
    return Number.isFinite(parsed) ? parsed : 0;
}

function touchLmsLiveQuizWorkspaceLocal(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const now = Date.now();
    workspace.updatedAt = new Date(now).toISOString();
    workspace.ui.localUpdatedAt = now;
    workspace.ui.dirty = true;
}

function isRemoteLmsLiveQuizWorkspaceNewer(localWorkspace = {}, remoteWorkspace = {}) {
    const localAt = Math.max(
        Number(localWorkspace.ui?.localUpdatedAt || 0) || 0,
        getLmsLiveWorkspaceUpdatedAtMs(localWorkspace)
    );
    const remoteAt = getLmsLiveWorkspaceUpdatedAtMs(remoteWorkspace);
    return remoteAt > localAt;
}

function shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace = {}, remoteWorkspace = {}, options = {}) {
    if (!remoteWorkspace || typeof remoteWorkspace !== 'object') return false;
    if (!localWorkspace || typeof localWorkspace !== 'object') return true;
    if (options.forceMergeParticipants === true) return false;
    const localPending = Boolean(localWorkspace.ui?.syncing || localWorkspace.ui?.dirty);
    if (localPending) {
        if (options.forceRemote === true) {
            return isRemoteLmsLiveQuizWorkspaceNewer(localWorkspace, remoteWorkspace);
        }
        return false;
    }
    if (options.forceRemote === true) return true;
    const localContent = countLmsLiveQuizContent(localWorkspace);
    const remoteContent = countLmsLiveQuizContent(remoteWorkspace);
    const localAnswers = countLmsLiveQuizAnswers(localWorkspace);
    const remoteAnswers = countLmsLiveQuizAnswers(remoteWorkspace);
    if (remoteAnswers > localAnswers) return true;
    if (localContent.questions > 0 && remoteContent.questions === 0) return false;
    if (localContent.sessions > 0 && remoteContent.sessions === 0) return false;
    const localAt = getLmsLiveWorkspaceUpdatedAtMs(localWorkspace);
    const remoteAt = getLmsLiveWorkspaceUpdatedAtMs(remoteWorkspace);
    if (localAt > remoteAt && remoteContent.questions <= localContent.questions && remoteAnswers <= localAnswers) return false;
    return true;
}

function bumpLmsLiveQuizLoadGeneration(canonicalKey) {
    if (typeof window === 'undefined') return 0;
    window.__lmsLiveLoadGenerations = window.__lmsLiveLoadGenerations || {};
    const next = Number(window.__lmsLiveLoadGenerations[canonicalKey] || 0) + 1;
    window.__lmsLiveLoadGenerations[canonicalKey] = next;
    return next;
}

function isCurrentLmsLiveQuizLoadGeneration(canonicalKey, generation) {
    if (typeof window === 'undefined') return true;
    return Number(window.__lmsLiveLoadGenerations?.[canonicalKey] || 0) === Number(generation || 0);
}

function bumpLmsLiveQuizRenderGeneration(canonicalKey) {
    if (typeof window === 'undefined') return 0;
    window.__lmsLiveRenderGenerations = window.__lmsLiveRenderGenerations || {};
    const next = Number(window.__lmsLiveRenderGenerations[canonicalKey] || 0) + 1;
    window.__lmsLiveRenderGenerations[canonicalKey] = next;
    return next;
}

function isCurrentLmsLiveQuizRenderGeneration(canonicalKey, generation) {
    if (typeof window === 'undefined') return true;
    return Number(window.__lmsLiveRenderGenerations?.[canonicalKey] || 0) === Number(generation || 0);
}

function makeLmsLiveId(prefix = 'live') {
    if (typeof makeAdminExamEntityId === 'function') return makeAdminExamEntityId(prefix);
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLmsLiveQuestion(question = {}, index = 0) {
    const options = Array.isArray(question.options) ? question.options.slice(0, 4) : [];
    while (options.length < 4) options.push('');
    return {
        id: String(question.id || makeLmsLiveId('live-question')),
        topic: repairLmsDisplayText(question.topic || '', ''),
        text: repairLmsDisplayText(question.text || '', '') || `Question ${index + 1}`,
        options: options.map((option, optionIndex) => repairLmsDisplayText(option || `Option ${LMS_LIVE_OPTION_KEYS[optionIndex]}`, `Option ${LMS_LIVE_OPTION_KEYS[optionIndex]}`)),
        correctOption: Math.min(3, Math.max(0, parseInt(question.correctOption, 10) || 0)),
        timeLimit: Math.min(180, Math.max(10, parseInt(question.timeLimit, 10) || 45)),
        state: LMS_LIVE_QUESTION_STATES.includes(String(question.state || '').toLowerCase()) ? String(question.state).toLowerCase() : (question.activatedAt ? 'showing' : 'draft'),
        showVersion: Math.max(0, parseInt(question.showVersion, 10) || 0),
        activatedAt: question.activatedAt || null,
        pausedAt: question.pausedAt || null,
        pausedRemainingMs: Number.isFinite(Number(question.pausedRemainingMs)) ? Math.max(0, Number(question.pausedRemainingMs)) : null,
        lockedAt: question.lockedAt || null,
        revealedAt: question.revealedAt || null,
        completedAt: question.completedAt || null,
        createdAt: question.createdAt || new Date().toISOString()
    };
}

function normalizeLmsLiveParticipant(participant = {}, fallbackId = '') {
    const answers = participant.answers && typeof participant.answers === 'object' ? participant.answers : {};
    return {
        id: String(participant.id || fallbackId || makeLmsLiveId('live-student')),
        accountId: String(participant.accountId || fallbackId || ''),
        nickname: repairLmsDisplayText(participant.nickname || 'Student', 'Student'),
        score: Math.max(0, parseInt(participant.score, 10) || 0),
        streak: Math.max(0, parseInt(participant.streak, 10) || 0),
        joinedAt: participant.joinedAt || new Date().toISOString(),
        lastSeenAt: participant.lastSeenAt || new Date().toISOString(),
        answers
    };
}

function normalizeLmsLiveSession(session = {}, resourceKey = '') {
    const questions = Array.isArray(session.questions)
        ? session.questions.map((question, index) => normalizeLmsLiveQuestion(question, index))
        : [];
    const participants = Object.entries(session.participants && typeof session.participants === 'object' ? session.participants : {})
        .reduce((accumulator, [participantId, participant]) => {
            const normalized = normalizeLmsLiveParticipant(participant, participantId);
            accumulator[normalized.id] = normalized;
            return accumulator;
        }, {});
    const status = ['draft', 'live', 'ended'].includes(String(session.status || '').toLowerCase())
        ? String(session.status).toLowerCase()
        : 'draft';
    return {
        id: String(session.id || makeLmsLiveId('live-session')),
        resourceKey: resolveCanonicalLmsResourceKey(resourceKey || session.resourceKey || ''),
        joinCode: repairLmsDisplayText(session.joinCode || '', '').slice(0, 8).toUpperCase(),
        title: repairLmsDisplayText(session.title || 'Live Quiz', 'Live Quiz'),
        topic: repairLmsDisplayText(session.topic || '', ''),
        status,
        currentQuestionIndex: Math.min(Math.max(0, parseInt(session.currentQuestionIndex, 10) || 0), Math.max(questions.length - 1, 0)),
        showLeaderboard: session.showLeaderboard !== false,
        showResults: session.showResults === true,
        nicknameMode: session.nicknameMode === true,
        autoEnroll: session.autoEnroll !== false,
        scoringMode: ['practice', 'speed', 'accuracy'].includes(String(session.scoringMode || '').toLowerCase()) ? String(session.scoringMode).toLowerCase() : 'speed',
        createdAt: session.createdAt || new Date().toISOString(),
        startedAt: session.startedAt || null,
        endedAt: session.endedAt || null,
        createdBy: repairLmsDisplayText(session.createdBy || '', ''),
        questions,
        participants
    };
}

function ensureLmsLiveQuizWorkspace(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    if (!KIU_STATE.lmsLiveQuizzes[canonicalKey] || typeof KIU_STATE.lmsLiveQuizzes[canonicalKey] !== 'object') {
        KIU_STATE.lmsLiveQuizzes[canonicalKey] = { sessions: [], ui: {} };
    }
    const workspace = KIU_STATE.lmsLiveQuizzes[canonicalKey];
    workspace.sessions = Array.isArray(workspace.sessions)
        ? workspace.sessions.map(session => {
            const normalized = normalizeLmsLiveSession(session, canonicalKey);
            rehydrateLmsLiveSessionParticipants(normalized);
            return normalized;
        })
        : [];
    bindLmsLiveQuizWorkspaceActor(workspace, canonicalKey);
    return workspace;
}

function getLmsLiveQuizStructuralFingerprint(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return '';
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const isStaff = typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey);
    const session = isStaff
        ? (getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey))
        : getLmsLiveStudentSession(canonicalKey);
    const question = getLmsLiveCurrentQuestion(session);
    const questionSignature = Array.isArray(session?.questions)
        ? session.questions.map(item => `${item.id}:${item.state}:${item.showVersion || 0}`).join('|')
        : '';
    return [
        String(getLmsLiveQuizActorKey()),
        isStaff ? 'staff' : 'student',
        String(session?.id || ''),
        String(session?.status || ''),
        String(session?.currentQuestionIndex ?? ''),
        String(question?.id || ''),
        String(question?.state || ''),
        String(question?.showVersion || ''),
        String(workspace.ui?.presentationMode || false),
        String(session?.showResults || false),
        String(workspace.ui?.accessDenied || false),
        questionSignature
    ].join('::');
}

function getLmsLiveQuizVolatileSignature(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return '';
    const isStaff = typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey);
    const session = isStaff
        ? (getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey))
        : getLmsLiveStudentSession(canonicalKey);
    const stats = getLmsLiveSessionStats(session);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const participants = getLmsLiveParticipantList(session);
    const answerSignature = participants.map(participant => {
        const answers = participant.answers || {};
        const currentAnswer = currentQuestion ? answers[currentQuestion.id] : null;
        return `${participant.id}:${participant.score || 0}:${currentAnswer?.selectedOption ?? ''}:${currentAnswer?.showVersion ?? ''}`;
    }).join('|');
    const queueSignature = Array.isArray(session?.questions)
        ? session.questions.map(question => {
            const count = participants.filter(participant => participant.answers?.[question.id]).length;
            return `${question.id}:${count}`;
        }).join('|')
        : '';
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    return [
        String(stats.participants),
        String(stats.currentAnswerCount),
        String(stats.totalAnswers),
        answerSignature,
        queueSignature,
        String(workspace.ui?.syncError || ''),
        String(workspace.ui?.syncing || false)
    ].join('::');
}

function bindLmsLiveQuizWorkspaceActor(workspace = {}, canonicalKey = '') {
    const actorKey = getLmsLiveQuizActorKey();
    if (!workspace || typeof workspace !== 'object') return workspace;
    workspace.ui = workspace.ui && typeof workspace.ui === 'object' ? workspace.ui : {};
    if (!actorKey) return workspace;
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizWorkspaceActors = window.__lmsLiveQuizWorkspaceActors || {};
        window.__lmsLiveQuizLastActorKey = window.__lmsLiveQuizLastActorKey || {};
    }
    const previousActorKey = String(
        (typeof window !== 'undefined' && window.__lmsLiveQuizLastActorKey?.[canonicalKey])
        || ''
    ).trim();
    if (previousActorKey && previousActorKey !== actorKey) {
        resetLmsLiveQuizRuntimeState();
        workspace.ui = {};
        if (typeof window !== 'undefined') {
            window.__lmsLiveQuizWorkspaceActors = window.__lmsLiveQuizWorkspaceActors || {};
            window.__lmsLiveQuizLastActorKey = window.__lmsLiveQuizLastActorKey || {};
        }
    }
    const storedActorKey = String(
        (typeof window !== 'undefined' && window.__lmsLiveQuizWorkspaceActors?.[canonicalKey])
        || workspace.ui.actorKey
        || ''
    ).trim();
    if (storedActorKey && storedActorKey !== actorKey) {
        workspace.ui = {};
    }
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizWorkspaceActors[canonicalKey] = actorKey;
        window.__lmsLiveQuizLastActorKey[canonicalKey] = actorKey;
    }
    workspace.ui.actorKey = actorKey;
    return workspace;
}

function getLmsLiveQuizRenderFingerprint(resourceKey) {
    return getLmsLiveQuizStructuralFingerprint(resourceKey);
}

function storeLmsLiveQuizRenderFingerprint(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof window === 'undefined') return '';
    const fingerprint = getLmsLiveQuizStructuralFingerprint(canonicalKey);
    window.__lmsLiveRenderFingerprints = window.__lmsLiveRenderFingerprints || {};
    window.__lmsLiveRenderFingerprints[canonicalKey] = fingerprint;
    return fingerprint;
}

function markLmsLiveQuizLocalSync(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsLiveQuizLocalSyncAt = window.__lmsLiveQuizLocalSyncAt || {};
    window.__lmsLiveQuizLocalSyncAt[canonicalKey] = Date.now();
}

function shouldIgnoreLmsLiveQuizRealtimeUpdate(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof window === 'undefined') return false;
    if (window.__lmsLiveQuizSyncPromises?.[canonicalKey]) return true;
    const lastLocalSyncAt = Number(window.__lmsLiveQuizLocalSyncAt?.[canonicalKey] || 0);
    return lastLocalSyncAt > 0 && (Date.now() - lastLocalSyncAt) < LMS_LIVE_LOCAL_SYNC_ECHO_MS;
}

function hasLmsLiveQuizLiveSession(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return false;
    const sessions = getLmsLiveSessions(canonicalKey);
    return sessions.some(session => String(session?.status || '').toLowerCase() === 'live');
}

function shouldSkipLmsLiveQuizBackendPoll(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return true;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    if (hasLmsLiveQuizLiveSession(canonicalKey)) {
        if (typeof isLmsLiveQuizDraftEditorActive === 'function' && isLmsLiveQuizDraftEditorActive()) return true;
        return false;
    }
    if (workspace.ui?.dirty || workspace.ui?.syncing || workspace.ui?.syncTimer) return true;
    if (typeof isLmsLiveQuizDraftEditorActive === 'function' && isLmsLiveQuizDraftEditorActive()) return true;
    return false;
}

function invokeRefreshLmsLiveQuizUi(resourceKey, options = {}) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || !isLmsActiveTab('live-quiz')) return;
    if (typeof refreshLmsLiveQuizUi === 'function') {
        refreshLmsLiveQuizUi(canonicalKey, options);
        return;
    }
    if (typeof maybeRenderLmsLiveQuizSection === 'function') {
        maybeRenderLmsLiveQuizSection(canonicalKey, options);
        return;
    }
    renderLmsLiveQuizSection(canonicalKey, { skipLoad: true });
}

function mergeLmsLiveStaffQuestionOverrides(localWorkspace = {}, remoteWorkspace = {}) {
    if (!localWorkspace || !remoteWorkspace || typeof remoteWorkspace !== 'object') return remoteWorkspace;
    const localSessions = Array.isArray(localWorkspace.sessions) ? localWorkspace.sessions : [];
    const remoteSessions = Array.isArray(remoteWorkspace.sessions) ? remoteWorkspace.sessions : [];
    remoteSessions.forEach(remoteSession => {
        const localSession = localSessions.find(item => String(item?.id || '') === String(remoteSession?.id || ''));
        if (!localSession || !Array.isArray(remoteSession.questions)) return;
        remoteSession.questions = remoteSession.questions.map(remoteQuestion => {
            const localQuestion = (localSession.questions || []).find(item => String(item?.id || '') === String(remoteQuestion?.id || ''));
            if (!localQuestion) return remoteQuestion;
            const localVersion = Math.max(0, parseInt(localQuestion.showVersion, 10) || 0);
            const remoteVersion = Math.max(0, parseInt(remoteQuestion.showVersion, 10) || 0);
            const localStamp = Math.max(
                Date.parse(String(localQuestion.revealedAt || '')) || 0,
                Date.parse(String(localQuestion.lockedAt || '')) || 0,
                Date.parse(String(localQuestion.activatedAt || '')) || 0,
                Number(localWorkspace.ui?.localUpdatedAt || 0) || 0
            );
            const remoteStamp = Math.max(
                Date.parse(String(remoteQuestion.revealedAt || '')) || 0,
                Date.parse(String(remoteQuestion.lockedAt || '')) || 0,
                Date.parse(String(remoteQuestion.activatedAt || '')) || 0
            );
            if (localVersion < remoteVersion || (localVersion === remoteVersion && localStamp <= remoteStamp)) {
                return remoteQuestion;
            }
            return {
                ...remoteQuestion,
                state: localQuestion.state,
                showVersion: localQuestion.showVersion,
                activatedAt: localQuestion.activatedAt,
                pausedAt: localQuestion.pausedAt,
                pausedRemainingMs: localQuestion.pausedRemainingMs,
                lockedAt: localQuestion.lockedAt,
                revealedAt: localQuestion.revealedAt,
                completedAt: localQuestion.completedAt
            };
        });
        if (Number.isFinite(Number(localSession.currentQuestionIndex))) {
            remoteSession.currentQuestionIndex = localSession.currentQuestionIndex;
        }
        if (localSession.showResults != null) remoteSession.showResults = localSession.showResults;
        if (localSession.status) remoteSession.status = localSession.status;
    });
    return remoteWorkspace;
}

function applyLmsLiveQuizWorkspace(resourceKey, workspace = null, options = {}) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || !workspace || typeof workspace !== 'object') return null;
    ensureLmsStores();
    const localWorkspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const normalizedWorkspace = stripLmsLiveQuizPersistedUi(workspace);
    let incomingWorkspace = normalizedWorkspace;
    if (typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey)) {
        incomingWorkspace = mergeLmsLiveStaffQuestionOverrides(
            localWorkspace,
            JSON.parse(JSON.stringify(normalizedWorkspace))
        );
    }
    const canApplyRemote = shouldApplyRemoteLmsLiveQuizWorkspace(localWorkspace, incomingWorkspace, options);
    const shouldMergeParticipantsOnly = !canApplyRemote
        && (options.forceMergeParticipants === true || countLmsLiveQuizAnswers(normalizedWorkspace) > countLmsLiveQuizAnswers(localWorkspace));
    if (!canApplyRemote && !shouldMergeParticipantsOnly) {
        if (options.render !== false && isLmsActiveTab('live-quiz')) {
            invokeRefreshLmsLiveQuizUi(canonicalKey, {
                skipLoad: true,
                forceStructuralRender: options.forceRender === true
            });
        }
        return localWorkspace;
    }
    const preservedUi = {
        ...(localWorkspace.ui && typeof localWorkspace.ui === 'object' ? localWorkspace.ui : {}),
        ...(normalizedWorkspace.ui && typeof normalizedWorkspace.ui === 'object' ? normalizedWorkspace.ui : {})
    };
    const remoteSessions = Array.isArray(normalizedWorkspace.sessions) ? normalizedWorkspace.sessions : [];
    const liveSession = remoteSessions.find(session => String(session?.status || '').toLowerCase() === 'live') || null;
    const localActiveSessionId = String(localWorkspace.ui?.activeSessionId || '').trim();
    const remoteActiveSessionId = String(normalizedWorkspace.ui?.activeSessionId || '').trim();
    if (liveSession) {
        preservedUi.activeSessionId = liveSession.id;
    } else if (localActiveSessionId && !remoteActiveSessionId) {
        preservedUi.activeSessionId = localActiveSessionId;
    } else if (remoteActiveSessionId) {
        preservedUi.activeSessionId = remoteActiveSessionId;
    }
    delete preservedUi.syncTimer;
    if (canApplyRemote) {
        KIU_STATE.lmsLiveQuizzes[canonicalKey] = incomingWorkspace;
    } else {
        mergeRemoteLmsLiveQuizParticipants(localWorkspace, incomingWorkspace);
    }
    const normalized = ensureLmsLiveQuizWorkspace(canonicalKey);
    (normalized.sessions || []).forEach(session => rehydrateLmsLiveSessionParticipants(session));
    normalized.ui = preservedUi;
    normalized.ui.syncError = repairLmsDisplayText(options.syncError || normalized.ui.syncError || '', '');
    if (options.render !== false && isLmsActiveTab('live-quiz')) {
        invokeRefreshLmsLiveQuizUi(canonicalKey, {
            skipLoad: true,
            forceStructuralRender: options.forceRender === true || shouldMergeParticipantsOnly
        });
    }
    return normalized;
}

function buildLmsLiveQuizSyncPayload(canonicalKey) {
    const payload = stripLmsLiveQuizPersistedUi(ensureLmsLiveQuizWorkspace(canonicalKey));
    const isStaff = typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey);
    if (isStaff && Array.isArray(payload.sessions)) {
        payload.sessions = payload.sessions.map(session => ({
            ...session,
            participants: {}
        }));
    }
    return payload;
}

function runImmediateLmsLiveQuizSync(canonicalKey, reason = 'live-quiz') {
    if (!canonicalKey || typeof syncLmsLiveQuizWorkspace !== 'function') return Promise.resolve(null);
    if (!shouldSyncLmsLiveQuizWorkspace(canonicalKey)) return Promise.resolve(null);
    markLmsLiveQuizLocalSync(canonicalKey);
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    if (workspace.ui?.syncTimer) {
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
    }
    workspace.ui.syncing = true;
    const payload = buildLmsLiveQuizSyncPayload(canonicalKey);
    const syncPromise = syncLmsLiveQuizWorkspace(canonicalKey, payload, reason)
        .then(savedWorkspace => {
            if (savedWorkspace) {
                applyLmsLiveQuizWorkspace(canonicalKey, savedWorkspace, { render: false, forceRemote: true });
                rememberLmsLiveQuizServerParticipantCount(canonicalKey, savedWorkspace);
            }
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.accessDenied = false;
            latest.ui.syncError = '';
            latest.ui.dirty = false;
            latest.ui.lastServerSyncAt = Date.now();
            if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
                window.invalidateLmsLiveQuizTabCache(canonicalKey);
            }
            return savedWorkspace;
        })
        .catch(error => {
            const status = Number(error?.status || error?.httpStatus || 0);
            if (status === 403) {
                markLmsLiveQuizAccessDenied(
                    canonicalKey,
                    error?.message || 'You are not assigned to this course scope.'
                );
            } else {
                const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
                latest.ui.accessDenied = false;
                latest.ui.syncError = repairLmsDisplayText(error?.message || 'Live quiz sync failed. Try again.', 'Live quiz sync failed. Try again.');
            }
            return null;
        })
        .finally(() => {
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncing = false;
            if (typeof window !== 'undefined') {
                window.__lmsLiveQuizSyncPromises = window.__lmsLiveQuizSyncPromises || {};
                delete window.__lmsLiveQuizSyncPromises[canonicalKey];
            }
            if (isLmsActiveTab('live-quiz')) {
                invokeRefreshLmsLiveQuizUi(canonicalKey, { skipLoad: true });
            }
        });
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizSyncPromises = window.__lmsLiveQuizSyncPromises || {};
        window.__lmsLiveQuizSyncPromises[canonicalKey] = syncPromise;
    }
    return syncPromise;
}

function queueLmsLiveQuizBackendSync(resourceKey, reason = 'live-quiz') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || !shouldSyncLmsLiveQuizWorkspace(canonicalKey)) return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.syncing = true;
    clearTimeout(workspace.ui.syncTimer);
    workspace.ui.syncTimer = setTimeout(() => {
        workspace.ui.syncTimer = null;
        runImmediateLmsLiveQuizSync(canonicalKey, reason);
    }, LMS_LIVE_SYNC_DEBOUNCE_MS);
}

function flushLmsLiveQuizSync(resourceKey = '') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey || '');
    if (canonicalKey) {
        const workspace = KIU_STATE.lmsLiveQuizzes?.[canonicalKey];
        if (!shouldSyncLmsLiveQuizWorkspace(canonicalKey)) {
            return Promise.resolve(null);
        }
        if (!workspace?.ui?.dirty && !workspace?.ui?.syncing && !workspace?.ui?.syncTimer) {
            return Promise.resolve(null);
        }
        return runImmediateLmsLiveQuizSync(canonicalKey, 'navigation-flush');
    }
    const keys = Object.keys(KIU_STATE.lmsLiveQuizzes || {});
    const flushes = keys.map(key => {
        const workspace = KIU_STATE.lmsLiveQuizzes[key];
        const resolvedKey = resolveCanonicalLmsResourceKey(key);
        if (!shouldSyncLmsLiveQuizWorkspace(resolvedKey)) {
            return Promise.resolve(null);
        }
        if (!workspace?.ui?.dirty && !workspace?.ui?.syncing && !workspace?.ui?.syncTimer) {
            return Promise.resolve(null);
        }
        return runImmediateLmsLiveQuizSync(resolvedKey, 'navigation-flush');
    });
    return Promise.all(flushes);
}

function shouldReloadLmsLiveQuizFromBackend(workspace = {}, canonicalKey = '', options = {}) {
    if (options.force === true) return true;
    if (hasLmsLiveQuizLiveSession(canonicalKey)) return true;
    const lastServerSyncAt = Number(workspace.ui?.lastServerSyncAt || 0);
    if (!Number.isFinite(lastServerSyncAt) || lastServerSyncAt <= 0) return true;
    return (Date.now() - lastServerSyncAt) > LMS_LIVE_BACKEND_RELOAD_TTL_MS;
}

function loadLmsLiveQuizWorkspace(resourceKey, options = {}) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof fetchLmsLiveQuizWorkspace !== 'function') return Promise.resolve(null);
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    if (!options.force && shouldSkipLmsLiveQuizBackendPoll(canonicalKey)) return Promise.resolve(null);
    if (!options.force && workspace.ui.accessDenied) {
        if (typeof canAccessLmsLiveQuizScope === 'function' && canAccessLmsLiveQuizScope(canonicalKey)) {
            workspace.ui.accessDenied = false;
            workspace.ui.syncError = '';
        } else {
            return Promise.resolve(null);
        }
    }
    if (!options.force && workspace.ui.loadingFromBackend) {
        const pending = typeof window !== 'undefined' ? window.__lmsLiveQuizLoadPromises?.[canonicalKey] : null;
        if (pending) return pending;
        return Promise.resolve(null);
    }
    if (!options.force && !shouldReloadLmsLiveQuizFromBackend(workspace, canonicalKey, options)) return Promise.resolve(null);
    const loadGeneration = bumpLmsLiveQuizLoadGeneration(canonicalKey);
    const forceRemote = options.forceRemote === true;
    const forceStructuralRender = options.forceRender === true || options.forceStructuralRender === true;
    workspace.ui.loadingFromBackend = true;
    const fetchPromise = fetchLmsLiveQuizWorkspace(canonicalKey)
        .then(remoteWorkspace => {
            if (!isCurrentLmsLiveQuizLoadGeneration(canonicalKey, loadGeneration)) return null;
            if (remoteWorkspace) {
                applyLmsLiveQuizWorkspace(canonicalKey, remoteWorkspace, {
                    render: false,
                    forceRemote,
                    forceMergeParticipants: options.forceMergeParticipants === true
                });
                rememberLmsLiveQuizServerParticipantCount(canonicalKey, remoteWorkspace);
            }
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.loadedFromBackend = true;
            latest.ui.lastServerSyncAt = Date.now();
            latest.ui.accessDenied = false;
            if (remoteWorkspace) latest.ui.syncError = '';
            if (options.render !== false && isLmsActiveTab('live-quiz')) {
                invokeRefreshLmsLiveQuizUi(canonicalKey, {
                    skipLoad: true,
                    softLoad: false,
                    forceStructuralRender
                });
            }
            return remoteWorkspace;
        })
        .catch(error => {
            if (!isCurrentLmsLiveQuizLoadGeneration(canonicalKey, loadGeneration)) return null;
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            const status = Number(error?.status || error?.httpStatus || 0);
            if (status === 403) {
                markLmsLiveQuizAccessDenied(
                    canonicalKey,
                    error?.message || 'You are not assigned to this course scope.'
                );
            } else {
                latest.ui.accessDenied = false;
                latest.ui.syncError = repairLmsDisplayText(error?.message || 'Live quiz could not be loaded.', 'Live quiz could not be loaded.');
            }
            if (options.render !== false && isLmsActiveTab('live-quiz')) {
                invokeRefreshLmsLiveQuizUi(canonicalKey, {
                    skipLoad: true,
                    softLoad: false,
                    forceStructuralRender
                });
            }
            return null;
        })
        .finally(() => {
            if (!isCurrentLmsLiveQuizLoadGeneration(canonicalKey, loadGeneration)) return;
            ensureLmsLiveQuizWorkspace(canonicalKey).ui.loadingFromBackend = false;
        });
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizLoadPromises = window.__lmsLiveQuizLoadPromises || {};
        window.__lmsLiveQuizLoadPromises[canonicalKey] = fetchPromise;
        fetchPromise.finally(() => {
            if (window.__lmsLiveQuizLoadPromises?.[canonicalKey] === fetchPromise) {
                delete window.__lmsLiveQuizLoadPromises[canonicalKey];
            }
        });
    }
    return fetchPromise;
}

function reloadActiveLmsLiveQuizFromServer(reason = 'live-quiz-reload') {
    if (!isLmsActiveTab('live-quiz') || typeof loadLmsLiveQuizWorkspace !== 'function') return Promise.resolve(null);
    const courseKey = typeof getLmsTabCourseKey === 'function'
        ? getLmsTabCourseKey('live-quiz')
        : (currentCourseId || '');
    if (!courseKey) return Promise.resolve(null);
    const workspace = ensureLmsLiveQuizWorkspace(courseKey);
    if (workspace.ui?.dirty || workspace.ui?.syncing) return Promise.resolve(null);
    return loadLmsLiveQuizWorkspace(courseKey, {
        force: true,
        forceRemote: true,
        forceRender: true,
        forceStructuralRender: true,
        render: true
    });
}

function handleLmsLiveQuizRealtimeUpdate(payload = {}) {
    const resourceKey = resolveCanonicalLmsResourceKey(payload.resourceKey || currentCourseId || '');
    if (!resourceKey) return;
    if (shouldIgnoreLmsLiveQuizRealtimeUpdate(resourceKey)) return;
    if (typeof window !== 'undefined') {
        window.__lmsLiveRealtimeTimers = window.__lmsLiveRealtimeTimers || {};
        if (window.__lmsLiveRealtimeTimers[resourceKey]) {
            clearTimeout(window.__lmsLiveRealtimeTimers[resourceKey]);
        }
        window.__lmsLiveRealtimeTimers[resourceKey] = setTimeout(() => {
            window.__lmsLiveRealtimeTimers[resourceKey] = null;
            if (shouldIgnoreLmsLiveQuizRealtimeUpdate(resourceKey)) return;
            const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
            const localPending = Boolean(workspace.ui?.dirty || workspace.ui?.syncing);
            loadLmsLiveQuizWorkspace(resourceKey, {
                force: true,
                forceRemote: true,
                forceMergeParticipants: !localPending,
                forceStructuralRender: true,
                render: true
            });
            invokeRefreshLmsLiveQuizUi(resourceKey, { skipLoad: true });
        }, LMS_LIVE_REALTIME_DEBOUNCE_MS);
    }
}

function saveLmsLiveQuizChange(resourceKey, reason = 'live-quiz', options = {}) {
    touchLmsLiveQuizWorkspaceLocal(resourceKey);
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (options.skipBackendSync === true) {
        const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
        workspace.ui.dirty = false;
        workspace.ui.syncing = false;
        if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
            window.invalidateLmsLiveQuizTabCache(canonicalKey);
        }
        return;
    }
    if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
        window.invalidateLmsLiveQuizTabCache(resourceKey);
    }
    queueLmsLiveQuizBackendSync(resourceKey, reason);
}

function submitLmsLiveQuizAnswerChange(resourceKey, answerPayload = {}, reason = 'answer-submitted') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof submitLmsLiveQuizAnswer !== 'function') return Promise.resolve(null);
    if (!canAccessLmsLiveQuizScope(canonicalKey)) {
        markLmsLiveQuizAccessDenied(canonicalKey);
        return Promise.resolve(null);
    }
    markLmsLiveQuizLocalSync(canonicalKey);
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.syncing = true;
    workspace.ui.syncError = '';
    const syncPromise = submitLmsLiveQuizAnswer(canonicalKey, answerPayload, reason)
        .then(savedWorkspace => {
            if (savedWorkspace) {
                applyLmsLiveQuizWorkspace(canonicalKey, savedWorkspace, {
                    render: false,
                    forceRemote: true
                });
                rememberLmsLiveQuizServerParticipantCount(canonicalKey, savedWorkspace);
            }
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.accessDenied = false;
            latest.ui.syncError = '';
            latest.ui.dirty = false;
            latest.ui.lastServerSyncAt = Date.now();
            if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
                window.invalidateLmsLiveQuizTabCache(canonicalKey);
            }
            return savedWorkspace;
        })
        .catch(error => {
            const status = Number(error?.status || error?.httpStatus || 0);
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncError = formatLmsLiveAnswerSyncError(error);
            if (status === 403) {
                latest.ui.accessDenied = true;
            }
            return null;
        })
        .finally(() => {
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncing = false;
            if (isLmsActiveTab('live-quiz')) {
                invokeRefreshLmsLiveQuizUi(canonicalKey, { skipLoad: true, forceStructuralRender: true });
            }
        });
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizSyncPromises = window.__lmsLiveQuizSyncPromises || {};
        window.__lmsLiveQuizSyncPromises[canonicalKey] = syncPromise;
    }
    return syncPromise;
}

function submitLmsLiveQuizJoinChange(resourceKey, joinPayload = {}, reason = 'participant-joined') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof submitLmsLiveQuizJoin !== 'function') return Promise.resolve(null);
    if (!canAccessLmsLiveQuizScope(canonicalKey)) {
        markLmsLiveQuizAccessDenied(canonicalKey);
        return Promise.resolve(null);
    }
    markLmsLiveQuizLocalSync(canonicalKey);
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.syncing = true;
    workspace.ui.syncError = '';
    const syncPromise = submitLmsLiveQuizJoin(canonicalKey, joinPayload, reason)
        .then(savedWorkspace => {
            if (savedWorkspace) {
                applyLmsLiveQuizWorkspace(canonicalKey, savedWorkspace, {
                    render: false,
                    forceRemote: true
                });
                rememberLmsLiveQuizServerParticipantCount(canonicalKey, savedWorkspace);
            }
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncError = '';
            latest.ui.dirty = false;
            latest.ui.lastServerSyncAt = Date.now();
            if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
                window.invalidateLmsLiveQuizTabCache(canonicalKey);
            }
            return savedWorkspace;
        })
        .catch(error => {
            const status = Number(error?.status || error?.httpStatus || 0);
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncError = repairLmsDisplayText(
                error?.message || 'Live quiz join failed. Try again.',
                'Live quiz join failed. Try again.'
            );
            if (status === 403) {
                latest.ui.accessDenied = true;
            }
            return null;
        })
        .finally(() => {
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncing = false;
            if (isLmsActiveTab('live-quiz')) {
                invokeRefreshLmsLiveQuizUi(canonicalKey, { skipLoad: true, forceStructuralRender: true });
            }
        });
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizSyncPromises = window.__lmsLiveQuizSyncPromises || {};
        window.__lmsLiveQuizSyncPromises[canonicalKey] = syncPromise;
    }
    return syncPromise;
}

function scheduleLmsLiveClockRefresh(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsLiveClockTimers = window.__lmsLiveClockTimers || {};
    const existingTimer = window.__lmsLiveClockTimers[canonicalKey];
    if (existingTimer?.timerId) clearTimeout(existingTimer.timerId);
    if (!isLmsActiveTab('live-quiz')) {
        delete window.__lmsLiveClockTimers[canonicalKey];
        return;
    }
    const session = canManageLmsLiveQuiz(canonicalKey)
        ? (getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey))
        : getLmsLiveStudentSession(canonicalKey);
    if (!session || session.status !== 'live') {
        delete window.__lmsLiveClockTimers[canonicalKey];
        return;
    }
    const question = getLmsLiveCurrentQuestion(session);
    const fastClock = Boolean(question && ['showing', 'paused'].includes(String(question.state || '')));
    const state = window.__lmsLiveClockTimers[canonicalKey] = existingTimer || { tick: 0, timerId: null };
    state.timerId = setTimeout(() => {
        const timerState = window.__lmsLiveClockTimers?.[canonicalKey];
        if (!timerState) return;
        timerState.timerId = null;
        if (!isLmsActiveTab('live-quiz')) {
            delete window.__lmsLiveClockTimers[canonicalKey];
            return;
        }
        timerState.tick = Number(timerState.tick || 0) + 1;
        const liveSession = canManageLmsLiveQuiz(canonicalKey)
            ? (getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey))
            : getLmsLiveStudentSession(canonicalKey);
        if (!liveSession || liveSession.status !== 'live') {
            delete window.__lmsLiveClockTimers[canonicalKey];
            return;
        }
        const liveQuestion = getLmsLiveCurrentQuestion(liveSession);
        const liveFastClock = Boolean(liveQuestion && ['showing', 'paused'].includes(String(liveQuestion.state || '')));
        const shouldRefreshFromBackend = timerState.tick % LMS_LIVE_CLOCK_BACKEND_REFRESH_TICKS === 0;
        const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
        const skipBackendLoad = Boolean(
            workspace.ui?.dirty
            || workspace.ui?.syncing
            || workspace.ui?.accessDenied
        );
        if (shouldRefreshFromBackend
            && !skipBackendLoad
            && typeof loadLmsLiveQuizWorkspace === 'function'
            && !shouldSkipLmsLiveQuizBackendPoll(canonicalKey)) {
            loadLmsLiveQuizWorkspace(canonicalKey, { force: true, render: false });
        } else {
            invokeRefreshLmsLiveQuizUi(canonicalKey, { skipLoad: true });
        }
        scheduleLmsLiveClockRefresh(canonicalKey);
    }, fastClock ? LMS_LIVE_CLOCK_REFRESH_MS : LMS_LIVE_CLOCK_FALLBACK_REFRESH_MS);
}

function getLmsLiveSessions(resourceKey) {
    return ensureLmsLiveQuizWorkspace(resourceKey).sessions;
}

function getLmsLiveStaffLiveSession(resourceKey) {
    const sessions = getLmsLiveSessions(resourceKey);
    return sessions.find(session => String(session?.status || '').toLowerCase() === 'live') || null;
}

function getLmsLiveStaffEditingSession(resourceKey) {
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const sessions = getLmsLiveSessions(resourceKey);
    const activeSessionId = String(workspace.ui?.activeSessionId || '').trim();
    if (activeSessionId) {
        const activeSession = sessions.find(session => String(session.id) === activeSessionId);
        if (activeSession) return activeSession;
    }
    return sessions.find(session => session.status === 'live')
        || sessions.find(session => session.status === 'draft')
        || sessions[0]
        || null;
}

function getLmsLiveStaffControlSession(resourceKey) {
    return getLmsLiveStaffLiveSession(resourceKey) || getLmsLiveStaffEditingSession(resourceKey);
}

function getLmsLiveStaffSession(resourceKey) {
    return getLmsLiveStaffControlSession(resourceKey);
}

function getLmsLiveStaffSessionForQuestion(resourceKey, questionId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const targetQuestionId = String(questionId || '').trim();
    const sessions = getLmsLiveSessions(canonicalKey || resourceKey);
    if (!targetQuestionId) {
        return getLmsLiveStaffControlSession(canonicalKey || resourceKey);
    }
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey || resourceKey);
    const activeSessionId = String(workspace.ui?.activeSessionId || '').trim();
    if (activeSessionId) {
        const activeSession = sessions.find(session => String(session?.id || '') === activeSessionId);
        if (activeSession && Array.isArray(activeSession.questions) && activeSession.questions.some(question => String(question?.id || '') === targetQuestionId)) {
            return activeSession;
        }
    }
    const liveSession = sessions.find(session => String(session?.status || '').toLowerCase() === 'live'
        && Array.isArray(session.questions)
        && session.questions.some(question => String(question?.id || '') === targetQuestionId));
    if (liveSession) return liveSession;
    const questionSession = sessions.find(session => Array.isArray(session.questions)
        && session.questions.some(question => String(question?.id || '') === targetQuestionId));
    if (questionSession) return questionSession;
    return getLmsLiveStaffControlSession(canonicalKey || resourceKey);
}

function getLmsLiveQuizRosterStats(resourceKey, session = null) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const rosterCount = typeof getLmsQuizEligibleStudents === 'function'
        ? getLmsQuizEligibleStudents(canonicalKey, { strictRoster: true }).length
        : 0;
    const joinedCount = session
        ? Object.keys(session.participants && typeof session.participants === 'object' ? session.participants : {}).length
        : 0;
    const serverJoinedCount = Number(ensureLmsLiveQuizWorkspace(canonicalKey).ui?.serverParticipantCount);
    return {
        rosterCount,
        joinedCount,
        serverJoinedCount: Number.isFinite(serverJoinedCount) && serverJoinedCount >= 0 ? serverJoinedCount : null
    };
}

function rememberLmsLiveQuizServerParticipantCount(resourceKey, workspace = null) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return;
    const targetWorkspace = workspace || ensureLmsLiveQuizWorkspace(canonicalKey);
    const liveSession = (Array.isArray(targetWorkspace.sessions) ? targetWorkspace.sessions : [])
        .find(session => String(session?.status || '').toLowerCase() === 'live')
        || null;
    targetWorkspace.ui = targetWorkspace.ui && typeof targetWorkspace.ui === 'object' ? targetWorkspace.ui : {};
    targetWorkspace.ui.serverParticipantCount = liveSession
        ? Object.keys(liveSession.participants && typeof liveSession.participants === 'object' ? liveSession.participants : {}).length
        : 0;
}

function formatLmsLiveAnswerSyncError(error = {}) {
    const status = Number(error?.status || error?.httpStatus || 0);
    const message = repairLmsDisplayText(error?.message || '', '').toLowerCase();
    if (status === 403 || message.includes('roster') || message.includes('group')) {
        return 'You are not enrolled in this LMS group roster.';
    }
    if (status === 409 && message.includes('no live quiz')) {
        return 'This live quiz is not open right now. Wait for your professor to go live.';
    }
    if (status === 409 && message.includes('not accepting answers')) {
        return 'This question is not accepting answers right now.';
    }
    if (status === 409 && message.includes('already been answered')) {
        return 'You already answered this question.';
    }
    return repairLmsDisplayText(error?.message || 'Your answer could not be saved. Try again.', 'Your answer could not be saved. Try again.');
}

function bindLmsLiveQuizFocusRefresh() {
    if (typeof window === 'undefined' || window.__lmsLiveQuizFocusRefreshBound) return;
    window.__lmsLiveQuizFocusRefreshBound = true;
    const refreshFromServer = () => {
        if (!isLmsActiveTab('live-quiz') || typeof loadLmsLiveQuizWorkspace !== 'function') return;
        const courseKey = typeof getLmsTabCourseKey === 'function'
            ? getLmsTabCourseKey('live-quiz')
            : (currentCourseId || '');
        if (!courseKey) return;
        loadLmsLiveQuizWorkspace(courseKey, {
            force: true,
            forceMergeParticipants: true,
            render: true
        });
    };
    window.addEventListener('focus', refreshFromServer);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshFromServer();
    });
}

function getLmsLiveStudentSession(resourceKey) {
    return getLmsLiveSessions(resourceKey).find(session => session.status === 'live') || null;
}

function ensureLmsLiveStudentParticipant(resourceKey, session = null) {
    if (!session) return null;
    const meta = typeof getLmsLiveStudentMeta === 'function' ? getLmsLiveStudentMeta(resourceKey) : null;
    const participantId = String(meta?.id || '').trim();
    if (!participantId || participantId === 'student') return null;
    session.participants = session.participants && typeof session.participants === 'object' ? session.participants : {};
    if (!session.participants[participantId]) {
        const displayName = meta.name || `Student ${participantId}`;
        const nickname = typeof getUniqueLmsLiveNickname === 'function'
            ? getUniqueLmsLiveNickname(session, displayName, participantId)
            : displayName;
        session.participants[participantId] = normalizeLmsLiveParticipant({
            id: participantId,
            accountId: participantId,
            nickname,
            joinedAt: session.startedAt || new Date().toISOString(),
            lastSeenAt: new Date().toISOString()
        }, participantId);
    }
    return session.participants[participantId];
}

function ensureLmsLiveRosterParticipants(resourceKey, session = null) {
    if (!session || session.autoEnroll === false) return session;
    session.participants = session.participants && typeof session.participants === 'object' ? session.participants : {};
    const rosterOptions = { strictRoster: true };
    getLmsQuizEligibleStudents(resourceKey, rosterOptions).forEach(student => {
        const id = String(student?.id || '').trim();
        if (!id) return;
        session.participants[id] = normalizeLmsLiveParticipant({
            ...(session.participants[id] || {}),
            id,
            accountId: id,
            nickname: student.nameEn || student.name || `Student ${id}`,
            joinedAt: session.participants[id]?.joinedAt || session.startedAt || new Date().toISOString(),
            lastSeenAt: new Date().toISOString()
        }, id);
    });
    return session;
}

function getLmsLiveCurrentQuestion(session = null) {
    if (!session || !Array.isArray(session.questions) || !session.questions.length) return null;
    return session.questions[Math.min(Math.max(0, session.currentQuestionIndex || 0), session.questions.length - 1)] || null;
}

function getLmsLiveParticipantList(session = null) {
    return Object.values(session?.participants || {}).map(participant => normalizeLmsLiveParticipant(participant, participant.id));
}

function getLmsLiveLeaderboard(session = null) {
    return getLmsLiveParticipantList(session)
        .sort((left, right) => {
            const scoreDiff = Number(right.score || 0) - Number(left.score || 0);
            if (scoreDiff) return scoreDiff;
            const leftLatest = Math.max(0, ...Object.values(left.answers || {}).map(answer => Number(answer.responseMs || 0)).filter(Number.isFinite));
            const rightLatest = Math.max(0, ...Object.values(right.answers || {}).map(answer => Number(answer.responseMs || 0)).filter(Number.isFinite));
            const speedDiff = leftLatest - rightLatest;
            if (speedDiff) return speedDiff;
            return String(left.joinedAt || '').localeCompare(String(right.joinedAt || ''));
        });
}

function markLmsLiveQuestionActivated(question = null) {
    if (!question) return;
    question.state = 'showing';
    question.showVersion = Math.max(0, parseInt(question.showVersion, 10) || 0) + 1;
    question.activatedAt = new Date().toISOString();
    question.pausedAt = null;
    question.pausedRemainingMs = null;
    question.lockedAt = null;
    question.revealedAt = null;
}

function getLmsLiveQuestionTimeState(question = {}) {
    const state = String(question?.state || (question?.activatedAt ? 'showing' : 'draft')).toLowerCase();
    const activatedAt = question?.activatedAt ? new Date(question.activatedAt).getTime() : 0;
    const limitMs = Math.max(10000, Number(question?.timeLimit || 45) * 1000);
    const nowMs = Date.now();
    const elapsedMs = activatedAt ? Math.max(0, nowMs - activatedAt) : 0;
    const terminal = ['locked', 'revealed', 'completed'].includes(state);
    const remainingMs = state === 'paused' && Number.isFinite(Number(question?.pausedRemainingMs))
        ? Math.max(0, Number(question.pausedRemainingMs))
        : (terminal || !activatedAt)
            ? 0
            : Math.max(0, limitMs - elapsedMs);
    const expired = terminal || Boolean(activatedAt && elapsedMs > limitMs);
    return {
        state,
        activated: Boolean(activatedAt),
        expired,
        answerable: state === 'showing' && Boolean(activatedAt) && !expired,
        paused: state === 'paused',
        revealed: state === 'revealed',
        locked: ['locked', 'revealed', 'completed'].includes(state),
        elapsedMs,
        remainingMs,
        remainingSeconds: Math.max(0, Math.ceil(remainingMs / 1000))
    };
}

function getUniqueLmsLiveNickname(session = null, nickname = '', participantId = '') {
    const base = repairLmsDisplayText(nickname || 'Student', 'Student').slice(0, 24);
    const used = new Set(getLmsLiveParticipantList(session)
        .filter(participant => String(participant.id) !== String(participantId))
        .map(participant => String(participant.nickname || '').trim().toLowerCase())
        .filter(Boolean));
    if (!used.has(base.toLowerCase())) return base;
    for (let index = 2; index <= 99; index += 1) {
        const next = `${base.slice(0, 20)} ${index}`;
        if (!used.has(next.toLowerCase())) return next;
    }
    return `${base.slice(0, 18)} ${Date.now().toString().slice(-4)}`;
}

function calculateLmsLiveAnswerScore(question = {}, selectedOption = null, answeredAt = new Date()) {
    const isCorrect = Number(selectedOption) === Number(question.correctOption);
    const activatedAt = question.activatedAt ? new Date(question.activatedAt).getTime() : Date.now();
    const answerTime = answeredAt instanceof Date ? answeredAt.getTime() : new Date(answeredAt).getTime();
    const safeAnswerTime = Number.isFinite(answerTime) ? answerTime : Date.now();
    const elapsedMs = Math.max(0, safeAnswerTime - (Number.isFinite(activatedAt) ? activatedAt : safeAnswerTime));
    const limitMs = Math.max(10000, Number(question.timeLimit || 45) * 1000);
    if (!isCorrect) {
        return { correct: false, score: 0, responseMs: elapsedMs, speedRatio: 0 };
    }
    const remainingRatio = Math.max(0, Math.min(1, 1 - (elapsedMs / limitMs)));
    const speedPoints = Math.round((LMS_LIVE_MAX_SCORE - LMS_LIVE_MIN_CORRECT_SCORE) * remainingRatio);
    return {
        correct: true,
        score: LMS_LIVE_MIN_CORRECT_SCORE + speedPoints,
        responseMs: elapsedMs,
        speedRatio: remainingRatio
    };
}

function hasLmsLiveAnswerForQuestion(answer = null, question = null) {
    if (!answer || typeof answer !== 'object' || !question) return false;
    const answerVersion = Math.max(0, Number.parseInt(answer.showVersion, 10) || 0);
    const questionVersion = Math.max(0, Number.parseInt(question.showVersion, 10) || 0);
    if (answerVersion === questionVersion) return true;
    if (!answerVersion && questionVersion <= 1) return true;
    return false;
}

function recalculateLmsLiveParticipantScore(participant = {}, session = {}) {
    let streak = 0;
    let total = 0;
    (session.questions || []).forEach(question => {
        const answer = participant.answers?.[question.id];
        if (!answer || typeof answer !== 'object') return;
        const scored = calculateLmsLiveAnswerScore(
            question,
            answer.selectedOption,
            answer.answeredAt || new Date()
        );
        answer.correct = scored.correct;
        answer.score = scored.score;
        answer.responseMs = scored.responseMs;
        answer.speedRatio = scored.speedRatio;
        if (scored.correct) {
            streak += 1;
            const streakBonus = streak >= 3 ? Math.min(300, (streak - 2) * 50) : 0;
            answer.streakBonus = streakBonus;
            total += Number(scored.score || 0) + streakBonus;
        } else {
            streak = 0;
            answer.streakBonus = 0;
        }
    });
    participant.streak = streak;
    participant.score = total;
    return participant;
}

function rehydrateLmsLiveSessionParticipants(session = null) {
    if (!session || typeof session !== 'object') return session;
    const participants = session.participants && typeof session.participants === 'object' ? session.participants : {};
    Object.keys(participants).forEach(participantId => {
        participants[participantId] = recalculateLmsLiveParticipantScore(participants[participantId], session);
    });
    session.participants = participants;
    return session;
}

function getLmsLiveSessionStats(session = null) {
    const participants = getLmsLiveParticipantList(session);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const currentAnswerCount = currentQuestion
        ? participants.filter(participant => {
            const answer = participant.answers?.[currentQuestion.id];
            return hasLmsLiveAnswerForQuestion(answer, currentQuestion);
        }).length
        : 0;
    const totalAnswers = participants.reduce((sum, participant) => sum + Object.keys(participant.answers || {}).length, 0);
    return {
        participants: participants.length,
        currentAnswerCount,
        totalAnswers,
        questionCount: Array.isArray(session?.questions) ? session.questions.length : 0
    };
}

function getLmsLiveGroupSummary(subjectId, groupId) {
    const sections = LMS_SECTION_TYPES.map(sectionType => {
        const resourceKey = resolveCanonicalLmsResourceKey(`${subjectId}::${groupId}${getLmsSectionSuffix(sectionType)}`);
        const workspace = KIU_STATE.lmsLiveQuizzes?.[resourceKey];
        const sessions = Array.isArray(workspace?.sessions)
            ? workspace.sessions.map(session => normalizeLmsLiveSession(session, resourceKey))
            : [];
        const live = sessions.find(session => session.status === 'live') || null;
        const draft = sessions.find(session => session.status === 'draft') || null;
        return {
            sectionType,
            label: getLmsSectionMeta(sectionType).label,
            live,
            draft
        };
    });
    const liveSection = sections.find(section => section.live) || null;
    const draftCount = sections.filter(section => section.draft).length;
    const questionCount = sections.reduce((sum, section) => sum + Number((section.live || section.draft)?.questions?.length || 0), 0);
    return {
        isLive: Boolean(liveSection),
        label: liveSection ? `${liveSection.label} live` : (draftCount ? `${draftCount} prepared` : 'No live quiz'),
        questionCount,
        sections
    };
}

function resetLmsLiveQuizRuntimeState() {
    if (typeof window !== 'undefined') {
        window.__lmsLiveQuizWorkspaceActors = {};
        window.__lmsLiveQuizLastActorKey = {};
        window.__lmsLiveLoadGenerations = {};
        window.__lmsLiveRenderGenerations = {};
        window.__lmsLiveRenderFingerprints = {};
        window.__lmsLiveVolatileSignatures = {};
        window.__lmsLiveQuizLocalSyncAt = {};
        window.__lmsLiveQuizSyncPromises = {};
        window.__lmsLiveQuizLoadPromises = {};
        window.__lmsLiveClockTimers = {};
        window.__lmsLiveRealtimeTimers = {};
    }
    Object.values(KIU_STATE.lmsLiveQuizzes || {}).forEach(workspace => {
        if (!workspace || typeof workspace !== 'object') return;
        if (workspace.ui && typeof workspace.ui === 'object') {
            workspace.ui = {};
        }
    });
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        isLmsActiveTab,
        getLmsLiveQuizStructuralFingerprint,
        getLmsLiveQuizVolatileSignature,
        getLmsLiveQuizRenderFingerprint,
        storeLmsLiveQuizRenderFingerprint,
        markLmsLiveQuizLocalSync,
        shouldIgnoreLmsLiveQuizRealtimeUpdate,
        shouldApplyRemoteLmsLiveQuizWorkspace,
        mergeRemoteLmsLiveQuizParticipants,
        hasLmsLiveAnswerForQuestion,
        rehydrateLmsLiveSessionParticipants,
        shouldReloadLmsLiveQuizFromBackend,
        reloadActiveLmsLiveQuizFromServer,
        getLmsLiveStaffEditingSession,
        getLmsLiveStaffLiveSession,
        getLmsLiveStaffControlSession,
        buildLmsLiveQuizSyncPayload,
        countLmsLiveQuizAnswers,
        hasLmsLiveQuizLiveSession,
        getLmsLiveQuizRosterStats,
        formatLmsLiveAnswerSyncError,
        bindLmsLiveQuizFocusRefresh,
        rememberLmsLiveQuizServerParticipantCount,
        ensureLmsLiveStudentParticipant,
        getLmsLiveStaffSessionForQuestion,
        canAccessLmsLiveQuizScope,
        shouldSyncLmsLiveQuizWorkspace,
        flushLmsLiveQuizSync,
        submitLmsLiveQuizJoinChange,
        resetLmsLiveQuizRuntimeState,
        rerenderCurrentLmsLiveQuizWorkspace: function rerenderCurrentLmsLiveQuizWorkspace() {
            if (!isLmsActiveTab('live-quiz')) return;
            const courseKey = typeof getLmsTabCourseKey === 'function'
                ? getLmsTabCourseKey('live-quiz')
                : (currentCourseId || '');
            renderLmsLiveQuizSection(courseKey);
            if (typeof window.syncLmsTabRenderCacheFromDom === 'function') {
                const sectionType = typeof getCurrentLmsSectionType === 'function' ? getCurrentLmsSectionType() : '';
                window.syncLmsTabRenderCacheFromDom('live-quiz', courseKey, sectionType);
            }
        }
    });
}
