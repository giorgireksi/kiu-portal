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
        <div style="height:100%; min-height:420px; display:flex; align-items:center; justify-content:center; text-align:center; color:var(--lux-text-muted); padding:40px;">
            <div>
                <i class="fas fa-inbox" style="font-size:24px; margin-bottom:12px; display:block; opacity:0.5;"></i>
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
    const titleStyle = options.titleStyle || 'font-size:clamp(26px, 2.4vw, 38px); line-height:1.02;';
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
        <div style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start; flex-wrap:wrap;">
            <div>
                <div class="${escapeHtml(titleClass)}" style="${escapeHtml(titleStyle)}">${escapeHtml(selectedOrder.title)}</div>
                <div style="margin-top:8px; color:var(--lux-text-muted); font-size:13px;">${escapeHtml(selectedOrder.id)} &middot; ${escapeHtml(selectedOrder.type)} &middot; Effective ${escapeHtml(getOrderDisplayValue(selectedOrder.effectiveDate))}</div>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${rightBadges.join('')}
            </div>
        </div>
    `;
}

function renderOrderDetailDescriptionMarkup(selectedOrder) {
    return `<div class="orders-detail-panel">${escapeHtml(selectedOrder.description || '')}</div>`;
}

function renderOrderDetailMetricsMarkup(selectedOrder) {
    return `
        <div class="orders-metric-grid">
            <div class="orders-metric-card">
                <div class="orders-metric-label">Created Date</div>
                <div class="orders-metric-value">${escapeHtml(getOrderDisplayValue(selectedOrder.createdDate))}</div>
            </div>
            <div class="orders-metric-card">
                <div class="orders-metric-label">Effective Date</div>
                <div class="orders-metric-value">${escapeHtml(getOrderDisplayValue(selectedOrder.effectiveDate))}</div>
            </div>
            <div class="orders-metric-card">
                <div class="orders-metric-label">Faculty Context</div>
                <div class="orders-metric-value" style="font-size:18px; line-height:1.25;">${escapeHtml(selectedOrder.facultyName || getFacultyLabel(selectedOrder.facultyCode || getCurrentFaculty()))}</div>
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
        <div style="margin-top:18px; font-size:13px; color:var(--lux-text-muted);">Attachments</div>
        <div style="margin-top:10px; display:grid; gap:10px;">
            ${attachments.map((attachment) => `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; padding:14px; border:1px solid rgba(255,255,255,0.08); border-radius:16px; background:rgba(255,255,255,0.03);">
                    <div style="min-width:0;">
                        <div style="font-weight:800; color:var(--lux-text);">${escapeHtml(attachment.name)}</div>
                        <div style="margin-top:4px; color:var(--lux-text-muted); font-size:12px;">Attached order document</div>
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
        <div style="margin-top:18px; font-size:13px; color:var(--lux-text-muted);">Recipients</div>
        <div style="margin-top:10px; display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:12px;">
            ${(selectedOrder.recipientSnapshots || []).map((recipient) => `
                <div style="padding:14px; border:1px solid rgba(255,255,255,0.08); border-radius:16px; background:rgba(255,255,255,0.03);">
                    <div style="font-weight:800; color:var(--lux-text);">${escapeHtml(recipient.name || recipient.id)}</div>
                    <div style="margin-top:4px; color:var(--lux-text-muted); font-size:12px;">${escapeHtml(getOrderRoleLabel(recipient.role))}</div>
                    <div style="margin-top:4px; color:var(--lux-text-soft); font-size:11px;">${escapeHtml(recipient.email || '')}</div>
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

function ensureOrdersInboxFadeOverrides() {
    if (document.getElementById('orders-inbox-fade-overrides')) return;
    const style = document.createElement('style');
    style.id = 'orders-inbox-fade-overrides';
    style.textContent = `
        body.lux-route-orders #page-orders .orders-inbox-hero,
        body[data-lux-page="orders"] #page-orders .orders-inbox-hero,
        #page-orders .orders-inbox-hero,
        #orders-inbox-root .orders-inbox-hero,
        #admin-orders-root .orders-inbox-hero {
            background:
                radial-gradient(circle at 8% 0%, rgba(255, 255, 255, calc(var(--lux-transparency-alpha, 0.92) * 0.075)), transparent 32%),
                radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, 0.92) * 0.24)), transparent 38%),
                radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-transparency-alpha, 0.92) * 0.14)), transparent 38%),
                linear-gradient(135deg,
                    rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, 0.92) * 0.10)),
                    rgba(10, 15, 24, calc(var(--lux-transparency-alpha, 0.92) * 0.91)) 44%,
                    rgba(7, 10, 18, calc(var(--lux-transparency-alpha, 0.92) * 0.84))) !important;
            border-color: rgba(var(--lux-accent-rgb), 0.16) !important;
            box-shadow:
                0 24px 58px rgba(0, 0, 0, 0.24),
                inset 0 1px 0 rgba(255, 255, 255, 0.07) !important;
        }

        body.lux-route-orders #page-orders :is(.orders-list-card, .orders-detail-card),
        body[data-lux-page="orders"] #page-orders :is(.orders-list-card, .orders-detail-card),
        #page-orders :is(.orders-list-card, .orders-detail-card),
        #orders-inbox-root :is(.orders-list-card, .orders-detail-card),
        #admin-orders-root :is(.orders-list-card, .orders-detail-card) {
            background:
                radial-gradient(circle at 8% 0%, rgba(255, 255, 255, calc(var(--lux-transparency-alpha, 0.92) * 0.075)), transparent 32%),
                radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, 0.92) * 0.24)), transparent 38%),
                radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-transparency-alpha, 0.92) * 0.14)), transparent 38%),
                linear-gradient(135deg,
                    rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, 0.92) * 0.10)),
                    rgba(10, 15, 24, calc(var(--lux-transparency-alpha, 0.92) * 0.91)) 44%,
                    rgba(7, 10, 18, calc(var(--lux-transparency-alpha, 0.92) * 0.84))) !important;
            border-color: rgba(var(--lux-accent-rgb), 0.16) !important;
        }

        body.lux-route-orders #page-orders :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        body[data-lux-page="orders"] #page-orders :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        #page-orders :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        #orders-inbox-root :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        #admin-orders-root :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active) {
            background:
                radial-gradient(circle at 0% 0%, rgba(var(--lux-accent-rgb), 0.10), transparent 34%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), rgba(255, 255, 255, 0.018)) !important;
            border-color: rgba(var(--lux-accent-rgb), 0.12) !important;
        }

        body.lux-light-mode #page-orders :is(.orders-inbox-hero, .orders-list-card, .orders-detail-card),
        html.lux-light-mode body #page-orders :is(.orders-inbox-hero, .orders-list-card, .orders-detail-card),
        body.lux-light-mode #orders-inbox-root :is(.orders-inbox-hero, .orders-list-card, .orders-detail-card),
        body.lux-light-mode #admin-orders-root :is(.orders-inbox-hero, .orders-list-card, .orders-detail-card) {
            background:
                radial-gradient(circle at 8% 0%, rgba(255, 255, 255, calc(var(--lux-transparency-alpha, 0.88) * 0.88)), transparent 34%),
                radial-gradient(circle at 72% 0%, rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, 0.88) * 0.20)), transparent 38%),
                radial-gradient(circle at 100% 94%, rgba(var(--lux-home-secondary-rgb), calc(var(--lux-transparency-alpha, 0.88) * 0.13)), transparent 38%),
                linear-gradient(135deg,
                    rgba(var(--lux-accent-rgb), calc(var(--lux-transparency-alpha, 0.88) * 0.075)),
                    rgba(255, 255, 255, calc(var(--lux-transparency-alpha, 0.88) * 0.88)) 44%,
                    rgba(247, 241, 232, calc(var(--lux-transparency-alpha, 0.88) * 0.72))) !important;
            border-color: rgba(48, 34, 22, 0.10) !important;
        }

        body.lux-light-mode #page-orders :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        html.lux-light-mode body #page-orders :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        body.lux-light-mode #orders-inbox-root :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active),
        body.lux-light-mode #admin-orders-root :is(.lux-stat-card, .orders-metric-card, .orders-detail-panel, .orders-list-wrap, .orders-status-filter, .orders-item.is-active) {
            background:
                radial-gradient(circle at 0% 0%, rgba(var(--lux-accent-rgb), 0.08), transparent 34%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.66), rgba(250, 246, 239, 0.44)) !important;
            border-color: rgba(var(--lux-accent-rgb), 0.12) !important;
        }
    `;
    document.head.appendChild(style);
}

function ensureRecipientOrdersShell(container) {
    if (!container.querySelector('[data-orders-inbox-shell="1"]')) {
        container.innerHTML = `
            <div class="lux-page-shell orders-inbox-shell" data-orders-inbox-shell="1">
                <section class="lux-card orders-inbox-hero lux-summary-surface lux-summary-surface--hero">
                    <div class="lux-card-body" style="display:grid; grid-template-columns:minmax(0,1.2fr) minmax(280px,0.8fr); gap:22px; align-items:start;">
                        <div id="orders-inbox-hero-main"></div>
                        <aside>
                            <div class="lux-stat-grid" id="orders-inbox-hero-stats"></div>
                        </aside>
                    </div>
                </section>

                <div class="orders-inbox-grid">
                    <div style="display:flex; flex-direction:column; gap:18px;">
                        <section class="lux-card orders-list-card">
                            <div class="lux-card-body" id="orders-inbox-list-panel"></div>
                        </section>
                    </div>

                    <section class="lux-card orders-detail-card">
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
        className: `orders-status-filter ${active ? 'is-active' : ''}`.trim(),
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
        className: `orders-item ${isActive ? 'is-active' : ''}`.trim(),
        attrs: {
            type: 'button',
            'data-recipient-order-open': order.id
        }
    });

    const topRow = createOrdersNode('div', {
        attrs: {
            style: 'display:flex; justify-content:space-between; gap:12px; align-items:flex-start;'
        }
    });
    const copyWrap = createOrdersNode('div', {
        attrs: { style: 'min-width:0;' }
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
        className: `orders-item__state ${isRead ? 'is-read' : 'is-unread'}`.trim(),
        text: isRead ? 'Read' : 'Unread',
        attrs: {
            style: `background:${isRead ? 'rgba(255,255,255,0.06)' : 'rgba(var(--lux-accent-rgb),0.14)'}; color:${isRead ? 'var(--lux-text-muted)' : 'var(--lux-text)'};`
        }
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
        attrs: { style: 'display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;' }
    });
    ['all', 'unread', 'read'].forEach((status) => {
        statusRow.appendChild(createRecipientOrdersStatusButton(status, (uiState.status || 'all') === status));
    });
    fragment.appendChild(statusRow);

    const listWrap = createOrdersNode('div', { className: 'orders-list-wrap' });
    const list = createOrdersNode('div', { className: 'orders-list' });
    if (orders.length) {
        const orderFragment = document.createDocumentFragment();
        orders.forEach((order) => {
            orderFragment.appendChild(createRecipientOrdersListItem(order, currentUser, selectedOrder));
        });
        list.appendChild(orderFragment);
    } else {
        list.appendChild(createOrdersNode('div', {
            text: 'No orders matched your current search.',
            attrs: {
                style: 'padding:44px 18px; text-align:center; color:var(--lux-text-muted);'
            }
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
        <div class="page-hero-title" style="margin-top:12px;">Official orders and decisions</div>
        <div class="lux-card-copy">Review official orders and institutional decisions sent to your portal account. Orders are shared by administrators and scoped to the groups or people they selected.</div>
        <div class="lux-pill-row" style="margin-top:18px;">
            <span class="lux-status-pill is-muted"><i class="fas fa-user-shield"></i> ${escapeHtml(getOrderRoleLabel(currentUser.role))}</span>
            <span class="lux-status-pill is-muted"><i class="fas fa-building"></i> ${escapeHtml(getFacultyLabel(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty()))}</span>
            <span class="lux-status-pill is-muted"><i class="fas fa-bell"></i> ${unreadCount} unread</span>
        </div>
    `;
}

function ensureAdminOrdersShell(root) {
    if (!root.querySelector('[data-admin-orders-shell="1"]')) {
        root.innerHTML = `
            <div class="lux-page-shell" data-admin-orders-shell="1" style="display:grid; gap:22px;">
                <section class="lux-card">
                    <div class="lux-card-body" style="display:grid; grid-template-columns:minmax(0,1.2fr) minmax(280px,0.8fr); gap:22px; align-items:start;">
                        <div id="admin-orders-hero-main"></div>
                        <aside>
                            <div class="lux-stat-grid" id="admin-orders-hero-stats"></div>
                        </aside>
                    </div>
                </section>

                <div style="display:grid; grid-template-columns:minmax(340px, 420px) minmax(0, 1fr); gap:22px; align-items:start;">
                    <div style="display:flex; flex-direction:column; gap:18px;">
                        <section class="lux-card">
                            <div class="lux-card-body" id="admin-orders-recipients-panel"></div>
                        </section>

                        <section class="lux-card">
                            <div class="lux-card-body" id="admin-orders-compose-panel"></div>
                        </section>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:18px;">
                        <section class="lux-card">
                            <div class="lux-card-body" id="admin-orders-table-panel"></div>
                        </section>

                        <section class="lux-card">
                            <div class="lux-card-body" id="admin-orders-detail-panel"></div>
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
        <div class="page-hero-title" style="margin-top:12px;">Orders Command Center</div>
        <div class="lux-card-copy">
            Search ${escapeHtml(facultyLabel)} students, professors, and teaching assistants, then issue orders in bulk from one place. Every recipient sees the final order in their own Orders inbox.
        </div>
        <div class="lux-pill-row" style="margin-top:18px;">
            <span class="lux-status-pill is-muted"><i class="fas fa-layer-group"></i> Admin workspace</span>
            <span class="lux-status-pill is-muted"><i class="fas fa-bolt"></i> Auto sync</span>
        </div>
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:22px;">
            <button class="lux-primary-btn" type="button" data-admin-orders-nav-home="1"><i class="fas fa-arrow-left"></i> Back to CMS</button>
        </div>
    `;
}

function renderAdminOrdersHeroStats(orderCount, recipientFootprint, ordersToday) {
    return `
        <div class="lux-stat-card lux-summary-surface lux-summary-surface--panel">
            <div class="lux-stat-label"><i class="fas fa-paper-plane"></i> Sent Orders</div>
            <div class="lux-stat-value">${orderCount}</div>
        </div>
        <div class="lux-stat-card lux-summary-surface lux-summary-surface--panel">
            <div class="lux-stat-label"><i class="fas fa-users"></i> Recipients Covered</div>
            <div class="lux-stat-value">${recipientFootprint}</div>
        </div>
        <div class="lux-stat-card lux-summary-surface lux-summary-surface--panel">
            <div class="lux-stat-label"><i class="fas fa-calendar-day"></i> Created Today</div>
            <div class="lux-stat-value">${ordersToday}</div>
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
            style: 'cursor:pointer;'
        }
    });
}

function createAdminRecipientRow(user, selectedRecipientSet) {
    const selected = selectedRecipientSet.has(String(user.id));
    const label = createOrdersNode('label', {
        attrs: {
            style: `display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-bottom:1px solid var(--lux-border); cursor:pointer; background:${selected ? 'rgba(var(--lux-accent-rgb),0.08)' : 'transparent'};`
        }
    });
    label.appendChild(createOrdersNode('input', {
        attrs: {
            type: 'checkbox',
            ...(selected ? { checked: 'checked' } : {}),
            'data-admin-order-recipient-toggle': String(user.id),
            style: 'margin-top:3px;'
        }
    }));

    const copy = createOrdersNode('div', { attrs: { style: 'flex:1;' } });
    const titleRow = createOrdersNode('div', {
        attrs: {
            style: 'display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;'
        }
    });
    titleRow.appendChild(createOrdersNode('div', {
        attrs: { style: 'font-weight:800; color:var(--lux-text);' },
        text: user.nameEn || user.name || user.id
    }));
    titleRow.appendChild(createOrdersNode('span', {
        className: 'lux-status-pill is-muted',
        text: getOrderRoleLabel(user.role)
    }));
    copy.appendChild(titleRow);
    copy.appendChild(createOrdersNode('div', {
        attrs: { style: 'margin-top:4px; color:var(--lux-text-muted); font-size:12px;' },
        text: user.email || 'No email recorded'
    }));
    const footerBits = [String(user.id)];
    if (user.role === USER_ROLES.STUDENT && user.semester) {
        footerBits.push(`Semester ${String(user.semester)}`);
    }
    copy.appendChild(createOrdersNode('div', {
        attrs: { style: 'margin-top:4px; color:var(--lux-text-dim); font-size:11px;' },
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
        attrs: { style: 'display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;' }
    });
    ['all', USER_ROLES.STUDENT, USER_ROLES.PROFESSOR, USER_ROLES.TA].forEach((role) => {
        filterRow.appendChild(createAdminOrdersRoleFilterButton(role, (uiState.roleFilter || 'all') === role));
    });
    fragment.appendChild(filterRow);

    const actionRow = createOrdersNode('div', {
        attrs: { style: 'display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;' }
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
        attrs: {
            style: 'margin-top:16px; border:1px solid var(--lux-border); border-radius:18px; overflow:hidden;'
        }
    });
    const scroll = createOrdersNode('div', {
        attrs: { style: 'max-height:350px; overflow:auto;' }
    });
    if (filteredRecipients.length) {
        const recipientFragment = document.createDocumentFragment();
        filteredRecipients.forEach((user) => {
            recipientFragment.appendChild(createAdminRecipientRow(user, selectedRecipientSet));
        });
        scroll.appendChild(recipientFragment);
    } else {
        scroll.appendChild(createOrdersNode('div', {
            text: 'No recipients matched the current search.',
            attrs: {
                style: 'padding:34px 18px; text-align:center; color:var(--lux-text-muted);'
            }
        }));
    }
    listShell.appendChild(scroll);
    fragment.appendChild(listShell);

    container.replaceChildren(fragment);
}

function renderAdminOrdersRecipientsPanel(facultyLabel, uiState, filteredRecipients, selectedRecipientSet, selectedRecipients) {
    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">Select Recipients</div>
                <div class="lux-card-copy">Search one person or mark many at once inside ${escapeHtml(facultyLabel)}.</div>
            </div>
            <span class="lux-status-pill is-info">${selectedRecipients.length} selected</span>
        </div>
        <input type="text" class="lux-control" value="${escapeHtml(uiState.search || '')}" data-admin-orders-search="1" placeholder="Search by name, ID, email, or role">
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
            ${['all', USER_ROLES.STUDENT, USER_ROLES.PROFESSOR, USER_ROLES.TA].map(role => {
                const active = (uiState.roleFilter || 'all') === role;
                const label = role === 'all' ? 'All' : getOrderRoleShortLabel(role);
                return '<button type="button" data-admin-orders-role-filter="' + escapeHtml(role) + '" class="lux-status-pill ' + (active ? 'is-info' : 'is-muted') + '" style="cursor:pointer;">' + label + '</button>';
            }).join('')}
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <button class="lux-primary-btn" type="button" data-admin-orders-select-filtered="1"><i class="fas fa-check-double"></i> Select Filtered</button>
            <button class="lux-secondary-btn" type="button" data-admin-orders-clear-recipients="1"><i class="fas fa-eraser"></i> Clear</button>
        </div>
        <div style="margin-top:16px; border:1px solid var(--lux-border); border-radius:18px; overflow:hidden;">
            <div style="max-height:350px; overflow:auto;">
                ${filteredRecipients.length ? filteredRecipients.map(user => '<label style="display:flex; align-items:flex-start; gap:12px; padding:14px 16px; border-bottom:1px solid var(--lux-border); cursor:pointer; background:' + (selectedRecipientSet.has(String(user.id)) ? 'rgba(var(--lux-accent-rgb),0.08)' : 'transparent') + ';"><input type="checkbox" ' + (selectedRecipientSet.has(String(user.id)) ? 'checked' : '') + ' data-admin-order-recipient-toggle="' + escapeHtml(String(user.id)) + '" style="margin-top:3px;"><div style="flex:1;"><div style="display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;"><div style="font-weight:800; color:var(--lux-text);">' + escapeHtml(user.nameEn || user.name || user.id) + '</div><span class="lux-status-pill is-muted">' + escapeHtml(getOrderRoleLabel(user.role)) + '</span></div><div style="margin-top:4px; color:var(--lux-text-muted); font-size:12px;">' + escapeHtml(user.email || 'No email recorded') + '</div><div style="margin-top:4px; color:var(--lux-text-dim); font-size:11px;">' + escapeHtml(user.id) + (user.role === USER_ROLES.STUDENT && user.semester ? ' \u00b7 Semester ' + escapeHtml(String(user.semester)) : '') + '</div></div></label>').join('') : '<div style="padding:34px 18px; text-align:center; color:var(--lux-text-muted);">No recipients matched the current search.</div>'}
            </div>
        </div>
    `;
}

function renderAdminOrdersComposePanel(uiState, roleCounts, today) {
    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">Compose Order</div>
                <div class="lux-card-copy">This order will appear in the selected users' Orders page.</div>
            </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 170px; gap:12px; margin-top:16px;">
            <input type="text" class="lux-control" value="${escapeHtml(uiState.draft.title || '')}" data-admin-order-draft-input="title" placeholder="Order title">
            <select class="lux-control" data-admin-order-draft-change="type">
                ${['General Order', 'Registration Order', 'Academic Order', 'Financial Order', 'Scholarship Order', 'HR Order'].map(type => '<option value="' + escapeHtml(type) + '" ' + ((uiState.draft.type || 'General Order') === type ? 'selected' : '') + '>' + escapeHtml(type) + '</option>').join('')}
            </select>
        </div>
        <div style="display:grid; gap:12px; margin-top:12px;">
            <input type="date" class="lux-control" value="${escapeHtml(uiState.draft.effectiveDate || today)}" data-admin-order-draft-change="effectiveDate">
            <textarea class="lux-control" data-admin-order-draft-input="description" placeholder="Write the full order description that recipients should see." style="min-height:150px; resize:vertical;">${escapeHtml(uiState.draft.description || '')}</textarea>
        </div>
        <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
            <span class="lux-status-pill is-info">${roleCounts[USER_ROLES.STUDENT] || 0} students</span>
            <span class="lux-status-pill is-success">${roleCounts[USER_ROLES.PROFESSOR] || 0} professors</span>
            <span class="lux-status-pill is-warning">${roleCounts[USER_ROLES.TA] || 0} TAs</span>
        </div>
        <button class="lux-primary-btn" type="button" data-admin-orders-send="1" style="width:100%; margin-top:16px;"><i class="fas fa-paper-plane"></i> Send Order</button>
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
        <div style="overflow:auto;">
            <table style="width:100%; border-collapse:separate; border-spacing:0; border-radius:20px; overflow:hidden; border:1px solid var(--lux-border); min-width:760px;">
                <thead>
                    <tr>
                        <th style="text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--lux-text-muted); font-weight:800; padding:14px 12px; border-bottom:1px solid var(--lux-border); background:rgba(255,255,255,0.04);">Order</th>
                        <th style="text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--lux-text-muted); font-weight:800; padding:14px 12px; border-bottom:1px solid var(--lux-border); background:rgba(255,255,255,0.04);">Recipients</th>
                        <th style="text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--lux-text-muted); font-weight:800; padding:14px 12px; border-bottom:1px solid var(--lux-border); background:rgba(255,255,255,0.04);">Created</th>
                        <th style="text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--lux-text-muted); font-weight:800; padding:14px 12px; border-bottom:1px solid var(--lux-border); background:rgba(255,255,255,0.04);">Effective</th>
                        <th style="text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.12em; color:var(--lux-text-muted); font-weight:800; padding:14px 12px; border-bottom:1px solid var(--lux-border); background:rgba(255,255,255,0.04);">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.length ? orders.map(order => '<tr style="background:' + (selectedOrder && selectedOrder.id === order.id ? 'rgba(var(--lux-accent-rgb),0.06)' : 'transparent') + ';"><td style="padding:14px 12px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--lux-text);"><div style="font-weight:800;">' + escapeHtml(order.title) + '</div><div style="margin-top:4px; color:var(--lux-text-muted); font-size:12px;">' + escapeHtml(order.id) + ' \u00b7 ' + escapeHtml(order.type) + '</div></td><td style="padding:14px 12px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--lux-text); font-size:12px;">' + (order.recipientCount || (order.recipientIds ? order.recipientIds.length : 0)) + '</td><td style="padding:14px 12px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--lux-text); font-size:12px;">' + escapeHtml(order.createdDate || '\u2014') + '</td><td style="padding:14px 12px; border-bottom:1px solid rgba(255,255,255,0.04); color:var(--lux-text); font-size:12px;">' + escapeHtml(order.effectiveDate || '\u2014') + '</td><td style="padding:14px 12px; border-bottom:1px solid rgba(255,255,255,0.04);"><div style="display:flex; gap:8px; flex-wrap:wrap;"><button type="button" class="lux-secondary-btn" data-admin-order-view="' + escapeHtml(order.id) + '" style="padding:8px 12px;">View</button><button type="button" data-admin-order-delete="' + escapeHtml(order.id) + '" style="padding:8px 12px; border-radius:10px; border:1px solid var(--lux-border); background:rgba(248,113,113,0.12); color:#ffd2d2; font-weight:700; cursor:pointer;">Delete</button></div></td></tr>').join('') : '<tr><td colspan="5" style="padding:42px 14px; text-align:center; color:var(--lux-text-muted);">No orders have been sent for this faculty yet.</td></tr>'}
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
        titleStyle: 'font-size:22px; font-weight:800; color:var(--lux-text);'
    });
}

function renderRecipientOrdersHeroStats(ordersCount, unreadCount, ordersToday) {
    return `
        <div class="lux-stat-card lux-summary-surface lux-summary-surface--panel">
            <div class="lux-stat-label"><i class="fas fa-paper-plane"></i> Sent Orders</div>
            <div class="lux-stat-value">${ordersCount}</div>
        </div>
        <div class="lux-stat-card lux-summary-surface lux-summary-surface--panel">
            <div class="lux-stat-label"><i class="fas fa-envelope-open-text"></i> Unread</div>
            <div class="lux-stat-value">${unreadCount}</div>
        </div>
        <div class="lux-stat-card lux-summary-surface lux-summary-surface--panel">
            <div class="lux-stat-label"><i class="fas fa-calendar-day"></i> Delivered Today</div>
            <div class="lux-stat-value">${ordersToday}</div>
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
        return `<button type="button" data-recipient-order-status="${escapeHtml(status)}" class="orders-status-filter ${active ? 'is-active' : ''}" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`;
    }).join('');

    const orderRows = orders.length ? orders.map((order) => {
        const isRead = isOrderReadByUser(order.id, currentUser.id);
        const isActive = selectedOrder?.id === order.id;
        return `
            <button type="button" class="orders-item ${isActive ? 'is-active' : ''}" data-recipient-order-open="${escapeHtml(order.id)}">
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                    <div style="min-width:0;">
                        <div class="orders-item__title">${escapeHtml(order.title)}</div>
                        <div class="orders-item__meta">${escapeHtml(order.type)} &middot; Effective ${escapeHtml(getOrderDisplayValue(order.effectiveDate))}</div>
                    </div>
                    <span class="orders-item__state ${isRead ? 'is-read' : 'is-unread'}" style="background:${isRead ? 'rgba(255,255,255,0.06)' : 'rgba(var(--lux-accent-rgb),0.14)'}; color:${isRead ? 'var(--lux-text-muted)' : 'var(--lux-text)'};">${isRead ? 'Read' : 'Unread'}</span>
                </div>
                <div class="orders-item__meta">${escapeHtml(order.id)} &middot; Sent ${escapeHtml(getOrderDisplayValue(order.createdDate))} by ${escapeHtml(order.createdByName || 'Administrator')}</div>
            </button>
        `;
    }).join('') : `<div style="padding:44px 18px; text-align:center; color:var(--lux-text-muted);">No orders matched your current search.</div>`;

    return `
        <div class="lux-card-head">
            <div>
                <div class="lux-card-title">My Orders</div>
                <div class="lux-card-copy">Official decisions delivered to your account.</div>
            </div>
            <span class="lux-status-pill is-info">${allOrders.length} total</span>
        </div>
        <input type="text" class="lux-control" value="${escapeHtml(uiState.search || '')}" data-recipient-order-search="1" placeholder="Search by order title, type, or date">
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:14px;">${statusButtons}</div>
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
        titleStyle: 'font-size:clamp(26px, 2.4vw, 38px); line-height:1.02;'
    });
}

function renderOrdersInboxPage() {
    const container = document.getElementById('page-orders')
        || document.getElementById('orders-inbox-root')
        || (getEffectiveUserRole() !== USER_ROLES.ADMIN ? document.getElementById('admin-orders-root') : null);
    if (!container) return;
    bindOrdersWorkspaceDelegates();
    ensureOrdersInboxFadeOverrides();

    const currentUser = getCurrentUser();
    const effectiveRole = getEffectiveUserRole();
    if (!currentUser || effectiveRole === USER_ROLES.ADMIN) return;

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
