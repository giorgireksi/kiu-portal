/* Faculty-scoped shared data and helpers extracted from the legacy core.js bundle. Active routes now load split files directly. */
// FACULTY HELPERS
// Schedule and faculty helpers
function getCurrentFaculty() {
    const currentUser = (typeof getCurrentUserFromState === 'function')
        ? getCurrentUserFromState(typeof KIU_STATE !== 'undefined' ? KIU_STATE : null)
        : (typeof getCurrentUser === 'function' ? getCurrentUser() : null);
    const selectedFaculty = (() => {
        try {
            return localStorage.getItem('currentFaculty');
        } catch (error) {
            return '';
        }
    })();
    const role = currentUser?.role || (typeof currentUserRole !== 'undefined' ? currentUserRole : '') || USER_ROLES.STUDENT;
    // Admin can actively switch faculty context from the header dropdown.
    // For other roles, keep the user's own faculty as primary.
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
}
function getFacultyProfile(code) {
    const fp = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles;
    return fp[code] || fp['ECON'];
}
function getFacultyColor(code) {
    const normalized = normalizeFacultyCode(code, 'ECON');
    const palette = { CS: '#5b21b6', ECON: '#a4262c', LAW: '#107c41', MED: '#065f46', ARTS: '#b45309' };
    return palette[normalized] || palette.ECON;
}
function kiuResolveColorTriplet(color, fallback = '164,38,44') {
    const fallbackMatch = String(fallback).match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    const fallbackValue = fallbackMatch ? `${fallbackMatch[1]},${fallbackMatch[2]},${fallbackMatch[3]}` : '164,38,44';
    if (!color || typeof document === 'undefined' || typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
        return fallbackValue;
    }
    const probe = document.createElement('span');
    probe.style.color = String(color).trim();
    probe.style.position = 'absolute';
    probe.hidden = true;
    (document.body || document.documentElement).appendChild(probe);
    const resolved = window.getComputedStyle(probe).color || '';
    probe.remove();
    const match = resolved.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
    return match ? `${match[1]},${match[2]},${match[3]}` : fallbackValue;
}
function getFacultyThemeTone(code, options = {}) {
    const fallbackFaculty = normalizeFacultyCode(options.fallback || 'ECON', 'ECON');
    const normalized = normalizeFacultyCode(code, fallbackFaculty);
    const profile = getFacultyProfile(normalized) || {};
    const currentFaculty = (() => {
        try {
            return normalizeFacultyCode(localStorage.getItem('currentFaculty') || normalized, normalized);
        } catch (e) {
            return normalized;
        }
    })();
    const rootStyles = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
        ? window.getComputedStyle(document.documentElement)
        : null;
    const useCurrentPalette = options.useCurrentPalette !== false && normalized === currentFaculty;
    const accent = (useCurrentPalette && rootStyles?.getPropertyValue('--lux-accent'))
        ? rootStyles.getPropertyValue('--lux-accent').trim()
        : (profile.color || getFacultyColor(normalized));
    const accent2 = (useCurrentPalette && rootStyles?.getPropertyValue('--lux-accent-2'))
        ? rootStyles.getPropertyValue('--lux-accent-2').trim()
        : accent;
    const rgb = kiuResolveColorTriplet(accent, kiuResolveColorTriplet(profile.color || getFacultyColor(normalized), '164,38,44'));
    const rgbSoft = options.softAlpha ?? 0.12;
    const rgbTint = options.tintAlpha ?? 0.18;
    const rgbStrong = options.strongAlpha ?? 0.24;
    const borderAlpha = options.borderAlpha ?? 0.26;
    return {
        faculty: normalized,
        accent,
        accent2,
        rgb,
        softBg: `rgba(${rgb},${rgbSoft})`,
        tintBg: `rgba(${rgb},${rgbTint})`,
        strongBg: `rgba(${rgb},${rgbStrong})`,
        border: `rgba(${rgb},${borderAlpha})`
    };
}
function getFacultyLabel(code) {
    const labels = { CS: 'Computer Science', ECON: 'Business Management', LAW: 'Law', MED: 'Medicine', ARTS: 'Arts & Humanities' };
    return labels[code] || code;
}
function normalizeFacultyCode(value, fallback = 'ECON') {
    const raw = String(value || '').trim();
    const normalized = raw.toUpperCase();
    const map = {
        CS: 'CS',
        'COMPUTER SCIENCE': 'CS',
        'COMPUTER SCIENCE & MATH': 'CS',
        'COMPUTER SCIENCE & MATHEMATICS': 'CS',
        'ECON': 'ECON',
        'MANAGEMENT': 'ECON',
        'BUSINESS MANAGEMENT': 'ECON',
        'MANAGEMENT & BUSINESS': 'ECON',
        'BUSINESS MANAGEMENT & ECONOMICS': 'ECON',
        'LAW': 'LAW',
        'MED': 'MED',
        'MEDICINE': 'MED',
        'ARTS': 'ARTS',
        'ARTS & HUMANITIES': 'ARTS'
    };
    if (map[normalized]) return map[normalized];
    // Handle lowercase/slugs used by some page-specific dropdowns.
    const slug = raw.toLowerCase();
    if (slug === 'cs' || slug === 'computer-science') return 'CS';
    if (slug === 'econ' || slug === 'management' || slug === 'business-management') return 'ECON';
    if (slug === 'law') return 'LAW';
    if (slug === 'med' || slug === 'medicine') return 'MED';
    if (slug === 'arts' || slug === 'arts-humanities') return 'ARTS';
    return fallback;
}
const SCHEDULE_EN_WEEKDAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const SCHEDULE_GEORGIAN_WEEKDAY_LABELS = [
    ['\u10dd\u10e0\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8', 'Monday'],
    ['\u10e1\u10d0\u10db\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8', 'Tuesday'],
    ['\u10dd\u10d7\u10ee\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8', 'Wednesday'],
    ['\u10ee\u10e3\u10d7\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8', 'Thursday'],
    ['\u10de\u10d0\u10e0\u10d0\u10e1\u10d9\u10d4\u10d5\u10d8', 'Friday'],
    ['\u10e8\u10d0\u10d1\u10d0\u10d7\u10d8', 'Saturday'],
    ['\u10d9\u10d5\u10d8\u10e0\u10d0', 'Sunday']
];
const SCHEDULE_TRANSLITERATED_WEEKDAY_LABELS = [
    ['orshabati', 'Monday'],
    ['samshabati', 'Tuesday'],
    ['otkhshabati', 'Wednesday'],
    ['otxshabati', 'Wednesday'],
    ['khutshabati', 'Thursday'],
    ['xutshabati', 'Thursday'],
    ['paraskevi', 'Friday'],
    ['shabati', 'Saturday'],
    ['kvira', 'Sunday']
];
const SCHEDULE_WINDOWS_1252_REVERSE_MAP = {
    0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
    0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
    0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
    0x017E: 0x9E, 0x0178: 0x9F
};
const hasBrokenScheduleDisplayText = window.hasBrokenScheduleDisplayText;
const decodeScheduleMojibakeText = window.decodeScheduleMojibakeText;
const normalizeScheduleComparableText = window.normalizeScheduleComparableText;
const extractScheduleTime = window.extractScheduleTime;
const getEnglishScheduleWeekday = window.getEnglishScheduleWeekday;
const normalizeScheduleDayLabel = window.normalizeScheduleDayLabel;
const repairScheduleDisplayText = window.repairScheduleDisplayText;
const parseLocalDate = window.parseLocalDate;
const formatLocalDateISO = window.formatLocalDateISO;
const addDaysLocal = window.addDaysLocal;
const getWeekStartDate = window.getWeekStartDate;
const getCurrentWeekStartISO = window.getCurrentWeekStartISO;
const shiftWeekStartISO = window.shiftWeekStartISO;
const getStoredWeekStart = window.getStoredWeekStart;
const setStoredWeekStart = window.setStoredWeekStart;
const getWeekDateEntries = window.getWeekDateEntries;
const formatWeekRangeLabel = window.formatWeekRangeLabel;
const compareWeekStartISO = window.compareWeekStartISO;
const deriveFacultyFromSubjectId = window.deriveFacultyFromSubjectId;
const isGroupActiveForWeek = window.isGroupActiveForWeek;
const normalizeScheduleGroup = window.normalizeScheduleGroup;
const migrateAvailableGroupsSessionTypes = window.migrateAvailableGroupsSessionTypes;
const inferSchedulerSessionType = window.inferSchedulerSessionType;
const getEffectiveGroupForWeek = window.getEffectiveGroupForWeek;
const getAvailableScheduleItemsForWeek = window.getAvailableScheduleItemsForWeek;
const resolveScheduledGroupForWeek = window.resolveScheduledGroupForWeek;
function normalizeStudentScheduleEntriesForSchedulerMutation(scheduleValue) {
    if (typeof normalizeStudentScheduleValue === 'function') {
        return normalizeStudentScheduleValue(scheduleValue).map(entry => ({ ...entry }));
    }
    if (Array.isArray(scheduleValue)) {
        return scheduleValue.map(entry => ({ ...entry }));
    }
    if (scheduleValue && typeof scheduleValue === 'object') {
        if (Array.isArray(scheduleValue.entries)) {
            return scheduleValue.entries.map(entry => ({ ...entry }));
        }
        return Object.entries(scheduleValue)
            .filter(([, groupId]) => groupId != null && groupId !== '')
            .map(([scheduledCourseId, scheduledGroupId]) => ({
                courseId: scheduledCourseId,
                groupId: scheduledGroupId
            }));
    }
    return [];
}
function buildStudentScheduledSectionEntry(courseId, groupData, previousEntry = {}) {
    const normalizedGroup = normalizeScheduleGroup(courseId, groupData) || previousEntry || {};
    return {
        ...previousEntry,
        courseId,
        sourceCourseId: courseId,
        courseName: normalizedGroup.courseName || normalizedGroup.subjectName || repairScheduleDisplayText(previousEntry.courseName || courseId, courseId),
        groupId: normalizedGroup.id || previousEntry.groupId || '',
        groupName: normalizedGroup.name || repairScheduleDisplayText(previousEntry.groupName || normalizedGroup.id || '', normalizedGroup.id || ''),
        day: normalizedGroup.day || repairScheduleDisplayText(previousEntry.day || '', ''),
        time: normalizedGroup.time || repairScheduleDisplayText(previousEntry.time || '', ''),
        endTime: normalizedGroup.endTime || repairScheduleDisplayText(previousEntry.endTime || '', ''),
        duration: normalizedGroup.duration || previousEntry.duration || '',
        room: normalizedGroup.room || repairScheduleDisplayText(previousEntry.room || '', ''),
        prof: normalizedGroup.prof || repairScheduleDisplayText(previousEntry.prof || '', ''),
        ta: normalizedGroup.ta || repairScheduleDisplayText(previousEntry.ta || '', ''),
        faculty: normalizedGroup.faculty || previousEntry.faculty || '',
        semester: Number(normalizedGroup.semester || previousEntry.semester || 0) || previousEntry.semester || null,
        capacity: Number(normalizedGroup.capacity || previousEntry.capacity || 0) || previousEntry.capacity || 0,
        sessionType: normalizedGroup.sessionType || previousEntry.sessionType || 'lecture'
    };
}
function commitStudentScheduleEntriesForSchedulerMutation(studentId, entries) {
    if (!KIU_STATE.studentSchedulesByStudent || typeof KIU_STATE.studentSchedulesByStudent !== 'object') {
        KIU_STATE.studentSchedulesByStudent = {};
    }
    KIU_STATE.studentSchedulesByStudent[studentId] = JSON.parse(JSON.stringify(entries));
}
function doesScheduledEntryBelongToGroupFaculty(entry, studentId, groupData, courseId) {
    const targetFaculty = normalizeFacultyCode(groupData?.faculty || deriveFacultyFromSubjectId(courseId) || '', '');
    if (!targetFaculty) return true;
    const entryFaculty = normalizeFacultyCode(entry?.faculty || entry?.facultyCode || '', '');
    if (entryFaculty) return entryFaculty === targetFaculty;
    const student = (KIU_STATE.users || []).find(user => String(user?.id || '') === String(studentId || ''));
    const studentFaculty = normalizeFacultyCode(student?.facultyCode || student?.faculty || '', '');
    if (studentFaculty) return studentFaculty === targetFaculty;
    const derivedEntryFaculty = normalizeFacultyCode(deriveFacultyFromSubjectId(entry?.courseId || entry?.sourceCourseId || courseId) || '', '');
    return !derivedEntryFaculty || derivedEntryFaculty === targetFaculty;
}
function syncStudentSchedulesForScheduledGroup(courseId, groupId, groupData) {
    const normalizedCourseId = canonicalCourseKey(courseId);
    const normalizedGroupId = canonicalCourseKey(groupId);
    let updatedEntries = 0;
    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, rawSchedule]) => {
        const scheduleEntries = normalizeStudentScheduleEntriesForSchedulerMutation(rawSchedule);
        let mutated = false;
        const nextEntries = scheduleEntries.map(entry => {
            const entryCourseId = canonicalCourseKey(entry?.courseId || entry?.sourceCourseId || '');
            const entryGroupId = canonicalCourseKey(entry?.groupId || entry?.groupName || '');
            if (entryCourseId !== normalizedCourseId || entryGroupId !== normalizedGroupId) return entry;
            if (!doesScheduledEntryBelongToGroupFaculty(entry, studentId, groupData, courseId)) return entry;
            mutated = true;
            updatedEntries += 1;
            return buildStudentScheduledSectionEntry(courseId, groupData, entry);
        });
        if (mutated) {
            commitStudentScheduleEntriesForSchedulerMutation(studentId, nextEntries);
        }
    });
    return updatedEntries;
}
function migrateStudentSchedulesForScheduledGroup(fromCourseId, fromGroupId, toCourseId, groupData) {
    const normalizedFromCourseId = canonicalCourseKey(fromCourseId);
    const normalizedFromGroupId = canonicalCourseKey(fromGroupId);
    let migratedEntries = 0;
    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, rawSchedule]) => {
        const scheduleEntries = normalizeStudentScheduleEntriesForSchedulerMutation(rawSchedule);
        let mutated = false;
        const nextEntries = scheduleEntries.map(entry => {
            const entryCourseId = canonicalCourseKey(entry?.courseId || entry?.sourceCourseId || '');
            const entryGroupId = canonicalCourseKey(entry?.groupId || entry?.groupName || '');
            if (entryCourseId !== normalizedFromCourseId || entryGroupId !== normalizedFromGroupId) return entry;
            if (!doesScheduledEntryBelongToGroupFaculty(entry, studentId, groupData, fromCourseId)) return entry;
            mutated = true;
            migratedEntries += 1;
            return buildStudentScheduledSectionEntry(toCourseId, groupData, entry);
        });
        if (mutated) {
            commitStudentScheduleEntriesForSchedulerMutation(studentId, nextEntries);
        }
    });
    return migratedEntries;
}
function removeStudentSchedulesForScheduledGroup(courseId, groupId, groupData = null) {
    const normalizedCourseId = canonicalCourseKey(courseId);
    const normalizedGroupId = canonicalCourseKey(groupId);
    let removedEntries = 0;
    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, rawSchedule]) => {
        const scheduleEntries = normalizeStudentScheduleEntriesForSchedulerMutation(rawSchedule);
        const nextEntries = scheduleEntries.filter(entry => {
            const entryCourseId = canonicalCourseKey(entry?.courseId || entry?.sourceCourseId || '');
            const entryGroupId = canonicalCourseKey(entry?.groupId || entry?.groupName || '');
            const shouldRemove = entryCourseId === normalizedCourseId
                && entryGroupId === normalizedGroupId
                && doesScheduledEntryBelongToGroupFaculty(entry, studentId, groupData, courseId);
            if (shouldRemove) removedEntries += 1;
            return !shouldRemove;
        });
        if (nextEntries.length !== scheduleEntries.length) {
            commitStudentScheduleEntriesForSchedulerMutation(studentId, nextEntries);
        }
    });
    return removedEntries;
}
function upsertScheduledSession(courseId, sessionData, options = {}) {
    if (!courseId) return null;
    const weekStart = formatLocalDateISO(getWeekStartDate(parseLocalDate(options.weekStart) || new Date()));
    const applyScope = options.scope === 'recurring' ? 'recurring' : 'selected-week';
    const normalizedFaculty = normalizeFacultyCode(sessionData.faculty || deriveFacultyFromSubjectId(courseId));
    const normalizedGroupId = String(sessionData.id || sessionData.groupId || '').trim().toLowerCase();
    const normalizedName = String(sessionData.name || sessionData.groupId || sessionData.id || '').trim();
    if (!normalizedGroupId || !normalizedName) return null;
    if (!KIU_STATE.availableGroups[courseId]) KIU_STATE.availableGroups[courseId] = [];
    const groups = KIU_STATE.availableGroups[courseId];
    let targetGroup = groups.find(group => (
        String(group.id) === normalizedGroupId
        && normalizeFacultyCode(group?.faculty || deriveFacultyFromSubjectId(courseId), normalizedFaculty) === normalizedFaculty
    ));
    const isNewGroup = !targetGroup;
    if (isNewGroup) {
        targetGroup = normalizeScheduleGroup(courseId, {
            ...sessionData,
            id: normalizedGroupId,
            name: normalizedName,
            faculty: normalizedFaculty,
            startWeek: weekStart,
            endWeek: applyScope === 'selected-week' ? weekStart : null
        });
        groups.push(targetGroup);
    }
    if (!targetGroup.weekOverrides) targetGroup.weekOverrides = {};
    const basePayload = normalizeScheduleGroup(courseId, {
        ...targetGroup,
        ...sessionData,
        id: normalizedGroupId,
        name: normalizedName,
        faculty: normalizedFaculty,
        startWeek: targetGroup.startWeek || weekStart
    });
    if (applyScope === 'recurring') {
        Object.assign(targetGroup, basePayload, {
            endWeek: null,
            weekOverrides: targetGroup.weekOverrides || {}
        });
    } else {
        if (isNewGroup) {
            Object.assign(targetGroup, basePayload, {
                startWeek: weekStart,
                endWeek: weekStart,
                weekOverrides: {}
            });
        } else {
            if (!targetGroup.startWeek) targetGroup.startWeek = weekStart;
            targetGroup.weekOverrides[weekStart] = {
                day: basePayload.day,
                time: basePayload.time,
                endTime: basePayload.endTime,
                duration: basePayload.duration,
                room: basePayload.room,
                prof: basePayload.prof,
                ta: basePayload.ta,
                capacity: basePayload.capacity,
                faculty: basePayload.faculty,
                semester: basePayload.semester,
                registered: basePayload.registered || targetGroup.registered || 0
            };
        }
    }
    const normalizedGroup = normalizeScheduleGroup(courseId, targetGroup);
    syncStudentSchedulesForScheduledGroup(courseId, normalizedGroupId, normalizedGroup);
    if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
        syncAvailableGroupEnrollmentCounts();
    }
    return {
        applyScope,
        weekStart,
        createdBaseGroup: !targetGroup.startWeek || targetGroup.startWeek === weekStart,
        group: normalizedGroup
    };
}
function deleteScheduledSession(courseId, groupId, weekStart, mode = 'visible') {
    const groups = KIU_STATE.availableGroups?.[courseId];
    if (!groups) return false;
    const normalizedWeek = formatLocalDateISO(getWeekStartDate(parseLocalDate(weekStart) || new Date()));
    const normalizedFaculty = normalizeFacultyCode(deriveFacultyFromSubjectId(courseId), '');
    const targetIndex = groups.findIndex(group => (
        String(group.id) === String(groupId)
        && (!normalizedFaculty || normalizeFacultyCode(group?.faculty || normalizedFaculty, normalizedFaculty) === normalizedFaculty)
    ));
    if (targetIndex === -1) return false;
    const targetGroup = normalizeScheduleGroup(courseId, groups[targetIndex]);
    if (mode === 'visible' && targetGroup.weekOverrides?.[normalizedWeek]) {
        delete groups[targetIndex].weekOverrides[normalizedWeek];
        syncStudentSchedulesForScheduledGroup(courseId, groupId, groups[targetIndex]);
        if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
            syncAvailableGroupEnrollmentCounts();
        }
        return true;
    }
    if (mode === 'week-only' && groups[targetIndex].weekOverrides?.[normalizedWeek]) {
        delete groups[targetIndex].weekOverrides[normalizedWeek];
        syncStudentSchedulesForScheduledGroup(courseId, groupId, groups[targetIndex]);
        if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
            syncAvailableGroupEnrollmentCounts();
        }
        return true;
    }
    groups.splice(targetIndex, 1);
    removeStudentSchedulesForScheduledGroup(courseId, groupId, targetGroup);
    if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
        syncAvailableGroupEnrollmentCounts();
    }
    return true;
}
function getProgramLabelForUser(user, facultyProfile = null) {
    if (!user) return 'University Program';
    if (user.program) return user.program;
    if (user.role === USER_ROLES.STUDENT) {
        return facultyProfile?.name ? `BSc ${facultyProfile.name}` : 'Undergraduate Program';
    }
    if (user.role === USER_ROLES.PROFESSOR) return user.title || 'Faculty Professor';
    if (user.role === USER_ROLES.TA) return 'Teaching Assistantship';
    return facultyProfile?.name ? `${facultyProfile.name} Administration` : 'Administration';
}
function getAcademicLevelLabel(user) {
    if (!user) return 'Portal Member';
    if (user.role === USER_ROLES.STUDENT) return 'Bachelor';
    if (user.role === USER_ROLES.PROFESSOR) return 'Professor';
    if (user.role === USER_ROLES.TA) return 'Teaching Assistant';
    return 'Administrator';
}
function getSafeInstitutionalEmail(user) {
    const domain = typeof window.KIU_INSTITUTIONAL_EMAIL_DOMAIN === 'string'
        ? window.KIU_INSTITUTIONAL_EMAIL_DOMAIN
        : 'kiu.edu.ge';
    if (!user) return `portal@${domain}`;
    if (user.email) return user.email;
    const institutionalId = user.studentId || user.staffId || user.id || '';
    if (typeof window.buildInstitutionalEmail === 'function') {
        const generated = window.buildInstitutionalEmail(institutionalId);
        if (generated) return generated;
    }
    const normalized = String(user.nameEn || user.name || 'portal.user')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '') || 'portal.user';
    return `${normalized}@${domain}`;
}
function getUserAverageScore(userId) {
    if (!userId) return 0;
    const scores = [];
    Object.values(KIU_STATE.studentGrades || {}).forEach(roster => {
        const grade = (roster || []).find(entry => entry.id === userId);
        if (!grade) return;
        const canonicalScore = typeof getGradeRecordCombinedKiuPassScore === 'function'
            ? Number(getGradeRecordCombinedKiuPassScore(grade) || 0)
            : Number((grade.q1 || 0) + (grade.qa || 0) + (grade.mid || 0) + (grade.final || 0));
        if (canonicalScore > 0) scores.push(canonicalScore);
    });
    if (!scores.length) return 0;
    return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}
