/* Dedicated student registration logic extracted from core.js. Source of truth remains root core.js compatibility bundle. */

// --- STUDENT REGISTRATION LOGIC ---

function switchRegTab(tabId, triggerElement = null) {
    document.querySelectorAll('.reg-tab').forEach(t => t.classList.remove('active'));
    
    // Convert 'program' to 'prog', 'free' remains 'free', 'concentration' -> 'conc', 'minor' -> 'minor'
    let structureTab = tabId;
    if (tabId === 'program') structureTab = 'prog';
    if (tabId === 'concentration') structureTab = 'conc';

    const shellTabId = structureTab === 'prog' ? 'program' : (structureTab === 'conc' ? 'concentration' : structureTab);
    const clickedTab = (triggerElement && typeof triggerElement.closest === 'function' ? triggerElement.closest('.reg-tab') : null)
        || document.querySelector(`.reg-tab[data-reg-tab="${shellTabId}"]`)
        || document.querySelector(`.reg-tab[data-student-reg-tab="${shellTabId}"]`);
    if (clickedTab) clickedTab.classList.add('active');
    
    // Hide all legacy hardcoded tabs if they exist
    document.querySelectorAll('[id^=reg-tab-]').forEach(t => {
        if(t) t.style.display = 'none';
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

const STUDENT_REGISTRATION_SECTION_META = {
    prog: {
        title: 'My Program',
        subtitle: 'Review the same program module structure created in Registration Structure CMS and choose only eligible subjects.',
        listTitle: 'Program Modules',
        paneSubtitle: 'Program Module Subjects'
    },
    free: {
        title: 'Free Credits',
        subtitle: 'Browse the free-credit modules defined by admin and choose only the subjects you are allowed to take.',
        listTitle: 'Free Credit Modules',
        paneSubtitle: 'Free Credit Subjects'
    },
    conc: {
        title: 'Concentration',
        subtitle: 'Use the same concentration program structure created by admin. You can only choose eligible subjects.',
        listTitle: 'Concentration Programs'
    },
    minor: {
        title: 'Minor',
        subtitle: 'Use the same minor program structure created by admin. You can only choose eligible subjects.',
        listTitle: 'Minor Programs'
    }
};

function getStudentRegistrationScopeKey(user = getCurrentUser(), faculty = getCurrentFaculty()) {
    const fallbackUserId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : '';
    const studentId = String(user?.id || fallbackUserId || 'anonymous').trim() || 'anonymous';
    const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(studentId) : '';
    const normalizedFaculty = normalizeFacultyCode(
        faculty || user?.facultyCode || user?.faculty || derivedFaculty || 'ECON',
        'ECON'
    );
    return `${studentId}::${normalizedFaculty}`;
}

function getScopedStudentRegistrationTrackSelection(tabId = '') {
    if (!KIU_STATE.studentRegistrationTrackSelection || typeof KIU_STATE.studentRegistrationTrackSelection !== 'object') {
        KIU_STATE.studentRegistrationTrackSelection = {};
    }
    const scopeKey = getStudentRegistrationScopeKey();
    const store = KIU_STATE.studentRegistrationTrackSelection;
    if (!store[scopeKey] || typeof store[scopeKey] !== 'object') {
        store[scopeKey] = {};
    }
    if ((tabId === 'conc' || tabId === 'minor') && store[scopeKey][tabId] == null && typeof store[tabId] === 'string') {
        store[scopeKey][tabId] = store[tabId];
    }
    return store[scopeKey];
}

function getStudentRegistrationChoice(tabId, data) {
    const source = (tabId === 'conc' || tabId === 'minor')
        ? (getScopedStudentRegistrationTrackSelection(tabId)?.[tabId] || studentRegistrationUiState[tabId])
        : studentRegistrationUiState[tabId];
    const items = Array.isArray(data) ? data : [];
    const fallback = items[0]?.id || null;
    const selected = items.some(item => item.id === source) ? source : fallback;
    studentRegistrationUiState[tabId] = selected;
    return selected;
}

function setStudentRegistrationChoice(tabId, selectedId) {
    const nextSelectedId = selectedId || null;
    if (studentRegistrationUiState[tabId] === nextSelectedId && window.__studentRegActiveTab === tabId) {
        return;
    }
    studentRegistrationUiState[tabId] = nextSelectedId;
    if (tabId === 'conc' || tabId === 'minor') {
        getScopedStudentRegistrationTrackSelection(tabId)[tabId] = nextSelectedId;
        saveState();
    }
    if (!updateStudentRegistrationSelectionView(tabId, nextSelectedId)) {
        renderStudentRegStructures(tabId);
    }
    if (typeof refreshRegistrationUI === 'function') {
        refreshRegistrationUI();
    }
}

function updateStudentRegistrationSelectionView(tabId, selectedId) {
    const container = document.getElementById('student-reg-content-container');
    if (!container || window.__studentRegActiveTab !== tabId) return false;
    if (tabId === 'history' || tabId === 'selected') return false;

    const fac = getCurrentFaculty() || 'ECON';
    const useCachedState = studentRegistrationRenderState.tabId === tabId && studentRegistrationRenderState.faculty === fac;
    const safeData = useCachedState
        ? (Array.isArray(studentRegistrationRenderState.safeData) ? studentRegistrationRenderState.safeData : [])
        : (Array.isArray(getStudentRegistrationDataForTab(fac, tabId)) ? getStudentRegistrationDataForTab(fac, tabId) : []);
    const courseContext = useCachedState
        ? (studentRegistrationRenderState.courseContext || buildStudentRegistrationCourseContext())
        : buildStudentRegistrationCourseContext();
    const pane = document.getElementById(`student-${tabId}-pane`);
    if (!pane) return false;

    const itemSelector = tabId === 'prog' || tabId === 'free'
        ? `input[data-student-reg-module="${tabId}"]`
        : `input[data-student-reg-program="${tabId}"]`;

    container.querySelectorAll(itemSelector).forEach((input) => {
        const isActive = String(input.getAttribute('data-student-reg-choice') || '') === String(selectedId || '');
        input.checked = isActive;
        input.closest('.registration-module-choice')?.classList.toggle('is-active', isActive);
    });

    if (tabId === 'prog' || tabId === 'free') {
        const selectedModule = safeData.find((item) => item.id === selectedId) || safeData[0] || null;
        const meta = STUDENT_REGISTRATION_SECTION_META[tabId] || STUDENT_REGISTRATION_SECTION_META.prog;
        pane.replaceChildren(renderStudentModulePaneHtml(selectedModule, tabId, fac, courseContext, meta.paneSubtitle));
        return true;
    }

    const selectedProgram = safeData.find((item) => item.id === selectedId) || safeData[0] || null;
    pane.replaceChildren(renderStudentTrackPaneHtml(selectedProgram, tabId, fac, courseContext));
    return true;
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
    if (Array.isArray(scheduleValue)) return scheduleValue.filter(Boolean);
    if (scheduleValue && typeof scheduleValue === 'object') {
        if (Array.isArray(scheduleValue.entries)) return scheduleValue.entries.filter(Boolean);
        return Object.entries(scheduleValue)
            .filter(([, groupId]) => groupId != null && groupId !== '')
            .map(([courseId, groupId]) => ({ courseId, groupId }));
    }
    return [];
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

function buildStudentRegistrationViewSignature(tabId, faculty, safeData, selectedId) {
    const itemIds = (Array.isArray(safeData) ? safeData : []).map((item) => String(item?.id || '')).join('|');
    const user = getCurrentUser();
    if (tabId === 'selected') {
        const schedule = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[user?.id]);
        return `${tabId}|${faculty}|${(schedule || []).map((item) => `${item.courseId || ''}:${item.groupId || ''}`).join('|')}`;
    }
    if (tabId === 'history') {
        const passed = Array.isArray(KIU_STATE.studentPassedCourses?.[user?.id]) ? KIU_STATE.studentPassedCourses[user.id] : [];
        return `${tabId}|${faculty}|${passed.map((entry) => typeof entry === 'string' ? entry : (entry?.courseId || entry?.id || '')).join('|')}`;
    }
    return `${tabId}|${faculty}|${selectedId || ''}|${itemIds}`;
}

function createStudentRegistrationRenderErrorNode() {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'padding:28px; background:white; border:1px dashed #dbe5f1; border-radius:18px; color:#475569;';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:16px; font-weight:800; color:var(--kiu-navy); margin-bottom:8px;';
    title.textContent = 'Student registration view could not load correctly.';
    const copy = document.createElement('div');
    copy.style.cssText = 'font-size:12px; color:#64748b;';
    copy.textContent = 'The page hit saved data that needs cleanup. The renderer has been hardened, so refresh once and try again.';
    wrapper.append(title, copy);
    return wrapper;
}

function createRegistrationEmptyStateNode(message) {
    const empty = document.createElement('div');
    empty.className = 'registration-empty-state';
    empty.textContent = message;
    return empty;
}

function buildStudentRegistrationSectionHeadNode(meta) {
    const head = document.createElement('div');
    head.className = 'registration-section-head';
    const copy = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'registration-section-title';
    title.textContent = meta.title;
    const subtitle = document.createElement('div');
    subtitle.className = 'registration-section-copy';
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
    label.className = `registration-module-choice${active ? ' is-active' : ''}`;
    const left = document.createElement('span');
    left.className = 'registration-module-choice-left';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `student-${tabId}-module`;
    input.value = module.id;
    input.checked = active;
    input.dataset.studentRegModule = tabId;
    input.dataset.studentRegChoice = module.id;
    input.style.margin = '0';
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
    label.className = `registration-module-choice${active ? ' is-active' : ''}`;
    const left = document.createElement('span');
    left.className = 'registration-module-choice-left';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = `student-${tabId}-program`;
    input.value = program.id;
    input.checked = active;
    input.dataset.studentRegProgram = tabId;
    input.dataset.studentRegChoice = program.id;
    input.style.margin = '0';
    const title = document.createElement('span');
    title.className = 'registration-module-choice-title';
    title.textContent = program.name;
    left.append(input, title);
    label.appendChild(left);
    return label;
}

function buildStudentRegistrationSelectedViewNode() {
    const container = document.createElement('div');
    container.style.cssText = 'display:grid; gap:14px;';
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
        const sectionSummary = items.map((item) => `${item.groupName || item.groupId || 'Section'}${item.day ? ` / ${item.day}` : ''}${item.time ? ` ${item.time}` : ''}`).join(', ');
        const card = document.createElement('div');
        card.className = 'registration-state-card';
        const title = document.createElement('div');
        title.style.cssText = 'font-size:18px; font-weight:800; color:var(--kiu-navy);';
        title.textContent = first.courseName || courseId;
        const code = document.createElement('div');
        code.style.cssText = 'font-size:12px; color:#64748b; margin-top:6px;';
        code.textContent = courseId;
        const summary = document.createElement('div');
        summary.style.cssText = 'font-size:13px; color:#0f172a; margin-top:12px; line-height:1.7;';
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
    container.style.cssText = 'display:grid; gap:14px;';
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
        card.className = 'registration-state-card';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;';
        const left = document.createElement('div');
        const title = document.createElement('div');
        title.style.cssText = 'font-size:17px; font-weight:800; color:var(--kiu-navy);';
        title.textContent = courseName || courseId;
        const code = document.createElement('div');
        code.style.cssText = 'font-size:12px; color:#64748b; margin-top:6px;';
        code.textContent = courseId;
        left.append(title, code);
        const meta = document.createElement('div');
        meta.style.cssText = 'font-size:12px; color:#475569; text-align:right;';
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
        locked.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; min-width:96px; padding:8px 12px; border-radius:12px; font-size:11px; font-weight:800; background:#f8fafc; color:#94a3b8; border:1px solid #e2e8f0;';
        locked.textContent = 'Locked';
        return locked;
    }
    if (!publishedGroups.length) {
        const noSections = document.createElement('span');
        noSections.style.cssText = 'display:inline-flex; align-items:center; justify-content:center; min-width:96px; padding:8px 12px; border-radius:12px; font-size:11px; font-weight:800; background:#fff7ed; color:#c2410c; border:1px solid #fdba74;';
        noSections.textContent = 'No Sections';
        return noSections;
    }
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'kiu-btn-blue';
    button.dataset.studentCoursePicker = courseId;
    button.dataset.studentCourseName = courseMeta.name || courseId;
    button.style.cssText = 'padding:8px 12px; font-size:11px; min-width:96px;';
    const icon = document.createElement('i');
    icon.className = 'fas fa-check';
    button.append(icon, document.createTextNode(` ${selectedSections.length > 0 ? 'Manage' : 'Choose'}`));
    return button;
}

function appendCourseMetaLine(parent, value, style = '') {
    if (!value) return;
    const line = document.createElement('div');
    line.style.cssText = style;
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
    row.className = 'registration-course-row';

    const index = document.createElement('div');
    index.className = 'registration-course-index';
    index.textContent = String(courseRef?.number || courseRef?.n || idx + 1);

    const main = document.createElement('div');
    main.className = 'registration-course-row-main';
    const title = document.createElement('div');
    title.className = 'registration-course-title';
    title.textContent = courseMeta.name || 'Untitled Subject';
    const subtitle = document.createElement('div');
    subtitle.className = 'registration-course-subtitle';
    subtitle.textContent = courseId || '';
    main.append(title, subtitle);

    const ects = document.createElement('div');
    ects.className = 'registration-course-ects';
    ects.textContent = String(courseMeta.ects || '0');

    const meta = document.createElement('div');
    meta.className = 'registration-course-meta';
    appendCourseMetaLine(meta, `Prerequisite: ${details.prerequisite}`);
    appendCourseMetaLine(meta, details.antiRequisite ? `Anti-requisite: ${details.antiRequisite}` : '', 'margin-top:4px;');
    appendCourseMetaLine(meta, details.curriculumSemester || '', 'margin-top:4px; color:#0f766e; font-weight:700;');
    appendCourseMetaLine(meta, details.studentAccess ? `Student access: ${details.studentAccess}` : '', 'margin-top:4px; color:#2563eb; font-weight:700;');
    appendCourseMetaLine(meta, publishedSummary ? `Published sections: ${publishedSummary}` : '', 'margin-top:4px; color:#0f766e; font-weight:700;');
    appendCourseMetaLine(meta, selectedSummary ? `Selected sections: ${selectedSummary}` : '', 'margin-top:4px; color:#047857; font-weight:700;');
    appendCourseMetaLine(meta, eligibility.reasons.length > 0 ? eligibility.reasons.join(' / ') : '', 'margin-top:4px; color:#dc2626; font-size:10px; font-weight:700;');

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
        empty.style.cssText = 'padding:18px; text-align:center; color:var(--kiu-text-muted); background:#f8fafc; border:1px dashed #dbe5f1; border-radius:16px;';
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
    title.className = 'registration-module-pane-title';
    title.textContent = module.name || 'Module';
    const copy = document.createElement('div');
    copy.className = 'registration-module-pane-copy';
    copy.textContent = subtitle;
    heading.append(title, copy);
    const chip = document.createElement('div');
    chip.className = 'registration-module-pane-chip';
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
    chip.className = 'registration-track-group-chip';
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
    card.className = 'registration-track-card';
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
    chip.className = 'registration-module-pane-chip';
    chip.textContent = `${groups.length} group${groups.length === 1 ? '' : 's'}`;
    head.append(heading, chip);

    const body = document.createElement('div');
    body.className = 'registration-track-card-body';
    if (!groups.length) {
        const empty = createRegistrationEmptyStateNode('No subject groups added yet.');
        empty.style.margin = '0';
        body.appendChild(empty);
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
        const meta = STUDENT_REGISTRATION_SECTION_META[tabId] || STUDENT_REGISTRATION_SECTION_META.prog;
        const selectedIdForSignature = getStudentRegistrationChoice(tabId, safeData);
        const viewSignature = buildStudentRegistrationViewSignature(tabId, fac, safeData, selectedIdForSignature);
        const cachedView = studentRegistrationViewCache[tabId];
        if (cachedView?.signature === viewSignature && Array.isArray(cachedView.nodes)) {
            container.replaceChildren(...cachedView.nodes);
            return;
        }

        const fragment = document.createDocumentFragment();
        fragment.appendChild(buildStudentRegistrationSectionHeadNode(meta));

        if (tabId === 'prog' || tabId === 'free') {
            const selectedId = selectedIdForSignature;
            const selectedModule = safeData.find(item => item.id === selectedId) || safeData[0] || null;
            const shellGrid = document.createElement('div');
            shellGrid.className = 'registration-shell-grid';
            const listCard = document.createElement('div');
            listCard.className = 'registration-module-list-card';
            const listHead = document.createElement('div');
            listHead.className = 'registration-module-list-head';
            const listTitle = document.createElement('div');
            listTitle.className = 'registration-module-list-title';
            listTitle.textContent = meta.listTitle;
            const listCount = document.createElement('span');
            listCount.className = 'registration-module-list-count';
            listCount.textContent = String(safeData.length);
            listHead.append(listTitle, listCount);
            const list = document.createElement('div');
            list.className = 'registration-module-list';
            list.dataset.preserveScrollKey = `student-reg-${tabId}-modules`;
            if (safeData.length === 0) {
                const empty = createRegistrationEmptyStateNode('No modules available yet');
                empty.style.margin = '0';
                list.appendChild(empty);
            } else {
                safeData.forEach((module) => list.appendChild(buildStudentModuleChoiceNode(module, tabId, selectedId, courseContext, fac)));
            }
            listCard.append(listHead, list);
            const pane = document.createElement('div');
            pane.id = `student-${tabId}-pane`;
            pane.className = 'registration-module-pane-card';
            pane.replaceChildren(renderStudentModulePaneHtml(selectedModule, tabId, fac, courseContext, meta.paneSubtitle));
            shellGrid.append(listCard, pane);
            fragment.appendChild(shellGrid);
        } else {
            const selectedId = selectedIdForSignature;
            const selectedProgram = safeData.find(item => item.id === selectedId) || safeData[0] || null;
            const shellGrid = document.createElement('div');
            shellGrid.className = 'registration-shell-grid';
            const listCard = document.createElement('div');
            listCard.className = 'registration-module-list-card';
            const listHead = document.createElement('div');
            listHead.className = 'registration-module-list-head';
            const listTitle = document.createElement('div');
            listTitle.className = 'registration-module-list-title';
            listTitle.textContent = meta.listTitle;
            const listCount = document.createElement('span');
            listCount.className = 'registration-module-list-count';
            listCount.textContent = String(safeData.length);
            listHead.append(listTitle, listCount);
            const list = document.createElement('div');
            list.className = 'registration-module-list';
            list.dataset.preserveScrollKey = `student-reg-${tabId}-programs`;
            if (safeData.length === 0) {
                const empty = createRegistrationEmptyStateNode(`No ${tabId === 'conc' ? 'concentration' : 'minor'} programs yet`);
                empty.style.margin = '0';
                list.appendChild(empty);
            } else {
                safeData.forEach((program) => list.appendChild(buildStudentProgramChoiceNode(program, tabId, selectedId)));
            }
            listCard.append(listHead, list);
            const pane = document.createElement('div');
            pane.id = `student-${tabId}-pane`;
            pane.className = 'registration-module-pane-card';
            pane.replaceChildren(renderStudentTrackPaneHtml(selectedProgram, tabId, fac, courseContext));
            shellGrid.append(listCard, pane);
            fragment.appendChild(shellGrid);
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

function normalizeStudentAcademicRegistrationTabs(activeTabId = 'program') {
    const tabsHost = document.querySelector('#page-registration .reg-tabs');
    if (!tabsHost) return;

    const desiredTabs = [
        { id: 'program', label: 'My<br>Program' },
        { id: 'free', label: 'Free<br>Credits' },
        { id: 'concentration', label: 'Concentration' },
        { id: 'minor', label: 'Minor' },
        { id: 'history', label: 'History' },
        { id: 'selected', label: 'Selected<br>Courses' }
    ];

    let tabs = Array.from(tabsHost.querySelectorAll('.reg-tab'));
    while (tabs.length < desiredTabs.length) {
        const newTab = document.createElement('div');
        newTab.className = 'reg-tab';
        tabsHost.appendChild(newTab);
        tabs = Array.from(tabsHost.querySelectorAll('.reg-tab'));
    }

    tabs.forEach((tab, index) => {
        const desired = desiredTabs[index];
        if (!desired) {
            tab.style.display = 'none';
            tab.classList.remove('active');
            tab.removeAttribute('data-student-reg-tab');
            return;
        }
        tab.style.display = '';
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
        tab.classList.toggle('active', desired.id === activeTabId);
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
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'ECON', 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures?.[fac];
    if (!facultyStructures) {
        return { prog: [], free: [], conc: [], minor: [] };
    }

    const normalizeArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
    const cmsBucket = getStandaloneStudentRegistrationCmsBucket(fac);
    const facultyConcCourseData = cmsBucket.concCourseData;
    const facultyMinorProgramData = cmsBucket.minorProgramData;

    const convertModule = (module) => ({
        id: module?.id || '',
        letter: module?.letter || '',
        name: module?.name || 'Untitled Module',
        maxEcts: module?.maxEcts || 0,
        minEcts: module?.minEcts || 0,
        courses: normalizeArray(module?.subModules).map(buildStudentCourseRefFromStandaloneAssignment)
    });

    const convertTrackGroup = (groupName, group, index) => ({
        id: `${groupName}-${index}`,
        letter: String.fromCharCode(65 + (index % 26)),
        name: groupName,
        maxEcts: group?.maxEcts || parseEctsProgress(group?.ects || '0/0').max || 0,
        minEcts: 0,
        courses: normalizeArray(group?.courses).map((course) => ({
            courseId: getAssignedCourseId(course),
            id: course?.n || '',
            n: course?.n || '',
            title: course?.title || '',
            ects: course?.ects || '',
            precondition: course?.precondition || '',
            semesterRuleMode: course?.semesterRuleMode || 'all',
            allowedSemesters: course?.allowedSemesters || '',
            lectureCapacity: normalizeStudentAssignedSeatLimit(course?.lectureCapacity, 40),
            seminarCapacity: normalizeStudentAssignedSeatLimit(course?.seminarCapacity, 20)
        }))
    });

    return {
        prog: normalizeArray(facultyStructures.prog).map(convertModule),
        free: normalizeArray(facultyStructures.free).map(convertModule),
        conc: Object.entries(facultyConcCourseData).map(([programName, groups]) => ({
            id: programName,
            name: programName,
            modules: Object.entries(groups || {}).map(([groupName, group], index) => convertTrackGroup(groupName, group, index))
        })),
        minor: Object.entries(facultyMinorProgramData).map(([programName, program]) => ({
            id: programName,
            name: programName,
            modules: Object.entries(program?.courseGroups || {}).map(([groupName, group], index) => convertTrackGroup(groupName, group, index))
        }))
    };
}

function getStudentRegistrationDataForTab(faculty, tabId) {
    const derived = buildStudentRegistrationDataFromStandaloneState(faculty);
    const derivedData = derived?.[tabId];
    if (Array.isArray(derivedData)) {
        return derivedData;
    }
    const legacyData = KIU_STATE.registrationStructures?.[faculty]?.[tabId];
    return Array.isArray(legacyData) ? legacyData : [];
}

function toggleStudentTrackGroup(groupId) {
    const el = document.getElementById(groupId);
    if (!el) return;
    const icon = document.getElementById(`${groupId}-icon`);
    const hidden = el.style.display === 'none';
    el.style.display = hidden ? '' : 'none';
    if (icon) {
        icon.classList.toggle('fa-chevron-down', hidden);
        icon.classList.toggle('fa-chevron-right', !hidden);
    }
}

function canonicalCourseKey(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeSubjectTitleKey(value) {
    return cleanupEncodingArtifacts(toEnglishText(String(value || '')))
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getAllCurriculumSubjects() {
    const fp = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const subjects = [];
    const seen = new Set();

    Object.keys(fp || {}).forEach(fac => {
        (getActiveCurriculum(fac) || []).forEach(subject => {
            const key = canonicalCourseKey(subject?.id);
            if (!key || seen.has(key)) return;
            seen.add(key);
            subjects.push(subject);
        });
    });

    (KIU_STATE.curriculum || []).forEach(subject => {
        const key = canonicalCourseKey(subject?.id);
        if (!key || seen.has(key)) return;
        seen.add(key);
        subjects.push(subject);
    });

    return subjects;
}

function findCurriculumSubjectByIdOrTitle(subjectId, subjectTitle = '', preferredFaculty = null) {
    const targetKey = canonicalCourseKey(subjectId);
    const titleKey = normalizeSubjectTitleKey(subjectTitle);
    const allSubjects = getAllCurriculumSubjects();

    if (targetKey && preferredFaculty) {
        const preferredById = (getActiveCurriculum(preferredFaculty) || [])
            .find(subject => canonicalCourseKey(subject?.id) === targetKey);
        if (preferredById) return preferredById;
    }

    if (targetKey) {
        const exactById = allSubjects.find(subject => canonicalCourseKey(subject?.id) === targetKey);
        if (exactById) return exactById;
    }

    if (titleKey && preferredFaculty) {
        const preferredByTitle = (getActiveCurriculum(preferredFaculty) || [])
            .find(subject => normalizeSubjectTitleKey(subject?.name) === titleKey);
        if (preferredByTitle) return preferredByTitle;
    }

    if (!titleKey) return null;
    return allSubjects.find(subject => normalizeSubjectTitleKey(subject?.name) === titleKey) || null;
}

function getEquivalentCurriculumSubjectIds(subjectId, subjectTitle = '', preferredFaculty = null) {
    const matchedSubject = findCurriculumSubjectByIdOrTitle(subjectId, subjectTitle, preferredFaculty);
    const matchedTitleKey = normalizeSubjectTitleKey(matchedSubject?.name || subjectTitle);
    const ids = new Set();
    if (subjectId) ids.add(String(subjectId).trim());
    if (matchedSubject?.id) ids.add(String(matchedSubject.id).trim());
    if (!matchedTitleKey) return [...ids].filter(Boolean);

    getAllCurriculumSubjects().forEach(subject => {
        if (normalizeSubjectTitleKey(subject?.name) === matchedTitleKey && subject?.id) {
            ids.add(String(subject.id).trim());
        }
    });

    return [...ids].filter(Boolean);
}

function findAvailableGroupForAssignedSubject(courseId, courseName, groupId) {
    const normalizedGroupId = String(groupId || '').trim().toLowerCase();
    if (!normalizedGroupId) return null;

    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    const candidateIds = getEquivalentCurriculumSubjectIds(courseId, courseName, getCurrentFaculty());
    for (const candidateId of candidateIds) {
        const group = (KIU_STATE.availableGroups?.[candidateId] || [])
            .find(item => {
                if (String(item?.id || '').trim().toLowerCase() !== normalizedGroupId) return false;
                const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(candidateId) : '';
                const groupFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
                return groupFaculty === activeFaculty;
            });
        if (group) return { courseId: candidateId, group };
    }
    return null;
}

// Legacy admin quiz/exam studio helpers were removed from the standalone student registration runtime.
// The live exams route now owns that surface in assets/js/pages/exams-console.js, and registration/admin-tools do not mount admin-exams roots.

function parseRequiredCourseIds(condText) {
    const raw = String(condText || '').trim();
    if (!raw || raw.toLowerCase() === 'none') return [];
    const matches = raw.toUpperCase().match(/[A-Z]+(?:-[A-Z0-9]+)+/g) || [];
    return [...new Set(matches)];
}

function getCourseByIdForRegistration(courseId, preferredFaculty = null, subjectTitle = '') {
    return findCurriculumSubjectByIdOrTitle(courseId, subjectTitle, preferredFaculty);
}

function resolveSubjectIdFromRosterId(rosterId, subjectList) {
    const byCanonical = new Map((subjectList || []).map(s => [canonicalCourseKey(s.id), s.id]));
    const raw = String(rosterId || '').trim().toUpperCase();
    if (!raw) return null;

    const base = raw.split('::')[0];
    const candidates = [
        base,
        base.replace(/_/g, '-'),
        base.replace(/[_-]?G\d+$/i, ''),
        base.replace(/[_-]?GROUP\d+$/i, '')
    ];

    for (const candidate of candidates) {
        const key = canonicalCourseKey(candidate);
        if (byCanonical.has(key)) return byCanonical.get(key);
    }

    const compactBase = canonicalCourseKey(base.replace(/[_-]?G\d+$/i, ''));
    if (!compactBase) return null;
    const prefixMatches = (subjectList || [])
        .map(s => ({ id: s.id, key: canonicalCourseKey(s.id) }))
        .filter(s => s.key.startsWith(compactBase))
        .sort((a, b) => a.key.length - b.key.length);

    return prefixMatches[0]?.id || null;
}

function getRegisteredOrPassedCourses(studentId) {
    const keySet = new Set();
    const addCourse = (courseId) => {
        const key = canonicalCourseKey(courseId);
        if (key) keySet.add(key);
    };

    // Explicitly passed courses (if maintained externally).
    (KIU_STATE.studentPassedCourses?.[studentId] || []).forEach(addCourse);

    const fp = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const subjectList = [
        ...Object.keys(fp || {}).flatMap(fac => getActiveCurriculum(fac) || []),
        ...(KIU_STATE.curriculum || [])
    ].filter((subj, idx, arr) => subj?.id && arr.findIndex(s => s?.id === subj.id) === idx);

    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
        const record = (roster || []).find(entry => String(entry.id) === String(studentId));
        if (!record) return;
        if (!isGradeRecordPassedByKiuRule(record)) return;

        const resolvedSubjectId = resolveSubjectIdFromRosterId(rosterId, subjectList);
        addCourse(resolvedSubjectId);
    });

    return keySet;
}

function getCurrentStudentSemesterNumber(student) {
    const explicitSemester = parseInt(student?.semester, 10);
    if (Number.isFinite(explicitSemester) && explicitSemester > 0) return explicitSemester;

    const activeSemester = parseInt(KIU_STATE.activeSemester, 10);
    if (Number.isFinite(activeSemester) && activeSemester > 0) return activeSemester;

    const courseYear = parseInt(student?.course, 10);
    if (Number.isFinite(courseYear) && courseYear > 0) {
        const calculatedSemester = parseInt(calculateStudentSemester(courseYear), 10);
        if (Number.isFinite(calculatedSemester) && calculatedSemester > 0) return calculatedSemester;
    }

    return 1;
}

function evaluateStudentCourseEligibility(student, courseDef, passedCourseSet, studentSemester) {
    const reasons = [];
    const normalizedStudentSemester = Number.isFinite(studentSemester) ? studentSemester : getCurrentStudentSemesterNumber(student);
    const assignmentRestriction = normalizeAssignedSemesterRestriction(courseDef?.semesterRuleMode, courseDef?.allowedSemesters);
    const assignmentRestrictionReason = getAssignedSemesterRestrictionReason(courseDef, normalizedStudentSemester);
    if (assignmentRestrictionReason) {
        reasons.push(assignmentRestrictionReason);
    }
    const courseSemester = parseInt(courseDef?.semester, 10);
    const allowBothParity = String(courseDef?.parityMode || courseDef?.semesterParity || '').toLowerCase() === 'both';

    if (assignmentRestriction.semesterRuleMode === 'all' && !allowBothParity && Number.isFinite(courseSemester) && courseSemester > 0) {
        const isParityMismatch = (normalizedStudentSemester % 2) !== (courseSemester % 2);
        if (isParityMismatch) {
            const expectedParity = courseSemester % 2 === 0 ? 'even' : 'odd';
            reasons.push(`Restricted to ${expectedParity}-semester students only.`);
        }
    }

    const requiredCourseIds = parseRequiredCourseIds(courseDef?.cond);
    if (requiredCourseIds.length > 0) {
        const missing = requiredCourseIds.filter(reqId => !passedCourseSet.has(canonicalCourseKey(reqId)));
        if (missing.length > 0) {
            reasons.push(`Prerequisite course(s) not completed: ${missing.join(', ')}`);
        }
    }

    const antiCourseIds = parseRequiredCourseIds(courseDef?.antireq);
    if (antiCourseIds.length > 0) {
        const blocked = antiCourseIds.filter(reqId => passedCourseSet.has(canonicalCourseKey(reqId)));
        if (blocked.length > 0) {
            reasons.push(`Anti-requisite restriction: ${blocked.join(', ')}`);
        }
    }

    return { allowed: reasons.length === 0, reasons };
}

function parseEctsProgress(rawValue, fallbackMax = 0) {
    const text = String(rawValue || '').trim();
    if (!text) return { max: Number(fallbackMax) || 0, completed: 0 };

    const parts = text.includes('/') ? text.split('/') : text.includes('-') ? text.split('-') : [text];
    const max = parseInt(parts[0], 10);
    const completed = parseInt(parts[1], 10);

    return {
        max: Number.isFinite(max) ? max : (Number(fallbackMax) || 0),
        completed: Number.isFinite(completed) ? completed : 0
    };
}

function formatEctsProgress(max, completed = 0) {
    const safeMax = Number.isFinite(Number(max)) ? Number(max) : 0;
    const safeCompleted = Number.isFinite(Number(completed)) ? Number(completed) : 0;
    return `${safeMax}/${safeCompleted}`;
}

function closeStructuredFormModal() {
    if (typeof window.__kiuStructuredFormCleanup === 'function') {
        window.__kiuStructuredFormCleanup();
        window.__kiuStructuredFormCleanup = null;
    }
    const existing = document.getElementById('kiu-structured-form-modal');
    if (existing) existing.remove();
}

function escapeHtml(value) {
    const normalized = typeof toEnglishText === 'function'
        ? toEnglishText(value)
        : String(value == null ? '' : value);
    return String(normalized)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function jsQuote(value) {
    return `'${String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toPositiveInt(value, fallback = 0) {
    const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function buildStructuredFormFieldNode(field) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'display:flex; flex-direction:column; gap:6px;';

    const id = field.name;
    const label = document.createElement('label');
    label.htmlFor = id;
    label.style.cssText = 'font-size:11px; font-weight:800; color:#60728d; text-transform:uppercase; letter-spacing:0.04em;';
    label.textContent = field.label || field.name;
    wrapper.appendChild(label);

    let control;
    if (field.type === 'textarea') {
        control = document.createElement('textarea');
        control.rows = field.rows || 3;
        control.style.cssText = `width:100%; resize:vertical; min-height:96px; padding:14px 15px; border:1px solid rgba(16,32,56,0.1); border-radius:16px; background:${field.readonly || field.disabled ? 'rgba(241,245,249,0.95)' : 'rgba(255,255,255,0.9)'}; color:#102038; font:inherit; outline:none; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5);`;
        control.value = field.value == null ? '' : String(field.value);
    } else if (field.type === 'select') {
        control = document.createElement('select');
        control.style.cssText = `width:100%; min-height:50px; padding:14px 15px; border:1px solid rgba(16,32,56,0.1); border-radius:16px; background:${field.disabled ? 'rgba(241,245,249,0.95)' : 'rgba(255,255,255,0.9)'}; color:#102038; font:inherit; outline:none; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5);`;
        (field.options || []).forEach((opt) => {
            const option = document.createElement('option');
            option.value = String(opt.value);
            option.textContent = String(opt.label);
            option.selected = String(opt.value) === String(field.value);
            control.appendChild(option);
        });
    } else {
        control = document.createElement('input');
        control.type = field.type || 'text';
        control.style.cssText = `width:100%; min-height:50px; padding:14px 15px; border:1px solid rgba(16,32,56,0.1); border-radius:16px; background:${field.readonly || field.disabled ? 'rgba(241,245,249,0.95)' : 'rgba(255,255,255,0.9)'}; color:#102038; font:inherit; outline:none; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5);`;
        control.value = field.value == null ? '' : String(field.value);
        if (field.min != null) control.min = String(field.min);
        if (field.max != null) control.max = String(field.max);
        if (field.step != null) control.step = String(field.step);
    }

    control.id = id;
    control.name = id;
    if (field.placeholder) control.placeholder = String(field.placeholder);
    if (field.readonly) control.readOnly = true;
    if (field.disabled) control.disabled = true;
    wrapper.appendChild(control);

    if (field.help) {
        const help = document.createElement('div');
        help.style.cssText = 'margin-top:6px; font-size:11px; color:#8aa0bc;';
        help.textContent = String(field.help);
        wrapper.appendChild(help);
    }

    return wrapper;
}

function openStructuredFormModal(config) {
    closeStructuredFormModal();

    const fields = config.fields || [];
    const modal = document.createElement('div');
    modal.id = 'kiu-structured-form-modal';
    modal.style.cssText = 'position:fixed; inset:0; z-index:8000; display:flex; align-items:center; justify-content:center; padding:20px; background:rgba(8,15,28,0.62); backdrop-filter:blur(12px);';

    const card = document.createElement('div');
    card.style.cssText = 'width:min(94vw, 720px); max-height:92vh; overflow:hidden; border-radius:30px; background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,247,252,0.98)); border:1px solid rgba(255,255,255,0.7); box-shadow:0 34px 90px rgba(2,6,23,0.35); display:flex; flex-direction:column;';

    const header = document.createElement('div');
    header.style.cssText = 'padding:24px 26px; background:linear-gradient(135deg, #0f1e33 0%, #16375d 52%, #0b84ff 100%); color:white; display:flex; justify-content:space-between; gap:16px; align-items:flex-start;';
    const headerCopy = document.createElement('div');
    const headerTitle = document.createElement('div');
    headerTitle.style.cssText = 'font-size:18px; font-weight:900; letter-spacing:-0.03em;';
    headerTitle.textContent = config.title || 'Edit Item';
    const headerSubtitle = document.createElement('div');
    headerSubtitle.style.cssText = 'font-size:12px; color:rgba(255,255,255,0.76); margin-top:4px;';
    headerSubtitle.textContent = config.subtitle || 'Fill in the details below.';
    headerCopy.append(headerTitle, headerSubtitle);
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.id = 'kiu-structured-form-close';
    closeBtn.style.cssText = 'width:40px; height:40px; border-radius:14px; border:1px solid rgba(255,255,255,0.18); background:rgba(255,255,255,0.08); color:white; cursor:pointer; font-size:20px; line-height:1;';
    closeBtn.textContent = '×';
    header.append(headerCopy, closeBtn);

    const form = document.createElement('form');
    form.id = 'kiu-structured-form';
    form.style.cssText = 'display:flex; flex-direction:column; min-height:0;';
    const body = document.createElement('div');
    body.style.cssText = 'padding:24px 26px; overflow:auto;';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;';
    fields.forEach((field) => grid.appendChild(buildStructuredFormFieldNode(field)));
    body.appendChild(grid);
    const footer = document.createElement('div');
    footer.style.cssText = 'padding:18px 26px 26px; border-top:1px solid rgba(16,32,56,0.06); background:rgba(248,250,253,0.92); display:flex; gap:12px; justify-content:flex-end; align-items:center;';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.id = 'kiu-structured-form-cancel';
    cancelBtn.className = 'kiu-btn-outline';
    cancelBtn.style.cssText = 'padding:12px 18px; font-size:13px;';
    cancelBtn.textContent = 'Cancel';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'kiu-btn-blue';
    submitBtn.style.cssText = 'padding:12px 18px; font-size:13px;';
    submitBtn.textContent = config.submitLabel || 'Save';
    footer.append(cancelBtn, submitBtn);
    form.append(body, footer);
    card.append(header, form);
    modal.appendChild(card);
    document.body.appendChild(modal);

    const onKeyDown = (event) => {
        if (event.key === 'Escape') close();
    };
    const close = () => closeStructuredFormModal();
    window.__kiuStructuredFormCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    if (closeBtn) closeBtn.onclick = close;
    if (cancelBtn) cancelBtn.onclick = close;
    window.addEventListener('keydown', onKeyDown);
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
    }

    if (form) {
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const values = {};
            fields.forEach(field => {
                const el = document.getElementById(field.name);
                values[field.name] = el ? el.value : '';
            });
            if (typeof config.onSave === 'function') {
                config.onSave(values, close);
            } else {
                close();
            }
        });
    }

    setTimeout(() => {
        const firstField = modal?.querySelector('input, textarea, select');
        if (firstField && typeof firstField.focus === 'function') firstField.focus();
    }, 0);
}

function getCourseEctsValue(course) {
    const direct = Number(course?.ects);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const parsed = parseInt(String(course?.ects || '').match(/\d+/)?.[0] || '0', 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

window.STUDENT_REGISTRATION_GRADEBOOK_CRITERIA = window.STUDENT_REGISTRATION_GRADEBOOK_CRITERIA || {
    quiz: { key: 'quiz', legacyKey: 'q1', aggregateMode: 'sum', maxScore: 10 },
    homework: { key: 'homework', legacyKey: 'qa', aggregateMode: 'average', maxScore: 100 },
    midterm: { key: 'midterm', legacyKey: 'mid', aggregateMode: 'sum', maxScore: 100 },
    final: { key: 'final', legacyKey: 'final', aggregateMode: 'sum', maxScore: 100 },
    retake: { key: 'retake', legacyKey: 'retake', aggregateMode: 'sum', maxScore: 100 }
};
var STUDENT_REGISTRATION_GRADEBOOK_CRITERIA = window.STUDENT_REGISTRATION_GRADEBOOK_CRITERIA;

function getStudentRegistrationGradebookCriterionMeta(criterionKey) {
    return STUDENT_REGISTRATION_GRADEBOOK_CRITERIA[String(criterionKey || '').trim()] || {
        key: String(criterionKey || '').trim(),
        legacyKey: null,
        aggregateMode: 'average',
        maxScore: 100
    };
}

function normalizeStudentRegistrationAssessmentNumber(value, fallback = 1) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sortStudentRegistrationAssessmentEntries(entries = []) {
    return [...entries].sort((a, b) => normalizeStudentRegistrationAssessmentNumber(a?.number, 1) - normalizeStudentRegistrationAssessmentNumber(b?.number, 1));
}

function aggregateStudentRegistrationAssessmentEntries(entries = [], mode = 'average') {
    const scores = (entries || []).reduce((list, entry) => {
        const numericScore = Number(entry?.score);
        if (Number.isFinite(numericScore)) list.push(numericScore);
        return list;
    }, []);
    if (!scores.length) return 0;
    if (mode === 'sum') return Math.min(100, Math.round(scores.reduce((sum, score) => sum + score, 0)));
    if (mode === 'latest') return scores[scores.length - 1];
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function ensureStudentRegistrationGradeRecordHistories(record = {}) {
    const safeRecord = { ...(record || {}) };
    safeRecord.assessments = safeRecord.assessments && typeof safeRecord.assessments === 'object'
        ? { ...safeRecord.assessments }
        : {};

    Object.values(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA).forEach((meta) => {
        let entries = Array.isArray(safeRecord.assessments[meta.key]) ? safeRecord.assessments[meta.key] : [];
        entries = entries
            .filter((entry) => entry && typeof entry === 'object')
            .map((entry, index) => ({
                ...entry,
                number: normalizeStudentRegistrationAssessmentNumber(entry.number, index + 1),
                score: Number.isFinite(Number(entry.score)) ? Number(entry.score) : null,
                history: Array.isArray(entry.history) ? entry.history.filter((item) => item && typeof item === 'object') : []
            }));

        if (!entries.length && Number.isFinite(Number(safeRecord[meta.legacyKey])) && Number(safeRecord[meta.legacyKey]) > 0) {
            entries.push({
                number: 1,
                score: Number(safeRecord[meta.legacyKey]),
                updatedAt: safeRecord.updatedAt || null,
                updatedBy: safeRecord.updatedBy || null,
                history: []
            });
        }

        safeRecord.assessments[meta.key] = sortStudentRegistrationAssessmentEntries(entries);
        if (meta.legacyKey) {
            safeRecord[meta.legacyKey] = aggregateStudentRegistrationAssessmentEntries(safeRecord.assessments[meta.key], meta.aggregateMode);
        }
    });

    return safeRecord;
}

function getStudentRegistrationAssessmentDisplayValue(record, meta) {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const entries = sortStudentRegistrationAssessmentEntries(safeRecord.assessments?.[meta?.key] || []);
    if (entries.length) {
        return aggregateStudentRegistrationAssessmentEntries(entries, meta?.aggregateMode || 'average');
    }
    if (meta?.legacyKey && Number.isFinite(Number(safeRecord?.[meta.legacyKey]))) {
        return Number(safeRecord[meta.legacyKey]);
    }
    return 0;
}

function getStudentEffectiveFinalRetakeScore(record) {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const finalScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final) || safeRecord.final || 0);
    const retakeScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake) || safeRecord.retake || 0);
    return Math.max(finalScore, retakeScore);
}

function getGradebookWeightProfile(rosterId = '') {
    if (typeof getGradebookWeightProfileForRoster === 'function') {
        return getGradebookWeightProfileForRoster(rosterId);
    }
    const q1 = Number(document.getElementById('weight-q1')?.value || 10) / 100;
    const qa = Number(document.getElementById('weight-qa')?.value || 10) / 100;
    const mid = Number(document.getElementById('weight-mid')?.value || 30) / 100;
    const fin = Number(document.getElementById('weight-fin')?.value || 50) / 100;
    return {
        q1: Number.isFinite(q1) ? q1 : 0.10,
        qa: Number.isFinite(qa) ? qa : 0.10,
        mid: Number.isFinite(mid) ? mid : 0.30,
        fin: Number.isFinite(fin) ? fin : 0.50
    };
}

function getGradeRecordCombinedKiuPassScore(record, rosterId = '') {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const weights = getGradebookWeightProfile(rosterId);
    const toWeightedPercentPoints = (meta, value, weightFraction) => {
        const numericValue = Number(value || 0);
        const maxScore = Math.max(1, Number(meta?.maxScore || 100));
        return Math.max(0, Math.min(1, numericValue / maxScore)) * (weightFraction * 100);
    };
    const quizMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.quiz.key);
    const homeworkMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.homework.key);
    const midtermMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.midterm.key);
    const finalMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final.key);
    const retakeMeta = getStudentRegistrationGradebookCriterionMeta(STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake.key);
    const preFinalScore = toWeightedPercentPoints(quizMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.quiz), weights.q1)
        + toWeightedPercentPoints(homeworkMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.homework), weights.qa)
        + toWeightedPercentPoints(midtermMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.midterm), weights.mid);
    const finalCombined = preFinalScore + toWeightedPercentPoints(finalMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final) || safeRecord.final || 0, weights.fin);
    const retakeCombined = preFinalScore + toWeightedPercentPoints(retakeMeta, getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake) || safeRecord.retake || 0, weights.fin);
    return Math.max(finalCombined, retakeCombined);
}

