import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile-view route regressions', () => {
    it('keeps profile-view limited to the currently proven runtime owners', () => {
        const html = readSource('profile-view.html');
        const appSource = readSource('assets/js/app/app.js');
        const facultySource = readSource('assets/js/shared/faculty.js');
        const profileViewAdminSource = readSource('assets/js/pages/profile-view-admin-actions.js');
        const inlineHandlerMatches = html.match(/on(click|input|change|mouseover|mouseout|mouseenter|mouseleave)=/g) || [];

        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).toContain('assets/js/pages/profile-view-admin-actions.js?v=20260517-profileviewadmin1');
        expect(html).toContain('function resolveDayIndex(dayLabel) {');
        expect(html).toContain('function getProfSchedule(profName) {');
        expect(html).toContain('function getEnrolledStudentsForGroup(courseId, groupId) {');
        expect(html).toContain('function cloneProfileViewTemplate(templateId) {');
        expect(html).toContain('function mountProfileViewModal(templateId) {');
        expect(html).toContain('function pvEnsureTabContent(tabId) {');
        expect(html).toContain('assets/css/profile-view-route.css?v=20260518-profileview-markup1');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'profile-view'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-profile-view-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).not.toContain("setInterval(function(){if(typeof window.navigate==='function')");
        expect(inlineHandlerMatches).toHaveLength(0);
        expect(html).toContain('data-pv-session-sync="start"');
        expect(html).toContain('data-pv-session-sync="end"');
        expect(html).toContain('id="pv-session-modal-template"');
        expect(html).toContain("mountProfileViewModal('pv-session-modal-template')");
        expect(html).toContain('id="pv-editgroup-modal-template"');
        expect(html).toContain("mountProfileViewModal('pv-editgroup-modal-template')");
        expect(html).toContain('id="pv-schedule-row-template"');
        expect(html).toContain('class="pv-modal-overlay"');
        expect(html).toContain('class="mob-sheet-icon"><i class="fas fa-user-shield"></i></span><span>Admin View</span>');
        expect(html).not.toContain('id="pv-session-modal" data-pv-modal-overlay style=');
        expect(html).not.toContain('id="pv-editgroup-modal" data-pv-modal-overlay style=');
        expect(html).toContain('id="pvtab-0" data-pv-mounted="1"');
        expect(html).toContain('id="pvtab-1" data-pv-mounted="0"');
        expect(html).toContain('id="pvtab-2" data-pv-mounted="0"');
        expect(html).toContain('id="pvtab-3" data-pv-mounted="0"');
        expect(html).toContain('id="pvtab-1-template"');
        expect(html).toContain('id="pvtab-2-template"');
        expect(html).toContain('id="pvtab-3-template"');
        expect(appSource).toContain('window.normalizeTimeString = normalizeTimeString;');
        expect(appSource).toContain('window.minutesToTimeString = minutesToTimeString;');
        expect(appSource).toContain('window.convertTimeToMinutes = convertTimeToMinutes;');
        expect(facultySource).toContain('function getCurrentWeekStartISO()');
        expect(facultySource).toContain('function getWeekDateEntries(weekStart)');
        expect(profileViewAdminSource).toContain('function toggleProbationForUser(userId) {');
        expect(profileViewAdminSource).toContain('function applyHoldForUser(userId, amount) {');
        expect(profileViewAdminSource).toContain('function applyScholarshipForUser(userId, amount) {');
        expect(profileViewAdminSource).toContain('function generateTranscriptForUser(userId) {');
        expect(profileViewAdminSource).toContain("const blob = new Blob([html], { type: 'text/html' });");
        expect(profileViewAdminSource).toContain("const newWindow = window.open(objectUrl, '_blank');");
        expect(profileViewAdminSource).not.toContain('document.write(');
    });
});
