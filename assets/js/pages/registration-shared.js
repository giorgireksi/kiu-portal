/* Wave bag: Wave 26 registration-shared */
window.KiuRegistrationShared = window.KiuRegistrationShared || {};
const __kiuRegSharedApi = window.KiuRegistrationShared;
window.__kiuRegSharedApi = __kiuRegSharedApi;
function __kiuRegSharedExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuRegSharedApi[key] = map[key];
        window[key] = map[key];
    });
}

/* Shared registration helper surface for admin and student registration runtimes. */

function normalizeStudentRegistrationCourseIds(registrationValue) {
    const collected = [];
    const addCourse = (value) => {
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
    return [...new Set(collected.map((courseId) => String(courseId).trim()).filter(Boolean))];
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
    const facultyProfiles = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const subjects = [];
    const seen = new Set();

    Object.keys(facultyProfiles || {}).forEach((facultyCode) => {
        (getActiveCurriculum(facultyCode) || []).forEach((subject) => {
            const key = canonicalCourseKey(subject?.id);
            if (!key || seen.has(key)) return;
            seen.add(key);
            subjects.push(subject);
        });
    });

    (KIU_STATE.curriculum || []).forEach((subject) => {
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
            .find((subject) => canonicalCourseKey(subject?.id) === targetKey);
        if (preferredById) return preferredById;
    }

    if (targetKey) {
        const exactById = allSubjects.find((subject) => canonicalCourseKey(subject?.id) === targetKey);
        if (exactById) return exactById;
    }

    if (titleKey && preferredFaculty) {
        const preferredByTitle = (getActiveCurriculum(preferredFaculty) || [])
            .find((subject) => normalizeSubjectTitleKey(subject?.name) === titleKey);
        if (preferredByTitle) return preferredByTitle;
    }

    if (!titleKey) return null;
    return allSubjects.find((subject) => normalizeSubjectTitleKey(subject?.name) === titleKey) || null;
}

function getEquivalentCurriculumSubjectIds(subjectId, subjectTitle = '', preferredFaculty = null) {
    const matchedSubject = findCurriculumSubjectByIdOrTitle(subjectId, subjectTitle, preferredFaculty);
    const matchedTitleKey = normalizeSubjectTitleKey(matchedSubject?.name || subjectTitle);
    const ids = new Set();
    if (subjectId) ids.add(String(subjectId).trim());
    if (matchedSubject?.id) ids.add(String(matchedSubject.id).trim());
    if (!matchedTitleKey) return [...ids].filter(Boolean);

    getAllCurriculumSubjects().forEach((subject) => {
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
            .find((item) => {
                if (String(item?.id || '').trim().toLowerCase() !== normalizedGroupId) return false;
                const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(candidateId) : '';
                const groupFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
                return groupFaculty === activeFaculty;
            });
        if (group) return { courseId: candidateId, group };
    }
    return null;
}

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
    const byCanonical = new Map((subjectList || []).map((subject) => [canonicalCourseKey(subject.id), subject.id]));
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
        .map((subject) => ({ id: subject.id, key: canonicalCourseKey(subject.id) }))
        .filter((subject) => subject.key.startsWith(compactBase))
        .sort((left, right) => left.key.length - right.key.length);

    return prefixMatches[0]?.id || null;
}

function getRegisteredOrPassedCourses(studentId) {
    const keySet = new Set();
    const addCourse = (courseId) => {
        const key = canonicalCourseKey(courseId);
        if (key) keySet.add(key);
    };

    (KIU_STATE.studentPassedCourses?.[studentId] || []).forEach(addCourse);

    const facultyProfiles = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    const subjectList = [
        ...Object.keys(facultyProfiles || {}).flatMap((facultyCode) => getActiveCurriculum(facultyCode) || []),
        ...(KIU_STATE.curriculum || [])
    ].filter((subject, index, array) => subject?.id && array.findIndex((candidate) => candidate?.id === subject.id) === index);

    Object.entries(KIU_STATE.studentGrades || {}).forEach(([rosterId, roster]) => {
        const record = (roster || []).find((entry) => String(entry.id) === String(studentId));
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
        const missing = requiredCourseIds.filter((requiredCourseId) => !passedCourseSet.has(canonicalCourseKey(requiredCourseId)));
        if (missing.length > 0) {
            reasons.push(`Prerequisite course(s) not completed: ${missing.join(', ')}`);
        }
    }

    const antiCourseIds = parseRequiredCourseIds(courseDef?.antireq);
    if (antiCourseIds.length > 0) {
        const blocked = antiCourseIds.filter((requiredCourseId) => passedCourseSet.has(canonicalCourseKey(requiredCourseId)));
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

function closeAdminRegManageModal() {
    if (typeof window.__kiuAdminRegManageCleanup === 'function') {
        window.__kiuAdminRegManageCleanup();
        window.__kiuAdminRegManageCleanup = null;
    }
    const existing = document.getElementById('kiu-admin-reg-manage-modal');
    if (existing) existing.remove();
}

function closeLuxuryConfirmModal() {
    if (typeof window.__kiuLuxuryConfirmCleanup === 'function') {
        window.__kiuLuxuryConfirmCleanup();
        window.__kiuLuxuryConfirmCleanup = null;
    }
    const existing = document.getElementById('kiu-luxury-confirm-modal');
    if (existing) existing.remove();
}

function openLuxuryConfirmModal(config = {}) {
    closeLuxuryConfirmModal();

    const {
        title = 'Confirm',
        subtitle = '',
        message = '',
        danger = false,
        confirmLabel = 'Confirm',
        onConfirm
    } = config;

    const modal = document.createElement('div');
    modal.id = 'kiu-luxury-confirm-modal';
    modal.className = 'registration-structured-modal-backdrop';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--event-create social-neo-dialog-card--lms-create';
    card.dataset.luxTransparencyExempt = '1';
    card.dataset.luxGlassRoot = '1';

    const head = document.createElement('div');
    head.className = 'social-neo-section-head social-neo-dialog-head';

    const heading = document.createElement('div');
    heading.className = 'social-neo-dialog-heading';

    const titleStrong = document.createElement('strong');
    titleStrong.className = 'social-neo-dialog-title';
    const titleIcon = document.createElement('i');
    titleIcon.className = `fas ${danger ? 'fa-triangle-exclamation' : 'fa-circle-question'}`;
    titleIcon.setAttribute('aria-hidden', 'true');
    const titleText = document.createElement('span');
    titleText.textContent = title;
    titleStrong.append(titleIcon, document.createTextNode(' '), titleText);

    const subtitleEl = document.createElement('span');
    subtitleEl.className = 'social-neo-dialog-subtitle';
    subtitleEl.textContent = subtitle || 'Please confirm this action.';

    heading.append(titleStrong, subtitleEl);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn';
    closeButton.setAttribute('aria-label', 'Close');
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeButton.appendChild(closeIcon);

    head.append(heading, closeButton);

    const body = document.createElement('div');
    body.className = 'social-neo-dialog-body social-neo-dialog-body--event-create';
    const messageCopy = document.createElement('div');
    messageCopy.className = 'social-neo-dialog-preview-copy';
    messageCopy.textContent = message;
    body.appendChild(messageCopy);

    const footer = document.createElement('div');
    footer.className = 'social-neo-dialog-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.className = 'social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn';
    cancelButton.textContent = 'Cancel';

    const confirmButton = document.createElement('button');
    confirmButton.type = 'button';
    confirmButton.className = `social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn${danger ? ' social-neo-dialog-submit-btn--danger' : ''}`;
    confirmButton.textContent = confirmLabel;

    footer.append(cancelButton, confirmButton);
    card.append(head, body, footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    if (document.body.classList.contains('lux-route-admin-tools')) {
        modal.dataset.luxStructuredModal = '1';
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [modal] });
        }
    }

    const close = () => closeLuxuryConfirmModal();
    const onKeyDown = (event) => {
        if (event.key === 'Escape') close();
    };
    window.__kiuLuxuryConfirmCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    closeButton.onclick = close;
    cancelButton.onclick = close;
    confirmButton.addEventListener('click', () => {
        if (typeof onConfirm === 'function') {
            onConfirm(close);
        } else {
            close();
        }
    });
    window.addEventListener('keydown', onKeyDown);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });

    setTimeout(() => {
        if (typeof confirmButton.focus === 'function') confirmButton.focus();
    }, 0);
}

function resolveAdminRegManageTitleIcon({ title } = {}) {
    const t = String(title || '').toLowerCase();
    if (t.includes('tab')) return 'fa-folder';
    if (t.includes('program')) return 'fa-graduation-cap';
    if (t.includes('group')) return 'fa-layer-group';
    if (t.includes('course') || t.includes('subject')) return 'fa-book-open';
    return 'fa-sliders';
}

function openAdminRegManageModal({
    title = 'Manage item',
    subtitle = '',
    editLabel = 'Edit',
    deleteLabel = 'Delete',
    onEdit,
    onDelete
} = {}) {
    closeAdminRegManageModal();

    const modal = document.createElement('div');
    modal.id = 'kiu-admin-reg-manage-modal';
    modal.className = 'registration-structured-modal-backdrop admin-reg-manage-modal-backdrop';
    modal.setAttribute('data-lux-transparency-exempt', '1');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    const card = document.createElement('div');
    card.className = 'social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--event-create social-neo-dialog-card--lms-create';
    card.dataset.luxTransparencyExempt = '1';
    card.dataset.luxGlassRoot = '1';

    const head = document.createElement('div');
    head.className = 'social-neo-section-head social-neo-dialog-head';

    const heading = document.createElement('div');
    heading.className = 'social-neo-dialog-heading';

    const titleStrong = document.createElement('strong');
    titleStrong.className = 'social-neo-dialog-title';
    const titleIcon = document.createElement('i');
    titleIcon.className = `fas ${resolveAdminRegManageTitleIcon({ title })}`;
    titleIcon.setAttribute('aria-hidden', 'true');
    const titleText = document.createElement('span');
    titleText.textContent = title;
    titleStrong.append(titleIcon, document.createTextNode(' '), titleText);

    const subtitleEl = document.createElement('span');
    subtitleEl.className = 'social-neo-dialog-subtitle';
    subtitleEl.textContent = subtitle || 'Choose an action for this item.';

    heading.append(titleStrong, subtitleEl);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn';
    closeButton.setAttribute('aria-label', 'Close');
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeButton.appendChild(closeIcon);

    head.append(heading, closeButton);

    const body = document.createElement('div');
    body.className = 'social-neo-dialog-body social-neo-dialog-body--event-create';
    const actions = document.createElement('div');
    actions.className = 'admin-reg-manage-modal-actions';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'social-neo-btn social-neo-btn-ghost admin-reg-manage-modal-action';
    const editIcon = document.createElement('i');
    editIcon.className = 'fas fa-edit';
    editIcon.setAttribute('aria-hidden', 'true');
    const editText = document.createElement('span');
    editText.textContent = String(editLabel || 'Edit');
    editButton.append(editIcon, editText);
    editButton.addEventListener('click', () => {
        close();
        if (typeof onEdit === 'function') onEdit();
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'social-neo-btn social-neo-btn-ghost admin-reg-manage-modal-action admin-reg-manage-modal-action--danger';
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fas fa-trash';
    deleteIcon.setAttribute('aria-hidden', 'true');
    const deleteText = document.createElement('span');
    deleteText.textContent = String(deleteLabel || 'Delete');
    deleteButton.append(deleteIcon, deleteText);
    deleteButton.addEventListener('click', () => {
        close();
        if (typeof onDelete === 'function') onDelete();
    });

    actions.append(editButton, deleteButton);
    body.appendChild(actions);

    const footer = document.createElement('div');
    footer.className = 'social-neo-form-actions social-neo-dialog-actions';
    const dismissButton = document.createElement('button');
    dismissButton.type = 'button';
    dismissButton.className = 'social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn';
    dismissButton.textContent = 'Close';
    footer.appendChild(dismissButton);

    card.append(head, body, footer);
    modal.appendChild(card);
    document.body.appendChild(modal);

    if (document.body.classList.contains('lux-route-admin-tools')) {
        modal.dataset.luxStructuredModal = '1';
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [modal] });
        }
    }

    const close = () => closeAdminRegManageModal();
    const onKeyDown = (event) => {
        if (event.key === 'Escape') close();
    };
    window.__kiuAdminRegManageCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    closeButton.onclick = close;
    dismissButton.onclick = close;
    window.addEventListener('keydown', onKeyDown);
    modal.addEventListener('click', (event) => {
        if (event.target === modal) close();
    });

    setTimeout(() => {
        if (typeof editButton.focus === 'function') editButton.focus();
    }, 0);
}

