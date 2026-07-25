/* Study card, registration, profile, chancellery, and admin curriculum page logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- STUDY CARD ---

function switchRegTab(tab, triggerElement = null) {
    document.querySelectorAll('.reg-tab').forEach(el => el.classList.remove('active'));
    const targetTabTrigger = document.querySelector(`.reg-tab[data-reg-tab="${tab}"]`);
    const fallbackTrigger = triggerElement && typeof triggerElement.closest === 'function'
        ? triggerElement.closest('.reg-tab')
        : null;
    const activeTrigger = targetTabTrigger || fallbackTrigger;
    if (activeTrigger) activeTrigger.classList.add('active');
    ['program', 'free', 'concentration', 'minor', 'history', 'selected'].forEach(t => {
        const el = document.getElementById(`reg-tab-${t}`);
        if (el) el.hidden = true;
    });
    
    const target = document.getElementById(`reg-tab-${tab}`);
    if (target) target.hidden = false;
}

function isRegistrationShellActive() {
    return Boolean(document.getElementById('page-registration') || document.body.classList.contains('lux-route-registration'));
}

function handleRegistrationShellClick(event) {
    if (!isRegistrationShellActive()) return;

    const tabTrigger = event.target.closest('[data-reg-tab]');
    if (tabTrigger) {
        event.preventDefault();
        switchRegTab(tabTrigger.dataset.regTab, tabTrigger);
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
        closeAllModals(event);
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

function handleRegistrationLegacyClick(event) {
    const caseTrigger = event.target.closest('[data-reg-chanc-select-case]');
    if (caseTrigger) {
        event.preventDefault();
        setChancellerySelectedCase(String(caseTrigger.getAttribute('data-reg-chanc-select-case') || ''));
        return;
    }

    const tabTrigger = event.target.closest('[data-reg-chanc-tab]');
    if (tabTrigger) {
        event.preventDefault();
        switchChancelleryTab(String(tabTrigger.getAttribute('data-reg-chanc-tab') || 'appeals'));
        return;
    }

    const chancelleryAction = event.target.closest('[data-reg-chanc-action]');
    if (chancelleryAction) {
        event.preventDefault();
        const action = String(chancelleryAction.getAttribute('data-reg-chanc-action') || '').trim();
        if (action === 'submit-request') return submitRequest();
        if (action === 'mark-resolved') {
            return updateChancelleryRequestStatus(String(chancelleryAction.getAttribute('data-request-id') || ''), 'Resolved');
        }
        if (action === 'submit-staff-reply') return submitChancelleryStaffReply();
    }

    const provisionAction = event.target.closest('[data-provision-action]');
    if (provisionAction) {
        event.preventDefault();
        const action = String(provisionAction.getAttribute('data-provision-action') || '').trim();
        if (action === 'add-subject') {
            addSubjectTag(
                String(provisionAction.getAttribute('data-subject-id') || ''),
                String(provisionAction.getAttribute('data-subject-name') || '')
            );
            return;
        }
        if (action === 'remove-subject') {
            removeSubjectTag(String(provisionAction.getAttribute('data-subject-id') || ''));
            return;
        }
        if (action === 'open-profile') {
            const profileId = String(provisionAction.getAttribute('data-profile-id') || '');
            if (profileId) {
                const url = new URL('profile-view.html', window.location.href);
                url.searchParams.set('id', profileId);
                const role = String(provisionAction.getAttribute('data-profile-role') || '');
                const faculty = String(provisionAction.getAttribute('data-profile-faculty') || '');
                if (role) url.searchParams.set('role', role);
                if (faculty) url.searchParams.set('faculty', faculty);
                window.location.href = url.pathname + url.search;
            }
            return;
        }
        if (action === 'open-student-registration') return openStudentRegistration();
        if (action === 'open-prof-registration') {
            return openProfRegistration(String(provisionAction.getAttribute('data-profile-role') || USER_ROLES.PROFESSOR));
        }
    }

    const conditionAction = event.target.closest('[data-condition-action]');
    if (conditionAction) {
        event.preventDefault();
        event.stopPropagation();
        const action = String(conditionAction.getAttribute('data-condition-action') || '').trim();
        if (action === 'remove') {
            return removeConditionSelection(String(conditionAction.getAttribute('data-subject-code') || ''));
        }
    }

    const antiReqAction = event.target.closest('[data-antireq-action]');
    if (antiReqAction) {
        event.preventDefault();
        event.stopPropagation();
        const action = String(antiReqAction.getAttribute('data-antireq-action') || '').trim();
        if (action === 'toggle') {
            return toggleAntiReqSelection(String(antiReqAction.getAttribute('data-anti-code') || ''));
        }
        if (action === 'clear') {
            return setSelectedAntiReqCodes([]);
        }
    }

    const curriculumAction = event.target.closest('[data-curriculum-add-module], [data-curriculum-edit-module], [data-curriculum-delete-module], [data-curriculum-focus-builder], [data-curriculum-edit-subject], [data-curriculum-delete-subject]');
    if (curriculumAction) {
        event.preventDefault();
        if (curriculumAction.hasAttribute('data-curriculum-add-module')) return addCurriculumLibraryModule();
        if (curriculumAction.hasAttribute('data-curriculum-edit-module')) {
            return editCurriculumLibraryModule(String(curriculumAction.getAttribute('data-curriculum-edit-module') || ''));
        }
        if (curriculumAction.hasAttribute('data-curriculum-delete-module')) {
            return deleteCurriculumLibraryModule(String(curriculumAction.getAttribute('data-curriculum-delete-module') || ''));
        }
        if (curriculumAction.hasAttribute('data-curriculum-focus-builder')) return openCurriculumSubjectBuilderModal();
        if (curriculumAction.hasAttribute('data-curriculum-edit-subject')) {
            return openCurriculumSubjectBuilderModalForEdit(String(curriculumAction.getAttribute('data-curriculum-edit-subject') || ''));
        }
        if (curriculumAction.hasAttribute('data-curriculum-delete-subject')) {
            return deleteSubjectById(String(curriculumAction.getAttribute('data-curriculum-delete-subject') || ''));
        }
    }

    const editStaffOverlay = event.target.closest('[data-edit-staff-overlay]');
    if (editStaffOverlay && event.target === editStaffOverlay) {
        event.preventDefault();
        editStaffOverlay.remove();
        return;
    }

    const editStaffAction = event.target.closest('[data-edit-staff-action]');
    if (!editStaffAction) return;
    event.preventDefault();
    const action = String(editStaffAction.getAttribute('data-edit-staff-action') || '').trim();
    if (action === 'close') {
        document.getElementById('edit-staff-modal-bg')?.remove();
        return;
    }
    if (action === 'add-row') return addEditSchedRow();
    if (action === 'save') return saveEditStaffModal();
    if (action === 'delete') return deleteStaffFromModal();
    if (action === 'remove-row') {
        editStaffAction.closest('.edit-sched-row')?.remove();
        return;
    }

    const studentRegAction = event.target.closest('[data-stu-reg-action]');
    if (studentRegAction) {
        event.preventDefault();
        const action = String(studentRegAction.getAttribute('data-stu-reg-action') || '').trim();
        if (action === 'toggle') {
            return toggleStuRegSubject(
                String(studentRegAction.getAttribute('data-subject-id') || ''),
                String(studentRegAction.getAttribute('data-subject-name') || '')
            );
        }
    }

    const profRegAction = event.target.closest('[data-prof-reg-action]');
    if (profRegAction) {
        event.preventDefault();
        const action = String(profRegAction.getAttribute('data-prof-reg-action') || '').trim();
        if (action === 'toggle') {
            return toggleProfRegSubject(
                String(profRegAction.getAttribute('data-subject-id') || ''),
                String(profRegAction.getAttribute('data-subject-name') || '')
            );
        }
        if (action === 'add') {
            return addProfRegSubject(
                String(profRegAction.getAttribute('data-subject-id') || ''),
                String(profRegAction.getAttribute('data-subject-name') || '')
            );
        }
        if (action === 'remove') {
            return removeProfRegSubject(String(profRegAction.getAttribute('data-subject-id') || ''));
        }
    }

    const officeHourAction = event.target.closest('[data-office-hour-action]');
    if (officeHourAction) {
        event.preventDefault();
        const action = String(officeHourAction.getAttribute('data-office-hour-action') || '').trim();
        const courseId = String(officeHourAction.getAttribute('data-course-id') || '');
        const index = parseInt(String(officeHourAction.getAttribute('data-index') || ''), 10);
        if (action === 'book') return bookOfficeHour(courseId, index);
        if (action === 'delete') return deleteOfficeHour(courseId, index);
        if (action === 'create') return createOfficeHour(courseId);
    }

    const syllabusAction = event.target.closest('[data-syllabus-action]');
    if (syllabusAction) {
        event.preventDefault();
        const action = String(syllabusAction.getAttribute('data-syllabus-action') || '').trim();
        const courseId = String(syllabusAction.getAttribute('data-course-id') || '');
        if (action === 'upload') {
            return uploadToModule(courseId, String(syllabusAction.getAttribute('data-module-id') || ''));
        }
        if (action === 'add-module') return addSyllabusModule(courseId);
    }

    const accordionTrigger = event.target.closest('[data-registration-accordion]');
    if (accordionTrigger) {
        event.preventDefault();
        return toggleAccordion(accordionTrigger);
    }

    const chatAction = event.target.closest('[data-registration-chat-action]');
    if (chatAction) {
        event.preventDefault();
        if (String(chatAction.getAttribute('data-registration-chat-action') || '') === 'send') {
            return sendChatMessage(String(chatAction.getAttribute('data-course-id') || ''));
        }
    }

    const courseGroupAction = event.target.closest('[data-course-group-action]');
    if (courseGroupAction) {
        event.preventDefault();
        const action = String(courseGroupAction.getAttribute('data-course-group-action') || '').trim();
        const courseId = String(courseGroupAction.getAttribute('data-course-id') || '');
        const groupId = String(courseGroupAction.getAttribute('data-group-id') || '');
        if (action === 'select') {
            return selectCourseGroup(courseId, String(courseGroupAction.getAttribute('data-course-name') || ''), groupId);
        }
        if (action === 'unselect') {
            return unselectCourseGroup(courseId, groupId);
        }
    }

    const lmsCardTrigger = event.target.closest('[data-registration-lms-course]');
    if (lmsCardTrigger) {
        event.preventDefault();
        const courseId = String(lmsCardTrigger.getAttribute('data-course-id') || '');
        const groupId = String(lmsCardTrigger.getAttribute('data-group-id') || '');
        const subjectName = String(lmsCardTrigger.getAttribute('data-subject-name') || '');
        const groupName = String(lmsCardTrigger.getAttribute('data-group-name') || '');
        const icon = String(lmsCardTrigger.getAttribute('data-course-icon') || '');
        if (groupId) {
            return openLMSCourse(`${courseId}::${groupId}`, `${subjectName} | ${groupName}`);
        }
        return openLMSGroups(courseId, subjectName, icon);
    }

    const profSchedAction = event.target.closest('[data-prof-sched-action]');
    if (profSchedAction) {
        event.preventDefault();
        const action = String(profSchedAction.getAttribute('data-prof-sched-action') || '').trim();
        if (action === 'remove-row') {
            profSchedAction.closest('.sched-row')?.remove();
            checkSchedEmpty();
            renderProfRegCalendarGrid();
        }
    }
}

function handleRegistrationLegacyChange(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const filterTrigger = target.closest('[data-reg-chanc-filter]');
    if (filterTrigger) {
        return setChancelleryFilter(
            String(filterTrigger.getAttribute('data-reg-chanc-filter') || '').trim(),
            target.value
        );
    }

    const statusTrigger = target.closest('[data-reg-chanc-status-target]');
    if (statusTrigger) {
        return updateChancelleryRequestStatus(
            String(statusTrigger.getAttribute('data-reg-chanc-status-target') || ''),
            target.value
        );
    }

    if (target.matches('[data-curriculum-module-select]')) {
        setCurriculumLibraryModuleSelection(
            String(target.getAttribute('data-curriculum-module-select') || ''),
            getCurrentFaculty()
        );
        renderCurriculumTable();
        return;
    }

    if (target.id === 'filter-curriculum-semester') {
        renderCurriculumTable();
        return;
    }

    if (target.id === 'new-subject-semesters' || target.id === 'new-subject-semester-lux-btn' || target.closest?.('#new-subject-semester-picker')) {
        ensureSubjectSemesterParityHint();
        if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();
        return;
    }

    if (target.matches('[data-attendance-mark]')) {
        markAttendance(
            String(target.getAttribute('data-course-id') || ''),
            String(target.getAttribute('data-attendance-date') || ''),
            String(target.getAttribute('data-student-id') || ''),
            target.value
        );
        return;
    }

    if (target.matches('[data-edit-staff-sync-row]')) {
        syncScheduleRowCapacityDefaults(target.closest('.edit-sched-row'));
        return;
    }

    if (target.matches('[data-prof-sched-change]')) {
        if (target.matches('.sched-subject, .sched-session-type')) {
            syncScheduleRowCapacityDefaults(target.closest('.sched-row'));
        }
        renderProfRegCalendarGrid();
    }
}

function handleRegistrationLegacyInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('[data-curriculum-search]')) {
        syncCurriculumLibrarySearchQuery(target.value, getCurrentFaculty());
        return;
    }

    if (target.matches('[data-prof-sched-input]')) {
        renderProfRegCalendarGrid();
    }
}

function handleRegistrationLegacyMouseDown(event) {
    const trigger = event.target.closest('[data-subject-condition-select]');
    if (!trigger) return;
    selectCondition(
        String(trigger.getAttribute('data-subject-code') || ''),
        String(trigger.getAttribute('data-subject-name') || ''),
        event
    );
}

function bindRegistrationLegacyDelegates() {
    if (window.__registrationLegacyDelegatesBound) return;
    window.__registrationLegacyDelegatesBound = true;
    document.addEventListener('click', handleRegistrationLegacyClick);
    document.addEventListener('change', handleRegistrationLegacyChange);
    document.addEventListener('input', handleRegistrationLegacyInput);
    document.addEventListener('mousedown', handleRegistrationLegacyMouseDown);
}

bindRegistrationLegacyDelegates();

function toggleRegGroup(groupId) {
    const group = document.getElementById(groupId);
    const icon = event.currentTarget.querySelector('i');
    if (group.classList.contains('hidden')) {
        group.classList.remove('hidden');
        icon.className = 'fas fa-chevron-down';
    } else {
        group.classList.add('hidden');
        icon.className = 'fas fa-chevron-right';
    }
}

// --- LIBRARY CUSTOM SELECT ---
function toggleCustomSelect(id, event) {
    event.stopPropagation();
    const items = document.getElementById(id);
    document.querySelectorAll('.select-items').forEach(el => {
        if(el.id !== id) el.classList.remove('show');
    });
    items.classList.toggle('show');
}

// --- CHANCELLERY LOGIC ---

const setChancellerySelectedCase = (...args) => window.setChancellerySelectedCase?.(...args);
const switchChancelleryTab = (...args) => window.switchChancelleryTab?.(...args);
const submitRequest = (...args) => window.submitRequest?.(...args);
const updateChancelleryRequestStatus = (...args) => window.updateChancelleryRequestStatus?.(...args);
const submitChancelleryStaffReply = (...args) => window.submitChancelleryStaffReply?.(...args);
const setChancelleryFilter = (...args) => window.setChancelleryFilter?.(...args);
const renderChancelleryPage = (...args) => window.renderChancelleryPage?.(...args);
const renderFinancialLedger = (...args) => window.renderFinancialLedger?.(...args);
const applyScholarship = (...args) => window.applyScholarship?.(...args);
const toggleProbation = (...args) => window.toggleProbation?.(...args);


const ADMIN_ACCOUNT_FLOW_KEY = 'KIU_PENDING_ADMIN_ACCOUNT_FLOW';

function openUnifiedAdminProvision(role) {
    const effectiveRole = (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : null) || getCurrentUser()?.role || localStorage.getItem('currentUserRole') || 'student';
    const hasAdminSession = String(currentUser?.role || '').toLowerCase() === USER_ROLES.ADMIN
        || effectiveRole === 'admin'
        || effectiveRole === USER_ROLES.ADMIN;
    if (!hasAdminSession) return;
    const normalizedRole = [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.STUDENT_SERVICE].includes(role) ? role : USER_ROLES.STUDENT;
    localStorage.setItem(ADMIN_ACCOUNT_FLOW_KEY, normalizedRole);
    if (normalizedRole === 'student') {
        navigate('students-admin');
    } else {
        navigate('staff');
    }
}

function consumePendingAdminAccountFlow() {
    const pending = localStorage.getItem(ADMIN_ACCOUNT_FLOW_KEY);
    if (!pending) return;

    if (pending === 'student' && typeof openStudentRegistration === 'function') {
        localStorage.removeItem(ADMIN_ACCOUNT_FLOW_KEY);
        setTimeout(() => openStudentRegistration(), 0);
        return;
    }

    if ((pending === 'professor' || pending === 'ta' || pending === USER_ROLES.STUDENT_SERVICE) && document.getElementById('prof-register-overlay')) {
        localStorage.removeItem(ADMIN_ACCOUNT_FLOW_KEY);
        setTimeout(() => openProfRegistration(pending), 0);
    }
}

// ============================================
// ROLE-AWARE REGISTRATION BUTTON RENDERER
// ============================================
function renderRegistrationButtons(pageType) {
    const container = document.getElementById('registration-buttons-container');
    if (!container) return;

    const effectiveRole = (typeof getEffectiveUserRole === 'function' ? getEffectiveUserRole() : null) || getCurrentUser()?.role || localStorage.getItem('currentUserRole') || 'student';
    const hasAdminSession = String(currentUser?.role || '').toLowerCase() === USER_ROLES.ADMIN
        || effectiveRole === 'admin'
        || effectiveRole === USER_ROLES.ADMIN;

    if (!hasAdminSession) {
        container.innerHTML = `
        <div class="admin-provision-empty-state">
            <i class="fas fa-lock admin-provision-empty-icon"></i>
            <div class="admin-provision-empty-title">Admin Access Required</div>
            <div class="admin-provision-empty-copy">Only administrators can register new accounts.</div>
        </div>`;
        return;
    }
    let btns = '';

    // Students page shows only the student registration action.
    if (pageType === 'students') {
        btns = `
        <button type="button" class="lux-primary-btn admin-provision-btn" data-provision-action="open-student-registration">
            <i class="fas fa-user-graduate admin-provision-btn-icon"></i>
            <div class="admin-provision-btn-copy"><div>Register New Student</div><div class="admin-provision-btn-subcopy">Full enrollment with academic & financial setup</div></div>
        </button>`;
    }
    // Staff page shows the professor, TA, and student service actions.
    else if (pageType === 'staff') {
        btns = `
        <button type="button" class="lux-primary-btn admin-provision-btn" data-provision-action="open-prof-registration" data-profile-role="professor">
            <i class="fas fa-chalkboard-teacher admin-provision-btn-icon"></i>
            <div class="admin-provision-btn-copy"><div>Register New Professor</div><div class="admin-provision-btn-subcopy">With subject assignment & schedule builder</div></div>
        </button>
        <button type="button" class="lux-secondary-btn admin-provision-btn" data-provision-action="open-prof-registration" data-profile-role="ta">
            <i class="fas fa-user-tie admin-provision-btn-icon"></i>
            <div class="admin-provision-btn-copy"><div>Register New TA</div><div class="admin-provision-btn-subcopy">Teaching assistant with schedule integration</div></div>
        </button>
        <button type="button" class="lux-secondary-btn admin-provision-btn" data-provision-action="open-prof-registration" data-profile-role="${USER_ROLES.STUDENT_SERVICE}">
            <i class="fas fa-headset admin-provision-btn-icon"></i>
            <div class="admin-provision-btn-copy"><div>Register Student Service Staff</div><div class="admin-provision-btn-subcopy">Support team account for tickets and knowledge base</div></div>
        </button>`;
    }

    container.innerHTML = btns;
}

// ============================================
// EDIT EXISTING STAFF MODAL
// ============================================
function openEditStaffModal(memberId, memberType) {
    const fac = getCurrentFaculty();
    const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(fac) : fac;
    const fp = getFacultyProfile(fac);
    const list = memberType === 'professors' ? (fp.professors || []) : (fp.tas || []);
    const member = list.find((item) => item.id === memberId);
    if (!member) {
        alert('Staff member not found.');
        return;
    }

    const sessions = [];
    Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
        (KIU_STATE.availableGroups[courseId] || []).forEach((group) => {
            if (group.prof === member.name || group.ta === member.name) {
                sessions.push({ courseId, ...group });
            }
        });
    });

    const rowsHtml = sessions.length
        ? sessions.map((session, index) => renderEditStaffScheduleRow(session, index)).join('')
        : '<div class="lux-empty-state admin-edit-staff-empty"><i class="fas fa-calendar-plus"></i><strong>No schedule rows yet</strong><span>Add a lecture or seminar row for this staff member.</span></div>';

    const modalHtml = `
    <div id="edit-staff-modal-bg" data-edit-staff-overlay="1" class="registration-structured-modal-backdrop" data-lux-transparency-exempt="1" role="dialog" aria-modal="true">
        <div class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--event-create lux-glass-dialog-card admin-edit-staff-card" data-lux-transparency-exempt="1" data-lux-glass-root="1">
            <div class="lux-glass-dialog-section-head lux-glass-dialog-head admin-edit-staff-head">
                <div class="lux-glass-dialog-heading">
                    <strong class="lux-glass-dialog-title admin-edit-staff-title">Edit Staff Member</strong>
                    <span class="lux-glass-dialog-subtitle admin-edit-staff-subtitle">${escapeHtml(member.name || member.nameEn || memberId)} / ${escapeHtml(facultyLabel)}</span>
                </div>
                <button type="button" data-edit-staff-action="close" class="lux-ghost-btn lux-glass-dialog-close-btn" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-edit-staff-form lux-glass-dialog-body lux-glass-dialog-body--event-create lux-scrollbar" id="edit-staff-form" data-member-id="${escapeHtml(memberId)}" data-member-type="${escapeHtml(memberType)}" data-fac="${escapeHtml(fac)}">
                <div class="admin-edit-staff-section-title"><i class="fas fa-user admin-edit-staff-section-icon"></i>Personal Information</div>
                <div class="admin-edit-staff-grid-2">
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Name (Georgian)</label><input id="es-name" value="${escapeHtml(member.name || '')}" class="admin-edit-staff-control lux-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Name (English)</label><input id="es-name-en" value="${escapeHtml(member.nameEn || '')}" class="admin-edit-staff-control lux-control"></div>
                </div>
                <div class="admin-edit-staff-grid-3 is-tight">
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Rank</label><select id="es-rank" class="admin-edit-staff-control lux-control"><option ${member.title === 'Professor' ? 'selected' : ''}>Professor</option><option ${member.title === 'Associate Professor' ? 'selected' : ''}>Associate Professor</option><option ${member.title === 'Lecturer' ? 'selected' : ''}>Lecturer</option><option ${member.title === 'Visiting Professor' ? 'selected' : ''}>Visiting Professor</option><option ${member.title === 'Teaching Assistant' ? 'selected' : ''}>Teaching Assistant</option></select></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Office</label><input id="es-office" value="${escapeHtml(member.office || '')}" class="admin-edit-staff-control lux-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Since (Year)</label><input id="es-joinyear" type="number" value="${escapeHtml(String(member.joinYear || 2024))}" class="admin-edit-staff-control lux-control"></div>
                </div>
                <div class="admin-edit-staff-grid-3 is-spacious">
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Email</label><input id="es-email" value="${escapeHtml(member.email || '')}" class="admin-edit-staff-control lux-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Phone</label><input id="es-phone" value="${escapeHtml(member.phone || '')}" class="admin-edit-staff-control lux-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Max Teaching Hours</label><input id="es-maxhours" type="number" value="${escapeHtml(String(member.maxHours || 12))}" class="admin-edit-staff-control lux-control"></div>
                </div>
                <div class="admin-edit-staff-schedule-head">
                    <div class="admin-edit-staff-section-title"><i class="fas fa-calendar-alt admin-edit-staff-schedule-icon"></i>Teaching Schedule</div>
                    <button type="button" data-edit-staff-action="add-row" class="lux-secondary-btn"><i class="fas fa-plus"></i> Add Row</button>
                </div>
                <div id="edit-sched-rows" class="admin-edit-staff-rows">${rowsHtml}</div>
                <div class="admin-edit-staff-footer lux-glass-dialog-actions">
                    <button type="button" data-edit-staff-action="delete" class="lux-ghost-btn admin-reg-manage-modal-action--danger"><i class="fas fa-trash"></i> Remove Staff</button>
                    <div class="admin-edit-staff-actions">
                        <button type="button" data-edit-staff-action="close" class="lux-ghost-btn">Cancel</button>
                        <button type="button" data-edit-staff-action="save" class="lux-primary-btn"><i class="fas fa-save"></i> Save Changes</button>
                    </div>
                </div>
            </div>
        </div>
    </div>`;

    document.getElementById('edit-staff-modal-bg')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

function getRegistrationGroupCapacity(group, fallback = 40) {
    const parsed = parseInt(group?.capacity ?? group?.maxStudents ?? fallback, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSuggestedSessionSeatCapacity(courseId, sessionType = 'lecture') {
    const normalizedSessionType = String(sessionType || 'lecture').trim().toLowerCase();
    if (normalizedSessionType === 'seminar') return 20;
    return 40;
}

function syncScheduleRowCapacityDefaults(row) {
    if (!row) return;
    const subjectInput = row.querySelector('.sched-subject, .es-course');
    const sessionTypeInput = row.querySelector('.sched-session-type, .es-session-type');
    const capacityInput = row.querySelector('.sched-capacity, .es-capacity');
    if (!subjectInput || !capacityInput) return;
    const courseId = String(subjectInput.value || '').trim();
    const sessionType = String(sessionTypeInput?.value || 'lecture').trim().toLowerCase();
    const currentCapacity = parseInt(capacityInput.value || '', 10);
    if (courseId || !Number.isFinite(currentCapacity) || currentCapacity <= 0) {
        capacityInput.value = String(getSuggestedSessionSeatCapacity(courseId, sessionType));
    }
}

function getEditStaffScheduleDays() {
    return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
}

function getEditStaffSessionTypeValue(session = {}) {
    const normalized = String(session.sessionType || session.type || '').trim().toLowerCase();
    return normalized === 'seminar' ? 'seminar' : 'lecture';
}

function renderEditStaffScheduleRow(session = {}, index = 0) {
    const days = getEditStaffScheduleDays();
    const sessionType = getEditStaffSessionTypeValue(session);
    const dayOptions = days.map((day) => `<option value="${escapeHtml(day)}" ${day === session.day ? 'selected' : ''}>${escapeHtml(day)}</option>`).join('');
    return `
    <div class="edit-sched-row admin-edit-staff-row" data-idx="${index}">
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Subject</label><input type="text" value="${escapeHtml(session.courseId || '')}" class="es-course admin-edit-staff-row-control" data-edit-staff-sync-row="1" placeholder="e.g. ECON-01-101"></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Group</label><input type="text" value="${escapeHtml(session.name || session.id || 'G1')}" class="es-group admin-edit-staff-row-control"></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Type</label><select class="es-session-type admin-edit-staff-row-control" data-edit-staff-sync-row="1"><option value="lecture" ${sessionType === 'lecture' ? 'selected' : ''}>Lecture</option><option value="seminar" ${sessionType === 'seminar' ? 'selected' : ''}>Seminar</option></select></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Day</label><select class="es-day admin-edit-staff-row-control">${dayOptions}</select></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Room</label><input type="text" value="${escapeHtml(session.room || '')}" class="es-room admin-edit-staff-row-control" placeholder="A-301"></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Time</label><input type="time" value="${escapeHtml(session.time || '09:00')}" class="es-time admin-edit-staff-row-control"></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Duration</label><select class="es-dur admin-edit-staff-row-control"><option value="50min" ${session.duration === '50min' ? 'selected' : ''}>50min</option><option value="80min" ${session.duration === '80min' ? 'selected' : ''}>80min</option><option value="110min" ${(session.duration || '110min') === '110min' ? 'selected' : ''}>110min</option><option value="170min" ${session.duration === '170min' ? 'selected' : ''}>170min</option></select></div>
        <div class="admin-edit-staff-field"><label class="admin-edit-staff-row-label">Seats</label><input type="number" min="1" value="${escapeHtml(String(getRegistrationGroupCapacity(session, getSuggestedSessionSeatCapacity(session.courseId, sessionType))))}" class="es-capacity admin-edit-staff-row-control"></div>
        <div class="admin-edit-staff-row-action"><button type="button" data-edit-staff-action="remove-row" class="lux-icon-btn admin-edit-staff-row-remove" aria-label="Remove row"><i class="fas fa-trash-alt"></i></button></div>
    </div>`;
}

function addEditSchedRow() {
    const container = document.getElementById('edit-sched-rows');
    if (!container) return;
    const emptyState = container.querySelector('.lux-empty-state');
    if (emptyState) emptyState.remove();
    const index = container.querySelectorAll('.edit-sched-row').length;
    container.insertAdjacentHTML('beforeend', renderEditStaffScheduleRow({}, index));
    syncScheduleRowCapacityDefaults(container.lastElementChild);
}

function saveEditStaffModal() {
    const form = document.getElementById('edit-staff-form');
    if (!form) return;
    const memberId = form.dataset.memberId;
    const memberType = form.dataset.memberType;
    const fac = form.dataset.fac;
    const fp = getFacultyProfile(fac);
    const list = memberType === 'professors' ? (fp.professors || []) : (fp.tas || []);
    const member = list.find((item) => item.id === memberId);
    if (!member) {
        alert('Member not found.');
        return;
    }

    const oldName = member.name;
    member.name = document.getElementById('es-name')?.value.trim() || member.name;
    member.nameEn = document.getElementById('es-name-en')?.value.trim() || '';
    member.title = document.getElementById('es-rank')?.value || member.title;
    member.office = document.getElementById('es-office')?.value.trim() || '';
    member.joinYear = document.getElementById('es-joinyear')?.value || member.joinYear;
    member.email = document.getElementById('es-email')?.value.trim() || member.email;
    member.phone = document.getElementById('es-phone')?.value.trim() || '';
    member.maxHours = parseInt(document.getElementById('es-maxhours')?.value, 10) || 12;

    if (oldName !== member.name) {
        Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
            (KIU_STATE.availableGroups[courseId] || []).forEach((group) => {
                if (group.prof === oldName) group.prof = member.name;
                if (group.ta === oldName) group.ta = member.name;
            });
        });
    }

    Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
        KIU_STATE.availableGroups[courseId] = (KIU_STATE.availableGroups[courseId] || []).filter((group) => {
            return group.prof !== member.name && group.ta !== member.name;
        });
        if (KIU_STATE.availableGroups[courseId].length === 0) {
            delete KIU_STATE.availableGroups[courseId];
        }
    });

    const newSubjects = new Set();
    document.querySelectorAll('#edit-sched-rows .edit-sched-row').forEach((row) => {
        const courseId = row.querySelector('.es-course')?.value.trim();
        const groupName = row.querySelector('.es-group')?.value.trim() || 'G1';
        const sessionType = row.querySelector('.es-session-type')?.value || 'lecture';
        const day = row.querySelector('.es-day')?.value || 'Monday';
        const room = row.querySelector('.es-room')?.value.trim() || '';
        const time = row.querySelector('.es-time')?.value || '09:00';
        const duration = row.querySelector('.es-dur')?.value || '110min';
        const capacity = Math.max(1, parseInt(row.querySelector('.es-capacity')?.value, 10) || getSuggestedSessionSeatCapacity(courseId, sessionType));
        if (!courseId) return;

        newSubjects.add(courseId);
        if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] = [];

        const nextSession = {
            id: groupName,
            name: groupName,
            day,
            time,
            room,
            duration,
            sessionType,
            faculty: fac,
            capacity,
            registered: 0
        };

        if (memberType === 'professors') {
            nextSession.prof = member.name;
        } else {
            nextSession.ta = member.name;
        }

        KIU_STATE.availableGroups[courseId].push(nextSession);
    });

    member.subjects = [...newSubjects];
    if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
        syncAvailableGroupEnrollmentCounts();
    }

    saveState();
    document.getElementById('edit-staff-modal-bg')?.remove();
    renderStaffPage();
    alert('Changes saved successfully.');
}

function deleteStaffFromModal() {
    const form = document.getElementById('edit-staff-form');
    if (!form) return;
    const memberId = form.dataset.memberId;
    const memberType = form.dataset.memberType;

    if (!confirm('Are you sure you want to remove this staff member? This will also remove their schedule sessions.')) {
        return;
    }

    document.getElementById('edit-staff-modal-bg')?.remove();
    removeStaffMember(memberId, memberType);
}

/* Enrollment handlers are provided by registration-enrollment.js on all registration routes. */

