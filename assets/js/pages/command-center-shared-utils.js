/* Shared pure helpers for staff + students command centers.
 * Each command-center IIFE sets:
 *   window.__KIU_COMMAND_CENTER_HUB__
 *   window.__KIU_COMMAND_CENTER_ENTITY__
 *   window.__KIU_COMMAND_CENTER_TOAST_ID__
 *   window.__KIU_COMMAND_CENTER_TOAST_TIMER_KEY__
 *   window.__KIU_COMMAND_CENTER_MODAL_ROOT__
 *   window.__KIU_COMMAND_CENTER_FIELD_NS__   // 'staff' | 'student' (data-* field attrs)
 */
(function initCommandCenterSharedUtils() {
    'use strict';

    function ccHub() {
        return window.__KIU_COMMAND_CENTER_HUB__ || 'staff-hub';
    }
    function ccEntity() {
        return window.__KIU_COMMAND_CENTER_ENTITY__ || 'Staff';
    }
    function ccToastId() {
        return window.__KIU_COMMAND_CENTER_TOAST_ID__ || 'staff-command-toast';
    }
    function ccToastTimerKey() {
        return window.__KIU_COMMAND_CENTER_TOAST_TIMER_KEY__ || '__staffCommandToastTimer';
    }
    function ccModalRootId() {
        return window.__KIU_COMMAND_CENTER_MODAL_ROOT__ || 'staff-command-modal-root';
    }
    /** data-* field namespace: staff → data-staff-field-key; student → data-student-field-key */
    function ccFieldNs() {
        return window.__KIU_COMMAND_CENTER_FIELD_NS__ || 'staff';
    }

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeText(value, fallback = '') {
    const raw = value == null ? '' : String(value);
    const cleaned = typeof cleanupEncodingArtifacts === 'function' ? cleanupEncodingArtifacts(raw) : raw;
    const translated = typeof toEnglishText === 'function' ? toEnglishText(cleaned) : cleaned;
    const finalValue = String(translated || '').trim();
    return finalValue || fallback;
}

function normalizeSearch(value, fallback = '') {
    return normalizeText(value, fallback).toLowerCase();
}

function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
}

function todayIso() {
    return new Date().toISOString().slice(0, 10);
}

function facultyName(code) {
    const profile = typeof getFacultyProfile === 'function' ? getFacultyProfile(code) : null;
    return normalizeText(profile?.fullName || profile?.name || code || 'Faculty', 'Faculty');
}

function departmentForFaculty(code) {
    const label = facultyName(code);
    if (/business/i.test(label)) return 'Business Management';
    if (/computer/i.test(label)) return 'Computer Science';
    if (/law/i.test(label)) return 'Law';
    if (/medicine/i.test(label)) return 'Medicine';
    if (/art/i.test(label)) return 'Arts & Humanities';
    return label;
}

function humanizeFacultyName(code) {
    const label = facultyName(code);
    return /^School of /i.test(label) ? label : `School of ${label}`;
}

function completionTone(percent) {
    if (percent >= 85) return 'is-success';
    if (percent >= 65) return 'is-warning';
    return 'is-danger';
}

function modalStatusCopy(percent, touched) {
    if (!touched) return 'Fill in the required fields below.';
    if (percent >= 100) return 'All required fields are complete. Ready to save.';
    if (percent >= 65) return 'Almost there — finish the remaining required fields.';
    if (percent > 0) return 'Keep going — required fields still need attention.';
    return 'Getting started — complete the required fields below.';
}

function statusTone(value) {
    const normalized = normalizeSearch(value || '');
    if (normalized.includes('active')) return 'is-success';
    if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('invitation')) return 'is-warning';
    if (normalized.includes('archived') || normalized.includes('disabled') || normalized.includes('inactive') || normalized.includes('suspended')) return 'is-danger';
    return '';
}

function clampProgressPercent(value) {
    const percent = Number(value);
    if (!Number.isFinite(percent)) return 0;
    return Math.max(0, Math.min(100, Math.round(percent)));
}

function parseCommaList(value) {
    return String(value || '')
        .split(',')
        .map((item) => normalizeText(item))
        .filter(Boolean);
}

function parseLinks(value) {
    return String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [label, url] = line.split('|').map((part) => normalizeText(part));
            return { label: label || 'Link', url: url || '' };
        })
        .filter((link) => link.url);
}

function parseCourses(value) {
    return String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [code, name, role, semester, section, hours] = line.split('|').map((part) => normalizeText(part));
            return {
                code: code || 'COURSE',
                name: name || 'Untitled course',
                role: role || 'Instructor',
                semester: semester || 'Current semester',
                section: section || 'Default',
                hours: Number(hours || 0)
            };
        });
}

function parseOfficeHours(value) {
    return String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [day, start, end, location, mode, booking] = line.split('|').map((part) => normalizeText(part));
            return {
                day: day || 'Day TBD',
                start: start || 'Start TBD',
                end: end || 'End TBD',
                location: location || 'Location TBD',
                mode: mode || 'In person',
                booking: booking || 'By appointment'
            };
        });
}

function parseScheduleSessions(value) {
    return String(value || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
            const [courseId, sessionType, day, time, duration, room, group, capacity] = line.split('|').map((part) => normalizeText(part));
            return {
                courseId: courseId || 'COURSE',
                sessionType: sessionType || 'lecture',
                day: day || 'Mon',
                time: time || '09:00',
                duration: duration || '110min',
                room: room || 'TBD',
                group: group || 'G1',
                capacity: Math.max(1, Number(capacity || 30))
            };
        });
}

function initials(name) {
    return normalizeText(name, ccEntity())
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || String(ccEntity()).charAt(0);
}

function renderModalMissingChips(missing, touched) {
    const hub = ccHub();
    if (!touched || !missing.length) return '';
    const visible = missing.slice(0, 3);
    const extra = missing.length - visible.length;
    const chips = visible.map((item) => `<span class="${hub}-chip is-warning lux-status-pill home-hover-chip">Missing ${escapeHtml(item)}</span>`).join('');
    const more = extra > 0 ? `<span class="${hub}-chip lux-status-pill home-hover-chip">+${extra} more</span>` : '';
    return `<div class="${hub}-modal-missing">${chips}${more}</div>`;
}

