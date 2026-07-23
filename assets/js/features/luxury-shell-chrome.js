/* Luxury shell chrome runtime extracted from index-luxury.js. */

function getLuxurySharedConfig() {
    return window.__KIU_LUXURY_SHARED || {};
}

const DEFAULT_ROLE_LABELS = {
    student: 'Student Portal',
    professor: 'Professor View',
    ta: 'TA View',
    admin: 'Admin View',
    student_service: 'Student Service View'
};

const FOG_COLOR_FIELDS = [
    { key: 'highlightColor', label: 'Highlight' },
    { key: 'midtoneColor', label: 'Midtone' },
    { key: 'lowlightColor', label: 'Lowlight' },
    { key: 'baseColor', label: 'Base' }
];

const PARTICLE_BG_MODES = new Set(['peak', 'layered', 'orbit', 'corners']);
const FOG_PARAMS_TEMPLATE_VERSION = '6';
let activeBgParamsMode = null;
let activeFogProfileBank = 'dark';

function resolveActiveFogProfileBank() {
    return activeFogProfileBank === 'light' ? 'light' : 'dark';
}

function resolveHomeModelForRole(role) {
    if (typeof window.buildHomeModel === 'function') {
        return window.buildHomeModel(role);
    }
    return null;
}

function syncActiveFogProfileBankFromTheme() {
    if (typeof getThemeMode === 'function') {
        activeFogProfileBank = getThemeMode() === 'light' ? 'light' : 'dark';
    }
}

function getActiveFogProfiles() {
    if (typeof getFogProfiles !== 'function') return [];
    return getFogProfiles(resolveActiveFogProfileBank());
}

