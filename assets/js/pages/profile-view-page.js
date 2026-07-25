/* Profile-view page runtime extracted from profile-view.html inline script. */
function getProfileViewEffectiveRole() {
    if (typeof getCurrentUser === 'function') {
        const accountRole = getCurrentUser()?.role;
        if (accountRole) {
            return accountRole;
        }
    }
    return typeof currentUserRole === 'string' ? currentUserRole : '';
}

function profileViewCanManage() {
    return getProfileViewEffectiveRole() === 'admin';
}

const PROFILE_VIEW_EMPTY_TEXT = 'Not provided';
const PROFILE_VIEW_UNKNOWN_FACULTY = 'Unknown faculty';
const PROFILE_VIEW_DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PROFILE_VIEW_DAY_SHORT_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const PROFILE_VIEW_END_TIME_OPTIONS = ['09:50','10:00','10:20','10:50','11:00','11:20','11:50','12:00','12:20','12:50','13:00','13:20','13:50','14:00','14:20','14:50','15:00','15:20','15:50','16:00','16:20','16:50','17:00','17:20','17:50','18:00','18:20','18:50','19:00','19:50','20:00','20:50'];
const PROFILE_VIEW_GROUP_TIME_OPTIONS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const PROFILE_VIEW_DURATION_OPTIONS = Object.freeze([
    { value: '50', label: '50min' },
    { value: '80', label: '80min' },
    { value: '110', label: '~2h (110 min)' },
    { value: '170', label: '~3h (170 min)' }
]);
const PROFILE_VIEW_GROUP_DURATION_OPTIONS = Object.freeze([
    { value: '50min', label: '50 min' },
    { value: '80min', label: '80 min' },
    { value: '110min', label: '110 min' },
    { value: '170min', label: '170 min' }
]);
const PROFILE_VIEW_DAY_INDEX = Object.freeze(
    PROFILE_VIEW_DAY_NAMES.reduce((acc, day, index) => {
        acc[day] = index;
        return acc;
    }, {})
);

function escapeProfileViewText(value) {
    return String(value || '').replace(/[&<>"']/g, (character) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    })[character]);
}

function renderProfileViewEmptyState(title, copy = '', actionMarkup = '') {
    const safeTitle = escapeProfileViewText(title);
    const copyMarkup = copy
        ? `<span class="lux-empty-state__copy">${escapeProfileViewText(copy)}</span>`
        : '';
    const action = actionMarkup ? `<div class="lux-empty-state__action">${actionMarkup}</div>` : '';
    return `
        <div class="lux-empty-state profile-view-empty-state">
            <i class="fas fa-circle-info"></i>
            <strong class="lux-empty-state__title">${safeTitle}</strong>
            ${copyMarkup}
            ${action}
        </div>
    `;
}

function profileViewCanonicalCourseKey(value) {
    if (typeof canonicalCourseKey === 'function') return canonicalCourseKey(value);
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function resolveDayIndex(dayLabel) {
    const normalized = String(dayLabel || '').trim();
    if (!normalized) return -1;
    if (Object.prototype.hasOwnProperty.call(PROFILE_VIEW_DAY_INDEX, normalized)) {
        return PROFILE_VIEW_DAY_INDEX[normalized];
    }
    const lower = normalized.toLowerCase();
    return PROFILE_VIEW_DAY_NAMES.findIndex((day) => day.toLowerCase() === lower);
}

function getProfSchedule(profName) {
    const targetName = String(profName || '').trim();
    const sessions = [];
    Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
        (KIU_STATE.availableGroups[courseId] || []).forEach((group) => {
            if (group.prof === targetName || group.ta === targetName) {
                sessions.push({ courseId, ...group });
            }
        });
    });
    return sessions;
}

function getEnrolledStudentsForGroup(courseId, groupId) {
    const students = [];
    const seen = new Set();
    const normalizedCourseId = profileViewCanonicalCourseKey(courseId);
    const normalizedGroupId = profileViewCanonicalCourseKey(groupId);
    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
        const scheduleEntries = Array.isArray(schedule)
            ? schedule
            : (schedule && typeof schedule === 'object')
                ? Object.entries(schedule).map(([scheduledCourseId, scheduledGroupId]) => ({
                    courseId: scheduledCourseId,
                    groupId: scheduledGroupId
                }))
                : [];
        const isEnrolled = scheduleEntries.some((item) => (
            profileViewCanonicalCourseKey(item?.courseId || item?.sourceCourseId || '') === normalizedCourseId
            && profileViewCanonicalCourseKey(item?.groupId || item?.groupName || '') === normalizedGroupId
        ));
        if (!isEnrolled || seen.has(studentId)) return;
        seen.add(studentId);
        const profile = getAllStudents().find((student) => String(student?.id || '') === String(studentId)) || { id: studentId };
        students.push(profile);
    });
    return students;
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof isAdminImpersonationMode === 'function' && isAdminImpersonationMode()) {
        const role = typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : 'student';
        const target = typeof appendPortalViewQuery === 'function'
            ? appendPortalViewQuery('personal-data.html', role)
            : 'personal-data.html';
        window.location.replace(target);
        return;
    }

    const fac = localStorage.getItem('currentFaculty') || 'ECON';
    const activeRole = getProfileViewEffectiveRole() || 'student';
    const preservedClasses = Array.from(document.body.classList).filter((className) => !/^role-/.test(className));
    document.body.className = [...preservedClasses, `role-${activeRole}`].join(' ');
    switchFacultyTheme(fac);
    if (typeof refreshShellIdentity === 'function') {
        refreshShellIdentity();
    }
    bindProfileViewDelegatedInteractions();

    // Read params from URL or sessionStorage
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || sessionStorage.getItem('pv_type') || 'student';
    const id   = params.get('id')   || sessionStorage.getItem('pv_id');
    const facParam = params.get('fac') || sessionStorage.getItem('pv_fac') || fac;

    const root = document.getElementById('profile-view-root');
    if (!root) return;
    if (!id) {
        root.innerHTML = renderProfileViewEmptyState(
            'No profile selected.',
            'Open a student or staff record from the directory first.',
            '<button type="button" class="lux-secondary-btn" data-pv-action="go-back">Go back</button>'
        );
        return;
    }

    const backLabel = document.getElementById('pv-back-label');
    if (backLabel) {
        backLabel.textContent = `Back to ${type === 'student' ? 'Student Directory' : 'Staff Directory'}`;
    }

    renderProfile(type, id, facParam);
});

let profileViewInteractionsBound = false;

function cloneProfileViewTemplate(templateId) {
    const template = document.getElementById(templateId);
    const node = template?.content?.firstElementChild?.cloneNode(true) || null;
    return node instanceof HTMLElement ? node : null;
}

function mountProfileViewModal(templateId) {
    const modalNode = cloneProfileViewTemplate(templateId);
    if (!modalNode) return null;
    modalNode.id && document.getElementById(modalNode.id)?.remove();
    document.body.appendChild(modalNode);
    return modalNode;
}

function renderProfileViewGradeRecords(id) {
    return Object.keys(KIU_STATE.studentGrades || {}).map(roster => {
        const stGrade = KIU_STATE.studentGrades[roster].find(s => String(s.id) === String(id));
        if (!stGrade) return '';
        const total = (stGrade.q1 || 0) * 0.1 + (stGrade.qa || 0) * 0.1 + (stGrade.mid || 0) * 0.3 + (stGrade.final || 0) * 0.5;
        const letterGrade = total >= 91 ? 'A' : total >= 81 ? 'B' : total >= 71 ? 'C' : total >= 61 ? 'D' : total >= 51 ? 'E' : 'F';
        const gc = total >= 80 ? '#15803d' : total >= 60 ? '#d97706' : '#dc2626';
        return `<div class="pv-course-row">
            <div class="pv-grade-record-main">
                <div class="pv-grade-record-title">${roster.toUpperCase()}</div>
                <div class="pv-grade-record-copy">Q1: ${stGrade.q1} &middot; QA: ${stGrade.qa} &middot; Mid: ${stGrade.mid} &middot; Final: ${stGrade.final}</div>
            </div>
            <div class="pv-grade-record-score" data-pv-grade-record-color="${escapeProfileViewAttr(gc)}">
                <div class="pv-grade-record-letter">${letterGrade}</div>
                <div class="pv-grade-record-total">${total.toFixed(1)}/100</div>
            </div>
        </div>`;
    }).join('') || renderProfileViewEmptyState('No grade records found for this student.');
}

