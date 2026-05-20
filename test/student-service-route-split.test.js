import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('student service route split', () => {
    it('mounts the student-service backend route family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/student-service-routes.js');

        expect(server).toContain("require('./routes/student-service-routes')");
        expect(server).toContain('registerStudentServiceRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/student-service/bootstrap'");
        expect(routeModule).toContain("app.post('/api/student-service/tickets'");
        expect(routeModule).toContain("app.post('/api/student-service/tickets/:id/replies'");
        expect(routeModule).toContain("app.post('/api/student-service/tickets/:id/status'");
        expect(routeModule).toContain("app.post('/api/student-service/tickets/:id/assign'");
        expect(routeModule).toContain("app.post('/api/student-service/tickets/:id/internal-notes'");
        expect(routeModule).toContain("app.post('/api/student-service/tickets/:id/handoff'");
        expect(routeModule).toContain("app.post('/api/student-service/articles'");
        expect(routeModule).toContain("app.post('/api/student-service/questions'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/answers'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/feedback'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/accept-answer'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/publish'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/flags'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/convert-to-ticket'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/convert-to-article'");
        expect(routeModule).toContain("app.post('/api/student-service/questions/:id/merge'");
        expect(routeModule).toContain("broadcastAll({ type: 'student-service:updated'");
        expect(routeModule).toContain('request.kiuSessionAccount || requireSessionAccount(request, response)');
    });
});
