import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('index widget wave 2 regressions', () => {
  it('keeps programs overview aligned to index hero-side and strip-card widgets', () => {
    const source = readSource('assets/js/pages/programs-page.js');

    expect(source).toContain('class="lux-program-overview lux-hero-stage"');
    expect(source).toContain('class="lux-program-overview-main lux-hero-main"');
    expect(source).toContain('class="lux-program-metric-strip lux-program-summary-strip lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="lux-program-metric lux-program-summary-card wave2-summary-card lux-strip-card surface-card"');
    expect(source).toContain('class="lux-program-focus-panel lux-hero-side"');
    expect(source).toContain('class="lux-program-focus-stats lux-hero-signal-list"');
    expect(source).toContain('class="lux-program-focus-stat lux-hero-signal');
  });

  it('keeps study-card summary aligned to index hero-side and strip-card widgets', () => {
    const source = readSource('assets/js/pages/study-card-page.js');

    expect(source).toContain('class="lux-hero-stage study-card-summary-stage"');
    expect(source).toContain('class="lux-hero-main"');
    expect(source).toContain('class="lux-hero-side"');
    expect(source).toContain('class="lux-hero-signal-list"');
    expect(source).toContain('class="lux-hero-signal"');
    expect(source).toContain('class="lux-strip-grid lux-strip-grid--adaptive"');
    expect(source).toContain('class="lux-strip-card surface-card"');
  });

  it('keeps faculty-gradebook and chancellery summary widgets aligned to index strip and hero-side classes', () => {
    const facultyHtml = readSource('faculty-gradebook.html');
    const gradebookJs = readSource('assets/js/pages/gradebook.js');
    const chancelleryJs = readSource('assets/js/pages/chancellery.js');

    expect(facultyHtml).toContain('class="lux-faculty-hero-main lux-hero-main"');
    expect(facultyHtml).toContain('class="lux-faculty-hero-focus lux-hero-side"');
    expect(gradebookJs).toContain('class="gb-staff-stat-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(gradebookJs).toContain('class="lux-strip-card surface-card"><span>Students</span>');
    expect(chancelleryJs).toContain('class="lux-stat-grid lux-strip-grid lux-strip-grid--adaptive lux-chancellery-stats-grid"');
    expect(chancelleryJs).toContain('class="lux-stat-card lux-strip-card surface-card"');
  });

  it('keeps admin-orders aligned to the same index hero-side metric shell as orders', () => {
    const source = readSource('assets/js/shared/orders-workspace.js');

    expect(source).toContain('id="admin-orders-hero-main" class="lux-hero-main"');
    expect(source).toContain('id="admin-orders-hero-stats" class="lux-hero-side"');
    expect(source).toContain('Admin-side distribution metrics in the same hero-side signal language used on the home dashboard.');
    expect(source).toContain('Recipients covered');
  });

  it('keeps admin-library and timetable summary widgets aligned to index hero-side and strip-card classes', () => {
    const adminLibraryHtml = readSource('admin-library.html');
    const timetableHtml = readSource('timetable.html');

    expect(adminLibraryHtml).toContain('class="admin-library-metric-row admin-library-metric-row--compact"');
    expect(adminLibraryHtml).toContain('class="admin-library-metric-card wave2-summary-card"');
    expect(adminLibraryHtml).toContain('class="lux-hero-side admin-library-hero-summary"');
    expect(adminLibraryHtml).toContain('class="alib-panel alib-panel--entry"');
    expect(timetableHtml).toContain('class="lux-timetable-hero-main lux-hero-main"');
    expect(timetableHtml).toContain('class="lux-timetable-hero-focus lux-hero-side"');
    expect(timetableHtml).not.toContain('class="lux-card lux-timetable-insight lux-timetable-next-compact"');
    expect(timetableHtml).toContain('class="lux-timetable-hero-focus lux-hero-side"');
  });

  it('keeps the LMS hero summary cluster aligned to index hero-side and strip-card classes', () => {
    const lmsHtml = readSource('lms.html');

    expect(lmsHtml).toContain('class="lms-hero-v2-grid lux-hero-stage"');
    expect(lmsHtml).toContain('class="lms-hero-v2-left lux-hero-main"');
    expect(lmsHtml).toContain('class="lms-hero-v2-right lux-hero-side"');
    expect(lmsHtml).toContain('class="lms-hero-v2-stats lux-strip-grid lux-strip-grid--adaptive"');
    expect(lmsHtml).toContain('class="lms-hero-v2-stat lux-strip-card surface-card"');
  });

  it('keeps profile aligned to index hero-side and strip-card classes', () => {
    const profileHtml = readSource('profile.html');

    expect(profileHtml).toContain('class="lux-hero-main"');
    expect(profileHtml).toContain('class="lux-hero-side"');
    expect(profileHtml).toContain('class="lux-strip-grid lux-strip-grid--adaptive profile-summary-strip"');
    expect(profileHtml).toContain('class="lux-strip-card surface-card"');
  });

  it('keeps students-admin and staff summary widgets aligned to index hero-side and strip-card classes', () => {
    const studentsAdminJs = readSource('assets/js/pages/students-admin-lms.js');
    const staffJs = readSource('assets/js/pages/staff-command-center.js');

    expect(studentsAdminJs).toContain('class="students-lms-stat-card lux-strip-card surface-card"');
    expect(studentsAdminJs).toContain('class="students-lms-hero-board lux-hero-side"');
    expect(studentsAdminJs).toContain('class="students-lms-metric-grid lux-strip-grid lux-strip-grid--adaptive"');

    expect(staffJs).toContain('class="lux-hero-main"');
    expect(staffJs).toContain('class="staff-hub-hero-panel lux-hero-side"');
    expect(staffJs).toContain('class="staff-hub-mini-card staff-hub-metric-card lux-strip-card surface-card"');
    expect(staffJs).toContain('class="staff-hub-metrics lux-strip-grid lux-strip-grid--adaptive"');
    expect(staffJs).toContain('class="staff-hub-surface staff-hub-metric-card lux-strip-card"');
  });

  it('keeps exams and career-market top-level summary widgets aligned to index strip-card or hero-stage classes', () => {
    const examsJs = readSource('assets/js/pages/exams-console.js');
    const careerHtml = readSource('career-market.html');
    const careerJs = readSource('assets/js/pages/career-market.js');

    expect(examsJs).toContain('class="ex2-stats-row lux-strip-grid lux-strip-grid--adaptive"');
    expect(examsJs).toContain('class="ex2-stat-card lux-strip-card surface-card');

    expect(careerHtml).toContain('class="career-workspace-hero lux-hero-stage"');
    expect(careerHtml).toContain('class="lux-hero-main"');
    expect(careerHtml).toContain('class="career-workspace-badge lux-strip-card surface-card"');
    expect(careerJs).toContain('career-workspace-hero lux-hero-stage');
    expect(careerJs).toContain('career-workspace-badge career-workspace-badge-card lux-strip-card surface-card');
  });

  it('keeps social portfolio and events summary widgets aligned to index hero-side and strip-card classes', () => {
    const socialJs = readSource('assets/js/pages/social-page.js');

    expect(socialJs).toContain('class="social-neo-events-hero-stat lux-strip-card surface-card');
    expect(socialJs).toContain('class="social-neo-card social-portfolio-hero lux-hero-stage"');
    expect(socialJs).toContain('class="social-portfolio-hero-main lux-hero-main"');
    expect(socialJs).toContain('class="social-portfolio-hero-side lux-hero-side"');
    expect(socialJs).toContain('class="social-portfolio-stat-tile lux-strip-card surface-card"');
  });

  it('keeps admin-scheduler quick widgets aligned to index strip-card classes', () => {
    const schedulerHtml = readSource('admin-scheduler.html');
    const schedulerJs = readSource('assets/js/pages/admin-scheduler.js');

    expect(schedulerHtml).toContain('class="sch-rail-signal-grid lux-strip-grid lux-strip-grid--adaptive"');
    expect(schedulerHtml).toContain('class="sch-stat-card lux-strip-card lux-soft-chrome"');
    expect(schedulerJs).toContain("card.className = `lux-list-row lux-soft-chrome${isActive ? ' is-active' : ''}`;");
  });
});
