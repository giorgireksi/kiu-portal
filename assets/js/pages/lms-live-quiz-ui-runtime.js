/* LMS live quiz UI/render helpers extracted from lms.js. */

function getLmsLiveStudentId() {
    const currentId = String((typeof getCurrentUserId === 'function' ? getCurrentUserId() : '') || '').trim();
    if (currentId) return currentId;
    const key = 'KIU_LMS_LIVE_STUDENT_ID';
    try {
        const existing = localStorage.getItem(key);
        if (existing) return existing;
        const next = makeLmsLiveId('guest');
        localStorage.setItem(key, next);
        return next;
    } catch (error) {
        return makeLmsLiveId('guest');
    }
}

function canManageLmsLiveQuiz(resourceKey = currentCourseId) {
    const role = getEffectiveUserRole();
    if (role === USER_ROLES.ADMIN) return true;
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(resourceKey));
    return typeof canManageLmsClassSection === 'function'
        ? canManageLmsClassSection(parsed.sectionType || getCurrentLmsSectionType())
        : [USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role);
}

function renderLmsLiveScoreList(session = null, limit = 8) {
    const leaders = getLmsLiveLeaderboard(session).slice(0, limit);
    if (!leaders.length) {
        return `<div class="lms-live-copy">No enrolled students are visible yet.</div>`;
    }
    return leaders.map((participant, index) => `
        <div class="lms-live-score-row">
            <span class="lms-live-rank">${index + 1}</span>
            <div style="min-width:0;">
                <div style="font-weight:850; color:var(--lux-text); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHtml(participant.nickname)}</div>
                <div class="lms-live-copy" style="margin-top:2px; font-size:11px;">${escapeHtml(Object.keys(participant.answers || {}).length)} answered${participant.streak ? ` - ${escapeHtml(String(participant.streak))} streak` : ''}</div>
            </div>
            <strong>${escapeHtml(String(participant.score || 0))}</strong>
        </div>
    `).join('');
}

function getLmsLiveQuestionBreakdown(session = null, question = null) {
    const participants = getLmsLiveParticipantList(session);
    return LMS_LIVE_OPTION_KEYS.map((key, index) => {
        const count = participants.filter(participant => {
            const answer = participant.answers?.[question?.id];
            return answer
                && Number(answer.showVersion || 0) === Number(question?.showVersion || 0)
                && Number(answer.selectedOption) === index;
        }).length;
        return {
            key,
            index,
            count,
            percent: participants.length ? Math.round((count / participants.length) * 100) : 0
        };
    });
}

function renderLmsLiveQuestionBreakdown(session = null, question = null) {
    if (!question) return `<div class="lms-live-copy">Start a question to see answer distribution.</div>`;
    return `
        <div class="lms-live-breakdown">
            ${getLmsLiveQuestionBreakdown(session, question).map(item => `
                <div class="lms-live-breakdown-row">
                    <span class="lms-live-option-key">${escapeHtml(item.key)}</span>
                    <div class="lms-live-breakdown-bar"><span style="width:${escapeHtml(String(item.percent))}%;"></span></div>
                    <strong>${escapeHtml(String(item.count))}</strong>
                </div>
            `).join('')}
        </div>
    `;
}

function renderLmsLiveSessionSummary(session = null) {
    if (!session) return `<div class="lms-live-copy">No session summary available.</div>`;
    const participants = getLmsLiveParticipantList(session);
    const totalQuestions = (session.questions || []).length;
    const totalAnswers = participants.reduce((sum, participant) => sum + Object.keys(participant.answers || {}).length, 0);
    const correctAnswers = participants.reduce((sum, participant) => sum + Object.values(participant.answers || {}).filter(answer => answer.correct).length, 0);
    const participation = participants.length && totalQuestions ? Math.round((totalAnswers / (participants.length * totalQuestions)) * 100) : 0;
    const accuracy = totalAnswers ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    return `
        <div class="lms-live-stage">
            <div class="lms-live-pill-row" style="justify-content:center;">
                <span class="lms-live-pill"><i class="fas fa-users"></i> ${escapeHtml(String(participants.length))} students</span>
                <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${escapeHtml(String(totalQuestions))} questions</span>
                <span class="lms-live-pill"><i class="fas fa-chart-simple"></i> ${escapeHtml(String(participation))}% participation</span>
                <span class="lms-live-pill"><i class="fas fa-bullseye"></i> ${escapeHtml(String(accuracy))}% accuracy</span>
            </div>
            <div class="lms-live-question-text">Session results</div>
            <div class="lms-live-score-list" style="width:min(720px,100%); margin:0 auto;">${renderLmsLiveScoreList(session, 10)}</div>
        </div>
    `;
}

function toggleLmsLivePresentationMode(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    workspace.ui.presentationMode = !workspace.ui.presentationMode;
    saveLmsLiveQuizChange(resourceKey, 'presentation-mode');
    renderLmsLiveQuizSection(resourceKey);
}