function syncFogProfileBankUi() {
    const label = document.getElementById('lux-fog-profile-bank-label');
    const bank = resolveActiveFogProfileBank();
    if (label) label.textContent = `Saved Profiles · ${bank === 'light' ? 'Light' : 'Dark'}`;
    document.querySelectorAll('[data-fog-profile-bank]').forEach((button) => {
        const isActive = button.dataset.fogProfileBank === bank;
        button.classList.toggle('is-active', isActive);
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
    const emptyState = document.getElementById('lux-fog-profile-empty');
    if (emptyState) {
        emptyState.textContent = bank === 'light'
            ? 'No light profiles yet.'
            : 'No dark profiles yet.';
    }
}

function setActiveFogProfileBank(nextBank, { rerender = true } = {}) {
    const bank = nextBank === 'light' ? 'light' : 'dark';
    if (bank === activeFogProfileBank) {
        syncFogProfileBankUi();
        return;
    }
    if (typeof isFogProfileEditing === 'function' && isFogProfileEditing()) {
        if (isFogProfileEditDirty() && !confirm('Discard unsaved profile changes?')) return;
        clearFogProfileEditState({ restoreSnapshot: true });
        const nameInput = document.getElementById('lux-fog-profile-name-input');
        if (nameInput) nameInput.value = '';
    }
    activeFogProfileBank = bank;
    syncFogProfileBankUi();
    if (rerender) renderFogProfileList();
}

function flashFogProfileAction(button, outcome = 'success') {
    if (!button) return;
    button.classList.remove('is-success', 'is-error', 'is-acting');
    void button.offsetWidth;
    button.classList.add('is-acting', outcome === 'error' ? 'is-error' : 'is-success');
    window.setTimeout(() => {
        button.classList.remove('is-acting', 'is-success', 'is-error');
    }, 520);
}

function getRoleLabels() {
    const roleLabels = getLuxurySharedConfig().ROLE_LABELS;
    if (roleLabels && typeof roleLabels === 'object') {
        return { ...DEFAULT_ROLE_LABELS, ...roleLabels };
    }
    return { ...DEFAULT_ROLE_LABELS };
}

function resolveRolePickerLabel(role) {
    const normalized = String(role || '').trim().toLowerCase();
    return getRoleLabels()[normalized] || DEFAULT_ROLE_LABELS[normalized] || 'Workspace';
}

function resolveBootstrappedShellRole() {
    try {
        const viewParam = String(new URLSearchParams(window.location.search || '').get('view') || '').trim().toLowerCase();
        if (viewParam && DEFAULT_ROLE_LABELS[viewParam]) return viewParam;
    } catch (error) {}
    try {
        const pendingRole = String(localStorage.getItem('KIU_PENDING_ROLE_SWITCH_ROLE') || '').trim().toLowerCase();
        if (pendingRole && DEFAULT_ROLE_LABELS[pendingRole]) return pendingRole;
    } catch (error) {}
    if (typeof getEffectiveUserRole === 'function') {
        try {
            const effectiveRole = String(getEffectiveUserRole() || '').trim().toLowerCase();
            if (effectiveRole && DEFAULT_ROLE_LABELS[effectiveRole]) return effectiveRole;
        } catch (error) {}
    }
    try {
        const storedRole = String(localStorage.getItem('currentUserRole') || '').trim().toLowerCase();
        if (storedRole && DEFAULT_ROLE_LABELS[storedRole]) return storedRole;
    } catch (error) {}
    return 'student';
}

function seedRolePickerLabel() {
    const value = document.getElementById('lux-role-picker-value');
    if (!value) return;
    value.textContent = resolveRolePickerLabel(resolveBootstrappedShellRole());
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
    return pageId === 'profile' ? 'personal-data' : pageId;
}

function prefetchPortalRoute(pageId) {
    const normalizedPageId = String(pageId || '').trim().toLowerCase();
    if (!normalizedPageId || typeof window.resolvePortalRouteUrl !== 'function') return;
    const role = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (typeof getEffectiveRole === 'function' ? getEffectiveRole() : 'student');
    let targetUrl = '';
    try {
        targetUrl = window.resolvePortalRouteUrl(pageTarget(normalizedPageId), role);
    } catch (error) {
        return;
    }
    if (!targetUrl) return;
    const prefetched = window.__kiuPrefetchedNavUrls || (window.__kiuPrefetchedNavUrls = new Set());
    if (prefetched.has(targetUrl)) return;
    prefetched.add(targetUrl);
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'document';
    link.href = targetUrl;
    document.head.appendChild(link);
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
        node.style.transform = '';
        node.classList.remove('is-open-above', 'ex2-picker-panel');
    } else {
        node.remove();
    }
    node.dataset.teleported = 'false';
}

const closeUtilityPanels = window.closeUtilityPanels;
const ensureTopbarUtilityPanel = window.ensureTopbarUtilityPanel;
const ensureUserMenu = window.ensureUserMenu;
const closeUserMenu = window.closeUserMenu;
const ensureShellPickerPanel = window.ensureShellPickerPanel;
const toggleUtilityPanel = window.toggleUtilityPanel;
const isPickerScrollExempt = window.isPickerScrollExempt;
const isLuxPickerInteractionTarget = window.isLuxPickerInteractionTarget;
const collectPickerScrollTargets = window.collectPickerScrollTargets;
const clearLuxPickerPanelListeners = window.clearLuxPickerPanelListeners;
const forcePickerReflow = window.forcePickerReflow;
const deactivatePickerTrigger = window.deactivatePickerTrigger;
const finalizePickerPanelClose = window.finalizePickerPanelClose;
const animatePickerPanelClose = window.animatePickerPanelClose;
const closePickerPanel = window.closePickerPanel;
const applyLuxPickerPanelVariants = window.applyLuxPickerPanelVariants;
const closePickerPanels = window.closePickerPanels;
const openPickerPanel = window.openPickerPanel;
const dismissOpenLuxPickerPanels = window.dismissOpenLuxPickerPanels;
const bindLuxPickerDismissHandlers = typeof window.bindLuxPickerDismissHandlers === 'function'
    ? window.bindLuxPickerDismissHandlers
    : function bindLuxPickerDismissHandlersNoop() {};
const togglePickerPanel = window.togglePickerPanel;
const openRoleSwitcherPanel = window.openRoleSwitcherPanel;
const normalizePickerLabel = window.normalizePickerLabel;
const getCleanPickerLabelText = window.getCleanPickerLabelText;
const isExternalPickerLabelNode = window.isExternalPickerLabelNode;
const resolveExternalPickerLabel = window.resolveExternalPickerLabel;
const wirePickerButtonAriaLabel = window.wirePickerButtonAriaLabel;
const inferPickerCaption = window.inferPickerCaption;
const normalizePickerSearchQuery = window.normalizePickerSearchQuery;
const isLuxPickerSearchEnabled = window.isLuxPickerSearchEnabled;
const getLuxPickerOptionSearchHaystack = window.getLuxPickerOptionSearchHaystack;
const filterLuxPickerPanelOptions = window.filterLuxPickerPanelOptions;
const resetLuxPickerPanelSearch = window.resetLuxPickerPanelSearch;
const wireLuxPickerPanelSearch = window.wireLuxPickerPanelSearch;
const renderLuxPickerOptionButton = window.renderLuxPickerOptionButton;
const bindLuxPickerOptionButtons = window.bindLuxPickerOptionButtons;
const buildUniversalPickerPanel = window.buildUniversalPickerPanel;
const syncUniversalPicker = window.syncUniversalPicker;
const shouldEnhanceSelect = window.shouldEnhanceSelect;
const enhanceUniversalPicker = window.enhanceUniversalPicker;
const enhanceUniversalPickers = window.enhanceUniversalPickers;
const observeUniversalPickers = window.observeUniversalPickers;

window.enhanceUniversalPickers = enhanceUniversalPickers;
window.enhanceUniversalPicker = enhanceUniversalPicker;
window.syncUniversalPicker = syncUniversalPicker;
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

function renderNavRecoveryFallback(navRoot, error) {
    console.error('Luxury navigation render failed.', error);
    navRoot.dataset.renderSignature = 'recovery';
    navRoot.innerHTML = `
        <div class="lux-nav-group">Navigation</div>
        <button class="lux-nav-item" type="button" data-nav-recovery-retry="1">
            <i class="fas fa-rotate-right"></i>
            <span>Reload navigation</span>
        </button>
    `;
    const retryButton = navRoot.querySelector('[data-nav-recovery-retry="1"]');
    if (retryButton && !retryButton.dataset.bound) {
        retryButton.dataset.bound = '1';
        retryButton.addEventListener('click', () => {
            navRoot.dataset.renderSignature = '';
            if (typeof window.recoverIndexPortalShell === 'function') {
                window.recoverIndexPortalShell({ reason: 'nav-recovery-retry' });
                return;
            }
            renderNav();
        });
    }
}

function renderNav() {
    const role = typeof getEffectiveUserRole === 'function'
        ? getEffectiveUserRole()
        : (typeof getEffectiveRole === 'function' ? getEffectiveRole() : 'student');
    const navRoot = document.getElementById('lux-nav');
    if (!navRoot) return;
    if (!navRoot.children.length && navRoot.dataset.renderSignature) {
        navRoot.dataset.renderSignature = '';
    }
    const activePage = typeof getActivePageId === 'function' ? getActivePageId() : 'home';
    const navByRole = getNavByRole();
    const configuredGroups = navByRole[role] || navByRole.student || [];
    const groups = configuredGroups.length ? configuredGroups : getFallbackNavGroups(role);
    if (!groups.length) {
        navRoot.dataset.renderSignature = '';
        return;
    }
    const itemSignature = groups
        .map((group) => `${group.group}:${group.items.map((item) => item[0]).join(',')}`)
        .join(';');
    const signature = `${role}|${activePage}|${itemSignature}`;
    if (navRoot.dataset.renderSignature === signature && navRoot.children.length) return;
    try {
        let staggerIndex = 0;
        navRoot.innerHTML = groups.map((group) => {
            const groupStagger = Math.min(staggerIndex++, 14);
            const groupMarkup = `<div class="lux-nav-group" style="--lux-nav-stagger:${groupStagger}">${escapeHtml(group.group)}</div>`;
            const itemsMarkup = group.items.map(([pageId, label, icon, badge]) => {
                const itemStagger = Math.min(staggerIndex++, 14);
                return `
                <button class="lux-nav-item${activePage === pageId ? ' is-active' : ''}" type="button" data-nav-target="${escapeHtml(pageId)}" style="--lux-nav-stagger:${itemStagger}">
                    <i class="${escapeHtml(icon)}"></i>
                    <span>${escapeHtml(label)}</span>
                    ${badge ? `<span class="lux-nav-badge">${escapeHtml(badge)}</span>` : ''}
                </button>`;
            }).join('');
            return groupMarkup + itemsMarkup;
        }).join('');
        const shell = document.getElementById('lux-shell');
        if (shell) {
            shell.style.setProperty('--lux-shell-footer-stagger', String(Math.min(staggerIndex, 14)));
        }
        navRoot.dataset.renderSignature = signature;
    } catch (error) {
        renderNavRecoveryFallback(navRoot, error);
        return;
    }
    if (navRoot.dataset.bound !== '1') {
        navRoot.addEventListener('click', (event) => {
            const button = event.target.closest('[data-nav-target]');
            if (!button || !navRoot.contains(button)) return;
            if (typeof navigate === 'function') navigate(pageTarget(button.dataset.navTarget));
        });
        navRoot.addEventListener('mouseover', (event) => {
            const button = event.target.closest('[data-nav-target]');
            if (!button || !navRoot.contains(button)) return;
            prefetchPortalRoute(button.dataset.navTarget);
        });
        navRoot.dataset.bound = '1';
    }
}

window.renderNav = renderNav;
// populateRoleSwitcher / syncTopbar / syncChromeBottom come from luxury-shell-topbar-runtime.js
window.seedRolePickerLabel = seedRolePickerLabel;
window.resolveRolePickerLabel = resolveRolePickerLabel;

function getFallbackNavGroups(role) {
    if (role === 'admin') {
        return [
            {
                group: 'Control',
                items: [['home', 'Dashboard', 'fas fa-hammer'], ['admin-tools', 'Admin Tools', 'fas fa-layer-group'], ['admin-scheduler', 'Scheduler', 'fas fa-calendar-plus'], ['staff', 'Staff', 'fas fa-users-cog'], ['students-admin', 'Students', 'fas fa-user-graduate']]
            },
            {
                group: 'Systems',
                items: [['news', 'News', 'fas fa-newspaper'], ['library', 'Library', 'fas fa-book'], ['orders', 'Orders', 'fas fa-book-open'], ['social', 'Social', 'fas fa-comments']]
            }
        ];
    }
    return [
        {
            group: 'Core',
            items: [['home', 'Dashboard', 'fas fa-th-large'], ['lms', 'LMS', 'fas fa-book-reader'], ['timetable', 'Timetable', 'fas fa-chalkboard'], ['registration', 'Registration', 'fas fa-check-square']]
        },
        {
            group: 'Support',
            items: [['news', 'News', 'fas fa-newspaper'], ['chancellery', 'E-Chancellery', 'fas fa-desktop'], ['student-service', 'Student Service', 'fas fa-headset'], ['library', 'Library', 'fas fa-book'], ['social', 'Social', 'fas fa-comments']]
        }
    ];
}


function collectShellPerimeterPoints(rect, perSide = 6) {
    const { left, top, width, height } = rect;
    const points = [];
    const add = (x, y, nx, ny) => points.push({ x, y, nx, ny });
    for (let i = 0; i < perSide; i += 1) {
        const t = (i + 0.5) / perSide;
        add(left + width * t, top, 0, -1);
        add(left + width, top + height * t, 1, 0);
        add(left + width * (1 - t), top + height, 0, 1);
        add(left, top + height * (1 - t), -1, 0);
    }
    return points;
}

function spawnStudioChipBurstParticles(shell, _event, root) {
    const now = performance.now();
    const lastAt = spawnStudioChipBurstParticles._lastBurstAt || 0;
    if (now - lastAt < 90) return;
    spawnStudioChipBurstParticles._lastBurstAt = now;

    const existing = root.querySelectorAll(':scope > .lux-chip-burst-particle');
    if (existing.length > 80) {
        const excess = existing.length - 60;
        for (let i = 0; i < excess; i += 1) existing[i]?.remove();
    }

    const rect = shell.getBoundingClientRect();
    const points = collectShellPerimeterPoints(rect, 5);
    const { left, top, width, height } = rect;
    const corners = [
        { x: left, y: top, nx: -1, ny: -1 },
        { x: left + width, y: top, nx: 1, ny: -1 },
        { x: left + width, y: top + height, nx: 1, ny: 1 },
        { x: left, y: top + height, nx: -1, ny: 1 }
    ];
    const kinds = ['dot', 'spark', 'streak'];
    const sizes = ['sm', 'md', 'lg'];
    const jobs = [
        ...points.map((pt, i) => ({ pt, i, kind: kinds[i % 3], size: sizes[i % 3] })),
        ...corners.map((pt, i) => ({ pt, i: points.length + i, kind: 'spark', size: 'lg' }))
    ];
    const appendBit = (bit, timeoutMs = 1000) => {
        const remove = () => {
            if (bit._done) return;
            bit._done = true;
            bit.remove();
        };
        bit.addEventListener('animationend', remove, { once: true });
        window.setTimeout(remove, timeoutMs);
        root.appendChild(bit);
    };
    jobs.forEach(({ pt, i, kind, size }) => {
        const edgeJitter = (Math.random() - 0.5) * 10;
        const angleJitter = ((Math.random() - 0.5) * 28 * Math.PI) / 180;
        const baseAngle = Math.atan2(pt.ny, pt.nx) + angleJitter;
        const dist = 36 + Math.random() * 36;
        const spawnX = pt.x + (pt.nx === 0 ? edgeJitter : pt.nx * 2);
        const spawnY = pt.y + (pt.ny === 0 ? edgeJitter : pt.ny * 2);
        const bit = document.createElement('span');
        bit.className = `lux-chip-burst-particle lux-chip-burst-particle--${kind} lux-chip-burst-particle--${size}`;
        bit.style.left = `${spawnX}px`;
        bit.style.top = `${spawnY}px`;
        bit.style.setProperty('--burst-tx', `${Math.cos(baseAngle) * dist}px`);
        bit.style.setProperty('--burst-ty', `${Math.sin(baseAngle) * dist}px`);
        bit.style.setProperty('--burst-rot', `${(baseAngle * 180) / Math.PI}deg`);
        bit.style.setProperty('--burst-delay', `${i * 10}ms`);
        appendBit(bit);
    });
}

function launchBackgroundGallery(mediaType) {
    const open = () => {
        if (typeof bindBackgroundGalleryStudioControls === 'function') {
            bindBackgroundGalleryStudioControls();
        }
        if (typeof openBackgroundGalleryPopup === 'function') {
            openBackgroundGalleryPopup(mediaType);
        }
    };
    if (typeof openBackgroundGalleryPopup === 'function') {
        open();
        return;
    }
    const loader = window.__kiuEnsureBackgroundGalleryScripts;
    if (typeof loader === 'function') {
        loader()
            .then(open)
            .catch(() => {
                if (typeof showToast === 'function') showToast('Gallery failed to load.');
            });
        return;
    }
    if (typeof showToast === 'function') showToast('Gallery failed to load.');
}
window.launchBackgroundGallery = launchBackgroundGallery;

function ensureStudioChipBurstHandler() {
    if (ensureStudioChipBurstHandler._bound || typeof document === 'undefined') return;
    ensureStudioChipBurstHandler._bound = true;
    const chipSelector = '.lux-mode-btn, .lux-control-btn, .lux-fog-profile-bank-btn, .lux-fog-profile-action-btn, [data-particle-quality], [data-glass-blur-quality], .lux-palette-chip, .lux-apply-btn, .lux-bg-gallery-tab';
    document.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        const root = event.target.closest('#lux-studio-backdrop, #lux-bg-mode-params-backdrop, #lux-bg-gallery-backdrop');
        if (!root) return;
        if (event.target.closest('.lux-bg-gallery-tile, #lux-bg-gallery-upload, #lux-bg-gallery-upload-label, [data-gallery-empty-upload]')) return;
        const shell = event.target.closest('.lux-bg-mode-item, .lux-fog-profile-item');
        const target = shell && root.contains(shell)
            ? shell
            : event.target.closest(chipSelector);
        if (!target || !root.contains(target) || target.disabled) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const burstTarget = target;
        const burstRoot = root;
        window.requestAnimationFrame(() => {
            spawnStudioChipBurstParticles(burstTarget, event, burstRoot);
        });
    }, true);
}

