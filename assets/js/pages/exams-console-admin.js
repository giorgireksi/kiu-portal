(function initExamConsoleAdminModule() {
    if (window.__KIU_EXAMS_ADMIN_MODULE_LOADED) return;
    window.__KIU_EXAMS_ADMIN_MODULE_LOADED = true;

    const hooks = window.__kiuExamsAdminHooks || {};
    const {
        runtime,
        getReviewTemplates,
        getApprovedTemplates,
        getReviewQueueGroups,
        getReviewFacultyOptions,
        canUseCrossFacultyExamView,
        getTemplateById,
        getScheduleDraft,
        getSelectedStudentsForSchedule,
        getScheduleDraftIssues,
        getSessions,
        buildSubjectAutoCohorts,
        detectScheduleCollisions,
        generateExamPIN,
        formatCountdown,
        formatDateTime,
        formatShortDate,
        getAssignedStudentIds,
        getSessionObserverNames,
        getSessionRoomLabel,
        getSelectedSessionStatus,
        uniqueStrings,
        escapeHtml,
        toFieldToken,
        renderExamModalShell
    } = hooks;

    if (
        !runtime
        || typeof getReviewTemplates !== 'function'
        || typeof getApprovedTemplates !== 'function'
        || typeof getReviewQueueGroups !== 'function'
        || typeof getReviewFacultyOptions !== 'function'
        || typeof canUseCrossFacultyExamView !== 'function'
        || typeof getTemplateById !== 'function'
        || typeof getScheduleDraft !== 'function'
        || typeof getSelectedStudentsForSchedule !== 'function'
        || typeof getScheduleDraftIssues !== 'function'
        || typeof getSessions !== 'function'
        || typeof buildSubjectAutoCohorts !== 'function'
        || typeof detectScheduleCollisions !== 'function'
        || typeof generateExamPIN !== 'function'
        || typeof formatCountdown !== 'function'
        || typeof formatDateTime !== 'function'
        || typeof formatShortDate !== 'function'
        || typeof getAssignedStudentIds !== 'function'
        || typeof getSessionObserverNames !== 'function'
        || typeof getSessionRoomLabel !== 'function'
        || typeof getSelectedSessionStatus !== 'function'
        || typeof uniqueStrings !== 'function'
        || typeof escapeHtml !== 'function'
        || typeof toFieldToken !== 'function'
        || typeof renderExamModalShell !== 'function'
    ) {
        throw new Error('Exams admin hooks are unavailable.');
    }

    function setExamSplitStudentCount(value) {
        runtime.splitStudentCount = parseInt(value, 10) || 0;
    }

    function setExamSplitRoomLabel(value) {
        runtime.splitRoomLabel = String(value || '');
    }

    function setExamSplitTimeSlot(value) {
        runtime.splitTimeSlot = String(value || '');
    }

    function renderReturnModal() {
        const body = `
            <label class="ex2-field">
                <span class="ex2-field-label">Feedback for the Professor/TA (required)</span>
                <textarea class="ex2-textarea" rows="4" placeholder="Explain what needs to be fixed..." data-exam-input="return-note">${escapeHtml(runtime.returnNote)}</textarea>
            </label>
            <div class="ex2-inline-actions ex2-modal-actions">
                <button type="button" class="ex2-btn is-primary" data-exam-action="execute-return"><i class="fas fa-paper-plane"></i> Send Back</button>
                <button type="button" class="ex2-btn is-ghost" data-exam-action="close-return-modal">Cancel</button>
            </div>
        `;
        return renderExamModalShell({
            modalKey: 'return',
            title: 'Return for Revision',
            icon: 'fa-rotate-left',
            tone: 'warm',
            body
        });
    }

    function renderCohortCard(cohort, draft) {
        const selected = uniqueStrings(draft.selectedCohortKeys || []).includes(cohort.key);
        const studentCount = cohort.students.length;
        const showSplit = selected && draft.roomCapacity && studentCount > parseInt(draft.roomCapacity, 10);
        return `
            <article class="ex2-cohort-card${selected ? ' is-selected' : ''}">
                <label class="ex2-cohort-check">
                    <input id="exam-cohort-${escapeHtml(toFieldToken(cohort.key))}" name="exam_cohort_${escapeHtml(toFieldToken(cohort.key))}" type="checkbox" ${selected ? 'checked' : ''} data-exam-change-call="toggleExamCohort" data-exam-change-args='["${escapeHtml(cohort.key)}","$checked"]'>
                    <span class="ex2-cohort-check-label">${escapeHtml(cohort.label)}</span>
                </label>
                <div class="ex2-meta ex2-cohort-card-meta">${escapeHtml(String(studentCount))} students Â· ${escapeHtml(String(cohort.groupNames.length))} teaching groups</div>
                <div class="ex2-card-copy ex2-cohort-card-copy">${escapeHtml(cohort.subjectSummary)}</div>
                <div class="ex2-tag-row">
                    ${cohort.facultyLabels.map((label) => `<span class="ex2-tag">${escapeHtml(label)}</span>`).join('')}
                    ${cohort.courseLabels.slice(0, 3).map((label) => `<span class="ex2-tag">${escapeHtml(label)}</span>`).join('')}
                </div>
                ${showSplit ? `
                    <div class="ex2-split-box">
                        <div class="ex2-side-kicker"><i class="fas fa-scissors"></i> Room Split Required</div>
                        <p class="ex2-copy-muted ex2-copy-muted--mt-6">${studentCount} students exceed room capacity (${draft.roomCapacity}). Split into sub-groups:</p>
                        <div class="ex2-form-grid ex2-form-grid--mt-8">
                            <label class="ex2-field">
                                <span class="ex2-field-label">Students for this room</span>
                                <input class="ex2-input" type="number" min="1" max="${studentCount}" value="${runtime.splitStudentCount || draft.roomCapacity || Math.ceil(studentCount / 2)}" data-exam-change-call="setExamSplitStudentCount" data-exam-change-args='["$value"]'>
                            </label>
                            <label class="ex2-field">
                                <span class="ex2-field-label">Overflow room</span>
                                <input class="ex2-input" type="text" placeholder="e.g. Lab 302" value="${escapeHtml(runtime.splitRoomLabel)}" data-exam-input-call="setExamSplitRoomLabel" data-exam-input-args='["$value"]'>
                            </label>
                            <label class="ex2-field">
                                <span class="ex2-field-label">Overflow time (optional)</span>
                                <input class="ex2-input" type="datetime-local" value="${escapeHtml(runtime.splitTimeSlot)}" data-exam-change-call="setExamSplitTimeSlot" data-exam-change-args='["$value"]'>
                            </label>
                        </div>
                        <button type="button" class="ex2-btn is-secondary ex2-btn--mt-10" data-exam-call="splitCohort" data-exam-args='["${escapeHtml(cohort.key)}"]'><i class="fas fa-scissors"></i> Split: first ${runtime.splitStudentCount || draft.roomCapacity} stay, rest â†’ overflow</button>
                    </div>
                ` : ''}
                <div class="ex2-mini-list">
                    ${(cohort.students || []).slice(0, 5).map((student) => `<div class="ex2-mini-list-item">${escapeHtml(student.name || student.id)}</div>`).join('')}
                    ${studentCount > 5 ? `<div class="ex2-mini-list-item ex2-mini-list-item--muted">+${studentCount - 5} more</div>` : ''}
                </div>
            </article>
        `;
    }

    function renderSessionBoardCard(session) {
        const template = getTemplateById(session.templateId);
        const status = getSelectedSessionStatus(session);
        const isPublished = session.published === true;
        return `
            <article class="ex2-session-card">
                <div class="ex2-session-head">
                    <div class="ex2-session-head-main">
                        <div class="ex2-status ex2-session-status-chip is-${escapeHtml(status)}">${escapeHtml(status)}</div>
                        ${isPublished ? `<span class="ex2-status ex2-session-published-pill is-approved ex2-status--ml-6">Published</span>` : ''}
                        <h3 class="ex2-session-card-title">${escapeHtml(session.title || template?.title || session.subjectName || 'Scheduled exam')}</h3>
                        <div class="ex2-meta ex2-session-card-meta">${escapeHtml(session.subjectName || session.subjectId || 'Subject')} Â· ${escapeHtml(session.variantLabel || template?.variantLabel || 'Variant')}</div>
                    </div>
                    <div class="ex2-inline-actions ex2-session-action-row">
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="editExamSession" data-exam-args='["${escapeHtml(session.id)}"]'><i class="fas fa-pen"></i> Edit</button>
                        ${!isPublished ? `<button type="button" class="ex2-btn is-primary" data-exam-call="publishExamSession" data-exam-args='["${escapeHtml(session.id)}"]'><i class="fas fa-bullhorn"></i> Publish</button>` : `<button type="button" class="ex2-btn is-ghost" data-exam-call="unpublishExamSession" data-exam-args='["${escapeHtml(session.id)}"]'><i class="fas fa-eye-slash"></i> Unpublish</button>`}
                    </div>
                </div>
                <div class="ex2-mini-grid">
                    <div class="ex2-session-stat-card"><strong class="ex2-session-stat-value">${escapeHtml(formatShortDate(session.startAt))}</strong><span class="ex2-session-stat-label">Date</span></div>
                    <div class="ex2-session-stat-card"><strong class="ex2-session-stat-value">${escapeHtml(String(getAssignedStudentIds(session).length))}</strong><span class="ex2-session-stat-label">Students</span></div>
                    <div class="ex2-session-stat-card"><strong class="ex2-session-stat-value">${escapeHtml(String(getSessionObserverNames(session).length))}</strong><span class="ex2-session-stat-label">Proctors</span></div>
                </div>
                <div class="ex2-card-copy ex2-session-card-copy">${escapeHtml(getSessionRoomLabel(session))} Â· ${escapeHtml(formatDateTime(session.startAt))} - ${escapeHtml(formatDateTime(session.endAt))}</div>
            </article>
        `;
    }

    window.renderExamReviewTab = function renderExamReviewTab() {
        const groups = getReviewQueueGroups();
        const facultyOptions = getReviewFacultyOptions();
        const crossFaculty = canUseCrossFacultyExamView();
        const bankCount = (t) => (t.questionBank || t.questions || []).length;
        const varCount = (t) => (t.variants || []).length;

        const initials = (name) => {
            const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
            if (!parts.length) return '—';
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        };

        const timeAgo = (value) => {
            const time = new Date(value).getTime();
            if (!time || Number.isNaN(time)) return '';
            const diff = Date.now() - time;
            if (diff < 0) return typeof formatShortDate === 'function' ? formatShortDate(value) : '';
            const minutes = Math.floor(diff / 60000);
            if (minutes < 1) return 'just now';
            if (minutes < 60) return `${minutes}m ago`;
            const hours = Math.floor(minutes / 60);
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            if (days < 7) return `${days}d ago`;
            return typeof formatShortDate === 'function' ? formatShortDate(value) : `${days}d ago`;
        };

        const renderCard = (template, opts = {}) => {
            const status = String(template.status || 'submitted').toLowerCase();
            const showApprove = opts.showApprove !== false;
            const showReturn = opts.showReturn !== false;
            const note = String(template.revisionNote || '').trim();
            return `
                <article class="ex2-rq-card" data-exam-call="editExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'>
                    <div class="ex2-rq-card-top">
                        <span class="ex2-status-dot is-${escapeHtml(status)}">${escapeHtml(status.replace(/_/g, ' '))}</span>
                        <span class="ex2-rq-card-age">${escapeHtml(timeAgo(template.updatedAt || template.createdAt))}</span>
                    </div>
                    <h4 class="ex2-rq-card-title">${escapeHtml(template.title || 'Untitled')}</h4>
                    <div class="ex2-rq-card-meta">${escapeHtml(template.subjectName || template.subjectId || 'No subject')} · ${bankCount(template)} Q · ${varCount(template)} v · ${template.durationMinutes || 90}m</div>
                    <div class="ex2-rq-card-foot">
                        <span class="ex2-rq-card-author" title="${escapeHtml(template.createdByName || 'Unknown')}">
                            <span class="ex2-rq-avatar">${escapeHtml(initials(template.createdByName))}</span>
                            <span class="ex2-rq-card-author-name">${escapeHtml(template.createdByName || 'Unknown')}</span>
                        </span>
                        ${template.faculty ? `<span class="ex2-rq-card-faculty">${escapeHtml(template.faculty)}</span>` : ''}
                    </div>
                    ${note ? `<div class="ex2-rq-card-note"><i class="fas fa-comment-dots"></i> ${escapeHtml(note)}</div>` : ''}
                    <div class="ex2-rq-card-actions">
                        ${showApprove ? `<button type="button" class="ex2-rq-action is-approve" data-exam-call="saveAndApproveExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]' title="Approve"><i class="fas fa-check"></i></button>` : ''}
                        ${showReturn ? `<button type="button" class="ex2-rq-action is-return" data-exam-call="openReturnModal" data-exam-args='["${escapeHtml(template.id)}"]' title="Return for revision"><i class="fas fa-rotate-left"></i></button>` : ''}
                        <button type="button" class="ex2-rq-action is-preview" data-exam-call="editExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]' title="Preview"><i class="fas fa-eye"></i></button>
                    </div>
                </article>
            `;
        };

        const renderColumn = ({ title, icon, tone, items, emptyText, collapsible, collapsed, showApprove, showReturn }) => {
            const count = items.length;
            const bodyCollapsed = collapsible && collapsed;
            return `
                <section class="ex2-rq-column is-${tone}${bodyCollapsed ? ' is-collapsed' : ''}${!count && !bodyCollapsed ? ' is-empty' : ''}">
                    <header class="ex2-rq-column-head">
                        <div class="ex2-rq-column-title">
                            <i class="fas ${icon}"></i>
                            <span>${escapeHtml(title)}</span>
                            <span class="ex2-rq-column-count is-${tone}">${count}</span>
                        </div>
                        ${collapsible ? `<button type="button" class="ex2-rq-column-toggle" data-exam-call="toggleExamReviewApproved" title="${collapsed ? 'Expand' : 'Collapse'}"><i class="fas fa-chevron-${collapsed ? 'right' : 'down'}"></i></button>` : ''}
                    </header>
                    ${!bodyCollapsed ? `
                        <div class="ex2-rq-column-body">
                            ${count ? items.map((t) => renderCard(t, { showApprove, showReturn })).join('') : `<div class="ex2-rq-column-empty"><i class="fas fa-inbox"></i><span>${escapeHtml(emptyText)}</span></div>`}
                        </div>
                    ` : ''}
                </section>
            `;
        };

        const total = groups.awaiting.length + groups.returned.length + groups.approved.length;

        return `
            <section class="ex2-panel ex2-rq-console">
                <div class="lux-panel-head ex2-rq-console-head">
                    <div>
                        <h2 class="lux-panel-title"><i class="fas fa-clipboard-check ex2-heading-icon"></i>Review Queue</h2>
                        <p class="lux-panel-copy">Triage quizzes submitted by teaching staff. Approve, return, or preview in place.</p>
                    </div>
                    <div class="ex2-rq-summary-chips">
                        <span class="ex2-status-dot is-submitted">${groups.awaiting.length} awaiting</span>
                        <span class="ex2-status-dot is-returned">${groups.returned.length} returned</span>
                        <span class="ex2-status-dot is-approved">${groups.approved.length} approved</span>
                    </div>
                </div>
                <div class="ex2-rq-toolbar">
                    <input class="ex2-input ex2-input--search" type="text" placeholder="Search by title, subject, author..." value="${escapeHtml(runtime.reviewSearch)}" data-exam-input-call="setExamReviewSearch" data-exam-input-args='["$value"]'>
                    ${crossFaculty && facultyOptions.length ? `
                        <select class="ex2-select ex2-select--filter" data-exam-change-call="setExamReviewFaculty" data-exam-change-args='["$value"]'>
                            <option value="all"${runtime.reviewFaculty === 'all' ? ' selected' : ''}>All faculties</option>
                            ${facultyOptions.map((opt) => `<option value="${escapeHtml(opt.code)}"${runtime.reviewFaculty === opt.code ? ' selected' : ''}>${escapeHtml(opt.label)}</option>`).join('')}
                        </select>
                    ` : ''}
                    <select class="ex2-select ex2-select--filter" data-exam-change-call="setExamReviewSort" data-exam-change-args='["$value"]'>
                        <option value="oldest"${runtime.reviewSort === 'oldest' ? ' selected' : ''}>Oldest first</option>
                        <option value="newest"${runtime.reviewSort === 'newest' ? ' selected' : ''}>Newest first</option>
                    </select>
                    <span class="ex2-rq-toolbar-count">${total} ${total === 1 ? 'task' : 'tasks'}</span>
                </div>
                <div class="ex2-rq-board">
                    ${renderColumn({
                        title: 'Awaiting Review',
                        icon: 'fa-inbox',
                        tone: 'submitted',
                        items: groups.awaiting,
                        emptyText: 'Nothing awaiting review.',
                        showApprove: true,
                        showReturn: true
                    })}
                    ${renderColumn({
                        title: 'Returned',
                        icon: 'fa-rotate-left',
                        tone: 'returned',
                        items: groups.returned,
                        emptyText: 'No returned quizzes.',
                        showApprove: true,
                        showReturn: false
                    })}
                    ${renderColumn({
                        title: 'Approved',
                        icon: 'fa-circle-check',
                        tone: 'approved',
                        items: groups.approved,
                        emptyText: 'No approved quizzes yet.',
                        collapsible: true,
                        collapsed: runtime.reviewApprovedCollapsed,
                        showApprove: false,
                        showReturn: true
                    })}
                </div>
            </section>
        `;
    };

    window.renderExamReturnModal = renderReturnModal;

    window.renderExamScheduleBoard = function renderExamScheduleBoard() {
        const draft = getScheduleDraft();
        const approvedTemplates = getApprovedTemplates();
        const template = getTemplateById(draft.templateId);
        const cohorts = template ? buildSubjectAutoCohorts(template.subjectId) : [];
        const selectedStudents = getSelectedStudentsForSchedule(draft, template);
        const issues = getScheduleDraftIssues(draft, template);
        const todaySessions = getSessions();
        const collisions = detectScheduleCollisions(draft, todaySessions);
        return `
            <div class="ex2-two-col">
                <section class="ex2-panel">
                    <div class="lux-panel-head">
                        <div>
                            <h2 class="lux-panel-title"><i class="fas fa-calendar-plus ex2-heading-icon"></i>Schedule Builder</h2>
                            <p class="lux-panel-copy">Select a template, set time and room, then pick student groups.</p>
                        </div>
                        <div class="ex2-inline-actions">
                            <button type="button" class="ex2-btn is-primary" data-exam-call="createLocalExamTestSession"><i class="fas fa-vial"></i> Create Test Session</button>
                            <button type="button" class="ex2-btn is-ghost" data-exam-call="previewStudentExamPortal"><i class="fas fa-eye"></i> Preview Portal</button>
                        </div>
                    </div>
                    <div class="ex2-form-grid">
                        <label class="ex2-field ex2-field-span">
                            <span class="ex2-field-label">Approved Template</span>
                            <select class="ex2-select" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["templateId","$value"]'>
                                <option value="">Choose template</option>
                                ${approvedTemplates.map((item) => '<option value="' + escapeHtml(item.id) + '"' + (draft.templateId === item.id ? ' selected' : '') + '>' + escapeHtml(item.subjectName || item.subjectId) + ' - ' + escapeHtml(item.title || 'Variant') + ' (' + (item.variants || []).length + ' var)</option>').join('')}
                            </select>
                        </label>
                        <label class="ex2-field"><span class="ex2-field-label">Start</span><input class="ex2-input" type="datetime-local" value="${escapeHtml(draft.startAt)}" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["startAt","$value"]'></label>
                        <label class="ex2-field"><span class="ex2-field-label">End</span><input class="ex2-input" type="datetime-local" value="${escapeHtml(draft.endAt)}" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["endAt","$value"]'></label>
                        <label class="ex2-field"><span class="ex2-field-label">Room</span><input class="ex2-input" type="text" value="${escapeHtml(draft.roomLabel)}" placeholder="Lab 301" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["roomLabel","$value"]'></label>
                        <label class="ex2-field"><span class="ex2-field-label">Capacity</span><input class="ex2-input" type="number" min="1" value="${escapeHtml(String(draft.roomCapacity || ''))}" placeholder="50" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["roomCapacity","$value"]'></label>
                        <label class="ex2-field ex2-field-span"><span class="ex2-field-label">Proctors</span><input class="ex2-input" type="text" value="${escapeHtml(draft.observerNamesText)}" placeholder="N. Beridze, L. Kapanadze" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["observerNamesText","$value"]'></label>
                    </div>
                    ${issues.length ? '<div class="ex2-collision-list soft">' + issues.map((item) => '<div class="ex2-collision-item"><i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(item) + '</div>').join('') + '</div>' : ''}
                    ${collisions.hard.length ? '<div class="ex2-collision-list hard">' + collisions.hard.map((item) => '<div class="ex2-collision-item"><i class="fas fa-ban"></i> ' + escapeHtml(item) + '</div>').join('') + '</div>' : ''}
                    ${collisions.soft.length ? '<div class="ex2-collision-list soft">' + collisions.soft.map((item) => '<div class="ex2-collision-item"><i class="fas fa-exclamation-circle"></i> ' + escapeHtml(item) + '</div>').join('') + '</div>' : ''}
                    ${draft.roomCapacity && selectedStudents.length > draft.roomCapacity ? '<div class="ex2-collision-list soft"><div class="ex2-collision-item ex2-collision-item--overflow"><i class="fas fa-door-open"></i> Room overflow: ' + selectedStudents.length + ' students but capacity is ' + draft.roomCapacity + '. Use Split below.</div></div>' : ''}
                    <div class="ex2-inline-actions ex2-inline-actions--mt-16">
                        <button type="button" class="ex2-btn is-primary" data-exam-call="saveExamSchedule"><i class="fas fa-calendar-check"></i> Save Session</button>
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="clearExamScheduleDraft"><i class="fas fa-rotate-left"></i> Reset</button>
                    </div>
                    <div class="ex2-divider ex2-divider--20"></div>
                    <h3 class="ex2-summary-title">Session Summary</h3>
                    <div class="ex2-mini-grid">
                        <div class="ex2-session-summary-card"><strong class="ex2-session-summary-value">${uniqueStrings(draft.selectedCohortKeys || []).length}</strong><span class="ex2-session-summary-label">Groups</span></div>
                        <div class="ex2-session-summary-card"><strong class="ex2-session-summary-value">${selectedStudents.length}</strong><span class="ex2-session-summary-label">Students</span></div>
                        <div class="ex2-session-summary-card"><strong class="ex2-session-summary-value">${draft.roomCapacity || 'âˆž'}</strong><span class="ex2-session-summary-label">Capacity</span></div>
                        <div class="ex2-session-summary-card"><strong class="ex2-session-summary-value">${escapeHtml(formatCountdown(draft.startAt))}</strong><span class="ex2-session-summary-label">Countdown</span></div>
                    </div>
                    ${template && template.examType === 'digital' ? '<div class="ex2-digital-pin"><div class="ex2-digital-pin-label">Digital Exam PIN</div><div class="ex2-digital-pin-value">' + generateExamPIN(draft) + '</div></div>' : ''}
                </section>
                <section class="ex2-panel">
                    <div class="lux-panel-head">
                        <div>
                            <h2 class="lux-panel-title"><i class="fas fa-users-rectangle ex2-heading-icon"></i>Student Groups</h2>
                            <p class="lux-panel-copy">${template ? 'Cohorts for ' + escapeHtml(template.subjectName || template.subjectId) : 'Choose a template first.'}</p>
                        </div>
                        ${template ? '<div class="ex2-inline-actions"><button type="button" class="ex2-btn is-ghost" data-exam-call="selectAllExamCohorts"><i class="fas fa-check-double"></i> All</button><button type="button" class="ex2-btn is-ghost" data-exam-call="clearExamCohorts"><i class="fas fa-eraser"></i> Clear</button></div>' : ''}
                    </div>
                    <div class="ex2-cohort-grid">
                        ${cohorts.length ? cohorts.map((cohort) => renderCohortCard(cohort, draft)).join('') : '<div class="ex2-empty-state ex2-schedule-groups-empty"><i class="fas fa-users-slash"></i><p class="ex2-empty-state-copy">No groups available for this subject.</p></div>'}
                    </div>
                </section>
            </div>
            <section class="ex2-panel">
                <div class="lux-panel-head">
                    <div>
                        <h2 class="lux-panel-title"><i class="fas fa-list-check ex2-heading-icon"></i>Scheduled Sessions</h2>
                        <p class="lux-panel-copy">Published sessions are visible to students on their timetable.</p>
                    </div>
                </div>
                ${todaySessions.length ? '<div class="ex2-timeline">' + todaySessions.map((session) => renderSessionBoardCard(session)).join('') + '</div>' : '<div class="ex2-empty-state ex2-schedule-sessions-empty"><i class="fas fa-calendar-xmark"></i><p class="ex2-empty-state-copy">No sessions scheduled yet.</p></div>'}
            </section>
        `;
    };
})();
