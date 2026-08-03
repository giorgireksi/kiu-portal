/* Timetable, schedule-surface, and profile-calendar runtime extracted from planner.js. */

// --- TIMETABLE ENGINE ---
const SCHEDULE_VIEW_STORAGE_KEY_PREFIX = 'KIU_SCHEDULE_VIEW_PREF';
const STUDENT_ADMIN_SCHEDULE_WEEK_STORAGE_KEY = 'KIU_STUDENT_ADMIN_SCHEDULE_WEEK';
const STUDENT_ADMIN_SCHEDULE_VIEW_PREFIX = 'KIU_STUDENT_ADMIN_SCHEDULE_VIEW';
let timetablePageOpenedOnCurrentWeek = false;
const SCHEDULE_SESSION_MARKER_TYPES = {
    quiz: { label: 'Quiz', icon: 'fa-pen-to-square', tone: 'warning' },
    oral_quiz: { label: 'Oral Quiz', icon: 'fa-microphone-lines', tone: 'info' },
    exam: { label: 'Exam', icon: 'fa-file-circle-check', tone: 'danger' },
    presentation: { label: 'Project Presentation', icon: 'fa-person-chalkboard', tone: 'success' },
    project: { label: 'Project Milestone', icon: 'fa-diagram-project', tone: 'success' },
    lab: { label: 'Lab / Practical', icon: 'fa-flask', tone: 'info' },
    deadline: { label: 'Submission Deadline', icon: 'fa-hourglass-end', tone: 'warning' },
    important: { label: 'Important Session', icon: 'fa-star', tone: 'accent' }
};

function normalizeScheduleSessionMarkerType(value) {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    return SCHEDULE_SESSION_MARKER_TYPES[normalized] ? normalized : 'important';
}

function getScheduleSessionMarkerTypeMeta(type) {
    const normalized = normalizeScheduleSessionMarkerType(type);
    return {
        type: normalized,
        ...(SCHEDULE_SESSION_MARKER_TYPES[normalized] || SCHEDULE_SESSION_MARKER_TYPES.important)
    };
}

function scheduleMarkerClassToken(value) {
    return String(value || 'important').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

function ensureScheduleSessionMarkerState() {
    if (!KIU_STATE.lmsSessionMarkers || typeof KIU_STATE.lmsSessionMarkers !== 'object') KIU_STATE.lmsSessionMarkers = {};
    return KIU_STATE.lmsSessionMarkers;
}

function normalizeScheduleMarkerWeekStart(weekStart) {
    return formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
}

function getScheduleMarkerCandidateKeys(item = {}) {
    const courseIds = [
        item.courseId,
        item.subjectId,
        item.courseCode,
        item.id
    ].map(value => String(value || '').trim()).filter(Boolean);
    const groupIds = [
        item.groupId,
        item.baseGroupId,
        item.group,
        item.sectionId,
        item.id,
        item.name,
        item.groupLabel
    ].map(value => String(value || '').trim()).filter(Boolean);
    const keys = new Set();
    courseIds.forEach(courseId => {
        groupIds.forEach(groupId => {
            keys.add(`${courseId}::${groupId}`);
        });
    });
    return [...keys];
}

function getScheduleSessionMarkersForItem(item = {}, weekStart = getCurrentWeekStartISO()) {
    const normalizedWeek = normalizeScheduleMarkerWeekStart(weekStart);
    const markerState = ensureScheduleSessionMarkerState();
    const seen = new Set();
    const markers = [];
    getScheduleMarkerCandidateKeys(item).forEach(key => {
        (Array.isArray(markerState[key]) ? markerState[key] : []).forEach(marker => {
            if (!marker || typeof marker !== 'object') return;
            const markerWeek = normalizeScheduleMarkerWeekStart(marker.weekStart);
            if (markerWeek !== normalizedWeek) return;
            const id = String(marker.id || `${key}_${markerWeek}_${marker.type || 'important'}`);
            if (seen.has(id)) return;
            seen.add(id);
            const typeMeta = getScheduleSessionMarkerTypeMeta(marker.type);
            markers.push({
                ...marker,
                id,
                weekStart: markerWeek,
                type: typeMeta.type,
                typeLabel: typeMeta.label,
                icon: typeMeta.icon,
                tone: typeMeta.tone,
                title: String(marker.title || typeMeta.label || 'Important Session').trim(),
                note: String(marker.note || '').trim()
            });
        });
    });
    return markers.sort((left, right) => {
        const priority = { exam: 1, quiz: 2, oral_quiz: 3, presentation: 4, project: 5, deadline: 6, lab: 7, important: 8 };
        return (priority[left.type] || 99) - (priority[right.type] || 99) || String(left.title || '').localeCompare(String(right.title || ''));
    });
}

function getScheduleViewStorageKey() {
    const currentUser = getCurrentUser();
    const roleKey = String(currentUser?.role || currentUserRole || 'guest');
    const userKey = String(currentUser?.id || currentUser?.email || currentUser?.name || 'anonymous')
        .replace(/[^a-z0-9_-]+/gi, '_')
        .toLowerCase();
    return `${SCHEDULE_VIEW_STORAGE_KEY_PREFIX}_${roleKey}_${userKey}`;
}

function getStoredScheduleView(defaultView = 'sessions', storageKeyOverride = '') {
    const key = storageKeyOverride || getScheduleViewStorageKey();
    const stored = String(localStorage.getItem(key) || '').trim().toLowerCase();
    return stored === 'timetable' ? 'timetable' : (stored === 'sessions' ? 'sessions' : defaultView);
}

function setScheduleViewPreference(view) {
    const normalized = view === 'timetable' ? 'timetable' : 'sessions';
    localStorage.setItem(getScheduleViewStorageKey(), normalized);
    refreshScheduleSurfaces();
}

function getTimetableViewButtonClass(isActive) {
    return `${isActive ? 'lux-primary-btn is-active' : 'lux-secondary-btn'} schedule-view-switcher-btn lux-timetable-view-switcher-btn`;
}

function getTimetableCurrentWeekButtonClass(isCurrent) {
    return `${isCurrent ? 'lux-primary-btn is-active' : 'lux-secondary-btn'} schedule-current-week-btn lux-timetable-current-week-btn`;
}

function refreshScheduleSurfaces() {
    if (document.getElementById('timetable-master-container')) renderTimetable();
    if (typeof refreshFacultyScheduleUI === 'function' && document.getElementById('faculty-schedule-page-list')) {
        refreshFacultyScheduleUI();
    }
    const studentAdminControls = document.getElementById('student-academic-schedule-controls');
    const studentId = studentAdminControls?.dataset?.scheduleStudentId || '';
    if (studentId && typeof renderStudentAdminScheduleEmbed === 'function') {
        renderStudentAdminScheduleEmbed(studentId);
    }
}

function getStudentAdminScheduleWeekKey(studentId) {
    const safeId = String(studentId || '').replace(/[^a-z0-9_-]+/gi, '_');
    return `${STUDENT_ADMIN_SCHEDULE_WEEK_STORAGE_KEY}_${safeId}`;
}

function getStudentAdminScheduleViewKey(studentId) {
    const safeId = String(studentId || 'anonymous').replace(/[^a-z0-9_-]+/gi, '_').toLowerCase();
    return `${STUDENT_ADMIN_SCHEDULE_VIEW_PREFIX}_${safeId}`;
}

function getStoredStudentAdminScheduleView(studentId, defaultView = 'timetable') {
    return getStoredScheduleView(defaultView, getStudentAdminScheduleViewKey(studentId));
}

function setStudentAdminScheduleViewPreference(studentId, view) {
    const normalized = view === 'timetable' ? 'timetable' : 'sessions';
    localStorage.setItem(getStudentAdminScheduleViewKey(studentId), normalized);
    renderStudentAdminScheduleEmbed(studentId);
}

function handlePlannerScheduleSurfaceClick(event) {
    const scopeRoot = event.target.closest('[data-schedule-surface-scope="student-admin"]');
    const scopedStudentId = scopeRoot?.dataset?.scheduleStudentId || '';

    const viewTrigger = event.target.closest('[data-schedule-view]');
    if (viewTrigger) {
        event.preventDefault();
        if (scopedStudentId) {
            setStudentAdminScheduleViewPreference(scopedStudentId, viewTrigger.getAttribute('data-schedule-view'));
            return;
        }
        setScheduleViewPreference(viewTrigger.getAttribute('data-schedule-view'));
        return;
    }

    const shiftTrigger = event.target.closest('[data-timetable-week-shift]');
    if (shiftTrigger) {
        event.preventDefault();
        if (scopedStudentId) {
            const weekKey = getStudentAdminScheduleWeekKey(scopedStudentId);
            const nextWeek = shiftWeekStartISO(
                getStoredWeekStart(weekKey),
                Number(shiftTrigger.getAttribute('data-timetable-week-shift')) || 0
            );
            setStoredWeekStart(weekKey, nextWeek);
            renderStudentAdminScheduleEmbed(scopedStudentId);
            return;
        }
        changeTimetableWeek(Number(shiftTrigger.getAttribute('data-timetable-week-shift')) || 0);
        return;
    }

    const currentWeekTrigger = event.target.closest('[data-schedule-current-week], [data-timetable-action="current-week"]');
    if (currentWeekTrigger) {
        event.preventDefault();
        if (scopedStudentId) {
            setStoredWeekStart(getStudentAdminScheduleWeekKey(scopedStudentId), getCurrentWeekStartISO());
            renderStudentAdminScheduleEmbed(scopedStudentId);
            return;
        }
        jumpTimetableToCurrentWeek();
        return;
    }

    const lmsTrigger = event.target.closest('[data-schedule-open-lms]');
    if (lmsTrigger && typeof queueFacultyLmsSession === 'function') {
        event.preventDefault();
        queueFacultyLmsSession(
            lmsTrigger.getAttribute('data-schedule-course-code') || '',
            lmsTrigger.getAttribute('data-schedule-session-key') || ''
        );
    }
}

function bindPlannerScheduleSurfaceDelegates() {
    if (window.__plannerScheduleSurfaceDelegatesBound) return;
    document.addEventListener('click', handlePlannerScheduleSurfaceClick);
    window.__plannerScheduleSurfaceDelegatesBound = true;
}

bindPlannerScheduleSurfaceDelegates();

function getTimetableWeekStartForRender() {
    if (!timetablePageOpenedOnCurrentWeek) {
        timetablePageOpenedOnCurrentWeek = true;
        return setStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY, getCurrentWeekStartISO());
    }
    return getStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY);
}

