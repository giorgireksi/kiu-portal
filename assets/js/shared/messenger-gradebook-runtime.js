/* Peeled from assets/js/shared/messenger.js. Load before host. */
(function () {
    if (window.__KIU_MESSENGER_GRADEBOOK_LOADED) return;
    window.__KIU_MESSENGER_GRADEBOOK_LOADED = true;

    // Registration and timetable load this roster bridge without the full gradebook
    // model. Keep the bridge usable there while delegating to the richer model
    // normalizer whenever that model is present.
    function ensureGradeRecordHistories(record = {}) {
        const modelNormalizer = window.ensureGradeRecordHistories;
        if (typeof modelNormalizer === 'function' && modelNormalizer !== ensureGradeRecordHistories) {
            return modelNormalizer(record);
        }
        const safeRecord = { ...(record || {}) };
        safeRecord.assessments = safeRecord.assessments && typeof safeRecord.assessments === 'object'
            ? safeRecord.assessments
            : {};
        return safeRecord;
    }

    window.__kiuCreateMessengerGradebookApi = function createKiuMessengerGradebookApi(deps = {}) {
        const d = deps;
        void d;
function normalizeGradebookRosterKey(value) {
    return normalizeIdentifier(value);
}
function resolveStudentScheduleEntries(schedule) {
    if (typeof normalizeStudentScheduleValue === 'function') {
        return normalizeStudentScheduleValue(schedule);
    }
    if (Array.isArray(schedule)) return schedule.filter(Boolean);
    if (schedule && typeof schedule === 'object') {
        if (Array.isArray(schedule.entries)) return schedule.entries.filter(Boolean);
        return Object.entries(schedule)
            .filter(([, value]) => value != null && value !== '')
            .map(([key, value]) => {
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    const hasEntryShape = Boolean(
                        value.courseId
                        || value.sourceCourseId
                        || value.groupName
                        || value.day
                        || value.time
                    );
                    if (hasEntryShape) {
                        return {
                            ...value,
                            courseId: value.courseId || value.sourceCourseId || (/^\d+$/.test(String(key)) ? '' : key),
                            groupId: typeof value.groupId === 'string' || typeof value.groupId === 'number'
                                ? value.groupId
                                : (value.groupName || '')
                        };
                    }
                }
                return { courseId: key, groupId: value };
            })
            .filter((entry) => {
                const courseId = String(entry?.courseId || '').trim();
                if (!courseId) return false;
                if (entry?.groupId != null && typeof entry.groupId === 'object') return false;
                const groupId = String(entry?.groupId ?? '').trim();
                if (!groupId && /^\d+$/.test(courseId)) return false;
                return Boolean(courseId || groupId);
            });
    }
    return [];
}
function getEnrolledStudentsForGroup(courseId, groupId) {
    const domain = getDomain();
    const students = [];
    const seen = new Set();
    const normalizedCourseId = canonicalCourseKey(courseId);
    const normalizedGroupId = canonicalCourseKey(groupId);
    const targetGroup = (typeof getAvailableGroupsForSubject === 'function' ? getAvailableGroupsForSubject(courseId) : (KIU_STATE.availableGroups?.[courseId] || []))
        .find(group => canonicalCourseKey(group?.id || group?.groupId || group?.name || '') === normalizedGroupId);
    const targetFaculty = normalizeFacultyCode(targetGroup?.faculty || (typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(courseId) : '') || '', '');
    const rosterProjection = KIU_STATE.lmsGroupRosterStudentIds && typeof KIU_STATE.lmsGroupRosterStudentIds === 'object'
        ? (KIU_STATE.lmsGroupRosterStudentIds[`${courseId}::${groupId}`]
            || KIU_STATE.lmsGroupRosterStudentIds[`${normalizedCourseId}::${normalizedGroupId}`]
            || [])
        : [];
    if (Array.isArray(rosterProjection) && rosterProjection.length) {
        rosterProjection.forEach((studentId) => {
            if (seen.has(studentId)) return;
            const student = domain.usersById?.[studentId]
                || (typeof getAllStudents === 'function' ? getAllStudents(targetFaculty || 'all').find(item => item.id === studentId) : null)
                || KIU_STATE.studentAdminProfiles?.[studentId]
                || null;
            students.push({ id: studentId, name: student?.name || student?.nameEn || `Student ${studentId}` });
            seen.add(studentId);
        });
        return students.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    }
    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
        const scheduleEntries = resolveStudentScheduleEntries(schedule);
        const isEnrolled = scheduleEntries.some(item => (
            canonicalCourseKey(item?.courseId || item?.sourceCourseId || '') === normalizedCourseId
            && canonicalCourseKey(item?.groupId || item?.groupName || '') === normalizedGroupId
            && (!targetFaculty || normalizeFacultyCode(item?.faculty || targetFaculty, targetFaculty) === targetFaculty)
        ));
        if (!isEnrolled || seen.has(studentId)) return;
        const student = domain.usersById?.[studentId] || getAllStudents(targetFaculty || 'all').find(item => item.id === studentId);
        const studentFaculty = normalizeFacultyCode(student?.facultyCode || student?.faculty || '', '');
        if (targetFaculty && studentFaculty && studentFaculty !== targetFaculty) return;
        students.push({
            id: studentId,
            name: student?.name || student?.nameEn || `Student ${studentId}`
        });
        seen.add(studentId);
    });
    return students.sort((a, b) => String(a.name).localeCompare(String(b.name)));
}
function normalizePersonNameKey(value) {
    return cleanupEncodingArtifacts(toEnglishText(String(value || '')))
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}
function getUserNameVariants(user) {
    const variants = new Set();
    [user?.name, user?.nameEn, getUiDisplayName?.()].forEach(value => {
        const key = normalizePersonNameKey(value);
        if (key) variants.add(key);
    });
    return variants;
}
function syncAvailableGroupEnrollmentCounts() {
    Object.entries(KIU_STATE.availableGroups || {}).forEach(([courseId, groups]) => {
        (groups || []).forEach(group => {
            group.registered = getEnrolledStudentsForGroup(courseId, group.id).length;
        });
    });
}
function resolveGradebookRosterKey(courseId, groupId, enrolledStudents = []) {
    const keys = Object.keys(KIU_STATE.studentGrades || {});
    const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
    const rawCourseId = String(courseId || '').trim();
    const rawGroupId = String(groupId || '').trim();
    const groupNorm = normalizeIdentifier(groupId);
    const courseNorm = normalizeIdentifier(courseId);
    const subjectCodeNorm = normalizeIdentifier(subject?.code || '');
    const firstSegmentNorm = normalizeIdentifier(String(courseId || '').split('-')[0]);
    const exactCandidates = [
        `${rawCourseId}::${rawGroupId}`,
        `${courseNorm}::${groupNorm}`,
        `${subjectCodeNorm}::${groupNorm}`,
        `${firstSegmentNorm}::${groupNorm}`,
        `${rawCourseId}_${rawGroupId}`.toLowerCase(),
        `${courseNorm}_${groupNorm}`,
        `${subjectCodeNorm}_${groupNorm}`,
        `${firstSegmentNorm}_${groupNorm}`,
        rawCourseId,
        subject?.code || '',
        courseNorm,
        subjectCodeNorm,
        firstSegmentNorm
    ].filter(Boolean);
    const normalizedKeyMap = new Map();
    keys.forEach(key => {
        const normalizedKey = normalizeGradebookRosterKey(key);
        if (normalizedKey && !normalizedKeyMap.has(normalizedKey)) {
            normalizedKeyMap.set(normalizedKey, key);
        }
    });
    for (const candidate of exactCandidates) {
        const resolvedKey = normalizedKeyMap.get(normalizeGradebookRosterKey(candidate));
        if (resolvedKey) return resolvedKey;
    }
    const enrolledIds = new Set((enrolledStudents || []).map(student => String(student?.id || '').trim()).filter(Boolean));
    let bestKey = null;
    let bestScore = -1;
    let bestRosterSize = -1;
    keys.forEach(key => {
        const roster = Array.isArray(KIU_STATE.studentGrades[key]) ? KIU_STATE.studentGrades[key] : [];
        const normalizedKey = normalizeGradebookRosterKey(key);
        let score = roster.length > 0 ? 1 : 0;
        if (groupNorm && normalizedKey.endsWith(groupNorm)) score += 2;
        if (courseNorm && normalizedKey === courseNorm) score += 4;
        if (subjectCodeNorm && normalizedKey === subjectCodeNorm) score += 4;
        if (firstSegmentNorm && normalizedKey === firstSegmentNorm) score += 2;
        if (courseNorm && groupNorm && normalizedKey === `${courseNorm}${groupNorm}`) score += 8;
        if (subjectCodeNorm && groupNorm && normalizedKey === `${subjectCodeNorm}${groupNorm}`) score += 8;
        if (firstSegmentNorm && groupNorm && normalizedKey === `${firstSegmentNorm}${groupNorm}`) score += 8;
        roster.forEach(student => {
            if (enrolledIds.has(String(student?.id || '').trim())) score += 4;
        });
        if (score > bestScore || (score === bestScore && roster.length > bestRosterSize)) {
            bestScore = score;
            bestRosterSize = roster.length;
            bestKey = key;
        }
    });
    return bestKey || exactCandidates[0] || `${courseNorm || 'course'}_${groupNorm || 'group'}`;
}
function buildGradebookStudents(courseId, groupId) {
    const enrolledStudents = getEnrolledStudentsForGroup(courseId, groupId);
    const rosterKey = resolveGradebookRosterKey(courseId, groupId, enrolledStudents);
    const existingRoster = JSON.parse(JSON.stringify(KIU_STATE.studentGrades?.[rosterKey] || []))
        .map(student => ensureGradeRecordHistories(student));
    if (!enrolledStudents.length) {
        return {
            rosterKey,
            students: existingRoster
        };
    }
    const mergedStudents = enrolledStudents.map(student => {
        const existing = existingRoster.find(entry => entry.id === student.id) || {};
        return ensureGradeRecordHistories({
            id: student.id,
            name: existing.name || student.name,
            q1: existing.q1 || 0,
            qa: existing.qa || 0,
            mid: existing.mid || 0,
            final: existing.final || 0,
            assessments: existing.assessments || {}
        });
    });
    return {
        rosterKey,
        students: mergedStudents
    };
}

