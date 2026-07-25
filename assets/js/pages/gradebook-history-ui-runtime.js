/* Peeled from assets/js/pages/gradebook-model.js. Load before host. */
(function () {
    if (window.__KIU_GRADEBOOK_HISTORY_UI_LOADED) return;
    window.__KIU_GRADEBOOK_HISTORY_UI_LOADED = true;

    window.__kiuCreateGradebookHistoryUiApi = function createKiuGradebookHistoryUiApi(deps = {}) {
        const d = deps;
        void d;
function renderGradebookScoreHistoryPanel(options = {}) {
    const record = ensureGradeRecordHistories(options.record || {});
    const criterion = options.criterion || currentGradebookCriterion;
    const assessmentNumber = normalizeAssessmentNumber(options.assessmentNumber ?? currentGradebookAssessmentNumber, 1);
    const studentId = String(options.studentId || record.id || '');
    const studentName = String(options.studentName || record.name || '');
    const canEdit = options.canEdit === undefined
        ? [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())
        : Boolean(options.canEdit);
    const interactiveHistory = canEdit && !options.readOnlyHistory;
    const { entry, timeline, criterionMeta } = getAssessmentScoreHistoryTimeline(record, criterion, assessmentNumber);
    const maxScore = Number(criterionMeta?.maxScore || 100);
    if (!entry || !timeline.length) {
        if (options.compactEmpty) {
            return `
            <div class="gb-score-history-panel gb-score-history-panel--empty">
                <div class="gb-empty-state gb-empty-state--inline">
                    <i class="fas fa-clock-rotate-left"></i>
                    <span>No score history yet — changes appear after you save.</span>
                </div>
            </div>
        `;
        }
        return `
            <div class="gb-score-history-panel gb-score-history-panel--empty">
                <div class="gb-empty-state">
                    <i class="fas fa-clock-rotate-left"></i>
                    <strong>No score history yet</strong>
                    <span>Score changes will appear here after you save.</span>
                </div>
            </div>
        `;
    }
    const compactCap = options.compact && options.readOnlyHistory ? 6 : timeline.length;
    const visibleTimeline = timeline.slice(0, compactCap);
    const hiddenTimeline = timeline.slice(compactCap);
    const buildRow = (historyItem, index, timelineRef) => {
        const scoreValue = historyItem.score === null || historyItem.score === undefined
            ? null
            : Number(historyItem.score);
        const isCurrent = index === 0;
        const scoreLabel = scoreValue === null || !Number.isFinite(scoreValue)
            ? 'Pending'
            : `${scoreValue}${maxScore ? ` / ${maxScore}` : ''}`;
        const olderItem = timelineRef[index + 1] || null;
        const changeLabel = formatGradebookScoreHistoryChangeLabel(historyItem, olderItem);
        const changeMarkup = changeLabel
            ? `<div class="gb-score-history-change">${escapeHtml(changeLabel)}</div>`
            : '';
        const rowClass = `gb-score-history-row${isCurrent ? ' is-current' : ''}`;
        const rowBody = `
            <div class="gb-score-history-scoreline">
                <strong>${escapeHtml(scoreLabel)}</strong>
                ${isCurrent ? '<span class="gb-status-badge lux-status-pill is-graded">Current</span>' : ''}
            </div>
            ${changeMarkup}
            <div class="gb-score-history-meta">
                <span>${escapeHtml(formatAssessmentHistoryTimestamp(historyItem.updatedAt))}</span>
                ${historyItem.updatedBy ? `<span>${escapeHtml(historyItem.updatedBy)}</span>` : ''}
            </div>
        `;
        if (!interactiveHistory) {
            return `<div class="${rowClass}">${rowBody}</div>`;
        }
        const scoreAttr = Number.isFinite(scoreValue) ? String(scoreValue) : '';
        return `
            <button type="button" class="${rowClass}"
                data-gradebook-click="open-score-edit"
                data-gradebook-student-id="${escapeHtml(studentId)}"
                data-gradebook-criterion="${escapeHtml(String(criterion))}"
                data-gradebook-number="${escapeHtml(String(assessmentNumber))}"
                data-gradebook-score="${escapeHtml(scoreAttr)}"
                data-gradebook-student-name="${escapeHtml(studentName)}"
                title="Change this score">
                ${rowBody}
            </button>
        `;
    };
    const visibleRows = visibleTimeline.map((historyItem, index) => buildRow(historyItem, index, timeline)).join('');
    const hiddenRows = hiddenTimeline.length
        ? hiddenTimeline.map((historyItem, index) => buildRow(historyItem, index + visibleTimeline.length, timeline)).join('')
        : '';
    const expandToggle = hiddenTimeline.length
        ? `<button type="button" class="gb-score-history-toggle" data-gradebook-click="toggle-score-history" data-gradebook-expand-label="Show all ${timeline.length} changes" data-gradebook-collapse-label="Show fewer changes">Show all ${timeline.length} changes</button>`
        : '';
    return `
        <div class="gb-score-history-panel${options.compact ? ' is-compact' : ''}">
            <div class="gb-score-history-list">
                ${visibleRows}
                ${hiddenRows ? `<div class="gb-score-history-more" hidden>${hiddenRows}</div>` : ''}
            </div>
            ${expandToggle}
        </div>
    `;
}

function refreshGradebookAfterStaffScoreChange(options = {}) {
    if (options.closeScoreEditModal !== false) {
        const overlay = document.getElementById('gradebook-score-edit-modal');
        if (typeof window.closeLuxGlassDialogOverlay === 'function') {
            window.closeLuxGlassDialogOverlay(overlay);
        } else {
            overlay?.remove();
        }
    }
    if (isFacultyStandaloneGradebookContext()) {
        loadFacultyGradebookAggregateRoster();
    }
    if (isStaffModernGradebookContext()) {
        if (isFacultyStandaloneGradebookContext()) {
            refreshFacultyStaffWorkspace('workspace');
        } else {
            initStaffModernGradebook();
        }
    } else {
        initGradebook();
    }
}

function removeGradebookCustomSectionByKey(studentId, sectionKey, studentName = '') {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professors, teaching assistants, or admins can remove custom evaluation sections.');
        return;
    }
    const normalizedKey = normalizeGradebookCriterion(sectionKey);
    const sectionMeta = getGradebookSectionDefs(currentRosterId).find(meta => meta.key === normalizedKey);
    if (!sectionMeta || !sectionMeta.custom) {
        alert('Only custom sections can be removed.');
        return;
    }
    if (!confirm(`Remove "${sectionMeta.label}" and all of its saved scores?`)) return;

    const roster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId]) ? KIU_STATE.studentGrades[currentRosterId] : (Array.isArray(mockStudents) ? mockStudents : []);
    const cleanedRoster = roster.map(student => {
        const safeStudent = ensureGradeRecordHistories(student);
        if (safeStudent.assessments) {
            delete safeStudent.assessments[normalizedKey];
        }
        if (safeStudent.assessmentSectionLabels) {
            delete safeStudent.assessmentSectionLabels[normalizedKey];
        }
        return syncGradeRecordSummaries(safeStudent);
    });

    const customSections = ensureGradebookCustomSectionsForRoster(currentRosterId);
    KIU_STATE.gradebookCustomSections[currentRosterId] = customSections.filter(section => normalizeGradebookCriterion(section.key) !== normalizedKey);
    KIU_STATE.studentGrades[currentRosterId] = cleanedRoster;
    mockStudents = cleanedRoster.map(student => ensureGradeRecordHistories(student));
    saveState();
    refreshGradebookAfterStaffScoreChange({ closeScoreEditModal: false });
    openStudentEvaluationHistoryModal(studentId, studentName);
}



        const api = {
            renderGradebookScoreHistoryPanel,
            refreshGradebookAfterStaffScoreChange,
            removeGradebookCustomSectionByKey
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateGradebookHistoryUiApi({});
})();
