import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import { GRADEBOOK_MODULE_PATHS } from './helpers/gradebook-sources.js';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadMessengerGradebookApi(extra = {}) {
    const source = readSource('assets/js/shared/messenger-gradebook-runtime.js');
    const stateSource = readSource('assets/js/app/state.js');
    const normalizeMatch = stateSource.match(/function normalizeStudentScheduleValue\(schedule\)[\s\S]*?\n}\n/);
    const KIU_STATE = {
        studentGrades: {},
        studentSchedulesByStudent: {
            'STU-ECON-TEST-1': {
                '0': { courseId: 'test', groupId: 'G1', faculty: 'ECON', groupName: 'G1' }
            }
        },
        availableGroups: {
            test: [{ id: 'G1', name: 'G1', faculty: 'ECON', prof: 'TBD', semester: '1' }]
        },
        facultyProfiles: {
            ECON: {
                curriculum: [{ id: 'test', name: 'test' }],
                professors: [{ id: 'admin-testing-econ-professor', name: 'Professor' }],
                tas: [],
                students: [{ id: 'STU-ECON-TEST-1', name: 'Test Student', facultyCode: 'ECON' }]
            }
        },
        curriculum: [{ id: 'test', name: 'test' }],
        activeSemester: '1',
        gradebookCustomSections: {},
        gradebookSubjectSchemes: {},
        gradebookSubjectComponents: {},
        gradebookWeightProfiles: {},
        ...(extra.KIU_STATE || {})
    };
    const professor = {
        id: 'admin-testing-econ-professor',
        role: 'professor',
        facultyCode: 'ECON',
        name: 'Professor'
    };
    const sandbox = {
        KIU_STATE,
        window: {},
        currentGradebookSection: null,
        currentRosterId: '',
        mockStudents: [],
        USER_ROLES: { STUDENT: 'student', PROFESSOR: 'professor', TA: 'ta', ADMIN: 'admin' },
        normalizeIdentifier: (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''),
        canonicalCourseKey: (value) => String(value || '').trim().toLowerCase(),
        normalizeFacultyCode: (value, fallback = '') => String(value || fallback || '').trim().toUpperCase() || fallback,
        deriveFacultyFromSubjectId: (id) => String(id || '').split('-')[0] || 'ECON',
        getDomain: () => ({
            usersById: {
                [professor.id]: professor,
                'STU-ECON-TEST-1': { id: 'STU-ECON-TEST-1', name: 'Test Student', facultyCode: 'ECON' }
            },
            subjectsById: { test: { id: 'test', name: 'test' } }
        }),
        getAvailableGroupsForSubject: (courseId) => KIU_STATE.availableGroups?.[courseId] || [],
        getAllStudents: (faculty) => KIU_STATE.facultyProfiles?.[faculty || 'ECON']?.students || [],
        ensureGradeRecordHistories: (record = {}) => ({ ...record, assessments: record.assessments || {} }),
        cleanupEncodingArtifacts: (value) => String(value || ''),
        toEnglishText: (value) => String(value || ''),
        getCurrentUser: () => professor,
        getCurrentFaculty: () => 'ECON',
        getActiveCurriculum: (faculty) => KIU_STATE.facultyProfiles?.[faculty]?.curriculum || [],
        getUiDisplayName: () => '',
        getEffectiveUserRole: () => 'professor',
        saveState: () => {},
        alert: () => {},
        escapeHtml: (value) => String(value || ''),
        document: {
            body: { classList: { contains: (cls) => cls === 'lux-route-faculty-gradebook' } },
            querySelectorAll: () => [],
            getElementById: (id) => {
                if (id === 'gradebook-faculty-staff-workspace') return { id };
                if (id === 'fs-filter-sem') return { value: 'all' };
                if (id === 'fs-filter-fac') return { value: 'ECON' };
                if (id === 'fs-filter-subject') return { value: 'test' };
                if (id === 'fs-filter-group') return { value: 'G1' };
                return null;
            }
        },
        ...extra
    };
    sandbox.window = sandbox;
    const vm = require('vm');
    vm.createContext(sandbox);
    if (normalizeMatch?.[0]) vm.runInContext(normalizeMatch[0], sandbox);
    vm.runInContext(source, sandbox);
    return sandbox;
}

function loadFacultyGradebookChain(extra = {}) {
    const sandbox = loadMessengerGradebookApi(extra);
    const vm = require('vm');
    GRADEBOOK_MODULE_PATHS.forEach((path) => {
        vm.runInContext(readSource(path), sandbox);
    });
    return sandbox;
}

