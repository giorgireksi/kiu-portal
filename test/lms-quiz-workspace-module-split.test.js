import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS quiz workspace module split', () => {
    it('loads quiz workspace via LMS_QUIZ_MODULE_URLS peels (not eager HTML)', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const lmsHtml = readSource('lms.html');

        expect(tabs).toContain('LMS_QUIZ_MODULE_URLS');
        expect(tabs).toContain('assets/js/pages/lms-quiz-workspace-session-runtime.js');
        expect(tabs).toContain('assets/js/pages/lms-quiz-workspace-review-runtime.js');
        expect(tabs).toContain('assets/js/pages/lms-quiz-workspace-runtime.js?v=20260728-lmquiz4');
        expect(tabs).toContain('assets/js/pages/lms-quiz-focus-runtime.js');
        expect(lmsHtml).not.toMatch(/lms-quiz-workspace-runtime\.js\?v=20260518-lmsquizworkspace1/);
        expect(existsSync(join(process.cwd(), 'assets/css/lms-route.css'))).toBe(false);
    });

    it('session peel owns access dialog + quiz tab active helper', () => {
        const session = readSource('assets/js/pages/lms-quiz-workspace-session-runtime.js');
        expect(session).toContain('function openLmsQuizAccessDialog(resourceKey, quizId)');
        expect(session).toContain('function ensureLmsQuizUiState(resourceKey)');
        expect(session).toContain('function isLmsQuizTabActive(quizTab)');
        expect(session).toContain("quizTab.classList.contains('is-active')");
    });

    it('focus peel owns student quiz focus chrome helpers', () => {
        const focus = readSource('assets/js/pages/lms-quiz-focus-runtime.js');
        expect(focus).toContain('KIU_LMS_STUDENT_QUIZ_FOCUS_STATE');
        expect(focus).toMatch(/enableLmsStudentQuizFocusMode|syncLmsStudentQuizFocusChrome/);
    });

    it('workspace host renders staff/student surfaces and binds peeled session APIs', () => {
        const host = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const lmsSource = readSource('assets/js/pages/lms.js');

        expect(host).toContain('const openLmsQuizAccessDialog = window.openLmsQuizAccessDialog');
        expect(host).toContain('const isLmsQuizTabActive = window.isLmsQuizTabActive');
        expect(host).toContain('function renderLmsStaffQuizWorkspace(context)');
        expect(host).toContain('function renderLmsStudentQuizWorkspace(context)');
        expect(host).toContain('window.renderLmsQuizSection = renderLmsQuizSection');
    });

    it('does not redeclare formatLmsDateTime (global from utilities.js)', () => {
        const host = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        expect(host).not.toMatch(/const formatLmsDateTime\s*=/);
        expect(host).toMatch(/formatLmsDateTime: global from assets\/js\/shared\/utilities\.js/);
        expect(host).toMatch(/typeof syncLmsStudentQuizFocusChrome === 'function'/);
    });

    it('exam session peel exports quiz workspace lifecycle sync for renderLmsQuizSection', () => {
        const exam = readSource('assets/js/pages/lms-exam-session-runtime.js');
        const host = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        expect(exam).toContain('function syncLmsQuizWorkspaceLifecycle(resourceKey)');
        expect(exam).toMatch(/syncLmsQuizWorkspaceLifecycle,\s*\n\s*\};/);
        expect(host).toContain('syncLmsQuizWorkspaceLifecycle(context.resourceKey)');
    });

    it('waits for quiz module execution markers before loadLmsScriptOnce resolves', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(tabs).toContain('LMS_SCRIPT_EXECUTION_MARKERS');
        expect(tabs).toContain('waitForLmsScriptExecution');
        expect(tabs).toContain('hasLmsScriptExecuted');
        expect(tabs).toMatch(/lms-quiz-workspace-runtime\.js[\s\S]*renderLmsQuizSection/);
    });

    it('resolves loadLmsScriptOnce when quiz blue runtime is already parser-inserted', () => {
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        expect(tabs).toContain('queueMicrotask(() => {');
        expect(tabs).toMatch(/Parser-inserted defer\/classic scripts[\s\S]*lms-quiz-blue-runtime\.js/);
        expect(tabs).toContain("script.dataset.kiuInjected = '1'");
    });

    it('surfaces delegated quiz action failures and warns when admin View-as hits student quiz UI', () => {
        const lmsSource = readSource('assets/js/pages/lms.js');
        const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const host = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const authSource = readSource('assets/js/app/auth.js');

        expect(host).toContain('lms-quiz-card');
        expect(host).toContain('class="lms-quiz-studio-control lux-control"');
        expect(host).toContain('class="lms-quiz-question-control lux-control"');
        expect(host).toContain('class="lms-quiz-option-input lux-control"');
        expect(lmsSource).not.toContain('function openLmsQuizAccessDialog(resourceKey, quizId)');
        expect(lmsSource).not.toContain('function renderLmsStaffQuizWorkspace(context)');
        expect(lmsSource).toContain("alert('This LMS action could not run. Check the browser console for details.')");
        expect(quizWorkspaceSource).toContain('admin View-as is routed to the student quiz UI');
        expect(authSource).toContain('Could not clear stale impersonation keys for faculty account');
    });

    it('tab shell owns syncLmsTabRenderCacheFromDom; tabs host re-exports it', () => {
        const shell = readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');
        const tabs = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const session = readSource('assets/js/pages/lms-quiz-workspace-session-runtime.js');

        expect(shell).toContain('function syncLmsTabRenderCacheFromDom');
        expect(tabs).toContain('const syncLmsTabRenderCacheFromDom = window.syncLmsTabRenderCacheFromDom');
        expect(session).toMatch(/syncLmsTabRenderCacheFromDom/);
    });
});
