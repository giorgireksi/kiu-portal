import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms whiteboard route split', () => {
    it('mounts the whiteboard backend routes from a dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/lms-whiteboard-routes.js');

        expect(server).toContain("require('./routes/lms-whiteboard-routes')");
        expect(server).toContain('registerLmsWhiteboardRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/lms/whiteboards/:resourceKey'");
        expect(routeModule).toContain("app.post('/api/lms/whiteboards/:resourceKey'");
        expect(routeModule).toContain("app.post('/api/lms/whiteboards/:resourceKey/ops'");
        expect(routeModule).toContain("app.post('/api/lms/whiteboards/:resourceKey/signal'");
        expect(routeModule).toContain("type: 'lms-whiteboard:updated'");
        expect(routeModule).toContain("type: 'lms-whiteboard:signal'");
    });
});