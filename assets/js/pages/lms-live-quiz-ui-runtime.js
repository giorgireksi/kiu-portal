/* LMS live quiz UI/render helpers extracted from lms.js. */

function getLmsLiveStudentMeta(resourceKey = currentCourseId) {
    if (typeof resolveLmsQuizStudentMeta === 'function') {
        const resolved = resolveLmsQuizStudentMeta(resourceKey);
        const resolvedId = String(resolved?.id || '').trim();
        if (resolvedId && resolvedId !== 'student') {
            return {
                id: resolvedId,
                name: String(resolved?.name || '').trim() || `Student ${resolvedId}`
            };
        }
    }
    const currentId = String((typeof getCurrentUserId === 'function' ? getCurrentUserId() : '') || '').trim();
    const role = typeof getEffectiveUserRole === 'function'
        ? String(getEffectiveUserRole() || '').trim().toLowerCase()
        : '';
    if (currentId) {
        return {
            id: currentId,
            name: (typeof getUiDisplayName === 'function' ? getUiDisplayName() : '') || `Student ${currentId}`
        };
    }
    if (role === USER_ROLES.STUDENT) {
        return {
            id: '',
            name: (typeof getUiDisplayName === 'function' ? getUiDisplayName() : '') || 'Student'
        };
    }
    const key = 'KIU_LMS_LIVE_STUDENT_ID';
    try {
        const existing = localStorage.getItem(key);
        if (existing) return { id: existing, name: `Student ${existing}` };
        const next = makeLmsLiveId('guest');
        localStorage.setItem(key, next);
        return { id: next, name: `Student ${next}` };
    } catch (error) {
        const next = makeLmsLiveId('guest');
        return { id: next, name: `Student ${next}` };
    }
}

function seedLmsLiveQuizRoster(resourceKey) {
    if (typeof isActualAdminLmsLiveQuizSession !== 'function' || !isActualAdminLmsLiveQuizSession()) return;
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffSession(resourceKey);
    if (!session) {
        alert('Create a session first.');
        return;
    }
    ensureLmsLiveRosterParticipants(resourceKey, session);
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function'
        ? runImmediateLmsLiveQuizSync(resourceKey, 'roster-seed')
        : Promise.resolve(null);
    syncPromise.finally(() => renderLmsLiveQuizSection(resourceKey));
}

function renderLmsLiveRosterPanel(resourceKey, session = null) {
    const stats = typeof getLmsLiveQuizRosterStats === 'function'
        ? getLmsLiveQuizRosterStats(resourceKey, session)
        : { rosterCount: 0, joinedCount: 0, serverJoinedCount: null };
    const serverSuffix = Number.isFinite(stats.serverJoinedCount)
        ? ` (${stats.serverJoinedCount} synced on server)`
        : '';
    const rosterHint = stats.rosterCount === 0
        ? 'No students are enrolled in this LMS group yet. Assign the group roster before going live.'
        : `${stats.joinedCount} of ${stats.rosterCount} roster students are in this session${serverSuffix}.`;
    const seedButton = typeof isActualAdminLmsLiveQuizSession === 'function' && isActualAdminLmsLiveQuizSession()
        ? `<button type="button" class="kiu-btn-outline lms-live-import-btn-mt-10" data-lms-click="seedLmsLiveQuizRoster(${lmsInlineArg(resourceKey)})"><i class="fas fa-user-plus"></i> Seed roster for testing</button>`
        : '';
    return `
        <div class="lms-live-card">
            <div class="lms-live-label">Group roster</div>
            <div class="lms-live-copy lms-route-copy-mt-6">${escapeHtml(rosterHint)}</div>
            ${seedButton}
        </div>
    `;
}

function renderLmsLiveParticipantPill(resourceKey, session = null) {
    const stats = typeof getLmsLiveQuizRosterStats === 'function'
        ? getLmsLiveQuizRosterStats(resourceKey, session)
        : { rosterCount: 0, joinedCount: 0, serverJoinedCount: null };
    const joined = Number(stats.joinedCount || 0);
    const roster = Number(stats.rosterCount || 0);
    const label = roster > 0 ? `${joined}/${roster} roster` : `${joined} joined`;
    return `<span class="lms-live-pill"><i class="fas fa-user-group"></i> ${escapeHtml(label)}</span>`;
}

function getLmsLiveStudentId() {
    const resourceKey = arguments.length ? arguments[0] : currentCourseId;
    return getLmsLiveStudentMeta(resourceKey).id;
}

function canManageLmsLiveQuiz(resourceKey = currentCourseId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const workspace = canonicalKey ? ensureLmsLiveQuizWorkspace(canonicalKey) : null;
    if (workspace?.ui?.accessDenied) {
        if (typeof canAccessLmsLiveQuizScope === 'function' && canAccessLmsLiveQuizScope(canonicalKey || resourceKey)) {
            workspace.ui.accessDenied = false;
            workspace.ui.syncError = '';
        } else {
            return false;
        }
    }
    if (typeof isActualAdminLmsLiveQuizSession === 'function' && isActualAdminLmsLiveQuizSession()) {
        return true;
    }
    const role = getEffectiveUserRole();
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        return false;
    }
    const hasScopeAccess = typeof canAccessLmsLiveQuizScope === 'function'
        ? canAccessLmsLiveQuizScope(canonicalKey || resourceKey)
        : false;
    if (!hasScopeAccess) return false;
    const parsed = parseLmsCourseKey(canonicalKey || resourceKey);
    if (typeof canManageLmsClassSection === 'function'
        && !canManageLmsClassSection(parsed.sectionType || getCurrentLmsSectionType())) {
        return hasScopeAccess;
    }
    return true;
}

function notifyLmsLiveStaffGuard(message = '') {
    const text = String(message || '').trim();
    if (!text) return;
    alert(text);
}

function getLmsLiveStaffActionAvailability(question = null, session = null) {
    const state = String(question?.state || 'draft').toLowerCase();
    const questionCount = Array.isArray(session?.questions) ? session.questions.length : 0;
    const currentIndex = Math.min(Math.max(0, Number(session?.currentQuestionIndex || 0)), Math.max(0, questionCount - 1));
    return {
        show: {
            enabled: Boolean(question),
            active: state === 'showing',
            hint: question ? '' : 'Select a question first.'
        },
        pause: {
            enabled: state === 'showing',
            active: false,
            hint: 'Pause only works while the question is showing.'
        },
        resume: {
            enabled: state === 'paused',
            active: state === 'paused',
            hint: 'Resume only works while the question is paused.'
        },
        lock: {
            enabled: ['showing', 'paused'].includes(state),
            active: state === 'locked',
            hint: 'Lock only works while the question is showing or paused.'
        },
        reveal: {
            enabled: ['showing', 'paused', 'locked', 'revealed'].includes(state),
            active: state === 'revealed',
            hint: 'Reveal only works after the question has been shown.'
        },
        results: {
            enabled: Boolean(session),
            active: Boolean(session?.showResults),
            hint: session ? '' : 'Start a session first.'
        },
        prev: {
            enabled: questionCount > 0 && currentIndex > 0,
            active: false,
            hint: 'Already on the first question.'
        },
        next: {
            enabled: questionCount > 0 && currentIndex < questionCount - 1,
            active: false,
            hint: 'Already on the last question.'
        }
    };
}

