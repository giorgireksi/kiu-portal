/* Foundational globals required by split portal runtimes.
 * This small blocking bootstrap must run before app/auth/state so standalone
 * and cached route bundles cannot execute against missing legacy constants. */
var USER_ROLES = window.USER_ROLES || {
    STUDENT: 'student',
    PROFESSOR: 'professor',
    TA: 'ta',
    ADMIN: 'admin',
    STUDENT_SERVICE: 'student_service'
};
window.USER_ROLES = USER_ROLES;

var ACTIVE_SESSION_KEY = window.ACTIVE_SESSION_KEY || 'KIU_ACTIVE_SESSION_USER_ID';
var ACTIVE_ROLE_IMPERSONATION_KEY = window.ACTIVE_ROLE_IMPERSONATION_KEY || 'KIU_ACTIVE_ROLE_IMPERSONATION';
var PENDING_ROLE_SWITCH_KEY = window.PENDING_ROLE_SWITCH_KEY || 'KIU_PENDING_ROLE_SWITCH_ROLE';
var MANUAL_TESTING_STATE_VERSION = window.MANUAL_TESTING_STATE_VERSION || 8;
var REAL_TESTING_CLEANUP_FLAG = window.REAL_TESTING_CLEANUP_FLAG || 'KIU_REAL_TESTING_CLEANUP_V8';
var TIMETABLE_WEEK_STORAGE_KEY = window.TIMETABLE_WEEK_STORAGE_KEY || 'KIU_TIMETABLE_WEEK_START';
var PROFILE_CALENDAR_WEEK_STORAGE_KEY = window.PROFILE_CALENDAR_WEEK_STORAGE_KEY || 'KIU_PROFILE_CALENDAR_WEEK_START';
var SCHEDULER_WEEK_STORAGE_KEY = window.SCHEDULER_WEEK_STORAGE_KEY || 'KIU_SCHEDULER_WEEK_START';
var PERMISSION_MATRIX = window.PERMISSION_MATRIX || {
    [USER_ROLES.STUDENT]: ['portal.student', 'registration.manage', 'lms.view', 'library.view', 'orders.view'],
    [USER_ROLES.PROFESSOR]: ['portal.professor', 'gradebook.manage', 'attendance.manage', 'lms.manage', 'profile.view'],
    [USER_ROLES.TA]: ['portal.ta', 'attendance.manage', 'gradebook.view', 'lms.assist', 'profile.view'],
    [USER_ROLES.STUDENT_SERVICE]: ['portal.student_service', 'student-service.manage', 'knowledge.manage', 'library.view', 'orders.view'],
    [USER_ROLES.ADMIN]: ['*']
};

window.ACTIVE_SESSION_KEY = ACTIVE_SESSION_KEY;
window.ACTIVE_ROLE_IMPERSONATION_KEY = ACTIVE_ROLE_IMPERSONATION_KEY;
window.PENDING_ROLE_SWITCH_KEY = PENDING_ROLE_SWITCH_KEY;
window.MANUAL_TESTING_STATE_VERSION = MANUAL_TESTING_STATE_VERSION;
window.REAL_TESTING_CLEANUP_FLAG = REAL_TESTING_CLEANUP_FLAG;
window.TIMETABLE_WEEK_STORAGE_KEY = TIMETABLE_WEEK_STORAGE_KEY;
window.PROFILE_CALENDAR_WEEK_STORAGE_KEY = PROFILE_CALENDAR_WEEK_STORAGE_KEY;
window.SCHEDULER_WEEK_STORAGE_KEY = SCHEDULER_WEEK_STORAGE_KEY;
window.PERMISSION_MATRIX = PERMISSION_MATRIX;

var currentUserRole = window.currentUserRole;
if (!currentUserRole) {
    var storedRole = '';
    try {
        storedRole = sessionStorage.getItem('KIU_TAB_CURRENT_ROLE')
            || localStorage.getItem('currentUserRole')
            || '';
    } catch (error) {}
    currentUserRole = Object.values(USER_ROLES).includes(storedRole)
        ? storedRole
        : USER_ROLES.STUDENT;
}
window.currentUserRole = currentUserRole;
var currentUser = typeof window.currentUser === 'undefined' ? null : window.currentUser;
window.currentUser = currentUser;
