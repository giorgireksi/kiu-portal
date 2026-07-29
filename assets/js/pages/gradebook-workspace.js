/* READABILITY: Gradebook workspace UI — component manager, score editors, roster shell, student view.
 * Sections: Bag | Components(peel) | Editors | Roster | StudentView
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Components ---
/* Gradebook workspace UI: component manager, score/comment editors, roster shell, student view.
   Depends on gradebook-model.js.
// --- READABILITY: Bag ---
   Wave 24: expose via window.KiuGradebookWorkspace / __kiuGbApi (flat window[key] for classic consumers). */
window.KiuGradebookWorkspace = window.KiuGradebookWorkspace || {};
const __kiuGbApi = window.KiuGradebookWorkspace;
window.__kiuGbApi = __kiuGbApi;
function __kiuGbExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuGbApi[key] = map[key];
        window[key] = map[key];
    });
}

// --- READABILITY: Components (peeled → gradebook-components-runtime.js; load before this host) ---
// Component manager + palette live on window via Pattern C peel.
// --- READABILITY: Roster ---
function gradebookRosterIdsForSubject(subjectId) {
    const target = String(subjectId || '').trim();
// --- READABILITY: StudentView ---
    return Object.keys(KIU_STATE.studentGrades || {}).filter(rosterId => gradebookSubjectIdFromRoster(rosterId) === target);
}

function countGradebookCriterionEntriesForSubject(subjectId, criterionKey) {
    const normalizedKey = normalizeGradebookCriterion(criterionKey);
    let count = 0;
    gradebookRosterIdsForSubject(subjectId).forEach(rosterId => {
        (KIU_STATE.studentGrades[rosterId] || []).forEach(student => {
            const entries = student?.assessments?.[normalizedKey];
// --- READABILITY: Editors ---
            if (Array.isArray(entries)) count += entries.filter(entry => Number.isFinite(Number(entry?.score))).length;
        });
    });
    return count;
}

function deleteGradebookCriterionDataForSubject(subjectId, criterionKey) {
    const normalizedKey = normalizeGradebookCriterion(criterionKey);
    gradebookRosterIdsForSubject(subjectId).forEach(rosterId => {
        const roster = KIU_STATE.studentGrades[rosterId];
        if (!Array.isArray(roster)) return;
        KIU_STATE.studentGrades[rosterId] = roster.map(student => {
            const safe = ensureGradeRecordHistories(student);
            if (safe.assessments) delete safe.assessments[normalizedKey];
            if (safe.assessmentSectionLabels) delete safe.assessmentSectionLabels[normalizedKey];
            return syncGradeRecordSummaries(safe);
        });
    });
}

// openGradebookComponentManager … closeGradebookComponentManager → gradebook-components-runtime.js

function persistStudentEvaluationEntryOnRoster(rosterKey, studentId, criterion, number, scoreValue, studentName = '', options = {}) {
    const rosterId = String(rosterKey || currentRosterId || '').trim();
    if (!rosterId) return null;
    const roster = Array.isArray(KIU_STATE.studentGrades?.[rosterId]) ? KIU_STATE.studentGrades[rosterId] : [];
    const index = roster.findIndex(entry => String(entry.id) === String(studentId));
    const existing = index >= 0 ? roster[index] : null;
    if (!existing) return null;
    const numericScore = Number(scoreValue);
    if (!Number.isFinite(numericScore)) return null;
    const safeRecord = ensureGradeRecordHistories(existing);
    const normalizedCriterion = normalizeGradebookCriterion(criterion);
    const criterionMeta = getGradebookCriterionMeta(normalizedCriterion, safeRecord);
    const entries = getAssessmentEntries(safeRecord, normalizedCriterion);
    const targetNumber = Number.isFinite(Number(number)) && Number(number) > 0
        ? normalizeAssessmentNumber(number, 1)
        : (entries.length ? normalizeAssessmentNumber(entries[entries.length - 1].number, 1) + 1 : 1);
    const saveMode = String(options.saveMode || '').trim();
    const isAdditive = saveMode === 'additive';
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber)
        || getAssessmentEntryForNumber(safeRecord, normalizedCriterion, targetNumber);
    const pendingReview = entry
        ? isAssessmentEntryPendingReview(safeRecord, normalizedCriterion, targetNumber)
        : false;
    const existingScore = entry && !pendingReview && entry.score !== null && entry.score !== undefined && entry.score !== ''
        ? Number(entry.score)
        : null;
    const maxScore = Number.isFinite(Number(criterionMeta?.maxScore)) ? Number(criterionMeta.maxScore) : 100;
    let finalScore = numericScore;
    if (isAdditive) {
        finalScore = Math.max(0, Math.min(maxScore, (Number.isFinite(existingScore) ? existingScore : 0) + numericScore));
    } else {
        finalScore = Math.max(0, Math.min(maxScore, numericScore));
    }
    const historyNote = buildGradebookScoreChangeNote(existingScore, finalScore, options.note);
    const updated = setAssessmentScoreOnRecord(safeRecord, normalizedCriterion, targetNumber, finalScore, {
        updatedBy: getSimulatedUserName(),
        note: historyNote,
        historyAction: String(options.historyAction || '').trim() || (Number.isFinite(existingScore) && existingScore !== finalScore ? 'updated' : 'scored')
    });
    if (index >= 0) {
        roster[index] = updated;
    } else {
        roster.push(updated);
    }
    KIU_STATE.studentGrades[rosterId] = roster.map(student => ensureGradeRecordHistories(student));
    return updated;
}

function persistStudentEvaluationEntry(studentId, criterion, number, scoreValue, studentName = '', options = {}) {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save evaluation scores.');
        return;
    }
    const numericScore = Number(scoreValue);
    if (!Number.isFinite(numericScore)) {
        alert('Please enter a score first.');
        return;
    }
    if (isFacultyStandaloneGradebookContext()) {
        const rosterKeys = resolveFacultyGradebookRosterKeysForStudent(studentId);
        if (!rosterKeys.length) {
            alert('Student not in current filter scope.');
            return;
        }
        let lastUpdated = null;
        rosterKeys.forEach(rosterKey => {
            const updated = persistStudentEvaluationEntryOnRoster(
                rosterKey,
                studentId,
                criterion,
                number,
                scoreValue,
                studentName,
                options
            );
            if (updated) lastUpdated = updated;
        });
        if (!lastUpdated) {
            alert('Student record not found.');
            return;
        }
        saveState();
        if (options.skipModal || isStaffModernGradebookContext()) {
            refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: true });
            return;
        }
        return;
    }
    const updated = persistStudentEvaluationEntryOnRoster(currentRosterId, studentId, criterion, number, scoreValue, studentName, options);
    if (!updated) {
        alert('Student record not found.');
        return;
    }
    mockStudents = KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories(student));
    saveState();
    if (options.skipModal || isStaffModernGradebookContext()) {
        refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: true });
        return;
    }
    initGradebook();
    openStudentEvaluationHistoryModal(studentId, studentName || updated.name || '', normalizeGradebookCriterion(criterion));
}

function persistStudentEvaluationCommentOnRoster(rosterKey, studentId, criterion, number, commentText, studentName = '') {
    const rosterId = String(rosterKey || currentRosterId || '').trim();
    if (!rosterId) return null;
    const roster = Array.isArray(KIU_STATE.studentGrades?.[rosterId]) ? KIU_STATE.studentGrades[rosterId] : [];
    const index = roster.findIndex(entry => String(entry.id) === String(studentId));
    const existing = index >= 0 ? roster[index] : null;
    if (!existing) return null;
    const targetNumber = normalizeAssessmentNumber(number, 1);
    const updated = setAssessmentCommentOnRecord(existing, criterion, targetNumber, commentText, {
        updatedBy: getSimulatedUserName()
    });
    if (index >= 0) {
        roster[index] = updated;
    } else {
        roster.push(updated);
    }
    KIU_STATE.studentGrades[rosterId] = roster.map(student => ensureGradeRecordHistories(student));
    return updated;
}

function persistStudentEvaluationComment(studentId, criterion, number, commentText, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save student feedback.');
        return;
    }
    const trimmedComment = String(commentText || '').trim();
    if (!trimmedComment) {
        alert('Write feedback for the student first.');
        return;
    }
    if (isFacultyStandaloneGradebookContext()) {
        const rosterKeys = resolveFacultyGradebookRosterKeysForStudent(studentId);
        if (!rosterKeys.length) {
            alert('Student not in current filter scope.');
            return;
        }
        let lastUpdated = null;
        rosterKeys.forEach(rosterKey => {
            const updated = persistStudentEvaluationCommentOnRoster(
                rosterKey,
                studentId,
                criterion,
                number,
                trimmedComment,
                studentName
            );
            if (updated) lastUpdated = updated;
        });
        if (!lastUpdated) {
            alert('Student record not found.');
            return;
        }
        saveState();
        refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
        closeGradebookCommentModal();
        return;
    }
    const updated = persistStudentEvaluationCommentOnRoster(currentRosterId, studentId, criterion, number, trimmedComment, studentName);
    if (!updated) {
        alert('Student record not found.');
        return;
    }
    mockStudents = KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories(student));
    saveState();
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
    closeGradebookCommentModal();
}

