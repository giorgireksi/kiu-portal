/* Orders workspace logic extracted from messenger.js. Source of truth remains the shared portal runtime. */

function ensureOrdersState() {
    if (!KIU_STATE.ordersCenterByFaculty || typeof KIU_STATE.ordersCenterByFaculty !== 'object') {
        KIU_STATE.ordersCenterByFaculty = {};
    }
    if (!KIU_STATE.orderReadsByUser || typeof KIU_STATE.orderReadsByUser !== 'object') {
        KIU_STATE.orderReadsByUser = {};
    }
}

function getOrdersBucketForFaculty(faculty = getCurrentFaculty()) {
    ensureOrdersState();
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!KIU_STATE.ordersCenterByFaculty[normalizedFaculty]) {
        KIU_STATE.ordersCenterByFaculty[normalizedFaculty] = { items: [] };
    }
    if (!Array.isArray(KIU_STATE.ordersCenterByFaculty[normalizedFaculty].items)) {
        KIU_STATE.ordersCenterByFaculty[normalizedFaculty].items = [];
    }
    return KIU_STATE.ordersCenterByFaculty[normalizedFaculty];
}

function ensureAdminOrdersUiState(faculty = getCurrentFaculty()) {
    const normalizedFaculty = normalizeFacultyCode(faculty || 'ECON', 'ECON');
    if (!adminOrdersUiByFaculty[normalizedFaculty]) {
        adminOrdersUiByFaculty[normalizedFaculty] = {
            search: '',
            roleFilter: 'all',
            selectedRecipientIds: [],
            selectedOrderId: null,
            draft: {
                title: '',
                type: 'General Order',
                effectiveDate: new Date().toISOString().slice(0, 10),
                description: ''
            }
        };
    }
    return adminOrdersUiByFaculty[normalizedFaculty];
}

function ensureRecipientOrdersUiState(userId = getCurrentUserId()) {
    const key = String(userId || 'anonymous');
    if (!recipientOrdersUiByUser[key]) {
        recipientOrdersUiByUser[key] = {
            search: '',
            status: 'all',
            selectedOrderId: null
        };
    }
    return recipientOrdersUiByUser[key];
}

function getOrderRoleLabel(role) {
    if (role === USER_ROLES.STUDENT) return 'Student';
    if (role === USER_ROLES.PROFESSOR) return 'Professor';
    if (role === USER_ROLES.TA) return 'Teaching Assistant';
    if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
    if (role === USER_ROLES.ADMIN) return 'Admin';
    return 'Portal User';
}

function buildRecipientOrdersListSignature(uiState, allOrders, orders, selectedOrder, currentUser) {
    return [
        String(currentUser?.id || ''),
        uiState.search || '',
        uiState.status || 'all',
        String(selectedOrder?.id || ''),
        allOrders.length,
        orders.length,
        orders.map((order) => `${order.id}:${order.readBy?.includes?.(currentUser?.id) ? 'read' : 'unread'}`).join('|')
    ].join('|');
}

function getOrderRoleShortLabel(role) {
    if (role === USER_ROLES.STUDENT) return 'Students';
    if (role === USER_ROLES.PROFESSOR) return 'Professors';
    if (role === USER_ROLES.TA) return 'TAs';
    if (role === USER_ROLES.STUDENT_SERVICE) return 'Student Service';
    return 'Users';
}

const ordersRegionMarkupCache = Object.create(null);

function setOrdersRegionMarkup(element, key, markup) {
    if (!element) return;
    if (ordersRegionMarkupCache[key] === markup) return;
    element.innerHTML = markup;
    ordersRegionMarkupCache[key] = markup;
}

function getOrderDisplayDate(value) {
    return String(value || '—');
}

function getOrderDisplayValue(value) {
    return String(value || '\u2014');
}

function renderOrderDetailEmptyStateMarkup(message) {
    return `
        <div class="orders-detail-empty">
            <div class="orders-detail-empty__inner">
                <i class="fas fa-inbox orders-detail-empty__icon"></i>
                ${escapeHtml(message || 'No orders are available for this account yet.')}
            </div>
        </div>
    `;
}

function ensureOrderDetailShell(container, scopeKey = 'order-detail') {
    if (!container) return null;
    let shell = container.querySelector(`[data-order-detail-shell="${scopeKey}"]`);
    if (!shell) {
        container.innerHTML = `
            <div data-order-detail-shell="${escapeHtml(scopeKey)}">
                <div data-order-detail-header="1"></div>
                <div data-order-detail-description="1"></div>
                <div data-order-detail-metrics="1"></div>
                <div data-order-detail-attachments="1"></div>
                <div data-order-detail-recipients="1"></div>
            </div>
        `;
        shell = container.querySelector(`[data-order-detail-shell="${scopeKey}"]`);
    }
    return {
        header: shell?.querySelector('[data-order-detail-header="1"]') || null,
        description: shell?.querySelector('[data-order-detail-description="1"]') || null,
        metrics: shell?.querySelector('[data-order-detail-metrics="1"]') || null,
        attachments: shell?.querySelector('[data-order-detail-attachments="1"]') || null,
        recipients: shell?.querySelector('[data-order-detail-recipients="1"]') || null
    };
}

