import { describe, expect, it } from 'vitest';
import {
    readLmsLiveQuizSource,
    readLmsLiveQuizUiChain,
    readLmsLiveQuizAccessRuntime,
    readLmsLiveQuizWorkspaceRuntime,
    readLmsLiveQuizSessionRuntime,
    readLmsLiveQuizUiStaffRuntime,
    readLmsLiveQuizMainUiRuntime
} from './helpers/lms-live-quiz-source.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('lms live quiz route split', () => {
    it('mounts the live-quiz workspace backend routes from a dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/lms-live-quiz-routes.js');

        expect(server).toContain("require('./routes/lms-live-quiz-routes')");
        expect(server).toContain('registerLmsLiveQuizRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/lms/live-quizzes/:resourceKey'");
        expect(routeModule).toContain("app.post('/api/lms/live-quizzes/:resourceKey'");
        expect(routeModule).toContain("app.post('/api/lms/live-quizzes/:resourceKey/join'");
        expect(routeModule).toContain("app.post('/api/lms/live-quizzes/:resourceKey/answers'");
        expect(routeModule).toContain('mergeStaffLiveQuizWorkspace(existingWorkspace, workspace)');
        expect(routeModule).toContain('mergeStudentLiveQuizJoin(existingWorkspace, request.body || {}, sessionAccount)');
        expect(routeModule).toContain("const merged = mergeStudentLiveQuizAnswer(existingWorkspace, workspace, sessionAccount);");
        expect(routeModule).toContain("type: 'lms-live-quiz:updated'");
    });
});
