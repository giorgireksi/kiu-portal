/* READABILITY: orders workspace runtime: order state, filters, and administration helpers. Sections: Purpose | Boundaries | Exports.
--- READABILITY: Purpose ---
Owns the route-facing responsibilities named above.
--- READABILITY: Boundaries ---
Delegates peeled domain behavior through explicit runtime APIs.
--- READABILITY: Exports ---
Publishes only the host/runtime contract consumed by its loader.
*/
/* Orders workspace logic. Shared primitives live in orders-runtime-core.js. */

function ensureAdminOrdersUiState(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!adminOrdersUiByFaculty[normalizedFaculty]) {
        adminOrdersUiByFaculty[normalizedFaculty] = {
            search: '',
            roleFilter: 'all',
            audienceRole: USER_ROLES.STUDENT,
            recipientFilterEditorRole: USER_ROLES.STUDENT,
            selectedRecipientIds: [],
            selectedOrderId: null,
            sentFilters: {
                search: '',
                readStatus: 'all',
                layoutFilters: {},
                dateFrom: '',
                dateTo: ''
            },
            draft: {
                title: '',
                type: 'General Order',
                effectiveDate: new Date().toISOString().slice(0, 10),
                description: ''
            }
        };
    }
    const state = adminOrdersUiByFaculty[normalizedFaculty];
    if (!state.audienceRole) {
        state.audienceRole = USER_ROLES.STUDENT;
    }
    state.audienceRole = normalizeOrdersRecipientFilterRole(state.audienceRole);
    if (!state.sentFilters || typeof state.sentFilters !== 'object') {
        state.sentFilters = {
            search: '',
            readStatus: 'all',
            layoutFilters: {},
            dateFrom: '',
            dateTo: ''
        };
    }
    if (!state.sentFilters.layoutFilters || typeof state.sentFilters.layoutFilters !== 'object') {
        state.sentFilters.layoutFilters = {};
    }
    if (!state.sentFilters.readStatus) state.sentFilters.readStatus = 'all';
    if (!state.recipientFilterEditorRole) {
        state.recipientFilterEditorRole = state.audienceRole;
    }
    return state;
}

function getOrderRoleShortLabel(role) {
    if (role === USER_ROLES.STUDENT) return 'Students';
    if (role === USER_ROLES.PROFESSOR) return 'Professors';
    if (role === USER_ROLES.TA) return 'TAs';
    if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
    if (role === USER_ROLES.ADMIN) return 'Admins';
    return 'Users';
}

let ADMIN_ORDERS_RECIPIENT_ROLE_FILTERS;

function getAdminOrdersRecipientRoleFilters() {
    if (!ADMIN_ORDERS_RECIPIENT_ROLE_FILTERS) {
        ADMIN_ORDERS_RECIPIENT_ROLE_FILTERS = Object.freeze([
            'all',
            USER_ROLES.STUDENT,
            USER_ROLES.PROFESSOR,
            USER_ROLES.TA,
            USER_ROLES.STUDENT_SERVICE,
            USER_ROLES.ADMIN
        ]);
    }
    return ADMIN_ORDERS_RECIPIENT_ROLE_FILTERS;
}

function buildOrderRecipientSnapshot(user) {
    return {
        id: user.id,
        name: user.nameEn || user.name || user.email || user.id,
        role: user.role,
        email: user.email || '',
        facultyCode: user.facultyCode || user.faculty || '',
        facultyName: user.facultyName || getFacultyLabel(user.facultyCode || user.faculty || ''),
        semester: user.semester || null
    };
}

function getFacultyScopedPortalUsers(role, faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const normalizedRole = String(role || '').trim().toLowerCase();
    if (!normalizedRole) return [];

    let domainUsers = [];
    try {
        if (typeof getDomain === 'function') {
            domainUsers = getDomain()?.usersByRole?.[normalizedRole] || [];
        }
    } catch (error) {
        domainUsers = [];
    }
    const stateUsers = Array.isArray(KIU_STATE?.users)
        ? KIU_STATE.users.filter(user => String(user?.role || '').trim().toLowerCase() === normalizedRole)
        : [];
    const merged = mergeUniqueById([...domainUsers, ...stateUsers]);

    return merged.filter((user) => {
        const userFaculty = normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '');
        if (normalizedRole === USER_ROLES.ADMIN && !userFaculty) return true;
        return userFaculty === normalizedFaculty;
    }).map(user => ({
        ...user,
        role: normalizedRole,
        facultyCode: normalizeFacultyCode(user?.facultyCode || user?.faculty || '', '') || normalizedFaculty,
        facultyName: user.facultyName || getFacultyLabel(normalizedFaculty)
    }));
}

function getTargetableOrderUsers(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const students = getAllStudents(normalizedFaculty).map(student => ({
        ...student,
        role: USER_ROLES.STUDENT,
        facultyCode: normalizedFaculty
    }));
    const professors = getAllStaff('professors', normalizedFaculty).map(member => ({
        ...member,
        role: USER_ROLES.PROFESSOR,
        facultyCode: normalizedFaculty
    }));
    const tas = getAllStaff('tas', normalizedFaculty).map(member => ({
        ...member,
        role: USER_ROLES.TA,
        facultyCode: normalizedFaculty
    }));
    const serviceStaff = getFacultyScopedPortalUsers(USER_ROLES.STUDENT_SERVICE, normalizedFaculty);
    const admins = getFacultyScopedPortalUsers(USER_ROLES.ADMIN, normalizedFaculty);

    return mergeUniqueById([
        ...students,
        ...professors,
        ...tas,
        ...serviceStaff,
        ...admins
    ]).sort((a, b) => {
        const roleRank = {
            [USER_ROLES.STUDENT]: 1,
            [USER_ROLES.PROFESSOR]: 2,
            [USER_ROLES.TA]: 3,
            [USER_ROLES.STUDENT_SERVICE]: 4,
            [USER_ROLES.ADMIN]: 5
        };
        const rankDiff = (roleRank[a.role] || 9) - (roleRank[b.role] || 9);
        if (rankDiff !== 0) return rankDiff;
        return (a.nameEn || a.name || '').localeCompare(b.nameEn || b.name || '');
    });
}

function getFilteredAdminOrderRecipients(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    const uiState = ensureAdminOrdersUiState(normalizedFaculty);
    const query = String(uiState.search || '').trim().toLowerCase();
    const roleFilter = uiState.roleFilter || 'all';

    return getTargetableOrderUsers(normalizedFaculty).filter(user => {
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        if (!matchesRole) return false;
        if (!query) return true;
        const haystack = [
            user.id,
            user.nameEn,
            user.name,
            user.email,
            getOrderRoleLabel(user.role),
            user.facultyName,
            user.facultyCode
        ].join(' ').toLowerCase();
        return haystack.includes(query);
    });
}

const ADMIN_ORDER_COMPOSE_TYPES = Object.freeze([
    'General Order',
    'Registration Order',
    'Academic Order',
    'Financial Order',
    'Scholarship Order',
    'HR Order'
]);


function getAdminSentOrders(faculty = getCurrentFaculty()) {
    const bucket = getOrdersBucketForFaculty(faculty);
    return [...(bucket.items || [])].sort((a, b) => String(b.createdAt || b.createdDate || '').localeCompare(String(a.createdAt || a.createdDate || '')));
}

function getAdminSentOrderKind(order) {
    const haystack = `${order?.type || ''} ${order?.title || ''}`;
    return /announcement|notice/i.test(haystack) ? 'announcement' : 'order';
}

function orderIncludesAudienceRole(order, role) {
    const normalizedRole = normalizeOrdersRecipientFilterRole(role);
    return (order?.recipientSnapshots || []).some((item) => String(item?.role || '').toLowerCase() === normalizedRole);
}

function countAdminAudienceNotifications(faculty = getCurrentFaculty(), role = USER_ROLES.STUDENT) {
    return 0;
}

function getAdminAudienceRole(faculty = getCurrentFaculty()) {
    return normalizeOrdersRecipientFilterRole(ensureAdminOrdersUiState(faculty).audienceRole || USER_ROLES.STUDENT);
}

function setAdminAudienceRole(role, faculty = getCurrentFaculty()) {
    const uiState = ensureAdminOrdersUiState(faculty);
    uiState.audienceRole = normalizeOrdersRecipientFilterRole(role);
    uiState.recipientFilterEditorRole = uiState.audienceRole;
    return uiState.audienceRole;
}

function getFilteredAdminSentOrders(faculty = getCurrentFaculty()) {
    const uiState = ensureAdminOrdersUiState(faculty);
    const filters = uiState.sentFilters || {};
    const audienceRole = getAdminAudienceRole(faculty);
    const query = String(filters.search || '').trim().toLowerCase();
    const layoutFilters = filters.layoutFilters || {};
    const layout = getCachedOrdersRecipientFilterLayout(faculty, audienceRole);
    const enabledSelects = getEnabledOrdersRecipientLayoutSelects(layout);

    return getAdminSentOrders(faculty).filter((order) => {
        if (!orderIncludesAudienceRole(order, audienceRole)) return false;
        for (const filter of enabledSelects) {
            const selected = layoutFilters[filter.field] || 'all';
            if (!selected || selected === 'all') continue;
            if (filter.field === 'type' && String(order.type || '') !== selected) return false;
            if (filter.field === 'status' && String(order.status || 'Active') !== selected) return false;
            if (filter.field === 'kind' && getAdminSentOrderKind(order) !== selected) return false;
        }
        if (!matchesOrdersLayoutDateRange(order, filters.dateFrom, filters.dateTo)) return false;
        if (!query) return true;
        const haystack = [
            order.id,
            order.title,
            order.type,
            order.description,
            order.status,
            order.createdDate,
            order.effectiveDate,
            order.createdByName
        ].join(' ').toLowerCase();
        return haystack.includes(query);
    });
}

function setAdminOrdersSentFilter(field, value) {
    const uiState = ensureAdminOrdersUiState();
    if (!uiState.sentFilters) uiState.sentFilters = {};
    if (field === 'layoutFilters' && value && typeof value === 'object') {
        uiState.sentFilters.layoutFilters = value;
    } else {
        uiState.sentFilters[field] = value ?? '';
    }
    syncAdminOrdersSentInboxChange();
}

function setAdminOrdersSentLayoutFilter(field, value) {
    const uiState = ensureAdminOrdersUiState();
    if (!uiState.sentFilters.layoutFilters) uiState.sentFilters.layoutFilters = {};
    uiState.sentFilters.layoutFilters[field] = value || 'all';
    syncAdminOrdersSentInboxChange();
}

function syncAdminOrdersSentInboxChange() {
    const faculty = getCurrentFaculty();
    const facultyLabel = getFacultyLabel(faculty);
    const uiState = ensureAdminOrdersUiState(faculty);
    const allOrders = getAdminSentOrders(faculty);
    const filteredOrders = getFilteredAdminSentOrders(faculty);
    const filterPanel = document.getElementById('admin-orders-table-panel');
    const inboxPanel = document.getElementById('admin-orders-detail-panel');
    if (filterPanel) {
        setOrdersRegionMarkup(filterPanel, 'admin-filter', renderAdminOrdersFilterPanel(uiState, facultyLabel, filteredOrders.length, allOrders.length));
    }
    if (inboxPanel) {
        renderAdminOrdersSentInboxPanel(inboxPanel, filteredOrders, uiState.selectedOrderId);
    }
}

