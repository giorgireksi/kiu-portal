function ensureAdminLibraryState() {
    ensureLibraryCatalogState();
}

function getAdminLibraryFormSchema() {
    ensureAdminLibraryState();
    if (!Array.isArray(KIU_STATE.adminLibrary?.formSchema)) {
        if (KIU_STATE.adminLibrary) KIU_STATE.adminLibrary.formSchema = [];
    }
    if (typeof getLibraryFormSchema === 'function') {
        return getLibraryFormSchema();
    }
    return Array.isArray(KIU_STATE.adminLibrary?.formSchema)
        ? KIU_STATE.adminLibrary.formSchema.slice()
        : [];
}

function saveStatePreservingModalScroll() {
    var schemaModal = document.querySelector('.admin-library-schema-modal');
    var schemaScroll = schemaModal ? schemaModal.scrollTop : 0;
    var schemaFieldsScroll = 0;
    var schemaFieldsList = document.getElementById('schema-fields-list');
    if (schemaFieldsList) schemaFieldsScroll = schemaFieldsList.scrollTop;
    saveState();
    requestAnimationFrame(function() {
        if (schemaModal) schemaModal.scrollTop = schemaScroll;
        if (schemaFieldsList) schemaFieldsList.scrollTop = schemaFieldsScroll;
    });
}

function createAdminLibrarySelectOption(value, label) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    return option;
}

function bindAdminLibraryMutations() {
    if (window.__adminLibraryMutationsBound) return;
    window.__adminLibraryMutationsBound = true;

    bindAdminLibrarySchemaOverlayInteractions();
    bindAdminLibrarySchemaFieldsListInteractions();

    document.addEventListener('click', (event) => {
        const navHome = event.target.closest('[data-admin-library-nav-home]');
        if (navHome) {
            if (typeof window.navigate === 'function') window.navigate('home');
            return;
        }

        const openSchema = event.target.closest('[data-admin-library-open-schema-editor]');
        if (openSchema) {
            openLibrarySchemaModal();
            return;
        }

        const addBook = event.target.closest('[data-admin-library-add-book]');
        if (addBook) {
            addAdminLibraryBook();
            return;
        }

        const openSectionsManager = event.target.closest('[data-admin-library-open-sections-manager]');
        if (openSectionsManager) {
            openLibrarySectionsModal();
            return;
        }

        const addCatalogSection = event.target.closest('[data-admin-library-add-catalog-section]');
        if (addCatalogSection) {
            handleAdminLibraryAddCatalogSectionFromModal();
            return;
        }

        const requestRemoveSection = event.target.closest('[data-admin-library-request-remove-section]');
        if (requestRemoveSection) {
            requestRemoveAdminLibrarySection(requestRemoveSection.dataset.adminLibrarySectionId);
            return;
        }

        const cancelRemoveSection = event.target.closest('[data-admin-library-cancel-remove-section]');
        if (cancelRemoveSection) {
            cancelRemoveAdminLibrarySection();
            return;
        }

        const confirmRemoveSection = event.target.closest('[data-admin-library-confirm-remove-section]');
        if (confirmRemoveSection) {
            confirmRemoveAdminLibrarySection(confirmRemoveSection.dataset.adminLibrarySectionId);
            return;
        }

        if (event.target.closest('[data-admin-library-sections-overlay]') && event.target === event.target.closest('[data-admin-library-sections-overlay]')) {
            closeLibrarySectionsModal(event);
            return;
        }

        const closeSectionsModal = event.target.closest('[data-admin-library-close-sections-modal]');
        if (closeSectionsModal) {
            closeLibrarySectionsModal(event);
            return;
        }

        if (event.target.closest('[data-admin-library-schema-overlay]') && event.target === event.target.closest('[data-admin-library-schema-overlay]')) {
            closeLibrarySchemaModal(event);
            return;
        }

        const closeSchema = event.target.closest('[data-admin-library-close-schema-modal]');
        if (closeSchema) {
            closeLibrarySchemaModal(event);
            return;
        }

        const removeBook = event.target.closest('[data-remove-book]');
        if (removeBook) {
            removeAdminLibraryBook(removeBook.dataset.bookId || '');
            return;
        }

        const actionBtn = event.target.closest('[data-admin-library-remove-action]');
        if (actionBtn) {
            if (actionBtn.dataset.pendingRemove === 'true') {
                removeAdminLibraryBook(actionBtn.dataset.adminLibraryRemoveAction);
            } else {
                document.querySelectorAll('[data-admin-library-remove-action][data-pending-remove="true"]').forEach(btn => {
                    btn.dataset.pendingRemove = 'false';
                    btn.className = 'admin-library-remove-btn lux-secondary-btn';
                    btn.innerHTML = `<i class="fas fa-trash"></i><span>Remove</span>`;
                });

                actionBtn.dataset.pendingRemove = 'true';
                actionBtn.className = 'admin-library-remove-btn lux-destructive-btn';
                actionBtn.innerHTML = `<i class="fas fa-exclamation-triangle"></i><span>Confirm Remove</span>`;
            }
            return;
        }

        if (!event.target.closest('[data-admin-library-remove-action]')) {
            document.querySelectorAll('[data-admin-library-remove-action][data-pending-remove="true"]').forEach(btn => {
                btn.dataset.pendingRemove = 'false';
                btn.className = 'admin-library-remove-btn lux-secondary-btn';
                btn.innerHTML = `<i class="fas fa-trash"></i><span>Remove</span>`;
            });
        }

        const removeSchemaFieldBtn = event.target.closest('[data-admin-library-remove-schema-field]');
        if (removeSchemaFieldBtn) {
            const fieldId = removeSchemaFieldBtn.dataset.adminLibraryRemoveSchemaField || removeSchemaFieldBtn.dataset.fieldId;
            if (fieldId) {
                event.preventDefault();
                event.stopPropagation();
                removeSchemaField(fieldId);
            }
            return;
        }

        if (event.target.closest('.lux-picker-field, #lux-topbar, .lux-picker-panel, .lux-utility-panel, .lux-user-menu, #lux-studio-backdrop')) return;
        if (typeof closePickerPanels === 'function') closePickerPanels();
    });
}