function renderModalProgress(completion) {
    const hub = ccHub();
    const tone = completionTone(completion.percent);
    return `
        <div class="${hub}-modal-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${completion.percent}" aria-label="Profile completeness">
            <div class="${hub}-modal-progress-meta">
                <span>Profile completeness</span>
                <strong>${completion.percent}%</strong>
            </div>
            <div class="${hub}-modal-progress-track">
                <span class="${hub}-modal-progress-fill ${tone}" style="width: ${completion.percent}%;"></span>
            </div>
        </div>
    `;
}

function renderModalStatus(completion, touched) {
    const hub = ccHub();
    return `
        <div class="${hub}-modal-status">
            ${renderModalProgress(completion)}
            <p class="${hub}-modal-status-copy">${escapeHtml(modalStatusCopy(completion.percent, touched))}</p>
            ${renderModalMissingChips(completion.missing, touched)}
        </div>
    `;
}

function renderProgress(percent, copy) {
    const hub = ccHub();
    const safePercent = clampProgressPercent(percent);
    return `
        <div class="${hub}-progress">
            <div class="${hub}-progress-track">
                <span class="${hub}-progress-fill" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${safePercent}" data-${hub}-progress="${safePercent}"></span>
            </div>
            <small class="${hub}-text-muted">${copy}</small>
        </div>
    `;
}

function infoCard(label, value, full = false) {
    const hub = ccHub();
    if (full) {
        return `<article class="${hub}-info-card is-full lux-data-card home-hover-chip"><span>${escapeHtml(label)}</span><p>${escapeHtml(value || '—')}</p></article>`;
    }
    return `<article class="${hub}-info-card lux-data-card home-hover-chip"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '—')}</strong></article>`;
}

function showToast(message) {
    if (typeof document === 'undefined' || !document?.getElementById) return;
    const toast = document.getElementById(ccToastId());
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    const timerKey = ccToastTimerKey();
    clearTimeout(window[timerKey]);
    window[timerKey] = window.setTimeout(() => {
        toast.classList.remove('is-visible');
    }, 2800);
}

function profileSectionTabLabel(section) {
    const trimmed = String(section?.title ?? '').trim();
    return trimmed || 'Untitled profile';
}

/** Profile overview shell. `completion` from hub-local profileCompleteness / studentProfileCompleteness. */
function renderOverviewSection(record, completion) {
    const hub = ccHub();
    const entity = ccEntity();
    const idLabel = entity === 'Student' ? 'Student ID' : 'Staff ID';
    const missing = completion?.missing || [];
    return `
            ${missing.length ? `<div class="${hub}-warning lux-data-card"><strong>Missing profile data</strong><div>${missing.map(escapeHtml).join(', ')}</div></div>` : ''}
            <div class="${hub}-info-grid">
                ${infoCard(idLabel, record.staffId)}
                ${infoCard('Role', record.role)}
                ${infoCard('Academic rank', record.rank)}
                ${infoCard('Employment', record.employmentType)}
                ${infoCard('Department', record.department)}
                ${infoCard('Faculty / School', record.faculty)}
                ${infoCard('Campus', record.campus)}
                ${infoCard('Office', record.office || 'No office assigned')}
                ${infoCard('Biography', record.bio || 'No biography yet.', true)}
            </div>
            <section class="${hub}-info-card is-full lux-data-card">
                <span>Expertise</span>
                <div class="${hub}-chips ${hub}-chips--spaced">${(record.expertise || []).length ? record.expertise.map((item) => `<span class="${hub}-chip lux-status-pill home-hover-chip">${escapeHtml(item)}</span>`).join('') : `<span class="${hub}-chip is-warning lux-status-pill home-hover-chip">No expertise listed</span>`}</div>
            </section>
            <section class="${hub}-info-card is-full lux-data-card">
                <span>Languages</span>
                <div class="${hub}-chips ${hub}-chips--spaced">${(record.languages || []).length ? record.languages.map((item) => `<span class="${hub}-chip lux-status-pill home-hover-chip">${escapeHtml(item)}</span>`).join('') : `<span class="${hub}-chip is-warning lux-status-pill home-hover-chip">No languages listed</span>`}</div>
            </section>
        `;
}

function renderAvailabilitySection(record) {
    const hub = ccHub();
    const who = ccEntity() === 'Student' ? 'student' : 'staff member';
    return `
            <div class="${hub}-info-grid">
                ${infoCard('Office', record.office || 'No office assigned')}
                ${infoCard('Availability entries', (record.officeHours || []).length)}
            </div>
            <div class="${hub}-list">
                ${(record.officeHours || []).length ? record.officeHours.map((slot) => `
                    <article class="${hub}-list-item">
                        <strong>${escapeHtml(slot.day)} · ${escapeHtml(slot.start)}-${escapeHtml(slot.end)}</strong>
                        <small>${escapeHtml(slot.location)} · ${escapeHtml(slot.mode)} · ${escapeHtml(slot.booking)}</small>
                    </article>
                `).join('') : `<div class="${hub}-warning lux-data-card"><strong>No office hours</strong><div>Add office hours so students know when and how to contact this ${who}.</div></div>`}
            </div>
        `;
}

function renderContactSection(record) {
    const hub = ccHub();
    return `
            <div class="${hub}-info-grid">
                ${infoCard('Email', record.email)}
                ${infoCard('Phone', record.phone || 'No phone listed')}
                ${infoCard('Office', record.office || 'No office listed')}
                ${infoCard('Visibility', record.visibility)}
            </div>
            <section class="${hub}-info-card is-full lux-data-card">
                <span>Professional links</span>
                <div class="${hub}-list ${hub}-list--spaced">
                    ${(record.links || []).length ? record.links.map((link) => `<article class="${hub}-list-item"><strong>${escapeHtml(link.label)}</strong><small>${escapeHtml(link.url)}</small></article>`).join('') : `<article class="${hub}-list-item"><strong>No links listed</strong><small>Add website, ORCID, scholar profile, or department profile links.</small></article>`}
                </div>
            </section>
        `;
}

