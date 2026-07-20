import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz reality checks', () => {
    it('starts the first question immediately and removes the student join-code prompt', () => {
        const liveQuizUiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(liveQuizUiSource).toContain('session.currentQuestionIndex = 0;');
        expect(liveQuizUiSource).toContain('markLmsLiveQuestionActivated(question);');
        expect(liveQuizUiSource).toContain('ensureLmsLiveRosterParticipants(resourceKey, session);');
        expect(liveQuizUiSource).not.toContain('Write a nickname first.');
        expect(liveQuizUiSource).not.toContain('lms-live-nickname-');
        expect(liveQuizUiSource).not.toContain('joinCode: makeLmsLiveJoinCode()');
    });

    it('resolves live quiz identity through the LMS impersonation-aware student meta path', () => {
        const liveQuizUiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(liveQuizUiSource).toContain('function getLmsLiveStudentMeta(resourceKey = currentCourseId)');
        expect(liveQuizUiSource).toContain('resolveLmsQuizStudentMeta(resourceKey);');
        expect(liveQuizUiSource).toContain('const studentMeta = getLmsLiveStudentMeta(resourceKey);');
        expect(liveQuizUiSource).toContain('const participantId = getLmsLiveStudentMeta(resourceKey).id;');
        expect(liveQuizUiSource).toContain('const participantMeta = getLmsLiveStudentMeta(resourceKey);');
    });

    it('uses effective roles for admin view-as instead of forcing all admins into staff mode', () => {
        const liveQuizUiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(liveQuizUiSource).toContain('isActualAdminLmsLiveQuizSession()');
        expect(liveQuizUiSource).toContain('canAccessLmsLiveQuizScope(canonicalKey || resourceKey)');
        expect(liveQuizUiSource).not.toContain('if (role === USER_ROLES.ADMIN) return true;');
    });

    it('uses clock patches during live sessions and polls the backend only while live', () => {
        const liveQuizWorkspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const liveQuizUiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(liveQuizWorkspaceSource).toContain('const LMS_LIVE_CLOCK_REFRESH_MS = 1000;');
        expect(liveQuizWorkspaceSource).toContain('const LMS_LIVE_CLOCK_FALLBACK_REFRESH_MS = 5000;');
        expect(liveQuizWorkspaceSource).toContain('const LMS_LIVE_CLOCK_BACKEND_REFRESH_TICKS = 5;');
        expect(liveQuizWorkspaceSource).toContain('function getLmsLiveQuizStructuralFingerprint');
        expect(liveQuizWorkspaceSource).toContain('function shouldIgnoreLmsLiveQuizRealtimeUpdate');
        expect(liveQuizWorkspaceSource).toContain('LMS_LIVE_LOCAL_SYNC_ECHO_MS');
        expect(liveQuizWorkspaceSource).toContain('forceStructuralRender: true');
        expect(liveQuizWorkspaceSource).toContain('invokeRefreshLmsLiveQuizUi(canonicalKey');
        expect(liveQuizUiSource).toContain('function refreshLmsLiveQuizUi');
        expect(liveQuizUiSource).toContain('function updateLmsLiveQuizClockUi');
        expect(liveQuizUiSource).toContain('function patchLmsLiveQuizTimerUi');
        expect(liveQuizWorkspaceSource).toContain('patchLmsLiveQuizTimerUi(canonicalKey)');
        expect(liveQuizUiSource).toContain('data-lms-live-region="timer"');
        expect(liveQuizUiSource).toContain('data-lms-live-region="stage-pills"');
        const clockUpdateBody = liveQuizUiSource.match(/function updateLmsLiveQuizClockUi[\s\S]*?\n}\n/)?.[0] || '';
        expect(clockUpdateBody).not.toContain("patchLmsLiveQuizRegion(contentArea, 'stage'");
        expect(liveQuizWorkspaceSource).toContain("joinCode: repairLmsDisplayText(session.joinCode || '', '').slice(0, 8).toUpperCase()");
        expect(liveQuizWorkspaceSource).toContain('nicknameMode: session.nicknameMode === true');
        expect(liveQuizWorkspaceSource).toContain('function isLmsActiveTab(tab)');
        expect(liveQuizWorkspaceSource).toContain('dataset?.activeLmsTab');
    });

    it('checks student access against the group roster, not a course-only fallback', () => {
        const serverSource = readSource('backend/platform/server.js');

        expect(serverSource).toContain('function parseLmsLiveQuizResourceKey(resourceKey = \'\')');
        expect(serverSource).toContain('function normalizeLmsLiveQuizScopeKey(value = \'\')');
        expect(serverSource).toContain('function getLmsLiveQuizEnrollmentGroupKey(enrollment = {})');
        expect(serverSource).toContain('const enrollments = store.getStudentEnrollments(actor.actorUserId);');
        expect(serverSource).toContain('function enrollmentMatchesLmsLiveQuizGroup');
        expect(serverSource).toContain('enrollmentMatchesLmsLiveQuizGroup(enrollment, courseId, groupId)');
        expect(serverSource).toContain('function getLmsLiveQuizEnrollmentGroupKey(enrollment = {})');
        expect(serverSource).toContain('function canAccessLmsLiveQuizAsStaff');
        expect(serverSource).toContain('if (isActualAdminSession(sessionAccount) && !isSessionImpersonating(sessionAccount)) return true');
        expect(serverSource).toContain('enrollment.courseId');
        expect(serverSource).toContain('isStudentViaLmsLiveQuizPortalSchedule(actor.actorUserId, courseId, groupId)');
    });

    it('uses the impersonated actor identity for live quiz participant naming on backend writes', () => {
        const serverSource = readSource('backend/platform/server.js');

        expect(serverSource).toContain('const actorUserId = getActorUserId(sessionAccount);');
        expect(serverSource).toContain('const actualActorUserId = getActualActorUserId(sessionAccount);');
        expect(serverSource).toContain('const personaAccount = store?.getAccountById?.(actorUserId);');
    });

    it('merges remote participant answers and polls backend while live', () => {
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const apiSource = readSource('assets/js/app/api.js');

        expect(workspaceSource).toContain('function mergeRemoteLmsLiveQuizParticipants');
        expect(workspaceSource).toContain('function countLmsLiveQuizAnswers');
        expect(workspaceSource).toContain('function hasLmsLiveQuizLiveSession');
        expect(workspaceSource).toContain('remoteAnswers > localAnswers');
        expect(workspaceSource).toContain('function shouldReloadLmsLiveQuizFromBackend');
        expect(workspaceSource).toContain('function rehydrateLmsLiveSessionParticipants');
        expect(workspaceSource).toContain('function submitLmsLiveQuizAnswerChange');
        expect(workspaceSource).toContain('function submitLmsLiveQuizJoinChange');
        expect(apiSource).toContain("`/api/lms/live-quizzes/${safeResourceKey}/answers`");
        expect(apiSource).toContain("`/api/lms/live-quizzes/${safeResourceKey}/join`");
    });

    it('submits student answers through the dedicated answer endpoint', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(uiSource).toContain('submitLmsLiveQuizAnswerChange(resourceKey');
        expect(uiSource).toContain('Start live session');
    });

    it('supports roster hints, focus refresh, and active session selection', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const lmsHtml = readSource('lms.html');

        expect(uiSource).toContain('function renderLmsLiveRosterPanel');
        expect(uiSource).toContain('function seedLmsLiveQuizRoster');
        expect(uiSource).toContain('workspace.ui.activeSessionId = session.id');
        expect(workspaceSource).toContain('function bindLmsLiveQuizFocusRefresh');
        expect(workspaceSource).toContain('function formatLmsLiveAnswerSyncError');
        expect(workspaceSource).toContain('workspace.ui?.activeSessionId');
        expect(lmsHtml).toContain('data-lms-tab="live-quiz"');
        expect(lmsHtml).not.toContain('lms-live-quiz-ui-runtime.js');
        expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('livequiz-timerfix1');
        expect(workspaceSource).toContain('function reloadActiveLmsLiveQuizFromServer');
        expect(uiSource).toContain('function renderLmsLiveQuizLoadingShell');
    });

    it('ships staff button availability, honest timer meter, and auto-broadcast stepping', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(uiSource).toContain('function getLmsLiveStaffActionAvailability');
        expect(uiSource).toContain('renderLmsLiveStaffActionButton');
        expect(uiSource).toContain('Number.isFinite(rawRemaining) ? rawRemaining : 0');
        expect(uiSource).toContain('markLmsLiveQuestionActivated(session.questions[nextIndex])');
        expect(workspaceSource).toContain('mergeLmsLiveStaffQuestionOverrides');
    });

    it('targets broadcast Show on the live control session and avoids debounced sync races', () => {
        const uiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');
        const workspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');

        expect(workspaceSource).toContain('function getLmsLiveStaffControlSession(resourceKey)');
        expect(uiSource).toContain('getLmsLiveStaffSessionForQuestion(resourceKey, questionId)');
        expect(uiSource).toContain('function syncStaffLmsLiveQuizControl(resourceKey, reason');
        expect(uiSource).toContain('clearTimeout(workspace.ui.syncTimer)');
        expect(uiSource).not.toMatch(/function syncStaffLmsLiveQuizControl[\s\S]*?queueLmsLiveQuizBackendSync/);
        expect(uiSource).toContain("item.status = 'ended'");
        expect(uiSource).toContain('exportLmsLiveQuizCsv,');
        expect(uiSource).toContain('toggleLmsLivePresentationMode,');
    });
});
