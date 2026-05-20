(function initExamConsoleAdminModule() {
    if (window.__KIU_EXAMS_ADMIN_MODULE_LOADED) return;
    window.__KIU_EXAMS_ADMIN_MODULE_LOADED = true;

    const hooks = window.__kiuExamsAdminHooks || {};
    const {
        runtime,
        getReviewTemplates,
        getApprovedTemplates,
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
                <span>Feedback for the Professor/TA (required)</span>
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
                    <span>${escapeHtml(cohort.label)}</span>
                </label>
                <div class="ex2-meta">${escapeHtml(String(studentCount))} students Â· ${escapeHtml(String(cohort.groupNames.length))} teaching groups</div>
                <div class="ex2-card-copy">${escapeHtml(cohort.subjectSummary)}</div>
                <div class="ex2-tag-row">
                    ${cohort.facultyLabels.map((label) => `<span class="ex2-tag">${escapeHtml(label)}</span>`).join('')}
                    ${cohort.courseLabels.slice(0, 3).map((label) => `<span class="ex2-tag">${escapeHtml(label)}</span>`).join('')}
                </div>
                ${showSplit ? `
                    <div class="ex2-split-box">
                        <div class="ex2-side-kicker"><i class="fas fa-scissors"></i> Room Split Required</div>
                        <p style="font-size:12px;color:var(--lux-text-muted);margin:6px 0;">${studentCount} students exceed room capacity (${draft.roomCapacity}). Split into sub-groups:</p>
                        <div class="ex2-form-grid" style="margin-top:8px;">
                            <label class="ex2-field">
                                <span>Students for this room</span>
                                <input class="ex2-input" type="number" min="1" max="${studentCount}" value="${runtime.splitStudentCount || draft.roomCapacity || Math.ceil(studentCount / 2)}" data-exam-change-call="setExamSplitStudentCount" data-exam-change-args='["$value"]'>
                            </label>
                            <label class="ex2-field">
                                <span>Overflow room</span>
                                <input class="ex2-input" type="text" placeholder="e.g. Lab 302" value="${escapeHtml(runtime.splitRoomLabel)}" data-exam-input-call="setExamSplitRoomLabel" data-exam-input-args='["$value"]'>
                            </label>
                            <label class="ex2-field">
                                <span>Overflow time (optional)</span>
                                <input class="ex2-input" type="datetime-local" value="${escapeHtml(runtime.splitTimeSlot)}" data-exam-change-call="setExamSplitTimeSlot" data-exam-change-args='["$value"]'>
                            </label>
                        </div>
                        <button type="button" class="ex2-btn is-secondary" style="margin-top:10px;" data-exam-call="splitCohort" data-exam-args='["${escapeHtml(cohort.key)}"]'><i class="fas fa-scissors"></i> Split: first ${runtime.splitStudentCount || draft.roomCapacity} stay, rest â†’ overflow</button>
                    </div>
                ` : ''}
                <div class="ex2-mini-list">
                    ${(cohort.students || []).slice(0, 5).map((student) => `<div>${escapeHtml(student.name || student.id)}</div>`).join('')}
                    ${studentCount > 5 ? `<div>+${studentCount - 5} more</div>` : ''}
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
                    <div>
                        <div class="ex2-status is-${escapeHtml(status)}">${escapeHtml(status)}</div>
                        ${isPublished ? `<span class="ex2-status is-approved" style="margin-left:6px;">Published</span>` : ''}
                        <h3>${escapeHtml(session.title || template?.title || session.subjectName || 'Scheduled exam')}</h3>
                        <div class="ex2-meta">${escapeHtml(session.subjectName || session.subjectId || 'Subject')} Â· ${escapeHtml(session.variantLabel || template?.variantLabel || 'Variant')}</div>
                    </div>
                    <div class="ex2-inline-actions">
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="editExamSession" data-exam-args='["${escapeHtml(session.id)}"]'><i class="fas fa-pen"></i> Edit</button>
                        ${!isPublished ? `<button type="button" class="ex2-btn is-primary" data-exam-call="publishExamSession" data-exam-args='["${escapeHtml(session.id)}"]'><i class="fas fa-bullhorn"></i> Publish</button>` : `<button type="button" class="ex2-btn is-ghost" data-exam-call="unpublishExamSession" data-exam-args='["${escapeHtml(session.id)}"]'><i class="fas fa-eye-slash"></i> Unpublish</button>`}
                    </div>
                </div>
                <div class="ex2-mini-grid">
                    <div><strong>${escapeHtml(formatShortDate(session.startAt))}</strong><span>Date</span></div>
                    <div><strong>${escapeHtml(String(getAssignedStudentIds(session).length))}</strong><span>Students</span></div>
                    <div><strong>${escapeHtml(String(getSessionObserverNames(session).length))}</strong><span>Proctors</span></div>
                </div>
                <div class="ex2-card-copy">${escapeHtml(getSessionRoomLabel(session))} Â· ${escapeHtml(formatDateTime(session.startAt))} - ${escapeHtml(formatDateTime(session.endAt))}</div>
            </article>
        `;
    }

    window.renderExamReviewTab = function renderExamReviewTab() {
        const queue = getReviewTemplates();
        const bankCount = (t) => (t.questionBank || t.questions || []).length;
        const varCount = (t) => (t.variants || []).length;
        return `
            <section class="ex2-panel">
                <div class="ex2-panel-head">
                    <div>
                        <h2><i class="fas fa-clipboard-check" style="margin-right:8px;opacity:.5;"></i>Review Queue</h2>
                        <p>Approve or return quizzes submitted by teaching staff.</p>
                    </div>
                </div>
                ${queue.length ? `
                    <div style="display:grid;gap:14px;">
                        ${queue.map((template) => `
                            <article class="ex2-quiz-card" style="cursor:default;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <span class="ex2-status-dot is-${escapeHtml(String(template.status || 'submitted').toLowerCase())}">${escapeHtml(template.status || 'submitted')}</span>
                                        <span style="font-size:13px;color:var(--lux-text-muted);">by ${escapeHtml(template.createdByName || 'Unknown')}</span>
                                    </div>
                                    <span class="ex2-tag">${escapeHtml(template.faculty || 'N/A')}</span>
                                </div>
                                <h3 style="font-size:17px;font-weight:700;margin:0 0 6px;">${escapeHtml(template.title || 'Untitled')}</h3>
                                <div style="font-size:13px;color:var(--lux-text-muted);margin-bottom:12px;">${escapeHtml(template.subjectName || template.subjectId || 'No subject')}</div>
                                <div class="ex2-mini-grid">
                                    <div><strong>${bankCount(template)}</strong><span>Questions</span></div>
                                    <div><strong>${varCount(template)}</strong><span>Variants</span></div>
                                    <div><strong>${template.durationMinutes || 90}m</strong><span>Duration</span></div>
                                    <div><strong>${template.passingScore || 50}</strong><span>Pass pts</span></div>
                                    <div><strong>${template.gradingWeight || 30}</strong><span>Quiz pts</span></div>
                                </div>
                                <div class="ex2-inline-actions" style="margin-top:16px;">
                                    <button type="button" class="ex2-btn is-primary" data-exam-call="saveAndApproveExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'><i class="fas fa-check-circle"></i> Approve</button>
                                    <button type="button" class="ex2-btn is-danger" data-exam-call="openReturnModal" data-exam-args='["${escapeHtml(template.id)}"]'><i class="fas fa-rotate-left"></i> Return for Revision</button>
                                    <button type="button" class="ex2-btn is-ghost" data-exam-call="editExamTemplate" data-exam-args='["${escapeHtml(template.id)}"]'><i class="fas fa-eye"></i> Preview</button>
                                </div>
                            </article>
                        `).join('')}
                    </div>
                ` : `
                    <div class="ex2-empty-state">
                        <i class="fas fa-inbox"></i>
                        <p>No quizzes awaiting review. All clear!</p>
                    </div>
                `}
            </section>
            ${runtime.showReturnModal ? renderReturnModal() : ''}
        `;
    };

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
                    <div class="ex2-panel-head">
                        <div>
                            <h2><i class="fas fa-calendar-plus" style="margin-right:8px;opacity:.5;"></i>Schedule Builder</h2>
                            <p>Select a template, set time and room, then pick student groups.</p>
                        </div>
                        <div class="ex2-inline-actions">
                            <button type="button" class="ex2-btn is-primary" data-exam-call="createLocalExamTestSession"><i class="fas fa-vial"></i> Create Test Session</button>
                            <button type="button" class="ex2-btn is-ghost" data-exam-call="previewStudentExamPortal"><i class="fas fa-eye"></i> Preview Portal</button>
                        </div>
                    </div>
                    <div class="ex2-form-grid">
                        <label class="ex2-field ex2-field-span">
                            <span>Approved Template</span>
                            <select class="ex2-select" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["templateId","$value"]'>
                                <option value="">Choose template</option>
                                ${approvedTemplates.map((item) => '<option value="' + escapeHtml(item.id) + '"' + (draft.templateId === item.id ? ' selected' : '') + '>' + escapeHtml(item.subjectName || item.subjectId) + ' - ' + escapeHtml(item.title || 'Variant') + ' (' + (item.variants || []).length + ' var)</option>').join('')}
                            </select>
                        </label>
                        <label class="ex2-field"><span>Start</span><input class="ex2-input" type="datetime-local" value="${escapeHtml(draft.startAt)}" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["startAt","$value"]'></label>
                        <label class="ex2-field"><span>End</span><input class="ex2-input" type="datetime-local" value="${escapeHtml(draft.endAt)}" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["endAt","$value"]'></label>
                        <label class="ex2-field"><span>Room</span><input class="ex2-input" type="text" value="${escapeHtml(draft.roomLabel)}" placeholder="Lab 301" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["roomLabel","$value"]'></label>
                        <label class="ex2-field"><span>Capacity</span><input class="ex2-input" type="number" min="1" value="${escapeHtml(String(draft.roomCapacity || ''))}" placeholder="50" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["roomCapacity","$value"]'></label>
                        <label class="ex2-field ex2-field-span"><span>Proctors</span><input class="ex2-input" type="text" value="${escapeHtml(draft.observerNamesText)}" placeholder="N. Beridze, L. Kapanadze" data-exam-change-call="updateExamScheduleField" data-exam-change-args='["observerNamesText","$value"]'></label>
                    </div>
                    ${issues.length ? '<div class="ex2-collision-list soft">' + issues.map((item) => '<div><i class="fas fa-triangle-exclamation"></i> ' + escapeHtml(item) + '</div>').join('') + '</div>' : ''}
                    ${collisions.hard.length ? '<div class="ex2-collision-list hard">' + collisions.hard.map((item) => '<div><i class="fas fa-ban"></i> ' + escapeHtml(item) + '</div>').join('') + '</div>' : ''}
                    ${collisions.soft.length ? '<div class="ex2-collision-list soft">' + collisions.soft.map((item) => '<div><i class="fas fa-exclamation-circle"></i> ' + escapeHtml(item) + '</div>').join('') + '</div>' : ''}
                    ${draft.roomCapacity && selectedStudents.length > draft.roomCapacity ? '<div class="ex2-collision-list soft"><div><i class="fas fa-door-open"></i> Room overflow: ' + selectedStudents.length + ' students but capacity is ' + draft.roomCapacity + '. Use Split below.</div></div>' : ''}
                    <div class="ex2-inline-actions" style="margin-top:16px;">
                        <button type="button" class="ex2-btn is-primary" data-exam-call="saveExamSchedule"><i class="fas fa-calendar-check"></i> Save Session</button>
                        <button type="button" class="ex2-btn is-ghost" data-exam-call="clearExamScheduleDraft"><i class="fas fa-rotate-left"></i> Reset</button>
                    </div>
                    <div style="border-top:1px solid var(--lux-border);margin:20px 0;"></div>
                    <h3 style="font-size:15px;font-weight:700;margin-bottom:6px;">Session Summary</h3>
                    <div class="ex2-mini-grid">
                        <div><strong>${uniqueStrings(draft.selectedCohortKeys || []).length}</strong><span>Groups</span></div>
                        <div><strong>${selectedStudents.length}</strong><span>Students</span></div>
                        <div><strong>${draft.roomCapacity || 'âˆž'}</strong><span>Capacity</span></div>
                        <div><strong>${escapeHtml(formatCountdown(draft.startAt))}</strong><span>Countdown</span></div>
                    </div>
                    ${template && template.examType === 'digital' ? '<div style="margin-top:16px;padding:14px;border-radius:14px;border:1px solid var(--lux-border);text-align:center;"><div style="font-size:11px;font-weight:700;color:var(--lux-text-muted);text-transform:uppercase;letter-spacing:.5px;">Digital Exam PIN</div><div style="font-size:28px;font-weight:900;letter-spacing:6px;margin-top:6px;">' + generateExamPIN(draft) + '</div></div>' : ''}
                </section>
                <section class="ex2-panel">
                    <div class="ex2-panel-head">
                        <div>
                            <h2><i class="fas fa-users-rectangle" style="margin-right:8px;opacity:.5;"></i>Student Groups</h2>
                            <p>${template ? 'Cohorts for ' + escapeHtml(template.subjectName || template.subjectId) : 'Choose a template first.'}</p>
                        </div>
                        ${template ? '<div class="ex2-inline-actions"><button type="button" class="ex2-btn is-ghost" data-exam-call="selectAllExamCohorts"><i class="fas fa-check-double"></i> All</button><button type="button" class="ex2-btn is-ghost" data-exam-call="clearExamCohorts"><i class="fas fa-eraser"></i> Clear</button></div>' : ''}
                    </div>
                    <div class="ex2-cohort-grid">
                        ${cohorts.length ? cohorts.map((cohort) => renderCohortCard(cohort, draft)).join('') : '<div class="ex2-empty-state"><i class="fas fa-users-slash"></i><p>No groups available for this subject.</p></div>'}
                    </div>
                </section>
            </div>
            <section class="ex2-panel">
                <div class="ex2-panel-head">
                    <div>
                        <h2><i class="fas fa-list-check" style="margin-right:8px;opacity:.5;"></i>Scheduled Sessions</h2>
                        <p>Published sessions are visible to students on their timetable.</p>
                    </div>
                </div>
                ${todaySessions.length ? '<div class="ex2-timeline">' + todaySessions.map((session) => renderSessionBoardCard(session)).join('') + '</div>' : '<div class="ex2-empty-state"><i class="fas fa-calendar-xmark"></i><p>No sessions scheduled yet.</p></div>'}
            </section>
        `;
    };
})();
