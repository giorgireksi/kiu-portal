/* Live-quiz session/question/broadcast UI helpers. Peeled from lms-live-quiz-ui-runtime.js.
 * Load before lms-live-quiz-ui-runtime.js.
 */
(function initLmsLiveQuizSessionRuntime() {
    if (window.__KIU_LMS_LIVE_QUIZ_SESSION_LOADED) return;
    window.__KIU_LMS_LIVE_QUIZ_SESSION_LOADED = true;

    window.__kiuCreateLmsLiveQuizSessionApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function isLmsLiveSessionRemoveDialogOpen() {
    return typeof document !== 'undefined' && Boolean(document.getElementById('lms-live-session-remove-overlay'));
}

function closeLmsLiveSessionRemoveDialog() {
    if (typeof document === 'undefined') return;
    const overlay = document.getElementById('lms-live-session-remove-overlay');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function renderLmsLiveSessionRemoveDialogCard(resourceKey, session = null, step = 1) {
    const displayName = repairLmsDisplayText(session?.title || 'Live Quiz', 'Live Quiz');
    const stats = typeof getLmsLiveSessionStats === 'function' ? getLmsLiveSessionStats(session) : {};
    const status = String(session?.status || 'draft').toLowerCase();
    const isLive = status === 'live';
    const statusLabel = status === 'live' ? 'Live now' : status === 'ended' ? 'Ended' : 'Draft';
    const warningCopy = isLive
        ? 'This session is live. Removing it will end the broadcast for students immediately.'
        : 'Questions, answers, and rankings for this session will be permanently removed.';
    const confirmCopy = isLive
        ? `Remove ${displayName} now? Students will immediately lose access to this live session.`
        : `Remove ${displayName} permanently? This cannot be undone.`;
    const stepBody = step === 1
        ? `<div class="lms-live-session-remove-preview">
            <div class="lms-live-session-remove-preview-title">${escapeHtml(displayName)}</div>
            <div class="lms-live-session-remove-preview-meta">
                <span class="lms-live-pill ${isLive ? 'is-live' : ''}"><i class="fas fa-circle"></i> ${escapeHtml(statusLabel)}</span>
                <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${escapeHtml(String(stats.questionCount || 0))} questions</span>
                <span class="lms-live-pill"><i class="fas fa-users"></i> ${escapeHtml(String(stats.participants || 0))} students</span>
            </div>
            <div class="lms-live-session-remove-warning ${isLive ? 'is-live' : ''}">${escapeHtml(warningCopy)}</div>
        </div>`
        : `<div class="lms-live-session-remove-warning ${isLive ? 'is-live' : ''}">${escapeHtml(confirmCopy)}</div>`;
    const actions = step === 1
        ? `<button type="button" class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-lms-click="closeLmsLiveSessionRemoveDialog()">Cancel</button>
            <button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" data-lms-click="advanceLmsLiveSessionRemoveDialog(${lmsInlineArg(resourceKey)}, 2)">Next</button>`
        : `<button type="button" class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-lms-click="advanceLmsLiveSessionRemoveDialog(${lmsInlineArg(resourceKey)}, 1)">Back</button>
            <button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" data-lms-click="confirmLmsLiveSessionRemove(${lmsInlineArg(resourceKey)})"><i class="fas fa-trash"></i> Remove session</button>`;
    return renderLmsGlassDialogCard({
        hookClass: 'lms-live-session-remove-card',
        title: 'Remove session',
        icon: 'fa-trash-can',
        subtitle: `Step ${step} of 2 · ${escapeHtml(displayName)}`,
        closeAttr: 'data-lms-click="closeLmsLiveSessionRemoveDialog()"',
        bodyHtml: `
            <div class="lms-live-session-remove-steps">
                <span class="lms-live-session-remove-step ${step === 1 ? 'is-active' : 'is-complete'}">1 Review</span>
                <span class="lms-live-session-remove-step ${step === 2 ? 'is-active' : ''}">2 Confirm</span>
            </div>
            ${stepBody}`,
        actionsHtml: actions
    });
}

function renderLmsLiveSessionRemoveDialog(resourceKey, session = null, step = 1) {
    return renderLmsLiveSessionRemoveDialogCard(resourceKey, session, step);
}

function mountLmsLiveSessionRemoveDialog(resourceKey, step = 1) {
    if (typeof document === 'undefined') return;
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const session = typeof getLmsLiveStaffEditingSession === 'function'
        ? getLmsLiveStaffEditingSession(canonicalKey)
        : null;
    if (!session) return;
    let overlay = document.getElementById('lms-live-session-remove-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'lms-live-session-remove-overlay';
        overlay.className = 'lms-live-session-remove-overlay lms-glass-dialog-overlay';
        document.body.appendChild(overlay);
        overlay.innerHTML = renderLmsLiveSessionRemoveDialog(canonicalKey, session, step);
    } else {
        const card = overlay.querySelector('.lms-live-session-remove-card');
        if (card) {
            overlay.innerHTML = renderLmsLiveSessionRemoveDialogCard(canonicalKey, session, step);
        } else {
            overlay.innerHTML = renderLmsLiveSessionRemoveDialog(canonicalKey, session, step);
        }
    }
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.sessionRemoveStep = step;
    workspace.ui.sessionRemoveTargetId = session.id;
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

function openLmsLiveSessionRemoveDialog(resourceKey) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const sessions = Array.isArray(workspace.sessions) ? workspace.sessions : [];
    if (sessions.length < 2) {
        notifyLmsLiveStaffGuard('At least one session must remain in this group.');
        return;
    }
    if (!getLmsLiveStaffEditingSession(canonicalKey)) return;
    mountLmsLiveSessionRemoveDialog(canonicalKey, 1);
}

function advanceLmsLiveSessionRemoveDialog(resourceKey, step = 1) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey) return;
    mountLmsLiveSessionRemoveDialog(canonicalKey, Math.min(2, Math.max(1, Number(step) || 1)));
}

function confirmLmsLiveSessionRemove(resourceKey) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const targetId = String(workspace.ui?.sessionRemoveTargetId || '').trim()
        || String(getLmsLiveStaffEditingSession(canonicalKey)?.id || '').trim();
    const session = (Array.isArray(workspace.sessions) ? workspace.sessions : [])
        .find(item => String(item?.id || '') === targetId);
    if (!session) return;
    closeLmsLiveSessionRemoveDialog();
    deleteLmsLiveSession(canonicalKey, session.id);
}

