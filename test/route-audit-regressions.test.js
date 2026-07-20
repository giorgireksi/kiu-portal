import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('route audit regressions', () => {
    it('keeps high-risk mutation routes wired into addRouteAuditEvent', () => {
        const fileRoutes = readSource('backend/platform/routes/files-routes.js');
        const adminIntegrationRoutes = readSource('backend/platform/routes/admin-integrations-routes.js');
        const portalSupportRoutes = readSource('backend/platform/routes/portal-support-routes.js');
        const socialRoutes = readSource('backend/platform/routes/social-routes.js');

        expect(portalSupportRoutes).toContain("app.post('/api/portal/state'");
        expect(portalSupportRoutes).toContain("eventType: 'portal-state-saved'");
        expect(socialRoutes).toContain("app.post('/api/social/state'");
        expect(socialRoutes).toContain("eventType: 'social-state-saved'");
        expect(fileRoutes).toContain("app.post('/api/files/upload'");
        expect(fileRoutes).toContain("eventType: 'file-uploaded'");
        expect(adminIntegrationRoutes).toContain("app.post('/api/admin/accounts/:id/privileges'");
        expect(adminIntegrationRoutes).toContain("eventType: 'account-privileges-updated'");
        expect(adminIntegrationRoutes).toContain("app.post('/api/admin/reset-platform-state'");
        expect(adminIntegrationRoutes).toContain("eventType: 'platform-state-reset'");
    });
});
