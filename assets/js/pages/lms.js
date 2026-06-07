/* LMS page logic extracted from the legacy core.js bundle. Active routes now load split files directly. */

// --- LMS LOGIC ---

let currentCourseId = '';
let currentLmsSectionType = '';
let lmsBulkGroupContext = { subjectId: '', subjectTitle: '', groups: [] };
const LMS_SECTION_TYPES = ['lecture', 'workshop'];
const LMS_SECTION_SUFFIX_PREFIX = '__lmssec_';
const KIU_BLUE_HELPER_DEFAULT_URL = (() => {
    try {
        if (window.location?.protocol === 'http:' || window.location?.protocol === 'https:') {
            const host = window.location.hostname || '127.0.0.1';
            return `${window.location.protocol}//${host}:47831`;
        }
    } catch (error) {}
    return 'http://127.0.0.1:47831';
})();
const KIU_BLUE_STATUS_TTL_MS = 4000;
const LMS_POST_SUBMIT_LOCK_MS = 20 * 60 * 1000;
const KIU_BLUE_HEARTBEAT_MS = 5000;
const KIU_BLUE_HEARTBEAT_TIMEOUT_MS = 15000;
let activeKiuBlueHeartbeatInterval = null;
let activeKiuBlueDisconnectInterval = null;
let activeLmsQuizCountdownInterval = null;
let activeLmsPostSubmitLockInterval = null;

function getSimulatedUserName() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.currentUser || window.authenticatedUser || null);
    if (!user) return 'Unknown User';
    if (user.role === 'admin' || user.role === window.USER_ROLES?.ADMIN) {
        return user.name || user.nameEn || user.email || 'System Administrator';
    }
    return user.nameEn || user.name || user.email || user.id || 'Unknown User';
}

function normalizeSubjectTitleKey(value) {
    const repair = typeof cleanupEncodingArtifacts === 'function'
        ? cleanupEncodingArtifacts
        : (input) => String(input || '');
    const translate = typeof toEnglishText === 'function'
        ? toEnglishText
        : (input) => String(input || '');
    return repair(translate(String(value || '')))
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getAllCurriculumSubjects() {
    const profiles = KIU_STATE?.facultyProfiles || window.KIU_EMPTY_STATE?.facultyProfiles || {};
    const subjects = [];
    const seen = new Set();
    const addSubject = (subject) => {
        const key = canonicalCourseKey(subject?.id || subject?.courseId || subject?.subjectId);
        if (!key || seen.has(key)) return;
        seen.add(key);
        subjects.push(subject);
    };

    Object.keys(profiles || {}).forEach((faculty) => {
        const facultySubjects = typeof getActiveCurriculum === 'function'
            ? getActiveCurriculum(faculty)
            : profiles?.[faculty]?.curriculum;
        (Array.isArray(facultySubjects) ? facultySubjects : []).forEach(addSubject);
    });
    (Array.isArray(KIU_STATE?.curriculum) ? KIU_STATE.curriculum : []).forEach(addSubject);
    return subjects;
}

function findCurriculumSubjectByIdOrTitle(subjectId, subjectTitle = '', preferredFaculty = null) {
    const targetKey = canonicalCourseKey(subjectId);
    const titleKey = normalizeSubjectTitleKey(subjectTitle);
    const allSubjects = getAllCurriculumSubjects();

    if (targetKey && preferredFaculty && typeof getActiveCurriculum === 'function') {
        const preferredById = (getActiveCurriculum(preferredFaculty) || [])
            .find(subject => canonicalCourseKey(subject?.id) === targetKey);
        if (preferredById) return preferredById;
    }

    if (targetKey) {
        const exactById = allSubjects.find(subject => canonicalCourseKey(subject?.id || subject?.courseId || subject?.subjectId) === targetKey);
        if (exactById) return exactById;
    }

    if (titleKey && preferredFaculty && typeof getActiveCurriculum === 'function') {
        const preferredByTitle = (getActiveCurriculum(preferredFaculty) || [])
            .find(subject => normalizeSubjectTitleKey(subject?.name || subject?.title) === titleKey);
        if (preferredByTitle) return preferredByTitle;
    }

    if (!titleKey) return null;
    return allSubjects.find(subject => normalizeSubjectTitleKey(subject?.name || subject?.title) === titleKey) || null;
}

const LMS_STUDENT_SEMESTER_STORAGE_KEY = 'kiuLmsStudentSemester';

function normalizeLmsStudentScheduleEntries(scheduleValue) {
    if (Array.isArray(scheduleValue)) return scheduleValue.filter(Boolean);
    if (scheduleValue && typeof scheduleValue === 'object') {
        if (Array.isArray(scheduleValue.entries)) return scheduleValue.entries.filter(Boolean);
        return Object.entries(scheduleValue)
            .filter(([, groupId]) => groupId != null && groupId !== '')
            .map(([courseId, groupId]) => ({ courseId, groupId }));
    }
    return [];
}

function isLmsStudentViewer() {
    return typeof getEffectiveUserRole === 'function'
        && getEffectiveUserRole() === USER_ROLES.STUDENT;
}

function resolveLmsStudentSemesterNumber(student) {
    if (typeof getCurrentStudentSemesterNumber === 'function') {
        return getCurrentStudentSemesterNumber(student);
    }
    const explicitSemester = parseInt(student?.semester, 10);
    if (Number.isFinite(explicitSemester) && explicitSemester > 0) return explicitSemester;
    const activeSemester = parseInt(KIU_STATE?.activeSemester, 10);
    if (Number.isFinite(activeSemester) && activeSemester > 0) return activeSemester;
    return 1;
}

function getLmsStudentSelectedSemester() {
    try {
        const stored = parseInt(localStorage.getItem(LMS_STUDENT_SEMESTER_STORAGE_KEY), 10);
        if (Number.isFinite(stored) && stored > 0) return stored;
    } catch (error) {}
    return resolveLmsStudentSemesterNumber(typeof getCurrentUser === 'function' ? getCurrentUser() : null);
}

function setLmsStudentSelectedSemester(semester) {
    const normalized = parseInt(semester, 10);
    if (!Number.isFinite(normalized) || normalized <= 0) return;
    try {
        localStorage.setItem(LMS_STUDENT_SEMESTER_STORAGE_KEY, String(normalized));
    } catch (error) {}
    if (document.body) {
        document.body.classList.toggle('lms-student-mode', isLmsStudentViewer());
    }
    if (typeof window.renderLmsSubjectDeck === 'function') {
        window.renderLmsSubjectDeck();
    }
}

function resolveScheduleEntrySemester(entry, preferredFaculty = null) {
    const fromEntry = parseInt(entry?.enrollmentSemester ?? entry?.semester, 10);
    if (Number.isFinite(fromEntry) && fromEntry > 0) return fromEntry;
    const faculty = preferredFaculty || entry?.faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '');
    const courseId = String(entry?.courseId || entry?.sourceCourseId || '').trim();
    if (!courseId) return resolveLmsStudentSemesterNumber(typeof getCurrentUser === 'function' ? getCurrentUser() : null);
    const courseDef = typeof getCourseByIdForRegistration === 'function'
        ? getCourseByIdForRegistration(courseId, faculty, entry?.courseName || '')
        : findCurriculumSubjectByIdOrTitle(courseId, entry?.courseName || '', faculty);
    const fromCourse = parseInt(courseDef?.semester, 10);
    if (Number.isFinite(fromCourse) && fromCourse > 0) return fromCourse;
    const groups = KIU_STATE?.availableGroups?.[courseId] || [];
    const group = (groups || []).find(item => String(item?.id || '') === String(entry?.groupId || '')) || groups[0];
    const fromGroup = parseInt(group?.semester, 10);
    if (Number.isFinite(fromGroup) && fromGroup > 0) return fromGroup;
    return resolveLmsStudentSemesterNumber(typeof getCurrentUser === 'function' ? getCurrentUser() : null);
}

function getStudentLmsScheduleEntries(semester = null) {
    const schedule = typeof getCurrentStudentSchedule === 'function'
        ? getCurrentStudentSchedule()
        : normalizeLmsStudentScheduleEntries(
            KIU_STATE?.studentSchedulesByStudent?.[(typeof getCurrentUserId === 'function' ? getCurrentUserId() : '')]
        );
    const targetSemester = semester != null ? parseInt(semester, 10) : getLmsStudentSelectedSemester();
    if (!Number.isFinite(targetSemester) || targetSemester <= 0) return schedule;
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '';
    return schedule.filter(entry => resolveScheduleEntrySemester(entry, faculty) === targetSemester);
}

function getStudentLmsSemesterOptions() {
    const schedule = typeof getCurrentStudentSchedule === 'function'
        ? getCurrentStudentSchedule()
        : [];
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '';
    const semesters = new Set();
    schedule.forEach((entry) => {
        const semesterValue = resolveScheduleEntrySemester(entry, faculty);
        if (Number.isFinite(semesterValue) && semesterValue > 0) semesters.add(semesterValue);
    });
    const selected = getLmsStudentSelectedSemester();
    if (Number.isFinite(selected) && selected > 0) semesters.add(selected);
    return [...semesters].sort((a, b) => a - b);
}

