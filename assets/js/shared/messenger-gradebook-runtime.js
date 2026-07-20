/* Peeled from assets/js/shared/messenger.js. Load before host. */
(function () {
    if (window.__KIU_MESSENGER_GRADEBOOK_LOADED) return;
    window.__KIU_MESSENGER_GRADEBOOK_LOADED = true;

    window.__kiuCreateMessengerGradebookApi = function createKiuMessengerGradebookApi(deps = {}) {
        const d = deps;
        void d;
function normalizeGradebookRosterKey(value) {
    return normalizeIdentifier(value);
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
    Object.entries(KIU_STATE.studentSchedulesByStudent || {}).forEach(([studentId, schedule]) => {
        const scheduleEntries = Array.isArray(schedule)
            ? schedule
            : (schedule && typeof schedule === 'object')
                ? Object.entries(schedule).map(([scheduledCourseId, scheduledGroupId]) => ({
                    courseId: scheduledCourseId,
                    groupId: scheduledGroupId
                }))
                : [];
        const isEnrolled = scheduleEntries.some(item => (
            canonicalCourseKey(item?.courseId || item?.sourceCourseId || '') === normalizedCourseId
            && canonicalCourseKey(item?.groupId || item?.groupName || '') === normalizedGroupId
            && (!targetFaculty || normalizeFacultyCode(item?.faculty || targetFaculty, targetFaculty) === targetFaculty)
        ));
        if (!isEnrolled || seen.has(studentId)) return;
        const student = domain.usersById?.[studentId] || getAllStudents(targetFaculty || 'all').find(item => item.id === studentId);
        if (targetFaculty && normalizeFacultyCode(student?.facultyCode || student?.faculty || '', '') !== targetFaculty) return;
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
function getGradebookGroupsForCurrentUser(filterOverrides = null) {
    const currentUser = getCurrentUser();
    const currentFaculty = getCurrentFaculty();
    const currentIdentityKeys = (() => {
        if (typeof getUserNameVariants === 'function') {
            return getUserNameVariants(currentUser);
        }
        const fallback = new Set();
        [currentUser?.name, currentUser?.nameEn, currentUser?.email].forEach(value => {
            const normalized = typeof normalizePersonNameKey === 'function'
                ? normalizePersonNameKey(value)
                : String(value || '').trim().toLowerCase();
            if (normalized) fallback.add(normalized);
        });
        return fallback;
    })();
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
                : (() => {
                    const profKey = typeof normalizePersonNameKey === 'function'
                        ? normalizePersonNameKey(group.prof)
                        : String(group.prof || '').trim().toLowerCase();
                    const taKey = typeof normalizePersonNameKey === 'function'
                        ? normalizePersonNameKey(group.ta)
                        : String(group.ta || '').trim().toLowerCase();
                    return currentIdentityKeys.has(profKey) || currentIdentityKeys.has(taKey);
                })();
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
            getEnrolledStudentsForGroup,
            normalizePersonNameKey,
            getUserNameVariants,
            syncAvailableGroupEnrollmentCounts,
            resolveGradebookRosterKey,
            buildGradebookStudents,
            getGradebookGroupsForCurrentUser
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateMessengerGradebookApi({});
})();
