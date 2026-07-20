const { clone } = require('../utils');

function getLiveQuizCurrentQuestion(session = {}) {
    const questions = Array.isArray(session?.questions) ? session.questions : [];
    const index = Math.min(Math.max(0, Number.parseInt(session?.currentQuestionIndex, 10) || 0), Math.max(questions.length - 1, 0));
    return questions[index] || null;
}

function getLiveQuizQuestionTimeState(question = {}) {
    const state = String(question?.state || (question?.activatedAt ? 'showing' : 'draft')).trim().toLowerCase();
    const activatedAtMs = question?.activatedAt ? new Date(question.activatedAt).getTime() : 0;
    const limitMs = Math.max(10000, (Number.parseInt(question?.timeLimit, 10) || 45) * 1000);
    const nowMs = Date.now();
    const elapsedMs = Number.isFinite(activatedAtMs) && activatedAtMs > 0 ? Math.max(0, nowMs - activatedAtMs) : 0;
    const remainingMs = state === 'paused' && Number.isFinite(Number(question?.pausedRemainingMs))
        ? Math.max(0, Number(question.pausedRemainingMs))
        : (activatedAtMs ? Math.max(0, limitMs - elapsedMs) : limitMs);
    const expired = Boolean(activatedAtMs && elapsedMs > limitMs) || ['locked', 'revealed', 'completed'].includes(state);
    return {
        state,
        answerable: state === 'showing' && Boolean(activatedAtMs) && !expired,
        remainingMs
    };
}

function scoreLiveQuizAnswer(question = {}, selectedOption = null, answeredAt = new Date()) {
    const correct = Number(selectedOption) === Number(question.correctOption);
    const activatedAt = question?.activatedAt ? new Date(question.activatedAt).getTime() : Date.now();
    const answerTime = answeredAt instanceof Date ? answeredAt.getTime() : new Date(answeredAt).getTime();
    const safeAnswerTime = Number.isFinite(answerTime) ? answerTime : Date.now();
    const elapsedMs = Math.max(0, safeAnswerTime - (Number.isFinite(activatedAt) ? activatedAt : safeAnswerTime));
    if (!correct) return { correct: false, score: 0, responseMs: elapsedMs };
    const limitMs = Math.max(10000, (Number.parseInt(question?.timeLimit, 10) || 45) * 1000);
    const remainingRatio = Math.max(0, Math.min(1, 1 - (elapsedMs / limitMs)));
    return {
        correct: true,
        score: 500 + Math.round(500 * remainingRatio),
        responseMs: elapsedMs
    };
}

function recalculateLiveQuizParticipant(participant = {}, session = {}) {
    const questions = Array.isArray(session?.questions) ? session.questions : [];
    let score = 0;
    let streak = 0;
    const answers = participant.answers && typeof participant.answers === 'object' ? participant.answers : {};
    Object.entries(answers).forEach(([questionId, answer]) => {
        const question = questions.find(item => String(item?.id || '') === String(questionId || ''));
        if (!question || !answer || typeof answer !== 'object') return;
        const scored = scoreLiveQuizAnswer(question, Number(answer.selectedOption), answer.answeredAt || new Date());
        answer.correct = scored.correct;
        answer.score = scored.score;
        answer.responseMs = scored.responseMs;
        if (scored.correct) {
            streak += 1;
            const streakBonus = streak >= 3 ? Math.min(300, (streak - 2) * 50) : 0;
            answer.streakBonus = streakBonus;
            score += Number(scored.score || 0) + streakBonus;
        } else {
            streak = 0;
            answer.streakBonus = 0;
            score += Number(scored.score || 0);
        }
    });
    participant.score = score;
    participant.streak = streak;
    return participant;
}

