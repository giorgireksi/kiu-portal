/* Curriculum library pure helpers.
 * ESM leaf: programs.html type=module; classic bridge for defer consumers.
 */
'use strict';

function toCurriculumPositiveInt(value, fallback = 0) {
    const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function resolveFaculty(faculty) {
    const fallback = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : 'ECON';
    if (typeof normalizeFacultyCode === 'function') {
        return normalizeFacultyCode(faculty, fallback);
    }
    return String(faculty || fallback || 'ECON').trim().toUpperCase() || 'ECON';
}

function resolveActiveCurriculum(faculty) {
    return typeof getActiveCurriculum === 'function' ? getActiveCurriculum(faculty) : [];
}

function normalizeCurriculumSemesterList(value) {
    const source = Array.isArray(value) ? value : [value];
    return [...new Set(source
        .map((entry) => toCurriculumPositiveInt(entry, 0))
        .filter((entry) => entry > 0))]
        .sort((left, right) => left - right);
}

function normalizeCurriculumSubjectSemesters(subject) {
    if (!subject) return [];
    if (Array.isArray(subject.semesters) && subject.semesters.length) {
        return normalizeCurriculumSemesterList(subject.semesters);
    }
    return normalizeCurriculumSemesterList(subject.semester);
}

function subjectMatchesCurriculumSemesterFilter(subject, filter) {
    if (!filter || filter === 'all') return true;
    const target = toCurriculumPositiveInt(filter, 0);
    if (!target) return true;
    return normalizeCurriculumSubjectSemesters(subject).includes(target);
}

function getCurriculumLibraryModules(faculty) {
    const normalizedFaculty = resolveFaculty(faculty);
    const root = typeof window !== 'undefined' ? window : globalThis;
    const state = (typeof KIU_STATE !== 'undefined' && KIU_STATE) || root.KIU_STATE || (root.KIU_STATE = {});
    if (!state.curriculumLibraryModulesByFaculty || typeof state.curriculumLibraryModulesByFaculty !== 'object') {
        state.curriculumLibraryModulesByFaculty = {};
    }
    if (!Array.isArray(state.curriculumLibraryModulesByFaculty[normalizedFaculty])) {
        state.curriculumLibraryModulesByFaculty[normalizedFaculty] = [];
    }
    return state.curriculumLibraryModulesByFaculty[normalizedFaculty];
}

function buildDefaultCurriculumModule(faculty, subjectIds = []) {
    const normalizedFaculty = resolveFaculty(faculty);
    const subjects = resolveActiveCurriculum(normalizedFaculty);
    return {
        id: `CLM-${normalizedFaculty}-GENERAL`,
        letter: 'A',
        name: 'General Curriculum',
        maxEcts: subjectIds.reduce((sum, subjectId) => {
            const subject = subjects.find((item) => item.id === subjectId);
            return sum + toCurriculumPositiveInt(subject?.ects, 0);
        }, 0),
        subjectIds: [...new Set(subjectIds)],
        systemDefault: true
    };
}

function ensureCurriculumLibraryModules(faculty) {
    const normalizedFaculty = resolveFaculty(faculty);
    const modules = getCurriculumLibraryModules(normalizedFaculty);
    const subjects = resolveActiveCurriculum(normalizedFaculty);
    const validSubjectIds = new Set(subjects.map((subject) => subject.id));

    modules.forEach((module, index) => {
        module.id = module.id || `CLM-${normalizedFaculty}-${Date.now()}-${index}`;
        module.letter = String.fromCharCode(65 + (index % 26));
        module.name = module.name || `Module ${index + 1}`;
        module.maxEcts = toCurriculumPositiveInt(module.maxEcts, 0);
        module.subjectIds = [...new Set((module.subjectIds || []).filter((subjectId) => validSubjectIds.has(subjectId)))];
    });

    if (modules.length === 0 && subjects.length > 0) {
        modules.push(buildDefaultCurriculumModule(normalizedFaculty, subjects.map((subject) => subject.id)));
    }

    const assigned = new Set(modules.flatMap((module) => module.subjectIds || []));
    const missing = subjects.map((subject) => subject.id).filter((subjectId) => !assigned.has(subjectId));
    if (missing.length > 0) {
        const fallback = modules.find((module) => module.systemDefault) || buildDefaultCurriculumModule(normalizedFaculty, []);
        if (!modules.includes(fallback)) modules.unshift(fallback);
        fallback.subjectIds = [...new Set([...(fallback.subjectIds || []), ...missing])];
        fallback.maxEcts = Math.max(
            toCurriculumPositiveInt(fallback.maxEcts, 0),
            getCurriculumModuleEctsTotal(fallback, normalizedFaculty)
        );
    }

    return modules;
}

function getCurriculumLibraryModuleSubjects(module, faculty, semesterFilter = 'all') {
    if (!module) return [];
    const normalizedFaculty = resolveFaculty(faculty);
    const subjectsById = new Map(resolveActiveCurriculum(normalizedFaculty).map((subject) => [subject.id, subject]));
    return (module.subjectIds || [])
        .map((subjectId) => subjectsById.get(subjectId))
        .filter(Boolean)
        .filter((subject) => subjectMatchesCurriculumSemesterFilter(subject, semesterFilter))
        .sort((left, right) => {
            const leftSemesters = normalizeCurriculumSubjectSemesters(left);
            const rightSemesters = normalizeCurriculumSubjectSemesters(right);
            const semesterDiff = (leftSemesters[0] || 99) - (rightSemesters[0] || 99);
            if (semesterDiff !== 0) return semesterDiff;
            return String(left.name || '').localeCompare(String(right.name || ''));
        });
}

function getCurriculumModuleEctsTotal(module, faculty) {
    return getCurriculumLibraryModuleSubjects(module, faculty, 'all')
        .reduce((sum, subject) => sum + toCurriculumPositiveInt(subject?.ects, 0), 0);
}

function getCurriculumSemesterCoverage(subjects = []) {
    const semesters = [...new Set((subjects || [])
        .flatMap((subject) => normalizeCurriculumSubjectSemesters(subject))
        .filter(Number.isFinite))]
        .sort((a, b) => a - b);
    if (!semesters.length) return 'Open semester map';
    return semesters.map((semester) => `S${semester}`).join(', ');
}

function countSubjectsWithPrerequisites(subjects = []) {
    return (subjects || []).filter((subject) => {
        const prerequisite = String(subject?.cond || '').trim().toLowerCase();
        return prerequisite && prerequisite !== 'none';
    }).length;
}

export const curriculumLibraryModelApi = {
    toCurriculumPositiveInt,
    getCurriculumLibraryModules,
    buildDefaultCurriculumModule,
    ensureCurriculumLibraryModules,
    getCurriculumLibraryModuleSubjects,
    getCurriculumModuleEctsTotal,
    getCurriculumSemesterCoverage,
    countSubjectsWithPrerequisites
};

/** Install classic window surface (idempotent). */
export function installCurriculumLibraryModel(target = typeof window !== 'undefined' ? window : globalThis) {
    if (!target || target.__KIU_CURRICULUM_LIBRARY_MODEL_LOADED) {
        return target?.KiuCurriculumLibraryModel || curriculumLibraryModelApi;
    }
    target.__KIU_CURRICULUM_LIBRARY_MODEL_LOADED = true;
    target.__kiuCurriculumLibraryModelExports = curriculumLibraryModelApi;
    target.KiuCurriculumLibraryModel = curriculumLibraryModelApi;
    Object.keys(curriculumLibraryModelApi).forEach((key) => {
        target[key] = curriculumLibraryModelApi[key];
    });
    return curriculumLibraryModelApi;
}

installCurriculumLibraryModel();