function jsQuote(value) {
    return `'${String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function toPositiveInt(value, fallback = 0) {
    const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveStructuredFormTitleIcon(config) {
    if (config?.titleIcon) return String(config.titleIcon);
    const title = String(config?.title || '').toLowerCase();
    if (title.includes('group')) return 'fa-layer-group';
    if (title.includes('module')) return 'fa-cubes';
    if (title.includes('program')) return 'fa-graduation-cap';
    if (title.includes('subject') || title.includes('course')) return 'fa-book-open';
    if (title.includes('edit')) return 'fa-pen';
    if (title.includes('new') || title.includes('create')) return 'fa-plus';
    return 'fa-pen-to-square';
}

function buildStructuredFormFieldNode(field) {
    const id = field.name;
    const wrapper = document.createElement('label');
    wrapper.className = 'social-neo-dialog-field';
    wrapper.htmlFor = id;

    const label = document.createElement('span');
    label.className = 'social-neo-label';
    label.textContent = field.label || field.name;
    wrapper.appendChild(label);

    let control;
    if (field.type === 'textarea') {
        control = document.createElement('textarea');
        control.rows = field.rows || 3;
        control.className = `social-neo-input lux-control${field.readonly || field.disabled ? ' is-muted' : ''}`;
        control.value = field.value == null ? '' : String(field.value);
    } else if (field.type === 'select') {
        control = document.createElement('select');
        control.className = `social-neo-input lux-control${field.disabled ? ' is-muted' : ''}`;
        (field.options || []).forEach((optionConfig) => {
            const option = document.createElement('option');
            option.value = String(optionConfig.value);
            option.textContent = String(optionConfig.label);
            option.selected = String(optionConfig.value) === String(field.value);
            control.appendChild(option);
        });
    } else {
        control = document.createElement('input');
        control.type = field.type || 'text';
        control.className = `social-neo-input lux-control${field.readonly || field.disabled ? ' is-muted' : ''}`;
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
        help.className = 'registration-structured-help';
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
    modal.className = 'registration-structured-modal-backdrop';
    modal.setAttribute('data-lux-transparency-exempt', '1');

    const form = document.createElement('form');
    form.id = 'kiu-structured-form';
    form.className = 'social-neo-dialog-card social-neo-dialog-card--form social-neo-dialog-card--event-create social-neo-dialog-card--lms-create';
    form.dataset.luxTransparencyExempt = '1';
    form.dataset.luxGlassRoot = '1';

    const head = document.createElement('div');
    head.className = 'social-neo-section-head social-neo-dialog-head';

    const heading = document.createElement('div');
    heading.className = 'social-neo-dialog-heading';

    const titleStrong = document.createElement('strong');
    titleStrong.className = 'social-neo-dialog-title';
    const titleIcon = document.createElement('i');
    titleIcon.className = `fas ${resolveStructuredFormTitleIcon(config)}`;
    titleIcon.setAttribute('aria-hidden', 'true');
    const titleText = document.createElement('span');
    titleText.textContent = config.title || 'Edit Item';
    titleStrong.append(titleIcon, document.createTextNode(' '), titleText);

    const subtitle = document.createElement('span');
    subtitle.className = 'social-neo-dialog-subtitle';
    subtitle.textContent = config.subtitle || 'Fill in the details below.';

    heading.append(titleStrong, subtitle);

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.id = 'kiu-structured-form-close';
    closeButton.className = 'social-neo-btn social-neo-btn-ghost social-neo-dialog-close-btn';
    closeButton.setAttribute('aria-label', 'Close');
    const closeIcon = document.createElement('i');
    closeIcon.className = 'fas fa-times';
    closeButton.appendChild(closeIcon);

    head.append(heading, closeButton);

    const body = document.createElement('div');
    body.className = 'social-neo-dialog-body social-neo-dialog-body--event-create lux-scrollbar';

    const grid = document.createElement('div');
    grid.className = `social-neo-form-grid${fields.length >= 2 ? ' social-neo-form-grid-2' : ''}`;
    fields.forEach((field) => grid.appendChild(buildStructuredFormFieldNode(field)));
    body.appendChild(grid);

    const footer = document.createElement('div');
    footer.className = 'social-neo-form-actions social-neo-dialog-actions';

    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.id = 'kiu-structured-form-cancel';
    cancelButton.className = 'social-neo-btn social-neo-btn-ghost social-neo-dialog-cancel-btn';
    cancelButton.textContent = 'Cancel';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.className = 'social-neo-btn social-neo-btn-primary social-neo-dialog-submit-btn';
    submitButton.textContent = config.submitLabel || 'Save';

    footer.append(cancelButton, submitButton);
    form.append(head, body, footer);
    modal.appendChild(form);
    document.body.appendChild(modal);

    if (document.body.classList.contains('lux-route-admin-tools')) {
        modal.dataset.luxStructuredModal = '1';
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [modal] });
        }
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(modal);
        }
    }

    const onKeyDown = (event) => {
        if (event.key === 'Escape') close();
    };
    const close = () => closeStructuredFormModal();
    window.__kiuStructuredFormCleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
    };
    if (closeButton) closeButton.onclick = close;
    if (cancelButton) cancelButton.onclick = close;
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
            fields.forEach((field) => {
                const element = document.getElementById(field.name);
                values[field.name] = element ? element.value : '';
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


function getAssignedCourseEctsTotal(courses) {
    return (courses || []).reduce((sum, course) => sum + getCourseEctsValue(course), 0);
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
    return [...entries].sort((left, right) => normalizeStudentRegistrationAssessmentNumber(left?.number, 1) - normalizeStudentRegistrationAssessmentNumber(right?.number, 1));
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
        const record = (roster || []).find((entry) => String(entry.id) === String(studentId));
        if (!record) return;
        if (!isGradeRecordPassedByKiuRule(record, rosterId)) return;

        const subjectList = [
            ...Object.keys(KIU_STATE.facultyProfiles || {}).flatMap((facultyCode) => getActiveCurriculum(facultyCode) || []),
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

    Object.keys(KIU_STATE.facultyProfiles || {}).forEach((facultyCode) => {
        (getActiveCurriculum(facultyCode) || []).forEach(addCourse);
    });
    (KIU_STATE.curriculum || []).forEach(addCourse);

    return getStudentCompletedEctsForCourseIds(studentId, [...courseMap.values()], preferredFaculty);
}

function getStudentCompletedEctsThisSemester(studentId, preferredFaculty = null) {
    const activeFaculty = normalizeFacultyCode(preferredFaculty || getCurrentFaculty(), 'ECON');
    const scheduledEntries = normalizeStudentScheduleEntries(KIU_STATE.studentSchedulesByStudent?.[studentId])
        .filter((item) => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(item?.courseId) : '';
            const entryFaculty = normalizeFacultyCode(item?.faculty || derivedFaculty || activeFaculty, activeFaculty);
            return entryFaculty === activeFaculty;
        });
    const scheduledCourseIds = [
        ...scheduledEntries.map((item) => item?.courseId).filter(Boolean),
        ...normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations?.[studentId])
    ];
    const uniqueCourseIds = [...new Set(scheduledCourseIds.map((courseId) => canonicalCourseKey(courseId)))]
        .map((key) => scheduledCourseIds.find((courseId) => canonicalCourseKey(courseId) === key))
        .filter(Boolean);
    return getStudentCompletedEctsForCourseIds(studentId, uniqueCourseIds, preferredFaculty);
}

function getStudentRegisteredEctsTotal(studentId, preferredFaculty = null) {
    const registrations = normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations?.[studentId]);
    const uniqueIds = [...new Set(registrations.map(canonicalCourseKey))];
    return uniqueIds.reduce((sum, key) => {
        const courseId = registrations.find((id) => canonicalCourseKey(id) === key);
        const course = getCourseByIdForRegistration(courseId, preferredFaculty);
        return sum + (course ? getCourseEctsValue(course) : 0);
    }, 0);
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

/* Registration trackData adapter (shared by admin + student routes). */

const REGISTRATION_TRACK_MAIN_GROUP = 'Main';
const REGISTRATION_TRACK_MIGRATION_VERSION = 1;

const REGISTRATION_BUILTIN_TABS = {
    prog: {
        id: 'prog',
        label: 'Program',
        shellId: 'program',
        studentTabId: 'prog',
        layout: 'modules',
        listTitle: 'Program Modules',
        paneSubtitle: 'Program Module Subjects'
    },
    free: {
        id: 'free',
        label: 'Free Credits',
        shellId: 'free',
        studentTabId: 'free',
        layout: 'modules',
        listTitle: 'Free Credit Modules',
        paneSubtitle: 'Free Credit Subjects'
    },
    conc: {
        id: 'conc',
        label: 'Concentration',
        shellId: 'concentration',
        studentTabId: 'conc',
        layout: 'track',
        listTitle: 'Concentration Programs'
    },
    minor: {
        id: 'minor',
        label: 'Minor',
        shellId: 'minor',
        studentTabId: 'minor',
        layout: 'track',
        listTitle: 'Minor Programs'
    }
};

function ensureRegistrationTrackMeta() {
    if (!KIU_STATE.meta || typeof KIU_STATE.meta !== 'object') {
        KIU_STATE.meta = {};
    }
    if (!KIU_STATE.meta.adminRegTrackMigrationByFaculty || typeof KIU_STATE.meta.adminRegTrackMigrationByFaculty !== 'object') {
        KIU_STATE.meta.adminRegTrackMigrationByFaculty = {};
    }
    return KIU_STATE.meta;
}

function hasRegistrationTrackMigration(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const meta = ensureRegistrationTrackMeta();
    return Number(meta.adminRegTrackMigrationByFaculty[fac] || 0) >= REGISTRATION_TRACK_MIGRATION_VERSION;
}

function markRegistrationTrackMigration(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    ensureRegistrationTrackMeta().adminRegTrackMigrationByFaculty[fac] = REGISTRATION_TRACK_MIGRATION_VERSION;
}

function ensureRegistrationTrackBucket(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.registrationCMSByFaculty) {
        KIU_STATE.registrationCMSByFaculty = {};
    }
    if (!KIU_STATE.registrationCMSByFaculty[fac]) {
        KIU_STATE.registrationCMSByFaculty[fac] = {
            concCourseData: {},
            minorProgramData: {},
            trackData: {},
            customTabs: [],
            builtinTabOverrides: {},
            hiddenBuiltinTabs: []
        };
    }
    const bucket = KIU_STATE.registrationCMSByFaculty[fac];
    if (!bucket.trackData || typeof bucket.trackData !== 'object') {
        bucket.trackData = {};
    }
    if (!Array.isArray(bucket.customTabs)) {
        bucket.customTabs = [];
    }
    if (!bucket.builtinTabOverrides || typeof bucket.builtinTabOverrides !== 'object') {
        bucket.builtinTabOverrides = {};
    }
    if (!Array.isArray(bucket.hiddenBuiltinTabs)) {
        bucket.hiddenBuiltinTabs = [];
    }
    return bucket;
}

function cloneRegistrationTrackGroup(group = {}) {
    return {
        maxEcts: Number(group.maxEcts || parseEctsProgress(group.ects || '0/0').max || 0),
        completedEcts: Number(group.completedEcts || 0),
        ects: group.ects || `${Number(group.maxEcts || 0)}/${Number(group.completedEcts || 0)}`,
        courses: Array.isArray(group.courses) ? cloneJson(group.courses) : []
    };
}

function submoduleToRegistrationTrackCourse(subModule = {}) {
    const courseId = subModule.sourceCourseId
        || (Array.isArray(subModule.courses) ? subModule.courses[0] : '')
        || subModule.id
        || subModule.n
        || '';
    return {
        n: subModule.number || subModule.n || subModule.id || '',
        title: subModule.name || subModule.title || 'Untitled Subject',
        ects: String(subModule.ects || '6'),
        precondition: subModule.prerequisites || subModule.precondition || '',
        antireq: subModule.antireq || 'None',
        sourceCourseId: courseId,
        sourceFaculty: subModule.sourceFaculty || '',
        semesterRuleMode: subModule.semesterRuleMode || 'all',
        allowedSemesters: subModule.allowedSemesters || '',
        lectureCapacity: subModule.lectureCapacity ?? 40,
        seminarCapacity: subModule.seminarCapacity ?? 20
    };
}

function migrateRegistrationCmsToTrackModel(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (hasRegistrationTrackMigration(fac)) {
        return ensureRegistrationTrackBucket(fac);
    }

    const bucket = ensureRegistrationTrackBucket(fac);
    if (!KIU_STATE.adminProgramStructures) {
        KIU_STATE.adminProgramStructures = {};
    }
    const structures = KIU_STATE.adminProgramStructures[fac] || {};

    ['prog', 'free'].forEach((tabId) => {
        const modules = Array.isArray(structures[tabId]) ? structures[tabId] : [];
        if (!bucket.trackData[tabId] || typeof bucket.trackData[tabId] !== 'object') {
            bucket.trackData[tabId] = {};
        }
        modules.forEach((module) => {
            if (!module || typeof module !== 'object') return;
            const programName = String(module.name || module.id || 'Untitled Module').trim();
            if (!programName) return;
            const maxEcts = Number(module.maxEcts || 0);
            bucket.trackData[tabId][programName] = {
                [REGISTRATION_TRACK_MAIN_GROUP]: {
                    maxEcts,
                    completedEcts: 0,
                    ects: `${maxEcts}/0`,
                    courses: (Array.isArray(module.subModules) ? module.subModules : []).map(submoduleToRegistrationTrackCourse)
                }
            };
        });
        if (Array.isArray(structures[tabId])) {
            structures[tabId] = [];
        }
    });

    if (!bucket.trackData.conc || typeof bucket.trackData.conc !== 'object') {
        bucket.trackData.conc = {};
    }
    const concSource = bucket.concCourseData && typeof bucket.concCourseData === 'object'
        ? bucket.concCourseData
        : {};
    Object.entries(concSource).forEach(([programName, groups]) => {
        if (!groups || typeof groups !== 'object') return;
        bucket.trackData.conc[programName] = Object.fromEntries(
            Object.entries(groups).map(([groupName, group]) => [groupName, cloneRegistrationTrackGroup(group)])
        );
    });

    if (!bucket.trackData.minor || typeof bucket.trackData.minor !== 'object') {
        bucket.trackData.minor = {};
    }
    const minorSource = bucket.minorProgramData && typeof bucket.minorProgramData === 'object'
        ? bucket.minorProgramData
        : {};
    Object.entries(minorSource).forEach(([programName, program]) => {
        const courseGroups = program?.courseGroups && typeof program.courseGroups === 'object'
            ? program.courseGroups
            : {};
        bucket.trackData.minor[programName] = Object.fromEntries(
            Object.entries(courseGroups).map(([groupName, group]) => [groupName, cloneRegistrationTrackGroup(group)])
        );
    });

    markRegistrationTrackMigration(fac);
    syncRegistrationTrackLegacyMirrors(bucket, fac);
    return bucket;
}

function syncRegistrationConcMirrorFromTrack(trackConc = {}) {
    const mirror = {};
    Object.entries(trackConc).forEach(([programName, groups]) => {
        if (!groups || typeof groups !== 'object') return;
        mirror[programName] = Object.fromEntries(
            Object.entries(groups).map(([groupName, group]) => [groupName, cloneRegistrationTrackGroup(group)])
        );
    });
    return mirror;
}

function syncRegistrationMinorMirrorFromTrack(trackMinor = {}) {
    const mirror = {};
    Object.entries(trackMinor).forEach(([programName, groups]) => {
        if (!groups || typeof groups !== 'object') return;
        mirror[programName] = {
            courseGroups: Object.fromEntries(
                Object.entries(groups).map(([groupName, group]) => [groupName, cloneRegistrationTrackGroup(group)])
            )
        };
    });
    return mirror;
}

function syncRegistrationProgFreeMirrorFromTrack(trackData = {}, faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.adminProgramStructures) {
        KIU_STATE.adminProgramStructures = {};
    }
    if (!KIU_STATE.adminProgramStructures[fac]) {
        KIU_STATE.adminProgramStructures[fac] = { prog: [], free: [], conc: [], minor: [] };
    }
    ['prog', 'free'].forEach((tabId) => {
        const track = trackData[tabId] && typeof trackData[tabId] === 'object' ? trackData[tabId] : {};
        KIU_STATE.adminProgramStructures[fac][tabId] = Object.entries(track).map(([programName, groups], index) => {
            const groupList = groups && typeof groups === 'object' ? Object.values(groups) : [];
            const courses = [];
            groupList.forEach((group) => {
                (Array.isArray(group?.courses) ? group.courses : []).forEach((course) => courses.push(course));
            });
            const maxEcts = groupList.reduce((sum, group) => sum + Number(group?.maxEcts || 0), 0);
            return {
                id: programName,
                letter: String.fromCharCode(65 + (index % 26)),
                name: programName,
                maxEcts,
                minEcts: 0,
                subModules: courses.map((course) => ({
                    id: course?.n || course?.sourceCourseId || '',
                    number: course?.n || '',
                    n: course?.n || '',
                    name: course?.title || '',
                    title: course?.title || '',
                    ects: course?.ects || '',
                    prerequisites: course?.precondition || '',
                    precondition: course?.precondition || '',
                    semesterRuleMode: course?.semesterRuleMode || 'all',
                    allowedSemesters: course?.allowedSemesters || '',
                    lectureCapacity: course?.lectureCapacity ?? 40,
                    seminarCapacity: course?.seminarCapacity ?? 20,
                    sourceCourseId: course?.sourceCourseId || '',
                    sourceFaculty: course?.sourceFaculty || ''
                }))
            };
        });
    });
}

function syncRegistrationTrackLegacyMirrors(bucket, faculty) {
    if (!bucket || typeof bucket !== 'object') return bucket;
    const trackData = bucket.trackData && typeof bucket.trackData === 'object' ? bucket.trackData : {};
    bucket.concCourseData = syncRegistrationConcMirrorFromTrack(trackData.conc || {});
    bucket.minorProgramData = syncRegistrationMinorMirrorFromTrack(trackData.minor || {});
    syncRegistrationProgFreeMirrorFromTrack(trackData, faculty);
    return bucket;
}

function normalizeRegistrationTrackSeatLimit(value, fallback) {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function convertRegistrationTrackCourseRef(course) {
    return {
        courseId: getAssignedCourseId(course),
        id: course?.n || '',
        n: course?.n || '',
        title: course?.title || '',
        ects: course?.ects || '',
        precondition: course?.precondition || '',
        semesterRuleMode: course?.semesterRuleMode || 'all',
        allowedSemesters: course?.allowedSemesters || '',
        lectureCapacity: normalizeRegistrationTrackSeatLimit(course?.lectureCapacity, 40),
        seminarCapacity: normalizeRegistrationTrackSeatLimit(course?.seminarCapacity, 20)
    };
}

function convertRegistrationTrackTabForStudent(trackObj) {
    if (!trackObj || typeof trackObj !== 'object') return [];
    const normalizeArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
    const convertTrackGroup = (groupName, group, index) => ({
        id: `${groupName}-${index}`,
        letter: String.fromCharCode(65 + (index % 26)),
        name: groupName,
        maxEcts: group?.maxEcts || parseEctsProgress(group?.ects || '0/0').max || 0,
        minEcts: 0,
        courses: normalizeArray(group?.courses).map(convertRegistrationTrackCourseRef)
    });

    return Object.entries(trackObj).map(([programName, groups]) => ({
        id: programName,
        name: programName,
        modules: Object.entries(groups || {}).map(([groupName, group], index) => convertTrackGroup(groupName, group, index))
    }));
}

function convertRegistrationTrackTabForStudentModules(trackObj) {
    if (!trackObj || typeof trackObj !== 'object') return [];
    return Object.entries(trackObj).map(([programName, groups], index) => {
        const groupList = groups && typeof groups === 'object' ? Object.values(groups) : [];
        const courses = [];
        let maxEcts = 0;
        groupList.forEach((group) => {
            maxEcts += Number(group?.maxEcts || 0);
            (Array.isArray(group?.courses) ? group.courses : []).forEach((course) => {
                courses.push(convertRegistrationTrackCourseRef(course));
            });
        });
        return {
            id: programName,
            letter: String.fromCharCode(65 + (index % 26)),
            name: programName,
            maxEcts,
            minEcts: 0,
            courses
        };
    });
}

function resolveStudentRegistrationTabConfig(tabId, faculty) {
    const safeId = String(tabId || '').trim();
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const bucket = ensureRegistrationTrackBucket(fac);
    if (REGISTRATION_BUILTIN_TABS[safeId]) {
        if (Array.isArray(bucket.hiddenBuiltinTabs) && bucket.hiddenBuiltinTabs.includes(safeId)) {
            return null;
        }
        const base = { ...REGISTRATION_BUILTIN_TABS[safeId] };
        const overrides = bucket.builtinTabOverrides?.[safeId];
        if (overrides && typeof overrides === 'object') {
            const label = overrides.label || base.label;
            return {
                ...base,
                label,
                listTitle: overrides.programsLabel || overrides.listTitle || base.listTitle,
                paneSubtitle: overrides.paneSubtitle || base.paneSubtitle
            };
        }
        return base;
    }
    const custom = (bucket.customTabs || []).find((tab) => tab && (tab.id === safeId || tab.studentTabId === safeId));
    if (!custom) return null;
    const label = custom.label || custom.id;
    return {
        id: custom.id,
        label,
        shellId: custom.studentTabId || custom.id,
        studentTabId: custom.studentTabId || custom.id,
        layout: 'track',
        listTitle: custom.programsLabel || `${label} Programs`,
        paneSubtitle: custom.paneSubtitle || `${label} Subjects`
    };
}

function getStudentRegistrationTabsForFaculty(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const bucket = ensureRegistrationTrackBucket(fac);
    const builtinTabs = Object.keys(REGISTRATION_BUILTIN_TABS)
        .map((tabId) => resolveStudentRegistrationTabConfig(tabId, fac))
        .filter(Boolean);
    const customTabs = (bucket.customTabs || [])
        .filter((tab) => tab && tab.id)
        .map((tab) => resolveStudentRegistrationTabConfig(tab.id, fac))
        .filter(Boolean);
    return [...builtinTabs, ...customTabs];
}

function isStudentRegistrationModuleLayoutTab(tabId, faculty) {
    const config = resolveStudentRegistrationTabConfig(tabId, faculty);
    return config ? config.layout === 'modules' : (tabId === 'prog' || tabId === 'free');
}

function isStudentRegistrationTrackLayoutTab(tabId, faculty) {
    const config = resolveStudentRegistrationTabConfig(tabId, faculty);
    return config ? config.layout === 'track' : (tabId === 'conc' || tabId === 'minor');
}

function resolveStudentRegistrationStructureTab(shellTabId, faculty) {
    const safeShell = String(shellTabId || '').trim();
    if (safeShell === 'program') return 'prog';
    if (safeShell === 'concentration') return 'conc';
    if (safeShell === 'history' || safeShell === 'selected') return safeShell;
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const tabs = getStudentRegistrationTabsForFaculty(fac);
    const match = tabs.find((tab) => tab.shellId === safeShell || tab.tabId === safeShell || tab.id === safeShell);
    return match ? (match.studentTabId || match.id) : safeShell;
}

function countRegistrationTrackProgramsForFaculty(faculty) {
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const bucket = ensureRegistrationTrackBucket(fac);
    migrateRegistrationCmsToTrackModel(fac);
    const trackData = bucket.trackData && typeof bucket.trackData === 'object' ? bucket.trackData : {};
    const tabs = getStudentRegistrationTabsForFaculty(fac);
    return tabs.reduce((sum, tab) => {
        const track = trackData[tab.id];
        if (!track || typeof track !== 'object') return sum;
        return sum + Object.keys(track).length;
    }, 0);
}

function buildStudentRegistrationDataFromCms(faculty) {
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'ECON', 'ECON');
    const bucket = migrateRegistrationCmsToTrackModel(fac);
    const trackData = bucket.trackData && typeof bucket.trackData === 'object' ? bucket.trackData : {};
    const tabs = getStudentRegistrationTabsForFaculty(fac);
    const result = { prog: [], free: [], conc: [], minor: [] };

    tabs.forEach((tab) => {
        const track = trackData[tab.id] || {};
        const tabKey = tab.studentTabId || tab.id;
        if (tab.layout === 'modules') {
            result[tabKey] = convertRegistrationTrackTabForStudentModules(track);
        } else {
            result[tabKey] = convertRegistrationTrackTabForStudent(track);
        }
    });

    return result;
}

function getStudentRegistrationDataForTabFromCms(faculty, tabId) {
    const derived = buildStudentRegistrationDataFromCms(faculty);
    const derivedData = derived?.[tabId];
    if (Array.isArray(derivedData)) {
        return derivedData;
    }
    const fac = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const legacyData = KIU_STATE.registrationStructures?.[fac]?.[tabId];
    return Array.isArray(legacyData) ? legacyData : [];
}

function normalizeRegistrationRemoveVerificationToken(value) {
    return String(value || '').trim().toUpperCase();
}

function runRegistrationRemoveVerification({
    step1Text = '',
    step2Text = '',
    promptText = '',
    expectedToken = ''
} = {}) {
    const normalizedExpected = normalizeRegistrationRemoveVerificationToken(expectedToken);
    if (!normalizedExpected) return false;
    if (typeof window.confirm !== 'function' || typeof window.prompt !== 'function') {
        return false;
    }
    if (!window.confirm(String(step1Text || 'Remove this registration item?'))) return false;
    if (!window.confirm(String(step2Text || 'This action cannot be undone.'))) {
        return false;
    }
    const typedValue = window.prompt(
        String(promptText || `Type ${normalizedExpected} to confirm removal.`),
        ''
    );
    if (typedValue == null) return false;
    if (normalizeRegistrationRemoveVerificationToken(typedValue) !== normalizedExpected) {
        if (typeof showToast === 'function') {
            showToast('Removal cancelled. Confirmation text did not match.');
        }
        return false;
    }
    return true;
}

function buildAdminRegTabRemoveVerification(tabId, tabConfig, programCount = 0) {
    const label = String(tabConfig?.label || tabId).trim();
    const safeTabId = String(tabId || '').trim();
    const expectedToken = normalizeRegistrationRemoveVerificationToken(safeTabId);
    const programLabel = Number(programCount) === 1 ? '1 program' : `${Number(programCount) || 0} programs`;
    return {
        step1Text: `Delete custom registration tab "${label}"?`,
        step2Text: `This permanently removes the tab and ${programLabel} with all groups and subjects. Students will no longer see this lane.`,
        promptText: `Step 3 of 3: Type ${expectedToken} to confirm tab deletion.`,
        expectedToken
    };
}

function buildAdminRegBuiltinTabRemoveVerification(tabId, tabConfig) {
    const label = String(tabConfig?.label || tabId).trim();
    const safeTabId = String(tabId || '').trim();
    const expectedToken = normalizeRegistrationRemoveVerificationToken(safeTabId);
    return {
        step1Text: `Hide built-in registration tab "${label}" for this faculty?`,
        step2Text: 'The tab will disappear from admin and student registration for this faculty. Program data stays saved and can be restored later.',
        promptText: `Step 3 of 3: Type ${expectedToken} to confirm hiding this tab.`,
        expectedToken
    };
}

function runRegistrationRemoveConfirmation({
    step1Text = '',
    step2Text = ''
} = {}) {
    if (typeof window.confirm !== 'function') return false;
    if (!window.confirm(String(step1Text || 'Remove this registration item?'))) return false;
    if (!window.confirm(String(step2Text || 'This action cannot be undone.'))) return false;
    return true;
}

function buildAdminRegProgramRemoveVerification(tabId, programName, tabConfig) {
    const label = String(tabConfig?.label || tabId || 'Program').trim();
    const safeName = String(programName || '').trim();
    const groupCount = Object.keys(getAdminRegTrackDataForVerification(tabId, programName)).length;
    const groupLabel = groupCount === 1 ? '1 group' : `${groupCount} groups`;
    return {
        step1Text: `Delete program "${safeName}" from ${label}?`,
        step2Text: `This permanently removes ${groupLabel} and all subjects under "${safeName}".`
    };
}

function buildAdminRegGroupRemoveVerification(tabId, programName, groupName) {
    const safeProgram = String(programName || '').trim();
    const safeGroup = String(groupName || '').trim();
    const group = getAdminRegTrackDataForVerification(tabId, programName)[safeGroup];
    const subjectCount = Array.isArray(group?.courses) ? group.courses.length : 0;
    const subjectLabel = subjectCount === 1 ? '1 subject' : `${subjectCount} subjects`;
    return {
        step1Text: `Delete group "${safeGroup}" from "${safeProgram}"?`,
        step2Text: `This permanently removes ${subjectLabel} assigned to "${safeGroup}".`
    };
}

function buildAdminRegSubjectRemoveVerification(tabId, programName, groupName, course) {
    const safeTitle = String(course?.title || 'this subject').trim();
    const safeGroup = String(groupName || '').trim();
    return {
        step1Text: `Delete subject "${safeTitle}" from "${safeGroup}"?`,
        step2Text: 'Students will no longer see this subject in the registration lane.'
    };
}

function getAdminRegTrackDataForVerification(tabId, programName) {
    if (typeof window.getAdminRegTrackData === 'function') {
        const track = window.getAdminRegTrackData(tabId) || {};
        const program = track[String(programName || '').trim()];
        return program && typeof program === 'object' ? program : {};
    }
    return {};
}

function purgeStudentRegistrationTrackSelectionForTab(tabId, studentTabId = tabId) {
    const ids = [...new Set([tabId, studentTabId].filter(Boolean).map((value) => String(value).trim()).filter(Boolean))];
    if (!ids.length) return;
    const store = KIU_STATE.studentRegistrationTrackSelection;
    if (!store || typeof store !== 'object') return;
    ids.forEach((id) => {
        delete store[id];
        Object.values(store).forEach((scope) => {
            if (scope && typeof scope === 'object') {
                delete scope[id];
            }
        });
    });
}

__kiuRegSharedExpose({
    getAssignedCourseCurriculumDetails,
    buildRegistrationCourseMeta,
    getAssignedCourseCurriculumSummary,
    getSemesterRestrictionFieldConfig,
    getTrackGroupProgress,
    normalizeAssignedSemesterRestriction,
    getAssignedCourseId,
    getCourseEctsValue,
    getAssignedCourseEctsTotal,
    parseAllowedSemesterList,
    getAssignedSemesterRestrictionLabel,
    getAssignedSemesterRestrictionReason,
    migrateRegistrationCmsToTrackModel,
    syncRegistrationTrackLegacyMirrors,
    convertRegistrationTrackTabForStudent,
    convertRegistrationTrackTabForStudentModules,
    buildStudentRegistrationDataFromCms,
    getStudentRegistrationDataForTabFromCms,
    getStudentRegistrationTabsForFaculty,
    resolveStudentRegistrationStructureTab,
    resolveStudentRegistrationTabConfig,
    isStudentRegistrationModuleLayoutTab,
    isStudentRegistrationTrackLayoutTab,
    countRegistrationTrackProgramsForFaculty,
    normalizeRegistrationRemoveVerificationToken,
    runRegistrationRemoveVerification,
    runRegistrationRemoveConfirmation,
    buildAdminRegTabRemoveVerification,
    buildAdminRegBuiltinTabRemoveVerification,
    buildAdminRegProgramRemoveVerification,
    buildAdminRegGroupRemoveVerification,
    buildAdminRegSubjectRemoveVerification,
    openAdminRegManageModal,
    closeAdminRegManageModal,
    openLuxuryConfirmModal,
    closeLuxuryConfirmModal,
    purgeStudentRegistrationTrackSelectionForTab,
});
