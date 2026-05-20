import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('personal-data route regressions', () => {
    it('moves route-local personal-data styling out of the HTML shell', () => {
        const html = readSource('personal-data.html');
        const css = readSource('assets/css/personal-data-route.css');
        const page = readSource('assets/js/pages/personal-data-page.js');
        const faculty = readSource('assets/js/shared/faculty.js');

        expect(html).toContain('assets/css/personal-data-route.css?v=20260515-pdata-route1');
        expect(html).not.toContain('<style');
        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).toContain('assets/js/shared/faculty.js?v=20260429-peopleisolation1');
        expect(html).toContain('assets/js/pages/personal-data-page.js?v=20260515-pdata-page1');
        expect(html).not.toContain('onclick="navigate(\'study-card\')"');
        expect(html).not.toContain('onclick="navigate(\'registration\')"');
        expect(html).not.toContain('onclick="navigate(\'timetable\')"');
        expect(html).toContain('data-personal-data-nav-target="study-card"');
        expect(html).toContain('data-personal-data-nav-target="registration"');
        expect(html).toContain('data-personal-data-nav-target="timetable"');
        expect(html).toContain('function setupToolbar(){');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'personal-data'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-personal-data-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(html).not.toContain('function ensureNavigateHooks(){if(typeof window.navigate!==\'function\')return false;hookNav();buildRoleNav();return true}');
        expect(html).not.toContain('var ht=setInterval(function(){if(typeof window.navigate===\'function\')');
        expect(css).not.toContain('--pd-panel: rgba(12, 18, 30, var(--lux-panel-alpha, 0.82));');
        expect(css).not.toContain('linear-gradient(180deg, var(--pd-panel), var(--pd-panel-strong)) !important;');
        expect(css).not.toContain('box-shadow: 0 16px 36px rgba(0, 0, 0, 0.14) !important;');
        expect(css).toContain('body.lux-route-personal-data .personal-data-layout');
        expect(css).toContain('@media (max-width: 760px)');
        expect(page).toContain('function renderPersonalDataIdentitySection(user, facultyProfile)');
        expect(page).toContain('function renderPersonalDataSummarySection(user, context)');
        expect(page).toContain('function renderPersonalDataFactsSection(user, context)');
        expect(page).toContain('function renderPersonalDataRecordsSection(user, context)');
        expect(page).toContain('function syncPersonalDataRecordItems(recordsBody, recordItems = [])');
        expect(page).toContain('data-personal-data-record-key');
        expect(page).toContain('window.renderPersonalDataPageContext = renderPersonalDataPageContext;');
        expect(page).not.toContain('recordsBody.innerHTML = recordItems.map');
        expect(faculty).not.toContain('function renderPersonalDataPageContext(user, facultyProfile)');
        expect(faculty).toContain('function renderPortalMessengerWorkspace()');
        expect(faculty).toContain('function openPortalNotificationFullModal()');
    });
});
