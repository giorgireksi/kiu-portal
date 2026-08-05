/* READABILITY: student registration runtime: course selection and registration actions. Sections: Purpose | Boundaries | Exports.
--- READABILITY: Purpose ---
Owns the route-facing responsibilities named above.
--- READABILITY: Boundaries ---
Delegates peeled domain behavior through explicit runtime APIs.
--- READABILITY: Exports ---
Publishes only the host/runtime contract consumed by its loader.
*/
/* FINDABILITY: student registration hub — see docs/findability-index.md#reg-student */
/* Dedicated student registration logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- STUDENT REGISTRATION LOGIC ---

function syncRegistrationTabHoverChip(tab) {
    if (!tab?.classList) return;
    tab.classList.toggle('home-hover-chip', !tab.classList.contains('active'));
}

function syncAllRegistrationTabHoverChips(root = document.querySelector('#page-registration .reg-tabs')) {
    if (!root) return;
    root.querySelectorAll('.reg-tab').forEach(syncRegistrationTabHoverChip);
}

function switchRegTab(tabId, triggerElement = null) {
    invalidateStudentRegistrationViewCache();
    document.querySelectorAll('.reg-tab').forEach(t => t.classList.remove('active'));

    const faculty = getCurrentFaculty() || 'ECON';
    const structureTab = typeof resolveStudentRegistrationStructureTab === 'function'
        ? resolveStudentRegistrationStructureTab(tabId, faculty)
        : (tabId === 'program' ? 'prog' : (tabId === 'concentration' ? 'conc' : tabId));
    const tabConfig = typeof resolveStudentRegistrationTabConfig === 'function'
        ? resolveStudentRegistrationTabConfig(structureTab, faculty)
        : null;
    const shellTabId = tabConfig?.shellId
        || (structureTab === 'prog' ? 'program' : (structureTab === 'conc' ? 'concentration' : structureTab));
    const clickedTab = (triggerElement && typeof triggerElement.closest === 'function' ? triggerElement.closest('.reg-tab') : null)
        || document.querySelector(`.reg-tab[data-reg-tab="${shellTabId}"]`)
        || document.querySelector(`.reg-tab[data-student-reg-tab="${shellTabId}"]`);
    if (clickedTab) {
        clickedTab.classList.add('active');
        clickedTab.setAttribute('aria-selected', 'true');
    }
    document.querySelectorAll('#page-registration .reg-tabs .reg-tab').forEach((tab) => {
        if (tab !== clickedTab) tab.setAttribute('aria-selected', 'false');
        syncRegistrationTabHoverChip(tab);
    });

    // Hide all legacy hardcoded tabs if they exist
    document.querySelectorAll('[id^=reg-tab-]').forEach(t => {
        if (t) t.hidden = true;
    });
    
    if (window.__studentRegActiveTab === structureTab) {
        if (typeof refreshRegistrationUI === 'function') {
            refreshRegistrationUI();
        }
        return;
    }

    window.__studentRegActiveTab = structureTab;
    renderStudentRegStructures(structureTab);
    if (typeof refreshRegistrationUI === 'function') {
        refreshRegistrationUI();
    }
}

const studentRegistrationUiState = {
    prog: null,
    free: null,
    conc: null,
    minor: null
};

const studentRegistrationRenderState = {
    tabId: '',
    faculty: '',
    safeData: [],
    courseContext: null
};

const studentRegistrationViewCache = {
    prog: null,
    free: null,
    conc: null,
    minor: null,
    history: null,
    selected: null
};

function invalidateStudentRegistrationViewCache() {
    Object.keys(studentRegistrationViewCache).forEach((key) => {
        studentRegistrationViewCache[key] = null;
    });
}
window.invalidateStudentRegistrationViewCache = invalidateStudentRegistrationViewCache;

function countAdminRegistrationModulesForFaculty(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (typeof countRegistrationTrackProgramsForFaculty === 'function') {
        const trackCount = countRegistrationTrackProgramsForFaculty(fac);
        if (trackCount > 0) return trackCount;
    }
    const structures = KIU_STATE.adminProgramStructures?.[fac];
    if (!structures || typeof structures !== 'object') return 0;
    return ['prog', 'free', 'conc', 'minor'].reduce((sum, tabId) => {
        const modules = structures[tabId];
        return sum + (Array.isArray(modules) ? modules.length : 0);
    }, 0);
}

function normalizeStudentRegistrationCourseIds(registrationValue) {
    const collected = [];
    const addCourse = value => {
        if (value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            const text = String(value).trim();
            if (text) collected.push(text);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(addCourse);
            return;
        }
        if (typeof value === 'object') {
            const directId = value.courseId || value.sourceCourseId || value.id || value.n;
            if (directId) addCourse(directId);
            [
                value.courseIds,
                value.courseIDs,
                value.courses,
                value.selectedCourses,
                value.selectedSubjects,
                value.registeredCourses,
                value.registeredSubjects,
                value.subjects,
                value.items
            ].forEach(addCourse);
        }
    };

    addCourse(registrationValue);
    return [...new Set(collected.map(courseId => String(courseId).trim()).filter(Boolean))];
}

function normalizeStudentScheduleEntries(scheduleValue) {
    if (typeof normalizeStudentScheduleValue === 'function') {
        return normalizeStudentScheduleValue(scheduleValue).filter(Boolean);
    }
    if (Array.isArray(scheduleValue)) return scheduleValue.filter(Boolean);
    return [];
}

function formatStudentScheduleSectionLabel(item) {
    const groupRef = item?.groupName ?? item?.groupId ?? 'Section';
    const groupName = typeof groupRef === 'object'
        ? (groupRef?.name || groupRef?.id || 'Section')
        : String(groupRef || 'Section');
    const day = item?.day ? ` / ${item.day}` : '';
    const time = item?.time ? ` ${item.time}` : '';
    return `${groupName}${day}${time}`;
}

function buildStudentRegistrationCourseContext() {
    const user = getCurrentUser() || { id: '31961', semester: KIU_STATE.activeSemester || 1 };
    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    if (!KIU_STATE.studentRegistrations || typeof KIU_STATE.studentRegistrations !== 'object') {
        KIU_STATE.studentRegistrations = {};
    }
    const savedRegistration = normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations[user.id]);
    const currentSchedule = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[user.id])
        .filter(item => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return entryFaculty === activeFaculty;
        });
    const mergedRegistered = [...new Set([
        ...savedRegistration,
        ...currentSchedule.map(item => item?.courseId).filter(Boolean)
    ])];
    return {
        user,
        registered: mergedRegistered,
        passedCourseSet: getRegisteredOrPassedCourses(user.id),
        studentSemester: getCurrentStudentSemesterNumber(user)
    };
}

function isStudentCourseSelected(registeredList, courseId) {
    return (registeredList || []).some(id => canonicalCourseKey(id) === canonicalCourseKey(courseId));
}

function getStudentCourseSelectedSections(studentId, courseId) {
    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    return normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[studentId])
        .filter(item => {
            if (canonicalCourseKey(item?.courseId) !== canonicalCourseKey(courseId)) return false;
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return entryFaculty === activeFaculty;
        });
}

function formatStudentPublishedSectionSummary(groups) {
    const counts = { lecture: 0, seminar: 0 };
    (groups || []).forEach(group => {
        const type = String(group?.sessionType || 'lecture').toLowerCase();
        if (type === 'seminar') counts.seminar += 1;
        else counts.lecture += 1;
    });
    const parts = [];
    if (counts.lecture) parts.push(`Lecture: ${counts.lecture}`);
    if (counts.seminar) parts.push(`Seminar: ${counts.seminar}`);
    return parts.join(' / ');
}

function formatStudentSelectedSectionSummary(selectedSections) {
    const labels = [...new Set((selectedSections || []).map(item => getStudentSectionTypeLabel(item?.sessionType || 'lecture')))];
    return labels.join(', ');
}

function buildStudentRegistrationEnrollmentSignature(userId, faculty) {
    if (!userId) return '';
    const normalizedFaculty = normalizeFacultyCode(faculty || '', 'ECON');
    const registrations = normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations?.[userId]);
    const schedule = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[userId])
        .filter((item) => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function'
                ? deriveFacultyFromSubjectId(item?.courseId)
                : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || normalizedFaculty, normalizedFaculty);
            return entryFaculty === normalizedFaculty;
        });
    const registrationSig = registrations.map((courseId) => String(courseId)).join(',');
    const scheduleSig = schedule
        .map((item) => `${item.courseId || ''}:${item.groupId || ''}:${item.sessionType || 'lecture'}`)
        .join('|');
    return `reg:${registrationSig}|sched:${scheduleSig}`;
}

function buildStudentRegistrationViewSignature(tabId, faculty, safeData, selectedId) {
    const itemIds = (Array.isArray(safeData) ? safeData : []).map((item) => String(item?.id || '')).join('|');
    const cmsRevision = Number(KIU_STATE.meta?.registrationCmsRevision || 0);
    const user = getCurrentUser();
    if (tabId === 'selected') {
        const schedule = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[user?.id]);
        return `${tabId}|${faculty}|${cmsRevision}|${(schedule || []).map((item) => `${item.courseId || ''}:${item.groupId || ''}`).join('|')}`;
    }
    if (tabId === 'history') {
        const passed = Array.isArray(KIU_STATE.studentPassedCourses?.[user?.id]) ? KIU_STATE.studentPassedCourses[user.id] : [];
        return `${tabId}|${faculty}|${cmsRevision}|${passed.map((entry) => typeof entry === 'string' ? entry : (entry?.courseId || entry?.id || '')).join('|')}`;
    }
    return `${tabId}|${faculty}|${cmsRevision}|${selectedId || ''}|${itemIds}|${buildStudentRegistrationEnrollmentSignature(user?.id, faculty)}`;
}

function createStudentRegistrationRenderErrorNode() {
    const wrapper = document.createElement('div');
    wrapper.className = 'registration-render-error home-hover-chip';
    const title = document.createElement('div');
    title.className = 'registration-render-error-title lux-card-title';
    title.textContent = 'Student registration view could not load correctly.';
    const copy = document.createElement('div');
    copy.className = 'registration-render-error-copy lux-card-copy';
    copy.textContent = 'The page hit saved data that needs cleanup. The renderer has been hardened, so refresh once and try again.';
    wrapper.append(title, copy);
    return wrapper;
}

function createRegistrationEmptyStateNode(message) {
    const empty = document.createElement('div');
    empty.className = 'registration-empty-state home-hover-chip';
    empty.textContent = message;
    return empty;
}

function buildStudentRegistrationSectionHeadNode(meta) {
    const head = document.createElement('div');
    head.className = 'registration-section-head';
    const copy = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'registration-section-title lux-card-title';
    title.textContent = meta.title;
    const subtitle = document.createElement('div');
    subtitle.className = 'registration-section-copy lux-card-copy';
    subtitle.textContent = meta.subtitle;
    copy.append(title, subtitle);
    head.appendChild(copy);
    return head;
}

function buildStudentModuleChoiceNode(module, tabId, selectedId, courseContext, fac) {
    const active = module.id === selectedId;
    const completed = getStudentCompletedEctsForCourseIds(courseContext.user.id, module.courses || [], fac);
    const progress = formatEctsProgress(module.maxEcts || 0, completed);

    const label = document.createElement('label');
    label.className = `registration-module-choice home-hover-chip${active ? ' is-active' : ''}`;
    const left = document.createElement('span');
    left.className = 'registration-module-choice-left';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `student-${tabId}-module`;
    input.value = module.id;
    input.checked = active;
    input.dataset.studentRegModule = tabId;
    input.dataset.studentRegChoice = module.id;
    input.className = 'registration-module-choice-radio';
    const title = document.createElement('span');
    title.className = 'registration-module-choice-title';
    title.textContent = `${module.letter || ''}. ${module.name || 'Untitled Module'}`.trim();
    left.append(input, title);
    const ects = document.createElement('span');
    ects.className = 'registration-module-choice-ects';
    ects.textContent = `ECTS: ${progress}`;
    label.append(left, ects);
    return label;
}

function buildStudentProgramChoiceNode(program, tabId, selectedId) {
    const active = program.id === selectedId;
    const label = document.createElement('label');
    label.className = `registration-module-choice home-hover-chip${active ? ' is-active' : ''}`;
    const left = document.createElement('span');
    left.className = 'registration-module-choice-left';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `student-${tabId}-program`;
    input.value = program.id;
    input.checked = active;
    input.dataset.studentRegProgram = tabId;
    input.dataset.studentRegChoice = program.id;
    input.className = 'registration-module-choice-radio';
    const title = document.createElement('span');
    title.className = 'registration-module-choice-title';
    title.textContent = program.name;
    left.append(input, title);
    label.appendChild(left);
    return label;
}

function buildStudentRegistrationSelectedViewNode() {
    const container = document.createElement('div');
    container.className = 'registration-state-list';
    const user = getCurrentUser();
    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    const schedule = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[user?.id])
        .filter((item) => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return entryFaculty === activeFaculty;
        });
    if (!user || !schedule.length) {
        return createRegistrationEmptyStateNode('No selected sections yet.');
    }
    const grouped = new Map();
    schedule.forEach((item) => {
        const key = canonicalCourseKey(item?.courseId || item?.sourceCourseId || '');
        if (!key) return;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
    });
    Array.from(grouped.entries()).forEach(([courseId, items]) => {
        const first = items[0] || {};
        const sectionSummary = items.map((item) => formatStudentScheduleSectionLabel(item)).join(', ');
        const card = document.createElement('div');
        card.className = 'registration-state-card home-hover-chip';
        const title = document.createElement('div');
        title.className = 'registration-state-title lux-card-title';
        title.textContent = first.courseName || courseId;
        const code = document.createElement('div');
        code.className = 'registration-state-meta lux-card-meta';
        code.textContent = courseId;
        const summary = document.createElement('div');
        summary.className = 'registration-state-summary lux-card-copy';
        summary.textContent = sectionSummary;
        card.append(title, code, summary);
        container.appendChild(card);
    });
    return container;
}

function renderStudentRegistrationSelectedView() {
    return buildStudentRegistrationSelectedViewNode();
}

function buildStudentRegistrationHistoryViewNode() {
    const container = document.createElement('div');
    container.className = 'registration-state-list';
    const user = getCurrentUser();
    const rawPassed = user ? KIU_STATE.studentPassedCourses?.[user.id] : [];
    const passedCourses = Array.isArray(rawPassed) ? rawPassed : [];
    if (!user || !passedCourses.length) {
        return createRegistrationEmptyStateNode('No completed registration history yet.');
    }
    passedCourses.forEach((entry) => {
        const courseId = typeof entry === 'string' ? entry : (entry?.courseId || entry?.id || '');
        const courseName = typeof entry === 'string' ? entry : (entry?.courseName || entry?.name || courseId);
        const semester = entry?.semester != null ? `Semester ${entry.semester}` : '';
        const ects = entry?.ects != null ? `${entry.ects} ECTS` : '';
        const card = document.createElement('div');
        card.className = 'registration-state-card home-hover-chip';
        const row = document.createElement('div');
        row.className = 'registration-history-row';
        const left = document.createElement('div');
        const title = document.createElement('div');
        title.className = 'registration-state-title registration-state-title--compact lux-card-title';
        title.textContent = courseName || courseId;
        const code = document.createElement('div');
        code.className = 'registration-state-meta lux-card-meta';
        code.textContent = courseId;
        left.append(title, code);
        const meta = document.createElement('div');
        meta.className = 'registration-history-meta';
        meta.textContent = [semester, ects].filter(Boolean).join(' / ') || 'Completed';
        row.append(left, meta);
        card.appendChild(row);
        container.appendChild(card);
    });
    return container;
}

function renderStudentRegistrationHistoryView() {
    return buildStudentRegistrationHistoryViewNode();
}

function buildStudentCourseActionNode(courseId, courseMeta, selectedSections, publishedGroups, eligibility) {
    if (!eligibility.allowed) {
        const locked = document.createElement('span');
        locked.className = 'registration-course-action-state is-locked';
        locked.textContent = 'Locked';
        return locked;
    }
    if (!publishedGroups.length) {
        const noSections = document.createElement('span');
        noSections.className = 'registration-course-action-state is-empty';
        noSections.textContent = 'No Sections';
        return noSections;
    }
    const actions = document.createElement('div');
    actions.className = 'registration-course-action-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lux-primary-btn registration-course-picker-btn';
    button.dataset.studentCoursePicker = courseId;
    button.dataset.studentCourseName = courseMeta.name || courseId;
    const icon = document.createElement('i');
    icon.className = 'fas fa-check';
    button.append(icon, document.createTextNode(` ${selectedSections.length > 0 ? 'Manage' : 'Choose'}`));
    actions.appendChild(button);
    if (selectedSections.length > 0) {
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'lux-secondary-btn registration-course-remove-btn';
        removeButton.dataset.studentCourseRemove = courseId;
        removeButton.dataset.studentCourseName = courseMeta.name || courseId;
        removeButton.setAttribute('aria-label', `Remove ${courseMeta.name || courseId}`);
        const removeIcon = document.createElement('i');
        removeIcon.className = 'fas fa-times';
        removeButton.append(removeIcon, document.createTextNode(' Remove'));
        actions.appendChild(removeButton);
    }
    return actions;
}

function appendCourseMetaLine(parent, value, className = '') {
    if (!value) return;
    const line = document.createElement('div');
    line.className = className ? `registration-course-meta-line ${className}` : 'registration-course-meta-line';
    line.textContent = value;
    parent.appendChild(line);
}

function buildStudentCourseRowNode(courseRef, idx, fac, courseContext) {
    const courseId = getAssignedCourseId(courseRef);
    const courseMeta = buildRegistrationCourseMeta(courseRef, fac);
    const details = getAssignedCourseCurriculumDetails(courseRef, fac);
    const selectedSections = getStudentCourseSelectedSections(courseContext.user.id, courseId);
    const publishedGroups = getStudentCoursePickerGroups(courseId);
    const publishedSummary = formatStudentPublishedSectionSummary(publishedGroups);
    const selectedSummary = formatStudentSelectedSectionSummary(selectedSections);
    const eligibility = evaluateStudentCourseEligibility(
        courseContext.user,
        courseMeta,
        courseContext.passedCourseSet,
        courseContext.studentSemester
    );

    const row = document.createElement('div');
    row.className = 'registration-course-row home-hover-chip';

    const index = document.createElement('div');
    index.className = 'registration-course-index';
    index.textContent = String(courseRef?.number || courseRef?.n || idx + 1);

    const main = document.createElement('div');
    main.className = 'registration-course-row-main';
    const title = document.createElement('div');
    title.className = 'registration-course-title lux-card-title';
    title.textContent = courseMeta.name || 'Untitled Subject';
    const subtitle = document.createElement('div');
    subtitle.className = 'registration-course-subtitle lux-card-meta';
    subtitle.textContent = courseId || '';
    main.append(title, subtitle);

    const ects = document.createElement('div');
    ects.className = 'registration-course-ects';
    ects.textContent = String(courseMeta.ects || '0');

    const meta = document.createElement('div');
    meta.className = 'registration-course-meta';
    appendCourseMetaLine(meta, `Prerequisite: ${details.prerequisite}`);
    appendCourseMetaLine(meta, details.antiRequisite ? `Anti-requisite: ${details.antiRequisite}` : '', 'is-spaced');
    appendCourseMetaLine(meta, details.curriculumSemester || '', 'is-spaced is-accent');
    appendCourseMetaLine(meta, details.studentAccess ? `Student access: ${details.studentAccess}` : '', 'is-spaced is-info');
    appendCourseMetaLine(meta, publishedSummary ? `Published sections: ${publishedSummary}` : '', 'is-spaced is-accent');
    appendCourseMetaLine(meta, selectedSummary ? `Selected sections: ${selectedSummary}` : '', 'is-spaced is-success');
    appendCourseMetaLine(meta, eligibility.reasons.length > 0 ? eligibility.reasons.join(' / ') : '', 'is-spaced is-danger is-small');

    const action = document.createElement('div');
    action.className = 'registration-course-action';
    action.appendChild(buildStudentCourseActionNode(courseId, courseMeta, selectedSections, publishedGroups, eligibility));

    row.append(index, main, ects, meta, action);
    return row;
}

function renderStudentCourseRows(courseList, fac, courseContext) {
    const rows = courseList || [];
    if (rows.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'registration-course-empty registration-empty-state home-hover-chip';
        empty.textContent = 'No subjects assigned';
        return empty;
    }

    const fragment = document.createDocumentFragment();
    rows.forEach((courseRef, idx) => fragment.appendChild(buildStudentCourseRowNode(courseRef, idx, fac, courseContext)));
    return fragment;
}

function buildRegistrationGridHeadNode() {
    const head = document.createElement('div');
    head.className = 'registration-module-grid-head';
    ['#', 'Subject / Module', 'ECTS', 'Prerequisite', 'Action'].forEach((label) => {
        const cell = document.createElement('div');
        cell.textContent = label;
        head.appendChild(cell);
    });
    return head;
}

function renderStudentModulePaneHtml(module, tabId, fac, courseContext, subtitle) {
    if (!module) {
        return createRegistrationEmptyStateNode('Select a module to review and choose its courses.');
    }

    const completed = getStudentCompletedEctsForCourseIds(courseContext.user.id, module.courses || [], fac);
    const progressLabel = formatEctsProgress(module.maxEcts || 0, completed);

    const shell = document.createElement('div');
    shell.className = 'registration-module-pane-shell';
    const head = document.createElement('div');
    head.className = 'registration-module-pane-head';
    const heading = document.createElement('div');
    heading.className = 'registration-module-pane-heading';
    const title = document.createElement('div');
    title.className = 'registration-module-pane-title lux-card-title';
    title.textContent = module.name || 'Module';
    const copy = document.createElement('div');
    copy.className = 'registration-module-pane-copy lux-card-copy';
    copy.textContent = subtitle;
    heading.append(title, copy);
    const chip = document.createElement('div');
    chip.className='registration-module-pane-chip home-hover-chip';
    chip.textContent = `ECTS: ${progressLabel}`;
    head.append(heading, chip);
    const courseList = document.createElement('div');
    courseList.className = 'registration-course-list';
    courseList.appendChild(renderStudentCourseRows(module.courses || [], fac, courseContext));
    shell.append(head, buildRegistrationGridHeadNode(), courseList);
    return shell;
}

function buildStudentTrackGroupNode(program, group, tabId, fac, courseContext) {
    const completed = getStudentCompletedEctsForCourseIds(courseContext.user.id, group.courses || [], fac);
    const progress = formatEctsProgress(group.maxEcts || 0, completed);
    const groupDomId = `student-track-${tabId}-${canonicalCourseKey(`${program.id}-${group.id || group.name}`)}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'registration-track-group';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'registration-track-group-head';
    button.dataset.studentTrackToggle = groupDomId;
    const icon = document.createElement('i');
    icon.id = `${groupDomId}-icon`;
    icon.className = 'fas fa-chevron-down';
    const copy = document.createElement('div');
    copy.className = 'registration-track-group-copy';
    const title = document.createElement('div');
    title.className = 'registration-track-group-title';
    title.textContent = group.name || 'Group';
    const subtitle = document.createElement('div');
    subtitle.className = 'registration-track-group-subtitle';
    subtitle.textContent = program.name;
    copy.append(title, subtitle);
    const chip = document.createElement('div');
    chip.className='registration-track-group-chip home-hover-chip';
    chip.textContent = `ECTS: ${progress}`;
    button.append(icon, copy, chip);

    const body = document.createElement('div');
    body.id = groupDomId;
    body.className = 'registration-track-group-body';
    const courseList = document.createElement('div');
    courseList.className = 'registration-course-list';
    courseList.appendChild(renderStudentCourseRows(group.courses || [], fac, courseContext));
    body.append(buildRegistrationGridHeadNode(), courseList);

    wrapper.append(button, body);
    return wrapper;
}

function renderStudentTrackPaneHtml(program, tabId, fac, courseContext) {
    if (!program) {
        return createRegistrationEmptyStateNode(`Select a ${tabId === 'conc' ? 'concentration' : 'minor'} program to review its subject groups.`);
    }

    const groups = program.modules || [];
    const card = document.createElement('div');
    card.className = 'registration-track-card home-hover-chip';
    const head = document.createElement('div');
    head.className = 'registration-track-card-head';
    const heading = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'registration-track-title';
    title.textContent = program.name;
    const copy = document.createElement('div');
    copy.className = 'registration-track-copy';
    copy.textContent = tabId === 'conc' ? 'Concentration Program Subjects' : 'Minor Program Subjects';
    heading.append(title, copy);
    const chip = document.createElement('div');
    chip.className='registration-module-pane-chip home-hover-chip';
    chip.textContent = `${groups.length} group${groups.length === 1 ? '' : 's'}`;
    head.append(heading, chip);

    const body = document.createElement('div');
    body.className = 'registration-track-card-body';
    if (!groups.length) {
        body.appendChild(createRegistrationEmptyStateNode('No subject groups added yet.'));
    } else {
        groups.forEach((group) => body.appendChild(buildStudentTrackGroupNode(program, group, tabId, fac, courseContext)));
    }

    card.append(head, body);
    return card;
}

function renderStudentRegStructures(tabId = 'prog') {
    const container = document.getElementById('student-reg-content-container');
    if(!container) {
        console.error("student-reg-content-container NOT found");
        return;
    }
    try {
        window.__studentRegActiveTab = tabId;
        const shellTabId = tabId === 'prog' ? 'program' : (tabId === 'conc' ? 'concentration' : tabId);
        normalizeStudentAcademicRegistrationTabs(shellTabId);
        
        if (tabId === 'history') {
            const historySignature = buildStudentRegistrationViewSignature(tabId, getCurrentFaculty() || 'ECON', [], '');
            if (studentRegistrationViewCache.history?.signature === historySignature && Array.isArray(studentRegistrationViewCache.history.nodes)) {
                container.replaceChildren(...studentRegistrationViewCache.history.nodes);
                return;
            }
            container.replaceChildren(renderStudentRegistrationHistoryView());
            studentRegistrationViewCache.history = {
                signature: historySignature,
                nodes: Array.from(container.childNodes)
            };
            return;
        }
        if (tabId === 'selected') {
            const selectedSignature = buildStudentRegistrationViewSignature(tabId, getCurrentFaculty() || 'ECON', [], '');
            if (studentRegistrationViewCache.selected?.signature === selectedSignature && Array.isArray(studentRegistrationViewCache.selected.nodes)) {
                container.replaceChildren(...studentRegistrationViewCache.selected.nodes);
                return;
            }
            container.replaceChildren(renderStudentRegistrationSelectedView());
            studentRegistrationViewCache.selected = {
                signature: selectedSignature,
                nodes: Array.from(container.childNodes)
            };
            return;
        }
        
        const fac = getCurrentFaculty() || 'ECON';
        
        // Ensure legacy structure container exists for compatibility, but student rendering should
        // always prefer the admin-created CMS structures.
        if(!KIU_STATE.registrationStructures || typeof KIU_STATE.registrationStructures !== 'object') {
            KIU_STATE.registrationStructures = {};
        }
        if(!KIU_STATE.registrationStructures[fac]) {
            KIU_STATE.registrationStructures[fac] = { prog: [], free: [], conc: [], minor: [] };
        }
        
        const data = getStudentRegistrationDataForTab(fac, tabId);
        const safeData = Array.isArray(data) ? data : [];
        const courseContext = buildStudentRegistrationCourseContext();
        studentRegistrationRenderState.tabId = tabId;
        studentRegistrationRenderState.faculty = fac;
        studentRegistrationRenderState.safeData = safeData;
        studentRegistrationRenderState.courseContext = courseContext;
        const tabConfig = typeof resolveStudentRegistrationTabConfig === 'function'
            ? resolveStudentRegistrationTabConfig(tabId, fac)
            : null;
        const meta = tabConfig
            ? {
                title: tabConfig.label,
                subtitle: window.STUDENT_REGISTRATION_SECTION_META?.[tabId]?.subtitle
                    || `Use the ${tabConfig.label.toLowerCase()} structure created by admin and choose only eligible subjects.`,
                listTitle: tabConfig.listTitle || `${tabConfig.label} Programs`,
                paneSubtitle: tabConfig.paneSubtitle || `${tabConfig.label} Subjects`
            }
            : (window.STUDENT_REGISTRATION_SECTION_META?.[tabId] || window.STUDENT_REGISTRATION_SECTION_META?.prog);
        const usesModuleLayout = typeof isStudentRegistrationModuleLayoutTab === 'function'
            ? isStudentRegistrationModuleLayoutTab(tabId, fac)
            : (tabId === 'prog' || tabId === 'free');
        const selectedIdForSignature = getStudentRegistrationChoice(tabId, safeData);
        const viewSignature = buildStudentRegistrationViewSignature(tabId, fac, safeData, selectedIdForSignature);
        const cachedView = studentRegistrationViewCache[tabId];
        if (cachedView?.signature === viewSignature && Array.isArray(cachedView.nodes)) {
            container.replaceChildren(...cachedView.nodes);
            return;
        }

        const fragment = document.createDocumentFragment();
                const facultyHint = buildStudentRegistrationFacultyHintNode(fac, safeData);
        if (facultyHint) fragment.appendChild(facultyHint);

        if (usesModuleLayout) {
            const selectedId = selectedIdForSignature;
            const selectedModule = safeData.find(item => item.id === selectedId) || safeData[0] || null;
            const shellGrid = document.createElement('div');
            shellGrid.className = 'registration-shell-grid';
            const listCard = document.createElement('div');
            listCard.className = 'registration-module-list-card home-hover-chip';
            const listHead = document.createElement('div');
            listHead.className = 'registration-module-list-head';
            const listTitle = document.createElement('div');
            listTitle.className = 'registration-module-list-title lux-card-title';
            listTitle.textContent = meta.listTitle;
            const listCount = document.createElement('span');
            listCount.className = 'registration-module-list-count';
            listCount.textContent = String(safeData.length);
            listHead.append(listTitle, listCount);
            const list = document.createElement('div');
            list.className = 'registration-module-list';
            list.dataset.preserveScrollKey = `student-reg-${tabId}-modules`;
            if (safeData.length === 0) {
                const emptyHost = document.createElement('div');
                emptyHost.className = 'registration-shell-empty';
                emptyHost.appendChild(createRegistrationEmptyStateNode('No modules available yet'));
                fragment.appendChild(emptyHost);
            } else {
                safeData.forEach((module) => list.appendChild(buildStudentModuleChoiceNode(module, tabId, selectedId, courseContext, fac)));
                listCard.append(listHead, list);
                const pane = document.createElement('div');
                pane.id = `student-${tabId}-pane`;
                pane.className = 'registration-module-pane-card home-hover-chip';
                pane.replaceChildren(renderStudentModulePaneHtml(selectedModule, tabId, fac, courseContext, meta.paneSubtitle));
                shellGrid.append(listCard, pane);
                fragment.appendChild(shellGrid);
            }
        } else {
            const selectedId = selectedIdForSignature;
            const selectedProgram = safeData.find(item => item.id === selectedId) || safeData[0] || null;
            const shellGrid = document.createElement('div');
            shellGrid.className = 'registration-shell-grid';
            const listCard = document.createElement('div');
            listCard.className = 'registration-module-list-card home-hover-chip';
            const listHead = document.createElement('div');
            listHead.className = 'registration-module-list-head';
            const listTitle = document.createElement('div');
            listTitle.className = 'registration-module-list-title lux-card-title';
            listTitle.textContent = meta.listTitle;
            const listCount = document.createElement('span');
            listCount.className = 'registration-module-list-count';
            listCount.textContent = String(safeData.length);
            listHead.append(listTitle, listCount);
            const list = document.createElement('div');
            list.className = 'registration-module-list';
            list.dataset.preserveScrollKey = `student-reg-${tabId}-programs`;
            if (safeData.length === 0) {
                const emptyHost = document.createElement('div');
                emptyHost.className = 'registration-shell-empty';
                emptyHost.appendChild(createRegistrationEmptyStateNode(`No ${meta.listTitle.toLowerCase()} yet`));
                fragment.appendChild(emptyHost);
            } else {
                safeData.forEach((program) => list.appendChild(buildStudentProgramChoiceNode(program, tabId, selectedId)));
                listCard.append(listHead, list);
                const pane = document.createElement('div');
                pane.id = `student-${tabId}-pane`;
                pane.className = 'registration-module-pane-card home-hover-chip';
                pane.replaceChildren(renderStudentTrackPaneHtml(selectedProgram, tabId, fac, courseContext));
                shellGrid.append(listCard, pane);
                fragment.appendChild(shellGrid);
            }
        }

        container.replaceChildren(fragment);
        studentRegistrationViewCache[tabId] = {
            signature: viewSignature,
            nodes: Array.from(container.childNodes)
        };
    } catch (err) {
        console.error('Student registration render failed:', err);
        container.replaceChildren(createStudentRegistrationRenderErrorNode());
    }
}

function setStudentRegTrack(tabId, trackId) {
    setStudentRegistrationChoice(tabId, trackId);
}

function sanitizeRegistrationTabStripVisuals(tabsHost) {
    if (!tabsHost) return;
    tabsHost.classList.add('reg-tabs--plain');
    tabsHost.classList.remove('lux-modern-surface');
    tabsHost.removeAttribute('data-lux-transparency-signature');
    tabsHost.removeAttribute('data-lux-tone');
    tabsHost.removeAttribute('style');
    tabsHost.querySelectorAll('.reg-tab').forEach((tab) => {
        tab.classList.remove('lux-modern-tab');
        tab.removeAttribute('data-lux-tone');
        tab.removeAttribute('style');
        if (tab.tagName !== 'BUTTON') {
            const replacement = document.createElement('button');
            replacement.type = 'button';
            replacement.className = tab.className;
            replacement.setAttribute('role', 'tab');
            [...tab.attributes].forEach((attr) => {
                if (attr.name === 'class' || attr.name === 'role') return;
                replacement.setAttribute(attr.name, attr.value);
            });
            replacement.replaceChildren(...tab.childNodes);
            tab.replaceWith(replacement);
        }
        syncRegistrationTabHoverChip(tab);
    });
}

function formatStudentRegistrationTabLabel(label) {
    const text = String(label || '').trim();
    if (!text) return '';
    if (text.includes('<br>')) return text;
    const words = text.split(/\s+/);
    if (words.length <= 2) return text;
    const midpoint = Math.ceil(words.length / 2);
    return `${words.slice(0, midpoint).join(' ')}<br>${words.slice(midpoint).join(' ')}`;
}

function buildStudentRegistrationShellTabs(faculty) {
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'ECON', 'ECON');
    const academicTabs = typeof getStudentRegistrationTabsForFaculty === 'function'
        ? getStudentRegistrationTabsForFaculty(fac)
        : Object.values({
            prog: { shellId: 'program', label: 'My Program' },
            free: { shellId: 'free', label: 'Free Credits' },
            conc: { shellId: 'concentration', label: 'Concentration' },
            minor: { shellId: 'minor', label: 'Minor' }
        });
    return [
        ...academicTabs.map((tab) => ({
            id: tab.shellId || tab.id,
            label: formatStudentRegistrationTabLabel(tab.label)
        })),
        { id: 'history', label: 'History' },
        { id: 'selected', label: 'Selected<br>Courses' }
    ];
}

function normalizeStudentAcademicRegistrationTabs(activeTabId = 'program') {
    const tabsHost = document.querySelector('#page-registration .reg-tabs');
    if (!tabsHost) return;
    sanitizeRegistrationTabStripVisuals(tabsHost);

    const desiredTabs = buildStudentRegistrationShellTabs(getCurrentFaculty() || 'ECON');

    let tabs = Array.from(tabsHost.querySelectorAll('.reg-tab'));
    while (tabs.length < desiredTabs.length) {
        const newTab = document.createElement('button');
        newTab.type = 'button';
        newTab.className = 'reg-tab';
        newTab.setAttribute('role', 'tab');
        tabsHost.appendChild(newTab);
        tabs = Array.from(tabsHost.querySelectorAll('.reg-tab'));
    }

    tabs.forEach((tab, index) => {
        const desired = desiredTabs[index];
        if (!desired) {
            tab.hidden = true;
            tab.classList.remove('active');
            tab.setAttribute('aria-selected', 'false');
            tab.removeAttribute('data-student-reg-tab');
            return;
        }
        tab.hidden = false;
        tab.setAttribute('role', 'tab');
        tab.setAttribute('data-student-reg-tab', desired.id);
        tab.setAttribute('data-reg-tab', desired.id);
        tab.removeAttribute('onclick');
        if ((tab.dataset.studentRegLabel || '') !== desired.label) {
            tab.textContent = '';
            desired.label.split('<br>').forEach((part, partIndex) => {
                if (partIndex > 0) tab.appendChild(document.createElement('br'));
                tab.appendChild(document.createTextNode(part));
            });
            tab.dataset.studentRegLabel = desired.label;
        }
        const isActive = desired.id === activeTabId;
        tab.classList.toggle('active', isActive);
        tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        syncRegistrationTabHoverChip(tab);
    });
}

function getStandaloneStudentRegistrationCmsBucket(faculty) {
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'ECON', 'ECON');
    const bucket = KIU_STATE.registrationCMSByFaculty?.[fac];
    if (bucket && typeof bucket === 'object') {
        return {
            concCourseData: bucket.concCourseData && typeof bucket.concCourseData === 'object' ? bucket.concCourseData : {},
            minorProgramData: bucket.minorProgramData && typeof bucket.minorProgramData === 'object' ? bucket.minorProgramData : {}
        };
    }

    const legacy = KIU_STATE.registrationCMS;
    if (legacy && typeof legacy === 'object' && (legacy.concCourseData || legacy.minorProgramData)) {
        return {
            concCourseData: legacy.concCourseData && typeof legacy.concCourseData === 'object' ? legacy.concCourseData : {},
            minorProgramData: legacy.minorProgramData && typeof legacy.minorProgramData === 'object' ? legacy.minorProgramData : {}
        };
    }

    return { concCourseData: {}, minorProgramData: {} };
}

function normalizeStudentAssignedSeatLimit(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getStudentAssignedSubjectSeatDefaults(item = {}) {
    return {
        lectureCapacity: normalizeStudentAssignedSeatLimit(item?.lectureCapacity, 40),
        seminarCapacity: normalizeStudentAssignedSeatLimit(item?.seminarCapacity, 20)
    };
}

function buildStudentCourseRefFromStandaloneAssignment(assignment) {
    if (typeof assignment === 'string') {
        return {
            courseId: getAssignedCourseId(assignment),
            id: assignment,
            n: '',
            title: '',
            ects: '',
            precondition: '',
            semesterRuleMode: 'all',
            allowedSemesters: '',
            lectureCapacity: 40,
            seminarCapacity: 20
        };
    }

    const seatDefaults = getStudentAssignedSubjectSeatDefaults(assignment);
    const sourceCourses = Array.isArray(assignment?.courses) ? assignment.courses : [];
    return {
        courseId: getAssignedCourseId(sourceCourses[0] || assignment?.courseId || assignment?.id || assignment?.n || ''),
        id: assignment?.id || assignment?.n || '',
        n: assignment?.number || assignment?.n || '',
        title: assignment?.name || assignment?.title || '',
        ects: assignment?.ects || '',
        precondition: assignment?.prerequisites || assignment?.precondition || '',
        semesterRuleMode: assignment?.semesterRuleMode || 'all',
        allowedSemesters: assignment?.allowedSemesters || '',
        lectureCapacity: seatDefaults.lectureCapacity,
        seminarCapacity: seatDefaults.seminarCapacity
    };
}

function buildStudentRegistrationDataFromStandaloneState(faculty) {
    if (typeof buildStudentRegistrationDataFromCms === 'function') {
        return buildStudentRegistrationDataFromCms(faculty);
    }
    return { prog: [], free: [], conc: [], minor: [] };
}

function getStudentRegistrationDataForTab(faculty, tabId) {
    if (typeof getStudentRegistrationDataForTabFromCms === 'function') {
        return getStudentRegistrationDataForTabFromCms(faculty, tabId);
    }
    const derived = buildStudentRegistrationDataFromStandaloneState(faculty);
    const derivedData = derived?.[tabId];
    if (Array.isArray(derivedData)) {
        return derivedData;
    }
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const legacyData = KIU_STATE.registrationStructures?.[fac]?.[tabId];
    return Array.isArray(legacyData) ? legacyData : [];
}

function toggleStudentTrackGroup(groupId) {
    const el = document.getElementById(groupId);
    if (!el) return;
    const icon = document.getElementById(`${groupId}-icon`);
    const hidden = el.hidden;
    el.hidden = !hidden;
    if (icon) {
        icon.classList.toggle('fa-chevron-down', hidden);
        icon.classList.toggle('fa-chevron-right', !hidden);
    }
}

function getStudentCompletedEctsTotal(studentId, preferredFaculty = null) {
    const courseMap = new Map();
    const addCourse = (courseRef) => {
        const courseId = typeof courseRef === 'string' ? courseRef : (courseRef?.id || courseRef?.courseId || courseRef?.n || '');
        const key = canonicalCourseKey(courseId);
        if (!key) return;
        if (!courseMap.has(key)) courseMap.set(key, courseId);
    };

    Object.keys(KIU_STATE.facultyProfiles || {}).forEach(fac => {
        (getActiveCurriculum(fac) || []).forEach(addCourse);
    });
    (KIU_STATE.curriculum || []).forEach(addCourse);

    return getStudentCompletedEctsForCourseIds(studentId, [...courseMap.values()], preferredFaculty);
}

function getStudentCompletedEctsThisSemester(studentId, preferredFaculty = null) {
    const activeFaculty = normalizeFacultyCode(preferredFaculty || getCurrentFaculty(), 'ECON');
    const scheduledEntries = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[studentId])
        .filter(item => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return entryFaculty === activeFaculty;
        });
    const scheduledCourseIds = [
        ...scheduledEntries.map(item => item?.courseId).filter(Boolean),
        ...normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations?.[studentId])
    ];
    const uniqueCourseIds = [...new Set(scheduledCourseIds.map(courseId => canonicalCourseKey(courseId)))]
        .map(key => scheduledCourseIds.find(courseId => canonicalCourseKey(courseId) === key))
        .filter(Boolean);
    return getStudentCompletedEctsForCourseIds(studentId, uniqueCourseIds, preferredFaculty);
}

function getStudentRegisteredEctsTotal(studentId, preferredFaculty = null) {
    const registrations = normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations?.[studentId]);
    const uniqueIds = [...new Set(registrations.map(canonicalCourseKey))];
    return uniqueIds.reduce((sum, key) => {
        const courseId = registrations.find(id => canonicalCourseKey(id) === key);
        const course = getCourseByIdForRegistration(courseId, preferredFaculty);
        return sum + (course ? getCourseEctsValue(course) : 0);
    }, 0);
}

function renderStudentRegModulesAdvanced(modules, fac, options = {}) {
    if (!modules || modules.length === 0) return `<tr><td colspan="6" class="registration-advanced-map-empty">No mapping found.</td></tr>`;
    
    const user = getCurrentUser() || { id: '31961', semester: KIU_STATE.activeSemester || 1 };
    const stdReg = normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations[user.id]);
    const passedCourseSet = getRegisteredOrPassedCourses(user.id);
    const studentSemester = getCurrentStudentSemesterNumber(user);
    const showCompletedProgress = !!options.showCompletedProgress;
    
    return modules.map(mod => {
        const completedProgress = showCompletedProgress
            ? getStudentCompletedEctsForCourseIds(user.id, mod.courses || [], fac)
            : (mod.minEcts || 0);
        const ectsLabel = showCompletedProgress
            ? formatEctsProgress(mod.maxEcts || 0, completedProgress)
            : `${mod.maxEcts || 0}/${mod.minEcts || 0}`;

        let rows = `
        <tbody id="mod-group-${mod.id}" data-mod-id="${mod.id}" class="registration-advanced-module-group">
            <!-- Parent Module Row -->
            <tr class="registration-advanced-module-row" data-student-mod-toggle="${escapeHtml(mod.id)}">
                <td class="registration-advanced-module-cell registration-advanced-module-cell--toggle"><i class="fas fa-chevron-down registration-advanced-module-icon" id="icon-${mod.id}"></i></td>
                <td class="registration-advanced-module-cell registration-advanced-module-cell--letter">
                    ${mod.letter || 'A'} <span class="registration-advanced-module-letter-meta">(${mod.id})</span>
                </td>
                <td class="registration-advanced-module-cell registration-advanced-module-cell--name">${mod.name}</td>
                <td class="registration-advanced-module-cell registration-advanced-module-cell--ects">${ectsLabel}</td>
                <td class="registration-advanced-module-cell registration-advanced-module-cell--spacer"></td>
                <td class="registration-advanced-module-cell registration-advanced-module-cell--action"></td>
            </tr>
        </tbody>
        <tbody id="mod-items-${mod.id}" class="registration-advanced-course-group">
        `;
        
        if ((mod.courses || []).length === 0) {
            rows += `
            <tr class="registration-advanced-module-empty-row">
                <td colspan="6" class="registration-advanced-module-empty-cell">-- Empty Module --</td>
            </tr>`;
        } else {
            rows += mod.courses.map((cId, i) => {
                const courseId = getAssignedCourseId(cId);
                // Find course details from curriculum
                const courseDef = buildRegistrationCourseMeta(cId, fac);
                const isSelected = stdReg.some(id => canonicalCourseKey(id) === canonicalCourseKey(courseId));
                const condText = courseDef.cond && courseDef.cond !== 'None' ? courseDef.cond : 'None';
                const eligibility = evaluateStudentCourseEligibility(user, courseDef, passedCourseSet, studentSemester);
                const semesterRestrictionLabel = getAssignedSemesterRestrictionLabel(courseDef);
                const restrictionMeta = semesterRestrictionLabel
                    ? `<div class="registration-advanced-course-note registration-advanced-course-note--semester">${escapeHtml(semesterRestrictionLabel)}</div>`
                    : '';
                const restrictionText = eligibility.reasons.length > 0
                    ? `<div class="registration-advanced-course-note registration-advanced-course-note--blocked">${escapeHtml(eligibility.reasons.join(' / '))}</div>`
                    : '';
                
                let actionHTML = '';
                let statusIcon = '';
                
                if (!isSelected && !eligibility.allowed) {
                    statusIcon = `<span class="registration-advanced-status registration-advanced-status--blocked"><i class="fas fa-times"></i></span>`;
                    actionHTML = `<button class="lux-secondary-btn registration-advanced-action-btn registration-advanced-action-btn--locked" disabled><i class="fas fa-lock"></i> Locked</button>`;
                } else if (isSelected) {
                    statusIcon = `<span class="registration-advanced-status registration-advanced-status--selected"><i class="fas fa-check"></i></span>`;
                    actionHTML = ``; 
                } else {
                    statusIcon = `<span class="registration-advanced-status registration-advanced-status--open" aria-hidden="true"></span>`;
                    actionHTML = `<button type="button" class="lux-primary-btn registration-advanced-action-btn" data-student-toggle-course="${escapeHtml(courseId)}">Add</button>`;
                }
                
                return `
                <tr class="registration-advanced-course-row">
                    <td class="registration-advanced-course-cell registration-advanced-course-cell--status">${statusIcon}</td>
                    <td class="registration-advanced-course-cell registration-advanced-course-cell--index">${i+1}</td>
                    <td class="registration-advanced-course-cell registration-advanced-course-cell--name">${escapeHtml(courseDef.name)}</td>
                    <td class="registration-advanced-course-cell registration-advanced-course-cell--ects">${courseDef.ects}</td>
                    <td class="registration-advanced-course-cell registration-advanced-course-cell--meta">${escapeHtml(condText)}${restrictionMeta}${restrictionText}</td>
                    <td class="registration-advanced-course-cell registration-advanced-course-cell--action">${actionHTML}</td>
                </tr>`;
            }).join('');
        }
        
        rows += `</tbody>`;
        return rows;
    }).join('');
}

function toggleStudentMod(modId) {
    const el = document.getElementById(`mod-items-${modId}`);
    const icon = document.getElementById(`icon-${modId}`);
    if(el) {
        el.classList.toggle('hidden');
        if(icon) {
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-right');
        }
    }
}

const REGISTRATION_PICKER_BUILD = '20260608-regfix1';

const studentCourseSectionPickerState = {
    courseId: null,
    courseName: '',
    activeType: 'lecture',
    typePinned: false
};

function getStudentSectionTypeLabel(sessionType) {
    const normalized = String(sessionType || '').trim().toLowerCase();
    if (normalized === 'seminar') return 'Seminar';
    if (normalized === 'workshop') return 'Workshop';
    if (normalized === 'lab') return 'Lab';
    return 'Lecture';
}

function getStudentSectionInstructorLabel(group, sessionType = '') {
    const normalizedType = String(sessionType || group?.sessionType || 'lecture').trim().toLowerCase();
    const prof = toEnglishText(group?.prof || '').trim();
    const ta = toEnglishText(group?.ta || '').trim();
    const placeholder = /^(tbd|unassigned|n\/a|--|-)$/i;
    const hasProf = Boolean(prof) && !placeholder.test(prof);
    const hasTa = Boolean(ta) && !placeholder.test(ta);
    if (normalizedType === 'seminar') {
        if (hasTa) return ta;
        if (hasProf) return prof;
        return 'Unassigned TA';
    }
    if (hasProf) return prof;
    return 'Unassigned';
}

function getStudentSectionInstructorColumnLabel(sessionType) {
    return String(sessionType || '').trim().toLowerCase() === 'seminar' ? 'TA' : 'Professor';
}

function getStudentCoursePickerGroups(courseId, courseName = '') {
    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    const groups = getEquivalentCurriculumSubjectIds(courseId, courseName, getCurrentFaculty())
        .flatMap(candidateId => (KIU_STATE.availableGroups?.[candidateId] || [])
            .map(group => normalizeScheduleGroup(candidateId, group)))
        .filter(group => {
            if (!group) return false;
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(group.courseId || courseId) : '';
            const groupFaculty = normalizeFacultyCode(group.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return groupFaculty === activeFaculty;
        });
    const activeSemester = parseInt(KIU_STATE.activeSemester || '', 10);
    const semesterGroups = Number.isFinite(activeSemester)
        ? groups.filter(group => !group.semester || parseInt(group.semester, 10) === activeSemester)
        : groups;
    return semesterGroups.length > 0 ? semesterGroups : groups;
}

function closeStudentCourseSectionPicker() {
    const modal = document.getElementById('student-course-section-picker-modal');
    if (!modal) return;
    if (typeof window.closeLuxPortalModal === 'function') {
        window.closeLuxPortalModal(modal, { remove: true });
        return;
    }
    modal.remove();
}

function getStudentCoursePickerCurrentSchedule() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    return normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[currentUser.id])
        .filter((item) => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function'
                ? deriveFacultyFromSubjectId(item?.courseId)
                : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return entryFaculty === activeFaculty;
        });
}

function formatStudentCourseSectionRemoveConfirm(courseId, groupId, courseName = '') {
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedGroupId = String(groupId || '').trim();
    const subjectLabel = String(
        courseName || studentCourseSectionPickerState.courseName || normalizedCourseId
    ).trim() || 'this subject';
    const scheduleEntry = getStudentCoursePickerCurrentSchedule().find((item) =>
        canonicalCourseKey(item.courseId) === canonicalCourseKey(normalizedCourseId)
        && String(item.groupId || '') === normalizedGroupId
    );
    const groupLabel = String(scheduleEntry?.groupName || scheduleEntry?.groupId || normalizedGroupId || 'section').trim();
    const typeLabel = getStudentSectionTypeLabel(scheduleEntry?.sessionType || 'lecture');
    return `Remove ${typeLabel} section ${groupLabel} for ${subjectLabel} from your registration draft?`;
}

function getRegistrationSharedApi() {
    return window.KiuRegistrationShared || window.__kiuRegSharedApi || {};
}

function normalizeRegistrationRemoveVerificationToken(value) {
    const shared = getRegistrationSharedApi();
    if (typeof shared.normalizeRegistrationRemoveVerificationToken === 'function') {
        return shared.normalizeRegistrationRemoveVerificationToken(value);
    }
    return String(value || '').trim().toUpperCase();
}

function runRegistrationRemoveVerification(config = {}) {
    const shared = getRegistrationSharedApi();
    if (typeof shared.runRegistrationRemoveVerificationModal === 'function') {
        return shared.runRegistrationRemoveVerificationModal(config);
    }
    if (typeof shared.runRegistrationRemoveVerification === 'function') {
        return shared.runRegistrationRemoveVerification(config);
    }
    return Promise.resolve(false);
}

function runRegistrationChooseVerification(config = {}) {
    const shared = getRegistrationSharedApi();
    if (typeof shared.runRegistrationChooseVerificationModal === 'function') {
        return shared.runRegistrationChooseVerificationModal(config);
    }
    return Promise.resolve(false);
}

function buildStudentCourseSectionRemoveVerification(courseId, groupId, courseName = '') {
    const normalizedCourseId = String(courseId || '').trim();
    const normalizedGroupId = String(groupId || '').trim();
    const subjectLabel = String(
        courseName || studentCourseSectionPickerState.courseName || normalizedCourseId
    ).trim() || 'this subject';
    const scheduleEntry = getStudentCoursePickerCurrentSchedule().find((item) =>
        canonicalCourseKey(item.courseId) === canonicalCourseKey(normalizedCourseId)
        && String(item.groupId || '') === normalizedGroupId
    );
    const groupLabel = String(scheduleEntry?.groupName || scheduleEntry?.groupId || normalizedGroupId || 'section').trim();
    const typeLabel = getStudentSectionTypeLabel(scheduleEntry?.sessionType || 'lecture');
    const expectedToken = normalizeRegistrationRemoveVerificationToken(groupLabel);
    return {
        step1Text: formatStudentCourseSectionRemoveConfirm(courseId, groupId, courseName),
        step2Text: `You will lose your seat in ${groupLabel} (${typeLabel}) for ${subjectLabel}. You must choose this section again to re-enroll.`,
        promptText: `Step 3 of 3: Type ${expectedToken} to confirm removal of this section.`,
        expectedToken
    };
}

function buildStudentCourseSubjectRemoveVerification(courseId, courseName = '') {
    const normalizedCourseId = String(courseId || '').trim();
    const subjectLabel = String(courseName || normalizedCourseId).trim() || 'this subject';
    const expectedToken = normalizeRegistrationRemoveVerificationToken(normalizedCourseId);
    return {
        step1Text: `Remove ${subjectLabel} from your registration draft?`,
        step2Text: `This removes every lecture and seminar section you selected for ${subjectLabel}.`,
        promptText: `Step 3 of 3: Type ${expectedToken} to confirm subject removal.`,
        expectedToken
    };
}

function buildStudentCourseSectionChooseVerification(courseId, groupId, courseName = '', group = null) {
    const normalizedCourseId = String(courseId || '').trim();
    const subjectLabel = String(
        courseName || studentCourseSectionPickerState.courseName || normalizedCourseId
    ).trim() || 'this subject';
    const groupLabel = String(group?.name || group?.id || groupId || 'section').trim();
    const typeLabel = getStudentSectionTypeLabel(group?.sessionType || 'lecture');
    const dayLabel = toEnglishText(group?.day || 'TBD');
    const timeLabel = group?.time || 'TBD';
    const roomLabel = group?.room ? `, ${group.room}` : '';
    return {
        step1Text: `Add ${typeLabel} section ${groupLabel} (${dayLabel} ${timeLabel}${roomLabel}) for ${subjectLabel}?`,
        step2Text: `Confirm your seat in ${groupLabel} for ${subjectLabel}. This updates your registration draft immediately.`
    };
}

function buildStudentCourseSectionActionButton(courseId, group, selected, isFull) {
    const button = document.createElement('button');
    if (selected) {
        button.type = 'button';
        button.className = 'lux-secondary-btn registration-section-picker-action-btn is-selected';
        button.dataset.studentCourseSectionClear = escapeHtml(courseId);
        button.dataset.studentCourseSectionGroup = escapeHtml(group.id);
        button.textContent = 'Remove';
        return button;
    }
    if (isFull) {
        button.className = 'lux-secondary-btn registration-section-picker-action-btn is-full';
        button.disabled = true;
        button.textContent = 'Full';
        return button;
    }
    button.type = 'button';
    button.className = 'lux-primary-btn registration-section-picker-action-btn';
    button.dataset.studentCourseSectionChoose = escapeHtml(courseId);
    button.dataset.studentCourseSectionGroup = escapeHtml(group.id);
    button.textContent = 'Choose';
    return button;
}

function buildStudentCourseSectionPickerEmptyState(message) {
    const empty = document.createElement('div');
    empty.className = 'registration-section-picker-empty';
    empty.textContent = message;
    return empty;
}

function buildStudentCourseSectionPickerFooter(courseId, courseName, hasSubjectSelection) {
    const footer = document.createElement('div');
    footer.className = 'registration-section-picker-foot';
    footer.dataset.role = 'student-course-section-picker-foot';

    const actions = document.createElement('div');
    actions.className = 'registration-section-picker-foot-actions';

    if (hasSubjectSelection) {
        const removeSubjectButton = document.createElement('button');
        removeSubjectButton.type = 'button';
        removeSubjectButton.className = 'lux-secondary-btn registration-section-picker-remove-subject-btn';
        removeSubjectButton.dataset.studentCourseRemove = courseId;
        removeSubjectButton.dataset.studentCourseName = courseName || courseId;
        const removeIcon = document.createElement('i');
        removeIcon.className = 'fas fa-trash-alt';
        removeSubjectButton.append(removeIcon, document.createTextNode(' Remove subject'));
        actions.appendChild(removeSubjectButton);
    }

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'lux-primary-btn registration-section-picker-foot-close-btn';
    closeButton.dataset.studentCourseSectionClose = '1';
    closeButton.textContent = 'Close';
    actions.appendChild(closeButton);

    footer.appendChild(actions);
    return footer;
}

function openStudentCourseSectionPicker(courseId, courseName = '') {
    if (window.REGISTRATION_PICKER_BUILD !== REGISTRATION_PICKER_BUILD && typeof console !== 'undefined' && typeof console.error === 'function') {
        console.error('[registration] stale student-registration.js detected. Hard refresh registration.html.');
    }
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return;

    studentCourseSectionPickerState.courseId = normalizedCourseId;
    studentCourseSectionPickerState.courseName = String(courseName || normalizedCourseId).trim();
    const groups = getStudentCoursePickerGroups(normalizedCourseId, studentCourseSectionPickerState.courseName);
    const preferredType = groups.some(group => String(group.sessionType || 'lecture').toLowerCase() === 'lecture')
        ? 'lecture'
        : (groups[0]?.sessionType || 'lecture');
    studentCourseSectionPickerState.activeType = String(preferredType || 'lecture').toLowerCase();
    studentCourseSectionPickerState.typePinned = false;

    closeStudentCourseSectionPicker();
    const modal = document.createElement('div');
    modal.id = 'student-course-section-picker-modal';
    modal.className = 'registration-section-picker-backdrop registration-structured-modal-backdrop lms-glass-dialog-overlay';
    modal.dataset.luxTransparencyExempt = '1';
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    const dialog = document.createElement('div');
    dialog.className = 'registration-section-picker-dialog lux-glass-dialog-card';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Choose course section');
    dialog.dataset.registrationPickerBuild = REGISTRATION_PICKER_BUILD;

    const header = document.createElement('div');
    header.className = 'registration-section-picker-head';
    const headingWrap = document.createElement('div');
    headingWrap.className = 'registration-section-picker-title-wrap';
    const kicker = document.createElement('div');
    kicker.className = 'registration-section-picker-kicker';
    kicker.textContent = 'Section picker';
    const heading = document.createElement('h2');
    heading.className = 'registration-section-picker-title';
    heading.textContent = 'Choose subject section';
    const subheading = document.createElement('p');
    subheading.className = 'registration-section-picker-copy';
    subheading.textContent = 'Select the lecture or seminar group published by the scheduler.';
    headingWrap.append(kicker, heading, subheading);
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.dataset.studentCourseSectionClose = '1';
    closeButton.setAttribute('aria-label', 'Close section picker');
    closeButton.className = 'lux-secondary-btn registration-section-picker-close';
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeButton.appendChild(closeIcon);
    header.append(headingWrap, closeButton);

    const content = document.createElement('div');
    content.className = 'registration-section-picker-content';
    content.dataset.role = 'student-course-section-picker-content';

    dialog.append(header, content);
    modal.appendChild(dialog);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeStudentCourseSectionPicker();
    });
    document.body.appendChild(modal);
    if (typeof window.openLuxPortalModal === 'function') {
        window.openLuxPortalModal(modal);
    } else {
        modal.hidden = false;
        modal.setAttribute('aria-hidden', 'false');
        modal.classList.add('is-open');
    }
    renderStudentCourseSectionPicker();
}

function setStudentCourseSectionType(type) {
    studentCourseSectionPickerState.activeType = String(type || 'lecture').toLowerCase();
    studentCourseSectionPickerState.typePinned = true;
    renderStudentCourseSectionPicker();
}

function renderStudentCourseSectionPicker() {
    const modal = document.getElementById('student-course-section-picker-modal');
    if (!modal) return;

    const courseId = studentCourseSectionPickerState.courseId;
    const courseName = studentCourseSectionPickerState.courseName || courseId;
    const groups = getStudentCoursePickerGroups(courseId, courseName);
    const availableTypes = ['lecture', 'seminar'];
    const groupedByType = availableTypes.reduce((acc, type) => {
        acc[type] = groups.filter(group => String(group.sessionType || 'lecture') === type);
        return acc;
    }, {});
    const fallbackType = availableTypes.find(type => groupedByType[type].length > 0) || 'lecture';
    const requestedType = studentCourseSectionPickerState.activeType;
    const activeType = studentCourseSectionPickerState.typePinned
        ? requestedType
        : (groupedByType[requestedType]?.length > 0 ? requestedType : fallbackType);
    studentCourseSectionPickerState.activeType = activeType;

    const currentSchedule = getStudentCoursePickerCurrentSchedule();
    const rows = (groupedByType[activeType] || []).map(group => {
        const enrolledCount = getEnrolledStudentsForGroup(courseId, group.id).length;
        const capacity = parseInt(group.capacity || 40, 10) || 40;
        const freeSeats = Math.max(0, capacity - enrolledCount);
        const selected = currentSchedule.some(item => item.courseId === courseId && item.groupId === group.id);
        const isFull = !selected && freeSeats <= 0;
        return { group, freeSeats, selected, isFull };
    });

    const content = modal.querySelector('[data-role="student-course-section-picker-content"]');
    if (!content) return;

    const header = document.createElement('div');
    header.className = 'registration-section-picker-toolbar';
    const titleWrap = document.createElement('div');
    titleWrap.className = 'registration-section-picker-toolbar-copy';
    const title = document.createElement('div');
    title.className = 'registration-section-picker-toolbar-title';
    title.textContent = courseName;
    const subtitle = document.createElement('div');
    subtitle.className = 'registration-section-picker-toolbar-meta';
    subtitle.textContent = `Type: ${getStudentSectionTypeLabel(activeType)}`;
    titleWrap.append(title, subtitle);
    const typeButtons = document.createElement('div');
    typeButtons.className = 'registration-section-picker-type-actions';
    availableTypes.forEach((type) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.studentCourseSectionType = type;
        const typeCount = groupedByType[type]?.length || 0;
        button.className = type === activeType
            ? 'lux-primary-btn registration-section-picker-type-btn is-active'
            : 'lux-secondary-btn registration-section-picker-type-btn';
        if (typeCount === 0) button.classList.add('is-empty');
        button.textContent = `${getStudentSectionTypeLabel(type)} (${typeCount})`;
        button.setAttribute('aria-pressed', type === activeType ? 'true' : 'false');
        typeButtons.appendChild(button);
    });
    header.append(titleWrap, typeButtons);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(header);

    if (groups.length === 0) {
        fragment.appendChild(buildStudentCourseSectionPickerEmptyState('No teaching sections have been published for this subject yet.'));
    } else if ((groupedByType[activeType] || []).length === 0) {
        const emptyMessage = activeType === 'seminar'
            ? 'No seminar sections are published yet. Staff must publish a seminar group with a teaching assistant in the scheduler.'
            : `No ${getStudentSectionTypeLabel(activeType).toLowerCase()} sections are available for this subject yet.`;
        fragment.appendChild(buildStudentCourseSectionPickerEmptyState(emptyMessage));
    } else {
        const tableWrap = document.createElement('div');
        tableWrap.className = 'registration-section-picker-table-wrap';
        const table = document.createElement('table');
        table.className = 'registration-section-picker-table';
        const thead = document.createElement('thead');
        thead.className = 'registration-section-picker-table-head';
        const headRow = document.createElement('tr');
        [
            ['Day', 'registration-section-picker-head-cell registration-section-picker-head-cell--left'],
            ['Hours', 'registration-section-picker-head-cell'],
            ['Room', 'registration-section-picker-head-cell'],
            ['Free', 'registration-section-picker-head-cell'],
            [getStudentSectionInstructorColumnLabel(activeType), 'registration-section-picker-head-cell registration-section-picker-head-cell--left'],
            ['Duration', 'registration-section-picker-head-cell'],
            ['Group', 'registration-section-picker-head-cell'],
            ['Action', 'registration-section-picker-head-cell registration-section-picker-head-cell--right']
        ].forEach(([label, className]) => {
            const th = document.createElement('th');
            th.className = className;
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        const tbody = document.createElement('tbody');
        rows.forEach(({ group, freeSeats, selected, isFull }) => {
            const row = document.createElement('tr');
            row.className = 'registration-section-picker-row';
            [
                [toEnglishText(group.day || 'TBD'), 'registration-section-picker-cell registration-section-picker-cell--left'],
                [group.time || 'TBD', 'registration-section-picker-cell'],
                [group.room || 'TBD', 'registration-section-picker-cell'],
                [String(freeSeats), 'registration-section-picker-cell registration-section-picker-cell--center'],
                [getStudentSectionInstructorLabel(group, activeType), 'registration-section-picker-cell registration-section-picker-cell--left'],
                [group.duration || '110min', 'registration-section-picker-cell'],
                [group.name || group.id || '', 'registration-section-picker-cell']
            ].forEach(([value, className]) => {
                const td = document.createElement('td');
                td.className = className;
                td.textContent = value;
                row.appendChild(td);
            });
            const actionCell = document.createElement('td');
            actionCell.className = 'registration-section-picker-cell registration-section-picker-cell--action';
            actionCell.appendChild(buildStudentCourseSectionActionButton(courseId, group, selected, isFull));
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
        table.append(thead, tbody);
        tableWrap.appendChild(table);
        fragment.appendChild(tableWrap);
    }

    const hasSubjectSelection = currentSchedule.some(item =>
        canonicalCourseKey(item.courseId) === canonicalCourseKey(courseId)
    );
    fragment.appendChild(buildStudentCourseSectionPickerFooter(courseId, courseName, hasSubjectSelection));

    content.replaceChildren(fragment);
}

async function clearStudentCourseSection(courseId, groupId) {
    if (typeof unselectCourseGroup !== 'function') return false;
    const preferredFaculty = getCurrentFaculty();
    const courseDef = getCourseByIdForRegistration(courseId, preferredFaculty) || { id: courseId, name: courseId };
    const verified = await runRegistrationRemoveVerification(buildStudentCourseSectionRemoveVerification(
        courseId,
        groupId,
        studentCourseSectionPickerState.courseName || courseDef.name || courseId
    ));
    if (!verified) return false;
    unselectCourseGroup(courseId, groupId);
    renderStudentCourseSectionPicker();
    invalidateStudentRegistrationViewCache();
    const activeTabId = window.__studentRegActiveTab || 'prog';
    if (document.getElementById('student-reg-content-container')) {
        renderStudentRegStructures(activeTabId);
        updateEctsProgress();
    }
    return true;
}

async function removeStudentCourseSelection(courseId, courseName = '') {
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return false;
    const label = String(courseName || normalizedCourseId).trim();
    const verified = await runRegistrationRemoveVerification(buildStudentCourseSubjectRemoveVerification(
        normalizedCourseId,
        label
    ));
    if (!verified) return false;
    if (typeof removeStudentCourseEnrollment !== 'function') return false;
    const removed = removeStudentCourseEnrollment(normalizedCourseId);
    if (removed) closeStudentCourseSectionPicker();
    return removed;
}

async function chooseStudentCourseSection(courseId, groupId) {
    const preferredFaculty = getCurrentFaculty();
    const courseDef = getCourseByIdForRegistration(courseId, preferredFaculty) || { id: courseId, name: courseId };
    const pickerGroups = getStudentCoursePickerGroups(courseId, courseDef.name || courseId);
    const targetGroup = pickerGroups.find((group) =>
        canonicalCourseKey(group.id || group.groupId || group.name || '') === canonicalCourseKey(groupId)
    );
    if (!targetGroup) {
        if (typeof showToast === 'function') {
            showToast('This section belongs to another faculty or is no longer available.', 'warning');
        }
        return false;
    }
    const normalizedGroup = typeof normalizeScheduleGroup === 'function'
        ? normalizeScheduleGroup(courseId, targetGroup)
        : targetGroup;
    const scheduleConflict = typeof findStudentEnrollmentScheduleConflict === 'function'
        ? findStudentEnrollmentScheduleConflict(
            getStudentCoursePickerCurrentSchedule(),
            courseId,
            normalizedGroup || targetGroup
        )
        : null;
    if (scheduleConflict) {
        const confirmText = typeof formatStudentScheduleConflictChooseConfirm === 'function'
            ? formatStudentScheduleConflictChooseConfirm(scheduleConflict, normalizedGroup || targetGroup)
            : (typeof formatStudentScheduleConflictWarning === 'function'
                ? `${formatStudentScheduleConflictWarning(scheduleConflict, normalizedGroup || targetGroup)}\n\nAdd this section anyway?`
                : `Schedule overlap with ${scheduleConflict.courseName || scheduleConflict.courseId} (${scheduleConflict.groupName || scheduleConflict.groupId}).\n\nAdd this section anyway?`);
        const shared = getRegistrationSharedApi();
        const accepted = typeof shared.luxuryConfirmModalAsync === 'function'
            ? await shared.luxuryConfirmModalAsync({
                title: 'Schedule Conflict',
                subtitle: 'Review overlap before continuing',
                message: confirmText,
                confirmLabel: 'Add Anyway'
            })
            : (typeof window.confirm === 'function' ? window.confirm(confirmText) : true);
        if (!accepted) return false;
    }
    const verified = await runRegistrationChooseVerification(
        buildStudentCourseSectionChooseVerification(
            courseId,
            groupId,
            courseDef.name || courseId,
            normalizedGroup || targetGroup
        )
    );
    if (!verified) return false;
    const result = selectCourseGroup(courseId, courseDef.name || courseId, groupId);
    if (result !== false) {
        renderStudentCourseSectionPicker();
        invalidateStudentRegistrationViewCache();
        const activeTabId = window.__studentRegActiveTab || 'prog';
        if (document.getElementById('student-reg-content-container')) {
            renderStudentRegStructures(activeTabId);
            updateEctsProgress();
        }
    }
}

function toggleCourseSelection(cId) {
    const preferredFaculty = getCurrentFaculty();
    const courseDef = getCourseByIdForRegistration(cId, preferredFaculty) || { id: cId, name: cId };
    openStudentCourseSectionPicker(cId, courseDef.name || cId);
}

function handleStudentRegistrationClick(event) {
    const coursePickerTrigger = event.target.closest('[data-student-course-picker]');
    if (coursePickerTrigger) {
        event.preventDefault();
        openStudentCourseSectionPicker(
            coursePickerTrigger.getAttribute('data-student-course-picker') || '',
            coursePickerTrigger.getAttribute('data-student-course-name') || ''
        );
        return;
    }

    const trackToggleTrigger = event.target.closest('[data-student-track-toggle]');
    if (trackToggleTrigger) {
        event.preventDefault();
        toggleStudentTrackGroup(trackToggleTrigger.getAttribute('data-student-track-toggle') || '');
        return;
    }

    const moduleToggleTrigger = event.target.closest('[data-student-mod-toggle]');
    if (moduleToggleTrigger) {
        event.preventDefault();
        toggleStudentMod(moduleToggleTrigger.getAttribute('data-student-mod-toggle') || '');
        return;
    }

    const toggleCourseTrigger = event.target.closest('[data-student-toggle-course]');
    if (toggleCourseTrigger) {
        event.preventDefault();
        toggleCourseSelection(toggleCourseTrigger.getAttribute('data-student-toggle-course') || '');
        return;
    }

    const closePickerTrigger = event.target.closest('[data-student-course-section-close]');
    if (closePickerTrigger) {
        event.preventDefault();
        closeStudentCourseSectionPicker();
        return;
    }

    const removeCourseTrigger = event.target.closest('[data-student-course-remove]');
    if (removeCourseTrigger) {
        event.preventDefault();
        removeStudentCourseSelection(
            removeCourseTrigger.getAttribute('data-student-course-remove') || '',
            removeCourseTrigger.getAttribute('data-student-course-name') || ''
        );
        return;
    }

    const chooseSectionTrigger = event.target.closest('[data-student-course-section-choose]');
    if (chooseSectionTrigger) {
        event.preventDefault();
        chooseStudentCourseSection(
            chooseSectionTrigger.getAttribute('data-student-course-section-choose') || '',
            chooseSectionTrigger.getAttribute('data-student-course-section-group') || ''
        );
        return;
    }

    const clearSectionTrigger = event.target.closest('[data-student-course-section-clear]');
    if (clearSectionTrigger) {
        event.preventDefault();
        clearStudentCourseSection(
            clearSectionTrigger.getAttribute('data-student-course-section-clear') || '',
            clearSectionTrigger.getAttribute('data-student-course-section-group') || ''
        );
        return;
    }

    const switchTypeTrigger = event.target.closest('[data-student-course-section-type]');
    if (switchTypeTrigger) {
        event.preventDefault();
        setStudentCourseSectionType(switchTypeTrigger.getAttribute('data-student-course-section-type') || 'lecture');
    }
}

function handleStudentRegistrationChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-student-reg-module], [data-student-reg-program]')) {
        const tabId = target.getAttribute('data-student-reg-module') || target.getAttribute('data-student-reg-program') || '';
        const selectedId = target.getAttribute('data-student-reg-choice') || target.getAttribute('value') || '';
        if (!tabId || !selectedId) return;
        setStudentRegistrationChoice(tabId, selectedId);
    }
}

function bindStudentRegistrationDelegates() {
    if (window.__studentRegistrationDelegatesBound) return;
    document.addEventListener('click', handleStudentRegistrationClick);
    document.addEventListener('click', (event) => {
        if (!event.target.closest('#student-course-section-picker-modal')) return;
        handleStudentRegistrationClick(event);
        event.stopImmediatePropagation();
    }, true);
    document.addEventListener('change', handleStudentRegistrationChange);
    window.__studentRegistrationDelegatesBound = true;
}

bindStudentRegistrationDelegates();

window.REGISTRATION_PICKER_BUILD = REGISTRATION_PICKER_BUILD;
if (document.getElementById('page-registration') && !window.__registrationPickerBuildLogged) {
    window.__registrationPickerBuildLogged = true;
    if (typeof console !== 'undefined' && typeof console.info === 'function') {
        console.info(`[registration] picker build ${REGISTRATION_PICKER_BUILD}`);
    }
    const expectedBuild = '20260608-regfix1';
    const htmlScripts = Array.from(document.scripts || [])
        .map(script => script.getAttribute('src') || script.src || '')
        .filter(src => src.includes('student-registration.js'));
    const htmlExpectsNewBuild = htmlScripts.some(src => src.includes(expectedBuild));
    if (htmlExpectsNewBuild && window.REGISTRATION_PICKER_BUILD === expectedBuild) {
        // current bundle matches registration.html
    } else if (htmlExpectsNewBuild) {
        const banner = document.createElement('div');
        banner.className = 'registration-runtime-stale-banner';
        banner.setAttribute('role', 'alert');
        banner.textContent = 'Registration scripts are out of date. Hard refresh (Ctrl+Shift+R) or restart the local server from the current project folder.';
        const host = document.getElementById('page-registration');
        if (host && !document.querySelector('.registration-runtime-stale-banner')) {
            host.prepend(banner);
        }
    }
}

window.openStudentCourseSectionPicker = openStudentCourseSectionPicker;
window.closeStudentCourseSectionPicker = closeStudentCourseSectionPicker;
window.renderStudentCourseSectionPicker = renderStudentCourseSectionPicker;
window.setStudentCourseSectionType = setStudentCourseSectionType;
window.chooseStudentCourseSection = chooseStudentCourseSection;
window.clearStudentCourseSection = clearStudentCourseSection;
window.runRegistrationRemoveVerification = runRegistrationRemoveVerification;
window.runRegistrationChooseVerification = runRegistrationChooseVerification;
window.removeStudentCourseSelection = removeStudentCourseSelection;
window.toggleCourseSelection = toggleCourseSelection;
