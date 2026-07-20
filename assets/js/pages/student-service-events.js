/* Student Service delegated click/input/change/escape handlers.
 * Peeled from student-service.js. Load after student-service-chrome.js, before student-service.js.
 * Free vars resolve at call time against globals from student-service.js / domain modules.
 */
if (!window.__KIU_STUDENT_SERVICE_EVENTS_LOADED) {
window.__KIU_STUDENT_SERVICE_EVENTS_LOADED = true;

function studentServiceEventEl(event, selector, { mustBeTarget = false, container = null } = {}) {
    const el = event.target.closest(selector);
    if (!el) return null;
    if (mustBeTarget && el !== event.target) return null;
    if (container && !container.contains(el)) return null;
    return el;
}

function handleStudentServiceEscapeKey(event) {
    if (event.key !== 'Escape') return;
    if (document.querySelector('[data-student-service-delete-confirm="true"]')) {
        event.preventDefault();
        closeStudentServiceDeleteConfirm();
        return;
    }
    if (document.querySelector('[data-student-service-question-composer-modal="true"]')) {
        event.preventDefault();
        closeStudentServiceQuestionComposerModal();
        return;
    }
    if (isStudentServiceTicketThreadModalOpen()) {
        event.preventDefault();
        closeStudentServiceTicketThreadModal();
        return;
    }
    if (isStudentServiceQuestionThreadModalOpen()) {
        event.preventDefault();
        setStudentServiceOpenQuestionId('');
        return;
    }
    if (isStudentServiceInboxFilterEditorOpen()) {
        event.preventDefault();
        closeStudentServiceInboxFilterEditorModal();
        return;
    }
    if (isStudentServiceGuidanceModalOpen()) {
        event.preventDefault();
        closeStudentServiceGuidanceModal();
    }
}

function handleStudentServiceModalDocumentClick(event) {
    const modalRoot = document.getElementById('student-service-modal-root');
    if (!modalRoot || modalRoot.hasAttribute('hidden')) return false;

    const rules = [
        { sel: '[data-student-service-dismiss-delete-modal]', mustBeTarget: true, run: () => closeStudentServiceDeleteConfirm() },
        { sel: '[data-student-service-cancel-delete]', run: () => closeStudentServiceDeleteConfirm() },
        {
            sel: '[data-student-service-confirm-delete]',
            run: (el) => deleteStudentServiceQuestionAnswer(
                el.dataset.studentServiceQuestionId || '',
                el.dataset.studentServiceConfirmDelete || ''
            )
        },
        {
            sel: '[data-student-service-confirm-question-delete]',
            run: (el) => deleteStudentServiceQuestion(el.dataset.studentServiceConfirmQuestionDelete || '')
        },
        {
            sel: '[data-student-service-confirm-article-delete]',
            run: (el) => {
                if (el.disabled) return;
                deleteStudentServiceArticle(el.dataset.studentServiceConfirmArticleDelete || '');
            }
        },
        { sel: '[data-student-service-dismiss-ticket-thread-modal]', mustBeTarget: true, run: () => closeStudentServiceTicketThreadModal() },
        { sel: '[data-student-service-cancel-ticket-thread-modal]', run: () => closeStudentServiceTicketThreadModal() },
        { sel: '[data-student-service-dismiss-thread-modal]', mustBeTarget: true, run: () => setStudentServiceOpenQuestionId('') },
        { sel: '[data-student-service-cancel-thread-modal]', run: () => setStudentServiceOpenQuestionId('') },
        { sel: '[data-student-service-dismiss-composer-modal]', mustBeTarget: true, run: () => closeStudentServiceQuestionComposerModal() },
        { sel: '[data-student-service-cancel-composer-modal]', run: () => closeStudentServiceQuestionComposerModal() },
        {
            sel: '[data-student-service-draft-question-mode]',
            run: (el) => {
                setStudentServiceDraftQuestionField('askMode', el.dataset.studentServiceDraftQuestionMode || 'public');
                remountStudentServiceQuestionComposerModal();
            }
        },
        { sel: '[data-student-service-submit-question]', run: () => submitStudentServiceQuestion() },
        {
            sel: '[data-student-service-open-question]',
            run: (el) => {
                closeStudentServiceQuestionComposerModal();
                openStudentServiceQuestion(el.dataset.studentServiceOpenQuestion || '');
            }
        },
        { sel: '[data-student-service-dismiss-guidance-modal]', mustBeTarget: true, run: () => closeStudentServiceGuidanceModal() },
        { sel: '[data-student-service-cancel-guidance-modal]', run: () => closeStudentServiceGuidanceModal() },
        {
            sel: '[data-student-service-select-hub-article]',
            run: (el) => selectStudentHubArticle(
                el.dataset.studentServiceSelectHubArticle || '',
                el.dataset.studentServiceHubArea || ''
            )
        },
        { sel: '[data-student-service-article-search-clear]', run: () => setStudentServiceArticleSearch('') },
        { sel: '[data-student-service-dismiss-inbox-filter-editor-modal]', mustBeTarget: true, run: () => closeStudentServiceInboxFilterEditorModal() },
        { sel: '[data-student-service-inbox-filter-editor-close]', run: () => closeStudentServiceInboxFilterEditorModal() },
    ];

    for (const rule of rules) {
        const el = studentServiceEventEl(event, rule.sel, {
            mustBeTarget: Boolean(rule.mustBeTarget),
            container: rule.mustBeTarget ? null : modalRoot
        });
        // dismiss backdrop: mustBeTarget true, no container check (backdrop is target)
        // for non-backdrop, require modalRoot.contains
        if (!el) continue;
        if (!rule.mustBeTarget && !modalRoot.contains(el)) continue;
        if (rule.mustBeTarget && el !== event.target) continue;
        event.preventDefault();
        rule.run(el, event);
        return true;
    }

    // Inbox filter editor actions inside modal
    const savePersonalLayoutButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-save-personal]', { container: modalRoot });
    if (savePersonalLayoutButton) {
        event.preventDefault();
        saveStudentServicePersonalInboxFilterLayoutFromEditor();
        return true;
    }
    const saveSharedLayoutButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-save-shared]', { container: modalRoot });
    if (saveSharedLayoutButton) {
        event.preventDefault();
        saveStudentServiceSharedInboxFilterLayoutFromEditor();
        return true;
    }
    const resetPersonalLayoutButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-reset-personal]', { container: modalRoot });
    if (resetPersonalLayoutButton) {
        event.preventDefault();
        resetStudentServicePersonalInboxFilterLayoutFromEditor();
        return true;
    }
    const addFilterButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-add-filter]', { container: modalRoot });
    if (addFilterButton) {
        event.preventDefault();
        addStudentServiceInboxFilterEditorCustomFilter();
        return true;
    }
    const moveFilterButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-move]', { container: modalRoot });
    if (moveFilterButton) {
        event.preventDefault();
        const index = Number(moveFilterButton.dataset.studentServiceInboxFilterEditorFilterIndex || -1);
        const dir = moveFilterButton.dataset.studentServiceInboxFilterEditorMove || 'up';
        moveStudentServiceInboxFilterEditorRow(index, dir);
        return true;
    }
    const removeFilterButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-remove-filter]', { container: modalRoot });
    if (removeFilterButton) {
        event.preventDefault();
        removeStudentServiceInboxFilterEditorFilter(Number(removeFilterButton.dataset.studentServiceInboxFilterEditorRemoveFilter || -1));
        return true;
    }
    const addOptionButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-add-option]', { container: modalRoot });
    if (addOptionButton) {
        event.preventDefault();
        addStudentServiceInboxFilterEditorOption(Number(addOptionButton.dataset.studentServiceInboxFilterEditorAddOption || -1));
        return true;
    }
    const removeOptionButton = studentServiceEventEl(event, '[data-student-service-inbox-filter-editor-remove-option]', { container: modalRoot });
    if (removeOptionButton) {
        event.preventDefault();
        removeStudentServiceInboxFilterEditorOption(
            Number(removeOptionButton.dataset.studentServiceInboxFilterEditorRemoveOption || -1),
            Number(removeOptionButton.dataset.studentServiceInboxFilterEditorOptionIndex || -1)
        );
        return true;
    }
    return false;
}

