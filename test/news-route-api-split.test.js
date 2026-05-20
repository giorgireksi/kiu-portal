import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('news route api split', () => {
    it('mounts the backend news route family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/news-routes.js');

        expect(server).toContain("require('./routes/news-routes')");
        expect(server).toContain('registerNewsRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/news/feed'");
        expect(routeModule).toContain("app.get('/api/news/privileges'");
        expect(routeModule).toContain("app.post('/api/news/posts'");
        expect(routeModule).toContain("app.patch('/api/news/posts/:id'");
        expect(routeModule).toContain("app.post('/api/news/posts/:id/replies'");
        expect(routeModule).toContain("type: 'news:updated'");
    });
});
