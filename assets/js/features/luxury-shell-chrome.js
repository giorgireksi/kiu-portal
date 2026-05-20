/* Luxury shell chrome runtime extracted from index-luxury.js. */

function getLuxurySharedConfig() {
    return window.__KIU_LUXURY_SHARED || {};
}

function getRoleLabels() {
    const roleLabels = getLuxurySharedConfig().ROLE_LABELS;
    return roleLabels && typeof roleLabels === 'object' ? roleLabels : {};
}

function getPageLabels() {
    const pageLabels = getLuxurySharedConfig().PAGE_LABELS;
    return pageLabels && typeof pageLabels === 'object' ? pageLabels : {};
}

function getNavByRole() {
    const navByRole = getLuxurySharedConfig().NAV_BY_ROLE;
    return navByRole && typeof navByRole === 'object' ? navByRole : {};
}

function pageLabel(pageId) {
    const sharedPageLabel = getLuxurySharedConfig().pageLabel;
    if (typeof sharedPageLabel === 'function') return sharedPageLabel(pageId);
    return getPageLabels()[pageId] || 'Dashboard';
}

function pageTarget(pageId) {
    const sharedPageTarget = getLuxurySharedConfig().pageTarget;
    if (typeof sharedPageTarget === 'function') return sharedPageTarget(pageId);
    return pageId === 'profile' ? 'profile-view' : pageId;
}

function queueAccessibleFocus(target) {
    if (!target || typeof target.focus !== 'function') return;
    const schedule = window.requestAnimationFrame || ((cb) => window.setTimeout(cb, 0));
    schedule(() => {
        try {
            target.focus({ preventScroll: true });
        } catch (error) {
            target.focus();
        }
    });
}

function focusFirstInteractive(root, preferredSelector = '') {
    if (!root || typeof root.querySelector !== 'function') return;
    const selectors = [
        preferredSelector,
        'button:not([disabled])',
        '[href]',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].filter(Boolean);
    for (const selector of selectors) {
        const target = root.querySelector(selector);
        if (!target) continue;
        queueAccessibleFocus(target);
        return;
    }
}

function restoreFocusById(elementId) {
    if (!elementId) return;
    queueAccessibleFocus(document.getElementById(elementId));
}

function deferRestoreFocusById(elementId) {
    if (!elementId) return;
    window.setTimeout(() => restoreFocusById(elementId), 40);
}

function restoreTeleportedNode(node) {
    if (!node || node.dataset.teleported !== 'true' || !node.dataset.originalParentId) return;
    const originalParent = document.getElementById(node.dataset.originalParentId);
    if (originalParent) {
        originalParent.appendChild(node);
        node.style.position = '';
        node.style.top = '';
        node.style.left = '';
        node.style.width = '';
        node.style.zIndex = '';
    }
    node.dataset.teleported = 'false';
}

function closeUtilityPanels(options = {}) {
    const openPanels = Array.from(document.querySelectorAll('.lux-utility-panel.is-open'));
    const restoreTargetId = options.restoreFocus ? (openPanels[0]?.dataset.triggerId || '') : '';
    openPanels.forEach((panel) => {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        restoreTeleportedNode(panel);
    });
    ['lux-notification-btn', 'lux-chat-btn'].forEach((buttonId) => {
        const button = document.getElementById(buttonId);
        if (!button) return;
        button.classList.remove('is-active');
        button.setAttribute('aria-expanded', 'false');
    });
    if (restoreTargetId) {
        restoreFocusById(restoreTargetId);
        deferRestoreFocusById(restoreTargetId);
    }
}

function ensureTopbarUtilityPanel(panelId) {
    const existing = document.getElementById(panelId);
    if (existing) return existing;
    const buttonId = panelId === 'lux-chat-panel' ? 'lux-chat-btn' : 'lux-notification-btn';
    const button = document.getElementById(buttonId);
    const wrapper = button?.closest('.lux-utility-wrap');
    if (!wrapper) return null;
    const panel = document.createElement('div');
    panel.className = 'lux-utility-panel';
    panel.id = panelId;
    panel.dataset.triggerId = buttonId;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-label', panelId === 'lux-chat-panel' ? 'Messenger panel' : 'Notifications panel');
    panel.tabIndex = -1;
    wrapper.appendChild(panel);
    return panel;
}

