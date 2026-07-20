import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

const NATIVE_ROLES = ['student', 'professor', 'ta', 'student_service', 'admin'];
const IMPERSONATION_ROLES = ['student', 'professor', 'ta', 'student_service'];

describe('sync cross-role audit — native roles', () => {
    it('queues portal state sync from saveState for all authenticated sessions', () => {
        const stateSource = readSource('assets/js/app/state.js');
        const apiSource = readSource('assets/js/app/api.js');
        const portalRoutes = readSource('backend/platform/routes/portal-support-routes.js');

        expect(stateSource).toContain("if (typeof queuePortalStateSync === 'function') queuePortalStateSync('saveState');");
        expect(apiSource).toContain('async function persistPortalStateToBackend');
        expect(apiSource).toContain('actorRole');
        expect(portalRoutes).toContain("app.post('/api/portal/state'");
        expect(portalRoutes).toContain('requireSessionAccount');
        expect(portalRoutes).not.toContain('requireActualSessionRole');
    });

    it('bootstraps portal state for any role with a valid session token', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const authSource = readSource('assets/js/app/auth.js');
        const storeSource = readSource('backend/platform/store.js');

        expect(apiSource).toContain('async function bootstrapPortalBackendState');
        expect(apiSource).toContain("kiuPortalFetch('/api/bootstrap')");
        expect(apiSource).toContain('applyPortalBootstrapState');
        expect(apiSource).toContain('hydratePortalUsersFromAccounts(bootstrapAccounts');
        expect(authSource).toContain('function hydratePortalUsersFromAccounts');
        expect(storeSource).toContain('session.impersonatedRole');
        expect(storeSource).toContain('createApplicationBootstrap');
        expect(storeSource).toContain('accounts: Object.values(this.state.accounts)');
    });

    it('runs luxury shell sync using effective role for layout branches', () => {
        const luxurySource = readSource('assets/js/features/index-luxury.js');
        const stateSource = readSource('assets/js/app/state.js');

        expect(luxurySource).toContain('function syncAll()');
        expect(luxurySource).toContain('function syncAfterNavigate');
        expect(luxurySource).toContain('getEffectiveRole()');
        expect(luxurySource).toContain("wrapFunction('navigate', queueNavigateSync)");
        expect(stateSource).toContain('function getAllowedPagesForRole');

        expect(stateSource).toContain('USER_ROLES.STUDENT');
        expect(stateSource).toContain('USER_ROLES.PROFESSOR');
        expect(stateSource).toContain('USER_ROLES.TA');
        expect(stateSource).toContain('USER_ROLES.STUDENT_SERVICE');
        expect(stateSource).toContain('USER_ROLES.ADMIN');
    });
});

