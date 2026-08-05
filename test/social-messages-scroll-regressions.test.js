import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

function readSource(relativePath) {
    return readFileSync(join(process.cwd(), relativePath), 'utf8');
}

describe('social-messages-scroll-regressions.test (bare-shell era)', () => {
    it('social paint CSS removed', () => {
        expect(existsSync(join(process.cwd(), 'assets/css/social-rebuild.css'))).toBe(false);
    });

    it('keeps inbox and thread scroll inside the messages panel on desktop', () => {
        const css = readSource('assets/css/lux-page-bare-lite.css');
        const shell = readSource('assets/js/pages/social-page-shell-runtime.js');
        const messages = readSource('assets/js/pages/social-messages.js');

        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*#social-neo-center-region[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/social-neo-scroll-lock[\s\S]*\[data-panel="messages"\][\s\S]*#social-neo-center-region > \.social-neo-messages[\s\S]*flex:\s*1 1 0%/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-chat-items[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-scroll[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__inbox[\s\S]*\.social-neo-chat-list[\s\S]*overflow:\s*hidden/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-shell[\s\S]*flex-direction:\s*column/);
        expect(css).toMatch(/\[data-panel="messages"\][\s\S]*\.social-neo-messages__thread-scroll[\s\S]*overflow-y:\s*auto/);
        expect(css).toMatch(/\.social-neo-messages\.is-group-rail-open[\s\S]*grid-template-columns:\s*minmax\(300px, 340px\) minmax\(0, 1fr\)/);

        expect(shell).toContain('.social-neo-chat-items');
        expect(shell).toContain('.social-neo-messages__thread-scroll');

        expect(messages).toContain('class="social-neo-chat-items"');
        expect(messages).toContain('social-neo-messages__thread-chrome');
        expect(messages).toContain('social-neo-messages__thread-scroll');
        expect(messages).toContain('social-neo-messages__thread-stream');
        expect(messages).toContain('social-neo-messages__composer');
        expect(messages).toContain('data-form="send-message"');
    });
});
