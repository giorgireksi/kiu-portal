/* LMS quiz access/builder/session helpers. Peeled from lms-quiz-workspace-runtime.js. Load via LMS_QUIZ_MODULE_URLS before workspace.
 * Load before lms-quiz-workspace-runtime.js.
 */
(function initLmsQuizWorkspaceSessionRuntime() {
    if (window.__KIU_LMS_QUIZ_WORKSPACE_SESSION_LOADED) return;
    window.__KIU_LMS_QUIZ_WORKSPACE_SESSION_LOADED = true;

    window.__kiuCreateLmsQuizWorkspaceSessionApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function renderLmsAntiCheatPolicyControls(quiz = {}) {
    const policy = normalizeLmsAntiCheatPolicy(quiz.antiCheatPolicy);
    const flags = [
        ['processScanning', 'Process scanner'],
        ['clipboardClearing', 'Clipboard clearing'],
        ['focusProtection', 'Focus enforcement'],
        ['inputBlocking', 'Input restrictions'],
        ['kioskMode', 'Kiosk mode'],
        ['vmDetection', 'VM detection'],
        ['devToolsProtection', 'DevTools protection'],
        ['navigationProtection', 'Navigation protection'],
        ['securityDialogs', 'Security dialogs'],
        ['violationScreen', 'Violation screen'],
        ['allowDebugTools', 'Allow DevTools']
    ];
    return `
        <div class="lms-quiz-access-policy-stack" data-lms-anticheat-policy="true">
            <div class="lms-quiz-access-policy-title">Anti-cheat restrictions</div>
            <div class="lms-quiz-access-policy-grid">
                ${flags.map(([key, label]) => `
                    <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                        <input type="checkbox" data-lms-ac-policy="${escapeHtml(key)}" ${policy[key] === true ? 'checked' : ''}>
                        <span><strong>${escapeHtml(label)}</strong><br>Applied by the desktop app after launch ticket redemption.</span>
                    </label>
                `).join('')}
            </div>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Heartbeat interval</strong><br>Milliseconds between protected session heartbeats.</span>
                <input class="lms-route-input lux-control" type="number" min="1000" max="60000" step="500" data-lms-ac-policy="heartbeatMs" value="${Number(policy.heartbeatMs || 2000)}">
            </label>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Process scan interval</strong><br>Milliseconds between blocked software checks.</span>
                <input class="lms-route-input lux-control" type="number" min="1000" max="60000" step="500" data-lms-ac-policy="processScanMs" value="${Number(policy.processScanMs || 1500)}">
            </label>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Allowed domains</strong><br>One hostname per line; LMS and backend domains are added automatically.</span>
                <textarea class="lms-route-input lux-control" rows="3" data-lms-ac-policy="allowedDomains">${escapeHtml((policy.allowedDomains || []).join('\n'))}</textarea>
            </label>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Blocked processes</strong><br>One process name per line.</span>
                <textarea class="lms-route-input lux-control" rows="4" data-lms-ac-policy="blockedProcesses">${escapeHtml((policy.blockedProcesses || []).join('\n'))}</textarea>
            </label>
        </div>
    `;
}

function readLmsAntiCheatPolicyFromAccessDialog(quiz = {}) {
    const current = normalizeLmsAntiCheatPolicy(quiz.antiCheatPolicy);
    const readList = key => String(document.querySelector(`#lms-quiz-access-overlay [data-lms-ac-policy="${key}"]`)?.value || '')
        .split(/\r?\n|,/)
        .map(value => String(value || '').trim())
        .filter(Boolean);
    const readBool = key => document.querySelector(`#lms-quiz-access-overlay [data-lms-ac-policy="${key}"]`)?.checked === true;
    const readMs = (key, fallback) => {
        const numeric = Number(document.querySelector(`#lms-quiz-access-overlay [data-lms-ac-policy="${key}"]`)?.value || fallback);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(60000, Math.max(1000, Math.round(numeric)));
    };
    return normalizeLmsAntiCheatPolicy({
        ...current,
        processScanning: readBool('processScanning'),
        clipboardClearing: readBool('clipboardClearing'),
        focusProtection: readBool('focusProtection'),
        inputBlocking: readBool('inputBlocking'),
        kioskMode: readBool('kioskMode'),
        vmDetection: readBool('vmDetection'),
        devToolsProtection: readBool('devToolsProtection'),
        allowDebugTools: readBool('allowDebugTools'),
        navigationProtection: readBool('navigationProtection'),
        securityDialogs: readBool('securityDialogs'),
        violationScreen: readBool('violationScreen'),
        allowedDomains: readList('allowedDomains'),
        blockedProcesses: readList('blockedProcesses'),
        heartbeatMs: readMs('heartbeatMs', current.heartbeatMs),
        processScanMs: readMs('processScanMs', current.processScanMs)
    });
}

function closeLmsQuizAccessDialog() {
    const overlay = document.getElementById('lms-quiz-access-overlay');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

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
            <label class="lms-quiz-access-student-row">
                <span class="lms-quiz-access-student-meta">
                    <span class="lms-quiz-access-student-name">${escapeHtml(student.name)}</span>
                    <span class="lms-quiz-access-student-id">${escapeHtml(student.id)}</span>
                </span>
                <input class="lms-quiz-access-checkbox" type="checkbox" data-lms-quiz-access="true" value="${escapeHtml(student.id)}" ${selectedIds.has(String(student.id)) ? 'checked' : ''}>
            </label>
        `).join('')
        : `<div class="lms-quiz-access-empty">No enrolled students found for this group.</div>`;
    const bodyHtml = `
                <div class="lms-quiz-access-toolbar">
                    <div class="lms-quiz-access-summary">
                        <div class="lms-quiz-access-summary-title">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                        <div class="lms-quiz-access-summary-copy">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</div>
                    </div>
                    <div class="lms-quiz-access-toolbar-actions">
                        <button type="button" class="lux-secondary-btn lms-quiz-access-toolbar-btn" data-lms-click="document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]').forEach(el => el.checked = true)">Select All</button>
                        <button type="button" class="lux-secondary-btn lms-quiz-access-toolbar-btn" data-lms-click="document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]').forEach(el => el.checked = false)">Clear All</button>
                    </div>
                </div>
                ${lifecycle === 'draft'
                    ? `<div class="lms-quiz-access-policy-stack">
                            <div class="lms-quiz-access-policy-title">Publish Mode</div>
                            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                                <input type="radio" name="lms-quiz-publish-mode" value="manual" ${currentPublishMode === 'manual' ? 'checked' : ''}>
                                <span><strong>Publish now</strong><br>Students can answer as soon as the quiz is available.</span>
                            </label>
                            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                                <input type="radio" name="lms-quiz-publish-mode" value="scheduled" ${currentPublishMode === 'scheduled' ? 'checked' : ''}>
                                <span><strong>Automatic publish</strong><br>The quiz opens at the start time and closes itself at the end time.</span>
                            </label>
                            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                                <input type="checkbox" id="lms-quiz-attendance-gate" ${attendanceGateEnabled ? 'checked' : ''}>
                                <span><strong>Attendance gate</strong><br>TA / professor must mark the student present in the LMS review board before Start Quiz unlocks.</span>
                            </label>
                        </div>`
                    : `<div class="lms-quiz-access-status-card">
                            <div><strong>Current mode:</strong> ${currentPublishMode === 'scheduled' ? 'Automatic publish by time' : 'Manual publish'}</div>
                            <div><strong>Attendance gate:</strong> ${attendanceGateEnabled ? 'Present students only' : 'Disabled'}</div>
                        </div>`
                }
                ${renderLmsAntiCheatPolicyControls(quiz)}
                <div class="lms-quiz-access-student-list lux-scrollbar">${checkboxRows}</div>`;
    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-access-overlay';
    overlay.className = 'lms-glass-dialog-overlay lms-quiz-access-overlay';
    overlay.setAttribute('data-lux-transparency-exempt', '1');
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizAccessDialog();
    };
    overlay.innerHTML = typeof renderLuxGlassDialogCard === 'function'
        ? renderLuxGlassDialogCard({
            hookClass: 'lms-quiz-access-dialog',
            bodyClass: 'lms-quiz-access-body',
            title: lifecycle === 'draft' ? 'Publish Quiz' : 'Manage Quiz Access',
            icon: 'fa-user-check',
            subtitle: 'Default roster starts with all enrolled students. Uncheck students who are absent from class.',
            closeAttr: 'data-lms-click="closeLmsQuizAccessDialog()"',
            bodyHtml,
            actionsHtml: `
                <button type="button" class="lux-secondary-btn lms-quiz-access-footer-btn" data-lms-click="closeLmsQuizAccessDialog()">Cancel</button>
                <button type="button" class="lux-primary-btn lms-quiz-access-footer-btn" data-lms-click="saveLmsQuizAccessSettings(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-check"></i> ${lifecycle === 'draft' ? 'Save Publish Settings' : 'Save Access'}</button>`
        })
        : bodyHtml;
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
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
    quiz.antiCheatPolicy = readLmsAntiCheatPolicyFromAccessDialog(quiz);
    quiz.antiCheatPolicyOverride = true;
    quiz.publishedAt = requestedMode === 'scheduled'
        ? (isLmsQuizVisibleToStudentsNow(quiz) ? (quiz.publishedAt || new Date().toISOString()) : null)
        : (quiz.publishedAt || new Date().toISOString());
    quiz.publishedBy = quiz.publishedBy || getSimulatedUserName();
    quiz.updatedAt = new Date().toISOString();
    saveLmsQuizWorkspaceRecord(resourceKey, quiz);
    syncLmsQuizRoster(resourceKey, quiz);
    saveState();
    syncProtectedQuizRecordToBackend(resourceKey, quiz, { status: 'published' }).catch(() => null);
    closeLmsQuizAccessDialog();
    rerenderCurrentLmsQuizWorkspace();
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
        return `
            <div data-quiz-id="${escapeHtml(quiz.id)}" class="lms-quiz-card lux-soft-chrome home-hover-chip">
                <div class="lms-quiz-card-head">
                    <div>
                        <div class="lms-quiz-card-badges">
                            <span class="lms-quiz-card-eyebrow">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</span>
                            <span class="lms-quiz-card-status is-${escapeHtml(lifecycle)}">${escapeHtml(lifecycle)}</span>
                        </div>
                        <div class="lms-quiz-card-title">${escapeHtml(quiz.title || 'Untitled Quiz')}</div>
                        <div class="lms-quiz-card-meta">${quiz.availableFrom ? `Starts ${escapeHtml(formatLmsDateTime(quiz.availableFrom))}` : 'Starts immediately'}${quiz.availableUntil ? `  -  Ends ${escapeHtml(formatLmsDateTime(quiz.availableUntil))}` : ''}</div>
                        <div class="lms-quiz-card-meta">Published by: ${escapeHtml(quiz.publishedBy || 'Not published yet')}</div>
                    </div>
                    <div class="lms-quiz-card-score-pill home-hover-chip">${escapeHtml(String(getAdminQuizTotalScore(quiz)))} pts</div>
                </div>
                <div class="lms-quiz-card-stats">
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Questions</div><div class="lms-quiz-card-stat-value">${escapeHtml(String((quiz.questions || []).length))}</div></div>
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Allowed</div><div class="lms-quiz-card-stat-value">${escapeHtml(allowCountLabel)}</div></div>
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Pending Review</div><div class="lms-quiz-card-stat-value">${escapeHtml(String(stats.pendingReviewCount))}</div></div>
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Graded</div><div class="lms-quiz-card-stat-value">${escapeHtml(String(stats.gradedCount))}</div></div>
                </div>
                <div class="lms-quiz-card-actions">
                    ${lifecycle === 'draft'
                        ? `<button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="loadAdminQuizForEdit(${jsQuote(quiz.id)})"><i class="fas fa-pen"></i> Edit Draft</button>
                           <button class="lux-primary-btn lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-paper-plane"></i> Publish</button>
                           <button class="lux-secondary-btn lms-quiz-card-action lms-quiz-card-action-danger" data-lms-click="deleteAdminQuiz(${jsQuote(quiz.id)})"><i class="fas fa-trash"></i> Delete Draft</button>`
                        : `<button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="toggleLmsQuizReviewPanel(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-users"></i> View Submissions</button>
                           <button class="lux-secondary-btn lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-user-check"></i> Manage Access</button>
                           ${lifecycle === 'published' ? `<button class="lux-secondary-btn lms-quiz-card-action lms-quiz-card-action-warning" data-lms-click="closeLmsQuiz(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-stop-circle"></i> Close Quiz</button>` : ''}`
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
        <div class="lms-quiz-card-group">
            <div class="lms-quiz-card-group-head">
                <div class="lms-quiz-card-group-title">${title}</div>
                <div class="lms-quiz-card-group-copy">${description}</div>
            </div>
            ${items.length ? items.map(renderQuizCard).join('') : `<div class="lms-quiz-card-empty">Nothing here yet.</div>`}
        </div>
    `;

    return `
        <div class="lms-quiz-card-group-list">
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
                button.classList.add('is-locked');
            }
            return;
        }
        node.textContent = 'Quiz can be opened again.';
        if (button) {
            const unlockedLabel = String(button.getAttribute('data-unlocked-label') || 'View Quiz');
            button.disabled = false;
            button.classList.remove('is-locked');
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
            statusNode.classList.add('is-warning');
            statusNode.textContent = getLmsQuizPostSubmitLockMessage(submission);
            actionButton.disabled = true;
            actionButton.classList.add('is-locked');
            actionButton.innerHTML = '<i class="fas fa-clock"></i> Locked After Submit';
            return;
        }
        statusNode.removeAttribute('data-lms-post-submit-lock');
        statusNode.removeAttribute('data-lock-until');
        statusNode.removeAttribute('data-lock-button');
        statusNode.classList.remove('is-warning');
        actionButton.disabled = false;
        actionButton.classList.remove('is-locked');
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

function getCurrentLmsActiveTab() {
    const activeTab = document.querySelector('#page-lms-inner [data-lms-tab].is-active');
    return activeTab ? String(activeTab.id || '').replace(/^tab-/, '') : 'interaction';
}

function rerenderCurrentLmsTab() {
    switchLMSTab(getCurrentLmsActiveTab(), { force: true });
}

function resolveLmsQuizWorkspace(courseKey = currentLmsQuizCourseKey || currentCourseId) {
    const context = resolveActiveLmsQuizContext(courseKey, getCurrentFaculty());
    if (!context?.resourceKey) return null;
    return {
        ...context,
        students: getLmsQuizEligibleStudents(context.resourceKey)
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

function isLmsQuizTabActive(quizTab) {
    if (!quizTab?.classList) return false;
    return quizTab.classList.contains('is-active') || quizTab.classList.contains('active');
}

function resetLmsQuizBuilderDraft(resourceKey = currentLmsQuizCourseKey || currentCourseId) {
    const context = resolveLmsQuizWorkspace(resourceKey);
    if (!context?.resourceKey) return;
    const uiState = ensureLmsQuizUiState(context.resourceKey);
    uiState.editorDraft = createLmsQuizBuilderDraft(context);
    uiState.activeQuestionId = uiState.editorDraft.questions[0]?.id || null;
    uiState.activeVariantId = null;
    rerenderCurrentLmsQuizWorkspace();
}

function rerenderCurrentLmsQuizWorkspace() {
    const quizTab = document.getElementById('tab-quiz');
    const contentArea = document.getElementById('lms-content-area');
    if (!quizTab || !contentArea || !isLmsQuizTabActive(quizTab)) return;
    renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId);
    if (typeof window.syncLmsTabRenderCacheFromDom === 'function') {
        const sectionType = typeof getCurrentLmsSectionType === 'function'
            ? getCurrentLmsSectionType()
            : '';
        const courseKey = typeof getLmsTabCourseKey === 'function'
            ? getLmsTabCourseKey('quiz')
            : (currentLmsQuizCourseKey || currentCourseId);
        window.syncLmsTabRenderCacheFromDom('quiz', courseKey, sectionType);
    }
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

        const api = {
            renderLmsAntiCheatPolicyControls,
            readLmsAntiCheatPolicyFromAccessDialog,
            openLmsQuizAccessDialog,
            closeLmsQuizAccessDialog,
            openStudentQuizPaperFromHistory,
            saveLmsQuizAccessSettings,
            closeLmsQuiz,
            renderEmbeddedLmsQuizSectionCards,
            ensureLmsQuizUiState,
            clearActiveLmsQuizCountdown,
            clearActiveLmsPostSubmitLockInterval,
            updateLmsPostSubmitLockCountdowns,
            startActiveLmsPostSubmitLockInterval,
            decorateLmsPostSubmitLockedQuizCards,
            renderAdminQaTestingCard,
            renderSharedQaRoleTestingCard,
            openSharedQaTest,
            getCurrentLmsActiveTab,
            rerenderCurrentLmsTab,
            resolveLmsQuizWorkspace,
            getLmsQuizBuilderEditorState,
            getLmsQuizBuilderDraft,
            isLmsQuizTabActive,
            resetLmsQuizBuilderDraft,
            rerenderCurrentLmsQuizWorkspace,
            getActiveLmsQuizBuilderQuestion,
            getActiveLmsQuizBuilderVariant,
            setActiveLmsQuizBuilderQuestion,
            toggleLmsQuizVariantSetPanel,
            toggleLmsQuizQuestionNavigatorPanel,
            setLmsQuizDraftField,
            updateLmsQuizQuestionField,
            markLmsQuizVariantCustomized,
            setActiveLmsQuizBuilderVariant,
            updateLmsQuizVariantQuestionField,
            setLmsQuizVariantQuestionType,
            setLmsQuizVariantQuestionOptionCount,
            updateLmsQuizVariantQuestionOptionText,
            setLmsQuizVariantQuestionCorrectOption,
            generateLmsQuizVariants,
            regenerateAllLmsQuizVariants,
            regenerateLmsQuizVariant,
            resetLmsQuizVariantsToBasePool,
            removeLmsQuizVariantQuestion,
            addBaseQuestionToLmsQuizVariant,
            replaceLmsQuizVariantQuestionWithBaseQuestion,
            setLmsQuizQuestionType,
            setLmsQuizQuestionOptionCount,
            updateLmsQuizQuestionOptionText,
            setLmsQuizQuestionCorrectOption,
            addLmsQuizQuestion,
            removeActiveLmsQuizBuilderQuestion,
            stepLmsQuizBuilderQuestion,
            loadLmsQuizDraftForEdit,
            deleteLmsQuizDraft,
            saveLmsQuizBuilderDraft,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsQuizWorkspaceSessionApi({});
})();
