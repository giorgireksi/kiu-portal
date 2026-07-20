import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const lmsCourseService = require('../backend/platform/domains/lms-course-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms course store domain split', () => {
    it('keeps LMS course/material ownership in lms-course-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(lmsCourseService).sort()).toEqual([
            'createAssignment',
            'createMaterial',
            'ensureLmsCourse',
            'getLmsCourse',
            'getSectionsByCourse',
            'getStudentEnrollmentsByCourse',
            'isCourseTeachingStaff'
        ]);
        expect(source).toContain("} = require('./domains/lms-course-service');");
        expect(source).toContain('return ensureLmsCourse.call(this, courseId);');
        expect(source).toContain('return createAssignment.call(this, payload);');
        expect(source).toContain('return isCourseTeachingStaff.call(this, courseId, userId, role);');
    });

    it('preserves LMS course, assignment, and teaching-team behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});
        store.state.courses['COURSE-1'] = { id: 'COURSE-1', name: 'Economics 101' };
        store.state.sections['SECTION-1'] = {
            id: 'SECTION-1',
            courseId: 'COURSE-1',
            professorId: 'prof-1',
            taId: 'ta-1'
        };
        store.state.enrollments['ENROLL-1'] = {
            id: 'ENROLL-1',
            courseId: 'COURSE-1',
            sectionId: 'SECTION-1',
            studentId: 'student-1',
            status: 'active'
        };

        const assignment = store.createAssignment({
            courseId: 'COURSE-1',
            title: 'Homework 1',
            createdBy: 'prof-1'
        });
        const material = store.createMaterial({
            courseId: 'COURSE-1',
            title: 'Week 1 Slides',
            createdBy: 'prof-1'
        });
        const course = store.getLmsCourse('COURSE-1');

        expect(assignment?.title).toBe('Homework 1');
        expect(material?.title).toBe('Week 1 Slides');
        expect(course?.assignments).toHaveLength(1);
        expect(course?.materials).toHaveLength(1);
        expect(store.getStudentEnrollmentsByCourse('COURSE-1')).toHaveLength(1);
        expect(store.isCourseTeachingStaff('COURSE-1', 'prof-1', 'professor')).toBe(true);
        expect(store.isCourseTeachingStaff('COURSE-1', 'ta-1', 'ta')).toBe(true);
    });
});
