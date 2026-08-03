import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function loadMessengerGradebookApi() {
    const source = readSource('assets/js/shared/messenger-gradebook-runtime.js');
    const KIU_STATE = {
        studentGrades: {},
        studentSchedulesByStudent: {},
        availableGroups: {
            'ECON-101': [{ id: 'G1', name: 'G1', faculty: 'ECON', prof: 'TBD', ta: 'TBD' }]
        },
        facultyProfiles: {
            ECON: {
                curriculum: [{ id: 'ECON-101', name: 'Economics 101' }],
                professors: [{ id: 'admin-testing-econ-professor', name: 'Professor View Account (ECON)' }],
                tas: [{ id: 'admin-testing-econ-ta', name: 'TA View Account (ECON)' }],
                students: []
            }
        },
        curriculum: [{ id: 'ECON-101', name: 'Economics 101' }],
        activeSemester: 1
    };
    const professor = {
        id: 'admin-testing-econ-professor',
        role: 'professor',
        facultyCode: 'ECON',
        name: 'Professor View Account (ECON)',
        nameEn: 'Professor View Account (ECON)'
    };
    const ta = {
        id: 'admin-testing-econ-ta',
        role: 'ta',
        facultyCode: 'ECON',
        name: 'TA View Account (ECON)',
        nameEn: 'TA View Account (ECON)'
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
            usersById: { [professor.id]: professor, [ta.id]: ta },
            subjectsById: { 'ECON-101': { id: 'ECON-101', name: 'Economics 101' } }
        }),
        getAvailableGroupsForSubject: (courseId) => KIU_STATE.availableGroups?.[courseId] || [],
        getAllStudents: () => [],
        ensureGradeRecordHistories: (record = {}) => ({ ...record, assessments: record.assessments || {} }),
        cleanupEncodingArtifacts: (value) => String(value || ''),
        toEnglishText: (value) => String(value || ''),
        getCurrentUser: () => professor,
        getCurrentFaculty: () => 'ECON',
        getActiveCurriculum: (faculty) => KIU_STATE.facultyProfiles?.[faculty]?.curriculum || [],
        getUiDisplayName: () => '',
        document: { getElementById: () => ({ value: '' }) }
    };
    sandbox.window = sandbox;
    const vm = require('vm');
    vm.createContext(sandbox);
    vm.runInContext(source, sandbox);
    return { sandbox, professor, ta, group: KIU_STATE.availableGroups['ECON-101'][0] };
}

describe('view account staff parity', () => {
    it('documents faculty-scoped teaching assignment helper usage', () => {
        const messenger = readSource('assets/js/shared/messenger-gradebook-runtime.js');
        const faculty = readSource('assets/js/shared/faculty.js');
        expect(messenger).toContain('isUserAssignedToTeachingGroup(currentUser, group, courseId)');
        expect(faculty).toContain('isUserAssignedToTeachingGroup(user, group, courseId)');
    });

    it('allows professor view account on TBD section via faculty curriculum scope', () => {
        const { sandbox, professor, group } = loadMessengerGradebookApi();
        expect(sandbox.isUserNameAssignedToTeachingGroup(professor, group)).toBe(false);
        expect(sandbox.isPortalCurriculumStaffForTeachingGroup('ECON-101', 'G1', professor.id, professor.role)).toBe(true);
        expect(sandbox.isUserAssignedToTeachingGroup(professor, group, 'ECON-101')).toBe(true);
    });

    it('allows TA view account on TBD section via faculty curriculum scope', () => {
        const { sandbox, ta, group } = loadMessengerGradebookApi();
        expect(sandbox.isUserNameAssignedToTeachingGroup(ta, group)).toBe(false);
        expect(sandbox.isPortalCurriculumStaffForTeachingGroup('ECON-101', 'G1', ta.id, ta.role)).toBe(true);
        expect(sandbox.isUserAssignedToTeachingGroup(ta, group, 'ECON-101')).toBe(true);
    });

    it('includes faculty-scoped groups in getGradebookGroupsForCurrentUser for professor persona', () => {
        const { sandbox } = loadMessengerGradebookApi();
        const groups = sandbox.getGradebookGroupsForCurrentUser();
        expect(groups.some((entry) => entry.courseId === 'ECON-101' && entry.groupId === 'G1')).toBe(true);
    });
});
