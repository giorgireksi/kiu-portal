import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('login route regressions', () => {
    it('keeps login on delegated auth controls without dashboard shell baggage', () => {
        const html = readSource('login.html');
        const runtimeSource = readSource('assets/js/pages/login-runtime.js');

        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/css/base.css');
        expect(html).not.toContain('assets/css/layout.css');
        expect(html).not.toContain('assets/css/components.css');
        expect(html).not.toContain('assets/css/index-luxury.css');
        expect(html).not.toContain('assets/css/mobile-responsive.css');
        expect(html).not.toContain('assets/js/app/app.js');
        expect(html).not.toContain('assets/js/app/api.js');
        expect(html).not.toContain('assets/js/app/auth.js');
        expect(html).not.toContain('assets/js/data/initial-state.js');
        expect(html).not.toContain('assets/js/app/state.js');
        expect(html).not.toContain('assets/js/shared/faculty.js');
        expect(html).toContain('assets/css/login-route.css');
        expect(html).toContain('assets/js/pages/login-runtime.js');
        expect(html).not.toContain('onclick=');
        expect(html).toContain('data-login-tab="login"');
        expect(html).toContain('data-login-tab="activate"');
        expect(html).toContain('data-login-action="microsoft-login"');
        expect(html).toContain('data-login-action="toggle-password"');
        expect(html).toContain('data-login-action="login-submit"');
        expect(html).toContain('data-login-action="activate-submit"');
        expect(runtimeSource).toContain('function bindLoginInteractions() {');
        expect(runtimeSource).toContain('function getLoginRoleDefaultTarget(role = \'student\') {');
        expect(runtimeSource).toContain('async function restoreExistingPortalSession() {');
        expect(runtimeSource).toContain('function clearStaleLoginSnapshot() {');
        expect(runtimeSource).toContain('async function fetchPortalMicrosoftConfig() {');
        expect(runtimeSource).toContain('async function beginMicrosoftPortalLogin(returnTo = window.location.href) {');
        expect(runtimeSource).toContain('async function completeMicrosoftPortalLoginFromUrl() {');
        expect(runtimeSource).toContain('async function authLogin(email, password) {');
        expect(runtimeSource).toContain('async function authActivate(id, newPassword) {');
        expect(runtimeSource).toContain('const defaultTarget = getLoginRoleDefaultTarget(microsoftResult.account?.role || \'student\');');
        expect(runtimeSource).toContain('const existingSession = await restoreExistingPortalSession();');
        expect(runtimeSource).toContain("const action = actionNode.dataset.loginAction || '';");
        expect(runtimeSource).toContain("if (action === 'microsoft-login') {");
        expect(runtimeSource).toContain("if (action === 'login-submit') {");
        expect(runtimeSource).toContain("if (action === 'activate-submit') {");
        expect(runtimeSource).toContain("if (action === 'toggle-password') {");
        expect(runtimeSource).toContain('bootstrapLoginPage();');
    });
});