function deleteLmsLiveSession(resourceKey, sessionId) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return;
    if (typeof markLmsLiveQuizLocalSync === 'function') {
        markLmsLiveQuizLocalSync(canonicalKey, 'session-deleted');
    }
    syncLmsLiveSessionDetailsFromDom(canonicalKey);
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const sessions = Array.isArray(workspace.sessions) ? workspace.sessions : [];
    if (sessions.length < 2) {
        notifyLmsLiveStaffGuard('At least one session must remain in this group.');
        return;
    }
    const normalizedSessionId = String(sessionId || '').trim();
    if (!sessions.some(item => String(item?.id || '') === normalizedSessionId)) return;
    const deletedSession = sessions.find(item => String(item?.id || '') === normalizedSessionId);
    const wasLive = String(deletedSession?.status || '').toLowerCase() === 'live';
    const wasActive = String(workspace.ui?.activeSessionId || '') === normalizedSessionId;
    workspace.sessions = sessions.filter(item => String(item?.id || '') !== normalizedSessionId);
    if (wasActive || !workspace.sessions.some(item => String(item?.id || '') === String(workspace.ui?.activeSessionId || ''))) {
        const fallback = workspace.sessions.find(item => String(item?.status || '').toLowerCase() === 'draft')
            || workspace.sessions[0]
            || null;
        workspace.ui.activeSessionId = fallback?.id || null;
    }
    workspace.ui.sessionRemoveStep = 1;
    workspace.ui.sessionRemoveTargetId = null;
    if (wasLive && typeof unmountLmsLivePodiumOverlay === 'function') {
        unmountLmsLivePodiumOverlay();
    }
    if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
        window.invalidateLmsLiveQuizTabCache(canonicalKey);
    }
    saveLmsLiveQuizChange(canonicalKey, 'session-deleted', { skipBackendSync: true });
    syncStaffLmsLiveQuizSessionChange(canonicalKey, 'session-deleted', {
        includeQueue: wasActive || wasLive,
        includeBroadcast: wasLive,
        includeHeroStats: true
    });
}

