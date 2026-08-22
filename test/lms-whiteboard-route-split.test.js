import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import { join } from 'path';

const require = createRequire(import.meta.url);

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

    it('lets a personal-board owner sync without a class-scope guard', async () => {
        const { registerLmsWhiteboardRoutes } = require('../backend/platform/routes/lms-whiteboard-routes.js');
        const whiteboard = require('../backend/platform/domains/lms-whiteboard-service.js');
        const handlers = {};
        const app = {
            get(path, handler) { handlers[`GET ${path}`] = handler; },
            post(path, handler) { handlers[`POST ${path}`] = handler; }
        };
        const resourceKey = 'ECON-01-001::g1__lmssec_lecture__personal__stu-1';
        const session = { account: { id: 'stu-1', role: 'student' } };
        const existingWorkspace = { resourceKey, elements: [], version: 0 };
        let responseBody = null;
        let scopeGuardCalls = 0;

        registerLmsWhiteboardRoutes(app, {
            broadcastAll() {},
            getSessionRole: () => 'student',
            resolveSessionActorAccount: () => ({ id: 'stu-1', userId: 'stu-1' }),
            getStore: () => ({
                getLmsWhiteboardWorkspace: () => existingWorkspace,
                saveLmsWhiteboardWorkspace: workspace => workspace
            }),
            requireSessionAccount: () => session,
            requireLmsLiveQuizWorkspaceAccess: () => {
                scopeGuardCalls += 1;
                return null;
            },
            mergeStudentWhiteboardOps: (workspace) => ({ workspace }),
            mergeStudentWhiteboardWorkspace: (workspace) => ({ workspace }),
            mergeStaffWhiteboardWorkspace: workspace => workspace,
            mergePersonalDashboardWorkspace: (workspace) => ({ workspace }),
            sendError: (_response, status, error) => { throw new Error(`${status}: ${error}`); },
            staffRoles: new Set(['admin', 'professor', 'ta']),
            stripLmsPersonalBoardScopeKey: whiteboard.stripLmsPersonalBoardScopeKey,
            isLmsPersonalBoardKey: whiteboard.isLmsPersonalBoardKey,
            assertLmsPersonalBoardReadAccess: () => ({ ok: true, isOwner: true }),
            assertLmsPersonalBoardWriteAccess: () => ({ ok: true, isOwner: true }),
            redactPersonalWorkspaceForStaffViewer: workspace => workspace,
            redactPersonalWorkspaceForViewer: workspace => workspace,
            parsePersonalScopeMeta: () => ({ groupId: 'g1', sectionType: 'lecture' })
        });

        await handlers['POST /api/lms/whiteboards/:resourceKey/ops'](
            { params: { resourceKey }, body: { ops: [] } },
            { json(payload) { responseBody = payload; } }
        );

        expect(scopeGuardCalls).toBe(0);
        expect(responseBody).toMatchObject({ ok: true, resourceKey });
    });
});