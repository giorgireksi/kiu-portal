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
const MANUAL_TESTING_STATE_VERSION = 8;
const REAL_TESTING_CLEANUP_FLAG = 'KIU_REAL_TESTING_CLEANUP_V8';
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