function renderScheduleControls(containerId, weekStart, items, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const normalizedWeek = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    const view = getStoredScheduleView(options.defaultView || 'sessions', options.viewStorageKey || '');
    const isCurrent = normalizedWeek === getCurrentWeekStartISO();
    const overview = getScheduleOverview(items);
    const labelId = options.labelId || '';
    const currentButtonId = options.currentButtonId || '';
    const weekLabelMarkup = labelId
        ? `<span id="${labelId}" class="schedule-week-label lux-timetable-week-label">${escapeHtml(formatWeekRangeLabel(normalizedWeek))}</span>`
        : `<span class="schedule-week-label lux-timetable-week-label">${escapeHtml(formatWeekRangeLabel(normalizedWeek))}</span>`;
    const currentButtonMarkup = currentButtonId
        ? `<button type="button" id="${currentButtonId}" class="${getTimetableCurrentWeekButtonClass(isCurrent)}" data-schedule-current-week="1">Current Week</button>`
        : `<button type="button" class="${getTimetableCurrentWeekButtonClass(isCurrent)}" data-schedule-current-week="1">Current Week</button>`;
    const roleLabel = options.roleLabel || (getCurrentUser()?.role === USER_ROLES.STUDENT ? 'Student timetable' : 'Weekly timetable');

    if (containerId === 'timetable-schedule-controls' && document.getElementById('timetable-view-sessions')) {
        const sessionsButton = document.getElementById('timetable-view-sessions');
        const timetableButton = document.getElementById('timetable-view-timetable');
        const weekLabelNode = document.getElementById(labelId || 'timetable-month-label');
        const currentWeekButton = document.getElementById(currentButtonId || 'timetable-week-current');
        const sessionsOverviewNode = document.getElementById('timetable-overview-sessions');
        const daysOverviewNode = document.getElementById('timetable-overview-days');
        const hoursOverviewNode = document.getElementById('timetable-overview-hours');
        const roleOverviewNode = document.getElementById('timetable-overview-role');

        if (sessionsButton) {
            sessionsButton.type = 'button';
            sessionsButton.dataset.scheduleView = 'sessions';
            sessionsButton.className = getTimetableViewButtonClass(view === 'sessions');
            sessionsButton.setAttribute('aria-pressed', view === 'sessions' ? 'true' : 'false');
            sessionsButton.removeAttribute('onclick');
        }
        if (timetableButton) {
            timetableButton.type = 'button';
            timetableButton.dataset.scheduleView = 'timetable';
            timetableButton.className = getTimetableViewButtonClass(view === 'timetable');
            timetableButton.setAttribute('aria-pressed', view === 'timetable' ? 'true' : 'false');
            timetableButton.removeAttribute('onclick');
        }
        if (weekLabelNode) {
            weekLabelNode.textContent = formatWeekRangeLabel(normalizedWeek);
        }
        const gridWeekLabel = document.getElementById('timetable-grid-week-label');
        if (gridWeekLabel) {
            gridWeekLabel.textContent = formatWeekRangeLabel(normalizedWeek);
        }
        if (currentWeekButton) {
            currentWeekButton.className = getTimetableCurrentWeekButtonClass(isCurrent);
            currentWeekButton.dataset.scheduleCurrentWeek = '1';
            currentWeekButton.removeAttribute('data-timetable-action');
        }
        const gridCurrentWeekButton = document.getElementById('timetable-grid-week-current');
        if (gridCurrentWeekButton) {
            gridCurrentWeekButton.className = getTimetableGridWeekCurrentButtonClass(isCurrent);
            gridCurrentWeekButton.textContent = getTimetableGridWeekCurrentButtonLabel(isCurrent);
            gridCurrentWeekButton.dataset.scheduleCurrentWeek = '1';
        }
        if (sessionsOverviewNode) {
            sessionsOverviewNode.innerHTML = `<i class="fas fa-layer-group"></i> ${overview.sessionCount} sessions`;
        }
        if (daysOverviewNode) {
            daysOverviewNode.innerHTML = `<i class="fas fa-calendar-week"></i> ${overview.dayCount} active days`;
        }
        if (hoursOverviewNode) {
            hoursOverviewNode.innerHTML = `<i class="far fa-clock"></i> ${overview.totalHours.toFixed(1)} planned hours`;
        }
        if (roleOverviewNode) {
            roleOverviewNode.innerHTML = `<i class="fas fa-user-clock"></i> ${escapeHtml(roleLabel)}`;
        }
        return;
    }

    const buildViewButton = (viewKey, label, iconClass, activeView) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = getTimetableViewButtonClass(activeView === viewKey);
        button.dataset.scheduleView = viewKey;
        button.setAttribute('aria-pressed', activeView === viewKey ? 'true' : 'false');
        button.innerHTML = `<i class="fas ${iconClass}" aria-hidden="true"></i> ${escapeHtml(label)}`;
        return button;
    };

    if (options.compactEmbed) {
        container.classList.add('schedule-controls-embed-compact');
        container.setAttribute('data-lux-transparency-exempt', '1');
        container.innerHTML = '';

        const toolbar = document.createElement('div');
        toolbar.className = 'schedule-toolbar schedule-toolbar-embed-compact';

        const weekNav = document.createElement('div');
        weekNav.className = 'schedule-week-nav schedule-week-nav-embed-compact';
        const currentWeekButtonMarkup = isCurrent ? '' : currentButtonMarkup;
        weekNav.innerHTML = localizeHtmlMarkup(`
            <button type="button" class="lux-secondary-btn schedule-week-arrow lux-timetable-week-arrow" data-timetable-week-shift="-1" aria-label="Previous Week">
                <i class="fas fa-chevron-left"></i>
            </button>
            ${weekLabelMarkup}
            <button type="button" class="lux-secondary-btn schedule-week-arrow lux-timetable-week-arrow" data-timetable-week-shift="1" aria-label="Next Week">
                <i class="fas fa-chevron-right"></i>
            </button>
            ${currentWeekButtonMarkup}
        `);

        if (options.timetableOnly) {
            toolbar.append(weekNav);
        } else {
            const toggle = document.createElement('div');
            toggle.className = 'schedule-view-switcher schedule-view-switcher-embed-compact';
            toggle.setAttribute('role', 'group');
            toggle.setAttribute('aria-label', 'Schedule View');
            toggle.appendChild(buildViewButton('sessions', 'Sessions', 'fa-calendar-day', view));
            toggle.appendChild(buildViewButton('timetable', 'Timetable', 'fa-table-cells-large', view));
            toolbar.append(toggle, weekNav);
        }
        container.appendChild(toolbar);
        return;
    }

    container.classList.remove('schedule-controls-embed-compact');
    container.innerHTML = '';

    const toolbar = document.createElement('div');
    toolbar.className = 'schedule-toolbar';

    const toggle = document.createElement('div');
    toggle.className = 'schedule-view-switcher lux-timetable-view-switcher home-hover-chip';
    toggle.setAttribute('role', 'group');
    toggle.setAttribute('aria-label', 'Schedule View');

    toggle.appendChild(buildViewButton('sessions', 'Sessions', 'fa-calendar-day', view));
    toggle.appendChild(buildViewButton('timetable', 'Timetable', 'fa-table-cells-large', view));

    const weekNav = document.createElement('div');
    weekNav.className = 'schedule-week-nav lux-timetable-week-nav home-hover-chip';
    weekNav.innerHTML = localizeHtmlMarkup(`
        <button type="button" class="schedule-week-arrow lux-timetable-week-arrow" data-timetable-week-shift="-1" aria-label="Previous Week">
            <i class="fas fa-chevron-left"></i>
        </button>
        ${weekLabelMarkup}
        <button type="button" class="schedule-week-arrow lux-timetable-week-arrow" data-timetable-week-shift="1" aria-label="Next Week">
            <i class="fas fa-chevron-right"></i>
        </button>
        ${currentButtonMarkup}
    `);

    const toggleRow = document.createElement('div');
    toggleRow.className = 'schedule-view-row lux-timetable-view-row';
    toggleRow.appendChild(toggle);

    const overviewRow = document.createElement('div');
    overviewRow.className = 'schedule-overview-row lux-timetable-overview-row home-hover-chip';
    overviewRow.innerHTML = localizeHtmlMarkup(`
        <span class="schedule-chip lux-status-pill home-hover-chip is-muted lux-timetable-chip"><i class="fas fa-layer-group"></i> ${overview.sessionCount} sessions</span>
        <span class="schedule-chip lux-status-pill home-hover-chip is-muted lux-timetable-chip"><i class="fas fa-calendar-week"></i> ${overview.dayCount} active days</span>
        <span class="schedule-chip lux-status-pill home-hover-chip is-muted lux-timetable-chip"><i class="far fa-clock"></i> ${overview.totalHours.toFixed(1)} planned hours</span>
        <span class="schedule-chip schedule-chip-soft lux-status-pill home-hover-chip lux-timetable-chip"><i class="fas fa-user-clock"></i> ${escapeHtml(roleLabel)}</span>
    `);

    toolbar.append(weekNav, overviewRow);
    container.append(toggleRow, toolbar);
}

