import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('system and auth maintenance route split', () => {
    it('mounts the remaining public/system and auth-maintenance routes from dedicated modules', () => {
        const server = readSource('backend/platform/server.js');
        const systemRoutes = readSource('backend/platform/routes/system-routes.js');
        const authMaintenanceRoutes = readSource('backend/platform/routes/auth-maintenance-routes.js');

        expect(server).toContain("require('./routes/system-routes')");
        expect(server).toContain("require('./routes/auth-maintenance-routes')");
        expect(server).toContain('registerSystemRoutes(app, {');
        expect(server).toContain('registerAuthMaintenanceRoutes(app, {');

        expect(systemRoutes).toContain("app.get('/download'");
        expect(systemRoutes).toContain("app.get('/download/:platform/file'");
        expect(systemRoutes).toContain("app.get('/health'");
        expect(systemRoutes).toContain("app.get('/ready'");
        expect(systemRoutes).toContain("app.post('/api/ai/career-completion'");

        expect(authMaintenanceRoutes).toContain("app.post('/api/auth/login'");
        expect(authMaintenanceRoutes).toContain("app.post('/api/auth/logout'");
        expect(authMaintenanceRoutes).toContain("app.post('/api/session/impersonate-role'");
        expect(authMaintenanceRoutes).toContain("app.post('/api/auth/activate'");
        expect(authMaintenanceRoutes).toContain("app.post('/api/auth/request-reset'");
        expect(authMaintenanceRoutes).toContain("app.post('/api/auth/reset-password'");
    });
});
