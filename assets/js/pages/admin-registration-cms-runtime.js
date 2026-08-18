/* Admin registration CMS modules/program/minor/faculty helpers. Peeled from admin-registration.js.
 * Load before admin-registration.js.
 */
(function initAdminRegistrationCmsRuntime() {
    if (window.__KIU_ADMIN_REGISTRATION_CMS_LOADED) return;
    window.__KIU_ADMIN_REGISTRATION_CMS_LOADED = true;

    window.__kiuCreateAdminRegistrationCmsApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

function renderAdminRegistrationModules(tabType) {
    const container = document.getElementById('admin-reg-content-container');
    if (!container) return;

    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const validTabs = typeof getValidAdminRegTabIds === 'function'
        ? getValidAdminRegTabIds(currentFaculty)
        : ['prog', 'free', 'conc', 'minor'];
    const safeTab = validTabs.includes(tabType) ? tabType : 'prog';

    const selectedProgramInput = document.querySelector(`input[name="admin-reg-program-${safeTab}"]:checked`);
    if (selectedProgramInput && typeof setAdminRegSelectedProgram === 'function') {
        const nextProgram = selectedProgramInput.value;
        const currentProgram = typeof getAdminRegSelectedProgram === 'function'
            ? getAdminRegSelectedProgram(safeTab)
            : null;
        setAdminRegSelectedProgram(safeTab, nextProgram, { preserveGroupKey: nextProgram === currentProgram });
    }

    container.dataset.cmsFaculty = currentFaculty;
    container.dataset.cmsRevision = getAdminRegistrationCmsRevision();

    ensureAdminRegistrationCmsDefaults(currentFaculty);
    bindFacultyRegistrationCmsData(currentFaculty);

    const renderLegacyFallback = () => {
        container.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-triangle-exclamation',
            title: 'Registration Structure CMS could not load',
            copy: 'Please refresh once.',
            classes: 'admin-reg-render-fallback'
        });
    };

    try {
        const tabConfig = typeof resolveAdminRegTab === 'function'
            ? resolveAdminRegTab(safeTab)
            : null;
        if (tabConfig && typeof renderAdminRegTrackTab === 'function') {
            renderAdminRegTrackTab(container, tabConfig);
        }

        if (!hasVisibleAdminRegistrationCmsContent(container)) {
            console.log('[RegCMS] Track render produced no content, using legacy fallback.');
            renderLegacyFallback();
        }
        container.setAttribute('data-lux-transparency-exempt', '1');
        if (typeof refreshAdminRegistrationCmsPresentation === 'function') {
            refreshAdminRegistrationCmsPresentation();
        }
    } catch (err) {
        console.error('Registration CMS render failed, falling back to legacy layout:', err);
        renderLegacyFallback();
    }
}

function buildAdminRegEmptyStateMarkup({ icon = 'fas fa-circle-info', title = '', copy = '', classes = '' } = {}) {
    const className = ['lux-empty-state', classes].filter(Boolean).join(' ');
    return `
        <div class="${className}">
            <i class="${escapeHtml(icon)}"></i>
            <strong>${escapeHtml(title || 'Nothing to show yet')}</strong>
            ${copy ? `<span>${escapeHtml(copy)}</span>` : ''}
        </div>
    `;
}