function syncTimetableFilterDefaults() {
    const semesterSelect = document.getElementById('tt-filter-sem');
    if (semesterSelect && semesterSelect.dataset.timetableFilterInit !== '1') {
        const activeSemester = parseInt(
            (typeof KIU_STATE !== 'undefined' && KIU_STATE.activeSemester) || 3,
            10
        );
        const semesterValue = String(Number.isFinite(activeSemester) ? activeSemester : 3);
        if (Array.from(semesterSelect.options).some((option) => option.value === semesterValue)) {
            semesterSelect.value = semesterValue;
        }
        semesterSelect.dataset.timetableFilterInit = '1';
    }

    const facultySelect = document.getElementById('tt-filter-fac');
    const role = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (getCurrentUser()?.role || USER_ROLES.STUDENT);
    if (facultySelect && role === USER_ROLES.ADMIN && facultySelect.dataset.timetableFilterInit !== '1') {
        const facultyCode = typeof getCurrentFaculty === 'function'
            ? getCurrentFaculty()
            : normalizeFacultyCode(localStorage.getItem('currentFaculty') || 'ECON', 'ECON');
        if (Array.from(facultySelect.options).some((option) => option.value === facultyCode)) {
            facultySelect.value = facultyCode;
        }
        facultySelect.dataset.timetableFilterInit = '1';
    }
}

function syncTimetableStaticControls(weekStart, items, options = {}) {
    renderScheduleControls('timetable-schedule-controls', weekStart, items, {
        defaultView: options.defaultView || 'sessions',
        labelId: 'timetable-month-label',
        currentButtonId: 'timetable-week-current',
        roleLabel: options.roleLabel || (getCurrentUser()?.role === USER_ROLES.STUDENT ? 'Student timetable' : 'Weekly timetable')
    });
    syncTimetableNarrative(weekStart, items, options);
}

function normalizeScheduleActorMatch(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');
}

function getScheduleSessionTypeLabel(sessionType) {
    if (typeof getStudentSectionTypeLabel === 'function') {
        return cleanupEncodingArtifacts(toEnglishText(getStudentSectionTypeLabel(sessionType || 'lecture')));
    }
    const normalized = String(sessionType || 'lecture').trim().toLowerCase();
    if (normalized === 'seminar') return 'Seminar';
    if (normalized === 'lab') return 'Lab';
    if (normalized === 'exam') return 'Exam';
    return 'Lecture';
}
function syncTimetableWeekControls(weekStart) {
    syncTimetableStaticControls(weekStart, [], {
        defaultView: 'sessions',
        roleLabel: getCurrentUser()?.role === USER_ROLES.STUDENT ? 'Student timetable' : 'Weekly timetable'
    });
}

function changeTimetableWeek(offset) {
    const nextWeek = shiftWeekStartISO(getStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY), offset);
    setStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY, nextWeek);
    refreshScheduleSurfaces();
}

function jumpTimetableToCurrentWeek() {
    setStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY, getCurrentWeekStartISO());
    refreshScheduleSurfaces();
}

function normalizeWeekdayLabel(day, target = 'ge', weekStart = getCurrentWeekStartISO()) {
    const raw = String(typeof normalizeScheduleDayLabel === 'function' ? normalizeScheduleDayLabel(day, day || '') : day || '').trim();
    if (!raw) return '';
    const lowered = raw.toLowerCase();
    const entries = getWeekDateEntries(weekStart);
    const match = entries.find(entry =>
        String(entry.ge || '').trim().toLowerCase() === lowered ||
        String(entry.en || '').trim().toLowerCase() === lowered
    );
    if (!match) return raw;
    return target === 'en' ? match.en : match.ge;
}

function getWeeklyScheduleColumns(items, weekStart) {
    const columns = [[], [], [], [], [], [], []];
    (items || []).forEach(item => {
        const sourceDay = typeof normalizeScheduleDayLabel === 'function' ? normalizeScheduleDayLabel(item?.day, item?.day || '') : item?.day;
        const englishDay = normalizeWeekdayLabel(sourceDay, 'en', weekStart);
        const columnIndex = getWeekDateEntries(weekStart).findIndex(entry => entry.en === englishDay);
        if (columnIndex >= 0) columns[columnIndex].push(item);
    });
    return columns.map(col => col.sort((a, b) => convertTimeToMinutes(a.time) - convertTimeToMinutes(b.time)));
}

function getCurrentStudentScheduleItemsForWeek(weekStart, options = {}) {
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) return [];
    const targetSemester = options.semester ? parseInt(options.semester, 10) : null;
    const items = [];
    getCurrentStudentSchedule().forEach(scheduleItem => {
        const groupObj = resolveScheduledGroupForWeek(scheduleItem.courseId, scheduleItem.groupId, weekStart);
        if (!groupObj) return;
        const normalizedSemester = parseInt(groupObj.semester || scheduleItem.semester || 0, 10) || null;
        if (targetSemester && normalizedSemester && normalizedSemester !== targetSemester) return;
        items.push({
            ...groupObj,
            courseId: scheduleItem.courseId,
            courseName: scheduleItem.courseName || groupObj.courseName || scheduleItem.courseId,
            groupId: scheduleItem.groupId,
            semester: normalizedSemester || groupObj.semester || scheduleItem.semester || null,
            sessionType: scheduleItem.sessionType || groupObj.sessionType || 'lecture'
        });
    });
    return items;
}