function renderLmsLiveStaffActionButton(actionKey, availability, label, iconClass, clickHandler, primary = false) {
    const action = availability?.[actionKey] || { enabled: true, active: false, hint: '' };
    const buttonClass = `${primary ? 'kiu-btn-blue' : 'kiu-btn-outline'}${action.active ? ' is-active' : ''}`;
    const disabledAttrs = action.enabled ? '' : ' disabled aria-disabled="true"';
    const titleAttr = action.hint ? ` title="${escapeHtml(action.hint)}"` : '';
    return `<button type="button" class="${buttonClass}"${disabledAttrs}${titleAttr} data-lms-click="${clickHandler}"><i class="${escapeHtml(iconClass)}"></i> ${escapeHtml(label)}</button>`;
}

function prepareLmsLiveQuizImpersonation(resourceKey = currentCourseId) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    const role = typeof getEffectiveUserRole === 'function'
        ? String(getEffectiveUserRole() || '').trim().toLowerCase()
        : '';
    if (typeof isAdminImpersonationMode !== 'function' || !isAdminImpersonationMode()) {
        return Promise.resolve(null);
    }
    const syncRole = role === USER_ROLES.STUDENT
        ? USER_ROLES.STUDENT
        : ([USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role) ? role : '');
    if (!syncRole || typeof syncPortalBackendImpersonation !== 'function') {
        return Promise.resolve(null);
    }
    if (syncRole === USER_ROLES.STUDENT && typeof syncLmsImpersonatedStudentSession === 'function') {
        syncLmsImpersonatedStudentSession(canonicalKey || resourceKey);
    }
    if (typeof window === 'undefined') {
        return Promise.resolve(syncPortalBackendImpersonation(syncRole)).catch(() => null);
    }
    window.__lmsLiveQuizImpersonationSyncs = window.__lmsLiveQuizImpersonationSyncs || {};
    const syncKey = `${canonicalKey || String(resourceKey || '').trim() || 'live-quiz'}::${syncRole}`;
    const existing = window.__lmsLiveQuizImpersonationSyncs[syncKey];
    if (existing) return existing;
    const syncPromise = Promise.resolve(syncPortalBackendImpersonation(syncRole))
        .catch(() => null)
        .finally(() => {
            if (window.__lmsLiveQuizImpersonationSyncs?.[syncKey] === syncPromise) {
                delete window.__lmsLiveQuizImpersonationSyncs[syncKey];
            }
        });
    window.__lmsLiveQuizImpersonationSyncs[syncKey] = syncPromise;
    return syncPromise;
}

function refreshStaffLmsLiveQuizUi(resourceKey, options = {}) {
    if (typeof refreshLmsLiveQuizUi === 'function') {
        refreshLmsLiveQuizUi(resourceKey, {
            skipLoad: true,
            forceStructuralRender: true,
            ...options
        });
        return;
    }
    renderLmsLiveQuizSection(resourceKey, { skipLoad: true, ...options });
}

function syncStaffLmsLiveQuizControl(resourceKey, reason = 'live-quiz') {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (canonicalKey && typeof touchLmsLiveQuizWorkspaceLocal === 'function') {
        touchLmsLiveQuizWorkspaceLocal(canonicalKey);
    }
    if (canonicalKey) {
        const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
        workspace.ui.dirty = true;
        if (workspace.ui?.syncTimer) {
            clearTimeout(workspace.ui.syncTimer);
            workspace.ui.syncTimer = null;
        }
        if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
            window.invalidateLmsLiveQuizTabCache(canonicalKey);
        }
    }
    refreshStaffLmsLiveQuizUi(resourceKey);
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function' && canonicalKey
        ? runImmediateLmsLiveQuizSync(canonicalKey, reason)
        : Promise.resolve(null);
    return syncPromise.finally(() => refreshStaffLmsLiveQuizUi(resourceKey));
}

function resolveLmsLiveWorkspaceSession(workspace = {}, questionId = '') {
    const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    const activeSessionId = String(workspace?.ui?.activeSessionId || '').trim();
    const targetQuestionId = String(questionId || '').trim();
    const findLiveSession = (predicate = () => true) => sessions.find(session =>
        String(session?.status || '').toLowerCase() === 'live'
        && predicate(session)
    ) || null;

    if (targetQuestionId) {
        if (activeSessionId) {
            const activeSession = sessions.find(session => String(session?.id || '') === activeSessionId);
            if (activeSession && Array.isArray(activeSession.questions) && activeSession.questions.some(question => String(question?.id || '') === targetQuestionId)) {
                return activeSession;
            }
        }
        const questionSession = sessions.find(session => Array.isArray(session.questions)
            && session.questions.some(question => String(question?.id || '') === targetQuestionId));
        if (questionSession) {
            return findLiveSession(session => String(session?.id || '') === String(questionSession.id || ''))
                || questionSession;
        }
    } else if (activeSessionId) {
        const activeSession = sessions.find(session => String(session?.id || '') === activeSessionId);
        if (activeSession) return activeSession;
    }

    return findLiveSession()
        || sessions.find(session => String(session?.status || '').toLowerCase() === 'draft')
        || sessions[0]
        || null;
}

