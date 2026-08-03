import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadMessengerGradebookApi(extra = {}) {
    const source = readSource('assets/js/shared/messenger-gradebook-runtime.js');
    const KIU_STATE = {
        studentGrades: {
            'econ101_g1': [{ id: 'existing-student', name: 'Existing Student', assessments: {} }]
        },
        studentSchedulesByStudent: {
            'admin-testing-econ-student': [{ courseId: 'ECON-101', groupId: 'G1' }]
        },
        availableGroups: {
            'ECON-101': [{ id: 'G1', name: 'G1', faculty: 'ECON', prof: 'TBD' }]
        },
        facultyProfiles: {
            ECON: {
                curriculum: [{ id: 'ECON-101', name: 'Economics 101' }],
                professors: [{ id: 'admin-testing-econ-professor', name: 'Professor View Account (ECON)' }],
                tas: [],
                students: [{ id: 'admin-testing-econ-student', name: 'Student View Account (ECON)' }]
            }
        },
        curriculum: [{ id: 'ECON-101', name: 'Economics 101' }],
        ...(extra.KIU_STATE || {})
    };
    const sandbox = {
        KIU_STATE,
        window: {},
        currentGradebookSection: null,
        USER_ROLES: { STUDENT: 'student', PROFESSOR: 'professor', TA: 'ta', ADMIN: 'admin' },
        normalizeIdentifier: (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ''),
        canonicalCourseKey: (value) => String(value || '').trim().toLowerCase(),
        normalizeFacultyCode: (value, fallback = '') => String(value || fallback || '').trim().toUpperCase() || fallback,
        deriveFacultyFromSubjectId: (id) => String(id || '').split('-')[0] || 'ECON',
        getDomain: () => ({
            usersById: {
                'admin-testing-econ-student': {
                    id: 'admin-testing-econ-student',
                    role: 'student',
                    facultyCode: 'ECON'
                },
                'admin-testing-econ-professor': {
                    id: 'admin-testing-econ-professor',
                    role: 'professor',
                    facultyCode: 'ECON',
                    name: 'Professor View Account (ECON)'
                }
            },
            subjectsById: { 'ECON-101': { id: 'ECON-101', name: 'Economics 101' } }
        }),
        getAvailableGroupsForSubject: (courseId) => KIU_STATE.availableGroups?.[courseId] || [],
        getAllStudents: () => KIU_STATE.facultyProfiles?.ECON?.students || [],
        ensureGradeRecordHistories: (record = {}) => ({ ...record, assessments: record.assessments || {} }),
        cleanupEncodingArtifacts: (value) => String(value || ''),
        toEnglishText: (value) => String(value || ''),
        getCurrentUser: () => sandbox.getDomain().usersById['admin-testing-econ-professor'],
        getCurrentFaculty: () => 'ECON',
        getActiveCurriculum: (faculty) => KIU_STATE.facultyProfiles?.[faculty]?.curriculum || [],
        getUiDisplayName: () => '',
        document: { getElementById: () => null },
        ...extra
    };
    sandbox.window = sandbox;
    const vm = require('vm');
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    return sandbox;
}

describe('view account gradebook parity', () => {
    it('documents roster sync helpers in messenger-gradebook-runtime', () => {
        const source = readSource('assets/js/shared/messenger-gradebook-runtime.js');
        expect(source).toContain('function syncGradebookRosterFromEnrollment(courseId, groupId, state = KIU_STATE)');
        expect(source).toContain('function syncGradebookRostersForStudent(studentId, rosterKey = \'\')');
        expect(source).toContain('function isUserAssignedToTeachingGroup(user = {}, group = {}, courseId = \'\')');
        expect(source).toContain('function isPortalCurriculumStaffForTeachingGroup(');
    });

    it('upserts enrolled testing student into an existing roster without dropping other students', () => {
        const ctx = loadMessengerGradebookApi();
        const result = ctx.syncGradebookRosterFromEnrollment('ECON-101', 'G1');

        expect(result.rosterKey).toBeTruthy();
        const roster = ctx.KIU_STATE.studentGrades[result.rosterKey];
        expect(roster.some((entry) => entry.id === 'existing-student')).toBe(true);
        expect(roster.some((entry) => entry.id === 'admin-testing-econ-student')).toBe(true);
    });

    it('syncs roster rows for a student schedule entry via syncGradebookRostersForStudent', () => {
        const ctx = loadMessengerGradebookApi({
            KIU_STATE: {
                studentGrades: {},
                studentSchedulesByStudent: {
                    'admin-testing-econ-student': [{ courseId: 'ECON-101', groupId: 'G1' }]
                },
                availableGroups: {
                    'ECON-101': [{ id: 'G1', name: 'G1', faculty: 'ECON' }]
                },
                facultyProfiles: {
                    ECON: {
                        curriculum: [{ id: 'ECON-101' }],
                        professors: [],
                        tas: [],
                        students: [{ id: 'admin-testing-econ-student', facultyCode: 'ECON' }]
                    }
                },
                curriculum: [{ id: 'ECON-101' }]
            }
        });

        ctx.syncGradebookRostersForStudent('admin-testing-econ-student');
        const rosterKeys = Object.keys(ctx.KIU_STATE.studentGrades);
        expect(rosterKeys.length).toBeGreaterThan(0);
        const roster = ctx.KIU_STATE.studentGrades[rosterKeys[0]];
        expect(roster.some((entry) => entry.id === 'admin-testing-econ-student')).toBe(true);
    });

    it('wires gradebook persist retry and load paths to roster sync', () => {
        const workspace = readSource('assets/js/pages/gradebook-workspace.js');
        expect(workspace).toContain('syncGradebookRostersForStudent(studentId, rosterId)');
        expect(workspace).toContain('syncGradebookRosterFromEnrollment(courseId, groupId)');
        expect(workspace).toMatch(/resolveLmsStudentGradebookRecord[\s\S]*__studyCardActiveGradeRecord/);
    });

    it('hooks enrollment schedule updates to roster sync in state.js', () => {
        const stateSource = readSource('assets/js/app/state.js');
        expect(stateSource).toMatch(/setCurrentStudentSchedule[\s\S]*syncGradebookRosterFromEnrollment/);
        expect(stateSource).toMatch(/setActiveSessionUserByRole[\s\S]*ensureAdminTestingStudentAcademicShell/);
    });
});