function ensureUserMenu() {
    const existing = document.getElementById('lux-user-menu');
    if (existing) return existing;
    const chip = document.getElementById('lux-user-chip');
    if (!chip) return null;
    const menu = document.createElement('div');
    menu.className = 'lux-user-menu';
    menu.id = 'lux-user-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML = `
        <button type="button" role="menuitem" data-nav-target="profile-view">Profile</button>
        <button type="button" role="menuitem" data-nav-target="social">Social</button>
        <button type="button" role="menuitem" data-action="clear-cache"><i class="fas fa-broom"></i> Clear cache</button>
        <button type="button" role="menuitem" data-action="logout">Logout</button>
    `;
    (chip.parentElement || chip).appendChild(menu);
    return menu;
}

function closeUserMenu(options = {}) {
    const menu = document.getElementById('lux-user-menu');
    const chip = document.getElementById('lux-user-chip');
    const restoreTargetId = menu?.dataset.triggerId || chip?.id || '';
    if (menu) {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        restoreTeleportedNode(menu);
    }
    if (chip) chip.setAttribute('aria-expanded', 'false');
    if (options.restoreFocus) {
        restoreFocusById(restoreTargetId);
        deferRestoreFocusById(restoreTargetId);
    }
}

function ensureShellPickerPanel(panelId) {
    const existing = document.getElementById(panelId);
    if (existing) return existing;
    const buttonId = panelId === 'lux-role-picker-panel' ? 'lux-role-picker-btn' : 'lux-faculty-picker-btn';
    const button = document.getElementById(buttonId);
    const wrapper = button?.closest('.lux-picker-wrap');
    if (!wrapper) return null;
    const panel = document.createElement('div');
    panel.className = 'lux-picker-panel';
    panel.id = panelId;
    panel.dataset.triggerId = buttonId;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('aria-label', panelId === 'lux-role-picker-panel' ? 'Role switcher' : 'Faculty switcher');
    panel.tabIndex = -1;
    wrapper.appendChild(panel);
    return panel;
}

function toggleUtilityPanel(panelId, buttonId) {
    const button = document.getElementById(buttonId);
    const panel = ensureTopbarUtilityPanel(panelId);
    if (!panel || !button) return;
    const shouldOpen = !panel.classList.contains('is-open');
    closeUtilityPanels();
    if (shouldOpen) {
        if (typeof bootstrapKiuRealtimeBridge === 'function') {
            bootstrapKiuRealtimeBridge(true).then(() => {
                if (!panel.classList.contains('is-open')) return;
                renderTopbarUtilityPanels(typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null);
                focusFirstInteractive(panel, '[data-utility-action], .lux-utility-item, button');
                if (typeof syncTopbar === 'function') syncTopbar();
            }).catch(() => null);
        }
        renderTopbarUtilityPanels(typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null);
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        panel.dataset.triggerId = buttonId;
        button.classList.add('is-active');
        button.setAttribute('aria-expanded', 'true');
        focusFirstInteractive(panel, '[data-utility-action], .lux-utility-item, button');
        if (typeof ensurePortalSocialRuntimeLoaded === 'function') {
            ensurePortalSocialRuntimeLoaded().then(() => {
                if (panel.classList.contains('is-open')) {
                    renderTopbarUtilityPanels(typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null);
                    focusFirstInteractive(panel, '[data-utility-action], .lux-utility-item, button');
                }
            });
        }
    }
}

function closePickerPanels(options = {}) {
    const openPanels = Array.from(document.querySelectorAll('.lux-picker-panel.is-open'));
    const restoreTargetId = options.restoreFocus ? (openPanels[0]?.dataset.triggerId || '') : '';
    openPanels.forEach((panel) => {
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        restoreTeleportedNode(panel);
    });
    document.querySelectorAll('.lux-picker-btn.is-active').forEach((button) => {
        button.classList.remove('is-active');
        button.setAttribute('aria-expanded', 'false');
    });
    if (restoreTargetId) deferRestoreFocusById(restoreTargetId);
}

function togglePickerPanel(panelId, buttonId) {
    const panel = panelId === 'lux-faculty-picker-panel' || panelId === 'lux-role-picker-panel'
        ? ensureShellPickerPanel(panelId)
        : document.getElementById(panelId);
    const button = document.getElementById(buttonId);
    if (!panel || !button) return;
    const shouldOpen = !panel.classList.contains('is-open');
    closePickerPanels();
    if (shouldOpen) {
        const wrapper = panel.parentElement;
        if (wrapper && wrapper.tagName !== 'BODY') {
            if (!wrapper.id) wrapper.id = `lux-wrap-${Math.random().toString(36).substr(2, 9)}`;
            panel.dataset.originalParentId = wrapper.id;
            panel.dataset.teleported = 'true';
            document.body.appendChild(panel);
        }
        const rect = button.getBoundingClientRect();
        const panelWidth = Math.min(320, window.innerWidth - 32);
        panel.style.position = 'absolute';
        panel.style.top = `${rect.bottom + window.scrollY + 8}px`;
        if (rect.left + panelWidth <= window.innerWidth - 16) {
            panel.style.left = `${rect.left + window.scrollX}px`;
        } else if (rect.right - panelWidth > 0) {
            panel.style.left = `${rect.right + window.scrollX - panelWidth}px`;
        } else {
            panel.style.left = '16px';
        }
        panel.style.width = `${panelWidth}px`;
        panel.style.zIndex = '999999';
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        panel.dataset.triggerId = buttonId;
        button.classList.add('is-active');
        button.setAttribute('aria-expanded', 'true');
        focusFirstInteractive(panel, '.lux-picker-option.is-active, .lux-picker-option');
        const scrollHandler = () => {
            closePickerPanels();
            window.removeEventListener('scroll', scrollHandler, true);
        };
        window.addEventListener('scroll', scrollHandler, true);
    }
}

window.closePickerPanels = closePickerPanels;
window.togglePickerPanel = togglePickerPanel;

function openRoleSwitcherPanel() {
    const roleButton = document.getElementById('lux-role-picker-btn');
    const rolePanel = ensureShellPickerPanel('lux-role-picker-panel');
    if (!roleButton || !rolePanel) return false;
    closeStudio();
    closeUtilityPanels();
    closeUserMenu();
    populateRoleSwitcher({ ensurePanel: true });
    togglePickerPanel('lux-role-picker-panel', 'lux-role-picker-btn');
    return rolePanel.classList.contains('is-open');
}

window.openRoleSwitcherPanel = openRoleSwitcherPanel;

function normalizePickerLabel(value) {
    return String(value || '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getCleanPickerLabelText(node) {
    if (!node) return '';
    const clone = node.cloneNode(true);
    clone.querySelectorAll([
        'select',
        'option',
        'button',
        'input',
        'textarea',
        'i',
        'svg',
        '.lux-picker-field',
        '.lux-picker-panel',
        '.lux-picker-copy',
        '.lux-picker-caption',
        '.lux-picker-value',
        '.lux-picker-option',
        '[data-lux-picker-enhanced]'
    ].join(',')).forEach((child) => child.remove());
    return clone.textContent.replace(/\s+/g, ' ').trim();
}

function inferPickerCaption(select) {
    if (!select) return 'Select';
    const explicit = select.getAttribute('aria-label') || select.dataset.luxPickerLabel || select.getAttribute('title');
    if (explicit) return String(explicit).trim();
    if (select.id) {
        const escapedId = window.CSS && typeof window.CSS.escape === 'function'
            ? window.CSS.escape(select.id)
            : String(select.id).replace(/"/g, '\\"');
        const associated = document.querySelector(`label[for="${escapedId}"]`);
        if (associated) {
            const text = getCleanPickerLabelText(associated);
            if (text) return text;
        }
    }
    const previous = select.previousElementSibling;
    if (previous && ((previous.tagName && /label/i.test(previous.tagName)) || previous.classList?.contains('em-lbl') || previous.classList?.contains('pvsm-lbl') || previous.classList?.contains('peg-lbl'))) {
        const text = getCleanPickerLabelText(previous);
        if (text) return text;
    }
    const parentLabel = select.closest('label');
    if (parentLabel) {
        const text = getCleanPickerLabelText(parentLabel);
        if (text) return text;
    }
    const parent = select.parentElement;
    if (parent) {
        const labelNode = parent.querySelector('label');
        if (labelNode) {
            const text = getCleanPickerLabelText(labelNode);
            if (text) return text;
        }
    }
    return normalizePickerLabel(select.name || select.id || 'Select');
}

function buildUniversalPickerPanel(select, panel, button) {
    if (!panel || !select) return;
    const caption = inferPickerCaption(select);
    const currentValue = select.value;
    const options = Array.from(select.options || []);
    panel.innerHTML = options.map((option) => {
        if (option.disabled && !option.selected) return '';
        const active = String(option.value) === String(currentValue);
        const title = option.label || option.textContent || option.value || caption;
        const subtitle = option.dataset?.luxPickerSubtitle || (active ? 'Current selection' : `Choose ${caption.toLowerCase()}`);
        return `
            <button class="lux-picker-option${active ? ' is-active' : ''}" type="button" role="option" aria-selected="${active ? 'true' : 'false'}" data-picker-value="${escapeHtml(option.value)}" data-picker-title="${escapeHtml(title)}">
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(subtitle)}</span>
            </button>
        `;
    }).join('');
    panel.querySelectorAll('[data-picker-value]').forEach((optionButton) => {
        optionButton.addEventListener('click', () => {
            select.value = optionButton.dataset.pickerValue || '';
            select.dispatchEvent(new Event('change', { bubbles: true }));
            if (button) button.setAttribute('aria-expanded', 'false');
            closePickerPanels();
        });
    });
}

function syncUniversalPicker(select, button, panel) {
    if (!select || !button || !panel) return;
    const selected = select.selectedOptions?.[0] || select.options?.[select.selectedIndex] || null;
    const caption = inferPickerCaption(select);
    const valueNode = button.querySelector('.lux-picker-value');
    const captionNode = button.querySelector('.lux-picker-caption');
    if (captionNode) captionNode.textContent = caption;
    if (valueNode) valueNode.textContent = selected ? (selected.label || selected.textContent || selected.value || caption) : caption;
    button.setAttribute('aria-expanded', panel.classList.contains('is-open') ? 'true' : 'false');
}

function shouldEnhanceSelect(select) {
    if (!select || select.dataset.luxPickerEnhanced === 'true') return false;
    if (select.matches('[multiple], [data-lux-native], .library-hidden-select')) return false;
    if (select.closest('#lux-topbar')) return false;
    if (select.closest('.lux-picker-field')) return false;
    if (select.closest('.library-picker-field')) return false;
    return true;
}

function enhanceUniversalPicker(select) {
    if (!shouldEnhanceSelect(select)) return;
    const parent = select.parentElement;
    if (!parent) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'lux-picker-field lux-universal-picker-field';
    const panelId = select.id ? `${select.id}-lux-panel` : `lux-picker-panel-${Math.random().toString(36).slice(2, 10)}`;
    const buttonId = select.id ? `${select.id}-lux-btn` : `lux-picker-btn-${Math.random().toString(36).slice(2, 10)}`;
    const caption = inferPickerCaption(select);
    select.dataset.luxPickerLabel = caption;

    const captionEl = document.createElement('span');
    captionEl.className = 'lux-picker-label';
    captionEl.textContent = caption;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lux-picker-btn lux-universal-picker-btn';
    button.id = buttonId;
    button.setAttribute('aria-haspopup', 'listbox');
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = `
        <div class="lux-picker-copy">
            <span class="lux-picker-caption">${escapeHtml(caption)}</span>
            <strong class="lux-picker-value"></strong>
        </div>
        <i class="fas fa-chevron-down"></i>
    `;

    const panel = document.createElement('div');
    panel.className = 'lux-picker-panel lux-universal-picker-panel';
    panel.id = panelId;
    panel.setAttribute('role', 'listbox');
    panel.setAttribute('aria-hidden', 'true');
    panel.tabIndex = -1;

    wrapper.appendChild(captionEl);
    wrapper.appendChild(button);
    wrapper.appendChild(panel);
    parent.insertBefore(wrapper, select);
    wrapper.appendChild(select);

    select.classList.add('lux-universal-native-select');
    select.dataset.luxPickerEnhanced = 'true';
    select.setAttribute('data-lux-picker-enhanced', 'true');

    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        togglePickerPanel(panelId, buttonId);
    });

    select.addEventListener('change', () => {
        buildUniversalPickerPanel(select, panel, button);
        syncUniversalPicker(select, button, panel);
    });

    if (window.MutationObserver) {
        const observer = new MutationObserver(() => {
            if (!document.contains(select)) {
                observer.disconnect();
                return;
            }
            buildUniversalPickerPanel(select, panel, button);
            syncUniversalPicker(select, button, panel);
        });
        observer.observe(select, { childList: true, subtree: true });
        select._luxPickerObserver = observer;
    }

    buildUniversalPickerPanel(select, panel, button);
    syncUniversalPicker(select, button, panel);
}

function enhanceUniversalPickers(root = document) {
    if (!root || typeof root.querySelectorAll !== 'function') return;
    root.querySelectorAll('select').forEach((select) => enhanceUniversalPicker(select));
}

function observeUniversalPickers() {
    if (window.__luxUniversalPickerObserver || !window.MutationObserver || !document.body) return;
    let pickerTimer = null;
    let pendingNodes = [];
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach((node) => {
                if (!node || node.nodeType !== 1) return;
                pendingNodes.push(node);
            });
        }
        if (!pickerTimer) {
            pickerTimer = setTimeout(() => {
                pickerTimer = null;
                const nodes = pendingNodes.splice(0);
                nodes.forEach((node) => {
                    if (node.tagName === 'SELECT') {
                        enhanceUniversalPicker(node);
                        return;
                    }
                    enhanceUniversalPickers(node);
                });
            }, 200);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__luxUniversalPickerObserver = observer;
}

window.enhanceUniversalPickers = enhanceUniversalPickers;
window.enhanceUniversalPicker = enhanceUniversalPicker;
window.observeUniversalPickers = observeUniversalPickers;

function renderTopbarUtilityPanels(currentUser) {
    const notificationPanel = ensureTopbarUtilityPanel('lux-notification-panel');
    const chatPanel = ensureTopbarUtilityPanel('lux-chat-panel');
    if (!notificationPanel || !chatPanel) return;
    const notifications = typeof getNotificationSnapshot === 'function' ? getNotificationSnapshot(currentUser) : { items: [], unread: 0 };
    const messenger = typeof getMessengerSnapshot === 'function' ? getMessengerSnapshot(currentUser) : { recent: [], unread: 0 };
    const notificationRows = notifications.items.slice(0, 5);
    const chatRows = messenger.recent.slice(0, 5);

    notificationPanel.innerHTML = `
        <div class="lux-utility-head">
            <div>
                <strong>Notifications</strong>
                <span>${notifications.unread > 0 ? `${notifications.unread} unread` : 'Everything reviewed'}</span>
            </div>
            <button class="lux-ghost-btn" type="button" data-utility-action="open-notifications">Open full view</button>
        </div>
        <div class="lux-utility-list">
            ${notificationRows.length ? notificationRows.map((item, index) => `
                <button class="lux-utility-item" type="button" data-notification-key="${escapeHtml(`${item.source || 'school'}:${item.id || index}`)}" data-route-page="${escapeHtml(item.routePage || 'social')}">
                    <div class="lux-utility-item-icon"><i class="${escapeHtml(item.source === 'social' ? 'fas fa-comments' : 'far fa-bell')}"></i></div>
                    <div class="lux-utility-item-copy">
                        <strong>${escapeHtml(typeof cleanupUiText === 'function' ? cleanupUiText(item.title || item.type || 'Notification', 'Notification') : (item.title || 'Notification'))}</strong>
                        <span>${escapeHtml(typeof cleanupUiText === 'function' ? cleanupUiText(item.text || 'New portal activity.', 'New portal activity.') : (item.text || 'New portal activity.'))}</span>
                    </div>
                    <em>${escapeHtml(typeof formatRelativeTime === 'function' ? formatRelativeTime(item.createdAt || item.updatedAt) : '')}</em>
                </button>
            `).join('') : `
                <div class="lux-utility-empty">
                    <strong>No new notifications</strong>
                    <span>Campus alerts, academic updates, and social notifications will appear here.</span>
                </div>
            `}
        </div>
    `;

    chatPanel.innerHTML = `
        <div class="lux-utility-head">
            <div>
                <strong>Messenger</strong>
                <span>${messenger.unread > 0 ? `${messenger.unread} unread` : 'No unread chats'}</span>
            </div>
            <button class="lux-ghost-btn" type="button" data-utility-action="open-messenger">Open full view</button>
        </div>
        <div class="lux-utility-list">
            ${chatRows.length ? chatRows.map((chat) => `
                <button class="lux-utility-item" type="button" data-chat-id="${escapeHtml(chat.id)}">
                    <div class="lux-utility-item-icon"><i class="fas fa-comments"></i></div>
                    <div class="lux-utility-item-copy">
                        <strong>${escapeHtml(chat.title)}</strong>
                        <span>${escapeHtml(chat.preview)}</span>
                    </div>
                    <em>${chat.unread > 0 ? `${chat.unread}` : escapeHtml(chat.when || '')}</em>
                </button>
            `).join('') : `
                <div class="lux-utility-empty">
                    <strong>No active chats</strong>
                    <span>Recent conversations and unread chat messages will appear here.</span>
                </div>
            `}
        </div>
    `;

    notificationPanel.querySelectorAll('[data-utility-action="open-notifications"]').forEach((button) => {
        button.addEventListener('click', () => {
            closeUtilityPanels();
            const launchNotifications = () => {
                if (typeof openPortalNotificationFullModal === 'function') {
                    openPortalNotificationFullModal();
                    return;
                }
                if (typeof navigate === 'function') navigate('social');
            };
            if (typeof ensurePortalSocialRuntimeLoaded === 'function') {
                ensurePortalSocialRuntimeLoaded().then(launchNotifications);
                return;
            }
            launchNotifications();
        });
    });

    notificationPanel.querySelectorAll('[data-notification-key]').forEach((button) => {
        button.addEventListener('click', () => {
            const notificationKey = button.getAttribute('data-notification-key');
            const routePage = button.getAttribute('data-route-page') || 'social';
            if (typeof markPortalNotificationRead === 'function' && notificationKey) {
                markPortalNotificationRead(notificationKey);
            }
            closeUtilityPanels();
            if (routePage && typeof navigate === 'function') navigate(pageTarget(routePage));
            if (typeof syncAll === 'function') syncAll();
        });
    });

    chatPanel.querySelectorAll('[data-utility-action="open-messenger"]').forEach((button) => {
        button.addEventListener('click', () => {
            closeUtilityPanels();
            const launchMessenger = () => {
                if (typeof openPortalMessengerFullModal === 'function') {
                    openPortalMessengerFullModal();
                    return;
                }
                if (typeof openSocialMessengerWorkspace === 'function') {
                    openSocialMessengerWorkspace();
                }
            };
            if (typeof ensurePortalSocialRuntimeLoaded === 'function') {
                ensurePortalSocialRuntimeLoaded().then(launchMessenger);
                return;
            }
            launchMessenger();
        });
    });

    chatPanel.querySelectorAll('[data-chat-id]').forEach((button) => {
        button.addEventListener('click', () => {
            const chatId = button.getAttribute('data-chat-id');
            closeUtilityPanels();
            const launchChat = () => {
                if (chatId && typeof openPortalMessengerChat === 'function') {
                    openPortalMessengerChat(chatId, 'full');
                } else if (typeof openPortalMessengerFullModal === 'function') {
                    openPortalMessengerFullModal();
                }
            };
            if (typeof ensurePortalSocialRuntimeLoaded === 'function') {
                ensurePortalSocialRuntimeLoaded().then(launchChat);
                return;
            }
            launchChat();
        });
    });
}

function renderNav() {
    const role = getEffectiveRole();
    const navRoot = document.getElementById('lux-nav');
    if (!navRoot) return;
    const activePage = getActivePageId();
    const navByRole = getNavByRole();
    const groups = navByRole[role] || navByRole.student || [];
    const signature = `${role}|${activePage}`;
    if (navRoot.dataset.renderSignature === signature) return;
    navRoot.innerHTML = groups.map((group) => `
        <div class="lux-nav-group">${escapeHtml(group.group)}</div>
        ${group.items.map(([pageId, label, icon, badge]) => `
            <button class="lux-nav-item${activePage === pageId ? ' is-active' : ''}" type="button" data-nav-target="${escapeHtml(pageId)}">
                <i class="${escapeHtml(icon)}"></i>
                <span>${escapeHtml(label)}</span>
                ${badge ? `<span class="lux-nav-badge">${escapeHtml(badge)}</span>` : ''}
            </button>
        `).join('')}
    `).join('');
    navRoot.dataset.renderSignature = signature;
    if (navRoot.dataset.bound !== '1') {
        navRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-nav-target]');
            if (!button || !navRoot.contains(button)) return;
            if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
        });
        navRoot.dataset.bound = '1';
    }
}

function ensureStudio() {
    const existingStudio = document.getElementById('lux-studio-backdrop');
    if (existingStudio) return existingStudio;
    const backdrop = document.createElement('div');
    backdrop.id = 'lux-studio-backdrop';
    backdrop.className = 'lux-studio-backdrop';
    backdrop.innerHTML = `
        <div class="lux-studio-panel" role="dialog" aria-label="Luxury theme studio">
            <div class="lux-studio-head">
                <div>
                    <div class="lux-studio-title">Color & Motion Studio</div>
                    <div class="lux-studio-sub">Tune the portal palette and choose the 3D background mood.</div>
                </div>
                <button class="lux-studio-close" id="lux-studio-close" type="button"><i class="fas fa-times"></i></button>
            </div>
            <div class="lux-studio-body">
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Curated Palettes</div>
                    <div class="lux-palette-grid" id="lux-palette-grid"></div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Interface Mode</div>
                    <div class="lux-mode-row">
                        <button class="lux-mode-btn" id="lux-mode-dark" type="button"><i class="fas fa-moon"></i> Dark</button>
                        <button class="lux-mode-btn" id="lux-mode-light" type="button"><i class="fas fa-sun"></i> Light</button>
                    </div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Panel Transparency</div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-layer-group"></i> Opacity Level</span>
                            <span class="lux-transparency-value" id="lux-transparency-value">70%</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-transparency-slider" min="0" max="100" value="70">
                        <div class="lux-transparency-meta">
                            <span><i class="fas fa-eye"></i> Full Transparent (0%)</span>
                            <span><i class="fas fa-eye-slash"></i> Solid (100%)</span>
                        </div>
                    </div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">3D Background</div>
                    <div class="lux-bg-mode-grid" id="lux-bg-mode-grid"></div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Background Animation</div>
                    <div class="lux-mode-row">
                        <button class="lux-mode-btn" id="lux-bg-animation-on" type="button"><i class="fas fa-play"></i> On</button>
                        <button class="lux-mode-btn" id="lux-bg-animation-off" type="button"><i class="fas fa-pause"></i> Off</button>
                    </div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Motion Intensity</div>
                    <div class="lux-control-grid" id="lux-bg-intensity-grid"></div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Glow Strength</div>
                    <div class="lux-control-grid" id="lux-glow-strength-grid"></div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Default & Reset</div>
                    <div class="lux-reset-grid">
                        <button class="lux-control-btn" id="lux-reset-visuals" type="button"><strong>Reset visual settings</strong><span>Theme, palette, glow, and motion.</span></button>
                        <button class="lux-control-btn" id="lux-reset-current-layout" type="button"><strong>Reset current role layout</strong><span>Restore the active dashboard to its KIU default.</span></button>
                        <button class="lux-control-btn" id="lux-reset-all-layouts" type="button"><strong>Reset all role layouts</strong><span>Clear every saved dashboard arrangement for this user.</span></button>
                        <button class="lux-control-btn" id="lux-reset-home-defaults" type="button"><strong>Reset home to KIU defaults</strong><span>Reset both layouts and visual settings without touching portal data.</span></button>
                    </div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Custom Accent Mix</div>
                    <div class="lux-mix-label">Color A <div id="lux-swatch-a" class="lux-mix-swatch"></div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Hue</div><input type="range" class="lux-range" id="lux-hA" min="0" max="360" value="30"><div class="lux-range-value" id="lux-hA-value">30 deg</div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Saturation</div><input type="range" class="lux-range" id="lux-sA" min="0" max="100" value="72"><div class="lux-range-value" id="lux-sA-value">72%</div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Lightness</div><input type="range" class="lux-range" id="lux-lA" min="20" max="80" value="48"><div class="lux-range-value" id="lux-lA-value">48%</div></div>
                    <div class="lux-mix-label">Color B <div id="lux-swatch-b" class="lux-mix-swatch"></div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Hue</div><input type="range" class="lux-range" id="lux-hB" min="0" max="360" value="45"><div class="lux-range-value" id="lux-hB-value">45 deg</div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Saturation</div><input type="range" class="lux-range" id="lux-sB" min="0" max="100" value="80"><div class="lux-range-value" id="lux-sB-value">80%</div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Lightness</div><input type="range" class="lux-range" id="lux-lB" min="20" max="80" value="58"><div class="lux-range-value" id="lux-lB-value">58%</div></div>
                    <div class="lux-range-row"><div class="lux-range-text">Mix</div><input type="range" class="lux-range" id="lux-mix-ratio" min="0" max="100" value="50"><div class="lux-range-value" id="lux-mix-value">50%</div></div>
                    <div class="lux-mix-preview" id="lux-mix-preview"><div class="lux-mix-preview-label" id="lux-mix-preview-label">hsl(37, 76%, 53%)</div></div>
                    <button class="lux-apply-btn" id="lux-apply-mix" type="button">Apply Custom Mix</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
    if (typeof writeStudioMixerInputs === 'function' && typeof getStudioMixerState === 'function') {
        writeStudioMixerInputs(getStudioMixerState());
    }
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeStudio();
    });
    document.getElementById('lux-studio-close')?.addEventListener('click', () => closeStudio({ restoreFocus: true }));
    document.getElementById('lux-mode-dark')?.addEventListener('click', () => {
        applyThemeMode('dark', true);
        if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
    });
    document.getElementById('lux-mode-light')?.addEventListener('click', () => {
        applyThemeMode('light', true);
        if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
    });
    document.getElementById('lux-bg-animation-on')?.addEventListener('click', () => {
        if (typeof setBackgroundAnimationsEnabled === 'function') setBackgroundAnimationsEnabled(true, true);
    });
    document.getElementById('lux-bg-animation-off')?.addEventListener('click', () => {
        if (typeof setBackgroundAnimationsEnabled === 'function') setBackgroundAnimationsEnabled(false, true);
    });
    const transparencySlider = document.getElementById('lux-transparency-slider');
    const transparencyValue = document.getElementById('lux-transparency-value');
    if (transparencySlider) {
        const savedTransparency = getDashboardVisuals().surfaceTransparency || localStorage.getItem('kiuLuxurySurfaceTransparency');
        if (savedTransparency) {
            transparencySlider.value = savedTransparency;
            if (transparencyValue) transparencyValue.textContent = `${savedTransparency}%`;
            if (typeof updateTransparency === 'function') updateTransparency(parseInt(savedTransparency, 10));
        }
        transparencySlider.addEventListener('input', (e) => {
            const value = e.target.value;
            if (transparencyValue) transparencyValue.textContent = `${value}%`;
            setDashboardVisuals({ surfaceTransparency: String(value) });
            if (typeof updateTransparency === 'function') updateTransparency(parseInt(value, 10));
        });
    }
    document.getElementById('lux-apply-mix')?.addEventListener('click', () => {
        const mixerState = setStudioMixerState(readStudioMixerInputs(), true);
        const mixed = mixHsl(mixerState.hA, mixerState.sA, mixerState.lA, mixerState.hB, mixerState.sB, mixerState.lB, mixerState.ratio / 100);
        const mixed2 = mixHsl(mixerState.hA, mixerState.sA, mixerState.lA, mixerState.hB, mixerState.sB, mixerState.lB, Math.min((mixerState.ratio / 100) + 0.15, 1));
        applyCustomPalette(`hsl(${Math.round(mixed[0])},${Math.round(mixed[1])}%,${Math.round(mixed[2])}%)`, `hsl(${Math.round(mixed2[0])},${Math.round(mixed2[1])}%,${Math.round(mixed2[2])}%)`, true);
        if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
        if (typeof showToast === 'function') showToast('Custom palette applied');
    });
    STUDIO_PALETTES.forEach((palette) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'lux-palette-chip';
        chip.dataset.paletteKey = palette.key;
        chip.style.background = `linear-gradient(135deg, hsl(${palette.hA},${palette.sA}%,${palette.lA}%), hsl(${palette.hB},${palette.sB}%,${palette.lB}%))`;
        chip.innerHTML = `<span>${escapeHtml(palette.name)}</span>`;
        chip.addEventListener('click', () => {
            writeStudioMixerInputs(setStudioMixerState({
                hA: palette.hA, sA: palette.sA, lA: palette.lA,
                hB: palette.hB, sB: palette.sB, lB: palette.lB, ratio: 50
            }, true));
            if (isBuiltInLuxuryPaletteKey(palette.key)) {
                applyPaletteKey(palette.key, true);
            } else {
                const customColors = buildStudioPaletteCustomColors(palette);
                applyCustomPalette(customColors.accent, customColors.accent2, true);
            }
            updateStudioPreview();
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
        });
        document.getElementById('lux-palette-grid')?.appendChild(chip);
    });
    BACKGROUND_MODES.forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-bg-mode-btn';
        button.dataset.bgMode = mode.key;
        button.innerHTML = `<i class="${escapeHtml(mode.icon)}"></i><strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.copy)}</span>`;
        button.addEventListener('click', () => {
            setBackgroundMode(mode.key, true);
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
        });
        document.getElementById('lux-bg-mode-grid')?.appendChild(button);
    });
    BACKGROUND_INTENSITIES.forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-control-btn';
        button.dataset.bgIntensity = mode.key;
        button.innerHTML = `<strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.copy)}</span>`;
        button.addEventListener('click', () => {
            setBackgroundIntensity(mode.key, true);
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
        });
        document.getElementById('lux-bg-intensity-grid')?.appendChild(button);
    });
    GLOW_STRENGTHS.forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-control-btn';
        button.dataset.glowStrength = mode.key;
        button.innerHTML = `<strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.copy)}</span>`;
        button.addEventListener('click', () => {
            setGlowStrength(mode.key, true);
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
        });
        document.getElementById('lux-glow-strength-grid')?.appendChild(button);
    });
    document.getElementById('lux-reset-visuals')?.addEventListener('click', () => {
        if (window.confirm('Reset visual settings for this portal profile?')) resetVisualSettings();
    });
    document.getElementById('lux-reset-current-layout')?.addEventListener('click', () => {
        const role = getEffectiveRole();
        if (!window.confirm(`Reset the ${getRoleLabels()[role] || 'current'} layout to KIU defaults?`)) return;
        if (HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === role) {
            resetCurrentRoleLayoutDraft(role, buildHomeModel(role));
            return;
        }
        resetSavedRoleLayout(role);
    });
    document.getElementById('lux-reset-all-layouts')?.addEventListener('click', () => {
        if (window.confirm('Reset every saved dashboard layout for this user?')) resetAllSavedHomeLayouts();
    });
    document.getElementById('lux-reset-home-defaults')?.addEventListener('click', () => {
        if (window.confirm('Reset all home layouts and visual settings to the KIU defaults?')) resetHomeToDefaults();
    });
    ['lux-hA', 'lux-sA', 'lux-lA', 'lux-hB', 'lux-sB', 'lux-lB', 'lux-mix-ratio'].forEach((id) => {
        document.getElementById(id)?.addEventListener('input', () => {
            setStudioMixerState(readStudioMixerInputs(), true);
            updateStudioPreview();
        });
    });
    if (!document.body.dataset.luxStudioEscBound) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') closeStudio({ restoreFocus: true });
        });
        document.body.dataset.luxStudioEscBound = '1';
    }
    updateStudioPreview();
    syncStudioUi();
    return backdrop;
}