function renderLmsLiveSessionCardHeader(resourceKey, sessions = [], editingSession = null) {
    const items = Array.isArray(sessions) ? sessions : [];
    const removeButton = items.length >= 2 && editingSession
        ? `<button type="button" class="lux-secondary-btn lms-live-session-remove-btn" data-lms-click="openLmsLiveSessionRemoveDialog(${lmsInlineArg(resourceKey)})" title="Remove the selected session after confirmation"><i class="fas fa-trash"></i> Remove</button>`
        : '';
    return `
        <div class="lms-route-card-head lms-route-card-head-mb-14 lms-live-session-head">
            <div class="lms-live-label">Session</div>
            ${removeButton}
        </div>
    `;
}

function renderLmsLiveSessionFieldsMarkup(resourceKey, editingSession = null) {
    const token = toDomToken(resourceKey);
    const startButton = editingSession && editingSession.status !== 'live' && editingSession.status !== 'ended' && editingSession.questions?.length
        ? `<button type="button" class="lux-primary-btn" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-click="startLmsLiveSession(this.dataset.lmsResourceKey)"><i class="fas fa-broadcast-tower"></i> Start live session</button>`
        : '';
    return `
        <label class="lms-route-field">
            <span class="lms-route-field-label">Title</span>
            <input id="lms-live-title-${escapeHtml(token)}" class="lms-route-input lux-control" type="text" placeholder="e.g. Week 4 lecture quiz" value="${escapeHtml(editingSession?.title || '')}" data-lms-input="updateLmsLiveSessionField(${lmsInlineArg(resourceKey)}, 'title', this.value)">
        </label>
        <label class="lms-route-field">
            <span class="lms-route-field-label">Topic</span>
            <input id="lms-live-topic-${escapeHtml(token)}" class="lms-route-input lux-control" type="text" placeholder="Topic or slide section" value="${escapeHtml(editingSession?.topic || '')}" data-lms-input="updateLmsLiveSessionField(${lmsInlineArg(resourceKey)}, 'topic', this.value)">
        </label>
        ${startButton}
    `;
}

function renderLmsLiveSessionActionsMarkup(resourceKey) {
    return `<button type="button" class="lux-primary-btn" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-click="createLmsLiveSession(this.dataset.lmsResourceKey)"><i class="fas fa-plus"></i> New session</button>`;
}

function renderLmsLiveSessionSwitcher(resourceKey, sessions = [], activeSessionId = '') {
    const items = Array.isArray(sessions) ? sessions : [];
    if (items.length < 2) return '';
    const token = toDomToken(resourceKey);
    const options = items.map((session, index) => {
        const label = repairLmsDisplayText(session?.title || buildLmsLiveSessionTitle({}, index + 1), `Session ${index + 1}`);
        const status = String(session?.status || 'draft');
        const stats = typeof getLmsLiveSessionStats === 'function' ? getLmsLiveSessionStats(session) : {};
        const subtitle = `${stats.questionCount || 0} questions · ${stats.participants || 0} students · ${status}`;
        const selected = String(session?.id || '') === String(activeSessionId || '');
        return `<option value="${escapeHtml(String(session.id || ''))}" ${selected ? 'selected' : ''} data-lux-picker-subtitle="${escapeHtml(subtitle)}">${escapeHtml(`${label} (${status})`)}</option>`;
    }).join('');
    return `
        <label class="lms-route-field lms-live-session-switcher-field">
            <span class="lms-route-field-label">Active session</span>
            <select id="lms-live-session-switcher-${escapeHtml(token)}" class="lms-route-select lux-control" data-lux-native data-lux-picker-enhanced="true" data-lux-picker-label="Active session" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-change="setLmsLiveActiveSession(this.dataset.lmsResourceKey, this.value)">
                ${options}
            </select>
        </label>
    `;
}

function createLmsLiveSession(resourceKey) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) {
        alert('Only course staff can create a live quiz session for this section.');
        return;
    }
    syncLmsLiveSessionDetailsFromDom(canonicalKey);
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    (Array.isArray(workspace.sessions) ? workspace.sessions : []).forEach(item => {
        if (String(item?.status || '').toLowerCase() !== 'live') return;
        item.status = 'ended';
        item.endedAt = new Date().toISOString();
    });
    const nextIndex = (Array.isArray(workspace.sessions) ? workspace.sessions.length : 0) + 1;
    const session = normalizeLmsLiveSession({
        title: buildLmsLiveSessionTitle(workspace, nextIndex),
        topic: '',
        status: 'draft',
        createdBy: getSimulatedUserName(),
        questions: [],
        participants: {}
    }, canonicalKey);
    workspace.sessions.unshift(session);
    workspace.ui.activeSessionId = session.id;
    workspace.ui.deferredRender = false;
    if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
        window.invalidateLmsLiveQuizTabCache(canonicalKey);
    }
    saveLmsLiveQuizChange(canonicalKey, 'session-created', { skipBackendSync: true });
    syncStaffLmsLiveQuizSessionChange(canonicalKey, 'session-created');
}

