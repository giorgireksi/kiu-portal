import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social governance regressions', () => {
    it('derives social creation actor identity from the authenticated session instead of trusting caller-owned ids', () => {
        const routeModule = readSource('backend/platform/routes/social-routes.js');

        expect(routeModule).toContain("app.post('/api/social/pages'");
        expect(routeModule).toContain('const sessionAccount = requireSessionAccount(request, response);');
        expect(routeModule).toContain('const actorUserId = getActorUserId(sessionAccount);');
        expect(routeModule).toContain('const page = store.createSocialPage(request.body || {}, actorUserId);');
        expect(routeModule).toContain("app.post('/api/social/groups'");
        expect(routeModule).toContain('const group = store.createSocialGroup(request.body || {}, actorUserId);');
        expect(routeModule).toContain("app.post('/api/social/projects'");
        expect(routeModule).toContain('const project = store.createSocialProject(request.body || {}, actorUserId);');
        expect(routeModule).toContain("app.post('/api/social/posts'");
        expect(routeModule).toContain('const post = store.createSocialPost(request.body || {}, actorUserId);');
        expect(routeModule).toContain("app.post('/api/social/events'");
        expect(routeModule).toContain('const event = store.createSocialEvent(request.body || {}, actorUserId);');
        expect(routeModule).not.toContain("const page = store.createSocialPage(request.body || {}, request.body?.actorId || '');");
        expect(routeModule).not.toContain("const group = store.createSocialGroup(request.body || {}, request.body?.actorId || '');");
        expect(routeModule).not.toContain("const project = store.createSocialProject(request.body || {}, request.body?.actorId || '');");
        expect(routeModule).not.toContain('const post = store.createSocialPost(request.body || {});');
        expect(routeModule).not.toContain("const event = store.createSocialEvent(request.body || {}, request.body?.actorId || '');");
    });

    it('keeps privileged social ownership and governance fields server-owned in the extracted social content domain', () => {
        const store = readSource('backend/platform/store.js');
        const socialContent = readSource('backend/platform/domains/social-content-service.js');

        expect(store).toContain("createSocialPage(payload = {}, actorId = '') { return createSocialPage.call(this, payload, actorId); }");
        expect(store).toContain("createSocialGroup(payload = {}, actorId = '') { return createSocialGroup.call(this, payload, actorId); }");
        expect(socialContent).toContain("const normalizedActorId = socialText(actorId || '');");
        expect(socialContent).toContain("const ownerUserId = normalizedActorId;");
        expect(socialContent).toContain('official: false,');
        expect(socialContent).toContain('verified: false,');
        expect(socialContent).toContain('adminIds: [],');
        expect(socialContent).toContain('pendingMemberIds: [],');
        expect(socialContent).toContain('joinedAtByUser: { [ownerUserId]: createdAt },');
        expect(socialContent).toContain('notificationPreferenceByUser: {},');
        expect(socialContent).not.toContain('const ownerUserId = socialText(payload.ownerUserId || actorId);');
        expect(socialContent).not.toContain('official: Boolean(payload.official || payload.isOfficial),');
        expect(socialContent).not.toContain('verified: Boolean(payload.verified || payload.official || payload.isOfficial),');
    });
});