function bindAdminLibraryInteractions() {
    if (window.__adminLibraryInteractionsBound) return;
    window.__adminLibraryInteractionsBound = true;
    if (typeof LibraryCatalogView?.bindCatalogInteractions === 'function') {
        LibraryCatalogView.bindCatalogInteractions({ mode: 'admin' });
    }
    bindAdminLibraryMutations();
}

function renderAdminLibraryFilters() {
    ensureAdminLibraryState();
    if (typeof LibraryCatalogView?.renderCatalogFilters === 'function') {
        LibraryCatalogView.renderCatalogFilters('admin');
    }
}

function renderAdminLibraryFormSelects() {
    ensureAdminLibraryState();
    const params = KIU_STATE.adminLibrary.params;
    const renderSelect = (id, items) => {
        const el = document.getElementById(id);
        if (!el) return;
        const current = el.value;
        const fragment = document.createDocumentFragment();
        (Array.isArray(items) ? items : []).forEach((item) => {
            fragment.appendChild(createAdminLibrarySelectOption(String(item), String(item)));
        });
        el.replaceChildren(fragment);
        if (current && Array.from(el.options).some((option) => option.value === current)) {
            el.value = current;
        }
    };
    renderSelect('book-thematic', params.thematic);
    renderSelect('book-language', params.language);
    renderSelect('book-status', params.status);
}

function createSchemaFieldRow(field, index) {
    const row = document.createElement('div');
    row.className = 'admin-library-schema-field-row';
    row.dataset.fieldId = field.id;

    const typeBadge = document.createElement('span');
    typeBadge.className = 'admin-library-schema-type-badge';
    if (field.type === 'droplist') typeBadge.classList.add('type-droplist');
    typeBadge.textContent = field.type;
    row.appendChild(typeBadge);

    const info = document.createElement('div');
    info.className = 'admin-library-schema-field-info';

    const label = document.createElement('strong');
    label.textContent = field.label;
    info.appendChild(label);

    const meta = document.createElement('span');
    meta.className = 'admin-library-schema-field-meta';
    meta.textContent = field.core ? 'Core field' : 'Custom field';
    info.appendChild(meta);

    row.appendChild(info);

    const actions = document.createElement('div');
    actions.className = 'admin-library-schema-field-actions';

    if (field.type === 'droplist') {
        row.classList.add('admin-library-schema-field-droplist');
        row.addEventListener('click', (event) => {
            if (event.target.closest('.admin-library-schema-field-actions')) return;
            openDroplistOptionsEditor(field.id);
        });
        const optionsBtn = document.createElement('button');
        optionsBtn.className = 'admin-library-schema-btn-options';
        optionsBtn.type = 'button';
        optionsBtn.dataset.adminLibraryEditDroplistOptions = field.id;
        optionsBtn.dataset.luxSkipModernButton = 'true';
        optionsBtn.innerHTML = '<i class="fas fa-sliders-h" aria-hidden="true"></i>';
        optionsBtn.setAttribute('aria-label', `Edit options for ${field.label}`);
        optionsBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openDroplistOptionsEditor(field.id);
        });
        actions.appendChild(optionsBtn);
    }

    const removeBtn = document.createElement('button');
    removeBtn.className = 'admin-library-schema-btn-remove';
    removeBtn.type = 'button';
    removeBtn.dataset.adminLibraryRemoveSchemaField = field.id;
    removeBtn.dataset.luxSkipModernButton = 'true';
    removeBtn.innerHTML = '<i class="fas fa-trash" aria-hidden="true"></i>';
    removeBtn.setAttribute('aria-label', `Remove ${field.label}`);
    removeBtn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        removeSchemaField(field.id);
    });
    actions.appendChild(removeBtn);

    row.appendChild(actions);
    return row;
}

