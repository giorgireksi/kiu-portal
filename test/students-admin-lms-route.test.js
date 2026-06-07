import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('students admin LMS route replacement', () => {
  it('loads the dedicated LMS adapter from the standalone route shell', () => {
    const html = readSource('students-admin.html');
    const source = readSource('assets/js/pages/students-admin-lms.js');

    expect(html).toContain('assets/css/students-admin-lms.css?v=20260531-sadminglass1');
    expect(html).toContain('assets/js/pages/students-admin-lms.js?v=20260604-studentsboot1');
    expect(html).toContain('<section id="students-content" aria-live="polite"></section>');
    expect(html).toContain('assets/js/shared/messenger.js?v=20260429-peopleisolation1');
    expect(html).toContain('assets/js/shared/utilities.js?v=20260531-sadminglass1');
    expect(html).toContain('assets/js/features/index-luxury.js?v=20260527-studentsadmin-redesign1');
    expect(html).toContain('window.__KIU_STANDALONE_MOBILE_SHELL_CONFIG = {');
    expect(html).toContain("activeTarget: 'students-admin'");
    expect(html).toContain('assets/js/pages/standalone-mobile-shell.js?v=20260520-students-admin-mobile1');
    expect(html).not.toContain('assets/js/pages/directories.js');
    expect(html).not.toContain('assets/js/pages/lms.js');
    expect(html).not.toContain('student-register-overlay');
    expect(html).not.toContain('prof-register-overlay');
    expect(source).not.toContain('students-admin-fades');
    expect(source).not.toContain('students_lms_management');
    expect(source).toContain("uiState.view = 'directory';");
    expect(source).toContain('function renderDirectory(root)');
  });

  it('keeps the students-admin render entrypoint delegated to the LMS module', () => {
    const source = readSource('assets/js/pages/students-admin-lms.js');

    expect(source).toContain('window.renderStudentsPage = renderStudentsAdminLmsPage;');
    expect(source).toContain('window.renderStudentsAdminLmsPage = renderStudentsAdminLmsPage;');
    expect(source).toContain('function renderStudentsAdminLmsPage()');
    expect(source).toContain("window.openStudentRegistration = function openStudentRegistrationModern()");
  });

  it('preserves the LMS management feature surface inside the KIU adapter', () => {
    const source = readSource('assets/js/pages/students-admin-lms.js');

    expect(source).toContain('function completion(student)');
    expect(source).toContain('function risk(student)');
    expect(source).toContain('function renderDirectory(root)');
    expect(source).toContain('function renderProfile(root)');
    expect(source).toContain("['overview', 'Overview']");
    expect(source).toContain("['courses', 'Courses']");
    expect(source).toContain("['grades', 'Grades']");
    expect(source).toContain("['progress', 'Progress']");
    expect(source).toContain("['attendance', 'Attendance']");
    expect(source).toContain("['advising', 'Advising']");
    expect(source).toContain("['documents', 'Documents']");
    expect(source).toContain("['account', 'Account']");
    expect(source).toContain("['admin', 'Admin']");
    expect(source).toContain('function exportJSON()');
    expect(source).toContain('function exportCSV()');
    expect(source).toContain('function handleImportChange(event)');
    expect(source).toContain('function archiveStudent(id)');
    expect(source).toContain('function restoreStudent(id)');
    expect(source).toContain('function saveFormStudent()');
  });

  it('keeps the standalone route wired into the shell theme pipeline', () => {
    const html = readSource('students-admin.html');
    const css = readSource('assets/css/students-admin-lms.css');

    expect(html).toContain('<script defer src="assets/js/features/index-luxury.js');
    expect(html).toContain('<script defer src="assets/js/pages/students-admin-lms.js');
    expect(html).toContain('<nav id="mobile-bottom-nav" aria-label="Mobile navigation" hidden>');
    expect(html).toContain('<div id="mobile-action-sheet" class="mob-sheet" hidden role="dialog" aria-modal="true">');
    expect(css).toContain('--sadmin-fade-surface-fill');
    expect(css).toContain('var(--lux-transparency-alpha');
    expect(css).toContain('var(--lux-panel-alpha');
    expect(css).toContain('html.lux-light-mode body.lux-route-students-admin');
    expect(css).not.toContain('--students-lms-');
    expect(css).toContain('.students-lms-hero::before');
    expect(css).toContain('.students-lms-hero::after');
    expect(css).not.toContain('backdrop-filter: none');
  });
});
