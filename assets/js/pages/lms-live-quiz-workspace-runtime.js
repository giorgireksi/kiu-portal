/* LMS live quiz workspace/state helpers extracted from lms.js. */

const LMS_LIVE_OPTION_KEYS = ['A', 'B', 'C', 'D'];
const LMS_LIVE_MAX_SCORE = 1000;
const LMS_LIVE_MIN_CORRECT_SCORE = 500;
const LMS_LIVE_SYNC_DEBOUNCE_MS = 350;
const LMS_LIVE_QUESTION_STATES = ['draft', 'ready', 'showing', 'paused', 'locked', 'revealed', 'completed'];

function makeLmsLiveId(prefix = 'live') {
    if (typeof makeAdminExamEntityId === 'function') return makeAdminExamEntityId(prefix);
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function makeLmsLiveJoinCode() {
    return Math.random().toString(36).replace(/[^a-z0-9]/gi, '').slice(2, 8).toUpperCase().padEnd(6, 'X');
}

function normalizeLmsLiveQuestion(question = {}, index = 0) {
    const options = Array.isArray(question.options) ? question.options.slice(0, 4) : [];
    while (options.length < 4) options.push('');
    return {
        id: String(question.id || makeLmsLiveId('live-question')),
        topic: repairLmsDisplayText(question.topic || '', ''),
        text: repairLmsDisplayText(question.text || '', ''),
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
        ? session.questions.map((question, index) => normalizeLmsLiveQuestion(question, index)).filter(question => question.text)
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
        joinCode: repairLmsDisplayText(session.joinCode || makeLmsLiveJoinCode(), makeLmsLiveJoinCode()).slice(0, 8).toUpperCase(),
        title: repairLmsDisplayText(session.title || 'Live Quiz', 'Live Quiz'),
        topic: repairLmsDisplayText(session.topic || '', ''),
        status,
        currentQuestionIndex: Math.min(Math.max(0, parseInt(session.currentQuestionIndex, 10) || 0), Math.max(questions.length - 1, 0)),
        showLeaderboard: session.showLeaderboard !== false,
        showResults: session.showResults === true,
        nicknameMode: session.nicknameMode !== false,
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
        ? workspace.sessions.map(session => normalizeLmsLiveSession(session, canonicalKey))
        : [];
    workspace.ui = workspace.ui && typeof workspace.ui === 'object' ? workspace.ui : {};
    return workspace;
}

function applyLmsLiveQuizWorkspace(resourceKey, workspace = null, options = {}) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || !workspace || typeof workspace !== 'object') return null;
    ensureLmsStores();
    KIU_STATE.lmsLiveQuizzes[canonicalKey] = workspace;
    const normalized = ensureLmsLiveQuizWorkspace(canonicalKey);
    const isLiveTabOpen = typeof isLmsActiveTab === 'function'
        ? isLmsActiveTab('live-quiz')
        : (typeof currentLMSTab !== 'undefined' && currentLMSTab === 'live-quiz');
    if (options.render !== false && isLiveTabOpen) {
        renderLmsLiveQuizSection(canonicalKey);
    }
    return normalized;
}

function queueLmsLiveQuizBackendSync(resourceKey, reason = 'live-quiz') {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof syncLmsLiveQuizWorkspace !== 'function') return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.syncing = true;
    clearTimeout(workspace.ui.syncTimer);
    workspace.ui.syncTimer = setTimeout(() => {
        const payload = typeof cloneState === 'function' ? cloneState(ensureLmsLiveQuizWorkspace(canonicalKey)) : JSON.parse(JSON.stringify(ensureLmsLiveQuizWorkspace(canonicalKey)));
        delete payload.ui?.syncTimer;
        syncLmsLiveQuizWorkspace(canonicalKey, payload, reason)
            .then(savedWorkspace => {
                if (savedWorkspace) {
                    applyLmsLiveQuizWorkspace(canonicalKey, savedWorkspace, { render: false });
                }
                ensureLmsLiveQuizWorkspace(canonicalKey).ui.syncError = '';
            })
            .catch(error => {
                const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
                latest.ui.syncError = repairLmsDisplayText(error?.message || 'Live quiz sync failed. Try again.', 'Live quiz sync failed. Try again.');
            })
            .finally(() => {
                const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
                latest.ui.syncing = false;
                const isLiveTabOpen = typeof isLmsActiveTab === 'function'
                    ? isLmsActiveTab('live-quiz')
                    : (typeof currentLMSTab !== 'undefined' && currentLMSTab === 'live-quiz');
                if (isLiveTabOpen) renderLmsLiveQuizSection(canonicalKey);
            });
    }, LMS_LIVE_SYNC_DEBOUNCE_MS);
}

