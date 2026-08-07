import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('portal support route split', () => {
    it('mounts the portal bootstrap/account/notification/push support family from a dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/portal-support-routes.js');

        expect(server).toContain("require('./routes/portal-support-routes')");
        expect(server).toContain('registerPortalSupportRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/bootstrap'");
        expect(routeModule).toContain("app.get('/api/portal/bootstrap'");
        expect(routeModule).toContain("app.post('/api/portal/state'");
        expect(routeModule).toContain("app.get('/api/me'");
        expect(routeModule).toContain("app.get('/api/events'");
        expect(routeModule).toContain("app.get('/api/accounts'");
        expect(routeModule).toContain("app.get('/api/accounts/directory'");
        expect(routeModule).toContain('DIRECTORY_ACCOUNT_FIELDS');
        expect(routeModule).toContain("app.post('/api/accounts/upsert'");
        expect(routeModule).toContain("app.get('/api/notifications'");
        expect(routeModule).toContain("app.post('/api/notifications/read'");
        expect(routeModule).toContain("app.post('/api/notifications/delete'");
        expect(routeModule).toContain("app.post('/api/notifications/preferences'");
        expect(routeModule).toContain("app.get('/api/push/public-config'");
        expect(routeModule).toContain("app.post('/api/push/subscribe'");
        expect(routeModule).toContain("app.post('/api/push/unsubscribe'");
    });
});
