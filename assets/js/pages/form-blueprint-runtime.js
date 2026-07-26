(function initFormBlueprintRuntime() {
    'use strict';
    if (window.__KIU_FORM_BLUEPRINT_RUNTIME_LOADED) return;
    window.__KIU_FORM_BLUEPRINT_RUNTIME_LOADED = true;

    window.__kiuCreateFormBlueprintApi = function createKiuFormBlueprintApi(deps) {
        void deps;
        return window.KiuFormBlueprint || {};
    };

    const NS = window.__KIU_FORM_BLUEPRINT_NS__ || window.__KIU_FORM_BUILDER_NS__;
    if (NS !== 'staff' && NS !== 'student') {
        console.error('[form-blueprint-runtime] Set window.__KIU_FORM_BLUEPRINT_NS__ to "staff" or "student".');
        return;
    }

    const BLUEPRINT_VERSION = 2;
    const INPUT_FIELD_TYPES = ['text', 'email', 'url', 'tel', 'date', 'number', 'textarea'];

    const H = NS === 'staff'
        ? {
            blueprintKey: 'staffFormBlueprint',
            multiType: true,
            typesKey: 'staffTypes',
            singleTypeId: null,
            slugFallback: 'staff_type',
            entityLabel: 'Staff',
            typeNoun: 'staff type',
            idPrefix: 'staff_',
            customLabel: 'Custom staff',
            legacyAliases: {
                full_name: 'name',
                institutional_email: 'email',
                english_name: 'nameEn',
                staff_id: 'staffId',
                phone: 'phone',
                photo_url: 'photo',
                staff_status: 'status',
                display_role: 'role',
                title: 'title',
                academic_rank: 'rank',
                department: 'department',
                faculty_school: 'faculty',
                employment_type: 'employmentType',
                campus: 'campus',
                office: 'office',
                profile_visibility: 'visibility',
                biography: 'bio',
                expertise: 'expertise',
                languages: 'languages',
                lms_account_status: 'accountStatus',
                lms_permission_role: 'lmsRole',
                last_login: 'lastLogin',
                internal_admin_notes: 'notes',
                max_weekly_hours: 'maxHours'
            },
            builtinTypes: [
                { id: 'professor', label: 'Professor', slug: 'professor', isBuiltin: true, platformRole: 'professor', order: 0 },
                { id: 'ta', label: 'Teaching Assistant', slug: 'ta', isBuiltin: true, platformRole: 'ta', order: 1 }
            ],
            mobilityCategories: null,
        }
        : {
            blueprintKey: 'studentFormBlueprint',
            multiType: false,
            typesKey: null,
            singleTypeId: 'student',
            slugFallback: 'student_field',
            entityLabel: 'Student',
            typeNoun: 'student type',
            idPrefix: 'student_',
            customLabel: 'Custom student',
            legacyAliases: {
                full_name: 'name',
                institutional_email: 'email',
                english_name: 'nameEn',
                student_id: 'studentId',
                phone: 'phone',
                photo_url: 'photo',
                student_status: 'status',
                program: 'program',
                cohort: 'cohort',
                semester: 'semester',
                department: 'department',
                faculty_school: 'faculty',
                campus: 'campus',
                biography: 'bio',
                lms_account_status: 'accountStatus',
                last_login: 'lastLogin',
                internal_admin_notes: 'notes',
                mobility_category: 'mobilityCategory'
            },
            builtinTypes: [
                { id: 'student', label: 'Student', slug: 'student', isBuiltin: true, order: 0 }
            ],
            mobilityCategories: [
                { value: 'standard', label: 'Standard enrollment' },
                { value: 'exchange_incoming', label: 'Exchange incoming' },
                { value: 'exchange_outgoing', label: 'Exchange outgoing' },
                { value: 'internal_transfer', label: 'Internal transfer' }
            ],
        };

    const BLUEPRINT_KEY = H.blueprintKey;
    const BUILTIN_TYPES = H.builtinTypes;
    const LEGACY_FIELD_ALIASES = H.legacyAliases;
    const STUDENT_TYPE_ID = H.singleTypeId || 'student';
    const MOBILITY_CATEGORIES = H.mobilityCategories || [];

    function escapeHtml(value) {
        const shared = typeof window !== 'undefined' ? window.escapeHtml : null;
        if (typeof shared === 'function' && shared !== escapeHtml) return shared(value);
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }


    function todayIso() {
        return new Date().toISOString().slice(0, 10);
    }

    function makeId(prefix) {
        return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    }

    function sanitizeFieldLabel(value, fallback = 'New field') {
        let text = String(value ?? '').trim();
        if (!text) return fallback;
        if (!/[<>]/.test(text)) {
            text = text.slice(0, 160);
        } else {
            text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
        }
        if (!text) return fallback;
        if (text.length > 120) return fallback;
        const lower = text.toLowerCase();
        const markers = [
            'admin workspace', 'staff form settings', 'staff directory', 'form blueprint',
            'design registration forms', 'staff types', 'copy blueprint', 'staff-hub-', 'data-staff-'
        ];
        let hits = 0;
        markers.forEach((marker) => { if (lower.includes(marker)) hits += 1; });
        if (hits >= 2 || (hits >= 1 && text.length > 48)) return fallback;
        return text;
    }

    function sanitizeBlueprintText(value, fallback = '') {
        return sanitizeFieldLabel(value, fallback);
    }

    function slugify(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 48) || H.slugFallback;
    }

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function emptySchema() {
        return { sections: [] };
    }

    function sortedSections(sections = []) {
        return sections.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    function sectionHasFilterableSelect(section) {
        return (section?.fields || []).some((field) => field.type === 'select' && field.showInDirectoryFilter !== false);
    }

    function normalizeField(field, index = 0) {
        const type = INPUT_FIELD_TYPES.includes(field?.type)
            ? field.type
            : (field?.type === 'select' || Array.isArray(field?.options) ? 'select' : 'text');
        const base = {
            id: field?.id || makeId('fld'),
            key: slugify(field?.key || field?.label || `field_${index + 1}`),
            label: sanitizeFieldLabel(field?.label, 'Untitled field'),
            required: Boolean(field?.required),
            help: String(field?.help || '').trim(),
            order: Number.isFinite(field?.order) ? field.order : index
        };
        if (type === 'select' || Array.isArray(field?.options)) {
            return {
                ...base,
                type: 'select',
                showInDirectoryFilter: field?.showInDirectoryFilter !== false,
                options: (field?.options || []).map((option, optionIndex) => ({
                    value: String(option?.value ?? option?.label ?? `option_${optionIndex + 1}`).trim(),
                    label: String(option?.label ?? option?.value ?? `Option ${optionIndex + 1}`).trim()
                })).filter((option) => option.value && option.label)
            };
        }
        return {
            ...base,
            type,
            placeholder: String(field?.placeholder || '').trim(),
            width: field?.width === 'full' ? 'full' : 'half'
        };
    }

    function resolveSectionTitle(section) {
        if (section && Object.prototype.hasOwnProperty.call(section, 'title')) {
            return sanitizeBlueprintText(section.title, '');
        }
        return sanitizeBlueprintText(section?.title, 'Untitled section') || 'Untitled section';
    }

    function normalizeSection(section, index = 0, options = {}) {
        const fields = Array.isArray(section?.fields)
            ? section.fields.map((field, fieldIndex) => normalizeField(field, fieldIndex))
            : [];
        const defaultFilterGroup = options.fromDroplistBucket === true || sectionHasFilterableSelect({ fields });
        return {
            id: section?.id || makeId('sec'),
            title: resolveSectionTitle(section),
            description: String(section?.description || '').trim(),
            order: Number.isFinite(section?.order) ? section.order : index,
            filterGroup: section?.filterGroup != null ? Boolean(section.filterGroup) : defaultFilterGroup,
            fields
        };
    }

    function migrateSchemaToV2(schema) {
        if (!schema || typeof schema !== 'object') return emptySchema();
        if (Array.isArray(schema.sections)) {
            return {
                sections: sortedSections(schema.sections).map((section, index) => normalizeSection(section, index))
            };
        }
        const inputSections = sortedSections(schema.inputSections || []);
        const droplistSections = sortedSections(schema.droplistSections || []);
        const merged = [];
        inputSections.forEach((section) => {
            merged.push(normalizeSection(section, merged.length, { fromDroplistBucket: false }));
        });
        droplistSections.forEach((section) => {
            merged.push(normalizeSection(section, merged.length, { fromDroplistBucket: true }));
        });
        merged.forEach((section, index) => { section.order = index; });
        return { sections: merged };
    }

    function migrateFormBlueprintV1ToV2(blueprint) {
        if (!blueprint || typeof blueprint !== 'object') return;
        if ((blueprint.version || 1) >= BLUEPRINT_VERSION) {
            Object.keys(blueprint.schemas || {}).forEach((typeId) => {
                blueprint.schemas[typeId] = migrateSchemaToV2(blueprint.schemas[typeId]);
            });
            blueprint.version = BLUEPRINT_VERSION;
            return;
        }
        if (!blueprint.schemas || typeof blueprint.schemas !== 'object') blueprint.schemas = {};
        Object.keys(blueprint.schemas).forEach((typeId) => {
            blueprint.schemas[typeId] = migrateSchemaToV2(blueprint.schemas[typeId]);
        });
        blueprint.version = BLUEPRINT_VERSION;
    }

    function defaultStudentSchema() {
        return {
            sections: [
                normalizeSection({
                    id: 'sec_identity',
                    title: 'Identity',
                    order: 0,
                    fields: [
                        { key: 'full_name', label: 'Full name', type: 'text', required: true, order: 0 },
                        { key: 'student_id', label: 'Student ID', type: 'text', required: true, order: 1 },
                        { key: 'institutional_email', label: 'Institutional email', type: 'email', required: true, order: 2 },
                        { key: 'phone', label: 'Phone', type: 'tel', order: 3 }
                    ]
                }, 0),
                normalizeSection({
                    id: 'sec_academic',
                    title: 'Academic',
                    order: 1,
                    filterGroup: true,
                    fields: [
                        { key: 'program', label: 'Program', type: 'text', required: true, order: 0 },
                        { key: 'cohort', label: 'Cohort', type: 'text', order: 1 },
                        { key: 'semester', label: 'Semester', type: 'text', order: 2 },
                        { key: 'student_status', label: 'Status', type: 'select', order: 3, options: [
                            { value: 'active', label: 'Active' },
                            { value: 'probation', label: 'Probation' },
                            { value: 'suspended', label: 'Suspended' },
                            { value: 'archived', label: 'Archived' }
                        ]}
                    ]
                }, 1)
            ]
        };
    }

    function ensureFormBlueprint() {
        if (!window.KIU_STATE) window.KIU_STATE = {};
        if (H.multiType) {
            if (!KIU_STATE[BLUEPRINT_KEY] || typeof KIU_STATE[BLUEPRINT_KEY] !== 'object') {
                KIU_STATE[BLUEPRINT_KEY] = {
                    version: BLUEPRINT_VERSION,
                    updatedAt: todayIso(),
                    staffTypes: cloneJson(BUILTIN_TYPES),
                    schemas: {
                        professor: emptySchema(),
                        ta: emptySchema()
                    }
                };
            }
            const blueprint = KIU_STATE[BLUEPRINT_KEY];
            if (!Array.isArray(blueprint.staffTypes)) blueprint.staffTypes = cloneJson(BUILTIN_TYPES);
            if (!blueprint.schemas || typeof blueprint.schemas !== 'object') {
                blueprint.schemas = { professor: emptySchema(), ta: emptySchema() };
            }
            BUILTIN_TYPES.forEach((type) => {
                if (!blueprint.staffTypes.some((item) => item.id === type.id)) {
                    blueprint.staffTypes.push(cloneJson(type));
                }
                if (!blueprint.schemas[type.id]) blueprint.schemas[type.id] = emptySchema();
            });
            migrateFormBlueprintV1ToV2(blueprint);
            blueprint.staffTypes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            return blueprint;
        }

        if (!KIU_STATE[BLUEPRINT_KEY] || typeof KIU_STATE[BLUEPRINT_KEY] !== 'object') {
            KIU_STATE[BLUEPRINT_KEY] = {
                version: BLUEPRINT_VERSION,
                updatedAt: todayIso(),
                schema: defaultStudentSchema()
            };
        }
        const blueprint = KIU_STATE[BLUEPRINT_KEY];
        if (blueprint.schemas?.student) {
            blueprint.schema = migrateSchemaToV2(blueprint.schemas.student);
            delete blueprint.schemas;
            delete blueprint.staffTypes;
        }
        if (!blueprint.schema) blueprint.schema = defaultStudentSchema();
        blueprint.schema = migrateSchemaToV2(blueprint.schema);
        blueprint.version = BLUEPRINT_VERSION;
        return blueprint;
    }

    function getFormBlueprint() {
        return ensureFormBlueprint();
    }

    function getFormTypes() {
        if (!H.multiType) {
            return [{ id: STUDENT_TYPE_ID, label: 'Student', slug: 'student', isBuiltin: true, order: 0 }];
        }
        return ensureFormBlueprint().staffTypes.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    function getFormType(typeId) {
        if (!H.multiType) {
            void typeId;
            return getFormTypes()[0];
        }
        return getFormTypes().find((type) => type.id === typeId) || null;
    }

    function getFormSchema(typeId) {
        const blueprint = ensureFormBlueprint();
        if (!H.multiType) {
            void typeId;
            return cloneJson(blueprint.schema || defaultStudentSchema());
        }
        return blueprint.schemas[typeId] ? cloneJson(blueprint.schemas[typeId]) : emptySchema();
    }

    function getFormSections(typeId) {
        return sortedSections(getFormSchema(typeId).sections || []);
    }

    function saveFormBlueprint() {
        const blueprint = ensureFormBlueprint();
        blueprint.updatedAt = todayIso();
        if (typeof saveState === 'function') saveState();
        return blueprint;
    }

    function ensureSchema(typeId) {
        const blueprint = ensureFormBlueprint();
        if (!H.multiType) {
            void typeId;
            if (!blueprint.schema) blueprint.schema = defaultStudentSchema();
            blueprint.schema = migrateSchemaToV2(blueprint.schema);
            return blueprint.schema;
        }
        if (!blueprint.schemas[typeId]) blueprint.schemas[typeId] = emptySchema();
        blueprint.schemas[typeId] = migrateSchemaToV2(blueprint.schemas[typeId]);
        return blueprint.schemas[typeId];
    }

    function findSection(schema, sectionId) {
        return sortedSections(schema.sections || []).find((item) => item.id === sectionId) || null;
    }

    function ensureUniqueFieldKey(schema, baseKey, excludeFieldId = null) {
        const keys = new Set();
        sortedSections(schema.sections || []).forEach((section) => {
            (section.fields || []).forEach((item) => {
                if (item.id !== excludeFieldId) keys.add(item.key);
            });
        });
        let key = slugify(baseKey);
        if (!keys.has(key)) return key;
        let suffix = 2;
        while (keys.has(`${key}_${suffix}`)) suffix += 1;
        return `${key}_${suffix}`;
    }

    function resolveBucketShim(bucket) {
        return bucket === 'droplist' ? 'droplist' : (bucket === 'input' ? 'input' : null);
    }

    function addFormSection(typeId, bucketOrSection, section = {}) {
        const schema = ensureSchema(typeId);
        let patch = section;
        let bucketHint = null;
        if (bucketOrSection === 'input' || bucketOrSection === 'droplist') {
            bucketHint = bucketOrSection;
        } else if (bucketOrSection && typeof bucketOrSection === 'object') {
            patch = bucketOrSection;
        }
        const next = normalizeSection({
            ...patch,
            id: makeId('sec'),
            order: schema.sections.length,
            filterGroup: patch.filterGroup != null
                ? Boolean(patch.filterGroup)
                : bucketHint === 'droplist'
        }, schema.sections.length, { fromDroplistBucket: bucketHint === 'droplist' });
        schema.sections.push(next);
        saveFormBlueprint();
        return next;
    }

    function updateFormSection(typeId, bucket, sectionId, patch = {}) {
        void bucket;
        const schema = ensureSchema(typeId);
        const section = findSection(schema, sectionId);
        if (!section) return { error: 'Section not found.' };
        if (patch.title != null) section.title = sanitizeBlueprintText(patch.title, section.title || '');
        if (patch.description != null) section.description = sanitizeBlueprintText(patch.description, '');
        if (patch.filterGroup != null) {
            section.filterGroup = Boolean(patch.filterGroup);
            if (section.filterGroup) {
                (section.fields || []).forEach((field) => {
                    if (field.type === 'select') field.showInDirectoryFilter = true;
                });
            }
        }
        saveFormBlueprint();
        return section;
    }

    function removeFormSection(typeId, bucket, sectionId) {
        void bucket;
        const schema = ensureSchema(typeId);
        schema.sections = sortedSections(schema.sections).filter((item) => item.id !== sectionId);
        schema.sections.forEach((item, index) => { item.order = index; });
        saveFormBlueprint();
        return { ok: true };
    }

    function moveFormSection(typeId, bucket, sectionId, direction) {
        void bucket;
        const schema = ensureSchema(typeId);
        const sections = sortedSections(schema.sections);
        const index = sections.findIndex((item) => item.id === sectionId);
        if (index < 0) return { error: 'Section not found.' };
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= sections.length) return { ok: true };
        const currentOrder = sections[index].order;
        sections[index].order = sections[swapIndex].order;
        sections[swapIndex].order = currentOrder;
        schema.sections = sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        saveFormBlueprint();
        return { ok: true };
    }

    function reorderFormSection(typeId, sectionId, toIndex) {
        const schema = ensureSchema(typeId);
        const sections = sortedSections(schema.sections);
        const fromIndex = sections.findIndex((item) => item.id === sectionId);
        if (fromIndex < 0) return { error: 'Section not found.' };
        const normalizedToIndex = Math.max(0, Math.min(Number(toIndex) || 0, sections.length - 1));
        if (fromIndex === normalizedToIndex) return { ok: true };
        const [moved] = sections.splice(fromIndex, 1);
        sections.splice(normalizedToIndex, 0, moved);
        sections.forEach((item, index) => { item.order = index; });
        schema.sections = sections;
        saveFormBlueprint();
        return { ok: true };
    }

    function addFormField(typeId, bucket, sectionId, field = {}) {
        void bucket;
        const schema = ensureSchema(typeId);
        const section = findSection(schema, sectionId);
        if (!section) return { error: 'Section not found.' };
        const requestedType = field.type || (resolveBucketShim(bucket) === 'droplist' ? 'select' : 'text');
        const next = normalizeField({
            ...field,
            id: makeId('fld'),
            type: requestedType,
            order: section.fields.length
        }, section.fields.length);
        next.key = ensureUniqueFieldKey(schema, field.key || field.label || next.key);
        section.fields.push(next);
        if (next.type === 'select' && section.filterGroup && field.showInDirectoryFilter == null) {
            next.showInDirectoryFilter = true;
        }
        saveFormBlueprint();
        return next;
    }

    function updateFormField(typeId, bucket, sectionId, fieldId, patch = {}) {
        void bucket;
        const schema = ensureSchema(typeId);
        const section = findSection(schema, sectionId);
        if (!section) return { error: 'Section not found.' };
        const field = section.fields.find((item) => item.id === fieldId);
        if (!field) return { error: 'Field not found.' };
        if (patch.label != null) field.label = sanitizeFieldLabel(patch.label, field.label || 'New field');
        if (patch.key != null) {
            const nextKey = slugify(patch.key);
            const duplicate = sortedSections(schema.sections).some((item) =>
                (item.fields || []).some((candidate) => candidate.id !== fieldId && candidate.key === nextKey)
            );
            if (duplicate) return { error: 'Field key must be unique within this staff type.' };
            field.key = nextKey;
        }
        if (patch.required != null) field.required = Boolean(patch.required);
        if (patch.placeholder != null) field.placeholder = String(patch.placeholder).trim();
        if (patch.help != null) field.help = String(patch.help).trim();
        if (patch.width != null) field.width = patch.width === 'full' ? 'full' : 'half';
        if (patch.type != null) {
            const nextType = patch.type === 'select' || INPUT_FIELD_TYPES.includes(patch.type) ? patch.type : field.type;
            if (nextType === 'select') {
                field.type = 'select';
                if (!Array.isArray(field.options) || !field.options.length) {
                    field.options = [{ value: 'option_1', label: 'Option 1' }];
                }
                field.showInDirectoryFilter = patch.showInDirectoryFilter != null
                    ? Boolean(patch.showInDirectoryFilter)
                    : (field.showInDirectoryFilter !== false);
                delete field.placeholder;
                delete field.width;
            } else if (INPUT_FIELD_TYPES.includes(nextType)) {
                field.type = nextType;
                field.placeholder = field.placeholder || '';
                field.width = field.width === 'full' ? 'full' : 'half';
                delete field.options;
                delete field.showInDirectoryFilter;
            }
        }
        if (patch.showInDirectoryFilter != null && field.type === 'select') {
            field.showInDirectoryFilter = Boolean(patch.showInDirectoryFilter);
        }
        if (patch.options != null && field.type === 'select') {
            field.options = (patch.options || []).map((option, index) => ({
                value: String(option?.value ?? option?.label ?? `option_${index + 1}`).trim(),
                label: String(option?.label ?? option?.value ?? `Option ${index + 1}`).trim()
            })).filter((option) => option.value && option.label);
        }
        saveFormBlueprint();
        return field;
    }

    function removeFormField(typeId, bucket, sectionId, fieldId) {
        void bucket;
        const schema = ensureSchema(typeId);
        const section = findSection(schema, sectionId);
        if (!section) return { error: 'Section not found.' };
        section.fields = section.fields.filter((item) => item.id !== fieldId);
        section.fields.forEach((item, index) => { item.order = index; });
        saveFormBlueprint();
        return { ok: true };
    }

    function moveFormField(typeId, bucket, sectionId, fieldId, direction) {
        void bucket;
        const schema = ensureSchema(typeId);
        const section = findSection(schema, sectionId);
        if (!section) return { error: 'Section not found.' };
        const fields = section.fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const index = fields.findIndex((item) => item.id === fieldId);
        if (index < 0) return { error: 'Field not found.' };
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= fields.length) return { ok: true };
        const currentOrder = fields[index].order;
        fields[index].order = fields[swapIndex].order;
        fields[swapIndex].order = currentOrder;
        section.fields = fields.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        saveFormBlueprint();
        return { ok: true };
    }

    function reorderFormField(typeId, sectionId, fieldId, toIndex) {
        const schema = ensureSchema(typeId);
        const section = findSection(schema, sectionId);
        if (!section) return { error: 'Section not found.' };
        const fields = section.fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const fromIndex = fields.findIndex((item) => item.id === fieldId);
        if (fromIndex < 0) return { error: 'Field not found.' };
        const normalizedToIndex = Math.max(0, Math.min(Number(toIndex) || 0, fields.length - 1));
        if (fromIndex === normalizedToIndex) return { ok: true };
        const [moved] = fields.splice(fromIndex, 1);
        fields.splice(normalizedToIndex, 0, moved);
        fields.forEach((item, index) => { item.order = index; });
        section.fields = fields;
        saveFormBlueprint();
        return { ok: true };
    }

    function copyFormBlueprint(fromTypeId, toTypeId, options = {}) {
        if (!H.multiType) return { error: 'Copy between types is not available for the unified ' + H.entityLabel.lower() + ' form.' };
        const blueprint = ensureFormBlueprint();
        const fromSchema = blueprint.schemas[fromTypeId];
        const toSchema = ensureSchema(toTypeId);
        if (!fromSchema) return { error: 'Source ' + H.typeNoun + ' not found.' };
        if (!blueprint.staffTypes.some((type) => type.id === toTypeId)) return { error: 'Target ' + H.typeNoun + ' not found.' };
        if (fromTypeId === toTypeId) return { error: 'Choose different source and target ' + H.typeNoun + 's.' };
        const copySections = options.sections !== false
            && (options.inputs !== false || options.droplists !== false || options.sections === true);
        if (copySections) {
            toSchema.sections = cloneJson(sortedSections(fromSchema.sections || []));
        }
        saveFormBlueprint();
        return { ok: true };
    }

    function getAllFormFields(typeId) {
        const schema = getFormSchema(typeId);
        const fields = [];
        sortedSections(schema.sections || []).forEach((section) => {
            section.fields.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).forEach((field) => {
                fields.push({
                    ...field,
                    sectionId: section.id,
                    sectionTitle: section.title,
                    filterGroup: section.filterGroup,
                    bucket: field.type === 'select' ? 'droplist' : 'input'
                });
            });
        });
        return fields;
    }

    function formSchemaIsEmpty(typeId) {
        const schema = getFormSchema(typeId);
        return !sortedSections(schema.sections || []).some((section) => (section.fields || []).length > 0);
    }

    function addFormType(label, slug = '') {
        if (!H.multiType) return { error: H.entityLabel + ' form uses a single unified schema.' };
        const blueprint = ensureFormBlueprint();
        const nextSlug = slugify(slug || label);
        const existing = blueprint.staffTypes.find((type) => type.slug === nextSlug || type.id === nextSlug);
        if (existing) return { error: 'A ' + H.typeNoun + ' with this slug already exists.' };
        const id = `${H.idPrefix}${nextSlug}`;
        if (blueprint.staffTypes.some((type) => type.id === id)) return { error: H.entityLabel + ' type id collision. Choose another label.' };
        const type = {
            id,
            label: String(label || H.customLabel).trim() || H.customLabel,
            slug: nextSlug,
            isBuiltin: false,
            platformRole: nextSlug,
            order: blueprint.staffTypes.length
        };
        blueprint.staffTypes.push(type);
        blueprint.schemas[id] = emptySchema();
        saveFormBlueprint();
        return { type };
    }

    function updateFormType(typeId, patch = {}) {
        if (!H.multiType) return { error: H.entityLabel + ' form uses a single unified schema.' };
        const blueprint = ensureFormBlueprint();
        const type = blueprint.staffTypes.find((item) => item.id === typeId);
        if (!type) return { error: H.entityLabel + ' type not found.' };
        if (!type.isBuiltin && patch.label) type.label = String(patch.label).trim() || type.label;
        if (!type.isBuiltin && patch.slug) {
            const nextSlug = slugify(patch.slug);
            if (blueprint.staffTypes.some((item) => item.id !== typeId && item.slug === nextSlug)) {
                return { error: 'Another ' + H.typeNoun + ' already uses this slug.' };
            }
            type.slug = nextSlug;
            type.platformRole = nextSlug;
        }
        saveFormBlueprint();
        return { type };
    }

    function removeFormType(typeId) {
        if (!H.multiType) return { error: H.entityLabel + ' form uses a single unified schema.' };
        const blueprint = ensureFormBlueprint();
        const type = blueprint.staffTypes.find((item) => item.id === typeId);
        if (!type) return { error: H.entityLabel + ' type not found.' };
        if (type.isBuiltin) return { error: 'Built-in ' + H.typeNoun + 's cannot be removed.' };
        blueprint.staffTypes = blueprint.staffTypes.filter((item) => item.id !== typeId);
        delete blueprint.schemas[typeId];
        saveFormBlueprint();
        return { ok: true };
    }

    function resolveTypeIdFromPlatformRole(platformRole) {
        if (!H.multiType) return STUDENT_TYPE_ID;
        const types = getFormTypes();
        const match = types.find((type) => type.platformRole === platformRole || type.id === platformRole || type.slug === platformRole);
        return match?.id || platformRole || 'professor';
    }

    function resolveStudentTypeId() {
        return STUDENT_TYPE_ID;
    }

    function getLegacyFieldAlias(key) {
        return LEGACY_FIELD_ALIASES[key] || null;
    }

    const api = NS === 'staff'
        ? {
            ensureStaffFormBlueprint: ensureFormBlueprint,
            getStaffFormBlueprint: getFormBlueprint,
            getStaffFormTypes: getFormTypes,
            getStaffFormType: getFormType,
            getStaffFormSchema: getFormSchema,
            getStaffFormSections: getFormSections,
            addStaffFormType: addFormType,
            updateStaffFormType: updateFormType,
            removeStaffFormType: removeFormType,
            addStaffFormSection: addFormSection,
            updateStaffFormSection: updateFormSection,
            removeStaffFormSection: removeFormSection,
            moveStaffFormSection: moveFormSection,
            reorderStaffFormSection: reorderFormSection,
            addStaffFormField: addFormField,
            updateStaffFormField: updateFormField,
            removeStaffFormField: removeFormField,
            moveStaffFormField: moveFormField,
            reorderStaffFormField: reorderFormField,
            copyStaffFormBlueprint: copyFormBlueprint,
            getAllStaffFormFields: getAllFormFields,
            staffFormSchemaIsEmpty: formSchemaIsEmpty,
            resolveStaffTypeIdFromPlatformRole: resolveTypeIdFromPlatformRole,
            getLegacyFieldAlias: getLegacyFieldAlias,
            STAFF_FORM_INPUT_TYPES: INPUT_FIELD_TYPES,
            staffFormEscapeHtml: escapeHtml,
            saveStaffFormBlueprint: saveFormBlueprint
        }
        : {
            ensureStudentFormBlueprint: ensureFormBlueprint,
            getStudentFormBlueprint: getFormBlueprint,
            getStudentFormTypes: getFormTypes,
            getStudentFormType: getFormType,
            getStudentFormSchema: getFormSchema,
            getStudentFormSections: getFormSections,
            addStudentFormType: addFormType,
            updateStudentFormType: updateFormType,
            removeStudentFormType: removeFormType,
            addStudentFormSection: addFormSection,
            updateStudentFormSection: updateFormSection,
            removeStudentFormSection: removeFormSection,
            moveStudentFormSection: moveFormSection,
            reorderStudentFormSection: reorderFormSection,
            addStudentFormField: addFormField,
            updateStudentFormField: updateFormField,
            removeStudentFormField: removeFormField,
            moveStudentFormField: moveFormField,
            reorderStudentFormField: reorderFormField,
            copyStudentFormBlueprint: copyFormBlueprint,
            getAllStudentFormFields: getAllFormFields,
            studentFormSchemaIsEmpty: formSchemaIsEmpty,
            resolveStudentTypeId: resolveStudentTypeId,
            getLegacyFieldAlias: getLegacyFieldAlias,
            STUDENT_FORM_INPUT_TYPES: INPUT_FIELD_TYPES,
            studentFormEscapeHtml: escapeHtml,
            STUDENT_TYPE_ID: STUDENT_TYPE_ID,
            MOBILITY_CATEGORIES: MOBILITY_CATEGORIES,
            saveStudentFormBlueprint: saveFormBlueprint
        };
    window.KiuFormBlueprint = Object.assign(window.KiuFormBlueprint || {}, api);
    Object.assign(window, api);
})();
