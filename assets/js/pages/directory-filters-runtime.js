(function initDirectoryFiltersRuntime() {
    'use strict';

    const NS = window.__KIU_DIRECTORY_FILTERS_NS__ || window.__KIU_FORM_BUILDER_NS__;
    if (NS !== 'staff' && NS !== 'student') {
        console.error('[directory-filters-runtime] Set window.__KIU_DIRECTORY_FILTERS_NS__ to "staff" or "student".');
        return;
    }

    const H = NS === 'staff'
        ? {
            hub: 'staff-hub',
            data: 'staff',
            entity: 'staff',
            entityTitle: 'Staff',
            typeIdKey: 'staffTypeId',
            statusKey: 'staff_status',
            idKey: 'staffId',
            searchPlaceholder: 'Name, email, staff ID, department...',
            sectionCopy: 'Search the roster and apply directory field filters configured in form settings.',
            sectionTitle: 'Directory',
            getTypes: 'getStaffFormTypes',
            getAllFields: 'getAllStaffFormFields',
            getSections: 'getStaffFormSections',
            helperProfile: 'profileCompleteness',
            helperTeaching: 'isTeachingRole',
            helperRoleLabel: 'getPlatformRoleLabel',
            systemFilters: {
                query: 'query',
                droplistQuery: 'droplistQuery',
                platform: 'platform',
                profile: 'profile',
                teaching: 'teaching',
                archive: 'archive',
                sort: 'sort'
            },
            defaultFilters: {
                query: '',
                droplistQuery: '',
                platform: 'all',
                field: {},
                profile: 'all',
                teaching: 'all',
                archive: 'active',
                sort: 'name'
            },
            fieldFilterPrefix: 'staff-directory-field',
            searchInputId: 'staff-search',
            droplistSearchId: 'staff-droplist-search',
        }
        : {
            hub: 'students-hub',
            data: 'student',
            entity: 'student',
            entityTitle: 'Student',
            typeIdKey: 'staffTypeId', // student model still uses staffTypeIds key in blueprint merge
            statusKey: 'staff_status',
            idKey: 'studentId',
            searchPlaceholder: 'Name, email, student ID, program...',
            sectionCopy: 'Search the roster and apply directory field filters configured in form settings.',
            sectionTitle: 'Directory',
            getTypes: 'getStudentFormTypes',
            getAllFields: 'getAllStudentFormFields',
            getSections: 'getStudentFormSections',
            helperProfile: 'studentProfileCompleteness',
            helperTeaching: 'isStudentEnrollmentActive',
            helperRoleLabel: 'getStudentRoleLabel',
            systemFilters: {
                query: 'query',
                droplistQuery: 'droplistQuery',
                mobility: 'mobility',
                program: 'program',
                profile: 'profile',
                archive: 'archive',
                sort: 'sort'
            },
            defaultFilters: {
                query: '',
                droplistQuery: '',
                mobility: 'all',
                program: 'all',
                field: {},
                profile: 'all',
                archive: 'active',
                sort: 'name'
            },
            fieldFilterPrefix: 'student-directory-field',
            searchInputId: 'student-search',
            droplistSearchId: 'student-droplist-search',
        };

    const DIRECTORY_SYSTEM_FILTERS = H.systemFilters;
    const DIRECTORY_DEFAULT_FILTERS = { ...H.defaultFilters, field: { ...(H.defaultFilters.field || {}) } };

    const DIRECTORY_FIELD_TYPES = new Set(['text', 'email', 'tel', 'number', 'select', 'date', 'url']);

    const LEGACY_FIELD_FILTER_KEYS = {
        role: 'display_role',
        department: 'department',
        status: 'staff_status',
        account: 'lms_account_status'
    };

    function escapeHtml(value) {
        const shared = typeof window !== 'undefined' ? window.escapeHtml : null;
        if (typeof shared === 'function' && shared !== escapeHtml) return shared(value);
        return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }


    function fallbackNormalizeSearch(value, fallback = '') {
        return String(value ?? fallback).trim().toLowerCase();
    }

    function fallbackIsTeachingRole(record) {
        if (NS === 'student') {
            void record;
            return false;
        }
        if (!record) return false;
        return record.platformRole === 'professor'
            || record.platformRole === 'ta'
            || ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Teaching Assistant', 'Department Chair', 'Dean'].includes(record.role)
            || (record.courses || []).length > 0;
    }

    function fallbackMobilityCategory(record) {
        return String(record?.mobility?.category || record?.mobilityCategory || 'standard').trim() || 'standard';
    }

    function fallbackProfileCompleteness(record) {
        const checks = [
            { ok: Boolean(record?.photo), weight: 10 },
            { ok: Boolean(record?.email), weight: 15 },
            { ok: Boolean(record?.phone), weight: 10 },
            { ok: Boolean(record?.department), weight: 10 },
            { ok: Boolean(record?.bio), weight: 10 },
            { ok: !fallbackIsTeachingRole(record) || (record?.courses || []).length > 0, weight: 10 },
            { ok: Boolean((record?.officeHours || []).length), weight: 10 }
        ];
        const percent = checks.reduce((sum, item) => sum + (item.ok ? item.weight : 0), 0);
        return { percent, missing: [], checks };
    }

    function resolveHelpers(helpers = {}) {
        const profileFn = helpers[H.helperProfile];
        const teachingFn = helpers[H.helperTeaching];
        const roleFn = helpers[H.helperRoleLabel];
        return {
            normalizeSearch: typeof helpers.normalizeSearch === 'function' ? helpers.normalizeSearch : fallbackNormalizeSearch,
            profileCompleteness: typeof profileFn === 'function' ? profileFn : fallbackProfileCompleteness,
            isTeachingRole: typeof teachingFn === 'function' ? teachingFn : fallbackIsTeachingRole,
            getPlatformRoleLabel: typeof roleFn === 'function' ? roleFn : ((platformRole) => String(platformRole || H.entityTitle))
        };
    }

    function getFormTypesSafe() {
        return typeof window[H.getTypes] === 'function' ? window[H.getTypes]() : [];
    }

    function getAllFormFieldsSafe(typeId) {
        return typeof window[H.getAllFields] === 'function' ? window[H.getAllFields](typeId) : [];
    }

    function getLegacyFieldAliasSafe(key) {
        return typeof getLegacyFieldAlias === 'function' ? getLegacyFieldAlias(key) : null;
    }

    function modelFilterKeys(model) {
        const keys = new Set();
        (model?.blueprintFilters || []).forEach((item) => {
            keys.add(item.key);
            (item.aliasKeys || []).forEach((aliasKey) => keys.add(aliasKey));
        });
        return keys;
    }

    function modelHasFilterKey(model, key) {
        return Boolean(resolveBlueprintFilterDef(model, key));
    }

    function normalizeFieldValue(value) {
        if (Array.isArray(value)) return value.map((item) => String(item ?? '').trim()).filter(Boolean).join(', ');
        return value == null ? '' : String(value);
    }

    function getRecordFieldValue(record, key) {
        if (!record || !key) return '';
        const values = record.fieldValues && typeof record.fieldValues === 'object' ? record.fieldValues : {};
        if (Object.prototype.hasOwnProperty.call(values, key)) {
            return normalizeFieldValue(values[key]);
        }
        const alias = getLegacyFieldAliasSafe(key);
        if (alias && Object.prototype.hasOwnProperty.call(record, alias)) {
            return normalizeFieldValue(record[alias]);
        }
        return '';
    }

    function normalizeFilterLabel(label) {
        return String(label ?? '').trim().toLowerCase();
    }

    function isDirectoryFieldCandidate(field) {
        if (!field) return false;
        return DIRECTORY_FIELD_TYPES.has(field.type);
    }

    function rememberBlueprintOptions(blueprintOptionLookup, key, options = []) {
        if (!key || !options.length) return;
        const lookup = blueprintOptionLookup.get(key) || [];
        options.forEach((option) => {
            if (!lookup.some((item) => String(item.value) === String(option.value))) {
                lookup.push({ value: option.value, label: option.label });
            }
        });
        blueprintOptionLookup.set(key, lookup);
    }

    function resolveBlueprintFilterDef(model, key) {
        if (!key) return null;
        return (model?.blueprintFilters || []).find((item) => {
            if (item.key === key) return true;
            return (item.aliasKeys || []).includes(key);
        }) || null;
    }

    function getFilterDefKeys(filterDef) {
        if (!filterDef) return [];
        return [...new Set([filterDef.key, ...(filterDef.aliasKeys || [])].filter(Boolean))];
    }

    function resolveOptionLabelFromBlueprint(value, blueprintOptions = []) {
        const match = blueprintOptions.find((option) => String(option.value) === String(value));
        return match?.label || value;
    }

    function collapseFiltersByLabel(filters = []) {
        const byLabel = new Map();
        filters.forEach((filter) => {
            const labelKey = normalizeFilterLabel(filter.label);
            if (!labelKey) return;
            const existing = byLabel.get(labelKey);
            if (!existing) {
                byLabel.set(labelKey, {
                    ...filter,
                    aliasKeys: [...new Set([...(filter.aliasKeys || []), filter.key].filter(Boolean))]
                });
                return;
            }

            existing.order = Math.min(existing.order ?? 999, filter.order ?? 999);
            filter.staffTypeIds.forEach((typeId) => {
                if (!existing.staffTypeIds.includes(typeId)) existing.staffTypeIds.push(typeId);
            });
            [...new Set([filter.key, ...(filter.aliasKeys || [])].filter(Boolean))].forEach((aliasKey) => {
                if (!existing.aliasKeys.includes(aliasKey)) existing.aliasKeys.push(aliasKey);
            });

            const optionMap = new Map((existing.options || []).map((option) => [option.value, option.label]));
            (filter.options || []).forEach((option) => addOption(optionMap, option.value, option.label));
            existing.options = Array.from(optionMap.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
            existing.dynamic = Boolean(existing.dynamic || filter.dynamic);
            if (filter.source === 'records' || existing.source === 'records') {
                existing.source = 'records';
            }
        });

        return Array.from(byLabel.values())
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label))
            .map((filter) => ({
                ...filter,
                aliasKeys: [...new Set((filter.aliasKeys || []).filter((key) => key && key !== filter.key))]
            }));
    }

    function enrichFilterOptionsFromRecords(filterDefs, records = [], blueprintOptionLookup = new Map()) {
        filterDefs.forEach((filterDef) => {
            const optionMap = new Map((filterDef.options || []).map((option) => [option.value, option.label]));
            const keys = getFilterDefKeys(filterDef);
            const blueprintOptions = blueprintOptionLookup.get(filterDef.key) || [];

            records.forEach((record) => {
                keys.forEach((key) => {
                    const value = getRecordFieldValue(record, key);
                    if (!value) return;
                    value.split(',').map((item) => item.trim()).filter(Boolean).forEach((item) => {
                        const label = blueprintOptions.length
                            ? resolveOptionLabelFromBlueprint(item, blueprintOptions)
                            : item;
                        addOption(optionMap, item, label);
                    });
                });
            });

            filterDef.options = Array.from(optionMap.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        });
    }

    function addOption(optionMap, value, label) {
        const nextValue = String(value ?? '').trim();
        if (!nextValue) return;
        if (!optionMap.has(nextValue)) {
            optionMap.set(nextValue, String(label ?? nextValue).trim() || nextValue);
        }
    }

    function getFormSectionsSafe(typeId) {
        if (typeof window[H.getSections] === 'function') return window[H.getSections](typeId);
        const schemaFn = NS === 'staff' ? 'getStaffFormSchema' : 'getStudentFormSchema';
        const schema = typeof window[schemaFn] === 'function' ? window[schemaFn](typeId) : { sections: [] };
        return (schema.sections || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }

    function buildDirectoryFilterModel(records = []) {
        const staffTypes = getFormTypesSafe();
        const merged = new Map();
        const blueprintOptionLookup = new Map();

        staffTypes.forEach((type) => {
            getFormSectionsSafe(type.id).forEach((section) => {
                const candidateFields = (section.fields || []).filter(isDirectoryFieldCandidate);
                if (!candidateFields.length) return;

                candidateFields.forEach((field) => {
                    const existing = merged.get(field.key) || {
                        key: field.key,
                        label: field.label,
                        order: Number.isFinite(field.order) ? field.order : 999,
                        sectionId: section.id,
                        sectionTitle: section.title,
                        staffTypeIds: [],
                        aliasKeys: []
                    };
                    existing.label = existing.label || field.label;
                    existing.sectionId = existing.sectionId || section.id;
                    existing.sectionTitle = existing.sectionTitle || section.title;
                    existing.order = Math.min(existing.order, Number.isFinite(field.order) ? field.order : 999);
                    if (!existing.staffTypeIds.includes(type.id)) existing.staffTypeIds.push(type.id);
                    rememberBlueprintOptions(blueprintOptionLookup, field.key, field.options || []);
                    merged.set(field.key, existing);
                });
            });
        });

        let blueprintFilters = Array.from(merged.values())
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label))
            .map((filterDef) => ({
                key: filterDef.key,
                label: filterDef.label,
                order: filterDef.order,
                sectionId: filterDef.sectionId || null,
                sectionTitle: filterDef.sectionTitle || '',
                staffTypeIds: filterDef.staffTypeIds.slice(),
                source: 'records',
                dynamic: true,
                aliasKeys: [],
                options: []
            }));

        if (blueprintFilters.length) {
            enrichFilterOptionsFromRecords(blueprintFilters, records, blueprintOptionLookup);
            blueprintFilters = collapseFiltersByLabel(blueprintFilters);
        }

        return { blueprintFilters, filterGroups: [], staffTypes, usingRecordFallback: false };
    }

    function normalizeDirectoryFilters(filters, model) {
        const source = filters && typeof filters === 'object' ? { ...filters } : {};
        const next = {
            ...DIRECTORY_DEFAULT_FILTERS,
            ...source,
            field: { ...(source.field || {}) }
        };

        Object.entries(LEGACY_FIELD_FILTER_KEYS).forEach(([legacyKey, fieldKey]) => {
            const legacyValue = source[legacyKey];
            if (legacyValue != null && legacyValue !== 'all' && modelHasFilterKey(model, fieldKey)) {
                if (next.field[fieldKey] == null || next.field[fieldKey] === 'all') {
                    next.field[fieldKey] = legacyValue;
                }
            }
            delete next[legacyKey];
        });

        delete next.role;
        delete next.department;
        delete next.status;
        delete next.account;

        const prunedField = {};
        Object.entries(next.field || {}).forEach(([key, value]) => {
            const def = resolveBlueprintFilterDef(model, key);
            if (!def) return;
            if (value == null || value === '' || value === 'all') return;
            prunedField[def.key] = String(value);
        });
        next.field = prunedField;

        next.query = String(next.query ?? '');
        next.droplistQuery = String(next.droplistQuery ?? '');
        if (NS === 'staff') {
            next.platform = next.platform || 'all';
            next.teaching = next.teaching || 'all';
        } else {
            next.mobility = next.mobility || 'all';
            next.program = next.program || 'all';
        }
        next.profile = next.profile || 'all';
        next.archive = next.archive || 'active';
        next.sort = next.sort || 'name';

        return next;
    }

    function recordMatchesPlatform(record, platformFilter, staffTypes = []) {
        if (!platformFilter || platformFilter === 'all') return true;
        if (record.staffTypeId === platformFilter) return true;
        if (record.platformRole === platformFilter) return true;
        const match = staffTypes.find((type) => type.id === platformFilter || type.platformRole === platformFilter || type.slug === platformFilter);
        if (!match) return record.platformRole === platformFilter || record.staffTypeId === platformFilter;
        return record.staffTypeId === match.id
            || record.platformRole === match.platformRole
            || record.platformRole === match.slug
            || record.platformRole === match.id;
    }

    function serializeFieldValues(record) {
        if (!record?.fieldValues || typeof record.fieldValues !== 'object') return '';
        return Object.entries(record.fieldValues)
            .map(([key, value]) => {
                if (Array.isArray(value)) return `${key} ${value.join(' ')}`;
                return `${key} ${value ?? ''}`;
            })
            .join(' ');
    }

    function recordMatchesFieldFilter(record, filterDef, expected, model) {
        if (!filterDef || !expected || expected === 'all') return true;
        const keys = getFilterDefKeys(filterDef);
        for (let index = 0; index < keys.length; index += 1) {
            const actual = getRecordFieldValue(record, keys[index]);
            if (String(actual) === String(expected)) return true;
            const option = (filterDef.options || []).find((item) => String(item.value) === String(expected));
            if (option && (String(actual) === String(option.label) || String(actual) === String(option.value))) {
                return true;
            }
        }
        void model;
        return false;
    }

    function recordMatchesDroplistQuery(record, query, model, normalizeSearch) {
        if (!query) return true;
        const filterDefs = model?.blueprintFilters || [];
        return filterDefs.some((filterDef) => {
            const keys = getFilterDefKeys(filterDef);
            return keys.some((key) => {
                const value = getRecordFieldValue(record, key);
                if (!value) return false;
                const label = getFieldFilterLabel(model, filterDef.key, value);
                const combined = normalizeSearch(`${filterDef.label} ${value} ${label}`);
                return combined.includes(query);
            });
        });
    }

    function buildDroplistSearchLabels(record, model) {
        return (model?.blueprintFilters || []).map((filterDef) => {
            const keys = getFilterDefKeys(filterDef);
            return keys.map((key) => {
                const value = getRecordFieldValue(record, key);
                if (!value) return '';
                return getFieldFilterLabel(model, filterDef.key, value);
            }).filter(Boolean).join(' ');
        }).join(' ');
    }

    function applyDirectoryFilters(records, filters, model, helpers) {
        const resolvedHelpers = resolveHelpers(helpers);
        const normalized = normalizeDirectoryFilters(filters, model);
        const query = resolvedHelpers.normalizeSearch(normalized.query);
        const droplistQuery = resolvedHelpers.normalizeSearch(normalized.droplistQuery);
        const staffTypes = model?.staffTypes || getFormTypesSafe();

        const result = (records || []).filter((record) => {
            const completion = resolvedHelpers.profileCompleteness(record);
            const statusValue = getRecordFieldValue(record, H.statusKey) || record.status || '';

            if (normalized.archive === 'active' && statusValue === 'Archived') return false;
            if (normalized.archive === 'archived' && statusValue !== 'Archived') return false;

            if (NS === 'staff') {
                if (!recordMatchesPlatform(record, normalized.platform, staffTypes)) return false;
                if (normalized.teaching === 'teaching' && !(record.courses || []).length) return false;
                if (normalized.teaching === 'not-teaching' && (record.courses || []).length) return false;
                if (normalized.teaching === 'heavy-load' && Number(record.scheduledHours || 0) < 6) return false;
            } else {
                if (normalized.mobility && normalized.mobility !== 'all') {
                    const category = String(record.mobility?.category || record.mobilityCategory || 'standard');
                    if (category !== normalized.mobility) return false;
                }
                if (normalized.program && normalized.program !== 'all') {
                    const program = resolvedHelpers.normalizeSearch(record.program || '');
                    if (program !== resolvedHelpers.normalizeSearch(normalized.program)) return false;
                }
            }

            if (normalized.profile === 'complete' && completion.percent < 85) return false;
            if (normalized.profile === 'incomplete' && completion.percent >= 85) return false;
            if (normalized.profile === 'missing-photo' && record.photo) return false;
            if (normalized.profile === 'missing-office-hours' && (record.officeHours || []).length) return false;
            if (normalized.profile === 'missing-courses' && (!resolvedHelpers.isTeachingRole(record) || (record.courses || []).length)) return false;

            const fieldFilters = normalized.field || {};
            const fieldKeys = Object.keys(fieldFilters);
            for (let index = 0; index < fieldKeys.length; index += 1) {
                const key = fieldKeys[index];
                const expected = fieldFilters[key];
                if (!expected || expected === 'all') continue;
                const filterDef = resolveBlueprintFilterDef(model, key);
                if (!recordMatchesFieldFilter(record, filterDef, expected, model)) return false;
            }

            if (!recordMatchesDroplistQuery(record, droplistQuery, model, resolvedHelpers.normalizeSearch)) {
                return false;
            }

            if (!query) return true;

            const searchable = [
                record.name,
                record.nameEn,
                record.email,
                record[H.idKey],
                record.staffId,
                record.studentId,
                record.program,
                record.phone,
                record.role,
                record.title,
                record.department,
                record.faculty,
                record.office,
                (record.expertise || []).join(' '),
                (record.languages || []).join(' '),
                (record.courses || []).map((course) => `${course.code} ${course.name} ${course.section || ''}`).join(' '),
                serializeFieldValues(record),
                buildDroplistSearchLabels(record, model),
                JSON.stringify(record.fieldValues || {})
            ].join(' ');

            return resolvedHelpers.normalizeSearch(searchable).includes(query);
        });

        result.sort((a, b) => {
            const sort = normalized.sort;
            const departmentA = getRecordFieldValue(a, 'department') || a.department || '';
            const departmentB = getRecordFieldValue(b, 'department') || b.department || '';
            const roleA = getRecordFieldValue(a, 'display_role') || a.role || '';
            const roleB = getRecordFieldValue(b, 'display_role') || b.role || '';

            if (sort === 'department') return departmentA.localeCompare(departmentB) || String(a.name || '').localeCompare(String(b.name || ''));
            if (sort === 'role') return roleA.localeCompare(roleB) || String(a.name || '').localeCompare(String(b.name || ''));
            if (sort === 'updated') return String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')) || String(a.name || '').localeCompare(String(b.name || ''));
            if (sort === 'courses') return (b.courses || []).length - (a.courses || []).length || String(a.name || '').localeCompare(String(b.name || ''));
            if (sort === 'completion') {
                return resolvedHelpers.profileCompleteness(b).percent - resolvedHelpers.profileCompleteness(a).percent
                    || String(a.name || '').localeCompare(String(b.name || ''));
            }
            return String(a.name || '').localeCompare(String(b.name || ''));
        });

        return result;
    }

    function getBlueprintFilterDef(model, key) {
        return resolveBlueprintFilterDef(model, key);
    }

    function getFieldFilterLabel(model, key, value) {
        const def = getBlueprintFilterDef(model, key);
        const option = (def?.options || []).find((item) => String(item.value) === String(value));
        return option?.label || value;
    }

    function buildDirectoryFilterChips(filters, model) {
        const normalized = normalizeDirectoryFilters(filters, model);
        const chips = [];

        if (normalized.query) {
            chips.push(['Search', normalized.query, 'query', 'system']);
        }

        if (normalized.droplistQuery) {
            chips.push(['Droplist search', normalized.droplistQuery, 'droplistQuery', 'system']);
        }

        Object.entries(normalized.field || {}).forEach(([key, value]) => {
            if (!value || value === 'all') return;
            const def = getBlueprintFilterDef(model, key);
            chips.push([def?.label || key, getFieldFilterLabel(model, key, value), key, 'field']);
        });

        return chips;
    }

    function renderFieldFilterSelect(filterDef, filters, esc) {
        const fieldId = `${H.fieldFilterPrefix}-${filterDef.key}`;
        const filterOptions = filterDef.options || [];
        const hasOptions = filterOptions.length > 0;

        if (!hasOptions) {
            return `
                <div
                    class="${H.hub}-field ${H.hub}-field--compact ${H.hub}-field--pending"
                    data-filter-state="pending"
                >
                    <label for="${esc(fieldId)}">${esc(filterDef.label)}</label>
                    <select
                        class="${H.hub}-control lux-control"
                        id="${esc(fieldId)}"
                        disabled
                        aria-disabled="true"
                    ><option value="">No values yet</option></select>
                </div>
            `;
        }

        const currentValue = filters.field?.[filterDef.key] || 'all';
        const options = [
            `<option value="all">All ${esc(filterDef.label)}</option>`,
            ...filterOptions.map((option) => {
                const selected = currentValue === option.value ? ' selected' : '';
                return `<option value="${esc(option.value)}"${selected}>${esc(option.label)}</option>`;
            })
        ].join('');

        const optionSearchText = filterOptions.map((option) => `${option.label} ${option.value}`).join(' ');

        return `
            <div
                class="${H.hub}-field ${H.hub}-field--compact"
                data-${H.data}-directory-field-filter
                data-filter-label="${esc(filterDef.label)}"
                data-filter-options="${esc(optionSearchText)}"
            >
                <label for="${esc(fieldId)}">${esc(filterDef.label)}</label>
                <select
                    class="${H.hub}-control lux-control"
                    id="${esc(fieldId)}"
                    data-${H.data}-directory-filter
                    data-filter-kind="field"
                    data-filter-key="${esc(filterDef.key)}"
                    data-lux-picker-label="${esc(filterDef.label)}"
                >${options}</select>
            </div>
        `;
    }

    function renderDirectoryControls(ctx = {}) {
        const filters = normalizeDirectoryFilters(ctx.filters, ctx.model);
        const model = ctx.model || buildDirectoryFilterModel([]);
        const esc = typeof ctx.escapeHtml === 'function' ? ctx.escapeHtml : escapeHtml;
        const renderStaffTypeCreateButtons = typeof ctx.renderStaffTypeCreateButtons === 'function'
            ? ctx.renderStaffTypeCreateButtons
            : () => '';
        const visibleCount = Number.isFinite(ctx.visibleCount) ? ctx.visibleCount : 0;
        const isAdminSession = Boolean(ctx.isAdminSession);
        const blueprintFilters = model.blueprintFilters || [];
        const chips = buildDirectoryFilterChips(filters, model);

        const fieldFilterMarkup = blueprintFilters.map((filterDef) => renderFieldFilterSelect(filterDef, filters, esc)).join('');
        const hasActiveFieldFilters = blueprintFilters.some((filterDef) => (filterDef.options || []).length > 0);

        const droplistInlineMarkup = hasActiveFieldFilters ? `
                    <div class="${H.hub}-search-wrap ${H.hub}-field ${H.hub}-field--droplist">
                        <label for="${H.droplistSearchId}">Filter values</label>
                        <div class="${H.hub}-search-field">
                            <i class="fas fa-list-ul" aria-hidden="true"></i>
                            <input
                                class="${H.hub}-control lux-control"
                                id="${H.droplistSearchId}"
                                type="search"
                                value="${esc(filters.droplistQuery)}"
                                placeholder="Filter field values..."
                            />
                        </div>
                    </div>
                ` : '';

        const emptyFiltersHint = (!blueprintFilters.length && isAdminSession) ? `
                    <div class="${H.hub}-filter-hint ${H.hub}-filter-hint--inline">
                        <i class="fas fa-wand-magic-sparkles" aria-hidden="true"></i>
                        <p><strong>No directory field filters yet.</strong> Add fields in form settings to surface them here.</p>
                        <button class="${H.hub}-filter-hint-btn" type="button" data-${H.data}-action="open-form-settings">
                            <i class="fas fa-sliders"></i> Open form settings
                        </button>
                    </div>
                ` : '';

        const chipsMarkup = chips.length
            ? chips.map(([label, value, clearKey, clearKind]) => `
                <button
                    class="${H.hub}-chip lux-status-pill home-hover-chip is-clickable"
                    type="button"
                    data-${H.data}-action="clear-filter-chip"
                    data-filter-clear-key="${esc(clearKey)}"
                    data-filter-clear-kind="${esc(clearKind)}"
                    aria-label="Remove ${esc(label)} filter"
                ><span>${esc(label)}</span><em>${esc(value)}</em><i class="fas fa-xmark" aria-hidden="true"></i></button>
            `).join('')
            : '';

        const activeFiltersRow = chipsMarkup
            ? `<div class="${H.hub}-active-filters" aria-label="Active filters">${chipsMarkup}</div>`
            : '';

        return `
            <div class="${H.hub}-controls-head">
                <div class="${H.hub}-controls-copy">
                    <h2 class="${H.hub}-section-title lux-card-title">${H.sectionTitle}</h2>
                    <span class="${H.hub}-result-pill home-hover-chip">${visibleCount} result${visibleCount === 1 ? '' : 's'}</span>
                </div>
                ${isAdminSession ? `<div class="${H.hub}-inline-actions ${H.hub}-register-actions" data-lux-btn-density="dense">
                    <button class="lux-secondary-btn" type="button" data-${H.data}-action="open-form-settings">
                        <i class="fas fa-sliders"></i> Customize form
                    </button>
                    <button class="lux-secondary-btn" type="button" data-${H.data}-action="export-csv"><i class="fas fa-table"></i> Export CSV</button>
                    ${renderStaffTypeCreateButtons(isAdminSession)}
                </div>` : ''}
            </div>

            <div class="${H.hub}-filter-deck">
                <div class="${H.hub}-filter-deck-section ${H.hub}-filter-deck-section--primary is-compact">
                    <div class="${H.hub}-search-wrap ${H.hub}-field">
                        <label for="${H.searchInputId}">Search directory</label>
                        <div class="${H.hub}-search-field">
                            <i class="fas fa-search" aria-hidden="true"></i>
                            <input class="${H.hub}-control lux-control" id="${H.searchInputId}" type="search" value="${esc(filters.query)}" placeholder="${H.searchPlaceholder}" />
                        </div>
                    </div>
                    ${NS === 'student' ? `
                    <div class="${H.hub}-field">
                        <label for="student-filter-mobility">Mobility</label>
                        <select class="${H.hub}-control lux-control" id="student-filter-mobility" data-${H.data}-system-filter="mobility" data-lux-picker-label="Mobility">
                            <option value="all"${filters.mobility === 'all' ? ' selected' : ''}>All categories</option>
                            <option value="standard"${filters.mobility === 'standard' ? ' selected' : ''}>Standard enrollment</option>
                            <option value="exchange_incoming"${filters.mobility === 'exchange_incoming' ? ' selected' : ''}>Exchange incoming</option>
                            <option value="exchange_outgoing"${filters.mobility === 'exchange_outgoing' ? ' selected' : ''}>Exchange outgoing</option>
                            <option value="internal_transfer"${filters.mobility === 'internal_transfer' ? ' selected' : ''}>Internal transfer</option>
                        </select>
                    </div>
                    <div class="${H.hub}-field">
                        <label for="student-filter-program">Program</label>
                        <input class="${H.hub}-control lux-control" id="student-filter-program" type="search" value="${esc(filters.program === 'all' ? '' : filters.program)}" placeholder="Filter by program" data-${H.data}-system-filter="program" />
                    </div>
                    ` : ''}
                    ${droplistInlineMarkup}
                    ${fieldFilterMarkup}
                    ${emptyFiltersHint}
                    ${activeFiltersRow}
                </div>
            </div>
        `;
    }

    function resolveSavedViewFilters(view, model) {
        if (view === 'all') {
            return { ...DIRECTORY_DEFAULT_FILTERS, field: { ...(DIRECTORY_DEFAULT_FILTERS.field || {}) } };
        }

        if (view === 'account-review') {
            const partial = { archive: 'active', sort: 'name', field: {} };
            if (modelHasFilterKey(model, 'lms_account_status')) {
                partial.field = { lms_account_status: 'Needs Review' };
            }
            return partial;
        }

        if (view === 'overloaded') {
            return { teaching: 'heavy-load', archive: 'active', sort: 'completion' };
        }

        if (view === 'unassigned') {
            return { profile: 'missing-courses', archive: 'active', sort: 'name' };
        }

        return {};
    }

    function applyDirectoryDroplistFieldVisibility(query = '') {
        const normalized = fallbackNormalizeSearch(query);
        document.querySelectorAll('[data-' + H.data + '-directory-field-filter]').forEach((element) => {
            const label = element.dataset.filterLabel || '';
            const options = element.dataset.filterOptions || '';
            const haystack = fallbackNormalizeSearch(`${label} ${options}`);
            element.hidden = normalized ? !haystack.includes(normalized) : false;
        });
    }

    if (NS === 'staff') {
        window.STAFF_DIRECTORY_SYSTEM_FILTERS = DIRECTORY_SYSTEM_FILTERS;
        window.STAFF_DIRECTORY_DEFAULT_FILTERS = DIRECTORY_DEFAULT_FILTERS;
        window.buildStaffDirectoryFilterModel = buildDirectoryFilterModel;
        window.applyStaffDirectoryDroplistFieldVisibility = applyDirectoryDroplistFieldVisibility;
        window.getStaffRecordFieldValue = getRecordFieldValue;
        window.normalizeStaffDirectoryFilters = normalizeDirectoryFilters;
        window.applyStaffDirectoryFilters = applyDirectoryFilters;
        window.buildStaffDirectoryFilterChips = buildDirectoryFilterChips;
        window.renderStaffDirectoryControls = renderDirectoryControls;
        window.resolveStaffSavedViewFilters = resolveSavedViewFilters;
    } else {
        window.STUDENT_DIRECTORY_SYSTEM_FILTERS = DIRECTORY_SYSTEM_FILTERS;
        window.STUDENT_DIRECTORY_DEFAULT_FILTERS = DIRECTORY_DEFAULT_FILTERS;
        window.buildStudentDirectoryFilterModel = buildDirectoryFilterModel;
        window.applyStudentDirectoryDroplistFieldVisibility = applyDirectoryDroplistFieldVisibility;
        window.getStudentRecordFieldValue = getRecordFieldValue;
        window.normalizeStudentDirectoryFilters = normalizeDirectoryFilters;
        window.applyStudentDirectoryFilters = applyDirectoryFilters;
        window.buildStaffDirectoryFilterChips = buildDirectoryFilterChips;
        window.buildStudentDirectoryFilterChips = buildDirectoryFilterChips;
        window.renderStudentDirectoryControls = renderDirectoryControls;
        window.resolveStudentSavedViewFilters = resolveSavedViewFilters;
    }
})();