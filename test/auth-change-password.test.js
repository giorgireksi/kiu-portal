import { describe, expect, it } from 'vitest';
import { PlatformStore } from '../backend/platform/store.js';

function buildStore() {
    const store = new PlatformStore({ portalSessionTtlMs: 60 * 60 * 1000 });
    store.state.accounts['student-1'] = {
        id: 'student-1',
        email: 'student1@example.com',
        role: 'student',
        accountStatus: 'active',
        activationRequired: false,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    store.activateAccount('student-1', 'oldpass12');
    return store;
}

describe('changePassword', () => {
    it('rejects a wrong current password with a 400 (never logs the user out)', () => {
        const store = buildStore();
        const result = store.changePassword('student-1', 'wrongpass', 'newpass123');
        expect(result.error).toMatch(/current password/i);
        expect(result.status).toBe(400);
    });

    it('rejects a too-short new password', () => {
        const store = buildStore();
        const result = store.changePassword('student-1', 'oldpass12', 'short');
        expect(result.status).toBe(400);
    });

    it('updates the hash so the new password logs in and the old one does not', () => {
        const store = buildStore();
        const result = store.changePassword('student-1', 'oldpass12', 'newpass123');
        expect(result.account).toBeTruthy();
        expect(store.createSessionByCredentials('student1@example.com', 'newpass123')?.error).toBeFalsy();
        expect(store.createSessionByCredentials('student1@example.com', 'oldpass12')?.error).toBeTruthy();
    });
});