function saveLmsLiveSessionDetails(resourceKey) {
    syncLmsLiveSessionDetailsFromDom(resourceKey);
}

function ensureLmsLiveEditableSession(resourceKey) {
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    let session = getLmsLiveStaffEditingSession(resourceKey);
    if (!session || session.status === 'ended') {
        session = normalizeLmsLiveSession({
            title: 'Live Quiz',
            status: 'draft',
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
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'question-added');
}

function duplicateLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = resolveLmsLiveStaffQueueMutationSession(resourceKey, questionId);
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
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'question-duplicated');
}

function moveLmsLiveQuestion(resourceKey, questionId, direction) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = resolveLmsLiveStaffQueueMutationSession(resourceKey, questionId);
    if (!session) return;
    const fromIndex = session.questions.findIndex(question => String(question.id) === String(questionId));
    const toIndex = fromIndex + Number(direction || 0);
    if (fromIndex < 0 || toIndex < 0 || toIndex >= session.questions.length) return;
    const [question] = session.questions.splice(fromIndex, 1);
    session.questions.splice(toIndex, 0, question);
    if (session.currentQuestionIndex === fromIndex) session.currentQuestionIndex = toIndex;
    else if (session.currentQuestionIndex === toIndex) session.currentQuestionIndex = fromIndex;
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'question-moved');
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
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'questions-imported');
}

function activateLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const session = resolveLmsLiveWorkspaceSession(workspace, questionId);
    if (!session) {
        alert('Create a session and add a question before showing.');
        return;
    }
    const index = session.questions.findIndex(question => String(question.id) === String(questionId));
    if (index < 0) {
        alert('This question is not in the active live session. Select it in the queue or start the live session first.');
        return;
    }
    session.questions.forEach((question, questionIndex) => {
        if (questionIndex !== index && ['showing', 'paused', 'locked', 'revealed'].includes(String(question.state || ''))) {
            question.state = 'completed';
            question.completedAt = question.completedAt || new Date().toISOString();
        }
    });
    session.currentQuestionIndex = index;
    session.status = 'live';
    session.startedAt = session.startedAt || new Date().toISOString();
    workspace.ui.activeSessionId = session.id;
    (Array.isArray(workspace.sessions) ? workspace.sessions : []).forEach(item => {
        if (String(item?.id || '') === String(session.id)) return;
        if (String(item?.status || '').toLowerCase() !== 'live') return;
        item.status = 'ended';
        item.endedAt = new Date().toISOString();
    });
    ensureLmsLiveRosterParticipants(resourceKey, session);
    markLmsLiveQuestionActivated(session.questions[index]);
    syncStaffLmsLiveQuizControl(resourceKey, 'question-activated');
}

function setLmsLiveQuestionReady(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = typeof getLmsLiveStaffSessionForQuestion === 'function'
        ? getLmsLiveStaffSessionForQuestion(resourceKey, questionId)
        : getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    const index = session.questions.findIndex(question => String(question.id) === String(questionId));
    if (index < 0) return;
    session.currentQuestionIndex = index;
    session.status = session.status === 'ended' ? 'draft' : session.status;
    session.questions[index].state = 'ready';
    session.questions[index].activatedAt = null;
    syncStaffLmsLiveQuizControl(resourceKey, 'question-ready');
}

function pauseLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    const availability = getLmsLiveStaffActionAvailability(question, session);
    if (!session || !question || String(question.state || '') !== 'showing') {
        notifyLmsLiveStaffGuard(availability.pause.hint);
        return;
    }
    const timeState = getLmsLiveQuestionTimeState(question);
    question.state = 'paused';
    question.pausedAt = new Date().toISOString();
    question.pausedRemainingMs = timeState.remainingMs;
    syncStaffLmsLiveQuizControl(resourceKey, 'question-paused');
}

function resumeLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    const availability = getLmsLiveStaffActionAvailability(question, session);
    if (!session || !question || String(question.state || '') !== 'paused') {
        notifyLmsLiveStaffGuard(availability.resume.hint);
        return;
    }
    const remainingMs = Number.isFinite(Number(question.pausedRemainingMs)) ? Number(question.pausedRemainingMs) : Number(question.timeLimit || 45) * 1000;
    const limitMs = Math.max(10000, Number(question.timeLimit || 45) * 1000);
    question.state = 'showing';
    question.activatedAt = new Date(Date.now() - Math.max(0, limitMs - remainingMs)).toISOString();
    question.pausedAt = null;
    question.pausedRemainingMs = null;
    syncStaffLmsLiveQuizControl(resourceKey, 'question-resumed');
}

function lockLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    const availability = getLmsLiveStaffActionAvailability(question, session);
    if (!session || !question) return;
    if (!availability.lock.enabled) {
        notifyLmsLiveStaffGuard(availability.lock.hint);
        return;
    }
    question.state = 'locked';
    question.lockedAt = new Date().toISOString();
    syncStaffLmsLiveQuizControl(resourceKey, 'question-locked');
}

function revealLmsLiveQuestion(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const question = getLmsLiveCurrentQuestion(session);
    const availability = getLmsLiveStaffActionAvailability(question, session);
    if (!session || !question) return;
    if (!availability.reveal.enabled) {
        notifyLmsLiveStaffGuard(availability.reveal.hint);
        return;
    }
    question.state = 'revealed';
    question.revealedAt = new Date().toISOString();
    session.showResults = true;
    syncStaffLmsLiveQuizControl(resourceKey, 'question-revealed');
}

function toggleLmsLiveResults(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.showResults = !session.showResults;
    syncStaffLmsLiveQuizControl(resourceKey, 'results-toggle');
}

function stepLmsLiveQuestion(resourceKey, direction) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const availability = getLmsLiveStaffActionAvailability(currentQuestion, session);
    const stepKey = Number(direction || 0) < 0 ? 'prev' : 'next';
    if (!session || !session.questions.length) return;
    if (!availability[stepKey]?.enabled) {
        notifyLmsLiveStaffGuard(availability[stepKey]?.hint);
        return;
    }
    if (currentQuestion && ['showing', 'paused', 'locked', 'revealed'].includes(String(currentQuestion.state || ''))) {
        currentQuestion.state = 'completed';
        currentQuestion.completedAt = currentQuestion.completedAt || new Date().toISOString();
    }
    const nextIndex = Math.min(session.questions.length - 1, Math.max(0, Number(session.currentQuestionIndex || 0) + Number(direction || 0)));
    session.currentQuestionIndex = nextIndex;
    session.status = 'live';
    session.startedAt = session.startedAt || new Date().toISOString();
    ensureLmsLiveRosterParticipants(resourceKey, session);
    markLmsLiveQuestionActivated(session.questions[nextIndex]);
    session.showResults = false;
    syncStaffLmsLiveQuizControl(resourceKey, 'question-stepped');
}

function startLmsLiveSession(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    syncLmsLiveSessionDetailsFromDom(resourceKey);
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const session = resolveLmsLiveWorkspaceSession(workspace);
    if (!session || !session.questions.length) {
        alert('Add at least one question before starting.');
        return;
    }
    workspace.ui.activeSessionId = session.id;
    (Array.isArray(workspace.sessions) ? workspace.sessions : []).forEach(item => {
        if (String(item?.id || '') === String(session.id)) return;
        if (String(item?.status || '').toLowerCase() !== 'live') return;
        item.status = 'ended';
        item.endedAt = new Date().toISOString();
    });
    session.status = 'live';
    session.currentQuestionIndex = 0;
    session.startedAt = session.startedAt || new Date().toISOString();
    session.endedAt = null;
    ensureLmsLiveRosterParticipants(resourceKey, session);
    session.questions.forEach((question, index) => {
        if (index === 0) {
            markLmsLiveQuestionActivated(question);
            return;
        }
        question.state = question.state === 'completed' ? 'completed' : 'draft';
        question.activatedAt = null;
        question.pausedAt = null;
        question.pausedRemainingMs = null;
        question.lockedAt = null;
        question.revealedAt = null;
    });
    session.showResults = false;
    saveLmsLiveQuizChange(resourceKey, 'session-started');
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function'
        ? runImmediateLmsLiveQuizSync(resourceKey, 'session-started')
        : Promise.resolve(null);
    syncPromise.finally(() => renderLmsLiveQuizSection(resourceKey, { skipLoad: true }));
}