function renderSchemaFieldsList() {
    ensureAdminLibraryState();
    const list = document.getElementById('schema-fields-list');
    const count = document.getElementById('schema-field-count');
    if (!list) return;

    const schema = getAdminLibraryFormSchema();
    if (count) count.textContent = `${schema.length} field${schema.length === 1 ? '' : 's'}`;

    if (!schema.length) {
        list.innerHTML = '<div class="admin-library-schema-empty">No fields defined</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    schema.forEach((field, index) => {
        fragment.appendChild(createSchemaFieldRow(field, index));
    });
    list.replaceChildren(fragment);
}

function generateFieldId(label) {
    return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function runWhenPortalBootstrapReady(callback) {
    if (typeof callback !== 'function') return;
    if (window.__KIU_PORTAL_BOOTSTRAP_PENDING !== true) {
        callback();
        return;
    }
    const started = Date.now();
    const wait = function wait() {
        if (window.__KIU_PORTAL_BOOTSTRAP_PENDING !== true) {
            callback();
            return;
        }
        if (Date.now() - started > 15000) {
            callback();
            return;
        }
        window.setTimeout(wait, 50);
    };
    wait();
}

let adminLibraryPendingRemoveSchemaFieldId = null;

function clearSchemaFieldPendingRemove() {
    adminLibraryPendingRemoveSchemaFieldId = null;
    window.__adminLibrarySchemaPendingRemove = null;
}


function applyAdminLibraryFormSchema(nextSchema) {
    ensureAdminLibraryState();
    if (!KIU_STATE.adminLibrary) KIU_STATE.adminLibrary = {};
    KIU_STATE.adminLibrary.formSchema = (Array.isArray(nextSchema) ? nextSchema : []).map((field) => ({ ...field }));
    KIU_STATE.adminLibrary.formSchemaRevision = Date.now();
    KIU_STATE.adminLibrary.formSchemaCustomized = true;
}

function removeSchemaField(fieldId) {
    if (!fieldId) return;
    const normalizedId = String(fieldId).trim();
    if (!normalizedId) return;
    const current = getAdminLibraryFormSchema();
    if (!current.some(f => f.id === normalizedId)) return;
    applyAdminLibraryFormSchema(current.filter(f => f.id !== normalizedId));
    const filters = getAdminLibraryDroplistFilters();
    delete filters[normalizedId];
    clearSchemaFieldPendingRemove();
    persistAdminLibrarySchemaChange();
    try { console.info('[admin-library] removed schema field', normalizedId); } catch (e) {}
    refreshAdminLibrarySchemaSurfaces();
}

function handleAdminLibrarySchemaFieldsListClick(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    const editDroplistTarget = target.closest('[data-admin-library-edit-droplist-options]');
    if (editDroplistTarget) {
        const fieldId = editDroplistTarget.dataset.adminLibraryEditDroplistOptions || editDroplistTarget.dataset.fieldId;
        if (fieldId) {
            event.preventDefault();
            event.stopPropagation();
            openDroplistOptionsEditor(fieldId);
        }
        return;
    }

    const removeTarget = event.target.closest('[data-admin-library-remove-schema-field], .admin-library-schema-btn-remove');
    if (removeTarget) {
        const fieldId = removeTarget.dataset.adminLibraryRemoveSchemaField || removeTarget.dataset.fieldId;
        if (fieldId) {
            event.preventDefault();
            event.stopPropagation();
            removeSchemaField(fieldId);
        }
    }
}

function handleAdminLibrarySchemaOverlayClick(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    if (target.closest('[data-admin-library-add-schema-field]')) {
        event.preventDefault();
        event.stopPropagation();
        addSchemaField();
    }
}

function handleAdminLibraryDroplistOverlayClick(event) {
    const target = event.target;
    if (!target || !target.closest) return;

    if (target.closest('[data-admin-library-droplist-overlay]') && target === target.closest('[data-admin-library-droplist-overlay]')) {
        closeDroplistOptionsEditor();
        return;
    }

    if (target.closest('[data-admin-library-droplist-editor-back]') || target.closest('[data-admin-library-droplist-editor-cancel]')) {
        event.preventDefault();
        event.stopPropagation();
        closeDroplistOptionsEditor();
        return;
    }

    if (target.closest('[data-admin-library-droplist-add-option]')) {
        event.preventDefault();
        event.stopPropagation();
        addDroplistOptionToEditor();
        return;
    }

    if (target.closest('[data-admin-library-droplist-editor-save]')) {
        event.preventDefault();
        event.stopPropagation();
        saveDroplistOptionsEditor();
        return;
    }

    const removeOption = target.closest('[data-admin-library-droplist-remove-option]');
    if (removeOption) {
        event.preventDefault();
        event.stopPropagation();
        removeDroplistOptionFromEditor(Number.parseInt(removeOption.dataset.adminLibraryDroplistOptionIndex || '-1', 10));
    }
}

function bindAdminLibrarySchemaFieldsListInteractions() {
    const list = document.getElementById('schema-fields-list');
    if (!list || list.dataset.schemaFieldsListBound === 'true') return;
    list.dataset.schemaFieldsListBound = 'true';
    list.addEventListener('click', handleAdminLibrarySchemaFieldsListClick);
    list.addEventListener('click', handleAdminLibrarySchemaFieldsListClick, true);
}

function bindAdminLibrarySchemaOverlayInteractions() {
    const overlay = document.getElementById('library-schema-overlay');
    if (!overlay || overlay.dataset.schemaEditorBound === 'true') return;
    overlay.dataset.schemaEditorBound = 'true';
    overlay.addEventListener('click', handleAdminLibrarySchemaOverlayClick);
    overlay.addEventListener('click', handleAdminLibrarySchemaOverlayClick, true);
}

function bindAdminLibraryDroplistOverlayInteractions() {
    const overlay = document.getElementById('library-schema-droplist-overlay');
    if (!overlay || overlay.dataset.droplistEditorBound === 'true') return;
    overlay.dataset.droplistEditorBound = 'true';
    overlay.addEventListener('click', handleAdminLibraryDroplistOverlayClick);
    overlay.addEventListener('click', handleAdminLibraryDroplistOverlayClick, true);
}

function refreshAdminLibrarySchemaSurfaces() {
    renderSchemaFieldsList();
    renderAdminLibraryEntryForm();
    renderDynamicTableHeader();
    renderAdminBookCatalog();
}

function persistAdminLibrarySchemaChange() {
    try {
        saveStatePreservingModalScroll();
    } catch (error) {
        console.warn('Could not persist schema change.', error);
    }
}

let __adminLibraryDroplistEditorFieldId = null;
let __adminLibraryDroplistEditorOptions = [];

function getAdminLibraryDroplistFilters() {
    return LibraryCatalogView.getDroplistFilters('admin');
}

function setAdminLibraryDroplistFilter(fieldId, value) {
    LibraryCatalogView.setDroplistFilter('admin', fieldId, value);
}

function openDroplistOptionsEditor(fieldId) {
    const field = getAdminLibraryFormSchema().find((f) => f.id === fieldId);
    if (!field) return;
    __adminLibraryDroplistEditorFieldId = fieldId;
    __adminLibraryDroplistEditorOptions = Array.isArray(field.options) ? field.options.slice() : [];

    const title = document.getElementById('schema-droplist-editor-title');
    if (title) title.textContent = `Edit Options: ${field.label}`;

    const input = document.getElementById('schema-droplist-new-option');
    if (input) input.value = '';
    renderDroplistOptionsEditorList();

    setAdminLibrarySchemaModalOpen(false);
    setAdminLibraryDroplistModalOpen(true);
    bindAdminLibraryDroplistOverlayInteractions();
    disableHeavySurfaceObserverForDroplistModal();
}

function closeDroplistOptionsEditor() {
    var modal = document.querySelector('.admin-library-droplist-modal');
    if (modal && modal._luxHeavySurfaceInterceptor) {
        modal._luxHeavySurfaceInterceptor.disconnect();
        modal._luxHeavySurfaceInterceptor = null;
    }
    setAdminLibraryDroplistModalOpen(false);
    setAdminLibrarySchemaModalOpen(true);
    __adminLibraryDroplistEditorFieldId = null;
    __adminLibraryDroplistEditorOptions = [];
}

function renderDroplistOptionsEditorList() {
    const host = document.getElementById('schema-droplist-options-list');
    if (!host) return;

    if (!__adminLibraryDroplistEditorOptions.length) {
        host.innerHTML = '<div class="admin-library-schema-empty">No options defined</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    __adminLibraryDroplistEditorOptions.forEach((opt, index) => {
        const chip = document.createElement('span');
        chip.className = 'lux-pill admin-library-chip';

        const label = document.createElement('span');
        label.textContent = String(opt);
        chip.appendChild(label);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.dataset.adminLibraryDroplistRemoveOption = 'true';
        removeBtn.dataset.adminLibraryDroplistOptionIndex = String(index);
        removeBtn.setAttribute('aria-label', `Remove ${opt}`);
        removeBtn.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';
        chip.appendChild(removeBtn);

        fragment.appendChild(chip);
    });
    host.replaceChildren(fragment);
}

