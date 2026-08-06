/* Student registration route controller extracted from the legacy registration/admin bundles. */

function isRegistrationShellActive() {
    return Boolean(document.getElementById('page-registration') || document.body.classList.contains('lux-route-registration'));
}

function handleRegistrationShellClick(event) {
    if (!isRegistrationShellActive()) return;

    const tabTrigger = event.target.closest('[data-reg-tab]');
    if (tabTrigger) {
        event.preventDefault();
        if (typeof switchRegTab === 'function') switchRegTab(tabTrigger.dataset.regTab, tabTrigger);
        return;
    }

    const routeTrigger = event.target.closest('[data-registration-nav]');
    if (routeTrigger) {
        event.preventDefault();
        if (typeof navigate === 'function') navigate(routeTrigger.dataset.registrationNav);
        return;
    }

    const programCoursesTrigger = event.target.closest('[data-show-program-courses]');
    if (programCoursesTrigger) {
        event.preventDefault();
        if (typeof showProgramCourses === 'function') showProgramCourses();
        return;
    }

    const overlay = document.getElementById('modal-overlay');
    if (overlay && (event.target === overlay || event.target.closest('[data-modal-close]'))) {
        if (typeof closeAllModals === 'function') closeAllModals(event);
    }
}

function initializeRegistrationShellInteractions() {
    if (window.__registrationShellInteractionsInitialized) return;
    document.addEventListener('click', handleRegistrationShellClick);
    window.__registrationShellInteractionsInitialized = true;
}

function getRegistrationAvatarSrc(person, options = {}) {
    if (person?.photo) return person.photo;
    if (typeof getInitialsAvatarDataUrl === 'function') {
        return getInitialsAvatarDataUrl(person?.nameEn || person?.name || 'Student', options);
    }
    return '';
}

function getRegistrationGroupCapacity(group, fallback = 40) {
    const parsed = parseInt(group?.capacity ?? group?.maxStudents ?? fallback, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRegistrationGroupStats(courseId, group) {
    const capacity = getRegistrationGroupCapacity(group);
    const enrolledCount = typeof getEnrolledStudentsForGroup === 'function'
        ? getEnrolledStudentsForGroup(courseId, group?.id).length
        : 0;
    const freeSeats = Math.max(capacity - enrolledCount, 0);
    return {
        capacity,
        enrolledCount,
        freeSeats,
        isFull: freeSeats <= 0
    };
}

function getRegistrationSessionType(group) {
    const normalized = String(group?.sessionType || group?.type || group?.name || '')
        .trim()
        .toLowerCase();
    if (normalized.includes('lab')) return 'Lab';
    if (normalized.includes('seminar')) return 'Seminar';
    if (normalized.includes('exam')) return 'Exam';
    if (normalized.includes('practical')) return 'Practical';
    return 'Lecture';
}

function syncRegistrationHeaderInfo() {
    const currentUser = getCurrentUser();
    const registrationPage = document.getElementById('page-registration');
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!registrationPage || !currentUser || effectiveRole !== USER_ROLES.STUDENT) return;

    const infoRows = registrationPage.querySelectorAll('.reg-header-info > div');
    const infoMap = [
        currentUser.id || '',
        currentUser.personalNumber || currentUser.nationalId || 'N/A',
        currentUser.program || (typeof getFacultyLabel === 'function'
            ? getFacultyLabel(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty())
            : String(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty() || '')),
        String(getCurrentStudentSemesterNumber(currentUser) || 1),
        currentUser.status || 'Active',
        Number(currentUser.gpa || 0).toFixed(2),
        String(Number(currentUser.ects || 0)),
        String(KIU_STATE.probationStatus?.[currentUser.id] ? 24 : 36)
    ];
    infoRows.forEach((row, index) => {
        const spans = row.querySelectorAll('span');
        if (spans[1] && infoMap[index] != null) spans[1].textContent = infoMap[index];
    });

    const photoEl = registrationPage.querySelector('.content-box.surface-card img');
    if (photoEl) {
        photoEl.src = getRegistrationAvatarSrc(currentUser, { background: '#2563eb', size: 96 });
        photoEl.alt = currentUser.nameEn || currentUser.name || 'Student';
    }

    syncRegistrationWorkspaceSummary();
}

function syncRegistrationWorkspaceSummary() {
    const currentUser = getCurrentUser();
    const registrationPage = document.getElementById('page-registration');
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!registrationPage || !currentUser || effectiveRole !== USER_ROLES.STUDENT) return;

    const currentSchedule = Array.isArray(KIU_STATE.studentSchedulesByStudent?.[currentUser.id]) ? KIU_STATE.studentSchedulesByStudent[currentUser.id] : [];
    const selectedCount = currentSchedule.length;
    const faculty = currentUser.facultyCode || currentUser.faculty || getCurrentFaculty();
    const semester = String(getCurrentStudentSemesterNumber(currentUser) || 1);
    const totalEcts = typeof getStudentCompletedEctsThisSemester === 'function'
        ? getStudentCompletedEctsThisSemester(currentUser.id, faculty)
        : 0;
    const limit = KIU_STATE.probationStatus?.[currentUser.id] ? 24 : 36;
    const holdActive = Boolean(KIU_STATE.probationStatus?.[currentUser.id]);
    const registrationOpen = Boolean(KIU_STATE.registrationOpen);
    const statusText = registrationOpen ? 'Registration open' : 'Registration closed';
    const loadText = `${selectedCount} selected sections`;
    const ectsText = `${totalEcts} / ${limit} ECTS`;
    const remainingText = `${Math.max(limit - totalEcts, 0)} ECTS remaining`;
    const holdText = holdActive ? 'Review hold' : 'Clear';
    const academicYearLabel = typeof getCurrentAcademicYearLabel === 'function' ? getCurrentAcademicYearLabel() : '2025 / 2026';
    const termText = `${academicYearLabel} · Semester ${semester}`;

    const updates = {
        'registration-hero-load': loadText,
        'registration-summary-status': statusText,
        'registration-ects-remaining': remainingText,
        'timetable-hero-focus-time': ectsText
    };

    Object.entries(updates).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const factsEl = document.getElementById('timetable-hero-focus-facts');
    if (factsEl) {
        factsEl.innerHTML = `
            <li><i class="fas fa-exclamation-triangle"></i> <span>Hold: ${holdText}</span></li>
            <li><i class="fas fa-award"></i> <span>Limit: ${limit} ECTS max</span></li>
        `;
    }

    const metaEl = document.getElementById('timetable-hero-focus-meta');
    if (metaEl) {
        metaEl.innerHTML = `<span class="lux-hero-signal home-hover-chip"><i class="fas ${holdActive ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i> ${holdActive ? 'Hold Active' : 'Ready to Register'}</span>`;
    }

    const progressEl = document.getElementById('registration-ects-progress');
    if (progressEl) {
        const ratio = limit > 0 ? Math.min(Math.max(totalEcts / limit, 0), 1) : 0;
        progressEl.style.setProperty('--registration-progress', `${ratio * 100}%`);
        progressEl.setAttribute('aria-valuemax', String(limit));
        progressEl.setAttribute('aria-valuenow', String(totalEcts));
    }

    const termSelect = document.getElementById('registration-term-select');
    if (termSelect && termSelect.options.length) {
        const currentOption = termSelect.options[0];
        currentOption.textContent = termText;
        termSelect.value = currentOption.value;
    }
}