// TAB 1: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¾ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â (My Program) - Nested with prerequisites
function renderProgTab(container, modules, tabType) {
    if (modules.length > 0) {
        if (!modules.some(mod => mod.id === adminRegUiState.selectedProgModule)) {
            adminRegUiState.selectedProgModule = modules[0].id;
        }
    } else {
        adminRegUiState.selectedProgModule = null;
    }

    const html = `
        <div class="admin-reg-program-head">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title">Program Modules</div>
            </div>
            <button type="button" data-admin-reg-add-module="prog" class="lux-primary-btn admin-reg-program-add-btn"><i class="fas fa-plus"></i> Add Module</button>
        </div>
        <div class="admin-reg-program-layout">
            <div class="lux-surface admin-reg-program-list-shell lux-soft-chrome home-hover-chip">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title">Modules</div>
                    <span class="admin-reg-program-list-count">${modules.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-prog-modules" class="admin-reg-program-list">
                    ${modules.length === 0 ? `
                        <div class="lux-empty-state admin-reg-program-list-empty">
                            <i class="fas fa-folder-plus"></i>
                            <strong>No modules yet</strong>
                            <span>Create your first program module to get started.</span>
                        </div>
                    ` : modules.map(module => {
                        const active = module.id === adminRegUiState.selectedProgModule;
                        const completed = getAssignedCourseEctsTotal(module.subModules || []);
                        const progress = formatEctsProgress(module.maxEcts || 0, completed);
                        return `
                            <label class="admin-reg-program-option${active ? ' is-active' : ''}">
                                <span class="admin-reg-program-option-row">
                                    <input type="radio" name="prog-module" value="${escapeHtml(module.id)}" ${active ? 'checked' : ''} class="admin-reg-program-option-input" data-admin-reg-select-module="${escapeHtml(module.id)}" data-admin-reg-module-tab="prog">
                                    <span class="admin-reg-program-option-title">${escapeHtml(`${module.letter || ''}. ${module.name || 'Untitled'}`.trim())}</span>
                                </span>
                                <span class="admin-reg-program-option-progress">ECTS: ${escapeHtml(progress)}</span>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="prog-module-pane"></div>
        </div>
    `;

    container.innerHTML = localizeHtmlMarkup(html);
    renderProgModulePane();
}

function renderProgModulePane() {
    const pane = document.getElementById('prog-module-pane');
    if (!pane) return;

    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const modules = KIU_STATE.adminProgramStructures?.[currentFaculty]?.prog || [];
    const module = modules.find(item => item.id === adminRegUiState.selectedProgModule) || modules[0] || null;

    if (!module) {
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-arrow-left',
            title: 'Select a module',
            copy: 'Choose a module from the list to manage its subjects.',
            classes: 'admin-reg-program-pane-empty admin-reg-program-pane-empty--tall'
        });
        return;
    }

    adminRegUiState.selectedProgModule = module.id;
    const subModules = module.subModules || [];
    const progressLabel = formatEctsProgress(module.maxEcts || 0, getAssignedCourseEctsTotal(subModules));

    pane.innerHTML = `
        <div class="admin-reg-program-pane-head">
            <div class="admin-reg-program-pane-main">
                <div class="admin-reg-program-pane-title">${escapeHtml(module.name || 'Program')}</div>
                <div class="admin-reg-program-pane-copy">Module subjects</div>
            </div>
            <div class="admin-reg-program-pane-actions">
                <button type="button" data-admin-reg-edit-module="${escapeHtml(module.id)}" class="lux-ghost-btn admin-reg-program-pane-btn"><i class="fas fa-edit"></i> Edit</button>
                <button type="button" data-admin-reg-delete-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn admin-reg-program-pane-btn admin-reg-program-pane-btn--danger"><i class="fas fa-trash"></i></button>
                <button type="button" data-admin-reg-add-subject="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-primary-btn admin-reg-program-pane-btn"><i class="fas fa-plus"></i> Add Subject</button>
            </div>
        </div>
        <div class="admin-reg-program-subject-list">
            ${(subModules.length === 0 ? `
                ${buildAdminRegEmptyStateMarkup({
                    icon: 'fas fa-book-open',
                    title: 'No subjects assigned',
                    copy: 'Add subjects to this module using the button above.',
                    classes: 'admin-reg-program-subject-empty'
                })}
            ` : subModules.map((subMod, idx) => {
                const details = getAssignedCourseCurriculumDetails(subMod, currentFaculty);
                return `
                <div class="admin-reg-program-subject-row">
                    <div class="admin-reg-program-subject-number">${escapeHtml(subMod.number || idx + 1)}</div>
                    <div class="admin-reg-program-subject-main">
                        <div class="admin-reg-program-subject-title">${escapeHtml(subMod.name || 'Untitled Subject')}</div>
                        <div class="admin-reg-program-subject-courses">${escapeHtml((subMod.courses || []).join(', ') || '')}</div>
                    </div>
                    <div class="admin-reg-program-subject-ects">${escapeHtml(subMod.ects || '0')}</div>
                    <div class="admin-reg-program-subject-details">
                        <div>${escapeHtml(`Prerequisite: ${details.prerequisite}`)}</div>
                        ${details.antiRequisite ? `<div class="admin-reg-program-subject-detail">${escapeHtml(`Anti-requisite: ${details.antiRequisite}`)}</div>` : ''}
                        ${details.curriculumSemester ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--semester">${escapeHtml(details.curriculumSemester)}</div>` : ''}
                        ${details.studentAccess ? `<div class="admin-reg-program-subject-detail admin-reg-program-subject-detail--access">${escapeHtml(`Student access: ${details.studentAccess}`)}</div>` : ''}
                    </div>
                    <div class="admin-reg-program-subject-actions">
                        <button type="button" data-admin-reg-edit-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn admin-reg-program-subject-btn"><i class="fas fa-edit"></i></button>
                        <button type="button" data-admin-reg-delete-submodule="${escapeHtml(subMod.id)}" data-admin-reg-parent-module="${escapeHtml(module.id)}" data-admin-reg-tab="prog" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `; }).join(''))}
        </div>
    `;
}

function selectProgModule(moduleId) {
    adminRegUiState.selectedProgModule = moduleId;
    const container = document.getElementById('admin-reg-content-container');
    const selectedOption = container
        ? Array.from(container.querySelectorAll('[data-admin-reg-select-module]'))
            .find((input) => input.value === String(moduleId || ''))
        : null;
    if (!selectedOption) {
        rerenderAdminRegistrationModulesPreservingScroll('prog');
        return;
    }

    // The module list is unchanged: update only its selection state and the
    // detail pane instead of rebuilding the entire registration workspace.
    container.querySelectorAll('[data-admin-reg-select-module]').forEach((input) => {
        const active = input === selectedOption;
        input.checked = active;
        input.closest('.admin-reg-program-option')?.classList.toggle('is-active', active);
    });
    renderProgModulePane();
    if (typeof refreshAdminRegistrationCmsPresentation === 'function') {
        refreshAdminRegistrationCmsPresentation();
    }
}

function editProgSubModule(moduleId, subModuleId) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const module = KIU_STATE.adminProgramStructures?.[currentFaculty]?.prog?.find(item => item.id === moduleId);
    const subModule = module?.subModules?.find(item => item.id === subModuleId);
    if (!module || !subModule) return;
    const curriculumSummary = getAssignedCourseCurriculumSummary(subModule, currentFaculty);

    openStructuredFormModal({
        title: 'Edit Program Subject',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'number', label: 'Subject Number', value: subModule.number || '', placeholder: 'e.g. 221' },
            { name: 'name', label: 'Subject Name', value: subModule.name || '', placeholder: 'Enter subject name' },
            { name: 'ects', label: 'ECTS', type: 'number', min: 0, step: 1, value: getCourseEctsValue(subModule) || 0 },
            ...getCourseSeatLimitFieldConfig(subModule),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: curriculumSummary, readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(subModule)
        ],
        onSave: (values, close) => {
            const number = String(values.number || '').trim();
            const name = String(values.name || '').trim();
            const ects = String(toPositiveInt(values.ects, getCourseEctsValue(subModule) || 0));
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);

            if (!number || !name) {
                alert('Please enter a course number and name.');
                return;
            }

            subModule.number = number;
            subModule.name = name;
            subModule.ects = ects;
            subModule.semesterRuleMode = restriction.semesterRuleMode;
            subModule.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(subModule, values);
            queueAdminRegistrationStateSave();
            close();
            renderAdminRegistrationModules('prog');
        }
    });
}

