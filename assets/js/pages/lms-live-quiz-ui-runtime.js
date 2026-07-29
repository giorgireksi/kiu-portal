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
        ? `<button type="button" class="lux-secondary-btn lms-live-import-btn-mt-10" data-lms-click="seedLmsLiveQuizRoster(${lmsInlineArg(resourceKey)})"><i class="fas fa-user-plus"></i> Seed roster for testing</button>`
        : '';
    return `
        <div class="lms-live-card home-hover-chip">
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

const LMS_LIVE_BROADCAST_PATCH_HINTS = {
    'question-activated': { questionSwap: true, includeResults: true },
    'question-paused': {},
    'question-resumed': {},
    'question-locked': {},
    'question-revealed': { includeResults: true },
    'results-toggle': { includeResults: true },
    'question-stepped': { questionSwap: true, includeResults: true },
    'question-ready': {},
    'podium-reveal': { includeResults: true },
    'podium-dismiss': {}
};

const LMS_LIVE_QUEUE_PATCH_HINTS = {
    'question-deleted': { includeBreakdown: true },
    'question-duplicated': {},
    'question-moved': {},
    'question-added': { includeHeroStats: true },
    'questions-imported': { includeHeroStats: true },
    'answers-cleared': { includeBreakdown: true },
    'session-ended': { includeStage: true, includeHeroStats: true }
};

const LMS_LIVE_SESSION_PATCH_HINTS = {
    'session-deleted': { includeQueue: false, includeBroadcast: false, includeHeroStats: true },
    'session-created': { includeQueue: true, includeBroadcast: false, includeHeroStats: true }
};

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
    const broadcastPatchHints = LMS_LIVE_BROADCAST_PATCH_HINTS[reason] || {};
    const forceQueuePatch = reason === 'question-ready';
    refreshStaffLmsLiveQuizUi(canonicalKey || resourceKey, {
        forceBroadcastPatch: true,
        forceQueuePatch,
        broadcastPatchHints,
        queuePatchHints: forceQueuePatch ? broadcastPatchHints : {}
    });
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function' && canonicalKey
        ? runImmediateLmsLiveQuizSync(canonicalKey, reason, { deferUiRefresh: true })
        : Promise.resolve(null);
    return syncPromise.finally(() => {
        if (typeof refreshLmsLiveQuizUi === 'function') {
            refreshLmsLiveQuizUi(canonicalKey || resourceKey, {
                skipLoad: true,
                forceBroadcastPatch: true,
                forceQueuePatch,
                broadcastPatchHints,
                queuePatchHints: forceQueuePatch ? broadcastPatchHints : {}
            });
            return;
        }
        renderLmsLiveQuizSection(canonicalKey || resourceKey, { skipLoad: true });
    });
}

function applyLmsLiveQuizSessionPatches(resourceKey, reason = 'session-deleted', hints = {}) {
    const patchHints = { ...(LMS_LIVE_SESSION_PATCH_HINTS[reason] || {}), ...hints };
    updateLmsLiveQuizSessionUi(resourceKey, patchHints);
    if (patchHints.includeQueue) updateLmsLiveQuizQueueUi(resourceKey, patchHints);
    if (patchHints.includeBroadcast) updateLmsLiveQuizBroadcastUi(resourceKey, patchHints);
    if (patchHints.includeHeroStats) updateLmsLiveQuizVolatileUi(resourceKey);
    return patchHints;
}

function syncStaffLmsLiveQuizSessionChange(resourceKey, reason = 'session-deleted', hints = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (canonicalKey && typeof touchLmsLiveQuizWorkspaceLocal === 'function') {
        touchLmsLiveQuizWorkspaceLocal(canonicalKey);
    }
    if (canonicalKey) {
        const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
        workspace.ui.dirty = true;
        workspace.ui.lastStructuralReason = reason;
        workspace.ui.lastStructuralAt = Date.now();
        if (workspace.ui?.syncTimer) {
            clearTimeout(workspace.ui.syncTimer);
            workspace.ui.syncTimer = null;
        }
        if (typeof window.invalidateLmsLiveQuizTabCache === 'function') {
            window.invalidateLmsLiveQuizTabCache(canonicalKey);
        }
    }
    const patchHints = applyLmsLiveQuizSessionPatches(canonicalKey || resourceKey, reason, hints);
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function' && canonicalKey
        ? runImmediateLmsLiveQuizSync(canonicalKey, reason, { deferUiRefresh: true, queueStructural: true })
        : Promise.resolve(null);
    return syncPromise.finally(() => {
        const workspace = canonicalKey ? ensureLmsLiveQuizWorkspace(canonicalKey) : null;
        if (workspace?.ui?.syncError && typeof notifyLmsLiveStaffGuard === 'function') {
            notifyLmsLiveStaffGuard(workspace.ui.syncError);
        }
        applyLmsLiveQuizSessionPatches(canonicalKey || resourceKey, reason, patchHints);
        if (typeof storeLmsLiveQuizRenderFingerprint === 'function' && canonicalKey) {
            storeLmsLiveQuizRenderFingerprint(canonicalKey);
        }
    });
}

function syncStaffLmsLiveQuizQueueChange(resourceKey, reason = 'live-quiz', hints = {}) {
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
    const mergedHints = { ...(LMS_LIVE_QUEUE_PATCH_HINTS[reason] || {}), ...hints };
    const forceBroadcastPatch = hints.forceBroadcastPatch === true;
    refreshStaffLmsLiveQuizUi(canonicalKey || resourceKey, {
        forceQueuePatch: true,
        forceBroadcastPatch,
        queuePatchHints: mergedHints,
        broadcastPatchHints: mergedHints
    });
    const syncPromise = typeof runImmediateLmsLiveQuizSync === 'function' && canonicalKey
        ? runImmediateLmsLiveQuizSync(canonicalKey, reason, { deferUiRefresh: true, queueStructural: true })
        : Promise.resolve(null);
    return syncPromise.finally(() => {
        if (typeof refreshLmsLiveQuizUi === 'function') {
            refreshLmsLiveQuizUi(canonicalKey || resourceKey, {
                skipLoad: true,
                forceQueuePatch: true,
                forceBroadcastPatch,
                queuePatchHints: mergedHints,
                broadcastPatchHints: mergedHints
            });
            return;
        }
        renderLmsLiveQuizSection(canonicalKey || resourceKey, { skipLoad: true });
    });
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

const LMS_LIVE_STATUS_STEPS = [
    ['ready', 'Ready'],
    ['showing', 'Showing'],
    ['paused', 'Paused'],
    ['locked', 'Locked'],
    ['revealed', 'Revealed']
];

function getLmsLiveStatusStepIndex(state = 'draft') {
    const normalized = String(state || 'draft').toLowerCase();
    if (normalized === 'completed') return LMS_LIVE_STATUS_STEPS.length - 1;
    if (normalized === 'draft') return -1;
    const index = LMS_LIVE_STATUS_STEPS.findIndex(([key]) => key === normalized);
    return index >= 0 ? index : -1;
}

function getLmsLiveQuestionBreakdown(session = null, question = null) {
    const participants = getLmsLiveParticipantList(session);
    const answeredCount = participants.filter(participant => {
        const answer = participant.answers?.[question?.id];
        return hasLmsLiveAnswerForQuestion(answer, question);
    }).length;
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
            percent: answeredCount ? Math.round((count / answeredCount) * 100) : 0
        };
    });
}

function renderLmsLiveBreakdownRows(session = null, question = null, options = {}) {
    const showPercent = options.showPercent !== false;
    const breakdown = getLmsLiveQuestionBreakdown(session, question);
    return breakdown.map(item => `
        <div class="lms-live-breakdown-row" data-option-index="${escapeHtml(String(item.index))}">
            <span class="lms-live-option-key">${escapeHtml(item.key)}</span>
            <div class="lms-live-breakdown-bar"><span style="--lms-live-breakdown-width:${escapeHtml(String(item.percent))}%;"></span></div>
            ${showPercent ? `<span class="lms-live-breakdown-percent">${escapeHtml(String(item.percent))}%</span>` : ''}
            <strong>${escapeHtml(String(item.count))}</strong>
        </div>
    `).join('');
}

function renderLmsLiveQuestionBreakdown(session = null, question = null) {
    if (!question) return `<div class="lms-live-copy">Start a question to see answer distribution.</div>`;
    return `
        <div class="lms-live-breakdown">
            ${renderLmsLiveBreakdownRows(session, question, { showPercent: false })}
        </div>
    `;
}

function shouldShowLmsLiveBroadcastResults(session = null, question = null, presentationMode = false) {
    if (!presentationMode || !question) return false;
    const state = String(question.state || 'draft').toLowerCase();
    return state === 'revealed' || Boolean(session?.showResults);
}

function renderLmsLiveBroadcastResultsCardContent(session = null, question = null, presentationMode = false) {
    if (!shouldShowLmsLiveBroadcastResults(session, question, presentationMode)) return '';
    const breakdown = getLmsLiveQuestionBreakdown(session, question);
    const totalAnswered = breakdown.reduce((sum, item) => sum + item.count, 0);
    const empty = totalAnswered === 0;
    return `
        <div class="lms-live-broadcast-results-head">
            <div class="lms-live-section-kicker">Answer split</div>
            <span class="lms-live-broadcast-results-meta">${escapeHtml(String(totalAnswered))} response${totalAnswered === 1 ? '' : 's'}</span>
        </div>
        ${empty
            ? `<div class="lms-live-broadcast-results-empty"><i class="fas fa-chart-bar"></i><span>Waiting for student responses</span></div>`
            : `<div class="lms-live-breakdown lms-live-breakdown--rich">${renderLmsLiveBreakdownRows(session, question)}</div>`}
    `;
}

function renderLmsLiveBroadcastResultsCard(session = null, question = null, presentationMode = false) {
    if (!presentationMode) return '';
    const visible = shouldShowLmsLiveBroadcastResults(session, question, presentationMode);
    const content = visible
        ? renderLmsLiveBroadcastResultsCardContent(session, question, presentationMode)
        : `<div class="lms-live-broadcast-results-placeholder"><i class="fas fa-chart-bar"></i><span>Reveal the question to show answer split here.</span></div>`;
    return `
        <div class="lms-live-broadcast-results-card${visible ? '' : ' is-placeholder'}" data-lms-live-region="broadcast-results">
            ${content}
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

