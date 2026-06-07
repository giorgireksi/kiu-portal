import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('messenger and calls route split', () => {
    it('mounts the messenger and calls backend family from its dedicated route module', () => {
        const server = readSource('backend/platform/server.js');
        const routeModule = readSource('backend/platform/routes/messenger-calls-routes.js');

        expect(server).toContain("require('./routes/messenger-calls-routes')");
        expect(server).toContain('registerMessengerCallsRoutes(app, {');
        expect(routeModule).toContain("app.get('/api/messenger/snapshot'");
        expect(routeModule).toContain("app.post('/api/messenger/direct'");
        expect(routeModule).toContain("app.post('/api/messenger/message'");
        expect(routeModule).toContain("app.delete('/api/messenger/chats/:chatId/messages/:messageId'");
        expect(routeModule).toContain("app.post('/api/messenger/chats/:chatId/hide'");
        expect(routeModule).toContain("app.post('/api/messenger/chats/:chatId/read'");
        expect(routeModule).toContain("app.post('/api/calls/start'");
        expect(routeModule).toContain("app.post('/api/calls/accept'");
        expect(routeModule).toContain("app.post('/api/calls/decline'");
        expect(routeModule).toContain("app.post('/api/calls/end'");
        expect(routeModule).toContain("app.post('/api/calls/join'");
        expect(routeModule).toContain("app.post('/api/calls/leave'");
        expect(routeModule).toContain("app.post('/api/calls/signal'");
        expect(routeModule).toContain("type: 'call:ringing'");
        expect(routeModule).toContain("type: 'call:accepted'");
        expect(routeModule).toContain("type: 'call:declined'");
        expect(routeModule).toContain("type: 'call:ended'");
        expect(routeModule).toContain("type: 'call:signal'");
    });
});
