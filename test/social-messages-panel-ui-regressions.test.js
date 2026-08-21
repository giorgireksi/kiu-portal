import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-messages-panel-ui-regressions.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('messages markup uses asd8 social-neo button and tab dialect', () => {
        const messages = readSource('assets/js/pages/social-messages.js');
        expect(messages).toContain('social-neo-btn social-neo-btn-ghost social-neo-btn-sm social-neo-btn-icon');
        expect(messages).toContain('social-neo-messages__inbox-filters');
        expect(messages).toContain('social-neo-tab');
        expect(messages).toContain('social-neo-tab-badge');
        expect(messages).not.toContain('lux-tab-strip');
        expect(messages).not.toContain('lux-tab-btn');
        expect(messages).toMatch(/social-neo-input social-neo-input-flex-1-180 social-neo-msg-compose-input/);
        expect(messages).not.toMatch(/social-neo-input lux-control/);
    });

    it('gates is-group-rail-open to group threads only', () => {
        const messages = readSource('assets/js/pages/social-messages.js');
        expect(messages).toMatch(/const railOpen = isGroupThread && runtime\.ui\?\.groupThreadRailOpen !== false/);
    });

    it('bare-lite includes messages panel hub chrome selectors', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__inbox-filters/);
        expect(bare).toContain('.social-neo-messages__unread-badge');
        expect(bare).toContain('--social-msg-bubble-in');
        expect(bare).toContain('--msg-stream-bg');
        expect(bare).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-chat-item[\s\S]*backdrop-filter:\s*none/);
        expect(bare).toMatch(/\[data-panel="messages"\][\s\S]*grid-template-columns:\s*minmax\(300px,\s*320px\)/);
    });

    it('bare-lite stretches thread stream for own-message alignment', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).toMatch(
            /\[data-panel="messages"\] \.social-neo-thread-messages[\s\S]*flex:\s*0 0 auto/
        );
    });

    it('bare-lite includes group-thread toolbar and search bar chrome', () => {
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        const sharedControls = readSource('assets/css/lux-controls.css');
        expect(sharedControls).toContain('.lux-social-system-message');
        expect(bare).toContain('.social-neo-group-thread-toolbar.is-compact');
        expect(bare).toContain('.social-neo-group-conversation-switcher');
        expect(bare).toContain('.social-neo-group-conversation-menu');
        expect(bare).toContain('.social-neo-search-bar-input');
        expect(bare).toContain('.social-neo-thread-head__banner');
        expect(bare).toMatch(/\.social-neo-thread-head\.is-group,\s*\nbody\.lux-route-social[^\n]*\.social-neo-thread-head\.is-direct/);
    });

    it('unifies direct and group thread chrome in messages shell', () => {
        const messages = readSource('assets/js/pages/social-messages.js');
        expect(messages).toContain('is-direct');
        expect(messages).toContain('thread-head__meta');
        expect(messages).toContain('renderThreadToolbar');
        expect(messages).toContain('chat-conversation-menu-toggle');
        expect(messages).toContain('chat-conversation-rename-open');
        expect(messages).toContain('dialog-group-conversation-rename');
        expect(messages).toContain('lux-social-system-message');
        expect(messages).toContain('lux-picker-btn lux-picker-btn--compact');
        expect(messages).toContain('lux-picker-panel lux-universal-picker-panel lux-droplist-panel lux-picker-panel-scrollport is-open');
        expect(messages).toContain('lux-picker-option');
        expect(messages).toContain('chat-conversation-create-open');
        expect(messages).toContain('group-conversation-option__badge');
        expect(messages).toContain('buildMessagesInboxEntries');
        expect(messages).toContain('searchGroupMessages(chat, searchQuery)');
        expect(messages).not.toMatch(/isGroupThread \? searchGroupMessages/);
        expect(messages).toContain('social-neo-message__sender');
        expect(messages).toMatch(/renderDirectCallHint/);
        expect(messages).toMatch(/!ui\.callOpen \|\| !ui\.callOverlayMinimized/);
        expect(messages).not.toMatch(/!runtime\.ui\?\.callOpen \|\| runtime\.ui\?\.callOverlayMinimized/);
    });

    it('supports direct thread panel dialogs in groups module', () => {
        const groups = readSource('assets/js/pages/social-groups.js');
        expect(groups).toContain('isDirectThread');
        expect(groups).toContain('chatNotificationPreference');
        expect(groups).toContain('group-create-with-peer');
        expect(groups).toContain('chat-thread-notify');
        expect(groups).not.toMatch(/if \(!panelChat \|\| !panelGroup\) return ''/);
    });

    it('hydrate deferred fetch includes chat member ids', () => {
        const runtime = readSource('assets/js/shared/social-runtime-lite.js');
        expect(runtime).toMatch(/runtime\.chats\.flatMap\(\(chat\) =>/);
    });

    it('renders video calls in a floating overlay with shared portal-call CSS', () => {
        const messages = readSource('assets/js/pages/social-messages.js');
        expect(messages).toContain('renderSocialCallOverlay');
        expect(messages).toContain('ensureSocialCallPortalCss');
        expect(messages).toContain('layout-portal.css');
        expect(messages).toContain('portal-call-window');
        expect(messages).toContain('portal-call-control');
        expect(messages).toContain('call-overlay-close');
        expect(messages).not.toMatch(/social-neo-dialog-backdrop/);
        expect(messages).toContain('lux-glass-dialog-backdrop');
        expect(messages).toContain('dialog-message-delete');
        expect(messages).toContain('finalizePortalMessengerCall');
        expect(messages).toContain('dismissSocialCallOverlay');
        expect(messages).toContain("callMode === 'outgoing'");
        expect(messages).toMatch(/displayName\(peer\) \|\| chatTitle\(chat\)/);
        const outgoingBlock = messages.match(/outgoing \? `[\s\S]*?` : `/)?.[0] || '';
        expect(outgoingBlock).toContain('call-end');
        expect(outgoingBlock).not.toContain('call-accept');
        const threadScrollBlock = messages.match(/social-neo-messages__thread-scroll[\s\S]*?social-neo-messages__composer/)?.[0] || '';
        expect(threadScrollBlock).not.toContain('portal-call-local-video');
        expect(threadScrollBlock).not.toContain('portal-call-remote-video');
        const bare = readSource('assets/css/lux-page-bare-lite.css');
        expect(bare).not.toContain('.social-neo-call-window');
        expect(bare).toContain('#social-neo-call-overlay.portal-call-overlay.is-minimized');
    });
});
