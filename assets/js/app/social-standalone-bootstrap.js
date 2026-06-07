/* Minimal globals required by split standalone routes that do not load app.js. */

const USER_ROLES = {
    STUDENT: 'student',
    PROFESSOR: 'professor',
    TA: 'ta',
    ADMIN: 'admin',
    STUDENT_SERVICE: 'student_service'
};

window.USER_ROLES = USER_ROLES;

const ACTIVE_SESSION_KEY = 'KIU_ACTIVE_SESSION_USER_ID';
const ACTIVE_ROLE_IMPERSONATION_KEY = 'KIU_ACTIVE_ROLE_IMPERSONATION';
const PENDING_ROLE_SWITCH_KEY = 'KIU_PENDING_ROLE_SWITCH_ROLE';
const MANUAL_TESTING_STATE_VERSION = 7;
const REAL_TESTING_CLEANUP_FLAG = 'KIU_REAL_TESTING_CLEANUP_V7';
const TIMETABLE_WEEK_STORAGE_KEY = 'KIU_TIMETABLE_WEEK_START';
const PROFILE_CALENDAR_WEEK_STORAGE_KEY = 'KIU_PROFILE_CALENDAR_WEEK_START';
const SCHEDULER_WEEK_STORAGE_KEY = 'KIU_SCHEDULER_WEEK_START';
const PERMISSION_MATRIX = {
    [USER_ROLES.STUDENT]: ['portal.student', 'registration.manage', 'lms.view', 'library.view', 'orders.view'],
    [USER_ROLES.PROFESSOR]: ['portal.professor', 'gradebook.manage', 'attendance.manage', 'lms.manage', 'profile.view'],
    [USER_ROLES.TA]: ['portal.ta', 'attendance.manage', 'gradebook.view', 'lms.assist', 'profile.view'],
    [USER_ROLES.STUDENT_SERVICE]: ['portal.student_service', 'student-service.manage', 'knowledge.manage', 'library.view', 'orders.view'],
    [USER_ROLES.ADMIN]: ['*']
};

let currentUserRole = (() => {
    try {
        const storedRole = localStorage.getItem('currentUserRole');
        const pendingRole = localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
        const rawAuthState = localStorage.getItem('KIU_AUTH_STATE');
        const authState = rawAuthState ? JSON.parse(rawAuthState) : null;
        const authenticatedRole = String(authState?.role || '').trim().toLowerCase();
        if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) return authenticatedRole;
        if (
            authenticatedRole === USER_ROLES.ADMIN
            && Object.values(USER_ROLES).includes(pendingRole)
            && pendingRole !== USER_ROLES.ADMIN
        ) {
            return pendingRole;
        }
        return Object.values(USER_ROLES).includes(storedRole)
            ? storedRole
            : (authenticatedRole || USER_ROLES.STUDENT);
    } catch (error) {
        return USER_ROLES.STUDENT;
    }
})();

let currentUser = null;

function isRoleImpersonationEnabled() {
    const authenticatedRole = String(currentUser?.role || '').trim().toLowerCase();
    if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) return false;
    try {
        if (sessionStorage.getItem(ACTIVE_ROLE_IMPERSONATION_KEY) === '1') return true;
    } catch (error) {}
    try {
        const storedRole = localStorage.getItem('currentUserRole');
        const pendingRole = localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
        const effectiveStoredRole = Object.values(USER_ROLES).includes(storedRole) ? storedRole : pendingRole;
        return Boolean(
            authenticatedRole
            && Object.values(USER_ROLES).includes(effectiveStoredRole)
            && effectiveStoredRole !== authenticatedRole
        );
    } catch (error) {
        return false;
    }
}

function canonicalCourseKey(value) {
    return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function ensureArray(value) {
    return Array.isArray(value) ? value : [];
}

function cleanupEncodingArtifacts(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00a0/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

function toEnglishText(value) {
    return cleanupEncodingArtifacts(value);
}
