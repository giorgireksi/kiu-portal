    /* Route-owned admin tools runtime extracted from the registered bundle.
       Keep this file as the editable source and regenerate index-admin-tools.js after changes. */

    function ensureAdminToolsPage() {
        let page = document.getElementById('page-admin-tools');
        if (!page) {
            const appContent = document.getElementById('app-content');
            if (!appContent) return null;
            page = document.createElement('div');
            page.id = 'page-admin-tools';
            page.className = 'page-section';
            page.hidden = true;
            appContent.appendChild(page);
        }
        let shell = document.getElementById('lux-admin-tools-shell');
        if (!shell) {
            shell = document.createElement('div');
            shell.id = 'lux-admin-tools-shell';
            page.appendChild(shell);
        }
        return shell;
    }

    function queueAdminToolsFocus(focus) {
        if (!focus) return;
        localStorage.setItem('KIU_ADMIN_TOOLS_FOCUS', focus);
    }

    function consumeAdminToolsFocus() {
        const focus = localStorage.getItem('KIU_ADMIN_TOOLS_FOCUS') || '';
        if (focus) localStorage.removeItem('KIU_ADMIN_TOOLS_FOCUS');
        return focus;
    }

    function canRenderLuxuryAdminToolsWorkspace() {
        if (typeof getNavigationAuthRole === 'function' && getNavigationAuthRole() === 'admin') return true;
        if (typeof userHasPortalPrivilegeForAuthUser === 'function') {
            return userHasPortalPrivilegeForAuthUser('access_admin_tools');
        }
        return typeof getEffectiveRole === 'function' && getEffectiveRole() === 'admin';
    }

    renderLuxuryAdminToolsPage = function renderLuxuryAdminToolsPage() {
        const shell = ensureAdminToolsPage();
        if (!shell) return;
        if (!canRenderLuxuryAdminToolsWorkspace() && !shell.dataset.rendered) return;
        // STABILITY FIX: Relaxed the missingCriticalWorkspace check. 
        // Wiping the entire shell.innerHTML leads to severe flickering and event handler loss.
        // Individual components now handle their own missing containers gracefully.
        const missingCriticalWorkspace = !shell.querySelector('#admin-reg-content-container');
        if (shell.dataset.rendered && missingCriticalWorkspace) {
            console.warn('[Luxury] Admin tools container missing, forcing re-render.');
            shell.dataset.rendered = '';
        }


        if (!shell.dataset.rendered) {
            shell.innerHTML = `
                <div class="lux-admin-tools-page">
                    <!-- TWO-COLUMN: Curriculum Library + Builder -->
                    <div class="lux-home-columns">
                        <!-- LEFT: Curriculum Library -->
                        <section class="lux-panel">
                            <div class="lux-card-head">
                                <div>
                                    <div class="lux-card-title">Curriculum Library</div>
                                    <div class="lux-card-meta">Browse and organize subjects by module.</div>
                                </div>
                                <button class="lux-secondary-btn lux-admin-tools-head-action" type="button" data-admin-tools-add-module="1">
                                    <i class="fas fa-layer-group"></i>
                                    Add Module
                                </button>
                            </div>
                            <div id="curriculum-library-modules-root" class="lux-admin-tools-block-top"></div>
                        </section>

                        <!-- RIGHT: Curriculum Subject Builder -->
                        <section class="lux-panel" id="curriculum-subject-builder-card">
                            <div class="lux-card-head">
                                <div class="lux-card-title">Add Subject</div>
                                <div class="lux-card-meta">Create a new course for the active faculty.</div>
                            </div>
                            <div class="lux-scrollbar lux-admin-tools-builder-body">
                                <div class="lux-admin-tools-builder-section" data-builder-section="target">
                                    <div id="curriculum-form-module-target" class="lux-pill lux-admin-tools-target-pill"><i class="fas fa-layer-group lux-admin-tools-target-pill-icon"></i> Target: Loading...</div>
                                    <div id="curriculum-form-module-help" class="lux-card-meta lux-admin-tools-target-help">Loading...</div>
                                </div>
                                <div class="lux-admin-tools-builder-section" data-builder-section="basics">
                                    <div class="lux-admin-tools-builder-section-head">
                                        <span class="lux-admin-tools-builder-section-title"><i class="fas fa-book-open"></i> Course basics</span>
                                        <span class="lux-admin-tools-builder-section-meta">Name, code, credits, and semesters</span>
                                    </div>
                                    <div class="lux-field-grid lux-admin-tools-field-grid">
                                        <input id="new-subject-name" name="new_subject_name" type="text" class="lux-control" placeholder="Course name">
                                        <input id="new-subject-code-preview" name="new_subject_code_preview" type="text" class="lux-control" placeholder="Code (auto or custom)">
                                        <input id="new-subject-ects" name="new_subject_ects" type="number" class="lux-control" value="6" min="1" placeholder="ECTS credits">
                                        <div class="lux-semester-picker-field lux-picker-field lux-admin-tools-semester-field" id="new-subject-semester-picker">
                                            <div class="lux-admin-tools-semester-head">
                                                <div class="lux-admin-tools-semester-copy">
                                                    <div class="lux-admin-tools-semester-label">Semesters offered</div>
                                                    <p class="lux-admin-tools-semester-hint" id="new-subject-semester-mode-hint" aria-live="polite">One semester — each selection replaces the current choice.</p>
                                                </div>
                                                <div class="lux-semester-mode-segment" role="group" aria-label="Semester selection mode">
                                                    <button type="button" class="lux-semester-mode-segment__btn is-active" id="new-subject-semester-mode-single" data-semester-mode="replace" aria-pressed="true">Single</button>
                                                    <button type="button" class="lux-semester-mode-segment__btn" id="new-subject-semester-mode-multiple" data-semester-mode="add" aria-pressed="false">Multiple</button>
                                                </div>
                                            </div>
                                            <div class="lux-semester-chip-tray" id="new-subject-semesters-tray" aria-label="Selected semesters"></div>
                                            <button type="button" class="lux-picker-btn lux-universal-picker-btn" id="new-subject-semester-lux-btn" aria-haspopup="listbox" aria-expanded="false">
                                                <div class="lux-picker-copy">
                                                    <span class="lux-picker-caption">Select semester</span>
                                                    <strong class="lux-picker-value" id="new-subject-semester-lux-value">Semester 1</strong>
                                                </div>
                                                <i class="fas fa-chevron-down" aria-hidden="true"></i>
                                            </button>
                                            <div class="lux-semester-scroll-panel" id="new-subject-semester-lux-panel" role="listbox" aria-hidden="true" hidden>
                                                <div class="lux-scrollbar lux-semester-scroll-list" id="new-subject-semester-scroll-list"></div>
                                            </div>
                                            <input type="hidden" id="new-subject-semesters" name="new_subject_semesters" value="[1]">
                                        </div>
                                    </div>
                                </div>
                                <div class="lux-admin-tools-builder-section" data-builder-section="prerequisites">
                                    <div class="lux-admin-tools-builder-section-head">
                                        <span class="lux-admin-tools-builder-section-title"><i class="fas fa-link"></i> Prerequisites</span>
                                        <span class="lux-admin-tools-builder-section-meta">Optional course requirements</span>
                                    </div>
                                    <input id="subject-search-input" name="subject_search_input" type="text" class="lux-control lux-admin-tools-prereq-search" placeholder="Search for a prerequisite course..." data-admin-tools-prereq-search="1">
                                    <div id="subject-search-results" class="lux-list lux-admin-tools-prereq-results" hidden></div>
                                    <label class="lux-admin-tools-condition-toggle">
                                        <input id="has-condition-checkbox" name="has_condition_checkbox" type="checkbox" data-admin-tools-toggle-condition="1">
                                        Require a prerequisite course
                                    </label>
                                    <div id="condition-box-container" class="lux-admin-tools-condition-box" hidden>
                                        <div id="selected-condition-badge" class="lux-pill lux-admin-tools-condition-badge" data-value="None" hidden>
                                            <span id="selected-condition-text"></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="lux-admin-tools-builder-section" data-builder-section="antirequisites">
                                    <div id="new-subject-antireq-picker"></div>
                                    <input type="hidden" id="new-subject-antireq" name="new_subject_antireq" value="">
                                </div>
                                <div class="lux-admin-tools-builder-section" data-builder-section="availability">
                                    <div class="lux-admin-tools-builder-section-head">
                                        <span class="lux-admin-tools-builder-section-title"><i class="fas fa-calendar-check"></i> Availability</span>
                                        <span class="lux-admin-tools-builder-section-meta">Odd/even semester visibility</span>
                                    </div>
                                    <div id="new-subject-semester-parity-hint" class="lux-card-meta lux-admin-tools-parity-hint lux-admin-tools-parity-callout"></div>
                                </div>
                            </div>
                            <div class="lux-admin-tools-submit-row">
                                <button class="lux-primary-btn" id="save-curriculum-subject-btn" type="button" data-admin-tools-save-subject="1"><i class="fas fa-plus"></i> Save Subject</button>
                            </div>
                        </section>
                    </div>
                    <section class="lux-panel lux-admin-tools-registration-panel">
                        <div class="lux-card-head lux-actions-between lux-admin-tools-registration-panel-head">
                            <div>
                                <div class="lux-card-title">Registration Setup</div>
                                <div class="lux-card-meta">Configure program modules, electives, and specializations.</div>
                            </div>
                            <div class="lux-admin-tools-registration-head-actions" data-admin-reg-panel-head-actions hidden></div>
                        </div>
                        <div class="lux-admin-tools-reg-tabs" data-admin-reg-tab-bar></div>
                        <div id="admin-reg-content-container" class="lux-admin-tools-registration-content"></div>
                    </section>
                </div>
            `;
            shell.dataset.rendered = '1';
            shell.dataset.workspaceReady = '';
            shell.dataset.workspaceFaculty = '';
            shell.dataset.cmsRevision = '';
        }

        shell.querySelectorAll('[data-nav-target]').forEach((button) => {
            if (button.dataset.bound) return;
            button.addEventListener('click', () => {
                if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
            });
            button.dataset.bound = '1';
        });

        shell.querySelectorAll('[data-admin-provision]').forEach((button) => {
            if (button.dataset.bound) return;
            button.addEventListener('click', () => {
                if (typeof openUnifiedAdminProvision === 'function') {
                    openUnifiedAdminProvision(button.dataset.adminProvision);
                }
            });
            button.dataset.bound = '1';
        });

        const addModuleButton = shell.querySelector('[data-admin-tools-add-module]');
        if (addModuleButton && !addModuleButton.dataset.bound) {
            addModuleButton.addEventListener('click', () => {
                const registrationContainer = document.getElementById('admin-reg-content-container');
                if (registrationContainer && typeof addNewAdminRegModule === 'function') {
                    addNewAdminRegModule('prog');
                    registrationContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    return;
                }
                if (typeof addCurriculumLibraryModule === 'function') addCurriculumLibraryModule();
            });
            addModuleButton.dataset.bound = '1';
        }

        const prerequisiteSearchInput = shell.querySelector('[data-admin-tools-prereq-search]');
        if (prerequisiteSearchInput && !prerequisiteSearchInput.dataset.bound) {
            prerequisiteSearchInput.addEventListener('input', (event) => {
                if (typeof debouncedFilterSubjects === 'function') {
                    debouncedFilterSubjects(event.target.value);
                }
            });
            prerequisiteSearchInput.dataset.bound = '1';
        }

        const toggleConditionCheckbox = shell.querySelector('[data-admin-tools-toggle-condition]');
        if (toggleConditionCheckbox && !toggleConditionCheckbox.dataset.bound) {
            toggleConditionCheckbox.addEventListener('change', () => {
                if (typeof toggleConditionBox === 'function') toggleConditionBox();
            });
            toggleConditionCheckbox.dataset.bound = '1';
        }

        const saveSubjectButton = shell.querySelector('[data-admin-tools-save-subject]');
        if (saveSubjectButton && !saveSubjectButton.dataset.bound) {
            saveSubjectButton.addEventListener('click', () => {
                if (typeof addSubjectToSystem === 'function') addSubjectToSystem();
            });
            saveSubjectButton.dataset.bound = '1';
        }

        if (typeof renderAdminRegTabBar === 'function') {
            renderAdminRegTabBar(adminRegActiveTab || 'prog');
        }

        syncCurriculumSubjectBuilderTarget(getCurrentFaculty());
        if (typeof populateAntiReqDropdown === 'function') populateAntiReqDropdown();
        if (typeof initCurriculumSemesterPicker === 'function') {
            initCurriculumSemesterPicker({
                onChange: () => {
                    if (typeof ensureSubjectSemesterParityHint === 'function') ensureSubjectSemesterParityHint();
                    if (typeof updateSubjectCodePreview === 'function') updateSubjectCodePreview();
                }
            });
        }
        if (typeof initCurriculumLibraryRowScroll === 'function') initCurriculumLibraryRowScroll(shell);
        if (typeof ensureSubjectSemesterParityHint === 'function') ensureSubjectSemesterParityHint();

        const currentFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
        const cmsRevision = String((typeof KIU_STATE !== 'undefined' && KIU_STATE?.meta?.registrationCmsRevision) || 0);
        const refreshRegistrationWorkspace = () => {
            if (typeof renderCurriculumTable === 'function') renderCurriculumTable();
            if (typeof bootAdminRegistrationCms === 'function') {
                bootAdminRegistrationCms(adminRegActiveTab || 'prog', { force: true });
            }
            if (typeof resetAdminRegistrationCmsDelegates === 'function') resetAdminRegistrationCmsDelegates();
            if (typeof bindAdminRegistrationCmsDelegates === 'function') bindAdminRegistrationCmsDelegates();
            shell.dataset.workspaceReady = '1';
            shell.dataset.workspaceFaculty = currentFaculty;
            shell.dataset.cmsRevision = cmsRevision;
        };
        const registrationContainer = document.getElementById('admin-reg-content-container');
        const curriculumModulesRoot = document.getElementById('curriculum-library-modules-root');
        const shouldRefreshRegistrationWorkspace =
            shell.dataset.workspaceReady !== '1'
            || shell.dataset.workspaceFaculty !== currentFaculty
            || shell.dataset.cmsRevision !== cmsRevision
            || !registrationContainer
            || !curriculumModulesRoot
            || !registrationContainer.hasChildNodes()
            || !curriculumModulesRoot.hasChildNodes();

        if (!shouldRefreshRegistrationWorkspace) {
            shell.dataset.workspaceFaculty = currentFaculty;
        } else if (typeof renderCurriculumTable === 'function' && typeof bootAdminRegistrationCms === 'function') {
            refreshRegistrationWorkspace();
        } else if (typeof ensurePortalRegistrationRuntimeLoaded === 'function') {
            ensurePortalRegistrationRuntimeLoaded().then((loaded) => {
                if (!loaded) return;
                refreshRegistrationWorkspace();
            });
        } else {
            refreshRegistrationWorkspace();
        }

        const focus = consumeAdminToolsFocus();
        if (focus === 'curriculum') {
            document.getElementById('curriculum-subject-builder-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (focus === 'registration') {
            document.getElementById('admin-reg-content-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
