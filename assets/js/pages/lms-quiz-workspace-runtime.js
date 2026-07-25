/* LMS quiz workspace runtime extracted from lms.js. */

/* LMS_STUDENT_QUIZ_FOCUS_STATE_KEY + focus helpers: lms-quiz-focus-runtime.js */
/* Access/builder session: lms-quiz-workspace-session-runtime.js (before this file via LMS_QUIZ_MODULE_URLS). */
/* Pure quiz helpers: lms-quiz-model.js (loaded before this file via LMS_QUIZ_MODULE_URLS). */

const ensureLmsStudentQuizFocusStyles = window.ensureLmsStudentQuizFocusStyles;
const syncLmsStudentQuizFocusChrome = window.syncLmsStudentQuizFocusChrome;
const getLmsStudentQuizFocusState = window.getLmsStudentQuizFocusState;
const setLmsStudentQuizFocusState = window.setLmsStudentQuizFocusState;
const enableLmsStudentQuizFocusMode = window.enableLmsStudentQuizFocusMode;
const disableLmsStudentQuizFocusMode = window.disableLmsStudentQuizFocusMode;

const renderLmsAntiCheatPolicyControls = window.renderLmsAntiCheatPolicyControls;
const readLmsAntiCheatPolicyFromAccessDialog = window.readLmsAntiCheatPolicyFromAccessDialog;
const openLmsQuizAccessDialog = window.openLmsQuizAccessDialog;
const openStudentQuizPaperFromHistory = window.openStudentQuizPaperFromHistory;
const saveLmsQuizAccessSettings = window.saveLmsQuizAccessSettings;
const closeLmsQuiz = window.closeLmsQuiz;
const renderEmbeddedLmsQuizSectionCards = window.renderEmbeddedLmsQuizSectionCards;
const ensureLmsQuizUiState = window.ensureLmsQuizUiState;
const clearActiveLmsQuizCountdown = window.clearActiveLmsQuizCountdown;
const clearActiveLmsPostSubmitLockInterval = window.clearActiveLmsPostSubmitLockInterval;
const updateLmsPostSubmitLockCountdowns = window.updateLmsPostSubmitLockCountdowns;
const startActiveLmsPostSubmitLockInterval = window.startActiveLmsPostSubmitLockInterval;
const decorateLmsPostSubmitLockedQuizCards = window.decorateLmsPostSubmitLockedQuizCards;
const renderAdminQaTestingCard = window.renderAdminQaTestingCard;
const renderSharedQaRoleTestingCard = window.renderSharedQaRoleTestingCard;
const openSharedQaTest = window.openSharedQaTest;
const formatLmsDateTime = window.formatLmsDateTime;
const getCurrentLmsActiveTab = window.getCurrentLmsActiveTab;
const rerenderCurrentLmsTab = window.rerenderCurrentLmsTab;
const resolveLmsQuizWorkspace = window.resolveLmsQuizWorkspace;
const getLmsQuizBuilderEditorState = window.getLmsQuizBuilderEditorState;
const getLmsQuizBuilderDraft = window.getLmsQuizBuilderDraft;
const isLmsQuizTabActive = window.isLmsQuizTabActive;
const resetLmsQuizBuilderDraft = window.resetLmsQuizBuilderDraft;
const rerenderCurrentLmsQuizWorkspace = window.rerenderCurrentLmsQuizWorkspace;
const getActiveLmsQuizBuilderQuestion = window.getActiveLmsQuizBuilderQuestion;
const getActiveLmsQuizBuilderVariant = window.getActiveLmsQuizBuilderVariant;
const setActiveLmsQuizBuilderQuestion = window.setActiveLmsQuizBuilderQuestion;
const toggleLmsQuizVariantSetPanel = window.toggleLmsQuizVariantSetPanel;
const toggleLmsQuizQuestionNavigatorPanel = window.toggleLmsQuizQuestionNavigatorPanel;
const setLmsQuizDraftField = window.setLmsQuizDraftField;
const updateLmsQuizQuestionField = window.updateLmsQuizQuestionField;
const markLmsQuizVariantCustomized = window.markLmsQuizVariantCustomized;
const setActiveLmsQuizBuilderVariant = window.setActiveLmsQuizBuilderVariant;
const updateLmsQuizVariantQuestionField = window.updateLmsQuizVariantQuestionField;
const setLmsQuizVariantQuestionType = window.setLmsQuizVariantQuestionType;
const setLmsQuizVariantQuestionOptionCount = window.setLmsQuizVariantQuestionOptionCount;
const updateLmsQuizVariantQuestionOptionText = window.updateLmsQuizVariantQuestionOptionText;
const setLmsQuizVariantQuestionCorrectOption = window.setLmsQuizVariantQuestionCorrectOption;
const generateLmsQuizVariants = window.generateLmsQuizVariants;
const regenerateAllLmsQuizVariants = window.regenerateAllLmsQuizVariants;
const regenerateLmsQuizVariant = window.regenerateLmsQuizVariant;
const resetLmsQuizVariantsToBasePool = window.resetLmsQuizVariantsToBasePool;
const removeLmsQuizVariantQuestion = window.removeLmsQuizVariantQuestion;
const addBaseQuestionToLmsQuizVariant = window.addBaseQuestionToLmsQuizVariant;
const replaceLmsQuizVariantQuestionWithBaseQuestion = window.replaceLmsQuizVariantQuestionWithBaseQuestion;
const setLmsQuizQuestionType = window.setLmsQuizQuestionType;
const setLmsQuizQuestionOptionCount = window.setLmsQuizQuestionOptionCount;
const updateLmsQuizQuestionOptionText = window.updateLmsQuizQuestionOptionText;
const setLmsQuizQuestionCorrectOption = window.setLmsQuizQuestionCorrectOption;
const addLmsQuizQuestion = window.addLmsQuizQuestion;
const removeActiveLmsQuizBuilderQuestion = window.removeActiveLmsQuizBuilderQuestion;
const stepLmsQuizBuilderQuestion = window.stepLmsQuizBuilderQuestion;
const loadLmsQuizDraftForEdit = window.loadLmsQuizDraftForEdit;
const deleteLmsQuizDraft = window.deleteLmsQuizDraft;
const saveLmsQuizBuilderDraft = window.saveLmsQuizBuilderDraft;

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
    const showReviewPanel = false;
    return `
        <div data-quiz-id="${escapeHtml(quiz.id)}" class="lms-quiz-card">
            <div class="lms-quiz-card-head">
                <div>
                    <div class="lms-quiz-card-badges">
                        <span class="lms-quiz-card-eyebrow">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</span>
                        <span class="lms-quiz-card-status is-${escapeHtml(lifecycle)}">${escapeHtml(lifecycle)}</span>
                        ${quiz.variantEnabled ? `<span class="lms-quiz-card-pill-accent">Variant Set</span>` : ''}
                        ${hasLiveAlerts ? `<span class="lms-quiz-card-pill-alert"><span class="lms-monitor-pulse-dot"></span> Live Alert</span>` : ''}
                    </div>
                    <div class="lms-quiz-card-title">${escapeHtml(quiz.title || 'Untitled Quiz')}</div>
                    <div class="lms-quiz-card-meta">${quiz.availableFrom ? `Starts ${escapeHtml(formatLmsDateTime(quiz.availableFrom))}` : 'Starts immediately'}${quiz.availableUntil ? `  -  Ends ${escapeHtml(formatLmsDateTime(quiz.availableUntil))}` : ''}${variantSummary ? `  -  ${escapeHtml(variantSummary)}` : ''}</div>
                    <div class="lms-quiz-card-meta">Published by: ${escapeHtml(quiz.publishedBy || 'Not published yet')}</div>
                    ${getLmsQuizLifecycleStatus(quiz) !== 'draft' ? `<div class="lms-quiz-card-mode">Mode: ${escapeHtml(String(quiz.publishMode || 'manual') === 'scheduled' ? 'Automatic publish and end by time' : 'Manual publish with manual end')}</div>` : ''}
                </div>
                <div class="lms-quiz-card-score-pill">${escapeHtml(String(getAdminQuizTotalScore(quiz)))} pts</div>
            </div>
            ${hasLiveAlerts ? `<div class="lms-quiz-card-alert-panel">
                <div class="lms-quiz-card-alert-head">
                    <div class="lms-quiz-card-alert-title"><span class="lms-monitor-pulse-dot"></span> Live Alert: ${stats.alertCount} warning${stats.alertCount === 1 ? '' : 's'} across ${stats.alertedStudents} student${stats.alertedStudents === 1 ? '' : 's'}</div>
                    <div class="lms-quiz-card-alert-copy">Monitor this quiz now</div>
                </div>
                ${latestAlertLabel ? `<div class="lms-quiz-card-alert-latest">Latest: ${escapeHtml(latestAlertLabel)}</div>` : ''}
            </div>` : ''}
            <div class="lms-quiz-card-stats">
                <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">${quiz.variantEnabled ? 'Base Pool' : 'Questions'}</div><div class="lms-quiz-card-stat-value">${escapeHtml(String((quiz.questions || []).length))}</div></div>
                <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Allowed</div><div class="lms-quiz-card-stat-value">${escapeHtml(allowCountLabel)}</div></div>
                <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Pending Review</div><div class="lms-quiz-card-stat-value">${escapeHtml(String(stats.pendingReviewCount))}</div></div>
                <div class="lms-quiz-card-stat ${hasLiveAlerts ? 'is-alert' : ''}"><div class="lms-quiz-card-stat-label">${hasLiveAlerts ? 'Live Alerts' : (quiz.variantEnabled ? 'Variants' : 'Graded')}</div><div class="lms-quiz-card-stat-value">${escapeHtml(String(hasLiveAlerts ? stats.alertCount : (quiz.variantEnabled ? ((quiz.variants || []).length || 0) : stats.gradedCount)))}</div></div>
            </div>
            <div class="lms-quiz-card-actions">
                ${sectionType === 'draft'
                    ? `<button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="loadLmsQuizDraftForEdit(${jsQuote(quiz.id)})"><i class="fas fa-pen"></i> Edit Draft</button>
                       <button class="lux-primary-btn lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-paper-plane"></i> Publish</button>
                       <button class="lux-secondary-btn lms-quiz-card-action lms-quiz-card-action-danger" data-lms-click="deleteLmsQuizDraft(${jsQuote(quiz.id)})"><i class="fas fa-trash"></i> Delete Draft</button>`
                    : `<button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="toggleLmsQuizReviewPanel(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-users"></i> View Submissions</button>
                       <button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="exportLmsQuizMonitoringLog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-file-export"></i> Export Monitoring</button>
                       <button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-user-check"></i> Manage Access</button>
                       ${lifecycle === 'published' ? `<button class="lux-secondary-btn lms-quiz-card-action lms-quiz-card-action-warning" data-lms-click="closeLmsQuiz(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-stop-circle"></i> Close Quiz</button>` : ''}`}
            </div>
            ${variantAssignments.length ? `<div class="lms-quiz-card-variant-list">${variantAssignments.map(entry => `<span class="lms-quiz-card-variant-pill">${escapeHtml(entry.label)}  -  ${entry.count} student${entry.count === 1 ? '' : 's'}</span>`).join('')}</div>` : ''}
        </div>
    `;
}

