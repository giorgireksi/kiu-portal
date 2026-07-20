import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function makeStore() {
    return new PlatformStore();
}

describe('runtime gradebook and registration regressions', () => {
    it('treats overlapping section intervals as schedule conflicts instead of only exact start-time matches', () => {
        const store = makeStore();
        store.state.courses.COURSE_A = { id: 'COURSE_A', ects: 5, name: 'Course A' };
        store.state.courses.COURSE_B = { id: 'COURSE_B', ects: 5, name: 'Course B' };
        store.state.sections.SECTION_A = {
            id: 'SECTION_A',
            courseId: 'COURSE_A',
            seatsTotal: 30,
            seatsTaken: 1,
            schedule: [{ day: 'Mon', startTime: '09:00', endTime: '10:30', duration: '90min' }]
        };
        store.state.sections.SECTION_B = {
            id: 'SECTION_B',
            courseId: 'COURSE_B',
            seatsTotal: 30,
            seatsTaken: 0,
            schedule: [{ day: 'Mon', startTime: '10:00', endTime: '11:00', duration: '60min' }]
        };
        store.state.enrollments.ENR_A = {
            id: 'ENR_A',
            studentId: 'student-1',
            courseId: 'COURSE_A',
            sectionId: 'SECTION_A',
            status: 'active'
        };

        expect(store.hasScheduleConflict('student-1', 'SECTION_B')).toBe(true);
        expect(store.enrollStudent({ studentId: 'student-1', sectionId: 'SECTION_B' })).toMatchObject({
            error: 'This section conflicts with the current schedule.',
            status: 409
        });
    });

    it('keeps gradebook domain ACL-only without server score state', () => {
        const store = makeStore();
        const gradebookService = readSource('backend/platform/domains/gradebook-service.js');
        const stateShape = readSource('backend/platform/state-shape.js');
        expect(store.state.gradebooks).toBeUndefined();
        expect(stateShape).not.toContain('gradebooks:');
        expect(gradebookService).toContain('function canAccessGradebookCourse');
        expect(gradebookService).not.toContain('function setScore');
        expect(gradebookService).not.toContain('function ensureGradebook');
        expect(typeof store.setScore).toBe('undefined');
        expect(typeof store.computeRecordFinalScore).toBe('undefined');
    });
});
