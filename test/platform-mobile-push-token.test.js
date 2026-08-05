import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

describe('platform mobile push tokens', () => {
    it('stores Android tokens per user and removes only the matching token', () => {
        const store = new PlatformStore({});
        const token = 'fcm-token-user-one-abcdefghijklmnopqrstuvwxyz';
        const otherToken = 'fcm-token-user-two-abcdefghijklmnopqrstuvwxyz';

        const first = store.upsertMobilePushToken('user-1', token, { platform: 'android' });
        store.upsertMobilePushToken('user-2', otherToken, { platform: 'android' });

        expect(first).not.toBeNull();
        expect(store.listMobilePushTokens('user-1')).toHaveLength(1);
        expect(store.listMobilePushTokens('user-2')).toHaveLength(1);
        expect(store.removeMobilePushToken('user-2', token)).toBe(false);
        expect(store.removeMobilePushToken('user-1', token)).toBe(true);
        expect(store.listMobilePushTokens('user-1')).toHaveLength(0);
    });

    it('rejects empty or implausibly short tokens', () => {
        const store = new PlatformStore({});
        expect(store.upsertMobilePushToken('user-1', '')).toBeNull();
        expect(store.upsertMobilePushToken('user-1', 'short-token')).toBeNull();
    });
});
