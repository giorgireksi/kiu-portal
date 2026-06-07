import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms route regressions', () => {
    it('keeps the LMS shell on the current route-level markup contract', () => {
        const html = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const lmsRouteCss = readSource('assets/css/lms-route.css');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).toContain('assets/css/lms-route.css?v=20260531-lmsscheme8');
        expect(html).not.toContain('assets/css/components.css');
        expect(html).not.toContain('<style>');
        expect(html).toContain('assets/js/shared/messenger.js');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('id="lms-section-switch" role="group" aria-label="Class type"');
        expect(html).not.toContain('id="lms-section-switch" aria-label="Class type"');
        expect(html).toContain('id="lms-gradebook-wrapper" class="lms-gradebook-wrapper-shell" hidden></div>');
        expect(html).not.toContain('id="lms-gradebook-wrapper" style=');
        expect(html).toContain('class="lms-route-tab-strip" role="group" aria-label="Course workspace navigation"');
        expect(html).toContain('class="lms-route-tab is-active" id="tab-interaction" data-lms-tab="interaction" aria-pressed="true"');
        expect(html).not.toContain('class="tabs-container lms-tabs"');
        expect(html).not.toContain('class="tab active"');
        expect(html).toContain('<div hidden>');
        expect(html).toContain('<div id="page-lms-groups" class="page-section" hidden>');
        expect(html).toContain('<div id="page-lms-inner" class="page-section" hidden>');
        expect(html).not.toContain('style="display: none;"');
        expect(html).not.toContain('class="lms-clean-empty');
        expect(html).toContain('class="lms-route-empty lms-route-empty--full-span"');
        expect(html).toContain('class="lms-route-empty-icon"><i class="fas fa-book-open"></i>');
        expect(html).toContain('class="lms-route-inline lms-route-inline-center lms-route-inline-gap-10"');
        expect(html).toContain('class="lms-route-copy lms-route-meta-12" id="lms-empty-guidance"');
        expect(html).toContain('class="lms-route-copy lms-route-copy-mt-4">Choose a published group workspace.</div>');
        expect(html).not.toContain('class="lms-clean-note"');
        expect(html).not.toContain('class="lms-clean-note-copy"');
        expect(html).not.toContain('class="lms-clean-subview-copy"');
        expect(html).toContain('<section class="lms-route-panel lms-route-panel-pad-16-20">');
        expect(html).toContain('class="lms-route-title lms-route-title-26" id="dynamic-subject-title"');
        expect(html).toContain('<section class="lms-route-panel lms-route-panel-compact">');
        expect(html).toContain('class="lms-route-title lms-route-title-26" id="lms-course-title"');
        expect(html).not.toContain('class="lux-card lms-clean-subview-hero"');
        expect(html).not.toContain('class="lux-card lms-clean-groups"');
        expect(html).not.toContain('class="lux-card lms-clean-workspace-shell"');
        expect(html).toContain('assets/js/pages/lms-live-quiz-workspace-runtime.js?v=20260604-livequiz-staffcontrols1');
        expect(html).toContain('assets/js/pages/lms-live-quiz-ui-runtime.js?v=20260604-livequiz-staffcontrols1');
        expect(html).toContain('assets/js/pages/lms-grade-sync-runtime.js?v=20260518-lmsgrade1');
        expect(html).toContain('assets/js/pages/lms-file-storage-runtime.js?v=20260518-lmsfiles1');
        expect(html).toContain('assets/js/pages/lms-calls-runtime.js?v=20260518-lmscalls1');
        expect(html).toContain('assets/js/pages/lms-materials-runtime.js?v=20260518-lmsmaterials1');
        expect(html).toContain('assets/js/pages/lms-assignments-runtime.js?v=20260518-lmsassignments1');
        expect(html).toContain('assets/js/pages/lms-protected-quiz-runtime.js?v=20260604-lmsprotected2');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'lms'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-lms-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('<button class="mob-sheet-close-btn" type="button" id="mob-sheet-close">');
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('onchange=');
        expect(lmsSource).toContain('class="lms-route-empty-icon"');
        expect(lmsSource).toContain('class="lms-route-copy lms-route-copy-mt-6 lms-route-meta-12"');
        expect(lmsSource).toContain('class="lms-route-card-stack lms-route-card-stack-tight"');
        expect(lmsSource).toContain('class="lms-route-card-title lms-route-card-title-16"');
        expect(lmsSource).toContain('class="lms-route-card-head lms-route-card-head-mb-18"');
        expect(lmsSource).toContain('class="kiu-btn-outline lms-route-btn-compact"');
        expect(lmsSource).toContain('class="lms-route-panel lms-route-panel-compact lms-route-stack-mb-16"');
        expect(lmsSource).toContain('class="lms-route-table-wrap"');
        expect(lmsSource).toContain("[data-lms-tab].is-active");
        expect(lmsSource).not.toContain('style="font-size:30px; opacity:0.36; color:var(--lux-accent);"');
        expect(lmsSource).not.toContain('style="margin-bottom:18px;"');
        expect(lmsSource).not.toContain('style="padding:10px 14px; font-size:12px;"');
        expect(lmsRouteCss).toContain('.lms-route-empty-icon i {');
        expect(lmsRouteCss).toContain('.lms-route-empty--full-span {');
        expect(lmsRouteCss).toContain('.lms-route-inline-gap-10 {');
        expect(lmsRouteCss).toContain('.lms-route-btn-compact {');
        expect(lmsRouteCss).toContain('.lms-route-panel-compact {');
        expect(lmsRouteCss).toContain('.lms-route-panel-pad-16-20 {');
        expect(lmsRouteCss).toContain('.lms-route-lead-icon {');
        expect(lmsRouteCss).toContain('.lms-route-tab-strip {');
        expect(lmsRouteCss).toContain('.lms-route-tab {');
        expect(lmsRouteCss).toContain('.lms-route-tab.is-active {');
        expect(lmsRouteCss).toContain('#page-lms-groups .lms-route-card-head {');
        expect(lmsRouteCss).not.toContain('.lms-clean-empty {');
        expect(lmsRouteCss).not.toContain('.lms-clean-note {');
        expect(lmsRouteCss).not.toContain('.lms-clean-note-copy {');
        expect(lmsRouteCss).not.toContain('.lms-clean-subview-hero {');
        expect(lmsRouteCss).not.toContain('.lms-clean-groups .lux-card-body {');
        expect(lmsRouteCss).not.toContain('.lms-clean-workspace-shell');
        expect(lmsRouteCss).not.toContain('.lms-call-page-head');
        expect(lmsRouteCss).not.toContain('.lms-call-page-icon');
        expect(lmsRouteCss).not.toContain('.tabs-container.lms-tabs');
    });

    it('skips LMS visual re-render when navigate returns navigationSkipped', () => {
        const navigationSource = readSource('assets/js/features/navigation.js');
        const luxurySource = readSource('assets/js/features/index-luxury.js');

        expect(navigationSource).toContain('return { navigationSkipped: true };');
        expect(luxurySource).toContain('if (result?.navigationSkipped) return;');
    });

    it('supports student enrollment-only LMS subjects with semester filter', () => {
        const html = readSource('lms.html');
        const lmsSource = readSource('assets/js/pages/lms.js');
        const enrollmentSource = readSource('assets/js/pages/registration-enrollment.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');
        const lmsRouteCss = readSource('assets/css/lms-route.css');

        expect(html).toContain('id="lms-student-semester-bar"');
        expect(html).toContain('getStudentLmsEnrolledSubjects');
        expect(html).toContain('renderLmsStudentSemesterBar');
        expect(html).toContain('window.renderLMSSubjects = renderLmsSubjectDeck');
        expect(html).toContain('openLmsStudentEnrolledSubject');
        expect(lmsSource).toContain('function getStudentLmsEnrolledSubjects');
        expect(lmsSource).toContain('function isLmsStudentViewer');
        expect(lmsSource).toContain('function openLmsStudentEnrolledSubject');
        expect(enrollmentSource).toContain('enrollmentSemester');
        expect(classroomSource).toContain('function syncLmsCourseBackButtonLabel');
        expect(classroomSource).toMatch(/isLmsStudentViewer[\s\S]*page-lms/);
        expect(lmsRouteCss).toContain('.lms-student-semester-bar');
        expect(html).toMatch(/facultyCurriculum[\s\S]*getActiveCurriculum/);
    });

    it('restores LMS course context after admin View-as role switches', () => {
        const html = readSource('lms.html');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(html).toContain('restoreLmsReturnContextIfPresent');
        expect(utilitiesSource).toContain("const KIU_LMS_RETURN_CONTEXT_KEY = 'KIU_LMS_RETURN_CONTEXT'");
        expect(utilitiesSource).toContain('function persistLmsReturnContextForRoleSwitch');
        expect(utilitiesSource).toContain('function restoreLmsReturnContextIfPresent');
        expect(utilitiesSource).toContain("resolvePortalRouteUrl('lms', requestedRole)");
        expect(utilitiesSource).toContain('function applyInPlaceAdminRoleSwitchOnStandaloneLms');
        expect(utilitiesSource).toContain("getStandaloneEntryPageIdForRoleSwitch() === 'lms'");
        expect(classroomSource).toContain('function buildLmsTabRenderCacheKey');
        expect(classroomSource).toContain('function clearLmsTabRenderCache');
        expect(classroomSource).toContain('window.clearLmsTabRenderCache = clearLmsTabRenderCache');
        expect(classroomSource).toContain('getEffectiveUserRole()');
        expect(classroomSource).toContain('switchLMSTab(tab, options = {})');
        expect(classroomSource).toContain('options.force === true');
    });

    it('shows standalone LMS gradebook wrapper and spreadsheet shell on Grades tab', () => {
        const html = readSource('lms.html');
        const lmsRouteCss = readSource('assets/css/lms-route.css');
        const gradebookSource = readSource('assets/js/pages/gradebook.js');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(lmsRouteCss).toContain('.lms-gradebook-wrapper-shell[hidden]');
        expect(lmsRouteCss).toContain('.lms-gradebook-wrapper-shell:not([hidden])');
        expect(lmsRouteCss).not.toMatch(
            /body\.lux-route-lms \.lms-gradebook-wrapper-shell\s*\{[^}]*display:\s*none;/
        );
        expect(gradebookSource).toContain('function resolveGradebookSpreadsheetShell()');
        expect(gradebookSource).toMatch(
            /resolveGradebookSpreadsheetShell[\s\S]*gradebook-spreadsheet-view/
        );
        expect(gradebookSource).toContain('window.closeGradebookSpreadsheet = closeGradebookSpreadsheet');
        expect(classroomSource).toMatch(/function setLmsElementShown\(element, shown, displayMode/);
        expect(classroomSource).toContain("if (tab === 'gradebook')");
        expect(classroomSource).toContain('bindStandaloneGradebookShell()');
        expect(html).toContain('bindStandaloneGradebookShell()');
    });

    it('keeps Grades and Sessions panels mutually exclusive on standalone LMS', () => {
        const lmsRouteCss = readSource('assets/css/lms-route.css');
        const classroomSource = readSource('assets/js/pages/lms-classroom-tabs-runtime.js');

        expect(lmsRouteCss).toContain('body.lux-route-lms #lms-content-area[hidden]');
        expect(classroomSource).toContain('function setLmsWorkspacePanel(active)');
        expect(classroomSource).toContain("setLmsWorkspacePanel('gradebook')");
        expect(classroomSource).toContain("setLmsWorkspacePanel('content')");
        expect(classroomSource).toMatch(/if \(tab === 'gradebook'\)[\s\S]*setLmsWorkspacePanel\('gradebook'\)/);
        expect(classroomSource).not.toMatch(
            /if \(tab === 'gradebook'\)[\s\S]*setLmsElementShown\(contentArea, true, 'block'\)/
        );
        expect(classroomSource).toMatch(/else if \(!shown\) \{\s*element\.style\.display = 'none';/);
    });
});