// TAB 2: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â£ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¤ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ (Free Credits) - Same layout as Prog Tab

function addConcGroup() {
    openStructuredFormModal({
        title: 'New Concentration Group',
        subtitle: 'Create a new concentration code and its first group.',
        submitLabel: 'Create Group',
        fields: [
            { name: 'concKey', label: 'Concentration Code', placeholder: 'e.g. conc1', value: '' },
            { name: 'groupName', label: 'Group Name', placeholder: 'e.g. Brand Management', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 30 }
        ],
        onSave: (values, close) => {
            const concKey = String(values.concKey || '').trim();
            const groupName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 30);

            if (!concKey || !groupName) {
                alert('Please fill in the concentration code and group name.');
                return;
            }

            const normalizedKey = concKey.toLowerCase();
            if (!concCourseData[normalizedKey]) concCourseData[normalizedKey] = {};
            if (concCourseData[normalizedKey][groupName]) {
                alert('That concentration group already exists in this code.');
                return;
            }
            concCourseData[normalizedKey][groupName] = { maxEcts, completedEcts: 0, courses: [] };
            queueAdminRegistrationStateSave();
            close();
            alert(`Concentration group "${groupName}" added successfully.`);
            renderAdminRegistrationModules('conc');
        }
    });
}

function deleteConcGroup(concKey, groupName) {
    if (!confirm(`Delete concentration group "${groupName}"?`)) return;
    
    delete concCourseData[concKey][groupName];
    queueAdminRegistrationStateSave();
    alert('Concentration group deleted successfully.');
    renderAdminRegistrationModules('conc');
}

function editConcGroup(concKey, groupName) {
    const group = concCourseData?.[concKey]?.[groupName];
    if (!group) return;

    openStructuredFormModal({
        title: 'Edit Concentration Group',
        subtitle: 'Update the group name and its credit target.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'groupName', label: 'Group Name', value: groupName, placeholder: 'Enter group name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: group.maxEcts || parseEctsProgress(group.ects || '30/0').max || 30 }
        ],
        onSave: (values, close) => {
            const newName = String(values.groupName || '').trim();
            const newMax = toPositiveInt(values.maxEcts, group.maxEcts || parseEctsProgress(group.ects || '30/0').max || 30);
            if (!newName) {
                alert('Please enter a group name.');
                return;
            }

            if (!concCourseData[concKey]) concCourseData[concKey] = {};
            if (newName !== groupName && concCourseData[concKey][newName]) {
                alert('Another concentration group already uses that name.');
                return;
            }
            const previous = concCourseData[concKey][groupName];
            delete concCourseData[concKey][groupName];
            concCourseData[concKey][newName] = {
                ...previous,
                maxEcts: newMax,
                completedEcts: Number(previous?.completedEcts || 0),
                courses: previous?.courses || []
            };
            queueAdminRegistrationStateSave();
            close();
            renderAdminRegistrationModules('conc');
        }
    });
}


function openProgramSubjectSelectionModal(programType, context) {
    // Wrapper to ensure concentration/minor uses the exact same modal engine
    // as "My Program" and "Free Credits".
    openCourseSelectionModal(null, null, { programType, context });
}

function addSubjectToConcGroup(concKey, groupName) {
    window.currentSubjectContext = { programName: concKey, groupName, programType: 'concentration' };
    openCourseSelectionModal(null, null, { programType: 'concentration', context: { programName: concKey, groupName } });
}

function removeConcCourse(concKey, groupName, courseIdx) {
    const courseName = concCourseData[concKey][groupName].courses[courseIdx].title;
    if (!confirm(`Delete course "${courseName}"?`)) return;
    
    concCourseData[concKey][groupName].courses.splice(courseIdx, 1);
    queueAdminRegistrationStateSave();
    alert('Subject deleted successfully.');
    renderAdminRegistrationModules('conc');
}

function editConcCourseName(concKey, groupName, courseIdx) {
    const course = concCourseData[concKey][groupName].courses[courseIdx];
    const currentTitle = course.title;
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    openStructuredFormModal({
        title: 'Edit Concentration Course',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'title', label: 'Course Title', value: currentTitle, placeholder: 'Enter course title' },
            ...getCourseSeatLimitFieldConfig(course),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: getAssignedCourseCurriculumSummary(course, currentFaculty), readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(course)
        ],
        onSave: (values, close) => {
            const newTitle = String(values.title || '').trim();
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);
            if (!newTitle) {
                alert('Please enter a course title.');
                return;
            }

            course.title = newTitle;
            course.semesterRuleMode = restriction.semesterRuleMode;
            course.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(course, values);
            queueAdminRegistrationStateSave();
            close();
            alert('Subject updated successfully.');
            renderAdminRegistrationModules('conc');
        }
    });
}

function cloneJson(value) {
    return JSON.parse(JSON.stringify(value));
}

function ensureRegistrationCmsFacultyIsolation() {
    if (KIU_STATE.adminProgramStructures && typeof KIU_STATE.adminProgramStructures === 'object') {
        Object.keys(KIU_STATE.adminProgramStructures).forEach((facKey) => {
            KIU_STATE.adminProgramStructures[facKey] = cloneJson(KIU_STATE.adminProgramStructures[facKey] || {});
        });
    }

    if (KIU_STATE.registrationCMSByFaculty && typeof KIU_STATE.registrationCMSByFaculty === 'object') {
        Object.keys(KIU_STATE.registrationCMSByFaculty).forEach((facKey) => {
            KIU_STATE.registrationCMSByFaculty[facKey] = cloneJson(KIU_STATE.registrationCMSByFaculty[facKey] || {});
        });
    }
}

