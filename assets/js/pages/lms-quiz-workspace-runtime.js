/* LMS quiz workspace runtime extracted from lms.js. */

const LMS_STUDENT_QUIZ_FOCUS_STATE_KEY = 'KIU_LMS_STUDENT_QUIZ_FOCUS_STATE';

function openLmsQuizAccessDialog(resourceKey, quizId) {
    closeLmsQuizFloatingLayers();
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;
    const students = getLmsQuizEligibleStudents(resourceKey);
    const selectedIds = new Set(getLmsQuizAllowedStudentIds(resourceKey, quiz));
    const lifecycle = getLmsQuizLifecycleStatus(quiz);
    const currentPublishMode = String(quiz.publishMode || 'manual').toLowerCase() === 'scheduled' ? 'scheduled' : 'manual';
    const attendanceGateEnabled = quiz.attendanceGateEnabled !== false;
    const checkboxRows = students.length
        ? students.map(student => `
            <label style="display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 14px; border:1px solid var(--lux-border); border-radius:14px; background:var(--lux-surface);">
                <span style="display:flex; flex-direction:column; gap:4px;">
                    <span style="font-size:13px; font-weight:800; color:var(--kiu-navy);">${escapeHtml(student.name)}</span>
                    <span style="font-size:11px; color:var(--lux-text-muted);">${escapeHtml(student.id)}</span>
                </span>
                <input type="checkbox" data-lms-quiz-access="true" value="${escapeHtml(student.id)}" ${selectedIds.has(String(student.id)) ? 'checked' : ''} style="width:18px; height:18px;">
            </label>
        `).join('')
        : `<div style="padding:20px; text-align:center; color:var(--lux-text-muted);">No enrolled students found for this group.</div>`;

    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-access-overlay';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:8200; background:rgba(15,23,42,0.72); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:20px;';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div style="width:min(760px, 100%); max-height:88vh; overflow:auto; background:var(--lux-bg-soft); border-radius:24px; border:1px solid rgba(148,163,184,0.18); box-shadow:0 28px 80px rgba(15,23,42,0.35);">
            <div style="padding:18px 22px; background:linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue)); color:white; display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                <div>
                    <div style="font-size:20px; font-weight:900;">${getLmsQuizLifecycleStatus(quiz) === 'draft' ? 'Publish Quiz' : 'Manage Quiz Access'}</div>
                    <div style="font-size:12px; opacity:0.92; margin-top:4px;">Default roster starts with all enrolled students. Uncheck students who are absent from class.</div>
                </div>
                <button type="button" class="kiu-btn-outline" data-lms-click="document.getElementById('lms-quiz-access-overlay')?.remove()" style="border-color:rgba(255,255,255,0.35); color:white; background:rgba(255,255,255,0.08);"><i class="fas fa-times"></i> Close</button>
            </div>
            <div style="padding:22px; display:grid; gap:16px;">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:13px; font-weight:800; color:var(--kiu-navy);">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                        <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</div>
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <button type="button" class="kiu-btn-outline" data-lms-click="document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]').forEach(el => el.checked = true)" style="padding:9px 12px; font-size:12px;">Select All</button>
                        <button type="button" class="kiu-btn-outline" data-lms-click="document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]').forEach(el => el.checked = false)" style="padding:9px 12px; font-size:12px;">Clear All</button>
                    </div>
                </div>
                ${lifecycle === 'draft'
                    ? `<div style="display:grid; gap:10px; padding:14px; border-radius:16px; background:var(--lux-surface); border:1px solid #dbe7f5;">
                            <div style="font-size:12px; font-weight:800; color:var(--kiu-navy);">Publish Mode</div>
                            <label style="display:flex; gap:10px; align-items:flex-start; font-size:12px; color:var(--lux-text-muted);">
                                <input type="radio" name="lms-quiz-publish-mode" value="manual" ${currentPublishMode === 'manual' ? 'checked' : ''}>
                                <span><strong>Publish now</strong><br>Students can answer as soon as the quiz is available.</span>
                            </label>
                            <label style="display:flex; gap:10px; align-items:flex-start; font-size:12px; color:var(--lux-text-muted);">
                                <input type="radio" name="lms-quiz-publish-mode" value="scheduled" ${currentPublishMode === 'scheduled' ? 'checked' : ''}>
                                <span><strong>Automatic publish</strong><br>The quiz opens at the start time and closes itself at the end time.</span>
                            </label>
                            <label style="display:flex; gap:10px; align-items:flex-start; font-size:12px; color:var(--lux-text-muted);">
                                <input type="checkbox" id="lms-quiz-attendance-gate" ${attendanceGateEnabled ? 'checked' : ''}>
                                <span><strong>Attendance gate</strong><br>TA / professor must mark the student present in the LMS review board before Start Quiz unlocks.</span>
                            </label>
                        </div>`
                    : `<div style="display:grid; gap:8px; padding:14px; border-radius:16px; background:var(--lux-surface); border:1px solid #dbe7f5; font-size:12px; color:var(--lux-text-muted);">
                            <strong>Current mode:</strong> ${currentPublishMode === 'scheduled' ? 'Automatic publish by time' : 'Manual publish'}
                            <div><strong>Attendance gate:</strong> ${attendanceGateEnabled ? 'Present students only' : 'Disabled'}</div>
                        </div>`
                }
                <div style="display:grid; gap:10px; max-height:420px; overflow:auto;">${checkboxRows}</div>
                <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">
                    <button type="button" class="kiu-btn-outline" data-lms-click="document.getElementById('lms-quiz-access-overlay')?.remove()" style="padding:10px 14px; font-size:12px;">Cancel</button>
                    <button type="button" class="kiu-btn-blue" data-lms-click="saveLmsQuizAccessSettings(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:10px 14px; font-size:12px;"><i class="fas fa-check"></i> ${lifecycle === 'draft' ? 'Save Publish Settings' : 'Save Access'}</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function resolveLmsQuizSourceFromAssessmentEntry(entry = {}) {
    const resourceKey = resolveCanonicalLmsResourceKey(String(entry?.sourceResourceKey || '').trim());
    const quizId = String(entry?.sourceQuizId || '').trim();
    if (!resourceKey || !quizId) return null;
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return null;
    return { resourceKey, quizId, quiz };
}

function getAssessmentEntryDisplayContext(criterion, entry = {}) {
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const criterionMeta = getGradebookCriterionMeta(normalizedCriterion);
    const entryNumber = normalizeAssessmentNumber(entry?.number, 1);
    const manualTitle = String(entry?.title || entry?.name || '').trim();
    const linked = resolveLmsQuizSourceFromAssessmentEntry(entry);
    if (!linked?.quiz) {
        return {
            title: manualTitle || `${criterionMeta.label} ${entryNumber}`,
            subtitle: '',
            criterionMeta,
            entryNumber,
            linked: null
        };
    }
    const context = resolveActiveLmsQuizContext(linked.resourceKey) || {};
    const quiz = linked.quiz;
    return {
        title: String(quiz.title || '').trim() || manualTitle || `${criterionMeta.label} ${entryNumber}`,
        subtitle: [getLmsQuizDisplayLabel(quiz), quiz.weekLabel, context.subject?.name, context.group?.name].filter(Boolean).join('  -  '),
        criterionMeta,
        entryNumber,
        linked
    };
}

function openStudentQuizPaperFromHistory(studentId, criterion, number) {
    const rosterKey = currentRosterId || currentCourseId;
    const roster = KIU_STATE.studentGrades[rosterKey] || [];
    const safeRecord = roster.find(r => String(r.id) === String(studentId));
    if (!safeRecord) return;
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber)
        || getAssessmentEntries(safeRecord, normalizedCriterion)
            .find(item => normalizeAssessmentNumber(item.number, 1) === targetNumber);
    const source = resolveLmsQuizSourceFromAssessmentEntry(entry);
    if (!source) {
        alert('This grade entry is not linked to a saved LMS quiz paper yet.');
        return;
    }
    const parsed = parseLmsCourseKey(source.resourceKey);
    const student = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId)
        .find(item => String(item.id) === String(studentId)) || { id: studentId, name: safeRecord.name || `Student ${studentId}` };
    openLmsQuizReviewModal(source.resourceKey, source.quizId, student.id);
}

function saveLmsQuizAccessSettings(resourceKey, quizId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;
    const publishErrors = validateLmsQuizBeforePublish(quiz);
    if (publishErrors.length) {
        alert(`Quiz is not ready to publish yet:\n- ${publishErrors.join('\n- ')}`);
        return;
    }
    const selected = Array.from(document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]:checked'))
        .map(input => String(input.value));
    if (!selected.length) {
        alert('Please allow at least one student before publishing this quiz.');
        return;
    }
    const requestedMode = String(
        document.querySelector('#lms-quiz-access-overlay input[name="lms-quiz-publish-mode"]:checked')?.value
        || quiz.publishMode
        || 'manual'
    ).toLowerCase() === 'scheduled' ? 'scheduled' : 'manual';
    const attendanceGateInput = document.getElementById('lms-quiz-attendance-gate');
    const attendanceGateEnabled = attendanceGateInput ? attendanceGateInput.checked === true : quiz.attendanceGateEnabled !== false;
    if (requestedMode === 'scheduled') {
        const startAt = quiz.availableFrom ? new Date(quiz.availableFrom) : null;
        const endAt = quiz.availableUntil ? new Date(quiz.availableUntil) : null;
        if (!startAt || !Number.isFinite(startAt.getTime())) {
            alert('Automatic publish needs a valid start time.');
            return;
        }
        if (!endAt || !Number.isFinite(endAt.getTime()) || endAt.getTime() <= startAt.getTime()) {
            alert('Automatic publish needs an end time that is after the start time.');
            return;
        }
    }
    quiz.allowedStudentIds = selected;
    if (quiz.variantEnabled === true) {
        quiz.studentVariantMap = reconcileLmsQuizStudentVariantMap(quiz, selected);
    } else {
        quiz.studentVariantMap = {};
    }
    quiz.attendanceMode = 'manual-access-list';
    quiz.lockedAfterPublish = true;
    quiz.status = 'published';
    quiz.isPublished = true;
    quiz.publishMode = requestedMode;
    quiz.requiresBlueExamNetwork = false;
    quiz.blueSessionMode = 'helper-session';
    quiz.attendanceGateEnabled = attendanceGateEnabled;
    quiz.publishedAt = requestedMode === 'scheduled'
        ? (isLmsQuizVisibleToStudentsNow(quiz) ? (quiz.publishedAt || new Date().toISOString()) : null)
        : (quiz.publishedAt || new Date().toISOString());
    quiz.publishedBy = quiz.publishedBy || getSimulatedUserName();
    quiz.updatedAt = new Date().toISOString();
    saveLmsQuizWorkspaceRecord(resourceKey, quiz);
    syncLmsQuizRoster(resourceKey, quiz);
    saveState();
    syncProtectedQuizRecordToBackend(resourceKey, quiz, { status: 'published' }).catch(() => null);
    document.getElementById('lms-quiz-access-overlay')?.remove();
    rerenderCurrentLmsQuizWorkspace();
}

function validateLmsQuizBeforePublish(quiz) {
    const errors = [];
    if (!String(quiz?.title || '').trim()) errors.push('Quiz title is required.');
    const normalizedWeek = normalizeLmsWeekLabel(quiz?.weekLabel || '');
    if (!normalizedWeek || normalizedWeek === 'No Week / General') errors.push('Select a valid week.');
    const questionSets = quiz?.variantEnabled === true
        ? normalizeLmsQuizVariantList(quiz?.variants).map(variant => ({
            label: variant.label,
            questions: variant.questions || []
        }))
        : [{ label: 'Base quiz', questions: normalizeLmsQuizQuestionList(quiz?.questions) }];
    if (!questionSets.length || !questionSets.some(entry => entry.questions.length)) {
        errors.push(quiz?.variantEnabled === true ? 'Generate quiz variants first.' : 'Add at least one question.');
    }
    questionSets.forEach(questionSet => {
        const questions = questionSet.questions || [];
        if (!questions.length) {
            errors.push(`${questionSet.label} has no questions.`);
            return;
        }
        questions.forEach((question, index) => {
        const label = `Question ${index + 1}`;
        const type = String(question?.type || 'mcq') === 'written' ? 'written' : 'mcq';
        if (!String(question?.text || '').trim()) {
            errors.push(`${questionSet.label} ${label} text is empty.`);
            return;
        }
        if (type === 'mcq') {
            const optionCount = Math.min(6, Math.max(2, parseInt(question?.optionCount, 10) || (question?.options || []).length || 4));
            const options = Array.from({ length: optionCount }, (_, optionIndex) => String(question?.options?.[optionIndex] || '').trim());
            if (options.some(option => !option)) {
                errors.push(`${questionSet.label} ${label} has empty answer options.`);
            }
        }
        });
    });
    return errors;
}

window.openStudentQuizPaperFromHistoryImpl = openStudentQuizPaperFromHistory;
window.openStudentQuizPaperFromHistory = openStudentQuizPaperFromHistory;

function closeLmsQuiz(resourceKey, quizId) {
    closeLmsQuizBoardModal();
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;
    if (!confirm('Close this quiz now? Students will no longer be able to start it.')) return;
    const students = getLmsQuizEligibleStudents(resourceKey);
    students.forEach(student => {
        autoSubmitExpiredLmsQuizAttempt(resourceKey, { ...quiz, availableUntil: new Date().toISOString() }, student);
    });
    quiz.status = 'closed';
    quiz.isPublished = true;
    quiz.updatedAt = new Date().toISOString();
    saveLmsQuizWorkspaceRecord(resourceKey, quiz);
    saveState();
    syncProtectedQuizRecordToBackend(resourceKey, quiz, { status: 'closed' }).catch(() => null);
    rerenderCurrentLmsQuizWorkspace();
}

function renderEmbeddedLmsQuizSectionCards(resourceKey, quizzes, quizUiState) {
    const renderQuizCard = (quiz) => {
        const lifecycle = getLmsQuizLifecycleStatus(quiz);
        const stats = getLmsQuizSubmissionStats(resourceKey, quiz);
        const allowCountLabel = `${stats.allowedCount}/${stats.totalEligible}`;
        const statusColors = lifecycle === 'draft'
            ? { bg: '#f8fafc', color: '#64748b' }
            : lifecycle === 'published'
                ? { bg: '#ecfdf5', color: '#047857' }
                : { bg: '#fef2f2', color: '#b91c1c' };
        return `
            <div data-quiz-id="${escapeHtml(quiz.id)}" style="background:white; border:1px solid #dbe7f5; border-radius:18px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                    <div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</span>
                            <span style="background:${statusColors.bg}; color:${statusColors.color}; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:800;">${escapeHtml(lifecycle)}</span>
                        </div>
                        <div style="font-size:16px; font-weight:800; color:var(--kiu-navy); margin-top:6px;">${escapeHtml(quiz.title || 'Untitled Quiz')}</div>
                        <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">${quiz.availableFrom ? `Starts ${escapeHtml(formatLmsDateTime(quiz.availableFrom))}` : 'Starts immediately'}${quiz.availableUntil ? `  -  Ends ${escapeHtml(formatLmsDateTime(quiz.availableUntil))}` : ''}</div>
                        <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">Published by: ${escapeHtml(quiz.publishedBy || 'Not published yet')}</div>
                    </div>
                    <div style="background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-text-muted); padding:6px 12px; border-radius:999px; font-size:12px; font-weight:800;">${escapeHtml(String(getAdminQuizTotalScore(quiz)))} pts</div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; margin-top:16px;">
                    <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">Questions</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(String((quiz.questions || []).length))}</div></div>
                    <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">Allowed</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(allowCountLabel)}</div></div>
                    <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">Pending Review</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(String(stats.pendingReviewCount))}</div></div>
                    <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">Graded</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(String(stats.gradedCount))}</div></div>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
                    ${lifecycle === 'draft'
                        ? `<button class="kiu-btn-outline" data-lms-click="loadAdminQuizForEdit(${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-pen"></i> Edit Draft</button>
                           <button class="kiu-btn-blue" data-lms-click="openLmsQuizAccessDialog(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-paper-plane"></i> Publish</button>
                           <button class="kiu-btn-outline" data-lms-click="deleteAdminQuiz(${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px; color:#dc2626; border-color:#fecaca;"><i class="fas fa-trash"></i> Delete Draft</button>`
                        : `<button class="kiu-btn-outline" data-lms-click="toggleLmsQuizReviewPanel(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-users"></i> View Submissions</button>
                           <button class="kiu-btn-outline" data-lms-click="openLmsQuizAccessDialog(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-user-check"></i> Manage Access</button>
                           ${lifecycle === 'published' ? `<button class="kiu-btn-outline" data-lms-click="closeLmsQuiz(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px; color:var(--lux-text-muted); border-color:#fed7aa;"><i class="fas fa-stop-circle"></i> Close Quiz</button>` : ''}`
                    }
                </div>
                
            </div>
        `;
    };

    const drafts = quizzes.filter(quiz => getLmsQuizLifecycleStatus(quiz) === 'draft');
    const published = quizzes.filter(quiz => getLmsQuizLifecycleStatus(quiz) === 'published');
    const closed = quizzes.filter(quiz => getLmsQuizLifecycleStatus(quiz) === 'closed');
    const reviewQueue = quizzes.filter(quiz => getLmsQuizSubmissionStats(resourceKey, quiz).pendingReviewCount > 0);
    const renderGroup = (title, description, items) => `
        <div style="display:grid; gap:14px;">
            <div>
                <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">${title}</div>
                <div style="font-size:13px; color:var(--lux-text-muted); margin-top:4px;">${description}</div>
            </div>
            ${items.length ? items.map(renderQuizCard).join('') : `<div style="background:white; border:1px dashed #cbd5e1; border-radius:18px; padding:24px; text-align:center; color:var(--lux-text-muted);">Nothing here yet.</div>`}
        </div>
    `;

    return `
        <div style="display:grid; gap:18px;">
            ${renderGroup('Draft Quizzes', 'Drafts are visible to staff only until you publish them to the selected students in class.', drafts)}
            ${renderGroup('Published Quizzes', 'Published quizzes are visible to allowed students only and are locked from editing.', published)}
            ${renderGroup('Review Queue', 'These quizzes already have student submissions waiting for TA or professor review.', reviewQueue)}
            ${renderGroup('Results', 'Closed quizzes remain available for submission review, grading, and score verification.', closed)}
        </div>
    `;
}

function ensureLmsQuizUiState(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    workspace.ui = workspace.ui || {};
    if (workspace.ui.reviewQuizId === undefined) workspace.ui.reviewQuizId = null;
    if (workspace.ui.studentQuizId === undefined) workspace.ui.studentQuizId = null;
    if (workspace.ui.activeQuestionId === undefined) workspace.ui.activeQuestionId = null;
    if (workspace.ui.editorDraft === undefined) workspace.ui.editorDraft = null;
    if (!['running', 'all'].includes(String(workspace.ui.monitorMode || ''))) {
        workspace.ui.monitorMode = 'running';
    }
    if (!['all', 'acknowledged', 'unacknowledged'].includes(String(workspace.ui.monitorAckFilter || ''))) {
        workspace.ui.monitorAckFilter = 'all';
    }
    if (workspace.ui.lastSeenMonitorAlertAt === undefined) workspace.ui.lastSeenMonitorAlertAt = null;
    if (!['drafts', 'published', 'review', 'results'].includes(String(workspace.ui.boardPage || ''))) {
        workspace.ui.boardPage = 'drafts';
    }
    lmsQuizUiByResourceKey[resourceKey] = workspace.ui;
    return workspace.ui;
}

function clearActiveLmsQuizCountdown() {
    if (activeLmsQuizCountdownInterval) {
        clearInterval(activeLmsQuizCountdownInterval);
        activeLmsQuizCountdownInterval = null;
    }
}

function clearActiveLmsPostSubmitLockInterval() {
    if (activeLmsPostSubmitLockInterval) {
        clearInterval(activeLmsPostSubmitLockInterval);
        activeLmsPostSubmitLockInterval = null;
    }
}

function updateLmsPostSubmitLockCountdowns() {
    const lockNodes = Array.from(document.querySelectorAll('[data-lms-post-submit-lock="true"]'));
    if (!lockNodes.length) {
        clearActiveLmsPostSubmitLockInterval();
        return false;
    }
    const now = Date.now();
    let hasActiveLocks = false;
    lockNodes.forEach(node => {
        const lockUntilValue = String(node.getAttribute('data-lock-until') || '').trim();
        const lockUntil = lockUntilValue ? new Date(lockUntilValue) : null;
        const buttonId = String(node.getAttribute('data-lock-button') || '').trim();
        const button = buttonId ? document.getElementById(buttonId) : null;
        if (!(lockUntil instanceof Date) || Number.isNaN(lockUntil.getTime())) {
            node.textContent = 'Quiz access is temporarily locked after submission.';
            return;
        }
        const remainingMs = lockUntil.getTime() - now;
        if (remainingMs > 0) {
            hasActiveLocks = true;
            node.textContent = `Available again in ${formatCountdownDuration(remainingMs)} after submission.`;
            if (button) {
                button.disabled = true;
                button.style.opacity = '0.55';
                button.style.cursor = 'not-allowed';
            }
            return;
        }
        node.textContent = 'Quiz can be opened again.';
        if (button) {
            const unlockedLabel = String(button.getAttribute('data-unlocked-label') || 'View Quiz');
            button.disabled = false;
            button.style.opacity = '';
            button.style.cursor = '';
            button.innerHTML = `<i class="fas fa-arrow-right"></i> ${escapeHtml(unlockedLabel)}`;
        }
        node.removeAttribute('data-lms-post-submit-lock');
    });
    if (!hasActiveLocks) {
        clearActiveLmsPostSubmitLockInterval();
    }
    return hasActiveLocks;
}

function startActiveLmsPostSubmitLockInterval() {
    clearActiveLmsPostSubmitLockInterval();
    if (!updateLmsPostSubmitLockCountdowns()) return;
    activeLmsPostSubmitLockInterval = setInterval(() => {
        if (!updateLmsPostSubmitLockCountdowns()) {
            clearActiveLmsPostSubmitLockInterval();
        }
    }, 1000);
}

function decorateLmsPostSubmitLockedQuizCards(container, quizzes, resourceKey, studentMeta) {
    if (!container || !Array.isArray(quizzes) || !quizzes.length) {
        clearActiveLmsPostSubmitLockInterval();
        return;
    }
    const quizCards = Array.from(container.querySelectorAll('[data-lms-student-quiz-card="true"]'));
    quizCards.forEach((card, index) => {
        const quiz = quizzes[index];
        if (!quiz) return;
        const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, studentMeta);
        const statusNode = card.querySelector('[data-lms-student-quiz-status="true"]');
        const actionButton = card.querySelector('[data-lms-student-quiz-action="true"]');
        if (!statusNode || !actionButton) return;
        const terminalStatus = ['submitted', 'auto-submitted', 'graded'].includes(String(submission?.status || ''));
        const actionLabel = terminalStatus ? 'View Quiz' : 'Open in Anti-Cheat';
        const buttonId = `lms-post-submit-lock-${toDomToken(`${resourceKey}-${quiz.id}`)}`;
        actionButton.id = buttonId;
        actionButton.setAttribute('data-unlocked-label', actionLabel);
        const lockUntil = getLmsQuizPostSubmitLockUntil(submission);
        if (lockUntil && isLmsQuizPostSubmitLocked(submission)) {
            statusNode.setAttribute('data-lms-post-submit-lock', 'true');
            statusNode.setAttribute('data-lock-until', lockUntil.toISOString());
            statusNode.setAttribute('data-lock-button', buttonId);
            statusNode.style.color = '#b45309';
            statusNode.style.fontWeight = '800';
            statusNode.textContent = getLmsQuizPostSubmitLockMessage(submission);
            actionButton.disabled = true;
            actionButton.style.opacity = '0.55';
            actionButton.style.cursor = 'not-allowed';
            actionButton.innerHTML = '<i class="fas fa-clock"></i> Locked After Submit';
            return;
        }
        statusNode.removeAttribute('data-lms-post-submit-lock');
        statusNode.removeAttribute('data-lock-until');
        statusNode.removeAttribute('data-lock-button');
        actionButton.disabled = false;
        actionButton.style.opacity = '';
        actionButton.style.cursor = '';
        actionButton.innerHTML = `<i class="fas fa-arrow-right"></i> ${escapeHtml(actionLabel)}`;
    });
    startActiveLmsPostSubmitLockInterval();
}