function updateStudioPreview() {
    const mixerState = readStudioMixerInputs();
    const mixed = mixHsl(mixerState.hA, mixerState.sA, mixerState.lA, mixerState.hB, mixerState.sB, mixerState.lB, mixerState.ratio / 100);
    const mixed2 = mixHsl(mixerState.hA, mixerState.sA, mixerState.lA, mixerState.hB, mixerState.sB, mixerState.lB, Math.min((mixerState.ratio / 100) + 0.15, 1));
    const rgb = hslToRgb(mixed[0], mixed[1], mixed[2]);
    const preview = document.getElementById('lux-mix-preview');
    const previewLabel = document.getElementById('lux-mix-preview-label');
    if (preview) preview.style.background = `linear-gradient(135deg, hsl(${mixed[0]},${mixed[1]}%,${mixed[2]}%), hsl(${mixed2[0]},${mixed2[1]}%,${mixed2[2]}%))`;
    if (previewLabel) {
        previewLabel.textContent = `hsl(${Math.round(mixed[0])}, ${Math.round(mixed[1])}%, ${Math.round(mixed[2])}%)`;
        previewLabel.style.color = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) > 140 ? 'rgba(0,0,0,0.72)' : 'rgba(255,255,255,0.92)';
    }
    const bindings = {
        'lux-hA-value': `${mixerState.hA} deg`,
        'lux-sA-value': `${mixerState.sA}%`,
        'lux-lA-value': `${mixerState.lA}%`,
        'lux-hB-value': `${mixerState.hB} deg`,
        'lux-sB-value': `${mixerState.sB}%`,
        'lux-lB-value': `${mixerState.lB}%`,
        'lux-mix-value': `${Math.round(mixerState.ratio)}%`
    };
    Object.entries(bindings).forEach(([id, value]) => {
        const target = document.getElementById(id);
        if (target) target.textContent = value;
    });
    const swatchA = document.getElementById('lux-swatch-a');
    const swatchB = document.getElementById('lux-swatch-b');
    if (swatchA) swatchA.style.background = `hsl(${mixerState.hA},${mixerState.sA}%,${mixerState.lA}%)`;
    if (swatchB) swatchB.style.background = `hsl(${mixerState.hB},${mixerState.sB}%,${mixerState.lB}%)`;
}