function endLmsLiveSession(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.status = 'ended';
    session.endedAt = new Date().toISOString();
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'session-ended');
}

function resolveLmsLiveStaffQueueMutationSession(resourceKey, questionId) {
    const queueSession = typeof getLmsLiveStaffQueueSession === 'function'
        ? getLmsLiveStaffQueueSession(resourceKey)
        : getLmsLiveStaffEditingSession(resourceKey);
    const targetQuestionId = String(questionId || '').trim();
    if (queueSession && Array.isArray(queueSession.questions)
        && queueSession.questions.some(question => String(question?.id || '') === targetQuestionId)) {
        return queueSession;
    }
    if (typeof getLmsLiveStaffSessionForQuestion === 'function') {
        return getLmsLiveStaffSessionForQuestion(resourceKey, questionId);
    }
    return queueSession || getLmsLiveStaffEditingSession(resourceKey);
}

function deleteLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = resolveLmsLiveStaffQueueMutationSession(resourceKey, questionId);
    if (!session || !Array.isArray(session.questions)) return;
    const sourceIndex = session.questions.findIndex(question => String(question.id) === String(questionId));
    if (sourceIndex < 0) {
        console.warn('[lms-live-quiz] Remove skipped: question not found in queue session.', questionId);
        return;
    }
    const deletedQuestion = session.questions[sourceIndex];
    const wasOnAir = Boolean(
        deletedQuestion
        && ['showing', 'paused', 'locked', 'revealed'].includes(String(deletedQuestion.state || ''))
    );
    const previousLength = session.questions.length;
    session.questions = session.questions.filter(question => String(question.id) !== String(questionId));
    if (session.questions.length >= previousLength) return;
    session.currentQuestionIndex = Math.min(session.currentQuestionIndex || 0, Math.max(session.questions.length - 1, 0));
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'question-deleted', {
        includeStage: wasOnAir,
        questionSwap: wasOnAir,
        forceBroadcastPatch: wasOnAir
    });
}

function clearLmsLiveAnswers(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    Object.values(session.participants || {}).forEach(participant => {
        participant.answers = {};
        participant.score = 0;
    });
    syncStaffLmsLiveQuizQueueChange(resourceKey, 'answers-cleared');
}

