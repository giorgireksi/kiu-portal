const net = require('net');
const {
    clone,
    makeId,
    nowIso,
    paginate
} = require('../utils');

function isValidPushSubscriptionEndpoint(endpoint = '') {
    try {
        const parsed = new URL(String(endpoint || '').trim());
        if (parsed.protocol !== 'https:') return false;
        if (parsed.username || parsed.password) return false;
        const hostname = String(parsed.hostname || '').trim().toLowerCase();
        if (!hostname || hostname === 'localhost' || hostname === '[::1]') return false;
        const ipVersion = net.isIP(hostname);
        if (ipVersion === 4) {
            if (
                hostname.startsWith('10.')
                || hostname.startsWith('127.')
                || hostname.startsWith('192.168.')
                || /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
            ) {
                return false;
            }
        }
        if (ipVersion === 6 && (hostname === '::1' || hostname.toLowerCase().startsWith('fc') || hostname.toLowerCase().startsWith('fd'))) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

function createNotification(payload = {}) {
    const id = String(payload.id || makeId('notif')).trim();
    this.state.notifications[id] = {
        id,
        recipientUserId: String(payload.recipientUserId || '').trim(),
        sourceDomain: String(payload.sourceDomain || 'portal').trim(),
        type: String(payload.type || 'general').trim(),
        title: String(payload.title || 'Notification').trim(),
        body: String(payload.body || '').trim(),
        routePage: String(payload.routePage || '').trim(),
        routeData: clone(payload.routeData || {}) || {},
        isRead: Boolean(payload.isRead),
        createdAt: String(payload.createdAt || nowIso())
    };
    return clone(this.state.notifications[id]);
}

function listNotifications(userId, filters = {}) {
    const items = Object.values(this.state.notifications)
        .filter(item => !userId || String(item.recipientUserId) === String(userId))
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    return paginate(items, filters);
}

function markNotificationRead(notificationId, userId = '') {
    const id = String(notificationId || '').trim();
    if (!id || !this.state.notifications[id]) return null;
    const notification = this.state.notifications[id];
    if (userId && String(notification.recipientUserId || '').trim() !== String(userId || '').trim()) {
        return null;
    }
    notification.isRead = true;
    notification.readAt = nowIso();
    this.save();
    return clone(notification);
}

function deleteNotification(notificationId, userId = '') {
    const id = String(notificationId || '').trim();
    if (!id || !this.state.notifications[id]) return false;
    const notification = this.state.notifications[id];
    if (userId && String(notification.recipientUserId || '').trim() !== String(userId || '').trim()) {
        return false;
    }
    delete this.state.notifications[id];
    this.save();
    return true;
}

function updateNotificationPreferences(userId, preferences = {}) {
    const key = String(userId || '').trim();
    if (!key) return null;
    this.state.notificationPreferences[key] = {
        ...(this.state.notificationPreferences[key] || {}),
        userId: key,
        inApp: preferences.inApp !== false,
        email: preferences.email !== false,
        push: Boolean(preferences.push),
        sms: Boolean(preferences.sms),
        updatedAt: nowIso()
    };
    this.save();
    return clone(this.state.notificationPreferences[key]);
}

function upsertPushSubscription(userId, subscription = {}, metadata = {}) {
    const normalizedUserId = String(userId || '').trim();
    const endpoint = String(subscription?.endpoint || '').trim();
    if (!normalizedUserId || !endpoint || !isValidPushSubscriptionEndpoint(endpoint)) return null;
    const auth = String(subscription?.keys?.auth || '').trim();
    const p256dh = String(subscription?.keys?.p256dh || '').trim();
    if (!auth || !p256dh) return null;
    const id = Buffer.from(`${normalizedUserId}:${endpoint}`).toString('base64').replace(/[^a-z0-9]+/gi, '').slice(0, 64) || makeId('push');
    this.state.pushSubscriptions[id] = {
        id,
        userId: normalizedUserId,
        endpoint,
        keys: {
            auth,
            p256dh
        },
        encoding: String(metadata?.encoding || 'aes128gcm').trim() || 'aes128gcm',
        userAgent: String(metadata?.userAgent || '').trim(),
        createdAt: String(this.state.pushSubscriptions[id]?.createdAt || nowIso()),
        updatedAt: nowIso()
    };
    updateNotificationPreferences.call(this, normalizedUserId, {
        ...(this.state.notificationPreferences[normalizedUserId] || {}),
        push: true
    });
    this.save();
    return clone(this.state.pushSubscriptions[id]);
}

function listPushSubscriptions(userId = '') {
    const normalizedUserId = String(userId || '').trim();
    return Object.values(this.state.pushSubscriptions || {})
        .filter(item => !normalizedUserId || String(item.userId || '').trim() === normalizedUserId)
        .map(item => clone(item));
}

function removePushSubscription(userId = '', endpoint = '') {
    const normalizedUserId = String(userId || '').trim();
    const normalizedEndpoint = String(endpoint || '').trim();
    if (!normalizedUserId || !normalizedEndpoint) return false;
    const existing = Object.entries(this.state.pushSubscriptions || {}).find(([, item]) =>
        String(item?.userId || '').trim() === normalizedUserId
        && String(item?.endpoint || '').trim() === normalizedEndpoint
    );
    if (!existing) return false;
    delete this.state.pushSubscriptions[existing[0]];
    this.save();
    return true;
}

module.exports = {
    createNotification,
    deleteNotification,
    isValidPushSubscriptionEndpoint,
    listNotifications,
    listPushSubscriptions,
    markNotificationRead,
    removePushSubscription,
    updateNotificationPreferences,
    upsertPushSubscription
};