function renderLmsLiveScoreList(session = null, limit = 8) {
    const leaders = getLmsLiveLeaderboard(session).slice(0, limit);
    if (!leaders.length) {
        return `<div class="lms-live-copy">No enrolled students are visible yet.</div>`;
    }
    return leaders.map((participant, index) => `
        <div class="lms-live-score-row">
            <span class="lms-live-rank">${index + 1}</span>
            <div class="lms-live-score-main">
                <div class="lms-live-score-name">${escapeHtml(participant.nickname)}</div>
                <div class="lms-live-copy lms-live-copy-mt-2 lms-route-meta-11">${escapeHtml(Object.keys(participant.answers || {}).length)} answered${participant.streak ? ` - ${escapeHtml(String(participant.streak))} streak` : ''}</div>
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
            return hasLmsLiveAnswerForQuestion(answer, question)
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
                    <div class="lms-live-breakdown-bar"><span style="--lms-live-breakdown-width:${escapeHtml(String(item.percent))}%;"></span></div>
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
        <div class="lms-live-stage lms-live-summary-shell">
            <div class="lms-live-pill-row lms-live-pill-row--center">
                <span class="lms-live-pill"><i class="fas fa-users"></i> ${escapeHtml(String(participants.length))} students</span>
                <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${escapeHtml(String(totalQuestions))} questions</span>
                <span class="lms-live-pill"><i class="fas fa-chart-simple"></i> ${escapeHtml(String(participation))}% participation</span>
                <span class="lms-live-pill"><i class="fas fa-bullseye"></i> ${escapeHtml(String(accuracy))}% accuracy</span>
            </div>
            <div class="lms-live-question-text lms-live-summary-title">Session results</div>
            <div class="lms-live-score-list lms-live-score-list--wide lms-live-summary-list">${renderLmsLiveScoreList(session, 10)}</div>
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

function buildLmsLiveSessionTitle(workspace = {}, index = 1) {
    const sessionNumber = Math.max(1, Number.parseInt(index, 10) || 1);
    return `Live session ${sessionNumber}`;
}

function setLmsLiveActiveSession(resourceKey, sessionId) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return;
    const normalizedSessionId = String(sessionId || '').trim();
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const session = (Array.isArray(workspace.sessions) ? workspace.sessions : [])
        .find(item => String(item?.id || '') === normalizedSessionId);
    if (!session) return;
    workspace.ui.activeSessionId = session.id;
    if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
        window.invalidateLmsLiveQuizTabCache(canonicalKey);
    }
    renderLmsLiveQuizSection(canonicalKey, { preserveDraft: false, skipLoad: true });
    saveLmsLiveQuizChange(canonicalKey, 'session-selected');
}

function renderLmsLiveSessionSwitcher(resourceKey, sessions = [], activeSessionId = '') {
    const items = Array.isArray(sessions) ? sessions : [];
    if (items.length < 2) return '';
    const options = items.map((session, index) => {
        const label = repairLmsDisplayText(session?.title || buildLmsLiveSessionTitle({}, index + 1), `Session ${index + 1}`);
        const status = String(session?.status || 'draft');
        const selected = String(session?.id || '') === String(activeSessionId || '');
        return `<option value="${escapeHtml(String(session.id || ''))}" ${selected ? 'selected' : ''}>${escapeHtml(`${label} (${status})`)}</option>`;
    }).join('');
    return `
        <label class="lms-route-field">
            <span class="lms-route-field-label">Active session</span>
            <select class="lms-route-input" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-change="setLmsLiveActiveSession(this.dataset.lmsResourceKey, this.value)">
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
    renderLmsLiveQuizSection(canonicalKey, { preserveDraft: false, skipLoad: true });
    saveLmsLiveQuizChange(canonicalKey, 'session-created');
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function'
        ? runImmediateLmsLiveQuizSync(canonicalKey, 'session-created')
        : Promise.resolve(null);
    syncPromise.finally(() => {
        renderLmsLiveQuizSection(canonicalKey, { preserveDraft: false, skipLoad: true, forceStructuralRender: true });
    });
}

function saveLmsLiveSessionDetails(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const token = toDomToken(resourceKey);
    const session = getLmsLiveStaffEditingSession(resourceKey);
    if (!session) return;
    session.title = repairLmsDisplayText(document.getElementById(`lms-live-title-${token}`)?.value || session.title, session.title || 'Live Quiz');
    session.topic = repairLmsDisplayText(document.getElementById(`lms-live-topic-${token}`)?.value || '', '');
    saveLmsLiveQuizChange(resourceKey, 'session-details-saved');
    renderLmsLiveQuizSection(resourceKey);
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
    saveLmsLiveQuizChange(resourceKey, 'question-added');
    renderLmsLiveQuizSection(resourceKey);
}

function duplicateLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = typeof getLmsLiveStaffSessionForQuestion === 'function'
        ? getLmsLiveStaffSessionForQuestion(resourceKey, questionId)
        : getLmsLiveStaffEditingSession(resourceKey);
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
    const session = typeof getLmsLiveStaffSessionForQuestion === 'function'
        ? getLmsLiveStaffSessionForQuestion(resourceKey, questionId)
        : getLmsLiveStaffEditingSession(resourceKey);
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
    saveLmsLiveQuizChange(resourceKey, 'session-ended');
    renderLmsLiveQuizSection(resourceKey);
}

