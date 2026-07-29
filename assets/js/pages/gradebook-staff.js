/* Wave bag: Wave 26 gradebook-staff */
window.KiuGradebookStaff = window.KiuGradebookStaff || {};
const __kiuGbStaffApi = window.KiuGradebookStaff;
window.__kiuGbStaffApi = __kiuGbStaffApi;
function __kiuGbStaffExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuGbStaffApi[key] = map[key];
        window[key] = map[key];
    });
}

/* Gradebook staff runtimes: faculty standalone page + LMS embedded gradebook + window exports.
   Depends on gradebook-model.js + gradebook-workspace.js. */
function isFacultyStandaloneGradebookContext() {
    return Boolean(
        document.body?.classList?.contains('lux-route-faculty-gradebook')
        && document.getElementById('gradebook-faculty-staff-workspace')
    );
}

function isLmsEmbeddedGradebookContext() {
    return Boolean(
        document.body?.classList?.contains('lux-route-lms')
        && document.getElementById('lms-gradebook-wrapper')
        && !document.getElementById('lms-gradebook-wrapper')?.hidden
    );
}

function isStaffModernGradebookContext() {
    return isLmsEmbeddedGradebookContext() || isFacultyStandaloneGradebookContext();
}

function getStaffModernGradebookRoot() {
    return document.getElementById('gradebook-staff-lms-workspace')
        || document.getElementById('gradebook-faculty-staff-workspace');
}

function readFacultyGradebookFiltersFromDom() {
    return {
        semester: String(document.getElementById('fs-filter-sem')?.value || 'all').trim() || 'all',
        faculty: String(document.getElementById('fs-filter-fac')?.value || getCurrentFaculty() || '').trim(),
        subjectId: String(document.getElementById('fs-filter-subject')?.value || 'all').trim() || 'all',
        groupId: String(document.getElementById('fs-filter-group')?.value || 'all').trim() || 'all'
    };
}

function isFacultyGradebookSubjectSelected() {
    return facultyGradebookFilterState?.subjectId && facultyGradebookFilterState.subjectId !== 'all';
}

function mergeFacultyGradebookStudentRecords(primary, secondary) {
    const primaryRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(primary || {}));
    const secondaryRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(secondary || {}));
    return syncGradeRecordSummaries(ensureGradeRecordHistories({
        ...secondaryRecord,
        ...primaryRecord,
        id: primaryRecord.id || secondaryRecord.id,
        name: primaryRecord.name || secondaryRecord.name,
        assessments: {
            ...(secondaryRecord.assessments || {}),
            ...(primaryRecord.assessments || {})
        },
        _gradebookEnrollments: [
            ...(primaryRecord._gradebookEnrollments || []),
            ...(secondaryRecord._gradebookEnrollments || [])
        ]
    }));
}

function getFacultyGradebookFilteredGroups(filters = facultyGradebookFilterState) {
    const baseGroups = typeof getGradebookGroupsForCurrentUser === 'function'
        ? getGradebookGroupsForCurrentUser(filters)
        : [];
    return (baseGroups || []).filter(group => {
        if (filters?.subjectId && filters.subjectId !== 'all' && group.courseId !== filters.subjectId) return false;
        if (filters?.groupId && filters.groupId !== 'all' && group.groupId !== filters.groupId) return false;
        return true;
    });
}

function buildFacultyGradebookAggregateRoster(filterOverrides = {}) {
    const filters = { ...readFacultyGradebookFiltersFromDom(), ...filterOverrides };
    facultyGradebookFilterState = filters;
    const groups = getFacultyGradebookFilteredGroups(filters);
    facultyGradebookScopedGroups = groups;
    facultyGradebookEnrollmentByStudentId = new Map();
    const studentMap = new Map();

    groups.forEach(group => {
        if (typeof buildGradebookStudents !== 'function') return;
        const gradebookState = buildGradebookStudents(group.courseId, group.groupId);
        const rosterKey = String(gradebookState?.rosterKey || '').trim();
        (gradebookState?.students || []).forEach(student => {
            const studentId = String(student?.id || '').trim();
            if (!studentId) return;
            const enrollment = {
                courseId: group.courseId,
                groupId: group.groupId,
                groupName: group.groupName,
                subjectName: group.subjectName,
                rosterKey
            };
            if (!facultyGradebookEnrollmentByStudentId.has(studentId)) {
                facultyGradebookEnrollmentByStudentId.set(studentId, []);
            }
            facultyGradebookEnrollmentByStudentId.get(studentId).push(enrollment);
            if (!studentMap.has(studentId)) {
                studentMap.set(studentId, ensureGradeRecordHistories({
                    ...student,
                    _gradebookEnrollments: [enrollment]
                }));
            } else {
                const existing = studentMap.get(studentId);
                const merged = mergeFacultyGradebookStudentRecords(existing, student);
                merged._gradebookEnrollments = [
                    ...(existing._gradebookEnrollments || []),
                    enrollment
                ];
                studentMap.set(studentId, merged);
            }
        });
    });

    const mergedStudents = [...studentMap.values()].map(student => ensureGradeRecordHistories(student));
    if (groups.length === 1) {
        const onlyGroup = groups[0];
        currentGradebookSection = { courseId: onlyGroup.courseId, groupId: onlyGroup.groupId };
        currentRosterId = buildGradebookStudents(onlyGroup.courseId, onlyGroup.groupId).rosterKey;
    } else if (filters.subjectId !== 'all' && groups.length) {
        const firstGroup = groups[0];
        currentGradebookSection = {
            courseId: filters.subjectId,
            groupId: filters.groupId !== 'all' ? filters.groupId : firstGroup.groupId
        };
        currentRosterId = buildGradebookStudents(firstGroup.courseId, firstGroup.groupId).rosterKey;
    } else {
        currentGradebookSection = null;
        currentRosterId = groups.length
            ? buildGradebookStudents(groups[0].courseId, groups[0].groupId).rosterKey
            : 'default-roster';
    }

    return {
        students: mergedStudents,
        groups,
        filters
    };
}

function loadFacultyGradebookAggregateRoster(filterOverrides = {}) {
    const aggregate = buildFacultyGradebookAggregateRoster(filterOverrides);
    mockStudents = (aggregate.students || []).map(student => ensureGradeRecordHistories(student));
    syncFacultyCommandDeck();
    return aggregate;
}

function resolveFacultyGradebookRosterKeysForStudent(studentId) {
    const enrollments = facultyGradebookEnrollmentByStudentId.get(String(studentId || '').trim()) || [];
    return [...new Set(enrollments.map(entry => String(entry?.rosterKey || '').trim()).filter(Boolean))];
}

function getFacultyEnrollmentMetaLine(student) {
    const studentId = String(student?.id || '').trim();
    const enrollments = student?._gradebookEnrollments
        || facultyGradebookEnrollmentByStudentId.get(studentId)
        || [];
    if (!enrollments.length) return '';
    return enrollments.map(entry => `${entry.subjectName || entry.courseId} · ${entry.groupName || entry.groupId}`).join(' · ');
}

function shouldShowFacultyEnrollmentMeta(student) {
    if (!isFacultyStandaloneGradebookContext()) return false;
    const enrollments = student?._gradebookEnrollments
        || facultyGradebookEnrollmentByStudentId.get(String(student?.id || '').trim())
        || [];
    return enrollments.length > 1 || facultyGradebookFilterState?.groupId === 'all';
}

function getFacultyGradebookHeroTitle() {
    const filters = facultyGradebookFilterState || readFacultyGradebookFiltersFromDom();
    const count = (mockStudents || []).length;
    const groupCount = facultyGradebookScopedGroups?.length || 0;
    if (filters.subjectId !== 'all' && filters.groupId !== 'all') {
        const scoped = facultyGradebookScopedGroups[0];
        return `${scoped?.subjectName || filters.subjectId} · ${scoped?.groupName || filters.groupId}`;
    }
    if (filters.subjectId !== 'all') {
        const subjectName = facultyGradebookScopedGroups[0]?.subjectName || filters.subjectId;
        return `${subjectName} · all groups · ${count} students`;
    }
    return `All teaching groups · ${count} students · ${groupCount} sections`;
}

function getStaffModernGradebookTitle() {
    if (isFacultyStandaloneGradebookContext()) {
        return getFacultyGradebookHeroTitle();
    }
    return getLmsEmbeddedGradebookTitle();
}

function populateFacultyGradebookGroupFilter() {
    const groupSelect = document.getElementById('fs-filter-group');
    if (!groupSelect) return;
    const filters = readFacultyGradebookFiltersFromDom();
    const semesterFacultyGroups = typeof getGradebookGroupsForCurrentUser === 'function'
        ? getGradebookGroupsForCurrentUser({ ...filters, subjectId: 'all', groupId: 'all' })
        : [];
    const subjectGroups = filters.subjectId === 'all'
        ? semesterFacultyGroups
        : semesterFacultyGroups.filter(group => group.courseId === filters.subjectId);
    const previous = String(groupSelect.value || 'all');
    const options = [
        '<option value="all">All groups</option>',
        ...subjectGroups.map(group => `<option value="${escapeHtml(String(group.groupId))}">${escapeHtml(`${group.subjectName} · ${group.groupName}`)}</option>`)
    ];
    groupSelect.innerHTML = options.join('');
    if ([...groupSelect.options].some(option => option.value === previous)) {
        groupSelect.value = previous;
    } else {
        groupSelect.value = 'all';
    }
}

function populateFacultyGradebookFilters() {
    const subjectSelect = document.getElementById('fs-filter-subject');
    if (!subjectSelect) return;
    const filters = readFacultyGradebookFiltersFromDom();
    const assignedGroups = typeof getGradebookGroupsForCurrentUser === 'function'
        ? getGradebookGroupsForCurrentUser({ ...filters, subjectId: 'all', groupId: 'all' })
        : [];
    const subjects = new Map();
    assignedGroups.forEach(group => {
        if (!subjects.has(group.courseId)) {
            subjects.set(group.courseId, group.subjectName || group.courseId);
        }
    });
    const previousSubject = String(subjectSelect.value || 'all');
    subjectSelect.innerHTML = [
        '<option value="all">All subjects</option>',
        ...[...subjects.entries()].map(([courseId, name]) => `<option value="${escapeHtml(courseId)}">${escapeHtml(name)}</option>`)
    ].join('');
    if ([...subjectSelect.options].some(option => option.value === previousSubject)) {
        subjectSelect.value = previousSubject;
    } else {
        subjectSelect.value = 'all';
    }
    populateFacultyGradebookGroupFilter();
}

