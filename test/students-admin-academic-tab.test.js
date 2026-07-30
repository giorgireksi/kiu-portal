import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('students-admin academic tab redesign', () => {
    it('extends academic snapshot with progress and grouping fields', () => {
        const runtime = readSource('assets/js/pages/student-academic-runtime.js');

        expect(runtime).toContain('programRequiredEcts');
        expect(runtime).toContain('remainingEcts');
        expect(runtime).toContain('subjectsByStatus');
        expect(runtime).toContain('scheduleItems');
        expect(runtime).toContain('averageGradeLabel');
        expect(runtime).toContain('touchStudentAcademicSync');
    });

    it('renders redesigned academic tab without duplicate metric strip', () => {
        const runtime = readSource('assets/js/pages/student-academic-runtime.js');

        expect(runtime).toContain('students-hub-academic-overview');
        expect(runtime).toContain('Active enrollments');
        expect(runtime).toContain('Passed subjects');
        expect(runtime).toContain('Planned curriculum');
        expect(runtime).not.toContain('Weekly schedule');
        expect(runtime).not.toContain('Week navigation and sessions/grid view');
        expect(runtime).not.toContain('Add enrollment');
        expect(runtime).not.toContain('students-hub-academic-enroll-card');
        expect(runtime).not.toContain('student-academic-add-subject');
        expect(runtime).toContain('Failed subjects');
        expect(runtime).toContain('students-hub-academic-section-btn');
        expect(runtime).toContain('open-academic-subjects');
        expect(runtime).toContain('data-academic-list');
        expect(runtime).toContain('renderAcademicSubjectsModalContent');
        expect(runtime).toContain('is-modal-scroll');
        expect(runtime).toContain('students-hub-academic-modal-panel');
        expect(runtime).toContain('students-hub-academic-modal-empty');
        expect(runtime).toContain('emptyHint');
        expect(runtime).toContain('fa-circle-xmark');
        expect(runtime).toContain('academic-subjects-search');
        expect(runtime).toContain('academic-subjects-sort');
        expect(runtime).toContain('clear-academic-subjects-filters');
        expect(runtime).toContain('filterAndSortAcademicSubjects');
        expect(runtime).toContain('academicSubjectMatchesQuery');
        expect(runtime).toContain('No subjects match your filters.');
        expect(runtime).not.toContain('is-compact-scroll');
        expect(runtime).toContain('student-academic-schedule-canvas');
        expect(runtime).toContain('is-embed-compact');
        expect(runtime).toContain('data-lux-transparency-exempt="1"');
        expect(runtime).not.toContain('open-academic-route');
        expect(runtime).toContain('subjectsByStatus.failed');
        expect(runtime).not.toMatch(/students-hub-academic-metrics[\s\S]*GPA[\s\S]*ECTS completed/);
    });

    it('hydrates academic data when opening student profiles', () => {
        const commandCenter = readSource('assets/js/pages/students-command-center.js');

        expect(commandCenter).toContain('refreshStudentAcademicHydration');
        expect(commandCenter).toContain('await refreshStudentAcademicHydration(id)');
        expect(commandCenter).toContain("state.profileTab === 'sec_academic'");
        expect(commandCenter).toContain('renderStudentAdminScheduleEmbed');
        expect(commandCenter).toContain('academicSubjectsModal');
        expect(commandCenter).toContain('academicSubjectsFilters');
        expect(commandCenter).toContain('openAcademicSubjectsModal');
        expect(commandCenter).toContain('closeAcademicSubjectsModal');
        expect(commandCenter).toContain('renderAcademicSubjectsModal');
        expect(commandCenter).toContain('refreshAcademicSubjectsModal');
        expect(commandCenter).toContain('resetAcademicSubjectsFilters');
        expect(commandCenter).toContain('open-academic-subjects');
        expect(commandCenter).toContain('close-academic-subjects');
        expect(commandCenter).toContain('dismiss-academic-subjects');
        expect(commandCenter).toContain('clear-academic-subjects-filters');
        expect(commandCenter).toContain('academic-subjects-search');
        expect(commandCenter).toContain('academic-subjects-sort');
        expect(commandCenter).toContain('is-list-');
        expect(commandCenter).toContain('students-hub-academic-subjects-close');
        expect(commandCenter).toContain('aria-label="Close"');
        expect(commandCenter).toContain('students-hub-academic-subjects-body');
        const academicModalFn = commandCenter.match(/function renderAcademicSubjectsModal[\s\S]*?\n    function renderModal/);
        expect(academicModalFn?.[0] || '').not.toContain('students-hub-modal-foot');
        expect(academicModalFn?.[0] || '').not.toContain('students-hub-modal-copy');
    });

    it('loads compact timetable embed on students-admin route', () => {
        const html = readSource('students-admin.html');
        const timetable = readSource('assets/js/pages/timetable-runtime.js');
        const runtime = readSource('assets/js/pages/student-academic-runtime.js');
        const bare = readSource('assets/css/lux-page-bare-lite.css');

        expect(html).toContain('timetable-runtime.js');
        expect(html).not.toContain('timetable-route.css');
        expect(html).not.toContain('student-schedule-preview.js');
        expect(timetable).toContain('renderStudentAdminScheduleEmbed');
        expect(timetable).toContain('compactEmbed: true');
        expect(timetable).toContain('timetableOnly: true');
        expect(timetable).toContain('showNowLine: false');
        expect(timetable).toContain("defaultView = 'timetable'");
        expect(timetable).toContain("'24:00'");
        expect(timetable).toContain('slotHeight: 36');
        expect(timetable).toContain('shellHeaderPad: 52');
        expect(timetable).toContain('schedule-controls-embed-compact');
        expect(timetable).toContain('data-lux-transparency-exempt');
        expect(timetable).toContain('currentWeekButtonMarkup');
        expect(timetable).toContain('getStudentScheduleItemsForWeek');
        expect(runtime).toContain('students-hub-academic-overview');
        expect(runtime).toContain('lux-data-card home-hover-chip students-hub-academic-overview');
        expect(runtime).toContain('students-hub-academic-overview-cell lux-soft-chrome home-hover-chip');
        expect(runtime).toContain('students-hub-academic-progress lux-soft-chrome home-hover-chip');
        expect(runtime).toContain('students-hub-academic-schedule-card is-embed-compact');
        expect(runtime).not.toContain('home-hover-chip students-hub-academic-schedule-card');
        expect(runtime).toContain('home-hover-chip students-hub-academic-section');
        expect(html).toContain('layout-schedule.css');
        expect(timetable).toContain('if (profileMode) delete shell.dataset.luxGlassRoot');
        expect(timetable).toContain('Profile embeds already expose week nav');
        expect(timetable).toContain('lux-secondary-btn schedule-week-arrow lux-timetable-week-arrow');
        expect(bare).toContain('.students-hub-academic-schedule-card .sch-grid-tag');
        expect(bare).toContain('.students-hub-academic-schedule-card .schedule-week-label');
        expect(existsSync(join(process.cwd(), 'assets/css/students-admin-lms.css'))).toBe(false);
    });
});