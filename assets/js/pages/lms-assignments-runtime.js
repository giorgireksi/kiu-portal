/* LMS assignments/workspace runtime extracted from lms.js. */

function buildLmsSubmissionDraftKey(resourceKey, assignmentId, userId = getCurrentUserId() || 'student') {
    return `${resolveCanonicalLmsResourceKey(resourceKey)}::${assignmentId}::${userId}`;
}

function buildLmsAssignmentCreateBoxHtml(courseId, resourceKey, assignmentLabelId) {
    return `
        <section class="lms-route-panel lms-assignment-create-panel" aria-labelledby="lms-assignment-create-title">
            <header class="lms-assignment-create-head">
                <div class="lms-assignment-create-heading">
                    <div class="lms-route-card-title" id="lms-assignment-create-title"><i class="fas fa-square-plus"></i> Create Homework</div>
                    <div class="lms-route-copy">Publish assignments for this exact LMS group. Students in the same group will see the same work and submit back here.</div>
                </div>
                <div id="${assignmentLabelId}" class="lms-route-pill home-hover-chip">No attachment selected</div>
            </header>
            <div class="lms-assignment-create-fields">
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-asm-title">Homework Title</label>
                    <input type="text" id="new-asm-title" class="lms-route-input lux-control" placeholder="Homework title" autocomplete="off">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-asm-deadline">Deadline</label>
                    <input type="datetime-local" id="new-asm-deadline" class="lms-route-input lux-control" autocomplete="off">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-asm-week">Teaching Week</label>
                    <select id="new-asm-week" class="lms-route-select lux-control" autocomplete="off">
                        ${buildLmsWeekSelectOptions(resourceKey, '')}
                    </select>
                </div>
            </div>
            <div class="lms-assignment-create-textarea-field">
                <label class="lms-route-field-label" for="new-asm-description">Description</label>
                <textarea id="new-asm-description" class="lms-route-textarea lux-control lms-assignment-autogrow" rows="2" placeholder="Homework description, instructions, grading notes..." autocomplete="off"></textarea>
            </div>
            <div class="lms-assignment-create-textarea-field">
                <label class="lms-route-field-label" for="new-asm-rubric">Rubric</label>
                <textarea id="new-asm-rubric" class="lms-route-textarea lux-control lms-assignment-autogrow" rows="2" placeholder="Understanding: 40%; Evidence and method: 35%; Clarity: 15%; Timeliness: 10%" autocomplete="off">Understanding: 40%; Evidence and method: 35%; Clarity: 15%; Timeliness: 10%</textarea>
            </div>
            <div class="lms-assignment-create-footer">
                <label class="lms-route-inline lms-route-inline-gap-8 lms-route-inline-center lms-route-copy">
                    <input type="checkbox" id="new-asm-late">
                    Allow late submissions
                </label>
                <div class="lms-route-actions lms-assignment-create-actions">
                    <button class="lux-secondary-btn" type="button" data-lms-click="pickLocalLmsFile('assignment', '${resourceKey}', '${assignmentLabelId}')"><i class="fas fa-paperclip"></i> Upload Assignment File</button>
                    <button class="lux-primary-btn" type="button" data-lms-click="createAssignment('${courseId}')"><i class="fas fa-save"></i> Save & Publish Homework</button>
                </div>
            </div>
        </section>
    `;
}