function addDroplistOptionToEditor() {
    const input = document.getElementById('schema-droplist-new-option');
    const value = (input?.value || '').trim();
    if (!value) return;
    if (__adminLibraryDroplistEditorOptions.some((opt) => String(opt).toLowerCase() === value.toLowerCase())) {
        if (input) input.value = '';
        return;
    }
    __adminLibraryDroplistEditorOptions.push(value);
    if (input) input.value = '';
    renderDroplistOptionsEditorList();
}

function removeDroplistOptionFromEditor(index) {
    if (index < 0 || index >= __adminLibraryDroplistEditorOptions.length) return;
    __adminLibraryDroplistEditorOptions.splice(index, 1);
    renderDroplistOptionsEditorList();
}

function saveDroplistOptionsEditor() {
    if (!__adminLibraryDroplistEditorFieldId) return;
    const schema = getAdminLibraryFormSchema();
    const field = schema.find((f) => f.id === __adminLibraryDroplistEditorFieldId);
    if (!field) {
        closeDroplistOptionsEditor();
        return;
    }
    const nextOptions = __adminLibraryDroplistEditorOptions.slice();
    if (!nextOptions.length) {
        alert('A droplist must have at least one option.');
        return;
    }
    applyAdminLibraryFormSchema(
        schema.map((f) => (f.id === __adminLibraryDroplistEditorFieldId ? { ...f, options: nextOptions } : f))
    );
    setAdminLibraryDroplistFilter(__adminLibraryDroplistEditorFieldId, 'all');
    persistAdminLibrarySchemaChange();
    refreshAdminLibrarySchemaSurfaces();
    closeDroplistOptionsEditor();
}

