import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootStaffMobileShell(options = {}) {
    const dom = new JSDOM(
        `<!DOCTYPE html><html><head></head><body class="lux-route-staff role-admin">
          <button id="lux-sidebar-toggle"></button>
          <nav id="mobile-bottom-nav" aria-label="Mobile navigation" hidden>
            <div class="mobile-nav-row">
              <button class="mobile-nav-btn is-active" id="mob-nav-home" type="button" data-nav-target="home"></button>
              <button class="mobile-nav-btn" id="mob-nav-messages" type="button"></button>
              <button class="mobile-nav-btn" id="mob-nav-notif" type="button"></button>
              <button class="mobile-nav-btn" id="mob-nav-theme" type="button"></button>
              <button class="mobile-nav-btn" id="mob-nav-more" type="button"></button>
            </div>
          </nav>
          <div id="mobile-action-sheet" hidden>
            <div id="mob-sheet-backdrop"></div>
            <div id="mob-sheet-dynamic-nav"></div>
            <button id="mob-sheet-close" type="button"></button>
            <button id="mob-act-admin" type="button"></button>
            <button id="mob-act-theme" type="button"></button>
            <button id="mob-act-profile" type="button"></button>
            <button id="mob-act-lightmode" type="button"><span>Light Mode</span><i class="fas fa-sun"></i></button>
          </div>
          <div class="staff-admin-controls"><button class="lux-primary-btn" type="button" id="staff-create-btn"></button></div>
        </body></html>`,
        {
            url: 'http://localhost/staff.html?view=admin',
            runScripts: 'outside-only'
        }
    );

    dom.window.innerWidth = 480;
    dom.window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {
        activeTarget: 'staff',
        adminVisibleRoles: ['admin', 'student_service', 'professor', 'ta'],
        adminPickerSelector: '.staff-admin-controls .lux-primary-btn,.lux-picker-btn',
        navByRole: {
            admin: [
                {
                    group: 'Control',
                    items: [['home', 'Dashboard', 'fas fa-hammer'], ['staff', 'Staff', 'fas fa-users-cog'], ['students-admin', 'Students', 'fas fa-user-graduate']]
                }
            ]
        }
    };
    if (options.withNavigate !== false) {
        dom.window.navigate = vi.fn();
    }
    dom.window.getEffectiveRole = () => 'admin';
    dom.window.resolvePortalRouteUrl = vi.fn((target, role) => `#${role}-${target}`);
    dom.window.requestAnimationFrame = (cb) => {
        cb(0);
        return 1;
    };
    dom.window.setTimeout = (cb) => {
        cb();
        return 1;
    };

    dom.window.eval(readSource('assets/js/pages/standalone-mobile-shell.js'));
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded', { bubbles: true }));
    return dom;
}

describe('staff mobile runtime regressions', () => {
    it('migrates the page onto the shared standalone mobile shell contract', () => {
        const html = readSource('staff.html');
        const classificationModule = readSource('tools/visual-route-classification.js');
        const classificationMarkdown = readSource('PORTAL_VISUAL_ROUTE_CLASSIFICATION.md');

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
        expect(html).toContain('<nav id="mobile-bottom-nav" aria-label="Mobile navigation" hidden>');
        expect(html).toContain('<em class="mob-badge" id="mob-badge-msg" hidden>0</em>');
        expect(html).toContain('<em class="mob-badge" id="mob-badge-notif" hidden>0</em>');
        expect(html).toContain('<div id="mobile-action-sheet" class="mob-sheet" hidden role="dialog" aria-modal="true">');
        expect(html).toContain("activeTarget: 'staff'");
        expect(html).toContain("adminPickerSelector: '.staff-admin-controls .lux-primary-btn,.lux-picker-btn'");
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-staff-mobile1');
        expect(html).not.toContain('assets/js/pages/staff-route-bootstrap.js?v=20260516-staffmobile1');
        expect(html).not.toContain('assets/js/pages/staff-mobile-shell.js?v=20260510-staff-admin3');
        expect(html).not.toContain('assets/css/admin-directories.css');
        expect(classificationModule).toContain("'staff.html': { category: 'special-surface', dedicatedCss: ['assets/css/staff-command-center.css'], mobileShell: 'shared-standalone' }");
        expect(classificationMarkdown).toContain("| `staff.html` | `special-surface` | `assets/css/staff-command-center.css` | `shared-standalone` |");
    });

    it('uses the shared standalone shell on first tap and clears the default home active state', () => {
        const dom = bootStaffMobileShell({ withNavigate: false });
        const doc = dom.window.document;

        expect(doc.getElementById('mob-nav-home')?.classList.contains('is-active')).toBe(false);

        doc.getElementById('mob-nav-more')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
        doc.querySelector('#mob-sheet-dynamic-nav [data-nav-target="students-admin"]')
            ?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

        expect(dom.window.resolvePortalRouteUrl).toHaveBeenCalledWith('students-admin', 'admin');
        expect(dom.window.location.hash).toBe('#admin-students-admin');
    });

    it('only loads the staff-specific page runtimes that the command center uses', () => {
        const html = readSource('staff.html');
        const appSource = readSource('assets/js/app/app.js');
        const commandCenter = readSource('assets/js/pages/staff-command-center.js');

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
        expect(html).toContain('assets/js/pages/staff-command-center.js?v=20260604-staffboot1');
        expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-staff-mobile1');
        expect(appSource).toContain('window.toggleMessaging = function toggleMessagingCompat()');
        expect(appSource).toContain('window.toggleNotifications = function toggleNotificationsCompat()');
        expect(commandCenter).toContain('function renderStaffPage()');
        expect(commandCenter).toContain('function openProfRegistration(role)');
        expect(commandCenter).toContain('function staffTabSwitch(tab)');
        expect(commandCenter).toContain("const DIRECTORIES_SCRIPT_URL = 'assets/js/pages/directories.js?v=20260510-staff-admin3';");
        expect(commandCenter).toContain('function ensureDirectoryProfileBridge()');
        expect(commandCenter).toContain("console.error('Failed to load deferred staff directory bridge.'");
        expect(commandCenter).toContain("showToast('Could not open the canonical profile right now.')");
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
