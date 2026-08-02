import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social session actor route regressions', () => {
    it('uses the authenticated session actor for social update, reaction, report, profile, and RSVP routes', () => {
        const routeModule = readSource('backend/platform/routes/social-routes.js');

        expect(routeModule).toContain("const page = store.updateSocialPage(request.params.id, request.body || {}, actorUserId);");
        expect(routeModule).toContain("const group = store.updateSocialGroup(request.params.id, request.body || {}, actorUserId);");
        expect(routeModule).toContain("const project = store.updateSocialProject(request.params.id, request.body || {}, actorUserId);");
        expect(routeModule).toContain("const post = store.updateSocialPost(request.params.id, request.body || {}, actorUserId);");
        expect(routeModule).toContain("const post = store.toggleSocialReaction(request.params.id, actorUserId, request.body?.reactionType || 'like');");
        expect(routeModule).toContain("authorUserId: actorUserId");
        expect(routeModule).toContain("const report = store.createSocialReport({");
        expect(routeModule).toContain("reporterUserId: actorUserId");
        expect(routeModule).toContain("const report = store.resolveSocialReport(request.params.id, request.body || {}, actorUserId);");
        expect(routeModule).toContain("const profile = store.upsertSocialProfile(request.params.id, request.body || {}, actorUserId);");
        expect(routeModule).toContain("const event = store.respondSocialEventRsvp(request.params.id, actorUserId, request.body?.status || 'going');");
        expect(routeModule).toContain("const result = store.toggleSocialModulePin(");
        expect(routeModule).not.toContain("const post = store.toggleSocialReaction(request.params.id, request.body?.userId, request.body?.reactionType || 'like');");
        expect(routeModule).not.toContain("const profile = store.upsertSocialProfile(request.params.id, request.body || {}, request.body?.actorId || request.params.id);");
        expect(routeModule).not.toContain("const event = store.respondSocialEventRsvp(request.params.id, request.body?.userId, request.body?.status || 'going');");
    });
});
