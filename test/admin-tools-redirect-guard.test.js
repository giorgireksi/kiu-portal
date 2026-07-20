import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin-tools redirect guard', () => {
    it('does not forceReload faculty picker on standalone admin workspace', () => {
        const chrome = readSource('assets/js/features/luxury-shell-chrome.js');
        expect(chrome).toContain('switchFacultyTheme(optionButton.dataset.facultyOption, { refreshDependentViews: true })');
        expect(chrome).not.toMatch(/switchFacultyTheme\([^)]*forceReload:\s*true/);
    });

    it('downgrades forceReload when on standalone admin workspace entry', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).toContain('isStandaloneAdminWorkspaceEntry');
        expect(utilities).toContain('const forceReload = forceReloadRequested && !onStandaloneAdminWorkspace');
    });

    it('gates admin-tools access on authenticated admin role or privilege', () => {
        const html = readSource('admin-tools.html');
        expect(html).toContain('function canAccessAdminToolsWorkspace()');
        expect(html).toContain("authRole === 'admin'");
        expect(html).toContain("userHasPortalPrivilegeForAuthUser('access_admin_tools')");
        expect(html).not.toContain('getAllowedPagesForRole(effectiveRole)');
        expect(html).not.toContain('getEffectiveUserRole()');
    });

    it('exposes auth-user privilege helper in state', () => {
        const state = readSource('assets/js/app/state.js');
        expect(state).toContain('function userHasPortalPrivilegeForAuthUser');
        expect(state).toContain('authUser.role');
    });

    it('early-exits portal startup for standalone admin workspace entries', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        expect(navigation).toContain('function isStandaloneAdminWorkspaceEntry');
        expect(navigation).toContain('function bootstrapStandaloneAdminWorkspaceShell');
        expect(navigation).toContain('function runDeferredPortalStartupForStandaloneAdmin');
        expect(navigation).toContain('if (isStandaloneAdminWorkspaceEntry()) {');
        expect(navigation).toContain('!isStandaloneAdminWorkspaceEntry()');
    });

    it('uses authenticated admin role for home navigation from admin-tools', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        expect(navigation).toContain('function getNavigationAuthRole()');
        expect(navigation).toContain('getRoleHomePage(effectiveRole)');
        expect(navigation).toContain('isStandaloneAdminWorkspaceEntry() && getNavigationAuthRole() === USER_ROLES.ADMIN');
    });

    it('blocks role switch away from admin on standalone admin workspace', () => {
        const utilities = readSource('assets/js/shared/utilities.js');
        expect(utilities).toContain('isStandaloneAdminWorkspaceEntry()');
        expect(utilities).toContain('requestedStandaloneRole !== USER_ROLES.ADMIN');
    });

    it('debounces admin registration state saves', () => {
        const adminRegistration = readSource('assets/js/pages/admin-registration.js');
        expect(adminRegistration).toContain('function queueAdminRegistrationStateSave()');
        expect(adminRegistration).toContain('function flushAdminRegistrationStateSave');
        expect(adminRegistration).toContain('ADMIN_REGISTRATION_SAVE_DEBOUNCE_MS');
        expect(adminRegistration).toMatch(/setTimeout\(\(\) => \{[\s\S]*?flushAdminRegistrationStateSave\(\)/);
    });

    it('throttles heavy luxury sync on admin-tools route', () => {
        const luxury = readSource('assets/js/features/index-luxury.js');
        expect(luxury).toContain('lux-route-admin-tools');
        expect(luxury).toContain('__luxAdminToolsSyncAllAt');
        expect(luxury).toMatch(/if \(!onAdminToolsRoute && !onLmsRoute\) \{\s*\n\s*queueLegacyVisualRefresh/);
    });
});