function exportLmsLiveQuizCsv(resourceKey) {
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    const rows = [
        ['Rank', 'Student', 'Student ID', 'Score', 'Answered', 'Correct', 'Streak', 'Accuracy %', 'Average response ms']
    ];
    getLmsLiveLeaderboard(session).forEach((participant, index) => {
        const answers = Object.values(participant.answers || {});
        const correctCount = answers.filter(answer => answer.correct).length;
        const averageMs = answers.length ? Math.round(answers.reduce((sum, answer) => sum + Number(answer.responseMs || 0), 0) / answers.length) : 0;
        rows.push([
            String(index + 1),
            participant.nickname || '',
            participant.accountId || participant.id || '',
            String(participant.score || 0),
            String(answers.length),
            String(correctCount),
            String(participant.streak || 0),
            answers.length ? String(Math.round((correctCount / answers.length) * 100)) : '0',
            String(averageMs)
        ]);
    });
    rows.push([]);
    rows.push(['Question', 'State', 'Correct answer', 'Responses A', 'Responses B', 'Responses C', 'Responses D']);
    (session.questions || []).forEach((question, index) => {
        const breakdown = getLmsLiveQuestionBreakdown(session, question);
        rows.push([
            String(index + 1) + '. ' + String(question.text || ''),
            String(question.state || 'draft'),
            LMS_LIVE_OPTION_KEYS[Number(question.correctOption || 0)] || 'A',
            ...breakdown.map(item => String(item.count))
        ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${String(session.title || 'live-quiz').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'live-quiz'}-results.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
        link.remove();
    }, 0);
}

function createLmsLiveSession(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) {
        alert('Only course staff can create a live quiz session for this section.');
        return;
    }
    const token = toDomToken(resourceKey);
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const title = repairLmsDisplayText(document.getElementById(`lms-live-title-${token}`)?.value || 'Live Quiz', 'Live Quiz');
    const topic = repairLmsDisplayText(document.getElementById(`lms-live-topic-${token}`)?.value || '', '');
    const session = normalizeLmsLiveSession({
        title,
        topic,
        status: 'draft',
        joinCode: makeLmsLiveJoinCode(),
        createdBy: getSimulatedUserName(),
        questions: [],
        participants: {}
    }, resourceKey);
    workspace.sessions.unshift(session);
    workspace.ui.activeSessionId = session.id;
    saveLmsLiveQuizChange(resourceKey, 'session-created');
    renderLmsLiveQuizSection(resourceKey);
}

function saveLmsLiveSessionDetails(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const token = toDomToken(resourceKey);
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.title = repairLmsDisplayText(document.getElementById(`lms-live-title-${token}`)?.value || session.title, session.title || 'Live Quiz');
    session.topic = repairLmsDisplayText(document.getElementById(`lms-live-topic-${token}`)?.value || '', '');
    saveLmsLiveQuizChange(resourceKey, 'session-details-saved');
    renderLmsLiveQuizSection(resourceKey);
}

function ensureLmsLiveEditableSession(resourceKey) {
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    let session = getLmsLiveStaffSession(resourceKey);
    if (!session || session.status === 'ended') {
        session = normalizeLmsLiveSession({
            title: 'Live Quiz',
            status: 'draft',
            joinCode: makeLmsLiveJoinCode(),
            createdBy: getSimulatedUserName(),
            questions: [],
            participants: {}
        }, resourceKey);
        workspace.sessions.unshift(session);
    }
    return session;
}

function addLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) {
        alert('Only course staff can add live quiz questions.');
        return;
    }
    const token = toDomToken(resourceKey);
    const text = repairLmsDisplayText(document.getElementById(`lms-live-question-${token}`)?.value || '', '');
    if (!text) {
        alert('Write the question first.');
        return;
    }
    const options = LMS_LIVE_OPTION_KEYS.map((_, index) =>
        repairLmsDisplayText(document.getElementById(`lms-live-option-${index}-${token}`)?.value || '', '')
    );
    if (options.some(option => !option)) {
        alert('Fill all four answer options.');
        return;
    }
    const correctOption = Math.min(3, Math.max(0, parseInt(document.getElementById(`lms-live-correct-${token}`)?.value, 10) || 0));
    const timeLimit = Math.min(180, Math.max(10, parseInt(document.getElementById(`lms-live-timer-${token}`)?.value, 10) || 45));
    const topic = repairLmsDisplayText(document.getElementById(`lms-live-question-topic-${token}`)?.value || '', '');
    const session = ensureLmsLiveEditableSession(resourceKey);
    session.questions.push(normalizeLmsLiveQuestion({ text, options, correctOption, timeLimit, topic }));
    session.currentQuestionIndex = session.questions.length === 1 ? 0 : session.currentQuestionIndex;
    saveLmsLiveQuizChange(resourceKey, 'question-added');
    renderLmsLiveQuizSection(resourceKey);
}

function duplicateLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    const sourceIndex = session.questions.findIndex(question => String(question.id) === String(questionId));
    if (sourceIndex < 0) return;
    const source = session.questions[sourceIndex];
    const copy = normalizeLmsLiveQuestion({
        ...source,
        id: makeLmsLiveId('live-question'),
        text: `${source.text} (copy)`,
        state: 'draft',
        activatedAt: null,
        pausedAt: null,
        lockedAt: null,
        revealedAt: null,
        completedAt: null
    });
    session.questions.splice(sourceIndex + 1, 0, copy);
    saveLmsLiveQuizChange(resourceKey, 'question-duplicated');
    renderLmsLiveQuizSection(resourceKey);
}

function moveLmsLiveQuestion(resourceKey, questionId, direction) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    const fromIndex = session.questions.findIndex(question => String(question.id) === String(questionId));
    const toIndex = fromIndex + Number(direction || 0);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= session.questions.length) return;
    const [question] = session.questions.splice(fromIndex, 1);
    session.questions.splice(toIndex, 0, question);
    if (session.currentQuestionIndex === fromIndex) session.currentQuestionIndex = toIndex;
    else if (session.currentQuestionIndex === toIndex) session.currentQuestionIndex = fromIndex;
    saveLmsLiveQuizChange(resourceKey, 'question-moved');
    renderLmsLiveQuizSection(resourceKey);
}

