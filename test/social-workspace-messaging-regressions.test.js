import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social workspace messaging regressions', () => {
    it('keeps messenger read, notification refresh, and lost-found persistence wired in the social runtime', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const page = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');

        expect(html).toContain('assets/js/shared/social-runtime-lite.js?v=20260713-post-compose1');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');

        expect(runtime).toContain("portalRequest(`/api/notifications?userId=${encodeURIComponent(text(user.id))}&limit=50`)");
        expect(runtime).toContain("type: text(item.type || 'general')");
        expect(runtime).toContain('/api/messenger/chats/${encodeURIComponent(normalizedChatId)}/read');
        expect(runtime).toContain('markPortalChatMessagesRead: markChatMessagesRead');
        expect(runtime).toContain('refreshPortalNotifications: refreshNotifications');
        expect(runtime).toContain('persistPortalSocialStatePatch: persistSocialStatePatch');
        expect(runtime).toContain('unhidePortalMessengerChatForUser: unhideChatForUser');
        expect(runtime).not.toMatch(/async function sendMessage\(chatId, body, file\)/);
        expect(runtime).toContain("portalRequest('/api/messenger/message'");

        expect(page).toContain('markPortalChatMessagesRead(nextChatId)');
        expect(page).toContain('refreshPortalNotifications(true)');
        expect(page).toContain('persistPortalSocialStatePatch({ lostFoundItems: normalizedItems }');
        expect(page).toContain('notification?.routeData?.chatId');
    });

    it('exposes chat read on the messenger backend route module', () => {
        const routeModule = readSource('backend/platform/routes/messenger-calls-routes.js');
        const store = readSource('backend/platform/store.js');

        expect(routeModule).toContain("app.post('/api/messenger/chats/:chatId/read'");
        expect(routeModule).toContain('store.markChatMessagesRead');
        expect(store).toContain('markChatMessagesRead(chatId, userId)');
    });
});