function normalizeTeachingScopeKey(value = '') {
    return normalizeGradebookRosterKey(value);
}

function isPortalCurriculumStaffForTeachingGroup(courseId = '', groupId = '', userId = '', role = '') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || ![USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(normalizedRole)) return false;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const facultyCode = String(
        user?.facultyCode
        || user?.faculty
        || (typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '')
        || ''
    ).trim().toUpperCase();
    const profile = KIU_STATE?.facultyProfiles?.[facultyCode];
    if (!profile || typeof profile !== 'object') return false;
    const roster = normalizedRole === USER_ROLES.PROFESSOR
        ? (Array.isArray(profile.professors) ? profile.professors : [])
        : (Array.isArray(profile.tas) ? profile.tas : []);
    if (!roster.some(member => String(member?.id || '').trim() === normalizedUserId)) return false;
    const targetCourse = normalizeTeachingScopeKey(courseId);
    const curriculum = typeof getActiveCurriculum === 'function'
        ? getActiveCurriculum(facultyCode)
        : profile.curriculum;
    const inCurriculum = (Array.isArray(curriculum) ? curriculum : []).some(subject =>
        normalizeTeachingScopeKey(subject?.id || subject?.subjectId || subject?.courseId || '') === targetCourse
    );
    if (!inCurriculum) return false;
    if (!groupId) return true;
    const targetGroup = normalizeTeachingScopeKey(groupId);
    const groups = KIU_STATE?.availableGroups?.[courseId] || [];
    return groups.some(group => normalizeTeachingScopeKey(group?.id || group?.name || '') === targetGroup);
}