function refreshRegistrationUI() {
    if (!document.getElementById('page-registration')) return;
    syncRegistrationHeaderInfo();
    renderECTSBudget();
    
    document.querySelectorAll('.group-expansion-row').forEach(el => el.remove());
    const currentSchedule = getCurrentStudentSchedule();
    if (currentSchedule) {
        const statStatus = document.getElementById('status-stat');
        const econStatus = document.getElementById('status-econ');
        
        if (statStatus) {
            const hasStat = currentSchedule.some(s => s.courseId === 'STAT-2');
            statStatus.className = hasStat ? 'fas fa-check' : 'fas fa-thumbs-up';
            statStatus.classList.add('registration-status-icon');
            statStatus.dataset.registrationTone = hasStat ? 'success' : 'info';
        }
        
        if (econStatus) {
            const hasEcon = currentSchedule.some(s => s.courseId === 'ECON-4');
            econStatus.className = hasEcon ? 'fas fa-check' : 'fas fa-times';
            econStatus.classList.add('registration-status-icon');
            econStatus.dataset.registrationTone = hasEcon ? 'success' : 'danger';
        }
    }
    
    renderSelectedCoursesTab();
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
    const facultyName = typeof getFacultyLabel === 'function'
        ? getFacultyLabel(faculty)
        : String(faculty || '');
    const semester = String(getCurrentStudentSemesterNumber(currentUser) || 1);
    const totalEcts = getStudentCompletedEctsThisSemester(currentUser.id, faculty);
    const limit = KIU_STATE.probationStatus?.[currentUser.id] ? 24 : 36;
    const remaining = Math.max(limit - totalEcts, 0);
    const holdActive = Boolean(KIU_STATE.probationStatus?.[currentUser.id]);
    const registrationOpen = Boolean(KIU_STATE.registrationOpen);
    const nextStep = selectedCount === 0
        ? 'Choose a program module'
        : registrationOpen
            ? 'Review selected sections'
            : 'Registration is locked';
    const statusText = registrationOpen ? 'Registration open' : 'Registration closed';
    const loadText = `${selectedCount} selected`;
    const ectsText = `${totalEcts} / ${limit} ECTS`;
    const holdText = holdActive ? 'Review hold' : 'Clear';
    const sectionText = `${selectedCount} section${selectedCount === 1 ? '' : 's'}`;
    const academicYearLabel = typeof getCurrentAcademicYearLabel === 'function' ? getCurrentAcademicYearLabel() : '2025 / 2026';
    const termText = `${academicYearLabel} / Semester ${semester}`;

    const updates = {
        'registration-hero-status': statusText,
        'registration-hero-semester': termText,
        'registration-hero-faculty': facultyName,
        'registration-hero-ects': ectsText,
        'registration-hero-load': loadText,
        'registration-hero-hold': holdText,
        'registration-hero-selected': sectionText,
        'registration-next-step': nextStep,
        'registration-hero-hold-card': holdText,
        'registration-hero-ects-card': `${totalEcts} / ${limit}`,
        'registration-hero-selected-card': String(selectedCount),
        'registration-hero-next-step-card': nextStep
    };

    Object.entries(updates).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });

    const termSelect = document.getElementById('registration-term-select');
    if (termSelect && termSelect.options.length) {
        const currentOption = termSelect.options[0];
        currentOption.textContent = termText;
        termSelect.value = currentOption.value;
    }
}