function deleteLmsLiveQuestion(resourceKey, questionId) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = typeof getLmsLiveStaffSessionForQuestion === 'function'
        ? getLmsLiveStaffSessionForQuestion(resourceKey, questionId)
        : getLmsLiveStaffEditingSession(resourceKey);
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
    const studentMeta = getLmsLiveStudentMeta(resourceKey);
    const participantId = studentMeta.id;
    ensureLmsLiveRosterParticipants(resourceKey, session);
    const uniqueNickname = getUniqueLmsLiveNickname(session, studentMeta.name || getSimulatedUserName(), participantId);
    session.participants[participantId] = normalizeLmsLiveParticipant({
        ...(session.participants[participantId] || {}),
        id: participantId,
        accountId: participantId,
        nickname: uniqueNickname,
        lastSeenAt: new Date().toISOString()
    }, participantId);
    if (typeof submitLmsLiveQuizJoinChange === 'function') {
        submitLmsLiveQuizJoinChange(resourceKey, {
            sessionId: String(session.id || sessionId || '').trim(),
            nickname: uniqueNickname,
            joinedAt: session.participants[participantId].joinedAt || new Date().toISOString(),
            lastSeenAt: session.participants[participantId].lastSeenAt || new Date().toISOString()
        }, 'participant-joined');
    } else {
        saveLmsLiveQuizChange(resourceKey, 'participant-joined', { skipBackendSync: false });
    }
    renderLmsLiveQuizSection(resourceKey, { skipLoad: true });
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
        <div class="lms-live-status-rail" data-lms-live-region="status-rail" aria-label="Live question state">
            ${steps.map(([key, label]) => `<span class="lms-live-status-step ${state === key ? 'is-active' : ''}">${escapeHtml(label)}</span>`).join('')}
        </div>
    `;
}

function renderLmsLiveTimerMeterInner(question = null, timeState = null) {
    if (!question) return '';
    const limitSeconds = Math.max(10, Number(question.timeLimit || 45));
    const rawRemaining = Number(timeState?.remainingSeconds);
    const remainingSeconds = timeState?.answerable
        ? Math.max(0, Number.isFinite(rawRemaining) ? rawRemaining : limitSeconds)
        : Math.max(0, Number.isFinite(rawRemaining) ? rawRemaining : 0);
    const progress = limitSeconds > 0
        ? Math.max(0, Math.min(100, (remainingSeconds / limitSeconds) * 100))
        : 0;
    const label = timeState?.paused ? 'Paused' : timeState?.answerable ? 'Answer window' : 'Closed';
    return `
        <div class="lms-live-timer-shell">
            <div class="lms-live-timer-number">${escapeHtml(String(remainingSeconds))}</div>
            <div>
                <div class="lms-live-label lms-live-label--left lms-live-label-mb-7">${escapeHtml(label)} - ${escapeHtml(String(limitSeconds))}s question</div>
                <div class="lms-live-timer-track"><span class="lms-live-timer-fill" style="--live-progress:${progress.toFixed(2)}%;"></span></div>
            </div>
        </div>
    `;
}

function renderLmsLiveTimerMeter(question = null, timeState = null) {
    const inner = renderLmsLiveTimerMeterInner(question, timeState);
    if (!inner) return '';
    return `<div data-lms-live-region="timer">${inner}</div>`;
}

function renderLmsLiveStaffDirectorBarContent(session, resourceKey, statusLabel = 'Draft') {
    const stats = getLmsLiveSessionStats(session);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    if (!currentQuestion) return '';
    const questionState = String(currentQuestion.state || 'draft');
    const answerStatusLabel = questionState === 'showing'
        ? `${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion?.timeLimit ?? 0))}s left`
        : questionState === 'paused'
            ? 'Paused'
            : questionState === 'ready'
                ? 'Ready, hidden from students'
                : ['locked', 'revealed', 'completed'].includes(questionState)
                    ? 'Answers closed'
                    : 'Hidden';
    const currentQuestionNumber = Math.max(1, (session?.questions || []).findIndex(question => String(question.id) === String(currentQuestion.id)) + 1);
    return `
        <div class="lms-live-director-bar">
            <div class="lms-live-director-tile"><strong>${escapeHtml(String(currentQuestionNumber))}/${escapeHtml(String(stats.questionCount || 0))}</strong><span>Question</span></div>
            <div class="lms-live-director-tile"><strong>${escapeHtml(String(stats.currentAnswerCount))}/${escapeHtml(String(stats.participants))}</strong><span>Answered</span></div>
            <div class="lms-live-director-tile" data-lms-live-region="director-timer"><strong>${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s</strong><span>Timer</span></div>
            <div class="lms-live-director-tile"><strong>${escapeHtml(answerStatusLabel)}</strong><span>Student view</span></div>
        </div>
    `;
}

function renderLmsLiveStaffStagePillsContent(session, statusLabel = 'Draft') {
    const stats = getLmsLiveSessionStats(session);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    if (!currentQuestion) return '';
    const questionState = String(currentQuestion.state || 'draft');
    const answerStatusLabel = questionState === 'showing'
        ? `${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion?.timeLimit ?? 0))}s left`
        : questionState === 'paused'
            ? 'Paused'
            : questionState === 'ready'
                ? 'Ready, hidden from students'
                : ['locked', 'revealed', 'completed'].includes(questionState)
                    ? 'Answers closed'
                    : 'Hidden';
    return `
        <span class="lms-live-pill ${session.status === 'live' ? 'is-live' : ''}"><i class="fas fa-bolt"></i> ${escapeHtml(statusLabel)}</span>
        <span class="lms-live-pill ${questionState === 'showing' ? 'is-live' : questionState === 'paused' ? 'is-paused' : ['locked','revealed'].includes(questionState) ? 'is-locked' : ''}"><i class="far fa-clock"></i> ${answerStatusLabel}</span>
        <span class="lms-live-pill"><i class="fas fa-users"></i> ${stats.currentAnswerCount}/${stats.participants} answered</span>
        <span class="lms-live-pill"><i class="fas fa-trophy"></i> ${LMS_LIVE_MAX_SCORE} max</span>
    `;
}

function isLmsLiveQuizDraftEditorActive() {
    const active = document.activeElement;
    if (!active || !['INPUT', 'TEXTAREA', 'SELECT'].includes(String(active.tagName || ''))) return false;
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !contentArea.contains(active)) return false;
    return String(active.id || '').startsWith('lms-live-');
}

function captureLmsLiveQuizDraftFields(resourceKey) {
    const token = toDomToken(resourceKey);
    const active = document.activeElement;
    const snapshot = {
        focusId: '',
        focusSelectionStart: null,
        focusSelectionEnd: null,
        title: '',
        topic: '',
        question: '',
        options: ['', '', '', ''],
        correct: '0',
        timer: '45',
        questionTopic: '',
        importText: ''
    };
    snapshot.title = document.getElementById(`lms-live-title-${token}`)?.value || '';
    snapshot.topic = document.getElementById(`lms-live-topic-${token}`)?.value || '';
    snapshot.question = document.getElementById(`lms-live-question-${token}`)?.value || '';
    LMS_LIVE_OPTION_KEYS.forEach((key, index) => {
        snapshot.options[index] = document.getElementById(`lms-live-option-${index}-${token}`)?.value || '';
    });
    snapshot.correct = document.getElementById(`lms-live-correct-${token}`)?.value || '0';
    snapshot.timer = document.getElementById(`lms-live-timer-${token}`)?.value || '45';
    snapshot.questionTopic = document.getElementById(`lms-live-question-topic-${token}`)?.value || '';
    snapshot.importText = document.getElementById(`lms-live-import-${token}`)?.value || '';
    if (active && String(active.id || '').startsWith('lms-live-')) {
        snapshot.focusId = active.id;
        if (typeof active.selectionStart === 'number') snapshot.focusSelectionStart = active.selectionStart;
        if (typeof active.selectionEnd === 'number') snapshot.focusSelectionEnd = active.selectionEnd;
    }
    return snapshot;
}

function restoreLmsLiveQuizDraftFields(snapshot = null, resourceKey = '') {
    if (!snapshot || !resourceKey) return;
    const token = toDomToken(resourceKey);
    const setValue = (id, value) => {
        const node = document.getElementById(id);
        if (!node || value === undefined || value === null) return;
        node.value = String(value);
    };
    setValue(`lms-live-title-${token}`, snapshot.title);
    setValue(`lms-live-topic-${token}`, snapshot.topic);
    setValue(`lms-live-question-${token}`, snapshot.question);
    LMS_LIVE_OPTION_KEYS.forEach((key, index) => {
        setValue(`lms-live-option-${index}-${token}`, snapshot.options?.[index] || '');
    });
    setValue(`lms-live-correct-${token}`, snapshot.correct);
    setValue(`lms-live-timer-${token}`, snapshot.timer);
    setValue(`lms-live-question-topic-${token}`, snapshot.questionTopic);
    setValue(`lms-live-import-${token}`, snapshot.importText);
    if (snapshot.focusId) {
        const focusNode = document.getElementById(snapshot.focusId);
        if (focusNode) {
            focusNode.focus({ preventScroll: true });
            if (typeof snapshot.focusSelectionStart === 'number' && typeof focusNode.setSelectionRange === 'function') {
                const end = typeof snapshot.focusSelectionEnd === 'number' ? snapshot.focusSelectionEnd : snapshot.focusSelectionStart;
                focusNode.setSelectionRange(snapshot.focusSelectionStart, end);
            }
        }
    }
}

function renderLmsLiveStaffQueueMarkup(session, resourceKey) {
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    if (!session?.questions?.length) {
        return `<div class="lms-live-card lms-live-queue-empty-card"><div class="lms-live-copy lms-live-queue-empty-copy">No questions yet. Add one from the right panel.</div></div>`;
    }
    return session.questions.map((question, index) => {
        const isActive = currentQuestion && String(currentQuestion.id) === String(question.id);
        const answers = getLmsLiveParticipantList(session).filter(participant => {
            const answer = participant.answers?.[question.id];
            return hasLmsLiveAnswerForQuestion(answer, question);
        }).length;
        const questionState = String(question.state || 'draft');
        return `
            <div class="lms-live-question-item ${isActive ? 'is-active' : ''}">
                <div class="lms-live-question-head">
                    <div class="lms-live-question-main">
                        <div class="lms-live-label">Question ${index + 1}${question.topic ? ` - ${escapeHtml(question.topic)}` : ''}</div>
                        <div class="lms-live-question-title">${escapeHtml(question.text)}</div>
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
    }).join('');
}

