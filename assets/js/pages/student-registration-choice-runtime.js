/* Student registration faculty/scope/choice helpers. Peeled from student-registration.js.
 * Load before student-registration.js.
 */
(function initWave18Peel() {
    if (window.__KIU_STUDENT_REGISTRATION_CHOICE_LOADED) return;
    window.__KIU_STUDENT_REGISTRATION_CHOICE_LOADED = true;

    window.__kiuCreateStudentRegistrationChoiceApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function findFacultyWithRegistrationCmsContent(excludeFaculty) {
    const excluded = normalizeFacultyCode(excludeFaculty || 'ECON', 'ECON');
    const facultyCodes = new Set([
        ...Object.keys(KIU_STATE.adminProgramStructures || {}),
        ...Object.keys(KIU_STATE.registrationCMSByFaculty || {}),
        ...Object.keys(KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {})
    ]);
    for (const facultyCode of facultyCodes) {
        const normalized = normalizeFacultyCode(facultyCode, 'ECON');
        if (normalized === excluded) continue;
        if (countAdminRegistrationModulesForFaculty(normalized) > 0) {
            return normalized;
        }
    }
    return '';
}

function buildStudentRegistrationFacultyHintNode(activeFaculty, safeData) {
    if (Array.isArray(safeData) && safeData.length > 0) return null;
    const alternateFaculty = findFacultyWithRegistrationCmsContent(activeFaculty);
    if (!alternateFaculty) return null;
    const hint = document.createElement('div');
    hint.className = 'registration-faculty-hint';
    const facultyLabel = typeof getFacultyLabel === 'function' ? getFacultyLabel(alternateFaculty) : alternateFaculty;
    hint.textContent = `Registration structure exists for ${facultyLabel}. Switch faculty in the shell to view it.`;
    return hint;
}

window.addEventListener('kiu:registration-cms-changed', () => {
    if (typeof invalidateStudentRegistrationViewCache === 'function') {
        invalidateStudentRegistrationViewCache();
    }
    const container = document.getElementById('student-reg-content-container');
    if (!container) return;
    const faculty = getCurrentFaculty() || 'ECON';
    let activeTab = window.__studentRegActiveTab || 'prog';
    if (activeTab !== 'history' && activeTab !== 'selected' && typeof getStudentRegistrationTabsForFaculty === 'function') {
        const validTabIds = getStudentRegistrationTabsForFaculty(faculty).map((tab) => tab.studentTabId || tab.id);
        if (!validTabIds.includes(activeTab)) {
            activeTab = 'prog';
            window.__studentRegActiveTab = activeTab;
        }
    }
    if (typeof renderStudentRegStructures === 'function') {
        renderStudentRegStructures(activeTab);
    }
});

const STUDENT_REGISTRATION_SECTION_META = {
    prog: {
        title: 'My Program',
        subtitle: 'Review the same program module structure created in Registration Structure CMS and choose only eligible subjects.',
        listTitle: 'Program Modules',
        paneSubtitle: 'Program Module Subjects'
    },
    free: {
        title: 'Free Credits',
        subtitle: 'Browse the free-credit modules defined by admin and choose only the subjects you are allowed to take.',
        listTitle: 'Free Credit Modules',
        paneSubtitle: 'Free Credit Subjects'
    },
    conc: {
        title: 'Concentration',
        subtitle: 'Use the same concentration program structure created by admin. You can only choose eligible subjects.',
        listTitle: 'Concentration Programs'
    },
    minor: {
        title: 'Minor',
        subtitle: 'Use the same minor program structure created by admin. You can only choose eligible subjects.',
        listTitle: 'Minor Programs'
    }
};

function getStudentRegistrationScopeKey(user = getCurrentUser(), faculty = getCurrentFaculty()) {
    const fallbackUserId = typeof getCurrentUserId === 'function' ? getCurrentUserId() : '';
    const studentId = String(user?.id || fallbackUserId || 'anonymous').trim() || 'anonymous';
    const derivedFaculty = typeof deriveFacultyFromSubjectId === 'function' ? deriveFacultyFromSubjectId(studentId) : '';
    const normalizedFaculty = normalizeFacultyCode(
        faculty || user?.facultyCode || user?.faculty || derivedFaculty || 'ECON',
        'ECON'
    );
    return `${studentId}::${normalizedFaculty}`;
}

function getScopedStudentRegistrationTrackSelection(tabId = '') {
    if (!KIU_STATE.studentRegistrationTrackSelection || typeof KIU_STATE.studentRegistrationTrackSelection !== 'object') {
        KIU_STATE.studentRegistrationTrackSelection = {};
    }
    const scopeKey = getStudentRegistrationScopeKey();
    const store = KIU_STATE.studentRegistrationTrackSelection;
    if (!store[scopeKey] || typeof store[scopeKey] !== 'object') {
        store[scopeKey] = {};
    }
    const faculty = getCurrentFaculty() || 'ECON';
    const usesTrackSelection = typeof isStudentRegistrationTrackLayoutTab === 'function'
        ? isStudentRegistrationTrackLayoutTab(tabId, faculty)
        : (tabId === 'conc' || tabId === 'minor');
    if (usesTrackSelection && store[scopeKey][tabId] == null && typeof store[tabId] === 'string') {
        store[scopeKey][tabId] = store[tabId];
    }
    return store[scopeKey];
}

function getStudentRegistrationChoice(tabId, data) {
    const faculty = getCurrentFaculty() || 'ECON';
    const usesTrackSelection = typeof isStudentRegistrationTrackLayoutTab === 'function'
        ? isStudentRegistrationTrackLayoutTab(tabId, faculty)
        : (tabId === 'conc' || tabId === 'minor');
    const source = usesTrackSelection
        ? (getScopedStudentRegistrationTrackSelection(tabId)?.[tabId] || studentRegistrationUiState[tabId])
        : studentRegistrationUiState[tabId];
    const items = Array.isArray(data) ? data : [];
    const fallback = items[0]?.id || null;
    const selected = items.some(item => item.id === source) ? source : fallback;
    studentRegistrationUiState[tabId] = selected;
    return selected;
}

function setStudentRegistrationChoice(tabId, selectedId) {
    const nextSelectedId = selectedId || null;
    if (studentRegistrationUiState[tabId] === nextSelectedId && window.__studentRegActiveTab === tabId) {
        return;
    }
    studentRegistrationUiState[tabId] = nextSelectedId;
    const faculty = getCurrentFaculty() || 'ECON';
    const usesTrackSelection = typeof isStudentRegistrationTrackLayoutTab === 'function'
        ? isStudentRegistrationTrackLayoutTab(tabId, faculty)
        : (tabId === 'conc' || tabId === 'minor');
    if (usesTrackSelection) {
        getScopedStudentRegistrationTrackSelection(tabId)[tabId] = nextSelectedId;
        saveState();
    }
    if (!updateStudentRegistrationSelectionView(tabId, nextSelectedId)) {
        renderStudentRegStructures(tabId);
    }
    if (typeof refreshRegistrationUI === 'function') {
        refreshRegistrationUI();
    }
}

function updateStudentRegistrationSelectionView(tabId, selectedId) {
    const container = document.getElementById('student-reg-content-container');
    if (!container || window.__studentRegActiveTab !== tabId) return false;
    if (tabId === 'history' || tabId === 'selected') return false;

    const fac = getCurrentFaculty() || 'ECON';
    const useCachedState = studentRegistrationRenderState.tabId === tabId && studentRegistrationRenderState.faculty === fac;
    const safeData = useCachedState
        ? (Array.isArray(studentRegistrationRenderState.safeData) ? studentRegistrationRenderState.safeData : [])
        : (Array.isArray(getStudentRegistrationDataForTab(fac, tabId)) ? getStudentRegistrationDataForTab(fac, tabId) : []);
    const courseContext = useCachedState
        ? (studentRegistrationRenderState.courseContext || buildStudentRegistrationCourseContext())
        : buildStudentRegistrationCourseContext();
    const pane = document.getElementById(`student-${tabId}-pane`);
    if (!pane) return false;

    const usesModuleLayout = typeof isStudentRegistrationModuleLayoutTab === 'function'
        ? isStudentRegistrationModuleLayoutTab(tabId, fac)
        : (tabId === 'prog' || tabId === 'free');
    const itemSelector = usesModuleLayout
        ? `input[data-student-reg-module="${tabId}"]`
        : `input[data-student-reg-program="${tabId}"]`;

    container.querySelectorAll(itemSelector).forEach((input) => {
        const isActive = String(input.getAttribute('data-student-reg-choice') || '') === String(selectedId || '');
        input.checked = isActive;
        input.closest('.registration-module-choice')?.classList.toggle('is-active', isActive);
    });

    if (usesModuleLayout) {
        const selectedModule = safeData.find((item) => item.id === selectedId) || safeData[0] || null;
        const tabConfig = typeof resolveStudentRegistrationTabConfig === 'function'
            ? resolveStudentRegistrationTabConfig(tabId, fac)
            : null;
        const meta = tabConfig
            ? { paneSubtitle: tabConfig.paneSubtitle || `${tabConfig.label} Subjects` }
            : (STUDENT_REGISTRATION_SECTION_META[tabId] || STUDENT_REGISTRATION_SECTION_META.prog);
        pane.replaceChildren(renderStudentModulePaneHtml(selectedModule, tabId, fac, courseContext, meta.paneSubtitle));
        return true;
    }

    const selectedProgram = safeData.find((item) => item.id === selectedId) || safeData[0] || null;
    pane.replaceChildren(renderStudentTrackPaneHtml(selectedProgram, tabId, fac, courseContext));
    return true;
}

        const api = {
            findFacultyWithRegistrationCmsContent,
            buildStudentRegistrationFacultyHintNode,
            getStudentRegistrationScopeKey,
            getScopedStudentRegistrationTrackSelection,
            getStudentRegistrationChoice,
            setStudentRegistrationChoice,
            updateStudentRegistrationSelectionView,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateStudentRegistrationChoiceApi({});
})();