let ordersRecipientFilterEditorDraft = null;

function getAdminOrdersRecipientFilterEditorRole(faculty = getCurrentFaculty()) {
    return normalizeOrdersRecipientFilterRole(
        ensureAdminOrdersUiState(faculty).recipientFilterEditorRole || USER_ROLES.STUDENT
    );
}

function setAdminOrdersRecipientFilterEditorRole(role, faculty = getCurrentFaculty()) {
    ensureAdminOrdersUiState(faculty).recipientFilterEditorRole = normalizeOrdersRecipientFilterRole(role);
    return ensureAdminOrdersUiState(faculty).recipientFilterEditorRole;
}

function getOrdersRecipientFilterEditorRoleLabel(role) {
    if (role === USER_ROLES.PROFESSOR) return 'Professors';
    if (role === USER_ROLES.TA) return 'Teaching Assistants';
    if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
    return 'Students';
}

function buildOrdersRecipientFilterEditorDraft(faculty = getCurrentFaculty(), recipientRole = getAdminOrdersRecipientFilterEditorRole(faculty)) {
    const role = normalizeOrdersRecipientFilterRole(recipientRole);
    const layout = getCachedOrdersRecipientFilterLayout(faculty, role);
    return {
        facultyCode: normalizeFacultyCode(faculty || 'ECON', 'ECON'),
        recipientRole: role,
        connectedRoles: getCachedOrdersFilterConnectedRoles(faculty, role),
        filters: (layout.filters || []).map((filter) => ({
            ...filter,
            options: (filter.options || []).map((option) => ({ ...option }))
        }))
    };
}

function isOrdersRecipientFilterEditorOpen() {
    const overlay = document.getElementById('admin-orders-recipient-filter-overlay');
    return Boolean(overlay?.classList.contains('active'));
}

