import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin and integrations route split', () => {
    it('mounts the adjacent admin/integration family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/admin-integrations-routes.js');

        expect(server).toContain("require('./routes/admin-integrations-routes')");
        expect(server).toContain('registerAdminIntegrationsRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/admin/accounts'");
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
    });
});
