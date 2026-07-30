/* READABILITY: Form builder runtime — schema edit, field actions, preview, persist.
 * Sections: Boot | Schema | Fields | Preview | Persist
 * See docs/human-maintainability.md (H2). */
// --- READABILITY: Boot ---
(function initFormBuilderRuntime() {
    'use strict';

    const NS = window.__KIU_FORM_BUILDER_NS__;
    if (NS !== 'staff' && NS !== 'student') {
        console.error('[form-builder-runtime] Set window.__KIU_FORM_BUILDER_NS__ to "staff" or "student" before loading.');
        return;
    }
    const H = NS === 'staff'
        ? {
            escapeHtml: 'staffFormEscapeHtml',
            inputTypes: 'STAFF_FORM_INPUT_TYPES',
            contentRoot: '#staff-content',
            hub: 'staff-hub',
            data: 'staff',
            entity: 'staff',
            entityTitle: 'Staff',
            typeNoun: 'staff type',
            typesNoun: 'staff types',
            directoryLabel: 'Staff directory',
            addEntityLabel: 'Add Staff',
            getTypes: 'getStaffFormTypes',
            getType: 'getStaffFormType',
// --- READABILITY: Schema ---
            getSchema: 'getStaffFormSchema',
// --- READABILITY: Fields ---
            updateField: 'updateStaffFormField',
            moveField: 'moveStaffFormField',
// --- READABILITY: Persist ---
            saveBlueprint: 'saveStaffFormBlueprint',
            getBlueprint: 'getStaffFormBlueprint',
            addField: 'addStaffFormField',
            addSection: 'addStaffFormSection',
            addType: 'addStaffFormType',
            updateSection: 'updateStaffFormSection',
            moveSection: 'moveStaffFormSection',
            reorderSection: 'reorderStaffFormSection',
            reorderField: 'reorderStaffFormField',
            removeSection: 'removeStaffFormSection',
            removeField: 'removeStaffFormField',
        }
        : {
            escapeHtml: 'studentFormEscapeHtml',
            inputTypes: 'STUDENT_FORM_INPUT_TYPES',
            contentRoot: '#students-content',
            hub: 'students-hub',
            data: 'student',
            entity: 'student',
            entityTitle: 'Student',
            typeNoun: 'student type',
            typesNoun: 'student types',
            directoryLabel: 'Student directory',
            addEntityLabel: 'Add Student',
            getTypes: 'getStudentFormTypes',
            getType: 'getStudentFormType',
            getSchema: 'getStudentFormSchema',
            updateField: 'updateStudentFormField',
            moveField: 'moveStudentFormField',
            saveBlueprint: 'saveStudentFormBlueprint',
            getBlueprint: 'getStudentFormBlueprint',
            addField: 'addStudentFormField',
            addSection: 'addStudentFormSection',
            addType: 'addStudentFormType',
            updateSection: 'updateStudentFormSection',
            moveSection: 'moveStudentFormSection',
            reorderSection: 'reorderStudentFormSection',
            reorderField: 'reorderStudentFormField',
            removeSection: 'removeStudentFormSection',
            removeField: 'removeStudentFormField',
        };

    function ds(el, camelStaff, camelStudent) {
        if (!el || !el.dataset) return '';
        return NS === 'staff' ? (el.dataset[camelStaff] || '') : (el.dataset[camelStudent] || '');
    }


    const escapeHtml = typeof window[H.escapeHtml] === 'function'
        ? window[H.escapeHtml]
        : (value) => String(value ?? '');
    function contentRootEl() {
        return document.querySelector(H.contentRoot);
    }

    function contentRootId() {
        return H.contentRoot.replace(/^#/, '');
    }

    const INPUT_TYPES = Array.isArray(window[H.inputTypes])
        ? window[H.inputTypes].slice()
        : ['text', 'email', 'url', 'tel', 'date', 'number', 'textarea'];
    const BUILDER_INPUT_TYPES = INPUT_TYPES.filter((fieldType) => fieldType !== 'textarea');

    const TYPE_CATALOG = {
        text: { label: 'Text', icon: 'fas fa-font' },
        email: { label: 'Email', icon: 'fas fa-envelope' },
        url: { label: 'Website', icon: 'fas fa-link' },
        tel: { label: 'Phone', icon: 'fas fa-phone' },
        date: { label: 'Date', icon: 'fas fa-calendar-day' },
        number: { label: 'Number', icon: 'fas fa-hashtag' },
        textarea: { label: 'Long text', icon: 'fas fa-align-left' },
        select: { label: 'Dropdown', icon: 'fas fa-list-ul' }
    };

    const QUICK_ADD_INPUT = ['text', 'email', 'date', 'number', 'select'];

    const SECTION_TEMPLATES = {
        blank: {
            filterGroup: false,
            fields: []
        },
        identity: {
            filterGroup: false,
            fields: [
                { label: 'Full name', type: 'text', key: 'full_name', required: true },
                { label: 'Email', type: 'email', key: 'institutional_email' },
                { label: 'Phone', type: 'tel', key: 'phone' }
            ]
        },
        academic: {
            filterGroup: false,
            fields: [
                { label: 'Academic rank', type: 'select', key: 'academic_rank', options: [{ value: 'professor', label: 'Professor' }, { value: 'associate_professor', label: 'Associate Professor' }, { value: 'assistant_professor', label: 'Assistant Professor' }] },
                { label: 'Department', type: 'select', key: 'department', options: [{ value: 'business', label: 'Business' }, { value: 'economics', label: 'Economics' }] },
                { label: 'Expertise', type: 'textarea', key: 'expertise', width: 'full' }
            ]
        },
        employment: {
            filterGroup: true,
            fields: [
                { label: 'Staff status', type: 'select', key: 'staff_status', options: [{ value: 'active', label: 'Active' }, { value: 'on_leave', label: 'On leave' }] },
                { label: 'Employment type', type: 'select', key: 'employment_type', options: [{ value: 'full_time', label: 'Full time' }, { value: 'part_time', label: 'Part time' }] }
            ]
        }
    };

    const SECTION_STARTER_OPTIONS = [
        ['blank', 'Empty (recommended)'],
        ['identity', 'Shortcut: Identity fields'],
        ['academic', 'Shortcut: Academic fields'],
        ['employment', 'Shortcut: Employment fields']
    ];

    function sectionTitlePlaceholder() {
        return 'Untitled profile';
    }

    function sectionTitleDisplay(title) {
        const trimmed = String(title ?? '').trim();
        return trimmed || sectionTitlePlaceholder();
    }

    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    function slugifyFieldKey(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 48) || 'field';
    }

    function parseOptionsFromLines(text) {
        const seen = new Set();
        const lines = String(text || '').split(/\r?\n/);
        const options = [];
        lines.forEach((line) => {
            const label = String(line).trim();
            if (!label) return;
            let value = slugifyFieldKey(label);
            let suffix = 2;
            while (seen.has(value)) {
                value = `${slugifyFieldKey(label)}_${suffix}`;
                suffix += 1;
            }
            seen.add(value);
            options.push({ value, label });
        });
        return options;
    }

    function optionsToLinesText(options = []) {
        return (Array.isArray(options) ? options : [])
            .map((option) => String(option?.label ?? option?.value ?? '').trim())
            .filter(Boolean)
            .join('\n');
    }

    const droplistOptionsSaveTimers = new WeakMap();

    function saveDroplistOptionsLines(el, callbacks, options = {}) {
        const data = datasetFromElement(el);
        if (!data.typeId || !data.sectionId || !data.fieldId || typeof window[H.updateField] !== 'function') return false;
        const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
        const parsed = parseOptionsFromLines(el.value);
        const result = window[H.updateField](data.typeId, bucket, data.sectionId, data.fieldId, { options: parsed });
        if (result?.error) {
            callbacks.onToast?.(result.error);
            return false;
        }
        markBuilderDirty(callbacks);
        if (options.refresh) callbacks.onRefresh?.();
        return true;
    }

    function scheduleDroplistOptionsSave(el, callbacks) {
        const existing = droplistOptionsSaveTimers.get(el);
        if (existing) clearTimeout(existing);
        droplistOptionsSaveTimers.set(el, setTimeout(() => {
            droplistOptionsSaveTimers.delete(el);
            saveDroplistOptionsLines(el, callbacks, { refresh: true });
        }, 300));
    }

    function flushFocusedDroplistOptions(root, callbacks) {
        const active = root?.querySelector(('[' + ('data-' + H.data + '-') + 'builder-input="droplist-options-lines"]:focus'));
        if (!active) return;
        const pending = droplistOptionsSaveTimers.get(active);
        if (pending) {
            clearTimeout(pending);
            droplistOptionsSaveTimers.delete(active);
        }
        saveDroplistOptionsLines(active, callbacks, { refresh: false });
    }

    const BUILDER_LABEL_CORRUPTION_MARKERS = [
        'Admin workspace',
        'Staff form settings',
        'Staff directory',
        'Form blueprint',
        'Design registration forms',
        'Staff types',
        'Copy blueprint',
        'staff-hub-',
        'data-staff-',
        'data-student-',
        'lux-page-shell',
        'id="staff-content"'
    ];

    function isCorruptedBuilderLabel(text) {
        const value = String(text || '').trim();
        if (!value) return false;
        if (value.length > 120) return true;
        const lower = value.toLowerCase();
        let hits = 0;
        BUILDER_LABEL_CORRUPTION_MARKERS.forEach((marker) => {
            if (lower.includes(marker.toLowerCase())) hits += 1;
        });
        return hits >= 2 || (hits >= 1 && value.length > 48);
    }

    function sanitizeBuilderText(value, fallback = '') {
        let text = String(value ?? '').trim();
        if (!text) return fallback;
        if (!/[<>]/.test(text)) {
            text = text.slice(0, 160);
        } else {
            text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
        }
        if (!text || isCorruptedBuilderLabel(text)) return fallback;
        return text;
    }

    function resolveBuilderLabelInput(el, data, fallback = 'New field') {
        const field = getFieldFromSchema(data.typeId, data.bucket, data.sectionId, data.fieldId);
        const schemaFallback = sanitizeBuilderText(field?.label, fallback);
        const label = sanitizeBuilderText(el.value, schemaFallback);
        if (el.value !== label) el.value = label;
        return label;
    }

    function flushBuilderFieldInputs(root, callbacks) {
        if (!root || typeof window[H.updateField] !== 'function') return;
        root.querySelectorAll(('input[data-' + H.data + '-builder-input="label"]')).forEach((el) => {
            if (el.tagName !== 'INPUT') return;
            const data = datasetFromElement(el);
            if (!data.typeId || !data.sectionId || !data.fieldId) return;
            const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
            const label = resolveBuilderLabelInput(el, data, 'New field');
            window[H.updateField](data.typeId, bucket, data.sectionId, data.fieldId, { label });
        });
        root.querySelectorAll(('input[data-' + H.data + '-builder-input="section-title"]')).forEach((el) => {
            if (el.tagName !== 'INPUT') return;
            const data = datasetFromElement(el);
            if (!data.typeId || !data.sectionId) return;
            const title = sanitizeBuilderText(el.value, '');
            if (el.value !== title) el.value = title;
            window[H.updateSection](data.typeId, null, data.sectionId, { title });
        });
        flushFocusedDroplistOptions(root, callbacks);
    }

    function getTypes() {
        return typeof window[H.getTypes] === 'function' ? window[H.getTypes]() : [];
    }

    function getType(typeId) {
        return typeof window[H.getType] === 'function' ? window[H.getType](typeId) : null;
    }

    function getSchema(typeId) {
        return typeof window[H.getSchema] === 'function'
            ? window[H.getSchema](typeId)
            : { sections: [] };
    }

    function sortedSections(sections = []) {
        return sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    function sortedFields(fields = []) {
        return fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    function getSchemaSections(typeId) {
        return sortedSections(getSchema(typeId).sections || []);
    }

    function isStudioOpen(state = {}) {
        return state.builderPanel === 'studio'
            || state.builderPanel === 'input'
            || state.builderPanel === 'droplist';
    }

    const STEP_SEARCH_THRESHOLD = 6;

    function getActiveSectionId(state = {}, sections = []) {
        const candidate = state.activeSectionId || state.expandedSectionId || null;
        if (candidate && sections.some((section) => section.id === candidate)) return candidate;
        return sections[0]?.id || null;
    }

    function firstSectionId(typeId) {
        return getSchemaSections(typeId)[0]?.id || null;
    }

    function fieldBucketForType(fieldType) {
        return fieldType === 'select' ? 'droplist' : 'input';
    }

    function neighborSectionIdAfterRemove(sections, removedSectionId) {
        const index = sections.findIndex((section) => section.id === removedSectionId);
        const remaining = sections.filter((section) => section.id !== removedSectionId);
        if (!remaining.length) return null;
        return remaining[index]?.id || remaining[index - 1]?.id || remaining[0]?.id || null;
    }

    function persistBlueprint() {
        if (typeof window[H.saveBlueprint] === 'function') return window[H.saveBlueprint]();
        const blueprint = typeof window[H.getBlueprint] === 'function' ? window[H.getBlueprint]() : null;
        if (blueprint) blueprint.updatedAt = todayIso();
        if (typeof saveState === 'function') saveState();
        return blueprint;
    }

    function markBuilderDirty(callbacks) {
        callbacks.setState?.({ builderDirty: true });
        updateStudioSaveStatus(true);
    }

    function notifyBlueprintSaved(callbacks, typeId) {
        if (!typeId) return;
        callbacks.onBlueprintSaved?.(typeId);
    }

    function updateStudioSaveStatus(dirty) {
        const status = document.querySelector((H.contentRoot + ' .' + H.hub + '-studio-save-status'));
        if (!status) return;
        status.classList.toggle('is-dirty', dirty);
        status.classList.toggle('is-clean', !dirty);
        status.textContent = dirty ? 'Unsaved changes' : 'All changes saved';
    }

    function moveFormFieldLocal(typeId, bucket, sectionId, fieldId, direction) {
        void bucket;
        if (typeof window[H.moveField] === 'function') {
            return window[H.moveField](typeId, null, sectionId, fieldId, direction);
        }
        return { error: 'Blueprint API unavailable.' };
    }

    function reorderStaffFormSectionLocal(typeId, sectionId, toIndex) {
        if (typeof window[H.reorderSection] === 'function') {
            return window[H.reorderSection](typeId, sectionId, toIndex);
        }
        return { error: 'Blueprint API unavailable.' };
    }

    function reorderStaffFormFieldLocal(typeId, sectionId, fieldId, toIndex) {
        if (typeof window[H.reorderField] === 'function') {
            return window[H.reorderField](typeId, sectionId, fieldId, toIndex);
        }
        return { error: 'Blueprint API unavailable.' };
    }

    function schemaStats(schema) {
        const sections = sortedSections(schema.sections || []);
        const fields = sections.reduce((sum, section) => sum + sortedFields(section.fields || []).length, 0);
        const inputFields = sections.reduce((sum, section) => sum + sortedFields(section.fields || []).filter((field) => field.type !== 'select').length, 0);
        const selectFields = fields - inputFields;
        const filterableSections = sections.filter((section) => section.filterGroup && sectionHasFilterableSelect(section)).length;
        return { sections: sections.length, fields, inputFields, selectFields, filterableSections };
    }

    function sectionHasFilterableSelect(section) {
        return (section?.fields || []).some((field) => field.type === 'select' && field.showInDirectoryFilter !== false);
    }

    function sectionFieldSummary(section) {
        const fields = sortedFields(section.fields || []);
        const textCount = fields.filter((field) => field.type !== 'select').length;
        const selectCount = fields.filter((field) => field.type === 'select').length;
        const chips = [];
        if (textCount) chips.push(`${textCount} field${textCount === 1 ? '' : 's'}`);
        if (selectCount) chips.push(`${selectCount} dropdown${selectCount === 1 ? '' : 's'}`);
        return chips.join(' · ') || 'No fields yet';
    }

    function starterFieldPayload(fieldType = 'text') {
        if (fieldType === 'select') {
            return { label: 'New dropdown', type: 'select', options: [{ value: 'option_1', label: 'Option 1' }] };
        }
        return { label: 'New field', type: fieldType === 'droplist' ? 'select' : (fieldType || 'text') };
    }

    function seedStarterFieldForSection(typeId, sectionId, fieldType = 'text') {
        if (typeof window[H.addField] !== 'function') return { error: 'Blueprint API unavailable.' };
        return window[H.addField](typeId, null, sectionId, starterFieldPayload(fieldType));
    }

    function addSectionFromTemplate(typeId, templateKey = 'blank', customTitle = '') {
        const template = SECTION_TEMPLATES[templateKey] || SECTION_TEMPLATES.blank;
        if (typeof window[H.addSection] !== 'function') return { error: 'Blueprint API unavailable.' };
        const section = window[H.addSection](typeId, {
            title: String(customTitle ?? '').trim(),
            filterGroup: Boolean(template.filterGroup)
        });
        if (!section?.id) return { error: 'Unable to add section.' };
        (template.fields || []).forEach((fieldDef) => {
            window[H.addField](typeId, null, section.id, fieldDef);
        });
        return getSchemaSections(typeId).find((item) => item.id === section.id) || section;
    }

    function focusCatalogTitle(root, sectionId, callbacks = {}) {
        if (!root || !sectionId) return;
        const panel = root.querySelector(`.${H.hub}-profile-row[data-${H.data}-section-id="${sectionId}"]`);
        const input = panel?.querySelector(('[' + ('data-' + H.data + '-') + 'builder-input="section-title"]'));
        if (!input) return;
        requestAnimationFrame(() => {
            input.focus();
            if (typeof input.select === 'function') input.select();
            callbacks.setState?.({ sectionNameFocusId: null });
        });
    }

    function countEmptyBlueprintSections(typeId) {
        return getSchemaSections(typeId).filter((section) => !(section.fields || []).length).length;
    }

    function typeIconClass(type) {
        if (type.id === 'professor' || type.platformRole === 'professor') return 'fas fa-user-tie';
        if (type.id === 'ta' || type.platformRole === 'ta') return 'fas fa-user-graduate';
        return 'fas fa-id-badge';
    }

    function typeCombinedStats(typeId) {
        const stats = schemaStats(getSchema(typeId));
        return {
            sections: stats.sections,
            fields: stats.fields,
            input: { sections: stats.sections, fields: stats.inputFields },
            droplist: { sections: stats.filterableSections, fields: stats.selectFields }
        };
    }

    function typeStatusLine(type) {
        if (type.isBuiltin) {
            return ('<span class="' + H.hub + '-builder-type-status lux-panel-copy is-locked"><i class="fas fa-lock" aria-hidden="true"></i> Built-in schema</span>');
        }
        return ('<span class="' + H.hub + '-builder-type-status lux-panel-copy is-editable"><i class="fas fa-pen" aria-hidden="true"></i> Custom · editable</span>');
    }

    function typeMeta(fieldType, bucket) {
        if (bucket === 'droplist') return TYPE_CATALOG.select;
        return TYPE_CATALOG[fieldType] || TYPE_CATALOG.text;
    }

    function renderTypeRail(types, selectedTypeId) {
        const items = types.map((type) => {
            const active = type.id === selectedTypeId ? ' is-active' : '';
            const stats = typeCombinedStats(type.id);
            const badge = type.isBuiltin
                ? ('<span class="' + H.hub + '-chip lux-status-pill home-hover-chip is-muted">Built-in</span>')
                : ('<span class="' + H.hub + '-chip lux-status-pill home-hover-chip">Custom</span>');
            return `
                <button class="${H.hub}-builder-type home-hover-chip${active}" type="button" data-${H.data}-builder-action="select-type" data-${H.data}-type-id="${escapeHtml(type.id)}">
                    <span class="${H.hub}-builder-type-icon" aria-hidden="true"><i class="${typeIconClass(type)}"></i></span>
                    <span class="${H.hub}-builder-type-copy">
                        <span class="${H.hub}-builder-type-label lux-card-copy">${escapeHtml(type.label)}</span>
                        ${typeStatusLine(type)}
                        <span class="${H.hub}-builder-type-stats" title="Sections · fields">${stats.sections} · ${stats.fields}</span>
                    </span>
                    ${badge}
                </button>
            `;
        }).join('');

        const typeCount = types.length
            ? `<span class="${H.hub}-builder-rail-count">${types.length} type${types.length === 1 ? '' : 's'}</span>`
            : '';

        return `
            <aside class="${H.hub}-builder-rail lux-soft-chrome home-hover-chip">
                <div class="${H.hub}-builder-rail-head">
                    <div class="${H.hub}-builder-rail-title-row">
                        <span class="${H.hub}-overline lux-section-kicker">${H.entityTitle} types</span>
                        ${typeCount}
                    </div>
                    <strong class="${H.hub}-section-title lux-card-title">Form blueprint</strong>
                    <p class="${H.hub}-section-copy lux-panel-copy">Pick a ${H.typeNoun}, organize form sections, and open the studio to mix fields and dropdowns.</p>
                </div>
                <div class="${H.hub}-builder-type-list">${items || ('<div class="' + H.hub + '-builder-empty lux-panel-copy">No ' + H.typesNoun + ' configured yet.</div>')}</div>
                <button class="lux-primary-btn ${H.hub}-builder-add-type" type="button" data-${H.data}-builder-action="add-type">
                    <i class="fas fa-plus"></i> Add ${H.typeNoun}
                </button>
            </aside>
        `;
    }

    function renderCopyBar(state, types, selectedTypeId) {
        const options = types
            .filter((type) => type.id !== selectedTypeId)
            .map((type) => {
                const selected = type.id === state.copySourceTypeId ? ' selected' : '';
                return `<option value="${escapeHtml(type.id)}"${selected}>${escapeHtml(type.label)}</option>`;
            })
            .join('');
        const hasSources = Boolean(selectedTypeId && options);
        const disabled = hasSources ? '' : ' disabled';
        const copyDisabled = hasSources && state.copySourceTypeId ? '' : ' disabled';

        return `
            <details class="${H.hub}-copy-bar-details">
                <summary class="${H.hub}-copy-bar-summary">
                    <span class="${H.hub}-overline lux-section-kicker">Power tools</span>
                    <strong class="${H.hub}-section-title lux-card-title">Copy blueprint from another type</strong>
                </summary>
                <div class="${H.hub}-copy-bar home-hover-chip">
                    <p class="${H.hub}-copy-bar-helper lux-panel-copy">Copies section structure only — review field keys after copying.</p>
                    <div class="${H.hub}-copy-bar-controls">
                        <label class="${H.hub}-builder-inline-field">
                            <span>Source type</span>
                            <select class="${H.hub}-control lux-control" data-${H.data}-builder-copy="source" data-lux-picker-label="Source type"${disabled}>
                                <option value="">Select source...</option>
                                ${options}
                            </select>
                        </label>
                        <label class="${H.hub}-builder-check">
                            <input type="checkbox" data-${H.data}-builder-copy="sections"${state.copySections !== false ? ' checked' : ''}${disabled}>
                            <span>Copy all form sections</span>
                        </label>
                        <button class="lux-secondary-btn ${H.hub}-copy-bar-action" type="button" data-${H.data}-builder-action="copy-blueprint"${copyDisabled}>
                            <i class="fas fa-copy"></i> Copy blueprint
                        </button>
                    </div>
                </div>
            </details>
        `;
    }

    function renderProfileStatusChip(section) {
        const fieldCount = (section.fields || []).length;
        const hasTitle = Boolean(String(section.title || '').trim());
        if (!fieldCount) {
            return ('<span class="' + H.hub + '-profile-status-chip home-hover-chip is-empty">No fields yet</span>');
        }
        if (!hasTitle) {
            return ('<span class="' + H.hub + '-profile-status-chip home-hover-chip is-draft">Draft</span>');
        }
        const label = `${fieldCount} field${fieldCount === 1 ? '' : 's'}`;
        return `<span class="${H.hub}-profile-status-chip home-hover-chip is-complete">${escapeHtml(label)}</span>`;
    }

    function renderProfileNameRow(state, typeId, section, index, activeSectionId) {
        const isActive = section.id === activeSectionId;
        const isNew = state.sectionNameFocusId === section.id;
        const isIncomplete = !(section.fields || []).length;
        const selectedAttr = isActive ? ' aria-selected="true"' : ' aria-selected="false"';

        return `
            <div class="${H.hub}-profile-row home-hover-chip${isActive ? ' is-active' : ''}${isNew ? ' is-new' : ''}${isIncomplete ? ' is-incomplete' : ''}" role="option"${selectedAttr} data-${H.data}-section-id="${escapeHtml(section.id)}" data-${H.data}-type-id="${escapeHtml(typeId)}">
                <button class="${H.hub}-profile-drag" type="button" data-${H.data}-profile-drag-handle aria-label="Reorder profile">
                    <i class="fas fa-grip-lines" aria-hidden="true"></i>
                </button>
                <span class="${H.hub}-profile-index" aria-hidden="true">${index + 1}</span>
                <div class="${H.hub}-profile-identity">
                    <span class="${H.hub}-profile-avatar" aria-hidden="true"><i class="fas fa-id-card"></i></span>
                    <div class="${H.hub}-profile-identity-copy">
                        <input class="${H.hub}-control lux-control ${H.hub}-profile-name-input" type="text" value="${escapeHtml(section.title || '')}" placeholder="${escapeHtml(sectionTitlePlaceholder())}" aria-label="Profile name" data-${H.data}-builder-input="section-title" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                    </div>
                </div>
                ${renderProfileStatusChip(section)}
                <button class="lux-secondary-btn lux-danger-btn ${H.hub}-profile-remove" type="button" data-${H.data}-builder-action="remove-section" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}" aria-label="Remove profile">
                    <i class="fas fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        `;
    }

    function renderProfilePanel(state, selectedType, sections, activeSectionId) {
        const typeId = selectedType.id;
        const profileCount = sections.length;
        const countLabel = `${profileCount} profile${profileCount === 1 ? '' : 's'}`;
        const rows = sections.map((section, index) => renderProfileNameRow(state, typeId, section, index, activeSectionId)).join('');
        const listMarkup = profileCount
            ? `
                <div class="${H.hub}-profile-list-shell home-hover-chip">
                    <div class="${H.hub}-profile-list-columns" aria-hidden="true">
                        <span>#</span>
                        <span></span>
                        <span>Profile</span>
                        <span>Status</span>
                        <span></span>
                    </div>
                    <div class="${H.hub}-profile-list lux-scrollbar" role="listbox" aria-label="Profile list" data-${H.data}-profile-drop-list data-${H.data}-type-id="${escapeHtml(typeId)}">${rows}</div>
                </div>
            `
            : `
                <div class="lux-empty-state ${H.hub}-profile-empty">
                    <i class="fas fa-id-card" aria-hidden="true"></i>
                    <strong class="lux-empty-state__title">No profiles yet</strong>
                    <span class="lux-empty-state__copy">Create your first profile, name it, then add fields below.</span>
                    <div class="lux-empty-state__action">
                        <button class="lux-primary-btn" type="button" data-${H.data}-builder-action="add-section" data-${H.data}-type-id="${escapeHtml(typeId)}">
                            <i class="fas fa-plus"></i> Add first profile
                        </button>
                    </div>
                </div>
            `;

        return `
            <section class="${H.hub}-profile-panel lux-data-card home-hover-chip" aria-label="Profiles">
                <div class="${H.hub}-profile-panel-head">
                    <div class="${H.hub}-profile-panel-copy">
                        <div class="${H.hub}-profile-panel-title-row">
                            <span class="${H.hub}-overline lux-section-kicker">Profiles</span>
                            <span class="${H.hub}-profile-count">${escapeHtml(countLabel)}</span>
                            <span class="${H.hub}-profile-type-pill home-hover-chip">${escapeHtml(selectedType.label)}</span>
                        </div>
                        <p class="${H.hub}-section-copy lux-panel-copy">Select a profile, name it, then add fields below.</p>
                    </div>
                    <button class="lux-secondary-btn ${H.hub}-profile-add" type="button" data-${H.data}-builder-action="add-section" data-${H.data}-type-id="${escapeHtml(typeId)}">
                        <i class="fas fa-plus"></i> Add profile
                    </button>
                </div>
                ${listMarkup}
            </section>
        `;
    }

    function renderFieldAddControls(typeId, sectionId, options = {}) {
        const variant = options.variant || 'footer';
        const variantClass = variant === 'hero' ? ' is-hero' : variant === 'rail' ? ' is-rail' : '';
        const btnClass = variant === 'hero'
            ? ('lux-secondary-btn ' + H.hub + '-studio-quick-btn home-hover-chip is-hero-btn')
            : (H.hub + '-studio-quick-btn home-hover-chip');
        const buttons = QUICK_ADD_INPUT.map((fieldType) => {
            const meta = TYPE_CATALOG[fieldType];
            const bucket = fieldBucketForType(fieldType);
            return `
                <button class="${btnClass}" type="button" data-${H.data}-builder-action="quick-add-field" data-${H.data}-field-type="${escapeHtml(fieldType)}" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}">
                    <i class="${meta.icon}" aria-hidden="true"></i> ${escapeHtml(meta.label)}
                </button>
            `;
        }).join('');
        return `
            <div class="${H.hub}-studio-quick-add${variantClass}">
                <span class="${H.hub}-studio-quick-label lux-section-kicker">Add field</span>
                ${buttons}
            </div>
        `;
    }

    function renderFieldAddHero(typeId, sectionId) {
        return `
            <div class="lux-empty-state ${H.hub}-field-add-hero">
                <i class="fas fa-layer-group" aria-hidden="true"></i>
                <strong class="lux-empty-state__title">Add fields to this profile</strong>
                <span class="lux-empty-state__copy">Profiles without fields won't appear in ${H.addEntityLabel}.</span>
                <div class="lux-empty-state__action">
                    ${renderFieldAddControls(typeId, sectionId, { variant: 'hero' })}
                </div>
            </div>
        `;
    }

    function renderSectionFieldWorkspace(state, selectedType, section, sections = []) {
        const typeId = selectedType?.id || '';

        if (!section) {
            return `
                <div class="${H.hub}-section-field-workspace is-empty lux-empty-state ${H.hub}-field-workspace-empty">
                    <i class="fas fa-id-card" aria-hidden="true"></i>
                    <strong class="lux-empty-state__title">No profile selected</strong>
                    <span class="lux-empty-state__copy">Add a profile above, select it, then add inputs and dropdowns here.</span>
                    ${typeId ? `
                        <div class="lux-empty-state__action">
                            <button class="lux-primary-btn" type="button" data-${H.data}-builder-action="add-section" data-${H.data}-type-id="${escapeHtml(typeId)}">
                                <i class="fas fa-plus"></i> Add profile
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        const profileIndex = sections.findIndex((item) => item.id === section.id);
        const profilePosition = profileIndex >= 0 ? profileIndex + 1 : 1;
        const profileTotal = sections.length || 1;
        const fields = sortedFields(section.fields || []);
        const fieldRows = fields.length
            ? fields.map((field, fieldIndex) => renderStudioFieldRow(
                state,
                typeId,
                fieldBucketForType(field.type),
                section.id,
                field,
                fieldIndex,
                fields.length
            )).join('')
            : renderFieldAddHero(typeId, section.id);

        const footerMarkup = fields.length
            ? `<div class="${H.hub}-section-builder-footer">${renderFieldAddControls(typeId, section.id, { variant: 'footer' })}</div>`
            : '';

        return `
            <div class="${H.hub}-section-field-workspace lux-data-card home-hover-chip" data-${H.data}-section-id="${escapeHtml(section.id)}">
                <div class="${H.hub}-section-field-workspace-head">
                    <div class="${H.hub}-workspace-head-copy">
                        <span class="${H.hub}-overline lux-section-kicker">Fields</span>
                        <p class="${H.hub}-workspace-head-context lux-card-copy">Editing profile ${profilePosition} of ${profileTotal}</p>
                    </div>
                    <label class="${H.hub}-builder-check ${H.hub}-field-workspace-filter">
                        <input type="checkbox" data-${H.data}-builder-input="section-filter-group" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${section.filterGroup ? ' checked' : ''}>
                        <span>Use in directory filters</span>
                    </label>
                </div>
                ${fields.length ? `<div class="${H.hub}-field-add-rail">${renderFieldAddControls(typeId, section.id, { variant: 'rail' })}</div>` : ''}
                <div class="${H.hub}-section-builder-fields${fields.length ? '' : ' is-empty'}"${fields.length ? ` data-${H.data}-field-drop-list data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"` : ''}>
                    ${fieldRows}
                </div>
                ${footerMarkup}
            </div>
        `;
    }

    function renderOverviewCanvas(state, selectedType) {
        const stats = schemaStats(getSchema(selectedType.id));
        const sections = getSchemaSections(selectedType.id);
        const activeSectionId = getActiveSectionId(state, sections);
        const activeSection = sections.find((section) => section.id === activeSectionId) || null;
        const emptyWarning = sections.some((section) => !(section.fields || []).length)
            ? ('<span class="' + H.hub + '-builder-stat-pill home-hover-chip is-warning">Some profiles need fields</span>')
            : '';
        return `
            <div class="${H.hub}-builder-canvas lux-soft-chrome home-hover-chip">
                <div class="${H.hub}-builder-canvas-head">
                    <div class="${H.hub}-builder-canvas-copy">
                        <span class="${H.hub}-overline lux-section-kicker">Form settings</span>
                        <strong class="${H.hub}-section-title lux-card-title">${escapeHtml(selectedType.label)}</strong>
                        <div class="${H.hub}-builder-canvas-stats">
                            <span class="${H.hub}-builder-stat-pill home-hover-chip">${stats.sections} profile${stats.sections === 1 ? '' : 's'}</span>
                            <span class="${H.hub}-builder-stat-pill home-hover-chip is-input">${stats.inputFields} field${stats.inputFields === 1 ? '' : 's'}</span>
                            <span class="${H.hub}-builder-stat-pill home-hover-chip is-droplist">${stats.selectFields} dropdown${stats.selectFields === 1 ? '' : 's'}</span>
                            <span class="${H.hub}-builder-stat-pill home-hover-chip">${stats.filterableSections} filterable</span>
                            ${emptyWarning}
                        </div>
                    </div>
                    <div class="${H.hub}-builder-canvas-actions">
                        ${renderStudioSaveBar(state)}
                        <button class="lux-secondary-btn" type="button" data-${H.data}-builder-action="open-form-studio" data-${H.data}-type-id="${escapeHtml(selectedType.id)}">
                            <i class="fas fa-eye"></i> Preview form
                        </button>
                        ${selectedType.isBuiltin ? '' : `
                            <button class="lux-secondary-btn lux-danger-btn" type="button" data-${H.data}-builder-action="delete-type" data-${H.data}-type-id="${escapeHtml(selectedType.id)}">
                                <i class="fas fa-trash"></i> Delete type
                            </button>
                        `}
                        <button class="lux-secondary-btn" type="button" data-${H.data}-builder-action="back-directory">
                            <i class="fas fa-arrow-left"></i> Back to directory
                        </button>
                    </div>
                </div>
                <div class="${H.hub}-builder-canvas-toolbar">
                    ${renderProfilePanel(state, selectedType, sections, activeSectionId)}
                </div>
                <div class="${H.hub}-builder-canvas-body">
                    ${renderSectionFieldWorkspace(state, selectedType, activeSection, sections)}
                </div>
                <div class="${H.hub}-builder-canvas-footer">${renderCopyBar(state, getTypes(), selectedType.id)}</div>
            </div>
        `;
    }

    function renderStudioQuickAdd(typeId, sectionId) {
        return renderFieldAddControls(typeId, sectionId, { variant: 'footer' });
    }

    function renderStudioMenuViewport(innerHtml, ariaLabel, viewportClass) {
        return `
            <div class="lux-scrollbar ${viewportClass}" aria-label="${escapeHtml(ariaLabel)}">
                ${innerHtml}
            </div>
        `;
    }

    function renderFieldTypePicker(typeId, bucket, sectionId, field) {
        const current = typeMeta(field.type, bucket);
        const pickerTypes = [...BUILDER_INPUT_TYPES, 'select'];
        const options = pickerTypes.map((fieldType) => {
            const meta = TYPE_CATALOG[fieldType];
            const active = fieldType === field.type ? ' is-active' : '';
            const fieldBucket = fieldBucketForType(fieldType);
            return `
                <button class="${H.hub}-studio-type-option${active}" type="button" data-${H.data}-builder-action="set-field-type" data-${H.data}-field-type="${escapeHtml(fieldType)}" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(fieldBucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                    <i class="${meta.icon}" aria-hidden="true"></i> ${escapeHtml(meta.label)}
                </button>
            `;
        }).join('');
        const menuBody = renderStudioMenuViewport(
            options,
            'Field types',
            (H.hub + '-studio-type-menu-viewport')
        );
        return `
            <details class="${H.hub}-studio-type-popover" data-${H.data}-type-menu data-${H.data}-popover-id="${escapeHtml(field.id)}-type">
                <summary class="${H.hub}-studio-type-trigger" aria-label="Field type" title="Change field type">
                    <span class="${H.hub}-studio-type-trigger-icon"><i class="${current.icon}" aria-hidden="true"></i></span>
                    <span class="${H.hub}-studio-type-trigger-label">${escapeHtml(current.label)}</span>
                    <i class="fas fa-chevron-down ${H.hub}-studio-type-trigger-chevron" aria-hidden="true"></i>
                </summary>
                <div class="${H.hub}-studio-type-menu">${menuBody}</div>
            </details>
        `;
    }

    function renderFieldMenuPanel(typeId, bucket, sectionId, field, upDisabled, downDisabled) {
        const buttons = `
            <button type="button" data-${H.data}-builder-action="open-field-advanced" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">Advanced settings</button>
            <button type="button" data-${H.data}-builder-action="move-field-up" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}"${upDisabled}>Move up</button>
            <button type="button" data-${H.data}-builder-action="move-field-down" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}"${downDisabled}>Move down</button>
            <button type="button" data-${H.data}-builder-action="duplicate-field" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">Duplicate</button>
            <button type="button" class="is-danger" data-${H.data}-builder-action="request-remove-field" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">Remove</button>
        `;
        const menuBody = renderStudioMenuViewport(
            buttons,
            'Field actions',
            (H.hub + '-studio-field-menu-viewport')
        );
        return `<div class="${H.hub}-studio-field-menu-panel">${menuBody}</div>`;
    }

    function renderFieldAdvancedDrawer(state, typeId, bucket, sectionId, field) {
        if (state.fieldAdvancedOpenId !== field.id) return '';
        const isLocked = Boolean(state.lockedFieldKeys?.[field.id]);
        const lockHint = isLocked ? 'Manual key locked' : `Auto: ${slugifyFieldKey(field.label)}`;
        return `
            <div class="${H.hub}-studio-advanced">
                <div class="${H.hub}-studio-advanced-head">
                    <strong class="${H.hub}-section-title lux-card-title">Advanced settings</strong>
                    <button class="lux-secondary-btn" type="button" data-${H.data}-builder-action="close-field-advanced" data-${H.data}-field-id="${escapeHtml(field.id)}">
                        <i class="fas fa-times"></i> Close
                    </button>
                </div>
                <div class="${H.hub}-studio-advanced-grid">
                    <label class="${H.hub}-builder-inline-field">
                        <span>Field key <em class="${H.hub}-studio-hint">${escapeHtml(lockHint)}</em></span>
                        <input class="${H.hub}-control lux-control" type="text" value="${escapeHtml(field.key)}" data-${H.data}-builder-input="key" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                    </label>
                    ${bucket === 'input' ? `
                        <label class="${H.hub}-builder-inline-field">
                            <span>Placeholder</span>
                            <input class="${H.hub}-control lux-control" type="text" value="${escapeHtml(field.placeholder || '')}" data-${H.data}-builder-input="placeholder" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="input" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                        </label>
                        <label class="${H.hub}-builder-check">
                            <input type="checkbox" data-${H.data}-builder-input="width-full" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="input" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}"${field.width === 'full' ? ' checked' : ''}>
                            <span>Full width field</span>
                        </label>
                        <label class="${H.hub}-builder-inline-field">
                            <span>Help text</span>
                            <input class="${H.hub}-control lux-control" type="text" value="${escapeHtml(field.help || '')}" data-${H.data}-builder-input="help" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="input" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                        </label>
                    ` : ''}
                    ${(NS === 'student' || NS === 'staff') ? `
                        <label class="${H.hub}-builder-check">
                            <input type="checkbox" data-${H.data}-builder-input="showOnPersonalData" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}"${field.showOnPersonalData ? ' checked' : ''}>
                            <span>Show on Personal Data</span>
                        </label>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function renderFieldRemoveConfirmStrip(state, typeId, bucket, sectionId, field) {
        if (state.fieldRemovePendingId !== field.id) return '';
        const label = sanitizeBuilderText(field.label, 'this field') || 'this field';
        return `
            <div class="${H.hub}-studio-field-remove-confirm">
                <span>Remove “${escapeHtml(label)}” from this step? It will disappear from ${H.addEntityLabel}.</span>
                <div class="${H.hub}-studio-field-remove-actions">
                    <button class="lux-secondary-btn" type="button" data-${H.data}-builder-action="cancel-remove-field" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">Cancel</button>
                    <button class="lux-secondary-btn lux-danger-btn" type="button" data-${H.data}-builder-action="confirm-remove-field" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">Confirm remove</button>
                </div>
            </div>
        `;
    }

    function renderStudioFieldRow(state, typeId, bucket, sectionId, field, index, total) {
        const requiredClass = field.required ? ' is-required' : '';
        const pendingClass = state.fieldRemovePendingId === field.id ? ' is-remove-pending' : '';
        const upDisabled = index === 0 ? ' disabled' : '';
        const downDisabled = index >= total - 1 ? ' disabled' : '';
        const choicesBlock = field.type === 'select' ? `
            <div class="${H.hub}-studio-choices">
                <label class="${H.hub}-builder-inline-field">
                    <span>Choices <em class="${H.hub}-studio-hint">One per line</em></span>
                    <textarea class="${H.hub}-control lux-control" rows="3" placeholder="Active&#10;On leave&#10;Retired" data-${H.data}-builder-input="droplist-options-lines" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">${escapeHtml(optionsToLinesText(field.options))}</textarea>
                </label>
                <label class="${H.hub}-builder-check ${H.hub}-studio-filter-toggle">
                    <input type="checkbox" data-${H.data}-builder-input="showInDirectoryFilter" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}"${field.showInDirectoryFilter !== false ? ' checked' : ''}>
                    <span>Use in directory filters</span>
                </label>
            </div>
        ` : '';

        return `
            <div class="${H.hub}-studio-field-row home-hover-chip${requiredClass}${pendingClass}" data-${H.data}-field-id="${escapeHtml(field.id)}" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(sectionId)}">
                <div class="${H.hub}-studio-field-main">
                    <button class="${H.hub}-studio-drag" type="button" data-${H.data}-field-drag-handle aria-label="Reorder field">
                        <i class="fas fa-grip-lines" aria-hidden="true"></i>
                    </button>
                    <input class="${H.hub}-control lux-control ${H.hub}-studio-label-input" type="text" value="${escapeHtml(sanitizeBuilderText(field.label, 'New field'))}" placeholder="Field label" data-${H.data}-builder-input="label" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                    ${renderFieldTypePicker(typeId, bucket, sectionId, field)}
                    <button class="${H.hub}-studio-required-btn${requiredClass}" type="button" title="${field.required ? 'Required' : 'Optional'}" aria-label="${field.required ? 'Mark optional' : 'Mark required'}" data-${H.data}-builder-action="toggle-field-required" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                        <i class="fas fa-asterisk" aria-hidden="true"></i>
                    </button>
                    <button class="lux-secondary-btn lux-danger-btn ${H.hub}-studio-field-remove-btn" type="button" aria-label="Remove field" title="Remove field" data-${H.data}-builder-action="request-remove-field" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}">
                        <i class="fas fa-trash" aria-hidden="true"></i>
                    </button>
                    <details class="${H.hub}-studio-field-menu" data-${H.data}-field-menu data-${H.data}-popover-id="${escapeHtml(field.id)}-menu">
                        <summary aria-label="Field actions"><i class="fas fa-ellipsis-h" aria-hidden="true"></i></summary>
                        ${renderFieldMenuPanel(typeId, bucket, sectionId, field, upDisabled, downDisabled)}
                    </details>
                </div>
                ${(NS === 'student' || NS === 'staff') ? `
                <label class="${H.hub}-builder-check ${H.hub}-studio-personal-data-toggle">
                    <input type="checkbox" data-${H.data}-builder-input="showOnPersonalData" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(sectionId)}" data-${H.data}-field-id="${escapeHtml(field.id)}"${field.showOnPersonalData ? ' checked' : ''}>
                    <span>Show on Personal Data</span>
                </label>
                ` : ''}
                ${renderFieldRemoveConfirmStrip(state, typeId, bucket, sectionId, field)}
                ${choicesBlock}
                ${renderFieldAdvancedDrawer(state, typeId, bucket, sectionId, field)}
            </div>
        `;
    }

    function renderSectionBuilderPanel(state, selectedType, section, index, total) {
        const typeId = selectedType.id;
        const fields = sortedFields(section.fields || []);
        const upDisabled = index === 0 ? ' disabled' : '';
        const downDisabled = index >= total - 1 ? ' disabled' : '';
        const isNew = state.sectionNameFocusId === section.id ? ' is-new' : '';
        const isIncomplete = !fields.length ? ' is-incomplete' : '';
        const filterableClass = section.filterGroup ? ' is-filterable' : '';
        const metaChip = fields.length ? sectionFieldSummary(section) : '';

        const fieldRows = fields.length
            ? fields.map((field, fieldIndex) => renderStudioFieldRow(
                state,
                typeId,
                fieldBucketForType(field.type),
                section.id,
                field,
                fieldIndex,
                fields.length
            )).join('')
            : ('<div class="' + H.hub + '-section-builder-empty"><i class="fas fa-circle-info" aria-hidden="true"></i> Add inputs or dropdowns below for this section.</div>');

        return `
            <article class="${H.hub}-section-builder-panel lux-data-card${isNew}${isIncomplete}${filterableClass}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                <div class="${H.hub}-section-builder-head">
                    <span class="${H.hub}-section-builder-index" aria-hidden="true">${index + 1}</span>
                    <div class="${H.hub}-section-builder-title-wrap">
                        <input class="${H.hub}-control lux-control ${H.hub}-section-builder-title-input" type="text" value="${escapeHtml(section.title || '')}" placeholder="${escapeHtml(sectionTitlePlaceholder())}" data-${H.data}-builder-input="section-title" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                        ${metaChip ? `<span class="${H.hub}-section-builder-meta">${escapeHtml(metaChip)}</span>` : ''}
                    </div>
                    <label class="${H.hub}-builder-check ${H.hub}-section-builder-filter-toggle">
                        <input type="checkbox" data-${H.data}-builder-input="section-filter-group" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${section.filterGroup ? ' checked' : ''}>
                        <span>Directory filters</span>
                    </label>
                    <div class="${H.hub}-section-builder-actions">
                        <button class="lux-secondary-btn" type="button" aria-label="Move section up" data-${H.data}-builder-action="move-section-up" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${upDisabled}><i class="fas fa-arrow-up"></i></button>
                        <button class="lux-secondary-btn" type="button" aria-label="Move section down" data-${H.data}-builder-action="move-section-down" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${downDisabled}><i class="fas fa-arrow-down"></i></button>
                        <button class="lux-secondary-btn lux-danger-btn ${H.hub}-section-builder-remove-btn" type="button" data-${H.data}-builder-action="remove-section" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"><i class="fas fa-trash"></i> Remove</button>
                    </div>
                </div>
                <div class="${H.hub}-section-builder-fields"${fields.length ? ` data-${H.data}-field-drop-list data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"` : ''}>
                    ${fieldRows}
                </div>
                <div class="${H.hub}-section-builder-footer">
                    ${renderStudioQuickAdd(typeId, section.id)}
                </div>
            </article>
        `;
    }

    function stepLabelForBucket() {
        return 'Section';
    }

    function renderStudioStepSearch(sections = []) {
        if (sections.length < STEP_SEARCH_THRESHOLD) return '';
        return `
            <div class="${H.hub}-studio-step-search">
                <label class="${H.hub}-studio-step-search-label" for="${NS}-studio-step-search">Find step</label>
                <input class="${H.hub}-control lux-control ${H.hub}-studio-step-search-input" id="${NS}-studio-step-search" type="search" placeholder="Search steps…" autocomplete="off" data-${H.data}-builder-input="step-search">
            </div>
        `;
    }

    function renderStudioSectionNavItem(state, typeId, bucket, section, index, activeSectionId) {
        void state;
        void bucket;
        const fields = sortedFields(section.fields || []);
        const isActive = section.id === activeSectionId;
        const stepLabel = stepLabelForBucket();
        const incompleteClass = fields.length ? '' : ' is-incomplete';
        const activeClass = isActive ? ' is-active' : '';
        const selectedAttr = isActive ? ' aria-selected="true"' : ' aria-selected="false"';
        const meta = fields.length
            ? `${fields.length} field${fields.length === 1 ? '' : 's'}`
            : 'No fields yet';
        const warning = fields.length
            ? ''
            : ('<span class="' + H.hub + '-studio-step-nav-warning" title="No fields yet" aria-hidden="true"><i class="fas fa-circle-exclamation"></i></span>');

        return `
            <button class="${H.hub}-studio-step-nav-item${activeClass}${incompleteClass}" type="button" role="tab"${selectedAttr} data-${H.data}-builder-action="select-section" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                <span class="${H.hub}-studio-step-nav-badge">${stepLabel} ${index + 1}</span>
                <span class="${H.hub}-studio-step-nav-copy">
                    <span class="${H.hub}-studio-step-nav-title">${escapeHtml(sectionTitleDisplay(section.title))}</span>
                    <span class="${H.hub}-studio-step-nav-meta">${escapeHtml(meta)}</span>
                </span>
                ${warning}
            </button>
        `;
    }

    function renderStudioSectionDetail(state, typeId, bucket, section, index, total) {
        const fields = sortedFields(section.fields || []);
        const upDisabled = index === 0 ? ' disabled' : '';
        const downDisabled = index >= total - 1 ? ' disabled' : '';
        const stepLabel = stepLabelForBucket();

        return `
            <div class="${H.hub}-studio-step-detail" role="tabpanel" data-${H.data}-section-id="${escapeHtml(section.id)}">
                <div class="${H.hub}-studio-step-detail-scroll lux-scrollbar">
                    <div class="${H.hub}-studio-step-detail-sticky">
                        <div class="${H.hub}-studio-step-detail-head">
                            <div>
                                <span class="${H.hub}-overline lux-section-kicker">${stepLabel} ${index + 1} of ${total}</span>
                                <strong class="${H.hub}-section-title lux-card-title">${escapeHtml(sectionTitleDisplay(section.title))}</strong>
                            </div>
                        </div>
                        <div class="${H.hub}-studio-section-toolbar">
                            <input class="${H.hub}-control lux-control ${H.hub}-studio-section-title-input" type="text" value="${escapeHtml(section.title || '')}" placeholder="${escapeHtml(sectionTitlePlaceholder())}" data-${H.data}-builder-input="section-title" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                            <input class="${H.hub}-control lux-control ${H.hub}-studio-section-desc-input" type="text" value="${escapeHtml(section.description || '')}" placeholder="Optional description for this section" data-${H.data}-builder-input="section-description" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                            <label class="${H.hub}-builder-check ${H.hub}-studio-filter-group-toggle">
                                <input type="checkbox" data-${H.data}-builder-input="section-filter-group" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${section.filterGroup ? ' checked' : ''}>
                                <span>Use in directory filters</span>
                            </label>
                            <div class="${H.hub}-studio-section-actions">
                                <button class="lux-secondary-btn" type="button" aria-label="Move section up" data-${H.data}-builder-action="move-section-up" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${upDisabled}><i class="fas fa-arrow-up"></i></button>
                                <button class="lux-secondary-btn" type="button" aria-label="Move section down" data-${H.data}-builder-action="move-section-down" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(section.id)}"${downDisabled}><i class="fas fa-arrow-down"></i></button>
                                <button class="lux-secondary-btn lux-danger-btn" type="button" data-${H.data}-builder-action="remove-section" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-bucket="${escapeHtml(bucket)}" data-${H.data}-section-id="${escapeHtml(section.id)}"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="${H.hub}-studio-field-list">
                        ${fields.length
                            ? fields.map((field, fieldIndex) => renderStudioFieldRow(state, typeId, fieldBucketForType(field.type), section.id, field, fieldIndex, fields.length)).join('')
                            : ('<div class="' + H.hub + '-studio-field-empty is-blocking"><i class="fas fa-circle-info" aria-hidden="true"></i> This section won\'t appear in ' + H.addEntityLabel + ' until you add a field below.</div>')}
                    </div>
                    ${renderStudioQuickAdd(typeId, section.id)}
                </div>
            </div>
        `;
    }

    function renderStudioStepNav(state, typeId, bucket, sections, activeSectionId) {
        void bucket;
        return `
            <nav class="${H.hub}-studio-step-nav" role="tablist" aria-label="Form sections">
                ${renderStudioStepSearch(sections)}
                <div class="${H.hub}-studio-step-nav-list lux-scrollbar">
                    ${sections.map((section, index) => renderStudioSectionNavItem(state, typeId, 'input', section, index, activeSectionId)).join('')}
                </div>
                <button class="lux-secondary-btn ${H.hub}-studio-step-nav-add" type="button" data-${H.data}-builder-action="add-section" data-${H.data}-type-id="${escapeHtml(typeId)}" data-${H.data}-section-template="blank">
                    <i class="fas fa-plus"></i> Add section
                </button>
                <p class="${H.hub}-studio-step-nav-add-hint lux-panel-copy">Creates an empty section — add fields in studio.</p>
            </nav>
        `;
    }

    function getStudioPreviewSections(typeId) {
        return getSchemaSections(typeId).filter((section) => (section.fields || []).length);
    }

    function resolveStudioPreviewSectionId(typeId, highlightSectionId) {
        const sections = getStudioPreviewSections(typeId);
        if (!sections.length) return null;
        if (highlightSectionId && sections.some((section) => section.id === highlightSectionId)) {
            return highlightSectionId;
        }
        return sections[0].id;
    }

    function getStudioPreviewMeta(typeId, highlightSectionId) {
        const sections = getStudioPreviewSections(typeId);
        const total = sections.length;
        if (!total) {
            return { title: 'Registration form', meta: 'No profiles with fields yet' };
        }
        const resolvedId = resolveStudioPreviewSectionId(typeId, highlightSectionId);
        const index = sections.findIndex((section) => section.id === resolvedId);
        if (index < 0) {
            return {
                title: 'Registration form',
                meta: `${total} profile${total === 1 ? '' : 's'}`
            };
        }
        const section = sections[index];
        return {
            title: `Profile ${index + 1} of ${total}`,
            meta: sectionTitleDisplay(section.title)
        };
    }

    function renderStudioPreviewProfileTabs(typeId, activeSectionId) {
        const sections = getStudioPreviewSections(typeId);
        if (!sections.length) return '';
        const resolvedId = resolveStudioPreviewSectionId(typeId, activeSectionId);
        const tabs = sections.map((section) => {
            const isActive = section.id === resolvedId;
            const label = sectionTitleDisplay(section.title);
            return `
                <button class="${H.hub}-tab lux-tab-btn ${H.hub}-profile-tab ${H.hub}-studio-preview-profile-tab${isActive ? ' is-active' : ''}" type="button" aria-pressed="${isActive ? 'true' : 'false'}" data-${H.data}-builder-action="preview-select-profile" data-${H.data}-section-id="${escapeHtml(section.id)}" data-${H.data}-type-id="${escapeHtml(typeId)}">
                    ${escapeHtml(label)}
                </button>
            `;
        }).join('');
        return `
            <div class="${H.hub}-tabs lux-tab-strip is-profile-tabs ${H.hub}-studio-preview-profile-tabs" role="tablist" aria-label="Preview profiles">
                ${tabs}
            </div>
        `;
    }

    function renderStudioPreview(typeId, highlightSectionId, options = {}) {
        const compact = options.compact !== false;
        const resolvedId = resolveStudioPreviewSectionId(typeId, highlightSectionId);
        const renderPreview = NS === 'staff'
            ? window.renderStaffFormFromBlueprint
            : window.renderStudentFormFromBlueprint;
        const markup = typeof renderPreview === 'function'
            ? renderPreview(typeId, { fieldValues: {} }, {
                showSettingsLink: false,
                previewMode: true,
                activeSectionId: resolvedId
            })
            : ('<div class="' + H.hub + '-studio-preview-empty">Preview unavailable.</div>');
        const previewMeta = getStudioPreviewMeta(typeId, resolvedId);
        const metaLine = previewMeta.meta
            ? `<p class="${H.hub}-studio-preview-meta lux-panel-copy">${escapeHtml(previewMeta.meta)}</p>`
            : '';
        const tabsMarkup = renderStudioPreviewProfileTabs(typeId, resolvedId);
        return `
            <div class="${H.hub}-studio-preview${compact ? ' is-compact' : ''}"${resolvedId ? ` data-studio-highlight-section="${escapeHtml(resolvedId)}"` : ''}>
                <div class="${H.hub}-studio-preview-head">
                    <span class="${H.hub}-overline lux-section-kicker">Live preview</span>
                    <strong class="${H.hub}-section-title lux-card-title">${escapeHtml(previewMeta.title)}</strong>
                    ${metaLine}
                </div>
                ${tabsMarkup}
                <div class="${H.hub}-studio-preview-body lux-scrollbar">${markup}</div>
            </div>
        `;
    }

    function renderStudioBreadcrumb(selectedType) {
        return `
            <nav class="${H.hub}-builder-breadcrumb" aria-label="Form builder navigation">
                <button class="${H.hub}-builder-breadcrumb-link" type="button" data-${H.data}-builder-action="close-builder">Form settings</button>
                <span class="${H.hub}-builder-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="${H.hub}-builder-breadcrumb-current">${escapeHtml(selectedType.label)}</span>
                <span class="${H.hub}-builder-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="${H.hub}-builder-breadcrumb-current is-terminal">Live preview</span>
            </nav>
        `;
    }

    function renderStudioSaveBar(state = {}) {
        const dirty = Boolean(state.builderDirty);
        const statusClass = dirty ? 'is-dirty' : 'is-clean';
        const statusText = dirty ? 'Unsaved changes' : 'All changes saved';

        return `
            <div class="${H.hub}-studio-save-bar">
                <span class="${H.hub}-studio-save-status lux-panel-copy ${statusClass}">${statusText}</span>
                <button class="lux-primary-btn" type="button" data-${H.data}-builder-action="save-blueprint">
                    <i class="fas fa-save"></i> Save blueprint
                </button>
            </div>
        `;
    }

    function renderFormStudio(state, selectedType) {
        const sections = getSchemaSections(selectedType.id);
        const activeSectionId = getActiveSectionId(state, sections);

        return `
            <div class="${H.hub}-builder-canvas ${H.hub}-form-studio is-preview-only lux-soft-chrome home-hover-chip">
                ${renderStudioBreadcrumb(selectedType)}
                <div class="${H.hub}-studio-head">
                    <div>
                        <span class="${H.hub}-overline lux-section-kicker">${escapeHtml(selectedType.label)}</span>
                        <strong class="${H.hub}-section-title lux-card-title">Live preview</strong>
                        <p class="${H.hub}-section-copy lux-panel-copy">See how the registration form looks with your sections and fields. Edit sections on Form settings.</p>
                    </div>
                    <div class="${H.hub}-builder-panel-actions">
                        <button class="lux-secondary-btn" type="button" data-${H.data}-builder-action="close-builder">
                            <i class="fas fa-arrow-left"></i> Back
                        </button>
                    </div>
                </div>
                ${renderStudioSaveBar(state)}
                <div class="${H.hub}-studio-layout is-preview-only">
                    ${renderStudioPreview(selectedType.id, activeSectionId, { compact: false })}
                </div>
            </div>
        `;
    }

    function renderEmptyCanvas() {
        return `
            <div class="${H.hub}-builder-canvas lux-soft-chrome home-hover-chip">
                <div class="${H.hub}-builder-empty-state lux-empty-state">
                    <span class="${H.hub}-builder-empty-icon" aria-hidden="true"><i class="fas fa-sliders"></i></span>
                    <strong class="lux-empty-state__title ${H.hub}-section-title lux-card-title">Select a ${H.typeNoun}</strong>
                    <p class="lux-empty-state__copy ${H.hub}-section-copy lux-panel-copy">Choose a ${H.typeNoun} from the rail or create a new one to configure its form blueprint.</p>
                    <button class="lux-primary-btn" type="button" data-${H.data}-builder-action="add-type">
                        <i class="fas fa-plus"></i> Add ${H.typeNoun}
                    </button>
                </div>
            </div>
        `;
    }

    function renderStaffFormSettings(state = {}, callbacks = {}) {
        void callbacks;
        const types = getTypes();
        const selectedTypeId = state.selectedTypeId || types[0]?.id || null;
        const selectedType = selectedTypeId ? getType(selectedTypeId) : null;
        const canvas = !selectedType
            ? renderEmptyCanvas()
            : (isStudioOpen(state) ? renderFormStudio(state, selectedType) : renderOverviewCanvas(state, selectedType));

        return `
            <section class="${H.hub}-form-settings ${H.entity}-admin-workspace" data-lux-glass-root="1">
                <div class="${H.hub}-form-settings-head">
                    <div class="${H.hub}-form-settings-copy">
                        <span class="${H.hub}-overline lux-section-kicker"><i class="fas fa-sliders"></i> Admin workspace</span>
                        <strong class="${H.hub}-section-title lux-card-title">${H.entityTitle} form settings</strong>
                        <p class="${H.hub}-section-copy lux-panel-copy">
                            <span class="${H.hub}-result-pill home-hover-chip">${types.length} ${H.typeNoun}${types.length === 1 ? '' : 's'}</span>
                            Design registration forms per ${H.typeNoun} with a simple studio and live preview.
                        </p>
                    </div>
                    <button class="lux-secondary-btn" type="button" data-${H.data}-builder-action="back-directory">
                        <i class="fas fa-users"></i> ${H.directoryLabel}
                    </button>
                </div>
                <div class="${H.hub}-builder-layout">
                    ${renderTypeRail(types, selectedTypeId)}
                    ${canvas}
                </div>
            </section>
        `;
    }

    function datasetFromElement(el) {
        return {
            typeId: ds(el, 'staffTypeId', 'studentTypeId') || '',
            bucket: ds(el, 'staffBucket', 'studentBucket') || 'input',
            sectionId: ds(el, 'staffSectionId', 'studentSectionId') || '',
            fieldId: ds(el, 'staffFieldId', 'studentFieldId') || '',
            fieldType: ds(el, 'staffFieldType', 'studentFieldType') || '',
            builderTab: ds(el, 'staffBuilderTab', 'studentBuilderTab') || '',
            optionIndex: Number.parseInt(ds(el, 'staffOptionIndex', 'studentOptionIndex') ?? '', 10)
        };
    }

    function getFieldFromSchema(typeId, bucket, sectionId, fieldId) {
        void bucket;
        const section = getSchemaSections(typeId).find((item) => item.id === sectionId);
        return sortedFields(section?.fields || []).find((item) => item.id === fieldId) || null;
    }

    function syncFieldKeyFromLabel(state, typeId, bucket, sectionId, fieldId, label, callbacks) {
        if (state.lockedFieldKeys?.[fieldId]) return;
        if (typeof window[H.updateField] !== 'function') return;
        const nextKey = slugifyFieldKey(label);
        const result = window[H.updateField](typeId, bucket, sectionId, fieldId, { key: nextKey });
        if (result?.error) callbacks.onToast?.(result.error);
    }

    function findStudioFieldRow(root, fieldId, fromEl) {
        if (fromEl?.closest) {
            const scoped = fromEl.closest(`.${H.hub}-studio-field-row[data-${H.data}-field-id="${fieldId}"]`);
            if (scoped) return scoped;
        }
        return root?.querySelector?.(`.${H.hub}-studio-field-row[data-${H.data}-field-id="${fieldId}"]`) || null;
    }

    function syncFieldRequiredUi(row, required) {
        if (!row) return;
        row.classList.toggle('is-required', Boolean(required));
        const button = row.querySelector(('.' + H.hub + '-studio-required-btn'));
        if (!button) return;
        button.classList.toggle('is-required', Boolean(required));
        button.title = required ? 'Required' : 'Optional';
        button.setAttribute('aria-label', required ? 'Mark optional' : 'Mark required');
    }

    function syncFieldTypeUi(row, fieldType, bucket) {
        if (!row) return;
        const meta = typeMeta(fieldType, bucket);
        const triggerIcon = row.querySelector(('.' + H.hub + '-studio-type-trigger-icon i'));
        if (triggerIcon) triggerIcon.className = meta.icon;
        const triggerLabel = row.querySelector(('.' + H.hub + '-studio-type-trigger-label'));
        if (triggerLabel) triggerLabel.textContent = meta.label;
        const trigger = row.querySelector(('.' + H.hub + '-studio-type-trigger'));
        if (trigger) trigger.title = meta.label;
    }

    function syncFieldRemovePendingUi(root, state, typeId, bucket, sectionId, fieldId, pending) {
        const row = findStudioFieldRow(root, fieldId);
        if (!row) return;
        row.classList.toggle('is-remove-pending', Boolean(pending));
        const existing = row.querySelector(('.' + H.hub + '-studio-field-remove-confirm'));
        if (!pending) {
            existing?.remove();
            return;
        }
        if (existing) return;
        const field = getFieldFromSchema(typeId, bucket, sectionId, fieldId);
        if (!field) return;
        const stripHtml = renderFieldRemoveConfirmStrip({ fieldRemovePendingId: fieldId }, typeId, bucket, sectionId, field);
        const anchor = row.querySelector(('.' + H.hub + '-studio-field-main'));
        if (anchor && stripHtml) anchor.insertAdjacentHTML('afterend', stripHtml);
    }

    function syncFieldAdvancedDrawerUi(root, state, typeId, bucket, sectionId, fieldId) {
        const row = findStudioFieldRow(root, fieldId);
        if (!row) return;
        const existing = row.querySelector(('.' + H.hub + '-studio-advanced'));
        if (state.fieldAdvancedOpenId !== fieldId) {
            existing?.remove();
            return;
        }
        if (existing) return;
        const field = getFieldFromSchema(typeId, bucket, sectionId, fieldId);
        if (!field) return;
        const drawerHtml = renderFieldAdvancedDrawer(state, typeId, bucket, sectionId, field);
        if (drawerHtml) row.insertAdjacentHTML('beforeend', drawerHtml);
    }

    function cleanupStudioPortaledPanels(root) {
        if (!root) return;
        root.querySelectorAll(('.' + H.hub + '-studio-type-popover[open], .' + H.hub + '-studio-field-menu[open]')).forEach((popover) => {
            popover.open = false;
        });
        root.querySelectorAll(('.' + H.hub + '-studio-field-row.is-type-menu-open, .' + H.hub + '-studio-field-row.is-field-menu-open, .' + H.hub + '-studio-field-row.is-flip-menu-up')).forEach((row) => {
            row.classList.remove('is-type-menu-open', 'is-field-menu-open', 'is-flip-menu-up');
        });
    }

    function filterStudioStepNav(root, query = '') {
        if (!root) return;
        const normalized = String(query || '').trim().toLowerCase();
        root.querySelectorAll(('.' + H.hub + '-studio-step-nav-item')).forEach((item) => {
            const title = item.querySelector(('.' + H.hub + '-studio-step-nav-title'))?.textContent?.toLowerCase() || '';
            const badge = item.querySelector(('.' + H.hub + '-studio-step-nav-badge'))?.textContent?.toLowerCase() || '';
            const matches = !normalized || title.includes(normalized) || badge.includes(normalized);
            item.classList.toggle('is-filtered-out', !matches);
        });
    }

    function getStudioPreviewScrollTopForSection(previewBody, target, padding = 12) {
        if (!previewBody || !target) return 0;

        const maxScroll = Math.max(0, previewBody.scrollHeight - previewBody.clientHeight);
        const bodyRect = previewBody.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();

        const targetTop = targetRect.top - bodyRect.top + previewBody.scrollTop;
        const targetBottom = targetTop + target.offsetHeight;
        const viewport = previewBody.clientHeight;

        let scrollTop = targetTop - padding;

        if (targetBottom + padding > scrollTop + viewport) {
            scrollTop = targetBottom + padding - viewport;
        }

        return Math.min(Math.max(0, scrollTop), maxScroll);
    }

    function runAfterPreviewLayout(previewBody, callback) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                void previewBody.scrollHeight;
                callback();
            });
        });
    }

    function syncStudioPreviewFocus(activeSectionId, options = {}) {
        void activeSectionId;
        void options;
    }

    function patchStaffFormStudioCanvas(state = {}, callbacks = {}) {
        const root = contentRootEl();
        const layout = root?.querySelector(('.' + H.hub + '-builder-layout'));
        const canvas = layout?.querySelector((':scope > .' + H.hub + '-builder-canvas, :scope > .' + H.hub + '-form-studio'));
        if (!root || !layout || !canvas) return false;

        flushFocusedDroplistOptions(root, callbacks);
        cleanupStudioPortaledPanels(root);

        const previousActiveSectionId = root.querySelector(('.' + H.hub + '-studio-step-nav-item.is-active'))?.dataset?.[NS === 'staff' ? 'staffSectionId' : 'studentSectionId'] ?? null;
        const navScrollTop = root.querySelector(('.' + H.hub + '-studio-step-nav-list'))?.scrollTop ?? 0;
        const detailScrollTop = root.querySelector(('.' + H.hub + '-studio-step-detail-scroll'))?.scrollTop ?? 0;
        const builderListScrollTop = root.querySelector(('.' + H.hub + '-section-builder-list'))?.scrollTop ?? 0;
        const previewScrollTop = root.querySelector(('.' + H.hub + '-studio-preview-body'))?.scrollTop ?? 0;
        const previewWasOpen = root.querySelector(('.' + H.hub + '-studio-preview-wrap'))?.open ?? true;
        const stepSearchValue = root.querySelector(('[' + ('data-' + H.data + '-') + 'builder-input="step-search"]'))?.value || '';
        const selectedTypeId = state.selectedTypeId || state.formSettingsTypeId || null;
        const selectedType = selectedTypeId ? getType(selectedTypeId) : null;
        if (!selectedType) return false;

        const studioState = { ...state, selectedTypeId: selectedType.id };
        const sections = getSchemaSections(selectedType.id);
        const activeSectionId = getActiveSectionId(studioState, sections);
        const nextHtml = isStudioOpen(studioState)
            ? renderFormStudio(studioState, selectedType)
            : renderOverviewCanvas(studioState, selectedType);

        const wrapper = document.createElement('div');
        wrapper.innerHTML = nextHtml.trim();
        const replacement = wrapper.firstElementChild;
        if (!replacement) return false;

        replacement.classList.add('is-studio-patching');
        canvas.replaceWith(replacement);

        const navList = root.querySelector(('.' + H.hub + '-studio-step-nav-list'));
        if (navList) navList.scrollTop = navScrollTop;

        const detailScroll = root.querySelector(('.' + H.hub + '-studio-step-detail-scroll'));
        if (detailScroll) detailScroll.scrollTop = detailScrollTop;

        const builderList = root.querySelector(('.' + H.hub + '-section-builder-list'));
        if (builderList) builderList.scrollTop = builderListScrollTop;

        const previewBody = root.querySelector(('.' + H.hub + '-studio-preview-body'));
        const shouldScrollPreview = activeSectionId !== previousActiveSectionId;
        if (previewBody && !shouldScrollPreview) {
            previewBody.scrollTop = previewScrollTop;
        }

        const searchInput = root.querySelector(('[' + ('data-' + H.data + '-') + 'builder-input="step-search"]'));
        if (searchInput && stepSearchValue) searchInput.value = stepSearchValue;
        filterStudioStepNav(root, stepSearchValue);

        const previewWrap = root.querySelector(('.' + H.hub + '-studio-preview-wrap'));
        if (previewWrap) previewWrap.open = previewWasOpen;

        requestAnimationFrame(() => {
            replacement.classList.remove('is-studio-patching');
            syncStudioPreviewFocus(activeSectionId, {
                scroll: true,
                instant: true
            });
            const previewTarget = root.querySelector(('.' + H.hub + '-studio-preview-body'));
            if (previewTarget && typeof window.enhanceUniversalPickers === 'function') {
                window.enhanceUniversalPickers(previewTarget);
            }
        });

        return replacement;
    }

    function confirmRemoveBlueprintField(typeId, bucket, sectionId, fieldId, state, callbacks) {
        const result = typeof window[H.removeField] === 'function'
            ? window[H.removeField](typeId, bucket, sectionId, fieldId)
            : { error: 'Blueprint API unavailable.' };
        if (result?.error) {
            callbacks.onToast?.(result.error);
            return false;
        }
        const patch = { fieldRemovePendingId: null, builderDirty: true };
        if (state.fieldAdvancedOpenId === fieldId) patch.fieldAdvancedOpenId = null;
        callbacks.setState?.(patch);
        callbacks.onToast?.('Field removed.');
        notifyBlueprintSaved(callbacks, typeId);
        callbacks.onRefresh?.();
        return true;
    }

    function handleBuilderAction(action, el, callbacks) {
        const state = callbacks.getState?.() || {};
        const data = datasetFromElement(el);
        const typeId = data.typeId || state.selectedTypeId || getTypes()[0]?.id || '';

        switch (action) {
            case 'select-type': {
                callbacks.setState?.({ selectedTypeId: data.typeId, builderPanel: null, activeSectionId: null, fieldAdvancedOpenId: null, fieldRemovePendingId: null });
                callbacks.onRefresh?.();
                return;
            }
            case 'add-type': {
                const label = window.prompt(H.entityTitle + ' type label', 'Custom ' + H.entity);
                if (label == null) return;
                const trimmed = String(label).trim();
                if (!trimmed) {
                    callbacks.onToast?.(H.entityTitle + ' type label is required.');
                    return;
                }
                const result = typeof window[H.addType] === 'function' ? window[H.addType](trimmed) : { error: 'Blueprint API unavailable.' };
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                callbacks.setState?.({ selectedTypeId: result.type.id, builderPanel: null });
                callbacks.onToast?.(`Added ${H.typeNoun} "${result.type.label}".`);
                callbacks.onRefresh?.();
                return;
            }
            case 'delete-type': {
                if (!typeId) return;
                const type = getType(typeId);
                if (!type) return;
                if (!window.confirm(`Delete ${H.typeNoun} "${type.label}" and its form schema?`)) return;
                const result = typeof removeStaffFormType === 'function' ? removeStaffFormType(typeId) : { error: 'Blueprint API unavailable.' };
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                const remaining = getTypes();
                callbacks.setState?.({
                    selectedTypeId: remaining[0]?.id || null,
                    builderPanel: null,
                    copySourceTypeId: remaining.find((item) => item.id === state.copySourceTypeId) ? state.copySourceTypeId : (remaining[0]?.id || null)
                });
                callbacks.onToast?.(H.entityTitle + ' type removed.');
                callbacks.onRefresh?.();
                return;
            }
            case 'open-form-studio':
            case 'open-input-builder':
            case 'open-droplist-builder': {
                callbacks.setState?.({
                    selectedTypeId: typeId,
                    builderPanel: 'studio',
                    activeSectionId: state.activeSectionId || firstSectionId(typeId),
                    fieldAdvancedOpenId: null,
                    fieldRemovePendingId: null
                });
                callbacks.onRefresh?.();
                return;
            }
            case 'switch-builder-tab': {
                callbacks.setState?.({
                    builderPanel: 'studio',
                    activeSectionId: firstSectionId(typeId),
                    fieldAdvancedOpenId: null,
                    fieldRemovePendingId: null
                });
                callbacks.onRefresh?.();
                return;
            }
            case 'select-section':
            case 'preview-select-profile': {
                if (!data.sectionId) return;
                callbacks.setState?.({ activeSectionId: data.sectionId, fieldAdvancedOpenId: null, fieldRemovePendingId: null });
                callbacks.onRefresh?.();
                return;
            }
            case 'close-builder': {
                callbacks.setState?.({ builderPanel: null, fieldAdvancedOpenId: null, fieldRemovePendingId: null });
                callbacks.onRefresh?.();
                return;
            }
            case 'back-directory': {
                callbacks.setState?.({ builderPanel: null, workspace: 'directory' });
                if (typeof callbacks.onBackDirectory === 'function') callbacks.onBackDirectory();
                else callbacks.onRefresh?.();
                return;
            }
            case 'add-section': {
                if (!typeId) return;
                const section = addSectionFromTemplate(typeId, 'blank', '');
                if (section?.error) {
                    callbacks.onToast?.(section.error);
                    return;
                }
                if (!section?.id) {
                    callbacks.onToast?.('Unable to add section.');
                    return;
                }
                const openStudio = isStudioOpen(state);
                const nextState = {
                    activeSectionId: section.id,
                    builderDirty: true,
                    sectionNameFocusId: openStudio ? null : section.id
                };
                nextState.builderPanel = openStudio ? 'studio' : null;
                callbacks.setState?.(nextState);
                callbacks.onToast?.('Profile added — name it and add fields on the right.');
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'remove-section': {
                if (!typeId || !data.sectionId) return;
                if (!window.confirm('Remove this section and all of its fields?')) return;
                const sections = getSchemaSections(typeId);
                const nextActiveSectionId = neighborSectionIdAfterRemove(sections, data.sectionId);
                const result = typeof window[H.removeSection] === 'function'
                    ? window[H.removeSection](typeId, null, data.sectionId)
                    : { error: 'Blueprint API unavailable.' };
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                callbacks.setState?.({ activeSectionId: nextActiveSectionId, builderDirty: true, fieldRemovePendingId: null });
                callbacks.onToast?.('Section removed.');
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'move-section-up':
            case 'move-section-down': {
                if (!typeId || !data.sectionId) return;
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                const direction = action === 'move-section-up' ? 'up' : 'down';
                const result = typeof window[H.moveSection] === 'function'
                    ? window[H.moveSection](typeId, bucket, data.sectionId, direction)
                    : { error: 'Blueprint API unavailable.' };
                if (result?.error) callbacks.onToast?.(result.error);
                markBuilderDirty(callbacks);
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'quick-add-field': {
                if (!typeId || !data.sectionId) return;
                const fieldType = data.fieldType || 'text';
                const payload = starterFieldPayload(fieldType);
                const result = typeof window[H.addField] === 'function'
                    ? window[H.addField](typeId, null, data.sectionId, payload)
                    : { error: 'Blueprint API unavailable.' };
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                callbacks.setState?.({ activeSectionId: data.sectionId, fieldAdvancedOpenId: null, builderDirty: true });
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'add-field': {
                if (!typeId || !data.sectionId) return;
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                const result = typeof window[H.addField] === 'function'
                    ? window[H.addField](typeId, bucket, data.sectionId, bucket === 'droplist'
                        ? { label: 'New dropdown', options: [{ value: 'option_1', label: 'Option 1' }] }
                        : { label: 'New field', type: 'text' })
                    : { error: 'Blueprint API unavailable.' };
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                markBuilderDirty(callbacks);
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'toggle-field-required': {
                if (!typeId || !data.sectionId || !data.fieldId) return;
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                const field = getFieldFromSchema(typeId, bucket, data.sectionId, data.fieldId);
                if (!field || typeof window[H.updateField] !== 'function') return;
                const nextRequired = !field.required;
                const result = window[H.updateField](typeId, bucket, data.sectionId, data.fieldId, { required: nextRequired });
                if (result?.error) callbacks.onToast?.(result.error);
                const root = contentRootEl();
                syncFieldRequiredUi(findStudioFieldRow(root, data.fieldId, el), nextRequired);
                markBuilderDirty(callbacks);
                notifyBlueprintSaved(callbacks, typeId);
                return;
            }
            case 'set-field-type': {
                if (!typeId || !data.sectionId || !data.fieldId || !data.fieldType) return;
                const root = contentRootEl();
                closeStudioPopoverForAction(el);
                const result = typeof window[H.updateField] === 'function'
                    ? window[H.updateField](typeId, null, data.sectionId, data.fieldId, { type: data.fieldType })
                    : { error: 'Blueprint API unavailable.' };
                if (result?.error) callbacks.onToast?.(result.error);
                syncFieldTypeUi(findStudioFieldRow(root, data.fieldId, el), data.fieldType, fieldBucketForType(data.fieldType));
                markBuilderDirty(callbacks);
                notifyBlueprintSaved(callbacks, typeId);
                if (data.fieldType === 'select') callbacks.onRefresh?.();
                return;
            }
            case 'open-field-advanced': {
                callbacks.setState?.({ fieldAdvancedOpenId: data.fieldId, fieldRemovePendingId: null });
                const root = contentRootEl();
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                syncFieldRemovePendingUi(root, callbacks.getState?.() || {}, typeId, bucket, data.sectionId, data.fieldId, false);
                syncFieldAdvancedDrawerUi(root, callbacks.getState?.() || {}, typeId, bucket, data.sectionId, data.fieldId);
                closeStudioPopoverForAction(el);
                return;
            }
            case 'close-field-advanced': {
                callbacks.setState?.({ fieldAdvancedOpenId: null });
                const root = contentRootEl();
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                syncFieldAdvancedDrawerUi(root, callbacks.getState?.() || {}, typeId, bucket, data.sectionId, data.fieldId);
                return;
            }
            case 'duplicate-field': {
                if (!typeId || !data.sectionId || !data.fieldId) return;
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                const field = getFieldFromSchema(typeId, bucket, data.sectionId, data.fieldId);
                if (!field || typeof window[H.addField] !== 'function') return;
                const copy = {
                    label: `${field.label} copy`,
                    key: `${field.key}_copy`,
                    type: field.type,
                    required: field.required,
                    placeholder: field.placeholder,
                    width: field.width,
                    help: field.help,
                    showInDirectoryFilter: field.showInDirectoryFilter,
                    showOnPersonalData: field.showOnPersonalData,
                    options: Array.isArray(field.options) ? field.options.map((item) => ({ ...item })) : undefined
                };
                const result = window[H.addField](typeId, bucket, data.sectionId, copy);
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                markBuilderDirty(callbacks);
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'remove-field':
            case 'request-remove-field': {
                if (!typeId || !data.sectionId || !data.fieldId) return;
                callbacks.setState?.({ fieldRemovePendingId: data.fieldId });
                const root = contentRootEl();
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                syncFieldRemovePendingUi(root, callbacks.getState?.() || {}, typeId, bucket, data.sectionId, data.fieldId, true);
                closeStudioPopoverForAction(el);
                return;
            }
            case 'cancel-remove-field': {
                callbacks.setState?.({ fieldRemovePendingId: null });
                const root = contentRootEl();
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                syncFieldRemovePendingUi(root, callbacks.getState?.() || {}, typeId, bucket, data.sectionId, data.fieldId, false);
                return;
            }
            case 'confirm-remove-field': {
                if (!typeId || !data.sectionId || !data.fieldId) return;
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                confirmRemoveBlueprintField(typeId, bucket, data.sectionId, data.fieldId, state, callbacks);
                return;
            }
            case 'move-field-up':
            case 'move-field-down': {
                if (!typeId || !data.sectionId || !data.fieldId) return;
                const bucket = data.bucket === 'droplist' ? 'droplist' : 'input';
                const direction = action === 'move-field-up' ? 'up' : 'down';
                const result = moveFormFieldLocal(typeId, bucket, data.sectionId, data.fieldId, direction);
                if (result?.error) callbacks.onToast?.(result.error);
                markBuilderDirty(callbacks);
                notifyBlueprintSaved(callbacks, typeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'copy-blueprint': {
                const current = callbacks.getState?.() || {};
                const targetTypeId = current.selectedTypeId || typeId;
                const sourceTypeId = current.copySourceTypeId;
                if (!targetTypeId || !sourceTypeId) {
                    callbacks.onToast?.('Select a source ' + H.typeNoun + ' to copy from.');
                    return;
                }
                const result = typeof copyStaffFormBlueprint === 'function'
                    ? copyStaffFormBlueprint(sourceTypeId, targetTypeId, {
                        sections: current.copySections !== false
                    })
                    : { error: 'Blueprint API unavailable.' };
                if (result?.error) {
                    callbacks.onToast?.(result.error);
                    return;
                }
                markBuilderDirty(callbacks);
                callbacks.onToast?.('Blueprint copied successfully.');
                notifyBlueprintSaved(callbacks, targetTypeId);
                callbacks.onRefresh?.();
                return;
            }
            case 'save-blueprint': {
                const savedTypeId = callbacks.getState?.()?.selectedTypeId || typeId;
                const emptySteps = countEmptyBlueprintSections(savedTypeId);
                persistBlueprint();
                callbacks.setState?.({ builderDirty: false, builderLastSavedAt: new Date().toISOString() });
                if (emptySteps > 0) {
                    callbacks.onToast?.(`${emptySteps} profile${emptySteps === 1 ? '' : 's'} have no fields and won't appear in ${H.addEntityLabel}. Add fields or remove empty profiles.`);
                } else {
                    callbacks.onToast?.('Blueprint saved.');
                }
                notifyBlueprintSaved(callbacks, savedTypeId);
                callbacks.onRefresh?.();
                return;
            }
            default:
                return;
        }
    }
    const __fbActions = typeof window.__kiuCreateFormBuilderActionsApi === 'function'
        ? window.__kiuCreateFormBuilderActionsApi({
            H, NS, datasetFromElement, getTypes, getType,
            handleBuilderAction, saveDroplistOptionsLines,
            syncStudioPreviewFocus, parseOptionsFromLines,
            contentRootEl, ds, filterStudioStepNav, markBuilderDirty,
            notifyBlueprintSaved, sectionTitleDisplay, updateStudioSaveStatus,
            syncFieldKeyFromLabel, scheduleDroplistOptionsSave, droplistOptionsSaveTimers,
            reorderStaffFormSectionLocal, reorderStaffFormFieldLocal
        })
        : null;
    if (!__fbActions) throw new Error('form-builder-actions-runtime missing');
    const { handleBuilderInput, handleBuilderCopyChange, syncStudioPopoverRowState, syncStudioPopoverPlacement, closeOtherStudioPopovers, closeOpenStudioPopovers, isStudioPopoverInteractionTarget, closeStudioPopoverForAction, clearStaffBuilderDropIndicators, resolveStaffBuilderDropIndex, findStaffBuilderDropTarget, finishStaffBuilderDragReorder, bindStaffBuilderDragReorder, bindStaffFormBuilderEvents } = __fbActions;

    // Domain-specific window exports (same engine, staff or student names)
    if (NS === 'staff') {
        window.renderStaffFormSettings = renderStaffFormSettings;
        window.bindStaffFormBuilderEvents = bindStaffFormBuilderEvents;
        window.patchStaffFormStudioCanvas = patchStaffFormStudioCanvas;
        window.parseStaffFormOptionsFromLines = parseOptionsFromLines;
        window.slugifyStaffFormFieldKey = slugifyFieldKey;
        window.focusSectionCatalogTitle = focusCatalogTitle;
        window.flushStaffBuilderFieldInputs = flushBuilderFieldInputs;
    } else {
        window.renderStudentFormSettings = renderStaffFormSettings;
        window.bindStudentFormBuilderEvents = bindStaffFormBuilderEvents;
        window.patchStudentFormStudioCanvas = patchStaffFormStudioCanvas;
        window.parseStudentFormOptionsFromLines = parseOptionsFromLines;
        window.slugifyStudentFormFieldKey = slugifyFieldKey;
        window.focusStudentSectionCatalogTitle = focusCatalogTitle;
        window.flushStudentBuilderFieldInputs = flushBuilderFieldInputs;
    }
    window.syncStudioPreviewFocus = syncStudioPreviewFocus;
    window.getStudioPreviewScrollTopForSection = getStudioPreviewScrollTopForSection;
    window.syncStudioPopoverPlacement = syncStudioPopoverPlacement;
    window.addSectionFromTemplate = addSectionFromTemplate;
    window.focusCatalogTitle = focusCatalogTitle;
    window.sectionTitleDisplay = sectionTitleDisplay;

})();