function getCurrentFacultyScheduleItemsForWeek(weekStart, options = {}) {
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || ![USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(effectiveRole)) return [];
    const targetSemester = options.semester ? parseInt(options.semester, 10) : null;
    const normalizedUserName = normalizeScheduleActorMatch(currentUser?.name || currentUser?.nameEn || '');
    return getAvailableScheduleItemsForWeek(weekStart, { semester: targetSemester }).filter(item => {
        return normalizeScheduleActorMatch(item.prof) === normalizedUserName || normalizeScheduleActorMatch(item.ta) === normalizedUserName;
    }).map(item => ({
        ...item,
        roleLabel: normalizeScheduleActorMatch(item.prof) === normalizedUserName ? 'Professor' : 'Teaching Assistant',
        subjectName: item.courseName || item.subjectName || item.courseId
    }));
}

function getRoleScopedScheduleItemsForWeek(weekStart, options = {}) {
    const currentUser = getCurrentUser();
    const role = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (role === USER_ROLES.ADMIN) {
        return getAvailableScheduleItemsForWeek(weekStart, {
            semester: options.semester,
            faculty: options.faculty
        });
    }
    if (role === USER_ROLES.PROFESSOR || role === USER_ROLES.TA) {
        return getCurrentFacultyScheduleItemsForWeek(weekStart, { semester: options.semester });
    }
    return getCurrentStudentScheduleItemsForWeek(weekStart, { semester: options.semester });
}

function normalizeScheduleSurfaceItem(item, weekStart) {
    const durationMinutes = parseInt(String(item.duration || '110').match(/\d+/)?.[0] || '110', 10);
    const startTime = normalizeTimeString(item.startTime || item.time || '', 'TBD');
    const endTime = normalizeTimeString(item.endTime || '', '') || (startTime === 'TBD'
        ? 'TBD'
        : minutesToTimeString(convertTimeToMinutes(startTime) + durationMinutes));
    const facultyCode = normalizeFacultyCode(item.faculty || deriveFacultyFromSubjectId(item.courseId));
    const facultyName = getFacultyProfile(facultyCode)?.name || facultyCode;
    const sessionMarkers = getScheduleSessionMarkersForItem(item, weekStart);
    const sessionMarker = sessionMarkers.length ? sessionMarkers[0] : null;
    return {
        ...item,
        durationMinutes,
        startTime,
        endTime,
        facultyCode,
        facultyName,
        courseCode: item.courseId || item.subjectId || item.id || 'Subject',
        subjectTitle: item.subjectName || item.courseName || item.name || item.courseId || 'Subject',
        groupLabel: item.groupId || item.name || item.id || 'Group',
        roomLabel: item.room || 'Room TBD',
        dayLabel: normalizeWeekdayLabel(typeof normalizeScheduleDayLabel === 'function' ? normalizeScheduleDayLabel(item.day, item.day || '') : item.day, 'en', weekStart) || item.day || 'Day TBD',
        roleBadge: item.roleLabel || '',
        sessionTypeLabel: getScheduleSessionTypeLabel(item.sessionType || item.type || 'lecture'),
        sessionMarkers,
        sessionMarker,
        hasSessionMarker: Boolean(sessionMarker)
    };
}

function getScheduleOverview(items) {
    const normalizedItems = (items || []).map(item => normalizeScheduleSurfaceItem(item, getCurrentWeekStartISO()));
    const uniqueDays = new Set(normalizedItems.map(item => item.dayLabel).filter(Boolean));
    const totalHours = normalizedItems.reduce((sum, item) => sum + (Number(item.durationMinutes || 0) / 60), 0);
    return {
        sessionCount: normalizedItems.length,
        dayCount: uniqueDays.size,
        totalHours
    };
}

function getTimetableRoleNarrative(role = getCurrentUser()?.role) {
    switch (role) {
        case USER_ROLES.PROFESSOR:
            return {
                kicker: 'Faculty schedule',
                title: 'Teaching Timetable',
                copy: 'Review this week\'s classes, rooms, and teaching load in one clear academic schedule.',
                commandNote: 'Current week, role-aware filters, and teaching sessions',
                focusDefaultLabel: 'Teaching focus',
                stageCopy: 'Use session cards for quick scanning or the timetable grid for room and time planning.',
                stageStatus: 'Schedule live'
            };
        case USER_ROLES.TA:
            return {
                kicker: 'Assistant schedule',
                title: 'Section Timetable',
                copy: 'Follow labs, seminars, and support sessions with clear room, time, and instructor context.',
                commandNote: 'Current week, section support, and assigned sessions',
                focusDefaultLabel: 'Support focus',
                stageCopy: 'Use session cards for quick scanning or the timetable grid for room and time planning.',
                stageStatus: 'Schedule live'
            };
        case USER_ROLES.ADMIN:
            return {
                kicker: 'Academic operations',
                title: 'University Timetable',
                copy: 'Review the official weekly schedule by semester and faculty with a clear operations view.',
                commandNote: 'Faculty, semester, and current-week controls',
                focusDefaultLabel: 'Operational focus',
                stageCopy: 'Audit class load, room usage, and weekly structure from one controlled timetable surface.',
                stageStatus: 'Schedule live'
            };
        default:
            return {
                kicker: 'Student timetable',
                title: 'Weekly Schedule',
                copy: 'See this week\'s classes, rooms, instructors, and academic rhythm in a simple timetable.',
                commandNote: 'Current week, semester scope, and class details',
                focusDefaultLabel: 'Weekly focus',
                stageCopy: 'Use session cards for quick scanning or the timetable grid for a full weekly view.',
                stageStatus: 'Schedule live'
            };
    }
}

function setNodeContent(nodeId, value) {
    const node = document.getElementById(nodeId);
    if (node) node.textContent = value;
}

function setNodeHtml(nodeId, value) {
    const node = document.getElementById(nodeId);
    if (node) node.innerHTML = value;
}

function setInsightList(nodeId, items) {
    const node = document.getElementById(nodeId);
    if (!node) return;
    node.innerHTML = (items || []).map(item => `<span>${item}</span>`).join('');
}

function formatTimetableHeroFocusTitle(session) {
    const subject = String(session?.subjectTitle || '').trim();
    const course = String(session?.courseName || session?.name || '').trim();
    if (subject && subject.length > 2 && !/^\d+$/.test(subject)) return subject;
    return course || subject || 'Upcoming session';
}

function getTimetableSessionInstructor(session) {
    const instructorName = String(session?.prof || session?.ta || '').trim() || 'Instructor TBA';
    const instructorRole = String(session?.roleBadge || '').trim()
        || (String(session?.ta || '').trim() && !String(session?.prof || '').trim() ? 'Teaching Assistant' : 'Professor');
    return { instructorName, instructorRole };
}

function renderTimetableHeroFocusFacts(session, marker, markerMeta) {
    const { instructorName, instructorRole } = getTimetableSessionInstructor(session);
    const rows = [
        `<li class="lux-timetable-focus-fact--primary"><i class="fas fa-user" aria-hidden="true"></i><span>${escapeHtml(instructorRole)}: ${escapeHtml(instructorName)}</span></li>`,
        `<li><i class="fas fa-layer-group" aria-hidden="true"></i><span>${escapeHtml(session.sessionTypeLabel || 'Session')} · ${escapeHtml(session.facultyName || 'Faculty')}</span></li>`
    ];
    if (marker && markerMeta) {
        rows.push(`<li><i class="fas ${escapeHtml(markerMeta.icon)}" aria-hidden="true"></i><span>${escapeHtml(markerMeta.label)}</span></li>`);
    }
    return rows.join('');
}

