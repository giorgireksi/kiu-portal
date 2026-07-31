import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function createRegistrationTrackVmContext() {
    const vm = require('vm');
    const sharedSource = readSource('assets/js/pages/registration-shared.js');
    const adapterStart = sharedSource.indexOf('/* Registration trackData adapter');
    const adapterEnd = sharedSource.indexOf('__kiuRegSharedExpose({', adapterStart);
    const adapterBlock = sharedSource.slice(adapterStart, adapterEnd);

    const context = {
        console,
        window: {},
        KIU_STATE: {
            meta: {},
            registrationCMSByFaculty: {},
            adminProgramStructures: {},
            registrationStructures: {}
        },
        KIU_EMPTY_STATE: { facultyProfiles: { ECON: {} } },
        normalizeFacultyCode: (value, fallback = 'ECON') => String(value || fallback).trim().toUpperCase() || fallback,
        cloneJson: (value) => JSON.parse(JSON.stringify(value)),
        parseEctsProgress: (value, fallbackMax = 0) => {
            const text = String(value || '');
            const [maxText, completedText] = text.split('/');
            const max = Number(maxText);
            const completed = Number(completedText);
            return {
                max: Number.isFinite(max) ? max : fallbackMax,
                completed: Number.isFinite(completed) ? completed : 0
            };
        },
        formatEctsProgress: (max, completed) => `${max}/${completed}`,
        getAssignedCourseId: (course) => course?.sourceCourseId || course?.courseId || course?.n || course?.id || '',
        getCurrentFaculty: () => 'ECON'
    };

    vm.createContext(context);
    vm.runInContext(`${adapterBlock}
function getAssignedCourseCurriculumDetails() { return {}; }
`, context);
    return context;
}

describe('student registration trackData adapter', () => {
    it('exposes shared track adapter on registration-shared.js', () => {
        const shared = readSource('assets/js/pages/registration-shared.js');
        expect(shared).toContain('function buildStudentRegistrationDataFromCms(faculty)');
        expect(shared).toContain('function convertRegistrationTrackTabForStudentModules(trackObj)');
        expect(shared).toContain('function syncRegistrationProgFreeMirrorFromTrack(trackData = {}, faculty)');
    });

    it('migrates legacy prog modules into trackData and student module layout', () => {
        const ctx = createRegistrationTrackVmContext();
        ctx.KIU_STATE.adminProgramStructures.ECON = {
            prog: [{
                id: 'M-1',
                name: 'Core Module',
                maxEcts: 30,
                subModules: [{ id: 'ECON-101', name: 'Intro', ects: '6', sourceCourseId: 'ECON-101' }]
            }],
            free: [],
            conc: [],
            minor: []
        };
        ctx.KIU_STATE.registrationCMSByFaculty.ECON = {
            concCourseData: {},
            minorProgramData: {},
            trackData: {},
            customTabs: []
        };

        ctx.migrateRegistrationCmsToTrackModel('ECON');
        const derived = ctx.buildStudentRegistrationDataFromCms('ECON');

        expect(derived.prog).toHaveLength(1);
        expect(derived.prog[0].id).toBe('Core Module');
        expect(derived.prog[0].courses).toHaveLength(1);
        expect(derived.prog[0].courses[0].courseId).toBe('ECON-101');
        expect(ctx.KIU_STATE.adminProgramStructures.ECON.prog).toHaveLength(1);
    });

    it('reads post-migration prog from trackData when legacy arrays are empty', () => {
        const ctx = createRegistrationTrackVmContext();
        ctx.KIU_STATE.meta.adminRegTrackMigrationByFaculty = { ECON: 1 };
        ctx.KIU_STATE.adminProgramStructures.ECON = { prog: [], free: [], conc: [], minor: [] };
        ctx.KIU_STATE.registrationCMSByFaculty.ECON = {
            concCourseData: {},
            minorProgramData: {},
            trackData: {
                prog: {
                    'Applied Track': {
                        Main: {
                            maxEcts: 24,
                            completedEcts: 0,
                            ects: '24/0',
                            courses: [{ n: 'ECON-220', title: 'Applied Economics', ects: '6', sourceCourseId: 'ECON-220' }]
                        }
                    }
                }
            },
            customTabs: []
        };

        const derived = ctx.buildStudentRegistrationDataFromCms('ECON');
        expect(derived.prog).toHaveLength(1);
        expect(derived.prog[0].name).toBe('Applied Track');
        expect(derived.prog[0].courses[0].n).toBe('ECON-220');
    });

    it('includes custom tabs in student tab list', () => {
        const ctx = createRegistrationTrackVmContext();
        ctx.KIU_STATE.registrationCMSByFaculty.ECON = {
            concCourseData: {},
            minorProgramData: {},
            trackData: {
                custom_lane: {
                    'Specialization A': {
                        Main: { maxEcts: 12, completedEcts: 0, ects: '12/0', courses: [] }
                    }
                }
            },
            customTabs: [{ id: 'custom_lane', label: 'Special Lane', studentTabId: 'custom_lane' }]
        };

        const tabs = ctx.getStudentRegistrationTabsForFaculty('ECON');
        expect(tabs.some((tab) => tab.id === 'custom_lane')).toBe(true);
        expect(ctx.isStudentRegistrationTrackLayoutTab('custom_lane', 'ECON')).toBe(true);
    });

    it('student route delegates data reads to shared CMS adapter', () => {
        const studentRegistration = readSource('assets/js/pages/student-registration.js');
        expect(studentRegistration).toContain('getStudentRegistrationDataForTabFromCms');
        expect(studentRegistration).toContain('buildStudentRegistrationDataFromCms');
        expect(studentRegistration).toContain('buildStudentRegistrationShellTabs');
        expect(studentRegistration).toContain('resolveStudentRegistrationStructureTab');
    });
});