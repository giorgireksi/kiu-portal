import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('faculty gradebook route regressions', () => {
    it('keeps faculty-gradebook free of dead social helper imports and mobile-nav polling waits', () => {
        const html = readSource('faculty-gradebook.html');
        const appSource = readSource('assets/js/app/app.js');
        const gradebookJs = readSource('assets/js/pages/gradebook.js');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).toContain('assets/js/pages/gradebook.js?v=20260430-lmsgrades1');
        expect(html).not.toContain('assets/js/pages/lms.js?v=20260430-lmsgrades1');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('id="lux-spreadsheet-view" style="display:none;"></div>');
        expect(html).not.toContain('id="gradebook-body"');
        expect(html).not.toContain('id="audit-logs"');
        expect(html).toContain("document.addEventListener('DOMContentLoaded', () => {");
        expect(html).toContain("function ensureNavigateHooks(){if(typeof window.navigate!=='function')return false;hookNav();buildRoleNav();return true}");
        expect(html).toContain("window.addEventListener('load',ensureNavigateHooks,{once:true});");
        expect(html).not.toContain("setInterval(function(){if(typeof window.navigate==='function')");
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('onchange=');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(appSource).toContain("window.ensurePortalLmsRuntimeLoaded = function ensurePortalLmsRuntimeLoaded()");
        expect(appSource).toContain('window.getEnrolledStudentsForGroup = function getEnrolledStudentsForGroup(courseId, groupId)');
        expect(appSource).toContain('window.resolveGradebookRosterKey = function resolveGradebookRosterKey(courseId, groupId, enrolledStudents = [])');
        expect(appSource).toContain('window.buildGradebookStudents = function buildGradebookStudents(courseId, groupId)');
        expect(appSource).toContain('window.getGradebookGroupsForCurrentUser = function getGradebookGroupsForCurrentUser()');
        expect(appSource).toContain('window.resolveLmsQuizSourceFromAssessmentEntry = function resolveLmsQuizSourceFromAssessmentEntry(entry = {})');
        expect(appSource).toContain('window.getAssessmentEntryDisplayContext = function getAssessmentEntryDisplayContext(criterion, entry = {})');
        expect(gradebookJs).toContain('function getGradebookSpreadsheetShellMarkup()');
        expect(gradebookJs).toContain('function ensureGradebookSpreadsheetShell()');
        expect(gradebookJs).toContain('function bindStandaloneGradebookShell()');
        expect(gradebookJs).toContain('mockStudents = Array.isArray(mockStudents)');
        expect(gradebookJs).toContain('Promise.resolve(ensurePortalLmsRuntimeLoaded())');
        expect(gradebookJs).toContain("target.matches('[data-gradebook-roster-filter]')");
        expect(gradebookJs).toContain("target.matches('[data-gradebook-weight]')");
    });
});
