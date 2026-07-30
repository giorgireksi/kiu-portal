/* LMS quiz review panel/paper markup. Peeled from lms-quiz-workspace-runtime.js.
 * Load before lms-quiz-workspace-runtime.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LMS_QUIZ_WORKSPACE_REVIEW_LOADED) return;
    window.__KIU_LMS_QUIZ_WORKSPACE_REVIEW_LOADED = true;

    window.__kiuCreateLmsQuizWorkspaceReviewApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function renderLmsQuizReviewPanel(resourceKey, quiz) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const examSession = syncLmsExamSessionLifecycle(quiz);
    const parsed = parseLmsCourseKey(resourceKey);
    const students = parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : [];
    if (!students.length) {
        return '<div class="lms-quiz-board-empty lms-quiz-review-empty">No enrolled students were found for this group yet.</div>';
    }
    if (isLmsQuizBlueExamRequired(quiz)) {
        ensureKiuBlueStatusSoon();
    }
    const quizStats = getLmsQuizSubmissionStats(resourceKey, quiz);
    const sessionStats = examSession ? getLmsExamSessionMonitorStats(examSession, resourceKey, quiz) : null;
    const reviewSummaryCards = `
        <div class="lms-quiz-review-summary-grid">
            <div class="lms-route-card lms-route-panel-compact lms-quiz-review-summary-card">
                <div class="lms-route-kv-label">Pending review</div>
                <div class="lms-route-card-title lms-route-card-title-16 lms-route-copy-mt-6">${escapeHtml(String(quizStats.pendingReviewCount || 0))}</div>
                <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">Submitted or auto-submitted quiz papers waiting for TA or professor action.</div>
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-quiz-review-summary-card">
                <div class="lms-route-kv-label">Graded</div>
                <div class="lms-route-card-title lms-route-card-title-16 lms-route-copy-mt-6">${escapeHtml(String(quizStats.gradedCount || 0))}</div>
                <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">Reviews already saved back into the LMS grade flow for this quiz.</div>
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-quiz-review-summary-card">
                <div class="lms-route-kv-label">Live alerts</div>
                <div class="lms-route-card-title lms-route-card-title-16 lms-route-copy-mt-6">${escapeHtml(String(quizStats.alertCount || 0))}</div>
                <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${quizStats.alertCount ? `${escapeHtml(String(quizStats.alertedStudents || 0))} student${Number(quizStats.alertedStudents || 0) === 1 ? '' : 's'} affected` : 'No monitoring warnings are currently open for this quiz.'}</div>
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-quiz-review-summary-card">
                <div class="lms-route-kv-label">${examSession ? 'Exam session' : 'Roster size'}</div>
                <div class="lms-route-card-title lms-route-card-title-16 lms-route-copy-mt-6">${escapeHtml(String(examSession ? examSession.status : students.length))}</div>
                <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${examSession ? `${sessionStats.allowedCount} approved  -  ${sessionStats.presentCount} present  -  ${sessionStats.blockedCount} blocked` : `${students.length} enrolled student${students.length === 1 ? '' : 's'} visible in this review board.`}</div>
            </div>
        </div>
    `;

    const rows = students.map(student => {
        const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, student);
        syncLmsQuizSubmissionVariant(quiz, submission, student.id);
        syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, student);
        syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, student);
        const status = submission.status && submission.status !== 'not-started' ? submission.status : 'draft';
        const badge = getLmsQuizStatusBadge(status);
        const badgeToneClass = getLmsQuizStatusToneClass(status);
        const accessAllowed = isStudentAllowedForLmsQuiz(resourceKey, quiz, student.id);
        const latestProctorEvent = getLmsQuizLatestProctorEvent(submission);
        const alertCount = getLmsQuizProctorAlertCount(submission);
        const blocked = submission.sessionBlocked === true;
        return `
            <tr>
                <td class="lms-quiz-review-student-id">${escapeHtml(student.id)}</td>
                <td class="lms-quiz-review-student-name">${escapeHtml(student.name)}</td>
                <td>${submission.variantLabel ? `<span class="lms-quiz-review-variant-pill home-hover-chip">${escapeHtml(submission.variantLabel)}</span>` : '<span class="lms-quiz-review-variant-empty">Standard</span>'}</td>
                <td><span class="lms-quiz-review-access-pill home-hover-chip ${accessAllowed ? 'is-allowed' : 'is-blocked'}">${accessAllowed ? 'Allowed' : 'Blocked'}</span></td>
                <td>${examSession
                    ? `<div class="lms-quiz-review-approval-stack"><span class="lms-quiz-review-approval-pill home-hover-chip ${blocked ? 'is-blocked' : 'is-approved'}">${blocked ? 'Blocked by staff' : 'Approved roster'}</span><span class="lms-quiz-review-attendance-meta">Handwritten room check is handled outside the portal.</span></div>`
                    : `<select data-lms-change="setLmsQuizAttendanceStatus(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)}, this.value)" class="lms-quiz-review-attendance-select">
                        <option value="" ${!submission.attendanceStatus ? 'selected' : ''}>Not checked</option>
                        <option value="Present" ${submission.attendanceStatus === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Late" ${submission.attendanceStatus === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Absent" ${submission.attendanceStatus === 'Absent' ? 'selected' : ''}>Absent</option>
                    </select>
                    <div class="lms-quiz-review-attendance-meta">${submission.attendanceVerifiedAt ? `Verified ${escapeHtml(formatLmsDateTime(submission.attendanceVerifiedAt))}` : 'Waiting for attendance check'}</div>`}
                </td>
                <td><span class="lms-quiz-review-status-pill home-hover-chip ${badgeToneClass}">${escapeHtml(badge.label)}</span></td>
                <td class="lms-quiz-review-student-id">
                    <div class="lms-quiz-review-monitor-stack">
                        <span class="lms-quiz-review-monitor-pill home-hover-chip ${alertCount ? 'is-warning' : 'is-clean'}">${alertCount ? `${alertCount} warning${alertCount === 1 ? '' : 's'}` : 'Clean'}</span>
                        <span class="lms-quiz-review-monitor-meta">${latestProctorEvent ? `${latestProctorEvent.note}  -  ${formatLmsDateTime(latestProctorEvent.createdAt)}` : 'No suspicious events logged.'}</span>
                        <span class="lms-quiz-review-monitor-meta">Outside actions: ${Number(submission.outsideActionCount || 0)}</span>
                    </div>
                </td>
                <td class="lms-quiz-review-raw-score">${Number(submission.finalScoreRaw ?? submission.autoScoreRaw ?? 0)} / ${getAdminQuizTotalScore({ ...quiz, questions: getLmsQuizQuestionsForStudent(quiz, student.id, submission) })}</td>
                <td class="lms-quiz-review-gradebook-score">${submission.gradebookScore === null || submission.gradebookScore === undefined ? '-' : Number(submission.gradebookScore)}</td>
                <td class="lms-quiz-review-actions">
                    <div class="lms-quiz-review-action-row">
                        ${examSession ? `<button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-quiz-review-action-btn ${blocked ? 'is-approved' : 'is-danger'}" data-lms-click="toggleLmsExamSessionStudentBlock(${jsQuote(examSession.id)}, ${jsQuote(student.id)})"><i class="fas ${blocked ? 'fa-unlock' : 'fa-user-slash'}"></i> ${blocked ? 'Unblock' : 'Block'}</button>` : ''}
                        <button type="button" class="lux-secondary-btn lms-quiz-action-btn is-compact lms-quiz-review-action-btn" data-lms-click="openLmsQuizReviewModal(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)})"><i class="fas fa-eye"></i> View Quiz Paper</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        ${reviewSummaryCards}
        ${quizStats.alertCount > 0 ? `<div class="lms-quiz-review-summary-notice is-warning">
            <div class="lms-quiz-review-summary-title">${quizStats.alertCount} live warning${quizStats.alertCount === 1 ? '' : 's'} detected across ${quizStats.alertedStudents} student${quizStats.alertedStudents === 1 ? '' : 's'}.</div>
            ${quizStats.latestAlert ? `<div class="lms-quiz-review-summary-copy">Latest: ${escapeHtml(quizStats.latestAlert.note || quizStats.latestAlert.type || 'Monitoring event')}  -  ${escapeHtml(formatLmsDateTime(quizStats.latestAlert.createdAt))}</div>` : ''}
        </div>` : ''}
        ${examSession ? `<div class="lms-quiz-review-summary-notice ${examSession.status === 'live' ? 'is-success' : examSession.status === 'closed' ? 'is-danger' : 'is-info'}">
            <div class="lms-quiz-review-summary-title">KIU Wired Lab Exam Session: ${escapeHtml(examSession.status)}</div>
            <div class="lms-quiz-review-summary-copy">${sessionStats.allowedCount} roster students  -  ${sessionStats.presentCount} approved accounts  -  ${sessionStats.blockedCount} blocked  -  ${sessionStats.inProgressCount} running  -  ${sessionStats.submittedCount} submitted</div>
        </div>` : ''}
        <div class="lms-quiz-review-table-shell">
            <div class="lms-quiz-review-table-head">Student submissions and attendance</div>
            <div class="lms-quiz-review-table-wrap">
                <table class="kiu-table lms-quiz-review-table">
                    <thead>
                        <tr>
                            <th class="lms-quiz-review-th-left">ID</th>
                            <th class="lms-quiz-review-th-left">Student</th>
                            <th>Variant</th>
                            <th>Access</th>
                            <th>${examSession ? 'Approval' : 'Attendance'}</th>
                            <th>Status</th>
                            <th class="lms-quiz-review-th-left">Monitoring</th>
                            <th>Raw Score</th>
                            <th>Gradebook</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>
    `;
}

function buildLmsQuizReviewPaperMarkup(resourceKey, quizId, studentId, options = {}) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) {
        return '<div class="lms-quiz-card-empty">Quiz paper could not be found.</div>';
    }
    const parsed = parseLmsCourseKey(resourceKey);
    const student = (parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : []).find(item => String(item.id) === String(studentId))
        || { id: studentId, name: `Student ${studentId}` };
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, student);
    syncLmsQuizSubmissionVariant(quiz, submission, student.id);
    const examSession = getLmsQuizExamSession(quiz);
    syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, student);
    syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, student);
    const activeQuestions = getLmsQuizQuestionsForStudent(quiz, student.id, submission);
    const variantQuiz = { ...quiz, questions: activeQuestions };
    const manualMax = getLmsQuizManualMax(variantQuiz);
    const proctorEvents = Array.isArray(submission.proctorEvents) ? [...submission.proctorEvents].reverse() : [];
    const blueGate = getLmsQuizBlueGateStatus(resourceKey, quiz, submission, student.id);
    const scopeToken = String(options.scopeToken || `${quizId}-${studentId}`);
    const attendanceId = options.attendanceId || `lms-quiz-attendance-${toDomToken(scopeToken)}`;
    const answerRows = activeQuestions.map((question, index) => {
        const answer = submission.answers?.[question.id] || submission.draftAnswers?.[question.id] || {};
        const isWritten = String(question.type || 'mcq') === 'written';
        const questionManualMax = getLmsQuizQuestionManualMax(question);
        const manualInputId = `lms-quiz-manual-${toDomToken(`${scopeToken}-${question.id}`)}`;
        const selectedOption = Number(answer.selectedOption);
        const correctOption = Number(question.correctOption);
        const mcqOptionsMarkup = !isWritten
            ? `<div class="lms-quiz-review-option-list">
                ${(question.options || []).map((option, optionIndex) => {
                    const isSelected = Number.isFinite(selectedOption) && selectedOption === optionIndex;
                    const isCorrect = Number.isFinite(correctOption) && correctOption === optionIndex;
                    const toneClass = isSelected && isCorrect
                        ? ' is-selected-correct'
                        : isSelected && !isCorrect
                            ? ' is-selected-wrong'
                            : !isSelected && isCorrect
                                ? ' is-correct'
                                : '';
                    const badgeText = isSelected && isCorrect
                        ? 'Selected  -  Correct'
                        : isSelected && !isCorrect
                            ? 'Selected  -  Incorrect'
                            : !isSelected && isCorrect
                                ? 'Correct answer'
                                : '';
                    return `
                        <div class="lms-quiz-review-option${toneClass}">
                            <div class="lms-quiz-review-option-main">
                                <span class="lms-quiz-review-option-marker">${String.fromCharCode(65 + optionIndex)}</span>
                                <div class="lms-quiz-review-option-copy">${escapeHtml(option || `Option ${optionIndex + 1}`)}</div>
                            </div>
                            ${badgeText ? `<span class="lms-quiz-review-option-badge home-hover-chip">${escapeHtml(badgeText)}</span>` : ''}
                        </div>
                    `;
                }).join('')}
                ${!Number.isFinite(selectedOption) ? '<div class="lms-quiz-review-no-selection">Student did not select an option.</div>' : ''}
            </div>`
            : '';
        return `
            <div class="lms-quiz-review-question-card">
                <div class="lms-quiz-review-question-head">
                    <div class="lms-quiz-review-question-kicker">Question ${index + 1}  -  ${isWritten ? 'Written' : 'Multiple Choice'}  -  ${Number(question.score || 0)} pts</div>
                    ${!isWritten ? `<span class="lms-quiz-review-question-pill home-hover-chip">${Number.isFinite(selectedOption) ? `Selected ${String.fromCharCode(65 + selectedOption)}` : 'No selection'}</span>` : ''}
                </div>
                <div class="lms-quiz-review-question-title">${escapeHtml(question.text || '')}</div>
                ${isWritten ? `
                    <div class="lms-quiz-review-written-answer">
                        <div class="lms-quiz-review-written-answer-title">Student answer</div>
                        <div class="lms-quiz-review-written-answer-copy">${escapeHtml(answer.text || 'No answer submitted')}</div>
                    </div>
                ` : mcqOptionsMarkup}
                ${isWritten ? `
                    <div class="lms-quiz-review-reference">Reference answer: ${escapeHtml(question.expectedAnswer || 'No key')}</div>
                    <div class="lms-quiz-review-manual-row">
                        <label class="lms-quiz-review-manual-field">
                            Written score
                            <input id="${manualInputId}" data-lms-written-score="true" data-question-id="${escapeHtml(question.id)}" type="number" min="0" max="${questionManualMax}" value="${submission.manualScoresByQuestion?.[question.id] === null || submission.manualScoresByQuestion?.[question.id] === undefined ? '' : Number(submission.manualScoresByQuestion[question.id])}" placeholder="0 - ${questionManualMax}" class="lms-quiz-review-manual-input lux-control">
                        </label>
                    </div>
                ` : '<div class="lms-quiz-review-auto-pill home-hover-chip"><i class="fas fa-bolt"></i> Auto-scored by computer</div>'}
            </div>
        `;
    }).join('');
    const secondaryAction = options.hideAction
        ? `<button type="button" class="lux-secondary-btn lms-quiz-action-btn lms-quiz-review-paper-secondary-action-btn" data-lms-click="${options.hideAction}">Hide quiz</button>`
        : `<button type="button" class="lux-secondary-btn lms-quiz-action-btn lms-quiz-review-paper-secondary-action-btn" data-lms-click="closeLmsQuizReviewModal()">Close</button>`;
    return `
        <div class="lms-quiz-review-paper-shell${options.embedded ? ' is-embedded' : ''}">
            <div class="lms-quiz-review-paper-head">
                <div>
                    <div class="lms-quiz-review-paper-title">${escapeHtml(student.name)}  -  ${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                    <div class="lms-quiz-review-paper-meta">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}${submission.variantLabel ? `  -  ${escapeHtml(submission.variantLabel)}` : ''}</div>
                </div>
                ${options.embedded ? '<span class="lms-quiz-review-paper-badge home-hover-chip"><i class="fas fa-file-alt"></i> Gradebook review</span>' : ''}
            </div>
            <div class="lms-quiz-review-paper-stat-row">
                <div class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"><div class="lms-quiz-review-paper-metric-label">Auto Score</div><div class="lms-quiz-review-paper-metric-value">${Number(submission.autoScoreRaw || 0)}</div></div>
                <div class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"><div class="lms-quiz-review-paper-metric-label">Manual Remaining</div><div class="lms-quiz-review-paper-metric-value">${manualMax}</div></div>
                <div class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"><div class="lms-quiz-review-paper-metric-label">Current Final</div><div class="lms-quiz-review-paper-metric-value">${submission.finalScoreRaw === null || submission.finalScoreRaw === undefined ? '-' : Number(submission.finalScoreRaw)}</div></div>
                <div class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"><div class="lms-quiz-review-paper-metric-label">Warnings</div><div class="lms-quiz-review-paper-metric-value">${getLmsQuizProctorAlertCount(submission)}</div></div>
                ${submission.variantLabel ? `<div class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"><div class="lms-quiz-review-paper-metric-label">Assigned Variant</div><div class="lms-quiz-review-paper-metric-copy">${escapeHtml(submission.variantLabel)}</div></div>` : ''}
                <div class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"><div class="lms-quiz-review-paper-metric-label">Outside Actions</div><div class="lms-quiz-review-paper-metric-value">${Number(submission.outsideActionCount || 0)}</div></div>
            </div>
            <div class="lms-quiz-review-paper-timeline">
                <div class="lms-quiz-review-paper-timeline-title">Monitoring Timeline</div>
                <div class="lms-quiz-review-paper-timeline-list">
                    ${proctorEvents.length ? proctorEvents.map(event => `
                        <div class="lms-quiz-review-paper-timeline-item">
                            <div class="lms-quiz-review-paper-timeline-copy">${escapeHtml(event.note || event.type || 'Monitoring event')}</div>
                            <div class="lms-quiz-review-paper-timeline-meta">${escapeHtml(formatLmsDateTime(event.createdAt))}</div>
                        </div>
                    `).join('') : '<div class="lms-quiz-review-paper-timeline-empty">No monitoring warnings for this student.</div>'}
                </div>
            </div>
            <div class="lms-quiz-review-paper-bottom">
                ${examSession
                    ? `<div class="lms-quiz-review-paper-attendance"><span class="lms-quiz-review-paper-attendance-title">Exam List</span><div class="lms-quiz-review-paper-attendance-value">${submission.sessionBlocked ? 'Blocked by staff' : 'Approved by exam list'}</div><span class="lms-quiz-review-paper-attendance-meta">Handwritten room attendance is handled outside the portal.</span></div>`
                    : `<label class="lms-quiz-review-paper-attendance"><span class="lms-quiz-review-paper-attendance-title">Attendance</span><select id="${attendanceId}" class="lms-quiz-review-paper-attendance-select"><option value="" ${!submission.attendanceStatus ? 'selected' : ''}>Not checked</option><option value="Present" ${submission.attendanceStatus === 'Present' ? 'selected' : ''}>Present</option><option value="Late" ${submission.attendanceStatus === 'Late' ? 'selected' : ''}>Late</option><option value="Absent" ${submission.attendanceStatus === 'Absent' ? 'selected' : ''}>Absent</option></select><span class="lms-quiz-review-paper-attendance-meta">${submission.attendanceVerifiedAt ? `Verified ${escapeHtml(formatLmsDateTime(submission.attendanceVerifiedAt))} by ${escapeHtml(submission.attendanceVerifiedBy || 'Staff')}` : 'Not verified yet'}</span></label>`}
                <div class="lms-quiz-review-paper-action-row">${secondaryAction}<button type="button" class="lux-primary-btn lms-quiz-review-paper-save-btn" data-lms-click="saveLmsQuizManualGrade(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)}, ${jsQuote(attendanceId)}, ${jsQuote(scopeToken)}, ${jsQuote(options.focusSectionKey || '')}, ${jsQuote(options.studentName || student.name || '')})"><i class="fas fa-save"></i> Save Review</button></div>
            </div>
            <div class="lms-quiz-review-paper-answer-list">${answerRows || '<div class="lms-quiz-review-paper-answer-empty">No answers recorded yet.</div>'}</div>
        </div>
    `;
}

        const api = {
            renderLmsQuizReviewPanel,
            buildLmsQuizReviewPaperMarkup,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsQuizWorkspaceReviewApi({});
})();