function renderECTSBudget() {
    if (!document.getElementById('page-registration')) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const total = getStudentCompletedEctsThisSemester(currentUser.id, currentUser?.facultyCode || currentUser?.faculty || getCurrentFaculty());
    const limit = currentUser ? (KIU_STATE.probationStatus[currentUser.id] ? 24 : 36) : 36;
    
    const bar = document.getElementById('ects-progress-bar');
    const txt = document.getElementById('ects-text');
    
    if (bar && txt) {
        const percentage = Math.min((total / limit) * 100, 100);
        bar.style.width = percentage + '%';
        txt.innerText = `${total} / ${limit}`;

        const toneClasses = ['is-warning', 'is-complete', 'is-over'];
        toneClasses.forEach((className) => {
            bar.classList.remove(className);
            txt.classList.remove(className);
        });

        const toneClass = total > limit ? 'is-over' : (total === limit ? 'is-complete' : 'is-warning');
        bar.classList.add(toneClass);
        txt.classList.add(toneClass);
    }
    syncRegistrationWorkspaceSummary();
}

function renderSelectedCoursesTab() {
    const tbody = document.querySelector('#reg-tab-selected tbody');
    if (!tbody) return; // Prevent crashes on non-registration pages
    const currentSchedule = getCurrentStudentSchedule();
    
    if (!currentSchedule || currentSchedule.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="registration-selected-empty">No courses have been added to your schedule yet.</td></tr>';
        return;
    }
    
    let html = '';
    currentSchedule.forEach(c => {
        html += `
            <tr class="registration-selected-row">
                <td class="registration-selected-cell registration-selected-cell--left">${c.groupName}</td>
                <td class="registration-selected-cell registration-selected-cell--title">${c.courseName}</td>
                <td>${c.day}</td>
                <td>${c.time}</td>
                <td>${c.room}</td>
                <td>${c.prof}</td>
                <td>${c.ta || '-'}</td>
                <td>${c.ects}</td>
                <td>${c.duration}</td>
            </tr>
        `;
    });
    tbody.innerHTML = localizeHtmlMarkup(html);
}