function renderAdminQaTestingCard() {
    const existingCard = document.getElementById('admin-qa-test-card');
    if (existingCard) existingCard.remove();
}

function renderSharedQaRoleTestingCard() {
    const existingCard = document.getElementById('faculty-qa-test-card') || document.getElementById('student-qa-test-card');
    if (existingCard) existingCard.remove();
    return;
}

function openSharedQaTest() {
    return;
}

function formatLmsDateTime(value) {
    if (!value) return 'No deadline';
    const normalized = String(value).replace('T', ' ');
    return normalized.length > 16 ? normalized.slice(0, 16) : normalized;
}

function buildLmsSubmissionDraftKey(resourceKey, assignmentId, userId = getCurrentUserId() || 'student') {
    return `${resolveCanonicalLmsResourceKey(resourceKey)}::${assignmentId}::${userId}`;
}

function buildEmptyLmsStudentQuizFocusState() {
    return {
        active: false,
        resourceKey: '',
        quizId: '',
        studentId: '',
        studentName: '',
        activatedAt: '',
        warningMessage: ''
    };
}

function ensureLmsStudentQuizFocusStyles() {
    if (document.getElementById('kiu-lms-quiz-focus-styles')) return;
    const style = document.createElement('style');
    style.id = 'kiu-lms-quiz-focus-styles';
    style.textContent = `
        body.kiu-lms-quiz-focus-active #mobile-bottom-nav,
        body.kiu-lms-quiz-focus-active #top-nav,
        body.kiu-lms-quiz-focus-active #prof-nav,
        body.kiu-lms-quiz-focus-active #admin-nav,
        body.kiu-lms-quiz-focus-active #service-nav,
        body.kiu-lms-quiz-focus-active .lux-topbar,
        body.kiu-lms-quiz-focus-active .lux-sidebar,
        body.kiu-lms-quiz-focus-active .portal-msg-fab,
        body.kiu-lms-quiz-focus-active .portal-notif-fab {
            display: none !important;
        }
        body.kiu-lms-quiz-focus-active {
            overflow-x: hidden;
        }
    `;
    document.head.appendChild(style);
}

function syncLmsStudentQuizFocusChrome(state = null) {
    const normalizedState = state && typeof state === 'object'
        ? state
        : buildEmptyLmsStudentQuizFocusState();
    ensureLmsStudentQuizFocusStyles();
    document.body?.classList.toggle('kiu-lms-quiz-focus-active', normalizedState.active === true);
}

function getLmsStudentQuizFocusState() {
    const fallback = buildEmptyLmsStudentQuizFocusState();
    try {
        const raw = sessionStorage.getItem(LMS_STUDENT_QUIZ_FOCUS_STATE_KEY);
        if (!raw) {
            syncLmsStudentQuizFocusChrome(fallback);
            return fallback;
        }
        const parsed = JSON.parse(raw);
        const normalized = {
            ...fallback,
            ...(parsed && typeof parsed === 'object' ? parsed : {})
        };
        normalized.active = normalized.active === true;
        syncLmsStudentQuizFocusChrome(normalized);
        return normalized;
    } catch (error) {
        syncLmsStudentQuizFocusChrome(fallback);
        return fallback;
    }
}

function setLmsStudentQuizFocusState(nextState = {}) {
    const normalized = {
        ...buildEmptyLmsStudentQuizFocusState(),
        ...(nextState && typeof nextState === 'object' ? nextState : {})
    };
    normalized.active = normalized.active === true;
    try {
        sessionStorage.setItem(LMS_STUDENT_QUIZ_FOCUS_STATE_KEY, JSON.stringify(normalized));
    } catch (error) {}
    syncLmsStudentQuizFocusChrome(normalized);
    return normalized;
}

function enableLmsStudentQuizFocusMode(resourceKey, quizId, studentMeta = {}, warningMessage = '') {
    return setLmsStudentQuizFocusState({
        active: true,
        resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
        quizId: String(quizId || ''),
        studentId: String(studentMeta?.id || ''),
        studentName: String(studentMeta?.name || ''),
        activatedAt: new Date().toISOString(),
        warningMessage: String(warningMessage || '')
    });
}

function disableLmsStudentQuizFocusMode() {
    const cleared = setLmsStudentQuizFocusState(buildEmptyLmsStudentQuizFocusState());
    if (document.fullscreenElement && typeof document.exitFullscreen === 'function') {
        Promise.resolve(document.exitFullscreen()).catch(() => null);
    }
    return cleared;
}

function getCurrentLmsActiveTab() {
    const activeTab = document.querySelector('#page-lms-inner .tab.active');
    return activeTab ? String(activeTab.id || '').replace(/^tab-/, '') : 'interaction';
}

function rerenderCurrentLmsTab() {
    switchLMSTab(getCurrentLmsActiveTab());
}

function resolveLmsQuizWorkspace(courseKey = currentLmsQuizCourseKey || currentCourseId) {
    const context = resolveActiveLmsQuizContext(courseKey, getCurrentFaculty());
    if (!context?.resourceKey) return null;
    return {
        ...context,
        students: getLmsQuizEligibleStudents(context.resourceKey)
    };
}

function createLmsQuizBuilderQuestion() {
    return {
        id: makeAdminExamEntityId('lms-question'),
        type: 'mcq',
        text: '',
        score: 1,
        optionCount: 4,
        options: ['', '', '', ''],
        correctOption: 0,
        expectedAnswer: ''
    };
}

function createLmsQuizBuilderDraft(context) {
    return {
        editingQuizId: null,
        title: '',
        subjectId: context?.subject?.id || context?.courseId || '',
        subjectName: context?.subject?.name || context?.courseId || '',
        groupId: context?.group?.id || context?.groupId || '',
        groupName: context?.group?.name || context?.groupId || '',
        assessmentType: 'quiz',
        assessmentNumber: null,
        weekLabel: context?.weeks?.[0] || 'Week 1',
        availableFrom: '',
        availableUntil: '',
        durationMinutes: 20,
        instructions: '',
        allowedStudentIds: [],
        requiresBlueExamNetwork: false,
        attendanceGateEnabled: true,
        variantEnabled: false,
        variantCount: 3,
        questionsPerVariant: 10,
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        questions: [createLmsQuizBuilderQuestion()],
        variants: []
    };
}

function normalizeLmsQuizBuilderAllowedStudentIds(studentIds = []) {
    if (!Array.isArray(studentIds)) return [];
    return Array.from(new Set(
        studentIds
            .map(studentId => String(studentId || '').trim())
            .filter(Boolean)
    ));
}

function normalizeLmsQuizBuilderDraftState(draft, context) {
    const baseDraft = createLmsQuizBuilderDraft(context);
    const sourceDraft = draft && typeof draft === 'object' ? draft : {};
    const normalizedQuestions = normalizeLmsQuizQuestionList(sourceDraft.questions);
    const questions = normalizedQuestions.length ? normalizedQuestions : [createLmsQuizBuilderQuestion()];
    const variantEnabled = sourceDraft.variantEnabled === true;
    return {
        ...baseDraft,
        ...sourceDraft,
        editingQuizId: sourceDraft.editingQuizId ? String(sourceDraft.editingQuizId) : null,
        title: String(sourceDraft.title || ''),
        subjectId: context?.subject?.id || context?.courseId || String(sourceDraft.subjectId || baseDraft.subjectId || ''),
        subjectName: context?.subject?.name || context?.courseId || String(sourceDraft.subjectName || baseDraft.subjectName || ''),
        groupId: context?.group?.id || context?.groupId || String(sourceDraft.groupId || baseDraft.groupId || ''),
        groupName: context?.group?.name || context?.groupId || String(sourceDraft.groupName || baseDraft.groupName || ''),
        assessmentType: normalizeLmsQuizAssessmentType(sourceDraft.assessmentType || baseDraft.assessmentType),
        assessmentNumber: sourceDraft.assessmentNumber === null || sourceDraft.assessmentNumber === undefined || sourceDraft.assessmentNumber === ''
            ? null
            : normalizeAssessmentNumber(sourceDraft.assessmentNumber, 1),
        weekLabel: String(sourceDraft.weekLabel || context?.weeks?.[0] || baseDraft.weekLabel || 'Week 1'),
        availableFrom: String(sourceDraft.availableFrom || ''),
        availableUntil: String(sourceDraft.availableUntil || ''),
        durationMinutes: Math.max(1, parseInt(sourceDraft.durationMinutes, 10) || baseDraft.durationMinutes || 20),
        instructions: String(sourceDraft.instructions || ''),
        publishMode: String(sourceDraft.publishMode || 'manual'),
        allowedStudentIds: normalizeLmsQuizBuilderAllowedStudentIds(sourceDraft.allowedStudentIds),
        requiresBlueExamNetwork: false,
        attendanceGateEnabled: sourceDraft.attendanceGateEnabled !== false,
        variantEnabled,
        variantCount: Math.min(8, Math.max(1, parseInt(sourceDraft.variantCount, 10) || 3)),
        questionsPerVariant: Math.max(1, parseInt(sourceDraft.questionsPerVariant, 10) || Math.min(questions.length || 1, 10)),
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        questions,
        variants: variantEnabled ? normalizeLmsQuizVariantList(sourceDraft.variants) : []
    };
}

function getLmsQuizBuilderEditorState(resourceKey = currentLmsQuizCourseKey || currentCourseId) {
    const context = resolveLmsQuizWorkspace(resourceKey);
    if (!context?.resourceKey) return null;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    if (!uiState.editorDraft || typeof uiState.editorDraft !== 'object') {
        uiState.editorDraft = createLmsQuizBuilderDraft(context);
    }
    uiState.editorDraft = normalizeLmsQuizBuilderDraftState(uiState.editorDraft, context);
    if (!uiState.activeQuestionId || !uiState.editorDraft.questions.some(question => question.id === uiState.activeQuestionId)) {
        uiState.activeQuestionId = uiState.editorDraft.questions[0]?.id || null;
    }
    if (uiState.editorDraft.variantEnabled !== true) {
        uiState.activeVariantId = null;
    } else if (!uiState.activeVariantId || !uiState.editorDraft.variants.some(variant => variant.id === uiState.activeVariantId)) {
        uiState.activeVariantId = uiState.editorDraft.variants[0]?.id || null;
    }
    return uiState;
}

function getLmsQuizBuilderDraft(resourceKey = currentLmsQuizCourseKey || currentCourseId) {
    return getLmsQuizBuilderEditorState(resourceKey)?.editorDraft || null;
}

function resetLmsQuizBuilderDraft(resourceKey = currentLmsQuizCourseKey || currentCourseId) {
    const context = resolveLmsQuizWorkspace(resourceKey);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    uiState.editorDraft = createLmsQuizBuilderDraft(context);
    uiState.activeQuestionId = uiState.editorDraft.questions[0]?.id || null;
    uiState.activeVariantId = null;
}

function rerenderCurrentLmsQuizWorkspace() {
    const quizTab = document.getElementById('tab-quiz');
    const contentArea = document.getElementById('lms-content-area');
    if (!quizTab || !contentArea || !quizTab.classList.contains('active')) return;
    renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
}

function getActiveLmsQuizBuilderQuestion(resourceKey = currentLmsQuizCourseKey || currentCourseId) {
    const uiState = getLmsQuizBuilderEditorState(resourceKey);
    const draft = uiState?.editorDraft;
    if (!draft) return null;
    return draft.questions.find(question => question.id === uiState.activeQuestionId) || draft.questions[0] || null;
}

function getActiveLmsQuizBuilderVariant(resourceKey = currentLmsQuizCourseKey || currentCourseId) {
    const uiState = getLmsQuizBuilderEditorState(resourceKey);
    const draft = uiState?.editorDraft;
    if (!draft?.variants?.length) return null;
    return draft.variants.find(variant => variant.id === uiState.activeVariantId) || draft.variants[0] || null;
}

function setActiveLmsQuizBuilderQuestion(questionId) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    if (!uiState?.editorDraft?.questions?.some(question => question.id === questionId)) return;
    uiState.activeQuestionId = questionId;
    rerenderCurrentLmsQuizWorkspace();
}

function toggleLmsQuizVariantSetPanel() {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    uiState.quizVariantSetExpanded = uiState.quizVariantSetExpanded !== true;
    rerenderCurrentLmsQuizWorkspace();
}

function toggleLmsQuizQuestionNavigatorPanel() {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    uiState.quizQuestionNavigatorExpanded = uiState.quizQuestionNavigatorExpanded !== true;
    rerenderCurrentLmsQuizWorkspace();
}

function setLmsQuizDraftField(field, value) {
    const draft = getLmsQuizBuilderDraft();
    if (!draft) return;
    if (field === 'requiresBlueExamNetwork') {
        draft.requiresBlueExamNetwork = value === true;
        return;
    }
    if (field === 'variantEnabled') {
        draft[field] = value === true;
        if (!draft[field]) {
            draft.variants = [];
            const uiState = getLmsQuizBuilderEditorState();
            if (uiState) uiState.activeVariantId = null;
        }
        return;
    }
    if (field === 'variantCount') {
        draft[field] = Math.min(8, Math.max(1, parseInt(value, 10) || 1));
        return;
    }
    if (field === 'questionsPerVariant') {
        draft[field] = Math.max(1, parseInt(value, 10) || 1);
        return;
    }
    draft[field] = value;
}

function updateLmsQuizQuestionField(questionId, field, value) {
    const draft = getLmsQuizBuilderDraft();
    const question = draft?.questions?.find(item => item.id === questionId);
    if (!question) return;
    question[field] = value;
}

function markLmsQuizVariantCustomized(variantId) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    if (!variant) return;
    variant.customized = true;
}

function setActiveLmsQuizBuilderVariant(variantId) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    if (!uiState?.editorDraft?.variants?.some(variant => variant.id === variantId)) return;
    uiState.activeVariantId = variantId;
    rerenderCurrentLmsQuizWorkspace();
}

function updateLmsQuizVariantQuestionField(variantId, questionId, field, value) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const question = variant?.questions?.find(item => item.id === questionId);
    if (!question) return;
    question[field] = value;
    markLmsQuizVariantCustomized(variantId);
}

function setLmsQuizVariantQuestionType(variantId, questionId, type) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const question = variant?.questions?.find(item => item.id === questionId);
    if (!question) return;
    question.type = String(type || 'mcq') === 'written' ? 'written' : 'mcq';
    if (question.type === 'written') {
        question.options = [];
        question.optionCount = 0;
        question.correctOption = null;
    } else {
        const count = Math.min(6, Math.max(2, parseInt(question.optionCount, 10) || 4));
        question.optionCount = count;
        question.options = Array.from({ length: count }, (_, index) => String(question.options?.[index] || ''));
        question.correctOption = Number.isFinite(Number(question.correctOption)) ? Number(question.correctOption) : 0;
    }
    markLmsQuizVariantCustomized(variantId);
    rerenderCurrentLmsQuizWorkspace();
}

function setLmsQuizVariantQuestionOptionCount(variantId, questionId, count) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const question = variant?.questions?.find(item => item.id === questionId);
    if (!question || String(question.type || 'mcq') === 'written') return;
    const optionCount = Math.min(6, Math.max(2, parseInt(count, 10) || 4));
    question.optionCount = optionCount;
    question.options = Array.from({ length: optionCount }, (_, index) => String(question.options?.[index] || ''));
    question.correctOption = Math.min(optionCount - 1, Math.max(0, parseInt(question.correctOption, 10) || 0));
    markLmsQuizVariantCustomized(variantId);
    rerenderCurrentLmsQuizWorkspace();
}

function updateLmsQuizVariantQuestionOptionText(variantId, questionId, optionIndex, value) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const question = variant?.questions?.find(item => item.id === questionId);
    if (!question || !Array.isArray(question.options)) return;
    question.options[optionIndex] = value;
    markLmsQuizVariantCustomized(variantId);
}

function setLmsQuizVariantQuestionCorrectOption(variantId, questionId, optionIndex) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const question = variant?.questions?.find(item => item.id === questionId);
    if (!question) return;
    question.correctOption = optionIndex;
    markLmsQuizVariantCustomized(variantId);
}

function generateLmsQuizVariants(options = {}) {
    const draft = getLmsQuizBuilderDraft();
    if (!draft) return;
    const safeBaseQuestions = normalizeLmsQuizQuestionList(draft.questions);
    const variantCount = Math.min(8, Math.max(1, parseInt(draft.variantCount, 10) || 1));
    const questionsPerVariant = Math.max(1, parseInt(draft.questionsPerVariant, 10) || 1);
    if (safeBaseQuestions.length < questionsPerVariant) {
        alert(`Base pool needs at least ${questionsPerVariant} questions before variants can be generated.`);
        return;
    }
    const result = buildLmsQuizVariantQuestionSet(safeBaseQuestions, questionsPerVariant, variantCount);
    draft.variants = result.variants;
    draft.variantEnabled = true;
    const uiState = getLmsQuizBuilderEditorState();
    if (uiState) uiState.activeVariantId = draft.variants[0]?.id || null;
    if (options.showAlert !== false) {
        if (result.overlapFallbackUsed) {
            alert('Variants were generated with overlap fallback. The base pool is too small to keep every question unique across all variants.');
        } else {
            alert(`${draft.variants.length} quiz variants were generated successfully.`);
        }
    }
    rerenderCurrentLmsQuizWorkspace();
}

function regenerateAllLmsQuizVariants() {
    const draft = getLmsQuizBuilderDraft();
    if (!draft) return;
    const hasCustomized = (draft.variants || []).some(variant => variant.customized);
    if (hasCustomized && !confirm('Regenerate all variants? Customized variant edits will be overwritten.')) return;
    generateLmsQuizVariants({ showAlert: true });
}

function regenerateLmsQuizVariant(variantId) {
    const draft = getLmsQuizBuilderDraft();
    if (!draft) return;
    const variant = draft.variants?.find(item => item.id === variantId);
    if (!variant) return;
    if (variant.customized && !confirm(`Regenerate ${variant.label}? Manual edits in this variant will be overwritten.`)) return;
    const result = buildLmsQuizVariantQuestionSet(normalizeLmsQuizQuestionList(draft.questions), Math.max(1, parseInt(draft.questionsPerVariant, 10) || 1), Math.min(8, Math.max(1, parseInt(draft.variantCount, 10) || 1)));
    const replacement = result.variants.find(item => item.label === variant.label) || result.variants[0];
    if (!replacement) return;
    replacement.id = variant.id;
    draft.variants = (draft.variants || []).map(item => item.id === variantId ? replacement : item);
    rerenderCurrentLmsQuizWorkspace();
}

function resetLmsQuizVariantsToBasePool() {
    const draft = getLmsQuizBuilderDraft();
    if (!draft) return;
    draft.variants = [];
    const uiState = getLmsQuizBuilderEditorState();
    if (uiState) uiState.activeVariantId = null;
    rerenderCurrentLmsQuizWorkspace();
}

function removeLmsQuizVariantQuestion(variantId, questionId) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    if (!variant) return;
    variant.questions = (variant.questions || []).filter(question => question.id !== questionId);
    variant.customized = true;
    rerenderCurrentLmsQuizWorkspace();
}

function addBaseQuestionToLmsQuizVariant(variantId, sourceQuestionId) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const sourceQuestion = draft?.questions?.find(item => item.id === sourceQuestionId);
    if (!variant || !sourceQuestion) return;
    variant.questions = Array.isArray(variant.questions) ? variant.questions : [];
    variant.questions.push(cloneLmsQuizQuestionForVariant(sourceQuestion));
    variant.customized = true;
    rerenderCurrentLmsQuizWorkspace();
}

function replaceLmsQuizVariantQuestionWithBaseQuestion(variantId, questionId, sourceQuestionId) {
    const draft = getLmsQuizBuilderDraft();
    const variant = draft?.variants?.find(item => item.id === variantId);
    const sourceQuestion = draft?.questions?.find(item => item.id === sourceQuestionId);
    if (!variant || !sourceQuestion) return;
    const targetIndex = (variant.questions || []).findIndex(item => item.id === questionId);
    if (targetIndex === -1) return;
    variant.questions[targetIndex] = cloneLmsQuizQuestionForVariant(sourceQuestion);
    variant.customized = true;
    rerenderCurrentLmsQuizWorkspace();
}

function setLmsQuizQuestionType(questionId, type) {
    const draft = getLmsQuizBuilderDraft();
    const question = draft?.questions?.find(item => item.id === questionId);
    if (!question) return;
    question.type = String(type || 'mcq') === 'written' ? 'written' : 'mcq';
    if (question.type === 'written') {
        question.options = [];
        question.optionCount = 0;
        question.correctOption = null;
    } else {
        const count = Math.min(6, Math.max(2, parseInt(question.optionCount, 10) || 4));
        question.optionCount = count;
        question.options = Array.from({ length: count }, (_, index) => String(question.options?.[index] || ''));
        question.correctOption = Number.isFinite(Number(question.correctOption)) ? Number(question.correctOption) : 0;
    }
    rerenderCurrentLmsQuizWorkspace();
}

function setLmsQuizQuestionOptionCount(questionId, count) {
    const draft = getLmsQuizBuilderDraft();
    const question = draft?.questions?.find(item => item.id === questionId);
    if (!question || String(question.type || 'mcq') === 'written') return;
    const optionCount = Math.min(6, Math.max(2, parseInt(count, 10) || 4));
    question.optionCount = optionCount;
    question.options = Array.from({ length: optionCount }, (_, index) => String(question.options?.[index] || ''));
    question.correctOption = Math.min(optionCount - 1, Math.max(0, parseInt(question.correctOption, 10) || 0));
    rerenderCurrentLmsQuizWorkspace();
}

function updateLmsQuizQuestionOptionText(questionId, optionIndex, value) {
    const draft = getLmsQuizBuilderDraft();
    const question = draft?.questions?.find(item => item.id === questionId);
    if (!question || !Array.isArray(question.options)) return;
    question.options[optionIndex] = value;
}

function setLmsQuizQuestionCorrectOption(questionId, optionIndex) {
    const draft = getLmsQuizBuilderDraft();
    const question = draft?.questions?.find(item => item.id === questionId);
    if (!question) return;
    question.correctOption = optionIndex;
}

function addLmsQuizQuestion() {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    const question = createLmsQuizBuilderQuestion();
    uiState.editorDraft.questions.push(question);
    uiState.activeQuestionId = question.id;
    rerenderCurrentLmsQuizWorkspace();
}

function removeActiveLmsQuizBuilderQuestion() {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    if (!uiState?.editorDraft?.questions?.length || uiState.editorDraft.questions.length === 1) return;
    uiState.editorDraft.questions = uiState.editorDraft.questions.filter(question => question.id !== uiState.activeQuestionId);
    uiState.activeQuestionId = uiState.editorDraft.questions[0]?.id || null;
    rerenderCurrentLmsQuizWorkspace();
}

function stepLmsQuizBuilderQuestion(direction) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    const draft = uiState?.editorDraft;
    if (!draft) return;
    const activeIndex = draft.questions.findIndex(question => question.id === uiState.activeQuestionId);
    const nextIndex = activeIndex + Number(direction || 0);
    if (nextIndex < 0 || nextIndex >= draft.questions.length) return;
    uiState.activeQuestionId = draft.questions[nextIndex].id;
    rerenderCurrentLmsQuizWorkspace();
}

function getLmsQuizStatusBadge(status) {
    const meta = {
        draft: { label: 'Draft', bg: '#f8fafc', color: '#64748b' },
        upcoming: { label: 'Upcoming', bg: '#eff6ff', color: '#1d4ed8' },
        open: { label: 'Open', bg: '#ecfdf5', color: '#047857' },
        'in-progress': { label: 'In Progress', bg: '#fff7ed', color: '#c2410c' },
        submitted: { label: 'Submitted', bg: '#f5f3ff', color: '#7c3aed' },
        graded: { label: 'Graded', bg: '#ecfeff', color: '#0f766e' },
        closed: { label: 'Closed', bg: '#fef2f2', color: '#dc2626' }
    };
    return meta[status] || meta.draft;
}

