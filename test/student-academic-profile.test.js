import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (typeof existsSync === 'function' && !existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('student academic profile runtime', () => {
    it('exposes academic snapshot and profile render helpers', () => {
        const runtime = readSource('assets/js/pages/student-academic-runtime.js');
        const commandCenter = readSource('assets/js/pages/students-command-center.js');
        const html = readSource('students-admin.html');

        expect(runtime).toContain('function loadStudentAcademicSnapshot(record)');
        expect(runtime).toContain('function renderStudentAcademicProfile(record, helpers = {})');
        expect(runtime).toContain('function renderStudentProfileMetrics(record, helpers = {})');
        expect(runtime).toContain('function executeInternalTransfer(record, options = {})');
        expect(runtime).toContain('window.loadStudentAcademicSnapshot = loadStudentAcademicSnapshot');
        expect(runtime).toContain('studentSchedulesByStudent');
        expect(runtime).toContain('studentPassedCourses');
        expect(runtime).toContain('curriculumPlan');

        expect(commandCenter).toContain("activeSectionId === 'sec_academic'");
        expect(commandCenter).toContain('renderStudentAcademicProfile');
        expect(commandCenter).toContain('renderStudentProfileMetrics');
        expect(commandCenter).toContain('execute-transfer');
        expect(commandCenter).toContain('add-subject');
        expect(commandCenter).toContain('remove-subject');
        expect(commandCenter).toContain('mark-subject-complete');
        expect(commandCenter).not.toContain('manage-enrollments');
        expect(commandCenter).toContain('curriculumPlan');

        expect(html).toContain('assets/js/shared/student-academic-helpers.js?v=20260705-student-academic13');
        expect(html).toContain('assets/js/pages/student-academic-runtime.js?v=20260729-acadoverview1');
        expect(html).toContain('assets/js/pages/students-command-center.js?v=20260731-hubrecords2');
        expect(runtime).toContain('hydrateStudentAcademicRecord');
        expect(runtime).toContain('toggleMobilityTransferPanel');
    });

    it('defines academic profile markup in runtime (bare-shell era)', () => {
        const runtime = readSource('assets/js/pages/student-academic-runtime.js');
        const utilities = readSource('assets/js/shared/utilities.js');

        expect(runtime).toContain('students-hub-profile-metrics');
        expect(runtime).toContain('students-hub-profile-metric lux-data-card home-hover-chip');
        expect(runtime).toContain('students-hub-academic-table');
        expect(runtime).toContain('students-hub-academic-overview');
        expect(runtime).toContain('lux-data-card home-hover-chip students-hub-academic-overview');
        expect(runtime).toContain('students-hub-academic-overview-cell lux-soft-chrome home-hover-chip');
        expect(runtime).toContain('students-hub-academic-progress lux-soft-chrome home-hover-chip');
        expect(runtime).toContain('students-hub-academic-stack');
        expect(runtime).toContain('students-hub-academic-schedule-canvas');
        expect(runtime).toContain('home-hover-chip students-hub-academic-section');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toContain('--students-hub-progress, var(--staff-hub-progress, 0%)');
        const routeRuntime = readSource('assets/js/shared/lux-transparency.js');
        expect(routeRuntime).toContain('isCssOwnedSurface');
        expect(existsSync(join(process.cwd(), 'assets/css/students-admin-lms.css'))).toBe(false);
    });
});