function syncStudioUi() {
    const studio = document.getElementById('lux-studio-backdrop');
    if (!studio) return;
    const showHomeLayoutControls = getActivePageId() === 'home';
    const currentKey = resolvePaletteKey();
    const customPalette = resolveCustomPalette();
    const palette = STUDIO_PALETTES.find((item) => item.key === currentKey);
    const mixerState = currentKey === 'custom' && resolveCustomPalette()
        ? getStudioMixerState()
        : sanitizeStudioMixerState({
            hA: palette?.hA ?? DEFAULT_STUDIO_MIXER.hA,
            sA: palette?.sA ?? DEFAULT_STUDIO_MIXER.sA,
            lA: palette?.lA ?? DEFAULT_STUDIO_MIXER.lA,
            hB: palette?.hB ?? DEFAULT_STUDIO_MIXER.hB,
            sB: palette?.sB ?? DEFAULT_STUDIO_MIXER.sB,
            lB: palette?.lB ?? DEFAULT_STUDIO_MIXER.lB,
            ratio: 50
        });
    writeStudioMixerInputs(mixerState);
    updateStudioPreview();
    studio.querySelectorAll('[data-palette-key]').forEach((chip) => {
        const chipPalette = STUDIO_PALETTES.find((item) => item.key === chip.dataset.paletteKey);
        const isCustomMatch = currentKey === 'custom' && customPalette && chipPalette && studioPaletteMatchesMixer(chipPalette, mixerState);
        chip.classList.toggle('is-active', chip.dataset.paletteKey === currentKey || isCustomMatch);
    });
    studio.querySelectorAll('[data-bg-mode]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.bgMode === getBackgroundMode());
    });
    studio.querySelectorAll('[data-bg-intensity]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.bgIntensity === getBackgroundIntensity());
    });
    studio.querySelectorAll('[data-glow-strength]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.glowStrength === getGlowStrength());
    });
    ['lux-reset-current-layout', 'lux-reset-all-layouts', 'lux-reset-home-defaults'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) button.hidden = !showHomeLayoutControls;
    });
    document.getElementById('lux-mode-dark')?.classList.toggle('is-active', getThemeMode() === 'dark');
    document.getElementById('lux-mode-light')?.classList.toggle('is-active', getThemeMode() === 'light');
    document.getElementById('lux-bg-animation-on')?.classList.toggle('is-active', typeof areBackgroundAnimationsEnabled === 'function' ? areBackgroundAnimationsEnabled() : true);
    document.getElementById('lux-bg-animation-off')?.classList.toggle('is-active', typeof areBackgroundAnimationsEnabled === 'function' ? !areBackgroundAnimationsEnabled() : false);
}

