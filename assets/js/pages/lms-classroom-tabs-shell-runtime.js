/* LMS classroom interaction/attendance/enhancement/tab-switch helpers. Peeled from lms-classroom-tabs-runtime.js. Keep LMS_*_MODULE_URLS in host.
 * Load before lms-classroom-tabs-runtime.js.
 */
(function initLmsClassroomTabsShellRuntime() {
    if (window.__KIU_LMS_CLASSROOM_TABS_SHELL_LOADED) return;
    window.__KIU_LMS_CLASSROOM_TABS_SHELL_LOADED = true;

    window.__kiuCreateLmsClassroomTabsShellApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function renderLmsInteractionSection(courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    removeOrphanLmsInteractionMessengerSections(contentArea);
    prepareLmsContentAreaForTab('interaction', contentArea);
    const resourceKey = resolveCanonicalLmsResourceKey(courseId || currentCourseId || '');
    const ctx = getLmsSectionEnhancementContext('interaction', resourceKey);
    const ui = typeof ensureLmsInteractionUiState === 'function' ? ensureLmsInteractionUiState() : { mode: 'announcements' };
    ui.resourceKey = resourceKey;
    const mode = typeof getLmsInteractionMode === 'function' ? getLmsInteractionMode() : 'announcements';
    const modeSwitch = typeof renderLmsInteractionModeSwitch === 'function'
        ? renderLmsInteractionModeSwitch(mode)
        : '';
    const bodyMarkup = typeof renderLmsInteractionBodyMarkup === 'function'
        ? renderLmsInteractionBodyMarkup(resourceKey, mode)
        : `
            <div class="lms-interaction-messenger__body">
                <div id="lms-interaction-stream" class="lms-interaction-messenger__stream" data-lms-interaction-region="stream">
                    ${renderLmsInteractionStreamMarkup(resourceKey)}
                </div>
                <div class="lms-interaction-messenger__composer" data-lms-interaction-region="composer">
                    ${renderLmsInteractionComposerMarkup(resourceKey)}
                </div>
            </div>
        `;
    const headerCopy = typeof getLmsInteractionHeaderCopy === 'function'
        ? getLmsInteractionHeaderCopy(mode)
        : 'Professor and TA announcements with student replies.';
    contentArea.innerHTML = `
        <section class="lms-interaction-messenger ${mode === 'messages' ? 'is-messages-mode' : 'is-announcements-mode'}" data-lms-interaction-resource="${escapeHtml(resourceKey)}">
            <header class="lms-interaction-messenger__head">
                <div class="lms-interaction-messenger__toolbar">
                    <div class="lms-interaction-messenger__toolbar-brand">
                        <div class="lms-interaction-messenger__title">${escapeHtml(ctx.groupLabel)}</div>
                        <div class="lms-interaction-messenger__subtitle">${escapeHtml(headerCopy)}</div>
                    </div>
                    <div class="lms-interaction-messenger__toolbar-modes">
                        ${modeSwitch}
                    </div>
                </div>
            </header>
            ${bodyMarkup}
        </section>
    `;
    if (mode === 'announcements') {
        const stream = document.getElementById('lms-interaction-stream');
        scrollLmsInteractionStreamToBottom(stream);
    } else if (typeof bootstrapKiuRealtimeBridge === 'function') {
        bootstrapKiuRealtimeBridge().catch(() => null);
    }
    if (typeof bindLmsInteractionDelegatedEvents === 'function') {
        bindLmsInteractionDelegatedEvents(contentArea);
    }
    if (typeof stripLmsInteractionBoundFlags === 'function') stripLmsInteractionBoundFlags(contentArea);
    syncLmsInteractionTabCacheFromDom(resourceKey);
    syncLmsInteractionChromeOffset(contentArea);
}

function buildLmsInteractionMessagePayload(text, options = {}) {
    const now = new Date();
    const user = typeof getCurrentUser === 'function' ? (getCurrentUser() || {}) : {};
    const role = getEffectiveUserRole();
    const isStaff = canManageLmsGroupContent();
    return {
        id: createLmsInteractionMessageId(),
        parentId: options.parentId ?? null,
        type: options.type || (options.parentId ? 'reply' : 'announcement'),
        sender: getSimulatedUserName(),
        text,
        time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
        createdAt: now.toISOString(),
        isStaff: isStaff && role !== USER_ROLES.PROFESSOR,
        isProf: role === USER_ROLES.PROFESSOR,
        authorId: String(typeof getCurrentUserId === 'function' ? (getCurrentUserId() || user.id || '') : (user.id || '')),
        bulk: Boolean(options.bulk),
        targetGroupId: options.targetGroupId || '',
        targetGroupName: options.targetGroupName || ''
    };
}

function sendLmsInteractionMessage(courseId = currentCourseId) {
    const resourceKey = resolveCanonicalLmsResourceKey(courseId || currentCourseId || '');
    const input = document.getElementById('lms-interaction-announce-input');
    const text = String(input?.value || '').trim();
    if (!resourceKey || !text) return;
    if (!canPostLmsInteractionAnnouncement()) {
        alert('Only professors and teaching assistants can post announcements.');
        return;
    }
    if (!KIU_STATE.messages || typeof KIU_STATE.messages !== 'object') KIU_STATE.messages = {};
    if (!Array.isArray(KIU_STATE.messages[resourceKey])) KIU_STATE.messages[resourceKey] = [];
    normalizeLmsInteractionMessages(resourceKey);
    KIU_STATE.messages[resourceKey].push(buildLmsInteractionMessagePayload(text, { type: 'announcement' }));
    saveState();
    if (input) input.value = '';
    if (!updateLmsInteractionStreamUi(resourceKey)) {
        renderLmsInteractionSection(resourceKey);
        return;
    }
    const stream = document.getElementById('lms-interaction-stream');
    scrollLmsInteractionStreamToBottom(stream);
}

function toggleLmsInteractionInlineReply(replyId) {
    const composer = document.querySelector(`[data-lms-interaction-inline-compose="${String(replyId).trim()}"]`);
    if (!composer) return;
    const isHidden = composer.hidden;
    document.querySelectorAll('[data-lms-interaction-inline-compose]').forEach(node => { node.hidden = true; });
    if (isHidden) {
        composer.hidden = false;
        const input = composer.querySelector('input');
        if (input) input.focus();
    }
}

function toggleLmsAnnouncementReplies(postId) {
    const id = String(postId || '').trim();
    const composer = Array.from(document.querySelectorAll('[data-lms-interaction-inline-compose]'))
        .find(node => node.getAttribute('data-lms-interaction-inline-compose') === id);
    if (!composer) return;
    const shouldOpen = composer.hidden;
    document.querySelectorAll('[data-lms-interaction-inline-compose]').forEach(node => { node.hidden = true; });
    document.querySelectorAll('.lms-announcement-reply-button').forEach(button => {
        if (button.closest('[data-lms-interaction-thread]')) button.setAttribute('aria-expanded', 'false');
    });
    composer.hidden = !shouldOpen;
    const button = composer.closest('[data-lms-interaction-thread]')?.querySelector('.lms-announcement-actions .lms-announcement-reply-button');
    if (button) button.setAttribute('aria-expanded', String(shouldOpen));
    if (shouldOpen) composer.querySelector('input')?.focus();
}

function sendLmsInteractionReply(resourceKey, parentId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    const normalizedParentId = String(parentId || '').trim();
    if (!canonicalKey || !normalizedParentId) return;
    const input = document.getElementById(`lms-announcement-reply-${toDomToken(canonicalKey)}-${toDomToken(normalizedParentId)}`)
        || document.getElementById(`lms-interaction-reply-${toDomToken(canonicalKey)}-${toDomToken(normalizedParentId)}`);
    const text = String(input?.value || '').trim();
    if (!text) return;
    const parent = normalizeLmsInteractionMessages(canonicalKey).find(message => String(message.id) === normalizedParentId);
    if (!canReplyToLmsInteractionPost(parent)) {
        return;
    }
    if (!KIU_STATE.messages || typeof KIU_STATE.messages !== 'object') KIU_STATE.messages = {};
    if (!Array.isArray(KIU_STATE.messages[canonicalKey])) KIU_STATE.messages[canonicalKey] = [];
    normalizeLmsInteractionMessages(canonicalKey);
    KIU_STATE.messages[canonicalKey].push(buildLmsInteractionMessagePayload(text, {
        parentId: normalizedParentId,
        type: 'reply'
    }));
    saveState();
    if (!updateLmsInteractionStreamUi(canonicalKey)) {
        renderLmsInteractionSection(canonicalKey);
    }
}

function renderLmsAttendanceSection(courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea) return;
    prepareLmsContentAreaForTab('attendance', contentArea);
    const parsed = parseLmsCourseKey(courseId || currentCourseId || '');
    const resourceKey = resolveCanonicalLmsResourceKey(parsed.resourceKey || courseId || currentCourseId || '');
    const today = new Date().toISOString().split('T')[0];
    if (!KIU_STATE.attendance || typeof KIU_STATE.attendance !== 'object') KIU_STATE.attendance = {};
    if (!KIU_STATE.attendance[resourceKey]) KIU_STATE.attendance[resourceKey] = {};
    if (!KIU_STATE.attendance[resourceKey][today]) KIU_STATE.attendance[resourceKey][today] = {};
    const students = parsed.courseId && parsed.groupId
        ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId)
        : getGradebookGroupsForCurrentUser().flatMap(group => getEnrolledStudentsForGroup(group.courseId, group.groupId));
    const canManage = canManageLmsGroupContent();
    const attendance = KIU_STATE.attendance[resourceKey][today] || {};
    const counts = students.reduce((acc, student) => {
        const status = attendance[student.id] || 'Unmarked';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { Present: 0, Late: 0, Absent: 0, Unmarked: 0 });
    const studentRows = students.length ? students.map(student => {
        const status = attendance[student.id] || '';
        const statusLabel = status || 'Unmarked';
        const statusTone = status === 'Present'
            ? 'is-present'
            : status === 'Late'
                ? 'is-late'
                : status === 'Absent'
                    ? 'is-absent'
                    : 'is-unmarked';
        return `
            <tr>
                <td class="lms-attendance-student-cell">
                    <div class="lms-attendance-student-main">
                        <strong class="lms-attendance-student-name">${escapeHtml(student.name || student.nameEn || student.id)}</strong>
                        <span class="lms-attendance-student-id">${escapeHtml(student.id || '')}</span>
                    </div>
                </td>
                <td class="lms-attendance-status-cell">
                    <span class="lms-attendance-status-badge home-hover-chip ${statusTone}">${escapeHtml(statusLabel)}</span>
                </td>
                <td class="lms-attendance-mark-cell">
                    <select class="lms-route-select lux-control lms-attendance-select" ${canManage ? '' : 'disabled'} data-lms-change="markLmsAttendanceStatus(${lmsInlineArg(resourceKey)}, ${lmsInlineArg(today)}, ${lmsInlineArg(student.id)}, this.value)">
                        <option value="" ${status === '' ? 'selected' : ''}>Unmarked</option>
                        <option value="Present" ${status === 'Present' ? 'selected' : ''}>Present</option>
                        <option value="Late" ${status === 'Late' ? 'selected' : ''}>Late</option>
                        <option value="Absent" ${status === 'Absent' ? 'selected' : ''}>Absent</option>
                    </select>
                </td>
            </tr>
        `;
    }).join('') : `<tr><td colspan="3">No students found for this group.</td></tr>`;
    contentArea.innerHTML = `
        <div class="lms-route-stack">
            <section class="lms-route-hero">
                <div class="lms-route-hero-grid">
                    <div>
                        <div class="lms-route-eyebrow">Attendance</div>
                        <div class="lms-route-title lms-route-title-mt-10"><i class="fas fa-user-check"></i> Daily Attendance</div>
                        <div class="lms-route-copy lms-route-copy-mt-12">Record today&apos;s class presence for this LMS group with the same native LMS interface.</div>
                    </div>
                    ${renderLmsRouteStats([
                        { label: 'Present', value: counts.Present || 0 },
                        { label: 'Late', value: counts.Late || 0 },
                        { label: 'Absent', value: counts.Absent || 0 },
                        { label: 'Unmarked', value: counts.Unmarked || 0 }
                    ])}
                </div>
            </section>
            <section class="lms-route-panel lms-attendance-panel">
                <div class="lms-route-card-head lms-route-card-head-mb-16">
                    <div>
                        <div class="lms-route-card-title">${escapeHtml(today)}</div>
                        <div class="lms-route-copy lms-route-copy-mt-6">${canManage ? 'Staff can update attendance.' : 'Students can view their recorded attendance.'}</div>
                    </div>
                    <span class="lms-route-pill home-hover-chip"><i class="fas fa-users"></i> ${students.length} students</span>
                </div>
                <div class="lms-route-table-shell lms-attendance-table-shell">
                    <table class="kiu-table lms-attendance-table">
                        <thead><tr><th>Student</th><th>Status</th><th>Mark</th></tr></thead>
                        <tbody>${studentRows}</tbody>
                    </table>
                </div>
            </section>
        </div>
    `;
}

function markLmsAttendanceStatus(resourceKey, date, studentId, status) {
    if (!canManageLmsGroupContent()) {
        alert('Only professor, TA, or admin users can update attendance.');
        return;
    }
    const key = resolveCanonicalLmsResourceKey(resourceKey || currentCourseId || '');
    if (!KIU_STATE.attendance || typeof KIU_STATE.attendance !== 'object') KIU_STATE.attendance = {};
    if (!KIU_STATE.attendance[key]) KIU_STATE.attendance[key] = {};
    if (!KIU_STATE.attendance[key][date]) KIU_STATE.attendance[key][date] = {};
    if (status) KIU_STATE.attendance[key][date][studentId] = status;
    else delete KIU_STATE.attendance[key][date][studentId];
    saveState();
    renderLmsAttendanceSection(key);
}

function getLmsSectionEnhancementContext(tab, courseId = currentCourseId) {
    const parsed = parseLmsCourseKey(courseId);
    const resourceKey = resolveCanonicalLmsResourceKey(getLmsTabCourseKey(tab) || courseId || '');
    const role = getEffectiveUserRole();
    const isStaff = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(role);
    const subject = parsed.courseId ? (getDomain().subjectsById?.[parsed.courseId] || KIU_STATE.curriculum?.find(item => item.id === parsed.courseId)) : null;
    const group = parsed.courseId && parsed.groupId ? (KIU_STATE.availableGroups?.[parsed.courseId] || []).find(item => item.id === parsed.groupId) : null;
    const students = parsed.courseId && parsed.groupId ? getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId) : [];
    const assignments = resourceKey && typeof ensureLmsAssignmentsForKey === 'function'
        ? ensureLmsAssignmentsForKey(resourceKey)
        : [];
    const materials = resourceKey && typeof ensureLmsMaterialsForKey === 'function'
        ? ensureLmsMaterialsForKey(resourceKey)
        : [];
    const concepts = resourceKey && typeof ensureLmsConceptsForKey === 'function'
        ? ensureLmsConceptsForKey(resourceKey)
        : [];
    const quizzes = resourceKey && typeof ensureLmsQuizzesForKey === 'function'
        ? ensureLmsQuizzesForKey(resourceKey)
        : [];
    const liveSessions = resourceKey && typeof getLmsLiveSessions === 'function'
        ? getLmsLiveSessions(resourceKey)
        : (resourceKey && typeof window !== 'undefined' && typeof window.getLmsLiveSessions === 'function'
            ? window.getLmsLiveSessions(resourceKey)
            : []);
    const classCalls = resourceKey && typeof ensureLmsClassSessionsForKey === 'function'
        ? ensureLmsClassSessionsForKey(resourceKey)
        : [];
    const markers = resourceKey && typeof getLmsSessionMarkersForGroup === 'function'
        ? getLmsSessionMarkersForGroup(resourceKey)
        : [];
    return {
        tab,
        courseId,
        resourceKey,
        role,
        isStaff,
        subjectLabel: repairLmsDisplayText(subject?.name || parsed.courseId || 'LMS Group', 'LMS Group'),
        groupLabel: repairLmsDisplayText(group?.name || parsed.groupId || 'Group', 'Group'),
        students,
        assignments,
        materials,
        concepts,
        quizzes,
        liveSessions,
        classCalls,
        markers
    };
}

