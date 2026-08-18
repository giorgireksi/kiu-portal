import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('login route regressions', () => {
    it('keeps login on delegated auth controls without dashboard shell baggage', () => {
        const html = readSource('login.html');
        const runtimeSource = readSource('assets/js/pages/login-runtime.js');

        expect(html).not.toContain('assets/js/shared/messenger.js');
        expect(html).not.toContain('assets/css/base.css');
        expect(html).not.toContain('lux-page-bare-lite.css');
        expect(html).not.toContain('assets/css/layout.css');
        expect(html).not.toContain('assets/css/components.css');
        expect(html).not.toContain('assets/css/index-luxury.css');
        expect(html).not.toContain('assets/css/mobile-responsive.css');
        expect(html).toContain('assets/css/lux-tokens.css');
        expect(html).toContain('assets/css/lux-focus-panel.css');
        expect(html).toContain('assets/css/lux-fouc-ht.css');
        expect(html).not.toContain('assets/css/lux-surfaces.css');
        expect(html).toContain('assets/css/lux-controls.css');
        expect(html).not.toContain('assets/css/lux-layout-primitives.css');
        expect(html).not.toContain('assets/js/app/app.js');
        expect(html).not.toContain('assets/js/app/api.js');
        expect(html).not.toContain('assets/js/app/auth.js');
        expect(html).not.toContain('assets/js/data/initial-state.js');
        expect(html).not.toContain('assets/js/app/state.js');
        expect(html).not.toContain('assets/js/shared/faculty.js');
        expect(html).toContain('assets/css/login-route.css');
        expect(html).toContain('assets/js/pages/login-runtime.js?v=20260819-fastboot3');
        expect(html).toContain('class="login-page lux-full-paint palette-obsidian-amber"');
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
        expect(runtimeSource).toContain('let loginRequestInFlight = false;');
        expect(runtimeSource).toContain("navigator.serviceWorker.register('/service-worker.js?v=20260819-fastboot2'");
        expect(runtimeSource).toContain('for (let attempt = 0; attempt < 2; attempt += 1) {');
        expect(runtimeSource).toContain('if (loginRequestInFlight) return;');
        expect(runtimeSource).toContain('async function authActivate(id, activationToken, newPassword) {');
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