function toggleStudio() {
    const backdrop = ensureStudio();
    const paletteButton = document.getElementById('lux-palette-btn');
    if (!backdrop) return;
    closeUtilityPanels();
    closePickerPanels();
    const open = backdrop.classList.toggle('is-open');
    document.body.classList.toggle('lux-studio-open', open);
    paletteButton?.classList.toggle('is-active', open);
    if (open) {
        syncStudioUi();
        updateStudioPreview();
        focusFirstInteractive(backdrop, '#lux-studio-close, #lux-mode-dark, #lux-mode-light');
    } else {
        restoreFocusById('lux-palette-btn');
    }
}

function closeStudio(options = {}) {
    document.getElementById('lux-studio-backdrop')?.classList.remove('is-open');
    document.getElementById('lux-palette-btn')?.classList.remove('is-active');
    document.body.classList.remove('lux-studio-open');
    if (options.restoreFocus) restoreFocusById('lux-palette-btn');
}

window.openStudio = function () {
    const backdrop = ensureStudio();
    if (!backdrop) return;
    if (!backdrop.classList.contains('is-open')) {
        toggleStudio();
        return;
    }
    syncStudioUi();
    updateStudioPreview();
};
window.closeStudio = closeStudio;

function populateFacultySwitcher(options = {}) {
    const legacy = document.getElementById('faculty-select');
    const button = document.getElementById('lux-faculty-picker-btn');
    const value = document.getElementById('lux-faculty-picker-value');
    let panel = document.getElementById('lux-faculty-picker-panel');
    if (!button || !value) return;
    const defaultFaculties = [
        { value: 'ECON', label: 'Management' },
        { value: 'CS', label: 'Computer Science' },
        { value: 'LAW', label: 'Law' },
        { value: 'MED', label: 'Medicine' },
        { value: 'ARTS', label: 'Arts & Humanities' }
    ];
    let optionsList = [];
    if (legacy && legacy.options && legacy.options.length > 0) {
        optionsList = Array.from(legacy.options).map((opt) => ({
            value: opt.value,
            label: typeof cleanupUiText === 'function' ? cleanupUiText(opt.textContent || opt.value, opt.value) : (opt.textContent || opt.value)
        }));
    } else {
        optionsList = defaultFaculties;
    }
    const currentValue = getCurrentFacultyCode();
    const selected = optionsList.find((opt) => opt.value === currentValue) || optionsList[0];
    value.textContent = selected?.label || getFacultyName(currentValue);
    if (!panel && !options.ensurePanel) return;
    panel = panel || ensureShellPickerPanel('lux-faculty-picker-panel');
    if (!panel) return;
    const optionSignature = optionsList.map((opt) => `${opt.value}:${opt.label}`).join('|');
    const signature = `${currentValue}|${optionSignature}`;
    if (panel.dataset.renderSignature !== signature) {
        panel.innerHTML = optionsList.map((opt) => `
            <button class="lux-picker-option${opt.value === currentValue ? ' is-active' : ''}" type="button" data-faculty-option="${escapeHtml(opt.value)}">
                <strong>${escapeHtml(opt.label)}</strong>
                <span>${escapeHtml(opt.value)}</span>
            </button>
        `).join('');
        panel.dataset.renderSignature = signature;
    }
    if (panel.dataset.bound !== '1') {
        panel.addEventListener('click', (event) => {
            const optionButton = event.target.closest('[data-faculty-option]');
            if (!optionButton || !panel.contains(optionButton)) return;
            closePickerPanels();
            if (typeof switchFacultyTheme === 'function') switchFacultyTheme(optionButton.dataset.facultyOption, { forceReload: true });
        });
        panel.dataset.bound = '1';
    }
}

