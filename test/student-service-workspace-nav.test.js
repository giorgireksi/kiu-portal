import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

const USER_ROLES = {
    STUDENT: 'student',
    ADMIN: 'admin',
    PROFESSOR: 'professor',
    TA: 'ta',
    STUDENT_SERVICE: 'student_service'
};

const PENDING_ROLE_SWITCH_KEY = 'KIU_PENDING_ROLE_SWITCH_ROLE';
const ACTIVE_ROLE_IMPERSONATION_KEY = 'KIU_ACTIVE_ROLE_IMPERSONATION';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function bootWorkspaceNavRuntime({
    pathname = '/student-service.html',
    search = '',
    authRole = USER_ROLES.ADMIN,
    pendingRole = USER_ROLES.STUDENT_SERVICE,
    effectiveRole = USER_ROLES.STUDENT_SERVICE
} = {}) {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: `http://localhost${pathname}${search}`,
        runScripts: 'outside-only'
    });
    const { window } = dom;

    window.USER_ROLES = USER_ROLES;
    window.PENDING_ROLE_SWITCH_KEY = PENDING_ROLE_SWITCH_KEY;
    window.ACTIVE_ROLE_IMPERSONATION_KEY = ACTIVE_ROLE_IMPERSONATION_KEY;
    window.currentUserRole = effectiveRole;
    window.currentUser = {
        id: 'admin-1',
        role: authRole,
        name: 'Admin',
        faculty: 'ECON'
    };
    window.localStorage.setItem('KIU_AUTH_STATE', JSON.stringify(window.currentUser));
    window.localStorage.setItem('currentUserRole', effectiveRole);
    if (pendingRole) {
        window.localStorage.setItem(PENDING_ROLE_SWITCH_KEY, pendingRole);
        window.sessionStorage.setItem(ACTIVE_ROLE_IMPERSONATION_KEY, '1');
    }

    window.getEffectiveUserRole = () => effectiveRole;
    window.getNavigationAuthRole = () => authRole;
    window.getAllowedPagesForRole = () => new Set([
        'home',
        'student-service',
        'orders',
        'library',
        'news',
        'social',
        'profile-view'
    ]);
    window.getStandaloneEntryPageId = () => {
        const match = String(pathname || '').match(/\/([^/]+)\.html$/);
        return match ? match[1] : '';
    };
    window.isIndexPortalShell = () => false;
    window.isSamePageNavigation = () => false;
    window.resolveAliasPageId = (pageId) => pageId;
    window.getPortalRouteMode = () => 'standalone';
    window.getPageSections = () => [];
    window.getNavigablePageSection = () => null;
    window.flushPortalStateForHardNavigation = () => {};
    window.flushPortalStateBeforeNavigation = () => {};
    window.cleanupStaleSocialRouteState = () => {};
    window.setActiveSessionUserByRole = () => {};
    window.invalidatePageAccessCache = () => {};
    window.invalidateDomCache = () => {};
    window.refreshShellIdentity = () => {};

    window.eval(readSource('assets/js/features/navigation.js'));
    return window;
}

describe('student service workspace navigation', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('resolveWorkspacePortalNavUrl appends student_service view for workspace targets', () => {
        const window = bootWorkspaceNavRuntime();
        const targets = ['orders', 'library', 'news', 'social', 'profile-view', 'student-service'];

        targets.forEach((pageId) => {
            const url = window.resolveWorkspacePortalNavUrl(pageId, USER_ROLES.STUDENT_SERVICE);
            expect(url).toContain('?view=student_service');
            expect(url).not.toContain('admin-library');
            expect(url).not.toContain('admin-orders');
        });
    });

    it('resolveWorkspacePortalNavUrl keeps dashboard on index with student_service view', () => {
        const window = bootWorkspaceNavRuntime();
        const url = window.resolveWorkspacePortalNavUrl('home', USER_ROLES.STUDENT_SERVICE);
        expect(url).toContain('index.html?view=student_service');
        expect(url).toContain('#home');
    });

    it('resolveWorkspacePortalNavUrl preserves student_service for admin impersonation via pending key', () => {
        const window = bootWorkspaceNavRuntime({
            effectiveRole: USER_ROLES.ADMIN
        });
        const url = window.resolveWorkspacePortalNavUrl('orders', USER_ROLES.ADMIN);
        expect(url).toContain('orders.html?view=student_service');
    });

    it('restores student_service role on orders.html without view query', () => {
        const window = bootWorkspaceNavRuntime({
            pathname: '/orders.html',
            search: '',
            effectiveRole: USER_ROLES.ADMIN
        });
        const restored = window.applyPortalViewRoleFromLocation({ refreshChrome: false });
        expect(restored).toBe(true);
        expect(window.currentUserRole).toBe(USER_ROLES.STUDENT_SERVICE);
    });

    it('appendPortalViewQuery overwrites stale view params', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        expect(navigation).toContain('resolved.searchParams.set(\'view\', normalizedRole);');
        expect(navigation).not.toContain('if (!resolved.searchParams.get(\'view\'))');
    });

    it('social bypass routes through assignStandalonePortalRoute', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        expect(navigation).toContain("assignStandalonePortalRoute('social', effectiveRole);");
        expect(navigation).not.toContain("window.location.assign('social.html');");
    });

    it('hash startup redirects use resolveWorkspacePortalNavUrl', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        expect(navigation).toContain('resolveWorkspacePortalNavUrl(hash, activeRole)');
        expect(navigation).toContain('resolveWorkspacePortalNavUrl(startupHash, getEffectiveUserRole())');
    });

    it('role resolver honors pending workspace role for admin accounts', () => {
        const appSource = readSource('assets/js/app/app.js');
        const stateSource = readSource('assets/js/app/state.js');
        expect(appSource).toContain('function resolveStoredWorkspaceRole()');
        expect(stateSource).toContain('resolveStoredWorkspaceRole');
        expect(stateSource).toContain('authRole === USER_ROLES.ADMIN && workspaceRole');
    });
});

describe('student service workspace cache busters', () => {
    // Shared workspace nav buster, with route-specific bumps allowed where nav was patched.
    const workspaceNavBusters = {
        'student-service.html': '20260808-loadreveal1',
        'index.html': '20260808-loadreveal1',
        'orders.html': '20260808-loadreveal1',
        'library.html': '20260808-loadreveal1',
        'news.html': '20260808-loadreveal1',
        'social.html': '20260808-loadreveal1',
        'profile-view.html': '20260808-loadreveal1'
    };

    it('workspace html entrypoints share the workspace nav cache buster', () => {
        Object.entries(workspaceNavBusters).forEach(([page, version]) => {
            const html = readSource(page);
            expect(html).toContain(`assets/js/features/navigation.js?v=${version}`);
        });
    });
});