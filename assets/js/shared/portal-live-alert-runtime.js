(function initPortalLiveAlertRuntime() {
    'use strict';
    if (window.__KIU_PORTAL_LIVE_ALERT_LOADED) return;
    window.__KIU_PORTAL_LIVE_ALERT_LOADED = true;

    const DEFAULT_DURATION_MS = 7000;
    const DISMISS_ANIMATION_MS = 220;
    const POLL_INTERVAL_MS = 60000;
    const MAX_STACK = 4;
    const SEEN_STORAGE_PREFIX = 'kiu_live_alert_seen:';

    const state = {
        toasts: [],
        seenToastIds: new Set(),
        pollTimer: 0,
        pollPromise: null,
        bound: false,
        mergedItems: [],
        lastUserId: '',
        bootstrapped: false
    };

    function text(value) {
        return String(value == null ? '' : value).trim();
    }

    function currentUserId() {
        try {
            if (typeof getCurrentUserId === 'function') return text(getCurrentUserId());
            if (typeof getCurrentUser === 'function') return text(getCurrentUser()?.id);
        } catch (error) {}
        return text(window.currentUser?.id || sessionStorage.getItem('KIU_ACTIVE_SESSION_USER_ID') || '');
    }

    function seenStorageKey(userId = currentUserId()) {
        return `${SEEN_STORAGE_PREFIX}${text(userId) || 'anon'}`;
    }

    function loadSeenToastIds(userId = currentUserId()) {
        state.seenToastIds = new Set();
        try {
            const raw = sessionStorage.getItem(seenStorageKey(userId));
            if (!raw) return;
            JSON.parse(raw).forEach((id) => {
                const normalized = text(id);
                if (normalized) state.seenToastIds.add(normalized);
            });
        } catch (error) {}
    }

    function persistSeenToastIds(userId = currentUserId()) {
        try {
            sessionStorage.setItem(
                seenStorageKey(userId),
                JSON.stringify(Array.from(state.seenToastIds).slice(-200))
            );
        } catch (error) {}
    }

    function markToastSeen(id) {
        const normalized = text(id);
        if (!normalized) return;
        state.seenToastIds.add(normalized);
        persistSeenToastIds();
    }

    function escapeHtml(value) {
        if (typeof window.escapeHtml === 'function' && window.escapeHtml !== escapeHtml) {
            return window.escapeHtml(value);
        }
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function normalizeAlertIcon(type, source) {
        if (typeof window.getPortalSystemNotificationIcon === 'function') {
            return window.getPortalSystemNotificationIcon(type);
        }
        if (text(source) === 'social') return 'fa-comments';
        if (text(source) === 'mail' || text(source) === 'messenger') return 'fa-envelope';
        if (text(source) === 'calls') return 'fa-phone';
        return 'fa-bell';
    }

    function normalizeApiNotification(item = {}) {
        const id = text(item.id);
        return {
            id,
            key: text(item.key || id),
            source: text(item.sourceDomain || item.source || 'portal'),
            type: text(item.type || 'general'),
            title: text(item.title || 'Notification'),
            text: text(item.body || item.text || ''),
            read: Boolean(item.isRead ?? item.read),
            createdAt: text(item.createdAt || ''),
            routePage: text(item.routePage || ''),
            routeData: item.routeData && typeof item.routeData === 'object' ? item.routeData : {},
            icon: normalizeAlertIcon(item.type, item.sourceDomain || item.source)
        };
    }

    function normalizeLocalNotification(item = {}) {
        const id = text(item.id);
        return {
            id,
            key: text(item.key || `system:${id}`),
            source: text(item.source || 'school'),
            type: text(item.type || 'update'),
            title: text(item.title || 'Notification'),
            text: text(item.text || ''),
            read: Boolean(item.read),
            createdAt: text(item.createdAt || ''),
            routePage: text(item.routePage || ''),
            routeData: item.routeData && typeof item.routeData === 'object' ? item.routeData : {},
            icon: text(item.icon || normalizeAlertIcon(item.type, item.source))
        };
    }

    function ensureRegion() {
        let region = document.getElementById('portal-live-alert-region');
        if (region) return region;
        region = document.createElement('div');
        region.id = 'portal-live-alert-region';
        region.className = 'portal-live-alert-region';
        region.setAttribute('aria-live', 'polite');
        region.setAttribute('aria-relevant', 'additions');
        document.body.appendChild(region);
        return region;
    }

    function renderRegion() {
        const region = ensureRegion();
        if (!state.toasts.length) {
            region.innerHTML = '';
            return;
        }
        region.innerHTML = `<div class="portal-live-alert-stack">
            ${state.toasts.map((toast) => `
                <article class="portal-live-alert ${toast.dismissing ? 'is-dismissing' : ''}" data-alert-id="${escapeHtml(toast.id)}">
                    <div class="portal-live-alert__icon" aria-hidden="true"><i class="fas ${escapeHtml(toast.icon || 'fa-bell')}"></i></div>
                    <div class="portal-live-alert__content">
                        <strong class="portal-live-alert__title">${escapeHtml(toast.title)}</strong>
                        ${toast.text ? `<span class="portal-live-alert__text">${escapeHtml(toast.text)}</span>` : ''}
                    </div>
                    <button class="portal-live-alert__close lux-ghost-btn" type="button" data-action="portal-live-alert-dismiss" data-alert-id="${escapeHtml(toast.id)}" aria-label="Dismiss notification"><i class="fas fa-times" aria-hidden="true"></i></button>
                </article>
            `).join('')}
        </div>`;
    }

    function dismissPortalLiveAlert(id) {
        const alertId = text(id);
        if (!alertId) return;
        const toast = state.toasts.find((entry) => text(entry.id) === alertId);
        if (!toast || toast.dismissing) return;
        toast.dismissing = true;
        if (toast.timeoutId) {
            window.clearTimeout(toast.timeoutId);
            toast.timeoutId = 0;
        }
        renderRegion();
        window.setTimeout(() => {
            state.toasts = state.toasts.filter((entry) => text(entry.id) !== alertId);
            renderRegion();
        }, DISMISS_ANIMATION_MS);
    }

    function showPortalLiveAlert(input = {}) {
        const id = text(input.id || input.key || `live_alert_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
        if (!id) return '';
        if (state.toasts.some((entry) => text(entry.id) === id)) return id;
        if (state.seenToastIds.has(id) && input.force !== true) return '';

        const toast = {
            id,
            title: text(input.title || 'Notification'),
            text: text(input.text || input.body || ''),
            icon: text(input.icon || normalizeAlertIcon(input.type, input.source)) || 'fa-bell',
            dismissing: false,
            timeoutId: 0
        };
        state.toasts.push(toast);
        if (state.toasts.length > MAX_STACK) {
            const dropped = state.toasts.splice(0, state.toasts.length - MAX_STACK);
            dropped.forEach((entry) => {
                if (entry.timeoutId) window.clearTimeout(entry.timeoutId);
            });
        }
        markToastSeen(id);
        const duration = Math.max(1000, Number(input.duration) || DEFAULT_DURATION_MS);
        toast.timeoutId = window.setTimeout(() => dismissPortalLiveAlert(id), duration);
        renderRegion();
        return id;
    }

    function toastFromNotification(notification = {}, options = {}) {
        const normalized = notification.id && notification.title
            ? notification
            : normalizeApiNotification(notification);
        if (!normalized.id) return '';
        if (normalized.read && options.skipRead !== false) return '';
        return showPortalLiveAlert({
            id: normalized.id,
            title: normalized.title,
            text: normalized.text,
            icon: normalized.icon,
            type: normalized.type,
            source: normalized.source,
            duration: options.duration,
            force: options.force === true
        });
    }

    function updateNotificationBridge(items = []) {
        state.mergedItems = items.slice();
        window.__kiuPortalLiveAlertMergedItems = state.mergedItems;
        window.__kiuPortalLiveAlertSnapshot = {
            items: state.mergedItems.slice(0, 12),
            unread: state.mergedItems.filter((item) => !item.read).length
        };
        if (typeof window.syncTopbar === 'function') {
            try { window.syncTopbar(); } catch (error) {}
        }
    }

    function mergeNotificationSources(apiItems = [], localItems = []) {
        const merged = new Map();
        [...localItems, ...apiItems].forEach((item) => {
            const normalized = item.source && item.title && !item.body
                ? normalizeLocalNotification(item)
                : normalizeApiNotification(item);
            if (!normalized.id) return;
            merged.set(normalized.id, normalized);
        });
        return Array.from(merged.values()).sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    }

    function collectLocalNotifications(userId = currentUserId()) {
        const local = [];
        if (typeof window.getPortalSystemNotificationsForUser === 'function') {
            local.push(...window.getPortalSystemNotificationsForUser(userId) || []);
        }
        if (typeof window.getPortalNotificationItemsForUser === 'function') {
            local.push(...window.getPortalNotificationItemsForUser(userId) || []);
        }
        return local;
    }

    function snapshotFromPortalItems(user) {
        const userId = user?.id ?? user;
        if (typeof window.getPortalNotificationItemsForUser !== 'function') {
            return { items: [], unread: 0 };
        }
        const items = window.getPortalNotificationItemsForUser(userId) || [];
        const unread = typeof window.getPortalNotificationUnreadCount === 'function'
            ? window.getPortalNotificationUnreadCount(userId)
            : items.filter((item) => !item.read).length;
        return { items, unread };
    }

    function buildSnapshotFromItems(items = []) {
        return {
            items,
            unread: items.filter((item) => !item.read).length
        };
    }

    function resolveBaseNotificationSnapshot(user, snapshot) {
        if (snapshot && !snapshot.__kiuFallback) {
            try {
                const base = snapshot(user);
                if (base && Array.isArray(base.items)) return base;
            } catch (error) {}
        }
        return snapshotFromPortalItems(user);
    }

    async function fetchApiNotifications(userId = currentUserId()) {
        if (!userId || typeof window.kiuPortalFetch !== 'function') return [];
        const runtime = typeof ensurePortalBackendRuntime === 'function' ? ensurePortalBackendRuntime() : null;
        if (runtime && runtime.backendUnavailableUntil && Date.now() < runtime.backendUnavailableUntil) return [];
        try {
            const payload = await window.kiuPortalFetch(`/api/notifications?userId=${encodeURIComponent(userId)}&limit=50`);
            return Array.isArray(payload?.items) ? payload.items.map(normalizeApiNotification) : [];
        } catch (error) {
            if (error && (error.status === 503 || error.code === 'KIU_PORTAL_BACKEND_COOLDOWN')) return [];
            return [];
        }
    }

    function toastNewUnreadItems(items = [], options = {}) {
        if (!state.bootstrapped) {
            items.forEach((item) => markToastSeen(text(item.id)));
            state.bootstrapped = true;
            return;
        }
        items.forEach((item) => {
            if (item.read) return;
            if (state.seenToastIds.has(text(item.id))) return;
            toastFromNotification(item, options);
        });
    }

    async function pollPortalLiveAlerts(force = false) {
        const userId = currentUserId();
        if (!userId) return [];
        if (state.lastUserId !== userId) {
            state.lastUserId = userId;
            loadSeenToastIds(userId);
        }
        if (state.pollPromise && !force) return state.pollPromise;
        state.pollPromise = (async () => {
            const [apiItems, localItems] = await Promise.all([
                fetchApiNotifications(userId),
                Promise.resolve(collectLocalNotifications(userId))
            ]);
            const merged = mergeNotificationSources(apiItems, localItems);
            updateNotificationBridge(merged);
            toastNewUnreadItems(merged, { skipRead: true });
            return merged;
        })().finally(() => {
            state.pollPromise = null;
        });
        return state.pollPromise;
    }

    function bindDismissHandler() {
        if (state.bound) return;
        state.bound = true;
        document.addEventListener('click', (event) => {
            const trigger = event.target?.closest?.('[data-action="portal-live-alert-dismiss"]');
            if (!trigger) return;
            event.preventDefault();
            dismissPortalLiveAlert(trigger.getAttribute('data-alert-id'));
        });
    }

    function installNotificationBadgeBridge() {
        const snapshot = window.getNotificationSnapshot;
        if (!snapshot || snapshot.__kiuLiveAlertBridge) return;
        const bridged = function getNotificationSnapshotBridged(user) {
            const base = resolveBaseNotificationSnapshot(user, snapshot);
            const cached = window.__kiuPortalLiveAlertSnapshot;
            if (!cached || !cached.items?.length) return base;
            const merged = mergeNotificationSources(cached.items, base.items);
            return buildSnapshotFromItems(merged);
        };
        bridged.__kiuLiveAlertBridge = true;
        window.getNotificationSnapshot = bridged;
    }

    function startPortalLiveAlertLoop() {
        const userId = currentUserId();
        if (!userId) return;
        bindDismissHandler();
        installNotificationBadgeBridge();
        loadSeenToastIds(userId);
        void pollPortalLiveAlerts(true);
        if (state.pollTimer) window.clearInterval(state.pollTimer);
        state.pollTimer = window.setInterval(() => {
            void pollPortalLiveAlerts(false);
        }, POLL_INTERVAL_MS);
        if (!window.__kiuPortalLiveAlertFocusBound) {
            window.__kiuPortalLiveAlertFocusBound = true;
            window.addEventListener('focus', () => { void pollPortalLiveAlerts(true); });
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) void pollPortalLiveAlerts(true);
            });
        }
    }

    function stopPortalLiveAlertLoop() {
        if (state.pollTimer) {
            window.clearInterval(state.pollTimer);
            state.pollTimer = 0;
        }
        state.toasts.forEach((toast) => {
            if (toast.timeoutId) window.clearTimeout(toast.timeoutId);
        });
        state.toasts = [];
        renderRegion();
    }

    function showPortalLiveAlertFromRealtime(payload = {}) {
        const notification = normalizeApiNotification(payload.notification || payload);
        toastFromNotification(notification, { force: true, skipRead: false });
        void pollPortalLiveAlerts(true);
    }

    Object.assign(window, {
        showPortalLiveAlert,
        dismissPortalLiveAlert,
        pollPortalLiveAlerts,
        startPortalLiveAlertLoop,
        stopPortalLiveAlertLoop,
        showPortalLiveAlertFromRealtime,
        getPortalLiveAlertSnapshot: () => window.__kiuPortalLiveAlertSnapshot || { unread: 0, items: [] },
        __KIU_PORTAL_LIVE_ALERT_DEFAULT_MS: DEFAULT_DURATION_MS
    });
})();