function renderDocumentsSection(record) {
    const hub = ccHub();
    return `
            <section class="${hub}-info-card is-full lux-data-card">
                <span>Profile documents</span>
                <p>Document metadata placeholder. In a live LMS, these records would connect to secure file storage, retention rules, and permissions.</p>
            </section>
            <div class="${hub}-list">
                ${(record.documents || []).length ? record.documents.map((doc) => `
                    <article class="${hub}-list-item">
                        <strong>${escapeHtml(doc.name)}</strong>
                        <small>${escapeHtml(doc.type)} · ${escapeHtml(doc.visibility)}</small>
                    </article>
                `).join('') : `<article class="${hub}-list-item"><strong>No documents</strong><small>CV, syllabus files, publication lists, or admin-only documents can be added later.</small></article>`}
            </div>
        `;
}


function clearFormErrors() {
    const hub = ccHub();
    const rootId = ccModalRootId();
    document.querySelectorAll(`#${rootId} .${hub}-field.is-invalid`).forEach((field) => field.classList.remove('is-invalid'));
}

function markInvalid(id) {
    const hub = ccHub();
    const field = document.getElementById(id)?.closest(`.${hub}-field`);
    if (field) field.classList.add('is-invalid');
}

function scrollToFirstInvalidField() {
    const hub = ccHub();
    const rootId = ccModalRootId();
    const ns = ccFieldNs();
    const field = document.querySelector(`#${rootId} .${hub}-field.is-invalid`);
    if (!field) return false;
    field.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const focusTarget = field.querySelector(`[data-${ns}-blueprint-field], .lux-picker-btn, input, textarea, select`);
    if (focusTarget && typeof focusTarget.focus === 'function') {
        focusTarget.focus({ preventScroll: true });
    }
    return true;
}

/**
 * DOM side of modal completeness (field chips, section status, progress bar, missing chips).
 * Hub IIFE supplies completion + field values + touched after soft-building the draft record.
 */
function applyModalCompletenessUI(completion, values, touched) {
    const root = document.getElementById(ccModalRootId());
    if (!root || root.hasAttribute('hidden')) return;
    const hub = ccHub();
    const ns = ccFieldNs();
    const valuesMap = values || {};
    const missing = completion?.missing || [];
    const percent = Number(completion?.percent) || 0;

    root.querySelectorAll(`[data-${ns}-field-key]`).forEach((fieldEl) => {
        const key = ns === 'student'
            ? (fieldEl.dataset.studentFieldKey || fieldEl.dataset.staffFieldKey)
            : fieldEl.dataset.staffFieldKey;
        const filled = Boolean(String(valuesMap[key] ?? '').trim());
        if (ns === 'student') fieldEl.dataset.studentFieldComplete = filled ? 'true' : 'false';
        else fieldEl.dataset.staffFieldComplete = filled ? 'true' : 'false';
    });

    root.querySelectorAll(`.${hub}-form-section`).forEach((sectionEl) => {
        const requiredFields = Array.from(sectionEl.querySelectorAll(`[data-${ns}-field-required="true"]`));
        // both hubs still stamp data-staff-section-status in blueprint markup
        const statusEl = sectionEl.querySelector('[data-staff-section-status]');
        sectionEl.classList.remove('is-complete', 'is-partial');
        statusEl?.classList.remove('is-complete', 'is-partial');
        if (!requiredFields.length) {
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-circle"></i>';
            return;
        }
        const completeCount = requiredFields.filter((field) => (
            (field.dataset.studentFieldComplete || field.dataset.staffFieldComplete) === 'true'
        )).length;
        if (completeCount === requiredFields.length) {
            sectionEl.classList.add('is-complete');
            statusEl?.classList.add('is-complete');
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-check"></i>';
        } else if (completeCount > 0) {
            sectionEl.classList.add('is-partial');
            statusEl?.classList.add('is-partial');
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-minus"></i>';
        } else if (statusEl) {
            statusEl.innerHTML = '<i class="fas fa-circle"></i>';
        }
    });

    const progress = root.querySelector(`.${hub}-modal-progress`);
    if (progress) {
        progress.setAttribute('aria-valuenow', String(percent));
        const fill = progress.querySelector(`.${hub}-modal-progress-fill`);
        const strong = progress.querySelector(`.${hub}-modal-progress-meta strong`);
        const tone = completionTone(percent);
        if (fill) {
            fill.style.width = `${percent}%`;
            fill.className = `${hub}-modal-progress-fill ${tone}`;
        }
        if (strong) strong.textContent = `${percent}%`;
    }

    const copyEl = root.querySelector(`.${hub}-modal-status-copy`);
    if (copyEl) copyEl.textContent = modalStatusCopy(percent, touched);

    const status = root.querySelector(`.${hub}-modal-status`);
    const existingMissing = root.querySelector(`.${hub}-modal-missing`);
    const missingMarkup = renderModalMissingChips(missing, touched);
    if (existingMissing) {
        if (missingMarkup) existingMissing.outerHTML = missingMarkup;
        else existingMissing.remove();
    } else if (missingMarkup && status) {
        status.insertAdjacentHTML('beforeend', missingMarkup);
    }
}


function roleTitleOptions(platformRole) {
    if (platformRole === 'ta') {
        return ['Teaching Assistant', 'Lead Teaching Assistant', 'Lab Assistant', 'Seminar Assistant'];
    }
    if (platformRole === 'student_service') {
        return ['Student Service Advisor', 'Student Service Specialist', 'Student Success Coordinator', 'Support Advisor'];
    }
    return [
        'Professor',
        'Associate Professor',
        'Assistant Professor',
        'Lecturer',
        'Visiting Professor',
        'Department Chair',
        'Program Coordinator',
        'Dean',
        'Academic Advisor'
    ];
}

