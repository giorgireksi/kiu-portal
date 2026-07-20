import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

function extractFunctionBody(source, functionName) {
    return source.split(`function ${functionName}`)[1]?.split(/\nfunction /)[0] || '';
}

function bootNavigationRuntime() {
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
        url: 'http://localhost/index.html',
        runScripts: 'outside-only'
    });

    dom.window.USER_ROLES = USER_ROLES;
    dom.window.getEffectiveUserRole = () => USER_ROLES.STUDENT;
    dom.window.eval(readSource('assets/js/features/navigation.js'));
    return dom.window;
}

describe('student service navigation boot regressions', () => {
    it('refreshes standalone student-service route content through renderStudentServicePage', () => {
        const navigation = readSource('assets/js/features/navigation.js');
        const refreshBlock = extractFunctionBody(navigation, 'refreshStandaloneDesktopRouteContent(pageId, options = {}) {');

        expect(refreshBlock).toContain("if (activePageId === 'student-service' && typeof window.renderStudentServicePage === 'function')");
        expect(refreshBlock).toContain('window.renderStudentServicePage()');
        expect(refreshBlock).toContain('return true;');
    });

    it('keeps student-service out of the index portal shell', () => {
        const indexHtml = readSource('index.html');
        const navigation = readSource('assets/js/features/navigation.js');
        const deferredBlock = extractFunctionBody(navigation, 'runDeferredPortalStartup() {');

        expect(indexHtml).not.toContain('id="page-student-service"');
        expect(deferredBlock).not.toContain("activePageId === 'student-service' && typeof renderStudentServicePage === 'function'");
    });

    it('maps student-service standalone navigation to student-service.html instead of the portal home hash', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain("'student-service': 'student-service.html'");
        expect(navigation).not.toMatch(/if \(normalizedPageId === 'student-service'\)[\s\S]*index\.html#home/);
    });

    it('resolvePortalRouteUrl(student-service) hard-navigates to the standalone entry', () => {
        const window = bootNavigationRuntime();
        const roles = [USER_ROLES.STUDENT, USER_ROLES.ADMIN, USER_ROLES.STUDENT_SERVICE, USER_ROLES.PROFESSOR];

        roles.forEach((role) => {
            const targetUrl = window.resolvePortalRouteUrl('student-service', role);
            expect(targetUrl).toBe('student-service.html');
            expect(targetUrl).not.toContain('index.html');
            expect(targetUrl).not.toContain('#home');
        });
    });

    it('preserves student_service workspace role across standalone navigations', () => {
        const navigation = readSource('assets/js/features/navigation.js');

        expect(navigation).toContain('STUDENT_SERVICE_WORKSPACE_ROUTE_IDS');
        expect(navigation).toContain('appendPortalViewQuery');
        expect(navigation).toContain('applyPortalViewRoleFromLocation');
        expect(navigation).toContain('pinStudentServiceWorkspaceRole');
        expect(navigation).toContain('syncStudentServiceWorkspaceBackendSession');
        expect(navigation).toContain("localStorage.setItem(PENDING_ROLE_SWITCH_KEY, effectiveRole)");
        expect(navigation).toContain('orders');
        expect(navigation).toContain('library');
    });
});