(function initKiuFacultyCore() {
    if (window.__KIU_FACULTY_CORE_LOADED) return;
    window.__KIU_FACULTY_CORE_LOADED = true;

    if (typeof window.getCurrentFaculty !== 'function') {
        window.getCurrentFaculty = function getCurrentFaculty() {
            const currentUser = typeof getCurrentUserFromState === 'function' ? getCurrentUserFromState(KIU_STATE) : null;
            const selectedFaculty = localStorage.getItem('currentFaculty');
            const role = currentUser?.role || currentUserRole || USER_ROLES.STUDENT;

            if (role === USER_ROLES.ADMIN) {
                const facultySelect = document.getElementById('faculty-select');
                const liveSelected = facultySelect?.value;
                return normalizeFacultyCode(
                    liveSelected || selectedFaculty || currentUser?.facultyCode || currentUser?.faculty || 'ECON',
                    'ECON'
                );
            }

            return normalizeFacultyCode(
                currentUser?.facultyCode || currentUser?.faculty || selectedFaculty || 'ECON',
                'ECON'
            );
        };
    }

    if (typeof window.getFacultyProfile !== 'function') {
        window.getFacultyProfile = function getFacultyProfile(code) {
            const profiles = KIU_STATE?.facultyProfiles || KIU_EMPTY_STATE?.facultyProfiles || {};
            return profiles[code] || profiles.ECON || {};
        };
    }

    if (typeof window.getFacultyColor !== 'function') {
        window.getFacultyColor = function getFacultyColor(code) {
            const normalized = normalizeFacultyCode(code, 'ECON');
            const palette = { CS: '#5b21b6', ECON: '#a4262c', LAW: '#107c41', MED: '#065f46', ARTS: '#b45309' };
            return palette[normalized] || palette.ECON;
        };
    }

    if (typeof window.getFacultyLabel !== 'function') {
        window.getFacultyLabel = function getFacultyLabel(code) {
            const labels = {
                CS: 'Computer Science',
                ECON: 'Business Management',
                LAW: 'Law',
                MED: 'Medicine',
                ARTS: 'Arts & Humanities'
            };
            return labels[code] || code;
        };
    }

    if (typeof window.getPortalMessengerRoleLabel !== 'function') {
        window.getPortalMessengerRoleLabel = function getPortalMessengerRoleLabel(role) {
            const labels = {
                [USER_ROLES.STUDENT]: 'Student',
                [USER_ROLES.PROFESSOR]: 'Professor',
                [USER_ROLES.TA]: 'Teaching Assistant',
                [USER_ROLES.ADMIN]: 'Admin',
                [USER_ROLES.STUDENT_SERVICE]: 'Student Service'
            };
            return labels[role] || 'Portal User';
        };
    }

    if (typeof window.getPortalMessengerUsers !== 'function') {
        window.getPortalMessengerUsers = function getPortalMessengerUsers() {
            if (typeof ensureCanonicalState === 'function') ensureCanonicalState();
            const runtime = typeof ensureKiuRealtimeRuntime === 'function'
                ? ensureKiuRealtimeRuntime()
                : { accountsById: {} };
            return mergeUniqueById([...(KIU_STATE?.users || []), ...Object.values(runtime.accountsById || {})])
                .filter(user => Object.values(USER_ROLES).includes(user.role))
                .map(user => ({
                    ...user,
                    displayName: cleanupEncodingArtifacts(toEnglishText(user.nameEn || user.name || user.email || user.id)),
                    facultyCode: normalizeFacultyCode(user.facultyCode || user.faculty || 'ECON', 'ECON'),
                    facultyName: getFacultyLabel(normalizeFacultyCode(user.facultyCode || user.faculty || 'ECON', 'ECON')),
                    roleLabel: getPortalMessengerRoleLabel(user.role)
                }));
        };
    }

    if (typeof window.getPortalMessengerUserById !== 'function') {
        window.getPortalMessengerUserById = function getPortalMessengerUserById(userId) {
            return getPortalMessengerUsers().find(user => String(user.id) === String(userId)) || null;
        };
    }

    if (typeof window.getActiveCurriculum !== 'function') {
        window.getActiveCurriculum = function getActiveCurriculum(facultyFilter) {
            const fac = facultyFilter || getCurrentFaculty();
            if (typeof getFacultyCurriculumFromProfiles === 'function') {
                return getFacultyCurriculumFromProfiles(fac);
            }
            const fp = getFacultyProfile(fac);
            return Array.isArray(fp?.curriculum) ? fp.curriculum : [];
        };
    }
})();