function syncFacultyCommandDeck() {
    if (!isFacultyStandaloneGradebookContext()) return;
    const filters = facultyGradebookFilterState || readFacultyGradebookFiltersFromDom();
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const analytics = getGradebookStaffAnalytics(mockStudents, scheme, criterionMeta, assessmentNumber);
    const groupCount = facultyGradebookScopedGroups?.length || 0;
    const canFinalize = getEffectiveUserRole() === USER_ROLES.PROFESSOR || getEffectiveUserRole() === USER_ROLES.ADMIN;
    const subjectSelected = isFacultyGradebookSubjectSelected();

    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };

    const overviewRosters = document.getElementById('faculty-overview-rosters');
    if (overviewRosters) {
        overviewRosters.innerHTML = `<i class="fas fa-book"></i> ${groupCount} section${groupCount === 1 ? '' : 's'}`;
    }
    const overviewStudents = document.getElementById('faculty-overview-students');
    if (overviewStudents) {
        overviewStudents.innerHTML = `<i class="fas fa-users"></i> ${analytics.total} student${analytics.total === 1 ? '' : 's'}`;
    }
    const assessmentPill = document.getElementById('faculty-fg-assessment-pill');
    if (assessmentPill) {
        assessmentPill.innerHTML = `<i class="fas fa-clipboard-list"></i> ${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}`;
    }

    setText('faculty-ops-students', String(analytics.total));
    setText('faculty-ops-average', `${analytics.average}%`);
    setText('faculty-ops-pending', String(analytics.pendingCount));
    setText('faculty-ops-risk', String(analytics.riskCount));
    setText('faculty-ops-range', `${analytics.highest} / ${analytics.lowest}`);

    const scopeNote = filters.groupId === 'all'
        ? `${groupCount} section${groupCount === 1 ? '' : 's'} · all groups`
        : `${groupCount} section${groupCount === 1 ? '' : 's'} · group ${filters.groupId}`;
    setText('faculty-ops-students-note', scopeNote);
    setText('faculty-ops-pending-note', analytics.pendingCount
        ? `${analytics.pendingCount} need manual grading`
        : 'No pending reviews');
    setText('faculty-ops-risk-note', analytics.riskCount
        ? `${analytics.riskCount} below 51% overall`
        : 'No urgent fail risk');
    setText('faculty-fg-ops-note', `Select a student below · ${criterionMeta.label} ${assessmentNumber} · ${analytics.pendingCount} pending`);

    const schemeButton = document.getElementById('faculty-fg-scheme-btn');
    if (schemeButton) {
        schemeButton.disabled = !subjectSelected;
        schemeButton.classList.toggle('is-disabled', !subjectSelected);
        schemeButton.title = subjectSelected
            ? 'Configure max points for the selected subject'
            : 'Select a subject filter to configure weights';
    }
    document.querySelectorAll('#faculty-fg-actions [data-gradebook-click="publish"], #faculty-fg-actions [data-gradebook-click="finalize"]').forEach((button) => {
        button.disabled = !canFinalize;
    });
}

function initFacultyGradebookPage() {
    if (!isFacultyStandaloneGradebookContext()) return;
    restoreGradebookStaffReturnContextIfNeeded();
    populateFacultyGradebookFilters();
    loadFacultyGradebookAggregateRoster();
    initStaffModernGradebook();
}

function getLmsEmbeddedGradebookTitle() {
    const titleNode = document.getElementById('dynamic-gb-title');
    const title = String(titleNode?.innerText || titleNode?.textContent || '').trim();
    return title || 'Class gradebook';
}

function getLmsSubjectGroupsForBulkWeights(courseId = currentGradebookSection?.courseId) {
    const resolvedCourseId = String(courseId || currentGradebookSection?.courseId || '').trim();
    const groups = resolvedCourseId ? (KIU_STATE.availableGroups?.[resolvedCourseId] || []) : [];
    if (groups.length) {
        return groups.map(group => ({
            courseId: resolvedCourseId,
            groupId: String(group?.id || '').trim(),
            name: String(group?.name || group?.id || 'Group').trim(),
            schedule: [group?.day, group?.time].filter(Boolean).join(' ').trim(),
            rosterKey: resolveGradebookRosterKeyForGroup(resolvedCourseId, group?.id)
        })).filter(item => item.groupId);
    }
    const fallbackGroupId = String(currentGradebookSection?.groupId || '').trim();
    if (fallbackGroupId) {
        return [{
            courseId: resolvedCourseId,
            groupId: fallbackGroupId,
            name: fallbackGroupId,
            schedule: '',
            rosterKey: currentRosterId
        }];
    }
    return [{
        courseId: resolvedCourseId,
        groupId: '',
        name: 'Current group',
        schedule: '',
        rosterKey: currentRosterId
    }];
}

function resolveGradebookRosterKeyForGroup(courseId, groupId) {
    const resolvedCourseId = String(courseId || '').trim();
    const resolvedGroupId = String(groupId || '').trim();
    if (resolvedCourseId && resolvedGroupId && typeof buildGradebookStudents === 'function') {
        try {
            return String(buildGradebookStudents(resolvedCourseId, resolvedGroupId)?.rosterKey || '').trim()
                || currentRosterId;
        } catch (error) {
            console.warn('Could not resolve gradebook roster key for group.', error);
        }
    }
    return resolvedGroupId || currentRosterId;
}

function readGradebookWeightProfileFromDom(root = document) {
    return migrateSchemeToWeightProfile(readGradebookGradingSchemeFromDom(root));
}

function readLmsSubjectWeightProfileFromModal() {
    const modal = document.getElementById('lms-subject-weights-modal');
    return readGradebookGradingSchemeFromDom(modal || document);
}

function closeLmsSubjectWeightsModal() {
    const overlay = document.getElementById('lms-subject-weights-modal');
    if (typeof window.closeLuxGlassDialogOverlay === 'function') {
        window.closeLuxGlassDialogOverlay(overlay);
    } else {
        overlay?.remove();
    }
}

function applyLmsSubjectWeightsToSelectedGroups() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only staff can update subject weights.');
        return;
    }
    const courseId = resolveGradebookCourseIdForWeights();
    if (!courseId) {
        alert('Open a subject group before setting subject weights.');
        return;
    }
    const modal = document.getElementById('lms-subject-weights-modal');
    const shell = modal?.querySelector('[data-gb-scheme-shell]');
    const saved = saveGradebookGradingSchemeFromShell(shell, courseId, { refreshGradebook: false });
    if (!saved) return;
    const groupCount = getLmsSubjectGroupsForBulkWeights(courseId).length;
    closeLmsSubjectWeightsModal();
    if (isStaffModernGradebookContext()) {
        initStaffModernGradebook();
    } else if (document.getElementById('gradebook-body')) {
        initGradebook();
    }
    alert(`Grading scheme saved for this subject (${saved.courseTotal} points, ${groupCount} group${groupCount === 1 ? '' : 's'}).`);
}

function openLmsSubjectWeightsModal() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only staff can configure subject weights.');
        return;
    }
    closeLmsSubjectWeightsModal();
    const courseId = resolveGradebookCourseIdForWeights();
    const groups = getLmsSubjectGroupsForBulkWeights(courseId);
    const currentScheme = getGradebookSubjectGradingScheme(courseId)
        || getGradebookSchemeForRoster(currentRosterId, courseId);
    const subject = courseId
        ? (getDomain()?.subjectsById?.[courseId] || (KIU_STATE.curriculum || []).find(item => item.id === courseId))
        : null;
    const groupListMarkup = groups.length
        ? `<ul class="gb-lms-subject-weights-group-list">${groups.map(group => `
            <li>
                <strong class="lms-route-card-title">${escapeHtml(group.name)}</strong>
                ${group.schedule ? `<span class="lms-route-copy lms-route-meta-12">${escapeHtml(group.schedule)}</span>` : ''}
            </li>
        `).join('')}</ul>`
        : '<p class="lms-route-copy gb-lms-subject-weights-empty">No groups are registered for this subject yet.</p>';
    const overlay = document.createElement('div');
    overlay.id = 'lms-subject-weights-modal';
    overlay.className = 'gb-score-edit-overlay gb-lms-subject-weights-overlay lms-glass-dialog-overlay';
    overlay.onclick = event => {
        if (event.target === overlay) closeLmsSubjectWeightsModal();
    };
    overlay.innerHTML = renderLmsGlassDialogCard({
        hookClass: 'gb-score-edit-card gb-lms-subject-weights-card',
        title: subject?.name || courseId || 'Subject grading scheme',
        icon: 'fa-scale-balanced',
        subtitle: 'Set max points per assessment type. The course total applies to every group in this subject automatically.',
        closeAttr: 'data-gradebook-click="close-subject-weights"',
        bodyHtml: `
            <div class="gb-lms-subject-weights-groups gb-lms-subject-weights-groups--readonly lms-route-panel lms-route-panel-compact">
                <div class="lms-route-field-label gb-modern-kicker">Applies to all groups (${groups.length})</div>
                ${groupListMarkup}
            </div>
            ${getGradebookGradingSchemeControlsMarkup(currentScheme, false, {
                idPrefix: 'lms-subject-',
                totalId: 'lms-subject-scheme-total-points',
                schemeShellId: 'lms-subject-grading-scheme-shell',
                shellLabel: 'Max points per component',
                subjectId: courseId
            })}`,
        actionsHtml: `<button type="button" class="lux-secondary-btn lux-glass-dialog-cancel-btn" data-gradebook-click="close-subject-weights">Close</button>`
    });
    document.body.appendChild(overlay);
    if (typeof window.openLuxGlassDialogOverlay === 'function') {
        window.openLuxGlassDialogOverlay(overlay);
    } else {
        overlay.classList.add('is-open');
    }
}

function resolveLmsEmbeddedStaffSelectedStudentId(students = [], criterionMeta, assessmentNumber) {
    const rosterIds = (students || []).map(student => String(student?.id || '')).filter(Boolean);
    const currentSelection = String(lmsEmbeddedGradebookSelectedStudentId || '').trim();
    if (currentSelection && rosterIds.includes(currentSelection)) {
        return currentSelection;
    }
    const pendingStudent = (students || []).find(student => isAssessmentEntryPendingReview(
        ensureGradeRecordHistories(student),
        criterionMeta.key,
        assessmentNumber
    ));
    if (pendingStudent?.id) {
        return String(pendingStudent.id);
    }
    return rosterIds[0] || '';
}

