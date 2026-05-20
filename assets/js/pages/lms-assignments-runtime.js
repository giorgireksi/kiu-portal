/* LMS assignments/workspace runtime extracted from lms.js. */

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

    const createBox = canManage ? `
        <div class="lms-route-panel">
            <div class="lms-route-card-head" style="margin-bottom:16px;">
                <div>
                    <div class="lms-route-card-title"><i class="fas fa-square-plus"></i> Create Homework</div>
                    <div class="lms-route-copy" style="margin-top:6px;">Publish assignments for this exact LMS group. Students in the same group will see the same work and submit back here.</div>
                </div>
                <div id="${assignmentLabelId}" class="lms-route-pill">No attachment selected</div>
            </div>
            <div class="lms-route-field-grid">
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-asm-title">Homework Title</label>
                    <input type="text" id="new-asm-title" class="lms-route-input" placeholder="Homework title">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-asm-deadline">Deadline</label>
                    <input type="datetime-local" id="new-asm-deadline" class="lms-route-input">
                </div>
                <div class="lms-route-field">
                    <label class="lms-route-field-label" for="new-asm-week">Teaching Week</label>
                    <select id="new-asm-week" class="lms-route-select">
                        ${buildLmsWeekSelectOptions(resourceKey, '')}
                    </select>
                </div>
            </div>
            <div class="lms-route-field" style="margin-top:14px;">
                <label class="lms-route-field-label" for="new-asm-description">Description</label>
                <textarea id="new-asm-description" class="lms-route-textarea" placeholder="Homework description, instructions, grading notes..."></textarea>
            </div>
            <div class="lms-route-field" style="margin-top:14px;">
                <label class="lms-route-field-label" for="new-asm-rubric">Rubric</label>
                <textarea id="new-asm-rubric" class="lms-route-textarea" placeholder="Understanding: 40%; Evidence and method: 35%; Clarity: 15%; Timeliness: 10%">Understanding: 40%; Evidence and method: 35%; Clarity: 15%; Timeliness: 10%</textarea>
            </div>
            <label style="display:flex; align-items:center; gap:8px; font-size:13px; color:var(--lux-text); margin-top:14px;">
                <input type="checkbox" id="new-asm-late">
                Allow late submissions
            </label>
            <div class="lms-route-actions" style="margin-top:16px;">
                <button class="kiu-btn-outline" data-lms-click="pickLocalLmsFile('assignment', '${resourceKey}', '${assignmentLabelId}')"><i class="fas fa-paperclip"></i> Upload Assignment File</button>
                <button class="kiu-btn-blue" data-lms-click="createAssignment('${courseId}')"><i class="fas fa-save"></i> Save & Publish Homework</button>
            </div>
        </div>
    ` : '';
    const assignmentWeekBanner = `
        <div class="lms-route-panel" style="padding:16px 20px;">
            <div class="lms-route-card-head">
                <div style="display:flex;align-items:center;gap:12px;">
                    <i class="fas fa-clipboard-list" style="font-size:18px;color:var(--lux-accent-2);"></i>
                    <div>
                        <div class="lms-route-card-title">Assignments</div>
                        <div class="lms-route-copy" style="margin-top:4px;">${assignments.length} homework &middot; ${ensureLmsWeeksForKey(resourceKey).length} weeks &middot; ${canManage ? 'Staff' : 'Student'}</div>
                    </div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${canManage ? '<button class="kiu-btn-outline" data-lms-click="openLmsWeekManagerModal(&#39;' + resourceKey + '&#39;)" style="padding:8px 14px;font-size:12px;"><i class="fas fa-calendar-week"></i> Manage Weeks</button>' : ''}
                </div>
            </div>
        </div>
    `;

    const groupedAssignments = groupLmsItemsByWeek(resourceKey, assignments, assignment => assignment.weekLabel, true);
    const cards = groupedAssignments.length ? groupedAssignments.map(([weekLabel, weekAssignments], weekIndex) => {
        const weekCardHtml = weekAssignments.length ? weekAssignments.map(assignment => {
        const submissionDraftKey = buildLmsSubmissionDraftKey(resourceKey, assignment.id, userId);
        const submissionLabelId = `lms-submission-file-label-${toDomToken(submissionDraftKey)}`;
        const studentSubmission = getLmsAssignmentSubmissions(resourceKey, assignment.id)[userId];
        const submissionEntries = Object.values(getLmsAssignmentSubmissions(resourceKey, assignment.id) || {});
        const submissionStatus = studentSubmission ? `
            <div class="lms-route-pill" style="background:rgba(var(--lux-accent-rgb),0.08); color:var(--lux-accent); border-color:rgba(34,197,94,0.18);">
                <i class="fas fa-check"></i> Submitted ${escapeHtml(formatLmsDateTime(studentSubmission.submittedAt))}
            </div>
        ` : '';
        const studentControls = effectiveRole === USER_ROLES.STUDENT ? `
            <div style="margin-top:16px; padding-top:14px; border-top:1px dashed var(--lux-border);">
                <textarea id="sub-text-${assignment.id}" class="lms-route-textarea" placeholder="Write your homework answer, summary, or notes here..." style="min-height:110px; margin-bottom:12px;">${escapeHtml(studentSubmission?.text || '')}</textarea>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                    <div id="${submissionLabelId}" class="lms-route-pill">
                        ${studentSubmission?.file?.name ? `<i class="fas fa-paperclip"></i> ${escapeHtml(studentSubmission.file.name)}` : 'No homework file selected'}
                    </div>
                    <div class="lms-route-actions">
                        <button class="kiu-btn-outline" data-lms-click="pickLocalLmsFile('submissions', '${submissionDraftKey}', '${submissionLabelId}')"><i class="fas fa-upload"></i> Upload Homework</button>
                        <button class="kiu-btn-blue" data-lms-click="submitAssignment('${courseId}', '${assignment.id}')"><i class="fas fa-paper-plane"></i> ${studentSubmission ? 'Update Submission' : 'Submit Homework'}</button>
                    </div>
                </div>
                ${studentSubmission ? `<div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; margin-top:10px;">${submissionStatus}${studentSubmission.file ? getStoredFileDownloadHtml(studentSubmission.file, 'Download my upload') : ''}</div>` : ''}
            </div>
        ` : '';
        const staffControls = canManage ? `
            <div style="margin-top:16px; padding-top:14px; border-top:1px dashed var(--lux-border); display:flex; flex-direction:column; gap:10px;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                    <div class="lms-route-card-title" style="font-size:14px;">Submissions received: ${submissionEntries.length}</div>
                    <button class="kiu-btn-outline" style="padding:7px 10px; color:var(--lux-red); border-color:rgba(220,38,38,0.18);" data-lms-click="deleteAssignment('${courseId}', '${assignment.id}')"><i class="fas fa-trash"></i> Remove</button>
                </div>
                ${submissionEntries.length ? `
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${submissionEntries.map(entry => `
                            <div class="lms-route-kv">
                                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                                    <div class="lms-route-card-title" style="font-size:14px;">${escapeHtml(entry.studentName || entry.studentId || 'Student')}</div>
                                    <div class="lms-route-meta" style="font-size:11px;">${escapeHtml(formatLmsDateTime(entry.submittedAt))}</div>
                                </div>
                                ${entry.text ? `<div class="lms-route-copy" style="margin-top:8px; white-space:pre-wrap;">${escapeHtml(entry.text)}</div>` : ''}
                                ${entry.feedback ? `<div class="lms-route-kv" style="margin-top:10px;"><div class="lms-route-kv-label">Feedback</div><div class="lms-route-copy" style="margin-top:6px;">${escapeHtml(entry.feedback)}</div></div>` : ''}
                                <div class="lms-route-actions" style="margin-top:10px;">
                                    <button class="kiu-btn-outline" data-lms-click="gradeLmsAssignmentSubmission('${courseId}', '${assignment.id}', '${entry.studentId}')"><i class="fas fa-pen"></i> Grade / feedback</button>
                                    ${Number.isFinite(Number(entry.score)) ? `<span class="lms-route-pill"><i class="fas fa-star"></i> ${escapeHtml(String(entry.score))}/${escapeHtml(String(assignment.maxScore || 100))}</span>` : '<span class="lms-route-pill">Ungraded</span>'}
                                </div>
                                ${entry.file ? `<div style="margin-top:10px;">${getStoredFileDownloadHtml(entry.file, 'Download submission')}</div>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : `<div style="font-size:12px; color:var(--kiu-text-muted);">No student submissions yet for this homework.</div>`}
            </div>
        ` : '';
        return `
            <div class="lms-route-card" style="display:flex; flex-direction:column; gap:12px;">
                <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                    <div>
                        <div class="lms-route-card-title">${escapeHtml(assignment.title)}</div>
                        <div class="lms-route-meta" style="font-size:12px; margin-top:4px;">Due: ${escapeHtml(formatLmsDateTime(assignment.deadline))}</div>
                    </div>
                    ${submissionStatus}
                </div>
                <div class="lms-route-copy" style="white-space:pre-wrap;">${escapeHtml(assignment.description || 'No description added yet.')}</div>
                <div class="lms-route-kv">
                    <div class="lms-route-kv-label">Rubric</div>
                    <div class="lms-route-copy" style="margin-top:6px;">${escapeHtml(assignment.rubric || 'Rubric not configured.')}</div>
                </div>
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap;">
                    <div class="lms-route-meta" style="font-size:11px;">${assignment.lateAllowed ? 'Late submissions allowed' : 'Late submissions closed'}</div>
                    ${assignment.attachment ? getStoredFileDownloadHtml(assignment.attachment, 'Download assignment file') : '<div class="lms-route-meta" style="font-size:11px;">No attachment</div>'}
                </div>
                ${effectiveRole === USER_ROLES.STUDENT ? studentControls : ''}
                ${canManage ? staffControls : ''}
            </div>
        `;
        }).join('') : renderLmsRouteEmptyState('No Homework Yet', 'No homework was uploaded in this week yet.', 'fa-book-open');
        return renderLmsRouteWeekAccordion(
            weekLabel,
            `${weekAssignments.length} homework${weekAssignments.length === 1 ? '' : 's'} in this section`,
            `<div class="lms-route-card-grid" style="grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));">${weekCardHtml}</div>`,
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
    const studentId = getCurrentUserId() || 'mockStudent';
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
    const scoreInput = prompt(`Score out of ${maxScore}`, submission.score ?? '');
    if (scoreInput === null) return;
    const score = Math.max(0, Math.min(maxScore, Number(scoreInput)));
    if (!Number.isFinite(score)) {
        alert('Please enter a valid numeric score.');
        return;
    }
    const feedback = prompt('Feedback for the student', submission.feedback || '') ?? (submission.feedback || '');
    submission.score = score;
    submission.feedback = feedback;
    submission.status = 'graded';
    submission.gradedAt = new Date().toISOString();
    submission.gradedBy = getSimulatedUserName();
    saveState();
    rerenderCurrentLmsTab();
}