function ensureStudioCss() {
    ensureStudioChipBurstHandler();
    if (typeof document === 'undefined') return;
    const sheets = [
        { href: 'assets/css/lux-studio.css?v=20260722-popupblack1', key: 'data-kiu-studio' },
        { href: 'assets/css/lux-studio-mobile.css?v=20260722-popupblack1', key: 'data-kiu-studio-mobile' }
    ];
    for (const sheet of sheets) {
        const existing = document.querySelector(`link[${sheet.key}]`);
        if (existing) {
            if (existing.getAttribute('href') !== sheet.href) existing.setAttribute('href', sheet.href);
            continue;
        }
        const file = sheet.href.split('?')[0].split('/').pop();
        const found = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((l) =>
            String(l.getAttribute('href') || '').includes(file)
        );
        if (found) {
            found.setAttribute('href', sheet.href);
            found.setAttribute(sheet.key, '1');
            continue;
        }
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = sheet.href;
        link.setAttribute(sheet.key, '1');
        document.head.appendChild(link);
    }
}

function ensureLuxDroplistCss() {
    if (typeof document === 'undefined') return;
    if (document.querySelector('link[data-kiu-lux-droplist]')) return;
    const has = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) =>
        String(l.getAttribute('href') || '').includes('lux-droplist.css')
    );
    if (has) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'assets/css/lux-droplist.css?v=20260720-densify6500';
    link.setAttribute('data-kiu-lux-droplist', '1');
    document.head.appendChild(link);
}