function renderOrderDetailHeaderMarkup(selectedOrder, options = {}) {
    const titleClass = options.titleClass || 'page-hero-title';
    const titleVariantClass = options.titleVariantClass || 'orders-detail-title--hero';
    const rightBadges = [];
    if (selectedOrder?.status) {
        rightBadges.push(`<span class="lux-status-pill is-success">${escapeHtml(selectedOrder.status || 'Active')}</span>`);
    }
    if (options.showSenderPill) {
        rightBadges.push(`<span class="lux-status-pill is-muted">From ${escapeHtml(selectedOrder.createdByName || 'Administration')}</span>`);
    }
    if (options.extraBadgesMarkup) {
        rightBadges.push(options.extraBadgesMarkup);
    }
    return `
        <div class="orders-detail-header">
            <div class="orders-detail-header__copy">
                <div class="${escapeHtml(`${titleClass} orders-detail-title ${titleVariantClass}`.trim())}">${escapeHtml(selectedOrder.title)}</div>
                <div class="orders-detail-submeta">${escapeHtml(selectedOrder.id)} &middot; ${escapeHtml(selectedOrder.type)} &middot; Effective ${escapeHtml(getOrderDisplayValue(selectedOrder.effectiveDate))}</div>
            </div>
            <div class="orders-detail-badges">
                ${rightBadges.join('')}
            </div>
        </div>
    `;
}

function renderOrderDetailDescriptionMarkup(selectedOrder) {
    return `<div class="orders-detail-panel lux-detail-panel">${escapeHtml(selectedOrder.description || '')}</div>`;
}

function renderOrderDetailMetricsMarkup(selectedOrder) {
    return `
        <div class="orders-metric-grid">
            <div class="orders-metric-card lux-stack-card">
                <div class="orders-metric-label">Created Date</div>
                <div class="orders-metric-value">${escapeHtml(getOrderDisplayValue(selectedOrder.createdDate))}</div>
            </div>
            <div class="orders-metric-card lux-stack-card">
                <div class="orders-metric-label">Effective Date</div>
                <div class="orders-metric-value">${escapeHtml(getOrderDisplayValue(selectedOrder.effectiveDate))}</div>
            </div>
            <div class="orders-metric-card lux-stack-card">
                <div class="orders-metric-label">Faculty Context</div>
                <div class="orders-metric-value orders-metric-value--context">${escapeHtml(selectedOrder.facultyName || getFacultyLabel(selectedOrder.facultyCode || getCurrentFaculty()))}</div>
            </div>
        </div>
    `;
}

function getOrderAttachmentEntries(selectedOrder = {}) {
    const rawEntries = [];
    if (selectedOrder.attachment) rawEntries.push(selectedOrder.attachment);
    if (Array.isArray(selectedOrder.attachments)) rawEntries.push(...selectedOrder.attachments);
    if (Array.isArray(selectedOrder.files)) rawEntries.push(...selectedOrder.files);
    if (Array.isArray(selectedOrder.documents)) rawEntries.push(...selectedOrder.documents);

    return rawEntries.map((entry, index) => {
        if (typeof entry === 'string') {
            return {
                id: `attachment-${index + 1}`,
                name: entry,
                url: entry
            };
        }
        return {
            id: String(entry?.id || `attachment-${index + 1}`),
            name: String(entry?.name || entry?.label || entry?.fileName || 'Attachment'),
            url: String(entry?.url || entry?.href || entry?.downloadUrl || entry?.fileUrl || '')
        };
    }).filter((entry) => entry.name);
}

function renderOrderDetailAttachmentsMarkup(selectedOrder) {
    const attachments = getOrderAttachmentEntries(selectedOrder);
    if (!attachments.length) return '';
    return `
        <div class="orders-detail-section-label">Attachments</div>
        <div class="orders-detail-attachments">
            ${attachments.map((attachment) => `
                <div class="orders-attachment-card lux-inline-card">
                    <div class="orders-attachment-copy">
                        <div class="orders-attachment-title">${escapeHtml(attachment.name)}</div>
                        <div class="orders-attachment-meta">Attached order document</div>
                    </div>
                    ${attachment.url
                        ? `<a class="lux-secondary-btn" href="${escapeHtml(attachment.url)}" download="${escapeHtml(attachment.name)}"><i class="fas fa-file-download"></i> Download</a>`
                        : `<span class="lux-status-pill is-muted">No file URL</span>`}
                </div>
            `).join('')}
        </div>
    `;
}

