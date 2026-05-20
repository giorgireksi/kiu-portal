import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social relationship route regressions', () => {
    it('derives relationship and follow actors from the authenticated session instead of trusting payload user ids', () => {
        const routeModule = readSource('backend/platform/routes/social-routes.js');

        expect(routeModule).toContain("app.post('/api/social/relationships/request'");
        expect(routeModule).toContain("const relationship = store.sendSocialConnectionRequest(actorUserId, request.body?.toUserId);");
        expect(routeModule).toContain("app.post('/api/social/relationships/:id/respond'");
        expect(routeModule).toContain("const result = store.respondSocialConnectionRequest(request.params.id, actorUserId, request.body?.accept !== false);");
        expect(routeModule).toContain("app.post('/api/social/relationships/remove'");
        expect(routeModule).toContain("const removed = store.removeSocialConnection(actorUserId, request.body?.targetUserId);");
        expect(routeModule).toContain("app.post('/api/social/follows/toggle'");
        expect(routeModule).toContain("const result = store.toggleSocialFollow(actorUserId, request.body?.targetType, request.body?.targetId);");
        expect(routeModule).not.toContain("const relationship = store.sendSocialConnectionRequest(request.body?.fromUserId, request.body?.toUserId);");
        expect(routeModule).not.toContain("const result = store.respondSocialConnectionRequest(request.params.id, request.body?.actorId, request.body?.accept !== false);");
        expect(routeModule).not.toContain("const removed = store.removeSocialConnection(request.body?.userId, request.body?.targetUserId);");
        expect(routeModule).not.toContain("const result = store.toggleSocialFollow(request.body?.userId, request.body?.targetType, request.body?.targetId);");
    });
});