function loadLmsQuizDraftForEdit(quizId) {
    closeLmsQuizBoardModal();
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const quiz = ensureLmsQuizBuilderWorkspace(context.resourceKey).drafts.find(item => String(item.id) === String(quizId));
    if (!quiz) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    uiState.editorDraft = normalizeLmsQuizBuilderDraftState(JSON.parse(JSON.stringify({
        editingQuizId: quiz.id,
        title: quiz.title || '',
        subjectId: quiz.subjectId || context.courseId,
        subjectName: quiz.subjectName || context.subject?.name || context.courseId,
        groupId: quiz.groupId || quiz.assignedGroupId || context.groupId,
        groupName: quiz.groupName || quiz.assignedGroupName || context.group?.name || context.groupId,
        assessmentType: quiz.assessmentType || 'quiz',
        assessmentNumber: normalizeAssessmentNumber(quiz.assessmentNumber, 1),
        weekLabel: quiz.weekLabel || context.weeks?.[0] || 'Week 1',
        availableFrom: quiz.availableFrom || '',
        availableUntil: quiz.availableUntil || '',
        durationMinutes: quiz.durationMinutes || 20,
        instructions: quiz.instructions || '',
        publishMode: quiz.publishMode || 'manual',
        allowedStudentIds: Array.isArray(quiz.allowedStudentIds) ? [...quiz.allowedStudentIds] : [],
        requiresBlueExamNetwork: quiz.requiresBlueExamNetwork === true,
        attendanceGateEnabled: quiz.attendanceGateEnabled !== false,
        variantEnabled: quiz.variantEnabled === true,
        variantCount: Math.min(8, Math.max(1, parseInt(quiz.variantCount, 10) || (quiz.variants || []).length || 3)),
        questionsPerVariant: Math.max(1, parseInt(quiz.questionsPerVariant, 10) || Math.min((quiz.questions || []).length || 1, 10)),
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        questions: normalizeLmsQuizQuestionList(quiz.questions),
        variants: normalizeLmsQuizVariantList(quiz.variants)
    })), context);
    uiState.activeQuestionId = uiState.editorDraft.questions[0]?.id || null;
    uiState.activeVariantId = uiState.editorDraft.variants[0]?.id || null;
    rerenderCurrentLmsQuizWorkspace();
}

function deleteLmsQuizDraft(quizId) {
    closeLmsQuizBoardModal();
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    if (!confirm('Delete this draft quiz from the current LMS group?')) return;
    removeLmsQuizWorkspaceRecord(context.resourceKey, quizId);
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    if (String(uiState.editorDraft?.editingQuizId || '') === String(quizId)) {
        resetLmsQuizBuilderDraft(context.resourceKey);
    }
    saveState();
    rerenderCurrentLmsQuizWorkspace();
}

function saveLmsQuizBuilderDraft() {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) {
        alert('Open a valid LMS group first.');
        return;
    }
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    const draft = uiState?.editorDraft
        ? (uiState.editorDraft = normalizeLmsQuizBuilderDraftState(uiState.editorDraft, context))
        : null;
    if (!draft) return;
    if (!String(draft.title || '').trim()) {
        alert('Please enter a quiz title.');
        return;
    }
    const normalizedWeek = normalizeLmsWeekLabel(draft.weekLabel || '');
    if (!normalizedWeek || normalizedWeek === 'No Week / General') {
        alert('Please choose the current week first.');
        return;
    }

    const existingQuiz = draft.editingQuizId ? getLmsQuizById(context.resourceKey, draft.editingQuizId) : null;
    if (existingQuiz && getLmsQuizLifecycleStatus(existingQuiz) !== 'draft') {
        alert('Only draft quizzes can be edited. Published quizzes are locked.');
        return;
    }

    const normalizedQuestions = normalizeLmsQuizQuestionList(draft.questions);
    const variantEnabled = draft.variantEnabled === true;
    const normalizedVariantCount = Math.min(8, Math.max(1, parseInt(draft.variantCount, 10) || 1));
    const normalizedQuestionsPerVariant = Math.max(1, parseInt(draft.questionsPerVariant, 10) || Math.min(normalizedQuestions.length || 1, 10));
    const normalizedVariants = variantEnabled ? normalizeLmsQuizVariantList(draft.variants) : [];
    if (variantEnabled) {
        if (normalizedQuestions.length < normalizedQuestionsPerVariant) {
            alert(`Base pool needs at least ${normalizedQuestionsPerVariant} questions before this variant set can be saved.`);
            return;
        }
        if (!normalizedVariants.length) {
            alert('Generate at least one quiz variant before saving this variant set.');
            return;
        }
        if (normalizedVariants.length !== normalizedVariantCount) {
            alert(`This draft is configured for ${normalizedVariantCount} variants, but ${normalizedVariants.length} variant tabs currently exist. Regenerate variants or adjust the variant count before saving.`);
            return;
        }
    }

    const assessmentType = normalizeLmsQuizAssessmentType(draft.assessmentType || 'quiz');
    const assessmentNumber = existingQuiz && normalizeLmsQuizAssessmentType(existingQuiz.assessmentType || 'quiz') === assessmentType
        ? normalizeAssessmentNumber(existingQuiz.assessmentNumber, 1)
        : getNextLmsQuizAssessmentNumber(context.resourceKey, assessmentType, draft.editingQuizId);

    const savedQuiz = saveLmsQuizWorkspaceRecord(context.resourceKey, {
        id: draft.editingQuizId || makeAdminExamEntityId('lms-quiz'),
        resourceKey: context.resourceKey,
        subjectId: context.subject?.id || context.courseId,
        subjectName: context.subject?.name || context.courseId,
        groupId: context.group?.id || context.groupId,
        groupName: context.group?.name || context.groupId,
        assignedGroupId: context.group?.id || context.groupId,
        assignedGroupName: context.group?.name || context.groupId,
        assessmentType,
        assessmentNumber,
        weekLabel: normalizedWeek,
        title: String(draft.title || '').trim(),
        instructions: String(draft.instructions || '').trim(),
        questions: normalizedQuestions,
        variantEnabled,
        variantCount: normalizedVariantCount,
        questionsPerVariant: normalizedQuestionsPerVariant,
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        variants: normalizedVariants,
        studentVariantMap: variantEnabled
            ? normalizeLmsQuizStudentVariantMap(existingQuiz?.studentVariantMap || {}, normalizedVariants)
            : {},
        durationMinutes: Math.max(1, parseInt(draft.durationMinutes, 10) || 20),
        availableFrom: String(draft.availableFrom || '').trim(),
        availableUntil: String(draft.availableUntil || '').trim(),
        status: 'draft',
        allowedStudentIds: normalizeLmsQuizBuilderAllowedStudentIds(draft.allowedStudentIds),
        publishedAt: existingQuiz?.publishedAt || null,
        publishedBy: existingQuiz?.publishedBy || '',
        publishMode: existingQuiz?.publishMode || 'manual',
        lockedAfterPublish: true,
        attendanceMode: 'manual-access-list',
        attendanceRequired: true,
        requiresBlueExamNetwork: draft.requiresBlueExamNetwork === true,
        blueSessionMode: 'helper-session',
        attendanceGateEnabled: draft.attendanceGateEnabled !== false,
        isPublished: false,
        createdAt: existingQuiz?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    syncLmsQuizRoster(context.resourceKey, savedQuiz);
    resetLmsQuizBuilderDraft(context.resourceKey);
    saveState();
    rerenderCurrentLmsQuizWorkspace();
    requestAnimationFrame(() => {
        const quizCard = document.querySelector(`[data-quiz-id="${savedQuiz.id}"]`);
        if (quizCard) quizCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    alert(`${getLmsQuizDisplayLabel(savedQuiz)} saved as draft. Students still will not see it until you publish it.`);
}

function openLmsStudentQuiz(resourceKey, quizId) {
    const quiz = getLmsQuizById(resourceKey, quizId);
    const studentId = resolveLmsQuizStudentMeta(resourceKey, quiz).id;
    if (!quiz || !['published', 'closed'].includes(getLmsQuizLifecycleStatus(quiz)) || !isStudentAllowedForLmsQuiz(resourceKey, quiz, studentId)) {
        alert('This quiz is not available for your account.');
        return;
    }
    const submission = getLmsQuizSubmission(resourceKey, quizId, studentId);
    if (isLmsQuizPostSubmitLocked(submission)) {
        alert(getLmsQuizPostSubmitLockMessage(submission) || 'Quiz access is temporarily locked after submission.');
        return;
    }
    const terminalStatus = ['submitted', 'auto-submitted', 'graded'].includes(String(submission?.status || ''));
    if (!terminalStatus && !isProtectedQuizSessionAuthorized(resourceKey, quizId)) {
        launchProtectedQuizInAntiCheat(resourceKey, quizId);
        return;
    }
    syncLmsExamSessionLifecycle(quiz);
    const uiState = ensureLmsQuizUiState(resourceKey);
    uiState.studentQuizId = String(quizId);
    uiState.studentRevealQuizId = null;
    if (isLmsQuizBlueExamRequired(quiz)) {
        ensureKiuBlueStatusSoon();
    }
renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
}

function backToStudentLmsQuizList(resourceKey) {
    const canonicalResourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const focusState = getLmsStudentQuizFocusState();
    if (focusState.active && String(focusState.resourceKey || '') === String(canonicalResourceKey || '')) {
        const activeResourceKey = focusState.resourceKey;
        const activeQuizId = focusState.quizId;
        const activeStudentId = focusState.studentId;
        const activeStudentName = focusState.studentName || `Student ${activeStudentId}`;
        const quiz = getLmsQuizById(activeResourceKey, activeQuizId);
        const submission = getLmsQuizSubmission(activeResourceKey, activeQuizId, activeStudentId);
        if (quiz && submission && String(submission.status || '') === 'in-progress') {
            const confirmed = window.confirm('Leaving the protected quiz view will submit your current attempt immediately. Continue?');
            if (!confirmed) {
                return;
            }
            recordLmsQuizProctorEvent(activeResourceKey, activeQuizId, {
                id: activeStudentId,
                name: activeStudentName
            }, 'left-protected-view', 'Student left the protected quiz view before finishing');
            submission.proctorAutoSubmittedAt = new Date().toISOString();
            submission.proctorAutoSubmitReason = 'Student left the protected quiz view before finishing';
            finalizeLmsQuizSubmission(activeResourceKey, quiz, submission, activeStudentId, activeStudentName, 'auto-submit');
            submission.history = Array.isArray(submission.history) ? submission.history : [];
            submission.history.push({
                action: 'proctor-auto-submitted',
                updatedAt: submission.proctorAutoSubmittedAt,
                updatedBy: 'Quiz protection',
                note: submission.proctorAutoSubmitReason
            });
            saveState();
            stopKiuBlueStudentHeartbeat({ unregister: true });
            disableLmsStudentQuizFocusMode();
            redirectStudentAfterQuizSubmission(activeResourceKey);
            return;
        }
    }
    const uiState = ensureLmsQuizUiState(resourceKey);
    uiState.studentQuizId = null;
    uiState.studentRevealQuizId = null;
    stopKiuBlueStudentHeartbeat({ unregister: true });
    disableLmsStudentQuizFocusMode();
renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
}

function redirectStudentAfterQuizSubmission(resourceKey, fallbackSubject = null, fallbackGroup = null) {
    const uiState = ensureLmsQuizUiState(resourceKey);
    uiState.studentQuizId = null;
    uiState.studentRevealQuizId = null;
    if (typeof switchLMSTab === 'function') {
        switchLMSTab('interaction');
        return;
    }
    renderStudentLmsQuizSection(currentCourseId, fallbackSubject, fallbackGroup);
}

async function startLmsStudentQuiz(resourceKey, quizId) {
    const quiz = getLmsQuizById(resourceKey, quizId);
    const studentMeta = resolveLmsQuizStudentMeta(resourceKey, quiz);
    const studentId = studentMeta.id;
    const studentName = studentMeta.name;
    if (!quiz) return;
    if (!isProtectedQuizSessionAuthorized(resourceKey, quizId)) {
        await launchProtectedQuizInAntiCheat(resourceKey, quizId);
        return;
    }
    syncLmsExamSessionLifecycle(quiz);
    if (getLmsQuizLifecycleStatus(quiz) !== 'published' || !isStudentAllowedForLmsQuiz(resourceKey, quiz, studentId)) {
        alert('You are not allowed to open this quiz.');
        return;
    }
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, studentMeta);
    syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, studentMeta);
    const sessionGate = getLmsQuizExamSessionGateStatus(resourceKey, quiz, submission, studentId);
    if (sessionGate.required && !sessionGate.startUnlocked) {
        alert(sessionGate.message || 'This lab exam session is locked for your account.');
renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
        return;
    }
    if (isLmsQuizBlueExamRequired(quiz)) {
        await ensureKiuBlueStudentHeartbeat(resourceKey, quiz, studentMeta);
        syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, studentMeta);
        const blueGate = getLmsQuizBlueGateStatus(resourceKey, quiz, submission, studentId);
        if (!blueGate.startUnlocked) {
            alert(blueGate.message || 'Exam verification is required before this quiz can start.');
renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
            return;
        }
    }
    ensureLmsStudentQuizAttemptActive(resourceKey, quiz, { id: studentId, name: studentName });
    enableLmsStudentQuizFocusMode(resourceKey, quizId, { id: studentId, name: studentName });
    if (document.documentElement && typeof document.documentElement.requestFullscreen === 'function') {
        Promise.resolve(document.documentElement.requestFullscreen()).catch(() => null);
    }
    const uiState = ensureLmsQuizUiState(resourceKey);
    uiState.studentQuizId = String(quizId);
    uiState.studentRevealQuizId = String(quizId);
renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
}

function revealLmsStudentQuiz(resourceKey, quizId) {
    return startLmsStudentQuiz(resourceKey, quizId);
}

syncLmsStudentQuizFocusChrome(getLmsStudentQuizFocusState());

function updateLmsQuizDraftAnswer(resourceKey, quizId, questionId, field, value) {
    const quiz = getLmsQuizById(resourceKey, quizId);
    const studentMeta = resolveLmsQuizStudentMeta(resourceKey, quiz);
    const studentId = studentMeta.id;
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, studentMeta);
    syncLmsQuizSubmissionVariant(quiz, submission, studentId);
    submission.draftAnswers = submission.draftAnswers || {};
    submission.draftAnswers[questionId] = submission.draftAnswers[questionId] || {};
    submission.draftAnswers[questionId][field] = field === 'selectedOption' ? parseInt(value, 10) : value;
    if (!submission.startedAt) {
        submission.startedAt = new Date().toISOString();
        submission.status = 'in-progress';
    }
    saveState();
}

async function submitLmsStudentQuiz(resourceKey, quizId) {
    const quiz = getLmsQuizById(resourceKey, quizId);
    const studentMeta = resolveLmsQuizStudentMeta(resourceKey, quiz);
    const studentId = studentMeta.id;
    const studentName = studentMeta.name;
    if (!quiz) return;
    if (!isProtectedQuizSessionAuthorized(resourceKey, quizId)) {
        alert('This protected quiz can only be submitted from the anti-cheat app.');
        return;
    }
    if (getLmsQuizLifecycleStatus(quiz) !== 'published' || !isStudentAllowedForLmsQuiz(resourceKey, quiz, studentId)) {
        alert('This quiz is not available for your account.');
        return;
    }
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, studentMeta);
    syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, studentMeta);
    if (submission.status !== 'in-progress') {
        alert('Start the quiz first.');
        return;
    }
    const sessionGate = getLmsQuizExamSessionGateStatus(resourceKey, quiz, submission, studentId);
    if (sessionGate.required && !sessionGate.submitUnlocked) {
        alert(sessionGate.message || 'This lab exam session is no longer accepting submissions.');
        renderStudentLmsQuizSection(currentCourseId);
        return;
    }
    if (isLmsQuizBlueExamRequired(quiz)) {
        await refreshKiuBlueHelperState({ force: true });
        syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, { id: studentId, name: studentName });
        const blueGate = getLmsQuizBlueGateStatus(resourceKey, quiz, submission, studentId);
        if (!blueGate.startUnlocked || blueGate.blankAttempt) {
            alert(blueGate.message || 'Reconnect to exam verification before submitting this quiz.');
            renderStudentLmsQuizSection(currentCourseId);
            return;
        }
    }
    finalizeLmsQuizSubmission(resourceKey, quiz, submission, studentId, studentName, 'manual-submit');

    saveState();
    stopKiuBlueStudentHeartbeat({ unregister: true });
    disableLmsStudentQuizFocusMode();
    redirectStudentAfterQuizSubmission(resourceKey);
}