function buildHoursAndSectionStats(facultyCode) {
    const hoursMap = {};
    let unassignedSections = 0;
    Object.keys((window.KIU_STATE && KIU_STATE.availableGroups) || {}).forEach((courseId) => {
        (KIU_STATE.availableGroups[courseId] || []).forEach((group) => {
            const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function'
                ? deriveFacultyFromSubjectId(courseId)
                : facultyCode;
            const groupFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(group?.faculty || derivedFaculty || facultyCode, facultyCode)
                : (group?.faculty || derivedFaculty || facultyCode);
            if (facultyCode !== 'all' && groupFaculty !== facultyCode) return;
            const duration = parseInt(String(group?.duration || '110min').match(/\d+/)?.[0] || '110', 10);
            [group?.prof, group?.ta].forEach((name) => {
                const normalizedName = normalizeText(name);
                if (normalizedName && normalizedName !== 'TBD' && normalizedName !== 'Assigned Professor' && normalizedName !== 'Assigned Teaching Assistant') {
                    hoursMap[normalizedName] = (hoursMap[normalizedName] || 0) + (duration / 60);
                }
            });
            if (!group?.prof || group.prof === 'TBD' || !group?.ta || group.ta === 'TBD') {
                unassignedSections += 1;
            }
        });
    });
    return { hoursMap, unassignedSections };
}

function getAccountStatus(user, stored) {
    if (stored?.accountStatus) return stored.accountStatus;
    const email = user?.email || '';
    if (!normalizeSearch(email)) return 'Needs Review';
    return typeof window.isInstitutionalEmail === 'function' && window.isInstitutionalEmail(email)
        ? 'Account Active'
        : 'Needs Review';
}

function getVisibilityDefault(platformRole) {
    return platformRole === 'student_service' ? 'Visible to staff only' : 'Public to students';
}

function resolveStaffRegistrationEmail(values = {}, editing = null) {
    const staffId = normalizeText(values.staff_id || editing?.staffId || '', '');
    if (typeof window.resolveRegistrationEmail === 'function') {
        return window.resolveRegistrationEmail({
            institutionalEmail: values.institutional_email || values.email,
            existingEmail: editing?.email,
            institutionalId: staffId
        });
    }
    return normalizeText(values.institutional_email || values.email || editing?.email || '', '');
}

function ensureCommandCenterStore(storeKey) {
    if (!window.KIU_STATE) window.KIU_STATE = {};
    if (!KIU_STATE[storeKey] || typeof KIU_STATE[storeKey] !== 'object') {
        KIU_STATE[storeKey] = {};
    }
    if (!KIU_STATE.users) KIU_STATE.users = [];
    if (!KIU_STATE.facultyProfiles) KIU_STATE.facultyProfiles = {};
    return KIU_STATE[storeKey];
}

