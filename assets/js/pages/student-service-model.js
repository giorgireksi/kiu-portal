/* Pure Student Service helpers (escape, dates, macros, registration course ids).
 * ESM leaf: student-service.html type=module; classic bridge for defer consumers.
 */
'use strict';

function ssEscape(value) {
    const text = String(value ?? '');
    if (typeof escapeHtml === 'function') return escapeHtml(text);
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function ssNowIso() {
    return new Date().toISOString();
}

function ssParseTime(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

function ssFormatDateTime(value) {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return ssEscape(value);
    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function ssFormatRelativeTime(value) {
    const timestamp = ssParseTime(value);
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - timestamp;
    const diffMinutes = Math.floor(diffMs / 60000);
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return ssFormatDate(value);
}

function ssFormatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return ssEscape(value);
    return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
}

function ssClampText(value, maxLength = 220) {
    const text = String(value || '').trim().replace(/\s+/g, ' ');
    if (text.length <= maxLength) return text;
    return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function buildStudentServiceDefaultMacros() {
    return [
        {
            id: 'svc-macro-001',
            label: 'Ask for more details',
            category: 'General Question',
            message: 'Thank you for contacting Student Service. Please send your student ID, the exact page or process you were using, and a screenshot or short description of what happened so we can review this quickly.'
        },
        {
            id: 'svc-macro-002',
            label: 'Registration guidance',
            category: 'Registration / Enrollment',
            message: 'Thanks for the details. Please confirm your semester, course name, and group if applicable. Student Service can guide the process here, but enrollment records are updated in the academic workflow rather than directly from this workspace.'
        },
        {
            id: 'svc-macro-003',
            label: 'Finance guidance',
            category: 'Finance / Payments',
            message: 'Please share your student ID, the payment or balance amount, and the payment date if available. Student Service can document the issue and guide the next step, but finance records are not edited from this workspace.'
        },
        {
            id: 'svc-macro-004',
            label: 'Document request follow-up',
            category: 'Documents / Certificates',
            message: 'Please confirm which document you need, the language, and the deadline. Student Service can help you prepare the request and keep you updated, while official document generation stays in the formal office workflow.'
        },
        {
            id: 'svc-macro-005',
            label: 'Portal troubleshooting',
            category: 'Technical Portal Help',
            message: 'Please send the page name, your current role, your faculty, the exact button or action you clicked, and a screenshot if possible. This will help us reproduce the issue and respond faster.'
        }
    ];
}

function normalizeStudentServiceRegistrationCourseIds(registrationValue) {
    if (typeof normalizeStudentRegistrationCourseIds === 'function') {
        return normalizeStudentRegistrationCourseIds(registrationValue);
    }
    const collected = [];
    const addCourse = (value) => {
        if (value == null) return;
        if (typeof value === 'string' || typeof value === 'number') {
            const text = String(value).trim();
            if (text) collected.push(text);
            return;
        }
        if (Array.isArray(value)) {
            value.forEach(addCourse);
            return;
        }
        if (typeof value === 'object') {
            const directId = value.courseId || value.sourceCourseId || value.id || value.n;
            if (directId) addCourse(directId);
            [
                value.courseIds,
                value.courseIDs,
                value.courses,
                value.selectedCourses,
                value.selectedSubjects,
                value.registeredCourses,
                value.registeredSubjects,
                value.subjects,
                value.items
            ].forEach(addCourse);
        }
    };
    addCourse(registrationValue);
    return [...new Set(collected.map((courseId) => String(courseId).trim()).filter(Boolean))];
}

function buildStudentServiceArticleFingerprint(articles = []) {
    return (articles || [])
        .map((article) => `${article.id}:${article.updatedAt || article.createdAt || ''}`)
        .sort()
        .join(',');
}

function getStudentServicePageLabel(pageId) {
    const labels = {
        'student-service': 'Support Hub',
        registration: 'Registration',
        'study-card': 'Study Card',
        timetable: 'Timetable',
        orders: 'Orders',
        library: 'Library',
        chancellery: 'E-Chancellery',
        profile: 'Profile'
    };
    return labels[pageId] || pageId;
}

export const studentServiceModelApi = {
    ssEscape,
    ssNowIso,
    ssParseTime,
    ssFormatDateTime,
    ssFormatRelativeTime,
    ssFormatDate,
    ssClampText,
    buildStudentServiceDefaultMacros,
    normalizeStudentServiceRegistrationCourseIds,
    buildStudentServiceArticleFingerprint,
    getStudentServicePageLabel
};

/** Install classic window / Kiu surface (idempotent). */
export function installStudentServiceModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_STUDENT_SERVICE_MODEL_LOADED) {
        return target?.KiuStudentServiceModel || studentServiceModelApi;
    }
    target.__KIU_STUDENT_SERVICE_MODEL_LOADED = true;
    target.__kiuStudentServiceModelExports = studentServiceModelApi;
    target.KiuStudentServiceModel = studentServiceModelApi;
    Object.keys(studentServiceModelApi).forEach((key) => {
        target[key] = studentServiceModelApi[key];
    });
    return studentServiceModelApi;
}

installStudentServiceModel();