function isGradeRecordPassedByKiuRule(record, rosterId = '') {
    const safeRecord = ensureStudentRegistrationGradeRecordHistories(record || {});
    const finalScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.final) || safeRecord.final || 0);
    const retakeScore = Number(getStudentRegistrationAssessmentDisplayValue(safeRecord, STUDENT_REGISTRATION_GRADEBOOK_CRITERIA.retake) || safeRecord.retake || 0);
    const hasExamOutcome = finalScore > 0 || retakeScore > 0;
    return hasExamOutcome && getGradeRecordCombinedKiuPassScore(safeRecord, rosterId) >= 51;
}

function getStudentPassedCourseSet(studentId) {
    const passed = new Set();
    const add = (courseId) => {
        const key = canonicalCourseKey(courseId);
        if (key) passed.add(key);
    };

    (KIU_STATE.studentPassedCourses?.[studentId] || []).forEach(add);

    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
        const record = (roster || []).find(entry => String(entry.id) === String(studentId));
        if (!record) return;
        if (!isGradeRecordPassedByKiuRule(record, rosterId)) return;

        const subjectList = [
            ...Object.keys(KIU_STATE.facultyProfiles || {}).flatMap(fac => getActiveCurriculum(fac) || []),
            ...(KIU_STATE.curriculum || [])
        ];
        const resolved = resolveSubjectIdFromRosterId(rosterId, subjectList);
        if (resolved) add(resolved);
    });

    return passed;
}