function closeOrdersRecipientFilterEditor() {
    const overlay = document.getElementById('admin-orders-recipient-filter-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    ordersRecipientFilterEditorDraft = null;
}

function renderOrdersRecipientFilterEditorRowMarkup(filter, index, total) {
    const fieldOptions = ORDERS_RECIPIENT_FILTER_FIELDS.map((field) => {
        const selected = filter.field === field ? ' selected' : '';
        return `<option value="${escapeHtml(field)}"${selected}>${escapeHtml(ORDERS_RECIPIENT_FILTER_FIELD_LABELS[field] || field)}</option>`;
    }).join('');
    const options = Array.isArray(filter.options) ? filter.options : [];
    const optionsMarkup = `
            <div class="orders-recipient-filter-editor-options">
                ${options.map((option, optionIndex) => `
                    <div class="orders-recipient-filter-editor-option lux-soft-chrome home-hover-chip">
                        <label class="lux-picker-field">
                            <span class="lux-picker-label">Option</span>
                            <input type="text" class="lux-control" value="${escapeHtml(option.label || option.value || '')}" data-orders-recipient-filter-option-label="1" data-orders-recipient-filter-index="${index}" data-orders-recipient-filter-option-index="${optionIndex}" placeholder="Option label">
                        </label>
                        <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-remove-option="${index}" data-orders-recipient-filter-option-index="${optionIndex}" aria-label="Remove option"><i class="fas fa-minus"></i></button>
                    </div>
                `).join('') || '<div class="lux-panel-copy">No options yet. Add at least one before saving.</div>'}
                <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-add-option="${index}"><i class="fas fa-plus"></i> Add option</button>
            </div>
        `;
    return `
        <article class="orders-recipient-filter-editor-row lux-soft-chrome home-hover-chip" data-orders-recipient-filter-index="${index}">
            <div class="orders-recipient-filter-editor-row-head">
                <label class="lux-picker-field">
                    <span class="lux-picker-label">Maps to</span>
                    <select class="lux-control" data-lux-picker-label="Maps to" data-orders-recipient-filter-field="field" data-orders-recipient-filter-index="${index}">${fieldOptions}</select>
                </label>
                <label class="lux-check-row">
                    <input type="checkbox" data-orders-recipient-filter-field="enabled" data-orders-recipient-filter-index="${index}"${filter.enabled !== false ? ' checked' : ''}>
                    <span>Enabled</span>
                </label>
                <div class="orders-recipient-filter-editor-row-actions">
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-move="up" data-orders-recipient-filter-index="${index}"${index === 0 ? ' disabled' : ''} aria-label="Move up"><i class="fas fa-arrow-up"></i></button>
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-move="down" data-orders-recipient-filter-index="${index}"${index >= total - 1 ? ' disabled' : ''} aria-label="Move down"><i class="fas fa-arrow-down"></i></button>
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-remove="${index}" aria-label="Remove filter"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <label class="lux-picker-field">
                <span class="lux-picker-label">Dropdown name</span>
                <input type="text" class="lux-control" value="${escapeHtml(filter.label || '')}" data-orders-recipient-filter-field="label" data-orders-recipient-filter-index="${index}">
            </label>
            ${optionsMarkup}
        </article>
    `;
}

function renderOrdersRecipientFilterEditorModalMarkup(draft) {
    const filters = Array.isArray(draft?.filters) ? draft.filters : [];
    const recipientRole = normalizeOrdersRecipientFilterRole(draft?.recipientRole || USER_ROLES.STUDENT);
    const recipientLabel = getOrdersRecipientFilterEditorRoleLabel(recipientRole);
    const connected = new Set(normalizeOrdersFilterConnectedRoles(draft?.connectedRoles, recipientRole));
    const connectionChecklist = `
        <div class="orders-recipient-filter-editor-connections">
            <div class="lux-panel-copy">Connected roles (share this layout on save):</div>
            <div class="lux-check-row-wrap orders-recipient-filter-editor-connection-list">
                ${ORDERS_RECIPIENT_FILTER_ROLES.map((role) => `
                    <label class="lux-check-row">
                        <input type="checkbox" data-orders-recipient-filter-connected-role="${escapeHtml(role)}"${connected.has(role) ? ' checked' : ''}${role === recipientRole ? ' disabled' : ''}>
                        <span>${escapeHtml(getOrdersRecipientFilterEditorRoleLabel(role))}</span>
                    </label>
                `).join('')}
            </div>
        </div>
    `;
    return `
        <div class="orders-recipient-filter-editor-modal modal-content lux-panel" data-lux-transparency-exempt="1" role="dialog" aria-modal="true" aria-labelledby="orders-recipient-filter-editor-title">
            <div class="orders-recipient-filter-editor-head modal-header">
                <div>
                    <div class="lux-card-title orders-admin-section-title" id="orders-recipient-filter-editor-title">Edit filters · ${escapeHtml(recipientLabel)}</div>
                    <div class="lux-panel-copy orders-admin-section-copy">Dropdowns for this role. Checklist which other roles share them. Search and From/To are always on.</div>
                </div>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-editor-close="1" aria-label="Close"><i class="fas fa-times"></i></button>
            </div>
            <div class="orders-recipient-filter-editor-body modal-body">
                ${connectionChecklist}
                <div class="orders-recipient-filter-editor-list">
                    ${filters.map((filter, index) => renderOrdersRecipientFilterEditorRowMarkup(filter, index, filters.length)).join('') || '<div class="lux-panel-copy">No dropdowns yet. This role still sees search and From/To date.</div>'}
                </div>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-add="1"><i class="fas fa-plus"></i> Add filter</button>
            </div>
            <div class="orders-recipient-filter-editor-actions modal-footer">
                <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-reset="1">Clear all</button>
                <div class="orders-recipient-filter-editor-actions-buttons">
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-editor-close="1">Cancel</button>
                    <button type="button" class="lux-primary-btn home-hover-chip" data-lux-skip-modern-button="true" data-orders-recipient-filter-save="1"><i class="fas fa-check"></i> Save for connected roles</button>
                </div>
            </div>
        </div>
    `;
}

function refreshOrdersRecipientFilterEditorModal() {
    const overlay = document.getElementById('admin-orders-recipient-filter-overlay');
    if (!overlay || !ordersRecipientFilterEditorDraft) return;
    overlay.innerHTML = renderOrdersRecipientFilterEditorModalMarkup(ordersRecipientFilterEditorDraft);
    window.enhanceUniversalPickers?.(overlay);
}

async function openOrdersRecipientFilterEditor() {
    ensureAdminOrdersModals();
    const faculty = getCurrentFaculty();
    const recipientRole = getAdminAudienceRole(faculty);
    setAdminOrdersRecipientFilterEditorRole(recipientRole, faculty);
    await fetchOrdersRecipientFilterLayout(faculty, recipientRole);
    ordersRecipientFilterEditorDraft = buildOrdersRecipientFilterEditorDraft(faculty, recipientRole);
    const overlay = document.getElementById('admin-orders-recipient-filter-overlay');
    if (!overlay) return;
    refreshOrdersRecipientFilterEditorModal();
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
}

function mutateOrdersRecipientFilterEditorDraft(mutator) {
    if (!ordersRecipientFilterEditorDraft) return;
    mutator(ordersRecipientFilterEditorDraft);
    refreshOrdersRecipientFilterEditorModal();
}

async function saveOrdersRecipientFilterEditorDraft() {
    if (!ordersRecipientFilterEditorDraft) return;
    const faculty = ordersRecipientFilterEditorDraft.facultyCode || getCurrentFaculty();
    const recipientRole = normalizeOrdersRecipientFilterRole(ordersRecipientFilterEditorDraft.recipientRole || USER_ROLES.STUDENT);
    const incomplete = (ordersRecipientFilterEditorDraft.filters || []).find((filter) => (
        filter.enabled !== false
        && !(filter.options || []).some((option) => String(option?.label || option?.value || '').trim())
    ));
    if (incomplete) {
        alert(`Add at least one option to "${incomplete.label || incomplete.field}" before saving.`);
        return;
    }
    const layout = normalizeOrdersRecipientFilterLayout({
        version: 1,
        filters: ordersRecipientFilterEditorDraft.filters || []
    });
    const connectedRoles = normalizeOrdersFilterConnectedRoles(
        ordersRecipientFilterEditorDraft.connectedRoles,
        recipientRole
    );
    try {
        await saveOrdersRecipientFilterLayout(layout, faculty, recipientRole, connectedRoles);
        closeOrdersRecipientFilterEditor();
        syncAdminOrdersSentInboxChange();
    } catch (error) {
        alert(error?.message || 'Could not save recipient filter layout.');
    }
}

async function switchOrdersRecipientFilterEditorRole(role) {
    const faculty = getCurrentFaculty();
    const recipientRole = setAdminOrdersRecipientFilterEditorRole(role, faculty);
    await fetchOrdersRecipientFilterLayout(faculty, recipientRole);
    ordersRecipientFilterEditorDraft = buildOrdersRecipientFilterEditorDraft(faculty, recipientRole);
    refreshOrdersRecipientFilterEditorModal();
}

function ensureAdminOrderThread(order) {
    // Orders are document-only; legacy thread arrays stay inert.
    if (!order) return [];
    if (!Array.isArray(order.thread)) order.thread = [];
    return order.thread;
}

function makeOrderId(faculty = getCurrentFaculty()) {
    const prefix = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    return `ORD-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function createAdminOrderRecord({ title, type, description, effectiveDate, recipientIds, facultyCode }) {
    const activeUser = getCurrentUser();
    const normalizedFaculty = normalizeFacultyCode(facultyCode || getCurrentFaculty() || 'ECON', 'ECON');
    const recipients = getTargetableOrderUsers(normalizedFaculty)
        .filter(user => recipientIds.includes(user.id))
        .map(buildOrderRecipientSnapshot);

    const order = {
        id: makeOrderId(normalizedFaculty),
        title: title.trim(),
        type: type || 'General Order',
        description: description.trim(),
        createdDate: new Date().toISOString().slice(0, 10),
        createdAt: new Date().toISOString(),
        effectiveDate: effectiveDate || new Date().toISOString().slice(0, 10),
        status: 'Active',
        facultyCode: normalizedFaculty,
        facultyName: getFacultyLabel(normalizedFaculty),
        createdById: activeUser?.id || 'admin',
        createdByName: activeUser?.nameEn || activeUser?.name || 'Administrator',
        recipientIds: recipients.map(item => item.id),
        recipientSnapshots: recipients,
        recipientCount: recipients.length,
        thread: []
    };

    const bucket = getOrdersBucketForFaculty(normalizedFaculty);
    bucket.items.unshift(order);
    return order;
}

function getAdminOrderById(orderId, faculty = getCurrentFaculty()) {
    const bucket = getOrdersBucketForFaculty(faculty);
    return (bucket.items || []).find(item => String(item.id) === String(orderId)) || null;
}

function setAdminOrdersRoleFilter(role) {
    const uiState = ensureAdminOrdersUiState();
    uiState.roleFilter = role || 'all';
    syncAdminOrdersRecipientFilterChange();
}

function updateAdminOrdersSearch(value) {
    const uiState = ensureAdminOrdersUiState();
    uiState.search = value || '';
    syncAdminOrdersRecipientFilterChange();
}

function toggleAdminOrderRecipient(userId) {
    const uiState = ensureAdminOrdersUiState();
    const key = String(userId);
    const selected = !(uiState.selectedRecipientIds || []).map(String).includes(key);
    setAdminOrderRecipientSelected(userId, selected);
}

function setAdminOrderRecipientSelected(userId, selected, changedInput = null) {
    const uiState = ensureAdminOrdersUiState();
    const key = String(userId);
    const ids = (uiState.selectedRecipientIds || []).map(String);
    if (selected) {
        if (!ids.includes(key)) {
            uiState.selectedRecipientIds = [...ids, key];
        }
    } else {
        uiState.selectedRecipientIds = ids.filter(id => id !== key);
    }
    syncAdminOrdersRecipientSelectionChange({ changedInput, syncAllRows: false });
}

function selectAllAdminOrderFilteredRecipients() {
    const uiState = ensureAdminOrdersUiState();
    const filteredIds = getFilteredAdminOrderRecipients().map(user => String(user.id));
    uiState.selectedRecipientIds = Array.from(new Set([...(uiState.selectedRecipientIds || []).map(String), ...filteredIds]));
    syncAdminOrdersRecipientSelectionChange({ syncAllRows: true });
}

function clearAdminOrderRecipients() {
    const uiState = ensureAdminOrdersUiState();
    uiState.selectedRecipientIds = [];
    syncAdminOrdersRecipientSelectionChange({ syncAllRows: true });
}

function updateAdminOrderDraftField(field, value) {
    const uiState = ensureAdminOrdersUiState();
    uiState.draft[field] = value;
}

const ADMIN_ORDER_TITLE_PRESETS_KEY = 'kiuAdminOrderTitlePresets';
const ADMIN_ORDER_TITLE_PRESETS_MAX = 50;
let adminOrderTitlePresetsDraft = null;

function getAdminOrderTitlePresetsUserId() {
    if (typeof getCurrentUserId === 'function') {
        const id = String(getCurrentUserId() || '').trim();
        if (id) return id;
    }
    return String(currentUser?.id || '').trim() || 'anonymous';
}

function normalizeAdminOrderTitlePreset(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeAdminOrderTitlePresetsList(list) {
    const seen = new Set();
    const out = [];
    (Array.isArray(list) ? list : []).forEach((entry) => {
        if (out.length >= ADMIN_ORDER_TITLE_PRESETS_MAX) return;
        const title = normalizeAdminOrderTitlePreset(entry);
        if (!title) return;
        const key = title.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        out.push(title);
    });
    return out;
}

function readAdminOrderTitlePresetsStore() {
    try {
        const raw = localStorage.getItem(ADMIN_ORDER_TITLE_PRESETS_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return parsed;
    } catch (error) {
        return {};
    }
}

function readAdminOrderTitlePresets(userId = getAdminOrderTitlePresetsUserId()) {
    const store = readAdminOrderTitlePresetsStore();
    return normalizeAdminOrderTitlePresetsList(store[userId]);
}

function writeAdminOrderTitlePresets(titles, userId = getAdminOrderTitlePresetsUserId()) {
    const store = readAdminOrderTitlePresetsStore();
    store[userId] = normalizeAdminOrderTitlePresetsList(titles);
    try {
        localStorage.setItem(ADMIN_ORDER_TITLE_PRESETS_KEY, JSON.stringify(store));
    } catch (error) {
        /* ignore quota errors */
    }
}

function isAdminOrdersTitlePresetsOpen() {
    const overlay = document.getElementById('admin-orders-titles-overlay');
    return Boolean(overlay?.classList.contains('active'));
}

function closeAdminOrdersTitlePresets() {
    const overlay = document.getElementById('admin-orders-titles-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
    adminOrderTitlePresetsDraft = null;
    syncAdminOrdersModalBodyLock();
}

function renderAdminOrdersTitlePresetRowMarkup(title, index) {
    return `
        <article class="admin-orders-titles-row lux-soft-chrome home-hover-chip" data-admin-orders-title-index="${index}">
            <input type="text" class="lux-control" value="${escapeHtml(title || '')}" data-admin-orders-title-edit="${index}" placeholder="Order title" aria-label="Saved title ${index + 1}">
            <div class="admin-orders-titles-row-actions">
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-title-apply="${index}" data-lux-skip-modern-button="true"><i class="fas fa-check"></i> Apply</button>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-title-remove="${index}" data-lux-skip-modern-button="true" aria-label="Remove title"><i class="fas fa-trash"></i></button>
            </div>
        </article>
    `;
}

function renderAdminOrdersTitlePresetsModalMarkup(draft) {
    const titles = Array.isArray(draft) ? draft : [];
    return `
        <div class="admin-orders-titles-modal modal-content lux-panel" data-lux-transparency-exempt="1" role="dialog" aria-modal="true" aria-labelledby="admin-orders-titles-title">
            <div class="admin-orders-titles-head modal-header">
                <div>
                    <div class="lux-card-title orders-admin-section-title" id="admin-orders-titles-title">Saved order titles</div>
                    <div class="lux-panel-copy orders-admin-section-copy">Reuse frequent titles when composing official orders. Apply fills the compose title field.</div>
                </div>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-titles-close="1" aria-label="Close" data-lux-skip-modern-button="true"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-orders-titles-body modal-body">
                <div class="admin-orders-titles-list">
                    ${titles.map((title, index) => renderAdminOrdersTitlePresetRowMarkup(title, index)).join('') || '<div class="lux-panel-copy">No saved titles yet. Add one below.</div>'}
                </div>
                <div class="admin-orders-titles-add-row">
                    <input type="text" class="lux-control" id="admin-orders-titles-add-input" placeholder="New order title" aria-label="New order title">
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-titles-add="1" data-lux-skip-modern-button="true"><i class="fas fa-plus"></i> Add</button>
                </div>
            </div>
            <div class="admin-orders-titles-foot modal-footer">
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-titles-close="1" data-lux-skip-modern-button="true">Cancel</button>
                <button type="button" class="lux-primary-btn home-hover-chip" data-admin-orders-titles-save="1" data-lux-skip-modern-button="true"><i class="fas fa-check"></i> Save</button>
            </div>
        </div>
    `;
}

function refreshAdminOrdersTitlePresetsModal() {
    const overlay = document.getElementById('admin-orders-titles-overlay');
    if (!overlay || !Array.isArray(adminOrderTitlePresetsDraft)) return;
    overlay.innerHTML = renderAdminOrdersTitlePresetsModalMarkup(adminOrderTitlePresetsDraft);
}

function openAdminOrdersTitlePresets() {
    ensureAdminOrdersModals();
    adminOrderTitlePresetsDraft = readAdminOrderTitlePresets().slice();
    const overlay = document.getElementById('admin-orders-titles-overlay');
    if (!overlay) return;
    refreshAdminOrdersTitlePresetsModal();
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    syncAdminOrdersModalBodyLock();
}

function applyAdminOrderTitlePreset(title) {
    const next = normalizeAdminOrderTitlePreset(title);
    if (!next) return;
    updateAdminOrderDraftField('title', next);
    const input = document.querySelector('[data-admin-order-draft-input="title"]');
    if (input) input.value = next;
    closeAdminOrdersTitlePresets();
}

function saveAdminOrdersTitlePresetsDraft() {
    if (!Array.isArray(adminOrderTitlePresetsDraft)) return;
    writeAdminOrderTitlePresets(adminOrderTitlePresetsDraft);
    closeAdminOrdersTitlePresets();
}

function mutateAdminOrdersTitlePresetsDraft(mutator) {
    if (!Array.isArray(adminOrderTitlePresetsDraft)) return;
    mutator(adminOrderTitlePresetsDraft);
    adminOrderTitlePresetsDraft = normalizeAdminOrderTitlePresetsList(adminOrderTitlePresetsDraft);
    refreshAdminOrdersTitlePresetsModal();
}

function selectAdminOrderRecord(orderId, options = {}) {
    const uiState = ensureAdminOrdersUiState();
    uiState.selectedOrderId = orderId || null;
    if (options.skipRender) return;
    if (options.openThread) {
        openAdminOrderThreadModal(orderId);
        return;
    }
    syncAdminOrdersSentInboxChange();
}

function isAdminOrdersThreadModalOpen() {
    const overlay = document.getElementById('admin-orders-thread-overlay');
    return Boolean(overlay?.classList.contains('active'));
}

function isAdminOrdersCreateModalOpen() {
    const overlay = document.getElementById('admin-orders-create-overlay');
    return Boolean(overlay?.classList.contains('active'));
}

function syncAdminOrdersModalBodyLock() {
    const createOpen = isAdminOrdersCreateModalOpen();
    const threadOpen = isAdminOrdersThreadModalOpen();
    const titlesOpen = isAdminOrdersTitlePresetsOpen();
    const studioOpen = Boolean(document.body.classList.contains('lux-studio-open') || document.getElementById('lux-studio-backdrop')?.classList.contains('is-open'));
    document.body.classList.toggle('admin-orders-modal-open', createOpen || threadOpen || titlesOpen || studioOpen);
}

function setAdminOrdersCreateModalOpen(isOpen) {
    const overlay = document.getElementById('admin-orders-create-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminOrdersModalBodyLock();
}

function renderAdminOrdersCreateModalContents() {
    ensureAdminOrdersModals();
    const faculty = getCurrentFaculty();
    const facultyLabel = getFacultyLabel(faculty);
    const uiState = ensureAdminOrdersUiState(faculty);
    const filteredRecipients = getFilteredAdminOrderRecipients(faculty);
    const selectedRecipientSet = new Set((uiState.selectedRecipientIds || []).map(String));
    const selectedRecipients = getTargetableOrderUsers(faculty).filter(user => selectedRecipientSet.has(String(user.id)));
    const roleCounts = selectedRecipients.reduce((acc, recipient) => {
        acc[recipient.role] = (acc[recipient.role] || 0) + 1;
        return acc;
    }, {});
    const today = new Date().toISOString().slice(0, 10);
    const recipientsPanel = document.getElementById('admin-orders-recipients-panel');
    const composePanel = document.getElementById('admin-orders-compose-panel');

    if (recipientsPanel) {
        renderAdminOrdersRecipientsPanelRegions(
            recipientsPanel,
            facultyLabel,
            uiState,
            filteredRecipients,
            selectedRecipientSet,
            selectedRecipients
        );
    }
    if (composePanel) {
        renderAdminOrdersComposePanelRegions(composePanel, uiState, roleCounts, today, selectedRecipients.length);
    }
}

function openAdminOrdersCreateModal() {
    renderAdminOrdersCreateModalContents();
    setAdminOrdersCreateModalOpen(true);
}

function closeAdminOrdersCreateModal(event) {
    if (event) {
        const overlay = document.getElementById('admin-orders-create-overlay');
        const isBackdrop = event.target === overlay;
        const isCloseControl = Boolean(event.target.closest?.('[data-admin-orders-close-create-modal]'));
        if (!isBackdrop && !isCloseControl) return;
    }
    setAdminOrdersCreateModalOpen(false);
}

function buildAdminOrdersRolePillsMarkup(roleCounts, selectedCount) {
    const studentCount = roleCounts[USER_ROLES.STUDENT] || 0;
    const professorCount = roleCounts[USER_ROLES.PROFESSOR] || 0;
    const taCount = roleCounts[USER_ROLES.TA] || 0;
    const serviceCount = roleCounts[USER_ROLES.STUDENT_SERVICE] || 0;
    const adminCount = roleCounts[USER_ROLES.ADMIN] || 0;
    return `
        <span class="lux-status-pill home-hover-chip is-info">${selectedCount} selected</span>
        <span class="lux-status-pill home-hover-chip is-info">${studentCount} students</span>
        <span class="lux-status-pill home-hover-chip is-success">${professorCount} professors</span>
        <span class="lux-status-pill home-hover-chip is-warning">${taCount} TAs</span>
        <span class="lux-status-pill home-hover-chip is-muted">${serviceCount} student service</span>
        <span class="lux-status-pill home-hover-chip is-muted">${adminCount} admins</span>
    `;
}

const ADMIN_ORDERS_ROLE_COUNT_PILL_DEFS = [
    { key: 'selected', className: 'lux-status-pill home-hover-chip is-info' },
    { key: 'student', className: 'lux-status-pill home-hover-chip is-info' },
    { key: 'professor', className: 'lux-status-pill home-hover-chip is-success' },
    { key: 'ta', className: 'lux-status-pill home-hover-chip is-warning' },
    { key: 'student_service', className: 'lux-status-pill home-hover-chip is-muted' },
    { key: 'admin', className: 'lux-status-pill home-hover-chip is-muted' }
];

function mountAdminOrdersRoleCountPills(container) {
    if (!container || container.querySelector('[data-admin-orders-count-pill]')) return;
    container.replaceChildren(...ADMIN_ORDERS_ROLE_COUNT_PILL_DEFS.map(({ key, className }) => {
        const pill = document.createElement('span');
        pill.className = className;
        pill.setAttribute('data-admin-orders-count-pill', key);
        pill.textContent = '0';
        return pill;
    }));
}

function syncAdminOrdersRoleCountPills(container, roleCounts, selectedCount) {
    if (!container) return;
    mountAdminOrdersRoleCountPills(container);
    const labels = {
        selected: `${selectedCount} selected`,
        student: `${roleCounts[USER_ROLES.STUDENT] || 0} students`,
        professor: `${roleCounts[USER_ROLES.PROFESSOR] || 0} professors`,
        ta: `${roleCounts[USER_ROLES.TA] || 0} TAs`,
        student_service: `${roleCounts[USER_ROLES.STUDENT_SERVICE] || 0} student service`,
        admin: `${roleCounts[USER_ROLES.ADMIN] || 0} admins`
    };
    Object.entries(labels).forEach(([key, text]) => {
        const pill = container.querySelector(`[data-admin-orders-count-pill="${key}"]`);
        if (pill) pill.textContent = text;
    });
}

function syncAdminOrdersComposePills(container, roleCounts, selectedCount) {
    syncAdminOrdersRoleCountPills(container, roleCounts, selectedCount);
}

function buildAdminOrdersRecipientRoleCounts(faculty, selectedRecipientSet) {
    const selectedRecipients = getTargetableOrderUsers(faculty).filter(user => selectedRecipientSet.has(String(user.id)));
    const roleCounts = selectedRecipients.reduce((acc, recipient) => {
        acc[recipient.role] = (acc[recipient.role] || 0) + 1;
        return acc;
    }, {});
    return {
        selectedRecipients,
        roleCounts,
        selectedCount: selectedRecipients.length
    };
}

function syncAdminOrdersCommandPills(container, roleCounts, selectedCount) {
    if (!container) return;
    const pills = container.querySelector('[data-admin-orders-command-pills]');
    if (!pills) return;
    let selected = pills.querySelector('[data-admin-orders-count-pill="selected"]');
    if (!selected) {
        pills.replaceChildren();
        selected = document.createElement('span');
        selected.className = 'lux-status-pill home-hover-chip is-info';
        selected.setAttribute('data-admin-orders-count-pill', 'selected');
        pills.appendChild(selected);
    }
    pills.querySelectorAll('[data-admin-orders-count-pill]').forEach((pill) => {
        if (pill.getAttribute('data-admin-orders-count-pill') !== 'selected') pill.remove();
    });
    selected.textContent = `${selectedCount} selected`;
}

function syncAdminOrdersRecipientFilterChange() {
    const faculty = getCurrentFaculty();
    const facultyLabel = getFacultyLabel(faculty);
    const uiState = ensureAdminOrdersUiState(faculty);
    const filteredRecipients = getFilteredAdminOrderRecipients(faculty);
    const selectedRecipientSet = new Set((uiState.selectedRecipientIds || []).map(String));
    const selectedRecipients = getTargetableOrderUsers(faculty).filter(user => selectedRecipientSet.has(String(user.id)));
    const recipientsPanel = document.getElementById('admin-orders-recipients-panel');
    if (recipientsPanel) {
        renderAdminOrdersRecipientsPanelRegions(
            recipientsPanel,
            facultyLabel,
            uiState,
            filteredRecipients,
            selectedRecipientSet,
            selectedRecipients
        );
    }
}

function syncAdminOrdersRecipientSelectionChange({ changedInput = null, syncAllRows = false } = {}) {
    const faculty = getCurrentFaculty();
    const selectedRecipientSet = new Set((ensureAdminOrdersUiState(faculty).selectedRecipientIds || []).map(String));
    const { roleCounts, selectedCount } = buildAdminOrdersRecipientRoleCounts(faculty, selectedRecipientSet);

    const recipientsPanel = document.getElementById('admin-orders-recipients-panel');
    if (recipientsPanel) {
        syncAdminOrdersRecipientCountPill(recipientsPanel, selectedCount);
        const scroll = recipientsPanel.querySelector('.orders-recipient-list-scroll');
        if (syncAllRows && scroll) {
            syncAdminOrdersRecipientSelection(scroll, selectedRecipientSet);
        } else if (changedInput) {
            const row = changedInput.closest('.orders-recipient-row');
            if (row) row.classList.toggle('is-selected', Boolean(changedInput.checked));
        }
    }

    const commandPanel = document.getElementById('admin-orders-root')?.querySelector('#admin-orders-command-panel');
    if (commandPanel) {
        syncAdminOrdersCommandPills(commandPanel, roleCounts, selectedCount);
    }

    syncAdminOrdersComposePills(document.getElementById('admin-orders-create-footer-summary'), roleCounts, selectedCount);
}

function renderAdminOrdersCommandCard(container, uiState, selectedRecipients, roleCounts) {
    if (!container) return;
    const selectedCount = selectedRecipients.length;
    const draftTitle = String(uiState.draft?.title || '').trim();
    const draftHint = draftTitle
        ? `Draft: ${draftTitle}`
        : 'No draft started yet';
    container.innerHTML = `
        <div class="orders-admin-command-layout">
            <div class="orders-admin-command-actions">
                <button class="lux-primary-btn orders-admin-command-cta home-hover-chip" type="button" data-admin-orders-open-create-modal="1">
                    <i class="fas fa-plus-circle"></i> Create Order
                </button>
            </div>
            <div class="orders-admin-command-copy">
                <div class="lux-pill-row orders-admin-command-pills" data-admin-orders-command-pills="1"></div>
                <div class="lux-panel-copy orders-admin-command-draft" data-admin-orders-command-draft="1">${escapeHtml(draftHint)}</div>
            </div>
        </div>
    `;
    syncAdminOrdersCommandPills(container, roleCounts, selectedCount);
}

function mountAdminOrdersComposePanelRegions(container, uiState, today) {
    if (!container || container.dataset.adminOrdersComposeMounted === '1') return;
    container.innerHTML = `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title orders-admin-section-title">Compose Order</div>
                <div class="lux-panel-copy orders-admin-section-copy">This order will appear in the selected users' Orders page.</div>
            </div>
        </div>
        <div class="orders-compose-head">
            <div class="orders-compose-title-field">
                <div class="orders-compose-title-toolbar">
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-manage-titles="1" data-lux-skip-modern-button="true" aria-label="Manage saved titles">
                        <i class="fas fa-bookmark"></i><span>Titles</span>
                    </button>
                </div>
                <input type="text" class="lux-control" value="${escapeHtml(uiState.draft.title || '')}" data-admin-order-draft-input="title" placeholder="Order title">
            </div>
            <select class="lux-control" id="admin-order-draft-type" data-lux-picker-label="Order type" data-admin-order-draft-change="type">
                ${['General Order', 'Registration Order', 'Academic Order', 'Financial Order', 'Scholarship Order', 'HR Order'].map((type) => '<option value="' + escapeHtml(type) + '" ' + ((uiState.draft.type || 'General Order') === type ? 'selected' : '') + '>' + escapeHtml(type) + '</option>').join('')}
            </select>
        </div>
        <div class="orders-compose-body">
            <input type="date" class="lux-control" value="${escapeHtml(uiState.draft.effectiveDate || today)}" data-admin-order-draft-change="effectiveDate">
            <textarea class="lux-control orders-compose-textarea" data-admin-order-draft-input="description" placeholder="Write the full order description that recipients should see.">${escapeHtml(uiState.draft.description || '')}</textarea>
        </div>
    `;
    container.dataset.adminOrdersComposeMounted = '1';
}

function renderAdminOrdersComposePanelRegions(container, uiState, roleCounts, today, selectedCount) {
    if (!container) return;
    mountAdminOrdersComposePanelRegions(container, uiState, today);
    syncAdminOrdersComposePills(document.getElementById('admin-orders-create-footer-summary'), roleCounts, selectedCount);
}

function sendAdminOrder() {
    const uiState = ensureAdminOrdersUiState();
    const title = String(uiState.draft.title || '').trim();
    const description = String(uiState.draft.description || '').trim();
    const effectiveDate = uiState.draft.effectiveDate || new Date().toISOString().slice(0, 10);
    const type = uiState.draft.type || 'General Order';
    const recipientIds = (uiState.selectedRecipientIds || []).map(String);

    if (!title) {
        alert('Please enter the order title.');
        return;
    }
    if (!description) {
        alert('Please write the order description.');
        return;
    }
    if (!recipientIds.length) {
        alert('Please select at least one recipient.');
        return;
    }

    const order = createAdminOrderRecord({
        title,
        type,
        description,
        effectiveDate,
        recipientIds,
        facultyCode: getCurrentFaculty()
    });
    const notificationType = /announcement|notice/i.test(`${type} ${title}`) ? 'admin-announcement' : 'official-order';
    order.recipientIds.forEach(recipientId => {
        createPortalSystemNotification({
            userId: recipientId,
            source: 'school',
            type: notificationType,
            title: notificationType === 'admin-announcement' ? 'New announcement' : 'New official order',
            text: `${order.title} is available in Orders${order.effectiveDate ? ` and takes effect on ${order.effectiveDate}` : ''}.`,
            routePage: 'orders',
            routeData: { orderId: order.id },
            duplicateWindowMs: 1000
        });
    });

    uiState.selectedRecipientIds = [];
    uiState.selectedOrderId = order.id;
    uiState.draft = {
        title: '',
        type: 'General Order',
        effectiveDate: new Date().toISOString().slice(0, 10),
        description: ''
    };

    const composePanel = document.getElementById('admin-orders-compose-panel');
    if (composePanel) {
        delete composePanel.dataset.adminOrdersComposeMounted;
        composePanel.innerHTML = '';
    }
    const recipientsPanel = document.getElementById('admin-orders-recipients-panel');
    if (recipientsPanel) {
        delete recipientsPanel.dataset.adminOrdersRecipientsMounted;
        delete recipientsPanel.dataset.adminOrdersRecipientsListSignature;
    }

    saveState();
    closeAdminOrdersCreateModal();
    renderAdminOrders();
    openAdminOrderThreadModal(order.id);
}

function deleteAdminOrder(orderId) {
    if (!orderId) return;
    if (!confirm('Delete this order for every recipient?')) return;
    const bucket = getOrdersBucketForFaculty();
    bucket.items = (bucket.items || []).filter(item => String(item.id) !== String(orderId));
    const uiState = ensureAdminOrdersUiState();
    if (uiState.selectedOrderId === orderId) {
        uiState.selectedOrderId = bucket.items[0]?.id || null;
    }
    if (isAdminOrdersThreadModalOpen()) {
        setAdminOrdersThreadModalOpen(false);
    }
    saveState();
    renderAdminOrders();
}

let ordersWorkspaceDelegatesBound = false;

function bindOrdersWorkspaceDelegates() {
    if (ordersWorkspaceDelegatesBound) return;
    ordersWorkspaceDelegatesBound = true;

    document.addEventListener('click', (event) => {
        const adminHome = event.target.closest('[data-admin-orders-nav-home]');
        if (adminHome) {
            navigate('home');
            return;
        }

        if (event.target.closest('[data-admin-orders-open-create-modal]')) {
            openAdminOrdersCreateModal();
            return;
        }

        if (event.target.closest('[data-admin-orders-manage-titles]')) {
            openAdminOrdersTitlePresets();
            return;
        }

        if (event.target.closest('[data-admin-orders-titles-close]')
            || event.target.id === 'admin-orders-titles-overlay') {
            if (event.target.id === 'admin-orders-titles-overlay'
                || event.target.closest('[data-admin-orders-titles-close]')) {
                closeAdminOrdersTitlePresets();
                return;
            }
        }

        if (event.target.closest('[data-admin-orders-titles-add]')) {
            const input = document.getElementById('admin-orders-titles-add-input');
            const next = normalizeAdminOrderTitlePreset(input?.value || '');
            if (!next) return;
            mutateAdminOrdersTitlePresetsDraft((draft) => {
                draft.push(next);
            });
            return;
        }

        if (event.target.closest('[data-admin-orders-titles-save]')) {
            saveAdminOrdersTitlePresetsDraft();
            return;
        }

        const applyTitle = event.target.closest('[data-admin-orders-title-apply]');
        if (applyTitle) {
            const index = Number(applyTitle.dataset.adminOrdersTitleApply);
            const title = Array.isArray(adminOrderTitlePresetsDraft)
                ? adminOrderTitlePresetsDraft[index]
                : '';
            applyAdminOrderTitlePreset(title);
            return;
        }

        const removeTitle = event.target.closest('[data-admin-orders-title-remove]');
        if (removeTitle) {
            const index = Number(removeTitle.dataset.adminOrdersTitleRemove);
            mutateAdminOrdersTitlePresetsDraft((draft) => {
                draft.splice(index, 1);
            });
            return;
        }

        const createModalClose = event.target.closest('[data-admin-orders-close-create-modal]');
        if (createModalClose) {
            closeAdminOrdersCreateModal(event);
            return;
        }

        if (event.target.id === 'admin-orders-create-overlay') {
            closeAdminOrdersCreateModal(event);
            return;
        }

        const adminRoleFilter = event.target.closest('[data-admin-orders-role-filter]');
        if (adminRoleFilter) {
            setAdminOrdersRoleFilter(adminRoleFilter.dataset.adminOrdersRoleFilter || 'all');
            return;
        }

        if (event.target.closest('[data-admin-orders-select-filtered]')) {
            selectAllAdminOrderFilteredRecipients();
            return;
        }

        if (event.target.closest('[data-admin-orders-clear-recipients]')) {
            clearAdminOrderRecipients();
            return;
        }

        if (event.target.closest('[data-admin-orders-send]')) {
            sendAdminOrder();
            return;
        }

        if (event.target.closest('[data-admin-orders-edit-recipient-filters]')) {
            openOrdersRecipientFilterEditor();
            return;
        }

        const audienceTab = event.target.closest('[data-admin-orders-audience-role]');
        if (audienceTab) {
            const nextRole = setAdminAudienceRole(audienceTab.dataset.adminOrdersAudienceRole || USER_ROLES.STUDENT);
            // Switch the visible audience and cached order list immediately. The
            // layout request only refreshes role-specific filter controls after
            // the fast local update has already settled.
            syncAdminOrdersSentInboxChange();
            fetchOrdersRecipientFilterLayout(getCurrentFaculty(), nextRole).finally(() => {
                syncAdminOrdersSentInboxChange();
            });
            return;
        }

        if (event.target.closest('[data-orders-recipient-filter-editor-close]')
            || event.target.id === 'admin-orders-recipient-filter-overlay') {
            if (event.target.id === 'admin-orders-recipient-filter-overlay'
                || event.target.closest('[data-orders-recipient-filter-editor-close]')) {
                closeOrdersRecipientFilterEditor();
                return;
            }
        }

        if (event.target.closest('[data-orders-recipient-filter-add]')) {
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                const used = new Set((draft.filters || []).map((filter) => filter.field));
                const nextField = ORDERS_RECIPIENT_FILTER_FIELDS.find((field) => !used.has(field));
                if (!nextField) return;
                draft.filters = [...(draft.filters || []), createOrdersRecipientFilterDraftEntry(nextField)];
            });
            return;
        }

        if (event.target.closest('[data-orders-recipient-filter-reset]')) {
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                draft.filters = [];
            });
            return;
        }

        if (event.target.closest('[data-orders-recipient-filter-save]')) {
            saveOrdersRecipientFilterEditorDraft();
            return;
        }

        const removeFilter = event.target.closest('[data-orders-recipient-filter-remove]');
        if (removeFilter) {
            const index = Number(removeFilter.dataset.ordersRecipientFilterRemove);
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                draft.filters = (draft.filters || []).filter((_, filterIndex) => filterIndex !== index);
            });
            return;
        }

        const moveFilter = event.target.closest('[data-orders-recipient-filter-move]');
        if (moveFilter) {
            const index = Number(moveFilter.dataset.ordersRecipientFilterIndex);
            const direction = moveFilter.dataset.ordersRecipientFilterMove;
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                const filters = [...(draft.filters || [])];
                const swapIndex = direction === 'up' ? index - 1 : index + 1;
                if (swapIndex < 0 || swapIndex >= filters.length) return;
                [filters[index], filters[swapIndex]] = [filters[swapIndex], filters[index]];
                draft.filters = filters;
            });
            return;
        }

        const addOption = event.target.closest('[data-orders-recipient-filter-add-option]');
        if (addOption) {
            const index = Number(addOption.dataset.ordersRecipientFilterAddOption);
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                const filter = draft.filters?.[index];
                if (!filter) return;
                filter.options = [...(filter.options || []), { value: `option_${Date.now().toString(36)}`, label: 'New option' }];
            });
            return;
        }

        const removeOption = event.target.closest('[data-orders-recipient-filter-remove-option]');
        if (removeOption) {
            const index = Number(removeOption.dataset.ordersRecipientFilterRemoveOption);
            const optionIndex = Number(removeOption.dataset.ordersRecipientFilterOptionIndex);
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                const filter = draft.filters?.[index];
                if (!filter) return;
                filter.options = (filter.options || []).filter((_, itemIndex) => itemIndex !== optionIndex);
            });
            return;
        }

        const adminOrderOpen = event.target.closest('[data-admin-order-open]');
        if (adminOrderOpen) {
            openAdminOrderThreadModal(adminOrderOpen.dataset.adminOrderOpen || '');
            return;
        }

        const adminOrderThreadClose = event.target.closest('[data-admin-orders-close-thread-modal]');
        if (adminOrderThreadClose || event.target.id === 'admin-orders-thread-overlay') {
            closeAdminOrderThreadModal(event);
            return;
        }

        const adminOrderView = event.target.closest('[data-admin-order-view]');
        if (adminOrderView) {
            openAdminOrderThreadModal(adminOrderView.dataset.adminOrderView || '');
            return;
        }

        const adminOrderDelete = event.target.closest('[data-admin-order-delete]');
        if (adminOrderDelete) {
            deleteAdminOrder(adminOrderDelete.dataset.adminOrderDelete || '');
            return;
        }

    });

    document.addEventListener('input', (event) => {
        if (event.target.matches('[data-admin-orders-search]')) {
            updateAdminOrdersSearch(event.target.value);
            return;
        }

        if (event.target.matches('[data-admin-orders-sent-search]')) {
            setAdminOrdersSentFilter('search', event.target.value);
            return;
        }

        if (event.target.matches('[data-admin-order-draft-input]')) {
            updateAdminOrderDraftField(event.target.dataset.adminOrderDraftInput || '', event.target.value);
            return;
        }

        if (event.target.matches('[data-admin-orders-title-edit]')) {
            if (!Array.isArray(adminOrderTitlePresetsDraft)) return;
            const index = Number(event.target.dataset.adminOrdersTitleEdit);
            if (!Number.isInteger(index) || index < 0 || index >= adminOrderTitlePresetsDraft.length) return;
            adminOrderTitlePresetsDraft[index] = event.target.value;
            return;
        }

        if (event.target.matches('[data-orders-recipient-filter-field="label"]')) {
            const index = Number(event.target.dataset.ordersRecipientFilterIndex);
            if (!ordersRecipientFilterEditorDraft?.filters?.[index]) return;
            ordersRecipientFilterEditorDraft.filters[index].label = event.target.value;
            return;
        }

        if (event.target.matches('[data-orders-recipient-filter-option-label]')) {
            const index = Number(event.target.dataset.ordersRecipientFilterIndex);
            const optionIndex = Number(event.target.dataset.ordersRecipientFilterOptionIndex);
            const option = ordersRecipientFilterEditorDraft?.filters?.[index]?.options?.[optionIndex];
            if (!option) return;
            const nextLabel = event.target.value;
            option.label = nextLabel;
            option.value = nextLabel.trim() || option.value;
            return;
        }

    });

    document.addEventListener('change', (event) => {
        if (event.target.matches('[data-admin-order-recipient-toggle]')) {
            setAdminOrderRecipientSelected(
                event.target.dataset.adminOrderRecipientToggle || '',
                Boolean(event.target.checked),
                event.target
            );
            return;
        }

        if (event.target.matches('[data-admin-order-draft-change]')) {
            updateAdminOrderDraftField(event.target.dataset.adminOrderDraftChange || '', event.target.value);
            return;
        }

        if (event.target.matches('[data-admin-orders-sent-filter]')) {
            setAdminOrdersSentFilter(event.target.dataset.adminOrdersSentFilter || '', event.target.value);
            return;
        }

        if (event.target.matches('[data-admin-orders-sent-layout-filter]')) {
            setAdminOrdersSentLayoutFilter(event.target.dataset.adminOrdersSentLayoutFilter || '', event.target.value);
            return;
        }

        if (event.target.matches('[data-orders-recipient-filter-connected-role]')) {
            const role = event.target.getAttribute('data-orders-recipient-filter-connected-role') || '';
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                const editorRole = normalizeOrdersRecipientFilterRole(draft.recipientRole || USER_ROLES.STUDENT);
                const next = new Set(normalizeOrdersFilterConnectedRoles(draft.connectedRoles, editorRole));
                const normalizedRole = normalizeOrdersRecipientFilterRole(role);
                if (event.target.checked) next.add(normalizedRole);
                else if (normalizedRole !== editorRole) next.delete(normalizedRole);
                draft.connectedRoles = normalizeOrdersFilterConnectedRoles([...next], editorRole);
            });
            return;
        }

        if (event.target.matches('[data-orders-recipient-filter-field="field"]')) {
            const index = Number(event.target.dataset.ordersRecipientFilterIndex);
            mutateOrdersRecipientFilterEditorDraft((draft) => {
                const filter = draft.filters?.[index];
                if (!filter) return;
                const nextField = event.target.value;
                if ((draft.filters || []).some((item, itemIndex) => itemIndex !== index && item.field === nextField)) {
                    return;
                }
                const next = createOrdersRecipientFilterDraftEntry(nextField);
                filter.field = next.field;
                filter.type = next.type;
                filter.label = next.label;
                filter.id = next.id;
                filter.options = next.options || [];
            });
            return;
        }

        if (event.target.matches('[data-orders-recipient-filter-field="enabled"]')) {
            const index = Number(event.target.dataset.ordersRecipientFilterIndex);
            if (!ordersRecipientFilterEditorDraft?.filters?.[index]) return;
            ordersRecipientFilterEditorDraft.filters[index].enabled = Boolean(event.target.checked);
            return;
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (isAdminOrdersTitlePresetsOpen()) {
            closeAdminOrdersTitlePresets();
            return;
        }
        if (isOrdersRecipientFilterEditorOpen()) {
            closeOrdersRecipientFilterEditor();
            return;
        }
        if (isAdminOrdersThreadModalOpen()) {
            closeAdminOrderThreadModal();
        }
    });
}


function ensureAdminOrdersModals() {
    let createOverlay = document.getElementById('admin-orders-create-overlay');
    if (!createOverlay) {
        createOverlay = document.createElement('div');
        createOverlay.id = 'admin-orders-create-overlay';
        createOverlay.setAttribute('data-lux-modal-overlay', '');
        createOverlay.setAttribute('aria-hidden', 'true');
        createOverlay.innerHTML = `
            <div class="admin-orders-create-modal modal-content" data-lux-transparency-exempt="1">
                <div class="admin-orders-create-head">
                    <div>
                        <div class="lux-card-title orders-admin-section-title">Create Official Order</div>
                        <div class="lux-panel-copy orders-admin-section-copy">Select recipients, compose the order, then publish to their Orders inbox.</div>
                    </div>
                    <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-close-create-modal="true" aria-label="Close create order modal"><i class="fas fa-times"></i></button>
                </div>
                <div class="admin-orders-create-grid">
                    <section class="admin-orders-create-column admin-orders-create-column--recipients lux-soft-chrome" id="admin-orders-recipients-panel" aria-label="Select recipients"></section>
                    <section class="admin-orders-create-column admin-orders-create-column--compose lux-soft-chrome" id="admin-orders-compose-panel" aria-label="Compose order"></section>
                </div>
                <div class="admin-orders-create-foot">
                    <div class="lux-pill-row orders-compose-pills" id="admin-orders-create-footer-summary" data-admin-orders-count-pills-host="1"></div>
                    <div class="admin-orders-create-foot-actions">
                        <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-close-create-modal="true">Cancel</button>
                        <button type="button" class="lux-primary-btn home-hover-chip" data-admin-orders-send="1"><i class="fas fa-paper-plane"></i> Publish Order</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(createOverlay);
    }
    createOverlay.className = 'modal-overlay admin-orders-modal-overlay';
    if (createOverlay.getAttribute('aria-hidden') === 'false') createOverlay.classList.add('active');
    const createModal = createOverlay.querySelector('.admin-orders-create-modal');
    if (createModal) {
        createModal.className = 'admin-orders-create-modal modal-content';
        createModal.setAttribute('data-lux-transparency-exempt', '1');
        createModal.removeAttribute('data-lux-btn-density');
    }

    let threadOverlay = document.getElementById('admin-orders-thread-overlay');
    if (!threadOverlay) {
        threadOverlay = document.createElement('div');
        threadOverlay.id = 'admin-orders-thread-overlay';
        threadOverlay.setAttribute('data-lux-modal-overlay', '');
        threadOverlay.setAttribute('aria-hidden', 'true');
        threadOverlay.innerHTML = `
            <div class="admin-orders-thread-modal modal-content lux-panel" data-lux-transparency-exempt="1">
                <div id="admin-orders-thread-panel" aria-label="Order details"></div>
            </div>
        `;
        document.body.appendChild(threadOverlay);
    }
    const threadWasOpen = threadOverlay.classList.contains('active')
        || threadOverlay.getAttribute('aria-hidden') === 'false';
    threadOverlay.className = 'modal-overlay admin-orders-modal-overlay';
    if (threadWasOpen) threadOverlay.classList.add('active');
    const threadModal = threadOverlay.querySelector('.admin-orders-thread-modal');
    if (threadModal) {
        threadModal.className = 'admin-orders-thread-modal modal-content lux-panel';
        threadModal.setAttribute('data-lux-transparency-exempt', '1');
        threadModal.removeAttribute('data-lux-btn-density');
    }

    let recipientFilterOverlay = document.getElementById('admin-orders-recipient-filter-overlay');
    if (!recipientFilterOverlay) {
        recipientFilterOverlay = document.createElement('div');
        recipientFilterOverlay.id = 'admin-orders-recipient-filter-overlay';
        recipientFilterOverlay.setAttribute('data-lux-modal-overlay', '');
        recipientFilterOverlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(recipientFilterOverlay);
    }
    const recipientFilterWasOpen = recipientFilterOverlay.classList.contains('active')
        || recipientFilterOverlay.getAttribute('aria-hidden') === 'false';
    recipientFilterOverlay.className = 'modal-overlay orders-recipient-filter-editor-overlay';
    recipientFilterOverlay.setAttribute('data-lux-transparency-exempt', '1');
    if (recipientFilterWasOpen) recipientFilterOverlay.classList.add('active');
    const staleRemoveOverlay = document.getElementById('admin-orders-thread-remove-overlay');
    if (staleRemoveOverlay) staleRemoveOverlay.remove();

    let titlesOverlay = document.getElementById('admin-orders-titles-overlay');
    if (!titlesOverlay) {
        titlesOverlay = document.createElement('div');
        titlesOverlay.id = 'admin-orders-titles-overlay';
        titlesOverlay.setAttribute('data-lux-modal-overlay', '');
        titlesOverlay.setAttribute('aria-hidden', 'true');
        document.body.appendChild(titlesOverlay);
    }
    const titlesWasOpen = titlesOverlay.classList.contains('active')
        || titlesOverlay.getAttribute('aria-hidden') === 'false';
    titlesOverlay.className = 'modal-overlay admin-orders-titles-overlay';
    if (titlesWasOpen) titlesOverlay.classList.add('active');
}