function ensureStudio() {
    ensureStudioCss();
    const existingStudio = document.getElementById('lux-studio-backdrop');
    if (existingStudio) {
        if (document.getElementById('lux-bg-mode-params-backdrop')) return existingStudio;
        existingStudio.remove();
        document.getElementById('lux-bg-mode-params-backdrop')?.remove();
    }
    const backdrop = document.createElement('div');
    backdrop.id = 'lux-studio-backdrop';
    backdrop.className = 'lux-studio-backdrop';
    backdrop.setAttribute('data-lux-transparency-exempt', '1');
    backdrop.innerHTML = `
        <div class="lux-studio-panel" role="dialog" aria-label="Luxury theme studio" data-lux-transparency-exempt="1">
            <div class="lux-studio-head">
                <div class="lux-studio-heading">
                    <div class="lux-studio-title"><i class="fas fa-palette" aria-hidden="true"></i> Color & Motion Studio</div>
                    <div class="lux-studio-sub">Tune the portal palette and choose the 3D background mood.</div>
                </div>
                <button class="lux-studio-close" id="lux-studio-close" type="button" aria-label="Close studio"><i class="fas fa-times"></i></button>
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
                            <span class="lux-transparency-value" id="lux-transparency-value">13%</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-transparency-slider" min="0" max="100" value="13">
                        <div class="lux-transparency-meta">
                            <span><i class="fas fa-eye"></i> Full Transparent (0%)</span>
                            <span><i class="fas fa-eye-slash"></i> Solid (100%)</span>
                        </div>
                    </div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Glass Blur</div>
                    <div class="lux-control-grid" id="lux-glass-blur-quality-grid"></div>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Panel Color Glow</div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-sun"></i> Glow Density</span>
                            <span class="lux-transparency-value" id="lux-glow-strength-value">50%</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-glow-strength-slider" min="0" max="100" value="50">
                        <div class="lux-transparency-meta">
                            <span><i class="fas fa-moon"></i> None (0%)</span>
                            <span><i class="fas fa-bolt"></i> Max (100%)</span>
                        </div>
                    </div>
                </div>
                <div class="lux-studio-section lux-bg-mode-section">
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
                <div class="lux-studio-section lux-static-bg-section" id="lux-static-bg-section" hidden>
                    <div class="lux-studio-label">Static Background</div>
                    <div class="lux-mode-row">
                        <button class="lux-mode-btn" id="lux-static-bg-colored" type="button" data-static-bg-fill="colored"><i class="fas fa-palette"></i> Colored</button>
                        <button class="lux-mode-btn" id="lux-static-bg-dark" type="button" data-static-bg-fill="dark"><i class="fas fa-moon"></i> Full Dark</button>
                        <button class="lux-mode-btn" id="lux-static-bg-white" type="button" data-static-bg-fill="white"><i class="fas fa-sun"></i> White</button>
                    </div>
                </div>

                <div class="lux-studio-section lux-bg-gallery-section" id="lux-bg-gallery-section" hidden>
                    <div class="lux-studio-label">Background Gallery</div>
                    <div class="lux-mode-row">
                        <button class="lux-mode-btn" id="lux-bg-gallery-open-images" type="button"><i class="fas fa-image"></i> Images</button>
                        <button class="lux-mode-btn" id="lux-bg-gallery-open-videos" type="button"><i class="fas fa-video"></i> Videos</button>
                    </div>
                    <button class="lux-control-btn" id="lux-bg-gallery-clear" type="button"><strong>Clear gallery</strong><span>Return to colored static fill.</span></button>
                </div>
                <div class="lux-studio-section">
                    <div class="lux-studio-label">Default & Reset</div>
                    <div class="lux-reset-grid">
                        <button class="lux-control-btn" id="lux-reset-visuals" type="button"><strong>Reset visual settings</strong><span>Theme, palette, particles, and opacity.</span></button>
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
    ensureBgModeParamsPopup();
    if (typeof writeStudioMixerInputs === 'function' && typeof getStudioMixerState === 'function') {
        writeStudioMixerInputs(getStudioMixerState());
    }
    backdrop.addEventListener('click', (event) => {
        if (event.target.closest('#lux-bg-gallery-open-images')) {
            launchBackgroundGallery('images');
            return;
        }
        if (event.target.closest('#lux-bg-gallery-open-videos')) {
            launchBackgroundGallery('videos');
            return;
        }
        if (event.target === backdrop) closeStudio();
    });
    document.getElementById('lux-studio-close')?.addEventListener('click', () => closeStudio({ restoreFocus: true }));
    document.getElementById('lux-mode-dark')?.addEventListener('click', () => {
        applyThemeMode('dark', true);
        if (typeof syncStudioUi === 'function') syncStudioUi();
    });
    document.getElementById('lux-mode-light')?.addEventListener('click', () => {
        applyThemeMode('light', true);
        if (typeof syncStudioUi === 'function') syncStudioUi();
    });
    document.getElementById('lux-bg-animation-on')?.addEventListener('click', () => {
        if (typeof setBackgroundAnimationsEnabled === 'function') setBackgroundAnimationsEnabled(true, true);
    });
    document.getElementById('lux-bg-animation-off')?.addEventListener('click', () => {
        if (typeof setBackgroundAnimationsEnabled === 'function') setBackgroundAnimationsEnabled(false, true);
    });
    document.querySelectorAll('[data-static-bg-fill]').forEach((button) => {
        button.addEventListener('click', () => {
            const fill = button.dataset.staticBgFill;
            if (fill && typeof setStaticBackgroundFill === 'function') setStaticBackgroundFill(fill, true);
        });
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
    const glassBlurQualityGrid = document.getElementById('lux-glass-blur-quality-grid');
    if (glassBlurQualityGrid) glassBlurQualityGrid.replaceChildren();
    (GLASS_BLUR_QUALITY_OPTIONS || []).forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-control-btn';
        button.dataset.glassBlurQuality = mode.key;
        button.setAttribute('data-lux-skip-modern-button', 'true');
        button.innerHTML = `<strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.copy)}</span>`;
        button.addEventListener('click', () => {
            if (typeof setGlassBlurQuality === 'function') setGlassBlurQuality(mode.key, true);
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
            document.querySelectorAll('[data-glass-blur-quality]').forEach((node) => {
                node.classList.toggle('is-active', node.dataset.glassBlurQuality === mode.key);
            });
        });
        glassBlurQualityGrid?.appendChild(button);
    });
    const glowStrengthSlider = document.getElementById('lux-glow-strength-slider');
    const glowStrengthValue = document.getElementById('lux-glow-strength-value');
    if (glowStrengthSlider) {
        const savedGlow = typeof window.getGlowStrength === 'function'
            ? window.getGlowStrength()
            : (getDashboardVisuals().glowStrength ?? localStorage.getItem('kiuLuxuryGlowStrength') ?? 50);
        const glowPercent = typeof window.normalizeGlowStrengthPercent === 'function'
            ? window.normalizeGlowStrengthPercent(savedGlow)
            : Math.min(100, Math.max(0, Math.round(Number(savedGlow) || 50)));
        glowStrengthSlider.value = String(glowPercent);
        if (glowStrengthValue) glowStrengthValue.textContent = `${glowPercent}%`;
        glowStrengthSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            if (glowStrengthValue) glowStrengthValue.textContent = `${value}%`;
            if (typeof window.setGlowStrength === 'function') window.setGlowStrength(parseInt(value, 10), true);
            else if (typeof window.syncVisualStateOnly === 'function') window.syncVisualStateOnly();
        });
    }
    document.getElementById('lux-apply-mix')?.addEventListener('click', () => {
        const mixerState = setStudioMixerState(readStudioMixerInputs(), true);
        const mixed = mixHsl(mixerState.hA, mixerState.sA, mixerState.lA, mixerState.hB, mixerState.sB, mixerState.lB, mixerState.ratio / 100);
        const mixed2 = mixHsl(mixerState.hA, mixerState.sA, mixerState.lA, mixerState.hB, mixerState.sB, mixerState.lB, Math.min((mixerState.ratio / 100) + 0.15, 1));
        applyCustomPalette(`hsl(${Math.round(mixed[0])},${Math.round(mixed[1])}%,${Math.round(mixed[2])}%)`, `hsl(${Math.round(mixed2[0])},${Math.round(mixed2[1])}%,${Math.round(mixed2[2])}%)`, true);
        if (typeof syncStudioUi === 'function') syncStudioUi();
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
            if (typeof syncStudioUi === 'function') syncStudioUi();
        });
        document.getElementById('lux-palette-grid')?.appendChild(chip);
    });
    BACKGROUND_MODES.forEach((mode) => {
        const item = document.createElement('div');
        item.className = 'lux-bg-mode-item';
        item.dataset.bgModeItem = mode.key;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-bg-mode-btn';
        button.dataset.bgMode = mode.key;
        button.setAttribute('data-lux-skip-modern-button', 'true');
        button.innerHTML = `<i class="${escapeHtml(mode.icon)}"></i><strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.copy)}</span>`;
        button.addEventListener('click', () => {
            setBackgroundMode(mode.key, true);
            syncStudioModePanels();
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
        });

        const settingsBtn = document.createElement('button');
        settingsBtn.type = 'button';
        settingsBtn.className = 'lux-bg-mode-settings-btn';
        settingsBtn.dataset.bgModeSettings = mode.key;
        settingsBtn.setAttribute('aria-label', `Configure ${mode.label}`);
        settingsBtn.setAttribute('data-lux-skip-modern-button', 'true');
        settingsBtn.innerHTML = '<i class="fas fa-sliders-h"></i><span>Parameters</span>';
        settingsBtn.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            openBgModeParamsPopup(mode.key);
        });

        item.addEventListener('click', (event) => {
            if (event.target.closest('.lux-bg-mode-settings-btn')) return;
            if (event.target.closest('.lux-bg-mode-btn')) return;
            button.click();
        });

        item.appendChild(button);
        item.appendChild(settingsBtn);
        document.getElementById('lux-bg-mode-grid')?.appendChild(item);
    });
    // Mount params popup shell first so particle/fog controls exist for binding below.
    ensureBgModeParamsPopup();
    bindFogStudioControls();
    const particleMotionSlider = document.getElementById('lux-particle-motion-slider');
    const particleMotionValue = document.getElementById('lux-particle-motion-value');
    if (particleMotionSlider && typeof getParticleMotion === 'function') {
        particleMotionSlider.value = String(getParticleMotion());
        if (particleMotionValue) particleMotionValue.textContent = particleMotionSlider.value;
        particleMotionSlider.addEventListener('input', (event) => {
            const value = event.target.value;
            if (particleMotionValue) particleMotionValue.textContent = value;
            if (typeof setParticleMotion === 'function') setParticleMotion(value, true);
        });
    }
    const particleDensitySlider = document.getElementById('lux-particle-density-slider');
    const particleDensityValue = document.getElementById('lux-particle-density-value');
    if (particleDensitySlider && typeof getParticleDensity === 'function') {
        particleDensitySlider.value = String(getParticleDensity());
        if (particleDensityValue) particleDensityValue.textContent = particleDensitySlider.value;
        particleDensitySlider.addEventListener('input', (event) => {
            const value = event.target.value;
            if (particleDensityValue) particleDensityValue.textContent = value;
            if (typeof setParticleDensity === 'function') setParticleDensity(value, true);
        });
    }
    const particleAmountSlider = document.getElementById('lux-particle-amount-slider');
    const particleAmountValue = document.getElementById('lux-particle-amount-value');
    if (particleAmountSlider && typeof getParticleAmount === 'function') {
        particleAmountSlider.value = String(getParticleAmount());
        if (particleAmountValue) particleAmountValue.textContent = particleAmountSlider.value;
        particleAmountSlider.addEventListener('input', (event) => {
            const value = event.target.value;
            if (particleAmountValue) particleAmountValue.textContent = value;
            if (typeof setParticleAmount === 'function') setParticleAmount(value, true);
        });
    }
    const particleSharpnessSlider = document.getElementById('lux-particle-sharpness-slider');
    const particleSharpnessValue = document.getElementById('lux-particle-sharpness-value');
    if (particleSharpnessSlider && typeof getParticleSharpness === 'function') {
        particleSharpnessSlider.value = String(getParticleSharpness());
        if (particleSharpnessValue) particleSharpnessValue.textContent = particleSharpnessSlider.value;
        particleSharpnessSlider.addEventListener('input', (event) => {
            const value = event.target.value;
            if (particleSharpnessValue) particleSharpnessValue.textContent = value;
            if (typeof setParticleSharpness === 'function') setParticleSharpness(value, true);
        });
    }
    const particleQualityGrid = document.getElementById('lux-particle-quality-grid');
    if (particleQualityGrid) particleQualityGrid.replaceChildren();
    (PARTICLE_QUALITY_OPTIONS || []).forEach((mode) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'lux-control-btn';
        button.dataset.particleQuality = mode.key;
        button.setAttribute('data-lux-skip-modern-button', 'true');
        button.innerHTML = `<strong>${escapeHtml(mode.label)}</strong><span>${escapeHtml(mode.copy)}</span>`;
        button.addEventListener('click', () => {
            if (typeof setParticleQuality === 'function') setParticleQuality(mode.key, true);
            if (typeof syncVisualStateOnly === 'function') syncVisualStateOnly();
            document.querySelectorAll('[data-particle-quality]').forEach((node) => {
                node.classList.toggle('is-active', node.dataset.particleQuality === mode.key);
            });
        });
        particleQualityGrid?.appendChild(button);
    });
    document.getElementById('lux-reset-visuals')?.addEventListener('click', () => {
        if (window.confirm('Reset visual settings for this portal profile?')) resetVisualSettings();
    });
    document.getElementById('lux-reset-current-layout')?.addEventListener('click', () => {
        const role = getEffectiveRole();
        if (!window.confirm(`Reset the ${getRoleLabels()[role] || 'current'} layout to KIU defaults?`)) return;
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
            if (event.key !== 'Escape') return;
            if (document.getElementById('lux-bg-gallery-backdrop')?.classList.contains('is-open')) {
                if (typeof closeBackgroundGalleryPopup === 'function') closeBackgroundGalleryPopup();
                return;
            }
            if (document.getElementById('lux-bg-mode-params-backdrop')?.classList.contains('is-open')) {
                closeBgModeParamsPopup();
                return;
            }
            closeStudio({ restoreFocus: true });
        });
        document.body.dataset.luxStudioEscBound = '1';
    }
    updateStudioPreview();
    if (typeof bindBackgroundGalleryStudioControls === 'function') bindBackgroundGalleryStudioControls();
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

const __luxShellStudio = typeof window.__kiuCreateLuxuryShellStudioApi === 'function'
    ? window.__kiuCreateLuxuryShellStudioApi({
        FOG_COLOR_FIELDS,
        getFogSettings: (...a) => (typeof window.getFogSettings === 'function' ? window.getFogSettings(...a) : null),
        setFogSettings: (...a) => window.setFogSettings?.(...a),
        escapeHtml: (...a) => (typeof escapeHtml === 'function' ? escapeHtml(...a) : window.escapeHtml?.(...a)),
        resolveActiveFogProfileBank: (...a) => resolveActiveFogProfileBank(...a),
        flashFogProfileAction: (...a) => flashFogProfileAction(...a),
        notifyFogProfileApiMissing: (...a) => (typeof notifyFogProfileApiMissing === 'function'
            ? notifyFogProfileApiMissing(...a)
            : window.notifyFogProfileApiMissing?.(...a))
    })
    : {};
const {
isFogProfileEditing,
    readFogSettingsFromStudioInputs,
    resolveFogSettingsForProfileSave,
    syncFogProfileEditPreview,
    isFogProfileEditDirty,
    syncFogProfileEditUi,
    clearFogProfileEditState,
    cancelFogProfileEdit,
    commitFogProfileEdit,
    startFogProfileEdit,
    buildFogProfileSwatchesMarkup,
    renderFogProfileList,
    buildFogProfileGhostMarkup,
    syncFogProfileIndexBadges,
    prefersReducedFogProfileMotion,
    readFogProfileDragMetrics,
    createFogProfileDragGhost,
    setFogProfilePlaceholder,
    updateFogProfileDragGhost,
    flipFogProfileSiblings,
    moveFogProfilePlaceholder,
    autoScrollFogProfileShell,
    clearFogProfileDragTransforms,
    cleanupFogProfileDragState,
    animateFogProfileGhostDrop,
    finishFogProfileDragReorder,
    scheduleFogProfileDragFrame,
    bindFogProfileListDrag,
    notifyFogProfileApiMissing,
    saveFogProfileFromInput,
    bindFogProfileControls
} = __luxShellStudio;

function bindFogStudioControls() {
    const fogColorGrid = document.getElementById('lux-fog-color-grid');
    if (fogColorGrid && !fogColorGrid.dataset.bound) {
        FOG_COLOR_FIELDS.forEach((field) => {
            const label = document.createElement('label');
            label.className = 'lux-fog-color-field';
            label.innerHTML = `
                <input type="color" class="lux-fog-color-input" data-fog-color="${escapeHtml(field.key)}" aria-label="${escapeHtml(field.label)}">
                <span class="lux-fog-color-copy">
                    <strong>${escapeHtml(field.label)}</strong>
                    <span class="lux-fog-color-hex" data-fog-color-hex="${escapeHtml(field.key)}">#000000</span>
                </span>
            `;
            label.querySelector('input')?.addEventListener('input', (event) => {
                const key = event.target.dataset.fogColor;
                if (!key || typeof window.setFogSettings !== 'function') return;
                window.setFogSettings({ [key]: event.target.value }, true);
                syncFogProfileEditPreview();
            });
            fogColorGrid.appendChild(label);
        });
        fogColorGrid.dataset.bound = '1';
    }
    const fogBlurSlider = document.getElementById('lux-fog-blur-slider');
    const fogBlurValue = document.getElementById('lux-fog-blur-value');
    if (fogBlurSlider && !fogBlurSlider.dataset.bound) {
        fogBlurSlider.dataset.bound = '1';
        fogBlurSlider.addEventListener('input', (event) => {
            const value = Number(event.target.value);
            if (fogBlurValue) fogBlurValue.textContent = value.toFixed(2);
            if (typeof window.setFogSettings === 'function') window.setFogSettings({ blurFactor: value }, true);
            syncFogProfileEditPreview();
        });
    }
    const fogSpeedSlider = document.getElementById('lux-fog-speed-slider');
    const fogSpeedValue = document.getElementById('lux-fog-speed-value');
    if (fogSpeedSlider && !fogSpeedSlider.dataset.bound) {
        fogSpeedSlider.dataset.bound = '1';
        fogSpeedSlider.addEventListener('input', (event) => {
            const value = Number(event.target.value);
            if (fogSpeedValue) fogSpeedValue.textContent = value.toFixed(2);
            if (typeof window.setFogSettings === 'function') window.setFogSettings({ speed: value }, true);
            syncFogProfileEditPreview();
        });
    }
    const fogZoomSlider = document.getElementById('lux-fog-zoom-slider');
    const fogZoomValue = document.getElementById('lux-fog-zoom-value');
    if (fogZoomSlider && !fogZoomSlider.dataset.bound) {
        fogZoomSlider.dataset.bound = '1';
        fogZoomSlider.addEventListener('input', (event) => {
            const value = Number(event.target.value);
            if (fogZoomValue) fogZoomValue.textContent = value.toFixed(2);
            if (typeof window.setFogSettings === 'function') window.setFogSettings({ zoom: value }, true);
            syncFogProfileEditPreview();
        });
    }
}

function isBgModeParamsPopupStale(existing) {
    if (!existing) return false;
    if (existing.dataset.fogParamsVersion !== FOG_PARAMS_TEMPLATE_VERSION) return true;
    return !existing.querySelector('#lux-fog-profile-save-edit')
        || !existing.querySelector('#lux-fog-profile-add')
        || !existing.querySelector('#lux-fog-profiles-section')
        || !existing.querySelector('[data-fog-profile-bank]');
}

function syncFogStudioInputs() {
    if (typeof getFogSettings !== 'function') return;
    const fog = getFogSettings();
    FOG_COLOR_FIELDS.forEach((field) => {
        const input = document.querySelector(`[data-fog-color="${field.key}"]`);
        const hexLabel = document.querySelector(`[data-fog-color-hex="${field.key}"]`);
        if (input) input.value = fog[field.key];
        if (hexLabel) hexLabel.textContent = String(fog[field.key] || '').toUpperCase();
    });
    const blurSlider = document.getElementById('lux-fog-blur-slider');
    const blurValue = document.getElementById('lux-fog-blur-value');
    if (blurSlider) blurSlider.value = String(fog.blurFactor);
    if (blurValue) blurValue.textContent = Number(fog.blurFactor).toFixed(2);
    const speedSlider = document.getElementById('lux-fog-speed-slider');
    const speedValue = document.getElementById('lux-fog-speed-value');
    if (speedSlider) speedSlider.value = String(fog.speed);
    if (speedValue) speedValue.textContent = Number(fog.speed).toFixed(2);
    const zoomSlider = document.getElementById('lux-fog-zoom-slider');
    const zoomValue = document.getElementById('lux-fog-zoom-value');
    if (zoomSlider) zoomSlider.value = String(fog.zoom);
    if (zoomValue) zoomValue.textContent = Number(fog.zoom).toFixed(2);
    renderFogProfileList();
}

function stashBgModePanels() {
    const particlePanel = document.getElementById('lux-bg-settings-panel-particle');
    const fogPanel = document.getElementById('lux-bg-settings-panel-fog');
    const store = document.getElementById('lux-bg-mode-panels-store');
    [particlePanel, fogPanel].forEach((panel) => {
        if (!panel || !store || panel.parentElement === store) return;
        panel.hidden = true;
        store.appendChild(panel);
    });
}

function mountBgModePanelInPopup(modeKey) {
    const particlePanel = document.getElementById('lux-bg-settings-panel-particle');
    const fogPanel = document.getElementById('lux-bg-settings-panel-fog');
    const body = document.getElementById('lux-bg-params-body');
    stashBgModePanels();
    if (!body || !modeKey) return null;
    if (PARTICLE_BG_MODES.has(modeKey) && particlePanel) {
        body.appendChild(particlePanel);
        particlePanel.hidden = false;
        if (Array.isArray(BACKGROUND_MODES)) {
            const meta = BACKGROUND_MODES.find((entry) => entry.key === modeKey);
            const label = document.getElementById('lux-bg-panel-particle-label');
            const copy = document.getElementById('lux-bg-panel-particle-copy');
            if (meta && label) label.textContent = meta.label;
            if (meta && copy) copy.textContent = meta.copy;
        }
        return particlePanel;
    }
    if (modeKey === 'fog' && fogPanel) {
        body.appendChild(fogPanel);
        fogPanel.hidden = false;
        return fogPanel;
    }
    return null;
}

function ensureBgModeParamsPopup() {
    let existing = document.getElementById('lux-bg-mode-params-backdrop');
    if (isBgModeParamsPopupStale(existing)) {
        if (typeof isFogProfileEditing === 'function' && isFogProfileEditing()) clearFogProfileEditState({ restoreSnapshot: true });
        existing?.remove();
        existing = null;
    }
    if (existing) return existing;
    const backdrop = document.createElement('div');
    backdrop.id = 'lux-bg-mode-params-backdrop';
    backdrop.className = 'lux-bg-mode-params-backdrop';
    backdrop.setAttribute('data-lux-transparency-exempt', '1');
    backdrop.dataset.fogParamsVersion = FOG_PARAMS_TEMPLATE_VERSION;
    backdrop.innerHTML = `
        <div class="lux-bg-mode-params-dialog" role="dialog" aria-modal="true" aria-labelledby="lux-bg-params-title" data-lux-transparency-exempt="1">
            <div class="lux-bg-mode-params-head">
                <div>
                    <div class="lux-bg-mode-params-title" id="lux-bg-params-title">Background Parameters</div>
                    <div class="lux-bg-mode-params-sub" id="lux-bg-params-sub">Tune motion, density, and quality for this background.</div>
                </div>
                <button class="lux-bg-mode-params-close" id="lux-bg-params-close" type="button" aria-label="Close parameters"><i class="fas fa-times"></i></button>
            </div>
            <div class="lux-bg-mode-params-body" id="lux-bg-params-body"></div>
            <div id="lux-bg-mode-panels-store" hidden>
                <section id="lux-bg-settings-panel-particle"
                         class="lux-bg-mode-panel"
                         data-bg-mode-panel="peak layered orbit corners"
                         hidden>
                    <p class="lux-bg-mode-panel-copy" id="lux-bg-panel-particle-copy">Ridged particle terrain waves.</p>
                    <p class="lux-bg-mode-panel-hint">Motion and density apply to all particle backgrounds.</p>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-wind"></i> Motion</span>
                            <span class="lux-transparency-value" id="lux-particle-motion-value">100</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-particle-motion-slider" min="0" max="120" value="100">
                    </div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-braille"></i> Density</span>
                            <span class="lux-transparency-value" id="lux-particle-density-value">100</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-particle-density-slider" min="35" max="100" value="100">
                    </div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-cubes"></i> Amount</span>
                            <span class="lux-transparency-value" id="lux-particle-amount-value">100</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-particle-amount-slider" min="50" max="150" value="100">
                    </div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-adjust"></i> Sharpness</span>
                            <span class="lux-transparency-value" id="lux-particle-sharpness-value">50</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-particle-sharpness-slider" min="0" max="100" value="50">
                    </div>
                    <div class="lux-bg-mode-panel-subsection">
                        <div class="lux-studio-label lux-studio-label--compact">Particle Quality</div>
                        <div class="lux-control-grid" id="lux-particle-quality-grid"></div>
                    </div>
                </section>
                <section id="lux-bg-settings-panel-fog"
                         class="lux-bg-mode-panel"
                         data-bg-mode-panel="fog"
                         hidden>
                    <p class="lux-bg-mode-panel-copy">Fog colors and motion are independent from interface mode and particle controls.</p>
                    <div class="lux-bg-mode-panel-subsection" id="lux-fog-profiles-section">
                        <div class="lux-fog-profile-bank-head">
                            <div class="lux-studio-label lux-studio-label--compact" id="lux-fog-profile-bank-label">Saved Profiles · Dark</div>
                            <div class="lux-fog-profile-bank-switch" role="group" aria-label="Fog profile bank">
                                <button type="button" class="lux-fog-profile-bank-btn is-active" data-fog-profile-bank="dark" data-lux-skip-modern-button="true" aria-pressed="true">Dark</button>
                                <button type="button" class="lux-fog-profile-bank-btn" data-fog-profile-bank="light" data-lux-skip-modern-button="true" aria-pressed="false">Light</button>
                            </div>
                        </div>
                        <div class="lux-fog-profile-list-shell">
                            <div class="lux-fog-profile-list" id="lux-fog-profile-list" role="list"></div>
                            <p class="lux-fog-profile-empty" id="lux-fog-profile-empty" hidden>No saved profiles yet.</p>
                        </div>
                        <div class="lux-fog-profile-edit-bar" id="lux-fog-profile-edit-bar" hidden>
                            <div class="lux-fog-profile-edit-copy">Editing <strong id="lux-fog-profile-edit-label"></strong></div>
                            <div class="lux-fog-profile-edit-actions">
                                <button type="button" class="lux-fog-profile-action-btn" id="lux-fog-profile-save-edit" data-fog-profile-save-edit data-lux-skip-modern-button="true" aria-label="Save profile changes"><i class="fas fa-check"></i><span>Save changes</span></button>
                                <button type="button" class="lux-fog-profile-action-btn" id="lux-fog-profile-discard-edit" data-fog-profile-discard-edit data-lux-skip-modern-button="true" aria-label="Discard profile changes"><i class="fas fa-undo"></i><span>Discard</span></button>
                            </div>
                        </div>
                        <div class="lux-fog-profile-add-row">
                            <input type="text" id="lux-fog-profile-name-input" class="lux-modern-field" placeholder="Profile name" maxlength="48" aria-label="New fog profile name">
                            <button type="button" class="lux-control-btn lux-fog-profile-btn" id="lux-fog-profile-add" data-fog-profile-add data-lux-skip-modern-button="true" aria-label="Save current fog settings as profile"><i class="fas fa-plus"></i><span>Save current</span></button>
                        </div>
                    </div>
                    <div class="lux-fog-color-grid" id="lux-fog-color-grid"></div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-water"></i> Blur</span>
                            <span class="lux-transparency-value" id="lux-fog-blur-value">0.60</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-fog-blur-slider" min="0" max="1" step="0.01" value="0.6">
                    </div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-wind"></i> Speed</span>
                            <span class="lux-transparency-value" id="lux-fog-speed-value">1.00</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-fog-speed-slider" min="0" max="3" step="0.05" value="1">
                    </div>
                    <div class="lux-transparency-control">
                        <div class="lux-transparency-header">
                            <span class="lux-transparency-label"><i class="fas fa-search-plus"></i> Zoom</span>
                            <span class="lux-transparency-value" id="lux-fog-zoom-value">1.00</span>
                        </div>
                        <input type="range" class="lux-range" id="lux-fog-zoom-slider" min="0.2" max="4" step="0.05" value="1">
                    </div>
                </section>
            </div>
        </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (event) => {
        if (event.target === backdrop) closeBgModeParamsPopup();
    });
    document.getElementById('lux-bg-params-close')?.addEventListener('click', () => closeBgModeParamsPopup());
    return backdrop;
}

