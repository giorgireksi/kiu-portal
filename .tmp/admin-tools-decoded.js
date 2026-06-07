    function ensureAdminToolsPage() {
        let page = document.getElementById('page-admin-tools');
        if (!page) {
            const appContent = document.getElementById('app-content');
            if (!appContent) return null;
            page = document.createElement('div');
            page.id = 'page-admin-tools';
            page.className = 'page-section';
            page.style.display = 'none';
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

    const ADMIN_TESTING_ROOT_ID = 'admin-testing-accounts-root';

    function ensureAdminTestingRuntime() {
        const facultyCode = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
        const runtime = window.__KIU_ADMIN_TESTING_RUNTIME = window.__KIU_ADMIN_TESTING_RUNTIME || {
            facultyCode,
            personas: [],
            error: '',
            ready: false
        };
        runtime.facultyCode = facultyCode;
        try {
            runtime.personas = typeof getAdminTestingPersonas === 'function'
                ? getAdminTestingPersonas(facultyCode)
                : [];
            runtime.error = '';
            runtime.ready = true;
        } catch (error) {
            runtime.personas = [];
            runtime.error = error?.message || 'Testing personas could not be prepared.';
        }
        return runtime;
    }

    function getAdminTestingRoleLabel(role = '') {
        switch (String(role || '').trim().toLowerCase()) {
            case 'professor': return 'Professor';
            case 'ta': return 'Teaching Assistant';
            case 'student_service': return 'Student Service';
            case 'student': return 'Student';
            default: return 'Testing Persona';
        }
    }

    function renderAdminTestingAccountsPanel() {
        const root = document.getElementById(ADMIN_TESTING_ROOT_ID);
        if (!root) return;
        const runtime = ensureAdminTestingRuntime();
        if (runtime.error) {
            root.innerHTML = `<div class="lux-card-meta" style="margin-top:12px; color:#b91c1c;">${escapeHtml(runtime.error)}</div>`;
            return;
        }
        const personas = Array.isArray(runtime.personas) ? runtime.personas : [];
        root.innerHTML = `
            <div class="lux-card-meta" style="margin-top:12px;">
                These are built-in testing personas for ${escapeHtml(getFacultyLabel(runtime.facultyCode))}. They live inside the admin session, switch instantly without sign-in, and use the same role dashboards as normal accounts.
            </div>
            <div class="lux-subcards" style="margin-top:14px;">
                ${personas.map(persona => `
                    <div class="lux-subcard" style="align-items:flex-start; text-align:left; cursor:default;">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; width:100%;">
                            <strong>${escapeHtml(getAdminTestingRoleLabel(persona.role))}</strong>
                            <span class="lux-pill">${escapeHtml(persona.testingFaculty || runtime.facultyCode)}</span>
                        </div>
                        <span>${escapeHtml(persona.displayName || persona.nameEn || persona.name || persona.id || 'Testing persona')}</span>
                        <span style="font-size:11px; color:var(--lux-text-dim, #64748b);">${escapeHtml(persona.email || '')}</span>
                        ${persona.testingScenario ? `<span style="font-size:11px; color:var(--lux-text-dim, #64748b); line-height:1.45;">${escapeHtml(persona.testingScenario)}</span>` : ''}
                        <span style="font-size:11px; color:var(--lux-text-dim, #64748b);">${String(persona.role || '') === 'student'
                            ? 'Use this persona to join groups, write quizzes, receive grades, and test the student portal flow.'
                            : 'Use this persona to open the real dashboard for this role without logging out of the admin account.'}</span>
                        ${Array.isArray(persona.testingCapabilities) && persona.testingCapabilities.length
                            ? `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:4px;">${persona.testingCapabilities.map(capability => `<span class="lux-pill" style="font-size:10px;">${escapeHtml(capability)}</span>`).join('')}</div>`
                            : ''}
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
                            <button class="lux-primary-btn" type="button" data-testing-persona-role="${escapeHtml(persona.role || '')}" style="padding:9px 12px; font-size:11px;"><i class="fas fa-right-to-bracket"></i> Open Dashboard</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        root.querySelectorAll('[data-testing-persona-role]').forEach((button) => {
            if (button.dataset.bound) return;
            button.addEventListener('click', () => {
                const role = button.getAttribute('data-testing-persona-role') || '';
                activateAdminTestingPersona(role);
            });
            button.dataset.bound = '1';
        });
    }

    function refreshAdminTestingPersonas() {
        const runtime = ensureAdminTestingRuntime();
        runtime.personas = typeof getAdminTestingPersonas === 'function'
            ? getAdminTestingPersonas(runtime.facultyCode)
            : [];
        runtime.error = '';
        runtime.ready = true;
        renderAdminTestingAccountsPanel();
    }

    function activateAdminTestingPersona(role = '') {
        const normalizedRole = String(role || '').trim().toLowerCase();
        if (!normalizedRole) {
            alert('Choose a testing persona first.');
            return;
        }
        const runtime = ensureAdminTestingRuntime();
        if (typeof ensureAdminTestingPersonas === 'function') {
            ensureAdminTestingPersonas(runtime.facultyCode);
        }
        localStorage.setItem('currentFaculty', runtime.facultyCode || 'ECON');
        if (typeof switchRole === 'function') {
            switchRole(normalizedRole);
            return;
        }
        if (typeof setActiveSessionUserByRole === 'function') {
            setActiveSessionUserByRole(normalizedRole);
        }
        window.location.href = `index.html?view=${encodeURIComponent(normalizedRole)}#home`;
    }

    renderLuxuryAdminToolsPage = function renderLuxuryAdminToolsPage() {
        const shell = ensureAdminToolsPage();
        if (!shell) return;
        if (getEffectiveRole() !== 'admin' && !shell.dataset.rendered) return;
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
                    <!-- â•â•â•â•â•â•â•â•â•â•â• TWO-COLUMN: Curriculum Library + Builder â•â•â•â•â•â•â•â•â•â•â• -->
                    <div class="lux-home-columns">
                        <!-- LEFT: Curriculum Library -->
                        <section class="lux-panel">
                            <div class="lux-card-head">
                                <div>
                                    <div class="lux-card-title">Curriculum Library</div>
                                    <div class="lux-card-meta">Browse and organize subjects by module.</div>
                                </div>
                                <button class="lux-secondary-btn" type="button" data-admin-tools-add-module="1" style="padding:9px 14px; font-size:11px; white-space:nowrap;">
                                    <i class="fas fa-layer-group"></i>
                                    Add Module
                                </button>
                            </div>
                            <div id="curriculum-library-modules-root" style="margin-top:14px;"></div>
                        </section>

                        <!-- RIGHT: Curriculum Subject Builder -->
                        <section class="lux-panel" id="curriculum-subject-builder-card">
                            <div class="lux-card-head">
                                <div class="lux-card-title">Add Subject</div>
                                <div class="lux-card-meta">Create a new course for the active faculty.</div>
                            </div>
                            <div id="curriculum-form-module-target" class="lux-pill" style="margin-top:14px;"><i class="fas fa-layer-group" style="font-size:10px;"></i> Target: Loading...</div>
                            <div id="curriculum-form-module-help" class="lux-card-meta" style="margin-top:8px;">Loading...</div>
                            <div class="lux-field-grid" style="margin-top:14px;">
                                <input id="new-subject-name" name="new_subject_name" type="text" class="lux-control" placeholder="Course name">
                                <input id="new-subject-code-preview" name="new_subject_code_preview" type="text" class="lux-control" placeholder="Code (auto or custom)">
                                <input id="new-subject-ects" name="new_subject_ects" type="number" class="lux-control" value="6" min="1" placeholder="ECTS credits">
                                <select id="new-subject-semester" name="new_subject_semester" class="lux-control">
                                    <option value="" disabled selected>Select semester</option>
                                    <option value="1">Semester 1</option>
                                    <option value="2">Semester 2</option>
                                    <option value="3">Semester 3</option>
                                    <option value="4">Semester 4</option>
                                    <option value="5">Semester 5</option>
                                    <option value="6">Semester 6</option>
                                    <option value="7">Semester 7</option>
                                    <option value="8">Semester 8</option>
                                </select>
                            </div>

                            <!-- Prerequisites -->
                            <div style="margin-top:18px;">
                                <div class="lux-card-head">
                                    <div class="lux-card-title" style="font-size:14px;">Prerequisites</div>
                                    <div class="lux-card-meta">Optional â€” set course requirements.</div>
                                </div>
                                <input id="subject-search-input" name="subject_search_input" type="text" class="lux-control" placeholder="Search for a prerequisite course..." data-admin-tools-prereq-search="1" style="margin-top:10px;">
                                <div id="subject-search-results" class="lux-list" style="margin-top:10px; display:none; max-height:180px; overflow:auto;"></div>
                            </div>
                            <div style="margin-top:14px; display:grid; gap:12px;">
                                <label style="display:flex; align-items:center; gap:10px; font-size:12px; color:var(--lux-text); cursor:pointer;">
                                    <input id="has-condition-checkbox" name="has_condition_checkbox" type="checkbox" data-admin-tools-toggle-condition="1">
                                    Require a prerequisite course
                                </label>
                                <div id="condition-box-container" style="display:none;">
                                    <div id="selected-condition-badge" class="lux-pill" style="display:none;" data-value="None">
                                        <span id="selected-condition-text"></span>
                                    </div>
                                </div>
                                <div id="new-subject-antireq-picker"></div>
                                <input type="hidden" id="new-subject-antireq" name="new_subject_antireq" value="">
                            </div>
                            <div id="new-subject-semester-parity-hint" class="lux-card-meta" style="margin-top:14px; line-height:1.5; font-size:11px; opacity:0.7;"></div>
                            <div style="margin-top:16px; display:flex; justify-content:flex-end;">
                                <button class="lux-primary-btn" id="save-curriculum-subject-btn" type="button" data-admin-tools-save-subject="1"><i class="fas fa-plus"></i> Save Subject</button>
                            </div>
                        </section>
                    </div>
                    <section class="lux-panel" style="margin-bottom:18px;">
                        <div class="lux-card-head">
                            <div class="lux-card-title">Registration Setup</div>
                            <div class="lux-card-meta">Configure program modules, electives, and specializations.</div>
                        </div>
                        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">
                            <button class="admin-reg-tab is-active" type="button" data-admin-tools-reg-tab="prog" data-target="prog">Program</button>
                            <button class="admin-reg-tab" type="button" data-admin-tools-reg-tab="free" data-target="free">Free Credits</button>
                            <button class="admin-reg-tab" type="button" data-admin-tools-reg-tab="conc" data-target="conc">Concentration</button>
                            <button class="admin-reg-tab" type="button" data-admin-tools-reg-tab="minor" data-target="minor">Minor</button>
                        </div>
                        <div id="admin-reg-content-container" style="margin-top:14px;"></div>
                    </section>
                </div>
            `;
            shell.dataset.rendered = '1';
            shell.dataset.workspaceReady = '';
            shell.dataset.workspaceFaculty = '';
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

        shell.querySelectorAll('[data-admin-tools-reg-tab]').forEach((button) => {
            if (button.dataset.bound) return;
            button.addEventListener('click', () => {
                if (typeof switchAdminRegTab === 'function') {
                    switchAdminRegTab(button.dataset.adminToolsRegTab || button.dataset.target || 'prog');
                }
            });
            button.dataset.bound = '1';
        });

        const testingRefreshButton = document.getElementById('admin-testing-accounts-refresh');
        if (testingRefreshButton && !testingRefreshButton.dataset.bound) {
            testingRefreshButton.addEventListener('click', () => {
                refreshAdminTestingPersonas();
            });
            testingRefreshButton.dataset.bound = '1';
        }

        syncCurriculumSubjectBuilderTarget(getCurrentFaculty());
        if (typeof populateAntiReqDropdown === 'function') populateAntiReqDropdown();
        if (typeof ensureSubjectSemesterParityHint === 'function') ensureSubjectSemesterParityHint();

        const currentFaculty = normalizeFacultyCode(getCurrentFaculty(), 'ECON');
        const refreshRegistrationWorkspace = () => {
            if (typeof renderCurriculumTable === 'function') renderCurriculumTable();
            if (typeof bootAdminRegistrationCms === 'function') bootAdminRegistrationCms(adminRegActiveTab || 'prog');
            shell.dataset.workspaceReady = '1';
            shell.dataset.workspaceFaculty = currentFaculty;
        };
        const registrationContainer = document.getElementById('admin-reg-content-container');
        const curriculumModulesRoot = document.getElementById('curriculum-library-modules-root');
        const shouldRefreshRegistrationWorkspace =
            shell.dataset.workspaceReady !== '1'
            || shell.dataset.workspaceFaculty !== currentFaculty
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