function resetAdminLibrarySchemaAddForm() {
    const labelInput = document.getElementById('schema-new-label');
    const placeholderInput = document.getElementById('schema-new-placeholder');
    const typeSelect = document.getElementById('schema-new-type');
    const droplistCheck = document.getElementById('schema-new-is-droplist');
    if (labelInput) labelInput.value = '';
    if (placeholderInput) placeholderInput.value = '';
    if (typeSelect) typeSelect.value = 'text';
    if (droplistCheck) droplistCheck.checked = false;
}

function addSchemaField() {
    const label = document.getElementById('schema-new-label').value.trim();
    const baseType = document.getElementById('schema-new-type').value;
    const placeholder = document.getElementById('schema-new-placeholder').value.trim();
    const isDroplist = document.getElementById('schema-new-is-droplist').checked;

    if (!label) return alert('Please enter a field label');

    const id = generateFieldId(label);
    const current = getAdminLibraryFormSchema();

    if (current.some(f => f.id === id)) return alert('A field with this name already exists');

    const type = isDroplist ? 'droplist' : baseType;
    const newField = { id, label, type, placeholder, core: false };

    if (type === 'droplist') {
        newField.options = [];
    }

    applyAdminLibraryFormSchema([...current, newField]);
    resetAdminLibrarySchemaAddForm();
    persistAdminLibrarySchemaChange();
    refreshAdminLibrarySchemaSurfaces();

    if (type === 'droplist') {
        openDroplistOptionsEditor(id);
    }
}

function createDynamicFormField(field) {
    const label = document.createElement('label');
    label.className = field.id === 'pdfLink'
        ? 'lux-picker-field alib-field-wide'
        : 'lux-picker-field';

    const span = document.createElement('span');
    span.className = 'lux-picker-label';
    span.textContent = field.label;
    label.appendChild(span);

    let input;
    if (field.type === 'select' || field.type === 'droplist') {
        input = document.createElement('select');
        input.className = 'lux-control lux-modern-field';
        
        if (field.paramKey && KIU_STATE.adminLibrary.params[field.paramKey]) {
            KIU_STATE.adminLibrary.params[field.paramKey].forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
        } else if (field.options) {
            field.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                input.appendChild(option);
            });
        }
    } else {
        input = document.createElement('input');
        input.type = field.type;
        input.className = 'lux-control lux-modern-field';
        if (field.placeholder) input.placeholder = field.placeholder;
    }

    input.id = `book-${field.id}`;
    input.name = `book_${field.id}`;
    label.appendChild(input);
    return label;
}

function renderDynamicBookForm() {
    ensureAdminLibraryState();
    const grid = document.querySelector('.alib-panel--entry .alib-form-grid');
    if (!grid) return;

    const schema = getAdminLibraryFormSchema();
    if (!schema.length) {
        grid.innerHTML = '<div class="admin-library-schema-empty">No form fields defined. Use Editor to add fields.</div>';
        return;
    }

    const fragment = document.createDocumentFragment();
    schema.forEach((field) => {
        fragment.appendChild(createDynamicFormField(field));
    });
    grid.replaceChildren(fragment);
}

