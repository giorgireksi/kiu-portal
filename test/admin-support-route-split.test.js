import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('admin support route split', () => {
    it('mounts the audit and admin support cluster from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/admin-support-routes.js');

        expect(server).toContain("require('./routes/admin-support-routes')");
        expect(server).toContain('registerAdminSupportRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/audit/events'");
        expect(routeModule).toContain("app.post('/api/audit/events'");
        expect(routeModule).toContain("app.post('/api/admin/holds'");
        expect(routeModule).toContain("app.post('/api/admin/sections'");
        expect(routeModule).toContain("app.post('/api/admin/import-jobs'");
        expect(routeModule).toContain("app.get('/api/admin/import-jobs/:id'");
        expect(routeModule).toContain("eventDomain: 'client-annotation'");
        expect(routeModule).toContain("eventType: 'annotation-recorded'");
        expect(routeModule).toContain("entityType: 'client_annotation'");
    });
});