// Concentration Course Data - With hierarchical structure (Concentration -> Course Groups -> Courses)
const DEFAULT_CONC_COURSE_DATA = {};

// Minor Programs Data - With hierarchical structure (Course Groups -> Individual Courses)
const DEFAULT_MINOR_PROGRAM_DATA = {};

function isLegacySampleConcData(data) {
    const keys = Object.keys(data || {});
    return keys.length > 0 && keys.every(key => /^conc\d+$/i.test(String(key)));
}

function isLegacySampleMinorData(data) {
    const keys = Object.keys(data || {});
    return keys.length > 0 && keys.every(key => /^Minor\d+_/i.test(String(key)));
}

function ensureFacultyRegistrationCmsData(faculty) {
    const fac = normalizeFacultyCode(faculty || getCurrentFaculty() || 'ECON', 'ECON');
    if (!KIU_STATE.registrationCMSByFaculty) KIU_STATE.registrationCMSByFaculty = {};
    let changed = false;

    if (!KIU_STATE.registrationCMSByFaculty[fac]) {
        const legacy = KIU_STATE.registrationCMS || {};
        const canMigrateLegacy =
            Object.keys(KIU_STATE.registrationCMSByFaculty).length === 0
            && legacy
            && (legacy.concCourseData || legacy.minorProgramData);
        KIU_STATE.registrationCMSByFaculty[fac] = {
            concCourseData: cloneJson(canMigrateLegacy ? (legacy.concCourseData || DEFAULT_CONC_COURSE_DATA) : DEFAULT_CONC_COURSE_DATA),
            minorProgramData: cloneJson(canMigrateLegacy ? (legacy.minorProgramData || DEFAULT_MINOR_PROGRAM_DATA) : DEFAULT_MINOR_PROGRAM_DATA),
            trackData: {},
            customTabs: [],
            builtinTabOverrides: {},
            hiddenBuiltinTabs: []
        };
        changed = true;
    }

    const bucket = KIU_STATE.registrationCMSByFaculty[fac];
    if (!bucket.trackData || typeof bucket.trackData !== 'object') {
        bucket.trackData = {};
        changed = true;
    }
    if (!Array.isArray(bucket.customTabs)) {
        bucket.customTabs = [];
        changed = true;
    }
    if (!bucket.builtinTabOverrides || typeof bucket.builtinTabOverrides !== 'object') {
        bucket.builtinTabOverrides = {};
        changed = true;
    }
    if (!Array.isArray(bucket.hiddenBuiltinTabs)) {
        bucket.hiddenBuiltinTabs = [];
        changed = true;
    }
    if (typeof migrateAdminRegistrationCmsToTrackModel === 'function') {
        migrateAdminRegistrationCmsToTrackModel(fac);
    }
    if (!bucket.concCourseData || typeof bucket.concCourseData !== 'object') {
        bucket.concCourseData = cloneJson(DEFAULT_CONC_COURSE_DATA);
        changed = true;
    }
    if (!bucket.minorProgramData || typeof bucket.minorProgramData !== 'object') {
        bucket.minorProgramData = cloneJson(DEFAULT_MINOR_PROGRAM_DATA);
        changed = true;
    }
    if (isLegacySampleConcData(bucket.concCourseData)) {
        bucket.concCourseData = {};
        changed = true;
    }
    if (isLegacySampleMinorData(bucket.minorProgramData)) {
        bucket.minorProgramData = {};
        changed = true;
    }
    if (changed) queueAdminRegistrationStateSave();
    return bucket;
}

function bindFacultyRegistrationCmsData(faculty) {
    const fac = resolveRegistrationCmsFaculty(faculty);
    const facultyChanged = Boolean(boundRegistrationCmsFaculty && boundRegistrationCmsFaculty !== fac);
    if (facultyChanged) {
        persistRegistrationCmsGlobalsToFaculty(boundRegistrationCmsFaculty);
        flushAdminRegistrationStateSave({ syncFaculty: false });
        ensureRegistrationCmsFacultyIsolation();
    }
    const bucket = ensureFacultyRegistrationCmsData(fac);
    if (typeof syncAdminRegTrackLegacyMirrors === 'function') {
        syncAdminRegTrackLegacyMirrors(bucket);
    } else {
        concCourseData = cloneJson(bucket.concCourseData || {});
        minorProgramData = cloneJson(bucket.minorProgramData || {});
    }
    const container = document.getElementById('admin-reg-content-container');
    if (container) container.dataset.cmsFaculty = fac;
    // Backward-compatible mirror key used by older code paths.
    KIU_STATE.registrationCMS = {
        concCourseData: cloneJson(bucket.concCourseData || {}),
        minorProgramData: cloneJson(bucket.minorProgramData || {}),
        trackData: bucket.trackData || {},
        customTabs: bucket.customTabs || [],
        builtinTabOverrides: bucket.builtinTabOverrides || {},
        hiddenBuiltinTabs: bucket.hiddenBuiltinTabs || [],
        faculty: fac
    };
    boundRegistrationCmsFaculty = fac;
    return bucket;
}

