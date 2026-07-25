/* Curriculum library module/subject mutations. Peeled from registration.js.
 * Load before registration.js.
 */
(function initWave18Peel() {
    if (window.__KIU_REGISTRATION_CURRICULUM_LOADED) return;
    window.__KIU_REGISTRATION_CURRICULUM_LOADED = true;

    window.curriculumLibraryUiState = window.curriculumLibraryUiState || {
        selectedModulesByFaculty: {},
        searchQueryByFaculty: {},
        searchDebounceTimer: null,
        editingSubjectId: null
    };

    window.__kiuCreateRegistrationCurriculumApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function deleteCurriculumLibraryModule(moduleId) {
    const faculty = getCurrentFaculty();
    const modules = ensureCurriculumLibraryModules(faculty);
    const module = modules.find((item) => item.id === moduleId);
    if (!module) return;
    openLuxuryConfirmModal({
        title: 'Remove Module',
        subtitle: module.name,
        message: `Remove module "${module.name}"? Its subjects will remain in the faculty curriculum.`,
        danger: true,
        confirmLabel: 'Remove',
        onConfirm: (close) => {
            let fallback = modules.find((item) => item.id !== moduleId && item.systemDefault) || modules.find((item) => item.id !== moduleId) || null;
            if (!fallback && (module.subjectIds || []).length > 0) {
                fallback = buildDefaultCurriculumModule(faculty, []);
                modules.push(fallback);
            }
            if (fallback) {
                fallback.subjectIds = [...new Set([...(fallback.subjectIds || []), ...(module.subjectIds || [])])];
                fallback.maxEcts = Math.max(toRegistrationPositiveInt(fallback.maxEcts, 0), getCurriculumModuleEctsTotal(fallback, faculty));
            }

            KIU_STATE.curriculumLibraryModulesByFaculty[normalizeFacultyCode(faculty, getCurrentFaculty())] = modules.filter((item) => item.id !== moduleId);
            setCurriculumLibraryModuleSelection(fallback?.id || null, faculty);
            saveState();
            close();
            renderCurriculumTable();
        }
    });
}

function deleteSubjectById(subjectId) {
    openLuxuryConfirmModal({
        title: 'Remove Subject',
        subtitle: subjectId,
        message: 'Remove this subject from the curriculum?',
        danger: true,
        confirmLabel: 'Remove',
        onConfirm: (close) => {
            Object.keys(KIU_STATE.facultyProfiles || {}).forEach((facultyCode) => {
                const profile = KIU_STATE.facultyProfiles[facultyCode];
                if (Array.isArray(profile?.curriculum)) {
                    profile.curriculum = profile.curriculum.filter((subject) => subject.id !== subjectId);
                }
            });
            Object.keys(KIU_STATE.curriculumLibraryModulesByFaculty || {}).forEach((facultyCode) => {
                (KIU_STATE.curriculumLibraryModulesByFaculty[facultyCode] || []).forEach((module) => {
                    module.subjectIds = (module.subjectIds || []).filter((entry) => entry !== subjectId);
                });
            });
            if (typeof syncCanonicalCurriculumState === 'function') {
                syncCanonicalCurriculumState();
            }
            saveState();
            close();
            renderCurriculumTable();
            populateAntiReqDropdown();
        }
    });
}

function addSubjectToSystem() {
    const name = String(document.getElementById('new-subject-name')?.value || '').trim();
    const ects = toRegistrationPositiveInt(document.getElementById('new-subject-ects')?.value, 6) || 6;
    const faculty = getCurrentFaculty();
    const semesters = getBuilderSubjectSemesters();
    if (!semesters.length) {
        alert('Please select at least one semester for this subject.');
        return;
    }
    const semester = semesters[0];
    const selectedModule = getSelectedCurriculumLibraryModule(faculty);
    const usePrerequisite = document.getElementById('has-condition-checkbox')?.checked === true;
    const prerequisiteEntries = getSelectedConditionEntries();
    const antiReqEntries = getSelectedAntiReqCodes();
    const customCode = String(document.getElementById('new-subject-code-preview')?.value || '').trim().toUpperCase().replace(/\s+/g, '-');
    const allowBothParity = document.getElementById('new-subject-parity-both-checkbox')?.checked === true;
    const editingSubjectId = String(curriculumLibraryUiState.editingSubjectId || '').trim();

    if (!name) {
        alert('Please enter a subject name.');
        return;
    }
    if (!selectedModule) {
        alert('Please create or select a curriculum module first.');
        syncCurriculumSubjectBuilderTarget(faculty);
        return;
    }
    if (usePrerequisite && prerequisiteEntries.length === 0) {
        alert('Please select at least one prerequisite or turn off the prerequisite toggle.');
        return;
    }

    if (!KIU_STATE.facultyProfiles) {
        KIU_STATE.facultyProfiles = JSON.parse(JSON.stringify(KIU_EMPTY_STATE.facultyProfiles));
    }
    if (!KIU_STATE.facultyProfiles[faculty]) {
        KIU_STATE.facultyProfiles[faculty] = { curriculum: [], professors: [], tas: [], students: [] };
    }
    if (!Array.isArray(KIU_STATE.facultyProfiles[faculty].curriculum)) {
        KIU_STATE.facultyProfiles[faculty].curriculum = [];
    }

    const existing = typeof getAllCurriculumSubjects === 'function' ? getAllCurriculumSubjects() : [];
    const generatedId = customCode || `${normalizeFacultyCode(faculty, 'ECON')}-${String(semester).padStart(2, '0')}-${String(existing.length + 1).padStart(3, '0')}`;
    const subjectPayload = {
        name,
        ects,
        faculty,
        semester,
        semesters,
        icon: 'fas fa-book',
        cond: usePrerequisite ? prerequisiteEntries.map((entry) => `[REQ] ${entry.code}`).join(', ') : 'None',
        antireq: antiReqEntries.length > 0 ? antiReqEntries.map((entry) => `[ANTI] ${entry}`).join(', ') : 'None',
        parityMode: allowBothParity ? 'both' : 'auto'
    };

    if (editingSubjectId) {
        const curriculum = KIU_STATE.facultyProfiles[faculty].curriculum;
        const subjectIndex = curriculum.findIndex((subject) => subject.id === editingSubjectId);
        if (subjectIndex < 0) {
            alert('The subject you are editing could not be found.');
            return;
        }
        const nextId = customCode || editingSubjectId;
        if (nextId !== editingSubjectId && existing.some((subject) => {
            if (subject.id === editingSubjectId) return false;
            return typeof canonicalCourseKey === 'function'
                ? canonicalCourseKey(subject.id) === canonicalCourseKey(nextId)
                : subject.id === nextId;
        })) {
            alert(`Subject code \"${nextId}\" already exists.`);
            return;
        }

        const updatedSubject = {
            ...curriculum[subjectIndex],
            ...subjectPayload,
            id: nextId,
            code: nextId.toLowerCase()
        };
        curriculum[subjectIndex] = updatedSubject;

        if (nextId !== editingSubjectId) {
            Object.keys(KIU_STATE.curriculumLibraryModulesByFaculty || {}).forEach((facultyCode) => {
                (KIU_STATE.curriculumLibraryModulesByFaculty[facultyCode] || []).forEach((module) => {
                    module.subjectIds = (module.subjectIds || []).map((entry) => (entry === editingSubjectId ? nextId : entry));
                });
            });
        }

        curriculumLibraryUiState.editingSubjectId = null;
    } else {
        if (existing.some((subject) => typeof canonicalCourseKey === 'function' ? canonicalCourseKey(subject.id) === canonicalCourseKey(generatedId) : subject.id === generatedId)) {
            alert(`Subject code \"${generatedId}\" already exists.`);
            return;
        }

        const newSubject = {
            ...subjectPayload,
            id: generatedId,
            code: generatedId.toLowerCase()
        };
        KIU_STATE.facultyProfiles[faculty].curriculum.push(newSubject);
        attachSubjectToCurriculumLibraryModule(generatedId, faculty);
    }

    if (typeof syncCanonicalCurriculumState === 'function') {
        syncCanonicalCurriculumState();
    }
    saveState();
    renderCurriculumTable();
    populateAntiReqDropdown();
    if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();

    resetCurriculumSubjectBuilderForm();
    closeCurriculumSubjectBuilderModal();
}

// Ensure registration state is correctly drawn when the app starts
window.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('page-registration')) return;
    // FIX: Removed forced dark mode override - respect user's saved theme preference.
    // FIX: Removed 500ms setTimeout - render immediately, then apply transparency.
    if (typeof initializeRegistrationShellInteractions === 'function') {
        initializeRegistrationShellInteractions();
    }
    if (typeof refreshSemesterDropdowns === 'function') {
        refreshSemesterDropdowns();
    }
    if (typeof refreshRegistrationUI === 'function') {
        refreshRegistrationUI();
    }

    // CRITICAL: Re-apply transparency AFTER registration cards are rendered.
    if (typeof updateTransparency === 'function') {
        var _t = localStorage.getItem('kiuLuxurySurfaceTransparency');
        if (_t) updateTransparency(parseInt(_t, 10));
    }
});

        const api = {
            deleteCurriculumLibraryModule,
            deleteSubjectById,
            addSubjectToSystem,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateRegistrationCurriculumApi({});
})();