function countLiveQuizAnswers(workspace = {}) {
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

function mergeLiveQuizParticipantAnswers(clientParticipant = {}, serverParticipant = {}) {
    const merged = {
        ...(clientParticipant && typeof clientParticipant === 'object' ? clientParticipant : {}),
        answers: {
            ...((clientParticipant?.answers && typeof clientParticipant.answers === 'object') ? clientParticipant.answers : {})
        }
    };
    const serverAnswers = serverParticipant?.answers && typeof serverParticipant.answers === 'object'
        ? serverParticipant.answers
        : {};
    Object.entries(serverAnswers).forEach(([questionId, serverAnswer]) => {
        if (!serverAnswer || typeof serverAnswer !== 'object') return;
        const clientAnswer = merged.answers[questionId];
        if (!clientAnswer || typeof clientAnswer !== 'object') {
            merged.answers[questionId] = { ...serverAnswer };
            return;
        }
        const serverVersion = Math.max(0, Number.parseInt(serverAnswer.showVersion, 10) || 0);
        const clientVersion = Math.max(0, Number.parseInt(clientAnswer.showVersion, 10) || 0);
        const serverTime = Date.parse(String(serverAnswer.answeredAt || '')) || 0;
        const clientTime = Date.parse(String(clientAnswer.answeredAt || '')) || 0;
        if (serverVersion > clientVersion || (serverVersion === clientVersion && serverTime >= clientTime)) {
            merged.answers[questionId] = { ...serverAnswer };
        }
    });
    if (Number(serverParticipant?.score || 0) > Number(merged.score || 0)) {
        merged.score = serverParticipant.score;
    }
    if (Number(serverParticipant?.streak || 0) > Number(merged.streak || 0)) {
        merged.streak = serverParticipant.streak;
    }
    return merged;
}

function mergeStaffLiveQuizWorkspace(existingWorkspace = {}, submittedWorkspace = {}) {
    const existing = clone(existingWorkspace && typeof existingWorkspace === 'object' ? existingWorkspace : {}) || { sessions: [] };
    const submitted = clone(submittedWorkspace && typeof submittedWorkspace === 'object' ? submittedWorkspace : {}) || { sessions: [] };
    const existingSessions = Array.isArray(existing.sessions) ? existing.sessions : [];
    const submittedSessions = Array.isArray(submitted.sessions) ? submitted.sessions : [];
    const mergedSessions = submittedSessions.map(submittedSession => {
        const existingSession = existingSessions.find(session => String(session?.id || '') === String(submittedSession?.id || ''));
        if (!existingSession) return submittedSession;
        const mergedSession = {
            ...submittedSession,
            participants: submittedSession?.participants && typeof submittedSession.participants === 'object'
                ? { ...submittedSession.participants }
                : {}
        };
        const existingParticipants = existingSession?.participants && typeof existingSession.participants === 'object'
            ? existingSession.participants
            : {};
        Object.entries(existingParticipants).forEach(([participantId, serverParticipant]) => {
            const clientParticipant = mergedSession.participants[participantId];
            mergedSession.participants[participantId] = mergeLiveQuizParticipantAnswers(
                clientParticipant || serverParticipant,
                serverParticipant
            );
        });
        return recalculateLiveQuizParticipantsInSession(mergedSession);
    });
    return {
        ...submitted,
        sessions: mergedSessions,
        updatedAt: submitted.updatedAt || existing.updatedAt
    };
}

function recalculateLiveQuizParticipantsInSession(session = {}) {
    const participants = session?.participants && typeof session.participants === 'object' ? session.participants : {};
    Object.keys(participants).forEach(participantId => {
        participants[participantId] = recalculateLiveQuizParticipant(participants[participantId], session);
    });
    session.participants = participants;
    return session;
}

function provisionLiveQuizParticipant(sessionAccount, helpers = {}) {
    const actorUserId = String(helpers.getActorUserId?.(sessionAccount) || '').trim();
    if (!actorUserId) return null;
    const now = new Date().toISOString();
    return {
        id: actorUserId,
        accountId: actorUserId,
        nickname: String(helpers.getLiveQuizActorName?.(sessionAccount) || 'Student').trim() || 'Student',
        answers: {},
        score: 0,
        streak: 0,
        joinedAt: now,
        lastSeenAt: now
    };
}

function mergeStudentLiveQuizJoin(existingWorkspace = {}, submittedWorkspace = {}, sessionAccount = null, helpers = {}) {
    const actorUserId = String(helpers.getActorUserId?.(sessionAccount) || '').trim();
    if (!actorUserId) return { error: 'Student session is missing an account id.', status: 403 };
    const nextWorkspace = clone(existingWorkspace && typeof existingWorkspace === 'object' ? existingWorkspace : {}) || { sessions: [] };
    nextWorkspace.sessions = Array.isArray(nextWorkspace.sessions) ? nextWorkspace.sessions : [];
    const submittedSessions = Array.isArray(submittedWorkspace?.sessions) ? submittedWorkspace.sessions : [];
    const existingSession = nextWorkspace.sessions.find(session => String(session?.status || '').toLowerCase() === 'live')
        || nextWorkspace.sessions.find(session => submittedSessions.some(item => String(item?.id || '') === String(session?.id || '')));
    if (!existingSession || String(existingSession.status || '').toLowerCase() !== 'live') {
        return { error: 'There is no live quiz open for answers.', status: 409 };
    }
    const submittedSession = submittedSessions.find(session => String(session?.id || '') === String(existingSession.id || '')) || {};
    const submittedParticipant = submittedSession?.participants && typeof submittedSession.participants === 'object'
        ? submittedSession.participants[actorUserId]
        : null;
    const existingParticipants = existingSession.participants && typeof existingSession.participants === 'object'
        ? existingSession.participants
        : {};
    existingSession.participants = existingParticipants;
    const currentParticipant = existingParticipants[actorUserId] && typeof existingParticipants[actorUserId] === 'object'
        ? existingParticipants[actorUserId]
        : null;
    const provisioned = currentParticipant || provisionLiveQuizParticipant(sessionAccount, helpers);
    if (!provisioned) {
        return { error: 'This live quiz is only open to students in the LMS group.', status: 403 };
    }
    const now = new Date().toISOString();
    const nextParticipant = {
        ...provisioned,
        ...(submittedParticipant && typeof submittedParticipant === 'object' ? submittedParticipant : {}),
        id: actorUserId,
        accountId: actorUserId,
        nickname: String(
            submittedParticipant?.nickname
            || helpers.getLiveQuizActorName?.(sessionAccount)
            || currentParticipant?.nickname
            || provisioned.nickname
            || 'Student'
        ).trim() || 'Student',
        answers: currentParticipant?.answers && typeof currentParticipant.answers === 'object'
            ? { ...currentParticipant.answers }
            : {},
        score: Number(currentParticipant?.score || provisioned.score || 0) || 0,
        streak: Number(currentParticipant?.streak || provisioned.streak || 0) || 0,
        joinedAt: currentParticipant?.joinedAt || submittedParticipant?.joinedAt || now,
        lastSeenAt: now
    };
    existingParticipants[actorUserId] = recalculateLiveQuizParticipant(nextParticipant, existingSession);
    return { workspace: nextWorkspace };
}

function mergeStudentLiveQuizAnswer(existingWorkspace = {}, submittedWorkspace = {}, sessionAccount = null, helpers = {}) {
    const actorUserId = String(helpers.getActorUserId?.(sessionAccount) || '').trim();
    if (!actorUserId) return { error: 'Student session is missing an account id.', status: 403 };
    const nextWorkspace = clone(existingWorkspace && typeof existingWorkspace === 'object' ? existingWorkspace : {}) || { sessions: [] };
    nextWorkspace.sessions = Array.isArray(nextWorkspace.sessions) ? nextWorkspace.sessions : [];
    const submittedSessions = Array.isArray(submittedWorkspace?.sessions) ? submittedWorkspace.sessions : [];
    const existingSession = nextWorkspace.sessions.find(session => String(session?.status || '').toLowerCase() === 'live')
        || nextWorkspace.sessions.find(session => submittedSessions.some(item => String(item?.id || '') === String(session?.id || '')));
    if (!existingSession || String(existingSession.status || '').toLowerCase() !== 'live') {
        return { error: 'There is no live quiz open for answers.', status: 409 };
    }
    const submittedSession = submittedSessions.find(session => String(session?.id || '') === String(existingSession.id || '')) || {};
    const currentQuestion = getLiveQuizCurrentQuestion(existingSession);
    if (!currentQuestion) return { error: 'There is no active question to answer.', status: 409 };
    const timeState = getLiveQuizQuestionTimeState(currentQuestion);
    if (!timeState.answerable) return { error: 'This question is not accepting answers right now.', status: 409 };
    const submittedParticipant = submittedSession?.participants && typeof submittedSession.participants === 'object'
        ? submittedSession.participants[actorUserId]
        : null;
    const submittedAnswer = submittedParticipant?.answers && typeof submittedParticipant.answers === 'object'
        ? submittedParticipant.answers[currentQuestion.id]
        : null;
    if (!submittedAnswer || typeof submittedAnswer !== 'object') {
        return { error: 'No answer was submitted for the active question.', status: 400 };
    }
    const selectedOption = Number.parseInt(submittedAnswer.selectedOption, 10);
    if (!Number.isInteger(selectedOption) || selectedOption < 0 || selectedOption > 3) {
        return { error: 'Answer option is invalid.', status: 400 };
    }
    const existingParticipants = existingSession.participants && typeof existingSession.participants === 'object'
        ? existingSession.participants
        : {};
    existingSession.participants = existingParticipants;
    if (!existingParticipants[actorUserId] || typeof existingParticipants[actorUserId] !== 'object') {
        const provisioned = provisionLiveQuizParticipant(sessionAccount, helpers);
        if (!provisioned) {
            return { error: 'This live quiz is only open to students in the LMS group.', status: 403 };
        }
        existingParticipants[actorUserId] = provisioned;
    }
    const participant = existingParticipants[actorUserId];
    participant.id = actorUserId;
    participant.accountId = actorUserId;
    participant.nickname = String(helpers.getLiveQuizActorName?.(sessionAccount) || participant.nickname || 'Student').trim() || 'Student';
    participant.answers = participant.answers && typeof participant.answers === 'object' ? participant.answers : {};
    const showVersion = Math.max(0, Number.parseInt(currentQuestion.showVersion, 10) || 0);
    const existingAnswer = participant.answers[currentQuestion.id];
    if (existingAnswer && Number(existingAnswer.showVersion || 0) === showVersion) {
        return { error: 'This question has already been answered.', status: 409 };
    }
    const now = new Date();
    const scored = scoreLiveQuizAnswer(currentQuestion, selectedOption, now);
    participant.answers[currentQuestion.id] = {
        questionId: currentQuestion.id,
        selectedOption,
        correct: scored.correct,
        score: scored.score,
        responseMs: scored.responseMs,
        answeredAt: now.toISOString(),
        showVersion,
        questionState: String(currentQuestion.state || 'showing').toLowerCase()
    };
    participant.lastSeenAt = now.toISOString();
    existingParticipants[actorUserId] = recalculateLiveQuizParticipant(participant, existingSession);
    return { workspace: nextWorkspace };
}

function submitStudentLiveQuizAnswer(existingWorkspace = {}, payload = {}, sessionAccount = null, helpers = {}) {
    const sessionId = String(payload?.sessionId || '').trim();
    const questionId = String(payload?.questionId || '').trim();
    const selectedOption = Number.parseInt(payload?.selectedOption, 10);
    if (!sessionId || !questionId || !Number.isInteger(selectedOption)) {
        return { error: 'sessionId, questionId, and selectedOption are required.', status: 400 };
    }
    const actorUserId = String(helpers.getActorUserId?.(sessionAccount) || '').trim();
    if (!actorUserId) return { error: 'Student session is missing an account id.', status: 403 };
    const submittedWorkspace = {
        sessions: [{
            id: sessionId,
            participants: {
                [actorUserId]: {
                    id: actorUserId,
                    answers: {
                        [questionId]: { selectedOption }
                    }
                }
            }
        }]
    };
    return mergeStudentLiveQuizAnswer(existingWorkspace, submittedWorkspace, sessionAccount, helpers);
}

function submitStudentLiveQuizJoin(existingWorkspace = {}, payload = {}, sessionAccount = null, helpers = {}) {
    const sessionId = String(payload?.sessionId || '').trim();
    if (!sessionId) {
        return { error: 'sessionId is required.', status: 400 };
    }
    const actorUserId = String(helpers.getActorUserId?.(sessionAccount) || '').trim();
    if (!actorUserId) return { error: 'Student session is missing an account id.', status: 403 };
    const now = new Date().toISOString();
    const submittedWorkspace = {
        sessions: [{
            id: sessionId,
            participants: {
                [actorUserId]: {
                    id: actorUserId,
                    nickname: String(payload?.nickname || helpers.getLiveQuizActorName?.(sessionAccount) || 'Student').trim() || 'Student',
                    joinedAt: payload?.joinedAt || now,
                    lastSeenAt: payload?.lastSeenAt || now
                }
            }
        }]
    };
    return mergeStudentLiveQuizJoin(existingWorkspace, submittedWorkspace, sessionAccount, helpers);
}

module.exports = {
    countLiveQuizAnswers,
    getLiveQuizCurrentQuestion,
    getLiveQuizQuestionTimeState,
    mergeStaffLiveQuizWorkspace,
    mergeStudentLiveQuizJoin,
    mergeStudentLiveQuizAnswer,
    mergeLiveQuizParticipantAnswers,
    recalculateLiveQuizParticipant,
    scoreLiveQuizAnswer,
    submitStudentLiveQuizAnswer,
    submitStudentLiveQuizJoin
};
