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

    function jsQuote(value) {
        return `'${String(value == null ? '' : value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
    }

    function toPositiveInt(value, fallback = 0) {
        const parsed = parseInt(String(value == null ? '' : value).trim(), 10);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function getCurriculumLibraryModules(faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        if (!KIU_STATE.curriculumLibraryModulesByFaculty || typeof KIU_STATE.curriculumLibraryModulesByFaculty !== 'object') {
            KIU_STATE.curriculumLibraryModulesByFaculty = {};
        }
        if (!Array.isArray(KIU_STATE.curriculumLibraryModulesByFaculty[normalizedFaculty])) {
            KIU_STATE.curriculumLibraryModulesByFaculty[normalizedFaculty] = [];
        }
        return KIU_STATE.curriculumLibraryModulesByFaculty[normalizedFaculty];
    }

    function buildDefaultCurriculumModule(faculty, subjectIds = []) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        return {
            id: `CLM-${normalizedFaculty}-GENERAL`,
            letter: 'A',
            name: 'General Curriculum',
            maxEcts: subjectIds.reduce((sum, subjectId) => {
                const subject = getActiveCurriculum(normalizedFaculty).find(item => item.id === subjectId);
                return sum + (parseInt(subject?.ects, 10) || 0);
            }, 0),
            subjectIds: [...new Set(subjectIds)],
            systemDefault: true
        };
    }

    function ensureCurriculumLibraryModules(faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        const modules = getCurriculumLibraryModules(normalizedFaculty);
        const facultySubjects = getActiveCurriculum(normalizedFaculty);
        const validSubjectIds = new Set(facultySubjects.map(subject => subject.id));

        modules.forEach((module, index) => {
            module.id = module.id || `CLM-${normalizedFaculty}-${Date.now()}-${index}`;
            module.letter = module.letter || String.fromCharCode(65 + (index % 26));
            module.name = module.name || `Module ${index + 1}`;
            module.maxEcts = toPositiveInt(module.maxEcts, 0);
            module.subjectIds = [...new Set((module.subjectIds || []).filter(subjectId => validSubjectIds.has(subjectId)))];
            if (module.systemDefault) {
                const total = module.subjectIds.reduce((sum, subjectId) => {
                    const subject = facultySubjects.find(item => item.id === subjectId);
                    return sum + (parseInt(subject?.ects, 10) || 0);
                }, 0);
                module.maxEcts = Math.max(module.maxEcts, total);
            }
        });

        if (modules.length === 0 && facultySubjects.length > 0) {
            modules.push(buildDefaultCurriculumModule(normalizedFaculty, facultySubjects.map(subject => subject.id)));
        }

        const assigned = new Set(modules.flatMap(module => module.subjectIds || []));
        const missingSubjectIds = facultySubjects
            .map(subject => subject.id)
            .filter(subjectId => !assigned.has(subjectId));

        if (missingSubjectIds.length > 0) {
            let catchAll = modules.find(module => module.systemDefault);
            if (!catchAll) {
                catchAll = buildDefaultCurriculumModule(normalizedFaculty, []);
                catchAll.letter = String.fromCharCode(65 + (modules.length % 26));
                modules.unshift(catchAll);
            }
            catchAll.subjectIds = [...new Set([...(catchAll.subjectIds || []), ...missingSubjectIds])];
        }

        modules.forEach((module, index) => {
            module.letter = String.fromCharCode(65 + (index % 26));
        });

        return modules;
    }

    function getCurriculumLibraryModuleSubjects(module, faculty = getCurrentFaculty(), semesterFilter = 'all') {
        if (!module) return [];
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        const subjectsById = new Map(getActiveCurriculum(normalizedFaculty).map(subject => [subject.id, subject]));
        return (module.subjectIds || [])
            .map(subjectId => subjectsById.get(subjectId))
            .filter(Boolean)
            .filter(subject => semesterFilter === 'all' || String(subject.semester) === String(semesterFilter))
            .sort((a, b) => {
                const semDiff = (parseInt(a.semester, 10) || 99) - (parseInt(b.semester, 10) || 99);
                if (semDiff !== 0) return semDiff;
                return String(a.name || '').localeCompare(String(b.name || ''));
            });
    }

    function getCurriculumModuleEctsTotal(module, faculty = getCurrentFaculty()) {
        return getCurriculumLibraryModuleSubjects(module, faculty, 'all').reduce((sum, subject) => sum + (parseInt(subject.ects, 10) || 0), 0);
    }

    function renderStudentCurriculumLibraryModuleRows(subjects, faculty, semesterFilter) {
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
                <article class="lux-subject-row lux-program-subject-card ${hasPrerequisite ? 'has-prerequisite' : 'is-open'}">
                    <div class="lux-subject-row__code">
                        <div>${escapeHtml(subject.id)}</div>
                        <div class="lux-subject-row__meta">#${index + 1}</div>
                    </div>
                    <div class="lux-subject-row__body">
                        <div class="lux-subject-row__title">${escapeHtml(subject.name || 'Untitled Subject')}</div>
                        <div class="lux-subject-row__meta">${escapeHtml(getFacultyLabel(subject.faculty || faculty))}</div>
                        <div class="lux-subject-row__chips">
                            <span class="lux-status-pill wave2-chip wave2-chip--pill">Semester ${escapeHtml(String(subject.semester || '-'))}</span>
                            <span class="lux-status-pill wave2-chip wave2-chip--pill">${escapeHtml(String(subject.ects || 0))} ECTS</span>
                            ${subjectType ? `<span class="lux-status-pill wave2-chip wave2-chip--pill">${escapeHtml(subjectType)}</span>` : ''}
                            ${contactHours ? `<span class="lux-status-pill wave2-chip wave2-chip--pill">${escapeHtml(contactHours)}</span>` : ''}
                            ${language ? `<span class="lux-status-pill wave2-chip wave2-chip--pill">${escapeHtml(language)}</span>` : ''}
                        </div>
                        <div class="lux-subject-row__detail" title="${escapeHtml(prerequisite)}"><strong>Prerequisite:</strong> ${escapeHtml(prerequisite)}</div>
                        ${antiReq ? `<div class="lux-subject-row__detail is-soft" title="${escapeHtml(antiReq)}"><strong>Anti-requisite:</strong> ${escapeHtml(antiReq)}</div>` : ''}
                    </div>
                    <div class="lux-subject-row__stats">
                        <div class="lux-program-ects">${escapeHtml(String(subject.ects || 0))} ECTS</div>
                        <span class="lux-status-pill wave2-chip wave2-chip--pill">Sem ${escapeHtml(String(subject.semester || '-'))}</span>
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
        if (shouldRender) {
            renderStudentEducationalProgramPage();
        }
    }

    function syncStudentEducationalProgramSearchQuery(value, faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        programsUiState.searchQueryByFaculty = programsUiState.searchQueryByFaculty || {};
        programsUiState.searchQueryByFaculty[normalizedFaculty] = String(value || '').trim();
        if (programsUiState.searchDebounceTimer) {
            window.clearTimeout(programsUiState.searchDebounceTimer);
        }
        programsUiState.searchDebounceTimer = window.setTimeout(() => {
            renderStudentEducationalProgramPage();
        }, 120);
    }

    function filterStudentEducationalProgramSubjects(subjects, faculty, searchQuery = '') {
        const normalizedQuery = String(searchQuery || '').trim().toLowerCase();
        if (!normalizedQuery) return Array.isArray(subjects) ? subjects : [];
        return (Array.isArray(subjects) ? subjects : []).filter(subject => {
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
            return searchFields.some(value => String(value || '').toLowerCase().includes(normalizedQuery));
        });
    }

    function getCurriculumSemesterCoverage(subjects = []) {
        const semesters = [...new Set((subjects || [])
            .map(subject => parseInt(subject?.semester, 10))
            .filter(Number.isFinite)
            .sort((a, b) => a - b))];
        if (!semesters.length) return 'Open semester map';
        return semesters.map(semester => `S${semester}`).join(', ');
    }

    function countSubjectsWithPrerequisites(subjects = []) {
        return (subjects || []).filter(subject => {
            const prerequisite = String(subject?.cond || '').trim().toLowerCase();
            return prerequisite && prerequisite !== 'none';
        }).length;
    }

    function getSelectedStudentCurriculumModule(faculty = getCurrentFaculty()) {
        const normalizedFaculty = normalizeFacultyCode(faculty, getCurrentFaculty());
        const modules = ensureCurriculumLibraryModules(normalizedFaculty);
        const selectedId = programsUiState.selectedModulesByFaculty[normalizedFaculty];
        const selected = modules.find(module => module.id === selectedId) || modules[0] || null;
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
                <section id="programs-overview-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--overview lux-program-overview-card"></section>
                <div class="lux-program-grid">
                    <section id="programs-module-rail-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--module-rail"></section>
                    <section id="programs-subject-panel-region" class="lux-section-card lux-program-shell-section lux-program-shell-section--subject-panel"></section>
                </div>
            </div>
        `;
    }

    function renderProgramsOverviewRegion(context) {
        return `
            <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--overview">
                <div class="lux-program-overview lux-hero-stage">
                    <div class="lux-program-overview-main lux-hero-main">
                        <div class="lux-section-kicker"><i class="fas fa-compass"></i> Program atlas</div>
                        <div class="lux-section-title">${escapeHtml(context.programLabel)}</div>
                        <div class="lux-section-copy lux-program-overview-copy">Official program map for ${escapeHtml(context.facultyLabel)}. Use the module rail to move between blocks, inspect prerequisites, and verify semester placement before finalizing your study plan.</div>
                        <div class="lux-program-metric-strip lux-program-summary-strip lux-strip-grid lux-strip-grid--adaptive">
                            <article class="lux-program-metric lux-program-summary-card wave2-summary-card lux-strip-card surface-card">
                                <span class="wave2-summary-label lux-program-summary-label">Total credits</span>
                                <strong class="wave2-summary-value lux-program-summary-value">${context.totalProgramEcts}</strong>
                                <em class="wave2-summary-copy lux-program-summary-copy">ECTS in program</em>
                            </article>
                            <article class="lux-program-metric lux-program-summary-card wave2-summary-card lux-strip-card surface-card">
                                <span class="wave2-summary-label lux-program-summary-label">Visible credits</span>
                                <strong class="wave2-summary-value lux-program-summary-value">${context.visibleEcts}</strong>
                                <em class="wave2-summary-copy lux-program-summary-copy">${escapeHtml(context.semesterLabel)}</em>
                            </article>
                            <article class="lux-program-metric lux-program-summary-card wave2-summary-card lux-strip-card surface-card">
                                <span class="wave2-summary-label lux-program-summary-label">Requirements</span>
                                <strong class="wave2-summary-value lux-program-summary-value">${context.totalPrerequisiteSubjects}</strong>
                                <em class="wave2-summary-copy lux-program-summary-copy">subjects with prerequisites</em>
                            </article>
                        </div>
                        <div class="lux-program-chip-row">
                            <span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-university"></i> ${escapeHtml(context.facultyLabel)}</span>
                            <span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-filter"></i> ${escapeHtml(context.semesterLabel)}</span>
                            <span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-layer-group"></i> ${context.modules.length} modules</span>
                            ${context.searchQuery ? `<span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-search"></i> ${escapeHtml(context.searchQuery)}</span>` : ''}
                        </div>
                    </div>
                    <div class="lux-program-focus-panel lux-hero-side">
                        <div class="lux-hero-side-head">
                            <span class="lux-program-focus-label">Selected module</span>
                            <strong class="lux-program-focus-title">${escapeHtml(context.selectedModuleName)}</strong>
                            <span class="lux-program-focus-copy">${context.selectedModule ? `${context.searchLabel}. ${context.selectedModuleLimit ? `${context.selectedModuleEcts}/${context.selectedModuleLimit} ECTS load.` : `${context.selectedModuleEcts} ECTS total.`}` : 'Pick a module to review its subjects and credit load.'}</span>
                        </div>
                        <div class="lux-program-progress"><span class="lux-program-progress__bar" style="--lux-program-load:${context.selectedModuleLoad}%"></span></div>
                        <div class="lux-program-focus-stats lux-hero-signal-list">
                            <span class="lux-program-focus-stat lux-hero-signal">
                                <strong>${context.selectedModule ? context.selectedModuleEcts : 0}</strong>
                                <em>ECTS</em>
                            </span>
                            <span class="lux-program-focus-stat lux-hero-signal">
                                <strong>${context.selectedModule ? context.moduleSubjects.length : context.modules.length}</strong>
                                <em>${context.selectedModule ? 'visible subjects' : 'available modules'}</em>
                            </span>
                            <span class="lux-program-focus-stat lux-hero-signal ${context.selectedModuleLoad > 100 ? 'is-danger' : context.selectedModuleLoad === 100 ? 'is-success' : 'is-muted'}">
                                <strong>${context.selectedModule && context.selectedModuleLimit ? context.selectedModuleLoad : '--'}</strong>
                                <em>${context.selectedModule && context.selectedModuleLimit ? 'load percent' : 'open load'}</em>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="lux-program-semester-strip lux-program-semester-timeline" aria-label="Program semester timeline">
                    <button type="button" class="lux-program-semester-chip lux-program-semester-timeline__chip ${context.semesterFilter === 'all' ? 'is-active' : ''}" data-programs-semester="all">
                        <span>All semesters</span>
                        <strong>${context.totalProgramEcts} ECTS</strong>
                        <em>${context.allProgramSubjects.length} subjects</em>
                    </button>
                    ${context.semesterTimeline}
                </div>
            </div>
        `;
    }

    function renderProgramsModuleRailRegion(context) {
        return `
            <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--module-rail">
                <div class="lux-program-section-head">
                    <div class="lux-section-kicker"><i class="fas fa-layer-group"></i> Curriculum modules</div>
                    <span class="lux-status-pill wave2-chip wave2-chip--pill">${context.modules.length}</span>
                </div>
                <div class="lux-section-copy lux-program-rail-copy">Module list for ${escapeHtml(context.facultyLabel)} with live subject counts from the published academic program map.</div>
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
                            <label class="lux-module-option lux-program-module-option ${active ? 'is-active' : ''}">
                                <span class="lux-module-option__main">
                                    <input type="radio" name="student-curriculum-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} data-programs-module-radio="1" data-programs-faculty="${escapeHtml(context.programFaculty)}">
                                    <span class="lux-module-option__text">
                                        <span class="lux-module-option__title">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled Module'}`.trim())}</span>
                                        <span class="lux-module-option__meta">${subjectCount} subjects in current filter / ${escapeHtml(moduleSemesters)}</span>
                                    </span>
                                </span>
                                <span class="lux-module-option__right">
                                    <span class="lux-status-pill wave2-chip wave2-chip--pill lux-program-ects-pill">ECTS: ${ectsTotal}${limit ? `/${limit}` : ''}</span>
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
        return `
            <div class="lux-section-card__body lux-program-shell-body lux-program-shell-body--subject-panel lux-program-subject-panel">
                ${context.selectedModule ? `
                    <div class="lux-program-section-head lux-program-detail-head">
                        <div>
                            <div class="lux-section-title lux-program-module-title">${escapeHtml(context.selectedModule.name)}</div>
                            <div class="lux-section-copy lux-program-module-copy">Read-only module subjects for ${escapeHtml(context.facultyLabel)}.</div>
                        </div>
                        <div class="lux-program-focus-summary lux-program-detail-summary">
                            <span class="lux-status-pill wave2-chip wave2-chip--pill">ECTS: ${context.selectedModuleEcts}${context.selectedModuleLimit ? `/${context.selectedModuleLimit}` : ''}</span>
                            <span class="lux-status-pill wave2-chip wave2-chip--pill">${context.searchLabel}</span>
                        </div>
                    </div>
                    <div class="lux-program-module-facts lux-program-detail-facts">
                        <span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-calendar-alt"></i> ${escapeHtml(context.semesterCoverage)}</span>
                        <span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-link"></i> ${context.prerequisiteCount} subject${context.prerequisiteCount === 1 ? '' : 's'} with prerequisites</span>
                        <span class="lux-status-pill wave2-chip wave2-chip--pill"><i class="fas fa-book-open"></i> ${context.selectedModuleSubjectsAll.length} total subject${context.selectedModuleSubjectsAll.length === 1 ? '' : 's'} in module</span>
                    </div>
                    <div class="lux-program-column-head lux-program-detail-columns" aria-hidden="true">
                        <div class="lux-program-column-code">Code</div>
                        <div class="lux-program-column-subject">Subject title / requirements</div>
                        <div class="lux-program-column-ects">ECTS / semester</div>
                    </div>
                    <div class="lux-program-subject-list lux-program-detail-list">
                        ${renderStudentCurriculumLibraryModuleRows(context.moduleSubjects, context.programFaculty, context.searchQuery ? 'search' : context.semesterFilter)}
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
                    <div>
                        <div class="lux-section-title lux-program-module-title">${escapeHtml(context.selectedModule?.name || 'Program module')}</div>
                        <div class="lux-section-copy lux-program-module-copy">Preparing the current curriculum detail pane for ${escapeHtml(context.facultyLabel)}.</div>
                    </div>
                    <div class="lux-program-focus-summary lux-program-detail-summary">
                        <span class="lux-status-pill wave2-chip wave2-chip--pill">Filter: ${escapeHtml(context.semesterLabel)}</span>
                    </div>
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
                return;
            }

            const semesterChip = event.target.closest('[data-programs-semester]');
            if (semesterChip) {
                event.preventDefault();
                const semesterSelect = document.getElementById('student-program-semester-filter');
                if (semesterSelect) semesterSelect.value = semesterChip.dataset.programsSemester || 'all';
                renderStudentEducationalProgramPage();
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
        const contentBox = document.getElementById('student-educational-program-root')
            || document.querySelector('#page-programs .content-box.surface-card');
        if (!pageSection || !contentBox) return;
        bindProgramsPageDelegates();

        if (!document.getElementById('student-educational-program-root')) {
            contentBox.classList.add('lux-program-stage-host');
            contentBox.innerHTML = '<div id="student-educational-program-root"></div>';
        }
        const root = document.getElementById('student-educational-program-root');
        if (!root) return;
        ensureProgramsContentShell(root);

        const currentUser = getCurrentUser();
        const shellFaculty = getCurrentFaculty();
        const programFaculty = getStudentEducationalProgramFaculty(currentUser, shellFaculty);
        const facultyProfile = getFacultyProfile(programFaculty);
        const preservedSemesterFilter = document.getElementById('student-program-semester-filter')?.value || 'all';
        const preservedSearchQuery = document.getElementById('student-program-search')?.value || getStudentEducationalProgramSearchQuery(programFaculty);
        const heroTitleEl = document.getElementById('programs-hero-title');
        const heroCopyEl = document.getElementById('programs-hero-copy');
        const facultyBadge = document.getElementById('programs-hero-faculty-badge');
        const semesterFilterSelect = document.getElementById('student-program-semester-filter');
        const searchInput = document.getElementById('student-program-search');
        const clearSearchButton = document.getElementById('student-program-search-clear');
        const filterNote = document.getElementById('student-program-filter-note');

        if (heroTitleEl) heroTitleEl.textContent = 'Academic Programs';
        if (heroCopyEl) {
            heroCopyEl.textContent = 'Review the official program structure, module load, semester placement, ECTS credits, and prerequisites in a clear student planning workspace.';
        }
        if (semesterFilterSelect) semesterFilterSelect.value = preservedSemesterFilter;
        if (searchInput) {
            if (searchInput.value !== preservedSearchQuery) searchInput.value = preservedSearchQuery;
            searchInput.dataset.programsFaculty = programFaculty;
        }
        if (clearSearchButton) {
            clearSearchButton.dataset.programsFaculty = programFaculty;
            clearSearchButton.hidden = !preservedSearchQuery;
        }
        if (filterNote) {
            filterNote.textContent = programFaculty === shellFaculty
                ? `Program data is synced to ${getFacultyLabel(programFaculty)}.`
                : `Showing ${getFacultyLabel(programFaculty)} because programs follow the student's real faculty, not the current shell faculty filter.`;
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
        const facultyLabel = getFacultyLabel(programFaculty);
        const selectedModuleName = selectedModule ? `${selectedModule.letter || ''}. ${selectedModule.name || 'Untitled Module'}`.trim() : 'No module selected';
        const selectedModuleEcts = selectedModule ? getCurriculumModuleEctsTotal(selectedModule, programFaculty) : 0;
        const selectedModuleLimit = selectedModule ? toPositiveInt(selectedModule.maxEcts, 0) : 0;
        const selectedModuleLoad = selectedModuleLimit > 0 ? Math.min(100, Math.round((selectedModuleEcts / selectedModuleLimit) * 100)) : 0;
        const semesterLabel = semesterFilter === 'all' ? 'All semesters' : `Semester ${semesterFilter}`;
        const semesterCoverage = getCurriculumSemesterCoverage(selectedModuleSubjectsAll);
        const prerequisiteCount = countSubjectsWithPrerequisites(selectedModuleSubjectsAll);
        const searchLabel = searchQuery ? `${moduleSubjects.length} search result${moduleSubjects.length === 1 ? '' : 's'}` : `${moduleSubjects.length} subject${moduleSubjects.length === 1 ? '' : 's'} in current filter`;
        const allProgramSubjectsById = new Map();
        modules.forEach(module => {
            getCurriculumLibraryModuleSubjects(module, programFaculty, 'all').forEach(subject => {
                if (subject?.id) allProgramSubjectsById.set(subject.id, subject);
            });
        });
        const allProgramSubjects = Array.from(allProgramSubjectsById.values());
        const totalProgramEcts = allProgramSubjects.reduce((sum, subject) => sum + toPositiveInt(subject.ects, 0), 0);
        const visibleEcts = moduleSubjects.reduce((sum, subject) => sum + toPositiveInt(subject.ects, 0), 0);
        const totalPrerequisiteSubjects = countSubjectsWithPrerequisites(allProgramSubjects);
        const semesterNumbers = [...new Set(allProgramSubjects
            .map(subject => Number(subject.semester || 0))
            .filter(semester => semester > 0))]
            .sort((a, b) => a - b);
        const semesterTimeline = semesterNumbers.length ? semesterNumbers.map(semester => {
            const semesterSubjects = allProgramSubjects.filter(subject => Number(subject.semester || 0) === semester);
            const semesterEcts = semesterSubjects.reduce((sum, subject) => sum + toPositiveInt(subject.ects, 0), 0);
            const isActiveSemester = String(semesterFilter) === String(semester);
            return `
                <button type="button" class="lux-program-semester-chip lux-program-semester-timeline__chip ${isActiveSemester ? 'is-active' : ''}" data-programs-semester="${semester}">
                    <span>Semester ${semester}</span>
                    <strong>${semesterEcts} ECTS</strong>
                    <em>${semesterSubjects.length} subject${semesterSubjects.length === 1 ? '' : 's'}</em>
                </button>
            `;
        }).join('') : `
            <span class="lux-program-semester-chip lux-program-semester-timeline__chip is-empty">
                <span>No semester data</span>
                <strong>0 ECTS</strong>
                <em>Awaiting curriculum</em>
            </span>
        `;

        if (facultyBadge) facultyBadge.innerHTML = `<i class="fas fa-university"></i> Active Faculty: ${escapeHtml(facultyLabel)}`;

        const renderContext = {
            allProgramSubjects,
            facultyLabel,
            moduleSubjects,
            modules,
            prerequisiteCount,
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
            semesterCoverage,
            semesterFilter,
            semesterLabel,
            semesterTimeline,
            totalPrerequisiteSubjects,
            totalProgramEcts,
            visibleEcts
        };
        const overviewRegion = document.getElementById('programs-overview-region');
        const moduleRailRegion = document.getElementById('programs-module-rail-region');
        const subjectPanelRegion = document.getElementById('programs-subject-panel-region');
        if (overviewRegion) overviewRegion.innerHTML = renderProgramsOverviewRegion(renderContext);
        if (moduleRailRegion) moduleRailRegion.innerHTML = renderProgramsModuleRailRegion(renderContext);
        if (subjectPanelRegion) scheduleProgramsSubjectPanelRender(renderContext, subjectPanelRegion);
    }

    window.getStudentEducationalProgramSearchQuery = getStudentEducationalProgramSearchQuery;
    window.setStudentEducationalProgramSearchQuery = setStudentEducationalProgramSearchQuery;
    window.syncStudentEducationalProgramSearchQuery = syncStudentEducationalProgramSearchQuery;
    window.setStudentEducationalProgramModuleSelection = setStudentEducationalProgramModuleSelection;
    window.renderStudentEducationalProgramPage = renderStudentEducationalProgramPage;
})();