describe('sync cross-role audit — admin impersonation', () => {
    it('blocks role switch when no persona user exists for the target role', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const authSource = readSource('assets/js/app/auth.js');
        expect(utilitiesSource).toContain('function warnMissingImpersonationPersona(role)');
        expect(utilitiesSource).toContain('getPreferredImpersonationUserForRole(normalizedRole, preferredFaculty)');
        expect(utilitiesSource).toContain('await refreshImpersonationDirectoryFromBackend(requestedRole, preferredFaculty)');
        expect(utilitiesSource).toContain('create or activate one in Staff');
        expect(utilitiesSource).not.toMatch(/Create or activate one in Admin Tools/);
        expect(authSource).toContain('function refreshImpersonationDirectoryFromBackend(requestedRole =');
    });

    it('awaits backend impersonation sync before redirecting', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        expect(utilitiesSource).toContain('async function syncPortalBackendImpersonationBeforeRedirect(role)');
        expect(utilitiesSource).toContain('await syncPortalBackendImpersonationBeforeRedirect');
        expect(utilitiesSource).not.toContain('Promise.resolve(syncPortalBackendImpersonation(activeUser.role))');
    });

    it('binds impersonated session user via setActiveSessionUserByRole', () => {
        const stateSource = readSource('assets/js/app/state.js');
        const utilitiesSource = readSource('assets/js/shared/utilities.js');

        expect(stateSource).toContain('function setActiveSessionUserByRole(role)');
        expect(stateSource).toContain('function getPreferredImpersonationUserForRole');
        expect(utilitiesSource).toContain('setActiveSessionUserByRole(normalizedRole)');
    });

    it('validates impersonation roles on the backend', () => {
        const authMaintenance = readSource('backend/platform/routes/auth-maintenance-routes.js');
        const authSession = readSource('backend/platform/domains/auth-session-service.js');

        expect(authMaintenance).toContain('isPortalImpersonationRole');
        expect(authMaintenance).toContain('student, professor, ta, or student_service');
        expect(authSession).toContain('PORTAL_IMPERSONATION_ROLES');
        expect(authSession).toContain('function isPortalImpersonationRole(role)');
    });

    it('rejects invalid impersonation roles in the session store', () => {
        const { PlatformStore } = require('../backend/platform/store.js');
        const store = new PlatformStore({ portalSessionTtlMs: 60 * 60 * 1000 });
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
        const personaIds = {
            student: 'audit-test-student',
            professor: 'audit-test-professor',
            ta: 'audit-test-ta',
            student_service: 'audit-test-student-service'
        };
        store.ensureCredential('admin').activationRequired = false;
        for (const role of IMPERSONATION_ROLES) {
            store.state.accounts[personaIds[role]] = {
                id: personaIds[role],
                role,
                displayName: `Audit ${role}`,
                email: `${role}@example.com`,
                facultyCode: 'ECON',
                accountStatus: 'active',
                activationRequired: false
            };
            store.ensureCredential(personaIds[role]).activationRequired = false;
        }
        const adminSession = store.createSessionForAccount('admin', { identityProvider: 'portal' }).session;

        for (const role of IMPERSONATION_ROLES) {
            const updated = store.updateSessionImpersonation(adminSession.token, role, personaIds[role]);
            expect(updated?.impersonatedRole).toBe(role);
            expect(updated?.impersonatedUserId).toBe(personaIds[role]);
        }
        const lastValidRole = IMPERSONATION_ROLES[IMPERSONATION_ROLES.length - 1];
        expect(store.updateSessionImpersonation(adminSession.token, 'superuser', personaIds.student)).toBeNull();
        expect(store.getSession(adminSession.token)?.impersonatedRole).toBe(lastValidRole);
        expect(store.getSession(adminSession.token)?.impersonatedUserId).toBe(personaIds[lastValidRole]);
    });
});

describe('sync cross-role audit — impersonation matrix', () => {
    it('documents role coverage for getEffectiveUserRole impersonation gating', () => {
        const appSource = readSource('assets/js/app/app.js');
        expect(appSource).toContain('function isRoleImpersonationEnabled()');
        expect(appSource).toContain('USER_ROLES.STUDENT');
        expect(appSource).toContain('USER_ROLES.PROFESSOR');
        expect(appSource).toContain('USER_ROLES.TA');
        expect(appSource).toContain('USER_ROLES.STUDENT_SERVICE');
        expect(appSource).toContain('USER_ROLES.ADMIN');
    });

    it('prevents non-admin accounts from calling backend impersonation sync', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        const apiSource = readSource('assets/js/app/api.js');

        expect(utilitiesSource).toContain('if (currentUser.role !== USER_ROLES.ADMIN)');
        expect(apiSource).toContain("kiuPortalFetch('/api/session/impersonate-role'");
        expect(apiSource).toContain('userId');
        expect(readSource('backend/platform/routes/auth-maintenance-routes.js')).toContain('requireActualSessionRole');
        expect(readSource('backend/platform/routes/auth-maintenance-routes.js')).toContain('userId is required for impersonation');
    });
});