function importLmsLiveQuestionsFromText(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const token = toDomToken(resourceKey);
    const raw = String(document.getElementById(`lms-live-import-${token}`)?.value || '').trim();
    if (!raw) {
        alert('Paste questions first. Format: Question | A | B | C | D | correct letter | seconds');
        return;
    }
    const session = ensureLmsLiveEditableSession(resourceKey);
    const added = raw.split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => {
        const parts = line.split(/[,|;]/).map(part => repairLmsDisplayText(part, '').trim());
        if (parts.length < 6) return null;
        const correctRaw = String(parts[5] || 'A').trim().toUpperCase();
        const correctOption = Math.max(0, LMS_LIVE_OPTION_KEYS.indexOf(correctRaw[0]));
        return normalizeLmsLiveQuestion({
            text: parts[0],
            options: parts.slice(1, 5),
            correctOption: correctOption < 0 ? 0 : correctOption,
            timeLimit: parseInt(parts[6], 10) || 45,
            topic: 'Imported'
        });
    }).filter(question => question && question.text && question.options.every(Boolean));
    if (!added.length) {
        alert('No valid questions found. Use: Question | A | B | C | D | correct letter | seconds');
        return;
    }
    session.questions.push(...added);
    session.currentQuestionIndex = session.questions.length === added.length ? 0 : session.currentQuestionIndex;
    saveLmsLiveQuizChange(resourceKey, 'questions-imported');
    renderLmsLiveQuizSection(resourceKey);
}

function activateLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    const index = session.questions.findIndex(question => String(question.id) === String(questionId));
    if (index < 0) return;
    session.questions.forEach((question, questionIndex) => {
        if (questionIndex !== index && ['showing', 'paused', 'locked', 'revealed'].includes(String(question.state || ''))) {
            question.state = 'completed';
            question.completedAt = question.completedAt || new Date().toISOString();
        }
    });
    session.currentQuestionIndex = index;
    session.status = 'live';
    session.startedAt = session.startedAt || new Date().toISOString();
    ensureLmsLiveRosterParticipants(resourceKey, session);
    markLmsLiveQuestionActivated(session.questions[index]);
    saveLmsLiveQuizChange(resourceKey, 'question-activated');
    renderLmsLiveQuizSection(resourceKey);
}

function setLmsLiveQuestionReady(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    const index = session.questions.findIndex(question => String(question.id) === String(questionId));
    if (index < 0) return;
    session.currentQuestionIndex = index;
    session.status = session.status === 'ended' ? 'draft' : session.status;
    session.questions[index].state = 'ready';
    session.questions[index].activatedAt = null;
    saveLmsLiveQuizChange(resourceKey, 'question-ready');
    renderLmsLiveQuizSection(resourceKey);
}

function pauseLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    if (!session || !question || String(question.state || '') !== 'showing') return;
    const timeState = getLmsLiveQuestionTimeState(question);
    question.state = 'paused';
    question.pausedAt = new Date().toISOString();
    question.pausedRemainingMs = timeState.remainingMs;
    saveLmsLiveQuizChange(resourceKey, 'question-paused');
    renderLmsLiveQuizSection(resourceKey);
}

function resumeLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    if (!session || !question || String(question.state || '') !== 'paused') return;
    const remainingMs = Number.isFinite(Number(question.pausedRemainingMs)) ? Number(question.pausedRemainingMs) : Number(question.timeLimit || 45) * 1000;
    const limitMs = Math.max(10000, Number(question.timeLimit || 45) * 1000);
    question.state = 'showing';
    question.activatedAt = new Date(Date.now() - Math.max(0, limitMs - remainingMs)).toISOString();
    question.pausedAt = null;
    question.pausedRemainingMs = null;
    saveLmsLiveQuizChange(resourceKey, 'question-resumed');
    renderLmsLiveQuizSection(resourceKey);
}

function lockLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    if (!session || !question) return;
    question.state = 'locked';
    question.lockedAt = new Date().toISOString();
    saveLmsLiveQuizChange(resourceKey, 'question-locked');
    renderLmsLiveQuizSection(resourceKey);
}

function revealLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    if (!session || !question) return;
    question.state = 'revealed';
    question.revealedAt = new Date().toISOString();
    session.showResults = true;
    saveLmsLiveQuizChange(resourceKey, 'question-revealed');
    renderLmsLiveQuizSection(resourceKey);
}

function toggleLmsLiveResults(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.showResults = !session.showResults;
    saveLmsLiveQuizChange(resourceKey, 'results-toggle');
    renderLmsLiveQuizSection(resourceKey);
}

function stepLmsLiveQuestion(resourceKey, direction) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session || !session.questions.length) return;
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    if (currentQuestion && ['showing', 'paused', 'locked', 'revealed'].includes(String(currentQuestion.state || ''))) {
        currentQuestion.state = 'completed';
        currentQuestion.completedAt = currentQuestion.completedAt || new Date().toISOString();
    }
    const nextIndex = Math.min(session.questions.length - 1, Math.max(0, Number(session.currentQuestionIndex || 0) + Number(direction || 0)));
    session.currentQuestionIndex = nextIndex;
    session.status = 'live';
    session.startedAt = session.startedAt || new Date().toISOString();
    ensureLmsLiveRosterParticipants(resourceKey, session);
    session.questions[nextIndex].state = 'ready';
    session.questions[nextIndex].activatedAt = null;
    session.questions[nextIndex].pausedAt = null;
    session.questions[nextIndex].pausedRemainingMs = null;
    session.showResults = false;
    saveLmsLiveQuizChange(resourceKey, 'question-stepped');
    renderLmsLiveQuizSection(resourceKey);
}

function startLmsLiveSession(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session || !session.questions.length) {
        alert('Add at least one question before starting.');
        return;
    }
    session.status = 'live';
    session.currentQuestionIndex = Math.min(session.currentQuestionIndex || 0, session.questions.length - 1);
    session.startedAt = session.startedAt || new Date().toISOString();
    session.endedAt = null;
    ensureLmsLiveRosterParticipants(resourceKey, session);
    session.questions.forEach((question, index) => {
        question.state = index === session.currentQuestionIndex ? 'ready' : (question.state === 'completed' ? 'completed' : 'draft');
        if (index === session.currentQuestionIndex) question.activatedAt = null;
    });
    session.showResults = false;
    saveLmsLiveQuizChange(resourceKey, 'session-started');
    renderLmsLiveQuizSection(resourceKey);
}