function resolveGradebookCommentEntryNote(studentId, criterion, number) {
    const record = resolveGradebookStudentRecord(studentId, currentRosterId)
        || (mockStudents || []).find(entry => String(entry?.id || '') === String(studentId))
        || null;
    if (!record) return '';
    const safeRecord = ensureGradeRecordHistories(record);
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, criterion, number)
        || getAssessmentEntryForNumber(safeRecord, criterion, number);
    return String(entry?.note || '').trim();
}

function closeGradebookCommentModal() {
    const overlay = document.getElementById('gradebook-comment-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function closeGradebookScoreEditModal() {
    const overlay = document.getElementById('gradebook-score-edit-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function openGradebookCommentModal(studentId, criterion, number, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can leave student feedback.');
        return;
    }
    const existingComment = document.getElementById('gradebook-comment-modal');
    if (existingComment && typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(existingComment, { instant: true });
    } else {
        existingComment?.remove();
    }
    const inputId = `gradebook-comment-${toDomToken(studentId)}-${toDomToken(criterion)}-${normalizeAssessmentNumber(number, 1)}`;
    const currentNote = resolveGradebookCommentEntryNote(studentId, criterion, number);
    const overlay = document.createElement('div');
    overlay.id = 'gradebook-comment-modal';
    overlay.className = 'gb-score-edit-overlay gb-comment-edit-overlay lms-glass-dialog-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeGradebookCommentModal();
    };
    overlay.innerHTML = renderLmsGlassDialogCard({
            hookClass: 'gb-score-edit-card gb-comment-edit-card',
            title: `${getGradebookCriterionMeta(criterion).label} ${normalizeAssessmentNumber(number, 1)}`,
            icon: 'fa-comment-dots',
            subtitle: `${escapeHtml(studentName || studentId)} · visible in the student's grade history.`,
            closeAttr: 'data-gradebook-click="close-gradebook-comment"',
            bodyHtml: `
            <label class="lms-route-field-label gb-score-edit-field">Comment
                <textarea id="${inputId}" class="lms-route-textarea lux-control lms-route-textarea-min-110" placeholder="Explain the score, next steps, or classroom feedback...">${escapeHtml(currentNote)}</textarea>
            </label>`,
            actionsHtml: `
                <button type="button" class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-gradebook-click="close-gradebook-comment">Cancel</button>
                <button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" data-gradebook-click="save-gradebook-comment" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(criterion))}" data-gradebook-number="${escapeHtml(String(normalizeAssessmentNumber(number, 1)))}" data-gradebook-input-id="${escapeHtml(String(inputId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-comment"></i> Save comment</button>`
        });
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
    setTimeout(() => document.getElementById(inputId)?.focus(), 20);
}

function saveGradebookComment(studentId, criterion, number, inputId, studentName = '') {
    const commentText = String(document.getElementById(inputId)?.value || '').trim();
    persistStudentEvaluationComment(studentId, criterion, number, commentText, studentName);
}

function resolveLmsStudentGradebookRecord() {
    const currentUserId = String(getCurrentUserId?.() || window.currentUser?.id || '');
    if (!currentUserId) {
        return document.body.classList.contains('study-card-assessment-open') && window.__studyCardActiveGradeRecord
            ? window.__studyCardActiveGradeRecord
            : null;
    }
    const fromStore = (mockStudents || []).find(student => String(student?.id || '') === currentUserId)
        || resolveGradebookStudentRecord(currentUserId, currentRosterId)
        || null;
    if (fromStore?.id) return fromStore;
    if (document.body.classList.contains('study-card-assessment-open') && window.__studyCardActiveGradeRecord) {
        return window.__studyCardActiveGradeRecord;
    }
    return null;
}

function closeStudentCategoryScoreHistoryModal() {
    const overlay = document.getElementById('gradebook-category-history-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function renderStudentCategoryHistoryCards(record, criterionKeys = [], categoryLabel = '') {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const studentId = String(safeRecord.id || '');
    const studentName = String(safeRecord.name || '');
    const keys = [...new Set((criterionKeys || []).map(key => normalizeGradebookCriterion(key)).filter(Boolean))];
    const attempts = [];
    keys.forEach((criterionKey) => {
        const meta = getGradebookCriterionMeta(criterionKey, safeRecord);
        getDisplayAssessmentEntries(safeRecord, criterionKey).forEach((entry) => {
            const entryNumber = normalizeAssessmentNumber(entry.number, 1);
            const displayMeta = getAssessmentEntryDisplayContext(criterionKey, entry);
            const pendingReview = isAssessmentEntryPendingReview(safeRecord, criterionKey, entryNumber);
            const status = pendingReview
                ? { key: 'pending', label: 'Pending review' }
                : (entry.score === null || entry.score === undefined || entry.score === '')
                    ? { key: 'missing', label: 'Not scored' }
                    : { key: 'graded', label: 'Graded' };
            attempts.push({
                criterionKey,
                meta,
                entry,
                entryNumber,
                displayMeta,
                status
            });
        });
    });
    attempts.sort((left, right) => {
        const leftTime = new Date(left.entry.updatedAt || 0).getTime() || 0;
        const rightTime = new Date(right.entry.updatedAt || 0).getTime() || 0;
        return rightTime - leftTime;
    });
    if (!attempts.length) {
        return `
            <div class="lux-empty-state gb-category-history-empty">
                <i class="fas fa-inbox"></i>
                <strong class="lux-empty-state__title">No scores recorded yet</strong>
                <span class="lux-empty-state__copy">${escapeHtml(categoryLabel || 'This category')} will show attempts, scores, and instructor comments once they are posted.</span>
            </div>
        `;
    }
    return attempts.map(({ criterionKey, meta, entry, entryNumber, displayMeta, status }) => {
        const scoreLabel = status.key === 'pending'
            ? 'Pending'
            : (entry.score === null || entry.score === undefined || entry.score === '' ? '—' : Number(entry.score));
        const note = String(entry.note || '').trim();
        const noteMarkup = note && shouldDisplayGradebookHistoryNote(note)
            ? `<div class="gb-category-history-comment lux-soft-chrome home-hover-chip"><i class="fas fa-comment-dots"></i><div><strong class="lux-section-kicker gb-category-history-comment-kicker">Instructor feedback</strong><p class="lux-panel-copy">${escapeHtml(note)}</p></div></div>`
            : '';
        return `
            <article class="gb-category-history-card lux-soft-chrome home-hover-chip is-${escapeHtml(status.key)}">
                <div class="gb-category-history-card-head">
                    <div>
                        <strong class="lux-card-copy gb-category-history-title">${escapeHtml(displayMeta.title || `${meta.label} ${entryNumber}`)}</strong>
                        <span class="lux-panel-copy gb-category-history-kind">${escapeHtml(meta.label)} ${escapeHtml(String(entryNumber))}</span>
                    </div>
                    <div class="gb-category-history-score">
                        <strong class="lux-page-title gb-category-history-score-value">${escapeHtml(String(scoreLabel))}</strong>
                        <span class="gb-status-badge lux-status-pill home-hover-chip is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>
                    </div>
                </div>
                <div class="gb-category-history-meta lux-panel-copy">
                    ${escapeHtml(formatAssessmentHistoryTimestamp(entry.updatedAt))}${entry.updatedBy ? ` · ${escapeHtml(entry.updatedBy)}` : ''}
                </div>
                ${noteMarkup}
                ${renderGradebookScoreHistoryPanel({
                    record: safeRecord,
                    studentId,
                    studentName,
                    criterion: criterionKey,
                    assessmentNumber: entryNumber,
                    compact: true,
                    readOnlyHistory: true,
                    compactEmpty: true
                })}
            </article>
        `;
    }).join('');
}

function openStudentCategoryScoreHistoryModal(criterionKey, altCriterionKey = '', categoryLabel = '') {
    const record = resolveLmsStudentGradebookRecord();
    if (!record?.id) {
        alert('Student grade record not found.');
        return;
    }
    closeStudentCategoryScoreHistoryModal();
    const normalizedKey = normalizeGradebookCriterion(criterionKey);
    const normalizedAlt = normalizeGradebookCriterion(altCriterionKey || '');
    const criterionKeys = [normalizedKey, normalizedAlt].filter(Boolean);
    const meta = getGradebookCriterionMeta(normalizedKey, record);
    const label = String(categoryLabel || meta.label || meta.pluralLabel || normalizedKey);
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const summary = getGradebookModernSummary(record, scheme, { rosterId: currentRosterId });
    const row = getGradebookSchemeContributionRows(summary, scheme)
        .find(item => normalizeGradebookCriterion(item.criterionKey) === normalizedKey);
    const earnedLabel = row ? `${row.earned.toFixed(1)} earned` : '';
    const pendingLabel = row ? `${row.pending.toFixed(1)} pending` : '';
    const overlay = document.createElement('div');
    overlay.id = 'gradebook-category-history-modal';
    overlay.className = 'gb-category-history-overlay lms-glass-dialog-overlay';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeStudentCategoryScoreHistoryModal();
    };
    overlay.innerHTML = renderLmsGlassDialogCard({
        hookClass: 'gb-category-history-shell',
        bodyClass: 'gb-category-history-body',
        title: label,
        icon: 'fa-clock-rotate-left',
        subtitle: `${escapeHtml(record.name || record.id)}${earnedLabel ? ` · ${escapeHtml(earnedLabel)}` : ''}${pendingLabel ? ` · ${escapeHtml(pendingLabel)}` : ''}`,
        closeAttr: 'data-gradebook-click="close-category-history"',
        bodyHtml: renderStudentCategoryHistoryCards(record, criterionKeys, label)
    });
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

function renderLmsStaffScoreEditorBlock({
    studentId,
    studentName,
    criterionKey,
    assessmentNumber,
    scoreDisplay,
    maxScore,
    status,
    scoreEditLabel,
    scoreEditAttr,
    entryNote = ''
}) {
    const notePreview = entryNote && shouldDisplayGradebookHistoryNote(entryNote)
        ? `<p class="gb-lms-staff-score-note-preview lms-route-copy" title="${escapeHtml(entryNote)}"><i class="fas fa-comment-dots"></i> ${escapeHtml(entryNote)}</p>`
        : '';
    return `
        <div class="gb-lms-staff-score-editor gb-lms-staff-score-editor--focus lux-soft-chrome">
            <div class="gb-lms-staff-score-stat">
                <span class="lms-route-field-label gb-lms-staff-score-stat-label">Assessment score</span>
                <div class="gb-lms-staff-score-stat-value">
                    <strong>${scoreDisplay}</strong>
                    <span class="gb-lms-staff-score-stat-max">/ ${maxScore}</span>
                    <span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>
                </div>
                ${notePreview}
            </div>
            <div class="gb-lms-staff-score-actions">
                <button type="button" class="lux-primary-btn gb-lms-staff-score-cta" data-gradebook-click="open-score-edit" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionKey))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}" data-gradebook-score="${escapeHtml(scoreEditAttr)}" data-gradebook-student-name="${escapeHtml(studentName)}">
                    <i class="fas fa-pen"></i> ${escapeHtml(scoreEditLabel)}
                </button>
                <button type="button" class="lux-secondary-btn gb-modern-action gb-lms-staff-comment-cta" data-gradebook-click="open-gradebook-comment" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionKey))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}" data-gradebook-student-name="${escapeHtml(studentName)}">
                    <i class="fas fa-comment"></i> Comment
                </button>
            </div>
        </div>
    `;
}

function openGradebookScoreEditModal(studentId, criterion, number, currentScore, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors or teaching assistants can save evaluation scores.');
        return;
    }
    const existingScore = document.getElementById('gradebook-score-edit-modal');
    if (existingScore && typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(existingScore, { instant: true });
    } else {
        existingScore?.remove();
    }
    const inputId = `gradebook-score-edit-${toDomToken(studentId)}-${toDomToken(criterion)}-${normalizeAssessmentNumber(number, 1)}`;
    const reasonId = `${inputId}-reason`;
    const hasExistingScore = currentScore !== null && currentScore !== undefined && currentScore !== ''
        && Number.isFinite(Number(currentScore));
    const scoreValue = hasExistingScore ? String(currentScore) : '';
    const overlay = document.createElement('div');
    overlay.id = 'gradebook-score-edit-modal';
    overlay.className = 'gb-score-edit-overlay lms-glass-dialog-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeGradebookScoreEditModal();
    };
    overlay.innerHTML = renderLmsGlassDialogCard({
        hookClass: 'gb-score-edit-card',
        title: `${getGradebookCriterionMeta(criterion).label} ${normalizeAssessmentNumber(number, 1)}`,
        icon: 'fa-pen',
        subtitle: `${escapeHtml(studentName || studentId)} · saved scores stay in history.`,
        closeAttr: 'data-gradebook-click="close-score-edit"',
        bodyHtml: `
            <label class="lms-route-field-label gb-score-edit-field">Score
                <input id="${inputId}" class="lms-route-input lux-control gb-score-edit-score-input" type="number" min="0" max="${Number(getGradebookCriterionMeta(criterion).maxScore || 100)}" value="${escapeHtml(scoreValue)}" placeholder="Enter score" autocomplete="off">
            </label>
            <label class="lms-route-field-label gb-score-edit-field">Comment for student <span class="gb-score-edit-optional lms-route-copy lms-route-meta-12">(optional)</span>
                <textarea id="${reasonId}" class="lms-route-textarea lux-control lms-route-textarea-min-110" placeholder="Explain the score or leave feedback the student can read in their history." autocomplete="off"></textarea>
            </label>`,
        actionsHtml: `
                <button type="button" class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-gradebook-click="close-score-edit">Cancel</button>
                <button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" data-gradebook-click="save-score-edit" data-gradebook-student-id="${escapeHtml(String(studentId))}" data-gradebook-criterion="${escapeHtml(String(criterion))}" data-gradebook-number="${escapeHtml(String(normalizeAssessmentNumber(number, 1)))}" data-gradebook-input-id="${escapeHtml(String(inputId))}" data-gradebook-reason-id="${escapeHtml(String(reasonId))}" data-gradebook-student-name="${escapeHtml(String(studentName || ''))}"><i class="fas fa-save"></i> Save score</button>`
    });
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
    setTimeout(() => document.getElementById(inputId)?.focus(), 20);
}

