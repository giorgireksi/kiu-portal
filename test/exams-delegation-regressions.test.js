import { describe, expect, it } from 'vitest';
import { expectRetiredCss } from './helpers/bare-shell-css.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('exams delegation regressions', () => {
    it('exam-studio route paint CSS is retired (bare shell era)', () => {
        expectRetiredCss('exam-studio.css');
        const html = readSource('exams.html');
        expect(html).toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('exam-studio.css');
    });

    it('keeps the exams console and lazy companion modules on delegated actions and field handlers', () => {
        const baseSource = readSource('assets/js/pages/exams-console.js');
        const builderSource = readSource('assets/js/pages/exams-console-builder.js');
        const adminSource = readSource('assets/js/pages/exams-console-admin.js');
        const attemptsSource = readSource('assets/js/pages/exams-console-attempts.js');
        const combined = `${baseSource}\n${builderSource}\n${adminSource}\n${attemptsSource}`;

        expect(baseSource).toContain('function invokeExamDelegate(fnName, rawArgs, target)');
        expect(baseSource).toContain('data-exam-call="setExamTab"');
        expect(baseSource).toContain('data-exam-change-call="${updateFunc}"');
        expect(builderSource).toContain('function setAutoGenVariantCount(value)');
        expect(builderSource).toContain('data-exam-call="saveAndSubmitExamTemplate"');
        expect(builderSource).toContain('data-exam-input-call="syncExamTemplateField"');
        expect(builderSource).toContain('class="ex2-field ex2-field--compact ex2-field--points"');
        expect(builderSource).toContain('class="ex2-field-label-11">Points</span>');
        expect(builderSource).toContain('class="ex2-input ex2-input--points"');
        expect(builderSource).toContain('class="ex2-field ex2-field--compact ex2-field--options"');
        expect(builderSource).toContain('class="ex2-input ex2-input--options"');
        expect(builderSource).toContain('class="ex2-question-card-title ex2-question-card-title--builder"');
        expect(builderSource).toContain('class="ex2-status ex2-question-card-status is-neutral"');
        expect(builderSource).toContain('class="ex2-meta ex2-question-card-meta"');
        expect(builderSource).toContain('class="ex2-field-label">Question text</span>');
        expect(builderSource).toContain('class="ex2-field-label">Correct option</span>');
        expect(builderSource).toContain('class="ex2-field-label">Options</span>');
        expect(builderSource).toContain('class="ex2-option-index">');
        expect(builderSource).toContain('class="ex2-list-copy-truncate"');
        expect(builderSource).toContain('class="ex2-list-item ex2-list-item--compact"');
        expect(builderSource).toContain('class="ex2-list-item-head"');
        expect(builderSource).toContain('class="ex2-list-item-title"');
        expect(builderSource).toContain('class="ex2-list-item-meta"');
        expect(builderSource).toContain('class="ex2-field-label">Exam title</span>');
        expect(builderSource).toContain('class="ex2-field-label">Subject</span>');
        expect(builderSource).toContain('class="ex2-field-label">Number of variants</span>');
        expect(builderSource).toContain('class="ex2-field-label">Questions per variant</span>');
        expect(builderSource).toContain('class="ex2-qnav-label">Question</label>');
        expect(builderSource).toContain('class="ex2-qnav-count">of ${total}</span>');
        expect(builderSource).toContain('class="ex2-empty ex2-builder-empty"');
        expect(builderSource).toContain('class="ex2-builder-empty-copy"');
        expect(builderSource).toContain('class="ex2-warning ex2-builder-warning"');
        expect(builderSource).toContain('class="ex2-builder-warning-copy"');
        expect(builderSource).toContain('class="step-num ex2-progress-step-num"');
        expect(builderSource).toContain('class="step-label ex2-progress-step-label"');
        expect(builderSource).toContain('class="ex2-panel-head ex2-panel-head--flush"');
        expect(builderSource).toContain('class="ex2-builder-section-title"');
        expect(builderSource).toContain('class="ex2-builder-section-copy"');
        expect(builderSource).toContain('class="ex2-form-grid ex2-form-grid--mt-12"');
        expect(builderSource).toContain('class="ex2-inline-actions ex2-inline-actions--mt-14 ex2-inline-actions--gap-10"');
        expect(builderSource).toContain('class="ex2-inline-actions ex2-inline-actions--mt-8"');
        expect(builderSource).toContain('class="ex2-review-copy"');
        expect(builderSource).toContain('class="ex2-review-card-title"');
        expect(builderSource).toContain('ex2-review-card-meta');
        expect(builderSource).toContain('ex2-list-card ex2-list-card--pad-16');
        expect(builderSource).toContain('class="ex2-list-card ex2-list-card--pad-16 ex2-variant-summary-card"');
        expect(builderSource).toContain('class="ex2-variant-summary-title"');
        expect(builderSource).toContain('ex2-variant-summary-meta');
        expect(builderSource).toContain('class="ex2-review-card ex2-review-card--accent"');
        expect(builderSource).toContain('class="ex2-review-copy ex2-review-copy--tight"');
        expect(builderSource).toContain('class="ex2-review-summary-card"');
        expect(builderSource).toContain('class="ex2-review-summary-value"');
        expect(builderSource).toContain('class="ex2-review-summary-label"');
        expect(builderSource).toContain('class="ex2-builder-title"');
        expect(builderSource).toContain('class="ex2-builder-step-body lux-soft-chrome ex2-panel--animated"');
        expect(builderSource).toContain('class="ex2-builder-summary-strip"');
        expect(builderSource).toContain('class="ex2-summary-chip-label"');
        expect(builderSource).toContain('class="ex2-summary-chip-value"');
        expect(builderSource).toContain('ex2-builder-summary-share');
        expect(builderSource).not.toContain('class="ex2-live-sidebar"');
        expect(builderSource).not.toContain('style="margin:0;min-width:80px;"');
        expect(builderSource).not.toContain('style="width:70px;"');
        expect(builderSource).not.toContain('style="margin:0;min-width:110px;"');
        expect(builderSource).not.toContain('style="width:86px;"');
        expect(builderSource).not.toContain('style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"');
        expect(builderSource).not.toContain('style="padding:0;"');
        expect(builderSource).not.toContain('style="margin-top:12px;"');
        expect(builderSource).not.toContain('style="margin-top:14px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;"');
        expect(builderSource).not.toContain('style="font-size:12px;"');
        expect(builderSource).not.toContain('style="margin-top:8px;"');
        expect(builderSource).not.toContain('style="margin-top:10px;"');
        expect(builderSource).not.toContain('style="padding:16px;"');
        expect(builderSource).not.toContain('style="border-color:rgba(var(--lux-accent-rgb),0.3);"');
        expect(builderSource).not.toContain('style="font-size:13px;color:var(--lux-text-muted);line-height:1.6;"');
        expect(builderSource).not.toContain('style="animation: exSlideIn .3s ease;"');
        expect(builderSource).not.toContain('style="width:100%;justify-content:center;"');
        expect(adminSource).toContain('function setExamSplitStudentCount(value)');
        expect(adminSource).toContain('data-exam-call="saveExamSchedule"');
        expect(adminSource).toContain('data-exam-change-call="updateExamScheduleField"');
        expect(adminSource).toContain('class="ex2-field-label">Feedback for the Professor/TA (required)</span>');
        expect(adminSource).toContain('class="ex2-cohort-check-label">');
        expect(adminSource).toContain('class="ex2-mini-list-item">');
        expect(adminSource).toContain('class="ex2-mini-list-item ex2-mini-list-item--muted"');
        expect(adminSource).toContain('class="ex2-field-label">Approved Template</span>');
        expect(adminSource).toContain('class="ex2-field-label">Start</span>');
        expect(adminSource).toContain('class="ex2-field-label">Overflow room</span>');
        expect(adminSource).toContain('class="ex2-copy-muted ex2-copy-muted--mt-6"');
        expect(adminSource).toContain('class="ex2-collision-item">');
        expect(adminSource).toContain('class="ex2-collision-item ex2-collision-item--overflow"');
        expect(adminSource).toContain('class="ex2-form-grid ex2-form-grid--mt-8"');
        expect(adminSource).toContain('class="ex2-btn is-secondary ex2-btn--mt-10"');
        expect(adminSource).toContain('class="ex2-panel-title"');
        expect(adminSource).toContain('class="ex2-panel-copy"');
        expect(adminSource).toContain('class="ex2-empty-state ex2-schedule-groups-empty"');
        expect(adminSource).toContain('class="ex2-empty-state ex2-schedule-sessions-empty"');
        expect(adminSource).toContain('class="ex2-empty-state-copy"');
        expect(adminSource).toContain('class="ex2-status ex2-session-published-pill is-approved ex2-status--ml-6"');
        expect(adminSource).toContain('class="ex2-meta ex2-cohort-card-meta"');
        expect(adminSource).toContain('class="ex2-card-copy ex2-cohort-card-copy"');
        expect(adminSource).toContain('class="ex2-rq-board"');
        expect(adminSource).toContain('class="ex2-rq-card"');
        expect(adminSource).toContain('class="ex2-rq-column-head"');
        expect(adminSource).toContain('class="ex2-rq-summary-chips"');
        expect(adminSource).toContain('class="ex2-rq-card-author"');
        expect(adminSource).toContain('class="ex2-rq-card-faculty"');
        expect(adminSource).toContain('class="ex2-rq-card-title"');
        expect(adminSource).toContain('class="ex2-rq-card-meta"');
        expect(adminSource).toContain('class="ex2-rq-toolbar"');
        expect(adminSource).toContain('class="ex2-rq-column-count');
        expect(adminSource).toContain('class="ex2-rq-avatar"');
        expect(adminSource).toContain('class="ex2-status ex2-session-status-chip is-');
        expect(adminSource).toContain('class="ex2-status ex2-session-published-pill is-approved ex2-status--ml-6"');
        expect(adminSource).toContain('class="ex2-session-head-main"');
        expect(adminSource).toContain('class="ex2-session-card-title"');
        expect(adminSource).toContain('class="ex2-meta ex2-session-card-meta"');
        expect(adminSource).toContain('class="ex2-card-copy ex2-session-card-copy"');
        expect(adminSource).toContain('class="ex2-inline-actions ex2-session-action-row"');
        expect(adminSource).toContain('class="ex2-session-stat-card"');
        expect(adminSource).toContain('class="ex2-session-stat-value"');
        expect(adminSource).toContain('class="ex2-session-stat-label"');
        expect(adminSource).toContain('class="ex2-rq-card-actions"');
        expect(adminSource).toContain('class="ex2-divider ex2-divider--20"');
        expect(adminSource).toContain('class="ex2-summary-title"');
        expect(adminSource).toContain('class="ex2-session-summary-card"');
        expect(adminSource).toContain('class="ex2-session-summary-value"');
        expect(adminSource).toContain('class="ex2-session-summary-label"');
        expect(adminSource).toContain('class="ex2-digital-pin"');
        expect(adminSource).toContain('class="ex2-digital-pin-label"');
        expect(adminSource).toContain('class="ex2-digital-pin-value"');
        expect(adminSource).toContain('class="fas fa-calendar-plus ex2-heading-icon"');
        expect(adminSource).not.toContain('style="font-size:12px;color:var(--lux-text-muted);margin:6px 0;"');
        expect(adminSource).not.toContain('style="margin-top:8px;"');
        expect(adminSource).not.toContain('style="margin-top:10px;"');
        expect(adminSource).not.toContain('style="margin-left:6px;"');
        expect(adminSource).not.toContain('style="display:grid;gap:14px;"');
        expect(adminSource).not.toContain('style="cursor:default;"');
        expect(adminSource).not.toContain('style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;"');
        expect(adminSource).not.toContain('style="font-size:17px;font-weight:700;margin:0 0 6px;"');
        expect(adminSource).not.toContain('style="font-size:13px;color:var(--lux-text-muted);margin-bottom:12px;"');
        expect(adminSource).not.toContain('style="margin-top:16px;"');
        expect(adminSource).not.toContain('style="border-top:1px solid var(--lux-border);margin:20px 0;"');
        expect(adminSource).not.toContain('style="font-size:15px;font-weight:700;margin-bottom:6px;"');
        expect(adminSource).not.toContain('style="margin-top:16px;padding:14px;border-radius:14px;border:1px solid var(--lux-border);text-align:center;"');
        expect(attemptsSource).toContain('data-exam-call="runExamStudentAction"');
        expect(attemptsSource).toContain('data-exam-input-call="updateExamManualGradeDraft"');
        expect(attemptsSource).toContain('class="ex2-panel-title"');
        expect(attemptsSource).toContain('class="ex2-panel-copy"');
        expect(attemptsSource).toContain('class="ex2-empty-copy"');
        expect(attemptsSource).toContain('class="ex2-select-card-title"');
        expect(attemptsSource).toContain('class="ex2-select-card-copy"');
        expect(attemptsSource).toContain('class="ex2-select-card-state"');
        expect(attemptsSource).toContain('class="ex2-attempt-identity"');
        expect(attemptsSource).toContain('class="ex2-attempt-student-name"');
        expect(attemptsSource).toContain('class="ex2-attempt-student-meta"');
        expect(attemptsSource).toContain('class="ex2-attempt-meta-item"');
        expect(attemptsSource).toContain('class="ex2-muted ex2-manual-note"');
        expect(attemptsSource).toContain('class="ex2-manual-score-label"');
        expect(attemptsSource).toContain('class="ex2-input is-small ex2-manual-score-input"');
        expect(attemptsSource).toContain('class="ex2-btn is-primary ex2-manual-score-save"');
        expect(attemptsSource).toContain('class="ex2-inline-actions ex2-manual-grade-actions"');
        expect(attemptsSource).toContain('class="ex2-btn is-primary ex2-manual-grade-save"');
        expect(attemptsSource).toContain('class="ex2-activity-metric"');
        expect(attemptsSource).toContain('class="ex2-activity-metric-value"');
        expect(attemptsSource).toContain('class="ex2-activity-metric-label"');
        expect(attemptsSource).toContain('class="ex2-results-meta-item"');
        expect(attemptsSource).toContain('class="ex2-response-summary-copy"');































































































        expect(combined).not.toContain('onclick=');
        expect(combined).not.toContain('onchange=');
        expect(combined).not.toContain('oninput=');
        expect(combined).not.toContain('ondragover=');
        expect(combined).not.toContain('ondrop=');
    });

    it('patches exam regions without full root wipe on builder field changes', () => {
        const baseSource = readSource('assets/js/pages/exams-console.js');
        const builderSource = readSource('assets/js/pages/exams-console-builder.js');

        expect(baseSource).toContain('function setExamRegionMarkup');
        expect(baseSource).toContain('function ensureExamWorkspaceShell');
        expect(baseSource).toContain('data-exam-shell="1"');
        expect(baseSource).toContain('data-exam-region="chrome"');
        expect(baseSource).toContain('data-exam-region="body"');
        expect(baseSource).toContain('data-exam-region="modal"');
        expect(builderSource).toContain('data-exam-region="builder-toolbar"');
        expect(builderSource).toContain('data-exam-region="builder-stepper"');
        expect(builderSource).toContain('data-exam-region="builder-summary"');
        expect(builderSource).toContain('data-exam-region="builder-step"');

        const updateFieldBlock = baseSource.match(/window\.updateExamTemplateField\s*=\s*function[\s\S]*?^\s*\};/m);
        expect(updateFieldBlock).toBeTruthy();
        expect(updateFieldBlock[0]).not.toContain('renderConsole');
        expect(updateFieldBlock[0]).toContain('patchExamBuilderSummary');



    });

    it('keeps exam builder picker overflow rules and grouped summary layout', () => {
        const builderSource = readSource('assets/js/pages/exams-console-builder.js');





        expect(builderSource).toContain('ex2-builder-summary-groups');
        expect(builderSource).toContain('ex2-field-span ex2-field--picker');
        expect(builderSource).toContain('ex2-builder-toolbar-actions');
    });

    it('shows original bank numbers on variant question rows', () => {
        const builderSource = readSource('assets/js/pages/exams-console-builder.js');

        expect(builderSource).toContain('function resolveVariantQuestions');
        expect(builderSource).toContain('function buildBankIndexById');
        expect(builderSource).toContain('ex2-variant-bank-ref');
        expect(builderSource).toContain('Bank Q${bankNum}');
        expect(builderSource).toContain('resolveVariantQuestions(variant, bank)');

    });

    it('approves exam templates via getTemplateById and upsertTemplate', () => {
        const baseSource = readSource('assets/js/pages/exams-console.js');
        const workspaceSource = readSource('assets/js/pages/exams-console-workspace-runtime.js');
        const adminHooksBlock = baseSource.match(/window\.__kiuExamsAdminHooks[\s\S]*?renderExamModalShell[\s\S]*?\}\);/);
        expect(adminHooksBlock?.[0] || '').not.toContain('detectScheduleCollisions');
        expect(baseSource).toContain('Object.assign(window.__kiuExamsAdminHooks, {\n        detectScheduleCollisions,\n        generateExamPIN\n    });');
        expect(baseSource).toMatch(/Object\.assign\(__examsWorkspaceDeps,\s*\{[\s\S]*getRole,/);
        expect(baseSource).not.toMatch(/Object\.assign\(__examsWorkspaceDeps,\s*\{[\s\S]*?\btext,/);
        expect(baseSource).toContain('getTemplateById(templateId)');
        expect(workspaceSource).toMatch(/saveAndApproveExamTemplate[\s\S]*upsertTemplate/);
        expect(baseSource).not.toContain('getTemplateContainer().findIndex');
    });

    it('enables searchable lux picker on exam subject select', () => {
        const builderSource = readSource('assets/js/pages/exams-console-builder.js');
        const shellChrome = readSource('assets/js/features/luxury-shell-chrome.js');
        const controlsCss = readSource('assets/css/lux-controls.css');

        expect(builderSource).toContain('id="exam-template-subject"');
        expect(builderSource).toContain('data-lux-picker-search="true"');
        expect(builderSource).toContain('data-lux-picker-search-text');
        expect(shellChrome).toContain('function isLuxPickerSearchEnabled');
        expect(shellChrome).toContain('lux-picker-search-input');
        expect(shellChrome).toContain('data-lux-picker-search');
        expect(controlsCss).toContain('.lux-picker-panel--searchable');
        expect(controlsCss).toContain('.lux-picker-search-input');
    });
});