function renderOrderDetailRecipientsMarkup(selectedOrder) {
    return `
        <div class="orders-detail-section-label">Recipients</div>
        <div class="orders-recipient-grid">
            ${(selectedOrder.recipientSnapshots || []).map((recipient) => `
                <div class="orders-recipient-card lux-inline-card">
                    <div class="orders-recipient-title">${escapeHtml(recipient.name || recipient.id)}</div>
                    <div class="orders-recipient-meta">${escapeHtml(getOrderRoleLabel(recipient.role))}</div>
                    <div class="orders-recipient-submeta">${escapeHtml(recipient.email || '')}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderOrderDetailRegions(container, selectedOrder, options = {}) {
    if (!container) return;
    const scopeKey = options.scopeKey || 'order-detail';
    if (!selectedOrder) {
        setOrdersRegionMarkup(container, `${scopeKey}:empty`, renderOrderDetailEmptyStateMarkup(options.emptyMessage));
        delete ordersRegionMarkupCache[`${scopeKey}:header`];
        delete ordersRegionMarkupCache[`${scopeKey}:description`];
        delete ordersRegionMarkupCache[`${scopeKey}:metrics`];
        delete ordersRegionMarkupCache[`${scopeKey}:attachments`];
        delete ordersRegionMarkupCache[`${scopeKey}:recipients`];
        return;
    }

    const shell = ensureOrderDetailShell(container, scopeKey);
    if (!shell) return;

    setOrdersRegionMarkup(shell.header, `${scopeKey}:header`, renderOrderDetailHeaderMarkup(selectedOrder, options));
    setOrdersRegionMarkup(shell.description, `${scopeKey}:description`, renderOrderDetailDescriptionMarkup(selectedOrder));
    setOrdersRegionMarkup(shell.metrics, `${scopeKey}:metrics`, renderOrderDetailMetricsMarkup(selectedOrder));
    setOrdersRegionMarkup(shell.attachments, `${scopeKey}:attachments`, renderOrderDetailAttachmentsMarkup(selectedOrder));
    setOrdersRegionMarkup(shell.recipients, `${scopeKey}:recipients`, renderOrderDetailRecipientsMarkup(selectedOrder));
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

    return mergeUniqueById([
        ...students,
        ...professors,
        ...tas
    ]).sort((a, b) => {
        const roleRank = {
            [USER_ROLES.STUDENT]: 1,
            [USER_ROLES.PROFESSOR]: 2,
            [USER_ROLES.TA]: 3
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

function getOrderReadMapForUser(userId = getCurrentUserId()) {
    ensureOrdersState();
    const key = String(userId || '');
    if (!key) return {};
    if (!KIU_STATE.orderReadsByUser[key] || typeof KIU_STATE.orderReadsByUser[key] !== 'object') {
        KIU_STATE.orderReadsByUser[key] = {};
    }
    return KIU_STATE.orderReadsByUser[key];
}

function getOrdersForUser(user = getCurrentUser()) {
    ensureOrdersState();
    if (!user?.id) return [];
    return Object.values(KIU_STATE.ordersCenterByFaculty || {})
        .flatMap(bucket => Array.isArray(bucket?.items) ? bucket.items : [])
        .filter(order => Array.isArray(order?.recipientIds) && order.recipientIds.includes(user.id))
        .sort((a, b) => String(b.createdAt || b.createdDate || '').localeCompare(String(a.createdAt || a.createdDate || '')));
}

function isOrderReadByUser(orderId, userId = getCurrentUserId()) {
    return Boolean(getOrderReadMapForUser(userId)?.[String(orderId)]);
}

function markOrderAsRead(orderId, userId = getCurrentUserId()) {
    if (!orderId || !userId) return;
    const readMap = getOrderReadMapForUser(userId);
    if (readMap[String(orderId)]) return;
    readMap[String(orderId)] = new Date().toISOString();
    saveState();
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
        recipientCount: recipients.length
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
    renderAdminOrders();
}

function updateAdminOrdersSearch(value) {
    const uiState = ensureAdminOrdersUiState();
    uiState.search = value || '';
    renderAdminOrders();
}

function toggleAdminOrderRecipient(userId) {
    const uiState = ensureAdminOrdersUiState();
    const key = String(userId);
    if (uiState.selectedRecipientIds.includes(key)) {
        uiState.selectedRecipientIds = uiState.selectedRecipientIds.filter(id => id !== key);
    } else {
        uiState.selectedRecipientIds = [...uiState.selectedRecipientIds, key];
    }
    renderAdminOrders();
}

function selectAllAdminOrderFilteredRecipients() {
    const uiState = ensureAdminOrdersUiState();
    const filteredIds = getFilteredAdminOrderRecipients().map(user => String(user.id));
    uiState.selectedRecipientIds = Array.from(new Set([...uiState.selectedRecipientIds, ...filteredIds]));
    renderAdminOrders();
}

function clearAdminOrderRecipients() {
    const uiState = ensureAdminOrdersUiState();
    uiState.selectedRecipientIds = [];
    renderAdminOrders();
}

function updateAdminOrderDraftField(field, value) {
    const uiState = ensureAdminOrdersUiState();
    uiState.draft[field] = value;
}

function selectAdminOrderRecord(orderId, options = {}) {
    const uiState = ensureAdminOrdersUiState();
    uiState.selectedOrderId = orderId || null;
    if (!options.skipRender) {
        renderAdminOrders();
    }
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

    saveState();
    renderAdminOrders();
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
    saveState();
    renderAdminOrders();
}

function getVisibleRecipientOrders() {
    const currentUser = getCurrentUser();
    const uiState = ensureRecipientOrdersUiState(currentUser?.id);
    const query = String(uiState.search || '').trim().toLowerCase();
    const status = uiState.status || 'all';
    return getOrdersForUser(currentUser).filter(order => {
        const read = isOrderReadByUser(order.id, currentUser?.id);
        const matchesStatus = status === 'all'
            || (status === 'read' && read)
            || (status === 'unread' && !read);
        if (!matchesStatus) return false;
        if (!query) return true;
        const haystack = [
            order.id,
            order.title,
            order.type,
            order.description,
            order.createdByName,
            order.facultyName,
            order.createdDate,
            order.effectiveDate
        ].join(' ').toLowerCase();
        return haystack.includes(query);
    });
}

function updateRecipientOrdersSearch(value) {
    const currentUser = getCurrentUser();
    const uiState = ensureRecipientOrdersUiState(currentUser?.id);
    uiState.search = value || '';
    renderOrdersInboxPage();
}

function setRecipientOrdersStatus(status) {
    const currentUser = getCurrentUser();
    const uiState = ensureRecipientOrdersUiState(currentUser?.id);
    uiState.status = status || 'all';
    renderOrdersInboxPage();
}

function openRecipientOrder(orderId) {
    const currentUser = getCurrentUser();
    const uiState = ensureRecipientOrdersUiState(currentUser?.id);
    uiState.selectedOrderId = orderId || null;
    if (orderId) {
        markOrderAsRead(orderId, currentUser?.id);
    }
    renderOrdersInboxPage();
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

        const adminOrderView = event.target.closest('[data-admin-order-view]');
        if (adminOrderView) {
            selectAdminOrderRecord(adminOrderView.dataset.adminOrderView || '');
            return;
        }

        const adminOrderDelete = event.target.closest('[data-admin-order-delete]');
        if (adminOrderDelete) {
            deleteAdminOrder(adminOrderDelete.dataset.adminOrderDelete || '');
            return;
        }

        const recipientStatus = event.target.closest('[data-recipient-order-status]');
        if (recipientStatus) {
            setRecipientOrdersStatus(recipientStatus.dataset.recipientOrderStatus || 'all');
            return;
        }

        const recipientOrderOpen = event.target.closest('[data-recipient-order-open]');
        if (recipientOrderOpen) {
            openRecipientOrder(recipientOrderOpen.dataset.recipientOrderOpen || '');
        }
    });

    document.addEventListener('input', (event) => {
        if (event.target.matches('[data-admin-orders-search]')) {
            updateAdminOrdersSearch(event.target.value);
            return;
        }

        if (event.target.matches('[data-admin-order-draft-input]')) {
            updateAdminOrderDraftField(event.target.dataset.adminOrderDraftInput || '', event.target.value);
            return;
        }

        if (event.target.matches('[data-recipient-order-search]')) {
            updateRecipientOrdersSearch(event.target.value);
        }
    });

    document.addEventListener('change', (event) => {
        if (event.target.matches('[data-admin-order-recipient-toggle]')) {
            toggleAdminOrderRecipient(event.target.dataset.adminOrderRecipientToggle || '');
            return;
        }

        if (event.target.matches('[data-admin-order-draft-change]')) {
            updateAdminOrderDraftField(event.target.dataset.adminOrderDraftChange || '', event.target.value);
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
    const orders = [...(bucket.items || [])].sort((a, b) => String(b.createdAt || b.createdDate || '').localeCompare(String(a.createdAt || a.createdDate || '')));
    const selectedOrder = getAdminOrderById(uiState.selectedOrderId, faculty) || orders[0] || null;

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
    if (!shell.heroMain || !shell.heroStats || !shell.recipientsPanel || !shell.composePanel || !shell.ordersTablePanel || !shell.detailPanel) return;

    shell.heroMain.innerHTML = renderAdminOrdersHeroMain(facultyLabel);
    shell.heroStats.innerHTML = renderAdminOrdersHeroStats(orders.length, recipientFootprint, ordersToday);
    renderAdminOrdersRecipientsPanelRegions(shell.recipientsPanel, facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients);
    shell.composePanel.innerHTML = renderAdminOrdersComposePanel(uiState, roleCounts, today);
    shell.ordersTablePanel.innerHTML = renderAdminOrdersTablePanel(facultyLabel, orders, selectedOrder);
    renderAdminOrdersDetailPanel(shell.detailPanel, selectedOrder);
    return;
}

function ensureRecipientOrdersShell(container) {
    if (!container.querySelector('[data-orders-inbox-shell="1"]')) {
        container.innerHTML = `
            <div class="lux-page-shell orders-inbox-shell" data-orders-inbox-shell="1">
                <section class="lux-card surface-card orders-inbox-hero lux-summary-surface lux-summary-surface--hero">
                    <div class="lux-card-body lux-hero-stage orders-inbox-hero-stage">
                        <div id="orders-inbox-hero-main" class="lux-hero-main"></div>
                        <aside id="orders-inbox-hero-stats" class="lux-hero-side orders-inbox-hero-side"></aside>
                    </div>
                </section>

                <div class="orders-inbox-grid">
                    <div class="orders-inbox-column">
                        <section class="lux-card surface-card orders-list-card lux-summary-surface lux-summary-surface--panel">
                            <div class="lux-card-body" id="orders-inbox-list-panel"></div>
                        </section>
                    </div>

                    <section class="lux-card surface-card orders-detail-card lux-summary-surface lux-summary-surface--panel">
                        <div class="lux-card-body" id="orders-inbox-detail-panel"></div>
                    </section>
                </div>
            </div>
        `;
    }

    return {
        heroMain: container.querySelector('#orders-inbox-hero-main'),
        heroStats: container.querySelector('#orders-inbox-hero-stats'),
        listPanel: container.querySelector('#orders-inbox-list-panel'),
        detailPanel: container.querySelector('#orders-inbox-detail-panel')
    };
}

function createOrdersNode(tagName, { className = '', text = '', html = '', attrs = {} } = {}) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    Object.entries(attrs).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        node.setAttribute(key, String(value));
    });
    if (html) node.innerHTML = html;
    else if (text) node.textContent = text;
    return node;
}

function createRecipientOrdersStatusButton(status, active) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return createOrdersNode('button', {
        className: `orders-status-filter lux-filter-pill ${active ? 'is-active' : ''}`.trim(),
        text: label,
        attrs: {
            type: 'button',
            'data-recipient-order-status': status,
            'aria-pressed': active ? 'true' : 'false'
        }
    });
}

function createRecipientOrdersListItem(order, currentUser, selectedOrder) {
    const isRead = isOrderReadByUser(order.id, currentUser.id);
    const isActive = selectedOrder?.id === order.id;
    const button = createOrdersNode('button', {
        className: `orders-item lux-select-card ${isActive ? 'is-active' : ''}`.trim(),
        attrs: {
            type: 'button',
            'data-recipient-order-open': order.id
        }
    });

    const topRow = createOrdersNode('div', {
        className: 'orders-item__top'
    });
    const copyWrap = createOrdersNode('div', {
        className: 'orders-item__copy'
    });
    copyWrap.appendChild(createOrdersNode('div', {
        className: 'orders-item__title',
        text: order.title
    }));
    copyWrap.appendChild(createOrdersNode('div', {
        className: 'orders-item__meta',
        text: `${order.type} · Effective ${getOrderDisplayValue(order.effectiveDate)}`
    }));
    topRow.appendChild(copyWrap);
    topRow.appendChild(createOrdersNode('span', {
        className: `orders-item__state lux-status-pill ${isRead ? 'is-muted' : 'is-info'}`.trim(),
        text: isRead ? 'Read' : 'Unread'
    }));

    button.appendChild(topRow);
    button.appendChild(createOrdersNode('div', {
        className: 'orders-item__meta',
        text: `${order.id} · Sent ${getOrderDisplayValue(order.createdDate)} by ${order.createdByName || 'Administrator'}`
    }));
    return button;
}

function renderRecipientOrdersListPanelRegions(container, uiState, allOrders, orders, selectedOrder, currentUser) {
    if (!container) return;
    const signature = buildRecipientOrdersListSignature(uiState, allOrders, orders, selectedOrder, currentUser);
    if (container.dataset.renderSignature === signature) return;
    const fragment = document.createDocumentFragment();

    const head = createOrdersNode('div', { className: 'lux-card-head' });
    const headCopy = createOrdersNode('div');
    headCopy.appendChild(createOrdersNode('div', { className: 'lux-card-title', text: 'My Orders' }));
    headCopy.appendChild(createOrdersNode('div', { className: 'lux-card-copy', text: 'Official decisions delivered to your account.' }));
    head.appendChild(headCopy);
    head.appendChild(createOrdersNode('span', {
        className: 'lux-status-pill is-info',
        text: `${allOrders.length} total`
    }));
    fragment.appendChild(head);

    fragment.appendChild(createOrdersNode('input', {
        className: 'lux-control',
        attrs: {
            type: 'text',
            value: uiState.search || '',
            'data-recipient-order-search': '1',
            placeholder: 'Search by order title, type, or date'
        }
    }));

    const statusRow = createOrdersNode('div', {
        className: 'orders-status-row'
    });
    ['all', 'unread', 'read'].forEach((status) => {
        statusRow.appendChild(createRecipientOrdersStatusButton(status, (uiState.status || 'all') === status));
    });
    fragment.appendChild(statusRow);

    const listWrap = createOrdersNode('div', { className: 'orders-list-wrap lux-data-card' });
    const list = createOrdersNode('div', { className: 'orders-list' });
    if (orders.length) {
        const orderFragment = document.createDocumentFragment();
        orders.forEach((order) => {
            orderFragment.appendChild(createRecipientOrdersListItem(order, currentUser, selectedOrder));
        });
        list.appendChild(orderFragment);
    } else {
        list.appendChild(createOrdersNode('div', {
            className: 'orders-list-empty',
            text: 'No orders matched your current search.',
        }));
    }
    listWrap.appendChild(list);
    fragment.appendChild(listWrap);

    container.replaceChildren(fragment);
    container.dataset.renderSignature = signature;
}

function renderRecipientOrdersHeroMain(currentUser, unreadCount) {
    return `
        <div class="lux-page-kicker"><i class="fas fa-inbox"></i> Orders Inbox</div>
        <div class="page-hero-title orders-hero-title">Official orders and decisions</div>
        <div class="lux-card-copy">Review official orders and institutional decisions sent to your portal account. Orders are shared by administrators and scoped to the groups or people they selected.</div>
        <div class="lux-pill-row orders-hero-pills">
            <span class="lux-status-pill is-muted"><i class="fas fa-user-shield"></i> ${escapeHtml(getOrderRoleLabel(currentUser.role))}</span>
            <span class="lux-status-pill is-muted"><i class="fas fa-building"></i> ${escapeHtml(getFacultyLabel(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty()))}</span>
            <span class="lux-status-pill is-muted"><i class="fas fa-bell"></i> ${unreadCount} unread</span>
        </div>
    `;
}

function ensureAdminOrdersShell(root) {
    if (!root.querySelector('[data-admin-orders-shell="1"]')) {
        root.innerHTML = `
            <div class="lux-page-shell orders-admin-shell" data-admin-orders-shell="1">
                <section class="lux-card surface-card orders-admin-hero lux-summary-surface lux-summary-surface--hero">
                    <div class="lux-card-body lux-hero-stage orders-admin-hero-stage">
                        <div id="admin-orders-hero-main" class="lux-hero-main orders-admin-hero-main"></div>
                        <aside id="admin-orders-hero-stats" class="lux-hero-side orders-admin-hero-side"></aside>
                    </div>
                </section>

                <div class="orders-admin-grid">
                    <div class="orders-admin-column orders-admin-column--compose">
                        <section class="lux-card surface-card orders-admin-panel orders-admin-recipients-card lux-summary-surface lux-summary-surface--panel">
                            <div class="lux-card-body orders-admin-panel__body orders-admin-panel__body--recipients" id="admin-orders-recipients-panel"></div>
                        </section>

                        <section class="lux-card surface-card orders-admin-panel orders-admin-compose-card lux-summary-surface lux-summary-surface--panel">
                            <div class="lux-card-body orders-admin-panel__body orders-admin-panel__body--compose" id="admin-orders-compose-panel"></div>
                        </section>
                    </div>

                    <div class="orders-admin-column orders-admin-column--review">
                        <section class="lux-card surface-card orders-admin-panel orders-admin-table-card lux-summary-surface lux-summary-surface--panel">
                            <div class="lux-card-body orders-admin-panel__body orders-admin-panel__body--table" id="admin-orders-table-panel"></div>
                        </section>

                        <section class="lux-card surface-card orders-admin-panel orders-admin-detail-card orders-detail-card lux-summary-surface lux-summary-surface--panel">
                            <div class="lux-card-body orders-admin-panel__body orders-admin-panel__body--detail" id="admin-orders-detail-panel"></div>
                        </section>
                    </div>
                </div>
            </div>
        `;
    }

    return {
        heroMain: root.querySelector('#admin-orders-hero-main'),
        heroStats: root.querySelector('#admin-orders-hero-stats'),
        recipientsPanel: root.querySelector('#admin-orders-recipients-panel'),
        composePanel: root.querySelector('#admin-orders-compose-panel'),
        ordersTablePanel: root.querySelector('#admin-orders-table-panel'),
        detailPanel: root.querySelector('#admin-orders-detail-panel')
    };
}

function renderAdminOrdersHeroMain(facultyLabel) {
    return `
        <div class="lux-page-kicker"><i class="fas fa-paper-plane"></i> Admin Orders</div>
        <div class="page-hero-title orders-hero-title">Orders Command Center</div>
        <div class="lux-card-copy">
            Search ${escapeHtml(facultyLabel)} students, professors, and teaching assistants, then issue orders in bulk from one place. Every recipient sees the final order in their own Orders inbox.
        </div>
        <div class="lux-pill-row orders-hero-pills">
            <span class="lux-status-pill is-muted"><i class="fas fa-layer-group"></i> Admin workspace</span>
            <span class="lux-status-pill is-muted"><i class="fas fa-bolt"></i> Auto sync</span>
        </div>
        <div class="orders-hero-actions">
            <button class="lux-primary-btn" type="button" data-admin-orders-nav-home="1"><i class="fas fa-arrow-left"></i> Back to CMS</button>
        </div>
    `;
}

function renderAdminOrdersHeroStats(orderCount, recipientFootprint, ordersToday) {
    return `
        <div class="lux-hero-side-head">
            <strong>${orderCount}</strong>
            <span>Admin-side distribution metrics in the same hero-side signal language used on the home dashboard.</span>
        </div>
        <div class="lux-hero-signal-list">
            <div class="lux-hero-signal">
                <span>Sent orders</span>
                <strong>${orderCount}</strong>
                <em>Total published orders visible inside this faculty command center.</em>
            </div>
            <div class="lux-hero-signal">
                <span>Recipients covered</span>
                <strong>${recipientFootprint}</strong>
                <em>Students and staff touched by those orders.</em>
            </div>
            <div class="lux-hero-signal">
                <span>Created today</span>
                <strong>${ordersToday}</strong>
                <em>Orders published during the current day.</em>
            </div>
        </div>
    `;
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
    ['all', USER_ROLES.STUDENT, USER_ROLES.PROFESSOR, USER_ROLES.TA].forEach((role) => {
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
    if (filteredRecipients.length) {
        const recipientFragment = document.createDocumentFragment();
        filteredRecipients.forEach((user) => {
            recipientFragment.appendChild(createAdminRecipientRow(user, selectedRecipientSet));
        });
        scroll.appendChild(recipientFragment);
    } else {
        scroll.appendChild(createOrdersNode('div', {
            className: 'orders-recipient-list-empty',
            text: 'No recipients matched the current search.',
        }));
    }
    listShell.appendChild(scroll);
    fragment.appendChild(listShell);

    container.replaceChildren(fragment);
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
    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">Compose Order</div>
                <div class="lux-card-copy">This order will appear in the selected users' Orders page.</div>
            </div>
        </div>
        <div class="orders-compose-head">
            <input type="text" class="lux-control" value="${escapeHtml(uiState.draft.title || '')}" data-admin-order-draft-input="title" placeholder="Order title">
            <select class="lux-control" data-admin-order-draft-change="type">
                ${['General Order', 'Registration Order', 'Academic Order', 'Financial Order', 'Scholarship Order', 'HR Order'].map(type => '<option value="' + escapeHtml(type) + '" ' + ((uiState.draft.type || 'General Order') === type ? 'selected' : '') + '>' + escapeHtml(type) + '</option>').join('')}
            </select>
        </div>
        <div class="orders-compose-body">
            <input type="date" class="lux-control" value="${escapeHtml(uiState.draft.effectiveDate || today)}" data-admin-order-draft-change="effectiveDate">
            <textarea class="lux-control orders-compose-textarea" data-admin-order-draft-input="description" placeholder="Write the full order description that recipients should see.">${escapeHtml(uiState.draft.description || '')}</textarea>
        </div>
        <div class="orders-compose-pills">
            <span class="lux-status-pill is-info">${roleCounts[USER_ROLES.STUDENT] || 0} students</span>
            <span class="lux-status-pill is-success">${roleCounts[USER_ROLES.PROFESSOR] || 0} professors</span>
            <span class="lux-status-pill is-warning">${roleCounts[USER_ROLES.TA] || 0} TAs</span>
        </div>
        <button class="lux-primary-btn orders-compose-submit" type="button" data-admin-orders-send="1"><i class="fas fa-paper-plane"></i> Send Order</button>
    `;
}

function renderAdminOrdersTablePanel(facultyLabel, orders, selectedOrder) {
    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">Sent Orders</div>
                <div class="lux-card-copy">Orders already issued inside ${escapeHtml(facultyLabel)}.</div>
            </div>
            <span class="lux-status-pill is-muted">${orders.length} total</span>
        </div>
        <div class="orders-admin-table-wrap">
            <table class="orders-admin-table">
                <thead>
                    <tr>
                        <th>Order</th>
                        <th>Recipients</th>
                        <th>Created</th>
                        <th>Effective</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.length ? orders.map(order => '<tr class="' + (selectedOrder && selectedOrder.id === order.id ? 'is-selected' : '') + '"><td><div class="orders-admin-table__title">' + escapeHtml(order.title) + '</div><div class="orders-admin-table__meta">' + escapeHtml(order.id) + ' \u00b7 ' + escapeHtml(order.type) + '</div></td><td class="orders-admin-table__cell orders-admin-table__cell--numeric">' + (order.recipientCount || (order.recipientIds ? order.recipientIds.length : 0)) + '</td><td class="orders-admin-table__cell">' + escapeHtml(order.createdDate || '\u2014') + '</td><td class="orders-admin-table__cell">' + escapeHtml(order.effectiveDate || '\u2014') + '</td><td><div class="orders-admin-table__actions"><button type="button" class="lux-secondary-btn orders-admin-table__view" data-admin-order-view="' + escapeHtml(order.id) + '">View</button><button type="button" class="orders-admin-table__delete" data-admin-order-delete="' + escapeHtml(order.id) + '">Delete</button></div></td></tr>').join('') : '<tr><td class="orders-admin-table__empty" colspan="5">No orders have been sent for this faculty yet.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;
}

function renderAdminOrdersDetailPanel(container, selectedOrder) {
    renderOrderDetailRegions(container, selectedOrder, {
        scopeKey: 'admin-order-detail',
        emptyMessage: 'Select an order to inspect its audience and full description.',
        titleClass: '',
        titleVariantClass: 'orders-detail-title--compact'
    });
}

function renderRecipientOrdersHeroStats(ordersCount, unreadCount, ordersToday) {
    return `
        <div class="lux-hero-side-head">
            <strong>${ordersCount}</strong>
            <span>Tracked orders live in the same benchmark widget language used on the home dashboard.</span>
        </div>
        <div class="lux-hero-signal-list">
            <div class="lux-hero-signal">
                <span>Sent orders</span>
                <strong>${ordersCount}</strong>
                <em>All official decisions currently visible in your inbox.</em>
            </div>
            <div class="lux-hero-signal">
                <span>Unread</span>
                <strong>${unreadCount}</strong>
                <em>Items that still need your attention.</em>
            </div>
            <div class="lux-hero-signal">
                <span>Delivered today</span>
                <strong>${ordersToday}</strong>
                <em>Fresh orders published during the current day.</em>
            </div>
        </div>
    `;
}

function renderRecipientOrdersListPanel(uiState, allOrders, orders, selectedOrder, currentUser) {
    return renderRecipientOrdersListPanelV2(uiState, allOrders, orders, selectedOrder, currentUser);

}

function renderRecipientOrdersDetailPanel(selectedOrder) {
    const legacyContainer = document.createElement('div');
    renderRecipientOrdersDetailRegions(legacyContainer, selectedOrder);
    return legacyContainer.innerHTML;

}

function renderRecipientOrdersListPanelV2(uiState, allOrders, orders, selectedOrder, currentUser) {
    const statusButtons = ['all', 'unread', 'read'].map((status) => {
        const active = (uiState.status || 'all') === status;
        const label = status.charAt(0).toUpperCase() + status.slice(1);
        return `<button type="button" data-recipient-order-status="${escapeHtml(status)}" class="orders-status-filter lux-filter-pill ${active ? 'is-active' : ''}" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`;
    }).join('');

    const orderRows = orders.length ? orders.map((order) => {
        const isRead = isOrderReadByUser(order.id, currentUser.id);
        const isActive = selectedOrder?.id === order.id;
        return `
            <button type="button" class="orders-item lux-select-card ${isActive ? 'is-active' : ''}" data-recipient-order-open="${escapeHtml(order.id)}">
                <div class="orders-item__top">
                    <div class="orders-item__copy">
                        <div class="orders-item__title">${escapeHtml(order.title)}</div>
                        <div class="orders-item__meta">${escapeHtml(order.type)} &middot; Effective ${escapeHtml(getOrderDisplayValue(order.effectiveDate))}</div>
                    </div>
                    <span class="orders-item__state lux-status-pill ${isRead ? 'is-muted' : 'is-info'}">${isRead ? 'Read' : 'Unread'}</span>
                </div>
                <div class="orders-item__meta">${escapeHtml(order.id)} &middot; Sent ${escapeHtml(getOrderDisplayValue(order.createdDate))} by ${escapeHtml(order.createdByName || 'Administrator')}</div>
            </button>
        `;
    }).join('') : `<div class="orders-list-empty">No orders matched your current search.</div>`;

    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">My Orders</div>
                <div class="lux-card-copy">Official decisions delivered to your account.</div>
            </div>
            <span class="lux-status-pill is-info">${allOrders.length} total</span>
        </div>
        <input type="text" class="lux-control" value="${escapeHtml(uiState.search || '')}" data-recipient-order-search="1" placeholder="Search by order title, type, or date">
        <div class="orders-status-row">${statusButtons}</div>
        <div class="orders-list-wrap">
            <div class="orders-list">
                ${orderRows}
            </div>
        </div>
    `;
}

function renderRecipientOrdersDetailRegions(container, selectedOrder) {
    renderOrderDetailRegions(container, selectedOrder, {
        scopeKey: 'recipient-order-detail',
        emptyMessage: 'No orders are available for this account yet.',
        showSenderPill: true,
        titleClass: 'page-hero-title',
        titleVariantClass: 'orders-detail-title--hero'
    });
}

function renderOrdersInboxAccessState(container, message) {
    if (!container) return;
    container.innerHTML = `
        <section class="page-hero orders-detail-empty">
            <div class="orders-detail-empty__inner">
                <i class="fas fa-inbox orders-detail-empty__icon"></i>
                <h1 class="page-hero-title">Orders workspace unavailable</h1>
                <p class="page-hero-copy">${escapeHtml(message || 'Sign in to load your orders inbox.')}</p>
            </div>
        </section>
    `;
}

function renderOrdersInboxPage() {
    const container = document.getElementById('page-orders')
        || document.getElementById('orders-inbox-root')
        || (getEffectiveUserRole() !== USER_ROLES.ADMIN ? document.getElementById('admin-orders-root') : null);
    if (!container) return;
    bindOrdersWorkspaceDelegates();

    const currentUser = getCurrentUser();
    const effectiveRole = getEffectiveUserRole();
    if (!currentUser) {
        renderOrdersInboxAccessState(container, 'Sign in with a student, professor, TA, or student service account to load this inbox.');
        return;
    }
    if (effectiveRole === USER_ROLES.ADMIN) {
        renderOrdersInboxAccessState(container, 'Admin orders are managed from the dedicated admin orders route.');
        return;
    }

    const uiState = ensureRecipientOrdersUiState(currentUser.id);
    const orders = getVisibleRecipientOrders();
    const allOrders = getOrdersForUser(currentUser);
    const unreadCount = allOrders.filter((order) => !isOrderReadByUser(order.id, currentUser.id)).length;
    const today = new Date().toISOString().slice(0, 10);
    const ordersToday = orders.filter((order) => order.createdDate === today).length;
    const selectedOrder = allOrders.find((order) => order.id === uiState.selectedOrderId) || orders[0] || allOrders[0] || null;
    if (selectedOrder && uiState.selectedOrderId !== selectedOrder.id) {
        uiState.selectedOrderId = selectedOrder.id;
    }

    const shell = ensureRecipientOrdersShell(container);
    if (!shell.heroMain || !shell.heroStats || !shell.listPanel || !shell.detailPanel) return;

    shell.heroMain.innerHTML = renderRecipientOrdersHeroMain(currentUser, unreadCount);
    shell.heroStats.innerHTML = renderRecipientOrdersHeroStats(orders.length, unreadCount, ordersToday);
    renderRecipientOrdersListPanelRegions(shell.listPanel, uiState, allOrders, orders, selectedOrder, currentUser);
    renderRecipientOrdersDetailRegions(shell.detailPanel, selectedOrder);

}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderOrdersInboxPage, { once: true });
} else {
    renderOrdersInboxPage();
}
