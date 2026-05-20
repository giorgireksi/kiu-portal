import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { join } from 'path';

const require = createRequire(import.meta.url);
const { PlatformStore } = require('../backend/platform/store.js');
const authSessionService = require('../backend/platform/domains/auth-session-service.js');

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

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

describe('auth session store domain split', () => {
    it('keeps auth/session ownership in auth-session-service', () => {
        const source = readSource('backend/platform/store.js');

        expect(Object.keys(authSessionService).sort()).toEqual([
            'activateAccount',
            'clearSessionImpersonation',
            'createSessionByCredentials',
            'createSessionByMicrosoftIdentity',
            'createSessionForAccount',
            'ensureCredential',
            'getRawAccountByEmail',
            'getRawAccountByMicrosoftOid',
            'getSession',
            'linkMicrosoftIdentityToAccount',
            'logoutSession',
            'requestPasswordReset',
            'resetPassword',
            'revokeSessionsForUser',
            'updateSessionImpersonation',
            'upgradeCredentialHashIfNeeded'
        ]);
        expect(source).toContain("} = require('./domains/auth-session-service');");
        expect(source).toContain('return createSessionForAccount.call(this, accountId, options);');
        expect(source).toContain('return getSession.call(this, token);');
        expect(source).toContain('return resetPassword.call(this, token, newPassword);');
    });

    it('preserves session lifecycle behavior through PlatformStore wrappers', () => {
        const store = buildStore();

        const issued = store.createSessionForAccount('student-1', { identityProvider: 'portal' });
        expect(issued.session.expiresAt).toBeTruthy();
        expect(store.getSession(issued.session.token)?.userId).toBe('student-1');

        const reset = store.requestPasswordReset('student1@example.com');
        expect(reset?.token).toBeTruthy();
        expect(store.resetPassword(reset.token, 'AnotherPassword!456')?.id).toBe('student-1');

        store.state.accounts.admin = {
            id: 'admin',
            role: 'admin',
            displayName: 'Admin',
            email: 'admin@example.com',
            facultyCode: 'ECON',
            accountStatus: 'active',
            activationRequired: false,
            mustChangePassword: false
        };
        store.ensureCredential('admin').activationRequired = false;
        const adminSession = store.createSessionForAccount('admin', { identityProvider: 'portal' }).session;
        expect(store.updateSessionImpersonation(adminSession.token, 'student')?.impersonatedRole).toBe('student');
        expect(store.clearSessionImpersonation(adminSession.token)?.impersonatedRole).toBe('');
    });
});
