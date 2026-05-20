import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const notificationsService = require('../backend/platform/domains/notifications-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function buildSubscription(endpoint) {
    return {
        endpoint,
        keys: {
            auth: 'auth-token',
            p256dh: 'p256dh-token'
        }
    };
}

describe('notifications store domain split', () => {
    it('keeps notification and push-subscription ownership in notifications-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(notificationsService).sort()).toEqual([
            'createNotification',
            'isValidPushSubscriptionEndpoint',
            'listNotifications',
            'listPushSubscriptions',
            'markNotificationRead',
            'removePushSubscription',
            'updateNotificationPreferences',
            'upsertPushSubscription'
        ]);
        expect(source).toContain("} = require('./domains/notifications-service');");
        expect(source).toContain('return createNotification.call(this, payload);');
        expect(source).toContain('return upsertPushSubscription.call(this, userId, subscription, metadata);');
    });

    it('preserves notification and push-subscription behavior through PlatformStore wrappers', () => {
        const store = new PlatformStore({});

        const created = store.createNotification({
            recipientUserId: 'user-1',
            title: 'Testing accounts prepared',
            body: 'Demo notification body',
            routePage: 'orders'
        });
        expect(created).toMatchObject({
            recipientUserId: 'user-1',
            title: 'Testing accounts prepared',
            routePage: 'orders',
            isRead: false
        });

        const listed = store.listNotifications('user-1');
        expect(listed.items).toHaveLength(1);
        expect(listed.items[0].id).toBe(created.id);

        const marked = store.markNotificationRead(created.id, 'user-1');
        expect(marked?.isRead).toBe(true);

        const subscription = store.upsertPushSubscription('user-1', buildSubscription('https://push.example.com/subscription/abc'));
        expect(subscription).not.toBeNull();
        expect(store.listPushSubscriptions('user-1')).toHaveLength(1);
        expect(store.state.notificationPreferences['user-1']?.push).toBe(true);
        expect(store.removePushSubscription('user-1', 'https://push.example.com/subscription/abc')).toBe(true);
        expect(store.listPushSubscriptions('user-1')).toHaveLength(0);
    });
});
