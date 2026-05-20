import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS live quiz workspace module split', () => {
    it('moves LMS live quiz workspace/state helpers out of lms.js and into the dedicated module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const liveQuizWorkspaceSource = readSource('assets/js/pages/lms-live-quiz-workspace-runtime.js');
        const liveQuizUiSource = readSource('assets/js/pages/lms-live-quiz-ui-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-live-quiz-workspace-runtime.js?v=20260518-lmslive1');
        expect(liveQuizWorkspaceSource).toContain('const LMS_LIVE_OPTION_KEYS = [\'A\', \'B\', \'C\', \'D\'];');
        expect(liveQuizWorkspaceSource).toContain('function ensureLmsLiveQuizWorkspace(resourceKey)');
        expect(liveQuizWorkspaceSource).toContain('function applyLmsLiveQuizWorkspace(resourceKey, workspace = null, options = {})');
        expect(liveQuizWorkspaceSource).toContain('function queueLmsLiveQuizBackendSync(resourceKey, reason = \'live-quiz\')');
        expect(liveQuizWorkspaceSource).toContain('function loadLmsLiveQuizWorkspace(resourceKey, options = {})');
        expect(liveQuizWorkspaceSource).toContain('function handleLmsLiveQuizRealtimeUpdate(payload = {})');
        expect(liveQuizWorkspaceSource).toContain('function getLmsLiveQuestionTimeState(question = {})');
        expect(liveQuizWorkspaceSource).toContain('function getLmsLiveGroupSummary(subjectId, groupId)');
        expect(liveQuizUiSource).toContain('function renderLmsLiveQuizSection(courseId)');
        expect(liveQuizUiSource).toContain('Object.assign(window, {');
        expect(liveQuizUiSource).toContain('renderLmsLiveQuizSection,');
        expect(liveQuizWorkspaceSource).not.toContain('function renderLmsLiveQuizSection(courseId)');
        expect(liveQuizWorkspaceSource).not.toContain('Object.assign(window, {');
        expect(liveQuizWorkspaceSource).not.toContain('renderLmsLiveQuizSection,');
        expect(lmsSource).not.toContain('function ensureLmsLiveQuizWorkspace(resourceKey)');
        expect(lmsSource).not.toContain('function applyLmsLiveQuizWorkspace(resourceKey, workspace = null, options = {})');
        expect(lmsSource).not.toContain('function queueLmsLiveQuizBackendSync(resourceKey, reason = \'live-quiz\')');
        expect(lmsSource).not.toContain('function loadLmsLiveQuizWorkspace(resourceKey, options = {})');
        expect(lmsSource).not.toContain('function handleLmsLiveQuizRealtimeUpdate(payload = {})');
        expect(lmsSource).not.toContain('function getLmsLiveQuestionTimeState(question = {})');
        expect(lmsSource).not.toContain('function getLmsLiveGroupSummary(subjectId, groupId)');
        expect(lmsSource).not.toContain('function renderLmsLiveQuizSection(courseId)');
    });
});