describe('faculty gradebook roster sync', () => {
    it('enrolls students with object-shaped schedule entries via getEnrolledStudentsForGroup', () => {
        const ctx = loadMessengerGradebookApi();
        const enrolled = ctx.getEnrolledStudentsForGroup('test', 'G1');
        expect(enrolled.some((entry) => entry.id === 'STU-ECON-TEST-1')).toBe(true);
    });

    it('syncs roster rows when the full gradebook model normalizer is absent', () => {
        const ctx = loadMessengerGradebookApi({ ensureGradeRecordHistories: undefined });
        ctx.syncGradebookRostersForStudent('STU-ECON-TEST-1');
        const rosterKeys = Object.keys(ctx.KIU_STATE.studentGrades);
        expect(rosterKeys.length).toBeGreaterThan(0);
        const roster = ctx.KIU_STATE.studentGrades[rosterKeys[0]];
        expect(roster.some((entry) => entry.id === 'STU-ECON-TEST-1')).toBe(true);
        expect(roster[0].assessments).toBeDefined();
    });

    it('syncs roster rows for object-shaped schedule via syncGradebookRostersForStudent', () => {
        const ctx = loadMessengerGradebookApi();
        ctx.syncGradebookRostersForStudent('STU-ECON-TEST-1');
        const rosterKeys = Object.keys(ctx.KIU_STATE.studentGrades);
        expect(rosterKeys.length).toBeGreaterThan(0);
        const roster = ctx.KIU_STATE.studentGrades[rosterKeys[0]];
        expect(roster.some((entry) => entry.id === 'STU-ECON-TEST-1')).toBe(true);
    });

    it('syncs gradebook roster from enrollment during faculty aggregate build', () => {
        const staff = readSource('assets/js/pages/gradebook-staff.js');
        const buildFn = staff.match(/function buildFacultyGradebookAggregateRoster\([\s\S]*?\n}\n/);
        expect(buildFn?.[0]).toContain('syncGradebookRosterFromEnrollment(group.courseId, group.groupId)');
        expect(buildFn[0]).toContain('KIU_STATE.studentGrades[rosterKey]');
    });

    it('wires faculty-aware persist retry and mockStudents upsert fallback', () => {
        const workspace = readSource('assets/js/pages/gradebook-workspace.js');
        expect(workspace).toContain('syncFacultyGradebookRostersForStudent(studentId, rosterId)');
        expect(workspace).toMatch(/mockStudents[\s\S]*ensureGradeRecordHistories\(mockRecord\)/);
        expect(readSource('assets/js/pages/gradebook-staff.js')).toContain('function syncFacultyGradebookRostersForStudent(');
    });

    it('leaves enrolled student in KIU_STATE.studentGrades after faculty aggregate load', () => {
        const ctx = loadFacultyGradebookChain();
        const aggregate = ctx.buildFacultyGradebookAggregateRoster({
            semester: 'all',
            faculty: 'ECON',
            subjectId: 'test',
            groupId: 'G1'
        });
        ctx.mockStudents = (aggregate.students || []).map((entry) => ctx.ensureGradeRecordHistories(entry));
        const rosterKeys = Object.keys(ctx.KIU_STATE.studentGrades);
        expect(rosterKeys.length).toBeGreaterThan(0);
        const hasStudent = rosterKeys.some((key) =>
            (ctx.KIU_STATE.studentGrades[key] || []).some((entry) => entry.id === 'STU-ECON-TEST-1')
        );
        expect(hasStudent).toBe(true);
        expect((ctx.mockStudents || []).some((entry) => entry.id === 'STU-ECON-TEST-1')).toBe(true);
        expect((aggregate.students || []).some((entry) => entry.id === 'STU-ECON-TEST-1')).toBe(true);
    });

    it('persists evaluation entry for visible faculty roster student without pre-existing studentGrades row', () => {
        const ctx = loadFacultyGradebookChain();
        const aggregate = ctx.buildFacultyGradebookAggregateRoster({
            semester: 'all',
            faculty: 'ECON',
            subjectId: 'test',
            groupId: 'G1'
        });
        ctx.mockStudents = (aggregate.students || []).map((entry) => ctx.ensureGradeRecordHistories(entry));
        const rosterKey = (aggregate.students[0]?._gradebookEnrollments?.[0]?.rosterKey)
            || Object.keys(ctx.KIU_STATE.studentGrades)[0];
        ctx.KIU_STATE.studentGrades[rosterKey] = [];
        ctx.mockStudents = (aggregate.students || []).map((entry) => ctx.ensureGradeRecordHistories(entry));

        const updated = ctx.persistStudentEvaluationEntryOnRoster(
            rosterKey,
            'STU-ECON-TEST-1',
            'quiz',
            1,
            8,
            'Test Student'
        );
        expect(updated).toBeTruthy();
        expect(
            (ctx.KIU_STATE.studentGrades[rosterKey] || []).some((entry) => entry.id === 'STU-ECON-TEST-1')
        ).toBe(true);
    });
});