function revealLmsLiveQuizPodium(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffLiveSession(resourceKey) || getLmsLiveStaffSession(resourceKey);
    if (!canRevealLmsLiveQuizPodium(session)) {
        notifyLmsLiveStaffGuard('Show rankings is available after the session ends.');
        return;
    }
    session.showPodium = true;
    session.podiumRevealAt = new Date().toISOString();
    syncStaffLmsLiveQuizControl(resourceKey, 'podium-reveal');
}

function dismissLmsLiveQuizPodium(resourceKey) {
    if (!canManageLmsLiveQuiz(resourceKey)) return;
    const session = getLmsLiveStaffLiveSession(resourceKey) || getLmsLiveStaffSession(resourceKey);
    if (!session) return;
    session.showPodium = false;
    session.podiumRevealAt = null;
    if (typeof unmountLmsLivePodiumOverlay === 'function') {
        unmountLmsLivePodiumOverlay();
    }
    syncStaffLmsLiveQuizControl(resourceKey, 'podium-dismiss');
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

function patchLmsLiveSessionSwitcherOptionLabel(resourceKey, session = null) {
    if (!session?.id || typeof document === 'undefined') return;
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    const select = contentArea.querySelector('select[data-lms-change*="setLmsLiveActiveSession"]');
    if (!select) return;
    const option = Array.from(select.options).find(item => String(item.value) === String(session.id));
    if (!option) return;
    const label = repairLmsDisplayText(session.title || 'Live Quiz', 'Live Quiz');
    const status = String(session.status || 'draft');
    option.textContent = `${label} (${status})`;
}

function syncLmsLiveSessionDetailsFromDom(resourceKey, options = {}) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return null;
    const session = getLmsLiveStaffEditingSession(canonicalKey);
    if (!session) return null;
    const token = toDomToken(canonicalKey);
    const nextTitle = repairLmsDisplayText(
        document.getElementById(`lms-live-title-${token}`)?.value || session.title,
        session.title || 'Live Quiz'
    );
    const nextTopic = repairLmsDisplayText(document.getElementById(`lms-live-topic-${token}`)?.value || '', '');
    const changed = session.title !== nextTitle || session.topic !== nextTopic;
    session.title = nextTitle;
    session.topic = nextTopic;
    if (changed) {
        patchLmsLiveSessionSwitcherOptionLabel(canonicalKey, session);
        if (options.save !== false) {
            saveLmsLiveQuizChange(canonicalKey, 'session-details-updated');
        }
    }
    return session;
}

function updateLmsLiveSessionField(resourceKey, field, value) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return;
    const normalizedField = String(field || '').trim().toLowerCase();
    if (!['title', 'topic'].includes(normalizedField)) return;
    const session = getLmsLiveStaffEditingSession(canonicalKey);
    if (!session) return;
    const nextValue = normalizedField === 'title'
        ? repairLmsDisplayText(value, session.title || 'Live Quiz')
        : repairLmsDisplayText(value, '');
    if (session[normalizedField] === nextValue) return;
    session[normalizedField] = nextValue;
    if (normalizedField === 'title') {
        patchLmsLiveSessionSwitcherOptionLabel(canonicalKey, session);
    }
    saveLmsLiveQuizChange(canonicalKey, 'session-details-updated');
}

