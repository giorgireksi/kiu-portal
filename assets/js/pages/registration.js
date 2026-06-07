/* Study card, registration, profile, chancellery, and admin curriculum page logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- STUDY CARD ---
function toggleGradeDetails(btn) {
    const popover = btn.nextElementSibling;
    popover.classList.toggle('show');
}

// --- REGISTRATION ---
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

    const programClear = event.target.closest('[data-student-program-clear-search]');
    if (programClear) {
        event.preventDefault();
        setStudentEducationalProgramSearchQuery('', String(programClear.getAttribute('data-program-faculty') || getCurrentFaculty()));
        return;
    }

    const programSemester = event.target.closest('[data-student-program-semester]');
    if (programSemester) {
        event.preventDefault();
        const semester = String(programSemester.getAttribute('data-student-program-semester') || 'all');
        const filter = document.getElementById('student-program-semester-filter');
        if (filter) filter.value = semester;
        renderStudentEducationalProgramPage();
        return;
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
            openProfilePage(
                String(provisionAction.getAttribute('data-profile-role') || ''),
                String(provisionAction.getAttribute('data-profile-id') || ''),
                String(provisionAction.getAttribute('data-profile-faculty') || '')
            );
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

    const curriculumAction = event.target.closest('[data-curriculum-add-module], [data-curriculum-edit-module], [data-curriculum-delete-module], [data-curriculum-focus-builder], [data-curriculum-delete-subject]');
    if (curriculumAction) {
        event.preventDefault();
        if (curriculumAction.hasAttribute('data-curriculum-add-module')) return addCurriculumLibraryModule();
        if (curriculumAction.hasAttribute('data-curriculum-edit-module')) {
            return editCurriculumLibraryModule(String(curriculumAction.getAttribute('data-curriculum-edit-module') || ''));
        }
        if (curriculumAction.hasAttribute('data-curriculum-delete-module')) {
            return deleteCurriculumLibraryModule(String(curriculumAction.getAttribute('data-curriculum-delete-module') || ''));
        }
        if (curriculumAction.hasAttribute('data-curriculum-focus-builder')) return focusCurriculumSubjectBuilder();
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

    if (target.matches('[data-student-program-semester-filter]')) {
        renderStudentEducationalProgramPage();
        return;
    }

    if (target.matches('[data-student-program-module-select]')) {
        setStudentEducationalProgramModuleSelection(
            String(target.getAttribute('data-student-program-module-select') || ''),
            String(target.getAttribute('data-program-faculty') || getCurrentFaculty())
        );
        return;
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

    if (target.matches('[data-student-program-search]')) {
        syncStudentEducationalProgramSearchQuery(
            target.value,
            String(target.getAttribute('data-program-faculty') || getCurrentFaculty())
        );
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

// --- PROFILE TABS ---
function ensureProfileTabContent(tab) {
    const panel = document.getElementById(`profile-tab-${tab}`);
    if (!panel || panel.dataset.profileMounted === '1') return panel;
    const template = document.getElementById(`profile-tab-template-${tab}`);
    if (!template) return panel;
    panel.innerHTML = template.innerHTML;
    panel.dataset.profileMounted = '1';
    return panel;
}

function switchProfileTab(tab, element) {
    document.querySelectorAll('#page-profile .tab').forEach(el => {
        el.classList.remove('active');
    });
    element.classList.add('active');

    const setProfilePanelShown = (panel, shown, displayValue = 'block') => {
        if (!panel) return;
        panel.hidden = !shown;
        panel.style.display = shown ? displayValue : 'none';
    };

    setProfilePanelShown(document.getElementById('profile-tab-info'), false);
    setProfilePanelShown(document.getElementById('profile-tab-email'), false);
    setProfilePanelShown(document.getElementById('profile-tab-password'), false);
    const calendarTab = document.getElementById('profile-tab-calendar');
    setProfilePanelShown(calendarTab, false);
    const messengerTab = document.getElementById('profile-tab-messenger');
    setProfilePanelShown(messengerTab, false);
    const targetPanel = ensureProfileTabContent(tab) || document.getElementById(`profile-tab-${tab}`);
    setProfilePanelShown(targetPanel, true, 'block');
    
    // Render calendar when calendar tab is clicked
    if (tab === 'calendar') {
        setTimeout(() => renderProfileCalendar(), 50);
    }
    if (tab === 'messenger' && typeof renderPortalMessengerWorkspace === 'function') {
        setTimeout(() => renderPortalMessengerWorkspace(), 50);
    }
}

if (!window.__profileTabDelegatesBound) {
    window.__profileTabDelegatesBound = true;
    document.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-profile-tab]');
        if (!trigger) return;
        event.preventDefault();
        switchProfileTab(trigger.dataset.profileTab || 'info', trigger);
    });
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

function renderRecentlyCreatedLegacy() {
    const list = document.getElementById('recently-created-list');
    if (!list) return;
    const recent = (KIU_STATE.users || []).slice(-8).reverse();
    if (recent.length === 0) { list.innerHTML = '<div class="admin-recent-empty">No accounts created yet.</div>'; return; }
    const accentTone = getFacultyThemeTone(getCurrentFaculty(), {
        useCurrentPalette: true,
        softAlpha: 0.12,
        borderAlpha: 0.24
    });
    
    list.innerHTML = recent.map(u => {
        const c = getFacultyThemeTone(u.faculty, { useCurrentPalette: false }).accent;
        const roleLabel = u.role === USER_ROLES.STUDENT
            ? 'STUDENT'
            : u.role === USER_ROLES.PROFESSOR
                ? 'PROFESSOR'
                : u.role === USER_ROLES.TA
                    ? 'TA'
                    : u.role === USER_ROLES.STUDENT_SERVICE
                        ? 'STUDENT SERVICE'
                        : 'ADMIN';
        const profileRole = u.role === USER_ROLES.STUDENT
            ? 'student'
            : u.role === USER_ROLES.PROFESSOR
                ? 'professor'
                : u.role === USER_ROLES.TA
                    ? 'ta'
                    : '';
        const statusTone = u.activationRequired || u.accountStatus === 'pending-activation'
            ? { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', label: 'Pending activation' }
            : u.mustChangePassword || u.accountStatus === 'active-temp-password'
                ? { bg: accentTone.softBg, border: accentTone.border, text: accentTone.accent, label: 'Initial password issued' }
            : { bg: '#ecfdf5', border: '#86efac', text: '#166534', label: 'Active account' };
        const statusClass = u.activationRequired || u.accountStatus === 'pending-activation'
            ? 'is-pending'
            : u.mustChangePassword || u.accountStatus === 'active-temp-password'
                ? 'is-issued'
                : 'is-active';
        return `
        <div class="admin-recent-card">
            <img class="admin-recent-avatar-img" src="${escapeHtml(getRegistrationAvatarSrc(u, { background: c, size: 40 }))}" alt="${escapeHtml(u.name || 'Account')}">
            <div class="admin-recent-card-main">
                <div class="admin-recent-card-title">${u.name}</div>
                <div class="admin-recent-card-role">${roleLabel} / ${u.faculty}</div>
                <div class="admin-recent-card-copy">
                    <div><strong>Email:</strong> ${u.email || 'Not assigned'}</div>
                    <div><strong>Registration ID:</strong> ${u.id}</div>
                    ${u.temporaryPassword ? `<div><strong>Initial Password:</strong> ${u.temporaryPassword}</div>` : ''}
                </div>
                <div class="admin-recent-status ${statusClass}">
                    <i class="fas ${u.activationRequired || u.accountStatus === 'pending-activation' ? 'fa-user-clock' : u.mustChangePassword || u.accountStatus === 'active-temp-password' ? 'fa-key' : 'fa-check-circle'}"></i> ${statusTone.label}
                </div>
            </div>
            <div class="admin-recent-id-badge ${profileRole ? 'is-clickable' : ''}" ${profileRole ? `data-provision-action="open-profile" data-profile-role="${profileRole}" data-profile-id="${escapeHtml(u.id)}" data-profile-faculty="${escapeHtml(u.faculty || '')}"` : ''}>${u.id}</div>
        </div>`;
    }).join('');
}

function renderRecentlyCreated() {
    const list = document.getElementById('recently-created-list');
    if (!list) return;

    const recent = (KIU_STATE.users || []).slice(-8).reverse();
    if (!recent.length) {
        list.innerHTML = `
            <div class="lux-empty-state">
                <i class="fas fa-users"></i>
                <strong>No accounts yet</strong>
                <span>Created accounts will appear here. Use the buttons above to get started.</span>
            </div>
        `;
        return;
    }

    const accentTone = getFacultyThemeTone(getCurrentFaculty(), {
        useCurrentPalette: true,
        softAlpha: 0.12,
        borderAlpha: 0.24
    });
    list.innerHTML = recent.map((u) => {
        const c = getFacultyThemeTone(u.faculty, { useCurrentPalette: false }).accent;
        const roleLabel = u.role === USER_ROLES.STUDENT
            ? 'Student'
            : u.role === USER_ROLES.PROFESSOR
                ? 'Professor'
                : u.role === USER_ROLES.TA
                    ? 'TA'
                    : u.role === USER_ROLES.STUDENT_SERVICE
                        ? 'Service Agent'
                        : 'Admin';
        const profileRole = u.role === USER_ROLES.STUDENT
            ? 'student'
            : u.role === USER_ROLES.PROFESSOR
                ? 'professor'
                : u.role === USER_ROLES.TA
                    ? 'ta'
                    : '';
        const statusClass = u.activationRequired || u.accountStatus === 'pending-activation'
            ? 'status-pending'
            : u.mustChangePassword || u.accountStatus === 'active-temp-password'
                ? 'status-issued'
                : 'status-active';
        const statusLabel = u.activationRequired || u.accountStatus === 'pending-activation'
            ? 'Pending'
            : u.mustChangePassword || u.accountStatus === 'active-temp-password'
                ? 'Password Set'
                : 'Active';

        return `
            <button type="button" class="lux-list-row admin-recent-row ${profileRole ? 'is-clickable' : ''}" ${profileRole ? `data-provision-action="open-profile" data-profile-role="${profileRole}" data-profile-id="${escapeHtml(u.id)}" data-profile-faculty="${escapeHtml(u.faculty || '')}"` : ''}>
                <div class="lux-avatar admin-recent-avatar-initial">
                    ${escapeHtml(String(u.name || 'U').slice(0, 2).toUpperCase())}
                </div>
                <div>
                    <strong>${escapeHtml(u.name || 'Unnamed account')}</strong>
                    <span>${escapeHtml(roleLabel)} / ${escapeHtml(u.faculty || 'N/A')}</span>
                </div>
                <div>
                    <span class="lux-pill ${statusClass}">${statusLabel}</span>
                </div>
            </button>
        `;
    }).join('');
}

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

    if (pending === 'student' && document.getElementById('student-register-overlay')) {
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
    <div id="edit-staff-modal-bg" data-edit-staff-overlay="1" class="admin-edit-staff-overlay">
        <div class="admin-edit-staff-card">
            <div class="admin-edit-staff-head">
                <div>
                    <div class="admin-edit-staff-title">Edit Staff Member</div>
                    <div class="admin-edit-staff-subtitle">${escapeHtml(member.name || member.nameEn || memberId)} / ${escapeHtml(facultyLabel)}</div>
                </div>
                <button type="button" data-edit-staff-action="close" class="admin-edit-staff-btn is-neutral"><i class="fas fa-times"></i> Close</button>
            </div>
            <div class="admin-edit-staff-form" id="edit-staff-form" data-member-id="${escapeHtml(memberId)}" data-member-type="${escapeHtml(memberType)}" data-fac="${escapeHtml(fac)}">
                <div class="admin-edit-staff-section-title"><i class="fas fa-user admin-edit-staff-section-icon"></i>Personal Information</div>
                <div class="admin-edit-staff-grid-2">
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Name (Georgian)</label><input id="es-name" value="${escapeHtml(member.name || '')}" class="admin-edit-staff-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Name (English)</label><input id="es-name-en" value="${escapeHtml(member.nameEn || '')}" class="admin-edit-staff-control"></div>
                </div>
                <div class="admin-edit-staff-grid-3 is-tight">
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Rank</label><select id="es-rank" class="admin-edit-staff-control"><option ${member.title === 'Professor' ? 'selected' : ''}>Professor</option><option ${member.title === 'Associate Professor' ? 'selected' : ''}>Associate Professor</option><option ${member.title === 'Lecturer' ? 'selected' : ''}>Lecturer</option><option ${member.title === 'Visiting Professor' ? 'selected' : ''}>Visiting Professor</option><option ${member.title === 'Teaching Assistant' ? 'selected' : ''}>Teaching Assistant</option></select></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Office</label><input id="es-office" value="${escapeHtml(member.office || '')}" class="admin-edit-staff-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Since (Year)</label><input id="es-joinyear" type="number" value="${escapeHtml(String(member.joinYear || 2024))}" class="admin-edit-staff-control"></div>
                </div>
                <div class="admin-edit-staff-grid-3 is-spacious">
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Email</label><input id="es-email" value="${escapeHtml(member.email || '')}" class="admin-edit-staff-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Phone</label><input id="es-phone" value="${escapeHtml(member.phone || '')}" class="admin-edit-staff-control"></div>
                    <div class="admin-edit-staff-field"><label class="admin-edit-staff-label">Max Teaching Hours</label><input id="es-maxhours" type="number" value="${escapeHtml(String(member.maxHours || 12))}" class="admin-edit-staff-control"></div>
                </div>
                <div class="admin-edit-staff-schedule-head">
                    <div class="admin-edit-staff-section-title"><i class="fas fa-calendar-alt admin-edit-staff-schedule-icon"></i>Teaching Schedule</div>
                    <button type="button" data-edit-staff-action="add-row" class="admin-edit-staff-btn is-compact"><i class="fas fa-plus"></i> Add Row</button>
                </div>
                <div id="edit-sched-rows" class="admin-edit-staff-rows">${rowsHtml}</div>
                <div class="admin-edit-staff-footer">
                    <button type="button" data-edit-staff-action="delete" class="admin-edit-staff-btn is-danger"><i class="fas fa-trash"></i> Remove Staff</button>
                    <div class="admin-edit-staff-actions">
                        <button type="button" data-edit-staff-action="close" class="admin-edit-staff-btn is-neutral">Cancel</button>
                        <button type="button" data-edit-staff-action="save" class="admin-edit-staff-btn is-primary"><i class="fas fa-save"></i> Save Changes</button>
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
        <div class="admin-edit-staff-row-action"><button type="button" data-edit-staff-action="remove-row" class="admin-edit-staff-row-remove"><i class="fas fa-trash-alt"></i></button></div>
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
const CUSTOM_SEMESTER_OPTION = '__custom_semester__';

function normalizeSemesterList(value) {
    const source = Array.isArray(value) ? value : [value];
    return [...new Set(source
        .map((entry) => toRegistrationPositiveInt(entry, 0))
        .filter((entry) => entry > 0))]
        .sort((left, right) => left - right);
}

function normalizeSubjectSemesters(subject) {
    if (!subject) return [];
    if (Array.isArray(subject.semesters) && subject.semesters.length) {
        return normalizeSemesterList(subject.semesters);
    }
    return normalizeSemesterList(subject.semester);
}

function subjectMatchesSemesterFilter(subject, filter) {
    if (!filter || filter === 'all') return true;
    const target = toRegistrationPositiveInt(filter, 0);
    if (!target) return true;
    return normalizeSubjectSemesters(subject).includes(target);
}

function formatSubjectSemestersLabel(semesters) {
    const list = normalizeSemesterList(semesters);
    if (!list.length) return 'No semesters';
    if (list.length === 1) return `Semester ${list[0]}`;
    return `Semesters ${list.join(', ')}`;
}

function formatCurriculumSubjectDisplayName(subject) {
    const name = String(subject?.name || '').trim();
    const code = String(subject?.id || '').trim();
    if (name && name.length > 2 && !/^\d+$/.test(name)) return name;
    if (name && /^\d+$/.test(name)) return `Course ${name}`;
    return code || name || 'Untitled Subject';
}

function formatCurriculumSubjectSubtitle(subject) {
    const name = String(subject?.name || '').trim();
    const code = String(subject?.id || '').trim();
    if (!code) return '';
    if (name && (/^\d+$/.test(name) || name.length <= 2)) return code;
    return '';
}

function getBuilderSubjectSemesters() {
    const hidden = document.getElementById('new-subject-semesters');
    if (!hidden) return [1];
    try {
        const parsed = JSON.parse(hidden.value || '[]');
        const list = normalizeSemesterList(parsed);
        return list.length ? list : [1];
    } catch (error) {
        return [1];
    }
}

function setBuilderSubjectSemesters(semesters) {
    const hidden = document.getElementById('new-subject-semesters');
    const list = normalizeSemesterList(semesters);
    const resolved = list.length ? list : [1];
    if (hidden) hidden.value = JSON.stringify(resolved);
    return resolved;
}

function getPrimarySemesterFromBuilder() {
    const semesters = getBuilderSubjectSemesters();
    return semesters[0] || 1;
}

function getSemesterParityDescriptionForSemesters(semesters) {
    const list = normalizeSemesterList(semesters);
    if (!list.length) {
        return 'Select at least one semester to see the availability rule.';
    }
    const parities = new Set(list.map((semester) => semester % 2));
    if (parities.size > 1) {
        return `Semesters ${list.join(', ')} span odd and even tracks. Use the override below if students in both tracks should see this subject.`;
    }
    return getSemesterParityDescription(list[0]);
}

function toRegistrationPositiveInt(value, fallback = 0) {
    const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function populateSemesterSelectOptions(control, config = {}) {
    const selectEl = typeof control === 'string' ? document.getElementById(control) : control;
    if (!(selectEl instanceof HTMLSelectElement)) return;

    const includeAll = config.includeAll === true;
    const includeCustom = config.includeCustom === true;
    const numberPrefix = config.numberPrefix || 'Semester';
    const previousValue = String(selectEl.value || selectEl.dataset.previousSemesterValue || (includeAll ? 'all' : '1'));
    const customValue = parseInt(selectEl.dataset.customSemesterValue || '', 10);
    const customLabel = Number.isFinite(customValue) && customValue > MAX_SEMESTER_DROPDOWN
        ? `${numberPrefix} ${customValue}`
        : null;

    const options = [];
    if (includeAll) options.push({ value: 'all', label: 'All Semesters' });
    for (let semester = 1; semester <= MAX_SEMESTER_DROPDOWN; semester += 1) {
        options.push({ value: String(semester), label: `${numberPrefix} ${semester}` });
    }
    if (customLabel) {
        options.push({ value: String(customValue), label: customLabel });
    }
    if (includeCustom) {
        options.push({ value: CUSTOM_SEMESTER_OPTION, label: 'Custom Semester...' });
    }

    selectEl.innerHTML = options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join('');
    const resolvedValue = options.some((option) => option.value === previousValue)
        ? previousValue
        : (includeAll ? 'all' : '1');
    selectEl.value = resolvedValue;
    selectEl.dataset.previousSemesterValue = resolvedValue;

    if (!selectEl.dataset.customSemesterBound && includeCustom) {
        selectEl.addEventListener('change', () => {
            if (selectEl.value !== CUSTOM_SEMESTER_OPTION) {
                selectEl.dataset.previousSemesterValue = selectEl.value;
                return;
            }

            const entered = prompt('Enter a semester number:', selectEl.dataset.customSemesterValue || String(MAX_SEMESTER_DROPDOWN + 1));
            const fallbackValue = selectEl.dataset.previousSemesterValue || (includeAll ? 'all' : '1');
            const parsed = parseInt(String(entered || '').trim(), 10);
            if (!Number.isFinite(parsed) || parsed < 1) {
                selectEl.value = fallbackValue;
                return;
            }

            if (parsed > MAX_SEMESTER_DROPDOWN) {
                selectEl.dataset.customSemesterValue = String(parsed);
            } else {
                delete selectEl.dataset.customSemesterValue;
            }

            populateSemesterSelectOptions(selectEl, config);
            selectEl.value = String(parsed);
            selectEl.dataset.previousSemesterValue = selectEl.value;
            selectEl.dispatchEvent(new Event('change'));
        });
        selectEl.dataset.customSemesterBound = '1';
    }
}

function getSemesterNumberFromControl(control, fallback = 1) {
    const selectEl = typeof control === 'string' ? document.getElementById(control) : control;
    if (!(selectEl instanceof HTMLSelectElement)) return fallback;
    const rawValue = selectEl.value === CUSTOM_SEMESTER_OPTION
        ? (selectEl.dataset.customSemesterValue || fallback)
        : (selectEl.value || fallback);
    const parsed = parseInt(String(rawValue).trim(), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getSemesterParityDescription(semesterValue) {
    const semester = parseInt(semesterValue, 10);
    if (!Number.isFinite(semester) || semester <= 0) {
        return 'Select a semester to see the availability rule.';
    }
    return semester % 2 === 1
        ? `Semester ${semester} is odd. This subject is visible in odd semesters unless the override is enabled.`
        : `Semester ${semester} is even. This subject is visible in even semesters unless the override is enabled.`;
}

function refreshSemesterDropdowns() {
    [
        { id: 'filter-curriculum-semester', includeAll: true, includeCustom: true, numberPrefix: 'Sem' },
        { id: 'admin-active-semester', includeCustom: true, numberPrefix: 'Semester' },
        { id: 'admin-tt-semester', includeCustom: true, numberPrefix: 'Sem' },
        { id: 'admin-generate-semester', includeCustom: true, numberPrefix: 'Sem' },
        { id: 'stu-reg-semester', includeCustom: true, numberPrefix: 'Semester' },
        { id: 'new-user-semester', includeCustom: true, numberPrefix: 'Semester' }
    ].forEach((cfg) => {
        document.querySelectorAll(`#${cfg.id}`).forEach((selectEl) => populateSemesterSelectOptions(selectEl, cfg));
    });
}

function ensureSubjectSemesterParityHint() {
    refreshSemesterDropdowns();
    const hint = document.getElementById('new-subject-semester-parity-hint');
    const hiddenSemesters = document.getElementById('new-subject-semesters');
    if (!hint) return;
    hint.classList.add('lux-admin-tools-parity-callout');

    let exceptionWrap = document.getElementById('new-subject-semester-parity-exception-wrap');
    if (!exceptionWrap) {
        exceptionWrap = document.createElement('div');
        exceptionWrap.id = 'new-subject-semester-parity-exception-wrap';
        exceptionWrap.className = 'registration-parity-exception lux-admin-tools-parity-exception';
        exceptionWrap.innerHTML = `
            <input id="new-subject-parity-both-checkbox" class="registration-parity-exception-checkbox" type="checkbox">
            <label for="new-subject-parity-both-checkbox" class="registration-parity-exception-label">Make this subject available in both odd and even semesters</label>
        `;
        hint.insertAdjacentElement('afterend', exceptionWrap);
    }

    const exceptionCheckbox = document.getElementById('new-subject-parity-both-checkbox');
    const updateHint = () => {
        const semesters = getBuilderSubjectSemesters();
        const extra = exceptionCheckbox instanceof HTMLInputElement && exceptionCheckbox.checked
            ? ' Override enabled: students in both parity tracks can see this subject.'
            : '';
        hint.textContent = `${getSemesterParityDescriptionForSemesters(semesters)}${extra}`;
    };

    if (hiddenSemesters && !hiddenSemesters.dataset.parityHintBound) {
        hiddenSemesters.addEventListener('change', updateHint);
        hiddenSemesters.dataset.parityHintBound = '1';
    }
    if (exceptionCheckbox instanceof HTMLInputElement && !exceptionCheckbox.dataset.parityHintBound) {
        exceptionCheckbox.addEventListener('change', updateHint);
        exceptionCheckbox.dataset.parityHintBound = '1';
    }

    updateHint();
}

function toggleConditionBox() {
    const checkbox = document.getElementById('has-condition-checkbox');
    const container = document.getElementById('condition-box-container');
    if (!(checkbox instanceof HTMLInputElement) || !container) return;
    if (checkbox.checked) {
        container.hidden = false;
        container.style.removeProperty('display');
        filterSubjects('');
    } else {
        container.hidden = true;
        clearConditionSelection();
    }
}

function getSelectedConditionEntries() {
    const badge = document.getElementById('selected-condition-badge');
    if (!badge) return [];
    try {
        const parsed = JSON.parse(badge.dataset.conditions || '[]');
        return Array.isArray(parsed) ? parsed.filter((entry) => entry && entry.code) : [];
    } catch (_) {
        return [];
    }
}

function renderSelectedConditionEntries(entries) {
    const badge = document.getElementById('selected-condition-badge');
    const text = document.getElementById('selected-condition-text');
    const input = document.getElementById('subject-search-input');
    if (!badge || !text) return;

    const normalized = [...new Map((entries || [])
        .map((entry) => [String(entry.code || '').trim(), { code: String(entry.code || '').trim(), name: String(entry.name || entry.code || '').trim() }]))
        .values()]
        .filter((entry) => entry.code);

    badge.classList.add('registration-condition-badge');
    badge.dataset.conditions = JSON.stringify(normalized);
    badge.dataset.value = normalized.length > 0
        ? normalized.map((entry) => `[REQ] ${entry.code}`).join(', ')
        : 'None';
    badge.hidden = normalized.length === 0;
    text.innerHTML = normalized.map((entry) => `
        <span class="registration-condition-chip">
            <span>[${escapeHtml(entry.code)}] ${escapeHtml(entry.name)}</span>
            <button type="button" class="registration-condition-chip-remove" data-condition-action="remove" data-subject-code="${escapeHtml(entry.code)}">&times;</button>
        </span>
    `).join('');
    if (input) input.hidden = false;
}

function addConditionSelection(code, name) {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode) return;
    const entries = getSelectedConditionEntries();
    if (!entries.some((entry) => entry.code === normalizedCode)) {
        entries.push({ code: normalizedCode, name: String(name || normalizedCode).trim() || normalizedCode });
    }
    renderSelectedConditionEntries(entries);
}

function removeConditionSelection(code) {
    const normalizedCode = String(code || '').trim();
    renderSelectedConditionEntries(getSelectedConditionEntries().filter((entry) => entry.code !== normalizedCode));
}

function clearConditionSelection() {
    renderSelectedConditionEntries([]);
    const input = document.getElementById('subject-search-input');
    if (input) input.value = '';
    const list = document.getElementById('subject-search-results');
    if (list) list.hidden = true;
}

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
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (_) {
        return [];
    }
}

function setSelectedAntiReqCodes(codes) {
    const picker = document.getElementById('new-subject-antireq-picker');
    if (!picker) return;
    const normalized = [...new Set((codes || []).map((code) => String(code || '').trim()).filter(Boolean))];
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

    picker.className = 'lux-admin-tools-antireq-picker';
    picker.innerHTML = `
        <div class="lux-admin-tools-antireq-head">
            <span class="lux-admin-tools-antireq-head-title"><i class="fas fa-ban" aria-hidden="true"></i> Anti-requisites</span>
            <span class="lux-admin-tools-antireq-head-meta">Block enrollment when another course is taken</span>
        </div>
        <div data-role="selected-anti-row" class="registration-antireq-selected-row lux-admin-tools-antireq-selected">
            ${selectedValues.length > 0
                ? selectedValues.map((code) => `
                    <span class="registration-antireq-chip">
                        <span>${escapeHtml(code)}</span>
                        <button type="button" class="registration-antireq-chip-remove" data-antireq-action="toggle" data-anti-code="${escapeHtml(code)}">&times;</button>
                    </span>
                `).join('')
                : '<span class="registration-antireq-empty">No anti-requisites selected</span>'}
        </div>
        <div class="registration-antireq-toolbar">
            <button type="button" data-antireq-action="clear" class="lux-secondary-btn registration-antireq-clear-btn">Clear All</button>
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

function getCurriculumLibraryModules(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    if (!KIU_STATE.curriculumLibraryModulesByFaculty || typeof KIU_STATE.curriculumLibraryModulesByFaculty !== 'object') {
        KIU_STATE.curriculumLibraryModulesByFaculty = {};
    }
    if (!Array.isArray(KIU_STATE.curriculumLibraryModulesByFaculty[normalizedFaculty])) {
        KIU_STATE.curriculumLibraryModulesByFaculty[normalizedFaculty] = [];
    }
    return KIU_STATE.curriculumLibraryModulesByFaculty[normalizedFaculty];
}

function buildDefaultCurriculumModule(faculty, subjectIds = []) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    return {
        id: `CLM-${normalizedFaculty}-GENERAL`,
        letter: 'A',
        name: 'General Curriculum',
        maxEcts: subjectIds.reduce((sum, subjectId) => {
            const subject = (typeof getActiveCurriculum === 'function' ? getActiveCurriculum(normalizedFaculty) : []).find((item) => item.id === subjectId);
            return sum + (toRegistrationPositiveInt(subject?.ects, 0) || 0);
        }, 0),
        subjectIds: [...new Set(subjectIds)],
        systemDefault: true
    };
}

function ensureCurriculumLibraryModules(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    const modules = getCurriculumLibraryModules(normalizedFaculty);
    const subjects = typeof getActiveCurriculum === 'function' ? getActiveCurriculum(normalizedFaculty) : [];
    const validSubjectIds = new Set(subjects.map((subject) => subject.id));

    modules.forEach((module, index) => {
        module.id = module.id || `CLM-${normalizedFaculty}-${Date.now()}-${index}`;
        module.letter = String.fromCharCode(65 + (index % 26));
        module.name = module.name || `Module ${index + 1}`;
        module.maxEcts = toRegistrationPositiveInt(module.maxEcts, 0);
        module.subjectIds = [...new Set((module.subjectIds || []).filter((subjectId) => validSubjectIds.has(subjectId)))];
    });

    if (modules.length === 0 && subjects.length > 0) {
        modules.push(buildDefaultCurriculumModule(normalizedFaculty, subjects.map((subject) => subject.id)));
    }

    const assigned = new Set(modules.flatMap((module) => module.subjectIds || []));
    const missing = subjects.map((subject) => subject.id).filter((subjectId) => !assigned.has(subjectId));
    if (missing.length > 0) {
        const fallback = modules.find((module) => module.systemDefault) || buildDefaultCurriculumModule(normalizedFaculty, []);
        if (!modules.includes(fallback)) modules.unshift(fallback);
        fallback.subjectIds = [...new Set([...(fallback.subjectIds || []), ...missing])];
        fallback.maxEcts = Math.max(toRegistrationPositiveInt(fallback.maxEcts, 0), getCurriculumModuleEctsTotal(fallback, normalizedFaculty));
    }

    return modules;
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

function getCurriculumLibraryModuleSubjects(module, faculty = getCurrentFaculty(), semesterFilter = 'all') {
    if (!module) return [];
    const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
    const subjectsById = new Map((typeof getActiveCurriculum === 'function' ? getActiveCurriculum(normalizedFaculty) : []).map((subject) => [subject.id, subject]));
    return (module.subjectIds || [])
        .map((subjectId) => subjectsById.get(subjectId))
        .filter(Boolean)
        .filter((subject) => subjectMatchesSemesterFilter(subject, semesterFilter))
        .sort((left, right) => {
            const leftSemesters = normalizeSubjectSemesters(left);
            const rightSemesters = normalizeSubjectSemesters(right);
            const semesterDiff = (leftSemesters[0] || 99) - (rightSemesters[0] || 99);
            if (semesterDiff !== 0) return semesterDiff;
            return String(left.name || '').localeCompare(String(right.name || ''));
        });
}

function getCurriculumModuleEctsTotal(module, faculty = getCurrentFaculty()) {
    return getCurriculumLibraryModuleSubjects(module, faculty, 'all')
        .reduce((sum, subject) => sum + toRegistrationPositiveInt(subject?.ects, 0), 0);
}

function syncCurriculumSubjectBuilderTarget(faculty = getCurrentFaculty()) {
    const badge = document.getElementById('curriculum-form-module-target');
    const help = document.getElementById('curriculum-form-module-help');
    const saveBtn = document.getElementById('save-curriculum-subject-btn');
    const selectedModule = getSelectedCurriculumLibraryModule(faculty);

    if (badge) {
        badge.innerHTML = selectedModule
            ? `<i class="fas fa-layer-group"></i><span>Target Module: ${escapeHtml(selectedModule.name)}</span>`
            : '<i class="fas fa-layer-group"></i><span>Target Module: No module selected</span>';
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

function focusCurriculumSubjectBuilder() {
    const builder = document.getElementById('curriculum-subject-builder-card');
    if (builder) {
        builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    document.getElementById('new-subject-name')?.focus();
}

function renderCurriculumLibraryModuleRows(module, subjects, faculty, semesterFilter) {
    if (!module || !subjects.length) {
        const emptyText = semesterFilter === 'all'
            ? 'No subjects are assigned to this module yet.'
            : 'No subjects in this module match the selected semester filter.';
        return `<div class="lux-empty-block">${escapeHtml(emptyText)}</div>`;
    }

    return subjects.map((subject, index) => {
        const prerequisite = subject.cond && subject.cond !== 'None' ? subject.cond : 'None';
        const antiReq = subject.antireq && subject.antireq !== 'None' ? subject.antireq : '';
        const semesters = normalizeSubjectSemesters(subject);
        const facultyLabel = typeof getFacultyLabel === 'function'
            ? getFacultyLabel(subject.faculty || faculty)
            : String(subject.faculty || faculty || '');
        const semesterChips = semesters.length
            ? semesters.map((semester) => `<span class="lux-status-pill lux-curriculum-subject-card__semester">S${escapeHtml(String(semester))}</span>`).join('')
            : '<span class="lux-status-pill lux-curriculum-subject-card__semester is-muted">No semester</span>';
        const subtitle = formatCurriculumSubjectSubtitle(subject);
        return `
            <article class="lux-curriculum-subject-card ${prerequisite !== 'None' ? 'has-prerequisite' : 'is-open'}">
                <header class="lux-curriculum-subject-card__head">
                    <div class="lux-curriculum-subject-card__code-wrap">
                        <span class="lux-curriculum-subject-card__code">${escapeHtml(subject.id)}</span>
                        <span class="lux-curriculum-subject-card__index">#${index + 1}</span>
                    </div>
                    <button type="button" class="lux-secondary-btn curriculum-library-subject-delete-btn lux-curriculum-subject-card__delete" data-curriculum-delete-subject="${escapeHtml(subject.id)}" aria-label="Delete ${escapeHtml(subject.id)}"><i class="fas fa-trash"></i></button>
                </header>
                <div class="lux-curriculum-subject-card__body">
                    <h3 class="lux-curriculum-subject-card__title">${escapeHtml(formatCurriculumSubjectDisplayName(subject))}</h3>
                    ${subtitle ? `<p class="lux-curriculum-subject-card__subtitle">${escapeHtml(subtitle)}</p>` : ''}
                    <p class="lux-curriculum-subject-card__faculty">${escapeHtml(facultyLabel)}</p>
                    <div class="lux-curriculum-subject-card__chips">
                        ${semesterChips}
                        <span class="lux-status-pill lux-curriculum-subject-card__ects">${escapeHtml(String(subject.ects || 0))} ECTS</span>
                    </div>
                </div>
                <footer class="lux-curriculum-subject-card__footer">
                    <div class="lux-curriculum-subject-card__detail"><strong>Prerequisite:</strong> ${escapeHtml(prerequisite)}</div>
                    ${antiReq ? `<div class="lux-curriculum-subject-card__detail is-soft"><strong>Anti-requisite:</strong> ${escapeHtml(antiReq)}</div>` : ''}
                </footer>
            </article>
        `;
    }).join('');
}

function renderCurriculumTable() {
    const root = document.getElementById('curriculum-library-modules-root');
    const tbody = document.getElementById('curriculum-table-body');
    if (!root && !tbody) return;

    const faculty = getCurrentFaculty();
    const semesterFilter = document.getElementById('filter-curriculum-semester')?.value || 'all';
    if (typeof syncCurriculumFacultyBadge === 'function') syncCurriculumFacultyBadge(faculty);
    ensureSubjectSemesterParityHint();

    const modules = ensureCurriculumLibraryModules(faculty);
    const selectedModule = getSelectedCurriculumLibraryModule(faculty);
    syncCurriculumSubjectBuilderTarget(faculty);

    if (root) {
        root.innerHTML = `
            <div class="curriculum-library-layout">
                <div class="lux-surface curriculum-library-panel">
                    <div class="curriculum-library-head">
                        <div>
                            <div class="lux-card-title">Curriculum Modules</div>
                            <div class="lux-card-meta">${modules.length} module${modules.length === 1 ? '' : 's'} in ${escapeHtml(typeof getFacultyLabel === 'function' ? getFacultyLabel(faculty) : faculty)}</div>
                        </div>
                        <button type="button" class="lux-ghost-btn curriculum-library-btn" data-curriculum-add-module="1"><i class="fas fa-layer-group"></i> Add Module</button>
                    </div>
                    <div class="lux-scrollbar curriculum-library-list" data-preserve-scroll-key="curriculum-library-modules">
                        ${modules.length === 0 ? '<div class="lux-empty-block">No modules are available yet.</div>' : modules.map((module) => {
                            const active = selectedModule && module.id === selectedModule.id;
                            const subjectCount = getCurriculumLibraryModuleSubjects(module, faculty, 'all').length;
                            return `
                                <label class="curriculum-library-module-option${active ? ' is-active' : ''}">
                                    <span class="curriculum-library-module-option-head">
                                        <input class="curriculum-library-module-option-radio" type="radio" name="curriculum-library-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} data-curriculum-module-select="${escapeHtml(module.id)}">
                                        <span class="curriculum-library-module-option-title">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled Module'}`.trim())}</span>
                                    </span>
                                    <span class="curriculum-library-module-option-meta">${subjectCount} subjects / ${getCurriculumModuleEctsTotal(module, faculty)} ECTS</span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
                <div class="lux-surface curriculum-library-panel curriculum-library-panel--detail">
                    ${selectedModule ? `
                        <div class="curriculum-library-detail-head">
                            <div class="curriculum-library-detail-summary">
                                <div class="curriculum-library-detail-title">${escapeHtml(selectedModule.name)}</div>
                                <div class="curriculum-library-detail-meta">${getCurriculumLibraryModuleSubjects(selectedModule, faculty, 'all').length} subjects / ${getCurriculumModuleEctsTotal(selectedModule, faculty)} ECTS</div>
                            </div>
                            <div class="curriculum-library-detail-actions">
                                <button type="button" class="lux-ghost-btn curriculum-library-btn curriculum-library-btn--compact" data-curriculum-add-module="1"><i class="fas fa-layer-group"></i> Add Module</button>
                                <button type="button" class="lux-ghost-btn curriculum-library-btn curriculum-library-btn--compact" data-curriculum-edit-module="${escapeHtml(selectedModule.id)}"><i class="fas fa-edit"></i> Edit</button>
                                <button type="button" class="lux-ghost-btn curriculum-library-btn curriculum-library-btn--compact curriculum-library-btn--danger" data-curriculum-delete-module="${escapeHtml(selectedModule.id)}"><i class="fas fa-trash"></i></button>
                                <button type="button" class="lux-primary-btn curriculum-library-btn curriculum-library-btn--primary" data-curriculum-focus-builder="1"><i class="fas fa-plus"></i> Add Subject</button>
                            </div>
                        </div>
                        <div class="lux-scroll-rail curriculum-library-row-scroll" data-lux-scroll-rail data-curriculum-subject-scroll>
                            <div class="lux-scroll-rail__controls curriculum-library-scroll-controls" aria-hidden="true">
                                <div class="lux-scroll-rail__dock" role="group" aria-label="Scroll subjects">
                                    <button type="button" class="lux-scroll-rail__btn curriculum-library-scroll-btn" data-lux-scroll="up" data-curriculum-scroll="up" aria-label="Scroll subjects up"><i class="fas fa-chevron-up" aria-hidden="true"></i></button>
                                    <span class="lux-scroll-rail__spine" aria-hidden="true"></span>
                                    <button type="button" class="lux-scroll-rail__btn curriculum-library-scroll-btn" data-lux-scroll="down" data-curriculum-scroll="down" aria-label="Scroll subjects down"><i class="fas fa-chevron-down" aria-hidden="true"></i></button>
                                </div>
                            </div>
                            <div class="lux-scrollbar lux-scroll-rail__viewport curriculum-library-row-list" id="curriculum-subject-row-list" aria-label="Module subjects">
                                ${renderCurriculumLibraryModuleRows(selectedModule, getCurriculumLibraryModuleSubjects(selectedModule, faculty, semesterFilter), faculty, semesterFilter)}
                            </div>
                        </div>
                    ` : `
                        <div class="lux-empty-state curriculum-library-empty-state">
                            <i class="fas fa-arrow-left"></i>
                            <strong>Select or create a module</strong>
                            <span>Choose a module from the list or create one now to start organizing subjects.</span>
                            <button type="button" class="lux-primary-btn curriculum-library-empty-state-action" data-curriculum-add-module="1"><i class="fas fa-plus"></i> Create Module</button>
                        </div>
                    `}
                </div>
            </div>
        `;
        populateAntiReqDropdown();
        if (typeof initCurriculumLibraryRowScroll === 'function') initCurriculumLibraryRowScroll(root);
        if (typeof initCurriculumSemesterPicker === 'function') {
            initCurriculumSemesterPicker({
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
                    <td><button type="button" data-curriculum-delete-subject="${escapeHtml(subject.id)}" class="lux-secondary-btn curriculum-library-table-delete-btn"><i class="fas fa-trash"></i></button></td>
                </tr>
            `).join('');
    }
}

function addCurriculumLibraryModule() {
    const faculty = getCurrentFaculty();
    const name = String(prompt('Module name:', '') || '').trim();
    if (!name) return;
    const maxEcts = toRegistrationPositiveInt(prompt('Maximum ECTS:', '30'), 30);
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
    renderCurriculumTable();
}

function editCurriculumLibraryModule(moduleId) {
    const faculty = getCurrentFaculty();
    const module = ensureCurriculumLibraryModules(faculty).find((item) => item.id === moduleId);
    if (!module) return;
    const nextName = String(prompt('Module name:', module.name || '') || '').trim();
    if (!nextName) return;
    const nextMaxEcts = toRegistrationPositiveInt(prompt('Maximum ECTS:', String(module.maxEcts || 0)), toRegistrationPositiveInt(module.maxEcts, 0));
    module.name = nextName;
    module.maxEcts = nextMaxEcts;
    saveState();
    renderCurriculumTable();
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

function deleteCurriculumLibraryModule(moduleId) {
    const faculty = getCurrentFaculty();
    const modules = ensureCurriculumLibraryModules(faculty);
    const module = modules.find((item) => item.id === moduleId);
    if (!module) return;
    if (!confirm(`Remove module \"${module.name}\"? Its subjects will remain in the faculty curriculum.`)) return;

    let fallback = modules.find((item) => item.id !== moduleId && item.systemDefault) || modules.find((item) => item.id !== moduleId) || null;
    if (!fallback && (module.subjectIds || []).length > 0) {
        fallback = buildDefaultCurriculumModule(faculty, []);
        modules.push(fallback);
    }
    if (fallback) {
        fallback.subjectIds = [...new Set([...(fallback.subjectIds || []), ...(module.subjectIds || [])])];
        fallback.maxEcts = Math.max(toRegistrationPositiveInt(fallback.maxEcts, 0), getCurriculumModuleEctsTotal(fallback, faculty));
    }

    KIU_STATE.curriculumLibraryModulesByFaculty[normalizeFacultyCode(faculty, getCurrentFaculty())] = modules.filter((item) => item.id !== moduleId);
    setCurriculumLibraryModuleSelection(fallback?.id || null, faculty);
    saveState();
    renderCurriculumTable();
}

function deleteSubjectById(subjectId) {
    if (!confirm('Remove this subject from the curriculum?')) return;
    Object.keys(KIU_STATE.facultyProfiles || {}).forEach((facultyCode) => {
        const profile = KIU_STATE.facultyProfiles[facultyCode];
        if (Array.isArray(profile?.curriculum)) {
            profile.curriculum = profile.curriculum.filter((subject) => subject.id !== subjectId);
        }
    });
    Object.keys(KIU_STATE.curriculumLibraryModulesByFaculty || {}).forEach((facultyCode) => {
        (KIU_STATE.curriculumLibraryModulesByFaculty[facultyCode] || []).forEach((module) => {
            module.subjectIds = (module.subjectIds || []).filter((entry) => entry !== subjectId);
        });
    });
    if (typeof syncCanonicalCurriculumState === 'function') {
        syncCanonicalCurriculumState();
    }
    saveState();
    renderCurriculumTable();
    populateAntiReqDropdown();
}

function addSubjectToSystem() {
    const name = String(document.getElementById('new-subject-name')?.value || '').trim();
    const ects = toRegistrationPositiveInt(document.getElementById('new-subject-ects')?.value, 6) || 6;
    const faculty = getCurrentFaculty();
    const semesters = getBuilderSubjectSemesters();
    if (!semesters.length) {
        alert('Please select at least one semester for this subject.');
        return;
    }
    const semester = semesters[0];
    const selectedModule = getSelectedCurriculumLibraryModule(faculty);
    const usePrerequisite = document.getElementById('has-condition-checkbox')?.checked === true;
    const prerequisiteEntries = getSelectedConditionEntries();
    const antiReqEntries = getSelectedAntiReqCodes();
    const customCode = String(document.getElementById('new-subject-code-preview')?.value || '').trim().toUpperCase().replace(/\\s+/g, '-');
    const allowBothParity = document.getElementById('new-subject-parity-both-checkbox')?.checked === true;

    if (!name) {
        alert('Please enter a subject name.');
        return;
    }
    if (!selectedModule) {
        alert('Please create or select a curriculum module first.');
        syncCurriculumSubjectBuilderTarget(faculty);
        return;
    }
    if (usePrerequisite && prerequisiteEntries.length === 0) {
        alert('Please select at least one prerequisite or turn off the prerequisite toggle.');
        return;
    }

    if (!KIU_STATE.facultyProfiles) {
        KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE.facultyProfiles));
    }
    if (!KIU_STATE.facultyProfiles[faculty]) {
        KIU_STATE.facultyProfiles[faculty] = { curriculum: [], professors: [], tas: [], students: [] };
    }
    if (!Array.isArray(KIU_STATE.facultyProfiles[faculty].curriculum)) {
        KIU_STATE.facultyProfiles[faculty].curriculum = [];
    }

    const existing = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : [];
    const generatedId = customCode || `${normalizeFacultyCode(faculty, 'ECON')}-${String(semester).padStart(2, '0')}-${String(existing.length + 1).padStart(3, '0')}`;
    if (existing.some((subject) => typeof canonicalCourseKey === 'function' ? canonicalCourseKey(subject.id) === canonicalCourseKey(generatedId) : subject.id === generatedId)) {
        alert(`Subject code \"${generatedId}\" already exists.`);
        return;
    }

    const newSubject = {
        id: generatedId,
        name,
        ects,
        faculty,
        semester,
        semesters,
        icon: 'fas fa-book',
        code: generatedId.toLowerCase(),
        cond: usePrerequisite ? prerequisiteEntries.map((entry) => `[REQ] ${entry.code}`).join(', ') : 'None',
        antireq: antiReqEntries.length > 0 ? antiReqEntries.map((entry) => `[ANTI] ${entry}`).join(', ') : 'None',
        parityMode: allowBothParity ? 'both' : 'auto'
    };

    KIU_STATE.facultyProfiles[faculty].curriculum.push(newSubject);
    if (typeof syncCanonicalCurriculumState === 'function') {
        syncCanonicalCurriculumState();
    }
    attachSubjectToCurriculumLibraryModule(generatedId, faculty);
    saveState();
    renderCurriculumTable();
    populateAntiReqDropdown();
    if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();

    document.getElementById('new-subject-name').value = '';
    const codePreview = document.getElementById('new-subject-code-preview');
    if (codePreview) codePreview.value = '';
    const conditionCheckbox = document.getElementById('has-condition-checkbox');
    if (conditionCheckbox instanceof HTMLInputElement) {
        conditionCheckbox.checked = false;
    }
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
    focusCurriculumSubjectBuilder();
}

window.normalizeSubjectSemesters = normalizeSubjectSemesters;
window.subjectMatchesSemesterFilter = subjectMatchesSemesterFilter;
window.formatSubjectSemestersLabel = formatSubjectSemestersLabel;
window.getBuilderSubjectSemesters = getBuilderSubjectSemesters;
window.setBuilderSubjectSemesters = setBuilderSubjectSemesters;
window.getSemesterParityDescriptionForSemesters = getSemesterParityDescriptionForSemesters;
window.MAX_SEMESTER_DROPDOWN = MAX_SEMESTER_DROPDOWN;

// Ensure registration state is correctly drawn when the app starts
window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('page-registration')) return;
    // FIX: Removed forced dark mode override - respect user's saved theme preference.
    // FIX: Removed 500ms setTimeout - render immediately, then apply transparency.
    initializeRegistrationShellInteractions();
    refreshSemesterDropdowns();
    refreshRegistrationUI();

    // CRITICAL: Re-apply transparency AFTER registration cards are rendered.
    if (typeof updateTransparency === 'function') {
        var _t = localStorage.getItem('kiuLuxurySurfaceTransparency');
        if (_t) updateTransparency(parseInt(_t, 10));
    }
});