function renderLmsLiveStaffBroadcastActionsMarkup(session, resourceKey, currentQuestion = null) {
    if (!session || !currentQuestion) return '';
    const availability = getLmsLiveStaffActionAvailability(currentQuestion, session);
    return `
        <div class="lms-live-broadcast-actions">
            ${renderLmsLiveStaffActionButton('show', availability, 'Show', 'fas fa-eye', `activateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(currentQuestion.id)})`, true)}
            ${renderLmsLiveStaffActionButton('pause', availability, 'Pause', 'fas fa-pause', `pauseLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
            ${renderLmsLiveStaffActionButton('resume', availability, 'Resume', 'fas fa-play', `resumeLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
            ${renderLmsLiveStaffActionButton('lock', availability, 'Lock', 'fas fa-lock', `lockLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
            ${renderLmsLiveStaffActionButton('reveal', availability, 'Reveal', 'fas fa-check-circle', `revealLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
        </div>
    `;
}

function renderLmsLiveStaffControlGridMarkup(resourceKey, session = null, currentQuestion = null) {
    const resolvedSession = session || (typeof getLmsLiveStaffSession === 'function' ? getLmsLiveStaffSession(resourceKey) : null);
    const resolvedQuestion = currentQuestion || getLmsLiveCurrentQuestion(resolvedSession);
    const availability = getLmsLiveStaffActionAvailability(resolvedQuestion, resolvedSession);
    return `
        <div class="lms-live-control-grid">
            ${renderLmsLiveStaffActionButton('results', availability, 'Results', 'fas fa-chart-simple', `toggleLmsLiveResults(${lmsInlineArg(resourceKey)})`)}
            ${renderLmsLiveStaffActionButton('prev', availability, 'Previous', 'fas fa-arrow-left', `stepLmsLiveQuestion(${lmsInlineArg(resourceKey)}, -1)`)}
            ${renderLmsLiveStaffActionButton('next', availability, 'Next', 'fas fa-arrow-right', `stepLmsLiveQuestion(${lmsInlineArg(resourceKey)}, 1)`)}
        </div>
    `;
}

function renderLmsLiveStaffStageMarkup(session, resourceKey, statusLabel = 'Draft') {
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    if (session?.status === 'ended') return renderLmsLiveSessionSummary(session);
    if (!currentQuestion) {
        return `
            <div class="lms-live-stage is-waiting lms-live-stage-wait-shell">
                <i class="fas fa-bolt lms-live-wait-icon"></i>
                <div class="lms-live-question-text lms-live-stage-wait-title">Prepare a question, then show it during class.</div>
                <div class="lms-live-copy lms-live-copy-auto-center lms-live-stage-wait-copy">Students in this LMS group will see questions automatically. No join code is required.</div>
            </div>
        `;
    }
    return `
        <div class="lms-live-stage is-broadcast">
            <div data-lms-live-region="director-bar">${renderLmsLiveStaffDirectorBarContent(session, resourceKey, statusLabel)}</div>
            ${renderLmsLiveStatusRail(currentQuestion)}
            <div class="lms-live-pill-row lms-live-pill-row--center" data-lms-live-region="stage-pills">${renderLmsLiveStaffStagePillsContent(session, statusLabel)}</div>
            ${renderLmsLiveTimerMeter(currentQuestion, timeState)}
            <div class="lms-live-question-text">${escapeHtml(currentQuestion.text)}</div>
            <div data-lms-live-region="options">${renderLmsLiveQuestionOptions(currentQuestion, session)}</div>
            <div data-lms-live-region="stage-breakdown">${renderLmsLiveQuestionBreakdown(session, currentQuestion)}</div>
            <div data-lms-live-region="broadcast-actions">${renderLmsLiveStaffBroadcastActionsMarkup(session, resourceKey, currentQuestion)}</div>
            <div data-lms-live-region="control-grid">${renderLmsLiveStaffControlGridMarkup(resourceKey, session, currentQuestion)}</div>
            <div class="lms-live-operator-note">Use Next to advance and auto-broadcast the next question. Pause if discussion takes longer, lock answers, then reveal the correct answer and answer split.</div>
        </div>
    `;
}

function renderLmsLiveStudentStageMarkup(context, session, participant, participantMeta = null) {
    const resourceKey = context.resourceKey;
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    const answer = participant?.answers?.[currentQuestion?.id] || null;
    const nickname = participant?.nickname || participantMeta?.name || 'Student';
    const rosterBanner = participant
        ? ''
        : `<div class="lms-live-copy lms-live-copy-mt-10 lms-live-copy-center is-danger">Confirm your LMS group enrollment with course staff before submitting answers.</div>`;
    return `
        <div class="lms-live-stage lms-live-stage-min-320">
            ${renderLmsLiveStatusRail(currentQuestion)}
            ${rosterBanner}
            <div class="lms-live-pill-row lms-live-pill-row--center" data-lms-live-region="stage-pills">
                <span class="lms-live-pill ${timeState?.paused ? 'is-paused' : timeState?.answerable ? 'is-live' : 'is-locked'}"><i class="far fa-clock"></i> ${timeState?.paused ? 'Paused' : timeState?.answerable ? `${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s left` : 'Answers closed'}</span>
                <span class="lms-live-pill"><i class="fas fa-user"></i> ${escapeHtml(nickname)}</span>
                ${answer ? `<span class="lms-live-pill ${answer.correct ? 'is-live' : ''}"><i class="fas ${answer.correct ? 'fa-check' : 'fa-circle'}"></i> ${answer.correct ? `+${escapeHtml(String((answer.score || 0) + (answer.streakBonus || 0)))}` : '0 pts'}</span>` : `<span class="lms-live-pill"><i class="fas fa-trophy"></i> ${LMS_LIVE_MAX_SCORE} max</span>`}
            </div>
            ${renderLmsLiveTimerMeter(currentQuestion, timeState)}
            <div class="lms-live-question-text">${escapeHtml(currentQuestion.text)}</div>
            <div data-lms-live-region="options">${renderLmsLiveQuestionOptions(currentQuestion, session, participant, resourceKey)}</div>
        </div>
    `;
}

function patchLmsLiveQuizRegion(contentArea, region, html) {
    if (!contentArea || !region) return;
    const node = contentArea.querySelector(`[data-lms-live-region="${region}"]`);
    if (!node) return;
    node.innerHTML = html;
}

function updateLmsLiveQuizClockUi(resourceKey) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsActiveTab('live-quiz')) return false;
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey) return false;
    const canonicalKey = context.resourceKey;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    patchLmsLiveQuizRegion(contentArea, 'sync', renderLmsLiveSyncNotice(workspace));
    if (typeof window !== 'undefined') {
        window.__lmsLiveVolatileSignatures = window.__lmsLiveVolatileSignatures || {};
        const volatileSignature = typeof getLmsLiveQuizVolatileSignature === 'function'
            ? getLmsLiveQuizVolatileSignature(canonicalKey)
            : '';
        window.__lmsLiveVolatileSignatures[canonicalKey] = volatileSignature;
    }
    if (canManageLmsLiveQuiz(canonicalKey)) {
        const session = getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey);
        const stats = getLmsLiveSessionStats(session);
        const statusLabel = session ? (session.status === 'live' ? 'Live now' : session.status === 'ended' ? 'Ended' : 'Draft') : 'No session';
        const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(canonicalKey).sectionType || getCurrentLmsSectionType());
        const currentQuestion = getLmsLiveCurrentQuestion(session);
        const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
        patchLmsLiveQuizRegion(contentArea, 'hero-stats', `
            <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
            <span class="lms-live-pill ${session?.status === 'live' ? 'is-live' : ''}"><i class="fas fa-circle"></i> ${escapeHtml(statusLabel)}</span>
            ${session ? `<span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto shown to group</span>` : ''}
            ${renderLmsLiveParticipantPill(canonicalKey, session)}
            <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${stats.questionCount} questions</span>
        `);
        patchLmsLiveQuizRegion(contentArea, 'director-bar', renderLmsLiveStaffDirectorBarContent(session, canonicalKey, statusLabel));
        patchLmsLiveQuizRegion(contentArea, 'director-timer', `<strong>${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion?.timeLimit ?? 0))}s</strong><span>Timer</span>`);
        patchLmsLiveQuizRegion(contentArea, 'stage-pills', renderLmsLiveStaffStagePillsContent(session, statusLabel));
        if (currentQuestion) {
            patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRail(currentQuestion));
            patchLmsLiveQuizRegion(contentArea, 'timer', renderLmsLiveTimerMeterInner(currentQuestion, timeState));
            patchLmsLiveQuizRegion(contentArea, 'options', renderLmsLiveQuestionOptions(currentQuestion, session));
            patchLmsLiveQuizRegion(contentArea, 'stage-breakdown', renderLmsLiveQuestionBreakdown(session, currentQuestion));
            patchLmsLiveQuizRegion(contentArea, 'broadcast-actions', renderLmsLiveStaffBroadcastActionsMarkup(session, canonicalKey, currentQuestion));
            patchLmsLiveQuizRegion(contentArea, 'control-grid', renderLmsLiveStaffControlGridMarkup(canonicalKey, session, currentQuestion));
        }
        const queueSession = getLmsLiveStaffEditingSession(canonicalKey) || session;
        patchLmsLiveQuizRegion(contentArea, 'queue', renderLmsLiveStaffQueueMarkup(queueSession, canonicalKey));
        patchLmsLiveQuizRegion(contentArea, 'leaderboard', renderLmsLiveScoreList(session));
        patchLmsLiveQuizRegion(contentArea, 'breakdown', renderLmsLiveQuestionBreakdown(session, currentQuestion));
        return true;
    }
    const session = getLmsLiveStudentSession(canonicalKey);
    if (!session) return false;
    const participantMeta = getLmsLiveStudentMeta(canonicalKey);
    const participant = session.participants?.[participantMeta.id] || null;
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    if (!currentQuestion || !['showing', 'paused', 'locked', 'revealed'].includes(String(currentQuestion.state || ''))) {
        return false;
    }
    const timeState = getLmsLiveQuestionTimeState(currentQuestion);
    const answer = participant?.answers?.[currentQuestion.id] || null;
    const nickname = participant?.nickname || participantMeta.name || 'Student';
    patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRail(currentQuestion));
    patchLmsLiveQuizRegion(contentArea, 'stage-pills', `
        <span class="lms-live-pill ${timeState?.paused ? 'is-paused' : timeState?.answerable ? 'is-live' : 'is-locked'}"><i class="far fa-clock"></i> ${timeState?.paused ? 'Paused' : timeState?.answerable ? `${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s left` : 'Answers closed'}</span>
        <span class="lms-live-pill"><i class="fas fa-user"></i> ${escapeHtml(nickname)}</span>
        ${answer ? `<span class="lms-live-pill ${answer.correct ? 'is-live' : ''}"><i class="fas ${answer.correct ? 'fa-check' : 'fa-circle'}"></i> ${answer.correct ? `+${escapeHtml(String((answer.score || 0) + (answer.streakBonus || 0)))}` : '0 pts'}</span>` : `<span class="lms-live-pill"><i class="fas fa-trophy"></i> ${LMS_LIVE_MAX_SCORE} max</span>`}
    `);
    patchLmsLiveQuizRegion(contentArea, 'timer', renderLmsLiveTimerMeterInner(currentQuestion, timeState));
    patchLmsLiveQuizRegion(contentArea, 'options', renderLmsLiveQuestionOptions(currentQuestion, session, participant, canonicalKey));
    patchLmsLiveQuizRegion(contentArea, 'leaderboard', renderLmsLiveScoreList(session, 6));
    return true;
}

