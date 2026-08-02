import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social workspace messaging regressions', () => {
    it('keeps messenger read, notification refresh, and lost-found persistence wired in the social runtime', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        const page = readSource('assets/js/pages/social-page.js');
        const html = readSource('social.html');

        expect(html).toMatch(/assets\/js\/shared\/social-runtime-lite\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-ui-kernel\.js\?v=/);
        expect(html).toMatch(/assets\/js\/pages\/social-page\.js\?v=/);

        expect(runtime).toContain("portalRequest(`/api/notifications?userId=${encodeURIComponent(text(user.id))}&limit=50`)");
        expect(runtime).toContain("type: text(item.type || 'general')");
        expect(runtime).toContain('/api/messenger/chats/${encodeURIComponent(normalizedChatId)}/read');
        expect(runtime).toContain('markPortalChatMessagesRead: markChatMessagesRead');
        expect(runtime).toContain('refreshPortalNotifications: refreshNotifications');
        expect(runtime).toContain('persistPortalSocialStatePatch: persistSocialStatePatch');
        expect(runtime).toContain('unhidePortalMessengerChatForUser: unhideChatForUser');
        // TDZ guard: content API must not receive refreshNotifications (and siblings)
        // before they are assigned from the content factory return.
        const contentApiCall = runtime.slice(
            runtime.indexOf('window.__kiuCreateSocialLiteContentApi({'),
            runtime.indexOf('const {', runtime.indexOf('window.__kiuCreateSocialLiteContentApi({'))
        );
        expect(contentApiCall).not.toMatch(/\brefreshNotifications\b/);
        expect(contentApiCall).not.toMatch(/\bapplyFollowMutationLocally\b/);
        expect(contentApiCall).not.toMatch(/\bpersistSocialStatePatch\b/);
        expect(contentApiCall).not.toMatch(/\bapplyProjectGraphLocally\b/);
        expect(page).not.toContain("throw new Error('social-page-boot-runtime.js missing')");
        expect(page).toContain('[Social] social-page-boot-runtime.js missing');
        expect(runtime).not.toMatch(/async function sendMessage\(chatId, body, file\)/);
        expect(readSource('assets/js/shared/social-lite-content-runtime.js'))
            .toContain("portalRequest('/api/messenger/message'");
        expect(readSource('assets/js/shared/social-lite-content-runtime.js'))
            .not.toMatch(/function refreshNotifications\(\.\.\.a\) \{ return __lookup\('refreshNotifications'\)/);
        expect(readSource('assets/js/shared/social-lite-content-runtime.js'))
            .toMatch(/function fetchAccountsByIds\(\.\.\.a\) \{ return __lookup\('fetchAccountsByIds'\)/);
        expect(runtime).toMatch(/fetchAccountsByIds, refreshFeed, ensureActiveChat, routeToSocial/);
        expect(readSource('assets/js/shared/social-lite-content-runtime.js'))
            .toMatch(/function routeToSocial\(\.\.\.a\) \{ return __lookup\('routeToSocial'\)/);
        expect(runtime).toMatch(/ensureCallMedia, attachLocalCallPreview/);
        expect(readSource('assets/js/shared/social-lite-content-runtime.js'))
            .toMatch(/function ensureCallMedia\(\.\.\.a\) \{ return __lookup\('ensureCallMedia'\)/);
        expect(readSource('assets/js/pages/social-page-boot-runtime.js').indexOf('__kiuCreateSocialPageBootApi'))
            .toBeLessThan(readSource('assets/js/pages/social-page-boot-runtime.js').indexOf('__KIU_SOCIAL_PAGE_BOOT_LOADED = true'));

        const app = readSource('assets/js/app/app.js');
        expect(app.indexOf('social-page-boot-runtime.js'))
            .toBeLessThan(app.indexOf('assets/js/pages/social-page.js'));
        expect(app).toContain('social-page-shell-runtime.js');
        expect(app).toContain('social-page-feed-runtime.js');
        expect(app).toContain('social-overlay-chrome.js');

        expect(readSource('assets/js/pages/social-page-interactions-runtime.js'))
            .toContain('markPortalChatMessagesRead(nextChatId)');
        expect(readSource('assets/js/pages/social-shell-nav.js'))
            .toContain('refreshPortalNotifications(true)');
        expect(page).toContain('persistPortalSocialStatePatch({ lostFoundItems: normalizedItems }');
        expect(readSource('assets/js/pages/social-alerts-model.js')).toContain('notification?.routeData?.chatId');
    });

    it('exposes chat read on the messenger backend route module', () => {
        const routeModule = readSource('backend/platform/routes/messenger-calls-routes.js');
        const store = readSource('backend/platform/store.js');

        expect(routeModule).toContain("app.post('/api/messenger/chats/:chatId/read'");
        expect(routeModule).toContain('decodeURIComponent(chatId)');
        expect(routeModule).toContain('store.markChatMessagesRead');
        expect(store).toContain('markChatMessagesRead(chatId, userId)');
        expect(store).toContain('repairSocialGroupChatMembership(chatId, userId)');
    });
});