function endLmsLiveSession(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    saveLmsLiveQuizChange(resourceKey, 'session-ended');
    renderLmsLiveQuizSection(resourceKey);
}

function deleteLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.questions = session.questions.filter(question => String(question.id) !== String(questionId));
    session.currentQuestionIndex = Math.min(session.currentQuestionIndex || 0, Math.max(session.questions.length - 1, 0));
    saveLmsLiveQuizChange(resourceKey, 'question-deleted');
    renderLmsLiveQuizSection(resourceKey);
}

function clearLmsLiveAnswers(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    Object.values(session.participants || {}).forEach(participant => {
        participant.answers = {};
        participant.score = 0;
    });
    saveLmsLiveQuizChange(resourceKey, 'answers-cleared');
    renderLmsLiveQuizSection(resourceKey);
}

function joinLmsLiveQuiz(resourceKey, sessionId) {
    const session = getLmsLiveStudentSession(resourceKey);
    if (!session || String(session.id) !== String(sessionId)) {
        alert('This live quiz is not running now.');
        return;
    }
    const token = toDomToken(resourceKey);
    const participantId = getLmsLiveStudentId();
    const nickname = repairLmsDisplayText(document.getElementById(`lms-live-nickname-${token}`)?.value || '', '');
    if (!nickname) {
        alert('Write a nickname first.');
        return;
    }
    const uniqueNickname = getUniqueLmsLiveNickname(session, nickname, participantId);
    session.participants[participantId] = normalizeLmsLiveParticipant({
        ...(session.participants[participantId] || {}),
        id: participantId,
        accountId: participantId,
        nickname: uniqueNickname,
        lastSeenAt: new Date().toISOString()
    }, participantId);
    saveLmsLiveQuizChange(resourceKey, 'participant-joined');
    renderLmsLiveQuizSection(resourceKey);
}

function answerLmsLiveQuestion(resourceKey, sessionId, questionId, optionIndex) {
    const session = getLmsLiveStudentSession(resourceKey);
    if (!session || String(session.id) !== String(sessionId)) return;
    const participantId = getLmsLiveStudentId();
    ensureLmsLiveRosterParticipants(resourceKey, session);
    const participant = session.participants?.[participantId];
    if (!participant) {
        alert('You are not listed in this LMS group roster.');
        return;
    }
    const question = session.questions.find(item => String(item.id) === String(questionId));
    if (!question) return;
    const timeState = getLmsLiveQuestionTimeState(question);
    if (!timeState.answerable) {
        alert(timeState.paused ? 'The question is paused.' : 'Answers are closed for this question.');
        renderLmsLiveQuizSection(resourceKey);
        return;
    }
    participant.answers = participant.answers || {};
    if (participant.answers[question.id]?.showVersion === question.showVersion) return;
    const selectedOption = Math.min(3, Math.max(0, parseInt(optionIndex, 10) || 0));
    const answeredAt = new Date();
    const scoreResult = calculateLmsLiveAnswerScore(question, selectedOption, answeredAt);
    participant.answers[question.id] = {
        selectedOption,
        correct: scoreResult.correct,
        score: scoreResult.score,
        responseMs: scoreResult.responseMs,
        speedRatio: scoreResult.speedRatio,
        showVersion: question.showVersion,
        questionState: question.state,
        answeredAt: answeredAt.toISOString()
    };
    recalculateLmsLiveParticipantScore(participant, session);
    participant.lastSeenAt = new Date().toISOString();
    saveLmsLiveQuizChange(resourceKey, 'answer-submitted');
    renderLmsLiveQuizSection(resourceKey);
}

function renderLmsLiveQuestionOptions(question, session, participant = null, resourceKey = '') {
    const existingAnswer = participant?.answers?.[question.id] || null;
    const answer = existingAnswer && Number(existingAnswer.showVersion || 0) === Number(question.showVersion || 0) ? existingAnswer : null;
    const timeState = getLmsLiveQuestionTimeState(question);
    const revealAnswers = timeState.revealed || session?.showResults;
    return `
        <div class="lms-live-options">
            ${question.options.map((option, index) => {
                const selected = Number(answer?.selectedOption) === index;
                const correct = revealAnswers && Number(question.correctOption) === index;
                const classes = ['lms-live-option', selected ? 'is-selected' : '', correct ? 'is-correct' : ''].filter(Boolean).join(' ');
                const click = participant && !answer && timeState.answerable
                    ? `data-lms-click="answerLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(session.id)}, ${lmsInlineArg(question.id)}, ${index})"`
                    : '';
                const disabled = click ? '' : 'disabled';
                return `
                    <button type="button" class="${classes}" ${click} ${disabled}>
                        <span class="lms-live-option-key">${escapeHtml(LMS_LIVE_OPTION_KEYS[index])}</span>
                        <span class="lms-live-option-text">${escapeHtml(option)}</span>
                    </button>
                `;
            }).join('')}
        </div>
        ${timeState.paused ? `<div class="lms-live-copy" style="margin-top:10px; text-align:center;">Timer paused by course staff.</div>` : ''}
        ${timeState.expired && !timeState.paused ? `<div class="lms-live-copy" style="margin-top:10px; text-align:center;">Answers are closed for this question.</div>` : ''}
    `;
}