function renderLmsEmbeddedStaffGradeHero(weights, criterionMeta, assessmentNumber, selectedQuizDisplay = null) {
    if (isFacultyStandaloneGradebookContext()) return '';
    const analytics = getGradebookStaffAnalytics(mockStudents, weights, criterionMeta, assessmentNumber);
    const canFinalize = getEffectiveUserRole() === USER_ROLES.PROFESSOR || getEffectiveUserRole() === USER_ROLES.ADMIN;
    const title = getStaffModernGradebookTitle();
    const kicker = isFacultyStandaloneGradebookContext() ? 'Teaching gradebook' : 'Class gradebook';
    const schemeDisabled = isFacultyStandaloneGradebookContext() && !isFacultyGradebookSubjectSelected();
    const schemeButton = schemeDisabled
        ? `<button type="button" class="lux-secondary-btn is-disabled" disabled title="Select a subject filter to configure weights"><i class="fas fa-table-list"></i> Grading scheme</button>`
        : `<button type="button" class="lux-secondary-btn" data-gradebook-click="open-subject-weights"><i class="fas fa-table-list"></i> Grading scheme</button>`;
    return `
        <div class="gb-lms-staff-hero lms-route-panel lms-route-panel-pad-16-20">
            <div class="gb-lms-staff-hero-main">
                <div>
                    <div class="lms-route-field-label gb-modern-kicker">${escapeHtml(kicker)}</div>
                    <h2 class="lms-route-title lms-route-title-26">${escapeHtml(title)}</h2>
                    <p class="lms-route-copy">Reviewing ${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))} · use Set score or Edit score to record grades; score history is read-only below.</p>
            </div>
                <div class="gb-staff-actions gb-lms-staff-hero-actions">
                    ${schemeButton}
                    <button type="button" class="lux-secondary-btn" data-gradebook-click="pending-queue"><i class="fas fa-list-check"></i> Review pending</button>
                    <button type="button" class="lux-secondary-btn" data-gradebook-click="export-csv"><i class="fas fa-file-export"></i> Export</button>
                    <button type="button" class="lux-secondary-btn" ${canFinalize ? '' : 'disabled'} data-gradebook-click="publish"><i class="fas fa-bullhorn"></i> Publish</button>
                    <button type="button" class="lux-secondary-btn" ${canFinalize ? '' : 'disabled'} data-gradebook-click="finalize"><i class="fas fa-lock"></i> Finalize</button>
                </div>
            </div>
            <div class="gb-staff-stat-grid lux-strip-grid lux-strip-grid--adaptive gb-lms-staff-stat-grid">
                <div class="lux-strip-card surface-card"><span>Students</span><strong>${analytics.total}</strong></div>
                <div class="lux-strip-card surface-card"><span>Class average</span><strong>${analytics.average}</strong></div>
                <div class="lux-strip-card surface-card"><span>Pending review</span><strong>${analytics.pendingCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>Fail risk</span><strong>${analytics.riskCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>High / low</span><strong>${analytics.highest} / ${analytics.lowest}</strong></div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="lms-route-panel lms-route-panel-compact gb-staff-linked-quiz gb-lms-staff-linked-quiz">
                    <div>
                        <div class="lms-route-field-label gb-modern-kicker">Linked LMS assessment</div>
                        <strong class="lms-route-card-title">${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<span class="lms-route-copy lms-route-meta-12">${escapeHtml(selectedQuizDisplay.subtitle)}</span>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function renderFacultyCompactAssessmentBar(criterionMeta, assessmentNumber) {
    return `
        <label class="lux-fg-assessment-field lms-route-field-label">Assessment criterion
            <select id="gradebook-criterion-select" class="lux-control" data-gradebook-assessment-target="criterion">
                ${Object.values(GRADEBOOK_CRITERIA).map(meta => `<option value="${meta.key}" ${meta.key === criterionMeta.key ? 'selected' : ''}>${meta.label}</option>`).join('')}
            </select>
        </label>
        <label class="lux-fg-assessment-field lms-route-field-label">Assessment number
            <input id="gradebook-assessment-number" class="lux-control" type="number" min="1" value="${assessmentNumber}" data-gradebook-assessment-target="number">
        </label>
    `;
}

function renderLmsEmbeddedStaffAssessmentBar(criterionMeta, assessmentNumber, pendingReviewCount, selectedQuizDisplay = null) {
    if (isFacultyStandaloneGradebookContext()) return '';
    const schemeCopy = 'Choose the assessment being reviewed. Use <strong>Grading scheme</strong> to set max points for all groups in this subject.';
    return `
        <div class="lms-route-panel lms-route-panel-compact gb-lms-staff-assessment-bar">
            <div class="gb-staff-control-grid">
                <label class="lms-route-field-label">Assessment criterion
                    <select id="gradebook-criterion-select" class="lux-control" data-gradebook-assessment-target="criterion">
                        ${Object.values(GRADEBOOK_CRITERIA).map(meta => `<option value="${meta.key}" ${meta.key === criterionMeta.key ? 'selected' : ''}>${meta.label}</option>`).join('')}
                    </select>
                </label>
                <label class="lms-route-field-label">Assessment number
                    <input id="gradebook-assessment-number" class="lux-control" type="number" min="1" value="${assessmentNumber}" data-gradebook-assessment-target="number">
                </label>
                <div class="gb-staff-control-copy lms-route-copy">
                    ${schemeCopy}
                </div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="lms-route-card lms-route-panel-compact home-hover-chip gb-staff-linked-small is-${pendingReviewCount ? 'pending' : 'ready'}">
                    <div class="lms-route-field-label gb-modern-kicker">Selected LMS quiz</div>
                    <strong class="lms-route-card-title">${escapeHtml(selectedQuizDisplay.title)}</strong>
                    ${selectedQuizDisplay.subtitle ? `<div class="gb-staff-linked-subtitle lms-route-copy lms-route-meta-12">${escapeHtml(selectedQuizDisplay.subtitle)}</div>` : ''}
                    ${pendingReviewCount
                        ? `<span class="gb-status-badge lux-status-pill home-hover-chip is-pending"><i class="fas fa-triangle-exclamation"></i> ${pendingReviewCount} need manual evaluation</span>`
                        : `<span class="gb-status-badge lux-status-pill home-hover-chip is-graded"><i class="fas fa-circle-check"></i> No pending manual evaluation</span>`}
                </div>
            ` : ''}
        </div>
    `;
}

function buildStaffModernGradebookRenderContext() {
    mockStudents = Array.isArray(mockStudents)
        ? mockStudents.map(student => ensureGradeRecordHistories(student))
        : [];
    const currentScheme = getGradebookSchemeForRoster(currentRosterId);
    const currentCriterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const pendingReviewStudents = mockStudents.filter(student => isAssessmentEntryPendingReview(student, currentCriterionMeta.key, assessmentNumber));
    const sampleLinkedEntry = mockStudents
        .map(student => getDisplayAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber) || getAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber))
        .find(entry => resolveLmsQuizSourceFromAssessmentEntry(entry));
    const selectedQuizDisplay = sampleLinkedEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, sampleLinkedEntry) : null;
    const selectedStudentId = resolveLmsEmbeddedStaffSelectedStudentId(mockStudents, currentCriterionMeta, assessmentNumber);
    lmsEmbeddedGradebookSelectedStudentId = selectedStudentId;
    return {
        currentScheme,
        currentCriterionMeta,
        assessmentNumber,
        pendingReviewCount: pendingReviewStudents.length,
        selectedQuizDisplay,
        selectedStudentId
    };
}

function renderFacultyRosterListItems(students, weights, criterionMeta, assessmentNumber, selectedStudentId) {
    const filterText = String(lmsEmbeddedGradebookRosterFilter || '').trim().toLowerCase();
    const roster = (students || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student)));
    const filtered = roster.filter(student => {
        if (!filterText) return true;
        const haystack = `${student.id || ''} ${student.name || ''}`.toLowerCase();
        return haystack.includes(filterText);
    });
    const listMarkup = filtered.length
        ? filtered.map(student => {
            const studentId = String(student.id || '');
            const outcome = getGradebookVisibleOutcome(student, weights);
            const pending = isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber);
            const isActive = studentId === String(selectedStudentId || '');
            const activeEntry = getDisplayAssessmentEntryForNumber(student, criterionMeta.key, assessmentNumber)
                || getAssessmentEntryForNumber(student, criterionMeta.key, assessmentNumber);
            const activePending = activeEntry
                ? isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber)
                : false;
            const activeScore = activeEntry && !activePending && activeEntry.score !== null && activeEntry.score !== undefined && activeEntry.score !== ''
                ? String(activeEntry.score)
                : (activePending ? 'Pending' : '—');
            const enrollmentMeta = shouldShowFacultyEnrollmentMeta(student)
                ? getFacultyEnrollmentMetaLine(student)
                : '';
            const rowTitle = enrollmentMeta
                ? `${student.name || studentId} · ${enrollmentMeta}`
                : String(student.name || studentId);
            const pendingBadge = pending ? '<span class="gb-status-badge lux-status-pill home-hover-chip is-pending">Pending</span>' : '';
            return `
                <button type="button" class="gb-lms-staff-roster-row gb-lms-staff-roster-row--compact${isActive ? ' is-active' : ''}" data-lux-visual-skip="1" data-gradebook-click="lms-gb-select-student" data-gradebook-student-id="${escapeHtml(studentId)}" title="${escapeHtml(rowTitle)}">
                    <div class="gb-lms-staff-roster-main">
                        <strong>${escapeHtml(student.name || studentId)}</strong>
                        <span class="gb-lms-staff-roster-id">${escapeHtml(studentId)}</span>
                    </div>
                    <div class="gb-lms-staff-roster-side gb-lms-staff-roster-side-inline">
                        <span class="gb-lms-staff-roster-assessment">${escapeHtml(criterionMeta.label)} ${assessmentNumber}: ${escapeHtml(activeScore)}</span>
                        ${renderGradebookLetterBadge(outcome.letterLabel, outcome.letterLabel)}
                        <span class="gb-lms-staff-roster-score">${escapeHtml(outcome.scoreLabel)}%</span>
                        ${pendingBadge}
                    </div>
                </button>
            `;
        }).join('')
        : `<div class="gb-empty-state lms-route-copy">No students match this filter.</div>`;
    const rosterCountLabel = filterText && filtered.length !== roster.length
        ? `${filtered.length} of ${roster.length} students`
        : `${roster.length} students`;
    return { listMarkup, rosterCountLabel, rosterSize: roster.length };
}