function isUserNameAssignedToTeachingGroup(user = {}, group = {}) {
    const identityKeys = typeof getUserNameVariants === 'function'
        ? getUserNameVariants(user)
        : (() => {
            const fallback = new Set();
            [user?.name, user?.nameEn, user?.email].forEach(value => {
                const key = normalizePersonNameKey(value);
                if (key) fallback.add(key);
            });
            return fallback;
        })();
    const profKey = normalizePersonNameKey(group?.prof);
    const taKey = normalizePersonNameKey(group?.ta);
    return identityKeys.has(profKey) || identityKeys.has(taKey);
}

function isUserAssignedToTeachingGroup(user = {}, group = {}, courseId = '') {
    if (!user || !group) return false;
    if (isUserNameAssignedToTeachingGroup(user, group)) return true;
    const groupId = group?.id || group?.groupId || group?.name || '';
    return isPortalCurriculumStaffForTeachingGroup(courseId, groupId, user?.id, user?.role);
}

function syncGradebookRosterFromEnrollment(courseId, groupId, state = KIU_STATE) {
    const targetState = state && typeof state === 'object' ? state : KIU_STATE;
    if (!targetState.studentGrades || typeof targetState.studentGrades !== 'object') {
        targetState.studentGrades = {};
    }
    const enrolledStudents = getEnrolledStudentsForGroup(courseId, groupId);
    const rosterKey = resolveGradebookRosterKey(courseId, groupId, enrolledStudents);
    const existingRoster = (Array.isArray(targetState.studentGrades[rosterKey]) ? targetState.studentGrades[rosterKey] : [])
        .map(student => ensureGradeRecordHistories(student));
    const byId = new Map(existingRoster.map(student => [String(student?.id || ''), student]));
    enrolledStudents.forEach(student => {
        const studentId = String(student?.id || '').trim();
        if (!studentId || byId.has(studentId)) return;
        byId.set(studentId, ensureGradeRecordHistories({
            id: studentId,
            name: student?.name || `Student ${studentId}`,
            assessments: {}
        }));
    });
    targetState.studentGrades[rosterKey] = Array.from(byId.values()).map(student => ensureGradeRecordHistories(student));
    return {
        rosterKey,
        students: targetState.studentGrades[rosterKey]
    };
}

