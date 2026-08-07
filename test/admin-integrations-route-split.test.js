import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin and integrations route split', () => {
    it('mounts the adjacent admin/integration family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/admin-integrations-routes.js');
        const portalSupportRoutes = readSource('backend/platform/routes/portal-support-routes.js');
        const socialRuntime = readSource('assets/js/shared/social-runtime-lite.js');

        expect(server).toContain("require('./routes/admin-integrations-routes')");
        expect(server).toContain('registerAdminIntegrationsRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/admin/accounts'");
        expect(routeModule).toContain("new Set(['admin', 'student_service'])");
        expect(portalSupportRoutes).toContain("app.get('/api/accounts/directory'");
        expect(portalSupportRoutes).toContain('__no_faculty_scope__');
        expect(portalSupportRoutes).toContain('toDirectoryAccount');
        expect(socialRuntime).toContain('/api/accounts/directory?');
        expect(routeModule).toContain("app.post('/api/admin/accounts'");
        expect(routeModule).toContain("app.post('/api/admin/accounts/:id/privileges'");
        expect(routeModule).toContain("app.post('/api/admin/reset-platform-state'");
        expect(routeModule).toContain("app.get('/api/admin/people'");
        expect(routeModule).toContain("app.post('/api/admin/people'");
        expect(routeModule).toContain("app.get('/api/integrations/systems'");
        expect(routeModule).toContain("app.post('/api/integrations/systems'");
        expect(routeModule).toContain("app.get('/api/integrations/sync-runs'");
        expect(routeModule).toContain("app.post('/api/integrations/sync-runs'");
        expect(routeModule).toContain("app.get('/api/integrations/conflicts'");
        expect(routeModule).toContain("app.post('/api/integrations/conflicts'");
        expect(routeModule).toContain("eventType: 'account-privileges-updated'");
        expect(routeModule).toContain("eventType: 'platform-state-reset'");
        expect(routeModule).toContain("eventType: 'system-upserted'");
        expect(routeModule).toContain("eventType: 'sync-run-created'");
        expect(routeModule).toContain("eventType: 'sync-conflict-upserted'");
        expect(socialRuntime).toContain("if (!runtime.ui.directorySearch && user.role !== 'admin') query.set('facultyCode', currentFacultyCode());");
    });

    it('scopes the mobile directory lookup and returns only directory-safe account fields', () => {
        const { registerPortalSupportRoutes } = require('../backend/platform/routes/portal-support-routes.js');
        const handlers = {};
        let receivedQuery = null;
        let payload = null;
        const app = {
            get(path, handler) {
                handlers[path] = handler;
            },
            post() {}
        };
        const account = {
            id: 'ta-54',
            email: '54',
            name: 'Demo TA 54',
            displayName: 'Demo TA 54',
            role: 'ta',
            facultyCode: 'ECON',
            passwordHash: 'must-not-leak'
        };
        const sessionAccount = {
            account: { role: 'ta', facultyCode: 'ECON' },
            session: { actualRole: 'ta' }
        };

        registerPortalSupportRoutes(app, {
            getStore: () => ({
                listAccounts(query) {
                    receivedQuery = query;
                    return { items: [account], total: 1, limit: 24, offset: 0 };
                }
            }),
            requireSessionAccount: () => sessionAccount
        });
        handlers['/api/accounts/directory'](
            { query: { limit: '24', facultyCode: 'LAW' } },
            { json(value) { payload = value; } }
        );

        expect(receivedQuery.facultyCode).toBe('ECON');
        expect(payload.items[0]).toMatchObject({ id: 'ta-54', displayName: 'Demo TA 54' });
        expect(payload.items[0]).not.toHaveProperty('passwordHash');
    });
});
