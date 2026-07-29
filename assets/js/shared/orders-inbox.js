/* Recipient orders inbox runtime. Shared primitives live in orders-runtime-core.js. */

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

function buildRecipientOrdersListContentSignature(uiState, allOrders, orders, currentUser) {
    return [
        String(currentUser?.id || ''),
        uiState.status || 'all',
        allOrders.length,
        orders.map((order) => `${order.id}:${isOrderReadByUser(order.id, currentUser?.id) ? 'read' : 'unread'}`).join('|')
    ].join('|');
}

function buildRecipientOrdersListSelectionKey(selectedOrder) {
    return String(selectedOrder?.id || '');
}

function buildRecipientOrdersHeroSignature(currentUser, allOrders, unreadCount, ordersToday) {
    return [
        String(currentUser?.id || ''),
        unreadCount,
        allOrders.length,
        ordersToday
    ].join('|');
}

function getRecipientOrdersEmptyMessage(uiState, allOrders) {
    const hasSearch = String(uiState.search || '').trim().length > 0;
    const hasStatusFilter = uiState.status && uiState.status !== 'all';
    if (!allOrders.length) return 'No orders have been delivered to your account yet.';
    if (hasSearch && hasStatusFilter) return 'No orders matched your search and status filter.';
    if (hasSearch) return 'No orders matched your search.';
    if (hasStatusFilter) return `No ${uiState.status} orders right now.`;
    return 'No orders matched your current filters.';
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
        rightBadges.push(`<span class="lux-status-pill is-success home-hover-chip">${escapeHtml(selectedOrder.status || 'Active')}</span>`);
    }
    if (options.showSenderPill) {
        rightBadges.push(`<span class="lux-status-pill is-muted home-hover-chip">From ${escapeHtml(selectedOrder.createdByName || 'Administration')}</span>`);
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
                        : `<span class="lux-status-pill is-muted home-hover-chip">No file URL</span>`}
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
function ensureRecipientOrdersShell(container) {
    if (!container.querySelector('[data-orders-inbox-shell="1"]')) {
        container.innerHTML = `
            <div class="lux-page-shell orders-inbox-shell" data-orders-inbox-shell="1" data-lux-glass-root="1">
                <section class="lux-card surface-card orders-inbox-hero lux-summary-surface lux-summary-surface--hero">
                    <div class="lux-card-body lux-hero-stage orders-inbox-hero-stage">
                        <div id="orders-inbox-hero-main" class="lux-hero-main"></div>
                        <aside id="orders-inbox-hero-stats" class="lux-hero-side orders-inbox-hero-side lux-focus-panel home-hover-chip" aria-label="Orders inbox status"></aside>
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

function createRecipientOrdersStatusButton(status, active) {
    const label = status.charAt(0).toUpperCase() + status.slice(1);
    return createOrdersNode('button', {
        className: `orders-status-filter lux-filter-pill home-hover-chip ${active ? 'is-active' : ''}`.trim(),
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
        className: `orders-item__state lux-status-pill home-hover-chip ${isRead ? 'is-muted' : 'is-info'} home-hover-chip`.trim(),
        text: isRead ? 'Read' : 'Unread'
    }));

    button.appendChild(topRow);
    button.appendChild(createOrdersNode('div', {
        className: 'orders-item__meta',
        text: `${order.id} · Sent ${getOrderDisplayValue(order.createdDate)} by ${order.createdByName || 'Administrator'}`
    }));
    return button;
}

function syncRecipientOrdersCountPill(container, count) {
    const pill = container.querySelector('.lux-card-head .lux-status-pill');
    if (pill) pill.textContent = `${count} total`;
}

function syncRecipientOrdersStatusPills(container, activeStatus) {
    container.querySelectorAll('[data-recipient-order-status]').forEach((button) => {
        const status = button.dataset.recipientOrderStatus || 'all';
        const active = status === (activeStatus || 'all');
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
}

function syncRecipientOrdersSearchInput(container, value) {
    const input = container.querySelector('[data-recipient-order-search]');
    if (!input || document.activeElement === input) return;
    const nextValue = value || '';
    if (input.value !== nextValue) input.value = nextValue;
}

function syncRecipientOrdersList(listEl, uiState, allOrders, orders, selectedOrder, currentUser) {
    if (!listEl) return;
    const fragment = document.createDocumentFragment();
    if (orders.length) {
        orders.forEach((order) => {
            fragment.appendChild(createRecipientOrdersListItem(order, currentUser, selectedOrder));
        });
    } else {
        fragment.appendChild(createOrdersNode('div', {
            className: 'orders-list-empty',
            text: getRecipientOrdersEmptyMessage(uiState, allOrders),
        }));
    }
    listEl.replaceChildren(fragment);
}

function syncRecipientOrdersListActiveState(listEl, selectedOrder) {
    if (!listEl) return;
    const selectedId = String(selectedOrder?.id || '');
    listEl.querySelectorAll('[data-recipient-order-open]').forEach((button) => {
        const active = (button.dataset.recipientOrderOpen || '') === selectedId;
        button.classList.toggle('is-active', active);
    });
}

function mountRecipientOrdersListPanelRegions(container, uiState, allOrders, orders, selectedOrder, currentUser) {
    const fragment = document.createDocumentFragment();

    const head = createOrdersNode('div', { className: 'lux-card-head' });
    const headCopy = createOrdersNode('div');
    headCopy.appendChild(createOrdersNode('div', { className: 'lux-card-title', text: 'My Orders' }));
    headCopy.appendChild(createOrdersNode('div', { className: 'lux-card-copy', text: 'Official decisions delivered to your account.' }));
    head.appendChild(headCopy);
    head.appendChild(createOrdersNode('span', {
        className: 'lux-status-pill home-hover-chip is-info',
        text: `${allOrders.length} total`
    }));
    fragment.appendChild(head);

    fragment.appendChild(createOrdersNode('input', {
        className: 'lux-control',
        attrs: {
            type: 'text',
            value: uiState.search || '',
            'data-recipient-order-search': '1',
            placeholder: 'Search by order title, type, or date',
            autocomplete: 'off'
        }
    }));

    const statusRow = createOrdersNode('div', {
        className: 'orders-status-row'
    });
    ['all', 'unread', 'read'].forEach((status) => {
        statusRow.appendChild(createRecipientOrdersStatusButton(status, (uiState.status || 'all') === status));
    });
    fragment.appendChild(statusRow);

    const listWrap = createOrdersNode('div', { className: 'orders-list-wrap' });
    const list = createOrdersNode('div', { className: 'orders-list' });
    syncRecipientOrdersList(list, uiState, allOrders, orders, selectedOrder, currentUser);
    listWrap.appendChild(list);
    fragment.appendChild(listWrap);

    container.replaceChildren(fragment);
    container.dataset.recipientOrdersListMounted = '1';
}

function renderRecipientOrdersListPanelRegions(container, uiState, allOrders, orders, selectedOrder, currentUser) {
    if (!container) return;

    const contentSignature = buildRecipientOrdersListContentSignature(uiState, allOrders, orders, currentUser);
    const selectionKey = buildRecipientOrdersListSelectionKey(selectedOrder);

    if (!container.dataset.recipientOrdersListMounted) {
        mountRecipientOrdersListPanelRegions(container, uiState, allOrders, orders, selectedOrder, currentUser);
        container.dataset.recipientOrdersListContentSignature = contentSignature;
        container.dataset.recipientOrdersListSelectionKey = selectionKey;
        return;
    }

    if (container.dataset.recipientOrdersListContentSignature === contentSignature
        && container.dataset.recipientOrdersListSelectionKey === selectionKey) {
        return;
    }

    const prevContentSignature = container.dataset.recipientOrdersListContentSignature || '';
    const listContentChanged = prevContentSignature !== contentSignature;

    syncRecipientOrdersCountPill(container, allOrders.length);
    syncRecipientOrdersStatusPills(container, uiState.status);
    syncRecipientOrdersSearchInput(container, uiState.search);

    const listEl = container.querySelector('.orders-list');
    if (listContentChanged) {
        syncRecipientOrdersList(listEl, uiState, allOrders, orders, selectedOrder, currentUser);
    } else {
        syncRecipientOrdersListActiveState(listEl, selectedOrder);
    }

    container.dataset.recipientOrdersListContentSignature = contentSignature;
    container.dataset.recipientOrdersListSelectionKey = selectionKey;
}

function renderRecipientOrdersHeroMain(currentUser, unreadCount) {
    return `
        <div class="lux-page-kicker"><i class="fas fa-inbox"></i> Orders Inbox</div>
        <div class="page-hero-title orders-hero-title">Official orders and decisions</div>
        <div class="lux-card-copy">Review official orders and institutional decisions sent to your portal account. Orders are shared by administrators and scoped to the groups or people they selected.</div>
        <div class="lux-pill-row orders-hero-pills">
            <span class="lux-pill lux-soft-chrome home-hover-chip"><i class="fas fa-user-shield"></i> ${escapeHtml(getOrderRoleLabel(currentUser.role))}</span>
            <span class="lux-pill lux-soft-chrome home-hover-chip"><i class="fas fa-building"></i> ${escapeHtml(getFacultyLabel(currentUser.facultyCode || currentUser.faculty || getCurrentFaculty()))}</span>
            <span class="lux-pill lux-soft-chrome home-hover-chip"><i class="fas fa-bell"></i> ${unreadCount} unread</span>
        </div>
    `;
}

function renderRecipientOrdersHeroStats(ordersCount, unreadCount, ordersToday) {
    return `
        <div class="lux-focus-panel__head lux-hero-side-head">
            <div class="lux-focus-panel__kicker">Orders inbox</div>
            <span class="lux-focus-panel__chip">${unreadCount} unread</span>
        </div>
        <div class="lux-focus-panel__body">
            <div class="lux-focus-panel__title">${ordersCount} tracked</div>
            <p class="lux-focus-panel__copy">Tracked orders live in the same benchmark widget language used on the home dashboard.</p>
        </div>
        <div class="lux-focus-panel__meta lux-hero-signal-list" aria-label="Order counts">
            <span class="lux-hero-signal home-hover-chip"><span>Sent</span> <strong>${ordersCount}</strong></span>
            <span class="lux-hero-signal home-hover-chip"><span>Unread</span> <strong>${unreadCount}</strong></span>
            <span class="lux-hero-signal home-hover-chip"><span>Today</span> <strong>${ordersToday}</strong></span>
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
        return `<button type="button" data-recipient-order-status="${escapeHtml(status)}" class="orders-status-filter lux-filter-pill home-hover-chip ${active ? 'is-active' : ''}" aria-pressed="${active ? 'true' : 'false'}">${label}</button>`;
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
                    <span class="orders-item__state lux-status-pill ${isRead ? 'is-muted' : 'is-info'} home-hover-chip">${isRead ? 'Read' : 'Unread'}</span>
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
            <span class="lux-status-pill is-info home-hover-chip">${allOrders.length} total</span>
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
    bindRecipientOrdersDelegates();

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
    const ordersToday = allOrders.filter((order) => order.createdDate === today).length;
    const selectedOrder = allOrders.find((order) => order.id === uiState.selectedOrderId) || orders[0] || allOrders[0] || null;
    if (selectedOrder && uiState.selectedOrderId !== selectedOrder.id) {
        uiState.selectedOrderId = selectedOrder.id;
    }

    const shell = ensureRecipientOrdersShell(container);
    if (!shell.heroMain || !shell.heroStats || !shell.listPanel || !shell.detailPanel) return;

    const heroSignature = buildRecipientOrdersHeroSignature(currentUser, allOrders, unreadCount, ordersToday);
    if (shell.heroMain.dataset.renderSignature !== heroSignature) {
        shell.heroMain.innerHTML = renderRecipientOrdersHeroMain(currentUser, unreadCount);
        shell.heroMain.dataset.renderSignature = heroSignature;
    }
    if (shell.heroStats.dataset.renderSignature !== heroSignature) {
        shell.heroStats.innerHTML = renderRecipientOrdersHeroStats(allOrders.length, unreadCount, ordersToday);
        shell.heroStats.dataset.renderSignature = heroSignature;
    }
    renderRecipientOrdersListPanelRegions(shell.listPanel, uiState, allOrders, orders, selectedOrder, currentUser);
    renderRecipientOrdersDetailRegions(shell.detailPanel, selectedOrder);

}

let recipientOrdersDelegatesBound = false;

function bindRecipientOrdersDelegates() {
    if (recipientOrdersDelegatesBound) return;
    recipientOrdersDelegatesBound = true;

    document.addEventListener('click', (event) => {
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
        if (event.target.matches('[data-recipient-order-search]')) {
            updateRecipientOrdersSearch(event.target.value);
        }
    });
}

function shouldAutoBootOrdersInboxOnScriptLoad() {
    return !document.body?.classList?.contains('lux-route-orders');
}

if (shouldAutoBootOrdersInboxOnScriptLoad()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderOrdersInboxPage, { once: true });
    } else {
        renderOrdersInboxPage();
    }
}