let concCourseData = {};
let minorProgramData = {};
if (KIU_STATE.adminProgramStructures) {
    KIU_STATE.adminProgramStructures = cloneJson(KIU_STATE.adminProgramStructures);
}
if (KIU_STATE.registrationCMSByFaculty) {
    KIU_STATE.registrationCMSByFaculty = cloneJson(KIU_STATE.registrationCMSByFaculty);
}
// Defer bindFacultyRegistrationCmsData until host defines resolveRegistrationCmsFaculty
// (admin-registration.js). Boot / renderAdminRegistrationModules bind after host loads.
window.addEventListener('beforeunload', () => {
    if (typeof flushAdminRegistrationStateSave === 'function') {
        flushAdminRegistrationStateSave();
    }
});
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && typeof flushAdminRegistrationStateSave === 'function') {
        flushAdminRegistrationStateSave();
    }
});

// TAB 4: ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚ÂºÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã¢â‚¬Â¹Ãƒâ€¦Ã¢â‚¬Å“ (Minor) - With dropdown and manage buttons
function renderMinorTab(container, modules, tabType) {
    const minorPrograms = Object.keys(minorProgramData);
    if (minorPrograms.length > 0) {
        if (!minorPrograms.includes(adminRegUiState.selectedMinorProgram)) {
            adminRegUiState.selectedMinorProgram = minorPrograms[0];
        }
    } else {
        adminRegUiState.selectedMinorProgram = null;
    }

    let html = `
        <div class="admin-reg-program-head admin-reg-program-head--large">
            <div class="admin-reg-program-head-main">
                <div class="admin-reg-program-head-title admin-reg-program-head-title--large">Minor</div>
                <div class="admin-reg-program-head-copy admin-reg-program-head-copy--large">Build minor programs with the same nested cards, editable ECTS targets, and grouped course lists.</div>
            </div>
            <button type="button" data-admin-reg-add-minor-program="1" class="lux-primary-btn admin-reg-program-add-btn admin-reg-program-add-btn--large"><i class="fas fa-plus"></i> Add Program</button>
        </div>
        <div class="admin-reg-program-layout admin-reg-program-layout--wide">
            <div class="admin-reg-program-list-shell lux-soft-chrome home-hover-chip">
                <div class="admin-reg-program-list-head">
                    <div class="admin-reg-program-list-title admin-reg-program-list-title--strong">Minor Programs</div>
                    <span class="admin-reg-program-list-count">${minorPrograms.length}</span>
                </div>
                <div data-preserve-scroll-key="admin-reg-minor-programs" class="admin-reg-program-list">
                    ${minorPrograms.length === 0 ? `<div class="admin-reg-program-list-placeholder lux-empty-state">No minor programs yet</div>` : minorPrograms.map(program => {
                        const checkedAttr = program === adminRegUiState.selectedMinorProgram ? 'checked' : '';
                        return `
                            <label class="admin-reg-program-option admin-reg-program-option--wide${program === adminRegUiState.selectedMinorProgram ? ' is-active' : ''}">
                                <span class="admin-reg-program-option-row">
                                    <input type="radio" name="minor-program" value="${program}" ${checkedAttr} data-admin-reg-select-minor-program="${escapeHtml(program)}" class="admin-reg-program-option-input">
                                    <span class="admin-reg-program-option-title">${program}</span>
                                </span>
                                <button type="button" data-admin-reg-delete-minor-program="${escapeHtml(program)}" class="lux-ghost-btn admin-reg-program-subject-btn admin-reg-program-subject-btn--danger"><i class="fas fa-trash"></i></button>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
            <div id="minor-program-pane">
                <!-- Program cards render here -->
            </div>
        </div>
    `;
    container.innerHTML = localizeHtmlMarkup(html);
    renderMinorProgramPane();
}

function renderMinorProgramPane() {
    const pane = document.getElementById('minor-program-pane');
    const selected = adminRegUiState.selectedMinorProgram;
    if (!pane) return;
    if (!selected || !minorProgramData[selected]) {
        pane.innerHTML = buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-diagram-project',
            title: 'Select a minor program',
            copy: 'Choose a minor program to manage its subject groups.',
            classes: 'admin-reg-program-pane-empty'
        });
        return;
    }

    const program = minorProgramData[selected];
    const courseGroups = program.courseGroups || {};
    const groupNames = Object.keys(courseGroups);
    let html = `
        <div class="admin-reg-track-head">
            <div>
                <div class="admin-reg-track-head-title">${selected}</div>
                <div class="admin-reg-track-head-copy">Minor Program Subjects</div>
            </div>
            <button id="minor-add-course-btn" type="button" data-admin-reg-add-minor-group="${escapeHtml(selected)}" class="lux-primary-btn admin-reg-track-add-btn"><i class="fas fa-plus"></i> Add Group</button>
        </div>
        <div class="admin-reg-track-groups">
    `;

    if (groupNames.length === 0) {
        html += buildAdminRegEmptyStateMarkup({
            icon: 'fas fa-layer-group',
            title: 'No subject groups added yet',
            copy: 'Create the first group to start assigning subjects in this minor program.',
            classes: 'admin-reg-track-empty'
        });
    } else {
        groupNames.forEach((groupName, groupIdx) => {
            const group = courseGroups[groupName] || {};
            const groupKey = `minor:${selected}|${groupName}`;
            const isExpanded = expandedModules.has(groupKey);
            const progress = getTrackGroupProgress(group);
            const courses = group.courses || [];
            html += `
                <div class="admin-reg-track-group-card">
                    <div class="admin-reg-track-group-toggle" data-admin-reg-toggle-minor-group="${escapeHtml(groupKey)}">
                        <i class="fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'} admin-reg-track-group-chevron"></i>
                        <div class="admin-reg-track-group-main">
                            <div class="admin-reg-track-group-title">${groupName}</div>
                            <div class="admin-reg-track-group-copy">${selected}</div>
                        </div>
                        <div class="admin-reg-track-group-progress">ECTS: ${progress.label}</div>
                        <div class="admin-reg-track-group-actions">
                            <button type="button" data-admin-reg-edit-minor-group="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="lux-ghost-btn admin-reg-track-group-btn"><i class="fas fa-edit"></i></button>
                            <button type="button" data-admin-reg-delete-minor-group="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="lux-ghost-btn admin-reg-track-group-btn admin-reg-track-group-btn--danger"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    ${isExpanded ? `
                        <div class="admin-reg-track-group-body">
                            <div class="admin-reg-track-subject-head">
                                <div class="admin-reg-track-subject-head-number">#</div>
                                <div class="admin-reg-track-subject-head-title">Subject Title / Module Title</div>
                                <div class="admin-reg-track-subject-head-ects">ECTS</div>
                                <div class="admin-reg-track-subject-head-meta">Precondition / Anti-condition</div>
                                <div class="admin-reg-track-subject-head-actions"></div>
                            </div>
                            <div class="admin-reg-track-subject-list">
                                ${(courses.length === 0 ? `
                                    <div class="admin-reg-track-subject-empty">No subjects assigned</div>
                                ` : courses.map((course, idx) => `
                                    <div class="admin-reg-track-subject-row">
                                        <div class="admin-reg-track-subject-number">${course.n || idx + 1}</div>
                                        <div class="admin-reg-track-subject-main">
                                            <div class="admin-reg-track-subject-title">${course.title}</div>
                                            <div class="admin-reg-track-subject-code">${course.n || ''}</div>
                                        </div>
                                        <div class="admin-reg-track-subject-ects">${course.ects || '0'}</div>
                                        <div class="admin-reg-track-subject-details">
                                            <div>${escapeHtml(`Prerequisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).prerequisite}`)}</div>
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite ? `<div class="admin-reg-track-subject-detail">${escapeHtml(`Anti-requisite: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).antiRequisite}`)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--semester">${escapeHtml(getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).curriculumSemester)}</div>` : ''}
                                            ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess ? `<div class="admin-reg-track-subject-detail admin-reg-track-subject-detail--access">${escapeHtml(`Student access: ${getAssignedCourseCurriculumDetails(course, getAdminRegistrationFaculty()).studentAccess}`)}</div>` : ''}
                                        </div>
                                        <div class="admin-reg-track-subject-actions">
                                            <button type="button" data-admin-reg-edit-minor-course="${idx}" data-admin-reg-minor-program="${escapeHtml(selected)}" data-admin-reg-minor-group="${escapeHtml(groupName)}" class="lux-ghost-btn admin-reg-track-subject-btn"><i class="fas fa-edit"></i></button>
                                        </div>
                                    </div>
                                `).join(''))}
                            </div>
                            <div class="admin-reg-track-group-footer">
                                <button type="button" data-admin-reg-add-minor-subject="${escapeHtml(groupName)}" data-admin-reg-minor-program="${escapeHtml(selected)}" class="lux-primary-btn admin-reg-track-group-add-subject"><i class="fas fa-plus"></i> Add Subject</button>
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
    }

    html += `</div>`;
    pane.innerHTML = localizeHtmlMarkup(html);

}

function addMinorProgram() {
    openStructuredFormModal({
        title: 'New Minor Program',
        subtitle: 'Create a new minor program container.',
        submitLabel: 'Create Program',
        fields: [
            { name: 'programName', label: 'Program Name', placeholder: 'e.g. Minor1_Data Science', value: '' }
        ],
        onSave: (values, close) => {
            const newName = String(values.programName || '').trim();
            if (!newName) {
                alert('Please enter a program name.');
                return;
            }
            if (minorProgramData[newName]) {
                alert('This minor program already exists!');
                return;
            }

            minorProgramData[newName] = { courseGroups: {} };
            queueAdminRegistrationStateSave();
            close();
            alert(`"${newName}" added successfully.`);
            renderAdminRegistrationModules('minor');
        }
    });
}

function deleteMinorProgram(programName) {
    if (!confirm(`Delete "${programName}"?`)) return;
    
    delete minorProgramData[programName];
    queueAdminRegistrationStateSave();
    alert(`"${programName}" deleted successfully.`);
    renderAdminRegistrationModules('minor');
}

function updateMinorTable() {
    const selected = document.querySelector('input[name="minor-program"]:checked');
    if (selected && minorProgramData[selected.value]) {
        adminRegUiState.selectedMinorProgram = selected.value;
        renderMinorProgramPane();
    }
}

function addCourseGroupToMinor(programName) {
    openStructuredFormModal({
        title: 'New Minor Course Group',
        subtitle: 'Add a course group inside the selected minor program.',
        submitLabel: 'Create Group',
        fields: [
            { name: 'groupName', label: 'Group Name', placeholder: 'e.g. A (101) Foundation', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 12 }
        ],
        onSave: (values, close) => {
            const groupName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 12);
            if (!groupName) {
                alert('Please enter a course group name.');
                return;
            }

            if (!minorProgramData[programName].courseGroups) {
                minorProgramData[programName].courseGroups = {};
            }
            if (minorProgramData[programName].courseGroups[groupName]) {
                alert('That course group already exists in this minor program.');
                return;
            }

            minorProgramData[programName].courseGroups[groupName] = {
                maxEcts,
                completedEcts: 0,
                ects: `${maxEcts}/0`,
                courses: []
            };
            queueAdminRegistrationStateSave();
            close();
            alert(`Subject group "${groupName}" added successfully.`);
            renderAdminRegistrationModules('minor');
        }
    });
}

function deleteMinorCourseGroup(programName, groupName) {
    if (!confirm(`Delete course group "${groupName}"?`)) return;
    
    delete minorProgramData[programName].courseGroups[groupName];
    queueAdminRegistrationStateSave();
    alert('Subject group deleted successfully.');
    renderAdminRegistrationModules('minor');
}

function editMinorCourseGroup(programName, groupName) {
    const group = minorProgramData?.[programName]?.courseGroups?.[groupName];
    if (!group) return;

    openStructuredFormModal({
        title: 'Edit Minor Group',
        subtitle: 'Update the group title and ECTS target.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'groupName', label: 'Group Name', value: groupName, placeholder: 'Enter group name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: group.maxEcts || parseEctsProgress(group.ects || '12/0').max || 12 }
        ],
        onSave: (values, close) => {
            const newName = String(values.groupName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, group.maxEcts || parseEctsProgress(group.ects || '12/0').max || 12);
            if (!newName) {
                alert('Please enter a course group name.');
                return;
            }

            if (newName !== groupName && minorProgramData[programName].courseGroups[newName]) {
                alert('Another minor group already uses that name.');
                return;
            }
            const previous = minorProgramData[programName].courseGroups[groupName];
            delete minorProgramData[programName].courseGroups[groupName];
            minorProgramData[programName].courseGroups[newName] = {
                ...previous,
                maxEcts,
                completedEcts: Number(previous?.completedEcts || 0),
                ects: `${maxEcts}/${Number(previous?.completedEcts || 0)}`
            };
            queueAdminRegistrationStateSave();
            close();
            renderAdminRegistrationModules('minor');
        }
    });
}

function addSubjectToGroup(programName, groupName) {
    const programType = adminRegActiveTab === 'conc' ? 'concentration' : 'minor';
    window.currentSubjectContext = { programName, groupName, programType };
    openCourseSelectionModal(null, null, { programType, context: { programName, groupName } });
}

function getSelectableCurriculumCoursesForPrograms() {
    const facultyProfiles = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {};
    return Object.keys(facultyProfiles).flatMap(facultyCode => {
        const curriculum = Array.isArray(getActiveCurriculum(facultyCode)) ? getActiveCurriculum(facultyCode) : [];
        return curriculum.map(course => ({
            code: course?.id || course?.code || '',
            title: course?.name || course?.title || '',
            ects: Number(course?.ects || 0),
            faculty: course?.faculty || facultyCode,
            precondition: course?.cond || course?.precondition || ''
        })).filter(course => course.code && course.title);
    });
}

function loadAvailableSubjects() {
    // Legacy concentration/minor picker removed.
    // The live admin-tools route uses openCourseSelectionModal(...).
}

function editMinorCourse(programName, groupName, courseIdx) {
    const course = minorProgramData[programName].courseGroups[groupName].courses[courseIdx];
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    openStructuredFormModal({
        title: 'Edit Minor Course',
        subtitle: 'Curriculum Library controls prerequisite and related metadata. You can manage student access here.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'title', label: 'Course Title', value: course.title, placeholder: 'Enter course title' },
            ...getCourseSeatLimitFieldConfig(course),
            { name: 'curriculumInfo', label: 'Curriculum Library Info', type: 'textarea', rows: 4, value: getAssignedCourseCurriculumSummary(course, currentFaculty), readonly: true, help: 'This information comes directly from Curriculum Library.' },
            ...getSemesterRestrictionFieldConfig(course)
        ],
        onSave: (values, close) => {
            const newTitle = String(values.title || '').trim();
            const restriction = normalizeAssignedSemesterRestriction(values.semesterRuleMode, values.allowedSemesters);
            if (!newTitle) {
                alert('Please enter a course title.');
                return;
            }

            course.title = newTitle;
            course.semesterRuleMode = restriction.semesterRuleMode;
            course.allowedSemesters = restriction.allowedSemesters;
            applyAssignedCourseSeatDefaults(course, values);
            queueAdminRegistrationStateSave();
            close();
            alert('Subject updated successfully.');
            renderAdminRegistrationModules('minor');
        }
    });
}

// TOGGLE: Expand/collapse module to show courses
function toggleAdminRegModule(moduleId) {
    if (expandedModules.has(moduleId)) {
        expandedModules.delete(moduleId);
    } else {
        expandedModules.add(moduleId);
    }
    const tabConfig = typeof resolveAdminRegTab === 'function'
        ? resolveAdminRegTab(adminRegActiveTab)
        : null;
    if (tabConfig && typeof renderAdminRegTrackProgramPane === 'function') {
        renderAdminRegTrackProgramPane(adminRegActiveTab, tabConfig);
        return;
    }
    renderAdminRegistrationModules(adminRegActiveTab);
}

// EDIT: Open modal to edit module properties
function editAdminRegModule(moduleId) {
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[adminRegActiveTab] || [];
    const module = modules.find(m => m.id === moduleId);
    if (!module) return;

    openStructuredFormModal({
        title: 'Edit Module',
        subtitle: 'Change the module name and maximum credit limit.',
        submitLabel: 'Save Changes',
        fields: [
            { name: 'moduleName', label: 'Module Name', value: module.name, placeholder: 'Enter module name' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: module.maxEcts }
        ],
        onSave: (values, close) => {
            const newName = String(values.moduleName || '').trim();
            const newMaxEcts = toPositiveInt(values.maxEcts, module.maxEcts || 0);
            if (!newName) {
                alert('Please enter a module name.');
                return;
            }

            module.name = newName;
            module.maxEcts = newMaxEcts;
            module.minEcts = Number.isFinite(Number(module.minEcts)) ? module.minEcts : 0;

            queueAdminRegistrationStateSave();
            close();
            renderAdminRegistrationModules(adminRegActiveTab);
            alert('Module updated.');
        }
    });
}

// DELETE: Remove a module from the structure
function deleteAdminRegModule(moduleId, tabType) {
    if (!confirm('Are you sure you want to delete this module?')) return;
    
    const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
    const facultyStructures = KIU_STATE.adminProgramStructures[currentFaculty] || {};
    const modules = facultyStructures[tabType] || [];
    const idx = modules.findIndex(m => m.id === moduleId);
    if (idx !== -1) {
        modules.splice(idx, 1);
        flushAdminRegistrationStateSave();
        renderAdminRegistrationModules(tabType);
        alert('Module removed.');
    }
}

// ADD NEW: Create a new module/block
function addNewAdminRegModule(tabType) {
    const safeTab = String(tabType || 'prog').trim();
    if (typeof addTrackProgram === 'function' && (safeTab === 'prog' || safeTab === 'free')) {
        addTrackProgram(safeTab);
        return;
    }
    openStructuredFormModal({
        title: 'Create New Module',
        subtitle: 'Use this form to add a polished module card without the old browser popup.',
        submitLabel: 'Create Module',
        fields: [
            { name: 'moduleName', label: 'Module Name', placeholder: 'e.g. Additional Topics', value: '' },
            { name: 'maxEcts', label: 'Maximum ECTS', type: 'number', min: 0, step: 1, value: 15 }
        ],
        onSave: (values, close) => {
            const moduleName = String(values.moduleName || '').trim();
            const maxEcts = toPositiveInt(values.maxEcts, 15);
            if (!moduleName) {
                alert('Please enter a module name.');
                return;
            }

            const currentFaculty = normalizeFacultyCode(getAdminRegistrationFaculty(), 'ECON');
            if (!KIU_STATE.adminProgramStructures[currentFaculty]) {
                KIU_STATE.adminProgramStructures[currentFaculty] = {};
            }
            if (!KIU_STATE.adminProgramStructures[currentFaculty][tabType]) {
                KIU_STATE.adminProgramStructures[currentFaculty][tabType] = [];
            }

            const newModule = {
                id: `M-${Date.now()}`,
                name: moduleName,
                minEcts: 0,
                maxEcts: maxEcts,
                letter: String.fromCharCode(65 + (KIU_STATE.adminProgramStructures[currentFaculty][tabType].length % 26)),
                subModules: [],
                required: false
            };

            KIU_STATE.adminProgramStructures[currentFaculty][tabType].push(newModule);
            flushAdminRegistrationStateSave();
            const syncPromise = typeof flushPortalStateSync === 'function'
                ? flushPortalStateSync()
                : Promise.resolve();
            close();
            renderAdminRegistrationModules(tabType);
            syncPromise.catch(() => null);
            alert('New module created.');
        }
    });
}

function getAdminRegistrationAssignmentTargetLabel(module, programType, programContext) {
    if (programType) {
        return programContext?.groupName || programContext?.programName || 'selected group';
    }
    return module?.name || 'selected module';
}

function getAdminRegistrationFacultyOptions() {
    const profiles = KIU_STATE.facultyProfiles || KIU_EMPTY_STATE.facultyProfiles || {};
    return Object.keys(profiles).map(code => ({
        value: code,
        label: getFacultyLabel(code)
    }));
}

function doesAdminRegistrationSubjectExist(subjectId) {
    const toKey = (value) => {
        if (typeof canonicalCourseKey === 'function') return canonicalCourseKey(value);
        return String(value || '').trim().toUpperCase();
    };
    const targetKey = toKey(subjectId);
    const subjects = typeof getAllCurriculumSubjects === 'function'
        ? getAllCurriculumSubjects()
        : (KIU_STATE.curriculum || []);
    return subjects.some(subject => toKey(subject?.id) === targetKey);
}

function buildAdminRegistrationSubjectId(faculty, semester, rawCode = '') {
    const normalizedCode = String(rawCode || '').trim().toUpperCase().replace(/\s+/g, '-');
    if (normalizedCode) return normalizedCode;

    let sequence = Math.floor(Math.random() * 900) + 100;
    let candidate = `${faculty}-S${semester}-${sequence}`;
    while (doesAdminRegistrationSubjectExist(candidate)) {
        sequence = Math.floor(Math.random() * 900) + 100;
        candidate = `${faculty}-S${semester}-${sequence}`;
    }
    return candidate;
}


        const api = {
            renderAdminRegistrationModules,
            buildAdminRegEmptyStateMarkup,
            renderProgTab,
            renderProgModulePane,
            selectProgModule,
            editProgSubModule,
            addConcGroup,
            deleteConcGroup,
            editConcGroup,
            openProgramSubjectSelectionModal,
            addSubjectToConcGroup,
            removeConcCourse,
            editConcCourseName,
            cloneJson,
            ensureRegistrationCmsFacultyIsolation,
            isLegacySampleConcData,
            isLegacySampleMinorData,
            ensureFacultyRegistrationCmsData,
            bindFacultyRegistrationCmsData,
            renderMinorTab,
            renderMinorProgramPane,
            addMinorProgram,
            deleteMinorProgram,
            updateMinorTable,
            addCourseGroupToMinor,
            deleteMinorCourseGroup,
            editMinorCourseGroup,
            addSubjectToGroup,
            getSelectableCurriculumCoursesForPrograms,
            loadAvailableSubjects,
            editMinorCourse,
            toggleAdminRegModule,
            editAdminRegModule,
            deleteAdminRegModule,
            addNewAdminRegModule,
            getAdminRegistrationAssignmentTargetLabel,
            getAdminRegistrationFacultyOptions,
            doesAdminRegistrationSubjectExist,
            buildAdminRegistrationSubjectId,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateAdminRegistrationCmsApi({});
})();