function getStudentLmsEnrolledSubjects(semester = null) {
    const entries = getStudentLmsScheduleEntries(semester);
    const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '';
    const seen = new Set();
    const subjects = [];
    entries.forEach((entry) => {
        const courseId = String(entry?.courseId || entry?.sourceCourseId || '').trim();
        if (!courseId) return;
        const dedupeKey = canonicalCourseKey(courseId);
        if (!dedupeKey || seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        const curriculum = findCurriculumSubjectByIdOrTitle(courseId, entry?.courseName || '', faculty);
        const groupId = String(entry?.groupId || '').trim();
        const semesterValue = resolveScheduleEntrySemester(entry, faculty);
        const title = entry?.courseName || curriculum?.name || curriculum?.title || courseId;
        subjects.push({
            id: curriculum?.id || courseId,
            courseId,
            name: title,
            title,
            groupId,
            groupName: entry?.groupName || '',
            semester: semesterValue,
            courseKey: groupId ? `${courseId}::${groupId}` : courseId,
            icon: curriculum?.icon || 'fas fa-book-reader',
            faculty: entry?.faculty || curriculum?.faculty || faculty,
            isStudentEnrollment: true
        });
    });
    return subjects;
}

function openLmsStudentEnrolledSubject(card) {
    if (!card) return;
    const courseKey = card.getAttribute('data-course-key') || '';
    const subjectTitle = card.getAttribute('data-subject-title') || courseKey;
    if (courseKey && typeof openLMSCourse === 'function') {
        openLMSCourse(courseKey, subjectTitle);
        return;
    }
    const subjectId = card.getAttribute('data-subject-id') || '';
    const groupId = card.getAttribute('data-group-id') || '';
    if (subjectId && groupId && typeof openLMSCourse === 'function') {
        openLMSCourse(`${subjectId}::${groupId}`, subjectTitle);
        return;
    }
    if (typeof openLMSGroupsFromCard === 'function') openLMSGroupsFromCard(card);
}

const LMS_DEFAULT_WEEKS = Array.from({ length: 14 }, (_, index) => `Week ${index + 1}`);
const LMS_SESSION_MARKER_TYPES = {
    quiz: { label: 'Quiz', icon: 'fa-pen-to-square', tone: 'warning' },
    oral_quiz: { label: 'Oral Quiz', icon: 'fa-microphone-lines', tone: 'info' },
    exam: { label: 'Exam', icon: 'fa-file-circle-check', tone: 'danger' },
    presentation: { label: 'Project Presentation', icon: 'fa-person-chalkboard', tone: 'success' },
    project: { label: 'Project Milestone', icon: 'fa-diagram-project', tone: 'success' },
    lab: { label: 'Lab / Practical', icon: 'fa-flask', tone: 'info' },
    deadline: { label: 'Submission Deadline', icon: 'fa-hourglass-end', tone: 'warning' },
    important: { label: 'Important Session', icon: 'fa-star', tone: 'accent' }
};
const LMS_FILE_STORAGE_DB_NAME = 'KIU_LMS_FILE_STORAGE';
const LMS_FILE_STORAGE_STORE_NAME = 'files';

function splitLmsTopLevel(source, delimiter) {
    const parts = [];
    let current = '';
    let quote = '';
    let depth = 0;
    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const previous = source[index - 1];
        if (quote) {
            current += char;
            if (char === quote && previous !== '\\') quote = '';
            continue;
        }
        if (char === '\'' || char === '"') {
            quote = char;
            current += char;
            continue;
        }
        if (char === '(') {
            depth += 1;
            current += char;
            continue;
        }
        if (char === ')') {
            depth = Math.max(0, depth - 1);
            current += char;
            continue;
        }
        if (depth === 0 && source.startsWith(delimiter, index)) {
            parts.push(current.trim());
            current = '';
            index += delimiter.length - 1;
            continue;
        }
        current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts.filter(Boolean);
}

function resolveLmsPropertyPath(pathExpression) {
    const parts = String(pathExpression || '').trim().split('.').filter(Boolean);
    if (!parts.length) return undefined;
    let current = typeof window !== 'undefined' ? window : globalThis;
    for (const part of parts) {
        if (current == null || !(part in current)) return undefined;
        current = current[part];
    }
    return current;
}

function decodeLmsStringLiteral(value) {
    const raw = String(value || '');
    const quote = raw[0];
    const inner = raw.slice(1, -1);
    if (quote === '"') {
        try {
            return JSON.parse(raw);
        } catch (error) {
            return inner.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }
    }
    return inner
        .replace(/\\'/g, '\'')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
}

function resolveLmsDelegatedExpression(expression, event, element) {
    const normalized = String(expression || '').trim();
    if (!normalized) return undefined;
    if (normalized === 'this') return element;
    if (normalized === 'event') return event;
    if (normalized === 'this.value') return element?.value;
    if (normalized === 'this.checked') return Boolean(element?.checked);
    const datasetMatch = normalized.match(/^this\.dataset\.([A-Za-z0-9_]+)$/);
    if (datasetMatch) {
        return element?.dataset?.[datasetMatch[1]] ?? '';
    }
    const attrMatch = normalized.match(/^this\.getAttribute\((['"])(.*?)\1\)$/);
    if (attrMatch) {
        return element?.getAttribute(attrMatch[2]) ?? '';
    }
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    if (normalized === 'null') return null;
    if (normalized === 'undefined') return undefined;
    if (/^-?\d+(?:\.\d+)?$/.test(normalized)) return Number(normalized);
    if ((normalized.startsWith('\'') && normalized.endsWith('\'')) || (normalized.startsWith('"') && normalized.endsWith('"'))) {
        return decodeLmsStringLiteral(normalized);
    }
    const orParts = splitLmsTopLevel(normalized, '||');
    if (orParts.length > 1) {
        for (const part of orParts) {
            const resolved = resolveLmsDelegatedExpression(part, event, element);
            if (resolved) return resolved;
        }
        return resolveLmsDelegatedExpression(orParts[orParts.length - 1], event, element);
    }
    const valueLookup = normalized.match(/^document\.getElementById\((['"])(.*?)\1\)\?\.(value|checked)$/);
    if (valueLookup) {
        const target = document.getElementById(valueLookup[2]);
        return valueLookup[3] === 'checked' ? Boolean(target?.checked) : target?.value;
    }
    return resolveLmsPropertyPath(normalized);
}

function executeLmsDelegatedStatement(statement, event, element) {
    const normalized = String(statement || '').trim();
    if (!normalized) return undefined;
    if (normalized === 'event.stopPropagation()') {
        event?.stopPropagation?.();
        return undefined;
    }
    const removeMatch = normalized.match(/^document\.getElementById\((['"])(.*?)\1\)\?\.remove\(\)$/);
    if (removeMatch) {
        document.getElementById(removeMatch[2])?.remove();
        return undefined;
    }
    const checkedMatch = normalized.match(/^document\.querySelectorAll\((['"])(.*?)\1\)\.forEach\(el => el\.checked = (true|false)\)$/);
    if (checkedMatch) {
        const nextChecked = checkedMatch[3] === 'true';
        document.querySelectorAll(checkedMatch[2]).forEach((node) => {
            if ('checked' in node) node.checked = nextChecked;
        });
        return undefined;
    }
    const functionMatch = normalized.match(/^([A-Za-z_$][\w$.]*)\(([\s\S]*)\)$/);
    if (!functionMatch) {
        throw new Error(`Unsupported LMS delegated action: ${normalized}`);
    }
    const target = resolveLmsPropertyPath(functionMatch[1]);
    if (typeof target !== 'function') {
        throw new Error(`LMS delegated action is not callable: ${functionMatch[1]}`);
    }
    const argsSource = String(functionMatch[2] || '').trim();
    const args = argsSource
        ? splitLmsTopLevel(argsSource, ',').map((part) => resolveLmsDelegatedExpression(part, event, element))
        : [];
    return target.apply(element, args);
}

function runLmsDelegatedMarkupAction(code, event, element) {
    const normalizedCode = String(code || '').trim();
    if (!normalizedCode) return;
    try {
        const statements = splitLmsTopLevel(normalizedCode, ';');
        let result;
        statements.forEach((statement) => {
            result = executeLmsDelegatedStatement(statement, event, element);
        });
        return result;
    } catch (error) {
        console.error('LMS delegated markup action failed.', {
            code: normalizedCode,
            element,
            error
        });
        alert('This LMS action could not run. Check the browser console for details.');
        return undefined;
    }
}

function bindLmsDelegatedMarkupActions() {
    if (typeof document === 'undefined' || window.__lmsDelegatedMarkupActionsBound) return;
    window.__lmsDelegatedMarkupActionsBound = true;

    const bindDelegatedEvent = (eventName, attributeName) => {
        document.addEventListener(eventName, (event) => {
            const rawTarget = event.target;
            if (!rawTarget || typeof rawTarget.closest !== 'function') return;
            const actionTarget = rawTarget.closest(`[${attributeName}]`);
            if (!actionTarget) return;
            const code = actionTarget.getAttribute(attributeName);
            runLmsDelegatedMarkupAction(code, event, actionTarget);
        });
    };

    bindDelegatedEvent('click', 'data-lms-click');
    bindDelegatedEvent('change', 'data-lms-change');
    bindDelegatedEvent('input', 'data-lms-input');
}

function repairLmsDisplayText(value, fallback = '') {
    const raw = String(value == null ? '' : value).trim();
    if (!raw) return String(fallback || '').trim();
    const shouldRepair = ((typeof looksLikeMojibake === 'function' && looksLikeMojibake(raw))
        || (typeof hasBrokenScheduleDisplayText === 'function' && hasBrokenScheduleDisplayText(raw))
        || /[\u00A0-\uFFFF]/.test(raw)
        || /[\u10A0-\u10FF]/.test(raw));
    if (!shouldRepair) return raw;
    let cleaned = typeof decodeScheduleMojibakeText === 'function' ? decodeScheduleMojibakeText(raw) : raw;
    try {
        if (typeof cleanupEncodingArtifacts === 'function') cleaned = cleanupEncodingArtifacts(cleaned);
    } catch (error) {}
    try {
        if (typeof toEnglishText === 'function') cleaned = toEnglishText(cleaned);
    } catch (error) {}
    if (typeof decodeScheduleMojibakeText === 'function') cleaned = decodeScheduleMojibakeText(cleaned);
    cleaned = String(cleaned == null ? '' : cleaned).trim();
    if (!cleaned || (typeof hasBrokenScheduleDisplayText === 'function' && hasBrokenScheduleDisplayText(cleaned))) {
        return String(fallback || '').trim();
    }
    return cleaned;
}

function buildLmsTimeBadge(dayValue, timeValue) {
    const repairedDay = typeof normalizeScheduleDayLabel === 'function'
        ? normalizeScheduleDayLabel(dayValue || '', '')
        : repairLmsDisplayText(dayValue || '', '');
    const repairedTime = (typeof normalizeTimeString === 'function'
        ? normalizeTimeString(timeValue || (typeof extractScheduleTime === 'function' ? extractScheduleTime(dayValue) : ''), '')
        : '')
        || repairLmsDisplayText(timeValue || '', '');
    if (!repairedDay && !repairedTime) return 'TBD';
    if (!repairedDay) return repairedTime;
    if (!repairedTime || repairedDay.includes(repairedTime)) return repairedDay;
    return `${repairedDay} ${repairedTime}`.trim();
}

function openLMSGroupsFromCard(card) {
    if (!card) return;
    const subjectId = card.getAttribute('data-subject-id') || '';
    const subjectTitle = card.getAttribute('data-subject-title') || '';
    const iconClass = card.getAttribute('data-icon-class') || 'fas fa-book-reader';
    openLMSGroups(subjectId, subjectTitle, iconClass);
}

function openLMSCourseFromCard(card) {
    if (!card) return;
    const courseKey = card.getAttribute('data-course-key') || '';
    const courseTitle = card.getAttribute('data-course-title') || courseKey;
    openLMSCourse(courseKey, courseTitle);
}

function isAntiCheatBrowserRuntime() {
    const userAgent = String(window.navigator?.userAgent || '').toLowerCase();
    return userAgent.includes('anticheatbrowser') || Boolean(window.antiCheat);
}

function canManageLmsGroupContent() {
    return [USER_ROLES.PROFESSOR, USER_ROLES.TA, USER_ROLES.ADMIN].includes(getEffectiveUserRole());
}

function getLmsRoleLabel(role = getEffectiveUserRole()) {
    const labels = {
        [USER_ROLES.STUDENT]: 'Student',
        [USER_ROLES.PROFESSOR]: 'Professor',
        [USER_ROLES.TA]: 'Teaching Assistant',
        [USER_ROLES.ADMIN]: 'Admin',
        student_service: 'Student Service'
    };
    return labels[role] || 'Student';
}

function syncLmsCourseContext(title = '', courseKey = '') {
    const context = document.getElementById('lms-course-context');
    if (!context) return;
    const titlePill = title
        ? `<span class="lux-status-pill is-muted"><i class="fas fa-location-dot"></i> ${escapeHtml(title)}</span>`
        : '';
    const resolvedKey = courseKey
        || (typeof window !== 'undefined' ? window.currentCourseId : '')
        || currentCourseId
        || '';
    const nextSessionPill = resolvedKey && typeof renderLmsNextSessionHtml === 'function' && typeof getLmsNextSessionForGroup === 'function'
        ? renderLmsNextSessionHtml(getLmsNextSessionForGroup(resolvedKey), 'inline')
        : '';
    context.innerHTML = [titlePill, nextSessionPill].filter(Boolean).join('');
}

function syncLmsNextSessionContext(courseKey = '') {
    const resolvedKey = courseKey
        || (typeof window !== 'undefined' ? window.currentCourseId : '')
        || currentCourseId
        || '';
    const titleNode = document.getElementById('lms-course-title');
    const title = titleNode?.innerText || '';
    syncLmsCourseContext(title, resolvedKey);
}

function getLmsRouteThemeMode() {
    return document.body?.classList.contains('lux-light-mode') ? 'light' : 'dark';
}

function hasLegacyLmsLayoutStyle(styleText = '') {
    return /(display|grid-template-columns|grid-template-rows|grid-auto-|gap|padding|margin|min-|max-|width|height|flex|justify-content|align-items|position|inset|top|right|bottom|left|overflow|aspect-ratio|white-space|text-align)\s*:/i.test(String(styleText || ''));
}

function collectLegacyLmsStyleContracts(styleText = '', options = {}) {
    const style = String(styleText || '').trim();
    if (!style) return [];

    const contracts = new Set();
    const isPrimaryButton = options.isPrimaryButton === true;
    const isSecondaryButton = options.isSecondaryButton === true;
    const isInputField = options.isInputField === true;
    const isBadge = options.isBadge === true;
    const isHero = options.isHero === true;

    if (/(background|background-color)\s*:\s*(white|#ffffff|#f8fafc|#f8fbff|#f4f7f6|var\(--lux-surface\)|var\(--lux-bg-soft\)|rgba\(255,\s*255,\s*255,\s*0\.(?:05|06|08|12)\))/i.test(style)) {
        contracts.add('lms-legacy-surface-soft');
    }
    if (/(border|border-top|border-right|border-bottom|border-left|border-color)\s*:\s*(?:1px\s+(?:solid|dashed)\s+)?(?:#dbe7f5|#e2e8f0|#cbd5e1|var\(--kiu-border\)|var\(--lux-border\))/i.test(style)) {
        contracts.add('lms-legacy-border');
    }
    if (/color\s*:\s*(var\(--kiu-navy\)|var\(--kiu-text-main\)|#0f172a|#102038|#111827|#1e293b|white|#fff(?:fff)?|rgba\(255,\s*255,\s*255)/i.test(style)) {
        contracts.add('lms-legacy-text');
    }
    if (/color\s*:\s*(var\(--kiu-text-muted\)|var\(--lux-text-muted\)|#64748b|#475569|#6b7280|#94a3b8|#999)/i.test(style)) {
        contracts.add('lms-legacy-text-muted');
    }
    if (/color\s*:\s*(var\(--kiu-blue\)|#0f4c81|#1d4ed8|#3730a3|#4338ca)/i.test(style)) {
        contracts.add('lms-legacy-text-accent');
    }
    if (/letter-spacing\s*:\s*0\.08em/i.test(style)) {
        contracts.add('lms-legacy-kicker');
    }
    if (/grid-template-columns\s*:\s*(repeat\((?:2|3|4)|minmax\(220px,\s*260px\)|minmax\(0,\s*1fr\)\s*minmax\(0,\s*1fr\)\s*minmax\(120px,\s*160px\))/i.test(style)) {
        contracts.add('lms-legacy-grid-collapse');
    }
    if (isBadge || /border-radius\s*:\s*999px/i.test(style)) {
        contracts.add('lms-legacy-pill');
    }
    if (isHero) {
        contracts.add('lms-legacy-hero-surface');
    }
    if (isPrimaryButton || isSecondaryButton) {
        contracts.add('lms-legacy-button-reset');
    }
    if (isInputField) {
        contracts.add('lms-legacy-field-reset');
    }

    return [...contracts];
}

function sanitizeLegacyLmsMarkup(markup = '') {
    if (typeof document === 'undefined') return String(markup || '');

    const host = document.createElement('div');
    host.innerHTML = String(markup || '');

    host.querySelectorAll('*').forEach(node => {
        const tag = String(node.tagName || '').toUpperCase();
        const classes = Array.from(node.classList || []);
        const style = node.getAttribute('style') || '';
        const type = String(node.getAttribute('type') || '').toLowerCase();
        const isPrimaryButton = classes.includes('kiu-btn-blue') || classes.includes('lux-primary-btn');
        const isSecondaryButton = classes.includes('kiu-btn-outline') || classes.includes('lux-secondary-btn') || classes.includes('portal-msg-mini-badge');
        const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !['checkbox', 'radio'].includes(type);
        const isBadge = tag === 'SPAN' && /border-radius\s*:\s*999px/i.test(style);
        const isHero = /linear-gradient\(135deg,\s*(rgba\(15,\s*23,\s*42|var\(--kiu-navy\))/i.test(style);

        if (tag === 'INPUT' && !['checkbox', 'radio'].includes(type)) {
            node.classList.add('lms-route-input');
        } else if (tag === 'TEXTAREA') {
            node.classList.add('lms-route-textarea');
        } else if (tag === 'SELECT') {
            node.classList.add('lms-route-select');
        }

        if ((classes.includes('accordion-item') || classes.includes('course-card') || classes.includes('surface-card')) && !node.classList.contains('lms-route-card')) {
            node.classList.add('lms-route-card');
        }

        if (style) {
            collectLegacyLmsStyleContracts(style, {
                isPrimaryButton,
                isSecondaryButton,
                isInputField,
                isBadge,
                isHero
            }).forEach((contract) => node.classList.add(contract));

            const canStripPresentationOnlyStyle = !hasLegacyLmsLayoutStyle(style);
            if ((canStripPresentationOnlyStyle && !isBadge && !isHero) || isPrimaryButton || isSecondaryButton || isInputField) {
                node.removeAttribute('style');
            }
        }
    });

    return host.innerHTML;
}
function upgradeLmsLegacyMarkup(markup = '') {
    const themeMode = getLmsRouteThemeMode();
    const isLight = themeMode === 'light';
    const blurChain = 'backdrop-filter:blur(var(--lux-transparency-blur,24px)) saturate(var(--lux-transparency-saturate,145%));-webkit-backdrop-filter:blur(var(--lux-transparency-blur,24px)) saturate(var(--lux-transparency-saturate,145%))';
    const surface = isLight
        ? `radial-gradient(circle at top right, rgba(var(--lux-accent-rgb), calc(0.06 + var(--lux-card-glow-alpha, 0.06))), transparent 34%), linear-gradient(180deg, rgba(255,255,255, calc(0.08 + var(--lux-panel-alpha, 0.74) * 0.48)), rgba(245,239,229, calc(0.03 + var(--lux-glass-alpha, 0.06) * 0.34))); ${blurChain}`
        : `radial-gradient(circle at top right, rgba(var(--lux-accent-rgb), calc(0.05 + var(--lux-card-glow-alpha, 0.06))), transparent 34%), linear-gradient(180deg, rgba(14,20,33, calc(var(--lux-panel-alpha, 0.74) * 0.94)), rgba(8,12,21, calc(var(--lux-panel-alpha, 0.74) * 0.72))); ${blurChain}`;
    const surfaceSoft = isLight
        ? `linear-gradient(180deg, rgba(255,255,255, calc(0.06 + var(--lux-panel-alpha, 0.74) * 0.44)), rgba(248,242,233, calc(0.04 + var(--lux-glass-alpha, 0.06) * 0.26))); ${blurChain}`
        : `linear-gradient(180deg, rgba(18,25,39, calc(0.18 + var(--lux-panel-alpha, 0.74) * 0.56)), rgba(10,15,25, calc(0.12 + var(--lux-glass-alpha, 0.26) * 0.58))); ${blurChain}`;
    const surfaceMuted = isLight
        ? `linear-gradient(180deg, rgba(255,255,255, calc(0.05 + var(--lux-panel-alpha, 0.74) * 0.36)), rgba(244,238,229, calc(0.04 + var(--lux-glass-alpha, 0.06) * 0.22))); ${blurChain}`
        : `linear-gradient(180deg, rgba(21,29,45, calc(0.12 + var(--lux-panel-alpha, 0.74) * 0.46)), rgba(12,18,29, calc(0.10 + var(--lux-glass-alpha, 0.26) * 0.44))); ${blurChain}`;
    const surfaceTertiary = isLight
        ? `linear-gradient(180deg, rgba(248,243,234, calc(0.14 + var(--lux-panel-alpha, 0.74) * 0.34)), rgba(255,255,255, calc(0.04 + var(--lux-glass-alpha, 0.06) * 0.24))); ${blurChain}`
        : `linear-gradient(180deg, rgba(16,23,36, calc(0.16 + var(--lux-panel-alpha, 0.74) * 0.42)), rgba(11,16,26, calc(0.12 + var(--lux-glass-alpha, 0.26) * 0.46))); ${blurChain}`;
    const border = 'var(--lux-border)';
    const text = 'var(--lux-text)';
    const muted = 'var(--lux-text-muted)';
    const accentGradient = isLight
        ? `linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(0.18 + var(--lux-card-glow-alpha, 0.06))), rgba(255,248,239, calc(0.18 + var(--lux-glass-alpha, 0.06)))); ${blurChain}`
        : `linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(0.18 + var(--lux-card-glow-alpha, 0.06))), rgba(var(--lux-accent-2-rgb), calc(0.12 + var(--lux-glass-alpha, 0.26)))); ${blurChain}`;
    const heroSurface = isLight
        ? `linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(0.16 + var(--lux-card-glow-alpha, 0.06))), rgba(255, 249, 241, calc(0.26 + var(--lux-glass-alpha, 0.06)))); ${blurChain}`
        : `linear-gradient(135deg, rgba(15,23,42, calc(0.84 + var(--lux-glass-alpha, 0.04))), rgba(var(--lux-accent-rgb), calc(0.30 + var(--lux-card-glow-alpha, 0.06)))); ${blurChain}`;
    const whiteText = isLight ? `color:${text}` : 'color:#ffffff';
    const whiteTextSoft = isLight ? `color:${muted}` : 'color:#ffffff';
    const replacements = [
        ['background:var(--lux-surface)', `background:${surface}`],
        ['background:white', `background:${surface}`],
        ['background: white', `background:${surface}`],
        ['background:var(--lux-bg-soft)', `background:${surfaceSoft}`],
        ['background:var(--lux-bg-soft)', `background:${surfaceSoft}`],
        ['background:var(--lux-bg-soft)', `background:${surfaceSoft}`],
        ['background:rgba(var(--lux-accent-rgb),0.06)', `background:${surfaceMuted}`],
        ['background:rgba(var(--lux-accent-rgb),0.06)', `background:${surfaceMuted}`],
        ['background:rgba(var(--lux-accent-rgb),0.06)', `background:${surfaceMuted}`],
        ['background:rgba(var(--lux-accent-rgb),0.05)', `background:${surfaceMuted}`],
        ['background:rgba(220,38,38,0.06)', `background:${surfaceMuted}`],
        ['background:rgba(var(--lux-accent-rgb),0.05)', `background:${surfaceMuted}`],
        ['background:rgba(var(--lux-accent-rgb),0.06)', `background:${surfaceMuted}`],
        ['background:var(--lux-bg-soft)', `background:${surfaceSoft}`],
        ['background:rgba(var(--lux-accent-rgb),0.05)', `background:${surfaceSoft}`],
        ['background:rgba(var(--lux-accent-rgb),0.08)', `background:${surfaceSoft}`],
        ['background:rgba(220,38,38,0.06)', `background:${surfaceSoft}`],
        ['background:var(--lux-bg-soft)', `background:${surfaceSoft}`],
        ['background:var(--lux-bg-soft)', `background:${surfaceSoft}`],
        ['background:linear-gradient(135deg, rgba(30,64,175,0.96), rgba(37,99,235,0.88))', `background:${heroSurface}`],
        ['background:linear-gradient(135deg, rgba(15,23,42,0.98), rgba(37,99,235,0.85))', `background:${heroSurface}`],
        ['background:linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.9))', `background:${heroSurface}`],
        ['background:linear-gradient(135deg, rgba(15,23,42,0.96), rgba(37,99,235,0.85))', `background:${heroSurface}`],
        ['background:linear-gradient(135deg, rgba(15,23,42,0.98), rgba(37,99,235,0.9))', `background:${heroSurface}`],
        ['background:linear-gradient(135deg, var(--kiu-navy), var(--kiu-blue))', `background:${heroSurface}`],
        ['color:var(--kiu-navy)', `color:${text}`],
        ['color:var(--kiu-text-main)', `color:${text}`],
        ['color:var(--kiu-text-muted)', `color:${muted}`],
        ['color:var(--kiu-blue)', 'color:var(--lux-accent)'],
        ['color:var(--lux-text)', `color:${text}`],
        ['color:var(--lux-text)', `color:${text}`],
        ['color:var(--lux-text)', `color:${text}`],
        ['color:var(--lux-text-muted)', `color:${muted}`],
        ['color:var(--lux-text-muted)', `color:${muted}`],
        ['color:var(--lux-text-muted)', `color:${muted}`],
        ['color:var(--lux-accent)', 'color:var(--lux-accent-2)'],
        ['color:var(--lux-accent)', 'color:var(--lux-accent)'],
        ['color:var(--lux-accent)', 'color:var(--lux-accent)'],
        ['border:1px solid #dbe7f5', `border:1px solid ${border}`],
        ['border:1px solid rgba(148,163,184,0.18)', `border:1px solid ${border}`],
        ['border:1px solid rgba(255,255,255,0.18)', 'border:1px solid rgba(255,255,255,0.08)'],
        ['border:1px dashed #cbd5e1', `border:1px dashed ${border}`],
        ['border-color:#fecaca', 'border-color:rgba(239,68,68,0.24)'],
        ['border-color:#fdba74', 'border-color:rgba(var(--lux-accent-rgb),0.24)'],
        ['box-shadow:0 14px 30px rgba(15,23,42,0.05)', 'box-shadow:0 16px 36px rgba(0,0,0,0.18)'],
        ['box-shadow:0 14px 32px rgba(15,23,42,0.05)', 'box-shadow:0 16px 36px rgba(0,0,0,0.18)'],
        ['box-shadow:0 18px 34px rgba(30,64,175,0.22)', 'box-shadow:0 18px 34px rgba(var(--lux-accent-rgb),0.18)'],
        ['box-shadow:0 24px 48px rgba(15,23,42,0.16)', 'box-shadow:0 24px 48px rgba(0,0,0,0.22)'],
        ['box-shadow:0 18px 36px rgba(15,23,42,0.16)', 'box-shadow:0 18px 36px rgba(0,0,0,0.22)'],
        ['background:rgba(255,255,255,0.12)', 'background:rgba(255,255,255,0.08)'],
        ['background:rgba(255,255,255,0.08)', 'background:rgba(255,255,255,0.06)'],
        ['background:rgba(255,255,255,0.04)', `background:${surfaceTertiary}`],
        ['background:rgba(255,255,255,0.03)', `background:${surfaceTertiary}`],
        ['background:rgba(255,255,255,0.02)', `background:${surfaceTertiary}`]
    ];
    let output = replacements.reduce((nextOutput, [search, replacement]) => nextOutput.split(search).join(replacement), String(markup || ''));

    output = output
        .replace(/background:\s*(#ffffff|white)\b/gi, `background:${surface}`)
        .replace(/background:\s*#f8fbff\b/gi, `background:${surfaceSoft}`)
        .replace(/background:\s*#f8fafc\b/gi, `background:${surfaceSoft}`)
        .replace(/background:\s*#f4f7f6\b/gi, `background:${surfaceSoft}`)
        .replace(/background:\s*#eff6ff\b/gi, `background:${surfaceMuted}`)
        .replace(/background:\s*#eef2ff\b/gi, `background:${surfaceMuted}`)
        .replace(/background:\s*linear-gradient\(135deg,\s*rgba\(30,\s*64,\s*175,\s*0\.96\),\s*rgba\(37,\s*99,\s*235,\s*0\.88\)\)/gi, `background:${heroSurface}`)
        .replace(/background:\s*linear-gradient\(135deg,\s*rgba\(15,\s*23,\s*42,\s*0\.9(?:6|8)\),\s*rgba\(37,\s*99,\s*235,\s*0\.(?:85|9)\)\)/gi, `background:${heroSurface}`)
        .replace(/background:\s*linear-gradient\(135deg,\s*var\(--kiu-navy\),\s*var\(--kiu-blue\)\)/gi, `background:${heroSurface}`)
        .replace(/color:\s*(#ffffff|#fff|white)\b/gi, whiteText)
        .replace(/color:\s*(rgba\(255,\s*255,\s*255,\s*0\.(?:8|9|92)\)|rgba\(255,\s*255,\s*255,\s*0\.84\))\b/gi, whiteTextSoft)
        .replace(/border:\s*1px solid var\(--kiu-border\)/gi, `border:1px solid ${border}`)
        .replace(/border:\s*1px solid #dbe7f5/gi, `border:1px solid ${border}`)
        .replace(/border:\s*1px solid #e2e8f0/gi, `border:1px solid ${border}`)
        .replace(/border-bottom:\s*1px solid rgba\(148,\s*163,\s*184,\s*0\.18\)/gi, `border-bottom:1px solid ${border}`)
        .replace(/box-shadow:\s*0 2px 4px rgba\(0,\s*0,\s*0,\s*0\.05\)/gi, 'box-shadow:0 16px 32px rgba(0,0,0,0.18)')
        .replace(/box-shadow:\s*0 10px 24px rgba\(15,\s*23,\s*42,\s*0\.04\)/gi, 'box-shadow:0 14px 28px rgba(0,0,0,0.16)');

        output = sanitizeLegacyLmsMarkup(output);

return output.includes('class="lms-theme-sync"') ? output : `<div class="lms-theme-sync">${output}</div>`;
}

function toDomToken(value) {
    return String(value || '').replace(/[^a-zA-Z0-9_-]+/g, '_');
}

function normalizeLmsSectionType(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return LMS_SECTION_TYPES.includes(normalized) ? normalized : '';
}

function getDefaultLmsSectionTypeForRole(role = getEffectiveUserRole()) {
    return role === USER_ROLES.TA ? 'workshop' : 'lecture';
}

function getCurrentLmsSectionType() {
    currentLmsSectionType = normalizeLmsSectionType(currentLmsSectionType)
        || getDefaultLmsSectionTypeForRole();
    return currentLmsSectionType;
}

function getLmsSectionMeta(sectionType = getCurrentLmsSectionType()) {
    const normalized = normalizeLmsSectionType(sectionType) || 'lecture';
    if (normalized === 'workshop') {
        return {
            type: 'workshop',
            label: 'Workshop',
            ownerLabel: 'Teaching Assistant',
            icon: 'fa-screwdriver-wrench',
            copy: 'Practice, recitation, labs, and TA-led support for the same group roster.'
        };
    }
    return {
        type: 'lecture',
        label: 'Lecture',
        ownerLabel: 'Professor',
        icon: 'fa-chalkboard-user',
        copy: 'Professor-led lessons, core materials, assessments, and lecture recordings.'
    };
}

function getLmsSectionSuffix(sectionType) {
    const normalized = normalizeLmsSectionType(sectionType);
    return normalized ? `${LMS_SECTION_SUFFIX_PREFIX}${normalized}` : '';
}

function stripLmsSectionSuffix(groupId) {
    const rawGroupId = String(groupId || '').trim();
    const markerIndex = rawGroupId.lastIndexOf(LMS_SECTION_SUFFIX_PREFIX);
    if (markerIndex < 0) {
        return { groupId: rawGroupId, sectionType: '' };
    }
    const baseGroupId = rawGroupId.slice(0, markerIndex);
    const sectionType = normalizeLmsSectionType(rawGroupId.slice(markerIndex + LMS_SECTION_SUFFIX_PREFIX.length));
    return {
        groupId: baseGroupId || rawGroupId,
        sectionType
    };
}

function parseLmsCourseKey(courseKey) {
    const raw = String(courseKey || '').trim();
    if (!raw.includes('::')) {
        return { courseId: raw, groupId: null, resourceKey: raw, sectionType: '' };
    }
    const [courseId, ...groupParts] = raw.split('::');
    const sectionParts = stripLmsSectionSuffix(groupParts.join('::'));
    return {
        courseId: courseId || raw,
        groupId: sectionParts.groupId || null,
        resourceKey: raw,
        sectionType: sectionParts.sectionType
    };
}

function resolveCanonicalLmsResourceKey(resourceKey) {
    const parsed = parseLmsCourseKey(resourceKey);
    if (!parsed.courseId || !parsed.groupId) return parsed.resourceKey || String(resourceKey || '');
    const targetCourseKey = canonicalCourseKey(parsed.courseId);
    const targetGroupKey = canonicalCourseKey(parsed.groupId);
    const targetSectionType = normalizeLmsSectionType(parsed.sectionType);
    const candidates = new Set([
        ...(Object.keys(KIU_STATE.lmsQuizBuilder || {})),
        ...(Object.keys(KIU_STATE.groupQuizzes || {})),
        ...(Object.keys(KIU_STATE.groupQuizSubmissions || {})),
        ...(Object.keys(KIU_STATE.groupAssignments || {})),
        ...(Object.keys(KIU_STATE.groupMaterials || {})),
        ...(Object.keys(KIU_STATE.groupSubmissions || {})),
        ...(Object.keys(KIU_STATE.groupConcepts || {})),
        ...(Object.keys(KIU_STATE.groupConceptRatings || {})),
        ...(Object.keys(KIU_STATE.groupWeekConfigs || {})),
        ...(Object.keys(KIU_STATE.lmsClassSessions || {})),
        ...(Object.keys(KIU_STATE.lmsLiveQuizzes || {}))
    ]);
    for (const candidate of candidates) {
        const p = parseLmsCourseKey(candidate);
        if (
            canonicalCourseKey(p.courseId) === targetCourseKey
            && canonicalCourseKey(p.groupId) === targetGroupKey
            && normalizeLmsSectionType(p.sectionType) === targetSectionType
        ) {
            return candidate;
        }
    }
    const subject = findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty());
    const resolvedCourseId = subject?.id || parsed.courseId;
    const availableGroups = getAvailableGroupsForSubject(resolvedCourseId);
    const resolvedGroupId = availableGroups.find(group => canonicalCourseKey(group?.id) === targetGroupKey)?.id || parsed.groupId;
    return `${resolvedCourseId}::${resolvedGroupId}${getLmsSectionSuffix(targetSectionType)}`;
}

function joinLmsMeta(parts = []) {
    return parts
        .filter(part => part !== null && part !== undefined && String(part).trim())
        .map(part => escapeHtml(String(part)))
        .join('  -  ');
}

function getLmsSectionResourceKey(courseKey = currentCourseId, sectionType = getCurrentLmsSectionType()) {
    const parsed = parseLmsCourseKey(courseKey);
    if (!parsed.courseId || !parsed.groupId) return parsed.resourceKey || String(courseKey || '');
    return resolveCanonicalLmsResourceKey(`${parsed.courseId}::${parsed.groupId}${getLmsSectionSuffix(sectionType)}`);
}

function isLmsSectionScopedTab(tab) {
    return ['calls', 'workspace', 'materials', 'concepts', 'live-quiz', 'quiz', 'monitoring', 'attendance'].includes(String(tab || ''));
}

function getLmsTabCourseKey(tab) {
    return isLmsSectionScopedTab(tab) ? getLmsSectionResourceKey(currentCourseId) : currentCourseId;
}

function syncLmsSectionSwitchPresentation() {
    const switchEl = document.getElementById('lms-section-switch');
    if (!switchEl) return;
    const sectionType = getCurrentLmsSectionType();
    const effectiveRole = getEffectiveUserRole();
    const meta = getLmsSectionMeta(sectionType);
    switchEl.dataset.activeSection = sectionType;
    switchEl.dataset.role = effectiveRole || '';
    switchEl.title = `${meta.label} view: ${meta.copy}`;
    LMS_SECTION_TYPES.forEach(type => {
        const button = document.getElementById(`lms-section-${type}`);
        if (!button) return;
        const isActive = type === sectionType;
        button.classList.toggle('active', isActive);
        button.setAttribute('aria-pressed', String(isActive));
        button.title = getLmsSectionMeta(type).copy;
    });
}

function setLmsActiveSection(sectionType) {
    const normalized = normalizeLmsSectionType(sectionType);
    if (!normalized) return;
    if (currentLmsSectionType === normalized) return;
    currentLmsSectionType = normalized;
    syncLmsSectionSwitchPresentation();
    const activeTab = document.querySelector('#page-lms-inner [data-lms-tab].is-active')?.id?.replace(/^tab-/, '') || 'interaction';
    switchLMSTab(activeTab, { force: true });
}

function renderLmsRouteEmptyState(title, copy, icon = 'fa-inbox') {
    return `
        <div class="lms-route-empty">
            <div class="lms-route-empty-icon"><i class="fas ${escapeHtml(icon)}"></i></div>
            <div class="lms-route-empty-title lms-route-copy-mt-12">${escapeHtml(title)}</div>
            <div class="lms-route-empty-copy">${escapeHtml(copy)}</div>
        </div>
    `;
}

function renderLmsRouteStats(stats = []) {
    if (!Array.isArray(stats) || !stats.length) return '';
    return `
        <div class="lms-route-stat-grid">
            ${stats.map(stat => `
                <div class="lms-route-stat">
                    <div class="lms-route-stat-label">${escapeHtml(stat.label || '')}</div>
                    <div class="lms-route-stat-value">${escapeHtml(stat.value ?? '')}</div>
                    ${stat.copy ? `<div class="lms-route-copy lms-route-copy-mt-6 lms-route-meta-12">${escapeHtml(stat.copy)}</div>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function renderLmsRouteKv(label, value) {
    return `
        <div class="lms-route-kv">
            <div class="lms-route-kv-label">${escapeHtml(label || '')}</div>
            <div class="lms-route-kv-value">${escapeHtml(value || 'Not listed')}</div>
        </div>
    `;
}

function renderLmsRouteWeekAccordion(title, subtitle, body, isOpen = false) {
    return `
        <div class="accordion-item">
            <div class="accordion-header" data-lms-click="toggleAccordion(this)">
                <div class="lms-route-card-stack lms-route-card-stack-tight">
                    <div class="lms-route-card-title lms-route-card-title-16">${escapeHtml(title || 'No Week / General')}</div>
                    ${subtitle ? `<div class="lms-route-meta lms-route-meta-12">${escapeHtml(subtitle)}</div>` : ''}
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="accordion-content ${isOpen ? 'active' : ''}"${isOpen ? '' : ' hidden'}>
                ${body}
            </div>
        </div>
    `;
}

function ensureLmsGradebookShell() {
    const wrapper = document.getElementById('lms-gradebook-wrapper');
    if (!wrapper) return null;
    if (wrapper.dataset.shellReady === '1') {
        const spreadsheet = document.getElementById('gradebook-spreadsheet-view');
        if (spreadsheet && !document.getElementById('gradebook-staff-lms-workspace')) {
            const studentView = document.getElementById('gradebook-student-view');
            const staffWorkspace = document.createElement('div');
            staffWorkspace.id = 'gradebook-staff-lms-workspace';
            staffWorkspace.className = 'gb-lms-staff-workspace lms-route-stack lms-route-stack-mb-16';
            staffWorkspace.hidden = true;
            if (studentView) {
                studentView.parentNode?.insertBefore(staffWorkspace, studentView);
            } else {
                spreadsheet.appendChild(staffWorkspace);
            }
        }
        return wrapper;
    }
    wrapper.innerHTML = `
        <div id="gradebook-roster-selection" class="lms-route-stack"></div>
        <div id="gradebook-spreadsheet-view" class="lms-route-stack" hidden>
            <div class="lms-route-panel lms-route-table-shell">
                <div class="lms-route-card-head lms-route-card-head-mb-18">
                    <div>
                        <div class="lms-route-eyebrow lms-route-inline lms-route-inline-gap-8"><i class="fas fa-chart-line"></i> Grades</div>
                        <div id="dynamic-gb-title" class="lms-route-title lms-route-title-26 lms-route-copy-mt-8">Open a roster to begin</div>
                        <div class="lms-route-copy lms-route-copy-mt-6">Quiz scores, assessments, and combined grades for this group</div>
                    </div>
                    <button type="button" class="kiu-btn-outline lms-route-btn-compact" data-lms-click="closeGradebookSpreadsheet()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
                <div id="gradebook-assessment-controls" class="lms-route-panel lms-route-panel-compact lms-route-stack-mb-16"></div>
                <div id="gradebook-staff-lms-workspace" class="gb-lms-staff-workspace lms-route-stack lms-route-stack-mb-16" hidden></div>
                <div id="gradebook-student-view" class="lms-route-stack lms-route-stack-mb-16" hidden></div>
                <div class="lms-route-table-wrap">
                    <table id="gradebook-table">
                        <thead><tr></tr></thead>
                        <tbody id="gradebook-body"></tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    wrapper.dataset.shellReady = '1';
    return wrapper;
}

function normalizeLmsDraftStorageKey(kind, key) {
    if (['material', 'assignment', 'concept'].includes(String(kind || '').toLowerCase())) {
        return resolveCanonicalLmsResourceKey(key);
    }
    return String(key || '');
}

function resolveActiveLmsQuizContext(courseKey = currentLmsQuizCourseKey || currentCourseId, faculty = getCurrentFaculty()) {
    const rawKey = String(courseKey || '').trim();
    if (!rawKey) return null;
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const resourceKey = resolveCanonicalLmsResourceKey(rawKey);
    const parsed = parseLmsCourseKey(resourceKey);
    if (!parsed.courseId || !parsed.groupId) return null;
    const subject = findCurriculumSubjectByIdOrTitle(parsed.courseId, '', normalizedFaculty)
        || findCurriculumSubjectByIdOrTitle(parsed.courseId, '', getCurrentFaculty())
        || (getAllCurriculumSubjects() || []).find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.courseId))
        || null;
    const groupCandidates = getAvailableGroupsForSubject(subject?.id || parsed.courseId);
    const group = groupCandidates.find(item => canonicalCourseKey(item?.id) === canonicalCourseKey(parsed.groupId))
        || null;
    return {
        resourceKey,
        courseId: subject?.id || parsed.courseId,
        groupId: group?.id || parsed.groupId,
        subject,
        group,
        faculty: normalizedFaculty,
        weeks: ensureLmsWeeksForKey(resourceKey)
    };
}

function ensureLmsStores() {
    if (!KIU_STATE.groupAssignments || typeof KIU_STATE.groupAssignments !== 'object') KIU_STATE.groupAssignments = {};
    if (!KIU_STATE.groupMaterials || typeof KIU_STATE.groupMaterials !== 'object') KIU_STATE.groupMaterials = {};
    if (!KIU_STATE.groupSubmissions || typeof KIU_STATE.groupSubmissions !== 'object') KIU_STATE.groupSubmissions = {};
    if (!KIU_STATE.groupConcepts || typeof KIU_STATE.groupConcepts !== 'object') KIU_STATE.groupConcepts = {};
    if (!KIU_STATE.groupConceptRatings || typeof KIU_STATE.groupConceptRatings !== 'object') KIU_STATE.groupConceptRatings = {};
    if (!KIU_STATE.groupWeekConfigs || typeof KIU_STATE.groupWeekConfigs !== 'object') KIU_STATE.groupWeekConfigs = {};
    if (!KIU_STATE.groupQuizzes || typeof KIU_STATE.groupQuizzes !== 'object') KIU_STATE.groupQuizzes = {};
    if (!KIU_STATE.groupQuizSubmissions || typeof KIU_STATE.groupQuizSubmissions !== 'object') KIU_STATE.groupQuizSubmissions = {};
    if (!KIU_STATE.lmsQuizBuilder || typeof KIU_STATE.lmsQuizBuilder !== 'object') KIU_STATE.lmsQuizBuilder = {};
    if (!KIU_STATE.lmsClassSessions || typeof KIU_STATE.lmsClassSessions !== 'object') KIU_STATE.lmsClassSessions = {};
    if (!KIU_STATE.lmsSessionMarkers || typeof KIU_STATE.lmsSessionMarkers !== 'object') KIU_STATE.lmsSessionMarkers = {};
    if (!KIU_STATE.lmsLiveQuizzes || typeof KIU_STATE.lmsLiveQuizzes !== 'object') KIU_STATE.lmsLiveQuizzes = {};
    if (!KIU_STATE.lmsInteractionModeration || typeof KIU_STATE.lmsInteractionModeration !== 'object') KIU_STATE.lmsInteractionModeration = {};
    if (!KIU_STATE.assignments || typeof KIU_STATE.assignments !== 'object') KIU_STATE.assignments = {};
    if (!KIU_STATE.submissions || typeof KIU_STATE.submissions !== 'object') KIU_STATE.submissions = {};
}

function normalizeLmsQuizStoredRecord(quiz = {}) {
    const normalizedStatus = ['draft', 'published', 'closed'].includes(String(quiz?.status || '').trim().toLowerCase())
        ? String(quiz.status).trim().toLowerCase()
        : (quiz.isPublished !== false ? 'published' : 'draft');
    const questions = normalizeLmsQuizQuestionList(quiz.questions);
    const variants = normalizeLmsQuizVariantList(quiz.variants);
    const normalizedVariantCount = Math.min(8, Math.max(1, parseInt(quiz.variantCount, 10) || variants.length || 3));
    const normalizedQuestionsPerVariant = Math.max(1, parseInt(quiz.questionsPerVariant, 10) || Math.min(questions.length || 1, 10));
    const normalizedStudentVariantMap = normalizeLmsQuizStudentVariantMap(quiz.studentVariantMap, variants);
    return {
        ...quiz,
        status: normalizedStatus,
        assessmentType: normalizeLmsQuizAssessmentType(quiz.assessmentType || 'quiz'),
        weekLabel: normalizeLmsWeekLabel(quiz.weekLabel || ''),
        questions,
        variantEnabled: quiz.variantEnabled === true,
        variantCount: normalizedVariantCount,
        questionsPerVariant: normalizedQuestionsPerVariant,
        variantAssignmentMode: 'auto-fixed',
        variantGenerationMode: 'random-type-safe',
        variantOverlapPolicy: 'unique-first',
        variants,
        studentVariantMap: normalizedStudentVariantMap,
        durationMinutes: Math.max(1, parseInt(quiz.durationMinutes, 10) || 20),
        isPublished: normalizedStatus === 'closed'
            ? true
            : (normalizedStatus === 'published' ? true : quiz.isPublished !== false),
        attendanceRequired: quiz.attendanceRequired !== false,
        submissionsVisible: quiz.submissionsVisible !== false,
        publishedAt: quiz.publishedAt || null,
        publishedBy: quiz.publishedBy || '',
        publishMode: ['manual', 'scheduled'].includes(String(quiz.publishMode || '').trim().toLowerCase())
            ? String(quiz.publishMode).trim().toLowerCase()
            : 'manual',
        allowedStudentIds: Array.isArray(quiz.allowedStudentIds) ? quiz.allowedStudentIds.map(id => String(id)) : [],
        attendanceMode: String(quiz.attendanceMode || 'manual-access-list'),
        lockedAfterPublish: quiz.lockedAfterPublish !== false,
        examSessionId: quiz.examSessionId ? String(quiz.examSessionId) : null,
        requiresBlueExamNetwork: quiz.requiresBlueExamNetwork === true,
        blueSessionMode: String(quiz.blueSessionMode || 'helper-session'),
        attendanceGateEnabled: quiz.attendanceGateEnabled !== false
    };
}

function normalizeLmsQuizQuestion(question = {}, options = {}) {
    const questionType = String(question?.type || 'mcq') === 'written' ? 'written' : 'mcq';
    const optionCount = questionType === 'written'
        ? 0
        : Math.min(6, Math.max(2, parseInt(question?.optionCount, 10) || (question?.options || []).length || 4));
    return {
        id: question?.id || makeAdminExamEntityId(options.variantClone ? 'lms-variant-question' : 'lms-question'),
        sourceQuestionId: question?.sourceQuestionId || (options.variantClone ? String(question?.id || makeAdminExamEntityId('lms-question')) : null),
        type: questionType,
        text: String(question?.text || ''),
        score: Math.max(1, parseInt(question?.score, 10) || 1),
        optionCount,
        options: questionType === 'written'
            ? []
            : Array.from({ length: optionCount }, (_, index) => String(question?.options?.[index] || '')),
        correctOption: questionType === 'written'
            ? null
            : Math.min(optionCount - 1, Math.max(0, parseInt(question?.correctOption, 10) || 0)),
        expectedAnswer: String(question?.expectedAnswer || '')
    };
}

function normalizeLmsQuizQuestionList(questions = [], options = {}) {
    return Array.isArray(questions) ? questions.map(question => normalizeLmsQuizQuestion(question, options)) : [];
}

function cloneLmsQuizQuestionForVariant(question = {}) {
    return normalizeLmsQuizQuestion({
        ...JSON.parse(JSON.stringify(question || {})),
        sourceQuestionId: question?.sourceQuestionId || question?.id || null
    }, { variantClone: true });
}

function getDefaultLmsQuizVariantLabel(index = 0) {
    return `Variant ${String.fromCharCode(65 + Math.max(0, Number(index || 0)))}`;
}

function normalizeLmsQuizVariantRecord(variant = {}, index = 0) {
    return {
        id: String(variant?.id || makeAdminExamEntityId('lms-variant')),
        label: String(variant?.label || getDefaultLmsQuizVariantLabel(index)),
        customized: variant?.customized === true,
        generatedAt: variant?.generatedAt || null,
        questions: normalizeLmsQuizQuestionList(variant?.questions, { variantClone: true })
    };
}

function normalizeLmsQuizVariantList(variants = []) {
    return Array.isArray(variants) ? variants.map((variant, index) => normalizeLmsQuizVariantRecord(variant, index)) : [];
}

function normalizeLmsQuizStudentVariantMap(studentVariantMap = {}, variants = []) {
    const allowedVariantIds = new Set((variants || []).map(variant => String(variant.id)));
    if (!studentVariantMap || typeof studentVariantMap !== 'object') return {};
    return Object.entries(studentVariantMap).reduce((accumulator, [studentId, variantId]) => {
        const normalizedStudentId = String(studentId || '').trim();
        const normalizedVariantId = String(variantId || '').trim();
        if (!normalizedStudentId || !normalizedVariantId || !allowedVariantIds.has(normalizedVariantId)) return accumulator;
        accumulator[normalizedStudentId] = normalizedVariantId;
        return accumulator;
    }, {});
}

function shuffleLmsQuizItems(items = []) {
    const copy = [...items];
    for (let index = copy.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1));
        [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
}

function calculateLmsQuizVariantQuestionMix(baseQuestions = [], questionsPerVariant = 1) {
    const safeQuestionsPerVariant = Math.max(1, Number(questionsPerVariant || 1));
    const writtenCount = baseQuestions.filter(question => String(question?.type || 'mcq') === 'written').length;
    const mcqCount = Math.max(0, baseQuestions.length - writtenCount);
    if (!baseQuestions.length) {
        return { mcq: safeQuestionsPerVariant, written: 0 };
    }
    let desiredWritten = Math.round((writtenCount / baseQuestions.length) * safeQuestionsPerVariant);
    desiredWritten = Math.max(0, Math.min(writtenCount, desiredWritten));
    let desiredMcq = Math.max(0, safeQuestionsPerVariant - desiredWritten);
    if (!mcqCount && desiredMcq > 0) {
        desiredWritten = safeQuestionsPerVariant;
        desiredMcq = 0;
    }
    if (!writtenCount && desiredWritten > 0) {
        desiredMcq = safeQuestionsPerVariant;
        desiredWritten = 0;
    }
    if (desiredWritten + desiredMcq < safeQuestionsPerVariant) {
        desiredMcq += safeQuestionsPerVariant - (desiredWritten + desiredMcq);
    }
    return { mcq: desiredMcq, written: desiredWritten };
}

function pickLmsQuizVariantQuestionsFromPool(pool = [], count = 0, usedSourceIds = new Set()) {
    if (!count) return [];
    const shuffled = shuffleLmsQuizItems(pool);
    const uniqueFirst = shuffled.filter(question => !usedSourceIds.has(String(question?.sourceQuestionId || question?.id || '')));
    const selection = [];
    uniqueFirst.slice(0, count).forEach(question => selection.push(question));
    if (selection.length < count) {
        shuffled.forEach(question => {
            if (selection.length >= count) return;
            if (selection.includes(question)) return;
            selection.push(question);
        });
    }
    return selection.slice(0, count);
}

function buildLmsQuizVariantQuestionSet(baseQuestions = [], questionsPerVariant = 1, variantCount = 1) {
    const safeBaseQuestions = normalizeLmsQuizQuestionList(baseQuestions);
    const safeQuestionsPerVariant = Math.max(1, parseInt(questionsPerVariant, 10) || 1);
    const safeVariantCount = Math.min(8, Math.max(1, parseInt(variantCount, 10) || 1));
    const mix = calculateLmsQuizVariantQuestionMix(safeBaseQuestions, safeQuestionsPerVariant);
    const mcqPool = safeBaseQuestions.filter(question => String(question.type || 'mcq') !== 'written');
    const writtenPool = safeBaseQuestions.filter(question => String(question.type || 'mcq') === 'written');
    const usedSourceIds = new Set();
    const variants = [];
    let overlapFallbackUsed = false;

    for (let index = 0; index < safeVariantCount; index += 1) {
        const desiredWritten = Math.min(mix.written, safeQuestionsPerVariant);
        const desiredMcq = Math.max(0, safeQuestionsPerVariant - desiredWritten);
        const writtenSelection = pickLmsQuizVariantQuestionsFromPool(writtenPool, desiredWritten, usedSourceIds);
        const mcqSelection = pickLmsQuizVariantQuestionsFromPool(mcqPool, desiredMcq, usedSourceIds);
        const selected = [...writtenSelection, ...mcqSelection];

        if (selected.length < safeQuestionsPerVariant) {
            overlapFallbackUsed = true;
            const fallbackPool = shuffleLmsQuizItems(safeBaseQuestions);
            fallbackPool.forEach(question => {
                if (selected.length >= safeQuestionsPerVariant) return;
                if (selected.includes(question)) return;
                selected.push(question);
            });
        }

        selected.forEach(question => usedSourceIds.add(String(question?.sourceQuestionId || question?.id || '')));
        variants.push(normalizeLmsQuizVariantRecord({
            id: makeAdminExamEntityId('lms-variant'),
            label: getDefaultLmsQuizVariantLabel(index),
            customized: false,
            generatedAt: new Date().toISOString(),
            questions: shuffleLmsQuizItems(selected).map(cloneLmsQuizQuestionForVariant)
        }, index));
    }

    return {
        variants,
        overlapFallbackUsed
    };
}

function buildLmsQuizStudentVariantMap(quiz = {}, allowedStudentIds = []) {
    const variants = normalizeLmsQuizVariantList(quiz?.variants);
    const studentIds = Array.isArray(allowedStudentIds) ? allowedStudentIds.map(id => String(id)) : [];
    if (!variants.length || !studentIds.length) return {};
    const balancedVariants = shuffleLmsQuizItems(variants);
    return studentIds.reduce((accumulator, studentId, index) => {
        const assigned = balancedVariants[index % balancedVariants.length];
        if (assigned?.id) {
            accumulator[String(studentId)] = String(assigned.id);
        }
        return accumulator;
    }, {});
}

function reconcileLmsQuizStudentVariantMap(quiz = {}, allowedStudentIds = []) {
    const variants = normalizeLmsQuizVariantList(quiz?.variants);
    const validVariantIds = new Set(variants.map(variant => String(variant.id)));
    const selectedIds = Array.isArray(allowedStudentIds) ? allowedStudentIds.map(id => String(id)) : [];
    if (!variants.length || !selectedIds.length) return {};
    const existingMap = normalizeLmsQuizStudentVariantMap(quiz?.studentVariantMap, variants);
    const variantCounts = variants.reduce((accumulator, variant) => {
        accumulator[String(variant.id)] = 0;
        return accumulator;
    }, {});
    const nextMap = {};

    selectedIds.forEach(studentId => {
        const existingVariantId = existingMap[String(studentId)];
        if (existingVariantId && validVariantIds.has(existingVariantId)) {
            nextMap[String(studentId)] = existingVariantId;
            variantCounts[existingVariantId] = (variantCounts[existingVariantId] || 0) + 1;
        }
    });

    selectedIds.forEach(studentId => {
        const normalizedStudentId = String(studentId);
        if (nextMap[normalizedStudentId]) return;
        const nextVariant = [...variants].sort((left, right) => {
            const leftCount = variantCounts[String(left.id)] || 0;
            const rightCount = variantCounts[String(right.id)] || 0;
            if (leftCount !== rightCount) return leftCount - rightCount;
            return String(left.label || '').localeCompare(String(right.label || ''));
        })[0];
        if (!nextVariant?.id) return;
        nextMap[normalizedStudentId] = String(nextVariant.id);
        variantCounts[String(nextVariant.id)] = (variantCounts[String(nextVariant.id)] || 0) + 1;
    });

    return nextMap;
}

function getLmsQuizVariantById(quiz = {}, variantId = '') {
    const normalizedId = String(variantId || '').trim();
    if (!normalizedId) return null;
    return normalizeLmsQuizVariantList(quiz?.variants).find(variant => String(variant.id) === normalizedId) || null;
}

function getLmsQuizAssignedVariant(quiz = {}, studentId = '') {
    if (quiz?.variantEnabled !== true) return null;
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedStudentId) return null;
    const variantId = quiz?.studentVariantMap?.[normalizedStudentId];
    return getLmsQuizVariantById(quiz, variantId);
}

function getLmsQuizQuestionsForStudent(quiz = {}, studentId = '', submission = null) {
    if (submission?.variantId) {
        const variantFromSubmission = getLmsQuizVariantById(quiz, submission.variantId);
        if (variantFromSubmission?.questions?.length) return variantFromSubmission.questions;
    }
    const assignedVariant = getLmsQuizAssignedVariant(quiz, studentId);
    if (assignedVariant?.questions?.length) return assignedVariant.questions;
    return normalizeLmsQuizQuestionList(quiz?.questions);
}

function getLmsQuizQuestionCount(quiz = {}, studentId = '', submission = null) {
    return getLmsQuizQuestionsForStudent(quiz, studentId, submission).length;
}

function getLmsQuizVariantSummary(quiz = {}) {
    if (quiz?.variantEnabled !== true || !Array.isArray(quiz?.variants) || !quiz.variants.length) return '';
    return `${quiz.variants.length} variants  -  ${Math.max(1, Number(quiz.questionsPerVariant || quiz.variants[0]?.questions?.length || 0))} questions each`;
}

function getLmsQuizVariantAssignmentSummary(quiz = {}) {
    if (quiz?.variantEnabled !== true || !Array.isArray(quiz?.variants) || !quiz.variants.length) return [];
    const counts = (quiz.variants || []).reduce((accumulator, variant) => {
        accumulator[String(variant.id)] = 0;
        return accumulator;
    }, {});
    Object.values(quiz?.studentVariantMap || {}).forEach(variantId => {
        const key = String(variantId || '');
        if (Object.prototype.hasOwnProperty.call(counts, key)) {
            counts[key] += 1;
        }
    });
    return (quiz.variants || []).map(variant => ({
        id: String(variant.id),
        label: String(variant.label || ''),
        count: counts[String(variant.id)] || 0
    }));
}

function getLmsQuizWorkspaceBucketName(status = 'draft') {
    const normalized = String(status || 'draft').trim().toLowerCase();
    if (normalized === 'published') return 'published';
    if (normalized === 'closed') return 'closed';
    return 'drafts';
}

function ensureLmsQuizBuilderWorkspace(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    ensureLmsStores();
    KIU_STATE.lmsQuizBuilder[resourceKey] = KIU_STATE.lmsQuizBuilder[resourceKey] || {};
    const workspace = KIU_STATE.lmsQuizBuilder[resourceKey];
    workspace.drafts = Array.isArray(workspace.drafts) ? workspace.drafts.map(normalizeLmsQuizStoredRecord) : [];
    workspace.published = Array.isArray(workspace.published) ? workspace.published.map(normalizeLmsQuizStoredRecord) : [];
    workspace.closed = Array.isArray(workspace.closed) ? workspace.closed.map(normalizeLmsQuizStoredRecord) : [];
    workspace.submissions = workspace.submissions && typeof workspace.submissions === 'object' ? workspace.submissions : {};
    workspace.ui = workspace.ui && typeof workspace.ui === 'object' ? workspace.ui : {};
    return workspace;
}

function getAllLmsQuizWorkspaceRecords(resourceKey) {
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    return [...workspace.drafts, ...workspace.published, ...workspace.closed];
}

function saveLmsQuizWorkspaceRecord(resourceKey, quiz) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    const normalized = normalizeLmsQuizStoredRecord(quiz);
    ['drafts', 'published', 'closed'].forEach(bucket => {
        workspace[bucket] = workspace[bucket].filter(item => String(item.id) !== String(normalized.id));
    });
    const targetBucket = getLmsQuizWorkspaceBucketName(normalized.status);
    workspace[targetBucket].unshift(normalized);
    workspace[targetBucket] = sortLmsQuizzes(workspace[targetBucket]);
    return normalized;
}

function removeLmsQuizWorkspaceRecord(resourceKey, quizId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    ['drafts', 'published', 'closed'].forEach(bucket => {
        workspace[bucket] = workspace[bucket].filter(item => String(item.id) !== String(quizId));
    });
    if (workspace.submissions && workspace.submissions[quizId]) {
        delete workspace.submissions[quizId];
    }
}

function cloneStoredFile(file) {
    if (!file) return null;
    return {
        id: file.id || `file_${Date.now()}`,
        name: file.name || 'download.bin',
        type: file.type || 'application/octet-stream',
        size: file.size || 0,
        dataUrl: file.dataUrl || '',
        storageKey: file.storageKey || '',
        storageBackend: file.storageBackend || (file.storageKey ? 'indexeddb' : (file.dataUrl ? 'inline' : '')),
        uploadedAt: file.uploadedAt || new Date().toISOString()
    };
}

function cloneLmsDraftFile(file) {
    if (!file) return null;
    return {
        ...cloneStoredFile(file),
        blob: file.blob instanceof Blob ? file.blob : null
    };
}


function normalizeLmsQuizAssessmentType(value = 'quiz') {
    const normalized = String(value || 'quiz').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const aliases = {
        quiz: 'quiz',
        oral: 'oral-quiz',
        oralquiz: 'oral-quiz',
        'oral-quiz': 'oral-quiz',
        midterm: 'midterm',
        'midterm-exam': 'midterm',
        final: 'final',
        'final-exam': 'final',
        retake: 'retake'
    };
    return aliases[normalized] || 'quiz';
}

function getLmsQuizAssessmentMeta(type = 'quiz') {
    const normalized = normalizeLmsQuizAssessmentType(type);
    const meta = {
        quiz: { key: 'quiz', label: 'Quiz' },
        'oral-quiz': { key: 'oral-quiz', label: 'Oral Quiz' },
        midterm: { key: 'midterm', label: 'Midterm Exam' },
        final: { key: 'final', label: 'Final Exam' },
        retake: { key: 'retake', label: 'Retake' }
    };
    return meta[normalized] || meta.quiz;
}

function ensureLmsQuizzesForKey(resourceKey) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    return getAllLmsQuizWorkspaceRecords(resourceKey);
}

function ensureLmsQuizSubmissionStore(resourceKey, quizId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    workspace.submissions[quizId] = workspace.submissions[quizId] || {};
    return workspace.submissions[quizId];
}

function getLmsQuizById(resourceKey, quizId) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    return ensureLmsQuizzesForKey(resourceKey).find(item => String(item.id) === String(quizId)) || null;
}

function getLmsQuizDisplayLabel(quiz) {
    const meta = getLmsQuizAssessmentMeta(quiz?.assessmentType || 'quiz');
    const number = normalizeAssessmentNumber(quiz?.assessmentNumber, 1);
    return `${meta.label} ${number}`;
}

function compareLmsQuizRecords(left, right) {
    const leftWeek = normalizeLmsWeekLabel(left?.weekLabel || '');
    const rightWeek = normalizeLmsWeekLabel(right?.weekLabel || '');
    const weekDiff = compareLmsWeekLabels(leftWeek || 'No Week / General', rightWeek || 'No Week / General');
    if (weekDiff !== 0) return weekDiff;
    const typeDiff = String(getLmsQuizAssessmentMeta(left?.assessmentType).label || '').localeCompare(String(getLmsQuizAssessmentMeta(right?.assessmentType).label || ''), undefined, { numeric: true, sensitivity: 'base' });
    if (typeDiff !== 0) return typeDiff;
    const numberDiff = normalizeAssessmentNumber(left?.assessmentNumber, 1) - normalizeAssessmentNumber(right?.assessmentNumber, 1);
    if (numberDiff !== 0) return numberDiff;
    return new Date(left?.createdAt || 0) - new Date(right?.createdAt || 0);
}

function sortLmsQuizzes(quizzes = []) {
    return [...quizzes].sort(compareLmsQuizRecords);
}

function getNextLmsQuizAssessmentNumber(resourceKey, assessmentType, editingQuizId = null) {
    const targetType = normalizeLmsQuizAssessmentType(assessmentType);
    const existing = ensureLmsQuizzesForKey(resourceKey)
        .filter(quiz => String(quiz.id) !== String(editingQuizId || ''))
        .filter(quiz => normalizeLmsQuizAssessmentType(quiz.assessmentType) === targetType)
        .map(quiz => normalizeAssessmentNumber(quiz.assessmentNumber, 1));
    let next = 1;
    while (existing.includes(next)) next += 1;
    return next;
}

function getLmsQuizSubmission(resourceKey, quizId, studentId) {
    const store = ensureLmsQuizSubmissionStore(resourceKey, quizId);
    return store[String(studentId)] || null;
}

function syncLmsQuizSubmissionVariant(quiz, submission, studentId) {
    if (!quiz || !submission) return submission;
    if (quiz.variantEnabled !== true) {
        submission.variantId = '';
        submission.variantLabel = '';
        return submission;
    }
    const assignedVariant = getLmsQuizAssignedVariant(quiz, studentId || submission.studentId);
    submission.variantId = String(assignedVariant?.id || '');
    submission.variantLabel = String(assignedVariant?.label || '');
    return submission;
}

function ensureLmsQuizSubmissionShell(resourceKey, quizId, student) {
    const store = ensureLmsQuizSubmissionStore(resourceKey, quizId);
    const key = String(student?.id || '');
    if (!key) return null;
    if (!store[key] || typeof store[key] !== 'object') {
        store[key] = {
            studentId: key,
            studentName: student?.name || `Student ${key}`,
            status: 'not-started',
            attendanceStatus: '',
            startedAt: null,
            submittedAt: null,
            draftAnswers: {},
            answers: {},
            autoScoreRaw: 0,
            manualScoreRaw: null,
            manualScoresByQuestion: {},
            finalScoreRaw: null,
            gradebookScore: null,
            requiresManualReview: false,
            gradedAt: null,
            gradedBy: null,
            history: [],
            proctorEvents: [],
            blueSessionId: null,
            blueBindStatus: '',
            blueConnected: false,
            blueLastHeartbeatAt: null,
            blueDisconnectedAt: null,
            blueReconnectAt: null,
            blueDisconnectAccumulatedMs: 0,
            attendanceVerifiedAt: null,
            attendanceVerifiedBy: '',
            outsideActionCount: 0,
            examSessionId: null,
            examSessionStatus: '',
            sessionStartedAt: null,
            sessionEndsAt: null,
            sessionApproved: false,
            sessionBlocked: false,
            variantId: '',
            variantLabel: ''
        };
    }
    store[key].studentName = store[key].studentName || student?.name || `Student ${key}`;
    if (!store[key].manualScoresByQuestion || typeof store[key].manualScoresByQuestion !== 'object') {
        store[key].manualScoresByQuestion = {};
    }
    if (!Array.isArray(store[key].proctorEvents)) {
        store[key].proctorEvents = [];
    }
    if (!Number.isFinite(Number(store[key].blueDisconnectAccumulatedMs))) {
        store[key].blueDisconnectAccumulatedMs = 0;
    }
    if (!Number.isFinite(Number(store[key].outsideActionCount))) {
        store[key].outsideActionCount = 0;
    }
    if (!store[key].examSessionId && store[key].examSessionId !== null) {
        store[key].examSessionId = null;
    }
    store[key].examSessionStatus = String(store[key].examSessionStatus || '');
    store[key].sessionStartedAt = store[key].sessionStartedAt || null;
    store[key].sessionEndsAt = store[key].sessionEndsAt || null;
    store[key].sessionApproved = store[key].sessionApproved === true;
    store[key].sessionBlocked = store[key].sessionBlocked === true;
    store[key].variantId = String(store[key].variantId || '');
    store[key].variantLabel = String(store[key].variantLabel || '');
    return store[key];
}

function ensureLmsStudentQuizAttemptActive(resourceKey, quiz, studentMeta = {}) {
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz?.id, studentMeta);
    if (!submission) return null;
    syncLmsQuizSubmissionVariant(quiz, submission, studentMeta?.id || submission.studentId);
    if (!submission.startedAt) {
        const startedAt = new Date().toISOString();
        submission.startedAt = startedAt;
        submission.status = 'in-progress';
        submission.history = Array.isArray(submission.history) ? submission.history : [];
        submission.history.push({
            action: 'started',
            updatedAt: startedAt,
            updatedBy: String(studentMeta?.name || submission.studentName || `Student ${submission.studentId || ''}`),
            note: 'Quiz attempt started from protected view.'
        });
        saveState();
    } else if (!['submitted', 'auto-submitted', 'graded'].includes(String(submission.status || ''))) {
        submission.status = 'in-progress';
    }
    return submission;
}

function getLmsQuizExamSession(quiz = null) {
    const sessionId = String(quiz?.examSessionId || '').trim();
    return sessionId ? getExamSessionById(sessionId) : null;
}

function getLmsQuizExamSessionAttendance(session, studentId) {
    const targetId = String(studentId || '');
    if (!session || !targetId) return { status: '', verifiedAt: null, verifiedBy: '' };
    const entry = session.attendanceByStudentId?.[targetId];
    return entry && typeof entry === 'object'
        ? {
            status: String(entry.status || ''),
            verifiedAt: entry.verifiedAt || null,
            verifiedBy: String(entry.verifiedBy || '')
        }
        : { status: '', verifiedAt: null, verifiedBy: '' };
}

function isLmsExamSessionAttendanceQualified(status) {
    return ['present', 'late'].includes(String(status || '').trim().toLowerCase());
}

function getLmsQuizExamSessionGateStatus(resourceKey, quiz, submission, studentId) {
    const session = getLmsQuizExamSession(quiz);
    const targetId = String(studentId || '');
    if (!session || !targetId) {
        return {
            required: false,
            session: null,
            startUnlocked: true,
            submitUnlocked: true,
            quizBodyVisible: true,
            studentAllowed: true,
            blocked: false,
            attendanceQualified: true,
            status: 'none',
            message: '',
            disconnectElapsedMs: 0
        };
    }
    const allowedIds = new Set((session.allowedStudentIds || []).map(id => String(id)));
    const blockedIds = new Set((session.blockedStudentIds || []).map(id => String(id)));
    const sessionStatus = normalizeExamSessionStatus(session.status || 'draft');
    const attendance = getLmsQuizExamSessionAttendance(session, targetId);
    const studentAllowed = allowedIds.has(targetId);
    const blocked = blockedIds.has(targetId);
    const attendanceQualified = true;
    const now = Date.now();
    const endsAt = session.endsAt ? new Date(session.endsAt).getTime() : null;
    const expired = Number.isFinite(endsAt) && now >= endsAt;
    const effectiveStatus = expired && sessionStatus === 'live' ? 'closed' : sessionStatus;
    let message = '';
    if (!studentAllowed) {
        message = 'Your account is not on the approved exam list for this lab session.';
    } else if (blocked) {
        message = 'Your account was blocked from this exam session by staff.';
    } else if (effectiveStatus === 'draft' || effectiveStatus === 'waiting') {
        message = 'The exam session is ready, but staff has not started it yet.';
    } else if (effectiveStatus === 'closed') {
        message = expired
            ? 'The exam session time is over.'
            : 'This exam session has already been closed by staff.';
    }
    const accessGranted = studentAllowed && !blocked && attendanceQualified;
    const live = effectiveStatus === 'live';
    return {
        required: true,
        session,
        startUnlocked: accessGranted && live,
        submitUnlocked: accessGranted && live,
        quizBodyVisible: accessGranted && live,
        studentAllowed,
        blocked,
        attendanceQualified,
        status: effectiveStatus,
        message,
        disconnectElapsedMs: expired && Number.isFinite(endsAt) ? Math.max(0, now - endsAt) : 0
    };
}

function syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, studentMeta = {}) {
    if (!submission) return null;
    const sessionGate = getLmsQuizExamSessionGateStatus(resourceKey, quiz, submission, studentMeta?.id || submission.studentId);
    if (!sessionGate.required) {
        submission.examSessionId = null;
        submission.examSessionStatus = '';
        submission.sessionStartedAt = null;
        submission.sessionEndsAt = null;
        submission.sessionApproved = false;
        submission.sessionBlocked = false;
        return submission;
    }
    const attendance = getLmsQuizExamSessionAttendance(sessionGate.session, studentMeta?.id || submission.studentId);
    submission.examSessionId = sessionGate.session.id;
    submission.examSessionStatus = sessionGate.status;
    submission.sessionStartedAt = sessionGate.session.startedAt || null;
    submission.sessionEndsAt = sessionGate.session.endsAt || null;
    submission.sessionApproved = sessionGate.studentAllowed && !sessionGate.blocked;
    submission.sessionBlocked = sessionGate.blocked;
    submission.attendanceStatus = '';
    submission.attendanceVerifiedAt = null;
    submission.attendanceVerifiedBy = '';
    return submission;
}

function getLmsExamSessionMonitorStats(session, resourceKey, quiz) {
    if (!session || !quiz) {
        return {
            allowedCount: 0,
            presentCount: 0,
            blockedCount: 0,
            inProgressCount: 0,
            submittedCount: 0,
            alertCount: 0,
            notStartedCount: 0
        };
    }
    const roster = getLmsQuizEligibleStudents(resourceKey).filter(student => (session.allowedStudentIds || []).includes(String(student.id)));
    let presentCount = 0;
    let blockedCount = 0;
    let inProgressCount = 0;
    let submittedCount = 0;
    let alertCount = 0;
    let notStartedCount = 0;
    roster.forEach(student => {
        const submission = ensureLmsQuizSubmissionShell(resourceKey, quiz.id, student);
        syncLmsQuizExamSessionSubmissionState(resourceKey, quiz, submission, student);
        if (submission.sessionApproved) presentCount += 1;
        if (submission.sessionBlocked) blockedCount += 1;
        if (submission.status === 'in-progress') inProgressCount += 1;
        if (['submitted', 'auto-submitted', 'graded'].includes(String(submission.status || ''))) {
            submittedCount += 1;
        } else if (submission.status === 'not-started') {
            notStartedCount += 1;
        }
        alertCount += Number(submission.outsideActionCount || 0);
    });
    return {
        allowedCount: roster.length,
        presentCount,
        blockedCount,
        inProgressCount,
        submittedCount,
        alertCount,
        notStartedCount
    };
}

function getKiuBlueHelperBaseUrl() {
    return String(window.KIU_BLUE_HELPER_URL || localStorage.getItem('KIU_BLUE_HELPER_URL') || KIU_BLUE_HELPER_DEFAULT_URL)
        .trim()
        .replace(/\/+$/, '');
}

function getKiuBlueExamRuntime() {
    if (!window.__kiuBlueExamRuntime || typeof window.__kiuBlueExamRuntime !== 'object') {
        window.__kiuBlueExamRuntime = {
            helperReachable: false,
            lastFetchedAt: 0,
            lastError: '',
            pending: false,
            status: 'idle',
            sessionHealth: 'idle',
            activeSession: null,
            connectedStudentCount: 0,
            totalBoundStudentCount: 0,
            heartbeatTarget: null,
            lastStudentGateKey: ''
        };
    }
    return window.__kiuBlueExamRuntime;
}

function getKiuBlueSessionStudents() {
    const sessionStudents = getKiuBlueExamRuntime().activeSession?.students;
    return Array.isArray(sessionStudents) ? sessionStudents : [];
}

function getKiuBlueStudentSessionEntry(studentId) {
    const targetId = String(studentId || '');
    if (!targetId) return null;
    return getKiuBlueSessionStudents().find(entry => String(entry?.studentId || '') === targetId) || null;
}

function mergeKiuBlueHelperState(payload = {}) {
    const runtime = getKiuBlueExamRuntime();
    runtime.helperReachable = true;
    runtime.lastFetchedAt = Date.now();
    runtime.lastError = '';
    runtime.status = String(payload?.status || 'idle');
    runtime.sessionHealth = String(payload?.sessionHealth || 'idle');
    runtime.activeSession = payload?.activeSession && typeof payload.activeSession === 'object'
        ? payload.activeSession
        : null;
    runtime.connectedStudentCount = Number(payload?.connectedStudentCount || 0);
    runtime.totalBoundStudentCount = Number(payload?.totalBoundStudentCount || 0);
    return runtime;
}

async function fetchKiuBlueHelperJson(path, options = {}) {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;
    try {
        const response = await fetch(`${getKiuBlueHelperBaseUrl()}${path}`, {
            method: options.method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: options.body ? JSON.stringify(options.body) : undefined,
            mode: 'cors',
            cache: 'no-store',
            signal: controller?.signal
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
            const error = new Error(payload?.error || `Exam verification helper request failed (${response.status})`);
            error.payload = payload;
            throw error;
        }
        return payload;
    } finally {
        if (timeoutId) clearTimeout(timeoutId);
    }
}

async function refreshKiuBlueHelperState(options = {}) {
    const runtime = getKiuBlueExamRuntime();
    const force = options.force === true;
    if (!force && runtime.pending) return runtime;
    if (!force && runtime.lastFetchedAt && (Date.now() - runtime.lastFetchedAt) < KIU_BLUE_STATUS_TTL_MS) {
        return runtime;
    }
    runtime.pending = true;
    try {
        const payload = await fetchKiuBlueHelperJson('/api/status');
        mergeKiuBlueHelperState(payload);
        return runtime;
    } catch (error) {
        runtime.helperReachable = false;
        runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
        runtime.lastFetchedAt = Date.now();
        runtime.activeSession = null;
        runtime.connectedStudentCount = 0;
        runtime.totalBoundStudentCount = 0;
        return runtime;
    } finally {
        runtime.pending = false;
    }
}

function isLmsQuizBlueExamRequired(quiz = {}) {
    return false;
}

function isLmsQuizAttendanceQualified(submission = {}, quiz = {}) {
    if (!isLmsQuizBlueExamRequired(quiz) || quiz?.attendanceGateEnabled === false) {
        return true;
    }
    return ['present', 'late'].includes(String(submission?.attendanceStatus || '').trim().toLowerCase());
}

function getLmsQuizOutsideActionCount(submission) {
    const outsideEventTypes = new Set([
        'left-tab',
        'fullscreen-exit',
        'before-unload-blocked',
        'shortcut-blocked',
        'left-protected-view'
    ]);
    return (submission?.proctorEvents || []).filter(event => outsideEventTypes.has(String(event?.type || ''))).length;
}

function formatLmsDurationLabel(ms) {
    if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return '00:00';
    return formatCountdownDuration(Number(ms));
}

function getLmsQuizBlueDisconnectElapsedMs(submission = {}) {
    const accumulated = Number(submission?.blueDisconnectAccumulatedMs || 0);
    const activeDisconnect = submission?.blueDisconnectedAt ? Math.max(0, Date.now() - new Date(submission.blueDisconnectedAt).getTime()) : 0;
    return accumulated + activeDisconnect;
}

function getLmsQuizBlueGateStatus(resourceKey, quiz, submission, studentId) {
    const required = isLmsQuizBlueExamRequired(quiz);
    if (!required) {
        return {
            required: false,
            helperReachable: true,
            sessionActive: true,
            connected: true,
            attendanceQualified: true,
            startUnlocked: true,
            blankAttempt: false,
            rosterEntry: null,
            message: '',
            disconnectElapsedMs: 0
        };
    }
    const runtime = getKiuBlueExamRuntime();
    const rosterEntry = getKiuBlueStudentSessionEntry(studentId);
    const attendanceQualified = isLmsQuizAttendanceQualified(submission, quiz);
    const helperReachable = runtime.helperReachable;
    const sessionActive = Boolean(
        runtime.activeSession?.id
        && helperReachable
        && !['idle', 'offline', 'error'].includes(String(runtime.sessionHealth || runtime.status || '').trim().toLowerCase())
    );
    const connected = Boolean(helperReachable && sessionActive && rosterEntry?.connected);
    const attemptLive = ['in-progress'].includes(String(submission?.status || ''));
    let message = '';
    if (!helperReachable) {
        message = 'Exam verification helper is offline, so the portal cannot verify the exam session.';
    } else if (!sessionActive) {
        message = 'Exam verification is not active yet.';
    } else if (!attendanceQualified) {
        message = 'Attendance is not confirmed yet. TA / professor must mark this student present before Start Quiz unlocks.';
    } else if (!connected) {
        message = 'This account is not connected to the required exam verification session.';
    }
    return {
        required: true,
        helperReachable,
        sessionActive,
        connected,
        attendanceQualified,
        startUnlocked: Boolean(helperReachable && sessionActive && connected && attendanceQualified),
        blankAttempt: Boolean(attemptLive && (!helperReachable || !sessionActive || !connected)),
        rosterEntry,
        message,
        disconnectElapsedMs: getLmsQuizBlueDisconnectElapsedMs(submission)
    };
}

function syncLmsQuizBlueSubmissionState(resourceKey, quiz, submission, studentMeta) {
    if (!submission || !isLmsQuizBlueExamRequired(quiz)) return false;
    const runtime = getKiuBlueExamRuntime();
    const rosterEntry = getKiuBlueStudentSessionEntry(studentMeta?.id || submission.studentId);
    const nowIso = new Date().toISOString();
    let changed = false;
    const setField = (field, value) => {
        if (submission[field] === value) return;
        submission[field] = value;
        changed = true;
    };
    setField('blueSessionId', runtime.activeSession?.id || null);
    setField('blueBindStatus', !runtime.helperReachable
        ? 'helper-unreachable'
        : !runtime.activeSession?.id
            ? 'session-offline'
            : rosterEntry?.connected
                ? 'connected'
                : rosterEntry
                    ? (rosterEntry.connectionStatus || 'disconnected')
                    : 'not-bound');
    setField('blueConnected', Boolean(runtime.helperReachable && runtime.activeSession?.id && rosterEntry?.connected));
    setField('blueLastHeartbeatAt', rosterEntry?.lastHeartbeatAt || null);
    setField('outsideActionCount', getLmsQuizOutsideActionCount(submission));

    if (rosterEntry?.present !== undefined) {
        if (submission.attendanceStatus !== rosterEntry.presentStatus && rosterEntry.presentStatus) {
            submission.attendanceStatus = rosterEntry.presentStatus;
            changed = true;
        }
        if (rosterEntry.attendanceVerifiedAt && submission.attendanceVerifiedAt !== rosterEntry.attendanceVerifiedAt) {
            submission.attendanceVerifiedAt = rosterEntry.attendanceVerifiedAt;
            changed = true;
        }
        if (rosterEntry.attendanceVerifiedBy && submission.attendanceVerifiedBy !== rosterEntry.attendanceVerifiedBy) {
            submission.attendanceVerifiedBy = rosterEntry.attendanceVerifiedBy;
            changed = true;
        }
    }

    if (String(submission.status || '') === 'in-progress') {
        if (submission.blueConnected) {
            if (submission.blueDisconnectedAt) {
                const disconnectStart = new Date(submission.blueDisconnectedAt).getTime();
                const reconnectAt = new Date(rosterEntry?.lastHeartbeatAt || nowIso).getTime();
                if (Number.isFinite(disconnectStart) && Number.isFinite(reconnectAt) && reconnectAt > disconnectStart) {
                    submission.blueDisconnectAccumulatedMs = Number(submission.blueDisconnectAccumulatedMs || 0) + (reconnectAt - disconnectStart);
                }
                submission.blueReconnectAt = rosterEntry?.lastHeartbeatAt || nowIso;
                submission.blueDisconnectedAt = null;
                changed = true;
                recordLmsQuizProctorEvent(resourceKey, quiz.id, studentMeta, 'blue-reconnected', 'Student reconnected to exam verification');
            }
        } else if (!submission.blueDisconnectedAt) {
            submission.blueDisconnectedAt = nowIso;
            changed = true;
            recordLmsQuizProctorEvent(
                resourceKey,
                quiz.id,
                studentMeta,
                runtime.helperReachable ? 'blue-disconnected' : 'blue-heartbeat-timeout',
                runtime.helperReachable
                    ? 'Student is no longer connected to exam verification'
                    : 'Exam verification heartbeat failed during the quiz'
            );
        }
    }

    if (changed) {
        submission.outsideActionCount = getLmsQuizOutsideActionCount(submission);
        saveState();
    }
    return changed;
}

function clearKiuBlueDisconnectInterval() {
    if (activeKiuBlueDisconnectInterval) {
        clearInterval(activeKiuBlueDisconnectInterval);
        activeKiuBlueDisconnectInterval = null;
    }
}

function updateVisibleKiuBlueDisconnectTimer() {
    const timerEl = document.getElementById('lms-blue-disconnect-timer');
    if (!timerEl) return;
    const resourceKey = resolveCanonicalLmsResourceKey(currentLmsQuizCourseKey || currentCourseId);
    const uiState = ensureLmsQuizUiState(resourceKey);
    const quizId = String(uiState.studentQuizId || '');
    if (!quizId) return;
    const studentId = resolveLmsQuizStudentMeta(resourceKey, getLmsQuizById(resourceKey, quizId)).id;
    const submission = getLmsQuizSubmission(resourceKey, quizId, studentId);
    timerEl.textContent = formatLmsDurationLabel(getLmsQuizBlueDisconnectElapsedMs(submission));
}

function buildLmsQuizBlueGateKey(gateStatus = {}) {
    return JSON.stringify({
        required: gateStatus.required === true,
        helperReachable: gateStatus.helperReachable === true,
        sessionActive: gateStatus.sessionActive === true,
        connected: gateStatus.connected === true,
        attendanceQualified: gateStatus.attendanceQualified === true,
        blankAttempt: gateStatus.blankAttempt === true,
        message: String(gateStatus.message || '')
    });
}

async function unregisterKiuBlueStudentSession(studentMeta = {}) {
    const studentId = String(studentMeta?.id || '');
    if (!studentId) return;
    try {
        const runtime = getKiuBlueExamRuntime();
        const payload = await fetchKiuBlueHelperJson('/api/session/unregister', {
            method: 'POST',
            body: {
                studentId,
                accountId: studentId,
                sessionId: runtime.activeSession?.id || null
            }
        });
        mergeKiuBlueHelperState(payload?.state || {});
    } catch (error) {
        const runtime = getKiuBlueExamRuntime();
        runtime.helperReachable = false;
        runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
    }
}

async function syncKiuBlueAttendanceToHelper(resourceKey, quizId, studentId, submission = {}) {
    const normalizedStudentId = String(studentId || '').trim();
    if (!normalizedStudentId) return null;
    try {
        const runtime = getKiuBlueExamRuntime();
        const payload = await fetchKiuBlueHelperJson('/api/session/attendance', {
            method: 'POST',
            body: {
                sessionId: runtime.activeSession?.id || null,
                studentId: normalizedStudentId,
                studentName: submission.studentName || `Student ${normalizedStudentId}`,
                accountId: normalizedStudentId,
                resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
                quizId: String(quizId || ''),
                presentStatus: String(submission.attendanceStatus || ''),
                attendanceVerifiedAt: submission.attendanceVerifiedAt || null,
                attendanceVerifiedBy: submission.attendanceVerifiedBy || ''
            }
        });
        mergeKiuBlueHelperState(payload?.state || {});
        return payload;
    } catch (error) {
        const runtime = getKiuBlueExamRuntime();
        runtime.helperReachable = false;
        runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
        return null;
    }
}

function stopKiuBlueStudentHeartbeat(options = {}) {
    const runtime = getKiuBlueExamRuntime();
    if (activeKiuBlueHeartbeatInterval) {
        clearInterval(activeKiuBlueHeartbeatInterval);
        activeKiuBlueHeartbeatInterval = null;
    }
    clearKiuBlueDisconnectInterval();
    const target = runtime.heartbeatTarget;
    runtime.heartbeatTarget = null;
    runtime.lastStudentGateKey = '';
    if (options.unregister && target?.studentMeta?.id) {
        unregisterKiuBlueStudentSession(target.studentMeta);
    }
}

function ensureKiuBlueStatusSoon() {
    refreshKiuBlueHelperState({ force: false }).then(() => {
        if (document.getElementById('lms-content-area')) {
            rerenderCurrentLmsQuizWorkspace();
        }
    });
}

function ensureKiuBlueStudentHeartbeat(resourceKey, quiz, studentMeta, subject = null, group = null) {
    if (!isLmsQuizBlueExamRequired(quiz) || !studentMeta?.id) {
        stopKiuBlueStudentHeartbeat();
        return;
    }
    const runtime = getKiuBlueExamRuntime();
    const targetKey = `${resolveCanonicalLmsResourceKey(resourceKey)}::${quiz.id}::${studentMeta.id}`;
    if (runtime.heartbeatTarget?.key === targetKey && activeKiuBlueHeartbeatInterval) {
        return;
    }
    stopKiuBlueStudentHeartbeat();
    runtime.heartbeatTarget = {
        key: targetKey,
        resourceKey: resolveCanonicalLmsResourceKey(resourceKey),
        quizId: String(quiz.id),
        studentMeta: {
            id: String(studentMeta.id),
            name: studentMeta.name || `Student ${studentMeta.id}`
        },
        subject,
        group
    };

    const tick = async () => {
        const currentTarget = runtime.heartbeatTarget;
        if (!currentTarget || currentTarget.key !== targetKey) return;
        let previousGateKey = runtime.lastStudentGateKey;
        const existingEntry = getKiuBlueStudentSessionEntry(currentTarget.studentMeta.id);
        try {
            const payload = await fetchKiuBlueHelperJson(existingEntry ? '/api/session/heartbeat' : '/api/session/register', {
                method: 'POST',
                body: {
                    sessionId: runtime.activeSession?.id || null,
                    studentId: currentTarget.studentMeta.id,
                    studentName: currentTarget.studentMeta.name,
                    accountId: currentTarget.studentMeta.id,
                    resourceKey: currentTarget.resourceKey,
                    quizId: currentTarget.quizId,
                    userAgent: navigator.userAgent
                }
            });
            mergeKiuBlueHelperState(payload?.state || {});
        } catch (error) {
            runtime.helperReachable = false;
            runtime.lastError = error?.message || 'Exam verification helper is unreachable.';
            runtime.activeSession = null;
        }
        const activeQuiz = getLmsQuizById(currentTarget.resourceKey, currentTarget.quizId);
        const submission = ensureLmsQuizSubmissionShell(currentTarget.resourceKey, currentTarget.quizId, currentTarget.studentMeta);
        if (!activeQuiz || !submission) return;
        syncLmsQuizBlueSubmissionState(currentTarget.resourceKey, activeQuiz, submission, currentTarget.studentMeta);
        const gateKey = buildLmsQuizBlueGateKey(getLmsQuizBlueGateStatus(currentTarget.resourceKey, activeQuiz, submission, currentTarget.studentMeta.id));
        if (gateKey !== previousGateKey) {
            runtime.lastStudentGateKey = gateKey;
            renderStudentLmsQuizSection(currentCourseId, currentTarget.subject, currentTarget.group);
        } else {
            runtime.lastStudentGateKey = gateKey;
        }
    };

    const initialTickPromise = tick();
    activeKiuBlueHeartbeatInterval = setInterval(tick, KIU_BLUE_HEARTBEAT_MS);
    return initialTickPromise;
}

function getLmsQuizQuestionManualMax(question = {}) {
    return String(question.type || 'mcq') === 'written'
        ? Math.max(0, parseFloat(question.score) || 0)
        : 0;
}

function getLmsQuizLifecycleStatus(quiz = {}) {
    const normalized = String(quiz?.status || '').trim().toLowerCase();
    if (['draft', 'published', 'closed'].includes(normalized)) return normalized;
    return quiz?.isPublished === false ? 'draft' : 'published';
}

function isLmsQuizVisibleToStudentsNow(quiz = {}, now = new Date()) {
    if (getLmsQuizLifecycleStatus(quiz) === 'draft' || quiz?.isPublished === false) return false;
    const publishMode = String(quiz?.publishMode || 'manual').trim().toLowerCase();
    const startAt = quiz?.availableFrom ? new Date(quiz.availableFrom) : null;
    if (
        publishMode === 'scheduled'
        && startAt instanceof Date
        && !Number.isNaN(startAt.getTime())
        && now.getTime() < startAt.getTime()
    ) {
        return false;
    }
    return true;
}

function recordLmsQuizProctorEvent(resourceKey, quizId, studentMeta, type, note) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const studentId = String(studentMeta?.id || '');
    if (!resourceKey || !quizId || !studentId) return null;
    const submission = ensureLmsQuizSubmissionShell(resourceKey, quizId, studentMeta);
    const event = {
        id: `proctor_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: String(type || 'notice'),
        note: String(note || ''),
        createdAt: new Date().toISOString(),
        studentId,
        studentName: studentMeta?.name || submission.studentName || `Student ${studentId}`
    };
    submission.proctorEvents = Array.isArray(submission.proctorEvents) ? submission.proctorEvents : [];
    submission.proctorEvents.push(event);
    submission.outsideActionCount = getLmsQuizOutsideActionCount(submission);
    submission.history = Array.isArray(submission.history) ? submission.history : [];
    submission.history.push({
        action: 'proctor',
        updatedAt: event.createdAt,
        updatedBy: event.studentName,
        note: `${event.type}: ${event.note}`
    });
    saveState();
    logProtectedQuizEventToBackend(resourceKey, quizId, studentMeta, event.type, event.note, {
        createdAt: event.createdAt,
        localEventId: event.id
    }).catch(() => null);
    return event;
}

function getLmsQuizLatestProctorEvent(submission) {
    const events = Array.isArray(submission?.proctorEvents) ? submission.proctorEvents : [];
    return events.length ? events[events.length - 1] : null;
}

function getLmsQuizProctorAlertCount(submission) {
    return (submission?.proctorEvents || []).filter(event => String(event?.type || '') !== 'returned-to-quiz' && String(event?.type || '') !== 'fullscreen-restored').length;
}

function getLmsQuizFocusProtectionConfig(quiz = {}) {
    const antiCheat = quiz?.antiCheat && typeof quiz.antiCheat === 'object' ? quiz.antiCheat : {};
    return {
        maxWarnings: Math.max(1, parseInt(antiCheat.maxWarnings, 10) || 3),
        duplicateWindowMs: Math.max(300, parseInt(antiCheat.duplicateWindowMs, 10) || 1800),
        autoSubmitOnMaxWarnings: antiCheat.autoSubmitOnMaxWarnings !== false,
        blockSelection: antiCheat.blockSelection !== false,
        blockShortcuts: antiCheat.blockShortcuts !== false,
        blockBeforeUnload: antiCheat.blockBeforeUnload !== false
    };
}

function isLmsQuizEditableTarget(target) {
    if (!target) return false;
    if (target.isContentEditable) return true;
    const tagName = String(target.tagName || '').toUpperCase();
    if (['INPUT', 'TEXTAREA', 'SELECT', 'OPTION'].includes(tagName)) return true;
    return typeof target.closest === 'function'
        && Boolean(target.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""], .ql-editor'));
}

function getLmsQuizBlockedShortcutMeta(event) {
    const key = String(event?.key || '').toLowerCase();
    const ctrlOrMeta = Boolean(event?.ctrlKey || event?.metaKey);
    const shift = Boolean(event?.shiftKey);
    if (key === 'f12') {
        return {
            type: 'shortcut-blocked',
            note: 'Developer tools shortcut was blocked during quiz focus mode'
        };
    }
    if (key === 'f5' || (ctrlOrMeta && key === 'r')) {
        return {
            type: 'shortcut-blocked',
            note: 'Refresh shortcut was blocked during quiz focus mode'
        };
    }
    if (!ctrlOrMeta) return null;
    if (key === 'c' && shift) {
        return {
            type: 'shortcut-blocked',
            note: 'Developer tools shortcut was blocked during quiz focus mode'
        };
    }
    const shortcutLabels = {
        c: 'Copy',
        v: 'Paste',
        x: 'Cut',
        p: 'Print',
        s: 'Save',
        u: 'View source',
        i: 'Developer tools',
        j: 'Developer tools',
        l: 'Address bar'
    };
    if (shortcutLabels[key]) {
        return {
            type: 'shortcut-blocked',
            note: `${shortcutLabels[key]} shortcut was blocked during quiz focus mode`
        };
    }
    if (key === 'a' && !isLmsQuizEditableTarget(event?.target)) {
        return {
            type: 'shortcut-blocked',
            note: 'Select all shortcut was blocked during quiz focus mode'
        };
    }
    return null;
}

function getLmsQuizAutoSubmitNotice(submission, needsManualReview, reviewerLabel = 'Staff') {
    const baseMessage = needsManualReview
        ? `Your answers were submitted. ${reviewerLabel} still need to review the written part before the final score appears.`
        : 'Your answers were submitted successfully.';
    if (String(submission?.status || '') !== 'auto-submitted') {
        return baseMessage;
    }
    if (submission?.proctorAutoSubmittedAt) {
        return `${baseMessage} The system auto-submitted the attempt after repeated suspicious activity.`;
    }
    return `${baseMessage} Time expired, so the system submitted the quiz automatically.`;
}

function getLmsQuizEligibleStudents(resourceKey, options = {}) {
    const strictRoster = options?.strictRoster === true;
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const parsed = parseLmsCourseKey(resourceKey);
    let students = [];
    if (parsed.courseId && parsed.groupId) {
        students = getEnrolledStudentsForGroup(parsed.courseId, parsed.groupId);
    }
    if (!students.length) {
        const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
        const gradebookGroup = KIU_STATE.studentGrades[canonicalKey]
            || KIU_STATE.studentGrades[parsed.courseId]
            || KIU_STATE.studentGrades[resourceKey];
        if (gradebookGroup && gradebookGroup.length > 0) {
            return gradebookGroup.map(s => ({ id: String(s.id), name: s.name || ('Student ' + s.id) }));
        }
        const courseNorm = canonicalCourseKey(parsed.courseId);
        const groupNorm = parsed.groupId ? canonicalCourseKey(parsed.groupId) : null;
        for (const key of Object.keys(KIU_STATE.studentGrades || {})) {
            const roster = KIU_STATE.studentGrades[key];
            if (!Array.isArray(roster) || !roster.length) continue;
            const kp = parseLmsCourseKey(key);
            if (canonicalCourseKey(kp.courseId) === courseNorm) {
                if (!groupNorm || (kp.groupId && canonicalCourseKey(kp.groupId) === groupNorm)) {
                    return roster.map(s => ({ id: String(s.id), name: s.name || ('Student ' + s.id) }));
                }
            }
        }
        if (!strictRoster) {
            const allStudents = typeof getAllStudents === 'function' ? getAllStudents() : [];
            if (allStudents.length > 0) {
                return allStudents.slice(0, 30).map(s => ({ id: String(s.id), name: s.nameEn || s.name || ('Student ' + s.id) }));
            }
        }
    }
    return students;
}

function getLmsQuizAllowedStudentIds(resourceKey, quiz = {}) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const explicit = Array.isArray(quiz?.allowedStudentIds) ? quiz.allowedStudentIds.map(id => String(id)) : [];
    if (explicit.length > 0) return explicit;
    return getLmsQuizEligibleStudents(resourceKey).map(student => String(student.id));
}

function isStudentAllowedForLmsQuiz(resourceKey, quiz, studentId) {
    const targetId = String(studentId || '');
    if (!targetId) return false;
    return getLmsQuizAllowedStudentIds(resourceKey, quiz).includes(targetId);
}

function resolveLmsQuizStudentMeta(resourceKey, quiz = null) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const currentViewer = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const currentId = String((typeof getCurrentUserId === 'function' ? getCurrentUserId() : '') || '');
    const currentName = (typeof getUiDisplayName === 'function' ? getUiDisplayName() : '')
        || currentViewer?.nameEn
        || currentViewer?.name
        || (currentId ? `Student ${currentId}` : 'Student');
    const eligibleStudents = getLmsQuizEligibleStudents(resourceKey).map(student => ({
        id: String(student?.id || ''),
        name: student?.name || `Student ${student?.id || ''}`
    })).filter(student => student.id);
    const allowedIds = new Set((quiz
        ? getLmsQuizAllowedStudentIds(resourceKey, quiz)
        : eligibleStudents.map(student => student.id)).map(id => String(id)));

    const resolveCandidate = (candidateId, fallbackName = '') => {
        const normalizedId = String(candidateId || '');
        if (!normalizedId) return null;
        const rosterMatch = eligibleStudents.find(student => student.id === normalizedId);
        if (rosterMatch) {
            return {
                id: rosterMatch.id,
                name: rosterMatch.name || fallbackName || `Student ${rosterMatch.id}`
            };
        }
        if (allowedIds.size === 0 || allowedIds.has(normalizedId)) {
            return {
                id: normalizedId,
                name: fallbackName || currentName || `Student ${normalizedId}`
            };
        }
        return null;
    };

    const currentMatch = resolveCandidate(currentId, currentName);
    if (currentMatch) return currentMatch;

    if (typeof getEffectiveUserRole === 'function' && getEffectiveUserRole() === USER_ROLES.STUDENT) {
        const preferredImpersonatedStudent = typeof getPreferredImpersonationUserForRole === 'function'
            ? getPreferredImpersonationUserForRole(
                USER_ROLES.STUDENT,
                currentViewer?.facultyCode || currentViewer?.faculty || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '')
            )
            : null;
        const impersonatedMatch = resolveCandidate(
            preferredImpersonatedStudent?.id,
            preferredImpersonatedStudent?.nameEn || preferredImpersonatedStudent?.name || ''
        );
        if (impersonatedMatch) return impersonatedMatch;

        const fallbackStudent = eligibleStudents.find(student => allowedIds.size === 0 || allowedIds.has(student.id)) || eligibleStudents[0] || null;
        if (fallbackStudent) {
            return {
                id: fallbackStudent.id,
                name: fallbackStudent.name || `Student ${fallbackStudent.id}`
            };
        }
        if (currentId) {
            return {
                id: currentId,
                name: currentName || `Student ${currentId}`
            };
        }
    }

    const normalizedId = String(currentId || '').trim();
    return {
        id: normalizedId,
        name: currentName
    };
}

function syncLmsImpersonatedStudentSession(resourceKey, quiz = null) {
    if (typeof isAdminImpersonationMode !== 'function' || !isAdminImpersonationMode()) return null;
    const studentMeta = resolveLmsQuizStudentMeta(resourceKey, quiz);
    const targetId = String(studentMeta?.id || '');
    const activeId = String((typeof getCurrentUserId === 'function' ? getCurrentUserId() : '') || '');
    if (!targetId || !activeId || targetId === activeId || typeof setActiveSessionUser !== 'function') {
        return studentMeta;
    }
    const targetUser = (KIU_STATE?.users || []).find(user => String(user?.id || '') === targetId) || null;
    if (!targetUser) return studentMeta;
    try {
        currentUserRole = USER_ROLES.STUDENT;
        localStorage.setItem('currentUserRole', USER_ROLES.STUDENT);
        if (currentUser?.role && currentUser.role !== USER_ROLES.STUDENT) {
            sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
        }
    } catch (e) {
        console.warn('Could not persist LMS student impersonation session.', e);
    }
    setActiveSessionUser(targetUser.id);
    if ((targetUser.facultyCode || targetUser.faculty) && typeof localStorage !== 'undefined') {
        localStorage.setItem('currentFaculty', targetUser.facultyCode || targetUser.faculty);
    }
    if (typeof syncPortalBackendImpersonation === 'function') {
        syncPortalBackendImpersonation(USER_ROLES.STUDENT);
    }
    return {
        id: String(targetUser.id),
        name: targetUser.nameEn || targetUser.name || studentMeta.name
    };
}

function getLmsQuizSubmissionStats(resourceKey, quiz) {
    resourceKey = resolveCanonicalLmsResourceKey(resourceKey);
    const allowedIds = new Set(getLmsQuizAllowedStudentIds(resourceKey, quiz));
    const students = getLmsQuizEligibleStudents(resourceKey);
    const submissions = ensureLmsQuizSubmissionStore(resourceKey, quiz?.id);
    let allowedCount = 0;
    let startedCount = 0;
    let submittedCount = 0;
    let gradedCount = 0;
    let pendingReviewCount = 0;
    let alertCount = 0;
    let alertedStudents = 0;
    let latestAlert = null;
    let blueConnectedCount = 0;
    let blueDisconnectedCount = 0;
    students.forEach(student => {
        if (!allowedIds.has(String(student.id))) return;
        allowedCount += 1;
        const submission = submissions[String(student.id)] || null;
        const status = String(submission?.status || '');
        const submissionAlerts = getLmsQuizProctorAlertCount(submission);
        const latestSubmissionAlert = getLmsQuizLatestProctorEvent(submission);
        if (submissionAlerts > 0) {
            alertCount += submissionAlerts;
            alertedStudents += 1;
        }
        if (latestSubmissionAlert?.createdAt) {
            const latestTime = latestAlert?.createdAt ? new Date(latestAlert.createdAt).getTime() : 0;
            const submissionTime = new Date(latestSubmissionAlert.createdAt).getTime();
            if (!latestAlert || submissionTime >= latestTime) {
                latestAlert = latestSubmissionAlert;
            }
        }
        if (status === 'in-progress') startedCount += 1;
        if (status === 'submitted' || status === 'auto-submitted') {
            submittedCount += 1;
            pendingReviewCount += 1;
        }
        if (status === 'graded') {
            submittedCount += 1;
            gradedCount += 1;
        }
        if (isLmsQuizBlueExamRequired(quiz)) {
            if (submission?.blueConnected) blueConnectedCount += 1;
            if (submission?.blueDisconnectedAt) blueDisconnectedCount += 1;
        }
    });
    return {
        allowedCount,
        totalEligible: students.length,
        startedCount,
        submittedCount,
        gradedCount,
        pendingReviewCount,
        alertCount,
        alertedStudents,
        latestAlert,
        blueConnectedCount,
        blueDisconnectedCount
    };
}

function getLmsQuizSubmissionManualScoreTotal(submission, quiz = null) {
    if (!submission || typeof submission !== 'object') return 0;
    const perQuestion = submission.manualScoresByQuestion;
    if (perQuestion && typeof perQuestion === 'object' && Object.keys(perQuestion).length > 0 && Array.isArray(quiz?.questions)) {
        return (quiz.questions || []).reduce((sum, question) => {
            if (String(question?.type || 'mcq') !== 'written') return sum;
            const max = getLmsQuizQuestionManualMax(question);
            const raw = Number(perQuestion[question.id]);
            const bounded = Number.isFinite(raw) ? Math.max(0, Math.min(max, raw)) : 0;
            return sum + bounded;
        }, 0);
    }
    return Number(submission.manualScoreRaw || 0);
}

function getLmsQuizManualMax(quiz = {}) {
    return (quiz.questions || []).reduce((sum, question) => sum + getLmsQuizQuestionManualMax(question), 0);
}

function getLmsQuizObjectiveMax(quiz = {}, studentId = '', submission = null) {
    return getLmsQuizQuestionsForStudent(quiz, studentId, submission).reduce((sum, question) => sum + (String(question.type || 'mcq') === 'written' ? 0 : (parseFloat(question.score) || 0)), 0);
}

function calculateLmsQuizAutoScore(quiz, answers = {}, studentId = '', submission = null) {
    let autoScore = 0;
    let requiresManualReview = false;
    const questions = getLmsQuizQuestionsForStudent(quiz, studentId, submission);
    questions.forEach(question => {
        const answer = answers?.[question.id];
        if (String(question.type || 'mcq') === 'written') {
            requiresManualReview = true;
            return;
        }
        const selected = parseInt(answer?.selectedOption, 10);
        if (Number.isFinite(selected) && selected === parseInt(question.correctOption, 10)) {
            autoScore += parseFloat(question.score) || 0;
        }
    });
    return {
        autoScoreRaw: autoScore,
        manualMaxRaw: getLmsQuizManualMax({ ...quiz, questions }),
        requiresManualReview
    };
}

function buildLmsQuizSubmissionQuestionResults(quiz, answers = {}, studentId = '', submission = null, manualScoresByQuestion = {}, reviewMeta = {}) {
    const questions = getLmsQuizQuestionsForStudent(quiz, studentId, submission);
    const reviewed = reviewMeta.reviewed === true;
    return questions.map((question, index) => {
        const questionId = String(question.id || `q_${index + 1}`);
        const answer = answers?.[question.id] || answers?.[questionId] || {};
        const type = String(question.type || 'mcq');
        const maxScore = parseFloat(question.score) || 0;
        const manualMax = getLmsQuizQuestionManualMax(question);
        const textAnswer = String(answer.text || '').trim();
        const selectedRaw = answer.selectedOption;
        const selectedOption = selectedRaw === null || selectedRaw === undefined || selectedRaw === ''
            ? null
            : Number(selectedRaw);
        const hasSelection = Number.isFinite(selectedOption) && selectedOption >= 0;
        const correctOption = Number(question.correctOption);
        const isWritten = type === 'written';
        const manualRaw = manualScoresByQuestion?.[question.id] ?? manualScoresByQuestion?.[questionId];
        const manualScore = Number.isFinite(Number(manualRaw))
            ? Math.max(0, Math.min(manualMax, Number(manualRaw)))
            : 0;
        const isCorrect = isWritten
            ? null
            : (hasSelection && Number.isFinite(correctOption) && selectedOption === correctOption);
        const scoreAwarded = isWritten
            ? (reviewed ? manualScore : 0)
            : (isCorrect ? maxScore : 0);
        return {
            questionId,
            questionText: String(question.text || ''),
            type,
            optionLabels: Array.isArray(question.options) ? question.options.map(option => String(option || '')) : [],
            selectedOption: hasSelection ? selectedOption : null,
            selectedAnswer: hasSelection ? String((question.options || [])[selectedOption] || '') : '',
            writtenAnswer: textAnswer,
            answered: isWritten ? textAnswer.length > 0 : hasSelection,
            correctOption: isWritten || !Number.isFinite(correctOption) ? null : correctOption,
            isCorrect,
            maxScore,
            manualMax,
            manualScoreAwarded: isWritten ? manualScore : 0,
            scoreAwarded,
            needsManualReview: isWritten && !reviewed,
            reviewedAt: reviewed ? String(reviewMeta.reviewedAt || '') : '',
            reviewedBy: reviewed ? String(reviewMeta.reviewedBy || '') : ''
        };
    });
}

function buildLmsQuizSubmissionResponseSummary(questionResults = []) {
    const results = Array.isArray(questionResults) ? questionResults : [];
    const written = results.filter(item => item.type === 'written');
    const objective = results.filter(item => item.type !== 'written');
    const totalPoints = results.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
    const objectivePoints = objective.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
    const manualPoints = written.reduce((sum, item) => sum + Number(item.manualMax || item.maxScore || 0), 0);
    return {
        totalQuestions: results.length,
        answeredQuestions: results.filter(item => item.answered === true).length,
        objectiveQuestions: objective.length,
        writtenQuestions: written.length,
        totalPoints,
        objectivePoints,
        manualPoints,
        needsManualReview: written.some(item => item.needsManualReview === true)
    };
}

function finalizeLmsQuizSubmission(resourceKey, quiz, submission, studentId, studentName, mode = 'manual-submit') {
    if (!quiz || !submission) return null;
    syncLmsQuizSubmissionVariant(quiz, submission, studentId);
    const activeQuestions = getLmsQuizQuestionsForStudent(quiz, studentId, submission);
    const answers = {};
    activeQuestions.forEach(question => {
        const existingAnswer = submission.draftAnswers?.[question.id] || submission.answers?.[question.id] || {};
        const selectedRaw = existingAnswer.selectedOption;
        const selectedOption = selectedRaw === null || selectedRaw === undefined || selectedRaw === ''
            ? null
            : Number(selectedRaw);
        answers[question.id] = {
            selectedOption: Number.isFinite(selectedOption) ? selectedOption : null,
            text: String(existingAnswer.text || '').trim()
        };
    });
    const evaluation = calculateLmsQuizAutoScore(quiz, answers, studentId, submission);
    const actionTime = new Date().toISOString();
    submission.answers = answers;
    submission.questionResults = buildLmsQuizSubmissionQuestionResults(quiz, answers, studentId, submission);
    submission.responseSummary = buildLmsQuizSubmissionResponseSummary(submission.questionResults);
    submission.submittedAt = submission.submittedAt || actionTime;
    if (mode === 'auto-submit') {
        submission.autoSubmittedAt = actionTime;
    }
    submission.postSubmitLockUntil = new Date(new Date(actionTime).getTime() + LMS_POST_SUBMIT_LOCK_MS).toISOString();
    submission.autoScoreRaw = evaluation.autoScoreRaw;
    submission.requiresManualReview = evaluation.requiresManualReview;
    submission.history = Array.isArray(submission.history) ? submission.history : [];
    submission.history.push({
        action: mode === 'auto-submit' ? 'auto-submitted' : 'submitted',
        updatedAt: actionTime,
        updatedBy: studentName || `Student ${studentId}`
    });

    if (evaluation.requiresManualReview) {
        submission.status = mode === 'auto-submit' ? 'auto-submitted' : 'submitted';
        submission.manualScoresByQuestion = {};
        submission.manualScoreRaw = 0;
        submission.finalScoreRaw = null;
        submission.gradebookScore = null;
        submission.history.push({
            action: 'submitted-pending-review',
            updatedAt: actionTime,
            updatedBy: 'Auto grading',
            note: `Objective score ${evaluation.autoScoreRaw} recorded. Final grade is pending TA / professor review.`,
            autoScoreRaw: evaluation.autoScoreRaw,
            variantLabel: submission.variantLabel || ''
        });
    } else {
        submission.status = 'graded';
        submission.manualScoresByQuestion = {};
        submission.manualScoreRaw = 0;
        submission.finalScoreRaw = evaluation.autoScoreRaw;
        submission.gradedAt = actionTime;
        submission.reviewedAt = actionTime;
        submission.gradedBy = 'Auto grading';
        submission.reviewedBy = 'Auto grading';
        submission.gradebookScore = applyQuizScoreToGradebook(resourceKey, quiz, studentId, submission.finalScoreRaw, 'Auto grading', 'Objective quiz');
        submission.history.push({
            action: 'auto-graded',
            updatedAt: actionTime,
            updatedBy: 'Auto grading',
            variantLabel: submission.variantLabel || ''
        });
    }
    syncProtectedQuizAttemptToBackend(resourceKey, quiz, submission, {
        note: mode === 'auto-submit' ? 'Quiz attempt auto-submitted.' : 'Quiz attempt submitted.',
        submitReason: submission.proctorAutoSubmitReason || (mode === 'auto-submit' ? 'Auto-submitted by quiz protection.' : '')
    }).catch(() => null);
    return submission;
}

function autoSubmitExpiredLmsQuizAttempt(resourceKey, quiz, student) {
    if (!quiz || !student?.id) return false;
    const submission = getLmsQuizSubmission(resourceKey, quiz.id, student.id);
    if (!submission || submission.status !== 'in-progress') return false;
    const effectiveEnd = getLmsQuizEffectiveEndAt(quiz, submission);
    if (!effectiveEnd || effectiveEnd.getTime() > Date.now()) return false;
    finalizeLmsQuizSubmission(resourceKey, quiz, submission, student.id, student.name || `Student ${student.id}`, 'auto-submit');
    return true;
}

function getLmsQuizEffectiveEndAt(quiz, submission = null) {
    const absoluteEnd = quiz?.availableUntil ? new Date(quiz.availableUntil) : null;
    const sessionEnd = submission?.sessionEndsAt ? new Date(submission.sessionEndsAt) : null;
    const relativeEnd = submission?.startedAt && quiz?.durationMinutes
        ? new Date(new Date(submission.startedAt).getTime() + (Math.max(1, parseInt(quiz.durationMinutes, 10) || 20) * 60000))
        : null;
    const candidates = [absoluteEnd, sessionEnd, relativeEnd].filter(value => value instanceof Date && !Number.isNaN(value.getTime()));
    if (!candidates.length) return null;
    return candidates.reduce((earliest, current) => current.getTime() < earliest.getTime() ? current : earliest);
}

function getLmsQuizPostSubmitLockUntil(submission = null) {
    if (!submission || !['submitted', 'auto-submitted', 'graded'].includes(String(submission.status || ''))) return null;
    const explicitLock = submission.postSubmitLockUntil ? new Date(submission.postSubmitLockUntil) : null;
    if (explicitLock instanceof Date && !Number.isNaN(explicitLock.getTime())) {
        return explicitLock;
    }
    const submittedAt = submission.autoSubmittedAt || submission.submittedAt || submission.gradedAt || '';
    const submittedTime = submittedAt ? new Date(submittedAt) : null;
    if (!(submittedTime instanceof Date) || Number.isNaN(submittedTime.getTime())) return null;
    return new Date(submittedTime.getTime() + LMS_POST_SUBMIT_LOCK_MS);
}

function isLmsQuizPostSubmitLocked(submission = null, now = new Date()) {
    const lockUntil = getLmsQuizPostSubmitLockUntil(submission);
    if (!lockUntil) return false;
    return now.getTime() < lockUntil.getTime();
}

function getLmsQuizPostSubmitLockMessage(submission = null, now = new Date()) {
    const lockUntil = getLmsQuizPostSubmitLockUntil(submission);
    if (!lockUntil || now.getTime() >= lockUntil.getTime()) return '';
    return `Quiz access is locked for ${formatCountdownDuration(lockUntil.getTime() - now.getTime())} after submission.`;
}

function getLmsQuizAvailabilityState(quiz, submission = null, now = new Date()) {
    const start = quiz?.availableFrom ? new Date(quiz.availableFrom) : null;
    const effectiveEnd = getLmsQuizEffectiveEndAt(quiz, submission);
    if (getLmsQuizLifecycleStatus(quiz) === 'draft' || !quiz?.isPublished) return 'draft';
    if (submission?.status === 'graded') return 'graded';
    if (submission?.status === 'submitted' || submission?.status === 'auto-submitted') return 'submitted';
    if (getLmsQuizLifecycleStatus(quiz) === 'closed') return 'closed';
    if (effectiveEnd && now.getTime() > effectiveEnd.getTime()) return 'closed';
    if (start && now.getTime() < start.getTime()) return 'upcoming';
    if (submission?.status === 'in-progress') return 'in-progress';
    return 'open';
}

function formatCountdownDuration(ms) {
    const safe = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateLmsExamSessionSummary(sessionId) {
    const session = getExamSessionById(sessionId);
    if (!session) return null;
    const quiz = getLmsQuizById(session.resourceKey, session.quizId);
    const summary = getLmsExamSessionMonitorStats(session, session.resourceKey, quiz);
    session.monitoringSummary = {
        allowedCount: summary.allowedCount,
        presentCount: summary.presentCount,
        blockedCount: summary.blockedCount,
        inProgressCount: summary.inProgressCount,
        submittedCount: summary.submittedCount,
        alertCount: summary.alertCount
    };
    session.updatedAt = new Date().toISOString();
    return session;
}

function createLmsExamSessionFromTemplate(templateQuizId, targetGroupId, faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty, 'ECON');
    const facultyState = ensureAdminExamState(normalizedFaculty);
    const templateQuiz = facultyState.quizzes.find(item => String(item.id) === String(templateQuizId));
    if (!templateQuiz) {
        alert('Choose a saved exam template first.');
        return null;
    }
    const targetGroup = getAdminQuizGroupsForSubject(templateQuiz.subjectId, normalizedFaculty)
        .find(group => canonicalCourseKey(group.id) === canonicalCourseKey(targetGroupId));
    if (!targetGroup) {
        alert('Choose a valid target group for this exam session.');
        return null;
    }
    const resourceKey = resolveCanonicalLmsResourceKey(`${templateQuiz.subjectId}::${targetGroup.id}`);
    const roster = getLmsQuizEligibleStudents(resourceKey);
    if (!roster.length) {
        alert('No enrolled students were found for this group yet.');
        return null;
    }
    const sessionId = makeAdminExamEntityId('exam-session');
    const publishedAt = new Date().toISOString();
    const quizPayload = normalizeLmsQuizStoredRecord({
        ...JSON.parse(JSON.stringify(templateQuiz)),
        id: makeAdminExamEntityId('quiz'),
        examSessionId: sessionId,
        assignedGroupId: targetGroup.id,
        assignedGroupName: targetGroup.name || targetGroup.id,
        availableFrom: '',
        availableUntil: '',
        status: 'published',
        isPublished: true,
        publishMode: 'manual',
        publishedAt,
        publishedBy: getSimulatedUserName(),
        updatedAt: publishedAt,
        createdAt: publishedAt,
        requiresBlueExamNetwork: false,
        attendanceGateEnabled: false,
        allowedStudentIds: roster.map(student => String(student.id)),
        attendanceMode: 'manual-access-list',
        attendanceRequired: true,
        lockedAfterPublish: true
    });
    saveLmsQuizWorkspaceRecord(resourceKey, quizPayload);
    syncLmsQuizRoster(resourceKey, quizPayload);
    const sessions = ensureExamSessionStore();
    sessions[sessionId] = normalizeExamSessionRecord({
        id: sessionId,
        title: `${templateQuiz.title || 'Lab Exam'}  -  ${targetGroup.name || targetGroup.id}`,
        templateQuizId: templateQuiz.id,
        quizId: quizPayload.id,
        quizTitle: templateQuiz.title || getLmsQuizDisplayLabel(templateQuiz),
        resourceKey,
        courseId: templateQuiz.subjectId,
        groupId: targetGroup.id,
        faculty: normalizedFaculty,
        status: 'waiting',
        allowedStudentIds: quizPayload.allowedStudentIds,
        blockedStudentIds: [],
        attendanceByStudentId: {},
        durationMinutes: quizPayload.durationMinutes || templateQuiz.durationMinutes || 20,
        createdAt: publishedAt,
        updatedAt: publishedAt
    });
    updateLmsExamSessionSummary(sessionId);
    saveState();
    return sessions[sessionId];
}

function startLmsExamSession(sessionId) {
    const session = getExamSessionById(sessionId);
    if (!session) return;
    const quiz = getLmsQuizById(session.resourceKey, session.quizId);
    if (!quiz) {
        alert('The linked exam quiz could not be found.');
        return;
    }
    const now = new Date();
    session.status = 'live';
    session.startedAt = now.toISOString();
    session.endsAt = new Date(now.getTime() + (Math.max(1, Number(session.durationMinutes || quiz.durationMinutes || 20)) * 60000)).toISOString();
    session.updatedAt = session.startedAt;
    quiz.availableFrom = session.startedAt;
    quiz.availableUntil = session.endsAt;
    quiz.status = 'published';
    quiz.isPublished = true;
    quiz.updatedAt = session.startedAt;
    saveLmsQuizWorkspaceRecord(session.resourceKey, quiz);
    const roster = getLmsQuizEligibleStudents(session.resourceKey).filter(student => (session.allowedStudentIds || []).includes(String(student.id)));
    roster.forEach(student => {
        const submission = ensureLmsQuizSubmissionShell(session.resourceKey, session.quizId, student);
        syncLmsQuizExamSessionSubmissionState(session.resourceKey, quiz, submission, student);
    });
    updateLmsExamSessionSummary(sessionId);
    saveState();
}

function closeLmsExamSession(sessionId, reason = 'Exam session closed by staff') {
    const session = getExamSessionById(sessionId);
    if (!session) return;
    const quiz = getLmsQuizById(session.resourceKey, session.quizId);
    const actionTime = new Date().toISOString();
    session.status = 'closed';
    session.endsAt = session.endsAt || actionTime;
    session.updatedAt = actionTime;
    if (quiz) {
        quiz.availableUntil = actionTime;
        quiz.status = 'closed';
        quiz.isPublished = true;
        quiz.updatedAt = actionTime;
        const submissions = ensureLmsQuizSubmissionStore(session.resourceKey, quiz.id);
        Object.values(submissions).forEach(submission => {
            if (String(submission?.status || '') !== 'in-progress') return;
            finalizeLmsQuizSubmission(session.resourceKey, quiz, submission, submission.studentId, submission.studentName || `Student ${submission.studentId}`, 'auto-submit');
            submission.history = Array.isArray(submission.history) ? submission.history : [];
            submission.history.push({
                action: 'exam-session-closed',
                updatedAt: actionTime,
                updatedBy: getSimulatedUserName(),
                note: reason
            });
        });
        saveLmsQuizWorkspaceRecord(session.resourceKey, quiz);
    }
    updateLmsExamSessionSummary(sessionId);
    saveState();
}

function syncLmsQuizWorkspaceLifecycle(resourceKey) {
    if (!resourceKey) return;
    // Ensure quiz state arrays exist for this resource key
    ensureLmsQuizzesForKey(resourceKey);
    // Sync any active exam sessions for quizzes under this key
    ensureLmsQuizzesForKey(resourceKey).forEach(quiz => {
        try { syncLmsExamSessionLifecycle(quiz); } catch (e) { console.warn('Quiz lifecycle sync skipped:', e); }
    });
}

function syncLmsExamSessionLifecycle(quiz) {
    const session = getLmsQuizExamSession(quiz);
    if (!session) return null;
    if (normalizeExamSessionStatus(session.status || 'draft') === 'live' && session.endsAt) {
        const endsAt = new Date(session.endsAt).getTime();
        if (Number.isFinite(endsAt) && Date.now() >= endsAt) {
            closeLmsExamSession(session.id, 'Exam session time expired');
            return getExamSessionById(session.id);
        }
    }
    return session;
}

bindLmsDelegatedMarkupActions();

window.isLmsStudentViewer = isLmsStudentViewer;
window.getLmsStudentSelectedSemester = getLmsStudentSelectedSemester;
window.setLmsStudentSelectedSemester = setLmsStudentSelectedSemester;
window.getStudentLmsEnrolledSubjects = getStudentLmsEnrolledSubjects;
window.getStudentLmsSemesterOptions = getStudentLmsSemesterOptions;
window.openLmsStudentEnrolledSubject = openLmsStudentEnrolledSubject;
window.resolveScheduleEntrySemester = resolveScheduleEntrySemester;
window.syncLmsNextSessionContext = syncLmsNextSessionContext;
window.syncLmsCourseContext = syncLmsCourseContext;


