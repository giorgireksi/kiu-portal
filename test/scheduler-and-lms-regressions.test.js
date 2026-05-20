import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
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
    const quizWorkspaceSource = readSource('assets/js/pages/lms-quiz-workspace-runtime.js');
    const lmsHtml = readSource('lms.html');

    expect(lmsHtml).not.toContain('assets/js/shared/social-hub.js');
    expect(lmsHtml).not.toContain('assets/js/shared/social-render.js');
    expect(lmsHtml).not.toContain('assets/js/shared/social-media.js');
    expect(lmsHtml).toContain('assets/js/shared/messenger.js');
    expect(lmsHtml).toContain('assets/js/pages/lms-quiz-workspace-runtime.js?v=20260518-lmsquizworkspace1');

    expect(quizWorkspaceSource).toContain('function normalizeLmsQuizBuilderDraftState(draft, context)');
    expect(quizWorkspaceSource).toContain('function normalizeLmsQuizBuilderAllowedStudentIds(studentIds = [])');
    expect(quizWorkspaceSource).toContain('uiState.editorDraft = normalizeLmsQuizBuilderDraftState(uiState.editorDraft, context);');
    expect(quizWorkspaceSource).toContain('allowedStudentIds: normalizeLmsQuizBuilderAllowedStudentIds(draft.allowedStudentIds)');
    expect(quizWorkspaceSource).toContain('requiresBlueExamNetwork: draft.requiresBlueExamNetwork === true');
    expect(quizWorkspaceSource).toContain('attendanceGateEnabled: draft.attendanceGateEnabled !== false');
    expect(quizWorkspaceSource).toContain("console.error('Staff LMS quiz workspace render failed', error);");
    expect(quizWorkspaceSource).not.toContain('existingQuiz?.requiresBlueExamNetwork === true || draft.requiresBlueExamNetwork === true');
    expect(quizWorkspaceSource).not.toContain('existingQuiz?.attendanceGateEnabled !== false && draft.attendanceGateEnabled !== false');
    expect(lmsSource).not.toContain('function normalizeLmsQuizBuilderDraftState(draft, context)');
  });

  it('keeps LMS interactions delegated instead of emitting inline event attributes', () => {
    const lmsSource = readSource('assets/js/pages/lms.js');

    expect(lmsSource).toContain("bindDelegatedEvent('click', 'data-lms-click')");
    expect(lmsSource).toContain("bindDelegatedEvent('change', 'data-lms-change')");
    expect(lmsSource).toContain("bindDelegatedEvent('input', 'data-lms-input')");
    expect(lmsSource).not.toMatch(/onclick=|onchange=|oninput=|onmouseover=|onmouseout=|ondrop=|ondragover=/);
  });
});
