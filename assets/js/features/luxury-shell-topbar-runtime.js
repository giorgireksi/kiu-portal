/* Faculty/role switchers + topbar sync. Peeled from luxury-shell-chrome.js.
 * Load before luxury-shell-chrome.js.
 */
(function initWave18Peel() {
    if (window.__KIU_LUXURY_SHELL_TOPBAR_LOADED) return;
    window.__KIU_LUXURY_SHELL_TOPBAR_LOADED = true;

    window.__kiuCreateLuxuryShellTopbarApi = function createKiuPeelApi(deps = {}) {
        const d = deps;
        void d;
        /* Non-strict factory body: free vars resolve to window globals at call time. */

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
        panel.innerHTML = `<div class="lux-picker-panel-scrollport">${optionsList.map((opt) => `
            <button class="lux-picker-option${opt.value === currentValue ? ' is-active' : ''}" type="button" data-faculty-option="${escapeHtml(opt.value)}">
                <strong>${escapeHtml(opt.label)}</strong>
            </button>
        `).join('')}</div>`;
        panel.dataset.renderSignature = signature;
    }
    if (panel.dataset.bound !== '1') {
        panel.addEventListener('click', (event) => {
            const optionButton = event.target.closest('[data-faculty-option]');
            if (!optionButton || !panel.contains(optionButton)) return;
            closePickerPanels();
            if (typeof switchFacultyTheme === 'function') {
                switchFacultyTheme(optionButton.dataset.facultyOption, { refreshDependentViews: true });
            }
        });
        panel.dataset.bound = '1';
    }
}

function roleSwitcherHasPersona(roleKey, preferredFaculty = '') {
    if (roleKey === 'admin') return true;
    const faculty = preferredFaculty
        || (typeof getCurrentFacultyCode === 'function' ? getCurrentFacultyCode() : '')
        || (typeof localStorage !== 'undefined' ? localStorage.getItem('currentFaculty') : '')
        || 'ECON';
    if (typeof hasImpersonationPersonaForRole === 'function') {
        return hasImpersonationPersonaForRole(roleKey, faculty);
    }
    if (typeof getPreferredImpersonationUserForRole !== 'function') return true;
    return Boolean(getPreferredImpersonationUserForRole(roleKey, faculty)?.id);
}

function populateRoleSwitcher(options = {}) {
    const button = document.getElementById('lux-role-picker-btn');
    const value = document.getElementById('lux-role-picker-value');
    let panel = document.getElementById('lux-role-picker-panel');
    if (!button || !value) return;
    const roles = ['student', 'professor', 'ta', 'admin', 'student_service'];
    const activeRole = getShellRole();
    const roleLabels = getRoleLabels();
    const authenticatedAdmin = (
        (typeof currentUser !== 'undefined' && String(currentUser?.role || '').trim().toLowerCase() === 'admin')
        || (typeof getCurrentUser === 'function' && String(getCurrentUser()?.role || '').trim().toLowerCase() === 'admin')
    );
    const preferredFaculty = typeof getCurrentFacultyCode === 'function'
        ? getCurrentFacultyCode()
        : (typeof localStorage !== 'undefined' ? localStorage.getItem('currentFaculty') : '');
    const staffUrl = typeof resolvePortalRouteUrl === 'function'
        ? resolvePortalRouteUrl('staff', 'admin')
        : 'staff.html';
    value.textContent = resolveRolePickerLabel(activeRole);
    if (!panel && !options.ensurePanel) return;
    panel = panel || ensureShellPickerPanel('lux-role-picker-panel');
    if (!panel) return;
    const personaSignature = authenticatedAdmin
        ? roles.map((roleKey) => `${roleKey}:${roleSwitcherHasPersona(roleKey, preferredFaculty) ? '1' : '0'}`).join('|')
        : '';
    const signature = `${activeRole}|${personaSignature}`;
    if (panel.dataset.renderSignature !== signature) {
        panel.innerHTML = `<div class="lux-picker-panel-scrollport">${roles.map((roleKey) => {
            const missingPersona = authenticatedAdmin && roleKey !== 'admin' && !roleSwitcherHasPersona(roleKey, preferredFaculty);
            const personaHint = missingPersona
                ? ` No account — create in Staff (${staffUrl}).`
                : '';
            const label = resolveRolePickerLabel(roleKey);
            const title = missingPersona ? `${label}${personaHint}` : label;
            return `
            <button class="lux-picker-option${roleKey === activeRole ? ' is-active' : ''}" type="button" data-role-option="${escapeHtml(roleKey)}" title="${escapeHtml(title)}">
                <strong>${escapeHtml(label)}</strong>
            </button>
        `;
        }).join('')}</div>`;
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

function syncViewAsBanner() {
    const banner = document.getElementById('lux-view-as-banner');
    if (banner) banner.remove();
    document.body.classList.remove('lux-view-as-active');
}

const CHROME_GAP_FALLBACK_PX = 26;
let chromeBottomResizeBound = false;
let chromeBottomResizeObserver = null;
let chromeGapPxCache = null;
let chromeGapPxCacheUntil = 0;

function readChromeGapPx() {
    const now = performance.now();
    if (chromeGapPxCache != null && now < chromeGapPxCacheUntil) return chromeGapPxCache;
    const root = document.documentElement;
    if (!root) return CHROME_GAP_FALLBACK_PX;
    const raw = getComputedStyle(root).getPropertyValue('--lux-chrome-gap').trim();
    const parsed = parseFloat(raw);
    chromeGapPxCache = Number.isFinite(parsed) ? parsed : CHROME_GAP_FALLBACK_PX;
    chromeGapPxCacheUntil = now + 2000;
    return chromeGapPxCache;
}

function invalidateChromeGapPxCache() {
    chromeGapPxCache = null;
    chromeGapPxCacheUntil = 0;
}

function buildSyncTopbarSignature() {
    const currentUser = typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null;
    const notifications = typeof getNotificationSnapshot === 'function' ? getNotificationSnapshot(currentUser) : { unread: 0 };
    const messenger = typeof getMessengerSnapshot === 'function' ? getMessengerSnapshot(currentUser) : { unread: 0 };
    const activePageId = typeof getActivePageId === 'function' ? getActivePageId() : 'home';
    const shellRole = typeof getShellRole === 'function' ? getShellRole(activePageId) : 'student';
    const effectiveRole = typeof getEffectiveRole === 'function' ? getEffectiveRole() : 'student';
    const currentFacultyCode = typeof getCurrentFacultyCode === 'function' ? getCurrentFacultyCode() : '';
    const resolvedUserName = typeof getUserName === 'function' ? getUserName() : 'Portal User';
    const currentPageLabel = typeof pageLabel === 'function' ? pageLabel(activePageId) : 'Dashboard';
    const utilityPanelsOpen = Boolean(document.querySelector('#lux-notification-panel.is-open, #lux-chat-panel.is-open'));
    return [
        activePageId,
        shellRole,
        effectiveRole,
        currentFacultyCode,
        resolvedUserName,
        currentPageLabel,
        notifications.unread,
        messenger.unread,
        utilityPanelsOpen ? '1' : '0'
    ].join('|');
}

function syncChromeBottom() {
    const topbar = document.getElementById('lux-topbar');
    const root = document.documentElement;
    if (!topbar || !root) return;

    const rect = topbar.getBoundingClientRect();
    const bottom = rect.bottom;
    if (!Number.isFinite(bottom) || bottom <= 0) return;

    const gap = readChromeGapPx();
    root.style.setProperty('--lux-chrome-bottom', `${Math.ceil(bottom + gap)}px`);
}

function ensureChromeBottomResizeListener() {
    if (chromeBottomResizeBound || typeof window === 'undefined') return;
    chromeBottomResizeBound = true;

    let frame = 0;
    const schedule = () => {
        const raf = window.requestAnimationFrame || ((cb) => window.setTimeout(cb, 16));
        if (frame) {
            const cancel = window.cancelAnimationFrame || window.clearTimeout;
            cancel(frame);
        }
        frame = raf(() => {
            frame = 0;
            syncChromeBottom();
        });
    };

    window.addEventListener('resize', () => {
        invalidateChromeGapPxCache();
        schedule();
    }, { passive: true });

    if (typeof ResizeObserver === 'function') {
        const topbar = document.getElementById('lux-topbar');
        if (topbar) {
            chromeBottomResizeObserver = new ResizeObserver(schedule);
            chromeBottomResizeObserver.observe(topbar);
        }
    }
}

function syncTopbar() {
    const topbarSignature = buildSyncTopbarSignature();
    if (window.__luxLastSyncTopbarSignature === topbarSignature) {
        syncChromeBottom();
        ensureChromeBottomResizeListener();
        return;
    }
    window.__luxLastSyncTopbarSignature = topbarSignature;
    syncViewAsBanner();
    const currentUser = typeof getCurrentUserSafe === 'function' ? getCurrentUserSafe() : null;
    const notifications = typeof getNotificationSnapshot === 'function' ? getNotificationSnapshot(currentUser) : { unread: 0 };
    const messenger = typeof getMessengerSnapshot === 'function' ? getMessengerSnapshot(currentUser) : { unread: 0 };
    const activePageId = typeof getActivePageId === 'function' ? getActivePageId() : 'home';
    const onHome = activePageId === 'home';
    const shellRole = typeof getShellRole === 'function' ? getShellRole(activePageId) : 'student';
    const roleLabels = getRoleLabels();
    const effectiveRole = typeof getEffectiveRole === 'function' ? getEffectiveRole() : 'student';
    const currentFacultyCode = typeof getCurrentFacultyCode === 'function' ? getCurrentFacultyCode() : '';
    const resolvedUserName = typeof getUserName === 'function' ? getUserName() : 'Portal User';
    const homeEditorState = typeof HOME_EDITOR_STATE === 'object' && HOME_EDITOR_STATE
        ? HOME_EDITOR_STATE
        : { editing: false, role: '' };
    const footerAvatar = shellRole === 'student'
        ? 'KI'
        : (typeof getUserInitials === 'function' ? getUserInitials() : 'KI');
    const footerName = shellRole === 'student' ? 'Portal User' : resolvedUserName;
    const facultyName = typeof getFacultyName === 'function' ? getFacultyName(currentFacultyCode) : 'University Portal';
    const currentPageLabel = typeof pageLabel === 'function' ? pageLabel(activePageId) : 'Dashboard';
    const footerRole = shellRole === 'student' ? 'University Portal' : `${roleLabels[effectiveRole] || 'Portal'} - ${facultyName}`;
    const chipRole = shellRole === 'student' ? 'Student Portal / University Portal' : `${currentPageLabel} / ${roleLabels[effectiveRole] || 'Portal'}`;
    const setText = (id, value) => {
        const node = document.getElementById(id);
        if (!node) return;
        node.textContent = value;
    };
    setText('lux-breadcrumb-page', currentPageLabel);
    setText('lux-avatar', footerAvatar);
    setText('lux-chip-avatar', footerAvatar);
    setText('lux-user-name', footerName);
    setText('lux-chip-name', shellRole === 'student' ? 'Portal' : (resolvedUserName.split(/\s+/)[0] || 'Portal'));
    setText('lux-user-role', footerRole);
    setText('lux-chip-role', chipRole);
    const editButton = document.getElementById('lux-dashboard-edit-btn');
    const bell = document.getElementById('lux-notification-btn');
    const bellBadge = document.getElementById('lux-notification-badge');
    const chat = document.getElementById('lux-chat-btn');
    const chatBadge = document.getElementById('lux-chat-badge');
    if (editButton) {
        editButton.hidden = true;
        editButton.style.setProperty('display', 'none', 'important');
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
    if (document.body?.classList?.contains('lux-route-lms') && typeof window.ensureLmsRouteVisualState === 'function') {
        window.ensureLmsRouteVisualState();
    }
    if (
        (document.body?.classList?.contains('lux-route-admin-library')
            || document.body?.classList?.contains('lux-entry-admin-library')
            || document.getElementById('page-library')?.querySelector('.alib-workspace'))
        && typeof window.ensureAdminLibraryRouteVisualState === 'function'
    ) {
        window.ensureAdminLibraryRouteVisualState();
    }
    populateRoleSwitcher();
    syncChromeBottom();
    ensureChromeBottomResizeListener();
}

        const api = {
            populateFacultySwitcher,
            populateRoleSwitcher,
            ensureChromeBottomResizeListener,
            syncChromeBottom,
            syncTopbar,
        };
        Object.assign(window, api);
        return api;
    };

    window.__kiuCreateLuxuryShellTopbarApi({});
})();