function renderAdminLibraryEntryForm() {
    renderDynamicBookForm();
    renderAdminLibraryFormSelects();
}

function disableHeavySurfaceObserverForModal() {
    var modal = document.querySelector('.admin-library-schema-modal');
    if (!modal) return;
    var mo = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].attributeName === 'data-lux-observed-surface') {
                if (modal.dataset.luxObservedSurface === '1') {
                    modal.removeAttribute('data-lux-observed-surface');
                    modal.removeAttribute('data-lux-offscreen');
                }
            }
        }
    });
    mo.observe(modal, { attributes: true, attributeFilter: ['data-lux-observed-surface'] });
    modal._luxHeavySurfaceInterceptor = mo;
}

function disableHeavySurfaceObserverForDroplistModal() {
    var modal = document.querySelector('.admin-library-droplist-modal');
    if (!modal) return;
    var mo = new MutationObserver(function(mutations) {
        for (var i = 0; i < mutations.length; i++) {
            if (mutations[i].attributeName === 'data-lux-observed-surface') {
                if (modal.dataset.luxObservedSurface === '1') {
                    modal.removeAttribute('data-lux-observed-surface');
                    modal.removeAttribute('data-lux-offscreen');
                }
            }
        }
    });
    mo.observe(modal, { attributes: true, attributeFilter: ['data-lux-observed-surface'] });
    modal._luxHeavySurfaceInterceptor = mo;
}

const ADMIN_LIBRARY_MODAL_IDS = [
    'library-schema-overlay',
    'library-schema-droplist-overlay',
    'library-sections-overlay'
];

function syncAdminLibraryModalBodyLock() {
    const anyOpen = ADMIN_LIBRARY_MODAL_IDS.some(
        (id) => document.getElementById(id)?.classList.contains('active')
    );
    document.body.classList.toggle('admin-library-modal-open', anyOpen);
}

