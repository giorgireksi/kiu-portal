/* Live quiz staff/access/sync helpers. Peeled from lms-live-quiz-workspace-runtime.js.
 * Load before lms-live-quiz-workspace-runtime.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LMS_LIVE_QUIZ_ACCESS_LOADED) return;
    window.__KIU_LMS_LIVE_QUIZ_ACCESS_LOADED = true;

    window.__kiuCreateLmsLiveQuizAccessApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function isStaffForLmsLiveQuizPortalSections(resourceKey = '', userId = '', role = '') {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(resourceKey));
    const courseId = String(parsed.courseId || '').trim();
    const groupId = parsed.groupId || null;
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !courseId) return false;
    const targetCourse = normalizeLmsLiveQuizScopeKey(courseId);
    const targetGroup = groupId ? normalizeLmsLiveQuizScopeKey(groupId) : '';
    const sections = KIU_STATE?.sections && typeof KIU_STATE.sections === 'object'
        ? Object.values(KIU_STATE.sections)
        : [];
    return sections.some(section => {
        const sectionCourseKeys = new Set([
            normalizeLmsLiveQuizScopeKey(section?.courseId || ''),
            normalizeLmsLiveQuizScopeKey(parseLmsCourseKey(section?.id || section?.code || '').courseId || '')
        ].filter(Boolean));
        if (!sectionCourseKeys.has(targetCourse)) return false;
        const sectionGroup = normalizeLmsLiveQuizScopeKey(parseLmsCourseKey(section?.id || section?.code || '').groupId || section?.code || '');
        if (targetGroup && sectionGroup && sectionGroup !== targetGroup) return false;
        const professorIds = [
            section?.professorId,
            section?.instructorUserId,
            section?.instructorId
        ].map(value => String(value || '').trim()).filter(Boolean);
        const taIds = [
            ...(Array.isArray(section?.taIds) ? section.taIds : []),
            section?.assistantUserId,
            section?.assistantId,
            section?.taId
        ].map(value => String(value || '').trim()).filter(Boolean);
        if (normalizedRole === USER_ROLES.PROFESSOR) return professorIds.includes(normalizedUserId);
        if (normalizedRole === USER_ROLES.TA) return taIds.includes(normalizedUserId);
        return professorIds.includes(normalizedUserId) || taIds.includes(normalizedUserId);
    });
}

function isStaffViaLmsLiveQuizTeachingTeam(resourceKey = '', userId = '', role = '') {
    const parsed = parseLmsCourseKey(resolveCanonicalLmsResourceKey(resourceKey));
    const courseId = String(parsed.courseId || '').trim();
    const groupId = String(parsed.groupId || '').trim();
    const sectionType = String(parsed.sectionType || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedUserId || !courseId) return false;
    const sectionSuffix = sectionType ? `__lmssec_${sectionType}` : '';
    const candidateKeys = [
        parsed.resourceKey,
        groupId ? `${courseId}::${groupId}${sectionSuffix}` : '',
        groupId ? `${courseId}::${groupId}` : '',
        courseId
    ].filter(Boolean);
    const lmsCourses = KIU_STATE?.lmsCourses && typeof KIU_STATE.lmsCourses === 'object'
        ? KIU_STATE.lmsCourses
        : {};
    return candidateKeys.some(key => {
        const teachingTeam = Array.isArray(lmsCourses?.[key]?.teachingTeam) ? lmsCourses[key].teachingTeam : [];
        return teachingTeam.some(member => {
            if (typeof member === 'string') return member === normalizedUserId;
            const memberId = String(member?.userId || member?.id || '').trim();
            const memberRole = String(member?.role || member?.assignmentRole || '').trim().toLowerCase();
            if (memberId !== normalizedUserId) return false;
            if (!normalizedRole || !memberRole) return true;
            return memberRole === normalizedRole
                || (normalizedRole === USER_ROLES.PROFESSOR && memberRole === 'instructor');
        });
    });
}

function isAssignedViaLmsLiveQuizGroupRoster(courseId = '', groupId = '', userId = '', role = '') {
    const normalizedRole = String(role || '').trim().toLowerCase();
    const normalizedUserId = String(userId || '').trim();
    if (!normalizedUserId || !courseId) return false;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const identityTokens = new Set([normalizedUserId, normalizeLmsLiveQuizScopeKey(normalizedUserId)]);
    [user?.displayName, user?.nameEn, user?.name, user?.email].forEach(value => {
        const token = String(value || '').trim();
        if (!token || token.toLowerCase() === 'tbd') return;
        identityTokens.add(token);
        identityTokens.add(normalizeLmsLiveQuizScopeKey(token));
    });
    const targetGroup = groupId ? normalizeLmsLiveQuizScopeKey(groupId) : '';
    const groups = KIU_STATE?.availableGroups?.[courseId] || [];
    return groups.some(group => {
        if (targetGroup && normalizeLmsLiveQuizScopeKey(group?.id || group?.name || '') !== targetGroup) return false;
        const profToken = String(group?.professorId || group?.prof || '').trim();
        const taToken = String(group?.taId || group?.assistantId || group?.ta || '').trim();
        const matchesToken = (token = '') => {
            const raw = String(token || '').trim();
            if (!raw || raw.toLowerCase() === 'tbd') return false;
            return identityTokens.has(raw) || identityTokens.has(normalizeLmsLiveQuizScopeKey(raw));
        };
        if (normalizedRole === USER_ROLES.PROFESSOR) return matchesToken(profToken);
        if (normalizedRole === USER_ROLES.TA) return matchesToken(taToken);
        return matchesToken(profToken) || matchesToken(taToken);
    });
}

function isAdminTestingPersonaStaffForLmsLiveQuiz(courseId = '', userId = '', role = '') {
    const normalizedUserId = String(userId || '').trim().toLowerCase();
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedUserId.startsWith('admin-testing-') || !['professor', 'ta'].includes(normalizedRole)) return false;
    const personaFaculty = String(normalizedUserId.split('-')[2] || '').trim().toUpperCase();
    const coursePrefix = String(courseId || '').trim().split('-')[0].toUpperCase();
    if (!personaFaculty || coursePrefix !== personaFaculty) return false;
    return normalizedUserId.endsWith(`-${normalizedRole}`);
}

function isAdminTestingPersonaStudentForLmsLiveQuiz(courseId = '', userId = '') {
    const normalizedUserId = String(userId || '').trim().toLowerCase();
    if (!normalizedUserId.startsWith('admin-testing-') || !String(courseId || '').trim()) return false;
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (String(user?.role || '').trim().toLowerCase() !== USER_ROLES.STUDENT) return false;
    const parts = normalizedUserId.split('-');
    const personaFaculty = String(parts[2] || '').trim().toUpperCase();
    if (!personaFaculty) return false;
    const coursePrefix = String(courseId || '').trim().split('-')[0].toUpperCase();
    if (coursePrefix && coursePrefix === personaFaculty) return true;
    const profile = KIU_STATE?.facultyProfiles?.[personaFaculty];
    return (Array.isArray(profile?.curriculum) ? profile.curriculum : []).some(subject =>
        normalizeLmsLiveQuizScopeKey(subject?.id || subject?.subjectId || '')
        === normalizeLmsLiveQuizScopeKey(courseId)
    );
}

function canAccessLmsLiveQuizScope(resourceKey = currentCourseId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return false;
    const parsed = parseLmsCourseKey(canonicalKey);
    const courseId = String(parsed.courseId || '').trim();
    if (!courseId) return false;
    const groupId = parsed.groupId || null;
    if (isActualAdminLmsLiveQuizSession()) return true;
    const role = typeof getEffectiveUserRole === 'function'
        ? String(getEffectiveUserRole() || '').trim().toLowerCase()
        : '';
    const userId = String((typeof getCurrentUserId === 'function' ? getCurrentUserId() : '') || '').trim();
    if ([USER_ROLES.ADMIN, USER_ROLES.PROFESSOR, USER_ROLES.TA].includes(role)) {
        return isAdminTestingPersonaStaffForLmsLiveQuiz(courseId, userId, role)
            || isPortalCurriculumStaffForLmsLiveQuiz(courseId, groupId, userId, role)
            || isAssignedViaLmsLiveQuizGroupRoster(courseId, groupId, userId, role)
            || isAssignedViaLmsLiveQuizGroupRoster(courseId, null, userId, role)
            || isStaffForLmsLiveQuizPortalSections(canonicalKey, userId, role)
            || isStaffViaLmsLiveQuizTeachingTeam(canonicalKey, userId, role);
    }
    if (role === USER_ROLES.STUDENT) {
        const schedule = typeof getStudentLmsScheduleEntries === 'function'
            ? getStudentLmsScheduleEntries()
            : (typeof getCurrentStudentSchedule === 'function' ? getCurrentStudentSchedule() : []);
        if ((Array.isArray(schedule) ? schedule : []).some(entry =>
            enrollmentMatchesLmsLiveQuizGroup(entry, courseId, groupId)
        )) {
            return true;
        }
        if (isAdminTestingPersonaStudentForLmsLiveQuiz(courseId, userId)) return true;
        if (userId && typeof getLmsQuizEligibleStudents === 'function') {
            const roster = getLmsQuizEligibleStudents(canonicalKey, { strictRoster: true });
            if (roster.some(student => String(student?.id || '').trim() === userId)) {
                return true;
            }
        }
        const liveSession = getLmsLiveStudentSession(canonicalKey);
        if (userId && liveSession?.participants?.[userId]) {
            return true;
        }
        return false;
    }
    return false;
}

function markLmsLiveQuizAccessDenied(canonicalKey, message = 'You are not assigned to this course scope.') {
    if (!canonicalKey) return;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    workspace.ui.accessDenied = true;
    workspace.ui.dirty = false;
    workspace.ui.syncing = false;
    if (workspace.ui.syncTimer) {
        clearTimeout(workspace.ui.syncTimer);
        workspace.ui.syncTimer = null;
    }
    workspace.ui.syncError = repairLmsDisplayText(message, 'You are not assigned to this course scope.');
}

function shouldSyncLmsLiveQuizWorkspace(resourceKey = currentCourseId) {
    const canonicalKey = resolveCanonicalLmsResourceKey(resourceKey);
    if (!canonicalKey) return false;
    const workspace = ensureLmsLiveQuizWorkspace(canonicalKey);
    if (workspace.ui?.accessDenied) {
        if (typeof canAccessLmsLiveQuizScope === 'function' && canAccessLmsLiveQuizScope(canonicalKey)) {
            workspace.ui.accessDenied = false;
            workspace.ui.syncError = '';
        } else {
            return false;
        }
    }
    if (typeof canManageLmsLiveQuiz === 'function' && canManageLmsLiveQuiz(canonicalKey)) {
        return canAccessLmsLiveQuizScope(canonicalKey);
    }
    return canAccessLmsLiveQuizScope(canonicalKey);
}

function countLmsLiveQuizContent(workspace = {}) {
    const sessions = Array.isArray(workspace?.sessions) ? workspace.sessions : [];
    let questions = 0;
    sessions.forEach(session => {
        questions += Array.isArray(session?.questions) ? session.questions.length : 0;
    });
    return { sessions: sessions.length, questions };
}

        const api = {
            isStaffForLmsLiveQuizPortalSections,
            isStaffViaLmsLiveQuizTeachingTeam,
            isAssignedViaLmsLiveQuizGroupRoster,
            canAccessLmsLiveQuizScope,
            markLmsLiveQuizAccessDenied,
            shouldSyncLmsLiveQuizWorkspace,
            countLmsLiveQuizContent,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLmsLiveQuizAccessApi({});
})();