function exportDirectoryJson(records, facultyCode, entityLabel = 'Staff') {
    const slug = entityLabel === 'Student' ? 'student' : 'staff';
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiu-${slug}-${String(facultyCode || 'all').toLowerCase()}-${todayIso()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${entityLabel} directory exported as JSON.`);
}

function exportDirectoryCsv(records, facultyCode, entityLabel, getRoleLabel, getCompleteness) {
    const slug = entityLabel === 'Student' ? 'student' : 'staff';
    const idHeader = entityLabel === 'Student' ? 'Student ID' : 'Staff ID';
    const roleLabelFn = typeof getRoleLabel === 'function' ? getRoleLabel : ((role) => role || '');
    const completenessFn = typeof getCompleteness === 'function' ? getCompleteness : (() => ({ percent: 0 }));
    const headers = [idHeader, 'Name', 'English Name', 'Platform Role', 'Display Role', 'Department', 'Faculty', 'Email', 'Phone', 'Office', 'Status', 'Account', 'Courses', 'Weekly Load', 'Profile Completion'];
    const rows = (records || []).map((record) => {
        const completion = completenessFn(record) || { percent: 0 };
        return [
            record.staffId,
            record.name,
            record.nameEn,
            roleLabelFn(record.platformRole),
            record.role,
            record.department,
            record.faculty,
            record.email,
            record.phone,
            record.office,
            record.status,
            record.accountStatus,
            (record.courses || []).map((course) => `${course.code} ${course.name}`).join('; '),
            `${record.scheduledHours}/${record.maxHours}`,
            `${completion.percent}%`
        ];
    });
    const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csv = [headers, ...rows].map((row) => row.map(escapeCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiu-${slug}-${String(facultyCode || 'all').toLowerCase()}-${todayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast(`${entityLabel} directory exported as CSV.`);
}

function syncGroupsForStaff(nextRecord, previousRecord = null) {
    if (!window.KIU_STATE?.availableGroups || nextRecord.platformRole === 'student_service') return;
    const assignmentKey = nextRecord.platformRole === 'ta' ? 'ta' : 'prof';
    const previousName = normalizeText(previousRecord?.name || '');
    const nextName = normalizeText(nextRecord.name || '');
    const assignmentIdKey = assignmentKey === 'ta' ? 'taId' : 'profId';
    const previousId = normalizeText(previousRecord?.id || '');
    const nextId = normalizeText(nextRecord.id || '');
    Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
        const courseFaculty = typeof deriveFacultyFromSubjectId === 'function'
            ? deriveFacultyFromSubjectId(courseId)
            : nextRecord.facultyCode;
        const normalizedCourseFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(courseFaculty || nextRecord.facultyCode, nextRecord.facultyCode)
            : (courseFaculty || nextRecord.facultyCode);
        if (normalizedCourseFaculty !== nextRecord.facultyCode) return;
        const shouldOwnCourse = (nextRecord.subjects || []).includes(normalizeText(courseId));
        KIU_STATE.availableGroups[courseId] = (KIU_STATE.availableGroups[courseId] || []).map((group) => {
            const currentName = normalizeText(group?.[assignmentKey] || '');
            const currentId = normalizeText(group?.[assignmentIdKey] || '');
            const currentTaIds = Array.isArray(group?.taIds)
                ? group.taIds.map((value) => normalizeText(value)).filter(Boolean)
                : [];
            if (shouldOwnCourse && assignmentKey === 'ta' && nextId && currentId && currentId !== nextId) {
                return {
                    ...group,
                    taIds: Array.from(new Set([...currentTaIds, currentId, nextId]))
                };
            }
            if (shouldOwnCourse && (!currentName || currentName === 'TBD' || currentName === 'Assigned Professor' || currentName === 'Assigned Teaching Assistant' || currentName === previousName || currentId === previousId)) {
                return {
                    ...group,
                    [assignmentKey]: nextName,
                    [assignmentIdKey]: nextId,
                    ...(assignmentKey === 'ta' && nextId ? { taIds: Array.from(new Set([...currentTaIds, nextId])) } : {})
                };
            }
            if (!shouldOwnCourse && (currentName === previousName || currentId === previousId || currentId === nextId || currentTaIds.includes(previousId) || currentTaIds.includes(nextId))) {
                const remainingTaIds = assignmentKey === 'ta'
                    ? currentTaIds.filter((value) => value !== previousId && value !== nextId)
                    : [];
                return {
                    ...group,
                    [assignmentKey]: assignmentKey === 'prof' ? 'Assigned Professor' : 'Assigned Teaching Assistant',
                    [assignmentIdKey]: assignmentKey === 'ta' ? (remainingTaIds[0] || '') : '',
                    ...(assignmentKey === 'ta' ? { taIds: remainingTaIds } : {})
                };
            }
            return group;
        });
    });
}


/**
 * Upsert LMS user row for a command-center profile.
 * @param {{ role?: string }} [options] - force platform role (students always 'student')
 */
function upsertUserRecord(nextRecord, existingUser, options = {}) {
    const migratedUser = typeof window.migrateInstitutionalEmailRecord === 'function'
        ? window.migrateInstitutionalEmailRecord(existingUser || {}, nextRecord.email)
        : { ...(existingUser || {}), email: nextRecord.email };
    const role = options.role != null ? options.role : nextRecord.platformRole;
    const baseUser = {
        ...(existingUser || {}),
        id: nextRecord.id,
        staffId: nextRecord.staffId,
        name: nextRecord.name,
        nameEn: nextRecord.nameEn,
        email: migratedUser.email || nextRecord.email,
        emailAliases: migratedUser.emailAliases || existingUser?.emailAliases,
        role,
        faculty: nextRecord.facultyCode,
        facultyCode: nextRecord.facultyCode,
        status: nextRecord.status,
        accountStatus: nextRecord.accountStatus,
        activationRequired: ['not invited', 'pending-activation'].includes(String(nextRecord.accountStatus || '').trim().toLowerCase()),
        photo: nextRecord.photo,
        avatar: typeof getInitialsAvatar === 'function'
            ? getInitialsAvatar(nextRecord.nameEn || nextRecord.name)
            : initials(nextRecord.nameEn || nextRecord.name),
        joinYear: nextRecord.joinYear,
        title: nextRecord.title,
        office: nextRecord.office,
        phone: nextRecord.phone,
        maxHours: nextRecord.maxHours,
        subjects: nextRecord.subjects,
        lastLogin: nextRecord.lastLogin
    };
    if (!existingUser && typeof buildProvisioningMeta === 'function') {
        Object.assign(baseUser, buildProvisioningMeta(nextRecord.id));
    }
    if (!window.KIU_STATE) window.KIU_STATE = {};
    if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
    const existingIndex = KIU_STATE.users.findIndex((user) => String(user?.id || '') === String(nextRecord.id));
    if (existingIndex >= 0) {
        KIU_STATE.users[existingIndex] = baseUser;
    } else {
        KIU_STATE.users.push(baseUser);
    }
    return baseUser;
}

/**
 * Mirror profile schedule sessions into the shared schedule store.
 * @param {{ profPlatformRoles?: string[] }} [options]
 *   staff: professor; students hub maps prof field when platformRole is student
 */
function syncScheduleSessions(nextRecord, options = {}) {
    if (nextRecord.platformRole === 'student_service') return;
    if (typeof upsertScheduledSession !== 'function') return;
    const profRoles = options.profPlatformRoles || ['professor'];
    (nextRecord.scheduleSessions || []).forEach((session) => {
        const courseId = normalizeText(session.courseId || '', '');
        if (!courseId) return;
        const sessionData = {
            id: normalizeText(session.group || 'G1', 'G1'),
            name: normalizeText(session.group || 'G1', 'G1'),
            day: normalizeText(session.day || 'Mon', 'Mon'),
            time: normalizeText(session.time || '09:00', '09:00'),
            duration: normalizeText(session.duration || '110min', '110min'),
            room: normalizeText(session.room || 'TBD', 'TBD'),
            sessionType: normalizeText(session.sessionType || 'lecture', 'lecture'),
            prof: profRoles.includes(nextRecord.platformRole) ? nextRecord.name : 'TBD',
            profId: profRoles.includes(nextRecord.platformRole) ? nextRecord.id : '',
            ta: nextRecord.platformRole === 'ta' ? nextRecord.name : 'TBD',
            taId: nextRecord.platformRole === 'ta' ? nextRecord.id : '',
            faculty: nextRecord.facultyCode,
            semester: 1,
            capacity: Math.max(1, Number(session.capacity || 30)),
            registered: 0
        };
        upsertScheduledSession(courseId, sessionData, { scope: 'recurring' });
    });
}

/**
 * Import directory JSON array.
 * deps: { defaultRole, buildDraft(faculty, role), persist(record), onDone(), successToast, failToast }
 */
function importDirectoryJson(file, deps = {}) {
    if (!file) return;
    const defaultRole = deps.defaultRole || 'professor';
    const buildDraft = deps.buildDraft;
    const persist = deps.persist;
    const onDone = deps.onDone;
    const successToast = deps.successToast || 'Directory imported.';
    const failToast = deps.failToast || 'Import failed. Please choose a valid JSON export.';
    if (typeof buildDraft !== 'function' || typeof persist !== 'function') return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            const data = JSON.parse(reader.result);
            if (!Array.isArray(data)) throw new Error('Expected array');
            data.forEach((item) => {
                const facultyCode = item.facultyCode || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
                const platformRole = normalizeText(item.platformRole || defaultRole, defaultRole);
                const record = {
                    ...buildDraft(facultyCode, platformRole),
                    ...item,
                    platformRole
                };
                persist(record);
            });
            if (typeof onDone === 'function') onDone();
            showToast(successToast);
        } catch (error) {
            showToast(failToast);
        }
    };
    reader.readAsText(file);
}


function patchCommandCenterRecord(id, ensureEntry, renderPage, mutator, toastMessage) {
    if (typeof ensureEntry !== 'function' || typeof mutator !== 'function') return null;
    const entry = ensureEntry(id);
    if (!entry) return null;
    mutator(entry);
    if (typeof window !== 'undefined' && typeof window.KIU_STATE === 'object') {
        const user = (window.KIU_STATE.users || []).find((item) => String(item?.id || '') === String(id));
        if (user) {
            user.status = entry.status || user.status;
            if (entry.status === 'Archived') user.accountStatus = 'disabled';
            else if (entry.accountStatus === 'Login Disabled') user.accountStatus = 'disabled';
            else if (entry.accountStatus === 'Account Active') user.accountStatus = 'active';
            if (typeof window.queueRealtimeUserSync === 'function') {
                window.queueRealtimeUserSync(user, {
                    syncPortalState: true,
                    allowAccountStatusChange: true
                });
            }
        }
    }
    if (typeof saveState === 'function') saveState();
    if (typeof renderPage === 'function') renderPage();
    if (toastMessage) {
        showToast(typeof toastMessage === 'function' ? toastMessage(entry) : toastMessage);
    }
    return entry;
}

function toggleLoginStatus(id, ensureEntry, renderPage) {
    return patchCommandCenterRecord(
        id,
        ensureEntry,
        renderPage,
        (entry) => {
            entry.accountStatus = entry.accountStatus === 'Login Disabled' ? 'Account Active' : 'Login Disabled';
            entry.updatedAt = todayIso();
        },
        (entry) => `Login status changed for ${entry.name}.`
    );
}

function markRecordReviewed(id, ensureEntry, renderPage) {
    return patchCommandCenterRecord(
        id,
        ensureEntry,
        renderPage,
        (entry) => {
            entry.updatedAt = todayIso();
            if (entry.accountStatus === 'Needs Review') entry.accountStatus = 'Account Active';
            const reviewer = normalizeText(
                (typeof getCurrentUser === 'function' ? getCurrentUser()?.name : null) || 'Admin',
                'Admin'
            );
            entry.notes = `${entry.notes ? `${entry.notes}\n` : ''}Reviewed on ${todayIso()} by ${reviewer}.`;
        },
        (entry) => `${entry.name} marked reviewed.`
    );
}

function inviteRecord(id, ensureEntry, renderPage) {
    return patchCommandCenterRecord(
        id,
        ensureEntry,
        renderPage,
        (entry) => {
            if (entry.accountStatus !== 'Account Active') entry.accountStatus = 'Invitation Sent';
            entry.updatedAt = todayIso();
        },
        (entry) => `Invitation status updated for ${entry.name}.`
    );
}

let activeArchiveVerification = null;

function closeArchiveVerification() {
    const root = document.getElementById('kiu-command-center-archive-verification-root');
    const overlay = root?.querySelector('.lux-glass-dialog-overlay, .lms-glass-dialog-overlay');
    const finish = () => {
        if (root) {
            root.innerHTML = '';
            root.hidden = true;
        }
        activeArchiveVerification = null;
    };
    if (overlay && typeof window.closeLuxPortalModal === 'function') {
        window.closeLuxPortalModal(overlay, { remove: false, scrollLock: true, onDone: finish });
    } else {
        finish();
    }
}

function renderArchiveVerificationStep() {
    const verification = activeArchiveVerification;
    const root = document.getElementById('kiu-command-center-archive-verification-root');
    if (!verification || !root) return;
    const name = verification.entry.name || verification.entityFallback || ccEntity();
    const safeName = escapeHtml(name);
    const safeId = escapeHtml(verification.entry.id || verification.id);
    let body = '';
    if (verification.step === 1) {
        body = `
            <p><strong>You are about to archive ${safeName}.</strong></p>
            <p class="lux-glass-dialog-subtitle">Archived records are hidden from active lists but can be restored later.</p>
            <div class="lux-data-card"><strong>Record</strong><div>${safeName}</div><small>ID: ${safeId}</small></div>
            <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                <button type="button" class="lux-secondary-btn" data-archive-verification-action="cancel">Cancel</button>
                <button type="button" class="lux-primary-btn" data-archive-verification-action="continue">Continue to step 2</button>
            </div>`;
    } else if (verification.step === 2) {
        body = `
            <p><strong>Step 2 of 3: verify the consequence.</strong></p>
            <label class="lux-glass-dialog-field" style="display:flex;gap:10px;align-items:flex-start;">
                <input type="checkbox" data-archive-verification-confirm>
                <span>I understand that <strong>${safeName}</strong> will be removed from active lists and will require restoration to appear again.</span>
            </label>
            <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                <button type="button" class="lux-secondary-btn" data-archive-verification-action="cancel">Cancel</button>
                <button type="button" class="lux-primary-btn" data-archive-verification-action="continue" disabled>Continue to final step</button>
            </div>`;
    } else {
        body = `
            <p><strong>Step 3 of 3: final confirmation.</strong></p>
            <p>Type <strong>ARCHIVE</strong> below to confirm archiving <strong>${safeName}</strong>.</p>
            <input class="lux-control" type="text" autocomplete="off" spellcheck="false" data-archive-verification-input aria-label="Type ARCHIVE to confirm" placeholder="Type ARCHIVE">
            <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions">
                <button type="button" class="lux-secondary-btn" data-archive-verification-action="cancel">Cancel</button>
                <button type="button" class="lux-primary-btn" data-archive-verification-action="finalize" disabled>Archive record</button>
            </div>`;
    }
    const title = verification.step === 1 ? 'Confirm archive' : `Archive verification · Step ${verification.step} of 3`;
    const icon = verification.step === 3 ? 'fa-triangle-exclamation' : 'fa-box-archive';
    const head = typeof window.renderLuxGlassDialogHead === 'function'
        ? window.renderLuxGlassDialogHead({ title, icon, subtitle: `Three-step protection for ${name}`, closeAttr: 'data-archive-verification-action="cancel"' })
        : `<div class="lux-glass-dialog-head"><strong class="lux-glass-dialog-title">${title}</strong></div>`;
    root.innerHTML = `<div class="lux-glass-dialog-overlay lux-hub-dialog-modal-overlay is-open" role="dialog" aria-modal="true" data-lux-transparency-exempt="1"><div class="lux-glass-dialog-card lux-glass-dialog-card--hub-dialog" data-lux-transparency-exempt="1">${head}<div class="lux-glass-dialog-body">${body}</div></div></div>`;
    const input = root.querySelector('[data-archive-verification-input]');
    if (input) input.focus();
}

function openArchiveVerification(id, ensureEntry, renderPage, entityFallback) {
    if (activeArchiveVerification) return null;
    const entry = typeof ensureEntry === 'function' ? ensureEntry(id) : null;
    if (!entry) return null;
    let root = document.getElementById('kiu-command-center-archive-verification-root');
    if (!root) {
        root = document.createElement('div');
        root.id = 'kiu-command-center-archive-verification-root';
        root.hidden = true;
        document.body.appendChild(root);
    }
    activeArchiveVerification = { id, entry, ensureEntry, renderPage, entityFallback, step: 1 };
    root.hidden = false;
    renderArchiveVerificationStep();
    const overlay = root.querySelector('.lux-glass-dialog-overlay');
    if (overlay && typeof window.openLuxPortalModal === 'function') {
        window.openLuxPortalModal(overlay, { scrollLock: true });
    }
    return entry;
}

function handleArchiveVerificationAction(action, target) {
    const verification = activeArchiveVerification;
    if (!verification) return;
    if (action === 'cancel') {
        closeArchiveVerification();
        return;
    }
    if (action === 'continue') {
        if (verification.step === 2 && !target.closest('.lux-glass-dialog-body')?.querySelector('[data-archive-verification-confirm]')?.checked) return;
        verification.step += 1;
        renderArchiveVerificationStep();
        return;
    }
    if (action === 'finalize') {
        const input = document.querySelector('#kiu-command-center-archive-verification-root [data-archive-verification-input]');
        if (String(input?.value || '').trim().toUpperCase() !== 'ARCHIVE') return;
        const { id, ensureEntry, renderPage, entityFallback } = verification;
        closeArchiveVerification();
        return patchCommandCenterRecord(
            id,
            ensureEntry,
            renderPage,
            (entry) => {
                entry.status = 'Archived';
                entry.updatedAt = todayIso();
                if (!window.KIU_STATE) window.KIU_STATE = {};
                if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
                const user = KIU_STATE.users.find((item) => String(item?.id || '') === String(id));
                if (user) user.status = 'Archived';
            },
            (entry) => `${entry.name || entityFallback || ccEntity()} archived.`
        );
    }
}

function ensureArchiveVerificationEvents() {
    if (window.__kiuArchiveVerificationEventsBound) return;
    window.__kiuArchiveVerificationEventsBound = true;
    document.addEventListener('click', (event) => {
        const action = event.target.closest('[data-archive-verification-action]');
        if (!action) return;
        event.preventDefault();
        handleArchiveVerificationAction(action.dataset.archiveVerificationAction, action);
    });
    document.addEventListener('change', (event) => {
        if (!event.target.matches('[data-archive-verification-confirm]')) return;
        const button = document.querySelector('[data-archive-verification-action="continue"]');
        if (button) button.disabled = !event.target.checked;
    });
    document.addEventListener('input', (event) => {
        if (!event.target.matches('[data-archive-verification-input]')) return;
        const button = document.querySelector('[data-archive-verification-action="finalize"]');
        if (button) button.disabled = String(event.target.value || '').trim().toUpperCase() !== 'ARCHIVE';
    });
}

function setRecordArchiveStatus(id, ensureEntry, renderPage, status, entityFallback) {
    // Archiving is terminal from the command centers. There is intentionally no
    // restore path; only the three-step archive verification can change status.
    if (status !== 'Archived') return null;
    ensureArchiveVerificationEvents();
    return openArchiveVerification(id, ensureEntry, renderPage, entityFallback);
}

function openFormSettingsWorkspace(deps = {}) {
    const getState = deps.getState;
    const renderPage = deps.renderPage;
    const closeModalFn = deps.closeModal;
    const defaultTypeId = deps.defaultTypeId || 'professor';
    const typeId = deps.typeId;
    if (typeof closeModalFn === 'function') closeModalFn();
    if (typeof getState !== 'function') return;
    const state = getState();
    state.workspace = 'form-settings';
    state.selectedId = null;
    state.builderPanel = null;
    state.activeSectionId = null;
    state.fieldAdvancedOpenId = null;
    state.fieldRemovePendingId = null;
    state.formSettingsTypeId = typeId || state.formSettingsTypeId || defaultTypeId;
    if (window.location.hash.startsWith('#profile/')) {
        history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    if (typeof renderPage === 'function') renderPage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}


/**
 * Teaching/courses profile section. `isTeachingLike(record)` chooses the empty-state warning copy.
 * Staff: isTeachingRole; students: isStudentEnrollmentActive (legacy fork message preserved).
 */
function renderTeachingSection(record, isTeachingLike) {
    const hub = ccHub();
    const teachingLike = typeof isTeachingLike === 'function' ? Boolean(isTeachingLike(record)) : false;
    const emptyCourses = teachingLike
        ? (ccEntity() === 'Student'
            ? 'This student appears to be teaching staff. Assign a course before publishing the profile.'
            : 'This staff member appears to be teaching staff. Assign a course before publishing the profile.')
        : 'Course assignments are not required for this role.';
    return `
            <div class="${hub}-info-grid">
                ${infoCard('Current courses', (record.courses || []).length)}
                ${infoCard('Weekly teaching load', `${record.scheduledHours} hours`)}
                ${infoCard('Teaching status', (record.courses || []).length ? 'Teaching this semester' : 'No current teaching assignment')}
                ${infoCard('Primary course role', record.courses?.[0]?.role || 'Not assigned')}
            </div>
            <div class="${hub}-list">
                ${(record.courses || []).length ? record.courses.map((course) => `
                    <article class="${hub}-list-item">
                        <strong>${escapeHtml(course.code)} · ${escapeHtml(course.name)}</strong>
                        <small>${escapeHtml(course.role)} · ${escapeHtml(course.semester)} · ${escapeHtml(course.section)} · ${escapeHtml(course.hours)}h/week</small>
                    </article>
                `).join('') : `<div class="${hub}-warning lux-data-card"><strong>No course assignment</strong><div>${emptyCourses}</div></div>`}
            </div>
            <section class="${hub}-info-card is-full lux-data-card">
                <span>Scheduler Sync</span>
                <div class="${hub}-list ${hub}-list--spaced">
                    ${(record.scheduleSessions || []).length ? record.scheduleSessions.map((session) => `
                        <article class="${hub}-list-item">
                            <strong>${escapeHtml(session.courseId)} · ${escapeHtml(session.group)}</strong>
                            <small>${escapeHtml(session.sessionType)} · ${escapeHtml(session.day)} · ${escapeHtml(session.time)} · ${escapeHtml(session.duration)} · ${escapeHtml(session.room)} · ${escapeHtml(session.capacity)} seats</small>
                        </article>
                    `).join('') : `<article class="${hub}-list-item"><strong>No synced schedule sessions</strong><small>Add schedule sync lines in the staff editor to create or update recurring teaching sessions.</small></article>`}
                </div>
            </section>
        `;
}


function applyHubProgressBars(scope = document) {
    if (!scope || typeof scope.querySelectorAll !== 'function') return;
    const hub = ccHub();
    const attr = `data-${hub}-progress`;
    const cssVar = `--${hub}-progress`;
    scope.querySelectorAll(`[${attr}]`).forEach((element) => {
        const fill = clampProgressPercent(element.getAttribute(attr));
        element.style.setProperty(cssVar, `${fill}%`);
    });
}

/**
 * Create-type buttons for directory header.
 * @param {boolean} isAdminSession
 * @param {() => Array<{id:string,label:string}>} getTypes
 * @param {string} primaryTypeId
 */
function renderHubTypeCreateButtons(isAdminSession, getTypes, primaryTypeId) {
    if (!isAdminSession || typeof getTypes !== 'function') return '';
    const ns = ccFieldNs(); // staff | student
    const types = getTypes() || [];
    return types.map((type) => `
            <button class="${type.id === primaryTypeId ? 'lux-primary-btn' : 'lux-secondary-btn'}" type="button" data-${ns}-action="open-create" data-${ns}-type-id="${escapeHtml(type.id)}">
                <i class="fas fa-user-plus"></i> Register ${escapeHtml(type.label)}
            </button>
        `).join('');
}

function renderHubPrimaryCreateButton(typeId, typeLabel, fallbackLabel = 'Add Profile') {
    const ns = ccFieldNs();
    const label = typeLabel ? `Register ${typeLabel}` : fallbackLabel;
    const safeTypeId = typeId || (ns === 'student' ? 'student' : 'professor');
    return `<button class="lux-primary-btn" type="button" data-${ns}-action="open-create" data-${ns}-type-id="${escapeHtml(safeTypeId)}"><i class="fas fa-user-plus"></i> ${escapeHtml(label)}</button>`;
}


function renderStatusChipHtml(value, toneClass = '') {
    if (!value) return '';
    const hub = ccHub();
    const tone = toneClass || statusTone(value);
    return `<span class="${hub}-chip lux-status-pill home-hover-chip ${tone}">${escapeHtml(value)}</span>`;
}

function renderBlueprintProfileHtml(record, activeSectionId, resolveTypeId, renderView) {
    const hub = ccHub();
    const typeId = typeof resolveTypeId === 'function' ? resolveTypeId(record) : null;
    if (typeof renderView === 'function') {
        return renderView(typeId, record, { activeSectionId });
    }
    return `<div class="${hub}-warning lux-data-card"><strong>Profile unavailable</strong><div>Blueprint profile renderer is not loaded.</div></div>`;
}

    const exported = {
        escapeHtml, normalizeText, normalizeSearch, unique, todayIso,
        facultyName, departmentForFaculty, humanizeFacultyName,
        completionTone, modalStatusCopy, statusTone, clampProgressPercent,
        parseCommaList, parseLinks, parseCourses, parseOfficeHours, parseScheduleSessions,
        initials, renderModalMissingChips, renderModalProgress, renderModalStatus,
        renderProgress, infoCard, showToast,
        profileSectionTabLabel,
        renderOverviewSection, renderAvailabilitySection, renderContactSection, renderDocumentsSection,
        clearFormErrors, markInvalid, scrollToFirstInvalidField, applyModalCompletenessUI,
        roleTitleOptions, buildHoursAndSectionStats, getAccountStatus, getVisibilityDefault,
        resolveStaffRegistrationEmail, ensureCommandCenterStore,
        exportDirectoryJson, exportDirectoryCsv, syncGroupsForStaff,
        upsertUserRecord, syncScheduleSessions, importDirectoryJson,
        patchCommandCenterRecord, toggleLoginStatus, markRecordReviewed, inviteRecord,
        setRecordArchiveStatus, openFormSettingsWorkspace, renderTeachingSection, applyHubProgressBars, renderHubTypeCreateButtons, renderHubPrimaryCreateButton, renderStatusChipHtml, renderBlueprintProfileHtml
    };
    Object.keys(exported).forEach((key) => {
        window[key] = exported[key];
    });
    window.KiuCommandCenterUtils = exported;
})();