function getLmsSectionEnhancementConfig(ctx) {
    const base = {
        sessions: {
            title: 'Class Sessions'
        },
        calls: {
            title: 'Class Calls Hub'
        },
        members: {
            title: 'Group Members'
        },
        materials: {
            title: 'Learning Materials'
        },
        concepts: {
            title: 'Concept Wiki'
        },
        workspace: {
            title: 'Assignments'
        }
    };
    return base[ctx.tab] || null;
}

function computeLmsMemberRisk(student, ctx) {
    const studentId = String(student.id || '');
    const assignmentTotal = ctx.assignments.length;
    const submittedAssignments = ctx.assignments.filter(item => getLmsAssignmentSubmissions(ctx.resourceKey, item.id)?.[studentId]).length;
    const missingAssignments = Math.max(0, assignmentTotal - submittedAssignments);
    const attendedCalls = ctx.classCalls.filter(call => Array.isArray(call.participantIds) && call.participantIds.map(String).includes(studentId)).length;
    const endedCalls = ctx.classCalls.filter(call => call.status === 'ended').length;
    const quizAnalytics = (typeof ensureLmsQuizzesForKey === 'function' && typeof ensureLmsQuizBuilderWorkspace === 'function')
        ? ensureLmsQuizzesForKey(ctx.resourceKey).map(quiz => ensureLmsQuizBuilderWorkspace(ctx.resourceKey).submissions?.[quiz.id]?.[studentId]).filter(Boolean)
        : [];
    const pendingReviews = quizAnalytics.filter(submission => submission.requiresManualReview === true).length;
    let risk = 0;
    if (assignmentTotal && missingAssignments / assignmentTotal >= 0.5) risk += 35;
    if (endedCalls >= 2 && attendedCalls === 0) risk += 25;
    if (pendingReviews) risk += 15;
    if (!quizAnalytics.length && ctx.quizzes.length) risk += 20;
    const level = risk >= 55 ? 'High risk' : risk >= 25 ? 'Watch' : 'Stable';
    return {
        level,
        risk,
        missingAssignments,
        attendedCalls,
        endedCalls,
        pendingReviews,
        tone: risk >= 55 ? 'danger' : risk >= 25 ? 'pending' : 'success'
    };
}

