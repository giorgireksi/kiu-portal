(function initProgramsPageController() {
    'use strict';

    const programsUiState = window.studentEducationalProgramUiState = window.studentEducationalProgramUiState || {
        selectedModulesByFaculty: {},
        searchQueryByFaculty: {},
        searchDebounceTimer: null,
        detailRenderRequestId: 0,
        detailRenderHandle: null,
        detailRenderHandleType: ''
    };

    function toPositiveInt(value, fallback = 0) {
        return typeof toCurriculumPositiveInt === 'function'
            ? toCurriculumPositiveInt(value, fallback)
            : (Number.isFinite(parseInt(String(value == null ? '' : value).trim(), 10))
                ? parseInt(String(value == null ? '' : value).trim(), 10)
                : fallback);
    }

    function renderStudentCurriculumLibraryModuleRows(subjects, faculty, semesterFilter, semesterList = [1]) {
        if (!subjects.length) {
            const emptyText = semesterFilter === 'search'
                ? 'No subjects match the current search query.'
                : semesterFilter === 'all'
                    ? 'No subjects are published inside this module yet.'
                    : 'No subjects in this module match the selected semester filter.';
            return `
                <div class="lux-empty-state lux-program-empty-state lux-program-empty-state--subjects">
                    <i class="fas fa-book-open"></i>
                    <strong class="lux-empty-state__title">Nothing to show</strong>
                    <span class="lux-empty-state__copy">${emptyText}</span>
                </div>
            `;
        }

        return subjects.map((subject, index) => {
            const prerequisite = subject.cond && subject.cond !== 'None' ? subject.cond : 'None';
            const antiReq = subject.antireq && subject.antireq !== 'None' ? String(subject.antireq) : '';
            const subjectType = String(subject.type || subject.component || subject.category || '').trim();
            const contactHours = String(subject.hours || subject.contactHours || subject.workload || '').trim();
            const language = String(subject.language || subject.teachingLanguage || '').trim();
            const hasPrerequisite = prerequisite !== 'None';
            return `
                <article class="lux-subject-row lux-program-subject-card home-hover-chip ${hasPrerequisite ? 'has-prerequisite' : 'is-open'}" style="--program-semester-count:${semesterList.length}">
                    <div class="lux-subject-row__code">
                        <div>${escapeHtml(subject.id)}</div>
                        <div class="lux-subject-row__meta">#${index + 1}</div>
                    </div>
                    <div class="lux-subject-row__body">
                        <div class="lux-subject-row__title">${escapeHtml(subject.name || 'Untitled Subject')}</div>
                        <div class="lux-subject-row__secondary">
                            <div class="lux-subject-row__meta">${escapeHtml(getFacultyLabel(subject.faculty || faculty))}</div>
                            <div class="lux-subject-row__chips">
                                ${subjectType ? `<span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill">${escapeHtml(subjectType)}</span>` : ''}
                                ${contactHours ? `<span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill">${escapeHtml(contactHours)}</span>` : ''}
                                ${language ? `<span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill">${escapeHtml(language)}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="lux-subject-row__ects" aria-label="${escapeHtml(String(subject.ects || 0))} ECTS">
                        <strong class="lux-subject-row__ects-value">${escapeHtml(String(subject.ects || 0))}</strong>
                    </div>
                    <div class="lux-subject-row__prerequisite ${hasPrerequisite ? 'has-prerequisite' : 'is-empty'}">
                        <span class="lux-subject-row__prerequisite-value" title="${hasPrerequisite ? escapeHtml(prerequisite) : 'does not have'}">${hasPrerequisite ? escapeHtml(prerequisite) : 'does not have'}</span>
                        ${antiReq ? `<span class="lux-subject-row__prerequisite-secondary" title="${escapeHtml(antiReq)}"><strong>Anti-requisite:</strong> ${escapeHtml(antiReq)}</span>` : ''}
                    </div>
                    <div class="lux-subject-row__semesters" aria-label="Semester distribution">
                        ${typeof renderSemesterDistributionCells === 'function'
                            ? renderSemesterDistributionCells(semesterList, typeof normalizeSubjectSemesters === 'function' ? normalizeSubjectSemesters(subject) : subject.semester)
                            : ''}
                    </div>
                    <div class="lux-subject-row__stats">
                        <span class="lux-program-requirement ${hasPrerequisite ? 'is-locked' : 'is-open'}">
                            <i class="fas ${hasPrerequisite ? 'fa-link' : 'fa-check'}"></i>
                            ${hasPrerequisite ? 'Requires' : 'Open'}
                        </span>
                    </div>
                </article>
            `;
        }).join('');
    }

    function getStudentEducationalProgramFaculty(user = getCurrentUser(), fallbackFaculty = getCurrentFaculty()) {
        return normalizeFacultyCode(user?.facultyCode || user?.faculty || fallbackFaculty || 'ECON', fallbackFaculty || 'ECON');
    }

    function getStudentEducationalProgramSearchQuery(faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        programsUiState.searchQueryByFaculty = programsUiState.searchQueryByFaculty || {};
        return String(programsUiState.searchQueryByFaculty[normalizedFaculty] || '').trim();
    }

    function setStudentEducationalProgramSearchQuery(value, faculty = getCurrentFaculty(), shouldRender = true) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        programsUiState.searchQueryByFaculty = programsUiState.searchQueryByFaculty || {};
        programsUiState.searchQueryByFaculty[normalizedFaculty] = String(value || '').trim();
        if (shouldRender) renderStudentEducationalProgramPage();
    }

    function syncStudentEducationalProgramSearchQuery(value, faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        programsUiState.searchQueryByFaculty = programsUiState.searchQueryByFaculty || {};
        programsUiState.searchQueryByFaculty[normalizedFaculty] = String(value || '').trim();
        if (programsUiState.searchDebounceTimer) window.clearTimeout(programsUiState.searchDebounceTimer);
        programsUiState.searchDebounceTimer = window.setTimeout(() => {
            renderStudentEducationalProgramPage();
        }, 120);
    }

    function filterStudentEducationalProgramSubjects(subjects, faculty, searchQuery = '') {
        const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
        if (!normalizedQuery) return Array.isArray(subjects) ? subjects : [];
        return (Array.isArray(subjects) ? subjects : []).filter((subject) => {
            const searchFields = [
                subject?.id,
                subject?.name,
                subject?.cond,
                subject?.antireq,
                subject?.semester,
                subject?.ects,
                subject?.type,
                subject?.component,
                subject?.category,
                subject?.language,
                subject?.teachingLanguage,
                getFacultyLabel(subject?.faculty || faculty)
            ];
            return searchFields.some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
        });
    }

    function getSelectedStudentCurriculumModule(faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        const modules = ensureCurriculumLibraryModules(normalizedFaculty);
        const selectedId = programsUiState.selectedModulesByFaculty[normalizedFaculty];
        const selected = modules.find((module) => module.id === selectedId) || modules[0] || null;
        if (selected) {
            programsUiState.selectedModulesByFaculty[normalizedFaculty] = selected.id;
        } else {
            delete programsUiState.selectedModulesByFaculty[normalizedFaculty];
        }
        return selected;
    }

    function setStudentEducationalProgramModuleSelection(moduleId, faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        if (!moduleId) {
            delete programsUiState.selectedModulesByFaculty[normalizedFaculty];
        } else {
            programsUiState.selectedModulesByFaculty[normalizedFaculty] = String(moduleId);
        }
        renderStudentEducationalProgramPage();
    }

    function ensureProgramsContentShell(root) {
        if (!root || root.dataset.programsContentShell === '1') return;
        root.dataset.programsContentShell = '1';
        root.innerHTML = `
            <div class="lux-program-shell">
                <div class="lux-program-grid">
                    <section id="programs-module-rail-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--module-rail" data-programs-panel-shell="1"></section>
                    <section id="programs-subject-panel-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--subject-panel" data-programs-panel-shell="1"></section>
                </div>
            </div>
        `;
    }

    function syncProgramsCommandDeck(context) {
        const setText = (id, value) => {
            const node = document.getElementById(id);
            if (node) node.textContent = value;
        };

        setText('programs-ops-total-ects', String(context.totalProgramEcts));
        setText('programs-ops-visible-ects', String(context.visibleEcts));
        setText('programs-ops-modules', String(context.modules.length));
        setText('programs-ops-prerequisites', String(context.totalPrerequisiteSubjects));

        const moduleLoadValue = context.selectedModule && context.selectedModuleLimit
            ? `${context.selectedModuleLoad}%`
            : (context.selectedModule ? `${context.selectedModuleEcts} ECTS` : '--');
        setText('programs-ops-module-load', moduleLoadValue);

        setText('programs-ops-total-ects-note', `${context.allProgramSubjects.length} subjects in program`);
        setText('programs-ops-visible-ects-note', context.semesterLabel);
        setText('programs-ops-modules-note', context.selectedModuleName);
        setText('programs-ops-prerequisites-note', 'Across published curriculum');
        setText('programs-ops-module-load-note', context.selectedModule && context.selectedModuleLimit
            ? `${context.selectedModuleEcts}/${context.selectedModuleLimit} ECTS capacity`
            : (context.selectedModule ? `${context.searchLabel}` : 'Select a module'));

        const opsNote = document.getElementById('programs-ops-note');
        if (opsNote) {
            opsNote.textContent = `${context.programLabel} · ${context.searchQuery ? context.searchLabel : context.semesterLabel}`;
        }
    }

    function renderProgramsModuleRailRegion(context) {
        return `
            <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--module-rail">
                <div class="lux-program-section-head">
                    <div class="lux-section-kicker"><i class="fas fa-layer-group"></i> Curriculum modules</div>
                    <span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill">${context.modules.length}</span>
                </div>
                <div class="lux-module-rail lux-program-module-rail" data-preserve-scroll-key="student-curriculum-modules">
                    ${context.modules.length === 0 ? `
                        <div class="lux-empty-state lux-program-empty-state">
                            <i class="fas fa-layer-group"></i>
                            <strong class="lux-empty-state__title">No curriculum modules yet</strong>
                            <span class="lux-empty-state__copy">No curriculum modules are available for this faculty yet.</span>
                        </div>
                    ` : context.modules.map((module) => {
                        const active = context.selectedModule && module.id === context.selectedModule.id;
                        const moduleSubjectsForFaculty = getCurriculumLibraryModuleSubjects(module, context.programFaculty, 'all');
                        const ectsTotal = getCurriculumModuleEctsTotal(module, context.programFaculty);
                        const subjectCount = getCurriculumLibraryModuleSubjects(module, context.programFaculty, context.semesterFilter).length;
                        const limit = toPositiveInt(module.maxEcts, 0);
                        const load = limit > 0 ? Math.min(100, Math.round((ectsTotal / limit) * 100)) : 0;
                        const moduleSemesters = getCurriculumSemesterCoverage(moduleSubjectsForFaculty);
                        return `
                            <label class="lux-module-option lux-program-module-option lux-soft-chrome home-hover-chip ${active ? 'is-active' : ''}">
                                <span class="lux-module-option__main">
                                    <input type="radio" name="student-curriculum-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} data-programs-module-radio="1" data-programs-faculty="${escapeHtml(context.programFaculty)}">
                                    <span class="lux-module-option__text">
                                        <span class="lux-module-option__title">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled Module'}`.trim())}</span>
                                        <span class="lux-module-option__meta">${subjectCount} subjects in current filter / ${escapeHtml(moduleSemesters)}</span>
                                    </span>
                                </span>
                                <span class="lux-module-option__right">
                                    <span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill lux-program-ects-pill">ECTS: ${ectsTotal}${limit ? `/${limit}` : ''}</span>
                                    <span class="lux-module-option__meter"><span class="lux-module-option__meter-bar" style="--lux-program-module-load:${load}%"></span></span>
                                </span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    function renderProgramsSubjectPanelRegion(context) {
        const semesterList = typeof getProgramSemesterList === 'function'
            ? getProgramSemesterList(context.programFaculty, context.allProgramSubjects)
            : [1];
        return `
            <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--subject-panel lux-program-subject-panel">
                ${context.selectedModule ? `
                    <div class="lux-program-section-head lux-program-detail-head">
                        <div class="lux-section-title lux-program-module-title">${escapeHtml(context.selectedModule.name)}</div>
                        <span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill">${escapeHtml(context.searchLabel)}</span>
                    </div>
                    <div class="lux-program-semester-table-scroll">
                        <div class="lux-program-column-head lux-program-detail-columns" aria-hidden="true">
                            <div class="lux-program-column-code">Code</div>
                            <div class="lux-program-column-subject">Subject title / requirements</div>
                            <div class="lux-program-column-ects">ECTS</div>
                            <div class="lux-program-column-prerequisite">Prerequisite</div>
                            <div class="lux-program-column-semesters">
                                <span>Semester distribution</span>
                                <span class="lux-program-semester-head" style="--program-semester-count:${semesterList.length}">
                                    ${typeof renderSemesterDistributionHeader === 'function' ? renderSemesterDistributionHeader(semesterList) : ''}
                                </span>
                            </div>
                            <div class="lux-program-column-status">Status</div>
                        </div>
                        <div class="lux-program-subject-list lux-program-detail-list">
                            ${renderStudentCurriculumLibraryModuleRows(context.moduleSubjects, context.programFaculty, context.searchQuery ? 'search' : context.semesterFilter, semesterList)}
                        </div>
                    </div>
                ` : `
                    <div class="lux-empty-state lux-program-empty-state lux-program-empty-state--panel">
                        <i class="fas fa-layer-group"></i>
                        <strong class="lux-empty-state__title">No curriculum module selected</strong>
                        <span class="lux-empty-state__copy">No curriculum module is available to display yet.</span>
                    </div>
                `}
            </div>
        `;
    }

    function renderProgramsSubjectPanelLoadingRegion(context) {
        return `
            <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--subject-panel lux-program-subject-panel">
                <div class="lux-program-section-head lux-program-detail-head">
                    <div class="lux-section-title lux-program-module-title">${escapeHtml(context.selectedModule?.name || 'Program module')}</div>
                    <span class="lux-status-pill home-hover-chip wave2-chip wave2-chip--pill">${escapeHtml(context.semesterLabel)}</span>
                </div>
                <div class="lux-empty-state lux-program-empty-state lux-program-empty-state--loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <strong class="lux-empty-state__title">Loading curriculum detail</strong>
                    <span class="lux-empty-state__copy">Preparing the filtered curriculum detail panel.</span>
                </div>
            </div>
        `;
    }

    function cancelProgramsSubjectPanelRender() {
        const handle = programsUiState.detailRenderHandle;
        const handleType = programsUiState.detailRenderHandleType;
        if (!handle) return;
        if (handleType === 'idle' && typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(handle);
        } else if (handleType === 'raf' && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(handle);
        } else {
            window.clearTimeout(handle);
        }
        programsUiState.detailRenderHandle = null;
        programsUiState.detailRenderHandleType = '';
    }

    function scheduleProgramsSubjectPanelRender(context, region) {
        if (!region) return;
        cancelProgramsSubjectPanelRender();
        programsUiState.detailRenderRequestId += 1;
        const requestId = programsUiState.detailRenderRequestId;
        region.innerHTML = renderProgramsSubjectPanelLoadingRegion(context);

        const commit = () => {
            if (requestId !== programsUiState.detailRenderRequestId) return;
            region.innerHTML = renderProgramsSubjectPanelRegion(context);
            programsUiState.detailRenderHandle = null;
            programsUiState.detailRenderHandleType = '';
        };

        const shouldUseIdle = !!context.selectedModule && (
            (context.moduleSubjects && context.moduleSubjects.length > 8)
            || (context.selectedModuleSubjectsAll && context.selectedModuleSubjectsAll.length > 12)
        );

        if (shouldUseIdle && typeof window.requestIdleCallback === 'function') {
            programsUiState.detailRenderHandleType = 'idle';
            programsUiState.detailRenderHandle = window.requestIdleCallback(commit, { timeout: 180 });
            return;
        }

        if (typeof window.requestAnimationFrame === 'function') {
            programsUiState.detailRenderHandleType = 'raf';
            programsUiState.detailRenderHandle = window.requestAnimationFrame(commit);
            return;
        }

        programsUiState.detailRenderHandleType = 'timeout';
        programsUiState.detailRenderHandle = window.setTimeout(commit, 0);
    }

    function bindProgramsPageDelegates() {
        const root = document.getElementById('page-programs');
        if (!root || root.dataset.programsDelegatesBound === '1') return;
        root.dataset.programsDelegatesBound = '1';

        root.addEventListener('click', (event) => {
            const clearSearch = event.target.closest('[data-programs-clear-search]');
            if (clearSearch) {
                event.preventDefault();
                setStudentEducationalProgramSearchQuery('', clearSearch.dataset.programsFaculty || getCurrentFaculty());
            }
        });

        root.addEventListener('input', (event) => {
            const searchInput = event.target;
            if (!(searchInput instanceof HTMLInputElement)) return;
            if (searchInput.matches('[data-programs-search]')) {
                syncStudentEducationalProgramSearchQuery(searchInput.value, searchInput.dataset.programsFaculty || getCurrentFaculty());
            }
        });

        root.addEventListener('change', (event) => {
            const target = event.target;
            if (target instanceof HTMLSelectElement && target.matches('[data-programs-semester-filter]')) {
                renderStudentEducationalProgramPage();
                return;
            }
            if (target instanceof HTMLInputElement && target.matches('[data-programs-module-radio]')) {
                setStudentEducationalProgramModuleSelection(target.value, target.dataset.programsFaculty || getCurrentFaculty());
            }
        });
    }

    function renderStudentEducationalProgramPage() {
        const pageSection = document.getElementById('page-programs');
        const root = document.getElementById('student-educational-program-root');
        if (!pageSection || !root) return;
        bindProgramsPageDelegates();
        ensureProgramsContentShell(root);

        const currentUser = getCurrentUser();
        const programFaculty = getStudentEducationalProgramFaculty(currentUser, getCurrentFaculty());
        const facultyProfile = getFacultyProfile(programFaculty);
        const preservedSemesterFilter = document.getElementById('student-program-semester-filter')?.value || 'all';
        const preservedSearchQuery = document.getElementById('student-program-search')?.value || getStudentEducationalProgramSearchQuery(programFaculty);
        const semesterFilterSelect = document.getElementById('student-program-semester-filter');
        const searchInput = document.getElementById('student-program-search');
        const clearSearchButton = document.getElementById('student-program-search-clear');

        if (semesterFilterSelect) semesterFilterSelect.value = preservedSemesterFilter;
        if (searchInput) {
            if (searchInput.value !== preservedSearchQuery) searchInput.value = preservedSearchQuery;
            searchInput.dataset.programsFaculty = programFaculty;
        }
        if (clearSearchButton) {
            clearSearchButton.dataset.programsFaculty = programFaculty;
            clearSearchButton.hidden = !preservedSearchQuery;
        }
        setStudentEducationalProgramSearchQuery(preservedSearchQuery, programFaculty, false);
        const semesterFilter = semesterFilterSelect?.value || preservedSemesterFilter;
        const searchQuery = getStudentEducationalProgramSearchQuery(programFaculty);
        const modules = ensureCurriculumLibraryModules(programFaculty);
        const selectedModule = getSelectedStudentCurriculumModule(programFaculty);
        const programLabel = getProgramLabelForUser(currentUser, facultyProfile);
        const selectedModuleSubjectsAll = getCurriculumLibraryModuleSubjects(selectedModule, programFaculty, 'all');
        const moduleSubjects = filterStudentEducationalProgramSubjects(
            getCurriculumLibraryModuleSubjects(selectedModule, programFaculty, semesterFilter),
            programFaculty,
            searchQuery
        );
        const selectedModuleName = selectedModule ? `${selectedModule.letter || ''}. ${selectedModule.name || 'Untitled Module'}`.trim() : 'No module selected';
        const selectedModuleEcts = selectedModule ? getCurriculumModuleEctsTotal(selectedModule, programFaculty) : 0;
        const selectedModuleLimit = selectedModule ? toPositiveInt(selectedModule.maxEcts, 0) : 0;
        const selectedModuleLoad = selectedModuleLimit > 0 ? Math.min(100, Math.round((selectedModuleEcts / selectedModuleLimit) * 100)) : 0;
        const semesterLabel = semesterFilter === 'all' ? 'All semesters' : `Semester ${semesterFilter}`;
        const searchLabel = searchQuery
            ? `${moduleSubjects.length} search result${moduleSubjects.length === 1 ? '' : 's'}`
            : `${moduleSubjects.length} subject${moduleSubjects.length === 1 ? '' : 's'} in current filter`;
        const allProgramSubjectsById = new Map();
        modules.forEach((module) => {
            getCurriculumLibraryModuleSubjects(module, programFaculty, 'all').forEach((subject) => {
                if (subject?.id) allProgramSubjectsById.set(subject.id, subject);
            });
        });
        const allProgramSubjects = Array.from(allProgramSubjectsById.values());
        const totalProgramEcts = allProgramSubjects.reduce((sum, subject) => sum + toPositiveInt(subject.ects, 0), 0);
        const visibleEcts = moduleSubjects.reduce((sum, subject) => sum + toPositiveInt(subject.ects, 0), 0);
        const renderContext = {
            allProgramSubjects,
            moduleSubjects,
            modules,
            programFaculty,
            programLabel,
            searchLabel,
            searchQuery,
            selectedModule,
            selectedModuleEcts,
            selectedModuleLimit,
            selectedModuleLoad,
            selectedModuleName,
            selectedModuleSubjectsAll,
            semesterFilter,
            semesterLabel,
            totalPrerequisiteSubjects: countSubjectsWithPrerequisites(allProgramSubjects),
            totalProgramEcts,
            visibleEcts
        };
        syncProgramsCommandDeck(renderContext);
        const moduleRailRegion = document.getElementById('programs-module-rail-region');
        const subjectPanelRegion = document.getElementById('programs-subject-panel-region');
        if (moduleRailRegion) moduleRailRegion.innerHTML = renderProgramsModuleRailRegion(renderContext);
        if (subjectPanelRegion) scheduleProgramsSubjectPanelRender(renderContext, subjectPanelRegion);
    }

    window.getStudentEducationalProgramSearchQuery = getStudentEducationalProgramSearchQuery;
    window.setStudentEducationalProgramSearchQuery = setStudentEducationalProgramSearchQuery;
    window.syncStudentEducationalProgramSearchQuery = syncStudentEducationalProgramSearchQuery;
    window.setStudentEducationalProgramModuleSelection = setStudentEducationalProgramModuleSelection;
    window.renderStudentEducationalProgramPage = renderStudentEducationalProgramPage;
})();
