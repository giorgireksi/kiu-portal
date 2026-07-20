import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootAcademicRuntime(state = {}) {
    const vm = require('vm');
    const helpersSource = readSource('assets/js/shared/student-academic-helpers.js');
    const runtimeSource = readSource('assets/js/pages/student-academic-runtime.js');
    const context = {
        window: {},
        document: {
            getElementById: () => null,
            querySelectorAll: () => []
        },
        console,
        KIU_STATE: {
            users: [],
            facultyProfiles: {
                ECON: {
                    curriculum: [{ id: 'ECON-01-001', name: 'Intro Economics', ects: 6 }],
                    students: []
                }
            },
            studentSchedulesByStudent: {},
            studentPassedCourses: {},
            studentGrades: {},
            tuitionBalances: {},
            probationStatus: {},
            ...state
        },
        USER_ROLES: { STUDENT: 'student' },
        getCurrentFaculty: () => 'ECON',
        normalizeFacultyCode: (value, fallback = 'ECON') => String(value || fallback).trim().toUpperCase(),
        getFacultyProfile: (code) => context.KIU_STATE.facultyProfiles?.[code] || null,
        getActiveCurriculum: (faculty) => context.KIU_STATE.facultyProfiles?.[faculty]?.curriculum || [],
        canonicalCourseKey: (value) => String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, ''),
        deriveFacultyFromSubjectId: () => 'ECON',
        normalizeStudentScheduleValue: (value) => (Array.isArray(value) ? value : []),
        getUserPerformanceSummary: (user) => ({
            primary: String(user?.semester || '1'),
            secondary: '3.20',
            tertiary: '6',
            quaternary: 'B'
        }),
        getStudentDirectorySignals: () => ({ holdLabel: 'Clear', holdTone: 'success', balance: 0 }),
        cleanupEncodingArtifacts: (value) => value,
        toEnglishText: (value) => value
    };
    context.window = context;
    vm.createContext(context);
    vm.runInContext(helpersSource, context);
    vm.runInContext(runtimeSource, context);
    return context;
}

describe('student academic runtime behavior', () => {
    it('merges schedule and passed courses into academic snapshot subjects', () => {
        const ctx = bootAcademicRuntime({
            studentSchedulesByStudent: {
                'stu-1': [{ courseId: 'ECON-01-001', courseName: 'Intro Economics', ects: 6, day: 'Mon', time: '10:00' }]
            },
            studentPassedCourses: {
                'stu-1': ['ECON-02-001']
            },
            facultyProfiles: {
                ECON: {
                    curriculum: [
                        { id: 'ECON-01-001', name: 'Intro Economics', ects: 6 },
                        { id: 'ECON-02-001', name: 'Macro Economics', ects: 6 }
                    ],
                    students: []
                }
            }
        });

        const snapshot = ctx.loadStudentAcademicSnapshot({
            id: 'stu-1',
            facultyCode: 'ECON',
            gpa: 3.2,
            semester: '3'
        });

        expect(snapshot.subjectCount).toBeGreaterThanOrEqual(2);
        expect(snapshot.enrolledCount).toBe(1);
        expect(snapshot.completedCount).toBeGreaterThanOrEqual(1);
        expect(snapshot.subjects.some((item) => item.courseId === 'ECON-01-001' && item.status === 'enrolled')).toBe(true);
    });

    it('executes internal transfer with faculty and history updates', () => {
        const ctx = bootAcademicRuntime({
            facultyProfiles: {
                ECON: { curriculum: [], students: [{ id: 'stu-1', name: 'Alex' }] },
                LAW: { curriculum: [], students: [] }
            }
        });

        const transferred = ctx.executeInternalTransfer({
            id: 'stu-1',
            name: 'Alex',
            facultyCode: 'ECON',
            faculty: 'School of Business',
            curriculumPlan: { completedSubjectIds: ['ECON-01-001'] }
        }, {
            sourceFaculty: 'ECON',
            targetFaculty: 'LAW',
            subjectIds: ['LAW-01-001'],
            effectiveFrom: '2026-09-01',
            notes: 'Internal move'
        });

        expect(transferred).not.toBeNull();
        expect(transferred.facultyCode).toBe('LAW');
        expect(transferred.mobility.category).toBe('internal_transfer');
        expect(transferred.mobility.history).toHaveLength(1);
        expect(transferred.curriculumPlan.subjectIds).toEqual(['LAW-01-001']);
        expect(ctx.KIU_STATE.facultyProfiles.ECON.students).toHaveLength(0);
    });

    it('applies API enrollments into local student schedule state', () => {
        const ctx = bootAcademicRuntime();
        const applied = ctx.applyApiEnrollmentsToStudentState('stu-9', [{
            courseId: 'ECON-01-001',
            sectionId: 'G1',
            course: { id: 'ECON-01-001', name: 'Intro Economics', ects: 6, faculty: 'ECON' },
            section: { id: 'G1', name: 'Group 1', day: 'Tue', time: '11:00' }
        }]);

        expect(applied).toBe(true);
        expect(ctx.KIU_STATE.studentSchedulesByStudent['stu-9']).toHaveLength(1);
        expect(ctx.KIU_STATE.studentSchedulesByStudent['stu-9'][0].courseId).toBe('ECON-01-001');
    });
});