function refreshLmsLiveQuizUi(resourceKey, options = {}) {
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey) {
        renderLmsLiveQuizSection(resourceKey, options);
        return;
    }
    const canonicalKey = context.resourceKey;
    if (options.forceStructuralRender === true) {
        renderLmsLiveQuizSection(canonicalKey, options);
        return;
    }
    const structuralFingerprint = typeof getLmsLiveQuizStructuralFingerprint === 'function'
        ? getLmsLiveQuizStructuralFingerprint(canonicalKey)
        : '';
    const volatileSignature = typeof getLmsLiveQuizVolatileSignature === 'function'
        ? getLmsLiveQuizVolatileSignature(canonicalKey)
        : '';
    const previousStructural = window.__lmsLiveRenderFingerprints?.[canonicalKey] || '';
    const previousVolatile = window.__lmsLiveVolatileSignatures?.[canonicalKey] || '';
    if (!options.forceStructuralRender && isLmsLiveQuizDraftEditorActive()) {
        const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
        workspace.ui.deferredRender = true;
        updateLmsLiveQuizClockUi(canonicalKey);
        if (typeof window !== 'undefined') {
            window.__lmsLiveVolatileSignatures = window.__lmsLiveVolatileSignatures || {};
            window.__lmsLiveVolatileSignatures[canonicalKey] = volatileSignature;
        }
        return;
    }
    if (structuralFingerprint && structuralFingerprint === previousStructural) {
        updateLmsLiveQuizClockUi(canonicalKey);
        if (volatileSignature && volatileSignature !== previousVolatile) {
            if (typeof window !== 'undefined') {
                window.__lmsLiveVolatileSignatures = window.__lmsLiveVolatileSignatures || {};
                window.__lmsLiveVolatileSignatures[canonicalKey] = volatileSignature;
            }
        }
        return;
    }
    if (typeof window !== 'undefined') {
        window.__lmsLiveVolatileSignatures = window.__lmsLiveVolatileSignatures || {};
        window.__lmsLiveVolatileSignatures[canonicalKey] = volatileSignature;
    }
    renderLmsLiveQuizSection(canonicalKey, options);
}

function maybeRenderLmsLiveQuizSection(courseId, options = {}) {
    refreshLmsLiveQuizUi(courseId, {
        ...options,
        forceStructuralRender: options.forceRender === true
    });
}