const MAX_SEMESTER_DROPDOWN = 12;
window.MAX_SEMESTER_DROPDOWN = MAX_SEMESTER_DROPDOWN;
const CUSTOM_SEMESTER_OPTION = '__custom_semester__';

const normalizeSemesterList = window.normalizeSemesterList;
const normalizeSubjectSemesters = window.normalizeSubjectSemesters;
const subjectMatchesSemesterFilter = window.subjectMatchesSemesterFilter;
const formatSubjectSemestersLabel = window.formatSubjectSemestersLabel;
const formatCurriculumSubjectDisplayName = window.formatCurriculumSubjectDisplayName;
const formatCurriculumSubjectSubtitle = window.formatCurriculumSubjectSubtitle;
const getBuilderSubjectSemesters = window.getBuilderSubjectSemesters;
const setBuilderSubjectSemesters = window.setBuilderSubjectSemesters;
const getPrimarySemesterFromBuilder = window.getPrimarySemesterFromBuilder;
const getSemesterParityDescriptionForSemesters = window.getSemesterParityDescriptionForSemesters;
const toRegistrationPositiveInt = window.toRegistrationPositiveInt;
const populateSemesterSelectOptions = window.populateSemesterSelectOptions;
const getSemesterNumberFromControl = window.getSemesterNumberFromControl;
const getSemesterParityDescription = window.getSemesterParityDescription;
const refreshSemesterDropdowns = window.refreshSemesterDropdowns;
const ensureSubjectSemesterParityHint = window.ensureSubjectSemesterParityHint;
const toggleConditionBox = window.toggleConditionBox;
const getSelectedConditionEntries = window.getSelectedConditionEntries;
const renderSelectedConditionEntries = window.renderSelectedConditionEntries;
const addConditionSelection = window.addConditionSelection;
const removeConditionSelection = window.removeConditionSelection;
const clearConditionSelection = window.clearConditionSelection;