function answerLmsLiveQuestion(resourceKey, sessionId, questionId, optionIndex) {
    const session = getLmsLiveStudentSession(resourceKey);
    if (!session || String(session.id) !== String(sessionId)) return;
    const participantId = getLmsLiveStudentMeta(resourceKey).id;
    if (!participantId) {
        alert('Sign in as a student with a valid account before answering.');
        return;
    }
    ensureLmsLiveRosterParticipants(resourceKey, session);
    if (typeof ensureLmsLiveStudentParticipant === 'function') {
        ensureLmsLiveStudentParticipant(resourceKey, session);
    }
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
    const previousAnswer = participant.answers[question.id] ? { ...participant.answers[question.id] } : null;
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
    renderLmsLiveQuizSection(resourceKey);
    const submitAnswer = typeof submitLmsLiveQuizAnswerChange === 'function'
        ? submitLmsLiveQuizAnswerChange(resourceKey, {
            sessionId: session.id,
            questionId: question.id,
            selectedOption
        }, 'answer-submitted')
        : null;
    if (!submitAnswer) {
        const role = typeof getEffectiveUserRole === 'function'
            ? String(getEffectiveUserRole() || '').trim().toLowerCase()
            : '';
        if (role === USER_ROLES.STUDENT) {
            alert('Your answer could not be saved. Check that you are enrolled in this course group.');
            if (previousAnswer) {
                participant.answers[question.id] = previousAnswer;
            } else {
                delete participant.answers[question.id];
            }
            recalculateLmsLiveParticipantScore(participant, session);
            renderLmsLiveQuizSection(resourceKey);
            return;
        }
        if ([USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(role) && !canManageLmsLiveQuiz(resourceKey)) {
            alert('Switch to the staff live quiz view for this section to run the session.');
            if (previousAnswer) {
                participant.answers[question.id] = previousAnswer;
            } else {
                delete participant.answers[question.id];
            }
            recalculateLmsLiveParticipantScore(participant, session);
            renderLmsLiveQuizSection(resourceKey);
            return;
        }
        saveLmsLiveQuizChange(resourceKey, 'answer-submitted');
        return;
    }
    submitAnswer.catch(() => {
        if (previousAnswer) {
            participant.answers[question.id] = previousAnswer;
        } else {
            delete participant.answers[question.id];
        }
        recalculateLmsLiveParticipantScore(participant, session);
        renderLmsLiveQuizSection(resourceKey);
    });
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
        ${timeState.paused ? `<div class="lms-live-copy lms-live-copy-mt-10 lms-live-copy-center">Timer paused by course staff.</div>` : ''}
        ${timeState.expired && !timeState.paused ? `<div class="lms-live-copy lms-live-copy-mt-10 lms-live-copy-center">Answers are closed for this question.</div>` : ''}
    `;
}

function renderLmsLiveSyncNotice(workspace = null) {
    const error = repairLmsDisplayText(workspace?.ui?.syncError || '', '');
    if (error) {
        const denied = workspace?.ui?.accessDenied === true;
        return `
            <div class="lms-live-card lms-live-sync-card is-error">
                <div class="lms-live-label is-danger"><i class="fas fa-triangle-exclamation"></i> ${denied ? 'Live quiz access denied' : 'Live sync needs attention'}</div>
                <div class="lms-live-copy lms-route-copy-mt-6 is-danger">${escapeHtml(error)}</div>
            </div>
        `;
    }
    if (workspace?.ui?.syncing) {
        return `
            <div class="lms-live-card lms-live-sync-card is-syncing">
                <div class="lms-live-label"><i class="fas fa-rotate fa-spin"></i> Syncing live quiz</div>
            </div>
        `;
    }
    if (workspace?.ui?.dirty) {
        return `
            <div class="lms-live-card lms-live-sync-card is-pending">
                <div class="lms-live-label"><i class="fas fa-cloud-arrow-up"></i> Unsaved changes</div>
                <div class="lms-live-copy lms-route-copy-mt-6">Your latest edits will sync shortly.</div>
            </div>
        `;
    }
    if (workspace?.ui?.loadedFromBackend && !workspace?.ui?.accessDenied) {
        return `
            <div class="lms-live-card lms-live-sync-card is-ok">
                <div class="lms-live-label"><i class="fas fa-circle-check"></i> Synced with server</div>
            </div>
        `;
    }
    return '';
}

function renderLmsLiveStatusRailSteps(question = null) {
    const state = String(question?.state || 'draft').toLowerCase();
    const activeIndex = getLmsLiveStatusStepIndex(state);
    return LMS_LIVE_STATUS_STEPS.map(([key, label], index) => {
        const stepClass = [
            'lms-live-status-step',
            index < activeIndex ? 'is-complete' : '',
            index === activeIndex ? 'is-active' : '',
            index > activeIndex ? 'is-upcoming' : ''
        ].filter(Boolean).join(' ');
        const prefix = index < activeIndex ? '<i class="fas fa-check" aria-hidden="true"></i> ' : '';
        return `<span class="${stepClass}" data-step="${escapeHtml(key)}">${prefix}${escapeHtml(label)}</span>`;
    }).join('');
}

function renderLmsLiveStatusRail(question = null) {
    return `
        <div class="lms-live-status-rail" data-lms-live-region="status-rail" aria-label="Live question state">
            ${renderLmsLiveStatusRailSteps(question)}
        </div>
    `;
}

function renderLmsLiveTimerMeterInner(question = null, timeState = null) {
    if (!question) return '';
    const state = String(question.state || 'draft').toLowerCase();
    const limitSeconds = Math.max(10, Number(question.timeLimit || 45));
    const rawRemaining = Number(timeState?.remainingSeconds);
    const remainingSeconds = timeState?.answerable
        ? Math.max(0, Number.isFinite(rawRemaining) ? rawRemaining : limitSeconds)
        : Math.max(0, Number.isFinite(rawRemaining) ? rawRemaining : 0);
    const progress = limitSeconds > 0
        ? Math.max(0, Math.min(100, (remainingSeconds / limitSeconds) * 100))
        : 0;
    const isPaused = Boolean(timeState?.paused) || state === 'paused';
    const isClosed = ['locked', 'revealed', 'completed'].includes(state)
        || (!timeState?.answerable && !isPaused);
    const label = isPaused ? 'Paused' : timeState?.answerable ? 'Answer window' : 'Closed';
    const timerShellClass = [
        'lms-live-timer-shell',
        isPaused ? 'is-paused' : '',
        isClosed ? 'is-closed' : '',
        timeState?.answerable ? 'is-live' : ''
    ].filter(Boolean).join(' ');
    const timerNumberClass = [
        'lms-live-timer-number',
        isPaused ? 'is-paused' : '',
        isClosed ? 'is-closed' : '',
        timeState?.answerable ? 'is-live' : ''
    ].filter(Boolean).join(' ');
    const timerDisplay = isPaused
        ? '<i class="fas fa-pause" aria-hidden="true"></i>'
        : isClosed
            ? '<i class="fas fa-lock" aria-hidden="true"></i>'
            : escapeHtml(String(remainingSeconds));
    const fillProgress = isClosed ? 0 : progress;
    return `
        <div class="${timerShellClass}">
            <div class="${timerNumberClass}">${timerDisplay}</div>
            <div>
                <div class="lms-live-label lms-live-label--left lms-live-label-mb-7">${escapeHtml(label)} - ${escapeHtml(String(limitSeconds))}s question</div>
                <div class="lms-live-timer-track"><span class="lms-live-timer-fill" style="--live-progress:${fillProgress.toFixed(2)}%;"></span></div>
            </div>
        </div>
    `;
}

function renderLmsLiveTimerMeter(question = null, timeState = null) {
    const inner = renderLmsLiveTimerMeterInner(question, timeState);
    if (!inner) return '';
    return `<div data-lms-live-region="timer">${inner}</div>`;
}

function getLmsLiveStudentViewMeta(question = null, timeState = null) {
    const questionState = String(question?.state || 'draft').toLowerCase();
    const answerStatusLabel = questionState === 'showing'
        ? `${String(timeState?.remainingSeconds ?? question?.timeLimit ?? 0)}s left`
        : questionState === 'paused'
            ? 'Paused'
            : questionState === 'ready'
                ? 'Ready, hidden from students'
                : ['locked', 'revealed', 'completed'].includes(questionState)
                    ? 'Answers closed'
                    : 'Hidden';
    const tileClass = questionState === 'showing'
        ? 'is-open'
        : questionState === 'paused'
            ? 'is-paused'
            : ['locked', 'revealed', 'completed'].includes(questionState)
                ? 'is-closed'
                : '';
    return { answerStatusLabel, tileClass };
}

        const api = {
            isLmsLiveSessionRemoveDialogOpen,
            closeLmsLiveSessionRemoveDialog,
            renderLmsLiveSessionRemoveDialogCard,
            renderLmsLiveSessionRemoveDialog,
            mountLmsLiveSessionRemoveDialog,
            openLmsLiveSessionRemoveDialog,
            advanceLmsLiveSessionRemoveDialog,
            confirmLmsLiveSessionRemove,
            deleteLmsLiveSession,
            renderLmsLiveSessionCardHeader,
            renderLmsLiveSessionFieldsMarkup,
            renderLmsLiveSessionActionsMarkup,
            renderLmsLiveSessionSwitcher,
            createLmsLiveSession,
            saveLmsLiveSessionDetails,
            ensureLmsLiveEditableSession,
            addLmsLiveQuestion,
            duplicateLmsLiveQuestion,
            moveLmsLiveQuestion,
            importLmsLiveQuestionsFromText,
            activateLmsLiveQuestion,
            setLmsLiveQuestionReady,
            pauseLmsLiveQuestion,
            resumeLmsLiveQuestion,
            lockLmsLiveQuestion,
            revealLmsLiveQuestion,
            toggleLmsLiveResults,
            stepLmsLiveQuestion,
            startLmsLiveSession,
            endLmsLiveSession,
            resolveLmsLiveStaffQueueMutationSession,
            deleteLmsLiveQuestion,
            clearLmsLiveAnswers,
            answerLmsLiveQuestion,
            renderLmsLiveQuestionOptions,
            renderLmsLiveSyncNotice,
            renderLmsLiveStatusRailSteps,
            renderLmsLiveStatusRail,
            renderLmsLiveTimerMeterInner,
            renderLmsLiveTimerMeter,
            getLmsLiveStudentViewMeta,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsLiveQuizSessionApi({});
})();
