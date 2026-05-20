import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('academic route split', () => {
    it('mounts the catalog/registration/lms academic family from a dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/academic-routes.js');

        expect(server).toContain("require('./routes/academic-routes')");
        expect(server).toContain('registerAcademicRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/catalog/courses'");
        expect(routeModule).toContain("app.get('/api/catalog/sections'");
        expect(routeModule).toContain("app.get('/api/students/:id/eligibility'");
        expect(routeModule).toContain("app.get('/api/students/:id/enrollments'");
        expect(routeModule).toContain("app.post('/api/registration/enroll'");
        expect(routeModule).toContain("app.post('/api/registration/drop'");
        expect(routeModule).toContain("app.get('/api/lms/courses/:id'");
        expect(routeModule).toContain("app.post('/api/lms/assignments'");
        expect(routeModule).toContain("app.post('/api/lms/materials'");
        expect(routeModule).toContain("app.post('/api/exam-sessions/sync'");
    });
});
