/* READABILITY: Students command center — roster, academic actions, mobility, staff tools. Sections: Boot | Roster | Academic | Mobility | Render. */
// --- READABILITY: Boot ---
(function initStudentsCommandCenter() {
    'use strict';

    window.__KIU_COMMAND_CENTER_HUB__ = 'students-hub';
    window.__KIU_COMMAND_CENTER_ENTITY__ = 'Student';
    window.__KIU_COMMAND_CENTER_TOAST_ID__ = 'students-admin-toast';
    window.__KIU_COMMAND_CENTER_TOAST_TIMER_KEY__ = '__studentsCommandToastTimer';
    window.__KIU_COMMAND_CENTER_MODAL_ROOT__ = 'students-admin-modal-root';
    window.__KIU_COMMAND_CENTER_FIELD_NS__ = 'student';
    const FLOW_KEY = 'KIU_PENDING_ADMIN_ACCOUNT_FLOW';
    const STORE_KEY = 'studentAdminProfiles';
    function cloneDefaultFilters() {
        const base = typeof STUDENT_DIRECTORY_DEFAULT_FILTERS !== 'undefined'
            ? STUDENT_DIRECTORY_DEFAULT_FILTERS
            : {
                query: '',
                droplistQuery: '',
// --- READABILITY: Mobility ---
                mobility: 'all',
                program: 'all',
                field: {},
                profile: 'all',
                archive: 'active',
                sort: 'name'
            };
        return { ...base, field: { ...(base.field || {}) } };
    }
    const VIEW_ROLES = ['admin', 'faculty', 'viewer'];
    const STUDENT_TYPE_ID = 'student';

    function getStudentsState() {
        if (!window.__studentsCommandState) {
            window.__studentsCommandState = {
                selectedId: null,
                profileTab: null,
                editingId: null,
                modalRole: 'student',
                modalStudentTypeId: 'student',
                modalOpen: false,
                modalTouched: false,
// --- READABILITY: Academic ---
                academicSubjectsModal: null,
                academicSubjectsFilters: { query: '', sort: 'name' },
                workspace: 'directory',
                formSettingsTypeId: 'student',
                builderPanel: null,
                builderDirty: false,
                builderLastSavedAt: null,
                blueprintSeenAt: null,
                activeSectionId: null,
                sectionNameFocusId: null,
                fieldAdvancedOpenId: null,
                fieldRemovePendingId: null,
                lockedFieldKeys: {},
                copySourceTypeId: 'student',
                copySections: true,
                viewRole: 'admin',
                filters: cloneDefaultFilters()
            };
        }
        if (window.__studentsCommandState.workspace == null) window.__studentsCommandState.workspace = 'directory';
        if (window.__studentsCommandState.formSettingsTypeId == null) window.__studentsCommandState.formSettingsTypeId = 'student';
        if (window.__studentsCommandState.modalStudentTypeId == null) window.__studentsCommandState.modalStudentTypeId = 'student';
        if (window.__studentsCommandState.academicSubjectsModal === undefined) {
            window.__studentsCommandState.academicSubjectsModal = null;
        }
        if (!window.__studentsCommandState.academicSubjectsFilters
            || typeof window.__studentsCommandState.academicSubjectsFilters !== 'object') {
            window.__studentsCommandState.academicSubjectsFilters = { query: '', sort: 'name' };
        }
        return window.__studentsCommandState;
    }

    function cloneAcademicSubjectsFilters(filters = {}) {
        const sort = ['name', 'ects', 'grade'].includes(filters.sort) ? filters.sort : 'name';
        return {
            query: String(filters.query || ''),
            sort
        };
    }

    function resetAcademicSubjectsFilters() {
        const state = getStudentsState();
        state.academicSubjectsFilters = { query: '', sort: 'name' };
    }

    function refreshAcademicSubjectsModal(options = {}) {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const { records } = buildStudentRecords(facultyCode);
// --- READABILITY: Render ---
        renderAcademicSubjectsModal(records, {
            restoreSearchFocus: Boolean(options.restoreSearchFocus),
            selectionStart: options.selectionStart,
            selectionEnd: options.selectionEnd
        });
    }

    function ensureStore() {
        return KiuCommandCenterUtils.ensureCommandCenterStore(STORE_KEY);
    }

    function roleTitleOptions(platformRole) {
        return KiuCommandCenterUtils.roleTitleOptions(platformRole);
    }

    function buildHoursAndSectionStats(facultyCode) {
        return KiuCommandCenterUtils.buildHoursAndSectionStats(facultyCode);
    }

    function getRecordStoreEntry(id) {
        const store = ensureStore();
        return store[id] || null;
    }

    function ensureRecordEntry(id, facultyCode = null) {
        const store = ensureStore();
        if (store[id]) return store[id];
        const effectiveFaculty = facultyCode || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
        const record = buildStudentRecords(effectiveFaculty).records.find((item) => item.id === id);
        if (!record) return null;
        store[id] = {
            id: record.id,
            staffId: record.staffId,
            name: record.name,
            nameEn: record.nameEn,
            email: record.email,
            phone: record.phone,
            photo: record.photo,
            status: record.status,
            role: record.role,
            title: record.title,
            rank: record.rank,
            department: record.department,
            faculty: record.faculty,
            facultyCode: record.facultyCode,
            employmentType: record.employmentType,
            campus: record.campus,
            office: record.office,
            visibility: record.visibility,
            bio: record.bio,
            expertise: record.expertise,
            languages: record.languages,
            links: record.links,
            courses: record.courses,
            scheduleSessions: record.scheduleSessions,
            officeHours: record.officeHours,
            accountStatus: record.accountStatus,
            lmsRole: record.lmsRole,
            lastLogin: record.lastLogin,
            updatedAt: record.updatedAt,
            createdBy: record.createdBy,
            documents: record.documents,
            notes: record.notes,
            maxHours: record.maxHours,
            joinYear: record.joinYear,
            subjects: record.subjects,
            staffTypeId: record.staffTypeId,
            fieldValues: record.fieldValues || {},
            curriculumPlan: record.curriculumPlan || {
                mode: 'standard',
                sourceFaculty: record.facultyCode,
                targetFaculty: record.facultyCode,
                subjectIds: [],
                completedSubjectIds: [],
                effectiveFrom: '',
                notes: ''
            },
            mobility: record.mobility || {
                category: record.mobilityCategory || 'standard',
                agreementMetadata: {},
                effectiveFrom: '',
                effectiveTo: '',
                history: []
            }
        };
        return store[id];
    }

    function getAccountStatus(user, stored) {
        return KiuCommandCenterUtils.getAccountStatus(user, stored);
    }

    function resolveStaffRegistrationEmail(values = {}, editing = null) {
        return KiuCommandCenterUtils.resolveStaffRegistrationEmail(values, editing);
    }

    function getStudentRoleLabel() {
        return 'Student';
    }

    function getVisibilityDefault(platformRole) {
        return KiuCommandCenterUtils.getVisibilityDefault(platformRole);
    }

    function getStudentDirectorySignalsSafe(student) {
        return typeof getStudentDirectorySignals === 'function'
            ? getStudentDirectorySignals(student)
            : { holdLabel: 'Clear', holdTone: 'success', balance: 0, probation: false, suspended: false, risk: false, holdLabels: [] };
    }

    function buildStudentRecords(facultyCode) {
        ensureStore();
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : (facultyCode || 'ECON');
        const students = typeof getAllStudents === 'function'
            ? getAllStudents(normalizedFaculty)
            : [];
        const profile = KIU_STATE.facultyProfiles?.[normalizedFaculty] || { students: [] };
        const records = students.map((base) => {
            const id = String(base.id || '');
            const stored = getRecordStoreEntry(id) || {};
            const user = (KIU_STATE.users || []).find((item) => String(item?.id || '') === id) || null;
            const name = normalizeText(stored.name || base.name || base.nameEn, 'Unknown student');
            const program = normalizeText(stored.program || base.program || base.course || '', '');
            const semester = normalizeText(stored.semester || base.semester || '', '');
            const cohort = normalizeText(stored.cohort || base.cohort || base.joinYear || '', '');
            const mobility = stored.mobility && typeof stored.mobility === 'object'
                ? {
                    ...stored.mobility,
                    history: Array.isArray(stored.mobility.history) ? stored.mobility.history : []
                }
                : {
                    category: stored.mobilityCategory || base.mobilityCategory || 'standard',
                    agreementMetadata: stored.agreementMetadata || {},
                    effectiveFrom: stored.effectiveFrom || '',
                    effectiveTo: stored.effectiveTo || '',
                    history: []
                };
            const curriculumPlan = stored.curriculumPlan && typeof stored.curriculumPlan === 'object'
                ? stored.curriculumPlan
                : {
                    mode: 'standard',
                    sourceFaculty: normalizedFaculty,
                    targetFaculty: normalizedFaculty,
                    subjectIds: [],
                    completedSubjectIds: [],
                    effectiveFrom: '',
                    notes: ''
                };
            const signals = getStudentDirectorySignalsSafe({ ...base, ...stored, id, name, program, semester });
            return {
                id,
                studentTypeId: STUDENT_TYPE_ID,
                staffTypeId: STUDENT_TYPE_ID,
                studentId: normalizeText(stored.studentId || base.studentId || base.id || id, id),
                staffId: normalizeText(stored.studentId || base.studentId || base.id || id, id),
                name,
                nameEn: normalizeText(stored.nameEn || base.nameEn || base.name || '', ''),
                email: normalizeText(stored.email || base.email || user?.email || '', ''),
                phone: normalizeText(stored.phone || base.phone || '', ''),
                photo: scrubFakeMedia?.(stored.photo || base.photo || base.image) || '',
                status: normalizeText(stored.status || base.status || 'Active', 'Active'),
                program,
                semester,
                cohort,
                department: normalizeText(stored.department || departmentForFaculty(normalizedFaculty), departmentForFaculty(normalizedFaculty)),
                faculty: normalizeText(stored.faculty || humanizeFacultyName(normalizedFaculty), humanizeFacultyName(normalizedFaculty)),
                facultyCode: normalizedFaculty,
                gpa: Number(stored.gpa || base.gpa || 0),
                mobility,
                mobilityCategory: mobility.category,
                curriculumPlan,
                mobilityLabel: (window.MOBILITY_CATEGORIES || []).find((item) => item.value === mobility.category)?.label || 'Standard enrollment',
                accountStatus: getAccountStatus(user || base, stored),
                lmsRole: 'Student',
                lastLogin: normalizeText(stored.lastLogin || user?.lastLogin || base.lastLogin || '', ''),
                updatedAt: normalizeText(stored.updatedAt || base.updatedAt || todayIso(), todayIso()),
                createdBy: normalizeText(stored.createdBy || base.createdBy || 'Admin', 'Admin'),
                documents: Array.isArray(stored.documents) ? stored.documents : [],
                notes: normalizeText(stored.notes || '', ''),
                fieldValues: stored.fieldValues && typeof stored.fieldValues === 'object' ? stored.fieldValues : {},
                signals,
                profile: profile
            };
        });
        return { records, facultyProfile: profile };
    }

    function isStudentEnrollmentActive(record) {
        return String(record?.status || '').toLowerCase() !== 'archived';
    }

    function studentProfileCompleteness(record) {
        const typeId = STUDENT_TYPE_ID;
        if (typeof getAllStudentFormFields === 'function' && typeof computeStudentFormCompleteness === 'function') {
            const fields = getAllStudentFormFields(typeId);
            if (fields.length) {
                const values = record?.fieldValues && typeof record.fieldValues === 'object'
                    ? record.fieldValues
                    : (typeof hydrateFieldValuesFromRecord === 'function' ? hydrateFieldValuesFromRecord(record, typeId) : {});
                return computeStudentFormCompleteness(typeId, values);
            }
        }
        const academicSnapshot = typeof loadStudentAcademicSnapshot === 'function'
            ? loadStudentAcademicSnapshot(record)
            : null;
        const checks = [
            { key: 'basic', label: 'basic information', ok: Boolean(record.name && record.email && record.studentId), weight: 20 },
            { key: 'program', label: 'program details', ok: Boolean(record.program && record.semester), weight: 20 },
            { key: 'contact', label: 'contact information', ok: Boolean(record.email && record.phone), weight: 15 },
            { key: 'academic', label: 'subject enrollments', ok: Boolean(academicSnapshot?.subjectCount), weight: 15 },
            { key: 'mobility', label: 'mobility category', ok: Boolean(record.mobility?.category), weight: 15 },
            { key: 'status', label: 'enrollment status', ok: Boolean(record.status), weight: 15 }
        ];
        const earned = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
        const missing = checks.filter((item) => !item.ok).map((item) => item.label);
        return { percent: earned, missing, checks };
    }

    function getStaffDirectoryModel(records) {
        return typeof buildStudentDirectoryFilterModel === 'function'
            ? buildStudentDirectoryFilterModel(records)
            : { blueprintFilters: [], staffTypes: [] };
    }

    function getDirectoryFilterHelpers() {
        return {
            normalizeSearch,
            studentProfileCompleteness,
            isStudentEnrollmentActive,
            getStudentRoleLabel
        };
    }

    function getFilteredStudents(records) {
        const state = getStudentsState();
        const model = getStaffDirectoryModel(records);
        const normalizedFilters = typeof normalizeStudentDirectoryFilters === 'function'
            ? normalizeStudentDirectoryFilters(state.filters, model)
            : state.filters;
        if (typeof applyStudentDirectoryFilters === 'function') {
            return applyStudentDirectoryFilters(records, normalizedFilters, model, getDirectoryFilterHelpers());
        }
        return records;
    }

    function activeSelection(records) {
        const state = getStudentsState();
        return records.find((record) => record.id === state.selectedId) || null;
    }

    function setFilter(key, value) {
        const state = getStudentsState();
        state.filters[key] = value;
        renderStudentsPage();
    }

    function clearFilters() {
        const state = getStudentsState();
        state.filters = cloneDefaultFilters();
        renderStudentsPage();
        showToast('Student filters cleared.');
    }

    function reviewMissingData() {
        const state = getStudentsState();
        state.filters.profile = 'incomplete';
        state.filters.archive = 'active';
        state.filters.sort = 'completion';
        renderStudentsPage();
        showToast('Showing incomplete active profiles.');
    }

    function resolveRecordTypeId(record) {
        void record;
        return STUDENT_TYPE_ID;
    }

    function getRecordProfileSections(record) {
        const typeId = resolveRecordTypeId(record);
        if (typeof getStudentFormSchema !== 'function') return [];
        const schema = getStudentFormSchema(typeId);
        return (schema.sections || []).slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .filter((section) => (section.fields || []).length);
    }

    function profileSectionTabLabel(section) {
        return KiuCommandCenterUtils.profileSectionTabLabel(section);
    }

    function defaultProfileTabForRecord(record) {
        return getRecordProfileSections(record)[0]?.id || null;
    }

    function resolveActiveProfileTab(state, sections) {
        if (state.profileTab === 'admin' && state.viewRole === 'admin') return 'admin';
        if (sections.some((section) => section.id === state.profileTab)) return state.profileTab;
        return sections[0]?.id || null;
    }

    async function refreshStudentAcademicHydration(recordId) {
        const normalizedId = normalizeText(recordId, '');
        if (!normalizedId || typeof hydrateStudentAcademicRecord !== 'function') return;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const record = buildStudentRecords(facultyCode).records.find((item) => item.id === normalizedId) || null;
        if (!record) return;
        try {
            await hydrateStudentAcademicRecord(normalizedId, record);
        } catch (_) {
            if (typeof touchStudentAcademicSync === 'function') touchStudentAcademicSync(normalizedId);
        }
    }

    async function selectStudent(id) {
        const state = getStudentsState();
        state.academicSubjectsModal = null;
        state.selectedId = id;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const record = buildStudentRecords(facultyCode).records.find((item) => item.id === id) || null;
        state.profileTab = record ? defaultProfileTabForRecord(record) : null;
        window.location.hash = `profile/${encodeURIComponent(id)}`;
        await refreshStudentAcademicHydration(id);
        renderStudentsPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function backToDirectory() {
        const state = getStudentsState();
        state.academicSubjectsModal = null;
        state.selectedId = null;
        state.profileTab = null;
        if (window.location.hash.startsWith('#profile/')) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
        renderStudentsPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderStatusChip(value, toneClass = '') {
        return KiuCommandCenterUtils.renderStatusChipHtml(value, toneClass);
    }

    function applyStudentsHubProgressBars(scope = document) {
        KiuCommandCenterUtils.applyHubProgressBars(scope);
    }

    function renderOverview(record) {
        return KiuCommandCenterUtils.renderOverviewSection(record, studentProfileCompleteness(record));
    }

    function renderTeaching(record) {
        return KiuCommandCenterUtils.renderTeachingSection(record, isStudentEnrollmentActive);
    }

    function renderAvailability(record) {
        return KiuCommandCenterUtils.renderAvailabilitySection(record);
    }

    function renderContact(record) {
        return KiuCommandCenterUtils.renderContactSection(record);
    }

    function renderDocuments(record) {
        return KiuCommandCenterUtils.renderDocumentsSection(record);
    }

    function renderAdmin(record) {
        const state = getStudentsState();
        const canManage = state.viewRole === 'admin' && normalizeSearch(getCurrentUser?.()?.role || '') === 'admin';
        const completion = studentProfileCompleteness(record);
        const signals = record.signals || getStudentDirectorySignalsSafe(record);
        return `
            <div class="students-hub-info-grid">
                ${infoCard('Platform role', getStudentRoleLabel(record.platformRole))}
                ${infoCard('LMS role', record.lmsRole)}
                ${infoCard('Account status', record.accountStatus)}
                ${infoCard('Holds / risk', signals.holdLabel || 'Clear')}
                ${infoCard('Tuition balance', signals.balance > 0 ? `${Math.round(signals.balance)} GEL outstanding` : 'Clear')}
                ${infoCard('Last login', record.lastLogin || 'Never logged in')}
                ${infoCard('Last updated', record.updatedAt || 'Unknown')}
                ${infoCard('Created by', record.createdBy || 'Unknown')}
                ${infoCard('Completion', `${completion.percent}%`)}
                ${infoCard('Internal notes', record.notes || 'No admin notes.', true)}
            </div>
            <section class="students-hub-info-card is-full lux-data-card">
                <span>Admin actions</span>
                <div class="students-hub-inline-actions students-hub-inline-actions--spaced lux-btn-row-stack">
                    <button class="lux-secondary-btn" type="button" data-student-action="invite" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-paper-plane"></i> Send invitation</button>
                    <button class="lux-secondary-btn" type="button" data-student-action="toggle-login" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-power-off"></i> Toggle login</button>
                    <button class="lux-secondary-btn" type="button" data-student-action="mark-reviewed" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-clipboard-check"></i> Mark reviewed</button>
                    ${record.status === 'Archived'
                        ? `<button class="lux-primary-btn" type="button" data-student-action="restore" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-box-open"></i> Restore</button>`
                        : `<button class="lux-secondary-btn" type="button" data-student-action="archive" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-box-archive"></i> Archive</button>`}
                    <button class="lux-secondary-btn lux-danger-btn" type="button" data-student-action="delete" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-user-slash"></i> Delete</button>
                </div>
                ${!canManage ? '<p class="students-hub-section-copy students-hub-section-copy--spaced">Switch to Admin preview with an active administrator session to use admin-only actions.</p>' : ''}
            </section>
        `;
    }

    function renderBlueprintProfile(record, activeSectionId = null) {
        return KiuCommandCenterUtils.renderBlueprintProfileHtml(
            record,
            activeSectionId,
            resolveRecordTypeId,
            typeof renderStudentBlueprintProfileView === 'function' ? renderStudentBlueprintProfileView : null
        );
    }

    const __mobilityApi = typeof window.__kiuCreateStudentsCommandMobilityApi === 'function'
        ? window.__kiuCreateStudentsCommandMobilityApi({ escapeHtml, normalizeText, facultyName })
        : null;
    if (!__mobilityApi) throw new Error('students-command-mobility-runtime missing');
    const renderMobilityTab = __mobilityApi.renderMobilityTab;

    function renderProfileTab(record) {
        const state = getStudentsState();
        if (state.profileTab === 'admin' && state.viewRole === 'admin') return renderAdmin(record);
        if (state.profileTab === 'mobility') return renderMobilityTab(record);
        const sections = getRecordProfileSections(record);
        const activeSectionId = resolveActiveProfileTab(state, sections);
        if (activeSectionId === 'sec_academic' && typeof renderStudentAcademicProfile === 'function') {
            return renderStudentAcademicProfile(record, {
                escapeHtml,
                infoCard,
                renderStatusChip,
                renderBlueprintSummary: () => renderBlueprintProfile(record, 'sec_academic')
            });
        }
        return renderBlueprintProfile(record, activeSectionId);
    }

    function renderProfile(record) {
        const state = getStudentsState();
        const completion = studentProfileCompleteness(record);
        const sections = getRecordProfileSections(record);
        const sectionTabs = sections.map((section) => [section.id, profileSectionTabLabel(section)]);
        const mobilityTab = [['mobility', 'Mobility']];
        const adminTabs = state.viewRole === 'admin' ? [['admin', 'Admin']] : [];
        const tabs = [...sectionTabs, ...mobilityTab, ...adminTabs];
        const activeTab = state.profileTab === 'mobility'
            ? 'mobility'
            : (state.profileTab === 'admin' && state.viewRole === 'admin'
                ? 'admin'
                : resolveActiveProfileTab(state, sections));
        const tabsMarkup = tabs.length ? `
                <div class="students-hub-tabs lux-tab-strip is-profile-tabs">
                    ${tabs.map(([key, label]) => `<button class="students-hub-tab lux-tab-btn students-hub-profile-tab${activeTab === key ? ' is-active' : ''}" type="button" aria-pressed="${activeTab === key ? 'true' : 'false'}" data-student-action="tab" data-staff-tab="${escapeHtml(key)}">${escapeHtml(label)}</button>`).join('')}
                </div>` : '';
        return `
            <section class="students-hub-profile" data-lux-glass-root="1">
                <div class="students-hub-toolbar lux-btn-row-stack">
                    <button class="lux-secondary-btn" type="button" data-student-action="back"><i class="fas fa-arrow-left"></i> Back to student directory</button>
                    <div class="students-hub-toolbar-actions">
                        <button class="lux-primary-btn" type="button" data-student-action="edit" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-pen"></i> Edit profile</button>
                        <button class="lux-secondary-btn" type="button" data-student-action="message" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-envelope"></i> Message</button>
                        <button class="lux-secondary-btn" type="button" data-student-action="invite" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-paper-plane"></i> Send invite</button>
                    </div>
                </div>
                <div class="students-hub-profile-head">
                    <div class="students-hub-profile-head-main">
                        <div class="students-hub-profile-id">
                            <div class="students-hub-avatar is-large">${record.photo ? `<img alt="" src="${escapeHtml(record.photo)}">` : escapeHtml(initials(record.name))}</div>
                            <div>
                                <div class="students-hub-kicker">${escapeHtml(record.program || 'Student')} · ${escapeHtml(record.studentId || record.staffId)}</div>
                                <h2>${escapeHtml(record.name)}</h2>
                                <p>${escapeHtml(record.semester || 'Current semester')} · ${escapeHtml(record.department)} · ${escapeHtml(record.faculty)}</p>
                                <div class="students-hub-chips students-hub-chips--spaced">${renderStatusChip(record.status)}${renderStatusChip(record.accountStatus)}${renderStatusChip(record.lmsRole)}</div>
                            </div>
                        </div>
                        ${renderProgress(completion.percent, `${completion.percent}% complete · updated ${escapeHtml(record.updatedAt || 'unknown')}`)}
                        <div class="students-hub-toolbar-actions">
                            ${record.status === 'Archived'
                                ? `<button class="lux-primary-btn" type="button" data-student-action="restore" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-open"></i> Restore</button>`
                                : `<button class="lux-secondary-btn" type="button" data-student-action="archive" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-archive"></i> Archive</button>`}
                        </div>
                    </div>
                    ${typeof renderStudentProfileMetrics === 'function'
                        ? renderStudentProfileMetrics(record, { renderStatusChip })
                        : ''}
                </div>
                ${tabsMarkup}
                <div class="students-hub-profile-body">
                    ${renderProfileTab(record)}
                </div>
            </section>
        `;
    }

    function renderDirectory(records, facultyCode) {
        const state = getStudentsState();
        const model = getStaffDirectoryModel(records);
        const visible = getFilteredStudents(records);
        const facultyLabel = facultyName(facultyCode);
        const currentUserRole = normalizeSearch(getCurrentUser?.()?.role || '');
        const isAdminSession = currentUserRole === 'admin';
        const viewRoleOptions = VIEW_ROLES.map((value) => `<option value="${value}" ${state.viewRole === value ? 'selected' : ''}>${value === 'admin' ? 'Admin Preview' : value === 'faculty' ? 'Faculty Preview' : 'Viewer Preview'}</option>`).join('');
        const directoryControlsMarkup = typeof renderStudentDirectoryControls === 'function'
            ? renderStudentDirectoryControls({
                filters: state.filters,
                model,
                visibleCount: visible.length,
                isAdminSession,
                escapeHtml,
                getStudentRoleLabel,
                renderStaffTypeCreateButtons,
                helpers: getDirectoryFilterHelpers()
            })
            : '';

        const rows = visible.length ? visible.map((record) => {
                const completion = studentProfileCompleteness(record);
            const selected = state.selectedId === record.id;
            const holdTone = record.signals?.holdTone || 'success';
            return `
                <tr class="${selected ? 'is-selected' : ''}">
                    <td>
                        <button class="students-hub-row-button" type="button" data-student-action="select" data-staff-id="${escapeHtml(record.id)}">
                            <div class="students-hub-person">
                                <div class="students-hub-avatar">${record.photo ? `<img alt="" src="${escapeHtml(record.photo)}">` : escapeHtml(initials(record.name))}</div>
                                <div>
                                    <div class="students-hub-name">${escapeHtml(record.name)}</div>
                                    <div class="students-hub-meta">${escapeHtml(record.email || record.studentId)}</div>
                                </div>
                            </div>
                        </button>
                    </td>
                    <td><strong>${escapeHtml(record.program || 'Unassigned')}</strong><div class="students-hub-meta">${escapeHtml(record.semester || 'No semester')}</div></td>
                    <td><strong>${escapeHtml(record.mobilityLabel || 'Standard enrollment')}</strong><div class="students-hub-meta">${escapeHtml(record.cohort || '')}</div></td>
                    <td>${renderStatusChip(record.signals?.holdLabel || 'Clear', holdTone === 'danger' ? 'is-danger' : holdTone === 'warning' ? 'is-warning' : 'is-success')}<div class="students-hub-meta">${escapeHtml(record.accountStatus)}</div></td>
                    <td>${renderStatusChip(record.status)}<div class="students-hub-meta">${escapeHtml(record.lmsRole || 'Student')}</div></td>
                    <td>
                        ${renderProgress(completion.percent, `${completion.percent}% · ${completion.missing.length ? `${completion.missing.length} missing` : 'complete'}`)}
                    </td>
                    <td>
                        <div class="students-hub-inline-actions lux-btn-row-stack">
                            <button class="lux-primary-btn" type="button" data-student-action="select" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-id-card"></i> View</button>
                            <button class="lux-secondary-btn" type="button" data-student-action="edit" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-pen"></i> Edit</button>
                            ${record.status === 'Archived'
                                ? `<button class="lux-secondary-btn" type="button" data-student-action="restore" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-open"></i> Restore</button>`
                                : `<button class="lux-secondary-btn" type="button" data-student-action="archive" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-archive"></i> Archive</button>`}
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : `
            <div class="students-hub-empty lux-empty-state">
                <i class="fas fa-users-slash fa-2x" aria-hidden="true"></i>
                <strong>${records.length ? 'No students match these filters.' : 'No student records yet.'}</strong>
                <span>${records.length ? 'Try clearing filters, searching another program, or including archived records.' : 'Start by registering your first student.'}</span>
                <div class="students-hub-inline-actions lux-btn-row-stack">
                    ${records.length
                        ? '<button class="lux-secondary-btn" type="button" data-student-action="clear-filters">Clear filters</button>'
                        : renderPrimaryCreateButton(state, 'Register student')}
                </div>
            </div>
        `;

        return `
            <div class="students-hub-shell">

                <section class="students-hub-controls students-admin-controls students-hub-controls--adaptive">
                    ${directoryControlsMarkup}
                </section>

                <section class="students-hub-directory-panel">
                    <div class="students-hub-directory-head">
                        <div>
                            <div class="students-hub-overline">Student directory</div>
                            <h2 class="students-hub-section-title">Operational records</h2>
                            <p class="students-hub-section-copy">Open full profile pages, review readiness, and act on enrollment or account issues directly from the table.</p>
                        </div>
                        <div class="students-hub-inline-actions lux-btn-row-stack">
                            <button class="lux-secondary-btn" type="button" data-student-action="clear-filters"><i class="fas fa-filter-circle-xmark"></i> Clear filters</button>
                        </div>
                    </div>
                    <div class="students-hub-workspace">
                        <div class="students-hub-table-wrap lux-data-card">
                            ${visible.length ? `
                                <table class="students-hub-table" aria-label="Student directory">
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Program</th>
                                            <th>Mobility</th>
                                            <th>Holds</th>
                                            <th>Status</th>
                                            <th>Completion</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>${rows}</tbody>
                                </table>
                            ` : rows}
                        </div>
                    </div>
                </section>
            </div>
        `;
    }

    function renderStaffTypeCreateButtons(isAdminSession) {
        return KiuCommandCenterUtils.renderHubTypeCreateButtons(
            isAdminSession,
            typeof getStudentFormTypes === 'function' ? getStudentFormTypes : null,
            'student'
        );
    }

    function renderPrimaryCreateButton(state = getStudentsState(), fallbackLabel = 'Add Staff Profile') {
        const typeId = state.formSettingsTypeId || 'student';
        const type = typeof getStudentFormType === 'function' ? getStudentFormType(typeId) : null;
        return KiuCommandCenterUtils.renderHubPrimaryCreateButton(typeId, type?.label, fallbackLabel);
    }

    function refreshModalBody() {
        const state = getStudentsState();
        if (!state.modalOpen) return;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        if (typeof ensureStudentFormBlueprint === 'function') ensureStudentFormBlueprint();
        const { records } = buildStudentRecords(facultyCode);
        renderModal(records, facultyCode);
    }

    function renderAcademicSubjectsModal(records, options = {}) {
        const root = document.getElementById('students-admin-modal-root');
        if (!root) return false;
        const state = getStudentsState();
        const listKey = state.academicSubjectsModal;
        if (!listKey) return false;
        const record = records.find((item) => item.id === state.selectedId) || null;
        const filters = cloneAcademicSubjectsFilters(state.academicSubjectsFilters);
        const content = record && typeof renderAcademicSubjectsModalContent === 'function'
            ? renderAcademicSubjectsModalContent(record, listKey, { renderStatusChip }, filters)
            : null;
        if (!content) {
            state.academicSubjectsModal = null;
            return false;
        }
        root.removeAttribute('hidden');
        if (!root.hasAttribute('data-lux-transparency-exempt')) {
            root.setAttribute('data-lux-transparency-exempt', '1');
        }
        const toneClass = `is-list-${escapeHtml(content.listKey || listKey)}`;
        root.innerHTML = `
            <div class="students-hub-modal-backdrop" data-student-action="dismiss-academic-subjects">
                <div class="students-hub-modal students-hub-academic-subjects-modal ${toneClass}${content.isEmpty ? ' is-empty' : ''}" role="dialog" aria-modal="true" aria-labelledby="students-academic-subjects-title">
                    <div class="students-hub-modal-head students-hub-academic-subjects-head">
                        <div class="students-hub-modal-head-main">
                            <div class="students-hub-modal-title-row">
                                <h2 class="students-hub-modal-title" id="students-academic-subjects-title">
                                    <span class="students-hub-academic-subjects-icon" aria-hidden="true"><i class="fas ${escapeHtml(content.icon || 'fa-book-open')}"></i></span>
                                    ${escapeHtml(content.title)}
                                    <span class="students-hub-academic-count">${escapeHtml(String(content.count))}</span>
                                </h2>
                            </div>
                        </div>
                        <button class="students-hub-academic-subjects-close lux-secondary-btn" type="button" data-student-action="close-academic-subjects" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                    </div>
                    <div class="students-hub-modal-body students-hub-academic-subjects-body">
                        ${content.bodyHtml}
                    </div>
                </div>
            </div>
        `;
        const hubBackdrop = root.querySelector('.students-hub-modal-backdrop');
        if (hubBackdrop && typeof window.openLuxHubModalBackdrop === 'function') {
            window.openLuxHubModalBackdrop(hubBackdrop);
        } else {
            hubBackdrop?.classList.add('is-open');
        }
        if (options.restoreSearchFocus) {
            const search = root.querySelector('#academic-subjects-search');
            if (search && typeof search.focus === 'function') {
                search.focus({ preventScroll: true });
                const start = Number.isInteger(options.selectionStart) ? options.selectionStart : search.value.length;
                const end = Number.isInteger(options.selectionEnd) ? options.selectionEnd : start;
                if (typeof search.setSelectionRange === 'function') {
                    try {
                        search.setSelectionRange(start, end);
                    } catch (_err) {
                        /* search inputs may reject selection in some browsers */
                    }
                }
            }
        }
        return true;
    }

    function renderModal(records, facultyCode) {
        const root = document.getElementById('students-admin-modal-root');
        if (!root) return;
        const state = getStudentsState();
        if (state.academicSubjectsModal) {
            if (renderAcademicSubjectsModal(records)) return;
        }
        const editing = records.find((record) => record.id === state.editingId) || null;
        if (!state.modalOpen) {
            root.setAttribute('hidden', '');
            root.innerHTML = '';
            return;
        }
        const staffTypeId = state.modalStudentTypeId
            || (editing?.staffTypeId)
            || state.formSettingsTypeId
            || (typeof resolveStudentTypeId === 'function'
                ? resolveStudentTypeId(state.modalRole || editing?.platformRole || 'student')
                : 'student');
        const staffType = typeof getStudentFormType === 'function' ? getStudentFormType(staffTypeId) : null;
        if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
        const profile = editing || buildStudentDraftRecord(facultyCode, staffType?.platformRole || state.modalRole || 'student');
        if (typeof hydrateFieldValuesFromRecord === 'function') {
            profile.fieldValues = hydrateFieldValuesFromRecord(profile, staffTypeId);
        }
        const completion = studentProfileCompleteness({ ...profile, staffTypeId });
        const bodyMarkup = typeof renderStudentFormFromBlueprint === 'function'
            ? renderStudentFormFromBlueprint(staffTypeId, profile)
            : '<div class="students-hub-schema-empty lux-data-card"><strong>Form renderer unavailable</strong></div>';
        const schemaEmpty = typeof studentFormSchemaIsEmpty === 'function' && studentFormSchemaIsEmpty(staffTypeId);
        const touched = Boolean(state.modalTouched);
        const titleIcon = editing ? 'fa-user-pen' : 'fa-user-plus';
        root.removeAttribute('hidden');
        if (!root.hasAttribute('data-lux-transparency-exempt')) {
            root.setAttribute('data-lux-transparency-exempt', '1');
        }
        root.innerHTML = `
            <div class="students-hub-modal-backdrop" data-student-action="dismiss-modal">
                <form class="students-hub-modal" id="students-admin-form" novalidate data-student-type-id="${escapeHtml(staffTypeId)}" autocomplete="off">
                    <div class="students-hub-modal-head">
                        <div class="students-hub-modal-head-main">
                            <div class="students-hub-modal-title-row">
                                <h2 class="students-hub-modal-title"><i class="fas ${titleIcon}" aria-hidden="true"></i> ${editing ? 'Edit Staff Profile' : 'Add Staff Member'}</h2>
                                <span class="students-hub-modal-type-pill">${escapeHtml(staffType?.label || 'Staff')}</span>
                            </div>
                            <p class="students-hub-modal-copy">${editing
                                ? `Update this ${escapeHtml(staffType?.label || 'staff')} profile using your configured form sections.`
                                : `Create a new ${escapeHtml(staffType?.label || 'staff')} profile from the sections your administrators configured.`}</p>
                        </div>
                        <button class="lux-secondary-btn" type="button" data-student-action="close-modal" aria-label="Close modal"><i class="fas fa-times" aria-hidden="true"></i> Close</button>
                    </div>
                    <div class="students-hub-modal-body">
                        ${bodyMarkup}
                    </div>
                    <div class="students-hub-modal-foot">
                        ${renderModalStatus(completion, touched)}
                        <div class="students-hub-modal-actions lux-btn-row-stack">
                            <button class="lux-secondary-btn" type="button" data-student-action="close-modal">Cancel</button>
                            <button class="lux-secondary-btn" type="button" data-student-action="check-required-fields"><i class="fas fa-list-check" aria-hidden="true"></i> Check required fields</button>
                            <button class="lux-primary-btn" type="submit" ${schemaEmpty ? 'disabled' : ''}><i class="fas fa-check" aria-hidden="true"></i> ${editing ? 'Save Staff Profile' : 'Create Staff Profile'}</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        const hubBackdrop = root.querySelector('.students-hub-modal-backdrop');
        if (hubBackdrop && typeof window.openLuxHubModalBackdrop === 'function') {
            window.openLuxHubModalBackdrop(hubBackdrop);
        } else {
            hubBackdrop?.classList.add('is-open');
        }
        if (typeof window.enhanceUniversalPickers === 'function') {
            window.enhanceUniversalPickers(root);
        }
        refreshModalCompleteness();
    }

    function buildStudentDraftRecord(facultyCode) {
        const faculty = humanizeFacultyName(facultyCode);
        return {
            id: '',
            studentTypeId: STUDENT_TYPE_ID,
            staffTypeId: STUDENT_TYPE_ID,
            fieldValues: {},
            studentId: nextStudentNumber(),
            staffId: nextStudentNumber(),
            name: '',
            nameEn: '',
            email: '',
            phone: '',
            photo: '',
            status: 'Active',
            program: '',
            semester: '',
            cohort: String(new Date().getFullYear()),
            department: departmentForFaculty(facultyCode),
            faculty,
            facultyCode,
            mobility: { category: 'standard', agreementMetadata: {}, effectiveFrom: '', effectiveTo: '', history: [] },
            mobilityCategory: 'standard',
            curriculumPlan: {
                mode: 'standard',
                sourceFaculty: facultyCode,
                targetFaculty: facultyCode,
                subjectIds: [],
                completedSubjectIds: [],
                effectiveFrom: '',
                notes: ''
            },
            accountStatus: 'Not Invited',
            lmsRole: 'Student',
            lastLogin: '',
            updatedAt: todayIso(),
            createdBy: normalizeText(getCurrentUser?.()?.name || getCurrentUser?.()?.email || 'Admin', 'Admin'),
            documents: [],
            notes: ''
        };
    }

    function nextStudentNumber() {
        const store = ensureStore();
        const numbers = Object.values(store).map((entry) => Number(String(entry.studentId || entry.staffId || '').match(/(\d+)$/)?.[1] || 0));
        const next = Math.max(0, ...numbers) + 1;
        return `STU-${new Date().getFullYear()}-${String(next).padStart(3, '0')}`;
    }

    function nextUserId(facultyCode) {
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : (facultyCode || 'ECON');
        return `STU-${normalizedFaculty}-${Date.now()}`;
    }

    function clearFormErrors() {
        KiuCommandCenterUtils.clearFormErrors();
    }

    function markInvalid(id) {
        KiuCommandCenterUtils.markInvalid(id);
    }

    function buildStudentFormRecord(soft = false) {
        const state = getStudentsState();
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const staffTypeId = state.modalStudentTypeId
            || document.getElementById('students-admin-form')?.dataset?.staffTypeId
            || 'student';
        const staffType = typeof getStudentFormType === 'function' ? getStudentFormType(staffTypeId) : null;
        const platformRole = staffType?.platformRole || state.modalRole || 'student';
        const currentRecords = buildStudentRecords(facultyCode).records;
        const editing = currentRecords.find((record) => record.id === state.editingId) || null;
        const values = typeof collectStudentFormValues === 'function' ? collectStudentFormValues(staffTypeId) : {};
        const staffId = normalizeText(values.staff_id || editing?.staffId || '', '');
        const email = resolveStaffRegistrationEmail(values, editing);
        const existingUser = typeof window.findDuplicateEmailUser === 'function'
            ? window.findDuplicateEmailUser(KIU_STATE.users || [], email, editing?.id || '')
            : null;

        if (!soft) {
            if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
            else clearFormErrors();
            const errors = typeof validateStudentFormValues === 'function'
                ? validateStudentFormValues(staffTypeId, values, false)
                : [];
            if (existingUser) {
                const emailField = errors.find((item) => item.key === 'institutional_email') || { fieldId: '', key: 'institutional_email' };
                if (typeof markStaffFormInvalid === 'function') markStaffFormInvalid(emailField.fieldId || 'institutional_email');
            }
            errors.forEach((error) => {
                if (typeof markStaffFormInvalid === 'function') markStaffFormInvalid(error.fieldId);
            });
            if (errors.length || existingUser) {
                const state = getStudentsState();
                state.modalTouched = true;
                refreshModalCompleteness();
                scrollToFirstInvalidField();
                showToast(existingUser ? 'This email already exists in the KIU directory.' : 'Please fix required fields before saving.');
                return null;
            }
            if (typeof studentFormSchemaIsEmpty === 'function' && studentFormSchemaIsEmpty(staffTypeId)) {
                showToast('Configure the staff form blueprint before creating profiles.');
                return null;
            }
        }

        const draft = editing || buildStudentDraftRecord(facultyCode, platformRole);
        const actualFacultyCode = draft.facultyCode || facultyCode;
        const mapped = typeof mapStudentFieldValuesToLegacyRecord === 'function'
            ? mapStudentFieldValuesToLegacyRecord(staffTypeId, values, {
                ...draft,
                id: editing?.id || nextUserId(platformRole, actualFacultyCode),
                staffId: normalizeText(values.staff_id || editing?.staffId || nextStudentNumber(), nextStudentNumber()),
                facultyCode: actualFacultyCode,
                faculty: draft.faculty || humanizeFacultyName(actualFacultyCode),
                department: normalizeText(values.department || draft.department || departmentForFaculty(actualFacultyCode), departmentForFaculty(actualFacultyCode)),
                accountStatus: normalizeText(values.lms_account_status || draft.accountStatus || 'Not Invited', 'Not Invited'),
                lmsRole: normalizeText(values.lms_permission_role || draft.lmsRole || 'Student', 'Student'),
                visibility: normalizeText(values.profile_visibility || draft.visibility || getVisibilityDefault(platformRole), getVisibilityDefault(platformRole)),
                updatedAt: todayIso(),
                createdBy: normalizeText(editing?.createdBy || getCurrentUser?.()?.name || getCurrentUser?.()?.email || 'Admin', 'Admin'),
                documents: editing?.documents || [],
                courses: editing?.courses || [],
                scheduleSessions: editing?.scheduleSessions || [],
                officeHours: editing?.officeHours || [],
                links: editing?.links || [],
                joinYear: normalizeText(editing?.joinYear || new Date().getFullYear(), String(new Date().getFullYear())),
                subjects: editing?.subjects || [],
                maxHours: Math.max(1, Number(values.max_weekly_hours || editing?.maxHours || (platformRole === 'ta' ? 8 : 15)))
            })
            : { ...draft, fieldValues: values };
        mapped.staffTypeId = staffTypeId;
        mapped.fieldValues = { ...(mapped.fieldValues || {}), ...values };
        if (!mapped.name) mapped.name = normalizeText(values.full_name || '', 'New staff');
        mapped.email = email;
        if (values.institutional_email !== email) {
            mapped.fieldValues = { ...(mapped.fieldValues || {}), institutional_email: email };
        }
        if (!mapped.role) mapped.role = normalizeText(values.display_role || staffType?.label || 'Staff', staffType?.label || 'Staff');
        return mapped;
    }

    function syncGroupsForStaff(nextRecord, previousRecord = null) {
        return KiuCommandCenterUtils.syncGroupsForStaff(nextRecord, previousRecord);
    }

    function upsertFacultyMirror(nextRecord) {
        if (!KIU_STATE.facultyProfiles[nextRecord.facultyCode]) {
            KIU_STATE.facultyProfiles[nextRecord.facultyCode] = { professors: [], tas: [], curriculum: [], students: [] };
        }
        const profile = KIU_STATE.facultyProfiles[nextRecord.facultyCode];
        profile.students = (profile.students || []).filter((member) => String(member?.id || '') !== String(nextRecord.id));
        profile.students.push({
            id: nextRecord.id,
            studentId: nextRecord.studentId,
            name: nextRecord.name,
            nameEn: nextRecord.nameEn,
            email: nextRecord.email,
            program: nextRecord.program,
            semester: nextRecord.semester,
            cohort: nextRecord.cohort,
            course: nextRecord.program,
            status: nextRecord.status,
            phone: nextRecord.phone,
            photo: nextRecord.photo,
            gpa: nextRecord.gpa
        });
    }

    function upsertUserRecord(nextRecord, existingUser) {
        return KiuCommandCenterUtils.upsertUserRecord(nextRecord, existingUser, { role: 'student' });
    }

    function syncScheduleSessions(nextRecord) {
        return KiuCommandCenterUtils.syncScheduleSessions(nextRecord, { profPlatformRoles: ['student'] });
    }

    function persistStudentRecord(nextRecord) {
        const store = ensureStore();
        const current = buildStudentRecords(nextRecord.facultyCode).records.find((record) => record.id === nextRecord.id) || null;
        const existingUser = (KIU_STATE.users || []).find((user) => String(user?.id || '') === String(nextRecord.id)) || null;
        upsertUserRecord(nextRecord, existingUser);
        upsertFacultyMirror(nextRecord);
        store[nextRecord.id] = {
            id: nextRecord.id,
            studentId: nextRecord.studentId || nextRecord.staffId,
            staffId: nextRecord.studentId || nextRecord.staffId,
            name: nextRecord.name,
            nameEn: nextRecord.nameEn,
            email: nextRecord.email,
            phone: nextRecord.phone,
            photo: nextRecord.photo,
            status: nextRecord.status,
            program: nextRecord.program,
            semester: nextRecord.semester,
            cohort: nextRecord.cohort,
            department: nextRecord.department,
            faculty: nextRecord.faculty,
            facultyCode: nextRecord.facultyCode,
            gpa: nextRecord.gpa,
            mobility: nextRecord.mobility,
            mobilityCategory: nextRecord.mobilityCategory || nextRecord.mobility?.category,
            curriculumPlan: nextRecord.curriculumPlan,
            accountStatus: nextRecord.accountStatus,
            lmsRole: nextRecord.lmsRole,
            lastLogin: nextRecord.lastLogin,
            updatedAt: nextRecord.updatedAt,
            createdBy: nextRecord.createdBy,
            documents: nextRecord.documents,
            notes: nextRecord.notes,
            studentTypeId: nextRecord.studentTypeId || STUDENT_TYPE_ID,
            staffTypeId: nextRecord.studentTypeId || STUDENT_TYPE_ID,
            fieldValues: nextRecord.fieldValues || {}
        };
        void current;
        if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
            syncAvailableGroupEnrollmentCounts();
        }
        if (typeof saveState === 'function') {
            saveState();
        }
        if (typeof queueRealtimeUserSync === 'function' && !existingUser) {
            queueRealtimeUserSync(KIU_STATE.users.find((user) => String(user?.id || '') === String(nextRecord.id)));
        }
        if (typeof persistPortalStateToBackend === 'function') {
            persistPortalStateToBackend(existingUser ? 'update-students-command-center' : 'create-students-command-center').catch(() => null);
        }
        return nextRecord;
    }

    function archiveStudent(id) {
        KiuCommandCenterUtils.setRecordArchiveStatus(id, ensureRecordEntry, renderStudentsPage, 'Archived', 'Student');
    }

    function restoreStudent(id) {
        KiuCommandCenterUtils.setRecordArchiveStatus(id, ensureRecordEntry, renderStudentsPage, 'Active', 'Student');
    }

    function inviteStudent(id) {
        KiuCommandCenterUtils.inviteRecord(id, ensureRecordEntry, renderStudentsPage);
    }

    function toggleLogin(id) {
        KiuCommandCenterUtils.toggleLoginStatus(id, ensureRecordEntry, renderStudentsPage);
    }

    function markReviewed(id) {
        KiuCommandCenterUtils.markRecordReviewed(id, ensureRecordEntry, renderStudentsPage);
    }

    function deleteStudent(id) {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = buildStudentRecords(facultyCode).records;
        const record = records.find((item) => item.id === id);
        if (!record) return;
        if (!window.confirm(`Delete ${record.name}? This removes the student from the faculty directory.`)) return;
        const profile = KIU_STATE.facultyProfiles?.[record.facultyCode || facultyCode];
        if (profile?.students) {
            profile.students = profile.students.filter((member) => String(member?.id || '') !== String(id));
        }
        KIU_STATE.users = (KIU_STATE.users || []).filter((user) => String(user?.id || '') !== String(id));
        const store = ensureStore();
        delete store[id];
        const state = getStudentsState();
        if (state.selectedId === id) state.selectedId = null;
        if (typeof saveState === 'function') saveState();
        if (typeof persistPortalStateToBackend === 'function') {
            persistPortalStateToBackend('delete-students-command-center').catch(() => null);
        }
        renderStudentsPage();
        showToast(`${record.name} removed from the student directory.`);
    }

    function exportJson() {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = buildStudentRecords(facultyCode).records;
        KiuCommandCenterUtils.exportDirectoryJson(records, facultyCode, 'Student');
    }

    function exportCsv() {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = getFilteredStudents(buildStudentRecords(facultyCode).records);
        KiuCommandCenterUtils.exportDirectoryCsv(
            records,
            facultyCode,
            'Student',
            getStudentRoleLabel,
            studentProfileCompleteness
        );
    }

    function importJson(file) {
        KiuCommandCenterUtils.importDirectoryJson(file, {
            defaultRole: 'student',
            buildDraft: (facultyCode, platformRole) => buildStudentDraftRecord(facultyCode),
            persist: persistStudentRecord,
            onDone: () => renderStudentsPage(),
            successToast: 'Student directory imported.',
            failToast: 'Import failed. Please choose a valid staff JSON export.'
        });
    }

    function openAcademicSubjectsModal(listKey) {
        const allowed = ['enrolled', 'completed', 'failed', 'planned'];
        if (!allowed.includes(listKey)) return;
        const state = getStudentsState();
        if (state.modalOpen) closeModal();
        resetAcademicSubjectsFilters();
        state.academicSubjectsModal = listKey;
        renderStudentsPage();
    }

    function closeAcademicSubjectsModal() {
        const state = getStudentsState();
        state.academicSubjectsModal = null;
        resetAcademicSubjectsFilters();
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const { records } = buildStudentRecords(facultyCode);
        renderModal(records, facultyCode);
    }

    function openModal(id = null, staffTypeId = null) {
        const state = getStudentsState();
        state.academicSubjectsModal = null;
        if (typeof ensureStudentFormBlueprint === 'function') ensureStudentFormBlueprint();
        if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
        state.editingId = id;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const editing = id ? buildStudentRecords(facultyCode).records.find((record) => record.id === id) : null;
        state.modalStudentTypeId = staffTypeId
            || editing?.staffTypeId
            || state.formSettingsTypeId
            || (typeof resolveStudentTypeId === 'function'
                ? resolveStudentTypeId(editing?.platformRole || state.modalRole || 'student')
                : 'student');
        state.modalRole = typeof getStudentFormType === 'function'
            ? (getStudentFormType(state.modalStudentTypeId)?.platformRole || 'student')
            : (editing?.platformRole || staffTypeId || 'student');
        state.modalOpen = true;
        state.modalTouched = false;
        if (typeof getStudentFormBlueprint === 'function') {
            state.blueprintSeenAt = getStudentFormBlueprint().updatedAt || null;
        }
        renderStudentsPage();
        window.setTimeout(() => {
            document.querySelector('#students-admin-modal-root [data-student-blueprint-field]')?.focus();
        }, 0);
    }

    function closeModal() {
        const state = getStudentsState();
        state.modalOpen = false;
        state.modalTouched = false;
        state.editingId = null;
        state.modalRole = 'student';
        state.modalStudentTypeId = 'student';
        const root = document.getElementById('students-admin-modal-root');
        if (root && typeof window.closeLuxHubModalRoot === 'function') {
            window.closeLuxHubModalRoot(root);
            return;
        }
        renderModal([], typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
    }

    let __formBuilderRuntimePromise = null;
    function ensureFormBuilderRuntime() {
        window.__KIU_FORM_BUILDER_NS__ = 'student';
        if (typeof window.renderStudentFormSettings === 'function' || typeof window.bindStudentFormBuilderEvents === 'function') {
            return Promise.resolve(true);
        }
        if (__formBuilderRuntimePromise) return __formBuilderRuntimePromise;
        const urls = [
            'assets/js/pages/form-builder-actions-runtime.js?v=20260726-stafffix11',
            'assets/js/pages/form-builder-runtime.js?v=20260726-stafffix11'
        ];
        __formBuilderRuntimePromise = urls.reduce((chain, src) => chain.then(() => new Promise((resolve) => {
            const existing = document.querySelector(`script[src="${src}"]`);
            if (existing) {
                if (existing.dataset.kiuLoaded === '1') { resolve(true); return; }
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', () => resolve(false), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.defer = true;
            script.onload = () => { script.dataset.kiuLoaded = '1'; resolve(true); };
            script.onerror = () => resolve(false);
            document.head.appendChild(script);
        })), Promise.resolve(true));
        return __formBuilderRuntimePromise;
    }

    function ensureStudentFormBuilderEventsBound() {
        if (typeof window.bindStudentFormBuilderEvents !== 'function') return false;
        if (window.__studentFormBuilderBound) return true;
        window.bindStudentFormBuilderEvents({
            ...getStudentBuilderCallbacks(),
            onBackDirectory: () => backToDirectoryWorkspace()
        });
        return true;
    }

    function openFormSettings(typeId = null) {
        const run = () => KiuCommandCenterUtils.openFormSettingsWorkspace({
            getState: getStudentsState,
            renderPage: renderStudentsPage,
            closeModal,
            defaultTypeId: 'student',
            typeId
        });
        if (typeof window.renderStudentFormSettings === 'function') {
            run();
            return;
        }
        ensureFormBuilderRuntime().then((ok) => {
            if (!ok) {
                showToast('Form studio failed to load. Refresh and try again.');
                return;
            }
            ensureStudentFormBuilderEventsBound();
            run();
        });
    }

    function backToDirectoryWorkspace() {
        const state = getStudentsState();
        if (state.modalOpen) closeModal();
        state.workspace = 'directory';
        state.builderPanel = null;
        renderStudentsPage();
    }

    function getStudentBuilderCallbacks() {
        return {
            getState: getStudentsState,
            setState: (patch) => {
                const next = patch || {};
                const state = getStudentsState();
                Object.assign(state, next);
                if (next.selectedTypeId) state.formSettingsTypeId = next.selectedTypeId;
            },
            onRefresh: () => {
                const state = getStudentsState();
                if (state.workspace === 'form-settings'
                    && typeof window.patchStudentFormStudioCanvas === 'function') {
                    const patched = window.patchStudentFormStudioCanvas(state, getStudentBuilderCallbacks());
                    if (patched) {
                        const container = document.getElementById('students-content');
                        if (container) applyStudentsHubProgressBars(container);
                        if (typeof queueLuxuryTransparencyRefresh === 'function' && state.workspace !== 'form-settings') {
                            queueLuxuryTransparencyRefresh();
                        }
                        return;
                    }
                }
                renderStudentsPage();
            },
            onBlueprintSaved: (typeId) => {
                const state = getStudentsState();
                if (typeId) state.formSettingsTypeId = typeId;
                if (state.modalOpen && state.modalStudentTypeId === typeId) refreshModalBody();
            },
            onToast: (message) => showToast(message)
        };
    }

    function markModalTouched() {
        const state = getStudentsState();
        if (!state.modalTouched) {
            state.modalTouched = true;
        }
    }

    function scrollToFirstInvalidField() {
        return KiuCommandCenterUtils.scrollToFirstInvalidField();
    }

    function refreshModalCompleteness() {
        const state = getStudentsState();
        const next = buildStudentFormRecord(true);
        if (!next) return;
        KiuCommandCenterUtils.applyModalCompletenessUI(
            studentProfileCompleteness(next),
            next.fieldValues || {},
            Boolean(state.modalTouched)
        );
    }

    function checkRequiredFields() {
        const state = getStudentsState();
        state.modalTouched = true;
        const staffTypeId = state.modalStudentTypeId
            || document.getElementById('students-admin-form')?.dataset?.staffTypeId
            || 'student';
        if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
        else clearFormErrors();
        const values = typeof collectStudentFormValues === 'function' ? collectStudentFormValues(staffTypeId) : {};
        const errors = typeof validateStudentFormValues === 'function'
            ? validateStudentFormValues(staffTypeId, values, false)
            : [];
        errors.forEach((error) => {
            if (typeof markStaffFormInvalid === 'function') markStaffFormInvalid(error.fieldId);
        });
        refreshModalCompleteness();
        if (errors.length) {
            scrollToFirstInvalidField();
            showToast(`${errors.length} required field${errors.length === 1 ? '' : 's'} still need attention.`);
            return;
        }
        showToast('All required fields are complete.');
    }

    async function applyHashRoute() {
        const state = getStudentsState();
        const match = window.location.hash.match(/^#profile\/(.+)$/);
        if (!match) {
            state.selectedId = null;
            renderStudentsPage();
            return;
        }
        const id = decodeURIComponent(match[1]);
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = buildStudentRecords(facultyCode).records;
        if (records.some((record) => record.id === id)) {
            state.selectedId = id;
            state.profileTab = defaultProfileTabForRecord(records.find((record) => record.id === id));
            await refreshStudentAcademicHydration(id);
        } else {
            state.selectedId = null;
            history.replaceState('', document.title, window.location.pathname + window.location.search);
            showToast('Profile not found. Returning to student directory.');
        }
        renderStudentsPage();
    }

    function submitForm(event) {
        event.preventDefault();
        const next = buildStudentFormRecord(false);
        if (!next) return;
        const wasEditing = Boolean(getStudentsState().editingId);
        persistStudentRecord(next);
        const state = getStudentsState();
        state.selectedId = next.id;
        state.profileTab = defaultProfileTabForRecord(next);
        closeModal();
        renderStudentsPage();
        showToast(`${next.name} ${wasEditing ? 'updated' : 'added'}.`);
    }

    function handleAction(action, element) {
        const staffId = element?.dataset?.staffId || '';
        if (action === 'open-create') {
            const staffTypeId = element?.dataset?.staffTypeId
                || (typeof resolveStudentTypeId === 'function'
                    ? resolveStudentTypeId(element?.dataset?.staffRole || 'student')
                    : 'student');
            openModal(null, staffTypeId);
            return;
        }
        if (action === 'open-form-settings') {
            const settingsState = getStudentsState();
            openFormSettings(element?.dataset?.staffTypeId
                || settingsState.modalStudentTypeId
                || settingsState.formSettingsTypeId
                || null);
            return;
        }
        if (action === 'clear-filters') {
            clearFilters();
            return;
        }
        if (action === 'clear-filter-chip') {
            const state = getStudentsState();
            const kind = element?.dataset?.filterClearKind || 'system';
            const key = element?.dataset?.filterClearKey || '';
            if (!key) return;
            if (!state.filters.field || typeof state.filters.field !== 'object') {
                state.filters.field = {};
            }
            if (kind === 'field') {
                delete state.filters.field[key];
            } else if (key === 'query') {
                state.filters.query = '';
            } else if (key === 'droplistQuery') {
                state.filters.droplistQuery = '';
            } else if (key === 'mobility') {
                state.filters.mobility = 'all';
            } else if (key === 'program') {
                state.filters.program = 'all';
            } else if (key === 'profile') {
                state.filters.profile = 'all';
            } else if (key === 'teaching') {
                state.filters.teaching = 'all';
            } else if (key === 'archive') {
                state.filters.archive = 'active';
            } else if (key === 'sort') {
                state.filters.sort = 'name';
            }
            renderStudentsPage();
            return;
        }
        if (action === 'review-missing') {
            reviewMissingData();
            return;
        }
        if (action === 'select') {
            selectStudent(staffId);
            return;
        }
        if (action === 'back') {
            backToDirectory();
            return;
        }
        if (action === 'edit') {
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const records = buildStudentRecords(facultyCode).records;
            const record = records.find((item) => item.id === staffId);
            openModal(staffId, record?.staffTypeId || (typeof resolveStudentTypeId === 'function'
                ? resolveStudentTypeId(record?.platformRole || 'student')
                : 'student'));
            return;
        }
        if (action === 'archive') {
            archiveStudent(staffId);
            return;
        }
        if (action === 'restore') {
            restoreStudent(staffId);
            return;
        }
        if (action === 'invite') {
            inviteStudent(staffId);
            return;
        }
        if (action === 'toggle-login') {
            toggleLogin(staffId);
            return;
        }
        if (action === 'mark-reviewed') {
            markReviewed(staffId);
            return;
        }
        if (action === 'delete') {
            deleteStudent(staffId);
            return;
        }
        if (action === 'tab') {
            const state = getStudentsState();
            state.profileTab = element.dataset.staffTab || null;
            if (state.profileTab !== 'sec_academic') state.academicSubjectsModal = null;
            if (state.profileTab === 'sec_academic' && state.selectedId) {
                refreshStudentAcademicHydration(state.selectedId).finally(() => renderStudentsPage());
                return;
            }
            renderStudentsPage();
            return;
        }
        if (action === 'save-mobility') {
            saveMobility(staffId);
            return;
        }
        if (action === 'execute-transfer') {
            executeTransfer(staffId);
            return;
        }
        if (action === 'open-academic-subjects') {
            openAcademicSubjectsModal(element.dataset.academicList || '');
            return;
        }
        if (action === 'close-academic-subjects' || action === 'dismiss-academic-subjects') {
            closeAcademicSubjectsModal();
            return;
        }
        if (action === 'clear-academic-subjects-filters') {
            resetAcademicSubjectsFilters();
            refreshAcademicSubjectsModal();
            return;
        }
        if (action === 'add-subject') {
            addSubjectEnrollment(staffId, element.dataset.subjectId || '');
            return;
        }
        if (action === 'remove-subject') {
            removeSubjectEnrollment(staffId, element.dataset.subjectId || '');
            return;
        }
        if (action === 'mark-subject-complete') {
            markSubjectComplete(staffId, element.dataset.subjectId || '');
            return;
        }
        if (action === 'close-modal' || action === 'dismiss-modal') {
            closeModal();
            return;
        }
        if (action === 'check-required-fields') {
            checkRequiredFields();
            return;
        }
        if (action === 'export') {
            exportJson();
            return;
        }
        if (action === 'export-csv') {
            exportCsv();
            return;
        }
        if (action === 'import') {
            document.getElementById('staff-import-file')?.click();
            return;
        }
        if (action === 'saved-view') {
            const state = getStudentsState();
            const view = element?.dataset?.staffView || 'all';
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const { records } = buildStudentRecords(facultyCode);
            const model = getStaffDirectoryModel(records);
            if (typeof resolveStudentSavedViewFilters === 'function') {
                const resolved = resolveStudentSavedViewFilters(view, model);
                if (view === 'all') {
                    state.filters = typeof normalizeStudentDirectoryFilters === 'function'
                        ? normalizeStudentDirectoryFilters(resolved, model)
                        : { ...cloneDefaultFilters(), ...resolved, field: { ...(resolved.field || {}) } };
                } else {
                    const merged = {
                        ...state.filters,
                        ...resolved,
                        field: { ...(state.filters.field || {}), ...(resolved.field || {}) }
                    };
                    state.filters = typeof normalizeStudentDirectoryFilters === 'function'
                        ? normalizeStudentDirectoryFilters(merged, model)
                        : merged;
                }
            } else if (view === 'all') {
                state.filters = cloneDefaultFilters();
            }
            renderStudentsPage();
            return;
        }
        if (action === 'message') {
            showToast('Messaging requires LMS or email integration.');
        }
    }

    function bindEvents() {
        if (window.__studentsCommandBound) return;
        window.__studentsCommandBound = true;
        ensureStudentFormBuilderEventsBound();

        document.addEventListener('click', (event) => {
            const actionEl = event.target.closest('[data-student-action]');
            if (!actionEl) return;
            if ((actionEl.dataset.studentAction === 'dismiss-modal'
                || actionEl.dataset.studentAction === 'dismiss-academic-subjects')
                && event.target !== actionEl) return;
            event.preventDefault();
            handleAction(actionEl.dataset.studentAction, actionEl);
        });

        document.addEventListener('input', (event) => {
            if (event.target.id === 'staff-search' || event.target.id === 'staff-global-search') {
                setFilter('query', event.target.value);
                return;
            }
            if (event.target.id === 'staff-droplist-search') {
                setFilter('droplistQuery', event.target.value);
                if (typeof window.applyStudentDirectoryDroplistFieldVisibility === 'function') {
                    window.applyStudentDirectoryDroplistFieldVisibility(event.target.value);
                }
                return;
            }
            if (event.target.id === 'student-filter-program') {
                setFilter('program', event.target.value.trim() || 'all');
                return;
            }
            if (event.target.id === 'academic-subjects-search') {
                const state = getStudentsState();
                if (!state.academicSubjectsModal) return;
                state.academicSubjectsFilters = cloneAcademicSubjectsFilters({
                    ...state.academicSubjectsFilters,
                    query: event.target.value
                });
                refreshAcademicSubjectsModal({
                    restoreSearchFocus: true,
                    selectionStart: event.target.selectionStart,
                    selectionEnd: event.target.selectionEnd
                });
                return;
            }
            if (event.target.closest('#students-admin-modal-root') && !getStudentsState().academicSubjectsModal) {
                markModalTouched();
                refreshModalCompleteness();
            }
        });

        document.addEventListener('change', (event) => {
            if (event.target.id === 'academic-subjects-sort') {
                const state = getStudentsState();
                if (!state.academicSubjectsModal) return;
                state.academicSubjectsFilters = cloneAcademicSubjectsFilters({
                    ...state.academicSubjectsFilters,
                    sort: event.target.value
                });
                refreshAcademicSubjectsModal();
                return;
            }
            if (event.target.matches('[data-staff-directory-filter]')) {
                const kind = event.target.dataset.filterKind || 'system';
                const key = event.target.dataset.filterKey || '';
                const value = event.target.value;
                const state = getStudentsState();
                if (!state.filters.field || typeof state.filters.field !== 'object') {
                    state.filters.field = {};
                }
                if (kind === 'field' && key) {
                    if (value === 'all' || value === '') {
                        delete state.filters.field[key];
                    } else {
                        state.filters.field[key] = value;
                    }
                } else if (key) {
                    state.filters[key] = value;
                }
                renderStudentsPage();
                return;
            }
            if (event.target.id === 'student-filter-mobility') {
                setFilter('mobility', event.target.value || 'all');
                return;
            }
            if (event.target.id === 'student-mobility-category') {
                if (typeof toggleMobilityTransferPanel === 'function') {
                    toggleMobilityTransferPanel(event.target.value || 'standard');
                }
                return;
            }
            if (event.target.id === 'staff-view-role') {
                const state = getStudentsState();
                state.viewRole = event.target.value;
                renderStudentsPage();
                showToast(`${event.target.options[event.target.selectedIndex].text} enabled.`);
                return;
            }
            if (event.target.id === 'staff-import-file') {
                importJson(event.target.files?.[0]);
                event.target.value = '';
                return;
            }
            if (event.target.closest('#students-admin-modal-root') && !getStudentsState().academicSubjectsModal) {
                markModalTouched();
                refreshModalCompleteness();
            }
        });

        document.addEventListener('submit', (event) => {
            if (event.target.id === 'students-admin-form') {
                submitForm(event);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            const state = getStudentsState();
            if (state.academicSubjectsModal) {
                closeAcademicSubjectsModal();
                return;
            }
            if (state.modalOpen) closeModal();
        });

        window.addEventListener('hashchange', applyHashRoute);
    }
    function renderStudentsPage() {
        if (typeof ensureStudentFormBlueprint === 'function') ensureStudentFormBlueprint();
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const { records } = buildStudentRecords(facultyCode);
        const container = document.getElementById('students-content');
        if (!container) return;
        container.classList.add('students-admin-root');
        const state = getStudentsState();
        const selected = activeSelection(records);
        if (state.workspace === 'form-settings' && typeof renderStudentFormSettings === 'function') {
            if (typeof window.flushStudentBuilderFieldInputs === 'function') {
                window.flushStudentBuilderFieldInputs(container, getStudentBuilderCallbacks());
            }
            container.innerHTML = renderStudentFormSettings({
                ...state,
                selectedTypeId: state.formSettingsTypeId || state.selectedTypeId || 'student'
            }, getStudentBuilderCallbacks());
            ensureStudentFormBuilderEventsBound();
            if (typeof window.enhanceUniversalPickers === 'function') {
                const formSettingsWorkspace = container.querySelector('.students-hub-form-settings');
                if (formSettingsWorkspace) window.enhanceUniversalPickers(formSettingsWorkspace);
            }
            if (state.sectionNameFocusId && typeof focusStudentSectionCatalogTitle === 'function') {
                focusStudentSectionCatalogTitle(container, state.sectionNameFocusId, getStudentBuilderCallbacks());
            }
        } else {
            container.innerHTML = selected ? renderProfile(selected) : renderDirectory(records, facultyCode);
            if (!selected && typeof window.enhanceUniversalPickers === 'function') {
                const directoryWorkspace = container.querySelector('.students-hub-shell');
                if (directoryWorkspace) window.enhanceUniversalPickers(directoryWorkspace);
            }
            if (!selected && typeof window.applyStudentDirectoryDroplistFieldVisibility === 'function') {
                window.applyStudentDirectoryDroplistFieldVisibility(state.filters?.droplistQuery || '');
            }
        }
        applyStudentsHubProgressBars(container);
        renderModal(records, facultyCode);
        if (typeof queueEnglishLocalization === 'function') {
            if (state.workspace !== 'form-settings') {
                queueEnglishLocalization(container);
            }
            const modalRoot = document.getElementById('students-admin-modal-root');
            if (modalRoot && !modalRoot.hasAttribute('hidden')) {
                queueEnglishLocalization(modalRoot);
            }
        }
        if (typeof queueLuxuryTransparencyRefresh === 'function' && state.workspace !== 'form-settings') {
            queueLuxuryTransparencyRefresh();
        }
        if (selected && state.profileTab !== 'mobility' && state.profileTab !== 'admin') {
            const sections = typeof getRecordProfileSections === 'function' ? getRecordProfileSections(selected) : [];
            const activeTab = resolveActiveProfileTab(state, sections);
            if (activeTab === 'sec_academic' && typeof renderStudentAdminScheduleEmbed === 'function') {
                renderStudentAdminScheduleEmbed(selected.id);
            }
        }
        if (document.documentElement?.classList.contains('kiu-shell-loading')) {
            document.documentElement.classList.remove('kiu-shell-loading');
        }
        document.body?.classList.remove('kiu-shell-loading');
    }

    function consumePendingAdminAccountFlow() {
        const pending = localStorage.getItem(FLOW_KEY);
        if (!pending) return;
        if (pending === 'student' || pending === USER_ROLES?.STUDENT) {
            localStorage.removeItem(FLOW_KEY);
            openStudentRegistration();
            return;
        }
    }

    function openStudentRegistration(role) {
        const staffTypeId = typeof resolveStudentTypeId === 'function'
            ? resolveStudentTypeId(role || 'student')
            : (role || 'student');
        openModal(null, staffTypeId);
    }

    function studentTabSwitch(tab) {
        const mobilityMap = {
            exchange_incoming: 'exchange_incoming',
            exchange_outgoing: 'exchange_outgoing',
            internal_transfer: 'internal_transfer',
            standard: 'standard',
            all: 'all'
        };
        setFilter('mobility', mobilityMap[tab] || 'all');
    }

    /* Wave 18: students-command-academic-runtime.js */
    const __sccAcademicDeps = window.__kiuStudentsCommandAcademicDeps = {
        normalizeText: (...a) => normalizeText(...a),
        buildStudentRecords: (...a) => buildStudentRecords(...a),
        persistStudentRecord: (...a) => persistStudentRecord(...a),
        showToast: (...a) => showToast(...a),
        renderStudentsPage: (...a) => renderStudentsPage(...a),
        todayIso: (...a) => todayIso(...a),
        ensureRecordEntry: (...a) => ensureRecordEntry(...a),
        departmentForFaculty: (...a) => departmentForFaculty(...a),
        syncCurriculumPlanSubjectIds: (...a) => typeof syncCurriculumPlanSubjectIds === 'function' ? syncCurriculumPlanSubjectIds(...a) : null,
        updateStudentCurriculumPlan: (...a) => typeof updateStudentCurriculumPlan === 'function' ? updateStudentCurriculumPlan(...a) : window.updateStudentCurriculumPlan?.(...a),
        executeInternalTransfer: (...a) => typeof executeInternalTransfer === 'function' ? executeInternalTransfer(...a) : window.executeInternalTransfer?.(...a),
        addStudentEnrollmentSubject: (...a) => typeof addStudentEnrollmentSubject === 'function' ? addStudentEnrollmentSubject(...a) : window.addStudentEnrollmentSubject?.(...a),
        removeStudentEnrollmentSubject: (...a) => typeof removeStudentEnrollmentSubject === 'function' ? removeStudentEnrollmentSubject(...a) : window.removeStudentEnrollmentSubject?.(...a),
        markStudentSubjectComplete: (...a) => typeof markStudentSubjectComplete === 'function' ? markStudentSubjectComplete(...a) : window.markStudentSubjectComplete?.(...a),
        touchStudentAcademicSync: (...a) => typeof touchStudentAcademicSync === 'function' ? touchStudentAcademicSync(...a) : window.touchStudentAcademicSync?.(...a),
        switchFacultyTheme: (...a) => typeof switchFacultyTheme === 'function' ? switchFacultyTheme(...a) : window.switchFacultyTheme?.(...a),
        saveState: (...a) => typeof saveState === 'function' ? saveState(...a) : window.saveState?.(...a),
        getCurrentFaculty: (...a) => typeof getCurrentFaculty === 'function' ? getCurrentFaculty(...a) : window.getCurrentFaculty?.(...a)
    };
    const __w18PeelApi = typeof window.__kiuCreateStudentsCommandAcademicApi === 'function'
        ? window.__kiuCreateStudentsCommandAcademicApi(__sccAcademicDeps) : null;
    if (!__w18PeelApi) throw new Error('students-command-academic-runtime.js missing');
    const { parseMobilitySubjectIds, saveMobility, executeTransfer, persistAcademicEnrollmentChange, addSubjectEnrollment, removeSubjectEnrollment, markSubjectComplete } = __w18PeelApi;
    Object.assign(__sccAcademicDeps, { parseMobilitySubjectIds, persistAcademicEnrollmentChange });

    window.renderStudentsPage = renderStudentsPage;
    window.renderStudentsAdminLmsPage = renderStudentsPage;
    window.openStudentRegistration = openStudentRegistration;
    window.consumePendingAdminAccountFlow = consumePendingAdminAccountFlow;
    window.studentTabSwitch = studentTabSwitch;
    window.openStudentModal = openStudentRegistration;
    bindEvents();
    if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        consumePendingAdminAccountFlow();
        if (window.location.hash.startsWith('#profile/')) {
            applyHashRoute();
        }
        renderStudentsPage();
    }, { once: true });
    } else {
    consumePendingAdminAccountFlow();
    renderStudentsPage();
    }
})();
