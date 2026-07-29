/* Wave bag: Wave 26 form-renderer */
window.KiuFormRenderer = window.KiuFormRenderer || {};
const __kiuFormRenApi = window.KiuFormRenderer;
window.__kiuFormRenApi = __kiuFormRenApi;
function __kiuFormRenExpose(map) {
    Object.keys(map).forEach((key) => {
        __kiuFormRenApi[key] = map[key];
        window[key] = map[key];
    });
}

(function initFormRendererRuntime() {
    'use strict';

    const NS = window.__KIU_FORM_RENDERER_NS__ || window.__KIU_FORM_BUILDER_NS__;
    if (NS !== 'staff' && NS !== 'student') {
        console.error('[form-renderer-runtime] Set window.__KIU_FORM_RENDERER_NS__ (or FORM_BUILDER_NS) to "staff" or "student".');
        return;
    }
    const H = NS === 'staff'
        ? {
            escapeHtml: 'staffFormEscapeHtml',
            contentRoot: '#staff-content',
            hub: 'staff-hub',
            data: 'staff',
            formPrefix: 'staffForm_',
            modalRoot: '#staff-command-modal-root',
            getTypes: 'getStaffFormTypes',
            getType: 'getStaffFormType',
            getSchema: 'getStaffFormSchema',
            getBlueprint: 'getStaffFormBlueprint',
            schemaIsEmpty: 'staffFormSchemaIsEmpty',
            getAllFields: 'getAllStaffFormFields',
            profileSectionPrefix: 'staff-profile-section-',
            entityLabel: 'Staff',
            typeIdKey: 'staffTypeId',
            idKey: 'staff_id',
            idField: 'staffId',
            statusKey: 'staff_status',
        }
        : {
            escapeHtml: 'studentFormEscapeHtml',
            contentRoot: '#students-content',
            hub: 'students-hub',
            data: 'student',
            formPrefix: 'studentForm_',
            modalRoot: '#students-admin-modal-root',
            getTypes: 'getStudentFormTypes',
            getType: 'getStudentFormType',
            getSchema: 'getStudentFormSchema',
            getBlueprint: 'getStudentFormBlueprint',
            schemaIsEmpty: 'studentFormSchemaIsEmpty',
            getAllFields: 'getAllStudentFormFields',
            profileSectionPrefix: 'student-profile-section-',
            entityLabel: 'Student',
            typeIdKey: 'studentTypeId',
            idKey: 'student_id',
            idField: 'studentId',
            statusKey: 'student_status',
        };

    const escapeHtml = typeof window[H.escapeHtml] === 'function'
        ? window[H.escapeHtml]
        : (value) => String(value ?? '');

    function domFieldId(typeId, fieldKey) {
        return `${H.formPrefix}${typeId}_${fieldKey}`.replace(/[^a-zA-Z0-9_]/g, '_');
    }

    function getFieldValueFromRecord(record, field) {
        const values = record?.fieldValues && typeof record.fieldValues === 'object' ? record.fieldValues : {};
        if (Object.prototype.hasOwnProperty.call(values, field.key)) return values[field.key];
        const legacyKey = typeof getLegacyFieldAlias === 'function' ? getLegacyFieldAlias(field.key) : null;
        if (legacyKey && record && Object.prototype.hasOwnProperty.call(record, legacyKey)) {
            const legacyValue = record[legacyKey];
            if (Array.isArray(legacyValue)) return legacyValue.join(', ');
            return legacyValue ?? '';
        }
        return '';
    }

    function renderFieldLabel(field, fieldId) {
        const requiredMark = field.required
            ? ('<span class="' + H.hub + '-required-mark" aria-hidden="true">*</span>')
            : '';
        return `
            <label for="${escapeHtml(fieldId)}">
                <span class="${H.hub}-field-complete-dot" aria-hidden="true"></span>
                <span>${escapeHtml(field.label)}</span>
                ${requiredMark}
            </label>
        `;
    }

    function fieldCompleteAttr(value, field) {
        const filled = Boolean(String(value ?? '').trim());
        if (!field.required) return filled ? 'true' : 'false';
        return filled ? 'true' : 'false';
    }

    function renderBlueprintField(typeId, field, value, options = {}) {
        const fieldId = domFieldId(typeId, field.key);
        const widthClass = field.width === 'full' ? ' is-full' : '';
        const completeAttr = fieldCompleteAttr(value, field);
        const labelMarkup = renderFieldLabel(field, fieldId);
        const errorMarkup = options.previewMode
            ? ''
            : ('<div class="' + H.hub + '-error"><i class="fas fa-circle-exclamation" aria-hidden="true"></i> This field is required.</div>');
        if (field.type === 'select') {
            const hasValue = String(value ?? '').trim() !== '';
            const placeholderOption = !field.required && !hasValue
                ? '<option value="" selected></option>'
                : '';
            const optionMarkup = (field.options || []).map((option) => {
                const selected = String(value) === String(option.value) ? ' selected' : '';
                return `<option value="${escapeHtml(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
            }).join('');
            return `
                <div class="${H.hub}-field${widthClass}" data-field="${escapeHtml(fieldId)}" data-${H.data}-field-key="${escapeHtml(field.key)}" data-${H.data}-field-complete="${completeAttr}" data-${H.data}-field-required="${field.required ? 'true' : 'false'}">
                    ${labelMarkup}
                    <select class="${H.hub}-control lux-control" id="${escapeHtml(fieldId)}" data-${H.data}-blueprint-field="${escapeHtml(field.key)}" data-lux-picker-label="${escapeHtml(field.label)}${field.required ? ' *' : ''}" ${field.required ? 'required' : ''}>
                        ${placeholderOption}${optionMarkup}
                    </select>
                    ${field.help ? `<div class="${H.hub}-help">${escapeHtml(field.help)}</div>` : ''}
                    ${errorMarkup}
                </div>
            `;
        }
        if (field.type === 'textarea') {
            return `
                <div class="${H.hub}-field${widthClass}" data-field="${escapeHtml(fieldId)}" data-${H.data}-field-key="${escapeHtml(field.key)}" data-${H.data}-field-complete="${completeAttr}" data-${H.data}-field-required="${field.required ? 'true' : 'false'}">
                    ${labelMarkup}
                    <textarea class="${H.hub}-control lux-control" id="${escapeHtml(fieldId)}" data-${H.data}-blueprint-field="${escapeHtml(field.key)}" placeholder="${escapeHtml(field.placeholder || '')}" ${field.required ? 'required' : ''}>${escapeHtml(value ?? '')}</textarea>
                    ${field.help ? `<div class="${H.hub}-help">${escapeHtml(field.help)}</div>` : ''}
                    ${errorMarkup}
                </div>
            `;
        }
        const generatedEmail = field.key === 'institutional_email' && options.lockGeneratedEmail;
        const readonlyAttr = generatedEmail ? (` readonly aria-readonly="true" data-${H.data}-generated-email="true"`) : '';
        const generatedHelp = generatedEmail ? ('<div class="' + H.hub + '-help">Generated from ' + H.entityLabel + ' ID</div>') : '';
        return `
            <div class="${H.hub}-field${widthClass}" data-field="${escapeHtml(fieldId)}" data-${H.data}-field-key="${escapeHtml(field.key)}" data-${H.data}-field-complete="${completeAttr}" data-${H.data}-field-required="${field.required ? 'true' : 'false'}">
                ${labelMarkup}
                <input class="${H.hub}-control lux-control" id="${escapeHtml(fieldId)}" type="${escapeHtml(field.type || 'text')}" value="${escapeHtml(value ?? '')}" placeholder="${escapeHtml(field.placeholder || '')}" data-${H.data}-blueprint-field="${escapeHtml(field.key)}" ${field.required ? 'required' : ''}${readonlyAttr}>
                ${field.help ? `<div class="${H.hub}-help">${escapeHtml(field.help)}</div>` : ''}
                ${generatedHelp}
                ${errorMarkup}
            </div>
        `;
    }

    function sortedBlueprintSections(schema = {}) {
        return (schema.sections || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    function activeBlueprintSections(schema = {}) {
        return sortedBlueprintSections(schema).filter((section) => (section.fields || []).length);
    }

    function blueprintSectionCount(schema = {}) {
        return sortedBlueprintSections(schema).length;
    }

    function renderDomainBlueprintSection(typeId, section, sectionMeta = {}, values = {}, options = {}) {
        const fields = (section.fields || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (!fields.length) return '';
        const fullWidthCount = fields.filter((field) => field.width === 'full' || field.type === 'textarea').length;
        const gridClass = fullWidthCount === fields.length ? ' is-one' : (fields.length === 1 ? ' is-one' : '');
        const sectionIndex = sectionMeta.index || 1;
        const sectionTotal = sectionMeta.total || 1;
        const anchorId = `${H.profileSectionPrefix}${String(section.id || '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
        return `
            <section class="${H.hub}-form-section lux-data-card" id="${escapeHtml(anchorId)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                <div class="${H.hub}-form-section-head">
                    <div>
                        <span class="${H.hub}-overline">Section ${sectionIndex} of ${sectionTotal}</span>
                        <strong>${escapeHtml(profileSectionDisplayTitle(section.title))}</strong>
                        ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
                    </div>
                    <span class="${H.hub}-section-status" data-${H.data}-section-status aria-hidden="true"><i class="fas fa-circle"></i></span>
                </div>
                <div class="${H.hub}-form-grid${gridClass}">
                    ${fields.map((field) => renderBlueprintField(typeId, field, getFieldValueFromRecord(values, field), options)).join('')}
                </div>
            </section>
        `;
    }

    function renderDomainFormFromBlueprint(typeId, record = null, options = {}) {
        const type = typeof window[H.getType] === 'function' ? window[H.getType](typeId) : null;
        const schema = typeof window[H.getSchema] === 'function' ? window[H.getSchema](typeId) : { sections: [] };
        const renderOptions = {
            ...options,
            lockGeneratedEmail: options.lockGeneratedEmail === true
        };
        const values = record?.fieldValues || record || {};
        if (typeof window[H.schemaIsEmpty] === 'function' && window[H.schemaIsEmpty](typeId)) {
            const sectionCount = blueprintSectionCount(schema);
            if (sectionCount > 0) {
                return `
                    <div class="${H.hub}-schema-empty lux-data-card">
                        <div class="${H.hub}-schema-empty-icon"><i class="fas fa-layer-group"></i></div>
                        <strong>Steps configured, but no fields yet</strong>
                        <p>Your blueprint has ${sectionCount} step${sectionCount === 1 ? '' : 's'} without fields. Open Form settings and use Quick add inside each step so they appear in Add ${H.entityLabel}.</p>
                        ${options.showSettingsLink !== false ? `<button class="lux-primary-btn" type="button" data-${H.data}-action="open-form-settings" data-${H.data}-type-id="${escapeHtml(typeId)}">Open Form settings</button>` : ''}
                    </div>
                `;
            }
            return `
                <div class="${H.hub}-schema-empty lux-data-card">
                    <div class="${H.hub}-schema-empty-icon"><i class="fas fa-sliders"></i></div>
                    <strong>No form configured yet</strong>
                    <p>Configure form sections for ${escapeHtml(type?.label || 'this staff type')} in Form settings before creating profiles.</p>
                    ${options.showSettingsLink !== false ? `<button class="lux-primary-btn" type="button" data-${H.data}-action="open-form-settings" data-${H.data}-type-id="${escapeHtml(typeId)}">Open Form settings</button>` : ''}
                </div>
            `;
        }
        const sections = sortedBlueprintSections(schema);
        const activeSections = sections.filter((section) => (section.fields || []).length);
        if (!activeSections.length) {
            return `
                <div class="${H.hub}-schema-empty lux-data-card">
                    <div class="${H.hub}-schema-empty-icon"><i class="fas fa-layer-group"></i></div>
                    <strong>No profile fields yet</strong>
                    <p>Add fields to profiles in Form settings to preview the registration form.</p>
                </div>
            `;
        }
        if (options.activeSectionId) {
            const targetSection = activeSections.find((section) => section.id === options.activeSectionId) || activeSections[0];
            const sectionIndex = Math.max(1, activeSections.findIndex((section) => section.id === targetSection.id) + 1);
            return renderDomainBlueprintSection(
                typeId,
                targetSection,
                { index: sectionIndex, total: activeSections.length },
                values,
                renderOptions
            );
        }
        const sectionTotal = activeSections.length;
        let sectionIndex = 0;
        const renderIndexedSection = (section) => {
            if (!(section.fields || []).length) return '';
            sectionIndex += 1;
            return renderDomainBlueprintSection(typeId, section, { index: sectionIndex, total: sectionTotal }, values, renderOptions);
        };
        return sections.map(renderIndexedSection).join('');
    }

    function formatBlueprintFieldValue(field, rawValue) {
        const text = String(rawValue ?? '').trim();
        if (!text) return { display: '—', isEmpty: true, isMultiline: false };

        if (field.type === 'select') {
            const option = (field.options || []).find((item) => String(item.value) === text);
            return { display: option?.label || text, isEmpty: false, isMultiline: false };
        }

        if (field.type === 'textarea') {
            return { display: text, isEmpty: false, isMultiline: true };
        }

        if (text.includes(',')) {
            const parts = text.split(',').map((item) => item.trim()).filter(Boolean);
            if (parts.length > 1) {
                return { display: parts, isEmpty: false, isMultiline: false, isChips: true };
            }
        }

        return { display: text, isEmpty: false, isMultiline: false };
    }

    function renderDomainBlueprintProfileField(field, record) {
        const rawValue = getFieldValueFromRecord(record, field);
        const formatted = formatBlueprintFieldValue(field, rawValue);
        const widthClass = field.width === 'full' || field.type === 'textarea' ? ' is-full' : '';
        const emptyClass = formatted.isEmpty ? ' is-empty' : '';

        let valueMarkup = '';
        if (formatted.isChips && Array.isArray(formatted.display)) {
            valueMarkup = `<div class="${H.hub}-chips ${H.hub}-chips--spaced">${formatted.display.map((item) => `<span class="${H.hub}-chip lux-status-pill home-hover-chip">${escapeHtml(item)}</span>`).join('')}</div>`;
        } else if (formatted.isMultiline) {
            valueMarkup = `<p class="${H.hub}-profile-field-value${emptyClass}">${escapeHtml(formatted.display)}</p>`;
        } else {
            valueMarkup = `<div class="${H.hub}-profile-field-value${emptyClass}">${escapeHtml(formatted.display)}</div>`;
        }

        return `
            <div class="${H.hub}-profile-field lux-soft-chrome home-hover-chip${widthClass}" data-${H.data}-field-key="${escapeHtml(field.key)}">
                <span class="${H.hub}-profile-field-label">${escapeHtml(field.label)}</span>
                ${valueMarkup}
            </div>
        `;
    }

    function profileSectionAnchorId(sectionId) {
        return `${H.profileSectionPrefix}${String(sectionId || '').replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    }

    function profileSectionDisplayTitle(title) {
        const trimmed = String(title ?? '').trim();
        return trimmed || 'Untitled profile';
    }

    function renderDomainBlueprintProfileSectionNav(sections = []) {
        if (sections.length < 3) return '';
        const pills = sections.map((section, index) => {
            const anchorId = profileSectionAnchorId(section.id);
            return `
                <button class="${H.hub}-profile-section-pill" type="button" data-${H.data}-profile-section-jump="${escapeHtml(anchorId)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                    <span class="${H.hub}-profile-section-pill-index">${index + 1}</span>
                    <span class="${H.hub}-profile-section-pill-label">${escapeHtml(profileSectionDisplayTitle(section.title))}</span>
                </button>
            `;
        }).join('');
        return `
            <nav class="${H.hub}-profile-section-nav lux-scrollbar" aria-label="Profile sections">
                <div class="${H.hub}-profile-section-nav-track">${pills}</div>
            </nav>
        `;
    }

    function renderDomainBlueprintProfileSection(typeId, section, sectionMeta = {}, record = {}) {
        const fields = (section.fields || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        if (!fields.length) return '';
        const fullWidthCount = fields.filter((field) => field.width === 'full' || field.type === 'textarea').length;
        const gridClass = fullWidthCount === fields.length ? ' is-one' : (fields.length === 1 ? ' is-one' : '');
        const sectionIndex = sectionMeta.index || 1;
        const sectionTotal = sectionMeta.total || 1;
        const anchorId = profileSectionAnchorId(section.id);
        return `
            <section class="${H.hub}-form-section lux-data-card home-hover-chip" id="${escapeHtml(anchorId)}" data-${H.data}-section-id="${escapeHtml(section.id)}">
                <div class="${H.hub}-form-section-head">
                    <div>
                        <span class="${H.hub}-overline">Section ${sectionIndex} of ${sectionTotal}</span>
                        <strong>${escapeHtml(profileSectionDisplayTitle(section.title))}</strong>
                        ${section.description ? `<p>${escapeHtml(section.description)}</p>` : ''}
                    </div>
                </div>
                <div class="${H.hub}-form-grid${gridClass}">
                    ${fields.map((field) => renderDomainBlueprintProfileField(field, record)).join('')}
                </div>
            </section>
        `;
    }

    function renderDomainBlueprintProfileView(typeId, record = {}, options = {}) {
        const type = typeof window[H.getType] === 'function' ? window[H.getType](typeId) : null;
        const schema = typeof window[H.getSchema] === 'function' ? window[H.getSchema](typeId) : { sections: [] };
        if (typeof window[H.schemaIsEmpty] === 'function' && window[H.schemaIsEmpty](typeId)) {
            const sectionCount = blueprintSectionCount(schema);
            if (sectionCount > 0) {
                return `
                    <div class="${H.hub}-schema-empty lux-data-card">
                        <div class="${H.hub}-schema-empty-icon"><i class="fas fa-layer-group"></i></div>
                        <strong>Steps configured, but no fields yet</strong>
                        <p>Your blueprint has ${sectionCount} step${sectionCount === 1 ? '' : 's'} without fields. Open Form settings and use Quick add inside each step.</p>
                    </div>
                `;
            }
            return `
                <div class="${H.hub}-schema-empty lux-data-card">
                    <div class="${H.hub}-schema-empty-icon"><i class="fas fa-sliders"></i></div>
                    <strong>No form configured yet</strong>
                    <p>Configure form sections for ${escapeHtml(type?.label || 'this staff type')} in Form settings.</p>
                </div>
            `;
        }
        const sections = sortedBlueprintSections(schema);
        const activeSections = sections.filter((section) => (section.fields || []).length);
        if (!activeSections.length) {
            return `
                <div class="${H.hub}-schema-empty lux-data-card">
                    <div class="${H.hub}-schema-empty-icon"><i class="fas fa-layer-group"></i></div>
                    <strong>No profile fields yet</strong>
                    <p>Add fields to profiles in Form settings to show staff data here.</p>
                </div>
            `;
        }
        const sectionTotal = activeSections.length;
        const activeSectionId = options.activeSectionId || null;
        const targetSection = activeSectionId
            ? (activeSections.find((section) => section.id === activeSectionId) || activeSections[0])
            : activeSections[0];
        const sectionIndex = Math.max(1, activeSections.findIndex((section) => section.id === targetSection.id) + 1);
        const bodyMarkup = renderDomainBlueprintProfileSection(
            typeId,
            targetSection,
            { index: sectionIndex, total: sectionTotal },
            record
        );
        return `<div class="${H.hub}-profile-sections">${bodyMarkup}</div>`;
    }

    function readBlueprintFieldValue(typeId, field) {
        const fieldId = domFieldId(typeId, field.key);
        const element = document.getElementById(fieldId)
            || document.querySelector(` [data-${H.data}-blueprint-field="${field.key}"]`);
        if (!element) return '';
        if (element.tagName === 'SELECT') return element.value || '';
        if (element.tagName === 'TEXTAREA') return element.value || '';
        return element.value || '';
    }

    function collectStaffFormValues(typeId) {
        const fields = typeof window[H.getAllFields] === 'function' ? window[H.getAllFields](typeId) : [];
        const values = {};
        fields.forEach((field) => {
            values[field.key] = readBlueprintFieldValue(typeId, field);
        });
        return values;
    }

    function validateStaffFormValues(typeId, values, soft = false) {
        const fields = typeof window[H.getAllFields] === 'function' ? window[H.getAllFields](typeId) : [];
        const errors = [];
        fields.forEach((field) => {
            const raw = values[field.key];
            const value = String(raw ?? '').trim();
            const fieldId = domFieldId(typeId, field.key);
            if (!soft && field.required && !value) errors.push({ fieldId, key: field.key, message: `${field.label} is required.` });
            if (!value) return;
            if (field.type === 'email' && !/^\S+@\S+\.\S+$/.test(value)) errors.push({ fieldId, key: field.key, message: `${field.label} must be a valid email.` });
            if (field.type === 'url' && !/^https?:\/\//i.test(value)) errors.push({ fieldId, key: field.key, message: `${field.label} must start with http:// or https://` });
            if (field.type === 'number' && Number.isNaN(Number(value))) errors.push({ fieldId, key: field.key, message: `${field.label} must be a number.` });
        });
        return errors;
    }

    function computeStaffFormCompleteness(typeId, values = {}) {
        const fields = typeof window[H.getAllFields] === 'function' ? window[H.getAllFields](typeId) : [];
        if (!fields.length) return { percent: 0, missing: ['form configuration'], checks: [] };
        const requiredFields = fields.filter((field) => field.required);
        const weighted = requiredFields.length ? requiredFields : fields;
        const unit = Math.floor(100 / weighted.length) || 1;
        let earned = 0;
        const missing = [];
        weighted.forEach((field) => {
            const value = String(values[field.key] ?? '').trim();
            const ok = Boolean(value);
            if (ok) earned += unit;
            else missing.push(field.label.toLowerCase());
        });
        return {
            percent: Math.min(100, earned),
            missing,
            checks: weighted.map((field) => ({ key: field.key, label: field.label, ok: Boolean(String(values[field.key] ?? '').trim()) }))
        };
    }

    function mapFieldValuesToLegacyRecord(typeId, values = {}, baseRecord = {}) {
        const type = typeof window[H.getType] === 'function' ? window[H.getType](typeId) : null;
        const next = { ...baseRecord, [H.typeIdKey]: typeId, fieldValues: { ...values } };
        Object.entries(values).forEach(([key, value]) => {
            const legacyKey = typeof getLegacyFieldAlias === 'function' ? getLegacyFieldAlias(key) : null;
            if (!legacyKey) return;
            if (legacyKey === 'expertise' || legacyKey === 'languages') {
                next[legacyKey] = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
            } else if (legacyKey === 'maxHours') {
                next[legacyKey] = Math.max(1, Number(value || baseRecord.maxHours || 15));
            } else {
                next[legacyKey] = value;
            }
        });
        next.platformRole = type?.platformRole || baseRecord.platformRole || 'professor';
        next.profileKey = next.platformRole === 'ta' ? 'tas' : (next.platformRole === 'student_service' ? 'service' : 'professors');
        next.name = next.name || values.full_name || '';
        next.nameEn = next.nameEn || values.english_name || next.name;
        next.email = next.email || values.institutional_email || '';
        next[H.idField] = next[H.idField] || values[H.idKey] || '';
        next.status = next.status || values[H.statusKey] || 'Active';
        next.role = next.role || values.display_role || next.title || H.entityLabel;
        next.title = next.title || values.title || next.role;
        return next;
    }

    function hydrateFieldValuesFromRecord(record, typeId) {
        const values = { ...(record?.fieldValues || {}) };
        const fields = typeof window[H.getAllFields] === 'function' ? window[H.getAllFields](typeId) : [];
        fields.forEach((field) => {
            if (values[field.key] != null && String(values[field.key]).trim()) return;
            values[field.key] = getFieldValueFromRecord(record, field);
        });
        if (NS === 'staff') {
            if (!String(values.staff_id ?? '').trim() && record?.staffId) {
                values.staff_id = record.staffId;
            }
        } else if (!String(values.student_id ?? '').trim() && record?.studentId) {
            values.student_id = record.studentId;
        }
        return values;
    }

    function clearStaffFormErrors(root = document) {
        root.querySelectorAll((' .' + H.hub + '-field.is-invalid')).forEach((field) => field.classList.remove('is-invalid'));
    }

    function markStaffFormInvalid(fieldId) {
        const field = document.getElementById(fieldId)?.closest(('.' + H.hub + '-field'))
            || document.querySelector(`[data-field="${fieldId}"]`);
        if (field) field.classList.add('is-invalid');
    }

    __kiuFormRenExpose({
        renderDomainFormFromBlueprint,
        renderDomainBlueprintProfileView,
        renderDomainBlueprintProfileSectionNav,
        profileSectionAnchorId,
        mapFieldValuesToLegacyRecord,
        hydrateFieldValuesFromRecord,
    });
    if (NS === 'staff') {
        window.renderStaffBlueprintField = renderBlueprintField;
        window.renderStaffFormFromBlueprint = renderDomainFormFromBlueprint;
        window.renderStaffBlueprintProfileView = renderDomainBlueprintProfileView;
        window.renderStaffBlueprintProfileSectionNav = renderDomainBlueprintProfileSectionNav;
        __kiuFormRenExpose({
            collectStaffFormValues,
            validateStaffFormValues,
            computeStaffFormCompleteness,
            clearStaffFormErrors,
            markStaffFormInvalid,
        });
        window.getStaffBlueprintFieldValueFromRecord = getFieldValueFromRecord;
    } else {
        window.renderStudentBlueprintField = renderBlueprintField;
        window.renderStudentFormFromBlueprint = renderDomainFormFromBlueprint;
        window.renderStudentBlueprintProfileView = renderDomainBlueprintProfileView;
        window.renderStudentBlueprintProfileSectionNav = renderDomainBlueprintProfileSectionNav;
        window.collectStudentFormValues = collectStaffFormValues;
        window.validateStudentFormValues = validateStaffFormValues;
        window.computeStudentFormCompleteness = computeStaffFormCompleteness;
        window.clearStudentFormErrors = clearStaffFormErrors;
        window.markStudentFormInvalid = markStaffFormInvalid;
        window.getStudentBlueprintFieldValueFromRecord = getFieldValueFromRecord;
    }

})();