function handleStudentServiceRootClick(event) {
    const laneButton = studentServiceEventEl(event, '[data-student-service-lane]');
    if (laneButton) {
        event.preventDefault();
        setStudentServiceLane(laneButton.dataset.studentServiceLane || 'service');
        return;
    }
    const studentTabButton = studentServiceEventEl(event, '[data-student-service-student-tab]');
    if (studentTabButton) {
        event.preventDefault();
        switchStudentServiceStudentTab(studentTabButton.dataset.studentServiceStudentTab || 'get_help');
        return;
    }
    const panelSwitchButton = studentServiceEventEl(event, '[data-student-service-panel-switch]');
    if (panelSwitchButton) {
        event.preventDefault();
        switchStudentServicePanel(panelSwitchButton.dataset.studentServicePanelSwitch || 'tickets');
        return;
    }
    const navigateButton = studentServiceEventEl(event, '[data-student-service-navigate]');
    if (navigateButton) {
        event.preventDefault();
        if (typeof navigate === 'function') {
            navigate(navigateButton.dataset.studentServiceNavigate || 'student-service');
        }
        return;
    }
    const openPanelButton = studentServiceEventEl(event, '[data-student-service-open-panel]');
    if (openPanelButton) {
        event.preventDefault();
        openStudentServicePanel(openPanelButton.dataset.studentServiceOpenPanel || 'tickets');
        return;
    }
    const openGuidanceModalButton = studentServiceEventEl(event, '[data-student-service-open-guidance-modal]');
    if (openGuidanceModalButton) {
        event.preventDefault();
        openStudentServiceGuidanceModal();
        return;
    }
    const ticketFilterButton = studentServiceEventEl(event, '[data-student-service-ticket-filter-field][data-student-service-ticket-filter-value]');
    if (ticketFilterButton) {
        event.preventDefault();
        setStudentServiceTicketFilter(
            ticketFilterButton.dataset.studentServiceTicketFilterField || '',
            ticketFilterButton.dataset.studentServiceTicketFilterValue || ''
        );
        return;
    }
    const toggleInternalNotesButton = studentServiceEventEl(event, '[data-student-service-toggle-internal-notes]');
    if (toggleInternalNotesButton) {
        event.preventDefault();
        toggleStudentServiceDetailSection('internalNotes');
        return;
    }
    const openTicketButton = studentServiceEventEl(event, '[data-student-service-open-ticket]');
    if (openTicketButton) {
        event.preventDefault();
        if (openTicketButton.dataset.studentServiceOpenTicketPanel) {
            openStudentServicePanel(openTicketButton.dataset.studentServiceOpenTicketPanel);
        }
        openStudentServiceTicket(openTicketButton.dataset.studentServiceOpenTicket || '');
        return;
    }
    const focusAreaButton = studentServiceEventEl(event, '[data-student-service-focus-area]');
    if (focusAreaButton) {
        event.preventDefault();
        focusStudentServiceSupportArea(focusAreaButton.dataset.studentServiceFocusArea || '');
        return;
    }
    const openTicketFullscreenButton = studentServiceEventEl(event, '[data-student-service-open-ticket-fullscreen]');
    if (openTicketFullscreenButton) {
        event.preventDefault();
        const ui = ensureStudentServiceUiState();
        const ticketId = ui.selectedTicketId || '';
        if (ticketId) openStudentServiceTicket(ticketId);
        return;
    }
    const retryBootstrapButton = studentServiceEventEl(event, '[data-student-service-retry-bootstrap]');
    if (retryBootstrapButton) {
        event.preventDefault();
        renderStudentServicePage();
        return;
    }
    const retryQaModuleButton = studentServiceEventEl(event, '[data-student-service-retry-qa-module]');
    if (retryQaModuleButton) {
        event.preventDefault();
        const bodyContainer = document.getElementById('student-service-page-body');
        const mode = retryQaModuleButton.dataset.studentServiceRetryQaModule || 'student';
        if (bodyContainer) renderStudentServiceQaModuleLoading(bodyContainer, mode);
        ensureStudentServiceQaModule()
            .then(() => rerenderStudentServicePageAfterModuleLoad())
            .catch(() => handleStudentServiceQaModuleLoadFailure(bodyContainer, mode));
        return;
    }
    const retryServiceModuleButton = studentServiceEventEl(event, '[data-student-service-retry-service-module]');
    if (retryServiceModuleButton) {
        event.preventDefault();
        const bodyContainer = document.getElementById('student-service-page-body');
        const mode = retryServiceModuleButton.dataset.studentServiceRetryServiceModule || 'service';
        if (bodyContainer) renderStudentServiceServiceModuleLoading(bodyContainer, mode);
        ensureStudentServiceServiceModule()
            .then(() => rerenderStudentServicePageAfterModuleLoad())
            .catch(() => handleStudentServiceServiceModuleLoadFailure(bodyContainer, mode));
        return;
    }
    const composerToggle = studentServiceEventEl(event, '[data-student-service-question-composer-toggle]');
    if (composerToggle) {
        event.preventDefault();
        if (composerToggle.dataset.studentServiceQuestionComposerToggle === 'open') {
            const ui = ensureStudentServiceUiState();
            if (ui.serviceLane !== 'qa') {
                ui.serviceLane = 'qa';
                writeStudentServiceStoredLane('qa');
            }
            openStudentServiceQuestionComposerModal();
        }
        return;
    }
    if (handleStudentServiceQaThreadClick(event)) return;

    const submitTicketButton = studentServiceEventEl(event, '[data-student-service-submit-ticket]');
    if (submitTicketButton) {
        event.preventDefault();
        submitStudentServiceTicket();
        return;
    }
    const editInboxFiltersButton = studentServiceEventEl(event, '[data-student-service-edit-inbox-filters]');
    if (editInboxFiltersButton) {
        event.preventDefault();
        openStudentServiceInboxFilterEditorModal();
        return;
    }
    const openArticleButton = studentServiceEventEl(event, '[data-student-service-open-article]');
    if (openArticleButton) {
        event.preventDefault();
        openStudentServiceArticle(openArticleButton.dataset.studentServiceOpenArticle || '');
        return;
    }
    const editArticleButton = studentServiceEventEl(event, '[data-student-service-edit-article]');
    if (editArticleButton) {
        event.preventDefault();
        editStudentServiceArticle(editArticleButton.dataset.studentServiceEditArticle || '');
        return;
    }
    const startNewArticleButton = studentServiceEventEl(event, '[data-student-service-start-new-article]');
    if (startNewArticleButton) {
        event.preventDefault();
        startStudentServiceNewArticle();
        return;
    }
    const assignTicketButton = studentServiceEventEl(event, '[data-student-service-assign-ticket]');
    if (assignTicketButton) {
        event.preventDefault();
        assignStudentServiceTicketToCurrentUser();
        return;
    }
    const attachButton = studentServiceEventEl(event, '[data-student-service-attach]');
    if (attachButton) {
        event.preventDefault();
        pickStudentServiceAttachments(attachButton.dataset.studentServiceAttach || '');
        return;
    }
    const removeAttachmentButton = studentServiceEventEl(event, '[data-student-service-remove-attachment]');
    if (removeAttachmentButton) {
        event.preventDefault();
        removeStudentServiceDraftAttachment(
            removeAttachmentButton.dataset.studentServiceRemoveAttachment || '',
            removeAttachmentButton.dataset.studentServiceAttachmentId || ''
        );
        return;
    }
    const addInternalNoteButton = studentServiceEventEl(event, '[data-student-service-add-internal-note]');
    if (addInternalNoteButton) {
        event.preventDefault();
        addStudentServiceInternalNote();
        return;
    }
    const replyTicketButton = studentServiceEventEl(event, '[data-student-service-reply-ticket]');
    if (replyTicketButton) {
        event.preventDefault();
        replyStudentServiceTicket();
        return;
    }
    const saveArticleButton = studentServiceEventEl(event, '[data-student-service-save-article]');
    if (saveArticleButton) {
        event.preventDefault();
        saveStudentServiceArticle(saveArticleButton.dataset.studentServiceSaveArticle === 'publish');
        return;
    }
    const deleteArticleButton = studentServiceEventEl(event, '[data-student-service-delete-article]');
    if (deleteArticleButton) {
        event.preventDefault();
        flashStudentServiceActionButton(deleteArticleButton, 'acting');
        openStudentServiceDeleteArticleConfirm(deleteArticleButton.dataset.studentServiceDeleteArticle || '');
        return;
    }
    const detailSectionButton = studentServiceEventEl(event, '[data-student-service-detail-section]');
    if (detailSectionButton) {
        event.preventDefault();
        toggleStudentServiceDetailSection(detailSectionButton.dataset.studentServiceDetailSection || '');
    }
}