function loadLmsLiveQuizWorkspace(resourceKey, options = {}) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof fetchLmsLiveQuizWorkspace !== 'function') return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    if (!options.force && (workspace.ui.loadedFromBackend || workspace.ui.loadingFromBackend)) return;
    workspace.ui.loadingFromBackend = true;
    fetchLmsLiveQuizWorkspace(canonicalKey)
        .then(remoteWorkspace => {
            if (remoteWorkspace) applyLmsLiveQuizWorkspace(canonicalKey, remoteWorkspace, { render: true });
            ensureLmsLiveQuizWorkspace(canonicalKey).ui.loadedFromBackend = true;
            ensureLmsLiveQuizWorkspace(canonicalKey).ui.syncError = '';
        })
        .catch(error => {
            const latest = ensureLmsLiveQuizWorkspace(canonicalKey);
            latest.ui.syncError = repairLmsDisplayText(error?.message || 'Live quiz could not be loaded.', 'Live quiz could not be loaded.');
        })
        .finally(() => {
            ensureLmsLiveQuizWorkspace(canonicalKey).ui.loadingFromBackend = false;
        });
}

function handleLmsLiveQuizRealtimeUpdate(payload = {}) {
    const resourceKey = resolveCanonicalLmsResourceKey(payload.resourceKey || currentCourseId || '');
    if (!resourceKey) return;
    const isLiveTabOpen = typeof isLmsActiveTab === 'function'
        ? isLmsActiveTab('live-quiz')
        : (typeof currentLMSTab !== 'undefined' && currentLMSTab === 'live-quiz');
    loadLmsLiveQuizWorkspace(resourceKey, { force: true });
    if (isLiveTabOpen) {
        setTimeout(() => renderLmsLiveQuizSection(resourceKey), 120);
    }
}

function saveLmsLiveQuizChange(resourceKey, reason = 'live-quiz') {
    saveState();
    queueLmsLiveQuizBackendSync(resourceKey, reason);
}

function scheduleLmsLiveClockRefresh(resourceKey) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsLiveClockTimers = window.__lmsLiveClockTimers || {};
    clearTimeout(window.__lmsLiveClockTimers[canonicalKey]);
    const session = canManageLmsLiveQuiz(canonicalKey) ? getLmsLiveStaffSession(canonicalKey) : getLmsLiveStudentSession(canonicalKey);
    const question = getLmsLiveCurrentQuestion(session);
    const timeState = question ? getLmsLiveQuestionTimeState(question) : null;
    if (!session || session.status !== 'live' || !question || timeState?.expired) return;
    window.__lmsLiveClockTimers[canonicalKey] = setTimeout(() => {
        const isLiveTabOpen = typeof isLmsActiveTab === 'function'
            ? isLmsActiveTab('live-quiz')
            : (typeof currentLMSTab !== 'undefined' && currentLMSTab === 'live-quiz');
        if (isLiveTabOpen) renderLmsLiveQuizSection(canonicalKey);
    }, 1000);
}

function getLmsLiveSessions(resourceKey) {
    return ensureLmsLiveQuizWorkspace(resourceKey).sessions;
}

function getLmsLiveStaffSession(resourceKey) {
    const sessions = getLmsLiveSessions(resourceKey);
    return sessions.find(session => session.status === 'live')
        || sessions.find(session => session.status === 'draft')
        || sessions[0]
        || null;
}

function getLmsLiveStudentSession(resourceKey) {
    return getLmsLiveSessions(resourceKey).find(session => session.status === 'live') || null;
}

function ensureLmsLiveRosterParticipants(resourceKey, session = null) {
    if (!session || session.autoEnroll === false) return session;
    session.participants = session.participants && typeof session.participants === 'object' ? session.participants : {};
    getLmsQuizEligibleStudents(resourceKey).forEach(student => {
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
    const remainingMs = state === 'paused' && Number.isFinite(Number(question?.pausedRemainingMs))
        ? Math.max(0, Number(question.pausedRemainingMs))
        : (activatedAt ? Math.max(0, limitMs - elapsedMs) : limitMs);
    const expired = Boolean(activatedAt && elapsedMs > limitMs) || ['locked', 'revealed', 'completed'].includes(state);
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

function recalculateLmsLiveParticipantScore(participant = {}, session = {}) {
    let streak = 0;
    let total = 0;
    (session.questions || []).forEach(question => {
        const answer = participant.answers?.[question.id];
        if (!answer) return;
        if (answer.correct) {
            streak += 1;
            const streakBonus = streak >= 3 ? Math.min(300, (streak - 2) * 50) : 0;
            answer.streakBonus = streakBonus;
            total += Number(answer.score || 0) + streakBonus;
        } else {
            streak = 0;
            answer.streakBonus = 0;
        }
    });
    participant.streak = streak;
    participant.score = total;
    return participant;
}

function getLmsLiveSessionStats(session = null) {
    const participants = getLmsLiveParticipantList(session);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const currentAnswerCount = currentQuestion
        ? participants.filter(participant => {
            const answer = participant.answers?.[currentQuestion.id];
            return answer && Number(answer.showVersion || 0) === Number(currentQuestion.showVersion || 0);
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
