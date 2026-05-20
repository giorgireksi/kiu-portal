import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('profile route regressions', () => {
    it('keeps the self-profile shell trimmed to the current live runtime owners', () => {
        const html = readSource('profile.html');
        const appJs = readSource('assets/js/app/app.js');
        const profileRouteJs = readSource('assets/js/pages/profile-route.js');
        const timetableRuntimeJs = readSource('assets/js/pages/timetable-runtime.js');
        const facultyJs = readSource('assets/js/shared/faculty.js');

        expect(html).not.toContain('assets/js/shared/social-hub.js');
        expect(html).not.toContain('assets/js/shared/social-render.js');
        expect(html).not.toContain('assets/js/shared/social-media.js');
        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/directories.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('onclick=');
        expect(html).not.toContain('setInterval(');
        expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260516-surface-split1');
        expect(html).toContain('assets/js/pages/profile-route.js?v=20260516-profiletabsplit1');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).toContain('assets/css/profile-route.css?v=20260516-profileroute1');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"></nav>');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"></nav>');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"></nav>');
        expect(html).toContain('id="portal-messenger-container"');
        expect(html).toContain('<div id="modal-overlay" class="modal-overlay"></div>');
        expect(html).not.toContain('id="modal-announcement"');
        expect(html).not.toContain('id="modal-event"');
        expect(html).not.toContain('id="modal-syllabus"');
        expect(html).not.toContain('id="modal-programs"');
        expect(html).not.toContain('id="modal-program-courses"');
        expect(html).not.toContain('id="modal-minor-programs"');
        expect(html).not.toContain('id="modal-add-concentration-subject"');
        expect(html).not.toContain('id="modal-add-minor-subject"');
        expect(html).toContain('class="profile-shell-layout"');
        expect(html).toContain('class="profile-shell-nav"');
        expect(html).toContain('class="profile-shell-content"');
        expect(html).toContain('class="content-box surface-card profile-shell-card"');
        expect(html).toContain('data-profile-tab="info"');
        expect(html).toContain('data-modal-close="1"');
        expect(html).toContain('id="profile-tab-info" data-profile-mounted="1"');
        expect(html).toContain('id="profile-tab-email" data-profile-mounted="0"');
        expect(html).toContain('id="profile-tab-password" data-profile-mounted="0"');
        expect(html).toContain('autocomplete="current-password"');
        expect(html).toContain('autocomplete="new-password"');
        expect(html).toContain('<button class="kiu-btn-blue profile-shell-action" type="button">Update</button>');
        expect(html).toContain('<button class="profile-shell-disabled-action" type="button">Update</button>');
        expect(html).toContain('id="profile-tab-calendar" class="profile-shell-calendar" data-profile-mounted="0"');
        expect(html).toContain('id="profile-tab-template-email"');
        expect(html).toContain('id="profile-tab-template-password"');
        expect(html).toContain('id="profile-tab-template-calendar"');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"><i class="fas fa-user-shield"></i></span><span>Admin View</span></button>');
        expect(html).not.toContain('profile-sheet-icon-admin');
        expect(html).not.toContain('profile-mobile-hidden');
        expect(html).not.toContain('profile-mobile-badge-hidden');
        expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
        expect(html).toContain("activeTarget: 'profile-view'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-profile-mobile1');
        expect(html).not.toContain('(function initMobileExperience(){');
        expect(appJs).toContain("const PROFILE_CALENDAR_WEEK_STORAGE_KEY = 'KIU_PROFILE_CALENDAR_WEEK_START';");
        expect(facultyJs).toContain('function renderPortalMessengerWorkspace()');
        expect(facultyJs).toContain('function openPortalMessengerChat(chatId)');
        expect(profileRouteJs).toContain('function ensureProfileTabContent(tab) {');
        expect(profileRouteJs).toContain('function switchProfileTab(tab, element) {');
        expect(profileRouteJs).toContain("const trigger = event.target.closest('[data-profile-tab]');");
        expect(timetableRuntimeJs).toContain('function renderProfileCalendar() {');
    });
});
