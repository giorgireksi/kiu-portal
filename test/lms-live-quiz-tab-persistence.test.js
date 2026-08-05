import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz tab persistence', () => {
    it('detects active LMS tabs from content area dataset', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(workspaceSource).toContain('function isLmsActiveTab(tab)');
        expect(workspaceSource).toContain("contentArea?.dataset?.activeLmsTab");
        expect(workspaceSource).not.toContain('currentLMSTab === \'live-quiz\'');
    });

    it('guards against stale remote workspace overwrites and fetch generations', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(workspaceSource).toContain('function shouldApplyRemoteLmsLiveQuizWorkspace');
        expect(workspaceSource).toContain('function isRemoteLmsLiveQuizWorkspaceNewer');
        expect(workspaceSource).toContain('function stripLmsLiveQuizPersistedUi');
        expect(workspaceSource).toContain('function bindLmsLiveQuizWorkspaceActor');
        expect(workspaceSource).toContain('function resetLmsLiveQuizRuntimeState');
        expect(workspaceSource).toContain('workspace.ui?.dirty');
        expect(workspaceSource).toContain('skipBackendLoad');
        expect(workspaceSource).toContain('function bumpLmsLiveQuizLoadGeneration');
        expect(workspaceSource).toContain('isCurrentLmsLiveQuizLoadGeneration');
        expect(workspaceSource).toContain('function flushLmsLiveQuizSync');
        expect(workspaceSource).toContain('function runImmediateLmsLiveQuizSync');
        expect(workspaceSource).toContain('function submitLmsLiveQuizJoinChange');
        expect(workspaceSource).toContain('workspace.ui.accessDenied');
    });

    it('skips cache-only restore for live-quiz and invalidates cache on save', () => {
        const shellSource = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js')
            + readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(shellSource).toContain("tab !== 'live-quiz' && tab !== 'interaction' && tab !== 'whiteboard' && tab !== 'quiz' && tab !== 'monitoring' && LMS_TAB_RENDER_CACHE[cacheKey]");
        expect(shellSource).toContain('function invalidateLmsLiveQuizTabCache');
        expect(classroomSource).toContain('flushLmsLiveQuizSync');
        expect(workspaceSource).toContain('window.invalidateLmsLiveQuizTabCache');
    });

    it('shows a loading shell before server fetch and syncs tab cache after paint', () => {
        const uiSource = readLmsLiveQuizUiChain();
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();

        expect(uiSource).toContain('function renderLmsLiveQuizLoadingShell');
        expect(uiSource).toContain('loadLmsLiveQuizWorkspace(context.resourceKey');
        expect(uiSource).toContain('forceRemote: true');
        expect(uiSource).toContain('function paintLmsLiveQuizSectionContent');
        expect(workspaceSource).toContain('skipLoad: true');
        expect(uiSource).toContain("window.syncLmsTabRenderCacheFromDom('live-quiz'");
    });

    it('preserves draft form fields across live quiz re-renders', () => {
        const uiSource = readLmsLiveQuizUiChain();

        expect(uiSource).toContain('function captureLmsLiveQuizDraftFields');
        expect(uiSource).toContain('function restoreLmsLiveQuizDraftFields');
        expect(uiSource).toContain('captureLmsLiveQuizDraftFields(context.resourceKey)');
        expect(uiSource).toContain('restoreLmsLiveQuizDraftFields(draftSnapshot, context.resourceKey)');
    });

    it('routes async live quiz updates through refreshLmsLiveQuizUi', () => {
        const workspaceSource = readLmsLiveQuizWorkspaceRuntime();
        const uiSource = readLmsLiveQuizUiChain();

        expect(workspaceSource).toContain('function invokeRefreshLmsLiveQuizUi');
        expect(workspaceSource).toContain('invokeRefreshLmsLiveQuizUi(canonicalKey, { skipLoad: true })');
        expect(uiSource).toContain('function refreshLmsLiveQuizUi');
    });

    it('flushes live quiz sync before portal navigation', () => {
        const apiSource = readSource('assets/js/app/api.js');

        expect(apiSource).toContain('window.flushLmsLiveQuizSync');
    });

    it('canonicalizes live quiz resource keys from stored workspaces', () => {
        const lmsSource = readSource('assets/js/pages/lms.js')
            + readSource('assets/js/pages/lms-section-quiz-runtime.js');

        expect(lmsSource).toContain('Object.keys(KIU_STATE.lmsLiveQuizzes || {})');
    });

    it('matches enrollment groups using section code and parsed section ids', () => {
        const serverSource = readSource('backend/platform/server.js');

        expect(serverSource).toContain('function enrollmentMatchesLmsLiveQuizGroup');
        expect(serverSource).toContain('enrollmentMatchesLmsLiveQuizGroup(enrollment, courseId, groupId)');
        expect(serverSource).toContain('section.code');
    });

    it('allows admin view-as and portal curriculum professors to access live quiz staff routes', () => {
        const serverSource = readSource('backend/platform/server.js');

        expect(serverSource).toContain('function canAccessLmsLiveQuizAsStaff');
        expect(serverSource).toContain('function isPortalCurriculumStaffForLiveQuiz');
        expect(serverSource).toContain('if (isActualAdminSession(sessionAccount) && !isSessionImpersonating(sessionAccount)) return true');
        expect(serverSource).toContain('function pruneSseClientsForUser');
    });
});