function renderLmsDeepToolkitCard(title, value, copy = '', icon = 'fa-circle-info', tone = 'info') {
    return `
        <div class="lms-route-card lms-route-panel-compact lms-deep-card is-${escapeHtml(tone)}">
            <div class="lms-deep-card-icon"><i class="fas ${escapeHtml(icon)}"></i></div>
            <div>
                <strong>${escapeHtml(String(value))}</strong>
                <span>${escapeHtml(title)}</span>
                ${copy ? `<p>${escapeHtml(copy)}</p>` : ''}
            </div>
        </div>
    `;
}

function renderLmsDeepToolkitList(items = [], emptyTitle = 'Nothing here yet') {
    if (!items.length) {
        return `
            <div class="lms-deep-empty">
                <i class="fas fa-inbox"></i>
                <strong>${escapeHtml(emptyTitle)}</strong>
                <span>This panel will update automatically when the group has activity.</span>
            </div>
        `;
    }
    return items.map(item => `
        <div class="lms-deep-list-row">
            <div>
                <strong>${escapeHtml(item.title || 'Untitled')}</strong>
                <span>${escapeHtml(item.meta || '')}</span>
            </div>
            <em class="is-${escapeHtml(item.tone || 'info')}">${escapeHtml(item.status || 'Ready')}</em>
        </div>
    `).join('');
}