function populateRoleSwitcher(options = {}) {
    const button = document.getElementById('lux-role-picker-btn');
    const value = document.getElementById('lux-role-picker-value');
    let panel = document.getElementById('lux-role-picker-panel');
    if (!button || !value) return;
    const roles = ['student', 'professor', 'ta', 'admin', 'student_service'];
    const activeRole = getShellRole();
    const roleLabels = getRoleLabels();
    value.textContent = roleLabels[activeRole] || 'Portal View';
    if (!panel && !options.ensurePanel) return;
    panel = panel || ensureShellPickerPanel('lux-role-picker-panel');
    if (!panel) return;
    const signature = activeRole;
    if (panel.dataset.renderSignature !== signature) {
        panel.innerHTML = roles.map((roleKey) => `
            <button class="lux-picker-option${roleKey === activeRole ? ' is-active' : ''}" type="button" data-role-option="${escapeHtml(roleKey)}">
                <strong>${escapeHtml(roleLabels[roleKey])}</strong>
                <span>${escapeHtml(roleKey === 'student_service' ? 'Student support operations' : roleKey === 'admin' ? 'Full administrative controls' : roleKey === 'ta' ? 'Teaching support workspace' : roleKey === 'professor' ? 'Faculty delivery workspace' : 'Student academic workspace')}</span>
            </button>
        `).join('');
        panel.dataset.renderSignature = signature;
    }
    if (panel.dataset.bound !== '1') {
        panel.addEventListener('click', (event) => {
            const optionButton = event.target.closest('[data-role-option]');
            if (!optionButton || !panel.contains(optionButton)) return;
            closePickerPanels();
            if (typeof switchRole === 'function') switchRole(optionButton.dataset.roleOption);
        });
        panel.dataset.bound = '1';
    }
}

