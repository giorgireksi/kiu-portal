import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social messages scroll regressions', () => {
    it('keeps inbox and thread scroll inside the messages panel on desktop', () => {
        const css = readSource('assets/css/social-rebuild.css');
        const page = readSource('assets/js/pages/social-page.js');
        const messages = readSource('assets/js/pages/social-messages.js');
        const html = readSource('social.html');

        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*#social-neo-center-region[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*#social-neo-center-region > \.social-neo-messages[\s\S]*flex:\s*1 1 auto/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*:is\([\s\S]*\.social-neo-chat-items[\s\S]*\.social-neo-messages__thread-scroll[\s\S]*overflow-y:\s*auto[\s\S]*min-height:\s*0/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*:is\([\s\S]*\.social-neo-messages__inbox[\s\S]*\.social-neo-chat-list[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-shell[\s\S]*flex-direction:\s*column/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-scroll[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/#social-neo-center-region:not\(:has\(\.social-neo-messages\)\)[\s\S]*\.social-neo-card[\s\S]*overflow:\s*visible/);
        expect(css).toMatch(/\.social-neo-messages\.is-group-rail-open[\s\S]*grid-template-columns:\s*minmax\(300px, 340px\) minmax\(0, 1fr\)/);
        expect(css).toMatch(/#social-neo-center-region:not\(:has\(\.social-neo-messages\)\)[\s\S]*\.social-neo-chat-items[\s\S]*overflow:\s*visible/);

        expect(page).toContain('function isSocialMessagesPanel(');
        expect(page).toContain('function isSocialInboxPanel(');
        expect(page).toContain("if (isSocialInboxPanel(host)) return false;");
        expect(page).toContain("if (isSocialInboxPanel(root())) return;");
        expect(page).toContain("'.social-neo-chat-items'");
        expect(page).toContain("'.social-neo-messages__thread-scroll'");
        expect(page).toMatch(/if \(center\.querySelector\('\.social-neo-messages'\) \|\| center\.querySelector\('\.sn-alerts-panel'\)\) return center\.clientHeight/);
        expect(page).toContain('const skipCenterForInbox = isSocialInboxPanel(host);');

        expect(messages).toContain('class="social-neo-chat-items"');
        expect(messages).toContain('social-neo-messages__thread-chrome');
        expect(messages).toContain('social-neo-messages__thread-scroll');
        expect(messages).toContain('social-neo-messages__thread-stream');
        expect(messages).toContain('social-neo-messages__composer');
        expect(messages).toContain('data-form="send-message"');

        expect(html).toContain('assets/css/social-rebuild.css?v=20260713-accentborder2');
        expect(html).toContain('assets/js/pages/social-page.js?v=20260713-groups-detail9');
    });
});