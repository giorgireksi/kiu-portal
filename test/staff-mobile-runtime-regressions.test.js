import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('staff mobile runtime regressions', () => {
    it('uses direct hook setup instead of polling for mobile nav readiness', () => {
        const source = readSource('assets/js/pages/staff-mobile-shell.js');

        expect(source).toContain('function ensureNavigateHooks(){if(typeof window.navigate!==\'function\')return false;hookNav();buildRoleNav();return true}');
        expect(source).toContain("window.addEventListener('load',ensureNavigateHooks,{once:true});");
        expect(source).toContain('window.resolvePortalRouteUrl');
        expect(source).not.toContain('setInterval(');
        expect(source).not.toContain('waitForNavigate');
    });

    it('keeps the staff shell free of inline modal close handlers', () => {
        const html = readSource('staff.html');

        expect(html).not.toContain('onclick="closeAllModals(event)"');
        expect(html).not.toContain('modal-overlay" onclick');
        expect(html).toContain('data-modal-close');
        expect(html).toContain('<nav id="prof-nav" aria-label="Professor navigation stub"');
        expect(html).toContain('<nav id="top-nav" aria-label="Top navigation stub"');
        expect(html).toContain('<nav id="admin-nav" aria-label="Admin navigation stub"');
        expect(html).toContain('class="staff-shell-loading-state"');
        expect(html).toContain('class="modal-content staff-shell-modal staff-shell-modal-wide"');
        expect(html).toContain('class="modal-content staff-shell-modal"');
        expect(html).toContain('<button class="mob-sheet-btn" type="button" id="mob-act-admin"><span class="mob-sheet-icon"');
        expect(html).not.toContain('<button class="mob-sheet-btn" id="mob-act-admin"><div class="mob-sheet-icon"');
        expect(html).toContain('<button class="mob-sheet-close-btn" type="button" id="mob-sheet-close">');
    });

    it('only loads the staff-specific page runtimes that the command center uses', () => {
        const html = readSource('staff.html');
        const appSource = readSource('assets/js/app/app.js');
        const commandCenter = readSource('assets/js/pages/staff-command-center.js');
        const bootstrapSource = readSource('assets/js/pages/staff-route-bootstrap.js');

        expect(html).not.toContain('assets/js/pages/gradebook.js');
        expect(html).not.toContain('assets/js/pages/lms.js');
        expect(html).not.toContain('assets/js/pages/registration.js');
        expect(html).not.toContain('assets/js/pages/planner.js');
        expect(html).not.toContain('assets/js/pages/student-registration.js');
        expect(html).not.toContain('assets/js/pages/admin-registration.js');
        expect(html).not.toContain('assets/js/pages/directories.js?v=20260510-staff-admin3');
        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/js/app/api.js');
        expect(html).not.toContain('assets/js/features/ui.js');
        expect(html).toContain('assets/js/pages/staff-command-center.js?v=20260512-staffhub1');
        expect(html).toContain('assets/js/pages/staff-route-bootstrap.js?v=20260516-staffmobile1');
        expect(html).not.toContain('assets/js/pages/staff-mobile-shell.js?v=20260510-staff-admin3');
        expect(appSource).toContain('window.toggleMessaging = function toggleMessagingCompat()');
        expect(appSource).toContain('window.toggleNotifications = function toggleNotificationsCompat()');
        expect(commandCenter).toContain('function renderStaffPage()');
        expect(commandCenter).toContain('function openProfRegistration(role)');
        expect(commandCenter).toContain('function staffTabSwitch(tab)');
        expect(commandCenter).toContain("const DIRECTORIES_SCRIPT_URL = 'assets/js/pages/directories.js?v=20260510-staff-admin3';");
        expect(commandCenter).toContain('function ensureDirectoryProfileBridge()');
        expect(commandCenter).toContain("console.error('Failed to load deferred staff directory bridge.'");
        expect(commandCenter).toContain("showToast('Could not open the canonical profile right now.')");
        expect(bootstrapSource).toContain("const MOBILE_SHELL_SCRIPT_URL = 'assets/js/pages/staff-mobile-shell.js?v=20260510-staff-admin3';");
        expect(bootstrapSource).toContain('function shouldLoadMobileShell() {');
        expect(bootstrapSource).toContain("window.addEventListener('resize', handleResize);");
        expect(bootstrapSource).toContain("document.createElement('script');");
    });

    it('keeps canonical staff-directory defaults free of corrupted placeholder records', () => {
        const source = readSource('assets/js/pages/directories.js');

        expect(source).not.toContain('Ãƒ');
        expect(source).toContain("office: office || ''");
        expect(source).toContain("phone: ''");
        expect(source).toContain('Staff member ${newMember.name} added to ${getFacultyProfile(fac).name}.');
        expect(source).toContain('Shared text normalization keeps staff-directory values readable across legacy records.');
        expect(source).toContain("const blob = new Blob([html], { type: 'text/html' });");
        expect(source).toContain("const newWindow = window.open(objectUrl, '_blank');");
        expect(source).not.toContain('document.write(');
    });
});