function renderLmsLiveSyncNotice(workspace = null) {
    const error = repairLmsDisplayText(workspace?.ui?.syncError || '', '');
    if (error) {
        return `
            <div class="lms-live-card" style="border-color:rgba(239,68,68,0.42); background:rgba(127,29,29,0.22); margin-bottom:14px;">
                <div class="lms-live-label" style="color:#fecaca;"><i class="fas fa-triangle-exclamation"></i> Live sync needs attention</div>
                <div class="lms-live-copy" style="margin-top:6px; color:#fee2e2;">${escapeHtml(error)}</div>
            </div>
        `;
    }
    if (workspace?.ui?.syncing) {
        return `
            <div class="lms-live-card" style="border-color:rgba(59,130,246,0.32); background:rgba(30,64,175,0.16); margin-bottom:14px;">
                <div class="lms-live-label"><i class="fas fa-rotate fa-spin"></i> Syncing live quiz</div>
            </div>
        `;
    }
    return '';
}

function renderLmsLiveStatusRail(question = null) {
    const state = String(question?.state || 'draft').toLowerCase();
    const steps = [
        ['ready', 'Ready'],
        ['showing', 'Showing'],
        ['paused', 'Paused'],
        ['locked', 'Locked'],
        ['revealed', 'Revealed']
    ];
    return `
        <div class="lms-live-status-rail" aria-label="Live question state">
            ${steps.map(([key, label]) => `<span class="lms-live-status-step ${state === key ? 'is-active' : ''}">${escapeHtml(label)}</span>`).join('')}
        </div>
    `;
}

function renderLmsLiveTimerMeter(question = null, timeState = null) {
    if (!question) return '';
    const limitSeconds = Math.max(10, Number(question.timeLimit || 45));
    const remainingSeconds = Math.max(0, Number(timeState?.remainingSeconds || limitSeconds));
    const progress = Math.max(0, Math.min(100, (remainingSeconds / limitSeconds) * 100));
    const label = timeState?.paused ? 'Paused' : timeState?.answerable ? 'Answer window' : 'Closed';
    return `
        <div class="lms-live-timer-shell">
            <div class="lms-live-timer-number">${escapeHtml(String(remainingSeconds))}</div>
            <div>
                <div class="lms-live-label" style="text-align:left; margin-bottom:7px;">${escapeHtml(label)} - ${escapeHtml(String(limitSeconds))}s question</div>
                <div class="lms-live-timer-track"><span class="lms-live-timer-fill" style="--live-progress:${progress.toFixed(2)}%;"></span></div>
            </div>
        </div>
    `;
}

