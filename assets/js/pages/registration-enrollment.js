/* Shared student enrollment handlers for registration.html and index registration routes. */

function getRegistrationGroupCapacity(group, fallback = 40) {
    const parsed = parseInt(group?.capacity ?? group?.maxStudents ?? fallback, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getRegistrationGroupStats(courseId, group) {
    const capacity = getRegistrationGroupCapacity(group);
    const enrolledCount = typeof getEnrolledStudentsForGroup === 'function'
        ? getEnrolledStudentsForGroup(courseId, group?.id).length
        : 0;
    const freeSeats = Math.max(capacity - enrolledCount, 0);
    return {
        capacity,
        enrolledCount,
        freeSeats,
        isFull: freeSeats <= 0
    };
}

function refreshRegistrationEnrollmentUi() {
    if (typeof refreshRegistrationUI === 'function') {
        refreshRegistrationUI();
        return;
    }
    if (typeof updateEctsProgress === 'function') updateEctsProgress();
    if (typeof renderSelectedCoursesTab === 'function') renderSelectedCoursesTab();
}

function normalizeStudentScheduleDayKey(day) {
    if (typeof normalizeScheduleDayLabel === 'function') {
        return normalizeScheduleDayLabel(day, day || '');
    }
    return String(day || '').trim();
}

function resolveStudentScheduleInterval(entry) {
    if (!entry) return null;
    const timeStr = String(entry.time || entry.startTime || '').trim();
    if (!timeStr || typeof convertTimeToMinutes !== 'function') return null;
    const startMinutes = convertTimeToMinutes(timeStr);
    if (!Number.isFinite(startMinutes)) return null;
    const endStr = String(entry.endTime || '').trim();
    let endMinutes = endStr ? convertTimeToMinutes(endStr) : NaN;
    if (!Number.isFinite(endMinutes) || endMinutes <= startMinutes) {
        const durationMatch = String(entry.duration || '').match(/\d+/);
        const durationMinutes = durationMatch ? parseInt(durationMatch[0], 10) : 110;
        endMinutes = startMinutes + (Number.isFinite(durationMinutes) && durationMinutes > 0 ? durationMinutes : 110);
    }
    return { startMinutes, endMinutes, time: timeStr, day: entry.day };
}

function studentScheduleEntriesOverlap(left, right) {
    const leftDay = normalizeStudentScheduleDayKey(left?.day);
    const rightDay = normalizeStudentScheduleDayKey(right?.day);
    if (!leftDay || !rightDay || leftDay !== rightDay) return false;
    const leftInterval = resolveStudentScheduleInterval(left);
    const rightInterval = resolveStudentScheduleInterval(right);
    if (!leftInterval || !rightInterval) {
        return String(left?.time || '').trim() === String(right?.time || '').trim();
    }
    return leftInterval.startMinutes < rightInterval.endMinutes
        && rightInterval.startMinutes < leftInterval.endMinutes;
}

// Interference: same weekday + overlapping time intervals between draft schedule rows.
// Applies to lecture+lecture, seminar+seminar, and lecture+seminar (any courses).
// Excludes same course + same sessionType (section replacement, not a clash).
function findStudentEnrollmentScheduleConflict(schedule, courseId, normalizedGroup) {
    if (!Array.isArray(schedule) || !normalizedGroup) return null;
    const targetSessionType = String(normalizedGroup.sessionType || 'lecture');
    const targetEntry = {
        day: normalizedGroup.day,
        time: normalizedGroup.time,
        endTime: normalizedGroup.endTime,
        duration: normalizedGroup.duration
    };
    return schedule.find((item) => {
        const sameSelectableBucket = canonicalCourseKey(item.courseId) === canonicalCourseKey(courseId)
            && String(item.sessionType || 'lecture') === targetSessionType;
        if (sameSelectableBucket) return false;
        return studentScheduleEntriesOverlap(targetEntry, item);
    }) || null;
}

function formatStudentScheduleConflictWarning(conflict, normalizedGroup = null) {
    if (!conflict) return '';
    const courseLabel = conflict.courseName || conflict.courseId || 'another subject';
    const groupLabel = conflict.groupName || conflict.groupId || 'section';
    const dayLabel = typeof toEnglishText === 'function'
        ? toEnglishText(conflict.day || normalizedGroup?.day || '')
        : String(conflict.day || normalizedGroup?.day || '').trim();
    const timeLabel = String(conflict.time || normalizedGroup?.time || '').trim();
    const slotLabel = [dayLabel, timeLabel].filter(Boolean).join(' ');
    return slotLabel
        ? `Schedule overlap with ${courseLabel} (${groupLabel}) on ${slotLabel}. You can still enroll if you accept the clash.`
        : `Schedule overlap with ${courseLabel} (${groupLabel}). You can still enroll if you accept the clash.`;
}

function formatStudentScheduleConflictChooseConfirm(conflict, normalizedGroup = null) {
    const warning = formatStudentScheduleConflictWarning(conflict, normalizedGroup);
    if (!warning) return 'This section overlaps another session on your timetable.\n\nAdd this section anyway?';
    return `${warning}\n\nAdd this section anyway?`;
}

function selectCourseGroup(courseId, courseName, groupId) {
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    const canManageRegistration = Boolean(
        currentUser
        && effectiveRole === USER_ROLES.STUDENT
        && (typeof hasPermission !== 'function' || hasPermission('registration.manage'))
    );
    if (!canManageRegistration) {
        alert('Only signed-in student portal accounts can manage course registration.');
        return false;
    }
    const financialHold = parseFloat(getEffectiveTuitionBalance(currentUser.id) || 0);
    if (financialHold > 0) {
        if (typeof recordPortalSyncConflict === 'function') {
            recordPortalSyncConflict('finance', 'enrollment', 'financialHold', {
                localRecordId: String(currentUser.id || ''),
                externalRecordKey: String(currentUser.id || ''),
                localValue: { balance: financialHold, attemptedCourseId: courseId, attemptedGroupId: groupId },
                externalValue: { holdActive: true }
            });
        }
        alert(`Registration is blocked by an active financial hold (${financialHold} GEL).`);
        return false;
    }

    const preferredFaculty = currentUser?.facultyCode || currentUser?.faculty || getCurrentFaculty();
    const courseDef = getCourseByIdForRegistration(courseId, preferredFaculty) || { id: courseId, name: courseName, semester: null, cond: 'None' };
    const passedCourseSet = getRegisteredOrPassedCourses(currentUser.id);
    const studentSemester = getCurrentStudentSemesterNumber(currentUser);
    const eligibility = evaluateStudentCourseEligibility(currentUser, courseDef, passedCourseSet, studentSemester);
    if (!eligibility.allowed) {
        alert(`Registration rule blocked this subject:\n- ${eligibility.reasons.join('\n- ')}`);
        return false;
    }

    let currentSchedule = [...getCurrentStudentSchedule()];
    let ects = parseInt(courseDef?.ects, 10);
    if (!Number.isFinite(ects) || ects <= 0) ects = 6;

    const savedRegistrationIds = typeof normalizeStudentRegistrationCourseIds === 'function'
        ? normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations?.[currentUser.id])
        : (Array.isArray(KIU_STATE.studentRegistrations?.[currentUser.id]) ? KIU_STATE.studentRegistrations[currentUser.id] : []);
    const alreadyRegistered = savedRegistrationIds
        .some(id => canonicalCourseKey(id) === canonicalCourseKey(courseId));
    const currentTotal = getStudentRegisteredEctsTotal(currentUser.id, preferredFaculty);
    const limit = KIU_STATE.probationStatus[currentUser.id] ? 24 : 36;
    if (!alreadyRegistered && currentTotal + ects > limit) {
        alert(`ECTS LIMIT EXCEEDED: ${KIU_STATE.probationStatus[currentUser.id] ? 'Due to Academic Probation, your limit is 24 credits.' : 'You cannot exceed 36 credits.'}`);
        return false;
    }

    const resolvedGroupMatch = findAvailableGroupForAssignedSubject(courseId, courseName, groupId);
    const resolvedCourseId = resolvedGroupMatch?.courseId || courseId;
    const group = resolvedGroupMatch?.group || (KIU_STATE.availableGroups[courseId] || []).find(g => g.id === groupId);
    if (!group) return false;
    const resolvedCourseDef = getCourseByIdForRegistration(resolvedCourseId, preferredFaculty, courseName) || courseDef;
    const resolvedEcts = parseInt(resolvedCourseDef?.ects, 10);
    if (Number.isFinite(resolvedEcts) && resolvedEcts > 0) ects = resolvedEcts;
    const normalizedGroup = normalizeScheduleGroup(resolvedCourseId, group) || group;
    const normalizedPreferredFaculty = normalizeFacultyCode(preferredFaculty, 'ECON');
    const groupFaculty = normalizeFacultyCode(
        normalizedGroup.faculty || (typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(resolvedCourseId) : '') || normalizedPreferredFaculty,
        normalizedPreferredFaculty
    );
    if (groupFaculty !== normalizedPreferredFaculty) {
        alert('This section belongs to another faculty and cannot be selected from this account.');
        return false;
    }
    const alreadyInTargetGroup = currentSchedule.some(item =>
        canonicalCourseKey(item.courseId) === canonicalCourseKey(resolvedCourseId)
        && String(item.groupId || '') === String(groupId || '')
    );
    const { capacity, freeSeats } = getRegistrationGroupStats(resolvedCourseId, normalizedGroup);
    if (!alreadyInTargetGroup && freeSeats <= 0) {
        if (typeof recordPortalAudit === 'function') {
            recordPortalAudit('registration', 'seat-blocked', 'section', `${resolvedCourseId}:${groupId}`, {
                afterState: {
                    studentId: currentUser.id,
                    courseId: resolvedCourseId,
                    groupId,
                    capacity
                }
            });
        }
        alert(`This group is already full. Capacity: ${capacity} students.`);
        return false;
    }
    const targetSessionType = normalizedGroup.sessionType || 'lecture';
    const scheduleConflict = findStudentEnrollmentScheduleConflict(currentSchedule, courseId, normalizedGroup);
    if (scheduleConflict && typeof recordPortalAudit === 'function') {
        recordPortalAudit('registration', 'schedule-conflict', 'enrollment', `${resolvedCourseId}:${groupId}`, {
            afterState: {
                studentId: currentUser.id,
                attemptedCourseId: resolvedCourseId,
                attemptedGroupId: groupId,
                conflictingCourseId: scheduleConflict.courseId,
                conflictingGroupId: scheduleConflict.groupId,
                warningOnly: true
            }
        });
    }

    currentSchedule = currentSchedule.filter(s => !(
        canonicalCourseKey(s.courseId) === canonicalCourseKey(courseId)
        && String(s.sessionType || 'lecture') === String(targetSessionType)
    ));
    const enrollmentSemester = (() => {
        const candidates = [
            resolvedCourseDef?.semester,
            courseDef?.semester,
            normalizedGroup?.semester,
            typeof getCurrentStudentSemesterNumber === 'function'
                ? getCurrentStudentSemesterNumber(currentUser)
                : KIU_STATE?.activeSemester
        ];
        for (let index = 0; index < candidates.length; index += 1) {
            const parsed = parseInt(candidates[index], 10);
            if (Number.isFinite(parsed) && parsed > 0) return parsed;
        }
        return 1;
    })();
    currentSchedule.push({
        courseId: resolvedCourseId,
        courseName: courseName || normalizedGroup.courseName || resolvedCourseId,
        groupId: groupId,
        groupName: normalizedGroup.name,
        day: normalizedGroup.day,
        time: normalizedGroup.time,
        endTime: normalizedGroup.endTime,
        prof: normalizedGroup.prof,
        room: normalizedGroup.room,
        duration: normalizedGroup.duration,
        sessionType: normalizedGroup.sessionType || 'lecture',
        faculty: normalizedPreferredFaculty,
        ects: ects,
        sourceCourseId: resolvedCourseId,
        semester: enrollmentSemester,
        enrollmentSemester,
        registeredAt: new Date().toISOString()
    });
    setCurrentStudentSchedule(currentSchedule);

    const timetableSemesterFilter = document.getElementById('tt-filter-sem');
    if (timetableSemesterFilter && normalizedGroup.semester && String(timetableSemesterFilter.value) !== String(normalizedGroup.semester)) {
        timetableSemesterFilter.value = String(normalizedGroup.semester);
    }

    if (!KIU_STATE.studentRegistrations) KIU_STATE.studentRegistrations = {};
    if (!Array.isArray(KIU_STATE.studentRegistrations[currentUser.id])) {
        KIU_STATE.studentRegistrations[currentUser.id] = typeof normalizeStudentRegistrationCourseIds === 'function'
            ? normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations[currentUser.id])
            : [];
    }
    const currentRegistrations = KIU_STATE.studentRegistrations[currentUser.id];
    if (!currentRegistrations.some(id => canonicalCourseKey(id) === canonicalCourseKey(resolvedCourseId))) {
        currentRegistrations.push(resolvedCourseId);
    }
    if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
        syncAvailableGroupEnrollmentCounts();
    }

    saveState();
    refreshRegistrationEnrollmentUi();

    if (typeof renderTimetable === 'function') renderTimetable();
    if (typeof renderProfileCalendar === 'function') renderProfileCalendar();
    if (typeof renderStudentCalendarSchedule === 'function') renderStudentCalendarSchedule();
    if (typeof renderStudyCard === 'function') renderStudyCard();
    if (typeof renderLMSSubjects === 'function') renderLMSSubjects();
    if (document.getElementById('student-reg-content-container')) {
        if (typeof renderStudentRegStructures === 'function') {
            renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
        }
        if (typeof updateEctsProgress === 'function') updateEctsProgress();
    }
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('registration', 'enrolled', 'enrollment', `${currentUser.id}:${resolvedCourseId}:${groupId}`, {
            afterState: {
                studentId: currentUser.id,
                courseId: resolvedCourseId,
                courseName: courseName || normalizedGroup.courseName || resolvedCourseId,
                groupId,
                sessionType: normalizedGroup.sessionType || 'lecture',
                ects
            }
        });
    }
    if (typeof recordPortalSyncRun === 'function') {
        recordPortalSyncRun('sis', {
            scope: 'enrollment',
            status: 'queued',
            recordsSeen: 1,
            recordsChanged: 1,
            notes: `Enrollment queued for ${currentUser.id} in ${resolvedCourseId} / ${groupId}.`
        });
    }
    return { ok: true, conflict: scheduleConflict || null };
}

