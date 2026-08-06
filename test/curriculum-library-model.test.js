import { describe, expect, it } from 'vitest';
import { curriculumLibraryModelApi } from '../assets/js/shared/curriculum-library-model.js';

describe('curriculum library module defaults', () => {
    it('does not add a General Curriculum fallback beside custom modules', () => {
        globalThis.KIU_STATE = {
            curriculumLibraryModulesByFaculty: {
                ECON: [{ id: 'custom-module', name: 'My Module', subjectIds: [] }]
            }
        };
        globalThis.getCurrentFaculty = () => 'ECON';
        globalThis.getActiveCurriculum = () => [{ id: 'SUBJECT-1', ects: 6, semester: 1 }];

        const modules = curriculumLibraryModelApi.ensureCurriculumLibraryModules('ECON');

        expect(modules).toHaveLength(1);
        expect(modules[0].id).toBe('custom-module');
        expect(modules[0].name).toBe('My Module');
        expect(modules.some((module) => module.name === 'General Curriculum')).toBe(false);
    });
});