function filterSubjects(query = '') {
    const list = document.getElementById('subject-search-results');
    if (!list) return;
    const normalizedQuery = String(query || '').trim().toLowerCase();
    const faculty = getCurrentFaculty();
    const subjects = (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(faculty) : [])
        .filter((subject) => {
            if (!normalizedQuery) return true;
            return String(subject?.id || '').toLowerCase().includes(normalizedQuery)
                || String(subject?.name || '').toLowerCase().includes(normalizedQuery);
        })
        .slice(0, 40);

    list.innerHTML = subjects.length === 0
        ? '<div class="registration-condition-empty">No subjects match this search.</div>'
        : subjects.map((subject) => `
            <button type="button" class="registration-condition-result" data-subject-condition-select="1" data-subject-code="${escapeHtml(subject.id)}" data-subject-name="${escapeHtml(subject.name || subject.id)}">
                <strong>[${escapeHtml(subject.id)}]</strong> ${escapeHtml(subject.name || 'Untitled Subject')}
            </button>
        `).join('');
    list.hidden = false;
}

const debouncedFilterSubjects = (query) => filterSubjects(query);

function selectCondition(code, name, event = null) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    addConditionSelection(code, name);
    const input = document.getElementById('subject-search-input');
    if (input) input.value = '';
    filterSubjects('');
}

function getSelectedAntiReqCodes() {
    const picker = document.getElementById('new-subject-antireq-picker');
    if (!picker) return [];
    try {
        const parsed = JSON.parse(picker.dataset.selected || '[]');
        return Array.isArray(parsed) ? parsed.filter((code) => code && code !== 'None') : [];
    } catch (_) {
        return [];
    }
}

function setSelectedAntiReqCodes(codes) {
    const picker = document.getElementById('new-subject-antireq-picker');
    if (!picker) return;
    const normalized = [...new Set((codes || []).map((code) => String(code || '').trim()).filter((code) => code && code !== 'None'))];
    picker.dataset.selected = JSON.stringify(normalized);
    const hidden = document.getElementById('new-subject-antireq');
    if (hidden) hidden.value = normalized.join(', ');

    const selectedRow = picker.querySelector('[data-role="selected-anti-row"]');
    if (selectedRow) {
        selectedRow.innerHTML = normalized.length > 0
            ? normalized.map((code) => `
                <span class="registration-antireq-chip">
                    <span>${escapeHtml(code)}</span>
                    <button type="button" class="registration-antireq-chip-remove" data-antireq-action="toggle" data-anti-code="${escapeHtml(code)}">&times;</button>
                </span>
            `).join('')
            : '<span class="registration-antireq-empty">No anti-requisites selected</span>';
    }

    picker.querySelectorAll('[data-anti-code]').forEach((button) => {
        const active = normalized.includes(button.dataset.antiCode);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.classList.toggle('is-active', active);
    });
}

function toggleAntiReqSelection(code) {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode) return;
    const current = getSelectedAntiReqCodes();
    if (current.includes(normalizedCode)) {
        setSelectedAntiReqCodes(current.filter((entry) => entry !== normalizedCode));
    } else {
        setSelectedAntiReqCodes([...current, normalizedCode]);
    }
}

function populateAntiReqDropdown() {
    const picker = document.getElementById('new-subject-antireq-picker');
    if (!picker) return;
    const selectedValues = getSelectedAntiReqCodes();
    const subjects = (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(getCurrentFaculty()) : [])
        .slice()
        .sort((left, right) => String(left?.name || '').localeCompare(String(right?.name || '')));

    picker.className = 'lux-glass-dialog-field lux-admin-tools-antireq-picker';
    picker.innerHTML = `
        <span class="social-neo-label">Anti-requisites</span>
        <span class="lux-admin-tools-antireq-hint">Block enrollment when another course is taken</span>
        <div data-role="selected-anti-row" class="registration-antireq-selected-row lux-admin-tools-antireq-selected${selectedValues.length > 0 ? '' : ' is-empty'}">
            ${selectedValues.length > 0
                ? selectedValues.map((code) => `
                    <span class="registration-antireq-chip">
                        <span>${escapeHtml(code)}</span>
                        <button type="button" class="registration-antireq-chip-remove" data-antireq-action="toggle" data-anti-code="${escapeHtml(code)}" aria-label="Remove ${escapeHtml(code)}">&times;</button>
                    </span>
                `).join('')
                : '<span class="registration-antireq-empty">No anti-requisites selected</span>'}
        </div>
        <div class="registration-antireq-toolbar">
            <button type="button" data-antireq-action="clear" class="lux-ghost-btn registration-antireq-clear-btn">Clear all</button>
        </div>
        <div class="registration-antireq-options lux-admin-tools-antireq-options">
            ${subjects.length === 0
                ? '<div class="registration-antireq-empty">No subjects found</div>'
                : subjects.map((subject) => {
                    const active = selectedValues.includes(subject.id);
                    return `
                        <button type="button" class="registration-antireq-option${active ? ' is-active' : ''}" data-antireq-action="toggle" data-anti-code="${escapeHtml(subject.id)}" aria-pressed="${active ? 'true' : 'false'}">
                            [${escapeHtml(subject.id)}] ${escapeHtml(subject.name || subject.id)}
                        </button>
                    `;
                }).join('')}
        </div>
    `;

    setSelectedAntiReqCodes(selectedValues);
}

function getSelectedCurriculumLibraryModule(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    const modules = ensureCurriculumLibraryModules(normalizedFaculty);
    const selectedId = curriculumLibraryUiState.selectedModulesByFaculty[normalizedFaculty];
    const selected = modules.find((module) => module.id === selectedId) || modules[0] || null;
    if (selected) {
        curriculumLibraryUiState.selectedModulesByFaculty[normalizedFaculty] = selected.id;
    } else {
        delete curriculumLibraryUiState.selectedModulesByFaculty[normalizedFaculty];
    }
    return selected;
}

function setCurriculumLibraryModuleSelection(moduleId, faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    if (!moduleId) {
        delete curriculumLibraryUiState.selectedModulesByFaculty[normalizedFaculty];
        return;
    }
    curriculumLibraryUiState.selectedModulesByFaculty[normalizedFaculty] = String(moduleId);
}

function syncCurriculumSubjectBuilderTarget(faculty = getCurrentFaculty()) {
    const badge = document.getElementById('curriculum-form-module-target');
    const help = document.getElementById('curriculum-form-module-help');
    const saveBtn = document.getElementById('save-curriculum-subject-btn');
    const selectedModule = getSelectedCurriculumLibraryModule(faculty);

    if (badge) {
        badge.innerHTML = selectedModule
            ? `<i class="fas fa-layer-group" aria-hidden="true"></i><span>${escapeHtml(selectedModule.name)}</span>`
            : '<i class="fas fa-layer-group" aria-hidden="true"></i><span>No module selected</span>';
    }
    if (help) {
        help.textContent = selectedModule
            ? `New subjects will be saved into ${selectedModule.name}.`
            : 'Create or select a curriculum module first, then save the subject into it.';
    }
    if (saveBtn) {
        saveBtn.disabled = !selectedModule;
        saveBtn.classList.toggle('is-disabled-by-module', !selectedModule);
    }
}

function closeBuilderSemesterPickerPanel() {
    const panel = document.getElementById('new-subject-semester-lux-panel');
    if (!panel?.classList.contains('is-open')) return;
    if (typeof window.closePickerPanels === 'function') {
        window.closePickerPanels();
    }
}

function resetCurriculumSubjectBuilderForm() {
    if (!curriculumLibraryUiState.editingSubjectId) {
        syncCurriculumSubjectBuilderModalCopy('create');
    }
    const nameInput = document.getElementById('new-subject-name');
    if (nameInput) nameInput.value = '';
    const codePreview = document.getElementById('new-subject-code-preview');
    if (codePreview) codePreview.value = '';
    const conditionCheckbox = document.getElementById('has-condition-checkbox');
    if (conditionCheckbox instanceof HTMLInputElement) conditionCheckbox.checked = false;
    clearConditionSelection();
    toggleConditionBox();
    setSelectedAntiReqCodes([]);
    const parityCheckbox = document.getElementById('new-subject-parity-both-checkbox');
    if (parityCheckbox instanceof HTMLInputElement) parityCheckbox.checked = false;
    setBuilderSubjectSemesters([1]);
    if (typeof window.syncCurriculumSemesterPickerUi === 'function') {
        window.syncCurriculumSemesterPickerUi();
    }
    ensureSubjectSemesterParityHint();
    if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();
}