function removeStudentCourseEnrollment(courseId) {
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) return false;

    const normalizedCourseId = String(courseId || '').trim();
    if (!normalizedCourseId) return false;

    const removedEntries = getCurrentStudentSchedule().filter(item =>
        canonicalCourseKey(item.courseId) === canonicalCourseKey(normalizedCourseId)
    );
    if (!removedEntries.length) return false;

    const updatedSchedule = getCurrentStudentSchedule().filter(item =>
        canonicalCourseKey(item.courseId) !== canonicalCourseKey(normalizedCourseId)
    );
    setCurrentStudentSchedule(updatedSchedule);

    if (KIU_STATE.studentRegistrations?.[currentUser.id]) {
        const currentRegistrations = typeof normalizeStudentRegistrationCourseIds === 'function'
            ? normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations[currentUser.id])
            : (Array.isArray(KIU_STATE.studentRegistrations[currentUser.id]) ? KIU_STATE.studentRegistrations[currentUser.id] : []);
        KIU_STATE.studentRegistrations[currentUser.id] = currentRegistrations
            .filter(id => canonicalCourseKey(id) !== canonicalCourseKey(normalizedCourseId));
    }

    if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
        syncAvailableGroupEnrollmentCounts();
    }
    saveState();
    refreshRegistrationEnrollmentUi();
    if (typeof renderTimetable === 'function') renderTimetable();
    if (typeof renderProfileCalendar === 'function') renderProfileCalendar();
    if (typeof renderStudentCalendarSchedule === 'function') renderStudentCalendarSchedule();
    if (typeof renderLMSSubjects === 'function') renderLMSSubjects();
    if (typeof renderStudyCard === 'function') renderStudyCard();
    if (document.getElementById('student-reg-content-container')) {
        if (typeof renderStudentRegStructures === 'function') {
            renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
        }
        if (typeof updateEctsProgress === 'function') updateEctsProgress();
    }
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('registration', 'unenrolled', 'course', `${currentUser.id}:${normalizedCourseId}`, {
            afterState: {
                studentId: currentUser.id,
                courseId: normalizedCourseId,
                removedSectionCount: removedEntries.length
            }
        });
    }
    if (typeof showToast === 'function') {
        showToast('Subject removed from your registration draft.', 'success');
    }
    return true;
}