function openBgModeParamsPopup(modeKey) {
    ensureBgModeParamsPopup();
    const backdrop = document.getElementById('lux-bg-mode-params-backdrop');
    if (!backdrop || !modeKey) return;
    const meta = Array.isArray(BACKGROUND_MODES) ? BACKGROUND_MODES.find((entry) => entry.key === modeKey) : null;
    const title = document.getElementById('lux-bg-params-title');
    const sub = document.getElementById('lux-bg-params-sub');
    if (meta && title) title.textContent = `${meta.label} Parameters`;
    if (meta && sub) sub.textContent = meta.copy;
    mountBgModePanelInPopup(modeKey);
    activeBgParamsMode = modeKey;
    backdrop.classList.add('is-open');
    if (modeKey === 'fog') {
        syncActiveFogProfileBankFromTheme();
        bindFogProfileControls();
        bindFogProfileListDrag();
        bindFogStudioControls();
        syncFogProfileBankUi();
        syncFogStudioInputs();
    } else {
        const motionSlider = document.getElementById('lux-particle-motion-slider');
        const motionValue = document.getElementById('lux-particle-motion-value');
        if (motionSlider && typeof getParticleMotion === 'function') {
            motionSlider.value = String(getParticleMotion());
            if (motionValue) motionValue.textContent = motionSlider.value;
        }
        const densitySlider = document.getElementById('lux-particle-density-slider');
        const densityValue = document.getElementById('lux-particle-density-value');
        if (densitySlider && typeof getParticleDensity === 'function') {
            densitySlider.value = String(getParticleDensity());
            if (densityValue) densityValue.textContent = densitySlider.value;
        }
        document.querySelectorAll('[data-particle-quality]').forEach((button) => {
            button.classList.toggle('is-active', typeof getParticleQuality === 'function' && button.dataset.particleQuality === getParticleQuality());
        });
    }
    focusFirstInteractive(backdrop, '#lux-bg-params-close');
}

