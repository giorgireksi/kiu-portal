import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin view-as hydration', () => {
    it('hydrates bootstrap accounts after applying portal state', () => {
        const apiSource = readSource('assets/js/app/api.js');
        const authSource = readSource('assets/js/app/auth.js');

        expect(authSource).toContain('function hydratePortalUsersFromAccounts(accounts = [], options = {})');
        expect(authSource).toContain('function refreshImpersonationDirectoryFromBackend(requestedRole =');
        expect(apiSource).toContain('const bootstrapAccounts = Array.isArray(payload?.accounts)');
        expect(apiSource).toMatch(/applyPortalBootstrapState[\s\S]*hydratePortalUsersFromAccounts\(bootstrapAccounts/);
        expect(apiSource).toContain('setActiveSessionUserByRole(bootstrapEffectiveRole)');
        expect(apiSource).toContain('impersonatedUserId');
        expect(apiSource).toContain('session: payload.session');
    });

    it('restores backend impersonated user id during portal auth bootstrap', () => {
        const apiSource = readSource('assets/js/app/api.js');
        expect(apiSource).toContain('session.impersonatedUserId');
        expect(apiSource).toMatch(/storePortalBackendAuth[\s\S]*impersonatedUserId/);
    });

    it('refreshes impersonation directory before admin role switch persona guard', () => {
        const utilitiesSource = readSource('assets/js/shared/utilities.js');
        expect(utilitiesSource).toContain('await refreshImpersonationDirectoryFromBackend(requestedRole, preferredFaculty)');
        expect(utilitiesSource).toMatch(/refreshImpersonationDirectoryFromBackend[\s\S]*warnMissingImpersonationPersona/);
        expect(utilitiesSource).toContain('create or activate one in Staff');
    });

    it('merges faculty profiles and allows QA fallback for admin impersonation', () => {
        const stateSource = readSource('assets/js/app/state.js');
        expect(stateSource).toContain('function collectRawImpersonationRecordsForRole(normalizedRole)');
        expect(stateSource).toContain('collectFacultyMembers(KIU_STATE?.facultyProfiles');
        expect(stateSource).toContain('adminImpersonationAllowsTestingFallback');
        expect(stateSource).toContain('function hasImpersonationPersonaForRole');
        expect(stateSource).toContain('isImpersonationEligibleAccount(record');
    });

    it('shows missing-persona hints in the luxury role picker for admins', () => {
        const chromeSource = readSource('assets/js/features/luxury-shell-chrome.js')
            + readSource('assets/js/features/luxury-shell-topbar-runtime.js');
        expect(chromeSource).toContain('function roleSwitcherHasPersona(roleKey');
        expect(chromeSource).toContain('hasImpersonationPersonaForRole');
        expect(chromeSource).toContain('create in Staff');
        expect(chromeSource).toContain("resolvePortalRouteUrl('staff', 'admin')");
    });

    it('clears stale view-as banner chrome in the unified shell', () => {
        const chromeSource = readSource('assets/js/features/luxury-shell-chrome.js')
            + readSource('assets/js/features/luxury-shell-topbar-runtime.js');
        expect(chromeSource).toContain('function syncViewAsBanner()');
        expect(chromeSource).toContain('lux-view-as-banner');
        expect(chromeSource).toContain("document.body.classList.remove('lux-view-as-active')");
        expect(chromeSource).toMatch(/syncTopbar[\s\S]*syncViewAsBanner/);
    });

    it('syncs admin-testing personas into faculty rosters after hydrate', () => {
        const authSource = readSource('assets/js/app/auth.js');
        expect(authSource).toContain('function syncAdminTestingPersonaRosters(accounts = [])');
        expect(authSource).toContain('ensureAdminTestingStudentAcademicShell(normalized.id)');
        expect(readSource('assets/js/app/state.js')).toContain('function shouldRetainAdminTestingPersonas()');
    });

    it('hydrates all backend accounts and can filter refresh by role and faculty', () => {
        const authSource = readSource('assets/js/app/auth.js');
        expect(authSource).toContain('const list = ensureArray(accounts).filter((account) => Boolean(account?.id));');
        expect(authSource).not.toContain('isDemoOrTestingUserRecord(account)) return false');
        expect(authSource).toContain('/api/accounts?limit=500&role=');
    });
});