function syncGradebookRostersForStudent(studentId, rosterKey = '') {
    const normalizedStudentId = String(studentId || '').trim();
    const normalizedRosterKey = normalizeGradebookRosterKey(rosterKey);
    if (!normalizedStudentId) return;
    const rawSchedule = KIU_STATE.studentSchedulesByStudent?.[normalizedStudentId];
    const scheduleEntries = resolveStudentScheduleEntries(rawSchedule);
    scheduleEntries.forEach((entry) => {
        const courseId = entry?.courseId || entry?.sourceCourseId || '';
        const groupId = entry?.groupId || entry?.groupName || '';
        if (!courseId || !groupId) return;
        const enrolled = getEnrolledStudentsForGroup(courseId, groupId);
        const entryRosterKey = resolveGradebookRosterKey(courseId, groupId, enrolled);
        if (!normalizedRosterKey || normalizeGradebookRosterKey(entryRosterKey) === normalizedRosterKey) {
            syncGradebookRosterFromEnrollment(courseId, groupId);
        }
    });
    const section = typeof currentGradebookSection !== 'undefined' ? currentGradebookSection : null;
    if (section?.courseId && section?.groupId) {
        syncGradebookRosterFromEnrollment(section.courseId, section.groupId);
    }
}
function getGradebookGroupsForCurrentUser(filterOverrides = null) {
    const currentUser = getCurrentUser();
    const currentFaculty = getCurrentFaculty();
    const semesterFilter = String(
        filterOverrides?.semester ?? document.getElementById('fs-filter-sem')?.value ?? ''
    ).trim();
    const facultyFilter = String(
        filterOverrides?.faculty ?? document.getElementById('fs-filter-fac')?.value ?? currentFaculty ?? ''
    ).trim();
    const groups = [];
    Object.entries(KIU_STATE.availableGroups || {}).forEach(([courseId, courseGroups]) => {
        (courseGroups || []).forEach(group => {
            if (semesterFilter && semesterFilter !== 'all' && String(group?.semester || KIU_STATE.activeSemester || '').trim() !== semesterFilter) return;
            if (facultyFilter && facultyFilter !== 'all' && String(group?.faculty || '').trim()) {
                const groupFaculty = typeof normalizeFacultyCode === 'function'
                    ? normalizeFacultyCode(group.faculty, '')
                    : String(group.faculty || '').trim().toUpperCase();
                const selectedFaculty = typeof normalizeFacultyCode === 'function'
                    ? normalizeFacultyCode(facultyFilter, '')
                    : String(facultyFilter || '').trim().toUpperCase();
                if (groupFaculty && selectedFaculty && groupFaculty !== selectedFaculty) return;
            }
            const isAssigned = currentUser?.role === USER_ROLES.ADMIN
                ? (() => {
                    if (!currentFaculty || currentFaculty === 'all') return true;
                    const groupFaculty = typeof normalizeFacultyCode === 'function'
                        ? normalizeFacultyCode(group.faculty, '')
                        : String(group.faculty || '').trim().toUpperCase();
                    const selectedFaculty = typeof normalizeFacultyCode === 'function'
                        ? normalizeFacultyCode(currentFaculty, '')
                        : String(currentFaculty || '').trim().toUpperCase();
                    return !selectedFaculty || groupFaculty === selectedFaculty;
                })()
                : isUserAssignedToTeachingGroup(currentUser, group, courseId);
            if (!isAssigned) return;
            const subject = getDomain().subjectsById?.[courseId] || KIU_STATE.curriculum.find(item => item.id === courseId);
            const enrolledStudents = getEnrolledStudentsForGroup(courseId, group.id);
            groups.push({
                courseId,
                groupId: group.id,
                groupName: group.name || group.id,
                subjectName: subject?.name || courseId,
                icon: subject?.icon || 'fas fa-book',
                day: group.day,
                time: group.time,
                duration: group.duration,
                room: group.room,
                semester: group.semester,
                capacity: group.capacity || 40,
                enrolledCount: enrolledStudents.length || group.registered || 0
            });
        });
    });
    return groups.sort((a, b) => String(a.subjectName).localeCompare(String(b.subjectName)) || String(a.groupName).localeCompare(String(b.groupName)));
}



        const api = {
            normalizeGradebookRosterKey,
            normalizeTeachingScopeKey,
            getEnrolledStudentsForGroup,
            normalizePersonNameKey,
            getUserNameVariants,
            syncAvailableGroupEnrollmentCounts,
            resolveGradebookRosterKey,
            buildGradebookStudents,
            syncGradebookRosterFromEnrollment,
            syncGradebookRostersForStudent,
            isPortalCurriculumStaffForTeachingGroup,
            isUserNameAssignedToTeachingGroup,
            isUserAssignedToTeachingGroup,
            getGradebookGroupsForCurrentUser
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateMessengerGradebookApi({});
})();