function closeBgModeParamsPopup() {
    if (typeof isFogProfileEditing === 'function' && isFogProfileEditing()) {
        if (isFogProfileEditDirty()) {
            if (confirm('Save profile changes before closing?')) {
                commitFogProfileEdit();
                if (isFogProfileEditing()) return;
            } else if (!confirm('Discard unsaved profile changes?')) {
                return;
            } else {
                clearFogProfileEditState({ restoreSnapshot: true });
            }
        } else {
            syncFogProfileEditUi();
        }
        const nameInput = document.getElementById('lux-fog-profile-name-input');
        if (nameInput) nameInput.value = '';
    }
    const backdrop = document.getElementById('lux-bg-mode-params-backdrop');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    activeBgParamsMode = null;
    stashBgModePanels();
}

function syncStudioModePanels() {
    const mode = typeof getBackgroundMode === 'function' ? getBackgroundMode() : 'peak';
    document.querySelectorAll('[data-bg-mode]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.bgMode === mode);
    });
}

function syncStudioUi() {
    const studio = document.getElementById('lux-studio-backdrop');
    if (!studio) return;
    const showHomeLayoutControls = getActivePageId() === 'home';
    syncStudioModePanels();
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
    const motionSlider = document.getElementById('lux-particle-motion-slider');
    const motionValue = document.getElementById('lux-particle-motion-value');
    if (motionSlider && typeof getParticleMotion === 'function') {
        motionSlider.value = String(getParticleMotion());
        if (motionValue) motionValue.textContent = motionSlider.value;
    }
    const densitySlider = document.getElementById('lux-particle-density-slider');
    const densityValue = document.getElementById('lux-particle-density-value');
    if (densitySlider && typeof getParticleDensity === 'function') {
        densitySlider.value = String(getParticleDensity());
        if (densityValue) densityValue.textContent = densitySlider.value;
    }
    const amountSlider = document.getElementById('lux-particle-amount-slider');
    const amountValue = document.getElementById('lux-particle-amount-value');
    if (amountSlider && typeof getParticleAmount === 'function') {
        amountSlider.value = String(getParticleAmount());
        if (amountValue) amountValue.textContent = amountSlider.value;
    }
    const sharpnessSlider = document.getElementById('lux-particle-sharpness-slider');
    const sharpnessValue = document.getElementById('lux-particle-sharpness-value');
    if (sharpnessSlider && typeof getParticleSharpness === 'function') {
        sharpnessSlider.value = String(getParticleSharpness());
        if (sharpnessValue) sharpnessValue.textContent = sharpnessSlider.value;
    }
    studio.querySelectorAll('[data-particle-quality]').forEach((button) => {
        button.classList.toggle('is-active', typeof getParticleQuality === 'function' && button.dataset.particleQuality === getParticleQuality());
    });
    studio.querySelectorAll('[data-glass-blur-quality]').forEach((button) => {
        button.classList.toggle('is-active', typeof getGlassBlurQuality === 'function' && button.dataset.glassBlurQuality === getGlassBlurQuality());
    });
    const glowStrengthSliderSync = document.getElementById('lux-glow-strength-slider');
    const glowStrengthValueSync = document.getElementById('lux-glow-strength-value');
    if (glowStrengthSliderSync && typeof window.getGlowStrength === 'function') {
        const glowPercent = window.getGlowStrength();
        glowStrengthSliderSync.value = String(glowPercent);
        if (glowStrengthValueSync) glowStrengthValueSync.textContent = `${glowPercent}%`;
    }
    ['lux-reset-current-layout', 'lux-reset-all-layouts', 'lux-reset-home-defaults'].forEach((id) => {
        const button = document.getElementById(id);
        if (button) button.hidden = !showHomeLayoutControls;
    });
    document.getElementById('lux-mode-dark')?.classList.toggle('is-active', getThemeMode() === 'dark');
    document.getElementById('lux-mode-light')?.classList.toggle('is-active', getThemeMode() === 'light');
    document.getElementById('lux-bg-animation-on')?.classList.toggle('is-active', typeof areBackgroundAnimationsEnabled === 'function' ? areBackgroundAnimationsEnabled() : true);
    document.getElementById('lux-bg-animation-off')?.classList.toggle('is-active', typeof areBackgroundAnimationsEnabled === 'function' ? !areBackgroundAnimationsEnabled() : false);
    const staticBgSection = document.getElementById('lux-static-bg-section');
    const animationsOff = typeof areBackgroundAnimationsEnabled === 'function' ? !areBackgroundAnimationsEnabled() : false;
    if (staticBgSection) staticBgSection.hidden = !animationsOff;
    const currentStaticFill = typeof getStaticBackgroundFill === 'function' ? getStaticBackgroundFill() : 'colored';
    document.querySelectorAll('[data-static-bg-fill]').forEach((button) => {
        button.classList.toggle('is-active', button.dataset.staticBgFill === currentStaticFill);
    });
    syncFogStudioInputs();
    if (typeof syncBackgroundGalleryStudioUi === 'function') syncBackgroundGalleryStudioUi();
    const galleryAdminButtons = document.querySelectorAll('[data-lux-admin-only="1"]');
    const isAdmin = typeof getEffectiveRole === 'function' && getEffectiveRole() === 'admin';
    galleryAdminButtons.forEach((button) => { button.hidden = !isAdmin; });
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
        [backdrop, ...backdrop.querySelectorAll('.lux-studio-panel, [data-lux-transparency-exempt="1"]')].forEach((el) => {
            el.style.removeProperty('background-color');
            el.style.removeProperty('background');
            el.style.removeProperty('backdrop-filter');
            el.style.removeProperty('-webkit-backdrop-filter');
            delete el.dataset.luxTransparencySignature;
        });
        const ensureGallery = window.__kiuEnsureBackgroundGalleryScripts;
        if (typeof ensureGallery === 'function') {
            ensureGallery()
                .then(() => {
                    if (typeof bindBackgroundGalleryStudioControls === 'function') bindBackgroundGalleryStudioControls();
                    if (typeof refreshBackgroundGalleryData === 'function') refreshBackgroundGalleryData();
                })
                .catch(() => {});
        } else if (typeof refreshBackgroundGalleryData === 'function') {
            refreshBackgroundGalleryData();
        }
        syncStudioUi();
        updateStudioPreview();
        focusFirstInteractive(backdrop, '#lux-studio-close, #lux-mode-dark, #lux-mode-light');
    } else {
        restoreFocusById('lux-palette-btn');
    }
}

