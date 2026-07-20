import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
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
            'canAccessGradebookCourse'
        ]);
        expect(source).toContain("} = require('./domains/gradebook-service');");
        expect(source).toContain('return canAccessGradebookCourse.call(this, courseId, userId, role, action);');
        expect(source).not.toContain('return ensureGradebook.call(this, courseId);');
        expect(source).not.toContain('return setScore.call(this, payload);');
        expect(source).not.toContain('return finalizeGrades.call(this, payload);');
        expect(source).not.toContain('state.gradebooks');
    });

    it('preserves course-teaching-scope ACL through PlatformStore wrappers', () => {
        const store = buildStore();

        expect(store.canAccessGradebookCourse('COURSE-1', 'prof-1', 'professor', 'publish')).toBe(true);
        expect(store.canAccessGradebookCourse('COURSE-1', 'ta-1', 'ta', 'publish')).toBe(false);
        expect(store.canAccessGradebookCourse('COURSE-1', 'ta-1', 'ta', 'score')).toBe(true);
        expect(store.canAccessGradebookCourse('COURSE-1', 'ta-1', 'ta', 'read')).toBe(true);
        expect(store.canAccessGradebookCourse('COURSE-1', 'outsider', 'professor', 'read')).toBe(false);
        expect(store.state.gradebooks).toBeUndefined();
        expect(typeof store.setScore).toBe('undefined');
        expect(typeof store.finalizeGrades).toBe('undefined');
        expect(typeof store.ensureGradebook).toBe('undefined');
    });
});
