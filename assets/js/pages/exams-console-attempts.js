(function initExamConsoleAttemptsModule() {
    if (window.__KIU_EXAMS_ATTEMPTS_MODULE_LOADED) return;
    window.__KIU_EXAMS_ATTEMPTS_MODULE_LOADED = true;

    const hooks = window.__kiuExamsAttemptsHooks || {};
    const {
        runtime,
        MANUAL_TYPES,
        getSessionById,
        getLiveSessions,
        getResultSessions,
        loadAttemptsForSession,
        getAttemptStore,
        getAttemptsForSession,
        getAttemptStudentId,
        getAssignedStudents,
        getSelectedSessionStatus,
        getSessionRoomLabel,
        getSessionObserverNames,
        buildSessionActivity,
        deriveAttemptState,
        escapeHtml,
        formatDateTime,
        uniqueStrings,
        toFieldToken
    } = hooks;

    if (
        !runtime
        || !(MANUAL_TYPES instanceof Set)
        || typeof getSessionById !== 'function'
        || typeof getLiveSessions !== 'function'
        || typeof getResultSessions !== 'function'
        || typeof loadAttemptsForSession !== 'function'
        || typeof getAttemptStore !== 'function'
        || typeof getAttemptsForSession !== 'function'
        || typeof getAttemptStudentId !== 'function'
        || typeof getAssignedStudents !== 'function'
        || typeof getSelectedSessionStatus !== 'function'
        || typeof getSessionRoomLabel !== 'function'
        || typeof getSessionObserverNames !== 'function'
        || typeof buildSessionActivity !== 'function'
        || typeof deriveAttemptState !== 'function'
        || typeof escapeHtml !== 'function'
        || typeof formatDateTime !== 'function'
        || typeof uniqueStrings !== 'function'
        || typeof toFieldToken !== 'function'
    ) {
        throw new Error('Exams attempts hooks are unavailable.');
    }

    function renderManualGradeCell(session, student, attempt) {
        const manualResults = Array.isArray(attempt.questionResults)
            ? attempt.questionResults.filter((result) => MANUAL_TYPES.has(String(result?.type || '').trim()))
            : [];
        const hasManualQuestions = manualResults.length > 0 || (session.questionsSnapshot || session.questions || []).some((question) => MANUAL_TYPES.has(String(question?.type || '').trim()));
        if (!hasManualQuestions) {
            return `<div class="ex2-muted">Auto-graded session</div>`;
        }
        const key = `${session.id}::${student.id}`;
        if (manualResults.length) {
            return `
                <div class="ex2-manual-stack">
                    ${manualResults.map((result, index) => {
                        const questionId = String(result.questionId || `manual_${index + 1}`);
                        const fieldKey = `${key}::${questionId}`;
                        const maxScore = Number(result.manualMax || result.maxScore || 0);
                        const currentValue = runtime.manualScoreDrafts[fieldKey] == null
                            ? String(result.manualScoreAwarded ?? result.scoreAwarded ?? 0)
                            : String(runtime.manualScoreDrafts[fieldKey]);
                        return `
                            <label class="ex2-manual-score-row">
                                <span>Q${escapeHtml(String(index + 1))} / ${escapeHtml(String(maxScore))}</span>
                                <input id="exam-manual-grade-${escapeHtml(toFieldToken(session.id))}-${escapeHtml(toFieldToken(student.id))}-${escapeHtml(toFieldToken(questionId))}" name="exam_manual_grade_${escapeHtml(toFieldToken(session.id))}_${escapeHtml(toFieldToken(student.id))}_${escapeHtml(toFieldToken(questionId))}" class="ex2-input is-small" type="number" min="0" max="${escapeHtml(String(maxScore))}" value="${escapeHtml(currentValue)}" data-exam-input-call="updateExamManualGradeDraft" data-exam-input-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}","${escapeHtml(questionId)}","$value"]'>
                            </label>
                        `;
                    }).join('')}
                    <button type="button" class="ex2-btn is-primary" data-exam-call="saveExamManualGrade" data-exam-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}"]'>Save review</button>
                </div>
            `;
        }
        const currentValue = runtime.manualScoreDrafts[key] == null
            ? String(attempt.manualScoreRaw ?? 0)
            : String(runtime.manualScoreDrafts[key]);
        return `
            <div class="ex2-inline-actions">
                <input id="exam-manual-grade-${escapeHtml(toFieldToken(session.id))}-${escapeHtml(toFieldToken(student.id))}" name="exam_manual_grade_${escapeHtml(toFieldToken(session.id))}_${escapeHtml(toFieldToken(student.id))}" class="ex2-input is-small" type="number" min="0" value="${escapeHtml(currentValue)}" data-exam-input-call="updateExamManualGradeDraft" data-exam-input-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}","","$value"]'>
                <button type="button" class="ex2-btn is-primary" data-exam-call="saveExamManualGrade" data-exam-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}"]'>Save grade</button>
            </div>
        `;
    }

    function renderAttemptRows(session, mode) {
        const attempts = getAttemptsForSession(session.id);
        const byStudentId = new Map(attempts.map((entry) => [getAttemptStudentId(entry), entry]));
        return getAssignedStudents(session).map((student) => {
            const entry = byStudentId.get(student.id) || { student, attempt: { status: 'not-started', warningCount: 0, blocked: false } };
            const attempt = entry.attempt || {};
            const state = deriveAttemptState(entry);
            const warningCount = Number(attempt.warningCount || 0);
            return `
                <article class="ex2-attempt-row">
                    <div class="ex2-attempt-main">
                        <div>
                            <strong>${escapeHtml(student.name || student.id)}</strong>
                            <span>${escapeHtml(student.id)} Â· ${escapeHtml(uniqueStrings(student.groupNames || []).join(', ') || student.facultyLabel || student.facultyCode)}</span>
                        </div>
                        <div class="ex2-attempt-meta">
                            <span class="ex2-status is-${escapeHtml(state)}">${escapeHtml(state.replace(/_/g, ' '))}</span>
                            <span>${escapeHtml(String(warningCount))} warnings</span>
                            <span>${escapeHtml(String(attempt.clientType || 'desktop-app'))}</span>
                        </div>
                    </div>
                    ${mode === 'live' ? `
                        <div class="ex2-inline-actions">
                            <button type="button" class="ex2-btn is-ghost" data-exam-call="runExamStudentAction" data-exam-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}","${attempt.blocked ? 'unblock' : 'block'}"]'>${attempt.blocked ? 'Unblock' : 'Block'}</button>
                            <button type="button" class="ex2-btn is-ghost" data-exam-call="runExamStudentAction" data-exam-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}","reset-warnings"]'>Reset warnings</button>
                            <button type="button" class="ex2-btn is-secondary" data-exam-call="runExamStudentAction" data-exam-args='["${escapeHtml(session.id)}","${escapeHtml(student.id)}","force-submit"]'>Force submit</button>
                        </div>
                    ` : `
                        <div class="ex2-results-row">
                            <div class="ex2-results-meta">
                                <span>Auto ${escapeHtml(String(attempt.autoScoreRaw ?? 0))}</span>
                                <span>Manual ${escapeHtml(String(attempt.manualScoreRaw ?? 0))}</span>
                                <span>Final ${escapeHtml(String(attempt.finalScoreRaw ?? '-'))}</span>
                            </div>
                            ${renderManualGradeCell(session, student, attempt)}
                        </div>
                    `}
                    ${mode !== 'live' && attempt.responseSummary ? `
                        <div class="ex2-response-summary">
                            ${escapeHtml(String(attempt.responseSummary.answeredQuestions || 0))}/${escapeHtml(String(attempt.responseSummary.totalQuestions || 0))} answered Â· ${escapeHtml(String(attempt.responseSummary.writtenQuestions || 0))} manual responses
                        </div>
                    ` : ''}
                </article>
            `;
        }).join('');
    }

    window.renderExamLiveTab = function renderExamLiveTab() {
        const sessions = getLiveSessions();
        const selectedSession = getSessionById(runtime.selectedSessionId) || sessions[0] || null;
        if (selectedSession && runtime.selectedSessionId !== selectedSession.id) runtime.selectedSessionId = selectedSession.id;
        if (selectedSession) loadAttemptsForSession(selectedSession.id).catch(() => null);
        const attemptsStore = selectedSession ? getAttemptStore(selectedSession.id) : null;
        const activity = selectedSession ? buildSessionActivity(selectedSession) : null;
        return `
            <div class="ex2-two-col">
                <section class="ex2-panel">
                    <div class="ex2-panel-head">
                        <div>
                            <h2>Live Monitoring</h2>
                            <p>Track attendance, warnings, active computers, and submission state without leaving the exam board.</p>
                        </div>
                    </div>
                    <div class="ex2-list">
                        ${sessions.length ? sessions.map((session) => `
                            <button type="button" class="ex2-select-card${selectedSession?.id === session.id ? ' is-selected' : ''}" data-exam-call="selectExamSession" data-exam-args='["${escapeHtml(session.id)}","live"]'>
                                <div>
                                    <strong>${escapeHtml(session.subjectName || session.title || 'Exam')}</strong>
                                    <span>${escapeHtml(formatDateTime(session.startAt))}</span>
                                </div>
                                <div>${escapeHtml(getSelectedSessionStatus(session))}</div>
                            </button>
                        `).join('') : `<div class="ex2-empty">No scheduled or live exam sessions are available.</div>`}
                    </div>
                </section>
                <section class="ex2-panel">
                    ${selectedSession ? `
                        <div class="ex2-panel-head">
                            <div>
                                <h2>${escapeHtml(selectedSession.subjectName || selectedSession.title || 'Exam session')}</h2>
                                <p>${escapeHtml(getSessionRoomLabel(selectedSession))} Â· ${escapeHtml(getSessionObserverNames(selectedSession).join(', ') || 'Observers pending')}</p>
                            </div>
                            <button type="button" class="ex2-btn is-ghost" data-exam-call="refreshExamAttempts" data-exam-args='["${escapeHtml(selectedSession.id)}"]'><i class="fas fa-rotate"></i> Refresh</button>
                        </div>
                        ${activity ? `
                            <div class="ex2-mini-grid">
                                <div><strong>${escapeHtml(String(activity.not_started))}</strong><span>Not started</span></div>
                                <div><strong>${escapeHtml(String(activity.checked_in))}</strong><span>Checked in</span></div>
                                <div><strong>${escapeHtml(String(activity.in_progress))}</strong><span>In progress</span></div>
                                <div><strong>${escapeHtml(String(activity.submitted))}</strong><span>Submitted</span></div>
                                <div><strong>${escapeHtml(String(activity.flagged))}</strong><span>Flagged</span></div>
                            </div>
                        ` : ''}
                        ${attemptsStore?.loading ? `<div class="ex2-empty">Loading attempt activity...</div>` : ''}
                        ${attemptsStore?.error ? `<div class="ex2-warning"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(attemptsStore.error)}</div>` : ''}
                        <div class="ex2-attempt-list">
                            ${renderAttemptRows(selectedSession, 'live')}
                        </div>
                    ` : `<div class="ex2-empty">Choose a session to inspect live activity.</div>`}
                </section>
            </div>
        `;
    };

    window.renderExamResultsTab = function renderExamResultsTab() {
        const sessions = getResultSessions();
        const selectedSession = getSessionById(runtime.selectedSessionId) || sessions[0] || null;
        if (selectedSession && runtime.selectedSessionId !== selectedSession.id) runtime.selectedSessionId = selectedSession.id;
        if (selectedSession) loadAttemptsForSession(selectedSession.id).catch(() => null);
        const attemptsStore = selectedSession ? getAttemptStore(selectedSession.id) : null;
        return `
            <div class="ex2-two-col">
                <section class="ex2-panel">
                    <div class="ex2-panel-head">
                        <div>
                            <h2>Results Queue</h2>
                            <p>Objective scores appear immediately. Manual answers stay here until staff finalizes grading.</p>
                        </div>
                    </div>
                    <div class="ex2-list">
                        ${sessions.length ? sessions.map((session) => `
                            <button type="button" class="ex2-select-card${selectedSession?.id === session.id ? ' is-selected' : ''}" data-exam-call="selectExamSession" data-exam-args='["${escapeHtml(session.id)}","results"]'>
                                <div>
                                    <strong>${escapeHtml(session.subjectName || session.title || 'Exam')}</strong>
                                    <span>${escapeHtml(formatDateTime(session.startAt))}</span>
                                </div>
                                <div>${escapeHtml(getSelectedSessionStatus(session))}</div>
                            </button>
                        `).join('') : `<div class="ex2-empty">No completed or live sessions are available for grading yet.</div>`}
                    </div>
                </section>
                <section class="ex2-panel">
                    ${selectedSession ? `
                        <div class="ex2-panel-head">
                            <div>
                                <h2>${escapeHtml(selectedSession.subjectName || selectedSession.title || 'Results')}</h2>
                                <p>${escapeHtml(selectedSession.variantLabel || 'Variant')} Â· ${escapeHtml(getSessionObserverNames(selectedSession).join(', ') || 'Observers pending')}</p>
                            </div>
                            <button type="button" class="ex2-btn is-ghost" data-exam-call="refreshExamAttempts" data-exam-args='["${escapeHtml(selectedSession.id)}"]'><i class="fas fa-rotate"></i> Refresh</button>
                        </div>
                        ${attemptsStore?.loading ? `<div class="ex2-empty">Loading graded attempts...</div>` : ''}
                        ${attemptsStore?.error ? `<div class="ex2-warning"><i class="fas fa-triangle-exclamation"></i> ${escapeHtml(attemptsStore.error)}</div>` : ''}
                        <div class="ex2-attempt-list">
                            ${renderAttemptRows(selectedSession, 'results')}
                        </div>
                    ` : `<div class="ex2-empty">Choose a session to review scores and manual answers.</div>`}
                </section>
            </div>
        `;
    };
})();
