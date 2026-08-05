import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');

function buildStore() {
    const store = new PlatformStore({ portalSessionTtlMs: 60 * 60 * 1000 });
    store.state.accounts['student-1'] = {
        id: 'student-1',
        name: 'Student One',
        nameEn: 'Student One',
        displayName: 'Student One',
        email: 'student1@example.com',
        facultyCode: 'ECON',
        role: 'student',
        accountStatus: 'active',
        activationRequired: false,
        mustChangePassword: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z'
    };
    const credential = store.ensureCredential('student-1');
    credential.activationRequired = false;
    return store;
}

describe('platform session security', () => {
    it('issues portal sessions with an expiresAt value and rejects expired sessions', () => {
        const store = buildStore();
        const result = store.createSessionForAccount('student-1', { identityProvider: 'portal' });

        expect(result.session.expiresAt).toBeTruthy();
        store.state.sessions[result.session.token].expiresAt = '2000-01-01T00:00:00.000Z';

        expect(store.getSession(result.session.token)).toBeNull();
        expect(store.state.sessions[result.session.token].active).toBe(false);
        expect(store.state.sessions[result.session.token].revocationReason).toBe('expired');
    });

    it('revokes active sessions when activation or password reset changes credentials', () => {
        const store = buildStore();
        const first = store.createSessionForAccount('student-1', { identityProvider: 'portal' }).session.token;
        const second = store.createSessionForAccount('student-1', { identityProvider: 'portal' }).session.token;

        store.state.accounts['student-1'].activationRequired = true;
        store.state.accounts['student-1'].accountStatus = 'pending-activation';
        store.ensureCredential('student-1').activationRequired = true;
        const activation = store.issueActivationToken('student-1');
        store.activateAccount('student-1', 'NewPassword!123', activation.token);
        expect(store.state.sessions[first].active).toBe(false);
        expect(store.state.sessions[second].active).toBe(false);
        expect(store.state.sessions[first].revocationReason).toBe('credential-reset');

        const third = store.createSessionForAccount('student-1', { identityProvider: 'portal' }).session.token;
        const reset = store.requestPasswordReset('student1@example.com');
        store.resetPassword(reset.token, 'AnotherPassword!456');
        expect(store.state.sessions[third].active).toBe(false);
        expect(store.state.sessions[third].revocationReason).toBe('credential-reset');
    });
});
