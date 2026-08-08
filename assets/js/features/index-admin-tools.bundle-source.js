    /* Editable SSOT for admin-tools index bundle. Regenerate: node scripts/regen-admin-tools-bundle.js */

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

    function getAdminToolsProgramFaculty() {
        const faculty = typeof getCurrentFaculty === 'function' ? getCurrentFaculty() : '';
        return String(faculty || 'ECON').trim().toUpperCase() || 'ECON';
    }

    function getAdminToolsProgramBucket(faculty = getAdminToolsProgramFaculty()) {
        if (typeof KIU_STATE === 'undefined' || !KIU_STATE || typeof KIU_STATE !== 'object') return null;
        KIU_STATE.adminProgramStructures = KIU_STATE.adminProgramStructures && typeof KIU_STATE.adminProgramStructures === 'object'
            ? KIU_STATE.adminProgramStructures
            : {};
        const bucket = KIU_STATE.adminProgramStructures[faculty] = KIU_STATE.adminProgramStructures[faculty] || {};
        return bucket;
    }

    function getAdminToolsProgramSubjects(faculty = getAdminToolsProgramFaculty()) {
        const bucket = getAdminToolsProgramBucket(faculty);
        const subjects = [];
        const profileSubjects = typeof KIU_STATE !== 'undefined'
            ? KIU_STATE?.facultyProfiles?.[faculty]?.curriculum
            : [];
        if (Array.isArray(profileSubjects)) subjects.push(...profileSubjects);
        ['prog', 'free', 'conc', 'minor'].forEach((track) => {
            (Array.isArray(bucket?.[track]) ? bucket[track] : []).forEach((module) => {
                if (Array.isArray(module?.subModules)) subjects.push(...module.subModules);
            });
        });
        return subjects;
    }

    function getAdminToolsHighestSemester(faculty = getAdminToolsProgramFaculty()) {
        return getAdminToolsProgramSubjects(faculty).reduce((highest, subject) => {
            const values = Array.isArray(subject?.semesters) ? subject.semesters : [subject?.semester];
            return Math.max(highest, ...values.map((value) => parseInt(String(value || ''), 10) || 0));
        }, 0);
    }

    function getAdminToolsProgramSemesterCount(faculty = getAdminToolsProgramFaculty()) {
        const configured = parseInt(String(getAdminToolsProgramBucket(faculty)?.programSemesterCount || ''), 10);
        if (Number.isFinite(configured) && configured > 0) return Math.min(configured, 12);
        return Math.max(1, Math.min(getAdminToolsHighestSemester(faculty) || 1, 12));
    }

    function getAdminToolsSemesterHelpText(count) {
        const value = Number(count) || 1;
        return `${value} semester column${value === 1 ? '' : 's'} ${value === 1 ? 'is' : 'are'} shown to students.`;
    }

    function renderAdminToolsSemesterOptions(select, selectedValue) {
        if (!select) return;
        const selected = String(selectedValue || '');
        select.innerHTML = Array.from({ length: 12 }, (_, index) => {
            const value = index + 1;
            const roman = typeof formatSemesterRoman === 'function' ? formatSemesterRoman(value) : value;
            return `<option value="${value}">${roman} (${value} semester${value === 1 ? '' : 's'})</option>`;
        }).join('');
        select.value = selected && Number(select.value) === Number(selected)
            ? selected
            : String(getAdminToolsProgramSemesterCount());
    }

    function syncAdminToolsProgramSemesterControl(faculty = getAdminToolsProgramFaculty()) {
        const select = document.getElementById('admin-program-semester-count');
        if (!select) return;
        const count = getAdminToolsProgramSemesterCount(faculty);
        renderAdminToolsSemesterOptions(select, String(count));
        const help = document.getElementById('admin-program-semester-count-help');
        if (help) help.textContent = getAdminToolsSemesterHelpText(count);
        if (select.dataset.bound === '1') return;
        select.addEventListener('change', () => {
            const next = Math.max(1, Math.min(parseInt(select.value, 10) || count, 12));
            const highest = getAdminToolsHighestSemester(faculty);
            if (next < highest) {
                select.value = String(count);
                if (help) help.textContent = `Move subjects from Semester ${highest} before reducing the program count.`;
                return;
            }
            const bucket = getAdminToolsProgramBucket(faculty);
            if (!bucket) return;
            bucket.programSemesterCount = next;
            if (typeof saveState === 'function') saveState();
            if (help) help.textContent = getAdminToolsSemesterHelpText(next);
            window.dispatchEvent(new CustomEvent('kiu-program-semester-config-changed', {
                detail: { faculty, semesterCount: next }
            }));
            if (typeof renderCurriculumTable === 'function') renderCurriculumTable();
        });
        select.dataset.bound = '1';
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
                    <section class="lux-panel lux-admin-tools-curriculum-panel lux-soft-chrome" id="lux-admin-curriculum-deck" data-lux-glass-root="1">
                        <div class="lux-card-head lux-admin-tools-curriculum-panel-head">
                            <div class="lux-card-title">Curriculum Library</div>
                        </div>

                        <div class="lux-admin-curriculum-control-band lux-soft-chrome home-hover-chip">
                            <label class="lux-program-field lux-admin-curriculum-select-wrap">
                                <span>Semester filter</span>
                                <select class="lux-control" id="filter-curriculum-semester" name="filter_curriculum_semester" data-curriculum-semester-filter="1">
                                    <option value="all">All Semesters</option>
                                </select>
                            </label>
                            <div class="lux-program-field lux-admin-curriculum-search-wrap">
                                <span>Search subjects</span>
                                <i class="fas fa-search"></i>
                                <input class="lux-control" id="admin-curriculum-search" name="admin_curriculum_search" type="search" autocomplete="off" spellcheck="false" placeholder="Search subject code, title, prerequisite..." value="" data-curriculum-search="1">
                            </div>
                            <label class="lux-program-field lux-admin-curriculum-semester-count-wrap">
                                <span>Program semesters</span>
                                <select class="lux-control" id="admin-program-semester-count" data-program-semester-count="1" aria-describedby="admin-program-semester-count-help"></select>
                                <small id="admin-program-semester-count-help" class="lux-admin-curriculum-semester-count-help">Controls the semester columns shown to students.</small>
                            </label>
                        </div>

                        <div class="lux-admin-curriculum-ops-panel">
                            <div class="lux-admin-curriculum-ops-grid" id="curriculum-ops-grid">
                                <article class="lux-stat lux-soft-chrome home-hover-chip">
                                    <strong id="curriculum-ops-total-ects">0</strong>
                                    <span>Total credits</span>
                                    <em id="curriculum-ops-total-ects-note">ECTS in program</em>
                                </article>
                                <article class="lux-stat lux-soft-chrome home-hover-chip">
                                    <strong id="curriculum-ops-visible-ects">0</strong>
                                    <span>Visible credits</span>
                                    <em id="curriculum-ops-visible-ects-note">Current filter</em>
                                </article>
                                <article class="lux-stat lux-soft-chrome home-hover-chip">
                                    <strong id="curriculum-ops-modules">0</strong>
                                    <span>Modules</span>
                                    <em id="curriculum-ops-modules-note">Curriculum blocks</em>
                                </article>
                                <article class="lux-stat lux-soft-chrome home-hover-chip">
                                    <strong id="curriculum-ops-prerequisites">0</strong>
                                    <span>Prerequisites</span>
                                    <em id="curriculum-ops-prerequisites-note">Subjects with requirements</em>
                                </article>
                                <article class="lux-stat lux-soft-chrome home-hover-chip">
                                    <strong id="curriculum-ops-module-load">--</strong>
                                    <span>Module load</span>
                                    <em id="curriculum-ops-module-load-note">Selected module capacity</em>
                                </article>
                            </div>
                        </div>

                        <div class="lux-admin-curriculum-workspace">
                            <div id="curriculum-library-workspace-root"></div>
                        </div>
                    </section>

                    <div id="kiu-subject-builder-modal" class="registration-structured-modal-backdrop lms-glass-dialog-overlay" data-lux-transparency-exempt="1" hidden aria-hidden="true" role="dialog" aria-modal="true" aria-labelledby="subject-builder-modal-title">
                        <form class="lux-glass-dialog-card lux-glass-dialog-card--form lux-glass-dialog-card--event-create lux-glass-dialog-card" data-form="create-subject" data-action="noop" data-lux-transparency-exempt="1">
                            <div class="lux-glass-dialog-section-head lux-glass-dialog-head">
                                <div class="lux-glass-dialog-heading">
                                    <strong class="lux-glass-dialog-title"><i class="fas fa-book-open" aria-hidden="true"></i> <span id="subject-builder-modal-title">Add Subject</span></strong>
                                    <span class="lux-glass-dialog-subtitle registration-structured-modal-subtitle">Create a new course for the active faculty.</span>
                                </div>
                                <button type="button" class="lux-ghost-btn lux-glass-dialog-close-btn" data-subject-builder-modal-close="1" aria-label="Close"><i class="fas fa-times"></i></button>
                            </div>
                            <div id="curriculum-subject-builder-card" class="lux-scrollbar lux-admin-tools-builder-body lux-glass-dialog-body lux-glass-dialog-body--event-create">
                                <div class="lux-glass-dialog-preview" data-builder-section="target">
                                    <strong class="lux-glass-dialog-preview-title" id="curriculum-form-module-target"><i class="fas fa-layer-group" aria-hidden="true"></i><span>Loading...</span></strong>
                                    <span class="lux-glass-dialog-preview-copy" id="curriculum-form-module-help">Loading...</span>
                                </div>
                                <div class="social-neo-divider" aria-hidden="true"></div>
                                <div class="social-neo-form-grid social-neo-form-grid-2 lux-field-grid lux-admin-tools-field-grid" data-builder-section="basics">
                                    <label class="lux-glass-dialog-field" for="new-subject-name">
                                        <span class="social-neo-label">Course name</span>
                                        <input id="new-subject-name" name="new_subject_name" type="text" class="social-neo-input lux-control" placeholder="Course name">
                                    </label>
                                    <label class="lux-glass-dialog-field" for="new-subject-code-preview">
                                        <span class="social-neo-label">Course code</span>
                                        <input id="new-subject-code-preview" name="new_subject_code_preview" type="text" class="social-neo-input lux-control" placeholder="Code (auto or custom)">
                                    </label>
                                    <label class="lux-glass-dialog-field" for="new-subject-ects">
                                        <span class="social-neo-label">ECTS credits</span>
                                        <input id="new-subject-ects" name="new_subject_ects" type="number" class="social-neo-input lux-control" value="6" min="1" placeholder="ECTS credits">
                                    </label>
                                </div>
                                <label class="lux-glass-dialog-field" id="new-subject-semester-picker-field-label" for="new-subject-semester-lux-btn">
                                    <span class="social-neo-label">Semesters offered</span>
                                    <div class="lux-admin-tools-semester-head social-neo-inline social-neo-events-toggle-row">
                                        <p class="lux-admin-tools-semester-hint" id="new-subject-semester-mode-hint" aria-live="polite">One semester — each selection replaces the current choice.</p>
                                        <div class="lux-semester-mode-segment social-neo-segmented-control" role="group" aria-label="Semester selection mode">
                                            <button type="button" class="lux-semester-mode-segment__btn lux-ghost-btn is-active" id="new-subject-semester-mode-single" data-semester-mode="replace" aria-pressed="true">Single</button>
                                            <button type="button" class="lux-semester-mode-segment__btn lux-ghost-btn" id="new-subject-semester-mode-multiple" data-semester-mode="add" aria-pressed="false">Multiple</button>
                                        </div>
                                    </div>
                                    <div class="lux-glass-dialog-field lux-picker-field lux-universal-picker-field lux-admin-tools-semester-field" id="new-subject-semester-picker">
                                        <div class="lux-semester-chip-tray" id="new-subject-semesters-tray" aria-label="Selected semesters"></div>
                                        <button type="button" class="lux-picker-btn lux-universal-picker-btn lux-picker-btn--compact" id="new-subject-semester-lux-btn" aria-haspopup="listbox" aria-expanded="false" data-lux-skip-modern-button="true" aria-label="Select semester" aria-labelledby="new-subject-semester-picker-field-label">
                                            <div class="lux-picker-copy">
                                                <strong class="lux-picker-value" id="new-subject-semester-lux-value">Semester 1</strong>
                                            </div>
                                            <i class="fas fa-chevron-down" aria-hidden="true"></i>
                                        </button>
                                        <div class="lux-picker-panel lux-universal-picker-panel lux-picker-panel-scroll lux-droplist-panel" id="new-subject-semester-lux-panel" role="listbox" aria-hidden="true" tabindex="-1">
                                            <div class="lux-scrollbar lux-semester-scroll-list" id="new-subject-semester-scroll-list"></div>
                                        </div>
                                        <input type="hidden" id="new-subject-semesters" name="new_subject_semesters" value="[1]">
                                    </div>
                                </label>
                                <div class="social-neo-divider" aria-hidden="true"></div>
                                <div data-builder-section="prerequisites">
                                    <label class="lux-glass-dialog-field" for="subject-search-input">
                                        <span class="social-neo-label">Search prerequisite</span>
                                        <input id="subject-search-input" name="subject_search_input" type="text" class="social-neo-input lux-control lux-admin-tools-prereq-search" placeholder="Search for a prerequisite course..." data-admin-tools-prereq-search="1">
                                    </label>
                                    <div id="subject-search-results" class="lux-list lux-admin-tools-prereq-results" hidden></div>
                                    <label class="lux-checkbox social-neo-checkbox" for="has-condition-checkbox">
                                        <input id="has-condition-checkbox" name="has_condition_checkbox" type="checkbox" data-admin-tools-toggle-condition="1">
                                        <span>Require a prerequisite course</span>
                                    </label>
                                    <div id="condition-box-container" class="lux-admin-tools-condition-box" hidden>
                                        <div id="selected-condition-badge" class="lux-pill lux-admin-tools-condition-badge home-hover-chip" data-value="None" hidden>
                                            <span id="selected-condition-text"></span>
                                        </div>
                                    </div>
                                </div>
                                <div class="social-neo-divider" aria-hidden="true"></div>
                                <div data-builder-section="antirequisites">
                                    <div id="new-subject-antireq-picker"></div>
                                    <input type="hidden" id="new-subject-antireq" name="new_subject_antireq" value="">
                                </div>
                                <div class="social-neo-divider" aria-hidden="true"></div>
                                <div data-builder-section="availability">
                                    <div id="new-subject-semester-parity-hint" class="registration-structured-help lux-admin-tools-parity-callout"></div>
                                </div>
                            </div>
                            <div class="lux-glass-dialog-form-actions lux-glass-dialog-actions lux-admin-tools-submit-row">
                                <button type="button" class="lux-ghost-btn lux-glass-dialog-cancel-btn" data-subject-builder-modal-close="1">Cancel</button>
                                <button type="button" class="lux-primary-btn lux-glass-dialog-submit-btn" id="save-curriculum-subject-btn" data-admin-tools-save-subject="1"><i class="fas fa-plus"></i> Save Subject</button>
                            </div>
                        </form>
                    </div>
                    <section class="lux-panel lux-admin-tools-registration-panel lux-soft-chrome" data-lux-glass-root="1">
                        <div class="lux-card-head lux-actions-between lux-admin-tools-registration-panel-head">
                            <div class="lux-card-title">Registration Setup</div>
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

        const subjectBuilderModalRoot = document.getElementById('kiu-subject-builder-modal');
        if (subjectBuilderModalRoot && subjectBuilderModalRoot.parentElement !== document.body) {
            document.body.appendChild(subjectBuilderModalRoot);
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

        const prerequisiteSearchInput = document.querySelector('[data-admin-tools-prereq-search]');
        if (prerequisiteSearchInput && !prerequisiteSearchInput.dataset.bound) {
            prerequisiteSearchInput.addEventListener('input', (event) => {
                if (typeof debouncedFilterSubjects === 'function') {
                    debouncedFilterSubjects(event.target.value);
                }
            });
            prerequisiteSearchInput.dataset.bound = '1';
        }

        const toggleConditionCheckbox = document.querySelector('[data-admin-tools-toggle-condition]');
        if (toggleConditionCheckbox && !toggleConditionCheckbox.dataset.bound) {
            toggleConditionCheckbox.addEventListener('change', () => {
                if (typeof toggleConditionBox === 'function') toggleConditionBox();
            });
            toggleConditionCheckbox.dataset.bound = '1';
        }

        const subjectBuilderForm = document.querySelector('#kiu-subject-builder-modal [data-form="create-subject"]');
        if (subjectBuilderForm && !subjectBuilderForm.dataset.bound) {
            subjectBuilderForm.addEventListener('submit', (event) => {
                event.preventDefault();
            });
            subjectBuilderForm.dataset.bound = '1';
        }

        const saveSubjectButton = document.querySelector('[data-admin-tools-save-subject]');
        if (saveSubjectButton && !saveSubjectButton.dataset.bound) {
            saveSubjectButton.addEventListener('click', () => {
                if (typeof addSubjectToSystem === 'function') addSubjectToSystem();
            });
            saveSubjectButton.dataset.bound = '1';
        }

        const subjectBuilderModal = document.getElementById('kiu-subject-builder-modal');
        if (subjectBuilderModal && !subjectBuilderModal.dataset.bound) {
            subjectBuilderModal.addEventListener('click', (event) => {
                if (event.target !== subjectBuilderModal) return;
                const panel = document.getElementById('new-subject-semester-lux-panel');
                if (panel?.classList.contains('is-open')) {
                    if (typeof closePickerPanels === 'function') closePickerPanels();
                    return;
                }
                if (typeof closeCurriculumSubjectBuilderModal === 'function') closeCurriculumSubjectBuilderModal();
            });
            subjectBuilderModal.dataset.bound = '1';
        }

        document.querySelectorAll('[data-subject-builder-modal-close]').forEach((button) => {
            if (button.dataset.bound) return;
            button.addEventListener('click', (event) => {
                event.preventDefault();
                if (typeof closeCurriculumSubjectBuilderModal === 'function') closeCurriculumSubjectBuilderModal();
            });
            button.dataset.bound = '1';
        });

        if (!window.__curriculumSubjectBuilderModalKeydownBound) {
            window.__curriculumSubjectBuilderModalKeydownBound = true;
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                const modal = document.getElementById('kiu-subject-builder-modal');
                if (!modal || modal.hidden) return;
                const panel = document.getElementById('new-subject-semester-lux-panel');
                if (panel?.classList.contains('is-open')) {
                    if (typeof closePickerPanels === 'function') closePickerPanels({ restoreFocus: true });
                    return;
                }
                if (typeof closeCurriculumSubjectBuilderModal === 'function') closeCurriculumSubjectBuilderModal();
            });
        }

        if (typeof renderAdminRegTabBar === 'function') {
            renderAdminRegTabBar(adminRegActiveTab || 'prog');
        }

        syncCurriculumSubjectBuilderTarget(getCurrentFaculty());
        if (typeof populateAntiReqDropdown === 'function') populateAntiReqDropdown();
        if (typeof ensureCurriculumSemesterPickerInitialized === 'function') {
            ensureCurriculumSemesterPickerInitialized();
        }
        if (typeof initCurriculumLibraryRowScroll === 'function') initCurriculumLibraryRowScroll(shell);
        if (typeof ensureSubjectSemesterParityHint === 'function') ensureSubjectSemesterParityHint();

        const currentFaculty = normalizeFacultyCode(
            (typeof getAdminRegistrationFaculty === 'function' ? getAdminRegistrationFaculty() : getCurrentFaculty()),
            'ECON'
        );
        syncAdminToolsProgramSemesterControl(currentFaculty);
        if (typeof bindFacultyRegistrationCmsData === 'function') {
            bindFacultyRegistrationCmsData(currentFaculty);
        }
        const registrationContainerForFaculty = document.getElementById('admin-reg-content-container');
        if (registrationContainerForFaculty) {
            registrationContainerForFaculty.dataset.cmsFaculty = currentFaculty;
        }
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
        const curriculumWorkspaceRoot = document.getElementById('curriculum-library-workspace-root');
        const shouldRefreshRegistrationWorkspace =
            shell.dataset.workspaceReady !== '1'
            || shell.dataset.workspaceFaculty !== currentFaculty
            || shell.dataset.cmsRevision !== cmsRevision
            || !registrationContainer
            || !curriculumWorkspaceRoot
            || !registrationContainer.hasChildNodes()
            || !curriculumWorkspaceRoot.hasChildNodes();

        if (!shouldRefreshRegistrationWorkspace) {
            shell.dataset.workspaceFaculty = currentFaculty;
        } else if (typeof renderCurriculumTable === 'function' && typeof bootAdminRegistrationCms === 'function') {
            refreshRegistrationWorkspace();
        } else if (typeof ensurePortalRegistrationRuntimeLoaded === 'function') {
            ensurePortalRegistrationRuntimeLoaded().then((loaded) => {
                if (!loaded) return;
                syncAdminToolsProgramSemesterControl(currentFaculty);
                if (typeof ensureCurriculumSemesterPickerInitialized === 'function') {
                    ensureCurriculumSemesterPickerInitialized();
                }
                refreshRegistrationWorkspace();
            });
        } else {
            refreshRegistrationWorkspace();
        }

        const focus = consumeAdminToolsFocus();
        if (focus === 'curriculum') {
            document.getElementById('lux-admin-curriculum-deck')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (focus === 'registration') {
            document.getElementById('admin-reg-content-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