function bindStudentServiceDelegatedInteractions() {
    const root = document.getElementById('page-student-service');
    if (!root || root.dataset.studentServiceInteractionsBound === '1') return;
    root.dataset.studentServiceInteractionsBound = '1';
    const modalRoot = ensureStudentServiceModalRoot();

    const syncDraftQuestionField = (node) => {
        if (!node) return;
        const field = node.dataset.studentServiceDraftQuestionField || '';
        if (!field) return;
        const value = node.type === 'checkbox' ? node.checked : node.value;
        setStudentServiceDraftQuestionField(field, value);
    };

    if (!window.__studentServiceDeleteModalInteractionsBound) {
        window.__studentServiceDeleteModalInteractionsBound = true;
        window.__studentServiceComposerModalInteractionsBound = true;
        document.addEventListener('keydown', handleStudentServiceEscapeKey);
        document.addEventListener('click', (event) => {
            handleStudentServiceModalDocumentClick(event);
        });
    }

    root.addEventListener('click', (event) => {
        handleStudentServiceRootClick(event);
    });

    document.addEventListener('change', (event) => {
        if (event.target.matches('[data-student-service-delete-attest]')) {
            syncStudentServiceDeleteConfirmGate();
        }
    });

    root.addEventListener('input', (event) => {
        if (event.target.matches('[data-student-service-draft-ticket-field]')) {
            const field = event.target.dataset.studentServiceDraftTicketField || '';
            setStudentServiceDraftTicketField(field, event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-draft-question-field]')) {
            syncDraftQuestionField(event.target);
            return;
        }
        if (event.target.matches('[data-student-service-article-search-input]')) {
            setStudentServiceArticleSearch(event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-ticket-filter-input]')) {
            setStudentServiceTicketFilter(
                event.target.dataset.studentServiceTicketFilterInput || '',
                event.target.value,
                { debounce: event.target.type === 'search' }
            );
            return;
        }
        if (event.target.matches('[data-student-service-question-filter-input]')) {
            setStudentServiceQuestionFilter(
                event.target.dataset.studentServiceQuestionFilterInput || '',
                event.target.value
            );
        }
    });

    root.addEventListener('change', (event) => {
        if (event.target.matches('[data-student-service-draft-ticket-field]')) {
            const field = event.target.dataset.studentServiceDraftTicketField || '';
            const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
            setStudentServiceDraftTicketField(field, value);
            return;
        }
        if (event.target.matches('[data-student-service-draft-question-field]')) {
            syncDraftQuestionField(event.target);
            return;
        }
        if (event.target.matches('[data-student-service-ticket-filter-input]')) {
            setStudentServiceTicketFilter(
                event.target.dataset.studentServiceTicketFilterInput || '',
                event.target.value
            );
            return;
        }
        if (event.target.matches('[data-student-service-ticket-status-select]')) {
            updateStudentServiceTicketStatus(event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-article-search-input]')) {
            setStudentServiceArticleSearch(event.target.value);
            return;
        }
        if (event.target.matches('[data-student-service-question-filter-input]')) {
            setStudentServiceQuestionFilter(
                event.target.dataset.studentServiceQuestionFilterInput || '',
                event.target.value
            );
        }
    });

    if (modalRoot && modalRoot.dataset.studentServiceModalQaInteractionsBound !== '1') {
        modalRoot.dataset.studentServiceModalQaInteractionsBound = '1';
        modalRoot.addEventListener('click', (event) => {
            if (!modalRoot.contains(event.target)) return;
            handleStudentServiceQaThreadClick(event);
        });
    }
}

window.studentServiceEventEl = studentServiceEventEl;
window.handleStudentServiceEscapeKey = handleStudentServiceEscapeKey;
window.handleStudentServiceModalDocumentClick = handleStudentServiceModalDocumentClick;
window.handleStudentServiceRootClick = handleStudentServiceRootClick;
window.bindStudentServiceDelegatedInteractions = bindStudentServiceDelegatedInteractions;
}
