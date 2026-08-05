import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

describe('demo data cleanup', () => {
    it('strips admin-testing and demo users during manual testing sanitization', () => {
        const initialStateSource = readFileSync(join(process.cwd(), 'assets/js/data/initial-state.js'), 'utf8');
        expect(initialStateSource).toContain('function purgeDemoContentFromState');
        expect(initialStateSource).toContain('admin-testing-');

        const vm = require('vm');
        const context = {
            MANUAL_TESTING_STATE_VERSION: 7,
            console,
            window: {}
        };
        vm.createContext(context);
        vm.runInContext(initialStateSource, context);

        const dirtyState = context.sanitizeStateForManualTesting({
            meta: {},
            facultyProfiles: {
                ECON: {
                    curriculum: [{ id: 'ECON-DEMO-101', name: 'Demo Course' }],
                    professors: [{ id: 'admin-testing-econ-professor', name: 'QA Prof Alpha' }],
                    tas: [],
                    students: [{ id: 'econ-student-demo', name: 'Demo Student' }]
                }
            },
            curriculum: [{ id: 'ECON-DEMO-101', name: 'Demo Course' }],
            users: [
                { id: 'admin-testing-econ-student', role: 'student', isAdminTestingPersona: true },
                { id: 'real-student-1', role: 'student', name: 'Real Student' }
            ],
            studentSchedulesByStudent: {
                'admin-testing-econ-student': [{ courseId: 'ECON-DEMO-101' }],
                'real-student-1': []
            },
            portalNotifications: [{ id: 'n1', type: 'demo-ready' }],
            studentServiceTickets: [{ id: 'testing-svc-econ-registration-check' }]
        });

        expect(dirtyState.users.map((user) => user.id)).toEqual(['real-student-1']);
        expect(dirtyState.facultyProfiles.ECON.professors).toEqual([]);
        expect(dirtyState.facultyProfiles.ECON.students).toEqual([]);
        expect(dirtyState.facultyProfiles.ECON.curriculum).toEqual([]);
        expect(dirtyState.studentSchedulesByStudent).toEqual({ 'real-student-1': [] });
        expect(dirtyState.portalNotifications).toEqual([]);
        expect(dirtyState.studentServiceTickets).toEqual([]);
    });

    it('preserves admin-authored registration modules during manual testing sanitization', () => {
        const initialStateSource = readFileSync(join(process.cwd(), 'assets/js/data/initial-state.js'), 'utf8');
        const vm = require('vm');
        const context = {
            MANUAL_TESTING_STATE_VERSION: 7,
            console,
            window: {}
        };
        vm.createContext(context);
        vm.runInContext(initialStateSource, context);

        const sanitized = context.sanitizeStateForManualTesting({
            meta: {},
            facultyProfiles: {
                ECON: {
                    name: 'Business Management',
                    curriculum: [],
                    professors: [],
                    tas: [],
                    students: []
                }
            },
            adminProgramStructures: {
                ECON: {
                    prog: [{ id: 'M-real-1', name: 'Real Module', subModules: [{ id: 'ECON-101', name: 'Intro' }] }],
                    free: [],
                    conc: [],
                    minor: []
                }
            },
            registrationCMSByFaculty: {
                ECON: { concCourseData: {}, minorProgramData: {} }
            }
        });

        expect(sanitized.adminProgramStructures.ECON.prog).toHaveLength(1);
        expect(sanitized.adminProgramStructures.ECON.prog[0].id).toBe('M-real-1');
        expect(sanitized.adminProgramStructures.ECON.prog[0].subModules).toHaveLength(1);
    });

    it('removes demo-tagged registration modules during manual testing sanitization', () => {
        const initialStateSource = readFileSync(join(process.cwd(), 'assets/js/data/initial-state.js'), 'utf8');
        const vm = require('vm');
        const context = {
            MANUAL_TESTING_STATE_VERSION: 7,
            console,
            window: {}
        };
        vm.createContext(context);
        vm.runInContext(initialStateSource, context);

        const sanitized = context.sanitizeStateForManualTesting({
            meta: {},
            facultyProfiles: {
                ECON: {
                    name: 'Business Management',
                    curriculum: [],
                    professors: [],
                    tas: [],
                    students: []
                }
            },
            adminProgramStructures: {
                ECON: {
                    prog: [
                        { id: 'M-real-1', name: 'Real Module', subModules: [] },
                        { id: 'ECON-DEMO-SEED', name: 'Demo Module', subModules: [{ id: 'ECON-DEMO-101', name: 'Demo Subject' }] }
                    ],
                    free: [],
                    conc: [],
                    minor: []
                }
            },
            registrationCMSByFaculty: {
                ECON: { concCourseData: {}, minorProgramData: {} }
            }
        });

        expect(sanitized.adminProgramStructures.ECON.prog).toHaveLength(1);
        expect(sanitized.adminProgramStructures.ECON.prog[0].id).toBe('M-real-1');
    });

    it('does not expose admin testing persona seeding in state.js', () => {
        const stateSource = readFileSync(join(process.cwd(), 'assets/js/app/state.js'), 'utf8');
        expect(stateSource).not.toContain('function ensureAdminTestingPersonas');
        expect(stateSource).not.toContain('QA Prof Alpha');
        expect(stateSource).toContain('function stripSeededMockStudents');
    });

    it('removes backend testing pack seeding helpers from the platform store', () => {
        const storeSource = readFileSync(join(process.cwd(), 'backend/platform/store.js'), 'utf8');
        expect(storeSource).not.toContain('ensureTestingPackForFaculty');
        expect(storeSource).not.toContain('buildTestingAccountSpecs');
        expect(storeSource).toContain('resetPlatformState');
    });

    it('bumps manual testing cleanup to version 8', () => {
        const appSource = readFileSync(join(process.cwd(), 'assets/js/app/app.js'), 'utf8');
        expect(appSource).toContain('MANUAL_TESTING_STATE_VERSION = 8');
        expect(appSource).toContain("REAL_TESTING_CLEANUP_FLAG = 'KIU_REAL_TESTING_CLEANUP_V8'");
    });
});
