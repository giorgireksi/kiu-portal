import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('messenger delegation regressions', () => {
    it('keeps the shared messenger chrome on delegated click, input, change, and drop handlers', () => {
        const source = readSource('assets/js/shared/messenger.js');

        expect(source).toContain('function bindPortalMessengerDelegates()');
        expect(source).toContain('function handlePortalMessengerChromeClick(event)');
        expect(source).toContain('function handlePortalMessengerChromeInput(event)');
        expect(source).toContain('function handlePortalMessengerChromeChange(event)');
        expect(source).toContain('function handlePortalMessengerChromeDragOver(event)');
        expect(source).toContain('function handlePortalMessengerChromeDrop(event)');
        expect(source).toContain('data-portal-msg-click="open-direct-chat"');
        expect(source).toContain('data-portal-msg-click="open-chat"');
        expect(source).toContain('data-portal-msg-click="open-call"');
        expect(source).toContain('data-portal-msg-click="toggle-dock"');
        expect(source).toContain('data-portal-msg-input="set-search"');
        expect(source).toContain('data-portal-msg-input="set-group-search"');
        expect(source).toContain('data-portal-msg-change="set-ptt-mode"');
        expect(source).toContain('data-portal-msg-drop-chat="${activeChat.id}"');
        expect(source).not.toContain('onclick=');
        expect(source).not.toContain('onchange=');
        expect(source).not.toContain('oninput=');
        expect(source).not.toContain('ondragover=');
        expect(source).not.toContain('ondrop=');
    });
});