function bindLmsAssignmentCreateAutosize(root = document) {
    root.querySelectorAll?.('.lms-assignment-autogrow').forEach(textarea => {
        if (textarea.dataset.autogrowBound === '1') return;
        textarea.dataset.autogrowBound = '1';
        const resize = () => {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.max(52, textarea.scrollHeight)}px`;
        };
        textarea.addEventListener('input', resize);
        resize();
    });
}

function buildLmsAssignmentGradeModalBodyHtml({
    courseId,
    studentId,
    assignment,
    submission,
    fieldIds,
    maxScore,
    statusLabel,
    submissionStateLabel,
    reviewerMeta
}) {
    return `
                <div class="lms-route-card-grid lms-assignment-grade-summary-grid">
                    <div class="lms-route-card lms-route-panel-compact lms-assignment-grade-summary-card">
                        <div class="lms-route-kv-label">Student</div>
                        <div class="lms-route-card-title lms-route-card-title-15 lms-route-copy-mt-6">${escapeHtml(submission.studentName || studentId || 'Student')}</div>
                        <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-8">${joinLmsMeta([submissionStateLabel, formatLmsDateTime(submission.submittedAt)])}</div>
                        <div class="lms-route-pill home-hover-chip lms-assignment-grade-summary-pill">${escapeHtml(statusLabel)}</div>
                    </div>
                    <div class="lms-route-card lms-route-panel-compact lms-assignment-grade-summary-card">
                        <div class="lms-route-kv-label">Assignment</div>
                        <div class="lms-route-card-title lms-route-card-title-15 lms-route-copy-mt-6">${escapeHtml(assignment.title || 'Homework')}</div>
                        <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-8">${joinLmsMeta([getLmsWeekLabel(assignment.weekLabel), assignment.lateAllowed ? 'Late submissions allowed' : 'Late submissions closed'])}</div>
                        <div class="lms-route-copy lms-route-copy-mt-8 lms-assignment-grade-review-note">${escapeHtml(reviewerMeta)}</div>
                    </div>
                </div>
                <div class="lms-route-card lms-route-panel-compact lms-assignment-grade-response-card">
                    <div class="lms-route-card-head lms-route-card-head-mb-14">
                        <div>
                            <div class="lms-route-card-title lms-route-card-title-15">Student Response</div>
                            <div class="lms-route-copy lms-route-copy-mt-6">Read the answer, download the attached file if needed, then save the final score below.</div>
                        </div>
                    </div>
                    <div class="lms-route-copy lms-route-copy-prewrap lms-assignment-grade-response-copy">${escapeHtml(submission.text || 'No written response submitted.')}</div>
                    ${submission.file ? renderLmsStoredFileAttachmentShell(submission.file, {
                        label: 'Submission file',
                        title: submission.file.name || 'Submission upload',
                        downloadLabel: 'Download submission',
                        shellClass: 'lms-route-file-shell lms-route-actions-mt-12'
                    }) : '<div class="lms-route-file-shell lms-route-actions-mt-12 lms-assignment-grade-empty-shell"><div class="lms-route-kv-label">Submission file</div><div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-empty-copy">No submission file was uploaded for this review.</div></div>'}
                </div>
                <div class="lms-route-panel lms-route-panel-compact lms-assignment-grade-editor">
                    <div class="lms-route-card-head lms-route-card-head-mb-16">
                        <div>
                            <div class="lms-route-card-title lms-route-card-title-15">Grade & Feedback</div>
                            <div class="lms-route-copy lms-route-copy-mt-6">${escapeHtml(assignment.rubric || 'Rubric not configured.')}</div>
                        </div>
                    </div>
                    <div class="lms-route-field-grid lms-assignment-grade-field-grid">
                        <div class="lms-route-field">
                            <label class="lms-route-field-label" for="${fieldIds.scoreInputId}">Score out of ${escapeHtml(String(maxScore))}</label>
                            <input id="${fieldIds.scoreInputId}" type="number" min="0" max="${escapeHtml(String(maxScore))}" step="1" value="${escapeHtml(submission.score == null ? '' : String(submission.score))}" class="lms-route-input lux-control lms-assignment-grade-score-input">
                        </div>
                        <div class="lms-route-field">
                            <label class="lms-route-field-label">Review status</label>
                            <div class="lms-route-pill home-hover-chip lms-assignment-grade-status-pill ${submission.score == null ? 'is-pending' : 'is-graded'}">
                                <i class="fas ${submission.score == null ? 'fa-hourglass-half' : 'fa-check-circle'}"></i>
                                ${submission.score == null ? 'Save the first grade for this submission' : `Current grade ${escapeHtml(String(submission.score))}/${escapeHtml(String(maxScore))}`}
                            </div>
                        </div>
                    </div>
                    <div class="lms-route-field lms-route-field-mt-14">
                        <label class="lms-route-field-label" for="${fieldIds.feedbackInputId}">Feedback for the student</label>
                        <textarea id="${fieldIds.feedbackInputId}" class="lms-route-textarea lux-control lms-route-textarea-min-110 lms-assignment-grade-feedback-input" placeholder="Explain the score, note what to revise, or confirm why the work is ready.">${escapeHtml(submission.feedback || '')}</textarea>
                    </div>
                    <div class="lms-route-actions lms-route-actions-mt-16 lms-assignment-grade-actions">
                        <button class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-lms-click="closeLmsAssignmentGradeModal()"><i class="fas fa-arrow-left"></i> Cancel</button>
                        <button class="lux-primary-btn lux-glass-dialog-submit-btn" data-lms-click="saveLmsAssignmentSubmissionGrade(${jsQuote(courseId)}, ${jsQuote(assignment.id)}, ${jsQuote(studentId)})"><i class="fas fa-save"></i> Save Grade</button>
                    </div>
                </div>`;
}

function renderWorkspace(courseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('workspace', contentArea);

    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = parsed.resourceKey;
    const assignments = ensureLmsAssignmentsForKey(resourceKey);
    const canManage = canManageLmsGroupContent();
    const effectiveRole = getEffectiveUserRole();
    const userId = getCurrentUserId() || 'student';
    const resourceToken = toDomToken(resourceKey);
    const assignmentLabelId = `lms-assignment-file-label-${resourceToken}`;

    const createBox = canManage
        ? buildLmsAssignmentCreateBoxHtml(courseId, resourceKey, assignmentLabelId)
        : '';
    const assignmentWeekBanner = `
        <div class="lms-route-panel lms-assignment-banner">
            <div class="lms-route-card-head">
                <div class="lms-route-inline lms-route-inline-gap-12 lms-route-inline-center">
                    <i class="fas fa-clipboard-list lms-route-icon-accent"></i>
                    <div>
                        <div class="lms-route-card-title">Assignments</div>
                        <div class="lms-route-copy lms-route-copy-mt-4">${assignments.length} homework &middot; ${ensureLmsWeeksForKey(resourceKey).length} weeks &middot; ${canManage ? 'Staff' : 'Student'}</div>
                    </div>
                </div>
                <div class="lms-route-actions">
                    ${canManage ? '<button class="lux-secondary-btn lms-quiz-action-btn" data-lms-click="openLmsWeekManagerModal(&#39;' + resourceKey + '&#39;)"><i class="fas fa-calendar-week"></i> Manage Weeks</button>' : ''}
                </div>
            </div>
        </div>
    `;

    const groupedAssignments = groupLmsItemsByWeek(resourceKey, assignments, assignment => assignment.weekLabel);
    const cards = groupedAssignments.length ? groupedAssignments.map(([weekLabel, weekAssignments], weekIndex) => {
        const weekCardHtml = weekAssignments.length ? weekAssignments.map(assignment => {
        const submissionDraftKey = buildLmsSubmissionDraftKey(resourceKey, assignment.id, userId);
        const submissionLabelId = `lms-submission-file-label-${toDomToken(submissionDraftKey)}`;
        const studentSubmission = getLmsAssignmentSubmissions(resourceKey, assignment.id)[userId];
        const submissionEntries = Object.values(getLmsAssignmentSubmissions(resourceKey, assignment.id) || {});
        const gradedSubmissionCount = submissionEntries.filter(entry => Number.isFinite(Number(entry.score))).length;
        const pendingSubmissionCount = Math.max(0, submissionEntries.length - gradedSubmissionCount);
        const submissionStatus = studentSubmission ? `
            <div class="lms-route-pill home-hover-chip is-positive lms-assignment-submission-pill">
                <i class="fas fa-check"></i> Submitted ${escapeHtml(formatLmsDateTime(studentSubmission.submittedAt))}
            </div>
        ` : '';
        const studentControls = effectiveRole === USER_ROLES.STUDENT ? `
            <div class="lms-route-divider-top lms-assignment-student-controls">
                <textarea id="sub-text-${assignment.id}" class="lms-route-textarea lux-control lms-route-textarea-min-110">${escapeHtml(studentSubmission?.text || '')}</textarea>
                <div class="lms-route-inline lms-route-inline-between lms-route-inline-gap-10 lms-route-inline-center lms-assignment-student-toolbar">
                    <div id="${submissionLabelId}" class="lms-route-pill home-hover-chip lms-assignment-student-file-pill">
                        ${studentSubmission?.file?.name ? `<i class="fas fa-paperclip"></i> ${escapeHtml(studentSubmission.file.name)}` : 'No homework file selected'}
                    </div>
                    <div class="lms-route-actions lms-assignment-student-actions">
                        <button class="lux-secondary-btn" data-lms-click="pickLocalLmsFile('submissions', '${submissionDraftKey}', '${submissionLabelId}')"><i class="fas fa-upload"></i> Upload Homework</button>
                        <button class="lux-primary-btn" data-lms-click="submitAssignment('${courseId}', '${assignment.id}')"><i class="fas fa-paper-plane"></i> ${studentSubmission ? 'Update Submission' : 'Submit Homework'}</button>
                    </div>
                </div>
                ${studentSubmission ? `
                    <div class="lms-assignment-submission-bar lms-route-actions-mt-10">${submissionStatus}${studentSubmission.file ? getStoredFileDownloadHtml(studentSubmission.file, 'Download my upload') : ''}</div>
                    <div class="lms-route-card-grid lms-assignment-student-detail-grid">
                        <div class="lms-route-card lms-route-panel-compact lms-assignment-student-detail-card">
                            <div class="lms-route-kv-label">Submission state</div>
                            <div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-student-detail-copy">${escapeHtml(Number.isFinite(Number(studentSubmission.score)) ? 'Reviewed and saved' : (String(studentSubmission.status || '').trim().toLowerCase() === 'resubmitted' ? 'Resubmitted and waiting for review' : 'Submitted and waiting for review'))}</div>
                            <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${escapeHtml(studentSubmission.submittedAt ? formatLmsDateTime(studentSubmission.submittedAt) : 'Submission time unavailable')}</div>
                        </div>
                        <div class="lms-route-card lms-route-panel-compact lms-assignment-student-detail-card">
                            <div class="lms-route-kv-label">Review detail</div>
                            <div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-student-detail-copy">${escapeHtml(Number.isFinite(Number(studentSubmission.score)) ? `Reviewed by ${studentSubmission.gradedBy || 'Staff'}` : 'Grade and feedback will appear here after course staff review.')}</div>
                            <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${escapeHtml(studentSubmission.gradedAt ? formatLmsDateTime(studentSubmission.gradedAt) : 'No review saved yet')}</div>
                        </div>
                    </div>
                ` : ''}
            </div>
        ` : '';
        const staffControls = canManage ? `
            <div class="lms-route-divider-top lms-route-card-stack">
                <div class="lms-route-inline lms-route-inline-between lms-route-inline-gap-12 lms-route-inline-center lms-assignment-staff-summary">
                    <div class="lms-route-card-title lms-route-card-title-14">Submissions received: ${submissionEntries.length}</div>
                    <button class="lux-secondary-btn lms-quiz-action-btn is-compact" data-lms-click="deleteAssignment('${courseId}', '${assignment.id}')"><i class="fas fa-trash"></i> Remove</button>
                </div>
                ${submissionEntries.length ? `
                    <div class="lms-route-card-grid lms-assignment-review-summary-grid">
                        <div class="lms-route-card lms-route-panel-compact lms-assignment-review-summary-card">
                            <div class="lms-route-kv-label">Pending review</div>
                            <div class="lms-route-card-title lms-route-card-title-16 lms-route-copy-mt-6">${escapeHtml(String(pendingSubmissionCount))}</div>
                            <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">Need score or feedback from course staff.</div>
                        </div>
                        <div class="lms-route-card lms-route-panel-compact lms-assignment-review-summary-card">
                            <div class="lms-route-kv-label">Already graded</div>
                            <div class="lms-route-card-title lms-route-card-title-16 lms-route-copy-mt-6">${escapeHtml(String(gradedSubmissionCount))}</div>
                            <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">Saved reviews stay visible inside this LMS group only.</div>
                        </div>
                    </div>
                        <div class="lms-route-card-stack">
                        ${submissionEntries.map(entry => {
                            const normalizedStatus = String(entry.status || '').trim().toLowerCase();
                            const submissionStateLabel = Number.isFinite(Number(entry.score))
                                ? 'Graded and saved'
                                : normalizedStatus === 'resubmitted'
                                    ? 'Resubmitted and waiting for review'
                                    : 'Submitted and waiting for review';
                            const submissionTimestamp = entry.submittedAt ? formatLmsDateTime(entry.submittedAt) : 'Submission time unavailable';
                            const reviewTimestamp = entry.gradedAt ? formatLmsDateTime(entry.gradedAt) : '';
                            const reviewActor = entry.gradedBy || '';
                            return `
                            <div class="lms-route-card lms-route-panel-compact lms-assignment-submission-card">
                                <div class="lms-route-inline lms-route-inline-between lms-route-inline-gap-10 lms-route-inline-center">
                                    <div class="lms-route-card-title lms-route-card-title-14">${escapeHtml(entry.studentName || entry.studentId || 'Student')}</div>
                                    <div class="lms-route-meta lms-route-meta-11">${escapeHtml(formatLmsDateTime(entry.submittedAt))}</div>
                                </div>
                                ${entry.text ? `<div class="lms-route-copy lms-route-copy-mt-8 lms-route-copy-prewrap">${escapeHtml(entry.text)}</div>` : ''}
                                <div class="lms-route-card-grid lms-assignment-submission-detail-grid">
                                    <div class="lms-route-card lms-route-panel-compact lms-assignment-submission-detail-card">
                                        <div class="lms-route-kv-label">Submission state</div>
                                        <div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-submission-detail-copy">${escapeHtml(submissionStateLabel)}</div>
                                        <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${escapeHtml(submissionTimestamp)}</div>
                                    </div>
                                    <div class="lms-route-card lms-route-panel-compact lms-assignment-submission-detail-card">
                                        <div class="lms-route-kv-label">Review detail</div>
                                        <div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-submission-detail-copy">${escapeHtml(Number.isFinite(Number(entry.score)) ? `Reviewed by ${reviewActor || 'Staff'}` : 'Waiting for course staff review.')}</div>
                                        <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-6">${escapeHtml(reviewTimestamp || 'No score saved yet')}</div>
                                    </div>
                                </div>
                                ${entry.feedback
                                    ? `<div class="lms-route-file-shell lms-route-actions-mt-10 lms-assignment-feedback-shell"><div class="lms-route-kv-label">Feedback</div><div class="lms-route-copy lms-route-copy-mt-6">${escapeHtml(entry.feedback)}</div></div>`
                                    : `<div class="lms-route-file-shell lms-route-actions-mt-10 lms-assignment-feedback-shell is-empty"><div class="lms-route-kv-label">Feedback</div><div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-empty-copy">Course staff has not saved feedback for this submission yet.</div></div>`}
                                <div class="lms-assignment-submission-actions lms-route-actions-mt-10">
                                    <button class="lux-secondary-btn" data-lms-click="gradeLmsAssignmentSubmission('${courseId}', '${assignment.id}', '${entry.studentId}')"><i class="fas fa-pen"></i> Grade / feedback</button>
                                    ${Number.isFinite(Number(entry.score))
                                        ? `<span class="lms-route-pill home-hover-chip lms-assignment-submission-status-pill is-graded"><i class="fas fa-star"></i> ${escapeHtml(String(entry.score))}/${escapeHtml(String(assignment.maxScore || 100))}</span>`
                                        : '<span class="lms-route-pill home-hover-chip lms-assignment-submission-status-pill is-pending">Pending review</span>'}
                                </div>
                                ${entry.file ? renderLmsStoredFileAttachmentShell(entry.file, {
                                    label: 'Submission file',
                                    title: entry.file.name || 'Submission file',
                                    downloadLabel: 'Download submission',
                                    shellClass: 'lms-route-file-shell lms-route-actions-mt-10'
                                }) : `<div class="lms-route-file-shell lms-route-actions-mt-10 lms-assignment-submission-file-shell is-empty"><div class="lms-route-kv-label">Submission file</div><div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-empty-copy">No file was uploaded with this submission.</div></div>`}
                            </div>
                        `;}).join('')}
                    </div>
                ` : `<div class="lms-route-card lms-route-panel-compact lms-assignment-review-empty-shell"><div class="lms-route-kv-label">Review queue</div><div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-empty-copy">No student submissions have been received for this homework yet.</div></div>`}
            </div>
        ` : '';
        return `
            <div class="lms-route-card lms-route-card-stack lms-assignment-card">
                <div class="lms-route-card-head lms-assignment-card-head">
                    <div>
                        <div class="lms-route-card-title">${escapeHtml(assignment.title)}</div>
                        <div class="lms-route-meta lms-route-meta-12 lms-route-copy-mt-4">Due: ${escapeHtml(formatLmsDateTime(assignment.deadline))}</div>
                    </div>
                    ${submissionStatus}
                </div>
                <div class="lms-route-copy lms-route-copy-prewrap">${escapeHtml(assignment.description || 'No description added yet.')}</div>
                <div class="lms-route-kv lms-assignment-rubric-shell">
                    <div class="lms-route-kv-label">Rubric</div>
                    <div class="lms-route-copy lms-route-copy-mt-6">${escapeHtml(assignment.rubric || 'Rubric not configured.')}</div>
                </div>
                <div class="lms-route-inline lms-route-inline-between lms-route-inline-gap-10 lms-route-inline-center lms-assignment-policy-row">
                    <div class="lms-route-meta lms-route-meta-11">${assignment.lateAllowed ? 'Late submissions allowed' : 'Late submissions closed'}</div>
                </div>
                ${assignment.attachment
                    ? renderLmsStoredFileAttachmentShell(assignment.attachment, {
                        label: 'Assignment file',
                        title: assignment.attachment.name || 'Assignment attachment',
                        downloadLabel: 'Download assignment file'
                    })
                    : '<div class="lms-route-file-shell lms-assignment-attachment-empty-shell"><div class="lms-route-kv-label">Assignment file</div><div class="lms-route-copy lms-route-copy-mt-6 lms-assignment-empty-copy">No assignment file was attached to this homework.</div></div>'}
                ${effectiveRole === USER_ROLES.STUDENT ? studentControls : ''}
                ${canManage ? staffControls : ''}
            </div>
        `;
        }).join('') : renderLmsWeekPanelEmptyState('No Homework Yet', 'No homework was uploaded in this week yet.', 'fa-book-open');
        return renderLmsRouteWeekAccordion(
            weekLabel,
            `${weekAssignments.length} homework${weekAssignments.length === 1 ? '' : 's'} in this section`,
            `<div class="lms-route-card-grid lms-route-card-grid--wide">${weekCardHtml}</div>`,
            weekIndex === 0
        );
    }).join('') : renderLmsRouteEmptyState('No Homework Yet', 'No homework has been published for this group yet.', 'fa-book-open');

    contentArea.innerHTML = `
        <div class="lms-route-stack">
            ${assignmentWeekBanner}
            ${createBox}
            ${cards}
        </div>
    `;
    bindLmsAssignmentCreateAutosize(contentArea);
}

async function createAssignment(courseId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey);
    const title = document.getElementById('new-asm-title')?.value.trim();
    const description = document.getElementById('new-asm-description')?.value.trim();
    const deadline = document.getElementById('new-asm-deadline')?.value || '';
    const weekLabel = document.getElementById('new-asm-week')?.value || '';
    const rubric = document.getElementById('new-asm-rubric')?.value.trim() || '';
    const isLate = Boolean(document.getElementById('new-asm-late')?.checked);
    const attachment = getLmsDraftFile('assignment', resourceKey);

    if (!title || !description) {
        alert("Please enter a homework title and description.");
        return;
    }

    try {
        const persistedAttachment = attachment ? await persistLmsStoredFile(attachment, 'assignment') : null;
        const assignments = ensureLmsAssignmentsForKey(resourceKey);
        assignments.unshift({
            id: `asm_${Date.now()}`,
            title,
            description,
            weekLabel,
            deadline,
            lateAllowed: isLate,
            rubric,
            maxScore: 100,
            attachment: persistedAttachment,
            createdAt: new Date().toISOString(),
            createdBy: getSimulatedUserName()
        });

        clearLmsDraftFile('assignment', resourceKey);
        saveState();
        rerenderCurrentLmsTab();
        alert('Homework published successfully.');
    } catch (error) {
        console.error('Could not save LMS assignment.', error);
        alert('Homework could not be saved.');
    }
}

async function submitAssignment(courseId, assignmentId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey);
    const studentId = getCurrentUserId();
    if (!studentId) {
        alert('Sign in as a student to submit this assignment.');
        return;
    }
    const text = document.getElementById(`sub-text-${assignmentId}`)?.value.trim() || '';
    const draftKey = buildLmsSubmissionDraftKey(resourceKey, assignmentId, studentId);
    const file = getLmsDraftFile('submissions', draftKey);
    if (!text && !file) {
        alert('Please write an answer or upload a homework file before submitting.');
        return;
    }
    try {
        const submissionsByAssignment = ensureLmsSubmissionsForKey(resourceKey);
        if (!submissionsByAssignment[assignmentId] || typeof submissionsByAssignment[assignmentId] !== 'object') {
            submissionsByAssignment[assignmentId] = {};
        }
        const previousSubmission = submissionsByAssignment[assignmentId][studentId] || null;
        const persistedFile = file
            ? await persistLmsStoredFile(file, 'submission')
            : (previousSubmission?.file || null);
        if (file && previousSubmission?.file?.storageKey && previousSubmission.file.storageKey !== persistedFile?.storageKey) {
            queueStoredFileDelete(previousSubmission.file);
        }
        submissionsByAssignment[assignmentId][studentId] = {
            ...previousSubmission,
            studentId,
            studentName: getCurrentUser()?.nameEn || getCurrentUser()?.name || studentId,
            text,
            file: persistedFile,
            submittedAt: new Date().toISOString(),
            status: previousSubmission?.score != null ? 'resubmitted' : 'submitted'
        };
        clearLmsDraftFile('submissions', draftKey);
        saveState();
        rerenderCurrentLmsTab();
        alert('Homework submitted successfully.');
    } catch (error) {
        console.error('Could not save LMS submission.', error);
        alert('Homework submission could not be saved.');
    }
}

function deleteAssignment(courseId, assignmentId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey);
    if(confirm("Are you sure you want to delete this homework?")) {
        const assignments = ensureLmsAssignmentsForKey(resourceKey);
        const targetAssignment = assignments.find(item => String(item.id) === String(assignmentId));
        queueStoredFileDelete(targetAssignment?.attachment);
        const submissionStore = ensureLmsSubmissionsForKey(resourceKey)?.[assignmentId] || {};
        Object.values(submissionStore).forEach(entry => queueStoredFileDelete(entry?.file));
        KIU_STATE.groupAssignments[resourceKey] = assignments.filter(a => a.id !== assignmentId);
        if (KIU_STATE.groupSubmissions?.[resourceKey]?.[assignmentId]) {
            delete KIU_STATE.groupSubmissions[resourceKey][assignmentId];
        }
        saveState();
        rerenderCurrentLmsTab();
    }
}

function buildLmsAssignmentGradeModalFieldIds(resourceKey, assignmentId, studentId) {
    const token = toDomToken(`${resourceKey}-${assignmentId}-${studentId}-grade`);
    return {
        scoreInputId: `lms-assignment-grade-score-${token}`,
        feedbackInputId: `lms-assignment-grade-feedback-${token}`
    };
}

function closeLmsAssignmentGradeModal() {
    const overlay = document.getElementById('lms-assignment-grade-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function saveLmsAssignmentSubmissionGrade(courseId, assignmentId, studentId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey);
    const assignment = ensureLmsAssignmentsForKey(resourceKey).find(item => String(item.id) === String(assignmentId));
    const submission = ensureLmsSubmissionsForKey(resourceKey)?.[assignmentId]?.[studentId];
    if (!assignment || !submission) return;

    const fieldIds = buildLmsAssignmentGradeModalFieldIds(resourceKey, assignmentId, studentId);
    const scoreInput = document.getElementById(fieldIds.scoreInputId);
    const feedbackInput = document.getElementById(fieldIds.feedbackInputId);
    const maxScore = Number(assignment.maxScore || 100);
    const score = Math.max(0, Math.min(maxScore, Number(scoreInput?.value || '')));

    if (!Number.isFinite(score)) {
        alert('Please enter a valid numeric score.');
        scoreInput?.focus();
        return;
    }

    submission.score = score;
    submission.feedback = String(feedbackInput?.value || '').trim();
    submission.status = 'graded';
    submission.gradedAt = new Date().toISOString();
    submission.gradedBy = getSimulatedUserName();
    saveState();
    closeLmsAssignmentGradeModal();
    rerenderCurrentLmsTab();
}

function gradeLmsAssignmentSubmission(courseId, assignmentId, studentId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey);
    if (!canManageLmsGroupContent()) {
        alert('Only admins, professors, and teaching assistants can grade submissions.');
        return;
    }
    const assignment = ensureLmsAssignmentsForKey(resourceKey).find(item => String(item.id) === String(assignmentId));
    const submission = ensureLmsSubmissionsForKey(resourceKey)?.[assignmentId]?.[studentId];
    if (!assignment || !submission) return;
    const maxScore = Number(assignment.maxScore || 100);
    const fieldIds = buildLmsAssignmentGradeModalFieldIds(resourceKey, assignmentId, studentId);
    const statusLabel = String(submission.status || '').trim().toLowerCase() === 'graded' ? 'Existing grade will be updated' : 'Pending first review';
    const submissionStateLabel = String(submission.status || '').trim()
        ? String(submission.status).replace(/-/g, ' ')
        : 'Submitted';
    const reviewerMeta = submission.gradedAt
        ? `Last reviewed ${formatLmsDateTime(submission.gradedAt)} by ${submission.gradedBy || 'Staff'}.`
        : 'No review has been saved for this submission yet.';

    closeLmsAssignmentGradeModal();

    const overlay = document.createElement('div');
    overlay.id = 'lms-assignment-grade-modal';
    overlay.className = 'lms-quiz-board-overlay lms-assignment-grade-overlay lms-glass-dialog-overlay';
    overlay.onclick = (event) => {
        if (event.target === overlay) closeLmsAssignmentGradeModal();
    };

    overlay.innerHTML = upgradeLmsLegacyMarkup(renderLmsGlassDialogCard({
        hookClass: 'lms-quiz-board-modal lms-assignment-grade-modal',
        bodyClass: 'lms-quiz-board-body lms-assignment-grade-modal-body',
        title: 'Grade Submission',
        icon: 'fa-pen-to-square',
        subtitle: 'Review the student answer, confirm the upload, and save a score with feedback inside the LMS workspace.',
        closeAttr: 'data-lms-click="closeLmsAssignmentGradeModal()"',
        bodyHtml: buildLmsAssignmentGradeModalBodyHtml({
            courseId,
            studentId,
            assignment,
            submission,
            fieldIds,
            maxScore,
            statusLabel,
            submissionStateLabel,
            reviewerMeta
        })
    }));
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

if (typeof window !== 'undefined') {
    window.renderWorkspace = window.renderWorkspace || renderWorkspace;
    window.buildLmsSubmissionDraftKey = window.buildLmsSubmissionDraftKey || buildLmsSubmissionDraftKey;
    window.createAssignment = window.createAssignment || createAssignment;
    window.submitAssignment = window.submitAssignment || submitAssignment;
    window.deleteAssignment = window.deleteAssignment || deleteAssignment;
    window.closeLmsAssignmentGradeModal = window.closeLmsAssignmentGradeModal || closeLmsAssignmentGradeModal;
    window.saveLmsAssignmentSubmissionGrade = window.saveLmsAssignmentSubmissionGrade || saveLmsAssignmentSubmissionGrade;
    window.gradeLmsAssignmentSubmission = window.gradeLmsAssignmentSubmission || gradeLmsAssignmentSubmission;
}
