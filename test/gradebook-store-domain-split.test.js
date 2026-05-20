import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const gradebookService = require('../backend/platform/domains/gradebook-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function buildStore() {
    const store = new PlatformStore({});
    store.state.accounts['student-1'] = {
        id: 'student-1',
        displayName: 'Student One',
        email: 'student1@example.com',
        role: 'student',
        facultyCode: 'ECON',
        accountStatus: 'active'
    };
    store.state.courses['COURSE-1'] = {
        id: 'COURSE-1',
        name: 'Economics 101'
    };
    store.state.sections['SECTION-1'] = {
        id: 'SECTION-1',
        courseId: 'COURSE-1',
        professorId: 'prof-1',
        taId: 'ta-1',
        teachingTeam: [
            { userId: 'prof-1', role: 'instructor' },
            { userId: 'ta-1', role: 'ta' }
        ]
    };
    store.state.enrollments['ENROLL-1'] = {
        id: 'ENROLL-1',
        sectionId: 'SECTION-1',
        courseId: 'COURSE-1',
        studentId: 'student-1',
        status: 'active'
    };
    return store;
}

describe('gradebook store domain split', () => {
    it('keeps gradebook ownership in gradebook-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(gradebookService).sort()).toEqual([
            'aggregateGradebookAssessmentEntries',
            'canAccessGradebookCourse',
            'computeRecordFinalScore',
            'ensureGradebook',
            'finalizeGrades',
            'getGradebookAssessmentDefinition',
            'getGradebookCourse',
            'publishGradebook',
            'setScore'
        ]);
        expect(source).toContain("} = require('./domains/gradebook-service');");
        expect(source).toContain('return ensureGradebook.call(this, courseId);');
        expect(source).toContain('return setScore.call(this, payload);');
        expect(source).toContain('return finalizeGrades.call(this, payload);');
    });

    it('preserves gradebook scoring behavior through PlatformStore wrappers', () => {
        const store = buildStore();

        expect(store.canAccessGradebookCourse('COURSE-1', 'prof-1', 'professor', 'publish')).toBe(true);
        expect(store.canAccessGradebookCourse('COURSE-1', 'ta-1', 'ta', 'publish')).toBe(false);

        store.setScore({ courseId: 'COURSE-1', studentId: 'student-1', criterion: 'quiz', assessmentNumber: 1, score: 8, actorUserId: 'prof-1' });
        store.setScore({ courseId: 'COURSE-1', studentId: 'student-1', criterion: 'homework', assessmentNumber: 1, score: 90, actorUserId: 'prof-1' });
        const gradebook = store.setScore({ courseId: 'COURSE-1', studentId: 'student-1', criterion: 'final', assessmentNumber: 1, score: 80, actorUserId: 'prof-1' });

        expect(gradebook.records['student-1'].finalScore).toBeGreaterThan(0);
        const finalized = store.finalizeGrades({ courseId: 'COURSE-1', actorUserId: 'prof-1', finalizedBy: 'prof-1' });
        expect(finalized.finalGradesReleased).toBe(true);
        expect(finalized.records['student-1'].assessments.final[0].status).toBe('finalized');
    });
});