function syncTopbar() {
    const currentUser = typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null;
    const notifications = typeof getNotificationSnapshot === 'function' ? getNotificationSnapshot(currentUser) : { unread: 0 };
    const messenger = typeof getMessengerSnapshot === 'function' ? getMessengerSnapshot(currentUser) : { unread: 0 };
    const activePageId = getActivePageId();
    const onHome = activePageId === 'home';
    const shellRole = getShellRole(activePageId);
    const roleLabels = getRoleLabels();
    const footerAvatar = shellRole === 'student' ? 'KI' : getUserInitials();
    const footerName = shellRole === 'student' ? 'Portal User' : getUserName();
    const footerRole = shellRole === 'student' ? 'University Portal' : `${roleLabels[getEffectiveRole()] || 'Portal'} - ${getFacultyName(getCurrentFacultyCode())}`;
    const chipRole = shellRole === 'student' ? 'Student Portal / University Portal' : `${pageLabel(activePageId)} / ${roleLabels[getEffectiveRole()] || 'Portal'}`;
    document.getElementById('lux-breadcrumb-page').textContent = pageLabel(activePageId);
    document.getElementById('lux-avatar').textContent = footerAvatar;
    document.getElementById('lux-chip-avatar').textContent = footerAvatar;
    document.getElementById('lux-user-name').textContent = footerName;
    document.getElementById('lux-chip-name').textContent = shellRole === 'student' ? 'Portal' : (getUserName().split(/\s+/)[0] || 'Portal');
    document.getElementById('lux-user-role').textContent = footerRole;
    document.getElementById('lux-chip-role').textContent = chipRole;
    const editButton = document.getElementById('lux-dashboard-edit-btn');
    const editLabel = document.getElementById('lux-dashboard-edit-label');
    const bell = document.getElementById('lux-notification-btn');
    const bellBadge = document.getElementById('lux-notification-badge');
    const chat = document.getElementById('lux-chat-btn');
    const chatBadge = document.getElementById('lux-chat-badge');
    if (editButton && editLabel) {
        const isEditing = HOME_EDITOR_STATE.editing && HOME_EDITOR_STATE.role === getEffectiveRole();
        editButton.classList.toggle('is-active', isEditing);
        editButton.hidden = !onHome;
        editLabel.textContent = isEditing ? 'Exit Edit' : 'Customize';
        editButton.title = isHomeEditorAvailable()
            ? (onHome ? (isEditing ? 'Exit dashboard editing' : 'Customize the home dashboard') : 'Open home and customize the dashboard')
            : 'Dashboard editing is available on larger screens.';
    }
    if (bell) {
        bell.classList.toggle('has-dot', notifications.unread > 0);
        bell.title = notifications.unread > 0 ? `${notifications.unread} unread notifications` : 'Notifications';
    }
    if (bellBadge) {
        bellBadge.textContent = notifications.unread > 99 ? '99+' : `${notifications.unread}`;
        bellBadge.classList.toggle('is-zero', notifications.unread < 1);
    }
    if (chat) {
        chat.classList.toggle('has-dot', messenger.unread > 0);
        chat.title = messenger.unread > 0 ? `${messenger.unread} unread chats` : 'Messenger';
    }
    if (chatBadge) {
        chatBadge.textContent = messenger.unread > 99 ? '99+' : `${messenger.unread}`;
        chatBadge.classList.toggle('is-zero', messenger.unread < 1);
    }
    if (document.querySelector('#lux-notification-panel.is-open, #lux-chat-panel.is-open')) {
        renderTopbarUtilityPanels(currentUser);
    }
}

function clearPortalCacheAndReload() {
    const confirmed = window.confirm('Clear cached site data and reload the page?');
    if (!confirmed) return Promise.resolve(false);
    if (typeof window.clearPortalSiteCache === 'function') {
        return Promise.resolve(window.clearPortalSiteCache()).then(() => {
            window.location.reload();
            return true;
        });
    }
    if (typeof window.clearPortalSiteCaches === 'function') {
        return Promise.resolve(window.clearPortalSiteCaches(true)).then(() => {
            window.location.reload();
            return true;
        });
    }
    window.location.reload();
    return Promise.resolve(true);
}

function bindCacheClearLaunchButtons(root = document) {
    root.querySelectorAll('[data-action="clear-cache"]').forEach((button) => {
        if (button.dataset.bound) return;
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            await clearPortalCacheAndReload();
        });
        button.dataset.bound = '1';
    });
}

function ensureCacheClearActionInMobileSheet() {
    const container = document.getElementById('mob-sheet-dynamic-nav');
    if (!container || container.querySelector('[data-action="clear-cache"]')) return;
    const section = document.createElement('div');
    section.className = 'mob-sheet-section';
    section.innerHTML = `
        <div class="mob-sheet-label">System</div>
        <div class="mob-sheet-nav">
            <button class="mob-sheet-nav-btn" type="button" data-action="clear-cache">
                <i class="fas fa-broom"></i><span>Clear cache</span>
            </button>
        </div>
    `;
    container.appendChild(section);
    bindCacheClearLaunchButtons(section);
}

