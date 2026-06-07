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
        expect(html).toContain('assets/css/profile-route.css?v=20260531-profglass1');
        expect(html).toContain('assets/css/index-luxury.css?v=20260531-profglass1');
        expect(html).toContain('assets/js/shared/utilities.js?v=20260531-profglass1');
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
        expect(html).toContain('class="content-box surface-card profile-shell-nav-card"');
        expect(html).toContain('class="content-box surface-card profile-shell-card"');
        expect(html).toContain('class="tab profile-shell-tab lux-secondary-btn lux-rail-tab active"');
        expect(html).toContain('data-profile-tab="info"');
        expect(html).toContain('data-modal-close="1"');
        expect(html).toContain('id="profile-tab-info" data-profile-mounted="1"');
        expect(html).toContain('id="profile-tab-email" data-profile-mounted="0" class="profile-shell-lazy-pane" hidden');
        expect(html).toContain('id="profile-tab-password" data-profile-mounted="0" class="profile-shell-lazy-pane" hidden');
        expect(html).toContain('autocomplete="current-password"');
        expect(html).toContain('autocomplete="new-password"');
        expect(html).toContain('<button class="lux-primary-btn profile-shell-action" type="button">Update</button>');
        expect(html).toContain('<button class="lux-disabled-btn profile-shell-disabled-action" type="button" aria-disabled="true" disabled>Update</button>');
        expect(html).toContain('id="profile-tab-calendar" class="profile-shell-calendar" data-profile-mounted="0" hidden');
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
        expect(facultyJs).toContain('class="portal-msg-page-shell"');
        expect(facultyJs).toContain('class="portal-msg-shell"');
        expect(facultyJs).toContain('class="portal-msg-composer"');
        expect(facultyJs).toContain('class="portal-msg-chat-item');
        expect(facultyJs).not.toContain('data-notif-action="open-item" style="width:100%; text-align:left;');
        expect(profileRouteJs).toContain('function ensureProfileTabContent(tab) {');
        expect(profileRouteJs).toContain('function setProfilePanelShown(panel, shown) {');
        expect(profileRouteJs).toContain('function switchProfileTab(tab, element) {');
        expect(profileRouteJs).not.toContain("style.borderLeftColor = 'var(--kiu-blue)'");
        expect(profileRouteJs).toContain("setProfilePanelShown(document.getElementById('profile-tab-info'), false);");
        expect(profileRouteJs).toContain("const trigger = event.target.closest('[data-profile-tab]');");
        expect(html).toContain('assets/css/lux-controls.css?v=20260527-profcss1');
        expect(readSource('assets/css/lux-controls.css')).toContain('.lux-rail-tab {');
        expect(readSource('assets/css/profile-route.css')).not.toContain('body.lux-route-profile .profile-shell-tab.active {');
        expect(readSource('assets/css/profile-route.css')).not.toContain('body.lux-route-profile .profile-form-group input {');
        expect(readSource('assets/css/profile-route.css')).not.toContain('body.lux-route-profile .profile-form-group input:focus {');
        expect(readSource('assets/css/profile-route.css')).toContain('body.lux-route-profile .profile-shell-input {');
        expect(timetableRuntimeJs).toContain('function renderProfileCalendar() {');
    });

    it('keeps profile edit glass tokens aligned with utilities and index dedupe', () => {
        const css = readSource('assets/css/profile-route.css');
        const luxuryCss = readSource('assets/css/index-luxury.css');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');

        expect(css).toContain('--prof-fade-surface');
        expect(css).toContain('--prof-fade-chip');
        expect(css).toContain('--prof-fade-row');
        expect(css).toContain('--prof-fade-blur');
        expect(css).toContain('#page-profile .page-hero');
        expect(css).toContain('background: var(--prof-fade-surface) !important');
        expect(css).toContain('Home-style command center restyle');
        expect(css).toContain('html.lux-high-transparency body.lux-route-profile');
        expect(css).not.toContain('rgba(255, 255, 255, 0.18)');

        expect(luxuryCss).toContain(':not(.lux-route-profile)');
        expect(luxuryCss).toMatch(/body\.lux-nonhome-page:not\(\.lux-route-students-admin\):not\(\.lux-route-profile\) \.page-hero/);

        expect(utilitiesSource).toContain("document.body.classList.contains('lux-route-profile')");
        expect(utilitiesSource).toContain("el.closest?.('#page-profile')");
        expect(utilitiesSource).toContain("el.classList.contains('profile-shell-nav-card')");
        expect(utilitiesSource).toContain("el.classList.contains('profile-shell-card')");
        expect(utilitiesSource).toContain("el.classList.contains('lux-hero-signal')");
    });
});
