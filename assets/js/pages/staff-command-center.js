(function initStaffCommandCenter() {
    'use strict';

    const FLOW_KEY = 'KIU_PENDING_ADMIN_ACCOUNT_FLOW';
    const STORE_KEY = 'staffDirectoryRecords';
    const DIRECTORIES_SCRIPT_URL = 'assets/js/pages/directories.js?v=20260510-staff-admin3';
    const DEFAULT_FILTERS = {
        query: '',
        platform: 'all',
        role: 'all',
        department: 'all',
        status: 'all',
        account: 'all',
        profile: 'all',
        teaching: 'all',
        archive: 'active',
        sort: 'name'
    };
    const VIEW_ROLES = ['admin', 'faculty', 'viewer'];
    const PLATFORM_ROLE_META = {
        professor: { profileKey: 'professors', label: 'Professor', lmsRole: 'Instructor' },
        ta: { profileKey: 'tas', label: 'Teaching Assistant', lmsRole: 'Teaching Assistant' },
        student_service: { profileKey: 'service', label: 'Student Service', lmsRole: 'Support Agent' }
    };
    let directoriesScriptPromise = null;

    function getStaffState() {
        if (!window.__staffCommandState) {
            window.__staffCommandState = {
                selectedId: null,
                profileTab: 'overview',
                editingId: null,
                modalRole: 'professor',
                viewRole: 'admin',
                filters: { ...DEFAULT_FILTERS }
            };
        }
        return window.__staffCommandState;
    }

    function ensureStore() {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!KIU_STATE[STORE_KEY] || typeof KIU_STATE[STORE_KEY] !== 'object') {
            KIU_STATE[STORE_KEY] = {};
        }
        if (!KIU_STATE.users) KIU_STATE.users = [];
        if (!KIU_STATE.facultyProfiles) KIU_STATE.facultyProfiles = {};
        return KIU_STATE[STORE_KEY];
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

    function initials(name) {
        return normalizeText(name, 'Staff')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join('');
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
        Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
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
            subjects: record.subjects
        };
        return store[id];
    }

    function getAccountStatus(user, stored) {
        if (stored?.accountStatus) return stored.accountStatus;
        const email = normalizeSearch(user?.email);
        if (!email) return 'Needs Review';
        return email.includes('@kiu.edu.ge') || email.includes('@student.kiu.edu.ge')
            ? 'Account Active'
            : 'Needs Review';
    }

    function getPlatformRoleLabel(platformRole) {
        return PLATFORM_ROLE_META[platformRole]?.label || 'Staff';
    }

    function getVisibilityDefault(platformRole) {
        return platformRole === 'student_service' ? 'Visible to staff only' : 'Public to students';
    }

    function humanizeFacultyName(code) {
        const label = facultyName(code);
        return /^School of /i.test(label) ? label : `School of ${label}`;
    }

    function hasDirectoryProfileBridge() {
        return typeof openProfilePage === 'function';
    }

    function ensureDirectoryProfileBridge() {
        if (hasDirectoryProfileBridge()) return Promise.resolve(true);
        if (directoriesScriptPromise) return directoriesScriptPromise;
        directoriesScriptPromise = new Promise((resolve, reject) => {
            const existing = document.querySelector(`script[src="${DIRECTORIES_SCRIPT_URL}"]`);
            const onLoad = () => hasDirectoryProfileBridge()
                ? resolve(true)
                : reject(new Error('Staff directory profile bridge did not register openProfilePage.'));
            if (existing) {
                if (hasDirectoryProfileBridge()) {
                    resolve(true);
                    return;
                }
                existing.addEventListener('load', onLoad, { once: true });
                existing.addEventListener('error', () => reject(new Error('Staff directory profile bridge failed to load.')), { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = DIRECTORIES_SCRIPT_URL;
            script.defer = true;
            script.addEventListener('load', onLoad, { once: true });
            script.addEventListener('error', () => reject(new Error('Staff directory profile bridge failed to load.')), { once: true });
            document.head.appendChild(script);
        }).catch((error) => {
            console.error('Failed to load deferred staff directory bridge.', error);
            throw error;
        }).finally(() => {
            directoriesScriptPromise = null;
        });
        return directoriesScriptPromise;
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
            if (!['professor', 'ta', 'student_service'].includes(platformRole)) return;
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

    function completionTone(percent) {
        if (percent >= 85) return 'is-success';
        if (percent >= 65) return 'is-warning';
        return 'is-danger';
    }

    function statusTone(value) {
        const normalized = normalizeSearch(value || '');
        if (normalized.includes('active')) return 'is-success';
        if (normalized.includes('pending') || normalized.includes('review') || normalized.includes('invitation')) return 'is-warning';
        if (normalized.includes('archived') || normalized.includes('disabled') || normalized.includes('inactive') || normalized.includes('suspended')) return 'is-danger';
        return '';
    }

    function platformCounts(records) {
        return {
            total: records.length,
            teaching: records.filter(isTeachingRole).length,
            incomplete: records.filter((record) => profileCompleteness(record).percent < 85 && record.status !== 'Archived').length,
            pending: records.filter((record) => ['Not Invited', 'Invitation Sent', 'Needs Review', 'Login Disabled'].includes(record.accountStatus) && record.status !== 'Archived').length,
            noOfficeHours: records.filter((record) => !(record.officeHours || []).length && record.status !== 'Archived').length,
            archived: records.filter((record) => record.status === 'Archived').length,
            overloaded: records.filter((record) => record.loadRatio >= 0.9).length
        };
    }

    function getStaffDictionaries(records, facultyCode) {
        const departments = unique(records.map((record) => record.department));
        const roles = unique(records.map((record) => record.role));
        return {
            departments: departments.length ? departments : [departmentForFaculty(facultyCode)],
            roles: roles.length ? roles : roleTitleOptions('professor'),
            statuses: ['Active', 'Pending Setup', 'On Leave', 'Part-Time', 'Visiting', 'Inactive', 'Archived'],
            accountStatuses: ['Not Invited', 'Invitation Sent', 'Account Active', 'Login Disabled', 'Needs Review'],
            ranks: unique([...roleTitleOptions('professor'), ...roleTitleOptions('ta'), ...roleTitleOptions('student_service')]),
            campuses: ['Main Campus', 'City Campus', 'Medical Campus', 'Online', 'Hybrid'],
            visibility: ['Public to students', 'Visible to staff only', 'Admin only'],
            employmentTypes: ['Full-time', 'Part-time', 'Visiting', 'Contract', 'Temporary'],
            lmsRoles: ['Administrator', 'Department Admin', 'Instructor', 'Teaching Assistant', 'Advisor', 'Support Agent', 'Viewer']
        };
    }

    function getFilteredStaff(records) {
        const state = getStaffState();
        const query = normalizeSearch(state.filters.query);
        const result = records.filter((record) => {
            const completion = profileCompleteness(record);
            if (state.filters.archive === 'active' && record.status === 'Archived') return false;
            if (state.filters.archive === 'archived' && record.status !== 'Archived') return false;
            if (state.filters.platform !== 'all' && record.platformRole !== state.filters.platform) return false;
            if (state.filters.role !== 'all' && record.role !== state.filters.role) return false;
            if (state.filters.department !== 'all' && record.department !== state.filters.department) return false;
            if (state.filters.status !== 'all' && record.status !== state.filters.status) return false;
            if (state.filters.account !== 'all' && record.accountStatus !== state.filters.account) return false;
            if (state.filters.profile === 'complete' && completion.percent < 85) return false;
            if (state.filters.profile === 'incomplete' && completion.percent >= 85) return false;
            if (state.filters.profile === 'missing-photo' && record.photo) return false;
            if (state.filters.profile === 'missing-office-hours' && (record.officeHours || []).length) return false;
            if (state.filters.profile === 'missing-courses' && (!isTeachingRole(record) || (record.courses || []).length)) return false;
            if (state.filters.teaching === 'teaching' && !(record.courses || []).length) return false;
            if (state.filters.teaching === 'not-teaching' && (record.courses || []).length) return false;
            if (state.filters.teaching === 'heavy-load' && record.scheduledHours < 6) return false;
            if (!query) return true;
            const searchable = [
                record.name,
                record.nameEn,
                record.email,
                record.staffId,
                record.phone,
                record.role,
                record.title,
                record.department,
                record.faculty,
                record.office,
                (record.expertise || []).join(' '),
                (record.languages || []).join(' '),
                (record.courses || []).map((course) => `${course.code} ${course.name} ${course.section || ''}`).join(' ')
            ].join(' ');
            return normalizeSearch(searchable).includes(query);
        });

        result.sort((a, b) => {
            const sort = state.filters.sort;
            if (sort === 'department') return a.department.localeCompare(b.department) || a.name.localeCompare(b.name);
            if (sort === 'role') return a.role.localeCompare(b.role) || a.name.localeCompare(b.name);
            if (sort === 'updated') return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || a.name.localeCompare(b.name);
            if (sort === 'courses') return (b.courses || []).length - (a.courses || []).length || a.name.localeCompare(b.name);
            if (sort === 'completion') return profileCompleteness(b).percent - profileCompleteness(a).percent || a.name.localeCompare(b.name);
            return a.name.localeCompare(b.name);
        });
        return result;
    }

    function activeSelection(records) {
        const state = getStaffState();
        return records.find((record) => record.id === state.selectedId) || null;
    }

    function showToast(message) {
        const toast = document.getElementById('staff-command-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(window.__staffCommandToastTimer);
        window.__staffCommandToastTimer = window.setTimeout(() => {
            toast.classList.remove('is-visible');
        }, 2600);
    }

    function setFilter(key, value) {
        const state = getStaffState();
        state.filters[key] = value;
        renderStaffPage();
    }

    function clearFilters() {
        const state = getStaffState();
        state.filters = { ...DEFAULT_FILTERS };
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

    function selectStaff(id) {
        const state = getStaffState();
        state.selectedId = id;
        state.profileTab = 'overview';
        window.location.hash = `profile/${encodeURIComponent(id)}`;
        renderStaffPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function backToDirectory() {
        const state = getStaffState();
        state.selectedId = null;
        state.profileTab = 'overview';
        if (window.location.hash.startsWith('#profile/')) {
            history.pushState('', document.title, window.location.pathname + window.location.search);
        }
        renderStaffPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    function renderStatusChip(value) {
        if (!value) return '';
        return `<span class="staff-hub-chip ${statusTone(value)}">${escapeHtml(value)}</span>`;
    }

    function infoCard(label, value, full = false) {
        if (full) {
            return `<article class="staff-hub-info-card is-full"><span>${escapeHtml(label)}</span><p>${escapeHtml(value || '—')}</p></article>`;
        }
        return `<article class="staff-hub-info-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '—')}</strong></article>`;
    }

    function renderOverview(record) {
        const completion = profileCompleteness(record);
        return `
            ${completion.missing.length ? `<div class="staff-hub-warning"><strong>Missing profile data</strong><div>${completion.missing.map(escapeHtml).join(', ')}</div></div>` : ''}
            <div class="staff-hub-info-grid">
                ${infoCard('Staff ID', record.staffId)}
                ${infoCard('Role', record.role)}
                ${infoCard('Academic rank', record.rank)}
                ${infoCard('Employment', record.employmentType)}
                ${infoCard('Department', record.department)}
                ${infoCard('Faculty / School', record.faculty)}
                ${infoCard('Campus', record.campus)}
                ${infoCard('Office', record.office || 'No office assigned')}
                ${infoCard('Biography', record.bio || 'No biography yet.', true)}
            </div>
            <section class="staff-hub-info-card is-full">
                <span>Expertise</span>
                <div class="staff-hub-chips" style="margin-top:10px;">${(record.expertise || []).length ? record.expertise.map((item) => `<span class="staff-hub-chip">${escapeHtml(item)}</span>`).join('') : '<span class="staff-hub-chip is-warning">No expertise listed</span>'}</div>
            </section>
            <section class="staff-hub-info-card is-full">
                <span>Languages</span>
                <div class="staff-hub-chips" style="margin-top:10px;">${(record.languages || []).length ? record.languages.map((item) => `<span class="staff-hub-chip">${escapeHtml(item)}</span>`).join('') : '<span class="staff-hub-chip is-warning">No languages listed</span>'}</div>
            </section>
        `;
    }

    function renderTeaching(record) {
        return `
            <div class="staff-hub-info-grid">
                ${infoCard('Current courses', (record.courses || []).length)}
                ${infoCard('Weekly teaching load', `${record.scheduledHours} hours`)}
                ${infoCard('Teaching status', (record.courses || []).length ? 'Teaching this semester' : 'No current teaching assignment')}
                ${infoCard('Primary course role', record.courses?.[0]?.role || 'Not assigned')}
            </div>
            <div class="staff-hub-list">
                ${(record.courses || []).length ? record.courses.map((course) => `
                    <article class="staff-hub-list-item">
                        <strong>${escapeHtml(course.code)} · ${escapeHtml(course.name)}</strong>
                        <small>${escapeHtml(course.role)} · ${escapeHtml(course.semester)} · ${escapeHtml(course.section)} · ${escapeHtml(course.hours)}h/week</small>
                    </article>
                `).join('') : `<div class="staff-hub-warning"><strong>No course assignment</strong><div>${isTeachingRole(record) ? 'This staff member appears to be teaching staff. Assign a course before publishing the profile.' : 'Course assignments are not required for this role.'}</div></div>`}
            </div>
            <section class="staff-hub-info-card is-full">
                <span>Scheduler Sync</span>
                <div class="staff-hub-list" style="margin-top:10px;">
                    ${(record.scheduleSessions || []).length ? record.scheduleSessions.map((session) => `
                        <article class="staff-hub-list-item">
                            <strong>${escapeHtml(session.courseId)} · ${escapeHtml(session.group)}</strong>
                            <small>${escapeHtml(session.sessionType)} · ${escapeHtml(session.day)} · ${escapeHtml(session.time)} · ${escapeHtml(session.duration)} · ${escapeHtml(session.room)} · ${escapeHtml(session.capacity)} seats</small>
                        </article>
                    `).join('') : '<article class="staff-hub-list-item"><strong>No synced schedule sessions</strong><small>Add schedule sync lines in the staff editor to create or update recurring teaching sessions.</small></article>'}
                </div>
            </section>
        `;
    }

    function renderAvailability(record) {
        return `
            <div class="staff-hub-info-grid">
                ${infoCard('Office', record.office || 'No office assigned')}
                ${infoCard('Availability entries', (record.officeHours || []).length)}
            </div>
            <div class="staff-hub-list">
                ${(record.officeHours || []).length ? record.officeHours.map((slot) => `
                    <article class="staff-hub-list-item">
                        <strong>${escapeHtml(slot.day)} · ${escapeHtml(slot.start)}-${escapeHtml(slot.end)}</strong>
                        <small>${escapeHtml(slot.location)} · ${escapeHtml(slot.mode)} · ${escapeHtml(slot.booking)}</small>
                    </article>
                `).join('') : '<div class="staff-hub-warning"><strong>No office hours</strong><div>Add office hours so students know when and how to contact this staff member.</div></div>'}
            </div>
        `;
    }

    function renderContact(record) {
        return `
            <div class="staff-hub-info-grid">
                ${infoCard('Email', record.email)}
                ${infoCard('Phone', record.phone || 'No phone listed')}
                ${infoCard('Office', record.office || 'No office listed')}
                ${infoCard('Visibility', record.visibility)}
            </div>
            <section class="staff-hub-info-card is-full">
                <span>Professional links</span>
                <div class="staff-hub-list" style="margin-top:10px;">
                    ${(record.links || []).length ? record.links.map((link) => `<article class="staff-hub-list-item"><strong>${escapeHtml(link.label)}</strong><small>${escapeHtml(link.url)}</small></article>`).join('') : '<article class="staff-hub-list-item"><strong>No links listed</strong><small>Add website, ORCID, scholar profile, or department profile links.</small></article>'}
                </div>
            </section>
        `;
    }

    function renderDocuments(record) {
        return `
            <section class="staff-hub-info-card is-full">
                <span>Profile documents</span>
                <p>Document metadata placeholder. In a live LMS, these records would connect to secure file storage, retention rules, and permissions.</p>
            </section>
            <div class="staff-hub-list">
                ${(record.documents || []).length ? record.documents.map((doc) => `
                    <article class="staff-hub-list-item">
                        <strong>${escapeHtml(doc.name)}</strong>
                        <small>${escapeHtml(doc.type)} · ${escapeHtml(doc.visibility)}</small>
                    </article>
                `).join('') : '<article class="staff-hub-list-item"><strong>No documents</strong><small>CV, syllabus files, publication lists, or admin-only documents can be added later.</small></article>'}
            </div>
        `;
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
            <section class="staff-hub-info-card is-full">
                <span>Admin actions</span>
                <div class="staff-hub-inline-actions" style="margin-top:12px;">
                    <button class="lux-secondary-btn" type="button" data-staff-action="invite" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-paper-plane"></i> Send invitation</button>
                    <button class="lux-secondary-btn" type="button" data-staff-action="toggle-login" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-power-off"></i> Toggle login</button>
                    <button class="lux-secondary-btn" type="button" data-staff-action="mark-reviewed" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-clipboard-check"></i> Mark reviewed</button>
                    ${record.status === 'Archived'
                        ? `<button class="lux-primary-btn" type="button" data-staff-action="restore" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-box-open"></i> Restore</button>`
                        : `<button class="lux-secondary-btn" type="button" data-staff-action="archive" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-box-archive"></i> Archive</button>`}
                    <button class="lux-secondary-btn lux-danger-btn" type="button" data-staff-action="delete" data-staff-id="${escapeHtml(record.id)}" ${canManage ? '' : 'disabled'}><i class="fas fa-user-slash"></i> Delete</button>
                    <button class="lux-secondary-btn" type="button" data-staff-action="open-platform-profile" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-id-card"></i> Open canonical profile</button>
                </div>
                ${!canManage ? '<p class="staff-hub-section-copy" style="margin-top:12px;">Switch to Admin preview with an active administrator session to use admin-only actions.</p>' : ''}
            </section>
        `;
    }

    function renderProfileTab(record) {
        const state = getStaffState();
        if (state.profileTab === 'teaching') return renderTeaching(record);
        if (state.profileTab === 'availability') return renderAvailability(record);
        if (state.profileTab === 'contact') return renderContact(record);
        if (state.profileTab === 'documents') return renderDocuments(record);
        if (state.profileTab === 'admin') return renderAdmin(record);
        return renderOverview(record);
    }

    function renderProfile(record) {
        const state = getStaffState();
        const completion = profileCompleteness(record);
        const tabs = [
            ['overview', 'Overview'],
            ['teaching', 'Teaching'],
            ['availability', 'Availability'],
            ['contact', 'Contact'],
            ['documents', 'Documents'],
            ['admin', 'Admin']
        ];
        return `
            <section class="staff-hub-profile">
                <div class="staff-hub-toolbar">
                    <button class="lux-secondary-btn" type="button" data-staff-action="back"><i class="fas fa-arrow-left"></i> Back to staff directory</button>
                    <div class="staff-hub-toolbar-actions">
                        <button class="lux-primary-btn" type="button" data-staff-action="edit" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-pen"></i> Edit profile</button>
                        <button class="lux-secondary-btn" type="button" data-staff-action="open-platform-profile" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-up-right-from-square"></i> Open canonical profile</button>
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
                                <div class="staff-hub-chips" style="margin-top:12px;">${renderStatusChip(record.status)}${renderStatusChip(record.accountStatus)}${renderStatusChip(record.lmsRole)}</div>
                            </div>
                        </div>
                        <div class="staff-hub-progress">
                            <div class="staff-hub-progress-track"><span class="staff-hub-progress-fill" style="width:${completion.percent}%"></span></div>
                            <small class="staff-hub-text-muted">${completion.percent}% complete · updated ${escapeHtml(record.updatedAt || 'unknown')}</small>
                        </div>
                        <div class="staff-hub-toolbar-actions">
                            ${record.status === 'Archived'
                                ? `<button class="lux-primary-btn" type="button" data-staff-action="restore" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-open"></i> Restore</button>`
                                : `<button class="lux-secondary-btn" type="button" data-staff-action="archive" data-staff-id="${escapeHtml(record.id)}"><i class="fas fa-box-archive"></i> Archive</button>`}
                        </div>
                    </div>
                </div>
                <div class="staff-hub-tabs">
                    ${tabs.map(([key, label]) => `<button class="staff-hub-tab ${state.profileTab === key ? 'is-active' : ''}" type="button" data-staff-action="tab" data-staff-tab="${key}">${label}</button>`).join('')}
                </div>
                <div class="staff-hub-profile-body">
                    ${renderProfileTab(record)}
                </div>
            </section>
        `;
    }

    function renderDirectory(records, facultyCode, stats, unassignedSections) {
        const state = getStaffState();
        const dictionaries = getStaffDictionaries(records, facultyCode);
        const visible = getFilteredStaff(records);
        const facultyLabel = facultyName(facultyCode);
        const currentUserRole = normalizeSearch(getCurrentUser?.()?.role || '');
        const isAdminSession = currentUserRole === 'admin';
        const viewRoleOptions = VIEW_ROLES.map((value) => `<option value="${value}" ${state.viewRole === value ? 'selected' : ''}>${value === 'admin' ? 'Admin Preview' : value === 'faculty' ? 'Faculty Preview' : 'Viewer Preview'}</option>`).join('');
        const activeChips = [
            state.filters.query ? ['Search', state.filters.query] : null,
            state.filters.platform !== 'all' ? ['Category', getPlatformRoleLabel(state.filters.platform)] : null,
            state.filters.role !== 'all' ? ['Role', state.filters.role] : null,
            state.filters.department !== 'all' ? ['Department', state.filters.department] : null,
            state.filters.status !== 'all' ? ['Status', state.filters.status] : null,
            state.filters.account !== 'all' ? ['Account', state.filters.account] : null,
            state.filters.profile !== 'all' ? ['Profile', state.filters.profile.replace(/-/g, ' ')] : null,
            state.filters.teaching !== 'all' ? ['Teaching', state.filters.teaching.replace(/-/g, ' ')] : null,
            state.filters.archive !== 'active' ? ['Archive', state.filters.archive] : null
        ].filter(Boolean);

        const rows = visible.length ? visible.map((record) => {
            const completion = profileCompleteness(record);
            const selected = state.selectedId === record.id;
            const courseLabel = (record.courses || []).length
                ? `${record.courses.length} course${record.courses.length === 1 ? '' : 's'} · ${record.scheduledHours}h/week`
                : 'No course assignment';
            return `
                <tr class="${selected ? 'is-selected' : ''}">
                    <td>
                        <button class="lux-secondary-btn" style="padding:0; border:0; background:none; box-shadow:none; width:100%; justify-content:flex-start;" type="button" data-staff-action="select" data-staff-id="${escapeHtml(record.id)}">
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
                        <div class="staff-hub-progress">
                            <div class="staff-hub-progress-track"><span class="staff-hub-progress-fill" style="width:${completion.percent}%"></span></div>
                            <small class="staff-hub-text-muted">${completion.percent}% · ${completion.missing.length ? `${completion.missing.length} missing` : 'complete'}</small>
                        </div>
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
            <div class="staff-hub-empty">
                <i class="fas fa-users-slash" style="font-size:32px;"></i>
                <strong>${records.length ? 'No staff match these filters.' : 'No staff records yet.'}</strong>
                <span>${records.length ? 'Try clearing filters, searching another role, or including archived records.' : 'Start by registering your first staff account.'}</span>
                <div class="staff-hub-inline-actions">
                    ${records.length
                        ? '<button class="lux-secondary-btn" type="button" data-staff-action="clear-filters">Clear filters</button>'
                        : '<button class="lux-primary-btn" type="button" data-staff-action="open-create" data-staff-role="professor"><i class="fas fa-user-plus"></i> Add staff</button>'}
                </div>
            </div>
        `;

        return `
            <div class="staff-hub-shell">
                <section class="page-hero staff-hub-hero">
                    <div>
                        <div class="staff-hub-kicker"><i class="fas fa-users-cog"></i> Staff Administration · Profile Governance · Teaching Operations</div>
                        <h1 class="staff-hub-title">Staff Command Center</h1>
                        <p class="staff-hub-hero-copy">Operate the university staff directory with one KIU-native workspace for profile completeness, account readiness, teaching assignments, availability, documents, and lifecycle actions.</p>
                        <div class="staff-hub-hero-meta" style="margin-top:16px;">
                            <span class="staff-hub-pill"><i class="fas fa-building"></i> ${escapeHtml(facultyLabel)}</span>
                            <span class="staff-hub-pill"><i class="fas fa-users"></i> ${stats.total} active and archived staff</span>
                            <span class="staff-hub-pill"><i class="fas fa-user-graduate"></i> ${typeof getAllStudents === 'function' ? getAllStudents(facultyCode).length : 0} students in scope</span>
                            <span class="staff-hub-pill"><i class="fas fa-triangle-exclamation"></i> ${unassignedSections} sections need staffing review</span>
                        </div>
                        <div class="staff-hub-action-row" style="margin-top:20px;">
                            <div class="staff-hub-field" style="min-width:280px; flex:1 1 280px;">
                                <label for="staff-global-search">Search command center</label>
                                <input class="staff-hub-control" id="staff-global-search" type="search" value="${escapeHtml(state.filters.query)}" placeholder="Search staff, course, department, office..." />
                            </div>
                            <div class="staff-hub-field" style="min-width:170px;">
                                <label for="staff-view-role">View role</label>
                                <select class="staff-hub-control" id="staff-view-role">${viewRoleOptions}</select>
                            </div>
                            <div class="staff-hub-inline-actions">
                                <button class="lux-secondary-btn" type="button" data-staff-action="import"><i class="fas fa-file-import"></i> Import JSON</button>
                                <button class="lux-secondary-btn" type="button" data-staff-action="export"><i class="fas fa-file-export"></i> Export JSON</button>
                                ${isAdminSession ? `<button class="lux-primary-btn" type="button" data-staff-action="open-create" data-staff-role="professor"><i class="fas fa-user-plus"></i> Add Staff</button>` : ''}
                            </div>
                        </div>
                        <input id="staff-import-file" type="file" accept="application/json" hidden>
                    </div>
                    <div class="staff-hub-hero-panel">
                        <article class="staff-hub-focus-card">
                            <div class="staff-hub-overline">Operational Pulse</div>
                            <h2>Profile health and access readiness</h2>
                            <p>${stats.incomplete} incomplete profiles, ${stats.pending} account actions, and ${stats.overloaded} overloaded teaching records are visible in one review loop.</p>
                        </article>
                        <div class="staff-hub-hero-grid">
                            <article class="staff-hub-mini-card">
                                <div class="staff-hub-overline">Coverage</div>
                                <strong style="display:block; margin-top:10px; color:var(--lux-text); font-size:24px;">${stats.teaching}</strong>
                                <div class="staff-hub-mini-copy">Teaching-active staff</div>
                            </article>
                            <article class="staff-hub-mini-card">
                                <div class="staff-hub-overline">Service</div>
                                <strong style="display:block; margin-top:10px; color:var(--lux-text); font-size:24px;">${records.filter((record) => record.platformRole === 'student_service').length}</strong>
                                <div class="staff-hub-mini-copy">Student service staff</div>
                            </article>
                        </div>
                    </div>
                </section>

                <section class="staff-hub-metrics">
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Total staff</div>
                        <strong>${stats.total}</strong>
                        <span>${stats.total - stats.archived} active visible records by default</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Teaching staff</div>
                        <strong>${stats.teaching}</strong>
                        <span>Professors and teaching assistants with academic assignments</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Incomplete</div>
                        <strong>${stats.incomplete}</strong>
                        <span>Profiles below the publishing threshold</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Account review</div>
                        <strong>${stats.pending}</strong>
                        <span>Needs invitation, review, or login recovery</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">No office hours</div>
                        <strong>${stats.noOfficeHours}</strong>
                        <span>Availability is missing for student contact</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Overloaded</div>
                        <strong>${stats.overloaded}</strong>
                        <span>Weekly teaching load is at or above threshold</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Unassigned sections</div>
                        <strong>${unassignedSections}</strong>
                        <span>Groups missing a professor or TA in scheduler scope</span>
                    </article>
                    <article class="staff-hub-surface staff-hub-metric-card">
                        <div class="staff-hub-overline">Archived</div>
                        <strong>${stats.archived}</strong>
                        <span>Records hidden from default staff operations</span>
                    </article>
                </section>

                <section class="staff-hub-surface staff-hub-controls staff-admin-controls">
                    <div class="staff-hub-controls-head">
                        <div>
                            <div class="staff-hub-overline">Directory controls</div>
                            <h2 class="staff-hub-section-title">Search, filter, and govern staff profiles</h2>
                            <p class="staff-hub-section-copy">${visible.length} result${visible.length === 1 ? '' : 's'} shown. Review completeness, teaching scope, account state, and lifecycle flags without leaving the directory.</p>
                        </div>
                        ${isAdminSession ? `<div class="staff-hub-inline-actions">
                            <button class="lux-secondary-btn" type="button" data-staff-action="export-csv"><i class="fas fa-table"></i> Export CSV</button>
                            <button class="lux-primary-btn" type="button" data-staff-action="open-create" data-staff-role="professor"><i class="fas fa-user-plus"></i> Register professor</button>
                            <button class="lux-secondary-btn" type="button" data-staff-action="open-create" data-staff-role="ta"><i class="fas fa-user-tie"></i> Register TA</button>
                            <button class="lux-secondary-btn" type="button" data-staff-action="open-create" data-staff-role="student_service"><i class="fas fa-headset"></i> Register service staff</button>
                        </div>` : ''}
                    </div>

                    <div class="staff-hub-inline-actions" style="margin-top:18px;">
                        <button class="lux-secondary-btn" type="button" data-staff-action="saved-view" data-staff-view="all"><i class="fas fa-layer-group"></i> All staff</button>
                        <button class="lux-secondary-btn" type="button" data-staff-action="saved-view" data-staff-view="account-review"><i class="fab fa-microsoft"></i> Needs account</button>
                        <button class="lux-secondary-btn" type="button" data-staff-action="saved-view" data-staff-view="overloaded"><i class="fas fa-triangle-exclamation"></i> Overloaded</button>
                        <button class="lux-secondary-btn" type="button" data-staff-action="saved-view" data-staff-view="unassigned"><i class="fas fa-link-slash"></i> Unassigned</button>
                    </div>

                    <div class="staff-hub-filter-grid">
                        <div class="staff-hub-field">
                            <label for="staff-search">Search directory</label>
                            <input class="staff-hub-control" id="staff-search" type="search" value="${escapeHtml(state.filters.query)}" placeholder="Name, email, staff ID, course, office..." />
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-role-filter">Role</label>
                            <select class="staff-hub-control" id="staff-role-filter">
                                <option value="all">All roles</option>
                                ${dictionaries.roles.map((role) => `<option value="${escapeHtml(role)}" ${state.filters.role === role ? 'selected' : ''}>${escapeHtml(role)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-department-filter">Department</label>
                            <select class="staff-hub-control" id="staff-department-filter">
                                <option value="all">All departments</option>
                                ${dictionaries.departments.map((department) => `<option value="${escapeHtml(department)}" ${state.filters.department === department ? 'selected' : ''}>${escapeHtml(department)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-status-filter">Status</label>
                            <select class="staff-hub-control" id="staff-status-filter">
                                <option value="all">All statuses</option>
                                ${dictionaries.statuses.map((status) => `<option value="${escapeHtml(status)}" ${state.filters.status === status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-sort-filter">Sort</label>
                            <select class="staff-hub-control" id="staff-sort-filter">
                                <option value="name" ${state.filters.sort === 'name' ? 'selected' : ''}>Name</option>
                                <option value="department" ${state.filters.sort === 'department' ? 'selected' : ''}>Department</option>
                                <option value="role" ${state.filters.sort === 'role' ? 'selected' : ''}>Role</option>
                                <option value="updated" ${state.filters.sort === 'updated' ? 'selected' : ''}>Recently updated</option>
                                <option value="courses" ${state.filters.sort === 'courses' ? 'selected' : ''}>Most courses</option>
                                <option value="completion" ${state.filters.sort === 'completion' ? 'selected' : ''}>Profile completeness</option>
                            </select>
                        </div>
                    </div>

                    <div class="staff-hub-filter-grid-secondary">
                        <div class="staff-hub-field">
                            <label for="staff-account-filter">Account</label>
                            <select class="staff-hub-control" id="staff-account-filter">
                                <option value="all">All accounts</option>
                                ${dictionaries.accountStatuses.map((status) => `<option value="${escapeHtml(status)}" ${state.filters.account === status ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-profile-filter">Profile status</label>
                            <select class="staff-hub-control" id="staff-profile-filter">
                                <option value="all" ${state.filters.profile === 'all' ? 'selected' : ''}>All profiles</option>
                                <option value="complete" ${state.filters.profile === 'complete' ? 'selected' : ''}>Complete profiles</option>
                                <option value="incomplete" ${state.filters.profile === 'incomplete' ? 'selected' : ''}>Incomplete profiles</option>
                                <option value="missing-photo" ${state.filters.profile === 'missing-photo' ? 'selected' : ''}>Missing photo</option>
                                <option value="missing-office-hours" ${state.filters.profile === 'missing-office-hours' ? 'selected' : ''}>Missing office hours</option>
                                <option value="missing-courses" ${state.filters.profile === 'missing-courses' ? 'selected' : ''}>Missing courses</option>
                            </select>
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-teaching-filter">Teaching</label>
                            <select class="staff-hub-control" id="staff-teaching-filter">
                                <option value="all" ${state.filters.teaching === 'all' ? 'selected' : ''}>All staff</option>
                                <option value="teaching" ${state.filters.teaching === 'teaching' ? 'selected' : ''}>Teaching this semester</option>
                                <option value="not-teaching" ${state.filters.teaching === 'not-teaching' ? 'selected' : ''}>Not teaching this semester</option>
                                <option value="heavy-load" ${state.filters.teaching === 'heavy-load' ? 'selected' : ''}>High teaching load</option>
                            </select>
                        </div>
                        <div class="staff-hub-field">
                            <label for="staff-archive-filter">Archive</label>
                            <select class="staff-hub-control" id="staff-archive-filter">
                                <option value="active" ${state.filters.archive === 'active' ? 'selected' : ''}>Active records</option>
                                <option value="archived" ${state.filters.archive === 'archived' ? 'selected' : ''}>Archived only</option>
                                <option value="all" ${state.filters.archive === 'all' ? 'selected' : ''}>All records</option>
                            </select>
                        </div>
                        <button class="lux-secondary-btn" type="button" data-staff-action="review-missing"><i class="fas fa-clipboard-list"></i> Review missing data</button>
                    </div>

                    <div class="staff-hub-chips" style="margin-top:14px;">
                        ${activeChips.length ? activeChips.map(([label, value]) => `<span class="staff-hub-chip">${escapeHtml(label)}: ${escapeHtml(value)}</span>`).join('') : '<span class="staff-hub-chip">No active filters</span>'}
                    </div>
                </section>

                <section class="staff-hub-surface staff-hub-directory-panel">
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
                        <div class="staff-hub-table-wrap">
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

    function renderModal(records, facultyCode) {
        const root = document.getElementById('staff-command-modal-root');
        if (!root) return;
        const state = getStaffState();
        const editing = records.find((record) => record.id === state.editingId) || null;
        if (!state.editingId && !state.modalRole && root.hasAttribute('hidden')) return;
        if (!state.modalOpen) {
            root.setAttribute('hidden', '');
            root.innerHTML = '';
            return;
        }
        const dictionaries = getStaffDictionaries(records, facultyCode);
        const profile = editing || buildDraftRecord(facultyCode, state.modalRole);
        const roleOptions = roleTitleOptions(profile.platformRole);
        const completion = profileCompleteness(profile);
        root.removeAttribute('hidden');
        root.innerHTML = `
            <div class="staff-hub-modal-backdrop" data-staff-action="dismiss-modal">
                <form class="staff-hub-modal" id="staff-command-form" novalidate>
                    <div class="staff-hub-modal-head">
                        <div>
                            <h2 class="staff-hub-modal-title">${editing ? 'Edit Staff Profile' : 'Add Staff Member'}</h2>
                            <p class="staff-hub-modal-copy">${editing ? 'Update profile, teaching, availability, and access details.' : 'Create a complete KIU LMS staff profile with contact, teaching, and account metadata.'}</p>
                        </div>
                        <button class="lux-secondary-btn" type="button" data-staff-action="close-modal"><i class="fas fa-times"></i> Close</button>
                    </div>
                    <div class="staff-hub-modal-body">
                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 1</span>
                                    <strong>Basic information</strong>
                                    <p>Identity details used across the staff directory and profile pages.</p>
                                </div>
                                <span class="staff-hub-chip">Required</span>
                            </div>
                            <div class="staff-hub-form-grid">
                                ${renderField('Full name *', 'formName', 'text', profile.name, 'Nino Beridze', true)}
                                ${renderField('Institutional email *', 'formEmail', 'email', profile.email, 'name@kiu.edu.ge', true)}
                                ${renderField('English name', 'formNameEn', 'text', profile.nameEn || '', 'Nino Beridze')}
                                ${renderField('Staff ID', 'formStaffId', 'text', profile.staffId, 'STF-2026-001')}
                                ${renderField('Phone', 'formPhone', 'text', profile.phone || '', '+995 555 000 000')}
                                ${renderField('Photo URL', 'formPhoto', 'url', profile.photo || '', 'Optional image URL')}
                                ${renderSelectField('Staff status *', 'formStatus', dictionaries.statuses, profile.status)}
                            </div>
                        </section>

                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 2</span>
                                    <strong>Role and governance</strong>
                                    <p>Platform role, faculty placement, title, department, and visibility scope.</p>
                                </div>
                            </div>
                            <div class="staff-hub-form-grid">
                                ${renderSelectField('Account type *', 'formPlatformRole', ['professor', 'ta', 'student_service'], profile.platformRole, {
                                    labels: {
                                        professor: 'Professor',
                                        ta: 'Teaching Assistant',
                                        student_service: 'Student Service'
                                    }
                                })}
                                ${renderSelectField('Display role *', 'formRole', roleOptions, profile.role)}
                                ${renderField('Title', 'formTitle', 'text', profile.title || '', 'Professor of Management')}
                                ${renderSelectField('Academic rank', 'formRank', dictionaries.ranks, profile.rank)}
                                ${renderField('Department *', 'formDepartment', 'text', profile.department, 'Computer Science', true)}
                                ${renderSelectField('Faculty / School', 'formFaculty', unique([profile.faculty, ...Object.keys(KIU_STATE.facultyProfiles || {}).map((code) => humanizeFacultyName(code))]), profile.faculty)}
                                ${renderSelectField('Employment type', 'formEmploymentType', dictionaries.employmentTypes, profile.employmentType)}
                                ${renderSelectField('Campus', 'formCampus', dictionaries.campuses, profile.campus)}
                                ${renderField('Office', 'formOffice', 'text', profile.office || '', 'B-204')}
                                ${renderSelectField('Profile visibility', 'formVisibility', dictionaries.visibility, profile.visibility)}
                                ${renderField('Max weekly hours', 'formMaxHours', 'number', profile.maxHours, '15')}
                            </div>
                        </section>

                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 3</span>
                                    <strong>Profile content</strong>
                                    <p>Biography, expertise, languages, and professional links.</p>
                                </div>
                            </div>
                            <div class="staff-hub-form-grid is-two">
                                ${renderTextareaField('Biography', 'formBio', profile.bio || '', 'Short profile summary for students and staff.')}
                                ${renderTextareaField('Expertise / interests', 'formExpertise', (profile.expertise || []).join(', '), 'Marketing Strategy, Consumer Behavior, Research Methods', 'Separate items with commas.')}
                                ${renderField('Languages', 'formLanguages', 'text', (profile.languages || []).join(', '), 'Georgian, English', false, 'Separate items with commas.')}
                                ${renderTextareaField('Links', 'formLinks', (profile.links || []).map((link) => `${link.label} | ${link.url}`).join('\n'), 'Website | https://example.edu/profile', 'Use one link per line: Label | URL')}
                            </div>
                        </section>

                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 4</span>
                                    <strong>Teaching assignments</strong>
                                    <p>Course ownership and weekly load details used for directory visibility and staffing review.</p>
                                </div>
                            </div>
                            <div class="staff-hub-form-grid is-one">
                                ${renderTextareaField('Assigned courses', 'formCourses', (profile.courses || []).map((course) => `${course.code} | ${course.name} | ${course.role} | ${course.semester} | ${course.section} | ${course.hours}`).join('\n'), 'BUS-204 | Marketing Strategy | Instructor | Spring 2026 | Group A | 4', 'Format: Course code | Course name | Role | Semester | Section | Weekly hours')}
                            </div>
                        </section>

                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 5</span>
                                    <strong>Scheduler sync</strong>
                                    <p>Create or update recurring teaching sessions in the KIU master scheduler while keeping the improved staff workflow.</p>
                                </div>
                            </div>
                            <div class="staff-hub-form-grid is-one">
                                ${renderTextareaField('Teaching sessions', 'formScheduleSessions', (profile.scheduleSessions || []).map((session) => `${session.courseId} | ${session.sessionType} | ${session.day} | ${session.time} | ${session.duration} | ${session.room} | ${session.group} | ${session.capacity}`).join('\n'), 'BUS-101 | lecture | Mon | 09:00 | 110min | A-301 | G1 | 30', 'Format: Course ID | Type | Day | Start | Duration | Room | Group | Seats. Existing sessions stay unchanged unless the same course + group is updated.')}
                            </div>
                        </section>

                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 6</span>
                                    <strong>Availability and office hours</strong>
                                    <p>Consultation slots, booking mode, and location details for contact visibility.</p>
                                </div>
                            </div>
                            <div class="staff-hub-form-grid is-one">
                                ${renderTextareaField('Office hours', 'formOfficeHours', (profile.officeHours || []).map((slot) => `${slot.day} | ${slot.start} | ${slot.end} | ${slot.location} | ${slot.mode} | ${slot.booking}`).join('\n'), 'Tuesday | 14:00 | 16:00 | B-204 | In person | Booking enabled', 'Format: Day | Start | End | Location | Mode | Booking status')}
                            </div>
                        </section>

                        <section class="staff-hub-form-section">
                            <div class="staff-hub-form-section-head">
                                <div>
                                    <span class="staff-hub-overline">Step 7</span>
                                    <strong>Access and admin settings</strong>
                                    <p>Account lifecycle, permission role, login history, and internal notes.</p>
                                </div>
                            </div>
                            <div class="staff-hub-form-grid">
                                ${renderSelectField('LMS account status', 'formAccountStatus', dictionaries.accountStatuses, profile.accountStatus)}
                                ${renderSelectField('LMS permission role', 'formLmsRole', dictionaries.lmsRoles, profile.lmsRole)}
                                ${renderField('Last login', 'formLastLogin', 'date', profile.lastLogin || '', '')}
                            </div>
                            <div class="staff-hub-form-grid is-one">
                                ${renderTextareaField('Internal admin notes', 'formNotes', profile.notes || '', 'Private notes for administrators only.')}
                            </div>
                        </section>
                    </div>
                    <div class="staff-hub-modal-foot">
                        <div class="staff-hub-chips">
                            <span class="staff-hub-chip ${completionTone(completion.percent)}">${completion.percent}% complete</span>
                            ${completion.missing.slice(0, 3).map((item) => `<span class="staff-hub-chip is-warning">Missing ${escapeHtml(item)}</span>`).join('')}
                        </div>
                        <div class="staff-hub-modal-actions">
                            <button class="lux-secondary-btn" type="button" data-staff-action="close-modal">Cancel</button>
                            <button class="lux-secondary-btn" type="button" data-staff-action="preview-form">Preview completeness</button>
                            <button class="lux-primary-btn" type="submit"><i class="fas fa-check"></i> ${editing ? 'Save Staff Profile' : 'Create Staff Profile'}</button>
                        </div>
                    </div>
                </form>
            </div>
        `;
    }

    function renderField(label, id, type, value, placeholder, required = false, help = '') {
        return `
            <div class="staff-hub-field" data-field="${escapeHtml(id)}">
                <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
                <input class="staff-hub-control" id="${escapeHtml(id)}" type="${escapeHtml(type)}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(placeholder || '')}" ${required ? 'required' : ''}>
                ${help ? `<div class="staff-hub-help">${escapeHtml(help)}</div>` : ''}
                <div class="staff-hub-error">This field is required.</div>
            </div>
        `;
    }

    function renderTextareaField(label, id, value, placeholder, help = '') {
        return `
            <div class="staff-hub-field" data-field="${escapeHtml(id)}">
                <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
                <textarea class="staff-hub-control" id="${escapeHtml(id)}" placeholder="${escapeHtml(placeholder || '')}">${escapeHtml(value ?? '')}</textarea>
                ${help ? `<div class="staff-hub-help">${escapeHtml(help)}</div>` : ''}
            </div>
        `;
    }

    function renderSelectField(label, id, options, value, config = {}) {
        const labels = config.labels || {};
        return `
            <div class="staff-hub-field" data-field="${escapeHtml(id)}">
                <label for="${escapeHtml(id)}">${escapeHtml(label)}</label>
                <select class="staff-hub-control" id="${escapeHtml(id)}">
                    ${options.map((option) => {
                        const normalized = String(option);
                        const display = labels[normalized] || option;
                        return `<option value="${escapeHtml(normalized)}" ${String(value) === normalized ? 'selected' : ''}>${escapeHtml(display)}</option>`;
                    }).join('')}
                </select>
                <div class="staff-hub-error">This field is required.</div>
            </div>
        `;
    }

    function buildDraftRecord(facultyCode, platformRole) {
        const faculty = humanizeFacultyName(facultyCode);
        return {
            id: '',
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
        document.querySelectorAll('#staff-command-modal-root .staff-hub-field.is-invalid').forEach((field) => field.classList.remove('is-invalid'));
    }

    function markInvalid(id) {
        const field = document.getElementById(id)?.closest('.staff-hub-field');
        if (field) field.classList.add('is-invalid');
    }

    function buildFormRecord(soft = false) {
        const state = getStaffState();
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const platformRole = normalizeText(document.getElementById('formPlatformRole')?.value || state.modalRole || 'professor', 'professor');
        const currentRecords = buildStaffRecords(facultyCode).records;
        const editing = currentRecords.find((record) => record.id === state.editingId) || null;
        const name = normalizeText(document.getElementById('formName')?.value || '');
        const email = normalizeText(document.getElementById('formEmail')?.value || '');
        const nameEn = normalizeText(document.getElementById('formNameEn')?.value || name, name);
        const existingUser = (KIU_STATE.users || []).find((user) => normalizeSearch(user?.email) === normalizeSearch(email) && String(user?.id || '') !== String(editing?.id || ''));

        if (!soft) {
            clearFormErrors();
            let valid = true;
            if (!name) { markInvalid('formName'); valid = false; }
            if (!email || !/^\S+@\S+\.\S+$/.test(email) || existingUser) { markInvalid('formEmail'); valid = false; }
            if (!document.getElementById('formRole')?.value) { markInvalid('formRole'); valid = false; }
            if (!document.getElementById('formDepartment')?.value) { markInvalid('formDepartment'); valid = false; }
            if (!valid) {
                showToast(existingUser ? 'This email already exists in the KIU directory.' : 'Please fix required fields before saving.');
                return null;
            }
        }

        const facultyNameValue = normalizeText(document.getElementById('formFaculty')?.value || humanizeFacultyName(facultyCode), humanizeFacultyName(facultyCode));
        const actualFacultyCode = Object.keys(KIU_STATE.facultyProfiles || {}).find((code) => humanizeFacultyName(code) === facultyNameValue) || facultyCode;
        const staffId = normalizeText(document.getElementById('formStaffId')?.value || editing?.staffId || nextStaffNumber(), nextStaffNumber());
        return {
            id: editing?.id || nextUserId(platformRole, actualFacultyCode),
            platformRole,
            profileKey: PLATFORM_ROLE_META[platformRole]?.profileKey || 'professors',
            staffId,
            name,
            nameEn,
            email,
            phone: normalizeText(document.getElementById('formPhone')?.value || ''),
            photo: normalizeText(document.getElementById('formPhoto')?.value || ''),
            status: normalizeText(document.getElementById('formStatus')?.value || 'Active', 'Active'),
            role: normalizeText(document.getElementById('formRole')?.value || roleTitleOptions(platformRole)[0], roleTitleOptions(platformRole)[0]),
            title: normalizeText(document.getElementById('formTitle')?.value || document.getElementById('formRole')?.value || roleTitleOptions(platformRole)[0], roleTitleOptions(platformRole)[0]),
            rank: normalizeText(document.getElementById('formRank')?.value || roleTitleOptions(platformRole)[0], roleTitleOptions(platformRole)[0]),
            department: normalizeText(document.getElementById('formDepartment')?.value || departmentForFaculty(actualFacultyCode), departmentForFaculty(actualFacultyCode)),
            faculty: facultyNameValue,
            facultyCode: actualFacultyCode,
            employmentType: normalizeText(document.getElementById('formEmploymentType')?.value || '', ''),
            campus: normalizeText(document.getElementById('formCampus')?.value || 'Main Campus', 'Main Campus'),
            office: normalizeText(document.getElementById('formOffice')?.value || ''),
            visibility: normalizeText(document.getElementById('formVisibility')?.value || getVisibilityDefault(platformRole), getVisibilityDefault(platformRole)),
            bio: normalizeText(document.getElementById('formBio')?.value || ''),
            expertise: parseCommaList(document.getElementById('formExpertise')?.value || ''),
            languages: parseCommaList(document.getElementById('formLanguages')?.value || ''),
            links: parseLinks(document.getElementById('formLinks')?.value || ''),
            courses: parseCourses(document.getElementById('formCourses')?.value || ''),
            scheduleSessions: parseScheduleSessions(document.getElementById('formScheduleSessions')?.value || ''),
            officeHours: parseOfficeHours(document.getElementById('formOfficeHours')?.value || ''),
            accountStatus: normalizeText(document.getElementById('formAccountStatus')?.value || 'Not Invited', 'Not Invited'),
            lmsRole: normalizeText(document.getElementById('formLmsRole')?.value || PLATFORM_ROLE_META[platformRole]?.lmsRole || 'Viewer', 'Viewer'),
            lastLogin: normalizeText(document.getElementById('formLastLogin')?.value || ''),
            updatedAt: todayIso(),
            createdBy: normalizeText(editing?.createdBy || getCurrentUser?.()?.name || getCurrentUser?.()?.email || 'Admin', 'Admin'),
            documents: editing?.documents || [],
            notes: normalizeText(document.getElementById('formNotes')?.value || ''),
            maxHours: Math.max(1, Number(document.getElementById('formMaxHours')?.value || editing?.maxHours || 15)),
            joinYear: normalizeText(editing?.joinYear || new Date().getFullYear(), String(new Date().getFullYear())),
            subjects: unique(parseCourses(document.getElementById('formCourses')?.value || '').map((course) => normalizeText(course.code)))
        };
    }

    function syncGroupsForStaff(nextRecord, previousRecord = null) {
        if (!KIU_STATE.availableGroups || nextRecord.platformRole === 'student_service') return;
        const assignmentKey = nextRecord.platformRole === 'ta' ? 'ta' : 'prof';
        const previousName = normalizeText(previousRecord?.name || '');
        const nextName = normalizeText(nextRecord.name || '');
        Object.keys(KIU_STATE.availableGroups || {}).forEach((courseId) => {
            const courseFaculty = typeof deriveFacultyFromSubjectId === 'function'
                ? deriveFacultyFromSubjectId(courseId)
                : nextRecord.facultyCode;
            const normalizedCourseFaculty = typeof normalizeFacultyCode === 'function'
                ? normalizeFacultyCode(courseFaculty || nextRecord.facultyCode, nextRecord.facultyCode)
                : (courseFaculty || nextRecord.facultyCode);
            if (normalizedCourseFaculty !== nextRecord.facultyCode) return;
            const shouldOwnCourse = nextRecord.subjects.includes(normalizeText(courseId));
            KIU_STATE.availableGroups[courseId] = (KIU_STATE.availableGroups[courseId] || []).map((group) => {
                const currentName = normalizeText(group?.[assignmentKey] || '');
                if (shouldOwnCourse && (!currentName || currentName === 'TBD' || currentName === 'Assigned Professor' || currentName === 'Assigned Teaching Assistant' || currentName === previousName)) {
                    return { ...group, [assignmentKey]: nextName };
                }
                if (!shouldOwnCourse && currentName === previousName) {
                    return { ...group, [assignmentKey]: assignmentKey === 'prof' ? 'Assigned Professor' : 'Assigned Teaching Assistant' };
                }
                return group;
            });
        });
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
        const baseUser = {
            ...(existingUser || {}),
            id: nextRecord.id,
            staffId: nextRecord.staffId,
            name: nextRecord.name,
            nameEn: nextRecord.nameEn,
            email: nextRecord.email,
            role: nextRecord.platformRole,
            faculty: nextRecord.facultyCode,
            facultyCode: nextRecord.facultyCode,
            status: nextRecord.status,
            photo: nextRecord.photo,
            avatar: typeof getInitialsAvatar === 'function' ? getInitialsAvatar(nextRecord.nameEn || nextRecord.name) : initials(nextRecord.nameEn || nextRecord.name),
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
        const existingIndex = KIU_STATE.users.findIndex((user) => String(user?.id || '') === String(nextRecord.id));
        if (existingIndex >= 0) {
            KIU_STATE.users[existingIndex] = baseUser;
        } else {
            KIU_STATE.users.push(baseUser);
        }
        return baseUser;
    }

    function syncScheduleSessions(nextRecord) {
        if (nextRecord.platformRole === 'student_service') return;
        if (typeof upsertScheduledSession !== 'function') return;
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
                prof: nextRecord.platformRole === 'professor' ? nextRecord.name : 'TBD',
                ta: nextRecord.platformRole === 'ta' ? nextRecord.name : 'TBD',
                faculty: nextRecord.facultyCode,
                semester: 1,
                capacity: Math.max(1, Number(session.capacity || 30)),
                registered: 0
            };
            upsertScheduledSession(courseId, sessionData, { scope: 'recurring' });
        });
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
            subjects: nextRecord.subjects
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
        const entry = ensureRecordEntry(id);
        if (!entry) return;
        entry.status = 'Archived';
        entry.updatedAt = todayIso();
        const user = KIU_STATE.users.find((item) => String(item?.id || '') === String(id));
        if (user) user.status = 'Archived';
        if (typeof saveState === 'function') saveState();
        renderStaffPage();
        showToast(`${entry.name || 'Staff member'} archived.`);
    }

    function restoreStaff(id) {
        const entry = ensureRecordEntry(id);
        if (!entry) return;
        entry.status = 'Active';
        entry.updatedAt = todayIso();
        const user = KIU_STATE.users.find((item) => String(item?.id || '') === String(id));
        if (user) user.status = 'Active';
        if (typeof saveState === 'function') saveState();
        renderStaffPage();
        showToast(`${entry.name || 'Staff member'} restored.`);
    }

    function inviteStaff(id) {
        const entry = ensureRecordEntry(id);
        if (!entry) return;
        if (entry.accountStatus !== 'Account Active') entry.accountStatus = 'Invitation Sent';
        entry.updatedAt = todayIso();
        if (typeof saveState === 'function') saveState();
        renderStaffPage();
        showToast(`Invitation status updated for ${entry.name}.`);
    }

    function toggleLogin(id) {
        const entry = ensureRecordEntry(id);
        if (!entry) return;
        entry.accountStatus = entry.accountStatus === 'Login Disabled' ? 'Account Active' : 'Login Disabled';
        entry.updatedAt = todayIso();
        if (typeof saveState === 'function') saveState();
        renderStaffPage();
        showToast(`Login status changed for ${entry.name}.`);
    }

    function markReviewed(id) {
        const entry = ensureRecordEntry(id);
        if (!entry) return;
        entry.updatedAt = todayIso();
        if (entry.accountStatus === 'Needs Review') entry.accountStatus = 'Account Active';
        entry.notes = `${entry.notes ? `${entry.notes}\n` : ''}Reviewed on ${todayIso()} by ${normalizeText(getCurrentUser?.()?.name || 'Admin', 'Admin')}.`;
        if (typeof saveState === 'function') saveState();
        renderStaffPage();
        showToast(`${entry.name} marked reviewed.`);
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
        const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiu-staff-${facultyCode.toLowerCase()}-${todayIso()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Staff directory exported as JSON.');
    }

    function exportCsv() {
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const records = getFilteredStaff(buildStaffRecords(facultyCode).records);
        const headers = ['Staff ID', 'Name', 'English Name', 'Platform Role', 'Display Role', 'Department', 'Faculty', 'Email', 'Phone', 'Office', 'Status', 'Account', 'Courses', 'Weekly Load', 'Profile Completion'];
        const rows = records.map((record) => {
            const completion = profileCompleteness(record);
            return [
                record.staffId,
                record.name,
                record.nameEn,
                getPlatformRoleLabel(record.platformRole),
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
        link.download = `kiu-staff-${facultyCode.toLowerCase()}-${todayIso()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Staff directory exported as CSV.');
    }

    function importJson(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!Array.isArray(data)) throw new Error('Expected array');
                data.forEach((item) => {
                    const record = {
                        ...buildDraftRecord(item.facultyCode || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON'), item.platformRole || 'professor'),
                        ...item,
                        platformRole: normalizeText(item.platformRole || 'professor', 'professor')
                    };
                    persistRecord(record);
                });
                renderStaffPage();
                showToast('Staff directory imported.');
            } catch (error) {
                showToast('Import failed. Please choose a valid staff JSON export.');
            }
        };
        reader.readAsText(file);
    }

    function openModal(id = null, platformRole = null) {
        const state = getStaffState();
        state.editingId = id;
        state.modalRole = platformRole || (state.editingId ? null : 'professor');
        state.modalOpen = true;
        renderStaffPage();
        window.setTimeout(() => {
            document.getElementById('formName')?.focus();
        }, 0);
    }

    function closeModal() {
        const state = getStaffState();
        state.modalOpen = false;
        state.editingId = null;
        state.modalRole = 'professor';
        renderModal([], typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON');
    }

    function updateFormPreview() {
        const next = buildFormRecord(true);
        if (!next) return;
        const completion = profileCompleteness(next);
        const chips = document.querySelector('#staff-command-modal-root .staff-hub-modal-foot .staff-hub-chips');
        if (chips) {
            chips.innerHTML = `
                <span class="staff-hub-chip ${completionTone(completion.percent)}">${completion.percent}% complete</span>
                ${completion.missing.slice(0, 3).map((item) => `<span class="staff-hub-chip is-warning">Missing ${escapeHtml(item)}</span>`).join('')}
            `;
        }
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
            state.profileTab = 'overview';
        } else {
            state.selectedId = null;
            history.replaceState('', document.title, window.location.pathname + window.location.search);
            showToast('Profile not found. Returning to staff directory.');
        }
        renderStaffPage();
    }

    function syncRoleDependentFields() {
        const platformRole = normalizeText(document.getElementById('formPlatformRole')?.value || 'professor', 'professor');
        const roleSelect = document.getElementById('formRole');
        if (!roleSelect) return;
        const currentValue = roleSelect.value;
        const nextOptions = roleTitleOptions(platformRole);
        roleSelect.innerHTML = nextOptions.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('');
        roleSelect.value = nextOptions.includes(currentValue) ? currentValue : nextOptions[0];
        const lmsRole = document.getElementById('formLmsRole');
        if (lmsRole && !getStaffState().editingId) {
            lmsRole.value = PLATFORM_ROLE_META[platformRole]?.lmsRole || 'Viewer';
        }
        const maxHours = document.getElementById('formMaxHours');
        if (maxHours && !getStaffState().editingId) {
            maxHours.value = platformRole === 'ta' ? '8' : platformRole === 'student_service' ? '40' : '15';
        }
        updateFormPreview();
    }

    function submitForm(event) {
        event.preventDefault();
        const next = buildFormRecord(false);
        if (!next) return;
        const wasEditing = Boolean(getStaffState().editingId);
        persistRecord(next);
        const state = getStaffState();
        state.selectedId = next.id;
        state.profileTab = 'overview';
        closeModal();
        renderStaffPage();
        showToast(`${next.name} ${wasEditing ? 'updated' : 'added'}.`);
    }

    function handleAction(action, element) {
        const staffId = element?.dataset?.staffId || '';
        if (action === 'open-create') {
            openModal(null, element?.dataset?.staffRole || 'professor');
            return;
        }
        if (action === 'clear-filters') {
            clearFilters();
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
            openModal(staffId, record?.platformRole || 'professor');
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
            state.profileTab = element.dataset.staffTab || 'overview';
            renderStaffPage();
            return;
        }
        if (action === 'close-modal' || action === 'dismiss-modal') {
            closeModal();
            return;
        }
        if (action === 'preview-form') {
            updateFormPreview();
            showToast('Profile completeness preview updated.');
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
            if (view === 'all') {
                state.filters = { ...DEFAULT_FILTERS };
            } else if (view === 'account-review') {
                state.filters = { ...state.filters, account: 'Needs Review', archive: 'active', sort: 'name' };
            } else if (view === 'overloaded') {
                state.filters = { ...state.filters, teaching: 'heavy-load', archive: 'active', sort: 'completion' };
            } else if (view === 'unassigned') {
                state.filters = { ...state.filters, profile: 'missing-courses', archive: 'active', sort: 'name' };
            }
            renderStaffPage();
            return;
        }
        if (action === 'open-platform-profile') {
            const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
            const records = buildStaffRecords(facultyCode).records;
            const record = records.find((item) => item.id === staffId);
            if (!record) return;
            ensureDirectoryProfileBridge()
                .then(() => {
                    if (typeof openProfilePage !== 'function') {
                        showToast('Canonical profile tools are unavailable right now.');
                        return;
                    }
                    openProfilePage(record.platformRole === 'student_service' ? 'student_service' : record.platformRole, record.id, record.facultyCode || facultyCode);
                })
                .catch(() => {
                    showToast('Could not open the canonical profile right now.');
                });
            return;
        }
        if (action === 'message') {
            showToast('Messaging requires LMS or email integration.');
        }
    }

    function bindEvents() {
        if (window.__staffCommandBound) return;
        window.__staffCommandBound = true;

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
            if (event.target.closest('#staff-command-modal-root')) {
                updateFormPreview();
            }
        });

        document.addEventListener('change', (event) => {
            if (event.target.id === 'staff-role-filter') return setFilter('role', event.target.value);
            if (event.target.id === 'staff-department-filter') return setFilter('department', event.target.value);
            if (event.target.id === 'staff-status-filter') return setFilter('status', event.target.value);
            if (event.target.id === 'staff-account-filter') return setFilter('account', event.target.value);
            if (event.target.id === 'staff-profile-filter') return setFilter('profile', event.target.value);
            if (event.target.id === 'staff-teaching-filter') return setFilter('teaching', event.target.value);
            if (event.target.id === 'staff-archive-filter') return setFilter('archive', event.target.value);
            if (event.target.id === 'staff-sort-filter') return setFilter('sort', event.target.value);
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
            if (event.target.id === 'formPlatformRole') {
                syncRoleDependentFields();
                return;
            }
            if (event.target.closest('#staff-command-modal-root')) {
                updateFormPreview();
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
        const facultyCode = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
        const { records, unassignedSections } = buildStaffRecords(facultyCode);
        const stats = platformCounts(records);
        const container = document.getElementById('staff-content');
        if (!container) return;
        container.classList.add('staff-command-root');
        const state = getStaffState();
        const selected = activeSelection(records);
        container.innerHTML = selected ? renderProfile(selected) : renderDirectory(records, facultyCode, stats, unassignedSections);
        renderModal(records, facultyCode);
        if (typeof queueEnglishLocalization === 'function') {
            queueEnglishLocalization(container);
            const modalRoot = document.getElementById('staff-command-modal-root');
            if (modalRoot && !modalRoot.hasAttribute('hidden')) {
                queueEnglishLocalization(modalRoot);
            }
        }
        if (typeof queueLuxuryTransparencyRefresh === 'function') {
            queueLuxuryTransparencyRefresh();
        }
        if (document.documentElement?.classList.contains('kiu-shell-loading')) {
            document.documentElement.classList.remove('kiu-shell-loading');
        }
        document.body?.classList.remove('kiu-shell-loading');
    }

    function consumePendingAdminAccountFlow() {
        const pending = localStorage.getItem(FLOW_KEY);
        if (!pending) return;
        if (['professor', 'ta', 'student_service'].includes(pending)) {
            localStorage.removeItem(FLOW_KEY);
            openModal(null, pending);
        }
    }

    function openProfRegistration(role) {
        openModal(null, role || 'professor');
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
        }, { once: true });
    } else {
        consumePendingAdminAccountFlow();
    }
})();