function renderTimetableHeroFocusPanel(nextSession, weekStart, marker, markerMeta) {
    const startTime = String(nextSession.startTime || '').trim() || '--:--';
    const endTime = String(nextSession.endTime || '').trim() || '--:--';
    const dayLabel = String(nextSession.dayLabel || '').trim() || 'Day TBD';
    const roomLabel = String(nextSession.roomLabel || nextSession.room || '').trim() || 'Room TBD';
    const groupLabel = String(nextSession.groupLabel || nextSession.groupId || nextSession.name || '').trim() || 'Group TBD';
    const { instructorName } = getTimetableSessionInstructor(nextSession);
    const nextLabel = weekStart === getCurrentWeekStartISO() ? 'Your next class' : 'Week preview';

    setNodeContent('timetable-hero-focus-label', marker ? markerMeta.label : nextLabel);
    setNodeContent('timetable-hero-focus-time', `${startTime}–${endTime}`);
    setNodeContent('timetable-hero-focus-title', formatTimetableHeroFocusTitle(nextSession));
    setNodeContent('timetable-hero-focus-copy', `${dayLabel} · ${roomLabel} · ${groupLabel}`);
    setNodeHtml('timetable-hero-focus-facts', renderTimetableHeroFocusFacts(nextSession, marker, markerMeta));
    setNodeHtml('timetable-hero-focus-meta', [
        `<span class="lux-hero-signal home-hover-chip"><i class="fas fa-location-dot"></i> ${escapeHtml(roomLabel)}</span>`,
        `<span class="lux-hero-signal home-hover-chip"><i class="fas fa-user"></i> ${escapeHtml(instructorName)}</span>`,
        `<span class="lux-hero-signal home-hover-chip"><i class="fas fa-layer-group"></i> ${escapeHtml(groupLabel)}</span>`
    ].join(''));
}

function setHeroFocusCopyVisible(visible) {
    const copyNode = document.getElementById('timetable-hero-focus-copy');
    if (!copyNode) return;
    if (visible) copyNode.removeAttribute('hidden');
    else copyNode.setAttribute('hidden', '');
}

function getTimetableInsightModel(weekStart, items) {
    const entries = getWeekDateEntries(weekStart);
    const normalizedItems = (items || []).map(item => normalizeScheduleSurfaceItem(item, weekStart));
    const overview = getScheduleOverview(items || []);
    const grouped = new Map();

    normalizedItems.forEach((item) => {
        const key = item.dayLabel || 'Unknown';
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key).push(item);
    });

    let nextSession = null;
    const now = new Date();
    normalizedItems
        .map((item) => {
            const entry = entries.find(candidate => candidate.en === item.dayLabel);
            if (!entry || item.startTime === 'TBD') return null;
            const startDate = new Date(`${entry.iso}T${item.startTime}:00`);
            return { item, startDate };
        })
        .filter(Boolean)
        .sort((left, right) => left.startDate - right.startDate)
        .forEach((candidate) => {
            if (!nextSession && (weekStart !== getCurrentWeekStartISO() || candidate.startDate >= now)) {
                nextSession = candidate;
            }
        });

    if (!nextSession && normalizedItems.length) {
        const firstItem = normalizedItems
            .map((item) => {
                const entry = entries.find(candidate => candidate.en === item.dayLabel);
                return entry ? { item, startDate: new Date(`${entry.iso}T${item.startTime}:00`) } : null;
            })
            .filter(Boolean)
            .sort((left, right) => left.startDate - right.startDate)[0];
        nextSession = firstItem || null;
    }

    const busiestDayEntry = Array.from(grouped.entries())
        .sort((left, right) => right[1].length - left[1].length)[0] || null;

    const facultyCount = new Set(normalizedItems.map(item => item.facultyCode).filter(Boolean)).size;
    const roomCount = new Set(normalizedItems.map(item => item.roomLabel).filter(Boolean)).size;

    return {
        normalizedItems,
        overview,
        nextSession,
        busiestDayEntry,
        facultyCount,
        roomCount
    };
}

function syncTimetableNarrative(weekStart, items, options = {}) {
    const role = getCurrentUser()?.role;
    const view = getStoredScheduleView(options.defaultView || 'sessions');
    const targetSemester = document.getElementById('tt-filter-sem')
        ? parseInt(document.getElementById('tt-filter-sem').value, 10)
        : parseInt(KIU_STATE.activeSemester || 3, 10);
    const activeFacultyCode = document.getElementById('tt-filter-fac')
        ? normalizeFacultyCode(document.getElementById('tt-filter-fac').value, getCurrentFaculty())
        : getCurrentFaculty();
    const activeFacultyName = getFacultyProfile(activeFacultyCode)?.name || activeFacultyCode;
    const roleLabel = role === USER_ROLES.STUDENT
        ? 'Student'
        : role === USER_ROLES.PROFESSOR
            ? 'Professor'
            : role === USER_ROLES.TA
                ? 'Teaching Assistant'
                : role === USER_ROLES.ADMIN
                    ? 'Administrator'
                    : 'Portal';
    const narrative = getTimetableRoleNarrative(role);
    const insight = getTimetableInsightModel(weekStart, items || []);

    setNodeHtml('timetable-page-kicker', `<i class="fas fa-calendar-week"></i> ${escapeHtml(narrative.kicker)}`);
    setNodeContent('timetable-page-title', narrative.title);
    setNodeContent('timetable-page-copy', narrative.copy);
    setNodeContent('timetable-command-note', narrative.commandNote);
    setNodeContent('timetable-stage-copy', narrative.stageCopy);
    setNodeContent('timetable-stage-status', narrative.stageStatus);
    setNodeHtml('timetable-hero-sem-badge', `<i class="fas fa-graduation-cap"></i> Semester ${targetSemester}`);

    setNodeContent('timetable-insight-scope', `Semester ${targetSemester} - ${roleLabel}`);
    setNodeContent('timetable-insight-scope-copy', `${formatWeekRangeLabel(weekStart)} in ${view === 'timetable' ? 'grid' : 'session'} mode.`);
    setInsightList('timetable-insight-scope-list', [
        `<i class="fas fa-calendar-range"></i> ${escapeHtml(formatWeekRangeLabel(weekStart))}`,
        `<i class="fas fa-layer-group"></i> ${escapeHtml(view === 'timetable' ? 'Timetable grid view' : 'Session list view')}`,
        `<i class="fas fa-building"></i> ${escapeHtml(role === USER_ROLES.ADMIN ? activeFacultyName : activeFacultyName || 'Current faculty')}`
    ]);

    if (!insight.normalizedItems.length) {
        setNodeContent('timetable-hero-focus-label', 'Your next class');
        setNodeContent('timetable-hero-focus-time', '--:--');
        setNodeContent('timetable-hero-focus-title', 'No sessions this week');
        setNodeContent('timetable-hero-focus-copy', `Nothing is scheduled for ${formatWeekRangeLabel(weekStart)} yet.`);
        setHeroFocusCopyVisible(true);
        setNodeHtml('timetable-hero-focus-facts', '');
        setNodeHtml('timetable-hero-focus-meta', '<span class="lux-hero-signal home-hover-chip"><i class="fas fa-moon"></i> Quiet week</span>');
        setNodeContent('timetable-insight-busiest', '0 sessions across 0 days');
        setNodeContent('timetable-insight-busiest-copy', 'This week is empty, so there is no peak day yet.');
        setInsightList('timetable-insight-busiest-list', [
            '<i class="fas fa-layer-group"></i> 0 scheduled sessions',
            '<i class="far fa-clock"></i> 0.0 planned hours',
            '<i class="fas fa-wave-square"></i> No busiest day'
        ]);
        return;
    }

    const nextSession = insight.nextSession?.item || null;
    if (nextSession) {
        const marker = nextSession.sessionMarker || null;
        const markerMeta = marker ? getScheduleSessionMarkerTypeMeta(marker.type) : null;
        setHeroFocusCopyVisible(false);
        renderTimetableHeroFocusPanel(nextSession, weekStart, marker, markerMeta);
    }

    if (insight.busiestDayEntry) {
        const [busiestDay, busiestItems] = insight.busiestDayEntry;
        const first = busiestItems[0];
        const last = busiestItems[busiestItems.length - 1];
        setNodeContent('timetable-insight-busiest', `${busiestDay} carries the peak load`);
        setNodeContent('timetable-insight-busiest-copy', `${busiestItems.length} sessions from ${first.startTime} to ${last.endTime}.`);
        setInsightList('timetable-insight-busiest-list', [
            `<i class="fas fa-layer-group"></i> ${insight.overview.sessionCount} scheduled sessions`,
            `<i class="far fa-clock"></i> ${insight.overview.totalHours.toFixed(1)} planned hours`,
            `<i class="fas fa-fire"></i> Peak day: ${escapeHtml(busiestDay)}`
        ]);
    }
}

function ensureScheduleSurfaceRegions(container) {
    let frame = container.querySelector(':scope > [data-schedule-surface-frame]');
    let empty = container.querySelector(':scope > [data-schedule-surface-empty]');
    if (!frame || !empty) {
        frame = document.createElement('div');
        frame.dataset.scheduleSurfaceFrame = '1';
        empty = document.createElement('div');
        empty.dataset.scheduleSurfaceEmpty = '1';
        empty.hidden = true;
        container.replaceChildren(frame, empty);
    }
    return { frame, empty };
}

