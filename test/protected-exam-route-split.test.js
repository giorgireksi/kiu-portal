import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('protected exam route split', () => {
    it('mounts the exam-portal and protected-quiz backend family from a dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/protected-exam-routes.js');

        expect(server).toContain("require('./routes/protected-exam-routes')");
        expect(server).toContain('registerProtectedExamRoutes(app, {');
        expect(routeModule).toContain("app.post('/api/exam-portal/auth'");
        expect(routeModule).toContain("app.get('/api/exam-portal/sessions'");
        expect(routeModule).toContain("app.get('/api/exam-portal/session/:sessionId'");
        expect(routeModule).toContain("app.post('/api/exam-portal/sessions/:sessionId/launch-ticket'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/sync'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/launch-ticket'");
        expect(routeModule).toContain("app.post('/api/protected-client/redeem-launch'");
        expect(routeModule).toContain("app.get('/api/protected-quizzes/group/:groupKey/monitor'");
        expect(routeModule).toContain("app.get('/api/protected-quizzes/:quizId/attempts'");
        expect(routeModule).toContain("app.get('/api/protected-quizzes/:quizId/attempt'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/heartbeat'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/events'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/submit'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/students/:studentId/block'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/students/:studentId/unblock'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/students/:studentId/force-submit'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/students/:studentId/reset-warnings'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/students/:studentId/approve-reconnect'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/students/:studentId/override-status'");
        expect(routeModule).toContain("app.post('/api/protected-quizzes/:quizId/manual-grade'");
    });
});
