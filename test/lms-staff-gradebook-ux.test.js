import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('LMS embedded staff gradebook UX', () => {
    const gradebook = readSource('assets/js/pages/gradebook.js');
    const lms = readSource('assets/js/pages/lms.js');
    const lmsCss = readSource('assets/css/lms-route.css');

    it('detects LMS embedded gradebook context and branches staff init', () => {
        expect(gradebook).toContain('function isLmsEmbeddedGradebookContext()');
        expect(gradebook).toContain("document.body?.classList?.contains('lux-route-lms')");
        expect(gradebook).toContain('function initLmsEmbeddedStaffGradebook()');
        expect(gradebook).toContain('function initStaffModernGradebook()');
        expect(gradebook).toContain('if (isStaffModernGradebookContext() && isStaffRole)');
        expect(gradebook).toContain('initStaffModernGradebook();');
    });

    it('supports faculty standalone staff modern gradebook workspace', () => {
        const facultyHtml = readSource('faculty-gradebook.html');
        expect(facultyHtml).toContain('gradebook-faculty-staff-workspace');
        expect(gradebook).toContain("document.body?.classList?.contains('lux-route-faculty-gradebook')");
        expect(gradebook).toContain('function isFacultyStandaloneGradebookContext()');
        const persistFn = gradebook.match(/function persistStudentEvaluationEntry\([\s\S]*?\n}\n/);
        expect(persistFn?.[0]).toContain('isFacultyStandaloneGradebookContext()');
        expect(persistFn[0]).toContain('resolveFacultyGradebookRosterKeysForStudent');
    });

    it('ensures LMS gradebook shell includes staff workspace root', () => {
        expect(lms).toContain('id="gradebook-staff-lms-workspace"');
        expect(lms).toContain('gb-lms-staff-workspace');
        expect(lms).toContain("!document.getElementById('gradebook-staff-lms-workspace')");
    });

    it('uses compact staff grading focus instead of full student workspace in LMS detail', () => {
        expect(gradebook).toContain('function renderLmsEmbeddedStaffGradingFocus(');
        const detailFn = gradebook.match(/function renderLmsEmbeddedStaffStudentDetail\([\s\S]*?\n}\n/);
        expect(detailFn?.[0]).toBeTruthy();
        expect(detailFn[0]).toContain('renderLmsEmbeddedStaffGradingFocus(record, weights, criterionMeta, assessmentNumber)');
        expect(detailFn[0]).not.toContain('renderStudentGradebookWorkspace');
    });

    it('omits per-group weight controls from LMS staff assessment bar', () => {
        expect(gradebook).toContain('function renderLmsEmbeddedStaffAssessmentBar(criterionMeta');
        const barFn = gradebook.match(/function renderLmsEmbeddedStaffAssessmentBar\([\s\S]*?\n}\n/);
        expect(barFn?.[0]).toBeTruthy();
        expect(barFn[0]).not.toContain('getGradebookWeightControlsMarkup');
        expect(gradebook).toContain('data-gradebook-click="open-subject-weights"');
        expect(gradebook).toContain('function openLmsSubjectWeightsModal()');
        expect(gradebook).toContain('function applyLmsSubjectWeightsToSelectedGroups()');
    });

    it('stores and resolves subject-level grading schemes for all groups', () => {
        expect(gradebook).toContain('gradebookSubjectSchemes');
        expect(gradebook).toContain('function getGradebookSubjectGradingScheme(');
        expect(gradebook).toContain('function setGradebookSubjectGradingScheme(');
        expect(gradebook).toContain('class-assignment');
        expect(gradebook).toContain('team-project');
        const applyFn = gradebook.match(/function applyLmsSubjectWeightsToSelectedGroups\([\s\S]*?\n}\n/);
        expect(applyFn?.[0]).toBeTruthy();
        expect(applyFn[0]).toContain('saveGradebookGradingSchemeFromShell');
        expect(applyFn[0]).not.toContain('data-lms-subject-weight-group]:checked');
        const modalFn = gradebook.match(/function openLmsSubjectWeightsModal\([\s\S]*?\n}\n/);
        expect(modalFn?.[0]).toBeTruthy();
        expect(modalFn[0]).toContain('getGradebookGradingSchemeControlsMarkup');
        expect(modalFn[0]).toContain('gb-lms-subject-weights-groups--readonly');
    });

    it('computes course percent from max points scheme', () => {
        const breakdownFn = gradebook.match(/function computeGradebookSchemeBreakdown\([\s\S]*?\n}\n/);
        expect(breakdownFn?.[0]).toBeTruthy();
        expect(breakdownFn[0]).toContain('scaleAssessmentScoreToSchemePoints');
        expect(breakdownFn[0]).toContain('totalEarned / totalMax');
        expect(gradebook).toContain('function getGradebookSchemeTotalPoints(');
        expect(gradebook).toContain('GRADEBOOK_DEFAULT_GRADING_SCHEME');
    });

    it('refreshes LMS embedded gradebook after absolute inline score saves', () => {
        expect(gradebook).toContain("saveMode === 'additive'");
        expect(gradebook).toContain('function buildGradebookScoreChangeNote(');
        const persistFn = gradebook.match(/function persistStudentEvaluationEntry\([\s\S]*?\n}\n/);
        expect(persistFn?.[0]).toBeTruthy();
        expect(persistFn[0]).toContain('isStaffModernGradebookContext()');
        expect(persistFn[0]).toContain('refreshGradebookAfterStaffScoreChange');
        const focusFn = gradebook.match(/function renderLmsEmbeddedStaffGradingFocus\([\s\S]*?\n}\n/);
        expect(focusFn?.[0]).not.toContain('data-gradebook-click="save-entry"');
        expect(focusFn[0]).toContain('data-gradebook-click="open-score-edit"');
        expect(focusFn[0]).not.toContain('data-gradebook-save-mode="additive"');
    });

    it('keeps student LMS path on modern workspace and hides legacy table', () => {
        expect(gradebook).toContain('renderStudentGradebookWorkspace(record, currentScheme)');
        expect(gradebook).toContain('setGradebookShellVisibility(table, false)');
        expect(gradebook).toContain('effectiveRole === USER_ROLES.STUDENT');
    });

    it('uses category max for transcript scores and moves transcript off LMS student workspace', () => {
        expect(gradebook).toContain('function getGradebookCategoryMaxForCriterion(');
        const transcriptFn = gradebook.match(/function renderGradebookModernTranscript\([\s\S]*?\n}\n/);
        expect(transcriptFn?.[0]).toContain('categoryMax');
        expect(transcriptFn[0]).toContain('data-gradebook-roster-id');
        const workspaceFn = gradebook.match(/function renderStudentGradebookWorkspace\([\s\S]*?\n}\n/);
        expect(workspaceFn[0]).not.toContain('renderGradebookModernTranscript(summary)');
        expect(workspaceFn[0]).not.toContain('renderGradebookModernTimeline(summary)');
        expect(workspaceFn[0]).toContain('gb-modern-study-card-pointer');
        const modalFn = gradebook.match(/function openStudentEvaluationHistoryModal\([\s\S]*?\n}\n/);
        expect(modalFn[0]).toContain('getGradebookSchemeForRoster(resolvedRosterId)');
        expect(modalFn[0]).toContain('resolveGradebookStudentRecord');
    });

    it('embeds assessment transcript on study card with gradebook delegates', () => {
        const studyCard = readSource('assets/js/pages/study-card-page.js');
        expect(studyCard).toContain('bindStandaloneGradebookShell');
        expect(studyCard).toContain('renderGradebookModernTranscript');
        expect(studyCard).toContain('renderGradebookModernTimeline');
        expect(studyCard).toContain('getGradebookModernSummary');
        expect(studyCard).toContain('getGradebookSchemeForRoster');
        expect(readSource('study-card.html')).toContain('lux-route-lms');
    });

    it('shows scheme details in student progress rows without duplicate breakdown table', () => {
        expect(gradebook).toContain('function renderGradebookSchemeReferenceTable(');
        const workspaceFn = gradebook.match(/function renderStudentGradebookWorkspace\([\s\S]*?\n}\n/);
        expect(workspaceFn?.[0]).toBeTruthy();
        expect(workspaceFn[0]).toContain('gb-modern-stack');
        expect(workspaceFn[0]).toContain('renderGradebookModernWeights(weights, summary, { studentView: true })');
        expect(workspaceFn[0]).not.toContain('What affects the final grade');
        expect(workspaceFn[0]).not.toContain('gb-explain-list');
        const weightsFn = gradebook.match(/function renderGradebookModernWeights\([\s\S]*?\n}\n/);
        expect(weightsFn?.[0]).toBeTruthy();
        expect(weightsFn[0]).toContain('options.studentView');
        expect(weightsFn[0]).toContain('const referenceTableMarkup = studentView');
        expect(weightsFn[0]).toContain('Your progress');
        expect(weightsFn[0]).toContain('gb-weight-row-meta');
        expect(weightsFn[0]).toContain('getGradebookSchemeComponentMetaLine');
        expect(weightsFn[0]).toContain("${metaLine ? '' : `<span>${Math.round(row.weightPoints)} pts max</span>`}");
        expect(weightsFn[0]).toContain('gb-weight-stat is-earned');
        expect(lmsCss).toContain('.gb-modern-stack');
        expect(lmsCss).toContain('.gb-weight-card.is-student-view');
        expect(lmsCss).toContain('width: var(--gb-track-width, 0%)');
        expect(lmsCss).toContain('.gb-weight-track.is-stacked span');
        expect(lmsCss).toContain('body.lux-route-lms .gb-weight-row');
        expect(lmsCss).toMatch(/body\.lux-route-lms \.gb-weight-row[\s\S]*?grid-template-areas/);
        expect(lmsCss).toContain('.gb-weight-stat.is-earned');
    });

    it('styles master-detail staff grade layout in LMS route CSS', () => {
        expect(lmsCss).toContain('.gb-lms-staff-layout');
        expect(lmsCss).toContain('.gb-lms-staff-roster');
        expect(lmsCss).toContain('.gb-lms-staff-roster-row.is-active');
        expect(lmsCss).toContain('.gb-lms-staff-focus');
        expect(lmsCss).toContain('.gb-lms-subject-weights-card');
    });

    it('exposes clickable score history panel without action labels', () => {
        expect(gradebook).toContain('function getAssessmentScoreHistoryTimeline(');
        expect(gradebook).toContain('function renderGradebookScoreHistoryPanel(');
        expect(gradebook).toContain('function shouldDisplayGradebookHistoryNote(');
        expect(gradebook).not.toContain('function openGradebookScoreHistoryModal(');
        expect(gradebook).not.toContain('function revertGradebookEntryToScore(');
        const panelFn = gradebook.match(/function renderGradebookScoreHistoryPanel\([\s\S]*?\n}\n/);
        expect(panelFn?.[0]).toBeTruthy();
        expect(panelFn[0]).toContain('readOnlyHistory');
        expect(panelFn[0]).toContain('interactiveHistory');
        expect(panelFn[0]).toContain('data-gradebook-click="open-score-edit"');
        expect(panelFn[0]).not.toContain('revert-entry-score');
        expect(panelFn[0]).not.toContain('actionLabel');
        expect(gradebook).toContain('function buildGradebookScoreChangeNote(');
        expect(gradebook).toContain('Changed from');
    });

    it('does not wire score history modal or restore in gradebook delegate', () => {
        const delegateFn = gradebook.match(/function bindStandaloneGradebookShell\([\s\S]*?\n}\n/);
        expect(delegateFn?.[0]).toBeTruthy();
        expect(delegateFn[0]).not.toContain("action === 'open-score-history'");
        expect(delegateFn[0]).not.toContain("action === 'revert-entry-score'");
        expect(delegateFn[0]).not.toContain("action === 'close-score-history'");
    });

    it('uses read-only score history and modal-only save in LMS staff focus', () => {
        const focusFn = gradebook.match(/function renderLmsEmbeddedStaffGradingFocus\([\s\S]*?\n}\n/);
        expect(focusFn?.[0]).toBeTruthy();
        expect(focusFn[0]).toContain('gb-lms-staff-score-history');
        expect(focusFn[0]).toContain('Informational only');
        expect(focusFn[0]).toContain('readOnlyHistory: true');
        expect(focusFn[0]).not.toContain('data-gradebook-click="save-entry"');
        expect(focusFn[0]).toContain('open-score-edit');
        expect(focusFn[0]).toContain('gb-lms-staff-score-stat');
        const rosterFn = gradebook.match(/function renderLmsEmbeddedStaffRosterList\([\s\S]*?\n}\n/);
        expect(rosterFn?.[0]).toContain('gb-lms-staff-roster-foot');
        expect(focusFn[0]).toContain('Set score');
        expect(focusFn[0]).toContain('Edit score');
        expect(focusFn[0]).not.toContain('Add to score');
        expect(focusFn[0]).not.toContain('gb-lms-staff-add-label');
        expect(focusFn[0]).toContain('renderGradebookScoreHistoryPanel');
        expect(gradebook).toMatch(/mockStudents\.forEach\([\s\S]*?renderGradebookScoreHistoryPanel/);
        const modalFn = gradebook.match(/function openGradebookScoreEditModal\([\s\S]*?\n}\n/);
        expect(modalFn?.[0]).toContain('save-score-edit');
        expect(modalFn[0]).toContain('Save score');
    });

    it('uses full score history panel in evaluation history cards', () => {
        const v3Fn = gradebook.match(/function renderStudentEvaluationHistorySectionsV3\([\s\S]*?\n}\n/);
        expect(v3Fn?.[0]).toBeTruthy();
        expect(v3Fn[0]).toContain('renderGradebookScoreHistoryPanel');
        expect(v3Fn[0]).not.toContain('gb-modal-change-list');
    });

    it('passes optional note from score edit without forced correction metadata', () => {
        const saveEditFn = gradebook.match(/function saveGradebookScoreEdit\([\s\S]*?\n}\n/);
        expect(saveEditFn?.[0]).toBeTruthy();
        expect(saveEditFn[0]).toContain('getElementById(reasonId)');
        expect(saveEditFn[0]).not.toContain('historyAction: \'corrected\'');
        expect(saveEditFn[0]).not.toContain('Score correction');
        const delegateFn = gradebook.match(/function bindStandaloneGradebookShell\([\s\S]*?\n}\n/);
        expect(delegateFn?.[0]).toContain("action === 'open-score-edit'");
        expect(lmsCss).toContain('.gb-score-history-panel');
        expect(lmsCss).toContain('button.gb-score-history-row');
    });
});

describe('LMS bulk grading scheme tool', () => {
    const classroom = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
    const gradebook = readSource('assets/js/pages/gradebook.js');
    const lmsCss = readSource('assets/css/lms-route.css');

    it('adds Grading scheme card to multi-group actions on GROUP VIEW', () => {
        expect(classroom).toContain('Grading scheme');
        expect(classroom).toContain('fa-table-list');
        expect(classroom).toContain('function applyLmsBulkSubjectGradingScheme()');
        expect(classroom).toContain('lms-bulk-card--grading-scheme');
        expect(classroom).not.toMatch(/applyLmsBulkSubjectGradingScheme[\s\S]*data-lms-bulk-requires-selection/);
        expect(classroom).toContain('Use Edit, then Save');
    });

    it('wires bulk save to subject-level grading scheme storage', () => {
        expect(gradebook).toContain('function readGradebookGradingSchemeFromDom(');
        expect(gradebook).toContain('window.readGradebookGradingSchemeFromDom = readGradebookGradingSchemeFromDom');
        const applyFn = classroom.match(/function applyLmsBulkSubjectGradingScheme\([\s\S]*?\n}\n/);
        expect(applyFn?.[0]).toBeTruthy();
        expect(applyFn[0]).toContain('saveGradebookGradingSchemeFromShell');
        expect(gradebook).toContain('function saveGradebookGradingSchemeFromShell(');
    });

    it('supports item counts, per-item max, and edit/save lock on scheme table', () => {
        expect(gradebook).toContain('function getGradebookSchemeCountKey(');
        expect(gradebook).toContain('function getGradebookSchemePerItemMax(');
        expect(gradebook).toContain('function formatGradebookSchemePerItemMax(');
        expect(gradebook).toContain('data-lms-subject-scheme-count');
        expect(gradebook).toContain('data-gb-scheme-per-item');
        expect(gradebook).toContain('data-gradebook-click="edit-grading-scheme"');
        expect(gradebook).toContain('data-gradebook-click="save-grading-scheme"');
        expect(gradebook).toContain('gb-scheme-shell is-locked');
        const breakdownFn = gradebook.match(/function computeGradebookSchemeBreakdown\([\s\S]*?\n}\n/);
        expect(breakdownFn?.[0]).toContain('getGradebookSchemeEntryMaxForScale');
        const metaFn = gradebook.match(/function getGradebookCriterionMeta\([\s\S]*?\n}\n/);
        expect(metaFn?.[0]).toContain('getGradebookSchemePerItemMax');
        const delegateFn = gradebook.match(/function bindStandaloneGradebookShell\([\s\S]*?\n}\n/);
        expect(delegateFn?.[0]).toContain("action === 'edit-grading-scheme'");
        expect(delegateFn?.[0]).toContain("action === 'save-grading-scheme'");
        expect(lmsCss).toContain('.gb-scheme-per-item');
        expect(lmsCss).toContain('.gb-scheme-shell-actions');
    });

    it('uses wide two-column bulk layout with full-width grading scheme', () => {
        expect(lmsCss).toContain('grid-template-columns: repeat(2, minmax(0, 1fr))');
        expect(lmsCss).toContain('.lms-bulk-card--grading-scheme');
        expect(lmsCss).toContain('grid-column: 1 / -1');
        expect(lmsCss).toContain('.gb-scheme-table');
    });
});
