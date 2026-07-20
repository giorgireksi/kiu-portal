/* Orders workspace logic. Shared primitives live in orders-runtime-core.js. */

function ensureAdminOrdersUiState(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!adminOrdersUiByFaculty[normalizedFaculty]) {
        adminOrdersUiByFaculty[normalizedFaculty] = {
            search: '',
            roleFilter: 'all',
            selectedRecipientIds: [],
            selectedOrderId: null,
            sentFilters: {
                search: '',
                type: 'all',
                status: 'all',
                kind: 'all',
                recipientRole: 'all',
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
    if (!adminOrdersUiByFaculty[normalizedFaculty].sentFilters) {
        adminOrdersUiByFaculty[normalizedFaculty].sentFilters = {
            search: '',
            type: 'all',
            status: 'all',
            kind: 'all',
            recipientRole: 'all',
            dateFrom: '',
            dateTo: ''
        };
    }
    return adminOrdersUiByFaculty[normalizedFaculty];
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

const ADMIN_ORDERS_THREAD_MAX_ATTACHMENTS = 5;
const ADMIN_ORDERS_THREAD_ATTACHMENT_ACCEPT = 'image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt';

function getAdminSentOrders(faculty = getCurrentFaculty()) {
    const bucket = getOrdersBucketForFaculty(faculty);
    return [...(bucket.items || [])].sort((a, b) => String(b.createdAt || b.createdDate || '').localeCompare(String(a.createdAt || a.createdDate || '')));
}

function getAdminSentOrderKind(order) {
    const haystack = `${order?.type || ''} ${order?.title || ''}`;
    return /announcement|notice/i.test(haystack) ? 'announcement' : 'order';
}

function matchesAdminSentOrderDateRange(order, dateFrom, dateTo) {
    const orderDate = String(order?.createdDate || order?.effectiveDate || '').slice(0, 10);
    if (!orderDate) return true;
    if (dateFrom && orderDate < dateFrom) return false;
    if (dateTo && orderDate > dateTo) return false;
    return true;
}

function getFilteredAdminSentOrders(faculty = getCurrentFaculty()) {
    const uiState = ensureAdminOrdersUiState(faculty);
    const filters = uiState.sentFilters || {};
    const query = String(filters.search || '').trim().toLowerCase();
    const typeFilter = filters.type || 'all';
    const statusFilter = filters.status || 'all';
    const kindFilter = filters.kind || 'all';
    const recipientRole = filters.recipientRole || 'all';

    return getAdminSentOrders(faculty).filter((order) => {
        if (typeFilter !== 'all' && order.type !== typeFilter) return false;
        if (statusFilter !== 'all' && String(order.status || 'Active') !== statusFilter) return false;
        const kind = getAdminSentOrderKind(order);
        if (kindFilter !== 'all' && kind !== kindFilter) return false;
        if (recipientRole !== 'all') {
            const roles = (order.recipientSnapshots || []).map((item) => item.role);
            if (!roles.includes(recipientRole)) return false;
        }
        if (!matchesAdminSentOrderDateRange(order, filters.dateFrom, filters.dateTo)) return false;
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
    uiState.sentFilters[field] = value ?? '';
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

function makeAdminOrderThreadEntryId() {
    return `ORD-MSG-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function normalizeAdminOrderThreadEntry(entry = {}) {
    return {
        id: String(entry.id || makeAdminOrderThreadEntryId()),
        authorId: String(entry.authorId || 'admin'),
        authorName: String(entry.authorName || 'Administrator'),
        authorRole: entry.authorRole || USER_ROLES.ADMIN,
        message: String(entry.message || ''),
        attachments: Array.isArray(entry.attachments) ? entry.attachments : [],
        createdAt: entry.createdAt || new Date().toISOString(),
        type: entry.type || 'message'
    };
}

function ensureAdminOrderThread(order) {
    if (!order) return [];
    if (!Array.isArray(order.thread) || !order.thread.length) {
        order.thread = [normalizeAdminOrderThreadEntry({
            authorId: order.createdById,
            authorName: order.createdByName,
            authorRole: USER_ROLES.ADMIN,
            message: order.description,
            attachments: getOrderAttachmentEntries(order).map((item) => ({
                name: item.name,
                url: item.url
            })),
            createdAt: order.createdAt || order.createdDate,
            type: 'order'
        })];
    }
    return order.thread;
}

function appendAdminOrderThreadReply(orderId, { text = '', attachments = [] } = {}) {
    const order = getAdminOrderById(orderId);
    if (!order) return null;
    const activeUser = getCurrentUser();
    ensureAdminOrderThread(order);
    const entry = normalizeAdminOrderThreadEntry({
        authorId: activeUser?.id || 'admin',
        authorName: activeUser?.nameEn || activeUser?.name || 'Administrator',
        authorRole: activeUser?.role || USER_ROLES.ADMIN,
        message: String(text || '').trim(),
        attachments,
        type: 'message'
    });
    if (!entry.message && !entry.attachments.length) return null;
    order.thread.push(entry);
    saveState();
    return entry;
}

function formatAdminOrderDateTime(value) {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
}

function getAdminOrdersThreadDraftFiles(composerId = 'order-thread-reply') {
    window.__adminOrdersThreadDraftFiles = window.__adminOrdersThreadDraftFiles || {};
    if (!Array.isArray(window.__adminOrdersThreadDraftFiles[composerId])) {
        window.__adminOrdersThreadDraftFiles[composerId] = [];
    }
    return window.__adminOrdersThreadDraftFiles[composerId];
}

function clearAdminOrdersThreadDraftFiles(composerId = 'order-thread-reply') {
    window.__adminOrdersThreadDraftFiles = window.__adminOrdersThreadDraftFiles || {};
    window.__adminOrdersThreadDraftFiles[composerId] = [];
}

function renderAdminOrderAttachmentGallery(attachments = []) {
    if (!attachments.length) return '';
    return `<div class="admin-orders-thread-attachments">${attachments.map((file) => {
        const name = escapeHtml(file.name || 'file');
        let href = file.dataUrl || file.url || '#';
        if (file.storageKey && typeof getPortalStoredFileUrl === 'function') {
            href = getPortalStoredFileUrl(file.storageKey);
        }
        return `<a class="admin-orders-thread-attachment" href="${href}" download="${name}" target="_blank" rel="noopener"><i class="fas fa-paperclip"></i> ${name}</a>`;
    }).join('')}</div>`;
}

function renderAdminOrderThreadDraftChips(composerId = 'order-thread-reply') {
    const drafts = getAdminOrdersThreadDraftFiles(composerId);
    if (!drafts.length) return '';
    return `<div class="admin-orders-thread-draft-chips">${drafts.map((file, index) => `<span class="lux-status-pill is-muted admin-orders-thread-draft-chip">${escapeHtml(file.name || 'file')}<button type="button" data-admin-order-thread-remove-draft="${index}" aria-label="Remove attachment">&times;</button></span>`).join('')}</div>`;
}

function pickAdminOrderThreadAttachments(composerId = 'order-thread-reply') {
    const remaining = ADMIN_ORDERS_THREAD_MAX_ATTACHMENTS - getAdminOrdersThreadDraftFiles(composerId).length;
    if (remaining <= 0) {
        alert(`You can attach up to ${ADMIN_ORDERS_THREAD_MAX_ATTACHMENTS} files per message.`);
        return;
    }
    let input = document.getElementById('admin-orders-thread-attachment-input');
    if (!input) {
        input = document.createElement('input');
        input.type = 'file';
        input.id = 'admin-orders-thread-attachment-input';
        input.multiple = true;
        input.accept = ADMIN_ORDERS_THREAD_ATTACHMENT_ACCEPT;
        input.hidden = true;
        document.body.appendChild(input);
        input.addEventListener('change', () => {
            const files = Array.from(input.files || []);
            const drafts = getAdminOrdersThreadDraftFiles(composerId);
            files.forEach((file) => {
                if (drafts.length >= ADMIN_ORDERS_THREAD_MAX_ATTACHMENTS) return;
                const reader = new FileReader();
                reader.onload = () => {
                    drafts.push({
                        name: file.name,
                        mimeType: file.type,
                        size: file.size,
                        blob: file,
                        dataUrl: String(reader.result || '')
                    });
                    renderAdminOrderThreadPanelContent();
                };
                reader.readAsDataURL(file);
            });
            input.value = '';
        });
    }
    input.click();
}

async function persistAdminOrderThreadDraftAttachments(composerId = 'order-thread-reply') {
    const drafts = getAdminOrdersThreadDraftFiles(composerId);
    if (!drafts.length) return [];
    const uploaded = [];
    for (const draft of drafts) {
        if (typeof uploadPortalStoredFile === 'function') {
            const stored = await uploadPortalStoredFile(draft, 'orders');
            if (stored) {
                uploaded.push({
                    name: draft.name || stored.name || 'file',
                    mimeType: draft.mimeType || stored.mimeType || '',
                    size: draft.size || stored.size || 0,
                    storageKey: stored.storageKey,
                    storageBackend: stored.storageBackend || 'bridge',
                    dataUrl: draft.dataUrl || ''
                });
                continue;
            }
        }
        uploaded.push({
            name: draft.name || 'file',
            mimeType: draft.mimeType || '',
            size: draft.size || 0,
            dataUrl: draft.dataUrl || ''
        });
    }
    clearAdminOrdersThreadDraftFiles(composerId);
    return uploaded.slice(0, ADMIN_ORDERS_THREAD_MAX_ATTACHMENTS);
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
        thread: [normalizeAdminOrderThreadEntry({
            authorId: activeUser?.id || 'admin',
            authorName: activeUser?.nameEn || activeUser?.name || 'Administrator',
            authorRole: USER_ROLES.ADMIN,
            message: description.trim(),
            attachments: [],
            createdAt: new Date().toISOString(),
            type: 'order'
        })]
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
    const studioOpen = Boolean(document.body.classList.contains('lux-studio-open') || document.getElementById('lux-studio-backdrop')?.classList.contains('is-open'));
    document.body.classList.toggle('admin-orders-modal-open', createOpen || threadOpen || studioOpen);
}

function setAdminOrdersCreateModalOpen(isOpen) {
    const overlay = document.getElementById('admin-orders-create-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminOrdersModalBodyLock();
    if (isOpen && typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
    }
}

function openAdminOrdersCreateModal() {
    renderAdminOrders();
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
        <span class="lux-status-pill is-info">${selectedCount} selected</span>
        <span class="lux-status-pill is-info">${studentCount} students</span>
        <span class="lux-status-pill is-success">${professorCount} professors</span>
        <span class="lux-status-pill is-warning">${taCount} TAs</span>
        <span class="lux-status-pill is-muted">${serviceCount} student service</span>
        <span class="lux-status-pill is-muted">${adminCount} admins</span>
    `;
}

const ADMIN_ORDERS_ROLE_COUNT_PILL_DEFS = [
    { key: 'selected', className: 'lux-status-pill is-info' },
    { key: 'student', className: 'lux-status-pill is-info' },
    { key: 'professor', className: 'lux-status-pill is-success' },
    { key: 'ta', className: 'lux-status-pill is-warning' },
    { key: 'student_service', className: 'lux-status-pill is-muted' },
    { key: 'admin', className: 'lux-status-pill is-muted' }
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
    if (pills) {
        syncAdminOrdersRoleCountPills(pills, roleCounts, selectedCount);
    }
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
            <div class="orders-admin-command-copy">
                <div class="lux-card-title">Create Official Order</div>
                <div class="lux-card-copy">Dispatch institutional orders to all account types inside the current faculty.</div>
                <div class="orders-admin-command-pills" data-admin-orders-command-pills="1"></div>
                <div class="orders-admin-command-draft" data-admin-orders-command-draft="1">${escapeHtml(draftHint)}</div>
            </div>
            <div class="orders-admin-command-actions">
                <button class="lux-primary-btn orders-admin-command-cta" type="button" data-admin-orders-open-create-modal="1">
                    <i class="fas fa-plus-circle"></i> Create Order
                </button>
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
                <div class="lux-card-title">Compose Order</div>
                <div class="lux-card-copy">This order will appear in the selected users' Orders page.</div>
            </div>
        </div>
        <div class="orders-compose-head">
            <input type="text" class="lux-control" value="${escapeHtml(uiState.draft.title || '')}" data-admin-order-draft-input="title" placeholder="Order title">
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

        const adminOrderOpen = event.target.closest('[data-admin-order-open]');
        if (adminOrderOpen) {
            openAdminOrderThreadModal(adminOrderOpen.dataset.adminOrderOpen || '');
            return;
        }

        const adminOrderThreadClose = event.target.closest('[data-admin-orders-close-thread-modal]');
        if (adminOrderThreadClose) {
            closeAdminOrderThreadModal(event);
            return;
        }

        if (event.target.id === 'admin-orders-thread-overlay') {
            closeAdminOrderThreadModal(event);
            return;
        }

        const adminOrderThreadAttach = event.target.closest('[data-admin-order-thread-attach]');
        if (adminOrderThreadAttach) {
            pickAdminOrderThreadAttachments(adminOrderThreadAttach.dataset.adminOrderThreadAttach || 'order-thread-reply');
            return;
        }

        const adminOrderThreadSend = event.target.closest('[data-admin-order-thread-send]');
        if (adminOrderThreadSend) {
            sendAdminOrderThreadReply(adminOrderThreadSend.dataset.adminOrderThreadSend || '');
            return;
        }

        const adminOrderThreadRemoveDraft = event.target.closest('[data-admin-order-thread-remove-draft]');
        if (adminOrderThreadRemoveDraft) {
            const index = Number(adminOrderThreadRemoveDraft.dataset.adminOrderThreadRemoveDraft);
            const drafts = getAdminOrdersThreadDraftFiles();
            if (!Number.isNaN(index)) drafts.splice(index, 1);
            renderAdminOrderThreadPanelContent();
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
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && isAdminOrdersThreadModalOpen()) {
            closeAdminOrderThreadModal();
            return;
        }

    });
}


function renderAdminOrders() {
    const root = document.getElementById('admin-orders-root');
    if (!root) return;
    bindOrdersWorkspaceDelegates();
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
    if (!shell.commandPanel || !shell.recipientsPanel || !shell.composePanel || !shell.ordersTablePanel || !shell.detailPanel) return;

    renderAdminOrdersCommandCard(shell.commandPanel, uiState, selectedRecipients, roleCounts);
    renderAdminOrdersRecipientsPanelRegions(shell.recipientsPanel, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients);
    renderAdminOrdersComposePanelRegions(shell.composePanel, uiState, roleCounts, today, selectedRecipients.length);
    setOrdersRegionMarkup(shell.ordersTablePanel, 'admin-filter', renderAdminOrdersFilterPanel(uiState, facultyLabel, filteredOrders.length, orders.length));
    renderAdminOrdersSentInboxPanel(shell.detailPanel, filteredOrders, uiState.selectedOrderId);
    return;
}

function ensureAdminOrdersShell(root) {
    if (!root.querySelector('[data-admin-orders-shell="1"]')) {
        root.innerHTML = `
            <div class="lux-page-shell orders-admin-shell" data-admin-orders-shell="1">
                <div class="orders-admin-grid">
                    <section class="lux-panel orders-admin-panel orders-admin-workspace-card">
                        <div class="lux-card-body orders-admin-panel__body orders-admin-panel__body--workspace">
                            <div class="orders-admin-workspace-section orders-admin-workspace-section--command" id="admin-orders-command-panel" aria-label="Create official order"></div>
                            <div class="orders-admin-workspace-divider" role="presentation"></div>
                            <div class="orders-admin-workspace-section orders-admin-workspace-section--filter" id="admin-orders-table-panel" aria-label="Filter sent orders"></div>
                            <div class="orders-admin-workspace-divider" role="presentation"></div>
                            <div class="orders-admin-workspace-section orders-admin-workspace-section--inbox" id="admin-orders-detail-panel" aria-label="Sent items"></div>
                        </div>
                    </section>
                </div>
            </div>
        `;
    }

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
        className: `lux-status-pill ${active ? 'is-info' : 'is-muted'}`.trim(),
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
    headCopy.appendChild(createOrdersNode('div', { className: 'lux-card-title', text: 'Select Recipients' }));
    headCopy.appendChild(createOrdersNode('div', {
        className: 'lux-card-copy',
        text: `Search one person or mark many at once inside ${facultyLabel}.`
    }));
    head.appendChild(headCopy);
    head.appendChild(createOrdersNode('span', {
        className: 'lux-status-pill is-info',
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
        className: 'orders-recipient-filter-row'
    });
    getAdminOrdersRecipientRoleFilters().forEach((role) => {
        filterRow.appendChild(createAdminOrdersRoleFilterButton(role, (uiState.roleFilter || 'all') === role));
    });
    fragment.appendChild(filterRow);

    const actionRow = createOrdersNode('div', {
        className: 'orders-recipient-action-row'
    });
    actionRow.appendChild(createOrdersNode('button', {
        className: 'lux-primary-btn',
        html: '<i class="fas fa-check-double"></i> Select Filtered',
        attrs: { type: 'button', 'data-admin-orders-select-filtered': '1' }
    }));
    actionRow.appendChild(createOrdersNode('button', {
        className: 'lux-secondary-btn',
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
        className: `orders-recipient-row ${selected ? 'is-selected' : ''}`.trim()
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
        className: 'lux-status-pill is-muted',
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
    const filters = uiState.sentFilters || {};
    const typeOptions = ['all', ...ADMIN_ORDER_COMPOSE_TYPES].map((type) => {
        const selected = (filters.type || 'all') === type ? ' selected' : '';
        const label = type === 'all' ? 'All types' : type;
        return `<option value="${escapeHtml(type)}"${selected}>${escapeHtml(label)}</option>`;
    }).join('');
    const statusOptions = ['all', 'Active'].map((status) => {
        const selected = (filters.status || 'all') === status ? ' selected' : '';
        const label = status === 'all' ? 'All statuses' : status;
        return `<option value="${escapeHtml(status)}"${selected}>${escapeHtml(label)}</option>`;
    }).join('');
    const kindOptions = [
        ['all', 'Orders + messages'],
        ['order', 'Official orders'],
        ['announcement', 'Announcements']
    ].map(([value, label]) => {
        const selected = (filters.kind || 'all') === value ? ' selected' : '';
        return `<option value="${escapeHtml(value)}"${selected}>${escapeHtml(label)}</option>`;
    }).join('');
    const roleOptions = getAdminOrdersRecipientRoleFilters().map((role) => {
        const selected = (filters.recipientRole || 'all') === role ? ' selected' : '';
        const label = role === 'all' ? 'All recipient roles' : getOrderRoleShortLabel(role);
        return `<option value="${escapeHtml(role)}"${selected}>${escapeHtml(label)}</option>`;
    }).join('');

    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">Filter Sent Orders</div>
                <div class="lux-card-copy">Narrow official orders and announcements issued inside ${escapeHtml(facultyLabel)}.</div>
            </div>
            <span class="lux-status-pill is-info">${filteredCount} matching</span>
        </div>
        <div class="orders-admin-filter-grid">
            <div class="lux-field orders-admin-filter-field orders-admin-filter-field--wide">
                <label>Search</label>
                <input type="search" class="lux-control" value="${escapeHtml(filters.search || '')}" data-admin-orders-sent-search="1" placeholder="Search title, type, id, or description">
            </div>
            <div class="lux-field orders-admin-filter-field">
                <label>Type</label>
                <select class="lux-control" data-lux-picker-label="Type" data-admin-orders-sent-filter="type">${typeOptions}</select>
            </div>
            <div class="lux-field orders-admin-filter-field">
                <label>Status</label>
                <select class="lux-control" data-lux-picker-label="Status" data-admin-orders-sent-filter="status">${statusOptions}</select>
            </div>
            <div class="lux-field orders-admin-filter-field">
                <label>Kind</label>
                <select class="lux-control" data-lux-picker-label="Kind" data-admin-orders-sent-filter="kind">${kindOptions}</select>
            </div>
            <div class="lux-field orders-admin-filter-field">
                <label>Recipients</label>
                <select class="lux-control" data-lux-picker-label="Recipients" data-admin-orders-sent-filter="recipientRole">${roleOptions}</select>
            </div>
            <div class="lux-field orders-admin-filter-field">
                <label>From</label>
                <input type="date" class="lux-control" value="${escapeHtml(filters.dateFrom || '')}" data-admin-orders-sent-filter="dateFrom">
            </div>
            <div class="lux-field orders-admin-filter-field">
                <label>To</label>
                <input type="date" class="lux-control" value="${escapeHtml(filters.dateTo || '')}" data-admin-orders-sent-filter="dateTo">
            </div>
        </div>
        <div class="orders-admin-filter-foot">
            <span class="lux-status-pill is-muted">${totalCount} total in faculty</span>
        </div>
    `;
}

function renderAdminOrdersSentInboxPanel(container, orders, selectedOrderId) {
    if (!container) return;
    const emptyMessage = orders.length
        ? ''
        : '<div class="orders-admin-sent-empty">No sent orders matched the current filters.</div>';
    const listMarkup = orders.length ? `
        <div class="orders-admin-sent-list">
            ${orders.map((order) => {
                const selected = String(selectedOrderId) === String(order.id);
                const recipientCount = order.recipientCount || (order.recipientIds ? order.recipientIds.length : 0);
                const kindLabel = getAdminSentOrderKind(order) === 'announcement' ? 'Announcement' : 'Order';
                return `
                    <button type="button" class="orders-admin-sent-item ${selected ? 'is-selected' : ''}" data-admin-order-open="${escapeHtml(order.id)}">
                        <div class="orders-admin-sent-item__main">
                            <div class="orders-admin-sent-item__title">${escapeHtml(order.title)}</div>
                            <div class="orders-admin-sent-item__meta">${escapeHtml(order.id)} · ${escapeHtml(order.type)} · ${escapeHtml(order.createdDate || '—')}</div>
                        </div>
                        <div class="orders-admin-sent-item__side">
                            <span class="lux-status-pill is-muted">${recipientCount} recipients</span>
                            <span class="lux-status-pill is-info">${escapeHtml(kindLabel)}</span>
                        </div>
                    </button>
                `;
            }).join('')}
        </div>
    ` : emptyMessage;

    container.innerHTML = `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">Sent Items</div>
                <div class="lux-card-copy">Open an order to review the thread, attachments, and replies.</div>
            </div>
            <span class="lux-status-pill is-muted">${orders.length} shown</span>
        </div>
        ${listMarkup}
    `;
}

function renderAdminOrderThreadBubble(entry, order) {
    const activeUser = getCurrentUser();
    const isMine = String(entry.authorId) === String(activeUser?.id) || entry.authorRole === USER_ROLES.ADMIN;
    const attachmentGallery = renderAdminOrderAttachmentGallery(entry.attachments);
    if (!entry.message && !attachmentGallery) return '';
    return `
        <div class="admin-orders-thread-msg-row ${isMine ? 'is-mine' : ''}">
            <div class="admin-orders-thread-msg-meta">
                <span class="admin-orders-thread-msg-author">${escapeHtml(entry.authorName || 'User')}</span>
                <span class="admin-orders-thread-msg-role">${escapeHtml(getOrderRoleLabel(entry.authorRole))}</span>
                <span class="admin-orders-thread-msg-time">${escapeHtml(formatAdminOrderDateTime(entry.createdAt))}</span>
            </div>
            <div class="admin-orders-thread-msg-bubble ${isMine ? 'is-mine' : ''}">
                ${entry.message ? `<div class="admin-orders-thread-msg-text">${escapeHtml(entry.message)}</div>` : ''}
                ${attachmentGallery}
            </div>
        </div>
    `;
}

function renderAdminOrderThreadChatLog(order) {
    ensureAdminOrderThread(order);
    const bubbles = (order.thread || [])
        .map((entry) => renderAdminOrderThreadBubble(entry, order))
        .filter(Boolean)
        .join('');
    return `
        <div class="admin-orders-thread-chat-log lux-scrollbar" data-admin-order-thread-chat-log="1">
            ${bubbles || '<div class="orders-admin-sent-empty">No messages yet.</div>'}
        </div>
    `;
}

function renderAdminOrderThreadComposer(orderId) {
    return `
        <div class="admin-orders-thread-composer">
            <textarea class="lux-control admin-orders-thread-composer-input" rows="3" data-admin-order-thread-input="1" placeholder="Write a reply or add an internal follow-up..."></textarea>
            ${renderAdminOrderThreadDraftChips()}
            <div class="admin-orders-thread-composer-actions">
                <button type="button" class="lux-secondary-btn" data-admin-order-thread-attach="order-thread-reply"><i class="fas fa-paperclip"></i> Attach files</button>
                <button type="button" class="lux-primary-btn" data-admin-order-thread-send="${escapeHtml(orderId)}"><i class="fas fa-paper-plane"></i> Send reply</button>
            </div>
        </div>
    `;
}

function renderAdminOrderThreadShell(order) {
    if (!order) return '';
    ensureAdminOrderThread(order);
    const recipientCount = order.recipientCount || (order.recipientIds ? order.recipientIds.length : 0);
    return `
        <div class="admin-orders-thread-shell" data-admin-order-thread-shell="1">
            <div class="admin-orders-thread-header">
                <div>
                    <div class="lux-card-title">${escapeHtml(order.title)}</div>
                    <div class="lux-card-copy">${escapeHtml(order.type)} · Effective ${escapeHtml(order.effectiveDate || '—')} · ${recipientCount} recipients</div>
                </div>
                <div class="admin-orders-thread-header-actions">
                    <span class="lux-status-pill is-muted">${escapeHtml(order.status || 'Active')}</span>
                    <button type="button" class="lux-secondary-btn" data-admin-order-delete="${escapeHtml(order.id)}"><i class="fas fa-trash"></i> Delete</button>
                    <button type="button" class="lux-secondary-btn" data-admin-orders-close-thread-modal="true" aria-label="Close thread"><i class="fas fa-times"></i></button>
                </div>
            </div>
            <div class="admin-orders-thread-body">
                ${renderAdminOrderThreadChatLog(order)}
                ${renderAdminOrderThreadComposer(order.id)}
            </div>
        </div>
    `;
}

function scrollAdminOrderThreadChatLog() {
    const log = document.querySelector('[data-admin-order-thread-chat-log="1"]');
    if (!log) return;
    log.scrollTop = log.scrollHeight;
}

function renderAdminOrderThreadPanelContent() {
    const uiState = ensureAdminOrdersUiState();
    const order = getAdminOrderById(uiState.selectedOrderId);
    const panel = document.getElementById('admin-orders-thread-panel');
    if (!panel || !order) return;
    panel.innerHTML = renderAdminOrderThreadShell(order);
    scrollAdminOrderThreadChatLog();
    if (typeof window.queueLuxuryTransparencyRefresh === 'function') {
        window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0);
    }
}

function setAdminOrdersThreadModalOpen(isOpen) {
    const overlay = document.getElementById('admin-orders-thread-overlay');
    if (!overlay) return;
    overlay.classList.toggle('active', Boolean(isOpen));
    overlay.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    syncAdminOrdersModalBodyLock();
    if (isOpen && typeof window.queueLuxuryTransparencyRefresh === 'function') {
        const scheduleRefresh = typeof window.requestAnimationFrame === 'function'
            ? window.requestAnimationFrame.bind(window)
            : (cb) => window.setTimeout(cb, 0);
        scheduleRefresh(() => window.queueLuxuryTransparencyRefresh(window.__currentTransparency || 0));
    }
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
    clearAdminOrdersThreadDraftFiles();
    setAdminOrdersThreadModalOpen(false);
}

async function sendAdminOrderThreadReply(orderId) {
    const order = getAdminOrderById(orderId);
    if (!order) return;
    const input = document.querySelector('[data-admin-order-thread-input="1"]');
    const text = String(input?.value || '').trim();
    const attachments = await persistAdminOrderThreadDraftAttachments('order-thread-reply');
    if (!text && !attachments.length) {
        alert('Write a message or attach at least one file.');
        return;
    }
    appendAdminOrderThreadReply(orderId, { text, attachments });
    if (input) input.value = '';
    renderAdminOrderThreadPanelContent();
}