function getStudentCompletedEctsForCourseIds(studentId, courseIds, preferredFaculty = null) {
    const passed = getStudentPassedCourseSet(studentId);
    return (courseIds || []).reduce((sum, courseRef) => {
        const courseId = typeof courseRef === 'string' ? courseRef : (courseRef?.id || courseRef?.n || courseRef?.courseId || '');
        const course = getCourseByIdForRegistration(courseId, preferredFaculty);
        if (!course) return sum;
        return passed.has(canonicalCourseKey(courseId)) ? sum + getCourseEctsValue(course) : sum;
    }, 0);
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

function getAssignedCourseEctsTotal(courses) {
    return (courses || []).reduce((sum, course) => sum + getCourseEctsValue(course), 0);
}

function parseAllowedSemesterList(rawValue) {
    const text = String(rawValue || '').trim();
    if (!text) return [];

    return [...new Set(
        text
            .split(/[^0-9]+/)
            .map(part => parseInt(part, 10))
            .filter(value => Number.isFinite(value) && value > 0)
    )].sort((a, b) => a - b);
}

function normalizeAssignedSemesterRestriction(mode, allowedSemesters) {
    const normalizedMode = ['all', 'odd', 'even', 'specific'].includes(String(mode || '').toLowerCase())
        ? String(mode || '').toLowerCase()
        : 'all';
    const parsedSemesters = parseAllowedSemesterList(allowedSemesters);

    if (normalizedMode === 'specific') {
        if (parsedSemesters.length === 0) {
            return { semesterRuleMode: 'all', allowedSemesters: '' };
        }
        return {
            semesterRuleMode: 'specific',
            allowedSemesters: parsedSemesters.join(', ')
        };
    }

    return {
        semesterRuleMode: normalizedMode,
        allowedSemesters: ''
    };
}

function getAssignedSemesterRestrictionLabel(item) {
    const restriction = normalizeAssignedSemesterRestriction(item?.semesterRuleMode, item?.allowedSemesters);
    if (restriction.semesterRuleMode === 'odd') return 'Odd semesters only';
    if (restriction.semesterRuleMode === 'even') return 'Even semesters only';
    if (restriction.semesterRuleMode === 'specific') return `Semesters: ${restriction.allowedSemesters}`;
    return '';
}

function getAssignedSemesterRestrictionReason(item, studentSemester) {
    const normalizedSemester = Number.isFinite(studentSemester) ? studentSemester : parseInt(studentSemester, 10);
    if (!Number.isFinite(normalizedSemester) || normalizedSemester <= 0) return '';

    const restriction = normalizeAssignedSemesterRestriction(item?.semesterRuleMode, item?.allowedSemesters);
    if (restriction.semesterRuleMode === 'all') return '';

    if (restriction.semesterRuleMode === 'odd') {
        return normalizedSemester % 2 === 1 ? '' : 'Restricted to odd-semester students only';
    }

    if (restriction.semesterRuleMode === 'even') {
        return normalizedSemester % 2 === 0 ? '' : 'Restricted to even-semester students only';
    }

    const allowedSemesters = parseAllowedSemesterList(restriction.allowedSemesters);
    return allowedSemesters.includes(normalizedSemester)
        ? ''
        : `Restricted to semesters: ${allowedSemesters.join(', ')}`;
}

function getAssignedCourseId(courseRef) {
    if (typeof courseRef === 'string') return courseRef;
    return String(courseRef?.sourceCourseId || courseRef?.courseId || courseRef?.id || courseRef?.n || '').trim();
}

function buildRegistrationCourseMeta(courseRef, preferredFaculty = null) {
    const courseId = getAssignedCourseId(courseRef);
    const cleanText = value => {
        const normalized = typeof toEnglishText === 'function' ? toEnglishText(value) : value;
        return String(normalized == null ? '' : normalized).trim();
    };
    const courseTitle = typeof courseRef === 'string' ? '' : cleanText(courseRef?.title || courseRef?.name || '');
    const libraryCourse = getCourseByIdForRegistration(courseId, preferredFaculty, courseTitle);
    const baseCourse = libraryCourse || {
        id: courseId,
        name: cleanText(courseTitle || courseId),
        ects: courseRef?.ects || 0,
        semester: null,
        cond: cleanText(courseRef?.precondition || courseRef?.prerequisites || 'None') || 'None',
        antireq: 'None'
    };

    if (!courseRef || typeof courseRef === 'string') return baseCourse;

    return {
        ...baseCourse,
        id: courseId || baseCourse.id,
        name: cleanText(courseRef.title || courseRef.name || baseCourse.name),
        ects: courseRef.ects || baseCourse.ects,
        cond: cleanText(libraryCourse?.cond ?? courseRef.precondition ?? courseRef.prerequisites ?? baseCourse.cond) || 'None',
        antireq: cleanText(libraryCourse?.antireq ?? courseRef.antireq ?? baseCourse.antireq) || 'None',
        semester: libraryCourse?.semester ?? courseRef.semester ?? baseCourse.semester,
        sourceCourseId: libraryCourse?.id || courseRef.sourceCourseId || courseId || '',
        semesterRuleMode: courseRef.semesterRuleMode || '',
        allowedSemesters: courseRef.allowedSemesters || '',
        lectureCapacity: courseRef.lectureCapacity || '',
        seminarCapacity: courseRef.seminarCapacity || ''
    };
}

function getAssignedCourseCurriculumDetails(item, preferredFaculty = null) {
    const meta = buildRegistrationCourseMeta(item, preferredFaculty);
    const prerequisite = meta?.cond && String(meta.cond).trim() && String(meta.cond).trim().toLowerCase() !== 'none'
        ? String(meta.cond).trim()
        : 'None';
    const antiRequisite = meta?.antireq && String(meta.antireq).trim() && String(meta.antireq).trim().toLowerCase() !== 'none'
        ? String(meta.antireq).trim()
        : '';
    const semesterNumber = parseInt(meta?.semester, 10);
    const curriculumSemester = Number.isFinite(semesterNumber) && semesterNumber > 0
        ? `Curriculum semester: ${semesterNumber}`
        : '';

    return {
        prerequisite,
        antiRequisite,
        curriculumSemester,
        studentAccess: getAssignedSemesterRestrictionLabel(item)
    };
}

function getAssignedCourseCurriculumSummary(item, preferredFaculty = null) {
    const details = getAssignedCourseCurriculumDetails(item, preferredFaculty);
    const lines = [`Prerequisite: ${details.prerequisite}`];
    if (details.antiRequisite) lines.push(`Anti-requisite: ${details.antiRequisite}`);
    if (details.curriculumSemester) lines.push(details.curriculumSemester);
    return lines.join('\n');
}

function getSemesterRestrictionFieldConfig(item = {}) {
    const restriction = normalizeAssignedSemesterRestriction(item?.semesterRuleMode, item?.allowedSemesters);
    return [
        {
            name: 'semesterRuleMode',
            label: 'Student Semester Access',
            type: 'select',
            value: restriction.semesterRuleMode,
            options: [
                { value: 'all', label: 'All semesters' },
                { value: 'odd', label: 'Odd semesters only' },
                { value: 'even', label: 'Even semesters only' },
                { value: 'specific', label: 'Specific semesters' }
            ],
            help: 'Use this to restrict who can register for this assigned subject.'
        },
        {
            name: 'allowedSemesters',
            label: 'Allowed Semester Numbers',
            value: restriction.allowedSemesters,
            placeholder: 'e.g. 1, 3, 5',
            help: 'Only used when "Specific semesters" is selected.'
        }
    ];
}

function getTrackGroupProgress(group, completedOverride = null) {
    const rawProgress = parseEctsProgress(group?.ects || `${group?.maxEcts || 0}/0`, group?.maxEcts || 0);
    const max = Number(group?.maxEcts ?? rawProgress.max ?? 0) || 0;
    const completed = completedOverride == null
        ? Number(group?.completedEcts ?? rawProgress.completed ?? 0) || 0
        : Number(completedOverride) || 0;
    return { max, completed, label: formatEctsProgress(max, completed) };
}

function renderStudentRegModulesAdvanced(modules, fac, options = {}) {
    if (!modules || modules.length === 0) return `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">No mapping found.</td></tr>`;
    
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
        <tbody id="mod-group-${mod.id}" data-mod-id="${mod.id}">
            <!-- Parent Module Row -->
            <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0; color:#334155; font-size:13px; cursor:pointer;" data-student-mod-toggle="${escapeHtml(mod.id)}">
                <td style="text-align:center; padding:10px 8px; border-right:1px solid #e2e8f0;"><i class="fas fa-chevron-down" id="icon-${mod.id}" style="color:#64748b;"></i></td>
                <td style="text-align:center; padding:10px 8px; border-right:1px solid #e2e8f0; font-weight:700;">
                    ${mod.letter || 'A'} <span style="font-weight:normal; color:#64748b;">(${mod.id})</span>
                </td>
                <td style="padding:10px 15px; border-right:1px solid #e2e8f0; text-align:left;">${mod.name}</td>
                <td style="text-align:center; padding:10px 8px; border-right:1px solid #e2e8f0; font-weight:700; color:#ea580c;">${ectsLabel}</td>
                <td style="padding:10px 15px; border-right:1px solid #e2e8f0;"></td>
                <td style="text-align:center; padding:10px 8px;"></td>
            </tr>
        </tbody>
        <tbody id="mod-items-${mod.id}">
        `;
        
        if ((mod.courses || []).length === 0) {
            rows += `
            <tr style="border-bottom:1px solid #e2e8f0; font-size:12px;">
                <td colspan="6" style="padding:15px; text-align:center; color:#94a3b8; font-style:italic;">-- Empty Module --</td>
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
                    ? `<div style="margin-top:4px; color:#2563eb; font-size:10px; font-weight:700;">${escapeHtml(semesterRestrictionLabel)}</div>`
                    : '';
                const restrictionText = eligibility.reasons.length > 0
                    ? `<div style="margin-top:4px; color:#dc2626; font-size:10px; font-weight:600;">${escapeHtml(eligibility.reasons.join(' / '))}</div>`
                    : '';
                
                let actionHTML = '';
                let statusIcon = '';
                
                if (!isSelected && !eligibility.allowed) {
                    statusIcon = `<i class="fas fa-times" style="color:#ef4444; font-size:18px;"></i>`;
                    actionHTML = `<button class="kiu-btn-outline" style="color:#94a3b8; border-color:#e2e8f0; cursor:not-allowed;" disabled><i class="fas fa-lock"></i> Locked</button>`;
                } else if (isSelected) {
                    statusIcon = `<i class="fas fa-check" style="color:#10b981; font-size:18px;"></i>`;
                    actionHTML = ``; 
                } else {
                    statusIcon = `<div style="width:18px; height:18px; border:2px solid #cbd5e1; border-radius:3px; display:inline-block;"></div>`;
                    actionHTML = `<button type="button" class="kiu-btn-blue" data-student-toggle-course="${escapeHtml(courseId)}">Add</button>`;
                }
                
                return `
                <tr style="border-bottom:1px solid #f1f5f9; font-size:12px; background:white;">
                    <td style="text-align:center; padding:10px 8px; border-right:1px solid #f1f5f9;">${statusIcon}</td>
                    <td style="text-align:center; padding:10px 8px; border-right:1px solid #f1f5f9; color:#64748b;">${i+1}</td>
                    <td style="padding:10px 15px; border-right:1px solid #f1f5f9; text-align:left;">${escapeHtml(courseDef.name)}</td>
                    <td style="text-align:center; padding:10px 8px; border-right:1px solid #f1f5f9;">${courseDef.ects}</td>
                    <td style="padding:10px 15px; border-right:1px solid #f1f5f9; color:#64748b; font-size:11px; text-align:left;">${escapeHtml(condText)}${restrictionMeta}${restrictionText}</td>
                    <td style="text-align:center; padding:10px 8px;">${actionHTML}</td>
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

const studentCourseSectionPickerState = {
    courseId: null,
    courseName: '',
    activeType: 'lecture'
};

function getStudentSectionTypeLabel(sessionType) {
    const normalized = String(sessionType || '').trim().toLowerCase();
    if (normalized === 'seminar') return 'Seminar';
    if (normalized === 'workshop') return 'Workshop';
    if (normalized === 'lab') return 'Lab';
    return 'Lecture';
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
    if (modal) modal.remove();
}

function buildStudentCourseSectionActionButton(courseId, group, selected, isFull) {
    const button = document.createElement('button');
    if (selected) {
        button.className = 'kiu-btn-outline';
        button.disabled = true;
        button.style.cssText = 'padding:8px 12px; font-size:11px; color:#047857; border-color:#86efac;';
        button.textContent = 'Selected';
        return button;
    }
    if (isFull) {
        button.className = 'kiu-btn-outline';
        button.disabled = true;
        button.style.cssText = 'padding:8px 12px; font-size:11px; color:#94a3b8; border-color:#cbd5e1; cursor:not-allowed;';
        button.textContent = 'Full';
        return button;
    }
    button.type = 'button';
    button.className = 'kiu-btn-blue';
    button.style.cssText = 'padding:8px 12px; font-size:11px;';
    button.dataset.studentCourseSectionChoose = escapeHtml(courseId);
    button.dataset.studentCourseSectionGroup = escapeHtml(group.id);
    button.textContent = 'Choose';
    return button;
}

function buildStudentCourseSectionPickerEmptyState(message) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:26px; text-align:center; color:#64748b; background:#f8fafc; border:1px dashed #dbe5f1; border-radius:16px;';
    empty.textContent = message;
    return empty;
}

function openStudentCourseSectionPicker(courseId, courseName = '') {
    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return;

    studentCourseSectionPickerState.courseId = normalizedCourseId;
    studentCourseSectionPickerState.courseName = String(courseName || normalizedCourseId).trim();
    const groups = getStudentCoursePickerGroups(normalizedCourseId, studentCourseSectionPickerState.courseName);
    const preferredType = groups.some(group => String(group.sessionType || 'lecture').toLowerCase() === 'lecture')
        ? 'lecture'
        : (groups[0]?.sessionType || 'lecture');
    studentCourseSectionPickerState.activeType = String(preferredType || 'lecture').toLowerCase();

    closeStudentCourseSectionPicker();
    const modal = document.createElement('div');
    modal.id = 'student-course-section-picker-modal';
    modal.className = 'registration-section-picker-backdrop';
    modal.style.cssText = 'position:fixed; inset:0; z-index:100000; display:flex; align-items:center; justify-content:center; padding:22px; background:rgba(15,23,42,0.56); backdrop-filter:blur(10px);';
    const dialog = document.createElement('div');
    dialog.className = 'registration-section-picker-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Choose course section');
    dialog.style.cssText = 'width:min(980px,100%); max-height:min(760px,92vh); overflow:auto; background:var(--kiu-solid-white,#fff); border-radius:24px; box-shadow:0 30px 80px rgba(15,23,42,0.28); border:1px solid rgba(226,232,240,0.9);';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:flex-start; justify-content:space-between; gap:14px; padding:22px 24px; border-bottom:1px solid #e5edf6;';
    const headingWrap = document.createElement('div');
    const kicker = document.createElement('div');
    kicker.style.cssText = 'font-size:12px; font-weight:900; color:#64748b; text-transform:uppercase; letter-spacing:.12em;';
    kicker.textContent = 'Section picker';
    const heading = document.createElement('h2');
    heading.style.cssText = 'margin:6px 0 0; font-size:22px; line-height:1.2; color:var(--kiu-navy,#0f172a);';
    heading.textContent = 'Choose subject section';
    const subheading = document.createElement('p');
    subheading.style.cssText = 'margin:8px 0 0; font-size:13px; color:#64748b;';
    subheading.textContent = 'Select the lecture or seminar group published by the scheduler.';
    headingWrap.append(kicker, heading, subheading);
    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.dataset.studentCourseSectionClose = '1';
    closeButton.setAttribute('aria-label', 'Close section picker');
    closeButton.className = 'kiu-btn-outline';
    closeButton.style.cssText = 'width:40px; height:40px; padding:0; border-radius:14px;';
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeButton.appendChild(closeIcon);
    header.append(headingWrap, closeButton);

    const content = document.createElement('div');
    content.dataset.role = 'student-course-section-picker-content';
    content.style.cssText = 'padding:22px 24px;';

    dialog.append(header, content);
    modal.appendChild(dialog);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeStudentCourseSectionPicker();
    });
    document.body.appendChild(modal);
    renderStudentCourseSectionPicker();
}

function setStudentCourseSectionType(type) {
    studentCourseSectionPickerState.activeType = String(type || 'lecture').toLowerCase();
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
    const activeType = groupedByType[studentCourseSectionPickerState.activeType]?.length > 0
        ? studentCourseSectionPickerState.activeType
        : fallbackType;
    studentCourseSectionPickerState.activeType = activeType;

    const currentUser = getCurrentUser();
    const activeFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
    const currentSchedule = currentUser
        ? normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[currentUser.id])
            .filter(item => {
                const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
                const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
                return entryFaculty === activeFaculty;
            })
        : [];
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
    header.style.cssText = 'display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:16px;';
    const titleWrap = document.createElement('div');
    const title = document.createElement('div');
    title.style.cssText = 'font-size:15px; font-weight:800; color:var(--kiu-navy);';
    title.textContent = courseName;
    const subtitle = document.createElement('div');
    subtitle.style.cssText = 'font-size:12px; color:#64748b; margin-top:4px;';
    subtitle.textContent = `Type: ${getStudentSectionTypeLabel(activeType)}`;
    titleWrap.append(title, subtitle);
    const typeButtons = document.createElement('div');
    typeButtons.style.cssText = 'display:flex; gap:8px;';
    availableTypes.forEach((type) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.studentCourseSectionType = type;
        button.className = type === activeType ? 'kiu-btn-blue' : 'kiu-btn-outline';
        button.style.cssText = 'padding:8px 14px; font-size:12px;';
        button.textContent = getStudentSectionTypeLabel(type);
        typeButtons.appendChild(button);
    });
    header.append(titleWrap, typeButtons);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(header);

    if (groups.length === 0) {
        fragment.appendChild(buildStudentCourseSectionPickerEmptyState('No teaching sections have been published for this subject yet.'));
    } else if ((groupedByType[activeType] || []).length === 0) {
        fragment.appendChild(buildStudentCourseSectionPickerEmptyState(`No ${getStudentSectionTypeLabel(activeType).toLowerCase()} sections are available for this subject yet.`));
    } else {
        const tableWrap = document.createElement('div');
        tableWrap.style.cssText = 'overflow:auto; border:1px solid #dbe5f1; border-radius:16px; background:white; box-shadow:0 12px 30px rgba(15,23,42,0.08);';
        const table = document.createElement('table');
        table.style.cssText = 'width:100%; border-collapse:collapse; font-size:12px;';
        const thead = document.createElement('thead');
        thead.style.cssText = 'background:#f8fbff; color:#334155;';
        const headRow = document.createElement('tr');
        [
            ['Day', 'text-align:left;'],
            ['Hours', ''],
            ['Room', ''],
            ['Free', ''],
            ['Professor', 'text-align:left;'],
            ['Duration', ''],
            ['Group', ''],
            ['Action', 'text-align:right;']
        ].forEach(([label, extraStyle]) => {
            const th = document.createElement('th');
            th.style.cssText = `padding:12px 10px;${extraStyle}`;
            th.textContent = label;
            headRow.appendChild(th);
        });
        thead.appendChild(headRow);
        const tbody = document.createElement('tbody');
        rows.forEach(({ group, freeSeats, selected, isFull }) => {
            const row = document.createElement('tr');
            row.style.cssText = 'border-bottom:1px solid #e5edf6;';
            [
                [toEnglishText(group.day || 'TBD'), 'text-align:left;'],
                [group.time || 'TBD', ''],
                [group.room || 'TBD', ''],
                [String(freeSeats), 'text-align:center;'],
                [toEnglishText(group.prof || 'Unassigned'), 'text-align:left;'],
                [group.duration || '110min', ''],
                [group.name || group.id || '', '']
            ].forEach(([value, extraStyle]) => {
                const td = document.createElement('td');
                td.style.cssText = `padding:12px 10px;${extraStyle}`;
                td.textContent = value;
                row.appendChild(td);
            });
            const actionCell = document.createElement('td');
            actionCell.style.cssText = 'padding:12px 10px; text-align:right;';
            actionCell.appendChild(buildStudentCourseSectionActionButton(courseId, group, selected, isFull));
            row.appendChild(actionCell);
            tbody.appendChild(row);
        });
        table.append(thead, tbody);
        tableWrap.appendChild(table);
        fragment.appendChild(tableWrap);
    }

    content.replaceChildren(fragment);
}

function chooseStudentCourseSection(courseId, groupId) {
    const preferredFaculty = getCurrentFaculty();
    const courseDef = getCourseByIdForRegistration(courseId, preferredFaculty) || { id: courseId, name: courseId };
    const allowedGroup = getStudentCoursePickerGroups(courseId, courseDef.name || courseId)
        .some(group => canonicalCourseKey(group.id || group.groupId || group.name || '') === canonicalCourseKey(groupId));
    if (!allowedGroup) {
        if (typeof showToast === 'function') {
            showToast('This section belongs to another faculty or is no longer available.', 'warning');
        }
        return false;
    }
    const success = selectCourseGroup(courseId, courseDef.name || courseId, groupId);
    if (success !== false) {
        closeStudentCourseSectionPicker();
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

    const chooseSectionTrigger = event.target.closest('[data-student-course-section-choose]');
    if (chooseSectionTrigger) {
        event.preventDefault();
        chooseStudentCourseSection(
            chooseSectionTrigger.getAttribute('data-student-course-section-choose') || '',
            chooseSectionTrigger.getAttribute('data-student-course-section-group') || ''
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
    document.addEventListener('change', handleStudentRegistrationChange);
    window.__studentRegistrationDelegatesBound = true;
}

bindStudentRegistrationDelegates();

window.openStudentCourseSectionPicker = openStudentCourseSectionPicker;
window.closeStudentCourseSectionPicker = closeStudentCourseSectionPicker;
window.renderStudentCourseSectionPicker = renderStudentCourseSectionPicker;
window.setStudentCourseSectionType = setStudentCourseSectionType;
window.chooseStudentCourseSection = chooseStudentCourseSection;
window.toggleCourseSelection = toggleCourseSelection;

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   LMS QUIZ EXPORT â€” PDF & DOCX
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