function showScheduleSurfaceEmpty(container, markup, emptyClassName = 'schedule-empty-state') {
    const regions = ensureScheduleSurfaceRegions(container);
    regions.frame.hidden = true;
    regions.empty.hidden = false;
    regions.empty.className = `home-hover-chip ${emptyClassName}`.trim();
    regions.empty.innerHTML = localizeHtmlMarkup(markup);
    return regions;
}

function showScheduleSurfaceFrame(container) {
    const regions = ensureScheduleSurfaceRegions(container);
    regions.frame.hidden = false;
    regions.empty.hidden = true;
    regions.empty.className = '';
    regions.empty.innerHTML = '';
    return regions;
}

function renderScheduleSessionDaySection(section, entry, dayItems, facultyActionsEnabled) {
    section.className = 'schedule-day-section lux-timetable-day-section home-hover-chip';
    section.dataset.scheduleDay = entry.en.toLowerCase();
    section.innerHTML = localizeHtmlMarkup(`
        <div class="schedule-day-heading lux-timetable-day-heading">
            <div>
                <div class="schedule-day-title">${escapeHtml(entry.en)}</div>
                <div class="schedule-day-date">${escapeHtml(entry.shortDate)}</div>
            </div>
            <span class="schedule-day-count lux-timetable-day-count">${dayItems.length} ${dayItems.length === 1 ? 'session' : 'sessions'}</span>
        </div>
        ${dayItems.length ? `
            <div class="schedule-session-grid lux-timetable-session-grid${dayItems.length >= 4 ? ' lux-timetable-session-grid--dense' : ''}">
                ${dayItems.map(item => {
                    const marker = item.sessionMarker || null;
                    const markerMeta = marker ? getScheduleSessionMarkerTypeMeta(marker.type) : null;
                    const markerClass = marker ? ` has-session-marker marker-${scheduleMarkerClassToken(marker.type)}` : '';
                    const focusTitle = formatTimetableHeroFocusTitle(item);
                    const groupLabel = String(item.groupLabel || '').trim();
                    const groupSubtitle = groupLabel
                        && focusTitle !== groupLabel
                        && focusTitle !== `Group ${groupLabel}`
                        ? `Group ${groupLabel}`
                        : '';
                    return `
                    <article class="schedule-session-card lux-timetable-session-card home-hover-chip${markerClass}">
                        <div class="schedule-session-card-header lux-timetable-session-card-header">
                            <div class="schedule-session-identity lux-timetable-session-identity">
                                <div class="schedule-session-code-row lux-timetable-session-code-row">
                                    <span class="schedule-session-code lux-timetable-session-code">${escapeHtml(item.courseCode)}</span>
                                    ${item.roleBadge ? `<span class="schedule-session-pill lux-timetable-session-pill home-hover-chip role">${escapeHtml(item.roleBadge)}</span>` : ''}
                                    <span class="schedule-session-pill lux-timetable-session-pill home-hover-chip type">${escapeHtml(item.sessionTypeLabel)}</span>
                                    ${marker ? `<span class="schedule-session-pill lux-timetable-session-pill home-hover-chip important"><i class="fas ${escapeHtml(markerMeta.icon)}"></i> ${escapeHtml(markerMeta.label)}</span>` : ''}
                                </div>
                                <div class="schedule-session-meta-row lux-timetable-session-meta-row">
                                    <span><i class="fas fa-location-dot"></i> ${escapeHtml(item.roomLabel)}</span>
                                    <span><i class="fas fa-building"></i> ${escapeHtml(item.facultyName)}</span>
                                    <span><i class="fas fa-user"></i> ${escapeHtml(item.prof || item.ta || 'Instructor TBA')}</span>
                                </div>
                            </div>
                            <div class="schedule-session-focus lux-timetable-session-focus">
                                <div class="schedule-session-focus-line lux-timetable-session-focus-line">
                                    <h3 class="schedule-session-title lux-timetable-session-title">${escapeHtml(focusTitle)}</h3>
                                    ${groupSubtitle ? `<span class="schedule-session-subtitle lux-timetable-session-subtitle">${escapeHtml(groupSubtitle)}</span>` : ''}
                                </div>
                            </div>
                            <div class="schedule-session-rail lux-timetable-session-rail">
                                <span class="schedule-session-time lux-timetable-session-time"><i class="far fa-clock"></i> ${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)}</span>
                                ${facultyActionsEnabled ? `
                                    <button class="lux-secondary-btn schedule-session-action lux-timetable-session-action" data-schedule-open-lms="1" data-schedule-course-code="${escapeHtml(item.courseCode)}" data-schedule-session-key="${escapeHtml(item.id || item.groupId || item.groupLabel)}">
                                        <i class="fas fa-book-reader"></i> Open in LMS
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        ${marker ? `
                            <div class="schedule-session-marker-banner">
                                <i class="fas ${escapeHtml(markerMeta.icon)}"></i>
                                <div>
                                    <strong>${escapeHtml(marker.title || markerMeta.label)}</strong>
                                    <span>${escapeHtml(marker.note || 'This class session has been marked as important by course staff.')}</span>
                                </div>
                            </div>
                        ` : ''}
                    </article>
                `;
                }).join('')}
            </div>
        ` : `
            <div class="schedule-day-empty lux-timetable-day-empty">No sessions scheduled on ${escapeHtml(entry.en)}.</div>
        `}
    `);
}

function renderScheduleSessionsView(container, items, options = {}) {
    if (!container) return;
    const weekStart = options.weekStart || getCurrentWeekStartISO();
    const weekEntries = getWeekDateEntries(weekStart);
    const normalizedItems = (items || []).map(item => normalizeScheduleSurfaceItem(item, weekStart));
    const groupedItems = weekEntries.map(entry => ({
        entry,
        items: normalizedItems.filter(item => item.dayLabel === entry.en)
            .sort((left, right) => convertTimeToMinutes(left.startTime) - convertTimeToMinutes(right.startTime))
    }));

    if (!normalizedItems.length) {
        showScheduleSurfaceEmpty(container, `
            <div class="schedule-empty-icon"><i class="fas fa-calendar-xmark"></i></div>
            <div class="lux-empty-state__title schedule-empty-title">${escapeHtml(options.emptyTitle || 'No sessions scheduled for this week')}</div>
            <div class="lux-empty-state__copy schedule-empty-copy">${escapeHtml(options.emptyMessage || `Nothing is assigned for ${formatWeekRangeLabel(weekStart)} yet.`)}</div>
        `, 'schedule-empty-state');
        return;
    }

    const { frame } = showScheduleSurfaceFrame(container);
    let board = frame.querySelector(':scope > .schedule-sessions-board');
    if (!board) {
        board = document.createElement('div');
        board.className = 'schedule-sessions-board lux-timetable-sessions-board';
        frame.replaceChildren(board);
    }

    const role = getCurrentUser()?.role;
    const facultyActionsEnabled = options.enableLmsAction !== false && (role === USER_ROLES.PROFESSOR || role === USER_ROLES.TA);
    const existingSections = new Map(
        Array.from(board.querySelectorAll(':scope > .schedule-day-section')).map(section => [section.dataset.scheduleDay || '', section])
    );
    const fragment = document.createDocumentFragment();
    groupedItems.forEach(({ entry, items: dayItems }) => {
        const dayKey = entry.en.toLowerCase();
        const section = existingSections.get(dayKey) || document.createElement('section');
        renderScheduleSessionDaySection(section, entry, dayItems, facultyActionsEnabled);
        fragment.appendChild(section);
    });
    board.replaceChildren(fragment);
}

function renderScheduleSurfaceInto(container, items, options = {}) {
    if (!container) return;
    const view = options.timetableOnly
        ? 'timetable'
        : getStoredScheduleView(options.defaultView || 'sessions', options.viewStorageKey || '');
    container.dataset.scheduleSurfaceView = view;
    if (view === 'timetable') {
        renderUnifiedWeeklyScheduleGrid(container, items, options);
        return;
    }
    renderScheduleSessionsView(container, items, options);
}

function getScheduleToneToken(facultyCode) {
    const normalizedFaculty = normalizeFacultyCode(facultyCode, 'ECON');
    const currentFaculty = normalizeFacultyCode(
        typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : normalizedFaculty,
        normalizedFaculty
    );
    return normalizedFaculty === currentFaculty ? 'current' : normalizedFaculty.toLowerCase();
}

function buildScheduleToneDataAttribute(facultyCode) {
    return `data-sch-event-tone="${escapeHtml(getScheduleToneToken(facultyCode))}"`;
}

function getTimetableGridWeekCurrentButtonClass(isCurrent) {
    return isCurrent
        ? 'lux-primary-btn sch-week-current-btn is-current-week'
        : 'lux-secondary-btn sch-week-current-btn';
}

function getTimetableGridWeekCurrentButtonLabel(isCurrent) {
    return isCurrent ? 'Current week' : 'Jump to current';
}

function renderTimetableGridTopline(shell, weekStart, options = {}) {
    const isCurrentWeek = weekStart === getCurrentWeekStartISO();
    const profileMode = options.profileMode === true;
    let topline = shell.querySelector(':scope > .sch-grid-topline');
    if (!topline) {
        topline = document.createElement('div');
        topline.className = 'sch-grid-topline';
        shell.prepend(topline);
    }
    // Profile embeds already expose week nav in compact controls — avoid duplicate chrome.
    const weekNavMarkup = profileMode
        ? `<strong class="sch-grid-week-label">${escapeHtml(formatWeekRangeLabel(weekStart))}</strong>`
        : `<strong id="timetable-grid-week-label" class="sch-grid-week-label">${escapeHtml(formatWeekRangeLabel(weekStart))}</strong>
            <div class="sch-week-nav">
                <button type="button" class="lux-secondary-btn sch-week-arrow" data-timetable-week-shift="-1" aria-label="Previous week"><i class="fas fa-chevron-left" aria-hidden="true"></i></button>
                <button type="button" id="timetable-grid-week-current" class="${getTimetableGridWeekCurrentButtonClass(isCurrentWeek)}" data-schedule-current-week="1">${escapeHtml(getTimetableGridWeekCurrentButtonLabel(isCurrentWeek))}</button>
                <button type="button" class="lux-secondary-btn sch-week-arrow" data-timetable-week-shift="1" aria-label="Next week"><i class="fas fa-chevron-right" aria-hidden="true"></i></button>
            </div>`;
    topline.innerHTML = localizeHtmlMarkup(`
        <div class="sch-grid-topline-start">
            <span class="sch-grid-tag">GMT+4</span>
            <span class="sch-grid-tag sch-grid-tag-soft">Schedule live</span>
        </div>
        <div class="sch-grid-topline-end">
            ${weekNavMarkup}
        </div>
    `);
}

function ensureTimetableGridHost(shell, usePageGridId) {
    let gridHost = shell.querySelector(':scope > #timetable-grid, :scope > [data-timetable-grid-host="1"]');
    if (!gridHost) {
        gridHost = document.createElement('div');
        if (usePageGridId) {
            gridHost.id = 'timetable-grid';
        } else {
            gridHost.dataset.timetableGridHost = '1';
        }
        gridHost.setAttribute('aria-live', 'polite');
        shell.appendChild(gridHost);
    }
    return gridHost;
}

function buildTimetableEmptyWeekNotice(weekStart, message) {
    const notice = document.createElement('div');
    notice.className = 'sch-empty-week-notice lux-soft-chrome';
    notice.textContent = message || `No sessions scheduled for ${formatWeekRangeLabel(weekStart)}.`;
    return notice;
}

function renderUnifiedWeeklyScheduleGrid(container, items, options = {}) {
    if (!container) return;

    const weekStart = options.weekStart || getCurrentWeekStartISO();
    const weekEntries = getWeekDateEntries(weekStart);
    const isCurrentWeek = weekStart === getCurrentWeekStartISO();
    const normalizedItems = (items || []).map(item => normalizeScheduleSurfaceItem(item, weekStart));
    const columns = getWeeklyScheduleColumns(normalizedItems, weekStart);
    const emptyMessage = options.emptyMessage || `No schedule sessions found for ${formatWeekRangeLabel(weekStart)}.`;
    const profileMode = options.profileMode === true;
    const usePageGridId = container.id === 'timetable-master-container';
    const { frame } = showScheduleSurfaceFrame(container);
    let shell = frame.querySelector(':scope > .sch-grid-shell');
    if (!shell) {
        shell = document.createElement('div');
        frame.replaceChildren(shell);
    }
    shell.className = `sch-grid-shell${profileMode ? ' is-profile' : ''}`;
    shell.dataset.ttGrid = '1';
    // Profile embeds sit inside an existing glass host — avoid nested blur roots.
    if (profileMode) delete shell.dataset.luxGlassRoot;
    else shell.dataset.luxGlassRoot = '1';

    renderTimetableGridTopline(shell, weekStart, { profileMode });
    const gridHost = ensureTimetableGridHost(shell, usePageGridId);

    const root = document.createElement('div');
    root.className = 'sch-weeklist-root';
    root.dataset.schedulerWeekState = isCurrentWeek ? 'current' : 'selected';

    let weekListHtml = '<div class="weeklist-container sch-weeklist-container">';
    weekEntries.forEach((entry, columnIndex) => {
        const column = columns[columnIndex] || [];
        const isToday = isCurrentWeek && (new Date().getDay() === (columnIndex === 6 ? 0 : columnIndex + 1));
        const metaLabel = `${entry.shortDate}${isToday ? ' · Today' : ''}`;
        let cardsHtml = '';
        column.forEach(item => {
            const durMin = parseInt(String(item.durationMinutes || item.duration || '110').match(/\d+/)?.[0] || '110', 10);
            const facultyCode = normalizeFacultyCode(item.facultyCode || item.faculty || deriveFacultyFromSubjectId(item.courseId));
            const toneAttr = buildScheduleToneDataAttribute(facultyCode);
            const subjectLabel = escapeHtml(item.courseCode || item.courseId || 'Subject');
            const groupLabel = escapeHtml(item.groupLabel || item.name || item.id || item.groupId || '');
            const professorLabel = escapeHtml(item.prof || item.ta || 'Instructor TBA');
            const roomLabel = escapeHtml(item.roomLabel || item.room || 'Room TBA');
            const sessionTypeLabel = escapeHtml(item.sessionTypeLabel || (getStudentSectionTypeLabel ? getStudentSectionTypeLabel(item.sessionType || 'lecture') : 'Lecture'));
            const marker = item.sessionMarker || null;
            const markerMeta = marker ? getScheduleSessionMarkerTypeMeta(marker.type) : null;
            const markerClass = marker ? ` has-session-marker marker-${scheduleMarkerClassToken(marker.type)}` : '';
            const extraBadge = marker
                ? `<div class="ev-draft schedule-marker-badge marker-${scheduleMarkerClassToken(marker.type)}"><i class="fas ${escapeHtml(markerMeta.icon)}"></i> ${escapeHtml(markerMeta.label)}</div>`
                : item.isWeekOverride
                ? `<div class="ev-draft">WEEK</div>`
                : '';
            const markerNote = marker
                ? `<div class="ev-meta schedule-grid-marker-note"><i class="fas ${escapeHtml(markerMeta.icon)}"></i> ${escapeHtml(marker.title || markerMeta.label)}${marker.note ? ` - ${escapeHtml(marker.note)}` : ''}</div>`
                : '';

            cardsHtml += `<div class="sch-event weeklist-item sch-weeklist-item${markerClass}" ${toneAttr}>
                ${extraBadge}
                <div class="ev-title">${escapeHtml(item.subjectTitle || item.courseName || item.courseCode || item.courseId || 'Session')} <span class="ev-title-meta">(${subjectLabel}${groupLabel ? ` · ${groupLabel}` : ''})</span></div>
                <div class="ev-meta"><i class="fas fa-tag"></i> ${sessionTypeLabel}</div>
                <div class="ev-meta"><i class="far fa-clock"></i> ${escapeHtml(item.startTime)} - ${escapeHtml(item.endTime)} · ${durMin} min</div>
                <div class="ev-meta"><i class="fas fa-location-dot"></i> ${roomLabel}</div>
                <div class="ev-meta"><i class="fas fa-user"></i> ${professorLabel}</div>
                ${markerNote}
            </div>`;
        });
        weekListHtml += `<section class="headInfo sch-weeklist-day${isToday ? ' is-today' : ''}">
            <div class="day-title sch-weeklist-day-head">
                <div class="day-name sch-day-col-label">${escapeHtml(entry.en)}</div>
                <div class="day-number sch-day-col-meta">${escapeHtml(metaLabel)}</div>
                <span class="sch-weeklist-day-count">${column.length} ${column.length === 1 ? 'session' : 'sessions'}</span>
            </div>
            <div class="weeklist sch-weeklist-items">${cardsHtml || `<div class="sch-weeklist-empty">No sessions</div>`}</div>
        </section>`;
    });
    weekListHtml += '</div>';
    root.innerHTML = localizeHtmlMarkup(weekListHtml);
    gridHost.replaceChildren(root);

    gridHost.querySelectorAll(':scope > .sch-empty-week-notice').forEach((node) => node.remove());
    if (!normalizedItems.length) {
        gridHost.appendChild(buildTimetableEmptyWeekNotice(
            weekStart,
            `No sessions scheduled for ${formatWeekRangeLabel(weekStart)}.`
        ));
    }

    const { empty } = ensureScheduleSurfaceRegions(container);
    empty.className = '';
    empty.innerHTML = '';
    empty.hidden = true;
    frame.hidden = false;
}

function renderTimetable() {
    const container = document.getElementById('timetable-master-container');
    if (!container) return; // Not on the timetable page
    syncTimetableFilterDefaults();
    const weekStart = getTimetableWeekStartForRender();
    const targetSem = document.getElementById('tt-filter-sem')
        ? parseInt(document.getElementById('tt-filter-sem').value, 10)
        : parseInt(KIU_STATE.activeSemester || 3, 10);
    const targetFac = document.getElementById('tt-filter-fac')
        ? normalizeFacultyCode(document.getElementById('tt-filter-fac').value, getCurrentFaculty())
        : getCurrentFaculty();
    const activeItems = getRoleScopedScheduleItemsForWeek(weekStart, {
        semester: targetSem,
        faculty: targetFac
    });
    syncTimetableStaticControls(weekStart, activeItems, {
        defaultView: 'sessions',
        roleLabel: getCurrentUser()?.role === USER_ROLES.STUDENT ? 'Student timetable' : 'Weekly timetable'
    });
    renderScheduleSurfaceInto(container, activeItems, {
        weekStart,
        defaultView: 'sessions',
        emptyTitle: 'No sessions for the selected week',
        emptyMessage: `No timetable sessions found for ${formatWeekRangeLabel(weekStart)}.`
    });
    const gridShell = document.querySelector('#page-timetable .sch-grid-shell[data-tt-grid="1"]');
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        window.queueLuxuryTransparencyRefresh(undefined, gridShell ? { roots: [gridShell] } : undefined);
    } else if (typeof window.updateTransparency === 'function') {
        const savedTransparency = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
        if (!Number.isNaN(savedTransparency)) {
            window.updateTransparency(savedTransparency, { force: true, persist: false, roots: gridShell ? [gridShell] : undefined });
        }
    }
}

// Function triggered when Professor clicks "Request Change"
function requestScheduleChange(courseId, groupId, day, time, weekStart = getStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY)) {
    const reason = prompt(`WARNING: You are requesting to cancel/modify your lecture for ${courseId} (${groupId}) on ${day} at ${time} during the week of ${formatWeekRangeLabel(weekStart)}.\n\nPlease provide a rigid reason (e.g. "Medical Emergency", "Conference"). This will alert the Administration and Enrolled Students immediately.`);
    if (reason) {
        alert(`CRITICAL ALERT DISPATCHED: The Administration Chancellery has received your request. Enrolled Students have been notified via SMS/Email regarding the cancellation of the physical lecture block.`);
    }
}

// --- PROFILE CALENDAR ENGINE ---
function renderProfileCalendar() {
    const container = document.getElementById('profile-calendar-container');
    if (!container) return; // Not on the profile page
    
    const weekStart = getStoredWeekStart(PROFILE_CALENDAR_WEEK_STORAGE_KEY || 'KIU_PROFILE_CALENDAR_WEEK_START');
    const activeItems = getCurrentStudentScheduleItemsForWeek(weekStart);

    renderUnifiedWeeklyScheduleGrid(container, activeItems, {
        weekStart,
        profileMode: true,
        emptyMessage: `No schedule sessions found for ${formatWeekRangeLabel(weekStart)}.`
    });
}

function renderStudentCalendarSchedule() {
    const container = document.getElementById('student-calendar-schedule-container');
    if (!container) return;
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) {
        container.innerHTML = '';
        return;
    }
    const weekStart = getStoredWeekStart(TIMETABLE_WEEK_STORAGE_KEY);
    const targetSemester = getSemesterNumberFromControl('tt-filter-sem', KIU_STATE.activeSemester || 3);
    const items = getCurrentStudentScheduleItemsForWeek(weekStart, { semester: targetSemester });
    renderUnifiedWeeklyScheduleGrid(container, items, {
        weekStart,
        emptyMessage: `No selected class sessions found for ${formatWeekRangeLabel(weekStart)}.`
    });
}

function getStudentScheduleItemsForWeek(studentId, weekStart, options = {}) {
    const normalizedId = String(studentId || '').trim();
    if (!normalizedId) return [];
    const schedule = typeof normalizeStudentScheduleValue === 'function'
        ? normalizeStudentScheduleValue(KIU_STATE?.studentSchedulesByStudent?.[normalizedId])
        : (Array.isArray(KIU_STATE?.studentSchedulesByStudent?.[normalizedId]) ? KIU_STATE.studentSchedulesByStudent[normalizedId] : []);
    const targetSemester = options.semester ? parseInt(options.semester, 10) : null;
    const items = [];
    schedule.forEach((scheduleItem) => {
        const groupObj = typeof resolveScheduledGroupForWeek === 'function'
            ? resolveScheduledGroupForWeek(scheduleItem.courseId, scheduleItem.groupId, weekStart)
            : scheduleItem;
        if (!groupObj) return;
        const normalizedSemester = parseInt(groupObj.semester || scheduleItem.semester || 0, 10) || null;
        if (targetSemester && normalizedSemester && normalizedSemester !== targetSemester) return;
        items.push({
            ...groupObj,
            courseId: scheduleItem.courseId,
            courseName: scheduleItem.courseName || groupObj.courseName || scheduleItem.courseId,
            groupId: scheduleItem.groupId,
            semester: normalizedSemester || groupObj.semester || scheduleItem.semester || null,
            sessionType: scheduleItem.sessionType || groupObj.sessionType || 'lecture',
            faculty: scheduleItem.faculty || groupObj.faculty
        });
    });
    return items;
}

const STUDENT_ADMIN_EMBED_TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '24:00'];

function renderStudentAdminScheduleEmbed(studentId) {
    const controls = document.getElementById('student-academic-schedule-controls');
    const canvas = document.getElementById('student-academic-schedule-canvas');
    if (!controls || !canvas || !studentId) return;
    const weekKey = getStudentAdminScheduleWeekKey(studentId);
    const weekStart = getStoredWeekStart(weekKey);
    const items = getStudentScheduleItemsForWeek(studentId, weekStart);
    const viewStorageKey = getStudentAdminScheduleViewKey(studentId);
    const defaultView = 'timetable';
    const embedSurfaceOptions = {
        weekStart,
        defaultView,
        viewStorageKey,
        timetableOnly: true,
        showNowLine: false,
        slotHeight: 36,
        shellHeaderPad: 52,
        minEventHeight: 28,
        eventHeightInset: 4,
        timeSlots: STUDENT_ADMIN_EMBED_TIME_SLOTS,
        profileMode: true,
        emptyTitle: 'No sessions for the selected week',
        emptyMessage: `No timetable sessions found for ${formatWeekRangeLabel(weekStart)}.`
    };
    renderScheduleControls('student-academic-schedule-controls', weekStart, items, {
        compactEmbed: true,
        timetableOnly: true,
        defaultView,
        viewStorageKey,
        roleLabel: 'Student schedule'
    });
    renderScheduleSurfaceInto(canvas, items, embedSurfaceOptions);
    const gridShell = canvas.querySelector('.sch-grid-shell[data-tt-grid="1"]');
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        window.queueLuxuryTransparencyRefresh(undefined, gridShell ? { roots: [gridShell] } : undefined);
    }
}

window.getStudentScheduleItemsForWeek = getStudentScheduleItemsForWeek;
window.renderStudentAdminScheduleEmbed = renderStudentAdminScheduleEmbed;