function renderAdminOrders() {
    const root = document.getElementById('admin-orders-root');
    if (!root) return;
    bindOrdersWorkspaceDelegates();
    ensureAdminOrdersModals();
    if (getEffectiveUserRole() !== USER_ROLES.ADMIN) {
        renderOrdersInboxPage();
        return;
    }

    const faculty = getCurrentFaculty();
    const facultyLabel = getFacultyLabel(faculty);
    const uiState = ensureAdminOrdersUiState(faculty);
    const bucket = getOrdersBucketForFaculty(faculty);
    const filteredRecipients = getFilteredAdminOrderRecipients(faculty);
    const selectedRecipientSet = new Set((uiState.selectedRecipientIds || []).map(String));
    const selectedRecipients = getTargetableOrderUsers(faculty).filter(user => selectedRecipientSet.has(String(user.id)));
    const orders = getAdminSentOrders(faculty);
    const filteredOrders = getFilteredAdminSentOrders(faculty);
    const selectedOrder = getAdminOrderById(uiState.selectedOrderId, faculty) || filteredOrders[0] || orders[0] || null;

    if (selectedOrder && uiState.selectedOrderId !== selectedOrder.id) {
        uiState.selectedOrderId = selectedOrder.id;
    }

    const roleCounts = selectedRecipients.reduce((acc, recipient) => {
        acc[recipient.role] = (acc[recipient.role] || 0) + 1;
        return acc;
    }, {});
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter(order => order.createdDate === today).length;
    const recipientFootprint = orders.reduce((count, order) => count + (order.recipientCount || order.recipientIds?.length || 0), 0);

    const shell = ensureAdminOrdersShell(root);
    if (!shell.commandPanel || !shell.ordersTablePanel || !shell.detailPanel) return;

    const layoutHydrationKey = `${normalizeFacultyCode(faculty || 'ECON', 'ECON')}:audience`;
    if (root.dataset.ordersAudienceLayoutHydratedKey !== layoutHydrationKey) {
        root.dataset.ordersAudienceLayoutHydratedKey = layoutHydrationKey;
        Promise.all(ORDERS_RECIPIENT_FILTER_ROLES.map((role) => fetchOrdersRecipientFilterLayout(faculty, role)))
            .then(() => {
                if (document.getElementById('admin-orders-root') === root) renderAdminOrders();
            });
    }

    renderAdminOrdersCommandCard(shell.commandPanel, uiState, selectedRecipients, roleCounts);
    if (shell.recipientsPanel) {
        renderAdminOrdersRecipientsPanelRegions(shell.recipientsPanel, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients);
    }
    if (shell.composePanel) {
        renderAdminOrdersComposePanelRegions(shell.composePanel, uiState, roleCounts, today, selectedRecipients.length);
    }
    setOrdersRegionMarkup(shell.ordersTablePanel, 'admin-filter', renderAdminOrdersFilterPanel(uiState, facultyLabel, filteredOrders.length, orders.length));
    renderAdminOrdersSentInboxPanel(shell.detailPanel, filteredOrders, uiState.selectedOrderId);
    return;
}