function closeCurriculumSubjectBuilderModal() {
    const modal = document.getElementById('kiu-subject-builder-modal');
    if (!modal || modal.hidden) return;
    closeBuilderSemesterPickerPanel();
    curriculumLibraryUiState.editingSubjectId = null;
    if (typeof window.closeLuxPortalModal === 'function') {
        window.closeLuxPortalModal(modal, { remove: false });
        return;
    }
    modal.classList.remove('is-open', 'is-closing');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
}

function openCurriculumSubjectBuilderModalShell(modal, focusSelector) {
    if (!modal) return;
    if (!modal.hasAttribute('data-lux-transparency-exempt')) {
        modal.setAttribute('data-lux-transparency-exempt', '1');
    }
    if (document.body.classList.contains('lux-route-admin-tools')) {
        modal.dataset.luxStructuredModal = '1';
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            window.queueLuxuryTransparencyRefresh(undefined, { roots: [modal] });
        }
    }
    openLuxPortalModalAfterAppend(modal, { focusSelector });
}

function syncCurriculumSubjectBuilderModalCopy(mode = 'create') {
    const title = document.getElementById('subject-builder-modal-title');
    const titleIcon = document.querySelector('#kiu-subject-builder-modal .lux-glass-dialog-title i');
    const subtitle = document.querySelector('#kiu-subject-builder-modal .lux-glass-dialog-subtitle');
    const saveBtn = document.getElementById('save-curriculum-subject-btn');
    const isEdit = mode === 'edit';
    if (title) title.textContent = isEdit ? 'Edit Subject' : 'Add Subject';
    if (titleIcon) {
        titleIcon.className = isEdit ? 'fas fa-pen' : 'fas fa-book-open';
        titleIcon.setAttribute('aria-hidden', 'true');
    }
    if (subtitle) {
        subtitle.textContent = isEdit
            ? 'Update course details for the active faculty.'
            : 'Create a new course for the active faculty.';
    }
    if (saveBtn) {
        saveBtn.innerHTML = isEdit
            ? '<i class="fas fa-save"></i> Update Subject'
            : '<i class="fas fa-plus"></i> Save Subject';
    }
}

function openCurriculumSubjectBuilderModal() {
    const modal = document.getElementById('kiu-subject-builder-modal');
    if (!modal) return;
    closeBuilderSemesterPickerPanel();
    curriculumLibraryUiState.editingSubjectId = null;
    resetCurriculumSubjectBuilderForm();
    syncCurriculumSubjectBuilderModalCopy('create');
    syncCurriculumSubjectBuilderTarget(getCurrentFaculty());
    openCurriculumSubjectBuilderModalShell(modal, '#new-subject-name');
}

function parseCurriculumRequirementTokens(value, prefix) {
    return String(value || '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
            const match = part.match(new RegExp(`\\[${prefix}\\]\\s*(.+)$`, 'i'));
            return match ? match[1].trim() : part.replace(/^\[.*?\]\s*/, '').trim();
        })
        .filter(Boolean);
}

function populateCurriculumSubjectBuilderForEdit(subject) {
    if (!subject) return;
    const nameInput = document.getElementById('new-subject-name');
    if (nameInput) nameInput.value = String(subject.name || '');
    const codePreview = document.getElementById('new-subject-code-preview');
    if (codePreview) codePreview.value = String(subject.id || '');
    const ectsInput = document.getElementById('new-subject-ects');
    if (ectsInput) ectsInput.value = String(toRegistrationPositiveInt(subject.ects, 6) || 6);
    const parityCheckbox = document.getElementById('new-subject-parity-both-checkbox');
    if (parityCheckbox instanceof HTMLInputElement) {
        parityCheckbox.checked = String(subject.parityMode || '').toLowerCase() === 'both';
    }

    const semesters = normalizeSubjectSemesters(subject);
    setBuilderSubjectSemesters(semesters.length ? semesters : [1]);
    if (typeof window.syncCurriculumSemesterPickerUi === 'function') {
        window.syncCurriculumSemesterPickerUi();
    }

    const prerequisiteCodes = parseCurriculumRequirementTokens(subject.cond, 'REQ')
        .filter((code) => code && code !== 'None');
    const antiReqCodes = parseCurriculumRequirementTokens(subject.antireq, 'ANTI')
        .filter((code) => code && code !== 'None');
    const conditionCheckbox = document.getElementById('has-condition-checkbox');
    if (conditionCheckbox instanceof HTMLInputElement) {
        conditionCheckbox.checked = prerequisiteCodes.length > 0;
    }
    toggleConditionBox();
    if (prerequisiteCodes.length > 0) {
        const subjectsById = new Map((typeof getActiveCurriculum === 'function' ? getActiveCurriculum(getCurrentFaculty()) : [])
            .map((entry) => [entry.id, entry]));
        renderSelectedConditionEntries(prerequisiteCodes.map((code) => ({
            code,
            name: subjectsById.get(code)?.name || code
        })));
    } else {
        clearConditionSelection();
    }
    setSelectedAntiReqCodes(antiReqCodes);
    ensureSubjectSemesterParityHint();
    if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();
}

function openCurriculumSubjectBuilderModalForEdit(subjectId) {
    const normalizedSubjectId = String(subjectId || '').trim();
    if (!normalizedSubjectId) return;
    const faculty = getCurrentFaculty();
    const subject = (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(faculty) : [])
        .find((entry) => entry.id === normalizedSubjectId);
    if (!subject) return;

    const modal = document.getElementById('kiu-subject-builder-modal');
    if (!modal) return;
    closeBuilderSemesterPickerPanel();
    curriculumLibraryUiState.editingSubjectId = normalizedSubjectId;
    resetCurriculumSubjectBuilderForm();
    populateCurriculumSubjectBuilderForEdit(subject);
    syncCurriculumSubjectBuilderModalCopy('edit');
    syncCurriculumSubjectBuilderTarget(faculty);
    openCurriculumSubjectBuilderModalShell(modal, '#new-subject-name');
}

function focusCurriculumSubjectBuilder() {
    openCurriculumSubjectBuilderModal();
}

function getCurriculumLibrarySearchQuery(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    curriculumLibraryUiState.searchQueryByFaculty = curriculumLibraryUiState.searchQueryByFaculty || {};
    return String(curriculumLibraryUiState.searchQueryByFaculty[normalizedFaculty] || '').trim();
}

function setCurriculumLibrarySearchQuery(value, faculty = getCurrentFaculty(), shouldRender = true) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    curriculumLibraryUiState.searchQueryByFaculty = curriculumLibraryUiState.searchQueryByFaculty || {};
    curriculumLibraryUiState.searchQueryByFaculty[normalizedFaculty] = String(value || '').trim();
    if (shouldRender) renderCurriculumTable();
}

function syncCurriculumLibrarySearchQuery(value, faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    curriculumLibraryUiState.searchQueryByFaculty = curriculumLibraryUiState.searchQueryByFaculty || {};
    curriculumLibraryUiState.searchQueryByFaculty[normalizedFaculty] = String(value || '').trim();
    if (curriculumLibraryUiState.searchDebounceTimer) {
        window.clearTimeout(curriculumLibraryUiState.searchDebounceTimer);
    }
    curriculumLibraryUiState.searchDebounceTimer = window.setTimeout(() => {
        renderCurriculumTable();
    }, 120);
}

function filterCurriculumLibrarySubjects(subjects, faculty, searchQuery = '') {
    const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
    if (!normalizedQuery) return Array.isArray(subjects) ? subjects : [];
    return (Array.isArray(subjects) ? subjects : []).filter((subject) => {
        const searchFields = [
            subject?.id,
            subject?.name,
            subject?.cond,
            subject?.antireq,
            subject?.semester,
            subject?.ects,
            typeof getFacultyLabel === 'function' ? getFacultyLabel(subject?.faculty || faculty) : subject?.faculty
        ];
        return searchFields.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
    });
}

function buildCurriculumLibraryRenderContext(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    const semesterFilterSelect = document.getElementById('filter-curriculum-semester');
    const searchInput = document.getElementById('admin-curriculum-search');
    const preservedSemesterFilter = semesterFilterSelect?.value || 'all';
    const preservedSearchQuery = searchInput?.value || getCurriculumLibrarySearchQuery(normalizedFaculty);

    if (searchInput && searchInput.value !== preservedSearchQuery) searchInput.value = preservedSearchQuery;

    setCurriculumLibrarySearchQuery(preservedSearchQuery, normalizedFaculty, false);

    const semesterFilter = semesterFilterSelect?.value || preservedSemesterFilter;
    const searchQuery = getCurriculumLibrarySearchQuery(normalizedFaculty);
    const modules = ensureCurriculumLibraryModules(normalizedFaculty);
    const selectedModule = getSelectedCurriculumLibraryModule(normalizedFaculty);
    const selectedModuleSubjectsAll = getCurriculumLibraryModuleSubjects(selectedModule, normalizedFaculty, 'all');
    const semesterFilteredSubjects = getCurriculumLibraryModuleSubjects(selectedModule, normalizedFaculty, semesterFilter);
    const moduleSubjects = filterCurriculumLibrarySubjects(semesterFilteredSubjects, normalizedFaculty, searchQuery);
    const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(normalizedFaculty) : normalizedFaculty;
    const selectedModuleName = selectedModule ? `${selectedModule.letter || ''}. ${selectedModule.name || 'Untitled Module'}`.trim() : 'No module selected';
    const selectedModuleEcts = selectedModule ? getCurriculumModuleEctsTotal(selectedModule, normalizedFaculty) : 0;
    const selectedModuleLimit = toRegistrationPositiveInt(selectedModule?.maxEcts, 0);
    const selectedModuleLoad = selectedModuleLimit > 0 ? Math.min(100, Math.round((selectedModuleEcts / selectedModuleLimit) * 100)) : 0;
    const semesterLabel = semesterFilter === 'all' ? 'All semesters' : `Semester ${semesterFilter}`;
    const searchLabel = searchQuery
        ? `${moduleSubjects.length} search result${moduleSubjects.length === 1 ? '' : 's'}`
        : `${moduleSubjects.length} subject${moduleSubjects.length === 1 ? '' : 's'} in current filter`;

    const allProgramSubjectsById = new Map();
    modules.forEach((module) => {
        getCurriculumLibraryModuleSubjects(module, normalizedFaculty, 'all').forEach((subject) => {
            if (subject?.id) allProgramSubjectsById.set(subject.id, subject);
        });
    });
    const allProgramSubjects = Array.from(allProgramSubjectsById.values());
    const totalProgramEcts = allProgramSubjects.reduce((sum, subject) => sum + toRegistrationPositiveInt(subject?.ects, 0), 0);
    const visibleEcts = moduleSubjects.reduce((sum, subject) => sum + toRegistrationPositiveInt(subject?.ects, 0), 0);
    const totalPrerequisiteSubjects = countSubjectsWithPrerequisites(allProgramSubjects);

    return {
        allProgramSubjects,
        faculty: normalizedFaculty,
        facultyLabel,
        moduleSubjects,
        modules,
        searchLabel,
        searchQuery,
        selectedModule,
        selectedModuleEcts,
        selectedModuleLimit,
        selectedModuleLoad,
        selectedModuleName,
        selectedModuleSubjectsAll,
        semesterFilter,
        semesterLabel,
        totalPrerequisiteSubjects,
        totalProgramEcts,
        visibleEcts
    };
}