function unselectCourseGroup(courseId, groupId) {
    const currentUser = getCurrentUser();
    const effectiveRole = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (currentUserRole || currentUser?.role || USER_ROLES.STUDENT);
    if (!currentUser || effectiveRole !== USER_ROLES.STUDENT) return;
    const updatedSchedule = getCurrentStudentSchedule().filter(s => !(s.courseId === courseId && s.groupId === groupId));
    setCurrentStudentSchedule(updatedSchedule);

    const hasSameCourseRemaining = updatedSchedule.some(item => canonicalCourseKey(item.courseId) === canonicalCourseKey(courseId));
    if (!hasSameCourseRemaining && KIU_STATE.studentRegistrations?.[currentUser.id]) {
        const currentRegistrations = typeof normalizeStudentRegistrationCourseIds === 'function'
            ? normalizeStudentRegistrationCourseIds(KIU_STATE.studentRegistrations[currentUser.id])
            : (Array.isArray(KIU_STATE.studentRegistrations[currentUser.id]) ? KIU_STATE.studentRegistrations[currentUser.id] : []);
        KIU_STATE.studentRegistrations[currentUser.id] = currentRegistrations
            .filter(id => canonicalCourseKey(id) !== canonicalCourseKey(courseId));
    }
    if (typeof syncAvailableGroupEnrollmentCounts === 'function') {
        syncAvailableGroupEnrollmentCounts();
    }
    saveState();
    refreshRegistrationEnrollmentUi();
    if (typeof renderTimetable === 'function') renderTimetable();
    if (typeof renderProfileCalendar === 'function') renderProfileCalendar();
    if (typeof renderStudentCalendarSchedule === 'function') renderStudentCalendarSchedule();
    if (typeof renderLMSSubjects === 'function') renderLMSSubjects();
    if (typeof renderStudyCard === 'function') renderStudyCard();
    if (document.getElementById('student-reg-content-container')) {
        if (typeof renderStudentRegStructures === 'function') {
            renderStudentRegStructures(window.__studentRegActiveTab || 'prog');
        }
        if (typeof updateEctsProgress === 'function') updateEctsProgress();
    }
    if (typeof recordPortalAudit === 'function') {
        recordPortalAudit('registration', 'unenrolled', 'enrollment', `${currentUser.id}:${courseId}:${groupId}`, {
            afterState: {
                studentId: currentUser.id,
                courseId,
                groupId
            }
        });
    }
    if (typeof recordPortalSyncRun === 'function') {
        recordPortalSyncRun('sis', {
            scope: 'enrollment',
            status: 'queued',
            recordsSeen: 1,
            recordsChanged: 1,
            notes: `Unenrollment queued for ${currentUser.id} in ${courseId} / ${groupId}.`
        });
    }
}

window.selectCourseGroup = selectCourseGroup;
window.removeStudentCourseEnrollment = removeStudentCourseEnrollment;
window.unselectCourseGroup = unselectCourseGroup;
window.getRegistrationGroupStats = getRegistrationGroupStats;
window.resolveStudentScheduleInterval = resolveStudentScheduleInterval;
window.findStudentEnrollmentScheduleConflict = findStudentEnrollmentScheduleConflict;
window.formatStudentScheduleConflictWarning = formatStudentScheduleConflictWarning;
window.formatStudentScheduleConflictChooseConfirm = formatStudentScheduleConflictChooseConfirm;
window.studentScheduleEntriesOverlap = studentScheduleEntriesOverlap;