function renderLmsLiveStaffWorkspace(context) {
    const resourceKey = context.resourceKey;
    const token = toDomToken(resourceKey);
    const workspace = ensureLmsLiveQuizWorkspace(resourceKey);
    const editingSession = getLmsLiveStaffEditingSession(resourceKey);
    const runtimeSession = getLmsLiveStaffLiveSession(resourceKey) || editingSession;
    const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(resourceKey).sectionType || getCurrentLmsSectionType());
    const stats = getLmsLiveSessionStats(runtimeSession);
    const currentQuestion = getLmsLiveCurrentQuestion(runtimeSession);
    const statusLabel = runtimeSession
        ? (runtimeSession.status === 'live' ? 'Live now' : runtimeSession.status === 'ended' ? 'Ended' : 'Draft')
        : 'No session';
    const questionCards = renderLmsLiveStaffQueueMarkup(editingSession, resourceKey);
    const stage = renderLmsLiveStaffStageMarkup(runtimeSession, resourceKey, statusLabel);

    if (workspace.ui.presentationMode) {
        return `
            <div class="lms-live-shell lms-live-presentation">
                <section class="lms-live-hero">
                    <div>
                        <div class="lms-live-kicker"><i class="fas fa-display"></i> Presentation mode</div>
                        <div class="lms-live-title">${escapeHtml(runtimeSession?.title || 'Live Quiz')}</div>
                    <div class="lms-live-copy">${escapeHtml(context.subject?.name || context.courseId || 'Subject')} - live broadcast for enrolled students</div>
                    </div>
                    <button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsLivePresentationMode(${lmsInlineArg(resourceKey)})"><i class="fas fa-compress"></i> Exit</button>
                </section>
                <section class="lms-live-layout">
                    <div class="lms-live-panel" data-lms-live-region="stage">${stage}</div>
                    <aside class="lms-live-side-stack">
                        <div class="lms-live-card">
                        <div class="lms-live-label">Leaderboard</div>
                            <div class="lms-live-score-list lms-live-score-list-mt-12" data-lms-live-region="leaderboard">${renderLmsLiveScoreList(runtimeSession, 10)}</div>
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
                <div class="lms-live-pill-row lms-live-pill-row--end" data-lms-live-region="hero-stats">
                    <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                    <span class="lms-live-pill ${runtimeSession?.status === 'live' ? 'is-live' : ''}"><i class="fas fa-circle"></i> ${escapeHtml(statusLabel)}</span>
                    ${runtimeSession ? `<span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto shown to group</span>` : ''}
                    ${renderLmsLiveParticipantPill(resourceKey, runtimeSession)}
                    <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${escapeHtml(String((editingSession?.questions || []).length || stats.questionCount))} questions</span>
                </div>
            </section>
            <div data-lms-live-region="sync">${renderLmsLiveSyncNotice(workspace)}</div>
            <section class="lms-live-layout">
                <div class="lms-live-side-stack">
                    <div class="lms-live-panel" data-lms-live-region="stage">${stage}</div>
                    <div class="lms-live-panel lms-live-queue-panel">
                        <div class="lms-route-card-head lms-route-card-head-mb-14 lms-live-queue-head">
                            <div>
                                <div class="lms-live-label lms-live-queue-kicker">Question queue</div>
                                <div class="lms-route-card-title lms-live-card-title-mt-5 lms-live-queue-title">Ready for this group</div>
                            </div>
                            <div class="lms-live-actions lms-live-queue-actions">
                                ${runtimeSession ? `<button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsLivePresentationMode(${lmsInlineArg(resourceKey)})"><i class="fas fa-display"></i> Present</button>` : ''}
                                ${runtimeSession ? `<button type="button" class="kiu-btn-outline" data-lms-click="exportLmsLiveQuizCsv(${lmsInlineArg(resourceKey)})"><i class="fas fa-file-export"></i> Export</button>` : ''}
                                ${runtimeSession && runtimeSession.status !== 'ended' ? `<button type="button" class="kiu-btn-outline" data-lms-click="endLmsLiveSession(${lmsInlineArg(resourceKey)})"><i class="fas fa-stop"></i> End</button>` : ''}
                                ${runtimeSession ? `<button type="button" class="kiu-btn-outline" data-lms-click="clearLmsLiveAnswers(${lmsInlineArg(resourceKey)})"><i class="fas fa-rotate"></i> Clear answers</button>` : ''}
                            </div>
                        </div>
                        <div class="lms-live-question-list lms-live-queue-list" data-lms-live-region="queue">${questionCards}</div>
                    </div>
                </div>
                <aside class="lms-live-side-stack">
                    ${renderLmsLiveRosterPanel(resourceKey, runtimeSession)}
                    <div class="lms-live-card">
                        <div class="lms-live-label">Session</div>
                        <div class="lms-live-form-grid lms-live-form-grid-mt-12">
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Title</span>
                                <input id="lms-live-title-${escapeHtml(token)}" class="lms-route-input" type="text" placeholder="e.g. Week 4 lecture quiz" value="${escapeHtml(editingSession?.title || '')}">
                            </label>
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Topic</span>
                                <input id="lms-live-topic-${escapeHtml(token)}" class="lms-route-input" type="text" placeholder="Topic or slide section" value="${escapeHtml(editingSession?.topic || '')}">
                            </label>
                            ${renderLmsLiveSessionSwitcher(resourceKey, workspace.sessions, workspace.ui?.activeSessionId || editingSession?.id || '')}
                            ${editingSession ? `<button type="button" class="kiu-btn-outline" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-click="saveLmsLiveSessionDetails(this.dataset.lmsResourceKey)"><i class="fas fa-save"></i> Save details</button>` : ''}
                            ${editingSession && editingSession.status !== 'live' && editingSession.status !== 'ended' && editingSession.questions?.length
                                ? `<button type="button" class="kiu-btn-blue" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-click="startLmsLiveSession(this.dataset.lmsResourceKey)"><i class="fas fa-broadcast-tower"></i> Start live session</button>`
                                : ''}
                            <button type="button" class="kiu-btn-blue" data-lms-resource-key="${escapeHtml(resourceKey)}" data-lms-click="createLmsLiveSession(this.dataset.lmsResourceKey)"><i class="fas fa-plus"></i> New session</button>
                        </div>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Add question</div>
                        <div class="lms-live-form-grid lms-live-form-grid-mt-12">
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
                        <button type="button" class="kiu-btn-outline lms-live-import-btn-mt-10" data-lms-click="importLmsLiveQuestionsFromText(${lmsInlineArg(resourceKey)})"><i class="fas fa-file-import"></i> Import</button>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Leaderboard</div>
                        <div class="lms-live-score-list lms-live-score-list-mt-12" data-lms-live-region="leaderboard">${renderLmsLiveScoreList(runtimeSession)}</div>
                    </div>
                    <div class="lms-live-card">
                        <div class="lms-live-label">Answer split</div>
                        <div class="lms-live-breakdown-wrap-mt-12" data-lms-live-region="breakdown">${renderLmsLiveQuestionBreakdown(runtimeSession, currentQuestion)}</div>
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
    const participantMeta = getLmsLiveStudentMeta(resourceKey);
    const participantId = participantMeta.id;
    if (session) {
        ensureLmsLiveRosterParticipants(resourceKey, session);
        if (participantId && typeof ensureLmsLiveStudentParticipant === 'function') {
            ensureLmsLiveStudentParticipant(resourceKey, session);
        }
    }
    const participant = participantId ? (session?.participants?.[participantId] || null) : null;
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const stats = getLmsLiveSessionStats(session);
    const questionVisible = currentQuestion
        && ['showing', 'paused', 'locked', 'revealed'].includes(String(currentQuestion.state || ''));

    if (!session || !questionVisible) {
        return `
            <div class="lms-live-shell">
                <section class="lms-live-student-wait">
                    <div class="lms-live-pulse"><i class="fas fa-bolt"></i></div>
                    <div>
                        <div class="lms-live-kicker"><i class="fas fa-display"></i> Classroom live quiz</div>
                        <div class="lms-live-title">${session ? 'Waiting for the next question' : 'No live question right now'}</div>
                        <div class="lms-live-copy lms-live-copy-auto-center lms-live-copy-waiting">${session ? 'Keep this screen open. The question appears automatically when your professor or TA starts the session or clicks Show.' : 'When your professor or TA starts a session, it appears here automatically. No code is required.'}</div>
                    </div>
                    <div class="lms-live-pill-row lms-live-pill-row--center">
                        <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                        <span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto broadcast</span>
                        <span class="lms-live-pill"><i class="fas fa-users"></i> ${stats.participants} joined</span>
                    </div>
                </section>
                <div data-lms-live-region="sync">${renderLmsLiveSyncNotice(workspace)}</div>
            </div>
        `;
    }

    return `
        <div class="lms-live-shell lms-live-phone">
            <section class="lms-live-student-card">
                <div class="lms-live-pill-row">
                    <span class="lms-live-pill is-live"><i class="fas fa-bolt"></i> Live now</span>
                    <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
                    <span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Group broadcast</span>
                    <span class="lms-live-pill"><i class="fas fa-users"></i> ${stats.participants} joined</span>
                </div>
                <div class="lms-live-title lms-live-title-responsive">${escapeHtml(session.title || 'Live Quiz')}</div>
                <div class="lms-live-copy">${escapeHtml(context.subject?.name || context.courseId || 'Subject')} - ${escapeHtml(context.group?.name || context.groupId || 'Group')}</div>
            </section>
            <div data-lms-live-region="sync">${renderLmsLiveSyncNotice(workspace)}</div>
            <section class="lms-live-panel">
                <div data-lms-live-region="stage">${renderLmsLiveStudentStageMarkup(context, session, participant, participantMeta)}</div>
            </section>
            <section class="lms-live-student-card">
                <div class="lms-live-label">Class ranking</div>
                <div class="lms-live-score-list lms-live-score-list-mt-12" data-lms-live-region="leaderboard">${renderLmsLiveScoreList(session, 6)}</div>
            </section>
        </div>
    `;
}