function syncCurriculumLibraryCommandDeck(context) {
    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (node) node.textContent = value;
    };

    setText('curriculum-ops-total-ects', String(context.totalProgramEcts));
    setText('curriculum-ops-visible-ects', String(context.visibleEcts));
    setText('curriculum-ops-modules', String(context.modules.length));
    setText('curriculum-ops-prerequisites', String(context.totalPrerequisiteSubjects));

    const moduleLoadValue = context.selectedModule && context.selectedModuleLimit
        ? `${context.selectedModuleLoad}%`
        : (context.selectedModule ? `${context.selectedModuleEcts} ECTS` : '--');
    setText('curriculum-ops-module-load', moduleLoadValue);

    setText('curriculum-ops-total-ects-note', `${context.allProgramSubjects.length} subjects in program`);
    setText('curriculum-ops-visible-ects-note', context.semesterLabel);
    setText('curriculum-ops-modules-note', context.selectedModuleName);
    setText('curriculum-ops-prerequisites-note', 'Subjects with requirements');
    setText('curriculum-ops-module-load-note', context.selectedModule && context.selectedModuleLimit
        ? `${context.selectedModuleEcts}/${context.selectedModuleLimit} ECTS capacity`
        : (context.selectedModule ? context.searchLabel : 'Select a module'));
}

function ensureCurriculumLibraryWorkspaceShell(root) {
    if (!root || root.dataset.curriculumWorkspaceShell === '1') return;
    root.dataset.curriculumWorkspaceShell = '1';
    root.setAttribute('data-lux-transparency-exempt', '1');
    root.innerHTML = `
        <div class="lux-program-shell lux-admin-curriculum-shell">
            <div class="lux-program-grid lux-admin-curriculum-grid">
                <section id="curriculum-module-rail-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--module-rail"></section>
                <section id="curriculum-subject-panel-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--subject-panel"></section>
            </div>
        </div>
    `;
}

function refreshCurriculumLibraryPresentation() {
    const workspaceRoot = document.getElementById('curriculum-library-workspace-root');
    if (workspaceRoot) {
        workspaceRoot.setAttribute('data-lux-transparency-exempt', '1');
    }
    // Subpanel stamp removed — alignment.js owns flat nested chrome.
    // No class additions here to avoid race conditions with the alignment cleanup.
}