function renderLmsDeepSectionToolkit(ctx) {
    const materialItems = ctx.materials.slice(0, 8).map(item => ({
        title: item.title || item.file?.name || 'Material',
        meta: joinLmsMeta([item.weekLabel || 'General', item.file?.name || 'Attachment', item.uploadedBy || 'Course staff']),
        status: item.pinned ? 'Pinned' : 'Published',
        tone: item.pinned ? 'success' : 'info'
    }));
    const conceptItems = ctx.concepts.slice(0, 8).map(item => {
        const stats = computeLmsConceptScoreSummary(ctx.resourceKey, item.id);
        return {
            title: item.title || 'Concept',
            meta: joinLmsMeta([item.weekLabel || 'General', `${stats.average || 0}/10 avg`, `${stats.count || 0} rating${stats.count === 1 ? '' : 's'}`]),
            status: item.approved || item.reviewed ? 'Reviewed' : 'Needs review',
            tone: item.approved || item.reviewed ? 'success' : 'pending'
        };
    });
    const memberItems = ctx.students.slice(0, 10).map(student => ({
        title: student.name || student.id,
        meta: (() => {
            const risk = computeLmsMemberRisk(student, ctx);
            return joinLmsMeta([student.id, student.email || student.facultyLabel || 'Student', `${risk.missingAssignments} missing`, `${risk.attendedCalls}/${risk.endedCalls} calls`]);
        })(),
        status: computeLmsMemberRisk(student, ctx).level,
        tone: computeLmsMemberRisk(student, ctx).tone
    }));
    const callItems = ctx.classCalls.slice(0, 6).map(call => ({
        title: call.title || 'Class call',
        meta: joinLmsMeta([call.status || 'scheduled', call.scheduledAt ? formatLmsDateTime(call.scheduledAt) : '', `${call.participantIds?.length || 0} joined`, call.studyPackage?.recordingStatus || (call.roomSettings?.recording ? 'Recording marked' : 'No recording')]),
        status: call.status === 'ended' && call.studyPackage?.recordingStatus ? call.studyPackage.recordingStatus : (call.status || 'Ready'),
        tone: call.status === 'active' ? 'success' : call.status === 'ended' ? 'info' : 'pending'
    }));
    const sessionItems = ctx.markers.slice(0, 8).map(marker => ({
        title: marker.title || marker.label || LMS_SESSION_MARKER_TYPES[marker.type]?.label || 'Session marker',
        meta: joinLmsMeta([marker.weekLabel || 'General', marker.date || marker.startsAt || '', marker.description || '']),
        status: LMS_SESSION_MARKER_TYPES[marker.type]?.label || 'Marked',
        tone: LMS_SESSION_MARKER_TYPES[marker.type]?.tone || 'info'
    }));

    const tabPanels = {
        sessions: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Upcoming markers', sessionItems.length, 'Session timeline entries and classroom moments.', 'fa-calendar-days', 'info')}
                ${renderLmsDeepToolkitCard('Attendance roster', ctx.students.length, 'Available for staff-controlled class tracking.', 'fa-user-check', 'success')}
                ${renderLmsDeepToolkitCard('Linked quizzes', ctx.quizzes.length, 'Quizzes can be connected to session milestones.', 'fa-pen-to-square', 'pending')}
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-deep-panel">${renderLmsDeepToolkitList(sessionItems, 'No session markers yet')}</div>
        `,
        calls: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Calls', ctx.classCalls.length, 'Scheduled, live, and ended classroom calls.', 'fa-video', 'info')}
                ${renderLmsDeepToolkitCard('Live now', ctx.classCalls.some(call => call.status === 'active') ? 'Active' : 'None', 'Students see join/waiting state clearly.', 'fa-signal', 'success')}
                ${renderLmsDeepToolkitCard('Recordings', ctx.classCalls.filter(call => call.recordingUrl).length, 'Recording links appear after class.', 'fa-record-vinyl', 'pending')}
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-deep-panel">${renderLmsDeepToolkitList(callItems, 'No calls scheduled yet')}</div>
        `,
        members: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Students', ctx.students.length, 'Roster, grade risk, attendance, and participation.', 'fa-users', 'info')}
                ${renderLmsDeepToolkitCard('High risk', memberItems.filter(item => item.tone === 'danger').length, 'Missing work, attendance, and quiz signals.', 'fa-triangle-exclamation', memberItems.some(item => item.tone === 'danger') ? 'danger' : 'success')}
                ${renderLmsDeepToolkitCard('Watch list', memberItems.filter(item => item.tone === 'pending').length, 'Students needing early attention.', 'fa-filter', 'pending')}
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-deep-panel">${renderLmsDeepToolkitList(memberItems, 'No enrolled members found')}</div>
        `,
        materials: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Files', ctx.materials.length, 'Slides, readings, recordings, and attachments.', 'fa-folder-open', 'info')}
                ${renderLmsDeepToolkitCard('Weeks', new Set(ctx.materials.map(item => item.weekLabel).filter(Boolean)).size, 'Materials are organized by teaching week.', 'fa-calendar-week', 'success')}
                ${renderLmsDeepToolkitCard('Pinned resources', ctx.materials.filter(item => item.pinned).length, 'Important material can stay visible.', 'fa-thumbtack', 'pending')}
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-deep-panel">${renderLmsDeepToolkitList(materialItems, 'No materials uploaded yet')}</div>
        `,
        concepts: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Concept notes', ctx.concepts.length, 'Shared definitions and explanations.', 'fa-lightbulb', 'info')}
                ${renderLmsDeepToolkitCard('Reviewed', ctx.concepts.filter(item => item.reviewed || item.approved).length, 'Staff-approved explanations.', 'fa-circle-check', 'success')}
                ${renderLmsDeepToolkitCard('Peer scoring', '5-10', 'Students can rate helpful concepts.', 'fa-star', 'pending')}
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-deep-panel">${renderLmsDeepToolkitList(conceptItems, 'No concepts shared yet')}</div>
        `,
        workspace: `
            <div class="lms-deep-grid">
                ${renderLmsDeepToolkitCard('Homework', ctx.assignments.length, 'Published assignments organized by teaching week.', 'fa-clipboard-list', 'info')}
                ${renderLmsDeepToolkitCard('Students', ctx.students.length, 'Submission and review status per enrolled learner.', 'fa-user-graduate', 'success')}
                ${renderLmsDeepToolkitCard('Weeks', typeof ensureLmsWeeksForKey === 'function' && ctx.resourceKey ? ensureLmsWeeksForKey(ctx.resourceKey).length : 0, 'Accordion sections mirror the course week plan.', 'fa-calendar-week', 'pending')}
            </div>
            <div class="lms-route-card lms-route-panel-compact lms-deep-panel">${renderLmsDeepToolkitList(ctx.assignments.slice(0, 8).map(item => ({
                title: item.title || 'Assignment',
                meta: joinLmsMeta([item.weekLabel || 'General', item.deadline ? formatLmsDateTime(item.deadline) : 'No deadline']),
                status: item.published === false ? 'Draft' : 'Published',
                tone: item.published === false ? 'pending' : 'info'
            })), 'No homework published yet')}</div>
        `
    };
    const panel = tabPanels[ctx.tab];
    if (!panel) return '';
    return `
        <section class="lms-route-panel lms-route-panel-compact lms-deep-toolkit" data-lms-deep-toolkit="${escapeHtml(ctx.tab)}">
            <div class="lms-deep-head">
                <div>
                    <div class="lms-pro-kicker">Operational Workspace</div>
                    <h3>${escapeHtml(getLmsSectionEnhancementConfig(ctx).title)} tools</h3>
                </div>
                <span>${ctx.isStaff ? 'Staff workflow' : 'Student workflow'}</span>
            </div>
            ${panel}
        </section>
    `;
}

function cleanupLmsInjectedEnhancementBlocks(contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return;
    contentArea.querySelectorAll('[data-lms-deep-toolkit]').forEach(node => node.remove());
}

let lmsTabRenderSequence = 0;
const LMS_TAB_RENDER_CACHE = Object.create(null);
const LMS_TAB_RENDER_CACHE_TTL_MS = 15000;

function buildLmsTabRenderCacheKey(tab, courseKey, sectionType) {
    const role = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (typeof currentUserRole !== 'undefined' ? currentUserRole : 'student');
    return `${String(tab || '')}::${String(courseKey || '')}::${String(sectionType || '')}::${role}`;
}

function clearLmsTabRenderCache() {
    Object.keys(LMS_TAB_RENDER_CACHE).forEach((key) => {
        delete LMS_TAB_RENDER_CACHE[key];
    });
}

function setLmsTabRenderCache(cacheKey, markup) {
    if (!cacheKey || !String(markup || '').trim()) return;
    LMS_TAB_RENDER_CACHE[cacheKey] = {
        markup: String(markup),
        cachedAt: Date.now()
    };
}

function getLmsTabRenderCache(cacheKey) {
    const entry = LMS_TAB_RENDER_CACHE[cacheKey];
    if (!entry) return '';
    if (typeof entry === 'string') return entry;
    if (Date.now() - Number(entry.cachedAt || 0) > LMS_TAB_RENDER_CACHE_TTL_MS) {
        delete LMS_TAB_RENDER_CACHE[cacheKey];
        return '';
    }
    return String(entry.markup || '');
}

function invalidateLmsLiveQuizTabCache(resourceKey = '') {
    const courseKey = typeof getLmsTabCourseKey === 'function'
        ? (resourceKey || getLmsTabCourseKey('live-quiz'))
        : (resourceKey || currentCourseId || '');
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : (normalizeLmsSectionType(currentLmsSectionType) || 'lecture');
    const normalizedCourseKey = String(
        typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(courseKey)
            : courseKey
    );
    const cacheKey = buildLmsTabRenderCacheKey('live-quiz', normalizedCourseKey, sectionType);
    delete LMS_TAB_RENDER_CACHE[cacheKey];
}

function invalidateLmsWhiteboardTabCache(resourceKey = '') {
    const courseKey = typeof getLmsTabCourseKey === 'function'
        ? (resourceKey || getLmsTabCourseKey('whiteboard'))
        : (resourceKey || currentCourseId || '');
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : (normalizeLmsSectionType(currentLmsSectionType) || 'lecture');
    const normalizedCourseKey = String(
        typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(courseKey)
            : courseKey
    );
    const cacheKey = buildLmsTabRenderCacheKey('whiteboard', normalizedCourseKey, sectionType);
    delete LMS_TAB_RENDER_CACHE[cacheKey];
}

function invalidateLmsInteractionTabCache(resourceKey = '') {
    const courseKey = typeof getLmsTabCourseKey === 'function'
        ? (resourceKey || getLmsTabCourseKey('interaction'))
        : (resourceKey || currentCourseId || '');
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : (normalizeLmsSectionType(currentLmsSectionType) || 'lecture');
    const normalizedCourseKey = String(
        typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(courseKey)
            : courseKey
    );
    const cacheKey = buildLmsTabRenderCacheKey('interaction', normalizedCourseKey, sectionType);
    delete LMS_TAB_RENDER_CACHE[cacheKey];
}

function syncLmsInteractionTabCacheFromDom(resourceKey = '') {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || contentArea.dataset.activeLmsTab !== 'interaction') return;
    const courseKey = String(
        typeof resolveCanonicalLmsResourceKey === 'function'
            ? resolveCanonicalLmsResourceKey(resourceKey || currentCourseId || '')
            : (resourceKey || currentCourseId || '')
    );
    const sectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : (normalizeLmsSectionType(currentLmsSectionType) || 'lecture');
    syncLmsTabRenderCacheFromDom('interaction', courseKey, sectionType);
}

function prepareLmsContentAreaForTab(tab, contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return 0;
    cleanupLmsInjectedEnhancementBlocks(contentArea);
    if (tab !== 'gradebook') {
        contentArea.innerHTML = '';
        contentArea.hidden = false;
        contentArea.style.removeProperty('display');
        delete contentArea.dataset.enhancedLmsTab;
        delete contentArea.dataset.lmsInteractionDelegatedBound;
        delete contentArea.dataset.lmsLiveBlurBound;
    }
    lmsTabRenderSequence += 1;
    contentArea.dataset.activeLmsTab = String(tab || '');
    contentArea.dataset.lmsRenderToken = String(lmsTabRenderSequence);
    contentArea.classList.remove('lms-tab-sessions', 'lms-tab-live-quiz', 'lms-tab-interaction', 'lms-tab-calls', 'lms-tab-whiteboard', 'lms-tab-members', 'lms-tab-materials', 'lms-tab-concepts', 'lms-tab-quiz', 'lms-tab-monitoring', 'lms-tab-workspace', 'lms-tab-attendance');
    if (tab) contentArea.classList.add(`lms-tab-${String(tab).replace(/[^a-z0-9-]/gi, '-')}`);
    return lmsTabRenderSequence;
}

function isLmsRenderCurrent(tab, token, contentArea = document.getElementById('lms-content-area')) {
    if (!contentArea) return false;
    return contentArea.dataset.activeLmsTab === String(tab || '') && contentArea.dataset.lmsRenderToken === String(token || '');
}

function syncLmsTabRenderCacheFromDom(tab, courseKey, sectionType) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || tab === 'gradebook') return;
    if (tab === 'interaction' && typeof stripLmsInteractionBoundFlags === 'function') {
        stripLmsInteractionBoundFlags(contentArea);
    }
    const cacheKey = buildLmsTabRenderCacheKey(tab, courseKey, sectionType);
    setLmsTabRenderCache(cacheKey, contentArea.innerHTML);
}

function enhanceLmsTabExperience(tab, courseId = currentCourseId) {
    const contentArea = document.getElementById('lms-content-area');
    if (!contentArea || tab === 'gradebook') return;
    cleanupLmsInjectedEnhancementBlocks(contentArea);
    contentArea.dataset.enhancedLmsTab = String(tab || '');
    contentArea.querySelectorAll('.lms-route-empty').forEach(empty => {
        if (empty.closest('.lms-week-accordion-body, .lms-week-accordion-empty')) return;
        empty.classList.add('lms-pro-empty');
    });
    contentArea.querySelectorAll('.lms-route-panel, .lms-route-card, .lms-route-hero, .course-card').forEach(card => {
        if (card.classList.contains('lms-week-accordion-panel')) return;
        card.classList.add('lms-pro-surface');
    });
    const hoverChipSkipSelector = '.lms-interaction-messenger, [data-lux-glass-root="1"], .lms-whiteboard-shell, .lms-whiteboard-stage';
    contentArea.querySelectorAll('.lms-route-card:not(.lms-week-accordion-panel), .lms-call-classroom').forEach(el => {
        if (el.closest(hoverChipSkipSelector)) return;
        if (el.closest('.lms-week-accordion-body') && el.classList.contains('lms-route-card')) return;
        if (!el.classList.contains('home-hover-chip')) el.classList.add('home-hover-chip');
    });
    contentArea.querySelectorAll('.lms-route-panel.lms-session-marker-board, .lms-route-pill, .lms-session-marker-type-chip, .lms-session-marker-slot, .lms-member-row, .lms-member-overview-panel').forEach(el => {
        if (el.closest(hoverChipSkipSelector)) return;
        if (!el.classList.contains('home-hover-chip')) el.classList.add('home-hover-chip');
    });
    syncAllLmsRouteTabHoverChips();
}

function syncLmsRouteTabHoverChip(tab) {
    if (!tab?.classList) return;
    tab.classList.toggle('home-hover-chip', !tab.classList.contains('is-active'));
}

function syncAllLmsRouteTabHoverChips() {
    document.querySelectorAll('#page-lms-inner [data-lms-tab]').forEach(syncLmsRouteTabHoverChip);
}

function markLmsTabSwitchPhase(tab, phase) {
    if (typeof window.markPortalNavigationPhase !== 'function') return;
    window.markPortalNavigationPhase(`lms-tab:${String(tab || '').trim().toLowerCase()}`, phase);
}

function switchLMSTab(tab, options = {}) {
    const tabTimingKey = `lms-tab:${String(tab || '').trim().toLowerCase()}`;
    if (typeof window.markPortalNavigationIntent === 'function') {
        window.markPortalNavigationIntent(tabTimingKey);
    }
    const forceRender = options.force === true;
    const contentAreaBeforeSwitch = document.getElementById('lms-content-area');
    const leavingLiveQuiz = contentAreaBeforeSwitch?.dataset?.activeLmsTab === 'live-quiz' && tab !== 'live-quiz';
    if (leavingLiveQuiz && typeof flushLmsLiveQuizSync === 'function') {
        const flushKey = typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('live-quiz') : currentCourseId;
        const shouldFlush = typeof shouldSyncLmsLiveQuizWorkspace === 'function'
            ? shouldSyncLmsLiveQuizWorkspace(flushKey)
            : true;
        if (shouldFlush) {
            flushLmsLiveQuizSync(flushKey);
        }
    }
    const leavingWhiteboard = contentAreaBeforeSwitch?.dataset?.activeLmsTab === 'whiteboard' && tab !== 'whiteboard';
    if (leavingWhiteboard) {
        document.body?.classList.remove('kiu-lms-whiteboard-session-active');
        if (typeof exitLmsWhiteboardFullscreen === 'function') exitLmsWhiteboardFullscreen();
        if (typeof resetLmsWhiteboardCollabForTabLeave === 'function') resetLmsWhiteboardCollabForTabLeave();
        if (typeof flushLmsWhiteboardSync === 'function') {
            const flushKey = typeof getLmsTabCourseKey === 'function' ? getLmsTabCourseKey('whiteboard') : currentCourseId;
            flushLmsWhiteboardSync(flushKey);
        }
    }
    if (typeof closeLmsQuizOverlays === 'function') {
        closeLmsQuizOverlays();
    } else if (typeof window !== 'undefined' && typeof window.closeLmsQuizOverlays === 'function') {
        window.closeLmsQuizOverlays();
    } else {
        // Quiz module may still be lazy; drop any leftover overlay nodes safely.
        ['lms-quiz-board-modal', 'lms-quiz-review-board-modal', 'lms-quiz-review-modal', 'lms-quiz-subject-library-modal', 'lms-quiz-preview-modal', 'lms-quiz-access-overlay'].forEach((id) => {
            const overlay = document.getElementById(id);
            if (overlay && typeof window.closeLuxGlassDialogOverlay === 'function') {
                window.closeLuxGlassDialogOverlay(overlay, { instant: true });
            } else {
                overlay?.remove();
            }
        });
    }
    if (typeof refreshLmsQuizTabPresentation === 'function') {
        refreshLmsQuizTabPresentation();
    }
    syncLmsSectionSwitchPresentation();
    const effectiveRole = getEffectiveUserRole();
    if (tab === 'monitoring' && ![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole)) {
        alert('Only professors, teaching assistants, and admins can open this tab.');
        markLmsTabSwitchPhase(tab, 'content-ready');
        return;
    }
    if (typeof window.persistLmsStandaloneViewState === 'function') {
        window.persistLmsStandaloneViewState({ tab });
    }
    if (tab !== 'quiz') {
        currentLmsQuizCourseKey = '';
    }
    document.querySelectorAll('#page-lms-inner [data-lms-tab]').forEach(el => {
        el.classList.remove('is-active');
        el.setAttribute('aria-pressed', 'false');
    });
    const tabEl = document.getElementById(`tab-${tab}`);
    if (tabEl) {
        tabEl.classList.add('is-active');
        tabEl.setAttribute('aria-pressed', 'true');
        tabEl.scrollIntoView?.({ block: 'nearest', inline: 'center' });
    }
    syncAllLmsRouteTabHoverChips();
    const contentArea = document.getElementById('lms-content-area');
    const gbWrapper = ensureLmsGradebookShell();
    const tabCourseKey = getLmsTabCourseKey(tab);
    const normalizedCourseKey = String(tabCourseKey || currentCourseId || '');
    const activeSectionType = typeof getCurrentLmsSectionType === 'function'
        ? getCurrentLmsSectionType()
        : normalizeLmsSectionType(currentLmsSectionType) || 'lecture';
    const cacheKey = buildLmsTabRenderCacheKey(tab, normalizedCourseKey, activeSectionType);
    setLmsWorkspacePanel(tab === 'gradebook' ? 'gradebook' : 'content');
    const gradebookVisible = isLmsElementShown(gbWrapper);
    const contentVisible = isLmsElementShown(contentArea);
    const panelsExclusive = (gradebookVisible && !contentVisible) || (!gradebookVisible && contentVisible);
    if (
        !forceRender
        && panelsExclusive
        && contentArea
        && contentArea.dataset.activeLmsTab === String(tab || '')
        && contentArea.dataset.activeLmsCourseKey === normalizedCourseKey
        && contentArea.dataset.activeLmsSectionType === activeSectionType
        && !contentArea.querySelector('[data-lms-tab-loading]')
        && ((tab === 'gradebook' && gradebookVisible) || (tab !== 'gradebook' && contentVisible))
    ) {
        const currentTabButton = document.getElementById(`tab-${tab}`);
        if (currentTabButton) {
            currentTabButton.classList.add('is-active');
            currentTabButton.setAttribute('aria-pressed', 'true');
            currentTabButton.scrollIntoView?.({ block: 'nearest', inline: 'center' });
        }
        syncLmsWorkspaceChromeOffset(contentArea);
        if (tab === 'whiteboard') {
            const shell = contentArea?.querySelector('.lms-whiteboard-shell');
            if (shell && typeof scheduleLmsWhiteboardLayoutRecovery === 'function') {
                scheduleLmsWhiteboardLayoutRecovery(shell, normalizedCourseKey);
            }
        }
        if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
        markLmsTabSwitchPhase(tab, 'content-ready');
        return;
    }

    if (tab === 'gradebook') {
        const finishGradebookTab = () => {
            if (typeof bindStandaloneGradebookShell === 'function') {
                bindStandaloneGradebookShell();
            }
            if (gbWrapper) {
                const parsed = parseLmsCourseKey(currentCourseId);
                if (parsed.courseId && parsed.groupId && typeof openGradebookSection === 'function') {
                    openGradebookSection(parsed.courseId, parsed.groupId, document.getElementById('lms-course-title')?.innerText || 'Grades');
                } else if (typeof renderGradebookRosterSelection === 'function') {
                    const spreadsheetShell = typeof resolveGradebookSpreadsheetShell === 'function'
                        ? resolveGradebookSpreadsheetShell()
                        : document.getElementById('gradebook-spreadsheet-view');
                    setLmsElementShown(spreadsheetShell, false);
                    setLmsElementShown(document.getElementById('gradebook-roster-selection'), true, 'block');
                    renderGradebookRosterSelection();
                }
            }
            if (contentArea) {
                contentArea.dataset.activeLmsTab = 'gradebook';
                contentArea.dataset.activeLmsCourseKey = normalizedCourseKey;
                contentArea.dataset.activeLmsSectionType = activeSectionType;
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            markLmsTabSwitchPhase(tab, 'content-ready');
        };

        const runtimeReady = typeof isLmsGradebookRuntimeReady === 'function'
            ? isLmsGradebookRuntimeReady()
            : (typeof openGradebookSection === 'function' || typeof renderGradebookRosterSelection === 'function');

        if (!runtimeReady && typeof ensureLmsGradebookRuntime === 'function') {
            if (gbWrapper && !gbWrapper.dataset.gradebookLoading) {
                gbWrapper.dataset.gradebookLoading = '1';
                const loadingHost = document.getElementById('gradebook-roster-selection') || gbWrapper;
                if (loadingHost && !loadingHost.querySelector('[data-lms-gradebook-loading="1"]')) {
                    loadingHost.insertAdjacentHTML(
                        'afterbegin',
                        '<div class="lms-route-empty lms-route-empty--full-span" data-lms-gradebook-loading="1"><div class="lms-route-empty-title">Loading gradebook…</div><div class="lms-route-empty-copy">Preparing roster and grading tools.</div></div>'
                    );
                }
            }
            ensureLmsGradebookRuntime()
                .then(() => {
                    if (gbWrapper) delete gbWrapper.dataset.gradebookLoading;
                    gbWrapper?.querySelectorAll?.('[data-lms-gradebook-loading="1"]')?.forEach((node) => node.remove());
                    finishGradebookTab();
                })
                .catch(() => {
                    if (gbWrapper) delete gbWrapper.dataset.gradebookLoading;
                    const host = document.getElementById('gradebook-roster-selection') || gbWrapper;
                    if (host) {
                        host.querySelectorAll?.('[data-lms-gradebook-loading="1"]')?.forEach((node) => node.remove());
                        host.insertAdjacentHTML(
                            'afterbegin',
                            '<div class="lms-route-empty lms-route-empty--full-span" data-lms-gradebook-loading="1"><div class="lms-route-empty-title">Gradebook could not load</div><div class="lms-route-empty-copy">Retry the Grades tab to load grading tools.</div></div>'
                        );
                    }
                    // Leave activeLmsTab unset so a re-click can retry the load.
                    if (contentArea) {
                        delete contentArea.dataset.activeLmsTab;
                    }
                    syncLmsWorkspaceChromeOffset(contentArea);
                    if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
                });
            return;
        }

        finishGradebookTab();
        markLmsTabSwitchPhase(tab, 'content-ready');
        return;
    }
    prepareLmsContentAreaForTab(tab, contentArea);
    if (contentArea) {
        contentArea.dataset.activeLmsCourseKey = normalizedCourseKey;
        contentArea.dataset.activeLmsSectionType = activeSectionType;
        if (forceRender) {
            delete LMS_TAB_RENDER_CACHE[cacheKey];
        }
        const cacheOnlyTabEligible = tab !== 'live-quiz' && tab !== 'interaction' && tab !== 'whiteboard' && tab !== 'quiz' && tab !== 'monitoring' && LMS_TAB_RENDER_CACHE[cacheKey];
        const cachedMarkup = !forceRender && cacheOnlyTabEligible
            ? getLmsTabRenderCache(cacheKey)
            : '';
        if (cachedMarkup) {
            contentArea.innerHTML = cachedMarkup;
            enhanceLmsTabExperience(tab, tabCourseKey || currentCourseId);
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            markLmsTabSwitchPhase(tab, 'content-ready');
            return;
        }
        if (tab === 'live-quiz' || tab === 'interaction' || tab === 'whiteboard' || tab === 'quiz' || tab === 'monitoring') {
            delete LMS_TAB_RENDER_CACHE[cacheKey];
        }
    }

    if (tab === 'sessions') {
        renderLmsSessionsSection(currentCourseId);
    } else if (tab === 'live-quiz') {
        if (typeof renderLmsLiveQuizSection !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="live-quiz"><div class="lms-route-empty-title">Loading live quiz…</div><div class="lms-route-empty-copy">Preparing session tools.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsLiveQuizRuntime()
                .then(() => switchLMSTab('live-quiz', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Live quiz tools failed to load. Retry the Live Quiz tab.</div>';
                    }
                });
            return;
        }
        renderLmsLiveQuizSection(tabCourseKey);
    } else if (tab === 'interaction') {
        if (typeof ensureLmsInteractionUiState !== 'function'
            || typeof renderLmsInteractionBodyMarkup !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="interaction"><div class="lms-route-empty-title">Loading interaction…</div><div class="lms-route-empty-copy">Preparing class chat and announcements.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsInteractionRuntime()
                .then(() => switchLMSTab('interaction', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Interaction tools failed to load. Retry the Interaction tab.</div>';
                    }
                });
            return;
        }
        renderLmsInteractionSection(tabCourseKey || currentCourseId);
    } else if (tab === 'calls') {
        if (typeof renderLmsCallsSection !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="calls"><div class="lms-route-empty-title">Loading calls…</div><div class="lms-route-empty-copy">Preparing class session tools.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsCallsRuntime()
                .then(() => switchLMSTab('calls', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Call tools failed to load. Retry the Calls tab.</div>';
                    }
                });
            return;
        }
        renderLmsCallsSection(tabCourseKey);
    } else if (tab === 'whiteboard') {
        if (typeof renderLmsWhiteboardSection !== 'function' && typeof ensureLmsWhiteboardRuntime === 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="whiteboard"><div class="lms-route-empty-title">Loading whiteboard…</div><div class="lms-route-empty-copy">Preparing canvas tools.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsWhiteboardRuntime()
                .then(() => switchLMSTab('whiteboard', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Whiteboard tools failed to load. Retry the Whiteboard tab.</div>';
                    }
                });
            return;
        }
        const portalToken = typeof getPortalSessionToken === 'function' ? String(getPortalSessionToken() || '').trim() : '';
        if (portalToken && typeof fetchPortalBackendSession === 'function' && typeof storePortalBackendAuth === 'function') {
            fetchPortalBackendSession(portalToken)
                .then((payload) => {
                    if (payload?.account && payload?.session) {
                        storePortalBackendAuth(payload.account, payload.session);
                        if (typeof loadAuthState === 'function') loadAuthState();
                    }
                })
                .catch(() => {});
        }
        if (typeof resetLmsWhiteboardAccessState === 'function') {
            resetLmsWhiteboardAccessState(tabCourseKey);
        }
        if (typeof renderLmsWhiteboardSection === 'function') {
            renderLmsWhiteboardSection(tabCourseKey, { skipLoad: true });
        } else if (contentArea) {
            contentArea.innerHTML = '<div class="lms-live-copy is-danger">Whiteboard tools failed to load. Refresh the page.</div>';
        }
        if (typeof loadLmsWhiteboardWorkspace === 'function') {
            loadLmsWhiteboardWorkspace(tabCourseKey, { force: true })?.then?.(() => {
                if (typeof finalizeLmsWhiteboardSectionRender === 'function') {
                    finalizeLmsWhiteboardSectionRender(tabCourseKey, { fitOnce: true });
                }
            });
        }
    } else if (tab === 'members') {
        renderLmsMembersSection(currentCourseId);
    } else if (tab === 'materials') {
        if (typeof renderLmsMaterialsLibrary !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="materials"><div class="lms-route-empty-title">Loading materials…</div><div class="lms-route-empty-copy">Preparing the materials library.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsContentRuntime()
                .then(() => switchLMSTab('materials', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Materials tools failed to load. Retry the Materials tab.</div>';
                    }
                });
            return;
        }
        if (contentArea) {
            prepareLmsContentAreaForTab('materials', contentArea);
            contentArea.innerHTML = renderLmsMaterialsLibrary(tabCourseKey);
        }
    } else if (tab === 'concepts') {
        if (typeof renderLmsConceptsLibrary !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="concepts"><div class="lms-route-empty-title">Loading concepts…</div><div class="lms-route-empty-copy">Preparing the concept library.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsContentRuntime()
                .then(() => switchLMSTab('concepts', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Concept tools failed to load. Retry the Concepts tab.</div>';
                    }
                });
            return;
        }
        renderLmsConceptsLibrary(tabCourseKey);
    } else if (tab === 'quiz') {
        const renderQuiz = typeof window.renderLmsQuizSection === 'function'
            ? window.renderLmsQuizSection
            : (typeof renderLmsQuizSection === 'function' ? renderLmsQuizSection : null);
        if (!renderQuiz) {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="quiz"><div class="lms-route-empty-icon"><i class="fas fa-pen-to-square"></i></div><div class="lms-route-empty-title">Loading quizzes…</div><div class="lms-route-empty-copy">Preparing the quiz workspace.</div></div>';
                enhanceLmsTabExperience('quiz', tabCourseKey || currentCourseId);
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            const quizRuntimeEnsure = typeof ensureLmsQuizRuntime === 'function'
                ? ensureLmsQuizRuntime
                : (typeof window.ensureLmsQuizRuntime === 'function' ? window.ensureLmsQuizRuntime : null);
            if (!quizRuntimeEnsure) {
                if (contentArea) {
                    contentArea.innerHTML = '<div class="lms-live-copy is-danger">Quiz tools failed to load. Refresh the page.</div>';
                }
                markLmsTabSwitchPhase(tab, 'content-ready');
                return;
            }
            quizRuntimeEnsure()
                .then(() => {
                    delete LMS_TAB_RENDER_CACHE[cacheKey];
                    if (typeof window.renderLmsQuizSection === 'function') {
                        if (effectiveRole === USER_ROLES.STUDENT) {
                            const studentQuizKey = (typeof window.resolveLmsQuizWorkspace === 'function'
                                ? window.resolveLmsQuizWorkspace(tabCourseKey)?.resourceKey
                                : null)
                                || (typeof resolveLmsQuizWorkspace === 'function'
                                    ? resolveLmsQuizWorkspace(tabCourseKey)?.resourceKey
                                    : null)
                                || (typeof resolveCanonicalLmsResourceKey === 'function'
                                    ? resolveCanonicalLmsResourceKey(tabCourseKey || '')
                                    : '');
                            if (studentQuizKey && typeof ensureLmsQuizUiState === 'function') {
                                ensureLmsQuizUiState(studentQuizKey).studentQuizId = null;
                            }
                        }
                        window.renderLmsQuizSection(tabCourseKey);
                        if (contentArea && !contentArea.querySelector('[data-lms-tab-loading]')) {
                            setLmsTabRenderCache(cacheKey, contentArea.innerHTML);
                            contentArea.dataset.activeLmsSectionType = activeSectionType;
                        }
                        enhanceLmsTabExperience('quiz', tabCourseKey || currentCourseId);
                        syncLmsWorkspaceChromeOffset(contentArea);
                        if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
                        markLmsTabSwitchPhase(tab, 'content-ready');
                        return;
                    }
                    switchLMSTab('quiz', { force: true });
                })
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Quiz tools failed to load. Retry the Quizzes tab.</div>';
                    }
                });
            return;
        }
        if (effectiveRole === USER_ROLES.STUDENT) {
            const studentQuizKey = (typeof resolveLmsQuizWorkspace === 'function'
                ? resolveLmsQuizWorkspace(tabCourseKey)?.resourceKey
                : null)
                || (typeof resolveCanonicalLmsResourceKey === 'function'
                    ? resolveCanonicalLmsResourceKey(tabCourseKey || '')
                    : '');
            if (studentQuizKey && typeof ensureLmsQuizUiState === 'function') {
                ensureLmsQuizUiState(studentQuizKey).studentQuizId = null;
            }
        }
        renderQuiz(tabCourseKey);
    } else if (tab === 'monitoring') {
        if (typeof renderLmsMonitoringSection !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="monitoring"><div class="lms-route-empty-title">Loading monitoring…</div><div class="lms-route-empty-copy">Preparing protected-exam tools.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            const quizRuntimeEnsure = typeof ensureLmsQuizRuntime === 'function'
                ? ensureLmsQuizRuntime
                : (typeof window.ensureLmsQuizRuntime === 'function' ? window.ensureLmsQuizRuntime : null);
            if (!quizRuntimeEnsure) {
                if (contentArea) {
                    contentArea.innerHTML = '<div class="lms-live-copy is-danger">Monitoring tools failed to load. Refresh the page.</div>';
                }
                markLmsTabSwitchPhase(tab, 'content-ready');
                return;
            }
            quizRuntimeEnsure()
                .then(() => switchLMSTab('monitoring', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Monitoring tools failed to load. Retry the Monitoring tab.</div>';
                    }
                });
            return;
        }
        renderLmsMonitoringSection(tabCourseKey);
    } else if (tab === 'workspace') {
        if (typeof renderWorkspace !== 'function') {
            if (contentArea) {
                contentArea.innerHTML = '<div class="lms-route-empty lms-route-empty--full-span" data-lms-tab-loading="workspace"><div class="lms-route-empty-title">Loading assignments…</div><div class="lms-route-empty-copy">Preparing the assignment workspace.</div></div>';
            }
            syncLmsWorkspaceChromeOffset(contentArea);
            if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
            ensureLmsContentRuntime()
                .then(() => switchLMSTab('workspace', { force: true }))
                .catch(() => {
                    if (contentArea) {
                        contentArea.innerHTML = '<div class="lms-live-copy is-danger">Assignment tools failed to load. Retry the Assignments tab.</div>';
                    }
                });
            return;
        }
        renderWorkspace(tabCourseKey);
    } else if (tab === 'attendance') {
        renderLmsAttendanceSection(tabCourseKey || currentCourseId);
    }
    if (contentArea) {
        if (tab === 'interaction' && typeof stripLmsInteractionBoundFlags === 'function') {
            stripLmsInteractionBoundFlags(contentArea);
        }
        if (!contentArea.querySelector('[data-lms-tab-loading]')) {
            setLmsTabRenderCache(cacheKey, contentArea.innerHTML);
        }
        contentArea.dataset.activeLmsSectionType = activeSectionType;
    }
    enhanceLmsTabExperience(tab, tabCourseKey || currentCourseId);
    syncLmsWorkspaceChromeOffset(contentArea);
    if (tab === 'whiteboard') {
        const shell = contentArea?.querySelector('.lms-whiteboard-shell');
        if (shell && typeof scheduleLmsWhiteboardLayoutRecovery === 'function') {
            scheduleLmsWhiteboardLayoutRecovery(shell, tabCourseKey || normalizedCourseKey);
        }
    }
    if (typeof window.syncChromeBottom === 'function') window.syncChromeBottom();
    markLmsTabSwitchPhase(tab, 'content-ready');
}


        const api = {
            renderLmsInteractionSection,
            buildLmsInteractionMessagePayload,
            sendLmsInteractionMessage,
            toggleLmsInteractionInlineReply,
            toggleLmsAnnouncementReplies,
            sendLmsInteractionReply,
            renderLmsAttendanceSection,
            markLmsAttendanceStatus,
            getLmsSectionEnhancementContext,
            getLmsSectionEnhancementConfig,
            computeLmsMemberRisk,
            renderLmsDeepToolkitCard,
            renderLmsDeepToolkitList,
            renderLmsDeepSectionToolkit,
            cleanupLmsInjectedEnhancementBlocks,
            buildLmsTabRenderCacheKey,
            clearLmsTabRenderCache,
            setLmsTabRenderCache,
            getLmsTabRenderCache,
            invalidateLmsLiveQuizTabCache,
            invalidateLmsWhiteboardTabCache,
            invalidateLmsInteractionTabCache,
            syncLmsInteractionTabCacheFromDom,
            prepareLmsContentAreaForTab,
            isLmsRenderCurrent,
            syncLmsTabRenderCacheFromDom,
            enhanceLmsTabExperience,
            switchLMSTab,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsClassroomTabsShellApi({});
})();
