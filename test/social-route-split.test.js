import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social route split', () => {
    it('mounts the social backend family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/social-routes.js');

        expect(server).toContain("require('./routes/social-routes')");
        expect(server).toContain('registerSocialRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/social/bootstrap'");
        expect(routeModule).toContain("app.post('/api/social/state'");
        expect(routeModule).toContain("app.post('/api/social/group-chat'");
        expect(routeModule).toContain("app.get('/api/social/feed'");
        expect(routeModule).toContain("app.post('/api/social/posts/resolve'");
        expect(routeModule).toContain("app.get('/api/social/events'");
        expect(routeModule).toContain("app.post('/api/social/pages'");
        expect(routeModule).toContain("app.post('/api/social/groups'");
        expect(routeModule).toContain("app.post('/api/social/projects'");
        expect(routeModule).toContain("app.post('/api/social/relationships/request'");
        expect(routeModule).toContain("app.post('/api/social/follows/toggle'");
        expect(routeModule).toContain("app.post('/api/social/posts'");
        expect(routeModule).toContain("app.post('/api/social/reports'");
        expect(routeModule).toContain("app.post('/api/social/profiles/:id'");
        expect(routeModule).toContain("app.post('/api/social/events/:id/rsvp'");
    });
});
