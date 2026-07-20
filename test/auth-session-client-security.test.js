import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('auth session client security regressions', () => {
    it('clears persisted state, exam portal leftovers, and cache state during logout', () => {
        const api = readSource('assets/js/app/api.js');
        const auth = readSource('assets/js/app/auth.js');
        const routeModule = readSource('backend/platform/routes/auth-maintenance-routes.js');

        expect(api).toContain("localStorage.removeItem('KIU_PERSISTENT_STATE');");
        expect(api).toContain("localStorage.removeItem('KIU_EXAM_PORTAL_TOKEN');");
        expect(api).toContain("sessionStorage.removeItem('KIU_EXAM_PORTAL_TOKEN');");
        expect(api).toContain("removeStorageKeysByPrefix(localStorage, 'KIU_EXAM_DRAFT_');");
        expect(api).toContain("removeStorageKeysByPrefix(sessionStorage, 'KIU_EXAM_DRAFT_');");
        expect(auth).toContain("clearPortalClientAuthState({ preserveFaculty: false, clearPersistentState: true });");
        expect(auth).toContain('await destroyPortalBackendSession(activeSessionToken);');
        expect(auth).toContain("await window.clearPortalSiteCaches(true).catch(() => false);");
        expect(auth).toContain("window.location.replace('login.html');");
        expect(auth).not.toContain('destroyPortalBackendSession();');
        expect(routeModule).toContain("app.post('/api/auth/logout'");
    });
});
