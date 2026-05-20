import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS quiz workspace module split', () => {
    it('moves the LMS quiz workspace and review surface out of lms.js and into the dedicated runtime module', () => {
        const lmsHtml = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');

        expect(lmsHtml).toContain('assets/js/pages/lms-quiz-workspace-runtime.js?v=20260518-lmsquizworkspace1');

        expect(quizWorkspaceSource).toContain('function openLmsQuizAccessDialog(resourceKey, quizId)');
        expect(quizWorkspaceSource).toContain('function ensureLmsQuizUiState(resourceKey)');
        expect(quizWorkspaceSource).toContain('function resolveLmsQuizWorkspace(courseKey = currentLmsQuizCourseKey || currentCourseId)');
        expect(quizWorkspaceSource).toContain('const LMS_STUDENT_QUIZ_FOCUS_STATE_KEY = \'KIU_LMS_STUDENT_QUIZ_FOCUS_STATE\';');
        expect(quizWorkspaceSource).toContain('function syncLmsStudentQuizFocusChrome(state = null)');
        expect(quizWorkspaceSource).toContain('function getLmsStudentQuizFocusState()');
        expect(quizWorkspaceSource).toContain('function enableLmsStudentQuizFocusMode(resourceKey, quizId, studentMeta = {}, warningMessage = \'\')');
        expect(quizWorkspaceSource).toContain('function disableLmsStudentQuizFocusMode()');
        expect(quizWorkspaceSource).toContain('function renderLmsStaffQuizWorkspace(context)');
        expect(quizWorkspaceSource).toContain('function renderLmsStudentQuizWorkspace(context)');
        expect(quizWorkspaceSource).toContain('function renderLmsQuizSection(courseId)');
        expect(quizWorkspaceSource).toContain('function renderLmsQuizReviewPanel(resourceKey, quiz)');
        expect(quizWorkspaceSource).toContain('function saveLmsQuizManualGrade(resourceKey, quizId, studentId, attendanceId, scopeToken = \'\', focusSectionKey = \'\', studentName = \'\')');

        expect(lmsSource).not.toContain('function openLmsQuizAccessDialog(resourceKey, quizId)');
        expect(lmsSource).not.toContain('function ensureLmsQuizUiState(resourceKey)');
        expect(lmsSource).not.toContain('function resolveLmsQuizWorkspace(courseKey = currentLmsQuizCourseKey || currentCourseId)');
        expect(lmsSource).not.toContain('const LMS_STUDENT_QUIZ_FOCUS_STATE_KEY = \'KIU_LMS_STUDENT_QUIZ_FOCUS_STATE\';');
        expect(lmsSource).not.toContain('function syncLmsStudentQuizFocusChrome(state = null)');
        expect(lmsSource).not.toContain('function getLmsStudentQuizFocusState()');
        expect(lmsSource).not.toContain('function enableLmsStudentQuizFocusMode(resourceKey, quizId, studentMeta = {}, warningMessage = \'\')');
        expect(lmsSource).not.toContain('function disableLmsStudentQuizFocusMode()');
        expect(lmsSource).not.toContain('function renderLmsStaffQuizWorkspace(context)');
        expect(lmsSource).not.toContain('function renderLmsStudentQuizWorkspace(context)');
        expect(lmsSource).not.toContain('function renderLmsQuizSection(courseId)');
        expect(lmsSource).not.toContain('function renderLmsQuizReviewPanel(resourceKey, quiz)');
        expect(lmsSource).not.toContain('function saveLmsQuizManualGrade(resourceKey, quizId, studentId, attendanceId, scopeToken = \'\', focusSectionKey = \'\', studentName = \'\')');
    });
});