function renderLmsQuizBoardSection(title, description, itemsMarkup) {
    return `
        <div class="lms-quiz-card-group">
            <div class="lms-quiz-card-group-head">
                <div class="lms-quiz-card-group-title">${title}</div>
                <div class="lms-quiz-card-group-copy">${description}</div>
            </div>
            ${itemsMarkup || '<div class="lms-quiz-card-empty">Nothing here yet.</div>'}
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
    // Explicit owner: shared LMS glass via lux-tokens / lux-transparency (bare stack)
    return;
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
        ? `<div class="lms-quiz-board-preview-copy">Showing latest ${previewItems.length} of ${meta.items.length} quizzes.</div>`
        : '';
    return `
        <div class="lms-quiz-card-group">
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
    ['lms-quiz-board-modal', 'lms-quiz-review-board-modal', 'lms-quiz-access-overlay', 'lms-quiz-review-modal'].forEach((id) => {
        const overlay = document.getElementById(id);
        if (overlay && typeof window.closeLuxGlassDialogOverlay === 'function') {
            window.closeLuxGlassDialogOverlay(overlay, { instant: true });
        } else {
            overlay?.remove();
        }
    });
}

function closeLmsQuizOverlays() {
    disableLmsStudentQuizFocusMode();
    closeLmsQuizFloatingLayers();
}