function getUserPerformanceSummary(user) {
    const isStudent = user?.role === USER_ROLES.STUDENT;
    if (!user) {
        return { primary: '-', secondary: '-', tertiary: '-', quaternary: '-' };
    }
    if (isStudent) {
        const avgScore = getUserAverageScore(user.id);
        const letter = avgScore >= 91 ? 'A' : avgScore >= 81 ? 'B' : avgScore >= 71 ? 'C' : avgScore >= 61 ? 'D' : avgScore >= 51 ? 'E' : 'F';
        const preferredFaculty = user?.facultyCode || user?.faculty || getCurrentFaculty();
        const completedEcts = typeof getStudentCompletedEctsTotal === 'function' ? getStudentCompletedEctsTotal(user.id, preferredFaculty) : 0;
        const currentSemester = typeof getCurrentStudentSemesterNumber === 'function'
            ? getCurrentStudentSemesterNumber(user)
            : (parseInt(user.semester, 10) || parseInt(KIU_STATE.activeSemester, 10) || 1);
        return {
            primary: String(currentSemester),
            secondary: typeof user.gpa === 'number' ? user.gpa.toFixed(2) : '0.00',
            tertiary: String(completedEcts),
            quaternary: avgScore > 0 ? `${avgScore}/${letter}` : 'No grades yet'
        };
    }
    const identityKeys = (() => {
        if (typeof getUserNameVariants === 'function') {
            return getUserNameVariants(user);
        }
        const fallback = new Set();
        [user.name, user.nameEn, user.email].forEach(value => {
            const normalized = typeof normalizePersonNameKey === 'function'
                ? normalizePersonNameKey(value)
                : String(value || '').trim().toLowerCase();
            if (normalized) fallback.add(normalized);
        });
        return fallback;
    })();
    const assignedSections = Object.values(KIU_STATE.availableGroups || {}).flat().filter(group => {
        const profKey = typeof normalizePersonNameKey === 'function'
            ? normalizePersonNameKey(group.prof)
            : String(group.prof || '').trim().toLowerCase();
        const taKey = typeof normalizePersonNameKey === 'function'
            ? normalizePersonNameKey(group.ta)
            : String(group.ta || '').trim().toLowerCase();
        return identityKeys.has(profKey) || identityKeys.has(taKey);
    });
    const totalHours = assignedSections.reduce((sum, group) => {
        const durMatch = String(group.duration || '').match(/\d+/);
        return sum + (durMatch ? parseInt(durMatch[0], 10) : 110);
    }, 0);
    return {
        primary: String(assignedSections.length),
        secondary: user.maxHours ? `${user.maxHours}h` : `${Math.round(totalHours / 60)}h`,
        tertiary: String((user.subjects || []).length || assignedSections.length),
        quaternary: user.status || 'Active'
    };
}
function populateProgramContextControls(user, facultyProfile) {
    const programLabel = getProgramLabelForUser(user, facultyProfile);
    [document.getElementById('program-context-select'), document.getElementById('study-card-program-select')]
        .filter(Boolean)
        .forEach(select => {
            select.innerHTML = '';
            const option = document.createElement('option');
            option.textContent = programLabel;
            option.value = programLabel;
            select.appendChild(option);
            select.value = programLabel;
        });
    document.querySelectorAll('#modal-programs .modal-header h3').forEach(header => {
        header.textContent = user?.nameEn || user?.name || 'Portal User';
    });
}
function renderProfilePageContext(user) {
    const idInput = document.getElementById('profile-id-input');
    const emailInput = document.getElementById('profile-email-input');
    const titleEl = document.getElementById('profile-section-title');
    if (titleEl) titleEl.textContent = `${user?.nameEn || user?.name || 'User'} Profile`;
    if (idInput) idInput.value = user?.id || 'N/A';
    if (emailInput) emailInput.value = getSafeInstitutionalEmail(user);
}
function getCurrentAcademicTermLabel() {
    const now = new Date();
    const isSpring = now.getMonth() <= 5;
    const startYear = isSpring ? now.getFullYear() - 1 : now.getFullYear();
    return `${startYear}/${startYear + 1} ${isSpring ? 'Spring' : 'Fall'} Semester`;
}
function formatPersonalDataDate(value, fallback = '-') {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toISOString().slice(0, 10);
}
function getStudentAdmissionDate(user) {
    if (user?.joinYear) return `${user.joinYear}-09-01`;
    const semesterNumber = typeof getCurrentStudentSemesterNumber === 'function'
        ? getCurrentStudentSemesterNumber(user)
        : (parseInt(user?.semester, 10) || parseInt(KIU_STATE.activeSemester, 10) || 1);
    const now = new Date();
    const currentAcademicStartYear = now.getMonth() <= 5 ? now.getFullYear() - 1 : now.getFullYear();
    const inferredJoinYear = currentAcademicStartYear - Math.max(0, Math.floor((semesterNumber - 1) / 2));
    return `${inferredJoinYear}-09-01`;
}
function ensurePersonalDataAvatarFallback(avatarEl) {
    if (!avatarEl?.parentElement) return null;
    let fallback = avatarEl.parentElement.querySelector('[data-personal-data-avatar-fallback="true"]');
    if (!fallback) {
        fallback = document.createElement('div');
        fallback.setAttribute('data-personal-data-avatar-fallback', 'true');
        fallback.hidden = true;
        avatarEl.insertAdjacentElement('afterend', fallback);
    }
    return fallback;
}
function getStudentPersonalDataRecordLabel(user, preferredFaculty) {
    const balance = typeof getEffectiveTuitionBalance === 'function'
        ? getEffectiveTuitionBalance(user?.id)
        : ((KIU_STATE.tuitionBalances && KIU_STATE.tuitionBalances[user?.id]) || 0);
    const isProbation = !!KIU_STATE.probationStatus?.[user?.id];
    const registeredEcts = typeof getStudentRegisteredEctsTotal === 'function'
        ? getStudentRegisteredEctsTotal(user?.id, preferredFaculty)
        : 0;
    const scheduledSections = Array.isArray(KIU_STATE.studentSchedulesByStudent?.[user?.id])
        ? KIU_STATE.studentSchedulesByStudent[user.id]
        : [];
    const scheduledCourseCount = new Set(scheduledSections.map(item => item?.courseId).filter(Boolean)).size;
    if (balance > 0) {
        return `Financial hold - ${Math.round(balance)} GEL outstanding`;
    }
    if (isProbation) {
        return `Academic probation - ${registeredEcts || 0} ECTS plan`;
    }
    if (scheduledCourseCount > 0 || registeredEcts > 0) {
        return `Registered - ${scheduledCourseCount || 0} subjects / ${registeredEcts || 0} ECTS`;
    }
    return 'Active student record';
}