function refreshFacultyStaffWorkspace(mode = 'full') {
    if (!isFacultyStandaloneGradebookContext()) return;
    const staffRoot = getStaffModernGradebookRoot();
    if (!staffRoot) return;

    const ctx = buildStaffModernGradebookRenderContext();

    if (mode === 'student') {
        const selectedRecord = (mockStudents || []).find(student => String(student?.id || '') === String(ctx.selectedStudentId || ''))
            || null;
        const detailRoot = staffRoot.querySelector('.gb-lms-staff-detail');
        if (detailRoot) {
            if (selectedRecord) {
                detailRoot.outerHTML = localizeHtmlMarkup(renderLmsEmbeddedStaffStudentDetail(
                    selectedRecord,
                    ctx.currentScheme,
                    ctx.currentCriterionMeta,
                    ctx.assessmentNumber
                ));
            } else {
                detailRoot.outerHTML = `<div class="gb-lms-staff-detail"><div class="gb-empty-state gb-empty-state--compact lms-route-copy">Select a student from the roster to grade.</div></div>`;
            }
        }
        staffRoot.querySelectorAll('.gb-lms-staff-roster-row').forEach((row) => {
            const rowStudentId = String(row.dataset.gradebookStudentId || '').trim();
            row.classList.toggle('is-active', rowStudentId === String(ctx.selectedStudentId || ''));
        });
        syncGradebookVisualCustomProperties(staffRoot);
        calculateFinalGrades();
        syncFacultyCommandDeck();
        return;
    }

    if (mode === 'roster') {
        const rosterContent = renderFacultyRosterListItems(
            mockStudents,
            ctx.currentScheme,
            ctx.currentCriterionMeta,
            ctx.assessmentNumber,
            ctx.selectedStudentId
        );
        const rosterList = staffRoot.querySelector('.gb-lms-staff-roster-list');
        const rosterHead = staffRoot.querySelector('.gb-lms-staff-roster-head h3');
        if (rosterList) {
            rosterList.innerHTML = localizeHtmlMarkup(rosterContent.listMarkup);
        }
        if (rosterHead) {
            rosterHead.textContent = rosterContent.rosterCountLabel;
        }
        syncGradebookVisualCustomProperties(staffRoot);
        return;
    }

    if (mode === 'full') {
        const assessmentMount = document.getElementById('faculty-assessment-controls-mount');
        if (assessmentMount) {
            assessmentMount.innerHTML = localizeHtmlMarkup(renderFacultyCompactAssessmentBar(ctx.currentCriterionMeta, ctx.assessmentNumber));
        }
    }

    staffRoot.innerHTML = localizeHtmlMarkup(renderLmsEmbeddedStaffGradebook(
        ctx.currentScheme,
        ctx.currentCriterionMeta,
        ctx.assessmentNumber,
        ctx.selectedQuizDisplay,
        ctx.pendingReviewCount,
        ctx.selectedStudentId
    ));
    setGradebookShellVisibility(staffRoot, true);
    syncGradebookVisualCustomProperties(staffRoot);
    calculateFinalGrades();
    syncFacultyCommandDeck();
}

function renderLmsEmbeddedStaffRosterList(students, weights, criterionMeta, assessmentNumber, selectedStudentId) {
    const isFacultyRoster = isFacultyStandaloneGradebookContext();
    if (isFacultyRoster) {
        const rosterContent = renderFacultyRosterListItems(students, weights, criterionMeta, assessmentNumber, selectedStudentId);
        return `
        <aside class="gb-lms-staff-roster gb-lms-staff-roster--faculty lms-route-card lms-route-panel-compact lux-soft-chrome home-hover-chip">
            <div class="gb-lms-staff-roster-head">
                <div>
                    <div class="lms-route-field-label gb-modern-kicker">Roster</div>
                    <h3 class="lms-route-card-title">${rosterContent.rosterCountLabel}</h3>
                </div>
            </div>
            <label class="gb-lms-staff-roster-search">
                <span class="sr-only">Filter students</span>
                <input type="search" class="lux-control" placeholder="Search name or ID" value="${escapeHtml(lmsEmbeddedGradebookRosterFilter)}" data-lms-gb-roster-filter>
            </label>
            <div class="gb-lms-staff-roster-list">${rosterContent.listMarkup}</div>
        </aside>
    `;
    }
    const filterText = String(lmsEmbeddedGradebookRosterFilter || '').trim().toLowerCase();
    const roster = (students || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student)));
    const filtered = roster.filter(student => {
        if (!filterText) return true;
        const haystack = `${student.id || ''} ${student.name || ''}`.toLowerCase();
        return haystack.includes(filterText);
    });
    const listMarkup = filtered.length
        ? filtered.map(student => {
            const studentId = String(student.id || '');
            const outcome = getGradebookVisibleOutcome(student, weights);
            const pending = isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber);
            const isActive = studentId === String(selectedStudentId || '');
            const activeEntry = getDisplayAssessmentEntryForNumber(student, criterionMeta.key, assessmentNumber)
                || getAssessmentEntryForNumber(student, criterionMeta.key, assessmentNumber);
            const activePending = activeEntry
                ? isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber)
                : false;
            const activeScore = activeEntry && !activePending && activeEntry.score !== null && activeEntry.score !== undefined && activeEntry.score !== ''
                ? String(activeEntry.score)
                : (activePending ? 'Pending' : '—');
            const enrollmentMeta = shouldShowFacultyEnrollmentMeta(student)
                ? getFacultyEnrollmentMetaLine(student)
                : '';
            return `
                <button type="button" class="gb-lms-staff-roster-row${isActive ? ' is-active' : ''}" data-gradebook-click="lms-gb-select-student" data-gradebook-student-id="${escapeHtml(studentId)}">
                    <div class="gb-lms-staff-roster-main">
                        <strong>${escapeHtml(student.name || studentId)}</strong>
                        <span class="gb-lms-staff-roster-id">${escapeHtml(studentId)}</span>
                        ${enrollmentMeta ? `<span class="gb-lms-staff-roster-enrollment">${escapeHtml(enrollmentMeta)}</span>` : ''}
                    </div>
                    <div class="gb-lms-staff-roster-foot">
                        <div class="gb-lms-staff-roster-assessment">${escapeHtml(criterionMeta.label)} ${assessmentNumber}: ${escapeHtml(activeScore)}</div>
                        <div class="gb-lms-staff-roster-meta">
                            ${renderGradebookLetterBadge(outcome.letterLabel, outcome.letterLabel)}
                            <span class="gb-lms-staff-roster-score">${escapeHtml(outcome.scoreLabel)}% overall</span>
                            ${pending ? '<span class="gb-status-badge lux-status-pill home-hover-chip is-pending">Pending</span>' : ''}
                        </div>
                    </div>
                </button>
            `;
        }).join('')
        : `<div class="gb-empty-state lms-route-copy">No students match this filter.</div>`;
    const rosterCountLabel = filterText && filtered.length !== roster.length
        ? `${filtered.length} of ${roster.length} students`
        : `${roster.length} students`;
    return `
        <aside class="gb-lms-staff-roster lms-route-card lms-route-panel-compact home-hover-chip">
            <div class="gb-lms-staff-roster-head">
                <div>
                    <div class="lms-route-field-label gb-modern-kicker">Roster</div>
                    <h3 class="lms-route-card-title">${rosterCountLabel}</h3>
                </div>
            </div>
            <label class="gb-lms-staff-roster-search">
                <span class="sr-only">Filter students</span>
                <input type="search" class="lux-control" placeholder="Search name or ID" value="${escapeHtml(lmsEmbeddedGradebookRosterFilter)}" data-lms-gb-roster-filter>
            </label>
            <div class="gb-lms-staff-roster-list">${listMarkup}</div>
        </aside>
    `;
}

function renderLmsEmbeddedStaffGradingBreakdown(summary, criterionMeta) {
    const isFaculty = isFacultyStandaloneGradebookContext();
    const activeCriterionKey = String(criterionMeta?.key || '');
    const sections = summary?.sections || [];
    const recordedCount = sections.filter(section => {
        const status = getGradebookEntryStatus(summary.record, section.meta, section.latestEntry);
        return status.key === 'graded';
    }).length;
    const rows = sections.map(section => {
        const meta = section.meta;
        const status = getGradebookEntryStatus(summary.record, meta, section.latestEntry);
        const scoreLabel = section.latestEntry && status.key === 'graded'
            ? String(section.aggregate)
            : (status.key === 'pending' ? 'Pending' : '—');
        const isActiveRow = isFaculty && String(meta.key) === activeCriterionKey;
        return `
            <tr class="${isActiveRow ? 'is-active-assessment' : ''}">
                <td>${escapeHtml(meta.label)}</td>
                <td><strong>${escapeHtml(scoreLabel)}</strong></td>
                <td><span class="gb-status-badge lux-status-pill home-hover-chip is-${escapeHtml(status.key)}">${escapeHtml(status.label)}</span></td>
            </tr>
        `;
    }).join('');
    if (isFaculty) {
        return `
        <details class="lms-route-card lms-route-panel-compact lux-soft-chrome home-hover-chip gb-lms-staff-breakdown gb-lms-staff-breakdown--faculty" open>
            <summary>
                <div class="gb-lms-staff-breakdown-head">
                    <div>
                        <span class="lms-route-field-label gb-modern-kicker">Course overview</span>
                        <h3 class="lms-route-card-title">Assessment breakdown</h3>
                    </div>
                    <span class="gb-score-history-count">${recordedCount}/${sections.length} recorded</span>
                </div>
            </summary>
            <table class="gb-lms-staff-breakdown-table lux-modern-table">
                <thead><tr><th>Type</th><th>Score</th><th>Status</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3">No assessments yet</td></tr>'}</tbody>
            </table>
        </details>
    `;
    }
    return `
        <details class="gb-lms-staff-breakdown">
            <summary class="lms-route-card-title">Assessment breakdown</summary>
            <table class="gb-lms-staff-breakdown-table lux-modern-table">
                <thead><tr><th>Type</th><th>Score</th><th>Status</th></tr></thead>
                <tbody>${rows || '<tr><td colspan="3">No assessments yet</td></tr>'}</tbody>
            </table>
        </details>
    `;
}

