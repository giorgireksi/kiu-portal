import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('gradebook route split', () => {
    it('mounts the gradebook backend route family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/gradebook-routes.js');

        expect(server).toContain("require('./routes/gradebook-routes')");
        expect(server).toContain('registerGradebookRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/gradebook/courses/:id'");
        expect(routeModule).toContain("app.post('/api/gradebook/scores'");
        expect(routeModule).toContain("app.post('/api/gradebook/publish'");
        expect(routeModule).toContain("app.post('/api/gradebook/finalize'");
        expect(routeModule).toContain("reason: request.body?.reason || request.body?.note || 'Gradebook score update'");
    });
});
