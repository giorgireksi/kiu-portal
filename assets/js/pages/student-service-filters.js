(function initStudentServiceFiltersModule() {
    if (window.__KIU_STUDENT_SERVICE_FILTERS_MODULE_LOADED) return;
    window.__KIU_STUDENT_SERVICE_FILTERS_MODULE_LOADED = true;

    function getStudentServiceDefaultSearchFilter() {
        const searchFilter = buildStudentServiceDefaultInboxFilterLayout().filters.find(filter => filter.id === 'ticketSearch');
        return searchFilter ? JSON.parse(JSON.stringify(searchFilter)) : null;
    }

    function buildStudentServiceMinimalInboxFilterLayout() {
        const searchFilter = getStudentServiceDefaultSearchFilter();
        return searchFilter ? { version: 1, filters: [searchFilter] } : null;
    }

    function isStudentServiceCustomInboxFilter(filter) {
        return filter?.type === 'select' && String(filter?.id || '').startsWith('custom_');
    }

    function buildStudentServiceDefaultInboxFilterLayout() {
        return {
            version: 1,
            filters: [
                {
                    id: 'ticketSearch',
                    type: 'search',
                    label: 'Search',
                    tier: 'basic',
                    enabled: true,
                    placeholder: 'Search title, student, category, status'
                },
                {
                    id: 'ticketStatus',
                    type: 'select',
                    label: 'Status',
                    tier: 'basic',
                    enabled: true,
                    source: 'statuses'
                },
                {
                    id: 'ticketCategory',
                    type: 'select',
                    label: 'Category',
                    tier: 'basic',
                    enabled: true,
                    source: 'categories'
                },
                {
                    id: 'ticketServiceArea',
                    type: 'select',
                    label: 'Topic',
                    tier: 'advanced',
                    enabled: true,
                    source: 'supportAreas'
                },
                {
                    id: 'ticketAssignee',
                    type: 'select',
                    label: 'Work',
                    tier: 'advanced',
                    enabled: true,
                    source: 'assignees'
                },
                {
                    id: 'ticketFaculty',
                    type: 'select',
                    label: 'Faculty',
                    tier: 'advanced',
                    enabled: true,
                    source: 'faculties'
                }
            ]
        };
    }

    function normalizeStudentServiceInboxFilterOption(option = {}) {
        const value = String(option?.value ?? '').trim();
        const label = String(option?.label ?? value).trim();
        if (!value || !label) return null;
        return { value, label };
    }

    function deriveStudentServiceInboxFilterOptionValue(label) {
        return String(label || '').trim();
    }

    function getStudentServiceEditableCustomFilterOptions(options = []) {
        return (Array.isArray(options) ? options : []).filter(option => String(option?.value || '') !== 'all');
    }

    function getStudentServiceCustomInboxFilterDefaultValue(filter) {
        const options = getStudentServiceEditableCustomFilterOptions(filter?.options);
        return String(options[0]?.value || '');
    }

    function normalizeCustomInboxFilterOptions(filter) {
        if (!filter || !String(filter.id || '').startsWith('custom_')) return filter;
        const editable = getStudentServiceEditableCustomFilterOptions(filter.options)
            .map(option => {
                const label = String(option?.label ?? option?.value ?? '').trim();
                if (!label) return null;
                return { value: deriveStudentServiceInboxFilterOptionValue(label), label };
            })
            .filter(Boolean);
        filter.tier = 'advanced';
        filter.field = 'status';
        filter.options = editable;
        return filter;
    }

    function normalizeStudentServiceInboxFilterEditorDraftFilters(filters = []) {
        return (Array.isArray(filters) ? filters : []).map(filter =>
            String(filter?.id || '').startsWith('custom_') ? normalizeCustomInboxFilterOptions({ ...filter }) : filter
        );
    }

    function normalizeStudentServiceInboxFilterEntry(entry = {}) {
        const id = String(entry?.id || '').trim();
        if (!id) return null;
        const type = String(entry?.type || '').trim().toLowerCase() === 'search' ? 'search' : 'select';
        const tier = String(entry?.tier || '').trim().toLowerCase() === 'advanced' ? 'advanced' : 'basic';
        const label = String(entry?.label || id).trim() || id;
        const enabled = entry?.enabled !== false;
        const normalized = { id, type, label, tier, enabled };
        if (type === 'search') {
            normalized.placeholder = String(entry?.placeholder || 'Search tickets').trim() || 'Search tickets';
            return STUDENT_SERVICE_BUILTIN_INBOX_FILTER_IDS.has(id) ? normalized : null;
        }
        if (STUDENT_SERVICE_BUILTIN_INBOX_FILTER_IDS.has(id)) {
            const source = String(entry?.source || '').trim();
            if (!STUDENT_SERVICE_INBOX_FILTER_SOURCES.has(source)) return null;
            normalized.source = source;
            return normalized;
        }
        if (!id.startsWith('custom_')) return null;
        const field = String(entry?.field || 'status').trim();
        if (!STUDENT_SERVICE_INBOX_FILTER_FIELDS.has(field)) return null;
        const options = (Array.isArray(entry?.options) ? entry.options : [])
            .map(option => normalizeStudentServiceInboxFilterOption(option))
            .filter(Boolean);
        const customOptions = options.filter(option => option.value !== 'all');
        if (!customOptions.length) return null;
        normalized.field = field;
        normalized.options = customOptions;
        return normalized;
    }

    function normalizeStudentServiceInboxFilterLayout(layout = null) {
        if (!layout || typeof layout !== 'object') return null;
        let filters = (Array.isArray(layout.filters) ? layout.filters : [])
            .map(entry => normalizeStudentServiceInboxFilterEntry(entry))
            .filter(Boolean);
        if (!filters.some(filter => filter.id === 'ticketSearch')) {
            const searchFilter = normalizeStudentServiceInboxFilterEntry(getStudentServiceDefaultSearchFilter() || {});
            if (searchFilter) filters = [searchFilter, ...filters];
        }
        filters = filters.filter(
            filter => filter.id === 'ticketSearch' || String(filter.id).startsWith('custom_')
        );
        if (!filters.length) return null;
        return { version: 1, filters };
    }

    function ensureStudentServiceInboxFilterLayoutHasSearch(layout) {
        if (!layout || typeof layout !== 'object') return layout;
        const filters = Array.isArray(layout.filters) ? layout.filters : [];
        if (filters.some(filter => filter?.id === 'ticketSearch')) return layout;
        const searchFilter = getStudentServiceDefaultSearchFilter();
        if (!searchFilter) return layout;
        return { version: 1, filters: [searchFilter, ...filters] };
    }

    function finalizeStudentServiceInboxFilterLayout(dropdownLayout) {
        const dropdowns = normalizeStudentServiceInboxFilterEditorDraftFilters(dropdownLayout?.filters || []);
        const searchFilter = getStudentServiceDefaultSearchFilter();
        return normalizeStudentServiceInboxFilterLayout({
            version: 1,
            filters: searchFilter ? [searchFilter, ...dropdowns] : dropdowns
        });
    }

    function studentServiceInboxFilterLayoutHasDropdowns(layout) {
        return (layout?.filters || []).some(filter => filter?.enabled && filter.type !== 'search');
    }

    function studentServiceInboxFilterLayoutFingerprint(layout) {
        const normalized = normalizeStudentServiceInboxFilterLayout(layout);
        return JSON.stringify(normalized?.filters || []);
    }

    async function persistStudentServiceSharedInboxFilterLayout(layout) {
        const normalized = normalizeStudentServiceInboxFilterLayout(layout);
        if (!normalized) return null;
        const fingerprint = studentServiceInboxFilterLayoutFingerprint(normalized);
        const sharedFingerprint = studentServiceInboxFilterLayoutFingerprint(getStudentServiceSharedInboxFilterLayout());
        if (fingerprint === sharedFingerprint) {
            return { ok: true, inboxFilterLayout: getStudentServiceSharedInboxFilterLayout() };
        }
        const payload = await postStudentService(STUDENT_SERVICE_API_PATHS.inboxFilterLayout(), { layout: normalized });
        if (payload?.inboxFilterLayout) {
            KIU_STATE.studentServiceInboxFilterLayout = normalizeStudentServiceInboxFilterLayout(payload.inboxFilterLayout)
                || payload.inboxFilterLayout;
            studentServiceLastPersistedLayoutFingerprint = studentServiceInboxFilterLayoutFingerprint(payload.inboxFilterLayout);
        }
        return payload;
    }

    async function maybeSyncStudentServicePersonalInboxFilterLayoutToTeam() {
        if (!canCurrentUserModerateStudentService() || typeof kiuPortalFetch !== 'function') return;
        const personalLayout = readStudentServicePersonalInboxFilterLayout();
        if (!studentServiceInboxFilterLayoutHasDropdowns(personalLayout)) return;
        const sharedLayout = getStudentServiceSharedInboxFilterLayout();
        if (studentServiceInboxFilterLayoutFingerprint(personalLayout) === studentServiceInboxFilterLayoutFingerprint(sharedLayout)) {
            return;
        }
        if (studentServicePersonalLayoutTeamSyncPromise) return studentServicePersonalLayoutTeamSyncPromise;
        studentServicePersonalLayoutTeamSyncPromise = persistStudentServiceSharedInboxFilterLayout(personalLayout)
            .catch((error) => {
                console.error('Student Service personal inbox filter team sync failed.', error);
            })
            .finally(() => {
                studentServicePersonalLayoutTeamSyncPromise = null;
            });
        return studentServicePersonalLayoutTeamSyncPromise;
    }

    function readStudentServiceInboxFilterPrefs() {
        try {
            const raw = window.localStorage?.getItem(STUDENT_SERVICE_INBOX_FILTER_PREFS_KEY);
            if (!raw) return {};
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_) {
            return {};
        }
    }

    function readStudentServicePersonalInboxFilterLayout(key = getStudentServiceUiKey()) {
        const layout = readStudentServiceInboxFilterPrefs()?.[key]?.layout;
        return normalizeStudentServiceInboxFilterLayout(layout);
    }

    function writeStudentServicePersonalInboxFilterLayout(layout, key = getStudentServiceUiKey()) {
        try {
            const prefs = readStudentServiceInboxFilterPrefs();
            const normalized = normalizeStudentServiceInboxFilterLayout(layout);
            if (!normalized) return false;
            prefs[key] = { layout: normalized };
            window.localStorage?.setItem(STUDENT_SERVICE_INBOX_FILTER_PREFS_KEY, JSON.stringify(prefs));
            return true;
        } catch (_) {
            return false;
        }
    }

    function clearStudentServicePersonalInboxFilterLayout(key = getStudentServiceUiKey()) {
        try {
            const prefs = readStudentServiceInboxFilterPrefs();
            if (!prefs[key]) return false;
            delete prefs[key];
            window.localStorage?.setItem(STUDENT_SERVICE_INBOX_FILTER_PREFS_KEY, JSON.stringify(prefs));
            return true;
        } catch (_) {
            return false;
        }
    }

    function getStudentServiceSharedInboxFilterLayout() {
        return normalizeStudentServiceInboxFilterLayout(KIU_STATE.studentServiceInboxFilterLayout);
    }

    function getStudentServicePublicInboxFilterLayout() {
        const layout = getStudentServiceSharedInboxFilterLayout()
            || buildStudentServiceMinimalInboxFilterLayout();
        return ensureStudentServiceInboxFilterLayoutHasSearch(layout) || layout;
    }

    function publishStudentServiceInboxFilterLayout(layout) {
        const normalized = normalizeStudentServiceInboxFilterLayout(layout);
        if (!normalized) return null;
        try {
            if (studentServiceInboxFilterLayoutHasDropdowns(normalized)) {
                window.localStorage?.setItem(STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT_KEY, JSON.stringify(normalized));
            } else {
                window.localStorage?.removeItem(STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT_KEY);
            }
        } catch (_) {}
        return normalized;
    }

    function pruneStudentServiceCustomTicketFilters(layout) {
        const normalized = normalizeStudentServiceInboxFilterLayout(layout);
        const allowedIds = new Set(
            (normalized?.filters || [])
                .filter(filter => String(filter?.id || '').startsWith('custom_'))
                .map(filter => filter.id)
        );
        const ui = ensureStudentServiceUiState();
        if (!ui.customTicketFilters || typeof ui.customTicketFilters !== 'object') return;
        let changed = false;
        const next = { ...ui.customTicketFilters };
        Object.keys(next).forEach((key) => {
            if (key.startsWith('custom_') && !allowedIds.has(key)) {
                delete next[key];
                changed = true;
            }
        });
        if (changed) ui.customTicketFilters = next;
    }

    function getStudentServicePublishedInboxFilterLayout() {
        const shared = getStudentServiceSharedInboxFilterLayout();
        if (studentServiceInboxFilterLayoutHasDropdowns(shared)) {
            return ensureStudentServiceInboxFilterLayoutHasSearch(shared) || shared;
        }
        try {
            const mirrored = normalizeStudentServiceInboxFilterLayout(
                JSON.parse(window.localStorage?.getItem(STUDENT_SERVICE_PUBLISHED_FILTER_LAYOUT_KEY) || 'null')
            );
            if (studentServiceInboxFilterLayoutHasDropdowns(mirrored)) {
                return ensureStudentServiceInboxFilterLayoutHasSearch(mirrored) || mirrored;
            }
        } catch (_) {}
        return getStudentServicePublicInboxFilterLayout();
    }

    function publishStudentServiceInboxFilterLayoutFromEffective() {
        const effective = getStudentServiceEffectiveInboxFilterLayout();
        if (!studentServiceInboxFilterLayoutHasDropdowns(effective)) return;
        publishStudentServiceInboxFilterLayout(effective);
        if (!canCurrentUserModerateStudentService() || typeof kiuPortalFetch !== 'function') return;
        if (studentServicePublishedLayoutPersistPromise) return;
        studentServicePublishedLayoutPersistPromise = persistStudentServiceSharedInboxFilterLayout(effective)
            .catch((error) => {
                console.error('Student Service published inbox filter layout persist failed.', error);
            })
            .finally(() => {
                studentServicePublishedLayoutPersistPromise = null;
            });
    }

    function getStudentServiceEffectiveInboxFilterLayout() {
        const layout = readStudentServicePersonalInboxFilterLayout()
            || getStudentServiceSharedInboxFilterLayout()
            || buildStudentServiceMinimalInboxFilterLayout();
        return ensureStudentServiceInboxFilterLayoutHasSearch(layout) || layout;
    }

    function resolveStudentServiceInboxFilterLayout(options = {}) {
        if (options.layout) {
            return ensureStudentServiceInboxFilterLayoutHasSearch(options.layout) || options.layout;
        }
        if (options.usePublicLayout) return getStudentServicePublicInboxFilterLayout();
        return getStudentServiceEffectiveInboxFilterLayout();
    }

    function getStudentServiceInboxFilterValue(ui, filter) {
        if (!filter?.id) return '';
        if (filter.id.startsWith('custom_')) {
            const stored = String(ui.customTicketFilters?.[filter.id] || '').trim();
            const defaultValue = getStudentServiceCustomInboxFilterDefaultValue(filter);
            if (!stored || stored === 'all') return defaultValue;
            return stored;
        }
        return String(ui[filter.id] ?? 'all');
    }

    function setStudentServiceInboxFilterValue(filterId, value) {
        const ui = ensureStudentServiceUiState();
        if (String(filterId || '').startsWith('custom_')) {
            ui.customTicketFilters = {
                ...(ui.customTicketFilters || {}),
                [filterId]: String(value || '')
            };
            renderStudentServicePage();
            return;
        }
        setStudentServiceTicketFilter(filterId, value);
    }

    function getStudentServiceInboxFilterOptions(filter, visibleTickets = [], currentUser = null) {
        if (!filter || filter.type !== 'select') return [];
        if (filter.id.startsWith('custom_')) {
            return Array.isArray(filter.options) ? filter.options : [];
        }
        if (filter.source === 'statuses') {
            return [{ value: 'all', label: 'All statuses' }, ...STUDENT_SERVICE_STATUSES.map(status => ({ value: status, label: status }))];
        }
        if (filter.source === 'categories') {
            return [{ value: 'all', label: 'All categories' }, ...STUDENT_SERVICE_CATEGORIES.map(category => ({ value: category, label: category }))];
        }
        if (filter.source === 'supportAreas') {
            return [{ value: 'all', label: 'All topics' }, ...STUDENT_SERVICE_SUPPORT_AREAS.map(area => ({ value: area.id, label: area.label }))];
        }
        if (filter.source === 'assignees') {
            return [
                { value: 'all', label: 'All work' },
                { value: 'mine', label: 'Assigned to me' },
                { value: 'unassigned', label: 'Unassigned' },
                { value: 'assigned', label: 'Assigned only' }
            ];
        }
        if (filter.source === 'faculties') {
            const faculties = [...new Set((visibleTickets || []).map(ticket =>
                normalizeFacultyCode(ticket.faculty || '', '')
            ).filter(Boolean))];
            return [
                { value: 'all', label: 'All faculties' },
                ...faculties.map(facultyCode => ({ value: facultyCode, label: ssFacultyLabel(facultyCode) }))
            ];
        }
        return [];
    }

    function ticketMatchesStudentServiceInboxFilter(ticket, filter, ui, currentUser) {
        if (!filter?.enabled) return true;
        const value = getStudentServiceInboxFilterValue(ui, filter);
        if (filter.type === 'search') {
            const query = String(value || '').trim().toLowerCase();
            if (!query) return true;
            return [
                ticket.title,
                ticket.studentName,
                ticket.category,
                ticket.serviceArea,
                ticket.latestPreview,
                ticket.relatedSubjectName,
                ticket.relatedContextLabel,
                ticket.assignedToName,
                ticket.faculty
            ].some(field => String(field || '').toLowerCase().includes(query));
        }
        if (filter.id.startsWith('custom_')) {
            if (!value) return true;
            const field = filter.field || 'status';
            if (field === 'faculty') {
                return normalizeFacultyCode(ticket.faculty || '', '') === normalizeFacultyCode(value || '', '');
            }
            if (field === 'assignedToId') {
                return String(ticket.assignedToId || '') === String(value || '');
            }
            return String(ticket[field] || '') === String(value || '');
        }
        if (value === 'all' || !value) return true;
        if (filter.id === 'ticketStatus') return ticket.status === value;
        if (filter.id === 'ticketCategory') return ticket.category === value;
        if (filter.id === 'ticketServiceArea') return ticket.serviceArea === value;
        if (filter.id === 'ticketAssignee') {
            if (value === 'mine') return String(ticket.assignedToId || '') === String(currentUser?.id || '');
            if (value === 'unassigned') return !String(ticket.assignedToId || '').trim();
            if (value === 'assigned') return Boolean(String(ticket.assignedToId || '').trim());
            return true;
        }
        if (filter.id === 'ticketFaculty') {
            return normalizeFacultyCode(ticket.faculty || '', '') === normalizeFacultyCode(value || '', '');
        }
        return true;
    }

    function renderStudentServiceInboxFilterControlMarkup(filter, ui, visibleTickets, currentUser) {
        if (!filter?.enabled) return '';
        const value = getStudentServiceInboxFilterValue(ui, filter);
        if (filter.type === 'search') {
            return `
                <div class="student-service-find-search student-service-find-search--inbox">
                    <i class="fas fa-search"></i>
                    <input type="search" value="${ssEscape(value)}" data-student-service-ticket-filter-input="${ssEscape(filter.id)}" placeholder="${ssEscape(filter.placeholder || filter.label || 'Search tickets')}">
                </div>
            `;
        }
        const options = getStudentServiceInboxFilterOptions(filter, visibleTickets, currentUser);
        return `
            <select class="lux-control" data-student-service-ticket-filter-input="${ssEscape(filter.id)}" data-lux-picker-label="${ssEscape(filter.label || filter.id)}">
                ${options.map(option => `<option value="${ssEscape(option.value)}"${value === option.value ? ' selected' : ''}>${ssEscape(option.label)}</option>`).join('')}
            </select>
        `;
    }

    function renderStudentServiceInboxDropdownFiltersMarkup(ui, visibleTickets, currentUser, options = {}) {
        const layout = resolveStudentServiceInboxFilterLayout(options);
        const dropdownFilters = (layout.filters || []).filter(filter => filter.enabled && filter.type !== 'search');
        if (!dropdownFilters.length) return '';
        return `
            <div class="student-service-staff-filter-row student-service-staff-filter-row--toolbar">
                ${dropdownFilters.map(filter => renderStudentServiceInboxFilterControlMarkup(filter, ui, visibleTickets, currentUser)).join('')}
            </div>
        `;
    }

    function renderStudentServiceInboxFiltersMarkup(ui, visibleTickets, currentUser, options = {}) {
        const layout = resolveStudentServiceInboxFilterLayout(options);
        const searchFilter = (layout.filters || []).filter(filter => filter.enabled).find(filter => filter.type === 'search');
        const dropdownMarkup = renderStudentServiceInboxDropdownFiltersMarkup(ui, visibleTickets, currentUser, options);
        return `
            <div class="student-service-staff-search">
                ${searchFilter ? renderStudentServiceInboxFilterControlMarkup(searchFilter, ui, visibleTickets, currentUser) : ''}
                ${dropdownMarkup}
            </div>
        `;
    }

    function buildStudentServiceTicketIntakeFromInboxFilters(ui) {
        const layout = getStudentServicePublishedInboxFilterLayout();
        const intake = {};
        (layout.filters || []).filter(filter =>
            filter.enabled && filter.type === 'select' && String(filter.id || '').startsWith('custom_')
        ).forEach((filter) => {
            const value = String(getStudentServiceInboxFilterValue(ui, filter) || '').trim();
            if (!value) return;
            const field = filter.field || 'status';
            if (field === 'faculty') {
                intake.facultyCode = normalizeFacultyCode(value, '');
                return;
            }
            if (field === 'category' && STUDENT_SERVICE_CATEGORIES.includes(value)) {
                intake.category = value;
                return;
            }
            if (field === 'serviceArea') {
                intake.serviceArea = getStudentServiceSupportArea(value).id;
                return;
            }
            if (field === 'status' && STUDENT_SERVICE_STATUSES.includes(value)) intake.status = value;
        });
        return intake;
    }

    function cloneStudentServiceInboxFilterLayout(layout = null) {
        const normalized = normalizeStudentServiceInboxFilterLayout(layout) || buildStudentServiceMinimalInboxFilterLayout();
        return JSON.parse(JSON.stringify(normalized));
    }

    function buildStudentServiceInboxFilterEditorDraft(layout = null) {
        const source = cloneStudentServiceInboxFilterLayout(layout || getStudentServiceEffectiveInboxFilterLayout());
        return {
            version: 1,
            filters: (source.filters || []).filter(isStudentServiceCustomInboxFilter)
        };
    }

    function renderStudentServiceInboxFilterEditorRowMarkup(filter, index, total) {
        const editableOptions = getStudentServiceEditableCustomFilterOptions(filter.options);
        return `
            <article class="student-service-inbox-filter-editor-row" role="listitem" data-student-service-inbox-filter-editor-row="${index}">
                <div class="student-service-inbox-filter-editor-row-head">
                    <label class="student-service-inbox-filter-editor-toggle">
                        <input type="checkbox" data-student-service-inbox-filter-editor-field="enabled" data-student-service-inbox-filter-editor-filter-index="${index}"${filter.enabled ? ' checked' : ''}>
                        <span>Enabled</span>
                    </label>
                    <div class="student-service-inbox-filter-editor-row-actions">
                        <button type="button" class="student-service-mini-action student-service-inbox-filter-editor-icon-btn" data-student-service-inbox-filter-editor-move="up" data-student-service-inbox-filter-editor-filter-index="${index}"${index === 0 ? ' disabled' : ''} aria-label="Move up"><i class="fas fa-arrow-up"></i></button>
                        <button type="button" class="student-service-mini-action student-service-inbox-filter-editor-icon-btn" data-student-service-inbox-filter-editor-move="down" data-student-service-inbox-filter-editor-filter-index="${index}"${index >= total - 1 ? ' disabled' : ''} aria-label="Move down"><i class="fas fa-arrow-down"></i></button>
                        <button type="button" class="student-service-mini-action student-service-inbox-filter-editor-icon-btn student-service-inbox-filter-editor-remove" data-student-service-inbox-filter-editor-remove-filter="${index}" aria-label="Remove filter"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
                <div class="student-service-inbox-filter-editor-grid">
                    <label class="lux-picker-field">
                        <span class="lux-picker-label">Dropdown name</span>
                        <input type="text" class="lux-control" value="${ssEscape(filter.label || '')}" data-student-service-inbox-filter-editor-field="label" data-student-service-inbox-filter-editor-filter-index="${index}">
                    </label>
                </div>
                <div class="student-service-inbox-filter-editor-options">
                    ${editableOptions.map((option, optionIndex) => `
                        <div class="student-service-inbox-filter-editor-option">
                            <label class="lux-picker-field student-service-inbox-filter-editor-option-field">
                                <span class="lux-picker-label">Option</span>
                                <input type="text" class="lux-control" value="${ssEscape(option.label || option.value || '')}" data-student-service-inbox-filter-editor-option-label="true" data-student-service-inbox-filter-editor-filter-index="${index}" data-student-service-inbox-filter-editor-option-index="${optionIndex}" placeholder="Option label">
                            </label>
                            <button type="button" class="student-service-mini-action student-service-inbox-filter-editor-icon-btn" data-student-service-inbox-filter-editor-remove-option="${index}" data-student-service-inbox-filter-editor-option-index="${optionIndex}" aria-label="Remove option"><i class="fas fa-minus"></i></button>
                        </div>
                    `).join('')}
                    <button type="button" class="lux-secondary-btn student-service-inbox-filter-editor-inline-btn" data-student-service-inbox-filter-editor-add-option="${index}"><i class="fas fa-plus"></i> Add option</button>
                </div>
            </article>
        `;
    }

    function renderStudentServiceInboxFilterEditorModalShell() {
        const draft = studentServiceInboxFilterEditorDraft || buildStudentServiceInboxFilterEditorDraft();
        const filters = Array.isArray(draft.filters) ? draft.filters : [];
        return `
            <div class="student-service-inbox-filter-editor-backdrop" data-student-service-inbox-filter-editor-modal="true" data-student-service-dismiss-inbox-filter-editor-modal="true">
                <div class="student-service-inbox-filter-editor-modal" role="dialog" aria-modal="true" aria-labelledby="student-service-inbox-filter-editor-title">
                    <div class="student-service-inbox-filter-editor-accent" aria-hidden="true"></div>
                    <header class="student-service-inbox-filter-editor-head">
                        <div class="student-service-inbox-filter-editor-heading">
                            <span class="student-service-inbox-filter-editor-icon-chip" aria-hidden="true"><i class="fas fa-sliders-h"></i></span>
                            <div class="student-service-inbox-filter-editor-title-wrap">
                                <div class="student-service-kicker">Inbox workspace</div>
                                <strong id="student-service-inbox-filter-editor-title">Edit inbox filters</strong>
                                <span class="student-service-zone-copy">Configure which filters staff see in the inbox zone.</span>
                            </div>
                        </div>
                        <button type="button" class="social-neo-btn social-neo-btn-ghost student-service-inbox-filter-editor-close" data-lux-skip-modern-button="true" data-student-service-inbox-filter-editor-close="true" aria-label="Close"><i class="fas fa-times" aria-hidden="true"></i></button>
                    </header>
                    <div class="student-service-inbox-filter-editor-body">
                        <p class="student-service-inbox-filter-editor-copy">Search is always shown in the inbox. Add dropdown filters below, or save with none. Saving updates the team layout students and other accounts see.</p>
                        <div class="student-service-inbox-filter-editor-list" role="list">
                            ${filters.map((filter, index) => renderStudentServiceInboxFilterEditorRowMarkup(filter, index, filters.length)).join('')}
                        </div>
                        <button type="button" class="lux-secondary-btn student-service-inbox-filter-editor-add" data-student-service-inbox-filter-editor-add-filter="true"><i class="fas fa-plus"></i> Add dropdown</button>
                    </div>
                    <footer class="student-service-inbox-filter-editor-actions">
                        <span class="student-service-inbox-filter-editor-actions-copy">Save for me also updates the team layout for students and other accounts.</span>
                        <div class="student-service-inbox-filter-editor-actions-buttons">
                            <button type="button" class="lux-secondary-btn" data-student-service-inbox-filter-editor-reset-personal="true">Use team default</button>
                            <button type="button" class="lux-secondary-btn" data-student-service-inbox-filter-editor-save-personal="true">Save for me</button>
                            <button type="button" class="lux-primary-btn" data-student-service-inbox-filter-editor-save-shared="true"><i class="fas fa-check"></i> Save team default</button>
                        </div>
                    </footer>
                </div>
            </div>
        `;
    }

    function syncStudentServiceInboxFilterEditorPickers(modalRoot) {
        if (!modalRoot || typeof window.enhanceUniversalPickers !== 'function') return;
        window.enhanceUniversalPickers(modalRoot);
    }

    function isStudentServiceInboxFilterEditorOpen() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || modalRoot.hasAttribute('hidden')) return false;
        return Boolean(modalRoot.querySelector('[data-student-service-inbox-filter-editor-modal="true"]'));
    }

    function mountStudentServiceInboxFilterEditorModal() {
        const modalRoot = ensureStudentServiceModalRoot();
        if (!modalRoot) return;
        studentServiceInboxFilterEditorDraft = buildStudentServiceInboxFilterEditorDraft();
        modalRoot.innerHTML = renderStudentServiceInboxFilterEditorModalShell();
        modalRoot.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        syncStudentServiceInboxFilterEditorPickers(modalRoot);
    }

    function openStudentServiceInboxFilterEditorModal() {
        if (!canCurrentUserModerateStudentService()) return;
        closeStudentServiceDeleteConfirm();
        closeStudentServiceQuestionComposerModal();
        mountStudentServiceInboxFilterEditorModal();
    }

    function closeStudentServiceInboxFilterEditorModal() {
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot || !isStudentServiceInboxFilterEditorOpen()) return;
        modalRoot.innerHTML = '';
        modalRoot.setAttribute('hidden', '');
        if (studentServiceShouldRestoreBodyScroll()) {
            document.body.style.overflow = '';
        }
        studentServiceInboxFilterEditorDraft = null;
    }

    function remountStudentServiceInboxFilterEditorModal() {
        if (!isStudentServiceInboxFilterEditorOpen()) return;
        const modalRoot = ensureStudentServiceModalRoot();
        if (!modalRoot) return;
        modalRoot.innerHTML = renderStudentServiceInboxFilterEditorModalShell();
        modalRoot.removeAttribute('hidden');
        syncStudentServiceInboxFilterEditorPickers(modalRoot);
    }

    function syncStudentServiceInboxFilterEditorDraftFromDom() {
        if (!studentServiceInboxFilterEditorDraft) return;
        const modalRoot = document.getElementById('student-service-modal-root');
        if (!modalRoot) return;
        const filters = Array.isArray(studentServiceInboxFilterEditorDraft.filters)
            ? studentServiceInboxFilterEditorDraft.filters.map(filter => ({ ...filter, options: Array.isArray(filter.options) ? filter.options.map(option => ({ ...option })) : [] }))
            : [];
        modalRoot.querySelectorAll('[data-student-service-inbox-filter-editor-field]').forEach((node) => {
            const index = Number(node.dataset.studentServiceInboxFilterEditorFilterIndex);
            const field = node.dataset.studentServiceInboxFilterEditorField || '';
            if (!Number.isInteger(index) || index < 0 || index >= filters.length || !field) return;
            if (node.type === 'checkbox') filters[index][field] = node.checked;
            else filters[index][field] = node.value;
        });
        const optionLabelsByFilter = new Map();
        modalRoot.querySelectorAll('[data-student-service-inbox-filter-editor-option-label]').forEach((node) => {
            const filterIndex = Number(node.dataset.studentServiceInboxFilterEditorFilterIndex);
            if (!Number.isInteger(filterIndex) || filterIndex < 0 || filterIndex >= filters.length) return;
            if (!optionLabelsByFilter.has(filterIndex)) optionLabelsByFilter.set(filterIndex, []);
            optionLabelsByFilter.get(filterIndex).push(String(node.value || ''));
        });
        filters.forEach((filter, filterIndex) => {
            if (!String(filter.id || '').startsWith('custom_')) return;
            filter.options = optionLabelsByFilter.has(filterIndex)
                ? optionLabelsByFilter.get(filterIndex).map(label => ({ label, value: deriveStudentServiceInboxFilterOptionValue(label) }))
                : filter.options;
            normalizeCustomInboxFilterOptions(filter);
        });
        studentServiceInboxFilterEditorDraft = { version: 1, filters };
    }

    function moveStudentServiceInboxFilterEditorRow(index, direction) {
        syncStudentServiceInboxFilterEditorDraftFromDom();
        const filters = studentServiceInboxFilterEditorDraft?.filters;
        if (!Array.isArray(filters)) return;
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (index < 0 || index >= filters.length || nextIndex < 0 || nextIndex >= filters.length) return;
        const [row] = filters.splice(index, 1);
        filters.splice(nextIndex, 0, row);
        remountStudentServiceInboxFilterEditorModal();
    }

    function addStudentServiceInboxFilterEditorCustomFilter() {
        syncStudentServiceInboxFilterEditorDraftFromDom();
        if (!studentServiceInboxFilterEditorDraft) studentServiceInboxFilterEditorDraft = buildStudentServiceInboxFilterEditorDraft();
        const suffix = Date.now().toString(36);
        studentServiceInboxFilterEditorDraft.filters.push({
            id: `custom_${suffix}`,
            type: 'select',
            label: 'Custom filter',
            tier: 'advanced',
            enabled: true,
            field: 'status',
            options: [
                { value: 'Open', label: 'Open' }
            ]
        });
        remountStudentServiceInboxFilterEditorModal();
    }

    function addStudentServiceInboxFilterEditorOption(filterIndex) {
        syncStudentServiceInboxFilterEditorDraftFromDom();
        const filter = studentServiceInboxFilterEditorDraft?.filters?.[filterIndex];
        if (!filter) return;
        const editable = getStudentServiceEditableCustomFilterOptions(filter.options);
        editable.push({ value: 'New option', label: 'New option' });
        filter.options = editable;
        remountStudentServiceInboxFilterEditorModal();
    }

    function removeStudentServiceInboxFilterEditorOption(filterIndex, optionIndex) {
        syncStudentServiceInboxFilterEditorDraftFromDom();
        const filter = studentServiceInboxFilterEditorDraft?.filters?.[filterIndex];
        if (!filter) return;
        const editable = getStudentServiceEditableCustomFilterOptions(filter.options);
        if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= editable.length) return;
        if (editable.length <= 1) return;
        editable.splice(optionIndex, 1);
        filter.options = editable;
        remountStudentServiceInboxFilterEditorModal();
    }

    function removeStudentServiceInboxFilterEditorFilter(filterIndex) {
        syncStudentServiceInboxFilterEditorDraftFromDom();
        const filters = studentServiceInboxFilterEditorDraft?.filters;
        const filter = filters?.[filterIndex];
        if (!filter || filter.type !== 'select' || !Array.isArray(filters)) return;
        filters.splice(filterIndex, 1);
        remountStudentServiceInboxFilterEditorModal();
    }

    async function saveStudentServicePersonalInboxFilterLayoutFromEditor() {
        syncStudentServiceInboxFilterEditorDraftFromDom();
        const layout = finalizeStudentServiceInboxFilterLayout(studentServiceInboxFilterEditorDraft);
        if (!layout) {
            alert('Inbox filter layout is invalid.');
            return;
        }
        writeStudentServicePersonalInboxFilterLayout(layout);
        publishStudentServiceInboxFilterLayout(layout);
        pruneStudentServiceCustomTicketFilters(layout);
        if (canCurrentUserModerateStudentService()) {
            try {
                await persistStudentServiceSharedInboxFilterLayout(layout);
            } catch (error) {
                alert(`Saved for you, but the team layout could not be updated. Students may not see these filters until you retry.\n\n${formatStudentServiceApiError(error, studentServiceApiPath(STUDENT_SERVICE_API_PATHS.inboxFilterLayout()))}`);
            }
        }
        closeStudentServiceInboxFilterEditorModal();
        renderStudentServicePage();
    }

    async function saveStudentServiceSharedInboxFilterLayoutFromEditor() {
        if (!canCurrentUserModerateStudentService()) return;
        syncStudentServiceInboxFilterEditorDraftFromDom();
        const layout = finalizeStudentServiceInboxFilterLayout(studentServiceInboxFilterEditorDraft);
        if (!layout) {
            alert('Inbox filter layout is invalid.');
            return;
        }
        try {
            await persistStudentServiceSharedInboxFilterLayout(layout);
            KIU_STATE.studentServiceInboxFilterLayout = layout;
            publishStudentServiceInboxFilterLayout(layout);
            pruneStudentServiceCustomTicketFilters(layout);
            closeStudentServiceInboxFilterEditorModal();
            renderStudentServicePage();
        } catch (error) {
            alert(formatStudentServiceApiError(error, studentServiceApiPath(STUDENT_SERVICE_API_PATHS.inboxFilterLayout())));
        }
    }

    function resetStudentServicePersonalInboxFilterLayoutFromEditor() {
        clearStudentServicePersonalInboxFilterLayout();
        studentServiceInboxFilterEditorDraft = buildStudentServiceInboxFilterEditorDraft(
            getStudentServiceSharedInboxFilterLayout() || buildStudentServiceMinimalInboxFilterLayout()
        );
        remountStudentServiceInboxFilterEditorModal();
    }

    function buildStudentServiceStudentInboxFilterLayout() {
        return {
            version: 1,
            filters: [{
                id: 'ticketSearch',
                type: 'search',
                label: 'Search',
                tier: 'basic',
                enabled: true,
                placeholder: 'Search conversations by title or topic'
            }]
        };
    }

    function renderStudentServiceStudentInboxFiltersMarkup(ui, visibleTickets, currentUser) {
        const layout = buildStudentServiceStudentInboxFilterLayout();
        const searchFilter = layout.filters.find(filter => filter.enabled && filter.type === 'search');
        if (!searchFilter) return '';
        return `
            <div class="student-service-student-inbox-search">
                ${renderStudentServiceInboxFilterControlMarkup(searchFilter, ui, visibleTickets, currentUser)}
            </div>
        `;
    }

    window.getStudentServiceDefaultSearchFilter = getStudentServiceDefaultSearchFilter;
    window.buildStudentServiceMinimalInboxFilterLayout = buildStudentServiceMinimalInboxFilterLayout;
    window.isStudentServiceCustomInboxFilter = isStudentServiceCustomInboxFilter;
    window.buildStudentServiceDefaultInboxFilterLayout = buildStudentServiceDefaultInboxFilterLayout;
    window.normalizeStudentServiceInboxFilterOption = normalizeStudentServiceInboxFilterOption;
    window.deriveStudentServiceInboxFilterOptionValue = deriveStudentServiceInboxFilterOptionValue;
    window.getStudentServiceEditableCustomFilterOptions = getStudentServiceEditableCustomFilterOptions;
    window.getStudentServiceCustomInboxFilterDefaultValue = getStudentServiceCustomInboxFilterDefaultValue;
    window.normalizeCustomInboxFilterOptions = normalizeCustomInboxFilterOptions;
    window.normalizeStudentServiceInboxFilterEditorDraftFilters = normalizeStudentServiceInboxFilterEditorDraftFilters;
    window.normalizeStudentServiceInboxFilterEntry = normalizeStudentServiceInboxFilterEntry;
    window.normalizeStudentServiceInboxFilterLayout = normalizeStudentServiceInboxFilterLayout;
    window.ensureStudentServiceInboxFilterLayoutHasSearch = ensureStudentServiceInboxFilterLayoutHasSearch;
    window.finalizeStudentServiceInboxFilterLayout = finalizeStudentServiceInboxFilterLayout;
    window.studentServiceInboxFilterLayoutHasDropdowns = studentServiceInboxFilterLayoutHasDropdowns;
    window.studentServiceInboxFilterLayoutFingerprint = studentServiceInboxFilterLayoutFingerprint;
    window.persistStudentServiceSharedInboxFilterLayout = persistStudentServiceSharedInboxFilterLayout;
    window.maybeSyncStudentServicePersonalInboxFilterLayoutToTeam = maybeSyncStudentServicePersonalInboxFilterLayoutToTeam;
    window.readStudentServiceInboxFilterPrefs = readStudentServiceInboxFilterPrefs;
    window.readStudentServicePersonalInboxFilterLayout = readStudentServicePersonalInboxFilterLayout;
    window.writeStudentServicePersonalInboxFilterLayout = writeStudentServicePersonalInboxFilterLayout;
    window.clearStudentServicePersonalInboxFilterLayout = clearStudentServicePersonalInboxFilterLayout;
    window.getStudentServiceSharedInboxFilterLayout = getStudentServiceSharedInboxFilterLayout;
    window.getStudentServicePublicInboxFilterLayout = getStudentServicePublicInboxFilterLayout;
    window.publishStudentServiceInboxFilterLayout = publishStudentServiceInboxFilterLayout;
    window.pruneStudentServiceCustomTicketFilters = pruneStudentServiceCustomTicketFilters;
    window.getStudentServicePublishedInboxFilterLayout = getStudentServicePublishedInboxFilterLayout;
    window.publishStudentServiceInboxFilterLayoutFromEffective = publishStudentServiceInboxFilterLayoutFromEffective;
    window.getStudentServiceEffectiveInboxFilterLayout = getStudentServiceEffectiveInboxFilterLayout;
    window.resolveStudentServiceInboxFilterLayout = resolveStudentServiceInboxFilterLayout;
    window.getStudentServiceInboxFilterValue = getStudentServiceInboxFilterValue;
    window.setStudentServiceInboxFilterValue = setStudentServiceInboxFilterValue;
    window.getStudentServiceInboxFilterOptions = getStudentServiceInboxFilterOptions;
    window.ticketMatchesStudentServiceInboxFilter = ticketMatchesStudentServiceInboxFilter;
    window.renderStudentServiceInboxFilterControlMarkup = renderStudentServiceInboxFilterControlMarkup;
    window.renderStudentServiceInboxDropdownFiltersMarkup = renderStudentServiceInboxDropdownFiltersMarkup;
    window.renderStudentServiceInboxFiltersMarkup = renderStudentServiceInboxFiltersMarkup;
    window.buildStudentServiceTicketIntakeFromInboxFilters = buildStudentServiceTicketIntakeFromInboxFilters;
    window.cloneStudentServiceInboxFilterLayout = cloneStudentServiceInboxFilterLayout;
    window.buildStudentServiceInboxFilterEditorDraft = buildStudentServiceInboxFilterEditorDraft;
    window.renderStudentServiceInboxFilterEditorRowMarkup = renderStudentServiceInboxFilterEditorRowMarkup;
    window.renderStudentServiceInboxFilterEditorModalShell = renderStudentServiceInboxFilterEditorModalShell;
    window.syncStudentServiceInboxFilterEditorPickers = syncStudentServiceInboxFilterEditorPickers;
    window.isStudentServiceInboxFilterEditorOpen = isStudentServiceInboxFilterEditorOpen;
    window.mountStudentServiceInboxFilterEditorModal = mountStudentServiceInboxFilterEditorModal;
    window.openStudentServiceInboxFilterEditorModal = openStudentServiceInboxFilterEditorModal;
    window.closeStudentServiceInboxFilterEditorModal = closeStudentServiceInboxFilterEditorModal;
    window.remountStudentServiceInboxFilterEditorModal = remountStudentServiceInboxFilterEditorModal;
    window.syncStudentServiceInboxFilterEditorDraftFromDom = syncStudentServiceInboxFilterEditorDraftFromDom;
    window.moveStudentServiceInboxFilterEditorRow = moveStudentServiceInboxFilterEditorRow;
    window.addStudentServiceInboxFilterEditorCustomFilter = addStudentServiceInboxFilterEditorCustomFilter;
    window.addStudentServiceInboxFilterEditorOption = addStudentServiceInboxFilterEditorOption;
    window.removeStudentServiceInboxFilterEditorOption = removeStudentServiceInboxFilterEditorOption;
    window.removeStudentServiceInboxFilterEditorFilter = removeStudentServiceInboxFilterEditorFilter;
    window.saveStudentServicePersonalInboxFilterLayoutFromEditor = saveStudentServicePersonalInboxFilterLayoutFromEditor;
    window.saveStudentServiceSharedInboxFilterLayoutFromEditor = saveStudentServiceSharedInboxFilterLayoutFromEditor;
    window.resetStudentServicePersonalInboxFilterLayoutFromEditor = resetStudentServicePersonalInboxFilterLayoutFromEditor;
    window.buildStudentServiceStudentInboxFilterLayout = buildStudentServiceStudentInboxFilterLayout;
    window.renderStudentServiceStudentInboxFiltersMarkup = renderStudentServiceStudentInboxFiltersMarkup;
})();
