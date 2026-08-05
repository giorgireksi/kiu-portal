import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}


describe('scheduler and LMS regressions', () => {
  it('keeps admin-scheduler isolated from unrelated page bundles', () => {
    const schedulerSource = readSource('admin-scheduler.html');

    expect(schedulerSource).not.toContain('assets/js/pages/registration.js');
    expect(schedulerSource).not.toContain('assets/js/pages/planner.js');
    expect(schedulerSource).not.toContain('assets/js/pages/directories.js');
    expect(schedulerSource).not.toContain('assets/js/pages/student-registration.js');
    expect(schedulerSource).not.toContain('assets/js/pages/admin-registration.js');
    expect(schedulerSource).not.toContain('assets/js/pages/gradebook.js');
    expect(schedulerSource).not.toContain('assets/js/pages/lms.js');
  });

  it('normalizes LMS quiz builder drafts and preserves quiz security toggles on save', () => {
    const lmsSource = readSource('assets/js/pages/lms.js');
    const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js')
      + readSource('assets/js/pages/lms-quiz-workspace-session-runtime.js')
      + readSource('assets/js/pages/lms-quiz-model.js');
    const contentLibrarySource = readSource('assets/js/pages/lms-content-library-runtime.js');
    const weekStoreSource = readSource('assets/js/pages/lms-week-store-runtime.js');
    const lmsHtml = readSource('lms.html');

    expect(lmsHtml).not.toContain('assets/js/shared/social-hub.js');
    expect(lmsHtml).not.toContain('assets/js/shared/social-render.js');
    expect(lmsHtml).not.toContain('assets/js/shared/social-media.js');
    expect(lmsHtml).not.toContain('assets/js/shared/messenger.js');
    const tabsSrc = readFileSync(join(process.cwd(), 'assets/js/pages/lms-classroom-tabs-runtime.js'), 'utf8');
    expect(tabsSrc).toContain('assets/js/shared/messenger.js');
    expect(lmsHtml).not.toContain('assets/js/pages/lms-quiz-workspace-runtime.js');
    expect(readSource('assets/js/pages/lms-classroom-tabs-runtime.js')).toContain('assets/js/pages/lms-quiz-workspace-runtime.js?v=20260729-lmquizshare1');

    expect(quizWorkspaceSource).toContain('function normalizeLmsQuizBuilderDraftState(draft, context)');
    expect(quizWorkspaceSource).toContain('function normalizeLmsQuizBuilderAllowedStudentIds(studentIds = [])');
    expect(quizWorkspaceSource).toContain('uiState.editorDraft = normalizeLmsQuizBuilderDraftState(uiState.editorDraft, context);');
    expect(quizWorkspaceSource).toContain('allowedStudentIds: normalizeLmsQuizBuilderAllowedStudentIds(draft.allowedStudentIds)');
    expect(quizWorkspaceSource).toContain('requiresBlueExamNetwork: draft.requiresBlueExamNetwork === true');
    expect(quizWorkspaceSource).toContain('attendanceGateEnabled: draft.attendanceGateEnabled !== false');
    expect(quizWorkspaceSource).toContain("console.error('Staff LMS quiz workspace render failed', error);");
    expect(weekStoreSource).toContain("overlay.className = 'lms-quiz-board-overlay lms-week-manager-overlay lms-glass-dialog-overlay';");
    expect(weekStoreSource).toContain("hookClass: 'lms-quiz-board-modal lms-week-manager-modal lms-week-manager-modal-shell'");
    expect(weekStoreSource).toContain('lms-week-manager-chip-btn');
    expect(contentLibrarySource).toContain('class="lms-concept-leader-list"');
    expect(quizWorkspaceSource).not.toContain('existingQuiz?.requiresBlueExamNetwork === true || draft.requiresBlueExamNetwork === true');
    expect(quizWorkspaceSource).not.toContain('existingQuiz?.attendanceGateEnabled !== false && draft.attendanceGateEnabled !== false');
    expect(lmsSource).not.toContain('function normalizeLmsQuizBuilderDraftState(draft, context)');
  });

  it('keeps LMS interactions delegated instead of emitting inline event attributes', () => {
    const lmsSource = readSource('assets/js/pages/lms.js')
      + readSource('assets/js/pages/lms-section-quiz-runtime.js');
    const classroomTabsSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js')
      + readSource('assets/js/pages/lms-classroom-tabs-panel-runtime.js')
      + readSource('assets/js/pages/lms-classroom-tabs-shell-runtime.js');

    expect(lmsSource).toContain("bindDelegatedEvent('click', 'data-lms-click')");
    expect(lmsSource).toContain("bindDelegatedEvent('change', 'data-lms-change')");
    expect(lmsSource).toContain("bindDelegatedEvent('input', 'data-lms-input')");
    expect(lmsSource).toContain('<div id="gradebook-spreadsheet-view" class="lms-route-stack" hidden>');
    expect(lmsSource).toContain('<div id="gradebook-student-view" class="lms-route-stack lms-route-stack-mb-16" hidden></div>');
    expect(lmsSource).toContain('class="lms-route-panel lms-route-panel-compact lms-week-accordion-panel home-hover-chip${isOpen ? \'\' : \' is-collapsed\'}"');
    expect(lmsSource).toContain('class="lms-week-accordion-body"${isOpen ? \'\' : \' hidden\'}>');
    expect(classroomTabsSource).toContain('function setLmsPageSectionShown(section, shown) {');
    expect(classroomTabsSource).toContain("setLmsPageSectionShown(document.getElementById('page-lms'), false);");
    expect(classroomTabsSource).toContain("setLmsPageSectionShown(document.getElementById('page-lms-groups'), true);");
    expect(classroomTabsSource).toContain('const gradebookVisible = isLmsElementShown(gbWrapper);');
    expect(classroomTabsSource).toContain('setLmsElementShown(spreadsheetShell, false);');
    expect(classroomTabsSource).not.toContain("document.getElementById('page-lms').style.display = 'none';");
    expect(classroomTabsSource).not.toContain("document.getElementById('page-lms-groups').style.display = 'block';");
    expect(lmsSource).not.toMatch(/onclick=|onchange=|oninput=|onmouseover=|onmouseout=|ondrop=|ondragover=/);
  });

  it('avoids reloading LMS runtime scripts when a different cache-bust version is already on the page', () => {
    const appSource = readSource('assets/js/app/app.js');
    const bootSource = readSource('assets/js/pages/lms-route-boot.js');

    expect(appSource).toContain('function findRuntimeScriptByPath(src)');
    expect(appSource).toContain('findExistingRuntimeScript(src) || findRuntimeScriptByPath(src)');
    expect(appSource).toContain('LMS_CLASSROOM_TABS_RUNTIME_SCRIPT');
    expect(appSource).toContain('assets/js/pages/lms-classroom-tabs-runtime.js?v=20260715-lms-lazy7');
    expect(bootSource).toContain('ensureLmsQuizRuntime');
    expect(bootSource).toContain('preloadLmsQuizRuntimeIfNeeded');
    expect(bootSource).toContain('ensurePortalLmsRuntimeLoaded');
    expect(bootSource).not.toMatch(/ensureLmsExtendedRuntimeForTab[\s\S]{0,220}ensurePortalRegistrationRuntimeLoaded\(\)\)\.catch/);
  });
});
