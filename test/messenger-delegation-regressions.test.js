import { describe, expect, it } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    const full = join(process.cwd(), relativePath);
    if (!existsSync(full)) return '';
    return readFileSync(full, 'utf8');
}

describe('messenger delegation regressions', () => {
    it('keeps the shared messenger chrome on delegated click, input, change, and drop handlers', () => {
        const source = readSource('assets/js/shared/messenger.js');
        const runtime = readSource('assets/js/shared/messenger-chrome-runtime.js');
        const css = readSource('assets/css/layout-portal.css');

        expect(source).toContain('function bindPortalMessengerDelegates()');
        expect(runtime).toContain('function handlePortalMessengerChromeClick(event)');
        expect(source).toContain('function handlePortalMessengerChromeInput(event)');
        expect(source).toContain('function handlePortalMessengerChromeChange(event)');
        expect(source).toContain('function handlePortalMessengerChromeDragOver(event)');
        expect(source).toContain('function handlePortalMessengerChromeDrop(event)');
        expect(source).toContain('data-portal-msg-click="open-direct-chat"');
        expect(source).toContain('data-portal-msg-click="open-chat"');
        expect(source).toContain('data-portal-msg-click="open-call"');
        expect(source).toContain('data-portal-msg-click="close-full"');
        expect(source).toContain('data-portal-msg-input="set-search"');
        expect(source).toContain('data-portal-msg-input="set-group-search"');
        expect(source).toContain('data-portal-msg-change="set-ptt-mode"');
        expect(source).toContain('data-portal-msg-drop-chat="${activeChat.id}"');
        expect(source).toContain('class="portal-msg-bubble-meta-actions"');
        expect(source).toContain('class="portal-msg-request-actions"');
        expect(source).toContain('class="portal-notif-modal-actions"');
        expect(source).toContain('class="portal-call-remote-avatar${hasRemoteVideo ? \' is-hidden\' : \'\'}"');
        expect(source).not.toContain('portal-msg-fab-stack');
        expect(source).not.toContain('portal-notif-fab');
        expect(source).not.toContain('portal-notification-fab');
        expect(source).not.toContain("const style = document.createElement('style');");
        expect(source).not.toContain('style="display:flex; gap:8px; align-items:center;"');
        expect(source).not.toContain('style="padding:16px 16px 14px; border-bottom:1px solid #eef2f7;"');
        expect(source).not.toContain('style="padding:10px 14px; font-size:12px;"');
        expect(css).toContain('.portal-notif-modal-actions');
        expect(css).toContain('.portal-msg-request-actions');
        expect(css).toContain('.portal-msg-bubble-meta-actions');
        expect(css).toContain('.portal-call-remote-avatar.is-hidden');
        expect(css).not.toContain('.portal-msg-fab-stack');
        expect(css).not.toContain('.portal-notif-fab');
        expect(source).not.toContain('onclick=');
        expect(source).not.toContain('onchange=');
        expect(source).not.toContain('oninput=');
        expect(source).not.toContain('ondragover=');
        expect(source).not.toContain('ondrop=');
    });
});
