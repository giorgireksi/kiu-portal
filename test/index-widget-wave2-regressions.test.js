import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('index widget wave 2 regressions', () => {
  it('keeps programs overview aligned to index hero-side and strip-card widgets', () => {
    const source = readSource('assets/js/pages/programs-page.js');

    expect(source).toContain('programs-module-rail-region');
    expect(source).toContain('programs-subject-panel-region');
    expect(source).toContain('data-programs-panel-shell="1"');
    expect(source).toContain('programs-ops-total-ects');
  });

  it('keeps study-card summary aligned to index hero-side and strip-card widgets', () => {
    const source = readSource('assets/js/pages/study-card-page.js');

    expect(source).toContain('class="lux-hero-stage study-card-summary-stage"');
    expect(source).toContain('class="lux-hero-main study-card-summary-main lux-soft-chrome home-hover-chip"');
    expect(source).toContain('class="lux-hero-side lux-focus-panel study-card-summary-focus lux-soft-chrome home-hover-chip"');
    expect(source).toContain('class="lux-hero-signal home-hover-chip"');
    expect(source).toContain('lux-section-kicker study-card-summary-kicker');
    expect(source).toContain('study-card-term-row lux-soft-chrome home-hover-chip');
  });

  it('keeps faculty-gradebook and chancellery summary widgets aligned to index strip and hero-side classes', () => {
    const facultyHtml = readSource('faculty-gradebook.html');
    const gradebookJs = readSource('assets/js/pages/gradebook-staff.js');
    const chancelleryJs = readSource('assets/js/pages/chancellery.js');

    expect(facultyHtml).toContain('class="lux-fg-toolbar"');
    expect(facultyHtml).toContain('class="lux-fg-ops-grid"');
    expect(facultyHtml).toContain('data-lux-glass-root="1"');
    expect(gradebookJs).toContain('class="gb-staff-stat-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(gradebookJs).toContain('class="lux-strip-card surface-card"><span>Students</span>');
    expect(chancelleryJs).toContain('class="lux-strip-grid lux-strip-grid--adaptive lux-chancellery-finance-grid"');
    expect(chancelleryJs).toContain('class="lux-stat-card lux-strip-card home-hover-chip lux-chancellery-finance-card"');
    expect(chancelleryJs).not.toContain('class="lux-stat-card lux-strip-card surface-card"');
  });

  it('keeps admin-orders workspace shell and create modal mount aligned to bare portal stack', () => {
    const html = readSource('admin-orders.html');
    const workspace = readSource('assets/js/shared/orders-workspace.js');

    expect(html).toContain('lux-modals.css');
    expect(html).toContain('lux-entry-admin-orders');
    expect(html).toContain('data-lux-transparency-exempt="1"');
    expect(workspace).toContain('orders-admin-workspace-card lux-soft-chrome');
    expect(workspace).toContain('ensureAdminOrdersModals');
        expect(workspace).toContain('admin-orders-create-overlay');
        expect(workspace).toContain('modal-overlay admin-orders-modal-overlay');
        expect(workspace).toContain('admin-orders-thread-overlay');
  });

  it('keeps admin-library and timetable summary widgets aligned to index hero-side and strip-card classes', () => {
    const adminLibraryHtml = readSource('admin-library.html');
    const timetableHtml = readSource('timetable.html');

    expect(adminLibraryHtml).toContain('class="admin-library-metric-row admin-library-metric-row--compact"');
    expect(adminLibraryHtml).toContain('class="lux-stat-card admin-library-metric-card home-hover-chip"');
    expect(adminLibraryHtml).toContain('class="lux-strip-card admin-library-catalog-card lux-soft-chrome home-hover-chip"');
    expect(adminLibraryHtml).not.toContain('admin-library-hero-summary');
    expect(timetableHtml).not.toContain('class="lux-timetable-hero-main lux-hero-main"');
    expect(timetableHtml).toContain('class="lux-timetable-hero-focus lux-timetable-command-focus lux-hero-side lux-focus-panel home-hover-chip"');
    expect(timetableHtml).not.toContain('class="lux-card lux-timetable-insight lux-timetable-next-compact"');
    expect(timetableHtml).toContain('class="lux-timetable-hero-focus lux-timetable-command-focus lux-hero-side lux-focus-panel home-hover-chip"');
  });

  it('keeps the LMS hero summary cluster aligned to index hero-side and strip-card classes', () => {
    const lmsHtml = readSource('lms.html');

    expect(lmsHtml).toContain('class="lms-hero-v2-grid lux-hero-stage"');
    expect(lmsHtml).toContain('class="lms-hero-v2-left lux-hero-main"');
    expect(lmsHtml).toContain('class="lms-hero-focus lux-hero-side home-hover-chip"');
    expect(lmsHtml).toContain('lms-hero-focus-chip');
    expect(lmsHtml).toContain('lms-hero-focus-meta');
  });

  it('keeps profile aligned to index hero-side and strip-card classes', () => {
    const profileHtml = readSource('assets/js/pages/profile-view-page.js');

    expect(profileHtml).toContain('profile-view-root');
    expect(profileHtml).toContain('pv-metric-card');
    expect(profileHtml).toContain('pv-metrics');
  });

  it('keeps students-admin and staff summary widgets aligned to index hero-side and strip-card classes', () => {
    const studentsAdminJs = readSource('assets/js/pages/students-command-center.js');
    const staffJs = readSource('assets/js/pages/staff-command-center.js');

    expect(studentsAdminJs).toContain('students-command');
    expect(studentsAdminJs).toContain('renderStudentAcademicProfile');
    expect(studentsAdminJs).toContain('students-hub');

    expect(staffJs).toContain('staff-hub');
    expect(staffJs).toContain('staff-hub-profile');
    expect(staffJs).toContain('staff-hub-tabs');
  });

  it('keeps exams and career-market top-level summary widgets aligned to index strip-card or hero-stage classes', () => {
    const examsJs = readSource('assets/js/pages/exams-console.js');
    const careerHtml = readSource('programs.html');
    const careerJs = readSource('assets/js/pages/programs-page.js');

    expect(examsJs).toContain('class="ex2-stat-chip home-hover-chip lux-soft-chrome');
    expect(examsJs).toContain('ex2-status-dot');

    expect(careerHtml).toContain('lux-program-command-deck');
    expect(careerJs).toContain('programs-module-rail-region');
    expect(careerJs).toContain('programs-subject-panel-region');
  });

  it('keeps social portfolio and events summary widgets aligned to index hero-side and strip-card classes', () => {
    const socialEventsJs = readSource('assets/js/pages/social-events.js');
    const socialPortfolioJs = readSource('assets/js/pages/social-workspace-portfolio-ui.js');

    expect(socialEventsJs).toContain('class="social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
    expect(socialEventsJs).toContain('social-neo-event-feature social-neo-event-feature--${escape(tone)} home-hover-chip');
    expect(socialEventsJs).toContain('social-neo-events-hub-section social-neo-events-list-card home-hover-chip');
    expect(socialPortfolioJs).toContain('class="social-neo-card social-neo-portfolio-hero social-neo-community-panel social-neo-community-panel--portfolio home-hover-chip');
    expect(socialPortfolioJs).toContain('class="social-neo-portfolio-hero-stats home-hover-chip');
    expect(socialPortfolioJs).toContain('class="social-neo-portfolio-hero-stat social-neo-events-hero-stat lux-strip-card surface-card lux-soft-chrome home-hover-chip');
  });

  it('keeps admin-scheduler quick widgets aligned to index strip-card classes', () => {
    const schedulerHtml = readSource('admin-scheduler.html');
    const schedulerJs = readSource('assets/js/pages/admin-scheduler.js');

    expect(schedulerHtml).toContain('class="sch-rail-signal-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(schedulerHtml).toContain('class="sch-stat-card lux-strip-card lux-soft-chrome home-hover-chip"');
    expect(schedulerJs).toContain("card.className = `palette-card lux-strip-card lux-soft-chrome home-hover-chip${isActive ? ' selected' : ''}`");
  });
});