function ensureAdminOrdersShell(root) {
    if (!root.querySelector('[data-admin-orders-shell="1"]')) {
        root.innerHTML = `
            <div class="lux-page-shell orders-admin-shell" data-admin-orders-shell="1" data-lux-layout-only="1">
                <div class="orders-admin-grid">
                    <section class="lux-panel orders-admin-panel orders-admin-workspace-card lux-soft-chrome" data-lux-glass-root="1">
                        <div class="lux-card-body orders-admin-panel__body orders-admin-panel__body--workspace">
                            <div class="orders-admin-workspace-section orders-admin-workspace-section--command lux-soft-chrome home-hover-chip" id="admin-orders-command-panel" aria-label="Create official order"></div>
                            <div class="orders-admin-workspace-divider" role="presentation"></div>
                            <div class="orders-admin-workspace-section orders-admin-workspace-section--filter lux-soft-chrome home-hover-chip" id="admin-orders-table-panel" aria-label="Audience filters"></div>
                            <div class="orders-admin-workspace-divider" role="presentation"></div>
                            <div class="orders-admin-workspace-section orders-admin-workspace-section--inbox lux-soft-chrome home-hover-chip" id="admin-orders-detail-panel" aria-label="Audience items"></div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

    const workspacePanel = root.querySelector('.orders-admin-panel[data-lux-glass-root="1"]');
    workspacePanel?.removeAttribute('data-lux-btn-density');

    return {
        commandPanel: root.querySelector('#admin-orders-command-panel'),
        recipientsPanel: document.getElementById('admin-orders-recipients-panel'),
        composePanel: document.getElementById('admin-orders-compose-panel'),
        ordersTablePanel: root.querySelector('#admin-orders-table-panel'),
        detailPanel: root.querySelector('#admin-orders-detail-panel')
    };
}

function createAdminOrdersRoleFilterButton(role, active) {
    const label = role === 'all' ? 'All' : getOrderRoleShortLabel(role);
    return createOrdersNode('button', {
        className: `lux-status-pill home-hover-chip ${active ? 'is-info' : 'is-muted'}`.trim(),
        text: label,
        attrs: {
            type: 'button',
            'data-admin-orders-role-filter': role,
            'data-orders-clickable-pill': '1'
        }
    });
}

function buildAdminOrdersRecipientsListSignature(uiState, filteredRecipients) {
    return [
        uiState.search || '',
        uiState.roleFilter || 'all',
        filteredRecipients.map((user) => String(user.id)).join(',')
    ].join('|');
}

function pauseAdminOrdersRecipientObserver() {
    window.__luxTransparencyObserverPaused = true;
}

function resumeAdminOrdersRecipientObserver() {
    window.clearTimeout(window.__adminOrdersTransparencyResumeTimer);
    window.__adminOrdersTransparencyResumeTimer = window.setTimeout(() => {
        window.__adminOrdersTransparencyResumeTimer = null;
        window.__luxTransparencyObserverPaused = false;
    }, 48);
}

function syncAdminOrdersRecipientCountPill(container, count) {
    const pill = container.querySelector('.lux-card-head .lux-status-pill');
    if (pill) pill.textContent = `${count} selected`;
}

function syncAdminOrdersRoleFilterPills(container, activeRole) {
    container.querySelectorAll('[data-admin-orders-role-filter]').forEach((button) => {
        const role = button.dataset.adminOrdersRoleFilter || 'all';
        const active = role === (activeRole || 'all');
        button.classList.toggle('is-info', active);
        button.classList.toggle('is-muted', !active);
    });
}

function syncAdminOrdersRecipientList(scrollEl, filteredRecipients, selectedRecipientSet) {
    if (!scrollEl) return;
    const fragment = document.createDocumentFragment();
    if (filteredRecipients.length) {
        filteredRecipients.forEach((user) => {
            fragment.appendChild(createAdminRecipientRow(user, selectedRecipientSet));
        });
    } else {
        fragment.appendChild(createOrdersNode('div', {
            className: 'orders-recipient-list-empty',
            text: 'No recipients matched the current search.',
        }));
    }
    scrollEl.replaceChildren(fragment);
}

function syncAdminOrdersRecipientSelection(scrollEl, selectedRecipientSet) {
    if (!scrollEl) return;
    scrollEl.querySelectorAll('[data-admin-order-recipient-toggle]').forEach((input) => {
        const userId = input.dataset.adminOrderRecipientToggle || '';
        const selected = selectedRecipientSet.has(userId);
        input.checked = selected;
        const row = input.closest('.orders-recipient-row');
        if (row) row.classList.toggle('is-selected', selected);
    });
}

function mountAdminOrdersRecipientsPanelRegions(container, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients) {
    const fragment = document.createDocumentFragment();

    const head = createOrdersNode('div', { className: 'lux-card-head' });
    const headCopy = createOrdersNode('div');
    headCopy.appendChild(createOrdersNode('div', { className: 'lux-card-title orders-admin-section-title', text: 'Select Recipients' }));
    headCopy.appendChild(createOrdersNode('div', {
        className: 'lux-panel-copy orders-admin-section-copy',
        text: `Search one person or mark many at once inside ${facultyLabel}.`
    }));
    head.appendChild(headCopy);
    head.appendChild(createOrdersNode('span', {
        className: 'lux-status-pill home-hover-chip is-info',
        text: `${selectedRecipients.length} selected`
    }));
    fragment.appendChild(head);

    fragment.appendChild(createOrdersNode('input', {
        className: 'lux-control',
        attrs: {
            type: 'text',
            value: uiState.search || '',
            'data-admin-orders-search': '1',
            placeholder: 'Search by name, ID, email, or role'
        }
    }));

    const filterRow = createOrdersNode('div', {
        className: 'lux-pill-row orders-recipient-filter-row'
    });
    getAdminOrdersRecipientRoleFilters().forEach((role) => {
        filterRow.appendChild(createAdminOrdersRoleFilterButton(role, (uiState.roleFilter || 'all') === role));
    });
    fragment.appendChild(filterRow);

    const actionRow = createOrdersNode('div', {
        className: 'orders-recipient-action-row'
    });
    actionRow.appendChild(createOrdersNode('button', {
        className: 'lux-primary-btn home-hover-chip',
        html: '<i class="fas fa-check-double"></i> Select Filtered',
        attrs: { type: 'button', 'data-admin-orders-select-filtered': '1' }
    }));
    actionRow.appendChild(createOrdersNode('button', {
        className: 'lux-secondary-btn home-hover-chip',
        html: '<i class="fas fa-eraser"></i> Clear',
        attrs: { type: 'button', 'data-admin-orders-clear-recipients': '1' }
    }));
    fragment.appendChild(actionRow);

    const listShell = createOrdersNode('div', {
        className: 'orders-recipient-list-shell'
    });
    const scroll = createOrdersNode('div', {
        className: 'orders-recipient-list-scroll'
    });
    syncAdminOrdersRecipientList(scroll, filteredRecipients, selectedRecipientSet);
    listShell.appendChild(scroll);
    fragment.appendChild(listShell);

    container.replaceChildren(fragment);
    container.dataset.adminOrdersRecipientsMounted = '1';
}

function createAdminRecipientRow(user, selectedRecipientSet) {
    const selected = selectedRecipientSet.has(String(user.id));
    const label = createOrdersNode('label', {
        className: `orders-recipient-row lux-soft-chrome home-hover-chip ${selected ? 'is-selected' : ''}`.trim()
    });
    label.appendChild(createOrdersNode('input', {
        attrs: {
            type: 'checkbox',
            ...(selected ? { checked: 'checked' } : {}),
            'data-admin-order-recipient-toggle': String(user.id)
        }
    }));

    const copy = createOrdersNode('div', { className: 'orders-recipient-row__copy' });
    const titleRow = createOrdersNode('div', {
        className: 'orders-recipient-row__title'
    });
    titleRow.appendChild(createOrdersNode('div', {
        className: 'orders-recipient-row__name',
        text: user.nameEn || user.name || user.id
    }));
    titleRow.appendChild(createOrdersNode('span', {
        className: 'lux-status-pill home-hover-chip is-muted',
        text: getOrderRoleLabel(user.role)
    }));
    copy.appendChild(titleRow);
    copy.appendChild(createOrdersNode('div', {
        className: 'orders-recipient-row__meta',
        text: user.email || 'No email recorded'
    }));
    const footerBits = [String(user.id)];
    if (user.role === USER_ROLES.STUDENT && user.semester) {
        footerBits.push(`Semester ${String(user.semester)}`);
    }
    copy.appendChild(createOrdersNode('div', {
        className: 'orders-recipient-row__submeta',
        text: footerBits.join(' · ')
    }));
    label.appendChild(copy);
    return label;
}

function renderAdminOrdersRecipientsPanelRegions(container, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients) {
    if (!container) return;

    const listSignature = buildAdminOrdersRecipientsListSignature(uiState, filteredRecipients);
    if (!container.dataset.adminOrdersRecipientsMounted) {
        mountAdminOrdersRecipientsPanelRegions(
            container,
            facultyLabel,
            uiState,
            filteredRecipients,
            selectedRecipientSet,
            selectedRecipients
        );
        container.dataset.adminOrdersRecipientsListSignature = listSignature;
        return;
    }

    if (container.dataset.adminOrdersRecipientsListSignature === listSignature) return;

    const prevSignature = container.dataset.adminOrdersRecipientsListSignature || '';
    const [prevSearch = '', prevRole = 'all', prevVisible = ''] = prevSignature.split('|');
    const [nextSearch = '', nextRole = 'all', nextVisible = ''] = listSignature.split('|');
    const listContentChanged = prevSearch !== nextSearch
        || prevRole !== nextRole
        || prevVisible !== nextVisible;

    pauseAdminOrdersRecipientObserver();
    try {
        syncAdminOrdersRecipientCountPill(container, selectedRecipients.length);
        syncAdminOrdersRoleFilterPills(container, uiState.roleFilter);

        const scroll = container.querySelector('.orders-recipient-list-scroll');
        if (listContentChanged) {
            syncAdminOrdersRecipientList(scroll, filteredRecipients, selectedRecipientSet);
        } else {
            syncAdminOrdersRecipientSelection(scroll, selectedRecipientSet);
        }

        container.dataset.adminOrdersRecipientsListSignature = listSignature;
    } finally {
        resumeAdminOrdersRecipientObserver();
    }
}

function renderAdminOrdersRecipientsPanel(facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients) {
    const legacyContainer = document.createElement('div');
    renderAdminOrdersRecipientsPanelRegions(
        legacyContainer,
        facultyLabel,
        uiState,
        filteredRecipients,
        selectedRecipientSet,
        selectedRecipients
    );
    return legacyContainer.innerHTML;
}

function renderAdminOrdersComposePanel(uiState, roleCounts, today) {
    const container = document.createElement('div');
    mountAdminOrdersComposePanelRegions(container, uiState, today);
    syncAdminOrdersComposePills(container, roleCounts, Object.values(roleCounts).reduce((sum, count) => sum + count, 0));
    return container.innerHTML;
}

function renderAdminOrdersFilterPanel(uiState, facultyLabel, filteredCount, totalCount) {
    const faculty = getCurrentFaculty();
    const filters = uiState.sentFilters || {};
    const audienceRole = getAdminAudienceRole(faculty);
    const audienceLabel = getOrdersRecipientFilterEditorRoleLabel(audienceRole);
    const layout = getCachedOrdersRecipientFilterLayout(faculty, audienceRole);
    const enabledSelects = getEnabledOrdersRecipientLayoutSelects(layout);
    const layoutFilters = filters.layoutFilters || {};

    const audienceTabs = ORDERS_RECIPIENT_FILTER_ROLES.map((role) => {
        const active = role === audienceRole;
        const badge = countAdminAudienceNotifications(faculty, role);
        const label = getOrdersRecipientFilterEditorRoleLabel(role);
        const badgeMarkup = badge > 0
            ? ` <span class="lux-tab-badge home-hover-chip">${badge}</span>`
            : '';
        return `
            <button type="button"
                class="lux-tab-btn orders-admin-audience-tab ${active ? 'is-active' : ''}"
                data-admin-orders-audience-role="${escapeHtml(role)}"
                data-lux-skip-modern-button="true"
                aria-pressed="${active ? 'true' : 'false'}">
                ${escapeHtml(label)}${badgeMarkup}
            </button>
        `;
    }).join('');

        const layoutSelects = enabledSelects.map((filter) => {
        const selected = layoutFilters[filter.field] || 'all';
        const rawLabel = String(filter.label || filter.field || '').trim() || 'items';
        const allLabel = rawLabel.toLowerCase() === 'type'
            ? 'All types'
            : rawLabel.toLowerCase() === 'status'
                ? 'All statuses'
                : rawLabel.toLowerCase() === 'kind'
                    ? 'All kinds'
                    : `All ${rawLabel.toLowerCase()}`;
        const options = [
            { value: 'all', label: allLabel },
            ...(filter.options || [])
        ].map((option) => {
            const isSelected = option.value === selected ? ' selected' : '';
            return `<option value="${escapeHtml(option.value)}"${isSelected}>${escapeHtml(option.label || option.value)}</option>`;
        }).join('');
        return `
            <label class="lux-picker-field orders-inbox-layout-filter">
                <span class="lux-picker-label">${escapeHtml(filter.label || filter.field)}</span>
                <select class="lux-control" data-lux-picker-label="${escapeHtml(filter.label || filter.field)}" data-admin-orders-sent-layout-filter="${escapeHtml(filter.field)}">${options}</select>
            </label>
        `;
    }).join('');

    const dateFields = `
        <label class="lux-picker-field orders-inbox-layout-filter">
            <span class="lux-picker-label">From</span>
            <input type="date" class="lux-control" value="${escapeHtml(filters.dateFrom || '')}" data-admin-orders-sent-filter="dateFrom">
        </label>
        <label class="lux-picker-field orders-inbox-layout-filter">
            <span class="lux-picker-label">To</span>
            <input type="date" class="lux-control" value="${escapeHtml(filters.dateTo || '')}" data-admin-orders-sent-filter="dateTo">
        </label>
    `;

    const audienceScopedTotal = getAdminSentOrders(faculty).filter((order) => orderIncludesAudienceRole(order, audienceRole)).length;
    const layoutChrome = `${layoutSelects}${dateFields}`;

    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title orders-admin-section-title">Audience</div>
            </div>
            <span class="lux-status-pill home-hover-chip is-info">${filteredCount} matching</span>
        </div>
        <div class="lux-tab-strip lux-tab-strip--segmented orders-admin-audience-tabs" role="tablist" aria-label="Audience roles">${audienceTabs}</div>
        <div class="orders-admin-filter-strip">
            <label class="lux-picker-field orders-admin-audience-search">
                <span class="lux-picker-label">Search</span>
                <input type="search" class="lux-control" value="${escapeHtml(filters.search || '')}" data-admin-orders-sent-search="1" placeholder="Search title, type, id, or description">
            </label>
            <div class="orders-inbox-layout-filters">${layoutChrome}</div>
            <div class="orders-admin-filter-foot">
                <span class="lux-status-pill home-hover-chip is-muted">${audienceScopedTotal} sent to ${escapeHtml(audienceLabel)}</span>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-edit-recipient-filters="1">
                    <i class="fas fa-sliders-h" aria-hidden="true"></i> Edit filters
                </button>
            </div>
        </div>
    `;
}

function renderAdminOrdersSentInboxPanel(container, orders, selectedOrderId) {
    if (!container) return;
    const emptyMessage = orders.length
        ? ''
        : '<div class="lux-empty-state lux-panel-copy orders-admin-sent-empty">No sent orders matched the current filters.</div>';
    const listMarkup = orders.length ? `
        <div class="orders-admin-sent-list">
            ${orders.map((order) => {
                const selected = String(selectedOrderId) === String(order.id);
                const recipientCount = order.recipientCount || (order.recipientIds ? order.recipientIds.length : 0);
                const kindLabel = getAdminSentOrderKind(order) === 'announcement' ? 'Announcement' : 'Order';
                return `
                    <button type="button" class="orders-admin-sent-item lux-soft-chrome home-hover-chip ${selected ? 'is-selected' : ''}" data-admin-order-open="${escapeHtml(order.id)}">
                        <div class="orders-admin-sent-item__main">
                            <div class="lux-card-copy orders-admin-sent-item__title">${escapeHtml(order.title)}</div>
                            <div class="lux-panel-copy orders-admin-sent-item__meta">${escapeHtml(order.id)} · ${escapeHtml(order.type)}</div>
                        </div>
                        <div class="orders-admin-sent-item__side">
                            <span class="lux-panel-copy orders-admin-sent-item__summary">${recipientCount} · ${escapeHtml(kindLabel)} · ${escapeHtml(order.createdDate || '—')}</span>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>
    ` : emptyMessage;

    container.innerHTML = `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title orders-admin-section-title">Items · ${escapeHtml(getOrdersRecipientFilterEditorRoleLabel(getAdminAudienceRole()))}</div>
            </div>
            <span class="lux-status-pill home-hover-chip is-muted">${orders.length} shown</span>
        </div>
        ${listMarkup}
    `;
}

function renderAdminOrderThreadShell(order) {
    if (!order) return '';
    const recipientCount = order.recipientCount || (order.recipientIds ? order.recipientIds.length : 0);
    const description = typeof renderOrderDetailDescriptionMarkup === 'function'
        ? renderOrderDetailDescriptionMarkup(order)
        : `<div class="orders-detail-panel lux-detail-panel">${escapeHtml(order.description || '')}</div>`;
    const metrics = typeof renderOrderDetailMetricsMarkup === 'function'
        ? renderOrderDetailMetricsMarkup(order)
        : '';
    const attachments = typeof renderOrderDetailAttachmentsMarkup === 'function'
        ? renderOrderDetailAttachmentsMarkup(order)
        : '';
    const recipients = typeof renderOrderDetailRecipientsMarkup === 'function'
        ? renderOrderDetailRecipientsMarkup(order)
        : '';
    return `
        <div class="admin-orders-thread-header modal-header">
            <div>
                <div class="lux-card-title orders-admin-section-title">${escapeHtml(order.title)}</div>
                <div class="lux-panel-copy orders-admin-section-copy">${escapeHtml(order.type)} · Effective ${escapeHtml(order.effectiveDate || '—')} · ${recipientCount} recipients</div>
            </div>
            <div class="admin-orders-thread-header-actions">
                <span class="lux-status-pill home-hover-chip is-muted">${escapeHtml(order.status || 'Active')}</span>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-order-delete="${escapeHtml(order.id)}"><i class="fas fa-trash"></i> Delete</button>
                <button type="button" class="lux-secondary-btn home-hover-chip" data-admin-orders-close-thread-modal="true" aria-label="Close order details"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <div class="admin-orders-thread-body modal-body lux-scrollbar" data-admin-order-detail-body="1">
            ${description}
            ${metrics}
            ${attachments}
            ${recipients}
        </div>
    `;
}

function renderAdminOrderThreadPanelContent() {
    const uiState = ensureAdminOrdersUiState();
    const order = getAdminOrderById(uiState.selectedOrderId);
    const panel = document.getElementById('admin-orders-thread-panel');
    if (!panel || !order) return;
    panel.innerHTML = renderAdminOrderThreadShell(order);
}

function setAdminOrdersThreadModalOpen(isOpen) {
    const overlay = document.getElementById('admin-orders-thread-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminOrdersModalBodyLock();
}

function openAdminOrderThreadModal(orderId) {
    if (!orderId) return;
    selectAdminOrderRecord(orderId, { skipRender: true });
    const order = getAdminOrderById(orderId);
    if (!order) return;
    ensureAdminOrderThread(order);
    renderAdminOrderThreadPanelContent();
    setAdminOrdersThreadModalOpen(true);
    syncAdminOrdersSentInboxChange();
}

function closeAdminOrderThreadModal(event) {
    if (event) {
        const overlay = document.getElementById('admin-orders-thread-overlay');
        const isBackdrop = event.target === overlay;
        const isCloseControl = Boolean(event.target.closest?.('[data-admin-orders-close-thread-modal]'));
        if (!isBackdrop && !isCloseControl) return;
    }
    setAdminOrdersThreadModalOpen(false);
}


