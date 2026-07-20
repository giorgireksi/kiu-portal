import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('impersonation actor binding', () => {
    it('stores impersonatedUserId on admin sessions', () => {
        const { PlatformStore } = require('../backend/platform/store.js');
        const store = new PlatformStore({ portalSessionTtlMs: 60 * 60 * 1000 });
        store.state.accounts.admin = {
            id: 'admin',
            role: 'admin',
            displayName: 'Admin',
            email: 'admin@example.com',
            facultyCode: 'ECON',
            accountStatus: 'active',
            activationRequired: false
        };
        store.state.accounts['test-student-view'] = {
            id: 'test-student-view',
            role: 'student',
            displayName: 'View Student',
            email: 'view-student@example.com',
            facultyCode: 'ECON',
            accountStatus: 'active',
            activationRequired: false
        };
        store.ensureCredential('admin').activationRequired = false;
        store.ensureCredential('test-student-view').activationRequired = false;
        const adminSession = store.createSessionForAccount('admin', { identityProvider: 'portal' }).session;

        expect(store.updateSessionImpersonation(adminSession.token, 'student')).toBeNull();
        const updated = store.updateSessionImpersonation(adminSession.token, 'student', 'test-student-view');
        expect(updated?.impersonatedRole).toBe('student');
        expect(updated?.impersonatedUserId).toBe('test-student-view');

        const cleared = store.clearSessionImpersonation(adminSession.token);
        expect(cleared?.impersonatedRole).toBe('');
        expect(cleared?.impersonatedUserId).toBe('');
    });

    it('rejects impersonation when persona role does not match', () => {
        const { PlatformStore } = require('../backend/platform/store.js');
        const store = new PlatformStore({ portalSessionTtlMs: 60 * 60 * 1000 });
        store.state.accounts.admin = {
            id: 'admin',
            role: 'admin',
            displayName: 'Admin',
            email: 'admin@example.com',
            facultyCode: 'ECON',
            accountStatus: 'active',
            activationRequired: false
        };
        store.state.accounts.professor_only = {
            id: 'professor_only',
            role: 'professor',
            displayName: 'Professor',
            email: 'prof@example.com',
            facultyCode: 'ECON',
            accountStatus: 'active',
            activationRequired: false
        };
        store.ensureCredential('admin').activationRequired = false;
        const adminSession = store.createSessionForAccount('admin', { identityProvider: 'portal' }).session;
        expect(store.updateSessionImpersonation(adminSession.token, 'student', 'professor_only')).toBeNull();
    });

    it('binds backend actor helpers to impersonated persona', () => {
        const serverSource = readSource('backend/platform/server.js');
        expect(serverSource).toContain('function getActualActorUserId(sessionAccount)');
        expect(serverSource).toContain('function isSessionImpersonating(sessionAccount)');
        expect(serverSource).toContain('session?.impersonatedUserId');
        expect(serverSource).toContain('actualActorUserId');
    });

    it('uses effective role for registration self-service when impersonating', () => {
        const academicSource = readSource('backend/platform/routes/academic-routes.js');
        expect(academicSource).toContain('getSessionRole(sessionAccount)');
        expect(academicSource).toContain('effectiveRole === \'student\'');
        expect(academicSource).toContain('isSessionImpersonating(sessionAccount)');
    });

    it('syncs persona userId to backend impersonation endpoint', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const authMaintenance = readSource('backend/platform/routes/auth-maintenance-routes.js');
        expect(apiSource).toContain('userId');
        expect(apiSource).toMatch(/impersonate-role[\s\S]*userId/);
        expect(authMaintenance).toContain('userId is required for impersonation');
    });
});