function renderECTSBudget() {
    if (!document.getElementById('page-registration')) return;
    syncRegistrationWorkspaceSummary();
}

function renderSelectedCoursesTab() {
    const tbody = document.querySelector('#reg-tab-selected tbody');
    if (!tbody) return;
    const currentSchedule = getCurrentStudentSchedule();

    if (!currentSchedule || currentSchedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="registration-selected-empty">No courses have been added to your schedule yet.</td></tr>';
        return;
    }

    let html = '';
    currentSchedule.forEach((course) => {
        html += `
            <tr class="registration-selected-row">
                <td class="registration-selected-cell registration-selected-cell--left">${course.groupName}</td>
                <td class="registration-selected-cell registration-selected-cell--title">${course.courseName}</td>
                <td>${course.day}</td>
                <td>${course.time}</td>
                <td>${course.room}</td>
                <td>${course.prof}</td>
                <td>${course.sessionType || getRegistrationSessionType(course)}</td>
                <td>${course.ects}</td>
                <td>${course.duration}</td>
            </tr>
        `;
    });
    tbody.innerHTML = typeof localizeHtmlMarkup === 'function' ? localizeHtmlMarkup(html) : html;
}

function refreshRegistrationUI() {
    if (!document.getElementById('page-registration')) return;
    syncRegistrationHeaderInfo();
    renderECTSBudget();

    document.querySelectorAll('.group-expansion-row').forEach((node) => node.remove());
    renderSelectedCoursesTab();
}

function updateEctsProgress() {
    renderECTSBudget();
}

function bootStudentRegistrationRoute() {
    if (!document.getElementById('page-registration')) return;
    initializeRegistrationShellInteractions();
    if (typeof renderStudentRegStructures === 'function') {
        renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
    }
    updateEctsProgress();
    refreshRegistrationUI();
    if (typeof updateTransparency === 'function') {
        const savedTransparency = parseInt(localStorage.getItem('kiuLuxurySurfaceTransparency') || '13', 10);
        if (!Number.isNaN(savedTransparency)) {
            updateTransparency(savedTransparency);
        }
    }
}

document.addEventListener('DOMContentLoaded', bootStudentRegistrationRoute);

window.addEventListener('load', () => {
    const container = document.getElementById('student-reg-content-container');
    if (container && !container.children.length && typeof renderStudentRegStructures === 'function') {
        renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
    }
    if (document.getElementById('page-registration')) {
        updateEctsProgress();
        renderSelectedCoursesTab();
    }
});
