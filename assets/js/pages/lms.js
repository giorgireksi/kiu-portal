/* FINDABILITY: LMS course shell — see docs/findability-index.md#lms-hub */
/* LMS page logic extracted from the legacy core.js bundle. Active routes now load split files directly. */
// --- LMS LOGIC ---
let currentCourseId = '';
let currentLmsSectionType = '';
let lmsBulkGroupContext = { subjectId: '', subjectTitle: '', groups: [] };
const LMS_SECTION_TYPES = ['lecture', 'workshop'];
const LMS_SECTION_SUFFIX_PREFIX = '__lmssec_';
const LMS_POST_SUBMIT_LOCK_MS = 20 * 60 * 1000;
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
    const rawEntries = (() => {
        if (Array.isArray(scheduleValue)) return scheduleValue.filter(Boolean);
        if (scheduleValue && typeof scheduleValue === 'object') {
            if (Array.isArray(scheduleValue.entries)) return scheduleValue.entries.filter(Boolean);
            return Object.entries(scheduleValue)
                .filter(([, groupId]) => groupId != null && groupId !== '')
                .map(([courseId, groupId]) => ({ courseId, groupId }));
        }
        return [];
    })();
    if (typeof window.flattenStudentScheduleEntry !== 'function') return rawEntries;
    return rawEntries
        .map((entry) => window.flattenStudentScheduleEntry(entry))
        .filter(Boolean);
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
    const labelFor = typeof window.formatStudyCardLabel === 'function'
        ? window.formatStudyCardLabel
        : (value, fallback = '') => {
            const text = String(value ?? '').trim();
            return text || fallback;
        };
    entries.forEach((entry) => {
        const refs = typeof window.resolveStudentScheduleEntryRefs === 'function'
            ? window.resolveStudentScheduleEntryRefs(entry)
            : null;
        const courseId = labelFor(refs?.courseId || entry?.courseId || entry?.sourceCourseId, '');
        if (!courseId || courseId === '0') return;
        const dedupeKey = canonicalCourseKey(courseId);
        if (!dedupeKey || seen.has(dedupeKey)) return;
        seen.add(dedupeKey);
        const curriculum = findCurriculumSubjectByIdOrTitle(courseId, refs?.courseName || entry?.courseName || '', faculty);
        const groupId = labelFor(refs?.groupId || entry?.groupId, '');
        const groupName = labelFor(refs?.groupName || entry?.groupName, '');
        const semesterValue = resolveScheduleEntrySemester(entry, faculty);
        const title = labelFor(
            refs?.courseName || entry?.courseName || curriculum?.name || curriculum?.title,
            courseId
        );
        subjects.push({
            id: curriculum?.id || courseId,
            courseId,
            name: title,
            title,
            groupId,
            groupName,
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
function canPostLmsInteractionAnnouncement() {
    return canManageLmsGroupContent();
}
function isLmsInteractionMessageFromStaff(message) {
    return Boolean(message?.isProf || message?.isStaff);
}
function canReplyToLmsInteractionPost(message) {
    return Boolean(message && message.id);
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
        const isPrimaryButton = classes.includes('lux-primary-btn');
        const isSecondaryButton = classes.includes('lux-secondary-btn') || classes.includes('portal-msg-mini-badge');
        const isInputField = ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag) && !['checkbox', 'radio'].includes(type);
        const isBadge = tag === 'SPAN' && /border-radius\s*:\s*999px/i.test(style);
        const isHero = /linear-gradient\(135deg,\s*(rgba\(15,\s*23,\s*42|var\(--kiu-navy\))/i.test(style);
        if (tag === 'INPUT' && !['checkbox', 'radio'].includes(type)) {
            node.classList.add('lms-route-input', 'lux-control');
        } else if (tag === 'TEXTAREA') {
            node.classList.add('lms-route-textarea', 'lux-control');
        } else if (tag === 'SELECT') {
            node.classList.add('lms-route-select', 'lux-control');
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
    if (typeof document !== 'undefined' && document.body?.classList?.contains('lux-page-bare')) {
        return String(markup || '');
    }
    const themeMode = getLmsRouteThemeMode();
    const isLight = themeMode === 'light';
    const blurChain = 'backdrop-filter:var(--lms-fade-blur);-webkit-backdrop-filter:var(--lms-fade-blur)';
    const surface = `var(--lms-fade-surface); ${blurChain}`;
    const surfaceSoft = `var(--lms-fade-surface-soft); ${blurChain}`;
    const surfaceMuted = `var(--lms-fade-surface-soft); ${blurChain}`;
    const surfaceTertiary = `var(--lms-fade-surface-soft); ${blurChain}`;
    const border = 'var(--lms-fade-border-soft)';
    const text = 'var(--lux-text)';
    const muted = 'var(--lux-text-muted)';
    const accentGradient = isLight
        ? `linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(0.18 + var(--lux-card-glow-alpha, 0.06))), rgba(255,248,239, calc(0.18 + var(--lux-glass-alpha, 0.06)))); ${blurChain}`
        : `linear-gradient(135deg, rgba(var(--lux-accent-rgb), calc(0.18 + var(--lux-card-glow-alpha, 0.06))), rgba(var(--lux-accent-2-rgb), calc(0.12 + var(--lux-glass-alpha, 0.26)))); ${blurChain}`;
    const heroSurface = `var(--lms-fade-surface); ${blurChain}`;
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
const renderLmsGlassDialogHead = window.renderLmsGlassDialogHead;
const renderLmsGlassDialogCard = window.renderLmsGlassDialogCard;
const toDomToken = window.toDomToken;
const normalizeLmsSectionType = window.normalizeLmsSectionType;
const getDefaultLmsSectionTypeForRole = window.getDefaultLmsSectionTypeForRole;
const getCurrentLmsSectionType = window.getCurrentLmsSectionType;
const getLmsSectionMeta = window.getLmsSectionMeta;
const getLmsSectionSuffix = window.getLmsSectionSuffix;
const stripLmsSectionSuffix = window.stripLmsSectionSuffix;
const parseLmsCourseKey = window.parseLmsCourseKey;
const isLmsPersonalBoardKey = window.isLmsPersonalBoardKey;
const getLmsPersonalBoardOwnerId = window.getLmsPersonalBoardOwnerId;
const isLmsPersonalBoardOwner = window.isLmsPersonalBoardOwner;
const buildLmsPersonalBoardKey = window.buildLmsPersonalBoardKey;
const getLmsPersonalDashboardCourseId = window.getLmsPersonalDashboardCourseId;
const resolveCanonicalLmsResourceKey = window.resolveCanonicalLmsResourceKey;
const joinLmsMeta = window.joinLmsMeta;
const getLmsSectionResourceKey = window.getLmsSectionResourceKey;
const isLmsSectionScopedTab = window.isLmsSectionScopedTab;
const getLmsQuizGroupResourceKey = window.getLmsQuizGroupResourceKey;
const getLmsSubjectIdFromResourceKey = window.getLmsSubjectIdFromResourceKey;
const getLmsTabCourseKey = window.getLmsTabCourseKey;
const syncLmsSectionSwitchPresentation = window.syncLmsSectionSwitchPresentation;
const setLmsActiveSection = window.setLmsActiveSection;
const renderLmsRouteEmptyState = window.renderLmsRouteEmptyState;
const renderLmsWeekPanelEmptyState = window.renderLmsWeekPanelEmptyState;
const renderLmsRouteStats = window.renderLmsRouteStats;
const renderLmsRouteKv = window.renderLmsRouteKv;
const renderLmsRouteWeekAccordion = window.renderLmsRouteWeekAccordion;
const ensureLmsGradebookShell = window.ensureLmsGradebookShell;
const normalizeLmsDraftStorageKey = window.normalizeLmsDraftStorageKey;
const resolveActiveLmsQuizContext = window.resolveActiveLmsQuizContext;
const ensureLmsStores = window.ensureLmsStores;
const normalizeLmsQuizStoredRecord = window.normalizeLmsQuizStoredRecord;
const normalizeLmsQuizQuestion = window.normalizeLmsQuizQuestion;
const normalizeLmsQuizQuestionList = window.normalizeLmsQuizQuestionList;
const cloneLmsQuizQuestionForVariant = window.cloneLmsQuizQuestionForVariant;
const getDefaultLmsQuizVariantLabel = window.getDefaultLmsQuizVariantLabel;
const normalizeLmsQuizVariantRecord = window.normalizeLmsQuizVariantRecord;
const normalizeLmsQuizVariantList = window.normalizeLmsQuizVariantList;
const normalizeLmsQuizStudentVariantMap = window.normalizeLmsQuizStudentVariantMap;
const shuffleLmsQuizItems = window.shuffleLmsQuizItems;
const calculateLmsQuizVariantQuestionMix = window.calculateLmsQuizVariantQuestionMix;
const pickLmsQuizVariantQuestionsFromPool = window.pickLmsQuizVariantQuestionsFromPool;
const buildLmsQuizVariantQuestionSet = window.buildLmsQuizVariantQuestionSet;
const reconcileLmsQuizStudentVariantMap = window.reconcileLmsQuizStudentVariantMap;
const getLmsQuizVariantById = window.getLmsQuizVariantById;
const getLmsQuizAssignedVariant = window.getLmsQuizAssignedVariant;
const getLmsQuizQuestionsForStudent = window.getLmsQuizQuestionsForStudent;
const getLmsQuizQuestionCount = window.getLmsQuizQuestionCount;
const getLmsQuizVariantSummary = window.getLmsQuizVariantSummary;
const getLmsQuizVariantAssignmentSummary = window.getLmsQuizVariantAssignmentSummary;
const getLmsQuizWorkspaceBucketName = window.getLmsQuizWorkspaceBucketName;
const extractLmsQuizContentRecord = window.extractLmsQuizContentRecord;
const snapshotLmsQuizContentForDeployment = window.snapshotLmsQuizContentForDeployment;
const extractLmsQuizDeploymentRecord = window.extractLmsQuizDeploymentRecord;
const mergeLmsQuizWithDeployment = window.mergeLmsQuizWithDeployment;
const ensureLmsSubjectQuizBank = window.ensureLmsSubjectQuizBank;
const getLmsSubjectQuizDrafts = window.getLmsSubjectQuizDrafts;
const getLmsSubjectQuizById = window.getLmsSubjectQuizById;
const saveLmsSubjectQuizRecord = window.saveLmsSubjectQuizRecord;
const removeLmsSubjectQuizRecord = window.removeLmsSubjectQuizRecord;
const isLmsSubjectQuizPublishedAnywhere = window.isLmsSubjectQuizPublishedAnywhere;
function ensureLmsQuizBuilderWorkspace(resourceKey) {
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    ensureLmsStores();
    KIU_STATE.lmsQuizBuilder[resourceKey] = KIU_STATE.lmsQuizBuilder[resourceKey] || {};
    const workspace = KIU_STATE.lmsQuizBuilder[resourceKey];
    workspace.deployments = workspace.deployments && typeof workspace.deployments === 'object' ? workspace.deployments : {};
    workspace.drafts = Array.isArray(workspace.drafts) ? workspace.drafts.map(normalizeLmsQuizStoredRecord) : [];
    workspace.published = Array.isArray(workspace.published) ? workspace.published.map(normalizeLmsQuizStoredRecord) : [];
    workspace.closed = Array.isArray(workspace.closed) ? workspace.closed.map(normalizeLmsQuizStoredRecord) : [];
    workspace.submissions = workspace.submissions && typeof workspace.submissions === 'object' ? workspace.submissions : {};
    workspace.ui = workspace.ui && typeof workspace.ui === 'object' ? workspace.ui : {};
    return workspace;
}
function getLmsQuizGroupDeployment(resourceKey, quizId) {
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    return workspace.deployments[String(quizId)] || null;
}
function saveLmsQuizGroupDeployment(resourceKey, deployment = {}) {
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    const normalized = extractLmsQuizDeploymentRecord(deployment, resourceKey);
    workspace.deployments[String(normalized.quizId)] = normalized;
    return normalized;
}
function removeLmsQuizGroupDeployment(resourceKey, quizId) {
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    if (workspace.deployments && workspace.deployments[quizId]) {
        delete workspace.deployments[quizId];
    }
}
function getLmsQuizGroupBucketCounts(resourceKey) {
    const records = getAllLmsQuizWorkspaceRecords(resourceKey);
    return {
        drafts: records.filter(quiz => String(quiz.status || 'draft') === 'draft'),
        published: records.filter(quiz => String(quiz.status || '') === 'published'),
        closed: records.filter(quiz => String(quiz.status || '') === 'closed')
    };
}
function hoistLegacyLmsQuizGroupBuckets() {
    if (!KIU_STATE.lmsQuizBuilder || typeof KIU_STATE.lmsQuizBuilder !== 'object') return;
    const builder = KIU_STATE.lmsQuizBuilder;
    Object.keys(builder).forEach(resourceKey => {
        const groupKey = getLmsQuizGroupResourceKey(resourceKey);
        if (resourceKey !== groupKey) return;
        const parsed = parseLmsCourseKey(groupKey);
        if (!parsed.courseId || !parsed.groupId) return;
        const workspace = builder[groupKey];
        if (!workspace || typeof workspace !== 'object') return;
        const subjectId = parsed.courseId;
        const bucketStatus = { drafts: 'draft', published: 'published', closed: 'closed' };
        ['drafts', 'published', 'closed'].forEach(bucket => {
            const items = Array.isArray(workspace[bucket]) ? workspace[bucket] : [];
            if (!items.length) return;
            items.forEach(quiz => {
                saveLmsSubjectQuizRecord(subjectId, {
                    ...quiz,
                    subjectId,
                    groupId: quiz.groupId || quiz.assignedGroupId || parsed.groupId,
                    groupName: quiz.groupName || quiz.assignedGroupName || parsed.groupId
                }, { preserveIfNewer: true });
                saveLmsQuizGroupDeployment(groupKey, {
                    ...quiz,
                    status: bucketStatus[bucket] || quiz.status || 'draft'
                });
            });
            workspace[bucket] = [];
        });
    });
}
function migrateLmsQuizSectionWorkspaces() {
    hoistLegacyLmsQuizGroupBuckets();
    if (KIU_STATE.meta?.lmsSubjectQuizMigrated) return;
    if (!KIU_STATE.lmsQuizBuilder || typeof KIU_STATE.lmsQuizBuilder !== 'object') KIU_STATE.lmsQuizBuilder = {};
    if (!KIU_STATE.lmsSubjectQuizBank || typeof KIU_STATE.lmsSubjectQuizBank !== 'object') KIU_STATE.lmsSubjectQuizBank = {};
    KIU_STATE._lmsQuizMigrationRunning = true;
    try {
        const builder = KIU_STATE.lmsQuizBuilder || {};
        const keysToProcess = [...Object.keys(builder)];
        keysToProcess.forEach(resourceKey => {
            const workspace = builder[resourceKey];
            if (!workspace || typeof workspace !== 'object') return;
            const parsed = parseLmsCourseKey(resourceKey);
            if (!parsed.courseId) return;
            const subjectId = parsed.courseId;
            const groupKey = getLmsQuizGroupResourceKey(resourceKey);
            const bucketStatus = { drafts: 'draft', published: 'published', closed: 'closed' };
            ['drafts', 'published', 'closed'].forEach(bucket => {
                (workspace[bucket] || []).forEach(quiz => {
                    saveLmsSubjectQuizRecord(subjectId, { ...quiz, subjectId }, { preserveIfNewer: true });
                    saveLmsQuizGroupDeployment(groupKey, {
                        ...quiz,
                        status: bucketStatus[bucket] || quiz.status || 'draft'
                    });
                });
                workspace[bucket] = [];
            });
            if (resourceKey !== groupKey && workspace.submissions && typeof workspace.submissions === 'object') {
                const groupWorkspace = ensureLmsQuizBuilderWorkspace(groupKey);
                Object.entries(workspace.submissions).forEach(([quizId, submissionMap]) => {
                    groupWorkspace.submissions[quizId] = {
                        ...(groupWorkspace.submissions[quizId] || {}),
                        ...(submissionMap || {})
                    };
                });
                delete workspace.submissions;
            }
            if (resourceKey !== groupKey && parsed.sectionType) {
                delete builder[resourceKey];
            }
        });
        KIU_STATE.meta = KIU_STATE.meta && typeof KIU_STATE.meta === 'object' ? KIU_STATE.meta : {};
        KIU_STATE.meta.lmsSubjectQuizMigrated = true;
    } finally {
        delete KIU_STATE._lmsQuizMigrationRunning;
    }
}
function getAllLmsQuizWorkspaceRecords(resourceKey) {
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    const subjectId = getLmsSubjectIdFromResourceKey(resourceKey);
    if (!subjectId) {
        const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
        return [...workspace.drafts, ...workspace.published, ...workspace.closed];
    }
    return getLmsSubjectQuizDrafts(subjectId).map(content =>
        mergeLmsQuizWithDeployment(content, getLmsQuizGroupDeployment(resourceKey, content.id), resourceKey)
    );
}
function saveLmsQuizWorkspaceRecord(resourceKey, quiz) {
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    const subjectId = getLmsSubjectIdFromResourceKey(resourceKey) || quiz.subjectId;
    if (!subjectId) {
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
    const content = saveLmsSubjectQuizRecord(subjectId, { ...quiz, subjectId });
    const deployment = saveLmsQuizGroupDeployment(resourceKey, quiz);
    return mergeLmsQuizWithDeployment(content, deployment, resourceKey);
}
function removeLmsQuizWorkspaceRecord(resourceKey, quizId) {
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    const subjectId = getLmsSubjectIdFromResourceKey(resourceKey);
    removeLmsQuizGroupDeployment(resourceKey, quizId);
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    ['drafts', 'published', 'closed'].forEach(bucket => {
        workspace[bucket] = workspace[bucket].filter(item => String(item.id) !== String(quizId));
    });
    if (workspace.submissions && workspace.submissions[quizId]) {
        delete workspace.submissions[quizId];
    }
    if (subjectId && !isLmsSubjectQuizPublishedAnywhere(subjectId, quizId)) {
        const hasOtherDeployments = Object.keys(KIU_STATE.lmsQuizBuilder || {}).some(key => {
            const parsed = parseLmsCourseKey(key);
            if (canonicalCourseKey(parsed.courseId) !== canonicalCourseKey(subjectId)) return false;
            return Boolean(KIU_STATE.lmsQuizBuilder[key]?.deployments?.[String(quizId)]);
        });
        if (!hasOtherDeployments) {
            removeLmsSubjectQuizRecord(subjectId, quizId);
        }
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
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    return getAllLmsQuizWorkspaceRecords(resourceKey);
}
function ensureLmsQuizSubmissionStore(resourceKey, quizId) {
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    const workspace = ensureLmsQuizBuilderWorkspace(resourceKey);
    workspace.submissions[quizId] = workspace.submissions[quizId] || {};
    return workspace.submissions[quizId];
}
function getLmsQuizById(resourceKey, quizId) {
    resourceKey = getLmsQuizGroupResourceKey(resourceKey);
    const subjectId = getLmsSubjectIdFromResourceKey(resourceKey);
    if (subjectId) {
        const content = getLmsSubjectQuizById(subjectId, quizId);
        if (content) {
            return mergeLmsQuizWithDeployment(content, getLmsQuizGroupDeployment(resourceKey, quizId), resourceKey);
        }
    }
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
    const subjectId = getLmsSubjectIdFromResourceKey(resourceKey);
    const sourceQuizzes = subjectId ? getLmsSubjectQuizDrafts(subjectId) : ensureLmsQuizzesForKey(resourceKey);
    const existing = sourceQuizzes
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
/* Kiu Blue exam helper/gate/heartbeat: lms-quiz-blue-runtime.js */

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
bindLmsDelegatedMarkupActions();