function ensurePortalMessengerState() {
    if (!KIU_STATE.portalMessengerChats || typeof KIU_STATE.portalMessengerChats !== 'object') {
        KIU_STATE.portalMessengerChats = {};
    }
    if (!KIU_STATE.portalMessengerFavorites || typeof KIU_STATE.portalMessengerFavorites !== 'object') {
        KIU_STATE.portalMessengerFavorites = {};
    }
    if (!KIU_STATE.portalMessengerPinnedChats || typeof KIU_STATE.portalMessengerPinnedChats !== 'object') {
        KIU_STATE.portalMessengerPinnedChats = {};
    }
    if (!KIU_STATE.portalMessengerCalls || typeof KIU_STATE.portalMessengerCalls !== 'object') {
        KIU_STATE.portalMessengerCalls = {};
    }
    if (!KIU_STATE.portalMessengerHiddenChats || typeof KIU_STATE.portalMessengerHiddenChats !== 'object') {
        KIU_STATE.portalMessengerHiddenChats = {};
    }
    Object.keys(KIU_STATE.portalMessengerChats).forEach(chatId => {
        KIU_STATE.portalMessengerChats[chatId] = normalizePortalMessengerChatRecord(KIU_STATE.portalMessengerChats[chatId]);
    });
    if (getCurrentUser()?.id) {
        scheduleKiuRealtimeBootstrap();
    }
}
function normalizePortalMessengerMessageRecord(message = {}) {
    return {
        ...message,
        id: String(message.id || `portal_msg_${Date.now()}`),
        senderId: String(message.senderId || ''),
        senderName: message.senderName || message.senderId || 'Portal user',
        senderRole: message.senderRole || USER_ROLES.STUDENT,
        text: message.text || '',
        file: message.file ? { ...message.file } : null,
        sentAt: message.sentAt || new Date().toISOString(),
        replyToMessageId: message.replyToMessageId ? String(message.replyToMessageId) : '',
        seenBy: Array.isArray(message.seenBy) ? [...new Set(message.seenBy.map(id => String(id)))] : [],
        seenAtByUser: message.seenAtByUser && typeof message.seenAtByUser === 'object' ? { ...message.seenAtByUser } : {}
    };
}
function normalizePortalMessengerChatRecord(chat = {}) {
    const members = Array.isArray(chat.members) ? [...new Set(chat.members.map(member => String(member)))] : [];
    const normalized = {
        ...chat,
        id: String(chat.id || buildPortalMessengerGroupChatId()),
        type: chat.type === 'group' ? 'group' : 'direct',
        members,
        name: chat.name || '',
        createdBy: String(chat.createdBy || members[0] || ''),
        createdAt: chat.createdAt || new Date().toISOString(),
        messages: Array.isArray(chat.messages) ? chat.messages.map(normalizePortalMessengerMessageRecord) : [],
        requestStateByUser: chat.requestStateByUser && typeof chat.requestStateByUser === 'object' ? { ...chat.requestStateByUser } : {}
    };
    return normalized;
}
function ensurePortalNotificationState() {
    if (!Array.isArray(KIU_STATE.portalNotifications)) {
        KIU_STATE.portalNotifications = [];
    }
}
function ensurePortalNotificationUiState() {
    window.__portalNotificationUi = window.__portalNotificationUi || {
        dockOpen: false,
        fullOpen: false,
        filter: 'all'
    };
    if (window.__portalNotificationUi.filter === 'academic') {
        window.__portalNotificationUi.filter = 'school';
    }
    return window.__portalNotificationUi;
}
function buildPortalScheduleSignature(schedule = []) {
    return JSON.stringify((schedule || []).map(item => ({
        courseId: String(item.courseId || ''),
        groupId: String(item.groupId || ''),
        day: String(item.day || item.timeDay || ''),
        time: String(item.time || ''),
        room: String(item.room || '')
    })).sort((a, b) => `${a.courseId}:${a.groupId}:${a.day}:${a.time}`.localeCompare(`${b.courseId}:${b.groupId}:${b.day}:${b.time}`)));
}
function normalizePortalNotificationSource(value) {
    const normalized = String(value || '').trim().toLowerCase();
    if (!normalized || ['system', 'academic', 'school'].includes(normalized)) return 'school';
    return normalized;
}
function getPortalSystemNotificationIcon(type) {
    const iconMap = {
        'grade-evaluated': 'fa-clipboard-check',
        'manual-quiz-grade': 'fa-clipboard-check',
        'student-service-reply': 'fa-headset',
        'student-service-status': 'fa-circle-check',
        'schedule-change': 'fa-calendar-days',
        'official-order': 'fa-file-lines',
        'admin-announcement': 'fa-bullhorn'
    };
    return iconMap[String(type || '')] || 'fa-bell';
}
function isHighSignalSocialNotificationType(type) {
    return new Set([
        'profile-post',
        'group-post',
        'reel',
        'story',
        'follow',
        'comment',
        'reply',
        'mention',
        'group-mention',
        'friend-request',
        'friend-accepted',
        'group-invite',
        'post-approved',
        'post-rejected',
        'group-approved',
        'group-denied'
    ]).has(String(type || ''));
}
function getPortalSocialNotificationIcon(type) {
    const iconMap = {
        'profile-post': 'fa-newspaper',
        'group-post': 'fa-users',
        'reel': 'fa-film',
        'story': 'fa-camera-retro',
        'follow': 'fa-user-plus',
        'comment': 'fa-comment-dots',
        'reply': 'fa-reply',
        'mention': 'fa-at',
        'group-mention': 'fa-at',
        'friend-request': 'fa-user-plus',
        'friend-accepted': 'fa-user-check',
        'group-invite': 'fa-envelope-open-text',
        'post-approved': 'fa-circle-check',
        'post-rejected': 'fa-circle-xmark',
        'group-approved': 'fa-circle-check',
        'group-denied': 'fa-circle-xmark'
    };
    return iconMap[String(type || '')] || 'fa-bell';
}
function createPortalSystemNotification(input = {}) {
    ensurePortalNotificationState();
    const userId = String(input.userId || '');
    if (!userId) return null;
    const source = normalizePortalNotificationSource(input.source);
    const duplicateWindowMs = Number(input.duplicateWindowMs || 0);
    if (duplicateWindowMs > 0) {
        const now = Date.now();
        const existing = KIU_STATE.portalNotifications.find(item =>
            String(item.userId) === userId
            && normalizePortalNotificationSource(item.source) === source
            && String(item.type || '') === String(input.type || 'update')
            && String(item.text || '') === String(input.text || '')
            && Math.abs(now - new Date(item.createdAt || 0).getTime()) <= duplicateWindowMs
        );
        if (existing) return existing;
    }
    const notification = {
        id: `portal_notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId,
        source,
        type: input.type || 'update',
        title: input.title || 'Notification',
        text: input.text || '',
        read: false,
        createdAt: input.createdAt || new Date().toISOString(),
        routePage: input.routePage || '',
        routeData: input.routeData || null
    };
    KIU_STATE.portalNotifications.unshift(notification);
    if (typeof window.renderPortalNotificationChrome === 'function') {
        if (!window.__portalNotificationRenderQueued) {
            window.__portalNotificationRenderQueued = true;
            setTimeout(() => {
                window.__portalNotificationRenderQueued = false;
                window.renderPortalNotificationChrome();
            }, 0);
        }
    }
    return notification;
}
function getPortalSystemNotificationsForUser(userId) {
    ensurePortalNotificationState();
    return KIU_STATE.portalNotifications
        .filter(item => String(item.userId) === String(userId))
        .map(item => ({
            key: `system:${item.id}`,
            id: item.id,
            source: normalizePortalNotificationSource(item.source),
            title: item.title || 'Notification',
            text: item.text || '',
            type: item.type || 'update',
            routePage: item.routePage || '',
            routeData: item.routeData || null,
            read: Boolean(item.read),
            createdAt: item.createdAt || '',
            icon: getPortalSystemNotificationIcon(item.type)
        }));
}
function getPortalSocialNotificationsForUser(userId) {
    const notifications = Array.isArray(KIU_STATE.socialHub?.notifications) ? KIU_STATE.socialHub.notifications : [];
    return notifications
        .filter(item => String(item.userId) === String(userId))
        .filter(item => isHighSignalSocialNotificationType(item.type))
        .map(item => {
            const actor = getPortalMessengerUserById(item.actorId) || null;
            const actorLabel = actor?.displayName || 'Campus';
            return {
                key: `social:${item.id}`,
                id: item.id,
                source: 'social',
                title: actorLabel,
                text: item.text || 'New social activity.',
                type: item.type || 'activity',
                routePage: 'social',
                routeData: { socialRoute: item.route || '' },
                read: Boolean(item.read),
                createdAt: item.createdAt || '',
                icon: getPortalSocialNotificationIcon(item.type)
            };
        });
}
function getPortalNotificationItemsForUser(userId) {
    const merged = [
        ...getPortalSystemNotificationsForUser(userId),
        ...getPortalSocialNotificationsForUser(userId)
    ];
    const filter = String(ensurePortalNotificationUiState().filter || 'all');
    return merged
        .filter(item => {
            if (filter === 'all') return true;
            if (filter === 'social') return item.source === 'social';
            if (filter === 'school' || filter === 'academic') return item.source !== 'social';
            return true;
        })
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}
function getPortalNotificationUnreadCount(userId) {
    return getPortalSystemNotificationsForUser(userId).filter(item => !item.read).length
        + getPortalSocialNotificationsForUser(userId).filter(item => !item.read).length;
}
function markPortalNotificationRead(notificationKey) {
    const [source, id] = String(notificationKey || '').split(':');
    if (!source || !id) return;
    if (source === 'social') {
        const notification = (KIU_STATE.socialHub?.notifications || []).find(item => String(item.id) === String(id));
        if (notification) notification.read = true;
    } else {
        ensurePortalNotificationState();
        const notification = KIU_STATE.portalNotifications.find(item => String(item.id) === String(id));
        if (notification) notification.read = true;
    }
}
function removePortalNotification(notificationRef) {
    const raw = String(notificationRef || '').trim();
    if (!raw) return false;
    const parts = raw.split(':');
    const source = parts.length > 1 ? parts[0] : 'system';
    const id = parts.length > 1 ? parts.slice(1).join(':') : raw;
    if (!id) return false;
    let changed = false;
    if (source === 'social') {
        const before = (KIU_STATE.socialHub?.notifications || []).length;
        KIU_STATE.socialHub.notifications = (KIU_STATE.socialHub?.notifications || []).filter(item => String(item.id) !== String(id));
        changed = changed || (KIU_STATE.socialHub.notifications.length !== before);
    } else {
        ensurePortalNotificationState();
        const before = KIU_STATE.portalNotifications.length;
        KIU_STATE.portalNotifications = KIU_STATE.portalNotifications.filter(item => String(item.id) !== String(id));
        changed = changed || (KIU_STATE.portalNotifications.length !== before);
    }
    if (changed) {
        saveState();
        if (typeof renderPortalNotificationChrome === 'function') renderPortalNotificationChrome();
    }
    return changed;
}
function markAllPortalNotificationsRead() {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    ensurePortalNotificationState();
    KIU_STATE.portalNotifications.forEach(item => {
        if (String(item.userId) === String(currentUser.id)) item.read = true;
    });
    (KIU_STATE.socialHub?.notifications || []).forEach(item => {
        if (String(item.userId) === String(currentUser.id)) item.read = true;
    });
    saveState();
    renderPortalNotificationChrome();
}
function setPortalNotificationFilter(value) {
    const normalized = String(value || '').toLowerCase();
    ensurePortalNotificationUiState().filter = ['all', 'social', 'school', 'academic'].includes(normalized)
        ? (normalized === 'academic' ? 'school' : normalized)
        : 'all';
    renderPortalNotificationChrome();
}
function togglePortalNotificationDock(forceOpen = null) {
    const uiState = ensurePortalNotificationUiState();
    const shouldOpen = forceOpen === null ? !uiState.fullOpen : Boolean(forceOpen);
    if (shouldOpen) openPortalNotificationFullModal();
    else closePortalNotificationFullModal();
}
function openPortalNotificationFullModal() {
    ensurePortalNotificationUiState().fullOpen = true;
    renderPortalNotificationChrome();
}
function closePortalNotificationFullModal() {
    ensurePortalNotificationUiState().fullOpen = false;
    renderPortalNotificationChrome();
}
function switchPortalNotificationToDock() {
    closePortalNotificationFullModal();
}
function openPortalNotificationItem(notificationKey) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const item = getPortalNotificationItemsForUser(currentUser.id).find(entry => entry.key === notificationKey);
    if (!item) return;
    const uiState = ensurePortalNotificationUiState();
    uiState.fullOpen = false;
    markPortalNotificationRead(notificationKey);
    if (item.routePage === 'social') {
        rememberSocialPortalContext();
        navigate('social');
    } else if (item.routePage === 'lms' && item.routeData?.courseId && item.routeData?.groupId) {
        localStorage.setItem('KIU_PENDING_LMS_GROUP', JSON.stringify({
            courseId: item.routeData.courseId,
            groupId: item.routeData.groupId
        }));
        navigate('lms');
    } else if (item.routePage === 'student-service') {
        navigate('student-service');
        if (item.routeData?.ticketId && typeof openStudentServiceTicket === 'function') {
            setTimeout(() => openStudentServiceTicket(String(item.routeData.ticketId)), 0);
        }
    } else if (item.routePage === 'orders') {
        navigate('orders');
        if (item.routeData?.orderId && typeof openRecipientOrder === 'function') {
            setTimeout(() => openRecipientOrder(String(item.routeData.orderId)), 0);
        }
    } else if (item.routePage === 'news') {
        if (item.routeData?.postId && typeof window.stashNewsDeepLinkPostId === 'function') {
            window.stashNewsDeepLinkPostId(item.routeData.postId);
        }
        navigate('news');
    } else if (item.routePage) {
        navigate(item.routePage);
    }
    saveState();
    renderPortalNotificationChrome();
}
function buildPortalNotificationListHtml(items, compact = false) {
    if (!items.length) {
        return '<div class="portal-msg-empty">No notifications yet.</div>';
    }
    return items.map(item => `
        <button type="button" class="portal-msg-card portal-msg-chat-item${item.read ? '' : ' is-active'}" data-notif-action="open-item" data-notification-key="${escapeHtml(item.key)}">
            <div class="portal-msg-avatar-chip">
                <i class="fas ${escapeHtml(item.icon || 'fa-bell')}"></i>
            </div>
            <div class="portal-msg-card-main">
                <div class="portal-msg-card-title-row">
                    <div class="portal-msg-card-title">${escapeHtml(item.title || 'Notification')}</div>
                    <span class="portal-msg-mini-badge${item.read ? '' : ' is-unread'}">${escapeHtml(item.source === 'social' ? 'Social' : 'School')}</span>
                </div>
                <div class="portal-msg-card-sub">${escapeHtml(item.text || '')}</div>
                <div class="portal-msg-time">${escapeHtml(formatLmsDateTime(item.createdAt))}</div>
            </div>
        </button>
    `).join('');
}
function buildPortalNotificationWorkspaceHtml(summary, mode = 'compact') {
    const compact = mode === 'compact';
    const { currentUser, uiState, items, unreadCount } = summary;
    const visibleItems = compact ? items.slice(0, 6) : items;
    return `
        <div class="portal-msg-page-shell">
            <div class="portal-msg-page-top">
                <div>
                    <div class="portal-msg-page-title">Notifications</div>
                    <div class="portal-msg-page-copy">${escapeHtml(getPortalMessengerRoleLabel(currentUser.role))} | ${unreadCount} unread</div>
                </div>
                <div class="portal-msg-filter-row">
                    ${[
                        ['all', 'All'],
                        ['school', 'School'],
                        ['social', 'Social']
                    ].map(([value, label]) => `
                        <button type="button" class="portal-msg-chip${uiState.filter === value ? ' is-active' : ''}" data-notif-action="set-filter" data-filter-value="${value}">${label}</button>
                    `).join('')}
                </div>
            </div>
            <div class="portal-msg-actions">
                <div class="portal-msg-panel-meta">School updates like grades, Student Service replies, timetable changes, and official notices stay together with selected social activity.</div>
                <button type="button" class="lux-secondary-btn portal-msg-inline-btn" data-notif-action="mark-all"><i class="fas fa-check-double"></i> Mark all as read</button>
            </div>
            <div class="portal-msg-list${compact ? ' is-compact' : ''}">
                ${buildPortalNotificationListHtml(visibleItems, compact)}
            </div>
        </div>
    `;
}
if (typeof window !== 'undefined') {
    Object.assign(window, {
        createPortalSystemNotification,
        getPortalNotificationItemsForUser,
        getPortalNotificationUnreadCount,
        markPortalNotificationRead,
        removePortalNotification,
        markAllPortalNotificationsRead,
        setPortalNotificationFilter,
        togglePortalNotificationDock,
        openPortalNotificationFullModal,
        closePortalNotificationFullModal,
        switchPortalNotificationToDock,
        openPortalNotificationItem,
        buildPortalNotificationWorkspaceHtml
    });
}
function getPortalMessengerRoleLabel(role) {
    const labels = {
        [USER_ROLES.STUDENT]: 'Student',
        [USER_ROLES.PROFESSOR]: 'Professor',
        [USER_ROLES.TA]: 'Teaching Assistant',
        [USER_ROLES.ADMIN]: 'Admin',
        [USER_ROLES.STUDENT_SERVICE]: 'Student Service'
    };
    return labels[role] || 'Portal User';
}
function getPortalMessengerUsers() {
    ensureCanonicalState();
    const runtime = ensureKiuRealtimeRuntime();
    return mergeUniqueById([...(KIU_STATE.users || []), ...Object.values(runtime.accountsById || {})])
        .filter(user => Object.values(USER_ROLES).includes(user.role))
        .map(user => ({
            ...user,
            displayName: cleanupEncodingArtifacts(toEnglishText(user.nameEn || user.name || user.email || user.id)),
            facultyCode: normalizeFacultyCode(user.facultyCode || user.faculty || 'ECON', 'ECON'),
            facultyName: getFacultyLabel(normalizeFacultyCode(user.facultyCode || user.faculty || 'ECON', 'ECON')),
            roleLabel: getPortalMessengerRoleLabel(user.role)
        }));
}
function getPortalMessengerUserById(userId) {
    return getPortalMessengerUsers().find(user => String(user.id) === String(userId)) || null;
}
function buildPortalMessengerDirectChatId(a, b) {
    return ['portal-direct', ...[String(a), String(b)].sort()].join('::');
}
function buildPortalMessengerGroupChatId() {
    return `portal-group::${Date.now()}`;
}
function getPortalMessengerDirectChatMembers(chat) {
    if (!chat || typeof chat !== 'object' || String(chat.type || 'direct') === 'group') return null;
    const members = [...new Set((chat.members || []).map(member => String(member)).filter(Boolean))].sort();
    return members.length === 2 ? members : null;
}
function findPortalMessengerDirectChat(a, b) {
    ensurePortalMessengerState();
    const left = String(a || '').trim();
    const right = String(b || '').trim();
    if (!left || !right) return null;
    return Object.values(KIU_STATE.portalMessengerChats || {}).find(chat => {
        const members = getPortalMessengerDirectChatMembers(chat);
        return members && members.includes(left) && members.includes(right);
    }) || null;
}
function scorePortalMessengerDirectChat(chat) {
    if (!chat || typeof chat !== 'object') return 0;
    let score = 0;
    if (!String(chat.id || '').startsWith('portal-direct::')) score += 1000;
    score += (Array.isArray(chat.messages) ? chat.messages.length : 0) * 10;
    const lastStamp = chat.messages?.[chat.messages.length - 1]?.sentAt || chat.updatedAt || chat.createdAt || '';
    score += String(lastStamp).localeCompare('') === 0 ? 0 : 1;
    return score;
}
function dedupePortalMessengerDirectChats(chats, userId) {
    const normalizedUserId = String(userId || '');
    const byPartner = new Map();
    (chats || []).forEach(chat => {
        if (!chat || String(chat.type || '') === 'group') return;
        const partner = (chat.members || []).find(memberId => String(memberId) !== normalizedUserId);
        if (!partner) return;
        const prev = byPartner.get(String(partner));
        if (!prev || scorePortalMessengerDirectChat(chat) > scorePortalMessengerDirectChat(prev)) {
            byPartner.set(String(partner), chat);
        }
    });
    return [...byPartner.values()];
}
function reconcilePortalMessengerDirectChatDuplicates(preferredChat, persist = false) {
    if (!preferredChat?.id) return preferredChat;
    const members = getPortalMessengerDirectChatMembers(preferredChat);
    if (!members) return preferredChat;
    ensurePortalMessengerState();
    const duplicates = Object.values(KIU_STATE.portalMessengerChats || {}).filter(chat => {
        const chatMembers = getPortalMessengerDirectChatMembers(chat);
        return chatMembers && chatMembers[0] === members[0] && chatMembers[1] === members[1];
    });
    if (!duplicates.length) {
        KIU_STATE.portalMessengerChats[preferredChat.id] = normalizePortalMessengerChatRecord({
            ...preferredChat,
            members
        });
        if (persist && typeof saveState === 'function') saveState();
        return KIU_STATE.portalMessengerChats[preferredChat.id];
    }
    let canonical = duplicates.reduce((best, chat) =>
        scorePortalMessengerDirectChat(chat) > scorePortalMessengerDirectChat(best) ? chat : best
    );
    if (scorePortalMessengerDirectChat(preferredChat) > scorePortalMessengerDirectChat(canonical)) {
        canonical = { ...canonical, ...preferredChat, id: preferredChat.id };
    }
    const mergedMessages = typeof mergeMessagesById === 'function'
        ? mergeMessagesById(...duplicates.map(chat => chat.messages || []), preferredChat.messages || [])
        : [...(canonical.messages || []), ...(preferredChat.messages || [])];
    const canonicalId = String(canonical.id || preferredChat.id);
    KIU_STATE.portalMessengerChats[canonicalId] = normalizePortalMessengerChatRecord({
        ...canonical,
        ...preferredChat,
        id: canonicalId,
        type: 'direct',
        members,
        messages: mergedMessages
    });
    duplicates.forEach(chat => {
        if (String(chat.id) !== canonicalId) delete KIU_STATE.portalMessengerChats[chat.id];
    });
    if (window.__lmsInteractionUi?.activeChatId) {
        const staleId = String(window.__lmsInteractionUi.activeChatId);
        if (duplicates.some(chat => String(chat.id) === staleId) && staleId !== canonicalId) {
            window.__lmsInteractionUi.activeChatId = canonicalId;
        }
    }
    if (persist && typeof saveState === 'function') saveState();
    return KIU_STATE.portalMessengerChats[canonicalId];
}
function syncPortalMessengerDirectChatFromServer(left, right) {
    return kiuRealtimeFetch('/api/messenger/direct', {
        method: 'POST',
        body: {
            userA: String(left),
            userB: String(right)
        }
    }).then(payload => {
        if (!payload?.chat) return null;
        const merged = reconcilePortalMessengerDirectChatDuplicates(payload.chat, true);
        if (typeof renderPortalMessengerWorkspace === 'function') renderPortalMessengerWorkspace();
        if (typeof refreshLmsInteractionMessagesIfActive === 'function') refreshLmsInteractionMessagesIfActive();
        return merged;
    }).catch(() => null);
}
function ensurePortalMessengerDirectChat(a, b) {
    ensurePortalMessengerState();
    const left = String(a);
    const right = String(b);
    const existing = findPortalMessengerDirectChat(left, right);
    if (existing) {
        syncPortalMessengerDirectChatFromServer(left, right);
        return reconcilePortalMessengerDirectChatDuplicates(existing, false);
    }
    const chatId = buildPortalMessengerDirectChatId(left, right);
    const aUser = getPortalMessengerUserById(left);
    const bUser = getPortalMessengerUserById(right);
    KIU_STATE.portalMessengerChats[chatId] = normalizePortalMessengerChatRecord({
        id: chatId,
        type: 'direct',
        members: [left, right],
        name: `${aUser?.displayName || left} & ${bUser?.displayName || right}`,
        createdBy: left,
        createdAt: new Date().toISOString(),
        messages: [],
        requestStateByUser: {}
    });
    syncPortalMessengerDirectChatFromServer(left, right);
    return KIU_STATE.portalMessengerChats[chatId] || findPortalMessengerDirectChat(left, right);
}
function getPortalMessengerChatsForUser(userId) {
    ensurePortalMessengerState();
    const favorites = new Set(getPortalMessengerFavoriteIds(userId));
    const pinned = new Set(getPortalMessengerPinnedChatIds(userId));
    const hidden = new Set(getPortalMessengerHiddenChatIds(userId).map(String));
    return Object.values(KIU_STATE.portalMessengerChats)
        .filter(chat => Array.isArray(chat.members) && chat.members.includes(String(userId)) && !hidden.has(String(chat.id)))
        .sort((a, b) => {
            const aPinned = pinned.has(String(a.id)) ? 1 : 0;
            const bPinned = pinned.has(String(b.id)) ? 1 : 0;
            if (aPinned !== bPinned) return bPinned - aPinned;
            const aFav = favorites.has(String(a.id)) ? 1 : 0;
            const bFav = favorites.has(String(b.id)) ? 1 : 0;
            if (aFav !== bFav) return bFav - aFav;
            const aLast = a.messages?.[a.messages.length - 1]?.sentAt || a.createdAt || '';
            const bLast = b.messages?.[b.messages.length - 1]?.sentAt || b.createdAt || '';
            return String(bLast).localeCompare(String(aLast));
        });
}
function splitPortalMessengerChats(chats) {
    return {
        groupChats: (chats || []).filter(chat => chat.type === 'group'),
        privateChats: (chats || []).filter(chat => chat.type !== 'group')
    };
}
function getPortalMessengerDisplayNameForChat(chat, currentUserId) {
    if (!chat) return 'Conversation';
    if (chat.type === 'group') return chat.name || 'Group chat';
    const otherId = (chat.members || []).find(memberId => String(memberId) !== String(currentUserId));
    return getPortalMessengerUserById(otherId)?.displayName || chat.name || 'Direct chat';
}
function getPortalMessengerMessagePreview(chat) {
    const last = chat?.messages?.[chat.messages.length - 1];
    if (!last) return 'No messages yet';
    if (last.text) return last.text.length > 54 ? `${last.text.slice(0, 54)}...` : last.text;
    if (typeof isPortalMessengerImageFile === 'function' && isPortalMessengerImageFile(last.file)) {
        return `Shared photo: ${last.file.name || 'image'}`;
    }
    if (last.file?.type?.startsWith('video/')) return `Shared video: ${last.file.name}`;
    if (last.file?.name) return `Shared file: ${last.file.name}`;
    return 'New activity';
}
function getPortalMessengerFavoriteIds(userId) {
    ensurePortalMessengerState();
    if (!Array.isArray(KIU_STATE.portalMessengerFavorites[String(userId)])) {
        KIU_STATE.portalMessengerFavorites[String(userId)] = [];
    }
    return KIU_STATE.portalMessengerFavorites[String(userId)];
}
function getPortalMessengerPinnedChatIds(userId) {
    ensurePortalMessengerState();
    if (!Array.isArray(KIU_STATE.portalMessengerPinnedChats[String(userId)])) {
        KIU_STATE.portalMessengerPinnedChats[String(userId)] = [];
    }
    return KIU_STATE.portalMessengerPinnedChats[String(userId)];
}
function getPortalMessengerHiddenChatIds(userId) {
    ensurePortalMessengerState();
    if (!Array.isArray(KIU_STATE.portalMessengerHiddenChats[String(userId)])) {
        KIU_STATE.portalMessengerHiddenChats[String(userId)] = [];
    }
    return KIU_STATE.portalMessengerHiddenChats[String(userId)];
}
function unhidePortalMessengerChatForUser(chatId, userId) {
    const normalizedChatId = String(chatId);
    KIU_STATE.portalMessengerHiddenChats[String(userId)] = getPortalMessengerHiddenChatIds(userId)
        .filter(id => String(id) !== normalizedChatId);
}
function isPortalMessengerFavorite(chatId, userId) {
    return getPortalMessengerFavoriteIds(userId).includes(String(chatId));
}
function isPortalMessengerPinned(chatId, userId) {
    return getPortalMessengerPinnedChatIds(userId).includes(String(chatId));
}
function togglePortalMessengerFavorite(chatId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const favorites = getPortalMessengerFavoriteIds(currentUser.id);
    const normalizedChatId = String(chatId);
    const index = favorites.indexOf(normalizedChatId);
    if (index >= 0) {
        favorites.splice(index, 1);
    } else {
        favorites.unshift(normalizedChatId);
    }
    saveState();
    renderPortalMessengerWorkspace();
}
function togglePortalMessengerPin(chatId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const pins = getPortalMessengerPinnedChatIds(currentUser.id);
    const normalizedChatId = String(chatId);
    const index = pins.indexOf(normalizedChatId);
    if (index >= 0) {
        pins.splice(index, 1);
    } else {
        pins.unshift(normalizedChatId);
    }
    saveState();
    renderPortalMessengerWorkspace();
}
function markPortalMessengerChatSeen(chatId, userId) {
    const chat = KIU_STATE.portalMessengerChats?.[String(chatId)];
    if (!chat || !userId) return;
    let changed = false;
    chat.messages = (chat.messages || []).map(message => {
        const normalized = normalizePortalMessengerMessageRecord(message);
        if (String(normalized.senderId) === String(userId)) return normalized;
        if (!normalized.seenBy.includes(String(userId))) {
            normalized.seenBy = [...normalized.seenBy, String(userId)];
            normalized.seenAtByUser[String(userId)] = new Date().toISOString();
            changed = true;
        }
        return normalized;
    });
    if (changed) saveState();
}
function getPortalMessengerUnreadCount(chat, userId) {
    return (chat?.messages || []).filter(message => String(message.senderId) !== String(userId) && !normalizePortalMessengerMessageRecord(message).seenBy.includes(String(userId))).length;
}
function isPortalMessengerRequestPendingForUser(chat, userId) {
    return String(chat?.requestStateByUser?.[String(userId)] || '') === 'pending';
}
function respondToPortalMessengerRequest(chatId, accept) {
    const currentUser = getCurrentUser();
    const chat = KIU_STATE.portalMessengerChats?.[String(chatId)];
    if (!currentUser || !chat) return;
    chat.requestStateByUser = chat.requestStateByUser || {};
    if (accept) {
        chat.requestStateByUser[String(currentUser.id)] = 'accepted';
        saveState();
        renderPortalMessengerWorkspace();
        return;
    }
    delete KIU_STATE.portalMessengerChats[String(chatId)];
    saveState();
    renderPortalMessengerWorkspace();
}
function removePortalMessengerChat(chatId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const normalizedChatId = String(chatId);
    const chat = KIU_STATE.portalMessengerChats?.[normalizedChatId];
    if (!chat) return;
    if (!confirm('Remove this chat from your list only?')) return;
    const hidden = getPortalMessengerHiddenChatIds(currentUser.id);
    if (!hidden.includes(normalizedChatId)) hidden.unshift(normalizedChatId);
    KIU_STATE.portalMessengerFavorites[String(currentUser.id)] = getPortalMessengerFavoriteIds(currentUser.id)
        .filter(id => String(id) !== normalizedChatId);
    const uiState = ensurePortalMessengerUiState();
    if (String(uiState.activeChatId || '') === normalizedChatId) {
        uiState.activeChatId = null;
        if (uiState.compactTab === 'thread') uiState.compactTab = 'chats';
    }
    clearPortalMessengerDraftFile(normalizedChatId);
    saveState();
    renderPortalMessengerWorkspace();
}
function deletePortalMessengerConversation(chatId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const normalizedChatId = String(chatId);
    const chat = KIU_STATE.portalMessengerChats?.[normalizedChatId];
    if (!chat) return;
    if (!confirm('Delete this whole conversation and all messages for everyone?')) return;
    delete KIU_STATE.portalMessengerChats[normalizedChatId];
    Object.keys(KIU_STATE.portalMessengerFavorites || {}).forEach(userId => {
        KIU_STATE.portalMessengerFavorites[userId] = (KIU_STATE.portalMessengerFavorites[userId] || [])
            .filter(id => String(id) !== normalizedChatId);
    });
    Object.keys(KIU_STATE.portalMessengerHiddenChats || {}).forEach(userId => {
        KIU_STATE.portalMessengerHiddenChats[userId] = (KIU_STATE.portalMessengerHiddenChats[userId] || [])
            .filter(id => String(id) !== normalizedChatId);
    });
    if (KIU_STATE.portalMessengerCalls?.[normalizedChatId]) {
        delete KIU_STATE.portalMessengerCalls[normalizedChatId];
    }
    const uiState = ensurePortalMessengerUiState();
    if (String(uiState.activeChatId || '') === normalizedChatId) {
        uiState.activeChatId = null;
        if (uiState.compactTab === 'thread') uiState.compactTab = 'chats';
    }
    if (String(uiState.activeCallChatId || '') === normalizedChatId) {
        uiState.callOpen = false;
        uiState.activeCallChatId = null;
    }
    clearPortalMessengerDraftFile(normalizedChatId);
    saveState();
    renderPortalMessengerWorkspace();
}
function removePortalMessengerMessage(chatId, messageId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const chat = KIU_STATE.portalMessengerChats?.[String(chatId)];
    if (!chat) return;
    if (!confirm('Remove this message for both sides?')) return;
    chat.messages = (chat.messages || []).filter(message => String(message.id) !== String(messageId));
    saveState();
    renderPortalMessengerWorkspace();
}
function getPortalMessengerRelationshipLabel(chat, currentUserId) {
    if (chat?.type === 'group') return 'Group chat';
    const firstSenderId = chat?.messages?.[0]?.senderId || chat?.createdBy || '';
    return String(firstSenderId) === String(currentUserId) ? 'You messaged' : 'Messaged you';
}
function ensurePortalCallRuntime() {
    window.__portalCallRuntime = window.__portalCallRuntime || {
        stream: null,
        remoteStream: null,
        peerConnection: null,
        peerChatId: null,
        peerRemoteUserId: null,
        pendingIceCandidates: [],
        pressedKeys: new Set(),
        pushTalking: false,
        captureShortcut: false,
        currentSignalRole: '',
        isClosing: false
    };
    return window.__portalCallRuntime;
}
function ensurePortalMessengerUiState() {
    window.__portalMessengerUi = window.__portalMessengerUi || {
        activeChatId: null,
        search: '',
        roleFilter: 'all',
        chatSection: 'private',
        dockOpen: false,
        fullOpen: false,
        compactTab: 'chats',
        compactSearch: '',
        callOpen: false,
        activeCallChatId: null,
        activeCallRemoteUserId: null,
        callMode: 'idle',
        callStatusText: '',
        callMicEnabled: true,
        callCameraEnabled: true,
        callPushToTalkEnabled: false,
        callPttMode: 'keyboard',
        callPttShortcut: 'Ctrl+Shift+Space',
        callPttMouseButton: 'button4',
        groupComposerOpen: false,
        groupComposerName: '',
        groupComposerSearch: '',
        groupComposerMembers: []
    };
    return window.__portalMessengerUi;
}
function markPortalCallUiState(mode = 'idle', statusText = '') {
    const uiState = ensurePortalMessengerUiState();
    uiState.callMode = mode;
    uiState.callStatusText = statusText || '';
    return uiState;
}
function getPortalMessengerPeerUserId(chatId) {
    const currentUserId = getCurrentUserId();
    const chat = KIU_STATE.portalMessengerChats?.[String(chatId)];
    if (!chat || chat.type === 'group') return null;
    return String((chat.members || []).find(memberId => String(memberId) !== String(currentUserId)) || '');
}
function stopPortalCallRemoteMedia() {
    const runtime = ensurePortalCallRuntime();
    if (runtime.remoteStream) {
        runtime.remoteStream.getTracks().forEach(track => {
            try { track.stop(); } catch (error) {}
        });
    }
    runtime.remoteStream = null;
}
function attachPortalCallRemotePreview() {
    const runtime = ensurePortalCallRuntime();
    const video = document.getElementById('portal-call-remote-video');
    if (!video) return;
    video.srcObject = runtime.remoteStream || null;
    const playPromise = video.play?.();
    if (playPromise?.catch) playPromise.catch(() => {});
}
function teardownPortalPeerConnection() {
    const runtime = ensurePortalCallRuntime();
    if (runtime.peerConnection) {
        try { runtime.peerConnection.onicecandidate = null; } catch (error) {}
        try { runtime.peerConnection.ontrack = null; } catch (error) {}
        try { runtime.peerConnection.onconnectionstatechange = null; } catch (error) {}
        try { runtime.peerConnection.close(); } catch (error) {}
    }
    runtime.peerConnection = null;
    runtime.peerChatId = null;
    runtime.peerRemoteUserId = null;
    runtime.pendingIceCandidates = [];
    stopPortalCallRemoteMedia();
}
async function flushPortalPendingIceCandidates() {
    const runtime = ensurePortalCallRuntime();
    const peerConnection = runtime.peerConnection;
    if (!peerConnection || !runtime.pendingIceCandidates.length) return;
    const queued = [...runtime.pendingIceCandidates];
    runtime.pendingIceCandidates = [];
    for (const candidate of queued) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.warn('Could not add queued ICE candidate:', error);
        }
    }
}
function buildPortalRtcConfiguration() {
    const runtimeRtc = typeof getPortalRtcConfiguration === 'function' ? getPortalRtcConfiguration() : null;
    if (runtimeRtc?.iceServers?.length) {
        return {
            iceServers: runtimeRtc.iceServers
        };
    }
    return {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };
}
async function relayPortalCallSignal(chatId, toUserId, signalType, payload) {
    const fromUserId = getCurrentUserId();
    if (!chatId || !toUserId || !fromUserId) return false;
    try {
        await kiuRealtimeFetch('/api/calls/signal', {
            method: 'POST',
            body: {
                chatId: String(chatId),
                fromUserId: String(fromUserId),
                toUserId: String(toUserId),
                signalType,
                payload
            }
        });
        return true;
    } catch (error) {
        console.warn('Portal call signal relay failed:', error);
        return false;
    }
}
async function ensurePortalPeerConnection(chatId, remoteUserId) {
    const runtime = ensurePortalCallRuntime();
    if (runtime.peerConnection && runtime.peerChatId === String(chatId) && runtime.peerRemoteUserId === String(remoteUserId)) {
        return runtime.peerConnection;
    }
    teardownPortalPeerConnection();
    const peerConnection = new RTCPeerConnection(buildPortalRtcConfiguration());
    runtime.peerConnection = peerConnection;
    runtime.peerChatId = String(chatId);
    runtime.peerRemoteUserId = String(remoteUserId);
    runtime.pendingIceCandidates = [];
    const stream = await ensurePortalCallMedia();
    if (stream) {
        stream.getTracks().forEach(track => {
            if (!peerConnection.getSenders().some(sender => sender.track === track)) {
                peerConnection.addTrack(track, stream);
            }
        });
    }
    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            relayPortalCallSignal(chatId, remoteUserId, 'ice', event.candidate.toJSON ? event.candidate.toJSON() : event.candidate);
        }
    };
    peerConnection.ontrack = event => {
        const [remoteStream] = event.streams || [];
        if (remoteStream) {
            runtime.remoteStream = remoteStream;
            attachPortalCallRemotePreview();
            markPortalCallUiState('active', 'Connected');
            renderPortalMessengerWorkspace();
        }
    };
    peerConnection.onconnectionstatechange = () => {
        const state = String(peerConnection.connectionState || '');
        if (state === 'connected') {
            markPortalCallUiState('active', 'Connected');
        } else if (state === 'connecting') {
            markPortalCallUiState('connecting', 'Connecting...');
        } else if (['failed', 'disconnected', 'closed'].includes(state)) {
            markPortalCallUiState('ended', 'Call ended');
        }
        renderPortalMessengerWorkspace();
    };
    return peerConnection;
}
async function beginPortalOutgoingWebRtcCall(chatId, remoteUserId) {
    if (!chatId || !remoteUserId) return;
    const peerConnection = await ensurePortalPeerConnection(chatId, remoteUserId);
    markPortalCallUiState('connecting', 'Connecting...');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    await relayPortalCallSignal(chatId, remoteUserId, 'offer', {
        type: offer.type,
        sdp: offer.sdp
    });
    renderPortalMessengerWorkspace();
}
async function acceptPortalMessengerCall() {
    const uiState = ensurePortalMessengerUiState();
    const chatId = String(uiState.activeCallChatId || '');
    const remoteUserId = String(uiState.activeCallRemoteUserId || '');
    if (!chatId || !remoteUserId) return;
    markPortalCallUiState('connecting', 'Connecting...');
    await ensurePortalCallMedia();
    await kiuRealtimeFetch('/api/calls/accept', {
        method: 'POST',
        body: {
            chatId,
            fromUserId: String(getCurrentUserId() || ''),
            toUserId: remoteUserId
        }
    }).catch(() => {});
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('calls', 'call-accepted', 'call', chatId, {
            afterState: {
                chatId,
                acceptedBy: String(getCurrentUserId() || ''),
                remoteUserId
            }
        });
    }
    renderPortalMessengerWorkspace();
}
async function declinePortalMessengerCall() {
    const uiState = ensurePortalMessengerUiState();
    const chatId = String(uiState.activeCallChatId || '');
    const remoteUserId = String(uiState.activeCallRemoteUserId || '');
    if (chatId && remoteUserId) {
        await kiuRealtimeFetch('/api/calls/decline', {
            method: 'POST',
            body: {
                chatId,
                fromUserId: String(getCurrentUserId() || ''),
                toUserId: remoteUserId
            }
        }).catch(() => {});
        if (typeof recordPortalAudit === 'function') {
            recordPortalAudit('calls', 'call-declined', 'call', chatId, {
                afterState: {
                    chatId,
                    declinedBy: String(getCurrentUserId() || ''),
                    remoteUserId
                }
            });
        }
    }
    finalizePortalMessengerCall(false);
}
function finalizePortalMessengerCall(notifyServer = true) {
    const uiState = ensurePortalMessengerUiState();
    const chatId = String(uiState.activeCallChatId || '');
    if (notifyServer && chatId) {
        kiuRealtimeFetch('/api/calls/end', {
            method: 'POST',
            body: {
                chatId,
                fromUserId: String(getCurrentUserId() || '')
            }
        }).catch(() => {});
    }
    uiState.callOpen = false;
    uiState.activeCallChatId = null;
    uiState.activeCallRemoteUserId = null;
    markPortalCallUiState('idle', '');
    ensurePortalCallRuntime().captureShortcut = false;
    teardownPortalPeerConnection();
    stopPortalCallMedia();
    saveState();
    if (chatId && typeof recordPortalAudit === 'function') {
        recordPortalAudit('calls', 'call-ended', 'call', chatId, {
            afterState: {
                chatId,
                endedBy: String(getCurrentUserId() || ''),
                notifyServer: Boolean(notifyServer)
            }
        });
    }
    if (typeof renderPortalMessengerWorkspace === 'function') renderPortalMessengerWorkspace();
}
async function handlePortalCallSignalMessage(signal) {
    if (!signal || typeof signal !== 'object') return;
    const chatId = String(signal.chatId || '');
    const fromUserId = String(signal.fromUserId || '');
    const signalType = String(signal.signalType || '');
    if (!chatId || !fromUserId || !signalType) return;
    const uiState = ensurePortalMessengerUiState();
    uiState.activeCallChatId = chatId;
    uiState.activeCallRemoteUserId = fromUserId;
    uiState.callOpen = true;
    uiState.fullOpen = true;
    if (signalType === 'offer') {
        await ensurePortalCallMedia();
        const peerConnection = await ensurePortalPeerConnection(chatId, fromUserId);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload));
        await flushPortalPendingIceCandidates();
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await relayPortalCallSignal(chatId, fromUserId, 'answer', {
            type: answer.type,
            sdp: answer.sdp
        });
        markPortalCallUiState('connecting', 'Connecting...');
        renderPortalMessengerWorkspace();
        return;
    }
    const peerConnection = await ensurePortalPeerConnection(chatId, fromUserId);
    if (signalType === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload));
        await flushPortalPendingIceCandidates();
        markPortalCallUiState('connecting', 'Connecting...');
    } else if (signalType === 'ice' && signal.payload) {
        if (!peerConnection.remoteDescription) {
            ensurePortalCallRuntime().pendingIceCandidates.push(signal.payload);
        } else {
            try {
                await peerConnection.addIceCandidate(new RTCIceCandidate(signal.payload));
            } catch (error) {
                console.warn('Could not add ICE candidate:', error);
            }
        }
    }
    renderPortalMessengerWorkspace();
}
function ensurePortalMessengerFileInput() {
    let input = document.getElementById('portal-messenger-file-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'portal-messenger-file-input';
        input.hidden = true;
        document.body.appendChild(input);
    }
    return input;
}
function setPortalMessengerDraftFile(chatId, file) {
    const reader = new FileReader();
    reader.onload = () => {
        window.__portalMessengerDraftFiles = window.__portalMessengerDraftFiles || {};
        window.__portalMessengerDraftFiles[chatId] = {
            id: `portal_msg_file_${Date.now()}`,
            name: file.name,
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
            dataUrl: reader.result
        };
        renderPortalMessengerWorkspace();
    };
    reader.readAsDataURL(file);
}
function getPortalMessengerDraftFile(chatId) {
    return window.__portalMessengerDraftFiles?.[chatId] || null;
}
function clearPortalMessengerDraftFile(chatId) {
    if (window.__portalMessengerDraftFiles) delete window.__portalMessengerDraftFiles[chatId];
}
function pickPortalMessengerFile(chatId) {
    const input = ensurePortalMessengerFileInput();
    input.value = '';
    input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) return;
        setPortalMessengerDraftFile(chatId, file);
    };
    input.click();
}
function handlePortalMessengerDragOver(event) {
    event.preventDefault();
}
function handlePortalMessengerDrop(event, chatId) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    setPortalMessengerDraftFile(chatId, file);
}
function setPortalMessengerSearch(value) {
    ensurePortalMessengerUiState().search = value || '';
    renderPortalMessengerWorkspace();
}
function setPortalMessengerRoleFilter(value) {
    ensurePortalMessengerUiState().roleFilter = value || 'all';
    renderPortalMessengerWorkspace();
}
function setPortalMessengerChatSection(value) {
    ensurePortalMessengerUiState().chatSection = value === 'group' ? 'group' : 'private';
    renderPortalMessengerWorkspace();
}
function openPortalMessengerChat(chatId) {
    ensurePortalMessengerUiState().activeChatId = chatId;
    renderPortalMessengerWorkspace();
}
function openPortalDirectChat(userId) {
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const chat = ensurePortalMessengerDirectChat(String(currentUser.id), String(userId));
    openPortalMessengerChat(chat.id);
}