function renderLmsLiveStaffWorkspace(context) {
    const resourceKey = context.resourceKey;
    const token = toDomToken(resourceKey);
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const session = getLmsLiveStaffSession(resourceKey);
    const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(resourceKey).sectionType || getCurrentLmsSectionType());
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    const stats = getLmsLiveSessionStats(session);
    const statusLabel = session ? (session.status === 'live' ? 'Live now' : session.status === 'ended' ? 'Ended' : 'Draft') : 'No session';
    const questionCards = session?.questions?.length ? session.questions.map((question, index) => {
        const isActive = currentQuestion && String(currentQuestion.id) === String(question.id);
        const answers = getLmsLiveParticipantList(session).filter(participant => participant.answers?.[question.id]).length;
        const questionState = String(question.state || 'draft');
        return `
            <div class="lms-live-question-item ${isActive ? 'is-active' : ''}">
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start;">
                    <div style="min-width:0;">
                        <div class="lms-live-label">Question ${index + 1}${question.topic ? ` - ${escapeHtml(question.topic)}` : ''}</div>
                        <div style="margin-top:5px; font-weight:850; color:var(--lux-text);">${escapeHtml(question.text)}</div>
                        <div class="lms-live-question-meta">
                            <span class="lms-live-pill"><i class="far fa-clock"></i> ${escapeHtml(String(question.timeLimit || 45))}s</span>
                            <span class="lms-live-pill"><span class="lms-live-answer-key">${escapeHtml(LMS_LIVE_OPTION_KEYS[question.correctOption] || 'A')}</span> correct</span>
                        </div>
                    </div>
                    <span class="lms-live-pill">${answers} answers</span>
                </div>
                <div class="lms-live-actions">
                    <span class="lms-live-pill ${questionState === 'showing' ? 'is-live' : questionState === 'paused' ? 'is-paused' : ['locked','revealed'].includes(questionState) ? 'is-locked' : ''}">${escapeHtml(questionState)}</span>
                    <button type="button" class="kiu-btn-outline" data-lms-click="moveLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)}, -1)"><i class="fas fa-arrow-up"></i></button>
                    <button type="button" class="kiu-btn-outline" data-lms-click="moveLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)}, 1)"><i class="fas fa-arrow-down"></i></button>
                    <button type="button" class="kiu-btn-outline" data-lms-click="duplicateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-copy"></i> Duplicate</button>
                    <button type="button" class="kiu-btn-outline" data-lms-click="setLmsLiveQuestionReady(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-eye-slash"></i> Ready</button>
                    <button type="button" class="kiu-btn-blue" data-lms-click="activateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-play"></i> Show</button>
                    <button type="button" class="kiu-btn-outline" data-lms-click="deleteLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-trash"></i> Remove</button>
                </div>
            </div>
        `;
    }).join('') : `<div class="lms-live-card"><div class="lms-live-copy">No questions yet. Add one from the right panel.</div></div>`;
    const questionState = String(currentQuestion?.state || 'draft');
    const answerStatusLabel = questionState === 'showing'
        ? `${escapeHtml(String(timeState?.remainingSeconds || currentQuestion?.timeLimit || 0))}s left`
        : questionState === 'paused'
            ? 'Paused'
            : questionState === 'ready'
                ? 'Ready, hidden from students'
                : ['locked', 'revealed', 'completed'].includes(questionState)
                    ? 'Answers closed'
                    : 'Hidden';
    const currentQuestionNumber = currentQuestion
        ? Math.max(1, (session?.questions || []).findIndex(question => String(question.id) === String(currentQuestion.id)) + 1)
        : 0;
    const stage = session?.status === 'ended' ? renderLmsLiveSessionSummary(session) : currentQuestion ? `
        <div class="lms-live-stage is-broadcast">
            <div class="lms-live-director-bar">
                <div class="lms-live-director-tile"><strong>${escapeHtml(String(currentQuestionNumber))}/${escapeHtml(String(stats.questionCount || 0))}</strong><span>Question</span></div>
                <div class="lms-live-director-tile"><strong>${escapeHtml(String(stats.currentAnswerCount))}/${escapeHtml(String(stats.participants))}</strong><span>Answered</span></div>
                <div class="lms-live-director-tile"><strong>${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s</strong><span>Timer</span></div>
                <div class="lms-live-director-tile"><strong>${escapeHtml(answerStatusLabel)}</strong><span>Student view</span></div>
            </div>
            ${renderLmsLiveStatusRail(currentQuestion)}
            <div class="lms-live-pill-row" style="justify-content:center;">
                <span class="lms-live-pill ${session.status === 'live' ? 'is-live' : ''}"><i class="fas fa-bolt"></i> ${escapeHtml(statusLabel)}</span>
                    <span class="lms-live-pill ${questionState === 'showing' ? 'is-live' : questionState === 'paused' ? 'is-paused' : ['locked','revealed'].includes(questionState) ? 'is-locked' : ''}"><i class="far fa-clock"></i> ${answerStatusLabel}</span>
                    <span class="lms-live-pill"><i class="fas fa-users"></i> ${stats.currentAnswerCount}/${stats.participants} answered</span>
                    <span class="lms-live-pill"><i class="fas fa-trophy"></i> ${LMS_LIVE_MAX_SCORE} max</span>
                </div>
            ${renderLmsLiveTimerMeter(currentQuestion, timeState)}
            <div class="lms-live-question-text">${escapeHtml(currentQuestion.text)}</div>
            ${renderLmsLiveQuestionOptions(currentQuestion, session)}
            ${renderLmsLiveQuestionBreakdown(session, currentQuestion)}
            <div class="lms-live-broadcast-actions">
                <button type="button" class="kiu-btn-blue" data-lms-click="activateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(currentQuestion.id)})"><i class="fas fa-eye"></i> Show</button>
                <button type="button" class="kiu-btn-outline" data-lms-click="pauseLmsLiveQuestion(${lmsInlineArg(resourceKey)})"><i class="fas fa-pause"></i> Pause</button>
                <button type="button" class="kiu-btn-outline" data-lms-click="resumeLmsLiveQuestion(${lmsInlineArg(resourceKey)})"><i class="fas fa-play"></i> Resume</button>
                <button type="button" class="kiu-btn-outline" data-lms-click="lockLmsLiveQuestion(${lmsInlineArg(resourceKey)})"><i class="fas fa-lock"></i> Lock</button>
                <button type="button" class="kiu-btn-outline" data-lms-click="revealLmsLiveQuestion(${lmsInlineArg(resourceKey)})"><i class="fas fa-check-circle"></i> Reveal</button>
            </div>
            <div class="lms-live-control-grid">
                <button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsLiveResults(${lmsInlineArg(resourceKey)})"><i class="fas fa-chart-simple"></i> Results</button>
                <button type="button" class="kiu-btn-outline" data-lms-click="stepLmsLiveQuestion(${lmsInlineArg(resourceKey)}, -1)"><i class="fas fa-arrow-left"></i> Previous</button>
                <button type="button" class="kiu-btn-outline" data-lms-click="stepLmsLiveQuestion(${lmsInlineArg(resourceKey)}, 1)">Next <i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="lms-live-operator-note">Manual flow: set a question ready, click Show when the professor reaches it, pause if discussion takes longer, lock answers, then reveal the correct answer and answer split.</div>
        </div>
    ` : `
        <div class="lms-live-stage is-waiting">
            <i class="fas fa-bolt" style="font-size:34px; color:var(--lux-accent); opacity:0.72;"></i>
            <div class="lms-live-question-text">Prepare a question, then show it during class.</div>
            <div class="lms-live-copy" style="margin:0 auto;">Students in this LMS group will see questions automatically. No join code is required.</div>
        </div>
    `;

    if (workspace.ui.presentationMode) {
        return `
            <div class="lms-live-shell lms-live-presentation">
                <section class="lms-live-hero">
                    <div>
                        <div class="lms-live-kicker"><i class="fas fa-display"></i> Presentation mode</div>
                        <div class="lms-live-title">${escapeHtml(session?.title || 'Live Quiz')}</div>
                    <div class="lms-live-copy">${escapeHtml(context.subject?.name || context.courseId || 'Subject')} - live broadcast for enrolled students</div>
                    </div>
                    <button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsLivePresentationMode(${lmsInlineArg(resourceKey)})"><i class="fas fa-compress"></i> Exit</button>
                </section>
                <section class="lms-live-layout">
                    <div class="lms-live-panel">${stage}</div>
                    <aside class="lms-live-side-stack">
                        <div class="lms-live-card">
                            <div class="lms-live-label">Leaderboard</div>
                            <div class="lms-live-score-list" style="margin-top:12px;">${renderLmsLiveScoreList(session, 10)}</div>
                        </div>
                    </aside>
                </section>
            </div>
        `;
    }

    return `
        <div class="lms-live-shell">
            <section class="lms-live-hero">
                <div>
                    <div class="lms-live-kicker"><i class="fas fa-bolt"></i> Live Quiz</div>
                    <div class="lms-live-title">${escapeHtml(context.subject?.name || context.courseId || 'Subject')} - ${escapeHtml(context.group?.name || context.groupId || 'Group')}</div>
                    <div class="lms-live-copy">Use short questions during the lecture or seminar. Students in this LMS group see the active question automatically; this is class engagement, not grading.</div>
                </div>
                <div class="lms-live-pill-row" style="justify-content:flex-end;">
                    <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                    <span class="lms-live-pill ${session?.status === 'live' ? 'is-live' : ''}"><i class="fas fa-circle"></i> ${escapeHtml(statusLabel)}</span>
                    ${session ? `<span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto shown to group</span>` : ''}
                    <span class="lms-live-pill"><i class="fas fa-user-group"></i> ${stats.participants} joined</span>
                    <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${stats.questionCount} questions</span>
                </div>
            </section>
            ${renderLmsLiveSyncNotice(workspace)}
            <section class="lms-live-layout">
                <div class="lms-live-side-stack">
                    <div class="lms-live-panel">${stage}</div>
                    <div class="lms-live-panel">
                        <div class="lms-route-card-head" style="margin-bottom:14px;">
                            <div>
                                <div class="lms-live-label">Question queue</div>
                                <div class="lms-route-card-title" style="margin-top:5px;">Ready for this group</div>
                            </div>
                            <div class="lms-live-actions">
                                ${session ? `<button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsLivePresentationMode(${lmsInlineArg(resourceKey)})"><i class="fas fa-display"></i> Present</button>` : ''}
                                ${session ? `<button type="button" class="kiu-btn-outline" data-lms-click="exportLmsLiveQuizCsv(${lmsInlineArg(resourceKey)})"><i class="fas fa-file-export"></i> Export</button>` : ''}
                                ${session && session.status !== 'ended' ? `<button type="button" class="kiu-btn-outline" data-lms-click="endLmsLiveSession(${lmsInlineArg(resourceKey)})"><i class="fas fa-stop"></i> End</button>` : ''}
                                ${session ? `<button type="button" class="kiu-btn-outline" data-lms-click="clearLmsLiveAnswers(${lmsInlineArg(resourceKey)})"><i class="fas fa-rotate"></i> Clear answers</button>` : ''}
                            </div>
                        </div>
                        <div class="lms-live-question-list">${questionCards}</div>
                    </div>
                </div>
                <aside class="lms-live-side-stack">
                    <div class="lms-live-card">
                        <div class="lms-live-label">Session</div>
                        <div class="lms-live-form-grid" style="margin-top:12px;">
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Title</span>
                                <input id="lms-live-title-${escapeHtml(token)}" class="lms-route-input" type="text" placeholder="e.g. Week 4 lecture quiz" value="${escapeHtml(session?.title || '')}">
                            </label>
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Topic</span>
                                <input id="lms-live-topic-${escapeHtml(token)}" class="lms-route-input" type="text" placeholder="Topic or slide section" value="${escapeHtml(session?.topic || '')}">
                            </label>
                            ${session ? `<button type="button" class="kiu-btn-outline" data-lms-click="saveLmsLiveSessionDetails(${lmsInlineArg(resourceKey)})"><i class="fas fa-save"></i> Save details</button>` : ''}
                            <button type="button" class="kiu-btn-blue" data-lms-click="createLmsLiveSession(${lmsInlineArg(resourceKey)})"><i class="fas fa-plus"></i> New session</button>
                        </div>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Add question</div>
                        <div class="lms-live-form-grid" style="margin-top:12px;">
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Question</span>
                                <textarea id="lms-live-question-${escapeHtml(token)}" class="lms-route-textarea" rows="3" placeholder="Ask one clear question from the current topic"></textarea>
                            </label>
                            <div class="lms-live-form-grid two">
                                ${LMS_LIVE_OPTION_KEYS.map((key, index) => `
                                    <label class="lms-route-field">
                                        <span class="lms-route-field-label">Option ${escapeHtml(key)}</span>
                                        <input id="lms-live-option-${index}-${escapeHtml(token)}" class="lms-route-input" type="text" placeholder="Answer ${escapeHtml(key)}">
                                    </label>
                                `).join('')}
                            </div>
                            <div class="lms-live-form-grid two">
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Correct answer</span>
                                    <select id="lms-live-correct-${escapeHtml(token)}" class="lms-route-select">
                                        ${LMS_LIVE_OPTION_KEYS.map((key, index) => `<option value="${index}">${escapeHtml(key)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Timer seconds</span>
                                    <input id="lms-live-timer-${escapeHtml(token)}" class="lms-route-input" type="number" min="10" max="180" value="45">
                                </label>
                            </div>
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Topic label</span>
                                <input id="lms-live-question-topic-${escapeHtml(token)}" class="lms-route-input" type="text" placeholder="Optional">
                            </label>
                            <button type="button" class="kiu-btn-blue" data-lms-click="addLmsLiveQuestion(${lmsInlineArg(resourceKey)})"><i class="fas fa-plus"></i> Add question</button>
                        </div>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Import questions</div>
                        <div class="lms-live-copy">One line per question: Question | A | B | C | D | correct letter | seconds</div>
                        <textarea id="lms-live-import-${escapeHtml(token)}" class="lms-route-textarea" rows="5" placeholder="What is 2+2? | 3 | 4 | 5 | 6 | B | 30"></textarea>
                        <button type="button" class="kiu-btn-outline" data-lms-click="importLmsLiveQuestionsFromText(${lmsInlineArg(resourceKey)})" style="margin-top:10px;"><i class="fas fa-file-import"></i> Import</button>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Leaderboard</div>
                        <div class="lms-live-score-list" style="margin-top:12px;">${renderLmsLiveScoreList(session)}</div>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Answer split</div>
                        <div style="margin-top:12px;">${renderLmsLiveQuestionBreakdown(session, currentQuestion)}</div>
                    </div>
                </aside>
            </section>
        </div>
    `;
}

function renderLmsLiveStudentWorkspace(context) {
    const resourceKey = context.resourceKey;
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const session = getLmsLiveStudentSession(resourceKey);
    const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(resourceKey).sectionType || getCurrentLmsSectionType());
    const participantId = getLmsLiveStudentId();
    if (session) ensureLmsLiveRosterParticipants(resourceKey, session);
    const participant = session?.participants?.[participantId] || null;
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    const stats = getLmsLiveSessionStats(session);

    if (!session || !currentQuestion || !['showing', 'paused', 'locked', 'revealed'].includes(String(currentQuestion.state || ''))) {
        return `
            <div class="lms-live-shell">
                <section class="lms-live-student-wait">
                    <div class="lms-live-pulse"><i class="fas fa-bolt"></i></div>
                    <div>
                        <div class="lms-live-kicker"><i class="fas fa-display"></i> Classroom live quiz</div>
                        <div class="lms-live-title">${session ? 'Waiting for the next question' : 'No live question right now'}</div>
                        <div class="lms-live-copy" style="max-width:620px;margin:10px auto 0;">${session ? 'Keep this screen open. The question appears automatically when your professor or TA clicks Show.' : 'When your professor or TA starts a question, it appears here automatically. No code is required.'}</div>
                    </div>
                    <div class="lms-live-pill-row" style="justify-content:center;">
                        <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                        <span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto broadcast</span>
                        <span class="lms-live-pill"><i class="fas fa-users"></i> ${stats.participants} joined</span>
                    </div>
                </section>
                ${renderLmsLiveSyncNotice(workspace)}
            </div>
        `;
    }

    const answer = participant?.answers?.[currentQuestion.id] || null;
    return `
        <div class="lms-live-shell lms-live-phone">
            <section class="lms-live-student-card">
                <div class="lms-live-pill-row">
                    <span class="lms-live-pill is-live"><i class="fas fa-bolt"></i> Live now</span>
                    <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                    <span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Group broadcast</span>
                    <span class="lms-live-pill"><i class="fas fa-users"></i> ${stats.participants} joined</span>
                </div>
                <div class="lms-live-title" style="font-size:clamp(22px,5vw,34px);">${escapeHtml(session.title || 'Live Quiz')}</div>
                <div class="lms-live-copy">${escapeHtml(context.subject?.name || context.courseId || 'Subject')} - ${escapeHtml(context.group?.name || context.groupId || 'Group')}</div>
            </section>
            ${renderLmsLiveSyncNotice(workspace)}
            ${participant ? `
                <section class="lms-live-panel">
                    <div class="lms-live-stage" style="min-height:320px;">
                        ${renderLmsLiveStatusRail(currentQuestion)}
                        <div class="lms-live-pill-row" style="justify-content:center;">
                            <span class="lms-live-pill ${timeState?.paused ? 'is-paused' : timeState?.answerable ? 'is-live' : 'is-locked'}"><i class="far fa-clock"></i> ${timeState?.paused ? 'Paused' : timeState?.answerable ? `${escapeHtml(String(timeState?.remainingSeconds || currentQuestion.timeLimit))}s left` : 'Answers closed'}</span>
                            <span class="lms-live-pill"><i class="fas fa-user"></i> ${escapeHtml(participant.nickname)}</span>
                            ${answer ? `<span class="lms-live-pill ${answer.correct ? 'is-live' : ''}"><i class="fas ${answer.correct ? 'fa-check' : 'fa-circle'}"></i> ${answer.correct ? `+${escapeHtml(String((answer.score || 0) + (answer.streakBonus || 0)))}` : '0 pts'}</span>` : `<span class="lms-live-pill"><i class="fas fa-trophy"></i> ${LMS_LIVE_MAX_SCORE} max</span>`}
                        </div>
                        ${renderLmsLiveTimerMeter(currentQuestion, timeState)}
                        <div class="lms-live-question-text">${escapeHtml(currentQuestion.text)}</div>
                        ${renderLmsLiveQuestionOptions(currentQuestion, session, participant, resourceKey)}
                    </div>
                </section>
                <section class="lms-live-student-card">
                    <div class="lms-live-label">Class ranking</div>
                    <div class="lms-live-score-list" style="margin-top:12px;">${renderLmsLiveScoreList(session, 6)}</div>
                </section>
            ` : `
                <section class="lms-live-student-card">
                    <div class="lms-live-title">You are not listed in this group roster</div>
                    <div class="lms-live-copy">Ask course staff to check your LMS group membership.</div>
                </section>
            `}
        </div>
    `;
}

