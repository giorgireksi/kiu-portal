import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function buildSubscription(endpoint) {
    return {
        endpoint,
        keys: {
            auth: 'auth-token',
            p256dh: 'p256dh-token'
        }
    };
}

describe('platform push subscription security', () => {
    it('rejects non-https and private-network push endpoints', () => {
        const store = new PlatformStore({});

        expect(store.upsertPushSubscription('user-1', buildSubscription('http://example.com/push'))).toBeNull();
        expect(store.upsertPushSubscription('user-1', buildSubscription('https://127.0.0.1/push'))).toBeNull();
        expect(store.upsertPushSubscription('user-1', buildSubscription('https://192.168.1.25/push'))).toBeNull();
        expect(store.upsertPushSubscription('user-1', buildSubscription('https://push.example.com/subscription/abc'))).not.toBeNull();
    });

    it('keys push subscriptions by both user and endpoint so records cannot be rebound across users', () => {
        const store = new PlatformStore({});
        const endpoint = 'https://push.example.com/subscription/shared';

        const first = store.upsertPushSubscription('user-1', buildSubscription(endpoint));
        const second = store.upsertPushSubscription('user-2', buildSubscription(endpoint));

        expect(first).not.toBeNull();
        expect(second).not.toBeNull();
        expect(first.id).not.toBe(second.id);
        expect(store.listPushSubscriptions('user-1')).toHaveLength(1);
        expect(store.listPushSubscriptions('user-2')).toHaveLength(1);
    });
});