function setAdminLibrarySchemaModalOpen(isOpen) {
    const overlay = document.getElementById('library-schema-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminLibraryModalBodyLock();
}

function setAdminLibraryDroplistModalOpen(isOpen) {
    const overlay = document.getElementById('library-schema-droplist-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminLibraryModalBodyLock();
}

function ensureAdminLibrarySchemaEditorReady() {
    bindAdminLibrarySchemaFieldsListInteractions();
    renderSchemaFieldsList();
    resetAdminLibrarySchemaAddForm();
    toggleSchemaOptionsField();
    const droplist = document.getElementById('library-schema-droplist-overlay');
    if (droplist?.classList.contains('active')) {
        setAdminLibraryDroplistModalOpen(false);
    }
}

function openLibrarySchemaModal() {
    clearSchemaFieldPendingRemove();
    setAdminLibrarySchemaModalOpen(true);
    bindAdminLibrarySchemaOverlayInteractions();
    ensureAdminLibrarySchemaEditorReady();
    disableHeavySurfaceObserverForModal();
}

function closeLibrarySchemaModal(event) {
    if (event && event.target.id !== 'library-schema-overlay' && !event.target.closest('.close-btn')) return;
    clearSchemaFieldPendingRemove();
    var modal = document.querySelector('.admin-library-schema-modal');
    if (modal && modal._luxHeavySurfaceInterceptor) {
        modal._luxHeavySurfaceInterceptor.disconnect();
        modal._luxHeavySurfaceInterceptor = null;
    }
    setAdminLibrarySchemaModalOpen(false);
    renderAdminBookCatalog();
}

function toggleSchemaOptionsField() {
    // No-op: options are managed inside the separated droplist editor after creation.
}

function addAdminLibraryBook() {
    ensureAdminLibraryState();
    const schema = getAdminLibraryFormSchema();
    const bookData = { id: `LIB-${Date.now()}`, createdAt: new Date().toISOString() };
    const missing = [];

    schema.forEach((field) => {
        const input = document.getElementById(`book-${field.id}`);
        let value = input?.value || '';

        if (field.type === 'number') {
            const digits = value.replace(/[^\d]/g, '');
            value = digits ? Number.parseInt(digits, 10) : '';
        } else {
            value = value.trim();
        }

        const isRequired = field.core === true || field.required === true;
        if (isRequired && (value === '' || value === null || value === undefined)) {
            missing.push(field.label);
        }

        bookData[field.id] = value;
    });

    if (missing.length) {
        alert(`Please fill required fields: ${missing.join(', ')}`);
        return;
    }

    bookData.sectionId = typeof getActiveLibrarySectionId === 'function'
        ? getActiveLibrarySectionId()
        : 'books';

    KIU_STATE.adminLibrary.books.unshift(bookData);
    saveState();

    schema.forEach((field) => {
        const input = document.getElementById(`book-${field.id}`);
        if (input) input.value = '';
    });

    renderAdminBookCatalog();
}

function removeAdminLibraryBook(bookId) {
    ensureAdminLibraryState();
    KIU_STATE.adminLibrary.books = KIU_STATE.adminLibrary.books.filter((book) => String(book.id) !== String(bookId));
    saveState();
    renderAdminBookCatalog();
}

function renderDynamicTableHeader() {
    LibraryCatalogView.renderCatalogTableHeader('admin');
}

function syncAdminLibraryCatalogTabsRail() {
    LibraryCatalogView.syncCatalogTabsRail();
}

function renderAdminLibraryCatalogTabs() {
    LibraryCatalogView.renderCatalogTabs('admin');
}

let adminLibraryPendingRemoveSectionId = null;

function getAdminLibrarySectionBookCount(sectionId) {
    ensureAdminLibraryState();
    const normalized = String(sectionId || '');
    return (KIU_STATE.adminLibrary.books || []).filter((book) => (
        String(book.sectionId || 'books') === normalized
    )).length;
}

function setAdminLibrarySectionsModalOpen(isOpen) {
    const overlay = document.getElementById('library-sections-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminLibraryModalBodyLock();
}

function renderAdminLibrarySectionsList() {
    const host = document.getElementById('admin-library-sections-list');
    if (!host) return;

    const sections = typeof getLibraryCatalogSections === 'function'
        ? getLibraryCatalogSections()
        : [];
    const fragment = document.createDocumentFragment();

    if (!sections.length) {
        const empty = document.createElement('div');
        empty.className = 'admin-library-sections-empty';
        empty.textContent = 'No sections yet.';
        fragment.appendChild(empty);
        host.replaceChildren(fragment);
        return;
    }

    sections.forEach((section) => {
        const row = document.createElement('div');
        row.className = 'admin-library-section-row';
        if (adminLibraryPendingRemoveSectionId === section.id) {
            row.classList.add('is-remove-pending');
        }

        const meta = document.createElement('div');
        meta.className = 'admin-library-section-row-meta';

        const title = document.createElement('strong');
        title.className = 'admin-library-section-row-title';
        title.textContent = section.label;
        meta.appendChild(title);

        const bookCount = getAdminLibrarySectionBookCount(section.id);
        const count = document.createElement('span');
        count.className = 'admin-library-section-row-count';
        count.textContent = `${bookCount} book${bookCount === 1 ? '' : 's'}`;
        meta.appendChild(count);

        row.appendChild(meta);

        if (adminLibraryPendingRemoveSectionId === section.id) {
            const confirm = document.createElement('div');
            confirm.className = 'admin-library-section-remove-confirm';

            const message = document.createElement('span');
            message.textContent = `Delete "${section.label}" and ${bookCount} book${bookCount === 1 ? '' : 's'}? This cannot be undone.`;
            confirm.appendChild(message);

            const actionRow = document.createElement('div');
            actionRow.className = 'admin-library-section-remove-actions';

            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'lux-secondary-btn';
            cancelBtn.dataset.adminLibraryCancelRemoveSection = 'true';
            cancelBtn.textContent = 'Cancel';
            actionRow.appendChild(cancelBtn);

            const confirmBtn = document.createElement('button');
            confirmBtn.type = 'button';
            confirmBtn.className = 'lux-secondary-btn lux-danger-btn';
            confirmBtn.dataset.adminLibraryConfirmRemoveSection = 'true';
            confirmBtn.dataset.adminLibrarySectionId = section.id;
            confirmBtn.textContent = 'Confirm remove';
            actionRow.appendChild(confirmBtn);

            confirm.appendChild(actionRow);
            row.appendChild(confirm);
        } else {
            const actions = document.createElement('div');
            actions.className = 'admin-library-section-row-actions';
            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'lux-secondary-btn admin-library-section-remove-btn';
            removeBtn.dataset.adminLibraryRequestRemoveSection = 'true';
            removeBtn.dataset.adminLibrarySectionId = section.id;
            removeBtn.innerHTML = '<i class="fas fa-trash-alt"></i> Remove';
            actions.appendChild(removeBtn);
            row.appendChild(actions);
        }

        fragment.appendChild(row);
    });

    host.replaceChildren(fragment);
}

function openLibrarySectionsModal() {
    adminLibraryPendingRemoveSectionId = null;
    renderAdminLibrarySectionsList();
    setAdminLibrarySectionsModalOpen(true);
}

function closeLibrarySectionsModal(event) {
    if (event && event.target.id !== 'library-sections-overlay' && !event.target.closest('.close-btn')) return;
    adminLibraryPendingRemoveSectionId = null;
    setAdminLibrarySectionsModalOpen(false);
}

function handleAdminLibraryAddCatalogSectionFromModal() {
    const input = document.getElementById('section-new-label');
    const label = (input?.value || '').trim();
    if (!label) return;
    if (typeof addLibraryCatalogSection !== 'function') return;
    const sectionId = addLibraryCatalogSection(label);
    if (!sectionId) return;
    if (input) input.value = '';
    adminLibraryPendingRemoveSectionId = null;
    saveState();
    renderAdminLibraryCatalogTabs();
    renderAdminBookCatalog();
    renderAdminLibrarySectionsList();
}

function requestRemoveAdminLibrarySection(sectionId) {
    const normalized = String(sectionId || '').trim();
    if (!normalized) return;
    adminLibraryPendingRemoveSectionId = normalized;
    renderAdminLibrarySectionsList();
}

function cancelRemoveAdminLibrarySection() {
    adminLibraryPendingRemoveSectionId = null;
    renderAdminLibrarySectionsList();
}

function confirmRemoveAdminLibrarySection(sectionId) {
    const normalized = String(sectionId || '').trim();
    if (!normalized) return;
    if (typeof removeLibraryCatalogSection !== 'function') return;
    const result = removeLibraryCatalogSection(normalized);
    if (!result) return;
    adminLibraryPendingRemoveSectionId = null;
    saveState();
    renderAdminLibraryCatalogTabs();
    renderAdminBookCatalog();
    renderAdminLibrarySectionsList();
}

function renderAdminBookCatalog() {
    LibraryCatalogView.renderCatalogTable({ mode: 'admin' });
}

function renderAdminLibrary() {
    document.title = 'KIU - Admin Library';
    if (!document.getElementById('book-catalog-body')) return;
    renderAdminLibraryEntryForm();
    renderAdminLibraryFilters();
    renderAdminLibraryCatalogTabs();
    renderDynamicTableHeader();
    renderAdminBookCatalog();
}

function renderAdminLibraryAfterBootstrap() {
    document.title = 'KIU - Admin Library';
    if (!document.getElementById('book-catalog-body')) return;
    if (typeof markPortalShellReady === 'function') {
        markPortalShellReady();
    }
    ensureAdminLibraryState();
    renderAdminLibraryEntryForm();
    renderAdminLibraryFilters();
    renderAdminLibraryCatalogTabs();
    renderDynamicTableHeader();
    renderAdminBookCatalog();
    if (document.getElementById('library-schema-overlay')?.classList.contains('active')) {
        renderSchemaFieldsList();
    }
}
window.renderAdminLibrary = renderAdminLibrary;
window.renderAdminLibraryAfterBootstrap = renderAdminLibraryAfterBootstrap;

function ensureAdminLibraryRouteVisualState() {
    const body = document.body;
    if (!body || !document.getElementById('page-library')?.querySelector('.alib-workspace')) return;
    body.classList.add('lux-route-admin-library');
    body.classList.remove('lux-route-library');
    if (!body.dataset.luxPage) body.dataset.luxPage = 'library';
    if (!body.dataset.luxEntry) body.dataset.luxEntry = 'admin-library';
}
window.ensureAdminLibraryRouteVisualState = ensureAdminLibraryRouteVisualState;

function bootAdminLibraryPage() {
    if (typeof schedulePortalShellReadyReveal === 'function') {
        schedulePortalShellReadyReveal();
    } else if (typeof markPortalShellReady === 'function') {
        markPortalShellReady();
    }

    bindAdminLibraryInteractions();
    document.body.classList.remove('role-student');
    document.body.classList.add('role-admin');
    document.title = 'KIU - Admin Library';

    const fac = localStorage.getItem('currentFaculty') || 'ECON';
    if (typeof switchFacultyTheme === 'function') {
        switchFacultyTheme(fac, { refreshDependentViews: false });
    }
    if (typeof window.refreshStandaloneDesktopRouteShellContext === 'function') {
        window.refreshStandaloneDesktopRouteShellContext({ rerender: false, refreshActiveRoute: false });
    } else if (typeof window.refreshStandaloneDesktopShellChrome === 'function') {
        window.refreshStandaloneDesktopShellChrome();
    } else if (typeof initPalette === 'function') {
        initPalette();
    }

    runWhenPortalBootstrapReady(() => {
        ensureAdminLibraryState();
        renderAdminLibrary();
        ensureAdminLibraryRouteVisualState();
        if (typeof syncTopbar === 'function') {
            syncTopbar();
        }
    });

    ensureAdminLibraryRouteVisualState();
}

window.bootAdminLibraryPage = bootAdminLibraryPage;
