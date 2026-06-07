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
        expect(quizWorkspaceSource).toContain("overlay.className = 'lms-quiz-access-overlay';");
        expect(quizWorkspaceSource).toContain('class="lms-quiz-access-dialog"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-access-student-row"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-card-status is-${escapeHtml(lifecycle)}"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-card-group-list"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-card-alert-panel"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-card-variant-pill"');
        expect(quizWorkspaceSource).toContain("overlay.className = 'lms-quiz-board-overlay';");
        expect(quizWorkspaceSource).toContain('class="lms-quiz-board-modal"');
        expect(quizWorkspaceSource).toContain("overlay.className = 'lms-quiz-board-overlay lms-quiz-review-board-overlay';");
        expect(quizWorkspaceSource).toContain('class="lms-quiz-board-modal lms-quiz-review-board-modal"');
        expect(quizWorkspaceSource).toContain("overlay.className = 'lms-quiz-board-overlay lms-quiz-review-paper-overlay';");
        expect(quizWorkspaceSource).toContain('class="lms-quiz-board-modal lms-quiz-review-paper-modal"');
        expect(quizWorkspaceSource).toContain('lms-quiz-board-tab');
        expect(quizWorkspaceSource).toContain("class=\"lms-quiz-question-nav-btn ${isActive ? 'is-active' : ''}\"");
        expect(quizWorkspaceSource).toContain('class="lms-quiz-option-row"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-answer-textarea"');
        expect(quizWorkspaceSource).toContain("class=\"lms-quiz-variant-tab ${activeVariant?.id === variant.id ? 'is-active' : ''}\"");
        expect(quizWorkspaceSource).toContain('class="lms-quiz-variant-question-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-variant-empty"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-shell lms-quiz-builder"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-stat-grid"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-alert-summary"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-question-nav-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-question-editor-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-question-save-row"');
        expect(quizWorkspaceSource).toContain('class="lms-live-monitor-panel ${hasFreshMonitorAlert ? \'lms-monitor-flash-panel\' : \'\'}"');
        expect(quizWorkspaceSource).toContain('class="lms-live-monitor-card"');
        expect(quizWorkspaceSource).toContain('lms-live-monitor-action-open');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-layout"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-main-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-control"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-variant-toggle"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-variant-workspace"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-variant-tab-row"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-card"');
        expect(quizWorkspaceSource).toContain("statusNode.classList.add('is-warning');");
        expect(quizWorkspaceSource).toContain("statusNode.classList.remove('is-warning');");
        expect(quizWorkspaceSource).toContain("actionButton.classList.add('is-locked');");
        expect(quizWorkspaceSource).toContain("actionButton.classList.remove('is-locked');");
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-status-pill ${badgeToneClass}"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-question-card"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-result-card lms-quiz-result-shell"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-result-grid lms-quiz-result-grid"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-result-item"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-notice is-warning lms-quiz-state-notice lms-quiz-state-notice--pending-review"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-state-notice-title"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-state-notice-copy"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-notice is-muted lms-quiz-state-notice lms-quiz-state-notice--latest-event"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-notice is-info lms-quiz-state-notice lms-quiz-state-notice--upcoming"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-notice is-danger lms-quiz-state-notice lms-quiz-state-notice--closed"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover lms-quiz-gate-shell"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-inner is-compact lms-quiz-gate-shell-inner"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-title lms-quiz-gate-shell-title"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-copy lms-quiz-gate-shell-copy"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-panel lms-quiz-gate-panel ${sessionGate.startUnlocked ? \'is-success\' : \'is-info\'}"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-rules lms-quiz-gate-rules"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-rule-list lms-quiz-gate-rule-list"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-actions lms-quiz-gate-actions"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover is-info lms-quiz-lock-shell"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover is-danger lms-quiz-lock-shell"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-inner lms-quiz-lock-shell-inner"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-copy lms-quiz-lock-shell-copy"');
        expect(quizWorkspaceSource).toContain('class="lms-student-quiz-cover-pill-row lms-quiz-lock-shell-pill-row"');
        expect(quizWorkspaceSource).toContain('lms-quiz-review-status-pill');
        expect(quizWorkspaceSource).toContain('lms-quiz-review-monitor-pill');
        expect(quizWorkspaceSource).toContain('lms-quiz-review-action-row');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-summary-grid"');
        expect(quizWorkspaceSource).toContain('class="lms-route-card lms-route-panel-compact lms-quiz-review-summary-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-summary-notice is-warning"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-summary-title"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-summary-copy"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-th-left">ID</th>');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-th-left">Student</th>');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-th-left">Monitoring</th>');
        expect(quizWorkspaceSource).toContain('lms-quiz-review-paper-shell');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-paper-metric-card lms-quiz-review-paper-stat-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-paper-metric-label"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-paper-metric-value"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-paper-metric-copy"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-paper-attendance-title">Exam List</span>');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-review-paper-attendance"><span class="lms-quiz-review-paper-attendance-title">Attendance</span>');
        expect(quizWorkspaceSource).toContain('class="kiu-btn-outline lms-quiz-action-btn lms-quiz-review-paper-secondary-action-btn"');
        expect(quizWorkspaceSource).toContain('lms-quiz-review-question-card');
        expect(quizWorkspaceSource).toContain('lms-quiz-review-option-list');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-saved-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-error-card"');
        expect(quizWorkspaceSource).toContain('class="lms-quiz-empty-state"');
        expect(quizWorkspaceSource).not.toContain("overlay.style.cssText = 'position:fixed; inset:0; z-index:8200;");
        expect(quizWorkspaceSource).not.toContain("overlay.style.cssText = 'position:fixed; inset:0; z-index:7800;");
        expect(quizWorkspaceSource).not.toContain('style="width:min(760px, 100%)');
        expect(quizWorkspaceSource).not.toContain('data-quiz-id="${escapeHtml(quiz.id)}" style="background:white; border:1px solid #dbe7f5; border-radius:18px; padding:18px; box-shadow:0 14px 30px rgba(15, 23, 42, 0.05);"');
        expect(quizWorkspaceSource).not.toContain('data-lms-student-quiz-card="true" style="background:var(--lux-surface); border:1px solid #dbe7f5; border-radius:20px; padding:18px; box-shadow:0 14px 30px rgba(15,23,42,0.05);"');
        expect(quizWorkspaceSource).not.toContain('id="lms-student-quiz-countdown" style="background:rgba(255,255,255,0.12);');
        expect(quizWorkspaceSource).not.toContain("button.style.opacity = '0.55';");
        expect(quizWorkspaceSource).not.toContain("button.style.cursor = 'not-allowed';");
        expect(quizWorkspaceSource).not.toContain("button.style.opacity = '';");
        expect(quizWorkspaceSource).not.toContain("button.style.cursor = '';");
        expect(quizWorkspaceSource).not.toContain("statusNode.style.color = '#b45309';");
        expect(quizWorkspaceSource).not.toContain("statusNode.style.fontWeight = '800';");
        expect(quizWorkspaceSource).not.toContain('style="text-align:left;">ID</th>');
        expect(quizWorkspaceSource).not.toContain('style="text-align:left;">Student</th>');
        expect(quizWorkspaceSource).not.toContain('style="text-align:left;">Monitoring</th>');
        expect(quizWorkspaceSource).not.toContain("panel.style.display = 'none';");
        expect(quizWorkspaceSource).not.toContain("panel.style.display = 'block';");

        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-access-overlay');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-access-dialog');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-access-student-row');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-card-status.is-published');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-card-group-list');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-card-alert-panel');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-card-variant-pill');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-board-overlay');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-board-modal');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-board-overlay');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-overlay');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-board-modal');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-modal');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-board-tab');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-question-nav-btn');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-option-row');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-answer-textarea');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-variant-tab');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-variant-question-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-variant-empty');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-studio-shell');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-studio-stat-grid');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-studio-alert-summary');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-question-nav-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-question-editor-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-question-save-row');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-live-monitor-panel');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-live-monitor-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-live-monitor-action-open');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-studio-layout');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-studio-main-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-studio-control');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-variant-toggle');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-variant-workspace');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-variant-tab-row');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-card-status.is-warning');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-primary-btn.is-locked:disabled');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-status-pill');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-question-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-cover');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-student-quiz-result-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-state-notice-title {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-state-notice-copy {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-state-notice-meta {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-result-shell {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-result-item {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-gate-shell-inner {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-gate-shell-copy {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-gate-panel-copy {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-gate-rules {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-gate-rule-list {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-gate-actions {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-attendance-title {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-secondary-action-btn {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-lock-shell-inner {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-lock-shell-copy {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-lock-shell-pill-row {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-status-pill');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-monitor-pill');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-action-row');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-summary-grid {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-summary-card {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-summary-notice {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-summary-title {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-summary-copy {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-th-left');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-shell');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-metric-card {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-metric-label {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-metric-value {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-paper-metric-copy {');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-question-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-review-option-list');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-saved-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-error-card');
        expect(readSource('assets/css/lms-route.css')).toContain('.lms-quiz-empty-state');

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

    it('uses lms-quiz-builder glass tokens for the Group Quiz Studio shell', () => {
        const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const lmsRouteCss = readSource('assets/css/lms-route.css');

        expect(quizWorkspaceSource).toContain('class="lms-quiz-studio-shell lms-quiz-builder"');

        const builderBlockStart = lmsRouteCss.indexOf('body.lux-route-lms .lms-quiz-builder {');
        expect(builderBlockStart).toBeGreaterThan(-1);
        const builderBlockEnd = lmsRouteCss.indexOf('/* Panels & cards base */', builderBlockStart);
        expect(builderBlockEnd).toBeGreaterThan(builderBlockStart);
        const builderBlock = lmsRouteCss.slice(builderBlockStart, builderBlockEnd);

        expect(builderBlock).toContain('.lms-quiz-studio-main-card');
        expect(builderBlock).toContain('.lms-quiz-rules-card');
        expect(builderBlock).toContain('var(--lms-fade-surface)');
        expect(builderBlock).toContain('var(--lms-fade-surface-soft)');
        expect(builderBlock).toContain('var(--lms-fade-control)');
        expect(builderBlock).not.toMatch(/\.lms-quiz-rules-card[\s\S]*background:\s*white\b/);
        expect(builderBlock).not.toMatch(/\.lms-quiz-studio-main-card[\s\S]*background:\s*white\b/);
        expect(builderBlock).not.toMatch(/background:\s*#ffffff\b/);
    });

    it('surfaces delegated quiz action failures and warns when admin View-as hits student quiz UI', () => {
        const lmsSource = readSource('assets/js/pages/lms.js');
        const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const authSource = readSource('assets/js/app/auth.js');

        expect(lmsSource).toContain('alert(\'This LMS action could not run. Check the browser console for details.\');');
        expect(quizWorkspaceSource).toContain('admin View-as is routed to the student quiz UI');
        expect(authSource).toContain('Could not clear stale impersonation keys for faculty account');
    });

    it('re-renders staff quiz builder when the Quiz tab uses is-active', () => {
        const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');

        expect(quizWorkspaceSource).toContain('function isLmsQuizTabActive(quizTab)');
        expect(quizWorkspaceSource).toContain("quizTab.classList.contains('is-active')");
        expect(quizWorkspaceSource).toMatch(
            /function rerenderCurrentLmsQuizWorkspace\(\)[\s\S]*isLmsQuizTabActive\(quizTab\)/
        );
        expect(quizWorkspaceSource).not.toMatch(
            /function rerenderCurrentLmsQuizWorkspace\(\)[\s\S]*classList\.contains\('active'\)\) return/
        );
        expect(quizWorkspaceSource).toMatch(
            /function resetLmsQuizBuilderDraft[\s\S]*rerenderCurrentLmsQuizWorkspace\(\)/
        );
    });

    it('avoids duplicate quiz tab enhancement chrome and keeps tab cache in sync', () => {
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const lmsHtml = readSource('lms.html');

        expect(classroomSource).toContain('function syncLmsTabRenderCacheFromDom');
        expect(classroomSource).toMatch(
            /function enhanceLmsTabExperience[\s\S]*if \(tab === 'quiz'\)[\s\S]*return;/
        );
        expect(classroomSource).toContain('window.syncLmsTabRenderCacheFromDom = syncLmsTabRenderCacheFromDom');
        expect(quizWorkspaceSource).toContain('cleanupLmsInjectedEnhancementBlocks(contentArea)');
        expect(quizWorkspaceSource).toContain('window.syncLmsTabRenderCacheFromDom');
        expect(lmsSource).toContain('switchLMSTab(activeTab, { force: true })');
        expect(lmsHtml).toContain('updateTransparency(savedTransparency, { roots })');
        expect(lmsHtml).toContain("contentArea?.dataset?.activeLmsTab === 'quiz'");
    });
});