function setLmsLiveActiveSession(resourceKey, sessionId) {
    const canonicalKey = typeof resolveCanonicalLmsResourceKey === 'function'
        ? resolveCanonicalLmsResourceKey(resourceKey)
        : String(resourceKey || '').trim();
    if (!canonicalKey || !canManageLmsLiveQuiz(canonicalKey)) return;
    syncLmsLiveSessionDetailsFromDom(canonicalKey);
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

const isLmsLiveSessionRemoveDialogOpen = window.isLmsLiveSessionRemoveDialogOpen;
const closeLmsLiveSessionRemoveDialog = window.closeLmsLiveSessionRemoveDialog;
const renderLmsLiveSessionRemoveDialogCard = window.renderLmsLiveSessionRemoveDialogCard;
const renderLmsLiveSessionRemoveDialog = window.renderLmsLiveSessionRemoveDialog;
const mountLmsLiveSessionRemoveDialog = window.mountLmsLiveSessionRemoveDialog;
const openLmsLiveSessionRemoveDialog = window.openLmsLiveSessionRemoveDialog;
const advanceLmsLiveSessionRemoveDialog = window.advanceLmsLiveSessionRemoveDialog;
const confirmLmsLiveSessionRemove = window.confirmLmsLiveSessionRemove;
const deleteLmsLiveSession = window.deleteLmsLiveSession;
const renderLmsLiveSessionCardHeader = window.renderLmsLiveSessionCardHeader;
const renderLmsLiveSessionFieldsMarkup = window.renderLmsLiveSessionFieldsMarkup;
const renderLmsLiveSessionActionsMarkup = window.renderLmsLiveSessionActionsMarkup;
const renderLmsLiveSessionSwitcher = window.renderLmsLiveSessionSwitcher;
const createLmsLiveSession = window.createLmsLiveSession;
const saveLmsLiveSessionDetails = window.saveLmsLiveSessionDetails;
const ensureLmsLiveEditableSession = window.ensureLmsLiveEditableSession;
const addLmsLiveQuestion = window.addLmsLiveQuestion;
const duplicateLmsLiveQuestion = window.duplicateLmsLiveQuestion;
const moveLmsLiveQuestion = window.moveLmsLiveQuestion;
const importLmsLiveQuestionsFromText = window.importLmsLiveQuestionsFromText;
const activateLmsLiveQuestion = window.activateLmsLiveQuestion;
const setLmsLiveQuestionReady = window.setLmsLiveQuestionReady;
const pauseLmsLiveQuestion = window.pauseLmsLiveQuestion;
const resumeLmsLiveQuestion = window.resumeLmsLiveQuestion;
const lockLmsLiveQuestion = window.lockLmsLiveQuestion;
const revealLmsLiveQuestion = window.revealLmsLiveQuestion;
const toggleLmsLiveResults = window.toggleLmsLiveResults;
const stepLmsLiveQuestion = window.stepLmsLiveQuestion;
const startLmsLiveSession = window.startLmsLiveSession;
const endLmsLiveSession = window.endLmsLiveSession;
const resolveLmsLiveStaffQueueMutationSession = window.resolveLmsLiveStaffQueueMutationSession;
const deleteLmsLiveQuestion = window.deleteLmsLiveQuestion;
const clearLmsLiveAnswers = window.clearLmsLiveAnswers;
const answerLmsLiveQuestion = window.answerLmsLiveQuestion;
const renderLmsLiveQuestionOptions = window.renderLmsLiveQuestionOptions;
const renderLmsLiveSyncNotice = window.renderLmsLiveSyncNotice;
const renderLmsLiveStatusRailSteps = window.renderLmsLiveStatusRailSteps;
const renderLmsLiveStatusRail = window.renderLmsLiveStatusRail;
const renderLmsLiveTimerMeterInner = window.renderLmsLiveTimerMeterInner;
const renderLmsLiveTimerMeter = window.renderLmsLiveTimerMeter;
const getLmsLiveStudentViewMeta = window.getLmsLiveStudentViewMeta;

function renderLmsLiveStaffDirectorBarContent(session, resourceKey, statusLabel = 'Draft') {
    const stats = getLmsLiveSessionStats(session);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    if (!currentQuestion) return '';
    const { answerStatusLabel, tileClass } = getLmsLiveStudentViewMeta(currentQuestion, timeState);
    const currentQuestionNumber = Math.max(1, (session?.questions || []).findIndex(question => String(question.id) === String(currentQuestion.id)) + 1);
    return `
        <div class="lms-live-director-bar">
            <div class="lms-live-director-tile"><i class="fas fa-list-ol lms-live-director-icon" aria-hidden="true"></i><strong>${escapeHtml(String(currentQuestionNumber))}/${escapeHtml(String(stats.questionCount || 0))}</strong><span>Question</span></div>
            <div class="lms-live-director-tile" data-lms-live-region="director-answered"><i class="fas fa-users lms-live-director-icon" aria-hidden="true"></i><strong>${escapeHtml(String(stats.currentAnswerCount))}/${escapeHtml(String(stats.participants))}</strong><span>Answered</span></div>
            <div class="lms-live-director-tile" data-lms-live-region="director-timer"><i class="far fa-clock lms-live-director-icon" aria-hidden="true"></i><strong>${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s</strong><span>Timer</span></div>
            <div class="lms-live-director-tile ${tileClass}" data-lms-live-region="director-student-view"><i class="fas fa-eye lms-live-director-icon" aria-hidden="true"></i><strong>${escapeHtml(answerStatusLabel)}</strong><span>Student view</span></div>
        </div>
    `;
}

function renderLmsLiveBroadcastHeader(session, resourceKey, statusLabel = 'Draft', currentQuestion = null) {
    if (!currentQuestion) return '';
    return `
        <div class="lms-live-broadcast-header" data-lms-live-region="broadcast-header">
            <div class="lms-live-section-kicker">Live broadcast</div>
            <div data-lms-live-region="director-bar">${renderLmsLiveStaffDirectorBarContent(session, resourceKey, statusLabel)}</div>
            <div data-lms-live-region="status-rail" class="lms-live-status-rail" aria-label="Live question state">
                ${renderLmsLiveStatusRailSteps(currentQuestion)}
            </div>
        </div>
    `;
}

function renderLmsLiveBroadcastQuestionCardInner(question, session, resourceKey, timeState = null) {
    if (!question) return '';
    const resolvedTimeState = timeState || getLmsLiveQuestionTimeState(question);
    const topicChip = question.topic
        ? `<span class="lms-live-question-topic-chip">${escapeHtml(question.topic)}</span>`
        : '';
    return `
        <div data-lms-live-region="timer">${renderLmsLiveTimerMeterInner(question, resolvedTimeState)}</div>
        <div class="lms-live-question-headline">
            ${topicChip}
            <div class="lms-live-question-text">${escapeHtml(question.text)}</div>
        </div>
        <div data-lms-live-region="options">${renderLmsLiveQuestionOptions(question, session)}</div>
    `;
}

function renderLmsLiveBroadcastQuestionCard(question, session, resourceKey, timeState = null) {
    if (!question) return '';
    return `
        <div class="lms-live-broadcast-question-card" data-lms-live-region="broadcast-question">
            ${renderLmsLiveBroadcastQuestionCardInner(question, session, resourceKey, timeState)}
        </div>
    `;
}

function renderLmsLiveBroadcastControlDeckContent(resourceKey, session = null, currentQuestion = null) {
    if (!session || !currentQuestion) return '';
    const availability = getLmsLiveStaffActionAvailability(currentQuestion, session);
    return `
        <div class="lms-live-control-group">
            <div class="lms-live-control-group-label">Broadcast flow</div>
            <div class="lms-live-control-group-actions lms-live-broadcast-actions">
                ${renderLmsLiveStaffActionButton('show', availability, 'Show', 'fas fa-eye', `activateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(currentQuestion.id)})`, true)}
                ${renderLmsLiveStaffActionButton('pause', availability, 'Pause', 'fas fa-pause', `pauseLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
                ${renderLmsLiveStaffActionButton('resume', availability, 'Resume', 'fas fa-play', `resumeLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
                ${renderLmsLiveStaffActionButton('lock', availability, 'Lock', 'fas fa-lock', `lockLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
                ${renderLmsLiveStaffActionButton('reveal', availability, 'Reveal', 'fas fa-check-circle', `revealLmsLiveQuestion(${lmsInlineArg(resourceKey)})`)}
            </div>
        </div>
        <div class="lms-live-control-group">
            <div class="lms-live-control-group-label">Session flow</div>
            <div class="lms-live-control-group-actions lms-live-control-grid">
                ${renderLmsLiveStaffActionButton('results', availability, 'Results', 'fas fa-chart-simple', `toggleLmsLiveResults(${lmsInlineArg(resourceKey)})`)}
                ${renderLmsLiveStaffActionButton('podium', availability, 'Show rankings', 'fas fa-trophy', `revealLmsLiveQuizPodium(${lmsInlineArg(resourceKey)})`)}
                ${renderLmsLiveStaffActionButton('prev', availability, 'Previous', 'fas fa-arrow-left', `stepLmsLiveQuestion(${lmsInlineArg(resourceKey)}, -1)`)}
                ${renderLmsLiveStaffActionButton('next', availability, 'Next', 'fas fa-arrow-right', `stepLmsLiveQuestion(${lmsInlineArg(resourceKey)}, 1)`)}
            </div>
        </div>
        <div class="lms-live-operator-note">Use Next to advance and auto-broadcast the next question. Pause if discussion takes longer, lock answers, then reveal the correct answer and answer split.</div>
    `;
}

function renderLmsLiveBroadcastControlDeck(resourceKey, session = null, currentQuestion = null) {
    const content = renderLmsLiveBroadcastControlDeckContent(resourceKey, session, currentQuestion);
    if (!content) return '';
    return `
        <div class="lms-live-broadcast-control-deck" data-lms-live-region="broadcast-controls">
            ${content}
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
        question: '',
        options: ['', '', '', ''],
        correct: '0',
        timer: '45',
        questionTopic: '',
        importText: ''
    };
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
        return `<div class="lms-live-card home-hover-chip lms-live-queue-empty-card"><div class="lms-live-copy lms-live-queue-empty-copy">No questions yet. Add one from the right panel.</div></div>`;
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
                    <button type="button" class="lux-secondary-btn" data-lms-click="moveLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)}, -1)"><i class="fas fa-arrow-up"></i></button>
                    <button type="button" class="lux-secondary-btn" data-lms-click="moveLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)}, 1)"><i class="fas fa-arrow-down"></i></button>
                    <button type="button" class="lux-secondary-btn" data-lms-click="duplicateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-copy"></i> Duplicate</button>
                    <button type="button" class="lux-secondary-btn" data-lms-click="setLmsLiveQuestionReady(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-eye-slash"></i> Ready</button>
                    <button type="button" class="lux-primary-btn" data-lms-click="activateLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-play"></i> Show</button>
                    <button type="button" class="lux-secondary-btn" data-lms-click="deleteLmsLiveQuestion(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(question.id)})"><i class="fas fa-trash"></i> Remove</button>
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

function renderLmsLiveStaffStageMarkup(session, resourceKey, statusLabel = 'Draft', options = {}) {
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    const timeState = currentQuestion ? getLmsLiveQuestionTimeState(currentQuestion) : null;
    const presentationMode = Boolean(options.presentationMode);
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
    const stageClass = presentationMode ? 'lms-live-stage is-broadcast is-presentation-stage' : 'lms-live-stage is-broadcast';
    return `
        <div class="${stageClass}">
            ${renderLmsLiveBroadcastHeader(session, resourceKey, statusLabel, currentQuestion)}
            <div class="lms-live-broadcast-body${presentationMode ? ' is-presentation' : ''}">
                ${renderLmsLiveBroadcastQuestionCard(currentQuestion, session, resourceKey, timeState)}
                ${renderLmsLiveBroadcastResultsCard(session, currentQuestion, presentationMode)}
            </div>
            ${renderLmsLiveBroadcastControlDeck(resourceKey, session, currentQuestion)}
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
            <div data-lms-live-region="status-rail" class="lms-live-status-rail" aria-label="Live question state">
                ${renderLmsLiveStatusRailSteps(currentQuestion)}
            </div>
            ${rosterBanner}
            <div class="lms-live-pill-row lms-live-pill-row--center" data-lms-live-region="stage-pills">
                <span class="lms-live-pill ${timeState?.paused ? 'is-paused' : timeState?.answerable ? 'is-live' : 'is-locked'}" data-lms-live-region="stage-clock-pill"><i class="far fa-clock"></i> ${timeState?.paused ? 'Paused' : timeState?.answerable ? `${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s left` : 'Answers closed'}</span>
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

function getLmsLiveTimerUiModel(question = null, timeState = null) {
    if (!question) return null;
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
    const studentViewMeta = getLmsLiveStudentViewMeta(question, timeState);
    return {
        remainingSeconds,
        progress,
        isPaused,
        isClosed,
        isLive: Boolean(timeState?.answerable),
        limitSeconds,
        directorTimerLabel: `${remainingSeconds}s`,
        studentClockLabel: isPaused
            ? 'Paused'
            : timeState?.answerable
                ? `${remainingSeconds}s left`
                : 'Answers closed',
        studentViewLabel: studentViewMeta.answerStatusLabel,
        studentViewClass: studentViewMeta.tileClass
    };
}

function applyLmsLiveTimerShellClasses(shell, numberNode, model) {
    if (!shell || !numberNode || !model) return false;
    shell.classList.toggle('is-live', model.isLive);
    shell.classList.toggle('is-paused', model.isPaused);
    shell.classList.toggle('is-closed', model.isClosed);
    numberNode.classList.toggle('is-live', model.isLive);
    numberNode.classList.toggle('is-paused', model.isPaused);
    numberNode.classList.toggle('is-closed', model.isClosed);
    return true;
}

function patchLmsLiveQuizTimerUi(resourceKey) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsActiveTab('live-quiz')) return false;
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey) return false;
    const canonicalKey = context.resourceKey;
    const isStaff = canManageLmsLiveQuiz(canonicalKey);
    const session = isStaff
        ? (getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey))
        : getLmsLiveStudentSession(canonicalKey);
    if (!session || session.status !== 'live') return false;
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    if (!currentQuestion) return false;
    const questionState = String(currentQuestion.state || 'draft').toLowerCase();
    if (!['showing', 'paused', 'locked', 'revealed'].includes(questionState)) return false;
    const timeState = getLmsLiveQuestionTimeState(currentQuestion);
    const model = getLmsLiveTimerUiModel(currentQuestion, timeState);
    if (!model) return false;

    const timerRegion = contentArea.querySelector('[data-lms-live-region="timer"]');
    if (timerRegion) {
        const shell = timerRegion.querySelector('.lms-live-timer-shell');
        const numberNode = timerRegion.querySelector('.lms-live-timer-number');
        const fillNode = timerRegion.querySelector('.lms-live-timer-fill');
        if (shell && numberNode && fillNode && applyLmsLiveTimerShellClasses(shell, numberNode, model)) {
            if (model.isPaused) {
                numberNode.innerHTML = '<i class="fas fa-pause" aria-hidden="true"></i>';
            } else if (model.isClosed) {
                numberNode.innerHTML = '<i class="fas fa-lock" aria-hidden="true"></i>';
            } else {
                numberNode.textContent = String(model.remainingSeconds);
            }
            fillNode.style.setProperty('--live-progress', `${model.isClosed ? 0 : model.progress}%`);
        } else {
            patchLmsLiveQuizRegion(contentArea, 'timer', renderLmsLiveTimerMeterInner(currentQuestion, timeState));
        }
    }

    const directorTimer = contentArea.querySelector('[data-lms-live-region="director-timer"] strong');
    if (directorTimer) {
        directorTimer.textContent = model.directorTimerLabel;
    }

    const directorStudentView = contentArea.querySelector('[data-lms-live-region="director-student-view"]');
    if (directorStudentView) {
        directorStudentView.classList.remove('is-open', 'is-paused', 'is-closed');
        if (model.studentViewClass) directorStudentView.classList.add(model.studentViewClass);
        const labelNode = directorStudentView.querySelector('strong');
        if (labelNode) labelNode.textContent = model.studentViewLabel;
    }

    const stageClockPill = contentArea.querySelector('[data-lms-live-region="stage-clock-pill"]');
    if (stageClockPill) {
        stageClockPill.classList.remove('is-live', 'is-paused', 'is-locked');
        stageClockPill.classList.add(model.isPaused ? 'is-paused' : model.isLive ? 'is-live' : 'is-locked');
        const icon = '<i class="far fa-clock"></i> ';
        stageClockPill.innerHTML = `${icon}${escapeHtml(model.studentClockLabel)}`;
    }

    return true;
}

function storeLmsLiveQuizVolatileSignature(canonicalKey, signature = '') {
    if (!canonicalKey || typeof window === 'undefined') return;
    window.__lmsLiveVolatileSignatures = window.__lmsLiveVolatileSignatures || {};
    window.__lmsLiveVolatileSignatures[canonicalKey] = String(signature || '');
}

function finalizeLmsLivePodiumOverlay(resourceKey) {
    if (typeof syncLmsLivePodiumOverlay !== 'function' || !isLmsActiveTab('live-quiz')) return;
    const context = typeof resolveActiveLmsQuizContext === 'function'
        ? resolveActiveLmsQuizContext(resourceKey)
        : null;
    const canonicalKey = context?.resourceKey
        || (typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(resourceKey)
            : String(resourceKey || '').trim());
    if (!canonicalKey) return;
    syncLmsLivePodiumOverlay(canonicalKey);
}

function updateLmsLiveQuizVolatileUi(resourceKey) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsActiveTab('live-quiz')) return false;
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey) return false;
    const canonicalKey = context.resourceKey;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const volatileSignature = typeof getLmsLiveQuizVolatileSignature === 'function'
        ? getLmsLiveQuizVolatileSignature(canonicalKey)
        : '';
    patchLmsLiveQuizRegion(contentArea, 'sync', renderLmsLiveSyncNotice(workspace));
    storeLmsLiveQuizVolatileSignature(canonicalKey, volatileSignature);

    if (canManageLmsLiveQuiz(canonicalKey)) {
        const session = getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey);
        const stats = getLmsLiveSessionStats(session);
        const statusLabel = session ? (session.status === 'live' ? 'Live now' : session.status === 'ended' ? 'Ended' : 'Draft') : 'No session';
        const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(canonicalKey).sectionType || getCurrentLmsSectionType());
        const currentQuestion = getLmsLiveCurrentQuestion(session);
        patchLmsLiveQuizRegion(contentArea, 'hero-stats', `
            <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
            <span class="lms-live-pill ${session?.status === 'live' ? 'is-live' : ''}"><i class="fas fa-circle"></i> ${escapeHtml(statusLabel)}</span>
            ${session ? `<span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto shown to group</span>` : ''}
            ${renderLmsLiveParticipantPill(canonicalKey, session)}
            <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${stats.questionCount} questions</span>
        `);
        if (currentQuestion) {
            const answeredTile = contentArea.querySelector('[data-lms-live-region="director-answered"] strong');
            if (answeredTile) {
                answeredTile.textContent = `${stats.currentAnswerCount}/${stats.participants}`;
            } else {
                patchLmsLiveQuizRegion(contentArea, 'director-bar', renderLmsLiveStaffDirectorBarContent(session, canonicalKey, statusLabel));
            }
            patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRailSteps(currentQuestion));
            if (Boolean(workspace?.ui?.presentationMode)) {
                const resultsVisible = shouldShowLmsLiveBroadcastResults(session, currentQuestion, true);
                patchLmsLiveQuizRegion(
                    contentArea,
                    'broadcast-results',
                    resultsVisible
                        ? renderLmsLiveBroadcastResultsCardContent(session, currentQuestion, true)
                        : `<div class="lms-live-broadcast-results-placeholder"><i class="fas fa-chart-bar"></i><span>Reveal the question to show answer split here.</span></div>`
                );
            }
        }
        const queueSession = getLmsLiveStaffEditingSession(canonicalKey) || session;
        patchLmsLiveQuizRegion(contentArea, 'queue', renderLmsLiveStaffQueueMarkup(queueSession, canonicalKey));
        patchLmsLiveQuizRegion(contentArea, 'leaderboard', renderLmsLiveScoreList(session));
        patchLmsLiveQuizRegion(contentArea, 'breakdown', renderLmsLiveQuestionBreakdown(session, currentQuestion));
        patchLmsLiveQuizTimerUi(canonicalKey);
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
    patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRailSteps(currentQuestion));
    const clockPill = contentArea.querySelector('[data-lms-live-region="stage-clock-pill"]');
    if (!clockPill) {
        patchLmsLiveQuizRegion(contentArea, 'stage-pills', `
            <span class="lms-live-pill ${timeState?.paused ? 'is-paused' : timeState?.answerable ? 'is-live' : 'is-locked'}" data-lms-live-region="stage-clock-pill"><i class="far fa-clock"></i> ${timeState?.paused ? 'Paused' : timeState?.answerable ? `${escapeHtml(String(timeState?.remainingSeconds ?? currentQuestion.timeLimit ?? 0))}s left` : 'Answers closed'}</span>
            <span class="lms-live-pill"><i class="fas fa-user"></i> ${escapeHtml(nickname)}</span>
            ${answer ? `<span class="lms-live-pill ${answer.correct ? 'is-live' : ''}"><i class="fas ${answer.correct ? 'fa-check' : 'fa-circle'}"></i> ${answer.correct ? `+${escapeHtml(String((answer.score || 0) + (answer.streakBonus || 0)))}` : '0 pts'}</span>` : `<span class="lms-live-pill"><i class="fas fa-trophy"></i> ${LMS_LIVE_MAX_SCORE} max</span>`}
        `);
    }
    patchLmsLiveQuizRegion(contentArea, 'leaderboard', renderLmsLiveScoreList(session, 6));
    patchLmsLiveQuizTimerUi(canonicalKey);
    return true;
}

function updateLmsLiveQuizClockUi(resourceKey) {
    updateLmsLiveQuizVolatileUi(resourceKey);
    return patchLmsLiveQuizTimerUi(resourceKey);
}

function updateLmsLiveQuizSessionUi(resourceKey, hints = {}) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsActiveTab('live-quiz')) return false;
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey || !canManageLmsLiveQuiz(context.resourceKey)) return false;
    if (!contentArea.querySelector('[data-lms-live-region="session-header"]')) return false;

    const canonicalKey = context.resourceKey;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const editingSession = getLmsLiveStaffEditingSession(canonicalKey);
    const activeSessionId = workspace.ui?.activeSessionId || editingSession?.id || '';

    patchLmsLiveQuizRegion(contentArea, 'session-header',
        renderLmsLiveSessionCardHeader(canonicalKey, workspace.sessions, editingSession));
    patchLmsLiveQuizRegion(contentArea, 'session-fields',
        renderLmsLiveSessionFieldsMarkup(canonicalKey, editingSession));
    patchLmsLiveQuizRegion(contentArea, 'session-switcher',
        renderLmsLiveSessionSwitcher(canonicalKey, workspace.sessions, activeSessionId));
    patchLmsLiveQuizRegion(contentArea, 'session-actions',
        renderLmsLiveSessionActionsMarkup(canonicalKey));
    patchLmsLiveQuizRegion(contentArea, 'sync', renderLmsLiveSyncNotice(workspace));

    if (typeof window.enhanceUniversalPicker === 'function') {
        const switcher = document.getElementById(`lms-live-session-switcher-${toDomToken(canonicalKey)}`);
        if (switcher) window.enhanceUniversalPicker(switcher);
    }
    if (typeof storeLmsLiveQuizRenderFingerprint === 'function') {
        storeLmsLiveQuizRenderFingerprint(canonicalKey);
    }
    if (typeof getLmsLiveQuizVolatileSignature === 'function') {
        storeLmsLiveQuizVolatileSignature(canonicalKey, getLmsLiveQuizVolatileSignature(canonicalKey));
    }
    return true;
}

function updateLmsLiveQuizQueueUi(resourceKey, hints = {}) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsActiveTab('live-quiz')) return false;
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey || !canManageLmsLiveQuiz(context.resourceKey)) return false;
    if (!contentArea.querySelector('[data-lms-live-region="queue"]')) return false;

    const canonicalKey = context.resourceKey;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const runtimeSession = getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey);
    const queueSession = typeof getLmsLiveStaffQueueSession === 'function'
        ? getLmsLiveStaffQueueSession(canonicalKey)
        : (getLmsLiveStaffEditingSession(canonicalKey) || runtimeSession);
    const currentQuestion = getLmsLiveCurrentQuestion(runtimeSession);
    const statusLabel = runtimeSession
        ? (runtimeSession.status === 'live' ? 'Live now' : runtimeSession.status === 'ended' ? 'Ended' : 'Draft')
        : 'No session';

    patchLmsLiveQuizRegion(contentArea, 'sync', renderLmsLiveSyncNotice(workspace));
    patchLmsLiveQuizRegion(contentArea, 'queue', renderLmsLiveStaffQueueMarkup(queueSession, canonicalKey));

    if (hints.includeHeroStats !== false) {
        const stats = getLmsLiveSessionStats(runtimeSession);
        const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(canonicalKey).sectionType || getCurrentLmsSectionType());
        patchLmsLiveQuizRegion(contentArea, 'hero-stats', `
            <span class="lms-live-pill"><i class="fas ${escapeHtml(sectionMeta.icon)}"></i> ${escapeHtml(sectionMeta.label)}</span>
            <span class="lms-live-pill ${runtimeSession?.status === 'live' ? 'is-live' : ''}"><i class="fas fa-circle"></i> ${escapeHtml(statusLabel)}</span>
            ${runtimeSession ? `<span class="lms-live-pill"><i class="fas fa-broadcast-tower"></i> Auto shown to group</span>` : ''}
            ${renderLmsLiveParticipantPill(canonicalKey, runtimeSession)}
            <span class="lms-live-pill"><i class="fas fa-list-check"></i> ${stats.questionCount} questions</span>
        `);
    }

    if (hints.includeBreakdown) {
        patchLmsLiveQuizRegion(contentArea, 'breakdown', renderLmsLiveQuestionBreakdown(runtimeSession, currentQuestion));
    }

    if (hints.includeStage && contentArea.querySelector('[data-lms-live-region="stage"]')) {
        patchLmsLiveQuizRegion(contentArea, 'stage', renderLmsLiveStaffStageMarkup(runtimeSession, canonicalKey, statusLabel, {
            presentationMode: Boolean(workspace.ui.presentationMode)
        }));
    }

    if (typeof storeLmsLiveQuizQueueSignature === 'function') {
        storeLmsLiveQuizQueueSignature(canonicalKey);
    }
    if (typeof storeLmsLiveQuizBroadcastSignature === 'function') {
        storeLmsLiveQuizBroadcastSignature(canonicalKey);
    }
    if (typeof getLmsLiveQuizVolatileSignature === 'function') {
        storeLmsLiveQuizVolatileSignature(canonicalKey, getLmsLiveQuizVolatileSignature(canonicalKey));
    }
    return true;
}

function updateLmsLiveQuizBroadcastUi(resourceKey, hints = {}) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !isLmsActiveTab('live-quiz')) return false;
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey) return false;
    const canonicalKey = context.resourceKey;
    if (!canManageLmsLiveQuiz(canonicalKey)) return false;
    if (!contentArea.querySelector('[data-lms-live-region="broadcast-controls"]')) return false;

    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    const session = getLmsLiveStaffLiveSession(canonicalKey) || getLmsLiveStaffEditingSession(canonicalKey);
    const currentQuestion = getLmsLiveCurrentQuestion(session);
    if (!session || !currentQuestion) return false;

    const statusLabel = session.status === 'live' ? 'Live now' : session.status === 'ended' ? 'Ended' : 'Draft';
    const timeState = getLmsLiveQuestionTimeState(currentQuestion);
    const presentationMode = Boolean(workspace.ui.presentationMode);

    patchLmsLiveQuizRegion(contentArea, 'sync', renderLmsLiveSyncNotice(workspace));
    patchLmsLiveQuizRegion(contentArea, 'broadcast-controls',
        renderLmsLiveBroadcastControlDeckContent(canonicalKey, session, currentQuestion));
    patchLmsLiveQuizRegion(contentArea, 'status-rail', renderLmsLiveStatusRailSteps(currentQuestion));
    patchLmsLiveQuizRegion(contentArea, 'director-bar',
        renderLmsLiveStaffDirectorBarContent(session, canonicalKey, statusLabel));

    if (hints.questionSwap) {
        const questionCard = contentArea.querySelector('[data-lms-live-region="broadcast-question"]');
        if (questionCard) {
            questionCard.innerHTML = renderLmsLiveBroadcastQuestionCardInner(
                currentQuestion,
                session,
                canonicalKey,
                timeState
            );
        }
    } else {
        patchLmsLiveQuizRegion(contentArea, 'options', renderLmsLiveQuestionOptions(currentQuestion, session));
    }

    patchLmsLiveQuizTimerUi(canonicalKey);

    const resultsNode = contentArea.querySelector('[data-lms-live-region="broadcast-results"]');
    if (resultsNode && (hints.includeResults || presentationMode)) {
        const resultsVisible = shouldShowLmsLiveBroadcastResults(session, currentQuestion, presentationMode);
        resultsNode.classList.toggle('is-placeholder', !resultsVisible);
        patchLmsLiveQuizRegion(
            contentArea,
            'broadcast-results',
            resultsVisible
                ? renderLmsLiveBroadcastResultsCardContent(session, currentQuestion, presentationMode)
                : `<div class="lms-live-broadcast-results-placeholder"><i class="fas fa-chart-bar"></i><span>Reveal the question to show answer split here.</span></div>`
        );
    }

    const queueSession = getLmsLiveStaffEditingSession(canonicalKey) || session;
    patchLmsLiveQuizRegion(contentArea, 'queue', renderLmsLiveStaffQueueMarkup(queueSession, canonicalKey));
    patchLmsLiveQuizRegion(contentArea, 'breakdown', renderLmsLiveQuestionBreakdown(session, currentQuestion));
    patchLmsLiveQuizRegion(contentArea, 'leaderboard', renderLmsLiveScoreList(session));

    if (typeof storeLmsLiveQuizQueueSignature === 'function') {
        storeLmsLiveQuizQueueSignature(canonicalKey);
    }
    if (typeof storeLmsLiveQuizBroadcastSignature === 'function') {
        storeLmsLiveQuizBroadcastSignature(canonicalKey);
    }
    if (typeof getLmsLiveQuizVolatileSignature === 'function') {
        storeLmsLiveQuizVolatileSignature(canonicalKey, getLmsLiveQuizVolatileSignature(canonicalKey));
    }
    return true;
}

function refreshLmsLiveQuizUi(resourceKey, options = {}) {
    const context = resolveActiveLmsQuizContext(resourceKey);
    if (!context?.resourceKey) {
        renderLmsLiveQuizSection(resourceKey, options);
        return;
    }
    const canonicalKey = context.resourceKey;
    if (isLmsLiveSessionRemoveDialogOpen() && options.forceStructuralRender !== true) {
        if (typeof patchLmsLiveQuizTimerUi === 'function') {
            patchLmsLiveQuizTimerUi(canonicalKey);
        }
        return;
    }
    if (options.forceStructuralRender === true) {
        renderLmsLiveQuizSection(canonicalKey, options);
        return;
    }
    const layoutFingerprint = typeof getLmsLiveQuizLayoutFingerprint === 'function'
        ? getLmsLiveQuizLayoutFingerprint(canonicalKey)
        : (typeof getLmsLiveQuizStructuralFingerprint === 'function'
            ? getLmsLiveQuizStructuralFingerprint(canonicalKey)
            : '');
    const queueSignature = typeof getLmsLiveQuizQueueSignature === 'function'
        ? getLmsLiveQuizQueueSignature(canonicalKey)
        : '';
    const broadcastSignature = typeof getLmsLiveQuizBroadcastSignature === 'function'
        ? getLmsLiveQuizBroadcastSignature(canonicalKey)
        : '';
    const volatileSignature = typeof getLmsLiveQuizVolatileSignature === 'function'
        ? getLmsLiveQuizVolatileSignature(canonicalKey)
        : '';
    const previousLayout = window.__lmsLiveRenderFingerprints?.[canonicalKey] || '';
    const previousQueue = window.__lmsLiveQueueSignatures?.[canonicalKey] || '';
    const previousBroadcast = window.__lmsLiveBroadcastSignatures?.[canonicalKey] || '';
    const previousVolatile = window.__lmsLiveVolatileSignatures?.[canonicalKey] || '';
    const forceBroadcastPatch = options.forceBroadcastPatch === true;
    const forceQueuePatch = options.forceQueuePatch === true;
    if (!options.forceStructuralRender && !forceBroadcastPatch && !forceQueuePatch && isLmsLiveQuizDraftEditorActive()) {
        const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
        workspace.ui.deferredRender = true;
        patchLmsLiveQuizTimerUi(canonicalKey);
        storeLmsLiveQuizVolatileSignature(canonicalKey, volatileSignature);
        return;
    }
    if (layoutFingerprint && layoutFingerprint === previousLayout) {
        const broadcastChanged = broadcastSignature !== previousBroadcast;
        const queueChanged = queueSignature !== previousQueue;
        const volatileChanged = volatileSignature !== previousVolatile;
        const patchHints = {
            ...(options.queuePatchHints || {}),
            ...(options.broadcastPatchHints || {})
        };
        let broadcastPatchApplied = false;
        let queuePatchApplied = false;
        if (broadcastChanged || forceBroadcastPatch) {
            broadcastPatchApplied = updateLmsLiveQuizBroadcastUi(
                canonicalKey,
                options.broadcastPatchHints || patchHints
            );
        }
        if (queueChanged || forceQueuePatch) {
            queuePatchApplied = updateLmsLiveQuizQueueUi(
                canonicalKey,
                options.queuePatchHints || patchHints
            );
        }
        if (volatileChanged) {
            updateLmsLiveQuizVolatileUi(canonicalKey);
        }
        const forcedPatchNeeded = forceQueuePatch || forceBroadcastPatch;
        const forcedPatchApplied = (!forceQueuePatch || queuePatchApplied)
            && (!forceBroadcastPatch || broadcastPatchApplied);
        if (forcedPatchNeeded && !forcedPatchApplied) {
            renderLmsLiveQuizSection(canonicalKey, { skipLoad: true, forceStructuralRender: true });
            return;
        }
        finalizeLmsLivePodiumOverlay(canonicalKey);
        if (broadcastPatchApplied || queuePatchApplied || volatileChanged) return;
        return;
    }
    if (typeof storeLmsLiveQuizBroadcastSignature === 'function') {
        storeLmsLiveQuizBroadcastSignature(canonicalKey, broadcastSignature);
    }
    if (typeof storeLmsLiveQuizQueueSignature === 'function') {
        storeLmsLiveQuizQueueSignature(canonicalKey, queueSignature);
    }
    storeLmsLiveQuizVolatileSignature(canonicalKey, volatileSignature);
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
    const queueSession = typeof getLmsLiveStaffQueueSession === 'function'
        ? getLmsLiveStaffQueueSession(resourceKey)
        : editingSession;
    const runtimeSession = getLmsLiveStaffLiveSession(resourceKey) || editingSession;
    const sectionMeta = getLmsSectionMeta(parseLmsCourseKey(resourceKey).sectionType || getCurrentLmsSectionType());
    const stats = getLmsLiveSessionStats(runtimeSession);
    const currentQuestion = getLmsLiveCurrentQuestion(runtimeSession);
    const statusLabel = runtimeSession
        ? (runtimeSession.status === 'live' ? 'Live now' : runtimeSession.status === 'ended' ? 'Ended' : 'Draft')
        : 'No session';
    const questionCards = renderLmsLiveStaffQueueMarkup(queueSession || editingSession, resourceKey);
    const stage = renderLmsLiveStaffStageMarkup(runtimeSession, resourceKey, statusLabel, {
        presentationMode: Boolean(workspace.ui.presentationMode)
    });

    if (workspace.ui.presentationMode) {
        return `
            <div class="lms-live-shell lms-live-presentation">
                <section class="lms-live-hero">
                    <div>
                        <div class="lms-live-kicker"><i class="fas fa-display"></i> Presentation mode</div>
                        <div class="lms-live-title">${escapeHtml(runtimeSession?.title || 'Live Quiz')}</div>
                    <div class="lms-live-copy">${escapeHtml(context.subject?.name || context.courseId || 'Subject')} - live broadcast for enrolled students</div>
                    </div>
                    <button type="button" class="lux-secondary-btn" data-lms-click="toggleLmsLivePresentationMode(${lmsInlineArg(resourceKey)})"><i class="fas fa-compress"></i> Exit</button>
                </section>
                <section class="lms-live-layout">
                    <div class="lms-live-panel" data-lms-live-region="stage">${stage}</div>
                    <aside class="lms-live-side-stack">
                        <div class="lms-live-card home-hover-chip">
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
                                ${runtimeSession ? `<button type="button" class="lux-secondary-btn" data-lms-click="toggleLmsLivePresentationMode(${lmsInlineArg(resourceKey)})"><i class="fas fa-display"></i> Present</button>` : ''}
                                ${runtimeSession ? renderLmsLivePodiumQueueButton(resourceKey, runtimeSession) : ''}
                                ${runtimeSession ? `<button type="button" class="lux-secondary-btn" data-lms-click="exportLmsLiveQuizCsv(${lmsInlineArg(resourceKey)})"><i class="fas fa-file-export"></i> Export</button>` : ''}
                                ${runtimeSession && runtimeSession.status !== 'ended' ? `<button type="button" class="lux-secondary-btn" data-lms-click="endLmsLiveSession(${lmsInlineArg(resourceKey)})"><i class="fas fa-stop"></i> End</button>` : ''}
                                ${runtimeSession ? `<button type="button" class="lux-secondary-btn" data-lms-click="clearLmsLiveAnswers(${lmsInlineArg(resourceKey)})"><i class="fas fa-rotate"></i> Clear answers</button>` : ''}
                            </div>
                        </div>
                        <div class="lms-live-question-list lms-live-queue-list" data-lms-live-region="queue">${questionCards}</div>
                    </div>
                </div>
                <aside class="lms-live-side-stack">
                    ${renderLmsLiveRosterPanel(resourceKey, runtimeSession)}
                    <div class="lms-live-card home-hover-chip">
                        <div data-lms-live-region="session-header">${renderLmsLiveSessionCardHeader(resourceKey, workspace.sessions, editingSession)}</div>
                        <div class="lms-live-form-grid lms-live-form-grid-mt-12">
                            <div data-lms-live-region="session-fields">${renderLmsLiveSessionFieldsMarkup(resourceKey, editingSession)}</div>
                            <div data-lms-live-region="session-switcher">${renderLmsLiveSessionSwitcher(resourceKey, workspace.sessions, workspace.ui?.activeSessionId || editingSession?.id || '')}</div>
                            <div data-lms-live-region="session-actions">${renderLmsLiveSessionActionsMarkup(resourceKey)}</div>
                        </div>
                    </div>
                    <div class="lms-live-card home-hover-chip">
                        <div class="lms-live-label">Add question</div>
                        <div class="lms-live-form-grid lms-live-form-grid-mt-12">
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Question</span>
                                <textarea id="lms-live-question-${escapeHtml(token)}" class="lms-route-textarea lux-control" rows="3" placeholder="Ask one clear question from the current topic"></textarea>
                            </label>
                            <div class="lms-live-form-grid two">
                                ${LMS_LIVE_OPTION_KEYS.map((key, index) => `
                                    <label class="lms-route-field">
                                        <span class="lms-route-field-label">Option ${escapeHtml(key)}</span>
                                        <input id="lms-live-option-${index}-${escapeHtml(token)}" class="lms-route-input lux-control" type="text" placeholder="Answer ${escapeHtml(key)}">
                                    </label>
                                `).join('')}
                            </div>
                            <div class="lms-live-form-grid two">
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Correct answer</span>
                                    <select id="lms-live-correct-${escapeHtml(token)}" class="lms-route-select lux-control">
                                        ${LMS_LIVE_OPTION_KEYS.map((key, index) => `<option value="${index}">${escapeHtml(key)}</option>`).join('')}
                                    </select>
                                </label>
                                <label class="lms-route-field">
                                    <span class="lms-route-field-label">Timer seconds</span>
                                    <input id="lms-live-timer-${escapeHtml(token)}" class="lms-route-input lux-control" type="number" min="10" max="180" value="45">
                                </label>
                            </div>
                            <label class="lms-route-field">
                                <span class="lms-route-field-label">Topic label</span>
                                <input id="lms-live-question-topic-${escapeHtml(token)}" class="lms-route-input lux-control" type="text" placeholder="Optional">
                            </label>
                            <button type="button" class="lux-primary-btn" data-lms-click="addLmsLiveQuestion(${lmsInlineArg(resourceKey)})"><i class="fas fa-plus"></i> Add question</button>
                        </div>
                    </div>
                    <div class="lms-live-card home-hover-chip">
                        <div class="lms-live-label">Import questions</div>
                        <div class="lms-live-copy">One line per question: Question | A | B | C | D | correct letter | seconds</div>
                        <textarea id="lms-live-import-${escapeHtml(token)}" class="lms-route-textarea lux-control" rows="5" placeholder="What is 2+2? | 3 | 4 | 5 | 6 | B | 30"></textarea>
                        <button type="button" class="lux-secondary-btn lms-live-import-btn-mt-10" data-lms-click="importLmsLiveQuestionsFromText(${lmsInlineArg(resourceKey)})"><i class="fas fa-file-import"></i> Import</button>
                    </div>
                    <div class="lms-live-card home-hover-chip">
                        <div class="lms-live-label">Leaderboard</div>
                        <div class="lms-live-score-list lms-live-score-list-mt-12" data-lms-live-region="leaderboard">${renderLmsLiveScoreList(runtimeSession)}</div>
                    </div>
                    <div class="lms-live-card home-hover-chip">
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
            <div class="lms-live-card home-hover-chip lms-live-sync-card is-syncing">
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
    if (typeof storeLmsLiveQuizBroadcastSignature === 'function') {
        storeLmsLiveQuizBroadcastSignature(context.resourceKey);
    }
    if (typeof storeLmsLiveQuizQueueSignature === 'function') {
        storeLmsLiveQuizQueueSignature(context.resourceKey);
    }
    if (typeof getLmsLiveQuizVolatileSignature === 'function') {
        storeLmsLiveQuizVolatileSignature(
            context.resourceKey,
            getLmsLiveQuizVolatileSignature(context.resourceKey)
        );
    }
    patchLmsLiveQuizTimerUi(context.resourceKey);
    scheduleLmsLiveClockRefresh(context.resourceKey);
    if (typeof bindLmsLiveQuizFocusRefresh === 'function') {
        bindLmsLiveQuizFocusRefresh();
    }
    if (typeof window.syncLmsTabRenderCacheFromDom === 'function') {
        const sectionType = typeof getCurrentLmsSectionType === 'function' ? getCurrentLmsSectionType() : '';
        const courseKey = typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('live-quiz') : context.resourceKey;
        window.syncLmsTabRenderCacheFromDom('live-quiz', courseKey, sectionType);
    }
    finalizeLmsLivePodiumOverlay(context.resourceKey);
    if (canManageLmsLiveQuiz(context.resourceKey) && typeof window.enhanceUniversalPicker === 'function') {
        const switcher = document.getElementById(`lms-live-session-switcher-${toDomToken(context.resourceKey)}`);
        if (switcher) window.enhanceUniversalPicker(switcher);
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
        updateLmsLiveQuizVolatileUi,
        updateLmsLiveQuizBroadcastUi,
        updateLmsLiveQuizQueueUi,
        updateLmsLiveQuizSessionUi,
        patchLmsLiveQuizTimerUi,
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
        deleteLmsLiveSession,
        setLmsLiveActiveSession,
        updateLmsLiveSessionField,
        saveLmsLiveSessionDetails,
        openLmsLiveSessionRemoveDialog,
        advanceLmsLiveSessionRemoveDialog,
        confirmLmsLiveSessionRemove,
        closeLmsLiveSessionRemoveDialog,
        toggleLmsLivePresentationMode,
        revealLmsLiveQuizPodium,
        dismissLmsLiveQuizPodium,
        answerLmsLiveQuestion,
        seedLmsLiveQuizRoster
    });
}