function renderProfileViewTabContent(tabIndex, ctx) {
    const {
        type, id, facCode, person, personFac, facColor, adminTabIndex,
        canManage, debt, schedule, enrolledCourses
    } = ctx;

    if (tabIndex === 0) {
        return `
            <p class="pv-overview-lede">${type === 'student'
                ? `Student profile for ${personFac.name || facCode}. KPI metrics live above; use the tabs for academic records, schedule, documents, and financial history.`
                : `Staff profile for ${personFac.name || facCode}. Teaching assignments and schedule are available in the tabs below.`}</p>
            <div class="pv-overview-grid">
                <div class="pv-overview-contact">
                    <div class="pv-subsection-title pv-subsection-title--tight">Contact</div>
                    <div class="pv-info-row"><span class="pv-info-label">Email</span><span class="pv-info-value pv-info-value--email">${person.email || PROFILE_VIEW_EMPTY_TEXT}</span></div>
                    <div class="pv-info-row"><span class="pv-info-label">Phone</span><span class="pv-info-value">${person.phone || PROFILE_VIEW_EMPTY_TEXT}</span></div>
                    ${person.office ? `<div class="pv-info-row"><span class="pv-info-label">Office</span><span class="pv-info-value">${person.office}</span></div>` : ''}
                </div>
                <div>
                    <div class="pv-subsection-title pv-subsection-title--tight">Quick Links</div>
                    <div class="pv-overview-links">
                        ${type === 'student' ? `
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-1">Academic Record</button>
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-2">Schedule</button>
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-3">Documents</button>
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-4">Financial</button>` : `
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-1">Schedule</button>
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-2">Groups</button>
                        <button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-3">Documents</button>`}
                        ${canManage ? `<button type="button" class="lux-secondary-btn" data-pv-tab-target="pvtab-${adminTabIndex}">Administration</button>` : ''}
                    </div>
                    ${type !== 'student' && (person.subjects || []).length > 0 ? `
                    <div class="pv-assigned-subjects-title">Assigned Subjects</div>
                    <div class="pv-assigned-subjects">
                        ${(person.subjects || []).map(sid => `<span class="pv-assigned-subject-pill lux-status-pill lux-status-pill--soft lux-status-pill--compact" data-pv-subject-pill-bg="${escapeProfileViewAttr(`${facColor}15`)}" data-pv-subject-pill-color="${escapeProfileViewAttr(facColor)}">${sid}</span>`).join('')}
                    </div>` : ''}
                </div>
            </div>`;
    }

    if (type === 'student') {
        if (tabIndex === 1) {
            return `
                <div class="pv-subsection-title">Subjects &amp; Enrollments</div>
                <div id="pv-academic-root" class="pv-academic-root"></div>
                <div class="pv-subsection-title pv-subsection-title--grades">Grade Records by Subject</div>
                ${renderProfileViewGradeRecords(id)}`;
        }
        if (tabIndex === 2) {
            return `
                ${generateMiniTimetableHTML(enrolledCourses, facColor, { type, id, facCode })}
                ${enrolledCourses.length > 0 ? `<div class="pv-session-list-shell">
                    <div class="pv-session-list-title">All Sessions (${enrolledCourses.length})</div>
                    ${enrolledCourses.map(s => `
                    <div class="pv-session-list-row">
                        <div class="pv-session-list-copy"><strong data-pv-inline-accent="${escapeProfileViewAttr(facColor)}">${s.courseId}</strong> <span>(${s.groupName})</span> &middot; ${s.day} ${s.time} &middot; ${s.room} &middot; ${s.duration}</div>
                    </div>`).join('')}
                </div>` : renderProfileViewEmptyState('No registered courses yet.', 'Complete academic registration to populate this tab.')}`;
        }
        if (tabIndex === 3) {
            return renderProfileViewDocumentsTab(type, id, person);
        }
        if (tabIndex === 4) {
            return renderProfileViewFinancialTab(id, debt);
        }
        if (tabIndex === adminTabIndex && canManage) {
            return renderProfileViewAdminTab(type, id, facCode, person, { schedule, enrolledCourses, debt, facColor });
        }
        return '';
    }

    if (tabIndex === 1) {
        return `
            ${generateMiniTimetableHTML(schedule, facColor, { type, id, facCode })}
            ${schedule.length > 0 ? `<div class="pv-session-list-shell">
                <div class="pv-session-list-title">All Sessions (${schedule.length})</div>
                ${schedule.map(s => `
                <div class="pv-session-list-row">
                    <div class="pv-session-list-copy"><strong data-pv-inline-accent="${escapeProfileViewAttr(facColor)}">${s.courseId}</strong> <span>(${s.id})</span> &middot; ${s.day} ${s.time} &middot; ${s.room} &middot; ${s.duration}</div>
                </div>`).join('')}
            </div>` : ''}`;
    }
    if (tabIndex === 2) {
        return `
            <div class="pv-section-head">Teaching Groups</div>
            ${schedule.length > 0 ? schedule.map(s => `
                <div class="pv-course-row pv-course-row--group">
                    <div class="pv-group-card-main">
                        <div class="pv-group-card-title">${s.courseId} &middot; Group ${s.id}</div>
                        <div class="pv-group-card-copy">${s.day} ${s.time} &middot; ${s.room} &middot; ${s.duration}</div>
                    </div>
                    <div class="pv-group-card-side">
                        <div class="pv-group-card-stats">
                            <div><i class="fas fa-users"></i> ${getEnrolledStudentsForGroup(s.courseId, s.id).length || s.registered || 0}/${s.capacity || PROFILE_VIEW_EMPTY_TEXT} students</div>
                            <div>Sem ${s.semester}</div>
                        </div>
                    </div>
                </div>`).join('') : renderProfileViewEmptyState('No groups assigned yet.', 'Teaching groups will appear here after schedule assignments are published.')}`;
    }
    if (tabIndex === 3) {
        return renderProfileViewDocumentsTab(type, id, person);
    }
    if (tabIndex === adminTabIndex && canManage) {
        return renderProfileViewAdminTab(type, id, facCode, person, { schedule, enrolledCourses, debt, facColor });
    }
    return '';
}

function renderProfileViewDocumentsTab(type, id, person) {
    return `
        <div class="pv-section-head">Official Documents</div>
        <div class="pv-document-grid">
            ${type === 'student' ? `
            <div class="pv-document-card">
                <div><div class="pv-document-title">Academic Transcript</div><div class="pv-document-copy">Official PDF with stamp</div></div>
                <div class="pv-document-actions">
                    <button class="lux-primary-btn pv-document-btn" type="button" data-pv-action="generate-transcript" data-pv-user-id="${id}"><i class="fas fa-download"></i> Generate</button>
                </div>
            </div>
            <div class="pv-document-card">
                <div><div class="pv-document-title">Student Status Certificate</div><div class="pv-document-copy">Enrollment verification</div></div>
                <div class="pv-document-actions">
                    <button class="lux-primary-btn pv-document-btn" type="button"><i class="fas fa-download"></i> Generate</button>
                </div>
            </div>` : `
            <div class="pv-document-card">
                <div><div class="pv-document-title">Employment Contract</div><div class="pv-document-copy">Current contract on file</div></div>
                <div class="pv-document-actions">
                    <button class="lux-secondary-btn pv-document-btn" type="button"><i class="fas fa-eye"></i> View</button>
                </div>
            </div>
            <div class="pv-document-card">
                <div><div class="pv-document-title">Teaching Confirmation</div><div class="pv-document-copy">Current semester document</div></div>
                <div class="pv-document-actions">
                    <button class="lux-secondary-btn pv-document-btn" type="button"><i class="fas fa-download"></i> Generate</button>
                </div>
            </div>`}
            ${(person.customDocs || []).map(doc => `
            <div class="pv-document-card">
                <div><div class="pv-document-title">${doc.title}</div><div class="pv-document-copy">${doc.description || 'Custom document'}</div></div>
                <div class="pv-document-actions">
                    <button class="lux-secondary-btn pv-document-btn" type="button" aria-label="Download custom document"><i class="fas fa-download"></i></button>
                </div>
            </div>`).join('')}
        </div>`;
}

function renderProfileViewFinancialTab(id, debt) {
    return `
        <div class="pv-subsection-title">Financial Ledger</div>
        <div class="pv-stat-grid pv-financial-stat-grid">
            <div class="pv-stat-card pv-stat-card--financial" data-pv-financial-border="${escapeProfileViewAttr(debt > 0 ? '#fca5a5' : '#86efac')}" data-pv-financial-accent="${escapeProfileViewAttr(debt > 0 ? '#dc2626' : '#15803d')}">
                <div class="pv-stat-num pv-stat-num--compact pv-stat-num--financial">${debt > 0 ? debt + ' GEL' : 'Paid'}</div>
                <div class="pv-stat-lbl">Current Balance</div>
            </div>
            <div class="pv-stat-card"><div class="pv-stat-num pv-stat-num--compact">2,250</div><div class="pv-stat-lbl">Tuition/Semester (GEL)</div></div>
            <div class="pv-stat-card"><div class="pv-stat-num pv-stat-num--compact pv-stat-num--success">Yes</div><div class="pv-stat-lbl">Scholarship Active</div></div>
        </div>
        <table class="pv-financial-table kiu-table">
            <thead><tr><th class="pv-table-cell-left">Date</th><th>Description</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>
                <tr><td class="pv-table-cell-left">2026-03-01</td><td>Tuition Installment 2 (Spring 2026)</td><td class="pv-financial-amount pv-financial-amount--negative">-1,125 GEL</td><td><span class="pv-financial-status lux-status-pill lux-status-pill--soft lux-status-pill--compact pv-financial-status--pending">Pending</span></td></tr>
                <tr><td class="pv-table-cell-left">2026-01-15</td><td>Tuition Installment 1 (Spring 2026)</td><td class="pv-financial-amount pv-financial-amount--positive">+1,125 GEL</td><td><span class="pv-financial-status lux-status-pill lux-status-pill--soft lux-status-pill--compact pv-financial-status--paid">Paid</span></td></tr>
                <tr><td class="pv-table-cell-left">2025-09-10</td><td>Tuition (Fall 2025)</td><td class="pv-financial-amount pv-financial-amount--positive">+2,250 GEL</td><td><span class="pv-financial-status lux-status-pill lux-status-pill--soft lux-status-pill--compact pv-financial-status--paid">Paid</span></td></tr>
            </tbody>
        </table>`;
}

function pvMountTab(tabId) {
    const panel = document.getElementById('pv-tab-panel');
    const ctx = window.__pvRenderCtx;
    if (!panel || !ctx) return null;
    const tabIndex = Number.parseInt(String(tabId || '').replace('pvtab-', ''), 10);
    if (Number.isNaN(tabIndex)) return null;
    panel.innerHTML = renderProfileViewTabContent(tabIndex, ctx);
    panel.dataset.pvActiveTab = tabId;
    applyProfileViewDataStyles(panel);
    if (tabId === 'pvtab-1' && ctx.type === 'student' && window.__pvAcademicRecord) {
        renderProfileViewAcademicRecord(window.__pvAcademicRecord);
    }
    return panel;
}

function profileViewStatusChip(value, tone) {
    const safeValue = escapeProfileViewText(value);
    const toneClass = tone ? ` ${tone}` : '';
    return `<span class="lux-status-pill lux-status-pill--soft${toneClass}">${safeValue}</span>`;
}

function buildProfileViewTabList(type) {
    const baseTabs = type === 'student'
        ? ['Overview', 'Academic Record', 'Schedule', 'Documents', 'Financial']
        : ['Overview', 'Schedule', 'Groups', 'Documents'];
    return profileViewCanManage() ? [...baseTabs, 'Admin'] : baseTabs;
}

function renderProfileViewStaffMetrics(schedule, person) {
    return `
        <section class="pv-metrics pv-metrics--staff" aria-label="Staff metrics">
            <div class="pv-metrics-grid">
                <article class="pv-metric-card">
                    <span>Sessions</span>
                    <strong>${schedule.length}</strong>
                </article>
                <article class="pv-metric-card">
                    <span>Max hours</span>
                    <strong>${person.maxHours || 12}h</strong>
                </article>
            </div>
        </section>
    `;
}

function renderProfileViewMetrics(record) {
    if (typeof loadStudentAcademicSnapshot !== 'function') return '';
    const snapshot = loadStudentAcademicSnapshot(record);
    const mobilityLabel = record?.mobilityLabel || 'Standard enrollment';
    const holdTone = snapshot.signals?.holdTone === 'danger'
        ? 'is-danger'
        : snapshot.signals?.holdTone === 'warning'
            ? 'is-warning'
            : 'is-success';
    return `
        <div class="pv-metrics-grid">
            <article class="pv-metric-card">
                <span>GPA</span>
                <strong>${escapeProfileViewText(snapshot.performance.secondary)}</strong>
            </article>
            <article class="pv-metric-card">
                <span>ECTS</span>
                <strong>${escapeProfileViewText(String(snapshot.completedEcts))} done</strong>
                <small>${escapeProfileViewText(String(snapshot.enrolledEcts))} enrolled</small>
            </article>
            <article class="pv-metric-card">
                <span>Subjects</span>
                <strong>${escapeProfileViewText(String(snapshot.subjectCount))}</strong>
            </article>
            <article class="pv-metric-card">
                <span>Mobility</span>
                <div class="pv-metric-card-chips">
                    ${profileViewStatusChip(mobilityLabel)}
                    ${profileViewStatusChip(snapshot.signals?.holdLabel || 'Clear', holdTone)}
                </div>
            </article>
        </div>
    `;
}

function renderProfileViewAcademicRecord(record) {
    const root = document.getElementById('pv-academic-root');
    if (!root || typeof loadStudentAcademicSnapshot !== 'function') return;
    const snapshot = loadStudentAcademicSnapshot(record);
    const rows = snapshot.subjects.length ? snapshot.subjects.map((item) => {
        const gradeCopy = item.gradeScore != null && item.gradeScore > 0 ? `${Math.round(item.gradeScore)}%` : '—';
        const scheduleCopy = item.schedule
            ? `${item.schedule.day || 'TBD'} ${item.schedule.time || ''}`.trim()
            : '—';
        const tone = item.status === 'completed' ? 'is-success' : item.status === 'enrolled' ? 'is-info' : '';
        return `
            <tr>
                <td><strong>${escapeProfileViewText(item.name)}</strong><div class="pv-academic-meta">${escapeProfileViewText(item.courseId)}</div></td>
                <td>${escapeProfileViewText(String(item.ects || 0))}</td>
                <td>${profileViewStatusChip(item.status === 'completed' ? 'Completed' : item.status === 'enrolled' ? 'Enrolled' : 'Planned', tone)}</td>
                <td>${escapeProfileViewText(gradeCopy)}</td>
                <td>${escapeProfileViewText(scheduleCopy)}</td>
            </tr>
        `;
    }).join('') : `
        <tr>
            <td colspan="5" class="pv-academic-empty">No subjects are recorded for this student yet.</td>
        </tr>
    `;
    root.innerHTML = `
        <div class="pv-academic-table-wrap">
            <table class="pv-academic-table kiu-table">
                <thead>
                    <tr>
                        <th class="pv-table-cell-left">Subject</th>
                        <th>ECTS</th>
                        <th>Status</th>
                        <th>Grade</th>
                        <th>Schedule</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
    applyProfileViewDataStyles(root);
}

async function hydrateProfileViewStudentRecord(type, id, person, facCode) {
    if (type !== 'student') return;
    const adminProfile = (KIU_STATE.studentAdminProfiles || {})[id] || {};
    const record = {
        ...adminProfile,
        ...person,
        id,
        facultyCode: person.facultyCode || facCode
    };
    if (typeof hydrateStudentAcademicRecord === 'function') {
        try {
            await hydrateStudentAcademicRecord(id, record);
        } catch (error) {
            console.warn('profile-view academic hydrate failed', error);
        }
    }
    window.__pvAcademicRecord = record;
    const metricsRoot = document.getElementById('pv-metrics-root');
    if (metricsRoot) {
        metricsRoot.innerHTML = renderProfileViewMetrics(record);
        applyProfileViewDataStyles(metricsRoot);
    }
    const academicTab = document.getElementById('pvtab-1');
    if (academicTab?.dataset.pvMounted === '1') {
        renderProfileViewAcademicRecord(record);
    }
}

function renderProfileViewAdminTab(type, id, facCode, person, options = {}) {
    const { schedule = [], enrolledCourses = [], debt = 0, facColor = '' } = options;
    const photoSection = `
        <div class="pv-section">
            <div class="pv-section-title">Profile Photo</div>
            <div class="upload-zone" data-pv-action="upload-photo-placeholder" role="button" tabindex="0">
                <i class="fas fa-cloud-upload-alt upload-zone-icon"></i>
                <div class="upload-zone-title">Upload Photo</div>
                <div class="upload-zone-copy">JPG, PNG &middot; Max 5MB</div>
            </div>
        </div>
    `;
    const probationSection = type === 'student' ? `
        <div class="pv-probation-card">
            <div class="pv-probation-head">
                <div>
                    <div class="pv-probation-title"><i class="fas fa-exclamation-triangle"></i> Academic Probation</div>
                    <div class="pv-probation-copy">Limits student to 24 ECTS per semester.</div>
                </div>
                <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--probation" data-pv-action="toggle-probation" data-pv-user-id="${id}"><i class="fas fa-exchange-alt"></i> Toggle</button>
            </div>
        </div>
    ` : '';
    const financialAdminSection = type === 'student' ? `
        <div class="pv-financial-admin-card">
            <div class="pv-financial-admin-title"><i class="fas fa-money-check-alt"></i> Apply Financial Hold / Grant</div>
            <div class="pv-financial-admin-row">
                <div class="pv-financial-admin-field">
                    <label class="pv-financial-admin-label">Amount (GEL)</label>
                    <input class="pv-financial-admin-input lux-control" type="number" id="bursar-debt-amount" placeholder="e.g. 2250">
                </div>
                <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--danger pv-inline-action-btn--hold" data-pv-action="apply-hold" data-pv-user-id="${id}"><i class="fas fa-lock"></i> Apply Hold</button>
                <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--success pv-inline-action-btn--grant" data-pv-action="apply-scholarship" data-pv-user-id="${id}"><i class="fas fa-hand-holding-usd"></i> Apply Grant</button>
            </div>
        </div>
    ` : '';
    const scheduleTarget = type === 'student' ? enrolledCourses : schedule;
    const scheduleAdminSection = `
        <div class="pv-section">
            <div class="pv-section-title">Schedule Management</div>
            <div class="pv-action-bar">
                <button type="button" class="pv-inline-action-btn lux-primary-btn pv-inline-action-btn--primary" data-pv-action="open-session-modal" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}"><i class="fas fa-plus-circle"></i> Add Session</button>
                <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--secondary" data-pv-action="copy-schedule" data-pv-type="${type}" data-pv-id="${id}"><i class="fas fa-copy"></i> Copy to Next Weeks</button>
            </div>
            ${generateMiniTimetableHTML(scheduleTarget, facColor, { type, id, facCode, interactive: true })}
            ${scheduleTarget.length > 0 ? `<div class="pv-session-list-shell">
                <div class="pv-session-list-title">Managed Sessions (${scheduleTarget.length})</div>
                ${scheduleTarget.map((s) => `
                    <div class="pv-session-list-row">
                        <div class="pv-session-list-copy"><strong data-pv-inline-accent="${escapeProfileViewAttr(facColor)}">${s.courseId}</strong> <span>(${s.groupName || s.id})</span> &middot; ${s.day} ${s.time} &middot; ${s.room} &middot; ${s.duration}</div>
                        <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--danger pv-inline-action-btn--compact" data-pv-action="delete-session" data-pv-course="${s.courseId}" data-pv-group="${s.groupName || s.id}" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `).join('')}
            </div>` : renderProfileViewEmptyState('No sessions to manage yet.')}
        </div>
    `;
    const groupsAdminSection = type !== 'student' && schedule.length > 0 ? `
        <div class="pv-section">
            <div class="pv-section-title">Group Management</div>
            ${schedule.map((s) => `
                <div class="pv-course-row pv-course-row--group">
                    <div class="pv-group-card-main">
                        <div class="pv-group-card-title">${s.courseId} &middot; Group ${s.id}</div>
                        <div class="pv-group-card-copy">${s.day} ${s.time} &middot; ${s.room} &middot; ${s.duration}</div>
                    </div>
                    <div class="pv-group-card-side">
                        <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--outline pv-inline-action-btn--compact" data-pv-action="edit-group" data-pv-course="${s.courseId}" data-pv-group="${s.id}" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}"><i class="fas fa-pen"></i></button>
                        <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--danger pv-inline-action-btn--compact" data-pv-action="delete-session" data-pv-course="${s.courseId}" data-pv-group="${s.id}" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            `).join('')}
        </div>
    ` : '';
    const documentsAdminSection = `
        <div class="pv-section">
            <div class="pv-section-title">Document Management</div>
            <p class="pv-admin-copy">Add or remove custom documents. Official templates stay on the Documents tab.</p>
            <button type="button" class="pv-inline-action-btn lux-primary-btn pv-inline-action-btn--primary pv-inline-action-btn--compact" data-pv-action="add-document" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}"><i class="fas fa-plus"></i> Add Document</button>
            ${(person.customDocs || []).length ? `<div class="pv-document-grid pv-document-grid--admin">
                ${(person.customDocs || []).map((doc) => `
                <div class="pv-document-card">
                    <div><div class="pv-document-title">${escapeProfileViewText(doc.title)}</div><div class="pv-document-copy">${escapeProfileViewText(doc.description || 'Custom document')}</div></div>
                    <button type="button" class="pv-inline-action-btn lux-secondary-btn pv-inline-action-btn--danger pv-inline-action-btn--compact" data-pv-action="remove-custom-document" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}" data-pv-doc-title="${escapeProfileViewAttr(doc.title)}"><i class="fas fa-trash-alt"></i></button>
                </div>
                `).join('')}
            </div>` : renderProfileViewEmptyState('No custom documents to manage yet.')}
        </div>
    `;
    return `
        <div class="pv-admin-stack">
            <div class="pv-subsection-title">Administrator Controls</div>
            <p class="pv-admin-copy">Manage holds, media, schedule sessions, and official documents from one place.</p>
            ${photoSection}
            ${probationSection}
            ${financialAdminSection}
            ${scheduleAdminSection}
            ${groupsAdminSection}
            ${documentsAdminSection}
        </div>
    `;
}

function escapeProfileViewAttr(value) {
    return String(value == null ? '' : value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;');
}

const PROFILE_VIEW_DATA_STYLE_BINDINGS = [
    ['data-pv-mini-body-height', '--pv-mini-body-height'],
    ['data-pv-event-top', '--pv-event-top'],
    ['data-pv-event-height', '--pv-event-height'],
    ['data-pv-event-accent', '--pv-event-accent'],
    ['data-pv-event-soft', '--pv-event-soft'],
    ['data-pv-event-soft-hover', '--pv-event-soft-hover'],
    ['data-pv-event-border', '--pv-event-border'],
    ['data-pv-hero-accent', '--pv-hero-accent'],
    ['data-pv-avatar-bg', '--pv-avatar-bg'],
    ['data-pv-role-badge-bg', '--pv-role-badge-bg'],
    ['data-pv-role-badge-color', '--pv-role-badge-color'],
    ['data-pv-status-bg', '--pv-status-bg'],
    ['data-pv-status-color', '--pv-status-color'],
    ['data-pv-faculty-accent', '--pv-faculty-accent'],
    ['data-pv-stat-accent', '--pv-stat-accent'],
    ['data-pv-inline-status-bg', '--pv-inline-status-bg'],
    ['data-pv-inline-status-color', '--pv-inline-status-color'],
    ['data-pv-progress-value-color', '--pv-progress-value-color'],
    ['data-pv-progress-width', '--pv-progress-width'],
    ['data-pv-progress-color', '--pv-progress-color'],
    ['data-pv-financial-status-color', '--pv-financial-status-color'],
    ['data-pv-subject-pill-bg', '--pv-subject-pill-bg'],
    ['data-pv-subject-pill-color', '--pv-subject-pill-color'],
    ['data-pv-grade-record-color', '--pv-grade-record-color'],
    ['data-pv-inline-accent', '--pv-inline-accent'],
    ['data-pv-financial-border', '--pv-financial-border'],
    ['data-pv-financial-accent', '--pv-financial-accent']
];

function applyProfileViewDataStyles(root = document) {
    PROFILE_VIEW_DATA_STYLE_BINDINGS.forEach(([attributeName, cssVariable]) => {
        root.querySelectorAll(`[${attributeName}]`).forEach((node) => {
            const value = node.getAttribute(attributeName);
            if (!value) return;
            node.style.setProperty(cssVariable, value);
        });
    });
}

function bindProfileViewDelegatedInteractions() {
    if (profileViewInteractionsBound) return;
    profileViewInteractionsBound = true;

    const syncProfileViewSessionModal = (target) => {
        if (!target?.dataset?.pvSessionSync) return;
        if (target.dataset.pvSessionSync === 'end') {
            pvsCalcDur();
            return;
        }
        pvsCalcEnd();
    };

    document.addEventListener('click', (event) => {
        const removeTargetNode = event.target.closest('[data-pv-remove-target]');
        if (removeTargetNode) {
            event.preventDefault();
            document.getElementById(removeTargetNode.dataset.pvRemoveTarget || '')?.remove();
            return;
        }

        const overlayNode = event.target.closest('[data-pv-modal-overlay]');
        if (overlayNode && event.target === overlayNode) {
            overlayNode.remove();
            return;
        }

        const tabNode = event.target.closest('[data-pv-tab-target]');
        if (tabNode) {
            event.preventDefault();
            pvSwitchTab(tabNode, tabNode.dataset.pvTabTarget || '');
            return;
        }

        const actionNode = event.target.closest('[data-pv-action]');
        if (!actionNode) return;
        event.preventDefault();

        const action = actionNode.dataset.pvAction || '';
        switch (action) {
            case 'go-back':
                window.history.back();
                return;
            case 'email-placeholder':
                alert(`Sending email to ${actionNode.dataset.pvEmail || ''}`);
                return;
            case 'print':
                window.print();
                return;
            case 'toggle-edit':
                toggleProfileEditMode(actionNode.dataset.pvType || '', actionNode.dataset.pvId || '', actionNode.dataset.pvFac || '');
                return;
            case 'upload-photo-placeholder':
                alert('Photo upload would open file picker');
                return;
            case 'pay-balance-placeholder':
                alert('Redirecting to payment...');
                return;
            case 'toggle-probation':
                toggleProbationForUser(actionNode.dataset.pvUserId || '');
                return;
            case 'open-session-modal':
                openProfileSessionModal(
                    actionNode.dataset.pvType || '',
                    actionNode.dataset.pvId || '',
                    actionNode.dataset.pvFac || '',
                    actionNode.dataset.pvDay || '',
                    actionNode.dataset.pvTime || ''
                );
                return;
            case 'copy-schedule':
                copyScheduleToNextWeeks(actionNode.dataset.pvType || '', actionNode.dataset.pvId || '');
                return;
            case 'delete-session':
                pvDeleteSession(
                    actionNode.dataset.pvCourse || '',
                    actionNode.dataset.pvGroup || '',
                    actionNode.dataset.pvType || '',
                    actionNode.dataset.pvId || '',
                    actionNode.dataset.pvFac || ''
                );
                return;
            case 'edit-group':
                pvEditGroup(
                    actionNode.dataset.pvCourse || '',
                    actionNode.dataset.pvGroup || '',
                    actionNode.dataset.pvType || '',
                    actionNode.dataset.pvId || '',
                    actionNode.dataset.pvFac || ''
                );
                return;
            case 'add-document':
                pvAddDocument(actionNode.dataset.pvType || '', actionNode.dataset.pvId || '', actionNode.dataset.pvFac || '');
                return;
            case 'generate-transcript':
                generateTranscriptForUser(actionNode.dataset.pvUserId || '');
                return;
            case 'remove-static-document':
                actionNode.closest('.pv-document-card')?.remove();
                return;
            case 'remove-custom-document':
                pvRemoveCustomDoc(
                    actionNode.dataset.pvType || '',
                    actionNode.dataset.pvId || '',
                    actionNode.dataset.pvFac || '',
                    actionNode.dataset.pvDocTitle || ''
                );
                return;
            case 'apply-hold':
                applyHoldForUser(actionNode.dataset.pvUserId || '', document.getElementById('bursar-debt-amount')?.value);
                return;
            case 'apply-scholarship':
                applyScholarshipForUser(actionNode.dataset.pvUserId || '', document.getElementById('bursar-debt-amount')?.value);
                return;
            case 'save-profile-edit':
                saveProfileEdit();
                return;
            case 'remove-schedule-row':
                actionNode.closest('.prof-sched-edit-row')?.remove();
                return;
            case 'create-session':
                pvCreateSession();
                return;
            case 'save-group-edit':
                pvSaveGroupEdit();
                return;
            default:
                return;
        }
    });

    document.addEventListener('input', (event) => {
        syncProfileViewSessionModal(event.target);
    });

    document.addEventListener('change', (event) => {
        syncProfileViewSessionModal(event.target);
    });

    if (!window.__pvAvatarErrorBound) {
        window.__pvAvatarErrorBound = true;
        document.addEventListener('error', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLImageElement) || !target.matches('[data-pv-avatar-image]')) return;
            const fallbackHost = target.parentElement;
            if (!fallbackHost) return;
            const fallbackText = fallbackHost.dataset.pvAvatarFallback || 'PU';
            fallbackHost.textContent = fallbackText;
        }, true);
    }

    document.addEventListener('mouseover', (event) => {
        const hoverNode = event.target.closest('[data-pv-hover]');
        if (!hoverNode) return;
        if (hoverNode.dataset.pvHover === 'slot') {
            hoverNode.classList.add('is-hover');
            return;
        }
        if (hoverNode.dataset.pvHover === 'event-card') {
            hoverNode.classList.add('is-hover');
        }
    });

    document.addEventListener('mouseout', (event) => {
        const hoverNode = event.target.closest('[data-pv-hover]');
        if (!hoverNode) return;
        const nextTarget = event.relatedTarget;
        if (nextTarget && hoverNode.contains(nextTarget)) return;
        if (hoverNode.dataset.pvHover === 'slot') {
            hoverNode.classList.remove('is-hover');
            return;
        }
        if (hoverNode.dataset.pvHover === 'event-card') {
            hoverNode.classList.remove('is-hover');
        }
    });
}

function generateMiniTimetableHTML(items, color, profileCtx) {
    // profileCtx = { type, id, facCode }; if provided, admins can create and remove sessions from the grid.
    const daysMap = PROFILE_VIEW_DAY_INDEX;
    const dayNames = PROFILE_VIEW_DAY_NAMES;
    const dayLabels = PROFILE_VIEW_DAY_SHORT_LABELS;
    const startHour = 9;
    const endHour = 19;
    const isAdmin = !!profileCtx?.interactive && profileViewCanManage();
    
    let html = `<div class="pv-mini-timetable">`;
    
    // Header Row
    html += `<div class="pv-mini-timetable-header">
        <div class="pv-mini-timetable-time-head">Time</div>`;
    dayLabels.forEach(d => {
        html += `<div class="pv-mini-timetable-day-head">${d}</div>`;
    });
    html += `</div>`;
    
    // Body Row
    html += `<div class="pv-mini-timetable-body" data-pv-mini-body-height="${escapeProfileViewAttr(`${(endHour-startHour)*50}px`)}">
        <div class="pv-mini-timetable-hours">`;
    for(let h = startHour; h < endHour; h++) {
        html += `<div class="pv-mini-timetable-hour-cell">
            <span class="pv-mini-timetable-hour-label">${h}:00</span>
        </div>`;
    }
    html += `</div>
    <div class="pv-mini-timetable-grid">`;
    for(let i=0; i<6; i++) {
        html += `<div class="pv-mini-timetable-day-column">`;
        for(let h = startHour; h < endHour; h++) {
            if (isAdmin) {
                html += `<div class="pv-mini-timetable-slot pv-mini-timetable-slot--admin" data-pv-hover="slot" data-pv-action="open-session-modal" data-pv-type="${profileCtx.type}" data-pv-id="${profileCtx.id}" data-pv-fac="${profileCtx.facCode}" data-pv-day="${PROFILE_VIEW_DAY_NAMES[i]}" data-pv-time="${h}:00"><span class="slot-hint pv-slot-hint">+ New</span></div>`;
            } else {
                html += `<div class="pv-mini-timetable-slot"></div>`;
            }
        }
        
        // Render events
        const dayItems = (items||[]).filter(item => resolveDayIndex(item.day) === i);
        dayItems.forEach(ev => {
            const[eh, em] = (ev.time||'09:00').split(':').map(Number);
            const startMins = ((eh * 60 + em) - (startHour * 60));
            const topPx = (startMins / 60) * 50;
            
            const durMatch = ev.duration ? ev.duration.match(/\d+/) : null;
            const durMins = durMatch ? parseInt(durMatch[0]) : 110;
            const heightPx = Math.max(30, (durMins / 60) * 50);
            
            const deleteBtn = isAdmin
                ? `<div class="pv-ev-trash" data-pv-action="delete-session" data-pv-course="${ev.courseId}" data-pv-group="${ev.id}" data-pv-type="${profileCtx.type}" data-pv-id="${profileCtx.id}" data-pv-fac="${profileCtx.facCode}"><i class="fas fa-trash"></i></div>`
                : '';
            
            html += `<div class="pv-mini-event-card" data-pv-event-top="${escapeProfileViewAttr(`${topPx}px`)}" data-pv-event-height="${escapeProfileViewAttr(`${heightPx - 4}px`)}" data-pv-event-accent="${escapeProfileViewAttr(color)}" data-pv-event-soft="${escapeProfileViewAttr(`${color}10`)}" data-pv-event-soft-hover="${escapeProfileViewAttr(`${color}20`)}" data-pv-event-border="${escapeProfileViewAttr(`${color}30`)}" title="Course: ${ev.courseId}\nRoom: ${ev.room||''}\nTime: ${ev.time} (${ev.duration||'110min'})\nGroup: ${ev.id}" data-pv-hover="event-card">
                ${deleteBtn}
                <div class="pv-mini-event-title">${ev.courseId} <span class="pv-mini-event-title-group">(${ev.id})</span></div>
                <div class="pv-mini-event-room"><i class="fas fa-map-marker-alt"></i> ${ev.room||''}</div>
            </div>`;
        });
        
        html += `</div>`;
    }
    html += `</div></div></div>`; 
    return html;
}

function renderProfile(type, id, facCode) {
    const fp = getFacultyProfile(facCode);
    const root = document.getElementById('profile-view-root');
    if (!root) return;

    let person = null;
    if (type === 'student') {
        person = getAllStudents().find(s => s.id === id);
    } else if (type === 'professor') {
        person = getAllStaff('professors').find(p => p.id === id);
    } else if (type === 'ta') {
        person = getAllStaff('tas').find(p => p.id === id);
    }

    if (!person) {
        root.innerHTML = renderProfileViewEmptyState(
            `Profile not found for ID: ${id}`,
            'The selected record is unavailable for the current role or faculty context.',
            '<button type="button" class="lux-secondary-btn" data-pv-action="go-back">Go back</button>'
        );
        return;
    }

    const personFac = getFacultyProfile(person.facultyCode || facCode);
    const facColor  = personFac.color || getFacultyColor(facCode);
    const avatarUrl = person.photo || '';
    const avatarInitials = (person.nameEn || person.name || 'PU')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0]?.toUpperCase() || '')
        .join('') || 'PU';

    const roleAccent = getFacultyThemeTone(facCode, {
        useCurrentPalette: true,
        softAlpha: 0.12,
        borderAlpha: 0.24
    });
    // Role badge
    const roleBadgeMap = {
        student: { label: 'Student', bg: roleAccent.softBg, color: roleAccent.accent },
        professor: { label: person.title || 'Professor', bg: '#dcfce7', color: '#15803d' },
        ta: { label: 'Teaching Assistant', bg: '#fef3c7', color: '#92400e' }
    };
    const badge = roleBadgeMap[type] || roleBadgeMap.student;

    const tabs = buildProfileViewTabList(type);
    const adminTabIndex = profileViewCanManage() ? tabs.length - 1 : -1;
    const canManage = profileViewCanManage();

    const statusBg = (person.status === 'Active') ? '#dcfce7' : (person.status === 'Probation' ? '#fef3c7' : '#fee2e2');
    const statusFg = (person.status === 'Active') ? '#15803d' : (person.status === 'Probation' ? '#92400e' : '#dc2626');
    const debt = (KIU_STATE.tuitionBalances || {})[id] || 0;

    // GPA / rating
    const gpa = person.gpa || 0;
    const gpaColor = gpa >= 3.5 ? '#15803d' : gpa >= 2.5 ? '#d97706' : '#dc2626';

    // Build schedule items
    const schedule = getProfSchedule(person.name || '');
    const enrolledCourses =[];
    
    if (type === 'student') {
        // FIX: Fetch directly from the student's actual registration schedule
        const studentSched = KIU_STATE.studentSchedulesByStudent?.[id] ||[];
        studentSched.forEach(s => {
            enrolledCourses.push({
                courseId: s.courseId, 
                courseName: s.courseName || s.courseId,
                id: s.groupId, 
                groupName: s.groupName || s.groupId,
                day: s.day, 
                time: s.time || '09:00', 
                room: s.room || '', 
                duration: s.duration || '110min',
                prof: s.prof || 'TBD', 
                ects: s.ects || 6
            });
        });
    }

    window.__pvRenderCtx = {
        type, id, facCode, person, personFac, facColor, tabs, adminTabIndex,
        canManage, debt, schedule, enrolledCourses, badge, statusBg, statusFg
    };

    root.innerHTML = `
    <div class="pv-shell" data-lux-glass-root="1">
        <div class="pv-command-bar">
            <button type="button" class="lux-secondary-btn pv-command-back" data-pv-action="go-back"><i class="fas fa-arrow-left"></i> Back</button>
            <div class="pv-command-actions">
                <button class="pv-action-btn lux-secondary-btn" type="button" data-pv-action="email-placeholder" data-pv-email="${(person.email || '').replace(/"/g, '&quot;')}"><i class="fas fa-envelope"></i> Email</button>
                <button class="pv-action-btn lux-secondary-btn" type="button" data-pv-action="print"><i class="fas fa-print"></i> Print</button>
                ${canManage ? `<button class="pv-action-btn pv-action-btn--edit lux-primary-btn" type="button" data-pv-action="toggle-edit" data-pv-type="${type}" data-pv-id="${id}" data-pv-fac="${facCode}"><i class="fas fa-edit"></i> Edit</button>` : ''}
            </div>
        </div>
        <div class="pv-profile-head">
            <div class="pv-identity-block">
                <div class="pv-hero" data-pv-hero-accent="${escapeProfileViewAttr(facColor)}" data-pv-faculty-accent="${escapeProfileViewAttr(facColor)}">
                    <div class="pv-hero-pattern"></div>
                </div>
                <div class="pv-identity-meta pv-meta">
                    <div class="pv-identity-row">
                        <div class="pv-avatar-wrap">
                            <div class="pv-avatar" data-pv-avatar-bg="${escapeProfileViewAttr(`${facColor}dd`)}" data-pv-avatar-fallback="${avatarInitials}">
                                ${avatarUrl
                                    ? `<img class="pv-avatar-image" data-pv-avatar-image="1" loading="lazy" src="${avatarUrl}" alt="${person.name}">`
                                    : avatarInitials}
                            </div>
                        </div>
                        <div class="pv-identity-copy">
                            <div class="pv-meta-head">
                                <div>
                                    <div class="pv-name">${person.name || PROFILE_VIEW_EMPTY_TEXT}</div>
                                    ${person.nameEn ? `<div class="pv-name-en">${person.nameEn}</div>` : ''}
                                    <div class="pv-role-badge lux-status-pill lux-status-pill--soft" data-pv-role-badge-bg="${escapeProfileViewAttr(badge.bg)}" data-pv-role-badge-color="${escapeProfileViewAttr(badge.color)}">
                                        <i class="fas fa-${type === 'student' ? 'user-graduate' : type === 'professor' ? 'chalkboard-teacher' : 'user-tie'}"></i>
                                        ${badge.label}
                                        <span class="pv-role-sep">&middot;</span>
                                        ${personFac.name || facCode}
                                    </div>
                                </div>
                                <span class="pv-status-badge lux-status-pill lux-status-pill--soft" data-pv-status-bg="${escapeProfileViewAttr(statusBg)}" data-pv-status-color="${escapeProfileViewAttr(statusFg)}">${person.status || 'Active'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="pv-meta-pills" data-pv-faculty-accent="${escapeProfileViewAttr(facColor)}">
                        <div class="pv-meta-pill"><i class="fas fa-id-badge"></i> ID: <strong>${id}</strong></div>
                        ${person.program ? `<div class="pv-meta-pill"><i class="fas fa-graduation-cap"></i> ${person.program}</div>` : ''}
                        ${person.joinYear ? `<div class="pv-meta-pill"><i class="fas fa-calendar-alt"></i> Since ${person.joinYear}</div>` : ''}
                        ${person.email ? `<div class="pv-meta-pill"><i class="fas fa-envelope"></i> ${person.email}</div>` : ''}
                        ${type !== 'student' && person.office ? `<div class="pv-meta-pill"><i class="fas fa-door-open"></i> Office: ${person.office}</div>` : ''}
                    </div>
                </div>
            </div>
            <div class="pv-metrics-band">
                ${type === 'student'
                    ? `<section class="pv-metrics" id="pv-metrics-root" aria-label="Student metrics"></section>`
                    : renderProfileViewStaffMetrics(schedule, person)}
            </div>
        </div>
        <div class="pv-profile-main">
            <nav class="pv-tabs lux-tab-strip is-profile-tabs" role="tablist" aria-label="Profile sections">
                ${tabs.map((t, i) => `<button type="button" role="tab" class="pv-tab lux-tab-btn ${i === 0 ? 'active' : ''}" data-pv-tab-target="pvtab-${i}" aria-selected="${i === 0 ? 'true' : 'false'}" aria-controls="pv-tab-panel" aria-pressed="${i === 0 ? 'true' : 'false'}">${t}</button>`).join('')}
            </nav>
            <div id="pv-tab-panel" class="pv-tab-panel" role="tabpanel" aria-labelledby="pvtab-0"></div>
        </div>
    </div>`;
    applyProfileViewDataStyles(root);
    hydrateProfileViewStudentRecord(type, id, person, facCode);
    pvMountTab('pvtab-0');
}

function pvSwitchTab(el, tabId) {
    document.querySelectorAll('.pv-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-pressed', 'false');
        t.setAttribute('aria-selected', 'false');
    });
    el.classList.add('active');
    el.setAttribute('aria-pressed', 'true');
    el.setAttribute('aria-selected', 'true');
    pvMountTab(tabId);
}

// ============================================
// PROFILE EDIT MODE
// ============================================
function toggleProfileEditMode(type, id, facCode) {
    const fp = getFacultyProfile(facCode);
    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) { alert('Person not found!'); return; }

    const facColor = fp.color || getFacultyColor(facCode);
    const days = PROFILE_VIEW_DAY_NAMES;
    const dayOpts = days.map(d => `<option value="${d}">${d}</option>`).join('');

    let fieldsHtml = '';
    if (type === 'student') {
        fieldsHtml = `
            <div class="pv-edit-grid-two">
                <div><label class="em-lbl">Name (Georgian)</label><input id="em-name" type="text" value="${person.name||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Name (English)</label><input id="em-name-en" type="text" value="${person.nameEn||''}" class="em-input lux-control"></div>
            </div>
            <div class="pv-edit-grid-two">
                <div><label class="em-lbl">Email</label><input id="em-email" type="email" value="${person.email||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Phone</label><input id="em-phone" type="text" value="${person.phone||''}" class="em-input lux-control"></div>
            </div>
            <div class="pv-edit-grid-four">
                <div><label class="em-lbl">Program</label><input id="em-program" type="text" value="${person.program||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Semester</label><input id="em-semester" type="number" value="${person.semester||1}" class="em-input lux-control"></div>
                <div><label class="em-lbl">GPA</label><input id="em-gpa" type="number" step="0.01" value="${person.gpa||0}" class="em-input lux-control"></div>
                <div><label class="em-lbl">ECTS</label><input id="em-ects" type="number" value="${person.ects||0}" class="em-input lux-control"></div>
            </div>
            <div class="pv-edit-grid-two">
                <div><label class="em-lbl">Status</label><select id="em-status" class="em-input lux-control"><option ${person.status==='Active'?'selected':''}>Active</option><option ${person.status==='Probation'?'selected':''}>Probation</option><option ${person.status==='Suspended'?'selected':''}>Suspended</option></select></div>
                <div><label class="em-lbl">Tuition Balance (GEL)</label><input id="em-balance" type="number" value="${(KIU_STATE.tuitionBalances||{})[id]||0}" class="em-input lux-control"></div>
            </div>`;
    } else {
        fieldsHtml = `
            <div class="pv-edit-grid-two">
                <div><label class="em-lbl">Name (Georgian)</label><input id="em-name" type="text" value="${person.name||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Name (English)</label><input id="em-name-en" type="text" value="${person.nameEn||''}" class="em-input lux-control"></div>
            </div>
            <div class="pv-edit-grid-three">
                <div><label class="em-lbl">Rank/Title</label><select id="em-title" class="em-input lux-control"><option ${person.title==='Professor'?'selected':''}>Professor</option><option ${person.title==='Associate Professor'?'selected':''}>Associate Professor</option><option ${person.title==='Lecturer'?'selected':''}>Lecturer</option><option ${person.title==='Visiting Professor'?'selected':''}>Visiting Professor</option><option ${person.title==='Teaching Assistant'?'selected':''}>Teaching Assistant</option></select></div>
                <div><label class="em-lbl">Office</label><input id="em-office" type="text" value="${person.office||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Since (Year)</label><input id="em-joinyear" type="number" value="${person.joinYear||2024}" class="em-input lux-control"></div>
            </div>
            <div class="pv-edit-grid-three">
                <div><label class="em-lbl">Email</label><input id="em-email" type="email" value="${person.email||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Phone</label><input id="em-phone" type="text" value="${person.phone||''}" class="em-input lux-control"></div>
                <div><label class="em-lbl">Max Teaching Hours</label><input id="em-maxhours" type="number" value="${person.maxHours||12}" class="em-input lux-control"></div>
            </div>
            <div class="pv-edit-grid-two">
                <div><label class="em-lbl">Status</label><select id="em-status" class="em-input lux-control"><option ${person.status==='Active'?'selected':''}>Active</option><option ${person.status==='Suspended'?'selected':''}>Suspended</option></select></div>
            </div>`;
    }

    const modalHtml = `
    <div id="profile-edit-modal" class="pv-modal-overlay pv-modal-overlay--profile-edit" data-pv-modal-overlay>
        <div class="pv-profile-edit-card surface-card">
            <div class="pv-profile-edit-header">
                <div>
                    <div class="pv-profile-edit-title">Edit Profile &middot; ${person.name}</div>
                    <div class="pv-profile-edit-subtitle">${type.charAt(0).toUpperCase()+type.slice(1)} &middot; ID: ${id}</div>
                </div>
                <button type="button" class="pv-profile-edit-close lux-secondary-btn" data-pv-remove-target="profile-edit-modal"><i class="fas fa-times"></i></button>
            </div>
            <div class="pv-profile-edit-form" id="profile-edit-form" data-type="${type}" data-id="${id}" data-fac="${facCode}">
                ${fieldsHtml}
                <div class="pv-profile-edit-actions">
                    <button type="button" class="pv-profile-edit-save lux-primary-btn" data-pv-action="save-profile-edit"><i class="fas fa-save"></i> Save All Changes</button>
                    <button type="button" class="pv-profile-edit-cancel lux-secondary-btn" data-pv-remove-target="profile-edit-modal">Cancel</button>
                </div>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function saveProfileEdit() {
    const form = document.getElementById('profile-edit-form');
    if (!form) return;
    const type = form.dataset.type;
    const id = form.dataset.id;
    const fac = form.dataset.fac;

    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) { alert('Person not found!'); return; }

    const oldName = person.name;
    person.name = document.getElementById('em-name')?.value.trim() || person.name;
    person.nameEn = document.getElementById('em-name-en')?.value.trim() || '';
    person.email = document.getElementById('em-email')?.value.trim() || person.email;
    person.phone = document.getElementById('em-phone')?.value.trim() || '';
    person.status = document.getElementById('em-status')?.value || 'Active';

    if (type === 'student') {
        person.program = document.getElementById('em-program')?.value.trim() || '';
        person.semester = parseInt(document.getElementById('em-semester')?.value) || 1;
        person.gpa = parseFloat(document.getElementById('em-gpa')?.value) || 0;
        person.ects = parseInt(document.getElementById('em-ects')?.value) || 0;
        if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
        KIU_STATE.tuitionBalances[id] = parseInt(document.getElementById('em-balance')?.value) || 0;
    } else {
        person.title = document.getElementById('em-title')?.value || person.title;
        person.office = document.getElementById('em-office')?.value.trim() || '';
        person.joinYear = document.getElementById('em-joinyear')?.value || person.joinYear;
        person.maxHours = parseInt(document.getElementById('em-maxhours')?.value) || 12;

        if (oldName !== person.name) {
            for (const cId in KIU_STATE.availableGroups) {
                (KIU_STATE.availableGroups[cId] ||[]).forEach(g => {
                    if (g.prof === oldName) g.prof = person.name;
                    if (g.ta === oldName) g.ta = person.name;
                });
            }
        }
    }

    saveState();
    document.getElementById('profile-edit-modal').remove();
    renderProfile(type, id, fac);
    showProfileViewToast('Profile updated successfully!');
}

