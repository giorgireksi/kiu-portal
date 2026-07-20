import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin testing portal rosters', () => {
    it('retains admin-testing personas during bootstrap sanitize when retain flag is set', () => {
        const initialStateSource = readFileSync(join(process.cwd(), 'assets/js/data/initial-state.js'), 'utf8');
        const vm = require('vm');
        const context = {
            MANUAL_TESTING_STATE_VERSION: 7,
            console,
            window: {}
        };
        vm.createContext(context);
        vm.runInContext(initialStateSource, context);

        const dirtyState = context.sanitizeStateForManualTesting({
            facultyProfiles: {
                ECON: {
                    curriculum: [{ id: 'ECON-DEMO-101', name: 'Demo Course' }],
                    professors: [{ id: 'admin-testing-econ-professor', name: 'QA Prof Alpha' }],
                    tas: [],
                    students: [
                        { id: 'admin-testing-econ-student', name: 'QA Student Alpha' },
                        { id: 'econ-student-demo', name: 'Demo Student' }
                    ]
                }
            },
            users: [
                { id: 'admin-testing-econ-student', role: 'student', isAdminTestingPersona: true },
                { id: 'econ-student-demo', role: 'student' }
            ],
            studentSchedulesByStudent: {
                'admin-testing-econ-student': [{ courseId: 'ECON101' }],
                'econ-student-demo': [{ courseId: 'ECON-DEMO-101' }]
            },
            studentRegistrations: {
                'admin-testing-econ-student': ['ECON101']
            },
            tuitionBalances: {
                'admin-testing-econ-student': 0
            }
        }, { retainAdminTestingPersonas: true });

        expect(dirtyState.users.map((user) => user.id)).toEqual(['admin-testing-econ-student']);
        expect(dirtyState.facultyProfiles.ECON.professors.map((user) => user.id)).toEqual(['admin-testing-econ-professor']);
        expect(dirtyState.facultyProfiles.ECON.students.map((user) => user.id)).toEqual(['admin-testing-econ-student']);
        expect(dirtyState.studentSchedulesByStudent).toEqual({
            'admin-testing-econ-student': [{ courseId: 'ECON101' }]
        });
    });

    it('still strips admin-testing personas when retain flag is off', () => {
        const initialStateSource = readFileSync(join(process.cwd(), 'assets/js/data/initial-state.js'), 'utf8');
        const vm = require('vm');
        const context = { MANUAL_TESTING_STATE_VERSION: 7, console, window: {} };
        vm.createContext(context);
        vm.runInContext(initialStateSource, context);

        const dirtyState = context.sanitizeStateForManualTesting({
            facultyProfiles: {
                ECON: {
                    curriculum: [],
                    professors: [],
                    tas: [],
                    students: [{ id: 'admin-testing-econ-student', name: 'QA Student Alpha' }]
                }
            },
            users: [{ id: 'admin-testing-econ-student', role: 'student' }],
            studentSchedulesByStudent: { 'admin-testing-econ-student': [] }
        });

        expect(dirtyState.users).toEqual([]);
        expect(dirtyState.facultyProfiles.ECON.students).toEqual([]);
        expect(dirtyState.studentSchedulesByStudent).toEqual({});
    });

    it('documents academic shell helper in state.js', () => {
        const stateSource = readSource('assets/js/app/state.js');
        expect(stateSource).toContain('function ensureAdminTestingStudentAcademicShell(studentId');
        expect(stateSource).toContain('studentSchedulesByStudent[normalizedId] = []');
        expect(stateSource).toContain('function shouldRetainAdminTestingPersonas()');
    });

    it('wires roster sync and retain flag through bootstrap and auth helpers', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const authSource = readSource('assets/js/app/auth.js');
        const schedulerSource = readSource('assets/js/pages/admin-scheduler.js');

        expect(apiSource).toContain('retainAdminTestingPersonas: currentUser?.role === USER_ROLES.ADMIN');
        expect(authSource).toContain('function syncAdminTestingPersonaRosters(accounts = [])');
        expect(authSource).toContain('function ensureFacultyProfileShell(facultyCode)');
        expect(authSource).toMatch(/hydratePortalUsersFromAccounts[\s\S]*syncAdminTestingPersonaRosters/);
        expect(schedulerSource).toContain('function schedulerRosterDisplayName(person = {})');
        expect(schedulerSource).toContain('getAllStaff(\'professors\'');
    });
});