function bindUserMenu() {
    const chip = document.getElementById('lux-user-chip');
    if (!chip || chip.dataset.bound) return;
    chip.setAttribute('role', 'button');
    chip.setAttribute('tabindex', '0');
    chip.setAttribute('aria-haspopup', 'menu');
    chip.setAttribute('aria-expanded', 'false');
    chip.addEventListener('click', (event) => {
        event.stopPropagation();
        closeUtilityPanels();
        closePickerPanels();
        closeStudio();
        const menu = ensureUserMenu();
        if (!menu) return;
        if (menu.dataset.bound !== '1') {
            menu.querySelectorAll('[data-nav-target]').forEach((button) => {
                button.addEventListener('click', () => {
                    closeUserMenu();
                    if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
                });
            });
            const clearCacheButton = menu.querySelector('[data-action="clear-cache"]');
            if (clearCacheButton && !clearCacheButton.dataset.bound) {
                clearCacheButton.addEventListener('click', async (menuEvent) => {
                    menuEvent.preventDefault();
                    menuEvent.stopPropagation();
                    closeUserMenu();
                    await clearPortalCacheAndReload();
                });
                clearCacheButton.dataset.bound = '1';
            }
            menu.querySelector('[data-action="logout"]')?.addEventListener('click', () => {
                closeUserMenu();
                if (typeof handleLogout === 'function') handleLogout();
            });
            menu.addEventListener('click', (menuEvent) => menuEvent.stopPropagation());
            menu.dataset.bound = '1';
        }
        const shouldOpen = !menu.classList.contains('is-open');
        if (shouldOpen) {
            const wrapper = menu.parentElement;
            if (wrapper && wrapper.tagName !== 'BODY') {
                if (!wrapper.id) wrapper.id = `lux-wrap-${Math.random().toString(36).substr(2, 9)}`;
                menu.dataset.originalParentId = wrapper.id;
                menu.dataset.teleported = 'true';
                document.body.appendChild(menu);
            }
            const rect = chip.getBoundingClientRect();
            menu.style.position = 'absolute';
            menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
            menu.style.left = `${rect.right + window.scrollX - 180}px`;
            menu.style.zIndex = '999999';
            menu.classList.add('is-open');
            menu.dataset.triggerId = 'lux-user-chip';
            menu.setAttribute('aria-hidden', 'false');
            chip.setAttribute('aria-expanded', 'true');
            window.setTimeout(() => focusFirstInteractive(menu, '[data-nav-target], [data-action]'), 0);
            const scrollHandler = () => {
                closeUserMenu();
                window.removeEventListener('scroll', scrollHandler, true);
            };
            window.addEventListener('scroll', scrollHandler, true);
        } else {
            closeUserMenu();
        }
    });
    chip.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            chip.click();
            return;
        }
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            const menu = ensureUserMenu();
            if (!menu?.classList.contains('is-open')) {
                chip.click();
            } else {
                focusFirstInteractive(menu, '[data-nav-target], [data-action]');
            }
        }
    });
    chip.dataset.bound = '1';
}

function bindTopbarControls() {
    const sidebarToggle = document.getElementById('lux-sidebar-toggle');
    if (sidebarToggle && !sidebarToggle.dataset.bound) {
        sidebarToggle.addEventListener('click', () => {
            closeStudio();
            closeUtilityPanels();
            closePickerPanels();
            closeUserMenu();
            const toggleSidebarFn =
                typeof window.toggleSidebar === 'function'
                    ? window.toggleSidebar
                    : getLuxurySharedConfig().toggleSidebar;
            if (typeof toggleSidebarFn === 'function') toggleSidebarFn();
        });
        sidebarToggle.dataset.bound = '1';
    }

    const paletteButton = document.getElementById('lux-palette-btn');
    if (paletteButton && !paletteButton.dataset.bound) {
        paletteButton.addEventListener('click', toggleStudio);
        paletteButton.dataset.bound = '1';
    }

    ensureCacheClearActionInMobileSheet();
    bindCacheClearLaunchButtons();

    const facultyButton = document.getElementById('lux-faculty-picker-btn');
    if (facultyButton && !facultyButton.dataset.bound) {
        facultyButton.addEventListener('click', (event) => {
            event.stopPropagation();
            closeStudio();
            closeUtilityPanels();
            closeUserMenu();
            populateFacultySwitcher({ ensurePanel: true });
            togglePickerPanel('lux-faculty-picker-panel', 'lux-faculty-picker-btn');
        });
        facultyButton.dataset.bound = '1';
    }

    const roleButton = document.getElementById('lux-role-picker-btn');
    if (roleButton && !roleButton.dataset.bound) {
        roleButton.addEventListener('click', (event) => {
            event.stopPropagation();
            closeStudio();
            closeUtilityPanels();
            closeUserMenu();
            populateRoleSwitcher({ ensurePanel: true });
            togglePickerPanel('lux-role-picker-panel', 'lux-role-picker-btn');
        });
        roleButton.dataset.bound = '1';
    }

    const editorButton = document.getElementById('lux-dashboard-edit-btn');
    if (editorButton && !editorButton.dataset.bound) {
        editorButton.addEventListener('click', () => {
            closeStudio();
            closeUtilityPanels();
            closePickerPanels();
            closeUserMenu();
            if (!isHomeEditorAvailable()) {
                if (typeof showToast === 'function') showToast('Dashboard editing is available on larger screens.');
                return;
            }
            if (typeof openHomeEditor === 'function') {
                openHomeEditor(getEffectiveRole(), buildHomeModel(getEffectiveRole()));
            }
        });
        editorButton.dataset.bound = '1';
    }

    const bellButton = document.getElementById('lux-notification-btn');
    if (bellButton && !bellButton.dataset.bound) {
        bellButton.addEventListener('click', (event) => {
            event.stopPropagation();
            closeStudio();
            closePickerPanels();
            closeUserMenu();
            toggleUtilityPanel('lux-notification-panel', 'lux-notification-btn');
        });
        bellButton.dataset.bound = '1';
    }

    const chatButton = document.getElementById('lux-chat-btn');
    if (chatButton && !chatButton.dataset.bound) {
        chatButton.addEventListener('click', (event) => {
            event.stopPropagation();
            closeStudio();
            closePickerPanels();
            closeUserMenu();
            toggleUtilityPanel('lux-chat-panel', 'lux-chat-btn');
        });
        chatButton.dataset.bound = '1';
    }

    if (!document.body.dataset.luxTopbarCloseBound) {
        document.addEventListener('click', () => {
            closeUtilityPanels();
            closePickerPanels();
            closeUserMenu();
        });
        document.body.dataset.luxTopbarCloseBound = '1';
    }

    if (!document.body.dataset.luxTopbarEscapeBound) {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (document.body.classList.contains('lux-studio-open')) {
                    closeStudio({ restoreFocus: true });
                    return;
                }
                if (document.querySelector('.lux-utility-panel.is-open')) {
                    closeUtilityPanels({ restoreFocus: true });
                    return;
                }
                if (document.querySelector('.lux-picker-panel.is-open')) {
                    closePickerPanels({ restoreFocus: true });
                    return;
                }
                if (document.getElementById('lux-user-menu')?.classList.contains('is-open')) {
                    closeUserMenu({ restoreFocus: true });
                }
            }
        });
        document.body.dataset.luxTopbarEscapeBound = '1';
    }

    const input = document.getElementById('lux-search-input');
    if (!input || input.dataset.bound) return;
    input.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        const query = input.value.trim().toLowerCase();
        if (!query) return;
        const pages = Object.entries(getPageLabels());
        const match = pages.find(([pageId, label]) => label.toLowerCase().includes(query) || pageId.includes(query));
        if (match && typeof navigate === 'function') {
            navigate(pageTarget(match[0]));
            input.value = '';
        }
    });
    input.dataset.bound = '1';
}

function initializeLuxuryShellChromeBindings(attemptsRemaining = 24) {
    if (typeof document === 'undefined') return;
    const hasShellChrome = Boolean(document.getElementById('lux-topbar') || document.getElementById('lux-user-chip'));
    if (hasShellChrome) {
        bindUserMenu();
        bindTopbarControls();
        return;
    }
    if (attemptsRemaining <= 0) return;
    const scheduleRetry = window.requestAnimationFrame || ((cb) => window.setTimeout(cb, 16));
    scheduleRetry(() => initializeLuxuryShellChromeBindings(attemptsRemaining - 1));
}

window.__KIU_LUXURY_SHELL_CHROME_LOADED = true;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initializeLuxuryShellChromeBindings(), { once: true });
} else {
    initializeLuxuryShellChromeBindings();
}