function renderLmsEmbeddedStaffGradingFocus(record, weights, criterionMeta, assessmentNumber) {
    const safeRecord = syncGradeRecordSummaries(ensureGradeRecordHistories(record || {}));
    const summary = getGradebookModernSummary(safeRecord, weights);
    const studentId = String(safeRecord.id || '');
    const studentName = String(safeRecord.name || '');
    const outcome = summary.outcome;
    const entry = getDisplayAssessmentEntryForNumber(safeRecord, criterionMeta.key, assessmentNumber)
        || getAssessmentEntryForNumber(safeRecord, criterionMeta.key, assessmentNumber);
    const entryDisplay = entry ? getAssessmentEntryDisplayContext(criterionMeta.key, entry) : null;
    const pendingReview = isAssessmentEntryPendingReview(safeRecord, criterionMeta.key, assessmentNumber);
    const status = getGradebookEntryStatus(safeRecord, criterionMeta, entry);
    const hasGradedScore = entry && !pendingReview && entry.score !== null && entry.score !== undefined && entry.score !== '';
    const currentPoints = hasGradedScore ? Number(entry.score) : 0;
    const maxScore = Number(criterionMeta.maxScore || 100);
    const linkedQuizSource = entry ? resolveLmsQuizSourceFromAssessmentEntry(entry) : null;
    const scoreEditLabel = hasGradedScore ? 'Edit score' : 'Set score';
    const scoreEditAttr = hasGradedScore ? String(currentPoints) : '';
    const { timeline: scoreTimeline } = getAssessmentScoreHistoryTimeline(safeRecord, criterionMeta.key, assessmentNumber);
    const isFaculty = isFacultyStandaloneGradebookContext();
    const scoreHistoryOpen = isFaculty
        ? scoreTimeline.length > 0
        : scoreTimeline.length > 6;
    const enrollmentMeta = shouldShowFacultyEnrollmentMeta(safeRecord) ? getFacultyEnrollmentMetaLine(safeRecord) : '';
    const scoreDisplay = hasGradedScore
        ? escapeHtml(String(currentPoints))
        : (pendingReview ? 'Pending' : '—');
    const scoreProgressPct = hasGradedScore && maxScore > 0
        ? Math.min(100, Math.round((currentPoints / maxScore) * 100))
        : 0;
    const hintCopy = isFaculty
        ? `${escapeHtml(scoreEditLabel)} opens a save dialog; history below is read-only.`
        : `${escapeHtml(scoreEditLabel)} opens a dialog where you can save the score; history below is read-only.`;
    const historyCopy = isFaculty
        ? `Read-only history — use <strong>${escapeHtml(scoreEditLabel)}</strong> to record changes.`
        : `Informational only — use <strong>${escapeHtml(scoreEditLabel)}</strong> above to record changes.`;

    if (isFaculty) {
        return `
        <div class="gb-lms-staff-focus">
            <div class="gb-lms-staff-student-hero lms-route-card lms-route-panel-compact lux-soft-chrome home-hover-chip">
                <div class="gb-lms-staff-student-hero-top">
                    <div class="gb-lms-staff-focus-identity">
                        <strong class="lms-route-card-title">${escapeHtml(studentName || studentId)}</strong>
                        <span class="lms-route-meta-12">${escapeHtml(studentId)}</span>
                        ${enrollmentMeta ? `<span class="gb-lms-staff-focus-enrollment lms-route-meta-12">Graded in: ${escapeHtml(enrollmentMeta)}</span>` : ''}
                    </div>
                    <div class="gb-lms-staff-focus-summary">
                        ${renderGradebookLetterBadge(outcome.letterLabel, outcome.letterLabel)}
                        <span class="gb-lms-staff-focus-overall">${escapeHtml(outcome.scoreLabel)}%</span>
                        ${pendingReview ? '<span class="gb-status-badge lux-status-pill home-hover-chip is-pending">Active pending</span>' : ''}
                    </div>
                </div>
                <div class="gb-lms-staff-student-hero-actions">
                    <button type="button" class="lux-primary-btn gb-modern-action" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}">
                        <i class="fas fa-list-check"></i> Full grader
                    </button>
                    <button type="button" class="lux-secondary-btn gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}">
                        <i class="fas fa-file-alt"></i> Quiz paper
                    </button>
                    <button type="button" class="lux-secondary-btn gb-modern-action" data-gradebook-click="preview-student" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}">
                        <i class="fas fa-user-graduate"></i> Portal preview
                    </button>
                </div>
            </div>
            <div class="lms-route-card lms-route-panel-compact lux-soft-chrome home-hover-chip gb-lms-staff-active-card${hasGradedScore ? ' has-graded-score' : ''}"${hasGradedScore ? ` style="--gb-score-progress:${scoreProgressPct}"` : ''}>
                <div class="gb-lms-staff-active-head">
                    <div>
                        <div class="lms-route-field-label gb-modern-kicker">Active assessment</div>
                        <h3 class="lms-route-card-title">${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</h3>
                        ${entryDisplay?.title ? `<p class="lms-route-copy">${escapeHtml(entryDisplay.title)}</p>` : ''}
                    </div>
                </div>
                ${renderLmsStaffScoreEditorBlock({
                    studentId,
                    studentName,
                    criterionKey: criterionMeta.key,
                    assessmentNumber,
                    scoreDisplay,
                    maxScore,
                    status,
                    scoreEditLabel,
                    scoreEditAttr,
                    entryNote: entry?.note || ''
                })}
                ${linkedQuizSource ? `<div class="gb-lms-staff-active-linked"><button type="button" class="lux-secondary-btn gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Evaluate quiz' : 'Open paper'}</button></div>` : ''}
                <p class="lms-route-copy gb-lms-staff-add-hint gb-lms-staff-active-footer">${hintCopy}</p>
            </div>
            <div class="gb-lms-staff-insight-panels">
                <details class="lms-route-card lms-route-panel-compact lux-soft-chrome home-hover-chip gb-lms-staff-score-history"${scoreHistoryOpen ? ' open' : ''}>
                    <summary>
                        <div class="gb-lms-staff-score-history-head">
                            <div>
                                <span class="lms-route-field-label gb-modern-kicker">Score history</span>
                                <h3 class="lms-route-card-title">${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</h3>
                            </div>
                            <span class="gb-score-history-count">${scoreTimeline.length} change${scoreTimeline.length === 1 ? '' : 's'}</span>
                        </div>
                    </summary>
                    <p class="lms-route-copy gb-lms-staff-history-copy">${historyCopy}</p>
                    ${renderGradebookScoreHistoryPanel({
                        record: safeRecord,
                        studentId,
                        studentName,
                        criterion: criterionMeta.key,
                        assessmentNumber,
                        compact: true,
                        readOnlyHistory: true,
                        compactEmpty: true
                    })}
                </details>
                ${renderLmsEmbeddedStaffGradingBreakdown(summary, criterionMeta)}
            </div>
        </div>
    `;
    }

    return `
        <div class="gb-lms-staff-focus">
            <div class="gb-lms-staff-focus-header">
                <div class="gb-lms-staff-focus-identity">
                    <strong>${escapeHtml(studentName || studentId)}</strong>
                    <span>${escapeHtml(studentId)}</span>
                    ${enrollmentMeta ? `<span class="gb-lms-staff-focus-enrollment">Graded in: ${escapeHtml(enrollmentMeta)}</span>` : ''}
                </div>
                <div class="gb-lms-staff-focus-summary">
                    ${renderGradebookLetterBadge(outcome.letterLabel, outcome.letterLabel)}
                    <span class="gb-lms-staff-focus-overall">${escapeHtml(outcome.scoreLabel)}%</span>
                    ${pendingReview ? '<span class="gb-status-badge lux-status-pill home-hover-chip is-pending">Active pending</span>' : ''}
                </div>
            </div>
            <div class="gb-lms-staff-detail-actions lms-route-panel lms-route-panel-compact">
                <button type="button" class="lux-primary-btn gb-modern-action" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}">
                    <i class="fas fa-list-check"></i> Full grader
                </button>
                <button type="button" class="lux-secondary-btn gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}">
                    <i class="fas fa-file-alt"></i> Quiz paper
                </button>
                <button type="button" class="lux-secondary-btn gb-modern-action" data-gradebook-click="preview-student" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-student-name="${escapeHtml(studentName)}">
                    <i class="fas fa-user-graduate"></i> Portal preview
                </button>
            </div>
            <div class="lms-route-card lms-route-panel-compact home-hover-chip gb-lms-staff-active-card">
                <div class="gb-lms-staff-active-head">
                    <div>
                        <div class="lms-route-field-label gb-modern-kicker">Active assessment</div>
                        <h3 class="lms-route-card-title">${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</h3>
                        ${entryDisplay?.title ? `<p class="lms-route-copy">${escapeHtml(entryDisplay.title)}</p>` : ''}
                    </div>
                    <span class="gb-status-badge lux-status-pill home-hover-chip is-${escapeHtml(status.key)}"><i class="fas ${escapeHtml(status.icon)}"></i> ${escapeHtml(status.label)}</span>
                </div>
                ${renderLmsStaffScoreEditorBlock({
                    studentId,
                    studentName,
                    criterionKey: criterionMeta.key,
                    assessmentNumber,
                    scoreDisplay,
                    maxScore,
                    status,
                    scoreEditLabel,
                    scoreEditAttr,
                    entryNote: entry?.note || ''
                })}
                ${linkedQuizSource ? `<div class="gb-lms-staff-detail-actions lms-route-panel lms-route-panel-compact"><button type="button" class="lux-secondary-btn gb-modern-action" data-gradebook-click="open-linked-quiz" data-gradebook-student-id="${escapeHtml(studentId)}" data-gradebook-criterion="${escapeHtml(String(criterionMeta.key))}" data-gradebook-number="${escapeHtml(String(assessmentNumber))}"><i class="fas fa-file-alt"></i> ${pendingReview ? 'Evaluate quiz' : 'Open paper'}</button></div>` : ''}
                <p class="lms-route-copy gb-lms-staff-add-hint">${hintCopy}</p>
            </div>
            <details class="lms-route-card lms-route-panel-compact home-hover-chip gb-lms-staff-score-history"${scoreHistoryOpen ? ' open' : ''}>
                <summary>
                    <div class="gb-lms-staff-score-history-head">
                        <div>
                            <span class="lms-route-field-label gb-modern-kicker">Score history</span>
                            <strong class="lms-route-card-title">${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</strong>
                        </div>
                        <span class="gb-score-history-count">${scoreTimeline.length} change${scoreTimeline.length === 1 ? '' : 's'}</span>
                    </div>
                </summary>
                <p class="lms-route-copy gb-lms-staff-history-copy">${historyCopy}</p>
                ${renderGradebookScoreHistoryPanel({
                    record: safeRecord,
                    studentId,
                    studentName,
                    criterion: criterionMeta.key,
                    assessmentNumber,
                    compact: true,
                    readOnlyHistory: true
                })}
            </details>
            ${renderLmsEmbeddedStaffGradingBreakdown(summary, criterionMeta)}
        </div>
    `;
}

function renderLmsEmbeddedStaffStudentDetail(record, weights, criterionMeta, assessmentNumber) {
    return `
        <div class="gb-lms-staff-detail">
            ${renderLmsEmbeddedStaffGradingFocus(record, weights, criterionMeta, assessmentNumber)}
        </div>
    `;
}

function renderLmsEmbeddedStaffGradebook(weights, criterionMeta, assessmentNumber, selectedQuizDisplay, pendingReviewCount, selectedStudentId) {
    const selectedRecord = (mockStudents || []).find(student => String(student?.id || '') === String(selectedStudentId || ''))
        || (mockStudents || [])[0]
        || null;
    const emptyDetailMarkup = isFacultyStandaloneGradebookContext()
        ? `<div class="gb-lms-staff-detail"><div class="gb-empty-state gb-empty-state--compact lms-route-copy">Select a student from the roster to grade.</div></div>`
        : `<div class="gb-lms-staff-detail"><div class="gb-empty-state lms-route-copy">Select a student from the roster to begin grading.</div></div>`;
    if (isFacultyStandaloneGradebookContext()) {
        return `
            <div class="gb-lms-staff-workspace-inner gb-lms-staff-workspace-inner--faculty">
                <div class="gb-lms-staff-layout">
                    ${renderLmsEmbeddedStaffRosterList(mockStudents, weights, criterionMeta, assessmentNumber, selectedStudentId)}
                    ${selectedRecord
                        ? renderLmsEmbeddedStaffStudentDetail(selectedRecord, weights, criterionMeta, assessmentNumber)
                        : emptyDetailMarkup}
                </div>
            </div>
        `;
    }
    return `
        <div class="gb-lms-staff-workspace-inner">
            ${renderLmsEmbeddedStaffGradeHero(weights, criterionMeta, assessmentNumber, selectedQuizDisplay)}
            ${renderLmsEmbeddedStaffAssessmentBar(criterionMeta, assessmentNumber, pendingReviewCount, selectedQuizDisplay)}
            <div class="gb-lms-staff-layout">
                ${renderLmsEmbeddedStaffRosterList(mockStudents, weights, criterionMeta, assessmentNumber, selectedStudentId)}
                ${selectedRecord
                    ? renderLmsEmbeddedStaffStudentDetail(selectedRecord, weights, criterionMeta, assessmentNumber)
                    : emptyDetailMarkup}
            </div>
        </div>
    `;
}

function initStaffModernGradebook() {
    const staffRoot = getStaffModernGradebookRoot();
    if (!staffRoot) return;

    const controlsRoot = document.getElementById('gradebook-assessment-controls');
    const studentViewRoot = document.getElementById('gradebook-student-view');
    const table = document.getElementById('gradebook-table');
    const tbody = document.getElementById('gradebook-body');
    if (controlsRoot) {
        controlsRoot.innerHTML = '';
        setGradebookShellVisibility(controlsRoot, false);
    }
    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        setGradebookShellVisibility(studentViewRoot, false);
    }
    setGradebookShellVisibility(table, false);
    if (tbody) tbody.innerHTML = '';
    const theadRow = document.querySelector('#gradebook-table thead tr');
    if (theadRow) theadRow.innerHTML = '';

    if (isFacultyStandaloneGradebookContext()) {
        refreshFacultyStaffWorkspace('full');
        return;
    }

    const ctx = buildStaffModernGradebookRenderContext();

    staffRoot.innerHTML = localizeHtmlMarkup(renderLmsEmbeddedStaffGradebook(
        ctx.currentScheme,
        ctx.currentCriterionMeta,
        ctx.assessmentNumber,
        ctx.selectedQuizDisplay,
        ctx.pendingReviewCount,
        ctx.selectedStudentId
    ));
    setGradebookShellVisibility(staffRoot, true);
    syncGradebookVisualCustomProperties(staffRoot);
    calculateFinalGrades();
    syncFacultyCommandDeck();
}

function getGradebookStaffAnalytics(students = mockStudents, scheme = getGradebookSchemeForRoster(currentRosterId), criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion), assessmentNumber = currentGradebookAssessmentNumber) {
    const roster = (students || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student)));
    const outcomes = roster.map(record => ({
        record,
        outcome: getGradebookVisibleOutcome(record, scheme),
        pending: isAssessmentEntryPendingReview(record, criterionMeta.key, assessmentNumber)
    }));
    const numericScores = outcomes.map(item => Number(item.outcome.scoreLabel)).filter(Number.isFinite);
    const average = numericScores.length ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length) : 0;
    return {
        total: roster.length,
        average,
        highest: numericScores.length ? Math.max(...numericScores) : 0,
        lowest: numericScores.length ? Math.min(...numericScores) : 0,
        pendingCount: outcomes.filter(item => item.pending).length,
        riskCount: outcomes.filter(item => Number(item.outcome.scoreLabel) < 51).length,
        gradeDistribution: outcomes.reduce((acc, item) => {
            const key = String(item.outcome.letterStored || item.outcome.letterLabel || 'F').charAt(0).toUpperCase() || 'F';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {})
    };
}

function renderGradebookStaffOverview(weights, criterionMeta, assessmentNumber, selectedQuizDisplay = null) {
    const analytics = getGradebookStaffAnalytics(mockStudents, weights, criterionMeta, assessmentNumber);
    const canFinalize = getEffectiveUserRole() === USER_ROLES.PROFESSOR || getEffectiveUserRole() === USER_ROLES.ADMIN;
    return `
        <div class="gb-staff-workspace">
            <div class="lms-route-panel lms-route-panel-pad-16-20 gb-staff-hero">
                <div>
                    <div class="lms-route-field-label gb-modern-kicker">TA / Professor Gradebook</div>
                    <h2 class="lms-route-title lms-route-title-26">${escapeHtml(criterionMeta.label)} ${escapeHtml(String(assessmentNumber))}</h2>
                    <p class="lms-route-copy">Review pending submissions, edit scores with history, and monitor class performance before publishing grades.</p>
                </div>
                <div class="gb-staff-actions">
                    <button type="button" class="lux-secondary-btn" data-gradebook-click="pending-queue"><i class="fas fa-list-check"></i> Review pending</button>
                    <button type="button" class="lux-secondary-btn" data-gradebook-click="export-csv"><i class="fas fa-file-export"></i> Export</button>
                    <button type="button" class="lux-secondary-btn" ${canFinalize ? '' : 'disabled'} data-gradebook-click="publish"><i class="fas fa-bullhorn"></i> Publish</button>
                    <button type="button" class="lux-secondary-btn" ${canFinalize ? '' : 'disabled'} data-gradebook-click="finalize"><i class="fas fa-lock"></i> Finalize</button>
                </div>
            </div>
            <div class="gb-staff-stat-grid lux-strip-grid lux-strip-grid--adaptive">
                <div class="lux-strip-card surface-card"><span>Students</span><strong>${analytics.total}</strong></div>
                <div class="lux-strip-card surface-card"><span>Class Average</span><strong>${analytics.average}</strong></div>
                <div class="lux-strip-card surface-card"><span>Pending Review</span><strong>${analytics.pendingCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>Fail Risk</span><strong>${analytics.riskCount}</strong></div>
                <div class="lux-strip-card surface-card"><span>High / Low</span><strong>${analytics.highest} / ${analytics.lowest}</strong></div>
            </div>
            ${selectedQuizDisplay ? `
                <div class="lms-route-panel lms-route-panel-compact gb-staff-linked-quiz">
                    <div>
                        <div class="lms-route-field-label gb-modern-kicker">Linked LMS Assessment</div>
                        <strong class="lms-route-card-title">${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<span class="lms-route-copy lms-route-meta-12">${escapeHtml(selectedQuizDisplay.subtitle)}</span>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

function openGradebookPendingQueue() {
    const criterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const pending = (mockStudents || [])
        .map(student => ensureGradeRecordHistories(student))
        .filter(student => isAssessmentEntryPendingReview(student, criterionMeta.key, assessmentNumber));
    if (!pending.length) {
        alert('No pending manual reviews for the selected assessment.');
        return;
    }
    const first = pending[0];
    openStudentEvaluationHistoryModal(first.id, first.name || '', criterionMeta.key);
}

function exportGradebookCsv() {
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const rows = [['Student ID', 'Student Name', 'Score', 'Letter', 'Quiz', 'Oral Quiz', 'Class Assignment', 'Team Project', 'Homework', 'Midterm', 'Final', 'Retake']];
    (mockStudents || []).map(student => syncGradeRecordSummaries(ensureGradeRecordHistories(student))).forEach(record => {
        const outcome = getGradebookVisibleOutcome(record, scheme);
        rows.push([
            record.id || '',
            record.name || '',
            outcome.scoreLabel,
            outcome.letterLabel,
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.quiz),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.oralQuiz),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.classAssignment),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.teamProject),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.homework),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.midterm),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.final),
            getAssessmentDisplayValue(record, GRADEBOOK_CRITERIA.retake)
        ]);
    });
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gradebook-${currentRosterId || 'group'}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function markGradebookSectionPublished() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professor or admin can publish grades.');
        return;
    }
    KIU_STATE.gradebookPublications = KIU_STATE.gradebookPublications || {};
    const key = `${currentRosterId}::${normalizeGradebookCriterion(currentGradebookCriterion)}::${normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1)}`;
    KIU_STATE.gradebookPublications[key] = {
        status: 'published',
        updatedAt: new Date().toISOString(),
        updatedBy: getSimulatedUserName()
    };
    saveState();
    alert('Selected assessment published.');
}

function markGradebookSectionFinalized() {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) {
        alert('Only professor or admin can finalize grades.');
        return;
    }
    KIU_STATE.gradebookPublications = KIU_STATE.gradebookPublications || {};
    const key = `${currentRosterId}::${normalizeGradebookCriterion(currentGradebookCriterion)}::${normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1)}`;
    KIU_STATE.gradebookPublications[key] = {
        status: 'finalized',
        updatedAt: new Date().toISOString(),
        updatedBy: getSimulatedUserName()
    };
    saveState();
    alert('Selected assessment finalized.');
}

__kiuGbStaffExpose({
    openGradebookPendingQueue,
    exportGradebookCsv,
    markGradebookSectionPublished,
    markGradebookSectionFinalized,
});

function initGradebook() {
    mockStudents = Array.isArray(mockStudents)
        ? mockStudents.map(student => ensureGradeRecordHistories(student))
        : [];
    const tbody = document.getElementById('gradebook-body');
    if (!tbody) return;
    const effectiveRole = getEffectiveUserRole();
    const staffWorkspace = document.getElementById('gradebook-staff-lms-workspace');
    const isStaffRole = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole);
    if (isStaffModernGradebookContext() && isStaffRole) {
        initStaffModernGradebook();
        return;
    }
    if (staffWorkspace) {
        staffWorkspace.innerHTML = '';
        setGradebookShellVisibility(staffWorkspace, false);
    }
    const readOnly = ![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(effectiveRole);
    const currentScheme = getGradebookSchemeForRoster(currentRosterId);
    const sheetSchemeSlot = document.getElementById('gradebook-sheet-scheme-controls');
    if (sheetSchemeSlot) {
        sheetSchemeSlot.innerHTML = getGradebookGradingSchemeControlsMarkup(currentScheme, false, {
            idPrefix: 'sheet-',
            totalId: 'gradebook-scheme-total-points',
            shellLabel: 'Subject grading scheme',
            subjectId: resolveGradebookCourseIdForWeights(currentGradebookSection?.courseId)
        });
    }
    const currentCriterionMeta = getGradebookCriterionMeta(currentGradebookCriterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const pendingReviewStudents = mockStudents.filter(student => isAssessmentEntryPendingReview(student, currentCriterionMeta.key, assessmentNumber));
    const sampleLinkedEntry = mockStudents
        .map(student => getDisplayAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber) || getAssessmentEntryForNumber(student, currentCriterionMeta.key, assessmentNumber))
        .find(entry => resolveLmsQuizSourceFromAssessmentEntry(entry));
    const selectedQuizDisplay = sampleLinkedEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, sampleLinkedEntry) : null;
    const theadRow = document.querySelector('#gradebook-table thead tr');
    const controlsRoot = document.getElementById('gradebook-assessment-controls');
    const studentViewRoot = document.getElementById('gradebook-student-view');
    const table = document.getElementById('gradebook-table');

    if (effectiveRole === USER_ROLES.STUDENT) {
        if (staffWorkspace) {
            staffWorkspace.innerHTML = '';
            setGradebookShellVisibility(staffWorkspace, false);
        }
        const currentUserId = String(getCurrentUserId() || '');
        const record = mockStudents.find(student => String(student?.id || '') === currentUserId) || {
            id: currentUserId,
            name: getCurrentUser()?.name || getCurrentUser()?.nameEn || 'Student'
        };
        if (controlsRoot) {
            controlsRoot.innerHTML = `
                <div class="gb-student-context-bar lux-soft-chrome home-hover-chip">
                    <div class="gb-student-context-copy">
                        <div class="lux-section-kicker lms-route-field-label gb-modern-kicker">Official LMS Record</div>
                        <strong class="lux-card-copy gb-student-context-title">Read-only student grade view</strong>
                        <p class="lux-panel-copy gb-student-context-copy-line">Scores are synchronized with quizzes, exams, manual classroom assessments, and the Study Card record.</p>
                    </div>
                    <div class="gb-context-actions">
                        <span class="gb-status-badge lux-status-pill home-hover-chip is-graded"><i class="fas fa-lock"></i> Student view</span>
                        <span class="gb-status-badge lux-status-pill home-hover-chip is-missing"><i class="fas fa-users"></i> Group record</span>
                    </div>
                </div>
            `;
        }
        if (studentViewRoot) {
            setGradebookShellVisibility(studentViewRoot, true, 'block');
            studentViewRoot.innerHTML = localizeHtmlMarkup(renderStudentGradebookWorkspace(record, currentScheme));
            syncGradebookVisualCustomProperties(studentViewRoot);
        }
        setGradebookShellVisibility(table, false);
        if (theadRow) theadRow.innerHTML = '';
        tbody.innerHTML = '';
        return;
    }

    if (studentViewRoot) {
        studentViewRoot.innerHTML = '';
        setGradebookShellVisibility(studentViewRoot, false);
    }
    setGradebookShellVisibility(table, true, 'table');

    if (controlsRoot) {
        controlsRoot.innerHTML = `
            ${renderGradebookStaffOverview(currentScheme, currentCriterionMeta, assessmentNumber, selectedQuizDisplay)}
            <div class="lms-route-panel lms-route-panel-compact gb-staff-control-card">
                <div class="gb-staff-control-grid">
                    <label class="lms-route-field-label">Assessment criterion
                        <select id="gradebook-criterion-select" class="lux-control" data-gradebook-assessment-target="criterion">
                            ${Object.values(GRADEBOOK_CRITERIA).map(meta => `<option value="${meta.key}" ${meta.key === currentCriterionMeta.key ? 'selected' : ''}>${meta.label}</option>`).join('')}
                        </select>
                    </label>
                    <label class="lms-route-field-label">Assessment number
                        <input id="gradebook-assessment-number" class="lux-control" type="number" min="1" value="${assessmentNumber}" data-gradebook-assessment-target="number">
                    </label>
                    <div class="gb-staff-control-copy lms-route-copy">
                        Choose the exact assessment being reviewed. Pending rows identify submitted written answers and exams that need TA/professor action.
                    </div>
                </div>
                <div class="gb-staff-weight-panel">
                    ${getGradebookGradingSchemeControlsMarkup(currentScheme, false, {
                        idPrefix: 'staff-',
                        totalId: 'gradebook-scheme-total-points',
                        shellLabel: 'Grading scheme',
                        subjectId: resolveGradebookCourseIdForWeights(currentGradebookSection?.courseId)
                    })}
                    ${selectedQuizDisplay ? `
                    <div class="lms-route-card lms-route-panel-compact home-hover-chip gb-staff-linked-small is-${pendingReviewStudents.length ? 'pending' : 'ready'}">
                        <div class="lms-route-field-label gb-modern-kicker">Selected LMS Quiz</div>
                        <strong class="lms-route-card-title">${escapeHtml(selectedQuizDisplay.title)}</strong>
                        ${selectedQuizDisplay.subtitle ? `<div class="gb-staff-linked-subtitle lms-route-copy lms-route-meta-12">${escapeHtml(selectedQuizDisplay.subtitle)}</div>` : ''}
                        ${pendingReviewStudents.length
                            ? `<span class="gb-status-badge lux-status-pill home-hover-chip is-pending"><i class="fas fa-triangle-exclamation"></i> ${pendingReviewStudents.length} need manual evaluation</span>`
                            : `<span class="gb-status-badge lux-status-pill home-hover-chip is-graded"><i class="fas fa-circle-check"></i> No pending manual evaluation</span>`}
                    </div>
                ` : ''}
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

    if (!mockStudents.length) {
        tbody.innerHTML = `
            <tr class="gb-roster-empty-row">
                <td colspan="6">
                    <div class="lms-route-empty gb-sheet-empty">
                        <div class="lms-route-empty-title">No student records resolved</div>
                        <div class="lms-route-empty-copy">This roster currently has no resolved grade rows. If the section should contain students, check enrollment sync or return to the roster list and open a different group.</div>
                    </div>
                </td>
            </tr>
        `;
        syncGradebookVisualCustomProperties(tbody);
        calculateFinalGrades();
        return;
    }

    let html = '';
    mockStudents.forEach((st, i) => {
        const record = ensureGradeRecordHistories(st);
        const currentEntry = getDisplayAssessmentEntryForNumber(record, currentCriterionMeta.key, assessmentNumber)
            || getAssessmentEntryForNumber(record, currentCriterionMeta.key, assessmentNumber);
        const pendingReview = isAssessmentEntryPendingReview(record, currentCriterionMeta.key, assessmentNumber);
        const currentLinkedQuizSource = currentEntry ? resolveLmsQuizSourceFromAssessmentEntry(currentEntry) : null;
        const currentSubmission = currentLinkedQuizSource ? getLmsQuizSubmission(currentLinkedQuizSource.resourceKey, currentLinkedQuizSource.quizId, record.id) : null;
        const quizStatusClass = !currentLinkedQuizSource
            ? 'is-empty'
            : pendingReview || currentSubmission?.status === 'submitted' || currentSubmission?.status === 'auto-submitted'
                ? 'is-pending'
                : currentSubmission?.status === 'graded'
                    ? (currentSubmission.requiresManualReview ? 'is-reviewed' : 'is-auto-graded')
                    : currentSubmission?.status === 'in-progress'
                        ? 'is-in-progress'
                        : 'is-published';
        const quizStatusMarkup = !currentLinkedQuizSource
            ? '<span class="gb-quiz-status-pill is-empty">No linked quiz</span>'
            : pendingReview || currentSubmission?.status === 'submitted' || currentSubmission?.status === 'auto-submitted'
                ? '<span class="gb-quiz-status-pill is-pending"><i class="fas fa-triangle-exclamation"></i> Waiting for evaluation</span>'
                : currentSubmission?.status === 'graded'
                    ? `<span class="gb-quiz-status-pill ${currentSubmission.requiresManualReview ? 'is-reviewed' : 'is-auto-graded'}"><i class="fas ${currentSubmission.requiresManualReview ? 'fa-user-check' : 'fa-bolt'}"></i> ${currentSubmission.requiresManualReview ? 'Reviewed' : 'Auto graded'}</span>`
                    : currentSubmission?.status === 'in-progress'
                        ? '<span class="gb-quiz-status-pill is-in-progress"><i class="fas fa-hourglass-start"></i> In progress</span>'
                        : '<span class="gb-quiz-status-pill is-published"><i class="fas fa-circle-dot"></i> Published</span>';
        const currentEntryDisplay = currentEntry ? getAssessmentEntryDisplayContext(currentCriterionMeta.key, currentEntry) : null;
        html += `
            <tr data-idx="${i}">
                <td class="gb-roster-id-cell">${record.id}</td>
                <td class="gb-roster-name-cell">
                    <div class="gb-roster-student-cell">
                        <div>${escapeHtml(record.name)}</div>
                        <div class="gb-roster-student-actions">
                            <button type="button" class="lux-secondary-btn gb-roster-action-btn" data-gradebook-click="open-history" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(record.name || ''))}">
                                <i class="fas fa-clock"></i> View all history
                            </button>
                            <button type="button" class="lux-secondary-btn gb-roster-action-btn" data-gradebook-click="preview-student" data-gradebook-student-id="${escapeHtml(String(record.id))}" data-gradebook-student-name="${escapeHtml(String(record.name || ''))}">
                                <i class="fas fa-user-graduate"></i> Student Portal
                            </button>
                        </div>
                    </div>
                </td>
                <td id="pred-${i}" class="gb-roster-score-cell">-</td>
                <td id="letter-${i}" class="gb-roster-letter-cell">-</td>
                <td class="gb-roster-quiz-status-cell">${quizStatusMarkup}</td>
                <td id="history-${i}" class="gb-roster-history-column">
                    <div class="gb-roster-history-cell">
                        <div>${renderAssessmentHistoryChips(record, currentCriterionMeta.key)}</div>
                        ${renderGradebookScoreHistoryPanel({
                            record,
                            studentId: String(record.id || ''),
                            studentName: String(record.name || ''),
                            criterion: currentCriterionMeta.key,
                            assessmentNumber,
                            compact: true,
                            readOnlyHistory: isStaffModernGradebookContext()
                        })}
                        ${currentEntryDisplay?.linked ? `<div class="lms-route-card lms-route-panel-compact home-hover-chip gb-roster-linked-summary ${quizStatusClass}"><div class="gb-roster-linked-title">${escapeHtml(currentEntryDisplay.title)}</div>${currentEntryDisplay.subtitle ? `<div class="gb-roster-linked-subtitle">${escapeHtml(currentEntryDisplay.subtitle)}</div>` : ''}${pendingReview ? `<div class="gb-roster-linked-note is-pending"><i class="fas fa-triangle-exclamation"></i> Manual answer still waiting</div>` : ''}</div>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = localizeHtmlMarkup(html);
    syncGradebookVisualCustomProperties(tbody);
    calculateFinalGrades();
}

function setGradebookAssessmentTarget(criterion, number) {
    currentGradebookCriterion = normalizeGradebookCriterion(criterion);
    currentGradebookAssessmentNumber = normalizeAssessmentNumber(number, 1);
    if (isFacultyStandaloneGradebookContext()) {
        refreshFacultyStaffWorkspace('workspace');
        return;
    }
    if (isStaffModernGradebookContext()) {
        initStaffModernGradebook();
        return;
    }
    initGradebook();
}

function updateGrade(idx, val) {
    if (![USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole())) return;
    const criterion = normalizeGradebookCriterion(currentGradebookCriterion);
    const criterionMeta = getGradebookCriterionMeta(criterion);
    const assessmentNumber = normalizeAssessmentNumber(currentGradebookAssessmentNumber, 1);
    const existingRecord = ensureGradeRecordHistories(mockStudents[idx]);
    const oldVal = getAssessmentScoreForNumber(existingRecord, criterion, assessmentNumber);
    mockStudents[idx] = setAssessmentScoreOnRecord(existingRecord, criterion, assessmentNumber, val, {
        updatedBy: getSimulatedUserName()
    });

    // Add Audit Log
    const logs = document.getElementById('audit-logs');
    if (logs) {
        if(logs.innerText.includes('No edits')) logs.innerHTML = '';
        const date = new Date();
        const time = date.getHours() + ':' + ('0'+date.getMinutes()).slice(-2);
        logs.innerHTML = `<div class="gb-sheet-audit-entry"><em>${time}</em> - ${escapeHtml(getSimulatedUserName())} updated ID ${mockStudents[idx].id} <strong>${criterionMeta.label} ${assessmentNumber}</strong> from ${oldVal} to ${Number(val || 0)}.</div>` + logs.innerHTML;
    }

    KIU_STATE.studentGrades[currentRosterId] = mockStudents.map(student => ensureGradeRecordHistories(student));
    saveState();
    calculateFinalGrades();
}

function calculateFinalGrades() {
    const scheme = getGradebookSchemeForRoster(currentRosterId);
    const courseTotal = getGradebookSchemeTotalPoints(scheme);
    const totalLabel = `Course total: ${courseTotal} points`;
    const warn = document.getElementById('weight-total-warning');
    if (warn) {
        warn.innerText = totalLabel;
        warn.classList.add('is-balanced');
        warn.classList.remove('is-warning');
    }
    document.querySelectorAll('#gradebook-scheme-total-points, #lms-bulk-scheme-total-points, #lms-subject-scheme-total-points, [data-gb-scheme-total]').forEach(node => {
        node.textContent = totalLabel;
    });

    mockStudents.forEach((st, i) => {
        const predCell = document.getElementById(`pred-${i}`);
        const letterCell = document.getElementById(`letter-${i}`);
        if (!predCell) return;

        // Check for exceptions in any field
        const fields = ['q1', 'qa', 'mid', 'final'];
        let exception = null;
        fields.forEach(f => {
            if (['I', 'M', 'W'].includes(st[f])) exception = st[f];
        });

        if (exception) {
            predCell.innerHTML = `<span class="gb-score-mid">${exception}</span>`;
            const excLabel = exception === "I" ? "Incomplete" : (exception === "M" ? "Medical" : "Withdrawn");
            letterCell.innerHTML = `<span class="gb-letter-badge grade-c">${excLabel.charAt(0)}</span>`;
            predCell.className = 'gb-roster-score-cell';
            return;
        }
        const synced = syncGradeRecordSummaries(st);
        const effectiveExamScore = getGradebookEffectiveExamScore(synced);
        const outcome = getGradebookVisibleOutcome(synced, scheme);
        const safeScore = Math.max(0, Math.min(100, Number(outcome.scoreLabel) || 0));
        const maxPotential = getGradebookSchemeMaxPotentialPercent(synced, scheme);

        const scoreClass = safeScore >= 71 ? 'gb-score-high' : safeScore >= 51 ? 'gb-score-mid' : 'gb-score-low';
        const barClass = safeScore >= 71 ? 'high' : safeScore >= 51 ? 'mid' : 'low';
        predCell.innerHTML = `<div class="${scoreClass}">${safeScore}</div><div class="gb-score-bar"><div class="gb-score-bar-fill ${barClass}" data-gb-score-width="${safeScore}"></div></div>`;
        syncGradebookVisualCustomProperties(predCell);
        
        let letter = 'F';
        let tone = 'danger';
        
        if (maxPotential < 51 && effectiveExamScore === 0) {
            letter = 'F (Predicted)';
            tone = 'danger';
        } else {
            if (safeScore >= 91) { letter = 'A'; tone = 'success'; }
            else if (safeScore >= 81) { letter = 'B'; tone = 'info'; }
            else if (safeScore >= 71) { letter = 'C'; tone = 'warning'; }
            else if (safeScore >= 61) { letter = 'D'; tone = 'warning'; }
            else if (safeScore >= 51) { letter = 'E'; tone = 'warning'; }
            else if (safeScore >= 41) { letter = 'FX'; tone = 'danger'; }
            
            if (effectiveExamScore === 0) {
                tone = 'muted';
            }
        }
        predCell.className = `gb-roster-score-cell is-${tone}`;

        const gradeClass = letter.charAt(0) === 'A' ? 'grade-a' : letter.charAt(0) === 'B' ? 'grade-b' : letter.charAt(0) === 'C' ? 'grade-c' : letter.charAt(0) === 'D' ? 'grade-d' : 'grade-f';
        letterCell.innerHTML = `<span class="gb-letter-badge ${gradeClass}">${letter.length > 2 ? letter : letter}</span>`;
        st.letter = /^[A-Z]/.test(letter) ? letter.charAt(0) : letter;
    });
}

function getGradebookNotificationWeights() {
    return getGradebookSchemeForRoster(currentRosterId);
}

function getGradebookVisibleOutcome(record, scheme = getGradebookSchemeForRoster(currentRosterId)) {
    const fields = ['q1', 'qa', 'mid', 'final'];
    const exception = fields.find(field => ['I', 'M', 'W'].includes(record?.[field])) || '';
    if (exception) {
        return {
            scoreLabel: exception,
            letterLabel: exception === 'I' ? 'Incomplete' : (exception === 'M' ? 'Medical' : 'Withdrawn'),
            letterStored: exception
        };
    }
    const synced = syncGradeRecordSummaries(ensureGradeRecordHistories({ ...(record || {}) }));
    const normalizedScheme = normalizeGradebookGradingScheme(scheme);
    const breakdown = computeGradebookSchemeBreakdown(synced, normalizedScheme);
    const finalScore = getGradebookEffectiveExamScore(synced);
    const safeScore = breakdown.percent;
    const maxPotential = getGradebookSchemeMaxPotentialPercent(synced, normalizedScheme);
    let letterLabel = 'F';
    if (maxPotential < 51 && finalScore === 0) {
        letterLabel = 'F (Predicted)';
    } else if (safeScore >= 91) {
        letterLabel = 'A';
    } else if (safeScore >= 81) {
        letterLabel = 'B';
    } else if (safeScore >= 71) {
        letterLabel = 'C';
    } else if (safeScore >= 61) {
        letterLabel = 'D';
    } else if (safeScore >= 51) {
        letterLabel = 'E';
    } else if (safeScore >= 41) {
        letterLabel = 'FX';
    }
    return {
        scoreLabel: String(safeScore),
        letterLabel,
        letterStored: /^[A-Z]/.test(letterLabel) ? letterLabel.charAt(0) : letterLabel
    };
}

function notifyGradebookStudentsAboutChanges(previousRoster = [], nextRoster = []) {
    const previousById = new Map((previousRoster || []).map(record => [String(record?.id || ''), record]));
    const weights = getGradebookNotificationWeights();
    const actorName = typeof getSimulatedUserName === 'function' ? getSimulatedUserName() : 'Teaching staff';
    nextRoster.forEach(record => {
        const studentId = String(record?.id || '');
        if (!studentId) return;
        const previousRecord = previousById.get(studentId) || null;
        const previousOutcome = previousRecord ? getGradebookVisibleOutcome(previousRecord, weights) : null;
        const nextOutcome = getGradebookVisibleOutcome(record, weights);
        if (previousOutcome && previousOutcome.scoreLabel === nextOutcome.scoreLabel && previousOutcome.letterLabel === nextOutcome.letterLabel) {
            return;
        }
        createPortalSystemNotification({
            userId: studentId,
            source: 'school',
            type: 'grade-evaluated',
            title: 'Grade evaluated',
            text: `${actorName} updated your visible score to ${nextOutcome.scoreLabel} (${nextOutcome.letterLabel}).`,
            routePage: 'lms',
            routeData: { rosterId: currentRosterId || '' },
            duplicateWindowMs: 1000
        });
    });
}

function saveGrades() {
    const previousRoster = Array.isArray(KIU_STATE.studentGrades?.[currentRosterId])
        ? KIU_STATE.studentGrades[currentRosterId].map(student => ensureGradeRecordHistories({ ...(student || {}) }))
        : [];
    const nextRoster = mockStudents.map(student => ensureGradeRecordHistories(student));
    notifyGradebookStudentsAboutChanges(previousRoster, nextRoster);
    KIU_STATE.studentGrades[currentRosterId] = nextRoster;
    saveState();
    const changedCount = nextRoster.filter(record => {
        const previousRecord = previousRoster.find(item => String(item?.id || '') === String(record?.id || ''));
        if (!previousRecord) return true;
        return JSON.stringify(previousRecord) !== JSON.stringify(record);
    }).length;
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('grades', 'saved', 'gradebook', currentRosterId || 'default-roster', {
            afterState: {
                rosterId: currentRosterId || '',
                changedStudents: changedCount,
                totalStudents: nextRoster.length
            }
        });
    }
    if (typeof recordPortalSyncRun === 'function') {
        recordPortalSyncRun('sis', {
            scope: 'grades',
            status: 'queued',
            recordsSeen: nextRoster.length,
            recordsChanged: changedCount,
            notes: `Grade save queued from roster ${currentRosterId || 'default-roster'}.`
        });
    }
    if (document.getElementById('study-card-container')) renderStudyCard();
    alert('Grades saved. Student notifications and audit records were updated.');
}

__kiuGbStaffExpose({
    isLmsEmbeddedGradebookContext,
    isFacultyStandaloneGradebookContext,
    isStaffModernGradebookContext,
    initStaffModernGradebook,
    refreshFacultyStaffWorkspace,
    initFacultyGradebookPage,
    buildFacultyGradebookAggregateRoster,
    loadFacultyGradebookAggregateRoster,
    populateFacultyGradebookFilters,
    renderLmsEmbeddedStaffRosterList,
    renderLmsEmbeddedStaffGradingFocus,
    renderStudentGradebookWorkspace,
    openLmsSubjectWeightsModal,
    closeLmsSubjectWeightsModal,
    applyLmsSubjectWeightsToSelectedGroups,
    getLmsSubjectGroupsForBulkWeights,
    getGradebookVisibleOutcome,
    GRADEBOOK_CRITERIA,
});

