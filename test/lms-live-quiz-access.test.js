import { describe, expect, it } from 'vitest';

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz access alignment', () => {
    it('gates staff manage UI on course scope instead of role alone', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(workspaceSource).toContain('function canAccessLmsLiveQuizScope(resourceKey = currentCourseId)');
        expect(uiSource).toContain('canAccessLmsLiveQuizScope(canonicalKey || resourceKey)');
        expect(uiSource).toContain('if (workspace?.ui?.accessDenied) {');
        expect(uiSource).not.toMatch(/canManageLmsLiveQuiz[\s\S]*if \(\[USER_ROLES\.ADMIN, USER_ROLES\.PROFESSOR, USER_ROLES\.TA\]\.includes\(role\)\) return true;/);
    });

    it('skips backend sync and clears dirty state when access is denied', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(workspaceSource).toContain('function shouldSyncLmsLiveQuizWorkspace(resourceKey = currentCourseId)');
        expect(workspaceSource).toContain('if (!shouldSyncLmsLiveQuizWorkspace(canonicalKey)) return Promise.resolve(null);');
        expect(workspaceSource).toContain('if (workspace.ui?.accessDenied) {');
        expect(workspaceSource).toContain('workspace.ui.syncError = \'\';');
        expect(workspaceSource).toContain('function markLmsLiveQuizAccessDenied(canonicalKey, message');
        expect(workspaceSource).toContain('workspace.ui.dirty = false;');
        expect(workspaceSource).toContain('markLmsLiveQuizAccessDenied(');
        expect(classroomSource).toContain('shouldSyncLmsLiveQuizWorkspace(flushKey)');
        expect(workspaceSource).toContain('function getLmsLiveStaffSessionForQuestion(resourceKey, questionId)');
        expect(uiSource).toContain('getLmsLiveStaffSessionForQuestion(resourceKey, questionId)');
    });

    it('extends backend staff scope resolution for roster and LMS course teams', () => {
        const serverSource = readSource('backend/platform/server.js');

        expect(serverSource).toContain('function isAssignedViaLmsLiveQuizGroupRoster(courseId = \'\', groupId = \'\', userId = \'\', role = \'\')');
        expect(serverSource).toContain('function isStaffViaLmsCourseTeachingTeam(parsedResourceKey = {}, userId = \'\', role = \'\')');
        expect(serverSource).toContain('const parsedCourseId = parseLmsLiveQuizResourceKey(normalizedCourseId);');
        expect(serverSource).toContain('const resolvedCourseId = String(parsedCourseId.courseId || normalizedCourseId).trim();');
    });

    it('allows scoped staff to manage live quiz regardless of lecture/workshop section gate', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        expect(uiSource).toContain('canManageLmsClassSection(parsed.sectionType || getCurrentLmsSectionType())');
        expect(uiSource).toContain('return hasScopeAccess');
    });

    it('hydrates student participants and uses strict roster for live quiz', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const lmsSource = readSource('assets/js/pages/lms.js');

        expect(workspaceSource).toContain('function ensureLmsLiveStudentParticipant(resourceKey, session = null)');
        expect(workspaceSource).toContain('strictRoster: true');
        expect(uiSource).toContain('ensureLmsLiveStudentParticipant(resourceKey, session)');
        expect(lmsSource).toContain('function getLmsQuizEligibleStudents(resourceKey, options = {})');
        expect(lmsSource).toContain('const strictRoster = options?.strictRoster === true');
    });

    it('skips duplicate live-quiz tab enhancement chrome', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(classroomSource).toContain("tab === 'quiz' || tab === 'live-quiz'");
    });

    it('allows students with portal schedules when formal enrollments are missing', () => {
        const serverSource = readSource('backend/platform/server.js');
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(serverSource).toContain('function isStudentViaLmsLiveQuizPortalSchedule(studentId = \'\', courseId = \'\', groupId = \'\')');
        expect(serverSource).toContain('studentSchedulesByStudent');
        expect(serverSource).toContain('isStudentViaLmsLiveQuizPortalSchedule(actor.actorUserId, courseId, groupId)');
        expect(serverSource).toContain('enrollment.sourceCourseId');
        expect(workspaceSource).toContain('entry.groupName');
    });

    it('adds staff UX availability, timer honesty, impersonation prep, and broader staff scope', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const lmsHtml = readSource('lms.html');

        expect(uiSource).toContain('function getLmsLiveStaffActionAvailability(question = null, session = null)');
        expect(uiSource).toContain(' is-active');
        expect(uiSource).toContain('function prepareLmsLiveQuizImpersonation(resourceKey = currentCourseId)');
        expect(uiSource).toContain('syncLmsImpersonatedStudentSession(canonicalKey || resourceKey)');
        expect(uiSource).toContain('window.__lmsLiveQuizImpersonationSyncs = window.__lmsLiveQuizImpersonationSyncs || {};');
        expect(uiSource).toContain('Promise.resolve(prepareLmsLiveQuizImpersonation(context.resourceKey))');
        expect(uiSource).toContain('data-lms-live-region="status-rail"');
        expect(uiSource).toContain('remainingSeconds ??');
        expect(uiSource).toContain('markLmsLiveQuestionActivated(session.questions[nextIndex])');
        expect(uiSource).toContain('Confirm your LMS group enrollment');
        expect(workspaceSource).toContain('function mergeLmsLiveStaffQuestionOverrides(localWorkspace = {}, remoteWorkspace = {})');
        expect(workspaceSource).toContain('function isStaffForLmsLiveQuizPortalSections(resourceKey = \'\', userId = \'\', role = \'\')');
        expect(workspaceSource).toContain('function isStaffViaLmsLiveQuizTeachingTeam(resourceKey = \'\', userId = \'\', role = \'\')');
        expect(workspaceSource).toContain('isAssignedViaLmsLiveQuizGroupRoster(courseId, null, userId, role)');
        expect(workspaceSource).toContain('(terminal || !activatedAt)');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('livequiz-timerfix1');
        expect(lmsHtml).not.toContain('livequiz-timerfix1');
    });

    it('resolves admin view-as persona on backend when impersonatedUserId is missing', () => {
        const serverSource = readSource('backend/platform/server.js');
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(serverSource).toContain('function resolveImpersonatedActorUserId(sessionAccount)');
        expect(serverSource).toContain('admin-testing-');
        expect(serverSource).toContain('resolveImpersonatedActorUserId(sessionAccount)');
        expect(uiSource).toContain('function syncStaffLmsLiveQuizControl');
        expect(uiSource).toContain('return hasScopeAccess');
        expect(uiSource).not.toContain('return role === USER_ROLES.TA && hasScopeAccess');
    });

    it('grants admin-testing impersonation staff access from faculty curriculum', () => {
        const serverSource = readSource('backend/platform/server.js');

        expect(serverSource).toContain('function isAdminTestingPersonaUserId');
        expect(serverSource).toContain('function getAdminTestingPersonaFacultyCode');
        expect(serverSource).toContain('function isAdminTestingPersonaStaffForLiveQuiz');
        expect(serverSource).toContain('function isAdminTestingImpersonationStaffForLiveQuiz');
        expect(serverSource).toContain('isAdminTestingPersonaStaffForLiveQuiz(actor.actorUserId, actor.actorRole, courseId)');
        expect(serverSource).toContain('isAdminTestingImpersonationStaffForLiveQuiz(sessionAccount, courseId, groupId, actor.actorUserId, actor.actorRole)');
        expect(serverSource).toContain('adminProgramStructures');
    });
});
