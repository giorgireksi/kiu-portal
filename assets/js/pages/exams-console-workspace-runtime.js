/* Exam console review/live/workspace/render + click/change handlers.
 * Peeled from exams-console.js. Load before exams-console.js on exams.html.
 */
(function initExamsConsoleWorkspaceRuntime() {
    if (window.__KIU_EXAMS_CONSOLE_WORKSPACE_LOADED) return;
    window.__KIU_EXAMS_CONSOLE_WORKSPACE_LOADED = true;

    window.__kiuCreateExamsConsoleWorkspaceApi = function createKiuExamsConsoleWorkspaceApi(deps) {
        const d = deps || {};
        /* Non-strict + with(deps): IIFE locals are provided on the mutable deps bag. */
        with (d) {
            function renderReviewTab() {
                if (hasExamsAdminModule()) {
                    return window.renderExamReviewTab();
                }
                ensureExamsAdminModule().then(() => renderConsole('body')).catch(() => null);
                return renderAdminLoadingPanel(
                    'Loading Review Queue',
                    'Preparing submitted quizzes, return notes, and approval actions.'
                );
            }

            function renderScheduleBoard() {
                if (hasExamsAdminModule()) {
                    return window.renderExamScheduleBoard();
                }
                ensureExamsAdminModule().then(() => renderConsole('body')).catch(() => null);
                return renderAdminLoadingPanel(
                    'Loading Schedule Builder',
                    'Preparing approved templates, cohort groups, and scheduled exam sessions.'
                );
            }
            function renderExamsAttemptsLoadingPanel(title, description) {
                return `
                    <div class="ex2-workspace-section">
                        <div class="ex2-empty-state">
                            <i class="fas fa-chart-line"></i>
                            <p><strong>${escapeHtml(title)}</strong></p>
                            <p>${escapeHtml(description)}</p>
                        </div>
                    </div>
                `;
            }

            function renderLiveTab() {
                if (hasExamsAttemptsModule()) {
                    return window.renderExamLiveTab();
                }
                ensureExamsAttemptsModule().then(() => renderConsole('body')).catch(() => null);
                return renderExamsAttemptsLoadingPanel(
                    'Loading Live Monitoring',
                    'Preparing session activity, warning counters, and live attempt controls.'
                );
            }

            function renderResultsTab() {
                if (hasExamsAttemptsModule()) {
                    return window.renderExamResultsTab();
                }
                ensureExamsAttemptsModule().then(() => renderConsole('body')).catch(() => null);
                return renderExamsAttemptsLoadingPanel(
                    'Loading Results Queue',
                    'Preparing objective scores, manual review inputs, and session grading controls.'
                );
            }

            function hasActiveExamDraft() {
                return runtime.activeTab === 'templates' && runtime.templateDraft !== null;
            }

            function setExamRegionMarkup(element, key, markup) {
                if (!element) return false;
                const nextMarkup = String(markup ?? '');
                if (runtime.renderCache[key] === nextMarkup) return false;
                const active = document.activeElement;
                const focusId = active?.id || '';
                const focusSelectionStart = typeof active?.selectionStart === 'number' ? active.selectionStart : null;
                const focusSelectionEnd = typeof active?.selectionEnd === 'number' ? active.selectionEnd : null;
                element.innerHTML = nextMarkup;
                runtime.renderCache[key] = nextMarkup;
                if (focusId) {
                    const restored = document.getElementById(focusId);
                    if (restored && typeof restored.focus === 'function') {
                        restored.focus();
                        if (focusSelectionStart !== null && typeof restored.setSelectionRange === 'function') {
                            restored.setSelectionRange(focusSelectionStart, focusSelectionEnd ?? focusSelectionStart);
                        }
                    }
                }
                return true;
            }

            function clearExamRegionCache(keys) {
                const list = keys === undefined
                    ? Object.keys(runtime.renderCache)
                    : (Array.isArray(keys) ? keys : [keys]);
                list.forEach((key) => delete runtime.renderCache[key]);
            }

            function ensureExamWorkspaceShell(root) {
                if (!root) return null;
                let shell = root.querySelector('[data-exam-shell="1"]');
                if (!shell) {
                    root.innerHTML = `
                        <div class="ex2-shell" data-exam-shell="1" data-exam-mounted="0">
                            <section class="ex2-workspace-panel lux-modern-surface">
                                <div id="ex2-chrome-region" data-exam-region="chrome"></div>
                                <div id="ex2-body-region" class="ex2-workspace-body" data-exam-region="body"></div>
                                <div id="ex2-modal-region" data-exam-region="modal"></div>
                            </section>
                        </div>
                    `;
                    shell = root.querySelector('[data-exam-shell="1"]');
                    runtime.renderCache = {};
                }
                return {
                    shell,
                    chrome: root.querySelector('#ex2-chrome-region'),
                    body: root.querySelector('#ex2-body-region'),
                    modal: root.querySelector('#ex2-modal-region')
                };
            }

            function syncWorkspaceBodyClass(bodyEl) {
                if (!bodyEl) return;
                bodyEl.classList.toggle('ex2-workspace-body--builder', hasActiveExamDraft());
            }

            function renderWorkspaceBodyContent() {
                const isAdmin = ADMIN_ROLES.has(getRole());
                const adminOnlyTabs = new Set(['review', 'schedule', 'live', 'results']);
                if (adminOnlyTabs.has(runtime.activeTab) && !isAdmin) runtime.activeTab = 'templates';
                if (runtime.activeTab === 'templates') {
                    return hasActiveExamDraft() ? renderTemplateBuilder() : renderTemplateList();
                }
                if (runtime.activeTab === 'review') return renderReviewTab();
                if (runtime.activeTab === 'schedule') return renderScheduleBoard();
                if (runtime.activeTab === 'live') return renderLiveTab();
                return renderResultsTab();
            }

            function renderExamModalMarkup() {
                const parts = [];
                if (runtime.showShareModal) {
                    const draft = getTemplateDraft();
                    if (draft) parts.push(renderShareModal(draft));
                }
                if (runtime.showReturnModal && typeof window.renderExamReturnModal === 'function') {
                    parts.push(window.renderExamReturnModal());
                }
                return parts.join('');
            }

            function enhanceExamRegionPickers(element) {
                if (element && typeof window.enhanceUniversalPickers === 'function') {
                    window.enhanceUniversalPickers(element);
                }
            }

            function patchExamChrome() {
                const root = document.getElementById(ROOT_ID);
                const regions = ensureExamWorkspaceShell(root);
                if (!regions) return;
                if (hasActiveExamDraft()) {
                    if (regions.chrome.innerHTML) {
                        regions.chrome.innerHTML = '';
                        delete runtime.renderCache['region:chrome'];
                    }
                    syncWorkspaceBodyClass(regions.body);
                    return;
                }
                setExamRegionMarkup(regions.chrome, 'region:chrome', renderWorkspaceChrome());
                syncWorkspaceBodyClass(regions.body);
            }

            function patchExamBody() {
                const root = document.getElementById(ROOT_ID);
                const regions = ensureExamWorkspaceShell(root);
                if (!regions) return;
                const changed = setExamRegionMarkup(regions.body, 'region:body', renderWorkspaceBodyContent());
                syncWorkspaceBodyClass(regions.body);
                if (changed) enhanceExamRegionPickers(regions.body);
                patchExamModal();
            }

            function patchExamModal() {
                const root = document.getElementById(ROOT_ID);
                const regions = ensureExamWorkspaceShell(root);
                if (!regions) return;
                setExamRegionMarkup(regions.modal, 'region:modal', renderExamModalMarkup());
            }

            function syncBuilderToolbarTitle() {
                const draft = getTemplateDraft();
                if (!draft) return;
                const titleEl = document.querySelector('[data-exam-region="builder-toolbar"] .ex2-builder-title');
                if (titleEl) {
                    titleEl.textContent = draft.title || (draft.editingTemplateId ? 'Edit Quiz' : 'New Quiz');
                }
            }

            function syncBuilderSubjectDefaultInputs(draft) {
                const scoreInput = document.getElementById('exam-template-default-score');
                const optionsInput = document.getElementById('exam-template-default-options');
                if (scoreInput) scoreInput.value = String(draft.defaultQuestionScore || 1);
                if (optionsInput) optionsInput.value = String(draft.defaultOptionCount || 4);
            }

            function syncBuilderStepperState() {
                const draft = getTemplateDraft();
                const root = document.getElementById(ROOT_ID);
                if (!draft || !root) return;
                const stepDone = typeof window.isExamBuilderStepComplete === 'function'
                    ? window.isExamBuilderStepComplete
                    : () => false;
                const STEPS = ['details', 'questions', 'variants', 'review'];
                root.querySelectorAll('[data-exam-region="builder-stepper"] .ex2-progress-step').forEach((btn, index) => {
                    const step = STEPS[index];
                    if (!step) return;
                    const done = stepDone(step, draft);
                    const active = runtime.templateStep === step;
                    btn.classList.toggle('is-active', active);
                    btn.classList.toggle('is-done', done && !active);
                    btn.setAttribute('aria-current', active ? 'step' : 'false');
                    const numEl = btn.querySelector('.ex2-progress-step-num');
                    if (numEl) numEl.innerHTML = done && !active ? '<i class="fas fa-check"></i>' : String(index + 1);
                });
            }

            function patchExamBuilderSummary() {
                const host = document.querySelector('[data-exam-region="builder-summary"]');
                if (!host || typeof window.renderExamBuilderSummaryMarkup !== 'function') return;
                setExamRegionMarkup(host, 'region:builder-summary', window.renderExamBuilderSummaryMarkup());
            }

            function patchExamBuilderStep(animate = false) {
                const host = document.querySelector('[data-exam-region="builder-step"]');
                if (!host || typeof window.renderExamBuilderStepMarkup !== 'function') return;
                const changed = setExamRegionMarkup(host, 'region:builder-step', window.renderExamBuilderStepMarkup());
                if (changed) {
                    if (animate) {
                        host.classList.add('is-entering');
                        host.addEventListener('animationend', () => host.classList.remove('is-entering'), { once: true });
                    }
                    enhanceExamRegionPickers(host);
                }
            }

            function patchExamBuilderStepper() {
                const draft = getTemplateDraft();
                const host = document.querySelector('[data-exam-region="builder-stepper"]');
                if (!host || !draft || typeof window.renderExamBuilderStepperMarkup !== 'function') return;
                setExamRegionMarkup(host, 'region:builder-stepper', window.renderExamBuilderStepperMarkup(draft));
            }

            function patchExamBuilderPartial() {
                patchExamBuilderSummary();
                patchExamBuilderStepper();
                patchExamBuilderStep();
                syncBuilderToolbarTitle();
            }

            function normalizeExamDirtyRegions(dirty) {
                if (!dirty || dirty === 'full' || dirty === 'all' || dirty === 'auto') {
                    return new Set(['chrome', 'body', 'modal']);
                }
                if (Array.isArray(dirty)) return new Set(dirty);
                return new Set([String(dirty)]);
            }

            function renderWorkspace() {
                const role = getRole();
                if (!STAFF_ROLES.has(role)) {
                    return `<div class="ex2-empty">This exam workspace is available only to admin, professor, and teaching assistant accounts.</div>`;
                }
                patchExamChrome();
                patchExamBody();
                return '';
            }

            function renderConsole(dirty = 'full') {
                const root = document.getElementById(ROOT_ID);
                if (!root) return;
                bindConsoleEvents(root);
                const role = getRole();
                if (!STAFF_ROLES.has(role)) {
                    root.innerHTML = `<div class="ex2-empty">This exam workspace is available only to admin, professor, and teaching assistant accounts.</div>`;
                    return;
                }
                const regions = ensureExamWorkspaceShell(root);
                if (!regions) return;
                beginRenderPass(dirty);
                try {
                    const dirtySet = normalizeExamDirtyRegions(dirty);
                    if (dirtySet.has('all') || dirtySet.has('full')) {
                        clearExamRegionCache();
                    }
                    if (dirtySet.has('chrome') || dirtySet.has('all') || dirtySet.has('full')) {
                        patchExamChrome();
                    }
                    if (dirtySet.has('body') || dirtySet.has('all') || dirtySet.has('full')) {
                        patchExamBody();
                    } else if (dirtySet.has('builder-partial')) {
                        patchExamBuilderPartial();
                    } else if (dirtySet.has('builder-summary')) {
                        patchExamBuilderSummary();
                        syncBuilderToolbarTitle();
                    } else if (dirtySet.has('builder-step')) {
                        patchExamBuilderStep(true);
                        syncBuilderStepperState();
                    } else if (dirtySet.has('builder-stepper')) {
                        patchExamBuilderStepper();
                    }
                    if (dirtySet.has('modal') && !(dirtySet.has('body') || dirtySet.has('all') || dirtySet.has('full'))) {
                        patchExamModal();
                    }
                    if (regions.shell.getAttribute('data-exam-mounted') === '0') {
                        regions.shell.setAttribute('data-exam-mounted', '1');
                    }
                } finally {
                    endRenderPass();
                }
            }

            function handleConsoleClick(event) {
                const root = document.getElementById(ROOT_ID);
                if (!root || !root.contains(event.target)) return;
                if (event.target.classList?.contains('ex2-modal-overlay') && event.target === event.target.closest('.ex2-modal-overlay')) {
                    const modalKey = String(event.target.getAttribute('data-exam-modal') || '').trim().toLowerCase();
                    if (modalKey === 'return') {
                        closeReturnModalInternal();
                        return;
                    }
                    if (modalKey === 'share') {
                        closeShareModalInternal();
                    }
                    return;
                }
                const invokeEl = event.target.closest('[data-exam-call]');
                if (invokeEl && root.contains(invokeEl)) {
                    const fnName = String(invokeEl.getAttribute('data-exam-call') || '').trim();
                    if (fnName) {
                        event.preventDefault();
                        event.stopPropagation();
                        invokeExamDelegate(fnName, invokeEl.getAttribute('data-exam-args'), invokeEl);
                        return;
                    }
                }
                const actionEl = event.target.closest('[data-exam-action]');
                if (!actionEl || !root.contains(actionEl)) return;
                const action = String(actionEl.getAttribute('data-exam-action') || '').trim();
                if (action === 'close-share-modal') return closeShareModalInternal();
                if (action === 'close-return-modal') return closeReturnModalInternal();
                if (action === 'execute-return') return executeReturnForRevisionInternal();
                if (action === 'share-with-staff') {
                    return shareExamWithInternal(
                        actionEl.getAttribute('data-user-id') || '',
                        actionEl.getAttribute('data-user-name') || ''
                    );
                }
            }

            function parseExamDelegateArgs(raw) {
                if (!raw) return [];
                try {
                    const parsed = JSON.parse(raw);
                    return Array.isArray(parsed) ? parsed : [];
                } catch (error) {
                    return [];
                }
            }

            function invokeExamDelegate(fnName, rawArgs, target) {
                const fn = window[fnName];
                if (typeof fn !== 'function') return;
                const args = parseExamDelegateArgs(rawArgs).map((item) => {
                    if (item === '$value') return target?.value;
                    if (item === '$checked') return Boolean(target?.checked);
                    if (typeof item === 'string' && item.startsWith('$bankIndex:')) {
                        const upperBound = parseInt(item.split(':')[1], 10) || 0;
                        const nextValue = Math.max(0, Math.min(upperBound, (parseInt(target?.value, 10) || 1) - 1));
                        return nextValue;
                    }
                    return item;
                });
                return fn(...args);
            }

            function handleConsoleInput(event) {
                const root = document.getElementById(ROOT_ID);
                const target = event.target;
                if (!root || !target || !root.contains(target)) return;
                const fnName = String(target.getAttribute('data-exam-input-call') || '').trim();
                if (fnName) {
                    invokeExamDelegate(fnName, target.getAttribute('data-exam-input-args'), target);
                    return;
                }
                const inputType = String(target.getAttribute('data-exam-input') || '').trim();
                if (inputType === 'share-search') {
                    runtime.shareSearchQuery = String(target.value || '');
                    renderConsole('modal');
                    return;
                }
                if (inputType === 'return-note') {
                    runtime.returnNote = String(target.value || '');
                }
            }

            function handleConsoleChange(event) {
                const root = document.getElementById(ROOT_ID);
                const target = event.target;
                if (!root || !target || !root.contains(target)) return;
                const fnName = String(target.getAttribute('data-exam-change-call') || '').trim();
                if (!fnName) return;
                invokeExamDelegate(fnName, target.getAttribute('data-exam-change-args'), target);
            }

            function bindConsoleEvents(root) {
                if (!root || root.dataset.examConsoleBound === '1') return;
                root.dataset.examConsoleBound = '1';
                root.addEventListener('click', handleConsoleClick);
                root.addEventListener('input', handleConsoleInput);
                root.addEventListener('change', handleConsoleChange);
            }


            function bootExamsConsoleOnce(reason = 'standalone-boot') {
                const root = document.getElementById(ROOT_ID);
                const embeddedRoot = document.getElementById('lms-admin-exams-root');
                if (!root || embeddedRoot) return;
                if (window.__kiuExamsConsoleBooted) return;
                window.__kiuExamsConsoleBooted = true;
                window.__kiuExamsConsoleBootReason = String(reason || 'standalone-boot');
                renderConsole();
            }

            function renderAdminExamSection() {
                const embeddedRoot = document.getElementById('lms-admin-exams-root');
                if (embeddedRoot && typeof currentLmsQuizCourseKey !== 'undefined' && currentLmsQuizCourseKey && legacyRenderAdminExamSection) {
                    legacyRenderAdminExamSection();
                    return;
                }
                if (!window.__kiuExamsConsoleBooted) {
                    bootExamsConsoleOnce('render-admin-exam-section');
                    return;
                }
                renderConsole();
            };

            function setExamTab(tab) {
                runtime.activeTab = TABS.includes(String(tab || '').trim()) ? String(tab).trim() : 'templates';
                clearExamRegionCache();
                renderConsole('full');
            };

            async function selectExamSession(sessionId, targetTab = runtime.activeTab) {
                const normalizedSessionId = String(sessionId || '').trim();
                if (!normalizedSessionId || !getSessionById(normalizedSessionId)) return;
                const normalizedTab = ['live', 'results'].includes(String(targetTab || '').trim()) ? String(targetTab).trim() : runtime.activeTab;
                runtime.selectedSessionId = normalizedSessionId;
                if (normalizedTab) runtime.activeTab = normalizedTab;
                renderConsole('full');
                if (['live', 'results'].includes(normalizedTab)) {
                    await loadAttemptsForSession(normalizedSessionId, { force: false });
                }
            };

            function setExamTemplateSearch(value) {
                runtime.templateSearch = String(value || '');
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function setExamTemplateFilter(value) {
                runtime.templateFilter = String(value || 'all').trim().toLowerCase() || 'all';
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function setExamReviewSearch(value) {
                runtime.reviewSearch = String(value || '');
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function setExamReviewSort(value) {
                runtime.reviewSort = String(value || 'oldest').trim().toLowerCase() === 'newest' ? 'newest' : 'oldest';
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function setExamReviewFaculty(value) {
                runtime.reviewFaculty = String(value || 'all').trim().toUpperCase() || 'ALL';
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function toggleExamReviewApproved() {
                runtime.reviewApprovedCollapsed = !runtime.reviewApprovedCollapsed;
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function cancelExamDraft() {
                runtime.templateDraft = null;
                runtime.templateStep = 'details';
                runtime.showShareModal = false;
                clearExamRegionCache();
                renderConsole('full');
            };

            function beginExamTemplateCreation() {
                runtime.activeTab = 'templates';
                runtime.templateDraft = createTemplateDraft();
                runtime.templateStep = 'details';
                clearExamRegionCache();
                renderConsole('full');
            };

            function editExamTemplate(templateId) {
                const template = getTemplateById(templateId);
                if (!template) return;
                runtime.activeTab = 'templates';
                runtime.templateDraft = createTemplateDraft(template);
                runtime.templateStep = 'details';
                clearExamRegionCache();
                renderConsole('full');
            };

            function duplicateExamTemplate(templateId) {
                const template = getTemplateById(templateId);
                if (!template) return;
                const duplicated = createTemplateDraft({
                    ...template,
                    id: '',
                    title: `${template.title || template.subjectName || 'Exam'} copy`,
                    status: 'draft'
                });
                duplicated.editingTemplateId = '';
                runtime.templateDraft = duplicated;
                runtime.activeTab = 'templates';
                runtime.templateStep = 'details';
                clearExamRegionCache();
                renderConsole('full');
            };

            function updateExamTemplateField(field, value) {
                const draft = getTemplateDraft();
                if (field === 'subjectId') {
                    const subject = getSubjectById(value);
                    const defaults = getQuestionDefaultsForSubject(value);
                    draft.subjectId = String(value || '').trim();
                    draft.subjectName = String(subject?.name || value || '').trim();
                    draft.defaultQuestionScore = defaults.score;
                    draft.defaultOptionCount = defaults.optionCount;
                } else if (field === 'durationMinutes') {
                    draft.durationMinutes = Math.max(1, parseInt(value, 10) || 90);
                } else if (field === 'passingScore') {
                    draft.passingScore = clampPositiveInt(value, 50, 0, 999);
                } else if (field === 'gradingWeight') {
                    draft.gradingWeight = clampPositiveInt(value, 30, 0, 999);
                } else if (field === 'defaultQuestionScore') {
                    draft.defaultQuestionScore = clampPositiveInt(value, 1, 1, 999);
                    saveQuestionDefaultsForSubject(draft.subjectId, getDraftQuestionDefaults(draft));
                } else if (field === 'defaultOptionCount') {
                    draft.defaultOptionCount = clampPositiveInt(value, 4, 2, 8);
                    saveQuestionDefaultsForSubject(draft.subjectId, getDraftQuestionDefaults(draft));
                } else if (field === 'examType') {
                    draft.examType = ['digital', 'paper'].includes(String(value||'').trim()) ? String(value).trim() : 'digital';
                } else if (field === 'status') {
                    draft[field] = String(value || '').trim().toLowerCase();
                } else {
                    draft[field] = String(value || '');
                }
                patchExamBuilderSummary();
                syncBuilderToolbarTitle();
                if (field === 'subjectId') syncBuilderSubjectDefaultInputs(draft);
            };

            function syncExamTemplateField(field, value) {
                const draft = getTemplateDraft();
                if (field === 'subjectId') {
                    const subject = getSubjectById(value);
                    const defaults = getQuestionDefaultsForSubject(value);
                    draft.subjectId = String(value || '').trim();
                    draft.subjectName = String(subject?.name || value || '').trim();
                    draft.defaultQuestionScore = defaults.score;
                    draft.defaultOptionCount = defaults.optionCount;
                    return;
                }
                draft[field] = value;
            };

            function setExamTemplateStep(step) {
                runtime.templateStep = ['details', 'questions', 'variants', 'review'].includes(String(step || '').trim()) ? String(step).trim() : 'details';
                clearExamRegionCache('region:builder-step');
                renderConsole('builder-step');
            };

            function addExamQuestion(type) {
                const draft = getTemplateDraft();
                draft.questions.push(createQuestion(type, getDraftQuestionDefaults(draft)));
                runtime.templateStep = 'questions';
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            function removeExamQuestion(questionId) {
                const draft = getTemplateDraft();
                draft.questions = (draft.questions || []).filter(question => String(question?.id || '').trim() !== String(questionId || '').trim());
                if (!draft.questions.length) draft.questions = [createQuestion('mcq', getDraftQuestionDefaults(draft))];
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            function updateExamQuestionField(questionId, field, value) {
                const draft = getTemplateDraft();
                const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
                if (!question) return;
                if (field === 'type') {
                    const nextType = ['mcq', 'short', 'written'].includes(String(value || '').trim()) ? String(value).trim() : 'mcq';
                    question.type = nextType;
                    if (nextType === 'mcq') applyQuestionOptionCount(question, question.optionCount || 4);
                } else if (field === 'score' || field === 'correctOption') {
                    question[field] = Math.max(0, parseInt(value, 10) || 0);
                } else if (field === 'optionCount') {
                    applyQuestionOptionCount(question, value);
                } else {
                    question[field] = String(value || '');
                }
                if (field === 'optionCount' || field === 'type') {
                    clearExamRegionCache('region:builder-step');
                }
                renderConsole('builder-partial');
            };

            function syncExamQuestionField(questionId, field, value) {
                const draft = getTemplateDraft();
                const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
                if (!question) return;
                if (field === 'type') {
                    question.type = ['mcq', 'short', 'written'].includes(String(value || '').trim()) ? String(value).trim() : 'mcq';
                } else if (field === 'score' || field === 'correctOption') {
                    question[field] = Math.max(0, parseInt(value, 10) || 0);
                } else if (field === 'optionCount') {
                    applyQuestionOptionCount(question, value);
                } else {
                    question[field] = value;
                }
            };

            function updateExamQuestionOption(questionId, optionIndex, value) {
                const draft = getTemplateDraft();
                const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
                if (!question || !Array.isArray(question.options)) return;
                question.options[optionIndex] = String(value || '');
            };

            function syncExamQuestionOption(questionId, optionIndex, value) {
                const draft = getTemplateDraft();
                const question = (draft.questions || []).find(item => String(item?.id || '').trim() === String(questionId || '').trim());
                if (!question || !Array.isArray(question.options)) return;
                question.options[optionIndex] = String(value || '');
            };

            function buildTemplateFromDraft(statusOverride = '') {
                const draft = getTemplateDraft();
                const user = getCurrentUserSafe();
                const subject = getSubjectById(draft.subjectId);
                const now = new Date().toISOString();
                const existingTemplate = getTemplateById(draft.editingTemplateId);
                return {
                    id: String(draft.editingTemplateId || makeLocalId('exam_template')).trim(),
                    faculty: String(subject?.facultyCode || getCurrentFacultyCode()).trim().toUpperCase(),
                    title: String(draft.title || `${draft.subjectName || draft.subjectId || 'Exam'} ${draft.variantLabel || ''}`).trim(),
                    subjectId: String(draft.subjectId || '').trim(),
                    subjectName: String(subject?.name || draft.subjectName || draft.subjectId || '').trim(),
                    courseNumber: String(draft.courseNumber || '').trim(),
                    courseCode: String(draft.courseCode || '').trim(),
                    variantLabel: String(draft.variantLabel || 'Variant A').trim(),
                    instructions: String(draft.instructions || '').trim(),
                    status: String(statusOverride || draft.status || 'draft').trim().toLowerCase(),
                    /* Legacy flat questions kept for backward compat */
                    questions: (draft.questionBank || draft.questions || []).map(normalizeQuestion),
                    /* â”€â”€ New fields â”€â”€ */
                    examType: String(draft.examType || 'digital').trim(),
                    durationMinutes: Math.max(1, parseInt(draft.durationMinutes, 10) || 90),
                    passingScore: clampPositiveInt(draft.passingScore, 50, 0, 999),
                    gradingWeight: clampPositiveInt(draft.gradingWeight, 30, 0, 999),
                    defaultQuestionScore: clampPositiveInt(draft.defaultQuestionScore, 1, 1, 999),
                    defaultOptionCount: clampPositiveInt(draft.defaultOptionCount, 4, 2, 8),
                    questionBank: (draft.questionBank || []).map(normalizeQuestion),
                    variants: clone(draft.variants || []),
                    sharedWith: clone(draft.sharedWith || []),
                    lockedBy: draft.lockedBy || null,
                    revisionNote: String(statusOverride === 'returned' ? (draft.revisionNote || '') : (existingTemplate?.revisionNote || '')).trim(),
                    /* â”€â”€ Existing meta â”€â”€ */
                    createdAt: existingTemplate?.createdAt || now,
                    updatedAt: now,
                    createdBy: String(existingTemplate?.createdBy || user?.id || '').trim(),
                    createdByName: String(existingTemplate?.createdByName || getCurrentStaffName()).trim(),
                    lastEditedBy: String(user?.id || '').trim(),
                    lastEditedByName: getCurrentStaffName(),
                    approvedBy: statusOverride === 'approved' ? getCurrentStaffName() : String(existingTemplate?.approvedBy || '').trim(),
                    approvedAt: statusOverride === 'approved' ? now : String(existingTemplate?.approvedAt || '').trim()
                };
            }

            function saveExamTemplateDraft() {
                const template = buildTemplateFromDraft();
                if (!template.subjectId || !template.title || !(template.questionBank || template.questions || []).length) {
                    notify('Exam needs a subject, title, and at least one question in the bank.');
                    return;
                }
                upsertTemplate(template);
                runtime.templateDraft = null;
                notify('Quiz draft saved.');
                clearExamRegionCache();
                renderConsole('full');
            };

            function saveAndSubmitExamTemplate() {
                const template = buildTemplateFromDraft('submitted');
                if (!template.subjectId || !template.title || !(template.questionBank || template.questions || []).length) {
                    notify('Exam needs a subject, title, and at least one question in the bank.');
                    return;
                }
                if (!(template.variants || []).length) {
                    notify('Please generate at least one variant before submitting.');
                    return;
                }
                upsertTemplate(template);
                runtime.templateDraft = createTemplateDraft(template);
                notify('Exam submitted to admin for review.');
                clearExamRegionCache(['region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            /* â”€â”€ Question Bank CRUD â”€â”€ */
            function navigateBankQuestion(page) {
                const draft = getTemplateDraft();
                const total = (draft.questionBank || []).length;
                runtime.currentBankPage = Math.max(0, Math.min(page, total - 1));
                clearExamRegionCache('region:builder-step');
                renderConsole('builder-step');
            };

            function addExamBankQuestion(type) {
                const draft = getTemplateDraft();
                draft.questionBank.push(createQuestion('mcq', getDraftQuestionDefaults(draft)));
                runtime.currentBankPage = draft.questionBank.length - 1;
                runtime.templateStep = 'questions';
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            function removeExamBankQuestion(questionId) {
                const draft = getTemplateDraft();
                draft.questionBank = (draft.questionBank || []).filter(q => String(q?.id||'').trim() !== String(questionId||'').trim());
                if (!draft.questionBank.length) draft.questionBank = [createQuestion('mcq', getDraftQuestionDefaults(draft))];
                /* Adjust current page if needed */
                runtime.currentBankPage = Math.max(0, Math.min(runtime.currentBankPage, draft.questionBank.length - 1));
                /* Also remove from any variants */
                (draft.variants || []).forEach(v => {
                    v.questionIds = (v.questionIds || []).filter(id => id !== questionId);
                });
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            function updateExamBankQuestionField(questionId, field, value) {
                const draft = getTemplateDraft();
                const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
                if (!question) return;
                if (field === 'type') {
                    question.type = 'mcq';
                    applyQuestionOptionCount(question, question.optionCount || 4);
                } else if (field === 'score' || field === 'correctOption') {
                    question[field] = Math.max(0, parseInt(value, 10) || 0);
                } else if (field === 'optionCount') {
                    applyQuestionOptionCount(question, value);
                } else {
                    question[field] = String(value || '');
                }
                if (field === 'optionCount' || field === 'type') {
                    clearExamRegionCache('region:builder-step');
                }
                renderConsole('builder-partial');
            };

            function syncExamBankQuestionField(questionId, field, value) {
                const draft = getTemplateDraft();
                const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
                if (!question) return;
                if (field === 'score' || field === 'correctOption') {
                    question[field] = Math.max(0, parseInt(value, 10) || 0);
                } else if (field === 'optionCount') {
                    applyQuestionOptionCount(question, value);
                } else {
                    question[field] = value;
                }
            };

            function updateExamBankQuestionOption(questionId, optionIndex, value) {
                const draft = getTemplateDraft();
                const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
                if (!question || !Array.isArray(question.options)) return;
                question.options[optionIndex] = String(value || '');
            };

            function syncExamBankQuestionOption(questionId, optionIndex, value) {
                const draft = getTemplateDraft();
                const question = (draft.questionBank || []).find(q => String(q?.id||'').trim() === String(questionId||'').trim());
                if (!question || !Array.isArray(question.options)) return;
                question.options[optionIndex] = String(value || '');
            };

            /* â”€â”€ Auto-Variant Generator â”€â”€ */
            function runAutoGenerateVariants() {
                const draft = getTemplateDraft();
                const bank = draft.questionBank || [];
                if (!bank.length) {
                    notify('Add questions to the bank first before generating variants.');
                    return;
                }
                const count = Math.max(1, Math.min(26, runtime.autoGenVariantCount || 3));
                const perVariant = Math.max(1, runtime.autoGenQuestionsPerVariant || 10);
                draft.variants = autoGenerateVariants(bank, count, perVariant);
                notify(`Generated ${draft.variants.length} variants with ${perVariant} questions each.`);
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            function addManualVariant() {
                const draft = getTemplateDraft();
                const existingCount = (draft.variants || []).length;
                const label = `Variant ${String.fromCharCode(65 + existingCount)}`;
                draft.variants = draft.variants || [];
                draft.variants.push({
                    id: makeLocalId('variant'),
                    label,
                    questionIds: (draft.questionBank || []).map(q => q.id),
                    shuffleQuestions: true,
                    shuffleOptions: true
                });
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            function removeVariant(variantId) {
                const draft = getTemplateDraft();
                draft.variants = (draft.variants || []).filter(v => v.id !== variantId);
                clearExamRegionCache(['region:builder-step', 'region:builder-summary', 'region:builder-stepper']);
                renderConsole('builder-partial');
            };

            /* â”€â”€ Share Modal â”€â”€ */
            function openShareModalInternal(templateId) {
                if (templateId) {
                    const template = getTemplateById(templateId);
                    if (template) {
                        runtime.templateDraft = createTemplateDraft(template);
                    }
                }
                runtime.showShareModal = true;
                runtime.shareSearchQuery = '';
                renderConsole('modal');
            }

            function closeShareModalInternal() {
                runtime.showShareModal = false;
                renderConsole('modal');
            }

            function shareExamWithInternal(userId, userName) {
                const draft = getTemplateDraft();
                if (!draft) return;
                draft.sharedWith = draft.sharedWith || [];
                if (draft.sharedWith.some(s => s.userId === userId)) return;
                draft.sharedWith.push({ userId, userName, sharedAt: new Date().toISOString() });
                /* Auto-save */
                const template = buildTemplateFromDraft();
                upsertTemplate(template);
                runtime.templateDraft = createTemplateDraft(template);
                runtime.showShareModal = true;
                notify(`Exam shared with ${userName}.`);
                renderConsole('modal');
            }

            /* â”€â”€ Approve Template (Admin) â”€â”€ */
            function saveAndApproveExamTemplate(templateId) {
                const template = getTemplateById(templateId);
                if (!template) { alert('Template not found.'); return; }
                const now = new Date().toISOString();
                upsertTemplate({
                    ...template,
                    status: 'approved',
                    approvedAt: now,
                    approvedBy: getCurrentStaffName(),
                    updatedAt: now
                });
                notify('Exam template approved.');
                clearExamRegionCache(['region:body', 'region:chrome']);
                renderConsole(['chrome', 'body']);
            };

            /* â”€â”€ Return for Revision â”€â”€ */
            function openReturnModalInternal(templateId) {
                runtime.showReturnModal = true;
                runtime.returnTemplateId = String(templateId || '').trim();
                runtime.returnNote = '';
                renderConsole('modal');
            }

            function closeReturnModalInternal() {
                runtime.showReturnModal = false;
                runtime.returnTemplateId = '';
                runtime.returnNote = '';
                renderConsole('modal');
            }

            function executeReturnForRevisionInternal() {
                if (!runtime.returnNote.trim()) {
                    notify('Please provide feedback for the Professor/TA.');
                    return;
                }
                const template = getTemplateById(runtime.returnTemplateId);
                if (!template) return;
                upsertTemplate({
                    ...template,
                    status: 'returned',
                    revisionNote: runtime.returnNote.trim(),
                    updatedAt: new Date().toISOString(),
                    lastEditedByName: getCurrentStaffName()
                });
                notify('Exam returned to creator with feedback.');
                runtime.showReturnModal = false;
                runtime.returnTemplateId = '';
                runtime.returnNote = '';
                clearExamRegionCache(['region:body', 'region:chrome', 'region:modal']);
                renderConsole(['chrome', 'body']);
            }

            window.openShareModal = openShareModalInternal;
            window.closeShareModal = closeShareModalInternal;
            window.shareExamWith = shareExamWithInternal;
            window.openReturnModal = openReturnModalInternal;
            window.closeReturnModal = closeReturnModalInternal;
            window.executeReturnForRevision = executeReturnForRevisionInternal;

            /* â”€â”€ Staff Sub-Tab â”€â”€ */
            function setExamStaffSubTab(tab) {
                runtime.staffSubTab = STAFF_SUB_TABS.includes(String(tab||'').trim()) ? String(tab).trim() : 'my_drafts';
                clearExamRegionCache('region:body');
                renderConsole('body');
            };


            /* â”€â”€ Schedule Field Handlers â”€â”€ */
            function updateExamScheduleField(field, value) {
                const draft = getScheduleDraft();
                if (field === 'suspendsClasses') {
                    draft.suspendsClasses = !!value;
                } else if (field === 'roomCapacity') {
                    draft.roomCapacity = Math.max(0, parseInt(value, 10) || 0);
                } else {
                    draft[field] = String(value || '').trim();
                }
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function syncExamScheduleField(field, value) {
                const draft = getScheduleDraft();
                draft[field] = String(value || '').trim();
            };

            function saveExamSchedule() {
                const draft = getScheduleDraft();
                const template = getTemplateById(draft.templateId);
                if (!template) { notify('Please select an approved template first.'); return; }
                if (!draft.startAt || !draft.endAt) { notify('Start and end time are required.'); return; }
                const selectedStudents = getSelectedStudentsForSchedule(draft, template);
                if (!selectedStudents.length) { notify('No students selected for this session.'); return; }
                const existingSessions = getSessions();
                const collisions = detectScheduleCollisions(draft, existingSessions);
                if (collisions.hard.length) { notify('Cannot save: ' + collisions.hard[0]); return; }
                const session = {
                    id: String(draft.editingSessionId || makeLocalId('exam_session')).trim(),
                    templateId: String(draft.templateId).trim(),
                    title: String(template.title || template.subjectName || 'Exam').trim(),
                    subjectId: String(template.subjectId || '').trim(),
                    subjectName: String(template.subjectName || '').trim(),
                    variantLabel: String(template.variantLabel || '').trim(),
                    startAt: String(draft.startAt).trim(),
                    endAt: String(draft.endAt).trim(),
                    durationMinutes: parseInt(draft.durationMinutes, 10) || 120,
                    placeLabel: String(draft.placeLabel || '').trim(),
                    roomLabel: String(draft.roomLabel || '').trim(),
                    roomCapacity: parseInt(draft.roomCapacity, 10) || 0,
                    observerNames: uniqueStrings(String(draft.observerNamesText || '').split(',').map(s => s.trim())),
                    cohortKeys: clone(draft.selectedCohortKeys || []),
                    assignedStudentIds: selectedStudents.map(s => s.id),
                    suspendsClasses: draft.suspendsClasses,
                    published: false,
                    createdAt: new Date().toISOString()
                };
                const sessions = getSessions();
                const existIndex = sessions.findIndex(s => s.id === session.id);
                if (existIndex >= 0) sessions[existIndex] = session;
                else sessions.push(session);
                runtime.scheduleDraft = createScheduleDraft();
                notify('Exam session saved successfully.');
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function clearExamScheduleDraft() {
                runtime.scheduleDraft = createScheduleDraft();
                clearExamRegionCache('region:body');
                renderConsole('body');
            };

            function getExamProtectedSessionKeys(session) {
                return {
                    courseId: String(session?.protectedCourseId || `exam-session::${session?.id || ''}`).trim(),
                    quizId: String(session?.protectedQuizId || session?.id || '').trim()
                };
            }

            function findExamAttemptEntry(sessionId, studentId) {
                return getAttemptsForSession(sessionId).find(entry => String(getAttemptStudentId(entry)) === String(studentId)) || null;
            }

            async function refreshExamAttempts(sessionId) {
                await loadAttemptsForSession(sessionId, { force: true });
            };

            async function runExamStudentAction(sessionId, studentId, action) {
                const session = getSessionById(sessionId);
                if (!session || typeof performProtectedQuizStudentAction !== 'function') return;
                const keys = getExamProtectedSessionKeys(session);
                try {
                    await performProtectedQuizStudentAction(keys.courseId, keys.quizId, studentId, action, {
                        actorName: getCurrentStaffName()
                    });
                    await loadAttemptsForSession(sessionId, { force: true });
                    notify('Student exam control updated.');
                } catch (error) {
                    notify(error?.message || 'Student exam control could not be updated.');
                }
            };

            function updateExamManualGradeDraft(sessionId, studentId, questionId, value) {
                const baseKey = `${sessionId}::${studentId}`;
                const key = questionId ? `${baseKey}::${questionId}` : baseKey;
                runtime.manualScoreDrafts[key] = String(value || '').trim();
            };

            async function saveExamManualGrade(sessionId, studentId) {
                const session = getSessionById(sessionId);
                const entry = findExamAttemptEntry(sessionId, studentId);
                const attempt = entry?.attempt || {};
                if (!session || typeof saveProtectedQuizManualGrade !== 'function') return;
                const keys = getExamProtectedSessionKeys(session);
                const manualScoresByQuestion = {};
                const questionResults = Array.isArray(attempt.questionResults) ? attempt.questionResults.map(result => ({ ...result })) : [];
                const manualResults = questionResults.filter(result => MANUAL_TYPES.has(String(result?.type || '').trim()));
                if (manualResults.length) {
                    manualResults.forEach((result, index) => {
                        const questionId = String(result.questionId || `manual_${index + 1}`);
                        const fieldKey = `${sessionId}::${studentId}::${questionId}`;
                        const maxScore = Number(result.manualMax || result.maxScore || 0);
                        const raw = Number(runtime.manualScoreDrafts[fieldKey] ?? result.manualScoreAwarded ?? result.scoreAwarded ?? 0);
                        const bounded = Number.isFinite(raw) ? Math.max(0, Math.min(maxScore, raw)) : 0;
                        manualScoresByQuestion[questionId] = bounded;
                        result.manualScoreAwarded = bounded;
                        result.scoreAwarded = bounded;
                        result.needsManualReview = false;
                        result.reviewedAt = new Date().toISOString();
                        result.reviewedBy = getCurrentStaffName();
                    });
                } else {
                    const key = `${sessionId}::${studentId}`;
                    const raw = Number(runtime.manualScoreDrafts[key] ?? attempt.manualScoreRaw ?? 0);
                    manualScoresByQuestion.manual_total = Number.isFinite(raw) ? Math.max(0, raw) : 0;
                }
                const manualScoreRaw = Object.values(manualScoresByQuestion).reduce((sum, value) => sum + Number(value || 0), 0);
                const finalScoreRaw = Math.max(0, Number(attempt.autoScoreRaw || 0) + manualScoreRaw);
                const responseSummary = {
                    ...(attempt.responseSummary || {}),
                    needsManualReview: false
                };
                try {
                    await saveProtectedQuizManualGrade(keys.courseId, keys.quizId, {
                        studentId,
                        studentName: entry?.student?.name || attempt.studentName || `Student ${studentId}`,
                        autoScoreRaw: attempt.autoScoreRaw || 0,
                        manualScoreRaw,
                        finalScoreRaw,
                        gradebookScore: finalScoreRaw,
                        requiresManualReview: false,
                        manualScoresByQuestion,
                        questionResults,
                        responseSummary,
                        gradedAt: new Date().toISOString(),
                        reviewedBy: getCurrentStaffName()
                    });
                    Object.keys(runtime.manualScoreDrafts).forEach(key => {
                        if (key.startsWith(`${sessionId}::${studentId}`)) delete runtime.manualScoreDrafts[key];
                    });
                    await loadAttemptsForSession(sessionId, { force: true });
                    notify('Manual exam grade saved.');
                } catch (error) {
                    notify(error?.message || 'Manual exam grade could not be saved.');
                }
            }

            const api = {
                renderReviewTab,
                renderScheduleBoard,
                renderExamsAttemptsLoadingPanel,
                renderLiveTab,
                renderResultsTab,
                hasActiveExamDraft,
                setExamRegionMarkup,
                clearExamRegionCache,
                ensureExamWorkspaceShell,
                syncWorkspaceBodyClass,
                renderWorkspaceBodyContent,
                renderExamModalMarkup,
                enhanceExamRegionPickers,
                patchExamChrome,
                patchExamBody,
                patchExamModal,
                syncBuilderToolbarTitle,
                syncBuilderSubjectDefaultInputs,
                syncBuilderStepperState,
                patchExamBuilderSummary,
                patchExamBuilderStep,
                patchExamBuilderStepper,
                patchExamBuilderPartial,
                normalizeExamDirtyRegions,
                renderWorkspace,
                renderConsole,
                handleConsoleClick,
                parseExamDelegateArgs,
                invokeExamDelegate,
                handleConsoleInput,
                handleConsoleChange,
                bindConsoleEvents,
                bootExamsConsoleOnce,
                buildTemplateFromDraft,
                openShareModalInternal,
                closeShareModalInternal,
                shareExamWithInternal,
                openReturnModalInternal,
                closeReturnModalInternal,
                executeReturnForRevisionInternal,
                getExamProtectedSessionKeys,
                findExamAttemptEntry,
                renderAdminExamSection,
                setExamTab,
                selectExamSession,
                setExamTemplateSearch,
                setExamTemplateFilter,
                setExamReviewSearch,
                setExamReviewSort,
                setExamReviewFaculty,
                toggleExamReviewApproved,
                cancelExamDraft,
                beginExamTemplateCreation,
                editExamTemplate,
                duplicateExamTemplate,
                updateExamTemplateField,
                syncExamTemplateField,
                setExamTemplateStep,
                addExamQuestion,
                removeExamQuestion,
                updateExamQuestionField,
                syncExamQuestionField,
                updateExamQuestionOption,
                syncExamQuestionOption,
                saveExamTemplateDraft,
                saveAndSubmitExamTemplate,
                navigateBankQuestion,
                addExamBankQuestion,
                removeExamBankQuestion,
                updateExamBankQuestionField,
                syncExamBankQuestionField,
                updateExamBankQuestionOption,
                syncExamBankQuestionOption,
                runAutoGenerateVariants,
                addManualVariant,
                removeVariant,
                saveAndApproveExamTemplate,
                setExamStaffSubTab,
                updateExamScheduleField,
                syncExamScheduleField,
                saveExamSchedule,
                clearExamScheduleDraft,
                refreshExamAttempts,
                runExamStudentAction,
                updateExamManualGradeDraft,
                saveExamManualGrade,
            };
            Object.assign(window, api);
            return api;
        }
    };
})();
