(function initStaffCommandCenter() {
    'use strict';

    window.__KIU_COMMAND_CENTER_HUB__ = 'staff-hub';
    window.__KIU_COMMAND_CENTER_ENTITY__ = 'Staff';
    window.__KIU_COMMAND_CENTER_TOAST_ID__ = 'staff-command-toast';
    window.__KIU_COMMAND_CENTER_TOAST_TIMER_KEY__ = '__staffCommandToastTimer';
    window.__KIU_COMMAND_CENTER_MODAL_ROOT__ = 'staff-command-modal-root';
    window.__KIU_COMMAND_CENTER_FIELD_NS__ = 'staff';

    const FLOW_KEY = 'KIU_PENDING_ADMIN_ACCOUNT_FLOW';
    const STORE_KEY = 'staffDirectoryRecords';
    function cloneDefaultFilters() {
        const base = typeof STAFF_DIRECTORY_DEFAULT_FILTERS !== 'undefined'
            ? STAFF_DIRECTORY_DEFAULT_FILTERS
            : {
                query: '',
                droplistQuery: '',
                platform: 'all',
                field: {},
                profile: 'all',
                teaching: 'all',
                archive: 'active',
                sort: 'name'
            };
        return { ...base, field: { ...(base.field || {}) } };
    }
    const VIEW_ROLES = ['admin', 'faculty', 'viewer'];
    const PLATFORM_ROLE_META = {
        professor: { profileKey: 'professors', label: 'Professor', lmsRole: 'Instructor' },
        ta: { profileKey: 'tas', label: 'Teaching Assistant', lmsRole: 'Teaching Assistant' },
        student_service: { profileKey: 'service', label: 'Student Service', lmsRole: 'Support Agent' }
    };

    function getStaffState() {
        if (!window.__staffCommandState) {
            window.__staffCommandState = {
                selectedId: null,
                profileTab: null,
                editingId: null,
                modalRole: 'professor',
                modalStaffTypeId: 'professor',
                modalOpen: false,
                modalTouched: false,
                workspace: 'directory',
                formSettingsTypeId: 'professor',
                builderPanel: null,
                builderDirty: false,
                builderLastSavedAt: null,
                blueprintSeenAt: null,
                activeSectionId: null,
                sectionNameFocusId: null,
                fieldAdvancedOpenId: null,
                fieldRemovePendingId: null,
                lockedFieldKeys: {},
                copySourceTypeId: 'ta',
                copySections: true,
                viewRole: 'admin',
                filters: cloneDefaultFilters()
            };
        }
        if (window.__staffCommandState.workspace == null) window.__staffCommandState.workspace = 'directory';
        if (window.__staffCommandState.formSettingsTypeId == null) window.__staffCommandState.formSettingsTypeId = 'professor';
        if (window.__staffCommandState.modalStaffTypeId == null) window.__staffCommandState.modalStaffTypeId = 'professor';
        return window.__staffCommandState;
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
        const record = buildStaffRecords(effectiveFaculty).records.find((item) => item.id === id);
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
            fieldValues: record.fieldValues || {}
        };
        return store[id];
    }

    function getAccountStatus(user, stored) {
        return KiuCommandCenterUtils.getAccountStatus(user, stored);
    }

    function resolveStaffRegistrationEmail(values = {}, editing = null) {
        return KiuCommandCenterUtils.resolveStaffRegistrationEmail(values, editing);
    }

    function getPlatformRoleLabel(platformRole) {
        if (typeof getStaffFormTypes === 'function') {
            const match = getStaffFormTypes().find((type) => type.platformRole === platformRole || type.id === platformRole || type.slug === platformRole);
            if (match) return match.label;
        }
        return PLATFORM_ROLE_META[platformRole]?.label || 'Staff';
    }

    function getVisibilityDefault(platformRole) {
        return KiuCommandCenterUtils.getVisibilityDefault(platformRole);
    }

    function buildPlatformCandidates(facultyCode) {
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : (facultyCode || 'ECON');
        const profile = typeof getFacultyProfile === 'function' ? getFacultyProfile(normalizedFaculty) : null;
        const merged = new Map();

        function absorb(item, platformRole, fallbackIdPrefix) {
            if (!item) return;
            const id = String(item.id || '');
            const email = normalizeSearch(item.email || '');
            const name = normalizeSearch(item.name || item.nameEn || '');
            const key = id || `${platformRole}:${email || name || `${fallbackIdPrefix}-${Date.now()}`}`;
            if (!merged.has(key)) {
                merged.set(key, {
                    id,
                    platformRole,
                    facultyCode: normalizedFaculty,
                    member: null,
                    user: null
                });
            }
            const target = merged.get(key);
            target.platformRole = platformRole || target.platformRole;
            target.facultyCode = normalizedFaculty;
            if (fallbackIdPrefix === 'member') {
                target.member = { ...(target.member || {}), ...item };
            } else {
                target.user = { ...(target.user || {}), ...item };
            }
            if (!target.id && item.id) target.id = String(item.id);
        }

        (profile?.professors || []).forEach((member) => absorb(member, 'professor', 'member'));
        (profile?.tas || []).forEach((member) => absorb(member, 'ta', 'member'));
        (KIU_STATE.users || []).forEach((user) => {
            const platformRole = normalizeSearch(user?.role);
            const userFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(user?.facultyCode || user?.faculty || normalizedFaculty, normalizedFaculty)
                : (user?.facultyCode || user?.faculty || normalizedFaculty);
            if (userFaculty !== normalizedFaculty) return;
            const knownRoles = new Set(['professor', 'ta', 'student_service']);
            if (typeof getStaffFormTypes === 'function') {
                getStaffFormTypes().forEach((type) => knownRoles.add(type.platformRole));
            }
            if (!knownRoles.has(platformRole)) return;
            absorb(user, platformRole, 'user');
        });

        return { normalizedFaculty, profile, merged };
    }

    function buildStaffRecords(facultyCode) {
        ensureStore();
        const { normalizedFaculty, profile, merged } = buildPlatformCandidates(facultyCode);
        const { hoursMap, unassignedSections } = buildHoursAndSectionStats(normalizedFaculty);
        const records = Array.from(merged.values()).map((entry) => {
            const base = { ...(entry.member || {}), ...(entry.user || {}) };
            const stored = getRecordStoreEntry(entry.id || base.id) || {};
            const name = normalizeText(stored.name || base.name || base.nameEn, 'Unknown staff');
            const nameEn = normalizeText(stored.nameEn || base.nameEn || base.name || '', '');
            const photo = scrubFakeMedia?.(stored.photo || base.photo || base.image) || '';
            const title = normalizeText(stored.title || base.title || getPlatformRoleLabel(entry.platformRole), getPlatformRoleLabel(entry.platformRole));
            const department = normalizeText(stored.department || departmentForFaculty(normalizedFaculty), departmentForFaculty(normalizedFaculty));
            const faculty = normalizeText(stored.faculty || humanizeFacultyName(normalizedFaculty), humanizeFacultyName(normalizedFaculty));
            const phone = normalizeText(stored.phone || base.phone || '', '');
            const office = normalizeText(stored.office || base.office || '', '');
            const subjects = unique([
                ...(Array.isArray(base.subjects) ? base.subjects : []),
                ...(Array.isArray(stored.subjects) ? stored.subjects : []),
                ...((Array.isArray(stored.courses) ? stored.courses : []).map((course) => normalizeText(course.code || '')))
            ]);
            const sessions = entry.platformRole === 'student_service' || typeof getProfSchedule !== 'function'
                ? []
                : (getProfSchedule(name) || []).filter(Boolean);
            const courses = Array.isArray(stored.courses) && stored.courses.length
                ? stored.courses
                : sessions.map((session) => ({
                    code: normalizeText(session.courseId || session.id || 'COURSE'),
                    name: normalizeText(session.name || session.courseId || 'Scheduled session'),
                    role: entry.platformRole === 'ta' ? 'Teaching Assistant' : 'Instructor',
                    semester: normalizeText(session.semester || 'Current semester', 'Current semester'),
                    section: normalizeText(session.group || session.name || session.id || 'Default', 'Default'),
                    hours: Math.round((parseInt(String(session.duration || '110min').match(/\d+/)?.[0] || '110', 10) / 60) * 10) / 10
                }));
            const scheduleSessions = Array.isArray(stored.scheduleSessions) && stored.scheduleSessions.length
                ? stored.scheduleSessions
                : sessions.map((session) => ({
                    courseId: normalizeText(session.courseId || session.id || 'COURSE', 'COURSE'),
                    sessionType: normalizeText(session.sessionType || session.classType || session.type || 'lecture', 'lecture'),
                    day: normalizeText(session.day || 'Mon', 'Mon'),
                    time: normalizeText(session.time || '09:00', '09:00'),
                    duration: normalizeText(session.duration || '110min', '110min'),
                    room: normalizeText(session.room || 'TBD', 'TBD'),
                    group: normalizeText(session.group || session.name || session.id || 'G1', 'G1'),
                    capacity: Math.max(1, Number(session.capacity || 30))
                }));
            const scheduledHours = Math.round((hoursMap[name] || hoursMap[nameEn] || 0) * 10) / 10;
            const maxHours = Number(stored.maxHours || base.maxHours || (entry.platformRole === 'ta' ? 8 : entry.platformRole === 'student_service' ? 40 : 15));
            const accountStatus = getAccountStatus(base, stored);
            const status = normalizeText(stored.status || base.status || 'Active', 'Active');
            const loadRatio = maxHours ? scheduledHours / maxHours : 0;
            return {
                id: String(entry.id || base.id || ''),
                platformRole: entry.platformRole,
                profileKey: PLATFORM_ROLE_META[entry.platformRole]?.profileKey || 'service',
                staffId: normalizeText(stored.staffId || base.staffId || String(entry.id || base.id || ''), String(entry.id || base.id || '')),
                name,
                nameEn,
                email: normalizeText(stored.email || base.email || '', ''),
                phone,
                photo,
                status,
                role: normalizeText(stored.role || title, title),
                title,
                rank: normalizeText(stored.rank || title, title),
                department,
                faculty,
                facultyCode: normalizedFaculty,
                employmentType: normalizeText(stored.employmentType || (entry.platformRole === 'student_service' ? 'Full-time' : 'Academic appointment'), entry.platformRole === 'student_service' ? 'Full-time' : 'Academic appointment'),
                campus: normalizeText(stored.campus || 'Main Campus', 'Main Campus'),
                office,
                visibility: normalizeText(stored.visibility || getVisibilityDefault(entry.platformRole), getVisibilityDefault(entry.platformRole)),
                bio: normalizeText(stored.bio || '', ''),
                expertise: Array.isArray(stored.expertise) ? stored.expertise : [],
                languages: Array.isArray(stored.languages) ? stored.languages : [],
                links: Array.isArray(stored.links) ? stored.links : [],
                courses,
                scheduleSessions,
                officeHours: Array.isArray(stored.officeHours) ? stored.officeHours : [],
                accountStatus,
                lmsRole: normalizeText(stored.lmsRole || PLATFORM_ROLE_META[entry.platformRole]?.lmsRole || 'Viewer', 'Viewer'),
                lastLogin: normalizeText(stored.lastLogin || base.lastLogin || '', ''),
                updatedAt: normalizeText(stored.updatedAt || base.updatedAt || todayIso(), todayIso()),
                createdBy: normalizeText(stored.createdBy || base.createdBy || 'Admin', 'Admin'),
                documents: Array.isArray(stored.documents) ? stored.documents : [],
                notes: normalizeText(stored.notes || '', ''),
                maxHours,
                joinYear: normalizeText(stored.joinYear || base.joinYear || new Date().getFullYear(), String(new Date().getFullYear())),
                subjects,
                loadRatio,
                scheduledHours,
                staffTypeId: stored.staffTypeId || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                    ? resolveStaffTypeIdFromPlatformRole(entry.platformRole)
                    : entry.platformRole),
                fieldValues: stored.fieldValues && typeof stored.fieldValues === 'object' ? stored.fieldValues : {},
                profile: profile
            };
        });
        return { records, unassignedSections, facultyProfile: profile };
    }

    function isTeachingRole(record) {
        if (!record) return false;
        return record.platformRole === 'professor'
            || record.platformRole === 'ta'
            || ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Teaching Assistant', 'Department Chair', 'Dean'].includes(record.role)
            || (record.courses || []).length > 0;
    }

    function profileCompleteness(record) {
        const typeId = record?.staffTypeId
            || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                ? resolveStaffTypeIdFromPlatformRole(record?.platformRole)
                : record?.platformRole || 'professor');
        if (typeof getAllStaffFormFields === 'function' && typeof computeStaffFormCompleteness === 'function') {
            const fields = getAllStaffFormFields(typeId);
            if (fields.length) {
                const values = record?.fieldValues && typeof record.fieldValues === 'object'
                    ? record.fieldValues
                    : (typeof hydrateFieldValuesFromRecord === 'function' ? hydrateFieldValuesFromRecord(record, typeId) : {});
                return computeStaffFormCompleteness(typeId, values);
            }
        }
        const checks = [
            { key: 'photo', label: 'profile photo', ok: Boolean(record.photo), weight: 10 },
            { key: 'basic', label: 'basic information', ok: Boolean(record.name && record.email && record.staffId), weight: 15 },
            { key: 'job', label: 'role and department', ok: Boolean(record.role && record.department && record.title), weight: 15 },
            { key: 'contact', label: 'contact information', ok: Boolean(record.email && record.phone && record.office), weight: 15 },
            { key: 'bio', label: 'biography', ok: Boolean(record.bio && record.bio.length > 25), weight: 15 },
            { key: 'expertise', label: 'expertise or languages', ok: Boolean((record.expertise || []).length || (record.languages || []).length), weight: 10 },
            { key: 'courses', label: 'course assignments', ok: !isTeachingRole(record) || (record.courses || []).length > 0, weight: 10 },
            { key: 'officeHours', label: 'office hours', ok: Boolean((record.officeHours || []).length), weight: 10 }
        ];
        const earned = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
        const missing = checks.filter((item) => !item.ok).map((item) => item.label);
        return { percent: earned, missing, checks };
    }

    function getStaffDirectoryModel(records) {
        return typeof buildStaffDirectoryFilterModel === 'function'
            ? buildStaffDirectoryFilterModel(records)
            : { blueprintFilters: [], staffTypes: [] };
    }

    function getDirectoryFilterHelpers() {
        return {
            normalizeSearch,
            profileCompleteness,
            isTeachingRole,
            getPlatformRoleLabel
        };
    }

    function getFilteredStaff(records) {
        const state = getStaffState();
        const model = getStaffDirectoryModel(records);
        const normalizedFilters = typeof normalizeStaffDirectoryFilters === 'function'
            ? normalizeStaffDirectoryFilters(state.filters, model)
            : state.filters;
        if (typeof applyStaffDirectoryFilters === 'function') {
            return applyStaffDirectoryFilters(records, normalizedFilters, model, getDirectoryFilterHelpers());
        }
        return records;
    }

    function activeSelection(records) {
        const state = getStaffState();
        return records.find((record) => record.id === state.selectedId) || null;
    }

    function setFilter(key, value) {
        const state = getStaffState();
        state.filters[key] = value;
        renderStaffPage();
    }

    function clearFilters() {
        const state = getStaffState();
        state.filters = cloneDefaultFilters();
        renderStaffPage();
        showToast('Staff filters cleared.');
    }

    function reviewMissingData() {
        const state = getStaffState();
        state.filters.profile = 'incomplete';
        state.filters.archive = 'active';
        state.filters.sort = 'completion';
        renderStaffPage();
        showToast('Showing incomplete active profiles.');
    }

    function resolveRecordTypeId(record) {
        return record?.staffTypeId
            || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                ? resolveStaffTypeIdFromPlatformRole(record?.platformRole)
                : 'professor');
    }

    function getRecordProfileSections(record) {
        const typeId = resolveRecordTypeId(record);
        if (typeof getStaffFormSchema !== 'function') return [];
        const schema = getStaffFormSchema(typeId);
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

    function selectStaff(id) {
        const state = getStaffState();
        state.selectedId = id;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const record = buildStaffRecords(facultyCode).records.find((item) => item.id === id) || null;
        state.profileTab = record ? defaultProfileTabForRecord(record) : null;
        window.location.hash = `profile/${encodeURIComponent(id)}`;
        renderStaffPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function backToDirectory() {
        const state = getStaffState();
        state.selectedId = null;
        state.profileTab = null;
        if (window.location.hash.startsWith('#profile/')) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
        renderStaffPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function renderStatusChip(value) {
        return KiuCommandCenterUtils.renderStatusChipHtml(value);
    }

    function applyStaffHubProgressBars(scope = document) {
        KiuCommandCenterUtils.applyHubProgressBars(scope);
    }

    function renderOverview(record) {
        return KiuCommandCenterUtils.renderOverviewSection(record, profileCompleteness(record));
    }

    function renderTeaching(record) {
        return KiuCommandCenterUtils.renderTeachingSection(record, isTeachingRole);
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
        const state = getStaffState();
        const canManage = state.viewRole === 'admin' && normalizeSearch(getCurrentUser?.()?.role || '') === 'admin';
        const completion = profileCompleteness(record);
        return `
            <div class="staff-hub-info-grid">
                ${infoCard('Platform role', getPlatformRoleLabel(record.platformRole))}
                ${infoCard('LMS role', record.lmsRole)}
                ${infoCard('Account status', record.accountStatus)}
                ${infoCard('Last login', record.lastLogin || 'Never logged in')}
                ${infoCard('Last updated', record.updatedAt || 'Unknown')}
                ${infoCard('Created by', record.createdBy || 'Unknown')}
                ${infoCard('Completion', `${completion.percent}%`)}
                ${infoCard('Internal notes', record.notes || 'No admin notes.', true)}
            </div>
            <section class="lux-panel staff-hub-info-card is-full lux-data-card" data-lux-glass-root="1">
                <span>Admin actions</span>
                <div class="staff-hub-inline-actions staff-hub-inline-actions--spaced">
                    <button class="lux-secondary-btn" type="button" data-staff-action="invite" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-paper-plane"></i> Send invitation</button>
                    <button class="lux-secondary-btn" type="button" data-staff-action="toggle-login" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-power-off"></i> Toggle login</button>
                    <button class="lux-secondary-btn" type="button" data-staff-action="mark-reviewed" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-clipboard-check"></i> Mark reviewed</button>
                    ${record.status === 'Archived'
                        ? `<button class="lux-primary-btn" type="button" data-staff-action="restore" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-box-open"></i> Restore</button>`
                        : `<button class="lux-secondary-btn" type="button" data-staff-action="archive" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-box-archive"></i> Archive</button>`}
                    <button class="lux-secondary-btn lux-danger-btn" type="button" data-staff-action="delete" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-user-slash"></i> Delete</button>
                </div>
                ${!canManage ? '<p class="staff-hub-section-copy staff-hub-section-copy--spaced">Switch to Admin preview with an active administrator session to use admin-only actions.</p>' : ''}
            </section>
        `;
    }

    function renderBlueprintProfile(record, activeSectionId = null) {
        return KiuCommandCenterUtils.renderBlueprintProfileHtml(
            record,
            activeSectionId,
            resolveRecordTypeId,
            typeof renderStaffBlueprintProfileView === 'function' ? renderStaffBlueprintProfileView : null
        );
    }

    function renderProfileTab(record) {
        const state = getStaffState();
        if (state.profileTab === 'admin' && state.viewRole === 'admin') return renderAdmin(record);
        const sections = getRecordProfileSections(record);
        const activeSectionId = resolveActiveProfileTab(state, sections);
        return renderBlueprintProfile(record, activeSectionId);
    }

    function renderProfile(record) {
        const state = getStaffState();
        const completion = profileCompleteness(record);
        const sections = getRecordProfileSections(record);
        const sectionTabs = sections.map((section) => [section.id, profileSectionTabLabel(section)]);
        const adminTabs = state.viewRole === 'admin' ? [['admin', 'Admin']] : [];
        const tabs = [...sectionTabs, ...adminTabs];
        const activeTab = resolveActiveProfileTab(state, sections);
        const tabsMarkup = tabs.length ? `
                <div class="staff-hub-tabs lux-tab-strip is-profile-tabs">
                    ${tabs.map(([key, label]) => `<button class="staff-hub-tab lux-tab-btn staff-hub-profile-tab${activeTab === key ? ' is-active' : ''}" type="button" aria-pressed="${activeTab === key ? 'true' : 'false'}" data-staff-action="tab" data-staff-tab="${escapeHtml(key)}">${escapeHtml(label)}</button>`).join('')}
                </div>` : '';
        return `
            <section class="lux-panel staff-hub-profile" data-lux-glass-root="1">
                <div class="staff-hub-toolbar">
                    <button class="lux-secondary-btn" type="button" data-staff-action="back"><i class="fas fa-arrow-left"></i> Back to staff directory</button>
                    <div class="staff-hub-toolbar-actions">
                        <button class="lux-primary-btn" type="button" data-staff-action="edit" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-pen"></i> Edit profile</button>
                        <button class="lux-secondary-btn" type="button" data-staff-action="message" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-envelope"></i> Message</button>
                        <button class="lux-secondary-btn" type="button" data-staff-action="invite" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-paper-plane"></i> Send invite</button>
                    </div>
                </div>
                <div class="staff-hub-profile-head">
                    <div class="staff-hub-profile-head-main">
                        <div class="staff-hub-profile-id">
                            <div class="staff-hub-avatar is-large">${record.photo ? `<img alt="" src="${escapeHtml(record.photo)}">` : escapeHtml(initials(record.name))}</div>
                            <div>
                                <div class="staff-hub-kicker">${escapeHtml(record.role)} · ${escapeHtml(record.staffId)}</div>
                                <h2>${escapeHtml(record.name)}</h2>
                                <p>${escapeHtml(record.title)} · ${escapeHtml(record.department)} · ${escapeHtml(record.faculty)}</p>
                                <div class="staff-hub-chips staff-hub-chips--spaced">${renderStatusChip(record.status)}${renderStatusChip(record.accountStatus)}${renderStatusChip(record.lmsRole)}</div>
                            </div>
                        </div>
                        ${renderProgress(completion.percent, `${completion.percent}% complete · updated ${escapeHtml(record.updatedAt || 'unknown')}`)}
                        <div class="staff-hub-toolbar-actions">
                            ${record.status === 'Archived'
                                ? `<button class="lux-primary-btn" type="button" data-staff-action="restore" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-open"></i> Restore</button>`
                                : `<button class="lux-secondary-btn" type="button" data-staff-action="archive" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-archive"></i> Archive</button>`}
                        </div>
                    </div>
                </div>
                ${tabsMarkup}
                <div class="staff-hub-profile-body">
                    ${renderProfileTab(record)}
                </div>
            </section>
        `;
    }

    function renderDirectory(records, facultyCode) {
        const state = getStaffState();
        const model = getStaffDirectoryModel(records);
        const visible = getFilteredStaff(records);
        const facultyLabel = facultyName(facultyCode);
        const currentUserRole = normalizeSearch(getCurrentUser?.()?.role || '');
        const isAdminSession = currentUserRole === 'admin';
        const viewRoleOptions = VIEW_ROLES.map((value) => `<option value="${value}" ${state.viewRole === value ? 'selected' : ''}>${value === 'admin' ? 'Admin Preview' : value === 'faculty' ? 'Faculty Preview' : 'Viewer Preview'}</option>`).join('');
        const directoryControlsMarkup = typeof renderStaffDirectoryControls === 'function'
            ? renderStaffDirectoryControls({
                filters: state.filters,
                model,
                visibleCount: visible.length,
                isAdminSession,
                escapeHtml,
                getPlatformRoleLabel,
                renderStaffTypeCreateButtons,
                helpers: getDirectoryFilterHelpers()
            })
            : '';

        const rows = visible.length ? visible.map((record) => {
                const completion = profileCompleteness(record);
            const selected = state.selectedId === record.id;
            const courseLabel = (record.courses || []).length
                ? `${record.courses.length} course${record.courses.length === 1 ? '' : 's'} · ${record.scheduledHours}h/week`
                : 'No course assignment';
            return `
                <tr class="${selected ? 'is-selected' : ''}">
                    <td>
                        <button class="staff-hub-row-button" type="button" data-staff-action="select" data-staff-id="${escapeHtml(record.id)}">
                            <div class="staff-hub-person">
                                <div class="staff-hub-avatar">${record.photo ? `<img alt="" src="${escapeHtml(record.photo)}">` : escapeHtml(initials(record.name))}</div>
                                <div>
                                    <div class="staff-hub-name">${escapeHtml(record.name)}</div>
                                    <div class="staff-hub-meta">${escapeHtml(record.title || record.email)}</div>
                                </div>
                            </div>
                        </button>
                    </td>
                    <td>${renderStatusChip(record.role)}<div class="staff-hub-meta">${escapeHtml(getPlatformRoleLabel(record.platformRole))}</div></td>
                    <td><strong>${escapeHtml(record.department)}</strong><div class="staff-hub-meta">${escapeHtml(record.faculty)}</div></td>
                    <td><strong>${escapeHtml(courseLabel)}</strong><div class="staff-hub-meta">${escapeHtml(record.courses?.[0]?.code || 'Assignment not required')}</div></td>
                    <td><strong>${escapeHtml(record.office || 'No office')}</strong><div class="staff-hub-meta">${(record.officeHours || []).length ? `${record.officeHours.length} availability entry` : 'No office hours'}</div></td>
                    <td>${renderStatusChip(record.status)}<div class="staff-hub-meta">${escapeHtml(record.accountStatus)}</div></td>
                    <td>
                        ${renderProgress(completion.percent, `${completion.percent}% · ${completion.missing.length ? `${completion.missing.length} missing` : 'complete'}`)}
                    </td>
                    <td>
                        <div class="staff-hub-inline-actions">
                            <button class="lux-primary-btn" type="button" data-staff-action="select" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-id-card"></i> View</button>
                            <button class="lux-secondary-btn" type="button" data-staff-action="edit" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-pen"></i> Edit</button>
                            ${record.status === 'Archived'
                                ? `<button class="lux-secondary-btn" type="button" data-staff-action="restore" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-open"></i> Restore</button>`
                                : `<button class="lux-secondary-btn" type="button" data-staff-action="archive" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-archive"></i> Archive</button>`}
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : `
            <div class="staff-hub-empty lux-empty-state">
                <i class="fas fa-users-slash fa-2x" aria-hidden="true"></i>
                <strong>${records.length ? 'No staff match these filters.' : 'No staff records yet.'}</strong>
                <span>${records.length ? 'Try clearing filters, searching another role, or including archived records.' : 'Start by registering your first staff account.'}</span>
                <div class="staff-hub-inline-actions">
                    ${records.length
                        ? '<button class="lux-secondary-btn" type="button" data-staff-action="clear-filters">Clear filters</button>'
                        : renderPrimaryCreateButton(state, 'Add staff')}
                </div>
            </div>
        `;

        return `
            <div class="lux-panel staff-hub-shell" data-lux-glass-root="1">


                <section class="lux-soft-chrome staff-hub-controls staff-admin-controls staff-hub-controls--adaptive">
                    ${directoryControlsMarkup}
                </section>

                <section class="lux-soft-chrome staff-hub-directory-panel">
                    <div class="staff-hub-directory-head">
                        <div>
                            <div class="staff-hub-overline">Staff directory</div>
                            <h2 class="staff-hub-section-title">Operational records</h2>
                            <p class="staff-hub-section-copy">Open full profile pages, review readiness, and act on account or staffing issues directly from the table.</p>
                        </div>
                        <div class="staff-hub-inline-actions">
                            <button class="lux-secondary-btn" type="button" data-staff-action="clear-filters"><i class="fas fa-filter-circle-xmark"></i> Clear filters</button>
                        </div>
                    </div>
                    <div class="staff-hub-workspace">
                        <div class="staff-hub-table-wrap lux-data-card">
                            ${visible.length ? `
                                <table class="staff-hub-table" aria-label="Staff directory">
                                    <thead>
                                        <tr>
                                            <th>Staff member</th>
                                            <th>Role</th>
                                            <th>Department</th>
                                            <th>Teaching</th>
                                            <th>Office</th>
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
            typeof getStaffFormTypes === 'function' ? getStaffFormTypes : null,
            'professor'
        );
    }

    function renderPrimaryCreateButton(state = getStaffState(), fallbackLabel = 'Add Staff Profile') {
        const typeId = state.formSettingsTypeId || 'professor';
        const type = typeof getStaffFormType === 'function' ? getStaffFormType(typeId) : null;
        return KiuCommandCenterUtils.renderHubPrimaryCreateButton(typeId, type?.label, fallbackLabel);
    }

    function refreshModalBody() {
        const state = getStaffState();
        if (!state.modalOpen) return;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        if (typeof ensureStaffFormBlueprint === 'function') ensureStaffFormBlueprint();
        const { records } = buildStaffRecords(facultyCode);
        renderModal(records, facultyCode);
    }

    function renderModal(records, facultyCode) {
        const root = document.getElementById('staff-command-modal-root');
        if (!root) return;
        const state = getStaffState();
        const editing = records.find((record) => record.id === state.editingId) || null;
        if (!state.modalOpen) {
            root.setAttribute('hidden', '');
            root.innerHTML = '';
            return;
        }
        const staffTypeId = state.modalStaffTypeId
            || (editing?.staffTypeId)
            || state.formSettingsTypeId
            || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                ? resolveStaffTypeIdFromPlatformRole(state.modalRole || editing?.platformRole || 'professor')
                : 'professor');
        const staffType = typeof getStaffFormType === 'function' ? getStaffFormType(staffTypeId) : null;
        if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
        const profile = editing || buildDraftRecord(facultyCode, staffType?.platformRole || state.modalRole || 'professor');
        if (typeof hydrateFieldValuesFromRecord === 'function') {
            profile.fieldValues = hydrateFieldValuesFromRecord(profile, staffTypeId);
        }
        const completion = profileCompleteness({ ...profile, staffTypeId });
        const bodyMarkup = typeof renderStaffFormFromBlueprint === 'function'
            ? renderStaffFormFromBlueprint(staffTypeId, profile)
            : '<div class="staff-hub-schema-empty lux-data-card"><strong>Form renderer unavailable</strong></div>';
        const schemaEmpty = typeof staffFormSchemaIsEmpty === 'function' && staffFormSchemaIsEmpty(staffTypeId);
        const touched = Boolean(state.modalTouched);
        const titleIcon = editing ? 'fa-user-pen' : 'fa-user-plus';
        root.removeAttribute('hidden');
        if (!root.hasAttribute('data-lux-transparency-exempt')) {
            root.setAttribute('data-lux-transparency-exempt', '1');
        }
        root.innerHTML = `
            <div class="staff-hub-modal-backdrop" data-staff-action="dismiss-modal">
                <form class="staff-hub-modal" id="staff-command-form" novalidate data-staff-type-id="${escapeHtml(staffTypeId)}">
                    <div class="staff-hub-modal-head">
                        <div class="staff-hub-modal-head-main">
                            <div class="staff-hub-modal-title-row">
                                <h2 class="staff-hub-modal-title"><i class="fas ${titleIcon}" aria-hidden="true"></i> ${editing ? 'Edit Staff Profile' : 'Add Staff Member'}</h2>
                                <span class="staff-hub-modal-type-pill">${escapeHtml(staffType?.label || 'Staff')}</span>
                            </div>
                            <p class="staff-hub-modal-copy">${editing
                                ? `Update this ${escapeHtml(staffType?.label || 'staff')} profile using your configured form sections.`
                                : `Create a new ${escapeHtml(staffType?.label || 'staff')} profile from the sections your administrators configured.`}</p>
                        </div>
                        <button class="lux-secondary-btn" type="button" data-staff-action="close-modal" aria-label="Close modal"><i class="fas fa-times" aria-hidden="true"></i> Close</button>
                    </div>
                    <div class="staff-hub-modal-body">
                        ${bodyMarkup}
                    </div>
                    <div class="staff-hub-modal-foot">
                        ${renderModalStatus(completion, touched)}
                        <div class="staff-hub-modal-actions">
                            <button class="lux-secondary-btn" type="button" data-staff-action="close-modal">Cancel</button>
                            <button class="lux-secondary-btn" type="button" data-staff-action="check-required-fields"><i class="fas fa-list-check" aria-hidden="true"></i> Check required fields</button>
                            <button class="lux-primary-btn" type="submit" ${schemaEmpty ? 'disabled' : ''}><i class="fas fa-check" aria-hidden="true"></i> ${editing ? 'Save Staff Profile' : 'Create Staff Profile'}</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
        const hubBackdrop = root.querySelector('.staff-hub-modal-backdrop');
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

    function buildDraftRecord(facultyCode, platformRole) {
        const faculty = humanizeFacultyName(facultyCode);
        const staffTypeId = typeof resolveStaffTypeIdFromPlatformRole === 'function'
            ? resolveStaffTypeIdFromPlatformRole(platformRole || 'professor')
            : (platformRole || 'professor');
        return {
            id: '',
            staffTypeId,
            fieldValues: {},
            platformRole: platformRole || 'professor',
            profileKey: PLATFORM_ROLE_META[platformRole || 'professor']?.profileKey || 'professors',
            staffId: nextStaffNumber(),
            name: '',
            nameEn: '',
            email: '',
            phone: '',
            photo: '',
            status: 'Active',
            role: roleTitleOptions(platformRole || 'professor')[0],
            title: roleTitleOptions(platformRole || 'professor')[0],
            rank: roleTitleOptions(platformRole || 'professor')[0],
            department: departmentForFaculty(facultyCode),
            faculty,
            facultyCode,
            employmentType: platformRole === 'student_service' ? 'Full-time' : 'Academic appointment',
            campus: 'Main Campus',
            office: '',
            visibility: getVisibilityDefault(platformRole || 'professor'),
            bio: '',
            expertise: [],
            languages: [],
            links: [],
            courses: [],
            scheduleSessions: [],
            officeHours: [],
            accountStatus: 'Not Invited',
            lmsRole: PLATFORM_ROLE_META[platformRole || 'professor']?.lmsRole || 'Instructor',
            lastLogin: '',
            updatedAt: todayIso(),
            createdBy: normalizeText(getCurrentUser?.()?.name || getCurrentUser?.()?.email || 'Admin', 'Admin'),
            documents: [],
            notes: '',
            maxHours: platformRole === 'ta' ? 8 : platformRole === 'student_service' ? 40 : 15,
            joinYear: String(new Date().getFullYear()),
            subjects: []
        };
    }

    function nextStaffNumber() {
        const store = ensureStore();
        const numbers = Object.values(store).map((entry) => Number(String(entry.staffId || '').match(/(\d+)$/)?.[1] || 0));
        const next = Math.max(0, ...numbers) + 1;
        return `STF-${new Date().getFullYear()}-${String(next).padStart(3, '0')}`;
    }

    function nextUserId(platformRole, facultyCode) {
        const normalizedFaculty = typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(facultyCode, 'ECON')
            : (facultyCode || 'ECON');
        const prefix = platformRole === 'ta' ? 'TA' : platformRole === 'student_service' ? 'SVC' : 'P';
        return `${prefix}-${normalizedFaculty}-${Date.now()}`;
    }

    function clearFormErrors() {
        KiuCommandCenterUtils.clearFormErrors();
    }

    function markInvalid(id) {
        KiuCommandCenterUtils.markInvalid(id);
    }

    function buildFormRecord(soft = false) {
        const state = getStaffState();
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const staffTypeId = state.modalStaffTypeId
            || document.getElementById('staff-command-form')?.dataset?.staffTypeId
            || 'professor';
        const staffType = typeof getStaffFormType === 'function' ? getStaffFormType(staffTypeId) : null;
        const platformRole = staffType?.platformRole || state.modalRole || 'professor';
        const currentRecords = buildStaffRecords(facultyCode).records;
        const editing = currentRecords.find((record) => record.id === state.editingId) || null;
        const values = typeof collectStaffFormValues === 'function' ? collectStaffFormValues(staffTypeId) : {};
        const staffId = normalizeText(values.staff_id || editing?.staffId || '', '');
        const email = resolveStaffRegistrationEmail(values, editing);
        const existingUser = typeof window.findDuplicateEmailUser === 'function'
            ? window.findDuplicateEmailUser(KIU_STATE.users || [], email, editing?.id || '')
            : null;

        if (!soft) {
            if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
            else clearFormErrors();
            const errors = typeof validateStaffFormValues === 'function'
                ? validateStaffFormValues(staffTypeId, values, false)
                : [];
            if (existingUser) {
                const emailField = errors.find((item) => item.key === 'institutional_email') || { fieldId: '', key: 'institutional_email' };
                if (typeof markStaffFormInvalid === 'function') markStaffFormInvalid(emailField.fieldId || 'institutional_email');
            }
            errors.forEach((error) => {
                if (typeof markStaffFormInvalid === 'function') markStaffFormInvalid(error.fieldId);
            });
            if (errors.length || existingUser) {
                const state = getStaffState();
                state.modalTouched = true;
                refreshModalCompleteness();
                scrollToFirstInvalidField();
                showToast(existingUser ? 'This email already exists in the KIU directory.' : 'Please fix required fields before saving.');
                return null;
            }
            if (typeof staffFormSchemaIsEmpty === 'function' && staffFormSchemaIsEmpty(staffTypeId)) {
                showToast('Configure the staff form blueprint before creating profiles.');
                return null;
            }
        }

        const draft = editing || buildDraftRecord(facultyCode, platformRole);
        const actualFacultyCode = draft.facultyCode || facultyCode;
        const mapped = typeof mapFieldValuesToLegacyRecord === 'function'
            ? mapFieldValuesToLegacyRecord(staffTypeId, values, {
                ...draft,
                id: editing?.id || nextUserId(platformRole, actualFacultyCode),
                staffId: normalizeText(values.staff_id || editing?.staffId || nextStaffNumber(), nextStaffNumber()),
                facultyCode: actualFacultyCode,
                faculty: draft.faculty || humanizeFacultyName(actualFacultyCode),
                department: normalizeText(values.department || draft.department || departmentForFaculty(actualFacultyCode), departmentForFaculty(actualFacultyCode)),
                accountStatus: normalizeText(values.lms_account_status || draft.accountStatus || 'Not Invited', 'Not Invited'),
                lmsRole: normalizeText(values.lms_permission_role || draft.lmsRole || PLATFORM_ROLE_META[platformRole]?.lmsRole || 'Viewer', 'Viewer'),
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
        Object.keys(KIU_STATE.facultyProfiles).forEach((code) => {
            const profile = KIU_STATE.facultyProfiles[code];
            if (!profile) return;
            profile.professors = (profile.professors || []).filter((member) => String(member?.id || '') !== String(nextRecord.id));
            profile.tas = (profile.tas || []).filter((member) => String(member?.id || '') !== String(nextRecord.id));
        });
        if (nextRecord.platformRole === 'student_service') return;
        const targetKey = nextRecord.platformRole === 'ta' ? 'tas' : 'professors';
        KIU_STATE.facultyProfiles[nextRecord.facultyCode][targetKey].push({
            id: nextRecord.id,
            staffId: nextRecord.staffId,
            name: nextRecord.name,
            nameEn: nextRecord.nameEn,
            email: nextRecord.email,
            title: nextRecord.title,
            office: nextRecord.office,
            phone: nextRecord.phone,
            joinYear: nextRecord.joinYear,
            maxHours: nextRecord.maxHours,
            subjects: nextRecord.subjects,
            status: nextRecord.status,
            photo: nextRecord.photo
        });
    }

    function upsertUserRecord(nextRecord, existingUser) {
        return KiuCommandCenterUtils.upsertUserRecord(nextRecord, existingUser);
    }

    function syncScheduleSessions(nextRecord) {
        return KiuCommandCenterUtils.syncScheduleSessions(nextRecord);
    }

    function persistRecord(nextRecord) {
        const store = ensureStore();
        const current = buildStaffRecords(nextRecord.facultyCode).records.find((record) => record.id === nextRecord.id) || null;
        const existingUser = (KIU_STATE.users || []).find((user) => String(user?.id || '') === String(nextRecord.id)) || null;
        upsertUserRecord(nextRecord, existingUser);
        upsertFacultyMirror(nextRecord);
        store[nextRecord.id] = {
            id: nextRecord.id,
            staffId: nextRecord.staffId,
            name: nextRecord.name,
            nameEn: nextRecord.nameEn,
            email: nextRecord.email,
            phone: nextRecord.phone,
            photo: nextRecord.photo,
            status: nextRecord.status,
            role: nextRecord.role,
            title: nextRecord.title,
            rank: nextRecord.rank,
            department: nextRecord.department,
            faculty: nextRecord.faculty,
            facultyCode: nextRecord.facultyCode,
            employmentType: nextRecord.employmentType,
            campus: nextRecord.campus,
            office: nextRecord.office,
            visibility: nextRecord.visibility,
            bio: nextRecord.bio,
            expertise: nextRecord.expertise,
            languages: nextRecord.languages,
            links: nextRecord.links,
            courses: nextRecord.courses,
            scheduleSessions: nextRecord.scheduleSessions,
            officeHours: nextRecord.officeHours,
            accountStatus: nextRecord.accountStatus,
            lmsRole: nextRecord.lmsRole,
            lastLogin: nextRecord.lastLogin,
            updatedAt: nextRecord.updatedAt,
            createdBy: nextRecord.createdBy,
            documents: nextRecord.documents,
            notes: nextRecord.notes,
            maxHours: nextRecord.maxHours,
            joinYear: nextRecord.joinYear,
            subjects: nextRecord.subjects,
            staffTypeId: nextRecord.staffTypeId,
            fieldValues: nextRecord.fieldValues || {}
        };
        syncGroupsForStaff(nextRecord, current);
        syncScheduleSessions(nextRecord);
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
            persistPortalStateToBackend(existingUser ? 'update-staff-command-center' : 'create-staff-command-center').catch(() => null);
        }
        return nextRecord;
    }

    function archiveStaff(id) {
        KiuCommandCenterUtils.setRecordArchiveStatus(id, ensureRecordEntry, renderStaffPage, 'Archived', 'Staff member');
    }

    function restoreStaff(id) {
        KiuCommandCenterUtils.setRecordArchiveStatus(id, ensureRecordEntry, renderStaffPage, 'Active', 'Staff member');
    }

    function inviteStaff(id) {
        KiuCommandCenterUtils.inviteRecord(id, ensureRecordEntry, renderStaffPage);
    }

    function toggleLogin(id) {
        KiuCommandCenterUtils.toggleLoginStatus(id, ensureRecordEntry, renderStaffPage);
    }

    function markReviewed(id) {
        KiuCommandCenterUtils.markRecordReviewed(id, ensureRecordEntry, renderStaffPage);
    }

    function deleteStaff(id) {
        const records = buildStaffRecords(typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON').records;
        const record = records.find((item) => item.id === id);
        if (!record) return;
        if (!window.confirm(`Delete ${record.name}? This removes the staff account from the faculty directory.`)) return;
        if (typeof window.removeStaffMember === 'function') {
            window.removeStaffMember(id, record.profileKey);
        }
        const store = ensureStore();
        delete store[id];
        const state = getStaffState();
        if (state.selectedId === id) state.selectedId = null;
        if (typeof saveState === 'function') saveState();
        renderStaffPage();
        showToast(`${record.name} removed from the staff directory.`);
    }

    function exportJson() {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = buildStaffRecords(facultyCode).records;
        KiuCommandCenterUtils.exportDirectoryJson(records, facultyCode, 'Staff');
    }

    function exportCsv() {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = getFilteredStaff(buildStaffRecords(facultyCode).records);
        KiuCommandCenterUtils.exportDirectoryCsv(
            records,
            facultyCode,
            'Staff',
            getPlatformRoleLabel,
            profileCompleteness
        );
    }

    function importJson(file) {
        KiuCommandCenterUtils.importDirectoryJson(file, {
            defaultRole: 'professor',
            buildDraft: buildDraftRecord,
            persist: persistRecord,
            onDone: () => renderStaffPage(),
            successToast: 'Staff directory imported.',
            failToast: 'Import failed. Please choose a valid staff JSON export.'
        });
    }

    function openModal(id = null, staffTypeId = null) {
        const state = getStaffState();
        if (typeof ensureStaffFormBlueprint === 'function') ensureStaffFormBlueprint();
        if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
        state.editingId = id;
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const editing = id ? buildStaffRecords(facultyCode).records.find((record) => record.id === id) : null;
        state.modalStaffTypeId = staffTypeId
            || editing?.staffTypeId
            || state.formSettingsTypeId
            || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                ? resolveStaffTypeIdFromPlatformRole(editing?.platformRole || state.modalRole || 'professor')
                : 'professor');
        state.modalRole = typeof getStaffFormType === 'function'
            ? (getStaffFormType(state.modalStaffTypeId)?.platformRole || 'professor')
            : (editing?.platformRole || staffTypeId || 'professor');
        state.modalOpen = true;
        state.modalTouched = false;
        if (typeof getStaffFormBlueprint === 'function') {
            state.blueprintSeenAt = getStaffFormBlueprint().updatedAt || null;
        }
        renderStaffPage();
        window.setTimeout(() => {
            document.querySelector('#staff-command-modal-root [data-staff-blueprint-field]')?.focus();
        }, 0);
    }

    function closeModal() {
        const state = getStaffState();
        state.modalOpen = false;
        state.modalTouched = false;
        state.editingId = null;
        state.modalRole = 'professor';
        state.modalStaffTypeId = 'professor';
        const root = document.getElementById('staff-command-modal-root');
        if (root && typeof window.closeLuxHubModalRoot === 'function') {
            window.closeLuxHubModalRoot(root);
            return;
        }
        renderModal([], typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
    }


    let __formBuilderRuntimePromise = null;
    function ensureFormBuilderRuntime() {
        if (typeof window.renderStaffFormSettings === 'function' || typeof window.bindStaffFormBuilderEvents === 'function') {
            return Promise.resolve(true);
        }
        if (__formBuilderRuntimePromise) return __formBuilderRuntimePromise;
        const urls = [
            'assets/js/pages/form-builder-actions-runtime.js?v=20260720-fbact1',
            'assets/js/pages/form-builder-runtime.js?v=20260720-fbact1'
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

    function openFormSettings(typeId = null) {
        const run = () => KiuCommandCenterUtils.openFormSettingsWorkspace({
            getState: getStaffState,
            renderPage: renderStaffPage,
            closeModal,
            defaultTypeId: 'professor',
            typeId
        });
        if (typeof window.renderStaffFormSettings === 'function') {
            run();
            return;
        }
        ensureFormBuilderRuntime().then((ok) => {
            if (!ok) {
                showToast('Form studio failed to load. Refresh and try again.');
                return;
            }
            run();
        });
    }

    function backToDirectoryWorkspace() {
        const state = getStaffState();
        if (state.modalOpen) closeModal();
        state.workspace = 'directory';
        state.builderPanel = null;
        renderStaffPage();
    }

    function getStaffBuilderCallbacks() {
        return {
            getState: getStaffState,
            setState: (patch) => {
                const next = patch || {};
                const state = getStaffState();
                Object.assign(state, next);
                if (next.selectedTypeId) state.formSettingsTypeId = next.selectedTypeId;
            },
            onRefresh: () => {
                const state = getStaffState();
                if (state.workspace === 'form-settings'
                    && typeof window.patchStaffFormStudioCanvas === 'function') {
                    const patched = window.patchStaffFormStudioCanvas(state, getStaffBuilderCallbacks());
                    if (patched) {
                        const container = document.getElementById('staff-content');
                        if (container) applyStaffHubProgressBars(container);
                        if (typeof queueLuxuryTransparencyRefresh === 'function') {
                            const formSettings = container?.querySelector('.staff-hub-form-settings');
                            queueLuxuryTransparencyRefresh(undefined, {
                                roots: formSettings ? [formSettings] : undefined
                            });
                        }
                        return;
                    }
                }
                renderStaffPage();
            },
            onBlueprintSaved: (typeId) => {
                const state = getStaffState();
                if (typeId) state.formSettingsTypeId = typeId;
                if (state.modalOpen && state.modalStaffTypeId === typeId) refreshModalBody();
            },
            onToast: (message) => showToast(message)
        };
    }

    function markModalTouched() {
        const state = getStaffState();
        if (!state.modalTouched) {
            state.modalTouched = true;
        }
    }

    function scrollToFirstInvalidField() {
        return KiuCommandCenterUtils.scrollToFirstInvalidField();
    }

    function refreshModalCompleteness() {
        const state = getStaffState();
        const next = buildFormRecord(true);
        if (!next) return;
        KiuCommandCenterUtils.applyModalCompletenessUI(
            profileCompleteness(next),
            next.fieldValues || {},
            Boolean(state.modalTouched)
        );
    }

    function checkRequiredFields() {
        const state = getStaffState();
        state.modalTouched = true;
        const staffTypeId = state.modalStaffTypeId
            || document.getElementById('staff-command-form')?.dataset?.staffTypeId
            || 'professor';
        if (typeof clearStaffFormErrors === 'function') clearStaffFormErrors();
        else clearFormErrors();
        const values = typeof collectStaffFormValues === 'function' ? collectStaffFormValues(staffTypeId) : {};
        const errors = typeof validateStaffFormValues === 'function'
            ? validateStaffFormValues(staffTypeId, values, false)
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

    function applyHashRoute() {
        const state = getStaffState();
        const match = window.location.hash.match(/^#profile\/(.+)$/);
        if (!match) {
            state.selectedId = null;
            renderStaffPage();
            return;
        }
        const id = decodeURIComponent(match[1]);
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = buildStaffRecords(facultyCode).records;
        if (records.some((record) => record.id === id)) {
            state.selectedId = id;
            state.profileTab = defaultProfileTabForRecord(records.find((record) => record.id === id));
        } else {
            state.selectedId = null;
            history.replaceState('', document.title, window.location.pathname + window.location.search);
            showToast('Profile not found. Returning to staff directory.');
        }
        renderStaffPage();
    }

    function submitForm(event) {
        event.preventDefault();
        const next = buildFormRecord(false);
        if (!next) return;
        const wasEditing = Boolean(getStaffState().editingId);
        persistRecord(next);
        const state = getStaffState();
        state.selectedId = next.id;
        state.profileTab = defaultProfileTabForRecord(next);
        closeModal();
        renderStaffPage();
        showToast(`${next.name} ${wasEditing ? 'updated' : 'added'}.`);
    }

    function handleAction(action, element) {
        const staffId = element?.dataset?.staffId || '';
        if (action === 'open-create') {
            const staffTypeId = element?.dataset?.staffTypeId
                || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                    ? resolveStaffTypeIdFromPlatformRole(element?.dataset?.staffRole || 'professor')
                    : 'professor');
            openModal(null, staffTypeId);
            return;
        }
        if (action === 'open-form-settings') {
            const settingsState = getStaffState();
            openFormSettings(element?.dataset?.staffTypeId
                || settingsState.modalStaffTypeId
                || settingsState.formSettingsTypeId
                || null);
            return;
        }
        if (action === 'clear-filters') {
            clearFilters();
            return;
        }
        if (action === 'clear-filter-chip') {
            const state = getStaffState();
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
            } else if (key === 'platform') {
                state.filters.platform = 'all';
            } else if (key === 'profile') {
                state.filters.profile = 'all';
            } else if (key === 'teaching') {
                state.filters.teaching = 'all';
            } else if (key === 'archive') {
                state.filters.archive = 'active';
            } else if (key === 'sort') {
                state.filters.sort = 'name';
            }
            renderStaffPage();
            return;
        }
        if (action === 'review-missing') {
            reviewMissingData();
            return;
        }
        if (action === 'select') {
            selectStaff(staffId);
            return;
        }
        if (action === 'back') {
            backToDirectory();
            return;
        }
        if (action === 'edit') {
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const records = buildStaffRecords(facultyCode).records;
            const record = records.find((item) => item.id === staffId);
            openModal(staffId, record?.staffTypeId || (typeof resolveStaffTypeIdFromPlatformRole === 'function'
                ? resolveStaffTypeIdFromPlatformRole(record?.platformRole || 'professor')
                : 'professor'));
            return;
        }
        if (action === 'archive') {
            archiveStaff(staffId);
            return;
        }
        if (action === 'restore') {
            restoreStaff(staffId);
            return;
        }
        if (action === 'invite') {
            inviteStaff(staffId);
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
            deleteStaff(staffId);
            return;
        }
        if (action === 'tab') {
            const state = getStaffState();
            state.profileTab = element.dataset.staffTab || null;
            renderStaffPage();
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
            const state = getStaffState();
            const view = element?.dataset?.staffView || 'all';
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const { records } = buildStaffRecords(facultyCode);
            const model = getStaffDirectoryModel(records);
            if (typeof resolveStaffSavedViewFilters === 'function') {
                const resolved = resolveStaffSavedViewFilters(view, model);
                if (view === 'all') {
                    state.filters = typeof normalizeStaffDirectoryFilters === 'function'
                        ? normalizeStaffDirectoryFilters(resolved, model)
                        : { ...cloneDefaultFilters(), ...resolved, field: { ...(resolved.field || {}) } };
                } else {
                    const merged = {
                        ...state.filters,
                        ...resolved,
                        field: { ...(state.filters.field || {}), ...(resolved.field || {}) }
                    };
                    state.filters = typeof normalizeStaffDirectoryFilters === 'function'
                        ? normalizeStaffDirectoryFilters(merged, model)
                        : merged;
                }
            } else if (view === 'all') {
                state.filters = cloneDefaultFilters();
            }
            renderStaffPage();
            return;
        }
        if (action === 'message') {
            showToast('Messaging requires LMS or email integration.');
        }
    }

    function bindEvents() {
        if (window.__staffCommandBound) return;
        window.__staffCommandBound = true;
        if (typeof bindStaffFormBuilderEvents === 'function') {
            bindStaffFormBuilderEvents({
                ...getStaffBuilderCallbacks(),
                onBackDirectory: () => backToDirectoryWorkspace()
            });
        }

        document.addEventListener('click', (event) => {
            const actionEl = event.target.closest('[data-staff-action]');
            if (!actionEl) return;
            if (actionEl.dataset.staffAction === 'dismiss-modal' && event.target !== actionEl) return;
            event.preventDefault();
            handleAction(actionEl.dataset.staffAction, actionEl);
        });

        document.addEventListener('input', (event) => {
            if (event.target.id === 'staff-search' || event.target.id === 'staff-global-search') {
                setFilter('query', event.target.value);
                return;
            }
            if (event.target.id === 'staff-droplist-search') {
                setFilter('droplistQuery', event.target.value);
                if (typeof window.applyStaffDirectoryDroplistFieldVisibility === 'function') {
                    window.applyStaffDirectoryDroplistFieldVisibility(event.target.value);
                }
                return;
            }
            if (event.target.closest('#staff-command-modal-root')) {
                markModalTouched();
                refreshModalCompleteness();
            }
        });

        document.addEventListener('change', (event) => {
            if (event.target.matches('[data-staff-directory-filter]')) {
                const kind = event.target.dataset.filterKind || 'system';
                const key = event.target.dataset.filterKey || '';
                const value = event.target.value;
                const state = getStaffState();
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
                renderStaffPage();
                return;
            }
            if (event.target.id === 'staff-view-role') {
                const state = getStaffState();
                state.viewRole = event.target.value;
                renderStaffPage();
                showToast(`${event.target.options[event.target.selectedIndex].text} enabled.`);
                return;
            }
            if (event.target.id === 'staff-import-file') {
                importJson(event.target.files?.[0]);
                event.target.value = '';
                return;
            }
            if (event.target.closest('#staff-command-modal-root')) {
                markModalTouched();
                refreshModalCompleteness();
            }
        });

        document.addEventListener('submit', (event) => {
            if (event.target.id === 'staff-command-form') {
                submitForm(event);
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && getStaffState().modalOpen) {
                closeModal();
            }
        });

        window.addEventListener('hashchange', applyHashRoute);
    }

    function renderStaffPage() {
        if (typeof ensureStaffFormBlueprint === 'function') ensureStaffFormBlueprint();
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const { records } = buildStaffRecords(facultyCode);
        const container = document.getElementById('staff-content');
        if (!container) return;
        container.classList.add('staff-command-root');
        const state = getStaffState();
        const selected = activeSelection(records);
        if (state.workspace === 'form-settings' && typeof renderStaffFormSettings === 'function') {
            container.innerHTML = renderStaffFormSettings({
                ...state,
                selectedTypeId: state.formSettingsTypeId || state.selectedTypeId || 'professor'
            }, getStaffBuilderCallbacks());
            if (typeof window.enhanceUniversalPickers === 'function') {
                const formSettingsWorkspace = container.querySelector('.staff-hub-form-settings');
                if (formSettingsWorkspace) window.enhanceUniversalPickers(formSettingsWorkspace);
            }
            if (state.sectionNameFocusId && typeof focusSectionCatalogTitle === 'function') {
                focusSectionCatalogTitle(container, state.sectionNameFocusId, getStaffBuilderCallbacks());
            }
        } else {
            container.innerHTML = selected ? renderProfile(selected) : renderDirectory(records, facultyCode);
            if (!selected && typeof window.enhanceUniversalPickers === 'function') {
                const directoryWorkspace = container.querySelector('.staff-hub-shell');
                if (directoryWorkspace) window.enhanceUniversalPickers(directoryWorkspace);
            }
            if (!selected && typeof window.applyStaffDirectoryDroplistFieldVisibility === 'function') {
                window.applyStaffDirectoryDroplistFieldVisibility(state.filters?.droplistQuery || '');
            }
        }
        applyStaffHubProgressBars(container);
        renderModal(records, facultyCode);
        if (typeof queueEnglishLocalization === 'function') {
            queueEnglishLocalization(container);
            const modalRoot = document.getElementById('staff-command-modal-root');
            if (modalRoot && !modalRoot.hasAttribute('hidden')) {
                queueEnglishLocalization(modalRoot);
            }
        }
        if (typeof queueLuxuryTransparencyRefresh === 'function') {
            const transparencyRoots = state.workspace === 'form-settings'
                ? [container.querySelector('.staff-hub-form-settings')].filter(Boolean)
                : undefined;
            queueLuxuryTransparencyRefresh(undefined, { roots: transparencyRoots });
        }
        if (document.documentElement?.classList.contains('kiu-shell-loading')) {
            document.documentElement.classList.remove('kiu-shell-loading');
        }
        document.body?.classList.remove('kiu-shell-loading');
    }

    function consumePendingAdminAccountFlow() {
        const pending = localStorage.getItem(FLOW_KEY);
        if (!pending) return;
        const staffTypeId = typeof resolveStaffTypeIdFromPlatformRole === 'function'
            ? resolveStaffTypeIdFromPlatformRole(pending)
            : pending;
        if (staffTypeId) {
            localStorage.removeItem(FLOW_KEY);
            openModal(null, staffTypeId);
        }
    }

    function openProfRegistration(role) {
        const staffTypeId = typeof resolveStaffTypeIdFromPlatformRole === 'function'
            ? resolveStaffTypeIdFromPlatformRole(role || 'professor')
            : (role || 'professor');
        openModal(null, staffTypeId);
    }

    function staffTabSwitch(tab) {
        const roleMap = {
            professors: 'professor',
            tas: 'ta',
            service: 'student_service',
            all: 'all'
        };
        setFilter('platform', roleMap[tab] || 'all');
    }

    window.renderStaffPage = renderStaffPage;
    window.openProfRegistration = openProfRegistration;
    window.consumePendingAdminAccountFlow = consumePendingAdminAccountFlow;
    window.staffTabSwitch = staffTabSwitch;
    window.openStaffModal = openProfRegistration;

    bindEvents();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            consumePendingAdminAccountFlow();
            if (window.location.hash.startsWith('#profile/')) {
                applyHashRoute();
            }
            renderStaffPage();
        }, { once: true });
    } else {
        consumePendingAdminAccountFlow();
        renderStaffPage();
    }
})();