function showProfileViewToast(message, options = {}) {
    const tone = String(options.tone || 'success');
    const detail = String(options.detail || '').trim();
    const durationMs = Number(options.durationMs || 3000);
    const toast = document.createElement('div');
    toast.className = `pv-toast pv-toast--${tone}`;
    toast.innerHTML = `
        <i class="fas fa-check-circle pv-toast-icon"></i>
        <div class="pv-toast-content">
            <div>${escapeHtml(String(message || 'Saved.'))}</div>
            ${detail ? `<div class="pv-toast-detail">${escapeHtml(detail)}</div>` : ''}
        </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), durationMs);
}

// ============================================
// INLINE SCHEDULE EDITING IN PROFILES
// ============================================
function addProfileSchedRow(type, id) {
    const container = document.getElementById('profile-sched-rows');
    if (!container) return;
    const empty = container.querySelector('.profile-view-empty-state');
    if (empty && !container.querySelector('.prof-sched-edit-row')) container.innerHTML = '';
    const row = cloneProfileViewTemplate('pv-schedule-row-template');
    if (!row) return;
    const daySelect = row.querySelector('.ps-day');
    if (daySelect) {
        daySelect.innerHTML = PROFILE_VIEW_DAY_NAMES.map((day) => `<option>${day}</option>`).join('');
    }
    container.appendChild(row);
}

function saveProfileSchedule(type, id, facCode) {
    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) { alert('Person not found!'); return; }

    const personName = person.name;
    for (const cId in KIU_STATE.availableGroups) {
        KIU_STATE.availableGroups[cId] = (KIU_STATE.availableGroups[cId] ||[]).filter(g => {
            if (type === 'student') return true;
            return g.prof !== personName && g.ta !== personName;
        });
        if (KIU_STATE.availableGroups[cId].length === 0) delete KIU_STATE.availableGroups[cId];
    }

    const rows = document.querySelectorAll('#profile-sched-rows .prof-sched-edit-row');
    const newSubjects = new Set();
    rows.forEach(row => {
        const courseId = row.querySelector('.ps-course')?.value.trim();
        const groupName = row.querySelector('.ps-group')?.value.trim() || 'G1';
        const day = row.querySelector('.ps-day')?.value;
        const room = row.querySelector('.ps-room')?.value.trim() || '';
        const time = row.querySelector('.ps-time')?.value || '09:00';
        const duration = row.querySelector('.ps-dur')?.value || '110min';
        if (!courseId) return;
        newSubjects.add(courseId);

        if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] =[];
        const session = { id: groupName, name: groupName, day, time, room, duration, faculty: facCode, capacity: 40, registered: 0 };
        if (type === 'professor') session.prof = personName;
        else if (type === 'ta') session.ta = personName;
        KIU_STATE.availableGroups[courseId].push(session);
    });

    if (type !== 'student') person.subjects = [...newSubjects];
    saveState();
    renderProfile(type, id, facCode);

    showProfileViewToast('Schedule saved & synced!');
}

// ============================================
// MASTER SCHEDULER-STYLE MODAL FOR PROFILES
// ============================================
function openProfileSessionModal(type, id, facCode, prefillDay, prefillTime) {
    const fp = getFacultyProfile(facCode);
    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) { alert('Person not found!'); return; }

    // Get subjects for dropdown
    let subjects = getActiveCurriculum(facCode);
    if (subjects.length === 0) subjects = KIU_STATE.curriculum ||[];
    const subjectOpts = subjects.length > 0
        ? subjects.map(s => `<option value="${s.id}">${s.id} &middot; ${s.name}</option>`).join('')
        : '<option value="">No subjects available</option>';

    // Get all staff names for autocomplete
    const allProfs = getAllStaff('professors').map(p => `<option value="${p.name}">`).join('');
    const allTAs = getAllStaff('tas').map(p => `<option value="${p.name}">`).join('');

    const modal = mountProfileViewModal('pv-session-modal-template');
    if (!modal) return;

    modal.querySelector('[data-pv-session-subtitle]').textContent = `For: ${person.name} · ${type.charAt(0).toUpperCase()+type.slice(1)}`;
    const form = modal.querySelector('#pv-session-form');
    form.dataset.type = type;
    form.dataset.id = id;
    form.dataset.fac = facCode;
    form.dataset.person = person.name;

    modal.querySelector('#pvs-subject').innerHTML = subjectOpts;
    modal.querySelector('#pvs-day').innerHTML = PROFILE_VIEW_DAY_NAMES.map((day) => `<option ${day===prefillDay?'selected':''}>${day}</option>`).join('');
    modal.querySelector('#pvs-endtime').innerHTML = PROFILE_VIEW_END_TIME_OPTIONS.map((time) => `<option>${time}</option>`).join('');
    modal.querySelector('#pvs-profs-dl').innerHTML = allProfs;
    modal.querySelector('#pvs-tas-dl').innerHTML = allTAs;
    modal.querySelector('#pvs-time').value = normalizeTimeString(prefillTime || '09:00', '09:00');
    modal.querySelector('#pvs-prof').value = type === 'professor' ? person.name : '';
    modal.querySelector('#pvs-ta').value = type === 'ta' ? person.name : '';
    modal.querySelector('#pvs-faculty-name').value = fp.name || facCode;
    pvsCalcEnd();
}

function pvsCalcEnd() {
    const t = document.getElementById('pvs-time');
    const d = document.getElementById('pvs-duration');
    const e = document.getElementById('pvs-endtime');
    if (!t || !d || !e) return;
    const end = convertTimeToMinutes(t.value || '09:00') + parseInt(d.value || 110, 10);
    // Select the closest option
    const opts = e.querySelectorAll('option');
    let closest = null, closestDiff = 9999;
    opts.forEach(o => {
        const diff = Math.abs(convertTimeToMinutes(o.value) - end);
        if (diff < closestDiff) { closestDiff = diff; closest = o; }
    });
    if (closest) closest.selected = true;
}

function pvsCalcDur() {
    const t = document.getElementById('pvs-time');
    const d = document.getElementById('pvs-duration');
    const e = document.getElementById('pvs-endtime');
    if (!t || !d || !e) return;
    const diffMin = convertTimeToMinutes(e.value || '11:00') - convertTimeToMinutes(t.value || '09:00');
    // Auto-select the closest duration option
    const durOpts =[{v:50},{v:80},{v:110},{v:170}];
    let best = durOpts[0].v, bestDiff = 9999;
    durOpts.forEach(o => {
        const diff = Math.abs(o.v - diffMin);
        if (diff < bestDiff) { bestDiff = diff; best = o.v; }
    });
    d.value = String(best);
}

function pvCreateSession() {
    const form = document.getElementById('pv-session-form');
    if (!form) return;
    const type = form.dataset.type;
    const id = form.dataset.id;
    const facCode = form.dataset.fac;
    const personName = form.dataset.person;

    const courseId = document.getElementById('pvs-subject')?.value?.trim();
    const groupId = document.getElementById('pvs-group')?.value?.trim();
    const day = document.getElementById('pvs-day')?.value;
    const room = document.getElementById('pvs-room')?.value?.trim() || 'TBD';
    const time = normalizeTimeString(document.getElementById('pvs-time')?.value, '09:00');
    const endTimeVal = normalizeTimeString(document.getElementById('pvs-endtime')?.value || '', '');
    const prof = document.getElementById('pvs-prof')?.value?.trim() || (type==='professor' ? personName : 'TBD');
    const ta = document.getElementById('pvs-ta')?.value?.trim() || (type==='ta' ? personName : '');
    const capacity = parseInt(document.getElementById('pvs-capacity')?.value || 40);

    // Calculate duration from start and end time
    let duration;
    if (endTimeVal) {
        duration = convertTimeToMinutes(endTimeVal) - convertTimeToMinutes(time);
        if (duration <= 0) duration = parseInt(document.getElementById('pvs-duration')?.value || 110);
    } else {
        duration = parseInt(document.getElementById('pvs-duration')?.value || 110);
    }

    if (!courseId || courseId === PROFILE_VIEW_EMPTY_TEXT) { alert('Please select a subject.'); return; }
    if (!groupId) { alert('Please enter a Group ID (e.g. G1).'); return; }

    if (type === 'student') {
        if (!KIU_STATE.studentSchedulesByStudent) KIU_STATE.studentSchedulesByStudent = {};
        if (!KIU_STATE.studentSchedulesByStudent[id]) KIU_STATE.studentSchedulesByStudent[id] = [];
        let existingGroup = (KIU_STATE.availableGroups[courseId] || []).find(g => g.id === groupId.toLowerCase() || g.name === groupId);
        
        if (existingGroup) {
            KIU_STATE.studentSchedulesByStudent[id].push({ courseId: courseId, courseName: courseId, groupId: existingGroup.id, groupName: existingGroup.name, day: existingGroup.day || day, time: existingGroup.time || time, duration: existingGroup.duration || `${duration}min`, prof: existingGroup.prof || prof, room: existingGroup.room || room, ects: 6 });
            existingGroup.registered = (existingGroup.registered || 0) + 1;
        } else {
            if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] = [];
            KIU_STATE.availableGroups[courseId].push({ id: groupId.toLowerCase(), name: groupId, faculty: facCode, day, time, room, duration: `${duration}min`, prof, ta, capacity, registered: 1 });
            KIU_STATE.studentSchedulesByStudent[id].push({ courseId: courseId, courseName: courseId, groupId: groupId.toLowerCase(), groupName: groupId, day: day, time: time, duration: `${duration}min`, prof: prof, room: room, ects: 6 });
        }
    } else {
        if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] =[];
        KIU_STATE.availableGroups[courseId].push({
            id: groupId.toLowerCase(), name: groupId, faculty: facCode,
            day, time, room, duration: `${duration}min`,
            prof, ta, capacity, registered: 0
        });

        // Update person's subjects
        let person = null;
        if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
        else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
        if (person) {
            if (!person.subjects) person.subjects =[];
            if (!person.subjects.includes(courseId)) person.subjects.push(courseId);
        }
    }

    saveState();
    document.getElementById('pv-session-modal')?.remove();
    renderProfile(type, id, facCode);

    showProfileViewToast('Session created & synced!');
}

function pvDeleteSession(courseId, groupId, type, personId, facCode) {
    if (!confirm(`Delete session ${courseId} (${groupId})?`)) return;
    if (type === 'student') {
        if (KIU_STATE.studentSchedulesByStudent && KIU_STATE.studentSchedulesByStudent[personId]) {
            KIU_STATE.studentSchedulesByStudent[personId] = KIU_STATE.studentSchedulesByStudent[personId].filter(
                s => !(s.courseId === courseId && (s.groupId === groupId || s.groupName === groupId))
            );
        }
    } else {
        if (KIU_STATE.availableGroups[courseId]) {
            KIU_STATE.availableGroups[courseId] = KIU_STATE.availableGroups[courseId].filter(g => g.id !== groupId && g.name !== groupId);
            if (KIU_STATE.availableGroups[courseId].length === 0) delete KIU_STATE.availableGroups[courseId];
        }
    }
    saveState();
    renderProfile(type, personId, facCode);
}

// ============================================
// EDIT GROUP MODAL
// ============================================
function pvEditGroup(courseId, groupId, type, personId, facCode) {
    const groups = KIU_STATE.availableGroups[courseId] ||[];
    const group = groups.find(g => g.id === groupId || g.name === groupId);
    if (!group) { alert('Group not found!'); return; }
    
    const normalizedGroupDay = PROFILE_VIEW_DAY_NAMES[PROFILE_VIEW_DAY_INDEX[group.day] ?? 0] || group.day || PROFILE_VIEW_DAY_NAMES[0];
    
    // Calculate current end time from start and duration
    const [gH,gM] = (group.time||'09:00').split(':').map(Number);
    const gDurMin = parseInt((group.duration||'110min').match(/\d+/)?.[0] || 110);
    const gEndMin = gH*60+gM+gDurMin;
    // Find the closest end time option
    let bestEndOpt = PROFILE_VIEW_END_TIME_OPTIONS[0];
    let bestEndDiff = 9999;
    PROFILE_VIEW_END_TIME_OPTIONS.forEach(t => {
        const [h,m] = t.split(':').map(Number);
        const diff = Math.abs((h*60+m) - gEndMin);
        if (diff < bestEndDiff) { bestEndDiff = diff; bestEndOpt = t; }
    });
    const modal = mountProfileViewModal('pv-editgroup-modal-template');
    if (!modal) return;

    modal.querySelector('[data-pv-group-subtitle]').textContent = `${courseId} · ${groupId}`;
    const form = modal.querySelector('#pv-eg-form');
    form.dataset.course = courseId;
    form.dataset.group = groupId;
    form.dataset.type = type;
    form.dataset.pid = personId;
    form.dataset.fac = facCode;

    modal.querySelector('#peg-day').innerHTML = PROFILE_VIEW_DAY_NAMES.map((day) => `<option${day===normalizedGroupDay?' selected':''}>${day}</option>`).join('');
    modal.querySelector('#peg-time').innerHTML = PROFILE_VIEW_GROUP_TIME_OPTIONS.map((time) => `<option${time===(group.time||'09:00')?' selected':''}>${time}</option>`).join('');
    modal.querySelector('#peg-dur').innerHTML = PROFILE_VIEW_GROUP_DURATION_OPTIONS.map((duration) => `<option value="${duration.value}"${duration.value===(group.duration||'110min')?' selected':''}>${duration.label}</option>`).join('');
    modal.querySelector('#peg-endtime').innerHTML = PROFILE_VIEW_END_TIME_OPTIONS.map((time) => `<option${time===bestEndOpt?' selected':''}>${time}</option>`).join('');
    modal.querySelector('#peg-room').value = group.room || '';
    modal.querySelector('#peg-cap').value = String(group.capacity || 40);
    modal.querySelector('#peg-prof').value = group.prof || '';
    modal.querySelector('#peg-ta').value = group.ta || '';
}

function pvSaveGroupEdit() {
    const form = document.getElementById('pv-eg-form');
    if (!form) return;
    const courseId = form.dataset.course;
    const groupId = form.dataset.group;
    const type = form.dataset.type;
    const personId = form.dataset.pid;
    const facCode = form.dataset.fac;
    
    const groups = KIU_STATE.availableGroups[courseId] ||[];
    const group = groups.find(g => g.id === groupId || g.name === groupId);
    if (!group) { alert('Group not found'); return; }
    
    group.day = document.getElementById('peg-day')?.value;
    group.time = document.getElementById('peg-time')?.value;
    group.room = document.getElementById('peg-room')?.value?.trim() || '';
    group.capacity = parseInt(document.getElementById('peg-cap')?.value || 40);
    group.prof = document.getElementById('peg-prof')?.value?.trim() || '';
    group.ta = document.getElementById('peg-ta')?.value?.trim() || '';
    
    // Compute duration from start + end time
    const endTimeVal = document.getElementById('peg-endtime')?.value;
    if (endTimeVal && group.time) {
        const [sh,sm] = group.time.split(':').map(Number);
        const [eh,em] = endTimeVal.split(':').map(Number);
        const diffMin = (eh*60+em) - (sh*60+sm);
        group.duration = diffMin > 0 ? `${diffMin}min` : (document.getElementById('peg-dur')?.value || '110min');
    } else {
        group.duration = document.getElementById('peg-dur')?.value || '110min';
    }
    
    saveState();
    document.getElementById('pv-editgroup-modal')?.remove();
    renderProfile(type, personId, facCode);
    
    showProfileViewToast('Group updated!');
}

// ============================================
// DOCUMENT MANAGEMENT
// ============================================
function pvAddDocument(type, id, facCode) {
    const title = prompt('Document title:', '');
    if (!title || !title.trim()) return;
    const desc = prompt('Short description (optional):', '');
    
    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) { alert('Person not found!'); return; }
    
    if (!person.customDocs) person.customDocs =[];
    person.customDocs.push({ title: title.trim(), description: (desc||'').trim(), addedDate: new Date().toLocaleDateString() });
    saveState();
    renderProfile(type, id, facCode);
    
    showProfileViewToast('Document added!');
}

function pvRemoveDocument(btn) {
    if (!confirm('Remove this document?')) return;
    const card = btn.closest('.pv-document-card');
    if (card) card.remove();
}

function pvRemoveCustomDoc(type, id, facCode, docTitle) {
    if (!confirm(`Remove document "${docTitle}"?`)) return;
    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) return;
    
    person.customDocs = (person.customDocs ||[]).filter(d => d.title !== docTitle);
    saveState();
    renderProfile(type, id, facCode);
}

// ============================================
// COPY SCHEDULE TO NEXT WEEKS
// ============================================
function copyScheduleToNextWeeks(type, id) {
    const weeksRemaining = prompt('How many weeks should the schedule be copied to?\n(Schedules repeat weekly for the semester. Enter number of remaining weeks, e.g. 14)', '14');
    if (!weeksRemaining || isNaN(parseInt(weeksRemaining))) return;
    const weeks = parseInt(weeksRemaining);

    let person = null;
    if (type === 'student') person = getAllStudents().find(s => s.id === id);
    else if (type === 'professor') person = getAllStaff('professors').find(p => p.id === id);
    else if (type === 'ta') person = getAllStaff('tas').find(p => p.id === id);
    if (!person) { alert('Person not found!'); return; }

    // Get current schedule
    let schedule = [];
    if (type === 'student') {
        const studentSched = KIU_STATE.studentSchedulesByStudent?.[id] || [];
        schedule = studentSched.map(s => ({ courseId: s.courseId, id: s.groupId, day: s.day, time: s.time, room: s.room, duration: s.duration, faculty: PROFILE_VIEW_UNKNOWN_FACULTY }));
    } else {
        schedule = getProfSchedule(person.name || '');
    }
    if (schedule.length === 0) { alert('No sessions found to copy.'); return; }

    // Mark schedule as semester-wide
    if (!KIU_STATE.semesterSchedules) KIU_STATE.semesterSchedules = {};
    KIU_STATE.semesterSchedules[person.name || id] = {
        sessions: schedule.map(s => ({ courseId: s.courseId, id: s.id, day: s.day, time: s.time, room: s.room, duration: s.duration, faculty: s.faculty })),
        weeks: weeks,
        copiedAt: new Date().toISOString()
    };

    saveState();

    showProfileViewToast(
        `Schedule duplicated across ${weeks} weeks!`,
        {
            tone: 'info',
            detail: `${schedule.length} sessions x ${weeks} weeks = ${schedule.length * weeks} total sessions`,
            durationMs: 4000
        }
    );
}