function renderLmsLiveQuizSection(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('live-quiz', contentArea);
    const context = resolveActiveLmsQuizContext(courseId);
    if (!context?.resourceKey) {
        contentArea.innerHTML = renderLmsRouteEmptyState('Open a group first', 'Live quiz is available inside each subject group.', 'fa-bolt');
        return;
    }
    ensureLmsLiveQuizWorkspace(context.resourceKey);
    loadLmsLiveQuizWorkspace(context.resourceKey);
    scheduleLmsLiveClockRefresh(context.resourceKey);
    contentArea.innerHTML = canManageLmsLiveQuiz(context.resourceKey)
        ? renderLmsLiveStaffWorkspace(context)
        : renderLmsLiveStudentWorkspace(context);
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        renderLmsLiveQuizSection,
        handleLmsLiveQuizRealtimeUpdate,
        startLmsLiveSession,
        endLmsLiveSession,
        activateLmsLiveQuestion,
        setLmsLiveQuestionReady,
        stepLmsLiveQuestion,
        pauseLmsLiveQuestion,
        resumeLmsLiveQuestion,
        lockLmsLiveQuestion,
        revealLmsLiveQuestion,
        toggleLmsLiveResults,
        clearLmsLiveAnswers,
        deleteLmsLiveQuestion,
        duplicateLmsLiveQuestion,
        moveLmsLiveQuestion,
        importLmsLiveQuestionsFromText,
        addLmsLiveQuestion,
        createLmsLiveSession,
        saveLmsLiveSessionDetails,
        answerLmsLiveQuestion
    });
}
