(function initStudentsAdminLmsModule() {
    'use strict';

    const YEAR_OPTIONS = ['Foundation', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Graduate'];
    const STANDINGS = ['Excellent', 'Good Standing', 'Warning', 'Probation', 'At Risk', 'Incomplete'];
    const ACCOUNT_STATUSES = ['Not Invited', 'Invitation Sent', 'Account Active', 'Login Disabled', 'Needs Review'];
    const DOC_STATUSES = ['Complete', 'Missing', 'Under Review', 'Expired', 'Rejected'];
    const ENROLLMENT_TYPES = ['Full-time', 'Part-time', 'Exchange Student', 'Visiting Student', 'Not Enrolled'];

    const MOBILITY_CATEGORIES = [
        { value: 'degree', label: 'Degree-seeking' },
        { value: 'exchange_incoming', label: 'Exchange incoming' },
        { value: 'visiting_incoming', label: 'Visiting incoming' },
        { value: 'exchange_outgoing', label: 'Exchange outgoing' },
        { value: 'internal_transfer', label: 'Internal KIU transfer' }
    ];

    const MOBILITY_FILTER_OPTIONS = [
        { value: 'all', label: 'All mobility types' },
        { value: 'exchange_incoming', label: 'Incoming exchange' },
        { value: 'visiting_incoming', label: 'Incoming visiting' },
        { value: 'exchange_outgoing', label: 'Outgoing' },
        { value: 'internal_transfer', label: 'Internal transfer' },
        { value: 'degree', label: 'Degree-seeking' }
    ];

    const MOBILITY_DIRECTION_BY_CATEGORY = {
        degree: 'none',
        exchange_incoming: 'incoming',
        visiting_incoming: 'incoming',
        exchange_outgoing: 'outgoing',
        internal_transfer: 'internal'
    };

    const DEFAULT_MOBILITY = {
        category: 'degree',
        direction: 'none',
        homeInstitution: '',
        homeCountry: '',
        hostProgram: '',
        startDate: '',
        endDate: '',
        agreementRef: '',
        internalFromFaculty: '',
        internalFromProgram: '',
        notes: ''
    };

    const uiState = window.__studentsAdminLmsState || {
        query: '',
        faculty: 'all',
        status: 'all',
        program: 'all',
        year: 'all',
        standing: 'all',
        account: 'all',
        profile: 'all',
        enrollment: 'all',
        mobility: 'all',
        risk: 'all',
        archive: 'active',
        sort: 'name',
        view: 'directory',
        selectedId: null,
        selectedFaculty: null,
        tab: 'overview',
        editingId: null
    };

    window.__studentsAdminLmsState = uiState;

    function escapeHtmlCompat(value) {
        if (typeof escapeDirectoryHtml === 'function') return escapeDirectoryHtml(value);
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function currentFacultyCode() {
        return typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    }

    function normalizeFaculty(code) {
        return typeof normalizeFacultyCode === 'function'
            ? normalizeFacultyCode(code || currentFacultyCode(), currentFacultyCode())
            : String(code || currentFacultyCode() || 'ECON').trim().toUpperCase();
    }

    function getFacultyLabelSafe(code) {
        if (typeof getFacultyLabel === 'function') return getFacultyLabel(code);
        return String(code || '');
    }

    function facultyProfile(code) {
        if (typeof getFacultyProfile === 'function') return getFacultyProfile(code);
        return { name: getFacultyLabelSafe(code), color: '#C2862A' };
    }

    function studentAccountState(student = {}) {
        if (typeof getDirectoryMicrosoftState === 'function') return getDirectoryMicrosoftState(student);
        const email = String(student.email || '').trim().toLowerCase();
        const linked = Boolean(email && (email.endsWith('@kiu.edu.ge') || email.endsWith('@student.kiu.edu.ge')));
        return {
            linked,
            label: linked ? 'Microsoft linked' : 'Microsoft check',
            tone: linked ? 'success' : 'warning'
        };
    }

    function studentDirectorySignals(student = {}) {
        if (typeof getStudentDirectorySignals === 'function') return getStudentDirectorySignals(student);
        const id = String(student.id || student.studentId || '');
        const balance = Number(KIU_STATE?.tuitionBalances?.[id] || student.balance || student.tuitionBalance || 0);
        const gpa = Number(student.gpa || 0);
        const status = String(student.status || '').toLowerCase();
        const probation = Boolean(KIU_STATE?.probationStatus?.[id] || status === 'probation');
        const suspended = status === 'suspended';
        const holdLabels = [];
        if (balance > 0) holdLabels.push('Finance hold');
        if (probation) holdLabels.push('Probation');
        if (suspended) holdLabels.push('Suspended');
        return {
            balance,
            probation,
            suspended,
            risk: suspended || balance > 0 || probation || gpa < 2,
            holdLabels,
            holdLabel: holdLabels.length ? holdLabels.join(', ') : 'Clear',
            holdTone: suspended || balance > 0 ? 'danger' : probation ? 'warning' : 'success',
            gpaTone: gpa >= 3.5 ? 'success' : gpa >= 2.5 ? 'warning' : 'danger'
        };
    }

    function today() {
        return new Date().toISOString().slice(0, 10);
    }

    function daysSince(dateString) {
        if (!dateString) return 999;
        const date = new Date(`${dateString}T00:00:00`);
        if (Number.isNaN(date.getTime())) return 999;
        return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
    }

    function ensureStyles() {
        return Boolean(document.querySelector('link[href*="students-admin-lms.css"]'));
    }

    function ensureRouteNodes() {
        const root = document.getElementById('students-content');
        if (!root) return null;
        if (!document.getElementById('students-admin-lms-toast')) {
            const toast = document.createElement('div');
            toast.id = 'students-admin-lms-toast';
            toast.setAttribute('role', 'status');
            toast.setAttribute('aria-live', 'polite');
            document.body.appendChild(toast);
        }
        if (!document.getElementById('students-admin-lms-import')) {
            const input = document.createElement('input');
            input.id = 'students-admin-lms-import';
            input.type = 'file';
            input.accept = 'application/json';
            input.style.display = 'none';
            document.body.appendChild(input);
            input.addEventListener('change', handleImportChange);
        }
        if (!document.getElementById('students-admin-lms-modal')) {
            const modal = document.createElement('div');
            modal.id = 'students-admin-lms-modal';
            modal.innerHTML = renderModalShell();
            document.body.appendChild(modal);
            bindModalStaticEvents(modal);
        }
        return root;
    }

    function getAdminProfileStore() {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!KIU_STATE.studentAdminProfiles || typeof KIU_STATE.studentAdminProfiles !== 'object') {
            KIU_STATE.studentAdminProfiles = {};
        }
        return KIU_STATE.studentAdminProfiles;
    }

    function getAdminProfile(id) {
        return getAdminProfileStore()[String(id)] || {};
    }

    function saveAdminProfile(id, patch) {
        const store = getAdminProfileStore();
        const key = String(id);
        store[key] = { ...(store[key] || {}), ...patch };
        return store[key];
    }

    function normalizeStudentMobility(profile = {}) {
        const mobility = { ...DEFAULT_MOBILITY, ...(profile.mobility && typeof profile.mobility === 'object' ? profile.mobility : {}) };
        const hasStoredMobility = profile.mobility && typeof profile.mobility === 'object' && profile.mobility.category;

        if (!hasStoredMobility && profile.enrollmentType) {
            if (profile.enrollmentType === 'Exchange Student') {
                mobility.category = 'exchange_incoming';
                mobility.direction = 'incoming';
            } else if (profile.enrollmentType === 'Visiting Student') {
                mobility.category = 'visiting_incoming';
                mobility.direction = 'incoming';
            }
        }

        if (!MOBILITY_CATEGORIES.some(item => item.value === mobility.category)) {
            mobility.category = 'degree';
        }
        mobility.direction = MOBILITY_DIRECTION_BY_CATEGORY[mobility.category] || 'none';
        return mobility;
    }

    function enrollmentTypeFromMobility(mobility, subjectIds = []) {
        const normalized = normalizeStudentMobility({ mobility });
        switch (normalized.category) {
            case 'exchange_incoming':
            case 'exchange_outgoing':
                return 'Exchange Student';
            case 'visiting_incoming':
                return 'Visiting Student';
            case 'internal_transfer':
            case 'degree':
            default:
                if (!subjectIds.length) return 'Not Enrolled';
                return subjectIds.length >= 4 ? 'Full-time' : 'Part-time';
        }
    }

    function syncEnrollmentTypeFromMobility(profile, subjectIds = []) {
        const mobility = normalizeStudentMobility(profile);
        const enrollmentType = enrollmentTypeFromMobility(mobility, subjectIds);
        return { ...profile, mobility, enrollmentType };
    }

    function isMobilityStudent(studentOrProfile) {
        const mobility = studentOrProfile?.mobility
            ? normalizeStudentMobility({ mobility: studentOrProfile.mobility })
            : normalizeStudentMobility(studentOrProfile || {});
        return mobility.category !== 'degree' || mobility.direction !== 'none';
    }

    function mobilityBadgeLabel(student) {
        const mobility = student.mobility || normalizeStudentMobility(getAdminProfile(student.id));
        const labels = {
            exchange_incoming: 'Exchange incoming',
            visiting_incoming: 'Visiting incoming',
            exchange_outgoing: 'Outgoing',
            internal_transfer: 'Internal transfer'
        };
        return labels[mobility.category] || '';
    }

    function matchesMobilityFilter(student, filter) {
        if (!filter || filter === 'all') return true;
        const mobility = student.mobility || normalizeStudentMobility(getAdminProfile(student.id));
        return mobility.category === filter;
    }

    function mobilityCategoryLabel(category) {
        return MOBILITY_CATEGORIES.find(item => item.value === category)?.label || 'Degree-seeking';
    }

    function formatMobilityPeriod(startDate, endDate) {
        const formatPart = value => {
            if (!value) return '';
            const date = new Date(`${value}T00:00:00`);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        };
        const start = formatPart(startDate);
        const end = formatPart(endDate);
        if (start && end) return `${start} – ${end}`;
        return start || end || '';
    }

    function missingMobilityFields(student) {
        const mobility = student.mobility || normalizeStudentMobility(getAdminProfile(student.id));
        const missing = [];
        if (!['exchange_incoming', 'visiting_incoming', 'exchange_outgoing'].includes(mobility.category)) return missing;
        if (!mobility.homeInstitution) missing.push('home institution');
        if (!mobility.startDate || !mobility.endDate) missing.push('mobility dates');
        return missing;
    }

    function readMobilityFromForm() {
        const category = value('form-mobility-category') || 'degree';
        return normalizeStudentMobility({
            mobility: {
                category,
                direction: MOBILITY_DIRECTION_BY_CATEGORY[category] || 'none',
                homeInstitution: value('form-home-institution'),
                homeCountry: value('form-home-country'),
                hostProgram: value('form-host-program'),
                startDate: value('form-mobility-start'),
                endDate: value('form-mobility-end'),
                agreementRef: value('form-agreement-ref'),
                internalFromFaculty: value('form-internal-from-faculty'),
                internalFromProgram: value('form-internal-from-program'),
                notes: value('form-mobility-notes')
            }
        });
    }

    function mobilityFormVisibilityGroups(category) {
        if (['exchange_incoming', 'visiting_incoming'].includes(category)) return ['incoming'];
        if (category === 'exchange_outgoing') return ['outgoing'];
        if (category === 'internal_transfer') return ['internal', 'incoming'];
        return [];
    }

    function updateMobilityFormVisibility() {
        const category = value('form-mobility-category') || 'degree';
        const groups = mobilityFormVisibilityGroups(category);
        const direction = MOBILITY_DIRECTION_BY_CATEGORY[category] || 'none';
        const directionNode = document.getElementById('form-mobility-direction');
        if (directionNode) directionNode.textContent = direction === 'none' ? 'None' : direction.charAt(0).toUpperCase() + direction.slice(1);

        document.querySelectorAll('[data-mobility-show]').forEach(node => {
            const required = String(node.getAttribute('data-mobility-show') || '').split('|').filter(Boolean);
            const visible = required.some(group => groups.includes(group));
            node.hidden = !visible;
        });
    }

    function mobilityCategoryOptionsMarkup(selected = 'degree') {
        return MOBILITY_CATEGORIES.map(item => `<option value="${escapeHtmlCompat(item.value)}" ${selected === item.value ? 'selected' : ''}>${escapeHtmlCompat(item.label)}</option>`).join('');
    }

    function mobilityFilterOptionsMarkup() {
        return MOBILITY_FILTER_OPTIONS.map(item => `<option value="${escapeHtmlCompat(item.value)}" ${uiState.mobility === item.value ? 'selected' : ''}>${escapeHtmlCompat(item.label)}</option>`).join('');
    }

    function baseStudentRecords() {
        if (typeof getAllStudents === 'function') {
            const records = getAllStudents('all') || [];
            const seen = new Set();
            return records.filter(record => {
                const key = `${record.id}::${normalizeFaculty(record.facultyCode || record.faculty)}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        const students = [];
        Object.entries(KIU_STATE?.facultyProfiles || {}).forEach(([facultyCode, profile]) => {
            (profile?.students || []).forEach(student => students.push({ ...student, facultyCode }));
        });
        return students;
    }

    function findRosterGradeItems(studentId) {
        const gradeItems = [];
        Object.entries(KIU_STATE?.studentGrades || {}).forEach(([courseId, roster]) => {
            const entry = (Array.isArray(roster) ? roster : []).find(item => String(item?.id || '') === String(studentId));
            if (!entry) return;
            gradeItems.push({
                item: 'Final Grade',
                course: courseId,
                due: '',
                status: Number(entry.final || 0) > 0 ? 'Graded' : 'Pending',
                score: Number(entry.final || 0),
                feedback: entry.letter ? `Letter grade ${entry.letter}` : 'Awaiting final grade.'
            });
        });
        return gradeItems;
    }

    function getCurriculumMap() {
        const all = typeof getActiveCurriculum === 'function' ? getActiveCurriculum('all') : [];
        const map = new Map();
        (all || []).forEach(item => map.set(String(item.id), item));
        return map;
    }

    function deriveYearLabel(student, profile) {
        if (profile.yearLabel) return profile.yearLabel;
        const course = Number(student.course || 0);
        if (!course) return 'Foundation';
        if (course >= 6) return 'Graduate';
        return `Year ${Math.max(1, Math.ceil(course))}`;
    }

    function deriveStanding(student, profile) {
        if (profile.academicStanding) return profile.academicStanding;
        if (profile.archived) return 'Incomplete';
        const probation = Boolean(KIU_STATE?.probationStatus?.[student.id] || profile.probation || String(student.status || '').toLowerCase() === 'probation');
        const gpa = Number(student.gpa || 0);
        if (probation || gpa < 2) return 'At Risk';
        if (gpa >= 3.6) return 'Excellent';
        if (gpa >= 2.5) return 'Good Standing';
        if (gpa > 0) return 'Warning';
        return 'Incomplete';
    }

    function deriveAccountStatus(student, profile) {
        if (profile.accountStatus) return profile.accountStatus;
        const account = studentAccountState(student);
        if (profile.loginEnabled === false) return 'Login Disabled';
        return account.linked ? 'Account Active' : 'Needs Review';
    }

    function deriveDocumentStatus(student, profile) {
        if (profile.documentStatus) return profile.documentStatus;
        return student.email ? 'Complete' : 'Missing';
    }

    function deriveEnrollmentType(student, profile, subjectIds) {
        const mobility = normalizeStudentMobility(profile);
        if (mobility.category !== 'degree') {
            return enrollmentTypeFromMobility(mobility, subjectIds);
        }
        if (profile.enrollmentType) return profile.enrollmentType;
        if (!subjectIds.length) return 'Not Enrolled';
        return subjectIds.length >= 4 ? 'Full-time' : 'Part-time';
    }

    function deriveStatus(student, profile) {
        if (profile.archived) return 'Archived';
        if (profile.status) return profile.status;
        if (String(student.status || '').toLowerCase() === 'suspended') return 'Suspended';
        if (KIU_STATE?.probationStatus?.[student.id]) return 'Probation';
        return student.status || 'Active';
    }

    function deriveCourses(student, profile, curriculumMap) {
        const scheduleEntries = Array.isArray(KIU_STATE?.studentSchedulesByStudent?.[student.id])
            ? KIU_STATE.studentSchedulesByStudent[student.id]
            : [];
        const subjects = Array.isArray(student.subjects) ? student.subjects : [];
        const merged = [];
        const seen = new Set();

        scheduleEntries.forEach(entry => {
            const courseId = String(entry.courseId || '');
            const curriculum = curriculumMap.get(courseId);
            if (!courseId || seen.has(courseId)) return;
            seen.add(courseId);
            const gradeItem = findRosterGradeItems(student.id).find(item => String(item.course) === courseId);
            merged.push({
                code: courseId,
                name: entry.courseName || curriculum?.name || courseId,
                instructor: entry.prof || curriculum?.prof || curriculum?.instructor || profile.courseInstructors?.[courseId] || 'Faculty assignment pending',
                credits: Number(entry.ects || curriculum?.ects || 6),
                section: entry.groupName || entry.groupId || 'G1',
                status: 'Enrolled',
                progress: Math.max(0, Math.min(100, Number(profile.courseProgress?.[courseId] ?? gradeItem?.score ?? 0))),
                lastActivity: profile.lastActivity?.[courseId] || profile.lastLogin || '',
                grade: gradeItem?.feedback?.replace('Letter grade ', '') || gradeItem?.score || 'In Progress'
            });
        });

        subjects.forEach(subjectId => {
            const code = String(subjectId || '');
            const curriculum = curriculumMap.get(code);
            if (!code || seen.has(code)) return;
            seen.add(code);
            const gradeItem = findRosterGradeItems(student.id).find(item => String(item.course) === code);
            merged.push({
                code,
                name: curriculum?.name || code,
                instructor: curriculum?.prof || curriculum?.instructor || 'Faculty assignment pending',
                credits: Number(curriculum?.ects || 6),
                section: 'Curriculum',
                status: 'Enrolled',
                progress: Math.max(0, Math.min(100, Number(profile.courseProgress?.[code] ?? gradeItem?.score ?? 0))),
                lastActivity: profile.lastActivity?.[code] || profile.lastLogin || '',
                grade: gradeItem?.feedback?.replace('Letter grade ', '') || 'In Progress'
            });
        });

        return merged;
    }

    function buildNormalizedStudent(student) {
        const profile = getAdminProfile(student.id);
        const mobility = normalizeStudentMobility(profile);
        const curriculumMap = getCurriculumMap();
        const courses = deriveCourses(student, profile, curriculumMap);
        const subjectIds = Array.isArray(student.subjects) ? student.subjects : [];
        const gradeItems = profile.gradeItems || findRosterGradeItems(student.id);
        const docStatus = deriveDocumentStatus(student, profile);
        const status = deriveStatus(student, profile);
        const facultyCode = normalizeFaculty(student.facultyCode || student.faculty);
        const faculty = facultyProfile(facultyCode);

        return {
            id: String(student.id),
            studentId: String(student.id),
            name: student.name || student.nameEn || 'Unnamed Student',
            nameEn: student.nameEn || '',
            email: student.email || '',
            personalEmail: profile.personalEmail || '',
            phone: profile.phone || student.phone || '',
            status,
            program: profile.program || student.program || 'Program pending',
            faculty: faculty.name || facultyCode,
            facultyCode,
            year: deriveYearLabel(student, profile),
            academicStanding: deriveStanding(student, profile),
            gpa: Number(student.gpa || 0),
            creditsEarned: Number(student.ectsEarned || student.ects || 0),
            enrollmentType: deriveEnrollmentType(student, profile, subjectIds),
            mobility,
            semester: profile.semesterLabel || `Semester ${student.semester || 1}`,
            campus: profile.campus || 'Kutaisi Main Campus',
            advisor: profile.advisor || '',
            advisorEmail: profile.advisorEmail || '',
            expectedGraduation: profile.expectedGraduation || '',
            documentStatus: docStatus,
            accountStatus: deriveAccountStatus(student, profile),
            loginEnabled: profile.loginEnabled !== false,
            lastLogin: profile.lastLogin || '',
            attendance: Number(profile.attendance || 0),
            missingAssignments: Number(profile.missingAssignments || 0),
            emergencyContact: profile.emergencyContact || '',
            notes: profile.notes || '',
            interests: Array.isArray(profile.interests) ? profile.interests : [],
            languages: Array.isArray(profile.languages) ? profile.languages : [],
            accommodations: Boolean(profile.accommodations),
            courses,
            gradeItems,
            documents: Array.isArray(profile.documents) ? profile.documents : [
                { name: 'ID / Passport', status: docStatus === 'Complete' ? 'Approved' : docStatus, required: true },
                { name: 'Enrollment Agreement', status: docStatus === 'Complete' ? 'Approved' : docStatus, required: true }
            ],
            attendanceRecords: Array.isArray(profile.attendanceRecords) ? profile.attendanceRecords : [],
            createdAt: profile.createdAt || String(student.joinYear || ''),
            updatedAt: profile.updatedAt || '',
            source: profile.source || 'KIU_STATE',
            avatar: student.avatar || '',
            photo: student.photo || '',
            baseRecord: student
        };
    }

    function normalizedStudents() {
        return baseStudentRecords().map(buildNormalizedStudent);
    }

    function initials(name) {
        return String(name || 'Student')
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(part => part[0].toUpperCase())
            .join('') || 'ST';
    }

    function showToast(message) {
        const toast = document.getElementById('students-admin-lms-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        clearTimeout(showToast.timer);
        showToast.timer = setTimeout(() => toast.classList.remove('visible'), 2600);
    }

    function badgeClass(value) {
        const normalized = String(value || '').toLowerCase();
        if (['active', 'account active', 'excellent', 'good standing', 'complete', 'approved', 'graded', 'present', 'enrolled'].includes(normalized)) return 'success';
        if (['pending setup', 'invitation sent', 'warning', 'under review', 'late', 'submitted', 'needs review', 'probation'].includes(normalized)) return 'warning';
        if (['suspended', 'withdrawn', 'archived', 'at risk', 'missing', 'expired', 'rejected', 'login disabled', 'absent', 'finance hold'].includes(normalized)) return 'danger';
        return 'primary';
    }

    function statusBadge(value) {
        const cls = badgeClass(value);
        return `<span class="students-lms-pill is-${cls}">${escapeHtmlCompat(value || 'Unknown')}</span>`;
    }

    function completion(student) {
        const checks = [
            Boolean(student.name),
            Boolean(student.studentId),
            Boolean(student.email),
            Boolean(student.phone),
            Boolean(student.program),
            Boolean(student.year),
            Boolean(student.faculty),
            Boolean(student.advisor),
            Boolean(student.emergencyContact),
            Boolean(student.accountStatus && student.accountStatus !== 'Not Invited'),
            Boolean((student.courses || []).length) || ['Graduated', 'On Leave', 'Archived'].includes(student.status),
            student.documentStatus === 'Complete',
            Boolean(student.lastLogin) || student.accountStatus !== 'Account Active'
        ];
        return Math.round((checks.filter(Boolean).length / checks.length) * 100);
    }

    function missingProfile(student) {
        const missing = [];
        if (!student.phone) missing.push('phone');
        if (!student.faculty) missing.push('faculty');
        if (!student.advisor) missing.push('advisor');
        if (!student.emergencyContact) missing.push('emergency contact');
        if (student.documentStatus !== 'Complete') missing.push('documents');
        if (student.accountStatus === 'Not Invited') missing.push('account invitation');
        if (!student.lastLogin && student.accountStatus === 'Account Active') missing.push('last login');
        if (!(student.courses || []).length && !['Graduated', 'On Leave', 'Archived'].includes(student.status)) missing.push('course enrollment');
        return missing;
    }

    function risk(student) {
        if (['Graduated', 'On Leave', 'Archived', 'Withdrawn'].includes(student.status)) return 'Inactive';
        let score = 0;
        const gpa = Number(student.gpa || 0);
        const attendance = Number(student.attendance || 0);
        const missingAssignments = Number(student.missingAssignments || 0);

        if (gpa < 2) score += 3;
        else if (gpa < 2.5) score += 2;

        if (attendance && attendance < 65) score += 3;
        else if (attendance && attendance < 80) score += 2;

        if (missingAssignments >= 6) score += 3;
        else if (missingAssignments >= 3) score += 2;

        if (daysSince(student.lastLogin) > 14 && student.accountStatus === 'Account Active') score += 2;
        if (['At Risk', 'Probation', 'Warning'].includes(student.academicStanding)) score += 2;
        if (studentDirectorySignals(student.baseRecord).holdLabels.length) score += 2;

        if (score >= 6) return 'High';
        if (score >= 3) return 'Medium';
        return 'Low';
    }

    function riskBadge(student) {
        const level = risk(student);
        const cls = level === 'High' ? 'danger' : level === 'Medium' ? 'warning' : level === 'Inactive' ? 'muted' : 'success';
        return `<span class="students-lms-pill is-${cls}">${escapeHtmlCompat(level)} risk</span>`;
    }

    function progressClass(value) {
        if (value < 55) return 'is-danger';
        if (value < 75) return 'is-warning';
        return '';
    }

    function activeScopedStudents() {
        let students = normalizedStudents();
        if (uiState.faculty !== 'all') students = students.filter(student => student.facultyCode === uiState.faculty);
        if (uiState.archive === 'active') students = students.filter(student => student.status !== 'Archived');
        if (uiState.archive === 'archived') students = students.filter(student => student.status === 'Archived');
        return students;
    }

    function metrics() {
        const students = activeScopedStudents();
        return {
            total: students.length,
            active: students.filter(student => student.status === 'Active').length,
            enrolled: students.filter(student => (student.courses || []).length > 0).length,
            atRisk: students.filter(student => ['High', 'Medium'].includes(risk(student))).length,
            pending: students.filter(student => ['Not Invited', 'Invitation Sent', 'Needs Review'].includes(student.accountStatus)).length,
            missingDocs: students.filter(student => student.documentStatus !== 'Complete').length,
            archived: normalizedStudents().filter(student => student.status === 'Archived').length,
            incomingMobility: students.filter(student => ['exchange_incoming', 'visiting_incoming'].includes((student.mobility || {}).category)).length,
            outgoingMobility: students.filter(student => (student.mobility || {}).category === 'exchange_outgoing').length
        };
    }

    function filteredStudents() {
        const q = String(uiState.query || '').trim().toLowerCase();
        let rows = activeScopedStudents().filter(student => {
            if (uiState.status !== 'all' && student.status !== uiState.status) return false;
            if (uiState.program !== 'all' && student.program !== uiState.program) return false;
            if (uiState.year !== 'all' && student.year !== uiState.year) return false;
            if (uiState.standing !== 'all' && student.academicStanding !== uiState.standing) return false;
            if (uiState.account !== 'all' && student.accountStatus !== uiState.account) return false;
            if (uiState.enrollment !== 'all') {
                if (uiState.enrollment === 'Enrolled' && !(student.courses || []).length) return false;
                if (uiState.enrollment === 'Not Enrolled' && (student.courses || []).length) return false;
                if (!['Enrolled', 'Not Enrolled'].includes(uiState.enrollment) && student.enrollmentType !== uiState.enrollment) return false;
            }
            if (uiState.profile === 'Complete' && completion(student) < 90) return false;
            if (uiState.profile === 'Incomplete' && completion(student) >= 90) return false;
            if (uiState.profile === 'Missing Documents' && student.documentStatus === 'Complete') return false;
            if (uiState.profile === 'Missing Advisor' && student.advisor) return false;
            if (uiState.risk !== 'all' && risk(student) !== uiState.risk) return false;
            if (uiState.mobility !== 'all' && !matchesMobilityFilter(student, uiState.mobility)) return false;
            if (!q) return true;
            const mobility = student.mobility || {};
            const haystack = [
                student.name, student.nameEn, student.studentId, student.email, student.personalEmail, student.phone,
                student.program, student.faculty, student.year, student.status, student.academicStanding,
                student.advisor, student.accountStatus, student.documentStatus, student.campus,
                mobility.homeInstitution, mobility.homeCountry, mobility.agreementRef, mobility.internalFromFaculty,
                mobility.internalFromProgram, mobilityCategoryLabel(mobility.category),
                ...(student.courses || []).map(course => `${course.code} ${course.name} ${course.instructor}`)
            ].join(' ').toLowerCase();
            return haystack.includes(q);
        });

        rows.sort((a, b) => {
            if (uiState.sort === 'studentId') return a.studentId.localeCompare(b.studentId);
            if (uiState.sort === 'program') return a.program.localeCompare(b.program) || a.name.localeCompare(b.name);
            if (uiState.sort === 'year') return a.year.localeCompare(b.year) || a.name.localeCompare(b.name);
            if (uiState.sort === 'gpa') return Number(b.gpa || 0) - Number(a.gpa || 0);
            if (uiState.sort === 'updated') return String(b.updatedAt || '').localeCompare(String(a.updatedAt || ''));
            if (uiState.sort === 'risk') {
                const weight = { High: 3, Medium: 2, Low: 1, Inactive: 0 };
                return (weight[risk(b)] || 0) - (weight[risk(a)] || 0) || a.name.localeCompare(b.name);
            }
            if (uiState.sort === 'completion') return completion(b) - completion(a);
            return a.name.localeCompare(b.name);
        });
        return rows;
    }

    function activeFiltersMarkup() {
        const chips = [];
        [
            ['faculty', 'Faculty'],
            ['status', 'Status'],
            ['program', 'Program'],
            ['year', 'Year'],
            ['standing', 'Standing'],
            ['account', 'Account'],
            ['profile', 'Profile'],
            ['enrollment', 'Enrollment'],
            ['mobility', 'Mobility'],
            ['risk', 'Risk'],
            ['archive', 'Archive']
        ].forEach(([key, label]) => {
            if ((key === 'archive' && uiState[key] !== 'active') || (key !== 'archive' && uiState[key] !== 'all')) {
                const value = key === 'faculty' ? getFacultyLabelSafe(uiState[key]) : uiState[key];
                chips.push(`<span class="students-lms-pill is-muted">${escapeHtmlCompat(label)}: ${escapeHtmlCompat(value)}</span>`);
            }
        });
        if (uiState.query) chips.push(`<span class="students-lms-pill is-muted">Search: ${escapeHtmlCompat(uiState.query)}</span>`);
        return chips.length ? chips.join('') : '<span class="students-lms-pill is-muted">No active filters</span>';
    }

    function renderAvatar(student, large = false) {
        const photo = student.photo || student.baseRecord?.photo || '';
        const cls = large ? 'students-lms-avatar large' : 'students-lms-avatar';
        const studentInitials = initials(student.nameEn || student.name);
        if (photo) {
            return `<span class="${cls}" data-initials="${escapeHtmlCompat(studentInitials)}"><img class="students-lms-avatar-img" src="${escapeHtmlCompat(photo)}" alt="" loading="lazy" onerror="this.remove();"></span>`;
        }
        return `<span class="${cls}" data-initials="${escapeHtmlCompat(studentInitials)}">${escapeHtmlCompat(studentInitials)}</span>`;
    }

    function metricCard(label, value, note) {
        return `
            <article class="students-lms-stat-card lux-strip-card surface-card">
                <span>${escapeHtmlCompat(label)}</span>
                <strong>${escapeHtmlCompat(value)}</strong>
                <small>${escapeHtmlCompat(note)}</small>
            </article>
        `;
    }

    function commandCard(label, value, note, tone = '') {
        const toneClass = tone ? ` is-${tone}` : '';
        return `
            <article class="students-lms-command-card${toneClass}">
                <span>${escapeHtmlCompat(label)}</span>
                <strong>${escapeHtmlCompat(value)}</strong>
                <small>${escapeHtmlCompat(note)}</small>
            </article>
        `;
    }

    function renderStudentRow(student) {
        const completionValue = completion(student);
        const archived = student.status === 'Archived';
        const mobilityPill = mobilityBadgeLabel(student);
        return `
            <tr class="${archived ? 'is-risk-row' : ''}">
                <td class="students-lms-student-cell">
                    <div class="students-lms-person">
                        ${renderAvatar(student)}
                        <div>
                            <div class="students-lms-name">${escapeHtmlCompat(student.name)}${mobilityPill ? ` <span class="students-lms-pill is-primary">${escapeHtmlCompat(mobilityPill)}</span>` : ''}</div>
                            <div class="students-lms-meta">${escapeHtmlCompat(student.studentId)} &middot; ${escapeHtmlCompat(student.email || 'No institutional email')}</div>
                        </div>
                    </div>
                </td>
                <td><div class="students-lms-cell-stack"><strong>${escapeHtmlCompat(student.program)}</strong><small>${escapeHtmlCompat(student.faculty)}</small></div></td>
                <td><div class="students-lms-cell-stack"><strong>${escapeHtmlCompat(student.year)} &middot; ${escapeHtmlCompat(student.enrollmentType)}</strong><small>${(student.courses || []).length} courses &middot; ${escapeHtmlCompat(student.semester)}</small></div></td>
                <td><div class="students-lms-cell-stack wide">${statusBadge(student.academicStanding)}<small>GPA ${Number(student.gpa || 0).toFixed(2)} &middot; ${student.creditsEarned || 0} ECTS</small></div></td>
                <td><div class="students-lms-cell-stack wide">${riskBadge(student)}<small>${student.attendance || 0}% attendance &middot; ${student.missingAssignments || 0} missing</small></div></td>
                <td><div class="students-lms-cell-stack wide">${statusBadge(student.accountStatus)}<small>${student.loginEnabled ? 'Login enabled' : 'Login disabled'} &middot; ${escapeHtmlCompat(student.lastLogin || 'No login')}</small></div></td>
                <td class="students-lms-completion-cell">
                    <div class="students-lms-progress ${progressClass(completionValue)}"><span style="width:${completionValue}%"></span></div>
                    <small>${completionValue}% &middot; ${missingProfile(student).length} missing</small>
                </td>
                <td class="students-lms-actions-cell">
                    <div class="students-lms-button-row center">
                        <button class="students-lms-btn lux-primary-btn small primary" data-view-id="${escapeHtmlCompat(student.id)}" data-view-fac="${escapeHtmlCompat(student.facultyCode)}" type="button">View</button>
                        <button class="students-lms-btn lux-secondary-btn small" data-edit-id="${escapeHtmlCompat(student.id)}" data-edit-fac="${escapeHtmlCompat(student.facultyCode)}" type="button">Edit</button>
                        ${archived
                            ? `<button class="students-lms-btn lux-secondary-btn small" data-restore-id="${escapeHtmlCompat(student.id)}" type="button">Restore</button>`
                            : `<button class="students-lms-btn lux-secondary-btn small danger" data-archive-id="${escapeHtmlCompat(student.id)}" type="button">Archive</button>`}
                    </div>
                </td>
            </tr>
        `;
    }

    function renderDirectory(root) {
        const results = filteredStudents();
        const metricValues = metrics();
        root.innerHTML = `
            <div class="students-lms-shell">
                <section class="students-lms-hero">
                    <div class="students-lms-hero-copyblock">
                        <span class="students-lms-kicker"><i class="fas fa-satellite-dish"></i> Registrar Command Deck</span>
                        <h1 class="students-lms-title">Direct student operations for ${escapeHtmlCompat(uiState.faculty === 'all' ? 'every faculty' : getFacultyLabelSafe(uiState.faculty))}.</h1>
                        <p class="students-lms-copy">Audit record quality, review academic risk, resolve Microsoft account readiness, and move from registrar triage into full student profiles without breaking the KIU admin flow.</p>
                        <div class="students-lms-hero-meta">
                            <span class="students-lms-chip is-primary"><i class="fas fa-university"></i> ${escapeHtmlCompat(uiState.faculty === 'all' ? 'All faculties' : getFacultyLabelSafe(uiState.faculty))}</span>
                            <span class="students-lms-chip is-muted"><i class="fas fa-user-graduate"></i> ${results.length} student${results.length !== 1 ? 's' : ''} in scope</span>
                            <span class="students-lms-chip ${metricValues.atRisk ? 'is-warning' : 'is-success'}"><i class="fas fa-triangle-exclamation"></i> ${metricValues.atRisk} active risk case${metricValues.atRisk === 1 ? '' : 's'}</span>
                            <span class="students-lms-chip ${metricValues.pending ? 'is-warning' : 'is-muted'}"><i class="fab fa-microsoft"></i> ${metricValues.pending} account review</span>
                        </div>
                        <div class="students-lms-hero-actions">
                            <button class="students-lms-btn lux-primary-btn primary" id="students-lms-hero-add-btn" type="button"><i class="fas fa-user-plus"></i> Add Student</button>
                            <button class="students-lms-btn lux-secondary-btn" id="students-lms-hero-review-btn" type="button"><i class="fab fa-microsoft"></i> Review Accounts</button>
                            <button class="students-lms-btn lux-secondary-btn soft" id="students-lms-hero-docs-btn" type="button"><i class="fas fa-file-circle-exclamation"></i> Missing Documents</button>
                        </div>
                    </div>
                    <div class="students-lms-hero-board lux-hero-side">
                        <div class="students-lms-command-head">
                            <strong>Registrar Priorities</strong>
                            <p>Focus the queue before shifting into directory edits or deep profile audits.</p>
                        </div>
                        <div class="students-lms-board-grid students-lms-command-grid">
                            ${commandCard('Active', metricValues.active, 'Live academic records', 'success')}
                            ${commandCard('Pending setup', metricValues.pending, 'Account or status review', metricValues.pending ? 'warning' : 'muted')}
                            ${commandCard('Missing docs', metricValues.missingDocs, 'Compliance follow-up', metricValues.missingDocs ? 'warning' : 'muted')}
                            ${commandCard('Archived', metricValues.archived, 'Hidden by default', 'muted')}
                        </div>
                        <div class="students-lms-command-note">
                            <span class="students-lms-pill is-muted"><i class="fas fa-shield-alt"></i> Audit-sensitive workflow</span>
                            <p>Move from triage into student detail without losing faculty scope, filter context, or review history.</p>
                        </div>
                    </div>
                </section>

                <div class="students-lms-metric-grid lux-strip-grid lux-strip-grid--adaptive">
                    ${metricCard('Total students', metricValues.total, 'Within the current scope')}
                    ${metricCard('Currently enrolled', metricValues.enrolled, 'Students with active courses')}
                    ${metricCard('Incoming mobility', metricValues.incomingMobility, 'Exchange and visiting incoming')}
                    ${metricCard('Outgoing mobility', metricValues.outgoingMobility, 'Exchange outgoing placements')}
                    ${metricCard('At risk', metricValues.atRisk, 'Medium or high risk signals')}
                    ${metricCard('Pending setup', metricValues.pending, 'Needs onboarding action')}
                    ${metricCard('Missing documents', metricValues.missingDocs, 'Document review needed')}
                    ${metricCard('Archived', metricValues.archived, 'Available via archive filter')}
                </div>

                <section class="students-lms-panel">
                    <div class="students-lms-panel-head">
                        <div>
                            <div class="lux-overline">Directory controls</div>
                            <h2>Student filters and actions</h2>
                            <p>Use the improved LMS management workflow on top of KIU faculty-scoped data.</p>
                        </div>
                        <div class="students-lms-button-row">
                            <button class="students-lms-btn lux-secondary-btn" id="students-lms-import-btn" type="button"><i class="fas fa-file-import"></i> Import JSON</button>
                            <button class="students-lms-btn lux-secondary-btn" id="students-lms-export-btn" type="button"><i class="fas fa-file-export"></i> Export JSON</button>
                            <button class="students-lms-btn lux-secondary-btn soft" id="students-lms-export-csv-btn" type="button"><i class="fas fa-table"></i> Export CSV</button>
                            <button class="students-lms-btn lux-primary-btn primary" id="students-lms-add-btn" type="button"><i class="fas fa-user-plus"></i> Add Student</button>
                        </div>
                    </div>

                    <div class="students-lms-filter-grid">
                        <label>
                            <span class="students-lms-label">Search directory</span>
                            <input id="students-lms-search" class="students-lms-control" type="search" value="${escapeHtmlCompat(uiState.query)}" placeholder="Name, ID, email, program, course..." />
                        </label>
                        <label>
                            <span class="students-lms-label">Faculty</span>
                            <select id="students-lms-faculty" class="students-lms-control">${facultyOptionsMarkup()}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Status</span>
                            <select id="students-lms-status" class="students-lms-control">${selectOptions(['Active', 'Probation', 'Suspended', 'Archived'], uiState.status, 'All statuses')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Program</span>
                            <select id="students-lms-program" class="students-lms-control">${programOptionsMarkup()}</select>
                        </label>
                    </div>

                    <div class="students-lms-filter-grid secondary">
                        <label>
                            <span class="students-lms-label">Year / level</span>
                            <select id="students-lms-year" class="students-lms-control">${selectOptions(YEAR_OPTIONS, uiState.year, 'All years')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Academic standing</span>
                            <select id="students-lms-standing" class="students-lms-control">${selectOptions(STANDINGS, uiState.standing, 'All standings')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Sort</span>
                            <select id="students-lms-sort" class="students-lms-control">${sortOptionsMarkup()}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">LMS account</span>
                            <select id="students-lms-account" class="students-lms-control">${selectOptions(ACCOUNT_STATUSES, uiState.account, 'All accounts')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Profile status</span>
                            <select id="students-lms-profile" class="students-lms-control">${selectOptions(['Complete', 'Incomplete', 'Missing Documents', 'Missing Advisor'], uiState.profile, 'All profiles')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Enrollment</span>
                            <select id="students-lms-enrollment" class="students-lms-control">${selectOptions(['Enrolled', 'Not Enrolled', ...ENROLLMENT_TYPES], uiState.enrollment, 'All students')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Mobility</span>
                            <select id="students-lms-mobility" class="students-lms-control">${mobilityFilterOptionsMarkup()}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Archive</span>
                            <select id="students-lms-archive" class="students-lms-control">
                                <option value="active" ${uiState.archive === 'active' ? 'selected' : ''}>Active records</option>
                                <option value="all" ${uiState.archive === 'all' ? 'selected' : ''}>All records</option>
                                <option value="archived" ${uiState.archive === 'archived' ? 'selected' : ''}>Archived only</option>
                            </select>
                        </label>
                        <label>
                            <span class="students-lms-label">Risk</span>
                            <select id="students-lms-risk" class="students-lms-control">${selectOptions(['Low', 'Medium', 'High', 'Inactive'], uiState.risk, 'All risk levels')}</select>
                        </label>
                    </div>

                    <div class="students-lms-filter-grid quick">
                        <label>
                            <span class="students-lms-label">Archive</span>
                            <select id="students-lms-archive-quick" class="students-lms-control">
                                <option value="active" ${uiState.archive === 'active' ? 'selected' : ''}>Active records</option>
                                <option value="all" ${uiState.archive === 'all' ? 'selected' : ''}>All records</option>
                                <option value="archived" ${uiState.archive === 'archived' ? 'selected' : ''}>Archived only</option>
                            </select>
                        </label>
                        <label>
                            <span class="students-lms-label">Risk</span>
                            <select id="students-lms-risk-quick" class="students-lms-control">${selectOptions(['Low', 'Medium', 'High', 'Inactive'], uiState.risk, 'All risk levels')}</select>
                        </label>
                        <label>
                            <span class="students-lms-label">Quick reviews</span>
                            <select id="students-lms-quick-review" class="students-lms-control">
                                <option value="">Select a quick view</option>
                                <option value="risk_high">High risk</option>
                                <option value="missing_docs">Missing documents</option>
                                <option value="incomplete">Incomplete profiles</option>
                                <option value="no_advisor">No advisor</option>
                            </select>
                        </label>
                        <button class="students-lms-btn lux-secondary-btn" id="students-lms-clear-btn" type="button"><i class="fas fa-filter-circle-xmark"></i> Clear filters</button>
                        <button class="students-lms-btn lux-secondary-btn" id="students-lms-refresh-btn" type="button"><i class="fas fa-rotate"></i> Refresh from KIU</button>
                    </div>

                    <div class="students-lms-action-row spaced">
                        <div class="students-lms-filter-chip-row">${activeFiltersMarkup()}</div>
                        <div class="students-lms-button-row start">
                            <button class="students-lms-btn lux-secondary-btn" id="students-lms-recent-btn" type="button"><i class="fas fa-clock"></i> Recently updated</button>
                            <button class="students-lms-btn lux-secondary-btn" id="students-lms-account-review-btn" type="button"><i class="fab fa-microsoft"></i> Account review</button>
                        </div>
                    </div>
                </section>

                <section class="students-lms-panel students-lms-table-shell">
                    <div class="students-lms-panel-head">
                        <div>
                            <div class="lux-overline">Student registry</div>
                            <h2>Operational directory</h2>
                            <p>${results.length} result${results.length !== 1 ? 's' : ''} shown. Open full records, edit, archive, or export.</p>
                        </div>
                        <div class="students-lms-chip-row">
                            <span class="students-lms-chip is-muted"><i class="fas fa-shield-alt"></i> Audit sensitive</span>
                        </div>
                    </div>
                    <div class="students-lms-table-wrap">
                        <table class="students-lms-table">
                            <thead>
                                <tr>
                                    <th class="students-lms-student-col">Student</th>
                                    <th>Program</th>
                                    <th>Enrollment</th>
                                    <th>Academic</th>
                                    <th>Engagement</th>
                                    <th>Account</th>
                                    <th>Completion</th>
                                    <th class="students-lms-actions-col"></th>
                                </tr>
                            </thead>
                            <tbody>
                                ${results.length
                                    ? results.map(renderStudentRow).join('')
                                    : `<tr><td colspan="8" class="students-lms-empty-cell">No students match the current filters.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        `;
        bindDirectoryEvents(root);
    }

    function renderProfile(root) {
        const student = normalizedStudents().find(item => item.id === uiState.selectedId && item.facultyCode === uiState.selectedFaculty);
        if (!student) {
            uiState.view = 'directory';
            uiState.selectedId = null;
            uiState.selectedFaculty = null;
            return renderDirectory(root);
        }
        const completionValue = completion(student);
        const missing = missingProfile(student);
        root.innerHTML = `
            <div class="students-lms-shell">
                <section class="students-lms-profile-header">
                    <div class="students-lms-backline">
                        <button class="students-lms-btn lux-secondary-btn" id="students-lms-back-btn" type="button"><i class="fas fa-arrow-left"></i> Back to directory</button>
                        <div class="students-lms-chip-row">
                            ${statusBadge(student.status)}
                            ${statusBadge(student.academicStanding)}
                            ${riskBadge(student)}
                            ${statusBadge(student.accountStatus)}
                        </div>
                    </div>

                    <div class="students-lms-profile-identity">
                        ${renderAvatar(student, true)}
                        <div>
                            <div class="lux-overline">Student profile</div>
                            <h1 class="students-lms-profile-title">${escapeHtmlCompat(student.name)}</h1>
                            <div class="students-lms-chip-row">
                                <span class="students-lms-chip is-muted">${escapeHtmlCompat(student.studentId)}</span>
                                <span class="students-lms-chip is-primary">${escapeHtmlCompat(student.program)}</span>
                                <span class="students-lms-chip is-muted">${escapeHtmlCompat(student.year)}</span>
                                <span class="students-lms-chip is-muted">Advisor: ${escapeHtmlCompat(student.advisor || 'Not assigned')}</span>
                            </div>
                        </div>
                        <div class="students-lms-profile-card">
                            <span>Profile completion</span>
                            <div class="students-lms-progress ${progressClass(completionValue)} spaced-sm"><span style="width:${completionValue}%"></span></div>
                            <strong class="students-lms-completion-value">${completionValue}% complete</strong>
                            <small>${missing.length ? `Missing: ${escapeHtmlCompat(missing.slice(0, 4).join(', '))}${missing.length > 4 ? '…' : ''}` : 'All required profile sections are complete.'}</small>
                        </div>
                    </div>

                    <div class="students-lms-profile-actions spaced">
                        <button class="students-lms-btn lux-primary-btn primary" data-edit-id="${escapeHtmlCompat(student.id)}" data-edit-fac="${escapeHtmlCompat(student.facultyCode)}" type="button"><i class="fas fa-pen"></i> Edit profile</button>
                        <button class="students-lms-btn lux-secondary-btn" id="students-lms-message-btn" type="button"><i class="fas fa-paper-plane"></i> Message</button>
                        <button class="students-lms-btn lux-secondary-btn" id="students-lms-enroll-btn" type="button"><i class="fas fa-book-medical"></i> Enroll in course</button>
                        ${student.status === 'Archived'
                            ? `<button class="students-lms-btn lux-secondary-btn" data-restore-id="${escapeHtmlCompat(student.id)}" type="button"><i class="fas fa-box-open"></i> Restore</button>`
                            : `<button class="students-lms-btn lux-secondary-btn danger" data-archive-id="${escapeHtmlCompat(student.id)}" type="button"><i class="fas fa-box-archive"></i> Archive</button>`}
                    </div>

                    <div class="students-lms-tabs">
                        ${[['overview', 'Overview'], ['mobility', 'Mobility'], ['courses', 'Courses'], ['grades', 'Grades'], ['progress', 'Progress'], ['attendance', 'Attendance'], ['advising', 'Advising'], ['documents', 'Documents'], ['account', 'Account'], ['admin', 'Admin']].map(([key, label]) => `
                            <button class="students-lms-tab ${uiState.tab === key ? 'active' : ''}" data-tab="${key}" type="button" aria-pressed="${uiState.tab === key ? 'true' : 'false'}">${label}</button>
                        `).join('')}
                    </div>
                </section>

                ${renderProfileTab(student)}
            </div>
        `;
        bindProfileEvents(root);
    }

    function renderProfileTab(student) {
        if (uiState.tab === 'mobility') return renderMobilityTab(student);
        if (uiState.tab === 'courses') return renderCoursesTab(student);
        if (uiState.tab === 'grades') return renderGradesTab(student);
        if (uiState.tab === 'progress') return renderProgressTab(student);
        if (uiState.tab === 'attendance') return renderAttendanceTab(student);
        if (uiState.tab === 'advising') return renderAdvisingTab(student);
        if (uiState.tab === 'documents') return renderDocumentsTab(student);
        if (uiState.tab === 'account') return renderAccountTab(student);
        if (uiState.tab === 'admin') return renderAdminTab(student);
        return renderOverviewTab(student);
    }

    function infoCard(title, items) {
        return `
            <article class="students-lms-profile-card">
                <h3>${escapeHtmlCompat(title)}</h3>
                <div class="students-lms-info-list">
                    ${items.map(([label, value]) => `
                        <div class="students-lms-info-item">
                            <span>${escapeHtmlCompat(label)}</span>
                            <strong>${escapeHtmlCompat(value ?? 'Missing')}</strong>
                        </div>
                    `).join('')}
                </div>
            </article>
        `;
    }

    function miniStat(label, value, note) {
        return `
            <article class="students-lms-profile-card">
                <span>${escapeHtmlCompat(label)}</span>
                <strong>${escapeHtmlCompat(value)}</strong>
                <small>${escapeHtmlCompat(note)}</small>
            </article>
        `;
    }

    function progressCard(label, value, note) {
        const safe = Math.max(0, Math.min(100, Number(value) || 0));
        return `
            <article class="students-lms-profile-card">
                <h3>${escapeHtmlCompat(label)}</h3>
                <div class="students-lms-progress ${progressClass(safe)} spaced-sm"><span style="width:${safe}%"></span></div>
                <strong class="students-lms-score-value">${safe}%</strong>
                <small>${escapeHtmlCompat(note)}</small>
            </article>
        `;
    }

    function averageProgress(courses) {
        if (!courses || !courses.length) return 0;
        return Math.round(courses.reduce((sum, course) => sum + Number(course.progress || 0), 0) / courses.length);
    }

    function riskSignals(student) {
        return [
            { title: 'GPA signal', note: `Current GPA is ${Number(student.gpa || 0).toFixed(2)}.`, level: Number(student.gpa || 0) < 2 ? 'High' : Number(student.gpa || 0) < 2.5 ? 'Medium' : 'Low' },
            { title: 'Attendance signal', note: `Attendance is ${student.attendance || 0}%.`, level: (student.attendance || 0) < 65 ? 'High' : (student.attendance || 0) < 80 ? 'Medium' : 'Low' },
            { title: 'Assignment signal', note: `${student.missingAssignments || 0} missing assignments recorded.`, level: (student.missingAssignments || 0) >= 6 ? 'High' : (student.missingAssignments || 0) >= 3 ? 'Medium' : 'Low' },
            { title: 'Login signal', note: student.lastLogin ? `Last login was ${daysSince(student.lastLogin)} days ago.` : 'No login recorded.', level: daysSince(student.lastLogin) > 14 && student.accountStatus === 'Account Active' ? 'Medium' : 'Low' }
        ];
    }

    function renderMobilityTab(student) {
        const mobility = student.mobility || normalizeStudentMobility(getAdminProfile(student.id));
        const missing = missingMobilityFields(student);
        const period = formatMobilityPeriod(mobility.startDate, mobility.endDate);
        return `
            <div class="students-lms-profile-grid two">
                ${infoCard('Mobility status', [
                    ['Category', mobilityCategoryLabel(mobility.category)],
                    ['Direction', mobility.direction === 'none' ? 'None' : mobility.direction.charAt(0).toUpperCase() + mobility.direction.slice(1)],
                    ['Enrollment type', student.enrollmentType],
                    ['Host program override', mobility.hostProgram || 'Same as main program']
                ])}
                ${infoCard('Partner / origin', [
                    ['Home institution', mobility.homeInstitution || 'Not recorded'],
                    ['Home country', mobility.homeCountry || 'Not recorded'],
                    ['Mobility period', period || 'Not recorded'],
                    ['Agreement reference', mobility.agreementRef || 'Not recorded']
                ])}
            </div>
            ${mobility.category === 'internal_transfer' ? `
                <div class="students-lms-profile-grid two spaced-sm">
                    ${infoCard('Internal transfer', [
                        ['From faculty', mobility.internalFromFaculty || 'Not recorded'],
                        ['From program', mobility.internalFromProgram || 'Not recorded'],
                        ['Current faculty', student.faculty],
                        ['Current program', student.program]
                    ])}
                </div>
            ` : ''}
            <article class="students-lms-profile-card spaced-sm">
                <h3>Mobility notes</h3>
                ${missing.length ? `<div class="students-lms-chip is-warning spaced">Missing mobility data: ${escapeHtmlCompat(missing.join(', '))}</div>` : ''}
                <p class="students-lms-spaced-text">${escapeHtmlCompat(mobility.notes || 'No mobility notes recorded.')}</p>
            </article>
        `;
    }

    function renderOverviewTab(student) {
        return `
            <div class="students-lms-profile-grid">
                ${infoCard('Identity', [['Full name', student.name], ['Student ID', student.studentId], ['Institutional email', student.email || 'Missing'], ['Phone', student.phone || 'Missing']])}
                ${infoCard('Academic record', [['Program', student.program], ['Faculty / School', student.faculty || 'Missing'], ['Year / Level', student.year], ['Standing', student.academicStanding]])}
                ${infoCard('Enrollment', [['Status', student.status], ['Type', student.enrollmentType], ['Mobility', mobilityCategoryLabel((student.mobility || {}).category)], ['Semester', student.semester || 'Missing'], ['Campus', student.campus || 'Missing']])}
                ${infoCard('Academic summary', [['GPA', Number(student.gpa || 0).toFixed(2)], ['Credits earned', student.creditsEarned || 0], ['Expected graduation', student.expectedGraduation || 'Missing'], ['Risk level', risk(student)]])}
            </div>
            <div class="students-lms-profile-grid two spaced-sm">
                <article class="students-lms-profile-card">
                    <h3>Profile summary</h3>
                    ${missingProfile(student).length
                        ? `<div class="students-lms-chip is-warning spaced">Missing profile data: ${escapeHtmlCompat(missingProfile(student).join(', '))}</div>`
                        : `<p class="students-lms-spaced-text">This student profile has the required core data for directory, enrollment, contact, documents, and account workflows.</p>`}
                    <p class="students-lms-spaced-text">${escapeHtmlCompat(student.notes || 'No profile notes available.')}</p>
                </article>
                <article class="students-lms-profile-card">
                    <h3>Interests and languages</h3>
                    <div class="students-lms-filter-chip-row spaced">${(student.interests || []).map(item => `<span class="students-lms-pill is-muted">${escapeHtmlCompat(item)}</span>`).join('') || '<span class="students-lms-pill is-muted">No interests listed</span>'}</div>
                    <div class="students-lms-filter-chip-row spaced-sm">${(student.languages || []).map(item => `<span class="students-lms-pill is-muted">${escapeHtmlCompat(item)}</span>`).join('') || '<span class="students-lms-pill is-muted">No languages listed</span>'}</div>
                </article>
            </div>
        `;
    }

    function renderCoursesTab(student) {
        return `
            <div class="students-lms-profile-grid three">
                ${miniStat('Current courses', (student.courses || []).length, 'Active course enrollments')}
                ${miniStat('Credits in scope', (student.courses || []).reduce((sum, course) => sum + Number(course.credits || 0), 0), 'Current schedule ECTS')}
                ${miniStat('Average progress', `${averageProgress(student.courses)}%`, 'Across active courses')}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Current courses</h3>
                <div class="students-lms-list spaced">
                    ${(student.courses || []).length
                        ? student.courses.map(course => `
                            <div class="students-lms-list-item">
                                <div>
                                    <strong>${escapeHtmlCompat(course.code)} · ${escapeHtmlCompat(course.name)}</strong>
                                    <small>${escapeHtmlCompat(course.instructor)} · Section ${escapeHtmlCompat(course.section)} · ${course.credits} ECTS · ${escapeHtmlCompat(course.lastActivity || 'No activity')}</small>
                                </div>
                                <div class="students-lms-progress-cell">
                                    <div class="students-lms-progress ${progressClass(course.progress || 0)}"><span style="width:${course.progress || 0}%"></span></div>
                                    <small class="students-lms-progress-note">${course.progress || 0}% · ${escapeHtmlCompat(course.grade || 'No grade')}</small>
                                </div>
                            </div>
                        `).join('')
                        : `<div class="students-lms-empty">No active courses assigned to this student.</div>`}
                </div>
            </article>
        `;
    }

    function renderGradesTab(student) {
        return `
            <div class="students-lms-profile-grid four">
                ${miniStat('GPA', Number(student.gpa || 0).toFixed(2), 'Current cumulative GPA')}
                ${miniStat('Credits earned', student.creditsEarned || 0, 'Completed ECTS')}
                ${miniStat('Grade items', (student.gradeItems || []).length, 'Visible grading signals')}
                ${miniStat('Missing assignments', student.missingAssignments || 0, 'Risk signal')}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Grade items and feedback</h3>
                <div class="students-lms-list spaced">
                    ${(student.gradeItems || []).length
                        ? student.gradeItems.map(item => `
                            <div class="students-lms-list-item">
                                <div>
                                    <strong>${escapeHtmlCompat(item.item)}</strong>
                                    <small>${escapeHtmlCompat(item.course)} · ${escapeHtmlCompat(item.feedback || 'No feedback')}</small>
                                </div>
                                <div>${statusBadge(item.status)}<small class="students-lms-progress-note">Score: ${escapeHtmlCompat(item.score)}</small></div>
                            </div>
                        `).join('')
                        : `<div class="students-lms-empty">No grade data is currently available for this student.</div>`}
                </div>
            </article>
        `;
    }

    function renderProgressTab(student) {
        return `
            <div class="students-lms-profile-grid">
                ${progressCard('Course progress', averageProgress(student.courses), 'Average active course completion')}
                ${progressCard('Attendance', Number(student.attendance || 0), 'Attendance percentage')}
                ${progressCard('Profile completion', completion(student), 'Record quality')}
                ${progressCard('Engagement risk', risk(student) === 'High' ? 30 : risk(student) === 'Medium' ? 62 : risk(student) === 'Low' ? 92 : 0, `${risk(student)} risk level`)}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Risk signals</h3>
                <div class="students-lms-list spaced">
                    ${riskSignals(student).map(signal => `
                        <div class="students-lms-list-item">
                            <div>
                                <strong>${escapeHtmlCompat(signal.title)}</strong>
                                <small>${escapeHtmlCompat(signal.note)}</small>
                            </div>
                            ${statusBadge(signal.level)}
                        </div>
                    `).join('')}
                </div>
            </article>
        `;
    }

    function renderAttendanceTab(student) {
        return `
            <div class="students-lms-profile-grid three">
                ${miniStat('Attendance', `${student.attendance || 0}%`, 'Overall attendance')}
                ${miniStat('Absences', (student.attendanceRecords || []).filter(item => item.status === 'Absent').length, 'Recorded absences')}
                ${miniStat('Late arrivals', (student.attendanceRecords || []).filter(item => item.status === 'Late').length, 'Recorded late arrivals')}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Attendance records</h3>
                <div class="students-lms-list spaced">
                    ${(student.attendanceRecords || []).length
                        ? student.attendanceRecords.map(item => `
                            <div class="students-lms-list-item">
                                <div>
                                    <strong>${escapeHtmlCompat(item.course)}</strong>
                                    <small>${escapeHtmlCompat(item.date)} · ${escapeHtmlCompat(item.note || 'No note')}</small>
                                </div>
                                ${statusBadge(item.status)}
                            </div>
                        `).join('')
                        : `<div class="students-lms-empty">Attendance data has not yet been synced for this student.</div>`}
                </div>
            </article>
        `;
    }

    function renderAdvisingTab(student) {
        return `
            <div class="students-lms-profile-grid two">
                ${infoCard('Advisor information', [['Advisor', student.advisor || 'Not assigned'], ['Advisor email', student.advisorEmail || 'Missing'], ['Academic standing', student.academicStanding], ['Risk level', risk(student)]])}
                ${infoCard('Support information', [['Accommodations', student.accommodations ? 'Restricted: yes' : 'No'], ['Emergency contact', student.emergencyContact || 'Missing'], ['Missing assignments', student.missingAssignments || 0], ['Last login', student.lastLogin || 'No login']])}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Advisor / support notes</h3>
                ${student.accommodations ? '<div class="students-lms-chip is-warning spaced">Restricted data: this student has accommodation information. Only authorized staff should view details.</div>' : ''}
                <p class="students-lms-spaced-text">${escapeHtmlCompat(student.notes || 'No support notes recorded.')}</p>
            </article>
        `;
    }

    function renderDocumentsTab(student) {
        return `
            <div class="students-lms-profile-grid three">
                ${miniStat('Document status', student.documentStatus, 'Overall checklist status')}
                ${miniStat('Required documents', (student.documents || []).filter(documentItem => documentItem.required).length, 'Required items')}
                ${miniStat('Missing / expired', (student.documents || []).filter(documentItem => ['Missing', 'Expired', 'Rejected'].includes(documentItem.status)).length, 'Needs action')}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Required and submitted documents</h3>
                <div class="students-lms-list spaced">
                    ${(student.documents || []).length
                        ? student.documents.map(documentItem => `
                            <div class="students-lms-list-item">
                                <div>
                                    <strong>${escapeHtmlCompat(documentItem.name)}</strong>
                                    <small>${documentItem.required ? 'Required' : 'Optional'} · Registrar document workflow</small>
                                </div>
                                ${statusBadge(documentItem.status)}
                            </div>
                        `).join('')
                        : `<div class="students-lms-empty">No documents are currently registered for this student.</div>`}
                </div>
            </article>
        `;
    }

    function renderAccountTab(student) {
        return `
            <div class="students-lms-profile-grid">
                ${infoCard('LMS account', [['Status', student.accountStatus], ['Login enabled', student.loginEnabled ? 'Yes' : 'No'], ['Last login', student.lastLogin || 'No login'], ['Institutional email', student.email || 'Missing']])}
                ${infoCard('Access context', [['Role', 'Student'], ['Course access', `${(student.courses || []).length} courses`], ['Notification email', student.email || 'Missing'], ['Account action', student.accountStatus === 'Needs Review' ? 'Review account' : 'Healthy']])}
                ${infoCard('Contact channels', [['Phone', student.phone || 'Missing'], ['Personal email', student.personalEmail || 'Missing'], ['Campus', student.campus || 'Missing'], ['Preferred method', 'Institutional email']])}
                ${infoCard('Security note', [['MFA', 'Managed by KIU identity services'], ['Disabled reason', student.loginEnabled ? 'None' : 'Login disabled'], ['Source', student.source || 'Manual'], ['Updated', student.updatedAt || 'Unknown']])}
            </div>
        `;
    }

    function renderAdminTab(student) {
        const holdSignals = studentDirectorySignals(student.baseRecord);
        return `
            <div class="students-lms-profile-grid">
                ${infoCard('System record', [['Internal ID', student.id], ['Created', student.createdAt || 'Unknown'], ['Updated', student.updatedAt || 'Unknown'], ['Source', student.source || 'Manual']])}
                ${infoCard('Record state', [['Student status', student.status], ['Document status', student.documentStatus], ['Account status', student.accountStatus], ['Completion', `${completion(student)}%`]])}
                ${infoCard('Academic admin', [['Program', student.program], ['Year', student.year], ['ECTS', student.creditsEarned || 0], ['GPA', Number(student.gpa || 0).toFixed(2)]])}
                ${infoCard('Administrative flags', [['Faculty scope', student.faculty], ['Microsoft state', deriveAccountStatus(student.baseRecord, getAdminProfile(student.id))], ['Hold state', holdSignals.holdLabel || 'Clear'], ['Route owner', 'Students Admin']])}
            </div>
            <article class="students-lms-profile-card spaced-sm">
                <h3>Internal notes</h3>
                <p class="students-lms-spaced-text">${escapeHtmlCompat(student.notes || 'No internal notes recorded.')}</p>
            </article>
        `;
    }

    function selectOptions(values, current, allLabel) {
        const options = allLabel ? [`<option value="all">${escapeHtmlCompat(allLabel)}</option>`] : [];
        values.forEach(value => options.push(`<option value="${escapeHtmlCompat(value)}" ${current === value ? 'selected' : ''}>${escapeHtmlCompat(value)}</option>`));
        return options.join('');
    }

    function facultyOptionsMarkup() {
        const facultyCodes = Array.from(new Set(normalizedStudents().map(student => student.facultyCode))).sort();
        const options = [`<option value="all" ${uiState.faculty === 'all' ? 'selected' : ''}>All faculties</option>`];
        facultyCodes.forEach(code => options.push(`<option value="${escapeHtmlCompat(code)}" ${uiState.faculty === code ? 'selected' : ''}>${escapeHtmlCompat(getFacultyLabelSafe(code))}</option>`));
        return options.join('');
    }

    function sortOptionsMarkup() {
        const labels = {
            name: 'Name',
            studentId: 'Student ID',
            program: 'Program',
            year: 'Year / level',
            gpa: 'GPA',
            updated: 'Recently updated',
            risk: 'Risk level',
            completion: 'Profile completion'
        };
        return Object.entries(labels).map(([value, label]) => `<option value="${value}" ${uiState.sort === value ? 'selected' : ''}>${label}</option>`).join('');
    }

    function programOptionsMarkup() {
        const programs = Array.from(new Set(normalizedStudents().map(student => student.program).filter(Boolean))).sort();
        return selectOptions(programs, uiState.program, 'All programs');
    }

    function bindDirectoryEvents(root) {
        root.querySelector('#students-lms-search')?.addEventListener('input', event => {
            uiState.query = event.target.value;
            renderStudentsAdminLmsPage();
        });
        [
            ['students-lms-faculty', 'faculty'],
            ['students-lms-status', 'status'],
            ['students-lms-program', 'program'],
            ['students-lms-year', 'year'],
            ['students-lms-standing', 'standing'],
            ['students-lms-account', 'account'],
            ['students-lms-profile', 'profile'],
            ['students-lms-enrollment', 'enrollment'],
            ['students-lms-mobility', 'mobility'],
            ['students-lms-archive', 'archive'],
            ['students-lms-archive-quick', 'archive'],
            ['students-lms-risk', 'risk'],
            ['students-lms-risk-quick', 'risk'],
            ['students-lms-sort', 'sort']
        ].forEach(([id, key]) => {
            root.querySelector(`#${id}`)?.addEventListener('change', event => {
                uiState[key] = event.target.value;
                renderStudentsAdminLmsPage();
            });
        });
        root.querySelector('#students-lms-clear-btn')?.addEventListener('click', clearFilters);
        root.querySelector('#students-lms-refresh-btn')?.addEventListener('click', () => {
            uiState.view = 'directory';
            uiState.selectedId = null;
            renderStudentsAdminLmsPage();
            showToast('Student data refreshed from KIU state.');
        });
        root.querySelector('#students-lms-hero-add-btn')?.addEventListener('click', () => openModal());
        root.querySelector('#students-lms-hero-review-btn')?.addEventListener('click', () => {
            uiState.account = 'Needs Review';
            renderStudentsAdminLmsPage();
        });
        root.querySelector('#students-lms-hero-docs-btn')?.addEventListener('click', () => {
            uiState.profile = 'Missing Documents';
            renderStudentsAdminLmsPage();
        });
        root.querySelector('#students-lms-recent-btn')?.addEventListener('click', () => {
            uiState.sort = 'updated';
            renderStudentsAdminLmsPage();
        });
        root.querySelector('#students-lms-account-review-btn')?.addEventListener('click', () => {
            uiState.account = 'Needs Review';
            renderStudentsAdminLmsPage();
        });
        root.querySelector('#students-lms-quick-review')?.addEventListener('change', event => {
            if (event.target.value === 'risk_high') uiState.risk = 'High';
            if (event.target.value === 'missing_docs') uiState.profile = 'Missing Documents';
            if (event.target.value === 'incomplete') uiState.profile = 'Incomplete';
            if (event.target.value === 'no_advisor') uiState.profile = 'Missing Advisor';
            renderStudentsAdminLmsPage();
        });
        root.querySelector('#students-lms-import-btn')?.addEventListener('click', () => document.getElementById('students-admin-lms-import')?.click());
        root.querySelector('#students-lms-export-btn')?.addEventListener('click', exportJSON);
        root.querySelector('#students-lms-export-csv-btn')?.addEventListener('click', exportCSV);
        root.querySelector('#students-lms-add-btn')?.addEventListener('click', () => openModal());
        root.querySelectorAll('[data-view-id]').forEach(button => button.addEventListener('click', () => openProfile(button.dataset.viewId, button.dataset.viewFac)));
        root.querySelectorAll('[data-edit-id]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.editId, button.dataset.editFac)));
        root.querySelectorAll('[data-archive-id]').forEach(button => button.addEventListener('click', () => archiveStudent(button.dataset.archiveId)));
        root.querySelectorAll('[data-restore-id]').forEach(button => button.addEventListener('click', () => restoreStudent(button.dataset.restoreId)));
    }

    function bindProfileEvents(root) {
        root.querySelector('#students-lms-back-btn')?.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            uiState.view = 'directory';
            uiState.selectedId = null;
            uiState.selectedFaculty = null;
            renderStudentsAdminLmsPage();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        root.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => {
            uiState.tab = button.dataset.tab;
            renderStudentsAdminLmsPage();
        }));
        root.querySelectorAll('[data-edit-id]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.editId, button.dataset.editFac)));
        root.querySelectorAll('[data-archive-id]').forEach(button => button.addEventListener('click', () => archiveStudent(button.dataset.archiveId)));
        root.querySelectorAll('[data-restore-id]').forEach(button => button.addEventListener('click', () => restoreStudent(button.dataset.restoreId)));
        root.querySelector('#students-lms-message-btn')?.addEventListener('click', () => showToast('Messaging integration is prepared for the KIU shell.'));
        root.querySelector('#students-lms-enroll-btn')?.addEventListener('click', () => showToast('Course enrollment integration is prepared for the registrar workflow.'));
    }

    function openProfile(id, facultyCode) {
        uiState.selectedId = String(id);
        uiState.selectedFaculty = normalizeFaculty(facultyCode);
        uiState.view = 'profile';
        uiState.tab = 'overview';
        renderStudentsAdminLmsPage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function clearFilters() {
        Object.assign(uiState, {
            query: '',
            faculty: 'all',
            status: 'all',
            program: 'all',
            year: 'all',
            standing: 'all',
            account: 'all',
            profile: 'all',
            enrollment: 'all',
            mobility: 'all',
            risk: 'all',
            archive: 'active',
            sort: 'name'
        });
        renderStudentsAdminLmsPage();
        showToast('Filters cleared.');
    }

    function archiveStudent(id) {
        const student = normalizedStudents().find(item => item.id === String(id));
        if (!student) return;
        if (!window.confirm(`Archive ${student.name}? Archived records stay in KIU state but are hidden by default.`)) return;
        saveAdminProfile(student.id, { archived: true, updatedAt: today(), status: 'Archived' });
        if (typeof saveState === 'function') saveState();
        showToast(`${student.name} archived.`);
        renderStudentsAdminLmsPage();
    }

    function restoreStudent(id) {
        const profile = getAdminProfile(String(id));
        if (!profile) return;
        saveAdminProfile(String(id), { archived: false, status: '', updatedAt: today() });
        if (typeof saveState === 'function') saveState();
        showToast('Student restored.');
        renderStudentsAdminLmsPage();
    }

    function renderModalShell() {
        return `
            <div class="students-lms-modal-card">
                <div class="students-lms-modal-head">
                    <div>
                        <div class="lux-overline">Student record</div>
                        <h2 id="students-admin-lms-modal-title">Add Student</h2>
                        <p class="students-lms-meta">Adapted LMS-grade student record editor for identity, academics, support, documents, and account readiness.</p>
                    </div>
                    <button class="students-lms-btn lux-secondary-btn" id="students-admin-lms-close" type="button"><i class="fas fa-times"></i> Close</button>
                </div>
                <div class="students-lms-modal-body">
                    ${modalSection('Basic information', `
                        <div class="students-lms-form-grid">
                            ${field('Full name *', '<input id="form-name" class="students-lms-control" type="text" placeholder="Nino Tsereteli" />')}
                            ${field('Full name (English)', '<input id="form-name-en" class="students-lms-control" type="text" placeholder="Nino Tsereteli" />')}
                            ${field('Student ID *', '<input id="form-student-id" class="students-lms-control" type="text" placeholder="40012" />')}
                            ${field('Institutional email *', '<input id="form-email" class="students-lms-control" type="email" placeholder="student@kiu.edu.ge" />')}
                            ${field('Personal email', '<input id="form-personal-email" class="students-lms-control" type="email" placeholder="personal@email.com" />')}
                            ${field('Phone', '<input id="form-phone" class="students-lms-control" type="text" placeholder="+995 5xx xxx xxx" />')}
                        </div>
                    `)}
                    ${modalSection('Academic information', `
                        <div class="students-lms-form-grid">
                            ${field('Faculty *', '<select id="form-faculty" class="students-lms-control"></select>')}
                            ${field('Program *', '<input id="form-program" class="students-lms-control" type="text" placeholder="BSc Computer Science" />')}
                            ${field('Year / level *', `<select id="form-year" class="students-lms-control">${YEAR_OPTIONS.map(value => `<option value="${value}">${value}</option>`).join('')}</select>`)}
                            ${field('Academic standing', `<select id="form-standing" class="students-lms-control">${STANDINGS.map(value => `<option value="${value}">${value}</option>`).join('')}</select>`)}
                            ${field('GPA', '<input id="form-gpa" class="students-lms-control" type="number" min="0" max="4" step="0.01" />')}
                            ${field('ECTS earned', '<input id="form-credits" class="students-lms-control" type="number" min="0" step="1" />')}
                        </div>
                    `)}
                    ${modalSection('Enrollment and advising', `
                        <div class="students-lms-form-grid">
                            ${field('Enrollment type', `<select id="form-enrollment-type" class="students-lms-control">${ENROLLMENT_TYPES.map(value => `<option value="${value}">${value}</option>`).join('')}</select>`)}
                            ${field('Current semester', '<input id="form-semester" class="students-lms-control" type="text" placeholder="Semester 1" />')}
                            ${field('Campus', '<input id="form-campus" class="students-lms-control" type="text" placeholder="Kutaisi Main Campus" />')}
                            ${field('Advisor', '<input id="form-advisor" class="students-lms-control" type="text" placeholder="Dr. Mariam Shonia" />')}
                            ${field('Advisor email', '<input id="form-advisor-email" class="students-lms-control" type="email" placeholder="advisor@kiu.edu.ge" />')}
                            ${field('Expected graduation', '<input id="form-graduation" class="students-lms-control" type="text" placeholder="2028" />')}
                        </div>
                    `)}
                    ${modalSection('Mobility & transfer', `
                        <div class="students-lms-form-grid">
                            ${field('Mobility category', `<select id="form-mobility-category" class="students-lms-control">${mobilityCategoryOptionsMarkup()}</select>`)}
                            <label><span class="students-lms-label">Direction</span><div class="students-lms-control students-lms-readonly" id="form-mobility-direction">None</div></label>
                            <div data-mobility-show="incoming|outgoing" hidden>${field('Home institution', '<input id="form-home-institution" class="students-lms-control" type="text" placeholder="Partner university" />')}</div>
                            <div data-mobility-show="incoming|outgoing" hidden>${field('Home country', '<input id="form-home-country" class="students-lms-control" type="text" placeholder="GE" maxlength="2" />')}</div>
                            <div data-mobility-show="incoming|outgoing|internal" hidden>${field('Host program (optional)', '<input id="form-host-program" class="students-lms-control" type="text" placeholder="Override when different from main program" />')}</div>
                            <div data-mobility-show="incoming|outgoing|internal" hidden>${field('Mobility start', '<input id="form-mobility-start" class="students-lms-control" type="date" />')}</div>
                            <div data-mobility-show="incoming|outgoing|internal" hidden>${field('Mobility end', '<input id="form-mobility-end" class="students-lms-control" type="date" />')}</div>
                            <div data-mobility-show="incoming|outgoing|internal" hidden>${field('Agreement reference', '<input id="form-agreement-ref" class="students-lms-control" type="text" placeholder="BLA-2026" />')}</div>
                            <div data-mobility-show="internal" hidden>${field('Internal from faculty', '<input id="form-internal-from-faculty" class="students-lms-control" type="text" placeholder="ECON" />')}</div>
                            <div data-mobility-show="internal" hidden>${field('Internal from program', '<input id="form-internal-from-program" class="students-lms-control" type="text" placeholder="BSc Computer Science" />')}</div>
                        </div>
                        <div class="students-lms-form-grid spaced">
                            ${field('Mobility notes', '<textarea id="form-mobility-notes" class="students-lms-textarea" placeholder="Learning agreement, IR office notes, transfer rationale."></textarea>')}
                        </div>
                    `)}
                    ${modalSection('Learning data', `
                        <div class="students-lms-form-grid two">
                            ${field('Current courses', '<textarea id="form-courses" class="students-lms-textarea" placeholder="CS201 | Data Structures | Prof. Nino Beridze | 6 | 82"></textarea>')}
                            ${field('Grade items', '<textarea id="form-grades" class="students-lms-textarea" placeholder="Final Grade | CS201 | 2026-05-13 | Graded | 84"></textarea>')}
                        </div>
                        <div class="students-lms-form-grid spaced">
                            ${field('Attendance %', '<input id="form-attendance" class="students-lms-control" type="number" min="0" max="100" step="1" />')}
                            ${field('Missing assignments', '<input id="form-missing" class="students-lms-control" type="number" min="0" step="1" />')}
                            ${field('Last login', '<input id="form-last-login" class="students-lms-control" type="date" />')}
                        </div>
                    `)}
                    ${modalSection('Documents, account, and support', `
                        <div class="students-lms-form-grid">
                            ${field('Document status', `<select id="form-doc-status" class="students-lms-control">${DOC_STATUSES.map(value => `<option value="${value}">${value}</option>`).join('')}</select>`)}
                            ${field('LMS account', `<select id="form-account" class="students-lms-control">${ACCOUNT_STATUSES.map(value => `<option value="${value}">${value}</option>`).join('')}</select>`)}
                            ${field('Login enabled', '<select id="form-login-enabled" class="students-lms-control"><option value="true">Enabled</option><option value="false">Disabled</option></select>')}
                            ${field('Emergency contact', '<input id="form-emergency" class="students-lms-control" type="text" placeholder="Name, phone" />')}
                            ${field('Personal languages', '<input id="form-languages" class="students-lms-control" type="text" placeholder="Georgian, English" />')}
                            ${field('Interests', '<input id="form-interests" class="students-lms-control" type="text" placeholder="AI, Diplomacy, Public Health" />')}
                        </div>
                        <div class="students-lms-form-grid two spaced">
                            ${field('Support / admin notes', '<textarea id="form-notes" class="students-lms-textarea" placeholder="Internal notes for registrars and advisors."></textarea>')}
                            ${field('Attendance records', '<textarea id="form-attendance-records" class="students-lms-textarea" placeholder="CS201 | 2026-05-07 | Present | Seminar participation"></textarea>')}
                        </div>
                    `)}
                </div>
                <div class="students-lms-form-actions">
                    <button class="students-lms-btn lux-secondary-btn" id="students-admin-lms-cancel" type="button">Cancel</button>
                    <button class="students-lms-btn lux-secondary-btn soft" id="students-admin-lms-validate" type="button">Validate</button>
                    <button class="students-lms-btn lux-primary-btn primary" id="students-admin-lms-save" type="button">Save Student</button>
                </div>
            </div>
        `;
    }

    function modalSection(title, body) {
        return `<section class="students-lms-form-section"><h3>${title}</h3>${body}</section>`;
    }

    function field(label, control) {
        return `<label><span class="students-lms-label">${label}</span>${control}</label>`;
    }

    function bindModalStaticEvents(modal) {
        modal.querySelector('#students-admin-lms-close')?.addEventListener('click', closeModal);
        modal.querySelector('#students-admin-lms-cancel')?.addEventListener('click', closeModal);
        modal.querySelector('#students-admin-lms-validate')?.addEventListener('click', () => {
            const student = readForm();
            if (student) showToast(`Validation passed. Profile would be ${completion(student)}% complete and ${risk(student)} risk.`);
        });
        modal.querySelector('#students-admin-lms-save')?.addEventListener('click', saveFormStudent);
        modal.querySelector('#form-mobility-category')?.addEventListener('change', () => {
            const category = value('form-mobility-category');
            if (category === 'internal_transfer' && uiState.editingId) {
                const student = normalizedStudents().find(item => item.id === String(uiState.editingId));
                if (student) {
                    if (!value('form-internal-from-faculty')) setValue('form-internal-from-faculty', student.facultyCode);
                    if (!value('form-internal-from-program')) setValue('form-internal-from-program', student.program);
                }
            }
            updateMobilityFormVisibility();
            const mobility = readMobilityFromForm();
            const courseCodes = parseCourses(value('form-courses')).map(course => course.code);
            setValue('form-enrollment-type', enrollmentTypeFromMobility(mobility, courseCodes));
        });
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') closeModal();
        });
    }

    function populateFormFacultyOptions() {
        const select = document.getElementById('form-faculty');
        if (!select) return;
        const facultyCodes = Array.from(new Set([...normalizedStudents().map(student => student.facultyCode), currentFacultyCode()])).sort();
        select.innerHTML = facultyCodes.map(code => `<option value="${escapeHtmlCompat(code)}">${escapeHtmlCompat(getFacultyLabelSafe(code))}</option>`).join('');
    }

    function setValue(id, value) {
        const fieldNode = document.getElementById(id);
        if (fieldNode) fieldNode.value = value ?? '';
    }

    function value(id) {
        return (document.getElementById(id)?.value || '').trim();
    }

    function openModal(id, facultyCode) {
        populateFormFacultyOptions();
        uiState.editingId = id ? String(id) : null;
        const student = id ? normalizedStudents().find(item => item.id === String(id) && item.facultyCode === normalizeFaculty(facultyCode)) : null;
        const modal = document.getElementById('students-admin-lms-modal');
        if (!modal) return;
        document.getElementById('students-admin-lms-modal-title').textContent = student ? 'Edit Student' : 'Add Student';

        setValue('form-name', student?.name || '');
        setValue('form-name-en', student?.nameEn || '');
        setValue('form-student-id', student?.studentId || '');
        setValue('form-email', student?.email || '');
        setValue('form-personal-email', student?.personalEmail || '');
        setValue('form-phone', student?.phone || '');
        setValue('form-faculty', student?.facultyCode || currentFacultyCode());
        setValue('form-program', student?.program || '');
        setValue('form-year', student?.year || 'Year 1');
        setValue('form-standing', student?.academicStanding || 'Good Standing');
        setValue('form-gpa', student?.gpa ?? '');
        setValue('form-credits', student?.creditsEarned ?? '');
        setValue('form-enrollment-type', student?.enrollmentType || 'Full-time');
        setValue('form-semester', student?.semester || 'Semester 1');
        setValue('form-campus', student?.campus || 'Kutaisi Main Campus');
        setValue('form-advisor', student?.advisor || '');
        setValue('form-advisor-email', student?.advisorEmail || '');
        setValue('form-graduation', student?.expectedGraduation || '');
        setValue('form-courses', (student?.courses || []).map(course => `${course.code} | ${course.name} | ${course.instructor} | ${course.credits} | ${course.progress}`).join('\n'));
        setValue('form-grades', (student?.gradeItems || []).map(item => `${item.item} | ${item.course} | ${item.due || ''} | ${item.status} | ${item.score}`).join('\n'));
        setValue('form-attendance', student?.attendance ?? '');
        setValue('form-missing', student?.missingAssignments ?? '');
        setValue('form-last-login', student?.lastLogin || '');
        setValue('form-doc-status', student?.documentStatus || 'Complete');
        setValue('form-account', student?.accountStatus || 'Needs Review');
        setValue('form-login-enabled', String(student?.loginEnabled !== false));
        setValue('form-emergency', student?.emergencyContact || '');
        setValue('form-languages', (student?.languages || []).join(', '));
        setValue('form-interests', (student?.interests || []).join(', '));
        setValue('form-notes', student?.notes || '');
        setValue('form-attendance-records', (student?.attendanceRecords || []).map(item => `${item.course} | ${item.date} | ${item.status} | ${item.note || ''}`).join('\n'));

        const mobility = student?.mobility || normalizeStudentMobility(student ? getAdminProfile(student.id) : {});
        const mobilitySelect = document.getElementById('form-mobility-category');
        if (mobilitySelect) mobilitySelect.innerHTML = mobilityCategoryOptionsMarkup(mobility.category);
        setValue('form-mobility-category', mobility.category || 'degree');
        setValue('form-home-institution', mobility.homeInstitution);
        setValue('form-home-country', mobility.homeCountry);
        setValue('form-host-program', mobility.hostProgram);
        setValue('form-mobility-start', mobility.startDate);
        setValue('form-mobility-end', mobility.endDate);
        setValue('form-agreement-ref', mobility.agreementRef);
        setValue('form-internal-from-faculty', mobility.internalFromFaculty);
        setValue('form-internal-from-program', mobility.internalFromProgram);
        setValue('form-mobility-notes', mobility.notes);
        updateMobilityFormVisibility();

        modal.classList.add('open');
        setTimeout(() => document.getElementById('form-name')?.focus(), 20);
    }

    function closeModal() {
        const modal = document.getElementById('students-admin-lms-modal');
        if (modal) modal.classList.remove('open');
        uiState.editingId = null;
    }

    function parseCourses(text) {
        return text.split('\n').map(line => line.trim()).filter(Boolean).map((line, index) => {
            const [code, name, instructor, credits, progress] = line.split('|').map(part => part.trim());
            return {
                code: code || `COURSE${index + 1}`,
                name: name || 'Unnamed Course',
                instructor: instructor || 'Faculty assignment pending',
                credits: Number(credits) || 6,
                section: 'Imported',
                status: 'Enrolled',
                progress: Math.max(0, Math.min(100, Number(progress) || 0)),
                lastActivity: today(),
                grade: 'In Progress'
            };
        });
    }

    function parseGrades(text) {
        return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
            const [item, course, due, status, score] = line.split('|').map(part => part.trim());
            return {
                item: item || 'Grade Item',
                course: course || 'Course',
                due: due || '',
                status: status || 'Pending',
                score: Number(score) || 0,
                feedback: 'Updated from student admin modal.'
            };
        });
    }

    function parseAttendanceRecords(text) {
        return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
            const [course, date, status, note] = line.split('|').map(part => part.trim());
            return {
                course: course || 'Course',
                date: date || '',
                status: status || 'Present',
                note: note || ''
            };
        });
    }

    function yearLabelToCourse(yearLabel) {
        if (yearLabel === 'Foundation') return 0;
        if (yearLabel === 'Graduate') return 6;
        const match = String(yearLabel).match(/(\d+)/);
        return match ? Number(match[1]) : 1;
    }

    function findStudentByIdAndFaculty(id, facultyCode) {
        const normalizedFaculty = normalizeFaculty(facultyCode);
        const users = Array.isArray(KIU_STATE?.users) ? KIU_STATE.users : [];
        const user = users.find(item =>
            String(item?.id || '') === String(id)
            && String(item?.role || '').trim().toLowerCase() === 'student'
            && normalizeFaculty(item?.facultyCode || item?.faculty) === normalizedFaculty
        );
        const facultyStudents = KIU_STATE?.facultyProfiles?.[normalizedFaculty]?.students || [];
        const facultyStudentIndex = facultyStudents.findIndex(item => String(item?.id || '') === String(id));
        return {
            user,
            normalizedFaculty,
            facultyStudents,
            facultyStudentIndex
        };
    }

    function readForm() {
        const name = value('form-name');
        const studentId = value('form-student-id');
        const email = value('form-email');
        const facultyCode = value('form-faculty') || currentFacultyCode();
        const program = value('form-program');
        const year = value('form-year');
        if (!name || !studentId || !email || !facultyCode || !program || !year) {
            showToast('Full name, student ID, email, faculty, program, and year are required.');
            return null;
        }

        const duplicate = normalizedStudents().find(student =>
            student.id !== uiState.editingId
            && (String(student.studentId).toLowerCase() === studentId.toLowerCase() || String(student.email || '').toLowerCase() === email.toLowerCase())
        );
        if (duplicate) {
            showToast('Duplicate student ID or institutional email found.');
            return null;
        }

        const courses = parseCourses(value('form-courses'));
        const mobility = readMobilityFromForm();
        const enrollmentType = mobility.category === 'degree'
            ? (value('form-enrollment-type') || 'Full-time')
            : enrollmentTypeFromMobility(mobility, courses.map(course => course.code));

        return {
            id: uiState.editingId || studentId,
            studentId,
            name,
            nameEn: value('form-name-en'),
            email,
            personalEmail: value('form-personal-email'),
            phone: value('form-phone'),
            facultyCode,
            program,
            year,
            academicStanding: value('form-standing'),
            gpa: Number(value('form-gpa')) || 0,
            creditsEarned: Number(value('form-credits')) || 0,
            mobility,
            enrollmentType,
            semester: value('form-semester') || 'Semester 1',
            campus: value('form-campus') || 'Kutaisi Main Campus',
            advisor: value('form-advisor'),
            advisorEmail: value('form-advisor-email'),
            expectedGraduation: value('form-graduation'),
            courses,
            gradeItems: parseGrades(value('form-grades')),
            attendance: Number(value('form-attendance')) || 0,
            missingAssignments: Number(value('form-missing')) || 0,
            lastLogin: value('form-last-login'),
            documentStatus: value('form-doc-status') || 'Complete',
            accountStatus: value('form-account') || 'Needs Review',
            loginEnabled: value('form-login-enabled') === 'true',
            emergencyContact: value('form-emergency'),
            languages: value('form-languages').split(',').map(item => item.trim()).filter(Boolean),
            interests: value('form-interests').split(',').map(item => item.trim()).filter(Boolean),
            notes: value('form-notes'),
            attendanceRecords: parseAttendanceRecords(value('form-attendance-records'))
        };
    }

    function buildProvisioningPayload(studentId) {
        if (typeof buildProvisioningMeta === 'function') return buildProvisioningMeta(studentId);
        return {
            temporaryPassword: `KIU-${studentId}`,
            microsoftProvisioned: true
        };
    }

    function upsertStudentRecord(record) {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (!Array.isArray(KIU_STATE.users)) KIU_STATE.users = [];
        if (!KIU_STATE.facultyProfiles) KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE?.facultyProfiles || {}));
        if (!KIU_STATE.facultyProfiles[record.facultyCode]) {
            KIU_STATE.facultyProfiles[record.facultyCode] = { professors: [], tas: [], curriculum: [], students: [] };
        }
        if (!Array.isArray(KIU_STATE.facultyProfiles[record.facultyCode].students)) {
            KIU_STATE.facultyProfiles[record.facultyCode].students = [];
        }

        const existingNormalized = uiState.editingId ? normalizedStudents().find(student => student.id === uiState.editingId) : null;
        const previousFaculty = existingNormalized?.facultyCode || record.facultyCode;
        let mobility = record.mobility
            ? normalizeStudentMobility({ mobility: record.mobility })
            : normalizeStudentMobility(existingNormalized
                ? { mobility: existingNormalized.mobility, enrollmentType: existingNormalized.enrollmentType }
                : getAdminProfile(record.id));
        if (existingNormalized && previousFaculty !== record.facultyCode && mobility.category === 'internal_transfer') {
            if (!mobility.internalFromFaculty) mobility.internalFromFaculty = previousFaculty;
            if (!mobility.internalFromProgram) mobility.internalFromProgram = existingNormalized.program || '';
            mobility = normalizeStudentMobility({ mobility });
        }
        const syncedEnrollment = enrollmentTypeFromMobility(mobility, record.courses.map(course => course.code));
        record.enrollmentType = mobility.category === 'degree' ? (record.enrollmentType || syncedEnrollment) : syncedEnrollment;
        const targetCourse = yearLabelToCourse(record.year);
        const provisioning = existingNormalized?.baseRecord
            ? {
                temporaryPassword: existingNormalized.baseRecord.temporaryPassword,
                microsoftProvisioned: existingNormalized.baseRecord.microsoftProvisioned,
                provisioningSource: existingNormalized.baseRecord.provisioningSource
            }
            : buildProvisioningPayload(record.studentId);

        const baseStudent = {
            ...(existingNormalized?.baseRecord || {}),
            id: record.id,
            name: record.name,
            nameEn: record.nameEn,
            email: record.email,
            phone: record.phone || 'No phone',
            role: 'student',
            faculty: record.facultyCode,
            facultyCode: record.facultyCode,
            status: record.academicStanding === 'Probation' ? 'Probation' : (record.accountStatus === 'Login Disabled' ? 'Suspended' : 'Active'),
            joinYear: existingNormalized?.baseRecord?.joinYear || new Date().getFullYear(),
            program: record.program,
            semester: 1,
            course: targetCourse || 1,
            gpa: record.gpa,
            ectsEarned: record.creditsEarned,
            ects: record.creditsEarned,
            subjects: record.courses.map(course => course.code),
            probation: record.academicStanding === 'Probation',
            avatar: existingNormalized?.baseRecord?.avatar || initials(record.nameEn || record.name),
            photo: existingNormalized?.baseRecord?.photo || '',
            ...provisioning
        };

        if (existingNormalized) {
            const userIndex = KIU_STATE.users.findIndex(user => String(user?.id || '') === String(existingNormalized.id) && String(user?.role || '').trim().toLowerCase() === 'student');
            if (userIndex >= 0) KIU_STATE.users[userIndex] = { ...KIU_STATE.users[userIndex], ...baseStudent };

            if (previousFaculty !== record.facultyCode && Array.isArray(KIU_STATE.facultyProfiles?.[previousFaculty]?.students)) {
                KIU_STATE.facultyProfiles[previousFaculty].students = KIU_STATE.facultyProfiles[previousFaculty].students.filter(student => String(student?.id || '') !== String(existingNormalized.id));
            }

            const existingFacultyStudents = KIU_STATE.facultyProfiles[record.facultyCode].students;
            const facultyIndex = existingFacultyStudents.findIndex(student => String(student?.id || '') === String(existingNormalized.id));
            if (facultyIndex >= 0) existingFacultyStudents[facultyIndex] = { ...existingFacultyStudents[facultyIndex], ...baseStudent };
            else existingFacultyStudents.unshift({ ...baseStudent });
        } else {
            KIU_STATE.users.unshift(baseStudent);
            KIU_STATE.facultyProfiles[record.facultyCode].students.unshift({ ...baseStudent });
        }

        if (!KIU_STATE.tuitionBalances) KIU_STATE.tuitionBalances = {};
        KIU_STATE.tuitionBalances[record.id] = Number(KIU_STATE.tuitionBalances[record.id] || 0);

        if (!KIU_STATE.probationStatus) KIU_STATE.probationStatus = {};
        if (record.academicStanding === 'Probation') KIU_STATE.probationStatus[record.id] = true;
        else delete KIU_STATE.probationStatus[record.id];

        if (!KIU_STATE.studentSchedulesByStudent || typeof KIU_STATE.studentSchedulesByStudent !== 'object') KIU_STATE.studentSchedulesByStudent = {};
        KIU_STATE.studentSchedulesByStudent[record.id] = record.courses.map(course => {
            const availableGroup = Array.isArray(KIU_STATE?.availableGroups?.[course.code]) ? KIU_STATE.availableGroups[course.code][0] : null;
            return {
                courseId: course.code,
                courseName: course.name,
                groupId: availableGroup?.id || availableGroup?.name || 'MANUAL',
                groupName: availableGroup?.name || availableGroup?.id || 'Manual assignment',
                day: availableGroup?.day || '',
                time: availableGroup?.time || '',
                room: availableGroup?.room || '',
                faculty: availableGroup?.faculty || record.facultyCode,
                semester: Number(availableGroup?.semester || 1),
                ects: Number(course.credits || 6),
                registeredAt: today()
            };
        });

        if (!KIU_STATE.studentRegistrations || typeof KIU_STATE.studentRegistrations !== 'object') KIU_STATE.studentRegistrations = {};
        KIU_STATE.studentRegistrations[record.id] = record.courses.map(course => course.code);

        saveAdminProfile(record.id, {
            personalEmail: record.personalEmail,
            phone: record.phone,
            yearLabel: record.year,
            academicStanding: record.academicStanding,
            enrollmentType: record.enrollmentType,
            mobility,
            semesterLabel: record.semester,
            campus: record.campus,
            advisor: record.advisor,
            advisorEmail: record.advisorEmail,
            expectedGraduation: record.expectedGraduation,
            gradeItems: record.gradeItems,
            attendance: record.attendance,
            missingAssignments: record.missingAssignments,
            lastLogin: record.lastLogin,
            documentStatus: record.documentStatus,
            accountStatus: record.accountStatus,
            loginEnabled: record.loginEnabled,
            emergencyContact: record.emergencyContact,
            languages: record.languages,
            interests: record.interests,
            notes: record.notes,
            attendanceRecords: record.attendanceRecords,
            documents: [
                { name: 'ID / Passport', status: record.documentStatus === 'Complete' ? 'Approved' : record.documentStatus, required: true },
                { name: 'Enrollment Agreement', status: record.documentStatus === 'Complete' ? 'Approved' : record.documentStatus, required: true }
            ],
            updatedAt: today(),
            createdAt: existingNormalized?.createdAt || today(),
            source: existingNormalized?.source || 'Students Admin LMS'
        });

        if (typeof saveState === 'function') saveState();
        if (typeof queueRealtimeUserSync === 'function') queueRealtimeUserSync(baseStudent);
        return baseStudent;
    }

    function saveFormStudent() {
        const record = readForm();
        if (!record) return;
        const saved = upsertStudentRecord(record);
        closeModal();
        uiState.selectedId = String(saved.id);
        uiState.selectedFaculty = normalizeFaculty(saved.facultyCode || saved.faculty);
        uiState.view = 'profile';
        uiState.tab = 'overview';
        showToast(`${record.name} saved.`);
        renderStudentsAdminLmsPage();
    }

    function exportJSON() {
        const payload = normalizedStudents().map(student => {
            const copy = { ...student };
            delete copy.baseRecord;
            return copy;
        });
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiu-students-lms-${today()}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Student JSON exported.');
    }

    function exportCSV() {
        const headers = [
            'Student ID',
            'Name',
            'English Name',
            'Email',
            'Faculty',
            'Program',
            'Year',
            'Enrollment',
            'GPA',
            'Status',
            'Risk',
            'Profile Completion',
            'Holds',
            'LMS Account',
            'Mobility Category',
            'Home Institution',
            'Mobility Start',
            'Mobility End',
            'Agreement Ref'
        ];
        const rows = filteredStudents().map(student => {
            const signals = studentDirectorySignals(student.baseRecord);
            const mobility = student.mobility || {};
            return [
                student.studentId,
                student.name,
                student.nameEn,
                student.email,
                student.faculty,
                student.program,
                student.year,
                student.enrollmentType,
                Number(student.gpa || 0).toFixed(2),
                student.status,
                risk(student),
                `${completion(student)}%`,
                signals.holdLabel,
                student.accountStatus,
                mobility.category || 'degree',
                mobility.homeInstitution || '',
                mobility.startDate || '',
                mobility.endDate || '',
                mobility.agreementRef || ''
            ];
        });
        const escapeCell = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
        const csv = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kiu-students-lms-${today()}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        showToast('Student CSV exported.');
    }

    function upsertImportedStudent(imported) {
        const facultyCode = normalizeFaculty(imported.facultyCode || imported.faculty || currentFacultyCode());
        const record = {
            id: String(imported.id || imported.studentId || `student-${Date.now()}`),
            studentId: String(imported.studentId || imported.id || `student-${Date.now()}`),
            name: imported.name || imported.nameEn || 'Imported Student',
            nameEn: imported.nameEn || '',
            email: imported.email || '',
            personalEmail: imported.personalEmail || '',
            phone: imported.phone || '',
            facultyCode,
            program: imported.program || 'Program pending',
            year: imported.year || 'Year 1',
            academicStanding: imported.academicStanding || 'Good Standing',
            gpa: Number(imported.gpa || 0),
            creditsEarned: Number(imported.creditsEarned || imported.ects || 0),
            enrollmentType: imported.enrollmentType || 'Not Enrolled',
            mobility: imported.mobility || (imported.mobilityCategory ? normalizeStudentMobility({
                mobility: {
                    category: imported.mobilityCategory,
                    homeInstitution: imported.homeInstitution || '',
                    startDate: imported.mobilityStart || '',
                    endDate: imported.mobilityEnd || '',
                    agreementRef: imported.agreementRef || ''
                }
            }) : undefined),
            semester: imported.semester || 'Semester 1',
            campus: imported.campus || 'Kutaisi Main Campus',
            advisor: imported.advisor || '',
            advisorEmail: imported.advisorEmail || '',
            expectedGraduation: imported.expectedGraduation || '',
            courses: Array.isArray(imported.courses) ? imported.courses.map(course => ({
                code: course.code || course.id || `COURSE-${Math.random().toString(36).slice(2, 7)}`,
                name: course.name || course.title || course.code || 'Imported Course',
                instructor: course.instructor || 'Faculty assignment pending',
                credits: Number(course.credits || course.ects || 6),
                progress: Number(course.progress || 0)
            })) : [],
            gradeItems: Array.isArray(imported.gradeItems) ? imported.gradeItems : [],
            attendance: Number(imported.attendance || 0),
            missingAssignments: Number(imported.missingAssignments || 0),
            lastLogin: imported.lastLogin || '',
            documentStatus: imported.documentStatus || 'Complete',
            accountStatus: imported.accountStatus || 'Needs Review',
            loginEnabled: imported.loginEnabled !== false,
            emergencyContact: imported.emergencyContact || '',
            languages: Array.isArray(imported.languages) ? imported.languages : [],
            interests: Array.isArray(imported.interests) ? imported.interests : [],
            notes: imported.notes || '',
            attendanceRecords: Array.isArray(imported.attendanceRecords) ? imported.attendanceRecords : []
        };
        upsertStudentRecord(record);
    }

    function handleImportChange(event) {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function onLoad() {
            try {
                const parsed = JSON.parse(String(reader.result));
                const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed.students) ? parsed.students : null;
                if (!rows) throw new Error('JSON must be an array of student records.');
                rows.forEach(upsertImportedStudent);
                renderStudentsAdminLmsPage();
                showToast(`Imported ${rows.length} student record${rows.length === 1 ? '' : 's'}.`);
            } catch (error) {
                showToast('Import failed: invalid student JSON.');
            } finally {
                event.target.value = '';
            }
        };
        reader.readAsText(file);
    }

    function renderStudentsAdminLmsPage() {
        ensureStyles();
        const root = ensureRouteNodes();
        if (!root) return;
        if (uiState.view === 'profile') renderProfile(root);
        else renderDirectory(root);
        if (typeof queueEnglishLocalization === 'function') queueEnglishLocalization(root);
        if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
            try {
                window.queueLuxuryTransparencyRefresh(undefined, { roots: [root] });
            } catch (error) { /* ignore */ }
        }
    }

    window.renderStudentsAdminLmsPage = renderStudentsAdminLmsPage;
    window.renderStudentsPage = renderStudentsAdminLmsPage;
    window.StudentsAdminMobility = {
        normalizeStudentMobility,
        syncEnrollmentTypeFromMobility,
        isMobilityStudent,
        mobilityBadgeLabel,
        matchesMobilityFilter,
        enrollmentTypeFromMobility,
        formatMobilityPeriod,
        mobilityCategoryLabel
    };
    window.openStudentRegistration = function openStudentRegistrationModern() {
        openModal();
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderStudentsAdminLmsPage, { once: true });
    } else {
        renderStudentsAdminLmsPage();
    }
})();
