/* LMS quiz workspace runtime extracted from lms.js. */

const LMS_STUDENT_QUIZ_FOCUS_STATE_KEY = 'KIU_LMS_STUDENT_QUIZ_FOCUS_STATE';

function jsQuote(value) {
    return `'${String(value || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function getAdminQuizTotalScore(quiz = {}) {
    return (Array.isArray(quiz?.questions) ? quiz.questions : []).reduce((sum, question) => {
        const score = Number(question?.score || 0);
        return sum + (Number.isFinite(score) ? score : 0);
    }, 0);
}

const LMS_DEFAULT_ANTI_CHEAT_POLICY = {
    processScanning: true,
    clipboardClearing: true,
    focusProtection: true,
    inputBlocking: true,
    kioskMode: true,
    vmDetection: true,
    devToolsProtection: true,
    allowDebugTools: false,
    navigationProtection: true,
    securityDialogs: true,
    violationScreen: true,
    blockedProcesses: [
        'TeamViewer.exe', 'AnyDesk.exe', 'Discord.exe', 'obs64.exe', 'obs32.exe',
        'Zoom.exe', 'Skype.exe', 'Cheat Engine.exe', 'x64dbg.exe', 'Wireshark.exe',
        'SnippingTool.exe', 'ScreenClippingHost.exe'
    ],
    allowedDomains: [],
    heartbeatMs: 2000,
    processScanMs: 1500
};

function normalizeLmsAntiCheatPolicy(policy = {}) {
    const source = policy && typeof policy === 'object' ? policy : {};
    const merged = { ...LMS_DEFAULT_ANTI_CHEAT_POLICY, ...source };
    const uniqueList = values => Array.from(new Set((Array.isArray(values) ? values : [])
        .map(value => String(value || '').trim())
        .filter(Boolean)));
    const boundedMs = (value, fallback) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.min(60000, Math.max(1000, Math.round(numeric)));
    };
    return {
        processScanning: merged.processScanning !== false,
        clipboardClearing: merged.clipboardClearing !== false,
        focusProtection: merged.focusProtection !== false,
        inputBlocking: merged.inputBlocking !== false,
        kioskMode: merged.kioskMode !== false,
        vmDetection: merged.vmDetection !== false,
        devToolsProtection: merged.devToolsProtection !== false,
        allowDebugTools: merged.allowDebugTools === true,
        navigationProtection: merged.navigationProtection !== false,
        securityDialogs: merged.securityDialogs !== false,
        violationScreen: merged.violationScreen !== false,
        blockedProcesses: uniqueList(merged.blockedProcesses).length ? uniqueList(merged.blockedProcesses) : [...LMS_DEFAULT_ANTI_CHEAT_POLICY.blockedProcesses],
        allowedDomains: uniqueList(merged.allowedDomains),
        heartbeatMs: boundedMs(merged.heartbeatMs, LMS_DEFAULT_ANTI_CHEAT_POLICY.heartbeatMs),
        processScanMs: boundedMs(merged.processScanMs, LMS_DEFAULT_ANTI_CHEAT_POLICY.processScanMs)
    };
}

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
                <input class="lms-route-input" type="number" min="1000" max="60000" step="500" data-lms-ac-policy="heartbeatMs" value="${Number(policy.heartbeatMs || 2000)}">
            </label>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Process scan interval</strong><br>Milliseconds between blocked software checks.</span>
                <input class="lms-route-input" type="number" min="1000" max="60000" step="500" data-lms-ac-policy="processScanMs" value="${Number(policy.processScanMs || 1500)}">
            </label>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Allowed domains</strong><br>One hostname per line; LMS and backend domains are added automatically.</span>
                <textarea class="lms-route-input" rows="3" data-lms-ac-policy="allowedDomains">${escapeHtml((policy.allowedDomains || []).join('\n'))}</textarea>
            </label>
            <label class="lms-quiz-policy-card lms-quiz-access-policy-item">
                <span><strong>Blocked processes</strong><br>One process name per line.</span>
                <textarea class="lms-route-input" rows="4" data-lms-ac-policy="blockedProcesses">${escapeHtml((policy.blockedProcesses || []).join('\n'))}</textarea>
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

    const overlay = document.createElement('div');
    overlay.id = 'lms-quiz-access-overlay';
    overlay.className = 'lms-quiz-access-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="lms-quiz-access-dialog">
            <div class="lms-quiz-access-head">
                <div class="lms-quiz-access-head-copy">
                    <div class="lms-quiz-access-title">${getLmsQuizLifecycleStatus(quiz) === 'draft' ? 'Publish Quiz' : 'Manage Quiz Access'}</div>
                    <div class="lms-quiz-access-copy">Default roster starts with all enrolled students. Uncheck students who are absent from class.</div>
                </div>
                <button type="button" class="kiu-btn-outline lms-quiz-access-close-btn" data-lms-click="document.getElementById('lms-quiz-access-overlay')?.remove()"><i class="fas fa-times"></i> Close</button>
            </div>
            <div class="lms-quiz-access-body">
                <div class="lms-quiz-access-toolbar">
                    <div class="lms-quiz-access-summary">
                        <div class="lms-quiz-access-summary-title">${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                        <div class="lms-quiz-access-summary-copy">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}</div>
                    </div>
                    <div class="lms-quiz-access-toolbar-actions">
                        <button type="button" class="kiu-btn-outline lms-quiz-access-toolbar-btn" data-lms-click="document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]').forEach(el => el.checked = true)">Select All</button>
                        <button type="button" class="kiu-btn-outline lms-quiz-access-toolbar-btn" data-lms-click="document.querySelectorAll('#lms-quiz-access-overlay [data-lms-quiz-access=true]').forEach(el => el.checked = false)">Clear All</button>
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
                <div class="lms-quiz-access-student-list">${checkboxRows}</div>
                <div class="lms-quiz-access-footer">
                    <button type="button" class="kiu-btn-outline lms-quiz-access-footer-btn" data-lms-click="document.getElementById('lms-quiz-access-overlay')?.remove()">Cancel</button>
                    <button type="button" class="kiu-btn-blue lms-quiz-access-footer-btn" data-lms-click="saveLmsQuizAccessSettings(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-check"></i> ${lifecycle === 'draft' ? 'Save Publish Settings' : 'Save Access'}</button>
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
    quiz.antiCheatPolicy = readLmsAntiCheatPolicyFromAccessDialog(quiz);
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
        return `
            <div data-quiz-id="${escapeHtml(quiz.id)}" class="lms-quiz-card">
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
                    <div class="lms-quiz-card-score-pill">${escapeHtml(String(getAdminQuizTotalScore(quiz)))} pts</div>
                </div>
                <div class="lms-quiz-card-stats">
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Questions</div><div class="lms-quiz-card-stat-value">${escapeHtml(String((quiz.questions || []).length))}</div></div>
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Allowed</div><div class="lms-quiz-card-stat-value">${escapeHtml(allowCountLabel)}</div></div>
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Pending Review</div><div class="lms-quiz-card-stat-value">${escapeHtml(String(stats.pendingReviewCount))}</div></div>
                    <div class="lms-quiz-card-stat"><div class="lms-quiz-card-stat-label">Graded</div><div class="lms-quiz-card-stat-value">${escapeHtml(String(stats.gradedCount))}</div></div>
                </div>
                <div class="lms-quiz-card-actions">
                    ${lifecycle === 'draft'
                        ? `<button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="loadAdminQuizForEdit(${jsQuote(quiz.id)})"><i class="fas fa-pen"></i> Edit Draft</button>
                           <button class="kiu-btn-blue lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-paper-plane"></i> Publish</button>
                           <button class="kiu-btn-outline lms-quiz-card-action lms-quiz-card-action-danger" data-lms-click="deleteAdminQuiz(${jsQuote(quiz.id)})"><i class="fas fa-trash"></i> Delete Draft</button>`
                        : `<button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="toggleLmsQuizReviewPanel(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-users"></i> View Submissions</button>
                           <button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-user-check"></i> Manage Access</button>
                           ${lifecycle === 'published' ? `<button class="kiu-btn-outline lms-quiz-card-action lms-quiz-card-action-warning" data-lms-click="closeLmsQuiz(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-stop-circle"></i> Close Quiz</button>` : ''}`
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
    // Explicit owner: assets/css/lms-route.css
    return;
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
    const activeTab = document.querySelector('#page-lms-inner [data-lms-tab].is-active');
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

function getLmsQuizStatusToneClass(status) {
    const toneMap = {
        draft: 'is-draft',
        upcoming: 'is-upcoming',
        open: 'is-open',
        'in-progress': 'is-in-progress',
        submitted: 'is-submitted',
        graded: 'is-graded',
        closed: 'is-closed'
    };
    return toneMap[String(status || 'draft')] || 'is-draft';
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
                    ? `<button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="loadLmsQuizDraftForEdit(${jsQuote(quiz.id)})"><i class="fas fa-pen"></i> Edit Draft</button>
                       <button class="kiu-btn-blue lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-paper-plane"></i> Publish</button>
                       <button class="kiu-btn-outline lms-quiz-card-action lms-quiz-card-action-danger" data-lms-click="deleteLmsQuizDraft(${jsQuote(quiz.id)})"><i class="fas fa-trash"></i> Delete Draft</button>`
                    : `<button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="toggleLmsQuizReviewPanel(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-users"></i> View Submissions</button>
                       <button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="exportLmsQuizMonitoringLog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-file-export"></i> Export Monitoring</button>
                       <button class="kiu-btn-outline lms-quiz-card-action" data-lms-click="openLmsQuizAccessDialog(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-user-check"></i> Manage Access</button>
                       ${lifecycle === 'published' ? `<button class="kiu-btn-outline lms-quiz-card-action lms-quiz-card-action-warning" data-lms-click="closeLmsQuiz(${jsQuote(context.resourceKey)}, ${jsQuote(quiz.id)})"><i class="fas fa-stop-circle"></i> Close Quiz</button>` : ''}`}
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
    // Explicit owner: assets/css/lms-route.css
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
    overlay.className = 'lms-quiz-board-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizBoardModal();
    };
    overlay.innerHTML = `
        <div class="lms-quiz-board-modal">
            <div class="lms-quiz-board-head">
                <div class="lms-quiz-board-head-copy">
                    <div class="lms-quiz-board-kicker">Quiz Board</div>
                    <div class="lms-quiz-board-title">${escapeHtml(meta.title)}  -  ${escapeHtml(context.subject?.name || context.courseId)}  -  ${escapeHtml(context.group?.name || context.groupId)}</div>
                    <div class="lms-quiz-board-copy">${escapeHtml(meta.description)}</div>
                </div>
                <button type="button" class="kiu-btn-outline lms-quiz-board-close-btn" data-lms-click="closeLmsQuizBoardModal()"><i class="fas fa-times"></i> Close</button>
            </div>
            <div class="lms-quiz-board-body">
                <div class="lms-quiz-board-toolbar">
                    <div class="lms-quiz-board-tabs">
                        ${modalTabs.map(tab => `
                            <button type="button" data-lms-click="openLmsQuizBoardModal(${jsQuote(tab.key)})" class="${targetPage === tab.key ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-quiz-board-tab">
                                ${escapeHtml(tab.label)}
                            </button>
                        `).join('')}
                    </div>
                    <div class="lms-quiz-board-count-pill">
                        ${escapeHtml(String(meta.items.length))} total in this section
                    </div>
                </div>
                ${meta.items.length
                    ? meta.items.map(quiz => renderLmsQuizLifecycleCard(context, quiz, meta.sectionType)).join('')
                    : '<div class="lms-quiz-board-empty">Nothing here yet.</div>'}
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
                            <button type="button" class="kiu-btn-outline lms-quiz-variant-action-danger" data-lms-click="removeLmsQuizVariantQuestion(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)})"><i class="fas fa-trash"></i> Remove</button>
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
                        <button type="button" class="kiu-btn-outline lms-quiz-variant-action" data-lms-click="replaceLmsQuizVariantQuestionWithBaseQuestion(${jsQuote(activeVariant.id)}, ${jsQuote(question.id)}, document.getElementById(${jsQuote(replacementSelectId)})?.value)"><i class="fas fa-arrows-rotate"></i> Replace</button>
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
                    <button type="button" class="kiu-btn-outline lms-quiz-studio-alert-action" data-lms-click="setLmsQuizBoardPage('review')">
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
                        <button type="button" class="${monitorMode === 'running' ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorMode('running')">
                            Running Quiz Only
                        </button>
                        <button type="button" class="${monitorMode === 'all' ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorMode('all')">
                            All Flagged
                        </button>
                        <button type="button" class="${monitorAckFilter === 'all' ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorAckFilter('all')">
                            All Alerts
                        </button>
                        <button type="button" class="${monitorAckFilter === 'unacknowledged' ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorAckFilter('unacknowledged')">
                            Unacknowledged
                        </button>
                        <button type="button" class="${monitorAckFilter === 'acknowledged' ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-live-monitor-filter-btn" data-lms-click="setLmsQuizMonitorAckFilter('acknowledged')">
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
                                ${entry.isAcknowledged ? '' : `<button type="button" class="kiu-btn-outline lms-live-monitor-action lms-live-monitor-action-ack" data-lms-click="acknowledgeLmsQuizMonitorAlert(${jsQuote(context.resourceKey)}, ${jsQuote(entry.quizId)}, ${jsQuote(entry.studentId)})">
                                    <i class="fas fa-check"></i> Acknowledge
                                </button>`}
                                <button type="button" class="kiu-btn-outline lms-live-monitor-action lms-live-monitor-action-open" data-lms-click="openLmsQuizReviewModal(${jsQuote(context.resourceKey)}, ${jsQuote(entry.quizId)}, ${jsQuote(entry.studentId)})">
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
                                <button type="button" class="kiu-btn-outline lms-quiz-variant-action-btn" data-lms-click="toggleLmsQuizVariantSetPanel()"><i class="fas ${variantSetExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${variantSetExpanded ? 'Hide setup' : 'Show setup'}</button>
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
                                    <button type="button" class="kiu-btn-blue lms-quiz-variant-action-btn" data-lms-click="generateLmsQuizVariants()"><i class="fas fa-wand-magic-sparkles"></i> Generate Variants</button>
                                    <button type="button" class="kiu-btn-outline lms-quiz-variant-action-btn" data-lms-click="regenerateAllLmsQuizVariants()"><i class="fas fa-rotate"></i> Regenerate All</button>
                                    <button type="button" class="kiu-btn-outline lms-quiz-variant-action-btn" data-lms-click="resetLmsQuizVariantsToBasePool()"><i class="fas fa-layer-group"></i> Reset to Base Pool</button>
                                </div>
                                <div class="lms-quiz-variant-workspace">
                                    <div class="lms-quiz-variant-workspace-head">
                                        <div>
                                            <div class="lms-quiz-variant-workspace-kicker">Variant Tabs</div>
                                            <div class="lms-quiz-variant-workspace-copy">Generate first, then adjust a single variant manually if needed.</div>
                                        </div>
                                        ${activeVariant ? `<button type="button" class="kiu-btn-outline lms-quiz-variant-action-btn" data-lms-click="regenerateLmsQuizVariant(${jsQuote(activeVariant.id)})"><i class="fas fa-repeat"></i> Regenerate ${escapeHtml(activeVariant.label)}</button>` : ''}
                                    </div>
                                    <div class="lms-quiz-variant-tab-row">${variantTabsMarkup || '<span class="lms-quiz-variant-empty-copy">No variants generated yet.</span>'}</div>
                                    ${activeVariant ? `<div class="lms-quiz-variant-add-row">
                                        <label class="lms-quiz-variant-field">Add Base Question To ${escapeHtml(activeVariant.label)}<select id="lms-variant-add-base-question" class="lms-quiz-variant-config-control"><option value="">Choose base question</option>${baseQuestionOptionMarkup}</select></label>
                                        <button type="button" class="kiu-btn-outline lms-quiz-variant-action-btn" data-lms-click="addBaseQuestionToLmsQuizVariant(${jsQuote(activeVariant.id)}, document.getElementById('lms-variant-add-base-question')?.value)"><i class="fas fa-plus"></i> Add Question</button>
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
                                <button class="kiu-btn-outline lms-quiz-action-btn" data-lms-click="resetLmsQuizBuilderDraft()"><i class="fas fa-rotate-left"></i> Reset Draft</button>
                                <button class="kiu-btn-blue lms-quiz-action-btn" data-lms-click="addLmsQuizQuestion()"><i class="fas fa-plus"></i> Add Question</button>
                                <button type="button" class="kiu-btn-outline lms-quiz-action-btn" data-lms-click="toggleLmsQuizQuestionNavigatorPanel()"><i class="fas ${questionNavigatorExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}"></i> ${questionNavigatorExpanded ? 'Hide builder' : 'Show builder'}</button>
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
                                    <button class="kiu-btn-outline lms-quiz-question-remove-btn" data-lms-click="removeActiveLmsQuizBuilderQuestion()" ${(draft?.questions?.length || 0) <= 1 ? 'disabled' : ''}><i class="fas fa-trash"></i> Remove</button>
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
                                <button class="kiu-btn-outline lms-quiz-question-step-btn ${activeQuestionIndex <= 0 ? 'is-disabled' : ''}" data-lms-click="stepLmsQuizBuilderQuestion(-1)" ${activeQuestionIndex <= 0 ? 'disabled' : ''}><i class="fas fa-arrow-left"></i> Previous</button>
                                <button class="kiu-btn-outline lms-quiz-question-step-btn ${activeQuestionIndex >= (draft?.questions?.length || 1) - 1 ? 'is-disabled' : ''}" data-lms-click="stepLmsQuizBuilderQuestion(1)" ${activeQuestionIndex >= (draft?.questions?.length || 1) - 1 ? 'disabled' : ''}>Next <i class="fas fa-arrow-right"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="lms-quiz-question-save-row">
                        <button class="kiu-btn-blue lms-quiz-question-save-btn" data-lms-click="saveLmsQuizBuilderDraft()"><i class="fas fa-save"></i> ${draft?.editingQuizId ? 'Update Draft' : 'Save Draft'}</button>
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
                                <button type="button" class="kiu-btn-outline lms-quiz-saved-open-btn" data-lms-click="openLmsQuizBoardModal(${jsQuote(boardPage)})">
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
                                <button type="button" data-lms-click="setLmsQuizBoardPage(${jsQuote(tab.key)})" class="${boardPage === tab.key ? 'kiu-btn-blue' : 'kiu-btn-outline'} lms-quiz-saved-tab-btn">
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
                        <button type="button" class="kiu-btn-outline lms-quiz-error-btn" data-lms-click="resetLmsQuizBuilderDraft(${jsQuote(context.resourceKey)}); renderLmsQuizSection(${jsQuote(context.resourceKey)})">
                            <i class="fas fa-life-ring"></i> Reset Builder Draft
                        </button>
                        <button type="button" class="kiu-btn-blue lms-quiz-error-btn" data-lms-click="renderLmsQuizSection(${jsQuote(context.resourceKey)})">
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
                            <button data-lms-student-quiz-action="true" type="button" class="kiu-btn-blue lms-student-quiz-primary-btn" data-lms-click="openLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)})">
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
                            <button type="button" class="kiu-btn-outline lms-student-quiz-back-btn" data-lms-click="backToStudentLmsQuizList(${jsQuote(resourceKey)})"><i class="fas fa-arrow-left"></i> Back to Quizzes</button>
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
                                <button type="button" class="kiu-btn-blue lms-student-quiz-cover-btn" data-lms-click="revealLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)})" ${(blueGate.required && !blueGate.startUnlocked) || (sessionGate.required && !sessionGate.startUnlocked) ? 'disabled' : ''}>
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
                        : `<div class="lms-student-quiz-answer-shell">${answersMarkup}${showSubmit ? `<div class="lms-student-quiz-submit-row"><button type="button" class="kiu-btn-blue lms-student-quiz-submit-btn" data-lms-click="submitLmsStudentQuiz(${jsQuote(resourceKey)}, ${jsQuote(selectedQuiz.id)})"><i class="fas fa-paper-plane"></i> Submit Answers</button></div>` : ''}</div>`
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
                        <button type="button" class="kiu-btn-blue lms-student-quiz-error-btn" data-lms-click="renderLmsQuizSection(currentLmsQuizCourseKey || currentCourseId)">
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
    overlay.className = 'lms-quiz-board-overlay lms-quiz-review-board-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsQuizReviewBoardModal();
    };
    overlay.innerHTML = `
        <div class="lms-quiz-board-modal lms-quiz-review-board-modal">
            <div class="lms-quiz-board-head">
                <div class="lms-quiz-board-head-copy">
                    <div class="lms-quiz-board-title">View Submissions</div>
                    <div class="lms-quiz-board-copy">${escapeHtml(getLmsQuizDisplayLabel(quiz))}  -  ${escapeHtml(quiz.title || 'Untitled Quiz')}</div>
                </div>
                <button type="button" class="kiu-btn-outline lms-quiz-board-close-btn" data-lms-click="closeLmsQuizReviewBoardModal()"><i class="fas fa-times"></i> Close</button>
            </div>
            <div class="lms-quiz-board-body">
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
                <td>${submission.variantLabel ? `<span class="lms-quiz-review-variant-pill">${escapeHtml(submission.variantLabel)}</span>` : '<span class="lms-quiz-review-variant-empty">Standard</span>'}</td>
                <td><span class="lms-quiz-review-access-pill ${accessAllowed ? 'is-allowed' : 'is-blocked'}">${accessAllowed ? 'Allowed' : 'Blocked'}</span></td>
                <td>${examSession
                    ? `<div class="lms-quiz-review-approval-stack"><span class="lms-quiz-review-approval-pill ${blocked ? 'is-blocked' : 'is-approved'}">${blocked ? 'Blocked by staff' : 'Approved roster'}</span><span class="lms-quiz-review-attendance-meta">Handwritten room check is handled outside the portal.</span></div>`
                    : `<select data-lms-change="setLmsQuizAttendanceStatus(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)}, this.value)" class="lms-quiz-review-attendance-select">
                        <option value="" ${!submission.attendanceStatus ? 'selected' : ''}>Not checked</option>
                        <option value="Present" ${submission.attendanceStatus === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Late" ${submission.attendanceStatus === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Absent" ${submission.attendanceStatus === 'Absent' ? 'selected' : ''}>Absent</option>
                    </select>
                    <div class="lms-quiz-review-attendance-meta">${submission.attendanceVerifiedAt ? `Verified ${escapeHtml(formatLmsDateTime(submission.attendanceVerifiedAt))}` : 'Waiting for attendance check'}</div>`}
                </td>
                <td><span class="lms-quiz-review-status-pill ${badgeToneClass}">${escapeHtml(badge.label)}</span></td>
                <td class="lms-quiz-review-student-id">
                    <div class="lms-quiz-review-monitor-stack">
                        <span class="lms-quiz-review-monitor-pill ${alertCount ? 'is-warning' : 'is-clean'}">${alertCount ? `${alertCount} warning${alertCount === 1 ? '' : 's'}` : 'Clean'}</span>
                        <span class="lms-quiz-review-monitor-meta">${latestProctorEvent ? `${latestProctorEvent.note}  -  ${formatLmsDateTime(latestProctorEvent.createdAt)}` : 'No suspicious events logged.'}</span>
                        <span class="lms-quiz-review-monitor-meta">Outside actions: ${Number(submission.outsideActionCount || 0)}</span>
                    </div>
                </td>
                <td class="lms-quiz-review-raw-score">${Number(submission.finalScoreRaw ?? submission.autoScoreRaw ?? 0)} / ${getAdminQuizTotalScore({ ...quiz, questions: getLmsQuizQuestionsForStudent(quiz, student.id, submission) })}</td>
                <td class="lms-quiz-review-gradebook-score">${submission.gradebookScore === null || submission.gradebookScore === undefined ? '-' : Number(submission.gradebookScore)}</td>
                <td class="lms-quiz-review-actions">
                    <div class="lms-quiz-review-action-row">
                        ${examSession ? `<button type="button" class="kiu-btn-outline lms-quiz-action-btn is-compact lms-quiz-review-action-btn ${blocked ? 'is-approved' : 'is-danger'}" data-lms-click="toggleLmsExamSessionStudentBlock(${jsQuote(examSession.id)}, ${jsQuote(student.id)})"><i class="fas ${blocked ? 'fa-unlock' : 'fa-user-slash'}"></i> ${blocked ? 'Unblock' : 'Block'}</button>` : ''}
                        <button type="button" class="kiu-btn-outline lms-quiz-action-btn is-compact lms-quiz-review-action-btn" data-lms-click="openLmsQuizReviewModal(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)})"><i class="fas fa-eye"></i> View Quiz Paper</button>
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
                            ${badgeText ? `<span class="lms-quiz-review-option-badge">${escapeHtml(badgeText)}</span>` : ''}
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
                    ${!isWritten ? `<span class="lms-quiz-review-question-pill">${Number.isFinite(selectedOption) ? `Selected ${String.fromCharCode(65 + selectedOption)}` : 'No selection'}</span>` : ''}
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
                            <input id="${manualInputId}" data-lms-written-score="true" data-question-id="${escapeHtml(question.id)}" type="number" min="0" max="${questionManualMax}" value="${submission.manualScoresByQuestion?.[question.id] === null || submission.manualScoresByQuestion?.[question.id] === undefined ? '' : Number(submission.manualScoresByQuestion[question.id])}" placeholder="0 - ${questionManualMax}" class="lms-quiz-review-manual-input">
                        </label>
                    </div>
                ` : '<div class="lms-quiz-review-auto-pill"><i class="fas fa-bolt"></i> Auto-scored by computer</div>'}
            </div>
        `;
    }).join('');
    const secondaryAction = options.hideAction
        ? `<button type="button" class="kiu-btn-outline lms-quiz-action-btn lms-quiz-review-paper-secondary-action-btn" data-lms-click="${options.hideAction}">Hide quiz</button>`
        : `<button type="button" class="kiu-btn-outline lms-quiz-action-btn lms-quiz-review-paper-secondary-action-btn" data-lms-click="document.getElementById('lms-quiz-review-modal')?.remove()">Close</button>`;
    return `
        <div class="lms-quiz-review-paper-shell${options.embedded ? ' is-embedded' : ''}">
            <div class="lms-quiz-review-paper-head">
                <div>
                    <div class="lms-quiz-review-paper-title">${escapeHtml(student.name)}  -  ${escapeHtml(quiz.title || getLmsQuizDisplayLabel(quiz))}</div>
                    <div class="lms-quiz-review-paper-meta">${escapeHtml(getLmsQuizDisplayLabel(quiz))}${quiz.weekLabel ? `  -  ${escapeHtml(quiz.weekLabel)}` : ''}${submission.variantLabel ? `  -  ${escapeHtml(submission.variantLabel)}` : ''}</div>
                </div>
                ${options.embedded ? '<span class="lms-quiz-review-paper-badge"><i class="fas fa-file-alt"></i> Gradebook review</span>' : ''}
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
                <div class="lms-quiz-review-paper-action-row">${secondaryAction}<button type="button" class="kiu-btn-blue lms-quiz-review-paper-save-btn" data-lms-click="saveLmsQuizManualGrade(${jsQuote(resourceKey)}, ${jsQuote(quiz.id)}, ${jsQuote(student.id)}, ${jsQuote(attendanceId)}, ${jsQuote(scopeToken)}, ${jsQuote(options.focusSectionKey || '')}, ${jsQuote(options.studentName || student.name || '')})"><i class="fas fa-save"></i> Save Review</button></div>
            </div>
            <div class="lms-quiz-review-paper-answer-list">${answerRows || '<div class="lms-quiz-review-paper-answer-empty">No answers recorded yet.</div>'}</div>
        </div>
    `;
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
    overlay.className = 'lms-quiz-board-overlay lms-quiz-review-paper-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) overlay.remove();
    };
    overlay.innerHTML = `
        <div class="lms-quiz-board-modal lms-quiz-review-paper-modal">
            <div class="lms-quiz-board-head">
                <div class="lms-quiz-board-head-copy">
                    <div class="lms-quiz-board-title">${escapeHtml(student.name)}</div>
                    <div class="lms-quiz-board-copy">${escapeHtml(getLmsQuizDisplayLabel(quiz))}  -  ${escapeHtml(quiz.title || '')}</div>
                    <div class="lms-quiz-board-kicker">Full submitted quiz view for TA / Professor review</div>
                </div>
                <button type="button" class="kiu-btn-outline lms-quiz-board-close-btn" data-lms-click="document.getElementById('lms-quiz-review-modal')?.remove()"><i class="fas fa-times"></i> Close</button>
            </div>
            <div class="lms-quiz-board-body">
                ${buildLmsQuizReviewPaperMarkup(resourceKey, quizId, student.id, { studentName: student.name })}
            </div>
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