function saveGradebookScoreEdit(studentId, criterion, number, inputId, reasonId, studentName = '') {
    const numericScore = Number(document.getElementById(inputId)?.value);
    if (!Number.isFinite(numericScore)) {
        alert('Please enter a valid score.');
        return;
    }
    const reason = String(document.getElementById(reasonId)?.value || '').trim();
    persistStudentEvaluationEntry(studentId, criterion, number, numericScore, studentName, {
        skipModal: true,
        note: reason
    });
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: true });
}

function saveStudentEvaluationEntry(studentId, criterion, numberInputId, scoreInputId, studentName = '', saveMode = '') {
    const number = typeof numberInputId === 'number' || String(numberInputId || '').match(/^\d+$/)
        ? normalizeAssessmentNumber(numberInputId, 0)
        : (numberInputId ? normalizeAssessmentNumber(document.getElementById(numberInputId)?.value, 0) : 0);
    const scoreValue = Number(document.getElementById(scoreInputId)?.value);
    persistStudentEvaluationEntry(studentId, criterion, number, scoreValue, studentName, { saveMode });
}

__kiuGbExpose({
    openStudentEvaluationHistoryModal,
    getSimulatedUserName,
    closeStudentEvaluationHistoryModal,
    addGradebookCustomSection,
    addGradebookCustomSectionByLabel,
    createNamedStudentEvaluationAttempt,
    toggleGradebookCustomSectionComposer,
    toggleStudentEvaluationSectionHistory,
    removeGradebookCustomSectionByKey,
    removeStudentEvaluationEntry,
    openGradebookScoreEditModal,
    openGradebookCommentModal,
    saveGradebookComment,
    persistStudentEvaluationComment,
    openStudentCategoryScoreHistoryModal,
    closeStudentCategoryScoreHistoryModal,
    saveGradebookScoreEdit,
    getAssessmentScoreHistoryTimeline,
    renderGradebookScoreHistoryPanel,
    refreshGradebookAfterStaffScoreChange,
    persistStudentEvaluationEntry,
    saveStudentEvaluationEntry,
    getGradebookWeightProfileForRoster,
    getGradebookWeightProfileForSubject,
    getGradebookSchemeForRoster,
    getGradebookSubjectGradingScheme,
    setGradebookSubjectGradingScheme,
    getGradebookGradingSchemeControlsMarkup,
    renderGradebookSchemeReferenceTable,
    getGradebookCategoryMaxForCriterion,
    getGradebookModernSummary,
    renderStudyCardAssessmentActivityFeed,
    resolveGradebookStudentRecord,
    readGradebookGradingSchemeFromDom,
    computeGradebookSchemeBreakdown,
    getGradebookSchemeTotalPoints,
    getGradebookSchemePerItemMax,
    getGradebookSchemeItemCount,
    formatGradebookSchemePerItemMax,
    setGradebookSchemeShellEditing,
    refreshGradebookSchemeShellDerivedValues,
    saveGradebookGradingSchemeFromShell,
    editGradebookGradingSchemeFromElement,
    saveGradebookGradingSchemeFromElement,
});
// getGradebookVisibleOutcome lives in gradebook-staff.js (loads after this file).
__kiuGbExpose({
    getGradebookEffectiveExamScore,
});
function bindStandaloneGradebookShell() {
    if (window['__gradebookShellDelegatesBound'] || __kiuGbApi.__gradebookShellDelegatesBound) return;
    __kiuGbApi.__gradebookShellDelegatesBound = true;
    window['__gradebookShellDelegatesBound'] = true;

    document.addEventListener('click', (event) => {
        const actionButton = event.target.closest('[data-gradebook-click], [data-gradebook-action]');
        if (!actionButton) return;
        const action = String(actionButton.dataset.gradebookClick || actionButton.dataset.gradebookAction || '').trim();
        if (action === 'back') {
            closeGradebookSpreadsheet();
            return;
        }
        if (action === 'save') {
            saveGrades();
            return;
        }
        if (action === 'open-section') {
            openGradebookSection(
                String(actionButton.dataset.gradebookCourseId || ''),
                String(actionButton.dataset.gradebookGroupId || ''),
                String(actionButton.dataset.gradebookTitle || '')
            );
            return;
        }
        if (action === 'open-history') {
            const rosterId = String(actionButton.dataset.gradebookRosterId || '').trim();
            if (rosterId) {
                currentRosterId = rosterId;
            }
            openStudentEvaluationHistoryModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookStudentName || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                actionButton.dataset.gradebookForceViewOnly === 'true',
                rosterId
            );
            return;
        }
        if (action === 'preview-student') {
            previewGradebookStudentAccount(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'lms-gb-select-student') {
            lmsEmbeddedGradebookSelectedStudentId = String(actionButton.dataset.gradebookStudentId || '').trim();
            if (isFacultyStandaloneGradebookContext()) {
                refreshFacultyStaffWorkspace('student');
            } else if (isStaffModernGradebookContext()) {
                initStaffModernGradebook();
            }
            return;
        }
        if (action === 'toggle-score-history') {
            const panel = actionButton.closest('.gb-score-history-panel');
            const more = panel?.querySelector('.gb-score-history-more');
            if (!more) return;
            const expanded = more.hidden;
            more.hidden = !expanded;
            actionButton.textContent = expanded
                ? (actionButton.dataset.gradebookCollapseLabel || 'Show fewer changes')
                : (actionButton.dataset.gradebookExpandLabel || 'Show all changes');
            return;
        }
        if (action === 'pending-queue') {
            openGradebookPendingQueue();
            return;
        }
        if (action === 'export-csv') {
            exportGradebookCsv();
            return;
        }
        if (action === 'publish') {
            markGradebookSectionPublished();
            return;
        }
        if (action === 'finalize') {
            markGradebookSectionFinalized();
            return;
        }
        if (action === 'open-linked-quiz') {
            openStudentQuizPaperFromHistory(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0)
            );
            return;
        }
        if (action === 'open-score-edit') {
            const scoreAttr = actionButton.getAttribute('data-gradebook-score');
            const currentScore = scoreAttr === null || scoreAttr === '' ? null : Number(scoreAttr);
            openGradebookScoreEditModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                currentScore,
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'open-gradebook-comment') {
            openGradebookCommentModal(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'open-category-history') {
            openStudentCategoryScoreHistoryModal(
                String(actionButton.dataset.gradebookCriterion || ''),
                String(actionButton.dataset.gradebookCriterionAlt || ''),
                String(actionButton.dataset.gradebookCategoryLabel || '')
            );
            return;
        }
        if (action === 'save-entry') {
            saveStudentEvaluationEntry(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                actionButton.dataset.gradebookNumber || '',
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookStudentName || ''),
                String(actionButton.dataset.gradebookSaveMode || '')
            );
            return;
        }
        if (action === 'open-subject-weights') {
            openLmsSubjectWeightsModal();
            return;
        }
        if (action === 'close-subject-weights') {
            closeLmsSubjectWeightsModal();
            return;
        }
        if (action === 'edit-grading-scheme') {
            editGradebookGradingSchemeFromElement(actionButton);
            return;
        }
        if (action === 'manage-components') {
            const subjectId = String(actionButton.dataset.gradebookSubjectId || '')
                || resolveGradebookCourseIdForWeights(currentGradebookSection?.courseId);
            openGradebookComponentManager(subjectId);
            return;
        }
        if (action === 'component-manager-add') {
            addGradebookComponentFromManager();
            return;
        }
        if (action === 'component-manager-remove') {
            removeGradebookComponentFromManager(String(actionButton.dataset.gradebookComponentKey || ''));
            return;
        }
        if (action === 'component-manager-apply-profile') {
            applyGradebookComponentProfileFromManager();
            return;
        }
        if (action === 'component-manager-save-profile') {
            saveGradebookComponentProfileFromManager();
            return;
        }
        if (action === 'component-manager-save') {
            commitGradebookComponentManager();
            return;
        }
        if (action === 'component-manager-close') {
            closeGradebookComponentManager();
            return;
        }
        if (action === 'save-grading-scheme') {
            const shell = actionButton.closest('[data-gb-scheme-shell]');
            const inSubjectModal = Boolean(shell?.closest('#lms-subject-weights-modal'));
            const saved = saveGradebookGradingSchemeFromElement(actionButton);
            if (!saved) return;
            const groupCount = getLmsSubjectGroupsForBulkWeights(saved.subjectKey).length;
            if (inSubjectModal) {
                closeLmsSubjectWeightsModal();
            }
            if (isStaffModernGradebookContext()) {
                initStaffModernGradebook();
            } else if (document.getElementById('gradebook-body')) {
                initGradebook();
            }
            alert(`Grading scheme saved for this subject (${saved.courseTotal} points, ${groupCount} group${groupCount === 1 ? '' : 's'}).`);
            return;
        }
        if (action === 'apply-subject-weights') {
            applyLmsSubjectWeightsToSelectedGroups();
            return;
        }
        if (action === 'remove-entry') {
            removeStudentEvaluationEntry(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'toggle-history') {
            toggleStudentEvaluationSectionHistory(String(actionButton.dataset.gradebookHistoryId || ''));
            return;
        }
        if (action === 'remove-custom-section') {
            removeGradebookCustomSectionByKey(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'create-entry') {
            createStudentEvaluationAttempt(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'toggle-custom-composer') {
            toggleGradebookCustomSectionComposer(String(actionButton.dataset.gradebookPanelId || ''));
            return;
        }
        if (action === 'create-named-attempt') {
            createNamedStudentEvaluationAttempt(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterionSelectId || ''),
                String(actionButton.dataset.gradebookTitleInputId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'add-custom-section') {
            addGradebookCustomSection(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'close-history-modal') {
            closeStudentEvaluationHistoryModal();
            return;
        }
        if (action === 'close-score-edit') {
            closeGradebookScoreEditModal();
            return;
        }
        if (action === 'close-gradebook-comment') {
            closeGradebookCommentModal();
            return;
        }
        if (action === 'close-category-history') {
            closeStudentCategoryScoreHistoryModal();
            return;
        }
        if (action === 'save-score-edit') {
            saveGradebookScoreEdit(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookReasonId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
            return;
        }
        if (action === 'save-gradebook-comment') {
            saveGradebookComment(
                String(actionButton.dataset.gradebookStudentId || ''),
                String(actionButton.dataset.gradebookCriterion || ''),
                Number(actionButton.dataset.gradebookNumber || 0),
                String(actionButton.dataset.gradebookInputId || ''),
                String(actionButton.dataset.gradebookStudentName || '')
            );
        }
    });

    document.addEventListener('change', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLSelectElement || target instanceof HTMLInputElement)) return;

        if (target.matches('[data-gradebook-roster-filter]')) {
            if (isFacultyStandaloneGradebookContext()) {
                if (target.id === 'fs-filter-subject') {
                    populateFacultyGradebookGroupFilter();
                }
                loadFacultyGradebookAggregateRoster();
                initStaffModernGradebook();
            } else {
            renderGradebookRosterSelection();
            }
            return;
        }

        if (target.matches('[data-gradebook-assessment-target="criterion"]')) {
            setGradebookAssessmentTarget(target.value, document.getElementById('gradebook-assessment-number')?.value);
            return;
        }

        if (target.matches('[data-gradebook-assessment-target="number"]')) {
            setGradebookAssessmentTarget(document.getElementById('gradebook-criterion-select')?.value, target.value);
            return;
        }
    });

    document.addEventListener('input', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) return;
        if (target.matches('[data-lms-subject-scheme-input], [data-lms-subject-scheme-count]')) {
            const shell = target.closest('[data-gb-scheme-shell]');
            if (shell) refreshGradebookSchemeShellDerivedValues(shell);
            return;
        }
        if (target.matches('[data-gradebook-assessment-target="number"]')) {
            if (gradebookAssessmentNumberInputTimer) {
                clearTimeout(gradebookAssessmentNumberInputTimer);
            }
            gradebookAssessmentNumberInputTimer = setTimeout(() => {
                gradebookAssessmentNumberInputTimer = null;
                setGradebookAssessmentTarget(
                    document.getElementById('gradebook-criterion-select')?.value,
                    target.value
                );
            }, 250);
            return;
        }
        if (!target.matches('[data-lms-gb-roster-filter]')) return;
        lmsEmbeddedGradebookRosterFilter = String(target.value || '');
        if (isFacultyStandaloneGradebookContext()) {
            refreshFacultyStaffWorkspace('roster');
        } else if (isStaffModernGradebookContext()) {
            initStaffModernGradebook();
        }
    });
}
__kiuGbExpose({
    bindStandaloneGradebookShell,
    closeGradebookSpreadsheet,
    resolveGradebookSpreadsheetShell,
});
if (typeof window.openStudentQuizPaperFromHistory !== 'function') {
    __kiuGbExpose({
        openStudentQuizPaperFromHistory: function (...args) {
            if (typeof window.openStudentQuizPaperFromHistoryImpl === 'function') {
                return window.openStudentQuizPaperFromHistoryImpl(...args);
            }
            console.warn('Student quiz paper history is not ready yet.');
            return null;
        }
    });
}
function renderStaffCreateActionsPanel({
    record,
    displayName,
    evaluationDefs,
    namedAttemptCriterionId,
    namedAttemptTitleId
}) {
    const studentId = String(record?.id || '');
    const sectionOptions = (evaluationDefs || []).map(meta => `<option value="${escapeHtml(meta.key)}">${escapeHtml(meta.label)}</option>`).join('');

    if (isFacultyStandaloneGradebookContext()) {
        return `
            <div class="gb-staff-create-panel">
                <div class="gb-staff-create-card gb-staff-create-card--faculty lms-route-panel lms-route-panel-compact lux-soft-chrome">
                    <div class="gb-staff-create-toolbar">
                        <div class="gb-staff-create-toolbar-copy">
                            <div class="lms-route-field-label gb-modern-kicker">Staff Actions</div>
                            <h3 class="lms-route-card-title">Add manual attempt</h3>
                            <p class="lms-route-copy">Paper quizzes, oral exams, midterms, finals, retakes, or other manual assessments.</p>
                        </div>
                    </div>
                    <div class="gb-staff-create-form">
                        <label class="lms-route-field-label gb-staff-create-field" id="${escapeHtml(String(namedAttemptCriterionId))}-field-label">Section
                            <select id="${escapeHtml(String(namedAttemptCriterionId))}" class="lms-route-select lux-control lux-modern-field" data-lux-picker-label="Section" autocomplete="off">
                                ${sectionOptions}
                            </select>
                        </label>
                        <label class="lms-route-field-label gb-staff-create-field gb-staff-create-field--grow">Assessment name
                            <input id="${escapeHtml(String(namedAttemptTitleId))}" type="text" class="lms-route-input lux-control lux-modern-field" placeholder="e.g. Paper Quiz - Week 6, Oral Exam 2, Midterm Part B" autocomplete="off">
                        </label>
                        <button type="button" class="lux-primary-btn gb-staff-create-submit" data-gradebook-click="create-named-attempt" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion-select-id="${escapeHtml(String(namedAttemptCriterionId))}" data-gradebook-title-input-id="${escapeHtml(String(namedAttemptTitleId))}" data-gradebook-student-name="${escapeHtml(String(displayName))}"><i class="fas fa-plus"></i> Create</button>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="gb-staff-create-panel">
            <div class="gb-staff-create-card lms-route-panel lms-route-panel-compact lux-soft-chrome">
                <div class="gb-modern-card-head">
                    <div>
                        <div class="lms-route-field-label gb-modern-kicker">Staff Actions</div>
                        <h3 class="lms-route-card-title">Create named paper/manual attempt</h3>
                        <p class="lms-route-copy">Use this for paper quizzes, oral quizzes, midterms, finals, retakes, or manual classroom assessments.</p>
                    </div>
                </div>
                <div class="gb-staff-create-grid">
                    <label class="lms-route-field-label gb-staff-create-field">Section
                        <select id="${escapeHtml(String(namedAttemptCriterionId))}" class="lms-route-select lux-control" autocomplete="off">
                            ${sectionOptions}
                        </select>
                    </label>
                    <label class="lms-route-field-label gb-staff-create-field">Assessment name
                        <input id="${escapeHtml(String(namedAttemptTitleId))}" type="text" class="lms-route-input lux-control" placeholder="e.g. Paper Quiz - Week 6, Oral Exam 2, Midterm Part B" autocomplete="off">
                    </label>
                    <button type="button" class="lux-primary-btn gb-modern-action" data-gradebook-click="create-named-attempt" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion-select-id="${escapeHtml(String(namedAttemptCriterionId))}" data-gradebook-title-input-id="${escapeHtml(String(namedAttemptTitleId))}" data-gradebook-student-name="${escapeHtml(String(displayName))}"><i class="fas fa-plus"></i> Create</button>
                </div>
            </div>
        </div>
    `;
}

function openStudentEvaluationHistoryModal(studentId, studentName = '', focusSectionKey = '', forceViewOnly = false, rosterId = '') {
    const resolvedRosterId = String(rosterId || currentRosterId || '').trim();
    if (resolvedRosterId) {
        currentRosterId = resolvedRosterId;
    }
    const rosterSource = resolveGradebookStudentRecord(studentId, resolvedRosterId)
        || { id: studentId, name: studentName || studentId };
    const record = syncGradeRecordSummaries(ensureGradeRecordHistories(rosterSource));
    const displayName = record.name || studentName || record.id;
    const scheme = getGradebookSchemeForRoster(resolvedRosterId);
    const modalSummary = getGradebookModernSummary(record, scheme, { rosterId: resolvedRosterId });
    const canEdit = !forceViewOnly && [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole());
    const namedAttemptCriterionId = `gradebook-named-attempt-type-${toDomToken(record.id)}`;
    const namedAttemptTitleId = `gradebook-named-attempt-title-${toDomToken(record.id)}`;
    const evaluationDefs = getStudentEvaluationHistorySectionDefs(record, resolvedRosterId);
    const focusKey = normalizeGradebookCriterion(focusSectionKey || '');
    const focusMeta = focusKey ? evaluationDefs.find(meta => normalizeGradebookCriterion(meta.key) === focusKey) : null;

    const summaryCards = modalSummary.sections.map(section => {
        const latest = section.latestEntry ? getAssessmentEntryDisplayContext(section.meta.key, section.latestEntry) : null;
        const status = getGradebookEntryStatus(modalSummary.record, section.meta, section.latestEntry);
        const isActiveCategory = focusKey && normalizeGradebookCriterion(section.meta.key) === focusKey;
        const scoreText = status.key === 'pending' ? 'Pending' : Number(section.aggregate || 0);
        return `
        <button type="button" class="gb-modal-category-card lux-soft-chrome ${isActiveCategory ? 'is-active' : ''}" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(displayName))}" data-gradebook-criterion="${escapeHtml(String(section.meta.key))}"${forceViewOnly ? ' data-gradebook-force-view-only="true"' : ''}${resolvedRosterId ? ` data-gradebook-roster-id="${escapeHtml(resolvedRosterId)}"` : ''}>
            <div class="gb-modal-category-top">
                <span class="lms-route-field-label gb-modal-category-label">${escapeHtml(section.meta.pluralLabel || section.meta.label)}</span>
                <span class="gb-status-badge lux-status-pill is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span>
            </div>
            <div class="gb-modal-category-body">
                <strong class="gb-modal-category-score">${escapeHtml(String(scoreText))}</strong>
                <div class="gb-modal-category-stats">
                    <small class="lms-route-copy lms-route-meta-12">${section.scoredEntries.length} graded</small>
                    <small class="lms-route-copy lms-route-meta-12">${section.pendingEntries.length} pending</small>
                </div>
            </div>
            <small class="gb-modal-category-footnote">${section.scoredEntries.length} graded · ${section.pendingEntries.length} pending</small>
            <div class="gb-modal-category-latest">
                <span class="lms-route-copy lms-route-meta-12">${latest ? escapeHtml(latest.title) : 'No activity yet'}</span>
            </div>
        </button>
    `;
    }).join('');

    // ponytail: patch the open modal in place instead of full rebuild — a rebuild
    // flickers and destroys the lux picker enhancement (picker dies after one click).
    const existing = document.getElementById('student-evaluation-history-modal');
    if (existing && existing.dataset.gbStudentId === String(record.id)) {
        existing.querySelectorAll('.gb-modal-category-card').forEach(card => {
            const key = normalizeGradebookCriterion(card.dataset.gradebookCriterion || '');
            card.classList.toggle('is-active', Boolean(focusKey) && key === focusKey);
        });
        const grid = existing.querySelector('.gb-modal-category-grid');
        if (grid) grid.classList.toggle('is-filtered', Boolean(focusMeta));
        const kicker = existing.querySelector('.gb-modal-hero .gb-modern-kicker');
        if (kicker) kicker.textContent = focusMeta ? (focusMeta.pluralLabel || focusMeta.label) : 'Full Evaluation History';
        const historyGrid = existing.querySelector('.gb-modal-history-grid');
        if (historyGrid) historyGrid.innerHTML = renderStudentEvaluationHistorySectionsV3(record, record.id, displayName, focusSectionKey, canEdit);
        return;
    }
    if (existing) {
        if (typeof window.closeLuxGlassDialogOverlay === 'function') {
            window.closeLuxGlassDialogOverlay(existing, { instant: true });
        } else {
            existing.remove();
        }
    }

    const overlay = document.createElement('div');
    overlay.id = 'student-evaluation-history-modal';
    overlay.dataset.gbStudentId = String(record.id);
    overlay.className = 'gb-modal-overlay lms-glass-dialog-overlay';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeStudentEvaluationHistoryModal();
    };

    overlay.innerHTML = renderLmsGlassDialogCard({
        hookClass: 'gb-modal-shell',
        bodyClass: 'gb-modal-body',
        title: displayName,
        icon: 'fa-chart-line',
        subtitle: `Student ID: ${escapeHtml(record.id)} · ${canEdit ? 'TA / Professor review workspace' : 'Read-only student record'}`,
        headExtra: `<div class="gb-modal-score"><strong class="lms-route-title lms-route-title-26 gb-modal-score-value">${escapeHtml(modalSummary.outcome.scoreLabel)}</strong><span class="lms-route-copy lms-route-meta-12">${escapeHtml(modalSummary.outcome.letterLabel)}</span></div>`,
        closeAttr: 'data-gradebook-click="close-history-modal"',
        bodyHtml: `
                <div class="gb-modal-category-grid ${focusMeta ? 'is-filtered' : ''}">
                    ${summaryCards}
                </div>
                ${canEdit ? renderStaffCreateActionsPanel({
                    record,
                    displayName,
                    evaluationDefs: modalSummary.sections.map(section => section.meta),
                    namedAttemptCriterionId,
                    namedAttemptTitleId
                }) : ''}
                <div class="gb-modal-history-grid">
                    ${renderStudentEvaluationHistorySectionsV3(record, record.id, displayName, focusSectionKey, canEdit)}
                </div>`
    });
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

function renderGradebookRosterSelection() {
    const container = document.getElementById('gradebook-roster-selection');
    if (!container) return;

    const currentUser = getCurrentUser();
    const groups = getGradebookGroupsForCurrentUser();
    const overviewRosters = document.getElementById('faculty-overview-rosters');
    const overviewEdited = document.getElementById('faculty-overview-edited');
    const overviewSaved = document.getElementById('faculty-overview-saved');
    const stageStatus = document.getElementById('faculty-stage-status');
    if (overviewRosters) {
        overviewRosters.innerHTML = `<i class="fas fa-book"></i> ${groups.length} roster${groups.length === 1 ? '' : 's'}`;
    }
    if (overviewEdited) {
        overviewEdited.innerHTML = '<i class="fas fa-pen-to-square"></i> 0 grades edited';
    }
    if (overviewSaved) {
        overviewSaved.innerHTML = '<i class="fas fa-check"></i> Ready to save';
    }
    if (stageStatus) {
        stageStatus.textContent = groups.length ? 'Roster view active' : 'No rosters available';
    }
    const title = currentUser?.role === USER_ROLES.ADMIN ? 'Faculty Gradebook Rosters' : 'My Active Rosters';
    const subtitle = currentUser?.role === USER_ROLES.ADMIN
        ? 'Faculty-scoped sections available for review and intervention.'
        : 'Choose one of your assigned teaching groups to review grades.';

    if (!groups.length) {
        container.innerHTML = `
            <div class="gb-roster-hero">
                <div class="gb-roster-eyebrow">Gradebook</div>
                <div class="gb-roster-hero-title"><i class="fas fa-chalkboard-teacher"></i> ${title}</div>
                <div class="gb-roster-hero-copy">${subtitle}</div>
            </div>
            ${typeof renderLmsRouteEmptyState === 'function'
                ? renderLmsRouteEmptyState('No Rosters Available', 'No gradebook groups are available for the current session.', 'fa-inbox')
                : `<div class="lms-route-empty"><div class="lms-route-empty-title">No Rosters Available</div><div class="lms-route-empty-copy">No gradebook groups are available for the current session.</div></div>`}
        `;
        return;
    }

    const cards = groups.map(group => `
        <div class="course-card lms-route-card lms-route-panel-compact home-hover-chip gb-roster-card" data-gradebook-click="open-section" data-gradebook-course-id="${escapeHtml(String(group.courseId))}" data-gradebook-group-id="${escapeHtml(String(group.groupId))}" data-gradebook-title="${escapeHtml(`${group.subjectName} | ${group.groupName} | ${String(group.day || '').trim()} ${String(group.time || '').trim()}`)}">
            <div class="gb-roster-card-hero">
                <div class="gb-roster-card-head">
                    <div>
                        <div class="gb-roster-eyebrow">${escapeHtml(group.groupName)}</div>
                        <div class="gb-roster-card-title">${escapeHtml(group.subjectName)}</div>
                    </div>
                    <span class="lux-pill gb-roster-count-pill"><i class="fas fa-users"></i> ${group.enrolledCount} students</span>
                </div>
            </div>
            <div class="gb-roster-card-body">
                <div class="gb-roster-kv-grid">
                    <div class="lms-route-kv gb-roster-kv">
                        <div class="gb-roster-kv-label">Schedule</div>
                        <div class="gb-roster-kv-value">${escapeHtml(`${group.day || 'TBD'} ${group.time || ''}`.trim())}</div>
                    </div>
                    <div class="lms-route-kv gb-roster-kv">
                        <div class="gb-roster-kv-label">Room</div>
                        <div class="gb-roster-kv-value">${escapeHtml(group.room || 'TBD')}</div>
                    </div>
                    <div class="lms-route-kv gb-roster-kv">
                        <div class="gb-roster-kv-label">Semester</div>
                        <div class="gb-roster-kv-value">${escapeHtml(group.semester || KIU_STATE.activeSemester || 1)}</div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    container.innerHTML = `
        <div class="gb-roster-hero">
            <div class="gb-roster-eyebrow">Gradebook</div>
            <div class="gb-roster-hero-title"><i class="fas fa-chalkboard-teacher"></i> ${title}</div>
            <div class="gb-roster-hero-copy">${subtitle}</div>
        </div>
        <div class="gb-roster-card-grid">
            ${cards}
        </div>
    `;
}

function renderGradebookLoadFallback(message = 'This roster currently has no resolved grade rows.') {
    const controlsRoot = document.getElementById('gradebook-assessment-controls');
    const studentViewRoot = document.getElementById('gradebook-student-view');
    const theadRow = document.querySelector('#gradebook-table thead tr');
    const tbody = document.getElementById('gradebook-body');
    const table = document.getElementById('gradebook-table');

    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        setGradebookShellVisibility(studentViewRoot, false);
    }
    setGradebookShellVisibility(table, true, 'table');
    if (controlsRoot) {
        controlsRoot.innerHTML = `
            <div class="lms-route-empty gb-sheet-empty">
                <div class="lms-route-empty-title">Grade rows unavailable</div>
                <div class="lms-route-empty-copy">${escapeHtml(message)}</div>
                <div class="lms-route-empty-actions">
                    <button type="button" class="lux-secondary-btn" data-gradebook-action="back"><i class="fas fa-arrow-left"></i> Back to Rosters</button>
                </div>
            </div>
        `;
    }
    if (theadRow) {
        theadRow.innerHTML = `
            <th class="gb-roster-head-cell gb-roster-head-cell--left">Student ID</th>
            <th class="gb-roster-head-cell gb-roster-head-cell--left">Student Name</th>
            <th>Overall Score</th>
            <th>Letter Grade</th>
            <th>Quiz Status</th>
            <th class="gb-roster-head-cell gb-roster-head-cell--left">History</th>
        `;
    }
    if (tbody) {
        tbody.innerHTML = `
            <tr class="gb-roster-empty-row">
                <td colspan="6">
                    <div class="lms-route-empty gb-sheet-empty">
                        <div class="lms-route-empty-title">No student records resolved</div>
                        <div class="lms-route-empty-copy">${escapeHtml(message)}</div>
                    </div>
                </td>
            </tr>
        `;
        syncGradebookVisualCustomProperties(tbody);
    }
    const warn = document.getElementById('weight-total-warning');
    if (warn) {
        warn.innerText = 'Total: 100%';
        warn.classList.remove('is-warning');
        warn.classList.add('is-balanced');
    }
}

function loadGroupStudents(groupId, courseId = null) {
    try {
        if (courseId) {
            const gradebookState = buildGradebookStudents(courseId, groupId);
            currentRosterId = gradebookState.rosterKey;
            mockStudents = gradebookState.students.map(student => ensureGradeRecordHistories(student));
            if (!KIU_STATE.studentGrades[currentRosterId]) {
                KIU_STATE.studentGrades[currentRosterId] = JSON.parse(JSON.stringify(mockStudents));
            }
        } else {
            if (!KIU_STATE.studentGrades[groupId]) {
                groupId = 'default_g1';
            }
            currentRosterId = groupId;
            mockStudents = JSON.parse(JSON.stringify(KIU_STATE.studentGrades[currentRosterId] || []))
                .map(student => ensureGradeRecordHistories(student));
        }
        if (document.getElementById('gradebook-body')) {
            initGradebook();
        }
    } catch (error) {
        console.warn('Could not load gradebook roster.', error);
        currentRosterId = String(courseId || groupId || currentRosterId || 'default-roster').trim() || 'default-roster';
        mockStudents = [];
        renderGradebookLoadFallback('The roster data could not be resolved. Please return to the roster list and try a different section.');
    }
}

function getGradebookSpreadsheetShellMarkup() {
    return `
        <div id="gradebook-spreadsheet-view">
            <div class="gb-sheet-head">
                <div class="gb-sheet-title" id="dynamic-gb-title">Open a roster to begin</div>
                <div class="gb-sheet-copy">Select a criterion, enter the assessment number, and use the table to update grades or inspect history.</div>
            </div>

            <div class="gb-sheet-scheme-slot" id="gradebook-sheet-scheme-controls">
                <div class="gb-sheet-copy">Grading scheme loads when a roster is opened.</div>
            </div>

            <div id="gradebook-assessment-controls" class="gb-sheet-controls"></div>

            <div class="gb-sheet-layout">
                <div class="gb-sheet-table-shell">
                    <div class="gb-sheet-table-scroll">
                        <table id="gradebook-table">
                            <thead><tr></tr></thead>
                            <tbody id="gradebook-body"></tbody>
                        </table>
                    </div>
                </div>
                <aside class="gb-sheet-audit">
                    <div class="gb-sheet-audit-head"><i class="fas fa-clock"></i> Audit Trail</div>
                    <div id="audit-logs" class="gb-sheet-audit-list"><div class="gb-sheet-audit-empty"><i class="fas fa-pen-to-square"></i><span>No edits yet.</span></div></div>
                </aside>
            </div>
        </div>
    `;
}

function ensureGradebookSpreadsheetShell() {
    const mount = document.getElementById('lux-spreadsheet-view');
    if (!mount) return null;
    let shell = document.getElementById('gradebook-spreadsheet-view');
    if (shell) return shell;
    mount.innerHTML = getGradebookSpreadsheetShellMarkup();
    shell = document.getElementById('gradebook-spreadsheet-view');
    return shell;
}

function resolveGradebookSpreadsheetShell() {
    const luxShell = ensureGradebookSpreadsheetShell();
    if (luxShell) return luxShell;
    if (typeof ensureLmsGradebookShell === 'function') {
        ensureLmsGradebookShell();
    }
    return document.getElementById('gradebook-spreadsheet-view');
}

function setGradebookShellVisibility(element, shown) {
    if (!element) return;
    element.hidden = !shown;
}

function openGradebookSection(courseId, groupId, titleString = '') {
    currentGradebookSection = { courseId, groupId };
    setGradebookShellVisibility(document.getElementById('lux-roster-view'), false);
    setGradebookShellVisibility(document.getElementById('gradebook-roster-selection'), false);
    const spreadsheetShell = resolveGradebookSpreadsheetShell();
    const luxSpreadsheetView = document.getElementById('lux-spreadsheet-view');
    if (luxSpreadsheetView) setGradebookShellVisibility(luxSpreadsheetView, true);
    if (spreadsheetShell) setGradebookShellVisibility(spreadsheetShell, true);
    setGradebookShellVisibility(document.getElementById('faculty-back-btn'), true, 'inline-flex');
    setGradebookShellVisibility(document.getElementById('faculty-save-btn'), true, 'inline-flex');
    const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
    const group = (KIU_STATE.availableGroups?.[courseId] || []).find(item => item.id === groupId) || {};
    document.getElementById('dynamic-gb-title').innerText = titleString || `${subject?.name || courseId} | ${group.name || groupId} | ${group.day || ''} ${group.time || ''}`;
    loadGroupStudents(groupId, courseId);
}

const KIU_GRADEBOOK_STAFF_RETURN_KEY = 'KIU_GRADEBOOK_STAFF_RETURN';

function persistGradebookStaffReturnContext() {
    const staffRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || '');
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(staffRole)) return false;
    const activeUserId = typeof getCurrentUserId === 'function'
        ? getCurrentUserId()
        : (KIU_STATE?.auth?.activeUserId || currentUser?.id || '');
    try {
        sessionStorage.setItem(KIU_GRADEBOOK_STAFF_RETURN_KEY, JSON.stringify({
            staffRole,
            activeUserId: String(activeUserId || ''),
            returnUrl: `faculty-gradebook.html${window.location.search || ''}${window.location.hash || ''}`,
            savedAt: Date.now()
        }));
        return true;
    } catch (error) {
        console.warn('Could not persist gradebook staff return context.', error);
        return false;
    }
}

function restoreGradebookStaffReturnContextIfNeeded() {
    if (!isFacultyStandaloneGradebookContext()) return false;
    let raw = '';
    try {
        raw = sessionStorage.getItem(KIU_GRADEBOOK_STAFF_RETURN_KEY) || '';
    } catch (error) {
        return false;
    }
    if (!raw) return false;
    let context = null;
    try {
        context = JSON.parse(raw);
    } catch (error) {
        try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
        return false;
    }
    const staffRole = String(context?.staffRole || '').trim().toLowerCase();
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(staffRole)) {
        try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
        return false;
    }
    const currentRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || '');
    if (currentRole === staffRole) {
        try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
        return false;
    }
    try {
        currentUserRole = staffRole;
        localStorage.setItem('currentUserRole', staffRole);
        if (currentUser?.role === USER_ROLES.ADMIN && staffRole !== USER_ROLES.ADMIN) {
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        } else {
            sessionStorage.removeItem(ACTIVE_ROLE_IMPERSONATION_KEY);
        }
    } catch (error) {
        console.warn('Could not restore gradebook staff role.', error);
    }
    if (context.activeUserId && typeof setActiveSessionUser === 'function') {
        setActiveSessionUser(context.activeUserId);
    } else if (typeof setActiveSessionUserByRole === 'function') {
        setActiveSessionUserByRole(staffRole);
    }
    if (typeof syncPortalBackendImpersonation === 'function') {
        syncPortalBackendImpersonation(staffRole);
    }
    if (typeof resetRoleSwitchViewState === 'function') {
        resetRoleSwitchViewState();
    }
    if (typeof refreshShellIdentity === 'function') {
        refreshShellIdentity();
    }
    try { sessionStorage.removeItem(KIU_GRADEBOOK_STAFF_RETURN_KEY); } catch (e) {}
    return true;
}

__kiuGbExpose({
    persistGradebookStaffReturnContext,
    restoreGradebookStaffReturnContextIfNeeded,
});

function previewGradebookStudentAccount(studentId, studentName = '') {
    if (![USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(getEffectiveUserRole())) {
        alert('Only staff can open student impersonation from gradebook.');
        return;
    }
    persistGradebookStaffReturnContext();
    const targetUser = (KIU_STATE?.users || []).find(user => String(user?.id || '') === String(studentId)) || null;
    if (!targetUser?.id || String(targetUser.role || '') !== USER_ROLES.STUDENT) {
        alert('A real student account is required for student impersonation.');
        return;
    }
    try {
        currentUserRole = USER_ROLES.STUDENT;
        localStorage.setItem('currentUserRole', USER_ROLES.STUDENT);
        if (currentUser?.role && currentUser.role !== USER_ROLES.STUDENT) {
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        }
    } catch (e) {
        console.warn('Could not persist gradebook student impersonation.', e);
    }
    if (typeof setActiveSessionUser === 'function') {
        setActiveSessionUser(targetUser.id);
    }
    if ((targetUser.facultyCode || targetUser.faculty) && typeof localStorage !== 'undefined') {
        localStorage.setItem('currentFaculty', targetUser.facultyCode || targetUser.faculty);
    }
    if (typeof syncPortalBackendImpersonation === 'function') {
        syncPortalBackendImpersonation(USER_ROLES.STUDENT);
    }
    if (typeof resetRoleSwitchViewState === 'function') {
        resetRoleSwitchViewState();
    }
    if (currentGradebookSection?.courseId && currentGradebookSection?.groupId && typeof navigate === 'function') {
        const subject = getDomain().subjectsById?.[currentGradebookSection.courseId] || (KIU_STATE.curriculum || []).find(item => item.id === currentGradebookSection.courseId) || null;
        const group = (KIU_STATE.availableGroups?.[currentGradebookSection.courseId] || []).find(item => item.id === currentGradebookSection.groupId) || null;
        const courseKey = `${currentGradebookSection.courseId}::${currentGradebookSection.groupId}`;
        const title = [subject?.name || currentGradebookSection.courseId, group?.name || currentGradebookSection.groupId].filter(Boolean).join(' | ');
        const openLmsGradebookPreview = () => {
            navigate('lms');
            setTimeout(() => {
                openLMSCourse(courseKey, title);
                switchLMSTab('quiz');
            }, 180);
        };
        if (typeof openLMSCourse === 'function' && typeof switchLMSTab === 'function') {
            openLmsGradebookPreview();
            return;
        }
        if (typeof ensurePortalLmsRuntimeLoaded === 'function') {
            Promise.resolve(ensurePortalLmsRuntimeLoaded()).then((loaded) => {
                if (loaded && typeof openLMSCourse === 'function' && typeof switchLMSTab === 'function') {
                    openLmsGradebookPreview();
                    return;
                }
                navigate('profile');
            });
            return;
        }
    }
    if (typeof navigate === 'function') {
        navigate('profile');
    }
}

__kiuGbExpose({
    previewGradebookStudentAccount,
});

function openGradebookForGroup(groupId, titleString) {
    setGradebookShellVisibility(document.getElementById('lux-roster-view'), false);
    setGradebookShellVisibility(document.getElementById('gradebook-roster-selection'), false);
    const spreadsheetShell = resolveGradebookSpreadsheetShell();
    const luxSpreadsheetView = document.getElementById('lux-spreadsheet-view');
    if (luxSpreadsheetView) setGradebookShellVisibility(luxSpreadsheetView, true);
    if (spreadsheetShell) setGradebookShellVisibility(spreadsheetShell, true);
    setGradebookShellVisibility(document.getElementById('faculty-back-btn'), true, 'inline-flex');
    setGradebookShellVisibility(document.getElementById('faculty-save-btn'), true, 'inline-flex');
    document.getElementById('dynamic-gb-title').innerText = titleString;
    loadGroupStudents(groupId);
}

function closeGradebookSpreadsheet() {
    const spreadsheetShell = resolveGradebookSpreadsheetShell();
    if (spreadsheetShell) setGradebookShellVisibility(spreadsheetShell, false);
    setGradebookShellVisibility(document.getElementById('lux-spreadsheet-view'), false);
    setGradebookShellVisibility(document.getElementById('lux-roster-view'), true);
    setGradebookShellVisibility(document.getElementById('gradebook-roster-selection'), true, 'block');
    setGradebookShellVisibility(document.getElementById('faculty-back-btn'), false);
    setGradebookShellVisibility(document.getElementById('faculty-save-btn'), false);
    if (typeof renderGradebookRosterSelection === 'function') {
        renderGradebookRosterSelection();
    }
}

function getGradebookLetterBadgeClass(letter = '') {
    const normalized = String(letter || '').trim().toUpperCase();
    if (normalized.startsWith('A')) return 'grade-a';
    if (normalized.startsWith('B')) return 'grade-b';
    if (normalized.startsWith('C')) return 'grade-c';
    if (normalized.startsWith('D') || normalized.startsWith('E')) return 'grade-d';
    if (normalized === 'PENDING' || normalized === 'INCOMPLETE') return 'grade-pending';
    return 'grade-f';
}

function renderGradebookLetterBadge(letter = 'Pending', label = '') {
    const display = String(letter || 'Pending').trim();
    return `<span class="gb-letter-badge ${getGradebookLetterBadgeClass(display)}" title="${escapeHtml(label || display)}">${escapeHtml(display.length > 2 ? display : display.charAt(0) || display)}</span>`;
}

function getGradebookEntryStatus(record, meta, entry) {
    if (!entry) {
        return {
            key: 'missing',
            label: 'Not recorded',
            icon: 'fa-circle-minus'
        };
    }
    const pending = isAssessmentEntryPendingReview(record, meta.key, normalizeAssessmentNumber(entry.number, 1));
    if (pending) {
        return {
            key: 'pending',
            label: 'Pending review',
            icon: 'fa-hourglass-half'
        };
    }
    const hasScore = entry.score !== null && entry.score !== undefined && entry.score !== '';
    if (hasScore) {
        return {
            key: 'graded',
            label: 'Graded',
            icon: 'fa-circle-check'
        };
    }
    return {
        key: 'missing',
        label: 'Not recorded',
        icon: 'fa-circle-minus'
    };
}

function getGradebookModernSummary(record, schemeOrWeights, options = {}) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const rosterId = String(options.rosterId || currentRosterId || '').trim();
    return withGradebookComponents(getGradebookSubjectComponents(gradebookSubjectIdFromRoster(rosterId)), () => {
    const scheme = schemeOrWeights?.quiz !== undefined
        ? normalizeGradebookGradingScheme(schemeOrWeights)
        : getGradebookSchemeForRoster(rosterId);
    // Drive sections off the subject's active components so newly-added components
    // surface as cards/rows even before any grade is recorded. Order follows the
    // component list; retake keeps its own section when it is final's alternate.
    const activeComponents = getActiveGradebookSchemeComponents();
    const sectionKeys = activeComponents.map(component => normalizeGradebookCriterion(component.criterionKey || component.schemeKey));
    if (activeComponents.some(component => component.altCriterionKey === 'retake') && !sectionKeys.includes('retake')) {
        sectionKeys.push('retake');
    }
    const defs = sectionKeys.map(key => ({ key }));
    const sections = defs.map(meta => {
        const criterionMeta = getGradebookCriterionMeta(meta.key, safeRecord, rosterId);
        const entries = getDisplayAssessmentEntries(safeRecord, criterionMeta.key);
        const scoredEntries = entries.filter(entry => entry?.score !== null && entry?.score !== undefined && entry?.score !== '');
        const pendingEntries = entries.filter(entry => isAssessmentEntryPendingReview(safeRecord, criterionMeta.key, normalizeAssessmentNumber(entry.number, 1)));
        const latestEntry = entries.length ? entries[entries.length - 1] : null;
        const aggregate = getAssessmentDisplayValue(safeRecord, criterionMeta);
        const categoryMax = getGradebookCategoryMaxForCriterion(criterionMeta.key, scheme, rosterId);
        return {
            meta: criterionMeta,
            entries,
            scoredEntries,
            pendingEntries,
            latestEntry,
            aggregate,
            categoryMax,
            maxScore: Math.max(1, Number(categoryMax || criterionMeta.maxScore || 100))
        };
    });
    const resolveVisibleOutcome = (typeof window !== 'undefined' && typeof window.getGradebookVisibleOutcome === 'function')
        ? window.getGradebookVisibleOutcome
        : (typeof getGradebookVisibleOutcome === 'function' ? getGradebookVisibleOutcome : null);
    const outcome = resolveVisibleOutcome
        ? resolveVisibleOutcome(safeRecord, scheme)
        : { scoreLabel: '—', letterLabel: '—', letterStored: '—' };
    const completedCount = sections.reduce((sum, section) => sum + section.scoredEntries.length, 0);
    const pendingCount = sections.reduce((sum, section) => sum + section.pendingEntries.length, 0);
    const totalEntries = sections.reduce((sum, section) => sum + section.entries.length, 0);
    const missingCore = sections.filter(section => !section.entries.length).length;
    return {
        record: safeRecord,
        sections,
        scheme,
        rosterId,
        outcome,
        completedCount,
        pendingCount,
        totalEntries,
        missingCore,
        progressPercent: Math.max(0, Math.min(100, Number(outcome.scoreLabel) || 0))
    };
    });
}

function getGradebookSchemeRows(scheme = {}) {
    const normalized = normalizeGradebookGradingScheme(scheme);
    const total = getGradebookSchemeTotalPoints(normalized) || 1;
    return getActiveGradebookSchemeComponents().map(component => ({
        key: component.schemeKey,
        label: component.label,
        value: Number(normalized[component.schemeKey] || 0) / total,
        maxPoints: Number(normalized[component.schemeKey] || 0),
        color: component.color
    }));
}

function getGradebookSchemeContributionRows(summary, scheme = {}) {
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const breakdown = computeGradebookSchemeBreakdown(summary?.record || {}, normalizedScheme);
    const sectionByKey = new Map((summary?.sections || []).map(section => [normalizeGradebookCriterion(section.meta.key), section]));
    return breakdown.components.map(component => {
        const primary = sectionByKey.get(component.criterionKey);
        const alternate = component.altCriterionKey ? sectionByKey.get(component.altCriterionKey) : null;
        const pendingCount = Number((primary?.pendingEntries || []).length + (alternate?.pendingEntries || []).length);
        const weightPoints = component.maxPoints;
        const earned = component.earned;
        const pending = pendingCount > 0 ? Math.max(0, Math.min(weightPoints - earned, weightPoints * 0.35)) : 0;
        const remaining = Math.max(0, weightPoints - earned - pending);
        return {
            schemeKey: component.schemeKey,
            weightKey: component.schemeKey,
            criterionKey: component.criterionKey,
            altCriterionKey: component.altCriterionKey || '',
            label: component.label,
            color: component.color,
            weightPoints,
            earned,
            pending,
            remaining,
            aggregate: component.rawScore,
            maxScore: component.entryMaxScore,
            pendingCount,
            hasAnyEntry: Boolean((primary?.entries || []).length || (alternate?.entries || []).length)
        };
    });
}

function getGradebookSchemeMaxPotentialPercent(record, scheme = getGradebookSchemeForRoster()) {
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    let totalMax = 0;
    let totalEarned = 0;
    getActiveGradebookSchemeComponents().forEach(component => {
        const maxPoints = Number(normalizedScheme[component.schemeKey] || 0);
        totalMax += maxPoints;
        if (maxPoints <= 0) return;
        const rawScore = component.schemeKey === 'final'
            ? Number(getGradebookCriterionMeta(component.criterionKey, record).maxScore || 100)
            : getGradebookSchemeAssessmentRawScore(record, component);
        const entryMaxForScale = getGradebookSchemeEntryMaxForScale(component, normalizedScheme);
        totalEarned += scaleAssessmentScoreToSchemePoints(rawScore, entryMaxForScale, maxPoints);
    });
    return totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;
}

function buildGradebookTrackDataAttributes(percent) {
    const width = Math.max(0, Math.min(100, Number(percent) || 0));
    return `data-gb-track-width="${escapeHtml(String(width))}"`;
}

function syncGradebookVisualCustomProperties(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('[data-gb-track-width]').forEach((node) => {
        const width = Math.max(0, Math.min(100, Number(node.getAttribute('data-gb-track-width')) || 0));
        node.style.setProperty('--gb-track-width', `${width}%`);
    });
    root.querySelectorAll('[data-gb-progress]').forEach((node) => {
        const progress = Math.max(0, Number(node.getAttribute('data-gb-progress')) || 0);
        node.style.setProperty('--gb-progress', `${progress}deg`);
    });
    root.querySelectorAll('[data-gb-score-width]').forEach((node) => {
        const width = Math.max(0, Math.min(100, Number(node.getAttribute('data-gb-score-width')) || 0));
        node.style.setProperty('--gb-score-width', `${width}%`);
    });
}

/* Modern weights UI: gradebook-weights-runtime.js */