function renderLmsLiveQuizLoadingShell() {
    return `
        <div class="lms-live-shell">
            <div class="lms-live-card lms-live-sync-card is-syncing">
                <div class="lms-live-label"><i class="fas fa-rotate fa-spin"></i> Loading live quiz</div>
                <div class="lms-live-copy lms-route-copy-mt-6">Syncing the latest session from the server…</div>
            </div>
        </div>
    `;
}

function paintLmsLiveQuizSectionContent(context, options = {}) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !context?.resourceKey) return;
    ensureLmsLiveQuizWorkspace(context.resourceKey);
    const preserveDraft = options.preserveDraft !== false
        && canManageLmsLiveQuiz(context.resourceKey);
    const draftSnapshot = preserveDraft ? captureLmsLiveQuizDraftFields(context.resourceKey) : null;
    contentArea.innerHTML = canManageLmsLiveQuiz(context.resourceKey)
        ? renderLmsLiveStaffWorkspace(context)
        : renderLmsLiveStudentWorkspace(context);
    if (draftSnapshot) restoreLmsLiveQuizDraftFields(draftSnapshot, context.resourceKey);
    const workspace = ensureLmsLiveQuizWorkspace(context.resourceKey);
    workspace.ui.deferredRender = false;
    if (!contentArea.dataset.lmsLiveBlurBound) {
        contentArea.dataset.lmsLiveBlurBound = '1';
        contentArea.addEventListener('focusout', () => {
            window.setTimeout(() => {
                if (!isLmsActiveTab('live-quiz') || isLmsLiveQuizDraftEditorActive()) return;
                const latest = ensureLmsLiveQuizWorkspace(context.resourceKey);
                if (!latest.ui.deferredRender) return;
                latest.ui.deferredRender = false;
                refreshLmsLiveQuizUi(context.resourceKey, { skipLoad: true, forceStructuralRender: true });
            }, 0);
        });
    }
    if (typeof storeLmsLiveQuizRenderFingerprint === 'function') {
        storeLmsLiveQuizRenderFingerprint(context.resourceKey);
    }
    scheduleLmsLiveClockRefresh(context.resourceKey);
    if (typeof bindLmsLiveQuizFocusRefresh === 'function') {
        bindLmsLiveQuizFocusRefresh();
    }
    if (typeof window.syncLmsTabRenderCacheFromDom === 'function') {
        const sectionType = typeof getCurrentLmsSectionType === 'function' ? getCurrentLmsSectionType() : '';
        const courseKey = typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('live-quiz') : context.resourceKey;
        window.syncLmsTabRenderCacheFromDom('live-quiz', courseKey, sectionType);
    }
}

function renderLmsLiveQuizSection(courseId, options = {}) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('live-quiz', contentArea);
    const context = resolveActiveLmsQuizContext(courseId);
    const renderToken = String(contentArea.dataset.lmsRenderToken || '');
    if (!context?.resourceKey) {
        contentArea.innerHTML = renderLmsRouteEmptyState('Open a group first', 'Live quiz is available inside each subject group.', 'fa-bolt');
        return;
    }
    if (options.skipLoad === true) {
        paintLmsLiveQuizSectionContent(context, options);
        return;
    }
    contentArea.innerHTML = renderLmsLiveQuizLoadingShell();
    const workspace = ensureLmsLiveQuizWorkspace(context.resourceKey);
    if (workspace?.ui?.accessDenied) {
        workspace.ui.accessDenied = false;
        workspace.ui.syncError = '';
    }
    Promise.resolve(prepareLmsLiveQuizImpersonation(context.resourceKey))
        .catch(() => null)
        .then(() => {
            if (typeof isLmsRenderCurrent === 'function' && !isLmsRenderCurrent('live-quiz', renderToken, contentArea)) {
                return null;
            }
            return typeof loadLmsLiveQuizWorkspace === 'function'
                ? loadLmsLiveQuizWorkspace(context.resourceKey, {
                    force: options.softLoad !== true,
                    forceRemote: true,
                    forceRender: true,
                    forceStructuralRender: true,
                    render: false
                })
                : null;
        })
        .finally(() => {
            if (typeof isLmsRenderCurrent === 'function' && !isLmsRenderCurrent('live-quiz', renderToken, contentArea)) {
                return;
            }
            if (!isLmsActiveTab('live-quiz')) return;
            const latestContext = resolveActiveLmsQuizContext(courseId);
            if (!latestContext?.resourceKey) return;
            paintLmsLiveQuizSectionContent(latestContext, { ...options, skipLoad: true });
        });
}

if (typeof window !== 'undefined') {
    Object.assign(window, {
        renderLmsLiveQuizSection,
        refreshLmsLiveQuizUi,
        maybeRenderLmsLiveQuizSection,
        updateLmsLiveQuizClockUi,
        captureLmsLiveQuizDraftFields,
        restoreLmsLiveQuizDraftFields,
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
        exportLmsLiveQuizCsv,
        moveLmsLiveQuestion,
        importLmsLiveQuestionsFromText,
        addLmsLiveQuestion,
        createLmsLiveSession,
        setLmsLiveActiveSession,
        saveLmsLiveSessionDetails,
        toggleLmsLivePresentationMode,
        answerLmsLiveQuestion,
        seedLmsLiveQuizRoster
    });
}