function renderLmsQuizLifecycleCard(context, quiz, sectionType) {
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    const lifecycle = getLmsQuizLifecycleStatus(quiz);
    const stats = getLmsQuizSubmissionStats(context.resourceKey, quiz);
    const allowCountLabel = `${stats.allowedCount}/${stats.totalEligible}`;
    const variantSummary = getLmsQuizVariantSummary(quiz);
    const variantAssignments = getLmsQuizVariantAssignmentSummary(quiz);
    const hasLiveAlerts = stats.alertCount > 0;
    const latestAlertLabel = stats.latestAlert
        ? `${stats.latestAlert.note || stats.latestAlert.type || 'Monitoring event'}  -  ${formatLmsDateTime(stats.latestAlert.createdAt)}`
        : '';
    const statusColors = lifecycle === 'draft'
        ? { bg: '#f8fafc', color: '#64748b' }
        : lifecycle === 'published'
            ? { bg: '#ecfdf5', color: '#047857' }
            : { bg: '#fef2f2', color: '#b91c1c' };
    const showReviewPanel = false;
    return `
        <div data-quiz-id="${escapeHtml(quiz.id)}" style="background:white; border:1px solid #dbe7f5; border-radius:18px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                <div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <span style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</span>
                        <span style="background:${statusColors.bg}; color:${statusColors.color}; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:800;">${escapeHtml(lifecycle)}</span>
                        ${quiz.variantEnabled ? `<span style="background:rgba(var(--lux-accent-rgb),0.05); color:var(--lux-accent); padding:6px 10px; border-radius:999px; font-size:11px; font-weight:800;">Variant Set</span>` : ''}
                        ${hasLiveAlerts ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:rgba(220,38,38,0.06); color:#dc2626; font-size:11px; font-weight:900; border:1px solid rgba(239,68,68,0.18);"><span class="lms-monitor-pulse-dot"></span> Live Alert</span>` : ''}
                    </div>
                    <div style="font-size:16px; font-weight:800; color:var(--kiu-navy); margin-top:6px;">${escapeHtml(quiz.title || 'Untitled Quiz')}</div>
                        <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">${quiz.availableFrom ? `Starts ${escapeHtml(formatLmsDateTime(quiz.availableFrom))}` : 'Starts immediately'}${quiz.availableUntil ? `  -  Ends ${escapeHtml(formatLmsDateTime(quiz.availableUntil))}` : ''}${variantSummary ? `  -  ${escapeHtml(variantSummary)}` : ''}</div>
                    <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">Published by: ${escapeHtml(quiz.publishedBy || 'Not published yet')}</div>
                    ${getLmsQuizLifecycleStatus(quiz) !== 'draft' ? `<div style="font-size:11px; color:var(--lux-text-muted); margin-top:6px;">Mode: ${escapeHtml(String(quiz.publishMode || 'manual') === 'scheduled' ? 'Automatic publish and end by time' : 'Manual publish with manual end')}</div>` : ''}
                </div>
                <div style="background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-text-muted); padding:6px 12px; border-radius:999px; font-size:12px; font-weight:800;">${escapeHtml(String(getAdminQuizTotalScore(quiz)))} pts</div>
            </div>
            ${hasLiveAlerts ? `<div style="margin-top:14px; padding:14px 16px; border-radius:16px; background:rgba(var(--lux-accent-rgb),0.06); border:1px solid rgba(249,115,22,0.22); color:var(--lux-text-muted);">
                <div style="display:flex; justify-content:space-between; gap:10px; flex-wrap:wrap; align-items:center;">
                    <div style="font-size:13px; font-weight:800; display:flex; align-items:center; gap:8px;"><span class="lms-monitor-pulse-dot"></span> Live Alert: ${stats.alertCount} warning${stats.alertCount === 1 ? '' : 's'} across ${stats.alertedStudents} student${stats.alertedStudents === 1 ? '' : 's'}</div>
                    <div style="font-size:11px; font-weight:800; color:var(--lux-text-muted);">Monitor this quiz now</div>
                </div>
                ${latestAlertLabel ? `<div style="font-size:12px; margin-top:6px; color:var(--lux-text-muted);">Latest: ${escapeHtml(latestAlertLabel)}</div>` : ''}
            </div>` : ''}
            <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10px; margin-top:16px;">
                <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">${quiz.variantEnabled ? 'Base Pool' : 'Questions'}</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(String((quiz.questions || []).length))}</div></div>
                <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">Allowed</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(allowCountLabel)}</div></div>
                <div style="padding:12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid var(--lux-border);"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:var(--lux-text-muted);">Pending Review</div><div style="font-size:22px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(String(stats.pendingReviewCount))}</div></div>
                <div style="padding:12px; border-radius:14px; background:${hasLiveAlerts ? '#fff7ed' : '#f8fbff'}; border:1px solid ${hasLiveAlerts ? 'rgba(249,115,22,0.22)' : '#e2e8f0'};"><div style="font-size:10px; text-transform:uppercase; font-weight:800; color:${hasLiveAlerts ? '#c2410c' : '#64748b'};">${hasLiveAlerts ? 'Live Alerts' : (quiz.variantEnabled ? 'Variants' : 'Graded')}</div><div style="font-size:22px; font-weight:900; color:${hasLiveAlerts ? '#9a3412' : 'var(--kiu-navy)'}; margin-top:4px;">${escapeHtml(String(hasLiveAlerts ? stats.alertCount : (quiz.variantEnabled ? ((quiz.variants || []).length || 0) : stats.gradedCount)))}</div></div>
            </div>
            <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
                ${sectionType === 'draft'
                    ? `<button class="kiu-btn-outline" data-lms-click="loadLmsQuizDraftForEdit(${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-pen"></i> Edit Draft</button>
                       <button class="kiu-btn-blue" data-lms-click="openLmsQuizAccessDialog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-paper-plane"></i> Publish</button>
                       <button class="kiu-btn-outline" data-lms-click="deleteLmsQuizDraft(${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px; color:#dc2626; border-color:#fecaca;"><i class="fas fa-trash"></i> Delete Draft</button>`
                    : `<button class="kiu-btn-outline" data-lms-click="toggleLmsQuizReviewPanel(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-users"></i> View Submissions</button>
                       <button class="kiu-btn-outline" data-lms-click="exportLmsQuizMonitoringLog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-file-export"></i> Export Monitoring</button>
                       <button class="kiu-btn-outline" data-lms-click="openLmsQuizAccessDialog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px;"><i class="fas fa-user-check"></i> Manage Access</button>
                       ${lifecycle === 'published' ? `<button class="kiu-btn-outline" data-lms-click="closeLmsQuiz(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})" style="padding:9px 14px; font-size:12px; color:var(--lux-text-muted); border-color:#fed7aa;"><i class="fas fa-stop-circle"></i> Close Quiz</button>` : ''}`}
            </div>
            ${variantAssignments.length ? `<div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">${variantAssignments.map(entry => `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:var(--lux-bg-soft); color:var(--lux-text-muted); border:1px solid #dbe7f5; font-size:11px; font-weight:800;">${escapeHtml(entry.label)}  -  ${entry.count} student${entry.count === 1 ? '' : 's'}</span>`).join('')}</div>` : ''}
        </div>
    `;
}

function renderLmsQuizBoardSection(title, description, itemsMarkup) {
    return `
        <div style="display:grid; gap:14px;">
            <div>
                <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">${title}</div>
                <div style="font-size:13px; color:var(--lux-text-muted); margin-top:4px;">${description}</div>
            </div>
            ${itemsMarkup || '<div style="background:white; border:1px dashed #cbd5e1; border-radius:18px; padding:24px; text-align:center; color:var(--lux-text-muted);">Nothing here yet.</div>'}
        </div>
    `;
}

function getRecentLmsQuizCards(quizzes = [], limit = 3) {
    return [...quizzes]
        .sort((left, right) => new Date(right?.updatedAt || right?.createdAt || 0) - new Date(left?.updatedAt || left?.createdAt || 0))
        .slice(0, limit);
}

function getLmsQuizBoardPageMeta(context, page = 'drafts') {
    const workspace = ensureLmsQuizBuilderWorkspace(context.resourceKey);
    const normalizedPage = String(page || 'drafts').trim().toLowerCase();
    if (normalizedPage === 'published') {
        return {
            key: 'published',
            title: 'Published Quizzes',
            description: 'Published quizzes are visible to allowed students only and are locked from editing.',
            sectionType: 'published',
            items: sortLmsQuizzes(workspace.published)
        };
    }
    if (normalizedPage === 'review') {
        return {
            key: 'review',
            title: 'Review Queue',
            description: 'These quizzes already have student submissions waiting for TA or professor review.',
            sectionType: 'review',
            items: sortLmsQuizzes(ensureLmsQuizzesForKey(context.resourceKey).filter(quiz => getLmsQuizSubmissionStats(context.resourceKey, quiz).pendingReviewCount > 0))
        };
    }
    if (normalizedPage === 'results') {
        return {
            key: 'results',
            title: 'Results',
            description: 'Closed quizzes remain available for submission review, grading, and score verification.',
            sectionType: 'results',
            items: sortLmsQuizzes(workspace.closed)
        };
    }
    return {
        key: 'drafts',
        title: 'Draft Quizzes',
        description: 'Drafts are visible to staff only until you publish them to the selected students in class.',
        sectionType: 'draft',
        items: sortLmsQuizzes(workspace.drafts)
    };
}

function getLmsQuizWorkspaceAlertSummary(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quizzes = ensureLmsQuizzesForKey(resourceKey);
    const summary = {
        alertCount: 0,
        alertedStudents: 0,
        quizzesWithAlerts: 0,
        latestAlert: null
    };
    quizzes.forEach(quiz => {
        const stats = getLmsQuizSubmissionStats(resourceKey, quiz);
        if (!stats.alertCount) return;
        summary.alertCount += stats.alertCount;
        summary.alertedStudents += stats.alertedStudents;
        summary.quizzesWithAlerts += 1;
        if (stats.latestAlert?.createdAt) {
            const currentTime = summary.latestAlert?.createdAt ? new Date(summary.latestAlert.createdAt).getTime() : 0;
            const nextTime = new Date(stats.latestAlert.createdAt).getTime();
            if (!summary.latestAlert || nextTime >= currentTime) {
                summary.latestAlert = stats.latestAlert;
            }
        }
    });
    return summary;
}

function ensureLmsMonitoringVisualStyles() {
    if (document.getElementById('lms-monitoring-visual-styles')) return;
    const style = document.createElement('style');
    style.id = 'lms-monitoring-visual-styles';
    style.textContent = `
        @keyframes lmsMonitorPulse {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.55); opacity: 0.95; }
            70% { transform: scale(1.08); box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); opacity: 1; }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); opacity: 0.95; }
        }
        .lms-monitor-pulse-dot {
            width: 10px;
            height: 10px;
            border-radius: 999px;
            background:#dc2626;
            display: inline-block;
            animation: lmsMonitorPulse 1.6s infinite;
        }
        @keyframes lmsMonitorFlash {
            0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.0); }
            30% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.16); }
            60% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0.06); }
        }
        .lms-monitor-flash-panel {
            animation: lmsMonitorFlash 1.8s ease-in-out 3;
        }
    `;
    document.head.appendChild(style);
}

function getLmsQuizLiveMonitorEntries(resourceKey, options = {}) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const runningOnly = options.runningOnly !== false;
    const ackFilter = ['all', 'acknowledged', 'unacknowledged'].includes(String(options.ackFilter || ''))
        ? String(options.ackFilter)
        : 'all';
    const quizzes = ensureLmsQuizzesForKey(resourceKey).filter(quiz => {
        const lifecycle = getLmsQuizLifecycleStatus(quiz);
        if (runningOnly) return lifecycle === 'published';
        return lifecycle === 'published' || lifecycle === 'closed';
    });
    const students = getLmsQuizEligibleStudents(resourceKey);
    const entries = [];
    quizzes.forEach(quiz => {
        students.forEach(student => {
            if (!isStudentAllowedForLmsQuiz(resourceKey, quiz, student.id)) return;
            const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, student);
            const availability = getLmsQuizAvailabilityState(quiz, submission);
            const alertCount = getLmsQuizProctorAlertCount(submission);
            const latestAlert = getLmsQuizLatestProctorEvent(submission);
            if (!alertCount || !latestAlert) return;
            if (runningOnly && !['open', 'in-progress'].includes(String(availability || ''))) return;
            entries.push({
                quizId: quiz.id,
                quizTitle: quiz.title || getLmsQuizDisplayLabel(quiz),
                quizLabel: getLmsQuizDisplayLabel(quiz),
                studentId: student.id,
                studentName: student.name,
                alertCount,
                latestAlert,
                availability,
                acknowledgedAt: submission.proctorAcknowledgedAt || null,
                isAcknowledged: Boolean(submission.proctorAcknowledgedAt && latestAlert?.createdAt && new Date(submission.proctorAcknowledgedAt).getTime() >= new Date(latestAlert.createdAt).getTime()),
                attendanceStatus: submission.attendanceStatus || 'Not checked',
                submissionStatus: submission.status || 'draft'
            });
        });
    });
    return entries
        .filter(entry => {
            if (ackFilter === 'acknowledged') return entry.isAcknowledged;
            if (ackFilter === 'unacknowledged') return !entry.isAcknowledged;
            return true;
        })
        .sort((left, right) => new Date(right.latestAlert?.createdAt || 0) - new Date(left.latestAlert?.createdAt || 0));
}

function renderLmsQuizBoardPagePreview(context, page = 'drafts', limit = 3) {
    const meta = getLmsQuizBoardPageMeta(context, page);
    const previewItems = getRecentLmsQuizCards(meta.items, limit);
    const cards = previewItems.map(quiz => renderLmsQuizLifecycleCard(context, quiz, meta.sectionType)).join('');
    const summary = meta.items.length > limit
        ? `<div style="font-size:12px; color:var(--lux-text-muted);">Showing latest ${previewItems.length} of ${meta.items.length} quizzes.</div>`
        : '';
    return `
        <div style="display:grid; gap:14px;">
            ${renderLmsQuizBoardSection(meta.title, meta.description, cards)}
            ${summary}
        </div>
    `;
}

function renderLmsQuizDraftBoard(context) {
    return renderLmsQuizBoardPagePreview(context, 'drafts', 3);
}

function renderLmsQuizPublishBoard(context) {
    return renderLmsQuizBoardPagePreview(context, 'published', 3);
}

function renderLmsQuizReviewBoard(context) {
    return renderLmsQuizBoardPagePreview(context, 'review', 3);
}

function renderLmsQuizResultsBoard(context) {
    return renderLmsQuizBoardPagePreview(context, 'results', 3);
}

function closeLmsQuizFloatingLayers() {
    document.getElementById('lms-quiz-board-modal')?.remove();
    document.getElementById('lms-quiz-review-board-modal')?.remove();
    document.getElementById('lms-quiz-access-overlay')?.remove();
    document.getElementById('lms-quiz-review-modal')?.remove();
}

function closeLmsQuizOverlays() {
    disableLmsStudentQuizFocusMode();
    closeLmsQuizFloatingLayers();
}

function closeLmsQuizBoardModal() {
    document.getElementById('lms-quiz-board-modal')?.remove();
}

function openLmsQuizBoardModal(page = null) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    ensureLmsMonitoringVisualStyles();
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    const targetPage = String(page || uiState.boardPage || 'drafts').trim().toLowerCase();
    const meta = getLmsQuizBoardPageMeta(context, targetPage);
    const workspace = ensureLmsQuizBuilderWorkspace(context.resourceKey);
    const alertSummary = getLmsQuizWorkspaceAlertSummary(context.resourceKey);
    const modalTabs = [
        { key: 'drafts', label: `Draft Quizzes (${workspace.drafts.length})` },
        { key: 'published', label: `Published (${workspace.published.length}${alertSummary.quizzesWithAlerts ? `  -  ${alertSummary.quizzesWithAlerts} alert` : ''})` },
        { key: 'review', label: `Review Queue (${getLmsQuizBoardPageMeta(context, 'review').items.length}${alertSummary.alertCount ? `  -  ${alertSummary.alertCount} warn` : ''})` },
        { key: 'results', label: `Results (${workspace.closed.length})` }
    ];
    closeLmsQuizFloatingLayers();
    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-board-modal';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:7800; background:rgba(15,23,42,0.74); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:18px;';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizBoardModal();
    };
    overlay.innerHTML = `
        <div style="width:min(1380px, 100%); height:min(90vh, 100%); background:var(--lux-bg-soft); border-radius:28px; border:1px solid rgba(148,163,184,0.18); box-shadow:0 28px 80px rgba(15,23,42,0.35); overflow:hidden; display:grid; grid-template-rows:auto 1fr;">
            <div style="padding:18px 22px; background:linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue)); color:white; display:flex; align-items:flex-start; justify-content:space-between; gap:12px;">
                <div>
                    <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8;">Quiz Board</div>
                    <div style="font-size:24px; font-weight:900; margin-top:6px;">${escapeHtml(meta.title)}  -  ${escapeHtml(context.subject?.name || context.courseId)}  -  ${escapeHtml(context.group?.name || context.groupId)}</div>
                    <div style="font-size:13px; opacity:0.92; margin-top:6px;">${escapeHtml(meta.description)}</div>
                </div>
                <button type="button" class="kiu-btn-outline" data-lms-click="closeLmsQuizBoardModal()" style="border-color:rgba(255,255,255,0.35); color:white; background:rgba(255,255,255,0.08);"><i class="fas fa-times"></i> Close</button>
            </div>
            <div style="padding:22px; overflow:auto; display:grid; gap:18px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        ${modalTabs.map(tab => `
                            <button type="button" data-lms-click="openLmsQuizBoardModal(${jsQuote(tab.key)})" class="${targetPage === tab.key ? 'kiu-btn-blue' : 'kiu-btn-outline'}" style="padding:10px 14px; font-size:12px; border-radius:999px;">
                                ${escapeHtml(tab.label)}
                            </button>
                        `).join('')}
                    </div>
                    <div style="background:white; border:1px solid #dbe7f5; border-radius:999px; padding:10px 14px; font-size:12px; font-weight:800; color:var(--lux-text-muted);">
                        ${escapeHtml(String(meta.items.length))} total in this section
                    </div>
                </div>
                ${meta.items.length
                    ? meta.items.map(quiz => renderLmsQuizLifecycleCard(context, quiz, meta.sectionType)).join('')
                    : '<div style="background:white; border:1px dashed #cbd5e1; border-radius:18px; padding:30px; text-align:center; color:var(--lux-text-muted);">Nothing here yet.</div>'}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function setLmsQuizBoardPage(page) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    const normalized = String(page || '').trim().toLowerCase();
    uiState.boardPage = ['drafts', 'published', 'review', 'results'].includes(normalized) ? normalized : 'drafts';
    uiState.reviewQuizId = null;
    rerenderCurrentLmsQuizWorkspace();
}

function setLmsQuizMonitorMode(mode) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    const normalized = String(mode || '').trim().toLowerCase();
    uiState.monitorMode = normalized === 'all' ? 'all' : 'running';
    rerenderCurrentLmsQuizWorkspace();
}

function setLmsQuizMonitorAckFilter(filter) {
    const context = resolveLmsQuizWorkspace(currentLmsQuizCourseKey || currentCourseId);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    const normalized = String(filter || '').trim().toLowerCase();
    uiState.monitorAckFilter = ['acknowledged', 'unacknowledged'].includes(normalized) ? normalized : 'all';
    rerenderCurrentLmsQuizWorkspace();
}

function acknowledgeLmsQuizMonitorAlert(resourceKey, quizId, studentId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, { id: studentId, name: `Student ${studentId}` });
    const latestAlert = getLmsQuizLatestProctorEvent(submission);
    if (!latestAlert?.createdAt) return;
    submission.proctorAcknowledgedAt = new Date().toISOString();
    submission.history = Array.isArray(submission.history) ? submission.history : [];
    submission.history.push({
        action: 'proctor-acknowledged',
        updatedAt: submission.proctorAcknowledgedAt,
        updatedBy: getSimulatedUserName(),
        note: `Latest monitoring alert acknowledged (${latestAlert.note || latestAlert.type || 'Monitoring event'})`
    });
    saveState();
    rerenderCurrentLmsQuizWorkspace();
}

function exportLmsQuizMonitoringLog(resourceKey, quizId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;
    const students = getLmsQuizEligibleStudents(resourceKey);
    const rows = [];
    students.forEach(student => {
        if (!isStudentAllowedForLmsQuiz(resourceKey, quiz, student.id)) return;
        const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, student);
        const events = Array.isArray(submission.proctorEvents) ? submission.proctorEvents : [];
        if (!events.length) {
            rows.push([
                student.id,
                student.name,
                quiz.title || getLmsQuizDisplayLabel(quiz),
                getLmsQuizDisplayLabel(quiz),
                '',
                submission.attendanceStatus || '',
                submission.status || '',
                '',
                '',
                submission.proctorAcknowledgedAt || ''
            ]);
            return;
        }
        events.forEach(event => {
            rows.push([
                student.id,
                student.name,
                quiz.title || getLmsQuizDisplayLabel(quiz),
                getLmsQuizDisplayLabel(quiz),
                event.type || '',
                submission.attendanceStatus || '',
                submission.status || '',
                event.note || '',
                event.createdAt || '',
                submission.proctorAcknowledgedAt || ''
            ]);
        });
    });

    const header = [
        'Student ID',
        'Student Name',
        'Quiz Title',
        'Quiz Label',
        'Event Type',
        'Attendance',
        'Submission Status',
        'Event Note',
        'Event Time',
        'Acknowledged At'
    ];
    const csv = [header, ...rows]
        .map(columns => columns.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${(quiz.title || getLmsQuizDisplayLabel(quiz) || 'quiz-monitoring').replace(/[<>:"/\\|?*]+/g, '_')}-monitoring-log.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

function renderActiveLmsQuizBoardPage(context) {
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    const currentPage = String(uiState.boardPage || 'drafts');
    if (currentPage === 'published') return renderLmsQuizPublishBoard(context);
    if (currentPage === 'review') return renderLmsQuizReviewBoard(context);
    if (currentPage === 'results') return renderLmsQuizResultsBoard(context);
    return renderLmsQuizDraftBoard(context);
}

function renderLmsStaffQuizWorkspace(context) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || !context?.resourceKey) return;
    try {
    ensureLmsMonitoringVisualStyles();
    const workspace = ensureLmsQuizBuilderWorkspace(context.resourceKey);
    const uiState = getLmsQuizBuilderEditorState(context.resourceKey);
    const boardPage = String(uiState?.boardPage || 'drafts');
    const draft = uiState?.editorDraft;
    const alertSummary = getLmsQuizWorkspaceAlertSummary(context.resourceKey);
    const monitorMode = String(uiState?.monitorMode || 'running') === 'all' ? 'all' : 'running';
    const monitorAckFilter = ['acknowledged', 'unacknowledged'].includes(String(uiState?.monitorAckFilter || ''))
        ? String(uiState.monitorAckFilter)
        : 'all';
    const liveMonitorEntries = getLmsQuizLiveMonitorEntries(context.resourceKey, {
        runningOnly: monitorMode !== 'all',
        ackFilter: monitorAckFilter
    });
    const latestMonitorAlertAt = alertSummary.latestAlert?.createdAt || null;
    const hasFreshMonitorAlert = Boolean(latestMonitorAlertAt && latestMonitorAlertAt !== uiState.lastSeenMonitorAlertAt);
    if (latestMonitorAlertAt) {
        uiState.lastSeenMonitorAlertAt = latestMonitorAlertAt;
    }
    const reviewItems = getLmsQuizBoardPageMeta(context, 'review').items;
    const activeQuestion = getActiveLmsQuizBuilderQuestion(context.resourceKey);
    const activeQuestionIndex = draft?.questions?.findIndex(question => question.id === activeQuestion?.id) ?? -1;
    const totalScore = getAdminQuizTotalScore(draft || {});
    const questionNavigator = (draft?.questions || []).map((question, index) => {
        const complete = String(question.type || 'mcq') === 'written'
            ? Boolean(String(question.text || '').trim() && String(question.expectedAnswer || '').trim())
            : (Boolean(String(question.text || '').trim()) && !(question.options || []).slice(0, question.optionCount || 0).some(option => !String(option || '').trim()));
        const isActive = question.id === activeQuestion?.id;
        return `
            <button type="button" data-lms-click="setActiveLmsQuizBuilderQuestion(${jsQuote(question.id)})" style="display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%; padding:12px 14px; border:1px solid ${isActive ? '#60a5fa' : '#dbe7f5'}; border-radius:16px; background:${isActive ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#ffffff'}; color:var(--lux-text); cursor:pointer; text-align:left; box-shadow:${isActive ? '0 12px 28px rgba(37,99,235,0.12)' : 'none'};">
                <span style="font-size:12px; font-weight:800;">Q${index + 1}</span>
                <span style="font-size:10px; font-weight:800; color:var(--lux-text-muted);">${String(question.type || 'mcq') === 'written' ? 'Written' : 'MCQ'}</span>
                <span style="font-size:10px; font-weight:800; color:${complete ? '#047857' : '#c2410c'};">${complete ? 'Ready' : 'Draft'}</span>
            </button>
        `;
    }).join('');
    const activeQuestionType = String(activeQuestion?.type || 'mcq');
    const activeOptionControls = activeQuestion && activeQuestionType !== 'written'
        ? Array.from({ length: activeQuestion.optionCount || 0 }, (_, optionIndex) => `
            <div style="display:flex; align-items:center; gap:10px; margin-top:10px; padding:10px 12px; border:1px solid #dbe7f5; border-radius:14px; background:var(--lux-bg-soft);">
                <input type="radio" name="lms-quiz-correct-${escapeHtml(activeQuestion.id)}" ${activeQuestion.correctOption === optionIndex ? 'checked' : ''} data-lms-change="setLmsQuizQuestionCorrectOption(${jsQuote(activeQuestion.id)}, ${optionIndex})" title="Correct answer" />
                <div style="width:26px; height:26px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.08); color:var(--kiu-blue); font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;">${String.fromCharCode(65 + optionIndex)}</div>
                <input type="text" value="${escapeHtml(activeQuestion.options?.[optionIndex] || '')}" data-lms-input="updateLmsQuizQuestionOptionText(${jsQuote(activeQuestion.id)}, ${optionIndex}, this.value)" placeholder="Option ${optionIndex + 1}" style="flex:1; min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;" />
            </div>
        `).join('')
        : '';
    const activeAnswerComposer = activeQuestionType === 'written'
        ? `
            <div>
                <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--lux-text-muted); margin-bottom:6px;">Written Answer Key</div>
                <textarea rows="5" data-lms-input="updateLmsQuizQuestionField(${jsQuote(activeQuestion.id)}, 'expectedAnswer', this.value)" placeholder="Write the reference answer or grading note here..." style="width:100%; border:1px solid #dbe7f5; border-radius:16px; padding:14px 15px; resize:vertical; outline:none; background:white;">${escapeHtml(activeQuestion.expectedAnswer || '')}</textarea>
                <div style="font-size:11px; color:var(--lux-text-muted); margin-top:8px;">Students will manually type their answer for this question.</div>
            </div>
        `
        : `
            <div>
                <div style="font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em; color:var(--lux-text-muted); margin-bottom:6px;">Answer Options</div>
                ${activeOptionControls}
            </div>
        `;
    const activeVariant = getActiveLmsQuizBuilderVariant(context.resourceKey);
    const variantSummaryLabel = draft?.variantEnabled
        ? (draft?.variants?.length
            ? `${draft.variants.length} generated  -  ${draft.questionsPerVariant || 0} questions each`
            : `Enabled  -  target ${draft?.variantCount || 0} variants  -  ${draft?.questionsPerVariant || 0} questions`)
        : 'Disabled';
    const variantSetExpanded = uiState.quizVariantSetExpanded === true;
    const questionNavigatorExpanded = uiState.quizQuestionNavigatorExpanded === true;
    const questionNavigatorStatus = `${draft?.questions?.length || 0} question${(draft?.questions?.length || 0) === 1 ? '' : 's'}  -  ${totalScore} point${totalScore === 1 ? '' : 's'}`;
    const baseQuestionOptionMarkup = (draft?.questions || []).map((question, index) => `
        <option value="${escapeHtml(question.id)}">Base Q${index + 1}  -  ${escapeHtml(String(question.text || '').trim() || 'Untitled question')}</option>
    `).join('');
    const variantTabsMarkup = (draft?.variants || []).map((variant, index) => `
        <button type="button" data-lms-click="setActiveLmsQuizBuilderVariant(${jsQuote(variant.id)})" style="padding:10px 14px; border-radius:999px; border:1px solid ${activeVariant?.id === variant.id ? '#60a5fa' : '#dbe7f5'}; background:${activeVariant?.id === variant.id ? 'linear-gradient(135deg, #eff6ff, #dbeafe)' : '#ffffff'}; color:${activeVariant?.id === variant.id ? '#1d4ed8' : '#334155'}; font-size:12px; font-weight:800;">
            ${escapeHtml(variant.label || getDefaultLmsQuizVariantLabel(index))}${variant.customized ? '  -  Customized' : ''}
        </button>
    `).join('');
    const activeVariantQuestionsMarkup = activeVariant?.questions?.length
        ? activeVariant.questions.map((question, index) => {
            const questionType = String(question.type || 'mcq') === 'written' ? 'written' : 'mcq';
            const replacementSelectId = `lms-variant-replace-${toDomToken(`${activeVariant.id}-${question.id}`)}`;
            return `
                <div style="padding:16px; border:1px solid #dbe7f5; border-radius:18px; background:var(--lux-surface); display:grid; gap:12px;">
                    <div style="display:flex; justify-content:space-between; gap:10px; align-items:flex-start; flex-wrap:wrap;">
                        <div>
                            <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">${escapeHtml(activeVariant.label)}  -  Question ${index + 1}</div>
                            <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">${question.sourceQuestionId ? `From base pool  -  ${escapeHtml(question.sourceQuestionId)}` : 'Manual copy'}</div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap;">
                            <button type="button" class="kiu-btn-outline" data-lms-click="removeLmsQuizVariantQuestion(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)})" style="padding:8px 12px; font-size:11px; color:#dc2626; border-color:#fecaca;"><i class="fas fa-trash"></i> Remove</button>
                        </div>
                    </div>
                    <textarea rows="3" data-lms-input="updateLmsQuizVariantQuestionField(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, 'text', this.value)" placeholder="Variant question text..." style="width:100%; border:1px solid #dbe7f5; border-radius:14px; padding:12px 14px; resize:vertical; outline:none; background:white;">${escapeHtml(question.text || '')}</textarea>
                    <div style="display:grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(120px, 160px); gap:12px;">
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Question Type<select data-lms-change="setLmsQuizVariantQuestionType(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, this.value)" style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;"><option value="mcq" ${questionType === 'mcq' ? 'selected' : ''}>Multiple Choice</option><option value="written" ${questionType === 'written' ? 'selected' : ''}>Written Answer</option></select></label>
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Options<select data-lms-change="setLmsQuizVariantQuestionOptionCount(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, this.value)" ${questionType === 'written' ? 'disabled' : ''} style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:${questionType === 'written' ? '#f8fafc' : 'white'};">${[2,3,4,5,6].map(count => `<option value="${count}" ${Number(question.optionCount) === count ? 'selected' : ''}>${count} options</option>`).join('')}</select></label>
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Score<input type="number" min="1" step="1" value="${escapeHtml(String(question.score || 1))}" data-lms-input="updateLmsQuizVariantQuestionField(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, 'score', this.value)" style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;" /></label>
                    </div>
                    ${questionType === 'written'
                        ? `<textarea rows="3" data-lms-input="updateLmsQuizVariantQuestionField(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, 'expectedAnswer', this.value)" placeholder="Reference answer..." style="width:100%; border:1px solid #dbe7f5; border-radius:14px; padding:12px 14px; resize:vertical; outline:none; background:white;">${escapeHtml(question.expectedAnswer || '')}</textarea>`
                        : `<div style="display:grid; gap:10px;">${Array.from({ length: question.optionCount || 0 }, (_, optionIndex) => `
                            <div style="display:flex; align-items:center; gap:10px; padding:10px 12px; border:1px solid #dbe7f5; border-radius:14px; background:var(--lux-bg-soft);">
                                <input type="radio" name="lms-variant-correct-${escapeHtml(question.id)}" ${question.correctOption === optionIndex ? 'checked' : ''} data-lms-change="setLmsQuizVariantQuestionCorrectOption(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, ${optionIndex})">
                                <div style="width:26px; height:26px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.08); color:var(--kiu-blue); font-size:11px; font-weight:800; display:flex; align-items:center; justify-content:center;">${String.fromCharCode(65 + optionIndex)}</div>
                                <input type="text" value="${escapeHtml(question.options?.[optionIndex] || '')}" data-lms-input="updateLmsQuizVariantQuestionOptionText(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, ${optionIndex}, this.value)" placeholder="Option ${optionIndex + 1}" style="flex:1; min-height:40px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;">
                            </div>
                        `).join('')}</div>`
                    }
                    <div style="display:grid; grid-template-columns:minmax(0, 1fr) auto; gap:10px; align-items:end;">
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Replace With Base Question<select id="${replacementSelectId}" style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;"><option value="">Choose base question</option>${baseQuestionOptionMarkup}</select></label>
                        <button type="button" class="kiu-btn-outline" data-lms-click="replaceLmsQuizVariantQuestionWithBaseQuestion(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, document.getElementById(${jsQuote(replacementSelectId)})?.value)" style="padding:10px 14px; font-size:12px;"><i class="fas fa-arrows-rotate"></i> Replace</button>
                    </div>
                </div>
            `;
        }).join('')
        : '<div style="padding:18px; border:1px dashed #cbd5e1; border-radius:18px; background:var(--lux-surface); color:var(--lux-text-muted);">Generate variants first, then adjust each question manually here.</div>';

    contentArea.innerHTML = upgradeLmsLegacyMarkup(`
        <div style="display:grid; gap:24px;">
            <div style="background:linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.9)); color:white; border-radius:22px; padding:20px 22px; box-shadow:0 18px 36px rgba(15,23,42,0.16);">
                <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start;">
                    <div>
                        <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8;">LMS Quiz Builder</div>
                        <div style="font-size:24px; font-weight:900; margin-top:8px;">${escapeHtml(context.subject?.name || context.courseId)}  -  ${escapeHtml(context.group?.name || context.groupId)}</div>
                        <div style="font-size:13px; opacity:0.92; margin-top:6px;">Draft first, publish only to students who are actually in class, then review full quiz papers from one place.</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <span style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;"><i class="fas fa-layer-group"></i> ${escapeHtml(context.group?.name || context.groupId)}</span>
                        <span style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;"><i class="fas fa-users"></i> ${context.students.length} students</span>
                    </div>
                </div>
            </div>
            <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:16px;">
                <div style="background:white; border:1px solid #dbe7f5; border-radius:20px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);"><div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Draft Quizzes</div><div style="font-size:30px; font-weight:900; color:var(--kiu-navy); margin-top:10px;">${workspace.drafts.length}</div></div>
                <div style="background:white; border:1px solid #dbe7f5; border-radius:20px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);"><div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Published Quizzes</div><div style="font-size:30px; font-weight:900; color:var(--kiu-navy); margin-top:10px;">${workspace.published.length}</div></div>
                <div style="background:white; border:1px solid #dbe7f5; border-radius:20px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);"><div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Base Pool Questions</div><div style="font-size:30px; font-weight:900; color:var(--kiu-navy); margin-top:10px;">${draft?.questions?.length || 0}</div></div>
                <div style="background:${alertSummary.alertCount > 0 ? '#fff7ed' : 'white'}; border:1px solid ${alertSummary.alertCount > 0 ? 'rgba(249,115,22,0.24)' : '#dbe7f5'}; border-radius:20px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);"><div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:${alertSummary.alertCount > 0 ? '#c2410c' : '#64748b'};">${alertSummary.alertCount > 0 ? 'Live Alerts' : 'Variant Mode'}</div><div style="font-size:30px; font-weight:900; color:${alertSummary.alertCount > 0 ? '#9a3412' : 'var(--kiu-navy)'}; margin-top:10px;">${alertSummary.alertCount > 0 ? alertSummary.alertCount : (draft?.variantEnabled ? (draft?.variants?.length || draft?.variantCount || 0) : 'Off')}</div><div style="font-size:12px; color:${alertSummary.alertCount > 0 ? '#9a3412' : '#64748b'}; margin-top:6px;">${alertSummary.alertCount > 0 ? `${alertSummary.alertedStudents} student${alertSummary.alertedStudents === 1 ? '' : 's'} need attention` : escapeHtml(variantSummaryLabel)}</div></div>
            </div>
            ${alertSummary.alertCount > 0 ? `<div style="padding:18px 20px; border-radius:20px; background:rgba(var(--lux-accent-rgb),0.06); border:1px solid rgba(249,115,22,0.24); color:var(--lux-text-muted); box-shadow:0 14px 30px rgba(249,115,22,0.08);">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:14px; font-weight:900;">Monitoring alerts are coming in</div>
                        <div style="font-size:13px; margin-top:6px;">${alertSummary.alertedStudents} student${alertSummary.alertedStudents === 1 ? '' : 's'} triggered ${alertSummary.alertCount} warning${alertSummary.alertCount === 1 ? '' : 's'} across ${alertSummary.quizzesWithAlerts} quiz${alertSummary.quizzesWithAlerts === 1 ? '' : 'zes'}.</div>
                        ${alertSummary.latestAlert ? `<div style="font-size:12px; margin-top:6px; color:var(--lux-text-muted);">Latest: ${escapeHtml(alertSummary.latestAlert.note || alertSummary.latestAlert.type || 'Monitoring event')}  -  ${escapeHtml(formatLmsDateTime(alertSummary.latestAlert.createdAt))}</div>` : ''}
                    </div>
                    <button type="button" class="kiu-btn-outline" data-lms-click="setLmsQuizBoardPage('review')" style="padding:10px 14px; font-size:12px; border-color:#fdba74; color:var(--lux-text-muted); background:white;">
                        <i class="fas fa-triangle-exclamation"></i> Open Review Queue
                    </button>
                </div>
            </div>` : ''}
            ${liveMonitorEntries.length ? `<div id="lms-live-monitor-panel" class="${hasFreshMonitorAlert ? 'lms-monitor-flash-panel' : ''}" style="position:sticky; top:16px; z-index:6; padding:18px 20px; border-radius:22px; background:rgba(220,38,38,0.06); border:1px solid rgba(239,68,68,0.18); box-shadow:0 18px 34px rgba(239,68,68,0.08); display:grid; gap:14px;">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                    <div>
                        <div style="font-size:12px; font-weight:900; letter-spacing:0.08em; text-transform:uppercase; color:#dc2626;">Live Monitor</div>
                        <div style="font-size:18px; font-weight:900; color:var(--lux-text-muted); margin-top:6px;">Flagged students in running quizzes</div>
                        <div style="font-size:13px; color:#dc2626; margin-top:6px;">${monitorMode === 'all' ? 'This panel shows all flagged students, including closed quizzes with warning history.' : 'This panel only shows students with monitoring warnings in quizzes that are live right now.'}</div>
                    </div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                        <div style="display:inline-flex; align-items:center; gap:8px; padding:10px 12px; border-radius:999px; background:white; color:#dc2626; font-size:12px; font-weight:900; border:1px solid rgba(239,68,68,0.18);">
                            <span class="lms-monitor-pulse-dot"></span> ${liveMonitorEntries.length} ${monitorMode === 'all' ? 'flagged case' : 'active case'}${liveMonitorEntries.length === 1 ? '' : 's'}
                        </div>
                        <button type="button" class="${monitorMode === 'running' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-lms-click="setLmsQuizMonitorMode('running')" style="padding:8px 12px; font-size:11px; border-radius:999px;">
                            Running Quiz Only
                        </button>
                        <button type="button" class="${monitorMode === 'all' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-lms-click="setLmsQuizMonitorMode('all')" style="padding:8px 12px; font-size:11px; border-radius:999px;">
                            All Flagged
                        </button>
                        <button type="button" class="${monitorAckFilter === 'all' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-lms-click="setLmsQuizMonitorAckFilter('all')" style="padding:8px 12px; font-size:11px; border-radius:999px;">
                            All Alerts
                        </button>
                        <button type="button" class="${monitorAckFilter === 'unacknowledged' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-lms-click="setLmsQuizMonitorAckFilter('unacknowledged')" style="padding:8px 12px; font-size:11px; border-radius:999px;">
                            Unacknowledged
                        </button>
                        <button type="button" class="${monitorAckFilter === 'acknowledged' ? 'kiu-btn-blue' : 'kiu-btn-outline'}" data-lms-click="setLmsQuizMonitorAckFilter('acknowledged')" style="padding:8px 12px; font-size:11px; border-radius:999px;">
                            Acknowledged
                        </button>
                    </div>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:12px;">
                    ${liveMonitorEntries.slice(0, 8).map(entry => `
                        <div style="background:white; border:1px solid rgba(239,68,68,0.18); border-radius:18px; padding:16px; display:grid; gap:10px;">
                            <div style="display:flex; justify-content:space-between; gap:8px; align-items:flex-start;">
                                <div>
                                    <div style="font-size:15px; font-weight:900; color:var(--lux-text-muted);">${escapeHtml(entry.studentName)}</div>
                                    <div style="font-size:11px; color:#dc2626; margin-top:4px;">${escapeHtml(entry.studentId)}  -  ${escapeHtml(entry.quizLabel)}</div>
                                </div>
                                <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:${entry.isAcknowledged ? '#ecfdf5' : '#fff1f2'}; color:${entry.isAcknowledged ? '#047857' : '#b91c1c'}; font-size:11px; font-weight:900; border:1px solid ${entry.isAcknowledged ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'};">${entry.isAcknowledged ? '<i class="fas fa-check"></i>' : '<span class="lms-monitor-pulse-dot"></span>'}${entry.alertCount}</span>
                            </div>
                            <div style="font-size:12px; color:var(--lux-text-muted); line-height:1.5;">
                                <strong>Latest:</strong> ${escapeHtml(entry.latestAlert.note || entry.latestAlert.type || 'Monitoring event')}
                            </div>
                            <div style="font-size:11px; color:#dc2626;">${escapeHtml(formatLmsDateTime(entry.latestAlert.createdAt))}  -  Attendance: ${escapeHtml(entry.attendanceStatus)}  -  Status: ${escapeHtml(entry.submissionStatus)}  -  Quiz: ${escapeHtml(entry.availability)}</div>
                            ${entry.isAcknowledged ? `<div style="font-size:11px; color:var(--lux-accent);">Acknowledged by staff at ${escapeHtml(formatLmsDateTime(entry.acknowledgedAt))}</div>` : ''}
                            <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
                                ${entry.isAcknowledged ? '' : `<button type="button" class="kiu-btn-outline" data-lms-click="acknowledgeLmsQuizMonitorAlert(${jsQuote(context.resourceKey)}, ${jsQuote(entry.quizId)}, ${jsQuote(entry.studentId)})" style="padding:8px 12px; font-size:11px; border-color:#86efac; color:var(--lux-accent); background:var(--lux-surface);">
                                    <i class="fas fa-check"></i> Acknowledge
                                </button>`}
                                <button type="button" class="kiu-btn-outline" data-lms-click="openLmsQuizReviewModal(${jsQuote(context.resourceKey)}, ${jsQuote(entry.quizId)}, ${jsQuote(entry.studentId)})" style="padding:8px 12px; font-size:11px; border-color:#fda4af; color:#dc2626; background:var(--lux-surface);">
                                    <i class="fas fa-eye"></i> Open Student Monitor
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${liveMonitorEntries.length > 8 ? `<div style="font-size:12px; color:#dc2626;">Showing first 8 ${monitorMode === 'all' ? 'flagged' : 'active'} cases. Open Review Queue for the full list.</div>` : ''}
            </div>` : ''}
            <div style="display:grid; grid-template-columns:minmax(0, 1.4fr) minmax(360px, 0.9fr); gap:24px; align-items:start;">
                <div style="background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:28px; padding:22px; box-shadow:0 24px 50px rgba(15, 23, 42, 0.08);">
                    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:18px;">
                        <div>
                            <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Group Quiz Studio</div>
                            <div style="font-size:24px; font-weight:900; color:var(--kiu-navy); margin-top:6px;">${draft?.editingQuizId ? 'Edit Draft Quiz' : 'Create Draft Quiz'}</div>
                            <div style="font-size:13px; color:var(--lux-text-muted); margin-top:6px;">Save first, then publish from the right-side board only when the class roster is ready.</div>
                        </div>
                        <div style="background:rgba(var(--lux-accent-rgb),0.08); color:var(--kiu-blue); border-radius:18px; padding:12px 14px; min-width:132px; text-align:center;">
                            <div style="font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:0.08em;">Current Week</div>
                            <div style="font-size:14px; font-weight:900; margin-top:6px;">${escapeHtml(draft?.weekLabel || context.weeks?.[0] || 'Week 1')}</div>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:minmax(0, 1.2fr) minmax(200px, 0.8fr); gap:14px; margin-bottom:14px;">
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Quiz Title<input type="text" value="${escapeHtml(draft?.title || '')}" data-lms-input="setLmsQuizDraftField('title', this.value)" placeholder="e.g. Midterm Quiz 1" style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:white;" /></label>
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Subject<input type="text" value="${escapeHtml(context.subject?.name || context.courseId)}" disabled style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:var(--lux-bg-soft);" /></label>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:14px; margin-bottom:14px;">
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Assessment Type<select data-lms-change="setLmsQuizDraftField('assessmentType', this.value)" style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:white;">${['quiz','oral-quiz','midterm','final','retake'].map(type => `<option value="${type}" ${normalizeLmsQuizAssessmentType(draft?.assessmentType) === type ? 'selected' : ''}>${escapeHtml(getLmsQuizAssessmentMeta(type).label)}</option>`).join('')}</select></label>
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Week<select data-lms-change="setLmsQuizDraftField('weekLabel', this.value)" style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:white;">${(context.weeks?.length ? context.weeks : ['Week 1']).map(week => `<option value="${escapeHtml(week)}" ${normalizeLmsWeekLabel(draft?.weekLabel) === normalizeLmsWeekLabel(week) ? 'selected' : ''}>${escapeHtml(week)}</option>`).join('')}</select></label>
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Timer (minutes)<input type="number" min="1" value="${escapeHtml(String(draft?.durationMinutes || 20))}" data-lms-input="setLmsQuizDraftField('durationMinutes', this.value)" style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:white;" /></label>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:14px; margin-bottom:18px;">
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Start Time<input type="datetime-local" value="${escapeHtml(String(draft?.availableFrom || ''))}" data-lms-change="setLmsQuizDraftField('availableFrom', this.value)" style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:white;" /></label>
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">End Time<input type="datetime-local" value="${escapeHtml(String(draft?.availableUntil || ''))}" data-lms-change="setLmsQuizDraftField('availableUntil', this.value)" style="min-height:46px; border:1px solid #dbe7f5; border-radius:14px; padding:0 14px; outline:none; background:white;" /></label>
                    </div>
                    <div style="display:grid; gap:14px; margin-bottom:18px;">
                        <label class="lms-quiz-policy-card">
                            <input type="checkbox" ${draft?.attendanceGateEnabled !== false ? 'checked' : ''} data-lms-change="setLmsQuizDraftField('attendanceGateEnabled', this.checked)">
                            <span><strong>Attendance gate</strong><br>TA / professor must mark the student present in the LMS review board before Start Quiz unlocks.</span>
                        </label>
                    </div>
                    <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted); margin-bottom:18px;">Quiz Notes<textarea rows="3" data-lms-input="setLmsQuizDraftField('instructions', this.value)" placeholder="Short notes for the invigilator or setup rules..." style="width:100%; border:1px solid #dbe7f5; border-radius:16px; padding:14px 15px; resize:vertical; outline:none; background:white;">${escapeHtml(draft?.instructions || '')}</textarea></label>
                    <div class="lms-quiz-tool-panel ${variantSetExpanded ? '' : 'is-collapsed'}" style="margin-bottom:18px;">
                        <div class="lms-quiz-tool-head">
                            <div class="lms-quiz-tool-title">
                                <strong>Quiz Variant Set</strong>
                                <span>${escapeHtml(variantSummaryLabel)}. Build multiple student versions only when this quiz needs randomized papers.</span>
                            </div>
                            <div class="lms-quiz-tool-actions">
                                <span class="lms-quiz-compact-badge"><i class="fas fa-clone"></i> ${draft?.variantEnabled ? 'Variants on' : 'Variants off'}</span>
                                <button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsQuizVariantSetPanel()" style="padding:9px 12px; font-size:12px;"><i class="fas ${variantSetExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${variantSetExpanded ? 'Hide setup' : 'Show setup'}</button>
                            </div>
                        </div>
                        <div class="lms-quiz-tool-body">
                            <label style="display:flex; gap:10px; align-items:center; width:max-content; max-width:100%; padding:10px 14px; border:1px solid #dbe7f5; border-radius:16px; background:white; font-size:12px; font-weight:700; color:var(--lux-text-muted);">
                                <input type="checkbox" ${draft?.variantEnabled ? 'checked' : ''} data-lms-change="setLmsQuizDraftField('variantEnabled', this.checked); rerenderCurrentLmsQuizWorkspace();">
                                Enable variants
                            </label>
                            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px;">
                                <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Variant Count<input type="number" min="1" max="8" value="${escapeHtml(String(draft?.variantCount || 3))}" data-lms-input="setLmsQuizDraftField('variantCount', this.value)" style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:${draft?.variantEnabled ? 'white' : '#f8fafc'};" ${draft?.variantEnabled ? '' : 'disabled'}></label>
                                <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Questions Per Variant<input type="number" min="1" value="${escapeHtml(String(draft?.questionsPerVariant || 10))}" data-lms-input="setLmsQuizDraftField('questionsPerVariant', this.value)" style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:${draft?.variantEnabled ? 'white' : '#f8fafc'};" ${draft?.variantEnabled ? '' : 'disabled'}></label>
                                <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Assignment<input type="text" value="Auto-fixed" disabled style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:var(--lux-bg-soft);"></label>
                                <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Generation<input type="text" value="Unique-first randomization" disabled style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:var(--lux-bg-soft);"></label>
                            </div>
                            ${draft?.variantEnabled ? `
                                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                                    <button type="button" class="kiu-btn-blue" data-lms-click="generateLmsQuizVariants()" style="padding:10px 14px; font-size:12px;"><i class="fas fa-wand-magic-sparkles"></i> Generate Variants</button>
                                    <button type="button" class="kiu-btn-outline" data-lms-click="regenerateAllLmsQuizVariants()" style="padding:10px 14px; font-size:12px;"><i class="fas fa-rotate"></i> Regenerate All</button>
                                    <button type="button" class="kiu-btn-outline" data-lms-click="resetLmsQuizVariantsToBasePool()" style="padding:10px 14px; font-size:12px;"><i class="fas fa-layer-group"></i> Reset to Base Pool</button>
                                </div>
                                <div style="display:grid; gap:14px; padding:16px; border:1px solid #dbe7f5; border-radius:18px; background:var(--lux-surface);">
                                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
                                        <div>
                                            <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Variant Tabs</div>
                                            <div style="font-size:12px; color:var(--lux-text-muted); margin-top:6px;">Generate first, then adjust a single variant manually if needed.</div>
                                        </div>
                                        ${activeVariant ? `<button type="button" class="kiu-btn-outline" data-lms-click="regenerateLmsQuizVariant(${jsQuote(activeVariant.id)})" style="padding:10px 14px; font-size:12px;"><i class="fas fa-repeat"></i> Regenerate ${escapeHtml(activeVariant.label)}</button>` : ''}
                                    </div>
                                    <div style="display:flex; gap:10px; flex-wrap:wrap;">${variantTabsMarkup || '<span style="font-size:12px; color:var(--lux-text-muted);">No variants generated yet.</span>'}</div>
                                    ${activeVariant ? `<div style="display:grid; gap:10px; grid-template-columns:minmax(0, 1fr) auto; align-items:end;">
                                        <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Add Base Question To ${escapeHtml(activeVariant.label)}<select id="lms-variant-add-base-question" style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;"><option value="">Choose base question</option>${baseQuestionOptionMarkup}</select></label>
                                        <button type="button" class="kiu-btn-outline" data-lms-click="addBaseQuestionToLmsQuizVariant(${jsQuote(activeVariant.id)}, document.getElementById('lms-variant-add-base-question')?.value)" style="padding:10px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Question</button>
                                    </div>` : ''}
                                    <div style="display:grid; gap:14px;">${activeVariantQuestionsMarkup}</div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    <div class="lms-quiz-tool-panel ${questionNavigatorExpanded ? '' : 'is-collapsed'}">
                        <div class="lms-quiz-tool-head">
                            <div class="lms-quiz-tool-title">
                                <strong>Question Builder</strong>
                                <span>${escapeHtml(questionNavigatorStatus)}. Hide the whole builder when you only need quiz settings or saved quizzes.</span>
                            </div>
                            <div class="lms-quiz-tool-actions">
                                <button class="kiu-btn-outline" data-lms-click="resetLmsQuizBuilderDraft()" style="padding:10px 14px; font-size:12px;"><i class="fas fa-rotate-left"></i> Reset Draft</button>
                                <button class="kiu-btn-blue" data-lms-click="addLmsQuizQuestion()" style="padding:10px 14px; font-size:12px;"><i class="fas fa-plus"></i> Add Question</button>
                                <button type="button" class="kiu-btn-outline" data-lms-click="toggleLmsQuizQuestionNavigatorPanel()" style="padding:9px 12px; font-size:12px;"><i class="fas ${questionNavigatorExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${questionNavigatorExpanded ? 'Hide builder' : 'Show builder'}</button>
                            </div>
                        </div>
                        <div class="lms-quiz-tool-body">
                    <div class="lms-quiz-question-layout">
                        <div class="lms-quiz-question-nav-card" style="background:white; border:1px solid #dbe7f5; border-radius:20px; padding:14px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);">
                            <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted); margin-bottom:10px;">Questions</div>
                            <div id="lms-quiz-question-nav" style="display:grid; gap:10px; max-height:620px; overflow:auto; padding-right:4px;">${questionNavigator}</div>
                        </div>
                        <div style="background:white; border:1px solid #dbe7f5; border-radius:22px; padding:18px; box-shadow:0 18px 36px rgba(15, 23, 42, 0.06); min-height:100%;">
                            <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:14px;">
                                <div>
                                    <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Question ${activeQuestionIndex + 1} of ${draft?.questions?.length || 0}</div>
                                    <div style="font-size:15px; font-weight:800; color:var(--kiu-navy); margin-top:4px;">Focused Question Editor</div>
                                </div>
                                <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;">
                                    <button class="kiu-btn-outline" data-lms-click="removeActiveLmsQuizBuilderQuestion()" style="padding:8px 12px; font-size:11px; color:#dc2626; border-color:#fecaca;" ${(draft?.questions?.length || 0) <= 1 ? 'disabled' : ''}><i class="fas fa-trash"></i> Remove</button>
                                </div>
                            </div>
                            <div style="display:grid; gap:12px;">
                                <textarea rows="5" data-lms-input="updateLmsQuizQuestionField(${jsQuote(activeQuestion?.id || '')}, 'text', this.value)" placeholder="Write the question here..." style="width:100%; border:1px solid #dbe7f5; border-radius:16px; padding:14px 15px; resize:vertical; outline:none; background:white;">${escapeHtml(activeQuestion?.text || '')}</textarea>
                                <div style="display:grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(120px, 160px); gap:12px;">
                                    <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Question Type<select data-lms-change="setLmsQuizQuestionType(${jsQuote(activeQuestion?.id || '')}, this.value)" style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;"><option value="mcq" ${activeQuestionType === 'mcq' ? 'selected' : ''}>Multiple Choice</option><option value="written" ${activeQuestionType === 'written' ? 'selected' : ''}>Written Answer</option></select></label>
                                    <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Options Per Question<select data-lms-change="setLmsQuizQuestionOptionCount(${jsQuote(activeQuestion?.id || '')}, this.value)" ${activeQuestionType === 'written' ? 'disabled' : ''} style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:${activeQuestionType === 'written' ? '#f8fafc' : 'white'};">${[2,3,4,5,6].map(count => `<option value="${count}" ${Number(activeQuestion?.optionCount) === count ? 'selected' : ''}>${count} options</option>`).join('')}</select></label>
                                    <label style="display:grid; gap:6px; font-size:11px; font-weight:700; color:var(--lux-text-muted);">Score<input type="number" min="1" step="1" value="${escapeHtml(String(activeQuestion?.score || 1))}" data-lms-input="updateLmsQuizQuestionField(${jsQuote(activeQuestion?.id || '')}, 'score', this.value)" style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none; background:white;" /></label>
                                </div>
                                ${activeAnswerComposer}
                            </div>
                            <div style="display:flex; justify-content:space-between; gap:10px; margin-top:18px; flex-wrap:wrap;">
                                <button class="kiu-btn-outline" data-lms-click="stepLmsQuizBuilderQuestion(-1)" ${activeQuestionIndex <= 0 ? 'disabled' : ''} style="padding:10px 14px; font-size:12px; ${activeQuestionIndex <= 0 ? 'opacity:0.45; cursor:not-allowed;' : ''}"><i class="fas fa-arrow-left"></i> Previous</button>
                                <button class="kiu-btn-outline" data-lms-click="stepLmsQuizBuilderQuestion(1)" ${activeQuestionIndex >= (draft?.questions?.length || 1) - 1 ? 'disabled' : ''} style="padding:10px 14px; font-size:12px; ${activeQuestionIndex >= (draft?.questions?.length || 1) - 1 ? 'opacity:0.45; cursor:not-allowed;' : ''}">Next <i class="fas fa-arrow-right"></i></button>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
                        <button class="kiu-btn-blue" data-lms-click="saveLmsQuizBuilderDraft()" style="padding:12px 18px; font-size:13px;"><i class="fas fa-save"></i> ${draft?.editingQuizId ? 'Update Draft' : 'Save Draft'}</button>
                    </div>
                        </div>
                    </div>
                </div>
                <div style="display:grid; gap:18px;">
                    <div style="background:white; border:1px solid #dbe7f5; border-radius:24px; padding:20px; box-shadow:0 18px 36px rgba(15, 23, 42, 0.06);">
                        <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Quiz Rules</div>
                        <ul style="margin:14px 0 0; padding-left:18px; color:var(--lux-text-muted); font-size:13px; line-height:1.7;">
                            <li>Every quiz is tied automatically to this LMS group.</li>
                            <li>Save creates a draft only. Students cannot see drafts.</li>
                            <li>Publish opens the class roster so you can uncheck absent students.</li>
                            <li>Written answers stay in review until TA or professor scores them.</li>
                        </ul>
                    </div>
                    <div style="background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:24px; padding:20px; box-shadow:0 18px 36px rgba(15, 23, 42, 0.06);">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; flex-wrap:wrap;">
                            <div>
                                <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Saved Quizzes</div>
                                <div style="font-size:18px; font-weight:900; color:var(--kiu-navy); margin-top:4px;">${escapeHtml(context.subject?.name || context.courseId)}  -  ${escapeHtml(context.group?.name || context.groupId)}</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                                <button type="button" class="kiu-btn-outline" data-lms-click="openLmsQuizBoardModal(${jsQuote(boardPage)})" style="padding:10px 14px; font-size:12px; border-radius:999px;">
                                    <i class="fas fa-up-right-and-down-left-from-center"></i> Open Full View
                                </button>
                                <div style="background:var(--lux-surface); color:white; border-radius:14px; padding:10px 12px; font-size:12px; font-weight:800;">${ensureLmsQuizzesForKey(context.resourceKey).length} total</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:18px;">
                            ${[
                                { key: 'drafts', label: `Draft Quizzes (${workspace.drafts.length})` },
                                { key: 'published', label: `Published (${workspace.published.length}${alertSummary.quizzesWithAlerts ? `  -  ${alertSummary.quizzesWithAlerts} alert` : ''})` },
                                { key: 'review', label: `Review Queue (${reviewItems.length}${alertSummary.alertCount ? `  -  ${alertSummary.alertCount} warn` : ''})` },
                                { key: 'results', label: `Results (${workspace.closed.length})` }
                            ].map(tab => `
                                <button type="button" data-lms-click="setLmsQuizBoardPage(${jsQuote(tab.key)})" class="${boardPage === tab.key ? 'kiu-btn-blue' : 'kiu-btn-outline'}" style="padding:10px 14px; font-size:12px; border-radius:999px;">
                                    ${escapeHtml(tab.label)}
                                </button>
                            `).join('')}
                        </div>
                        <div style="font-size:12px; color:var(--lux-text-muted); margin-bottom:16px;">
                            This board stays compact on purpose. It shows only the latest 3 quizzes for the selected section. Use <strong>Open Full View</strong> to see all quizzes and full details in a maximized window.
                        </div>
                        <div style="display:grid; gap:18px;">
                            ${renderActiveLmsQuizBoardPage(context)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);
    if (hasFreshMonitorAlert) {
        requestAnimationFrame(() => {
            document.getElementById('lms-live-monitor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }
    } catch (error) {
        console.error('Staff LMS quiz workspace render failed', error);
        contentArea.innerHTML = upgradeLmsLegacyMarkup(`
            <div style="display:grid; gap:16px;">
                <div style="background:var(--lux-surface); border:1px solid #fca5a5; border-radius:22px; padding:24px; box-shadow:0 18px 36px rgba(15,23,42,0.08);">
                    <div style="font-size:18px; font-weight:900; color:#991b1b;">Quiz Builder could not load</div>
                    <div style="font-size:13px; color:var(--lux-text-muted); margin-top:8px;">The staff quiz workspace hit a runtime problem, so we stopped it before it could break the whole LMS page.</div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
                        <button type="button" class="kiu-btn-outline" data-lms-click="resetLmsQuizBuilderDraft(${jsQuote(context.resourceKey)}); renderLmsQuizSection(${jsQuote(context.resourceKey)})" style="padding:10px 14px; font-size:12px;">
                            <i class="fas fa-life-ring"></i> Reset Builder Draft
                        </button>
                        <button type="button" class="kiu-btn-blue" data-lms-click="renderLmsQuizSection(${jsQuote(context.resourceKey)})" style="padding:10px 14px; font-size:12px;">
                            <i class="fas fa-rotate-right"></i> Reload Quiz Workspace
                        </button>
                    </div>
                </div>
            </div>
        `);
    }
}

function renderLmsStudentQuizWorkspace(context) {
    closeLmsQuizOverlays();
    renderStudentLmsQuizSection(context.resourceKey, context.subject, context.group);
}

function renderLmsQuizSection(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('quiz', contentArea);
    const context = resolveLmsQuizWorkspace(courseId);
    if (!context?.resourceKey) {
        contentArea.innerHTML = upgradeLmsLegacyMarkup(`<div style="background:var(--lux-surface); border:1px dashed var(--kiu-border); border-radius:18px; padding:30px; text-align:center; color:var(--kiu-text-muted);">Open a valid LMS group first to use the quiz workspace.</div>`);
        return;
    }
    currentLmsQuizCourseKey = context.resourceKey;
    syncLmsQuizWorkspaceLifecycle(context.resourceKey);
    if (getEffectiveUserRole() === USER_ROLES.STUDENT) {
        renderLmsStudentQuizWorkspace(context);
        return;
    }
    renderLmsStaffQuizWorkspace(context);
}

function renderStudentLmsQuizSection(courseId, subject = null, group = null) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    clearActiveLmsQuizCountdown();
    clearActiveLmsPostSubmitLockInterval();

    try {
        const lmsContext = resolveActiveLmsQuizContext(courseId);
        const parsed = parseLmsCourseKey(courseId);
        const resourceKey = lmsContext?.resourceKey || resolveCanonicalLmsResourceKey(parsed.resourceKey);
        const uiState = ensureLmsQuizUiState(resourceKey);
        const focusState = getLmsStudentQuizFocusState();
        const studentMeta = syncLmsImpersonatedStudentSession(resourceKey) || resolveLmsQuizStudentMeta(resourceKey);
        const studentId = studentMeta.id;
        const studentName = studentMeta.name;
        const subjectLabel = subject?.name || lmsContext?.subject?.name || lmsContext?.courseId || parsed.courseId || 'Subject';
        const groupLabel = group?.name || lmsContext?.group?.name || lmsContext?.groupId || parsed.groupId || 'Group';

        syncLmsQuizWorkspaceLifecycle(resourceKey);
        ensureLmsQuizzesForKey(resourceKey).forEach(syncLmsExamSessionLifecycle);

        const quizzes = sortLmsQuizzes(ensureLmsQuizzesForKey(resourceKey).filter(quiz =>
            isLmsQuizVisibleToStudentsNow(quiz) && isStudentAllowedForLmsQuiz(resourceKey, quiz, studentId)
        ));

        let selectedQuiz = uiState.studentQuizId
            ? quizzes.find(item => String(item.id) === String(uiState.studentQuizId)) || null
            : null;
        if (uiState.studentQuizId && !selectedQuiz) {
            uiState.studentQuizId = null;
            selectedQuiz = null;
        }

        if (!selectedQuiz) {
            stopKiuBlueStudentHeartbeat({ unregister: true });
            const submittedCount = quizzes.filter(quiz => ['submitted', 'auto-submitted', 'graded'].includes(String(getLmsQuizSubmission(resourceKey, quiz.id, studentId)?.status || ''))).length;
            const gradedCount = quizzes.filter(quiz => String(getLmsQuizSubmission(resourceKey, quiz.id, studentId)?.status || '') === 'graded').length;
            const cards = quizzes.length ? quizzes.map(quiz => {
                const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, studentMeta);
                syncLmsQuizSubmissionVariant(quiz, submission, studentId);
                syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, studentMeta);
                const availability = getLmsQuizAvailabilityState(quiz, submission);
                const sessionGate = getLmsQuizExamSessionGateStatus(resourceKey, quiz, submission, studentId);
                const studentQuestionCount = getLmsQuizQuestionCount(quiz, studentId, submission);
                const studentVariantQuiz = { ...quiz, questions: getLmsQuizQuestionsForStudent(quiz, studentId, submission) };
                const studentVariantSummary = submission.variantLabel ? `  -  ${submission.variantLabel}` : '';
                const badgeKey = ['submitted', 'auto-submitted', 'graded'].includes(String(submission?.status || ''))
                    ? String(submission.status)
                    : availability;
                const badge = getLmsQuizStatusBadge(badgeKey);
                const statusLine = String(submission?.status || '') === 'graded'
                    ? `Score: ${Number(submission.finalScoreRaw || 0)} / ${getAdminQuizTotalScore(studentVariantQuiz)}${studentVariantSummary}`
                    : ['submitted', 'auto-submitted'].includes(String(submission?.status || ''))
                        ? (submission.requiresManualReview === true
                            ? `Submitted. Objective score ${Number(submission.autoScoreRaw || 0)} recorded; final grade pending staff review${studentVariantSummary}`
                            : `Submitted. Score processing${studentVariantSummary}`)
                        : sessionGate.required
                            ? `${studentQuestionCount} questions  -  ${quiz.durationMinutes || 20} min${studentVariantSummary}  -  ${sessionGate.status === 'live' ? 'Session live' : sessionGate.message || 'Waiting for session'}`
                            : `${studentQuestionCount} questions  -  ${quiz.durationMinutes || 20} min${studentVariantSummary}`;
                return `
                    <div data-lms-student-quiz-card="true" style="background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:20px; padding:18px; box-shadow:0 14px 30px rgba(15,23,42,0.05);">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                            <div>
                                <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                                    <div style="font-size:12px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase;">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</div>
                                    ${sessionGate.required ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:${sessionGate.status === 'live' ? '#ecfdf5' : '#eff6ff'}; color:${sessionGate.status === 'live' ? '#047857' : '#1d4ed8'}; font-size:10px; font-weight:900;"><i class="fas fa-desktop"></i> Lab session ${escapeHtml(sessionGate.status)}</span>` : ''}
                                    ${submission.variantLabel ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.05); color:var(--lux-accent); font-size:10px; font-weight:900;"><i class="fas fa-clone"></i> ${escapeHtml(submission.variantLabel)}</span>` : ''}
                                </div>
                                <div style="font-size:18px; font-weight:900; color:var(--kiu-navy); margin-top:6px;">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                                <div data-lms-student-quiz-status="true" style="font-size:12px; color:var(--lux-text-muted); margin-top:6px;">${escapeHtml(statusLine)}</div>
                                <div style="font-size:11px; color:var(--lux-text-muted); margin-top:4px;">${quiz.availableFrom ? `Starts ${escapeHtml(formatLmsDateTime(quiz.availableFrom))}` : 'Starts immediately'}${quiz.availableUntil ? `  -  Ends ${escapeHtml(formatLmsDateTime(quiz.availableUntil))}` : ''}</div>
                            </div>
                            <span style="background:${badge.bg}; color:${badge.color}; padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;">${escapeHtml(badge.label)}</span>
                        </div>
                        <div style="display:flex; justify-content:flex-end; margin-top:16px;">
                            <button data-lms-student-quiz-action="true" type="button" class="kiu-btn-blue" data-lms-click="openLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})" style="padding:10px 14px; font-size:12px;">
                                <i class="fas fa-arrow-right"></i> ${escapeHtml(['submitted', 'auto-submitted', 'graded'].includes(String(submission?.status || '')) ? 'View Quiz' : 'Open in Anti-Cheat')}
                            </button>
                        </div>
                    </div>
                `;
            }).join('') : `<div style="background:white; border:1px dashed #cbd5e1; border-radius:20px; padding:42px 28px; text-align:center; color:var(--lux-text-muted);"><i class="fas fa-file-signature" style="font-size:34px; opacity:0.35; margin-bottom:12px;"></i><div style="font-size:16px; font-weight:800; color:var(--kiu-navy);">No quizzes are visible yet</div><div style="font-size:12px; margin-top:6px;">Published quizzes for ${escapeHtml(subjectLabel)}  -  ${escapeHtml(groupLabel)} will appear here when they are started or scheduled.</div></div>`;

            contentArea.innerHTML = upgradeLmsLegacyMarkup(`
                <div style="display:grid; gap:18px;">
                    <div style="background:linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.9)); color:white; border-radius:22px; padding:20px 22px; box-shadow:0 18px 36px rgba(15,23,42,0.16);">
                        <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8;">My Quizzes</div>
                        <div style="font-size:24px; font-weight:900; margin-top:8px;">${escapeHtml(subjectLabel)}  -  ${escapeHtml(groupLabel)}</div>
                        <div style="font-size:13px; opacity:0.92; margin-top:6px;">Students can only answer and submit. Quiz opening and ending are controlled by the professor or teaching assistant.</div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
                            <span style="display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:999px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); font-size:12px; font-weight:800;">
                                <i class="fas fa-user"></i> ${escapeHtml(studentName)}
                            </span>
                            <span style="display:inline-flex; align-items:center; gap:6px; padding:8px 12px; border-radius:999px; background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); font-size:12px; font-weight:800;">
                                <i class="fas fa-id-badge"></i> ${escapeHtml(studentId)}
                            </span>
                        </div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                        <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase;">Visible Quizzes</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${quizzes.length}</div></div>
                        <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase;">Submitted</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${submittedCount}</div></div>
                        <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase;">Graded</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${gradedCount}</div></div>
                    </div>
                    <div style="display:grid; gap:14px;">${cards}</div>
                </div>
            `);
            decorateLmsPostSubmitLockedQuizCards(contentArea, quizzes, resourceKey, studentMeta);
            return;
        }

        const revealActive = String(uiState.studentRevealQuizId || '') === String(selectedQuiz.id);
        const examSession = syncLmsExamSessionLifecycle(selectedQuiz);
        if (isLmsQuizBlueExamRequired(selectedQuiz)) {
            ensureKiuBlueStudentHeartbeat(resourceKey, selectedQuiz, studentMeta, subject, group);
        } else {
            stopKiuBlueStudentHeartbeat({ unregister: true });
        }
        const baseSubmission = ensureLmsQuizSubmissionShell(resourceKey, selectedQuiz.id, studentMeta);
        syncLmsQuizSubmissionVariant(selectedQuiz, baseSubmission, studentId);
        syncLmsQuizExamSessionSubmissionState(resourceKey, selectedQuiz, baseSubmission, studentMeta);
        const submission = revealActive
            ? ensureLmsStudentQuizAttemptActive(resourceKey, selectedQuiz, studentMeta)
            : baseSubmission;
        syncLmsQuizSubmissionVariant(selectedQuiz, submission, studentId);
        syncLmsQuizExamSessionSubmissionState(resourceKey, selectedQuiz, submission, studentMeta);
        const availability = getLmsQuizAvailabilityState(selectedQuiz, submission);
        if (revealActive && submission?.status === 'in-progress') {
            const effectiveEnd = getLmsQuizEffectiveEndAt(selectedQuiz, submission);
            if (effectiveEnd && effectiveEnd.getTime() <= Date.now()) {
                finalizeLmsQuizSubmission(resourceKey, selectedQuiz, submission, studentId, studentName, 'auto-submit');
                saveState();
            }
        }
        const refreshedSubmission = ensureLmsQuizSubmissionShell(resourceKey, selectedQuiz.id, studentMeta);
        syncLmsQuizSubmissionVariant(selectedQuiz, refreshedSubmission, studentId);
        syncLmsQuizExamSessionSubmissionState(resourceKey, selectedQuiz, refreshedSubmission, studentMeta);
        syncLmsQuizBlueSubmissionState(resourceKey, selectedQuiz, refreshedSubmission, studentMeta);
        if (isLmsQuizPostSubmitLocked(refreshedSubmission)) {
            uiState.studentQuizId = null;
            uiState.studentRevealQuizId = null;
            renderStudentLmsQuizSection(currentCourseId, subject, group);
            return;
        }
        const refreshedAvailability = getLmsQuizAvailabilityState(selectedQuiz, refreshedSubmission);
        if (!isProtectedQuizSessionAuthorized(resourceKey, selectedQuiz.id) && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || ''))) {
            contentArea.innerHTML = `
                <div style="display:grid; gap:18px;">
                    <div style="background:linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.9)); color:white; border-radius:22px; padding:20px 22px; box-shadow:0 18px 36px rgba(15,23,42,0.16);">
                        <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8;">Protected Quiz</div>
                        <div style="font-size:24px; font-weight:900; margin-top:8px;">${escapeHtml(selectedQuiz.title || getLmsQuizDisplayLabel(selectedQuiz))}</div>
                        <div style="font-size:13px; opacity:0.92; margin-top:6px;">${escapeHtml(subjectLabel)} / ${escapeHtml(groupLabel)}</div>
                    </div>
                    ${renderProtectedQuizLaunchShell(resourceKey, selectedQuiz, subjectLabel, groupLabel)}
                </div>
            `;
            return;
        }
        const activeQuestions = getLmsQuizQuestionsForStudent(selectedQuiz, studentId, refreshedSubmission);
        const variantScopedQuiz = { ...selectedQuiz, questions: activeQuestions };
        const latestProctorEvent = getLmsQuizLatestProctorEvent(refreshedSubmission);
        const protectionConfig = getLmsQuizFocusProtectionConfig(selectedQuiz);
        const warningCount = getLmsQuizProctorAlertCount(refreshedSubmission);
        const outsideActionCount = Number(refreshedSubmission.outsideActionCount || 0);
        const badge = getLmsQuizStatusBadge(refreshedAvailability);
        const effectiveEnd = getLmsQuizEffectiveEndAt(selectedQuiz, refreshedSubmission);
        const manualMax = getLmsQuizManualMax(variantScopedQuiz);
        const sessionGate = getLmsQuizExamSessionGateStatus(resourceKey, selectedQuiz, refreshedSubmission, studentId);
        const blueGate = getLmsQuizBlueGateStatus(resourceKey, selectedQuiz, refreshedSubmission, studentId);
        const blueLockActive = blueGate.blankAttempt === true;
        const sessionLockActive = sessionGate.required
            && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || ''))
            && !sessionGate.quizBodyVisible;
        const answersMarkup = activeQuestions.map((question, index) => {
            const answer = refreshedSubmission?.draftAnswers?.[question.id] || refreshedSubmission?.answers?.[question.id] || {};
            const disabled = blueLockActive || sessionLockActive || ['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || '')) || refreshedAvailability === 'closed';
            if (String(question.type || 'mcq') === 'written') {
                return `
                    <div style="padding:18px; border:1px solid #dbe7f5; border-radius:18px; background:var(--lux-surface);">
                        <div style="font-size:13px; font-weight:800; color:var(--kiu-navy);">Question ${index + 1}</div>
                        <div style="font-size:14px; color:var(--lux-text); margin-top:10px; line-height:1.6;">${escapeHtml(question.text || '')}</div>
                        <textarea ${disabled ? 'disabled' : ''} data-lms-input="updateLmsQuizDraftAnswer(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)}, ${jsQuote(question.id)}, 'text', this.value)" placeholder="Write your answer here..." style="width:100%; min-height:140px; margin-top:14px; border:1px solid #dbe7f5; border-radius:14px; padding:12px; outline:none; resize:vertical; background:${disabled ? '#f8fafc' : 'white'};">${escapeHtml(answer.text || '')}</textarea>
                    </div>
                `;
            }
            return `
                <div style="padding:18px; border:1px solid #dbe7f5; border-radius:18px; background:var(--lux-surface);">
                    <div style="font-size:13px; font-weight:800; color:var(--kiu-navy);">Question ${index + 1}</div>
                    <div style="font-size:14px; color:var(--lux-text); margin-top:10px; line-height:1.6;">${escapeHtml(question.text || '')}</div>
                    <div style="display:grid; gap:10px; margin-top:14px;">
                        ${(question.options || []).map((option, optionIndex) => `
                            <label style="display:flex; gap:10px; align-items:flex-start; padding:12px 14px; border:1px solid #dbe7f5; border-radius:14px; background:${Number(answer.selectedOption) === optionIndex ? '#eff6ff' : '#ffffff'};">
                                <input type="radio" name="lms-quiz-${escapeHtml(selectedQuiz.id)}-${escapeHtml(question.id)}" value="${optionIndex}" ${Number(answer.selectedOption) === optionIndex ? 'checked' : ''} ${disabled ? 'disabled' : ''} data-lms-change="updateLmsQuizDraftAnswer(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)}, ${jsQuote(question.id)}, 'selectedOption', this.value)">
                                <span style="font-size:13px; color:var(--lux-text); line-height:1.5;">${escapeHtml(option)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        const requiresCover = !revealActive && ['open', 'in-progress'].includes(refreshedAvailability) && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || ''));
        const showSubmit = revealActive && !blueLockActive && !sessionLockActive && ['open', 'in-progress'].includes(refreshedAvailability) && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || ''));
        const resultMarkup = refreshedSubmission?.status === 'graded'
            ? `<div style="margin-top:16px; padding:16px 18px; border-radius:18px; background:rgba(var(--lux-accent-rgb),0.05); border:1px solid rgba(14,116,144,0.18); color:var(--lux-text);">
                    <div style="font-size:12px; font-weight:900; color:var(--lux-accent); text-transform:uppercase; letter-spacing:0.06em;">Final result</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:10px; margin-top:10px;">
                        <div><div style="font-size:11px; color:var(--lux-text-muted); font-weight:800; text-transform:uppercase;">Objective</div><div style="font-size:20px; font-weight:900;">${Number(refreshedSubmission.autoScoreRaw || 0)}</div></div>
                        <div><div style="font-size:11px; color:var(--lux-text-muted); font-weight:800; text-transform:uppercase;">Manual</div><div style="font-size:20px; font-weight:900;">${Number(refreshedSubmission.manualScoreRaw || 0)}</div></div>
                        <div><div style="font-size:11px; color:var(--lux-text-muted); font-weight:800; text-transform:uppercase;">Total</div><div style="font-size:20px; font-weight:900;">${Number(refreshedSubmission.finalScoreRaw || 0)} / ${getAdminQuizTotalScore(variantScopedQuiz)}</div></div>
                        <div><div style="font-size:11px; color:var(--lux-text-muted); font-weight:800; text-transform:uppercase;">Gradebook</div><div style="font-size:20px; font-weight:900;">${refreshedSubmission.gradebookScore === null || refreshedSubmission.gradebookScore === undefined ? '-' : Number(refreshedSubmission.gradebookScore)}</div></div>
                    </div>
                    <div style="font-size:12px; color:var(--lux-text-muted); margin-top:10px;">Reviewed by ${escapeHtml(refreshedSubmission.reviewedBy || refreshedSubmission.gradedBy || 'Staff')}${refreshedSubmission.gradedAt ? ` on ${escapeHtml(formatLmsDateTime(refreshedSubmission.gradedAt))}` : ''}.</div>
                </div>`
                : ['submitted', 'auto-submitted'].includes(String(refreshedSubmission?.status || ''))
                    ? `<div style="margin-top:16px; padding:16px 18px; border-radius:18px; background:rgba(var(--lux-accent-rgb),0.06); border:1px solid rgba(251,146,60,0.25); color:var(--lux-text-muted);">
                            <div style="font-size:13px; font-weight:900; color:var(--kiu-navy);">Submitted. Final grade pending review.</div>
                            <div style="font-size:12px; margin-top:6px;">Objective score recorded: <strong>${Number(refreshedSubmission.autoScoreRaw || 0)}</strong>. ${manualMax > 0 ? 'TA / professor manual grading is required before the gradebook score is published.' : getLmsQuizAutoSubmitNotice(refreshedSubmission, false, 'Staff')}</div>
                        </div>`
                    : '';

        contentArea.innerHTML = `
            <div style="display:grid; gap:18px;">
                <div style="background:linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.9)); color:white; border-radius:22px; padding:20px 22px; box-shadow:0 18px 36px rgba(15,23,42,0.16);">
                    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:flex-start;">
                        <div>
                            <button type="button" class="kiu-btn-outline" data-lms-click="backToStudentLmsQuizList(${jsQuote(resourceKey)})" style="border-color:rgba(255,255,255,0.32); color:white; background:rgba(255,255,255,0.08); padding:8px 12px; font-size:12px;"><i class="fas fa-arrow-left"></i> Back to Quizzes</button>
                            <div style="font-size:12px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; opacity:0.8; margin-top:12px;">${escapeHtml(getLmsQuizDisplayLabel(selectedQuiz))}</div>
                            <div style="font-size:24px; font-weight:900; margin-top:8px;">${escapeHtml(selectedQuiz.title || getLmsQuizDisplayLabel(selectedQuiz))}</div>
                            <div style="font-size:13px; opacity:0.92; margin-top:6px;">${escapeHtml(subjectLabel)}  -  ${escapeHtml(groupLabel)}${selectedQuiz.weekLabel ? `  -  ${escapeHtml(selectedQuiz.weekLabel)}` : ''}${refreshedSubmission.variantLabel ? `  -  ${escapeHtml(refreshedSubmission.variantLabel)}` : ''}</div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                            <span style="background:${badge.bg}; color:${badge.color}; padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;">${escapeHtml(badge.label)}</span>
                            ${examSession ? `<span style="background:${sessionGate.status === 'live' ? 'rgba(16,185,129,0.18)' : 'rgba(255,255,255,0.12)'}; border:1px solid ${sessionGate.status === 'live' ? 'rgba(16,185,129,0.32)' : 'rgba(255,255,255,0.18)'}; color:${sessionGate.status === 'live' ? '#d1fae5' : '#dbeafe'}; padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;">${escapeHtml(`Lab session ${sessionGate.status}`)}</span>` : ''}
                            ${blueGate.required ? `<span style="background:${blueGate.connected ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)'}; border:1px solid ${blueGate.connected ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}; color:${blueGate.connected ? '#d1fae5' : '#fee2e2'}; padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;">${blueGate.connected ? 'Verification connected' : 'Verification locked'}</span>` : ''}
                            <span id="lms-student-quiz-countdown" style="background:rgba(255,255,255,0.12); border:1px solid rgba(255,255,255,0.18); padding:8px 12px; border-radius:999px; font-size:12px; font-weight:800;">${effectiveEnd ? 'Calculating timer...' : `Duration: ${selectedQuiz.durationMinutes || 20} min`}</span>
                        </div>
                    </div>
                    ${selectedQuiz.instructions ? `<div style="margin-top:14px; font-size:13px; line-height:1.6; color:rgba(255,255,255,0.9);">${escapeHtml(selectedQuiz.instructions)}</div>` : ''}
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
                    <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Questions</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${activeQuestions.length}</div></div>
                    <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Total Points</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${getAdminQuizTotalScore(variantScopedQuiz)}</div></div>
                    <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Manual Review</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${manualMax > 0 ? `${manualMax} pts` : 'No'}</div></div>
                    <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Outside Actions</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${outsideActionCount}</div><div style="font-size:11px; color:var(--lux-text-muted); margin-top:4px;">Warnings ${warningCount} / ${protectionConfig.maxWarnings}</div></div>
                </div>
                ${focusState.active && focusState.warningMessage ? `<div style="padding:16px 18px; border-radius:18px; background:rgba(var(--lux-accent-rgb),0.06); border:1px solid rgba(251,146,60,0.25); color:var(--lux-text-muted);"><strong>Warning recorded:</strong> ${escapeHtml(focusState.warningMessage)}. TA / professor can see this on their monitoring screen.</div>` : ''}
                ${latestProctorEvent ? `<div style="padding:14px 16px; border-radius:18px; background:var(--lux-bg-soft); border:1px solid rgba(148,163,184,0.18); color:var(--lux-text-muted); font-size:12px;"><strong>Latest monitoring event:</strong> ${escapeHtml(latestProctorEvent.note || latestProctorEvent.type || 'Activity logged')}<div style="margin-top:4px; color:var(--lux-text-muted);">${escapeHtml(formatLmsDateTime(latestProctorEvent.createdAt))}</div></div>` : ''}
                ${sessionGate.required ? `<div style="padding:16px 18px; border-radius:18px; background:${sessionGate.startUnlocked ? '#ecfdf5' : '#eff6ff'}; border:1px solid ${sessionGate.startUnlocked ? 'rgba(16,185,129,0.22)' : 'rgba(59,130,246,0.2)'}; color:${sessionGate.startUnlocked ? '#047857' : '#1d4ed8'};"><strong>KIU Wired Lab Exam Session:</strong> ${escapeHtml(sessionGate.startUnlocked ? 'Your account is approved on the exam list and staff already started the room session.' : sessionGate.message || 'Waiting for lab session start.')}${examSession?.endsAt ? `<div style="margin-top:8px; font-size:12px; color:inherit;">Session ends ${escapeHtml(formatLmsDateTime(examSession.endsAt))}</div>` : ''}</div>` : ''}
                ${refreshedAvailability === 'upcoming' ? `<div style="padding:16px 18px; border-radius:18px; background:rgba(var(--lux-accent-rgb),0.06); border:1px solid rgba(59,130,246,0.2); color:var(--lux-accent);">This quiz is scheduled. It will open automatically at ${escapeHtml(formatLmsDateTime(selectedQuiz.availableFrom))}.</div>` : ''}
                ${refreshedAvailability === 'closed' && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || '')) ? `<div style="padding:16px 18px; border-radius:18px; background:rgba(220,38,38,0.06); border:1px solid rgba(239,68,68,0.18); color:#dc2626;">This quiz is closed.</div>` : ''}
                ${requiresCover ? `
                    <div style="display:grid; place-items:center; min-height:420px; background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:24px; box-shadow:0 18px 36px rgba(15,23,42,0.05);">
                        <div style="max-width:520px; padding:32px; text-align:center;">
                            <div style="width:72px; height:72px; border-radius:22px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-accent); display:grid; place-items:center; font-size:28px; margin:0 auto 18px;">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div style="font-size:26px; font-weight:900; color:var(--lux-text);">Quiz Protected View</div>
                            <div style="font-size:13px; color:var(--lux-text-muted); line-height:1.7; margin-top:10px;">
                                The quiz body stays hidden until the student presses <strong>Start Quiz</strong>.
                                After that, quiz focus mode will open, portal navigation will hide, suspicious actions will be reported to TA / professor, and the system will auto-submit after <strong>${protectionConfig.maxWarnings} warnings</strong>.
                            </div>
                            ${sessionGate.required ? `<div style="margin-top:14px; padding:14px 16px; border-radius:16px; background:${sessionGate.startUnlocked ? '#ecfdf5' : '#eff6ff'}; border:1px solid ${sessionGate.startUnlocked ? 'rgba(16,185,129,0.22)' : 'rgba(59,130,246,0.18)'}; text-align:left;"><div style="font-size:11px; font-weight:900; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Lab Session Gate</div><div style="font-size:13px; color:var(--lux-text-muted); margin-top:8px; line-height:1.7;">${escapeHtml(sessionGate.startUnlocked ? 'Staff started the lab exam session and your account is on the approved list.' : sessionGate.message || 'Waiting for lab session start.')}</div></div>` : ''}
                            <div style="display:grid; gap:10px; margin-top:18px; text-align:left; padding:16px 18px; border-radius:18px; background:var(--lux-bg-soft); border:1px solid #dbe7f5;">
                                <div style="font-size:11px; font-weight:900; letter-spacing:0.08em; text-transform:uppercase; color:var(--lux-text-muted);">Protection Rules</div>
                                <div style="font-size:13px; color:var(--lux-text-muted); line-height:1.7;">
                                    <div>Fullscreen is required while the quiz is open.</div>
                                    <div>Leaving the tab, refreshing, opening blocked shortcuts, copy/paste, right click, selection, and drag actions are monitored.</div>
                                    <div>Leaving the protected quiz view before finishing submits the attempt immediately.</div>
                                </div>
                            </div>
                            <div style="display:flex; justify-content:center; margin-top:22px;">
                                <button type="button" class="kiu-btn-blue" data-lms-click="revealLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)})" ${(blueGate.required && !blueGate.startUnlocked) || (sessionGate.required && !sessionGate.startUnlocked) ? 'disabled' : ''} style="padding:12px 18px; font-size:13px; ${(blueGate.required && !blueGate.startUnlocked) || (sessionGate.required && !sessionGate.startUnlocked) ? 'opacity:0.55; cursor:not-allowed;' : ''}">
                                    <i class="fas fa-play"></i> Start Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${!requiresCover && ['open', 'in-progress', 'submitted', 'auto-submitted', 'graded', 'closed'].includes(refreshedAvailability) ? (
                    sessionLockActive
                        ? `<div style="display:grid; place-items:center; min-height:420px; background:var(--lux-surface); border:1px solid rgba(59,130,246,0.16); border-radius:24px; box-shadow:0 18px 36px rgba(15,23,42,0.05);">
                            <div style="max-width:620px; padding:34px; text-align:center;">
                                <div style="width:72px; height:72px; border-radius:22px; background:rgba(var(--lux-accent-rgb),0.10); color:var(--lux-accent); display:grid; place-items:center; font-size:28px; margin:0 auto 18px;">
                                    <i class="fas fa-desktop"></i>
                                </div>
                                <div style="font-size:26px; font-weight:900; color:var(--lux-text);">Lab Exam Session Locked</div>
                                <div style="font-size:13px; color:var(--lux-text-muted); line-height:1.8; margin-top:10px;">${escapeHtml(sessionGate.message || 'This lab exam session is locked for your account right now.')}</div>
                                ${examSession?.endsAt ? `<div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-top:18px;"><span style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-accent); font-size:12px; font-weight:900; border:1px solid rgba(59,130,246,0.18);"><i class="fas fa-stopwatch"></i> Session window ends ${escapeHtml(formatLmsDateTime(examSession.endsAt))}</span></div>` : ''}
                            </div>
                        </div>`
                        : blueLockActive
                        ? `<div style="display:grid; place-items:center; min-height:420px; background:var(--lux-surface); border:1px solid rgba(239,68,68,0.16); border-radius:24px; box-shadow:0 18px 36px rgba(15,23,42,0.05);">
                            <div style="max-width:620px; padding:34px; text-align:center;">
                                <div style="width:72px; height:72px; border-radius:22px; background:rgba(220,38,38,0.08); color:#dc2626; display:grid; place-items:center; font-size:28px; margin:0 auto 18px;">
                                    <i class="fas fa-wifi"></i>
                                </div>
                                <div style="font-size:26px; font-weight:900; color:var(--lux-text);">Quiz Locked Until Verification Reconnects</div>
                                <div style="font-size:13px; color:var(--lux-text-muted); line-height:1.8; margin-top:10px;">Your saved answers are preserved, but the quiz body stays blank while this account is disconnected from exam verification. Reconnect and this page will restore automatically.</div>
                                <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap; margin-top:18px;">
                                    <span style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; background:rgba(220,38,38,0.06); color:#dc2626; font-size:12px; font-weight:900; border:1px solid rgba(239,68,68,0.18);"><i class="fas fa-stopwatch"></i> Disconnected for <span id="lms-blue-disconnect-timer">${escapeHtml(formatLmsDurationLabel(blueGate.disconnectElapsedMs))}</span></span>
                                    <span style="display:inline-flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-text-muted); font-size:12px; font-weight:900; border:1px solid rgba(251,146,60,0.18);"><i class="fas fa-triangle-exclamation"></i> Submit stays locked while disconnected</span>
                                </div>
                            </div>
                        </div>`
                        : `<div style="display:grid; gap:14px;">${answersMarkup}${showSubmit ? `<div style="display:flex; justify-content:flex-end;"><button type="button" class="kiu-btn-blue" data-lms-click="submitLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)})" style="padding:10px 14px; font-size:12px;"><i class="fas fa-paper-plane"></i> Submit Answers</button></div>` : ''}</div>`
                ) : ''}
                ${resultMarkup}
            </div>
        `;

        if (blueLockActive) {
            updateVisibleKiuBlueDisconnectTimer();
            clearKiuBlueDisconnectInterval();
            activeKiuBlueDisconnectInterval = setInterval(updateVisibleKiuBlueDisconnectTimer, 1000);
        } else {
            clearKiuBlueDisconnectInterval();
        }

        if (!requiresCover && !blueLockActive && effectiveEnd && ['open', 'in-progress'].includes(refreshedAvailability)) {
            const countdownEl = document.getElementById('lms-student-quiz-countdown');
            const tick = () => {
                if (!countdownEl) return;
                const freshQuiz = getLmsQuizById(resourceKey, selectedQuiz.id);
                const freshSubmission = getLmsQuizSubmission(resourceKey, selectedQuiz.id, studentId);
                const endAt = getLmsQuizEffectiveEndAt(freshQuiz, freshSubmission);
                if (!endAt) {
                    countdownEl.textContent = `Duration: ${freshQuiz?.durationMinutes || 20} min`;
                    return;
                }
                const diff = endAt.getTime() - Date.now();
                if (diff <= 0) {
                    countdownEl.textContent = 'Time is over';
                    clearActiveLmsQuizCountdown();
                    finalizeLmsQuizSubmission(resourceKey, freshQuiz, freshSubmission, studentId, studentName, 'auto-submit');
                    saveState();
                    stopKiuBlueStudentHeartbeat({ unregister: true });
                    disableLmsStudentQuizFocusMode();
                    redirectStudentAfterQuizSubmission(resourceKey, subject, group);
                    return;
                }
                countdownEl.textContent = `Time left: ${formatCountdownDuration(diff)}`;
            };
            tick();
            activeLmsQuizCountdownInterval = setInterval(tick, 1000);
        }
    } catch (error) {
        console.error('Student LMS quiz render failed', error);
        clearActiveLmsQuizCountdown();
        contentArea.innerHTML = `
            <div style="display:grid; gap:16px;">
                <div style="background:var(--lux-surface); border:1px solid #fca5a5; border-radius:22px; padding:24px; box-shadow:0 18px 36px rgba(15,23,42,0.08);">
                    <div style="font-size:18px; font-weight:900; color:#991b1b;">My Quizzes could not load</div>
                    <div style="font-size:13px; color:var(--lux-text-muted); margin-top:8px;">The student quiz view hit a runtime problem, so we stopped it before it could break the whole LMS page.</div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">
                        <button type="button" class="kiu-btn-blue" data-lms-click="renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId)" style="padding:10px 14px; font-size:12px;">
                            <i class="fas fa-rotate-right"></i> Reload My Quizzes
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

function toggleLmsQuizReviewPanel(resourceKey, quizId) {
    closeLmsQuizBoardModal();
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    openLmsQuizReviewBoardModal(resourceKey, quizId);
}

function closeLmsQuizReviewBoardModal() {
    document.getElementById('lms-quiz-review-board-modal')?.remove();
}

function openLmsQuizReviewBoardModal(resourceKey, quizId) {
    closeLmsQuizFloatingLayers();
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;

    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-review-board-modal';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:8350; background:rgba(15,23,42,0.76); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:24px;';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizReviewBoardModal();
    };
    overlay.innerHTML = `
        <div style="width:min(1240px, 100%); max-height:92vh; overflow:auto; background:var(--lux-bg-soft); border-radius:24px; border:1px solid rgba(148,163,184,0.2); box-shadow:0 30px 90px rgba(15,23,42,0.38);">
            <div style="padding:18px 22px; background:linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue)); color:white; display:flex; justify-content:space-between; gap:14px; align-items:flex-start;">
                <div>
                    <div style="font-size:20px; font-weight:900;">View Submissions</div>
                    <div style="font-size:12px; opacity:0.92; margin-top:4px;">${escapeHtml(getLmsQuizDisplayLabel(quiz))}  -  ${escapeHtml(quiz.title || 'Untitled Quiz')}</div>
                </div>
                <button type="button" class="kiu-btn-outline" data-lms-click="closeLmsQuizReviewBoardModal()" style="border-color:rgba(255,255,255,0.35); color:white; background:rgba(255,255,255,0.08);"><i class="fas fa-times"></i> Close</button>
            </div>
            <div style="padding:22px;">
                ${renderLmsQuizReviewPanel(resourceKey, quiz)}
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
}

function setLmsQuizAttendanceStatus(resourceKey, quizId, studentId, status) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, { id: studentId, name: `Student ${studentId}` });
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (getLmsQuizExamSession(quiz)) {
        return;
    }
    submission.attendanceStatus = String(status || '');
    submission.attendanceVerifiedAt = submission.attendanceStatus ? new Date().toISOString() : null;
    submission.attendanceVerifiedBy = submission.attendanceStatus ? getSimulatedUserName() : '';
    submission.history = Array.isArray(submission.history) ? submission.history : [];
    submission.history.push({
        action: 'attendance',
        updatedAt: submission.attendanceVerifiedAt || new Date().toISOString(),
        updatedBy: getSimulatedUserName(),
        note: submission.attendanceStatus || 'Cleared'
    });
    const examSession = getLmsQuizExamSession(quiz);
    if (examSession) {
        examSession.attendanceByStudentId = examSession.attendanceByStudentId || {};
        examSession.attendanceByStudentId[String(studentId)] = {
            status: submission.attendanceStatus,
            verifiedAt: submission.attendanceVerifiedAt,
            verifiedBy: submission.attendanceVerifiedBy
        };
        examSession.updatedAt = submission.attendanceVerifiedAt || new Date().toISOString();
        syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, { id: studentId, name: submission.studentName || `Student ${studentId}` });
        updateLmsExamSessionSummary(examSession.id);
    }
    const runtime = getKiuBlueExamRuntime();
    const sessionEntry = getKiuBlueStudentSessionEntry(studentId);
    if (runtime.activeSession?.students && Array.isArray(runtime.activeSession.students)) {
        const targetEntry = runtime.activeSession.students.find(entry => String(entry?.studentId || '') === String(studentId));
        if (targetEntry) {
            targetEntry.present = ['present', 'late'].includes(String(submission.attendanceStatus || '').trim().toLowerCase());
            targetEntry.presentStatus = submission.attendanceStatus || '';
            targetEntry.attendanceVerifiedAt = submission.attendanceVerifiedAt;
            targetEntry.attendanceVerifiedBy = submission.attendanceVerifiedBy;
        }
    }
    saveState();
    syncKiuBlueAttendanceToHelper(resourceKey, quizId, studentId, submission).then(() => {
        if (document.getElementById('lms-content-area')) {
            rerenderCurrentLmsQuizWorkspace();
        }
    });
}

function renderLmsQuizReviewPanel(resourceKey, quiz) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const examSession = syncLmsExamSessionLifecycle(quiz);
    const parsed = parseLmsCourseKey(resourceKey);
    const students = parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : [];
    if (!students.length) {
        return `<div style="margin-top:14px; padding:16px; border-radius:16px; background:var(--lux-bg-soft); border:1px dashed #cbd5e1; color:var(--lux-text-muted);">No enrolled students were found for this group yet.</div>`;
    }
    if (isLmsQuizBlueExamRequired(quiz)) {
        ensureKiuBlueStatusSoon();
    }
    const quizStats = getLmsQuizSubmissionStats(resourceKey, quiz);
    const sessionStats = examSession ? getLmsExamSessionMonitorStats(examSession, resourceKey, quiz) : null;

    const rows = students.map(student => {
        const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, student);
        syncLmsQuizSubmissionVariant(quiz, submission, student.id);
        syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, student);
        syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, student);
        const status = submission.status && submission.status !== 'not-started' ? submission.status : 'draft';
        const badge = getLmsQuizStatusBadge(status);
        const accessAllowed = isStudentAllowedForLmsQuiz(resourceKey, quiz, student.id);
        const latestProctorEvent = getLmsQuizLatestProctorEvent(submission);
        const alertCount = getLmsQuizProctorAlertCount(submission);
        const blocked = submission.sessionBlocked === true;
        return `
            <tr>
                <td style="text-align:left;">${escapeHtml(student.id)}</td>
                <td style="text-align:left; font-weight:700;">${escapeHtml(student.name)}</td>
                <td>${submission.variantLabel ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-accent); font-size:11px; font-weight:800;">${escapeHtml(submission.variantLabel)}</span>` : '<span style="font-size:11px; color:var(--lux-text-muted);">Standard</span>'}</td>
                <td><span style="background:${accessAllowed ? '#ecfdf5' : '#fef2f2'}; color:${accessAllowed ? '#047857' : '#b91c1c'}; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:800;">${accessAllowed ? 'Allowed' : 'Blocked'}</span></td>
                <td>${examSession
                    ? `<div style="display:grid; gap:4px;"><span style="display:inline-flex; align-items:center; gap:6px; width:max-content; padding:6px 10px; border-radius:999px; background:${blocked ? '#fef2f2' : '#ecfdf5'}; color:${blocked ? '#b91c1c' : '#047857'}; font-size:11px; font-weight:800;">${blocked ? 'Blocked by staff' : 'Approved roster'}</span><span style="font-size:10px; color:var(--lux-text-muted); margin-top:2px;">Handwritten room check is handled outside the portal.</span></div>`
                    : `<select data-lms-change="setLmsQuizAttendanceStatus(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)}, this.value)" style="padding:8px 10px; border:1px solid var(--kiu-border); border-radius:10px; outline:none;">
                        <option value="" ${!submission.attendanceStatus ? 'selected' : ''}>Not checked</option>
                        <option value="Present" ${submission.attendanceStatus === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Late" ${submission.attendanceStatus === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Absent" ${submission.attendanceStatus === 'Absent' ? 'selected' : ''}>Absent</option>
                    </select>
                    <div style="font-size:10px; color:var(--lux-text-muted); margin-top:6px;">${submission.attendanceVerifiedAt ? `Verified ${escapeHtml(formatLmsDateTime(submission.attendanceVerifiedAt))}` : 'Waiting for attendance check'}</div>`}
                </td>
                <td><span style="background:${badge.bg}; color:${badge.color}; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:800;">${escapeHtml(badge.label)}</span></td>
                <td style="text-align:left;">
                    <div style="display:grid; gap:4px;">
                        <span style="display:inline-flex; align-items:center; gap:6px; width:max-content; padding:6px 10px; border-radius:999px; background:${alertCount ? '#fff7ed' : '#ecfdf5'}; color:${alertCount ? '#c2410c' : '#047857'}; font-size:11px; font-weight:800;">${alertCount ? `${alertCount} warning${alertCount === 1 ? '' : 's'}` : 'Clean'}</span>
                        <span style="font-size:11px; color:var(--lux-text-muted);">${latestProctorEvent ? `${latestProctorEvent.note}  -  ${formatLmsDateTime(latestProctorEvent.createdAt)}` : 'No suspicious events logged.'}</span>
                        <span style="font-size:11px; color:var(--lux-text-muted);">Outside actions: ${Number(submission.outsideActionCount || 0)}</span>
                    </div>
                </td>
                <td style="font-weight:800; color:var(--kiu-navy);">${Number(submission.finalScoreRaw ?? submission.autoScoreRaw ?? 0)} / ${getAdminQuizTotalScore({ ...quiz, questions: getLmsQuizQuestionsForStudent(quiz, student.id, submission) })}</td>
                <td style="font-weight:800; color:var(--kiu-blue);">${submission.gradebookScore === null || submission.gradebookScore === undefined ? '-' : Number(submission.gradebookScore)}</td>
                <td style="text-align:right;">
                    <div style="display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap;">
                        ${examSession ? `<button type="button" class="kiu-btn-outline" style="padding:7px 10px; font-size:11px; font-weight:800; ${blocked ? 'color:var(--lux-accent); border-color:#bbf7d0;' : 'color:#dc2626; border-color:#fecaca;'}" data-lms-click="toggleLmsExamSessionStudentBlock(${jsQuote(examSession.id)}, ${jsQuote(student.id)})"><i class="fas ${blocked ? 'fa-unlock' : 'fa-user-slash'}"></i> ${blocked ? 'Unblock' : 'Block'}</button>` : ''}
                        <button type="button" class="kiu-btn-outline" style="padding:7px 10px; font-size:11px; font-weight:800;" data-lms-click="openLmsQuizReviewModal(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)})"><i class="fas fa-eye"></i> View Quiz Paper</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    return `
        ${quizStats.alertCount > 0 ? `<div style="margin-top:14px; padding:14px 16px; border-radius:16px; background:rgba(var(--lux-accent-rgb),0.06); border:1px solid rgba(249,115,22,0.22); color:var(--lux-text-muted);">
            <div style="font-size:13px; font-weight:800;">${quizStats.alertCount} live warning${quizStats.alertCount === 1 ? '' : 's'} detected across ${quizStats.alertedStudents} student${quizStats.alertedStudents === 1 ? '' : 's'}.</div>
            ${quizStats.latestAlert ? `<div style="font-size:12px; margin-top:6px; color:var(--lux-text-muted);">Latest: ${escapeHtml(quizStats.latestAlert.note || quizStats.latestAlert.type || 'Monitoring event')}  -  ${escapeHtml(formatLmsDateTime(quizStats.latestAlert.createdAt))}</div>` : ''}
        </div>` : ''}
        ${examSession ? `<div style="margin-top:14px; padding:14px 16px; border-radius:16px; background:${examSession.status === 'live' ? '#ecfdf5' : examSession.status === 'closed' ? '#fef2f2' : '#eff6ff'}; border:1px solid ${examSession.status === 'live' ? 'rgba(16,185,129,0.22)' : examSession.status === 'closed' ? 'rgba(239,68,68,0.18)' : 'rgba(59,130,246,0.18)'}; color:${examSession.status === 'live' ? '#047857' : examSession.status === 'closed' ? '#b91c1c' : '#1d4ed8'};">
            <div style="font-size:13px; font-weight:800;">KIU Wired Lab Exam Session: ${escapeHtml(examSession.status)}</div>
            <div style="font-size:12px; margin-top:6px; color:inherit;">${sessionStats.allowedCount} roster students  -  ${sessionStats.presentCount} approved accounts  -  ${sessionStats.blockedCount} blocked  -  ${sessionStats.inProgressCount} running  -  ${sessionStats.submittedCount} submitted</div>
        </div>` : ''}
        <div style="margin-top:14px; border:1px solid rgba(148,163,184,0.18); border-radius:18px; overflow:hidden; background:var(--lux-bg-soft);">
            <div style="padding:14px 16px; background:white; border-bottom:1px solid rgba(148,163,184,0.16); font-size:12px; font-weight:800; color:var(--lux-text-muted);">Student submissions and attendance</div>
            <div style="overflow:auto;">
                <table class="kiu-table" style="font-size:12px; min-width:920px;">
                    <thead>
                        <tr>
                            <th style="text-align:left;">ID</th>
                            <th style="text-align:left;">Student</th>
                            <th>Variant</th>
                            <th>Access</th>
                            <th>${examSession ? 'Approval' : 'Attendance'}</th>
                            <th>Status</th>
                            <th style="text-align:left;">Monitoring</th>
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
        return '<div style="padding:16px; border-radius:16px; background:var(--lux-surface); border:1px dashed #cbd5e1; color:var(--lux-text-muted);">Quiz paper could not be found.</div>';
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
            ? `<div style="display:grid; gap:10px; margin-top:14px;">
                ${(question.options || []).map((option, optionIndex) => {
                    const isSelected = Number.isFinite(selectedOption) && selectedOption === optionIndex;
                    const isCorrect = Number.isFinite(correctOption) && correctOption === optionIndex;
                    const palette = isSelected && isCorrect
                        ? { bg: '#ecfdf5', border: '#10b981', text: '#065f46', badge: 'Selected  -  Correct' }
                        : isSelected && !isCorrect
                            ? { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', badge: 'Selected  -  Incorrect' }
                            : !isSelected && isCorrect
                                ? { bg: '#f0fdf4', border: '#22c55e', text: '#166534', badge: 'Correct answer' }
                                : { bg: '#ffffff', border: '#dbe7f5', text: '#334155', badge: '' };
                    return `
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:12px 14px; border:2px solid ${palette.border}; border-radius:14px; background:${palette.bg};">
                            <div style="display:flex; gap:10px; align-items:flex-start;">
                                <span style="width:24px; height:24px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; background:${isSelected ? palette.border : '#e2e8f0'}; color:${isSelected ? '#fff' : '#475569'}; font-size:11px; font-weight:900;">${String.fromCharCode(65 + optionIndex)}</span>
                                <div style="font-size:14px; color:${palette.text}; line-height:1.55; font-weight:${isSelected || isCorrect ? '800' : '600'};">${escapeHtml(option || `Option ${optionIndex + 1}`)}</div>
                            </div>
                            ${palette.badge ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 9px; border-radius:999px; background:rgba(255,255,255,0.76); font-size:10px; font-weight:900; color:${palette.text}; white-space:nowrap;">${escapeHtml(palette.badge)}</span>` : ''}
                        </div>
                    `;
                }).join('')}
                ${!Number.isFinite(selectedOption) ? `<div style="font-size:12px; color:var(--lux-text-muted); padding:10px 12px; border-radius:12px; background:var(--lux-bg-soft); border:1px dashed #cbd5e1;">Student did not select an option.</div>` : ''}
            </div>`
            : '';
        return `
            <div style="padding:18px 20px; border:1px solid rgba(148,163,184,0.18); border-radius:18px; background:var(--lux-surface); box-shadow:0 12px 30px rgba(15,23,42,0.04);">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                    <div style="font-size:12px; font-weight:800; color:var(--lux-text-muted);">Question ${index + 1}  -  ${isWritten ? 'Written' : 'Multiple Choice'}  -  ${Number(question.score || 0)} pts</div>
                    ${!isWritten ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-accent); font-size:11px; font-weight:900;">${Number.isFinite(selectedOption) ? `Selected ${String.fromCharCode(65 + selectedOption)}` : 'No selection'}</span>` : ''}
                </div>
                <div style="font-size:16px; font-weight:900; color:var(--lux-text); margin-top:10px; line-height:1.5;">${escapeHtml(question.text || '')}</div>
                ${isWritten ? `
                    <div style="margin-top:14px; padding:14px 16px; border-radius:16px; background:var(--lux-bg-soft); border:1px solid #dbe7f5;">
                        <div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted); margin-bottom:8px;">Student answer</div>
                        <div style="font-size:14px; color:var(--lux-text-muted); line-height:1.7; white-space:pre-wrap;">${escapeHtml(answer.text || 'No answer submitted')}</div>
                    </div>
                ` : mcqOptionsMarkup}
                ${isWritten ? `
                    <div style="font-size:11px; color:var(--lux-text-muted); margin-top:10px;">Reference answer: ${escapeHtml(question.expectedAnswer || 'No key')}</div>
                    <div style="display:flex; justify-content:flex-end; margin-top:12px;">
                        <label style="display:grid; gap:6px; font-size:11px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase; min-width:180px;">
                            Written score
                            <input id="${manualInputId}" data-lms-written-score="true" data-question-id="${escapeHtml(question.id)}" type="number" min="0" max="${questionManualMax}" value="${submission.manualScoresByQuestion?.[question.id] === null || submission.manualScoresByQuestion?.[question.id] === undefined ? '' : Number(submission.manualScoresByQuestion[question.id])}" placeholder="0 - ${questionManualMax}" style="min-height:42px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none;">
                        </label>
                    </div>
                ` : `<div style="margin-top:12px; display:inline-flex; align-items:center; gap:8px; padding:8px 10px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.05); color:var(--lux-accent); border:1px solid rgba(16,185,129,0.2); font-size:11px; font-weight:800;"><i class="fas fa-bolt"></i> Auto-scored by computer</div>`}
            </div>
        `;
    }).join('');
    const secondaryAction = options.hideAction
        ? `<button type="button" class="kiu-btn-outline" data-lms-click="${options.hideAction}" style="padding:10px 14px; font-size:12px;">Hide quiz</button>`
        : `<button type="button" class="kiu-btn-outline" data-lms-click="document.getElementById('lms-quiz-review-modal')?.remove()" style="padding:10px 14px; font-size:12px;">Close</button>`;
    return `
        <div style="display:grid; gap:16px; padding:${options.embedded ? '16px' : '22px'}; border-radius:${options.embedded ? '18px' : '0'}; background:${options.embedded ? '#f8fbff' : 'transparent'}; border:${options.embedded ? '1px solid rgba(37,99,235,0.14)' : 'none'}; margin-top:${options.embedded ? '8px' : '0'};">
            <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                <div>
                    <div style="font-size:16px; font-weight:900; color:var(--kiu-navy);">${escapeHtml(student.name)}  -  ${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                    <div style="font-size:12px; color:var(--lux-text-muted); margin-top:4px;">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}${submission.variantLabel ? `  -  ${escapeHtml(submission.variantLabel)}` : ''}</div>
                </div>
                ${options.embedded ? `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:rgba(var(--lux-accent-rgb),0.06); color:var(--lux-accent); font-size:11px; font-weight:800;"><i class="fas fa-file-alt"></i> Gradebook review</span>` : ''}
            </div>
            <div style="display:flex; gap:12px; flex-wrap:wrap;">
                <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5; min-width:180px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Auto Score</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${Number(submission.autoScoreRaw || 0)}</div></div>
                <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5; min-width:180px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Manual Remaining</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${manualMax}</div></div>
                <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5; min-width:180px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Current Final</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${submission.finalScoreRaw === null || submission.finalScoreRaw === undefined ? '-' : Number(submission.finalScoreRaw)}</div></div>
                <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5; min-width:180px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Warnings</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${getLmsQuizProctorAlertCount(submission)}</div></div>
                ${submission.variantLabel ? `<div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5; min-width:180px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Assigned Variant</div><div style="font-size:18px; font-weight:900; color:var(--lux-text); margin-top:6px;">${escapeHtml(submission.variantLabel)}</div></div>` : ''}
                <div style="padding:14px 16px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5; min-width:180px;"><div style="font-size:11px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted);">Outside Actions</div><div style="font-size:24px; font-weight:900; color:var(--lux-text); margin-top:6px;">${Number(submission.outsideActionCount || 0)}</div></div>
            </div>
            <div style="padding:16px 18px; border-radius:18px; background:var(--lux-surface); border:1px solid #dbe7f5;">
                <div style="font-size:12px; font-weight:800; text-transform:uppercase; color:var(--lux-text-muted); margin-bottom:10px;">Monitoring Timeline</div>
                <div style="display:grid; gap:8px; max-height:180px; overflow:auto;">
                    ${proctorEvents.length ? proctorEvents.map(event => `
                        <div style="padding:10px 12px; border-radius:14px; background:var(--lux-bg-soft); border:1px solid rgba(148,163,184,0.18);">
                            <div style="font-size:12px; font-weight:800; color:var(--lux-text);">${escapeHtml(event.note || event.type || 'Monitoring event')}</div>
                            <div style="font-size:11px; color:var(--lux-text-muted); margin-top:4px;">${escapeHtml(formatLmsDateTime(event.createdAt))}</div>
                        </div>
                    `).join('') : `<div style="font-size:12px; color:var(--lux-text-muted);">No monitoring warnings for this student.</div>`}
                </div>
            </div>
            <div style="display:grid; grid-template-columns:minmax(0, 220px) minmax(0, 1fr); gap:12px; align-items:end;">
                ${examSession
                    ? `<div style="display:grid; gap:6px; font-size:11px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase;"><span>Exam List</span><div style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; display:flex; align-items:center; background:var(--lux-bg-soft); color:var(--lux-text); font-size:12px; font-weight:800;">${submission.sessionBlocked ? 'Blocked by staff' : 'Approved by exam list'}</div><span style="font-size:10px; color:var(--lux-text-muted);">Handwritten room attendance is handled outside the portal.</span></div>`
                    : `<label style="display:grid; gap:6px; font-size:11px; font-weight:800; color:var(--lux-text-muted); text-transform:uppercase;">Attendance<select id="${attendanceId}" style="min-height:44px; border:1px solid #dbe7f5; border-radius:12px; padding:0 12px; outline:none;"><option value="" ${!submission.attendanceStatus ? 'selected' : ''}>Not checked</option><option value="Present" ${submission.attendanceStatus === 'Present' ? 'selected' : ''}>Present</option><option value="Late" ${submission.attendanceStatus === 'Late' ? 'selected' : ''}>Late</option><option value="Absent" ${submission.attendanceStatus === 'Absent' ? 'selected' : ''}>Absent</option></select><span style="font-size:10px; color:var(--lux-text-muted);">${submission.attendanceVerifiedAt ? `Verified ${escapeHtml(formatLmsDateTime(submission.attendanceVerifiedAt))} by ${escapeHtml(submission.attendanceVerifiedBy || 'Staff')}` : 'Not verified yet'}</span></label>`}
                <div style="display:flex; justify-content:flex-end; gap:10px; flex-wrap:wrap;">${secondaryAction}<button type="button" class="kiu-btn-blue" data-lms-click="saveLmsQuizManualGrade(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)}, ${jsQuote(attendanceId)}, ${jsQuote(scopeToken)}, ${jsQuote(options.focusSectionKey || '')}, ${jsQuote(options.studentName || student.name || '')})" style="padding:10px 14px; font-size:12px;"><i class="fas fa-save"></i> Save Review</button></div>
            </div>
            <div style="display:grid; gap:12px;">${answerRows || '<div style="padding:20px; background:var(--lux-surface); border:1px dashed #cbd5e1; border-radius:16px; color:var(--lux-text-muted);">No answers recorded yet.</div>'}</div>
        </div>
    `;
}

function toggleStudentQuizPaperInline(studentId, criterion, number, panelId, studentName = '') {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    if (panel.dataset.expanded === 'true') {
        panel.dataset.expanded = 'false';
        panel.style.display = 'none';
        panel.innerHTML = '';
        return;
    }
    const rosterKey = currentRosterId || currentCourseId;
    const roster = KIU_STATE.studentGrades[rosterKey] || [];
    const safeRecord = roster.find(r => String(r.id) === String(studentId));
    if (!safeRecord) return;
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber)
        || getAssessmentEntries(safeRecord, normalizedCriterion)
            .find(item => normalizeAssessmentNumber(item.number, 1) === targetNumber);
    const source = resolveLmsQuizSourceFromAssessmentEntry(entry);
    if (!source) {
        panel.style.display = 'block';
        panel.dataset.expanded = 'true';
        panel.innerHTML = '<div style="padding:14px 16px; border-radius:14px; background:var(--lux-surface); border:1px dashed #cbd5e1; color:var(--lux-text-muted);">This grade entry is not linked to a saved LMS quiz paper yet.</div>';
        return;
    }
    panel.innerHTML = buildLmsQuizReviewPaperMarkup(source.resourceKey, source.quizId, studentId, {
        embedded: true,
        scopeToken: `inline-${panelId}`,
        focusSectionKey: normalizedCriterion,
        studentName,
        hideAction: `toggleStudentQuizPaperInline(${jsQuote(studentId)}, ${jsQuote(normalizedCriterion)}, ${targetNumber}, ${jsQuote(panelId)}, ${jsQuote(studentName)})`
    });
    panel.dataset.expanded = 'true';
    panel.style.display = 'block';
}

function openLmsQuizReviewModal(resourceKey, quizId, studentId) {
    closeLmsQuizFloatingLayers();
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;
    const parsed = parseLmsCourseKey(resourceKey);
    const student = (parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : []).find(item => String(item.id) === String(studentId))
        || { id: studentId, name: `Student ${studentId}` };
    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-review-modal';
    overlay.style.cssText = 'position:fixed; inset:0; z-index:8450; background:rgba(15,23,42,0.72); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:20px;';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div style="width:min(1220px, 100%); height:min(92vh, 1000px); overflow:auto; background:var(--lux-bg-soft); border-radius:24px; border:1px solid rgba(148,163,184,0.18); box-shadow:0 28px 80px rgba(15,23,42,0.35);">
            <div style="padding:18px 22px; background:linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue)); color:white; display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                <div>
                    <div style="font-size:20px; font-weight:900;">${escapeHtml(student.name)}</div>
                    <div style="font-size:12px; opacity:0.92; margin-top:4px;">${escapeHtml(getLmsQuizDisplayLabel(quiz))}  -  ${escapeHtml(quiz.title || '')}</div>
                    <div style="font-size:11px; opacity:0.82; margin-top:6px;">Full submitted quiz view for TA / Professor review</div>
                </div>
                <button type="button" class="kiu-btn-outline" data-lms-click="document.getElementById('lms-quiz-review-modal')?.remove()" style="border-color:rgba(255,255,255,0.35); color:white; background:rgba(255,255,255,0.08);"><i class="fas fa-times"></i> Close</button>
            </div>
            ${buildLmsQuizReviewPaperMarkup(resourceKey, quizId, student.id, { studentName: student.name })}
        </div>
    `;
    document.body.appendChild(overlay);
}
function saveLmsQuizManualGrade(resourceKey, quizId, studentId, attendanceId, scopeToken = '', focusSectionKey = '', studentName = '') {
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;
    const examSession = getLmsQuizExamSession(quiz);
    const parsed = parseLmsCourseKey(resourceKey);
    const student = (parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : []).find(item => String(item.id) === String(studentId))
        || { id: studentId, name: `Student ${studentId}` };
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, student);
    syncLmsQuizSubmissionVariant(quiz, submission, student.id);
    const activeQuestions = getLmsQuizQuestionsForStudent(quiz, student.id, submission);
    const variantQuiz = { ...quiz, questions: activeQuestions };
    const manualMax = getLmsQuizManualMax(variantQuiz);
    const reviewScopeToken = String(scopeToken || `${quizId}-${studentId}`);
    const manualScoresByQuestion = {};
    activeQuestions.forEach(question => {
        if (String(question.type || 'mcq') !== 'written') return;
        const questionMax = getLmsQuizQuestionManualMax(question);
        const inputEl = document.getElementById(`lms-quiz-manual-${toDomToken(`${reviewScopeToken}-${question.id}`)}`);
        const raw = Number(inputEl?.value || 0);
        manualScoresByQuestion[question.id] = Number.isFinite(raw) ? Math.max(0, Math.min(questionMax, raw)) : 0;
    });
    const manualScoreRaw = manualMax > 0
        ? Object.values(manualScoresByQuestion).reduce((sum, value) => sum + Number(value || 0), 0)
        : 0;
    if (!examSession) {
        submission.attendanceStatus = document.getElementById(attendanceId)?.value || submission.attendanceStatus || '';
    } else {
        submission.attendanceStatus = '';
        submission.attendanceVerifiedAt = null;
        submission.attendanceVerifiedBy = '';
    }
    submission.manualScoresByQuestion = manualScoresByQuestion;
    submission.manualScoreRaw = manualScoreRaw;
    submission.finalScoreRaw = Math.max(0, Number(submission.autoScoreRaw || 0) + Number(manualScoreRaw || 0));
    submission.status = 'graded';
    submission.requiresManualReview = false;
    submission.gradedAt = new Date().toISOString();
    submission.gradedBy = getSimulatedUserName();
    submission.reviewedAt = submission.gradedAt;
    submission.reviewedBy = submission.gradedBy;
    submission.questionResults = buildLmsQuizSubmissionQuestionResults(
        quiz,
        submission.answers || {},
        student.id,
        submission,
        manualScoresByQuestion,
        {
            reviewed: true,
            reviewedAt: submission.reviewedAt,
            reviewedBy: submission.reviewedBy
        }
    );
    submission.responseSummary = buildLmsQuizSubmissionResponseSummary(submission.questionResults);
    submission.gradebookScore = applyQuizScoreToGradebook(resourceKey, variantQuiz, studentId, submission.finalScoreRaw, submission.gradedBy, manualMax > 0 ? 'Manual review' : 'Score synced');
    submission.history = Array.isArray(submission.history) ? submission.history : [];
    submission.history.push({
        action: 'graded',
        updatedAt: submission.gradedAt,
        updatedBy: submission.gradedBy,
        note: `Auto ${Number(submission.autoScoreRaw || 0)} + manual ${manualScoreRaw} = ${submission.finalScoreRaw}${submission.variantLabel ? ` (${submission.variantLabel})` : ''}`
    });
    saveProtectedQuizManualGrade(resourceKey, quizId, {
        studentId,
        studentName: submission.studentName || student.name || `Student ${studentId}`,
        autoScoreRaw: submission.autoScoreRaw,
        manualScoreRaw,
        finalScoreRaw: submission.finalScoreRaw,
        gradebookScore: submission.gradebookScore,
        requiresManualReview: false,
        manualScoresByQuestion,
        questionResults: submission.questionResults,
        responseSummary: submission.responseSummary,
        gradedAt: submission.gradedAt,
        reviewedBy: submission.gradedBy
    }).catch(() => null);
    createPortalSystemNotification({
        userId: studentId,
        source: 'school',
        type: 'grade-evaluated',
        title: 'Grade evaluated',
        text: `${quiz.title || getLmsQuizDisplayLabel(quiz)} was evaluated by ${submission.gradedBy}. Your visible score is ${submission.gradebookScore}.`,
        routePage: 'lms',
        routeData: {
            courseId: parsed.courseId || '',
            groupId: parsed.groupId || ''
        },
        duplicateWindowMs: 1000
    });
    saveState();
    initGradebook();
    if (document.getElementById('student-evaluation-history-modal')) {
        openStudentEvaluationHistoryModal(studentId, studentName || student.name || '', focusSectionKey || normalizeLmsQuizAssessmentType(quiz.assessmentType));
    }
    document.getElementById('lms-quiz-review-modal')?.remove();
    rerenderCurrentLmsQuizWorkspace();
}


