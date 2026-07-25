/* Peeled from assets/js/pages/gradebook-workspace.js. Load before host. */
(function () {
    if (window.__KIU_GRADEBOOK_WEIGHTS_LOADED) return;
    window.__KIU_GRADEBOOK_WEIGHTS_LOADED = true;

    window.__kiuCreateGradebookWeightsApi = function createKiuGradebookWeightsApi(deps = {}) {
        const d = deps;
        void d;
function renderGradebookModernWeights(scheme = {}, summary = null, options = {}) {
    return withGradebookComponents(
        getGradebookSubjectComponents(gradebookSubjectIdFromRoster(options.rosterId || currentRosterId)),
        () => renderGradebookModernWeightsInner(scheme, summary, options)
    );
}

function renderGradebookModernWeightsInner(scheme = {}, summary = null, options = {}) {
    const studentView = Boolean(options.studentView);
    const studyCardOverlay = Boolean(options.studyCardOverlay);
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const rows = getGradebookSchemeRows(normalizedScheme);
    const courseTotal = getGradebookSchemeTotalPoints(normalizedScheme);
    const contributionRows = summary ? getGradebookSchemeContributionRows(summary, normalizedScheme) : [];
    const totalEarned = contributionRows.reduce((sum, row) => sum + row.earned, 0);
    const totalPending = contributionRows.reduce((sum, row) => sum + row.pending, 0);
    const totalRemaining = contributionRows.reduce((sum, row) => sum + row.remaining, 0);
    const earnedPct = courseTotal > 0 ? (totalEarned / courseTotal) * 100 : 0;
    const pendingPct = courseTotal > 0 ? (totalPending / courseTotal) * 100 : 0;
    const remainingPct = courseTotal > 0 ? (totalRemaining / courseTotal) * 100 : 0;
    const progressRows = summary ? contributionRows : rows.map(row => ({
        ...row,
        schemeKey: row.key,
        weightPoints: row.maxPoints,
        earned: 0,
        pending: 0,
        remaining: row.maxPoints,
        pendingCount: 0
    }));
    const cardTitle = studyCardOverlay
        ? 'Grading breakdown'
        : (studentView ? 'Your progress' : 'Course grading breakdown');
    const cardCopy = studyCardOverlay
        ? `${courseTotal}-point course · tap a category for history`
        : (studentView
            ? `Course total is ${courseTotal} points. Each row shows how that component is weighted and your earned, pending, and remaining points.`
            : `Course total is ${courseTotal} points. See how each assessment type is weighted, then track your earned, pending, and remaining points below.`);
    const referenceTableMarkup = studentView
        ? ''
        : renderGradebookSchemeReferenceTable(normalizedScheme, { showCaption: true, showFooter: false, compact: true });
    const progressSectionClass = studentView
        ? `gb-scheme-progress-section is-student-view${studyCardOverlay ? ' is-study-card-overlay' : ''}`
        : 'gb-scheme-progress-section';
    const progressHeadMarkup = studentView
        ? ''
        : `
                    <div class="gb-scheme-progress-head">
                        <div class="gb-modern-kicker">Your progress</div>
                        <p>Earned, pending review, and remaining points per component.</p>
                    </div>
        `;
    const schemeFooterMarkup = studyCardOverlay
        ? ''
        : `<div class="gb-scheme-total gb-scheme-reference-total">Course total: ${courseTotal} points</div>`;
    const overallStripMarkup = studyCardOverlay && summary
        ? `
                <div class="gb-overall-strip">
                    <div class="gb-overall-strip-label">Overall</div>
                    <div class="gb-composition-bar" title="Earned ${totalEarned.toFixed(1)} pts, pending ${totalPending.toFixed(1)} pts, remaining ${totalRemaining.toFixed(1)} pts">
                        <span class="is-earned" ${buildGradebookTrackDataAttributes(earnedPct)}></span>
                        <span class="is-pending" ${buildGradebookTrackDataAttributes(pendingPct)}></span>
                        <span class="is-remaining" ${buildGradebookTrackDataAttributes(remainingPct)}></span>
                    </div>
                    <div class="gb-composition-legend is-inline">
                        <span><i class="is-earned"></i> Earned ${totalEarned.toFixed(1)} pts</span>
                        <span><i class="is-pending"></i> Pending ${totalPending.toFixed(1)} pts</span>
                        <span><i class="is-remaining"></i> Remaining ${totalRemaining.toFixed(1)} pts</span>
                    </div>
                </div>`
        : '';
    const weightCardClass = `lms-route-card lms-route-panel-compact gb-modern-card gb-weight-card${studentView ? ' is-student-view' : ''}${studyCardOverlay ? ' is-study-card-overlay' : ''}`;
    return `
        <div class="${weightCardClass}">
            <div class="gb-modern-card-head">
                <div>
                    <div class="gb-modern-kicker">Grading scheme</div>
                    <h3>${escapeHtml(cardTitle)}</h3>
                    <p>${escapeHtml(cardCopy)}</p>
                    ${overallStripMarkup}
                </div>
                <span class="gb-status-badge lux-status-pill is-graded">${courseTotal} pts</span>
            </div>
            ${referenceTableMarkup}
            ${summary ? `
                <div class="${progressSectionClass}">
                    ${progressHeadMarkup}
                    ${studyCardOverlay ? '' : `
                    <div class="gb-composition-bar" title="Earned ${totalEarned.toFixed(1)} pts, pending ${totalPending.toFixed(1)} pts, remaining ${totalRemaining.toFixed(1)} pts">
                        <span class="is-earned" ${buildGradebookTrackDataAttributes(earnedPct)}></span>
                        <span class="is-pending" ${buildGradebookTrackDataAttributes(pendingPct)}></span>
                        <span class="is-remaining" ${buildGradebookTrackDataAttributes(remainingPct)}></span>
                </div>
                <div class="gb-composition-legend${studyCardOverlay ? ' is-inline' : ''}">
                        <span><i class="is-earned"></i> Earned ${totalEarned.toFixed(1)} pts</span>
                        <span><i class="is-pending"></i> Pending ${totalPending.toFixed(1)} pts</span>
                        <span><i class="is-remaining"></i> Remaining ${totalRemaining.toFixed(1)} pts</span>
                </div>`}
            <div class="gb-weight-stack">
                        ${progressRows.map(row => {
                            const schemeKey = String(row.schemeKey || row.weightKey || row.key || 'default');
                            const metaLine = getGradebookSchemeComponentMetaLine(normalizedScheme, schemeKey);
                            const criterionKey = String(row.criterionKey || schemeKey);
                            const altCriterionKey = String(row.altCriterionKey || '').trim();
                            const weightPoints = Number(row.weightPoints || 0);
                            const rowPending = Number(row.pending || 0) > 0 || Number(row.pendingCount || 0) > 0;
                            const scoreBadgeLabel = rowPending
                                ? 'Pending'
                                : `${row.earned.toFixed(1)} / ${weightPoints.toFixed(0)} pts`;
                            const compactRowClass = studyCardOverlay ? ' is-study-card-compact' : '';
                            const skipModernButton = studyCardOverlay ? ' data-lux-skip-modern-button="1"' : '';
                            const rowAccentStyle = studyCardOverlay ? ` style="--gb-row-accent: ${escapeHtml(row.color || '#22c55e')}"` : '';
                            const dotMarkup = studyCardOverlay ? '<span class="gb-weight-row-dot" aria-hidden="true"></span>' : '';
                            const rowAttrs = studentView
                                ? ` type="button" class="gb-weight-row gb-weight-row--${escapeHtml(schemeKey)} is-student-clickable${compactRowClass}" data-gradebook-click="open-category-history" data-gradebook-criterion="${escapeHtml(criterionKey)}"${altCriterionKey ? ` data-gradebook-criterion-alt="${escapeHtml(altCriterionKey)}"` : ''} data-gradebook-category-label="${escapeHtml(row.label)}"${skipModernButton}${rowAccentStyle}`
                                : ` class="gb-weight-row gb-weight-row--${escapeHtml(schemeKey)}${compactRowClass}"${rowAccentStyle}`;
                            const rowTag = studentView ? 'button' : 'div';
                            const historyHintMarkup = studentView && !studyCardOverlay
                                ? '<span class="gb-weight-row-history-hint">View history <i class="fas fa-chevron-right"></i></span>'
                                : '';
                            const chevronMarkup = studyCardOverlay && studentView
                                ? '<span class="gb-weight-row-chevron" aria-hidden="true"><i class="fas fa-chevron-right"></i></span>'
                                : '';
                            const scoreBadgeMarkup = studyCardOverlay
                                ? `<span class="gb-weight-score-badge${rowPending ? ' is-pending' : ''}">${escapeHtml(scoreBadgeLabel)}</span>`
                                : '';
                            const detailMarkup = studyCardOverlay
                                ? ''
                                : `
                        <div class="gb-weight-detail">
                                    <span class="gb-weight-stat is-earned">Earned ${row.earned.toFixed(1)} pts</span>
                                    <span class="gb-weight-stat is-pending">Pending ${row.pending.toFixed(1)} pts</span>
                                    <span class="gb-weight-stat is-remaining">Remaining ${row.remaining.toFixed(1)} pts</span>
                        </div>`;
                            return `
                            <${rowTag}${rowAttrs}>
                        <div class="gb-weight-label">
                                    <div class="gb-weight-label-main">
                            ${dotMarkup}<strong>${escapeHtml(row.label)}</strong>
                                        ${metaLine ? `<span class="gb-weight-row-meta">${escapeHtml(metaLine)}</span>` : ''}
                                        ${historyHintMarkup}
                                    </div>
                                    ${metaLine ? '' : `<span>${Math.round(row.weightPoints)} pts max</span>`}
                        </div>
                        ${scoreBadgeMarkup}
                        ${chevronMarkup}
                        ${detailMarkup}
                        <div class="gb-weight-track is-stacked">
                            <span class="is-earned" ${buildGradebookTrackDataAttributes(row.weightPoints ? (row.earned / row.weightPoints) * 100 : 0)}></span>
                            <span class="is-pending" ${buildGradebookTrackDataAttributes(row.weightPoints ? (row.pending / row.weightPoints) * 100 : 0)}></span>
                            <span class="is-remaining" ${buildGradebookTrackDataAttributes(row.weightPoints ? (row.remaining / row.weightPoints) * 100 : 0)}></span>
                        </div>
                    </${rowTag}>
                        `;
                        }).join('')}
            </div>
                    ${schemeFooterMarkup}
                </div>
            ` : `<div class="gb-scheme-total gb-scheme-reference-total">Course total: ${courseTotal} points</div>`}
        </div>
    `;
}

function renderStudentGradebookWorkspace(record, weights, options = null) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const summary = getGradebookModernSummary(safeRecord, weights, { rosterId: currentRosterId });
    return `
        <div class="gb-modern-workspace">
            <div class="lms-route-panel lms-route-panel-pad-16-20 gb-modern-hero">
                <div class="gb-modern-hero-main">
                    <div>
                        <div class="gb-modern-kicker">Grades</div>
                        <h2>${escapeHtml(safeRecord.name || 'Student Gradebook')}</h2>
                        <p>Transcript-style view of quizzes, homework, exams, retakes, pending reviews, and final grade prediction.</p>
                    </div>
                    <div class="gb-score-orbit" data-gb-progress="${escapeHtml(String(summary.progressPercent * 3.6))}">
                        <div>
                            <strong>${escapeHtml(summary.outcome.scoreLabel)}</strong>
                            <span>${escapeHtml(summary.outcome.letterLabel)}</span>
                        </div>
                    </div>
                </div>
                <div class="gb-modern-stats">
                    <div><span>Completed</span><strong>${summary.completedCount}</strong></div>
                    <div><span>Pending Review</span><strong>${summary.pendingCount}</strong></div>
                    <div><span>Missing Categories</span><strong>${summary.missingCore}</strong></div>
                    <div><span>Letter</span>${renderGradebookLetterBadge(summary.outcome.letterLabel, summary.outcome.letterLabel)}</div>
                </div>
            </div>
            <div class="gb-modern-stack">
                ${renderGradebookModernWeights(weights, summary, { studentView: true, rosterId: currentRosterId })}
            </div>
            <p class="gb-modern-study-card-pointer">Full assessment transcript, per-item history, and timeline are available on your <a href="study-card.html">Study Card</a> for each subject.</p>
        </div>
    `;
}



        const api = {
            renderGradebookModernWeights,
            renderGradebookModernWeightsInner,
            renderStudentGradebookWorkspace
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateGradebookWeightsApi({});
})();
