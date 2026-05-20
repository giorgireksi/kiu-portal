import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

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

    it('computes final gradebook scores with weighted criterion math', () => {
        const store = makeStore();
        store.state.courses.COURSE_G = { id: 'COURSE_G', ects: 5, name: 'Weighted Course' };
        store.state.sections.SECTION_G = {
            id: 'SECTION_G',
            courseId: 'COURSE_G',
            seatsTotal: 30,
            seatsTaken: 1,
            schedule: []
        };
        store.state.enrollments.ENR_G = {
            id: 'ENR_G',
            studentId: 'student-2',
            courseId: 'COURSE_G',
            sectionId: 'SECTION_G',
            status: 'active'
        };

        store.setScore({ courseId: 'COURSE_G', studentId: 'student-2', criterion: 'quiz', assessmentNumber: 1, score: 8 });
        store.setScore({ courseId: 'COURSE_G', studentId: 'student-2', criterion: 'homework', assessmentNumber: 1, score: 90 });
        store.setScore({ courseId: 'COURSE_G', studentId: 'student-2', criterion: 'midterm', assessmentNumber: 1, score: 70 });
        const gradebook = store.setScore({ courseId: 'COURSE_G', studentId: 'student-2', criterion: 'final', assessmentNumber: 1, score: 80 });

        expect(gradebook.records['student-2'].finalScore).toBe(78);
    });
});
