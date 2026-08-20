/* Minimal globals required by split standalone routes that do not load app.js. */

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

var currentUserRole = (() => {
    try {
        const storedRole = sessionStorage.getItem('KIU_TAB_CURRENT_ROLE') || localStorage.getItem('currentUserRole');
        const pendingRole = sessionStorage.getItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE') || sessionStorage.getItem(PENDING_ROLE_SWITCH_KEY) || localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
        const rawAuthState = sessionStorage.getItem('KIU_TAB_AUTH_STATE') || localStorage.getItem('KIU_AUTH_STATE');
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

var currentUser = null;

function isRoleImpersonationEnabled() {
    const authenticatedRole = String(currentUser?.role || '').trim().toLowerCase();
    if (authenticatedRole && authenticatedRole !== USER_ROLES.ADMIN) return false;
    try {
        if (sessionStorage.getItem(ACTIVE_ROLE_IMPERSONATION_KEY) === '1') return true;
    } catch (error) {}
    try {
        const storedRole = sessionStorage.getItem('KIU_TAB_CURRENT_ROLE') || localStorage.getItem('currentUserRole');
        const pendingRole = sessionStorage.getItem('KIU_TAB_PENDING_ROLE_SWITCH_ROLE') || sessionStorage.getItem(PENDING_ROLE_SWITCH_KEY) || localStorage.getItem(PENDING_ROLE_SWITCH_KEY);
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

const minutesToTimeString = window.minutesToTimeString || function (totalMinutes) {
    const safeMinutes = Number.isFinite(totalMinutes) ? totalMinutes : 0;
    const normalizedMinutes = ((Math.round(safeMinutes) % 1440) + 1440) % 1440;
    const hours = String(Math.floor(normalizedMinutes / 60)).padStart(2, '0');
    const minutes = String(normalizedMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
};
window.minutesToTimeString = minutesToTimeString;

const parseTimeString = window.parseTimeString || function (timeStr) {
    const raw = String(timeStr || '').trim();
    if (!raw) return NaN;

    const twelveHour = raw.match(/^(\d{1,2}):(\d{2})\s*([AP]M)$/i);
    if (twelveHour) {
        let hours = parseInt(twelveHour[1], 10);
        const minutes = parseInt(twelveHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return NaN;
        const meridiem = twelveHour[3].toUpperCase();
        if (meridiem === 'PM' && hours < 12) hours += 12;
        if (meridiem === 'AM' && hours === 12) hours = 0;
        return hours * 60 + minutes;
    }

    const twentyFourHour = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (twentyFourHour) {
        const hours = parseInt(twentyFourHour[1], 10);
        const minutes = parseInt(twentyFourHour[2], 10);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return NaN;
        return hours * 60 + minutes;
    }

    return NaN;
};
window.parseTimeString = parseTimeString;

const normalizeTimeString = window.normalizeTimeString || function (timeStr, fallback = '') {
    const parsed = parseTimeString(timeStr);
    if (!Number.isFinite(parsed)) return fallback;
    return minutesToTimeString(parsed);
};
window.normalizeTimeString = normalizeTimeString;

const convertTimeToMinutes = window.convertTimeToMinutes || function (timeStr) {
    const parsed = parseTimeString(timeStr);
    return Number.isFinite(parsed) ? parsed : 0;
};
window.convertTimeToMinutes = convertTimeToMinutes;

// Standalone Social pages may never load app.js, but they still need to
// advance an existing service worker so query-bearing navigations receive the
// current shell-recovery logic. Registration/cache work is intentionally
// scheduled after the first paint rather than competing with the shell boot.
function scheduleStandaloneServiceWorkerRegistration() {
    if (window.location.protocol !== 'https:' || !('serviceWorker' in navigator)) return;
    const register = () => navigator.serviceWorker.register(`service-worker.js?v=20260822-customscroll32`, { scope: './' })
        .catch(() => null);
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(register, { timeout: 2500 });
    } else {
        window.setTimeout(register, 1200);
    }
}
scheduleStandaloneServiceWorkerRegistration();