function closeStudio(options = {}) {
    closeBgModeParamsPopup();
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

function invokeSidebarToggle() {
    closeStudio();
    closeUtilityPanels();
    closePickerPanels();
    closeUserMenu();
    const toggleSidebarFn =
        typeof window.toggleSidebar === 'function'
            ? window.toggleSidebar
            : getLuxurySharedConfig().toggleSidebar;
    if (typeof toggleSidebarFn === 'function') toggleSidebarFn();
}

function bindSidebarToggleButton(button) {
    if (!button || button.dataset.bound) return;
    button.addEventListener('click', invokeSidebarToggle);
    button.dataset.bound = '1';
}

function bindTopbarControls() {
    bindSidebarToggleButton(document.getElementById('lux-sidebar-toggle'));
    bindSidebarToggleButton(document.getElementById('lux-sidebar-close'));

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
            if (typeof window.populateRoleSwitcher === 'function') {
                window.populateRoleSwitcher({ ensurePanel: true });
            }
            togglePickerPanel('lux-role-picker-panel', 'lux-role-picker-btn');
        });
        roleButton.dataset.bound = '1';
    }

    const editorButton = document.getElementById('lux-dashboard-edit-btn');
    if (editorButton) {
        editorButton.hidden = true;
        editorButton.style.setProperty('display', 'none', 'important');
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
            closePickerPanels({ immediate: true });
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

function isDesktopSidebarOverlayViewport() {
    return typeof window !== 'undefined' && window.innerWidth >= 1181;
}

function isSidebarOverlayRoute() {
    return Boolean(document.body?.classList.contains('lux-unified-shell'));
}

function resolvePreferredSidebarCollapsed() {
    try {
        const saved = localStorage.getItem('kiuLuxurySidebarCollapsed');
        if (saved === '1') return true;
        if (saved === '0') return false;
    } catch (_) { /* ignore */ }
    // Default expanded so left nav is available on every unified-shell route.
    return false;
}

function ensureDesktopSidebarOverlayDefaults() {
    if (!isDesktopSidebarOverlayViewport()) return;
    if (!isSidebarOverlayRoute()) return;
    const collapsed = resolvePreferredSidebarCollapsed();
    if (typeof window.applySidebarState === 'function') {
        window.applySidebarState(collapsed, { persist: false });
        return;
    }
    document.body.classList.toggle('lux-sidebar-collapsed', collapsed);
    document.body.dataset.luxSidebar = collapsed ? 'collapsed' : 'expanded';
}

function initializeLuxuryShellChromeBindings(attemptsRemaining = 24) {
    if (typeof document === 'undefined') return;
    const hasShellChrome = Boolean(document.getElementById('lux-topbar') || document.getElementById('lux-user-chip'));
    if (hasShellChrome) {
        if (typeof pinStudentServiceWorkspaceRole === 'function') {
            pinStudentServiceWorkspaceRole({ refreshChrome: false });
        } else if (typeof applyPortalViewRoleFromLocation === 'function') {
            applyPortalViewRoleFromLocation({ refreshChrome: false });
        }
        bindUserMenu();
        bindTopbarControls();
        bindLuxPickerDismissHandlers();
        if (document.getElementById('lux-shell')) {
            renderNav();
        }
        seedRolePickerLabel();
        if (typeof window.populateRoleSwitcher === 'function') {
            window.populateRoleSwitcher();
        }
        if (typeof window.syncChromeBottom === 'function') {
            window.syncChromeBottom();
        }
        if (typeof window.ensureChromeBottomResizeListener === 'function') {
            window.ensureChromeBottomResizeListener();
        }
        ensureDesktopSidebarOverlayDefaults();
        return;
    }
    if (attemptsRemaining <= 0) return;
    const scheduleRetry = window.requestAnimationFrame || ((cb) => window.setTimeout(cb, 16));
    scheduleRetry(() => initializeLuxuryShellChromeBindings(attemptsRemaining - 1));
}

window.__KIU_LUXURY_SHELL_CHROME_LOADED = true;

if (document.readyState === 'loading') {
    
document.addEventListener('DOMContentLoaded', () => {
        bindLuxPickerDismissHandlers();
        initializeLuxuryShellChromeBindings();
    }, { once: true });
} else {
    bindLuxPickerDismissHandlers();
    initializeLuxuryShellChromeBindings();
}
