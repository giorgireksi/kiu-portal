import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('platform ops route split', () => {
    it('mounts platform diagnostics routes from the dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/platform-ops-routes.js');

        expect(server).toContain("require('./routes/platform-ops-routes')");
        expect(server).toContain('registerPlatformOpsRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/platform/config'");
        expect(routeModule).toContain("app.get('/api/platform/status'");
        expect(routeModule).toContain("app.get('/api/platform/readiness'");
        expect(routeModule).toContain("app.get('/api/platform/downloads'");
        expect(routeModule).toContain('uploadsReady: fs.existsSync(uploadsDir)');
        expect(routeModule).toContain('turnConfigured: buildRtcConfig().iceServers.some(');
    });
});