function closeLmsQuizBoardModal() {
    const overlay = document.getElementById('lms-quiz-board-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
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
    overlay.className = 'lms-quiz-board-overlay lms-glass-dialog-overlay';
    overlay.setAttribute('data-lux-transparency-exempt', '1');
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizBoardModal();
    };
    const boardBody = `
                <div class="lms-quiz-board-toolbar" data-lms-quiz-board-tabs-rail>
                    <div class="lms-quiz-board-tabs">
                        ${modalTabs.map(tab => `
                            <button type="button" data-lms-click="openLmsQuizBoardModal(${jsQuote(tab.key)})" class="${targetPage === tab.key ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-quiz-board-tab">
                                ${escapeHtml(tab.label)}
                            </button>
                        `).join('')}
                    </div>
                    <span class="lux-status-pill is-muted lms-quiz-board-count-pill">${escapeHtml(String(meta.items.length))} total in this section</span>
                </div>
                <div class="lms-quiz-board-card-list lux-scrollbar">
                ${meta.items.length
                    ? meta.items.map(quiz => renderLmsQuizLifecycleCard(context, quiz, meta.sectionType)).join('')
                    : '<div class="lms-quiz-board-empty">Nothing here yet.</div>'}
                </div>`;
    overlay.innerHTML = typeof renderLmsGlassDialogCard === 'function'
        ? renderLmsGlassDialogCard({
            hookClass: 'lms-quiz-board-modal',
            bodyClass: 'lms-quiz-board-body',
            title: 'Quiz Board',
            icon: 'fa-clipboard-list',
            subtitle: `${escapeHtml(meta.title)} · ${escapeHtml(context.subject?.name || context.courseId)} · ${escapeHtml(context.group?.name || context.groupId)} — ${escapeHtml(meta.description)}`,
            closeAttr: 'data-lms-click="closeLmsQuizBoardModal()"',
            bodyHtml: boardBody
        })
        : `<div class="lms-quiz-board-modal">${boardBody}</div>`;
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
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
            <button type="button" data-lms-click="setActiveLmsQuizBuilderQuestion(${jsQuote(question.id)})" class="lms-quiz-question-nav-btn ${isActive ? 'is-active' : ''}">
                <span class="lms-quiz-question-nav-index">Q${index + 1}</span>
                <span class="lms-quiz-question-nav-type">${String(question.type || 'mcq') === 'written' ? 'Written' : 'MCQ'}</span>
                <span class="lms-quiz-question-nav-state ${complete ? 'is-ready' : 'is-draft'}">${complete ? 'Ready' : 'Draft'}</span>
            </button>
        `;
    }).join('');
    const activeQuestionType = String(activeQuestion?.type || 'mcq');
    const activeOptionControls = activeQuestion && activeQuestionType !== 'written'
        ? Array.from({ length: activeQuestion.optionCount || 0 }, (_, optionIndex) => `
            <div class="lms-quiz-option-row">
                <input type="radio" name="lms-quiz-correct-${escapeHtml(activeQuestion.id)}" ${activeQuestion.correctOption === optionIndex ? 'checked' : ''} data-lms-change="setLmsQuizQuestionCorrectOption(${jsQuote(activeQuestion.id)}, ${optionIndex})" title="Correct answer" />
                <div class="lms-quiz-option-marker">${String.fromCharCode(65 + optionIndex)}</div>
                <input type="text" value="${escapeHtml(activeQuestion.options?.[optionIndex] || '')}" data-lms-input="updateLmsQuizQuestionOptionText(${jsQuote(activeQuestion.id)}, ${optionIndex}, this.value)" placeholder="Option ${optionIndex + 1}" class="lms-quiz-option-input" />
            </div>
        `).join('')
        : '';
    const activeAnswerComposer = activeQuestionType === 'written'
        ? `
            <div class="lms-quiz-answer-composer">
                <div class="lms-quiz-answer-composer-label">Written Answer Key</div>
                <textarea rows="5" data-lms-input="updateLmsQuizQuestionField(${jsQuote(activeQuestion.id)}, 'expectedAnswer', this.value)" placeholder="Write the reference answer or grading note here..." class="lms-quiz-answer-textarea">${escapeHtml(activeQuestion.expectedAnswer || '')}</textarea>
                <div class="lms-quiz-answer-composer-copy">Students will manually type their answer for this question.</div>
            </div>
        `
        : `
            <div class="lms-quiz-answer-composer">
                <div class="lms-quiz-answer-composer-label">Answer Options</div>
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
        <button type="button" data-lms-click="setActiveLmsQuizBuilderVariant(${jsQuote(variant.id)})" class="lms-quiz-variant-tab ${activeVariant?.id === variant.id ? 'is-active' : ''}">
            ${escapeHtml(variant.label || getDefaultLmsQuizVariantLabel(index))}${variant.customized ? '  -  Customized' : ''}
        </button>
    `).join('');
    const activeVariantQuestionsMarkup = activeVariant?.questions?.length
        ? activeVariant.questions.map((question, index) => {
            const questionType = String(question.type || 'mcq') === 'written' ? 'written' : 'mcq';
            const replacementSelectId = `lms-variant-replace-${toDomToken(`${activeVariant.id}-${question.id}`)}`;
            return `
                <div class="lms-quiz-variant-question-card">
                    <div class="lms-quiz-variant-question-head">
                        <div>
                            <div class="lms-quiz-variant-question-kicker">${escapeHtml(activeVariant.label)}  -  Question ${index + 1}</div>
                            <div class="lms-quiz-variant-question-copy">${question.sourceQuestionId ? `From base pool  -  ${escapeHtml(question.sourceQuestionId)}` : 'Manual copy'}</div>
                        </div>
                        <div class="lms-quiz-variant-question-actions">
                            <button type="button" class="lux-secondary-btn lms-quiz-variant-action-danger" data-lms-click="removeLmsQuizVariantQuestion(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)})"><i class="fas fa-trash"></i> Remove</button>
                        </div>
                    </div>
                    <textarea rows="3" data-lms-input="updateLmsQuizVariantQuestionField(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, 'text', this.value)" placeholder="Variant question text..." class="lms-quiz-variant-question-textarea">${escapeHtml(question.text || '')}</textarea>
                    <div class="lms-quiz-variant-question-grid">
                        <label class="lms-quiz-variant-field">Question Type<select data-lms-change="setLmsQuizVariantQuestionType(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, this.value)" class="lms-quiz-variant-control"><option value="mcq" ${questionType === 'mcq' ? 'selected' : ''}>Multiple Choice</option><option value="written" ${questionType === 'written' ? 'selected' : ''}>Written Answer</option></select></label>
                        <label class="lms-quiz-variant-field">Options<select data-lms-change="setLmsQuizVariantQuestionOptionCount(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, this.value)" ${questionType === 'written' ? 'disabled' : ''} class="lms-quiz-variant-control ${questionType === 'written' ? 'is-disabled' : ''}">${[2,3,4,5,6].map(count => `<option value="${count}" ${Number(question.optionCount) === count ? 'selected' : ''}>${count} options</option>`).join('')}</select></label>
                        <label class="lms-quiz-variant-field">Score<input type="number" min="1" step="1" value="${escapeHtml(String(question.score || 1))}" data-lms-input="updateLmsQuizVariantQuestionField(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, 'score', this.value)" class="lms-quiz-variant-control" /></label>
                    </div>
                    ${questionType === 'written'
                        ? `<textarea rows="3" data-lms-input="updateLmsQuizVariantQuestionField(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, 'expectedAnswer', this.value)" placeholder="Reference answer..." class="lms-quiz-variant-question-textarea">${escapeHtml(question.expectedAnswer || '')}</textarea>`
                        : `<div class="lms-quiz-variant-option-list">${Array.from({ length: question.optionCount || 0 }, (_, optionIndex) => `
                            <div class="lms-quiz-option-row">
                                <input type="radio" name="lms-variant-correct-${escapeHtml(question.id)}" ${question.correctOption === optionIndex ? 'checked' : ''} data-lms-change="setLmsQuizVariantQuestionCorrectOption(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, ${optionIndex})">
                                <div class="lms-quiz-option-marker">${String.fromCharCode(65 + optionIndex)}</div>
                                <input type="text" value="${escapeHtml(question.options?.[optionIndex] || '')}" data-lms-input="updateLmsQuizVariantQuestionOptionText(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, ${optionIndex}, this.value)" placeholder="Option ${optionIndex + 1}" class="lms-quiz-option-input">
                            </div>
                        `).join('')}</div>`
                    }
                    <div class="lms-quiz-variant-replace-row">
                        <label class="lms-quiz-variant-field">Replace With Base Question<select id="${replacementSelectId}" class="lms-quiz-variant-control"><option value="">Choose base question</option>${baseQuestionOptionMarkup}</select></label>
                        <button type="button" class="lux-secondary-btn lms-quiz-variant-action" data-lms-click="replaceLmsQuizVariantQuestionWithBaseQuestion(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, document.getElementById(${jsQuote(replacementSelectId)})?.value)"><i class="fas fa-arrows-rotate"></i> Replace</button>
                    </div>
                </div>
            `;
        }).join('')
        : '<div class="lms-quiz-variant-empty">Generate variants first, then adjust each question manually here.</div>';

    contentArea.innerHTML = upgradeLmsLegacyMarkup(`
        <div class="lms-quiz-studio-shell lms-quiz-builder">
            <div class="lms-quiz-studio-hero">
                <div class="lms-quiz-studio-hero-head">
                    <div>
                        <div class="lms-quiz-studio-kicker">LMS Quiz Builder</div>
                        <div class="lms-quiz-studio-title">${escapeHtml(context.subject?.name || context.courseId)}  -  ${escapeHtml(context.group?.name || context.groupId)}</div>
                        <div class="lms-quiz-studio-copy">Draft first, publish only to students who are actually in class, then review full quiz papers from one place.</div>
                    </div>
                    <div class="lms-quiz-studio-hero-pills">
                        <span class="lms-quiz-studio-hero-pill"><i class="fas fa-layer-group"></i> ${escapeHtml(context.group?.name || context.groupId)}</span>
                        <span class="lms-quiz-studio-hero-pill"><i class="fas fa-users"></i> ${context.students.length} students</span>
                    </div>
                </div>
            </div>
            <div class="lms-quiz-studio-stat-grid">
                <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Draft Quizzes</div><div class="lms-quiz-studio-stat-value">${workspace.drafts.length}</div></div>
                <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Published Quizzes</div><div class="lms-quiz-studio-stat-value">${workspace.published.length}</div></div>
                <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Base Pool Questions</div><div class="lms-quiz-studio-stat-value">${draft?.questions?.length || 0}</div></div>
                <div class="lms-quiz-studio-stat-card ${alertSummary.alertCount > 0 ? 'is-alert' : ''}"><div class="lms-quiz-studio-stat-label">${alertSummary.alertCount > 0 ? 'Live Alerts' : 'Variant Mode'}</div><div class="lms-quiz-studio-stat-value">${alertSummary.alertCount > 0 ? alertSummary.alertCount : (draft?.variantEnabled ? (draft?.variants?.length || draft?.variantCount || 0) : 'Off')}</div><div class="lms-quiz-studio-stat-copy">${alertSummary.alertCount > 0 ? `${alertSummary.alertedStudents} student${alertSummary.alertedStudents === 1 ? '' : 's'} need attention` : escapeHtml(variantSummaryLabel)}</div></div>
            </div>
            ${alertSummary.alertCount > 0 ? `<div class="lms-quiz-studio-alert-summary">
                <div class="lms-quiz-studio-alert-summary-head">
                    <div>
                        <div class="lms-quiz-studio-alert-summary-title">Monitoring alerts are coming in</div>
                        <div class="lms-quiz-studio-alert-summary-copy">${alertSummary.alertedStudents} student${alertSummary.alertedStudents === 1 ? '' : 's'} triggered ${alertSummary.alertCount} warning${alertSummary.alertCount === 1 ? '' : 's'} across ${alertSummary.quizzesWithAlerts} quiz${alertSummary.quizzesWithAlerts === 1 ? '' : 'zes'}.</div>
                        ${alertSummary.latestAlert ? `<div class="lms-quiz-studio-alert-summary-latest">Latest: ${escapeHtml(alertSummary.latestAlert.note || alertSummary.latestAlert.type || 'Monitoring event')}  -  ${escapeHtml(formatLmsDateTime(alertSummary.latestAlert.createdAt))}</div>` : ''}
                    </div>
                    <button type="button" class="lux-secondary-btn lms-quiz-studio-alert-action" data-lms-click="setLmsQuizBoardPage('review')">
                        <i class="fas fa-triangle-exclamation"></i> Open Review Queue
                    </button>
                </div>
            </div>` : ''}
            ${liveMonitorEntries.length ? `<div id="lms-live-monitor-panel" class="lms-live-monitor-panel ${hasFreshMonitorAlert ? 'lms-monitor-flash-panel' : ''}">
                <div class="lms-live-monitor-head">
                    <div>
                        <div class="lms-live-monitor-kicker">Live Monitor</div>
                        <div class="lms-live-monitor-title">Flagged students in running quizzes</div>
                        <div class="lms-live-monitor-copy">${monitorMode === 'all' ? 'This panel shows all flagged students, including closed quizzes with warning history.' : 'This panel only shows students with monitoring warnings in quizzes that are live right now.'}</div>
                    </div>
                    <div class="lms-live-monitor-controls">
                        <div class="lms-live-monitor-count-pill">
                            <span class="lms-monitor-pulse-dot"></span> ${liveMonitorEntries.length} ${monitorMode === 'all' ? 'flagged case' : 'active case'}${liveMonitorEntries.length === 1 ? '' : 's'}
                        </div>
                        <button type="button" class="${monitorMode === 'running' ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorMode('running')">
                            Running Quiz Only
                        </button>
                        <button type="button" class="${monitorMode === 'all' ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorMode('all')">
                            All Flagged
                        </button>
                        <button type="button" class="${monitorAckFilter === 'all' ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorAckFilter('all')">
                            All Alerts
                        </button>
                        <button type="button" class="${monitorAckFilter === 'unacknowledged' ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorAckFilter('unacknowledged')">
                            Unacknowledged
                        </button>
                        <button type="button" class="${monitorAckFilter === 'acknowledged' ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorAckFilter('acknowledged')">
                            Acknowledged
                        </button>
                    </div>
                </div>
                <div class="lms-live-monitor-grid">
                    ${liveMonitorEntries.slice(0, 8).map(entry => `
                        <div class="lms-live-monitor-card">
                            <div class="lms-live-monitor-card-head">
                                <div>
                                    <div class="lms-live-monitor-student-name">${escapeHtml(entry.studentName)}</div>
                                    <div class="lms-live-monitor-student-meta">${escapeHtml(entry.studentId)}  -  ${escapeHtml(entry.quizLabel)}</div>
                                </div>
                                <span class="lms-live-monitor-alert-pill ${entry.isAcknowledged ? 'is-acknowledged' : 'is-open'}">${entry.isAcknowledged ? '<i class="fas fa-check"></i>' : '<span class="lms-monitor-pulse-dot"></span>'}${entry.alertCount}</span>
                            </div>
                            <div class="lms-live-monitor-latest">
                                <strong>Latest:</strong> ${escapeHtml(entry.latestAlert.note || entry.latestAlert.type || 'Monitoring event')}
                            </div>
                            <div class="lms-live-monitor-timeline">${escapeHtml(formatLmsDateTime(entry.latestAlert.createdAt))}  -  Attendance: ${escapeHtml(entry.attendanceStatus)}  -  Status: ${escapeHtml(entry.submissionStatus)}  -  Quiz: ${escapeHtml(entry.availability)}</div>
                            ${entry.isAcknowledged ? `<div class="lms-live-monitor-ack-note">Acknowledged by staff at ${escapeHtml(formatLmsDateTime(entry.acknowledgedAt))}</div>` : ''}
                            <div class="lms-live-monitor-actions">
                                ${entry.isAcknowledged ? '' : `<button type="button" class="lux-secondary-btn lms-live-monitor-action lms-live-monitor-action-ack" data-lms-click="acknowledgeLmsQuizMonitorAlert(${jsQuote(context.resourceKey)}, ${jsQuote(entry.quizId)}, ${jsQuote(entry.studentId)})">
                                    <i class="fas fa-check"></i> Acknowledge
                                </button>`}
                                <button type="button" class="lux-secondary-btn lms-live-monitor-action lms-live-monitor-action-open" data-lms-click="openLmsQuizReviewModal(${jsQuote(context.resourceKey)}, ${jsQuote(entry.quizId)}, ${jsQuote(entry.studentId)})">
                                    <i class="fas fa-eye"></i> Open Student Monitor
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                ${liveMonitorEntries.length > 8 ? `<div class="lms-live-monitor-more-copy">Showing first 8 ${monitorMode === 'all' ? 'flagged' : 'active'} cases. Open Review Queue for the full list.</div>` : ''}
            </div>` : ''}
            <div class="lms-quiz-studio-layout">
                <div class="lms-quiz-studio-main-card">
                    <div class="lms-quiz-studio-main-head">
                        <div>
                            <div class="lms-quiz-studio-main-kicker">Group Quiz Studio</div>
                            <div class="lms-quiz-studio-main-title">${draft?.editingQuizId ? 'Edit Draft Quiz' : 'Create Draft Quiz'}</div>
                            <div class="lms-quiz-studio-main-copy">Save first, then publish from the right-side board only when the class roster is ready.</div>
                        </div>
                        <div class="lms-quiz-studio-week-pill">
                            <div class="lms-quiz-studio-week-label">Current Week</div>
                            <div class="lms-quiz-studio-week-value">${escapeHtml(draft?.weekLabel || context.weeks?.[0] || 'Week 1')}</div>
                        </div>
                    </div>
                    <div class="lms-quiz-studio-field-grid lms-quiz-studio-field-grid--hero">
                        <label class="lms-quiz-studio-field">Quiz Title<input type="text" value="${escapeHtml(draft?.title || '')}" data-lms-input="setLmsQuizDraftField('title', this.value)" placeholder="e.g. Midterm Quiz 1" class="lms-quiz-studio-control" /></label>
                        <label class="lms-quiz-studio-field">Subject<input type="text" value="${escapeHtml(context.subject?.name || context.courseId)}" disabled class="lms-quiz-studio-control lms-quiz-studio-control--muted" /></label>
                    </div>
                    <div class="lms-quiz-studio-field-grid lms-quiz-studio-field-grid--triple">
                        <label class="lms-quiz-studio-field">Assessment Type<select data-lms-change="setLmsQuizDraftField('assessmentType', this.value)" class="lms-quiz-studio-control">${['quiz','oral-quiz','midterm','final','retake'].map(type => `<option value="${type}" ${normalizeLmsQuizAssessmentType(draft?.assessmentType) === type ? 'selected' : ''}>${escapeHtml(getLmsQuizAssessmentMeta(type).label)}</option>`).join('')}</select></label>
                        <label class="lms-quiz-studio-field">Week<select data-lms-change="setLmsQuizDraftField('weekLabel', this.value)" class="lms-quiz-studio-control">${(context.weeks?.length ? context.weeks : ['Week 1']).map(week => `<option value="${escapeHtml(week)}" ${normalizeLmsWeekLabel(draft?.weekLabel) === normalizeLmsWeekLabel(week) ? 'selected' : ''}>${escapeHtml(week)}</option>`).join('')}</select></label>
                        <label class="lms-quiz-studio-field">Timer (minutes)<input type="number" min="1" value="${escapeHtml(String(draft?.durationMinutes || 20))}" data-lms-input="setLmsQuizDraftField('durationMinutes', this.value)" class="lms-quiz-studio-control" /></label>
                    </div>
                    <div class="lms-quiz-studio-field-grid lms-quiz-studio-field-grid--double">
                        <label class="lms-quiz-studio-field">Start Time<input type="datetime-local" value="${escapeHtml(String(draft?.availableFrom || ''))}" data-lms-change="setLmsQuizDraftField('availableFrom', this.value)" class="lms-quiz-studio-control" /></label>
                        <label class="lms-quiz-studio-field">End Time<input type="datetime-local" value="${escapeHtml(String(draft?.availableUntil || ''))}" data-lms-change="setLmsQuizDraftField('availableUntil', this.value)" class="lms-quiz-studio-control" /></label>
                    </div>
                    <div class="lms-quiz-studio-policy-block">
                        <label class="lms-quiz-policy-card">
                            <input type="checkbox" ${draft?.attendanceGateEnabled !== false ? 'checked' : ''} data-lms-change="setLmsQuizDraftField('attendanceGateEnabled', this.checked)">
                            <span><strong>Attendance gate</strong><br>TA / professor must mark the student present in the LMS review board before Start Quiz unlocks.</span>
                        </label>
                    </div>
                    <label class="lms-quiz-studio-field lms-quiz-studio-notes-field">Quiz Notes<textarea rows="3" data-lms-input="setLmsQuizDraftField('instructions', this.value)" placeholder="Short notes for the invigilator or setup rules..." class="lms-quiz-studio-textarea">${escapeHtml(draft?.instructions || '')}</textarea></label>
                    <div class="lms-quiz-tool-panel lms-quiz-variant-panel ${variantSetExpanded ? '' : 'is-collapsed'}">
                        <div class="lms-quiz-tool-head">
                            <div class="lms-quiz-tool-title">
                                <strong>Quiz Variant Set</strong>
                                <span>${escapeHtml(variantSummaryLabel)}. Build multiple student versions only when this quiz needs randomized papers.</span>
                            </div>
                            <div class="lms-quiz-tool-actions">
                                <span class="lms-quiz-compact-badge"><i class="fas fa-clone"></i> ${draft?.variantEnabled ? 'Variants on' : 'Variants off'}</span>
                                <button type="button" class="lux-secondary-btn lms-quiz-variant-action-btn" data-lms-click="toggleLmsQuizVariantSetPanel()"><i class="fas ${variantSetExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${variantSetExpanded ? 'Hide setup' : 'Show setup'}</button>
                            </div>
                        </div>
                        <div class="lms-quiz-tool-body">
                            <label class="lms-quiz-variant-toggle">
                                <input type="checkbox" ${draft?.variantEnabled ? 'checked' : ''} data-lms-change="setLmsQuizDraftField('variantEnabled', this.checked); rerenderCurrentLmsQuizWorkspace();">
                                Enable variants
                            </label>
                            <div class="lms-quiz-variant-config-grid">
                                <label class="lms-quiz-variant-field">Variant Count<input type="number" min="1" max="8" value="${escapeHtml(String(draft?.variantCount || 3))}" data-lms-input="setLmsQuizDraftField('variantCount', this.value)" class="lms-quiz-variant-config-control ${draft?.variantEnabled ? '' : 'is-disabled'}" ${draft?.variantEnabled ? '' : 'disabled'}></label>
                                <label class="lms-quiz-variant-field">Questions Per Variant<input type="number" min="1" value="${escapeHtml(String(draft?.questionsPerVariant || 10))}" data-lms-input="setLmsQuizDraftField('questionsPerVariant', this.value)" class="lms-quiz-variant-config-control ${draft?.variantEnabled ? '' : 'is-disabled'}" ${draft?.variantEnabled ? '' : 'disabled'}></label>
                                <label class="lms-quiz-variant-field">Assignment<input type="text" value="Auto-fixed" disabled class="lms-quiz-variant-config-control lms-quiz-variant-config-control--muted"></label>
                                <label class="lms-quiz-variant-field">Generation<input type="text" value="Unique-first randomization" disabled class="lms-quiz-variant-config-control lms-quiz-variant-config-control--muted"></label>
                            </div>
                            ${draft?.variantEnabled ? `
                                <div class="lms-quiz-variant-action-row">
                                    <button type="button" class="lux-primary-btn lms-quiz-variant-action-btn" data-lms-click="generateLmsQuizVariants()"><i class="fas fa-wand-magic-sparkles"></i> Generate Variants</button>
                                    <button type="button" class="lux-secondary-btn lms-quiz-variant-action-btn" data-lms-click="regenerateAllLmsQuizVariants()"><i class="fas fa-rotate"></i> Regenerate All</button>
                                    <button type="button" class="lux-secondary-btn lms-quiz-variant-action-btn" data-lms-click="resetLmsQuizVariantsToBasePool()"><i class="fas fa-layer-group"></i> Reset to Base Pool</button>
                                </div>
                                <div class="lms-quiz-variant-workspace">
                                    <div class="lms-quiz-variant-workspace-head">
                                        <div>
                                            <div class="lms-quiz-variant-workspace-kicker">Variant Tabs</div>
                                            <div class="lms-quiz-variant-workspace-copy">Generate first, then adjust a single variant manually if needed.</div>
                                        </div>
                                        ${activeVariant ? `<button type="button" class="lux-secondary-btn lms-quiz-variant-action-btn" data-lms-click="regenerateLmsQuizVariant(${jsQuote(activeVariant.id)})"><i class="fas fa-repeat"></i> Regenerate ${escapeHtml(activeVariant.label)}</button>` : ''}
                                    </div>
                                    <div class="lms-quiz-variant-tab-row">${variantTabsMarkup || '<span class="lms-quiz-variant-empty-copy">No variants generated yet.</span>'}</div>
                                    ${activeVariant ? `<div class="lms-quiz-variant-add-row">
                                        <label class="lms-quiz-variant-field">Add Base Question To ${escapeHtml(activeVariant.label)}<select id="lms-variant-add-base-question" class="lms-quiz-variant-config-control"><option value="">Choose base question</option>${baseQuestionOptionMarkup}</select></label>
                                        <button type="button" class="lux-secondary-btn lms-quiz-variant-action-btn" data-lms-click="addBaseQuestionToLmsQuizVariant(${jsQuote(activeVariant.id)}, document.getElementById('lms-variant-add-base-question')?.value)"><i class="fas fa-plus"></i> Add Question</button>
                                    </div>` : ''}
                                    <div class="lms-quiz-variant-question-list">${activeVariantQuestionsMarkup}</div>
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
                                <button class="lux-secondary-btn lms-quiz-action-btn" data-lms-click="resetLmsQuizBuilderDraft()"><i class="fas fa-rotate-left"></i> Reset Draft</button>
                                <button class="lux-primary-btn lms-quiz-action-btn" data-lms-click="addLmsQuizQuestion()"><i class="fas fa-plus"></i> Add Question</button>
                                <button type="button" class="lux-secondary-btn lms-quiz-action-btn" data-lms-click="toggleLmsQuizQuestionNavigatorPanel()"><i class="fas ${questionNavigatorExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${questionNavigatorExpanded ? 'Hide builder' : 'Show builder'}</button>
                            </div>
                        </div>
                        <div class="lms-quiz-tool-body">
                    <div class="lms-quiz-question-layout">
                        <div class="lms-quiz-question-nav-card">
                            <div class="lms-quiz-question-nav-title">Questions</div>
                            <div id="lms-quiz-question-nav" class="lms-quiz-question-nav-list">${questionNavigator}</div>
                        </div>
                        <div class="lms-quiz-question-editor-card">
                            <div class="lms-quiz-question-editor-head">
                                <div>
                                    <div class="lms-quiz-question-editor-kicker">Question ${activeQuestionIndex + 1} of ${draft?.questions?.length || 0}</div>
                                    <div class="lms-quiz-question-editor-title">Focused Question Editor</div>
                                </div>
                                <div class="lms-quiz-question-editor-actions">
                                    <button class="lux-secondary-btn lms-quiz-question-remove-btn" data-lms-click="removeActiveLmsQuizBuilderQuestion()" ${(draft?.questions?.length || 0) <= 1 ? 'disabled' : ''}><i class="fas fa-trash"></i> Remove</button>
                                </div>
                            </div>
                            <div class="lms-quiz-question-editor-body">
                                <textarea rows="5" data-lms-input="updateLmsQuizQuestionField(${jsQuote(activeQuestion?.id || '')}, 'text', this.value)" placeholder="Write the question here..." class="lms-quiz-question-textarea">${escapeHtml(activeQuestion?.text || '')}</textarea>
                                <div class="lms-quiz-question-meta-grid">
                                    <label class="lms-quiz-question-field">Question Type<select data-lms-change="setLmsQuizQuestionType(${jsQuote(activeQuestion?.id || '')}, this.value)" class="lms-quiz-question-control"><option value="mcq" ${activeQuestionType === 'mcq' ? 'selected' : ''}>Multiple Choice</option><option value="written" ${activeQuestionType === 'written' ? 'selected' : ''}>Written Answer</option></select></label>
                                    <label class="lms-quiz-question-field">Options Per Question<select data-lms-change="setLmsQuizQuestionOptionCount(${jsQuote(activeQuestion?.id || '')}, this.value)" ${activeQuestionType === 'written' ? 'disabled' : ''} class="lms-quiz-question-control ${activeQuestionType === 'written' ? 'is-disabled' : ''}">${[2,3,4,5,6].map(count => `<option value="${count}" ${Number(activeQuestion?.optionCount) === count ? 'selected' : ''}>${count} options</option>`).join('')}</select></label>
                                    <label class="lms-quiz-question-field">Score<input type="number" min="1" step="1" value="${escapeHtml(String(activeQuestion?.score || 1))}" data-lms-input="updateLmsQuizQuestionField(${jsQuote(activeQuestion?.id || '')}, 'score', this.value)" class="lms-quiz-question-control" /></label>
                                </div>
                                ${activeAnswerComposer}
                            </div>
                            <div class="lms-quiz-question-step-row">
                                <button class="lux-secondary-btn lms-quiz-question-step-btn ${activeQuestionIndex <= 0 ? 'is-disabled' : ''}" data-lms-click="stepLmsQuizBuilderQuestion(-1)" ${activeQuestionIndex <= 0 ? 'disabled' : ''}><i class="fas fa-arrow-left"></i> Previous</button>
                                <button class="lux-secondary-btn lms-quiz-question-step-btn ${activeQuestionIndex >= (draft?.questions?.length || 1) - 1 ? 'is-disabled' : ''}" data-lms-click="stepLmsQuizBuilderQuestion(1)" ${activeQuestionIndex >= (draft?.questions?.length || 1) - 1 ? 'disabled' : ''}>Next <i class="fas fa-arrow-right"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="lms-quiz-question-save-row">
                        <button class="lux-primary-btn lms-quiz-question-save-btn" data-lms-click="saveLmsQuizBuilderDraft()"><i class="fas fa-save"></i> ${draft?.editingQuizId ? 'Update Draft' : 'Save Draft'}</button>
                    </div>
                        </div>
                    </div>
                </div>
                <div class="lms-quiz-side-rail">
                    <div class="lms-quiz-rules-card">
                        <div class="lms-quiz-rules-title">Quiz Rules</div>
                        <ul class="lms-quiz-rules-list">
                            <li>Every quiz is tied automatically to this LMS group.</li>
                            <li>Save creates a draft only. Students cannot see drafts.</li>
                            <li>Publish opens the class roster so you can uncheck absent students.</li>
                            <li>Written answers stay in review until TA or professor scores them.</li>
                        </ul>
                    </div>
                    <div class="lms-quiz-saved-card">
                        <div class="lms-quiz-saved-head">
                            <div>
                                <div class="lms-quiz-saved-title">Saved Quizzes</div>
                                <div class="lms-quiz-saved-subtitle">${escapeHtml(context.subject?.name || context.courseId)}  -  ${escapeHtml(context.group?.name || context.groupId)}</div>
                            </div>
                            <div class="lms-quiz-saved-actions">
                                <button type="button" class="lux-secondary-btn lms-quiz-saved-open-btn" data-lms-click="openLmsQuizBoardModal(${jsQuote(boardPage)})">
                                    <i class="fas fa-up-right-and-down-left-from-center"></i> Open Full View
                                </button>
                                <div class="lms-quiz-saved-count-pill">${ensureLmsQuizzesForKey(context.resourceKey).length} total</div>
                            </div>
                        </div>
                        <div class="lms-quiz-saved-tab-row">
                            ${[
                                { key: 'drafts', label: `Draft Quizzes (${workspace.drafts.length})` },
                                { key: 'published', label: `Published (${workspace.published.length}${alertSummary.quizzesWithAlerts ? `  -  ${alertSummary.quizzesWithAlerts} alert` : ''})` },
                                { key: 'review', label: `Review Queue (${reviewItems.length}${alertSummary.alertCount ? `  -  ${alertSummary.alertCount} warn` : ''})` },
                                { key: 'results', label: `Results (${workspace.closed.length})` }
                            ].map(tab => `
                                <button type="button" data-lms-click="setLmsQuizBoardPage(${jsQuote(tab.key)})" class="${boardPage === tab.key ? 'lux-primary-btn' : 'lux-secondary-btn'} lms-quiz-saved-tab-btn">
                                    ${escapeHtml(tab.label)}
                                </button>
                            `).join('')}
                        </div>
                        <div class="lms-quiz-saved-copy">
                            This board stays compact on purpose. It shows only the latest 3 quizzes for the selected section. Use <strong>Open Full View</strong> to see all quizzes and full details in a maximized window.
                        </div>
                        <div class="lms-quiz-saved-page-shell">
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
            <div class="lms-quiz-error-shell">
                <div class="lms-quiz-error-card">
                    <div class="lms-quiz-error-title">Quiz Builder could not load</div>
                    <div class="lms-quiz-error-copy">The staff quiz workspace hit a runtime problem, so we stopped it before it could break the whole LMS page.</div>
                    <div class="lms-quiz-error-actions">
                        <button type="button" class="lux-secondary-btn lms-quiz-error-btn" data-lms-click="resetLmsQuizBuilderDraft(${jsQuote(context.resourceKey)}); renderLmsQuizSection(${jsQuote(context.resourceKey)})">
                            <i class="fas fa-life-ring"></i> Reset Builder Draft
                        </button>
                        <button type="button" class="lux-primary-btn lms-quiz-error-btn" data-lms-click="renderLmsQuizSection(${jsQuote(context.resourceKey)})">
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
    if (typeof cleanupLmsInjectedEnhancementBlocks === 'function') {
        cleanupLmsInjectedEnhancementBlocks(contentArea);
    }
    prepareLmsContentAreaForTab('quiz', contentArea);
    const context = resolveLmsQuizWorkspace(courseId);
    if (!context?.resourceKey) {
        contentArea.innerHTML = upgradeLmsLegacyMarkup(`<div class="lms-quiz-empty-state">Open a valid LMS group first to use the quiz workspace.</div>`);
        return;
    }
    currentLmsQuizCourseKey = context.resourceKey;
    syncLmsQuizWorkspaceLifecycle(context.resourceKey);
    const effectiveRole = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : '';
    const authRole = String(currentUser?.role || '').trim().toLowerCase();
    if (authRole === USER_ROLES.ADMIN && effectiveRole === USER_ROLES.STUDENT) {
        console.warn('LMS quiz workspace: admin View-as is routed to the student quiz UI. Use Professor or TA view for Quiz Builder.', {
            effectiveRole,
            authRole
        });
    }
    if (effectiveRole === USER_ROLES.STUDENT) {
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
                const badgeToneClass = getLmsQuizStatusToneClass(badgeKey);
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
                    <div data-lms-student-quiz-card="true" class="lms-student-quiz-card">
                        <div class="lms-student-quiz-card-head">
                            <div>
                                <div class="lms-student-quiz-card-title-row">
                                    <div class="lms-student-quiz-card-eyebrow">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</div>
                                    ${sessionGate.required ? `<span class="lms-student-quiz-pill ${sessionGate.status === 'live' ? 'is-live' : 'is-info'}"><i class="fas fa-desktop"></i> Lab session ${escapeHtml(sessionGate.status)}</span>` : ''}
                                    ${submission.variantLabel ? `<span class="lms-student-quiz-pill is-accent"><i class="fas fa-clone"></i> ${escapeHtml(submission.variantLabel)}</span>` : ''}
                                </div>
                                <div class="lms-student-quiz-card-title">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                                <div data-lms-student-quiz-status="true" class="lms-student-quiz-card-status">${escapeHtml(statusLine)}</div>
                                <div class="lms-student-quiz-card-schedule">${quiz.availableFrom ? `Starts ${escapeHtml(formatLmsDateTime(quiz.availableFrom))}` : 'Starts immediately'}${quiz.availableUntil ? `  -  Ends ${escapeHtml(formatLmsDateTime(quiz.availableUntil))}` : ''}</div>
                            </div>
                            <span class="lms-student-quiz-status-pill ${badgeToneClass}">${escapeHtml(badge.label)}</span>
                        </div>
                        <div class="lms-student-quiz-card-action-row">
                            <button data-lms-student-quiz-action="true" type="button" class="lux-primary-btn lms-student-quiz-primary-btn" data-lms-click="openLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})">
                                <i class="fas fa-arrow-right"></i> ${escapeHtml(['submitted', 'auto-submitted', 'graded'].includes(String(submission?.status || '')) ? 'View Quiz' : 'Open in Anti-Cheat')}
                            </button>
                        </div>
                    </div>
                `;
            }).join('') : `<div class="lms-quiz-empty-state"><i class="fas fa-file-signature lms-empty-state-icon"></i><div class="lms-empty-state-title">No quizzes are visible yet</div><div class="lms-empty-state-copy">Published quizzes for ${escapeHtml(subjectLabel)}  -  ${escapeHtml(groupLabel)} will appear here when they are started or scheduled.</div></div>`;

            contentArea.innerHTML = upgradeLmsLegacyMarkup(`
                <div class="lms-quiz-studio-shell lms-quiz-builder">
                    <div class="lms-quiz-studio-hero">
                        <div class="lms-quiz-studio-kicker">My Quizzes</div>
                        <div class="lms-quiz-studio-title">${escapeHtml(subjectLabel)}  -  ${escapeHtml(groupLabel)}</div>
                        <div class="lms-quiz-studio-copy">Students can only answer and submit. Quiz opening and ending are controlled by the professor or teaching assistant.</div>
                        <div class="lms-quiz-studio-hero-pills">
                            <span class="lms-quiz-studio-hero-pill">
                                <i class="fas fa-user"></i> ${escapeHtml(studentName)}
                            </span>
                            <span class="lms-quiz-studio-hero-pill">
                                <i class="fas fa-id-badge"></i> ${escapeHtml(studentId)}
                            </span>
                        </div>
                    </div>
                    <div class="lms-quiz-studio-stat-grid">
                        <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Visible Quizzes</div><div class="lms-quiz-studio-stat-value">${quizzes.length}</div></div>
                        <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Submitted</div><div class="lms-quiz-studio-stat-value">${submittedCount}</div></div>
                        <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Graded</div><div class="lms-quiz-studio-stat-value">${gradedCount}</div></div>
                    </div>
                    <div class="lms-student-quiz-card-list">${cards}</div>
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
                <div class="lms-quiz-studio-shell lms-quiz-builder">
                    <div class="lms-quiz-studio-hero">
                        <div class="lms-quiz-studio-kicker">Protected Quiz</div>
                        <div class="lms-quiz-studio-title">${escapeHtml(selectedQuiz.title || getLmsQuizDisplayLabel(selectedQuiz))}</div>
                        <div class="lms-quiz-studio-copy">${escapeHtml(subjectLabel)} / ${escapeHtml(groupLabel)}</div>
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
        const badgeToneClass = getLmsQuizStatusToneClass(refreshedAvailability);
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
                    <div class="lms-student-quiz-question-card">
                        <div class="lms-student-quiz-question-label">Question ${index + 1}</div>
                        <div class="lms-student-quiz-question-text">${escapeHtml(question.text || '')}</div>
                        <textarea ${disabled ? 'disabled' : ''} data-lms-input="updateLmsQuizDraftAnswer(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)}, ${jsQuote(question.id)}, 'text', this.value)" placeholder="Write your answer here..." class="lms-quiz-answer-textarea${disabled ? ' is-disabled' : ''}">${escapeHtml(answer.text || '')}</textarea>
                    </div>
                `;
            }
            return `
                <div class="lms-student-quiz-question-card">
                    <div class="lms-student-quiz-question-label">Question ${index + 1}</div>
                    <div class="lms-student-quiz-question-text">${escapeHtml(question.text || '')}</div>
                    <div class="lms-student-quiz-question-options">
                        ${(question.options || []).map((option, optionIndex) => `
                            <label class="lms-quiz-option-row${Number(answer.selectedOption) === optionIndex ? ' is-selected' : ''}">
                                <input type="radio" name="lms-quiz-${escapeHtml(selectedQuiz.id)}-${escapeHtml(question.id)}" value="${optionIndex}" ${Number(answer.selectedOption) === optionIndex ? 'checked' : ''} ${disabled ? 'disabled' : ''} data-lms-change="updateLmsQuizDraftAnswer(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)}, ${jsQuote(question.id)}, 'selectedOption', this.value)">
                                <span class="lms-student-quiz-option-copy">${escapeHtml(option)}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        }).join('');

        const requiresCover = !revealActive && ['open', 'in-progress'].includes(refreshedAvailability) && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || ''));
        const showSubmit = revealActive && !blueLockActive && !sessionLockActive && ['open', 'in-progress'].includes(refreshedAvailability) && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || ''));
        const resultMarkup = refreshedSubmission?.status === 'graded'
            ? `<div class="lms-student-quiz-result-card lms-quiz-result-shell">
                    <div class="lms-student-quiz-result-title lms-quiz-result-title">Final result</div>
                    <div class="lms-student-quiz-result-grid lms-quiz-result-grid">
                        <div class="lms-quiz-result-item"><div class="lms-student-quiz-result-label lms-quiz-result-label">Objective</div><div class="lms-student-quiz-result-value lms-quiz-result-value">${Number(refreshedSubmission.autoScoreRaw || 0)}</div></div>
                        <div class="lms-quiz-result-item"><div class="lms-student-quiz-result-label lms-quiz-result-label">Manual</div><div class="lms-student-quiz-result-value lms-quiz-result-value">${Number(refreshedSubmission.manualScoreRaw || 0)}</div></div>
                        <div class="lms-quiz-result-item"><div class="lms-student-quiz-result-label lms-quiz-result-label">Total</div><div class="lms-student-quiz-result-value lms-quiz-result-value">${Number(refreshedSubmission.finalScoreRaw || 0)} / ${getAdminQuizTotalScore(variantScopedQuiz)}</div></div>
                        <div class="lms-quiz-result-item"><div class="lms-student-quiz-result-label lms-quiz-result-label">Gradebook</div><div class="lms-student-quiz-result-value lms-quiz-result-value">${refreshedSubmission.gradebookScore === null || refreshedSubmission.gradebookScore === undefined ? '-' : Number(refreshedSubmission.gradebookScore)}</div></div>
                    </div>
                    <div class="lms-student-quiz-result-meta lms-quiz-result-meta">Reviewed by ${escapeHtml(refreshedSubmission.reviewedBy || refreshedSubmission.gradedBy || 'Staff')}${refreshedSubmission.gradedAt ? ` on ${escapeHtml(formatLmsDateTime(refreshedSubmission.gradedAt))}` : ''}.</div>
                </div>`
                : ['submitted', 'auto-submitted'].includes(String(refreshedSubmission?.status || ''))
                    ? `<div class="lms-student-quiz-notice is-warning lms-quiz-state-notice lms-quiz-state-notice--pending-review">
                            <div class="lms-student-quiz-notice-title lms-quiz-state-notice-title">Submitted. Final grade pending review.</div>
                            <div class="lms-student-quiz-notice-copy lms-quiz-state-notice-copy">Objective score recorded: <strong>${Number(refreshedSubmission.autoScoreRaw || 0)}</strong>. ${manualMax > 0 ? 'TA / professor manual grading is required before the gradebook score is published.' : getLmsQuizAutoSubmitNotice(refreshedSubmission, false, 'Staff')}</div>
                        </div>`
                    : '';

        contentArea.innerHTML = `
            <div class="lms-student-quiz-shell">
                <div class="lms-quiz-studio-hero">
                    <div class="lms-quiz-studio-hero-head">
                        <div>
                            <button type="button" class="lux-secondary-btn lms-student-quiz-back-btn" data-lms-click="backToStudentLmsQuizList(${jsQuote(resourceKey)})"><i class="fas fa-arrow-left"></i> Back to Quizzes</button>
                            <div class="lms-quiz-studio-kicker">${escapeHtml(getLmsQuizDisplayLabel(selectedQuiz))}</div>
                            <div class="lms-quiz-studio-title">${escapeHtml(selectedQuiz.title || getLmsQuizDisplayLabel(selectedQuiz))}</div>
                            <div class="lms-quiz-studio-copy">${escapeHtml(subjectLabel)}  -  ${escapeHtml(groupLabel)}${selectedQuiz.weekLabel ? `  -  ${escapeHtml(selectedQuiz.weekLabel)}` : ''}${refreshedSubmission.variantLabel ? `  -  ${escapeHtml(refreshedSubmission.variantLabel)}` : ''}</div>
                        </div>
                        <div class="lms-quiz-studio-hero-pills">
                            <span class="lms-student-quiz-status-pill ${badgeToneClass}">${escapeHtml(badge.label)}</span>
                            ${examSession ? `<span class="lms-student-quiz-session-pill ${sessionGate.status === 'live' ? 'is-live' : 'is-pending'}">${escapeHtml(`Lab session ${sessionGate.status}`)}</span>` : ''}
                            ${blueGate.required ? `<span class="lms-student-quiz-verification-pill ${blueGate.connected ? 'is-live' : 'is-locked'}">${blueGate.connected ? 'Verification connected' : 'Verification locked'}</span>` : ''}
                            <span id="lms-student-quiz-countdown" class="lms-student-quiz-count-pill">${effectiveEnd ? 'Calculating timer...' : `Duration: ${selectedQuiz.durationMinutes || 20} min`}</span>
                        </div>
                    </div>
                    ${selectedQuiz.instructions ? `<div class="lms-quiz-studio-copy">${escapeHtml(selectedQuiz.instructions)}</div>` : ''}
                </div>
                <div class="lms-quiz-studio-stat-grid">
                    <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Questions</div><div class="lms-quiz-studio-stat-value">${activeQuestions.length}</div></div>
                    <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Total Points</div><div class="lms-quiz-studio-stat-value">${getAdminQuizTotalScore(variantScopedQuiz)}</div></div>
                    <div class="lms-quiz-studio-stat-card"><div class="lms-quiz-studio-stat-label">Manual Review</div><div class="lms-quiz-studio-stat-value">${manualMax > 0 ? `${manualMax} pts` : 'No'}</div></div>
                    <div class="lms-quiz-studio-stat-card${warningCount > 0 || outsideActionCount > 0 ? ' is-alert' : ''}"><div class="lms-quiz-studio-stat-label">Outside Actions</div><div class="lms-quiz-studio-stat-value">${outsideActionCount}</div><div class="lms-quiz-studio-stat-copy">Warnings ${warningCount} / ${protectionConfig.maxWarnings}</div></div>
                </div>
                ${focusState.active && focusState.warningMessage ? `<div class="lms-student-quiz-notice is-warning lms-quiz-state-notice lms-quiz-state-notice--warning"><div class="lms-quiz-state-notice-title">Warning recorded</div><div class="lms-quiz-state-notice-copy">${escapeHtml(focusState.warningMessage)}. TA / professor can see this on their monitoring screen.</div></div>` : ''}
                ${latestProctorEvent ? `<div class="lms-student-quiz-notice is-muted lms-quiz-state-notice lms-quiz-state-notice--latest-event"><div class="lms-quiz-state-notice-title">Latest monitoring event</div><div class="lms-quiz-state-notice-copy">${escapeHtml(latestProctorEvent.note || latestProctorEvent.type || 'Activity logged')}</div><div class="lms-student-quiz-notice-meta lms-quiz-state-notice-meta">${escapeHtml(formatLmsDateTime(latestProctorEvent.createdAt))}</div></div>` : ''}
                ${sessionGate.required ? `<div class="lms-student-quiz-notice ${sessionGate.startUnlocked ? 'is-success' : 'is-info'} lms-quiz-state-notice lms-quiz-state-notice--session-gate"><div class="lms-quiz-state-notice-title">KIU Wired Lab Exam Session</div><div class="lms-quiz-state-notice-copy">${escapeHtml(sessionGate.startUnlocked ? 'Your account is approved on the exam list and staff already started the room session.' : sessionGate.message || 'Waiting for lab session start.')}</div>${examSession?.endsAt ? `<div class="lms-student-quiz-notice-meta lms-quiz-state-notice-meta">Session ends ${escapeHtml(formatLmsDateTime(examSession.endsAt))}</div>` : ''}</div>` : ''}
                ${refreshedAvailability === 'upcoming' ? `<div class="lms-student-quiz-notice is-info lms-quiz-state-notice lms-quiz-state-notice--upcoming"><div class="lms-quiz-state-notice-title">Quiz scheduled</div><div class="lms-quiz-state-notice-copy">This quiz will open automatically at ${escapeHtml(formatLmsDateTime(selectedQuiz.availableFrom))}.</div></div>` : ''}
                ${refreshedAvailability === 'closed' && !['submitted', 'auto-submitted', 'graded'].includes(String(refreshedSubmission?.status || '')) ? `<div class="lms-student-quiz-notice is-danger lms-quiz-state-notice lms-quiz-state-notice--closed"><div class="lms-quiz-state-notice-title">Quiz closed</div><div class="lms-quiz-state-notice-copy">This quiz is closed.</div></div>` : ''}
                ${requiresCover ? `
                    <div class="lms-student-quiz-cover lms-quiz-gate-shell">
                        <div class="lms-student-quiz-cover-inner is-compact lms-quiz-gate-shell-inner">
                            <div class="lms-student-quiz-cover-icon is-accent lms-quiz-gate-shell-icon">
                                <i class="fas fa-shield-alt"></i>
                            </div>
                            <div class="lms-student-quiz-cover-title lms-quiz-gate-shell-title">Quiz Protected View</div>
                            <div class="lms-student-quiz-cover-copy lms-quiz-gate-shell-copy">
                                The quiz body stays hidden until the student presses <strong>Start Quiz</strong>.
                                After that, quiz focus mode will open, portal navigation will hide, suspicious actions will be reported to TA / professor, and the system will auto-submit after <strong>${protectionConfig.maxWarnings} warnings</strong>.
                            </div>
                            ${sessionGate.required ? `<div class="lms-student-quiz-cover-panel lms-quiz-gate-panel ${sessionGate.startUnlocked ? 'is-success' : 'is-info'}"><div class="lms-student-quiz-cover-panel-title lms-quiz-gate-panel-title">Lab Session Gate</div><div class="lms-student-quiz-cover-panel-copy lms-quiz-gate-panel-copy">${escapeHtml(sessionGate.startUnlocked ? 'Staff started the lab exam session and your account is on the approved list.' : sessionGate.message || 'Waiting for lab session start.')}</div></div>` : ''}
                            <div class="lms-student-quiz-cover-rules lms-quiz-gate-rules">
                                <div class="lms-student-quiz-cover-panel-title lms-quiz-gate-panel-title">Protection Rules</div>
                                <div class="lms-student-quiz-cover-rule-list lms-quiz-gate-rule-list">
                                    <div>Fullscreen is required while the quiz is open.</div>
                                    <div>Leaving the tab, refreshing, opening blocked shortcuts, copy/paste, right click, selection, and drag actions are monitored.</div>
                                    <div>Leaving the protected quiz view before finishing submits the attempt immediately.</div>
                                </div>
                            </div>
                            <div class="lms-student-quiz-cover-actions lms-quiz-gate-actions">
                                <button type="button" class="lux-primary-btn lms-student-quiz-cover-btn" data-lms-click="revealLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)})" ${(blueGate.required && !blueGate.startUnlocked) || (sessionGate.required && !sessionGate.startUnlocked) ? 'disabled' : ''}>
                                    <i class="fas fa-play"></i> Start Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                ` : ''}
                ${!requiresCover && ['open', 'in-progress', 'submitted', 'auto-submitted', 'graded', 'closed'].includes(refreshedAvailability) ? (
                    sessionLockActive
                        ? `<div class="lms-student-quiz-cover is-info lms-quiz-lock-shell">
                            <div class="lms-student-quiz-cover-inner lms-quiz-lock-shell-inner">
                                <div class="lms-student-quiz-cover-icon is-accent">
                                    <i class="fas fa-desktop"></i>
                                </div>
                                <div class="lms-student-quiz-cover-title lms-quiz-lock-shell-title">Lab Exam Session Locked</div>
                                <div class="lms-student-quiz-cover-copy lms-quiz-lock-shell-copy">${escapeHtml(sessionGate.message || 'This lab exam session is locked for your account right now.')}</div>
                                ${examSession?.endsAt ? `<div class="lms-student-quiz-cover-pill-row lms-quiz-lock-shell-pill-row"><span class="lms-student-quiz-cover-pill is-info"><i class="fas fa-stopwatch"></i> Session window ends ${escapeHtml(formatLmsDateTime(examSession.endsAt))}</span></div>` : ''}
                            </div>
                        </div>`
                        : blueLockActive
                        ? `<div class="lms-student-quiz-cover is-danger lms-quiz-lock-shell">
                            <div class="lms-student-quiz-cover-inner lms-quiz-lock-shell-inner">
                                <div class="lms-student-quiz-cover-icon is-danger">
                                    <i class="fas fa-wifi"></i>
                                </div>
                                <div class="lms-student-quiz-cover-title lms-quiz-lock-shell-title">Quiz Locked Until Verification Reconnects</div>
                                <div class="lms-student-quiz-cover-copy lms-quiz-lock-shell-copy">Your saved answers are preserved, but the quiz body stays blank while this account is disconnected from exam verification. Reconnect and this page will restore automatically.</div>
                                <div class="lms-student-quiz-cover-pill-row lms-quiz-lock-shell-pill-row">
                                    <span class="lms-student-quiz-cover-pill is-danger"><i class="fas fa-stopwatch"></i> Disconnected for <span id="lms-blue-disconnect-timer">${escapeHtml(formatLmsDurationLabel(blueGate.disconnectElapsedMs))}</span></span>
                                    <span class="lms-student-quiz-cover-pill is-warning"><i class="fas fa-triangle-exclamation"></i> Submit stays locked while disconnected</span>
                                </div>
                            </div>
                        </div>`
                        : `<div class="lms-student-quiz-answer-shell">${answersMarkup}${showSubmit ? `<div class="lms-student-quiz-submit-row"><button type="button" class="lux-primary-btn lms-student-quiz-submit-btn" data-lms-click="submitLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)})"><i class="fas fa-paper-plane"></i> Submit Answers</button></div>` : ''}</div>`
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
            <div class="lms-quiz-error-shell">
                <div class="lms-quiz-error-card">
                    <div class="lms-quiz-error-title">My Quizzes could not load</div>
                    <div class="lms-quiz-error-copy">The student quiz view hit a runtime problem, so we stopped it before it could break the whole LMS page.</div>
                    <div class="lms-quiz-error-actions">
                        <button type="button" class="lux-primary-btn lms-student-quiz-error-btn" data-lms-click="renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId)">
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
    const overlay = document.getElementById('lms-quiz-review-board-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function openLmsQuizReviewBoardModal(resourceKey, quizId) {
    closeLmsQuizFloatingLayers();
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const quiz = getLmsQuizById(resourceKey, quizId);
    if (!quiz) return;

    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-review-board-modal';
    overlay.className = 'lms-quiz-board-overlay lms-quiz-review-board-overlay lms-glass-dialog-overlay';
    overlay.setAttribute('data-lux-transparency-exempt', '1');
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizReviewBoardModal();
    };
    const reviewBody = renderLmsQuizReviewPanel(resourceKey, quiz);
    overlay.innerHTML = typeof renderLmsGlassDialogCard === 'function'
        ? renderLmsGlassDialogCard({
            hookClass: 'lms-quiz-board-modal lms-quiz-review-board-modal',
            bodyClass: 'lms-quiz-board-body',
            title: 'View Submissions',
            icon: 'fa-users',
            subtitle: `${escapeHtml(getLmsQuizDisplayLabel(quiz))} · ${escapeHtml(quiz.title || 'Untitled Quiz')}`,
            closeAttr: 'data-lms-click="closeLmsQuizReviewBoardModal()"',
            bodyHtml: reviewBody
        })
        : `<div class="lms-quiz-board-modal lms-quiz-review-board-modal"><div class="lms-quiz-board-body">${reviewBody}</div></div>`;
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
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

function toggleStudentQuizPaperInline(studentId, criterion, number, panelId, studentName = '') {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    if (panel.dataset.expanded === 'true') {
        panel.dataset.expanded = 'false';
        panel.hidden = true;
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
        panel.hidden = false;
        panel.dataset.expanded = 'true';
        panel.innerHTML = '<div class="lms-quiz-card-empty">This grade entry is not linked to a saved LMS quiz paper yet.</div>';
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
    panel.hidden = false;
}

function closeLmsQuizReviewModal() {
    const overlay = document.getElementById('lms-quiz-review-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
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
    overlay.className = 'lms-quiz-board-overlay lms-quiz-review-paper-overlay lms-glass-dialog-overlay';
    overlay.setAttribute('data-lux-transparency-exempt', '1');
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizReviewModal();
    };
    const paperBody = buildLmsQuizReviewPaperMarkup(resourceKey, quizId, student.id, { studentName: student.name });
    overlay.innerHTML = typeof renderLmsGlassDialogCard === 'function'
        ? renderLmsGlassDialogCard({
            hookClass: 'lms-quiz-board-modal lms-quiz-review-paper-modal',
            bodyClass: 'lms-quiz-board-body',
            title: student.name,
            icon: 'fa-file-lines',
            subtitle: `${escapeHtml(getLmsQuizDisplayLabel(quiz))} · ${escapeHtml(quiz.title || '')} — Full submitted quiz view for TA / Professor review`,
            closeAttr: 'data-lms-click="closeLmsQuizReviewModal()"',
            bodyHtml: paperBody
        })
        : `<div class="lms-quiz-board-modal lms-quiz-review-paper-modal"><div class="lms-quiz-board-body">${paperBody}</div></div>`;
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
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
    closeLmsQuizReviewModal();
    rerenderCurrentLmsQuizWorkspace();
}