function renderCurriculumModuleRailRegion(context) {
    return `
        <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--module-rail">
            <div class="lux-program-section-head curriculum-library-head">
                <div class="lux-section-kicker"><i class="fas fa-layer-group"></i> Curriculum modules</div>
                <button type="button" class="lux-ghost-btn curriculum-library-btn" data-curriculum-add-module="1"><i class="fas fa-layer-group"></i> Add Module</button>
            </div>
            <div class="lux-module-rail lux-program-module-rail curriculum-library-list" data-preserve-scroll-key="curriculum-library-modules">
                ${context.modules.length === 0 ? `
                    <div class="lux-empty-state lux-program-empty-state">
                        <i class="fas fa-layer-group"></i>
                        <strong class="lux-empty-state__title">No curriculum modules yet</strong>
                        <span class="lux-empty-state__copy">Create a module to start organizing subjects.</span>
                        <button type="button" class="lux-primary-btn curriculum-library-empty-state-action" data-curriculum-add-module="1"><i class="fas fa-plus"></i> Create Module</button>
                    </div>
                ` : context.modules.map((module) => {
                    const active = context.selectedModule && module.id === context.selectedModule.id;
                    const moduleSubjectsForFaculty = getCurriculumLibraryModuleSubjects(module, context.faculty, 'all');
                    const ectsTotal = getCurriculumModuleEctsTotal(module, context.faculty);
                    const subjectCount = getCurriculumLibraryModuleSubjects(module, context.faculty, context.semesterFilter).length;
                    const limit = toRegistrationPositiveInt(module.maxEcts, 0);
                    const load = limit > 0 ? Math.min(100, Math.round((ectsTotal / limit) * 100)) : 0;
                    const moduleSemesters = getCurriculumSemesterCoverage(moduleSubjectsForFaculty);
                    return `
                        <label class="lux-module-option lux-program-module-option curriculum-library-module-option${active ? ' is-active' : ''}">
                            <span class="lux-module-option__main curriculum-library-module-option-head">
                                <input class="curriculum-library-module-option-radio" type="radio" name="curriculum-library-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} data-curriculum-module-select="${escapeHtml(module.id)}">
                                <span class="lux-module-option__text">
                                    <span class="lux-module-option__title curriculum-library-module-option-title">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled Module'}`.trim())}</span>
                                    <span class="lux-module-option__meta curriculum-library-module-option-meta">${subjectCount} subjects in current filter / ${escapeHtml(moduleSemesters)}</span>
                                </span>
                            </span>
                            <span class="lux-module-option__right">
                                <span class="lux-status-pill wave2-chip wave2-chip--pill lux-admin-curriculum-ects-pill">ECTS: ${ectsTotal}${limit ? `/${limit}` : ''}</span>
                                <span class="lux-module-option__meter"><span class="lux-module-option__meter-bar" style="--lux-program-module-load:${load}%"></span></span>
                            </span>
                        </label>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function renderCurriculumSubjectPanelRegion(context) {
    return `
        <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--subject-panel lux-program-subject-panel curriculum-library-panel curriculum-library-panel--detail">
            ${context.selectedModule ? `
                <div class="lux-program-section-head lux-program-detail-head curriculum-library-detail-head">
                    <div class="curriculum-library-detail-summary">
                        <div class="lux-section-title lux-program-module-title curriculum-library-detail-title">${escapeHtml(context.selectedModule.name)}</div>
                        <div class="lux-card-meta curriculum-library-detail-meta">${getCurriculumLibraryModuleSubjects(context.selectedModule, context.faculty, 'all').length} subjects / ${getCurriculumModuleEctsTotal(context.selectedModule, context.faculty)} ECTS</div>
                    </div>
                    <div class="curriculum-library-detail-actions">
                        <button type="button" class="lux-ghost-btn curriculum-library-btn curriculum-library-btn--compact" data-curriculum-add-module="1"><i class="fas fa-layer-group"></i> Add Module</button>
                        <button type="button" class="lux-ghost-btn curriculum-library-btn curriculum-library-btn--compact" data-curriculum-edit-module="${escapeHtml(context.selectedModule.id)}"><i class="fas fa-edit"></i> Edit</button>
                        <button type="button" class="lux-ghost-btn curriculum-library-btn curriculum-library-btn--compact curriculum-library-btn--danger" data-curriculum-delete-module="${escapeHtml(context.selectedModule.id)}"><i class="fas fa-trash"></i></button>
                        <button type="button" class="lux-primary-btn curriculum-library-btn curriculum-library-btn--primary" data-curriculum-focus-builder="1"><i class="fas fa-plus"></i> Add Subject</button>
                    </div>
                </div>
                <div class="lux-program-column-head lux-program-detail-columns" aria-hidden="true">
                    <div class="lux-program-column-code">Code</div>
                    <div class="lux-program-column-subject">Subject title / requirements</div>
                    <div class="lux-program-column-ects">ECTS / actions</div>
                </div>
                <div class="lux-program-subject-list lux-program-detail-list curriculum-library-row-list" id="curriculum-subject-row-list" aria-label="Module subjects">
                    ${renderCurriculumLibraryModuleRows(context.selectedModule, context.moduleSubjects, context.faculty, context.searchQuery ? 'search' : context.semesterFilter)}
                </div>
            ` : `
                <div class="lux-empty-state lux-program-empty-state lux-program-empty-state--panel curriculum-library-empty-state">
                    <i class="fas fa-layer-group"></i>
                    <strong class="lux-empty-state__title">${(context.modules && context.modules.length) ? 'Select a module' : 'Create a module in the list'}</strong>
                    <span class="lux-empty-state__copy">${(context.modules && context.modules.length)
                        ? 'Choose a module from the list to start organizing subjects.'
                        : 'Use Create Module in the modules list to start organizing subjects.'}</span>
                </div>
            `}
        </div>
    `;
}

function renderCurriculumLibraryModuleRows(module, subjects, faculty, semesterFilter) {
    if (!module || !subjects.length) {
        const emptyText = semesterFilter === 'search'
            ? 'No subjects match the current search query.'
            : semesterFilter === 'all'
                ? 'No subjects are assigned to this module yet.'
                : 'No subjects in this module match the selected semester filter.';
        return `
            <div class="lux-empty-state lux-program-empty-state lux-program-empty-state--subjects">
                <i class="fas fa-book-open"></i>
                <strong class="lux-empty-state__title">Nothing to show</strong>
                <span class="lux-empty-state__copy">${escapeHtml(emptyText)}</span>
            </div>
        `;
    }

    return subjects.map((subject, index) => {
        const prerequisite = subject.cond && subject.cond !== 'None' ? subject.cond : 'None';
        const antiReq = subject.antireq && subject.antireq !== 'None' ? subject.antireq : '';
        const hasPrerequisite = prerequisite !== 'None';
        const semesters = normalizeSubjectSemesters(subject);
        const facultyLabel = typeof getFacultyLabel === 'function'
            ? getFacultyLabel(subject.faculty || faculty)
            : String(subject.faculty || faculty || '');
        const semesterChips = semesters.length
            ? semesters.map((semester) => `<span class="lux-status-pill wave2-chip wave2-chip--pill">Semester ${escapeHtml(String(semester))}</span>`).join('')
            : '<span class="lux-status-pill wave2-chip wave2-chip--pill is-muted">No semester</span>';
        const subtitle = formatCurriculumSubjectSubtitle(subject);
        return `
            <article class="lux-subject-row lux-program-subject-card ${hasPrerequisite ? 'has-prerequisite' : 'is-open'}">
                <div class="lux-subject-row__code">
                    <div>${escapeHtml(subject.id)}</div>
                    <div class="lux-subject-row__meta">#${index + 1}</div>
                </div>
                <div class="lux-subject-row__body">
                    <div class="lux-subject-row__title">${escapeHtml(formatCurriculumSubjectDisplayName(subject))}</div>
                    <div class="lux-subject-row__secondary">
                        ${subtitle ? `<div class="lux-subject-row__meta">${escapeHtml(subtitle)}</div>` : ''}
                        <div class="lux-subject-row__meta">${escapeHtml(facultyLabel)}</div>
                        <div class="lux-subject-row__chips">
                            ${semesterChips}
                            <span class="lux-status-pill wave2-chip wave2-chip--pill">${escapeHtml(String(subject.ects || 0))} ECTS</span>
                        </div>
                        <div class="lux-subject-row__detail" title="${escapeHtml(prerequisite)}"><strong>Prerequisite:</strong> ${escapeHtml(prerequisite)}</div>
                        ${antiReq ? `<div class="lux-subject-row__detail is-soft" title="${escapeHtml(antiReq)}"><strong>Anti-requisite:</strong> ${escapeHtml(antiReq)}</div>` : ''}
                    </div>
                </div>
                <div class="lux-subject-row__stats">
                    <span class="lux-program-requirement ${hasPrerequisite ? 'is-locked' : 'is-open'}">
                        <i class="fas ${hasPrerequisite ? 'fa-link' : 'fa-check'}"></i>
                        ${hasPrerequisite ? 'Requires' : 'Open'}
                    </span>
                    <div class="lux-subject-row__actions curriculum-library-subject-actions" role="group" aria-label="Subject actions">
                        <button type="button" class="lux-icon-btn curriculum-library-subject-action-btn" data-curriculum-edit-subject="${escapeHtml(subject.id)}" aria-label="Edit ${escapeHtml(subject.id)}"><i class="fas fa-pen" aria-hidden="true"></i></button>
                        <button type="button" class="lux-icon-btn curriculum-library-subject-action-btn curriculum-library-btn--danger" data-curriculum-delete-subject="${escapeHtml(subject.id)}" aria-label="Delete ${escapeHtml(subject.id)}"><i class="fas fa-trash-alt" aria-hidden="true"></i></button>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function renderCurriculumTable() {
    const workspaceRoot = document.getElementById('curriculum-library-workspace-root');
    const legacyRoot = document.getElementById('curriculum-library-modules-root');
    const tbody = document.getElementById('curriculum-table-body');
    if (!workspaceRoot && !legacyRoot && !tbody) return;

    const faculty = getCurrentFaculty();
    if (typeof syncCurriculumFacultyBadge === 'function') syncCurriculumFacultyBadge(faculty);
    ensureSubjectSemesterParityHint();
    syncCurriculumSubjectBuilderTarget(faculty);

    if (workspaceRoot || legacyRoot) {
        const context = buildCurriculumLibraryRenderContext(faculty);
        syncCurriculumLibraryCommandDeck(context);

        if (workspaceRoot) {
            ensureCurriculumLibraryWorkspaceShell(workspaceRoot);
            const moduleRailRegion = document.getElementById('curriculum-module-rail-region');
            const subjectPanelRegion = document.getElementById('curriculum-subject-panel-region');
            if (moduleRailRegion) moduleRailRegion.innerHTML = renderCurriculumModuleRailRegion(context);
            if (subjectPanelRegion) subjectPanelRegion.innerHTML = renderCurriculumSubjectPanelRegion(context);
            refreshCurriculumLibraryPresentation();
        } else if (legacyRoot) {
            legacyRoot.innerHTML = `
                <div class="curriculum-library-layout">
                    <div class="lux-surface curriculum-library-panel">${renderCurriculumModuleRailRegion(context)}</div>
                    <div class="lux-surface">${renderCurriculumSubjectPanelRegion(context)}</div>
                </div>
            `;
            if (typeof initCurriculumLibraryRowScroll === 'function') initCurriculumLibraryRowScroll(legacyRoot);
        }

        populateAntiReqDropdown();
        if (typeof window.syncCurriculumSemesterPickerUi === 'function') {
            window.syncCurriculumSemesterPickerUi({
                onChange: () => {
                    if (typeof ensureSubjectSemesterParityHint === 'function') ensureSubjectSemesterParityHint();
                    if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();
                }
            });
        }
        return;
    }

    if (tbody) {
        const subjects = (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(faculty) : [])
            .filter((subject) => subjectMatchesSemesterFilter(subject, semesterFilter));
        tbody.innerHTML = subjects.length === 0
            ? '<tr><td colspan="7" class="curriculum-library-table-empty">No subjects found for this view.</td></tr>'
            : subjects.map((subject) => `
                <tr>
                    <td>${escapeHtml(subject.id)}</td>
                    <td>${escapeHtml(formatCurriculumSubjectDisplayName(subject))}</td>
                    <td>${escapeHtml(String(subject.ects || 0))}</td>
                    <td>${escapeHtml(formatSubjectSemestersLabel(normalizeSubjectSemesters(subject)))}</td>
                    <td>${escapeHtml(subject.cond || 'None')}</td>
                    <td>${escapeHtml(subject.antireq || 'None')}</td>
                    <td><button type="button" data-curriculum-delete-subject="${escapeHtml(subject.id)}" class="lux-icon-btn curriculum-library-subject-action-btn curriculum-library-btn--danger curriculum-library-table-delete-btn" aria-label="Delete ${escapeHtml(subject.id)}"><i class="fas fa-trash-alt" aria-hidden="true"></i></button></td>
                </tr>
            `).join('');
    }
}

function addCurriculumLibraryModule() {
    const faculty = getCurrentFaculty();
    openStructuredFormModal({
        title: 'Add Module',
        subtitle: 'Create a curriculum module for the active faculty.',
        submitLabel: 'Create Module',
        titleIcon: 'fa-layer-group',
        fields: [
            { name: 'moduleName', label: 'Module Name', placeholder: 'Enter module name', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 30 }
        ],
        onSave: (values, close) => {
            const name = String(values.moduleName || '').trim();
            if (!name) return;
            const maxEcts = toRegistrationPositiveInt(values.maxEcts, 30);
            const modules = ensureCurriculumLibraryModules(faculty);
            const nextModule = {
                id: `CLM-${normalizeFacultyCode(faculty, 'ECON')}-${Date.now()}`,
                letter: String.fromCharCode(65 + (modules.length % 26)),
                name,
                maxEcts,
                subjectIds: [],
                systemDefault: false
            };
            modules.push(nextModule);
            setCurriculumLibraryModuleSelection(nextModule.id, faculty);
            saveState();
            close();
            renderCurriculumTable();
        }
    });
}

function editCurriculumLibraryModule(moduleId) {
    const faculty = getCurrentFaculty();
    const module = ensureCurriculumLibraryModules(faculty).find((item) => item.id === moduleId);
    if (!module) return;
    openStructuredFormModal({
        title: 'Edit Module',
        subtitle: 'Change the module name and maximum credit limit.',
        submitLabel: 'Save Changes',
        titleIcon: 'fa-pen',
        fields: [
            { name: 'moduleName', label: 'Module Name', value: module.name || '', placeholder: 'Enter module name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: module.maxEcts || 0 }
        ],
        onSave: (values, close) => {
            const nextName = String(values.moduleName || '').trim();
            if (!nextName) return;
            const nextMaxEcts = toRegistrationPositiveInt(values.maxEcts, toRegistrationPositiveInt(module.maxEcts, 0));
            module.name = nextName;
            module.maxEcts = nextMaxEcts;
            saveState();
            close();
            renderCurriculumTable();
        }
    });
}

function attachSubjectToCurriculumLibraryModule(subjectId, faculty = getCurrentFaculty()) {
    const modules = ensureCurriculumLibraryModules(faculty);
    let module = getSelectedCurriculumLibraryModule(faculty);
    if (!module) {
        module = buildDefaultCurriculumModule(faculty, []);
        modules.push(module);
        setCurriculumLibraryModuleSelection(module.id, faculty);
    }
    if (!(module.subjectIds || []).includes(subjectId)) {
        module.subjectIds = [...new Set([...(module.subjectIds || []), subjectId])];
    }
    if (module.systemDefault) {
        module.maxEcts = Math.max(toRegistrationPositiveInt(module.maxEcts, 0), getCurriculumModuleEctsTotal(module, faculty));
    }
}

