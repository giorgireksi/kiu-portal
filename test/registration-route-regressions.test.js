import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('registration route regressions', () => {
  it('keeps the registration shell free of dead social helper and legacy page-pack imports', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const messengerSource = readSource('assets/js/shared/messenger.js');
    const uiScript = readSource('assets/js/features/ui.js');

    expect(html).not.toContain('assets/js/shared/social-hub.js');
    expect(html).not.toContain('assets/js/shared/social-render.js');
    expect(html).not.toContain('assets/js/shared/social-media.js');
    expect(html).toContain('assets/js/shared/messenger.js?v=20260429-peopleisolation1');
    expect(html).not.toContain('assets/js/pages/gradebook.js');
    expect(html).not.toContain('assets/js/pages/lms.js');
    expect(html).not.toContain('assets/js/pages/registration.js');
    expect(html).not.toContain('assets/js/pages/directories.js');
    expect(html).toContain('<div id="modal-overlay" class="modal-overlay"></div>');
    expect(html).not.toContain('id="modal-announcement"');
    expect(html).not.toContain('id="modal-event"');
    expect(html).not.toContain('id="modal-syllabus"');
    expect(html).not.toContain('id="modal-programs"');
    expect(html).not.toContain('id="modal-program-courses"');
    expect(routeControllerSource).toContain('function refreshRegistrationUI() {');
    expect(routeControllerSource).toContain('function updateEctsProgress() {');
    expect(messengerSource).toContain('function renderPortalMessengerWorkspace()');
    expect(uiScript).toContain('function ensureSyllabusModal()');
    expect(uiScript).toContain('data-show-program-courses="1"');
  });

  it('uses delegated shell actions instead of inline registration HTML handlers', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const uiScript = readSource('assets/js/features/ui.js');

    expect(html).not.toContain('onclick="switchRegTab(');
    expect(html).not.toContain('onclick="closeAllModals(');
    expect(html).not.toContain('onclick="navigate(');
    expect(html).not.toContain('onclick="showProgramCourses(');
    expect(html).toContain('data-reg-tab="program"');
    expect(html).toContain('data-registration-nav="timetable"');
    expect(html).toContain('registration-hero lux-summary-surface lux-summary-surface--hero');
    expect(html).toContain('registration-focus-card lux-summary-surface lux-summary-surface--panel');
    expect(html).toContain('registration-insight-card lux-summary-surface lux-summary-surface--panel');
    expect(routeControllerSource).toContain('function initializeRegistrationShellInteractions()');
    expect(routeControllerSource).toContain('function handleRegistrationShellClick(event)');
    expect(routeControllerSource).toContain("event.target.closest('[data-modal-close]')");
    expect(uiScript).toContain('data-modal-close="1"');
  });

  it('keeps the student registration adapters wired from the slimmer shell', () => {
    const html = readSource('registration.html');
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const timetableRuntimeSource = readSource('assets/js/pages/timetable-runtime.js');
    const studentRegistrationSource = readSource('assets/js/pages/student-registration.js');

    expect(html).toContain('assets/js/pages/timetable-runtime.js?v=20260516-surface-split1');
    expect(html).not.toContain('assets/js/pages/planner.js');
    expect(html).toContain('assets/js/pages/student-registration.js?v=20260430-lmsgrades1');
    expect(html).not.toContain('assets/js/pages/admin-registration.js');
    expect(html).toContain('assets/js/pages/registration-student-route.js?v=20260516-studentroutesplit1');
    expect(timetableRuntimeSource).toContain('function renderTimetable() {');
    expect(timetableRuntimeSource).toContain('function renderStudentCalendarSchedule() {');
    expect(routeControllerSource).toContain('function getRegistrationGroupStats(courseId, group) {');
    expect(routeControllerSource).toContain('renderStudentRegStructures(window.__studentRegActiveTab || \'prog\')');
    expect(studentRegistrationSource).toContain('function getStudentRegistrationDataForTab(faculty, tabId) {');
    expect(studentRegistrationSource).toContain('function buildStudentRegistrationDataFromStandaloneState(faculty) {');
    expect(studentRegistrationSource).toContain('function renderStudentRegStructures(tabId = \'prog\')');
    expect(studentRegistrationSource).toContain('function openStudentCourseSectionPicker(courseId, courseName =');
    expect(studentRegistrationSource).toContain("{ id: 'history', label: 'History' }");
    expect(studentRegistrationSource).toContain("{ id: 'selected', label: 'Selected<br>Courses' }");
    expect(studentRegistrationSource).toContain("tab.setAttribute('data-reg-tab', desired.id);");
    expect(studentRegistrationSource).toContain("tab.removeAttribute('onclick');");
  });

  it('keeps registration avatars local instead of third-party placeholder services', () => {
    const routeControllerSource = readSource('assets/js/pages/registration-student-route.js');
    const legacyRegistrationSource = readSource('assets/js/pages/registration.js');
    const utilitiesSource = readSource('assets/js/shared/utilities.js');

    expect(routeControllerSource).toContain('function getRegistrationAvatarSrc(person, options = {}) {');
    expect(routeControllerSource).not.toContain('ui-avatars.com');
    expect(legacyRegistrationSource).toContain('function getRegistrationAvatarSrc(person, options = {}) {');
    expect(legacyRegistrationSource).not.toContain('ui-avatars.com');
    expect(legacyRegistrationSource).not.toContain('via.placeholder.com');
    expect(utilitiesSource).toContain("window.getInitialsAvatarDataUrl = function getInitialsAvatarDataUrl(name, options = {}) {");
    expect(utilitiesSource).toContain('data:image/svg+xml;charset=UTF-8,');
  });
});
